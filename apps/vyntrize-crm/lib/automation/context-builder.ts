import type { Lead, Contact, CrmUser } from '@platform/vyntrize-db';
import { TemplateVariables } from '@/lib/email/template-renderer';

export interface ContextBuilderArgs {
  lead?: Lead & {
    contact?: Contact | null;
    assignee?: CrmUser | null;
    company?: { name: string } | null;
  };
  contact?: Contact | null;
  user?: CrmUser | null;
}

export class ContextBuilder {
  /**
   * Build a standard set of template variables from provided CRM entities.
   * This ensures {{contact.firstName}}, {{user.name}}, etc. work consistently
   * across Email Templates, SMS Templates, and Drip Campaigns.
   */
  static buildVariables(args: ContextBuilderArgs): TemplateVariables {
    const vars: TemplateVariables = {};
    const crmBase = process.env.NEXT_PUBLIC_CRM_URL ?? 'https://crm.vyntrize.com';

    // 1. Resolve Contact
    const contact = args.contact || args.lead?.contact;
    if (contact) {
      vars['contact.firstName'] = contact.firstName || '';
      vars['contact.lastName'] = contact.lastName || '';
      vars['contact.name'] = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      vars['contact.email'] = contact.email || '';
      vars['contact.phone'] = contact.phone || '';
      
      if (contact.email) {
        vars['unsubscribeUrl'] = `${crmBase}/api/email/unsubscribe?email=${encodeURIComponent(contact.email)}`;
      }
      
      if (contact.phone) {
        vars['optOutUrl'] = `${crmBase}/api/sms/unsubscribe?phone=${encodeURIComponent(contact.phone)}`;
      }
    }

    // 2. Resolve Lead & Company
    if (args.lead) {
      vars['lead.title'] = args.lead.title || '';
      vars['lead.value'] = (args.lead as any).dealValue?.toString() || '0';
      vars['company.name'] = (args.lead as any).company?.name || '';
    }

    // 3. Resolve User (Assignee)
    const user = args.user || args.lead?.assignee;
    if (user) {
      vars['user.name'] = (user as any).displayName || '';
      vars['user.email'] = user.email || '';
      vars['user.bookingLink'] = `${crmBase}/book/${user.id}`;
    }

    // 4. Common Utils
    vars['date'] = new Date().toLocaleDateString();
    vars['time'] = new Date().toLocaleTimeString();

    return vars;
  }
}
