// app/(crm)/sms/templates/page.tsx

import SmsTemplateManager from '@/components/SmsTemplateManager';

export const metadata = {
  title: 'SMS Templates | Vyntrize CRM',
  description: 'Manage reusable SMS message templates.',
};

export default function SmsTemplatesPage() {
  return (
    <section className="mx-auto max-w-5xl p-6">
      <SmsTemplateManager />
    </section>
  );
}
