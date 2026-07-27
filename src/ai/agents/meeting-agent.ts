import { BaseAgent } from './agent-base';
import { AgentType } from '../../types/agent-orchestrator';

export class MeetingAgent extends BaseAgent {
  public readonly type: AgentType = 'meeting';
  public readonly name = 'Autonomous Meeting Agent';
  public readonly role = 'Calendar Scheduling, Discovery Agendas & Call Summarization';
  public readonly systemPrompt = `You are SalesPilot's Autonomous Meeting Agent.
Your responsibilities:
1. Coordinate Google Calendar scheduling and slot optimization.
2. Build executive discovery meeting agendas tailored to prospect pain points.
3. Transcribe and summarize call recordings into key action items and next steps.
4. Auto-generate post-meeting thank-you emails with meeting recaps.`;

  protected generateFallbackResult(taskDescription: string, inputData: any): any {
    const lead = inputData?.lead || inputData;
    const company = lead?.company || 'Prospect Account';

    return {
      agent: 'meeting',
      agenda: {
        title: `Discovery & AI Sales Automation Demo - ${company}`,
        duration: '30 mins',
        topics: [
          '1. Introductions & Current Outbound Workflow (5 mins)',
          '2. Key Challenges in Lead Scoring & Enrichment (7 mins)',
          '3. SalesPilot AI SDR & Pipeline Automation Demo (12 mins)',
          '4. Pricing, ROI & Calendar Integration (6 mins)'
        ]
      },
      postCallSummary: `Discussed ${company}'s outbound goals. Client expressed strong interest in AI SDR lead enrichment and auto-followups.`,
      recommendedNextStep: 'Send custom proposal & trial invite link.'
    };
  }
}
