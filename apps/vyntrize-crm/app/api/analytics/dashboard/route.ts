// Analytics Dashboard API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { DashboardService } from '@/lib/analytics/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const granularity = (searchParams.get('granularity') as 'hour' | 'day' | 'week' | 'month') || 'day';
    const includeComparison = searchParams.get('includeComparison') === 'true';

    console.log('[Dashboard API] Query params:', { startDateParam, endDateParam, granularity, includeComparison });

    // Validate date parameters
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    console.log('[Dashboard API] Parsed dates:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Fetch dashboard data
    console.log('[Dashboard API] Fetching metrics...');
    const [metrics, trends, topSources, topPages, comparison] = await Promise.all([
      DashboardService.getMetrics(startDate, endDate),
      DashboardService.getTrends(startDate, endDate, granularity),
      DashboardService.getTopSources(startDate, endDate, 10),
      DashboardService.getTopPages(startDate, endDate, 10),
      includeComparison ? DashboardService.getComparison(startDate, endDate) : null,
    ]);

    console.log('[Dashboard API] Metrics result:', metrics);
    console.log('[Dashboard API] Trends count:', trends.length);
    console.log('[Dashboard API] Top sources count:', topSources.length);
    console.log('[Dashboard API] Top pages count:', topPages.length);

    return NextResponse.json({
      metrics,
      trends,
      topSources,
      topPages,
      comparison,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        granularity,
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
