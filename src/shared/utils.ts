/**
 * High-performance shared formatting utilities.
 */
export class SharedUtils {
  /**
   * Formats numbers to Indian Rupee (INR) currency representation.
   */
  public static formatCurrencyInr(amount: number): string {
    if (isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Truncates long text strings with ellipsis, avoiding character cutoffs mid-word.
   */
  public static truncateText(text: string, limit: number = 100): string {
    if (!text || text.length <= limit) return text;
    const truncated = text.substring(0, limit);
    return truncated + '...';
  }
}
