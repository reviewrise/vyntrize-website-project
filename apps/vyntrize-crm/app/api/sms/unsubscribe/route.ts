/**
 * GET /api/sms/unsubscribe?phone=<E164>
 *
 * Public endpoint — no auth required.
 * Sets Contact.smsOptOut = true for the matching phone number.
 * Always returns a neutral 200 plain-text response to avoid revealing
 * whether a phone number exists in the database.
 */

import { NextRequest } from 'next/server';
import { prisma }     from '@/lib/prisma';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const rawPhone = searchParams.get('phone');

  if (!rawPhone) {
    return new Response('Missing phone parameter.', {
      status:  400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const phone = decodeURIComponent(rawPhone).trim();

  if (!phone) {
    return new Response('Missing phone parameter.', {
      status:  400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    const contact = await prisma.contact.findFirst({
      where:  { phone },
      select: { id: true },
    });

    if (contact) {
      await prisma.contact.update({
        where: { id: contact.id },
        data:  { smsOptOut: true },
      });
      console.log('[sms/unsubscribe] Set smsOptOut=true for contact', contact.id, 'phone:', phone);
    } else {
      // Do not reveal that the number is unknown — return the same response
      console.info('[sms/unsubscribe] Phone not found — returning neutral response:', phone);
    }
  } catch (err) {
    console.error('[sms/unsubscribe] Error processing unsubscribe:', err);
    // Still return a success-looking response to avoid leaking internals
  }

  return new Response('You have been unsubscribed from SMS messages.', {
    status:  200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
