'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { AgentTypeBadge } from './AgentTypeBadge';
import type { AgentAction, PaginationInfo } from '@/types/agent-dashboard';

interface ActionListProps {
  actions: AgentAction[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
  onActionClick: (action: AgentAction) => void;
  onRetry: () => void;
  onPageChange?: (page: number) => void;
}

export function ActionList({ actions, pagination, loading, error, onActionClick, onRetry, onPageChange }: ActionListProps) {
  if (loading) {
    return <ActionListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <AlertCircle className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Failed to Load Actions
        </h3>
        <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '2px dashed var(--color-border)' }}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          No Actions Found
        </h3>
        <p style={{ color: 'var(--color-text-muted)' }}>
          No agent actions match your current filters. Try adjusting your filters or trigger an agent manually.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Agent
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Action
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Lead
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Reasoning
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr
                key={action.id}
                onClick={() => onActionClick(action)}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid var(--color-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-raised)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <AgentTypeBadge type={action.agentType} />
                    {action.metadata?.auto_generated && (
                      <span 
                        className="px-2 py-1 text-xs rounded-full font-medium"
                        style={{ 
                          backgroundColor: 'var(--color-info-soft)', 
                          color: 'var(--color-info)' 
                        }}
                      >
                        Auto
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
                  {formatActionType(action.actionType)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={action.status} />
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/leads/${action.leadId}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {action.lead.contactName}
                  </Link>
                  {action.lead.company && (
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {action.lead.company}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm max-w-md" style={{ color: 'var(--color-text-muted)' }}>
                  <div>
                    {truncateText(action.reasoning, 100)}
                    {action.metadata?.trigger_reason && (
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                        Trigger: {action.metadata.trigger_reason}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                  {formatRelativeTime(action.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {actions.map((action) => (
          <div
            key={action.id}
            onClick={() => onActionClick(action)}
            className="p-4 cursor-pointer active:bg-opacity-50"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <AgentTypeBadge type={action.agentType} />
                {action.metadata?.auto_generated && (
                  <span 
                    className="px-2 py-1 text-xs rounded-full font-medium"
                    style={{ 
                      backgroundColor: 'var(--color-info-soft)', 
                      color: 'var(--color-info)' 
                    }}
                  >
                    Auto
                  </span>
                )}
              </div>
              <StatusBadge status={action.status} />
            </div>
            <Link
              href={`/leads/${action.leadId}`}
              className="text-sm font-medium block mb-1"
              style={{ color: 'var(--color-primary)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {action.lead.contactName}
            </Link>
            {action.lead.company && (
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                {action.lead.company}
              </p>
            )}
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
              {truncateText(action.reasoning, 80)}
            </p>
            {action.metadata?.trigger_reason && (
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-subtle)' }}>
                Trigger: {action.metadata.trigger_reason}
              </p>
            )}
            <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
              {formatRelativeTime(action.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-raised)',
                color: 'var(--color-text)',
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-raised)',
                color: 'var(--color-text)',
              }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionListSkeleton() {
  return (
    <div className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

function formatActionType(type: string): string {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function formatRelativeTime(dateString: string): string {
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
  return date.toLocaleDateString();
}
