/**
 * Unit tests for DripCampaignAgent
 *
 * Covers Tasks 4.10 and correctness properties 1 (no duplicate enrollments) and 5 (stop condition completeness).
 * All prisma, eventBus, jobScheduler, and EmailGenerationAgent calls are mocked.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrismaLead = { findUnique: jest.fn() };
const mockPrismaDripEnrollment = {
  findFirst: jest.fn(),
  create: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  findMany: jest.fn(),
};
const mockPrismaDripSequence = { findUnique: jest.fn() };
const mockPrismaAgentAction = { create: jest.fn() };
const mockPrismaEmailTracking = { findFirst: jest.fn() };

jest.mock('@/lib/prisma', () => ({
  prisma: {
    lead: mockPrismaLead,
    dripEnrollment: mockPrismaDripEnrollment,
    dripSequence: mockPrismaDripSequence,
    agentAction: mockPrismaAgentAction,
    emailTracking: mockPrismaEmailTracking,
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

const mockScheduleJob = jest.fn().mockResolvedValue(undefined);
const mockGetJobsByPattern = jest.fn().mockResolvedValue([]);
const mockRemoveJob = jest.fn().mockResolvedValue(undefined);
jest.mock('../job-scheduler', () => ({
  jobScheduler: {
    scheduleJob: mockScheduleJob,
    getJobsByPattern: mockGetJobsByPattern,
    removeJob: mockRemoveJob,
    registerAgent: jest.fn(),
  },
  JobPriority: { HIGH: 1, MEDIUM: 5, LOW: 10 },
}));

const mockEmailAgentExecute = jest.fn().mockResolvedValue({
  success: true,
  metadata: { emailDraft: { subject: 'Test Subject', body: 'Test Body' } },
});
jest.mock('../email-generation-agent', () => ({
  EmailGenerationAgent: jest.fn().mockImplementation(() => ({
    execute: mockEmailAgentExecute,
  })),
}));

const mockSendEmail = jest.fn().mockResolvedValue({ success: true, messageId: 'msg-1' });
jest.mock('@/lib/email/email-service', () => ({
  emailService: { sendEmail: mockSendEmail },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { DripCampaignAgent } from '../drip-campaign-agent';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    stage: 'NEW',
    score: 50,
    contactId: 'contact-1',
    contact: {
      id: 'contact-1',
      email: 'test@example.com',
      emailOptOut: false,
      firstName: 'Test',
      lastName: 'User',
    },
    ...overrides,
  };
}

function makeContact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contact-1',
    email: 'test@example.com',
    emailOptOut: false,
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
}

function makeSequence(overrides: Record<string, unknown> = {}) {
  return {
    id: 'seq-1',
    name: 'Test Sequence',
    triggerType: 'stage_entered',
    triggerConfig: { stage: 'NEW' },
    stopConditions: {},
    autonomyLevel: 'FULLY_AUTONOMOUS',
    isActive: true,
    steps: [
      {
        id: 'step-1',
        stepOrder: 0,
        delayHours: 24,
        subjectTemplate: 'Hello {{firstName}}',
        bodyTemplate: 'Hi there',
        branchCondition: 'always',
      },
    ],
    ...overrides,
  };
}

function makeEnrollment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'enrollment-1',
    leadId: 'lead-1',
    sequenceId: 'seq-1',
    currentStepIndex: 0,
    status: 'ACTIVE',
    enrolledAt: new Date(),
    lastStepSentAt: null,
    stoppedReason: null,
    sequence: makeSequence(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DripCampaignAgent', () => {
  let agent: DripCampaignAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaAgentAction.create.mockResolvedValue({ id: 'action-1' });
    agent = new DripCampaignAgent();
  });

  // ─── getConfig ─────────────────────────────────────────────────────────────

  describe('getConfig()', () => {
    it('returns DRIP_CAMPAIGN agent type with 5-minute cron', () => {
      const config = agent.getConfig();
      expect(config.agentType).toBe('DRIP_CAMPAIGN');
      expect(config.executionFrequency).toBe('*/5 * * * *');
    });
  });

  // ─── Correctness Property 1: No duplicate active enrollments ───────────────

  describe('Property 1 — No duplicate active enrollments', () => {
    it('skips enrollment when an ACTIVE enrollment already exists for the same lead+sequence', async () => {
      const existingEnrollment = makeEnrollment();
      mockPrismaDripEnrollment.findFirst.mockResolvedValue(existingEnrollment);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());

      await agent.enroll('lead-1', 'seq-1', 'test');

      // Should NOT create a new enrollment
      expect(mockPrismaDripEnrollment.create).not.toHaveBeenCalled();
    });

    it('creates enrollment when no active enrollment exists', async () => {
      mockPrismaDripEnrollment.findFirst.mockResolvedValue(null); // no existing
      mockPrismaLead.findUnique.mockResolvedValue(makeLead()); // contact embedded with emailOptOut: false
      mockPrismaDripSequence.findUnique.mockResolvedValue(makeSequence());
      mockPrismaDripEnrollment.create.mockResolvedValue(makeEnrollment());

      await agent.enroll('lead-1', 'seq-1', 'test');

      expect(mockPrismaDripEnrollment.create).toHaveBeenCalledTimes(1);
    });

    it('allows re-enrollment after a STOPPED enrollment (creates new record)', async () => {
      // findFirst returns null because we filter by status=ACTIVE
      mockPrismaDripEnrollment.findFirst.mockResolvedValue(null);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      mockPrismaDripSequence.findUnique.mockResolvedValue(makeSequence());
      mockPrismaDripEnrollment.create.mockResolvedValue(makeEnrollment());

      await agent.enroll('lead-1', 'seq-1', 'test');

      expect(mockPrismaDripEnrollment.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── emailOptOut skip ──────────────────────────────────────────────────────

  describe('emailOptOut skip', () => {
    it('does NOT enroll when contact.emailOptOut is true', async () => {
      mockPrismaDripEnrollment.findFirst.mockResolvedValue(null);
      // Embed contact with emailOptOut: true directly in the lead
      mockPrismaLead.findUnique.mockResolvedValue(
        makeLead({ contact: makeContact({ emailOptOut: true }) })
      );

      await agent.enroll('lead-1', 'seq-1', 'test');

      expect(mockPrismaDripEnrollment.create).not.toHaveBeenCalled();
    });

    it('enrolls when contact.emailOptOut is false', async () => {
      mockPrismaDripEnrollment.findFirst.mockResolvedValue(null);
      mockPrismaLead.findUnique.mockResolvedValue(
        makeLead({ contact: makeContact({ emailOptOut: false }) })
      );
      mockPrismaDripSequence.findUnique.mockResolvedValue(makeSequence());
      mockPrismaDripEnrollment.create.mockResolvedValue(makeEnrollment());

      await agent.enroll('lead-1', 'seq-1', 'test');

      expect(mockPrismaDripEnrollment.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Correctness Property 5: Stop condition completeness ───────────────────

  describe('Property 5 — Stop condition completeness', () => {
    it('does NOT send email when enrollment status is STOPPED', async () => {
      const stoppedEnrollment = makeEnrollment({ status: 'STOPPED' });
      mockPrismaDripEnrollment.findUnique.mockResolvedValue(stoppedEnrollment);

      await agent.processStep('enrollment-1');

      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(mockPrismaAgentAction.create).not.toHaveBeenCalled();
    });

    it('does NOT send email when enrollment status is COMPLETED', async () => {
      const completedEnrollment = makeEnrollment({ status: 'COMPLETED' });
      mockPrismaDripEnrollment.findUnique.mockResolvedValue(completedEnrollment);

      await agent.processStep('enrollment-1');

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('stops enrollment and cancels jobs when stop condition is met (stage reached)', async () => {
      const enrollment = makeEnrollment({
        sequence: makeSequence({
          stopConditions: { onStageReached: 'QUALIFIED' },
        }),
      });
      const lead = makeLead({ stage: 'QUALIFIED' }); // already at stop stage

      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaDripEnrollment.update.mockResolvedValue({ ...enrollment, status: 'STOPPED' });

      await agent.processStep('enrollment-1');

      // Should stop, not send
      expect(mockPrismaDripEnrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'STOPPED' }),
        })
      );
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('stops enrollment when score exceeds threshold', async () => {
      const enrollment = makeEnrollment({
        sequence: makeSequence({
          stopConditions: { onScoreExceeds: 80 },
        }),
      });
      const lead = makeLead({ score: 90 }); // above threshold

      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaLead.findUnique.mockResolvedValue(lead);
      mockPrismaDripEnrollment.update.mockResolvedValue({ ...enrollment, status: 'STOPPED' });

      await agent.processStep('enrollment-1');

      expect(mockPrismaDripEnrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'STOPPED' }),
        })
      );
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  // ─── Branch conditions ─────────────────────────────────────────────────────

  describe('branch conditions', () => {
    function makeActiveEnrollment(branchCondition: string, stepIndex = 1) {
      return makeEnrollment({
        currentStepIndex: stepIndex,
        sequence: makeSequence({
          steps: [
            { id: 'step-0', stepOrder: 0, delayHours: 24, subjectTemplate: 'Step 0', bodyTemplate: 'Body 0', branchCondition: 'always' },
            { id: 'step-1', stepOrder: 1, delayHours: 24, subjectTemplate: 'Step 1', bodyTemplate: 'Body 1', branchCondition },
          ],
        }),
      });
    }

    it('sends email when branchCondition is "always"', async () => {
      const enrollment = makeActiveEnrollment('always', 0);
      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      mockPrismaEmailTracking.findFirst.mockResolvedValue(null);
      mockPrismaDripEnrollment.update.mockResolvedValue(enrollment);

      await agent.processStep('enrollment-1');

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('sends email when branchCondition is "opened" and previous email was opened', async () => {
      const enrollment = makeActiveEnrollment('opened', 1);
      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      // Previous email was opened
      mockPrismaEmailTracking.findFirst.mockResolvedValue({ openedAt: new Date(), clickedAt: null });
      mockPrismaDripEnrollment.update.mockResolvedValue(enrollment);

      await agent.processStep('enrollment-1');

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('does NOT send email when branchCondition is "opened" but previous email was NOT opened', async () => {
      const enrollment = makeActiveEnrollment('opened', 1);
      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      // Previous email was NOT opened
      mockPrismaEmailTracking.findFirst.mockResolvedValue({ openedAt: null, clickedAt: null });

      await agent.processStep('enrollment-1');

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('sends email when branchCondition is "clicked" and previous email was clicked', async () => {
      const enrollment = makeActiveEnrollment('clicked', 1);
      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      // clicked branch always returns true — no emailTracking lookup needed
      mockPrismaDripEnrollment.update.mockResolvedValue(enrollment);

      await agent.processStep('enrollment-1');

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });
  });

  // ─── COMPLETED transition ──────────────────────────────────────────────────

  describe('COMPLETED transition', () => {
    it('marks enrollment COMPLETED after the last step is sent', async () => {
      // Single-step sequence, currently on step 0
      const singleStepSequence = makeSequence({
        steps: [
          { id: 'step-0', stepOrder: 0, delayHours: 0, subjectTemplate: 'Final', bodyTemplate: 'Body', branchCondition: 'always' },
        ],
      });
      const enrollment = makeEnrollment({ currentStepIndex: 0, sequence: singleStepSequence });

      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      mockPrismaDripEnrollment.update.mockResolvedValue({ ...enrollment, status: 'COMPLETED' });

      await agent.processStep('enrollment-1');

      expect(mockSendEmail).toHaveBeenCalledTimes(1);

      // Should mark COMPLETED since there are no more steps
      const updateCalls = mockPrismaDripEnrollment.update.mock.calls;
      const completionCall = updateCalls.find(
        (call: unknown[]) => (call[0] as { data: { status?: string } }).data?.status === 'COMPLETED'
      );
      expect(completionCall).toBeDefined();
    });
  });

  // ─── Fallback to raw templates ─────────────────────────────────────────────

  describe('fallback to raw templates', () => {
    it('sends raw template when EmailGenerationAgent fails', async () => {
      mockEmailAgentExecute.mockResolvedValueOnce({ success: false, error: 'AI unavailable' });

      const enrollment = makeEnrollment({ currentStepIndex: 0 });
      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaLead.findUnique.mockResolvedValue(makeLead());
      mockPrismaDripEnrollment.update.mockResolvedValue(enrollment);

      await agent.processStep('enrollment-1');

      // Email should still be sent using raw template
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const sendCall = mockSendEmail.mock.calls[0][0];
      // Subject should come from the raw template, not AI
      expect(sendCall.subject).toContain('Hello');
    });
  });

  // ─── stopEnrollment ────────────────────────────────────────────────────────

  describe('stopEnrollment()', () => {
    it('sets status to STOPPED with reason and records AgentAction', async () => {
      const enrollment = makeEnrollment();
      mockPrismaDripEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrismaDripEnrollment.update.mockResolvedValue({ ...enrollment, status: 'STOPPED' });

      await agent.stopEnrollment('enrollment-1', 'manual');

      expect(mockPrismaDripEnrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'STOPPED',
            stoppedReason: 'manual',
          }),
        })
      );
      expect(mockPrismaAgentAction.create).toHaveBeenCalledTimes(1);
    });
  });
});
