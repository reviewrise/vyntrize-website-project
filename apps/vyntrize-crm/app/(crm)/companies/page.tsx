import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { CompaniesClient } from './CompaniesClient';

export default async function CompaniesPage() {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const companies = await prisma.company.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { contacts: true, leads: true } },
        },
    });

    return <CompaniesClient companies={companies} />;
}
