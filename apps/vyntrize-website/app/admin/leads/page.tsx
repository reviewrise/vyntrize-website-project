'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import {
  getLeads, updateLead, deleteLead,
  type Lead, type LeadStatus, type LeadPriority,
  statusColors, statusLabels, priorityColors, priorityLabels, allStatuses,
} from '@/lib/leads';

const priorities: LeadPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getLeads();
    setLeads(data);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);

  async function handleStatus(id: string, status: LeadStatus) {
    setSaving(true);
    const updated = await updateLead(id, { status });
    if (updated) {
      setLeads(prev => prev.map(l => l.id === id ? updated : l));
      if (selected?.id === id) setSelected(updated);
    }
    setSaving(false);
  }

  async function handlePriority(id: string, priority: LeadPriority) {
    setSaving(true);
    const updated = await updateLead(id, { priority });
    if (updated) {
      setLeads(prev => prev.map(l => l.id === id ? updated : l));
      if (selected?.id === id) setSelected(updated);
    }
    setSaving(false);
  }

  async function handleNotes(id: string, notes: string) {
    const updated = await updateLead(id, { notes });
    if (updated) {
      setLeads(prev => prev.map(l => l.id === id ? updated : l));
      if (selected?.id === id) setSelected(updated);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lead?')) return;
    await deleteLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Leads</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {leads.length} total · {leads.filter(l => l.status === 'NEW').length} new
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {(['all', ...allStatuses] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: filter === s ? 'var(--color-primary)' : 'var(--color-raised)',
                  color: filter === s ? '#fff' : 'var(--color-text-muted)',
                  border: `1px solid ${filter === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
                }}
              >
                {s === 'all' ? 'All' : statusLabels[s]}
              </button>
            ))}
          </div>
          <button onClick={refresh} className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-[1fr_130px_110px_40px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span>Contact</span><span>Intent</span><span>Status</span><span />
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading leads...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-12 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No leads found.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--color-bg)' }}>
              {filtered.map((lead, i) => (
                <div
                  key={lead.id}
                  onClick={() => setSelected(lead)}
                  className="grid grid-cols-[1fr_130px_110px_40px] px-4 py-3.5 items-center cursor-pointer transition-colors"
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                    backgroundColor: selected?.id === lead.id ? 'var(--color-raised)' : 'transparent',
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{lead.email}</p>
                  </div>
                  <p className="text-xs truncate capitalize" style={{ color: 'var(--color-text-muted)' }}>
                    {lead.intent.replace(/-/g, ' ')}
                  </p>
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 w-fit ${statusColors[lead.status]}`}>
                    {statusLabels[lead.status]}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(lead.id); }}
                    className="flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:bg-red-50"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="rounded-2xl p-5 space-y-4 sticky top-20" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                {selected.firstName} {selected.lastName}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{selected.email}</p>
              {selected.company && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{selected.company}</p>}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Intent</p>
              <p className="text-sm capitalize" style={{ color: 'var(--color-text)' }}>
                {selected.intent.replace(/-/g, ' ')}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Message</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>{selected.message}</p>
            </div>

            {/* Status */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Status</p>
              <div className="relative">
                <select
                  value={selected.status}
                  disabled={saving}
                  onChange={e => handleStatus(selected.id, e.target.value as LeadStatus)}
                  className="w-full rounded-lg px-3 py-2 text-sm appearance-none pr-8"
                  style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  {allStatuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Priority</p>
              <div className="flex gap-2 flex-wrap">
                {priorities.map(p => (
                  <button
                    key={p}
                    disabled={saving}
                    onClick={() => handlePriority(selected.id, p)}
                    className={`text-[10px] font-bold rounded-full px-2.5 py-1 transition-all ${selected.priority === p ? priorityColors[p] : 'bg-transparent'}`}
                    style={{
                      border: `1px solid ${selected.priority === p ? 'transparent' : 'var(--color-border)'}`,
                      color: selected.priority === p ? undefined : 'var(--color-text-muted)',
                    }}
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Notes</p>
              <textarea
                rows={3}
                defaultValue={selected.notes ?? ''}
                key={selected.id}
                onBlur={e => handleNotes(selected.id, e.target.value)}
                placeholder="Add internal notes..."
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            {/* Metadata */}
            <div className="pt-2 space-y-1" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Submitted {new Date(selected.createdAt).toLocaleString()}
              </p>
              {selected.source && (
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  Source: {selected.source}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Select a lead to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
