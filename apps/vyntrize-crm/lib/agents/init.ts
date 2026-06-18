// Agent System Initialization - Initialize agents on application startup

import { agentRegistry } from './registry';

let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the agent system
 * This should be called once during application startup
 */
export async function initializeAgentSystem(): Promise<void> {
  // Prevent multiple initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('[AgentSystem] Initializing agent system...');

      // Warn about missing AI provider keys (but don't block initialization)
      if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
        console.warn('[AgentSystem] No AI provider keys configured. AI-powered agents (Email Generation, Next Best Action) will not be available.');
      }

      // Register all agents with the event bus
      await agentRegistry.registerAllAgents();

      // Resume the job scheduler worker AFTER agents are registered.
      // The worker starts paused (autorun: false) to avoid processing jobs
      // before agents are available. Now that all agents are registered it is
      // safe to start picking up queued / recurring jobs.
      const { jobScheduler } = await import('@/lib/agents/job-scheduler');
      await jobScheduler.resumeWorker();

      // If Redis is configured, start the BullMQ queue worker so events
      // are processed persistently (survives server restarts + retries on failure)
      if (process.env.REDIS_URL) {
        console.log('[AgentSystem] REDIS_URL detected — starting BullMQ agent worker...');
        const { startAgentWorker } = await import('@/lib/queues/agentWorker');
        startAgentWorker();
        console.log('[AgentSystem] ✅ BullMQ agent worker started (queue-first mode)');
      } else {
        console.warn('[AgentSystem] ⚠️ No REDIS_URL — agents will run in-memory (events may be lost on restart).');
      }

      console.log('[AgentSystem] Agent system initialized successfully');
    } catch (error) {
      console.error('[AgentSystem] Failed to initialize agent system:', error);
      // Don't throw - allow app to start even if agents fail to initialize
    }
  })();

  return initializationPromise;
}

/**
 * Check if agent system is initialized
 */
export function isAgentSystemInitialized(): boolean {
  return agentRegistry.isInitialized();
}
