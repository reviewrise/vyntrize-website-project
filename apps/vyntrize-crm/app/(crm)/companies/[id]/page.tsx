import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { updateCompany, deleteCompany } from '@/lib/actions/companies';
import { Building2, Users, TrendingUp, Globe, ArrowLeft } from 'lucide-react';

export default async function CompanyDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const { id } = await params;

    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            contacts: {
                where: { deletedAt: null },
                orderBy: { firstName: 'asc' },
            },
            leads: {
                orderBy: { createdAt: 'desc' },
                include: { contact: true },
            },
        },
    });

    if (!company) notFound();

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex items-center gap-3">
                <Link
                    href="/companies"
                    className="flex items-center gap-1 text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    <ArrowLeft className="h-3 w-3" /> Companies
                </Link>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
                        {company.name}
                    </h1>
                    {company.industry && (
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            {company.industry}
                        </p>
                    )}
                    {company.website && (
                        <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs mt-1"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            <Globe className="h-3 w-3" /> {company.website}
                        </a>
                    )}
                </div>
            </div>

            {/* Edit Form */}
            <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Edit Company
                </h2>
                <form action={async (formData: FormData) => { "use server"; await updateCompany(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="hidden" name="id" value={company.id} />
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            Name *
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            defaultValue={company.name}
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                                backgroundColor: 'var(--color-raised)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            Website
                        </label>
                        <input
                            name="website"
                            type="url"
                            defaultValue={company.website ?? ''}
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                                backgroundColor: 'var(--color-raised)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            Industry
                        </label>
                        <input
                            name="industry"
                            type="text"
                            defaultValue={company.industry ?? ''}
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                                backgroundColor: 'var(--color-raised)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            rows={3}
                            defaultValue={company.notes ?? ''}
                            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                            style={{
                                backgroundColor: 'var(--color-raised)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3">
                        <button
                            type="submit"
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                            Save Changes
                        </button>
                        <form action={async (formData: FormData) => { "use server"; await deleteCompany(formData); }}>
                            <input type="hidden" name="id" value={company.id} />
                            <input type="hidden" name="confirmed" value="true" />
                            <button
                                type="submit"
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-red-400"
                                style={{
                                    backgroundColor: 'var(--color-raised)',
                                    border: '1px solid var(--color-border)',
                                }}
                                onClick={(e) => {
                                    if (!confirm('Delete this company? Associated contacts will be unlinked.')) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                Delete Company
                            </button>
                        </form>
                    </div>
                </form>
            </div>

            {/* Contacts */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
            >
                <div
                    className="flex items-center gap-2 px-5 py-4"
                    style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
                >
                    <Users className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Contacts ({company.contacts.length})
                    </p>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg)' }}>
                    {company.contacts.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                            No contacts linked to this company.
                        </p>
                    ) : (
                        company.contacts.map((contact, i) => (
                            <Link
                                key={contact.id}
                                href={`/contacts/${contact.id}`}
                                className="flex items-center justify-between px-5 py-3.5 hover:opacity-80"
                                style={{ borderBottom: i < company.contacts.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                            >
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {contact.firstName} {contact.lastName}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                        {contact.email}{contact.jobTitle ? ` · ${contact.jobTitle}` : ''}
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Leads */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
            >
                <div
                    className="flex items-center gap-2 px-5 py-4"
                    style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
                >
                    <TrendingUp className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Leads ({company.leads.length})
                    </p>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg)' }}>
                    {company.leads.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                            No leads linked to this company.
                        </p>
                    ) : (
                        company.leads.map((lead, i) => (
                            <Link
                                key={lead.id}
                                href={`/leads/${lead.id}`}
                                className="flex items-center justify-between px-5 py-3.5 hover:opacity-80"
                                style={{ borderBottom: i < company.leads.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                            >
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {lead.title}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                        {lead.contact.firstName} {lead.contact.lastName} · {lead.stage}
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
