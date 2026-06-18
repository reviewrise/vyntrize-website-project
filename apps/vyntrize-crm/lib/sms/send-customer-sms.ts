/**
 * sendCustomerSms — single error boundary for all customer-facing SMS sends.
 *
 * Sequence:
 *   1. Config gate         — skip if VYNTRIZE_SMS_API_KEY / SMS_CONFIG not set
 *   2. Phone presence      — skip if to is null/empty
 *   3. E.164 validation    — skip if phone format is invalid
 *   4. smsOptOut check     — skip if contact has opted out
 *   5. Template rendering  — substitute {{variables}} if provided
 *   6. Send via smsService
 *   7. 403 backfill        — set Contact.smsOptOut=true on provider opt-out
 *   8. SmsLog creation     — always, regardless of outcome
 *   9. Return result       — never throws
 *
 * This function is fire-and-forget from the caller's perspective.
 * All errors are caught, logged as FAILED, and returned as a result struct.
 */

import { prisma }           from '@/lib/prisma';
import { smsService }       from '@/lib/sms/sms-service';
import { TemplateRenderer } from '@/lib/email/template-renderer';
import type { TemplateVariables } from '@/lib/email/template-renderer';

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface CustomerSmsOptions {
  /** E.164 phone number (or any string — validated internally). Null/undefined → SKIPPED. */
  to:          string | null | undefined;
  /** Plain text message body. May contain {{variable}} tokens. */
  message:     string;
  /** Template variable values for {{token}} substitution. */
  variables?:  TemplateVariables;
  /** Associates the SmsLog entry with a lead. */
  leadId?:     string;
  /** Associates the SmsLog entry with a contact; also used for opt-out check. */
  contactId?:  string;
}

export interface CustomerSmsResult {
  sent:       boolean;
  skipped:    boolean;
  failed:     boolean;
  messageId?: string;
  error?:     string;
}

// ─── E.164 validation ─────────────────────────────────────────────────────────

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

// ─── SmsLog helper ────────────────────────────────────────────────────────────

type SmsStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED';

async function logSms(data: {
  toPhone:      string;
  content:      string;
  status:       SmsStatus;
  messageId?:   string;
  errorMessage?: string;
  sentAt?:      Date;
  contactId?:   string;
  leadId?:      string;
}): Promise<void> {
  try {
    await prisma.smsLog.create({
      data: Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      ) as any,
    });
  } catch (err) {
    // Logging failure must never propagate
    console.error('[sendCustomerSms] Failed to write SmsLog:', err);
  }
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function sendCustomerSms(
  options: CustomerSmsOptions
): Promise<CustomerSmsResult> {
  const { to, message, variables, leadId, contactId } = options;
  const phone = to ?? '';

  try {
    // ── Step 1: Config gate ────────────────────────────────────────────────
    const config = await smsService.getConfig();
    if (!config) {
      console.warn('[sendCustomerSms] SMS not configured — skipping send to', phone || '(no phone)');
      await logSms({
        toPhone:      phone,
        content:      message,
        status:       'SKIPPED',
        errorMessage: 'SMS service not configured',
        contactId,
        leadId,
      });
      return { sent: false, skipped: true, failed: false, error: 'SMS service not configured' };
    }

    // ── Step 2: Phone presence check ──────────────────────────────────────
    if (!phone) {
      await logSms({
        toPhone:      '(none)',
        content:      message,
        status:       'SKIPPED',
        errorMessage: 'No phone number provided',
        contactId,
        leadId,
      });
      return { sent: false, skipped: true, failed: false, error: 'No phone number provided' };
    }

    // ── Step 3: E.164 validation ───────────────────────────────────────────
    if (!isValidE164(phone)) {
      console.warn('[sendCustomerSms] Invalid E.164 phone number:', phone);
      await logSms({
        toPhone:      phone,
        content:      message,
        status:       'SKIPPED',
        errorMessage: `Invalid phone number format: ${phone}`,
        contactId,
        leadId,
      });
      return { sent: false, skipped: true, failed: false, error: `Invalid phone number format: ${phone}` };
    }

    // ── Step 4: smsOptOut check ────────────────────────────────────────────
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where:  { id: contactId },
        select: { smsOptOut: true },
      });
      if (contact?.smsOptOut === true) {
        await logSms({
          toPhone:      phone,
          content:      message,
          status:       'SKIPPED',
          errorMessage: 'Contact has opted out of SMS',
          contactId,
          leadId,
        });
        return { sent: false, skipped: true, failed: false, error: 'Contact has opted out of SMS' };
      }
    }

    // ── Step 5: Template rendering ────────────────────────────────────────
    const renderedMessage = variables
      ? TemplateRenderer.render(message, variables)
      : message;

    // ── Step 6: Send ──────────────────────────────────────────────────────
    const result = await smsService.sendSms({
      to:      phone,
      content: renderedMessage,
    });

    // ── Step 7: 403 backfill (provider opt-out) ───────────────────────────
    if (result.skipped) {
      if (contactId) {
        try {
          await prisma.contact.update({
            where: { id: contactId },
            data:  { smsOptOut: true },
          });
          console.info('[sendCustomerSms] Set smsOptOut=true for contact', contactId, '(provider 403)');
        } catch (updateErr) {
          console.error('[sendCustomerSms] Failed to set smsOptOut:', updateErr);
        }
      }
      await logSms({
        toPhone:      phone,
        content:      renderedMessage,
        status:       'SKIPPED',
        errorMessage: 'Recipient opted out at provider level',
        contactId,
        leadId,
      });
      return { sent: false, skipped: true, failed: false };
    }

    // ── Step 8: Log result ────────────────────────────────────────────────
    if (result.success) {
      await logSms({
        toPhone:    phone,
        content:    renderedMessage,
        status:     'SENT',
        messageId:  result.messageId,
        sentAt:     new Date(),
        contactId,
        leadId,
      });
      console.log('[sendCustomerSms] Sent to', phone, 'messageId:', result.messageId);
      return { sent: true, skipped: false, failed: false, messageId: result.messageId };
    }

    // smsService returned success=false without throwing
    await logSms({
      toPhone:      phone,
      content:      renderedMessage,
      status:       'FAILED',
      errorMessage: result.error ?? 'Unknown error from SMS service',
      contactId,
      leadId,
    });
    return { sent: false, skipped: false, failed: true, error: result.error ?? 'Unknown error' };

  } catch (err) {
    // ── Step 9: Catch-all error boundary ─────────────────────────────────
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[sendCustomerSms] Uncaught error:', errMsg);

    try {
      await logSms({
        toPhone:      phone || '(none)',
        content:      message,
        status:       'FAILED',
        errorMessage: errMsg,
        contactId,
        leadId,
      });
    } catch {
      // Swallow — logging failure must never propagate
    }

    return { sent: false, skipped: false, failed: true, error: errMsg };
  }
}
