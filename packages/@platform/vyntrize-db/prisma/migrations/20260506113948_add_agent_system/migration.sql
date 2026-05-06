-- Add AI Agent System tables and enums

-- ═══════════════════════════════════════════════════════════════════════════
-- Agent System Enums
-- ═══════════════════════════════════════════════════════════════════════════

-- AgentType enum
CREATE TYPE "AgentType" AS ENUM (
  'LEAD_SCORING',
  'TASK_AUTOMATION',
  'STAGNATION_DETECTION',
  'EMAIL_GENERATION',
  'NEXT_BEST_ACTION',
  'PREDICTIVE_ANALYTICS',
  'STAGE_PROGRESSION',
  'DRIP_CAMPAIGN',
  'REVENUE_FORECASTING',
  'OPENAI_PROVIDER'
);

-- ActionType enum
CREATE TYPE "ActionType" AS ENUM (
  'SCORE_UPDATE',
  'TASK_CREATE',
  'EMAIL_SEND',
  'STAGE_CHANGE',
  'ALERT',
  'PREDICTION_UPDATE'
);

-- ActionStatus enum
CREATE TYPE "ActionStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXECUTED',
  'FAILED'
);

-- AutonomyLevel enum
CREATE TYPE "AutonomyLevel" AS ENUM (
  'FULLY_AUTONOMOUS',
  'SUGGEST_APPROVE',
  'COPILOT'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Agent System Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- AgentAction table
CREATE TABLE "agent_actions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "leadId" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "autonomyLevel" "AutonomyLevel" NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "executedAt" TIMESTAMP(3),
    "executionError" TEXT,
    "metadata" JSONB,

    CONSTRAINT "agent_actions_pkey" PRIMARY KEY ("id")
);

-- AgentRule table
CREATE TABLE "agent_rules" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "ruleName" TEXT NOT NULL,
    "ruleConfig" JSONB NOT NULL,
    "autonomyLevel" "AutonomyLevel" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "agent_rules_pkey" PRIMARY KEY ("id")
);

-- AgentMetric table
CREATE TABLE "agent_metrics" (
    "id" SERIAL NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentType" "AgentType" NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "agent_metrics_pkey" PRIMARY KEY ("id")
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- AgentAction indexes
CREATE INDEX "agent_actions_leadId_idx" ON "agent_actions"("leadId");
CREATE INDEX "agent_actions_agentType_idx" ON "agent_actions"("agentType");
CREATE INDEX "agent_actions_status_idx" ON "agent_actions"("status");
CREATE INDEX "agent_actions_createdAt_idx" ON "agent_actions"("createdAt");

-- AgentRule indexes
CREATE UNIQUE INDEX "agent_rules_agentType_ruleName_key" ON "agent_rules"("agentType", "ruleName");
CREATE INDEX "agent_rules_agentType_idx" ON "agent_rules"("agentType");
CREATE INDEX "agent_rules_isActive_idx" ON "agent_rules"("isActive");

-- AgentMetric indexes
CREATE INDEX "agent_metrics_agentType_idx" ON "agent_metrics"("agentType");
CREATE INDEX "agent_metrics_metricName_idx" ON "agent_metrics"("metricName");
CREATE INDEX "agent_metrics_calculatedAt_idx" ON "agent_metrics"("calculatedAt");

-- ═══════════════════════════════════════════════════════════════════════════
-- Foreign Keys
-- ═══════════════════════════════════════════════════════════════════════════

-- AgentAction foreign keys
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_leadId_fkey" 
    FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_approvedBy_fkey" 
    FOREIGN KEY ("approvedBy") REFERENCES "crm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
