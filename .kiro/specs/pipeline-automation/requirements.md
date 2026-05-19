# Requirements Document: Pipeline Automation System

## Introduction

The Pipeline Automation System extends the existing Vyntrize CRM agent infrastructure with three new capabilities: a **Stage Progression Agent** that automatically advances leads through pipeline stages based on configurable criteria, a **Drip Campaign Agent** that executes multi-step email sequences with behavior-based branching, and a **Workflow Rule Engine** that lets admins define custom trigger → condition → action rules stored in the database and managed via UI. All three components build on the existing Event Bus, Job Scheduler, Lead Scoring Agent, Task Automation Agent, Email Generation Agent, and Agent Actions audit trail — extending rather than replacing them.

---

## Glossary

- **Stage_Progression_Agent**: New agent that evaluates progression criteria and moves leads between pipeline stages, either autonomously or via approval workflow
- **Drip_Campaign_Agent**: New agent that manages multi-step email sequences with configurable delays, behavior-based branching, and stop conditions
- **Workflow_Rule_Engine**: New subsystem that evaluates stored automation rules and dispatches actions when trigger conditions are met
- **Workflow_Rule**: A database record defining a trigger event, optional conditions, and one or more actions to execute
- **Drip_Sequence**: A named, ordered collection of Drip_Steps associated with a trigger condition
- **Drip_Step**: A single email in a Drip_Sequence with a configurable delay, subject/body template, and branch conditions
- **Drip_Enrollment**: A database record tracking a specific lead's progress through a Drip_Sequence
- **Progression_Criteria**: A set of configurable conditions (score threshold, email opens, task completions, days in stage) that must be satisfied before a lead advances to the next stage
- **Stage_Progression_Rule**: A Workflow_Rule variant specifically governing stage-to-stage transitions, including the target stage and required criteria
- **Manual_Override_Flag**: A boolean field on a Lead record that prevents the Stage_Progression_Agent from automatically advancing that lead
- **Autonomy_Level**: Existing enum — `FULLY_AUTONOMOUS`, `SUGGEST_APPROVE`, or `COPILOT` — controlling whether an action executes immediately, requires approval, or is advisory only
- **Event_Bus**: Existing TypeScript EventEmitter dispatching CRM events (`lead_created`, `lead_updated`, `stage_changed`, `email_opened`, `email_clicked`, `task_completed`)
- **Job_Scheduler**: Existing BullMQ + Redis system for periodic and delayed background jobs
- **Agent_Action**: Existing database record providing a full audit trail for every agent action
- **Agent_Dashboard**: Existing UI at `/agents` for monitoring actions and approving suggestions
- **Pipeline_Automation_UI**: New settings pages at `/settings/pipeline/automation` for configuring rules, drip sequences, and stage progression criteria
- **Lead_Scoring_Agent**: Existing agent that scores leads 0–100 based on activity and engagement
- **Email_Generation_Agent**: Existing agent that generates AI-powered email drafts via OpenAI/Gemini
- **Email_Service**: Existing Nodemailer SMTP service with open/click tracking pixels

---

## Requirements

### Requirement 1: Stage Progression Criteria Configuration

**User Story:** As a sales manager, I want to define the exact conditions that must be met before a lead advances to the next pipeline stage, so that progression is consistent and data-driven rather than arbitrary.

#### Acceptance Criteria

1. THE Pipeline_Automation_UI SHALL allow admins to define Progression_Criteria for each pipeline stage transition (e.g., CONTACTED → QUALIFIED)
2. WHEN configuring Progression_Criteria, THE Pipeline_Automation_UI SHALL support the following condition types: minimum lead score, minimum email open count, minimum email click count, minimum completed task count, and maximum days in current stage
3. THE Pipeline_Automation_UI SHALL allow admins to set the Autonomy_Level for each Stage_Progression_Rule to `FULLY_AUTONOMOUS` or `SUGGEST_APPROVE`
4. THE Pipeline_Automation_UI SHALL allow admins to enable or disable each Stage_Progression_Rule independently without deleting it
5. THE Workflow_Rule_Engine SHALL persist Stage_Progression_Rules in the database with fields: `id`, `fromStage`, `toStage`, `criteria` (JSON), `autonomyLevel`, `isActive`, `createdAt`, `updatedAt`
6. WHEN a Stage_Progression_Rule is saved, THE Pipeline_Automation_UI SHALL validate that `fromStage` and `toStage` are different valid pipeline stages
7. IF a Stage_Progression_Rule references a pipeline stage that no longer exists, THEN THE Workflow_Rule_Engine SHALL skip that rule and log a warning

---

### Requirement 2: Stage Progression Agent — Criteria Evaluation

**User Story:** As a sales manager, I want leads automatically evaluated against progression criteria whenever relevant activity occurs, so that qualified leads advance without manual review delays.

#### Acceptance Criteria

1. WHEN a `lead_updated`, `email_opened`, `email_clicked`, or `task_completed` event is emitted on the Event_Bus, THE Stage_Progression_Agent SHALL evaluate all active Stage_Progression_Rules whose `fromStage` matches the lead's current stage
2. THE Stage_Progression_Agent SHALL retrieve the lead's current score from the Lead_Scoring_Agent output stored in the database before evaluating score-based criteria
3. WHEN all conditions in a Stage_Progression_Rule's `criteria` are satisfied, THE Stage_Progression_Agent SHALL create an Agent_Action of type `STAGE_CHANGE` with the target stage, reasoning, and the criteria values that triggered progression
4. WHEN the Stage_Progression_Rule's Autonomy_Level is `FULLY_AUTONOMOUS`, THE Stage_Progression_Agent SHALL immediately update the lead's stage and emit a `stage_changed` event on the Event_Bus
5. WHEN the Stage_Progression_Rule's Autonomy_Level is `SUGGEST_APPROVE`, THE Stage_Progression_Agent SHALL create a `PENDING` Agent_Action and notify the assigned user via the Agent_Dashboard without updating the lead's stage
6. WHEN a user approves a `SUGGEST_APPROVE` stage progression in the Agent_Dashboard, THE Stage_Progression_Agent SHALL update the lead's stage, record the approver's ID and timestamp on the Agent_Action, and emit a `stage_changed` event
7. WHEN a user rejects a `SUGGEST_APPROVE` stage progression, THE Stage_Progression_Agent SHALL mark the Agent_Action as `REJECTED` and leave the lead's stage unchanged
8. THE Stage_Progression_Agent SHALL execute a daily batch job via the Job_Scheduler to evaluate all active leads against all active Stage_Progression_Rules, catching any leads that missed event-driven evaluation
9. THE Stage_Progression_Agent SHALL record a metric for stage progression accuracy (suggested progressions that were approved vs. rejected) in Agent_Metric

---

### Requirement 3: Stage Progression Agent — Manual Override

**User Story:** As a sales representative, I want to flag a specific lead as exempt from automatic stage progression, so that I retain control over deals that require a non-standard approach.

#### Acceptance Criteria

1. THE Lead detail page SHALL display a toggle labeled "Exempt from auto-progression" that sets a `manualOverride` boolean field on the Lead record
2. WHILE a Lead's `manualOverride` field is `true`, THE Stage_Progression_Agent SHALL skip all automatic progression evaluation for that lead
3. WHEN the Stage_Progression_Agent skips a lead due to `manualOverride`, THE Stage_Progression_Agent SHALL log a single INFO-level entry per daily batch run without creating an Agent_Action
4. THE Lead detail page SHALL display a visible indicator when a lead has `manualOverride` enabled, so that users are aware the lead is exempt from automation
5. WHEN a user disables `manualOverride` on a Lead, THE Stage_Progression_Agent SHALL re-evaluate that lead against all active Stage_Progression_Rules on the next event or batch run

---

### Requirement 4: Drip Sequence Definition

**User Story:** As a marketing manager, I want to define multi-step email sequences with configurable delays and branching logic, so that leads receive the right message at the right time without manual scheduling.

#### Acceptance Criteria

1. THE Pipeline_Automation_UI SHALL allow admins to create, edit, and delete Drip_Sequences with a name, description, and trigger condition
2. THE Pipeline_Automation_UI SHALL support the following Drip_Sequence trigger conditions: lead enters a specific pipeline stage, lead score crosses a configurable threshold, lead has been inactive for a configurable number of days
3. WHEN creating a Drip_Sequence, THE Pipeline_Automation_UI SHALL allow admins to add one or more Drip_Steps in ordered sequence
4. EACH Drip_Step SHALL have the following configurable fields: delay in hours after the previous step (or enrollment for step 1), email subject template, email body template, and a branch condition (`opened` / `not_opened` / `clicked` / `always`)
5. THE Pipeline_Automation_UI SHALL allow admins to define stop conditions for a Drip_Sequence: lead replies to an email, lead advances to a specified stage, lead score exceeds a threshold, or manual unenrollment
6. THE Workflow_Rule_Engine SHALL persist Drip_Sequences and their Drip_Steps in the database with referential integrity (deleting a Drip_Sequence SHALL cascade-delete its Drip_Steps)
7. THE Pipeline_Automation_UI SHALL prevent saving a Drip_Sequence with zero Drip_Steps
8. THE Pipeline_Automation_UI SHALL display a visual step-by-step preview of the sequence showing delays and branch conditions between steps

---

### Requirement 5: Drip Campaign Agent — Enrollment

**User Story:** As a marketing manager, I want leads automatically enrolled in the appropriate drip sequence when trigger conditions are met, so that nurturing begins without manual intervention.

#### Acceptance Criteria

1. WHEN a CRM event matches a Drip_Sequence's trigger condition, THE Drip_Campaign_Agent SHALL evaluate whether the lead is eligible for enrollment
2. THE Drip_Campaign_Agent SHALL not enroll a lead in the same Drip_Sequence more than once concurrently — IF a Drip_Enrollment already exists for that lead and sequence with status `ACTIVE`, THEN THE Drip_Campaign_Agent SHALL skip enrollment
3. WHEN a lead is eligible for enrollment, THE Drip_Campaign_Agent SHALL create a Drip_Enrollment record with fields: `id`, `leadId`, `sequenceId`, `currentStepIndex`, `status` (`ACTIVE`, `COMPLETED`, `STOPPED`), `enrolledAt`, `lastStepSentAt`
4. WHEN a Drip_Sequence's Autonomy_Level is `SUGGEST_APPROVE`, THE Drip_Campaign_Agent SHALL create a `PENDING` Agent_Action for enrollment approval before scheduling any emails
5. WHEN a Drip_Sequence's Autonomy_Level is `FULLY_AUTONOMOUS`, THE Drip_Campaign_Agent SHALL immediately schedule the first Drip_Step email via the Job_Scheduler with the configured delay
6. THE Drip_Campaign_Agent SHALL record enrollment in Agent_Action with reasoning that identifies the trigger condition that caused enrollment

---

### Requirement 6: Drip Campaign Agent — Step Execution and Branching

**User Story:** As a marketing manager, I want drip emails sent automatically on schedule with behavior-based branching, so that engaged leads receive follow-ups while unresponsive leads get re-engagement variants.

#### Acceptance Criteria

1. WHEN a scheduled Drip_Step job fires, THE Drip_Campaign_Agent SHALL check whether the Drip_Enrollment is still `ACTIVE` before sending
2. WHEN a Drip_Step is due, THE Drip_Campaign_Agent SHALL use the Email_Generation_Agent to personalize the email subject and body using the step's template and the lead's current data
3. WHEN a Drip_Step email is sent, THE Drip_Campaign_Agent SHALL update the Drip_Enrollment's `currentStepIndex` and `lastStepSentAt`, and record an Agent_Action of type `EMAIL_SEND`
4. WHEN a Drip_Step has branch condition `opened` and the lead opened the previous email, THE Drip_Campaign_Agent SHALL schedule the next step after the configured delay
5. WHEN a Drip_Step has branch condition `not_opened` and the lead did NOT open the previous email within the step's delay window, THE Drip_Campaign_Agent SHALL send the current step as a re-engagement variant
6. WHEN a Drip_Step has branch condition `clicked` and the lead clicked a link in the previous email, THE Drip_Campaign_Agent SHALL schedule the next step immediately (0-hour delay override)
7. WHEN a Drip_Step has branch condition `always`, THE Drip_Campaign_Agent SHALL schedule the next step after the configured delay regardless of email engagement
8. WHEN the final Drip_Step in a sequence is completed, THE Drip_Campaign_Agent SHALL update the Drip_Enrollment status to `COMPLETED` and record a completion Agent_Action
9. THE Drip_Campaign_Agent SHALL execute a job every 5 minutes via the Job_Scheduler to process all due Drip_Step jobs

---

### Requirement 7: Drip Campaign Agent — Stop Conditions

**User Story:** As a marketing manager, I want drip sequences to stop automatically when a lead takes a meaningful action, so that leads don't receive irrelevant nurture emails after they've already engaged.

#### Acceptance Criteria

1. WHEN a `stage_changed` event is emitted and the new stage matches a Drip_Sequence's stop condition stage, THE Drip_Campaign_Agent SHALL set the Drip_Enrollment status to `STOPPED` and cancel all pending Drip_Step jobs for that enrollment
2. WHEN a lead's score exceeds the Drip_Sequence's score stop threshold, THE Drip_Campaign_Agent SHALL set the Drip_Enrollment status to `STOPPED` and cancel all pending Drip_Step jobs
3. WHEN an `email_replied` event is emitted (or equivalent inbound email signal), THE Drip_Campaign_Agent SHALL set the Drip_Enrollment status to `STOPPED` for all active sequences on that lead
4. THE Pipeline_Automation_UI SHALL allow admins to manually unenroll a specific lead from an active Drip_Enrollment, setting its status to `STOPPED`
5. WHEN a Drip_Enrollment is stopped for any reason, THE Drip_Campaign_Agent SHALL record a `STOPPED` Agent_Action with the reason (stage change, score threshold, reply, manual)
6. IF a lead is re-enrolled in a Drip_Sequence after a previous enrollment was `STOPPED` or `COMPLETED`, THEN THE Drip_Campaign_Agent SHALL create a new Drip_Enrollment record starting from step 1

---

### Requirement 8: Workflow Rule Engine — Rule Definition

**User Story:** As a sales operations manager, I want to define custom automation rules using a trigger → condition → action model, so that I can automate repetitive pipeline tasks without writing code.

#### Acceptance Criteria

1. THE Pipeline_Automation_UI SHALL allow admins to create, edit, enable/disable, and delete Workflow_Rules
2. EACH Workflow_Rule SHALL have the following fields: `id`, `name`, `description`, `triggerEvent` (CRM event type), `conditions` (JSON array), `actions` (JSON array), `autonomyLevel`, `isActive`, `priority` (integer for ordering), `createdAt`, `updatedAt`
3. THE Pipeline_Automation_UI SHALL support the following trigger events: `lead_created`, `lead_updated`, `stage_changed`, `email_opened`, `email_clicked`, `task_completed`
4. THE Pipeline_Automation_UI SHALL support the following condition types: lead score greater/less than a value, lead is in a specific stage, lead has been in current stage for more than N days, lead score changed by more than N points, assigned user is a specific user
5. THE Pipeline_Automation_UI SHALL support the following action types: send email (using Email_Generation_Agent), change stage (to a specified stage), create task (with title, due-date offset, and assignee), assign lead to a user, enroll in a Drip_Sequence
6. EACH Workflow_Rule SHALL support multiple conditions combined with `AND` logic
7. EACH Workflow_Rule SHALL support one or more actions executed in sequence when all conditions are met
8. THE Pipeline_Automation_UI SHALL validate that each Workflow_Rule has at least one trigger event, zero or more conditions, and at least one action before saving
9. THE Workflow_Rule_Engine SHALL evaluate Workflow_Rules in ascending `priority` order when multiple rules match the same event

---

### Requirement 9: Workflow Rule Engine — Execution

**User Story:** As a sales operations manager, I want automation rules to execute reliably whenever the defined trigger fires, so that no qualifying event is missed.

#### Acceptance Criteria

1. WHEN a CRM event is emitted on the Event_Bus, THE Workflow_Rule_Engine SHALL query all active Workflow_Rules whose `triggerEvent` matches the emitted event
2. THE Workflow_Rule_Engine SHALL evaluate each matching Workflow_Rule's conditions against the lead's current data in the order defined by `priority`
3. WHEN all conditions in a Workflow_Rule are satisfied, THE Workflow_Rule_Engine SHALL execute each action in the rule's `actions` array in sequence
4. WHEN a Workflow_Rule action is `send_email`, THE Workflow_Rule_Engine SHALL invoke the Email_Generation_Agent with the lead context
5. WHEN a Workflow_Rule action is `change_stage`, THE Workflow_Rule_Engine SHALL invoke the Stage_Progression_Agent with the target stage
6. WHEN a Workflow_Rule action is `create_task`, THE Workflow_Rule_Engine SHALL create a task via the existing task creation API with the configured title, due-date offset, and assignee
7. WHEN a Workflow_Rule action is `assign_lead`, THE Workflow_Rule_Engine SHALL update the lead's `assigneeId` field
8. WHEN a Workflow_Rule action is `enroll_drip`, THE Workflow_Rule_Engine SHALL invoke the Drip_Campaign_Agent enrollment flow for the specified Drip_Sequence
9. THE Workflow_Rule_Engine SHALL record each rule execution as an Agent_Action with the rule name, matched conditions, and actions taken
10. IF a Workflow_Rule action fails, THEN THE Workflow_Rule_Engine SHALL log the error, record a `FAILED` Agent_Action, and continue executing remaining actions in the rule
11. THE Workflow_Rule_Engine SHALL prevent infinite loops by tracking rule executions per lead per rule within a 1-hour window and skipping re-execution if the same rule has already fired for the same lead more than 3 times in that window

---

### Requirement 10: Pipeline Automation UI — Settings Pages

**User Story:** As a sales operations manager, I want a dedicated settings area to manage all automation configuration in one place, so that I don't have to navigate multiple disconnected screens.

#### Acceptance Criteria

1. THE Pipeline_Automation_UI SHALL be accessible at `/settings/pipeline/automation` and require `ADMIN` role
2. THE Pipeline_Automation_UI SHALL provide three tabbed sections: "Stage Progression", "Drip Sequences", and "Workflow Rules"
3. THE Pipeline_Automation_UI SHALL use the existing CSS variable design system (`var(--color-primary)`, `var(--color-surface)`, `var(--color-text)`, etc.) and match the visual style of the existing Agent_Dashboard
4. THE "Stage Progression" tab SHALL list all Stage_Progression_Rules with their `fromStage`, `toStage`, criteria summary, Autonomy_Level, and enabled/disabled toggle
5. THE "Drip Sequences" tab SHALL list all Drip_Sequences with their name, trigger condition, step count, active enrollment count, and enabled/disabled toggle
6. THE "Workflow Rules" tab SHALL list all Workflow_Rules with their name, trigger event, condition count, action count, and enabled/disabled toggle
7. THE Pipeline_Automation_UI SHALL provide inline forms or slide-over drawers for creating and editing each entity type without full-page navigation
8. THE Pipeline_Automation_UI SHALL display a real-time count of active enrollments and pending approvals in the page header
9. WHEN an admin deletes a Drip_Sequence that has active Drip_Enrollments, THE Pipeline_Automation_UI SHALL display a confirmation warning listing the number of affected active enrollments before proceeding

---

### Requirement 11: Pipeline Automation UI — Monitoring and Observability

**User Story:** As a sales manager, I want to see the current state of all automation activity from the pipeline automation settings, so that I can quickly identify issues and understand what the system is doing.

#### Acceptance Criteria

1. THE Pipeline_Automation_UI SHALL display a summary panel showing: total active Drip_Enrollments, pending stage progression approvals, Workflow_Rules fired in the last 24 hours, and emails sent by automation in the last 24 hours
2. THE Pipeline_Automation_UI SHALL display a per-sequence enrollment table showing each active Drip_Enrollment with lead name, current step, enrollment date, and last email sent date
3. THE Pipeline_Automation_UI SHALL link each automation activity entry to the corresponding Agent_Action record in the existing Agent_Dashboard for full audit detail
4. WHEN a Stage_Progression_Rule has a `SUGGEST_APPROVE` Autonomy_Level, THE Pipeline_Automation_UI SHALL display pending approvals inline with one-click approve and reject buttons
5. THE Pipeline_Automation_UI SHALL display the last execution time and success/failure status for each active Workflow_Rule

---

### Requirement 12: Database Schema Extensions

**User Story:** As a developer, I want the new automation entities persisted in the database with proper relationships and indexes, so that the system is reliable and queries are performant.

#### Acceptance Criteria

1. THE Prisma_Schema SHALL include a `StageProgressionRule` table with fields: `id` (cuid), `fromStage` (LeadStage enum), `toStage` (LeadStage enum), `criteria` (Json), `autonomyLevel` (AutonomyLevel enum), `isActive` (Boolean, default true), `createdAt`, `updatedAt`
2. THE Prisma_Schema SHALL include a `DripSequence` table with fields: `id` (cuid), `name` (String), `description` (String?), `triggerType` (String), `triggerConfig` (Json), `stopConditions` (Json), `autonomyLevel` (AutonomyLevel enum), `isActive` (Boolean, default true), `createdAt`, `updatedAt`
3. THE Prisma_Schema SHALL include a `DripStep` table with fields: `id` (cuid), `sequenceId` (FK → DripSequence), `stepOrder` (Int), `delayHours` (Int), `subjectTemplate` (String), `bodyTemplate` (String), `branchCondition` (String), `createdAt`, `updatedAt`
4. THE Prisma_Schema SHALL include a `DripEnrollment` table with fields: `id` (cuid), `leadId` (FK → Lead), `sequenceId` (FK → DripSequence), `currentStepIndex` (Int, default 0), `status` (Enum: ACTIVE, COMPLETED, STOPPED), `enrolledAt`, `lastStepSentAt` (DateTime?), `stoppedReason` (String?), `createdAt`, `updatedAt`
5. THE Prisma_Schema SHALL include a `WorkflowRule` table with fields: `id` (cuid), `name` (String), `description` (String?), `triggerEvent` (String), `conditions` (Json), `actions` (Json), `autonomyLevel` (AutonomyLevel enum), `isActive` (Boolean, default true), `priority` (Int, default 100), `createdAt`, `updatedAt`
6. THE Prisma_Schema SHALL add a `manualOverride` (Boolean, default false) field to the existing `Lead` table
7. THE Prisma_Schema SHALL add a unique constraint on `DripEnrollment(leadId, sequenceId)` where `status = ACTIVE` to prevent duplicate active enrollments
8. THE Prisma_Schema SHALL add indexes on `DripEnrollment(leadId)`, `DripEnrollment(status)`, `WorkflowRule(triggerEvent, isActive)`, and `StageProgressionRule(fromStage, isActive)` for query performance

---

### Requirement 13: Integration with Existing Agent Infrastructure

**User Story:** As a developer, I want the new agents to integrate cleanly with the existing event bus, job scheduler, and agent dashboard, so that the system remains cohesive and maintainable.

#### Acceptance Criteria

1. THE Stage_Progression_Agent SHALL extend the existing `Agent` base class and register on the Event_Bus for `lead_updated`, `email_opened`, `email_clicked`, and `task_completed` events
2. THE Drip_Campaign_Agent SHALL extend the existing `Agent` base class and register on the Event_Bus for `stage_changed`, `lead_updated`, `email_opened`, `email_clicked`, and `task_completed` events
3. THE Workflow_Rule_Engine SHALL register as a listener on the Event_Bus for all six CRM event types and dispatch to matching Workflow_Rules
4. THE Stage_Progression_Agent, Drip_Campaign_Agent, and Workflow_Rule_Engine SHALL each be registered in the existing agent `init.ts` initialization file
5. THE Stage_Progression_Agent and Drip_Campaign_Agent SHALL use the existing `AgentType` enum — adding `STAGE_PROGRESSION` and `DRIP_CAMPAIGN` values if not already present
6. THE Workflow_Rule_Engine SHALL add a `WORKFLOW_RULE` value to the `AgentType` enum for audit trail attribution
7. ALL new Agent_Actions created by the new agents SHALL appear in the existing Agent_Dashboard with correct agent type badges and filtering
8. THE new agents SHALL respect the existing per-agent enable/disable feature flag pattern (`AGENT_STAGE_PROGRESSION_ENABLED`, `AGENT_DRIP_CAMPAIGN_ENABLED`, `AGENT_WORKFLOW_RULE_ENABLED` environment variables)

---

### Requirement 14: Error Handling and Resilience

**User Story:** As a developer, I want the automation system to handle failures gracefully without disrupting the rest of the CRM, so that a bug in one automation rule doesn't affect unrelated leads or agents.

#### Acceptance Criteria

1. WHEN the Stage_Progression_Agent fails to update a lead's stage due to a database error, THE Stage_Progression_Agent SHALL log the error, mark the Agent_Action as `FAILED`, and not retry automatically (the daily batch job will re-evaluate)
2. WHEN the Drip_Campaign_Agent fails to send a scheduled email, THE Drip_Campaign_Agent SHALL mark the Drip_Step job as failed in the Job_Scheduler and allow BullMQ's existing exponential backoff retry (up to 3 attempts) to handle recovery
3. WHEN the Workflow_Rule_Engine encounters a malformed `conditions` or `actions` JSON payload, THE Workflow_Rule_Engine SHALL log a structured error with the rule ID and skip that rule without affecting other rules
4. IF the Email_Generation_Agent returns an error during a Drip_Step execution, THEN THE Drip_Campaign_Agent SHALL fall back to sending the step's raw `subjectTemplate` and `bodyTemplate` without AI personalization
5. THE Workflow_Rule_Engine SHALL implement the existing circuit breaker pattern for calls to the Email_Generation_Agent, opening the circuit after 5 consecutive failures within 60 seconds
6. WHEN any new agent is disabled via its feature flag, THE Event_Bus SHALL not invoke that agent and SHALL log a single WARN-level message per process startup

---

### Requirement 15: Security and Access Control

**User Story:** As a security officer, I want all pipeline automation configuration and execution to be properly access-controlled and auditable, so that unauthorized changes cannot be made and all actions are traceable.

#### Acceptance Criteria

1. ALL Pipeline_Automation_UI pages SHALL require an authenticated session with `ADMIN` role, returning HTTP 403 for unauthorized access
2. ALL API endpoints for creating, updating, or deleting StageProgressionRules, DripSequences, DripSteps, and WorkflowRules SHALL validate the session and require `ADMIN` role
3. THE Workflow_Rule_Engine SHALL validate all `conditions` and `actions` JSON payloads against a defined schema before persisting or executing them, rejecting payloads that do not conform
4. THE Drip_Campaign_Agent SHALL not send emails to leads whose contact record has `emailOptOut` set to `true`
5. THE Stage_Progression_Agent SHALL not change a lead's stage to `WON` or `LOST` autonomously — WHEN a Stage_Progression_Rule targets `WON` or `LOST`, THE Stage_Progression_Agent SHALL always use `SUGGEST_APPROVE` Autonomy_Level regardless of the rule's configured level
6. ALL Agent_Actions created by the new agents SHALL include the `agentType`, `leadId`, `reasoning`, and `metadata` fields required by the existing audit trail schema
