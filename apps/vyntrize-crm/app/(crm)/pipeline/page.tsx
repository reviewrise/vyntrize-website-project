import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { PipelineClient } from './PipelineClient';

export default async function PipelinePage() {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const [leads, contacts, users] = await Promise.all([
        prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                contact: { select: { firstName: true, lastName: true } },
                assignee: { select: { displayName: true } },
            },
        }),
        prisma.contact.findMany({
            orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
            select: { id: true, firstName: true, lastName: true, email: true },
        }),
        prisma.crmUser.findMany({
            where: { isActive: true },
            orderBy: { displayName: 'asc' },
            select: { id: true, displayName: true },
        }),
    ]);

    return (
        <PipelineClient
            leads={leads.map(l => ({
                id: l.id,
                title: l.title,
                stage: l.stage,
                score: l.score ?? 0,
                dealValue: l.dealValue?.toString() ?? null,
                closeDate: l.closeDate?.toISOString() ?? null,
                contact: l.contact,
                assignee: l.assignee,
            }))}
            contacts={contacts}
            users={users}
        />
    );
}
