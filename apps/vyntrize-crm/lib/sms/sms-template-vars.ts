/**
 * buildSmsTemplateVars — builds the standard variable set for customer SMS templates.
 *
 * All values default to empty string when source data is absent so that
 * TemplateRenderer.render() never leaves unreplaced {{variable}} tokens.
 */

import type { Contact, Lead } from '@platform/vyntrize-db';
import type { TemplateVariables } from '@/lib/email/template-renderer';

/**
 * Build the standard {{variable}} substitution map for customer-facing SMS.
 *
 * Available tokens:
 *   {{firstName}}   — contact first name
 *   {{lastName}}    — contact last name
 *   {{company}}     — contact company name (empty string if no company linked)
 *   {{bookingLink}} — assignee's public booking page URL
 *   {{optOutUrl}}   — SMS unsubscribe link for this contact's phone number
 */
export function buildSmsTemplateVars(
  contact: Contact | null | undefined,
  lead: Lead & { contact?: Contact; company?: { name: string } | null }
): TemplateVariables {
  const crmBase = process.env.NEXT_PUBLIC_CRM_URL ?? 'https://crm.vyntrize.com';
  const phone   = contact?.phone ?? '';

  return {
    firstName:   contact?.firstName ?? '',
    lastName:    contact?.lastName  ?? '',
    company:     (lead as any).company?.name ?? '',
    bookingLink: lead.assigneeId
      ? `${crmBase}/book/${lead.assigneeId}`
      : '',
    optOutUrl:   phone
      ? `${crmBase}/api/sms/unsubscribe?phone=${encodeURIComponent(phone)}`
      : '',
  };
}
