'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Drawer } from '@/components/Drawer';
import { createLead } from '@/lib/actions/leads';

interface Lead {
    id: string;
    title: string;
    stage: string;
    dealValue: string | null;
    closeDate: string | null;
    contact: { firstName: string; lastName: string };
    assignee: { displayName: string } | null;
}

interface Contact { id: string; firstName: string; lastName: string; email: string; }
interface User { id: string; displayName: string; }

interface Props {
    leads: Lead[];
    contacts: Contact[];
    users: User[];
}

export function PipelineClient({ leads, contacts, users }: Props) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        await createLead(formData);
        setSubmitting(false);
        setDrawerOpen(false);
        router.refresh();
    }

    // Auto-refresh the pipeline every 10 seconds to show background automation changes
    useEffect(() => {
        const intervalId = setInterval(() => {
            router.refresh();
        }, 10000); // 10 seconds
        
        return () => clearInterval(intervalId);
    }, [router]);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Pipeline</h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {leads.length} lead{leads.length !== 1 ? 's' : ''} across all stages
                    </p>
                </div>
                <button onClick={() => setDrawerOpen(true)} className="btn-primary">
                    <Plus className="h-3.5 w-3.5" /> New Lead
                </button>
            </div>

            <KanbanBoard initialLeads={leads} />

            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New Lead">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Title *</label>
                        <input name="title" type="text" required className="crm-input" placeholder="e.g. Website redesign for Acme" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Contact *</label>
                        <select name="contactId" required className="crm-input">
                            <option value="">Select a contact...</option>
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.firstName} {c.lastName} — {c.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Assign To</label>
                        <select name="assigneeId" className="crm-input">
                            <option value="">Unassigned</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={submitting} className="btn-primary flex-1">
                            {submitting ? 'Creating...' : 'Create Lead'}
                        </button>
                        <button type="button" onClick={() => setDrawerOpen(false)} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            </Drawer>
        </>
    );
}
