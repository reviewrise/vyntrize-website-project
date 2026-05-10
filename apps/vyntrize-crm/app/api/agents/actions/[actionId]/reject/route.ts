// POST /api/agents/actions/:actionId/reject - Reject a pending agent action

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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

    // Update action status to REJECTED
    const action = await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: 'REJECTED',
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

    console.log(`[API] Action ${actionId} rejected by user ${session.userId}`);

    return NextResponse.json({
      success: true,
      action,
    });
  } catch (error) {
    console.error('[API] Failed to reject action:', error);
    
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
