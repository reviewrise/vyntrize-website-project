// API endpoints for task management (CRUD)

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';

// GET - Fetch tasks with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const overdue = searchParams.get('overdue') === 'true';

    // Build where clause
    const where: any = {};

    if (leadId) {
      where.leadId = leadId;
    }

    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (overdue) {
      where.dueDate = {
        lt: new Date(),
      };
      where.status = {
        notIn: ['COMPLETED', 'CANCELLED'],
      };
    }

    const tasks = await vyntrizeDb.leadTask.findMany({
      where,
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
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, title, description, assignedToId, priority, dueDate } = body;

    if (!leadId || !title) {
      return NextResponse.json(
        { error: 'Lead ID and title are required' },
        { status: 400 }
      );
    }

    const task = await vyntrizeDb.leadTask.create({
      data: {
        leadId,
        title: title.trim(),
        description: description?.trim() || null,
        assignedToId: assignedToId || null,
        createdById: session.userId,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
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

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
