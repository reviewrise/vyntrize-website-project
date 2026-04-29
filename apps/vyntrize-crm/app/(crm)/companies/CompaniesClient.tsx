'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Globe } from 'lucide-react';
import { Drawer } from '@/components/Drawer';
import { createCompany } from '@/lib/actions/companies';

interface Company {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    _count: { contacts: number; leads: number };
}

const INDUSTRY_COLORS: Record<string, string> = {
    saas: 'bg-violet-100 text-violet-700',
    software: 'bg-violet-100 text-violet-700',
    retail: 'bg-amber-100 text-amber-700',
    healthcare: 'bg-emerald-100 text-emerald-700',
    finance: 'bg-blue-100 text-blue-700',
    marketing: 'bg-pink-100 text-pink-700',
    education: 'bg-cyan-100 text-cyan-700',
    food: 'bg-orange-100 text-orange-700',
};

function getIndustryClass(industry: string | null) {
    if (!industry) return '';
    const key = industry.toLowerCase().split(/[\s,/]/)[0];
    return INDUSTRY_COLORS[key] ?? 'bg-slate-100 text-slate-600';
}

function CompanyAvatar({ name }: { name: string }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
            {initials}
        </div>
    );
}

export function CompaniesClient({ companies }: { companies: Company[] }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        await createCompany(formData);
        setSubmitting(false);
        setDrawerOpen(false);
        router.refresh();
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Companies</h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
                    </p>
                </div>
                <button onClick={() => setDrawerOpen(true)} className="btn-primary">
                    <Plus className="h-3.5 w-3.5" /> New Company
                </button>
            </div>

            {/* Table */}
            <div className="crm-card overflow-hidden">
                {companies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div
                            className="h-12 w-12 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-raised)' }}
                        >
                            <Building2 className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>No companies yet</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                Add your first company to organise contacts
                            </p>
                        </div>
                        <button onClick={() => setDrawerOpen(true)} className="btn-primary mt-1">
                            <Plus className="h-3.5 w-3.5" /> Add Company
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Column headers */}
                        <div
                            className="grid px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest"
                            style={{
                                gridTemplateColumns: '2fr 1.2fr 72px 72px',
                                backgroundColor: 'var(--color-raised)',
                                borderBottom: '1px solid var(--color-border)',
                                color: 'var(--color-text-subtle)',
                            }}
                        >
                            <span>Company</span>
                            <span>Industry</span>
                            <span>Contacts</span>
                            <span>Leads</span>
                        </div>

                        {companies.map(company => (
                            <Link
                                key={company.id}
                                href={`/companies/${company.id}`}
                                className="grid px-4 py-3 items-center transition-colors"
                                style={{
                                    gridTemplateColumns: '2fr 1.2fr 72px 72px',
                                    borderBottom: '1px solid var(--color-border)',
                                    backgroundColor: 'transparent',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-raised)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                {/* Name + website */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <CompanyAvatar name={company.name} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                            {company.name}
                                        </p>
                                        {company.website && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Globe className="h-2.5 w-2.5 flex-shrink-0" style={{ color: 'var(--color-text-subtle)' }} />
                                                <p className="text-[11px] truncate" style={{ color: 'var(--color-text-subtle)' }}>
                                                    {company.website.replace(/^https?:\/\//, '')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Industry badge */}
                                <div>
                                    {company.industry ? (
                                        <span className={`badge ${getIndustryClass(company.industry)}`}>
                                            {company.industry}
                                        </span>
                                    ) : (
                                        <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>—</span>
                                    )}
                                </div>

                                {/* Counts */}
                                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                    {company._count.contacts}
                                </p>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                    {company._count.leads}
                                </p>
                            </Link>
                        ))}
                    </>
                )}
            </div>

            {/* Drawer */}
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New Company">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Company Name *</label>
                        <input name="name" type="text" required className="crm-input" placeholder="Acme Inc." />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Website</label>
                        <input name="website" type="url" className="crm-input" placeholder="https://acme.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Industry</label>
                        <input name="industry" type="text" className="crm-input" placeholder="SaaS, Retail, Healthcare..." />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Notes</label>
                        <textarea name="notes" rows={3} className="crm-input resize-none" placeholder="Any notes about this company..." />
                    </div>
                    <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button type="submit" disabled={submitting} className="btn-primary flex-1">
                            {submitting ? 'Saving...' : 'Add Company'}
                        </button>
                        <button type="button" onClick={() => setDrawerOpen(false)} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            </Drawer>
        </>
    );
}
