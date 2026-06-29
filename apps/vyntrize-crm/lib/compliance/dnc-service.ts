// Simple Do-Not-Call (DNC) Registry Checker
// In a production environment, this would query a dedicated DNC database or a third-party API.

export class DncService {
  // Hardcoded list of blocked numbers for mock purposes
  private blockedNumbers: Set<string> = new Set([
    '+15550000000',
    '+15559999999',
    '+18005550199', // Example test number
  ]);

  /**
   * Checks if a phone number is on the Do-Not-Call registry.
   * @param phone The phone number to check (e.g., +15551234567)
   * @returns boolean True if the number is blocked, false otherwise
   */
  async isBlocked(phone: string): Promise<boolean> {
    // Normalize phone number (remove spaces, dashes, parens)
    const normalized = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check against local mock list
    if (this.blockedNumbers.has(normalized)) {
      return true;
    }
    
    return false;
  }
}

export const dncService = new DncService();
