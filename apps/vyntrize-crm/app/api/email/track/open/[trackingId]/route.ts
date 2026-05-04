/**
 * Email Open Tracking Endpoint
 * GET /api/email/track/open/[trackingId]
 * Returns a 1x1 transparent GIF pixel
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrackingService } from '@/lib/email/tracking-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;

    // Extract metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Record the open event (async, don't wait)
    TrackingService.recordOpen(trackingId, {
      ipAddress,
      userAgent,
      timestamp: new Date(),
    }).catch(error => {
      console.error('[Track Open] Error recording open:', error);
    });

    // Return 1x1 transparent GIF
    const pixel = TrackingService.getTrackingPixel();

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Track Open] Error:', error);
    
    // Still return pixel even on error
    const pixel = TrackingService.getTrackingPixel();
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  }
}
