import { Agent, AgentType, ActionType, ActionStatus, AutonomyLevel, AgentContext, AgentActionResult, AgentConfig } from './base-agent';
import { prisma } from '@/lib/prisma';
import { getAIProvider } from './ai-provider-factory';
import { CRMEvent } from './event-bus';
import { emailService } from '@/lib/email/email-service';
import { NotificationEventType } from '@platform/vyntrize-db';

export class ConversationalAgent extends Agent {
  constructor() {
    super(AgentType.CONVERSATIONAL);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!context.leadId) {
      return { success: false, error: 'Lead ID required', reasoning: 'Missing leadId' };
    }

    const eventType = context.eventData?.event as CRMEvent;
    if (eventType !== CRMEvent.SMS_REPLIED && eventType !== CRMEvent.EMAIL_REPLIED) {
      return { success: false, reasoning: 'Not a reply event' };
    }

    try {
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: {
          contact: true,
          company: true,
          assignee: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          leadNotes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          }
        }
      });

      if (!lead) return { success: false, reasoning: 'Lead not found' };

      if (lead.aiPaused) {
        return { success: false, reasoning: 'AI is paused for this lead — human has taken over.' };
      }

      const isSms = eventType === CRMEvent.SMS_REPLIED;
      const inboundMessage = isSms ? context.eventData?.message as string : context.eventData?.text as string;

      if (!inboundMessage || inboundMessage.trim() === '') {
        return { success: false, reasoning: 'Empty inbound message' };
      }

      const repName = lead.assignee?.displayName || 'Sales Rep';
      const bookingLink = lead.assignee?.bookingSlug 
        ? `https://vyntrise.com/book/${lead.assignee.bookingSlug}` 
        : `https://vyntrise.com/book/general`;

      // Build context of previous interactions for the LLM
      const recentActivities = lead.activities.map(a => `- ${a.type}: ${a.body}`).join('\n');
      const recentNotes = lead.leadNotes.map(n => `- ${n.note}`).join('\n');

      const promptContext = `
Lead Name: ${lead.contact.firstName} ${lead.contact.lastName}
Lead Company: ${lead.company?.name || 'Unknown'}
Lead Stage: ${lead.stage}
Assigned Rep: ${repName}
Rep Booking Link: ${bookingLink}
Channel: ${isSms ? 'SMS' : 'Email'}

Recent Activities:
${recentActivities}

Recent Notes:
${recentNotes}

INBOUND MESSAGE FROM LEAD:
"${inboundMessage}"
      `;

      const systemPrompt = `You are an AI Sales Assistant for VyntRise CRM acting on behalf of ${repName}. 
Your goal is to reply to the lead naturally, answer questions, and gracefully drop the rep's booking link if they show interest in a meeting.
You must analyze the lead's message and determine three things:
1. isQualified: True if the lead is asking for pricing, a demo, a call, or shows clear buying intent.
2. isHandoffRequested: True if the lead explicitly asks to speak to a human, or is angry/frustrated.
3. sentiment: The sentiment of the lead's message, strictly one of "POSITIVE", "NEUTRAL", or "NEGATIVE".

IMPORTANT: Respond ONLY with a valid JSON object in the following format:
{
  "reply": "The actual message content to send to the lead",
  "isQualified": boolean,
  "isHandoffRequested": boolean,
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "reasoning": "Brief explanation of why you set isQualified/isHandoffRequested/sentiment"
}

Constraints for the 'reply' field:
- If SMS: Keep it extremely concise (under 160 characters if possible), friendly, no subject lines.
- If Email: Keep it under 3-4 sentences. Professional but conversational.
- Do NOT include JSON markdown formatting (\`\`\`json) in your output, just the raw JSON object.
      `;

      const aiProvider = await getAIProvider();
      const response = await aiProvider.generateCompletion({
        prompt: promptContext,
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.7,
      });

      // Parse JSON response
      let aiAnalysis;
      try {
        let content = response.content.trim();
        if (content.startsWith('```json')) {
            content = content.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (content.startsWith('```')) {
            content = content.replace(/^```/, '').replace(/```$/, '').trim();
        }
        aiAnalysis = JSON.parse(content);
      } catch (parseError) {
        this.log('error', 'Failed to parse Conversational Agent JSON', { rawContent: response.content, error: parseError });
        return { success: false, error: 'Failed to parse AI response', reasoning: 'JSON parse error' };
      }

      const replyContent = aiAnalysis.reply;

      if (!replyContent) {
          return { success: false, error: 'No reply generated', reasoning: 'AI did not provide a reply field' };
      }

      // Handle Qualification & Handoff
      if (aiAnalysis.isQualified && lead.stage !== 'QUALIFIED') {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { stage: 'QUALIFIED' }
        });
        await prisma.leadNote.create({
            data: { leadId: lead.id, note: `🔥 **Lead Qualified by AI Agent:**\nReasoning: ${aiAnalysis.reasoning}` }
        });
      }

      if (aiAnalysis.isQualified && lead.assigneeId) {
        try {
          const { notificationService } = await import('@/lib/notifications/notification-service');
          await notificationService.createNotification({
            userId: lead.assigneeId,
            eventType: NotificationEventType.AI_LEAD_QUALIFIED,
            title: `🔥 Hot Lead: ${lead.contact.firstName} ${lead.contact.lastName}`,
            body: aiAnalysis.reasoning,
            entityType: 'lead',
            entityId: lead.id,
          });
        } catch (e) {
          this.log('warn', 'Failed to send AI_LEAD_QUALIFIED notification', e);
        }
      }

      if (aiAnalysis.isHandoffRequested) {
        await prisma.leadNote.create({
            data: { leadId: lead.id, note: `⚠️ **Human Handoff Requested:**\nThe AI detected the lead wants to speak to a human or is frustrated. Please intervene.\nReasoning: ${aiAnalysis.reasoning}` }
        });
      }

      if (aiAnalysis.isHandoffRequested && lead.assigneeId) {
        try {
          const { notificationService } = await import('@/lib/notifications/notification-service');
          await notificationService.createNotification({
            userId: lead.assigneeId,
            eventType: NotificationEventType.AI_HANDOFF_REQUESTED,
            title: `⚠️ Handoff Requested: ${lead.contact.firstName} ${lead.contact.lastName}`,
            body: `Lead wants to talk to a human. Reason: ${aiAnalysis.reasoning}`,
            entityType: 'lead',
            entityId: lead.id,
          });
        } catch (e) {
          this.log('warn', 'Failed to send AI_HANDOFF_REQUESTED notification', e);
        }
      }

      // Send Reply
      if (isSms && lead.contact.phone) {
        try {
            const { dncService } = await import('@/lib/compliance/dnc-service');
            const isBlocked = await dncService.isBlocked(lead.contact.phone);
            
            if (isBlocked) {
              this.log('warn', `Skipping SMS to ${lead.contact.phone} due to DNC registry block.`);
              return { success: false, error: 'DNC Blocked', reasoning: 'Phone number is on the Do-Not-Call registry' };
            }

            const { smsService } = await import('@/lib/sms/sms-service');
            await smsService.sendSms({ to: lead.contact.phone, content: replyContent });
        } catch(e) {
            this.log('warn', 'Failed to send SMS, smsService not found or failed', e);
        }
      } else if (!isSms && lead.contact.email) {
        await emailService.sendEmail({
          role: 'sales',
          to: lead.contact.email,
          toName: lead.contact.firstName,
          subject: `Re: Following up`,
          html: replyContent.replace(/\n/g, '<br>'),
          leadId: lead.id,
          contactId: lead.contact.id,
          userId: lead.assigneeId ?? undefined,
        });
      }

      // Log AI Action
      const actionId = await this.recordAction(
        isSms ? ActionType.SMS_SEND : ActionType.EMAIL_SEND,
        lead.id,
        `AI Auto-replied to inbound ${isSms ? 'SMS' : 'Email'}`,
        AutonomyLevel.FULLY_AUTONOMOUS,
        {
          generated_reply: replyContent,
          auto_sent: true,
          inbound_message: inboundMessage,
          isQualified: aiAnalysis.isQualified,
          isHandoffRequested: aiAnalysis.isHandoffRequested,
          sentiment: aiAnalysis.sentiment || 'NEUTRAL',
        }
      );

      // Add to Lead Notes
      await prisma.leadNote.create({
          data: { leadId: lead.id, note: `🤖 **AI Agent Replied via ${isSms ? 'SMS' : 'Email'}:**\n\n${replyContent}` }
      });

      return {
        success: true,
        actionId,
        reasoning: `Replied to lead via ${isSms ? 'SMS' : 'Email'} - Qualified: ${aiAnalysis.isQualified}`
      };

    } catch (error: any) {
      this.log('error', 'ConversationalAgent failed', error);
      return { success: false, error: error.message, reasoning: 'Failed to generate/send reply' };
    }
  }

  getConfig(): AgentConfig {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      priority: 'HIGH',
    };
  }
}
