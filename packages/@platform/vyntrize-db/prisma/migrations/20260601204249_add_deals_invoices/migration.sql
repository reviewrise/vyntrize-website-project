-- CreateEnum
CREATE TYPE "TaskActionType" AS ENUM ('MANUAL', 'EMAIL', 'SMS', 'STATUS_UPDATE', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'FAILED';

-- DropForeignKey
ALTER TABLE "lead_notes" DROP CONSTRAINT "lead_notes_userId_fkey";

-- DropForeignKey
ALTER TABLE "lead_tasks" DROP CONSTRAINT "lead_tasks_createdById_fkey";

-- AlterTable
ALTER TABLE "lead_tasks" ADD COLUMN     "executionLog" JSONB,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "taskType" "TaskActionType" NOT NULL DEFAULT 'MANUAL',
ALTER COLUMN "createdById" DROP NOT NULL;

-- CreateTable
CREATE TABLE "connected_accounts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "userId" TEXT NOT NULL,
    "leadId" TEXT,
    "contactId" TEXT,
    "externalId" TEXT,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "crm_deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "contactId" TEXT,
    "companyId" TEXT,
    "value" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2),
    "taxAmount" DECIMAL(12,2),
    "discount" DECIMAL(12,2),
    "total" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_invoice_line_items" (
    "id" SERIAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "crm_invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_invoice_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connected_accounts_userId_idx" ON "connected_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "connected_accounts_provider_providerId_key" ON "connected_accounts"("provider", "providerId");

-- CreateIndex
CREATE INDEX "calendar_events_userId_idx" ON "calendar_events"("userId");

-- CreateIndex
CREATE INDEX "calendar_events_startTime_idx" ON "calendar_events"("startTime");

-- CreateIndex
CREATE INDEX "calendar_events_leadId_idx" ON "calendar_events"("leadId");

-- CreateIndex
CREATE INDEX "calendar_events_contactId_idx" ON "calendar_events"("contactId");

-- CreateIndex
CREATE INDEX "crm_deals_leadId_idx" ON "crm_deals"("leadId");

-- CreateIndex
CREATE INDEX "crm_deals_status_idx" ON "crm_deals"("status");

-- CreateIndex
CREATE INDEX "crm_deals_createdAt_idx" ON "crm_deals"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "crm_invoices_number_key" ON "crm_invoices"("number");

-- CreateIndex
CREATE INDEX "crm_invoices_dealId_idx" ON "crm_invoices"("dealId");

-- CreateIndex
CREATE INDEX "crm_invoices_status_idx" ON "crm_invoices"("status");

-- CreateIndex
CREATE INDEX "crm_invoices_dueDate_idx" ON "crm_invoices"("dueDate");

-- CreateIndex
CREATE INDEX "crm_invoices_createdAt_idx" ON "crm_invoices"("createdAt");

-- CreateIndex
CREATE INDEX "crm_invoice_line_items_invoiceId_idx" ON "crm_invoice_line_items"("invoiceId");

-- CreateIndex
CREATE INDEX "crm_invoice_payments_invoiceId_idx" ON "crm_invoice_payments"("invoiceId");

-- CreateIndex
CREATE INDEX "crm_invoice_payments_paidAt_idx" ON "crm_invoice_payments"("paidAt");

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "crm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_invoice_line_items" ADD CONSTRAINT "crm_invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "crm_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_invoice_payments" ADD CONSTRAINT "crm_invoice_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "crm_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
