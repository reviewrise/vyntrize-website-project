'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Users, CheckCircle2, XCircle,
  Clock, AlertCircle, ArrowLeft, RefreshCw, X,
} from 'lucide-react';

interface SmsCampaign {
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
  completedAt: string | null;
  scheduledAt: string | null;
  template: { id: string; name: string } | null;
  user: { id: string; displayName: string; email: string };
}

interface SmsLogEntry {
  id: string;
  toPhone: string;
  content: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  contact: { id: string; firstName: string; lastName: string; phone: string } | null;
}

interface Props {
  campaign: SmsCampaign;
  smsLogs: SmsLogEntry[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  DRAFT:     { label: 'Draft',     color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: Clock },
  SCHEDULED: { label: 'Scheduled', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  SENDING:   { label: 'Sending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: RefreshCw },
  SENT:      { label: 'Sent',      color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  FAILED:    { label: 'Failed',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: X },
};

const LOG_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  QUEUED:  { label: 'Queued',  color: '#94a3b8' },
  SENT:    { label: 'Sent',    color: '#10b981' },
  FAILED:  { label: 'Failed',  color: '#ef4444' },
  SKIPPED: { label: 'Skipped', color: '#f59e0b' },
};

export default function SmsCampaignDetailClient({ campaign, smsLogs }: Props) {
  const [filterStatus, setFilterStatus] = useState('all');

  const fmt = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const cfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.DRAFT;
  const CfgIcon = cfg.icon;

  const deliveryRate = campaign.sentCount > 0
    ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
    : 0;

  const filteredLogs = filterStatus === 'all'
    ? smsLogs
    : smsLogs.filter(l => l.status === filterStatus.toUpperCase());

  const stats = [
    {
      label: 'Total',
      value: campaign.totalRecipients,
      icon:  Users,
      color: '#94a3b8',
      bg:    'rgba(148,163,184,0.1)',
    },
    {
      label: 'Sent',
      value: campaign.sentCount,
      icon:  CheckCircle2,
      color: '#10b981',
      bg:    'rgba(16,185,129,0.1)',
    },
    {
      label: 'Failed',
      value: campaign.failedCount,
      icon:  XCircle,
      color: '#ef4444',
      bg:    'rgba(239,68,68,0.1)',
    },
    {
      label: 'Delivery Rate',
      value: `${deliveryRate}%`,
      icon:  MessageSquare,
      color: '#4f46e5',
      bg:    'rgba(79,70,229,0.1)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/campaigns"
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-muted)'; }}
            >
              <ArrowLeft className="h-3 w-3" /> Campaigns
            </Link>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}
            >
              <CfgIcon className="h-3 w-3" />
              {cfg.label}
            </span>
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}
            >
              💬 SMS
            </span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{campaign.name}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Created {fmt(campaign.createdAt)} · by {campaign.user.displayName}
            {campaign.sentAt && ` · Sent ${fmt(campaign.sentAt)}`}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => {
          const StatIcon = s.icon;
          return (
            <div key={s.label} className="crm-card flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
                <StatIcon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none" style={{ color: 'var(--color-text)' }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar for SENDING state */}
      {campaign.status === 'SENDING' && campaign.totalRecipients > 0 && (
        <div className="crm-card px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#f59e0b' }} />
              Sending in progress…
            </p>
            <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
              {campaign.sentCount} / {campaign.totalRecipients}
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--color-raised)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.round((campaign.sentCount / campaign.totalRecipients) * 100)}%`,
                backgroundColor: '#f59e0b',
              }}
            />
          </div>
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message preview */}
        <div className="lg:col-span-1">
          <div className="crm-card">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Message Preview</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Phone bubble mockup */}
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm whitespace-pre-wrap max-w-xs"
                style={{ backgroundColor: 'rgba(79,70,229,0.1)', color: 'var(--color-text)' }}
              >
                {campaign.message}
              </div>
              {campaign.template && (
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Template: {campaign.template.name}
                </p>
              )}
              <div className="pt-2 space-y-1.5 text-xs" style={{ borderTop: '1px solid var(--color-border)' }}>
                {[
                  { label: 'Chars', value: campaign.message.length },
                  { label: 'Segments', value: Math.ceil(campaign.message.length / 160) },
                  { label: 'Scheduled', value: campaign.scheduledAt ? fmt(campaign.scheduledAt) : 'Sent immediately' },
                  { label: 'Completed', value: fmt(campaign.completedAt) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recipients table */}
        <div className="lg:col-span-2">
          <div className="crm-card">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Recipients</h2>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="crm-input text-xs py-1 w-32"
              >
                <option value="all">All</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <MessageSquare className="h-8 w-8" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {smsLogs.length === 0 ? 'No messages sent yet' : 'No results for this filter'}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {filteredLogs.map(log => {
                  const logCfg = LOG_STATUS_CONFIG[log.status] ?? { label: log.status, color: '#94a3b8' };
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                          {log.contact
                            ? `${log.contact.firstName} ${log.contact.lastName}`
                            : log.toPhone}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                          {log.toPhone}
                          {log.sentAt ? ` · ${fmt(log.sentAt)}` : ''}
                        </p>
                        {log.errorMessage && (
                          <p className="text-xs mt-0.5" style={{ color: '#ef4444' }}>
                            {log.errorMessage}
                          </p>
                        )}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0"
                        style={{ backgroundColor: `${logCfg.color}18`, color: logCfg.color }}
                      >
                        {logCfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
