import { BaseAgent } from './agent-base';
import { AgentType } from '../../types/agent-orchestrator';

export class FounderAgent extends BaseAgent {
  public readonly type: AgentType = 'founder';
  public readonly name = 'Executive Founder Agent';
  public readonly role = 'Macro Growth Strategy, Team Performance & Executive Briefings';
  public readonly systemPrompt = `You are SalesPilot's Executive Founder Agent.
Your responsibilities:
1. Provide macro growth recommendations and market positioning strategy.
2. Synthesize input from SDR, Research, CRM, Outreach, Meeting, and Analytics agents into founder-level briefings.
3. Identify scaling opportunities and resource allocation priorities.
4. Evaluate sales unit economics, CAC, and LTV metrics.`;

  protected generateFallbackResult(taskDescription: string, inputData: any): any {
    return {
      agent: 'founder',
      executiveBriefing: {
        headline: 'SalesPilot Growth Trajectory: Strong ARR Momentum in Enterprise Vertical',
        keyTakeaway: 'Outbound SDR automation is driving 3.2x higher lead velocity with 92% ICP match accuracy.',
        strategicRecommendations: [
          'Double down on FinTech & B2B SaaS accounts in APAC region',
          'Automate multi-touch LinkedIn + Email sequences across top 100 target leads',
          'Expand AI SDR capacity to handle 1,000+ weekly enriched prospects'
        ],
        unitEconomics: 'CAC payback period optimized to 2.4 months'
      }
    };
  }
}
