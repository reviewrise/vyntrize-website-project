'use client';

import { RefreshCw, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh: () => void;
  onTrigger: () => void;
  refreshing?: boolean;
}

export function DashboardHeader({ onRefresh, onTrigger, refreshing = false }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          AI Agent Dashboard
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Monitor agent activity, approve suggestions, and track performance
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        
        <button
          onClick={onTrigger}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
          style={{
            backgroundColor: 'var(--color-primary)',
            boxShadow: 'var(--shadow-md)',
          }}
          aria-label="Manually trigger agent"
        >
          <Zap className="h-4 w-4" />
          Trigger Agent
        </button>
      </div>
    </div>
  );
}
