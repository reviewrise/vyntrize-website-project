/**
 * Automation API — Drip Sequence by ID
 * PUT    /api/automation/drip-sequences/[id]  — update sequence and replace steps
 * DELETE /api/automation/drip-sequences/[id]  — delete (409 if active enrollments unless force=true)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { dripSequencePayloadSchema } from '@/lib/automation';

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

    const existing = await vyntrizeDb.dripSequence.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Drip sequence not found' }, { status: 404 });
    }

    const body = await request.json();

    const parsed = dripSequencePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!parsed.data.steps || parsed.data.steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one step is required' },
        { status: 400 }
      );
    }

    // Replace steps: delete existing, create new ones in a transaction
    const sequence = await vyntrizeDb.$transaction(async (tx) => {
      // Delete all existing steps (cascade would handle this on sequence delete,
      // but we're updating so we do it explicitly)
      await tx.dripStep.deleteMany({ where: { sequenceId: id } });

      return tx.dripSequence.update({
        where: { id },
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
    });

    return NextResponse.json({ sequence });
  } catch (error) {
    console.error('[Automation API] Error updating drip sequence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await vyntrizeDb.dripSequence.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Drip sequence not found' }, { status: 404 });
    }

    // Check for active enrollments
    const activeEnrollmentCount = await vyntrizeDb.dripEnrollment.count({
      where: { sequenceId: id, status: 'ACTIVE' },
    });

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (activeEnrollmentCount > 0 && !force) {
      return NextResponse.json(
        {
          error: 'Cannot delete sequence with active enrollments',
          activeEnrollmentCount,
          hint: 'Add ?force=true to delete anyway',
        },
        { status: 409 }
      );
    }

    // Delete the sequence (steps cascade via onDelete: Cascade)
    await vyntrizeDb.dripSequence.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Automation API] Error deleting drip sequence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
