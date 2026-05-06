// Job Scheduler for periodic agent execution using BullMQ

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { Agent, AgentContext } from './base-agent';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Agent Job Scheduler ──────────────────────────────────────────────────────

class AgentJobScheduler {
  private queue: Queue<AgentJobData> | null = null;
  private worker: Worker<AgentJobData> | null = null;
  private redis: Redis | null = null;
  private agents: Map<string, Agent> = new Map();
  private initialized = false;

  /**
   * Initialize the job scheduler
   */
  async initialize() {
    if (this.initialized) {
      console.log('[JobScheduler] Already initialized');
      return;
    }

    try {
      // Initialize Redis connection
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      // Test Redis connection
      await this.redis.ping();
      console.log('[JobScheduler] Redis connection established');

      // Initialize BullMQ queue
      this.queue = new Queue<AgentJobData>('agent-jobs', {
        connection: this.redis,
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
          connection: this.redis,
          concurrency: parseInt(process.env.AGENT_JOB_CONCURRENCY || '5'),
        }
      );

      this.setupWorkerListeners();
      this.initialized = true;
      console.log('[JobScheduler] Initialized successfully');
    } catch (error) {
      console.error('[JobScheduler] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Register an agent for job execution
   */
  registerAgent(agent: Agent) {
    this.agents.set(agent.constructor.name, agent);
    console.log(`[JobScheduler] Registered agent: ${agent.constructor.name}`);
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
    if (!this.queue) {
      console.warn('[JobScheduler] Not initialized, skipping job scheduling');
      return;
    }

    await this.queue.add(
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

    console.log(`[JobScheduler] Scheduled job for ${agentType}`, { context, priority, delay });
  }

  /**
   * Schedule recurring job (cron)
   */
  async scheduleRecurringJob(
    agentType: string,
    cronExpression: string,
    context: AgentContext = {}
  ) {
    if (!this.queue) {
      console.warn('[JobScheduler] Not initialized, skipping recurring job scheduling');
      return;
    }

    await this.queue.add(
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

    console.log(`[JobScheduler] Scheduled recurring job for ${agentType}`, { cronExpression });
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

    // Skip if agent is disabled
    if (!agent.isAgentEnabled()) {
      console.log(`[JobScheduler] Skipping disabled agent ${agentType}`);
      return { success: true, skipped: true };
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
    if (!this.queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };
    }

    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  /**
   * Check if scheduler is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cleanup
   */
  async close() {
    console.log('[JobScheduler] Closing...');
    
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
    
    this.initialized = false;
    console.log('[JobScheduler] Closed');
  }
}

// Singleton instance
export const jobScheduler = new AgentJobScheduler();
