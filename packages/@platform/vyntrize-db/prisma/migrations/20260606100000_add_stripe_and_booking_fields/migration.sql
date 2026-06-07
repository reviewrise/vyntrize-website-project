-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "cancelToken" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "meetLink" TEXT,
ADD COLUMN     "rescheduleToken" TEXT;

-- AlterTable
ALTER TABLE "crm_contacts" ADD COLUMN     "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "crm_invoices" ADD COLUMN     "stripeInvoiceId" TEXT,
ADD COLUMN     "stripePaymentUrl" TEXT,
ADD COLUMN     "stripeStatus" TEXT;

-- CreateTable
CREATE TABLE "availability_rules" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL DEFAULT 0,
    "endHour" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_settings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Book a Consultation',
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "generateMeet" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "booking_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availability_rules_userId_idx" ON "availability_rules"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "availability_rules_userId_dayOfWeek_key" ON "availability_rules"("userId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "booking_settings_userId_key" ON "booking_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_cancelToken_key" ON "calendar_events"("cancelToken");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_rescheduleToken_key" ON "calendar_events"("rescheduleToken");

-- CreateIndex
CREATE INDEX "calendar_events_cancelToken_idx" ON "calendar_events"("cancelToken");

-- CreateIndex
CREATE INDEX "calendar_events_rescheduleToken_idx" ON "calendar_events"("rescheduleToken");

-- CreateIndex
CREATE UNIQUE INDEX "crm_contacts_stripeCustomerId_key" ON "crm_contacts"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_invoices_stripeInvoiceId_key" ON "crm_invoices"("stripeInvoiceId");

-- AddForeignKey
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_settings" ADD CONSTRAINT "booking_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
