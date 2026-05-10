'use client';

import { CheckCircle, Clock, XCircle, AlertCircle, Zap } from 'lucide-react';
import type { ActionStatus } from '@platform/vyntrize-db';

interface StatusBadgeProps {
  status: ActionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<ActionStatus, { icon: any; color: string; bg: string; label: string }> = {
    PENDING: {
      icon: Clock,
      color: 'var(--color-warning)',
      bg: 'rgba(251, 191, 36, 0.1)',
      label: 'Pending',
    },
    APPROVED: {
      icon: CheckCircle,
      color: 'var(--color-success)',
      bg: 'rgba(34, 197, 94, 0.1)',
      label: 'Approved',
    },
    REJECTED: {
      icon: XCircle,
      color: 'var(--color-danger)',
      bg: 'rgba(239, 68, 68, 0.1)',
      label: 'Rejected',
    },
    EXECUTED: {
      icon: Zap,
      color: 'var(--color-success)',
      bg: 'rgba(34, 197, 94, 0.1)',
      label: 'Executed',
    },
    FAILED: {
      icon: AlertCircle,
      color: 'var(--color-danger)',
      bg: 'rgba(239, 68, 68, 0.1)',
      label: 'Failed',
    },
  };

  const statusConfig = config[status];
  const Icon = statusConfig.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        color: statusConfig.color,
        backgroundColor: statusConfig.bg,
      }}
      aria-label={`Status: ${statusConfig.label}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {statusConfig.label}
    </span>
  );
}
