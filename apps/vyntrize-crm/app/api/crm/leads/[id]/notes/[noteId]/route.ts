// API endpoints for individual note operations (update, delete)

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';

// PATCH - Update a note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId, noteId: noteIdStr } = await params;
    const noteId = parseInt(noteIdStr, 10);
    const body = await request.json();
    const { note, isPinned } = body;

    // Check if note exists and belongs to the lead
    const existingNote = await vyntrizeDb.leadNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existingNote.leadId !== leadId) {
      return NextResponse.json({ error: 'Note does not belong to this lead' }, { status: 403 });
    }

    // Update note
    const updateData: any = {};
    if (note !== undefined) {
      if (note.trim().length === 0) {
        return NextResponse.json(
          { error: 'Note content cannot be empty' },
          { status: 400 }
        );
      }
      updateData.note = note.trim();
    }
    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }

    const updatedNote = await vyntrizeDb.leadNote.update({
      where: { id: noteId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId, noteId: noteIdStr } = await params;
    const noteId = parseInt(noteIdStr, 10);

    // Check if note exists and belongs to the lead
    const existingNote = await vyntrizeDb.leadNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existingNote.leadId !== leadId) {
      return NextResponse.json({ error: 'Note does not belong to this lead' }, { status: 403 });
    }

    // Only allow users to delete their own notes, or admins can delete any
    if (existingNote.userId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only delete your own notes' },
        { status: 403 }
      );
    }

    await vyntrizeDb.leadNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
