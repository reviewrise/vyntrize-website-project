import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NotificationEventType } from '@platform/vyntrize-db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { paused } = await req.json();

  const lead = await prisma.lead.update({
    where: { id: resolvedParams.id },
    data: { aiPaused: paused },
    include: { contact: true }
  });

  // Log an agent action to record that human intervened
  if (paused) {
    await prisma.agentAction.create({
      data: {
        agentType: 'CONVERSATIONAL',
        actionType: 'ALERT',
        leadId: lead.id,
        reasoning: 'AI paused by human rep',
        status: 'EXECUTED',
        autonomyLevel: 'COPILOT',
        metadata: { pausedBy: session.userId }
      }
    });

    if (lead.assigneeId && lead.assigneeId !== session.userId) {
       try {
         const { notificationService } = await import('@/lib/notifications/notification-service');
         await notificationService.createNotification({
           userId: lead.assigneeId,
           eventType: NotificationEventType.AI_PAUSED_BY_USER,
           title: `⏸️ AI Paused: ${lead.contact?.firstName || 'Lead'}`,
           body: `AI has been paused for this lead. Manual replies required.`,
           entityType: 'lead',
           entityId: lead.id,
         });
       } catch (e) {
         console.warn('Failed to send AI_PAUSED_BY_USER notification', e);
       }
    }
  }

  return NextResponse.json({ success: true, aiPaused: lead.aiPaused });
}
