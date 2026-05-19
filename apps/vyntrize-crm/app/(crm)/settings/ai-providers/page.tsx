'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Sparkles, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Zap, Brain, Bot, ChevronRight, Shield, Activity,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────────── */

interface ProviderStatus {
  provider: string;
  model: string;
  circuitOpen: boolean;
  failureCount: number;
  currentConcurrent: number;
  tokenUsageThisMinute: number;
  cacheSize: number;
  available: boolean;
  unavailableReason: string | null;
}

interface ProviderData {
  defaultProvider: string;
  availableProviders: string[];
  providers: Record<string, ProviderStatus>;
}

/* ─── Provider metadata ───────────────────────────────────────────────── */

const PROVIDER_META: Record<string, {
  displayName: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  models: string[];
}> = {
  gemini: {
    displayName: 'Google Gemini',
    icon: Sparkles,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Google\'s multimodal AI. Great for structured reasoning, lead scoring, and content generation.',
    models: ['gemini-pro', 'gemini-3-flash-preview'],
  },
  openai: {
    displayName: 'OpenAI',
    icon: Brain,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Industry-leading language models. Excellent for email generation, complex reasoning, and conversational tasks.',
    models: ['gpt-4', 'gpt-4o', 'gpt-3.5-turbo'],
  },
  claude: {
    displayName: 'Anthropic Claude',
    icon: Bot,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Anthropic\'s constitutional AI. Known for safety, helpfulness, and nuanced responses.',
    models: ['claude-3-opus', 'claude-3-sonnet'],
  },
};

/* ─── Component ───────────────────────────────────────────────────────── */

export default function AIProvidersPage() {
  const [data, setData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agents/provider');
      if (!res.ok) throw new Error('Failed to fetch provider status');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const switchProvider = async (provider: string) => {
    setSwitching(provider);
    setError(null);
    try {
      const res = await fetch('/api/agents/provider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to switch');
      setData(json);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSwitching(null);
    }
  };

  const providerKeys = data ? Object.keys(data.providers) : [];
  const availableCount = data?.availableProviders?.length ?? 0;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
            AI Providers
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Configure which AI model powers your CRM agents. Switch providers on-the-fly without restarting.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Status Overview Card */}
      {data && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                {availableCount} provider{availableCount !== 1 ? 's' : ''} online
              </span>
            </div>
            <div className="h-4 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Active: <strong style={{ color: 'var(--color-text)' }}>
                  {data.defaultProvider === 'auto'
                    ? `Auto (${data.availableProviders[0] ? PROVIDER_META[data.availableProviders[0]]?.displayName || data.availableProviders[0] : 'none'})`
                    : PROVIDER_META[data.defaultProvider]?.displayName || data.defaultProvider
                  }
                </strong>
              </span>
            </div>
            {lastRefresh && (
              <>
                <div className="h-4 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
                <span className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                  Last checked: {lastRefresh.toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Auto-Select Card */}
      {data && (
        <button
          onClick={() => switchProvider('auto')}
          disabled={switching !== null}
          className="w-full text-left rounded-2xl p-5 transition-all group"
          style={{
            backgroundColor: data.defaultProvider === 'auto' ? 'var(--color-primary-soft)' : 'var(--color-surface)',
            border: data.defaultProvider === 'auto'
              ? '2px solid var(--color-primary)'
              : '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{
                  background: data.defaultProvider === 'auto'
                    ? 'linear-gradient(135deg, var(--color-primary), #8b5cf6)'
                    : 'var(--color-raised)',
                }}
              >
                <Zap className={`h-5 w-5 ${data.defaultProvider === 'auto' ? 'text-white' : ''}`}
                  style={{ color: data.defaultProvider === 'auto' ? undefined : 'var(--color-text-muted)' }}
                />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  Auto-Select
                  {data.defaultProvider === 'auto' && (
                    <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                      ACTIVE
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Automatically uses the first available provider. Best for reliability — if one goes down, it falls back to another.
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity"
              style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </button>
      )}

      {/* Provider Cards */}
      <div className="grid gap-4">
        {providerKeys.map((key) => {
          const status = data!.providers[key];
          const meta = PROVIDER_META[key] || {
            displayName: key,
            icon: Bot,
            color: 'text-slate-400',
            bgColor: 'bg-slate-500/10',
            borderColor: 'border-slate-500/30',
            description: 'AI provider',
            models: [status.model],
          };
          const Icon = meta.icon;
          const isActive = data!.defaultProvider === key;
          const isAvailable = status.available && !status.unavailableReason;

          return (
            <div
              key={key}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl ${meta.bgColor} border ${meta.borderColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${meta.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                          {meta.displayName}
                        </p>
                        {isActive && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1 max-w-md" style={{ color: 'var(--color-text-muted)' }}>
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isAvailable ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                        <XCircle className="h-3 w-3" /> Unavailable
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      Model: <strong style={{ color: 'var(--color-text)' }}>{status.model}</strong>
                    </span>
                  </div>
                  {isAvailable && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          Failures: <strong style={{ color: status.failureCount > 0 ? '#f87171' : 'var(--color-text)' }}>{status.failureCount}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          Active requests: <strong style={{ color: 'var(--color-text)' }}>{status.currentConcurrent}</strong>
                        </span>
                      </div>
                      {status.cacheSize > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                            Cached: <strong style={{ color: 'var(--color-text)' }}>{status.cacheSize}</strong>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {status.unavailableReason && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] text-amber-400">
                        {status.unavailableReason}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action footer */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-raised)' }}
              >
                <span className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                  Available models: {meta.models.join(', ')}
                </span>
                {isAvailable && !isActive ? (
                  <button
                    onClick={() => switchProvider(key)}
                    disabled={switching !== null}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {switching === key ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    {switching === key ? 'Switching...' : 'Use this provider'}
                  </button>
                ) : isActive ? (
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                    Currently active
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: 'var(--color-raised)' }} />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-raised)' }} />
                  <div className="h-3 w-64 rounded" style={{ backgroundColor: 'var(--color-raised)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
