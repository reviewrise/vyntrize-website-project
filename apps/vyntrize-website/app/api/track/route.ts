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
    const { events } = await request.json() as { events: TrackingEvent[] };
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Process each event
    for (const event of events) {
      await processEvent(event, request);
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('Error processing analytics events:', error);
    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    );
  }
}

async function processEvent(event: TrackingEvent, request: NextRequest) {
  const { type, sessionId, visitorId, url, referrer, timestamp, eventName, eventData, utmSource, utmMedium, utmCampaign, utmContent, utmTerm } = event;

  // Get or create session
  let session = await vyntrizeDb.analyticsSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    // Create new session
    const parsedUrl = new URL(url);
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    session = await vyntrizeDb.analyticsSession.create({
      data: {
        id: sessionId,
        visitorId,
        startedAt: new Date(timestamp),
        lastActivityAt: new Date(timestamp),
        pageViews: 0,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        referrer: referrer || null,
        landingPage: parsedUrl.pathname,
        userAgent,
        ipAddress: ip.split(',')[0].trim(), // Get first IP if multiple
        converted: false,
      },
    });
  }

  // Handle different event types
  switch (type) {
    case 'pageview':
      await handlePageView(session, event);
      break;
    case 'event':
      await handleCustomEvent(session, event);
      break;
    case 'session_end':
      await handleSessionEnd(session, event);
      break;
    case 'session_start':
      // Already handled by session creation
      break;
  }
}

async function handlePageView(session: any, event: TrackingEvent) {
  const parsedUrl = new URL(event.url);
  
  // Create page view event
  await vyntrizeDb.analyticsEvent.create({
    data: {
      sessionId: session.id,
      eventType: 'page_view',
      eventName: 'Page View',
      pageUrl: parsedUrl.pathname,
      pageTitle: '', // Would need to be sent from client
      timestamp: new Date(event.timestamp),
    },
  });

  // Update session
  await vyntrizeDb.analyticsSession.update({
    where: { id: session.id },
    data: {
      pageViews: { increment: 1 },
      lastActivityAt: new Date(event.timestamp),
    },
  });
}

async function handleCustomEvent(session: any, event: TrackingEvent) {
  if (!event.eventName) return;

  const parsedUrl = new URL(event.url);
  
  await vyntrizeDb.analyticsEvent.create({
    data: {
      sessionId: session.id,
      eventType: 'custom',
      eventName: event.eventName,
      pageUrl: parsedUrl.pathname,
      pageTitle: '',
      timestamp: new Date(event.timestamp),
      metadata: event.eventData || {},
    },
  });

  // Update session activity
  await vyntrizeDb.analyticsSession.update({
    where: { id: session.id },
    data: {
      lastActivityAt: new Date(event.timestamp),
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
      lastActivityAt: new Date(event.timestamp),
    },
  });
}
