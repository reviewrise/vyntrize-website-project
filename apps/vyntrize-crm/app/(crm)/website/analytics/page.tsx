import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Eye, Users, MousePointerClick, TrendingUp } from 'lucide-react';

function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
}

function StatCard({ label, value, sub, icon: Icon, iconBg }: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; iconBg: string;
}) {
    return (
        <div className="crm-card p-5">
            <div className="flex items-start justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
            {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>{sub}</p>}
        </div>
    );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <p className="text-xs truncate w-40 flex-shrink-0" style={{ color: 'var(--color-text)' }}>{label}</p>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs w-8 text-right flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>{value}</p>
        </div>
    );
}

export default async function WebsiteAnalyticsPage() {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    const since30 = daysAgo(30);
    const since7 = daysAgo(7);

    const [
        totalViews, views30d, views7d,
        uniqueVisitors30d, topPages, topSources,
        deviceBreakdown, submissionsTotal, submissions30d, intentBreakdown,
    ] = await Promise.all([
        prisma.pageView.count(),
        prisma.pageView.count({ where: { createdAt: { gte: since30 } } }),
        prisma.pageView.count({ where: { createdAt: { gte: since7 } } }),
        prisma.pageView.groupBy({ by: ['sessionId'], where: { createdAt: { gte: since30 } }, _count: true })
            .then((r: { sessionId: string; _count: number }[]) => r.length),
        prisma.pageView.groupBy({
            by: ['path'], where: { createdAt: { gte: since30 } },
            _count: { path: true }, orderBy: { _count: { path: 'desc' } }, take: 10,
        }),
        prisma.pageView.groupBy({
            by: ['source'], where: { createdAt: { gte: since30 }, source: { not: null } },
            _count: { source: true }, orderBy: { _count: { source: 'desc' } }, take: 8,
        }),
        prisma.pageView.groupBy({ by: ['device'], where: { createdAt: { gte: since30 } }, _count: { device: true } }),
        prisma.contactSubmission.count(),
        prisma.contactSubmission.count({ where: { createdAt: { gte: since30 } } }),
        prisma.contactSubmission.groupBy({
            by: ['intent'], _count: { intent: true }, orderBy: { _count: { intent: 'desc' } },
        }),
    ]);

    const conversionRate = views30d > 0 ? ((submissions30d / views30d) * 100).toFixed(1) : '0.0';

    const deviceMap: Record<string, number> = {};
    for (const d of deviceBreakdown) deviceMap[d.device ?? 'unknown'] = d._count.device;
    const totalDevices = Object.values(deviceMap).reduce((a, b) => a + b, 0);

    const intentLabels: Record<string, string> = {
        'ai-search': 'AI Search & Reputation',
        'automation': 'Intelligent Automation',
        'custom-software': 'Custom Software',
        'data': 'Data & Analytics',
        'marketing': 'Digital Marketing',
        'other': 'Something else',
    };

    const maxPageViews = topPages[0]?._count.path ?? 1;
    const maxSourceViews = topSources[0]?._count.source ?? 1;
    const maxIntentCount = intentBreakdown[0]?._count.intent ?? 1;

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Website Analytics</h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    vyntrise.com · last 30 days
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Page views (30d)" value={views30d.toLocaleString()} sub={`${totalViews.toLocaleString()} all time`} icon={Eye} iconBg="bg-indigo-500" />
                <StatCard label="Unique visitors (30d)" value={uniqueVisitors30d.toLocaleString()} sub={`${views7d.toLocaleString()} last 7 days`} icon={Users} iconBg="bg-violet-500" />
                <StatCard label="Form submissions (30d)" value={submissions30d.toLocaleString()} sub={`${submissionsTotal.toLocaleString()} all time`} icon={MousePointerClick} iconBg="bg-emerald-500" />
                <StatCard label="Conversion rate" value={`${conversionRate}%`} sub="views → submissions" icon={TrendingUp} iconBg="bg-amber-500" />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
                {/* Top pages */}
                <div className="crm-card p-5">
                    <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Top Pages</p>
                    {topPages.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No data yet — tracking starts once visitors arrive.</p>
                    ) : (
                        <div className="space-y-3">
                            {topPages.map((p: { path: string; _count: { path: number } }) => (
                                <BarRow key={p.path} label={p.path || '/'} value={p._count.path} max={maxPageViews} color="bg-indigo-500" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Traffic sources */}
                <div className="crm-card p-5">
                    <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Traffic Sources</p>
                    {topSources.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No referrer data yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {topSources.map((s: { source: string | null; _count: { source: number } }) => (
                                <BarRow key={s.source} label={s.source ?? 'Direct'} value={s._count.source} max={maxSourceViews} color="bg-violet-500" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Device breakdown */}
                <div className="crm-card p-5">
                    <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Devices</p>
                    {totalDevices === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No device data yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {(['desktop', 'mobile', 'tablet'] as const).map(device => {
                                const count = deviceMap[device] ?? 0;
                                const pct = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
                                const colors: Record<string, string> = { desktop: 'bg-blue-500', mobile: 'bg-emerald-500', tablet: 'bg-amber-500' };
                                return (
                                    <div key={device} className="flex items-center gap-3">
                                        <p className="text-xs capitalize w-16 flex-shrink-0" style={{ color: 'var(--color-text)' }}>{device}</p>
                                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
                                            <div className={`h-full rounded-full ${colors[device]}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className="text-xs w-12 text-right flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                                            {count} <span style={{ color: 'var(--color-text-subtle)' }}>({pct}%)</span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Intent breakdown */}
                <div className="crm-card p-5">
                    <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Form Submission Intents</p>
                    {intentBreakdown.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No submissions yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {intentBreakdown.map((i: { intent: string; _count: { intent: number } }) => (
                                <BarRow
                                    key={i.intent}
                                    label={intentLabels[i.intent] ?? i.intent}
                                    value={i._count.intent}
                                    max={maxIntentCount}
                                    color="bg-emerald-500"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
