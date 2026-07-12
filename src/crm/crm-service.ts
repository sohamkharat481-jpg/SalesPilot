import { Deal, DealStage } from '../types';

/**
 * Enterprise CRM pipeline calculation manager.
 * Calculates lead values and deal stage statistics.
 */
export class CrmService {
  /**
   * Sums total pipeline revenue weighting by stages.
   */
  public static calculatePipelineValue(deals: Deal[]): number {
    return deals
      .filter(deal => deal.stage !== 'CLOSED_LOST')
      .reduce((total, deal) => {
        // Apply stage weighting for risk-adjusted forecasts
        const weight = this.getStageWeight(deal.stage);
        return total + (deal.valueInr * weight);
      }, 0);
  }

  /**
   * Standard risk-adjusted probability weights.
   */
  public static getStageWeight(stage: DealStage): number {
    switch (stage) {
      case 'PROSPECTING': return 0.10;
      case 'QUALIFIED': return 0.25;
      case 'DEMO_SCHEDULED': return 0.50;
      case 'PROPOSAL_SENT': return 0.70;
      case 'NEGOTIATION': return 0.85;
      case 'CLOSED_WON': return 1.00;
      case 'CLOSED_LOST': return 0.00;
      default: return 0.00;
    }
  }
}
