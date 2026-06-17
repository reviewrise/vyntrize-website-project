import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notificationService } from '@/lib/notifications/notification-service';

// PATCH /api/notifications/dismiss-all — dismiss all non-dismissed notifications
export async function PATCH() {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await notificationService.dismissAll(session.userId as string);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[PATCH /api/notifications/dismiss-all] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
