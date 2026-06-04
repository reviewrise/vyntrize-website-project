import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// Derive notifications from existing data (no new table needed)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    // 1. Email opens (from EmailLog)
    const emailLogOpens = await prisma.emailLog.findMany({
      where: {
        openedAt: { gte: since, not: null },
        leadId: { not: null },
        lead: { assigneeId: session.userId },
      },
      include: { lead: { include: { contact: true } } },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });

    // 1b. Email opens (from EmailTracking - manual emails)
    const emailTrackingOpens = await prisma.emailTracking.findMany({
      where: {
        openedAt: { gte: since, not: null },
        lead: { assigneeId: session.userId },
      },
      include: { lead: { include: { contact: true } } },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });

    // 2. Email clicks (from EmailLog)
    const emailLogClicks = await prisma.emailLog.findMany({
      where: {
        clickedAt: { gte: since, not: null },
        leadId: { not: null },
        lead: { assigneeId: session.userId },
      },
      include: { lead: { include: { contact: true } } },
      orderBy: { clickedAt: 'desc' },
      take: 20,
    });

    // 2b. Email clicks (from EmailTracking - manual emails)
    const emailTrackingClicks = await prisma.emailTracking.findMany({
      where: {
        clickedAt: { gte: since, not: null },
        lead: { assigneeId: session.userId },
      },
      include: { lead: { include: { contact: true } } },
      orderBy: { clickedAt: 'desc' },
      take: 20,
    });

    // 3. Email replies (from Activity logs)
    const emailReplies = await prisma.activity.findMany({
      where: {
        type: 'EMAIL',
        body: { contains: '**Customer Replied:**' },
        createdAt: { gte: since },
        lead: { assigneeId: session.userId },
      },
      include: { lead: { include: { contact: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 4. Hot leads (score jumped above 70)
    const hotLeads = await prisma.lead.findMany({
      where: {
        score: { gte: 70 },
        updatedAt: { gte: since },
        assigneeId: session.userId,
      },
      include: { contact: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Synthesize notification objects
    const notifications: {
      id: string;
      type: string;
      title: string;
      body: string;
      leadId: string;
      leadName: string;
      createdAt: string;
      read: boolean;
    }[] = [];

    for (const log of emailReplies) {
      const name = log.lead?.contact
        ? `${log.lead.contact.firstName} ${log.lead.contact.lastName}`.trim()
        : 'Unknown';
      notifications.push({
        id: `reply-${log.id}`,
        type: 'email_replied',
        title: `${name} replied to your email`,
        body: log.body.replace('**Customer Replied:**', '').trim().slice(0, 80),
        leadId: log.leadId!,
        leadName: name,
        createdAt: log.createdAt.toISOString(),
        read: false,
      });
    }

    const allOpens = [...emailLogOpens, ...emailTrackingOpens];
    for (const log of allOpens) {
      const name = log.lead?.contact
        ? `${log.lead.contact.firstName} ${log.lead.contact.lastName}`.trim()
        : 'Unknown';
      notifications.push({
        id: `open-${'trackingId' in log ? log.trackingId : log.id}`,
        type: 'email_opened',
        title: `${name} opened your email`,
        body: log.subject,
        leadId: log.leadId!,
        leadName: name,
        createdAt: log.openedAt!.toISOString(),
        read: false,
      });
    }

    const allClicks = [...emailLogClicks, ...emailTrackingClicks];
    for (const log of allClicks) {
      const name = log.lead?.contact
        ? `${log.lead.contact.firstName} ${log.lead.contact.lastName}`.trim()
        : 'Unknown';
      notifications.push({
        id: `click-${'trackingId' in log ? log.trackingId : log.id}`,
        type: 'email_clicked',
        title: `${name} clicked a link in your email`,
        body: log.subject,
        leadId: log.leadId!,
        leadName: name,
        createdAt: log.clickedAt!.toISOString(),
        read: false,
      });
    }

    for (const lead of hotLeads) {
      const name = lead.contact
        ? `${lead.contact.firstName} ${lead.contact.lastName}`.trim()
        : 'Unknown';
      notifications.push({
        id: `hot-${lead.id}`,
        type: 'score_hot',
        title: `${name} is now a hot lead! 🔥`,
        body: `Score: ${lead.score}/100 — time to reach out`,
        leadId: lead.id,
        leadName: name,
        createdAt: lead.updatedAt.toISOString(),
        read: false,
      });
    }

    // Sort all by date desc
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ notifications: notifications.slice(0, 30) });
  } catch (error) {
    console.error('[API] Notifications error:', error);
    return NextResponse.json({ notifications: [] });
  }
}
