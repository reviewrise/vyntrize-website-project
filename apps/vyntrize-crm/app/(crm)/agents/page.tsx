import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AgentsDashboardClient } from './AgentsDashboardClient';

export const metadata = {
  title: 'AI Agent Dashboard | Vyntrize CRM',
  description: 'Monitor and manage AI agents in your CRM',
};

export default async function AgentsPage() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return <AgentsDashboardClient />;
}
