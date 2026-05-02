// API endpoint for lead attribution data

import { NextRequest, NextResponse } from 'next/server';
import { AttributionService } from '@/lib/attribution/attribution-service';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;

    // Get attribution data
    const attribution = await AttributionService.getAttribution(leadId);

    if (!attribution) {
      return NextResponse.json(
        { error: 'Attribution data not found' },
        { status: 404 }
      );
    }

    // Get attribution stats
    const stats = await AttributionService.getAttributionStats(leadId);

    return NextResponse.json({
      attribution,
      stats,
    });
  } catch (error) {
    console.error('Error fetching attribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attribution data' },
      { status: 500 }
    );
  }
}
