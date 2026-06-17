import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notificationService } from '@/lib/notifications/notification-service';

// GET /api/notifications — paginated list of non-dismissed notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

    const result = await notificationService.getNotifications(session.userId as string, page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
