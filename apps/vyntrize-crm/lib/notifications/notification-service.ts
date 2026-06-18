import {
  NotificationEventType,
  NotificationChannel,
  Notification,
  NotificationPreference,
  CrmRole,
} from '@platform/vyntrize-db';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/email-service';
import { smsService } from '@/lib/sms/sms-service';
import { sseStreamManager } from './sse-stream-manager';

// ─── HTML escape helper (prevents XSS in email bodies) ───────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// ─── Input / Result types ────────────────────────────────────────────────────

export interface CreateNotificationInput {
  userId: string;
  eventType: NotificationEventType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  isSeedOrTest?: boolean;
}

export interface PreferenceInput {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  isEnabled: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface CleanupResult {
  /** isDismissed notifications older than 30 days */
  dismissedOld: number;
  /** isRead notifications older than 90 days */
  readOld: number;
  /** any notification older than 180 days regardless of state */
  ancient: number;
}

// ─── Error types ─────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ─── Entity route map (mirrors notification-icons.ts on the client) ──────────

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  lead:           (id) => `/leads/${id}`,
  task:           (id) => `/leads?taskId=${id}`,
  calendar_event: (id) => `/calendar?eventId=${id}`,
  agent_action:   (id) => `/agents?actionId=${id}`,
};

// ─── Service class ────────────────────────────────────────────────────────────

class NotificationService {

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Return true when the user has the specified channel enabled for the given
   * event type, or when no preference row exists and the channel default is true.
   *
   * Default values (no row present):
   *   IN_APP → true
   *   EMAIL  → false
   *   SMS    → false
   */
  private async isEnabled(
    userId: string,
    eventType: NotificationEventType,
    channel: NotificationChannel,
  ): Promise<boolean> {
    try {
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId_eventType_channel: { userId, eventType, channel } },
      });
      if (pref !== null) return pref.isEnabled;
      // No row — apply defaults
      if (channel === NotificationChannel.IN_APP) return true;
      return false; // EMAIL and SMS default to false
    } catch (err) {
      console.error('[NotificationService] isEnabled query failed:', err);
      // Fail open for IN_APP, fail closed for others
      return channel === NotificationChannel.IN_APP;
    }
  }

  /** Query all active CrmUser IDs with role=ADMIN. */
  private async getAdminUserIds(): Promise<string[]> {
    const admins = await prisma.crmUser.findMany({
      where: { role: CrmRole.ADMIN, isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  /** Build a simple HTML body for notification emails. */
  private buildNotificationEmailHtml(input: CreateNotificationInput): string {
    const bodyText = input.body ?? input.title;
    const crmBase  = process.env.NEXT_PUBLIC_CRM_URL ?? 'https://crm.vyntrize.com';

    let entitySection = '';
    if (input.entityType && input.entityId) {
      const routeFn = ENTITY_ROUTES[input.entityType];
      if (routeFn) {
        const url = `${crmBase}${routeFn(input.entityId)}`;
        entitySection = `
          <div style="margin-top:24px">
            <a href="${url}"
               style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;
                      padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
              View in CRM →
            </a>
          </div>`;
      }
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;
              border:1px solid #e5e7eb;overflow:hidden">
    <!-- Header bar -->
    <div style="background:#6366f1;height:4px"></div>
    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;
                letter-spacing:0.05em;color:#6366f1">Vyntrize CRM</p>
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;line-height:1.3">
        ${escapeHtml(input.title)}
      </h1>
      ${input.body
        ? `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
             ${escapeHtml(input.body)}
           </p>`
        : ''}
      ${entitySection}
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        You're receiving this because you have email notifications enabled in Vyntrize CRM.
        <a href="${crmBase}/notifications" style="color:#6366f1">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  /** Build a compact SMS message (≤160 chars). */
  private buildSmsMessage(input: CreateNotificationInput): string {
    const crmBase = process.env.NEXT_PUBLIC_CRM_URL ?? 'https://crm.vyntrize.com';

    // Build entity link if available — use short path
    let link = '';
    if (input.entityType && input.entityId) {
      const routeFn = ENTITY_ROUTES[input.entityType];
      if (routeFn) link = ` ${crmBase}${routeFn(input.entityId)}`;
    }

    // Compose message, truncating title if needed to stay within 1600 chars
    const prefix  = 'Vyntrize: ';
    const suffix  = link;
    const budget  = 1600 - prefix.length - suffix.length - 3; // 3 for ' — '
    const title   = input.title.length > budget
      ? input.title.slice(0, budget - 1) + '…'
      : input.title;

    return link
      ? `${prefix}${title} —${suffix}`
      : `${prefix}${title}`;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Create a notification and deliver it via all enabled channels.
   * Never throws — all errors are caught and logged.
   */
  async createNotification(input: CreateNotificationInput): Promise<void> {
    try {
      // 1. Check IN_APP preference — skip silently if disabled
      const inAppEnabled = await this.isEnabled(input.userId, input.eventType, NotificationChannel.IN_APP);
      if (!inAppEnabled) return;

      // 2. Write the notification record
      const notification = await prisma.notification.create({
        data: {
          userId:      input.userId,
          eventType:   input.eventType,
          title:       input.title,
          body:        input.body,
          entityType:  input.entityType,
          entityId:    input.entityId,
          channel:     NotificationChannel.IN_APP,
          isRead:      false,
          isDismissed: false,
        },
      });

      // 3. Push to any open SSE connections
      try {
        sseStreamManager.push(input.userId, notification as Notification);
      } catch (sseErr) {
        console.warn('[NotificationService] SSE push failed:', sseErr);
      }

      // 4. Conditionally send email
      if (!input.isSeedOrTest) {
        try {
          const emailEnabled = await this.isEnabled(input.userId, input.eventType, NotificationChannel.EMAIL);
          const smsEnabled   = await this.isEnabled(input.userId, input.eventType, NotificationChannel.SMS);

          // Only fetch user if at least one external channel is enabled
          if (emailEnabled || smsEnabled) {
            const user = await prisma.crmUser.findUnique({
              where:  { id: input.userId },
              select: { email: true, phone: true },
            });

            // ── Email ────────────────────────────────────────────────────────
            if (emailEnabled) {
              if (user?.email) {
                const result = await emailService.sendEmail({
                  to:      user.email,
                  subject: input.title,
                  html:    this.buildNotificationEmailHtml(input),
                  role:    'admin',
                });
                if (!result.success) {
                  console.error('[NotificationService] Email delivery failed:', result.error);
                }
              } else {
                console.warn('[NotificationService] Email enabled but user has no email address:', input.userId);
              }
            }

            // ── SMS ──────────────────────────────────────────────────────────
            if (smsEnabled) {
              if (user?.phone) {
                const result = await smsService.sendSms({
                  to:           user.phone,
                  content:      this.buildSmsMessage(input),
                  isSeedOrTest: false,
                });
                if (!result.success) {
                  console.error('[NotificationService] SMS delivery failed:', result.error);
                }
              } else {
                console.warn('[NotificationService] SMS enabled but user has no phone number:', input.userId);
              }
            }
          }
        } catch (deliveryErr) {
          console.error('[NotificationService] Channel delivery error:', deliveryErr);
        }
      }
    } catch (err) {
      console.error('[NotificationService] createNotification failed:', err);
    }
  }

  /**
   * Create notifications for all active admin users.
   * Deduplicates so admins who are also the assigned user receive only one notification.
   * The caller is responsible for also calling createNotification for the assigned user
   * before calling this — this method skips any userId already covered.
   */
  async createNotificationsForAdmins(
    input: Omit<CreateNotificationInput, 'userId'>,
    excludeUserIds: string[] = [],
  ): Promise<void> {
    try {
      const adminIds = await this.getAdminUserIds();
      const targets = adminIds.filter((id) => !excludeUserIds.includes(id));
      await Promise.all(targets.map((userId) => this.createNotification({ ...input, userId })));
    } catch (err) {
      console.error('[NotificationService] createNotificationsForAdmins failed:', err);
    }
  }

  /**
   * Paginated list of non-dismissed notifications, newest first.
   */
  async getNotifications(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<Notification>> {
    const skip = (page - 1) * pageSize;
    const where = { userId, isDismissed: false };

    const [data, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: data as Notification[],
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      page,
      pageSize,
    };
  }

  /** Count of non-dismissed, unread notifications for a user. */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isDismissed: false, isRead: false },
    });
  }

  /**
   * Set isRead=true and readAt=now() for a single notification owned by userId.
   * Throws NotFoundError if not found or not owned.
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data:  { isRead: true, readAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundError(`Notification ${notificationId} not found for user ${userId}`);
    }
  }

  /** Mark all unread, non-dismissed notifications as read for a user. */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false, isDismissed: false },
      data:  { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Set isDismissed=true for a single notification owned by userId.
   * Throws NotFoundError if not found or not owned.
   */
  async dismiss(notificationId: string, userId: string): Promise<void> {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data:  { isDismissed: true },
    });
    if (result.count === 0) {
      throw new NotFoundError(`Notification ${notificationId} not found for user ${userId}`);
    }
  }

  /** Dismiss all non-dismissed notifications for a user. */
  async dismissAll(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isDismissed: false },
      data:  { isDismissed: true },
    });
  }

  /**
   * Return all preference rows for a user.
   * Missing rows are not created — callers apply defaults (IN_APP=true, EMAIL=false).
   */
  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    return prisma.notificationPreference.findMany({ where: { userId } }) as Promise<NotificationPreference[]>;
  }

  /**
   * Upsert an array of preference inputs for a user (max 100 per call).
   */
  async upsertPreferences(userId: string, prefs: PreferenceInput[]): Promise<void> {
    await prisma.$transaction(
      prefs.map((p) =>
        prisma.notificationPreference.upsert({
          where:  { userId_eventType_channel: { userId, eventType: p.eventType, channel: p.channel } },
          create: { userId, eventType: p.eventType, channel: p.channel, isEnabled: p.isEnabled },
          update: { isEnabled: p.isEnabled },
        }),
      ),
    );
  }

  /**
   * Run the three retention cleanup rules and return deleted counts per rule.
   */
  async runCleanup(): Promise<CleanupResult> {
    const now = new Date();
    const d30  = new Date(now.getTime() - 30  * 24 * 60 * 60 * 1000);
    const d90  = new Date(now.getTime() - 90  * 24 * 60 * 60 * 1000);
    const d180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    let dismissedOld = 0;
    let readOld      = 0;
    let ancient      = 0;

    // Rule 1: isDismissed rows older than 30 days
    try {
      const r1 = await prisma.notification.deleteMany({
        where: { isDismissed: true, createdAt: { lt: d30 } },
      });
      dismissedOld = r1.count;
      console.info(`[NotificationService] Cleanup rule 1 (dismissed >30d): deleted ${dismissedOld}`);
    } catch (err) {
      console.error('[NotificationService] Cleanup rule 1 failed:', err);
      return { dismissedOld, readOld, ancient };
    }

    // Rule 2: isRead rows older than 90 days
    try {
      const r2 = await prisma.notification.deleteMany({
        where: { isRead: true, createdAt: { lt: d90 } },
      });
      readOld = r2.count;
      console.info(`[NotificationService] Cleanup rule 2 (read >90d): deleted ${readOld}`);
    } catch (err) {
      console.error('[NotificationService] Cleanup rule 2 failed:', err);
      return { dismissedOld, readOld, ancient };
    }

    // Rule 3: any row older than 180 days
    try {
      const r3 = await prisma.notification.deleteMany({
        where: { createdAt: { lt: d180 } },
      });
      ancient = r3.count;
      console.info(`[NotificationService] Cleanup rule 3 (any >180d): deleted ${ancient}`);
    } catch (err) {
      console.error('[NotificationService] Cleanup rule 3 failed:', err);
      return { dismissedOld, readOld, ancient };
    }

    return { dismissedOld, readOld, ancient };
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const notificationService = new NotificationService();
