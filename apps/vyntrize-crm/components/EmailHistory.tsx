'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon, EnvelopeOpenIcon, CursorArrowRaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface EmailHistoryProps {
  id: string;
  type: 'contact' | 'lead';
}

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
  template?: {
    id: number;
    name: string;
  };
  sentBy: {
    id: string;
    displayName: string;
    email: string;
  };
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

export default function EmailHistory({ id, type }: EmailHistoryProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEmails();
  }, [id, type, page]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email/history/${id}?type=${type}&page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch email history');
      }

      const data = await response.json();
      setEmails(data.emails);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email history');
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

  const getStatusText = (email: Email) => {
    if (email.status === 'BOUNCED') return 'Bounced';
    if (email.status === 'FAILED') return 'Failed';
    if (email.clickedAt) return `Clicked (${email.clickCount}x)`;
    if (email.openedAt) return `Opened (${email.openCount}x)`;
    if (email.status === 'SENT') return 'Sent';
    return email.status;
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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  if (loading && emails.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
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
      {/* Header with Stats */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Email History</h3>
        {stats && (
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div>
              <p className="text-gray-500">Opened</p>
              <p className="text-xl font-semibold text-blue-600">
                {stats.opened}
                {stats.sent > 0 && (
                  <span className="text-sm text-gray-500 ml-1">
                    ({Math.round((stats.opened / stats.sent) * 100)}%)
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Clicked</p>
              <p className="text-xl font-semibold text-green-600">
                {stats.clicked}
                {stats.sent > 0 && (
                  <span className="text-sm text-gray-500 ml-1">
                    ({Math.round((stats.clicked / stats.sent) * 100)}%)
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Failed</p>
              <p className="text-xl font-semibold text-red-600">{stats.bounced + stats.failed}</p>
            </div>
          </div>
        )}
      </div>

      {/* Email List */}
      <div className="divide-y divide-gray-200">
        {emails.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No emails sent yet</p>
          </div>
        ) : (
          emails.map((email) => (
            <div key={email.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(email)}
                </div>

                {/* Email Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {email.template && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                            {email.template.name}
                          </span>
                        )}
                        Sent by {email.sentBy.displayName}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500">{formatDate(email.sentAt)}</p>
                      <p className="text-xs font-medium text-gray-700 mt-1">
                        {getStatusText(email)}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(email.openedAt || email.clickedAt) && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      {email.openedAt && (
                        <span>
                          First opened {formatDate(email.openedAt)}
                        </span>
                      )}
                      {email.clickedAt && (
                        <span>
                          First clicked {formatDate(email.clickedAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
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
