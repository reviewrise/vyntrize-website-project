# Design Document: Agent Dashboard UI

## Overview

The Agent Dashboard UI is a comprehensive web interface for monitoring and managing the AI Pipeline Agent System in the Vyntrize CRM. This document specifies the technical architecture, component design, data flow, and implementation details for building a responsive, accessible, and performant dashboard that integrates seamlessly with the existing CRM application.

### Design Principles

1. **Consistency**: Match existing CRM design patterns, components, and styling
2. **Performance**: Fast initial load, efficient data fetching, optimistic UI updates
3. **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation
4. **Responsiveness**: Mobile-first design that adapts to all screen sizes
5. **Maintainability**: Clear component hierarchy, typed interfaces, reusable patterns

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │         /agents Dashboard Page (RSC)                 │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  AgentsDashboardClient (Client Component)      │  │   │
│  │  │  ┌──────────────────────────────────────────┐  │  │   │
│  │  │  │  Health Status Widget                    │  │  │   │
│  │  │  │  Metrics Panel                           │  │  │   │
│  │  │  │  Action List with Filters                │  │  │   │
│  │  │  │  Action Detail Modal                     │  │  │   │
│  │  │  │  Manual Trigger Modal                    │  │  │   │
│  │  │  └──────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Server (API)                       │
├─────────────────────────────────────────────────────────────┤
│  /api/agents/health      - System health status             │
│  /api/agents/actions     - List actions (paginated)         │
│  /api/agents/metrics     - Performance metrics              │
│  /api/agents/trigger     - Manual agent trigger             │
│  /api/agents/actions/:id/approve - Approve action           │
│  /api/agents/actions/:id/reject  - Reject action            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  - AgentAction table                                         │
│  - AgentMetric table                                         │
│  - Lead table (with relations)                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
app/(crm)/agents/page.tsx (Server Component)
└── AgentsDashboardClient (Client Component)
    ├── DashboardHeader
    │   ├── PageTitle
    │   ├── RefreshButton
    │   └── ManualTriggerButton
    │
    ├── HealthStatusWidget
    │   ├── SystemStatusBadge
    │   ├── AgentRegistryStatus
    │   ├── AIProviderStatus
    │   └── JobQueueMetrics
    │
    ├── MetricsPanel
    │   ├── TimePeriodSelector
    │   ├── MetricCard (x4)
    │   └── ActionBreakdownCharts
    │
    ├── FilterControls
    │   ├── AgentTypeFilter
    │   ├── StatusFilter
    │   ├── DateRangePicker
    │   ├── SearchInput
    │   └── ClearFiltersButton
    │
    ├── ActionList
    │   ├── ActionTable (Desktop)
    │   │   ├── TableHeader
    │   │   ├── TableRow (x20)
    │   │   │   ├── AgentTypeBadge
    │   │   │   ├── StatusBadge
    │   │   │   ├── LeadLink
    │   │   │   └── ReasoningPreview
    │   │   └── PaginationControls
    │   │
    │   └── ActionCards (Mobile)
    │       ├── ActionCard (x20)
    │       └── PaginationControls
    │
    ├── ActionDetailModal
    │   ├── ModalHeader
    │   ├── ActionInfo
    │   ├── ReasoningDisplay
    │   ├── MetadataViewer
    │   ├── ApprovalInterface (if PENDING)
    │   └── ModalFooter
    │
    └── ManualTriggerModal
        ├── LeadSearchInput
        ├── LeadList
        ├── AgentTypeCheckboxes
        └── TriggerButton
```

## Routing and Navigation

### Route Structure

```
/agents                    - Main dashboard page
/agents?page=2            - Paginated actions
/agents?status=PENDING    - Filtered by status
/agents?agentType=LEAD_SCORING - Filtered by agent type
/agents?search=acme       - Search by lead name
```

### Sidebar Navigation Update

**File**: `apps/vyntrize-crm/components/Sidebar.tsx`

Add new navigation section between "Website" and "Settings":

```typescript
const AI_AGENTS_NAV = [
  { href: '/agents', label: 'Dashboard', icon: Sparkles },
  // Future items:
  // { href: '/agents/settings', label: 'Settings', icon: Settings },
  // { href: '/agents/logs', label: 'Logs', icon: FileText },
];

// In the render:
<SectionLabel label="AI Agents" />
<div className="space-y-0.5">
  {AI_AGENTS_NAV.map(item => <NavItem key={item.href} {...item} />)}
</div>
```

**Icon**: Use `Sparkles` from `lucide-react` for the AI Agents section icon.

## Data Models and Types

### TypeScript Interfaces

```typescript
// types/agent-dashboard.ts

import { AgentType, ActionType, ActionStatus, AutonomyLevel } from '@prisma/client';

export interface AgentAction {
  id: string;
  agentType: AgentType;
  actionType: ActionType;
  status: ActionStatus;
  autonomyLevel: AutonomyLevel;
  reasoning: string;
  metadata: Record<string, any>;
  leadId: string;
  lead: {
    id: string;
    contactName: string;
    company: string | null;
    stage: string;
    contact: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  };
  approvedByUserId: string | null;
  approvedByUser: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  createdAt: string;
  executedAt: string | null;
  approvedAt: string | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActionsResponse {
  actions: AgentAction[];
  pagination: PaginationInfo;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    agentRegistry: {
      status: string;
      initialized: boolean;
    };
    jobQueue: {
      status: string;
      metrics: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
      };
    };
    aiProviders: {
      status: string;
      defaultProvider: string;
      availableProviders: string[];
      providers: Record<string, {
        available: boolean;
        circuitOpen: boolean;
        failureCount: number;
      }>;
    };
  };
}

export interface MetricsSummary {
  totalActions: number;
  approvedActions: number;
  approvalRate: number;
  avgExecutionTimeMs: number;
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
}

export interface MetricsResponse {
  summary: MetricsSummary;
  actionsByStatus: Array<{
    status: ActionStatus;
    agentType: AgentType;
    _count: number;
  }>;
  actionsByType: Array<{
    actionType: ActionType;
    agentType: AgentType;
    _count: number;
  }>;
  metricsByAgent: Record<string, Array<{
    metricName: string;
    metricValue: number;
    calculatedAt: string;
    metadata: Record<string, any>;
  }>>;
}

export interface FilterState {
  agentType: AgentType | 'all';
  status: ActionStatus | 'all';
  search: string;
  startDate: string | null;
  endDate: string | null;
  page: number;
}

export interface TriggerRequest {
  agentType: AgentType;
  leadId: string;
}

export interface TriggerResponse {
  success: boolean;
  agentType: AgentType;
  leadId: string;
  result: {
    actionId: string;
    reasoning: string;
    metadata: Record<string, any>;
  };
}
```

## Component Specifications

### 1. Dashboard Page (Server Component)

**File**: `apps/vyntrize-crm/app/(crm)/agents/page.tsx`

```typescript
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AgentsDashboardClient } from './AgentsDashboardClient';

export const metadata = {
  title: 'AI Agent Dashboard | Vyntrize CRM',
  description: 'Monitor and manage AI agents in your CRM',
};

export default async function AgentsPage() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return <AgentsDashboardClient />;
}
```

**Purpose**: Server-side authentication check and metadata setup.

**Authentication**: Uses `iron-session` via `getSession()` to verify user is logged in.

### 2. AgentsDashboardClient (Client Component)

**File**: `apps/vyntrize-crm/app/(crm)/agents/AgentsDashboardClient.tsx`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardHeader } from './components/DashboardHeader';
import { HealthStatusWidget } from './components/HealthStatusWidget';
import { MetricsPanel } from './components/MetricsPanel';
import { FilterControls } from './components/FilterControls';
import { ActionList } from './components/ActionList';
import { ActionDetailModal } from './components/ActionDetailModal';
import { ManualTriggerModal } from './components/ManualTriggerModal';
import type { FilterState, AgentAction, HealthStatus, MetricsResponse } from '@/types/agent-dashboard';

export function AgentsDashboardClient() {
  // State management
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // URL state management
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const filters: FilterState = {
    agentType: (searchParams.get('agentType') as any) || 'all',
    status: (searchParams.get('status') as any) || 'all',
    search: searchParams.get('search') || '',
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    page: parseInt(searchParams.get('page') || '1'),
  };

  // Data fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch actions, health, and metrics in parallel
      const [actionsRes, healthRes, metricsRes] = await Promise.all([
        fetch(buildActionsUrl(filters)),
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

      setActions(actionsData.actions);
      setHealth(healthData);
      setMetrics(metricsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Auto-refresh
  useEffect(() => {
    fetchData();
    
    // Refresh actions every 60 seconds
    const actionsInterval = setInterval(fetchData, 60000);
    
    // Refresh health every 30 seconds
    const healthInterval = setInterval(async () => {
      const res = await fetch('/api/agents/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    }, 30000);

    return () => {
      clearInterval(actionsInterval);
      clearInterval(healthInterval);
    };
  }, [fetchData]);

  // Filter update handler
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    router.push(`/agents?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      <DashboardHeader
        onRefresh={fetchData}
        onTrigger={() => setShowTriggerModal(true)}
      />

      <HealthStatusWidget health={health} loading={loading} />

      <MetricsPanel metrics={metrics} loading={loading} />

      <FilterControls
        filters={filters}
        onFilterChange={updateFilters}
      />

      <ActionList
        actions={actions}
        loading={loading}
        error={error}
        onActionClick={setSelectedAction}
        onRetry={fetchData}
      />

      {selectedAction && (
        <ActionDetailModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {showTriggerModal && (
        <ManualTriggerModal
          onClose={() => setShowTriggerModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

function buildActionsUrl(filters: FilterState): string {
  const params = new URLSearchParams();
  
  if (filters.agentType !== 'all') params.set('agentType', filters.agentType);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  params.set('page', filters.page.toString());
  params.set('limit', '20');
  
  return `/api/agents/actions?${params.toString()}`;
}
```

**State Management**: Uses React hooks for local state, URL search params for filter state.

**Auto-Refresh**: 
- Actions: 60 seconds
- Health: 30 seconds
- Pauses when tab not visible (handled by browser)

**Performance**: Parallel data fetching, debounced search input.



### 3. DashboardHeader Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/DashboardHeader.tsx`

```typescript
'use client';

import { RefreshCw, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh: () => void;
  onTrigger: () => void;
}

export function DashboardHeader({ onRefresh, onTrigger }: DashboardHeaderProps) {
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
          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className="h-4 w-4" />
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
```

**Styling**: Matches existing CRM header patterns from analytics page.

**Accessibility**: ARIA labels for screen readers.

### 4. HealthStatusWidget Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/HealthStatusWidget.tsx`

```typescript
'use client';

import { CheckCircle, XCircle, AlertCircle, Activity } from 'lucide-react';
import type { HealthStatus } from '@/types/agent-dashboard';

interface HealthStatusWidgetProps {
  health: HealthStatus | null;
  loading: boolean;
}

export function HealthStatusWidget({ health, loading }: HealthStatusWidgetProps) {
  if (loading) {
    return <HealthStatusSkeleton />;
  }

  if (!health) {
    return <HealthStatusError />;
  }

  const statusIcon = {
    healthy: <CheckCircle className="h-5 w-5" style={{ color: 'var(--color-success)' }} />,
    degraded: <AlertCircle className="h-5 w-5" style={{ color: 'var(--color-warning)' }} />,
    unhealthy: <XCircle className="h-5 w-5" style={{ color: 'var(--color-danger)' }} />,
  }[health.status];

  const statusColor = {
    healthy: 'var(--color-success)',
    degraded: 'var(--color-warning)',
    unhealthy: 'var(--color-danger)',
  }[health.status];

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          System Health
        </h2>
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="text-sm font-semibold capitalize" style={{ color: statusColor }}>
            {health.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agent Registry */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-raised)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Agent Registry
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {health.components.agentRegistry.initialized ? 'Initialized' : 'Not Initialized'}
          </p>
        </div>

        {/* Job Queue */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-raised)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Job Queue
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {health.components.jobQueue.metrics.waiting} waiting, {health.components.jobQueue.metrics.active} active
          </p>
        </div>

        {/* AI Providers */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-raised)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              AI Providers
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {health.components.aiProviders.defaultProvider} ({health.components.aiProviders.availableProviders.length} available)
          </p>
        </div>
      </div>

      <p className="text-xs mt-4" style={{ color: 'var(--color-text-subtle)' }}>
        Last updated: {new Date(health.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}

function HealthStatusSkeleton() {
  return (
    <div className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

function HealthStatusError() {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <p style={{ color: 'var(--color-danger)' }}>Failed to load health status</p>
    </div>
  );
}
```

**Real-time Updates**: Refreshes every 30 seconds via parent component.

**Visual Indicators**: Color-coded status badges (green/yellow/red).

### 5. MetricsPanel Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/MetricsPanel.tsx`

```typescript
'use client';

import { useState } from 'react';
import { TrendingUp, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import type { MetricsResponse } from '@/types/agent-dashboard';

interface MetricsPanelProps {
  metrics: MetricsResponse | null;
  loading: boolean;
}

export function MetricsPanel({ metrics, loading }: MetricsPanelProps) {
  const [timePeriod, setTimePeriod] = useState<7 | 30 | 90>(30);

  if (loading) {
    return <MetricsPanelSkeleton />;
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Performance Metrics
        </h2>
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setTimePeriod(days as 7 | 30 | 90)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: timePeriod === days ? 'var(--color-primary-soft)' : 'transparent',
                color: timePeriod === days ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Actions"
          value={metrics.summary.totalActions}
          icon={<BarChart3 className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
        <MetricCard
          title="Approval Rate"
          value={`${metrics.summary.approvalRate.toFixed(1)}%`}
          icon={<CheckCircle className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
        <MetricCard
          title="Avg Execution Time"
          value={`${metrics.summary.avgExecutionTimeMs}ms`}
          icon={<Clock className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
        <MetricCard
          title="Approved Actions"
          value={metrics.summary.approvedActions}
          icon={<TrendingUp className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
      </div>

      {/* Action Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionsByStatus data={metrics.actionsByStatus} />
        <ActionsByType data={metrics.actionsByType} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          {title}
        </p>
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  );
}

function ActionsByStatus({ data }: { data: any[] }) {
  const statusCounts = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + item._count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        Actions by Status
      </h3>
      <div className="space-y-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{status}</span>
            <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionsByType({ data }: { data: any[] }) {
  const typeCounts = data.reduce((acc, item) => {
    acc[item.actionType] = (acc[item.actionType] || 0) + item._count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        Actions by Type
      </h3>
      <div className="space-y-3">
        {Object.entries(typeCounts).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{formatActionType(type)}</span>
            <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{count}</span>
          </div>
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

function MetricsPanelSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}
```

**Time Period Selector**: Allows switching between 7, 30, 90 days.

**Metric Cards**: Reusable component matching analytics page style.

### 6. FilterControls Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/FilterControls.tsx`

```typescript
'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { FilterState } from '@/types/agent-dashboard';
import { AgentType, ActionStatus } from '@prisma/client';

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export function FilterControls({ filters, onFilterChange }: FilterControlsProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilterCount = [
    filters.agentType !== 'all',
    filters.status !== 'all',
    filters.search,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchInput('');
    onFilterChange({
      agentType: 'all',
      status: 'all',
      search: '',
      startDate: null,
      endDate: null,
      page: 1,
    });
  };

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          Filters
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium flex items-center gap-1"
            style={{ color: 'var(--color-primary)' }}
          >
            <X className="h-4 w-4" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agent Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Agent Type
          </label>
          <select
            value={filters.agentType}
            onChange={(e) => onFilterChange({ agentType: e.target.value as any, page: 1 })}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-raised)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            <option value="all">All Types</option>
            {Object.values(AgentType).map(type => (
              <option key={type} value={type}>{formatAgentType(type)}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as any, page: 1 })}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-raised)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            <option value="all">All Statuses</option>
            {Object.values(ActionStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by lead name or company..."
              className="w-full pl-10 pr-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-raised)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatAgentType(type: string): string {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}
```

**Debounced Search**: 300ms delay to avoid excessive API calls.

**URL State**: Filters stored in URL query parameters for bookmarking.

**Active Filter Count**: Shows number of active filters with clear button.



### 7. ActionList Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/ActionList.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { AgentTypeBadge } from './AgentTypeBadge';
import type { AgentAction } from '@/types/agent-dashboard';

interface ActionListProps {
  actions: AgentAction[];
  loading: boolean;
  error: string | null;
  onActionClick: (action: AgentAction) => void;
  onRetry: () => void;
}

export function ActionList({ actions, loading, error, onActionClick, onRetry }: ActionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10; // This should come from API response

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
                  <AgentTypeBadge type={action.agentType} />
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
                  {truncateText(action.reasoning, 100)}
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
            className="p-4 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <AgentTypeBadge type={action.agentType} />
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
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
              {truncateText(action.reasoning, 80)}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
              {formatRelativeTime(action.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-raised)',
              color: 'var(--color-text)',
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50"
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
```

**Responsive Design**: Table view on desktop, card view on mobile.

**Clickable Rows**: Opens action detail modal.

**Lead Links**: Navigate to lead detail page (stops propagation to prevent modal).

**Relative Time**: Human-readable timestamps (e.g., "2h ago").

### 8. StatusBadge Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/StatusBadge.tsx`

```typescript
'use client';

import { CheckCircle, Clock, XCircle, AlertCircle, Zap } from 'lucide-react';
import type { ActionStatus } from '@prisma/client';

interface StatusBadgeProps {
  status: ActionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
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
  }[status];

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        color: config.color,
        backgroundColor: config.bg,
      }}
      aria-label={`Status: ${config.label}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
```

**Color Coding**: 
- Green: EXECUTED, APPROVED
- Yellow: PENDING
- Red: FAILED, REJECTED

**Icons**: Visual indicators for each status.

**Accessibility**: ARIA label for screen readers.

### 9. AgentTypeBadge Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/AgentTypeBadge.tsx`

```typescript
'use client';

import { TrendingUp, CheckSquare, AlertTriangle, Mail, Lightbulb } from 'lucide-react';
import type { AgentType } from '@prisma/client';

interface AgentTypeBadgeProps {
  type: AgentType;
}

export function AgentTypeBadge({ type }: AgentTypeBadgeProps) {
  const config = {
    LEAD_SCORING: {
      icon: TrendingUp,
      color: '#6366f1',
      label: 'Lead Scoring',
    },
    TASK_AUTOMATION: {
      icon: CheckSquare,
      color: '#8b5cf6',
      label: 'Task Automation',
    },
    STAGNATION_DETECTION: {
      icon: AlertTriangle,
      color: '#f59e0b',
      label: 'Stagnation Detection',
    },
    EMAIL_GENERATION: {
      icon: Mail,
      color: '#10b981',
      label: 'Email Generation',
    },
    NEXT_BEST_ACTION: {
      icon: Lightbulb,
      color: '#06b6d4',
      label: 'Next Best Action',
    },
  }[type] || {
    icon: Lightbulb,
    color: '#6b7280',
    label: type,
  };

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        color: config.color,
        backgroundColor: `${config.color}15`,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
```

**Distinct Colors**: Each agent type has unique color for quick identification.

**Icons**: Visual representation of agent purpose.

### 10. ActionDetailModal Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/ActionDetailModal.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { AgentTypeBadge } from './AgentTypeBadge';
import type { AgentAction } from '@/types/agent-dashboard';

interface ActionDetailModalProps {
  action: AgentAction;
  onClose: () => void;
  onApprove: (actionId: string) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
}

export function ActionDetailModal({ action, onClose, onApprove, onReject }: ActionDetailModalProps) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Trap focus within modal
  useEffect(() => {
    const modal = document.getElementById('action-detail-modal');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab as any);
    firstElement?.focus();

    return () => modal.removeEventListener('keydown', handleTab as any);
  }, []);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(action.id);
      onClose();
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onReject(action.id);
      onClose();
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        id="action-detail-modal"
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Action Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-10"
            style={{ backgroundColor: 'var(--color-raised)' }}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" style={{ color: 'var(--color-text)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Agent and Status */}
          <div className="flex items-center gap-3">
            <AgentTypeBadge type={action.agentType} />
            <StatusBadge status={action.status} />
          </div>

          {/* Lead Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Lead
            </h3>
            <Link
              href={`/leads/${action.leadId}`}
              className="flex items-center gap-2 text-base font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              {action.lead.contactName}
              <ExternalLink className="h-4 w-4" />
            </Link>
            {action.lead.company && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {action.lead.company}
              </p>
            )}
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Stage: {action.lead.stage}
            </p>
          </div>

          {/* Reasoning */}
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Reasoning
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
              {action.reasoning}
            </p>
          </div>

          {/* Metadata */}
          {Object.keys(action.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Metadata
              </h3>
              <div className="p-4 rounded-lg font-mono text-xs overflow-x-auto" style={{ backgroundColor: 'var(--color-raised)' }}>
                <pre style={{ color: 'var(--color-text)' }}>
                  {JSON.stringify(action.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Created
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                {new Date(action.createdAt).toLocaleString()}
              </p>
            </div>
            {action.executedAt && (
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Executed
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {new Date(action.executedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Approver Info */}
          {action.approvedByUser && (
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Approved By
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                {action.approvedByUser.displayName} ({action.approvedByUser.email})
              </p>
              {action.approvedAt && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(action.approvedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Approval Interface */}
          {action.status === 'PENDING' && (
            <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={handleApprove}
                disabled={approving || rejecting}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                <CheckCircle className="h-4 w-4" />
                {approving ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={handleReject}
                disabled={approving || rejecting}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-danger)' }}
              >
                <XCircle className="h-4 w-4" />
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Modal Behavior**:
- Click outside to close
- Escape key to close
- Focus trap for accessibility
- Prevents body scroll

**Approval Interface**: Only shown for PENDING actions.

**Optimistic UI**: Disables buttons during API calls.



### 11. ManualTriggerModal Component

**File**: `apps/vyntrize-crm/app/(crm)/agents/components/ManualTriggerModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, Search, Zap } from 'lucide-react';
import { AgentType } from '@prisma/client';

interface ManualTriggerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Lead {
  id: string;
  contactName: string;
  company: string | null;
  stage: string;
}

export function ManualTriggerModal({ onClose, onSuccess }: ManualTriggerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Set<AgentType>>(new Set());
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // Search leads
  useEffect(() => {
    if (searchQuery.length < 2) {
      setLeads([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/crm/leads?search=${encodeURIComponent(searchQuery)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
        }
      } catch (error) {
        console.error('Failed to search leads:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleAgent = (agentType: AgentType) => {
    const newSet = new Set(selectedAgents);
    if (newSet.has(agentType)) {
      newSet.delete(agentType);
    } else {
      newSet.add(agentType);
    }
    setSelectedAgents(newSet);
  };

  const handleTrigger = async () => {
    if (!selectedLead || selectedAgents.size === 0) return;

    setTriggering(true);
    try {
      const promises = Array.from(selectedAgents).map(agentType =>
        fetch('/api/agents/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType,
            leadId: selectedLead.id,
          }),
        })
      );

      await Promise.all(promises);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to trigger agents:', error);
    } finally {
      setTriggering(false);
    }
  };

  const availableAgents: AgentType[] = [
    AgentType.LEAD_SCORING,
    AgentType.STAGNATION_DETECTION,
    AgentType.EMAIL_GENERATION,
    AgentType.NEXT_BEST_ACTION,
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Trigger Agent Manually
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-raised)' }}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" style={{ color: 'var(--color-text)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Search Lead */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              1. Select Lead
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or company..."
                className="w-full pl-10 pr-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-raised)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>

            {/* Lead Results */}
            {leads.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
                {leads.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setLeads([]);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors"
                    style={{
                      backgroundColor: selectedLead?.id === lead.id ? 'var(--color-primary-soft)' : 'transparent',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {lead.contactName}
                    </p>
                    {lead.company && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {lead.company}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                      Stage: {lead.stage}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Lead */}
            {selectedLead && (
              <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Selected: {selectedLead.contactName}
                </p>
                {selectedLead.company && (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {selectedLead.company}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Select Agents */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              2. Select Agents to Trigger
            </label>
            <div className="space-y-2">
              {availableAgents.map(agentType => (
                <label
                  key={agentType}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selectedAgents.has(agentType) ? 'var(--color-primary-soft)' : 'var(--color-raised)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAgents.has(agentType)}
                    onChange={() => toggleAgent(agentType)}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {formatAgentType(agentType)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Trigger Button */}
          <button
            onClick={handleTrigger}
            disabled={!selectedLead || selectedAgents.size === 0 || triggering}
            className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Zap className="h-4 w-4" />
            {triggering ? 'Triggering...' : `Trigger ${selectedAgents.size} Agent${selectedAgents.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAgentType(type: string): string {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}
```

**Two-Step Process**:
1. Search and select lead
2. Select agent types to trigger

**Debounced Search**: 300ms delay for lead search.

**Multi-Agent Trigger**: Can trigger multiple agents at once.

## API Integration

### API Endpoints

All endpoints use iron-session authentication via `getSession()`.

#### 1. GET /api/agents/health

**Response**:
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,
  components: {
    agentRegistry: { status: string, initialized: boolean },
    jobQueue: { status: string, metrics: { waiting, active, completed, failed } },
    aiProviders: { status: string, defaultProvider: string, availableProviders: string[], providers: {...} }
  }
}
```

#### 2. GET /api/agents/actions

**Query Parameters**:
- `agentType`: Filter by agent type
- `status`: Filter by action status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by lead name/company

**Response**:
```typescript
{
  actions: AgentAction[],
  pagination: { page, limit, total, totalPages }
}
```

#### 3. GET /api/agents/metrics

**Query Parameters**:
- `days`: Time period (default: 30)
- `agentType`: Filter by agent type (optional)

**Response**:
```typescript
{
  summary: { totalActions, approvedActions, approvalRate, avgExecutionTimeMs, dateRange },
  actionsByStatus: [...],
  actionsByType: [...],
  metricsByAgent: {...}
}
```

#### 4. POST /api/agents/trigger

**Request Body**:
```typescript
{
  agentType: AgentType,
  leadId: string
}
```

**Response**:
```typescript
{
  success: boolean,
  agentType: AgentType,
  leadId: string,
  result: { actionId, reasoning, metadata }
}
```

#### 5. POST /api/agents/actions/:id/approve

**Implementation Required**: Create new endpoint.

**File**: `apps/vyntrize-crm/app/api/agents/actions/[actionId]/approve/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { actionId: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const action = await prisma.agentAction.update({
      where: { id: params.actionId },
      data: {
        status: 'APPROVED',
        approvedByUserId: session.userId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('[API] Failed to approve action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 6. POST /api/agents/actions/:id/reject

**Implementation Required**: Create new endpoint.

**File**: `apps/vyntrize-crm/app/api/agents/actions/[actionId]/reject/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { actionId: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const action = await prisma.agentAction.update({
      where: { id: params.actionId },
      data: {
        status: 'REJECTED',
        approvedByUserId: session.userId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('[API] Failed to reject action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Styling and Theming

### CSS Variables

Use existing CRM design system variables:

```css
--color-bg: Background color
--color-surface: Card/panel background
--color-raised: Elevated surface (hover states)
--color-border: Border color
--color-text: Primary text
--color-text-muted: Secondary text
--color-text-subtle: Tertiary text
--color-primary: Primary brand color
--color-primary-soft: Primary with low opacity
--color-success: Success/positive color
--color-warning: Warning/caution color
--color-danger: Error/negative color
--shadow-md: Medium shadow
```

### Tailwind Classes

Consistent with existing CRM pages:
- `rounded-2xl`: Cards and panels
- `gap-6`: Spacing between sections
- `p-6`: Padding for cards
- `text-3xl font-bold`: Page titles
- `text-sm`: Body text
- `text-xs`: Small text

### Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Accessibility

### WCAG 2.1 AA Compliance

1. **Semantic HTML**: Use proper elements (header, main, nav, table, button)
2. **ARIA Labels**: All interactive elements have descriptive labels
3. **Keyboard Navigation**: Full keyboard support with visible focus indicators
4. **Focus Management**: Modal focus trap, logical tab order
5. **Color Contrast**: Minimum 4.5:1 ratio for text
6. **Screen Reader Support**: ARIA live regions for dynamic updates
7. **Alternative Text**: Icons paired with text labels

### Keyboard Shortcuts

- `Tab`: Navigate between elements
- `Enter`: Activate buttons/links
- `Escape`: Close modals
- `Arrow Keys`: Navigate table rows (future enhancement)

## Performance Optimization

### Initial Load

1. **Server Components**: Use RSC for initial page render
2. **Code Splitting**: Lazy load modal components
3. **Image Optimization**: Use Next.js Image component (if needed)
4. **Font Optimization**: Use Next.js font optimization

### Runtime Performance

1. **React.memo**: Memoize expensive components (MetricCard, ActionCard)
2. **useMemo**: Cache computed values (filtered actions, formatted data)
3. **useCallback**: Stable function references for callbacks
4. **Debouncing**: Search input (300ms), filter changes
5. **Pagination**: Limit data fetched per request (20 items)
6. **Optimistic UI**: Update UI before API response for approve/reject

### Data Fetching

1. **Parallel Requests**: Fetch health, actions, metrics simultaneously
2. **Request Deduplication**: Use SWR or React Query (optional)
3. **Caching**: Cache API responses for 60 seconds
4. **Auto-Refresh**: Staggered intervals (health: 30s, actions: 60s)

## Error Handling

### Error States

1. **Network Errors**: Display retry button with error message
2. **Authentication Errors**: Redirect to login page
3. **Validation Errors**: Show inline error messages
4. **API Errors**: User-friendly error messages (not technical codes)
5. **Offline State**: Specific offline error message

### Error Boundaries

Wrap main dashboard in React Error Boundary:

```typescript
// apps/vyntrize-crm/app/(crm)/agents/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-4">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded">
        Try again
      </button>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests

- Component rendering
- Filter logic
- Data formatting functions
- Badge color mapping

### Integration Tests

- API endpoint responses
- Authentication flow
- Filter state management
- Modal interactions

### E2E Tests

- Complete user flows (view actions, approve, trigger)
- Responsive design on different screen sizes
- Keyboard navigation
- Screen reader compatibility

## Deployment Considerations

### Environment Variables

No new environment variables required. Uses existing:
- Database connection (Prisma)
- Session secret (iron-session)
- Agent system configuration

### Build Process

Standard Next.js build:
```bash
pnpm build
```

### Performance Monitoring

- Track page load times
- Monitor API response times
- Log client-side errors
- Track user interactions (analytics)

## Future Enhancements

### Phase 2 Features

1. **Bulk Operations**: Select multiple actions for batch approve/reject
2. **Export Functionality**: Export actions to CSV/JSON
3. **Advanced Filtering**: Date range picker, custom filters
4. **Real-time Updates**: WebSocket for live action updates
5. **Agent Configuration**: UI for adjusting agent settings (admin only)
6. **Detailed Analytics**: Charts and graphs for agent performance
7. **Action History**: Timeline view of all actions for a lead
8. **Notifications**: Toast notifications for new pending actions

### Phase 3 Features

1. **Agent Logs**: Detailed execution logs and debugging
2. **A/B Testing**: Compare agent configurations
3. **Custom Agents**: UI for creating custom agent rules
4. **Workflow Builder**: Visual workflow editor for agent chains
5. **Predictive Insights**: ML-powered recommendations

## Implementation Checklist

### Core Components
- [ ] Dashboard page (Server Component)
- [ ] AgentsDashboardClient (Client Component)
- [ ] DashboardHeader
- [ ] HealthStatusWidget
- [ ] MetricsPanel
- [ ] FilterControls
- [ ] ActionList
- [ ] StatusBadge
- [ ] AgentTypeBadge
- [ ] ActionDetailModal
- [ ] ManualTriggerModal

### API Endpoints
- [ ] POST /api/agents/actions/:id/approve
- [ ] POST /api/agents/actions/:id/reject
- [ ] Update GET /api/agents/actions (add search support)

### Navigation
- [ ] Update Sidebar component with AI Agents section
- [ ] Add Sparkles icon import

### Types
- [ ] Create types/agent-dashboard.ts with all interfaces

### Styling
- [ ] Verify CSS variables are defined
- [ ] Test responsive layouts
- [ ] Test dark/light theme support

### Accessibility
- [ ] Add ARIA labels
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify color contrast ratios

### Testing
- [ ] Unit tests for components
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user flows
- [ ] Accessibility audit

### Documentation
- [ ] Update README with dashboard usage
- [ ] Add inline code comments
- [ ] Document component props
- [ ] Create user guide

## Conclusion

This design document provides a comprehensive blueprint for implementing the Agent Dashboard UI. The design follows existing CRM patterns, ensures accessibility and performance, and provides a solid foundation for future enhancements. All components are designed to be maintainable, testable, and extensible.
