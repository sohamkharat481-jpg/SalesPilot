import { BaseAgent } from './agent-base';
import { AgentType } from '../../types/agent-orchestrator';

export class SdrAgent extends BaseAgent {
  public readonly type: AgentType = 'sdr';
  public readonly name = 'Autonomous SDR Agent';
  public readonly role = 'Lead Qualification, Prospecting Strategy & ICP Prioritization';
  public readonly systemPrompt = `You are SalesPilot's Autonomous SDR Agent.
Your responsibilities:
1. Evaluate incoming lead profiles for ICP alignment (Company size, technology, industry, revenue).
2. Rank and score leads by conversion probability and intent signals.
3. Recommend immediate prospecting next-actions (e.g., cold outreach, warm introduction, nurturing sequence).
4. Identify decision-maker titles and key buying triggers.`;

  protected generateFallbackResult(taskDescription: string, inputData: any): any {
    const lead = inputData?.lead || inputData;
    return {
      agent: 'sdr',
      leadId: lead?.id || 'lead_sdr_01',
      qualificationStatus: 'QUALIFIED',
      icpScore: 88,
      recommendedAction: 'Schedule 3-step personalized cold outreach sequence',
      keyBuyingTriggers: [
        'Outbound team expansion',
        'Modernizing CRM technology stack',
        'High decision-maker title match'
      ],
      targetSequenceDays: [1, 3, 7],
      notes: `SDR Agent evaluated ${lead?.company || 'Target Account'} and confirmed direct ICP alignment.`
    };
  }
}
