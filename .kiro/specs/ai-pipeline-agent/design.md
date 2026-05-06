# Design Document: AI Pipeline Agent System

## Overview

The AI Pipeline Agent System is an autonomous, intelligent automation layer for the VyntRise CRM that provides 24/7 monitoring and automation of the sales pipeline. The system combines event-driven real-time processing with periodic background analysis to deliver lead scoring, task automation, stagnation detection, AI-powered email generation, predictive analytics, and revenue forecasting.

### Design Goals

1. **Autonomous Operation**: Agents operate continuously without manual intervention, with configurable autonomy levels
2. **Explainability**: Every agent action includes reasoning and is tracked in an audit trail
3. **Scalability**: Handle 1000+ leads efficiently with horizontal scaling support
4. **Reliability**: Robust error handling, retry logic, and circuit breakers
5. **Extensibility**: Easy to add new agent types following established patterns
6. **Security**: Input validation, data sanitization, and role-based access control

### Key Features

- **Real-time Event Processing**: Agents respond to CRM events (lead created, stage changed, email opened) within 500ms
- **Periodic Batch Analysis**: Daily/hourly jobs for scoring, stagnation detection, and forecasting
- **AI-Powered Intelligence**: OpenAI GPT-4 integration for email generation and next best action recommendations
- **Configurable Autonomy**: Three levels - FULLY_AUTONOMOUS, SUGGEST_APPROVE, COPILOT
- **Comprehensive Tracking**: All agent actions stored with reasoning, metadata, and approval workflow
- **Dashboard & API**: UI for monitoring, approving actions, and configuring rules

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "CRM Application"
        UI[Next.js UI]
        API[API Routes]
        Actions[Server Actions]
    end
    
    subgraph "Agent System"
        EventBus[Event Bus<br/>TypeScript EventEmitter]
        JobScheduler[Job Scheduler<br/>BullMQ + Redis]
        AgentRegistry[Agent Registry]
        
        subgraph "Agents"
            LeadScoring[Lead Scoring Agent]
            TaskAutomation[Task Automation Agent]
            Stagnation[Stagnation Detection Agent]
            EmailGen[Email Generation Agent]
            NextAction[Next Best Action Agent]
            Predictive[Predictive Analytics Agent]
            StageProgression[Stage Progression Agent]
            DripCampaign[Drip Campaign Agent]
            RevenueForecast[Revenue Forecasting Agent]
        end
    end
    
    subgraph "External Services"
        OpenAI[OpenAI GPT-4 API]
        Redis[(Redis)]
    end
    
    subgraph "Database"
        Prisma[Prisma ORM]
        PostgreSQL[(PostgreSQL)]
    end
    
    UI --> API
    UI --> Actions
    API --> EventBus
    Actions --> EventBus
    EventBus --> AgentRegistry
    AgentRegistry --> Agents
    JobScheduler --> Agents
    Agents --> Prisma
    Agents --> OpenAI
    JobScheduler --> Redis
    Prisma --> PostgreSQL
    
    style EventBus fill:#e1f5ff
    style JobScheduler fill:#fff4e1
    style Agents fill:#f0f0f0
```

### System Components

#### 1. Event Bus
- **Technology**: TypeScript EventEmitter (Node.js built-in)
- **Purpose**: Dispatch CRM events to registered agents in real-time
- **Event Types**: `lead_created`, `lead_updated`, `stage_changed`, `email_opened`, `email_clicked`, `task_completed`
- **Pattern**: Pub/Sub with multiple subscribers per event
- **Performance**: Synchronous event handling with async agent execution

#### 2. Job Scheduler
- **Technology**: BullMQ with Redis
- **Purpose**: Execute periodic agent analysis tasks
- **Job Types**: 
  - Minute jobs (1min, 5min, 15min)
  - Hourly jobs
  - Daily jobs (off-peak: midnight-6am)
- **Features**: Priority queues, retry with exponential backoff, job concurrency control

#### 3. Agent Registry
- **Purpose**: Central registry for all agent implementations
- **Responsibilities**:
  - Agent registration and discovery
  - Event-to-agent mapping
  - Agent lifecycle management
  - Feature flag enforcement

#### 4. OpenAI Provider
- **Purpose**: Centralized OpenAI API integration
- **Features**:
  - Rate limiting (10,000 tokens/minute)
  - Retry logic with exponential backoff
  - Request/response caching (5 minutes)
  - Token usage tracking
  - Circuit breaker pattern
  - Input sanitization

### Data Flow

#### Real-Time Event Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant EventBus
    participant Agent
    participant DB
    participant OpenAI
    
    User->>API: Update Lead Stage
    API->>DB: Update Lead
    API->>EventBus: Emit stage_changed event
    EventBus->>Agent: Notify registered agents
    Agent->>DB: Query lead data
    Agent->>OpenAI: Generate content (if needed)
    OpenAI-->>Agent: AI response
    Agent->>DB: Create AgentAction
    Agent->>DB: Execute action (create task, etc.)
    Agent-->>EventBus: Action complete
    EventBus-->>API: Event processed
    API-->>User: Response
```

#### Batch Job Flow

```mermaid
sequenceDiagram
    participant Scheduler
    participant Agent
    participant DB
    participant OpenAI
    
    Scheduler->>Agent: Trigger daily job
    Agent->>DB: Query all active leads
    loop For each lead
        Agent->>Agent: Calculate score/prediction
        Agent->>OpenAI: AI analysis (if needed)
        OpenAI-->>Agent: AI response
        Agent->>DB: Update lead
        Agent->>DB: Create AgentAction
    end
    Agent-->>Scheduler: Job complete
```

## Component Design

### Agent Base Class

All agents extend a base `Agent` class that provides common functionality:

```typescript
// apps/vyntrize-crm/lib/agents/base-agent.ts

export enum AgentType {
  LEAD_SCORING = 'LEAD_SCORING',
  TASK_AUTOMATION = 'TASK_AUTOMATION',
  STAGNATION_DETECTION = 'STAGNATION_DETECTION',
  EMAIL_GENERATION = 'EMAIL_GENERATION',
  NEXT_BEST_ACTION = 'NEXT_BEST_ACTION',
  PREDICTIVE_ANALYTICS = 'PREDICTIVE_ANALYTICS',
  STAGE_PROGRESSION = 'STAGE_PROGRESSION',
  DRIP_CAMPAIGN = 'DRIP_CAMPAIGN',
  REVENUE_FORECASTING = 'REVENUE_FORECASTING',
}

export enum ActionType {
  SCORE_UPDATE = 'SCORE_UPDATE',
  TASK_CREATE = 'TASK_CREATE',
  EMAIL_SEND = 'EMAIL_SEND',
  STAGE_CHANGE = 'STAGE_CHANGE',
  ALERT = 'ALERT',
  PREDICTION_UPDATE = 'PREDICTION_UPDATE',
}

export enum ActionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
}

export enum AutonomyLevel {
  FULLY_AUTONOMOUS = 'FULLY_AUTONOMOUS',     // Execute immediately
  SUGGEST_APPROVE = 'SUGGEST_APPROVE',       // Require user approval
  COPILOT = 'COPILOT',                       // Suggest only, no execution
}

export interface AgentContext {
  leadId?: string;
  userId?: string;
  eventData?: Record<string, unknown>;
}

export interface AgentActionResult {
  success: boolean;
  actionId?: string;
  error?: string;
  reasoning: string;
  metadata?: Record<string, unknown>;
}

export abstract class Agent {
  protected agentType: AgentType;
  protected enabled: boolean;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
    this.enabled = this.isEnabled();
  }

  /**
   * Check if agent is enabled via feature flags
   */
  protected isEnabled(): boolean {
    const envVar = `AGENT_${this.agentType}_ENABLED`;
    return process.env[envVar] !== 'false';
  }

  /**
   * Execute agent logic
   */
  abstract execute(context: AgentContext): Promise<AgentActionResult>;

  /**
   * Get agent configuration
   */
  abstract getConfig(): AgentConfig;

  /**
   * Record agent action in database
   */
  protected async recordAction(
    actionType: ActionType,
    leadId: string,
    reasoning: string,
    autonomyLevel: AutonomyLevel,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const action = await prisma.agentAction.create({
      data: {
        agentType: this.agentType,
        actionType,
        leadId,
        reasoning,
        autonomyLevel,
        status: autonomyLevel === AutonomyLevel.FULLY_AUTONOMOUS 
          ? ActionStatus.EXECUTED 
          : ActionStatus.PENDING,
        metadata: metadata || {},
        executedAt: autonomyLevel === AutonomyLevel.FULLY_AUTONOMOUS 
          ? new Date() 
          : null,
      },
    });

    return action.id;
  }

  /**
   * Log agent execution
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
    const logData = {
      agentType: this.agentType,
      message,
      ...(data && { data }),
    };
    
    if (level === 'error') {
      console.error('[Agent]', logData);
    } else if (level === 'warn') {
      console.warn('[Agent]', logData);
    } else {
      console.log('[Agent]', logData);
    }
  }
}

export interface AgentConfig {
  agentType: AgentType;
  enabled: boolean;
  autonomyLevel: AutonomyLevel;
  executionFrequency?: string; // cron expression for batch jobs
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### Event Bus Implementation

```typescript
// apps/vyntrize-crm/lib/agents/event-bus.ts

import { EventEmitter } from 'events';
import { Agent, AgentContext } from './base-agent';

export enum CRMEvent {
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  STAGE_CHANGED = 'stage_changed',
  EMAIL_OPENED = 'email_opened',
  EMAIL_CLICKED = 'email_clicked',
  TASK_COMPLETED = 'task_completed',
  CONTACT_CREATED = 'contact_created',
}

export interface EventPayload {
  leadId?: string;
  contactId?: string;
  userId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

class AgentEventBus extends EventEmitter {
  private agents: Map<CRMEvent, Agent[]> = new Map();

  /**
   * Register an agent to listen for specific events
   */
  registerAgent(event: CRMEvent, agent: Agent) {
    if (!this.agents.has(event)) {
      this.agents.set(event, []);
    }
    this.agents.get(event)!.push(agent);
    
    console.log(`[EventBus] Registered ${agent.constructor.name} for ${event}`);
  }

  /**
   * Emit a CRM event and notify all registered agents
   */
  async emitCRMEvent(event: CRMEvent, payload: EventPayload) {
    console.log(`[EventBus] Emitting ${event}`, payload);
    
    const registeredAgents = this.agents.get(event) || [];
    
    // Execute agents in parallel (they handle their own errors)
    const promises = registeredAgents.map(async (agent) => {
      try {
        const context: AgentContext = {
          leadId: payload.leadId,
          userId: payload.userId,
          eventData: payload.metadata,
        };
        
        const result = await agent.execute(context);
        
        if (!result.success) {
          console.error(`[EventBus] Agent ${agent.constructor.name} failed:`, result.error);
        }
      } catch (error) {
        console.error(`[EventBus] Agent ${agent.constructor.name} threw error:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get all registered agents for an event
   */
  getAgents(event: CRMEvent): Agent[] {
    return this.agents.get(event) || [];
  }
}

// Singleton instance
export const eventBus = new AgentEventBus();
```

### Job Scheduler Implementation

```typescript
// apps/vyntrize-crm/lib/agents/job-scheduler.ts

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
```


### OpenAI Provider Implementation

```typescript
// apps/vyntrize-crm/lib/agents/openai-provider.ts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

export interface OpenAIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
  content: string;
  tokensUsed: number;
  cached: boolean;
}

class OpenAIProvider {
  private client: OpenAI;
  private cache: Map<string, { content: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_TPM = 10000; // tokens per minute
  private readonly MAX_CONCURRENT = 5;
  private currentConcurrent = 0;
  private tokenUsageThisMinute = 0;
  private minuteResetTime = Date.now() + 60000;

  // Circuit breaker
  private failureCount = 0;
  private readonly FAILURE_THRESHOLD = 5;
  private circuitOpen = false;
  private circuitResetTime = 0;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 30000, // 30 second timeout
    });

    console.log('[OpenAIProvider] Initialized');
  }

  /**
   * Generate completion with rate limiting and caching
   */
  async generateCompletion(request: OpenAIRequest): Promise<OpenAIResponse> {
    // Check circuit breaker
    if (this.circuitOpen) {
      if (Date.now() < this.circuitResetTime) {
        throw new Error('OpenAI circuit breaker is open. Service temporarily unavailable.');
      }
      // Reset circuit breaker
      this.circuitOpen = false;
      this.failureCount = 0;
    }

    // Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('[OpenAIProvider] Cache hit');
      return {
        content: cached,
        tokensUsed: 0,
        cached: true,
      };
    }

    // Wait for concurrency slot
    await this.waitForConcurrencySlot();

    // Wait for rate limit
    await this.waitForRateLimit(request.maxTokens || 500);

    try {
      this.currentConcurrent++;

      // Sanitize inputs
      const sanitizedPrompt = this.sanitizeInput(request.prompt);
      const sanitizedSystemPrompt = request.systemPrompt 
        ? this.sanitizeInput(request.systemPrompt)
        : 'You are a helpful CRM assistant. Provide professional, concise responses.';

      // Make API call
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: sanitizedSystemPrompt },
          { role: 'user', content: sanitizedPrompt },
        ],
        max_tokens: request.maxTokens || 500,
        temperature: request.temperature || 0.7,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Update rate limit tracking
      this.tokenUsageThisMinute += tokensUsed;

      // Cache result
      this.setCache(cacheKey, content);

      // Track metrics
      await this.trackMetrics(tokensUsed);

      // Reset failure count on success
      this.failureCount = 0;

      console.log('[OpenAIProvider] Completion generated', {
        tokensUsed,
        cached: false,
      });

      return {
        content,
        tokensUsed,
        cached: false,
      };
    } catch (error) {
      this.failureCount++;
      
      // Open circuit breaker if threshold reached
      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.circuitOpen = true;
        this.circuitResetTime = Date.now() + 60000; // 1 minute
        console.error('[OpenAIProvider] Circuit breaker opened');
      }

      console.error('[OpenAIProvider] Error:', error);
      throw error;
    } finally {
      this.currentConcurrent--;
    }
  }

  /**
   * Wait for available concurrency slot
   */
  private async waitForConcurrencySlot(): Promise<void> {
    while (this.currentConcurrent >= this.MAX_CONCURRENT) {
      await this.delay(100);
    }
  }

  /**
   * Wait for rate limit availability
   */
  private async waitForRateLimit(estimatedTokens: number): Promise<void> {
    // Reset counter if minute has passed
    if (Date.now() >= this.minuteResetTime) {
      this.tokenUsageThisMinute = 0;
      this.minuteResetTime = Date.now() + 60000;
    }

    // Wait if adding this request would exceed rate limit
    while (this.tokenUsageThisMinute + estimatedTokens > this.RATE_LIMIT_TPM) {
      const waitTime = this.minuteResetTime - Date.now();
      console.warn(`[OpenAIProvider] Rate limit reached, waiting ${waitTime}ms`);
      await this.delay(Math.min(waitTime, 1000));
      
      // Check if minute has reset
      if (Date.now() >= this.minuteResetTime) {
        this.tokenUsageThisMinute = 0;
        this.minuteResetTime = Date.now() + 60000;
      }
    }
  }

  /**
   * Sanitize input to prevent prompt injection
   */
  private sanitizeInput(input: string): string {
    // Remove potential prompt injection patterns
    return input
      .replace(/\[INST\]/gi, '')
      .replace(/\[\/INST\]/gi, '')
      .replace(/<\|im_start\|>/gi, '')
      .replace(/<\|im_end\|>/gi, '')
      .trim()
      .slice(0, 4000); // Limit length
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: OpenAIRequest): string {
    return `${request.systemPrompt || 'default'}:${request.prompt}:${request.maxTokens || 500}:${request.temperature || 0.7}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.content;
  }

  /**
   * Set cache
   */
  private setCache(key: string, content: string): void {
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Track metrics in database
   */
  private async trackMetrics(tokensUsed: number): Promise<void> {
    try {
      await prisma.agentMetric.create({
        data: {
          agentType: 'OPENAI_PROVIDER',
          metricName: 'tokens_used',
          metricValue: tokensUsed,
          calculatedAt: new Date(),
          metadata: {},
        },
      });
    } catch (error) {
      console.error('[OpenAIProvider] Failed to track metrics:', error);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get provider status
   */
  getStatus() {
    return {
      circuitOpen: this.circuitOpen,
      failureCount: this.failureCount,
      currentConcurrent: this.currentConcurrent,
      tokenUsageThisMinute: this.tokenUsageThisMinute,
      cacheSize: this.cache.size,
    };
  }
}

// Singleton instance
export const openAIProvider = new OpenAIProvider();
```

## Agent Implementations

### 1. Lead Scoring Agent

```typescript
// apps/vyntrize-crm/lib/agents/lead-scoring-agent.ts

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult } from './base-agent';
import { prisma } from '@/lib/prisma';

interface ScoringFactors {
  emailOpens: number;
  emailClicks: number;
  websiteVisits: number;
  completedTasks: number;
  daysSinceActivity: number;
}

export class LeadScoringAgent extends Agent {
  constructor() {
    super(AgentType.LEAD_SCORING);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!context.leadId) {
      return {
        success: false,
        error: 'Lead ID required',
        reasoning: 'Cannot score lead without ID',
      };
    }

    try {
      // Fetch lead data
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: {
          emailTracking: {
            where: {
              sentAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          },
          leadTasks: {
            where: {
              status: 'COMPLETED',
            },
          },
          leadActivities: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      });

      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
          reasoning: 'Lead does not exist',
        };
      }

      // Calculate scoring factors
      const factors = this.calculateFactors(lead);
      
      // Calculate score
      const score = this.calculateScore(factors);
      
      // Determine qualification status
      const qualificationStatus = this.determineQualificationStatus(score);
      
      // Update lead
      await prisma.lead.update({
        where: { id: context.leadId },
        data: {
          score,
          qualificationStatus,
        },
      });

      // Record action
      const reasoning = this.generateReasoning(factors, score, qualificationStatus);
      const actionId = await this.recordAction(
        ActionType.SCORE_UPDATE,
        context.leadId,
        reasoning,
        AutonomyLevel.FULLY_AUTONOMOUS,
        {
          previousScore: lead.score,
          newScore: score,
          factors,
          qualificationStatus,
        }
      );

      this.log('info', 'Lead scored', {
        leadId: context.leadId,
        score,
        qualificationStatus,
      });

      return {
        success: true,
        actionId,
        reasoning,
        metadata: {
          score,
          qualificationStatus,
          factors,
        },
      };
    } catch (error) {
      this.log('error', 'Failed to score lead', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Error during lead scoring',
      };
    }
  }

  private calculateFactors(lead: any): ScoringFactors {
    const emailOpens = lead.emailTracking.filter((e: any) => e.openedAt).length;
    const emailClicks = lead.emailTracking.filter((e: any) => e.clickedAt).length;
    const websiteVisits = lead.leadActivities.filter(
      (a: any) => a.activityType === 'page_view'
    ).length;
    const completedTasks = lead.leadTasks.length;
    
    const lastActivityAt = lead.lastActivityAt || lead.createdAt;
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivityAt).getTime()) / (24 * 60 * 60 * 1000)
    );

    return {
      emailOpens,
      emailClicks,
      websiteVisits,
      completedTasks,
      daysSinceActivity,
    };
  }

  private calculateScore(factors: ScoringFactors): number {
    let score = 50; // Base score

    // Positive factors
    score += factors.emailOpens * 10;
    score += factors.emailClicks * 15;
    score += factors.websiteVisits * 20;
    score += factors.completedTasks * 5;

    // Negative factors (max -30)
    const inactivityPenalty = Math.min(factors.daysSinceActivity * 5, 30);
    score -= inactivityPenalty;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  private determineQualificationStatus(score: number): string {
    if (score >= 70) return 'qualified';
    if (score < 40) return 'cold';
    return 'warm';
  }

  private generateReasoning(
    factors: ScoringFactors,
    score: number,
    qualificationStatus: string
  ): string {
    const parts = [
      `Lead scored ${score}/100 (${qualificationStatus}).`,
      `Factors: ${factors.emailOpens} email opens, ${factors.emailClicks} clicks, ${factors.websiteVisits} website visits, ${factors.completedTasks} completed tasks.`,
    ];

    if (factors.daysSinceActivity > 0) {
      parts.push(`${factors.daysSinceActivity} days since last activity.`);
    }

    return parts.join(' ');
  }

  getConfig() {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      executionFrequency: '0 0 * * *', // Daily at midnight
      priority: 'MEDIUM' as const,
    };
  }
}
```

### 2. Task Automation Agent

```typescript
// apps/vyntrize-crm/lib/agents/task-automation-agent.ts

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult } from './base-agent';
import { prisma } from '@/lib/prisma';
import { LeadStage } from '@prisma/client';

interface StageTaskConfig {
  stage: LeadStage;
  taskTitle: string;
  taskDescription: string;
  dueInDays: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export class TaskAutomationAgent extends Agent {
  private stageConfigs: StageTaskConfig[] = [
    {
      stage: 'CONTACTED',
      taskTitle: 'Follow up with lead',
      taskDescription: 'Schedule a follow-up call or email to continue the conversation',
      dueInDays: 2,
      priority: 'MEDIUM',
    },
    {
      stage: 'QUALIFIED',
      taskTitle: 'Prepare proposal',
      taskDescription: 'Create and review proposal document for the lead',
      dueInDays: 3,
      priority: 'MEDIUM',
    },
    {
      stage: 'PROPOSAL_SENT',
      taskTitle: 'Follow up on proposal',
      taskDescription: 'Call lead to discuss proposal and answer questions',
      dueInDays: 1,
      priority: 'HIGH',
    },
  ];

  constructor() {
    super(AgentType.TASK_AUTOMATION);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!context.leadId) {
      return {
        success: false,
        error: 'Lead ID required',
        reasoning: 'Cannot create task without lead ID',
      };
    }

    try {
      // Get lead with stage information
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: {
          contact: true,
          assignee: true,
        },
      });

      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
          reasoning: 'Lead does not exist',
        };
      }

      // Find task configuration for this stage
      const config = this.stageConfigs.find(c => c.stage === lead.stage);
      
      if (!config) {
        return {
          success: true,
          reasoning: `No automatic task configured for stage ${lead.stage}`,
        };
      }

      // Check if task already exists
      const existingTask = await prisma.leadTask.findFirst({
        where: {
          leadId: lead.id,
          title: config.taskTitle,
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
        },
      });

      if (existingTask) {
        return {
          success: true,
          reasoning: 'Task already exists for this stage',
        };
      }

      // Calculate due date (business days)
      const dueDate = this.addBusinessDays(new Date(), config.dueInDays);

      // Determine assignee
      const assigneeId = lead.assigneeId || context.userId;

      // Create task
      const task = await prisma.leadTask.create({
        data: {
          leadId: lead.id,
          title: config.taskTitle,
          description: this.generateTaskDescription(config, lead),
          status: 'PENDING',
          priority: config.priority,
          dueDate,
          assignedToId: assigneeId,
          createdById: context.userId || assigneeId!,
        },
      });

      // Record action
      const reasoning = this.generateReasoning(config, lead, task);
      const actionId = await this.recordAction(
        ActionType.TASK_CREATE,
        lead.id,
        reasoning,
        AutonomyLevel.FULLY_AUTONOMOUS,
        {
          taskId: task.id,
          taskTitle: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
        }
      );

      this.log('info', 'Task created', {
        leadId: lead.id,
        taskId: task.id,
        stage: lead.stage,
      });

      return {
        success: true,
        actionId,
        reasoning,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
        },
      };
    } catch (error) {
      this.log('error', 'Failed to create task', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Error during task creation',
      };
    }
  }

  private generateTaskDescription(config: StageTaskConfig, lead: any): string {
    const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;
    return `${config.taskDescription}\n\nLead: ${lead.title}\nContact: ${contactName}`;
  }

  private generateReasoning(config: StageTaskConfig, lead: any, task: any): string {
    const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;
    return `Created task "${config.taskTitle}" for lead "${lead.title}" (${contactName}) due to stage transition to ${lead.stage}. Task due in ${config.dueInDays} business days.`;
  }

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  getConfig() {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      priority: 'HIGH' as const,
    };
  }
}
```


### 3. Stagnation Detection Agent

```typescript
// apps/vyntrize-crm/lib/agents/stagnation-detection-agent.ts

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult } from './base-agent';
import { prisma } from '@/lib/prisma';
import { LeadStage } from '@prisma/client';

interface StagnationThreshold {
  stages: LeadStage[];
  daysThreshold: number;
  action: 'CREATE_TASK' | 'SEND_ALERT';
}

export class StagnationDetectionAgent extends Agent {
  private thresholds: StagnationThreshold[] = [
    {
      stages: ['NEW', 'CONTACTED'],
      daysThreshold: 7,
      action: 'CREATE_TASK',
    },
    {
      stages: ['QUALIFIED', 'PROPOSAL_SENT'],
      daysThreshold: 14,
      action: 'CREATE_TASK',
    },
    {
      stages: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'],
      daysThreshold: 21,
      action: 'SEND_ALERT',
    },
  ];

  constructor() {
    super(AgentType.STAGNATION_DETECTION);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    try {
      // If leadId provided, check specific lead
      if (context.leadId) {
        return await this.checkLead(context.leadId, context.userId);
      }

      // Otherwise, scan all active leads
      return await this.scanAllLeads();
    } catch (error) {
      this.log('error', 'Failed to detect stagnation', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Error during stagnation detection',
      };
    }
  }

  private async checkLead(leadId: string, userId?: string): Promise<AgentActionResult> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        contact: true,
        assignee: true,
      },
    });

    if (!lead) {
      return {
        success: false,
        error: 'Lead not found',
        reasoning: 'Lead does not exist',
      };
    }

    // Skip closed leads
    if (lead.stage === 'WON' || lead.stage === 'LOST') {
      return {
        success: true,
        reasoning: 'Lead is closed, skipping stagnation check',
      };
    }

    const daysSinceActivity = this.calculateDaysSinceActivity(lead);
    const threshold = this.getThresholdForLead(lead.stage, daysSinceActivity);

    if (!threshold) {
      return {
        success: true,
        reasoning: `Lead has ${daysSinceActivity} days since activity, below all thresholds`,
      };
    }

    // Take action based on threshold
    if (threshold.action === 'CREATE_TASK') {
      return await this.createStagnationTask(lead, daysSinceActivity, userId);
    } else {
      return await this.sendStagnationAlert(lead, daysSinceActivity);
    }
  }

  private async scanAllLeads(): Promise<AgentActionResult> {
    const leads = await prisma.lead.findMany({
      where: {
        stage: {
          in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'],
        },
      },
      include: {
        contact: true,
        assignee: true,
      },
    });

    let tasksCreated = 0;
    let alertsSent = 0;

    for (const lead of leads) {
      const result = await this.checkLead(lead.id);
      if (result.success && result.metadata) {
        if (result.metadata.action === 'task_created') tasksCreated++;
        if (result.metadata.action === 'alert_sent') alertsSent++;
      }
    }

    const reasoning = `Scanned ${leads.length} leads. Created ${tasksCreated} tasks, sent ${alertsSent} alerts.`;

    this.log('info', 'Stagnation scan complete', {
      leadsScanned: leads.length,
      tasksCreated,
      alertsSent,
    });

    return {
      success: true,
      reasoning,
      metadata: {
        leadsScanned: leads.length,
        tasksCreated,
        alertsSent,
      },
    };
  }

  private calculateDaysSinceActivity(lead: any): number {
    const lastActivityAt = lead.lastActivityAt || lead.createdAt;
    return Math.floor(
      (Date.now() - new Date(lastActivityAt).getTime()) / (24 * 60 * 60 * 1000)
    );
  }

  private getThresholdForLead(stage: LeadStage, daysSinceActivity: number): StagnationThreshold | null {
    // Find the most specific threshold that applies
    const applicableThresholds = this.thresholds.filter(
      t => t.stages.includes(stage) && daysSinceActivity >= t.daysThreshold
    );

    if (applicableThresholds.length === 0) return null;

    // Return threshold with highest days requirement (most severe)
    return applicableThresholds.reduce((max, t) => 
      t.daysThreshold > max.daysThreshold ? t : max
    );
  }

  private async createStagnationTask(
    lead: any,
    daysSinceActivity: number,
    userId?: string
  ): Promise<AgentActionResult> {
    // Check if stagnation task already exists
    const existingTask = await prisma.leadTask.findFirst({
      where: {
        leadId: lead.id,
        title: {
          contains: 'stagnant',
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });

    if (existingTask) {
      return {
        success: true,
        reasoning: 'Stagnation task already exists',
      };
    }

    const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;
    const task = await prisma.leadTask.create({
      data: {
        leadId: lead.id,
        title: `Follow up on stagnant lead`,
        description: `This lead has had no activity for ${daysSinceActivity} days. Please reach out to ${contactName} to re-engage.`,
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
        assignedToId: lead.assigneeId,
        createdById: userId || lead.assigneeId!,
      },
    });

    const reasoning = `Lead "${lead.title}" has been stagnant for ${daysSinceActivity} days. Created high-priority follow-up task.`;
    const actionId = await this.recordAction(
      ActionType.TASK_CREATE,
      lead.id,
      reasoning,
      AutonomyLevel.FULLY_AUTONOMOUS,
      {
        taskId: task.id,
        daysSinceActivity,
        action: 'task_created',
      }
    );

    return {
      success: true,
      actionId,
      reasoning,
      metadata: {
        taskId: task.id,
        daysSinceActivity,
        action: 'task_created',
      },
    };
  }

  private async sendStagnationAlert(
    lead: any,
    daysSinceActivity: number
  ): Promise<AgentActionResult> {
    const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;
    const reasoning = `ALERT: Lead "${lead.title}" (${contactName}) has been stagnant for ${daysSinceActivity} days. Immediate attention required.`;

    const actionId = await this.recordAction(
      ActionType.ALERT,
      lead.id,
      reasoning,
      AutonomyLevel.FULLY_AUTONOMOUS,
      {
        daysSinceActivity,
        alertType: 'stagnation',
        action: 'alert_sent',
      }
    );

    // TODO: Integrate with notification system to send actual alert

    return {
      success: true,
      actionId,
      reasoning,
      metadata: {
        daysSinceActivity,
        action: 'alert_sent',
      },
    };
  }

  getConfig() {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      executionFrequency: '0 0 * * *', // Daily at midnight
      priority: 'MEDIUM' as const,
    };
  }
}
```

### 4. Email Generation Agent

```typescript
// apps/vyntrize-crm/lib/agents/email-generation-agent.ts

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult } from './base-agent';
import { openAIProvider } from './openai-provider';
import { prisma } from '@/lib/prisma';
import { LeadStage } from '@prisma/client';

interface EmailGenerationContext extends AgentContext {
  emailType?: 'introduction' | 'follow_up' | 'proposal' | 'check_in';
  customInstructions?: string;
}

export class EmailGenerationAgent extends Agent {
  constructor() {
    super(AgentType.EMAIL_GENERATION);
  }

  async execute(context: EmailGenerationContext): Promise<AgentActionResult> {
    if (!context.leadId) {
      return {
        success: false,
        error: 'Lead ID required',
        reasoning: 'Cannot generate email without lead ID',
      };
    }

    try {
      // Fetch lead data with context
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: {
          contact: true,
          company: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          leadActivities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
          reasoning: 'Lead does not exist',
        };
      }

      // Generate email using OpenAI
      const { subject, body } = await this.generateEmail(lead, context);

      // Store generated email as pending action
      const reasoning = `Generated ${context.emailType || 'follow-up'} email for ${lead.contact.firstName} ${lead.contact.lastName}`;
      const actionId = await this.recordAction(
        ActionType.EMAIL_SEND,
        lead.id,
        reasoning,
        AutonomyLevel.SUGGEST_APPROVE, // Requires approval
        {
          subject,
          body,
          emailType: context.emailType,
          recipientEmail: lead.contact.email,
          recipientName: `${lead.contact.firstName} ${lead.contact.lastName}`,
        }
      );

      this.log('info', 'Email generated', {
        leadId: lead.id,
        actionId,
        emailType: context.emailType,
      });

      return {
        success: true,
        actionId,
        reasoning,
        metadata: {
          subject,
          body,
          requiresApproval: true,
        },
      };
    } catch (error) {
      this.log('error', 'Failed to generate email', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Error during email generation',
      };
    }
  }

  private async generateEmail(lead: any, context: EmailGenerationContext) {
    const contactName = lead.contact.firstName;
    const companyName = lead.company?.name || 'your company';
    const leadTitle = lead.title;
    const stage = lead.stage;

    // Build context for AI
    const recentActivities = lead.activities
      .map((a: any) => `- ${a.type}: ${a.body.substring(0, 100)}`)
      .join('\n');

    const websiteActivity = lead.leadActivities
      .filter((a: any) => a.activityType === 'page_view')
      .map((a: any) => a.pageUrl)
      .slice(0, 3)
      .join(', ');

    // Determine tone based on stage
    const tone = this.getToneForStage(stage);

    // Build prompt
    const prompt = `Generate a professional sales email for the following lead:

Lead Information:
- Contact Name: ${contactName}
- Company: ${companyName}
- Lead Title: ${leadTitle}
- Current Stage: ${stage}
- Email Type: ${context.emailType || 'follow-up'}

Recent Activity:
${recentActivities || 'No recent activity'}

${websiteActivity ? `Pages Visited: ${websiteActivity}` : ''}

${context.customInstructions ? `Additional Instructions: ${context.customInstructions}` : ''}

Requirements:
- Tone: ${tone}
- Maximum 200 words
- Include clear call-to-action
- Personalize based on activity
- Professional and concise
- Do not use placeholder text

Generate the email in this format:
SUBJECT: [subject line]
BODY: [email body]`;

    const systemPrompt = `You are a professional sales email writer for a CRM system. Write personalized, effective emails that drive engagement. Keep emails concise, professional, and action-oriented. Never use placeholder text like [Company Name] - use the actual information provided.`;

    // Call OpenAI
    const response = await openAIProvider.generateCompletion({
      prompt,
      systemPrompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    // Parse response
    const { subject, body } = this.parseEmailResponse(response.content);

    return { subject, body };
  }

  private getToneForStage(stage: LeadStage): string {
    switch (stage) {
      case 'NEW':
        return 'friendly and introductory';
      case 'CONTACTED':
        return 'professional and engaging';
      case 'QUALIFIED':
        return 'professional and solution-focused';
      case 'PROPOSAL_SENT':
        return 'professional and follow-up oriented';
      default:
        return 'professional';
    }
  }

  private parseEmailResponse(content: string): { subject: string; body: string } {
    const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i);

    const subject = subjectMatch?.[1]?.trim() || 'Follow up';
    const body = bodyMatch?.[1]?.trim() || content;

    return { subject, body };
  }

  getConfig() {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.SUGGEST_APPROVE,
      priority: 'MEDIUM' as const,
    };
  }
}
```

### 5. Next Best Action Agent

```typescript
// apps/vyntrize-crm/lib/agents/next-best-action-agent.ts

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult } from './base-agent';
import { openAIProvider } from './openai-provider';
import { prisma } from '@/lib/prisma';

interface RecommendedAction {
  action: string;
  reasoning: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  urgency: 'IMMEDIATE' | 'SOON' | 'NORMAL';
}

export class NextBestActionAgent extends Agent {
  constructor() {
    super(AgentType.NEXT_BEST_ACTION);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!context.leadId) {
      return {
        success: false,
        error: 'Lead ID required',
        reasoning: 'Cannot recommend actions without lead ID',
      };
    }

    try {
      // Fetch comprehensive lead data
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: {
          contact: true,
          company: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          leadTasks: {
            where: {
              status: {
                in: ['PENDING', 'IN_PROGRESS'],
              },
            },
          },
          emailTracking: {
            orderBy: { sentAt: 'desc' },
            take: 5,
          },
          leadActivities: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
          reasoning: 'Lead does not exist',
        };
      }

      // Generate recommendations using AI
      const recommendations = await this.generateRecommendations(lead);

      // Record action (COPILOT mode - suggestions only)
      const reasoning = `Generated ${recommendations.length} recommended actions for lead`;
      const actionId = await this.recordAction(
        ActionType.ALERT,
        lead.id,
        reasoning,
        AutonomyLevel.COPILOT,
        {
          recommendations,
        }
      );

      this.log('info', 'Recommendations generated', {
        leadId: lead.id,
        count: recommendations.length,
      });

      return {
        success: true,
        actionId,
        reasoning,
        metadata: {
          recommendations,
        },
      };
    } catch (error) {
      this.log('error', 'Failed to generate recommendations', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Error during recommendation generation',
      };
    }
  }

  private async generateRecommendations(lead: any): Promise<RecommendedAction[]> {
    // Build context
    const daysSinceLastContact = this.calculateDaysSinceLastContact(lead);
    const emailEngagement = this.calculateEmailEngagement(lead);
    const websiteEngagement = this.calculateWebsiteEngagement(lead);
    const pendingTasks = lead.leadTasks.length;

    const context = `
Lead Analysis:
- Name: ${lead.contact.firstName} ${lead.contact.lastName}
- Company: ${lead.company?.name || 'Unknown'}
- Stage: ${lead.stage}
- Score: ${lead.score}/100
- Qualification: ${lead.qualificationStatus}
- Days since last contact: ${daysSinceLastContact}
- Email engagement: ${emailEngagement}
- Website engagement: ${websiteEngagement}
- Pending tasks: ${pendingTasks}

Recent Activities:
${lead.activities.slice(0, 5).map((a: any) => `- ${a.type}: ${a.body.substring(0, 100)}`).join('\n')}

Recent Email Activity:
${lead.emailTracking.slice(0, 3).map((e: any) => 
  `- Sent: ${e.subject} (${e.openedAt ? 'Opened' : 'Not opened'})`
).join('\n')}
`;

    const prompt = `Based on the following lead information, recommend 1-3 specific next actions to move this lead forward in the sales process.

${context}

For each recommendation, provide:
1. The specific action to take
2. Clear reasoning why this action is recommended
3. Priority (HIGH/MEDIUM/LOW)
4. Urgency (IMMEDIATE/SOON/NORMAL)

Format your response as JSON array:
[
  {
    "action": "specific action description",
    "reasoning": "why this action is recommended",
    "priority": "HIGH|MEDIUM|LOW",
    "urgency": "IMMEDIATE|SOON|NORMAL"
  }
]`;

    const systemPrompt = `You are a sales strategy AI assistant. Analyze lead data and recommend specific, actionable next steps to advance the sales process. Focus on practical actions that sales reps can execute immediately.`;

    const response = await openAIProvider.generateCompletion({
      prompt,
      systemPrompt,
      maxTokens: 600,
      temperature: 0.7,
    });

    // Parse JSON response
    try {
      const recommendations = JSON.parse(response.content);
      return recommendations.slice(0, 3); // Max 3 recommendations
    } catch (error) {
      // Fallback to rule-based recommendations
      return this.generateRuleBasedRecommendations(lead, daysSinceLastContact, emailEngagement);
    }
  }

  private calculateDaysSinceLastContact(lead: any): number {
    const lastActivity = lead.activities[0];
    if (!lastActivity) {
      return Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (24 * 60 * 60 * 1000));
    }
    return Math.floor((Date.now() - new Date(lastActivity.createdAt).getTime()) / (24 * 60 * 60 * 1000));
  }

  private calculateEmailEngagement(lead: any): string {
    const recentEmails = lead.emailTracking.slice(0, 5);
    if (recentEmails.length === 0) return 'No emails sent';

    const opened = recentEmails.filter((e: any) => e.openedAt).length;
    const clicked = recentEmails.filter((e: any) => e.clickedAt).length;

    if (clicked > 0) return 'High (clicking links)';
    if (opened >= recentEmails.length * 0.6) return 'Good (opening emails)';
    if (opened > 0) return 'Low (some opens)';
    return 'None (not opening)';
  }

  private calculateWebsiteEngagement(lead: any): string {
    const recentVisits = lead.leadActivities.filter(
      (a: any) => a.activityType === 'page_view'
    );
    
    if (recentVisits.length === 0) return 'No visits';
    if (recentVisits.length >= 10) return 'High';
    if (recentVisits.length >= 5) return 'Medium';
    return 'Low';
  }

  private generateRuleBasedRecommendations(
    lead: any,
    daysSinceLastContact: number,
    emailEngagement: string
  ): RecommendedAction[] {
    const recommendations: RecommendedAction[] = [];

    // Rule 1: Follow up if no contact recently
    if (daysSinceLastContact > 7) {
      recommendations.push({
        action: 'Send follow-up email',
        reasoning: `It's been ${daysSinceLastContact} days since last contact. Re-engage the lead.`,
        priority: 'HIGH',
        urgency: 'SOON',
      });
    }

    // Rule 2: Call if high engagement
    if (emailEngagement.includes('High') || emailEngagement.includes('Good')) {
      recommendations.push({
        action: 'Schedule discovery call',
        reasoning: 'Lead is engaged with emails. Time to have a conversation.',
        priority: 'HIGH',
        urgency: 'IMMEDIATE',
      });
    }

    // Rule 3: Move to next stage if qualified
    if (lead.qualificationStatus === 'qualified' && lead.stage === 'CONTACTED') {
      recommendations.push({
        action: 'Move to QUALIFIED stage',
        reasoning: 'Lead score indicates qualification. Advance to next stage.',
        priority: 'MEDIUM',
        urgency: 'NORMAL',
      });
    }

    return recommendations.slice(0, 3);
  }

  getConfig() {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.COPILOT,
      priority: 'LOW' as const,
    };
  }
}
```


## Database Schema

### Prisma Schema Extensions

Add the following to `packages/@platform/vyntrize-db/prisma/schema.prisma`:

```prisma
// ─── AI Agent System ──────────────────────────────────────────────────────────

model AgentAction {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  agentType     AgentType
  actionType    ActionType
  leadId        String
  lead          Lead       @relation(fields: [leadId], references: [id], onDelete: Cascade)

  reasoning     String     @db.Text
  status        ActionStatus @default(PENDING)
  autonomyLevel AutonomyLevel

  // Approval workflow
  approvedBy    String?
  approvedByUser CrmUser?  @relation(fields: [approvedBy], references: [id], name: "AgentActionApprover")
  approvedAt    DateTime?
  rejectedReason String?   @db.Text

  // Execution
  executedAt    DateTime?
  executionError String?   @db.Text

  // Metadata (JSON for flexibility)
  metadata      Json?

  @@index([leadId])
  @@index([agentType])
  @@index([status])
  @@index([createdAt])
  @@map("agent_actions")
}

model AgentRule {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  agentType     AgentType
  ruleName      String
  ruleConfig    Json      // Configuration specific to the rule
  autonomyLevel AutonomyLevel
  isActive      Boolean   @default(true)
  priority      Int       @default(5)

  @@unique([agentType, ruleName])
  @@index([agentType])
  @@index([isActive])
  @@map("agent_rules")
}

model AgentMetric {
  id           Int      @id @default(autoincrement())
  calculatedAt DateTime @default(now())

  agentType    AgentType
  metricName   String
  metricValue  Float
  metadata     Json?

  @@index([agentType])
  @@index([metricName])
  @@index([calculatedAt])
  @@map("agent_metrics")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum AgentType {
  LEAD_SCORING
  TASK_AUTOMATION
  STAGNATION_DETECTION
  EMAIL_GENERATION
  NEXT_BEST_ACTION
  PREDICTIVE_ANALYTICS
  STAGE_PROGRESSION
  DRIP_CAMPAIGN
  REVENUE_FORECASTING
  OPENAI_PROVIDER
}

enum ActionType {
  SCORE_UPDATE
  TASK_CREATE
  EMAIL_SEND
  STAGE_CHANGE
  ALERT
  PREDICTION_UPDATE
}

enum ActionStatus {
  PENDING
  APPROVED
  REJECTED
  EXECUTED
  FAILED
}

enum AutonomyLevel {
  FULLY_AUTONOMOUS
  SUGGEST_APPROVE
  COPILOT
}
```

### Schema Relationships

```mermaid
erDiagram
    Lead ||--o{ AgentAction : "has"
    CrmUser ||--o{ AgentAction : "approves"
    AgentAction {
        string id PK
        AgentType agentType
        ActionType actionType
        string leadId FK
        string reasoning
        ActionStatus status
        AutonomyLevel autonomyLevel
        string approvedBy FK
        datetime approvedAt
        datetime executedAt
        json metadata
    }
    
    AgentRule {
        int id PK
        AgentType agentType
        string ruleName
        json ruleConfig
        AutonomyLevel autonomyLevel
        boolean isActive
        int priority
    }
    
    AgentMetric {
        int id PK
        AgentType agentType
        string metricName
        float metricValue
        datetime calculatedAt
        json metadata
    }
```

### Migration Script

```sql
-- Add agent_actions table
CREATE TABLE agent_actions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    agent_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    reasoning TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    autonomy_level TEXT NOT NULL,
    approved_by TEXT REFERENCES crm_users(id),
    approved_at TIMESTAMP,
    rejected_reason TEXT,
    executed_at TIMESTAMP,
    execution_error TEXT,
    metadata JSONB
);

CREATE INDEX idx_agent_actions_lead_id ON agent_actions(lead_id);
CREATE INDEX idx_agent_actions_agent_type ON agent_actions(agent_type);
CREATE INDEX idx_agent_actions_status ON agent_actions(status);
CREATE INDEX idx_agent_actions_created_at ON agent_actions(created_at);

-- Add agent_rules table
CREATE TABLE agent_rules (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    agent_type TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    rule_config JSONB NOT NULL,
    autonomy_level TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 5,
    UNIQUE(agent_type, rule_name)
);

CREATE INDEX idx_agent_rules_agent_type ON agent_rules(agent_type);
CREATE INDEX idx_agent_rules_is_active ON agent_rules(is_active);

-- Add agent_metrics table
CREATE TABLE agent_metrics (
    id SERIAL PRIMARY KEY,
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    agent_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metadata JSONB
);

CREATE INDEX idx_agent_metrics_agent_type ON agent_metrics(agent_type);
CREATE INDEX idx_agent_metrics_metric_name ON agent_metrics(metric_name);
CREATE INDEX idx_agent_metrics_calculated_at ON agent_metrics(calculated_at);

-- Update Lead table to add agent-related fields (if not already present)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS qualification_status TEXT DEFAULT 'new';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_leads_score ON crm_leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_status ON crm_leads(qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity_at ON crm_leads(last_activity_at);
```

## API Design

### Agent Management API

#### GET /api/agents/actions
Get list of agent actions with filtering

**Query Parameters:**
- `leadId` (optional): Filter by lead
- `agentType` (optional): Filter by agent type
- `status` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```typescript
{
  actions: Array<{
    id: string;
    agentType: string;
    actionType: string;
    leadId: string;
    leadTitle: string;
    contactName: string;
    reasoning: string;
    status: string;
    autonomyLevel: string;
    approvedBy?: string;
    approvedAt?: string;
    executedAt?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Implementation:**
```typescript
// apps/vyntrize-crm/app/api/agents/actions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const agentType = searchParams.get('agentType');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (agentType) where.agentType = agentType;
    if (status) where.status = status;

    const [actions, total] = await Promise.all([
      prisma.agentAction.findMany({
        where,
        include: {
          lead: {
            include: {
              contact: true,
            },
          },
          approvedByUser: {
            select: {
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agentAction.count({ where }),
    ]);

    const formattedActions = actions.map(action => ({
      id: action.id,
      agentType: action.agentType,
      actionType: action.actionType,
      leadId: action.leadId,
      leadTitle: action.lead.title,
      contactName: `${action.lead.contact.firstName} ${action.lead.contact.lastName}`,
      reasoning: action.reasoning,
      status: action.status,
      autonomyLevel: action.autonomyLevel,
      approvedBy: action.approvedByUser?.displayName,
      approvedAt: action.approvedAt?.toISOString(),
      executedAt: action.executedAt?.toISOString(),
      metadata: action.metadata,
      createdAt: action.createdAt.toISOString(),
    }));

    return NextResponse.json({
      actions: formattedActions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching agent actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent actions' },
      { status: 500 }
    );
  }
}
```

#### POST /api/agents/actions/:actionId/approve
Approve a pending agent action

**Request Body:**
```typescript
{
  // No body required
}
```

**Response:**
```typescript
{
  success: boolean;
  action: {
    id: string;
    status: string;
    approvedBy: string;
    approvedAt: string;
    executedAt?: string;
  };
}
```

**Implementation:**
```typescript
// apps/vyntrize-crm/app/api/agents/actions/[actionId]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionId } = await params;

    // Fetch action
    const action = await prisma.agentAction.findUnique({
      where: { id: actionId },
      include: { lead: true },
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (action.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Action is not pending approval' },
        { status: 400 }
      );
    }

    // Update action status
    const updatedAction = await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: 'APPROVED',
        approvedBy: session.userId,
        approvedAt: new Date(),
      },
    });

    // Execute the action based on type
    await executeApprovedAction(updatedAction);

    return NextResponse.json({
      success: true,
      action: {
        id: updatedAction.id,
        status: updatedAction.status,
        approvedBy: session.userId,
        approvedAt: updatedAction.approvedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] Error approving action:', error);
    return NextResponse.json(
      { error: 'Failed to approve action' },
      { status: 500 }
    );
  }
}

async function executeApprovedAction(action: any) {
  try {
    switch (action.actionType) {
      case 'EMAIL_SEND':
        await executeEmailSend(action);
        break;
      case 'STAGE_CHANGE':
        await executeStageChange(action);
        break;
      case 'TASK_CREATE':
        // Task already created, just mark as executed
        await prisma.agentAction.update({
          where: { id: action.id },
          data: {
            status: 'EXECUTED',
            executedAt: new Date(),
          },
        });
        break;
      default:
        console.warn(`No execution handler for action type: ${action.actionType}`);
    }
  } catch (error) {
    console.error('[API] Error executing approved action:', error);
    await prisma.agentAction.update({
      where: { id: action.id },
      data: {
        status: 'FAILED',
        executionError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

async function executeEmailSend(action: any) {
  const { emailService } = await import('@/lib/email/email-service');
  const metadata = action.metadata as any;

  const result = await emailService.sendEmail({
    to: metadata.recipientEmail,
    toName: metadata.recipientName,
    subject: metadata.subject,
    html: metadata.body,
    trackingId: `agent-${action.id}`,
  });

  if (result.success) {
    await prisma.agentAction.update({
      where: { id: action.id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
      },
    });
  } else {
    throw new Error(result.error || 'Email send failed');
  }
}

async function executeStageChange(action: any) {
  const metadata = action.metadata as any;

  await prisma.lead.update({
    where: { id: action.leadId },
    data: {
      stage: metadata.newStage,
    },
  });

  await prisma.agentAction.update({
    where: { id: action.id },
    data: {
      status: 'EXECUTED',
      executedAt: new Date(),
    },
  });

  // Emit stage_changed event
  await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
    leadId: action.leadId,
    previousValue: metadata.previousStage,
    newValue: metadata.newStage,
  });
}
```

#### POST /api/agents/actions/:actionId/reject
Reject a pending agent action

**Request Body:**
```typescript
{
  reason: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  action: {
    id: string;
    status: string;
    rejectedReason: string;
  };
}
```

#### GET /api/agents/metrics
Get agent performance metrics

**Query Parameters:**
- `agentType` (optional): Filter by agent type
- `startDate` (optional): Start date for metrics
- `endDate` (optional): End date for metrics

**Response:**
```typescript
{
  metrics: Array<{
    agentType: string;
    totalActions: number;
    executedActions: number;
    pendingActions: number;
    failedActions: number;
    approvalRate: number;
    avgExecutionTime: number;
    customMetrics: Record<string, number>;
  }>;
}
```

#### POST /api/agents/trigger
Manually trigger an agent for a specific lead

**Request Body:**
```typescript
{
  agentType: string;
  leadId: string;
  context?: Record<string, unknown>;
}
```

**Response:**
```typescript
{
  success: boolean;
  actionId?: string;
  reasoning: string;
}
```

#### GET /api/agents/health
Get agent system health status

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'down';
  agents: Array<{
    agentType: string;
    enabled: boolean;
    lastExecution?: string;
    errorRate: number;
  }>;
  jobQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  openai: {
    circuitOpen: boolean;
    failureCount: number;
    tokenUsageThisMinute: number;
  };
}
```


## Error Handling

### Error Types

```typescript
// apps/vyntrize-crm/lib/agents/errors.ts

export class AgentError extends Error {
  constructor(
    message: string,
    public agentType: string,
    public leadId?: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number // milliseconds
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public resetTime: number // timestamp
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}
```

### Retry Logic

```typescript
// apps/vyntrize-crm/lib/agents/retry.ts

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetry: (error: Error) => boolean = () => true
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (!shouldRetry(lastError) || attempt === config.maxAttempts) {
        throw lastError;
      }

      // Log retry attempt
      console.warn(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message,
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError!;
}
```

### Circuit Breaker Pattern

```typescript
// apps/vyntrize-crm/lib/agents/circuit-breaker.ts

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds
  resetTimeout: number; // milliseconds
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitBreakerError(
          'Circuit breaker is OPEN',
          this.nextAttempt
        );
      }
      // Try to recover
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await Promise.race([
        fn(),
        this.timeout(),
      ]);

      this.onSuccess();
      return result as T;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log('[CircuitBreaker] Circuit CLOSED (recovered)');
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeout;
      console.error('[CircuitBreaker] Circuit OPEN (too many failures)');
    }
  }

  private timeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Circuit breaker timeout'));
      }, this.config.timeout);
    });
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

### Error Handling Strategy

| Error Type | Retry | Circuit Breaker | Fallback | User Notification |
|------------|-------|-----------------|----------|-------------------|
| Network Error | Yes (3x) | Yes | Use cached data | No |
| OpenAI Rate Limit | Yes (wait) | No | Queue for later | No |
| OpenAI API Error | Yes (3x) | Yes | Rule-based fallback | Yes (if critical) |
| Database Error | Yes (3x) | No | Fail gracefully | Yes |
| Validation Error | No | No | Log and skip | Yes |
| Agent Logic Error | No | No | Log and continue | Yes (if SUGGEST_APPROVE) |

## Testing Strategy

### Unit Tests

```typescript
// apps/vyntrize-crm/lib/agents/__tests__/lead-scoring-agent.test.ts

import { LeadScoringAgent } from '../lead-scoring-agent';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    agentAction: {
      create: jest.fn(),
    },
  },
}));

describe('LeadScoringAgent', () => {
  let agent: LeadScoringAgent;

  beforeEach(() => {
    agent = new LeadScoringAgent();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should calculate score based on email opens', async () => {
      const mockLead = {
        id: 'lead-1',
        score: 50,
        emailTracking: [
          { openedAt: new Date() },
          { openedAt: new Date() },
        ],
        leadTasks: [],
        leadActivities: [],
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead);
      (prisma.lead.update as jest.Mock).mockResolvedValue({ ...mockLead, score: 70 });
      (prisma.agentAction.create as jest.Mock).mockResolvedValue({ id: 'action-1' });

      const result = await agent.execute({ leadId: 'lead-1' });

      expect(result.success).toBe(true);
      expect(result.metadata?.score).toBe(70); // 50 base + 2 opens * 10
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: expect.objectContaining({
          score: 70,
        }),
      });
    });

    it('should decrease score for inactivity', async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const mockLead = {
        id: 'lead-1',
        score: 50,
        emailTracking: [],
        leadTasks: [],
        leadActivities: [],
        createdAt: tenDaysAgo,
        lastActivityAt: tenDaysAgo,
      };

      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead);
      (prisma.lead.update as jest.Mock).mockResolvedValue({ ...mockLead, score: 0 });
      (prisma.agentAction.create as jest.Mock).mockResolvedValue({ id: 'action-1' });

      const result = await agent.execute({ leadId: 'lead-1' });

      expect(result.success).toBe(true);
      expect(result.metadata?.score).toBeLessThan(50);
    });

    it('should set qualification status to qualified when score >= 70', async () => {
      const mockLead = {
        id: 'lead-1',
        score: 50,
        emailTracking: [
          { openedAt: new Date(), clickedAt: new Date() },
          { openedAt: new Date(), clickedAt: new Date() },
        ],
        leadTasks: [],
        leadActivities: [],
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead);
      (prisma.lead.update as jest.Mock).mockResolvedValue({ ...mockLead, score: 80 });
      (prisma.agentAction.create as jest.Mock).mockResolvedValue({ id: 'action-1' });

      const result = await agent.execute({ leadId: 'lead-1' });

      expect(result.success).toBe(true);
      expect(result.metadata?.qualificationStatus).toBe('qualified');
    });
  });
});
```

### Integration Tests

```typescript
// apps/vyntrize-crm/lib/agents/__tests__/event-bus.integration.test.ts

import { eventBus, CRMEvent } from '../event-bus';
import { LeadScoringAgent } from '../lead-scoring-agent';
import { TaskAutomationAgent } from '../task-automation-agent';
import { prisma } from '@/lib/prisma';

describe('Event Bus Integration', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should notify multiple agents on stage_changed event', async () => {
    const scoringAgent = new LeadScoringAgent();
    const taskAgent = new TaskAutomationAgent();

    eventBus.registerAgent(CRMEvent.STAGE_CHANGED, scoringAgent);
    eventBus.registerAgent(CRMEvent.STAGE_CHANGED, taskAgent);

    // Create test lead
    const lead = await prisma.lead.create({
      data: {
        title: 'Test Lead',
        stage: 'NEW',
        contactId: 'test-contact-id',
      },
    });

    // Emit event
    await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
      leadId: lead.id,
      previousValue: 'NEW',
      newValue: 'CONTACTED',
    });

    // Verify both agents executed
    const actions = await prisma.agentAction.findMany({
      where: { leadId: lead.id },
    });

    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.some(a => a.agentType === 'LEAD_SCORING')).toBe(true);
    expect(actions.some(a => a.agentType === 'TASK_AUTOMATION')).toBe(true);

    // Cleanup
    await prisma.lead.delete({ where: { id: lead.id } });
  });
});
```

### Property-Based Tests

Property-based testing is NOT applicable for this feature because:

1. **Infrastructure as Code**: The agent system is primarily infrastructure and orchestration code, not pure functions with universal properties
2. **External Dependencies**: Agents interact with databases, APIs, and external services, making them unsuitable for property-based testing
3. **Side Effects**: Agent actions have side effects (creating tasks, sending emails, updating database) that cannot be easily verified through properties

Instead, we use:
- **Unit tests** for individual agent logic with mocked dependencies
- **Integration tests** for end-to-end workflows with test database
- **Mock-based tests** for OpenAI integration
- **Snapshot tests** for agent configuration and rule validation

### Test Coverage Requirements

- Minimum 80% code coverage for all agent implementations
- 100% coverage for critical paths (scoring calculation, task creation, email generation)
- Integration tests for all event-driven workflows
- Performance tests for batch job execution (1000 leads in < 5 minutes)

## Security Architecture

### Authentication & Authorization

```typescript
// apps/vyntrize-crm/lib/agents/auth.ts

export async function requireAgentAccess(session: any): Promise<void> {
  if (!session.isLoggedIn) {
    throw new Error('Authentication required');
  }

  // Only ADMIN users can access agent configuration
  if (session.role !== 'ADMIN') {
    throw new Error('Admin access required for agent configuration');
  }
}

export async function requireAgentApproval(session: any, action: any): Promise<void> {
  if (!session.isLoggedIn) {
    throw new Error('Authentication required');
  }

  // Users can only approve actions for leads they have access to
  const lead = await prisma.lead.findUnique({
    where: { id: action.leadId },
    include: { assignee: true },
  });

  if (!lead) {
    throw new Error('Lead not found');
  }

  // ADMIN can approve any action
  if (session.role === 'ADMIN') {
    return;
  }

  // Users can approve actions for their assigned leads
  if (lead.assigneeId === session.userId) {
    return;
  }

  throw new Error('Unauthorized to approve this action');
}
```

### Input Validation & Sanitization

```typescript
// apps/vyntrize-crm/lib/agents/validation.ts

import { z } from 'zod';

export const AgentContextSchema = z.object({
  leadId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  eventData: z.record(z.unknown()).optional(),
});

export const EmailGenerationContextSchema = z.object({
  leadId: z.string().cuid(),
  emailType: z.enum(['introduction', 'follow_up', 'proposal', 'check_in']).optional(),
  customInstructions: z.string().max(500).optional(),
});

export function validateAgentContext(context: unknown) {
  return AgentContextSchema.parse(context);
}

export function sanitizePromptInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/\[INST\]/gi, '') // Remove instruction markers
    .replace(/\[\/INST\]/gi, '')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    .trim()
    .slice(0, 4000); // Limit length
}
```

### Rate Limiting

```typescript
// apps/vyntrize-crm/lib/agents/rate-limiter.ts

import { Redis } from 'ioredis';

export class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async checkLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count current entries
    const current = await this.redis.zcard(key);

    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }

    // Add new entry
    await this.redis.zadd(key, now, `${now}`);
    await this.redis.expire(key, windowSeconds);

    return { allowed: true, remaining: limit - current - 1 };
  }
}

// Usage in API routes
export async function checkAgentAPIRateLimit(userId: string): Promise<void> {
  const limiter = new RateLimiter();
  const result = await limiter.checkLimit(
    `agent-api:${userId}`,
    100, // 100 requests
    60   // per minute
  );

  if (!result.allowed) {
    throw new Error('Rate limit exceeded');
  }
}
```

### Data Protection

- **Encryption at Rest**: OpenAI API keys encrypted using AES-256
- **Encryption in Transit**: All external API calls use HTTPS
- **PII Handling**: Email content and contact data sanitized before logging
- **GDPR Compliance**: Agent data deletion when lead is deleted (CASCADE)
- **Audit Trail**: All agent actions logged with user attribution

## Performance Optimization

### Caching Strategy

```typescript
// apps/vyntrize-crm/lib/agents/cache.ts

import { Redis } from 'ioredis';

export class AgentCache {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Cache keys
export const CacheKeys = {
  agentRules: (agentType: string) => `agent:rules:${agentType}`,
  leadScore: (leadId: string) => `lead:score:${leadId}`,
  nextBestAction: (leadId: string) => `lead:next-action:${leadId}`,
  openaiResponse: (promptHash: string) => `openai:response:${promptHash}`,
};
```

### Database Optimization

```sql
-- Indexes for agent queries
CREATE INDEX CONCURRENTLY idx_leads_active_scoring 
ON crm_leads(stage, last_activity_at) 
WHERE stage IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT');

CREATE INDEX CONCURRENTLY idx_agent_actions_pending_approval
ON agent_actions(status, created_at)
WHERE status = 'PENDING';

CREATE INDEX CONCURRENTLY idx_email_tracking_recent
ON email_tracking(lead_id, sent_at DESC)
WHERE sent_at > NOW() - INTERVAL '7 days';

-- Materialized view for agent metrics
CREATE MATERIALIZED VIEW agent_metrics_summary AS
SELECT 
  agent_type,
  DATE(created_at) as metric_date,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE status = 'EXECUTED') as executed_actions,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed_actions,
  AVG(EXTRACT(EPOCH FROM (executed_at - created_at))) as avg_execution_time_seconds
FROM agent_actions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY agent_type, DATE(created_at);

CREATE UNIQUE INDEX ON agent_metrics_summary(agent_type, metric_date);

-- Refresh materialized view daily
-- (Add to cron job or scheduled task)
```

### Batch Processing

```typescript
// apps/vyntrize-crm/lib/agents/batch-processor.ts

export class BatchProcessor {
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 50,
    concurrency: number = 5
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch with concurrency limit
      const batchResults = await this.processWithConcurrency(
        batch,
        processor,
        concurrency
      );
      
      results.push(...batchResults);

      // Log progress
      console.log(`[BatchProcessor] Processed ${Math.min(i + batchSize, items.length)}/${items.length} items`);
    }

    return results;
  }

  private async processWithConcurrency<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = processor(item).then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }
}
```

## Monitoring & Observability

### Prometheus Metrics

```typescript
// apps/vyntrize-crm/lib/agents/metrics.ts

import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// Agent execution metrics
export const agentExecutionCounter = new Counter({
  name: 'agent_executions_total',
  help: 'Total number of agent executions',
  labelNames: ['agent_type', 'status'],
  registers: [register],
});

export const agentExecutionDuration = new Histogram({
  name: 'agent_execution_duration_seconds',
  help: 'Agent execution duration in seconds',
  labelNames: ['agent_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Job queue metrics
export const jobQueueDepth = new Gauge({
  name: 'agent_job_queue_depth',
  help: 'Number of jobs in queue',
  labelNames: ['status'],
  registers: [register],
});

// OpenAI metrics
export const openaiRequestCounter = new Counter({
  name: 'openai_requests_total',
  help: 'Total number of OpenAI API requests',
  labelNames: ['status'],
  registers: [register],
});

export const openaiTokenUsage = new Counter({
  name: 'openai_tokens_used_total',
  help: 'Total number of OpenAI tokens used',
  registers: [register],
});

// Metrics endpoint
// apps/vyntrize-crm/app/api/agents/metrics/route.ts
import { NextResponse } from 'next/server';
import { register } from '@/lib/agents/metrics';

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  });
}
```

### Logging

```typescript
// apps/vyntrize-crm/lib/agents/logger.ts

import winston from 'winston';

export const agentLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'agent-system' },
  transports: [
    new winston.transports.File({ filename: 'logs/agent-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/agent-combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  agentLogger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Usage
agentLogger.info('Agent executed', {
  agentType: 'LEAD_SCORING',
  leadId: 'lead-123',
  duration: 250,
  score: 75,
});
```


## Deployment Architecture

### Service Topology

```mermaid
graph TB
    subgraph "Application Layer"
        NextJS[Next.js App<br/>CRM + Agent Dashboard]
    end
    
    subgraph "Agent Layer"
        EventBus[Event Bus]
        Workers[BullMQ Workers<br/>x3 instances]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Primary Database)]
        Redis[(Redis<br/>Job Queue + Cache)]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
        SMTP[SMTP Server]
    end
    
    subgraph "Monitoring"
        Prometheus[Prometheus]
        Grafana[Grafana]
    end
    
    NextJS --> EventBus
    NextJS --> PostgreSQL
    EventBus --> Workers
    Workers --> PostgreSQL
    Workers --> Redis
    Workers --> OpenAI
    Workers --> SMTP
    NextJS --> Redis
    
    Prometheus --> NextJS
    Prometheus --> Workers
    Grafana --> Prometheus
    
    style NextJS fill:#4a90e2
    style Workers fill:#f5a623
    style PostgreSQL fill:#50e3c2
    style Redis fill:#d0021b
```

### Scaling Strategy

#### Horizontal Scaling

```yaml
# docker-compose.yml (production)
version: '3.8'

services:
  crm-app:
    image: vyntrize-crm:latest
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/vyntrize_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - postgres
      - redis

  agent-worker-1:
    image: vyntrize-crm:latest
    command: node dist/workers/agent-worker.js
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/vyntrize_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - WORKER_CONCURRENCY=5
    depends_on:
      - postgres
      - redis

  agent-worker-2:
    image: vyntrize-crm:latest
    command: node dist/workers/agent-worker.js
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/vyntrize_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - WORKER_CONCURRENCY=5
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=vyntrize_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

volumes:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:
```

#### Worker Process

```typescript
// apps/vyntrize-crm/workers/agent-worker.ts

import { jobScheduler } from '@/lib/agents/job-scheduler';
import { LeadScoringAgent } from '@/lib/agents/lead-scoring-agent';
import { TaskAutomationAgent } from '@/lib/agents/task-automation-agent';
import { StagnationDetectionAgent } from '@/lib/agents/stagnation-detection-agent';
import { EmailGenerationAgent } from '@/lib/agents/email-generation-agent';
import { NextBestActionAgent } from '@/lib/agents/next-best-action-agent';

async function main() {
  console.log('[Worker] Starting agent worker...');

  // Register agents
  jobScheduler.registerAgent(new LeadScoringAgent());
  jobScheduler.registerAgent(new TaskAutomationAgent());
  jobScheduler.registerAgent(new StagnationDetectionAgent());
  jobScheduler.registerAgent(new EmailGenerationAgent());
  jobScheduler.registerAgent(new NextBestActionAgent());

  // Schedule recurring jobs
  await jobScheduler.scheduleRecurringJob(
    'LeadScoringAgent',
    '0 0 * * *', // Daily at midnight
    {}
  );

  await jobScheduler.scheduleRecurringJob(
    'StagnationDetectionAgent',
    '0 0 * * *', // Daily at midnight
    {}
  );

  console.log('[Worker] Agent worker started successfully');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Worker] Received SIGTERM, shutting down gracefully...');
    await jobScheduler.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[Worker] Received SIGINT, shutting down gracefully...');
    await jobScheduler.close();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
```

### Infrastructure Requirements

#### Minimum Requirements (Development)
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **PostgreSQL**: 1 instance
- **Redis**: 1 instance

#### Recommended Requirements (Production - 1000 leads)
- **Application Servers**: 2 instances (1 CPU, 1 GB RAM each)
- **Worker Processes**: 3 instances (0.5 CPU, 512 MB RAM each)
- **PostgreSQL**: 1 instance (2 CPU, 2 GB RAM, 50 GB SSD)
- **Redis**: 1 instance (0.5 CPU, 512 MB RAM, 10 GB SSD)
- **Total**: ~5 CPU cores, 6 GB RAM, 60 GB storage

#### Scaling Guidelines

| Leads | App Instances | Workers | PostgreSQL | Redis |
|-------|---------------|---------|------------|-------|
| 0-500 | 1 | 1 | 1 CPU, 1 GB | 256 MB |
| 500-1000 | 2 | 2 | 2 CPU, 2 GB | 512 MB |
| 1000-5000 | 3 | 4 | 4 CPU, 4 GB | 1 GB |
| 5000-10000 | 4 | 6 | 8 CPU, 8 GB | 2 GB |

### Environment Variables

```bash
# .env.production

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/vyntrize_db
DATABASE_POOL_SIZE=20

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_RATE_LIMIT_TPM=10000

# Agent Configuration
AGENT_LEAD_SCORING_ENABLED=true
AGENT_TASK_AUTOMATION_ENABLED=true
AGENT_STAGNATION_DETECTION_ENABLED=true
AGENT_EMAIL_GENERATION_ENABLED=true
AGENT_NEXT_BEST_ACTION_ENABLED=true
AGENT_PREDICTIVE_ANALYTICS_ENABLED=false
AGENT_STAGE_PROGRESSION_ENABLED=false
AGENT_DRIP_CAMPAIGN_ENABLED=false
AGENT_REVENUE_FORECASTING_ENABLED=false

# Job Scheduler
AGENT_JOB_CONCURRENCY=5
AGENT_JOB_MAX_RETRIES=3

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@vyntrize.com
SMTP_PASSWORD=
EMAIL_FROM_ADDRESS=noreply@vyntrize.com
EMAIL_FROM_NAME=Vyntrize CRM

# Session
SESSION_SECRET=your-secret-key-here

# Monitoring
LOG_LEVEL=info
PROMETHEUS_ENABLED=true
```

## Agent Dashboard UI

### Dashboard Layout

```typescript
// apps/vyntrize-crm/app/(crm)/agents/page.tsx

import { Suspense } from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AgentDashboard } from '@/components/agents/AgentDashboard';

export default async function AgentsPage() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    redirect('/login');
  }

  // Only admins can access agent dashboard
  if (session.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to access the agent dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">AI Agent Dashboard</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <AgentDashboard />
      </Suspense>
    </div>
  );
}
```

### Dashboard Component

```typescript
// apps/vyntrize-crm/components/agents/AgentDashboard.tsx

'use client';

import { useState, useEffect } from 'react';
import { AgentMetrics } from './AgentMetrics';
import { PendingActions } from './PendingActions';
import { AgentConfiguration } from './AgentConfiguration';
import { AgentLogs } from './AgentLogs';

export function AgentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'config' | 'logs'>('overview');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Actions
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Logs
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <AgentMetrics />}
      {activeTab === 'pending' && <PendingActions />}
      {activeTab === 'config' && <AgentConfiguration />}
      {activeTab === 'logs' && <AgentLogs />}
    </div>
  );
}
```

### Pending Actions Component

```typescript
// apps/vyntrize-crm/components/agents/PendingActions.tsx

'use client';

import { useState, useEffect } from 'react';
import { Check, X, Eye } from 'lucide-react';

interface PendingAction {
  id: string;
  agentType: string;
  actionType: string;
  leadTitle: string;
  contactName: string;
  reasoning: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export function PendingActions() {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    fetchPendingActions();
  }, []);

  async function fetchPendingActions() {
    try {
      const response = await fetch('/api/agents/actions?status=PENDING');
      const data = await response.json();
      setActions(data.actions);
    } catch (error) {
      console.error('Failed to fetch pending actions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveAction(actionId: string) {
    try {
      const response = await fetch(`/api/agents/actions/${actionId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove from list
        setActions(actions.filter(a => a.id !== actionId));
        setSelectedAction(null);
      }
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  }

  async function rejectAction(actionId: string, reason: string) {
    try {
      const response = await fetch(`/api/agents/actions/${actionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        // Remove from list
        setActions(actions.filter(a => a.id !== actionId));
        setSelectedAction(null);
      }
    } catch (error) {
      console.error('Failed to reject action:', error);
    }
  }

  if (loading) {
    return <div>Loading pending actions...</div>;
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No pending actions requiring approval</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map(action => (
        <div key={action.id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {action.agentType}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                  {action.actionType}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1">{action.leadTitle}</h3>
              <p className="text-sm text-gray-600 mb-2">{action.contactName}</p>
              <p className="text-sm text-gray-700">{action.reasoning}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(action.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setSelectedAction(action)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="View Details"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                onClick={() => approveAction(action.id)}
                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded"
                title="Approve"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) rejectAction(action.id, reason);
                }}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded"
                title="Reject"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Show metadata if email generation */}
          {action.actionType === 'EMAIL_SEND' && action.metadata && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm font-semibold mb-1">Subject:</p>
              <p className="text-sm mb-2">{(action.metadata as any).subject}</p>
              <p className="text-sm font-semibold mb-1">Body:</p>
              <p className="text-sm whitespace-pre-wrap">{(action.metadata as any).body}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Database schema migration
- ✅ Base agent class and interfaces
- ✅ Event bus implementation
- ✅ Job scheduler with BullMQ
- ✅ OpenAI provider with rate limiting
- ✅ Lead Scoring Agent
- ✅ Task Automation Agent
- ✅ Stagnation Detection Agent

### Phase 2: AI-Powered Features (Week 3-4)
- ✅ Email Generation Agent
- ✅ Next Best Action Agent
- ✅ Predictive Analytics Agent (basic)
- ✅ Agent Dashboard UI
- ✅ API endpoints for agent management
- ✅ Approval workflow

### Phase 3: Advanced Features (Week 5-6)
- ⏳ Stage Progression Agent
- ⏳ Drip Campaign Agent
- ⏳ Revenue Forecasting Agent
- ⏳ Advanced analytics and reporting
- ⏳ A/B testing framework

### Phase 4: Production Readiness (Week 7-8)
- ⏳ Comprehensive testing (unit, integration, e2e)
- ⏳ Performance optimization
- ⏳ Security audit
- ⏳ Documentation completion
- ⏳ Monitoring and alerting setup
- ⏳ Production deployment

## Conclusion

The AI Pipeline Agent System provides a comprehensive, production-ready solution for automating sales pipeline management in the VyntRise CRM. The architecture is designed for scalability, reliability, and extensibility, with clear patterns for adding new agent types.

Key strengths:
- **Autonomous Operation**: Agents work 24/7 without manual intervention
- **Explainability**: Every action includes reasoning and audit trail
- **Flexibility**: Configurable autonomy levels for different risk profiles
- **Scalability**: Horizontal scaling with worker processes
- **Reliability**: Comprehensive error handling, retry logic, and circuit breakers
- **Security**: Input validation, rate limiting, and role-based access control

The system is ready for Phase 1 implementation, with clear paths for Phase 2 and Phase 3 enhancements.
