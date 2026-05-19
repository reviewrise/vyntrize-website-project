// apps/vyntrize-crm/components/GlobalEmailLogs.tsx
// Global email logs page component (app‑level)

'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon, EnvelopeOpenIcon, CursorArrowRaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Email {
  id: string;
  subject: string;
  toEmail: string;
  toName?: string;
  status: string;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  openCount: number;
  clickCount: number;
  errorMessage?: string;
  template?: { id: number; name: string };
  sentBy?: { id: string; displayName: string; email: string };
  trackingId: string;
}

interface Stats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
}

export default function GlobalEmailLogs() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email/logs?page=${page}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch email logs');
      }
      const data = await response.json();
      setEmails(data.emails);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (email: Email) => {
    if (email.status === 'BOUNCED' || email.status === 'FAILED') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
    if (email.clickedAt) {
      return <CursorArrowRaysIcon className="h-5 w-5 text-green-500" />;
    }
    if (email.openedAt) {
      return <EnvelopeOpenIcon className="h-5 w-5 text-blue-500" />;
    }
    return <EnvelopeIcon className="h-5 w-5 text-gray-400" />;
  };

  const getStatusBadge = (email: Email) => {
    if (email.status === 'FAILED') return { label: 'Failed to Send', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (email.status === 'BOUNCED') return { label: 'Bounced', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    if (email.clickedAt) return { label: `Clicked (${email.clickCount}x)`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (email.openedAt) return { label: `Opened (${email.openCount}x)`, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    if (email.status === 'SENT' || email.status === 'DELIVERED') return { label: 'Sent', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
    return { label: email.status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading && emails.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header stats */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">All Email Logs</h3>
        {stats && (
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div>
              <p className="text-gray-500">Sent</p>
              <p className="text-xl font-semibold text-gray-600">{stats.sent}</p>
            </div>
            <div>
              <p className="text-gray-500">Opened</p>
              <p className="text-xl font-semibold text-blue-600">
                {stats.opened}
                {stats.sent > 0 && (
                  <span className="text-sm text-gray-500 ml-1">({Math.round((stats.opened / stats.sent) * 100)}%)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Clicked</p>
              <p className="text-xl font-semibold text-green-600">
                {stats.clicked}
                {stats.sent > 0 && (
                  <span className="text-sm text-gray-500 ml-1">({Math.round((stats.clicked / stats.sent) * 100)}%)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Failed</p>
              <p className="text-xl font-semibold text-red-600">{stats.failed + stats.bounced}</p>
            </div>
          </div>
        )}
      </div>

      {/* Email list */}
      <div className="divide-y divide-gray-200">
        {emails.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No email logs found</p>
          </div>
        ) : (
          emails.map(email => {
            const badge = getStatusBadge(email);
            return (
              <div
                key={email.id}
                className="px-6 py-4 transition-colors"
                style={{
                  borderLeft:
                    email.status === 'FAILED'
                      ? '3px solid #ef4444'
                      : email.status === 'BOUNCED'
                      ? '3px solid #f59e0b'
                      : '3px solid transparent',
                  backgroundColor: email.status === 'FAILED' ? 'rgba(239,68,68,0.02)' : undefined,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">{getStatusIcon(email)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{email.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {email.template && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                              {email.template.name}
                            </span>
                          )}
                          {email.sentBy ? `Sent by ${email.sentBy.displayName}` : 'Sent by agent'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500">{formatDate(email.sentAt)}</p>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1"
                          style={{ color: badge.color, backgroundColor: badge.bg }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    {email.status === 'FAILED' && email.errorMessage && (
                      <div
                        className="mt-2 rounded-md px-3 py-2 text-xs"
                        style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        <span className="font-semibold">Error: </span>{email.errorMessage}
                      </div>
                    )}
                    {(email.openedAt || email.clickedAt) && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        {email.openedAt && <span>First opened {formatDate(email.openedAt)}</span>}
                        {email.clickedAt && <span>First clicked {formatDate(email.clickedAt)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
