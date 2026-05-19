/**
 * Automation API — Workflow Rule by ID
 * PUT    /api/automation/workflow-rules/[id]  — update rule
 * DELETE /api/automation/workflow-rules/[id]  — delete rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { workflowRulePayloadSchema } from '@/lib/automation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await vyntrizeDb.workflowRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Workflow rule not found' }, { status: 404 });
    }

    const body = await request.json();

    const parsed = workflowRulePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!parsed.data.triggerEvent) {
      return NextResponse.json(
        { error: 'At least one trigger event is required' },
        { status: 400 }
      );
    }

    if (!parsed.data.actions || parsed.data.actions.length === 0) {
      return NextResponse.json(
        { error: 'At least one action is required' },
        { status: 400 }
      );
    }

    const rule = await vyntrizeDb.workflowRule.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        triggerEvent: parsed.data.triggerEvent,
        conditions: parsed.data.conditions,
        actions: parsed.data.actions,
        autonomyLevel: parsed.data.autonomyLevel,
        isActive: parsed.data.isActive ?? true,
        priority: parsed.data.priority ?? 100,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('[Automation API] Error updating workflow rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await vyntrizeDb.workflowRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Workflow rule not found' }, { status: 404 });
    }

    await vyntrizeDb.workflowRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Automation API] Error deleting workflow rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
