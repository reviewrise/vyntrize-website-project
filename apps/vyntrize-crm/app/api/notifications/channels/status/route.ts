import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { emailService } from '@/lib/email/email-service';
import { smsService } from '@/lib/sms/sms-service';

/**
 * GET /api/notifications/channels/status
 *
 * Returns the configured state of each notification delivery channel.
 * Used by the Notification Preferences UI to show/hide channel columns
 * and by the admin settings page.
 *
 * Requires: authenticated session (any role)
 */
export async function GET() {
  const session = await getSession();
  if (!session?.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [emailStatus, smsStatus] = await Promise.all([
    emailService.getStatus(),
    smsService.getStatus(),
  ]);

  return NextResponse.json({
    channels: {
      inApp: { enabled: true },        // always available
      email: { configured: emailStatus.configured },
      sms:   { configured: smsStatus.configured },
    },
  });
}
