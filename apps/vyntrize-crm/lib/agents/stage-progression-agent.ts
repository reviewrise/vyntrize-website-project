// Stage Progression Agent — evaluates configurable criteria and advances leads
// between pipeline stages autonomously or via approval workflow.

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
import { ProgressionCriteria } from '@/lib/automation';
import type { Lead, EmailTracking, LeadTask, LeadScore, StageProgressionRule } from '@platform/vyntrize-db';

// Full lead shape fetched for evaluation
type LeadWithRelations = Lead & {
  emailTracking: EmailTracking[];
  leadTasks: LeadTask[];
  leadScores: LeadScore[];
};

export class StageProgressionAgent extends Agent {
  constructor() {
    super(AgentType.STAGE_PROGRESSION);
  }

  // ─── execute ──────────────────────────────────────────────────────────────

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!this.enabled) {
      return {
        success: true,
        reasoning: 'StageProgressionAgent is disabled via feature flag',
      };
    }

    if (context.leadId) {
      await this.evaluateLead(context.leadId);
      return {
        success: true,
        reasoning: `Evaluated lead ${context.leadId} for stage progression`,
      };
    }

    return this.batchEvaluateAllLeads();
  }

  // ─── evaluateLead ─────────────────────────────────────────────────────────

  private async evaluateLead(leadId: string): Promise<void> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        emailTracking: true,
        leadTasks: true,
        leadScores: true,
      },
    });

    if (!lead) {
      this.log('warn', 'Lead not found during evaluation', { leadId });
      return;
    }

    // Manual override — skip without creating any AgentAction
    if (lead.manualOverride) {
      this.log('info', 'Skipping lead with manualOverride=true', { leadId });
      return;
    }

    // Fetch active rules that apply to the lead's current stage
    const rules = await prisma.stageProgressionRule.findMany({
      where: {
        fromStage: lead.stage,
        isActive: true,
      },
    });

    for (const rule of rules) {
      const criteriaMet = await this.checkCriteria(lead as LeadWithRelations, rule);
      if (criteriaMet) {
        await this.progressLead(lead as LeadWithRelations, rule);
      }
    }
  }

  // ─── checkCriteria ────────────────────────────────────────────────────────

  private async checkCriteria(
    lead: LeadWithRelations,
    rule: StageProgressionRule
  ): Promise<boolean> {
    const criteria = rule.criteria as ProgressionCriteria;

    // minScore
    if (criteria.minScore !== undefined) {
      const score = lead.score ?? 0;
      if (score < criteria.minScore) return false;
    }

    // 30-day window for email metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // minEmailOpens
    if (criteria.minEmailOpens !== undefined) {
      const opens = lead.emailTracking.filter(
        (e) => e.openedAt !== null && e.sentAt >= thirtyDaysAgo
      ).length;
      if (opens < criteria.minEmailOpens) return false;
    }

    // minEmailClicks
    if (criteria.minEmailClicks !== undefined) {
      const clicks = lead.emailTracking.filter(
        (e) => e.clickedAt !== null && e.sentAt >= thirtyDaysAgo
      ).length;
      if (clicks < criteria.minEmailClicks) return false;
    }

    // minCompletedTasks
    if (criteria.minCompletedTasks !== undefined) {
      const completed = lead.leadTasks.filter(
        (t) => t.status === 'COMPLETED'
      ).length;
      if (completed < criteria.minCompletedTasks) return false;
    }

    // maxDaysInStage — uses lead.updatedAt as a proxy for when the stage last changed
    if (criteria.maxDaysInStage !== undefined) {
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysInStage = Math.floor(
        (now.getTime() - lead.updatedAt.getTime()) / msPerDay
      );
      if (daysInStage > criteria.maxDaysInStage) return false;
    }

    return true;
  }

  // ─── progressLead ─────────────────────────────────────────────────────────

  private async progressLead(
    lead: LeadWithRelations,
    rule: StageProgressionRule
  ): Promise<void> {
    const criteria = rule.criteria as ProgressionCriteria;

    // Safety override: WON / LOST always require human approval
    let effectiveAutonomy: AutonomyLevel = rule.autonomyLevel as AutonomyLevel;
    if (rule.toStage === 'WON' || rule.toStage === 'LOST') {
      effectiveAutonomy = AutonomyLevel.SUGGEST_APPROVE;
    }

    // Build criteria snapshot for audit metadata
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const criteriaValues: Record<string, number> = {};
    if (criteria.minScore !== undefined) {
      criteriaValues.score = lead.score ?? 0;
    }
    if (criteria.minEmailOpens !== undefined) {
      criteriaValues.emailOpens = lead.emailTracking.filter(
        (e) => e.openedAt !== null && e.sentAt >= thirtyDaysAgo
      ).length;
    }
    if (criteria.minEmailClicks !== undefined) {
      criteriaValues.emailClicks = lead.emailTracking.filter(
        (e) => e.clickedAt !== null && e.sentAt >= thirtyDaysAgo
      ).length;
    }
    if (criteria.minCompletedTasks !== undefined) {
      criteriaValues.completedTasks = lead.leadTasks.filter(
        (t) => t.status === 'COMPLETED'
      ).length;
    }
    if (criteria.maxDaysInStage !== undefined) {
      const msPerDay = 1000 * 60 * 60 * 24;
      criteriaValues.daysInStage = Math.floor(
        (Date.now() - lead.updatedAt.getTime()) / msPerDay
      );
    }

    const reasoning = `Lead meets all criteria for progression from ${rule.fromStage} to ${rule.toStage}. Criteria values: ${JSON.stringify(criteriaValues)}`;

    const actionId = await this.recordAction(
      ActionType.STAGE_CHANGE,
      lead.id,
      reasoning,
      effectiveAutonomy,
      {
        fromStage: rule.fromStage,
        toStage: rule.toStage,
        ruleId: rule.id,
        criteriaValues,
      }
    );

    if (effectiveAutonomy === AutonomyLevel.FULLY_AUTONOMOUS) {
      // Apply the stage change immediately
      await prisma.lead.update({
        where: { id: lead.id },
        data: { stage: rule.toStage },
      });

      await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
        leadId: lead.id,
        previousValue: rule.fromStage,
        newValue: rule.toStage,
        metadata: { agentActionId: actionId, ruleId: rule.id },
      });

      this.log('info', 'Lead stage progressed autonomously', {
        leadId: lead.id,
        fromStage: rule.fromStage,
        toStage: rule.toStage,
      });
    } else {
      // SUGGEST_APPROVE — action stays PENDING, awaiting human approval
      this.log('info', 'Stage progression pending approval', {
        leadId: lead.id,
        fromStage: rule.fromStage,
        toStage: rule.toStage,
        actionId,
      });
    }
  }

  // ─── batchEvaluateAllLeads ────────────────────────────────────────────────

  private async batchEvaluateAllLeads(): Promise<AgentActionResult> {
    const leads = await prisma.lead.findMany({
      where: {
        stage: { notIn: ['WON', 'LOST'] },
        manualOverride: false,
      },
      select: { id: true },
    });

    this.log('info', `Batch evaluating ${leads.length} leads for stage progression`);

    let evaluated = 0;
    let errors = 0;

    for (const { id } of leads) {
      try {
        await this.evaluateLead(id);
        evaluated++;
      } catch (err) {
        errors++;
        this.log('error', 'Error evaluating lead in batch', { leadId: id, err });
      }
    }

    return {
      success: true,
      reasoning: `Batch evaluation complete. Evaluated: ${evaluated}, Errors: ${errors}`,
      metadata: { total: leads.length, evaluated, errors },
    };
  }

  // ─── applyApprovedAction ──────────────────────────────────────────────────

  /**
   * Called by the approve endpoint after a SUGGEST_APPROVE action is approved.
   * Applies the stage change, emits the event, and marks the action EXECUTED.
   */
  async applyApprovedAction(actionId: string): Promise<void> {
    const action = await prisma.agentAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      this.log('error', 'AgentAction not found for applyApprovedAction', { actionId });
      return;
    }

    const metadata = action.metadata as Record<string, unknown>;
    const toStage = metadata.toStage as string;
    const fromStage = metadata.fromStage as string;

    // Update lead stage
    await prisma.lead.update({
      where: { id: action.leadId },
      data: { stage: toStage as any },
    });

    // Emit stage_changed event
    await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
      leadId: action.leadId,
      previousValue: fromStage,
      newValue: toStage,
      metadata: { agentActionId: actionId },
    });

    // Mark action as EXECUTED
    await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: ActionStatus.EXECUTED,
        executedAt: new Date(),
      },
    });

    this.log('info', 'Approved stage progression applied', {
      leadId: action.leadId,
      fromStage,
      toStage,
      actionId,
    });
  }

  // ─── getConfig ────────────────────────────────────────────────────────────

  getConfig(): AgentConfig {
    return {
      agentType: AgentType.STAGE_PROGRESSION,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.SUGGEST_APPROVE,
      executionFrequency: '0 2 * * *',
    };
  }
}

// Singleton instance for use in API routes
export const stageProgressionAgent = new StageProgressionAgent();
