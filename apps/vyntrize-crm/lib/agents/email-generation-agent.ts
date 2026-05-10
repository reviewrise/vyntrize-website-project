// Email Generation Agent - AI-powered email draft generation

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult, AgentConfig } from './base-agent';
import { prisma } from '@/lib/prisma';
import { getAIProvider } from './ai-provider-factory';
import { getEmailThrottlingService } from './email-throttling-service';
import { getEmailTemplateService } from './email-template-service';
import { LeadStage } from '@platform/vyntrize-db';

interface EmailDraft {
  subject: string;
  body: string;
}

interface EmailTrigger {
  type: 'manual' | 'stage_change' | 'engagement' | 'inactivity' | 'milestone';
  reason: string;
  data?: Record<string, unknown>;
}

export class EmailGenerationAgent extends Agent {
  constructor() {
    super(AgentType.EMAIL_GENERATION);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!context.leadId) {
      return {
        success: false,
        error: 'Lead ID required',
        reasoning: 'Cannot generate email without lead ID',
      };
    }

    try {
      // Determine trigger type and reason
      const trigger = this.determineTrigger(context);

      // Check if this trigger should generate an email
      if (trigger.type === 'stage_change') {
        const shouldTrigger = this.shouldTriggerForStageChange(
          trigger.data?.previousStage as string,
          trigger.data?.newStage as string
        );

        if (!shouldTrigger) {
          this.log('info', 'Stage change does not trigger email', {
            leadId: context.leadId,
            previousStage: trigger.data?.previousStage,
            newStage: trigger.data?.newStage,
          });
          return {
            success: false,
            error: 'Stage change does not trigger email',
            reasoning: 'This stage transition does not require an automated email',
          };
        }
      }

      // Check if engagement trigger should generate email
      if (trigger.type === 'engagement') {
        const shouldTrigger = await this.shouldTriggerForEngagement(context.leadId!, trigger);

        if (!shouldTrigger) {
          this.log('info', 'Engagement does not trigger email', {
            leadId: context.leadId,
            engagementType: trigger.data?.engagementType,
          });
          return {
            success: false,
            error: 'Engagement does not trigger email',
            reasoning: 'Recent engagement does not meet criteria for follow-up email',
          };
        }
      }

      // Check throttling rules (pass trigger type for engagement-based adjustments)
      const throttlingService = getEmailThrottlingService();
      const canGenerate = await throttlingService.canGenerateEmail(
        context.leadId,
        trigger.type
      );

      if (!canGenerate.allowed) {
        this.log('info', 'Email generation throttled', {
          leadId: context.leadId,
          reason: canGenerate.reason,
          nextAvailableTime: canGenerate.nextAvailableTime,
        });
        return {
          success: false,
          error: 'Throttled',
          reasoning: canGenerate.reason || 'Email generation rate limit reached',
        };
      }

      // Continue with email generation
      // Fetch lead data with context
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
          emailTracking: {
            orderBy: { sentAt: 'desc' },
            take: 3,
          },
          emailLogs: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          leadActivities: {
            where: {
              activityType: 'page_view',
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
          reasoning: 'Lead does not exist',
        };
      }

      // Build context for AI
      const emailContext = this.buildEmailContext(lead);

      // Determine email tone based on stage
      const tone = this.selectTone(lead.stage);

      // Get appropriate template based on trigger
      const templateService = getEmailTemplateService();
      const template = await this.selectTemplate(trigger, lead);

      // Generate email using AI (with trigger context and template)
      const emailDraft = await this.generateEmail(emailContext, tone, trigger, template, lead);

      // Record action (requires approval)
      const reasoning = this.generateReasoning(lead, tone, trigger);
      const actionId = await this.recordAction(
        ActionType.EMAIL_SEND,
        context.leadId,
        reasoning,
        AutonomyLevel.SUGGEST_APPROVE, // Requires approval
        {
          subject: emailDraft.subject,
          body: emailDraft.body,
          tone,
          stage: lead.stage,
          auto_generated: trigger.type !== 'manual',
          trigger_type: trigger.type,
          trigger_reason: trigger.reason,
          trigger_data: trigger.data,
          template_id: template?.id,
          template_name: template?.name,
        }
      );

      this.log('info', 'Email draft generated', {
        leadId: context.leadId,
        tone,
        actionId,
        trigger: trigger.type,
      });

      return {
        success: true,
        actionId,
        reasoning,
        metadata: {
          emailDraft,
          tone,
          requiresApproval: true,
        },
      };
    } catch (error) {
      this.log('error', 'Failed to generate email', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Error during email generation',
      };
    }
  }

  /**
   * Determine trigger type and reason from context
   */
  private determineTrigger(context: AgentContext): EmailTrigger {
    // Check if this is a stage change event
    if (context.eventData?.previousValue && context.eventData?.newValue) {
      return {
        type: 'stage_change',
        reason: `Lead moved from ${context.eventData.previousValue} to ${context.eventData.newValue}`,
        data: {
          previousStage: context.eventData.previousValue,
          newStage: context.eventData.newValue,
        },
      };
    }

    // Check if this is an email opened event
    if (context.eventData?.emailOpened || context.eventData?.eventType === 'email_opened') {
      return {
        type: 'engagement',
        reason: 'Lead opened recent email - follow up while engaged',
        data: {
          ...context.eventData,
          engagementType: 'email_opened',
        },
      };
    }

    // Check if this is an email clicked event
    if (context.eventData?.emailClicked || context.eventData?.eventType === 'email_clicked') {
      return {
        type: 'engagement',
        reason: 'Lead clicked link in email - high interest detected',
        data: {
          ...context.eventData,
          engagementType: 'email_clicked',
        },
      };
    }

    // Default to manual trigger
    return {
      type: 'manual',
      reason: 'Manually triggered by user',
    };
  }

  /**
   * Select appropriate template based on trigger
   */
  private async selectTemplate(trigger: EmailTrigger, lead: any): Promise<any | null> {
    const templateService = getEmailTemplateService();

    try {
      if (trigger.type === 'stage_change') {
        return await templateService.getStageChangeTemplate(
          trigger.data?.previousStage as string,
          trigger.data?.newStage as string
        );
      }

      if (trigger.type === 'engagement') {
        return await templateService.getEngagementTemplate(
          trigger.data?.engagementType as string
        );
      }

      if (trigger.type === 'inactivity') {
        return await templateService.getReEngagementTemplate();
      }

      // For manual triggers, use general template
      return null;
    } catch (error) {
      console.error('[EmailGenerationAgent] Error selecting template:', error);
      return null;
    }
  }

  /**
   * Check if stage change should trigger email generation
   */
  private shouldTriggerForStageChange(
    previousStage: string,
    newStage: string
  ): boolean {
    // Only generate emails for specific stage transitions
    const triggerTransitions = [
      'NEW->CONTACTED',
      'CONTACTED->QUALIFIED',
      'QUALIFIED->PROPOSAL_SENT',
      'PROPOSAL_SENT->WON',
    ];

    const transition = `${previousStage}->${newStage}`;
    return triggerTransitions.includes(transition);
  }

  /**
   * Check if engagement should trigger email generation
   */
  private async shouldTriggerForEngagement(
    leadId: string,
    trigger: EmailTrigger
  ): Promise<boolean> {
    const engagementType = trigger.data?.engagementType as string;

    // Only trigger for email opens and clicks
    if (!['email_opened', 'email_clicked'].includes(engagementType)) {
      return false;
    }

    // Check if engagement happened recently (within last 24 hours)
    const engagementTime = trigger.data?.timestamp 
      ? new Date(trigger.data.timestamp as string)
      : new Date();
    
    const hoursSinceEngagement = (Date.now() - engagementTime.getTime()) / (1000 * 60 * 60);
    
    // Only trigger if engagement is fresh (within 24 hours)
    if (hoursSinceEngagement > 24) {
      this.log('info', 'Engagement too old to trigger email', {
        leadId,
        hoursSinceEngagement,
      });
      return false;
    }

    // For email clicks, always trigger (high intent)
    if (engagementType === 'email_clicked') {
      return true;
    }

    // For email opens, check if lead has high engagement rate
    if (engagementType === 'email_opened') {
      const throttlingService = getEmailThrottlingService();
      const engagementRate = await throttlingService.calculateEngagementRate(leadId);
      
      // Only trigger for leads with >30% engagement rate
      const threshold = parseInt(process.env.EMAIL_ENGAGEMENT_THRESHOLD || '30');
      return engagementRate >= threshold;
    }

    return false;
  }

  /**
   * Build context for email generation
   */
  private buildEmailContext(lead: any): string {
    const parts: string[] = [];

    // Lead basic info
    parts.push(`Lead: ${lead.contact.firstName} ${lead.contact.lastName}`);
    if (lead.contact.jobTitle) parts.push(`Job Title: ${lead.contact.jobTitle}`);
    if (lead.company?.name) parts.push(`Company: ${lead.company.name}`);
    parts.push(`Stage: ${lead.stage}`);
    if (lead.dealValue) parts.push(`Deal Value: $${lead.dealValue}`);

    // Recent activities
    if (lead.activities.length > 0) {
      parts.push('\nRecent Activities:');
      lead.activities.forEach((activity: any) => {
        parts.push(`- ${activity.type}: ${activity.body.substring(0, 100)}`);
      });
    }

    // Email history
    const totalEmails = lead.emailTracking.length + lead.emailLogs.length;
    if (totalEmails > 0) {
      const opens = lead.emailTracking.filter((e: any) => e.openedAt).length +
                    lead.emailLogs.filter((e: any) => e.openedAt).length;
      const clicks = lead.emailTracking.filter((e: any) => e.clickedAt).length +
                     lead.emailLogs.filter((e: any) => e.clickedAt).length;
      parts.push(`\nEmail Engagement: ${opens} opens, ${clicks} clicks from ${totalEmails} emails`);
    }

    // Website activity
    if (lead.leadActivities.length > 0) {
      parts.push(`\nWebsite Activity: Visited ${lead.leadActivities.length} pages recently`);
      const pages = lead.leadActivities
        .map((a: any) => a.activityData?.pageUrl)
        .filter(Boolean)
        .slice(0, 3);
      if (pages.length > 0) {
        parts.push(`Pages: ${pages.join(', ')}`);
      }
    }

    // Lead score
    if (lead.score) {
      parts.push(`\nLead Score: ${lead.score}/100 (${lead.qualificationStatus})`);
    }

    return parts.join('\n');
  }

  /**
   * Select email tone based on lead stage
   */
  private selectTone(stage: LeadStage): string {
    const toneMap: Record<LeadStage, string> = {
      NEW: 'friendly and introductory',
      CONTACTED: 'professional and engaging',
      QUALIFIED: 'consultative and value-focused',
      PROPOSAL_SENT: 'confident and action-oriented',
      WON: 'celebratory and onboarding-focused',
      LOST: 'gracious and door-open',
    };

    return toneMap[stage] || 'professional';
  }

  /**
   * Generate email using AI
   */
  private async generateEmail(
    context: string,
    tone: string,
    trigger?: EmailTrigger,
    template?: any,
    lead?: any
  ): Promise<EmailDraft> {
    // Enhance system prompt based on trigger type
    let systemPrompt = `You are a professional sales email writer. Generate personalized, engaging emails that drive action. Keep emails concise (150-200 words), use a ${tone} tone, and include a clear call-to-action.`;
    
    let promptContext = context;
    
    // Add template context if available
    if (template) {
      systemPrompt += ` Use the following template as a structural guide, but personalize the content based on the lead's context. Template subject: "${template.subject}". Maintain professional email formatting.`;
    }
    
    // Add engagement-specific context
    if (trigger?.type === 'engagement') {
      const engagementType = trigger.data?.engagementType;
      
      if (engagementType === 'email_clicked') {
        systemPrompt += ' The lead just clicked a link in your email, showing high interest. Strike while the iron is hot with a timely follow-up.';
        promptContext += '\n\n**IMPORTANT**: This lead just clicked a link in your recent email. They are actively engaged RIGHT NOW. Your follow-up should acknowledge their interest and provide the next logical step.';
      } else if (engagementType === 'email_opened') {
        systemPrompt += ' The lead recently opened your email. Follow up while you have their attention.';
        promptContext += '\n\n**IMPORTANT**: This lead recently opened your email. They are showing interest. Your follow-up should build on the previous message and move the conversation forward.';
      }
    }

    const prompt = `Generate a follow-up email for this lead:

${promptContext}

Return the email in this exact format:
SUBJECT: [email subject line]
BODY:
[email body]

Remember:
- Personalize based on the lead's context
- Keep it concise and actionable
- Use a ${tone} tone
- Include a clear next step`;

    const aiProvider = await getAIProvider();
    const response = await aiProvider.generateCompletion({
      prompt,
      systemPrompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    const aiDraft = this.parseEmailResponse(response.content);

    // If we have a template, merge AI content with template structure
    if (template && lead) {
      const templateService = getEmailTemplateService();
      const variables = templateService.extractLeadVariables(lead);
      
      const merged = templateService.mergeAIContentWithTemplate(
        template,
        aiDraft.subject,
        aiDraft.body,
        variables
      );

      return merged;
    }

    return aiDraft;
  }

  /**
   * Parse AI response into subject and body
   */
  private parseEmailResponse(content: string): EmailDraft {
    const lines = content.split('\n');
    let subject = '';
    let body = '';
    let inBody = false;

    for (const line of lines) {
      if (line.startsWith('SUBJECT:')) {
        subject = line.replace('SUBJECT:', '').trim();
      } else if (line.startsWith('BODY:')) {
        inBody = true;
      } else if (inBody && line.trim()) {
        body += line + '\n';
      }
    }

    // Fallback if parsing fails
    if (!subject) {
      subject = 'Following up on our conversation';
    }
    if (!body) {
      body = content;
    }

    return {
      subject: subject.trim(),
      body: body.trim(),
    };
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(lead: any, tone: string, trigger: EmailTrigger): string {
    const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;
    const triggerText = trigger.type !== 'manual' ? ` (${trigger.reason})` : '';
    return `Generated AI-powered email draft for ${contactName} (${lead.stage} stage) with ${tone} tone${triggerText}. Email requires approval before sending.`;
  }

  getConfig(): AgentConfig {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.SUGGEST_APPROVE, // Always requires approval
      priority: 'MEDIUM',
    };
  }
}
