/**
 * CRM Agent Queue — BullMQ-backed event queue for all CRM agent events.
 *
 * WHY: The in-memory EventBus loses events on server restart and causes
 * race conditions (e.g., WorkflowRuleEngine reads score before
 * LeadScoringAgent finishes updating it).
 *
 * HOW:
 * - Events are pushed to this queue instead of executed directly.
 * - The queue worker (agent-queue.worker.ts) processes them sequentially
 *   or in controlled priority order.
 * - Failed jobs are automatically retried with exponential backoff.
 * - Events survive server restarts (stored in Redis).
 */

import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import type { CRMEvent, EventPayload } from '@/lib/agents/event-bus';

export interface AgentJobData {
  event: CRMEvent;
  payload: EventPayload;
  enqueuedAt: string; // ISO timestamp for auditing
}

export const agentQueue = new Queue<AgentJobData>('crm-agents', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 25s, 125s
    },
    removeOnComplete: { count: 100 },  // Keep last 100 completed jobs for debugging
    removeOnFail: { count: 200 },       // Keep last 200 failed jobs for inspection
  },
});

/**
 * Enqueue a CRM event for processing by the agent queue worker.
 * This is the single entry point for all agent events.
 */
export async function enqueueAgentEvent(
  event: CRMEvent,
  payload: EventPayload
): Promise<void> {
  const jobData: AgentJobData = {
    event,
    payload,
    enqueuedAt: new Date().toISOString(),
  };

  // Priority: higher number = higher priority in BullMQ
  // LEAD_CREATED/STAGE_CHANGED get high priority; email events get lower priority
  const priorityMap: Partial<Record<CRMEvent, number>> = {
    lead_created: 10,
    lead_updated: 8,
    stage_changed: 9,
    task_completed: 7,
    email_opened: 4,
    email_clicked: 4,
    email_replied: 6,
    contact_created: 5,
  };

  const priority = priorityMap[event] ?? 5;

  await agentQueue.add(`${event}:${payload.leadId ?? 'unknown'}`, jobData, {
    priority,
  });

  console.log(`[AgentQueue] Enqueued ${event} for lead ${payload.leadId} (priority: ${priority})`);
}
