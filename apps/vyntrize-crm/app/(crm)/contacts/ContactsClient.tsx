'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Mail, Briefcase } from 'lucide-react';
import { Drawer } from '@/components/Drawer';
import { createContact } from '@/lib/actions/contacts';
import BulkEmailComposer from '@/components/BulkEmailComposer';

interface Company { id: string; name: string; }
interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string | null;
    company: Company | null;
}

interface Props {
    contacts: Contact[];
    companies: Company[];
    total: number;
    q: string;
    pageNum: number;
    totalPages: number;
}

const AVATAR_COLORS = [
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#0ea5e9,#6366f1)',
    'linear-gradient(135deg,#10b981,#0ea5e9)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#ec4899,#8b5cf6)',
    'linear-gradient(135deg,#14b8a6,#6366f1)',
];

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name }: { name: string }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
            style={{ background: getAvatarColor(name) }}
        >
            {initials}
        </div>
    );
}

export function ContactsClient({ contacts, companies, total, q, pageNum, totalPages }: Props) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
    const router = useRouter();

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        await createContact(formData);
        setSubmitting(false);
        setDrawerOpen(false);
        router.refresh();
    }

    function toggleContact(contactId: string) {
        const newSelected = new Set(selectedContacts);
        if (newSelected.has(contactId)) {
            newSelected.delete(contactId);
        } else {
            newSelected.add(contactId);
        }
        setSelectedContacts(newSelected);
    }

    function toggleAll() {
        if (selectedContacts.size === contacts.length) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(contacts.map(c => c.id)));
        }
    }

    const selectedContactsData = contacts.filter(c => selectedContacts.has(c.id));

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Contacts</h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {total} contact{total !== 1 ? 's' : ''}
                        {selectedContacts.size > 0 && ` · ${selectedContacts.size} selected`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedContacts.size > 0 && (
                        <button 
                            onClick={() => setIsBulkEmailOpen(true)} 
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Mail className="h-3.5 w-3.5" /> 
                            Send Email ({selectedContacts.size})
                        </button>
                    )}
                    <button onClick={() => setDrawerOpen(true)} className="btn-primary">
                        <Plus className="h-3.5 w-3.5" /> New Contact
                    </button>
                </div>
            </div>

            {/* Search bar */}
            <form method="GET" className="mb-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                        name="q"
                        type="text"
                        defaultValue={q}
                        placeholder="Search by name or email..."
                        className="crm-input pl-9 pr-4"
                    />
                </div>
            </form>

            {/* Table */}
            <div className="crm-card overflow-hidden">
                {contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div
                            className="h-12 w-12 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-raised)' }}
                        >
                            <Users className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                {q ? 'No results found' : 'No contacts yet'}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                {q ? `No contacts match "${q}"` : 'Add your first contact to get started'}
                            </p>
                        </div>
                        {!q && (
                            <button onClick={() => setDrawerOpen(true)} className="btn-primary mt-1">
                                <Plus className="h-3.5 w-3.5" /> Add Contact
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Column headers */}
                        <div
                            className="grid px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest"
                            style={{
                                gridTemplateColumns: '40px 2fr 2fr 1.5fr',
                                backgroundColor: 'var(--color-raised)',
                                borderBottom: '1px solid var(--color-border)',
                                color: 'var(--color-text-subtle)',
                            }}
                        >
                            <input 
                                type="checkbox" 
                                checked={selectedContacts.size === contacts.length && contacts.length > 0}
                                onChange={toggleAll}
                                className="cursor-pointer"
                            />
                            <span>Contact</span>
                            <span>Email</span>
                            <span>Company</span>
                        </div>

                        {contacts.map(contact => (
                            <div
                                key={contact.id}
                                className="grid px-4 py-3 items-center transition-colors"
                                style={{
                                    gridTemplateColumns: '40px 2fr 2fr 1.5fr',
                                    borderBottom: '1px solid var(--color-border)',
                                    backgroundColor: selectedContacts.has(contact.id) ? 'var(--color-raised)' : 'transparent',
                                }}
                                onMouseEnter={e => {
                                    if (!selectedContacts.has(contact.id)) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-raised)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!selectedContacts.has(contact.id)) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                {/* Checkbox */}
                                <input 
                                    type="checkbox" 
                                    checked={selectedContacts.has(contact.id)}
                                    onChange={() => toggleContact(contact.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="cursor-pointer"
                                />

                                {/* Name + avatar - clickable */}
                                <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 min-w-0">
                                    <Avatar name={`${contact.firstName} ${contact.lastName}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                            {contact.firstName} {contact.lastName}
                                        </p>
                                        {contact.jobTitle && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Briefcase className="h-2.5 w-2.5 flex-shrink-0" style={{ color: 'var(--color-text-subtle)' }} />
                                                <p className="text-[11px] truncate" style={{ color: 'var(--color-text-subtle)' }}>
                                                    {contact.jobTitle}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Email */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Mail className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--color-text-subtle)' }} />
                                    <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                                        {contact.email}
                                    </p>
                                </div>

                                {/* Company */}
                                <div className="min-w-0">
                                    {contact.company ? (
                                        <span
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                                            style={{
                                                backgroundColor: 'var(--color-raised)',
                                                border: '1px solid var(--color-border)',
                                                color: 'var(--color-text-muted)',
                                            }}
                                        >
                                            {contact.company.name}
                                        </span>
                                    ) : (
                                        <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>—</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Showing {(pageNum - 1) * 25 + 1}–{Math.min(pageNum * 25, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        {pageNum > 1 && (
                            <Link href={`/contacts?q=${q}&page=${pageNum - 1}`} className="btn-secondary text-xs py-1.5 px-3">
                                ← Previous
                            </Link>
                        )}
                        {pageNum < totalPages && (
                            <Link href={`/contacts?q=${q}&page=${pageNum + 1}`} className="btn-secondary text-xs py-1.5 px-3">
                                Next →
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Drawer */}
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New Contact">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>First Name *</label>
                            <input name="firstName" type="text" required className="crm-input" placeholder="Alex" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Last Name *</label>
                            <input name="lastName" type="text" required className="crm-input" placeholder="Rivera" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Email *</label>
                        <input name="email" type="email" required className="crm-input" placeholder="alex@company.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Phone</label>
                        <input name="phone" type="tel" className="crm-input" placeholder="+1 555 000 0000" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Job Title</label>
                        <input name="jobTitle" type="text" className="crm-input" placeholder="CEO" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Company</label>
                        <select name="companyId" className="crm-input">
                            <option value="">No company</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button type="submit" disabled={submitting} className="btn-primary flex-1">
                            {submitting ? 'Saving...' : 'Add Contact'}
                        </button>
                        <button type="button" onClick={() => setDrawerOpen(false)} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            </Drawer>

            {/* Bulk Email Composer */}
            <BulkEmailComposer
                isOpen={isBulkEmailOpen}
                onClose={() => {
                    setIsBulkEmailOpen(false);
                    setSelectedContacts(new Set());
                }}
                recipients={selectedContactsData.map(c => ({
                    id: c.id,
                    email: c.email,
                    name: `${c.firstName} ${c.lastName}`,
                    firstName: c.firstName,
                    lastName: c.lastName,
                    companyName: c.company?.name,
                }))}
                onSuccess={() => {
                    setSelectedContacts(new Set());
                    router.refresh();
                }}
            />
        </>
    );
}
