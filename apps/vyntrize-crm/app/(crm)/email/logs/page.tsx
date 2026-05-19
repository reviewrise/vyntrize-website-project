// app/(crm)/email/logs/page.tsx
// Page for app‑level email logs with pagination

import GlobalEmailLogs from "@/components/GlobalEmailLogs";

export default function EmailLogsPage() {
  return (
    <section className="mx-auto max-w-5xl p-6">
      <GlobalEmailLogs />
    </section>
  );
}
