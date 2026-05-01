// Analytics Sources API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // Get all sessions in date range
    const sessions = await vyntrizeDb.analyticsSession.findMany({
      where: {
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        converted: true,
      },
    });

    // Group by source, medium, campaign
    const sourceMap = new Map<
      string,
      {
        source: string;
        medium: string;
        campaign: string;
        sessions: number;
        conversions: number;
      }
    >();

    sessions.forEach((session) => {
      const source = session.utmSource || 'direct';
      const medium = session.utmMedium || 'none';
      const campaign = session.utmCampaign || 'none';
      const key = `${source}|${medium}|${campaign}`;

      const existing = sourceMap.get(key) || {
        source,
        medium,
        campaign,
        sessions: 0,
        conversions: 0,
      };

      sourceMap.set(key, {
        ...existing,
        sessions: existing.sessions + 1,
        conversions: existing.conversions + (session.converted ? 1 : 0),
      });
    });

    // Convert to array and calculate conversion rates
    const sources = Array.from(sourceMap.values())
      .map((data) => ({
        ...data,
        conversionRate:
          data.sessions > 0
            ? Math.round((data.conversions / data.sessions) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, limit);

    return NextResponse.json({
      sources,
      total: sources.length,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Sources API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources data' },
      { status: 500 }
    );
  }
}
