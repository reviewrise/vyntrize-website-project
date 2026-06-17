import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notificationService, PreferenceInput } from '@/lib/notifications/notification-service';
import { NotificationEventType, NotificationChannel } from '@platform/vyntrize-db';

const VALID_EVENT_TYPES = new Set<string>(Object.values(NotificationEventType));
const VALID_CHANNELS    = new Set<string>(Object.values(NotificationChannel));

// GET /api/notifications/preferences
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await notificationService.getPreferences(session.userId as string);
    return NextResponse.json(prefs);
  } catch (error) {
    console.error('[GET /api/notifications/preferences] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const preferences: PreferenceInput[] = body?.preferences;

    if (!Array.isArray(preferences) || preferences.length > 100) {
      return NextResponse.json(
        { error: 'preferences must be an array of at most 100 items' },
        { status: 400 },
      );
    }

    for (const p of preferences) {
      if (!VALID_EVENT_TYPES.has(p.eventType)) {
        return NextResponse.json(
          { error: `Unrecognized eventType: ${p.eventType}` },
          { status: 400 },
        );
      }
      if (!VALID_CHANNELS.has(p.channel)) {
        return NextResponse.json(
          { error: `Unrecognized channel: ${p.channel}` },
          { status: 400 },
        );
      }
    }

    await notificationService.upsertPreferences(session.userId as string, preferences);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[PUT /api/notifications/preferences] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
