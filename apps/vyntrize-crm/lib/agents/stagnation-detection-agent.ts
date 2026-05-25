// Stagnation Detection Agent - Detects and alerts on leads that haven't progressed

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult, AgentConfig } from './base-agent';
import { prisma } from '@/lib/prisma';
import { LeadStage } from '@platform/vyntrize-db';

interface StagnationThreshold {
  stage: LeadStage;
  warningDays: number;
  criticalDays: number;
}

export class StagnationDetectionAgent extends Agent {
  private thresholds: StagnationThreshold[] = [
    { stage: 'NEW', warningDays: 3, criticalDays: 7 },
    { stage: 'CONTACTED', warningDays: 7, criticalDays: 14 },
    { stage: 'QUALIFIED', warningDays: 10, criticalDays: 21 },
    { stage: 'PROPOSAL_SENT', warningDays: 7, criticalDays: 14 },
  ];

  constructor() {
    super(AgentType.STAGNATION_DETECTION);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    try {
      if (context.leadId) {
        // Check specific lead
        return await this.checkLead(context.leadId);
      } else {
        // Batch job: scan all active leads
        return await this.scanAllLeads();
      }
    } catch (error) {
      this.log('error', 'Failed to detect stagnation', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Error during stagnation detection',
      };
    }
  }

  /**
   * Check a specific lead for stagnation
   */
  private async checkLead(leadId: string): Promise<AgentActionResult> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        contact: true,
        assignee: true,
        leadTasks: {
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
        calendarEvents: {
          where: {
            startTime: { gte: new Date() },
          },
          orderBy: {
            startTime: 'asc',
          },
          take: 1,
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

    // Skip closed leads
    if (lead.stage === 'WON' || lead.stage === 'LOST') {
      return {
        success: true,
        reasoning: 'Lead is closed, skipping stagnation check',
      };
    }

    // Skip leads with upcoming meetings
    if (lead.calendarEvents && lead.calendarEvents.length > 0) {
      return {
        success: true,
        reasoning: `Lead has an upcoming meeting scheduled for ${lead.calendarEvents[0].startTime.toLocaleDateString()}, skipping stagnation check`,
      };
    }

    const threshold = this.thresholds.find(t => t.stage === lead.stage);
    if (!threshold) {
      return {
        success: true,
        reasoning: `No stagnation threshold configured for stage: ${lead.stage}`,
      };
    }

    const daysSinceUpdate = this.calculateDaysSinceUpdate(lead);
    const stagnationLevel = this.determineStagnationLevel(daysSinceUpdate, threshold);

    if (stagnationLevel === 'none') {
      return {
        success: true,
        reasoning: `Lead is active (${daysSinceUpdate} days since update)`,
      };
    }

    // Create alert task if critical
    if (stagnationLevel === 'critical') {
      await this.createStagnationTask(lead, daysSinceUpdate);
    }

    // Record action
    const reasoning = this.generateReasoning(lead, daysSinceUpdate, stagnationLevel);
    const actionId = await this.recordAction(
      ActionType.ALERT,
      leadId,
      reasoning,
      AutonomyLevel.FULLY_AUTONOMOUS,
      {
        stagnationLevel,
        daysSinceUpdate,
        stage: lead.stage,
        threshold,
      }
    );

    this.log('warn', 'Stagnant lead detected', {
      leadId,
      stage: lead.stage,
      daysSinceUpdate,
      stagnationLevel,
    });

    return {
      success: true,
      actionId,
      reasoning,
      metadata: {
        stagnationLevel,
        daysSinceUpdate,
      },
    };
  }

  /**
   * Scan all active leads for stagnation
   */
  private async scanAllLeads(): Promise<AgentActionResult> {
    const leads = await prisma.lead.findMany({
      where: {
        stage: {
          notIn: ['WON', 'LOST'],
        },
      },
      include: {
        contact: true,
        assignee: true,
      },
    });

    let stagnantCount = 0;
    let criticalCount = 0;

    for (const lead of leads) {
      const result = await this.checkLead(lead.id);
      if (result.success && result.metadata?.stagnationLevel) {
        stagnantCount++;
        if (result.metadata.stagnationLevel === 'critical') {
          criticalCount++;
        }
      }
    }

    const reasoning = `Scanned ${leads.length} active leads. Found ${stagnantCount} stagnant leads (${criticalCount} critical).`;

    this.log('info', 'Stagnation scan complete', {
      totalLeads: leads.length,
      stagnantCount,
      criticalCount,
    });

    return {
      success: true,
      reasoning,
      metadata: {
        totalLeads: leads.length,
        stagnantCount,
        criticalCount,
      },
    };
  }

  /**
   * Calculate days since last update
   */
  private calculateDaysSinceUpdate(lead: any): number {
    const lastUpdate = lead.lastActivityAt || lead.updatedAt;
    return Math.floor(
      (Date.now() - new Date(lastUpdate).getTime()) / (24 * 60 * 60 * 1000)
    );
  }

  /**
   * Determine stagnation level
   */
  private determineStagnationLevel(
    daysSinceUpdate: number,
    threshold: StagnationThreshold
  ): 'none' | 'warning' | 'critical' {
    if (daysSinceUpdate >= threshold.criticalDays) return 'critical';
    if (daysSinceUpdate >= threshold.warningDays) return 'warning';
    return 'none';
  }

  /**
   * Create a task to follow up on stagnant lead
   */
  private async createStagnationTask(lead: any, daysSinceUpdate: number): Promise<void> {
    // Check if stagnation task already exists
    const existingTask = await prisma.leadTask.findFirst({
      where: {
        leadId: lead.id,
        title: {
          contains: 'Stagnant lead',
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });

    if (existingTask) {
      return; // Task already exists
    }

    // Create task
    await prisma.leadTask.create({
      data: {
        leadId: lead.id,
        title: `⚠️ Stagnant lead - No activity for ${daysSinceUpdate} days`,
        description: `This lead has been in ${lead.stage} stage for ${daysSinceUpdate} days without activity. Please review and take action.`,
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
        assignedToId: lead.assigneeId,
        createdById: lead.assigneeId || 'system',
        status: 'PENDING',
      },
    });
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    lead: any,
    daysSinceUpdate: number,
    stagnationLevel: string
  ): string {
    const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;
    const assigneeName = lead.assignee?.displayName || 'unassigned';

    const levelEmoji = stagnationLevel === 'critical' ? '🚨' : '⚠️';

    return `${levelEmoji} Lead "${contactName}" is stagnant (${stagnationLevel}). No activity for ${daysSinceUpdate} days in ${lead.stage} stage. Assigned to: ${assigneeName}.`;
  }

  getConfig(): AgentConfig {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      executionFrequency: '0 9 * * *', // Daily at 9 AM
      priority: 'HIGH',
    };
  }
}
