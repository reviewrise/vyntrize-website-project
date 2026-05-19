# Design Document: Pipeline Automation System

## Overview

The Pipeline Automation System extends the existing Vyntrize CRM agent infrastructure with three new capabilities that work together to automate the entire sales pipeline lifecycle:

1. **Stage Progression Agent** — Evaluates configurable criteria and advances leads between pipeline stages autonomously or via approval workflow
2. **Drip Campaign Agent** — Executes multi-step email sequences with behavior-based branching and automatic stop conditions
3. **Workflow Rule Engine** — Evaluates stored trigger → condition → action rules and dispatches actions across all automation systems

All three components integrate with the existing Event Bus, Job Scheduler, Lead Scoring Agent, Email Generation Agent, and Agent Actions audit trail.

### Design Goals

- **Zero-code automation** — Admins configure rules via UI; no code changes needed for new automations
- **Auditability** — Every automated action recorded in `AgentAction` with full reasoning and metadata
- **Safety** — Configurable autonomy levels, per-lead manual override, WON/LOST stage protection
- **Resilience** — Failures in one rule/agent never affect others; BullMQ retry handles transient errors
- **Extensibility** — New trigger types and action types can be added without changing agent core logic

---

## Architecture

### System Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CRM Event Bus                               │
│  lead_created │ lead_updated │ stage_changed │ email_opened │ ...   │
└──────┬────────────────┬──────────────────┬───────────────────────────┘
       │                │                  │
       ▼                ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐
│   Stage     │  │    Drip      │  │   Workflow Rule       │
│ Progression │  │  Campaign    │  │      Engine           │
│   Agent     │  │   Agent      │  │                       │
└──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘
       │                │                      │
       │         ┌──────┴──────┐               │
       │         │ Job         │               │
       │         │ Scheduler   │               │
       │         │ (BullMQ)    │               │
       │         └─────────────┘               │
       │                                       │
       ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Shared Infrastructure                            │
│  AgentAction (audit) │ Lead Scoring Agent │ Email Generation Agent  │
│  Email Service       │ Task API           │ Prisma / PostgreSQL      │
└─────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Pipeline Automation UI                             │
│  /settings/pipeline/automation  (Stage Progression | Drip | Rules) │
└─────────────────────────────────────────────────────────────────────┘
```

### Integration with Existing Infrastructure

| Existing Component | How It's Used |
|---|---|
| `Agent` base class | All three new components extend it |
| `AgentEventBus` | New agents register listeners; `emitCRMEvent` triggers evaluation |
| `AgentJobScheduler` (BullMQ) | Drip step delays, daily batch jobs, 5-minute drip processor |
| `AgentAction` table | Every automated action recorded with agentType, reasoning, metadata |
| `AgentMetric` table | Progression accuracy, drip completion rates |
| `LeadScoringAgent` | Stage Progression reads `lead.score` set by this agent |
| `EmailGenerationAgent` | Drip Campaign and Workflow Rule Engine invoke it for personalization |
| `EmailService` | Drip Campaign sends via existing Nodemailer SMTP with tracking |
| `AgentRegistry` / `init.ts` | New agents registered in `registerAllAgents()` |

---

## Database Schema

### New Tables

#### `stage_progression_rules`

```prisma
model StageProgressionRule {
  id            String        @id @default(cuid())
  fromStage     LeadStage
  toStage       LeadStage
  criteria      Json          // ProgressionCriteria object
  autonomyLevel AutonomyLevel
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([fromStage, isActive])
  @@map("stage_progression_rules")
}
```

`criteria` JSON shape:
```ts
interface ProgressionCriteria {
  minScore?: number;           // minimum lead.score
  minEmailOpens?: number;      // minimum email open count (last 30 days)
  minEmailClicks?: number;     // minimum email click count (last 30 days)
  minCompletedTasks?: number;  // minimum completed task count
  maxDaysInStage?: number;     // maximum days since lead entered current stage
}
```

#### `drip_sequences`

```prisma
model DripSequence {
  id             String        @id @default(cuid())
  name           String
  description    String?
  triggerType    String        // 'stage_entered' | 'score_threshold' | 'inactivity_days'
  triggerConfig  Json          // TriggerConfig object
  stopConditions Json          // StopConditions object
  autonomyLevel  AutonomyLevel
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  steps       DripStep[]
  enrollments DripEnrollment[]

  @@map("drip_sequences")
}
```

`triggerConfig` JSON shape:
```ts
interface TriggerConfig {
  stage?: LeadStage;           // for triggerType = 'stage_entered'
  scoreThreshold?: number;     // for triggerType = 'score_threshold'
  inactivityDays?: number;     // for triggerType = 'inactivity_days'
}
```

`stopConditions` JSON shape:
```ts
interface StopConditions {
  onStageReached?: LeadStage;  // stop when lead reaches this stage
  onScoreExceeds?: number;     // stop when lead.score exceeds this value
  onEmailReply?: boolean;      // stop on email_replied event
}
```

#### `drip_steps`

```prisma
model DripStep {
  id              String       @id @default(cuid())
  sequenceId      String
  sequence        DripSequence @relation(fields: [sequenceId], references: [id], onDelete: Cascade)
  stepOrder       Int
  delayHours      Int
  subjectTemplate String
  bodyTemplate    String       @db.Text
  branchCondition String       // 'opened' | 'not_opened' | 'clicked' | 'always'
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([sequenceId, stepOrder])
  @@map("drip_steps")
}
```

#### `drip_enrollments`

```prisma
model DripEnrollment {
  id               String       @id @default(cuid())
  leadId           String
  lead             Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)
  sequenceId       String
  sequence         DripSequence @relation(fields: [sequenceId], references: [id])
  currentStepIndex Int          @default(0)
  status           DripEnrollmentStatus @default(ACTIVE)
  enrolledAt       DateTime     @default(now())
  lastStepSentAt   DateTime?
  stoppedReason    String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([leadId])
  @@index([status])
  @@index([sequenceId])
  @@map("drip_enrollments")
}

enum DripEnrollmentStatus {
  ACTIVE
  COMPLETED
  STOPPED
}
```

Note: The unique constraint preventing duplicate active enrollments is enforced at the application layer in `DripCampaignAgent.enroll()` using a `findFirst` check before insert, since PostgreSQL partial unique indexes require a migration-level expression that Prisma does not yet support natively.

#### `workflow_rules`

```prisma
model WorkflowRule {
  id           String        @id @default(cuid())
  name         String
  description  String?
  triggerEvent String        // CRMEvent value
  conditions   Json          // RuleCondition[]
  actions      Json          // RuleAction[]
  autonomyLevel AutonomyLevel
  isActive     Boolean       @default(true)
  priority     Int           @default(100)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([triggerEvent, isActive])
  @@map("workflow_rules")
}
```

`conditions` JSON shape:
```ts
interface RuleCondition {
  field: 'score' | 'stage' | 'daysInStage' | 'scoreChangedBy' | 'assigneeId';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number | string;
}
```

`actions` JSON shape:
```ts
interface RuleAction {
  type: 'send_email' | 'change_stage' | 'create_task' | 'assign_lead' | 'enroll_drip';
  config: {
    // send_email: { templateHint?: string }
    // change_stage: { targetStage: LeadStage }
    // create_task: { title: string; dueDaysOffset: number; assigneeId?: string }
    // assign_lead: { assigneeId: string }
    // enroll_drip: { sequenceId: string }
    [key: string]: unknown;
  };
}
```

### Modifications to Existing Tables

#### `Lead` table — add `manualOverride`

```prisma
// Add to existing Lead model
manualOverride Boolean @default(false)
dripEnrollments DripEnrollment[]
```

#### `AgentType` enum — add `WORKFLOW_RULE`

```prisma
enum AgentType {
  // ... existing values ...
  STAGE_PROGRESSION   // already present
  DRIP_CAMPAIGN       // already present
  WORKFLOW_RULE       // NEW
}
```

#### `ActionType` enum — add `DRIP_ENROLL`, `RULE_EXECUTION`

```prisma
enum ActionType {
  // ... existing values ...
  DRIP_ENROLL      // NEW — enrollment in a drip sequence
  RULE_EXECUTION   // NEW — workflow rule fired
}
```

---

## Component Design

### 1. Stage Progression Agent

**File:** `apps/vyntrize-crm/lib/agents/stage-progression-agent.ts`

```ts
export class StageProgressionAgent extends Agent {
  constructor() {
    super(AgentType.STAGE_PROGRESSION);
  }

  async execute(context: AgentContext): Promise<AgentActionResult>
  private async evaluateLead(leadId: string): Promise<void>
  private async checkCriteria(lead: Lead, rule: StageProgressionRule): Promise<boolean>
  private async progressLead(lead: Lead, rule: StageProgressionRule): Promise<void>
  private async batchEvaluateAllLeads(): Promise<AgentActionResult>
  getConfig(): AgentConfig
}
```

**Event subscriptions:** `LEAD_UPDATED`, `EMAIL_OPENED`, `EMAIL_CLICKED`, `TASK_COMPLETED`

**Scheduled job:** Daily at `0 2 * * *` (2 AM) — batch evaluation of all active leads

**Criteria evaluation logic:**

```
for each active StageProgressionRule where fromStage === lead.stage:
  1. Skip if lead.manualOverride === true (log INFO, no AgentAction)
  2. Fetch lead with emailTracking, leadTasks, leadScores
  3. Evaluate each criterion in rule.criteria:
     - minScore: lead.score >= criteria.minScore
     - minEmailOpens: count(emailTracking where openedAt != null, last 30d) >= criteria.minEmailOpens
     - minEmailClicks: count(emailTracking where clickedAt != null, last 30d) >= criteria.minEmailClicks
     - minCompletedTasks: count(leadTasks where status = COMPLETED) >= criteria.minCompletedTasks
     - maxDaysInStage: days since lead.updatedAt (stage last changed) <= criteria.maxDaysInStage
  4. If ALL criteria pass:
     - Create AgentAction (type: STAGE_CHANGE, metadata: { fromStage, toStage, criteriaValues })
     - If FULLY_AUTONOMOUS: update lead.stage, emit stage_changed
     - If SUGGEST_APPROVE: leave as PENDING in AgentAction
  5. Safety override: if toStage is WON or LOST, force SUGGEST_APPROVE regardless of rule setting
```

**Approval flow:** Reuses existing `/api/agents/actions/[actionId]/approve` and `/reject` endpoints. On approval, the endpoint calls `stageProgressionAgent.applyApprovedAction(actionId)`.

---

### 2. Drip Campaign Agent

**File:** `apps/vyntrize-crm/lib/agents/drip-campaign-agent.ts`

```ts
export class DripCampaignAgent extends Agent {
  constructor() {
    super(AgentType.DRIP_CAMPAIGN);
  }

  async execute(context: AgentContext): Promise<AgentActionResult>
  async enroll(leadId: string, sequenceId: string, triggeredBy: string): Promise<void>
  async processStep(enrollmentId: string): Promise<void>
  async stopEnrollment(enrollmentId: string, reason: string): Promise<void>
  private async checkStopConditions(lead: Lead, enrollment: DripEnrollment): Promise<string | null>
  private async scheduleNextStep(enrollment: DripEnrollment, step: DripStep, delayHours: number): Promise<void>
  private async processDueSteps(): Promise<AgentActionResult>
  getConfig(): AgentConfig
}
```

**Event subscriptions:** `STAGE_CHANGED`, `LEAD_UPDATED`, `EMAIL_OPENED`, `EMAIL_CLICKED`, `TASK_COMPLETED`

**Scheduled jobs:**
- Every 5 minutes: `*/5 * * * *` — process all due drip step jobs
- The 5-minute processor queries `DripEnrollment` where `status = ACTIVE` and checks BullMQ for due jobs

**Enrollment flow:**

```
1. Check if active DripEnrollment exists for (leadId, sequenceId) → skip if found
2. Check lead.emailOptOut (Contact.emailOptOut) → skip if true
3. Create DripEnrollment { status: ACTIVE, currentStepIndex: 0 }
4. Record AgentAction (type: DRIP_ENROLL, reasoning: trigger condition)
5. If SUGGEST_APPROVE: create PENDING AgentAction, wait for approval
6. If FULLY_AUTONOMOUS: schedule step 0 via JobScheduler with step.delayHours delay
```

**Step execution flow:**

```
1. Fetch enrollment — if status != ACTIVE, abort
2. Check stop conditions → if triggered, call stopEnrollment()
3. Fetch current DripStep by enrollment.currentStepIndex
4. Check branch condition against previous step's email engagement:
   - 'opened': only proceed if previous email was opened
   - 'not_opened': only proceed if previous email was NOT opened within delay window
   - 'clicked': proceed immediately (0-hour delay override)
   - 'always': proceed regardless
5. Invoke EmailGenerationAgent with step templates + lead context
   - On AI failure: fall back to raw subjectTemplate / bodyTemplate
6. Send via EmailService, record EmailLog
7. Update enrollment.currentStepIndex++, enrollment.lastStepSentAt
8. Record AgentAction (type: EMAIL_SEND)
9. If more steps remain: schedule next step via JobScheduler
10. If last step: set enrollment.status = COMPLETED, record completion AgentAction
```

**Stop condition evaluation (called on every relevant event):**

```
For each ACTIVE DripEnrollment on the lead:
  - stage_changed event: check if new stage matches sequence.stopConditions.onStageReached
  - lead_updated (score change): check if lead.score > sequence.stopConditions.onScoreExceeds
  - email_replied event: check sequence.stopConditions.onEmailReply
  - Manual unenroll API: direct call to stopEnrollment()
```

---

### 3. Workflow Rule Engine

**File:** `apps/vyntrize-crm/lib/agents/workflow-rule-engine.ts`

The Workflow Rule Engine is implemented as an `Agent` subclass but acts as a dispatcher — it evaluates stored rules and delegates to other agents/services.

```ts
export class WorkflowRuleEngine extends Agent {
  constructor() {
    super(AgentType.WORKFLOW_RULE);
  }

  async execute(context: AgentContext): Promise<AgentActionResult>
  private async evaluateRules(event: CRMEvent, leadId: string, eventData: Record<string, unknown>): Promise<void>
  private async evaluateConditions(lead: Lead, conditions: RuleCondition[]): Promise<boolean>
  private async executeAction(lead: Lead, action: RuleAction, rule: WorkflowRule): Promise<void>
  private isLoopGuarded(leadId: string, ruleId: string): boolean
  private recordExecution(leadId: string, ruleId: string): void
  getConfig(): AgentConfig
}
```

**Event subscriptions:** All six CRM events — `LEAD_CREATED`, `LEAD_UPDATED`, `STAGE_CHANGED`, `EMAIL_OPENED`, `EMAIL_CLICKED`, `TASK_COMPLETED`

**Rule evaluation flow:**

```
1. Query all WorkflowRules where triggerEvent = event AND isActive = true
2. Sort by priority ASC
3. For each rule:
   a. Check loop guard: if rule fired for this lead >3 times in last 60 min → skip
   b. Validate conditions JSON schema → skip with error log if malformed
   c. Evaluate all conditions (AND logic) against current lead data
   d. If all pass: execute actions in sequence
   e. Record AgentAction (type: RULE_EXECUTION, metadata: { ruleName, matchedConditions, actionsExecuted })
   f. If any action fails: log error, record FAILED AgentAction, continue to next action
```

**Action dispatch:**

| Action Type | Implementation |
|---|---|
| `send_email` | Invoke `EmailGenerationAgent.execute({ leadId })` |
| `change_stage` | Invoke `StageProgressionAgent.progressLead(lead, targetStage)` — respects WON/LOST safety |
| `create_task` | `prisma.leadTask.create(...)` with configured title, due date offset, assignee |
| `assign_lead` | `prisma.lead.update({ assigneeId })` |
| `enroll_drip` | Invoke `DripCampaignAgent.enroll(leadId, sequenceId, 'workflow_rule')` |

**Loop guard implementation:**

```ts
// In-memory map: `${leadId}:${ruleId}` → execution timestamps[]
// Prune entries older than 60 minutes on each check
// Skip rule if timestamps.length >= 3 within the window
private executionLog: Map<string, number[]> = new Map();
```

---

### 4. Agent Registry Updates

**File:** `apps/vyntrize-crm/lib/agents/registry.ts`

```ts
// Add to registerAllAgents():
const stageProgressionAgent = new StageProgressionAgent();
const dripCampaignAgent = new DripCampaignAgent();
const workflowRuleEngine = new WorkflowRuleEngine();

// Stage Progression Agent
eventBus.registerAgent(CRMEvent.LEAD_UPDATED, stageProgressionAgent);
eventBus.registerAgent(CRMEvent.EMAIL_OPENED, stageProgressionAgent);
eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, stageProgressionAgent);
eventBus.registerAgent(CRMEvent.TASK_COMPLETED, stageProgressionAgent);
await jobScheduler.scheduleRecurringJob('StageProgressionAgent', '0 2 * * *', {});
jobScheduler.registerAgent(stageProgressionAgent);

// Drip Campaign Agent
eventBus.registerAgent(CRMEvent.STAGE_CHANGED, dripCampaignAgent);
eventBus.registerAgent(CRMEvent.LEAD_UPDATED, dripCampaignAgent);
eventBus.registerAgent(CRMEvent.EMAIL_OPENED, dripCampaignAgent);
eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, dripCampaignAgent);
eventBus.registerAgent(CRMEvent.TASK_COMPLETED, dripCampaignAgent);
await jobScheduler.scheduleRecurringJob('DripCampaignAgent', '*/5 * * * *', {});
jobScheduler.registerAgent(dripCampaignAgent);

// Workflow Rule Engine
[LEAD_CREATED, LEAD_UPDATED, STAGE_CHANGED, EMAIL_OPENED, EMAIL_CLICKED, TASK_COMPLETED]
  .forEach(event => eventBus.registerAgent(event, workflowRuleEngine));
jobScheduler.registerAgent(workflowRuleEngine);
```

---

## API Endpoints

### Stage Progression Rules

| Method | Path | Description |
|---|---|---|
| GET | `/api/automation/stage-progression` | List all rules |
| POST | `/api/automation/stage-progression` | Create rule |
| PUT | `/api/automation/stage-progression/[id]` | Update rule |
| DELETE | `/api/automation/stage-progression/[id]` | Delete rule |
| PATCH | `/api/automation/stage-progression/[id]/toggle` | Enable/disable |

### Drip Sequences

| Method | Path | Description |
|---|---|---|
| GET | `/api/automation/drip-sequences` | List all sequences |
| POST | `/api/automation/drip-sequences` | Create sequence with steps |
| PUT | `/api/automation/drip-sequences/[id]` | Update sequence |
| DELETE | `/api/automation/drip-sequences/[id]` | Delete (cascade steps, warn on active enrollments) |
| GET | `/api/automation/drip-sequences/[id]/enrollments` | List enrollments for a sequence |
| DELETE | `/api/automation/drip-sequences/[id]/enrollments/[enrollmentId]` | Manual unenroll |

### Workflow Rules

| Method | Path | Description |
|---|---|---|
| GET | `/api/automation/workflow-rules` | List all rules |
| POST | `/api/automation/workflow-rules` | Create rule |
| PUT | `/api/automation/workflow-rules/[id]` | Update rule |
| DELETE | `/api/automation/workflow-rules/[id]` | Delete rule |
| PATCH | `/api/automation/workflow-rules/[id]/toggle` | Enable/disable |

### Automation Summary (for UI header)

| Method | Path | Description |
|---|---|---|
| GET | `/api/automation/summary` | Active enrollments, pending approvals, 24h stats |

### Lead Manual Override

| Method | Path | Description |
|---|---|---|
| PATCH | `/api/crm/leads/[id]/manual-override` | Set/unset manualOverride flag |

All endpoints require an authenticated session with `ADMIN` role (except the lead manual override endpoint, which requires any authenticated session). All return HTTP 403 for unauthorized access.

---

## UI Design

### Route Structure

```
/settings/pipeline/automation          ← main page (tabbed)
  ?tab=stage-progression               ← Stage Progression tab
  ?tab=drip-sequences                  ← Drip Sequences tab
  ?tab=workflow-rules                  ← Workflow Rules tab
```

### Component Tree

```
PipelineAutomationPage (server component — auth check)
└── PipelineAutomationClient (client component)
    ├── AutomationPageHeader
    │   ├── Active enrollments count
    │   └── Pending approvals count
    ├── TabNav (Stage Progression | Drip Sequences | Workflow Rules)
    │
    ├── StageProgressionTab
    │   ├── StageProgressionRuleList
    │   │   └── StageProgressionRuleRow (toggle, edit, delete)
    │   ├── PendingApprovalsList (inline approve/reject)
    │   └── StageProgressionRuleDrawer (create/edit slide-over)
    │       └── CriteriaBuilder (dynamic condition fields)
    │
    ├── DripSequencesTab
    │   ├── DripSequenceList
    │   │   └── DripSequenceRow (toggle, edit, delete, enrollment count)
    │   ├── DripSequenceDrawer (create/edit slide-over)
    │   │   ├── SequenceMetaForm (name, trigger, stop conditions)
    │   │   └── DripStepBuilder (ordered step list with add/remove/reorder)
    │   │       └── DripStepPreview (visual timeline)
    │   └── EnrollmentTable (per-sequence active enrollments)
    │
    └── WorkflowRulesTab
        ├── WorkflowRuleList
        │   └── WorkflowRuleRow (toggle, edit, delete, last execution status)
        └── WorkflowRuleDrawer (create/edit slide-over)
            ├── TriggerSelector
            ├── ConditionBuilder (dynamic AND conditions)
            └── ActionBuilder (ordered action list)
```

### Design System Alignment

All components use the existing CSS variable design system:
- `var(--color-primary)` for interactive elements and active states
- `var(--color-surface)` / `var(--color-surface-elevated)` for card backgrounds
- `var(--color-text)` / `var(--color-text-muted)` for typography
- `var(--color-border)` for dividers and input borders
- `var(--color-success)` / `var(--color-warning)` / `var(--color-error)` for status indicators

Slide-over drawers follow the same pattern as `ContactEditDrawer` in the contacts module.

### Lead Detail Page Additions

The existing lead detail page gains:
- A toggle labeled "Exempt from auto-progression" bound to `lead.manualOverride`
- A visible badge/indicator when `manualOverride` is `true`
- An "Active Drip Sequences" section listing current `DripEnrollment` records with unenroll button

---

## Error Handling and Resilience

### Stage Progression Agent

- Database failure on stage update → log error, mark `AgentAction` as `FAILED`, do not retry (daily batch will re-evaluate)
- Missing pipeline stage reference → skip rule, log WARN with rule ID

### Drip Campaign Agent

- Email send failure → BullMQ exponential backoff (3 attempts, 2s base delay)
- `EmailGenerationAgent` error → fall back to raw `subjectTemplate` / `bodyTemplate`
- Enrollment check race condition → `findFirst` before insert; duplicate enrollment silently skipped

### Workflow Rule Engine

- Malformed `conditions` or `actions` JSON → validate against schema on load; skip rule with structured error log including rule ID
- Action failure → log error, record `FAILED` AgentAction for that action, continue remaining actions
- `EmailGenerationAgent` circuit breaker → opens after 5 consecutive failures within 60 seconds (reuses existing circuit breaker from `EmailGenerationAgent`)
- Loop guard → in-memory execution log, max 3 executions per lead per rule per 60-minute window

### Feature Flags

Each agent checks its environment variable on construction:

```
AGENT_STAGE_PROGRESSION_ENABLED=true|false
AGENT_DRIP_CAMPAIGN_ENABLED=true|false
AGENT_WORKFLOW_RULE_ENABLED=true|false
```

When disabled, the Event Bus skips invocation and logs a single WARN per process startup.

---

## Security

- All `/api/automation/*` endpoints validate session and require `ADMIN` role via the existing `getSession()` helper
- `conditions` and `actions` JSON payloads are validated against Zod schemas before persistence and before execution
- `emailOptOut` check on `Contact` record before any drip email is sent
- WON/LOST stage protection enforced in `StageProgressionAgent.progressLead()` — autonomy level is overridden to `SUGGEST_APPROVE` regardless of rule configuration
- All `AgentAction` records include `agentType`, `leadId`, `reasoning`, and `metadata` per the existing audit trail schema

---

## Correctness Properties

These properties are the basis for property-based tests:

1. **No duplicate active enrollments** — For any `(leadId, sequenceId)` pair, at most one `DripEnrollment` with `status = ACTIVE` exists at any time.

2. **Manual override exclusion** — If `lead.manualOverride = true`, no `AgentAction` of type `STAGE_CHANGE` is created by `StageProgressionAgent` for that lead.

3. **WON/LOST safety** — No `AgentAction` of type `STAGE_CHANGE` targeting `WON` or `LOST` has `status = EXECUTED` without a corresponding `approvedBy` value.

4. **Criteria monotonicity** — A lead is only progressed when every criterion in the matching rule is satisfied; partial satisfaction never triggers progression.

5. **Stop condition completeness** — Once a `DripEnrollment` has `status = STOPPED` or `COMPLETED`, no further `EMAIL_SEND` `AgentAction` is created for that enrollment.

6. **Rule priority ordering** — When multiple `WorkflowRule` records match the same event for the same lead, they are evaluated in ascending `priority` order.

7. **Loop guard bound** — The `WorkflowRuleEngine` fires a given rule for a given lead at most 3 times within any 60-minute window.

8. **Audit completeness** — Every state-changing operation (stage change, drip enrollment, drip step send, rule execution) produces exactly one `AgentAction` record.
