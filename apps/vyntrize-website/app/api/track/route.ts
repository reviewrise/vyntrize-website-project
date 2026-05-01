// Analytics tracking API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { EventProcessor } from '@/lib/analytics/event-processor';
import { isBotRequest } from '@/lib/analytics/bot-detector';
import { AnalyticsEvent } from '@/lib/analytics/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Rate limiting map (in-memory, simple implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * POST /api/track
 * Receive and process analytics events
 */
export async function POST(request: NextRequest) {
  try {
    // Check for bot
    if (isBotRequest(request)) {
      return NextResponse.json(
        { error: 'Bot detected' },
        { status: 403 }
      );
    }
    
    // Rate limiting
    const clientId = getClientIdentifier(request);
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid request: events array required' },
        { status: 400 }
      );
    }
    
    // Validate each event
    const events: AnalyticsEvent[] = body.events.filter((event: any) =>
      EventProcessor.validateEvent(event)
    );
    
    if (events.length === 0) {
      return NextResponse.json(
        { error: 'No valid events provided' },
        { status: 400 }
      );
    }
    
    // Process events asynchronously
    await EventProcessor.processEvents(events, request);
    
    // Return success with session ID
    return NextResponse.json({
      success: true,
      processed: events.length,
      sessionId: events[0]?.sessionId,
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Use IP address or session ID for rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
              request.headers.get('x-real-ip') ||
              'unknown';
  return ip;
}

/**
 * Check if client is rate limited
 */
function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(clientId);
  
  if (!limit || now > limit.resetAt) {
    // Reset or create new limit
    rateLimitMap.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }
  
  if (limit.count >= RATE_LIMIT) {
    return true;
  }
  
  // Increment count
  limit.count++;
  return false;
}

// Clean up old rate limit entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 60 * 1000); // Clean up every minute
}
