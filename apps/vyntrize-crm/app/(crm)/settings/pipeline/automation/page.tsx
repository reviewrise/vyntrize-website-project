import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { PipelineAutomationClient } from './PipelineAutomationClient';

export const metadata = {
  title: 'Pipeline Automation | Vyntrize CRM',
};

export default async function PipelineAutomationPage() {
  const session = await getSession();

  if (!session?.isLoggedIn) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN') {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Only administrators can access pipeline automation settings.
          </p>
        </div>
      </div>
    );
  }

  return <PipelineAutomationClient />;
}
