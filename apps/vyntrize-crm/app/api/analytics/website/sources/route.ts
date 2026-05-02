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
    const sortBy = searchParams.get('sortBy') || 'sessions';
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

    // Get conversions
    const conversions = await prisma.contactSubmission.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by source, referrer, and calculate metrics
    const sourceMap = new Map<
      string,
      {
        source: string;
        referrer: string | null;
        sessions: Set<string>;
        pageViews: number;
      }
    >();

    pageViews.forEach((pv) => {
      const source = pv.source || 'direct';
      const referrer = pv.referrer;
      const key = `${source}|${referrer || 'none'}`;

      const existing = sourceMap.get(key) || {
        source,
        referrer,
        sessions: new Set<string>(),
        pageViews: 0,
      };

      existing.sessions.add(pv.sessionId);
      existing.pageViews++;
      sourceMap.set(key, existing);
    });

    // Calculate total sessions for conversion attribution
    const totalSessions = Array.from(sourceMap.values()).reduce(
      (sum, data) => sum + data.sessions.size,
      0
    );

    // Convert to array and calculate metrics
    let sources = Array.from(sourceMap.values()).map((data) => {
      const sessionCount = data.sessions.size;
      // Proportional conversion attribution
      const sourceConversions =
        totalSessions > 0 ? Math.round((sessionCount / totalSessions) * conversions) : 0;
      const conversionRate =
        sessionCount > 0 ? Math.round((sourceConversions / sessionCount) * 10000) / 100 : 0;

      return {
        source: data.source,
        medium: data.referrer ? 'referral' : 'direct',
        campaign: null,
        sessions: sessionCount,
        pageViews: data.pageViews,
        conversions: sourceConversions,
        conversionRate,
      };
    });

    // Sort
    sources.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] || 0;
      const bVal = b[sortBy as keyof typeof b] || 0;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }

      return sortOrder === 'desc'
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });

    return NextResponse.json({
      sources,
      total: sources.length,
    });
  } catch (error) {
    console.error('Website sources API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
