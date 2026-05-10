'use client';

import { CheckCircle, XCircle, AlertCircle, Activity, Zap, Clock, Database, Cpu } from 'lucide-react';
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
      {/* Header */}
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

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Agent Registry */}
        <ComponentCard
          icon={<Cpu className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />}
          title="Agent Registry"
          status={health.components.agentRegistry.initialized ? 'Running' : 'Not Initialized'}
          statusColor={health.components.agentRegistry.initialized ? 'var(--color-success)' : 'var(--color-danger)'}
          details={[
            { label: 'Status', value: health.components.agentRegistry.status },
            { label: 'Initialized', value: health.components.agentRegistry.initialized ? 'Yes' : 'No' },
          ]}
        />

        {/* Job Queue */}
        <ComponentCard
          icon={<Database className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />}
          title="Job Queue"
          status={health.components.jobQueue.status}
          statusColor={health.components.jobQueue.status === 'healthy' ? 'var(--color-success)' : 'var(--color-warning)'}
          details={[
            { label: 'Waiting', value: health.components.jobQueue.metrics.waiting.toString() },
            { label: 'Active', value: health.components.jobQueue.metrics.active.toString() },
            { label: 'Completed', value: health.components.jobQueue.metrics.completed.toString() },
            { label: 'Failed', value: health.components.jobQueue.metrics.failed.toString() },
          ]}
        />

        {/* AI Providers */}
        <ComponentCard
          icon={<Zap className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />}
          title="AI Providers"
          status={health.components.aiProviders.status}
          statusColor={health.components.aiProviders.status === 'healthy' ? 'var(--color-success)' : 'var(--color-warning)'}
          details={[
            { label: 'Default', value: health.components.aiProviders.defaultProvider },
            { label: 'Available', value: health.components.aiProviders.availableProviders.join(', ') || 'None' },
          ]}
        />
      </div>

      {/* AI Provider Details */}
      {Object.keys(health.components.aiProviders.providers).length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
            Provider Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(health.components.aiProviders.providers).map(([name, provider]) => (
              <div
                key={name}
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize" style={{ color: 'var(--color-text)' }}>
                    {name}
                  </span>
                  <div className="flex items-center gap-1">
                    {provider.available ? (
                      <CheckCircle className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <XCircle className="h-4 w-4" style={{ color: 'var(--color-danger)' }} />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
                    <span style={{ color: provider.available ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {provider.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  {provider.unavailableReason && (
                    <div className="text-xs mt-1 p-1.5 rounded" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                      {provider.unavailableReason}
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-text-muted)' }}>Circuit:</span>
                    <span style={{ color: provider.circuitOpen ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {provider.circuitOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-text-muted)' }}>Failures:</span>
                    <span style={{ color: 'var(--color-text)' }}>
                      {provider.failureCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <Clock className="h-4 w-4" style={{ color: 'var(--color-text-subtle)' }} />
        <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          Last updated: {new Date(health.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

interface ComponentCardProps {
  icon: React.ReactNode;
  title: string;
  status: string;
  statusColor: string;
  details: Array<{ label: string; value: string }>;
}

function ComponentCard({ icon, title, status, statusColor, details }: ComponentCardProps) {
  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </p>
      </div>
      <div className="mb-3">
        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
          {status}
        </span>
      </div>
      <div className="space-y-1.5">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between text-xs">
            <span style={{ color: 'var(--color-text-muted)' }}>{detail.label}:</span>
            <span style={{ color: 'var(--color-text)' }} className="font-medium">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthStatusSkeleton() {
  return (
    <div className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

function HealthStatusError() {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2">
        <XCircle className="h-5 w-5" style={{ color: 'var(--color-danger)' }} />
        <p style={{ color: 'var(--color-danger)' }}>Failed to load health status</p>
      </div>
    </div>
  );
}
