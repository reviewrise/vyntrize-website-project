// POST /api/agents/actions/:actionId/approve - Approve a pending agent action

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stageProgressionAgent } from '@/lib/agents/stage-progression-agent';
import { dripCampaignAgent } from '@/lib/agents/drip-campaign-agent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (Next.js 15 requirement)
    const { actionId } = await params;

    // Update action status to APPROVED
    const action = await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: 'APPROVED',
        approvedBy: session.userId,
        approvedAt: new Date(),
      },
      include: {
        lead: {
          include: {
            contact: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    console.log(`[API] Action ${actionId} approved by user ${session.userId}`);

    // Dispatch post-approval side effects based on action type
    try {
      if (action.actionType === 'STAGE_CHANGE') {
        await stageProgressionAgent.applyApprovedAction(actionId);
      } else if (action.actionType === 'DRIP_ENROLL') {
        await dripCampaignAgent.applyApprovedEnrollment(actionId);
      }
    } catch (sideEffectError) {
      // Log but don't fail the approval — the action is already marked APPROVED
      console.error(`[API] Post-approval side effect failed for action ${actionId}:`, sideEffectError);
    }

    return NextResponse.json({
      success: true,
      action,
    });
  } catch (error) {
    console.error('[API] Failed to approve action:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
