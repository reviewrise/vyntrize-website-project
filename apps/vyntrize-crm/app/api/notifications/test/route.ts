/**
 * DEV-ONLY: POST /api/notifications/test
 *
 * Creates a test notification for the currently logged-in user so you can
 * verify the bell badge, dropdown panel, SSE real-time delivery, and the
 * full notifications page without waiting for a real CRM event.
 *
 * Remove or gate behind NODE_ENV before going to production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notificationService } from '@/lib/notifications/notification-service';
import { NotificationEventType } from '@platform/vyntrize-db';

const SAMPLE_EVENTS = [
  {
    eventType: NotificationEventType.LEAD_CREATED,
    title:     'New lead: John Smith (Acme Corp)',
    body:      'A new lead has been assigned to you.',
    entityType: 'lead',
    entityId:   'test-lead-id',
  },
  {
    eventType: NotificationEventType.STAGE_CHANGED,
    title:     'Lead moved: New → Qualified',
    body:      'Sarah Connor moved from New to Qualified.',
    entityType: 'lead',
    entityId:   'test-lead-id-2',
  },
  {
    eventType: NotificationEventType.TASK_CREATED,
    title:     'New task assigned: Follow-up call',
    body:      'You have been assigned a new task.',
    entityType: 'task',
    entityId:   '42',
  },
  {
    eventType: NotificationEventType.AGENT_ACTION_PENDING,
    title:     'Agent action requires review',
    body:      'An AI agent has drafted an email and is awaiting your approval.',
  },
  {
    eventType: NotificationEventType.MEETING_MISSED,
    title:     'Meeting missed: Product demo',
    body:      'The scheduled meeting did not take place.',
  },
] as const;

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const session = await getSession();
  if (!session?.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Accept an optional body to specify which event type
  let body: { eventType?: string } = {};
  try { body = await request.json(); } catch { /* empty body is fine */ }

  const sample = body.eventType
    ? SAMPLE_EVENTS.find((e) => e.eventType === body.eventType) ?? SAMPLE_EVENTS[0]
    : SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)];

  // Try writing directly via prisma to isolate whether the issue is in the service or DB
  let directWriteResult = 'not attempted';
  try {
    const { prisma } = await import('@/lib/prisma');
    const { NotificationChannel } = await import('@platform/vyntrize-db');
    const direct = await prisma.notification.create({
      data: {
        userId:     session.userId as string,
        eventType:  sample.eventType,
        title:      `[DIRECT] ${sample.title}`,
        channel:    NotificationChannel.IN_APP,
        isRead:     false,
        isDismissed: false,
      },
    });
    directWriteResult = `success: id=${direct.id}`;
  } catch (err: unknown) {
    directWriteResult = `failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  await notificationService.createNotification({
    userId:     session.userId as string,
    eventType:  sample.eventType,
    title:      sample.title,
    body:       sample.body,
    entityType: 'entityType' in sample ? sample.entityType : undefined,
    entityId:   'entityId'   in sample ? sample.entityId   : undefined,
    isSeedOrTest: true,
  });

  // Verify the record count
  const { prisma: p2 } = await import('@/lib/prisma');
  const count = await p2.notification.count({
    where: { userId: session.userId as string },
  });

  return NextResponse.json({ ok: true, created: sample.title, totalInDb: count, directWriteResult });
}
