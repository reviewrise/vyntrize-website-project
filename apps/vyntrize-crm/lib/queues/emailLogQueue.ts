// apps/vyntrize-crm/lib/queues/emailLogQueue.ts

import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/redis'; // assume a redis connection helper exists

export const emailLogQueue = new Queue('emailLog', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Export a simple helper to add jobs (used elsewhere)
export async function enqueueEmailLog(logId: string) {
  await emailLogQueue.add('process', { logId });
}
