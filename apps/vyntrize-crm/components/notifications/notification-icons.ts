/**
 * notification-icons.ts — CLIENT-SAFE
 *
 * This file must NOT import from @platform/vyntrize-db because that package
 * pulls in pg/prisma which cannot be bundled for the browser.
 *
 * We replicate the NotificationEventType enum values as a plain const object
 * so client components can use them without touching the server-only package.
 */

import {
  Bell,
  UserPlus,
  GitBranch,
  CheckSquare,
  Calendar,
  Bot,
  Users,
  AlertTriangle,
} from 'lucide-react';
import type { ElementType } from 'react';

// ─── Client-safe enum mirror ──────────────────────────────────────────────────
// Keep in sync with the NotificationEventType Prisma enum in schema.prisma.
export const NotificationEventTypeValues = {
  LEAD_CREATED:           'LEAD_CREATED',
  STAGE_CHANGED:          'STAGE_CHANGED',
  TASK_CREATED:           'TASK_CREATED',
  TASK_COMPLETED:         'TASK_COMPLETED',
  CALENDAR_EVENT_CREATED: 'CALENDAR_EVENT_CREATED',
  CALENDAR_EVENT_UPDATED: 'CALENDAR_EVENT_UPDATED',
  AGENT_ACTION_PENDING:   'AGENT_ACTION_PENDING',
  MEETING_ATTENDED:       'MEETING_ATTENDED',
  MEETING_MISSED:         'MEETING_MISSED',
} as const;

export type NotificationEventTypeKey = keyof typeof NotificationEventTypeValues;
export type NotificationEventTypeValue = (typeof NotificationEventTypeValues)[NotificationEventTypeKey];

// ─── Icons ────────────────────────────────────────────────────────────────────

export const NOTIFICATION_ICONS: Record<NotificationEventTypeValue, ElementType> = {
  LEAD_CREATED:           UserPlus,
  STAGE_CHANGED:          GitBranch,
  TASK_CREATED:           CheckSquare,
  TASK_COMPLETED:         CheckSquare,
  CALENDAR_EVENT_CREATED: Calendar,
  CALENDAR_EVENT_UPDATED: Calendar,
  AGENT_ACTION_PENDING:   Bot,
  MEETING_ATTENDED:       Users,
  MEETING_MISSED:         AlertTriangle,
};

// ─── Colours ──────────────────────────────────────────────────────────────────

export const NOTIFICATION_COLORS: Record<NotificationEventTypeValue, string> = {
  LEAD_CREATED:           '#6366f1',
  STAGE_CHANGED:          '#0ea5e9',
  TASK_CREATED:           '#8b5cf6',
  TASK_COMPLETED:         '#10b981',
  CALENDAR_EVENT_CREATED: '#f59e0b',
  CALENDAR_EVENT_UPDATED: '#f59e0b',
  AGENT_ACTION_PENDING:   '#ef4444',
  MEETING_ATTENDED:       '#10b981',
  MEETING_MISSED:         '#ef4444',
};

// ─── Entity routes ────────────────────────────────────────────────────────────

export const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  lead:           (id) => `/leads/${id}`,
  task:           (id) => `/leads?taskId=${id}`,
  calendar_event: (id) => `/calendar?eventId=${id}`,
  agent_action:   (id) => `/agents?actionId=${id}`,
};

// ─── timeAgo helper ───────────────────────────────────────────────────────────

export function timeAgo(date: string | Date): string {
  const now  = Date.now();
  const then = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Re-export Bell so callers can import it from one place
export { Bell };
