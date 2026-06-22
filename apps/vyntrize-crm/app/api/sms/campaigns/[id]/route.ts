/**
 * GET    /api/sms/campaigns/[id]   — get campaign + logs
 * PATCH  /api/sms/campaigns/[id]   — update campaign
 * DELETE /api/sms/campaigns/[id]   — delete a DRAFT campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession }               from '@/lib/session';
import { prisma }                   from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const campaign = await (prisma as any).smsCampaign.findUnique({
      where: { id },
      include: {
        user:     { select: { id: true, displayName: true, email: true } },
        template: { select: { id: true, name: true } },
        smsLogs: {
          orderBy: { createdAt: 'desc' },
          take:    200,
          include: {
            contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[GET /api/sms/campaigns/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const campaign = await (prisma as any).smsCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const updated = await (prisma as any).smsCampaign.update({
      where: { id },
      data: {
        ...(body.name        !== undefined && { name:        body.name }),
        ...(body.message     !== undefined && { message:     body.message }),
        ...(body.templateId  !== undefined && { templateId:  body.templateId }),
        ...(body.status      !== undefined && { status:      body.status }),
        ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/sms/campaigns/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const campaign = await (prisma as any).smsCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only DRAFT campaigns can be deleted' }, { status: 400 });
    }

    // Delete logs first
    await (prisma as any).smsLog.deleteMany({ where: { campaignId: id } });
    await (prisma as any).smsCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/sms/campaigns/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
