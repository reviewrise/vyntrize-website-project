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
  private config!: Required<AnalyticsConfig>;
  private queue: TrackingEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string = '';
  private visitorId: string = '';
  private sessionStartTime: number = 0;
  private lastActivityTime: number = 0;
  private pageViewCount: number = 0;
  private initialized: boolean = false;

  constructor(config: AnalyticsConfig) {
    // Don't initialize during SSR
    if (typeof window === 'undefined') {
      console.log('[Analytics] Skipping initialization during SSR');
      return;
    }

    this.config = {
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000,
      respectDNT: config.respectDNT !== false,
      debug: config.debug || false,
      apiEndpoint: config.apiEndpoint,
    };

    console.log('[Analytics] Initializing with config:', this.config);

    // Check Do Not Track
    if (this.config.respectDNT && this.isDNTEnabled()) {
      console.log('[Analytics] Do Not Track is enabled, analytics disabled');
      return;
    }

    // Initialize IDs
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();

    console.log('[Analytics] Initialized with visitorId:', this.visitorId, 'sessionId:', this.sessionId);

    // Mark as initialized
    this.initialized = true;

    // Track session start
    this.trackSessionStart();

    // Set up periodic flush
    this.startFlushTimer();

    // Track session end on page unload
    window.addEventListener('beforeunload', () => this.trackSessionEnd());
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
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
    if (typeof window === 'undefined') return '';
    
    let visitorId = localStorage.getItem('_va_vid');
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 11)}`;
      localStorage.setItem('_va_vid', visitorId);
    }
    return visitorId;
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const stored = sessionStorage.getItem('_va_sid');
    const storedTime = sessionStorage.getItem('_va_sid_time');
    
    if (stored && storedTime) {
      const timeSinceLastActivity = Date.now() - parseInt(storedTime, 10);
      if (timeSinceLastActivity < SESSION_TIMEOUT) {
        return stored;
      }
    }
    
    const sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 11)}`;
    sessionStorage.setItem('_va_sid', sessionId);
    sessionStorage.setItem('_va_sid_time', Date.now().toString());
    return sessionId;
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
    if (typeof window === 'undefined' || !this.initialized) return;
    
    // Ensure we have a valid URL
    const url = window.location?.href;
    if (!url) {
      console.log('[Analytics] Session start skipped - no URL available yet');
      return;
    }
    
    const event: TrackingEvent = {
      type: 'session_start',
      timestamp: Date.now(),
      url,
      referrer: document.referrer || '',
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ...this.getUTMParams(),
    };
    
    this.queue.push(event);
    console.log('[Analytics] Session started', event);
  }

  private trackSessionEnd() {
    if (typeof window === 'undefined' || !this.initialized) return;
    
    // Ensure we have a valid URL
    const url = window.location?.href;
    if (!url) {
      console.log('[Analytics] Session end skipped - no URL available');
      return;
    }
    
    const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const event: TrackingEvent = {
      type: 'session_end',
      timestamp: Date.now(),
      url,
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
    console.log('[Analytics] Session ended', event);
  }

  public trackPageView() {
    if (typeof window === 'undefined' || !this.initialized) {
      console.log('[Analytics] trackPageView skipped - not initialized');
      return;
    }
    
    // Ensure we have a valid URL
    const url = window.location?.href;
    if (!url) {
      console.log('[Analytics] trackPageView skipped - no URL available yet');
      return;
    }
    
    console.log('[Analytics] trackPageView called');
    
    this.pageViewCount++;
    this.lastActivityTime = Date.now();
    
    const event: TrackingEvent = {
      type: 'pageview',
      timestamp: Date.now(),
      url,
      referrer: document.referrer || '',
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ...this.getUTMParams(),
    };
    
    this.queue.push(event);
    console.log('[Analytics] Page view queued:', event);
    
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getVisitorId(): string {
    return this.visitorId;
  }

  public trackFormSubmit(formId: string, formData?: Record<string, any>) {
    this.trackEvent(`form_submit:${formId}`, formData);
  }

  public trackEvent(eventName: string, eventData?: Record<string, any>) {
    if (typeof window === 'undefined' || !this.initialized) return;

    // Ensure we have a valid URL
    const url = window.location?.href;
    if (!url) {
      console.log('[Analytics] trackEvent skipped - no URL available');
      return;
    }
    
    this.lastActivityTime = Date.now();
    
    const event: TrackingEvent = {
      type: 'event',
      timestamp: Date.now(),
      url,
      referrer: document.referrer || '',
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
    
    console.log('[Analytics] Flushing', events.length, 'events to', this.config.apiEndpoint);
    
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        keepalive: true, // Important for beforeunload events
      });
      
      console.log('[Analytics] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Analytics] Error response:', errorText);
        throw new Error(`Failed to send analytics: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Analytics] Success:', result);
    } catch (error) {
      console.error('[Analytics] Error sending analytics:', error);
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
