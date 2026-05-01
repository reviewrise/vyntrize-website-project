# Analytics & CRM Extension - Implementation Tasks

## Phase 1: Foundation & Analytics Tracking (Week 1-2)

### Task 1.1: Database Schema Setup
**Status**: pending
**Priority**: high
**Estimated Time**: 4 hours

**Description**: Create database migrations for analytics and CRM enhancement tables.

**Subtasks**:
- [ ] Create migration for `analytics_events` table with monthly partitioning
- [ ] Create migration for `analytics_sessions` table
- [ ] Create migration for `analytics_daily_metrics` table
- [ ] Create migration for `lead_activities` table
- [ ] Create migration for `lead_scores` table
- [ ] Create migration for `lead_sources` table
- [ ] Add new columns to existing `leads`, `contacts`, `companies` tables
- [ ] Create indexes for performance optimization
- [ ] Test migrations on development database

**Files to Create/Modify**:
- `packages/@platform/vyntrize-db/prisma/migrations/XXX_add_analytics_tables.sql`
- `packages/@platform/vyntrize-db/prisma/schema.prisma`

**Acceptance Criteria**:
- All tables created successfully
- Indexes are in place
- Partitioning works for analytics_events
- No breaking changes to existing schema

---

### Task 1.2: Analytics Tracker Library
**Status**: pending
**Priority**: high
**Estimated Time**: 6 hours

**Description**: Build client-side analytics tracking library for the website.

**Subtasks**:
- [ ] Create `AnalyticsTracker` class with session management
- [ ] Implement page view tracking
- [ ] Implement custom event tracking
- [ ] Implement form submission tracking
- [ ] Add UTM parameter capture from URL
- [ ] Implement visitor ID generation (cookie-based)
- [ ] Add batch event queuing and flushing
- [ ] Implement privacy features (DNT respect, IP anonymization)
- [ ] Add error handling and retry logic
- [ ] Write unit tests

**Files to Create/Modify**:
- `apps/vyntrize-website/lib/analytics/tracker.ts`
- `apps/vyntrize-website/lib/analytics/session-manager.ts`
- `apps/vyntrize-website/lib/analytics/types.ts`
- `apps/vyntrize-website/lib/analytics/utils.ts`

**Acceptance Criteria**:
- Tracker initializes without errors
- Events are queued and sent in batches
- Session management works correctly
- UTM parameters are captured
- Privacy features work as expected

---

### Task 1.3: Analytics API Endpoint
**Status**: pending
**Priority**: high
**Estimated Time**: 4 hours

**Description**: Create API endpoint to receive and process analytics events.

**Subtasks**:
- [ ] Create `/api/track` POST endpoint
- [ ] Implement request validation
- [ ] Add rate limiting
- [ ] Implement bot detection
- [ ] Hash IP addresses for privacy
- [ ] Parse user agent for device/browser info
- [ ] Store events in database
- [ ] Update session records
- [ ] Add error logging
- [ ] Write integration tests

**Files to Create/Modify**:
- `apps/vyntrize-website/app/api/track/route.ts`
- `apps/vyntrize-website/lib/analytics/event-processor.ts`
- `apps/vyntrize-website/lib/analytics/bot-detector.ts`

**Acceptance Criteria**:
- Endpoint accepts valid events
- Invalid requests are rejected
- Events are stored in database
- Sessions are updated correctly
- Rate limiting works

---

### Task 1.4: Integrate Tracker into Website
**Status**: pending
**Priority**: high
**Estimated Time**: 3 hours

**Description**: Add analytics tracking to all website pages.

**Subtasks**:
- [ ] Initialize tracker in root layout
- [ ] Add automatic page view tracking
- [ ] Track contact form submissions
- [ ] Track CTA button clicks
- [ ] Track navigation interactions
- [ ] Add tracking to demo request forms
- [ ] Test tracking in development
- [ ] Verify events in database

**Files to Create/Modify**:
- `apps/vyntrize-website/app/layout.tsx`
- `apps/vyntrize-website/components/ContactForm.tsx`
- `apps/vyntrize-website/components/CTAButton.tsx`

**Acceptance Criteria**:
- Page views are tracked automatically
- Form submissions are tracked
- Button clicks are tracked
- No performance impact on page load

---

### Task 1.5: Cookie Consent Component
**Status**: pending
**Priority**: medium
**Estimated Time**: 3 hours

**Description**: Implement cookie consent banner for GDPR compliance.

**Subtasks**:
- [ ] Create `CookieConsent` component
- [ ] Store consent preferences in localStorage
- [ ] Respect DNT header
- [ ] Disable tracking if consent not given
- [ ] Add privacy policy link
- [ ] Style consent banner
- [ ] Test consent flow

**Files to Create/Modify**:
- `apps/vyntrize-website/components/CookieConsent.tsx`
- `apps/vyntrize-website/lib/analytics/consent-manager.ts`

**Acceptance Criteria**:
- Banner displays on first visit
- Consent is stored correctly
- Tracking respects consent status
- DNT header is respected

---

## Phase 2: Lead Intelligence & Scoring (Week 3-4)

### Task 2.1: Lead Activity Tracking
**Status**: pending
**Priority**: high
**Estimated Time**: 4 hours

**Description**: Link analytics events to lead records for activity tracking.

**Subtasks**:
- [ ] Create service to associate visitor with lead
- [ ] Update lead record when form is submitted
- [ ] Create lead activities from analytics events
- [ ] Implement activity deduplication
- [ ] Add activity type categorization
- [ ] Update `last_activity_at` on leads table
- [ ] Write unit tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/lib/services/lead-activity-service.ts`
- `apps/vyntrize-website/app/api/contact/route.ts` (update)

**Acceptance Criteria**:
- Visitor ID is linked to lead on form submission
- Activities are created from events
- Lead's last activity timestamp is updated
- No duplicate activities

---

### Task 2.2: Lead Scoring Algorithm
**Status**: pending
**Priority**: high
**Estimated Time**: 6 hours

**Description**: Implement lead scoring based on behavior and demographics.

**Subtasks**:
- [ ] Create `LeadScorer` class
- [ ] Define scoring factors and weights
- [ ] Implement score calculation logic
- [ ] Add qualification status determination
- [ ] Create score history tracking
- [ ] Implement score recalculation trigger
- [ ] Add score breakdown (factors)
- [ ] Write unit tests with various scenarios

**Files to Create/Modify**:
- `apps/vyntrize-crm/lib/scoring/lead-scorer.ts`
- `apps/vyntrize-crm/lib/scoring/scoring-factors.ts`
- `apps/vyntrize-crm/lib/scoring/types.ts`

**Acceptance Criteria**:
- Score calculation is accurate
- Qualification status is correct
- Score factors are tracked
- Edge cases are handled

---

### Task 2.3: Score Recalculation Job
**Status**: pending
**Priority**: medium
**Estimated Time**: 3 hours

**Description**: Create background job to recalculate lead scores periodically.

**Subtasks**:
- [ ] Create cron job for score recalculation
- [ ] Query leads with recent activity
- [ ] Recalculate scores in batches
- [ ] Update lead records
- [ ] Log score changes
- [ ] Add error handling
- [ ] Configure job schedule

**Files to Create/Modify**:
- `apps/vyntrize-crm/lib/jobs/recalculate-scores.ts`
- `apps/vyntrize-crm/lib/jobs/scheduler.ts`

**Acceptance Criteria**:
- Job runs on schedule
- Scores are updated correctly
- Performance is acceptable
- Errors are logged

---

### Task 2.4: Lead Attribution Tracking
**Status**: pending
**Priority**: medium
**Estimated Time**: 4 hours

**Description**: Track first-touch and last-touch attribution for leads.

**Subtasks**:
- [ ] Create `AttributionService` class
- [ ] Capture first-touch UTM parameters
- [ ] Update last-touch on each visit
- [ ] Store all touchpoints in JSONB
- [ ] Create API endpoint for attribution data
- [ ] Add attribution to lead detail view
- [ ] Write unit tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/lib/attribution/attribution-service.ts`
- `apps/vyntrize-crm/app/api/crm/leads/[id]/attribution/route.ts`

**Acceptance Criteria**:
- First touch is captured correctly
- Last touch is updated on visits
- All touchpoints are stored
- Attribution data is accessible via API

---

### Task 2.5: Lead Activity Timeline Component
**Status**: pending
**Priority**: high
**Estimated Time**: 5 hours

**Description**: Build UI component to display lead activity timeline.

**Subtasks**:
- [ ] Create `LeadActivityTimeline` component
- [ ] Fetch activities from API
- [ ] Display activities chronologically
- [ ] Add activity type icons
- [ ] Implement pagination
- [ ] Add filtering by activity type
- [ ] Style timeline with Tailwind
- [ ] Add loading and error states

**Files to Create/Modify**:
- `apps/vyntrize-crm/components/LeadActivityTimeline.tsx`
- `apps/vyntrize-crm/app/api/crm/leads/[id]/activities/route.ts`

**Acceptance Criteria**:
- Timeline displays all activities
- Activities are sorted by date
- Pagination works correctly
- UI is responsive and accessible

---

### Task 2.6: Lead Score Widget
**Status**: pending
**Priority**: medium
**Estimated Time**: 3 hours

**Description**: Create widget to display lead score and qualification status.

**Subtasks**:
- [ ] Create `LeadScoreWidget` component
- [ ] Display current score with visual indicator
- [ ] Show qualification status badge
- [ ] Display score trend (up/down arrow)
- [ ] Show score breakdown on hover/click
- [ ] Add score history chart
- [ ] Style with Tailwind

**Files to Create/Modify**:
- `apps/vyntrize-crm/components/LeadScoreWidget.tsx`
- `apps/vyntrize-crm/components/ScoreBreakdown.tsx`

**Acceptance Criteria**:
- Score is displayed prominently
- Qualification status is clear
- Score breakdown is informative
- Widget is visually appealing

---

## Phase 3: CRM Enhancements (Week 5-6)

### Task 3.1: Notes System
**Status**: pending
**Priority**: high
**Estimated Time**: 5 hours

**Description**: Implement notes functionality for leads.

**Subtasks**:
- [ ] Create database schema for notes
- [ ] Create API endpoints (CRUD)
- [ ] Build `LeadNotes` component
- [ ] Add note creation form
- [ ] Implement note editing
- [ ] Add note deletion with confirmation
- [ ] Implement pinned notes
- [ ] Add rich text editor (optional)
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/crm/leads/[id]/notes/route.ts`
- `apps/vyntrize-crm/components/LeadNotes.tsx`
- `apps/vyntrize-crm/components/NoteForm.tsx`

**Acceptance Criteria**:
- Notes can be created, edited, deleted
- Pinned notes appear at top
- Notes are associated with user
- UI is intuitive

---

### Task 3.2: Task Management
**Status**: pending
**Priority**: high
**Estimated Time**: 6 hours

**Description**: Build task management system for leads.

**Subtasks**:
- [ ] Create database schema for tasks
- [ ] Create API endpoints (CRUD)
- [ ] Build `TaskList` component
- [ ] Create task creation modal
- [ ] Implement task editing
- [ ] Add task status updates
- [ ] Implement task assignment
- [ ] Add due date picker
- [ ] Create task filters (status, priority, assignee)
- [ ] Add task notifications (optional)
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/crm/tasks/route.ts`
- `apps/vyntrize-crm/app/(crm)/tasks/page.tsx`
- `apps/vyntrize-crm/components/TaskList.tsx`
- `apps/vyntrize-crm/components/TaskModal.tsx`

**Acceptance Criteria**:
- Tasks can be created and assigned
- Task status can be updated
- Filters work correctly
- Due dates are tracked

---

### Task 3.3: Email Templates
**Status**: pending
**Priority**: medium
**Estimated Time**: 5 hours

**Description**: Create email template management system.

**Subtasks**:
- [ ] Create database schema for templates
- [ ] Create API endpoints (CRUD)
- [ ] Build template list page
- [ ] Create template editor
- [ ] Implement variable substitution ({{firstName}}, etc.)
- [ ] Add template preview
- [ ] Implement shared templates
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/crm/email-templates/route.ts`
- `apps/vyntrize-crm/app/(crm)/email-templates/page.tsx`
- `apps/vyntrize-crm/components/TemplateEditor.tsx`

**Acceptance Criteria**:
- Templates can be created and edited
- Variables are substituted correctly
- Templates can be shared
- Preview works

---

### Task 3.4: Email Sending & Tracking
**Status**: pending
**Priority**: medium
**Estimated Time**: 6 hours

**Description**: Implement email sending with tracking.

**Subtasks**:
- [ ] Integrate email service (SendGrid/Resend)
- [ ] Create send email API endpoint
- [ ] Build email compose modal
- [ ] Implement template selection
- [ ] Add email tracking (opens, clicks)
- [ ] Create tracking pixel
- [ ] Track link clicks
- [ ] Display email history on lead page
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/crm/leads/[id]/send-email/route.ts`
- `apps/vyntrize-crm/app/api/email/track/route.ts`
- `apps/vyntrize-crm/components/EmailComposer.tsx`
- `apps/vyntrize-crm/lib/email/email-service.ts`

**Acceptance Criteria**:
- Emails can be sent from CRM
- Templates can be used
- Opens and clicks are tracked
- Email history is visible

---

### Task 3.5: Pipeline Stages
**Status**: pending
**Priority**: medium
**Estimated Time**: 5 hours

**Description**: Create customizable pipeline stages.

**Subtasks**:
- [ ] Create database schema for stages
- [ ] Create API endpoints (CRUD)
- [ ] Build pipeline settings page
- [ ] Implement stage ordering
- [ ] Add stage probability settings
- [ ] Create automation rules per stage
- [ ] Update lead status on stage change
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/crm/pipeline-stages/route.ts`
- `apps/vyntrize-crm/app/(crm)/settings/pipeline/page.tsx`
- `apps/vyntrize-crm/components/PipelineSettings.tsx`

**Acceptance Criteria**:
- Stages can be created and reordered
- Automation rules work
- Lead status updates correctly

---

### Task 3.6: Custom Fields
**Status**: pending
**Priority**: low
**Estimated Time**: 6 hours

**Description**: Implement custom field system for flexible data capture.

**Subtasks**:
- [ ] Create database schema for custom fields
- [ ] Create API endpoints (CRUD)
- [ ] Build custom field management UI
- [ ] Implement field type support (text, number, date, select)
- [ ] Add custom fields to lead forms
- [ ] Display custom fields on lead detail
- [ ] Implement field validation
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/crm/custom-fields/route.ts`
- `apps/vyntrize-crm/app/(crm)/settings/custom-fields/page.tsx`
- `apps/vyntrize-crm/components/CustomFieldManager.tsx`
- `apps/vyntrize-crm/components/CustomFieldInput.tsx`

**Acceptance Criteria**:
- Custom fields can be created
- Fields appear in forms
- Validation works
- Values are stored correctly

---

## Phase 4: Reporting & Dashboards (Week 7-8)

### Task 4.1: Analytics Dashboard API
**Status**: pending
**Priority**: high
**Estimated Time**: 5 hours

**Description**: Create API endpoints for dashboard data.

**Subtasks**:
- [ ] Create `/api/analytics/dashboard` endpoint
- [ ] Implement metrics calculation
- [ ] Add date range filtering
- [ ] Implement granularity (hour, day, week, month)
- [ ] Create top sources query
- [ ] Create top pages query
- [ ] Optimize queries with indexes
- [ ] Add caching layer
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/analytics/dashboard/route.ts`
- `apps/vyntrize-crm/lib/analytics/dashboard-service.ts`
- `apps/vyntrize-crm/lib/analytics/queries.ts`

**Acceptance Criteria**:
- Dashboard data loads quickly
- Metrics are accurate
- Date filtering works
- Caching improves performance

---

### Task 4.2: Dashboard Metrics Cards
**Status**: pending
**Priority**: high
**Estimated Time**: 4 hours

**Description**: Build metric cards for dashboard overview.

**Subtasks**:
- [ ] Create `MetricCard` component
- [ ] Display total sessions
- [ ] Display total page views
- [ ] Display unique visitors
- [ ] Display conversion rate
- [ ] Add trend indicators (up/down)
- [ ] Add comparison to previous period
- [ ] Style with Tailwind

**Files to Create/Modify**:
- `apps/vyntrize-crm/components/MetricCard.tsx`
- `apps/vyntrize-crm/app/(crm)/analytics/page.tsx`

**Acceptance Criteria**:
- Metrics display correctly
- Trends are accurate
- UI is responsive

---

### Task 4.3: Trend Charts
**Status**: pending
**Priority**: high
**Estimated Time**: 5 hours

**Description**: Create charts for visualizing trends over time.

**Subtasks**:
- [ ] Install charting library (Recharts/Chart.js)
- [ ] Create `TrendChart` component
- [ ] Implement line chart for sessions
- [ ] Implement bar chart for conversions
- [ ] Add date range selector
- [ ] Add granularity selector
- [ ] Implement chart tooltips
- [ ] Make charts responsive

**Files to Create/Modify**:
- `apps/vyntrize-crm/components/TrendChart.tsx`
- `apps/vyntrize-crm/components/DateRangeSelector.tsx`

**Acceptance Criteria**:
- Charts display data correctly
- Date range filtering works
- Charts are responsive
- Tooltips are informative

---

### Task 4.4: Funnel Visualization
**Status**: pending
**Priority**: medium
**Estimated Time**: 5 hours

**Description**: Build conversion funnel visualization.

**Subtasks**:
- [ ] Create funnel API endpoint
- [ ] Define default funnel steps
- [ ] Create `FunnelChart` component
- [ ] Calculate conversion rates
- [ ] Display drop-off rates
- [ ] Add funnel step customization
- [ ] Style funnel visualization
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/analytics/funnel/route.ts`
- `apps/vyntrize-crm/components/FunnelChart.tsx`

**Acceptance Criteria**:
- Funnel displays correctly
- Conversion rates are accurate
- Drop-off points are clear

---

### Task 4.5: Source Attribution Report
**Status**: pending
**Priority**: medium
**Estimated Time**: 4 hours

**Description**: Create report showing traffic sources and their performance.

**Subtasks**:
- [ ] Create sources API endpoint
- [ ] Build `SourcesTable` component
- [ ] Display source, medium, campaign
- [ ] Show sessions and conversions per source
- [ ] Calculate conversion rate per source
- [ ] Add sorting and filtering
- [ ] Implement export to CSV
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/analytics/sources/route.ts`
- `apps/vyntrize-crm/components/SourcesTable.tsx`

**Acceptance Criteria**:
- Sources are displayed correctly
- Metrics are accurate
- Export works
- Sorting/filtering works

---

### Task 4.6: Top Pages Report
**Status**: pending
**Priority**: low
**Estimated Time**: 3 hours

**Description**: Show most viewed pages and their metrics.

**Subtasks**:
- [ ] Create top pages API endpoint
- [ ] Build `TopPagesTable` component
- [ ] Display page URL and title
- [ ] Show view count
- [ ] Calculate average time on page
- [ ] Add bounce rate per page
- [ ] Implement pagination

**Files to Create/Modify**:
- `apps/vyntrize-crm/app/api/analytics/pages/route.ts`
- `apps/vyntrize-crm/components/TopPagesTable.tsx`

**Acceptance Criteria**:
- Top pages are displayed
- Metrics are accurate
- Pagination works

---

### Task 4.7: Export Functionality
**Status**: pending
**Priority**: low
**Estimated Time**: 4 hours

**Description**: Add data export capabilities (CSV, PDF).

**Subtasks**:
- [ ] Install export libraries
- [ ] Create CSV export function
- [ ] Create PDF export function
- [ ] Add export buttons to reports
- [ ] Implement date range for exports
- [ ] Add export progress indicator
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/lib/export/csv-exporter.ts`
- `apps/vyntrize-crm/lib/export/pdf-exporter.ts`
- `apps/vyntrize-crm/components/ExportButton.tsx`

**Acceptance Criteria**:
- CSV export works
- PDF export works
- Exports include correct data
- Progress is shown

---

### Task 4.8: Daily Metrics Aggregation Job
**Status**: pending
**Priority**: medium
**Estimated Time**: 4 hours

**Description**: Create background job to aggregate daily metrics.

**Subtasks**:
- [ ] Create aggregation job
- [ ] Calculate daily metrics
- [ ] Store in `analytics_daily_metrics` table
- [ ] Schedule job to run daily
- [ ] Add error handling
- [ ] Log job execution
- [ ] Write tests

**Files to Create/Modify**:
- `apps/vyntrize-crm/lib/jobs/aggregate-daily-metrics.ts`

**Acceptance Criteria**:
- Job runs daily
- Metrics are calculated correctly
- Data is stored properly
- Errors are handled

---

## Phase 5: Testing & Optimization (Week 9)

### Task 5.1: Unit Tests
**Status**: pending
**Priority**: high
**Estimated Time**: 8 hours

**Description**: Write comprehensive unit tests for all services.

**Subtasks**:
- [ ] Test analytics tracker
- [ ] Test lead scorer
- [ ] Test attribution service
- [ ] Test session manager
- [ ] Test event processor
- [ ] Achieve 80%+ code coverage

---

### Task 5.2: Integration Tests
**Status**: pending
**Priority**: high
**Estimated Time**: 6 hours

**Description**: Write integration tests for API endpoints.

**Subtasks**:
- [ ] Test analytics API
- [ ] Test CRM APIs
- [ ] Test dashboard APIs
- [ ] Test email sending

---

### Task 5.3: E2E Tests
**Status**: pending
**Priority**: medium
**Estimated Time**: 6 hours

**Description**: Write end-to-end tests for critical flows.

**Subtasks**:
- [ ] Test analytics tracking flow
- [ ] Test lead creation and scoring
- [ ] Test task management
- [ ] Test dashboard rendering

---

### Task 5.4: Performance Optimization
**Status**: pending
**Priority**: high
**Estimated Time**: 6 hours

**Description**: Optimize database queries and API performance.

**Subtasks**:
- [ ] Add database indexes
- [ ] Implement query optimization
- [ ] Add caching layer
- [ ] Optimize aggregation queries
- [ ] Load test APIs

---

### Task 5.5: Documentation
**Status**: pending
**Priority**: medium
**Estimated Time**: 4 hours

**Description**: Write documentation for new features.

**Subtasks**:
- [ ] Document analytics tracking
- [ ] Document lead scoring algorithm
- [ ] Document API endpoints
- [ ] Create user guide for CRM features
- [ ] Document deployment steps

---

## Summary

**Total Estimated Time**: ~150 hours (7-9 weeks)

**Phase Breakdown**:
- Phase 1 (Analytics): ~20 hours
- Phase 2 (Lead Intelligence): ~22 hours
- Phase 3 (CRM Enhancements): ~33 hours
- Phase 4 (Reporting): ~34 hours
- Phase 5 (Testing & Optimization): ~30 hours

**Priority Distribution**:
- High Priority: 18 tasks
- Medium Priority: 13 tasks
- Low Priority: 4 tasks

**Dependencies**:
- Phase 2 depends on Phase 1 (analytics tracking must be in place)
- Phase 4 depends on Phase 1 & 2 (needs data to report on)
- Phase 5 can run in parallel with other phases
