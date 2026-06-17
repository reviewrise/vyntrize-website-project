import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notificationService } from '@/lib/notifications/notification-service';

// PATCH /api/notifications/read-all — mark all unread non-dismissed notifications as read
export async function PATCH() {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await notificationService.markAllAsRead(session.userId as string);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[PATCH /api/notifications/read-all] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
