'use client';

import { TrendingUp, CheckSquare, AlertTriangle, Mail, Lightbulb, Workflow } from 'lucide-react';
import type { AgentType } from '@platform/vyntrize-db';

interface AgentTypeBadgeProps {
  type: AgentType;
}

export function AgentTypeBadge({ type }: AgentTypeBadgeProps) {
  const config: Record<AgentType, { icon: any; color: string; label: string }> = {
    CONVERSATIONAL: {
      icon: Mail,
      color: '#3b82f6',
      label: 'Conversational',
    },
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
    PREDICTIVE_ANALYTICS: {
      icon: TrendingUp,
      color: '#ec4899',
      label: 'Predictive Analytics',
    },
    STAGE_PROGRESSION: {
      icon: TrendingUp,
      color: '#f97316',
      label: 'Stage Progression',
    },
    DRIP_CAMPAIGN: {
      icon: Mail,
      color: '#8b5cf6',
      label: 'Drip Campaign',
    },
    REVENUE_FORECASTING: {
      icon: TrendingUp,
      color: '#10b981',
      label: 'Revenue Forecasting',
    },
    OPENAI_PROVIDER: {
      icon: Lightbulb,
      color: '#6366f1',
      label: 'OpenAI Provider',
    },
    WORKFLOW_RULE: {
      icon: Workflow,
      color: '#0ea5e9',
      label: 'Workflow Rule',
    },
  };

  const agentConfig = config[type] || {
    icon: Lightbulb,
    color: '#6b7280',
    label: type,
  };

  const Icon = agentConfig.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        color: agentConfig.color,
        backgroundColor: `${agentConfig.color}15`,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {agentConfig.label}
    </span>
  );
}
