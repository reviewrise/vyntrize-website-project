'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  Mail,
  ThumbsUp,
  BarChart2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailStats {
  total: number;
  sent: number;
  openRate: number;
  clickRate: number;
}

interface ApprovalStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number;
  feedbackCount: number;
}

interface AgentCount {
  agentType: string;
  count: number;
}

interface TrendPoint {
  date: string;
  total: number;
  approved: number;
}

interface BucketCount {
  bucket: string;
  count: number;
}

interface RoiData {
  dateRange: { days: number; since: string };
  emailPerformance: { agent: EmailStats; manual: EmailStats };
  approvalStats: ApprovalStats;
  actionsByAgent: AgentCount[];
  trend: TrendPoint[];
  leadScoreDistribution: BucketCount[];
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

const DAYS_OPTIONS = [7, 14, 30, 90];

function pct(a: number, b: number) {
  if (!b) return '—';
  const diff = ((a - b) / b) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
}

function RatePill({ value, baseline }: { value: number; baseline: number }) {
  const diff = baseline > 0 ? ((value - baseline) / baseline) * 100 : 0;
  const isUp = diff >= 0;
  return (
    <span
      className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{
        backgroundColor: isUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        color: isUp ? '#10b981' : '#ef4444',
      }}
    >
      {isUp ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}%
    </span>
  );
}

// ─── Mini bar chart (pure CSS, no lib needed) ──────────────────────────────────

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 truncate shrink-0" style={{ color: 'var(--color-text-muted)' }}>
        {label.replace(/_/g, ' ')}
      </span>
      <div className="flex-1 rounded-full overflow-hidden h-2" style={{ backgroundColor: 'var(--color-raised)' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 text-right font-semibold" style={{ color: 'var(--color-text)' }}>{value}</span>
    </div>
  );
}

// ─── Trend sparkline (pure SVG) ───────────────────────────────────────────────

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const W = 120, H = 36, pad = 4;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (W - 2 * pad));
  const ys = points.map((v) => H - pad - ((v / max) * (H - 2 * pad)));
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function RoiAnalyticsTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<RoiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/roi?days=${d}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ROI data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(days); }, [days, fetchData]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-danger)' }}>{error ?? 'No data'}</p>
        <button
          onClick={() => fetchData(days)}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { emailPerformance: ep, approvalStats: as, actionsByAgent, trend, leadScoreDistribution } = data;
  const maxAgentCount = Math.max(...actionsByAgent.map((a) => a.count), 1);
  const trendTotals = trend.map((t) => t.total);
  const trendApproved = trend.map((t) => t.approved);

  // Bucket colours
  const BUCKET_COLORS: Record<string, string> = {
    'Hot (80-100)': '#ef4444',
    'Qualified (60-79)': '#f59e0b',
    'Warm (40-59)': '#10b981',
    'Cold (20-39)': '#6366f1',
    'Unqualified (0-19)': '#94a3b8',
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          📊 ROI & Performance Analytics
        </h2>
        <div className="flex items-center gap-3">
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={
                  days === d
                    ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                    : { color: 'var(--color-text-muted)' }
                }
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchData(days)}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
      </div>

      {/* ── Email Performance: AI vs Manual ─────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Mail className="h-5 w-5" style={{ color: '#6366f1' }} />
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            Email Performance: AI-Generated vs Manual
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(
            [
              { label: 'Open Rate', key: 'openRate', icon: '📬', color: '#6366f1' },
              { label: 'Click Rate', key: 'clickRate', icon: '🖱️', color: '#10b981' },
            ] as { label: string; key: keyof EmailStats; icon: string; color: string }[]
          ).map(({ label, key, icon, color }) => (
            <div
              key={key}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
                {icon} {label}
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>AI</p>
                  <p className="text-2xl font-bold" style={{ color }}>
                    {ep.agent[key]}%
                    <RatePill value={ep.agent[key] as number} baseline={ep.manual[key] as number} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Manual</p>
                  <p className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    {ep.manual[key]}%
                  </p>
                </div>
              </div>
              {/* side-by-side bar */}
              <div className="mt-3 flex gap-1 h-2">
                <div
                  className="rounded-full"
                  style={{ width: `${ep.agent[key]}%`, backgroundColor: color, maxWidth: '50%' }}
                />
                <div
                  className="rounded-full opacity-40"
                  style={{ width: `${ep.manual[key]}%`, backgroundColor: color, maxWidth: '50%' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color }}>AI</span>
                <span className="text-xs opacity-60" style={{ color }}>Manual</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-raised)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>AI emails sent (last {days}d)</p>
            <p className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              {ep.agent.sent.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-raised)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Manual emails sent (last {days}d)</p>
            <p className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              {ep.manual.sent.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Approval Stats + Feedback ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <ThumbsUp className="h-5 w-5" style={{ color: '#10b981' }} />
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Approval Stats
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Actions', value: as.total, color: 'var(--color-text)' },
              { label: 'Approval Rate', value: `${as.approvalRate}%`, color: '#10b981' },
              { label: 'Approved', value: as.approved, color: '#10b981' },
              { label: 'Rejected', value: as.rejected, color: '#ef4444' },
              { label: 'Pending', value: as.pending, color: '#f59e0b' },
              { label: 'Feedback Given', value: as.feedbackCount, color: '#6366f1' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-raised)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback loop health */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="h-5 w-5" style={{ color: '#6366f1' }} />
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              AI Feedback Loop Health
            </h3>
          </div>

          <div className="space-y-4">
            {/* Feedback rate gauge */}
            {(() => {
              const rate = as.total > 0 ? Math.round((as.feedbackCount / as.total) * 100) : 0;
              return (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--color-text-muted)' }}>Feedback rate</span>
                    <span className="font-bold" style={{ color: '#6366f1' }}>{rate}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: '#6366f1' }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    {as.feedbackCount} corrections submitted — these are used to personalise future AI emails.
                  </p>
                </div>
              );
            })()}

            {/* Rejection rate */}
            {(() => {
              const rate = as.total > 0 ? Math.round((as.rejected / as.total) * 100) : 0;
              return (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--color-text-muted)' }}>Rejection rate</span>
                    <span className="font-bold" style={{ color: '#ef4444' }}>{rate}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
                    <div
                      className="h-3 rounded-full"
                      style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: '#ef4444' }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    Lower is better. High rejection means the AI needs more feedback examples.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Actions by Agent (bar chart) ─────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="h-5 w-5" style={{ color: '#f59e0b' }} />
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            Actions by Agent (last {days}d)
          </h3>
        </div>
        <div className="space-y-3">
          {actionsByAgent
            .sort((a, b) => b.count - a.count)
            .map((a, i) => (
              <MiniBar
                key={a.agentType}
                label={a.agentType}
                value={a.count}
                max={maxAgentCount}
                color={['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'][i % 6]}
              />
            ))}
          {actionsByAgent.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
              No agent actions in this period.
            </p>
          )}
        </div>
      </div>

      {/* ── Trend sparklines ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: '#6366f1' }} />
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Action Trend</h3>
            </div>
            <Sparkline points={trendTotals} color="#6366f1" />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {trend.slice(-10).reverse().map((t) => (
              <div key={t.date} className="flex justify-between text-xs">
                <span style={{ color: 'var(--color-text-muted)' }}>{t.date}</span>
                <span style={{ color: 'var(--color-text)' }}>
                  {t.total} total · {t.approved} approved
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead score distribution */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">⭐</span>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Lead Score Distribution</h3>
          </div>
          <div className="space-y-3">
            {leadScoreDistribution.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                No scored leads yet.
              </p>
            )}
            {leadScoreDistribution.map(({ bucket, count }) => {
              const total = leadScoreDistribution.reduce((s, b) => s + b.count, 0) || 1;
              const pctVal = Math.round((count / total) * 100);
              const color = BUCKET_COLORS[bucket] ?? '#94a3b8';
              return (
                <div key={bucket}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--color-text-muted)' }}>{bucket}</span>
                    <span className="font-semibold" style={{ color }}>
                      {count} · {pctVal}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
                    <div className="h-2 rounded-full" style={{ width: `${pctVal}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
