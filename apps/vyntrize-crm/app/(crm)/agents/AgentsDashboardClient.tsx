'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardHeader } from './components/DashboardHeader';
import { HealthStatusWidget } from './components/HealthStatusWidget';
import { FilterControls } from './components/FilterControls';
import { ActionList } from './components/ActionList';
import { ActionDetailModal } from './components/ActionDetailModal';
import { ManualTriggerModal } from './components/ManualTriggerModal';
import { EmailTestPanel } from './components/EmailTestPanel';
import { RoiAnalyticsTab } from './components/RoiAnalyticsTab';
import { InboxView } from './components/InboxView';
import { LiveFeed } from './components/LiveFeed';
import type { AgentAction, HealthStatus, MetricsResponse, FilterState, PaginationInfo } from '@/types/agent-dashboard';

type ActiveTab = 'agents_inbox' | 'agents_history' | 'email' | 'roi';

export function AgentsDashboardClient() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('agents_inbox');

  // State management
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // URL state management
  const searchParams = useSearchParams();
  const router = useRouter();

  // Create a stable string representation of search params
  const searchParamsString = searchParams.toString();

  // Memoize filters to prevent recreation on every render
  const filters: FilterState = useMemo(() => ({
    agentType: (searchParams.get('agentType') as any) || 'all',
    status: (searchParams.get('status') as any) || 'all',
    search: searchParams.get('search') || '',
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    page: parseInt(searchParams.get('page') || '1'),
  }), [searchParamsString]);

  // Data fetching - use searchParams directly to avoid dependency issues
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Build actions URL from current searchParams
      const params = new URLSearchParams();
      const agentType = searchParams.get('agentType') || 'all';
      const status = searchParams.get('status') || 'all';
      const search = searchParams.get('search') || '';
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const page = searchParams.get('page') || '1';
      
      if (agentType !== 'all') params.set('agentType', agentType);
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('page', page);
      params.set('limit', '20');
      
      // Fetch actions, health, and metrics in parallel
      const [actionsRes, healthRes, metricsRes] = await Promise.all([
        fetch(`/api/agents/actions?${params.toString()}`),
        fetch('/api/agents/health'),
        fetch('/api/agents/metrics?days=30'),
      ]);

      if (!actionsRes.ok || !healthRes.ok || !metricsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [actionsData, healthData, metricsData] = await Promise.all([
        actionsRes.json(),
        healthRes.json(),
        metricsRes.json(),
      ]);

      setActions(actionsData.actions || []);
      setPagination(actionsData.pagination || null);
      setHealth(healthData);
      setMetrics(metricsData);
      setError(null);
    } catch (err) {
      console.error('[Dashboard] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchParamsString]);

  // Initial load - only run when searchParams string changes
  useEffect(() => {
    fetchData();
  }, [searchParamsString]);

  // Auto-refresh (every 60 seconds for actions, 30 seconds for health)
  useEffect(() => {
    const actionsInterval = setInterval(() => fetchData(true), 60000);
    const healthInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/agents/health');
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch (err) {
        console.error('[Dashboard] Error refreshing health:', err);
      }
    }, 30000);

    return () => {
      clearInterval(actionsInterval);
      clearInterval(healthInterval);
    };
  }, []);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleTrigger = () => {
    setShowTriggerModal(true);
  };

  // Filter update handler
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== null) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    router.push(`/agents?${params.toString()}`);
  };

  // Page change handler
  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  // Approve action handler
  const handleApprove = async (actionId: string) => {
    const res = await fetch(`/api/agents/actions/${actionId}/approve`, {
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error('Failed to approve action');
    }

    // Refresh data after approval
    await fetchData(true);
  };

  // Reject action handler
  const handleReject = async (actionId: string) => {
    const res = await fetch(`/api/agents/actions/${actionId}/reject`, {
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error('Failed to reject action');
    }

    // Refresh data after rejection
    await fetchData(true);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <DashboardHeader onRefresh={handleRefresh} onTrigger={handleTrigger} />
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>🤖 Agents</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>✉️ Email</button>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <DashboardHeader onRefresh={handleRefresh} onTrigger={handleTrigger} />
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>🤖 Agents</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>✉️ Email</button>
        </div>
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Failed to Load Dashboard
          </h3>
          <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader 
        onRefresh={handleRefresh} 
        onTrigger={handleTrigger}
        refreshing={refreshing}
      />

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {(
          [
            { id: 'agents_inbox', label: '📥 Inbox', title: 'Pending AI actions' },
            { id: 'agents_history', label: '📜 History', title: 'All executed actions' },
            { id: 'email',  label: '✉️ Email',  title: 'Test email delivery' },
            { id: 'roi',    label: '📊 ROI',    title: 'AI vs manual performance' },
          ] as { id: ActiveTab; label: string; title: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            title={tab.title}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              activeTab === tab.id
                ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                : { color: 'var(--color-text-muted)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Email Test Tab ──────────────────────────────────────────────── */}
      {activeTab === 'email' && <EmailTestPanel />}

      {/* ── ROI Analytics Tab ───────────────────────────────────────────── */}
      {activeTab === 'roi' && <RoiAnalyticsTab />}

      {/* ── Inbox Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'agents_inbox' && (
        <>
          <HealthStatusWidget health={health} loading={loading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="col-span-3">
              <InboxView 
                actions={actions}
                pagination={pagination || undefined}
                loading={loading}
                onApprove={handleApprove}
                onReject={handleReject}
                onRefresh={handleRefresh}
              />
            </div>
            <div className="col-span-1 h-[700px]">
              <LiveFeed actions={actions} />
            </div>
          </div>
        </>
      )}

      {/* ── History Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'agents_history' && (
        <>
          {metrics && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Actions</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {metrics.summary.totalActions}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Approval Rate</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {metrics.summary.approvalRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Avg Execution Time</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {metrics.summary.avgExecutionTimeMs}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Approved Actions</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {metrics.summary.approvedActions}
                  </p>
                </div>
              </div>
            </div>
          )}

          <FilterControls
            filters={filters}
            onFilterChange={updateFilters}
          />

          <ActionList
            actions={actions}
            pagination={pagination || undefined}
            loading={loading}
            error={error}
            onActionClick={setSelectedAction}
            onRetry={handleRefresh}
            onPageChange={handlePageChange}
          />

          {selectedAction && (
            <ActionDetailModal
              action={selectedAction}
              onClose={() => setSelectedAction(null)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </>
      )}

      {/* Manual Trigger Modal */}
      {showTriggerModal && (
        <ManualTriggerModal
          onClose={() => setShowTriggerModal(false)}
          onSuccess={() => {
            setShowTriggerModal(false);
            fetchData(true);
          }}
        />
      )}
    </div>
  );
}
