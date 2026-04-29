-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST', 'SPAM');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CrmRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "contact_submissions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "intent" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "CrmRole" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contacts" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "jobTitle" TEXT,
    "companyId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "contactId" TEXT NOT NULL,
    "companyId" TEXT,
    "dealValue" DECIMAL(12,2),
    "closeDate" TIMESTAMP(3),
    "assigneeId" TEXT,
    "closingNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "body" TEXT NOT NULL,
    "originalBody" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "direction" "CallDirection",
    "leadId" TEXT,
    "contactId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT,
    "prevValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_import_records" (
    "id" TEXT NOT NULL,
    "contactSubmissionId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_import_records_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "contact_submissions_email_idx" ON "contact_submissions"("email");
CREATE INDEX "contact_submissions_status_idx" ON "contact_submissions"("status");
CREATE INDEX "contact_submissions_createdAt_idx" ON "contact_submissions"("createdAt");
CREATE UNIQUE INDEX "crm_users_email_key" ON "crm_users"("email");
CREATE UNIQUE INDEX "crm_contacts_email_key" ON "crm_contacts"("email");
CREATE INDEX "crm_contacts_email_idx" ON "crm_contacts"("email");
CREATE INDEX "crm_contacts_deletedAt_idx" ON "crm_contacts"("deletedAt");
CREATE INDEX "crm_leads_stage_idx" ON "crm_leads"("stage");
CREATE INDEX "crm_activities_leadId_idx" ON "crm_activities"("leadId");
CREATE INDEX "crm_activities_contactId_idx" ON "crm_activities"("contactId");
CREATE INDEX "crm_activities_createdAt_idx" ON "crm_activities"("createdAt");
CREATE INDEX "crm_audit_logs_entityType_entityId_idx" ON "crm_audit_logs"("entityType", "entityId");
CREATE UNIQUE INDEX "crm_import_records_contactSubmissionId_key" ON "crm_import_records"("contactSubmissionId");

-- Foreign Keys
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "crm_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "crm_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "crm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_audit_logs" ADD CONSTRAINT "crm_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
