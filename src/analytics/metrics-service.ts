import { Campaign } from '../types';

/**
 * Enterprise sales analytics computation utilities.
 */
export class MetricsService {
  /**
   * Compiles percentage rates, shielding calculations from divide-by-zero exceptions.
   */
  public static calculateRatios(campaign: Campaign): { openRate: number; replyRate: number } {
    const { totalSent, totalOpened, totalReplied } = campaign;
    if (!totalSent || totalSent === 0) {
      return { openRate: 0, replyRate: 0 };
    }

    const openRate = Math.round((totalOpened / totalSent) * 100);
    const replyRate = Math.round((totalReplied / totalSent) * 100);

    return { openRate, replyRate };
  }

  /**
   * Combines high-level totals across multiple campaigns.
   */
  public static aggregatePortfolioStats(campaigns: Campaign[]): { totalSent: number; avgOpenRate: number; avgReplyRate: number } {
    if (campaigns.length === 0) {
      return { totalSent: 0, avgOpenRate: 0, avgReplyRate: 0 };
    }

    const totalSent = campaigns.reduce((sum, c) => sum + c.totalSent, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.totalOpened, 0);
    const totalReplied = campaigns.reduce((sum, c) => sum + c.totalReplied, 0);

    if (totalSent === 0) {
      return { totalSent: 0, avgOpenRate: 0, avgReplyRate: 0 };
    }

    return {
      totalSent,
      avgOpenRate: Math.round((totalOpened / totalSent) * 100),
      avgReplyRate: Math.round((totalReplied / totalSent) * 100)
    };
  }
}
