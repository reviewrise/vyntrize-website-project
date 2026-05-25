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

        default:
          // Unknown field — skip condition (treat as not met)
          return false;
      }

      // For stage field, only 'eq' is meaningful
      if (field === 'stage' || field === 'assigneeId') {
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
    rule: { id: string; name: string },
    context: AgentContext
  ): Promise<void> {
    switch (action.type) {
      case 'send_email': {
        const emailAgent = new EmailGenerationAgent();
        const { templateHint } = (action.config || {}) as { templateHint?: string };
        const result = await emailAgent.execute({ 
          leadId: lead.id,
          eventData: {
            ...context.eventData,
            templateHint,
            triggeredByRule: rule.id,  // bypass stage-change filter & throttling
            ruleName: rule.name,
          }
        });
        if (!result.success) {
          throw new Error(`EmailGenerationAgent failed: ${result.error || result.reasoning}`);
        }
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
        const { assigneeId } = action.config as { assigneeId: string };
        await prisma.lead.update({
          where: { id: lead.id },
          data: { assigneeId },
        });
        break;
      }

      case 'enroll_drip': {
        const { sequenceId } = action.config as { sequenceId: string };
        const dripAgent = new DripCampaignAgent();
        await dripAgent.enroll(lead.id, sequenceId, 'workflow_rule');
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
