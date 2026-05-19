/**
 * GET /api/crm/leads/[id]/drip-enrollments
 * Returns active drip enrollments for a specific lead.
 * Requires any authenticated session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const enrollments = await prisma.dripEnrollment.findMany({
      where: { leadId: id, status: 'ACTIVE' },
      orderBy: { enrolledAt: 'desc' },
      include: {
        sequence: {
          select: {
            id: true,
            name: true,
            steps: {
              select: { stepOrder: true },
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
      },
    });

    const result = enrollments.map((enrollment) => ({
      id: enrollment.id,
      sequenceId: enrollment.sequenceId,
      sequenceName: enrollment.sequence.name,
      currentStepIndex: enrollment.currentStepIndex,
      totalSteps: enrollment.sequence.steps.length,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status,
    }));

    return NextResponse.json({ enrollments: result });
  } catch (error) {
    console.error('[API] Failed to fetch lead drip enrollments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
