import { prisma as db } from '@/lib/prisma';
import { addMinutes, isAfter, isBefore, parseISO, startOfDay, endOfDay, setHours, setMinutes, getDay, isPast } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export type TimeSlot = {
  start: Date;
  end: Date;
};

/**
 * Get available 30-minute slots for a user on a given date string (e.g. '2026-05-25').
 * For MVP, we assume business hours are 9 AM to 5 PM in the server's local time (or UTC depending on Node env).
 */
export async function getAvailableSlots(userId: string, dateString: string): Promise<TimeSlot[]> {
  const user = await db.crmUser.findUnique({
    where: { id: userId },
    include: {
      availabilityRules: true,
      bookingSettings: true
    }
  });

  if (!user) return [];

  const timezone = user.timezone || 'America/New_York';
  const duration = user.bookingSettings?.durationMinutes || 30;
  const buffer = user.bookingSettings?.bufferMinutes || 15;

  // The client passes the date in the expert's timezone (e.g. '2026-05-25')
  // We parse it as a local date in that timezone
  const targetDateLocal = parseISO(dateString); // this is a midnight Date object in system local time, representing the string
  const dayOfWeek = getDay(targetDateLocal); // 0=Sun ... 6=Sat

  // Find rule for this day
  const rule = user.availabilityRules.find(r => r.dayOfWeek === dayOfWeek && r.isActive);
  if (!rule) return []; // Expert is not working today

  // We need to convert local hour/min in expert's timezone to absolute UTC Dates
  // The system date object targetDateLocal has its own timezone offset, we need to strip it.
  // We can construct the date string manually for the start and end in the expert's timezone.
  const startStr = `${dateString}T${rule.startHour.toString().padStart(2, '0')}:${rule.startMin.toString().padStart(2, '0')}:00`;
  const endStr = `${dateString}T${rule.endHour.toString().padStart(2, '0')}:${rule.endMin.toString().padStart(2, '0')}:00`;
  
  const startOfWorkUTC = fromZonedTime(startStr, timezone);
  const endOfWorkUTC = fromZonedTime(endStr, timezone);

  // Fetch DB events for this day range
  const events = await db.calendarEvent.findMany({
    where: {
      userId,
      startTime: { gte: startOfDay(startOfWorkUTC) },
      endTime: { lte: endOfDay(endOfWorkUTC) },
      cancelledAt: null,
    },
    orderBy: { startTime: 'asc' },
  });

  const availableSlots: TimeSlot[] = [];
  let currentSlotStart = startOfWorkUTC;
  const nowUTC = new Date();

  while (isBefore(currentSlotStart, endOfWorkUTC)) {
    const currentSlotEnd = addMinutes(currentSlotStart, duration);
    
    // Stop if the slot goes past working hours
    if (isAfter(currentSlotEnd, endOfWorkUTC)) break;

    // Check if slot is in the past
    if (isBefore(currentSlotStart, nowUTC)) {
      currentSlotStart = addMinutes(currentSlotStart, duration + buffer);
      continue;
    }
    
    // Check if current slot overlaps with any event (including buffer)
    const hasOverlap = events.some((event: any) => {
      // Slot overlaps if: slot start < event end + buffer AND slot end > event start - buffer
      // But actually buffer only applies to *our* scheduling padding.
      // Easiest overlap: slot end > event start AND slot start < event end
      return isBefore(currentSlotStart, event.endTime) && isAfter(currentSlotEnd, event.startTime);
    });

    if (!hasOverlap) {
      availableSlots.push({
        start: currentSlotStart,
        end: currentSlotEnd,
      });
    }

    currentSlotStart = addMinutes(currentSlotStart, duration + buffer);
  }

  return availableSlots;
}
