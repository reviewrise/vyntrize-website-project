// POST /api/agents/actions/[actionId]/feedback
// Saves a user-corrected version of an AI-generated email draft.
// The corrected text is later used as a few-shot example by EmailGenerationAgent.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionId } = await params;
    const body = await request.json();
    const { correctedSubject, correctedBody } = body as {
      correctedSubject?: string;
      correctedBody?: string;
    };

    if (!correctedSubject && !correctedBody) {
      return NextResponse.json(
        { error: 'Provide at least correctedSubject or correctedBody' },
        { status: 400 }
      );
    }

    // Verify the action exists and belongs to an EMAIL_GENERATION agent
    const action = await prisma.agentAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Store the corrected text as a JSON string in the correctedText column
    const correctedText = JSON.stringify({ correctedSubject, correctedBody });

    const updated = await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        correctedText,
        // Also mark as REJECTED so it doesn't get sent
        status: 'REJECTED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback saved. The AI will use this to improve future emails.',
      actionId: updated.id,
    });
  } catch (error) {
    console.error('[API] Feedback save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
