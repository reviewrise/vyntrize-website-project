// Analytics utility functions

import { UTMParameters } from './types';

/**
 * Generate a unique visitor ID
 */
export function generateVisitorId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create visitor ID from cookie
 */
export function getOrCreateVisitorId(): string {
  const cookieName = 'vyntrize_visitor_id';
  const existing = getCookie(cookieName);
  
  if (existing) {
    return existing;
  }
  
  const visitorId = generateVisitorId();
  // Set cookie for 2 years
  setCookie(cookieName, visitorId, 365 * 2);
  return visitorId;
}

/**
 * Get or create session ID from sessionStorage
 */
export function getOrCreateSessionId(): string {
  const storageKey = 'vyntrize_session_id';
  const sessionTimeout = 30 * 60 * 1000; // 30 minutes
  
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      const now = Date.now();
      
      // Check if session is still valid
      if (now - data.lastActivity < sessionTimeout) {
        // Update last activity
        data.lastActivity = now;
        sessionStorage.setItem(storageKey, JSON.stringify(data));
        return data.sessionId;
      }
    }
  } catch (e) {
    // SessionStorage not available or error
  }
  
  // Create new session
  const sessionId = generateSessionId();
  const sessionData = {
    sessionId,
    startedAt: Date.now(),
    lastActivity: Date.now(),
  };
  
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(sessionData));
  } catch (e) {
    // SessionStorage not available
  }
  
  return sessionId;
}

/**
 * Extract UTM parameters from URL
 */
export function extractUTMParams(url?: string): UTMParameters | undefined {
  const urlToCheck = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  try {
    const urlObj = new URL(urlToCheck);
    const params: UTMParameters = {};
    
    const utmSource = urlObj.searchParams.get('utm_source');
    const utmMedium = urlObj.searchParams.get('utm_medium');
    const utmCampaign = urlObj.searchParams.get('utm_campaign');
    const utmContent = urlObj.searchParams.get('utm_content');
    const utmTerm = urlObj.searchParams.get('utm_term');
    
    if (utmSource) params.source = utmSource;
    if (utmMedium) params.medium = utmMedium;
    if (utmCampaign) params.campaign = utmCampaign;
    if (utmContent) params.content = utmContent;
    if (utmTerm) params.term = utmTerm;
    
    return Object.keys(params).length > 0 ? params : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Store UTM parameters in sessionStorage for attribution
 */
export function storeUTMParams(params: UTMParameters): void {
  try {
    const existing = sessionStorage.getItem('vyntrize_utm_params');
    if (!existing) {
      // Only store first-touch UTM params
      sessionStorage.setItem('vyntrize_utm_params', JSON.stringify(params));
    }
  } catch (e) {
    // SessionStorage not available
  }
}

/**
 * Get stored UTM parameters
 */
export function getStoredUTMParams(): UTMParameters | undefined {
  try {
    const stored = sessionStorage.getItem('vyntrize_utm_params');
    return stored ? JSON.parse(stored) : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Check if Do Not Track is enabled
 */
export function isDNTEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
  return dnt === '1' || dnt === 'yes';
}

/**
 * Get device type
 */
export function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Parse user agent for browser and OS
 */
export function parseUserAgent(): { browser?: string; os?: string } {
  if (typeof navigator === 'undefined') return {};
  
  const ua = navigator.userAgent;
  let browser: string | undefined;
  let os: string | undefined;
  
  // Detect browser
  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = 'Opera';
  }
  
  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }
  
  return { browser, os };
}

/**
 * Get cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Set cookie
 */
function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Hash a string (simple hash for anonymization)
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
