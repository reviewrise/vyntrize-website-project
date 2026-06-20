import { z } from 'zod';

// LeadStage values from the Prisma enum
const leadStageValues = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'] as const;
const autonomyLevelValues = ['FULLY_AUTONOMOUS', 'SUGGEST_APPROVE', 'COPILOT'] as const;

// ─── Stage Progression ────────────────────────────────────────────────────────

export const progressionCriteriaSchema = z.object({
  minScore: z.number().int().min(0).max(100).optional(),
  minEmailOpens: z.number().int().min(0).optional(),
  minEmailClicks: z.number().int().min(0).optional(),
  minCompletedTasks: z.number().int().min(0).optional(),
  maxDaysInStage: z.number().int().min(1).optional(),
});

export const stageProgressionRulePayloadSchema = z.object({
  fromStage: z.enum(leadStageValues),
  toStage: z.enum(leadStageValues),
  criteria: progressionCriteriaSchema,
  autonomyLevel: z.enum(autonomyLevelValues),
  isActive: z.boolean().optional().default(true),
}).refine(data => data.fromStage !== data.toStage, {
  message: 'fromStage and toStage must be different',
  path: ['toStage'],
});

// ─── Drip Sequences ───────────────────────────────────────────────────────────

export const triggerConfigSchema = z.object({
  stage: z.enum(leadStageValues).optional(),
  scoreThreshold: z.number().int().min(0).max(100).optional(),
  inactivityDays: z.number().int().min(1).optional(),
});

export const stopConditionsSchema = z.object({
  onStageReached: z.enum(leadStageValues).optional(),
  onScoreExceeds: z.number().int().min(0).max(100).optional(),
  onEmailReply: z.boolean().optional(),
});

export const dripStepInputSchema = z.object({
  stepOrder: z.number().int().min(0),
  delayHours: z.number().int().min(0),
  stepType: z.enum(['email', 'sms']).optional().default('email'),
  subjectTemplate: z.string().min(1),
  bodyTemplate: z.string().min(1),
  branchCondition: z.enum(['opened', 'not_opened', 'clicked', 'always']),
});

export const dripSequencePayloadSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  triggerType: z.enum(['stage_entered', 'score_threshold', 'inactivity_days']),
  triggerConfig: triggerConfigSchema,
  stopConditions: stopConditionsSchema,
  autonomyLevel: z.enum(autonomyLevelValues),
  isActive: z.boolean().optional().default(true),
  steps: z.array(dripStepInputSchema).min(1, 'At least one step is required'),
});

// ─── Workflow Rules ───────────────────────────────────────────────────────────

export const ruleConditionSchema = z.object({
  field: z.enum(['score', 'stage', 'daysInStage', 'scoreChangedBy', 'assigneeId', 'source']),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
  value: z.union([z.number(), z.string()]),
});

export const ruleActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('send_email'),
    config: z.object({ 
      templateHint: z.string().optional(),
      templateId: z.string().optional().transform(v => v === '' ? undefined : v),
      templateName: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('change_stage'),
    config: z.object({ targetStage: z.enum(leadStageValues) }),
  }),
  z.object({
    type: z.literal('create_task'),
    config: z.object({
      title: z.string().min(1),
      dueDaysOffset: z.number().int().min(0),
      assigneeId: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('assign_lead'),
    config: z.object({ 
      assigneeId: z.string().optional(),
      strategy: z.enum(['specific', 'round-robin']).optional().default('specific'),
    }),
  }),
  z.object({
    type: z.literal('enroll_drip'),
    config: z.object({ sequenceId: z.string().min(1) }),
  }),
  z.object({
    type: z.literal('notify_staff'),
    config: z.object({ messageTemplate: z.string().optional() }),
  }),
  z.object({
    type: z.literal('schedule_meeting'),
    config: z.object({ generateMeetLink: z.boolean().optional() }),
  }),
  z.object({
    type: z.literal('send_sms'),
    config: z.object({
      message: z.string().optional(),
      smsTemplateId: z.string().optional(),
      templateHint: z.string().optional(),
      _templatePreview: z.string().optional(),
    }),
  }),
]);

export const workflowRulePayloadSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  triggerEvent: z.enum([
    'lead_created',
    'lead_updated',
    'stage_changed',
    'email_opened',
    'email_clicked',
    'task_completed',
  ]),
  conditions: z.array(ruleConditionSchema),
  actions: z.array(ruleActionSchema).min(1, 'At least one action is required'),
  autonomyLevel: z.enum(autonomyLevelValues),
  isActive: z.boolean().optional().default(true),
  priority: z.number().int().min(1).optional().default(100),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type StageProgressionRulePayload = z.infer<typeof stageProgressionRulePayloadSchema>;
export type DripSequencePayload = z.infer<typeof dripSequencePayloadSchema>;
export type WorkflowRulePayload = z.infer<typeof workflowRulePayloadSchema>;
