/**
 * Client-side Analytics Tracking Library
 * Tracks page views, events, and user sessions
 * Sends data to /api/track endpoint which stores in CRM database
 */

interface AnalyticsConfig {
  apiEndpoint: string;
  batchSize?: number;
  flushInterval?: number;
  respectDNT?: boolean;
  debug?: boolean;
}

interface TrackingEvent {
  type: 'pageview' | 'event' | 'session_start' | 'session_end';
  timestamp: number;
  url: string;
  referrer: string;
  sessionId: string;
  visitorId: string;
  eventName?: string;
  eventData?: Record<string, any>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

class AnalyticsTracker {
  private config: Required<AnalyticsConfig>;
  private queue: TrackingEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private visitorId: string;
  private sessionStartTime: number;
  private lastActivityTime: number;
  private pageViewCount: number = 0;

  constructor(config: AnalyticsConfig) {
    this.config = {
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000,
      respectDNT: config.respectDNT !== false,
      debug: config.debug || false,
      apiEndpoint: config.apiEndpoint,
    };

    // Check Do Not Track
    if (this.config.respectDNT && this.isDNTEnabled()) {
      this.log('Do Not Track is enabled, analytics disabled');
      return;
    }

    // Initialize IDs
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();

    // Track session start
    this.trackSessionStart();

    // Set up periodic flush
    this.startFlushTimer();

    // Track session end on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.trackSessionEnd());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  private isDNTEnabled(): boolean {
    if (typeof navigator === 'undefined') return false;
    return (
      navigator.doNotTrack === '1' ||
      (window as any).doNotTrack === '1' ||
      (navigator as any).msDoNotTrack === '1'
    );
  }

  private getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return this.generateId();
    
    let visitorId = localStorage.getItem('_va_vid');
    if (!visitorId) {
      visitorId = this.generateId();
      localStorage.setItem('_va_vid', visitorId);
    }
    return visitorId;
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return this.generateId();
    
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const stored = sessionStorage.getItem('_va_sid');
    const storedTime = sessionStorage.getItem('_va_sid_time');
    
    if (stored && storedTime) {
      const timeSinceLastActivity = Date.now() - parseInt(storedTime, 10);
      if (timeSinceLastActivity < SESSION_TIMEOUT) {
        return stored;
      }
    }
    
    const sessionId = this.generateId();
    sessionStorage.setItem('_va_sid', sessionId);
    sessionStorage.setItem('_va_sid_time', Date.now().toString());
    return sessionId;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUTMParams(): Partial<TrackingEvent> {
    if (typeof window === 'undefined') return {};
    
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmContent: params.get('utm_content') || undefined,
      utmTerm: params.get('utm_term') || undefined,
    };
  }

  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }

  private startFlushTimer() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private trackSessionStart() {
    const event: TrackingEvent = {
      type: 'session_start',
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ...this.getUTMParams(),
    };
    
    this.queue.push(event);
    this.log('Session started', event);
  }

  private trackSessionEnd() {
    const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const event: TrackingEvent = {
      type: 'session_end',
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: '',
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      eventData: {
        duration,
        pageViews: this.pageViewCount,
      },
    };
    
    this.queue.push(event);
    this.flush();
    this.log('Session ended', event);
  }

  public trackPageView() {
    if (typeof window === 'undefined') return;
    
    this.pageViewCount++;
    this.lastActivityTime = Date.now();
    
    const event: TrackingEvent = {
      type: 'pageview',
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ...this.getUTMParams(),
    };
    
    this.queue.push(event);
    this.log('Page view tracked', event);
    
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public trackEvent(eventName: string, eventData?: Record<string, any>) {
    if (typeof window === 'undefined') return;
    
    this.lastActivityTime = Date.now();
    
    const event: TrackingEvent = {
      type: 'event',
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      eventName,
      eventData,
    };
    
    this.queue.push(event);
    this.log('Event tracked', event);
    
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        keepalive: true, // Important for beforeunload events
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send analytics: ${response.status}`);
      }
      
      this.log('Flushed', events.length, 'events');
    } catch (error) {
      this.log('Error sending analytics:', error);
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  public destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

let globalTracker: AnalyticsTracker | null = null;

export function initAnalytics(config: AnalyticsConfig): AnalyticsTracker {
  if (globalTracker) {
    return globalTracker;
  }
  
  globalTracker = new AnalyticsTracker(config);
  return globalTracker;
}

export function getAnalytics(): AnalyticsTracker | null {
  return globalTracker;
}

export function trackPageView() {
  globalTracker?.trackPageView();
}

export function trackEvent(eventName: string, eventData?: Record<string, any>) {
  globalTracker?.trackEvent(eventName, eventData);
}
