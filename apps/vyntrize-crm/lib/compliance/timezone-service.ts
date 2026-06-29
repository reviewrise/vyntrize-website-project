export class TimezoneService {
  /**
   * Checks if the current time in the given timezone is between 8 AM and 8 PM.
   * If it is outside this window, returns the number of milliseconds to delay
   * until 8 AM the next valid day in that timezone.
   * Returns 0 if it's currently inside the window.
   */
  getDelayUntilNextWindow(timezone: string = 'America/New_York'): number {
    try {
      const now = new Date();
      
      // Get the current hour in the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });
      
      const parts = formatter.formatToParts(now);
      const hourPart = parts.find(p => p.type === 'hour');
      if (!hourPart) return 0; // fallback if parsing fails
      
      const currentHour = parseInt(hourPart.value, 10);
      
      // Window is 8 AM to 8 PM (20:00)
      // Check if we are inside the window
      if (currentHour >= 8 && currentHour < 20) {
        return 0; // inside window, no delay needed
      }
      
      // We are outside the window. Calculate ms until 8 AM in target timezone.
      // Easiest way without external libs: create a Date of the current time in the TZ,
      // manipulate the hours, and diff it.
      
      const dateStr = now.toLocaleString('en-US', { timeZone: timezone });
      const tzNow = new Date(dateStr);
      
      const target = new Date(tzNow.getTime());
      target.setHours(8, 0, 0, 0);
      
      // If we are at or after 8 PM (20+), target 8 AM tomorrow
      if (currentHour >= 20) {
        target.setDate(target.getDate() + 1);
      }
      
      const delayMs = target.getTime() - tzNow.getTime();
      return delayMs > 0 ? delayMs : 0;
      
    } catch (e) {
      console.error('[TimezoneService] Error calculating timezone delay', e);
      return 0; // fallback to sending immediately if timezone is invalid
    }
  }
}

export const timezoneService = new TimezoneService();
