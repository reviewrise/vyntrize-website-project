-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('WELCOME', 'INITIAL_OUTREACH', 'FOLLOW_UP', 'PROPOSAL', 'RE_ENGAGEMENT', 'STAGE_CHANGE', 'ENGAGEMENT_RESPONSE', 'NEWSLETTER', 'GENERAL');

-- CreateEnum
CREATE TYPE "DripEnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'STOPPED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "ActionType" ADD VALUE 'DRIP_ENROLL';
ALTER TYPE "ActionType" ADD VALUE 'RULE_EXECUTION';

-- AlterEnum
ALTER TYPE "AgentType" ADD VALUE 'WORKFLOW_RULE';

-- AlterTable
ALTER TABLE "crm_leads" ADD COLUMN     "manualOverride" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "email_templates" ADD COLUMN     "type" "EmailTemplateType" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "stage_progression_rules" (
    "id" TEXT NOT NULL,
    "fromStage" "LeadStage" NOT NULL,
    "toStage" "LeadStage" NOT NULL,
    "criteria" JSONB NOT NULL,
    "autonomyLevel" "AutonomyLevel" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_progression_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drip_sequences" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConfig" JSONB NOT NULL,
    "stopConditions" JSONB NOT NULL,
    "autonomyLevel" "AutonomyLevel" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drip_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drip_steps" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "delayHours" INTEGER NOT NULL,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "branchCondition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drip_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drip_enrollments" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "DripEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastStepSentAt" TIMESTAMP(3),
    "stoppedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drip_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerEvent" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "autonomyLevel" "AutonomyLevel" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stage_progression_rules_fromStage_isActive_idx" ON "stage_progression_rules"("fromStage", "isActive");

-- CreateIndex
CREATE INDEX "drip_steps_sequenceId_stepOrder_idx" ON "drip_steps"("sequenceId", "stepOrder");

-- CreateIndex
CREATE INDEX "drip_enrollments_leadId_idx" ON "drip_enrollments"("leadId");

-- CreateIndex
CREATE INDEX "drip_enrollments_status_idx" ON "drip_enrollments"("status");

-- CreateIndex
CREATE INDEX "drip_enrollments_sequenceId_idx" ON "drip_enrollments"("sequenceId");

-- CreateIndex
CREATE INDEX "workflow_rules_triggerEvent_isActive_idx" ON "workflow_rules"("triggerEvent", "isActive");

-- CreateIndex
CREATE INDEX "email_templates_type_idx" ON "email_templates"("type");

-- AddForeignKey
ALTER TABLE "drip_steps" ADD CONSTRAINT "drip_steps_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "drip_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drip_enrollments" ADD CONSTRAINT "drip_enrollments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drip_enrollments" ADD CONSTRAINT "drip_enrollments_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "drip_sequences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
