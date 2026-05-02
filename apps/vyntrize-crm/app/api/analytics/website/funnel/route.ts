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

    // Get all form submissions in date range
    const submissions = await prisma.contactSubmission.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate funnel steps
    // Step 1: Landing (all unique sessions)
    const uniqueSessions = new Set(pageViews.map((pv) => pv.sessionId));
    const landingCount = uniqueSessions.size;

    // Step 2: Engagement (sessions with 2+ page views)
    const sessionPageCounts = new Map<string, number>();
    pageViews.forEach((pv) => {
      sessionPageCounts.set(pv.sessionId, (sessionPageCounts.get(pv.sessionId) || 0) + 1);
    });
    const engagedCount = Array.from(sessionPageCounts.values()).filter((count) => count >= 2)
      .length;

    // Step 3: Contact Page View (sessions that viewed /contact)
    const contactPageSessions = new Set(
      pageViews.filter((pv) => pv.path === '/contact').map((pv) => pv.sessionId)
    );
    const contactViewCount = contactPageSessions.size;

    // Step 4: Form Submission (actual conversions)
    const submissionCount = submissions.length;

    // Calculate conversion rates and drop-offs
    const steps = [
      {
        name: 'Landing',
        count: landingCount,
        conversionRate: 100,
        dropOffRate: 0,
      },
      {
        name: 'Engagement (2+ pages)',
        count: engagedCount,
        conversionRate: landingCount > 0 ? (engagedCount / landingCount) * 100 : 0,
        dropOffRate: landingCount > 0 ? ((landingCount - engagedCount) / landingCount) * 100 : 0,
      },
      {
        name: 'Contact Page View',
        count: contactViewCount,
        conversionRate: engagedCount > 0 ? (contactViewCount / engagedCount) * 100 : 0,
        dropOffRate:
          engagedCount > 0 ? ((engagedCount - contactViewCount) / engagedCount) * 100 : 0,
      },
      {
        name: 'Form Submission',
        count: submissionCount,
        conversionRate:
          contactViewCount > 0 ? (submissionCount / contactViewCount) * 100 : 0,
        dropOffRate:
          contactViewCount > 0
            ? ((contactViewCount - submissionCount) / contactViewCount) * 100
            : 0,
      },
    ];

    const overallConversionRate =
      landingCount > 0 ? (submissionCount / landingCount) * 100 : 0;

    return NextResponse.json({
      steps,
      overallConversionRate,
    });
  } catch (error) {
    console.error('Website funnel API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
