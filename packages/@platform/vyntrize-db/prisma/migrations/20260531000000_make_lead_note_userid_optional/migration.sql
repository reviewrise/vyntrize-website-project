-- Make lead_notes.userId optional so webhook/agent-created notes
-- don't require a human CrmUser FK.
ALTER TABLE "lead_notes" ALTER COLUMN "userId" DROP NOT NULL;

-- Add bookingSlug and timezone columns to crm_users if they don't already exist.
ALTER TABLE "crm_users" ADD COLUMN IF NOT EXISTS "bookingSlug" TEXT;
ALTER TABLE "crm_users" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'America/New_York';
CREATE UNIQUE INDEX IF NOT EXISTS "crm_users_bookingSlug_key" ON "crm_users"("bookingSlug");
