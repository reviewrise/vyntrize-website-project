import { prisma }                    from '@/lib/prisma';
import { getSession }                from '@/lib/session';
import { redirect, notFound }        from 'next/navigation';
import SmsCampaignDetailClient       from './SmsCampaignDetailClient';

export default async function SmsCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const { id } = await params;

  const campaign = await (prisma as any).smsCampaign.findUnique({
    where:   { id },
    include: {
      user:     { select: { id: true, displayName: true, email: true } },
      template: { select: { id: true, name: true } },
      smsLogs: {
        orderBy: { createdAt: 'desc' },
        take:    500,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      },
    },
  });

  if (!campaign) notFound();

  return (
    <SmsCampaignDetailClient
      campaign={{
        ...campaign,
        createdAt:   campaign.createdAt.toISOString(),
        sentAt:      campaign.sentAt?.toISOString()      ?? null,
        completedAt: campaign.completedAt?.toISOString() ?? null,
        scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
      }}
      smsLogs={campaign.smsLogs.map((l: any) => ({
        id:           l.id,
        toPhone:      l.toPhone,
        content:      l.content,
        status:       l.status,
        sentAt:       l.sentAt?.toISOString() ?? null,
        errorMessage: l.errorMessage ?? null,
        contact:      l.contact,
      }))}
    />
  );
}
