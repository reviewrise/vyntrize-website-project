/**
 * Automation API — Manual Unenroll
 * DELETE /api/automation/drip-sequences/[id]/enrollments/[enrollmentId]
 *
 * Manually unenrolls a lead from a drip sequence by calling
 * DripCampaignAgent.stopEnrollment(enrollmentId, 'manual').
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { DripCampaignAgent } from '@/lib/agents/drip-campaign-agent';

interface RouteParams {
  params: Promise<{ id: string; enrollmentId: string }>;
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

    const { id, enrollmentId } = await params;

    // Verify the enrollment belongs to this sequence
    const enrollment = await vyntrizeDb.dripEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.sequenceId !== id) {
      return NextResponse.json(
        { error: 'Enrollment does not belong to this sequence' },
        { status: 400 }
      );
    }

    if (enrollment.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Enrollment is not active', status: enrollment.status },
        { status: 400 }
      );
    }

    const agent = new DripCampaignAgent();
    await agent.stopEnrollment(enrollmentId, 'manual');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Automation API] Error unenrolling from drip sequence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
