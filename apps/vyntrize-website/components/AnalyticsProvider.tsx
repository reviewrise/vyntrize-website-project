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

      // Track initial page view after a small delay to ensure window.location is available
      const trackInitialView = () => {
        // Double-check window.location is available
        if (window.location?.href) {
          console.log('[AnalyticsProvider] Tracking initial page view');
          tracker.trackPageView();
        } else {
          console.log('[AnalyticsProvider] Window location not ready, retrying...');
          setTimeout(trackInitialView, 100);
        }
      };

      // Track after DOM is ready
      if (document.readyState === 'complete') {
        setTimeout(trackInitialView, 100);
      } else {
        window.addEventListener('load', () => {
          setTimeout(trackInitialView, 100);
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
