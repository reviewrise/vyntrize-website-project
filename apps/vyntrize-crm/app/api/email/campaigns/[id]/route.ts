/**
 * Email Campaign Detail API
 * GET /api/email/campaigns/[id] - Get campaign details
 * PATCH /api/email/campaigns/[id] - Update campaign
 * DELETE /api/email/campaigns/[id] - Delete campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get campaign with emails
    const campaign = await vyntrizeDb.emailCampaign.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        template: true,
        emails: {
          select: {
            id: true,
            toEmail: true,
            toName: true,
            status: true,
            sentAt: true,
            openedAt: true,
            clickedAt: true,
            openCount: true,
            clickCount: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        createdAt: campaign.createdAt,
        scheduledAt: campaign.scheduledAt,
        sentAt: campaign.sentAt,
        targetType: campaign.targetType,
        targetFilter: campaign.targetFilter,
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
          bounceRate: campaign.sentCount > 0
            ? ((campaign.bouncedCount / campaign.sentCount) * 100).toFixed(2)
            : '0.00',
        },
        template: campaign.template,
        createdBy: campaign.user,
        emails: campaign.emails,
      },
    });
  } catch (error) {
    console.error('[Campaign Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if campaign exists and belongs to user (or user is admin)
    const campaign = await vyntrizeDb.emailCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.userId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Only allow updating certain fields
    const allowedFields = ['name', 'status', 'scheduledAt'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (field in data) {
        updateData[field] = data[field];
      }
    }

    // Update campaign
    const updated = await vyntrizeDb.emailCampaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      campaign: updated,
    });
  } catch (error) {
    console.error('[Campaign Update API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if campaign exists and belongs to user (or user is admin)
    const campaign = await vyntrizeDb.emailCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.userId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Don't allow deleting campaigns that are currently sending
    if (campaign.status === 'SENDING') {
      return NextResponse.json(
        { error: 'Cannot delete campaign that is currently sending' },
        { status: 400 }
      );
    }

    // Delete campaign (cascade will delete related emails and events)
    await vyntrizeDb.emailCampaign.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('[Campaign Delete API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
