import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import PipelineSettings from '@/components/PipelineSettings';

export default async function PipelineSettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN') {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Only administrators can access pipeline settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Pipeline Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure your sales pipeline stages and automation rules.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <PipelineSettings />
      </div>
    </div>
  );
}
