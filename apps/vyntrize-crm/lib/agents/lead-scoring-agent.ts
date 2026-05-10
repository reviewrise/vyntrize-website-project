// Lead Scoring Agent - Automatically scores leads based on engagement and activity

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult, AgentConfig } from './base-agent';
import { prisma } from '@/lib/prisma';

interface ScoringFactors {
  emailOpens: number;
  emailClicks: number;
  websiteVisits: number;
  completedTasks: number;
  daysSinceActivity: number;
  emailReplies: number;
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
      // Fetch lead data with related entities
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: {
          emailTracking: {
            where: {
              sentAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
          leadTasks: {
            where: {
              status: 'COMPLETED',
              completedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          leadActivities: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          emailLogs: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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
      const newScore = this.calculateScore(factors);
      
      // Determine qualification status
      const qualificationStatus = this.determineQualificationStatus(newScore);
      
      // Update lead
      await prisma.lead.update({
        where: { id: context.leadId },
        data: {
          score: newScore,
          qualificationStatus,
          lastActivityAt: new Date(),
        },
      });

      // Record action
      const reasoning = this.generateReasoning(factors, newScore, qualificationStatus, lead.score || 0);
      const actionId = await this.recordAction(
        ActionType.SCORE_UPDATE,
        context.leadId,
        reasoning,
        AutonomyLevel.FULLY_AUTONOMOUS,
        {
          previousScore: lead.score,
          newScore,
          factors,
          qualificationStatus,
        }
      );

      this.log('info', 'Lead scored', {
        leadId: context.leadId,
        previousScore: lead.score,
        newScore,
        qualificationStatus,
      });

      return {
        success: true,
        actionId,
        reasoning,
        metadata: {
          score: newScore,
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

  /**
   * Calculate scoring factors from lead data
   */
  private calculateFactors(lead: any): ScoringFactors {
    // Email engagement
    const emailOpens = lead.emailTracking.filter((e: any) => e.openedAt).length;
    const emailClicks = lead.emailTracking.filter((e: any) => e.clickedAt).length;
    const emailReplies = lead.emailTracking.filter((e: any) => e.repliedAt).length;

    // Email logs (new email system)
    const emailLogOpens = lead.emailLogs.filter((e: any) => e.openedAt).length;
    const emailLogClicks = lead.emailLogs.filter((e: any) => e.clickedAt).length;

    // Website activity
    const websiteVisits = lead.leadActivities.filter(
      (a: any) => a.activityType === 'page_view'
    ).length;

    // Task completion
    const completedTasks = lead.leadTasks.length;

    // Inactivity calculation
    const lastActivityAt = lead.lastActivityAt || lead.createdAt;
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivityAt).getTime()) / (24 * 60 * 60 * 1000)
    );

    return {
      emailOpens: emailOpens + emailLogOpens,
      emailClicks: emailClicks + emailLogClicks,
      websiteVisits,
      completedTasks,
      daysSinceActivity,
      emailReplies,
    };
  }

  /**
   * Calculate lead score based on factors
   */
  private calculateScore(factors: ScoringFactors): number {
    let score = 50; // Base score

    // Positive factors
    score += factors.emailOpens * 5;        // +5 per email open
    score += factors.emailClicks * 10;      // +10 per email click
    score += factors.emailReplies * 15;     // +15 per email reply
    score += factors.websiteVisits * 8;     // +8 per website visit
    score += factors.completedTasks * 12;   // +12 per completed task

    // Negative factors (inactivity penalty, max -40)
    const inactivityPenalty = Math.min(factors.daysSinceActivity * 2, 40);
    score -= inactivityPenalty;

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine qualification status based on score
   */
  private determineQualificationStatus(score: number): string {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'qualified';
    if (score >= 40) return 'warm';
    if (score >= 20) return 'cold';
    return 'unqualified';
  }

  /**
   * Generate human-readable reasoning for the score
   */
  private generateReasoning(
    factors: ScoringFactors,
    newScore: number,
    qualificationStatus: string,
    previousScore: number
  ): string {
    const scoreDelta = newScore - previousScore;
    const direction = scoreDelta > 0 ? 'increased' : scoreDelta < 0 ? 'decreased' : 'unchanged';
    
    const parts = [
      `Lead score ${direction} from ${previousScore} to ${newScore}/100 (${qualificationStatus}).`,
    ];

    // Add engagement details
    const engagementDetails: string[] = [];
    if (factors.emailOpens > 0) engagementDetails.push(`${factors.emailOpens} email opens`);
    if (factors.emailClicks > 0) engagementDetails.push(`${factors.emailClicks} email clicks`);
    if (factors.emailReplies > 0) engagementDetails.push(`${factors.emailReplies} email replies`);
    if (factors.websiteVisits > 0) engagementDetails.push(`${factors.websiteVisits} website visits`);
    if (factors.completedTasks > 0) engagementDetails.push(`${factors.completedTasks} completed tasks`);

    if (engagementDetails.length > 0) {
      parts.push(`Engagement: ${engagementDetails.join(', ')}.`);
    }

    // Add inactivity warning
    if (factors.daysSinceActivity > 7) {
      parts.push(`⚠️ ${factors.daysSinceActivity} days since last activity.`);
    }

    return parts.join(' ');
  }

  getConfig(): AgentConfig {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      executionFrequency: '0 0 * * *', // Daily at midnight
      priority: 'MEDIUM',
    };
  }
}
