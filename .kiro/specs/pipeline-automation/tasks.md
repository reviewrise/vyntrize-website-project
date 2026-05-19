# Tasks: Pipeline Automation System

## Task 1: Database Schema — New Tables and Enum Extensions

**Spec refs:** Requirements 1.5, 4.6, 5.3, 8.2, 12.1–12.8

Add all new Prisma models and enum values required by the pipeline automation system.

### Sub-tasks

- [x] 1.1 Add `WORKFLOW_RULE` to `AgentType` enum, `DRIP_ENROLL` and `RULE_EXECUTION` to `ActionType` enum in `packages/@platform/vyntrize-db/prisma/schema.prisma`
- [x] 1.2 Add `DripEnrollmentStatus` enum (`ACTIVE`, `COMPLETED`, `STOPPED`) to schema
- [x] 1.3 Add `StageProgressionRule` model with fields: `id`, `fromStage`, `toStage`, `criteria` (Json), `autonomyLevel`, `isActive`, `createdAt`, `updatedAt`; add index on `(fromStage, isActive)`
- [x] 1.4 Add `DripSequence` model with fields: `id`, `name`, `description`, `triggerType`, `triggerConfig` (Json), `stopConditions` (Json), `autonomyLevel`, `isActive`, `createdAt`, `updatedAt`
- [x] 1.5 Add `DripStep` model with fields: `id`, `sequenceId` (FK → DripSequence, cascade delete), `stepOrder`, `delayHours`, `subjectTemplate`, `bodyTemplate`, `branchCondition`, `createdAt`, `updatedAt`; add index on `(sequenceId, stepOrder)`
- [x] 1.6 Add `DripEnrollment` model with fields: `id`, `leadId` (FK → Lead, cascade delete), `sequenceId` (FK → DripSequence), `currentStepIndex`, `status` (DripEnrollmentStatus), `enrolledAt`, `lastStepSentAt`, `stoppedReason`, `createdAt`, `updatedAt`; add indexes on `leadId`, `status`, `sequenceId`
- [x] 1.7 Add `WorkflowRule` model with fields: `id`, `name`, `description`, `triggerEvent`, `conditions` (Json), `actions` (Json), `autonomyLevel`, `isActive`, `priority`, `createdAt`, `updatedAt`; add index on `(triggerEvent, isActive)`
- [x] 1.8 Add `manualOverride Boolean @default(false)` field and `dripEnrollments DripEnrollment[]` relation to the existing `Lead` model
- [x] 1.9 Generate and apply Prisma migration: `npx prisma migrate dev --name pipeline-automation`
- [x] 1.10 Regenerate Prisma client: `npx prisma generate`

---

## Task 2: TypeScript Types and Zod Validation Schemas

**Spec refs:** Requirements 8.2, 15.3; Design: JSON shape definitions

Create shared TypeScript interfaces and Zod schemas for all JSON payload types used by the new agents and API endpoints.

**Depends on:** Task 1

### Sub-tasks

- [x] 2.1 Create `apps/vyntrize-crm/lib/automation/types.ts` with interfaces: `ProgressionCriteria`, `TriggerConfig`, `StopConditions`, `RuleCondition`, `RuleAction`
- [x] 2.2 Create `apps/vyntrize-crm/lib/automation/schemas.ts` with Zod schemas: `progressionCriteriaSchema`, `triggerConfigSchema`, `stopConditionsSchema`, `ruleConditionSchema`, `ruleActionSchema`, `workflowRulePayloadSchema`, `stageProgressionRulePayloadSchema`, `dripSequencePayloadSchema`
- [x] 2.3 Export all types and schemas from `apps/vyntrize-crm/lib/automation/index.ts`

---

## Task 3: Stage Progression Agent

**Spec refs:** Requirements 1–3, 13.1, 13.5, 14.1; Design: Component Design §1

Implement the `StageProgressionAgent` class that evaluates progression criteria and advances leads between pipeline stages.

**Depends on:** Task 1, Task 2

### Sub-tasks

- [x] 3.1 Create `apps/vyntrize-crm/lib/agents/stage-progression-agent.ts` extending `Agent` with `AgentType.STAGE_PROGRESSION`
- [x] 3.2 Implement `execute(context)`: route to `evaluateLead(leadId)` for event-driven calls or `batchEvaluateAllLeads()` when no leadId
- [x] 3.3 Implement `evaluateLead(leadId)`: fetch lead with emailTracking, leadTasks, leadScores; query active `StageProgressionRule` records where `fromStage === lead.stage`
- [x] 3.4 Implement `checkCriteria(lead, rule)`: evaluate all five criterion types (`minScore`, `minEmailOpens`, `minEmailClicks`, `minCompletedTasks`, `maxDaysInStage`) — return `true` only when ALL defined criteria pass
- [x] 3.5 Implement `progressLead(lead, rule)`: create `AgentAction` (type `STAGE_CHANGE`); enforce WON/LOST safety override to `SUGGEST_APPROVE`; for `FULLY_AUTONOMOUS` update `lead.stage` and emit `stage_changed`; for `SUGGEST_APPROVE` leave action as `PENDING`
- [x] 3.6 Implement `batchEvaluateAllLeads()`: query all leads where `stage NOT IN (WON, LOST)` and `manualOverride = false`; call `evaluateLead` for each; return summary result
- [x] 3.7 Implement `applyApprovedAction(actionId)`: called by the existing approve endpoint; fetch action metadata, update lead stage, emit `stage_changed`, mark action `EXECUTED`
- [x] 3.8 Add `manualOverride` skip logic: when `lead.manualOverride === true`, log INFO and return without creating any `AgentAction`
- [x] 3.9 Implement `getConfig()` returning cron `'0 2 * * *'`, autonomy level from rule, feature flag `AGENT_STAGE_PROGRESSION_ENABLED`
- [x] 3.10 Write unit tests in `apps/vyntrize-crm/lib/agents/__tests__/stage-progression-agent.test.ts` covering: criteria evaluation, manual override skip, WON/LOST safety, SUGGEST_APPROVE path, batch job

---

## Task 4: Drip Campaign Agent

**Spec refs:** Requirements 4–7, 13.2, 13.5, 14.2, 14.4, 15.4; Design: Component Design §2

Implement the `DripCampaignAgent` class that manages drip sequence enrollment, step execution, branching, and stop conditions.

**Depends on:** Task 1, Task 2

### Sub-tasks

- [x] 4.1 Create `apps/vyntrize-crm/lib/agents/drip-campaign-agent.ts` extending `Agent` with `AgentType.DRIP_CAMPAIGN`
- [x] 4.2 Implement `execute(context)`: route to `processDueSteps()` for scheduled calls; evaluate stop conditions and trigger enrollment checks for event-driven calls
- [x] 4.3 Implement `enroll(leadId, sequenceId, triggeredBy)`: check for existing active enrollment (skip if found); check `contact.emailOptOut` (skip if true); create `DripEnrollment`; record `DRIP_ENROLL` `AgentAction`; for `FULLY_AUTONOMOUS` schedule step 0 via `JobScheduler`; for `SUGGEST_APPROVE` create `PENDING` action
- [x] 4.4 Implement `processStep(enrollmentId)`: fetch enrollment (abort if not ACTIVE); check stop conditions; fetch current `DripStep`; evaluate branch condition against previous email engagement; invoke `EmailGenerationAgent` with fallback to raw templates; send via `EmailService`; update enrollment; record `EMAIL_SEND` `AgentAction`; schedule next step or mark `COMPLETED`
- [x] 4.5 Implement branch condition logic: `opened` (previous email `openedAt != null`), `not_opened` (previous email `openedAt == null` within delay window), `clicked` (0-hour delay override), `always` (unconditional)
- [x] 4.6 Implement `stopEnrollment(enrollmentId, reason)`: set `status = STOPPED`, set `stoppedReason`, cancel pending BullMQ jobs for this enrollment, record `STOPPED` `AgentAction` with reason
- [x] 4.7 Implement `checkStopConditions(lead, enrollment)`: check `onStageReached`, `onScoreExceeds`, `onEmailReply` against current lead state; return reason string or null
- [x] 4.8 Implement `processDueSteps()`: query all `ACTIVE` enrollments; for each check if a step job is due (based on `lastStepSentAt + step.delayHours`); call `processStep` for due enrollments
- [x] 4.9 Implement `getConfig()` returning cron `'*/5 * * * *'`, feature flag `AGENT_DRIP_CAMPAIGN_ENABLED`
- [x] 4.10 Write unit tests in `apps/vyntrize-crm/lib/agents/__tests__/drip-campaign-agent.test.ts` covering: enrollment deduplication, emailOptOut skip, branch conditions, stop conditions, COMPLETED transition, fallback to raw templates

---

## Task 5: Workflow Rule Engine

**Spec refs:** Requirements 8–9, 13.3, 13.6, 14.3, 14.5; Design: Component Design §3

Implement the `WorkflowRuleEngine` class that evaluates stored trigger → condition → action rules.

**Depends on:** Task 1, Task 2, Task 3, Task 4

### Sub-tasks

- [-] 5.1 Create `apps/vyntrize-crm/lib/agents/workflow-rule-engine.ts` extending `Agent` with `AgentType.WORKFLOW_RULE`
- [ ] 5.2 Implement `execute(context)`: extract event type from `context.eventData`; call `evaluateRules(event, leadId, eventData)`
- [ ] 5.3 Implement `evaluateRules(event, leadId, eventData)`: query active `WorkflowRule` records matching `triggerEvent`; sort by `priority ASC`; for each rule run loop guard check, schema validation, condition evaluation, and action execution
- [ ] 5.4 Implement `evaluateConditions(lead, conditions)`: evaluate all `RuleCondition` items with AND logic; support fields `score`, `stage`, `daysInStage`, `scoreChangedBy`, `assigneeId` and operators `gt`, `lt`, `eq`, `gte`, `lte`
- [ ] 5.5 Implement `executeAction(lead, action, rule)`: dispatch to correct handler per `action.type` — `send_email` → `EmailGenerationAgent`, `change_stage` → `StageProgressionAgent.progressLead`, `create_task` → `prisma.leadTask.create`, `assign_lead` → `prisma.lead.update`, `enroll_drip` → `DripCampaignAgent.enroll`; catch per-action errors and record `FAILED` `AgentAction` without stopping remaining actions
- [ ] 5.6 Implement loop guard: in-memory `Map<string, number[]>` keyed by `${leadId}:${ruleId}`; prune entries older than 60 minutes; skip rule if count >= 3 within window
- [ ] 5.7 Implement Zod schema validation of `conditions` and `actions` before execution; log structured error with rule ID on failure
- [ ] 5.8 Record `RULE_EXECUTION` `AgentAction` per rule execution with metadata: `{ ruleName, matchedConditions, actionsExecuted }`
- [ ] 5.9 Implement `getConfig()` returning feature flag `AGENT_WORKFLOW_RULE_ENABLED`
- [ ] 5.10 Write unit tests in `apps/vyntrize-crm/lib/agents/__tests__/workflow-rule-engine.test.ts` covering: priority ordering, loop guard, malformed JSON skip, per-action failure isolation, all five action types

---

## Task 6: Agent Registry Integration

**Spec refs:** Requirements 13.1–13.8; Design: Agent Registry Updates

Register the three new agents in the existing registry and wire up all event subscriptions and scheduled jobs.

**Depends on:** Task 3, Task 4, Task 5

### Sub-tasks

- [ ] 6.1 Import `StageProgressionAgent`, `DripCampaignAgent`, `WorkflowRuleEngine` in `apps/vyntrize-crm/lib/agents/registry.ts`
- [ ] 6.2 Instantiate all three agents in `registerAllAgents()`
- [ ] 6.3 Register `StageProgressionAgent` on events: `LEAD_UPDATED`, `EMAIL_OPENED`, `EMAIL_CLICKED`, `TASK_COMPLETED`; schedule recurring job `'0 2 * * *'`; register with `jobScheduler`
- [ ] 6.4 Register `DripCampaignAgent` on events: `STAGE_CHANGED`, `LEAD_UPDATED`, `EMAIL_OPENED`, `EMAIL_CLICKED`, `TASK_COMPLETED`; schedule recurring job `'*/5 * * * *'`; register with `jobScheduler`
- [ ] 6.5 Register `WorkflowRuleEngine` on all six CRM events: `LEAD_CREATED`, `LEAD_UPDATED`, `STAGE_CHANGED`, `EMAIL_OPENED`, `EMAIL_CLICKED`, `TASK_COMPLETED`; register with `jobScheduler`
- [ ] 6.6 Add feature flag guard: if `AGENT_STAGE_PROGRESSION_ENABLED=false`, skip registration and log single WARN; same for `AGENT_DRIP_CAMPAIGN_ENABLED` and `AGENT_WORKFLOW_RULE_ENABLED`
- [ ] 6.7 Update `.env.example` in `apps/vyntrize-crm` with the three new feature flag variables set to `true`

---

## Task 7: Automation API — Stage Progression Rules

**Spec refs:** Requirements 1.1–1.7, 15.1–15.2; Design: API Endpoints §Stage Progression Rules

Implement the REST API for managing `StageProgressionRule` records.

**Depends on:** Task 1, Task 2

### Sub-tasks

- [ ] 7.1 Create `apps/vyntrize-crm/app/api/automation/stage-progression/route.ts` with `GET` (list all rules) and `POST` (create rule) handlers; validate session + ADMIN role; validate payload with `stageProgressionRulePayloadSchema`; validate `fromStage !== toStage`
- [ ] 7.2 Create `apps/vyntrize-crm/app/api/automation/stage-progression/[id]/route.ts` with `PUT` (update) and `DELETE` (delete) handlers; same auth and validation
- [ ] 7.3 Create `apps/vyntrize-crm/app/api/automation/stage-progression/[id]/toggle/route.ts` with `PATCH` handler to flip `isActive`
- [ ] 7.4 Create `apps/vyntrize-crm/app/api/automation/summary/route.ts` with `GET` handler returning: active drip enrollment count, pending stage progression approval count, workflow rules fired in last 24h, emails sent by automation in last 24h

---

## Task 8: Automation API — Drip Sequences

**Spec refs:** Requirements 4.1–4.8, 7.4, 10.9, 15.1–15.2; Design: API Endpoints §Drip Sequences

Implement the REST API for managing `DripSequence`, `DripStep`, and `DripEnrollment` records.

**Depends on:** Task 1, Task 2

### Sub-tasks

- [ ] 8.1 Create `apps/vyntrize-crm/app/api/automation/drip-sequences/route.ts` with `GET` (list sequences with step count and active enrollment count) and `POST` (create sequence with nested steps) handlers; validate with `dripSequencePayloadSchema`; reject if zero steps
- [ ] 8.2 Create `apps/vyntrize-crm/app/api/automation/drip-sequences/[id]/route.ts` with `PUT` (update sequence and replace steps) and `DELETE` (delete with active enrollment warning) handlers; on DELETE, return 409 with affected enrollment count if active enrollments exist unless `force=true` query param is provided
- [ ] 8.3 Create `apps/vyntrize-crm/app/api/automation/drip-sequences/[id]/enrollments/route.ts` with `GET` handler returning active enrollments with lead name, current step, enrollment date, last email sent date
- [ ] 8.4 Create `apps/vyntrize-crm/app/api/automation/drip-sequences/[id]/enrollments/[enrollmentId]/route.ts` with `DELETE` handler for manual unenroll; calls `DripCampaignAgent.stopEnrollment(enrollmentId, 'manual')`

---

## Task 9: Automation API — Workflow Rules

**Spec refs:** Requirements 8.1–8.9, 15.1–15.3; Design: API Endpoints §Workflow Rules

Implement the REST API for managing `WorkflowRule` records.

**Depends on:** Task 1, Task 2

### Sub-tasks

- [ ] 9.1 Create `apps/vyntrize-crm/app/api/automation/workflow-rules/route.ts` with `GET` (list rules with last execution status) and `POST` (create rule) handlers; validate with `workflowRulePayloadSchema`; require at least one trigger event and one action
- [ ] 9.2 Create `apps/vyntrize-crm/app/api/automation/workflow-rules/[id]/route.ts` with `PUT` and `DELETE` handlers
- [ ] 9.3 Create `apps/vyntrize-crm/app/api/automation/workflow-rules/[id]/toggle/route.ts` with `PATCH` handler to flip `isActive`

---

## Task 10: Lead Manual Override API

**Spec refs:** Requirements 3.1–3.5; Design: API Endpoints §Lead Manual Override

Add the API endpoint and lead detail page toggle for the `manualOverride` field.

**Depends on:** Task 1

### Sub-tasks

- [ ] 10.1 Create `apps/vyntrize-crm/app/api/crm/leads/[id]/manual-override/route.ts` with `PATCH` handler; accept `{ manualOverride: boolean }` body; require authenticated session (any role); update `lead.manualOverride`
- [ ] 10.2 Add "Exempt from auto-progression" toggle to the existing lead detail page (`apps/vyntrize-crm/app/(crm)/leads/[id]/LeadDetailClient.tsx`); bind to `lead.manualOverride`; call the PATCH endpoint on change
- [ ] 10.3 Add a visible badge/indicator on the lead detail page when `manualOverride === true` (e.g., "Auto-progression disabled" pill using `var(--color-warning)`)
- [ ] 10.4 Add "Active Drip Sequences" section to the lead detail page listing current `DripEnrollment` records (sequence name, current step, enrolled date) with an unenroll button per row

---

## Task 11: Pipeline Automation UI — Page Shell and Tab Navigation

**Spec refs:** Requirements 10.1–10.3, 10.8; Design: UI Design §Route Structure and Component Tree

Create the settings page shell at `/settings/pipeline/automation` with tab navigation and the summary header.

**Depends on:** Task 7, Task 8, Task 9

### Sub-tasks

- [ ] 11.1 Create `apps/vyntrize-crm/app/(crm)/settings/pipeline/automation/page.tsx` as a server component; check session and require `ADMIN` role; redirect to `/login` if unauthenticated or return 403 if not admin
- [ ] 11.2 Create `apps/vyntrize-crm/app/(crm)/settings/pipeline/automation/PipelineAutomationClient.tsx` as the main client component with URL-based tab state (`?tab=stage-progression|drip-sequences|workflow-rules`)
- [ ] 11.3 Implement `AutomationPageHeader` component: fetch `/api/automation/summary` on mount; display active enrollment count and pending approval count; auto-refresh every 30 seconds
- [ ] 11.4 Implement `TabNav` component with three tabs using existing CSS variable design system; active tab highlighted with `var(--color-primary)`
- [ ] 11.5 Add link to `/settings/pipeline/automation` in the existing settings navigation sidebar

---

## Task 12: Pipeline Automation UI — Stage Progression Tab

**Spec refs:** Requirements 1.1–1.7, 2.9, 10.4, 11.4; Design: UI Design §StageProgressionTab

Build the Stage Progression tab with rule list, inline pending approvals, and create/edit drawer.

**Depends on:** Task 11

### Sub-tasks

- [ ] 12.1 Create `StageProgressionTab` component: fetch rules from `/api/automation/stage-progression`; render `StageProgressionRuleList`
- [ ] 12.2 Create `StageProgressionRuleRow` component: display `fromStage → toStage`, criteria summary (e.g., "Score ≥ 60, 2+ opens"), autonomy level badge, enabled/disabled toggle (calls toggle endpoint), edit and delete buttons
- [ ] 12.3 Create `PendingApprovalsList` component: fetch pending `STAGE_CHANGE` `AgentAction` records from existing `/api/agents/actions?status=PENDING&agentType=STAGE_PROGRESSION`; render each with lead name, proposed stage, reasoning, and inline Approve / Reject buttons
- [ ] 12.4 Create `StageProgressionRuleDrawer` slide-over component: form fields for `fromStage`, `toStage` (validated different), `autonomyLevel`, `isActive`; include `CriteriaBuilder`
- [ ] 12.5 Create `CriteriaBuilder` component: dynamic list of optional criterion fields (`minScore`, `minEmailOpens`, `minEmailClicks`, `minCompletedTasks`, `maxDaysInStage`) with number inputs; each criterion can be enabled/disabled independently

---

## Task 13: Pipeline Automation UI — Drip Sequences Tab

**Spec refs:** Requirements 4.1–4.8, 5.1–5.6, 7.4, 10.5, 10.9, 11.2; Design: UI Design §DripSequencesTab

Build the Drip Sequences tab with sequence list, step builder, enrollment table, and create/edit drawer.

**Depends on:** Task 11

### Sub-tasks

- [ ] 13.1 Create `DripSequencesTab` component: fetch sequences from `/api/automation/drip-sequences`; render `DripSequenceList` and `EnrollmentTable`
- [ ] 13.2 Create `DripSequenceRow` component: display name, trigger condition summary, step count, active enrollment count, enabled/disabled toggle, edit and delete buttons; on delete show confirmation dialog with active enrollment count warning
- [ ] 13.3 Create `DripSequenceDrawer` slide-over: `SequenceMetaForm` (name, description, triggerType selector, triggerConfig fields, stopConditions fields, autonomyLevel) and `DripStepBuilder`
- [ ] 13.4 Create `DripStepBuilder` component: ordered list of steps with add/remove/reorder (drag or up/down arrows); each step has fields: `delayHours`, `subjectTemplate`, `bodyTemplate` (textarea), `branchCondition` selector; prevent saving with zero steps
- [ ] 13.5 Create `DripStepPreview` component: visual timeline showing step order, delay between steps, and branch condition labels
- [ ] 13.6 Create `EnrollmentTable` component: per-sequence table showing lead name (linked to lead detail), current step index, enrollment date, last email sent date; fetch from `/api/automation/drip-sequences/[id]/enrollments`; include unenroll button per row

---

## Task 14: Pipeline Automation UI — Workflow Rules Tab

**Spec refs:** Requirements 8.1–8.9, 10.6–10.7, 11.5; Design: UI Design §WorkflowRulesTab

Build the Workflow Rules tab with rule list and the trigger/condition/action builder drawer.

**Depends on:** Task 11

### Sub-tasks

- [ ] 14.1 Create `WorkflowRulesTab` component: fetch rules from `/api/automation/workflow-rules`; render `WorkflowRuleList`
- [ ] 14.2 Create `WorkflowRuleRow` component: display name, trigger event badge, condition count, action count, last execution time and status (success/failed), enabled/disabled toggle, edit and delete buttons
- [ ] 14.3 Create `WorkflowRuleDrawer` slide-over: `TriggerSelector` (dropdown of six CRM event types), `ConditionBuilder`, `ActionBuilder`, `autonomyLevel` selector, `priority` number input
- [ ] 14.4 Create `ConditionBuilder` component: dynamic list of AND conditions; each condition has field selector, operator selector, value input; add/remove rows; at least zero conditions allowed
- [ ] 14.5 Create `ActionBuilder` component: ordered list of actions; each action has type selector and type-specific config fields (`change_stage` → stage selector, `create_task` → title/days/assignee, `assign_lead` → user selector, `enroll_drip` → sequence selector, `send_email` → optional template hint); at least one action required

---

## Task 15: Existing Agent Dashboard — Approve/Reject Integration

**Spec refs:** Requirements 2.5–2.7, 5.4, 13.7; Design: Approval flow

Update the existing approve/reject endpoint to handle `STAGE_CHANGE` and `DRIP_ENROLL` action types by delegating to the new agents.

**Depends on:** Task 3, Task 4

### Sub-tasks

- [ ] 15.1 Update `apps/vyntrize-crm/app/api/agents/actions/[actionId]/approve/route.ts`: after marking action `APPROVED`, check `action.actionType`; if `STAGE_CHANGE` call `stageProgressionAgent.applyApprovedAction(actionId)`; if `DRIP_ENROLL` call `dripCampaignAgent.applyApprovedEnrollment(actionId)`
- [ ] 15.2 Implement `StageProgressionAgent.applyApprovedAction(actionId)`: fetch action metadata, update `lead.stage`, emit `stage_changed`, mark action `EXECUTED`, record `approvedBy` and `approvedAt`
- [ ] 15.3 Implement `DripCampaignAgent.applyApprovedEnrollment(actionId)`: fetch action metadata, schedule step 0 via `JobScheduler`, mark action `EXECUTED`
- [ ] 15.4 Verify that `STAGE_PROGRESSION` and `DRIP_CAMPAIGN` agent type badges render correctly in the existing `AgentTypeBadge` component; add display labels if missing

---

## Task 16: End-to-End Integration Tests

**Spec refs:** Requirements 2.1–2.9, 5.1–5.6, 6.1–6.6, 7.1–7.4, 9.1–9.11; Design: Correctness Properties

Write integration tests that verify the eight correctness properties from the design document.

**Depends on:** Task 3, Task 4, Task 5, Task 6

### Sub-tasks

- [ ] 16.1 Test correctness property 1 — No duplicate active enrollments: enroll same lead in same sequence twice concurrently; assert only one `ACTIVE` `DripEnrollment` exists
- [ ] 16.2 Test correctness property 2 — Manual override exclusion: set `lead.manualOverride = true`; emit `lead_updated`; assert no `STAGE_CHANGE` `AgentAction` created
- [ ] 16.3 Test correctness property 3 — WON/LOST safety: create `StageProgressionRule` targeting `WON` with `FULLY_AUTONOMOUS`; trigger criteria satisfaction; assert resulting `AgentAction` has `autonomyLevel = SUGGEST_APPROVE` and `status = PENDING`
- [ ] 16.4 Test correctness property 4 — Criteria monotonicity: create rule with two criteria; satisfy only one; assert no `AgentAction` created; satisfy both; assert `AgentAction` created
- [ ] 16.5 Test correctness property 5 — Stop condition completeness: stop a `DripEnrollment`; attempt to process a step; assert no `EMAIL_SEND` `AgentAction` created
- [ ] 16.6 Test correctness property 6 — Rule priority ordering: create two `WorkflowRule` records with different priorities; emit matching event; assert execution order matches ascending priority
- [ ] 16.7 Test correctness property 7 — Loop guard bound: fire same rule for same lead 4 times within 60 minutes; assert only 3 `RULE_EXECUTION` `AgentAction` records created
- [ ] 16.8 Test correctness property 8 — Audit completeness: run a full stage progression, drip enrollment, drip step send, and rule execution; assert exactly one `AgentAction` per operation
