// API endpoints for individual pipeline stage operations (update, delete)

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';

// PATCH - Update a pipeline stage
export async function PATCH(
  request: NextRequest,
  { params }: { params: { stageId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update pipeline stages
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update pipeline stages' },
        { status: 403 }
      );
    }

    const stageId = parseInt(params.stageId, 10);
    const body = await request.json();
    const {
      name,
      description,
      stageOrder,
      probability,
      autoAssignToId,
      autoCreateTask,
      taskTemplate,
      isActive,
    } = body;

    // Check if stage exists
    const existingStage = await vyntrizeDb.pipelineStage.findUnique({
      where: { id: stageId },
    });

    if (!existingStage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (stageOrder !== undefined) {
      // Check if new order conflicts with another stage
      if (stageOrder !== existingStage.stageOrder) {
        const conflictingStage = await vyntrizeDb.pipelineStage.findUnique({
          where: { stageOrder },
        });
        if (conflictingStage) {
          return NextResponse.json(
            { error: 'A stage with this order already exists' },
            { status: 400 }
          );
        }
      }
      updateData.stageOrder = stageOrder;
    }

    if (probability !== undefined) {
      updateData.probability = probability;
    }

    if (autoAssignToId !== undefined) {
      updateData.autoAssignToId = autoAssignToId || null;
    }

    if (autoCreateTask !== undefined) {
      updateData.autoCreateTask = autoCreateTask;
    }

    if (taskTemplate !== undefined) {
      updateData.taskTemplate = taskTemplate;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedStage = await vyntrizeDb.pipelineStage.update({
      where: { id: stageId },
      data: updateData,
      include: {
        autoAssignTo: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ stage: updatedStage });
  } catch (error) {
    console.error('Error updating pipeline stage:', error);
    return NextResponse.json(
      { error: 'Failed to update pipeline stage' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pipeline stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: { stageId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete pipeline stages
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete pipeline stages' },
        { status: 403 }
      );
    }

    const stageId = parseInt(params.stageId, 10);

    // Check if stage exists
    const existingStage = await vyntrizeDb.pipelineStage.findUnique({
      where: { id: stageId },
    });

    if (!existingStage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    await vyntrizeDb.pipelineStage.delete({
      where: { id: stageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pipeline stage:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline stage' },
      { status: 500 }
    );
  }
}
