// Analytics Funnel API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';

interface FunnelStep {
  name: string;
  eventType: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

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

    // Define default funnel steps
    const funnelSteps = [
      { name: 'Website Visit', eventType: 'page_view' },
      { name: 'Viewed Services', eventType: 'page_view', pageUrl: '/services' },
      { name: 'Viewed Contact', eventType: 'page_view', pageUrl: '/contact' },
      { name: 'Form Submission', eventType: 'form_submit' },
    ];

    // Calculate counts for each step
    const stepCounts: FunnelStep[] = [];
    let previousCount = 0;

    for (let i = 0; i < funnelSteps.length; i++) {
      const step = funnelSteps[i];
      
      // Build where clause
      const where: any = {
        eventType: step.eventType,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Add page URL filter if specified
      if ('pageUrl' in step && step.pageUrl) {
        where.pageUrl = {
          contains: step.pageUrl,
        };
      }

      // Count unique visitors for this step
      const events = await vyntrizeDb.analyticsEvent.findMany({
        where,
        select: { visitorId: true },
        distinct: ['visitorId'],
      });

      const count = events.length;
      const conversionRate = i === 0 ? 100 : previousCount > 0 ? (count / previousCount) * 100 : 0;
      const dropOffRate = i === 0 ? 0 : previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;

      stepCounts.push({
        name: step.name,
        eventType: step.eventType,
        count,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropOffRate: Math.round(dropOffRate * 100) / 100,
      });

      previousCount = count;
    }

    // Calculate overall conversion rate
    const overallConversionRate =
      stepCounts[0].count > 0
        ? (stepCounts[stepCounts.length - 1].count / stepCounts[0].count) * 100
        : 0;

    return NextResponse.json({
      steps: stepCounts,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Funnel API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funnel data' },
      { status: 500 }
    );
  }
}
