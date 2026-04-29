import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ContactsClient } from './ContactsClient';

export default async function ContactsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const { q = '', page = '1' } = await searchParams;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = 25;

    const where = q
        ? {
            OR: [
                { firstName: { contains: q, mode: 'insensitive' as const } },
                { lastName: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
            ],
        }
        : {};

    const [contacts, total, companies] = await Promise.all([
        prisma.contact.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * pageSize,
            take: pageSize,
            include: { company: { select: { id: true, name: true } } },
        }),
        prisma.contact.count({ where }),
        prisma.company.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);

    return (
        <ContactsClient
            contacts={contacts.map(c => ({
                id: c.id,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                jobTitle: c.jobTitle,
                company: c.company,
            }))}
            companies={companies}
            total={total}
            q={q}
            pageNum={pageNum}
            totalPages={Math.ceil(total / pageSize)}
        />
    );
}
