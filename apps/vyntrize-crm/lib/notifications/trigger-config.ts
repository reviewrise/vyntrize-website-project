/**
 * Notification trigger config loader
 *
 * Reads the system-level NOTIFICATION_TRIGGER_CONFIG setting to determine
 * whether a given event type is enabled and who should receive it.
 *
 * Results are cached in-process for 60 seconds to avoid a DB hit on every
 * single CRM event. The cache is invalidated automatically on the next read
 * after the TTL expires, so admin changes take effect within 1 minute.
 */

import { prisma } from '@/lib/prisma';

export interface TriggerConfig {
  eventType:  string;
  isEnabled:  boolean;
  recipients: 'assignee' | 'admins' | 'both';
}

const SETTING_KEY = 'NOTIFICATION_TRIGGER_CONFIG';
const CACHE_TTL_MS = 60_000; // 60 seconds

const DEFAULT_CONFIGS: TriggerConfig[] = [
  { eventType: 'LEAD_CREATED',           isEnabled: true, recipients: 'both' },
  { eventType: 'STAGE_CHANGED',          isEnabled: true, recipients: 'assignee' },
  { eventType: 'TASK_CREATED',           isEnabled: true, recipients: 'assignee' },
  { eventType: 'TASK_COMPLETED',         isEnabled: true, recipients: 'assignee' },
  { eventType: 'CALENDAR_EVENT_CREATED', isEnabled: true, recipients: 'assignee' },
  { eventType: 'CALENDAR_EVENT_UPDATED', isEnabled: true, recipients: 'assignee' },
  { eventType: 'AGENT_ACTION_PENDING',   isEnabled: true, recipients: 'admins' },
  { eventType: 'MEETING_ATTENDED',       isEnabled: true, recipients: 'assignee' },
  { eventType: 'MEETING_MISSED',         isEnabled: true, recipients: 'assignee' },
];

let _cache: TriggerConfig[] | null = null;
let _cacheAt = 0;

async function loadConfigs(): Promise<TriggerConfig[]> {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL_MS) return _cache;

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });
    _cache  = setting?.value ? (setting.value as unknown as TriggerConfig[]) : DEFAULT_CONFIGS;
    _cacheAt = now;
    return _cache;
  } catch {
    // DB unavailable — return defaults, don't cache so we retry next call
    return DEFAULT_CONFIGS;
  }
}

/**
 * Check if a trigger is enabled and return its config.
 * Returns null if the event is globally disabled.
 */
export async function getTriggerConfig(eventType: string): Promise<TriggerConfig | null> {
  const configs = await loadConfigs();
  const config  = configs.find((c) => c.eventType === eventType);
  if (!config || !config.isEnabled) return null;
  return config;
}

/** Invalidate the in-process cache (call after admin saves). */
export function invalidateTriggerCache(): void {
  _cache  = null;
  _cacheAt = 0;
}
