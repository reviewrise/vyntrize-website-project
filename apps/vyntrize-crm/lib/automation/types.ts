import type { LeadStage } from '@platform/vyntrize-db';

// ─── Stage Progression ────────────────────────────────────────────────────────

export interface ProgressionCriteria {
  minScore?: number;           // minimum lead.score
  minEmailOpens?: number;      // minimum email open count (last 30 days)
  minEmailClicks?: number;     // minimum email click count (last 30 days)
  minCompletedTasks?: number;  // minimum completed task count
  maxDaysInStage?: number;     // maximum days since lead entered current stage
}

// ─── Drip Sequences ───────────────────────────────────────────────────────────

export type DripTriggerType = 'stage_entered' | 'score_threshold' | 'inactivity_days';

export interface TriggerConfig {
  stage?: LeadStage;           // for triggerType = 'stage_entered'
  scoreThreshold?: number;     // for triggerType = 'score_threshold'
  inactivityDays?: number;     // for triggerType = 'inactivity_days'
}

export interface StopConditions {
  onStageReached?: LeadStage;  // stop when lead reaches this stage
  onScoreExceeds?: number;     // stop when lead.score exceeds this value
  onEmailReply?: boolean;      // stop on email_replied event
}

export type BranchCondition = 'opened' | 'not_opened' | 'clicked' | 'always';

export interface DripStepInput {
  stepOrder: number;
  delayHours: number;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  smsBodyTemplate?: string;
  branchCondition: BranchCondition;
}

// ─── Workflow Rules ───────────────────────────────────────────────────────────

export type RuleConditionField = 'score' | 'stage' | 'daysInStage' | 'scoreChangedBy' | 'assigneeId' | 'source';
export type RuleConditionOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte';

export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: number | string;
}

export type RuleActionType = 'send_email' | 'send_sms' | 'change_stage' | 'create_task' | 'assign_lead' | 'enroll_drip' | 'notify_staff' | 'schedule_meeting';


export interface SendEmailActionConfig {
  templateHint?: string;
}

export interface ChangeStageActionConfig {
  targetStage: LeadStage;
}

export interface CreateTaskActionConfig {
  title: string;
  dueDaysOffset: number;
  assigneeId?: string;
}

export interface AssignLeadActionConfig {
  assigneeId?: string;
  strategy?: 'specific' | 'round-robin';
}

export interface EnrollDripActionConfig {
  sequenceId: string;
}

export interface NotifyStaffActionConfig {
  messageTemplate?: string;
}

export interface ScheduleMeetingActionConfig {
  generateMeetLink?: boolean;
}

export type RuleActionConfig =
  | SendEmailActionConfig
  | ChangeStageActionConfig
  | CreateTaskActionConfig
  | AssignLeadActionConfig
  | EnrollDripActionConfig
  | NotifyStaffActionConfig
  | ScheduleMeetingActionConfig;

export interface RuleAction {
  type: RuleActionType;
  config: RuleActionConfig;
}
