// Analytics tracker - client-side tracking library

import { AnalyticsEvent, TrackerConfig, TrackEventOptions, UTMParameters } from './types';
import { SessionManager } from './session-manager';
import {
  getOrCreateVisitorId,
  extractUTMParams,
  storeUTMParams,
  getStoredUTMParams,
  isDNTEnabled,
  getDeviceType,
  parseUserAgent,
} from './utils';

export class AnalyticsTracker {
  private config!: Required<TrackerConfig>;
  private sessionManager!: SessionManager;
  private visitorId!: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  
  constructor(config: TrackerConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/track',
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      respectDNT: config.respectDNT !== false, // Default true
      debug: config.debug || false,
    };
    
    // Check DNT
    if (this.config.respectDNT && isDNTEnabled()) {
      this.log('Do Not Track is enabled, analytics disabled');
      return;
    }
    
    this.sessionManager = new SessionManager();
    this.visitorId = getOrCreateVisitorId();
    
    // Extract and store UTM parameters if present
    const utmParams = extractUTMParams();
    if (utmParams) {
      storeUTMParams(utmParams);
    }
    
    this.isInitialized = true;
    this.startFlushTimer();
    
    // Track page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });
      
      // Track visibility change (tab switching)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true);
        }
      });
    }
    
    this.log('Analytics tracker initialized', {
      sessionId: this.sessionManager.getSessionId(),
      visitorId: this.visitorId,
    });
  }
  
  /**
   * Track a page view
   */
  trackPageView(url?: string, title?: string): void {
    if (!this.isInitialized) return;
    
    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    
    this.queueEvent({
      eventType: 'page_view',
      pageUrl,
      pageTitle,
      referrer,
      sessionId: this.sessionManager.getSessionId(),
      visitorId: this.visitorId,
      utmParams: getStoredUTMParams(),
    });
    
    this.sessionManager.updateActivity();
    this.log('Page view tracked', { url: pageUrl, title: pageTitle });
  }
  
  /**
   * Track a custom event
   */
  trackEvent(eventName: string, eventData?: Record<string, any>): void {
    if (!this.isInitialized) return;
    
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const pageTitle = typeof document !== 'undefined' ? document.title : '';
    
    this.queueEvent({
      eventType: 'custom',
      eventName,
      eventData,
      pageUrl,
      pageTitle,
      sessionId: this.sessionManager.getSessionId(),
      visitorId: this.visitorId,
      utmParams: getStoredUTMParams(),
    });
    
    this.sessionManager.updateActivity();
    this.log('Custom event tracked', { eventName, eventData });
  }
  
  /**
   * Track a button/link click
   */
  trackClick(elementId: string, elementText?: string, destination?: string): void {
    this.trackEvent('click', {
      elementId,
      elementText,
      destination,
    });
  }
  
  /**
   * Track a form submission
   */
  trackFormSubmit(formId: string, formData?: Record<string, any>): void {
    if (!this.isInitialized) return;
    
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const pageTitle = typeof document !== 'undefined' ? document.title : '';
    
    // Don't include sensitive form data, just metadata
    const safeFormData = formData ? {
      fieldCount: Object.keys(formData).length,
      fields: Object.keys(formData),
    } : undefined;
    
    this.queueEvent({
      eventType: 'form_submit',
      eventName: formId,
      eventData: safeFormData,
      pageUrl,
      pageTitle,
      sessionId: this.sessionManager.getSessionId(),
      visitorId: this.visitorId,
      utmParams: getStoredUTMParams(),
    });
    
    this.sessionManager.updateActivity();
    this.log('Form submit tracked', { formId });
  }
  
  /**
   * Get current session ID (useful for associating with leads)
   */
  getSessionId(): string {
    return this.sessionManager.getSessionId();
  }
  
  /**
   * Get visitor ID
   */
  getVisitorId(): string {
    return this.visitorId;
  }
  
  /**
   * Queue an event for batch sending
   */
  private queueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);
    
    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }
  
  /**
   * Flush queued events to server
   */
  private async flush(useBeacon = false): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    this.log(`Flushing ${events.length} events`, { useBeacon });
    
    try {
      if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        // Use sendBeacon for reliable delivery on page unload
        const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
        navigator.sendBeacon(this.config.apiEndpoint, blob);
      } else {
        // Use fetch for normal requests
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
          keepalive: useBeacon, // Keep connection alive for page unload
        });
      }
    } catch (error) {
      this.log('Error flushing events', error);
      // Re-queue events on error (but limit to prevent infinite growth)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events);
      }
    }
  }
  
  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }
  
  /**
   * Log debug messages
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[Analytics] ${message}`, data || '');
    }
  }
}

// Singleton instance
let trackerInstance: AnalyticsTracker | null = null;

/**
 * Initialize analytics tracker
 */
export function initAnalytics(config?: TrackerConfig): AnalyticsTracker {
  if (!trackerInstance) {
    trackerInstance = new AnalyticsTracker(config);
  }
  return trackerInstance;
}

/**
 * Get analytics tracker instance
 */
export function getAnalytics(): AnalyticsTracker | null {
  return trackerInstance;
}
