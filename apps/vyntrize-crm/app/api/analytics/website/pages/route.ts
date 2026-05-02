import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortBy = searchParams.get('sortBy') || 'views';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    // Get all page views in date range
    const pageViews = await prisma.pageView.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by page path and calculate metrics
    const pageMap = new Map<
      string,
      {
        url: string;
        views: number;
        sessions: Set<string>;
        bounces: number;
      }
    >();

    // Track sessions per page
    const sessionPages = new Map<string, Set<string>>();

    pageViews.forEach((pv) => {
      const path = pv.path;

      // Update page metrics
      const existing = pageMap.get(path) || {
        url: path,
        views: 0,
        sessions: new Set<string>(),
        bounces: 0,
      };

      existing.views++;
      existing.sessions.add(pv.sessionId);
      pageMap.set(path, existing);

      // Track pages per session
      if (!sessionPages.has(pv.sessionId)) {
        sessionPages.set(pv.sessionId, new Set());
      }
      sessionPages.get(pv.sessionId)!.add(path);
    });

    // Calculate bounces (sessions that only viewed this page)
    pageMap.forEach((data, path) => {
      data.sessions.forEach((sessionId) => {
        const pagesInSession = sessionPages.get(sessionId);
        if (pagesInSession && pagesInSession.size === 1 && pagesInSession.has(path)) {
          data.bounces++;
        }
      });
    });

    // Convert to array and calculate additional metrics
    let pages = Array.from(pageMap.values()).map((data) => {
      const sessionCount = data.sessions.size;
      const bounceRate =
        sessionCount > 0 ? Math.round((data.bounces / sessionCount) * 10000) / 100 : 0;

      return {
        url: data.url,
        title: data.url, // We don't track page titles yet
        views: data.views,
        sessions: sessionCount,
        bounceRate,
        avgTimeOnPage: 0, // We don't track time on page yet
      };
    });

    // Sort
    pages.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] || 0;
      const bVal = b[sortBy as keyof typeof b] || 0;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }

      return sortOrder === 'desc'
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });

    // Paginate
    const total = pages.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPages = pages.slice(startIndex, endIndex);

    return NextResponse.json({
      pages: paginatedPages,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Website pages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
