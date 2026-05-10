// Type definitions for Agent Dashboard UI

import type { AgentType, ActionType, ActionStatus, AutonomyLevel } from '@platform/vyntrize-db';

// Re-export enum values for client-side use (to avoid importing Prisma client in browser)
export const AGENT_TYPES = [
  'LEAD_SCORING',
  'TASK_AUTOMATION',
  'STAGNATION_DETECTION',
  'EMAIL_GENERATION',
  'NEXT_BEST_ACTION',
] as const;

export const ACTION_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXECUTED',
  'FAILED',
] as const;

export { type AgentType, type ActionType, type ActionStatus, type AutonomyLevel };

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
        unavailableReason?: string | null;
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
