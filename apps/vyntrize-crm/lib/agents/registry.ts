// Agent Registry - Central management for all AI agents

import { eventBus, CRMEvent } from './event-bus';
import { jobScheduler } from './job-scheduler';
import { LeadScoringAgent } from './lead-scoring-agent';
import { TaskAutomationAgent } from './task-automation-agent';
import { StagnationDetectionAgent } from './stagnation-detection-agent';
import { EmailGenerationAgent } from './email-generation-agent';
import { NextBestActionAgent } from './next-best-action-agent';
import { StageProgressionAgent } from './stage-progression-agent';
import { DripCampaignAgent } from './drip-campaign-agent';
import { WorkflowRuleEngine } from './workflow-rule-engine';

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
      eventBus.registerAgent(CRMEvent.EMAIL_REPLIED, leadScoringAgent);
      
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
      // eventBus.registerAgent(CRMEvent.STAGE_CHANGED, emailGenerationAgent); // Handled by Workflow Rules for now
      eventBus.registerAgent(CRMEvent.EMAIL_OPENED, emailGenerationAgent);
      eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, emailGenerationAgent);
      eventBus.registerAgent(CRMEvent.EMAIL_REPLIED, emailGenerationAgent);
      
      // On-demand: also available for manual triggering
      jobScheduler.registerAgent(emailGenerationAgent);

      // Register Next Best Action Agent
      // On-demand only (triggered manually)
      jobScheduler.registerAgent(nextBestActionAgent);

      // ── Stage Progression Agent ──────────────────────────────────────────
      if (process.env.AGENT_STAGE_PROGRESSION_ENABLED === 'false') {
        console.warn('[AgentRegistry] StageProgressionAgent is disabled via AGENT_STAGE_PROGRESSION_ENABLED=false');
      } else {
        const stageProgressionAgent = new StageProgressionAgent();

        // Event-driven: evaluate leads when they are updated or engage with emails/tasks
        eventBus.registerAgent(CRMEvent.LEAD_UPDATED, stageProgressionAgent);
        eventBus.registerAgent(CRMEvent.EMAIL_OPENED, stageProgressionAgent);
        eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, stageProgressionAgent);
        eventBus.registerAgent(CRMEvent.EMAIL_REPLIED, stageProgressionAgent);
        eventBus.registerAgent(CRMEvent.TASK_COMPLETED, stageProgressionAgent);

        // Scheduled: nightly batch evaluation at 2 AM
        await jobScheduler.scheduleRecurringJob(
          'StageProgressionAgent',
          '0 2 * * *',
          {}
        );
        jobScheduler.registerAgent(stageProgressionAgent);
      }

      // ── Drip Campaign Agent ───────────────────────────────────────────────
      if (process.env.AGENT_DRIP_CAMPAIGN_ENABLED === 'false') {
        console.warn('[AgentRegistry] DripCampaignAgent is disabled via AGENT_DRIP_CAMPAIGN_ENABLED=false');
      } else {
        const dripCampaignAgent = new DripCampaignAgent();

        // Event-driven: check stop conditions and trigger enrollment on key events
        eventBus.registerAgent(CRMEvent.STAGE_CHANGED, dripCampaignAgent);
        eventBus.registerAgent(CRMEvent.LEAD_UPDATED, dripCampaignAgent);
        eventBus.registerAgent(CRMEvent.EMAIL_OPENED, dripCampaignAgent);
        eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, dripCampaignAgent);
        eventBus.registerAgent(CRMEvent.EMAIL_REPLIED, dripCampaignAgent);
        eventBus.registerAgent(CRMEvent.TASK_COMPLETED, dripCampaignAgent);

        // Scheduled: process due drip steps every 5 minutes
        await jobScheduler.scheduleRecurringJob(
          'DripCampaignAgent',
          '*/5 * * * *',
          {}
        );
        jobScheduler.registerAgent(dripCampaignAgent);
      }

      // ── Workflow Rule Engine ──────────────────────────────────────────────
      if (process.env.AGENT_WORKFLOW_RULE_ENABLED === 'false') {
        console.warn('[AgentRegistry] WorkflowRuleEngine is disabled via AGENT_WORKFLOW_RULE_ENABLED=false');
      } else {
        const workflowRuleEngine = new WorkflowRuleEngine();

        // Event-driven: evaluate rules on all six CRM events
        eventBus.registerAgent(CRMEvent.LEAD_CREATED, workflowRuleEngine);
        eventBus.registerAgent(CRMEvent.LEAD_UPDATED, workflowRuleEngine);
        eventBus.registerAgent(CRMEvent.STAGE_CHANGED, workflowRuleEngine);
        eventBus.registerAgent(CRMEvent.EMAIL_OPENED, workflowRuleEngine);
        eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, workflowRuleEngine);
        eventBus.registerAgent(CRMEvent.EMAIL_REPLIED, workflowRuleEngine);
        eventBus.registerAgent(CRMEvent.TASK_COMPLETED, workflowRuleEngine);

        // On-demand: also available for manual triggering
        jobScheduler.registerAgent(workflowRuleEngine);
      }

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
   * Return all agents registered for a specific CRM event.
   * Used by the queue worker to know which agents to run.
   */
  getAgentsForEvent(event: CRMEvent) {
    return eventBus.getAgents(event);
  }

  /**
   * Reset the registry (used for tests / re-initialization)
   */
  reset(): void {
    this.initialized = false;
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
