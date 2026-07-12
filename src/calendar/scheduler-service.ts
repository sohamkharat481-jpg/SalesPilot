/**
 * Enterprise Scheduling Assistant Service.
 */
export class SchedulerService {
  /**
   * Normalizes any ISO string to Indian Standard Time (IST) for display.
   */
  public static formatToIst(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (err) {
      console.error('[SCHEDULER EXCEPTION] Invalid ISO string:', err);
      return isoString;
    }
  }

  /**
   * Verifies if a selected timestamp sits in the future.
   */
  public static isValidBookingTime(isoString: string): boolean {
    try {
      const selectedTime = new Date(isoString).getTime();
      const minimumTime = Date.now() + (15 * 60 * 1000); // Must be at least 15 minutes out
      return selectedTime > minimumTime;
    } catch {
      return false;
    }
  }
}
