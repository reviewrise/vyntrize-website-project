// Job Scheduler for executing periodic agent tasks using BullMQ

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
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
  private queue: Queue<AgentJobData>;
  private worker: Worker<AgentJobData>;
  private redis: Redis;
  private agents: Map<string, Agent> = new Map();

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

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
  }

  /**
   * Schedule recurring job (cron)
   */
  async scheduleRecurringJob(
    agentType: string,
    cronExpression: string,
    context: AgentContext = {}
  ) {
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
   * Cleanup
   */
  async close() {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

// Singleton instance
export const jobScheduler = new AgentJobScheduler();
