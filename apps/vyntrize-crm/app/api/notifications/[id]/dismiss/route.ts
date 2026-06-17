import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notificationService, NotFoundError } from '@/lib/notifications/notification-service';

// PATCH /api/notifications/[id]/dismiss — dismiss one notification
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await notificationService.dismiss(id, session.userId as string);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    console.error('[PATCH /api/notifications/[id]/dismiss] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
