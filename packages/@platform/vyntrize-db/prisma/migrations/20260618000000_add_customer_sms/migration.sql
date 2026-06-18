-- Migration: add_customer_sms
-- Adds customer-facing SMS infrastructure:
--   - SmsStatus enum
--   - sms_logs table
--   - Contact.smsOptOut column
--   - DripStep.stepType column (default 'email', backward-compatible)
--   - ActionType.SMS_SEND enum value

-- ─── SmsStatus enum ───────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "SmsStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── ActionType: add SMS_SEND value ───────────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SMS_SEND';
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ─── Contact: add smsOptOut column ────────────────────────────────────────────
ALTER TABLE "crm_contacts"
  ADD COLUMN IF NOT EXISTS "smsOptOut" BOOLEAN NOT NULL DEFAULT false;

-- ─── DripStep: add stepType column ───────────────────────────────────────────
ALTER TABLE "drip_steps"
  ADD COLUMN IF NOT EXISTS "stepType" TEXT NOT NULL DEFAULT 'email';

-- ─── sms_logs table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "sms_logs" (
  "id"           TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "toPhone"      TEXT NOT NULL,
  "toName"       TEXT,
  "content"      TEXT NOT NULL,
  "status"       "SmsStatus" NOT NULL DEFAULT 'QUEUED',
  "messageId"    TEXT,
  "sentAt"       TIMESTAMP(3),
  "errorMessage" TEXT,
  "contactId"    TEXT,
  "leadId"       TEXT,

  CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- ─── sms_logs: foreign keys ───────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "sms_logs"
    ADD CONSTRAINT "sms_logs_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "sms_logs"
    ADD CONSTRAINT "sms_logs_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── sms_logs: indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "sms_logs_contactId_idx"  ON "sms_logs"("contactId");
CREATE INDEX IF NOT EXISTS "sms_logs_leadId_idx"     ON "sms_logs"("leadId");
CREATE INDEX IF NOT EXISTS "sms_logs_status_idx"     ON "sms_logs"("status");
CREATE INDEX IF NOT EXISTS "sms_logs_createdAt_idx"  ON "sms_logs"("createdAt");
