// Event Bus for dispatching CRM events to registered agents
// 
// Architecture:
//   When REDIS_URL is configured: events are pushed to a BullMQ queue (persistent,
//   retryable, race-condition-free). The agentWorker processes them in order.
//
//   When no Redis is available: falls back to the original in-memory dispatch
//   so the app still works during local development without Redis.

import { EventEmitter } from 'events';
import { Agent, AgentContext } from './base-agent';

export enum CRMEvent {
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  STAGE_CHANGED = 'stage_changed',
  EMAIL_OPENED = 'email_opened',
  EMAIL_CLICKED = 'email_clicked',
  EMAIL_REPLIED = 'email_replied',
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
  private useQueue: boolean = !!process.env.REDIS_URL;

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
   * Emit a CRM event.
   * 
   * If REDIS_URL is set: pushes to the BullMQ agent queue (persistent + retryable).
   * Otherwise: runs agents in-memory (useful for local dev without Redis).
   */
  async emitCRMEvent(event: CRMEvent, payload: EventPayload) {
    console.log(`[EventBus] Emitting ${event}`, { leadId: payload.leadId });

    if (this.useQueue) {
      // ── Queue-first path (production) ────────────────────────────────────
      try {
        const { enqueueAgentEvent } = await import('@/lib/queues/agentQueue');
        await enqueueAgentEvent(event, payload);
        console.log(`[EventBus] ✅ Queued ${event} to BullMQ`);
        return;
      } catch (err) {
        console.warn(`[EventBus] ⚠️ Failed to enqueue to BullMQ, falling back to in-memory:`, err);
        // Fall through to in-memory execution
      }
    }

    // ── In-memory fallback path (no Redis / local dev) ────────────────────
    await this._dispatchInMemory(event, payload);
  }

  /**
   * In-memory dispatch — runs agents directly.
   * Also called by the queue worker to actually execute agents.
   */
  async _dispatchInMemory(event: CRMEvent, payload: EventPayload) {
    const registeredAgents = this.agents.get(event) || [];
    console.log(`[EventBus] Found ${registeredAgents.length} registered agent(s) for ${event}`);

    if (registeredAgents.length === 0) {
      console.warn(`[EventBus] ⚠️  No agents registered for event: ${event}`);
      return;
    }

    const buildContext = (): AgentContext => ({
      leadId: payload.leadId,
      userId: payload.userId,
      eventData: {
        ...payload.metadata,
        previousValue: payload.previousValue,
        newValue: payload.newValue,
        event,
      },
    });

    // Phase 1: scoring agents run sequentially first to prevent race conditions
    const scoringAgents = registeredAgents.filter(a => a.constructor.name === 'LeadScoringAgent');
    const otherAgents = registeredAgents.filter(a => a.constructor.name !== 'LeadScoringAgent');

    for (const agent of scoringAgents) {
      try {
        console.log(`[EventBus] Phase 1 — Executing ${agent.constructor.name}`);
        const result = await agent.execute(buildContext());
        if (!result.success) console.warn(`[EventBus] ${agent.constructor.name} failed:`, result.error);
      } catch (err) {
        console.error(`[EventBus] ${agent.constructor.name} threw:`, err);
      }
    }

    // Phase 2: remaining agents run in parallel
    await Promise.allSettled(
      otherAgents.map(async (agent) => {
        try {
          console.log(`[EventBus] Phase 2 — Executing ${agent.constructor.name}`);
          const result = await agent.execute(buildContext());
          if (!result.success) {
            console.error(`[EventBus] Agent ${agent.constructor.name} failed:`, result.error);
          } else {
            console.log(`[EventBus] Agent ${agent.constructor.name} succeeded`);
          }
        } catch (error) {
          console.error(`[EventBus] Agent ${agent.constructor.name} threw error:`, error);
        }
      })
    );

    console.log(`[EventBus] Finished processing ${event} event`);
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
