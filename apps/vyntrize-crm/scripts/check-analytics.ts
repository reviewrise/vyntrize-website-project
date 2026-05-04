// Quick script to check analytics data in database
import { vyntrizeDb } from '@platform/vyntrize-db';

async function checkAnalytics() {
  try {
    console.log('Checking analytics data...\n');

    // Count sessions
    const sessionCount = await vyntrizeDb.analyticsSession.count();
    console.log(`Total sessions: ${sessionCount}`);

    // Get recent sessions
    const recentSessions = await vyntrizeDb.analyticsSession.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        startedAt: true,
        pageViews: true,
        eventsCount: true,
        landingPage: true,
        deviceType: true,
        browser: true,
      },
    });

    console.log('\nRecent sessions:');
    console.log(JSON.stringify(recentSessions, null, 2));

    // Count events
    const eventCount = await vyntrizeDb.analyticsEvent.count();
    console.log(`\nTotal events: ${eventCount}`);

    // Get recent events
    const recentEvents = await vyntrizeDb.analyticsEvent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sessionId: true,
        eventType: true,
        eventName: true,
        pageUrl: true,
        createdAt: true,
      },
    });

    console.log('\nRecent events:');
    console.log(JSON.stringify(recentEvents, null, 2));

    await vyntrizeDb.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await vyntrizeDb.$disconnect();
    process.exit(1);
  }
}

checkAnalytics();
