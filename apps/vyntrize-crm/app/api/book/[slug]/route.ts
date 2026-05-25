import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import { emitCalendarEventCreated } from '@/lib/agents/event-emitter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { firstName, lastName, email, startTime, endTime, notes } = body;

    if (!firstName || !email || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Lookup user
    const user = await db.crmUser.findFirst({
      where: {
        OR: [
          { bookingSlug: slug },
          { id: slug }
        ]
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
      },
      create: {
        email,
        firstName,
        lastName: lastName || '',
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

    // 3. Create CalendarEvent
    const event = await db.calendarEvent.create({
      data: {
        title: `Meeting with ${firstName} ${lastName || ''}`,
        description: notes || 'Booked via public scheduling page.',
        startTime: start,
        endTime: end,
        userId: user.id,
        contactId: contact.id,
        leadId: lead.id,
      }
    });

    // 4. Emit event for AI agents
    if (lead.id) {
      await emitCalendarEventCreated(event.id, lead.id, contact.id, user.id);
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
