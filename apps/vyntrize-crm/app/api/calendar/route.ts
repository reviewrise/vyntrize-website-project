import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';
import { syncEventToGoogle } from '@/lib/google-calendar';
import { emitCalendarEventCreated } from '@/lib/agents/event-emitter';

// GET - Fetch calendar events for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const leadId = searchParams.get('leadId');

    const where: Record<string, unknown> = {
      userId: session.userId,
    };

    if (start && end) {
      where.startTime = { gte: new Date(start) };
      where.endTime = { lte: new Date(end) };
    }

    if (leadId) {
      where.leadId = leadId;
    }

    const events = await vyntrizeDb.calendarEvent.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST - Create a new calendar event
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, location, startTime, endTime, isAllDay, leadId, contactId } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    const event = await vyntrizeDb.calendarEvent.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isAllDay: isAllDay ?? false,
        userId: session.userId,
        leadId: leadId || null,
        contactId: contactId || null,
      },
    });

    // Try to sync with Google Calendar
    const googleSyncResult = await syncEventToGoogle(session.userId, event);
    
    if (googleSyncResult?.id) {
      const updateData: any = { externalId: googleSyncResult.id, syncedAt: new Date() };
      
      if (googleSyncResult.hangoutLink && !event.location) {
        updateData.location = googleSyncResult.hangoutLink;
        event.location = googleSyncResult.hangoutLink;
      }

      await vyntrizeDb.calendarEvent.update({
        where: { id: event.id },
        data: updateData,
      });
      event.externalId = googleSyncResult.id;
      event.syncedAt = new Date();
    }

    if (event.leadId) {
      await emitCalendarEventCreated(event.id, event.leadId, event.contactId || undefined, session.userId);
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
