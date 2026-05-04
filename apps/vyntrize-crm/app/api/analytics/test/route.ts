// Test endpoint to check analytics data
import { NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function GET() {
  try {
    const sessionCount = await vyntrizeDb.analyticsSession.count();
    const eventCount = await vyntrizeDb.analyticsEvent.count();
    
    const recentSessions = await vyntrizeDb.analyticsSession.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        startedAt: true,
        pageViews: true,
        eventsCount: true,
        landingPage: true,
      },
    });

    const recentEvents = await vyntrizeDb.analyticsEvent.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sessionId: true,
        eventType: true,
        pageUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      counts: {
        sessions: sessionCount,
        events: eventCount,
      },
      recentSessions,
      recentEvents,
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to query database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
