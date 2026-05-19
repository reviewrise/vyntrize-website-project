import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';
import { LeadActivityService } from '@/lib/services/lead-activity-service';

// GET - Fetch system-generated activities (LeadActivity)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const activityType = searchParams.get('activityType') || undefined;

    const result = await LeadActivityService.getLeadActivities(leadId, {
      page,
      pageSize,
      activityType,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Failed to fetch activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST - Log a manual activity (Activity model)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const { type, notes, outcome, durationMinutes } = await request.json();

    if (!type || !leadId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build the activity body text
    const parts: string[] = [];
    if (type === 'CALL') {
      parts.push(`📞 **Call logged**`);
      if (outcome) parts.push(`Outcome: ${outcome}`);
      if (durationMinutes) parts.push(`Duration: ${durationMinutes} min`);
    } else if (type === 'MEETING') {
      parts.push(`🤝 **Meeting logged**`);
      if (outcome) parts.push(`Outcome: ${outcome}`);
      if (durationMinutes) parts.push(`Duration: ${durationMinutes} min`);
    } else if (type === 'NOTE') {
      parts.push(`📝 **Note added**`);
    } else if (type === 'TASK_COMPLETE') {
      parts.push(`✅ **Task marked complete**`);
    }
    if (notes) parts.push(notes);

    const body = parts.join('\n');

    // Create manual activity (Activity model)
    await prisma.activity.create({
      data: {
        type: type === 'CALL' ? 'CALL' : type === 'EMAIL' ? 'EMAIL' : 'NOTE',
        body,
        leadId,
        userId: session.userId,
        duration: durationMinutes ? parseInt(durationMinutes) : undefined,
      },
    });

    // Update lastActivityAt on the lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { lastActivityAt: new Date() },
    });

    // Emit LEAD_UPDATED so scoring agent re-scores
    await eventBus.emitCRMEvent(CRMEvent.LEAD_UPDATED, {
      leadId,
      userId: session.userId,
      metadata: { activityType: type },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to log activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

