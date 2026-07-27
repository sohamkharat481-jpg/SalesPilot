import { Lead, Appointment, Deal } from '../types';

export interface AutoTask {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  taskType: 'CALL' | 'EMAIL' | 'PROPOSAL' | 'CRM_SYNC' | 'DEMO_PREP';
  completed: boolean;
  assignedTo: string;
  createdAt: string;
}

export interface DailyAgenda {
  date: string;
  totalTasks: number;
  highPriorityTasks: AutoTask[];
  upcomingMeetings: Appointment[];
  followupsDueToday: number;
  pipelineDealsNeedingAttention: Deal[];
  aiActionSummary: string;
}

/**
 * Enterprise Auto Task Creation, Reminder Engine & Daily Agenda Generator
 */
export class AutoTaskEngine {
  /**
   * Generates automated sales tasks based on lead statuses, aging, and appointments
   */
  public static generateAutoTasks(leads: Lead[], appointments: Appointment[], deals: Deal[]): AutoTask[] {
    const tasks: AutoTask[] = [];
    const now = new Date();

    leads.forEach((lead, idx) => {
      // 1. New Lead Outreach Task
      if (lead.status === 'NEW') {
        tasks.push({
          id: `task_new_${lead.id}`,
          leadId: lead.id,
          leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
          company: lead.company,
          title: `First Outreach: Send intro email to ${lead.firstName}`,
          description: `Compose and dispatch AI-personalized outbound email to ${lead.email}`,
          priority: 'HIGH',
          dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          taskType: 'EMAIL',
          completed: false,
          assignedTo: 'Sales SDR Rep',
          createdAt: now.toISOString()
        });
      }

      // 2. High Value Lead Priority Task
      if ((lead.confidenceScore || 0) >= 80) {
        tasks.push({
          id: `task_prio_${lead.id}`,
          leadId: lead.id,
          leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
          company: lead.company,
          title: `High ICP Fit Touchpoint for ${lead.company}`,
          description: `Confidence score ${lead.confidenceScore}%. Conduct LinkedIn research & send connection request.`,
          priority: 'HIGH',
          dueDate: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          taskType: 'CALL',
          completed: false,
          assignedTo: 'Account Executive',
          createdAt: now.toISOString()
        });
      }
    });

    // 3. Meeting Preparation Tasks
    appointments.forEach((apt) => {
      if (apt.status === 'SCHEDULED') {
        tasks.push({
          id: `task_meet_${apt.id}`,
          leadId: apt.leadId,
          leadName: apt.leadName,
          company: apt.title || 'Target Client',
          title: `Prepare Discovery Brief for ${apt.leadName}`,
          description: `Review account tech stack and generate AI Meeting Brief before call.`,
          priority: 'HIGH',
          dueDate: apt.startTime || apt.dateTime,
          taskType: 'DEMO_PREP',
          completed: false,
          assignedTo: 'Meeting Host',
          createdAt: now.toISOString()
        });
      }
    });

    // 4. Deal Proposal Tasks
    deals.forEach((deal) => {
      if (deal.stage === 'PROPOSAL_SENT') {
        tasks.push({
          id: `task_deal_${deal.id}`,
          leadId: deal.leadId,
          leadName: deal.leadName,
          company: deal.company,
          title: `Follow up on proposal: ₹${(deal.valueInr || 0).toLocaleString('en-IN')}`,
          description: `Check proposal viewing analytics and send follow-up note to decision makers.`,
          priority: 'MEDIUM',
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          taskType: 'PROPOSAL',
          completed: false,
          assignedTo: 'Deal Owner',
          createdAt: now.toISOString()
        });
      }
    });

    return tasks;
  }

  /**
   * Compiles complete Daily Agenda for sales execution
   */
  public static buildDailyAgenda(leads: Lead[], appointments: Appointment[], deals: Deal[]): DailyAgenda {
    const tasks = this.generateAutoTasks(leads, appointments, deals);
    const todayStr = new Date().toISOString().split('T')[0];

    const highPriority = tasks.filter(t => t.priority === 'HIGH');
    const upcomingMeetings = appointments.filter(a => a.status === 'SCHEDULED');
    const followupsDueToday = tasks.filter(t => t.taskType === 'EMAIL' || t.taskType === 'CALL').length;
    const dealsNeedingAttention = deals.filter(d => d.stage === 'NEGOTIATION' || d.stage === 'PROPOSAL_SENT');

    return {
      date: todayStr,
      totalTasks: tasks.length,
      highPriorityTasks: highPriority,
      upcomingMeetings,
      followupsDueToday,
      pipelineDealsNeedingAttention: dealsNeedingAttention,
      aiActionSummary: `You have ${highPriority.length} high-priority tasks and ${upcomingMeetings.length} discovery calls scheduled for today. Focus on initial touches for ${highPriority.length} top ICP leads.`
    };
  }
}
