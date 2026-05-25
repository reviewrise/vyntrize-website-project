import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';
import { syncEventToGoogle, deleteEventFromGoogle } from '@/lib/google-calendar';
import { emitCalendarEventUpdated, emitCalendarEventDeleted, emitMeetingAttended, emitMeetingMissed } from '@/lib/agents/event-emitter';

// PATCH - Update a calendar event
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, location, startTime, endTime, isAllDay, status } = body;

    const existing = await vyntrizeDb.calendarEvent.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = await vyntrizeDb.calendarEvent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(isAllDay !== undefined && { isAllDay }),
        ...(status !== undefined && { status }),
      },
    });

    if (existing.externalId) {
      await syncEventToGoogle(session.userId, event, existing.externalId);
    }

    // Emit standard updated event
    if (event.leadId) {
      await emitCalendarEventUpdated(event.id, event.leadId, event.contactId || undefined, session.userId);
      
      // Emit specific meeting events if status changed
      if (status !== undefined && status !== existing.status) {
        if (status === 'ATTENDED') {
          await emitMeetingAttended(event.id, event.leadId, event.contactId || undefined, session.userId);
        } else if (status === 'MISSED') {
          await emitMeetingMissed(event.id, event.leadId, event.contactId || undefined, session.userId);
        }
      }
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE - Delete a calendar event
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await vyntrizeDb.calendarEvent.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existing.externalId) {
      await deleteEventFromGoogle(session.userId, existing.externalId);
    }

    await vyntrizeDb.calendarEvent.delete({ where: { id } });

    if (existing.leadId) {
      await emitCalendarEventDeleted(id, existing.leadId, existing.contactId || undefined, session.userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
