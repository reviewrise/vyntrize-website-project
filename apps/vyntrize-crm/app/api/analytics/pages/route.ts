// Analytics Pages API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate date parameters
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Get page view events
    const events = await vyntrizeDb.analyticsEvent.findMany({
      where: {
        eventType: 'page_view',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        pageUrl: true,
        pageTitle: true,
        sessionId: true,
      },
    });

    // Group by page URL
    const pageMap = new Map<
      string,
      {
        url: string;
        title: string;
        views: number;
        uniqueVisitors: Set<string>;
        sessions: Set<string>;
      }
    >();

    events.forEach((event) => {
      const url = event.pageUrl;
      const existing = pageMap.get(url) || {
        url,
        title: event.pageTitle || url,
        views: 0,
        uniqueVisitors: new Set<string>(),
        sessions: new Set<string>(),
      };

      existing.views += 1;
      if (event.sessionId) {
        existing.sessions.add(event.sessionId);
      }

      pageMap.set(url, existing);
    });

    // Convert to array and calculate metrics
    const allPages = Array.from(pageMap.values()).map((data) => ({
      url: data.url,
      title: data.title,
      views: data.views,
      sessions: data.sessions.size,
      bounceRate: 0, // Would need session data to calculate properly
    }));

    // Sort by views
    allPages.sort((a, b) => b.views - a.views);

    // Paginate
    const total = allPages.length;
    const offset = (page - 1) * limit;
    const pages = allPages.slice(offset, offset + limit);

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Pages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages data' },
      { status: 500 }
    );
  }
}
