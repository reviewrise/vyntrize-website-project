-- DropForeignKey
ALTER TABLE "email_logs" DROP CONSTRAINT "email_logs_userId_fkey";

-- AlterTable
ALTER TABLE "email_logs" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "crm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
