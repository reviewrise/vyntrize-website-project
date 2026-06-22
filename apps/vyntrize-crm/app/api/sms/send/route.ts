/**
 * POST /api/sms/send
 *
 * Authenticated endpoint — mirrors POST /api/email/send.
 * Allows CRM users to manually send a plain-text SMS to a contact.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession }               from '@/lib/session';
import { prisma }                   from '@/lib/prisma';
import { sendCustomerSms }          from '@/lib/sms/send-customer-sms';

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

interface ManualSmsRequest {
  to:          string;
  toName?:     string;
  message:     string;
  contactId?:  string;
  leadId?:     string;
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const data = (await request.json()) as ManualSmsRequest;

    if (!data.to || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // ── E.164 validation ──────────────────────────────────────────────────
    if (!E164_REGEX.test(data.to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Phone must be in E.164 format (e.g. +15551234567).' },
        { status: 400 }
      );
    }

    // ── Build Variables & Opt-out check ───────────────────────────────────
    let variables: Record<string, string> | undefined;
    
    if (data.contactId) {
      const contact = await prisma.contact.findUnique({
        where:  { id: data.contactId },
        include: { company: { select: { name: true } } },
      });
      if (contact?.smsOptOut === true) {
        return NextResponse.json(
          { error: 'Contact has opted out of SMS messages.' },
          { status: 400 }
        );
      }
      if (contact) {
        variables = {
          firstName:   contact.firstName || '',
          lastName:    contact.lastName || '',
          companyName: contact.company?.name || '',
          email:       contact.email || '',
          phone:       contact.phone || '',
        };
      }
    }

    // ── Send ──────────────────────────────────────────────────────────────
    const result = await sendCustomerSms({
      to:        data.to,
      message:   data.message,
      variables,
      contactId: data.contactId,
      leadId:    data.leadId,
    });

    if (result.failed) {
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

    console.log('[POST /api/sms/send] Sent to', data.to, 'messageId:', result.messageId);

    return NextResponse.json({
      success:   true,
      messageId: result.messageId,
      skipped:   result.skipped,
    });

  } catch (error) {
    console.error('[POST /api/sms/send] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
