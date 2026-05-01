// API endpoints for pipeline stages (CRUD)

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';

// GET - Fetch all pipeline stages
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const stages = await vyntrizeDb.pipelineStage.findMany({
      where,
      include: {
        autoAssignTo: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { stageOrder: 'asc' },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages' },
      { status: 500 }
    );
  }
}

// POST - Create a new pipeline stage
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create pipeline stages
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create pipeline stages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      stageOrder,
      probability,
      autoAssignToId,
      autoCreateTask,
      taskTemplate,
      isActive = true,
    } = body;

    if (!name || stageOrder === undefined) {
      return NextResponse.json(
        { error: 'Name and stage order are required' },
        { status: 400 }
      );
    }

    // Check if stage order already exists
    const existingStage = await vyntrizeDb.pipelineStage.findUnique({
      where: { stageOrder },
    });

    if (existingStage) {
      return NextResponse.json(
        { error: 'A stage with this order already exists' },
        { status: 400 }
      );
    }

    const stage = await vyntrizeDb.pipelineStage.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        stageOrder,
        probability: probability || 0,
        autoAssignToId: autoAssignToId || null,
        autoCreateTask: autoCreateTask || false,
        taskTemplate: taskTemplate || null,
        isActive,
      },
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

    return NextResponse.json({ stage }, { status: 201 });
  } catch (error) {
    console.error('Error creating pipeline stage:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline stage' },
      { status: 500 }
    );
  }
}
