// API endpoint for lead activities

import { NextRequest, NextResponse } from 'next/server';
import { LeadActivityService } from '@/lib/services/lead-activity-service';
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
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const activityType = searchParams.get('activityType') || undefined;

    // Validate parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get activities
    const result = await LeadActivityService.getLeadActivities(leadId, {
      page,
      pageSize,
      activityType,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching lead activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
