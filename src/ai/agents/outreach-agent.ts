import { BaseAgent } from './agent-base';
import { AgentType } from '../../types/agent-orchestrator';

export class OutreachAgent extends BaseAgent {
  public readonly type: AgentType = 'outreach';
  public readonly name = 'Autonomous Outreach Agent';
  public readonly role = 'Multi-Touch Email Copywriting & Sequence Campaign Orchestration';
  public readonly systemPrompt = `You are SalesPilot's Autonomous Outreach Agent.
Your responsibilities:
1. Craft hyper-personalized multi-touch cold email sequences incorporating research hooks.
2. Draft warm follow-up messages tailored to prospect title and industry.
3. Optimize email subject lines for maximum open rates (>60%).
4. Recommend optimal sending times and communication channels.`;

  protected generateFallbackResult(taskDescription: string, inputData: any): any {
    const lead = inputData?.lead || inputData;
    const name = lead ? `${lead.firstName} ${lead.lastName}` : 'Prospect';
    const company = lead?.company || 'Target Account';

    return {
      agent: 'outreach',
      emailDraft: {
        subject: `Quick query regarding ${company}'s outbound lead workflow`,
        body: `Hi ${lead?.firstName || 'there'},\n\nI noticed ${company}'s recent hiring expansion in growth & sales operations. SalesPilot helps fast-growing teams automate outbound lead enrichment, hyper-personalized email sequences, and AI SDR follow-ups.\n\nWould you be open to a brief 10-minute demo this Thursday at 11:00 AM IST?\n\nBest regards,\nRahul Sharma\nSalesPilot Team`,
        optimalChannel: 'Email + LinkedIn Direct Message',
        recommendedSendTime: 'Tuesday 10:30 AM IST'
      },
      sequenceStepsCount: 3,
      predictedOpenRate: '64%'
    };
  }
}
