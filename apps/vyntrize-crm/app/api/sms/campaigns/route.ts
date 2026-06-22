/**
 * GET  /api/sms/campaigns         — list SMS campaigns
 * POST /api/sms/campaigns         — create a new SMS campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession }               from '@/lib/session';
import { prisma }                   from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q        = searchParams.get('q') || '';
    const status   = searchParams.get('status') || 'all';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 20;

    const where: any = {};
    if (q) {
      where.OR = [
        { name:    { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [campaigns, total] = await Promise.all([
      (prisma as any).smsCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        include: {
          user:     { select: { id: true, displayName: true, email: true } },
          template: { select: { id: true, name: true } },
          _count:   { select: { smsLogs: true } },
        },
      }),
      (prisma as any).smsCampaign.count({ where }),
    ]);

    return NextResponse.json({ campaigns, total, page, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('[GET /api/sms/campaigns]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      message,
      templateId,
      status = 'DRAFT',
      targetType = 'manual',
      targetFilter,
      recipients = [],
      scheduledAt,
    } = body;

    if (!name || !message) {
      return NextResponse.json({ error: 'name and message are required' }, { status: 400 });
    }

    // Create the campaign
    const campaign = await (prisma as any).smsCampaign.create({
      data: {
        name,
        message,
        templateId: templateId || null,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        targetType,
        targetFilter: targetFilter || null,
        totalRecipients: recipients.length,
        userId: session.userId,
      },
    });

    return NextResponse.json({ campaign, campaignId: campaign.id }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/sms/campaigns]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
