import { prisma as db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import RescheduleClient from './client';

export default async function ReschedulePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;
  
  if (!token) return notFound();

  const event = await db.calendarEvent.findUnique({
    where: { rescheduleToken: token },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          bookingSlug: true,
          timezone: true,
        }
      }
    }
  });

  if (!event || event.cancelledAt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-slate-500">
          This reschedule link is invalid, expired, or the meeting is already cancelled.
        </div>
      </div>
    );
  }

  return <RescheduleClient token={token} expert={event.user} />;
}
