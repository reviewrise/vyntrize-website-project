import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import { deleteEventFromGoogle } from '@/lib/google-calendar';
import { sendBookingCancellation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Cancel token is required' }, { status: 400 });
    }

    const event = await db.calendarEvent.findUnique({
      where: { cancelToken: token },
      include: {
        user: true,
        contact: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    if (event.cancelledAt) {
      return NextResponse.json({ error: 'This meeting is already cancelled.' }, { status: 400 });
    }

    // 1. Delete from Google Calendar
    if (event.externalId) {
      await deleteEventFromGoogle(event.userId, event.externalId);
    }

    // 2. Delete the booking from DB as requested
    await db.calendarEvent.delete({
      where: { id: event.id }
    });

    // 3. Send cancellation email (Phase 8)
    if (event.contact && event.user) {
      await sendBookingCancellation({
        toEmail: event.contact.email,
        contactName: `${event.contact.firstName} ${event.contact.lastName}`,
        expertName: event.user.displayName,
        expertEmail: event.user.email,
        startTime: event.startTime,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
