// apps/vyntrize-crm/components/GlobalSmsLogs.tsx
// Global SMS logs page component

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, CheckCircle2, AlertCircle, Clock, Ban, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Phone, User } from 'lucide-react';

interface SmsLog {
  id: string;
  createdAt: string;
  toPhone: string;
  toName?: string;
  content: string;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED';
  messageId?: string;
  sentAt?: string;
  errorMessage?: string;
  contactId?: string;
  leadId?: string;
  contact?: { firstName: string; lastName: string; email: string } | null;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  queued: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SENT',    label: 'Sent' },
  { value: 'FAILED',  label: 'Failed' },
  { value: 'SKIPPED', label: 'Skipped' },
  { value: 'QUEUED',  label: 'Queued' },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now  = new Date();
  const diffMs    = now.getTime() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays  = Math.floor(diffMs / 86_400_000);
  if (diffMins  <  1) return 'Just now';
  if (diffMins  < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays  <  7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status: SmsLog['status']) {
  switch (status) {
    case 'SENT':    return { label: 'Sent',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    case 'FAILED':  return { label: 'Failed',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    case 'SKIPPED': return { label: 'Skipped', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    case 'QUEUED':  return { label: 'Queued',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
    default:        return { label: status,    color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  }
}

function StatusIcon({ status }: { status: SmsLog['status'] }) {
  const cls = 'h-4 w-4 flex-shrink-0';
  switch (status) {
    case 'SENT':    return <CheckCircle2 className={cls} style={{ color: '#10b981' }} />;
    case 'FAILED':  return <AlertCircle  className={cls} style={{ color: '#ef4444' }} />;
    case 'SKIPPED': return <Ban          className={cls} style={{ color: '#f59e0b' }} />;
    default:        return <Clock        className={cls} style={{ color: '#6b7280' }} />;
  }
}

export default function GlobalSmsLogs() {
  const [logs, setLogs]           = useState<SmsLog[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page:  String(page),
        limit: '25',
        ...(statusFilter && { status: statusFilter }),
        ...(search.trim() && { search: search.trim() }),
      });
      const res = await fetch(`/api/sms/logs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch SMS logs');
      const data = await res.json();
      setLogs(data.logs ?? []);
      setStats(data.stats ?? null);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SMS logs');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(1); };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>SMS Logs</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            All outbound text messages sent from the CRM
          </p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',   value: stats.total,   icon: MessageSquare, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
            { label: 'Sent',    value: stats.sent,    icon: CheckCircle2,  color: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
            { label: 'Failed',  value: stats.failed,  icon: AlertCircle,   color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
            { label: 'Skipped', value: stats.skipped, icon: Ban,           color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-4 flex items-center gap-3"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold leading-tight" style={{ color: 'var(--color-text)' }}>{value.toLocaleString()}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by phone, name or content…"
            className="w-full rounded-lg pl-9 pr-4 py-2 text-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              outline: 'none',
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            outline: 'none',
            minWidth: '140px',
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <AlertCircle className="h-8 w-8" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-raised)' }}>
              <MessageSquare className="h-6 w-6" style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>No SMS logs found</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {search || statusFilter ? 'Try adjusting your filters.' : 'SMS messages will appear here after they are sent.'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {logs.map((log) => {
              const badge     = statusBadge(log.status);
              const isExpanded = expandedId === log.id;
              const contactName = log.contact
                ? `${log.contact.firstName} ${log.contact.lastName}`.trim()
                : log.toName;

              return (
                <div key={log.id}>
                  {/* ── Row ── */}
                  <button
                    className="w-full text-left px-5 py-4 flex items-start gap-3 transition-colors"
                    style={{ backgroundColor: isExpanded ? 'var(--color-raised)' : 'transparent' }}
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-raised)'; }}
                    onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <StatusIcon status={log.status} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Recipient */}
                        <div className="flex items-center gap-1.5">
                          {contactName ? (
                            <>
                              <User className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{contactName}</span>
                            </>
                          ) : null}
                          <Phone className="h-3.5 w-3.5 ml-1" style={{ color: 'var(--color-text-muted)' }} />
                          <span className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>{log.toPhone}</span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Message preview */}
                      <p
                        className="text-sm mt-1 line-clamp-1"
                        style={{ color: isExpanded ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                      >
                        {log.content}
                      </p>

                      {/* Error */}
                      {log.errorMessage && (
                        <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                          ⚠ {log.errorMessage}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right ml-4">
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDate(log.sentAt ?? log.createdAt)}
                      </p>
                      {isExpanded
                        ? <ChevronUp   className="h-4 w-4 ml-auto mt-1" style={{ color: 'var(--color-text-muted)' }} />
                        : <ChevronDown className="h-4 w-4 ml-auto mt-1" style={{ color: 'var(--color-text-muted)' }} />}
                    </div>
                  </button>

                  {/* ── Expanded Content ── */}
                  {isExpanded && (
                    <div
                      className="px-5 pb-5 pt-1"
                      style={{ backgroundColor: 'var(--color-raised)', borderTop: '1px solid var(--color-border)' }}
                    >
                      <div className="rounded-xl p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                        {log.content}
                      </div>
                      {log.contact && (
                        <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span>Contact: <span style={{ color: 'var(--color-text)' }}>{log.contact.firstName} {log.contact.lastName}</span></span>
                          {log.contact.email && <span>{log.contact.email}</span>}
                          {log.leadId && <span>Lead ID: <span className="font-mono" style={{ color: 'var(--color-text)' }}>{log.leadId.slice(0, 8)}…</span></span>}
                        </div>
                      )}
                      {log.messageId && (
                        <p className="mt-2 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                          Message ID: {log.messageId}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg disabled:opacity-40 transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-raised)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface)'; }}
            >
              <ChevronLeft className="h-4 w-4" style={{ color: 'var(--color-text)' }} />
            </button>
            <span className="px-3 py-1.5 text-sm rounded-lg" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg disabled:opacity-40 transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-raised)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface)'; }}
            >
              <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
