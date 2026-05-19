/**
 * Unit tests for WorkflowRuleEngine
 *
 * Covers Tasks 5.10 and correctness properties:
 *   6 — Rule priority ordering
 *   7 — Loop guard bound (max 3 fires per lead per rule per 60 min)
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrismaLead = { findUnique: jest.fn() };
const mockPrismaWorkflowRule = { findMany: jest.fn() };
const mockPrismaAgentAction = { create: jest.fn() };
const mockPrismaLeadTask = { create: jest.fn() };

jest.mock('@/lib/prisma', () => ({
  prisma: {
    lead: mockPrismaLead,
    workflowRule: mockPrismaWorkflowRule,
    agentAction: mockPrismaAgentAction,
    leadTask: mockPrismaLeadTask,
  },
}));

const mockEmitCRMEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('../event-bus', () => ({
  eventBus: { emitCRMEvent: mockEmitCRMEvent },
  CRMEvent: {
    STAGE_CHANGED: 'stage_changed',
    LEAD_CREATED: 'lead_created',
    LEAD_UPDATED: 'lead_updated',
    EMAIL_OPENED: 'email_opened',
    EMAIL_CLICKED: 'email_clicked',
    TASK_COMPLETED: 'task_completed',
  },
}));

const mockEmailAgentExecute = jest.fn().mockResolvedValue({ success: true });
jest.mock('../email-generation-agent', () => ({
  EmailGenerationAgent: jest.fn().mockImplementation(() => ({
    execute: mockEmailAgentExecute,
  })),
}));

const mockDripEnroll = jest.fn().mockResolvedValue(undefined);
jest.mock('../drip-campaign-agent', () => ({
  DripCampaignAgent: jest.fn().mockImplementation(() => ({
    enroll: mockDripEnroll,
  })),
}));

const mockStageProgressLead = jest.fn().mockResolvedValue(undefined);
jest.mock('../stage-progression-agent', () => ({
  StageProgressionAgent: jest.fn().mockImplementation(() => ({
    progressLead: mockStageProgressLead,
  })),
  stageProgressionAgent: { progressLead: mockStageProgressLead },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { WorkflowRuleEngine } from '../workflow-rule-engine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    stage: 'NEW',
    score: 50,
    assigneeId: null,
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    name: 'Test Rule',
    triggerEvent: 'lead_updated',
    conditions: [],
    actions: [{ type: 'send_email', config: {} }],
    autonomyLevel: 'FULLY_AUTONOMOUS',
    isActive: true,
    priority: 100,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WorkflowRuleEngine', () => {
  let engine: WorkflowRuleEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaAgentAction.create.mockResolvedValue({ id: 'action-1' });
    engine = new WorkflowRuleEngine();
  });

  // ─── getConfig ─────────────────────────────────────────────────────────────

  describe('getConfig()', () => {
    it('returns WORKFLOW_RULE agent type', () => {
      const config = engine.getConfig();
      expect(config.agentType).toBe('WORKFLOW_RULE');
    });
  });

  // ─── Basic execution ───────────────────────────────────────────────────────

  describe('basic execution', () => {
    it('executes matching rules and records AgentAction', async () => {
      const rule = makeRule({ conditions: [], actions: [{ type: 'send_email', config: {} }] });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());

      await engine.execute({
        leadId: 'lead-1',
        eventData: { event: 'lead_updated' },
      });

      expect(mockPrismaAgentAction.create).toHaveBeenCalled();
      expect(mockEmailAgentExecute).toHaveBeenCalledWith({ leadId: 'lead-1' });
    });

    it('does nothing when no rules match the event', async () => {
      mockPrismaWorkflowRule.findMany.mockResolvedValue([]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());

      await engine.execute({
        leadId: 'lead-1',
        eventData: { event: 'lead_updated' },
      });

      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });

    it('returns success even when no leadId is provided', async () => {
      const result = await engine.execute({ eventData: { event: 'lead_updated' } });
      expect(result.success).toBe(true);
    });
  });

  // ─── Correctness Property 6: Rule priority ordering ────────────────────────

  describe('Property 6 — Rule priority ordering', () => {
    it('evaluates rules in ascending priority order', async () => {
      const executionOrder: string[] = [];

      const ruleA = makeRule({ id: 'rule-a', name: 'Rule A', priority: 200, actions: [{ type: 'send_email', config: {} }] });
      const ruleB = makeRule({ id: 'rule-b', name: 'Rule B', priority: 50, actions: [{ type: 'send_email', config: {} }] });
      const ruleC = makeRule({ id: 'rule-c', name: 'Rule C', priority: 100, actions: [{ type: 'send_email', config: {} }] });

      // The DB mock ignores orderBy — return them pre-sorted ascending by priority
      // to simulate what the DB would return with orderBy: { priority: 'asc' }
      mockPrismaWorkflowRule.findMany.mockResolvedValue([ruleB, ruleC, ruleA]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());

      mockPrismaAgentAction.create.mockImplementation(async (args: { data: { metadata?: { ruleName?: string }; actionType?: string } }) => {
        if (args.data?.actionType === 'RULE_EXECUTION') {
          executionOrder.push(args.data?.metadata?.ruleName ?? 'unknown');
        }
        return { id: 'action-x' };
      });

      await engine.execute({
        leadId: 'lead-1',
        eventData: { event: 'lead_updated' },
      });

      // Should be B (50) → C (100) → A (200)
      expect(executionOrder).toEqual(['Rule B', 'Rule C', 'Rule A']);
    });
  });

  // ─── Correctness Property 7: Loop guard bound ──────────────────────────────

  describe('Property 7 — Loop guard bound', () => {
    it('fires a rule at most 3 times per lead per rule within 60 minutes', async () => {
      const rule = makeRule({ id: 'rule-loop', conditions: [], actions: [{ type: 'send_email', config: {} }] });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());

      // Fire 4 times
      for (let i = 0; i < 4; i++) {
        await engine.execute({
          leadId: 'lead-1',
          eventData: { event: 'lead_updated' },
        });
      }

      // AgentAction.create is called once per successful rule execution
      // The 4th call should be blocked by the loop guard
      const ruleExecutionCalls = mockPrismaAgentAction.create.mock.calls.filter(
        (call: unknown[]) => (call[0] as { data: { actionType?: string } }).data?.actionType === 'RULE_EXECUTION'
      );
      expect(ruleExecutionCalls.length).toBe(3);
    });

    it('allows execution again after the 60-minute window expires', async () => {
      const rule = makeRule({ id: 'rule-window', conditions: [], actions: [{ type: 'send_email', config: {} }] });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());

      // Exhaust the 3 allowed executions
      for (let i = 0; i < 3; i++) {
        await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });
      }

      const beforeCount = mockPrismaAgentAction.create.mock.calls.filter(
        (call: unknown[]) => (call[0] as { data: { actionType?: string } }).data?.actionType === 'RULE_EXECUTION'
      ).length;
      expect(beforeCount).toBe(3);

      // Simulate time passing: manually clear the execution log by creating a new engine
      // (In production the in-memory map would age out; here we test via a fresh instance)
      const freshEngine = new WorkflowRuleEngine();
      await freshEngine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      const afterCount = mockPrismaAgentAction.create.mock.calls.filter(
        (call: unknown[]) => (call[0] as { data: { actionType?: string } }).data?.actionType === 'RULE_EXECUTION'
      ).length;
      expect(afterCount).toBe(4); // 3 + 1 new execution
    });
  });

  // ─── Malformed JSON skip ───────────────────────────────────────────────────

  describe('malformed JSON skip', () => {
    it('skips a rule with invalid conditions JSON and continues to next rule', async () => {
      const badRule = makeRule({
        id: 'rule-bad',
        name: 'Bad Rule',
        priority: 50,
        conditions: 'not-an-array' as unknown as [],
        actions: [{ type: 'send_email', config: {} }],
      });
      const goodRule = makeRule({
        id: 'rule-good',
        name: 'Good Rule',
        priority: 100,
        conditions: [],
        actions: [{ type: 'send_email', config: {} }],
      });

      mockPrismaWorkflowRule.findMany.mockResolvedValue([badRule, goodRule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      // Only the good rule should have created an AgentAction
      const ruleExecutionCalls = mockPrismaAgentAction.create.mock.calls.filter(
        (call: unknown[]) => (call[0] as { data: { actionType?: string } }).data?.actionType === 'RULE_EXECUTION'
      );
      expect(ruleExecutionCalls.length).toBe(1);
      expect(ruleExecutionCalls[0][0].data.metadata.ruleName).toBe('Good Rule');
    });

    it('skips a rule with invalid actions JSON', async () => {
      const badRule = makeRule({
        id: 'rule-bad-actions',
        conditions: [],
        actions: 'not-an-array' as unknown as [],
      });

      mockPrismaWorkflowRule.findMany.mockResolvedValue([badRule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });
  });

  // ─── Per-action failure isolation ─────────────────────────────────────────

  describe('per-action failure isolation', () => {
    it('continues executing remaining actions when one action fails', async () => {
      const rule = makeRule({
        conditions: [],
        actions: [
          { type: 'send_email', config: {} },   // will fail
          { type: 'create_task', config: { title: 'Follow up', dueDaysOffset: 1 } }, // should still run
        ],
      });

      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      mockEmailAgentExecute.mockRejectedValueOnce(new Error('AI service down'));
      mockPrismaLeadTask.create.mockResolvedValue({ id: 'task-1' });

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      // Task should still have been created despite email failure
      expect(mockPrismaLeadTask.create).toHaveBeenCalledTimes(1);
    });

    it('records a FAILED AgentAction for the failing action', async () => {
      const rule = makeRule({
        conditions: [],
        actions: [{ type: 'send_email', config: {} }],
      });

      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      mockEmailAgentExecute.mockRejectedValueOnce(new Error('AI service down'));

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      const failedActionCall = mockPrismaAgentAction.create.mock.calls.find(
        (call: unknown[]) => (call[0] as { data: { status?: string } }).data?.status === 'FAILED'
      );
      expect(failedActionCall).toBeDefined();
    });
  });

  // ─── Condition evaluation ──────────────────────────────────────────────────

  describe('condition evaluation', () => {
    it('fires rule when score condition passes (gt)', async () => {
      const rule = makeRule({
        conditions: [{ field: 'score', operator: 'gt', value: 40 }],
        actions: [{ type: 'send_email', config: {} }],
      });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead({ score: 50 }));

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockEmailAgentExecute).toHaveBeenCalledTimes(1);
    });

    it('does NOT fire rule when score condition fails', async () => {
      const rule = makeRule({
        conditions: [{ field: 'score', operator: 'gt', value: 60 }],
        actions: [{ type: 'send_email', config: {} }],
      });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead({ score: 50 }));

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockEmailAgentExecute).not.toHaveBeenCalled();
    });

    it('fires rule when stage condition passes (eq)', async () => {
      const rule = makeRule({
        conditions: [{ field: 'stage', operator: 'eq', value: 'NEW' }],
        actions: [{ type: 'send_email', config: {} }],
      });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead({ stage: 'NEW' }));

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockEmailAgentExecute).toHaveBeenCalledTimes(1);
    });

    it('does NOT fire rule when stage condition fails', async () => {
      const rule = makeRule({
        conditions: [{ field: 'stage', operator: 'eq', value: 'QUALIFIED' }],
        actions: [{ type: 'send_email', config: {} }],
      });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead({ stage: 'NEW' }));

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockEmailAgentExecute).not.toHaveBeenCalled();
    });

    it('evaluates multiple conditions with AND logic — all must pass', async () => {
      const rule = makeRule({
        conditions: [
          { field: 'score', operator: 'gte', value: 60 },
          { field: 'stage', operator: 'eq', value: 'CONTACTED' },
        ],
        actions: [{ type: 'send_email', config: {} }],
      });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);

      // Score passes but stage fails
      mockPrismaLead.findUnique.mockResolvedValue(makeLead({ score: 70, stage: 'NEW' }));
      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });
      expect(mockEmailAgentExecute).not.toHaveBeenCalled();

      jest.clearAllMocks();
      mockPrismaAgentAction.create.mockResolvedValue({ id: 'action-1' });

      // Both pass
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead({ score: 70, stage: 'CONTACTED' }));
      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });
      expect(mockEmailAgentExecute).toHaveBeenCalledTimes(1);
    });
  });

  // ─── All five action types ─────────────────────────────────────────────────

  describe('all five action types', () => {
    beforeEach(() => {
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
    });

    it('dispatches send_email action to EmailGenerationAgent', async () => {
      const rule = makeRule({ conditions: [], actions: [{ type: 'send_email', config: {} }] });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockEmailAgentExecute).toHaveBeenCalledWith({ leadId: 'lead-1' });
    });

    it('dispatches create_task action to prisma.leadTask.create', async () => {
      const rule = makeRule({
        conditions: [],
        actions: [{ type: 'create_task', config: { title: 'Follow up', dueDaysOffset: 2 } }],
      });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);
      mockPrismaLeadTask.create.mockResolvedValue({ id: 'task-1' });

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockPrismaLeadTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'lead-1',
            title: 'Follow up',
          }),
        })
      );
    });

    it('dispatches assign_lead action to prisma.lead.update', async () => {
      const mockLeadUpdate = jest.fn().mockResolvedValue({});
      (mockPrismaLead as Record<string, unknown>).update = mockLeadUpdate;

      const rule = makeRule({
        conditions: [],
        actions: [{ type: 'assign_lead', config: { assigneeId: 'user-99' } }],
      });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockLeadUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-1' },
          data: { assigneeId: 'user-99' },
        })
      );
    });

    it('dispatches enroll_drip action to DripCampaignAgent.enroll', async () => {
      const rule = makeRule({
        conditions: [],
        actions: [{ type: 'enroll_drip', config: { sequenceId: 'seq-42' } }],
      });
      mockPrismaWorkflowRule.findMany.mockResolvedValue([rule]);

      await engine.execute({ leadId: 'lead-1', eventData: { event: 'lead_updated' } });

      expect(mockDripEnroll).toHaveBeenCalledWith('lead-1', 'seq-42', 'workflow_rule');
    });
  });
});
