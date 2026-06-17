import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notificationService } from '@/lib/notifications/notification-service';

// GET /api/notifications/unread-count
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await notificationService.getUnreadCount(session.userId as string);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('[GET /api/notifications/unread-count] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
