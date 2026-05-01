'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, getAnalytics } from '@/lib/analytics';

/**
 * Analytics Provider Component
 * Initializes analytics tracking and tracks page views automatically
 */
export function AnalyticsProvider() {
  const pathname = usePathname();

  // Initialize analytics on mount
  useEffect(() => {
    // Initialize tracker
    const tracker = initAnalytics({
      apiEndpoint: '/api/track',
      batchSize: 10,
      flushInterval: 5000,
      respectDNT: true,
      debug: process.env.NODE_ENV === 'development',
    });

    // Track initial page view
    tracker.trackPageView();
  }, []);

  // Track page views on route change
  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      analytics.trackPageView();
    }
  }, [pathname]);

  return null;
}
