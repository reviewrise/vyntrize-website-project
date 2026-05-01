// Server-side event processing

import { vyntrizeDb } from '@platform/vyntrize-db';
import { AnalyticsEvent } from './types';
import crypto from 'crypto';

interface ProcessedEvent {
  sessionId: string;
  visitorId?: string;
  userId?: string;
  eventType: string;
  eventName?: string;
  eventData?: any;
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddressHash?: string;
  country?: string;
  city?: string;
}

export class EventProcessor {
  /**
   * Process and store analytics events
   */
  static async processEvents(
    events: AnalyticsEvent[],
    request: Request
  ): Promise<void> {
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = this.getClientIP(request);
    const ipAddressHash = ipAddress ? this.hashIP(ipAddress) : undefined;
    
    // Parse user agent for device/browser info
    const { deviceType, browser, os } = this.parseUserAgent(userAgent);
    
    // Process each event
    const processedEvents: ProcessedEvent[] = events.map((event) => ({
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      eventType: event.eventType,
      eventName: event.eventName,
      eventData: event.eventData,
      pageUrl: event.pageUrl,
      pageTitle: event.pageTitle,
      referrer: event.referrer,
      utmSource: event.utmParams?.source,
      utmMedium: event.utmParams?.medium,
      utmCampaign: event.utmParams?.campaign,
      utmContent: event.utmParams?.content,
      utmTerm: event.utmParams?.term,
      userAgent,
      deviceType,
      browser,
      os,
      ipAddressHash,
    }));
    
    // Store events in database
    await this.storeEvents(processedEvents);
    
    // Update or create session
    if (events.length > 0) {
      await this.updateSession(events[0], deviceType, browser, os);
    }
  }
  
  /**
   * Store events in database
   */
  private static async storeEvents(events: ProcessedEvent[]): Promise<void> {
    try {
      await vyntrizeDb.analyticsEvent.createMany({
        data: events,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error storing analytics events:', error);
      throw error;
    }
  }
  
  /**
   * Update or create analytics session
   */
  private static async updateSession(
    event: AnalyticsEvent,
    deviceType?: string,
    browser?: string,
    os?: string
  ): Promise<void> {
    try {
      const existingSession = await vyntrizeDb.analyticsSession.findUnique({
        where: { sessionId: event.sessionId },
      });
      
      if (existingSession) {
        // Update existing session
        await vyntrizeDb.analyticsSession.update({
          where: { sessionId: event.sessionId },
          data: {
            endedAt: new Date(),
            pageViews: { increment: event.eventType === 'page_view' ? 1 : 0 },
            eventsCount: { increment: 1 },
            converted: event.eventType === 'form_submit' ? true : existingSession.converted,
            conversionType: event.eventType === 'form_submit' && !existingSession.converted
              ? event.eventName || 'form_submit'
              : existingSession.conversionType,
          },
        });
      } else {
        // Create new session
        await vyntrizeDb.analyticsSession.create({
          data: {
            sessionId: event.sessionId,
            visitorId: event.visitorId || event.sessionId,
            startedAt: new Date(),
            endedAt: new Date(),
            pageViews: event.eventType === 'page_view' ? 1 : 0,
            eventsCount: 1,
            landingPage: event.pageUrl,
            entryReferrer: event.referrer,
            utmSource: event.utmParams?.source,
            utmMedium: event.utmParams?.medium,
            utmCampaign: event.utmParams?.campaign,
            utmContent: event.utmParams?.content,
            utmTerm: event.utmParams?.term,
            deviceType,
            browser,
            os,
            converted: event.eventType === 'form_submit',
            conversionType: event.eventType === 'form_submit' ? event.eventName || 'form_submit' : null,
          },
        });
      }
      
      // Calculate session duration
      if (existingSession) {
        const durationMs = new Date().getTime() - new Date(existingSession.startedAt).getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        
        await vyntrizeDb.analyticsSession.update({
          where: { sessionId: event.sessionId },
          data: { durationSeconds },
        });
      }
    } catch (error) {
      console.error('Error updating analytics session:', error);
      // Don't throw - session update is not critical
    }
  }
  
  /**
   * Get client IP address from request
   */
  private static getClientIP(request: Request): string | null {
    // Check various headers for IP address
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'cf-connecting-ip', // Cloudflare
      'x-client-ip',
    ];
    
    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return value.split(',')[0].trim();
      }
    }
    
    return null;
  }
  
  /**
   * Hash IP address for privacy
   */
  private static hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
  }
  
  /**
   * Parse user agent string
   */
  private static parseUserAgent(userAgent?: string): {
    deviceType?: string;
    browser?: string;
    os?: string;
  } {
    if (!userAgent) return {};
    
    let deviceType: string | undefined;
    let browser: string | undefined;
    let os: string | undefined;
    
    // Detect device type
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      deviceType = 'mobile';
    } else {
      deviceType = 'desktop';
    }
    
    // Detect browser
    if (userAgent.includes('Firefox/')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Edg/')) {
      browser = 'Edge';
    } else if (userAgent.includes('Chrome/')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
      browser = 'Opera';
    }
    
    // Detect OS
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS X')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    }
    
    return { deviceType, browser, os };
  }
  
  /**
   * Validate event data
   */
  static validateEvent(event: any): event is AnalyticsEvent {
    return (
      typeof event === 'object' &&
      typeof event.eventType === 'string' &&
      typeof event.pageUrl === 'string' &&
      typeof event.sessionId === 'string' &&
      ['page_view', 'click', 'form_submit', 'custom'].includes(event.eventType)
    );
  }
}
