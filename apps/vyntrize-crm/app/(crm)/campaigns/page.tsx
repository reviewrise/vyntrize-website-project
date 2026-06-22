import { prisma }           from '@/lib/prisma';
import { getSession }       from '@/lib/session';
import { redirect }         from 'next/navigation';
import CampaignsClient      from './CampaignsClient';

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const { q = '', status = 'all', page = '1' } = await searchParams;
  const pageNum  = Math.max(1, parseInt(page, 10));
  const pageSize = 20;

  // ── Build where ──────────────────────────────────────────────────────────────

  const emailWhere: any = {};
  const smsWhere:   any = {};

  if (q) {
    emailWhere.OR = [
      { name:    { contains: q, mode: 'insensitive' as const } },
      { subject: { contains: q, mode: 'insensitive' as const } },
    ];
    smsWhere.OR = [
      { name:    { contains: q, mode: 'insensitive' as const } },
      { message: { contains: q, mode: 'insensitive' as const } },
    ];
  }

  if (status !== 'all') {
    emailWhere.status = status.toUpperCase();
    smsWhere.status   = status.toUpperCase();
  }

  // ── Fetch both ────────────────────────────────────────────────────────────────

  const [emailCampaigns, smsCampaigns] = await Promise.all([
    prisma.emailCampaign.findMany({
      where:   emailWhere,
      orderBy: { createdAt: 'desc' },
      skip:    (pageNum - 1) * pageSize,
      take:    pageSize,
      include: {
        user: { select: { id: true, displayName: true, email: true } },
      },
    }),
    (prisma as any).smsCampaign.findMany({
      where:   smsWhere,
      orderBy: { createdAt: 'desc' },
      skip:    (pageNum - 1) * pageSize,
      take:    pageSize,
      include: {
        user: { select: { id: true, displayName: true, email: true } },
      },
    }),
  ]);

  const total      = emailCampaigns.length + smsCampaigns.length;
  const totalPages = Math.max(
    Math.ceil(emailCampaigns.length / pageSize),
    Math.ceil(smsCampaigns.length   / pageSize),
    1,
  );

  return (
    <CampaignsClient
      emailCampaigns={emailCampaigns.map(c => ({
        kind:            'email' as const,
        id:              c.id,
        name:            c.name,
        subject:         c.subject,
        status:          c.status,
        totalRecipients: c.totalRecipients,
        sentCount:       c.sentCount,
        openedCount:     c.openedCount,
        clickedCount:    c.clickedCount,
        bouncedCount:    c.bouncedCount,
        failedCount:     c.failedCount,
        createdAt:       c.createdAt.toISOString(),
        sentAt:          c.sentAt?.toISOString() ?? null,
        createdBy:       c.user,
      }))}
      smsCampaigns={smsCampaigns.map((c: any) => ({
        kind:            'sms' as const,
        id:              c.id,
        name:            c.name,
        message:         c.message,
        status:          c.status,
        totalRecipients: c.totalRecipients,
        sentCount:       c.sentCount,
        deliveredCount:  c.deliveredCount,
        failedCount:     c.failedCount,
        createdAt:       c.createdAt.toISOString(),
        sentAt:          c.sentAt?.toISOString() ?? null,
        createdBy:       c.user,
      }))}
      total={total}
      q={q}
      status={status}
      pageNum={pageNum}
      totalPages={totalPages}
    />
  );
}
