// app/(crm)/sms/logs/page.tsx
// SMS Logs – shows all outbound text messages

import GlobalSmsLogs from '@/components/GlobalSmsLogs';

export const metadata = {
  title: 'SMS Logs | Vyntrize CRM',
  description: 'View all outbound SMS messages sent from the CRM.',
};

export default function SmsLogsPage() {
  return (
    <section className="mx-auto max-w-5xl p-6">
      <GlobalSmsLogs />
    </section>
  );
}
