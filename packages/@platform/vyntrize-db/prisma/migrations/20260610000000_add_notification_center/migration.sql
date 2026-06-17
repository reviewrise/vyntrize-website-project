-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('LEAD_CREATED', 'STAGE_CHANGED', 'TASK_CREATED', 'TASK_COMPLETED', 'CALENDAR_EVENT_CREATED', 'CALENDAR_EVENT_UPDATED', 'AGENT_ACTION_PENDING', 'MEETING_ATTENDED', 'MEETING_MISSED');

-- CreateTable
CREATE TABLE "crm_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" VARCHAR(2000),
    "entityType" TEXT,
    "entityId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_notifications_userId_isDismissed_isRead_createdAt_idx" ON "crm_notifications"("userId", "isDismissed", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "crm_notification_preferences_userId_eventType_channel_key" ON "crm_notification_preferences"("userId", "eventType", "channel");

-- AddForeignKey
ALTER TABLE "crm_notifications" ADD CONSTRAINT "crm_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notification_preferences" ADD CONSTRAINT "crm_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
