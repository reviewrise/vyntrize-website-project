// Job Scheduler for executing periodic agent tasks using BullMQ
//
// Uses LAZY initialization — the Redis/BullMQ connection is created only
// when the first method that needs it is called, not at module import time.
// This prevents ECONNREFUSED errors when Redis isn't available yet (e.g. during
// Next.js build or when the module is imported before Docker networking is ready).

import { Queue, Worker, Job } from 'bullmq';
import { Agent, AgentContext } from './base-agent';
import { redisConnection } from '@/lib/redis';

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
  private queue: Queue<AgentJobData> | null = null;
  private worker: Worker<AgentJobData> | null = null;
  private agents: Map<string, Agent> = new Map();
  private _initialized = false;

  /**
   * Lazily initialize the BullMQ Queue and Worker.
   * Safe to call multiple times — only runs once.
   */
  private ensureInitialized() {
    if (this._initialized) return;

    // Initialize BullMQ queue
    this.queue = new Queue<AgentJobData>('agent-jobs', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    // Initialize worker
    this.worker = new Worker<AgentJobData>(
      'agent-jobs',
      async (job: Job<AgentJobData>) => {
        return this.processJob(job);
      },
      {
        connection: redisConnection,
        concurrency: parseInt(process.env.AGENT_JOB_CONCURRENCY || '5'),
      }
    );

    this.setupWorkerListeners();
    this._initialized = true;
    console.log('[JobScheduler] BullMQ Queue + Worker initialized (lazy)');
  }

  /**
   * Register an agent for job execution
   */
  registerAgent(agentType: string, agent: Agent) {
    this.agents.set(agentType, agent);
    console.log(`[JobScheduler] Registered agent: ${agentType}`);
  }

  /**
   * Schedule a job for an agent
   */
  async scheduleJob(
    agentType: string,
    context: AgentContext,
    priority: JobPriority = JobPriority.MEDIUM,
    delay?: number
  ) {
    this.ensureInitialized();
    await this.queue!.add(
      `${agentType}-job`,
      {
        agentType,
        context,
        priority,
      },
      {
        priority,
        delay,
      }
    );
  }

  /**
   * Schedule recurring job (cron)
   */
  async scheduleRecurringJob(
    agentType: string,
    cronExpression: string,
    context: AgentContext = {}
  ) {
    this.ensureInitialized();
    await this.queue!.add(
      `${agentType}-recurring`,
      {
        agentType,
        context,
        priority: JobPriority.MEDIUM,
      },
      {
        repeat: {
          pattern: cronExpression,
        },
      }
    );
  }

  /**
   * Process a job
   */
  private async processJob(job: Job<AgentJobData>) {
    const { agentType, context } = job.data;
    
    console.log(`[JobScheduler] Processing job for ${agentType}`, context);
    
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent ${agentType} not registered`);
    }

    const startTime = Date.now();
    const result = await agent.execute(context);
    const duration = Date.now() - startTime;

    console.log(`[JobScheduler] Job completed for ${agentType} in ${duration}ms`, {
      success: result.success,
      actionId: result.actionId,
    });

    if (!result.success) {
      throw new Error(result.error || 'Agent execution failed');
    }

    return result;
  }

  /**
   * Setup worker event listeners
   */
  private setupWorkerListeners() {
    if (!this.worker) return;

    this.worker.on('completed', (job) => {
      console.log(`[JobScheduler] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[JobScheduler] Job ${job?.id} failed:`, error);
    });

    this.worker.on('error', (error) => {
      console.error('[JobScheduler] Worker error:', error);
    });
  }

  /**
   * Get queue metrics
   */
  async getMetrics() {
    this.ensureInitialized();
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue!.getWaitingCount(),
      this.queue!.getActiveCount(),
      this.queue!.getCompletedCount(),
      this.queue!.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  /**
   * Cleanup
   */
  async close() {
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
  }
}

// Singleton instance — constructor is now a no-op (no Redis connection)
export const jobScheduler = new AgentJobScheduler();
