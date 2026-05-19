/**
 * CRM Agent Queue Worker
 *
 * Processes events from the BullMQ agentQueue and dispatches them to the
 * registered agents using the EventBus's in-memory dispatch path.
 *
 * The EventBus._dispatchInMemory method already handles:
 *   1. Running LeadScoringAgent FIRST (sequential) to prevent race conditions
 *   2. Running all other agents in PARALLEL afterwards
 *   3. Error isolation — one agent failing doesn't kill the others
 *
 * This file is initialized once at server startup via instrumentation.ts → init.ts.
 */

import { Worker } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import type { AgentJobData } from '@/lib/queues/agentQueue';

export function startAgentWorker() {
  const concurrency = parseInt(process.env.AGENT_JOB_CONCURRENCY ?? '5');

  const worker = new Worker<AgentJobData>(
    'crm-agents',
    async (job) => {
      const { event, payload, enqueuedAt } = job.data;

      const queueLatencyMs = Date.now() - new Date(enqueuedAt).getTime();
      console.log(
        `[AgentWorker] Processing job ${job.id}: ${event} for lead ${payload.leadId} ` +
        `(queued ${queueLatencyMs}ms ago, attempt ${job.attemptsMade + 1})`
      );

      // Ensure agents are registered before dispatch
      const { agentRegistry } = await import('@/lib/agents/registry');
      if (!agentRegistry.isInitialized()) {
        console.log('[AgentWorker] Registry not initialized — initializing now...');
        await agentRegistry.registerAllAgents();
      }

      // Dispatch via the EventBus in-memory path (handles phase ordering)
      const { eventBus } = await import('@/lib/agents/event-bus');
      await eventBus._dispatchInMemory(event, payload);

      console.log(`[AgentWorker] ✅ Job ${job.id} complete (${event})`);
    },
    {
      connection: redisConnection,
      concurrency,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(
      `[AgentWorker] ❌ Job ${job?.id} (${job?.data?.event}) permanently failed after ${job?.attemptsMade} attempts:`,
      err?.message
    );
  });

  worker.on('error', (err) => {
    console.error('[AgentWorker] Worker connection error:', err);
  });

  console.log(`[AgentWorker] ✅ CRM Agent Worker started (concurrency: ${concurrency})`);
  return worker;
}
