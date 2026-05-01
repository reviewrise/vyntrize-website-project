// Analytics Dashboard Service - Calculate metrics and aggregations

import { vyntrizeDb } from '@platform/vyntrize-db';

export interface DashboardMetrics {
  totalSessions: number;
  totalPageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
}

export interface TrendData {
  date: string;
  sessions: number;
  pageViews: number;
  conversions: number;
}

export interface SourceData {
  source: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
}

export interface PageData {
  url: string;
  views: number;
  avgDuration: number;
}

export class DashboardService {
  /**
   * Get dashboard metrics for a date range
   */
  static async getMetrics(startDate: Date, endDate: Date): Promise<DashboardMetrics> {
    // Get sessions in date range
    const sessions = await vyntrizeDb.analyticsSession.findMany({
      where: {
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSessions = sessions.length;
    const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size;
    const totalPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0);

    // Calculate average session duration
    const sessionsWithDuration = sessions.filter((s) => s.durationSeconds !== null);
    const avgSessionDuration =
      sessionsWithDuration.length > 0
        ? sessionsWithDuration.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) /
          sessionsWithDuration.length
        : 0;

    // Calculate bounce rate (sessions with only 1 page view)
    const bouncedSessions = sessions.filter((s) => s.pageViews === 1).length;
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    // Calculate conversion rate
    const conversions = sessions.filter((s) => s.converted).length;
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
  ): Promise<TrendData[]> {
    const sessions = await vyntrizeDb.analyticsSession.findMany({
      where: {
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    // Group by date based on granularity
    const grouped = new Map<string, { sessions: number; pageViews: number; conversions: number }>();

    sessions.forEach((session) => {
      const date = this.formatDateByGranularity(session.startedAt, granularity);
      const existing = grouped.get(date) || { sessions: 0, pageViews: 0, conversions: 0 };

      grouped.set(date, {
        sessions: existing.sessions + 1,
        pageViews: existing.pageViews + session.pageViews,
        conversions: existing.conversions + (session.converted ? 1 : 0),
      });
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      sessions: data.sessions,
      pageViews: data.pageViews,
      conversions: data.conversions,
    }));
  }

  /**
   * Get top traffic sources
   */
  static async getTopSources(startDate: Date, endDate: Date, limit = 10): Promise<SourceData[]> {
    const sessions = await vyntrizeDb.analyticsSession.findMany({
      where: {
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by source
    const sourceMap = new Map<string, { sessions: number; conversions: number }>();

    sessions.forEach((session) => {
      const source = session.utmSource || 'direct';
      const existing = sourceMap.get(source) || { sessions: 0, conversions: 0 };

      sourceMap.set(source, {
        sessions: existing.sessions + 1,
        conversions: existing.conversions + (session.converted ? 1 : 0),
      });
    });

    // Convert to array and sort by sessions
    const sources = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        sessions: data.sessions,
        conversions: data.conversions,
        conversionRate:
          data.sessions > 0
            ? Math.round((data.conversions / data.sessions) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, limit);

    return sources;
  }

  /**
   * Get top pages
   */
  static async getTopPages(startDate: Date, endDate: Date, limit = 10): Promise<PageData[]> {
    const events = await vyntrizeDb.analyticsEvent.findMany({
      where: {
        eventType: 'page_view',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by page URL
    const pageMap = new Map<string, { views: number; totalDuration: number; count: number }>();

    events.forEach((event) => {
      const url = event.pageUrl;
      const existing = pageMap.get(url) || { views: 0, totalDuration: 0, count: 0 };

      pageMap.set(url, {
        views: existing.views + 1,
        totalDuration: existing.totalDuration,
        count: existing.count,
      });
    });

    // Convert to array and sort by views
    const pages = Array.from(pageMap.entries())
      .map(([url, data]) => ({
        url,
        views: data.views,
        avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
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
