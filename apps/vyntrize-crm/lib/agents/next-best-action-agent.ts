// Next Best Action Agent - AI-powered recommendations for next steps

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult, AgentConfig } from './base-agent';
import { prisma } from '@/lib/prisma';
import { getAIProvider } from './ai-provider-factory';

interface Recommendation {
  action: string;
  reasoning: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export class NextBestActionAgent extends Agent {
  private cache: Map<string, { recommendations: Recommendation[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    super(AgentType.NEXT_BEST_ACTION);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!context.leadId) {
      return {
        success: false,
        error: 'Lead ID required',
        reasoning: 'Cannot generate recommendations without lead ID',
      };
    }

    try {
      // Check cache
      const cached = this.getFromCache(context.leadId);
      if (cached) {
        this.log('info', 'Using cached recommendations', { leadId: context.leadId });
        return {
          success: true,
          reasoning: 'Retrieved cached recommendations',
          metadata: {
            recommendations: cached,
            cached: true,
          },
        };
      }

      // Fetch lead data with comprehensive context
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: {
          contact: true,
          company: true,
          assignee: true,
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
            orderBy: { dueDate: 'asc' },
          },
          emailTracking: {
            orderBy: { sentAt: 'desc' },
            take: 5,
          },
          emailLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          leadActivities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          calendarEvents: {
            orderBy: { startTime: 'desc' },
            take: 5,
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

      // Build analysis context
      const analysisContext = this.buildAnalysisContext(lead);

      // Generate recommendations using AI
      let recommendations: Recommendation[];
      try {
        recommendations = await this.generateRecommendations(analysisContext);
      } catch (error) {
        // Fallback to rule-based recommendations if AI fails
        this.log('warn', 'AI recommendations failed, using rule-based fallback', error);
        recommendations = this.generateRuleBasedRecommendations(lead);
      }

      // Cache recommendations
      this.setCache(context.leadId, recommendations);

      // Record action
      const reasoning = this.generateReasoning(lead, recommendations);
      const actionId = await this.recordAction(
        ActionType.ALERT,
        context.leadId,
        reasoning,
        AutonomyLevel.COPILOT, // Suggestions only
        {
          recommendations,
          stage: lead.stage,
          score: lead.score,
        }
      );

      this.log('info', 'Recommendations generated', {
        leadId: context.leadId,
        count: recommendations.length,
      });

      return {
        success: true,
        actionId,
        reasoning,
        metadata: {
          recommendations,
          cached: false,
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

  /**
   * Build comprehensive analysis context
   */
  private buildAnalysisContext(lead: any): string {
    const parts: string[] = [];

    // Lead overview
    parts.push(`Lead: ${lead.contact.firstName} ${lead.contact.lastName}`);
    if (lead.contact.jobTitle) parts.push(`Job Title: ${lead.contact.jobTitle}`);
    if (lead.company?.name) parts.push(`Company: ${lead.company.name}`);
    parts.push(`Stage: ${lead.stage}`);
    parts.push(`Score: ${lead.score}/100 (${lead.qualificationStatus})`);
    if (lead.dealValue) parts.push(`Deal Value: $${lead.dealValue}`);

    // Engagement metrics
    const emailEngagement = this.calculateEmailEngagement(lead);
    parts.push(`\nEmail Engagement: ${emailEngagement.openRate}% open rate, ${emailEngagement.clickRate}% click rate`);

    const websiteEngagement = this.calculateWebsiteEngagement(lead);
    parts.push(`Website Engagement: ${websiteEngagement.visits} visits, ${websiteEngagement.uniquePages} unique pages`);

    // Recent activities
    if (lead.activities.length > 0) {
      parts.push('\nRecent Activities:');
      lead.activities.slice(0, 5).forEach((activity: any) => {
        const date = new Date(activity.createdAt).toLocaleDateString();
        parts.push(`- [${date}] ${activity.type}: ${activity.body.substring(0, 80)}`);
      });
    }

    // Pending tasks
    if (lead.leadTasks.length > 0) {
      parts.push(`\nPending Tasks: ${lead.leadTasks.length}`);
      lead.leadTasks.slice(0, 3).forEach((task: any) => {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        parts.push(`- ${task.title} (${task.priority}, due: ${dueDate})`);
      });
    }

    // Calendar Events
    if (lead.calendarEvents && lead.calendarEvents.length > 0) {
      parts.push(`\nRecent/Upcoming Meetings:`);
      lead.calendarEvents.forEach((evt: any) => {
        const evtDate = new Date(evt.startTime).toLocaleDateString();
        parts.push(`- [${evtDate}] ${evt.title} (Status: ${evt.status})`);
      });
    }

    // Time since last activity
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lead.lastActivityAt || lead.updatedAt).getTime()) / (24 * 60 * 60 * 1000)
    );
    parts.push(`\nDays since last activity: ${daysSinceActivity}`);

    return parts.join('\n');
  }

  /**
   * Calculate email engagement metrics
   */
  private calculateEmailEngagement(lead: any): { openRate: number; clickRate: number } {
    const allEmails = [...lead.emailTracking, ...lead.emailLogs];
    if (allEmails.length === 0) return { openRate: 0, clickRate: 0 };

    const opens = allEmails.filter((e: any) => e.openedAt).length;
    const clicks = allEmails.filter((e: any) => e.clickedAt).length;

    return {
      openRate: Math.round((opens / allEmails.length) * 100),
      clickRate: Math.round((clicks / allEmails.length) * 100),
    };
  }

  /**
   * Calculate website engagement metrics
   */
  private calculateWebsiteEngagement(lead: any): { visits: number; uniquePages: number } {
    const visits = lead.leadActivities.filter((a: any) => a.activityType === 'page_view').length;
    const uniquePages = new Set(
      lead.leadActivities
        .filter((a: any) => a.activityType === 'page_view')
        .map((a: any) => a.activityData?.pageUrl)
        .filter(Boolean)
    ).size;

    return { visits, uniquePages };
  }

  /**
   * Generate recommendations using AI
   */
  private async generateRecommendations(context: string): Promise<Recommendation[]> {
    const systemPrompt = `You are a sales strategy advisor. Analyze lead data and provide 1-3 specific, actionable recommendations for the next best actions to take. Consider engagement, timing, and sales best practices.`;

    const prompt = `Analyze this lead and provide 1-3 specific recommendations for next actions:

${context}

Return recommendations in this exact JSON format:
[
  {
    "action": "Specific action to take",
    "reasoning": "Why this action is recommended",
    "priority": "LOW|MEDIUM|HIGH|URGENT"
  }
]

Focus on:
- Timing and urgency
- Engagement patterns
- Stage-appropriate actions
- Concrete next steps`;

    const aiProvider = await getAIProvider();
    const response = await aiProvider.generateCompletion({
      prompt,
      systemPrompt,
      maxTokens: 600,
      temperature: 0.7,
    });

    return this.parseRecommendations(response.content);
  }

  /**
   * Parse AI response into recommendations
   */
  private parseRecommendations(content: string): Recommendation[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3); // Max 3 recommendations
        }
      }
    } catch (error) {
      this.log('warn', 'Failed to parse AI recommendations', error);
    }

    // Fallback: extract recommendations from text
    return [
      {
        action: 'Review lead engagement and follow up',
        reasoning: content.substring(0, 200),
        priority: 'MEDIUM',
      },
    ];
  }

  /**
   * Generate rule-based recommendations (fallback)
   */
  private generateRuleBasedRecommendations(lead: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lead.lastActivityAt || lead.updatedAt).getTime()) / (24 * 60 * 60 * 1000)
    );

    // Inactivity recommendation
    if (daysSinceActivity > 7) {
      recommendations.push({
        action: 'Send follow-up email',
        reasoning: `No activity for ${daysSinceActivity} days. Re-engage the lead with a personalized follow-up.`,
        priority: daysSinceActivity > 14 ? 'HIGH' : 'MEDIUM',
      });
    }

    // High score recommendation
    if (lead.score && lead.score >= 70) {
      recommendations.push({
        action: 'Schedule discovery call',
        reasoning: `Lead has high engagement score (${lead.score}/100). Time to move to next stage.`,
        priority: 'HIGH',
      });
    }

    // Calendar specific rules
    const upcomingMeeting = lead.calendarEvents?.find((e: any) => new Date(e.startTime) > new Date() && e.status === 'SCHEDULED');
    if (upcomingMeeting) {
      recommendations.unshift({
        action: 'Prepare for meeting',
        reasoning: `You have an upcoming meeting: "${upcomingMeeting.title}". Review lead history and notes.`,
        priority: 'HIGH',
      });
    } else if (lead.score && lead.score >= 60 && (lead.stage === 'QUALIFIED' || lead.stage === 'CONTACTED')) {
      // High intent but no upcoming meeting
      recommendations.push({
        action: 'Propose meeting with booking link',
        reasoning: `Lead is warm but has no scheduled meeting. Send your booking link to lock in a consultation.`,
        priority: 'HIGH',
      });
    }

    // Stage-specific recommendations
    if (lead.stage === 'QUALIFIED' && !lead.dealValue) {
      recommendations.push({
        action: 'Qualify deal value',
        reasoning: 'Lead is qualified but deal value is not set. Discuss budget and timeline.',
        priority: 'MEDIUM',
      });
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        action: 'Review lead status',
        reasoning: 'Check in on lead progress and update information.',
        priority: 'LOW',
      });
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(lead: any, recommendations: Recommendation[]): string {
    const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;
    const topAction = recommendations[0]?.action || 'No specific action';
    return `Generated ${recommendations.length} recommendation(s) for ${contactName}. Top recommendation: ${topAction}`;
  }

  /**
   * Cache management
   */
  private getFromCache(leadId: string): Recommendation[] | null {
    const cached = this.cache.get(leadId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(leadId);
      return null;
    }

    return cached.recommendations;
  }

  private setCache(leadId: string, recommendations: Recommendation[]): void {
    this.cache.set(leadId, {
      recommendations,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  getConfig(): AgentConfig {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.COPILOT, // Suggestions only
      priority: 'MEDIUM',
    };
  }
}
