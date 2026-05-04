import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CampaignDetailClient from './CampaignDetailClient';

export default async function CampaignDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const { id } = await params;

    const campaign = await prisma.emailCampaign.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    displayName: true,
                    email: true,
                },
            },
            emails: {
                orderBy: { sentAt: 'desc' },
                include: {
                    contact: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    lead: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            },
        },
    });

    if (!campaign) {
        notFound();
    }

    // Get the body from the first email (they all have the same template)
    const emailBody = campaign.emails[0]?.body || '';

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3">
                <Link href="/campaigns" className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <ArrowLeft className="h-3 w-3" /> Campaigns
                </Link>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
                    {campaign.name}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Created by {campaign.user.displayName} on {new Date(campaign.createdAt).toLocaleDateString()}
                </p>
            </div>

            <CampaignDetailClient
                campaign={{
                    id: campaign.id,
                    name: campaign.name,
                    subject: campaign.subject,
                    body: emailBody,
                    status: campaign.status,
                    totalRecipients: campaign.totalRecipients,
                    sentCount: campaign.sentCount,
                    openedCount: campaign.openedCount,
                    clickedCount: campaign.clickedCount,
                    bouncedCount: campaign.bouncedCount,
                    failedCount: campaign.failedCount,
                    createdAt: campaign.createdAt.toISOString(),
                    sentAt: campaign.sentAt?.toISOString() || null,
                    completedAt: null, // Not tracked in current schema
                    createdBy: campaign.user,
                }}
                emails={campaign.emails.map(email => ({
                    id: email.id,
                    toEmail: email.toEmail,
                    toName: email.toName || undefined,
                    status: email.status,
                    sentAt: email.sentAt?.toISOString() || null,
                    openedAt: email.openedAt?.toISOString() || null,
                    clickedAt: email.clickedAt?.toISOString() || null,
                    openCount: email.openCount,
                    clickCount: email.clickCount,
                    errorMessage: email.errorMessage || undefined,
                    contact: email.contact ? {
                        id: email.contact.id,
                        firstName: email.contact.firstName,
                        lastName: email.contact.lastName,
                        email: email.contact.email,
                    } : undefined,
                    lead: email.lead ? {
                        id: email.lead.id,
                        title: email.lead.title,
                    } : undefined,
                }))}
            />
        </div>
    );
}
