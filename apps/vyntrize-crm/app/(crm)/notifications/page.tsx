import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { notificationService } from '@/lib/notifications/notification-service';
import { NotificationsClient } from './NotificationsClient';

export const metadata = { title: 'Notifications — Vyntrize CRM' };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session?.isLoggedIn) {
    redirect('/login');
  }

  // Fetch first page server-side to avoid a loading flash on the client
  const result = await notificationService.getNotifications(
    session.userId as string,
    1,
    25,
  );

  return (
    <NotificationsClient
      initialNotifications={result.data as unknown as import('@/components/notifications/NotificationItem').ClientNotification[]}
      initialTotalCount={result.totalCount}
    />
  );
}
