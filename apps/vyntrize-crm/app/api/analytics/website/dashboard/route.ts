import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { WebsiteDashboardService } from '@/lib/analytics/website-dashboard-service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const granularity = (searchParams.get('granularity') as 'hour' | 'day' | 'week' | 'month') || 'day';
    const includeComparison = searchParams.get('includeComparison') === 'true';

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Fetch all data in parallel
    const [metrics, trends, topSources, topPages, comparison] = await Promise.all([
      WebsiteDashboardService.getMetrics(startDate, endDate),
      WebsiteDashboardService.getTrends(startDate, endDate, granularity),
      WebsiteDashboardService.getTopSources(startDate, endDate, 10),
      WebsiteDashboardService.getTopPages(startDate, endDate, 10),
      includeComparison
        ? WebsiteDashboardService.getComparison(startDate, endDate)
        : null,
    ]);

    return NextResponse.json({
      metrics,
      trends,
      topSources,
      topPages,
      comparison,
    });
  } catch (error) {
    console.error('Website dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
