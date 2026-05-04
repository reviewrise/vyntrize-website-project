'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Search, TrendingUp, Users, MousePointerClick, AlertCircle } from 'lucide-react';

interface Campaign {
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
    createdBy: {
        id: string;
        displayName: string;
        email: string;
    };
    emailCount: number;
}

interface Props {
    campaigns: Campaign[];
    total: number;
    q: string;
    status: string;
    pageNum: number;
    totalPages: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Draft', color: 'gray' },
    SCHEDULED: { label: 'Scheduled', color: 'blue' },
    SENDING: { label: 'Sending', color: 'yellow' },
    SENT: { label: 'Sent', color: 'green' },
    FAILED: { label: 'Failed', color: 'red' },
};

export default function CampaignsClient({ campaigns, total, q, status, pageNum, totalPages }: Props) {
    const router = useRouter();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getOpenRate = (campaign: Campaign) => {
        if (campaign.sentCount === 0) return 0;
        return Math.round((campaign.openedCount / campaign.sentCount) * 100);
    };

    const getClickRate = (campaign: Campaign) => {
        if (campaign.sentCount === 0) return 0;
        return Math.round((campaign.clickedCount / campaign.sentCount) * 100);
    };

    const getStatusBadge = (statusKey: string) => {
        const statusInfo = STATUS_LABELS[statusKey] || { label: statusKey, color: 'gray' };
        const colorClasses: Record<string, string> = {
            gray: 'bg-gray-100 text-gray-700 border-gray-200',
            blue: 'bg-blue-100 text-blue-700 border-blue-200',
            yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            green: 'bg-green-100 text-green-700 border-green-200',
            red: 'bg-red-100 text-red-700 border-red-200',
        };

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colorClasses[statusInfo.color]}`}>
                {statusInfo.label}
            </span>
        );
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Email Campaigns</h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {total} campaign{total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link href="/campaigns/new" className="btn-primary">
                    <Mail className="h-3.5 w-3.5" /> New Campaign
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
                {/* Search */}
                <form method="GET" className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                        <input
                            name="q"
                            type="text"
                            defaultValue={q}
                            placeholder="Search campaigns..."
                            className="crm-input pl-9 pr-4"
                        />
                    </div>
                    <input type="hidden" name="status" value={status} />
                </form>

                {/* Status Filter */}
                <select
                    value={status}
                    onChange={(e) => {
                        const params = new URLSearchParams();
                        if (q) params.set('q', q);
                        params.set('status', e.target.value);
                        router.push(`/campaigns?${params.toString()}`);
                    }}
                    className="crm-input w-40"
                >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="sending">Sending</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* Campaigns List */}
            <div className="crm-card overflow-hidden">
                {campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div
                            className="h-12 w-12 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-raised)' }}
                        >
                            <Mail className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                {q ? 'No campaigns found' : 'No campaigns yet'}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                {q ? `No campaigns match "${q}"` : 'Send your first bulk email to create a campaign'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                        {campaigns.map((campaign) => (
                            <Link
                                key={campaign.id}
                                href={`/campaigns/${campaign.id}`}
                                className="block px-6 py-4 transition-colors hover:bg-opacity-50"
                                style={{ backgroundColor: 'transparent' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-raised)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Campaign Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                {campaign.name}
                                            </h3>
                                            {getStatusBadge(campaign.status)}
                                        </div>
                                        <p className="text-xs truncate mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                            {campaign.subject}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {campaign.sentCount}/{campaign.totalRecipients} sent
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {campaign.sentAt ? formatDate(campaign.sentAt) : formatDate(campaign.createdAt)}
                                            </span>
                                            <span>•</span>
                                            <span>by {campaign.createdBy.displayName}</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    {campaign.sentCount > 0 && (
                                        <div className="flex items-center gap-6">
                                            {/* Open Rate */}
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Mail className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                                                    <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                                                        {getOpenRate(campaign)}%
                                                    </p>
                                                </div>
                                                <p className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                                                    {campaign.openedCount} opens
                                                </p>
                                            </div>

                                            {/* Click Rate */}
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <MousePointerClick className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                                                    <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                                                        {getClickRate(campaign)}%
                                                    </p>
                                                </div>
                                                <p className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                                                    {campaign.clickedCount} clicks
                                                </p>
                                            </div>

                                            {/* Failed */}
                                            {(campaign.bouncedCount + campaign.failedCount) > 0 && (
                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                                        <p className="text-lg font-bold text-red-600">
                                                            {campaign.bouncedCount + campaign.failedCount}
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                                                        failed
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Showing {(pageNum - 1) * 20 + 1}–{Math.min(pageNum * 20, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        {pageNum > 1 && (
                            <Link 
                                href={`/campaigns?q=${q}&status=${status}&page=${pageNum - 1}`} 
                                className="btn-secondary text-xs py-1.5 px-3"
                            >
                                ← Previous
                            </Link>
                        )}
                        {pageNum < totalPages && (
                            <Link 
                                href={`/campaigns?q=${q}&status=${status}&page=${pageNum + 1}`} 
                                className="btn-secondary text-xs py-1.5 px-3"
                            >
                                Next →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
