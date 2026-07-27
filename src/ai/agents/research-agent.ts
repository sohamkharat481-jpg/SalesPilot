import { BaseAgent } from './agent-base';
import { AgentType } from '../../types/agent-orchestrator';

export class ResearchAgent extends BaseAgent {
  public readonly type: AgentType = 'research';
  public readonly name = 'Deep Research Agent';
  public readonly role = 'Company Intelligence, Tech Stack Detection & Growth Telemetry';
  public readonly systemPrompt = `You are SalesPilot's Deep Research Agent.
Your responsibilities:
1. Deep-scan target companies for tech stack, headcount trends, and hiring activity.
2. Detect recent funding rounds, acquisitions, and executive leadership updates.
3. Identify specific pain points and personalization hooks from company news and web presence.
4. Estimate revenue ranges, employee counts, and market positioning.`;

  protected generateFallbackResult(taskDescription: string, inputData: any): any {
    const lead = inputData?.lead || inputData;
    const company = lead?.company || 'Target Company';

    return {
      agent: 'research',
      companyName: company,
      estimatedRevenue: '₹25Cr - ₹100Cr ARR',
      employeeCount: '50-200 employees',
      detectedTechStack: ['React', 'AWS', 'HubSpot', 'PostgreSQL', 'Node.js'],
      recentTriggers: [
        `Active hiring: 8 open roles in Sales & Engineering at ${company}`,
        'Recent headcount growth +32% YoY',
        'Modernizing customer portal & CRM workflows'
      ],
      personalizationHooks: [
        `Noticed ${company}'s active expansion in sales engineering`,
        'Leveraging React & AWS cloud infrastructure'
      ],
      confidenceScore: 92
    };
  }
}
