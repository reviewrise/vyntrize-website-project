// Analytics type definitions

export interface UTMParameters {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface AnalyticsEvent {
  eventType: 'page_view' | 'click' | 'form_submit' | 'custom';
  eventName?: string;
  eventData?: Record<string, any>;
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
  sessionId: string;
  visitorId?: string;
  utmParams?: UTMParameters;
}

export interface TrackEventOptions {
  eventName?: string;
  eventData?: Record<string, any>;
}

export interface SessionData {
  sessionId: string;
  startedAt: number;
  lastActivity: number;
}

export interface TrackerConfig {
  apiEndpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  respectDNT?: boolean;
  debug?: boolean;
}
