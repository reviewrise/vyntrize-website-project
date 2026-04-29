'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { getLeads, type Lead, statusColors, statusLabels } from '@/lib/leads';

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeads().then(data => { setLeads(data); setLoading(false); });
  }, []);

  const newLeads = leads.filter(l => l.status === 'NEW').length;
  const qualified = leads.filter(l => l.status === 'QUALIFIED').length;
  const won = leads.filter(l => l.status === 'WON').length;
  const convRate = leads.length ? Math.round((won / leads.length) * 100) : 0;
  const recent = leads.slice(0, 5);

  const stats = [
    { label: 'Total leads', value: leads.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'New', value: newLeads, icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Qualified', value: qualified, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Won', value: won, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>
                {loading ? '—' : s.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Conversion rate */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Conversion rate</p>
          <span className="text-sm font-bold text-emerald-600">{convRate}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${convRate}%` }} />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {won} won out of {leads.length} total leads
        </p>
      </div>

      {/* Recent leads */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Recent leads</p>
          <Link href="/admin/leads" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
          </div>
        ) : recent.length === 0 ? (
          <div className="px-5 py-10 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No leads yet. They&apos;ll appear here when someone submits the contact form.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--color-bg)' }}>
            {recent.map((lead, i) => (
              <div
                key={lead.id}
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--color-border)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {lead.email}{lead.company ? ` · ${lead.company}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${statusColors[lead.status]}`}>
                    {statusLabels[lead.status]}
                  </span>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(lead.createdAt).toLocaleDateString()}
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
