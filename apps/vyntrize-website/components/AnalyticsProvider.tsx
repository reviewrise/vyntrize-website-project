'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, getAnalytics } from '@/lib/analytics';
import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * Analytics Provider Component
 * Initializes analytics tracking and tracks page views automatically
 * Respects cookie consent preferences
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const { consent } = useCookieConsent();

  // Initialize analytics on mount (only if analytics consent is given)
  useEffect(() => {
    // Only initialize if analytics consent is given and we're in the browser
    if (consent?.analytics && typeof window !== 'undefined') {
      console.log('[AnalyticsProvider] Initializing analytics');
      
      const tracker = initAnalytics({
        apiEndpoint: '/api/track',
        batchSize: 10,
        flushInterval: 5000,
        respectDNT: true,
        debug: process.env.NODE_ENV === 'development',
      });

      // Track initial page view after ensuring DOM is ready
      if (document.readyState === 'complete') {
        console.log('[AnalyticsProvider] Tracking initial page view (already loaded)');
        tracker.trackPageView();
      } else {
        window.addEventListener('load', () => {
          console.log('[AnalyticsProvider] Tracking initial page view (on load)');
          tracker.trackPageView();
        }, { once: true });
      }
    }
  }, [consent?.analytics]);

  // Track page views on route change (only if consent given)
  useEffect(() => {
    if (consent?.analytics) {
      const analytics = getAnalytics();
      if (analytics) {
        console.log('[AnalyticsProvider] Route changed, tracking page view');
        analytics.trackPageView();
      }
    }
  }, [pathname, consent?.analytics]);

  return null;
}
