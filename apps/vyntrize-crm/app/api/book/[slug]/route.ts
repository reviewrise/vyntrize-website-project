import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import { emitCalendarEventCreated } from '@/lib/agents/event-emitter';
import { syncEventToGoogle } from '@/lib/google-calendar';
import crypto from 'crypto';
import { sendBookingConfirmation } from '@/lib/email';
import { sendCustomerSms }         from '@/lib/sms/send-customer-sms';
import { buildBookingConfirmationSms } from '@/lib/sms/booking-sms';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { firstName, lastName, email, phone, startTime, endTime, notes } = body;

    if (!firstName || !email || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Lookup user and booking settings
    const user = await db.crmUser.findFirst({
      where: {
        OR: [
          { bookingSlug: slug },
          { id: slug }
        ]
      },
      include: {
        bookingSettings: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Double check availability (simple overlap check)
    const overlapping = await db.calendarEvent.findFirst({
      where: {
        userId: user.id,
        startTime: { lt: end },
        endTime: { gt: start }
      }
    });

    if (overlapping) {
      return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 409 });
    }

    // 1. Create or update Contact
    const contact = await db.contact.upsert({
      where: { email },
      update: {
        firstName,
        lastName: lastName || '',
        ...(phone ? { phone } : {}),
      },
      create: {
        email,
        firstName,
        lastName: lastName || '',
        ...(phone ? { phone } : {}),
      }
    });

    // 2. Create Lead (or find existing active lead)
    let lead = await db.lead.findFirst({
      where: {
        contactId: contact.id,
        stage: { notIn: ['WON', 'LOST'] }
      }
    });

    if (!lead) {
      lead = await db.lead.create({
        data: {
          title: `Consultation: ${firstName} ${lastName || ''}`,
          contactId: contact.id,
          stage: 'NEW',
          assigneeId: user.id,
          source: 'Public Booking Link'
        }
      });
    }

    // 3. Create CalendarEvent base (we need the ID for sync)
    const cancelToken = crypto.randomUUID();
    const rescheduleToken = crypto.randomUUID();
    
    let event = await db.calendarEvent.create({
      data: {
        title: `Meeting with ${firstName} ${lastName || ''}`,
        description: notes || 'Booked via public scheduling page.',
        startTime: start,
        endTime: end,
        userId: user.id,
        contactId: contact.id,
        leadId: lead.id,
        cancelToken,
        rescheduleToken,
      }
    });

    // 4. Sync to Google Calendar & generate Meet link
    const generateMeet = user.bookingSettings?.generateMeet ?? true;
    const googleSyncResult = await syncEventToGoogle(user.id, {
      title: event.title,
      description: event.description,
      startTime: start,
      endTime: end,
      isAllDay: false,
      generateMeetLink: generateMeet,
      attendees: [{ email }],
    });

    if (googleSyncResult) {
      event = await db.calendarEvent.update({
        where: { id: event.id },
        data: {
          externalId: googleSyncResult.id,
          meetLink: googleSyncResult.hangoutLink,
          syncedAt: new Date(),
        }
      });
    }

    // 5. Emit event for AI agents
    if (lead.id) {
      await emitCalendarEventCreated(event.id, lead.id, contact.id, user.id, event.title);
    }

    // 5. Send booking confirmation email
    await sendBookingConfirmation({
      toEmail: contact.email,
      contactName: `${contact.firstName} ${contact.lastName}`,
      expertName: user.displayName,
      expertEmail: user.email,
      startTime: event.startTime,
      endTime: event.endTime,
      meetLink: event.meetLink,
      cancelToken: event.cancelToken ?? '',
      rescheduleToken: event.rescheduleToken ?? ''
    });

    // 6. Send booking confirmation SMS (fire-and-forget — never blocks the response)
    if (contact.phone) {
      try {
        const crmBase = process.env.NEXT_PUBLIC_CRM_URL ?? 'https://crm.vyntrize.com';
        const smsMessage = buildBookingConfirmationSms({
          hostName:  user.displayName,
          startTime: event.startTime,
          meetLink:  event.meetLink ?? undefined,
          optOutUrl: `${crmBase}/api/sms/unsubscribe?phone=${encodeURIComponent(contact.phone)}`,
        });
        await sendCustomerSms({
          to:        contact.phone,
          message:   smsMessage,
          contactId: contact.id,
          leadId:    lead.id,
        });
      } catch (smsErr) {
        console.error('[book/slug] Booking SMS failed (non-fatal):', smsErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      event,
      meetLink: event.meetLink,
      cancelToken,
      rescheduleToken
    });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
