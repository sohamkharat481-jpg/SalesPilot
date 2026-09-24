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
  public static getStageWeight(stage: any): number {
    switch (String(stage).toUpperCase()) {
      case 'PROSPECTING': return 0.10;
      case 'QUALIFIED': return 0.25;
      case 'DEMO_SCHEDULED': return 0.50;
      case 'PROPOSAL_SENT': return 0.70;
      case 'NEGOTIATION': return 0.85;
      case 'CLOSED_WON':
      case 'WON': return 1.00;
      case 'CLOSED_LOST':
      case 'LOST': return 0.00;
      case 'CONTACTED': return 0.30;
      case 'INTERESTED': return 0.45;
      case 'MEETING_REQUESTED': return 0.60;
      case 'PROPOSAL': return 0.75;
      default: return 0.10;
    }
  }
}
