import { prisma as db } from '@/lib/prisma';
import { addMinutes, isAfter, isBefore, parseISO, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';

export type TimeSlot = {
  start: Date;
  end: Date;
};

/**
 * Get available 30-minute slots for a user on a given date string (e.g. '2026-05-25').
 * For MVP, we assume business hours are 9 AM to 5 PM in the server's local time (or UTC depending on Node env).
 */
export async function getAvailableSlots(userId: string, dateString: string): Promise<TimeSlot[]> {
  const targetDate = parseISO(dateString);
  
  // Define working hours (9:00 AM to 5:00 PM)
  const workStartHour = 9;
  const workEndHour = 17;
  
  const startOfWork = setMinutes(setHours(targetDate, workStartHour), 0);
  const endOfWork = setMinutes(setHours(targetDate, workEndHour), 0);
  
  // Fetch existing events for the day
  const events = await db.calendarEvent.findMany({
    where: {
      userId,
      startTime: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
    },
    orderBy: { startTime: 'asc' },
  });

  const availableSlots: TimeSlot[] = [];
  let currentSlotStart = startOfWork;

  while (isBefore(currentSlotStart, endOfWork)) {
    const currentSlotEnd = addMinutes(currentSlotStart, 30);
    
    // Check if current slot overlaps with any event
    const hasOverlap = events.some((event: any) => {
      // Slot overlaps if: slot start < event end AND slot end > event start
      return isBefore(currentSlotStart, event.endTime) && isAfter(currentSlotEnd, event.startTime);
    });

    if (!hasOverlap) {
      availableSlots.push({
        start: currentSlotStart,
        end: currentSlotEnd,
      });
    }

    currentSlotStart = currentSlotEnd;
  }

  return availableSlots;
}
