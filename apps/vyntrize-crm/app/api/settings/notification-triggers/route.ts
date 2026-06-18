import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { invalidateTriggerCache } from '@/lib/notifications/trigger-config';

const SETTING_KEY = 'NOTIFICATION_TRIGGER_CONFIG';

export interface TriggerConfig {
  eventType:   string;
  isEnabled:   boolean;
  /** Who receives it: 'assignee' | 'admins' | 'both' */
  recipients:  'assignee' | 'admins' | 'both';
}

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

// GET /api/settings/notification-triggers
export async function GET() {
  const session = await getSession();
  if (!session?.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEY } });
    const configs: TriggerConfig[] = setting?.value
      ? (setting.value as unknown as TriggerConfig[])
      : DEFAULT_CONFIGS;
    return NextResponse.json({ configs });
  } catch {
    return NextResponse.json({ configs: DEFAULT_CONFIGS });
  }
}

// PUT /api/settings/notification-triggers
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const configs: TriggerConfig[] = body?.configs;

  if (!Array.isArray(configs) || configs.length === 0) {
    return NextResponse.json({ error: 'configs array is required' }, { status: 400 });
  }

  await prisma.systemSetting.upsert({
    where:  { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: configs as unknown as object },
    update: { value: configs as unknown as object },
  });

  // Bust the in-process cache so the listener picks up changes immediately
  invalidateTriggerCache();

  return new NextResponse(null, { status: 204 });
}
