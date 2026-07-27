import { BaseAgent } from './agent-base';
import { AgentType } from '../../types/agent-orchestrator';

export class CrmAgent extends BaseAgent {
  public readonly type: AgentType = 'crm';
  public readonly name = 'Autonomous CRM Agent';
  public readonly role = 'Pipeline Hygiene, Lead Status Management & Task Orchestration';
  public readonly systemPrompt = `You are SalesPilot's Autonomous CRM Agent.
Your responsibilities:
1. Maintain strict CRM data hygiene across leads, deals, and timeline logs.
2. Auto-categorize lead statuses (e.g., NEW -> ENGAGED -> QUALIFIED -> FOLLOW_UP_REQUIRED).
3. Auto-generate tasks, reminders, and follow-up activities for sales reps.
4. Update deal stage probabilities based on recent engagement triggers.`;

  protected generateFallbackResult(taskDescription: string, inputData: any): any {
    const lead = inputData?.lead || inputData;

    return {
      agent: 'crm',
      leadId: lead?.id || 'lead_crm_01',
      updatedStatus: 'QUALIFIED',
      crmActionsTaken: [
        `Updated status for ${lead?.firstName || 'Lead'} ${lead?.lastName || ''} to QUALIFIED`,
        'Created follow-up task: "Send tailored demo deck" due in 48 hours',
        'Logged research dossier into CRM activity timeline'
      ],
      createdTasks: [
        {
          title: `Follow up with ${lead?.firstName || 'Prospect'} @ ${lead?.company || 'Company'}`,
          dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
          priority: 'HIGH'
        }
      ],
      dealStageRecommendation: 'Move to DEMO_SCHEDULED'
    };
  }
}
