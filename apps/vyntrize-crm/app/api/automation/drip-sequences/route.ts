/**
 * Automation API — Drip Sequences
 * GET  /api/automation/drip-sequences  — list sequences with step count and active enrollment count
 * POST /api/automation/drip-sequences  — create sequence with nested steps
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { dripSequencePayloadSchema } from '@/lib/automation';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sequences = await vyntrizeDb.dripSequence.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            steps: true,
            enrollments: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    const result = sequences.map((seq) => ({
      id: seq.id,
      name: seq.name,
      description: seq.description,
      triggerType: seq.triggerType,
      triggerConfig: seq.triggerConfig,
      stopConditions: seq.stopConditions,
      autonomyLevel: seq.autonomyLevel,
      isActive: seq.isActive,
      createdAt: seq.createdAt,
      updatedAt: seq.updatedAt,
      stepCount: seq._count.steps,
      activeEnrollmentCount: seq._count.enrollments,
    }));

    return NextResponse.json({ sequences: result });
  } catch (error) {
    console.error('[Automation API] Error listing drip sequences:', error);
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

    const parsed = dripSequencePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Reject if zero steps (also enforced by schema min(1), but explicit guard)
    if (!parsed.data.steps || parsed.data.steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one step is required' },
        { status: 400 }
      );
    }

    const sequence = await vyntrizeDb.dripSequence.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        triggerType: parsed.data.triggerType,
        triggerConfig: parsed.data.triggerConfig,
        stopConditions: parsed.data.stopConditions,
        autonomyLevel: parsed.data.autonomyLevel,
        isActive: parsed.data.isActive ?? true,
        steps: {
          create: parsed.data.steps.map((step) => ({
            stepOrder: step.stepOrder,
            delayHours: step.delayHours,
            subjectTemplate: step.subjectTemplate,
            bodyTemplate: step.bodyTemplate,
            branchCondition: step.branchCondition,
          })),
        },
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });

    return NextResponse.json({ sequence }, { status: 201 });
  } catch (error) {
    console.error('[Automation API] Error creating drip sequence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
