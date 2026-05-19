/**
 * Automation API — Stage Progression Rules
 * GET  /api/automation/stage-progression  — list all rules
 * POST /api/automation/stage-progression  — create a rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { stageProgressionRulePayloadSchema } from '@/lib/automation';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rules = await vyntrizeDb.stageProgressionRule.findMany({
      orderBy: [{ fromStage: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('[Automation API] Error listing stage progression rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const parsed = stageProgressionRulePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Extra guard: fromStage !== toStage (also enforced by schema refine)
    if (parsed.data.fromStage === parsed.data.toStage) {
      return NextResponse.json(
        { error: 'fromStage and toStage must be different' },
        { status: 400 }
      );
    }

    const rule = await vyntrizeDb.stageProgressionRule.create({
      data: {
        fromStage: parsed.data.fromStage,
        toStage: parsed.data.toStage,
        criteria: parsed.data.criteria,
        autonomyLevel: parsed.data.autonomyLevel,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('[Automation API] Error creating stage progression rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
