import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = parseInt(resolvedParams.taskId, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const task = await prisma.leadTask.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status === 'COMPLETED' || task.status === 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Task is already processed or processing' }, { status: 400 });
    }
    
    if (task.taskType === 'MANUAL') {
        return NextResponse.json({ error: 'Cannot auto-approve a MANUAL task. Resolve it first.' }, { status: 400 });
    }

    // Optional: User may have edited the draft payload before approving
    let payloadOverride: Record<string, unknown> | undefined;
    try {
      const body = await request.json();
      if (body?.payload && typeof body.payload === 'object') {
        payloadOverride = body.payload;
      }
    } catch {
      // No body or invalid JSON — that's fine, use original payload
    }

    // 1. Update status to IN_PROGRESS, and save edited payload if provided
    const updatedTask = await prisma.leadTask.update({
      where: { id: taskId },
      data: {
        status: 'IN_PROGRESS',
        ...(payloadOverride ? { payload: payloadOverride } : {}),
      },
    });

    // 2. Emit the TASK_APPROVED event so the TaskExecutionAgent can pick it up
    eventBus.emit(CRMEvent.TASK_APPROVED, { 
      leadId: task.leadId, 
      taskId: task.id 
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('[API /crm/tasks/[taskId]/approve] error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
