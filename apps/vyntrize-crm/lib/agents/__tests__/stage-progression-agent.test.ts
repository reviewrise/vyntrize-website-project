/**
 * Unit tests for StageProgressionAgent
 *
 * These tests mock prisma and eventBus so no real database connection is needed.
 */

// ─── Mocks (must be declared before imports) ─────────────────────────────────

const mockPrismaLead = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
};

const mockPrismaStageProgressionRule = {
  findMany: jest.fn(),
};

const mockPrismaAgentAction = {
  create: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    lead: mockPrismaLead,
    stageProgressionRule: mockPrismaStageProgressionRule,
    agentAction: mockPrismaAgentAction,
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

// ─── Imports ──────────────────────────────────────────────────────────────────

import { StageProgressionAgent } from '../stage-progression-agent';
import { ActionStatus, ActionType, AutonomyLevel } from '../base-agent';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    stage: 'CONTACTED',
    score: 50,
    manualOverride: false,
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    emailTracking: [],
    leadTasks: [],
    leadScores: [],
    ...overrides,
  };
}

function makeRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    fromStage: 'CONTACTED',
    toStage: 'QUALIFIED',
    criteria: {},
    autonomyLevel: 'FULLY_AUTONOMOUS',
    isActive: true,
    ...overrides,
  };
}

function makeAction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'action-1',
    leadId: 'lead-1',
    agentType: 'STAGE_PROGRESSION',
    actionType: 'STAGE_CHANGE',
    status: 'PENDING',
    metadata: { fromStage: 'CONTACTED', toStage: 'QUALIFIED' },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StageProgressionAgent', () => {
  let agent: StageProgressionAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: recordAction returns an action id
    mockPrismaAgentAction.create.mockResolvedValue({ id: 'action-1' });
    agent = new StageProgressionAgent();
  });

  // ─── getConfig ─────────────────────────────────────────────────────────────

  describe('getConfig()', () => {
    it('returns STAGE_PROGRESSION agent type with daily cron', () => {
      const config = agent.getConfig();
      expect(config.agentType).toBe('STAGE_PROGRESSION');
      expect(config.executionFrequency).toBe('0 2 * * *');
      expect(config.autonomyLevel).toBe(AutonomyLevel.SUGGEST_APPROVE);
    });
  });

  // ─── Criteria evaluation ───────────────────────────────────────────────────

  describe('criteria evaluation', () => {
    it('creates an AgentAction when all criteria pass', async () => {
      const lead = makeLead({ score: 70 });
      const rule = makeRule({ criteria: { minScore: 60 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.update.mockResolvedValue({ ...lead, stage: 'QUALIFIED' });

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).toHaveBeenCalledTimes(1);
      const createCall = mockPrismaAgentAction.create.mock.calls[0][0];
      expect(createCall.data.actionType).toBe(ActionType.STAGE_CHANGE);
      expect(createCall.data.metadata).toMatchObject({
        fromStage: 'CONTACTED',
        toStage: 'QUALIFIED',
      });
    });

    it('does NOT create an AgentAction when minScore criterion fails', async () => {
      const lead = makeLead({ score: 40 });
      const rule = makeRule({ criteria: { minScore: 60 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });

    it('does NOT create an AgentAction when minEmailOpens criterion fails', async () => {
      const lead = makeLead({
        emailTracking: [
          // opened but older than 30 days
          { openedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), sentAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), clickedAt: null },
        ],
      });
      const rule = makeRule({ criteria: { minEmailOpens: 1 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });

    it('creates an AgentAction when minEmailOpens criterion passes (recent open)', async () => {
      const lead = makeLead({
        emailTracking: [
          { openedAt: new Date(), sentAt: new Date(), clickedAt: null },
        ],
      });
      const rule = makeRule({ criteria: { minEmailOpens: 1 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.update.mockResolvedValue({ ...lead, stage: 'QUALIFIED' });

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).toHaveBeenCalledTimes(1);
    });

    it('does NOT create an AgentAction when minCompletedTasks criterion fails', async () => {
      const lead = makeLead({
        leadTasks: [{ status: 'PENDING' }, { status: 'IN_PROGRESS' }],
      });
      const rule = makeRule({ criteria: { minCompletedTasks: 1 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });

    it('creates an AgentAction when minCompletedTasks criterion passes', async () => {
      const lead = makeLead({
        leadTasks: [{ status: 'COMPLETED' }, { status: 'PENDING' }],
      });
      const rule = makeRule({ criteria: { minCompletedTasks: 1 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.update.mockResolvedValue({ ...lead, stage: 'QUALIFIED' });

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).toHaveBeenCalledTimes(1);
    });

    it('does NOT create an AgentAction when maxDaysInStage criterion fails (too many days)', async () => {
      const lead = makeLead({
        // 20 days ago
        updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      });
      const rule = makeRule({ criteria: { maxDaysInStage: 10 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });

    it('does NOT create an AgentAction when only some criteria pass (partial satisfaction)', async () => {
      const lead = makeLead({ score: 70, leadTasks: [] });
      // Both criteria must pass; minCompletedTasks will fail
      const rule = makeRule({ criteria: { minScore: 60, minCompletedTasks: 2 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });

    it('creates an AgentAction when ALL multiple criteria pass', async () => {
      const lead = makeLead({
        score: 80,
        leadTasks: [{ status: 'COMPLETED' }, { status: 'COMPLETED' }],
        emailTracking: [
          { openedAt: new Date(), sentAt: new Date(), clickedAt: new Date() },
        ],
      });
      const rule = makeRule({
        criteria: { minScore: 60, minCompletedTasks: 2, minEmailOpens: 1 },
      });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.update.mockResolvedValue({ ...lead, stage: 'QUALIFIED' });

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Manual override skip ──────────────────────────────────────────────────

  describe('manual override skip', () => {
    it('does NOT create any AgentAction when lead.manualOverride is true', async () => {
      const lead = makeLead({ manualOverride: true, score: 100 });
      const rule = makeRule({ criteria: { minScore: 0 } });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      // No rules should even be queried, and no action created
      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });

    it('does NOT emit stage_changed when lead.manualOverride is true', async () => {
      const lead = makeLead({ manualOverride: true });

      mockPrismaLead.findUnique.mockResolvedValue(lead);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockEmitCRMEvent).not.toHaveBeenCalled();
    });
  });

  // ─── WON/LOST safety override ──────────────────────────────────────────────

  describe('WON/LOST safety override', () => {
    it('forces SUGGEST_APPROVE when rule targets WON, even if rule is FULLY_AUTONOMOUS', async () => {
      const lead = makeLead({ score: 100 });
      const rule = makeRule({
        toStage: 'WON',
        autonomyLevel: 'FULLY_AUTONOMOUS',
        criteria: { minScore: 50 },
      });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).toHaveBeenCalledTimes(1);
      const createCall = mockPrismaAgentAction.create.mock.calls[0][0];
      // Must be SUGGEST_APPROVE (PENDING status), not EXECUTED
      expect(createCall.data.autonomyLevel).toBe(AutonomyLevel.SUGGEST_APPROVE);
      expect(createCall.data.status).toBe(ActionStatus.PENDING);
    });

    it('forces SUGGEST_APPROVE when rule targets LOST, even if rule is FULLY_AUTONOMOUS', async () => {
      const lead = makeLead({ score: 100 });
      const rule = makeRule({
        toStage: 'LOST',
        autonomyLevel: 'FULLY_AUTONOMOUS',
        criteria: { minScore: 50 },
      });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).toHaveBeenCalledTimes(1);
      const createCall = mockPrismaAgentAction.create.mock.calls[0][0];
      expect(createCall.data.autonomyLevel).toBe(AutonomyLevel.SUGGEST_APPROVE);
      expect(createCall.data.status).toBe(ActionStatus.PENDING);
    });

    it('does NOT update lead.stage when targeting WON (stays PENDING)', async () => {
      const lead = makeLead({ score: 100 });
      const rule = makeRule({
        toStage: 'WON',
        autonomyLevel: 'FULLY_AUTONOMOUS',
        criteria: { minScore: 50 },
      });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      // lead.update should NOT be called because it's SUGGEST_APPROVE
      expect(mockPrismaLead.update).not.toHaveBeenCalled();
      expect(mockEmitCRMEvent).not.toHaveBeenCalled();
    });
  });

  // ─── SUGGEST_APPROVE path ──────────────────────────────────────────────────

  describe('SUGGEST_APPROVE path', () => {
    it('creates a PENDING AgentAction and does NOT update lead stage', async () => {
      const lead = makeLead({ score: 80 });
      const rule = makeRule({
        autonomyLevel: 'SUGGEST_APPROVE',
        criteria: { minScore: 60 },
      });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaAgentAction.create).toHaveBeenCalledTimes(1);
      const createCall = mockPrismaAgentAction.create.mock.calls[0][0];
      expect(createCall.data.status).toBe(ActionStatus.PENDING);
      expect(createCall.data.autonomyLevel).toBe(AutonomyLevel.SUGGEST_APPROVE);

      // Stage should NOT be updated
      expect(mockPrismaLead.update).not.toHaveBeenCalled();
      expect(mockEmitCRMEvent).not.toHaveBeenCalled();
    });
  });

  // ─── FULLY_AUTONOMOUS path ─────────────────────────────────────────────────

  describe('FULLY_AUTONOMOUS path', () => {
    it('updates lead.stage and emits stage_changed event', async () => {
      const lead = makeLead({ score: 80 });
      const rule = makeRule({
        autonomyLevel: 'FULLY_AUTONOMOUS',
        criteria: { minScore: 60 },
      });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.update.mockResolvedValue({ ...lead, stage: 'QUALIFIED' });

      await agent.execute({ leadId: 'lead-1' });

      expect(mockPrismaLead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { stage: 'QUALIFIED' },
      });
      expect(mockEmitCRMEvent).toHaveBeenCalledWith(
        'stage_changed',
        expect.objectContaining({
          leadId: 'lead-1',
          previousValue: 'CONTACTED',
          newValue: 'QUALIFIED',
        })
      );
    });

    it('creates an EXECUTED AgentAction for FULLY_AUTONOMOUS', async () => {
      const lead = makeLead({ score: 80 });
      const rule = makeRule({
        autonomyLevel: 'FULLY_AUTONOMOUS',
        criteria: { minScore: 60 },
      });

      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([rule]);
      mockPrismaLead.update.mockResolvedValue({ ...lead, stage: 'QUALIFIED' });

      await agent.execute({ leadId: 'lead-1' });

      const createCall = mockPrismaAgentAction.create.mock.calls[0][0];
      expect(createCall.data.status).toBe(ActionStatus.EXECUTED);
      expect(createCall.data.executedAt).toBeInstanceOf(Date);
    });
  });

  // ─── Batch job ─────────────────────────────────────────────────────────────

  describe('batchEvaluateAllLeads()', () => {
    it('calls evaluateLead for each eligible lead (not WON/LOST, not manualOverride)', async () => {
      const leads = [
        { id: 'lead-a' },
        { id: 'lead-b' },
        { id: 'lead-c' },
      ];

      mockPrismaLead.findMany.mockResolvedValue(leads);
      // Each evaluateLead call: findUnique returns a lead with no matching rules
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([]);

      const result = await agent.execute({});

      expect(result.success).toBe(true);
      // findUnique called once per lead
      expect(mockPrismaLead.findUnique).toHaveBeenCalledTimes(3);
    });

    it('queries only leads where stage NOT IN WON/LOST and manualOverride=false', async () => {
      mockPrismaLead.findMany.mockResolvedValue([]);

      await agent.execute({});

      expect(mockPrismaLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            stage: { notIn: ['WON', 'LOST'] },
            manualOverride: false,
          },
        })
      );
    });

    it('returns a summary with evaluated count', async () => {
      const leads = [{ id: 'lead-a' }, { id: 'lead-b' }];
      mockPrismaLead.findMany.mockResolvedValue(leads);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      mockPrismaStageProgressionRule.findMany.mockResolvedValue([]);

      const result = await agent.execute({});

      expect(result.success).toBe(true);
      expect(result.metadata).toMatchObject({ total: 2, evaluated: 2, errors: 0 });
    });
  });

  // ─── applyApprovedAction ───────────────────────────────────────────────────

  describe('applyApprovedAction()', () => {
    it('updates lead stage, emits event, and marks action EXECUTED', async () => {
      const action = makeAction({
        metadata: { fromStage: 'CONTACTED', toStage: 'QUALIFIED', ruleId: 'rule-1' },
      });

      mockPrismaAgentAction.findUnique.mockResolvedValue(action);
      mockPrismaLead.update.mockResolvedValue({});
      mockPrismaAgentAction.update.mockResolvedValue({});

      await agent.applyApprovedAction('action-1');

      expect(mockPrismaLead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { stage: 'QUALIFIED' },
      });
      expect(mockEmitCRMEvent).toHaveBeenCalledWith(
        'stage_changed',
        expect.objectContaining({
          leadId: 'lead-1',
          previousValue: 'CONTACTED',
          newValue: 'QUALIFIED',
        })
      );
      expect(mockPrismaAgentAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'action-1' },
          data: expect.objectContaining({
            status: ActionStatus.EXECUTED,
            executedAt: expect.any(Date),
          }),
        })
      );
    });

    it('does nothing when action is not found', async () => {
      mockPrismaAgentAction.findUnique.mockResolvedValue(null);

      await agent.applyApprovedAction('nonexistent-action');

      expect(mockPrismaLead.update).not.toHaveBeenCalled();
      expect(mockEmitCRMEvent).not.toHaveBeenCalled();
    });
  });
});
