// GET /api/email/track/open/:trackingId - Track email opens

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const id = parseInt(trackingId, 10);
    if (isNaN(id)) {
      return new NextResponse(TRACKING_PIXEL, {
        status: 200,
        headers: { 'Content-Type': 'image/gif' },
      });
    }

    // Find email tracking record
    const tracking = await prisma.emailTracking.findUnique({
      where: { id },
      include: {
        lead: true,
      },
    });

    if (tracking) {
      // Update tracking record
      await prisma.emailTracking.update({
        where: { id },
        data: {
          openedAt: tracking.openedAt || new Date(), // Only set first open
          openCount: {
            increment: 1,
          },
        },
      });

      // Emit EMAIL_OPENED event for agents
      if (tracking.leadId) {
        await eventBus.emitCRMEvent(CRMEvent.EMAIL_OPENED, {
          leadId: tracking.leadId,
          metadata: {
            trackingId,
            emailId: tracking.id,
            timestamp: new Date().toISOString(),
            openCount: tracking.openCount + 1,
            firstOpen: !tracking.openedAt,
          },
        });

        console.log(`[EmailTracking] Email opened: ${trackingId} for lead ${tracking.leadId}`);
      }
    }

    // Always return tracking pixel (even if tracking record not found)
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[EmailTracking] Error tracking email open:', error);
    
    // Still return tracking pixel on error
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }
}
