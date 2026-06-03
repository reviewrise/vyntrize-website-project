import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDashboardData } from '@/lib/queries/dashboard';
import { Users, Building2, TrendingUp, DollarSign, FileText, Phone, Mail } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    PROPOSAL_SENT: 'Proposal Sent',
    WON: 'Won',
    LOST: 'Lost',
};

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
    NOTE: <FileText className="h-3.5 w-3.5" />,
    CALL: <Phone className="h-3.5 w-3.5" />,
    EMAIL: <Mail className="h-3.5 w-3.5" />,
};

export default async function DashboardPage() {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const data = await getDashboardData();

    const totalLeads = Object.values(data.leadCountByStage).reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...Object.values(data.leadCountByStage), 1);

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
                    Dashboard
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Welcome back, {session.displayName}.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 bg-blue-900/30">
                        <Users className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>{data.totalContacts}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Total Contacts</p>
                </div>

                <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 bg-violet-900/30">
                        <Building2 className="h-4 w-4 text-violet-400" />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>{data.totalCompanies}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Total Companies</p>
                </div>

                <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 bg-amber-900/30">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>{totalLeads}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Total Leads</p>
                </div>

                <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 bg-emerald-900/30">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>
                        ${data.totalOpenDealValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Open Pipeline</p>
                </div>

                <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 bg-green-900/30">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>
                        ${data.revenueThisMonth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Revenue This Month</p>
                </div>

                <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 bg-orange-900/30">
                        <DollarSign className="h-4 w-4 text-orange-400" />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>
                        ${data.outstandingInvoices.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Outstanding Balance</p>
                </div>
            </div>

            {/* Pipeline Funnel */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Pipeline Funnel</p>
                <div className="space-y-2">
                    {STAGES.map((stage) => {
                        const count = data.leadCountByStage[stage] ?? 0;
                        const value = data.dealValueByStage[stage] ?? 0;
                        const pct = Math.round((count / maxCount) * 100);
                        return (
                            <div key={stage}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {STAGE_LABELS[stage]}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        {value > 0 && (
                                            <span className="text-[10px] text-emerald-400 font-semibold">
                                                ${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                        )}
                                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                                            {count}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: stage === 'WON' ? '#10b981' : stage === 'LOST' ? '#ef4444' : 'var(--color-primary)',
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <div className="px-5 py-4" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Recent Activity</p>
                </div>
                {data.recentActivities.length === 0 ? (
                    <div className="px-5 py-8 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No activity yet.</p>
                    </div>
                ) : (
                    <div style={{ backgroundColor: 'var(--color-bg)' }}>
                        {data.recentActivities.map((activity, i) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 px-5 py-3.5"
                                style={{ borderBottom: i < data.recentActivities.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                            >
                                <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                                    {TYPE_ICONS[activity.type]}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs" style={{ color: 'var(--color-text)' }}>
                                        <span className="font-semibold">{activity.user.displayName}</span>
                                        {' '}logged a {activity.type.toLowerCase()} on{' '}
                                        {activity.lead ? (
                                            <Link href={`/leads/${activity.leadId}`} className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                                                {activity.lead.title}
                                            </Link>
                                        ) : activity.contact ? (
                                            <Link href={`/contacts/${activity.contactId}`} className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                                                {activity.contact.firstName} {activity.contact.lastName}
                                            </Link>
                                        ) : 'unknown'}
                                    </p>
                                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                                        {activity.body}
                                    </p>
                                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                        {new Date(activity.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
