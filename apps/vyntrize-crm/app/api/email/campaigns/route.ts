/**
 * Email Campaigns API
 * GET /api/email/campaigns - List campaigns
 * POST /api/email/campaigns - Create campaign draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    // Create draft campaign
    const campaign = await vyntrizeDb.emailCampaign.create({
      data: {
        name: data.name,
        subject: data.subject || 'Untitled',
        templateId: data.templateId || null,
        status: 'DRAFT',
        targetType: 'manual',
        totalRecipients: data.recipients?.length || 0,
        userId: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      message: 'Draft campaign created successfully',
    });
  } catch (error) {
    console.error('[Campaigns API] Error creating draft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get campaigns
    const [campaigns, total] = await Promise.all([
      vyntrizeDb.emailCampaign.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              emails: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      vyntrizeDb.emailCampaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        createdAt: campaign.createdAt,
        scheduledAt: campaign.scheduledAt,
        sentAt: campaign.sentAt,
        stats: {
          totalRecipients: campaign.totalRecipients,
          sent: campaign.sentCount,
          delivered: campaign.deliveredCount,
          opened: campaign.openedCount,
          clicked: campaign.clickedCount,
          bounced: campaign.bouncedCount,
          failed: campaign.failedCount,
          openRate: campaign.sentCount > 0 
            ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(2)
            : '0.00',
          clickRate: campaign.sentCount > 0
            ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(2)
            : '0.00',
        },
        template: campaign.template,
        createdBy: campaign.user,
        emailCount: campaign._count.emails,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Campaigns API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
