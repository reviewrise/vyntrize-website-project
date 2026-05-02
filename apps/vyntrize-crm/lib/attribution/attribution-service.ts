// Lead Attribution Service - Track first-touch and last-touch attribution

import { vyntrizeDb } from '@platform/vyntrize-db';

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface TouchPoint {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
  timestamp: Date;
}

export interface Attribution {
  firstTouch: TouchPoint | null;
  lastTouch: TouchPoint | null;
  touchpoints: TouchPoint[];
}

export class AttributionService {
  /**
   * Record first touch attribution when lead is created
   */
  static async recordFirstTouch(leadId: string, utmParams: UTMParams): Promise<void> {
    try {
      // Check if attribution already exists
      const existing = await vyntrizeDb.leadSource.findUnique({
        where: { leadId },
      });

      if (existing) {
        // First touch already recorded, just add to touchpoints
        await this.addTouchpoint(leadId, utmParams);
        return;
      }

      // Create new attribution record
      const touchpoint: TouchPoint = {
        source: utmParams.source || 'direct',
        medium: utmParams.medium || 'none',
        campaign: utmParams.campaign || 'none',
        content: utmParams.content,
        term: utmParams.term,
        timestamp: new Date(),
      };

      await vyntrizeDb.leadSource.create({
        data: {
          leadId,
          firstTouchSource: touchpoint.source,
          firstTouchMedium: touchpoint.medium,
          firstTouchCampaign: touchpoint.campaign,
          firstTouchContent: touchpoint.content,
          firstTouchTerm: touchpoint.term,
          firstTouchAt: touchpoint.timestamp,
          lastTouchSource: touchpoint.source,
          lastTouchMedium: touchpoint.medium,
          lastTouchCampaign: touchpoint.campaign,
          lastTouchContent: touchpoint.content,
          lastTouchTerm: touchpoint.term,
          lastTouchAt: touchpoint.timestamp,
          touchpoints: [touchpoint],
        },
      });
    } catch (error) {
      console.error('Error recording first touch:', error);
      throw error;
    }
  }

  /**
   * Update last touch attribution on each visit
   */
  static async updateLastTouch(leadId: string, utmParams: UTMParams): Promise<void> {
    try {
      const attribution = await vyntrizeDb.leadSource.findUnique({
        where: { leadId },
      });

      if (!attribution) {
        // No attribution exists, create it
        await this.recordFirstTouch(leadId, utmParams);
        return;
      }

      const touchpoint: TouchPoint = {
        source: utmParams.source || 'direct',
        medium: utmParams.medium || 'none',
        campaign: utmParams.campaign || 'none',
        content: utmParams.content,
        term: utmParams.term,
        timestamp: new Date(),
      };

      // Update last touch
      await vyntrizeDb.leadSource.update({
        where: { leadId },
        data: {
          lastTouchSource: touchpoint.source,
          lastTouchMedium: touchpoint.medium,
          lastTouchCampaign: touchpoint.campaign,
          lastTouchContent: touchpoint.content,
          lastTouchTerm: touchpoint.term,
          lastTouchAt: touchpoint.timestamp,
        },
      });

      // Add to touchpoints
      await this.addTouchpoint(leadId, utmParams);
    } catch (error) {
      console.error('Error updating last touch:', error);
      throw error;
    }
  }

  /**
   * Add a touchpoint to the attribution history
   */
  static async addTouchpoint(leadId: string, utmParams: UTMParams): Promise<void> {
    try {
      const attribution = await vyntrizeDb.leadSource.findUnique({
        where: { leadId },
      });

      if (!attribution) {
        await this.recordFirstTouch(leadId, utmParams);
        return;
      }

      const touchpoint: TouchPoint = {
        source: utmParams.source || 'direct',
        medium: utmParams.medium || 'none',
        campaign: utmParams.campaign || 'none',
        content: utmParams.content,
        term: utmParams.term,
        timestamp: new Date(),
      };

      // Get existing touchpoints
      const touchpoints = (attribution.touchpoints as unknown as TouchPoint[]) || [];

      // Check if this is a duplicate (same source/medium/campaign within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isDuplicate = touchpoints.some(
        (tp) =>
          tp.source === touchpoint.source &&
          tp.medium === touchpoint.medium &&
          tp.campaign === touchpoint.campaign &&
          new Date(tp.timestamp) > fiveMinutesAgo
      );

      if (isDuplicate) {
        return; // Skip duplicate touchpoints
      }

      // Add new touchpoint
      touchpoints.push(touchpoint);

      // Keep only last 50 touchpoints
      const recentTouchpoints = touchpoints.slice(-50);

      await vyntrizeDb.leadSource.update({
        where: { leadId },
        data: {
          touchpoints: recentTouchpoints,
        },
      });
    } catch (error) {
      console.error('Error adding touchpoint:', error);
      throw error;
    }
  }

  /**
   * Get attribution data for a lead
   */
  static async getAttribution(leadId: string): Promise<Attribution | null> {
    try {
      const attribution = await vyntrizeDb.leadSource.findUnique({
        where: { leadId },
      });

      if (!attribution) {
        return null;
      }

      const firstTouch: TouchPoint | null = attribution.firstTouchAt
        ? {
            source: attribution.firstTouchSource || 'direct',
            medium: attribution.firstTouchMedium || 'none',
            campaign: attribution.firstTouchCampaign || 'none',
            content: attribution.firstTouchContent || undefined,
            term: attribution.firstTouchTerm || undefined,
            timestamp: attribution.firstTouchAt,
          }
        : null;

      const lastTouch: TouchPoint | null = attribution.lastTouchAt
        ? {
            source: attribution.lastTouchSource || 'direct',
            medium: attribution.lastTouchMedium || 'none',
            campaign: attribution.lastTouchCampaign || 'none',
            content: attribution.lastTouchContent || undefined,
            term: attribution.lastTouchTerm || undefined,
            timestamp: attribution.lastTouchAt,
          }
        : null;

      const touchpoints = (attribution.touchpoints as unknown as TouchPoint[]) || [];

      return {
        firstTouch,
        lastTouch,
        touchpoints,
      };
    } catch (error) {
      console.error('Error getting attribution:', error);
      throw error;
    }
  }

  /**
   * Get attribution summary statistics
   */
  static async getAttributionStats(leadId: string) {
    const attribution = await this.getAttribution(leadId);

    if (!attribution) {
      return null;
    }

    const touchpoints = attribution.touchpoints;

    // Count touchpoints by source
    const sourceCount = touchpoints.reduce((acc, tp) => {
      acc[tp.source] = (acc[tp.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count touchpoints by medium
    const mediumCount = touchpoints.reduce((acc, tp) => {
      acc[tp.medium] = (acc[tp.medium] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count touchpoints by campaign
    const campaignCount = touchpoints.reduce((acc, tp) => {
      acc[tp.campaign] = (acc[tp.campaign] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate time to conversion (if lead is won)
    const lead = await vyntrizeDb.lead.findUnique({
      where: { id: leadId },
      select: { stage: true, createdAt: true, updatedAt: true },
    });

    let timeToConversion: number | null = null;
    if (lead?.stage === 'WON' && attribution.firstTouch) {
      const conversionDate = lead.updatedAt;
      const firstTouchDate = attribution.firstTouch.timestamp;
      timeToConversion = Math.floor(
        (conversionDate.getTime() - firstTouchDate.getTime()) / (1000 * 60 * 60 * 24)
      ); // Days
    }

    return {
      totalTouchpoints: touchpoints.length,
      sourceCount,
      mediumCount,
      campaignCount,
      timeToConversion,
      firstTouch: attribution.firstTouch,
      lastTouch: attribution.lastTouch,
    };
  }

  /**
   * Track attribution from analytics session when lead is created
   */
  static async trackFromSession(leadId: string, sessionId: string): Promise<void> {
    try {
      // Get session data
      const session = await vyntrizeDb.analyticsSession.findUnique({
        where: { sessionId },
      });

      if (!session) {
        return;
      }

      // Extract UTM parameters from session
      const utmParams: UTMParams = {
        source: session.utmSource || undefined,
        medium: session.utmMedium || undefined,
        campaign: session.utmCampaign || undefined,
        content: session.utmContent || undefined,
        term: session.utmTerm || undefined,
      };

      // Record first touch
      await this.recordFirstTouch(leadId, utmParams);
    } catch (error) {
      console.error('Error tracking attribution from session:', error);
      throw error;
    }
  }
}
