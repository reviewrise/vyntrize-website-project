// Email Throttling Service - Prevents email fatigue with smart rate limiting

import { prisma } from '@/lib/prisma';
import { ActionType, ActionStatus } from '@platform/vyntrize-db';

interface ThrottlingResult {
  allowed: boolean;
  reason?: string;
  nextAvailableTime?: Date;
}

interface ThrottlingConfig {
  maxPerDay: number;
  maxPerWeek: number;
  minHoursBetween: number;
}

export class EmailThrottlingService {
  private config: ThrottlingConfig;

  constructor(config?: Partial<ThrottlingConfig>) {
    this.config = {
      maxPerDay: config?.maxPerDay ?? parseInt(process.env.EMAIL_MAX_PER_DAY || '1'),
      maxPerWeek: config?.maxPerWeek ?? parseInt(process.env.EMAIL_MAX_PER_WEEK || '3'),
      minHoursBetween: config?.minHoursBetween ?? parseInt(process.env.EMAIL_MIN_HOURS_BETWEEN || '24'),
    };
  }

  /**
   * Check if we can generate an email for this lead
   */
  async canGenerateEmail(leadId: string, triggerType?: string): Promise<ThrottlingResult> {
    try {
      // Check 1: Recent email in last N hours
      const recentCheck = await this.checkRecentEmail(leadId, triggerType);
      if (!recentCheck.allowed) {
        return recentCheck;
      }

      // Check 2: Daily limit
      const dailyCheck = await this.checkDailyLimit(leadId);
      if (!dailyCheck.allowed) {
        return dailyCheck;
      }

      // Check 3: Weekly limit
      const weeklyCheck = await this.checkWeeklyLimit(leadId);
      if (!weeklyCheck.allowed) {
        return weeklyCheck;
      }

      // Check 4: Lead preferences (unsubscribed, etc.)
      const preferencesCheck = await this.checkLeadPreferences(leadId);
      if (!preferencesCheck.allowed) {
        return preferencesCheck;
      }

      return { allowed: true };
    } catch (error) {
      console.error('[EmailThrottling] Error checking throttling:', error);
      // Fail open - allow email generation if throttling check fails
      return { allowed: true };
    }
  }

  /**
   * Check if an email was generated recently (within minHoursBetween)
   * Engagement triggers get reduced cooldown for high-engagement leads
   */
  private async checkRecentEmail(leadId: string, triggerType?: string): Promise<ThrottlingResult> {
    let minHours = this.config.minHoursBetween;
    
    // Reduce cooldown for engagement triggers if lead has high engagement
    if (triggerType === 'engagement') {
      const engagementRate = await this.calculateEngagementRate(leadId);
      
      // High engagement (>50%): reduce cooldown to 12 hours
      if (engagementRate >= 50) {
        minHours = 12;
      }
      // Medium engagement (30-50%): reduce cooldown to 18 hours
      else if (engagementRate >= 30) {
        minHours = 18;
      }
    }
    
    const cutoffTime = new Date(Date.now() - minHours * 60 * 60 * 1000);

    const recentEmail = await prisma.agentAction.findFirst({
      where: {
        leadId,
        actionType: ActionType.EMAIL_SEND,
        createdAt: {
          gte: cutoffTime,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentEmail) {
      const nextAvailableTime = new Date(
        recentEmail.createdAt.getTime() + minHours * 60 * 60 * 1000
      );

      return {
        allowed: false,
        reason: `Email generated ${this.getTimeAgo(recentEmail.createdAt)}. Next available: ${this.getTimeUntil(nextAvailableTime)}`,
        nextAvailableTime,
      };
    }

    return { allowed: true };
  }

  /**
   * Check daily email limit
   */
  private async checkDailyLimit(leadId: string): Promise<ThrottlingResult> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await prisma.agentAction.count({
      where: {
        leadId,
        actionType: ActionType.EMAIL_SEND,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    if (todayCount >= this.config.maxPerDay) {
      const tomorrow = new Date(startOfDay);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        allowed: false,
        reason: `Daily limit reached (${todayCount}/${this.config.maxPerDay}). Resets at midnight.`,
        nextAvailableTime: tomorrow,
      };
    }

    return { allowed: true };
  }

  /**
   * Check weekly email limit
   */
  private async checkWeeklyLimit(leadId: string): Promise<ThrottlingResult> {
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekCount = await prisma.agentAction.count({
      where: {
        leadId,
        actionType: ActionType.EMAIL_SEND,
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    if (weekCount >= this.config.maxPerWeek) {
      const nextMonday = new Date(startOfWeek);
      nextMonday.setDate(nextMonday.getDate() + 7);

      return {
        allowed: false,
        reason: `Weekly limit reached (${weekCount}/${this.config.maxPerWeek}). Resets Monday.`,
        nextAvailableTime: nextMonday,
      };
    }

    return { allowed: true };
  }

  /**
   * Check lead preferences (future: unsubscribe, preferences, etc.)
   */
  private async checkLeadPreferences(leadId: string): Promise<ThrottlingResult> {
    // Future: Check if lead has unsubscribed or set email preferences
    // For now, just check if lead exists and is not in LOST or WON stage for too long
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        stage: true,
        updatedAt: true,
      },
    });

    if (!lead) {
      return {
        allowed: false,
        reason: 'Lead not found',
      };
    }

    // Don't generate emails for leads that have been WON or LOST for more than 30 days
    if (lead.stage === 'WON' || lead.stage === 'LOST') {
      const daysSinceUpdate = Math.floor(
        (Date.now() - lead.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysSinceUpdate > 30) {
        return {
          allowed: false,
          reason: `Lead has been ${lead.stage} for ${daysSinceUpdate} days. No further emails needed.`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get recent email generation history
   */
  async getRecentEmailActions(leadId: string, hours: number = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return prisma.agentAction.findMany({
      where: {
        leadId,
        actionType: ActionType.EMAIL_SEND,
        createdAt: {
          gte: cutoffTime,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        lead: {
          include: {
            contact: true,
          },
        },
      },
    });
  }

  /**
   * Get email generation statistics for a lead
   */
  async getEmailStats(leadId: string) {
    const [total, pending, approved, rejected, last24h, last7days] = await Promise.all([
      // Total emails generated
      prisma.agentAction.count({
        where: {
          leadId,
          actionType: ActionType.EMAIL_SEND,
        },
      }),
      // Pending approval
      prisma.agentAction.count({
        where: {
          leadId,
          actionType: ActionType.EMAIL_SEND,
          status: ActionStatus.PENDING,
        },
      }),
      // Approved
      prisma.agentAction.count({
        where: {
          leadId,
          actionType: ActionType.EMAIL_SEND,
          status: ActionStatus.APPROVED,
        },
      }),
      // Rejected
      prisma.agentAction.count({
        where: {
          leadId,
          actionType: ActionType.EMAIL_SEND,
          status: ActionStatus.REJECTED,
        },
      }),
      // Last 24 hours
      prisma.agentAction.count({
        where: {
          leadId,
          actionType: ActionType.EMAIL_SEND,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Last 7 days
      prisma.agentAction.count({
        where: {
          leadId,
          actionType: ActionType.EMAIL_SEND,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      last24h,
      last7days,
      remainingToday: Math.max(0, this.config.maxPerDay - last24h),
      remainingThisWeek: Math.max(0, this.config.maxPerWeek - last7days),
    };
  }

  /**
   * Calculate engagement rate for a lead (for future throttling adjustments)
   */
  async calculateEngagementRate(leadId: string): Promise<number> {
    // Get all sent emails (approved and executed)
    const sentEmails = await prisma.agentAction.count({
      where: {
        leadId,
        actionType: ActionType.EMAIL_SEND,
        status: ActionStatus.APPROVED,
        executedAt: {
          not: null,
        },
      },
    });

    if (sentEmails === 0) {
      return 0;
    }

    // Get email tracking data
    const [emailTracking, emailLogs] = await Promise.all([
      prisma.emailTracking.findMany({
        where: {
          lead: {
            id: leadId,
          },
        },
        select: {
          openedAt: true,
          clickedAt: true,
        },
      }),
      prisma.emailLog.findMany({
        where: {
          lead: {
            id: leadId,
          },
        },
        select: {
          openedAt: true,
          clickedAt: true,
        },
      }),
    ]);

    const allEmails = [...emailTracking, ...emailLogs];
    const opens = allEmails.filter(e => e.openedAt).length;
    const clicks = allEmails.filter(e => e.clickedAt).length;

    // Engagement score: opens worth 1 point, clicks worth 2 points
    const engagementScore = opens + clicks * 2;
    const maxScore = sentEmails * 3; // Max: all emails opened and clicked

    return maxScore > 0 ? Math.round((engagementScore / maxScore) * 100) : 0;
  }

  /**
   * Helper: Get human-readable time ago
   */
  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  /**
   * Helper: Get human-readable time until
   */
  private getTimeUntil(date: Date): string {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  }
}

// Singleton instance
let _throttlingServiceInstance: EmailThrottlingService | null = null;

export function getEmailThrottlingService(): EmailThrottlingService {
  if (!_throttlingServiceInstance) {
    _throttlingServiceInstance = new EmailThrottlingService();
  }
  return _throttlingServiceInstance;
}
