import { SdrAgent } from './sdr-agent';
import { ResearchAgent } from './research-agent';
import { CrmAgent } from './crm-agent';
import { OutreachAgent } from './outreach-agent';
import { MeetingAgent } from './meeting-agent';
import { AnalyticsAgent } from './analytics-agent';
import { FounderAgent } from './founder-agent';
import { 
  AgentType, OrchestrationPlan, OrchestratedTask, InterAgentMessage 
} from '../../types/agent-orchestrator';

export class AgentOrchestrator {
  private sdrAgent = new SdrAgent();
  private researchAgent = new ResearchAgent();
  private crmAgent = new CrmAgent();
  private outreachAgent = new OutreachAgent();
  private meetingAgent = new MeetingAgent();
  private analyticsAgent = new AnalyticsAgent();
  private founderAgent = new FounderAgent();

  /**
   * Returns all active agents in the multi-agent system
   */
  public getAgents() {
    return [
      this.sdrAgent,
      this.researchAgent,
      this.crmAgent,
      this.outreachAgent,
      this.meetingAgent,
      this.analyticsAgent,
      this.founderAgent
    ];
  }

  /**
   * Orchestrates a multi-agent workflow based on user goal
   */
  public async orchestrateGoal(
    userGoal: string,
    initialData: any = {},
    apiKey?: string
  ): Promise<OrchestrationPlan> {
    const planId = `plan_${Date.now()}`;
    const sharedContext: Record<string, any> = { ...initialData, userGoal };
    const interAgentMessages: InterAgentMessage[] = [];

    // 1. Decompose user goal into multi-agent tasks
    const tasks = this.decomposeGoalIntoTasks(userGoal, initialData);

    const plan: OrchestrationPlan = {
      planId,
      userGoal,
      tasks,
      overallStatus: 'EXECUTING',
      interAgentMessages,
      sharedContext
    };

    // 2. Execute tasks sequentially with inter-agent communication & shared context passing
    for (const task of plan.tasks) {
      task.status = 'IN_PROGRESS';
      const targetAgentObj = this.getAgentByType(task.targetAgent);

      if (!targetAgentObj) {
        task.status = 'FAILED';
        task.errorMessage = `Agent type ${task.targetAgent} not found.`;
        continue;
      }

      // Execute task
      const result = await targetAgentObj.executeTask(
        task.description,
        task.inputData,
        plan.sharedContext,
        apiKey
      );

      if (result.success) {
        task.status = 'COMPLETED';
        task.resultData = result.result;
        task.completedTimestamp = new Date().toISOString();

        // Save output to shared context
        plan.sharedContext[`${task.targetAgent}_output`] = result.result;

        // Record inter-agent message if there's a next task
        const nextTask = plan.tasks.find((t) => t.status === 'PENDING');
        if (nextTask) {
          const msg = targetAgentObj.sendMessage(nextTask.targetAgent, result.result);
          plan.interAgentMessages.push(msg);
        }
      } else {
        // Retry / Failure recovery
        if (task.retryCount < 2) {
          task.retryCount++;
          console.warn(`Retrying task ${task.id} (Attempt ${task.retryCount})...`);
          const retryResult = await targetAgentObj.executeTask(
            task.description,
            task.inputData,
            plan.sharedContext,
            apiKey
          );
          if (retryResult.success) {
            task.status = 'RECOVERED';
            task.resultData = retryResult.result;
            task.completedTimestamp = new Date().toISOString();
            plan.sharedContext[`${task.targetAgent}_output`] = retryResult.result;
          } else {
            task.status = 'FAILED';
            task.errorMessage = retryResult.error;
          }
        } else {
          task.status = 'FAILED';
          task.errorMessage = result.error;
        }
      }
    }

    // Determine overall status
    const allCompleted = plan.tasks.every((t) => t.status === 'COMPLETED' || t.status === 'RECOVERED');
    const anyCompleted = plan.tasks.some((t) => t.status === 'COMPLETED' || t.status === 'RECOVERED');

    plan.overallStatus = allCompleted
      ? 'COMPLETED'
      : anyCompleted
      ? 'PARTIAL_SUCCESS'
      : 'FAILED';

    return plan;
  }

  /**
   * Intelligently decomposes goal into agent tasks
   */
  private decomposeGoalIntoTasks(userGoal: string, initialData: any): OrchestratedTask[] {
    const goalLower = userGoal.toLowerCase();
    const lead = initialData?.lead;

    // Full Lead Enrichment & Prospecting Campaign Workflow
    if (goalLower.includes('lead') || goalLower.includes('outreach') || goalLower.includes('prospect') || lead) {
      return [
        {
          id: `task_1_sdr`,
          title: 'Assess Lead Qualification & ICP Match',
          description: `Qualify lead ${lead?.firstName || ''} ${lead?.lastName || ''} at ${lead?.company || 'Target Company'} against target ICP criteria.`,
          targetAgent: 'sdr',
          status: 'PENDING',
          inputData: { lead },
          retryCount: 0,
          assignedTimestamp: new Date().toISOString()
        },
        {
          id: `task_2_research`,
          title: 'Deep Research Company & Tech Stack',
          description: `Research tech stack, hiring signals, and recent growth triggers for ${lead?.company || 'Target Account'}.`,
          targetAgent: 'research',
          status: 'PENDING',
          inputData: { lead },
          retryCount: 0,
          assignedTimestamp: new Date().toISOString()
        },
        {
          id: `task_3_outreach`,
          title: 'Generate Personalized Email Sequence',
          description: `Draft hyper-personalized 3-touch cold email sequence using research hooks and SDR positioning.`,
          targetAgent: 'outreach',
          status: 'PENDING',
          inputData: { lead },
          retryCount: 0,
          assignedTimestamp: new Date().toISOString()
        },
        {
          id: `task_4_crm`,
          title: 'Update CRM Records & Schedule Follow-ups',
          description: `Update CRM lead status, attach research dossier, and log outreach task.`,
          targetAgent: 'crm',
          status: 'PENDING',
          inputData: { lead },
          retryCount: 0,
          assignedTimestamp: new Date().toISOString()
        }
      ];
    }

    // Executive Pipeline & Strategy Workflow
    if (goalLower.includes('pipeline') || goalLower.includes('revenue') || goalLower.includes('strategy') || goalLower.includes('report')) {
      return [
        {
          id: `task_1_analytics`,
          title: 'Analyze Revenue Metrics & Pipeline Velocity',
          description: 'Evaluate pipeline ARR, win rates, and forecast quarterly revenue velocity.',
          targetAgent: 'analytics',
          status: 'PENDING',
          inputData: initialData,
          retryCount: 0,
          assignedTimestamp: new Date().toISOString()
        },
        {
          id: `task_2_founder`,
          title: 'Synthesize Executive Founder Growth Strategy',
          description: 'Build founder-level executive briefing with scaling priorities and unit economics.',
          targetAgent: 'founder',
          status: 'PENDING',
          inputData: initialData,
          retryCount: 0,
          assignedTimestamp: new Date().toISOString()
        }
      ];
    }

    // Default multi-agent workflow
    return [
      {
        id: `task_1_sdr`,
        title: 'Analyze Sales Objective',
        description: `Evaluate objective: "${userGoal}"`,
        targetAgent: 'sdr',
        status: 'PENDING',
        inputData: initialData,
        retryCount: 0,
        assignedTimestamp: new Date().toISOString()
      },
      {
        id: `task_2_outreach`,
        title: 'Formulate Actionable Output',
        description: `Generate tailored sales copy or campaign strategy based on SDR analysis.`,
        targetAgent: 'outreach',
        status: 'PENDING',
        inputData: initialData,
        retryCount: 0,
        assignedTimestamp: new Date().toISOString()
      }
    ];
  }

  private getAgentByType(type: AgentType) {
    switch (type) {
      case 'sdr': return this.sdrAgent;
      case 'research': return this.researchAgent;
      case 'crm': return this.crmAgent;
      case 'outreach': return this.outreachAgent;
      case 'meeting': return this.meetingAgent;
      case 'analytics': return this.analyticsAgent;
      case 'founder': return this.founderAgent;
      default: return null;
    }
  }
}
