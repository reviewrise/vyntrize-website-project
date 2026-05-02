import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { updateLeadDeal, updateLeadStage } from '@/lib/actions/leads';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { ActivityFeed } from '@/components/ActivityFeed';
import LeadScoreWidget from '@/components/LeadScoreWidget';
import LeadActivityTimeline from '@/components/LeadActivityTimeline';
import LeadNotes from '@/components/LeadNotes';

const STAGE_LABELS: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    PROPOSAL_SENT: 'Proposal Sent',
    WON: 'Won',
    LOST: 'Lost',
};

export default async function LeadDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
            contact: true,
            company: true,
            assignee: true,
            activities: {
                orderBy: { createdAt: 'desc' },
                include: { user: true },
            },
        },
    });

    if (!lead) notFound();

    // Audit log queried separately (polymorphic — not a direct relation on Lead)
    const auditLogs = session.role === 'ADMIN'
        ? await prisma.auditLog.findMany({
            where: { entityType: 'Lead', entityId: id },
            orderBy: { createdAt: 'desc' },
            include: { user: true },
        })
        : [];

    const users = await prisma.crmUser.findMany({
        where: { isActive: true },
        select: { id: true, displayName: true },
        orderBy: { displayName: 'asc' },
    });

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-8 max-w-6xl">
            <div className="flex items-center gap-3">
                <Link href="/pipeline" className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <ArrowLeft className="h-3 w-3" /> Pipeline
                </Link>
            </div>

            <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                    <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
                        {lead.title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span
                            className="text-[10px] font-bold rounded-full px-2.5 py-1"
                            style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)' }}
                        >
                            {STAGE_LABELS[lead.stage]}
                        </span>
                        <Link href={`/contacts/${lead.contactId}`} className="text-xs" style={{ color: 'var(--color-primary)' }}>
                            {lead.contact.firstName} {lead.contact.lastName}
                        </Link>
                        {lead.company && (
                            <Link href={`/companies/${lead.companyId}`} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                {lead.company.name}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stage Update */}
                    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Update Stage</h2>
                        <form action={async (formData: FormData) => { "use server"; await updateLeadStage(formData); }} className="flex items-end gap-4">
                            <input type="hidden" name="id" value={lead.id} />
                            <div className="flex-1">
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Stage</label>
                                <select name="stage" defaultValue={lead.stage} className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                    {Object.entries(STAGE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Closing Note (required for Won/Lost)</label>
                                <input name="closingNote" type="text" defaultValue={lead.closingNote ?? ''} className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                            </div>
                            <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                                Update
                            </button>
                        </form>
                    </div>

                    {/* Deal Info */}
                    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Deal Details</h2>
                        </div>
                        <form action={async (formData: FormData) => { "use server"; await updateLeadDeal(formData); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="hidden" name="id" value={lead.id} />
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Deal Value (USD)</label>
                                <input name="dealValue" type="number" min="0" step="0.01" defaultValue={lead.dealValue?.toString() ?? ''} className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Expected Close Date</label>
                                <input name="closeDate" type="date" min={today} defaultValue={lead.closeDate ? lead.closeDate.toISOString().split('T')[0] : ''} className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Assigned To</label>
                                <select name="assigneeId" defaultValue={lead.assigneeId ?? ''} className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                    <option value="">Unassigned</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.displayName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                                    Save Deal Info
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Lead Activity Timeline */}
                    <LeadActivityTimeline leadId={lead.id} />

                    {/* Activity Feed */}
                    <ActivityFeed
                        activities={lead.activities.map((a) => ({
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
                        targetType="lead"
                        targetId={lead.id}
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

                {/* Sidebar - Right Column (1/3) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Lead Notes */}
                    <LeadNotes leadId={lead.id} currentUserId={session.userId} currentUserRole={session.role} />
                </div>
            </div>
        </div>
    );
}
