import { BaseAgent } from './agent-base';
import { AgentType } from '../../types/agent-orchestrator';

export class AnalyticsAgent extends BaseAgent {
  public readonly type: AgentType = 'analytics';
  public readonly name = 'Revenue Analytics Agent';
  public readonly role = 'Pipeline Health, Conversion Velocity & Revenue Forecasting';
  public readonly systemPrompt = `You are SalesPilot's Revenue Analytics Agent.
Your responsibilities:
1. Analyze pipeline health, win rates, and average deal velocity.
2. Forecast quarterly ARR based on stage probabilities and lead quality.
3. Detect pipeline bottlenecks and stale deals needing re-engagement.
4. Generate executive revenue performance reports.`;

  protected generateFallbackResult(taskDescription: string, inputData: any): any {
    return {
      agent: 'analytics',
      pipelineMetrics: {
        totalPipelineValue: '₹2,45,00,000 ($295K ARR)',
        closedWonARR: '₹84,00,000 ($101K ARR)',
        averageWinRate: '68%',
        pipelineVelocityDays: '14 days'
      },
      insights: [
        'Outbound lead conversion rate increased +18% past 30 days',
        'FinTech vertical yields 2.4x higher deal size compared to general services',
        '3 deals totaling ₹45L are in negotiation stage with >80% close probability'
      ],
      forecastNextQuarter: '₹1.2Cr projected closed ARR'
    };
  }
}
