'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, MessageSquare, Search, TrendingUp, Users,
  MousePointerClick, AlertCircle, Plus, ChevronDown,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailCampaign {
  kind: 'email';
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
  createdBy: { id: string; displayName: string; email: string };
}

interface SmsCampaign {
  kind: 'sms';
  id: string;
  name: string;
  message: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
  createdBy: { id: string; displayName: string; email: string };
}

type Campaign = EmailCampaign | SmsCampaign;

interface Props {
  emailCampaigns: EmailCampaign[];
  smsCampaigns:  SmsCampaign[];
  q:             string;
  status:        string;
  pageNum:       number;
  totalPages:    number;
  total:         number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'Draft',     color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  SCHEDULED: { label: 'Scheduled', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  SENDING:   { label: 'Sending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  SENT:      { label: 'Sent',      color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  FAILED:    { label: 'Failed',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  CANCELLED: { label: 'Cancelled', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CampaignsClient({
  emailCampaigns, smsCampaigns, q, status, pageNum, totalPages, total,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab]     = useState<'all' | 'email' | 'sms'>('all');
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  const allCampaigns: Campaign[] = [
    ...emailCampaigns,
    ...smsCampaigns,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayed = activeTab === 'all'
    ? allCampaigns
    : activeTab === 'email'
    ? emailCampaigns
    : smsCampaigns;

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const getOpenRate = (c: EmailCampaign) =>
    c.sentCount === 0 ? 0 : Math.round((c.openedCount / c.sentCount) * 100);

  const getClickRate = (c: EmailCampaign) =>
    c.sentCount === 0 ? 0 : Math.round((c.clickedCount / c.sentCount) * 100);

  const getDeliveryRate = (c: SmsCampaign) =>
    c.totalRecipients === 0 ? 0 : Math.round((c.sentCount / c.totalRecipients) * 100);

  const CampaignRow = ({ campaign }: { campaign: Campaign }) => {
    const cfg  = STATUS_COLORS[campaign.status] ?? STATUS_COLORS.DRAFT;
    const href = campaign.kind === 'email'
      ? `/campaigns/${campaign.id}`
      : `/campaigns/sms/${campaign.id}`;

    return (
      <Link
        href={href}
        className="flex items-start gap-4 px-6 py-4 transition-colors"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-raised)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {/* Channel icon */}
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            backgroundColor: campaign.kind === 'email'
              ? 'rgba(79,70,229,0.1)'
              : 'rgba(16,185,129,0.1)',
          }}
        >
          {campaign.kind === 'email'
            ? <Mail        className="h-4 w-4" style={{ color: '#4f46e5' }} />
            : <MessageSquare className="h-4 w-4" style={{ color: '#10b981' }} />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {campaign.name}
            </h3>
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0"
              style={{
                backgroundColor: campaign.kind === 'email'
                  ? 'rgba(79,70,229,0.08)'
                  : 'rgba(16,185,129,0.08)',
                color: campaign.kind === 'email' ? '#4f46e5' : '#10b981',
              }}
            >
              {campaign.kind === 'email' ? '✉ Email' : '💬 SMS'}
            </span>
          </div>
          <p className="text-xs truncate mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            {campaign.kind === 'email'
              ? (campaign as EmailCampaign).subject
              : (campaign as SmsCampaign).message.slice(0, 100) + ((campaign as SmsCampaign).message.length > 100 ? '…' : '')}
          </p>
          <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {campaign.sentCount}/{campaign.totalRecipients} sent
            </span>
            <span>·</span>
            <span>{fmt(campaign.sentAt ?? campaign.createdAt)}</span>
            <span>·</span>
            <span>by {campaign.createdBy.displayName}</span>
          </div>
        </div>

        {/* Stats */}
        {campaign.sentCount > 0 && (
          <div className="flex items-center gap-5 flex-shrink-0">
            {campaign.kind === 'email' ? (
              <>
                <div className="text-center hidden md:block">
                  <p className="text-base font-bold leading-none" style={{ color: 'var(--color-text)' }}>
                    {getOpenRate(campaign as EmailCampaign)}%
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Open</p>
                </div>
                <div className="text-center hidden md:block">
                  <p className="text-base font-bold leading-none" style={{ color: 'var(--color-text)' }}>
                    {getClickRate(campaign as EmailCampaign)}%
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Click</p>
                </div>
                {((campaign as EmailCampaign).bouncedCount + (campaign as EmailCampaign).failedCount) > 0 && (
                  <div className="text-center hidden md:block">
                    <p className="text-base font-bold leading-none text-red-500">
                      {(campaign as EmailCampaign).bouncedCount + (campaign as EmailCampaign).failedCount}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Failed</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center hidden md:block">
                  <p className="text-base font-bold leading-none" style={{ color: 'var(--color-text)' }}>
                    {getDeliveryRate(campaign as SmsCampaign)}%
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Delivery</p>
                </div>
                {(campaign as SmsCampaign).failedCount > 0 && (
                  <div className="text-center hidden md:block">
                    <p className="text-base font-bold leading-none text-red-500">
                      {(campaign as SmsCampaign).failedCount}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Failed</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Campaigns</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {total} campaign{total !== 1 ? 's' : ''} · {emailCampaigns.length} email, {smsCampaigns.length} SMS
          </p>
        </div>

        {/* New Campaign dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNewMenuOpen(o => !o)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            New Campaign
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {newMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNewMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl overflow-hidden z-20"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <Link
                  href="/campaigns/new"
                  onClick={() => setNewMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-raised)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(79,70,229,0.1)' }}>
                    <Mail className="h-3.5 w-3.5" style={{ color: '#4f46e5' }} />
                  </div>
                  <div>
                    <p className="font-medium leading-none">Email Campaign</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Bulk email blast</p>
                  </div>
                </Link>
                <Link
                  href="/campaigns/sms/new"
                  onClick={() => setNewMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                  style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-raised)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                    <MessageSquare className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p className="font-medium leading-none">SMS Campaign</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Bulk text message</p>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs + Search row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Tabs */}
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}
        >
          {([['all', 'All'], ['email', '✉ Email'], ['sms', '💬 SMS']] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab ? 'var(--color-primary)' : 'transparent',
                color:           activeTab === tab ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form method="GET" className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search campaigns…"
              className="crm-input pl-9 pr-4 w-full"
            />
          </div>
          <input type="hidden" name="status" value={status} />
        </form>

        {/* Status filter */}
        <select
          value={status}
          onChange={e => {
            const p = new URLSearchParams();
            if (q) p.set('q', q);
            p.set('status', e.target.value);
            router.push(`/campaigns?${p.toString()}`);
          }}
          className="crm-input w-36"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Campaign list */}
      <div className="crm-card overflow-hidden">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-raised)' }}
            >
              {activeTab === 'sms'
                ? <MessageSquare className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
                : <Mail         className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
              }
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {q ? 'No campaigns found' : `No ${activeTab === 'all' ? '' : activeTab + ' '}campaigns yet`}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {q
                  ? `No results for "${q}"`
                  : activeTab === 'sms'
                  ? 'Create your first SMS campaign'
                  : 'Send your first campaign to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {displayed.map(c => <CampaignRow key={`${c.kind}-${c.id}`} campaign={c} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Page {pageNum} of {totalPages}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={`/campaigns?q=${q}&status=${status}&page=${pageNum - 1}`} className="btn-secondary text-xs py-1.5 px-3">
                ← Previous
              </Link>
            )}
            {pageNum < totalPages && (
              <Link href={`/campaigns?q=${q}&status=${status}&page=${pageNum + 1}`} className="btn-secondary text-xs py-1.5 px-3">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
