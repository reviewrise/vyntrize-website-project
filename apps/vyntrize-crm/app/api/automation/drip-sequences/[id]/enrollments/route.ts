/**
 * Automation API — Drip Sequence Enrollments
 * GET /api/automation/drip-sequences/[id]/enrollments
 *
 * Returns active enrollments with lead name, current step, enrollment date,
 * and last email sent date.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';

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
              select: { stepOrder: true, subjectTemplate: true },
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
        currentStepSubject: currentStep?.subjectTemplate ?? null,
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
