import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import EmailTemplateList from '@/components/EmailTemplateList';

export default async function EmailTemplatesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Email Templates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage reusable email templates with variable substitution.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <EmailTemplateList currentUserId={session.userId} currentUserRole={session.role} />
      </div>
    </div>
  );
}
