// Daily Metrics Aggregation Job
// This job should be run daily (e.g., via cron) to aggregate analytics data

import { vyntrizeDb } from '@platform/vyntrize-db';

export class DailyMetricsAggregator {
  /**
   * Aggregate metrics for a specific date
   */
  static async aggregateForDate(date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Aggregating metrics for ${startOfDay.toISOString().split('T')[0]}`);

    try {
      // Get all sessions for the day
      const sessions = await vyntrizeDb.analyticsSession.findMany({
        where: {
          startedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Get all events for the day
      const events = await vyntrizeDb.analyticsEvent.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Calculate metrics
      const totalSessions = sessions.length;
      const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size;
      const totalPageViews = events.filter((e) => e.eventType === 'page_view').length;
      const totalEvents = events.length;

      // Calculate average session duration
      const sessionsWithDuration = sessions.filter((s) => s.durationSeconds !== null);
      const avgSessionDuration =
        sessionsWithDuration.length > 0
          ? Math.round(
              sessionsWithDuration.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) /
                sessionsWithDuration.length
            )
          : 0;

      // Calculate bounce rate
      const bouncedSessions = sessions.filter((s) => s.pageViews === 1).length;
      const bounceRate =
        totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 10000) / 100 : 0;

      // Calculate conversion rate
      const conversions = sessions.filter((s) => s.converted).length;
      const conversionRate =
        totalSessions > 0 ? Math.round((conversions / totalSessions) * 10000) / 100 : 0;

      // Get top sources
      const sourceMap = new Map<string, number>();
      sessions.forEach((session) => {
        const source = session.utmSource || 'direct';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });
      const topSources = Array.from(sourceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([source, count]) => ({ source, count }));

      // Get top pages
      const pageMap = new Map<string, number>();
      events
        .filter((e) => e.eventType === 'page_view')
        .forEach((event) => {
          const url = event.pageUrl;
          pageMap.set(url, (pageMap.get(url) || 0) + 1);
        });
      const topPages = Array.from(pageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([url, count]) => ({ url, count }));

      // Store aggregated metrics
      await vyntrizeDb.analyticsDailyMetric.upsert({
        where: {
          date: startOfDay,
        },
        create: {
          date: startOfDay,
          totalSessions,
          uniqueVisitors,
          totalPageViews,
          totalEvents,
          avgSessionDuration,
          bounceRate,
          conversionRate,
          conversions,
          topSources,
          topPages,
        },
        update: {
          totalSessions,
          uniqueVisitors,
          totalPageViews,
          totalEvents,
          avgSessionDuration,
          bounceRate,
          conversionRate,
          conversions,
          topSources,
          topPages,
        },
      });

      console.log(`✓ Aggregated metrics for ${startOfDay.toISOString().split('T')[0]}`);
      console.log(`  - Sessions: ${totalSessions}`);
      console.log(`  - Unique Visitors: ${uniqueVisitors}`);
      console.log(`  - Page Views: ${totalPageViews}`);
      console.log(`  - Conversions: ${conversions}`);
    } catch (error) {
      console.error(`Failed to aggregate metrics for ${startOfDay.toISOString().split('T')[0]}:`, error);
      throw error;
    }
  }

  /**
   * Aggregate metrics for yesterday
   */
  static async aggregateYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await this.aggregateForDate(yesterday);
  }

  /**
   * Aggregate metrics for a date range
   */
  static async aggregateDateRange(startDate: Date, endDate: Date): Promise<void> {
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      await this.aggregateForDate(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Backfill missing aggregations
   */
  static async backfill(daysBack: number = 30): Promise<void> {
    console.log(`Backfilling metrics for the last ${daysBack} days...`);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    await this.aggregateDateRange(startDate, endDate);

    console.log('✓ Backfill complete');
  }
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'yesterday':
          await DailyMetricsAggregator.aggregateYesterday();
          break;
        case 'backfill':
          const days = parseInt(process.argv[3] || '30');
          await DailyMetricsAggregator.backfill(days);
          break;
        case 'date':
          const dateStr = process.argv[3];
          if (!dateStr) {
            console.error('Please provide a date (YYYY-MM-DD)');
            process.exit(1);
          }
          await DailyMetricsAggregator.aggregateForDate(new Date(dateStr));
          break;
        default:
          console.log('Usage:');
          console.log('  tsx aggregate-daily-metrics.ts yesterday');
          console.log('  tsx aggregate-daily-metrics.ts backfill [days]');
          console.log('  tsx aggregate-daily-metrics.ts date YYYY-MM-DD');
          process.exit(1);
      }
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}
