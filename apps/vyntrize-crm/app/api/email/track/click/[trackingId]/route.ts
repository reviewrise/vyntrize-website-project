// GET /api/email/track/click/:trackingId - Track email link clicks

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing target URL' },
        { status: 400 }
      );
    }

    // Find email tracking record
    const tracking = await prisma.emailTracking.findUnique({
      where: { id: trackingId },
      include: {
        lead: true,
      },
    });

    if (tracking) {
      // Update tracking record
      await prisma.emailTracking.update({
        where: { id: trackingId },
        data: {
          clickedAt: tracking.clickedAt || new Date(), // Only set first click
          clickCount: {
            increment: 1,
          },
        },
      });

      // Emit EMAIL_CLICKED event for agents
      if (tracking.leadId) {
        await eventBus.emitCRMEvent(CRMEvent.EMAIL_CLICKED, {
          leadId: tracking.leadId,
          metadata: {
            trackingId,
            emailId: tracking.id,
            targetUrl,
            timestamp: new Date().toISOString(),
            clickCount: tracking.clickCount + 1,
            firstClick: !tracking.clickedAt,
          },
        });

        console.log(`[EmailTracking] Email link clicked: ${trackingId} for lead ${tracking.leadId}, URL: ${targetUrl}`);
      }
    }

    // Redirect to target URL
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error('[EmailTracking] Error tracking email click:', error);
    
    // Try to redirect to target URL even on error
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('url');
    
    if (targetUrl) {
      return NextResponse.redirect(targetUrl);
    }
    
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
