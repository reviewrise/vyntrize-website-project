# Implementation Plan: Analytics & CRM Extension

> **Status**: Phase 3 — CRM Enhancements (partially complete) + Phase 4 Reporting (complete)  
> **Current Focus**: Remaining Phase 3 tasks — Email Sending & Tracking (3.4), Custom Fields (3.6) + Phase 5 Testing  
> **Last Updated**: 2026-06-18  
> **Stack**: TypeScript · Next.js · Prisma · PostgreSQL · Recharts · Resend/SendGrid

---

## 🎯 Up Next — Phase 3 Remaining & Phase 5

### 3.4 Email Sending & Tracking
**Priority**: Medium | **Phase**: 3 — CRM Enhancements  
**Why**: Sales reps need to send templated emails directly from the lead detail page and see whether recipients opened or clicked. Tracking is done via a 1×1 pixel and redirect links — both proxied through the CRM API.  
**Design Reference**: [`design.md` → Email Tracking table](./design.md#23-crm-enhancement-tables)

**Subtasks**:
- [ ] Integrate email service (Resend or SendGrid) — configure API key in env, create wrapper in `email-service.ts`
- [ ] Create `POST /api/crm/leads/[id]/send-email` — accepts `{ templateId?, subject, body }`, renders template variables, sends via email service, creates `email_tracking` record
- [ ] Create tracking pixel endpoint `GET /api/email/track/open/[trackingId]` — returns 1×1 transparent GIF, updates `opened_at` + increments `open_count`
- [ ] Create click redirect endpoint `GET /api/email/track/click/[trackingId]` — updates `clicked_at` + increments `click_count`, then redirects to target URL
- [ ] Build `EmailComposer` modal component — template selector, subject/body fields, send button with loading state
- [ ] Display email history on lead detail page (sent, opened, clicked timestamps)

**Files**:
- `apps/vyntrize-crm/app/api/crm/leads/[id]/send-email/route.ts` ← create
- `apps/vyntrize-crm/app/api/email/track/route.ts` ← create
- `apps/vyntrize-crm/components/EmailComposer.tsx` ← create
- `apps/vyntrize-crm/lib/email/email-service.ts` ← modify (add send + tracking integration)

**Acceptance Criteria**:
- Emails send successfully from the CRM lead detail page
- Templates render variables correctly (`{{firstName}}`, `{{companyName}}`)
- Open and click events are recorded with timestamps
- Email history is visible per lead
- _Requirements: Phase 3_

---

### 3.6 Custom Fields
**Priority**: Low | **Phase**: 3 — CRM Enhancements  
**Why**: Different teams capture different lead data. Custom fields let admins define extra fields (text, number, date, select) on leads/contacts/companies without schema changes.  
**Design Reference**: [`design.md` → Custom Fields tables](./design.md#23-crm-enhancement-tables)

**Subtasks**:
- [ ] Prisma schema: `CustomField` and `CustomFieldValue` models with `entity_type`, `field_type`, `options` (JSONB), `display_order`
- [ ] Create API endpoints (CRUD): `GET/POST /api/crm/custom-fields`, `PATCH/DELETE /api/crm/custom-fields/[id]`
- [ ] Create API for values: `GET/POST /api/crm/leads/[id]/custom-fields`
- [ ] Build `CustomFieldManager` admin page at `app/(crm)/settings/custom-fields/page.tsx`
- [ ] Build `CustomFieldInput` component — renders the appropriate input type based on `field_type`
- [ ] Add custom fields section to lead detail/edit form
- [ ] Implement per-field validation (required, min/max for numbers, valid option for select)

**Files**:
- `packages/@platform/vyntrize-db/prisma/schema.prisma` ← add `CustomField`, `CustomFieldValue` models
- `apps/vyntrize-crm/app/api/crm/custom-fields/route.ts` ← create
- `apps/vyntrize-crm/app/(crm)/settings/custom-fields/page.tsx` ← create
- `apps/vyntrize-crm/components/CustomFieldManager.tsx` ← create
- `apps/vyntrize-crm/components/CustomFieldInput.tsx` ← create

**Acceptance Criteria**:
- Admin can create fields of type: text, number, date, select, multi-select, boolean
- Fields appear in lead forms in display order
- Field values are stored and retrieved correctly
- Required field validation prevents saving without a value
- _Requirements: Phase 3_

---

### 5.1 Unit Tests
**Priority**: High | **Phase**: 5 — Testing & Optimization  
**Why**: Core business logic (scoring, attribution, session management) should be validated in isolation before integration tests.

**Subtasks**:
- [ ] `AnalyticsTracker` — session creation, event queuing, flush logic
- [ ] `LeadScorer` — score calculation with all factor combinations, qualification boundary conditions
- [ ] `AttributionService` — first touch capture, last touch update, touchpoint accumulation
- [ ] `SessionManager` — session timeout logic, session ID generation
- [ ] `EventProcessor` — bot detection, IP hashing, event storage
- [ ] Target: ≥80% code coverage on service layer

**Files**: `apps/vyntrize-crm/lib/**/*.test.ts`, `apps/vyntrize-website/lib/**/*.test.ts` ← create

---

### 5.2 Integration Tests
**Priority**: High | **Phase**: 5

**Subtasks**:
- [ ] Analytics tracking API (`POST /api/track`) — valid event stored, invalid rejected, rate limiting
- [ ] Dashboard API — date filtering returns correct metrics, granularity switching
- [ ] CRM APIs — notes CRUD, tasks CRUD, pipeline stage updates
- [ ] Email send API — template rendering, tracking record creation

---

### 5.3 E2E Tests
**Priority**: Medium | **Phase**: 5

**Subtasks**:
- [ ] Full analytics tracking flow: page view → event stored → appears in dashboard
- [ ] Lead creation → score calculation → qualification status update
- [ ] Task management: create → assign → mark complete
- [ ] Dashboard rendering with real data

---

### 5.4 Performance Optimization
**Priority**: High | **Phase**: 5  
**Why**: `analytics_events` will grow fast. Partitioning and index coverage are critical before load hits production.

**Subtasks**:
- [ ] Verify `analytics_events` monthly partitioning is in place and new partitions auto-create
- [ ] Add missing indexes: `leads.score`, `leads.qualification_status`, `leads.last_activity_at`, `leads.visitor_id`
- [ ] Add Redis caching layer to dashboard service (5-min TTL for metrics, 24-hr for daily aggregations)
- [ ] Profile slow queries in dashboard API with `EXPLAIN ANALYZE` and optimize
- [ ] Load test `POST /api/track` at 100 rps and confirm p95 < 200ms

---

### 5.5 Documentation
**Priority**: Medium | **Phase**: 5

**Subtasks**:
- [ ] Analytics tracking setup guide (how to add tracking to a new page/component)
- [ ] Lead scoring algorithm documentation (factors, weights, qualification thresholds)
- [ ] API endpoint reference for all new CRM endpoints
- [ ] User guide: tasks, notes, email templates, pipeline stages
- [ ] Deployment steps for running migrations and seeding initial data

---

## ✅ Done — Phase 1: Analytics Foundation

> Phase 1 complete. Website tracker, API, and cookie consent are live.

- [x] **1.1** Database schema — `analytics_events`, `analytics_sessions`, `analytics_daily_metrics` tables with partitioning and indexes
- [x] **1.2** Analytics Tracker library — session management, page view tracking, custom events, UTM capture, batch queuing, DNT support
- [x] **1.3** `POST /api/track` endpoint — validation, rate limiting, bot detection, IP hashing, event + session storage
- [x] **1.4** Tracker integrated into website — root layout initialization, contact form tracking, CTA click tracking
- [x] **1.5** Cookie Consent component — localStorage persistence, DNT respect, tracking gated on consent

---

## ✅ Done — Phase 2: Lead Intelligence & Scoring

> Phase 2 complete. Lead scoring, attribution, and activity tracking are operational.

- [x] **2.1** Lead Activity Tracking — visitor ID linked to lead on form submit, activities created from analytics events, `last_activity_at` updated
- [x] **2.2** Lead Scoring Algorithm — `LeadScorer` class, scoring factors + weights, qualification status (new/cold/warm/mql/sql), score history
- [x] **2.3** Score Recalculation Job — hourly cron, batch processing of active leads, score change logging
- [x] **2.4** Lead Attribution Tracking — `AttributionService`, first-touch + last-touch capture, all touchpoints stored in JSONB
- [x] **2.5** Lead Activity Timeline component — chronological display, activity type icons, pagination, type filter
- [x] **2.6** Lead Score Widget — score gauge, qualification badge, trend indicator (up/down), score breakdown on expand

---

## ✅ Done — Phase 3: CRM Enhancements (Partial)

> Tasks 3.1–3.5 complete. Tasks 3.4 and 3.6 remain (see Up Next above).

- [x] **3.1** Notes System — CRUD API, `LeadNotes` component, pinned notes, user attribution
- [x] **3.2** Task Management — CRUD API, `TaskList` + `TaskModal` components, status/priority/assignee/due date, task filters
- [x] **3.3** Email Templates — CRUD API, template editor, variable substitution (`{{firstName}}` etc.), shared templates, preview
- [x] **3.5** Pipeline Stages — CRUD API, stage ordering, win probability settings, automation rules per stage, lead status update on stage change

---

## ✅ Done — Phase 4: Reporting & Dashboards

> Phase 4 fully complete. All dashboard components and data APIs are live.

- [x] **4.1** Analytics Dashboard API — `/api/analytics/dashboard` with date range, granularity, top sources, top pages, metrics calculation
- [x] **4.2** Dashboard Metric Cards — sessions, page views, unique visitors, conversion rate, trend indicators, period comparison
- [x] **4.3** Trend Charts — Recharts line + bar charts, date range selector, granularity selector, responsive, tooltips
- [x] **4.4** Funnel Visualization — `/api/analytics/funnel`, `FunnelChart` component, conversion + drop-off rates per step
- [x] **4.5** Source Attribution Report — `/api/analytics/sources`, `SourcesTable`, sessions + conversions per source, CSV export, sorting/filtering
- [x] **4.6** Top Pages Report — `/api/analytics/pages`, `TopPagesTable`, view count, avg time on page, bounce rate, pagination
- [x] **4.7** Export Functionality — CSV export working for all report tables; PDF export skipped for MVP
- [x] **4.8** Daily Metrics Aggregation Job — daily cron, calculates and stores in `analytics_daily_metrics`, error logging

---

## Notes

- Tasks marked `*` are optional — skip for faster MVP
- Phase ordering: 1 → 2 → 3 → 4 → 5. Phase 5 (testing) can run in parallel with Phase 3 completion
- `analytics_events` partitioning must be maintained — add a new monthly partition before each month starts
- Lead scoring runs hourly via cron; individual score updates also trigger on form submission and activity events
- All email tracking uses opaque IDs — never expose lead IDs in tracking pixel/redirect URLs
- Custom fields (3.6) store values as `TEXT` — the application layer handles type coercion based on `field_type`
