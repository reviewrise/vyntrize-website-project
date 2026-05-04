import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import CampaignBuilder from './CampaignBuilder';

export default async function NewCampaignPage() {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    // Fetch contacts and templates for the campaign builder
    const [contacts, templates] = await Promise.all([
        prisma.contact.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        }),
        prisma.emailTemplate.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                subject: true,
                body: true,
            },
        }),
    ]);

    return (
        <CampaignBuilder
            contacts={contacts.map(c => ({
                id: c.id,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                companyName: c.company?.name,
            }))}
            templates={templates}
        />
    );
}
