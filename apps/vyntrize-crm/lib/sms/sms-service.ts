/**
 * SmsService — notification delivery via vyntrise-sms
 *
 * API: https://sms.vyntrise.com/api/v1/messages/send
 * Auth: Authorization: Bearer {apiKey}
 *
 * Request body:
 *   { to: string, content: string }                          // raw message
 *   { to: string, templateId: string, variables?: object }   // template-based
 *
 * Success: 201 Created → { success: true, messageId: string, status: "QUEUED" }
 * Errors:
 *   400 — missing to / content
 *   403 — recipient opted out (treat as silent skip, not an error)
 *   404 — template not found
 *   500 — gateway error
 */

import { prisma } from '@/lib/prisma';

export interface SmsConfig {
  baseUrl: string;   // e.g. "https://sms.vyntrise.com"
  apiKey:  string;   // Bearer token
}

export interface SmsOptions {
  /** E.164 format: "+15551234567" */
  to:            string;
  /** Raw message text, up to 1600 characters */
  content:       string;
  isSeedOrTest?: boolean;
}

export interface SmsResult {
  success:    boolean;
  messageId?: string;
  skipped?:   boolean;   // true when recipient has opted out
  error?:     string;
}

class SmsService {
  async getConfig(): Promise<SmsConfig | null> {
    // 1. Try SystemSetting table (same pattern as EmailService)
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'SMS_CONFIG' },
      });
      if (setting?.value) {
        return setting.value as unknown as SmsConfig;
      }
    } catch {
      // DB unavailable — fall through to env vars
    }

    // 2. Fall back to environment variables
    const apiKey  = process.env.VYNTRIZE_SMS_API_KEY;
    const baseUrl = process.env.VYNTRIZE_SMS_BASE_URL ?? 'https://sms.vyntrise.com';

    if (!apiKey) return null;
    return { baseUrl, apiKey };
  }

  async sendSms(options: SmsOptions): Promise<SmsResult> {
    // Suppress delivery during seeds and test runs
    if (options.isSeedOrTest) {
      return { success: true, messageId: 'suppressed-seed-or-test' };
    }

    const config = await this.getConfig();
    if (!config) {
      console.warn('[SmsService] Not configured — no API key. Skipping SMS to', options.to);
      return { success: false, error: 'SMS service not configured' };
    }

    // Validate E.164 phone format
    if (!isValidE164(options.to)) {
      console.warn('[SmsService] Invalid phone number format:', options.to);
      return { success: false, error: `Invalid phone number: ${options.to}` };
    }

    // vyntrise-sms supports up to 1600 chars
    const content = options.content.length > 1600
      ? options.content.slice(0, 1597) + '...'
      : options.content;

    try {
      const res = await fetch(`${config.baseUrl}/api/v1/messages/send`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ to: options.to, content }),
      });

      // 201 = success
      if (res.status === 201) {
        const data = await res.json();
        console.log('[SmsService] Sent:', { to: options.to, messageId: data.messageId, status: data.status });
        return { success: true, messageId: data.messageId };
      }

      // 403 = recipient opted out — this is expected, not an error
      if (res.status === 403) {
        console.info('[SmsService] Recipient has opted out:', options.to);
        return { success: true, skipped: true };
      }

      // All other non-success codes
      let errBody: { error?: string } = {};
      try { errBody = await res.json(); } catch { /* unparseable */ }
      const errMsg = errBody?.error ?? `HTTP ${res.status}`;
      console.error('[SmsService] Send failed:', errMsg, '→', options.to);
      return { success: false, error: errMsg };

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[SmsService] Network error:', errMsg);
      return { success: false, error: errMsg };
    }
  }

  async getStatus(): Promise<{ configured: boolean }> {
    const config = await this.getConfig();
    return { configured: !!config };
  }
}

/** Basic E.164 validation: + followed by 7–15 digits. */
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

export const smsService = new SmsService();
