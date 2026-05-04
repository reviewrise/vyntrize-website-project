import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import CampaignsClient from './CampaignsClient';

export default async function CampaignsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const { q = '', status = 'all', page = '1' } = await searchParams;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = 20;

    // Build where clause
    const where: any = {};
    
    if (q) {
        where.OR = [
            { name: { contains: q, mode: 'insensitive' as const } },
            { subject: { contains: q, mode: 'insensitive' as const } },
        ];
    }

    if (status !== 'all') {
        where.status = status.toUpperCase();
    }

    // Fetch campaigns with stats
    const [campaigns, total] = await Promise.all([
        prisma.emailCampaign.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * pageSize,
            take: pageSize,
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        emails: true,
                    },
                },
            },
        }),
        prisma.emailCampaign.count({ where }),
    ]);

    return (
        <CampaignsClient
            campaigns={campaigns.map(c => ({
                id: c.id,
                name: c.name,
                subject: c.subject,
                status: c.status,
                totalRecipients: c.totalRecipients,
                sentCount: c.sentCount,
                openedCount: c.openedCount,
                clickedCount: c.clickedCount,
                bouncedCount: c.bouncedCount,
                failedCount: c.failedCount,
                createdAt: c.createdAt.toISOString(),
                sentAt: c.sentAt?.toISOString() || null,
                createdBy: c.user,
                emailCount: c._count.emails,
            }))}
            total={total}
            q={q}
            status={status}
            pageNum={pageNum}
            totalPages={Math.ceil(total / pageSize)}
        />
    );
}
