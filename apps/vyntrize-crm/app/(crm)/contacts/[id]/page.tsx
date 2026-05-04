import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { updateContact, deleteContact } from '@/lib/actions/contacts';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { ActivityFeed } from '@/components/ActivityFeed';
import ContactDetailClient, { ContactEmailHistory } from './ContactDetailClient';
import ContactEditDrawer from './ContactEditDrawer';

export default async function ContactDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const { id } = await params;

    const contact = await prisma.contact.findFirst({
        where: { id, deletedAt: null },
        include: {
            company: true,
            leads: {
                orderBy: { createdAt: 'desc' },
                include: { assignee: true },
            },
            activities: {
                orderBy: { createdAt: 'desc' },
                include: { user: true },
            },
        },
    });

    if (!contact) notFound();

    // Audit log queried separately (polymorphic — not a direct relation on Contact)
    const auditLogs = session.role === 'ADMIN'
        ? await prisma.auditLog.findMany({
            where: { entityType: 'Contact', entityId: id },
            orderBy: { createdAt: 'desc' },
            include: { user: true },
        })
        : [];

    const companies = await prisma.company.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
    });

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex items-center gap-3">
                <Link href="/contacts" className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <ArrowLeft className="h-3 w-3" /> Contacts
                </Link>
            </div>

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
                        {contact.firstName} {contact.lastName}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {contact.email}{contact.company ? ` · ${contact.company.name}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ContactEditDrawer
                        contact={{
                            id: contact.id,
                            firstName: contact.firstName,
                            lastName: contact.lastName,
                            email: contact.email,
                            phone: contact.phone,
                            jobTitle: contact.jobTitle,
                            companyId: contact.companyId,
                        }}
                        companies={companies}
                    />
                    <ContactDetailClient 
                        contactId={contact.id}
                        contactEmail={contact.email}
                        contactName={`${contact.firstName} ${contact.lastName}`}
                    />
                </div>
            </div>

            {/* Contact Info Card */}
            <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Name</p>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                            {contact.firstName} {contact.lastName}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Email</p>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>{contact.email}</p>
                    </div>
                    {contact.phone && (
                        <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Phone</p>
                            <p className="text-sm" style={{ color: 'var(--color-text)' }}>{contact.phone}</p>
                        </div>
                    )}
                    {contact.jobTitle && (
                        <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Job Title</p>
                            <p className="text-sm" style={{ color: 'var(--color-text)' }}>{contact.jobTitle}</p>
                        </div>
                    )}
                    {contact.company && (
                        <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Company</p>
                            <Link href={`/companies/${contact.company.id}`} className="text-sm" style={{ color: 'var(--color-primary)' }}>
                                {contact.company.name}
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Associated Leads */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 px-5 py-4" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <TrendingUp className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Leads ({contact.leads.length})</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg)' }}>
                    {contact.leads.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>No leads yet.</p>
                    ) : (
                        contact.leads.map((lead, i) => (
                            <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between px-5 py-3.5 hover:opacity-80" style={{ borderBottom: i < contact.leads.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{lead.title}</p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{lead.stage}{lead.assignee ? ` · ${lead.assignee.displayName}` : ''}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Email History */}
            <ContactEmailHistory contactId={contact.id} />

            {/* Activity Feed */}
            <ActivityFeed
                activities={contact.activities.map((a) => ({
                    id: a.id,
                    type: a.type,
                    body: a.body,
                    originalBody: a.originalBody,
                    isEdited: a.isEdited,
                    duration: a.duration,
                    direction: a.direction,
                    createdAt: a.createdAt.toISOString(),
                    user: { displayName: a.user.displayName },
                    leadId: a.leadId,
                    contactId: a.contactId,
                }))}
                targetType="contact"
                targetId={contact.id}
                currentUserId={session.userId}
            />

            {/* Audit Log (Admin only) */}
            {session.role === 'ADMIN' && auditLogs.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="px-5 py-4" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Audit Log</p>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-bg)' }}>
                        {auditLogs.map((log, i) => (
                            <div key={log.id} className="px-5 py-3" style={{ borderBottom: i < auditLogs.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                <p className="text-xs" style={{ color: 'var(--color-text)' }}>
                                    <span className="font-semibold">{log.user.displayName}</span> changed <span className="font-semibold">{log.field}</span>
                                    {log.prevValue ? ` from "${log.prevValue}"` : ''} {log.newValue ? `to "${log.newValue}"` : ''}
                                </p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                    {new Date(log.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
