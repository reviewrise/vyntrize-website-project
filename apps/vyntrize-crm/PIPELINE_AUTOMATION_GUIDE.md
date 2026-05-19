# Pipeline Automation System — How It Works

This document explains what the pipeline automation system does, how each piece fits together, and how to use it day-to-day.

---

## The Big Picture

The pipeline automation system watches your CRM for activity and takes action automatically. Instead of manually moving leads through stages, sending follow-up emails, or creating tasks, you define rules once and the system handles it.

There are three main capabilities:

1. **Stage Progression** — Leads move between pipeline stages automatically when they meet criteria you define (score, email opens, completed tasks, etc.)
2. **Drip Sequences** — Multi-step email sequences that send automatically based on lead behavior, with branching logic (did they open the last email? click a link?)
3. **Workflow Rules** — Custom trigger → condition → action automations (e.g., "when a lead's score exceeds 70, assign them to the senior rep and enroll in the hot-lead sequence")

Everything runs in the background. Every action the system takes is logged in the Agent Dashboard so you can see exactly what happened and why.

---

## How It's Built (The 16 Tasks)

### Task 1 — Database Schema

Five new tables were added to PostgreSQL via Prisma:

- `StageProgressionRule` — stores your stage progression criteria
- `DripSequence` + `DripStep` — stores email sequences and their individual steps
- `DripEnrollment` — tracks which leads are in which sequences and how far along they are
- `WorkflowRule` — stores your custom trigger/condition/action rules

A `manualOverride` flag was also added to the `Lead` table so you can exempt individual leads from automatic progression.

---

### Task 2 — TypeScript Types & Validation

All the JSON payloads (criteria, conditions, actions) are validated with Zod schemas before they're saved or executed. This prevents malformed rules from breaking anything at runtime.

Key types:
- `ProgressionCriteria` — `{ minScore?, minEmailOpens?, minEmailClicks?, minCompletedTasks?, maxDaysInStage? }`
- `RuleCondition` — `{ field, operator, value }` (e.g., score > 60)
- `RuleAction` — `{ type, config }` (e.g., change_stage, send_email, create_task)

---

### Task 3 — Stage Progression Agent

**File:** `lib/agents/stage-progression-agent.ts`

This agent evaluates leads against your stage progression rules. It runs in two modes:

**Event-driven** — fires immediately when a lead is updated, an email is opened/clicked, or a task is completed. Checks if the lead now meets any progression criteria.

**Batch (nightly at 2 AM)** — scans all active leads to catch anything that was missed by events.

**How criteria evaluation works:**

When a rule says "move from CONTACTED → QUALIFIED when score ≥ 60 AND 2+ email opens", the agent:
1. Fetches the lead's current score, email tracking records, and completed tasks
2. Checks every criterion — ALL must pass, not just some
3. If all pass: creates an `AgentAction` record

**Autonomy levels:**
- `FULLY_AUTONOMOUS` — updates the lead's stage immediately and emits a `stage_changed` event
- `SUGGEST_APPROVE` — creates a pending action that shows up in the Agent Dashboard for you to approve or reject

**Safety rule:** No matter what autonomy level you set, the agent will never autonomously move a lead to `WON` or `LOST`. Those always require approval.

**Manual override:** If a lead has `manualOverride = true`, the agent skips it entirely. You can toggle this on the lead detail page.

---

### Task 4 — Drip Campaign Agent

**File:** `lib/agents/drip-campaign-agent.ts`

This agent manages the full lifecycle of email sequences.

**Enrollment:**
1. A trigger fires (lead enters a stage, score crosses a threshold, or lead has been inactive for N days)
2. The agent checks: is this lead already in an active enrollment for this sequence? If yes, skip.
3. Checks if the contact has `emailOptOut = true`. If yes, skip.
4. Creates a `DripEnrollment` record and schedules the first email via the job queue (BullMQ + Redis)

**Step execution (runs every 5 minutes):**
1. Fetches all active enrollments where a step is due
2. Checks stop conditions — if the lead has reached the stop stage, exceeded the score threshold, or replied to an email, the enrollment is stopped and all pending jobs are cancelled
3. Evaluates the branch condition for the current step:
   - `always` — send regardless
   - `opened` — only send if the previous email was opened
   - `not_opened` — only send if the previous email was NOT opened (re-engagement)
   - `clicked` — send immediately (0-hour delay override) if a link was clicked
4. Calls the Email Generation Agent to personalize the email using AI. If AI fails, falls back to the raw subject/body templates you wrote.
5. Sends via the SMTP email service
6. Updates the enrollment's step index and schedules the next step
7. If it was the last step, marks the enrollment as `COMPLETED`

---

### Task 5 — Workflow Rule Engine

**File:** `lib/agents/workflow-rule-engine.ts`

This is the most flexible piece. It evaluates stored rules whenever a CRM event fires.

**How a rule executes:**
1. A CRM event fires (lead created, updated, stage changed, email opened/clicked, task completed)
2. The engine queries all active rules matching that event, sorted by priority (lower number = higher priority)
3. For each rule, it checks the loop guard — if the same rule has already fired for the same lead 3+ times in the last 60 minutes, it's skipped (prevents infinite loops)
4. Validates the conditions and actions JSON against the Zod schemas — malformed rules are skipped with an error log, not a crash
5. Evaluates all conditions with AND logic — all must pass
6. Executes each action in sequence:
   - `send_email` → calls the Email Generation Agent
   - `change_stage` → calls the Stage Progression Agent (respects WON/LOST safety)
   - `create_task` → creates a task with the configured title, due date, and assignee
   - `assign_lead` → updates the lead's assignee
   - `enroll_drip` → enrolls the lead in a drip sequence
7. If one action fails, it logs the error and continues with the remaining actions
8. Records a `RULE_EXECUTION` AgentAction with the rule name, matched conditions, and actions taken

---

### Task 6 — Agent Registry Integration

**File:** `lib/agents/registry.ts`

All three new agents are registered in the central registry at startup. Each agent subscribes to the relevant CRM events on the Event Bus and registers its scheduled jobs with BullMQ.

Feature flags let you disable any agent without restarting:
```
AGENT_STAGE_PROGRESSION_ENABLED=true
AGENT_DRIP_CAMPAIGN_ENABLED=true
AGENT_WORKFLOW_RULE_ENABLED=true
```

---

### Tasks 7, 8, 9 — REST APIs

All configuration is managed through REST APIs (ADMIN role required):

| Resource | Endpoints |
|---|---|
| Stage Progression Rules | `GET/POST /api/automation/stage-progression` |
| Individual rule | `PUT/DELETE /api/automation/stage-progression/[id]` |
| Toggle rule on/off | `PATCH /api/automation/stage-progression/[id]/toggle` |
| Drip Sequences | `GET/POST /api/automation/drip-sequences` |
| Individual sequence | `PUT/DELETE /api/automation/drip-sequences/[id]` |
| Enrollments for a sequence | `GET /api/automation/drip-sequences/[id]/enrollments` |
| Unenroll a lead | `DELETE /api/automation/drip-sequences/[id]/enrollments/[enrollmentId]` |
| Workflow Rules | `GET/POST /api/automation/workflow-rules` |
| Individual rule | `PUT/DELETE /api/automation/workflow-rules/[id]` |
| Toggle rule on/off | `PATCH /api/automation/workflow-rules/[id]/toggle` |
| Summary stats | `GET /api/automation/summary` |

---

### Task 10 — Lead Manual Override

On any lead detail page, there's an "Exempt from auto-progression" toggle. When enabled:
- The Stage Progression Agent skips this lead entirely
- A visible "Auto-progression disabled" badge appears on the lead
- An "Active Drip Sequences" section shows current enrollments with an unenroll button

The toggle calls `PATCH /api/crm/leads/[id]/manual-override`.

---

### Tasks 11–14 — Pipeline Automation UI

**URL:** `/settings/pipeline/automation` (ADMIN only)

Three tabs:

**Stage Progression tab**
- Lists all your stage progression rules with criteria summary, autonomy level badge, and enable/disable toggle
- Shows pending approvals inline — one-click Approve or Reject for `SUGGEST_APPROVE` actions
- Create/edit rules via a slide-over drawer with the Criteria Builder (each criterion is optional and independently toggled)

**Drip Sequences tab**
- Lists all sequences with trigger condition, step count, and active enrollment count
- Expand any sequence to see its active enrollments with lead name, current step, and enrollment date
- Unenroll individual leads directly from this table
- Create/edit sequences via a drawer with the Step Builder — add/remove/reorder steps, set delays, subject/body templates, and branch conditions
- A visual timeline preview shows the sequence flow

**Workflow Rules tab**
- Lists all rules with trigger event badge, condition/action counts, and last execution time
- Create/edit rules via a drawer with:
  - Trigger selector (6 CRM event types)
  - Condition Builder (dynamic AND conditions with field/operator/value)
  - Action Builder (ordered list of actions with type-specific config)
  - Priority number (lower = runs first when multiple rules match)

The page header shows live stats: active enrollments, pending approvals, rules fired in last 24h, emails sent in last 24h. Auto-refreshes every 30 seconds.

---

### Task 15 — Approve/Reject Integration

When you approve a pending action in the Agent Dashboard:
- `STAGE_CHANGE` actions → the Stage Progression Agent applies the stage change, emits the `stage_changed` event, and marks the action as executed
- `DRIP_ENROLL` actions → the Drip Campaign Agent schedules the first step and marks the action as executed

This means the approval flow is fully wired — approving in the dashboard actually does the thing, not just marks it approved.

---

### Task 16 — Integration Tests

60 tests across 3 test files verify the 8 correctness properties:

1. A lead can never have two active enrollments in the same sequence at the same time
2. A lead with `manualOverride = true` never gets a stage change action created
3. No stage change to WON or LOST is ever executed without approval
4. A lead only progresses when ALL criteria in a rule are satisfied — partial satisfaction does nothing
5. Once an enrollment is stopped or completed, no more emails are sent for it
6. Workflow rules always execute in ascending priority order
7. A workflow rule fires at most 3 times per lead per rule within any 60-minute window
8. Every state-changing operation produces exactly one AgentAction audit record

Run with: `npm test -- --forceExit`

---

## Where Everything Lives

```
lib/agents/
  stage-progression-agent.ts    ← Stage Progression Agent
  drip-campaign-agent.ts        ← Drip Campaign Agent
  workflow-rule-engine.ts       ← Workflow Rule Engine
  registry.ts                   ← Agent registration & event wiring
  event-bus.ts                  ← CRM event dispatcher
  job-scheduler.ts              ← BullMQ job queue

lib/automation/
  types.ts                      ← TypeScript interfaces
  schemas.ts                    ← Zod validation schemas
  index.ts                      ← Exports

app/api/automation/
  stage-progression/            ← Stage rule CRUD
  drip-sequences/               ← Sequence CRUD + enrollment management
  workflow-rules/               ← Workflow rule CRUD
  summary/                      ← Dashboard stats

app/(crm)/settings/pipeline/automation/
  page.tsx                      ← Server component (auth check)
  PipelineAutomationClient.tsx  ← Main client with tab navigation
  components/
    StageProgressionTab.tsx
    DripSequencesTab.tsx
    WorkflowRulesTab.tsx
```

---

## Environment Variables

```env
# Feature flags — set to false to disable an agent without restarting
AGENT_STAGE_PROGRESSION_ENABLED=true
AGENT_DRIP_CAMPAIGN_ENABLED=true
AGENT_WORKFLOW_RULE_ENABLED=true

# Email throttling (used by drip sequences)
EMAIL_MAX_PER_DAY=1
EMAIL_MAX_PER_WEEK=3
EMAIL_MIN_HOURS_BETWEEN=24

# Redis (required for job scheduling)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Quick Start: Setting Up Your First Automation

**Example: Auto-qualify leads that score 70+ and have opened at least 2 emails**

1. Go to `/settings/pipeline/automation`
2. Click the **Stage Progression** tab
3. Click **+ New Rule**
4. Set: From Stage = `CONTACTED`, To Stage = `QUALIFIED`
5. Set Autonomy = `Suggest & Approve` (safe to start)
6. In Criteria Builder, enable:
   - Min lead score: `70`
   - Min email opens: `2`
7. Save

Now whenever a lead in CONTACTED stage hits score 70 with 2+ opens, you'll see a pending approval in the Stage Progression tab. Once you're confident the rules are working correctly, switch to `Fully Autonomous`.

**Example: Enroll new leads in a welcome sequence**

1. Click the **Drip Sequences** tab
2. Click **+ New Sequence**
3. Name it "New Lead Welcome"
4. Trigger: `Lead enters stage` → `NEW`
5. Stop when: stage reaches `QUALIFIED`
6. Add 3 steps:
   - Step 1: delay 0h, subject "Welcome to Vyntrize", branch `always`
   - Step 2: delay 48h, subject "How can we help?", branch `opened`
   - Step 3: delay 72h, subject "Still interested?", branch `not_opened`
7. Save

New leads will automatically receive this sequence. Step 3 only sends if they didn't open step 2 — it's a re-engagement variant.
