// Base Agent class for all AI Pipeline Agents

import { prisma } from '@/lib/prisma';

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
  WORKFLOW_RULE = 'WORKFLOW_RULE',
  CONVERSATIONAL = 'CONVERSATIONAL',
}

export enum ActionType {
  SCORE_UPDATE = 'SCORE_UPDATE',
  TASK_CREATE = 'TASK_CREATE',
  EMAIL_SEND = 'EMAIL_SEND',
  SMS_SEND = 'SMS_SEND',
  STAGE_CHANGE = 'STAGE_CHANGE',
  ALERT = 'ALERT',
  PREDICTION_UPDATE = 'PREDICTION_UPDATE',
  DRIP_ENROLL = 'DRIP_ENROLL',
  RULE_EXECUTION = 'RULE_EXECUTION',
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

export interface AgentConfig {
  agentType: AgentType;
  enabled: boolean;
  autonomyLevel: AutonomyLevel;
  executionFrequency?: string; // cron expression for batch jobs
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
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
      ...(data !== undefined ? { data } : {}),
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
