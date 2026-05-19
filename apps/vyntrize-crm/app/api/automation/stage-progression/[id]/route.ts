/**
 * Automation API — Stage Progression Rule by ID
 * PUT    /api/automation/stage-progression/[id]  — update rule
 * DELETE /api/automation/stage-progression/[id]  — delete rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { stageProgressionRulePayloadSchema } from '@/lib/automation';

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

    const existing = await vyntrizeDb.stageProgressionRule.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const body = await request.json();

    const parsed = stageProgressionRulePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.fromStage === parsed.data.toStage) {
      return NextResponse.json(
        { error: 'fromStage and toStage must be different' },
        { status: 400 }
      );
    }

    const rule = await vyntrizeDb.stageProgressionRule.update({
      where: { id },
      data: {
        fromStage: parsed.data.fromStage,
        toStage: parsed.data.toStage,
        criteria: parsed.data.criteria,
        autonomyLevel: parsed.data.autonomyLevel,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('[Automation API] Error updating stage progression rule:', error);
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

    const existing = await vyntrizeDb.stageProgressionRule.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    await vyntrizeDb.stageProgressionRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Automation API] Error deleting stage progression rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
