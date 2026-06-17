'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import {
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS,
  ENTITY_ROUTES,
  timeAgo,
  NotificationEventTypeValue,
} from './notification-icons';

// ─── Client-safe notification shape ──────────────────────────────────────────
// Mirrors the Prisma Notification model without importing @platform/vyntrize-db.
export interface ClientNotification {
  id:          string;
  userId:      string;
  eventType:   NotificationEventTypeValue;
  title:       string;
  body?:       string | null;
  entityType?: string | null;
  entityId?:   string | null;
  channel:     string;
  isRead:      boolean;
  isDismissed: boolean;
  readAt?:     Date | string | null;
  createdAt:   Date | string;
}

interface NotificationItemProps {
  notification: ClientNotification;
  onRead:    (id: string) => void;
  onDismiss: (id: string) => void;
}

export function NotificationItem({ notification, onRead, onDismiss }: NotificationItemProps) {
  const router  = useRouter();
  const Icon    = NOTIFICATION_ICONS[notification.eventType] ?? NOTIFICATION_ICONS['LEAD_CREATED'];
  const color   = NOTIFICATION_COLORS[notification.eventType] ?? '#6366f1';
  const bgColor = notification.isRead ? 'transparent' : `${color}08`;

  async function handleClick() {
    if (!notification.isRead) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' });
        onRead(notification.id);
      } catch {
        // best-effort; don't block navigation
      }
    }

    if (notification.entityType && notification.entityId) {
      const routeFn = ENTITY_ROUTES[notification.entityType];
      if (routeFn) router.push(routeFn(notification.entityId));
    }
  }

  async function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${notification.id}/dismiss`, { method: 'PATCH' });
      onDismiss(notification.id);
    } catch {
      // best-effort
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--color-surface-hover,rgba(0,0,0,0.04))]"
      style={{ backgroundColor: bgColor }}
    >
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}18` }}
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm leading-snug"
          style={{
            fontWeight: notification.isRead ? 400 : 600,
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary,#6b7280)]">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-xs text-[var(--color-text-tertiary,#9ca3af)]">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      <button
        aria-label="Dismiss notification"
        onClick={handleDismiss}
        className="ml-1 shrink-0 rounded p-1 text-[var(--color-text-tertiary,#9ca3af)] hover:text-[var(--color-text-secondary,#6b7280)] focus:outline-none focus-visible:ring-2"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
