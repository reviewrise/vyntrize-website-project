/**
 * Analytics Tracking API Endpoint
 * Receives tracking events from the website and stores them in the CRM database
 */

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';

interface TrackingEvent {
  type: 'pageview' | 'event' | 'session_start' | 'session_end';
  timestamp: number;
  url: string;
  referrer: string;
  sessionId: string;
  visitorId: string;
  eventName?: string;
  eventData?: Record<string, any>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Track API] Received request:', JSON.stringify(body, null, 2));
    
    const { events } = body as { events: TrackingEvent[] };
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      console.log('[Track API] No events provided');
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    console.log(`[Track API] Processing ${events.length} events`);

    // Process each event
    let processed = 0;
    let errors = 0;
    
    for (const event of events) {
      try {
        await processEvent(event, request);
        processed++;
        console.log(`[Track API] Successfully processed event ${processed}/${events.length}`);
      } catch (error) {
        errors++;
        console.error(`[Track API] Error processing event:`, error);
      }
    }

    console.log(`[Track API] Completed: ${processed} processed, ${errors} errors`);
    return NextResponse.json({ success: true, processed, errors });
  } catch (error) {
    console.error('[Track API] Error processing analytics events:', error);
    return NextResponse.json(
      { error: 'Failed to process events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function processEvent(event: TrackingEvent, request: NextRequest) {
  const { type, sessionId, visitorId, url, referrer, timestamp, eventName, eventData, utmSource, utmMedium, utmCampaign, utmContent, utmTerm } = event;

  console.log(`[Track API] Processing ${type} event for session ${sessionId}`);

  // Validate required fields
  if (!url || !sessionId || !visitorId) {
    console.error('[Track API] Invalid event data:', { url, sessionId, visitorId });
    return;
  }

  // Parse URL safely
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    console.error('[Track API] Invalid URL:', url);
    return;
  }

  // Get or create session
  let session = await vyntrizeDb.analyticsSession.findUnique({
    where: { sessionId },
  });

  console.log(`[Track API] Session lookup result:`, session ? 'found' : 'not found');

  if (!session) {
    // Create new session
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    // Parse user agent for device info (basic parsing)
    const deviceType = userAgent.includes('Mobile') ? 'mobile' : userAgent.includes('Tablet') ? 'tablet' : 'desktop';
    const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Other';
    const os = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : userAgent.includes('Linux') ? 'Linux' : 'Other';

    console.log(`[Track API] Creating new session with data:`, {
      sessionId,
      visitorId,
      landingPage: parsedUrl.pathname,
      deviceType,
      browser,
      os,
    });

    session = await vyntrizeDb.analyticsSession.create({
      data: {
        sessionId,
        visitorId,
        startedAt: new Date(timestamp),
        pageViews: 0,
        eventsCount: 0,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        entryReferrer: referrer || null,
        landingPage: parsedUrl.pathname,
        deviceType,
        browser,
        os,
        converted: false,
      },
    });

    console.log(`[Track API] Session created with ID:`, session.id);
  }

  // Handle different event types
  switch (type) {
    case 'pageview':
      console.log(`[Track API] Handling page view`);
      await handlePageView(session, event);
      break;
    case 'event':
      console.log(`[Track API] Handling custom event`);
      await handleCustomEvent(session, event);
      break;
    case 'session_end':
      console.log(`[Track API] Handling session end`);
      await handleSessionEnd(session, event);
      break;
    case 'session_start':
      console.log(`[Track API] Session start already handled by session creation`);
      // Already handled by session creation
      break;
  }
}

async function handlePageView(session: any, event: TrackingEvent) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(event.url);
  } catch (error) {
    console.error('Invalid URL in page view:', event.url);
    return;
  }

  // Parse user agent for device info
  const userAgent = event.eventData?.userAgent || '';
  const deviceType = userAgent.includes('Mobile') ? 'mobile' : userAgent.includes('Tablet') ? 'tablet' : 'desktop';
  const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Other';
  const os = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : userAgent.includes('Linux') ? 'Linux' : 'Other';
  
  // Create page view event
  await vyntrizeDb.analyticsEvent.create({
    data: {
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      eventType: 'page_view',
      eventName: 'Page View',
      pageUrl: parsedUrl.pathname,
      pageTitle: event.eventData?.pageTitle || '',
      referrer: event.referrer || null,
      utmSource: event.utmSource || null,
      utmMedium: event.utmMedium || null,
      utmCampaign: event.utmCampaign || null,
      utmContent: event.utmContent || null,
      utmTerm: event.utmTerm || null,
      userAgent: userAgent || null,
      deviceType,
      browser,
      os,
      createdAt: new Date(event.timestamp),
    },
  });

  // Update session
  await vyntrizeDb.analyticsSession.update({
    where: { id: session.id },
    data: {
      pageViews: { increment: 1 },
      eventsCount: { increment: 1 },
      updatedAt: new Date(event.timestamp),
    },
  });
}

async function handleCustomEvent(session: any, event: TrackingEvent) {
  if (!event.eventName) return;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(event.url);
  } catch (error) {
    console.error('Invalid URL in custom event:', event.url);
    return;
  }

  // Parse user agent for device info
  const userAgent = event.eventData?.userAgent || '';
  const deviceType = userAgent.includes('Mobile') ? 'mobile' : userAgent.includes('Tablet') ? 'tablet' : 'desktop';
  const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Other';
  const os = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : userAgent.includes('Linux') ? 'Linux' : 'Other';
  
  await vyntrizeDb.analyticsEvent.create({
    data: {
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      eventType: 'custom',
      eventName: event.eventName,
      eventData: event.eventData || {},
      pageUrl: parsedUrl.pathname,
      pageTitle: event.eventData?.pageTitle || '',
      referrer: event.referrer || null,
      userAgent: userAgent || null,
      deviceType,
      browser,
      os,
      createdAt: new Date(event.timestamp),
    },
  });

  // Update session activity
  await vyntrizeDb.analyticsSession.update({
    where: { id: session.id },
    data: {
      eventsCount: { increment: 1 },
      updatedAt: new Date(event.timestamp),
    },
  });
}

async function handleSessionEnd(session: any, event: TrackingEvent) {
  const duration = event.eventData?.duration || 0;
  const pageViews = event.eventData?.pageViews || session.pageViews;

  await vyntrizeDb.analyticsSession.update({
    where: { id: session.id },
    data: {
      endedAt: new Date(event.timestamp),
      durationSeconds: duration,
      pageViews,
      updatedAt: new Date(event.timestamp),
    },
  });
}
