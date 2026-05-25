'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import type { AgentAction } from '@/types/agent-dashboard';

interface LiveFeedProps {
  actions: AgentAction[];
}

const AGENT_COLORS: Record<string, string> = {
  LEAD_SCORING:       '#6366f1',
  TASK_AUTOMATION:    '#8b5cf6',
  STAGNATION_DETECTION: '#f59e0b',
  EMAIL_GENERATION:   '#10b981',
  NEXT_BEST_ACTION:   '#06b6d4',
  DRIP_CAMPAIGN:      '#8b5cf6',
  STAGE_PROGRESSION:  '#f97316',
  WORKFLOW_RULE:      '#0ea5e9',
};

const AGENT_ICONS: Record<string, string> = {
  LEAD_SCORING:         '📈',
  TASK_AUTOMATION:      '✅',
  STAGNATION_DETECTION: '⚠️',
  EMAIL_GENERATION:     '✉️',
  NEXT_BEST_ACTION:     '💡',
  DRIP_CAMPAIGN:        '📧',
  STAGE_PROGRESSION:    '🚀',
  WORKFLOW_RULE:        '⚙️',
};

function formatActionType(type: string) {
  return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function LiveFeed({ actions }: LiveFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  // Autonomous (executed) actions only — these don't need approval
  const autonomousActions = actions
    .filter(a => a.status === 'EXECUTED' || a.autonomyLevel === 'FULLY_AUTONOMOUS')
    .slice(0, 30);

  // Animate new entries in
  useEffect(() => {
    const ids = autonomousActions.map(a => a.id);
    const timer = setTimeout(() => {
      setVisibleIds(new Set(ids));
    }, 50);
    return () => clearTimeout(timer);
  }, [autonomousActions.length]);

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-raised)' }}
      >
        <div className="relative flex h-2.5 w-2.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: '#6366f1' }}
          />
          <span
            className="relative inline-flex rounded-full h-2.5 w-2.5"
            style={{ backgroundColor: '#6366f1' }}
          />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-primary)' }}>
          Live Feed
        </span>
        <span
          className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
          style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
        >
          {autonomousActions.length}
        </span>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {autonomousActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <Zap className="h-8 w-8" style={{ color: 'var(--color-text-subtle)' }} />
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Agents are standing by.<br />Actions will appear here.
            </p>
          </div>
        ) : (
          autonomousActions.map((action) => {
            const color = AGENT_COLORS[action.agentType] || '#6b7280';
            const icon = AGENT_ICONS[action.agentType] || '🤖';
            const isVisible = visibleIds.has(action.id);

            return (
              <div
                key={action.id}
                className="rounded-xl p-3 transition-all duration-500"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: `1px solid ${color}40`,
                  borderLeft: `4px solid ${color}`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(16px)',
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color }}
                    >
                      {formatActionType(action.actionType)}
                    </span>
                  </div>
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                </div>

                {/* Lead name */}
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                  {action.lead?.contactName || 'Unknown Lead'}
                </p>

                {/* Reasoning snippet */}
                <p
                  className="text-xs leading-relaxed line-clamp-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {action.reasoning}
                </p>

                {/* Timestamp */}
                <p className="text-xs mt-2 font-mono" style={{ color: `${color}80` }}>
                  {timeAgo(action.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer glow */}
      <div
        className="h-8 shrink-0"
        style={{
          background: 'linear-gradient(to top, var(--color-surface), transparent)',
          marginTop: '-32px',
          pointerEvents: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  );
}
