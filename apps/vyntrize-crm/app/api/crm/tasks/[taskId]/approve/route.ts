import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventBus, CRMEvent } from '@/lib/agents/event-bus';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = parseInt(params.taskId, 10);
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

    // 1. Update status to IN_PROGRESS
    const updatedTask = await prisma.leadTask.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' }
    });

    // 2. Emit the TASK_APPROVED event so the TaskExecutionAgent can pick it up
    EventBus.emit(CRMEvent.TASK_APPROVED, { 
      leadId: task.leadId, 
      taskId: task.id 
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('[API /crm/tasks/[taskId]/approve] error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
