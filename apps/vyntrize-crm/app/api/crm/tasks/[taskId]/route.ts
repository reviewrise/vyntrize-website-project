// API endpoints for individual task operations (update, delete)

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

// PATCH - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId: taskIdStr } = await params;
    const taskId = parseInt(taskIdStr, 10);
    const body = await request.json();
    const { title, description, assignedToId, priority, status, dueDate } = body;

    // Check if task exists
    const existingTask = await vyntrizeDb.leadTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      if (title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (status !== undefined) {
      updateData.status = status;
      // Set completedAt when marking as completed
      if (status === 'COMPLETED' && !existingTask.completedAt) {
        updateData.completedAt = new Date();
      }
      // Clear completedAt when reopening
      if (status !== 'COMPLETED' && existingTask.completedAt) {
        updateData.completedAt = null;
      }
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedTask = await vyntrizeDb.leadTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            title: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED' && updatedTask.leadId) {
      await eventBus.emitCRMEvent(CRMEvent.TASK_COMPLETED, {
        leadId: updatedTask.leadId,
        previousValue: existingTask.status,
        newValue: 'COMPLETED',
        metadata: { taskId: updatedTask.id, taskTitle: updatedTask.title },
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId: taskIdStr } = await params;
    const taskId = parseInt(taskIdStr, 10);

    // Check if task exists
    const existingTask = await vyntrizeDb.leadTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only allow creator or admin to delete
    if (existingTask.createdById !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only delete tasks you created' },
        { status: 403 }
      );
    }

    await vyntrizeDb.leadTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
