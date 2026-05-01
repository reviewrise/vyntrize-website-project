// Background job to recalculate lead scores

import { LeadScorer } from '../scoring/lead-scorer';

export interface ScoreRecalculationResult {
  processed: number;
  updated: number;
  errors: number;
  duration: number;
}

/**
 * Recalculate scores for leads with recent activity
 */
export async function recalculateLeadScores(): Promise<ScoreRecalculationResult> {
  const startTime = Date.now();
  let processed = 0;
  let updated = 0;
  let errors = 0;

  try {
    console.log('[Score Job] Starting lead score recalculation...');

    // Get leads that need scoring
    const leadIds = await LeadScorer.getLeadsNeedingScore(100);
    console.log(`[Score Job] Found ${leadIds.length} leads to score`);

    if (leadIds.length === 0) {
      return {
        processed: 0,
        updated: 0,
        errors: 0,
        duration: Date.now() - startTime,
      };
    }

    // Score leads in batches
    const results = await LeadScorer.scoreBatch(leadIds);

    processed = leadIds.length;
    updated = results.size;
    errors = processed - updated;

    // Log qualification changes
    for (const [leadId, result] of results) {
      if (result.previousScore !== result.score) {
        console.log(
          `[Score Job] Lead ${leadId}: ${result.previousScore} → ${result.score} (${result.qualificationStatus})`
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Score Job] Completed: ${updated}/${processed} leads scored in ${duration}ms`
    );

    return {
      processed,
      updated,
      errors,
      duration,
    };
  } catch (error) {
    console.error('[Score Job] Error:', error);
    throw error;
  }
}

/**
 * Run score recalculation on a schedule
 * This would be called by a cron job or scheduler
 */
export async function scheduleScoreRecalculation(intervalMinutes = 60): Promise<void> {
  console.log(`[Score Job] Scheduling score recalculation every ${intervalMinutes} minutes`);

  // Run immediately
  await recalculateLeadScores();

  // Schedule recurring execution
  setInterval(async () => {
    try {
      await recalculateLeadScores();
    } catch (error) {
      console.error('[Score Job] Scheduled execution failed:', error);
    }
  }, intervalMinutes * 60 * 1000);
}
