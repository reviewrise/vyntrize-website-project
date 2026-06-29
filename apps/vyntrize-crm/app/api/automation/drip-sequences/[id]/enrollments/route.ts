/**
 * Automation API — Drip Sequence Enrollments
 * GET  /api/automation/drip-sequences/[id]/enrollments  — list active enrollments
 * POST /api/automation/drip-sequences/[id]/enrollments  — bulk enroll leads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { dripCampaignAgent } from '@/lib/agents/drip-campaign-agent';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const sequence = await vyntrizeDb.dripSequence.findUnique({ where: { id } });
    if (!sequence) {
      return NextResponse.json({ error: 'Drip sequence not found' }, { status: 404 });
    }

    const enrollments = await vyntrizeDb.dripEnrollment.findMany({
      where: { sequenceId: id, status: 'ACTIVE' },
      orderBy: { enrolledAt: 'desc' },
      include: {
        lead: {
          select: {
            id: true,
            title: true,
            contact: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sequence: {
          select: {
            steps: {
              select: { stepOrder: true, emailSubjectTemplate: true, smsBodyTemplate: true },
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
      },
    });

    const result = enrollments.map((enrollment) => {
      const contact = enrollment.lead.contact;
      const leadName = contact
        ? `${contact.firstName} ${contact.lastName}`.trim()
        : enrollment.lead.title;

      const currentStep = enrollment.sequence.steps.find(
        (s) => s.stepOrder === enrollment.currentStepIndex
      );

      return {
        id: enrollment.id,
        leadId: enrollment.leadId,
        leadName,
        leadTitle: enrollment.lead.title,
        currentStepIndex: enrollment.currentStepIndex,
        currentStepSubject: currentStep?.emailSubjectTemplate ?? currentStep?.smsBodyTemplate ?? null,
        totalSteps: enrollment.sequence.steps.length,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        lastEmailSentAt: enrollment.lastStepSentAt,
      };
    });

    return NextResponse.json({ enrollments: result });
  } catch (error) {
    console.error('[Automation API] Error listing drip enrollments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/automation/drip-sequences/[id]/enrollments
 * Body: { leadIds: string[] }
 * Bulk-enrolls the specified leads into the drip sequence.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: sequenceId } = await params;
    const body = await request.json();
    const leadIds: string[] = body.leadIds ?? [];

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds must be a non-empty array' }, { status: 400 });
    }

    const sequence = await vyntrizeDb.dripSequence.findUnique({ where: { id: sequenceId } });
    if (!sequence) {
      return NextResponse.json({ error: 'Drip sequence not found' }, { status: 404 });
    }
    if (!sequence.isActive) {
      return NextResponse.json({ error: 'Cannot enroll into an inactive sequence' }, { status: 400 });
    }

    // Enroll each lead — the agent handles skipping duplicates and opt-outs
    const results: { leadId: string; status: 'enrolled' | 'skipped' | 'error'; reason?: string }[] = [];

    for (const leadId of leadIds) {
      try {
        // Check if already ACTIVE in this sequence
        const existing = await vyntrizeDb.dripEnrollment.findFirst({
          where: { leadId, sequenceId, status: 'ACTIVE' },
        });
        if (existing) {
          results.push({ leadId, status: 'skipped', reason: 'already_active' });
          continue;
        }

        await dripCampaignAgent.enroll(leadId, sequenceId, 'manual_bulk_enroll');
        results.push({ leadId, status: 'enrolled' });
      } catch (err) {
        console.error(`[BulkEnroll] Failed to enroll lead ${leadId}:`, err);
        results.push({ leadId, status: 'error', reason: err instanceof Error ? err.message : 'unknown' });
      }
    }

    const enrolled = results.filter((r) => r.status === 'enrolled').length;
    const skipped  = results.filter((r) => r.status === 'skipped').length;
    const errors   = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      summary: { total: leadIds.length, enrolled, skipped, errors },
      results,
    });
  } catch (error) {
    console.error('[Automation API] Error bulk-enrolling leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


