// Lead scoring algorithm

import { vyntrizeDb } from '@platform/vyntrize-db';
import {
  SCORING_WEIGHTS,
  SCORING_CAPS,
  QUALIFICATION_THRESHOLDS,
  ScoringFactors,
  categorizeJobTitle,
  categorizeCompanySize,
  hasRecentActivity,
} from './scoring-factors';

export type QualificationStatus = 'new' | 'cold' | 'warm' | 'mql' | 'sql';

export interface LeadScoreResult {
  score: number;
  previousScore: number;
  factors: ScoringFactors;
  qualificationStatus: QualificationStatus;
  breakdown: Record<string, number>;
}

export class LeadScorer {
  /**
   * Calculate lead score based on activities and demographics
   */
  static async calculateScore(leadId: string): Promise<LeadScoreResult> {
    // Get lead with related data
    const lead = await vyntrizeDb.lead.findUnique({
      where: { id: leadId },
      include: {
        contact: {
          include: {
            company: true,
          },
        },
        leadActivities: {
          select: {
            activityType: true,
          },
        },
        leadScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Get previous score
    const previousScore = lead.leadScores[0]?.score || 0;

    // Count activities by type
    const activityCounts = lead.leadActivities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate activity scores
    const pageViewScore = Math.min(
      (activityCounts['page_view'] || 0) * SCORING_WEIGHTS.pageView,
      SCORING_CAPS.pageViews
    );

    const formSubmitScore = (activityCounts['form_submit'] || 0) * SCORING_WEIGHTS.formSubmit;

    const emailOpenScore = Math.min(
      (activityCounts['email_open'] || 0) * SCORING_WEIGHTS.emailOpen,
      SCORING_CAPS.emailOpens
    );

    const emailClickScore = Math.min(
      (activityCounts['email_click'] || 0) * SCORING_WEIGHTS.emailClick,
      SCORING_CAPS.emailClicks
    );

    const downloadScore = (activityCounts['download'] || 0) * SCORING_WEIGHTS.download;

    // Recency score
    const recencyScore = hasRecentActivity(lead.lastActivityAt ?? undefined)
      ? SCORING_WEIGHTS.recentActivity
      : 0;

    // Demographic scores
    const companySizeCategory = categorizeCompanySize(lead.contact.company?.employeeCount ?? undefined);
    const companySizeScore = SCORING_WEIGHTS.companySize[companySizeCategory];

    const jobTitleCategory = categorizeJobTitle(lead.contact.jobTitle ?? undefined);
    const jobTitleScore = SCORING_WEIGHTS.jobTitle[jobTitleCategory];

    // Calculate engagement score (bonus for diverse activity types)
    const uniqueActivityTypes = Object.keys(activityCounts).length;
    const engagementScore = Math.min(uniqueActivityTypes * 2, 10);

    // Total score
    const totalScore = Math.min(
      pageViewScore +
      formSubmitScore +
      emailOpenScore +
      emailClickScore +
      downloadScore +
      recencyScore +
      companySizeScore +
      jobTitleScore +
      engagementScore,
      100
    );

    // Determine qualification status
    const qualificationStatus = this.qualifyLead(totalScore);

    // Build factors object
    const factors: ScoringFactors = {
      pageViews: activityCounts['page_view'] || 0,
      formSubmits: activityCounts['form_submit'] || 0,
      emailOpens: activityCounts['email_open'] || 0,
      emailClicks: activityCounts['email_click'] || 0,
      downloads: activityCounts['download'] || 0,
      recency: recencyScore,
      companySize: companySizeScore,
      jobTitle: jobTitleScore,
      engagement: engagementScore,
    };

    // Build breakdown for transparency
    const breakdown = {
      'Page Views': pageViewScore,
      'Form Submissions': formSubmitScore,
      'Email Opens': emailOpenScore,
      'Email Clicks': emailClickScore,
      'Downloads': downloadScore,
      'Recent Activity': recencyScore,
      'Company Size': companySizeScore,
      'Job Title': jobTitleScore,
      'Engagement': engagementScore,
    };

    return {
      score: totalScore,
      previousScore,
      factors,
      qualificationStatus,
      breakdown,
    };
  }

  /**
   * Determine qualification status based on score
   */
  static qualifyLead(score: number): QualificationStatus {
    if (score >= QUALIFICATION_THRESHOLDS.sql) return 'sql';
    if (score >= QUALIFICATION_THRESHOLDS.mql) return 'mql';
    if (score >= QUALIFICATION_THRESHOLDS.warm) return 'warm';
    if (score >= QUALIFICATION_THRESHOLDS.cold) return 'cold';
    return 'new';
  }

  /**
   * Save lead score to database
   */
  static async saveScore(leadId: string, result: LeadScoreResult): Promise<void> {
    await vyntrizeDb.$transaction([
      // Create score record
      vyntrizeDb.leadScore.create({
        data: {
          leadId,
          score: result.score,
          previousScore: result.previousScore,
          factors: result.factors as any,
          qualificationStatus: result.qualificationStatus,
        },
      }),
      // Update lead
      vyntrizeDb.lead.update({
        where: { id: leadId },
        data: {
          score: result.score,
          qualificationStatus: result.qualificationStatus,
        },
      }),
    ]);
  }

  /**
   * Calculate and save lead score
   */
  static async scoreAndSave(leadId: string): Promise<LeadScoreResult> {
    const result = await this.calculateScore(leadId);
    await this.saveScore(leadId, result);
    return result;
  }

  /**
   * Recalculate scores for multiple leads
   */
  static async scoreBatch(leadIds: string[]): Promise<Map<string, LeadScoreResult>> {
    const results = new Map<string, LeadScoreResult>();

    for (const leadId of leadIds) {
      try {
        const result = await this.scoreAndSave(leadId);
        results.set(leadId, result);
      } catch (error) {
        console.error(`Error scoring lead ${leadId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get leads that need score recalculation
   * (leads with recent activity or never scored)
   */
  static async getLeadsNeedingScore(limit = 100): Promise<string[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const leads = await vyntrizeDb.lead.findMany({
      where: {
        OR: [
          // Never scored
          { score: null },
          // Recent activity
          { lastActivityAt: { gte: oneHourAgo } },
        ],
        // Only open leads
        stage: {
          in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'],
        },
      },
      select: { id: true },
      take: limit,
    });

    return leads.map((l) => l.id);
  }
}
