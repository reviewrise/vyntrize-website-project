# Analytics & CRM Extension - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Website (Public)          │         CRM App (Internal)         │
│  - Analytics Tracker       │         - Dashboard                │
│  - Event Capture           │         - Lead Management          │
│  - Session Management      │         - Reports & Analytics      │
└─────────────────┬───────────┴──────────────────┬────────────────┘
                  │                              │
                  ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  /api/track          │  /api/analytics/*  │  /api/crm/*         │
│  - Page views        │  - Dashboards      │  - Leads            │
│  - Events            │  - Reports         │  - Activities       │
│  - Sessions          │  - Funnels         │  - Tasks & Notes    │
└─────────────────┬───────────────────────────────┬───────────────┘
                  │                               │
                  ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Analytics Service   │  Lead Scoring      │  CRM Service        │
│  - Event processing  │  - Score calc      │  - CRUD operations  │
│  - Session tracking  │  - Auto-qualify    │  - Workflows        │
│  - Aggregations      │  - Enrichment      │  - Assignments      │
└─────────────────┬───────────────────────────────┬───────────────┘
                  │                               │
                  ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│              PostgreSQL (Vyntrize DB)                            │
│  - Analytics tables (partitioned by date)                        │
│  - CRM tables (leads, contacts, companies)                       │
│  - Activity & scoring tables                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

#### Website Analytics Tracker
- **Location**: `apps/vyntrize-website/lib/analytics.ts`
- **Purpose**: Client-side tracking library
- **Features**:
  - Automatic page view tracking
  - Custom event tracking
  - Session management with cookies
  - UTM parameter capture
  - Privacy-compliant (respects DNT)

#### Analytics API
- **Location**: `apps/vyntrize-website/app/api/track/route.ts`
- **Purpose**: Receive and process analytics events
- **Features**:
  - Async event processing
  - IP anonymization
  - Bot detection
  - Rate limiting

#### CRM Dashboard
- **Location**: `apps/vyntrize-crm/app/(crm)/analytics/`
- **Purpose**: Visualize analytics and CRM data
- **Features**:
  - Real-time metrics
  - Historical trends
  - Funnel visualization
  - Export capabilities

## 2. Database Schema Design

### 2.1 Analytics Tables

```sql
-- Analytics Events (partitioned by month)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    visitor_id VARCHAR(255), -- Anonymous visitor tracking
    user_id INTEGER REFERENCES crm_users(id),
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'click', 'form_submit', etc.
    event_name VARCHAR(255),
    event_data JSONB, -- Flexible event properties
    
    -- Page context
    page_url TEXT NOT NULL,
    page_title VARCHAR(500),
    referrer TEXT,
    
    -- UTM parameters
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    
    -- Device & browser
    user_agent TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- Location (anonymized)
    ip_address_hash VARCHAR(64), -- Hashed IP for privacy
    country VARCHAR(2),
    city VARCHAR(100),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_session_id (session_id),
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE analytics_events_2026_05 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- Analytics Sessions
CREATE TABLE analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    visitor_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES crm_users(id),
    
    -- Session timing
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Session metrics
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    
    -- Entry point
    landing_page TEXT,
    entry_referrer TEXT,
    
    -- UTM parameters (from entry)
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    
    -- Device info
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- Location
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Conversion tracking
    converted BOOLEAN DEFAULT FALSE,
    conversion_type VARCHAR(100),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_started_at (started_at),
    INDEX idx_utm_campaign (utm_campaign)
);

-- Daily aggregated metrics (for fast dashboard queries)
CREATE TABLE analytics_daily_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    
    -- Traffic metrics
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    
    -- Engagement metrics
    avg_session_duration_seconds INTEGER,
    avg_pages_per_session DECIMAL(10,2),
    bounce_rate DECIMAL(5,2),
    
    -- Conversion metrics
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    
    -- Top sources (JSONB for flexibility)
    top_sources JSONB,
    top_pages JSONB,
    top_campaigns JSONB,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(metric_date)
);
```

### 2.2 Lead Intelligence Tables

```sql
-- Lead Activities (track all lead interactions)
CREATE TABLE lead_activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(50) NOT NULL, -- 'page_view', 'email_open', 'form_submit', 'download', etc.
    activity_name VARCHAR(255),
    activity_data JSONB, -- Flexible activity details
    
    -- Context
    page_url TEXT,
    session_id VARCHAR(255),
    
    -- Metadata
    ip_address_hash VARCHAR(64),
    user_agent TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_lead_id (lead_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- Lead Scores (track scoring history)
CREATE TABLE lead_scores (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    score INTEGER NOT NULL DEFAULT 0, -- 0-100 scale
    previous_score INTEGER,
    
    -- Scoring factors (what contributed to the score)
    factors JSONB, -- { "page_views": 10, "form_submits": 30, "email_opens": 5, ... }
    
    -- Qualification
    qualification_status VARCHAR(50), -- 'cold', 'warm', 'hot', 'mql', 'sql'
    
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_lead_id (lead_id),
    INDEX idx_score (score),
    INDEX idx_calculated_at (calculated_at)
);

-- Lead Source Attribution
CREATE TABLE lead_sources (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- First touch attribution
    first_touch_source VARCHAR(255),
    first_touch_medium VARCHAR(255),
    first_touch_campaign VARCHAR(255),
    first_touch_content VARCHAR(255),
    first_touch_term VARCHAR(255),
    first_touch_at TIMESTAMP,
    
    -- Last touch attribution
    last_touch_source VARCHAR(255),
    last_touch_medium VARCHAR(255),
    last_touch_campaign VARCHAR(255),
    last_touch_content VARCHAR(255),
    last_touch_term VARCHAR(255),
    last_touch_at TIMESTAMP,
    
    -- Multi-touch (all touchpoints)
    touchpoints JSONB, -- Array of all attribution points
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(lead_id)
);
```

### 2.3 CRM Enhancement Tables

```sql
-- Lead Notes
CREATE TABLE lead_notes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES crm_users(id),
    
    note TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_lead_id (lead_id),
    INDEX idx_created_at (created_at)
);

-- Lead Tasks
CREATE TABLE lead_tasks (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES crm_users(id),
    created_by INTEGER NOT NULL REFERENCES crm_users(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_lead_id (lead_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- Email Templates
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES crm_users(id),
    
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    
    -- Template variables (e.g., {{firstName}}, {{companyName}})
    variables JSONB,
    
    is_shared BOOLEAN DEFAULT FALSE, -- Available to all users
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_user_id (user_id)
);

-- Email Tracking
CREATE TABLE email_tracking (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sent_by INTEGER NOT NULL REFERENCES crm_users(id),
    template_id INTEGER REFERENCES email_templates(id),
    
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    INDEX idx_lead_id (lead_id),
    INDEX idx_sent_by (sent_by),
    INDEX idx_sent_at (sent_at)
);

-- Pipeline Stages
CREATE TABLE pipeline_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    stage_order INTEGER NOT NULL, -- Display order
    probability INTEGER DEFAULT 0, -- Win probability (0-100)
    
    -- Automation rules
    auto_assign_to INTEGER REFERENCES crm_users(id),
    auto_create_task BOOLEAN DEFAULT FALSE,
    task_template JSONB,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(stage_order)
);

-- Custom Fields (flexible field definitions)
CREATE TABLE custom_fields (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'lead', 'contact', 'company'
    
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'select', 'multi_select', 'boolean'
    
    options JSONB, -- For select/multi_select types
    default_value TEXT,
    
    is_required BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT TRUE,
    
    display_order INTEGER,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(entity_type, field_name)
);

-- Custom Field Values
CREATE TABLE custom_field_values (
    id SERIAL PRIMARY KEY,
    custom_field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    
    value TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_custom_field_id (custom_field_id)
);
```

### 2.4 Schema Updates to Existing Tables

```sql
-- Update leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_status VARCHAR(50) DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS medium VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_status ON leads(qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity_at ON leads(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_leads_visitor_id ON leads(visitor_id);

-- Update contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;

-- Update companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS annual_revenue BIGINT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS enrichment_data JSONB;
```

## 3. API Design

### 3.1 Analytics API Endpoints

#### POST /api/track
Track analytics events from the website.

**Request Body:**
```typescript
{
  eventType: 'page_view' | 'click' | 'form_submit' | 'custom',
  eventName?: string,
  eventData?: Record<string, any>,
  pageUrl: string,
  pageTitle?: string,
  referrer?: string,
  sessionId: string,
  visitorId?: string,
  utmParams?: {
    source?: string,
    medium?: string,
    campaign?: string,
    content?: string,
    term?: string
  }
}
```

**Response:**
```typescript
{
  success: boolean,
  sessionId: string
}
```

#### GET /api/analytics/dashboard
Get dashboard metrics.

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string
- `granularity`: 'hour' | 'day' | 'week' | 'month'

**Response:**
```typescript
{
  metrics: {
    totalSessions: number,
    totalPageViews: number,
    uniqueVisitors: number,
    avgSessionDuration: number,
    bounceRate: number,
    conversionRate: number
  },
  trends: Array<{
    date: string,
    sessions: number,
    pageViews: number,
    conversions: number
  }>,
  topSources: Array<{
    source: string,
    sessions: number,
    conversions: number
  }>,
  topPages: Array<{
    url: string,
    views: number,
    avgDuration: number
  }>
}
```

#### GET /api/analytics/funnel
Get conversion funnel data.

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string
- `steps`: JSON array of funnel steps

**Response:**
```typescript
{
  funnel: Array<{
    step: string,
    count: number,
    conversionRate: number,
    dropoffRate: number
  }>
}
```

### 3.2 Lead Intelligence API Endpoints

#### GET /api/crm/leads/:id/activities
Get lead activity timeline.

**Response:**
```typescript
{
  activities: Array<{
    id: number,
    type: string,
    name: string,
    data: Record<string, any>,
    createdAt: string
  }>,
  pagination: {
    page: number,
    pageSize: number,
    total: number
  }
}
```

#### POST /api/crm/leads/:id/score
Calculate or recalculate lead score.

**Response:**
```typescript
{
  leadId: number,
  score: number,
  previousScore: number,
  factors: Record<string, number>,
  qualificationStatus: string
}
```

#### GET /api/crm/leads/:id/attribution
Get lead source attribution.

**Response:**
```typescript
{
  firstTouch: {
    source: string,
    medium: string,
    campaign: string,
    timestamp: string
  },
  lastTouch: {
    source: string,
    medium: string,
    campaign: string,
    timestamp: string
  },
  touchpoints: Array<{
    source: string,
    medium: string,
    campaign: string,
    timestamp: string
  }>
}
```

### 3.3 CRM Enhancement API Endpoints

#### POST /api/crm/leads/:id/notes
Create a note for a lead.

**Request Body:**
```typescript
{
  note: string,
  isPinned?: boolean
}
```

#### GET /api/crm/leads/:id/notes
Get all notes for a lead.

#### POST /api/crm/leads/:id/tasks
Create a task for a lead.

**Request Body:**
```typescript
{
  title: string,
  description?: string,
  assignedTo?: number,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  dueDate?: string
}
```

#### GET /api/crm/tasks
Get tasks (with filters).

**Query Parameters:**
- `assignedTo`: User ID
- `status`: Task status
- `priority`: Task priority
- `dueDate`: Filter by due date

#### POST /api/crm/email-templates
Create email template.

#### POST /api/crm/leads/:id/send-email
Send email to lead.

**Request Body:**
```typescript
{
  templateId?: number,
  subject: string,
  body: string
}
```

## 4. Frontend Components

### 4.1 Analytics Tracker (Website)

**File**: `apps/vyntrize-website/lib/analytics.ts`

```typescript
class AnalyticsTracker {
  private sessionId: string;
  private visitorId: string;
  private queue: Event[] = [];
  
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.visitorId = this.getOrCreateVisitorId();
    this.initializeTracking();
  }
  
  // Track page view
  trackPageView(url: string, title: string): void;
  
  // Track custom event
  trackEvent(eventName: string, eventData?: Record<string, any>): void;
  
  // Track form submission
  trackFormSubmit(formId: string, formData: Record<string, any>): void;
  
  // Batch send events
  private flush(): void;
}
```

### 4.2 Analytics Dashboard (CRM)

**Location**: `apps/vyntrize-crm/app/(crm)/analytics/`

**Components**:
- `DashboardMetrics.tsx` - Key metrics cards
- `TrendChart.tsx` - Line/bar charts for trends
- `FunnelVisualization.tsx` - Conversion funnel
- `SourcesTable.tsx` - Traffic sources breakdown
- `TopPagesTable.tsx` - Most viewed pages

### 4.3 Lead Activity Timeline

**Location**: `apps/vyntrize-crm/components/LeadActivityTimeline.tsx`

Shows chronological list of all lead interactions:
- Page views
- Form submissions
- Email opens/clicks
- Downloads
- Custom events

### 4.4 Lead Scoring Widget

**Location**: `apps/vyntrize-crm/components/LeadScoreWidget.tsx`

Displays:
- Current score (0-100)
- Score trend (up/down)
- Qualification status badge
- Score breakdown (factors)

### 4.5 CRM Task Manager

**Location**: `apps/vyntrize-crm/app/(crm)/tasks/`

Features:
- Task list with filters
- Create/edit task modal
- Due date calendar view
- Task assignment

## 5. Business Logic

### 5.1 Lead Scoring Algorithm

**File**: `apps/vyntrize-crm/lib/scoring/lead-scorer.ts`

```typescript
interface ScoringFactors {
  pageViews: number;        // 1 point per view (max 20)
  formSubmits: number;      // 30 points per submit
  emailOpens: number;       // 5 points per open (max 15)
  emailClicks: number;      // 10 points per click (max 20)
  downloads: number;        // 15 points per download
  recency: number;          // 10 points if active in last 7 days
  companySize: number;      // 0-20 based on employee count
  jobTitle: number;         // 0-15 based on seniority
}

function calculateLeadScore(lead: Lead, activities: Activity[]): number {
  // Calculate score based on factors
  // Return 0-100 score
}

function qualifyLead(score: number): QualificationStatus {
  if (score >= 80) return 'sql'; // Sales Qualified Lead
  if (score >= 60) return 'mql'; // Marketing Qualified Lead
  if (score >= 40) return 'warm';
  if (score >= 20) return 'cold';
  return 'new';
}
```

### 5.2 Session Management

**File**: `apps/vyntrize-website/lib/analytics/session-manager.ts`

```typescript
class SessionManager {
  private static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  // Create new session
  createSession(): string;
  
  // Get or create session
  getOrCreateSession(): string;
  
  // Check if session is active
  isSessionActive(sessionId: string): boolean;
  
  // Update session activity
  updateSessionActivity(sessionId: string): void;
  
  // End session
  endSession(sessionId: string): void;
}
```

### 5.3 Attribution Logic

**File**: `apps/vyntrize-crm/lib/attribution/attribution-service.ts`

```typescript
interface TouchPoint {
  source: string;
  medium: string;
  campaign: string;
  timestamp: Date;
}

class AttributionService {
  // Record first touch
  recordFirstTouch(leadId: number, utmParams: UTMParams): void;
  
  // Update last touch
  updateLastTouch(leadId: number, utmParams: UTMParams): void;
  
  // Add touchpoint
  addTouchpoint(leadId: number, utmParams: UTMParams): void;
  
  // Get attribution model (first, last, linear, time-decay)
  getAttribution(leadId: number, model: string): Attribution;
}
```

## 6. Data Processing & Aggregation

### 6.1 Daily Metrics Aggregation

**File**: `apps/vyntrize-crm/lib/jobs/aggregate-daily-metrics.ts`

Cron job that runs daily to aggregate analytics data:

```typescript
async function aggregateDailyMetrics(date: Date) {
  // Calculate metrics for the day
  const metrics = {
    totalSessions: await countSessions(date),
    totalPageViews: await countPageViews(date),
    uniqueVisitors: await countUniqueVisitors(date),
    avgSessionDuration: await calculateAvgDuration(date),
    bounceRate: await calculateBounceRate(date),
    conversionRate: await calculateConversionRate(date),
    topSources: await getTopSources(date),
    topPages: await getTopPages(date),
    topCampaigns: await getTopCampaigns(date)
  };
  
  // Insert into analytics_daily_metrics
  await insertDailyMetrics(date, metrics);
}
```

### 6.2 Lead Score Recalculation

**File**: `apps/vyntrize-crm/lib/jobs/recalculate-lead-scores.ts`

Cron job that runs hourly to update lead scores:

```typescript
async function recalculateLeadScores() {
  // Get leads with recent activity
  const activeLeads = await getLeadsWithRecentActivity();
  
  for (const lead of activeLeads) {
    const activities = await getLeadActivities(lead.id);
    const newScore = calculateLeadScore(lead, activities);
    const qualification = qualifyLead(newScore);
    
    // Update lead score
    await updateLeadScore(lead.id, newScore, qualification);
    
    // Trigger automation if qualification changed
    if (lead.qualificationStatus !== qualification) {
      await triggerQualificationWorkflow(lead.id, qualification);
    }
  }
}
```

## 7. Privacy & Compliance

### 7.1 Cookie Consent

**File**: `apps/vyntrize-website/components/CookieConsent.tsx`

- Display cookie consent banner
- Store consent preferences
- Respect DNT (Do Not Track) header
- Allow opt-out of tracking

### 7.2 Data Anonymization

- Hash IP addresses before storage
- Don't store PII in analytics events
- Implement data retention policies
- Provide data export/deletion APIs

### 7.3 GDPR Compliance

**Endpoints**:
- `GET /api/privacy/export` - Export user data
- `DELETE /api/privacy/delete` - Delete user data
- `GET /api/privacy/consent` - Get consent status
- `POST /api/privacy/consent` - Update consent

## 8. Performance Optimization

### 8.1 Database Optimization

- **Partitioning**: Partition `analytics_events` by month
- **Indexing**: Create indexes on frequently queried columns
- **Archival**: Move old data to cold storage after 2 years
- **Materialized Views**: Pre-calculate common aggregations

### 8.2 Caching Strategy

- Cache dashboard metrics (5 minutes TTL)
- Cache lead scores (1 hour TTL)
- Cache daily aggregations (24 hours TTL)
- Use Redis for session management

### 8.3 Async Processing

- Queue analytics events for batch processing
- Use background jobs for score calculation
- Implement retry logic for failed events

## 9. Testing Strategy

### 9.1 Unit Tests
- Test scoring algorithm
- Test attribution logic
- Test session management
- Test data aggregation

### 9.2 Integration Tests
- Test API endpoints
- Test database queries
- Test event processing pipeline

### 9.3 E2E Tests
- Test analytics tracking flow
- Test dashboard rendering
- Test lead management workflows

## 10. Deployment Considerations

### 10.1 Database Migration

```bash
# Run migrations
pnpm db:migrate

# Seed initial data (pipeline stages, custom fields)
pnpm db:seed:analytics
```

### 10.2 Environment Variables

```env
# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL=5000

# Lead Scoring
LEAD_SCORING_ENABLED=true
LEAD_SCORING_CRON="0 * * * *" # Every hour

# Privacy
COOKIE_CONSENT_REQUIRED=true
DATA_RETENTION_DAYS=730
```

### 10.3 Monitoring

- Track API response times
- Monitor event processing queue
- Alert on failed score calculations
- Dashboard for system health

## 11. Future Enhancements

- AI-powered lead scoring
- Predictive analytics
- A/B testing framework
- Advanced segmentation
- Integration with third-party tools (Segment, Mixpanel)
- Real-time notifications
- Mobile app for CRM
