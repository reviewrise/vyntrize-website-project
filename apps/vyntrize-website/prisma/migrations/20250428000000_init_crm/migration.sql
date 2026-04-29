-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST', 'SPAM');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

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
    "firstResponseAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "notes" TEXT,
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_submissions_email_idx" ON "contact_submissions"("email");

-- CreateIndex
CREATE INDEX "contact_submissions_status_idx" ON "contact_submissions"("status");

-- CreateIndex
CREATE INDEX "contact_submissions_createdAt_idx" ON "contact_submissions"("createdAt");
