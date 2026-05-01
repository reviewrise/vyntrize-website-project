import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import TaskList from '@/components/TaskList';

export default async function TasksPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage tasks and follow-ups for your leads.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <TaskList currentUserId={session.userId} currentUserRole={session.role} />
      </div>
    </div>
  );
}
