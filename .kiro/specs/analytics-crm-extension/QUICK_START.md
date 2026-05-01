# Analytics & CRM Extension - Quick Start Guide

## 🚀 Quick Reference for New Features

This guide provides a quick overview of all new features and how to access them.

---

## 📍 Navigation Map

### CRM Section
- **Dashboard** → `/dashboard` - Overview of CRM activities
- **Pipeline** → `/pipeline` - Kanban board for leads
- **Contacts** → `/contacts` - Contact management
- **Companies** → `/companies` - Company management
- **Tasks** → `/tasks` - ✨ NEW: Task management system
- **Email Templates** → `/email-templates` - ✨ NEW: Template management
- **Analytics** → `/analytics` - ✨ NEW: Analytics dashboard

### Settings Section
- **Pipeline Stages** → `/settings/pipeline` - ✨ NEW: Configure pipeline

### Website Section
- **Analytics** → `/website/analytics` - Website analytics (legacy)
- **Projects** → `/website/projects` - Project management
- **Team** → `/website/team` - Team management
- **Settings** → `/website/settings` - Website settings

### Admin Section (Admin Only)
- **Import** → `/import` - Data import
- **Users** → `/admin/users` - User management

---

## 🎯 New Features Overview

### 1. Analytics Dashboard (`/analytics`)

**What it does:**
- Displays key website metrics
- Shows traffic trends over time
- Compares current vs previous period
- Visualizes data with interactive charts

**Key Metrics:**
- Total Sessions
- Page Views
- Unique Visitors
- Conversion Rate
- Average Session Duration
- Bounce Rate

**Features:**
- Date range selector (presets + custom)
- Granularity selector (hourly, daily, weekly, monthly)
- Trend indicators (up/down arrows)
- Top sources and pages tables
- Link to detailed reports

**How to use:**
1. Navigate to Analytics from sidebar
2. Select date range
3. Choose granularity
4. Review metrics and charts
5. Click "View Detailed Reports" for more

---

### 2. Analytics Reports (`/analytics/reports`)

**What it does:**
- Provides detailed reports with export capability
- Three report types in tabbed interface

**Report Types:**

#### Conversion Funnel
- Visual funnel showing visitor journey
- Drop-off rates between steps
- Overall conversion rate
- Default steps:
  1. Website Visit
  2. Viewed Services
  3. Viewed Contact
  4. Form Submission

#### Traffic Sources
- Source, medium, campaign breakdown
- Sessions and conversions per source
- Conversion rate calculation
- Sortable and filterable table
- CSV export

#### Top Pages
- Most viewed pages
- View counts and sessions
- Paginated table
- Search/filter functionality
- CSV export

**How to use:**
1. Navigate to Analytics → Reports
2. Select date range
3. Switch between tabs
4. Use filters and sorting
5. Export data as needed

---

### 3. Lead Intelligence (Lead Detail Page)

**What it shows:**
- Lead score and qualification status
- Complete activity timeline
- Visitor behavior before contact
- Attribution data (traffic source)
- Notes and interactions

**Components:**

#### Lead Score Widget (Top Right)
- Current score (0-100)
- Qualification status badge:
  - 🔵 Cold (0-25)
  - 🟡 Warm (26-50)
  - 🟠 Hot (51-75)
  - 🔴 Qualified (76-100)
- Score trend indicator
- Score breakdown on click

#### Activity Timeline (Main Content)
- All visitor interactions
- Page views, form submissions, events
- Chronological order
- Pagination (10 per page)
- Filter by activity type

#### Notes Section (Right Sidebar)
- Create, edit, delete notes
- Pin important notes
- User attribution
- Timestamps

**How to use:**
1. Navigate to Pipeline or Contacts
2. Click on any lead
3. View score widget in top-right
4. Scroll to see activity timeline
5. Add notes in right sidebar

---

### 4. Task Management (`/tasks`)

**What it does:**
- Manage tasks for leads and contacts
- Assign to team members
- Track progress and due dates

**Features:**
- Create new tasks
- Assign to users
- Set priority (Low, Medium, High)
- Set due dates
- Update status (Pending, In Progress, Completed, Cancelled)
- Filter by status, priority, assignee
- Link to leads/contacts

**How to use:**
1. Navigate to Tasks from sidebar
2. Click "New Task" button
3. Fill in task details
4. Assign to team member
5. Set priority and due date
6. Save task
7. Update status as work progresses

---

### 5. Email Templates (`/email-templates`)

**What it does:**
- Create reusable email templates
- Use variables for personalization
- Share templates with team

**Features:**
- Create, edit, delete templates
- Variable substitution:
  - `{{firstName}}` - Contact first name
  - `{{lastName}}` - Contact last name
  - `{{company}}` - Company name
  - `{{email}}` - Contact email
- Template preview
- Shared templates
- Category organization

**How to use:**
1. Navigate to Email Templates
2. Click "New Template"
3. Enter template name and subject
4. Write email body with variables
5. Preview template
6. Save as shared template
7. Use in email communications

---

### 6. Pipeline Configuration (`/settings/pipeline`)

**What it does:**
- Customize pipeline stages
- Set stage probabilities
- Configure automation rules

**Features:**
- Add, edit, delete stages
- Reorder stages (drag & drop)
- Set win probability per stage
- Configure automation rules
- Stage-specific settings

**How to use:**
1. Navigate to Settings → Pipeline Stages
2. Click "Add Stage" to create new
3. Edit existing stages
4. Drag to reorder
5. Set probabilities
6. Save changes

---

## 🔑 Key Concepts

### Lead Scoring

**How it works:**
- Automatic scoring based on behavior and demographics
- Scores range from 0-100
- Updated in real-time as leads interact
- Background job recalculates hourly

**Scoring Factors:**

**Behavioral (60% weight):**
- Page views (5 points each, max 50)
- Time on site (1 point per minute, max 30)
- Form submissions (20 points each)
- Email opens (10 points each)
- Link clicks (5 points each)
- Downloads (15 points each)

**Demographic (40% weight):**
- Company size (0-20 points)
- Industry match (0-15 points)
- Job role/title (0-15 points)

**Qualification Status:**
- **Cold (0-25)**: Low engagement, needs nurturing
- **Warm (26-50)**: Some interest, continue engagement
- **Hot (51-75)**: High interest, ready for outreach
- **Qualified (76-100)**: Very high interest, priority follow-up

---

### Attribution Tracking

**What it tracks:**
- **First Touch**: Initial traffic source (how they found you)
- **Last Touch**: Most recent traffic source (what brought them back)
- **All Touchpoints**: Complete journey stored in JSONB

**UTM Parameters Captured:**
- `utm_source` - Traffic source (google, facebook, email)
- `utm_medium` - Marketing medium (cpc, social, email)
- `utm_campaign` - Campaign name
- `utm_term` - Keyword (for paid search)
- `utm_content` - Ad content variant

**How to use:**
1. Add UTM parameters to marketing links
2. Track which campaigns drive conversions
3. View attribution on lead detail page
4. Analyze in traffic sources report

---

### Analytics Events

**Event Types Tracked:**
- `page_view` - Page visits
- `form_submit` - Form submissions
- `button_click` - CTA clicks
- `download` - File downloads
- `video_play` - Video interactions
- Custom events via API

**Event Data Captured:**
- Visitor ID (cookie-based)
- Session ID
- Page URL and title
- Referrer
- Device type (desktop, mobile, tablet)
- Browser and OS
- UTM parameters
- Custom event data

---

## 📊 Data Flow

### Website → CRM Flow

1. **Visitor arrives** on website
   - Analytics tracker initializes
   - Visitor ID created (cookie)
   - Session started

2. **Visitor browses** pages
   - Page views tracked
   - Events sent to `/api/track`
   - Session updated

3. **Visitor submits** form
   - Form submission event
   - Lead created in CRM
   - Visitor ID linked to lead

4. **Lead score** calculated
   - Behavioral factors from analytics
   - Demographic factors from form
   - Score and status assigned

5. **Sales team** sees lead
   - Complete activity timeline
   - Score and qualification status
   - Attribution data
   - Ready for follow-up

---

## 🛠️ Background Jobs

### Score Recalculation Job

**What it does:**
- Recalculates lead scores periodically
- Updates qualification status
- Logs score changes

**Schedule:** Every hour

**Command:**
```bash
cd apps/vyntrize-crm
tsx lib/jobs/recalculate-scores.ts
```

**Cron:**
```bash
0 * * * * cd /path/to/project/apps/vyntrize-crm && tsx lib/jobs/recalculate-scores.ts >> /var/log/vyntrize/score-recalc.log 2>&1
```

---

### Daily Metrics Aggregation Job

**What it does:**
- Aggregates analytics data daily
- Calculates metrics for fast queries
- Stores in `analytics_daily_metrics` table

**Schedule:** Daily at 1 AM

**Commands:**
```bash
# Aggregate yesterday
tsx lib/jobs/aggregate-daily-metrics.ts yesterday

# Backfill last 30 days
tsx lib/jobs/aggregate-daily-metrics.ts backfill 30

# Specific date
tsx lib/jobs/aggregate-daily-metrics.ts date 2026-04-30
```

**Cron:**
```bash
0 1 * * * cd /path/to/project/apps/vyntrize-crm && tsx lib/jobs/aggregate-daily-metrics.ts yesterday >> /var/log/vyntrize/daily-metrics.log 2>&1
```

---

## 🎨 UI Components

### Reusable Components

**MetricCard** - Display metrics with trends
```tsx
<MetricCard
  title="Total Sessions"
  value={1234}
  change={15.5}
  changeLabel="vs previous period"
  icon={<ChartBarIcon />}
  format="number"
/>
```

**TrendChart** - Line/bar charts
```tsx
<TrendChart
  data={trends}
  type="line"
  metrics={['sessions', 'pageViews', 'conversions']}
/>
```

**DateRangeSelector** - Date range picker
```tsx
<DateRangeSelector
  value={dateRange}
  onChange={setDateRange}
/>
```

**ExportButton** - CSV export
```tsx
<ExportButton
  onExport={handleExport}
  label="Export CSV"
/>
```

---

## 🔍 Troubleshooting

### Analytics not tracking

**Check:**
1. Cookie consent accepted
2. Tracker initialized (check console)
3. API endpoint accessible
4. No browser errors

**Test:**
```bash
curl -X POST https://vyntrize.com/api/track \
  -H "Content-Type: application/json" \
  -d '{"eventType":"page_view","pageUrl":"/test"}'
```

---

### Dashboard shows no data

**Check:**
1. Analytics events exist in database
2. Date range is correct
3. Daily aggregation job ran

**Fix:**
```bash
# Run backfill
cd apps/vyntrize-crm
tsx lib/jobs/aggregate-daily-metrics.ts backfill 7
```

---

### Lead scores not updating

**Check:**
1. Background job is running
2. Cron job configured
3. Check logs for errors

**Fix:**
```bash
# Run manually
cd apps/vyntrize-crm
tsx lib/jobs/recalculate-scores.ts
```

---

## 📚 Additional Resources

### Documentation
- **Project Complete**: `PROJECT_COMPLETE.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Phase 4 Summary**: `PHASE4_SUMMARY.md`
- **Design Document**: `design.md`
- **Requirements**: `requirements.md`
- **Tasks**: `tasks.md`

### API Endpoints
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/funnel` - Conversion funnel
- `GET /api/analytics/sources` - Traffic sources
- `GET /api/analytics/pages` - Top pages
- `GET /api/crm/leads/[id]/activities` - Lead activities
- `GET /api/crm/leads/[id]/attribution` - Lead attribution
- `POST /api/crm/leads/[id]/notes` - Create note
- `POST /api/crm/tasks` - Create task
- `POST /api/crm/email-templates` - Create template
- `POST /api/crm/pipeline-stages` - Create stage

---

## 🎯 Quick Tips

### For Sales Team
- Check lead scores daily to prioritize follow-ups
- Review activity timeline before calling leads
- Use notes to track all interactions
- Create tasks for follow-ups
- Use email templates for consistency

### For Marketing Team
- Review analytics dashboard weekly
- Track campaign performance with UTM parameters
- Analyze conversion funnel for optimization
- Export reports for presentations
- Monitor traffic sources and adjust spend

### For Administrators
- Configure pipeline stages to match process
- Set up background jobs on deployment
- Monitor job logs for errors
- Archive old analytics data periodically
- Train team on new features

---

## ✅ Success Checklist

### After Deployment
- [ ] Analytics tracking works on website
- [ ] Dashboard displays data
- [ ] Lead scores are calculated
- [ ] Activity timeline shows events
- [ ] Notes can be created
- [ ] Tasks can be assigned
- [ ] Email templates save correctly
- [ ] Pipeline stages are configurable
- [ ] Background jobs are running
- [ ] Team is trained

---

**Need Help?**
- Check documentation in `.kiro/specs/analytics-crm-extension/`
- Review troubleshooting section above
- Contact development team

---

**Last Updated:** May 1, 2026  
**Version:** 1.0.0
