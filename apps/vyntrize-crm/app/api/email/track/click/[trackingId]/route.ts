/**
 * Email Click Tracking Endpoint
 * GET /api/email/track/click/[trackingId]?url=...
 * Records click and redirects to original URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrackingService } from '@/lib/email/tracking-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Extract metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Record the click event (async, don't wait)
    TrackingService.recordClick(trackingId, url, {
      ipAddress,
      userAgent,
      timestamp: new Date(),
    }).catch(error => {
      console.error('[Track Click] Error recording click:', error);
    });

    // Redirect to original URL
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error('[Track Click] Error:', error);
    
    // Try to redirect anyway
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    
    if (url) {
      return NextResponse.redirect(url, 302);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
