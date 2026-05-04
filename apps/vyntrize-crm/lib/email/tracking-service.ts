/**
 * Tracking Service - Handle email open and click tracking
 */

import { vyntrizeDb } from '@platform/vyntrize-db';
import { EmailEventType } from '@platform/vyntrize-db/src/generated/client';

export interface TrackingMetadata {
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export class TrackingService {
  /**
   * Generate a unique tracking ID
   */
  static generateTrackingId(): string {
    return `trk_${Date.now()}_${Math.random().toString(36).substr(2, 11)}`;
  }

  /**
   * Record email open event
   */
  static async recordOpen(trackingId: string, metadata: TrackingMetadata = {}): Promise<void> {
    try {
      // Find the email log
      const emailLog = await vyntrizeDb.emailLog.findUnique({
        where: { trackingId },
      });

      if (!emailLog) {
        console.warn(`[TrackingService] Email log not found for tracking ID: ${trackingId}`);
        return;
      }

      // Check if already opened
      const now = new Date();
      const isFirstOpen = !emailLog.openedAt;

      // Update email log
      await vyntrizeDb.emailLog.update({
        where: { id: emailLog.id },
        data: {
          openedAt: isFirstOpen ? now : emailLog.openedAt,
          openCount: { increment: 1 },
          status: 'OPENED',
        },
      });

      // Create email event
      await vyntrizeDb.emailEvent.create({
        data: {
          emailLogId: emailLog.id,
          eventType: EmailEventType.OPENED,
          eventData: {
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            timestamp: metadata.timestamp || now,
            isFirstOpen,
          },
        },
      });

      // Update campaign stats if part of a campaign
      if (emailLog.campaignId && isFirstOpen) {
        await vyntrizeDb.emailCampaign.update({
          where: { id: emailLog.campaignId },
          data: {
            openedCount: { increment: 1 },
          },
        });
      }

      console.log(`[TrackingService] Recorded open for ${trackingId}`);
    } catch (error) {
      console.error('[TrackingService] Error recording open:', error);
    }
  }

  /**
   * Record email click event
   */
  static async recordClick(
    trackingId: string,
    url: string,
    metadata: TrackingMetadata = {}
  ): Promise<void> {
    try {
      // Find the email log
      const emailLog = await vyntrizeDb.emailLog.findUnique({
        where: { trackingId },
      });

      if (!emailLog) {
        console.warn(`[TrackingService] Email log not found for tracking ID: ${trackingId}`);
        return;
      }

      // Check if first click
      const now = new Date();
      const isFirstClick = !emailLog.clickedAt;

      // Update email log
      await vyntrizeDb.emailLog.update({
        where: { id: emailLog.id },
        data: {
          clickedAt: isFirstClick ? now : emailLog.clickedAt,
          clickCount: { increment: 1 },
          status: 'CLICKED',
        },
      });

      // Create email event
      await vyntrizeDb.emailEvent.create({
        data: {
          emailLogId: emailLog.id,
          eventType: EmailEventType.CLICKED,
          eventData: {
            url,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            timestamp: metadata.timestamp || now,
            isFirstClick,
          },
        },
      });

      // Update campaign stats if part of a campaign
      if (emailLog.campaignId && isFirstClick) {
        await vyntrizeDb.emailCampaign.update({
          where: { id: emailLog.campaignId },
          data: {
            clickedCount: { increment: 1 },
          },
        });
      }

      console.log(`[TrackingService] Recorded click for ${trackingId} to ${url}`);
    } catch (error) {
      console.error('[TrackingService] Error recording click:', error);
    }
  }

  /**
   * Record email bounce event
   */
  static async recordBounce(trackingId: string, reason?: string): Promise<void> {
    try {
      const emailLog = await vyntrizeDb.emailLog.findUnique({
        where: { trackingId },
      });

      if (!emailLog) return;

      await vyntrizeDb.emailLog.update({
        where: { id: emailLog.id },
        data: {
          bouncedAt: new Date(),
          status: 'BOUNCED',
          errorMessage: reason,
        },
      });

      await vyntrizeDb.emailEvent.create({
        data: {
          emailLogId: emailLog.id,
          eventType: EmailEventType.BOUNCED,
          eventData: { reason },
        },
      });

      // Update campaign stats
      if (emailLog.campaignId) {
        await vyntrizeDb.emailCampaign.update({
          where: { id: emailLog.campaignId },
          data: {
            bouncedCount: { increment: 1 },
          },
        });
      }

      console.log(`[TrackingService] Recorded bounce for ${trackingId}`);
    } catch (error) {
      console.error('[TrackingService] Error recording bounce:', error);
    }
  }

  /**
   * Get tracking stats for an email
   */
  static async getEmailStats(trackingId: string) {
    try {
      const emailLog = await vyntrizeDb.emailLog.findUnique({
        where: { trackingId },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!emailLog) return null;

      return {
        status: emailLog.status,
        sentAt: emailLog.sentAt,
        deliveredAt: emailLog.deliveredAt,
        openedAt: emailLog.openedAt,
        clickedAt: emailLog.clickedAt,
        bouncedAt: emailLog.bouncedAt,
        openCount: emailLog.openCount,
        clickCount: emailLog.clickCount,
        events: emailLog.events,
      };
    } catch (error) {
      console.error('[TrackingService] Error getting email stats:', error);
      return null;
    }
  }

  /**
   * Generate 1x1 transparent tracking pixel (GIF)
   */
  static getTrackingPixel(): Buffer {
    // 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return pixel;
  }
}
