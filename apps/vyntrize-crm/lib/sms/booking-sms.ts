/**
 * buildBookingConfirmationSms — pure helper, no side effects.
 *
 * Produces a plain-text SMS confirmation message for a meeting booking.
 * No Prisma, no smsService — just string construction.
 */

export interface BookingConfirmationSmsOptions {
  hostName: string;
  startTime: Date;
  meetLink?: string;
  optOutUrl: string;
}

/**
 * Format a Date into a compact, human-readable string.
 * e.g. "Tue Jun 20 at 2:00 PM UTC"
 */
function formatBookingTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    hour:    'numeric',
    minute:  '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

/**
 * Build a plain-text SMS booking confirmation.
 *
 * Output format:
 *   "Your meeting with <host> is confirmed for <time>. Join: <meetLink> Stop SMS: <optOutUrl>"
 *
 * Meet link is omitted when not provided.
 * All content is plain text — no HTML.
 */
export function buildBookingConfirmationSms(
  options: BookingConfirmationSmsOptions
): string {
  const { hostName, startTime, meetLink, optOutUrl } = options;

  const timeStr = formatBookingTime(startTime);

  let message = `Your meeting with ${hostName} is confirmed for ${timeStr}.`;

  if (meetLink) {
    message += ` Join: ${meetLink}`;
  }

  message += ` Stop SMS: ${optOutUrl}`;

  return message;
}
