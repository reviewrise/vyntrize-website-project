// Website Analytics Dashboard Service - Calculate metrics and aggregations for website

import { prisma } from '@/lib/prisma';

export interface WebsiteDashboardMetrics {
  totalSessions: number;
  totalPageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
}

export interface WebsiteTrendData {
  date: string;
  sessions: number;
  pageViews: number;
  conversions: number;
}

export interface WebsiteSourceData {
  source: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
}

export interface WebsitePageData {
  url: string;
  views: number;
  avgDuration: number;
}

export class WebsiteDashboardService {
  /**
   * Get dashboard metrics for a date range
   */
  static async getMetrics(startDate: Date, endDate: Date): Promise<WebsiteDashboardMetrics> {
    // Get all page views in date range
    const pageViews = await prisma.pageView.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalPageViews = pageViews.length;

    // Calculate unique visitors (unique sessionIds)
    const uniqueVisitors = new Set(pageViews.map((pv) => pv.sessionId)).size;

    // Calculate sessions (group by sessionId and date)
    const sessionMap = new Map<string, Date[]>();
    pageViews.forEach((pv) => {
      const key = pv.sessionId;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, []);
      }
      sessionMap.get(key)!.push(pv.createdAt);
    });

    const totalSessions = sessionMap.size;

    // Calculate average session duration (time between first and last page view in session)
    let totalDuration = 0;
    let sessionsWithDuration = 0;

    sessionMap.forEach((dates) => {
      if (dates.length > 1) {
        dates.sort((a, b) => a.getTime() - b.getTime());
        const duration = (dates[dates.length - 1].getTime() - dates[0].getTime()) / 1000;
        totalDuration += duration;
        sessionsWithDuration++;
      }
    });

    const avgSessionDuration =
      sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0;

    // Calculate bounce rate (sessions with only 1 page view)
    const bouncedSessions = Array.from(sessionMap.values()).filter(
      (dates) => dates.length === 1
    ).length;
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    // Calculate conversion rate (form submissions / sessions)
    const conversions = await prisma.contactSubmission.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const conversionRate = totalSessions > 0 ? (conversions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      totalPageViews,
      uniqueVisitors,
      avgSessionDuration: Math.round(avgSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  /**
   * Get trend data for charts
   */
  static async getTrends(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<WebsiteTrendData[]> {
    const pageViews = await prisma.pageView.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const conversions = await prisma.contactSubmission.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by date based on granularity
    const grouped = new Map<
      string,
      { pageViews: number; sessions: Set<string>; conversions: number }
    >();

    pageViews.forEach((pv) => {
      const date = this.formatDateByGranularity(pv.createdAt, granularity);
      const existing = grouped.get(date) || {
        pageViews: 0,
        sessions: new Set<string>(),
        conversions: 0,
      };

      existing.pageViews++;
      existing.sessions.add(pv.sessionId);
      grouped.set(date, existing);
    });

    conversions.forEach((conv) => {
      const date = this.formatDateByGranularity(conv.createdAt, granularity);
      const existing = grouped.get(date);
      if (existing) {
        existing.conversions++;
      }
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        sessions: data.sessions.size,
        pageViews: data.pageViews,
        conversions: data.conversions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get top traffic sources
   */
  static async getTopSources(
    startDate: Date,
    endDate: Date,
    limit = 10
  ): Promise<WebsiteSourceData[]> {
    const pageViews = await prisma.pageView.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by source and sessionId to count unique sessions per source
    const sourceSessionMap = new Map<string, Set<string>>();

    pageViews.forEach((pv) => {
      const source = pv.source || 'direct';
      if (!sourceSessionMap.has(source)) {
        sourceSessionMap.set(source, new Set());
      }
      sourceSessionMap.get(source)!.add(pv.sessionId);
    });

    // Get conversions (we'll attribute them proportionally)
    const totalConversions = await prisma.contactSubmission.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSessions = Array.from(sourceSessionMap.values()).reduce(
      (sum, sessions) => sum + sessions.size,
      0
    );

    // Convert to array and calculate metrics
    const sources = Array.from(sourceSessionMap.entries())
      .map(([source, sessions]) => {
        const sessionCount = sessions.size;
        // Proportional conversion attribution
        const conversions =
          totalSessions > 0
            ? Math.round((sessionCount / totalSessions) * totalConversions)
            : 0;
        const conversionRate =
          sessionCount > 0 ? Math.round((conversions / sessionCount) * 10000) / 100 : 0;

        return {
          source,
          sessions: sessionCount,
          conversions,
          conversionRate,
        };
      })
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, limit);

    return sources;
  }

  /**
   * Get top pages
   */
  static async getTopPages(
    startDate: Date,
    endDate: Date,
    limit = 10
  ): Promise<WebsitePageData[]> {
    const pageViews = await prisma.pageView.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by page path
    const pageMap = new Map<string, { views: number; sessions: Set<string> }>();

    pageViews.forEach((pv) => {
      const path = pv.path;
      const existing = pageMap.get(path) || { views: 0, sessions: new Set<string>() };

      existing.views++;
      existing.sessions.add(pv.sessionId);
      pageMap.set(path, existing);
    });

    // Convert to array and sort by views
    const pages = Array.from(pageMap.entries())
      .map(([url, data]) => ({
        url,
        views: data.views,
        avgDuration: 0, // We don't track duration per page yet
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    return pages;
  }

  /**
   * Format date based on granularity
   */
  private static formatDateByGranularity(date: Date, granularity: string): string {
    const d = new Date(date);

    switch (granularity) {
      case 'hour':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;

      case 'day':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;

      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(weekStart.getDate()).padStart(2, '0')}`;

      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      default:
        return d.toISOString().split('T')[0];
    }
  }

  /**
   * Get comparison metrics (current vs previous period)
   */
  static async getComparison(startDate: Date, endDate: Date) {
    const duration = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - duration);
    const previousEnd = new Date(startDate.getTime());

    const [current, previous] = await Promise.all([
      this.getMetrics(startDate, endDate),
      this.getMetrics(previousStart, previousEnd),
    ]);

    return {
      current,
      previous,
      changes: {
        sessions:
          previous.totalSessions > 0
            ? ((current.totalSessions - previous.totalSessions) / previous.totalSessions) * 100
            : 0,
        pageViews:
          previous.totalPageViews > 0
            ? ((current.totalPageViews - previous.totalPageViews) / previous.totalPageViews) * 100
            : 0,
        visitors:
          previous.uniqueVisitors > 0
            ? ((current.uniqueVisitors - previous.uniqueVisitors) / previous.uniqueVisitors) * 100
            : 0,
        conversionRate: current.conversionRate - previous.conversionRate,
      },
    };
  }
}
