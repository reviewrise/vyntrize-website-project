# Implementation Plan: AI Pipeline Agent System

> **Status**: Phase 2 — Core Agents  
> **Current Focus**: Task Automation Agent (7.x series) — Lead Scoring Agent foundation complete  
> **Last Updated**: 2026-06-18  
> **Stack**: TypeScript · Next.js API Routes · Prisma · BullMQ · Redis · OpenAI GPT-4

---

## 🎯 Up Next — Phase 2: Core Agents

### 7.1 Lead Scoring Agent
**Priority**: High | **Phase**: 2 — Core Agents  
**Why**: Scores each lead 0–100 based on email opens, clicks, website visits, completed tasks, and inactivity — then sets qualification status (qualified/warm/cold) so the sales team can prioritize their pipeline automatically.  
**Design Reference**: [`design.md` → Lead Scoring Agent](./design.md#1-lead-scoring-agent)

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/lib/agents/lead-scoring-agent.ts` extending Agent base class
- [ ] Implement `calculateFactors()` — email opens (+10), clicks (+15), website visits (+20), completed tasks (+5)
- [ ] Implement inactivity penalty — subtract up to 30 points based on days since last activity
- [ ] Implement `determineQualificationStatus()` — score ≥70 = qualified, <40 = cold, else warm
- [ ] Implement `generateReasoning()` — human-readable explanation of the score for the audit trail
- [ ] Update `Lead` record (`score`, `qualificationStatus`) via Prisma on every execution

**Files**:
- `apps/vyntrize-crm/lib/agents/lead-scoring-agent.ts` ← create
- `packages/@platform/vyntrize-db/prisma/schema.prisma` ← verify `score`, `qualificationStatus` fields exist on `Lead`

**Acceptance Criteria**:
- Score is always clamped to 0–100
- Qualification status updates atomically with score
- Every execution records an `AgentAction` with reasoning and metadata
- _Requirements: 3.1–3.9_

---

### 7.2* Lead Scoring Agent — Unit Tests _(optional)_
**Priority**: Low | **Phase**: 2  
**Why**: Validates scoring math edge cases without needing a real database.

**Subtasks**:
- [ ] Test score calculation with various activity combinations
- [ ] Test qualification boundary conditions (score 39, 40, 69, 70)
- [ ] Test inactivity penalty caps at 30 points
- [ ] Test score clamping — never goes below 0 or above 100
- [ ] Mock Prisma database calls

**Files**: `apps/vyntrize-crm/lib/agents/lead-scoring-agent.test.ts` ← create

---

### 7.3 Register Lead Scoring Agent
**Priority**: High | **Phase**: 2  
**Why**: The agent only runs if it's wired into the event bus (real-time) and job scheduler (daily batch). Without registration, the agent code exists but never fires.

**Subtasks**:
- [ ] Register for `lead_created`, `lead_updated`, `email_opened`, `email_clicked` events on the Event Bus
- [ ] Schedule daily batch job (cron `0 0 * * *`) in the Job Scheduler to rescore all active leads
- [ ] Add `LeadScoringAgent` to `AgentRegistry.registerAllAgents()`

**Files**:
- `apps/vyntrize-crm/lib/agents/registry.ts` ← modify
- _Requirements: 3.10, 3.11_

---

### 8.1 Task Automation Agent
**Priority**: High | **Phase**: 2 — Core Agents  
**Why**: When a lead moves to a new pipeline stage, the agent auto-creates a stage-appropriate follow-up task (e.g., CONTACTED → "Follow up call", QUALIFIED → "Prepare proposal"). Uses business-day calculation so due dates never land on weekends.  
**Design Reference**: [`design.md` → Task Automation Agent](./design.md#2-task-automation-agent)

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/lib/agents/task-automation-agent.ts` extending Agent base class
- [ ] Define `stageConfigs` map — one `StageTaskConfig` per pipeline stage with title, description, `dueInDays`, and priority
- [ ] Implement `calculateBusinessDayDue(dueInDays)` — skip Saturday (6) and Sunday (0) when counting forward
- [ ] Implement `determineAssignee(lead)` — use lead's `assignedTo` user, fall back to round-robin or null
- [ ] Guard: check for existing open tasks with same title before creating to prevent duplicates
- [ ] Create task via Prisma and record `AgentAction` with `ActionType.TASK_CREATE`

**Files**:
- `apps/vyntrize-crm/lib/agents/task-automation-agent.ts` ← create
- `apps/vyntrize-crm/lib/agents/registry.ts` ← register agent

**Acceptance Criteria**:
- Each pipeline stage triggers the correct task title, priority, and due date
- Business-day calculation correctly skips weekends
- No duplicate tasks created if agent fires twice for same stage
- Assignee is set when a lead has an assigned user
- _Requirements: 4.1–4.8_

---

### 8.2* Task Automation Agent — Unit Tests _(optional)_
**Priority**: Low | **Phase**: 2

**Subtasks**:
- [ ] Test task creation for each stage (CONTACTED, QUALIFIED, DEMO_SCHEDULED, PROPOSAL_SENT, NEGOTIATING)
- [ ] Test business-day calculation across weekend boundaries
- [ ] Test duplicate prevention logic
- [ ] Test assignee fallback when lead has no assigned user
- [ ] Mock Prisma database calls

**Files**: `apps/vyntrize-crm/lib/agents/task-automation-agent.test.ts` ← create

---

### 8.3 Register Task Automation Agent
**Priority**: High | **Phase**: 2  
**Why**: The agent must listen to `stage_changed` events on the Event Bus to trigger on real-time pipeline moves.

**Subtasks**:
- [ ] Register for `stage_changed` events on the Event Bus
- [ ] Add `TaskAutomationAgent` to `AgentRegistry.registerAllAgents()`

**Files**: `apps/vyntrize-crm/lib/agents/registry.ts` ← modify  
_Requirements: 4.10_

---

### 9.1 Stagnation Detection Agent
**Priority**: High | **Phase**: 2  
**Why**: Leads that haven't moved stages in N days are silently dying. This agent scans all active leads daily, flags stagnant ones, creates a "Review stagnant lead" task, and fires alerts for severely stagnant leads (2× the threshold).  
**Design Reference**: [`design.md` → Stagnation Detection Agent](./design.md#3-stagnation-detection-agent)

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/lib/agents/stagnation-detection-agent.ts` extending Agent base class
- [ ] Define stagnation thresholds per stage (e.g., NEW: 3 days, CONTACTED: 7 days, QUALIFIED: 14 days)
- [ ] Implement `checkLead(leadId)` — single lead evaluation
- [ ] Implement `scanAllLeads()` — batch scan of all non-WON/LOST leads
- [ ] Create a "Review stagnant lead" task when stagnation threshold exceeded
- [ ] Create an `ActionType.ALERT` action for leads at 2× threshold (severely stagnant)
- [ ] Skip WON and LOST leads

**Files**:
- `apps/vyntrize-crm/lib/agents/stagnation-detection-agent.ts` ← create

**Acceptance Criteria**:
- Correct threshold applied per pipeline stage
- No tasks or alerts created for WON/LOST leads
- Severely stagnant leads (2× threshold) generate an alert action in addition to a task
- _Requirements: 5.1–5.6, 5.8_

---

### 9.2* Stagnation Detection Agent — Unit Tests _(optional)_
**Priority**: Low | **Phase**: 2

**Subtasks**:
- [ ] Test threshold detection for each stage
- [ ] Test WON/LOST leads are skipped
- [ ] Test severe stagnation alert generation
- [ ] Mock Prisma calls

---

### 9.3 Register Stagnation Detection Agent
**Priority**: High | **Phase**: 2  
**Why**: Stagnation detection is purely batch-based — no real-time trigger needed. It must run as a scheduled daily job.

**Subtasks**:
- [ ] Schedule daily batch job (cron `0 2 * * *` — 2am off-peak) in Job Scheduler
- [ ] Add `StagnationDetectionAgent` to `AgentRegistry.registerAllAgents()`

**Files**: `apps/vyntrize-crm/lib/agents/registry.ts` ← modify  
_Requirements: 5.7_

---

### 10.1 Email Generation Agent
**Priority**: High | **Phase**: 2  
**Why**: Sales reps waste time writing context-aware follow-up emails from scratch. This agent builds a rich lead context (stage, activities, email history) and uses OpenAI to generate a personalized subject + body. The email goes into an approval queue — never sends automatically.  
**Design Reference**: [`design.md` → Email Generation Agent](./design.md#4-email-generation-agent)

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/lib/agents/email-generation-agent.ts` extending Agent base class
- [ ] Build lead context object from Prisma: lead details, pipeline stage, recent activities, email tracking history
- [ ] Define tone map — CONTACTED = "professional", QUALIFIED = "confident", NEGOTIATING = "urgent"
- [ ] Craft system prompt + user prompt for OpenAI using the context
- [ ] Parse AI response to extract `subject:` and `body:` sections
- [ ] Store generated email in `AgentAction.metadata` with `ActionType.EMAIL_SEND`
- [ ] Set autonomy level to `SUGGEST_APPROVE` — never auto-send

**Files**:
- `apps/vyntrize-crm/lib/agents/email-generation-agent.ts` ← create (already scaffolded — review and complete)

**Acceptance Criteria**:
- Generated email always has both subject and body
- Tone changes based on pipeline stage
- Action is created with `SUGGEST_APPROVE` status — requires human approval before sending
- Input to OpenAI is sanitized via `openAIProvider.sanitizeInput()`
- _Requirements: 7.1–7.6, 7.8_

---

### 10.2* Email Generation Agent — Unit Tests _(optional)_
**Priority**: Low | **Phase**: 2

**Subtasks**:
- [ ] Test tone selection for each pipeline stage
- [ ] Test email parsing from AI response (subject/body extraction)
- [ ] Test fallback when AI response format is unexpected
- [ ] Mock OpenAI Provider and Prisma

---

### 10.3 Email Approval & Send Workflow
**Priority**: High | **Phase**: 2  
**Why**: The approval step is what separates the email generation agent from a spam cannon. An approved action must trigger actual email send via the existing `email-service.ts`.

**Subtasks**:
- [ ] When action is approved via `POST /api/agents/actions/:actionId/approve`, read email from `AgentAction.metadata`
- [ ] Call `emailService.sendEmail()` with subject, body, and lead's email address
- [ ] Update action status to `EXECUTED` on success, `FAILED` with error on failure
- [ ] Record `sentAt` timestamp in metadata

**Files**:
- `apps/vyntrize-crm/app/api/agents/actions/[actionId]/approve/route.ts` ← create
- `apps/vyntrize-crm/lib/email/email-service.ts` ← reference (do not modify)
- _Requirements: 7.7, 7.9_

---

### 11.1 Next Best Action Agent
**Priority**: Medium | **Phase**: 2  
**Why**: Instead of a sales rep guessing what to do with a lead, this agent analyses the full lead context and generates 1–3 specific, ranked recommendations ("Send a case study", "Schedule a demo call"). Falls back to rule-based recommendations if OpenAI is unavailable.  
**Design Reference**: [`design.md` → Next Best Action Agent](./design.md#5-next-best-action-agent)

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/lib/agents/next-best-action-agent.ts` extending Agent base class
- [ ] Build comprehensive context: lead score, stage, days stagnant, email engagement rate, task completion rate
- [ ] Generate 1–3 ranked recommendations via OpenAI with action, reason, and priority
- [ ] Implement rule-based fallback (if OpenAI unavailable): use stage + score + stagnation days to pick from a static decision tree
- [ ] Calculate email engagement rate: `(opens + clicks) / totalSent`
- [ ] Store recommendations in `AgentAction.metadata`

**Files**:
- `apps/vyntrize-crm/lib/agents/next-best-action-agent.ts` ← create

**Acceptance Criteria**:
- Always returns at least 1 recommendation (rule-based fallback guarantees this)
- Recommendations include action, reason, and priority fields
- Rule-based fallback triggers when OpenAI circuit breaker is open
- _Requirements: 8.1–8.5, 8.7_

---

### 11.2* Next Best Action Agent — Unit Tests _(optional)_
**Priority**: Low | **Phase**: 2

**Subtasks**:
- [ ] Test recommendation generation for cold/warm/qualified leads
- [ ] Test rule-based fallback triggers when OpenAI throws
- [ ] Test engagement metric calculations
- [ ] Mock OpenAI Provider and Prisma

---

### 11.3 Next Best Action Caching
**Priority**: Low | **Phase**: 2  
**Why**: Recommendations don't change minute-to-minute. Caching for 1 hour prevents unnecessary OpenAI API calls when a user refreshes the lead detail page.

**Subtasks**:
- [ ] Cache recommendations in Redis keyed by `nba:${leadId}` with 1-hour TTL
- [ ] Skip AI call and return cached result if cache hit
- [ ] Invalidate cache when `lead_updated` or `stage_changed` event fires for that lead

**Files**: `apps/vyntrize-crm/lib/agents/next-best-action-agent.ts` ← modify  
_Requirements: 8.7_

---

### 12.1 Phase 2 Checkpoint
**Priority**: High | **Phase**: 2  
**Why**: Validates all five core agents are wired together correctly before building the management APIs on top.

**Subtasks**:
- [ ] All core agents instantiate without errors
- [ ] Lead Scoring Agent calculates scores and updates the Lead record
- [ ] Task Automation Agent creates correct task on a `stage_changed` event
- [ ] Stagnation Detection Agent's batch job runs and identifies test stagnant leads
- [ ] Email Generation Agent produces a `SUGGEST_APPROVE` action with subject + body
- [ ] Next Best Action Agent returns ≥1 recommendation
- [ ] Ensure all tests pass; ask the user if questions arise

---

## 📋 Backlog — Phase 3: Agent Management APIs

### 13.1 GET /api/agents/actions
**Priority**: High | **Phase**: 3  
**Why**: The agent dashboard UI needs to fetch and filter all agent actions — by lead, type, or status.

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/app/api/agents/actions/route.ts`
- [ ] Support query filters: `leadId`, `agentType`, `status`
- [ ] Add cursor-based pagination (default page size 20)
- [ ] Include joined `lead` and `contact` info in response for display
- [ ] Require auth — any authenticated CRM user can read
- [ ] _Requirements: 13.1, 13.9_

---

### 13.3 POST /api/agents/actions/:id/approve & /reject
**Priority**: High | **Phase**: 3  
**Why**: Core approval workflow — approve triggers execution, reject marks the action as rejected with a reason.

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/app/api/agents/actions/[actionId]/approve/route.ts`
- [ ] Create `apps/vyntrize-crm/app/api/agents/actions/[actionId]/reject/route.ts`
- [ ] Approve: execute the action (send email, apply stage change, etc.), update status to `EXECUTED`
- [ ] Reject: update status to `REJECTED`, store optional `reason` in metadata
- [ ] Both: attribute to the approving user (`approvedBy` / `rejectedBy`)
- [ ] Handle `ALREADY_EXECUTED` guard — idempotency
- [ ] _Requirements: 13.3, 7.9_

---

### 14.1 GET /api/agents/metrics
**Priority**: Medium | **Phase**: 3  
**Why**: Shows agent performance — how many actions were taken, approved, rejected, and how long they took. Needed for the dashboard overview.

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/app/api/agents/metrics/route.ts`
- [ ] Calculate: total actions, approval rate, avg execution time per `agentType`
- [ ] Support `agentType` and `dateRange` query params
- [ ] _Requirements: 13.4, 19.1, 19.2_

---

### 14.2 GET /api/agents/health
**Priority**: Medium | **Phase**: 3  
**Why**: Ops visibility — lets admins see if Redis/BullMQ queue is backing up or if OpenAI circuit breaker is open.

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/app/api/agents/health/route.ts`
- [ ] Return BullMQ queue metrics (waiting, active, completed, failed counts)
- [ ] Return OpenAI provider status (circuit open/closed, current concurrent, token usage)
- [ ] Return per-agent enabled/disabled state
- [ ] _Requirements: 1.8, 19.7, 19.8_

---

### 14.3 POST /api/agents/trigger
**Priority**: Medium | **Phase**: 3  
**Why**: Allows a user to manually fire an agent against a specific lead from the UI — useful for testing and for cases where automatic triggers didn't fire.

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/app/api/agents/trigger/route.ts`
- [ ] Validate `agentType` is a known AgentType enum value
- [ ] Validate `leadId` exists in the database
- [ ] Execute agent and return the `AgentActionResult`
- [ ] Admin-only endpoint
- [ ] _Requirements: 13.8_

---

### 15.x Security & Validation
**Priority**: High | **Phase**: 3  
**Why**: Agent APIs need input validation (Zod) and rate limiting (Redis) to prevent abuse.

**Subtasks**:
- [ ] 15.1 — `apps/vyntrize-crm/lib/agents/auth.ts` — `requireAgentAccess()` for admin-only, `requireAgentApproval()` for approval auth
- [ ] 15.2 — `apps/vyntrize-crm/lib/agents/validation.ts` — Zod schemas for agent contexts and trigger requests
- [ ] 15.3 — `apps/vyntrize-crm/lib/agents/rate-limiter.ts` — Redis-backed `RateLimiter` class, apply to trigger + approval endpoints
- [ ] _Requirements: 16.1, 16.2, 16.5, 16.7, 16.8_

---

### 16.1 Integrate Event Bus with CRM Actions
**Priority**: High | **Phase**: 3  
**Why**: The Event Bus and agents are built, but nothing emits events yet. This task wires CRM mutations (lead create, stage change, email open) to the bus.

**Subtasks**:
- [ ] Emit `lead_created` in leads POST route
- [ ] Emit `lead_updated` in leads PATCH/PUT route
- [ ] Emit `stage_changed` when `pipelineStageId` changes on a lead
- [ ] Emit `email_opened` / `email_clicked` from email tracking routes
- [ ] Emit `task_completed` when task status is set to `completed`
- [ ] _Requirements: 1.1, 3.10, 4.10_

---

### 17.1 Agent Registry & Initialization
**Priority**: High | **Phase**: 3  
**Why**: All agents need a central registry that wires them to the event bus and job scheduler on app startup.

**Subtasks**:
- [ ] Create `apps/vyntrize-crm/lib/agents/registry.ts` with `AgentRegistry` class
- [ ] Implement `registerAllAgents()` — instantiate and wire all agents
- [ ] Call `registerAllAgents()` in Next.js app startup (e.g., `instrumentation.ts` or an API route initializer)
- [ ] _Requirements: 1.1, 1.2, 1.3_

---

### 18.1 Phase 3 Checkpoint
**Priority**: High | **Phase**: 3

**Subtasks**:
- [ ] All agent APIs return correct responses with auth enforced
- [ ] Approval workflow works end-to-end (generate email → approve → send)
- [ ] Events fire from CRM mutations and reach registered agents
- [ ] Manual trigger executes an agent and returns a result
- [ ] Ensure all tests pass; ask the user if questions arise

---

## 🔮 Backlog — Phase 4: Advanced Features _(optional)_

> These are lower priority and can be built incrementally after Phase 3 is stable.

### 19 — Predictive Analytics Agent
- [ ] 19.1 Win probability + close date prediction based on historical lead data
- [ ] 19.2* Unit tests
- [ ] 19.3 Register with Job Scheduler (daily batch)

### 20 — Stage Progression Agent
- [ ] 20.1 Recommend stage moves based on criteria (score threshold, task completion, days elapsed)
- [ ] 20.2* Unit tests
- [ ] 20.3 Register with Event Bus (`lead_updated`, `task_completed`)

### 21 — Drip Campaign Agent
- [ ] 21.1 Multi-step email sequences with delays, stops on reply
- [ ] 21.2* Unit tests
- [ ] 21.3 Register with Job Scheduler (every 5 min)

### 22 — Revenue Forecasting Agent
- [ ] 22.1 Monthly forecast: optimistic / realistic / pessimistic scenarios weighted by win probability
- [ ] 22.2* Unit tests
- [ ] 22.3 Register with Job Scheduler (daily)
- [ ] 22.4 `GET /api/agents/forecast` endpoint for dashboard

### 23 — Agent Dashboard UI
- [ ] 23.1 `app/(crm)/agents/page.tsx` — action list with filters, pending approvals, metrics
- [ ] 23.2 Approve/reject buttons with confirmation dialogs
- [ ] 23.3 Admin: create/update/delete agent rules, set autonomy levels
- [ ] 23.4 Manual trigger UI with execution result display

### 24 — Performance Optimization
- [ ] 24.1 `AgentCache` class (Redis) for rules, scores, recommendations
- [ ] 24.2 `BatchProcessor` utility for bulk lead operations
- [ ] 24.3 Database indexes + materialized view for agent metrics summary

### 25 — Monitoring & Observability
- [ ] 25.1 Prometheus metrics for execution count, duration, error rate, queue depth, OpenAI usage
- [ ] 25.2 Alerts for high error rates, queue depth, rate limit hits
- [ ] 25.3 OpenTelemetry distributed tracing

### 26 — Documentation
- [ ] 26.1 README: architecture overview, setup, env vars
- [ ] 26.2 OpenAPI spec for all agent endpoints
- [ ] 26.3 Developer guide: how to create a new agent + code examples
- [ ] 26.4 Troubleshooting guide

### 27 — Phase 4 Final Checkpoint
- [ ] All agents tested in production-like environment
- [ ] Monitoring and alerting verified
- [ ] Documentation reviewed

---

## ✅ Done — Phase 1: Foundation

> Phase 1 is complete. All foundation components are working.

- [x] **1.1** Prisma schema — `AgentAction`, `AgentRule`, `AgentMetric` models, all enums, indexes, `Lead.score` / `qualificationStatus` / `lastActivityAt` fields
- [x] **1.3** Prisma migration — `add-agent-system` applied and verified
- [x] **2.1** Agent base class — `base-agent.ts` with `execute()`, `recordAction()`, `log()`, feature flags
- [x] **2.3** Event Bus — `event-bus.ts` with `AgentEventBus`, `registerAgent()`, `emitCRMEvent()`
- [x] **3.1** BullMQ + ioredis installed, Redis env vars configured
- [x] **3.2** Job Scheduler — `job-scheduler.ts` with `scheduleJob()`, `scheduleRecurringJob()`, `getMetrics()`, retry + exponential backoff
- [x] **4.1** OpenAI Provider — `openai-provider.ts` with rate limiting, caching, circuit breaker, input sanitization
- [x] **5.1** Error classes — `AgentError`, `OpenAIError`, `RateLimitError`, `CircuitBreakerError`
- [x] **5.2** Retry utility — `retryWithBackoff()` in `retry.ts`
- [x] **5.3** Circuit breaker — `CircuitBreaker` class with CLOSED / OPEN / HALF_OPEN states
- [x] **6.1** Phase 1 checkpoint — all foundation components verified

---

## Notes

- Tasks marked `*` are optional — skip them for faster MVP delivery
- Phase 1 → Phase 2 → Phase 3 ordering is strict; Phase 4 is incremental
- All agents follow the base class pattern: `extend Agent`, implement `execute()` and `getConfig()`
- Event-driven agents respond to real-time CRM events; scheduled agents run batch jobs
- Every agent action includes `reasoning` for the audit trail and explainability
- `SUGGEST_APPROVE` autonomy level means the action is staged for human review — never auto-executes
- OpenAI calls always go through `openAIProvider` (not direct) to get rate limiting, caching, and circuit breaking for free
