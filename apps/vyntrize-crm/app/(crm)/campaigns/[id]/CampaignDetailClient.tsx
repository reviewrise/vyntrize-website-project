'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    Mail, 
    Users, 
    MousePointerClick, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    Clock,
    Eye,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    subject: string;
    body: string;
    status: string;
    totalRecipients: number;
    sentCount: number;
    openedCount: number;
    clickedCount: number;
    bouncedCount: number;
    failedCount: number;
    createdAt: string;
    sentAt: string | null;
    completedAt: string | null;
    createdBy: {
        id: string;
        displayName: string;
        email: string;
    };
}

interface Email {
    id: string;
    toEmail: string;
    toName?: string;
    status: string;
    sentAt: string | null;
    openedAt: string | null;
    clickedAt: string | null;
    openCount: number;
    clickCount: number;
    errorMessage?: string;
    contact?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    lead?: {
        id: string;
        title: string;
    };
}

interface Props {
    campaign: Campaign;
    emails: Email[];
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: 'Draft', color: 'gray', icon: Clock },
    SCHEDULED: { label: 'Scheduled', color: 'blue', icon: Clock },
    SENDING: { label: 'Sending', color: 'yellow', icon: Mail },
    SENT: { label: 'Sent', color: 'green', icon: CheckCircle },
    FAILED: { label: 'Failed', color: 'red', icon: XCircle },
};

export default function CampaignDetailClient({ campaign, emails }: Props) {
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const getOpenRate = () => {
        if (campaign.sentCount === 0) return 0;
        return Math.round((campaign.openedCount / campaign.sentCount) * 100);
    };

    const getClickRate = () => {
        if (campaign.sentCount === 0) return 0;
        return Math.round((campaign.clickedCount / campaign.sentCount) * 100);
    };

    const getClickThroughRate = () => {
        if (campaign.openedCount === 0) return 0;
        return Math.round((campaign.clickedCount / campaign.openedCount) * 100);
    };

    const getStatusIcon = (email: Email) => {
        if (email.status === 'BOUNCED' || email.status === 'FAILED') {
            return <XCircle className="h-4 w-4 text-red-500" />;
        }
        if (email.clickedAt) {
            return <MousePointerClick className="h-4 w-4 text-green-500" />;
        }
        if (email.openedAt) {
            return <Eye className="h-4 w-4 text-blue-500" />;
        }
        if (email.status === 'SENT') {
            return <CheckCircle className="h-4 w-4 text-gray-400" />;
        }
        return <Clock className="h-4 w-4 text-gray-400" />;
    };

    const getStatusText = (email: Email) => {
        if (email.status === 'BOUNCED') return 'Bounced';
        if (email.status === 'FAILED') return 'Failed';
        if (email.clickedAt) return `Clicked (${email.clickCount}x)`;
        if (email.openedAt) return `Opened (${email.openCount}x)`;
        if (email.status === 'SENT') return 'Sent';
        return email.status;
    };

    const filteredEmails = filterStatus === 'all' 
        ? emails 
        : emails.filter(e => {
            if (filterStatus === 'opened') return e.openedAt !== null;
            if (filterStatus === 'clicked') return e.clickedAt !== null;
            if (filterStatus === 'failed') return e.status === 'FAILED' || e.status === 'BOUNCED';
            return e.status === filterStatus.toUpperCase();
        });

    const statusInfo = STATUS_LABELS[campaign.status] || STATUS_LABELS.DRAFT;
    const StatusIcon = statusInfo.icon;

    return (
        <>
            {/* Status Badge */}
            <div className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5" style={{ color: `var(--color-${statusInfo.color})` }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {statusInfo.label}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Recipients */}
                <div className="crm-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                            Recipients
                        </p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                        {campaign.sentCount}/{campaign.totalRecipients}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                        {Math.round((campaign.sentCount / campaign.totalRecipients) * 100)}% sent
                    </p>
                </div>

                {/* Open Rate */}
                <div className="crm-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                            Open Rate
                        </p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                        {getOpenRate()}%
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                        {campaign.openedCount} opens
                    </p>
                </div>

                {/* Click Rate */}
                <div className="crm-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MousePointerClick className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                            Click Rate
                        </p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                        {getClickRate()}%
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                        {campaign.clickedCount} clicks
                    </p>
                </div>

                {/* Failed */}
                <div className="crm-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                            Failed
                        </p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                        {campaign.bouncedCount + campaign.failedCount}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                        {campaign.bouncedCount} bounced, {campaign.failedCount} failed
                    </p>
                </div>
            </div>

            {/* Campaign Details */}
            <div className="crm-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Campaign Details
                </h2>
                <div className="space-y-3">
                    <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                            Subject
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                            {campaign.subject}
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() => setShowEmailPreview(!showEmailPreview)}
                            className="flex items-center gap-2 text-xs font-semibold mb-2"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            {showEmailPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {showEmailPreview ? 'Hide' : 'Show'} Email Preview
                        </button>
                        {showEmailPreview && (
                            <div 
                                className="rounded-lg p-4 text-sm overflow-auto max-h-96"
                                style={{ 
                                    backgroundColor: 'var(--color-raised)', 
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text)',
                                }}
                            >
                                <div dangerouslySetInnerHTML={{ __html: campaign.body }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recipients List */}
            <div className="crm-card overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Recipients ({filteredEmails.length})
                    </h2>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="crm-input text-xs py-1 px-2"
                    >
                        <option value="all">All ({emails.length})</option>
                        <option value="sent">Sent ({emails.filter(e => e.status === 'SENT').length})</option>
                        <option value="opened">Opened ({emails.filter(e => e.openedAt).length})</option>
                        <option value="clicked">Clicked ({emails.filter(e => e.clickedAt).length})</option>
                        <option value="failed">Failed ({emails.filter(e => e.status === 'FAILED' || e.status === 'BOUNCED').length})</option>
                    </select>
                </div>

                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {filteredEmails.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                No recipients match the selected filter
                            </p>
                        </div>
                    ) : (
                        filteredEmails.map((email) => (
                            <div key={email.id} className="px-6 py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        {/* Status Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                            {getStatusIcon(email)}
                                        </div>

                                        {/* Recipient Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {email.contact ? (
                                                    <Link 
                                                        href={`/contacts/${email.contact.id}`}
                                                        className="text-sm font-medium hover:underline"
                                                        style={{ color: 'var(--color-primary)' }}
                                                    >
                                                        {email.toName || email.toEmail}
                                                    </Link>
                                                ) : (
                                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                        {email.toName || email.toEmail}
                                                    </p>
                                                )}
                                                {email.lead && (
                                                    <Link
                                                        href={`/leads/${email.lead.id}`}
                                                        className="text-xs hover:underline"
                                                        style={{ color: 'var(--color-text-muted)' }}
                                                    >
                                                        ({email.lead.title})
                                                    </Link>
                                                )}
                                            </div>
                                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                {email.toEmail}
                                            </p>
                                            {email.errorMessage && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    Error: {email.errorMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status & Timestamp */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                                            {getStatusText(email)}
                                        </p>
                                        {email.sentAt && (
                                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                                                {new Date(email.sentAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
