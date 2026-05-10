// Event Bus for dispatching CRM events to registered agents

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
    console.log(`[EventBus] Found ${registeredAgents.length} registered agent(s) for ${event}`);
    
    if (registeredAgents.length === 0) {
      console.warn(`[EventBus] ⚠️  No agents registered for event: ${event}`);
      return;
    }
    
    // Execute agents in parallel (they handle their own errors)
    const promises = registeredAgents.map(async (agent) => {
      try {
        console.log(`[EventBus] Executing agent: ${agent.constructor.name}`);
        
        const context: AgentContext = {
          leadId: payload.leadId,
          userId: payload.userId,
          eventData: {
            ...payload.metadata,
            previousValue: payload.previousValue,
            newValue: payload.newValue,
          },
        };
        
        const result = await agent.execute(context);
        
        if (!result.success) {
          console.error(`[EventBus] Agent ${agent.constructor.name} failed:`, result.error);
        } else {
          console.log(`[EventBus] Agent ${agent.constructor.name} succeeded`);
        }
      } catch (error) {
        console.error(`[EventBus] Agent ${agent.constructor.name} threw error:`, error);
      }
    });

    await Promise.allSettled(promises);
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
