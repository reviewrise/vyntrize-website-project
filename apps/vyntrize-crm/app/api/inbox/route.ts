import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find leads that have had CONVERSATIONAL agent actions in the last 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const conversationalActions = await prisma.agentAction.findMany({
    where: {
      agentType: 'CONVERSATIONAL',
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      lead: {
        include: {
          contact: true,
          company: true,
          assignee: {
            select: { id: true, displayName: true, email: true, avatarUrl: true }
          },
        }
      }
    },
  });

  // Deduplicate by leadId, keeping the most recent action per lead
  const seenLeadIds = new Set<string>();
  const uniqueConversations = conversationalActions.filter(action => {
    if (!action.leadId || seenLeadIds.has(action.leadId)) return false;
    seenLeadIds.add(action.leadId);
    return true;
  });

  // For each unique lead, also fetch recent messages (last 20 activities of type SMS/EMAIL)
  const conversations = await Promise.all(
    uniqueConversations.map(async (action) => {
      if (!action.lead) return null;

      const [recentActivities, recentAgentActions, lead] = await Promise.all([
        prisma.activity.findMany({
          where: {
            leadId: action.leadId!,
            type: 'EMAIL',
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.agentAction.findMany({
          where: {
            leadId: action.leadId!,
            agentType: 'CONVERSATIONAL',
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.lead.findUnique({
          where: { id: action.leadId! },
          select: { aiPaused: true, stage: true }
        })
      ]);

      return {
        leadId: action.leadId,
        contact: action.lead.contact,
        company: action.lead.company,
        assignee: action.lead.assignee,
        aiPaused: lead?.aiPaused ?? false,
        stage: lead?.stage ?? 'NEW',
        lastActionAt: action.createdAt,
        lastActionType: (action.metadata as any)?.auto_sent ? 'AI_REPLIED' : 'AI_PROCESSED',
        messages: [
          ...recentActivities.map(a => ({
            id: a.id,
            type: a.type,
            direction: a.direction,
            body: a.body,
            createdAt: a.createdAt,
          })),
          ...recentAgentActions.flatMap(a => {
            const meta = a.metadata as any;
            const msgs = [];
            const type = a.actionType.includes('SMS') ? 'SMS' : 'EMAIL';
            if (meta?.inbound_message) {
              msgs.push({
                id: a.id + '_in',
                type,
                direction: 'INBOUND',
                body: meta.inbound_message,
                createdAt: new Date(a.createdAt.getTime() - 1000), // Slightly before reply
              });
            }
            if (meta?.generated_reply) {
              msgs.push({
                id: a.id + '_out',
                type,
                direction: 'OUTBOUND',
                body: meta.generated_reply,
                createdAt: a.createdAt,
              });
            }
            return msgs;
          })
        ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      };
    })
  );

  return NextResponse.json({ conversations: conversations.filter(Boolean) });
}
