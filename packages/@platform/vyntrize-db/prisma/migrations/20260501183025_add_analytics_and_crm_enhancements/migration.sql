-- Add analytics and CRM enhancement tables

-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Analytics Events
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT,
    "eventData" JSONB,
    "pageUrl" TEXT NOT NULL,
    "pageTitle" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ipAddressHash" TEXT,
    "country" TEXT,
    "city" TEXT,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");
CREATE INDEX "analytics_events_visitorId_idx" ON "analytics_events"("visitorId");
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- Analytics Sessions
CREATE TABLE "analytics_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "eventsCount" INTEGER NOT NULL DEFAULT 0,
    "landingPage" TEXT,
    "entryReferrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "city" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "conversionType" TEXT,

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_sessions_sessionId_key" ON "analytics_sessions"("sessionId");
CREATE INDEX "analytics_sessions_visitorId_idx" ON "analytics_sessions"("visitorId");
CREATE INDEX "analytics_sessions_startedAt_idx" ON "analytics_sessions"("startedAt");
CREATE INDEX "analytics_sessions_utmCampaign_idx" ON "analytics_sessions"("utmCampaign");

-- Analytics Daily Metrics
CREATE TABLE "analytics_daily_metrics" (
    "id" SERIAL NOT NULL,
    "metricDate" DATE NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalPageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgSessionDurationSeconds" INTEGER,
    "avgPagesPerSession" DECIMAL(10,2),
    "bounceRate" DECIMAL(5,2),
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DECIMAL(5,2),
    "topSources" JSONB,
    "topPages" JSONB,
    "topCampaigns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_daily_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_daily_metrics_metricDate_key" ON "analytics_daily_metrics"("metricDate");

-- ═══════════════════════════════════════════════════════════════════════════
-- Lead Intelligence Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Lead Activities
CREATE TABLE "lead_activities" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityName" TEXT,
    "activityData" JSONB,
    "pageUrl" TEXT,
    "sessionId" TEXT,
    "ipAddressHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_activities_leadId_idx" ON "lead_activities"("leadId");
CREATE INDEX "lead_activities_activityType_idx" ON "lead_activities"("activityType");
CREATE INDEX "lead_activities_createdAt_idx" ON "lead_activities"("createdAt");

-- Lead Scores
CREATE TABLE "lead_scores" (
    "id" SERIAL NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "previousScore" INTEGER,
    "factors" JSONB,
    "qualificationStatus" TEXT,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_scores_leadId_idx" ON "lead_scores"("leadId");
CREATE INDEX "lead_scores_score_idx" ON "lead_scores"("score");
CREATE INDEX "lead_scores_calculatedAt_idx" ON "lead_scores"("calculatedAt");

-- Lead Sources
CREATE TABLE "lead_sources" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT NOT NULL,
    "firstTouchSource" TEXT,
    "firstTouchMedium" TEXT,
    "firstTouchCampaign" TEXT,
    "firstTouchContent" TEXT,
    "firstTouchTerm" TEXT,
    "firstTouchAt" TIMESTAMP(3),
    "lastTouchSource" TEXT,
    "lastTouchMedium" TEXT,
    "lastTouchCampaign" TEXT,
    "lastTouchContent" TEXT,
    "lastTouchTerm" TEXT,
    "lastTouchAt" TIMESTAMP(3),
    "touchpoints" JSONB,

    CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lead_sources_leadId_key" ON "lead_sources"("leadId");

-- ═══════════════════════════════════════════════════════════════════════════
-- CRM Enhancement Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Lead Notes
CREATE TABLE "lead_notes" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_notes_leadId_idx" ON "lead_notes"("leadId");
CREATE INDEX "lead_notes_createdAt_idx" ON "lead_notes"("createdAt");

-- Task Status and Priority Enums
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Lead Tasks
CREATE TABLE "lead_tasks" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "lead_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_tasks_leadId_idx" ON "lead_tasks"("leadId");
CREATE INDEX "lead_tasks_assignedToId_idx" ON "lead_tasks"("assignedToId");
CREATE INDEX "lead_tasks_status_idx" ON "lead_tasks"("status");
CREATE INDEX "lead_tasks_dueDate_idx" ON "lead_tasks"("dueDate");

-- Email Templates
CREATE TABLE "email_templates" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "isShared" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_templates_userId_idx" ON "email_templates"("userId");

-- Email Tracking
CREATE TABLE "email_tracking" (
    "id" SERIAL NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "templateId" INTEGER,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_tracking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_tracking_leadId_idx" ON "email_tracking"("leadId");
CREATE INDEX "email_tracking_sentById_idx" ON "email_tracking"("sentById");
CREATE INDEX "email_tracking_sentAt_idx" ON "email_tracking"("sentAt");

-- Pipeline Stages
CREATE TABLE "pipeline_stages" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stageOrder" INTEGER NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "autoAssignToId" TEXT,
    "autoCreateTask" BOOLEAN NOT NULL DEFAULT false,
    "taskTemplate" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pipeline_stages_stageOrder_key" ON "pipeline_stages"("stageOrder");

-- Custom Fields
CREATE TABLE "custom_fields" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "options" JSONB,
    "defaultValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isSearchable" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_fields_entityType_fieldName_key" ON "custom_fields"("entityType", "fieldName");

-- Custom Field Values
CREATE TABLE "custom_field_values" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customFieldId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "custom_field_values_entityType_entityId_idx" ON "custom_field_values"("entityType", "entityId");
CREATE INDEX "custom_field_values_customFieldId_idx" ON "custom_field_values"("customFieldId");

-- ═══════════════════════════════════════════════════════════════════════════
-- Update Existing Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Update crm_contacts table
ALTER TABLE "crm_contacts" ADD COLUMN "linkedinUrl" TEXT;
ALTER TABLE "crm_contacts" ADD COLUMN "twitterHandle" TEXT;
ALTER TABLE "crm_contacts" ADD COLUMN "lastContactedAt" TIMESTAMP(3);

-- Update crm_companies table
ALTER TABLE "crm_companies" ADD COLUMN "employeeCount" INTEGER;
ALTER TABLE "crm_companies" ADD COLUMN "annualRevenue" BIGINT;
ALTER TABLE "crm_companies" ADD COLUMN "enrichmentData" JSONB;

-- Update crm_leads table
ALTER TABLE "crm_leads" ADD COLUMN "score" INTEGER DEFAULT 0;
ALTER TABLE "crm_leads" ADD COLUMN "qualificationStatus" TEXT DEFAULT 'new';
ALTER TABLE "crm_leads" ADD COLUMN "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "crm_leads" ADD COLUMN "visitorId" TEXT;
ALTER TABLE "crm_leads" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "crm_leads" ADD COLUMN "source" TEXT;
ALTER TABLE "crm_leads" ADD COLUMN "medium" TEXT;
ALTER TABLE "crm_leads" ADD COLUMN "campaign" TEXT;
ALTER TABLE "crm_leads" ADD COLUMN "utmContent" TEXT;
ALTER TABLE "crm_leads" ADD COLUMN "utmTerm" TEXT;

CREATE INDEX "crm_leads_score_idx" ON "crm_leads"("score");
CREATE INDEX "crm_leads_qualificationStatus_idx" ON "crm_leads"("qualificationStatus");
CREATE INDEX "crm_leads_lastActivityAt_idx" ON "crm_leads"("lastActivityAt");
CREATE INDEX "crm_leads_visitorId_idx" ON "crm_leads"("visitorId");

-- ═══════════════════════════════════════════════════════════════════════════
-- Foreign Key Constraints
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_sources" ADD CONSTRAINT "lead_sources_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "crm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "crm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "crm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_autoAssignToId_fkey" FOREIGN KEY ("autoAssignToId") REFERENCES "crm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
