// Job Scheduler for executing periodic agent tasks using BullMQ
//
// Uses LAZY initialization — the Redis/BullMQ connection is created only
// when the first method that needs it is called, not at module import time.
//
// When Redis is unavailable: falls back to direct in-memory execution so the
// app works during local development without a running Redis instance.

import { Agent, AgentContext } from './base-agent';

export enum JobPriority {
  HIGH = 1,
  MEDIUM = 5,
  LOW = 10,
}

export interface AgentJobData {
  agentType: string;
  context: AgentContext;
  priority: JobPriority;
}

class AgentJobScheduler {
  private queue: import('bullmq').Queue<AgentJobData> | null = null;
  private worker: import('bullmq').Worker<AgentJobData> | null = null;
  private agents: Map<string, Agent> = new Map();
  private _initialized = false;
  private _redisAvailable: boolean | null = null; // null = not yet checked

  /**
   * Check if Redis is reachable and speaking the Redis protocol.
   */
  private async checkRedisAvailable(): Promise<boolean> {
    if (this._redisAvailable !== null) return this._redisAvailable;

    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT || '6380');

    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis({
        host,
        port,
        password: process.env.REDIS_PASSWORD,
        lazyConnect: true,
        connectTimeout: 1000,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null, // don't retry
        enableOfflineQueue: false,
      });
      await client.connect();
      await client.ping();
      await client.quit();
      this._redisAvailable = true;
    } catch {
      this._redisAvailable = false;
    }

    return this._redisAvailable;
  }

  /**
   * Lazily initialize the BullMQ Queue and Worker.
   * Safe to call multiple times — only runs once.
   * Skips BullMQ entirely if Redis is not available.
   */
  private async ensureInitialized() {
    if (this._initialized) return;
    this._initialized = true; // mark early to prevent re-entry

    const redisOk = await this.checkRedisAvailable();
    if (!redisOk) {
      console.warn('[JobScheduler] Redis not available — falling back to direct in-memory execution.');
      return;
    }

    try {
      const { Queue, Worker } = await import('bullmq');
      const { redisConnection } = await import('@/lib/redis');

      this.queue = new Queue<AgentJobData>('agent-jobs', {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      });

      this.worker = new Worker<AgentJobData>(
        'agent-jobs',
        async (job) => this.processJob(job),
        {
          connection: redisConnection,
          concurrency: parseInt(process.env.AGENT_JOB_CONCURRENCY || '5'),
          // Start paused — resume() is called after agents are registered
          autorun: false,
        }
      );

      this.setupWorkerListeners();
      console.log('[JobScheduler] BullMQ Queue + Worker initialized (paused until agents are registered)');
    } catch (err) {
      console.warn('[JobScheduler] BullMQ initialization failed — using direct execution:', err);
      this.queue = null;
      this.worker = null;
    }
  }

  /**
   * Register an agent for job execution
   */
  registerAgent(agentType: string, agent: Agent) {
    this.agents.set(agentType, agent);
    console.log(`[JobScheduler] Registered agent: ${agentType}`);
  }

  /**
   * Resume the BullMQ worker to start processing jobs.
   * Call this after all agents have been registered via registerAgent().
   * Safe to call when Redis is not available (no-op in that case).
   */
  async resumeWorker() {
    if (this.worker) {
      this.worker.run().catch((err) => {
        console.error('[JobScheduler] Worker run error:', err);
      });
      console.log('[JobScheduler] Worker resumed — ready to process jobs');
    }
  }

  /**
   * Schedule a job for an agent.
   * Falls back to direct async execution if Redis/BullMQ is unavailable.
   */
  async scheduleJob(
    agentType: string,
    context: AgentContext,
    priority: JobPriority = JobPriority.MEDIUM,
    delay?: number
  ) {
    await this.ensureInitialized();

    if (this.queue) {
      // BullMQ path
      await this.queue.add(
        `${agentType}-job`,
        { agentType, context, priority },
        { priority, delay }
      );
    } else {
      // In-memory fallback: run directly after optional delay
      const run = async () => {
        const agent = this.agents.get(agentType);
        if (!agent) {
          console.warn(`[JobScheduler] Agent ${agentType} not registered for direct execution`);
          return;
        }
        try {
          await agent.execute(context);
        } catch (err) {
          console.error(`[JobScheduler] Direct execution failed for ${agentType}:`, err);
        }
      };
      if (delay && delay > 0) {
        setTimeout(run, delay);
      } else {
        // Fire-and-forget so we don't block the caller
        run().catch(() => {});
      }
    }
  }

  /**
   * Schedule recurring job (cron) — no-op when BullMQ is unavailable.
   */
  async scheduleRecurringJob(
    agentType: string,
    cronExpression: string,
    context: AgentContext = {}
  ) {
    await this.ensureInitialized();

    if (!this.queue) {
      console.warn(`[JobScheduler] Recurring job for ${agentType} skipped — Redis not available.`);
      return;
    }

    await this.queue.add(
      `${agentType}-recurring`,
      { agentType, context, priority: JobPriority.MEDIUM },
      { repeat: { pattern: cronExpression } }
    );
  }

  /**
   * Process a job (BullMQ worker handler)
   */
  private async processJob(job: import('bullmq').Job<AgentJobData>) {
    const { agentType, context } = job.data;
    console.log(`[JobScheduler] Processing job for ${agentType}`);

    // If agent isn't registered yet (startup race with BullMQ recurring jobs),
    // wait up to 5 seconds for it to appear before giving up.
    let agent = this.agents.get(agentType);
    if (!agent) {
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 500));
        agent = this.agents.get(agentType);
        if (agent) break;
      }
    }
    if (!agent) throw new Error(`Agent ${agentType} not registered`);

    const startTime = Date.now();
    const result = await agent.execute(context);
    const duration = Date.now() - startTime;

    console.log(`[JobScheduler] Job completed for ${agentType} in ${duration}ms`, {
      success: result.success,
    });

    if (!result.success) throw new Error(result.error || 'Agent execution failed');
    return result;
  }

  /**
   * Setup BullMQ worker event listeners
   */
  private setupWorkerListeners() {
    if (!this.worker) return;
    this.worker.on('completed', (job) => console.log(`[JobScheduler] Job ${job.id} completed`));
    this.worker.on('failed', (job, error) => console.error(`[JobScheduler] Job ${job?.id} failed:`, error));
    this.worker.on('error', (error) => console.error('[JobScheduler] Worker error:', error));
  }

  /**
   * Get queue metrics
   */
  async getMetrics() {
    await this.ensureInitialized();
    if (!this.queue) return { waiting: 0, active: 0, completed: 0, failed: 0 };

    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }

  /**
   * Cleanup
   */
  async close() {
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
  }
}

// Singleton instance — constructor is a no-op (no Redis connection until first use)
export const jobScheduler = new AgentJobScheduler();
