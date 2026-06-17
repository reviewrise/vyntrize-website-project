/**
 * Standalone cleanup entry point for cron or manual invocation.
 * Run with: npx ts-node -e "require('./lib/notifications/notification-cleanup')"
 * or wire to a cron job / API route at your preferred schedule.
 */
import { notificationService } from './notification-service';

notificationService
  .runCleanup()
  .then((result) => {
    console.info('[notification-cleanup] Complete:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[notification-cleanup] Fatal error:', err);
    process.exit(1);
  });
