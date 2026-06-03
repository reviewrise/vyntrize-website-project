import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import { syncEventToGoogle, deleteEventFromGoogle } from '@/lib/google-calendar';
import crypto from 'crypto';
import { sendBookingConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { token, startTime, endTime } = await request.json();

    if (!token || !startTime || !endTime) {
      return NextResponse.json({ error: 'Token, start time, and end time are required' }, { status: 400 });
    }

    // Lookup existing event
    const existingEvent = await db.calendarEvent.findUnique({
      where: { rescheduleToken: token },
      include: {
        user: { include: { bookingSettings: true } },
        contact: true,
        lead: true,
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    if (existingEvent.cancelledAt) {
      return NextResponse.json({ error: 'This meeting is already cancelled.' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Double check availability for the new time
    const overlapping = await db.calendarEvent.findFirst({
      where: {
        userId: existingEvent.userId,
        startTime: { lt: end },
        endTime: { gt: start },
        cancelledAt: null,
        NOT: { id: existingEvent.id }
      }
    });

    if (overlapping) {
      return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 409 });
    }

    // 1. Mark old event as cancelled and delete from Google Calendar
    if (existingEvent.externalId) {
      await deleteEventFromGoogle(existingEvent.userId, existingEvent.externalId);
    }
    
    await db.calendarEvent.update({
      where: { id: existingEvent.id },
      data: {
        cancelledAt: new Date(),
        status: 'RESCHEDULED_AND_CANCELLED'
      }
    });

    // 2. Create new Event
    const cancelToken = crypto.randomUUID();
    const rescheduleToken = crypto.randomUUID();
    
    let newEvent = await db.calendarEvent.create({
      data: {
        title: existingEvent.title,
        description: existingEvent.description,
        startTime: start,
        endTime: end,
        userId: existingEvent.userId,
        contactId: existingEvent.contactId,
        leadId: existingEvent.leadId,
        cancelToken,
        rescheduleToken,
      }
    });

    // 3. Sync to Google Calendar & generate new Meet link
    const generateMeet = existingEvent.user.bookingSettings?.generateMeet ?? true;
    const googleSyncResult = await syncEventToGoogle(existingEvent.userId, {
      title: newEvent.title,
      description: newEvent.description,
      startTime: start,
      endTime: end,
      isAllDay: false,
      generateMeetLink: generateMeet,
      attendees: [{ email: existingEvent.contact?.email }],
    });

    if (googleSyncResult) {
      newEvent = await db.calendarEvent.update({
        where: { id: newEvent.id },
        data: {
          externalId: googleSyncResult.id,
          meetLink: googleSyncResult.hangoutLink,
          syncedAt: new Date(),
        }
      });
    }

    // 4. Send reschedule confirmation email (Phase 8)
    if (existingEvent.contact) {
      await sendBookingConfirmation({
        toEmail: existingEvent.contact.email,
        contactName: `${existingEvent.contact.firstName} ${existingEvent.contact.lastName}`,
        expertName: existingEvent.user.displayName,
        expertEmail: existingEvent.user.email,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        meetLink: newEvent.meetLink,
        cancelToken: newEvent.cancelToken ?? '',
        rescheduleToken: newEvent.rescheduleToken ?? ''
      });
    }

    return NextResponse.json({ 
      success: true, 
      event: newEvent,
      meetLink: newEvent.meetLink,
      cancelToken,
      rescheduleToken
    });
  } catch (error: any) {
    console.error('Reschedule error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
