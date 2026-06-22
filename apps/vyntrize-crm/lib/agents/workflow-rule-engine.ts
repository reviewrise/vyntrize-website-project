// Workflow Rule Engine — evaluates stored trigger → condition → action rules
// and dispatches actions across all automation systems.

import {
  Agent,
  AgentType,
  ActionType,
  ActionStatus,
  AutonomyLevel,
  AgentContext,
  AgentActionResult,
  AgentConfig,
} from './base-agent';
import { prisma } from '@/lib/prisma';
import { eventBus, CRMEvent } from './event-bus';
import {
  RuleCondition,
  RuleAction,
  ruleConditionSchema,
  ruleActionSchema,
} from '@/lib/automation';
import { StageProgressionAgent } from './stage-progression-agent';
import { DripCampaignAgent } from './drip-campaign-agent';
import { EmailGenerationAgent } from './email-generation-agent';
import { emailService } from '@/lib/email/email-service';
import { syncEventToGoogle } from '@/lib/google-calendar';
import { sendCustomerSms } from '@/lib/sms/send-customer-sms';
import { ContextBuilder } from '@/lib/automation/context-builder';
import crypto from 'crypto';
import { z } from 'zod';
import type { Lead } from '@platform/vyntrize-db';

export class WorkflowRuleEngine extends Agent {
  constructor() {
    super(AgentType.WORKFLOW_RULE);
  }

  // ─── execute ──────────────────────────────────────────────────────────────

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!this.enabled) {
      return {
        success: true,
        reasoning: 'WorkflowRuleEngine is disabled via feature flag',
      };
    }

    const leadId = context.leadId;
    const eventData = context.eventData ?? {};
    const event =
      (eventData.event as string) ?? (eventData.eventType as string);

    if (!leadId || !event) {
      return {
        success: true,
        reasoning: 'No leadId or event — nothing to evaluate',
      };
    }

    try {
      await this.evaluateRules(event, leadId, eventData, context);
      return {
        success: true,
        reasoning: `Evaluated workflow rules for event "${event}" on lead ${leadId}`,
      };
    } catch (err) {
      this.log('error', 'WorkflowRuleEngine.execute failed', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        reasoning: 'Error evaluating workflow rules',
      };
    }
  }

  // ─── evaluateRules ────────────────────────────────────────────────────────

  private async evaluateRules(
    event: string,
    leadId: string,
    eventData: Record<string, unknown>,
    context: AgentContext
  ): Promise<void> {
    // 1. Query active rules matching the trigger event, ordered by priority ASC
    const rules = await prisma.workflowRule.findMany({
      where: { triggerEvent: event, isActive: true },
      orderBy: { priority: 'asc' },
    });

    if (rules.length === 0) {
      return;
    }

    // 2. Fetch lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      this.log('warn', 'Lead not found during evaluateRules', { leadId });
      return;
    }

    // 3. Evaluate each rule
    for (const rule of rules) {
      // b. Validate conditions JSON
      const conditionsResult = z
        .array(ruleConditionSchema)
        .safeParse(rule.conditions);
      if (!conditionsResult.success) {
        this.log('error', 'Invalid conditions JSON — skipping rule', {
          ruleId: rule.id,
          ruleName: rule.name,
          error: conditionsResult.error.message,
        });
        continue;
      }

      // c. Validate actions JSON
      const actionsResult = z
        .array(ruleActionSchema)
        .safeParse(rule.actions);
      if (!actionsResult.success) {
        this.log('error', 'Invalid actions JSON — skipping rule', {
          ruleId: rule.id,
          ruleName: rule.name,
          error: actionsResult.error.message,
        });
        continue;
      }

      const conditions = conditionsResult.data as RuleCondition[];
      const actions = actionsResult.data as RuleAction[];

      // d. Evaluate conditions (AND logic)
      const conditionsMet = await this.evaluateConditions(
        lead as Lead,
        conditions,
        eventData
      );
      if (!conditionsMet) {
        continue;
      }

      // e. Execute each action in sequence, catching per-action errors
      let actionsExecuted = 0;
      for (const action of actions) {
        try {
          await this.executeAction(lead as Lead, action, {
            id: rule.id,
            name: rule.name,
            autonomyLevel: rule.autonomyLevel,
          }, context);
          actionsExecuted++;
        } catch (err) {
          this.log('error', 'Action execution failed', {
            ruleId: rule.id,
            ruleName: rule.name,
            actionType: action.type,
            err,
          });
          // Record a FAILED AgentAction for this specific action failure
          await prisma.agentAction.create({
            data: {
              agentType: this.agentType,
              actionType: ActionType.RULE_EXECUTION,
              leadId: lead.id,
              reasoning: `Action "${action.type}" failed in rule "${rule.name}": ${err instanceof Error ? err.message : 'Unknown error'}`,
              autonomyLevel: rule.autonomyLevel as AutonomyLevel,
              status: ActionStatus.FAILED,
              executedAt: new Date(),
              metadata: {
                ruleId: rule.id,
                ruleName: rule.name,
                failedActionType: action.type,
              },
            },
          });
          // Continue to next action
        }
      }

      // f. Record RULE_EXECUTION AgentAction
      await this.recordAction(
        ActionType.RULE_EXECUTION,
        lead.id,
        `Workflow rule "${rule.name}" executed for event "${rule.triggerEvent}"`,
        rule.autonomyLevel as AutonomyLevel,
        {
          ruleId: rule.id,
          ruleName: rule.name,
          matchedConditions: conditions.length,
          actionsExecuted,
        }
      );
    }
  }

  // ─── evaluateConditions ───────────────────────────────────────────────────

  private async evaluateConditions(
    lead: Lead,
    conditions: RuleCondition[],
    eventData: Record<string, unknown> = {}
  ): Promise<boolean> {
    for (const condition of conditions) {
      const { field, operator, value } = condition;

      let actual: number | string | null | undefined;

      switch (field) {
        case 'score':
          actual = lead.score ?? 0;
          break;

        case 'stage':
          actual = lead.stage;
          break;

        case 'daysInStage':
          actual = Math.floor(
            (Date.now() - lead.updatedAt.getTime()) / 86400000
          );
          break;

        case 'scoreChangedBy': {
          const scoreChange = eventData.scoreChange as number | undefined;
          if (scoreChange === undefined || scoreChange === null) {
            // Condition cannot be evaluated — skip (treat as not met)
            return false;
          }
          actual = scoreChange;
          break;
        }

        case 'assigneeId':
          actual = lead.assigneeId ?? '';
          break;

        case 'source':
          actual = lead.source ?? '';
          break;

        default:
          // Unknown field — skip condition (treat as not met)
          return false;
      }

      // For stage, assigneeId, and source fields, only 'eq' is meaningful
      if (field === 'stage' || field === 'assigneeId' || field === 'source') {
        if (operator !== 'eq') {
          // Non-eq operators on string fields are not supported
          return false;
        }
        if (actual !== value) {
          return false;
        }
        continue;
      }

      // If the field wasn't found or was null, and the operator isn't specifically checking for null
      // (which we don't have), we must treat it as unmet.
      if (actual === null || actual === undefined) {
        return false;
      }

      // Numeric comparison
      const numActual = Number(actual);
      const numValue = Number(value);
      
      if (isNaN(numActual) || isNaN(numValue)) {
        return false;
      }

      switch (operator) {
        case 'gt':
          if (!(numActual > numValue)) return false;
          break;
        case 'lt':
          if (!(numActual < numValue)) return false;
          break;
        case 'eq':
          if (numActual !== numValue) return false;
          break;
        case 'gte':
          if (!(numActual >= numValue)) return false;
          break;
        case 'lte':
          if (!(numActual <= numValue)) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  // ─── executeAction ────────────────────────────────────────────────────────

  private async executeAction(
    lead: Lead,
    action: RuleAction,
    rule: { id: string; name: string; autonomyLevel: string },
    context: AgentContext
  ): Promise<void> {
    switch (action.type) {
      case 'send_email': {
        const { templateHint, templateId, templateName } = (action.config || {}) as { templateHint?: string; templateId?: string; templateName?: string };

        // If a saved template was chosen, bypass AI and render directly
        if (templateId) {
          const emailTpl = await prisma.emailTemplate.findUnique({
            where: { id: parseInt(templateId, 10) },
            select: { name: true, subject: true, body: true },
          });

          if (emailTpl) {
            const contact = await prisma.contact.findUnique({ where: { id: lead.contactId } });
            if (!contact?.email) {
              this.log('warn', 'Skipping email send: Lead has no email address', { leadId: lead.id });
              return;
            }

            const { TemplateRenderer } = await import('@/lib/email/template-renderer');
            const { emailService } = await import('@/lib/email/email-service');

            const templateVars = ContextBuilder.buildVariables({ contact, lead: lead as any });

            const trackingId = `wf_rule_${rule.id}_${Date.now()}`;
            
            let formattedBody = emailTpl.body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
            if (!formattedBody.startsWith('<p>')) formattedBody = `<p>${formattedBody}</p>`;
            
            // We rely on emailService.sendEmail to apply the global email layout.
            const finalSubject = TemplateRenderer.render(emailTpl.subject, templateVars);
            formattedBody = TemplateRenderer.renderWithTracking(formattedBody, templateVars, trackingId);
            formattedBody = TemplateRenderer.inlineCSS(formattedBody);

            await emailService.sendEmail({
              role:      'sales',
              to:        contact.email,
              toName:    `${contact.firstName} ${contact.lastName}`.trim(),
              subject:   finalSubject,
              html:      formattedBody,
              text:      emailTpl.body,
              trackingId,
              leadId:    lead.id,
              contactId: contact.id,
              templateId: parseInt(templateId, 10),
              userId:    lead.assigneeId ?? undefined,
            });
            
            await prisma.agentAction.create({
              data: {
                agentType: this.agentType,
                actionType: 'EMAIL_SEND',
                leadId: lead.id,
                reasoning: `Auto-sent email using template: ${emailTpl.name || templateName || templateId}`,
                autonomyLevel: rule.autonomyLevel as any,
                status: 'EXECUTED',
                executedAt: new Date(),
                metadata: {
                  subject: finalSubject,
                  autoSent: true,
                  templateId: templateId
                }
              }
            });

            this.log('info', 'Workflow engine sent template email directly', { leadId: lead.id, templateId });
            break;
          }
        }

        // Fallback to AI generation if no template is chosen
        const emailAgent = new EmailGenerationAgent();
        const result = await emailAgent.execute({
          leadId: lead.id,
          eventData: {
            ...context.eventData,
            templateHint,
            triggeredByRule: rule.id,
            ruleName: rule.name,
            ruleAutonomyLevel: rule.autonomyLevel,
          }
        });
        if (!result.success) {
          throw new Error(`EmailGenerationAgent failed: ${result.error || result.reasoning}`);
        }
        break;
      }

      case 'send_sms': {
        const { message, smsTemplateId } = (action.config || {}) as {
          message: string;
          smsTemplateId?: string;
        };

        const contact = await prisma.contact.findUnique({ where: { id: lead.contactId } });

        // Resolve template body if a template was selected
        let resolvedMessage = message;
        if (smsTemplateId) {
          const smsTpl = await (prisma as any).smsTemplate.findUnique({
            where: { id: smsTemplateId },
            select: { body: true },
          });
          if (smsTpl?.body) resolvedMessage = smsTpl.body;
        }

        if (rule.autonomyLevel === 'SUGGEST_APPROVE') {
          // Park as a pending AgentAction for human review — do not send yet
          await prisma.agentAction.create({
            data: {
              agentType:     this.agentType,
              actionType:    ActionType.SMS_SEND,
              leadId:        lead.id,
              reasoning:     `Pending SMS approval for rule "${rule.name}"`,
              autonomyLevel: AutonomyLevel.SUGGEST_APPROVE,
              status:        ActionStatus.PENDING,
              metadata:      {
                ruleId:   rule.id,
                ruleName: rule.name,
                message:  resolvedMessage,
              },
            },
          });
          break;
        }

        // FULLY_AUTONOMOUS — send immediately
        const templateVars = ContextBuilder.buildVariables({ contact, lead: lead as any });
        await sendCustomerSms({
          to:        contact?.phone,
          message:   resolvedMessage,
          variables: templateVars,
          leadId:    lead.id,
          contactId: contact?.id,
        });
        break;
      }

      case 'change_stage': {
        const { targetStage } = action.config as { targetStage: string };
        if (lead.stage === targetStage) {
          this.log('info', `Lead ${lead.id} is already in stage ${targetStage}. Skipping stage change to prevent loops.`);
          break;
        }
        await prisma.lead.update({
          where: { id: lead.id },
          data: { stage: targetStage as Lead['stage'] },
        });
        await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
          leadId: lead.id,
          previousValue: lead.stage,
          newValue: targetStage,
          metadata: { triggeredByRule: rule.id, ruleName: rule.name },
        });
        break;
      }

      case 'create_task': {
        const {
          title,
          dueDaysOffset,
          assigneeId,
        } = action.config as {
          title: string;
          dueDaysOffset: number;
          assigneeId?: string;
        };
        const dueDate = new Date(
          Date.now() + dueDaysOffset * 24 * 60 * 60 * 1000
        );
        await prisma.leadTask.create({
          data: {
            leadId: lead.id,
            title,
            dueDate,
            assignedToId: assigneeId ?? null,
            createdById: null,
            status: 'PENDING',
            priority: 'MEDIUM',
          },
        });
        break;
      }

      case 'assign_lead': {
        const { assigneeId, strategy } = action.config as { assigneeId?: string, strategy?: 'specific' | 'round-robin' };
        
        let targetAssigneeId: string | null = assigneeId || null;

        if (strategy === 'round-robin') {
          // Find all active users and their current number of active leads
          const users = await prisma.crmUser.findMany({
            where: { isActive: true },
            select: {
              id: true,
              _count: {
                select: { assignedLeads: { where: { stage: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'] } } } }
              }
            }
          });

          if (users.length > 0) {
            // Sort users by the lowest count of active leads first
            users.sort((a, b) => a._count.assignedLeads - b._count.assignedLeads);
            targetAssigneeId = users[0].id;
            this.log('info', `Round-robin assignment selected user ${targetAssigneeId} with ${users[0]._count.assignedLeads} active leads.`);
          }
        }

        if (targetAssigneeId) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { assigneeId: targetAssigneeId },
          });
          
          await eventBus.emitCRMEvent(CRMEvent.LEAD_UPDATED, {
            leadId: lead.id,
            userId: 'SYSTEM',
            metadata: { assignedTo: targetAssigneeId, triggeredByRule: rule.id, ruleName: rule.name }
          });
        } else {
          this.log('warn', 'Assign lead action failed: No active users available for assignment.');
        }
        break;
      }

      case 'enroll_drip': {
        const { sequenceId } = action.config as { sequenceId: string };
        const dripAgent = new DripCampaignAgent();
        await dripAgent.enroll(lead.id, sequenceId, 'workflow_rule');
        break;
      }

      case 'notify_staff': {
        // Re-fetch the lead to get the latest assigneeId (it may have just been set by assign_lead)
        const freshLead = await prisma.lead.findUnique({ where: { id: lead.id } });
        const staffId = freshLead?.assigneeId;
        if (!staffId) {
          this.log('warn', 'Cannot notify staff: lead has no assignee', { leadId: lead.id });
          break;
        }
        
        const staff = await prisma.crmUser.findUnique({ where: { id: staffId } });
        if (staff) {
          this.log('info', `[NOTIFY STAFF] Dispatching email to ${staff.email} — new lead assigned: "${lead.title}"`);
          
          await prisma.activity.create({
            data: {
              type: 'NOTE',
              body: `System automatically notified assigned staff member ${staff.displayName} (${staff.email}) via email about this new lead.`,
              leadId: lead.id,
              userId: staff.id,
            }
          });
          
          await emailService.sendEmail({
            role: 'admin',
            subject: `New Lead Assigned: ${lead.title}`,
            text: `Hello ${staff.displayName},\n\nA new lead has been assigned to you: ${lead.title}.\n\nPlease check the CRM for details.`,
            html: `<p>Hello ${staff.displayName},</p><p>A new lead has been assigned to you: <strong>${lead.title}</strong>.</p><p>Please check the CRM for details.</p>`,
            fromName: 'Vyntrize CRM',
            to: staff.email,
            toName: staff.displayName || staff.email,
            leadId: lead.id,
            userId: staff.id,
          });
        }
        break;
      }

      case 'schedule_meeting': {
        const { generateMeetLink } = (action.config || {}) as { generateMeetLink?: boolean };
        const staffId = lead.assigneeId;
        
        if (!staffId) {
          this.log('warn', 'Cannot schedule meeting: lead has no assignee', { leadId: lead.id });
          break;
        }

        const metadata = context.eventData?.metadata as any;
        const startTime = metadata?.appointmentStartTime ? new Date(metadata.appointmentStartTime) : null;
        const endTime = metadata?.appointmentEndTime ? new Date(metadata.appointmentEndTime) : null;
        const description = metadata?.appointmentDescription || 'VyntRise Booking';

        if (!startTime || !endTime) {
          this.log('warn', 'Cannot schedule meeting: missing start/end time in event metadata', { leadId: lead.id });
          break;
        }

        const staff = await prisma.crmUser.findUnique({ where: { id: staffId } });
        const contact = await prisma.contact.findUnique({ where: { id: lead.contactId } });

        if (!staff || !contact) break;

        this.log('info', `[SCHEDULE MEETING] Syncing to Google Calendar for ${staff.email}`);

        const eventData = {
          title: lead.title,
          description: `Booking for ${contact.firstName} ${contact.lastName}. Service: ${description}`,
          startTime,
          endTime,
          isAllDay: false,
          generateMeetLink,
          attendees: [{ email: contact.email }],
        };

        const result = await syncEventToGoogle(staff.id, eventData);
        let hangoutLink = '';
        let externalId = '';

        if (result) {
          externalId = typeof result === 'string' ? result : result.id||'';
          hangoutLink = typeof result === 'string' ? '' : (result.hangoutLink || '');
        }

        // Save CalendarEvent in DB
        await prisma.calendarEvent.create({
          data: {
            title: eventData.title,
            description: eventData.description,
            startTime,
            endTime,
            isAllDay: false,
            userId: staff.id,
            leadId: lead.id,
            contactId: contact.id,
            externalId: externalId || null,
            syncedAt: externalId ? new Date() : null,
          }
        });

        // Send Branded HTML Email to the Customer
        const emailBody = `
Hi ${contact.firstName},

Your booking is confirmed!

**Service:** ${description}
**Time:** ${startTime.toLocaleString()} to ${endTime.toLocaleString()}

${hangoutLink ? `**Google Meet Link:** ${hangoutLink}` : ''}

We look forward to speaking with you!

Best,
${staff.displayName || staff.email}
        `.trim();

        await emailService.sendEmail({
            role: 'sales',
            subject: 'Booking Confirmed - VyntRise',
            text: emailBody,
            html: emailBody.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>'),
            from: staff.email,
            fromName: staff.displayName || 'VyntRise Team',
            to: contact.email,
            toName: `${contact.firstName} ${contact.lastName}`,
            leadId: lead.id,
            contactId: contact.id,
            userId: staff.id,
        });

        break;
      }

      default:
        this.log('warn', 'Unknown action type', { actionType: (action as RuleAction).type });
    }
  }

  // ─── getConfig ────────────────────────────────────────────────────────────

  getConfig(): AgentConfig {
    return {
      agentType: AgentType.WORKFLOW_RULE,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
    };
  }
}
