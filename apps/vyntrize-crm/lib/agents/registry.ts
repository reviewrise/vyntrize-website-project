// Agent Registry - Central management for all AI agents

import { eventBus, CRMEvent } from './event-bus';
import { jobScheduler } from './job-scheduler';
import { LeadScoringAgent } from './lead-scoring-agent';
import { TaskAutomationAgent } from './task-automation-agent';
import { StagnationDetectionAgent } from './stagnation-detection-agent';
import { EmailGenerationAgent } from './email-generation-agent';
import { NextBestActionAgent } from './next-best-action-agent';

class AgentRegistry {
  private initialized = false;

  /**
   * Register all agents with Event Bus and Job Scheduler
   */
  async registerAllAgents(): Promise<void> {
    if (this.initialized) {
      console.log('[AgentRegistry] Already initialized');
      return;
    }

    console.log('[AgentRegistry] Registering all agents...');

    try {
      // Initialize agents
      const leadScoringAgent = new LeadScoringAgent();
      const taskAutomationAgent = new TaskAutomationAgent();
      const stagnationDetectionAgent = new StagnationDetectionAgent();
      const emailGenerationAgent = new EmailGenerationAgent();
      const nextBestActionAgent = new NextBestActionAgent();

      // Register Lead Scoring Agent
      // Event-driven: score leads when they're created or updated
      eventBus.registerAgent(CRMEvent.LEAD_CREATED, leadScoringAgent);
      eventBus.registerAgent(CRMEvent.LEAD_UPDATED, leadScoringAgent);
      eventBus.registerAgent(CRMEvent.EMAIL_OPENED, leadScoringAgent);
      eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, leadScoringAgent);
      
      // Scheduled: daily batch scoring for all leads
      await jobScheduler.scheduleRecurringJob(
        'LeadScoringAgent',
        '0 0 * * *', // Daily at midnight
        {}
      );
      jobScheduler.registerAgent(leadScoringAgent);

      // Register Task Automation Agent
      // Event-driven: create tasks when stage changes
      eventBus.registerAgent(CRMEvent.STAGE_CHANGED, taskAutomationAgent);
      jobScheduler.registerAgent(taskAutomationAgent);

      // Register Stagnation Detection Agent
      // Scheduled: daily scan for stagnant leads
      await jobScheduler.scheduleRecurringJob(
        'StagnationDetectionAgent',
        '0 9 * * *', // Daily at 9 AM
        {}
      );
      jobScheduler.registerAgent(stagnationDetectionAgent);

      // Register Email Generation Agent
      // Event-driven: generate emails on stage changes and engagement
      eventBus.registerAgent(CRMEvent.STAGE_CHANGED, emailGenerationAgent);
      eventBus.registerAgent(CRMEvent.EMAIL_OPENED, emailGenerationAgent);
      eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, emailGenerationAgent);
      
      // On-demand: also available for manual triggering
      jobScheduler.registerAgent(emailGenerationAgent);

      // Register Next Best Action Agent
      // On-demand only (triggered manually)
      jobScheduler.registerAgent(nextBestActionAgent);

      this.initialized = true;
      console.log('[AgentRegistry] All agents registered successfully');
    } catch (error) {
      console.error('[AgentRegistry] Failed to register agents:', error);
      throw error;
    }
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get agent system health status
   */
  async getHealthStatus() {
    const jobMetrics = await jobScheduler.getMetrics();
    
    return {
      initialized: this.initialized,
      jobQueue: jobMetrics,
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
