// Event Bus for dispatching CRM events to agents

import { EventEmitter } from 'events';
import { Agent, AgentContext } from './base-agent';

// ─── Event Types ──────────────────────────────────────────────────────────────

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

// ─── Agent Event Bus ──────────────────────────────────────────────────────────

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
        // Skip if agent is disabled
        if (!agent.isAgentEnabled()) {
          console.log(`[EventBus] Skipping disabled agent ${agent.constructor.name}`);
          return;
        }

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

  /**
   * Get all registered events
   */
  getRegisteredEvents(): CRMEvent[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Clear all registered agents (useful for testing)
   */
  clearAgents() {
    this.agents.clear();
  }
}

// Singleton instance
export const eventBus = new AgentEventBus();
