import { GeminiService } from './gemini-service';
import { Lead, Appointment } from '../types';

export interface MeetingBriefResult {
  id: string;
  appointmentId: string;
  organizationId: string;
  companyOverview: string;
  contactOverview: string;
  keyDiscussionPoints: string[];
  suggestedQuestions: string[];
  possibleObjections: string[];
  meetingStrategy: string;
  createdAt: string;
}

export async function generateMeetingBrief(
  lead: Lead,
  appointment: Appointment,
  apiKey?: string
): Promise<MeetingBriefResult> {
  const prompt = `You are a Senior Sales Director and Executive Meeting Strategist.
Generate a comprehensive meeting prep brief for an upcoming sales discovery call:
- Lead Name: ${lead.firstName} ${lead.lastName || ''} (${lead.title || 'Decision Maker'})
- Company: ${lead.company}
- Meeting Title: ${appointment.title || 'Discovery Call'}
- Scheduled Date: ${appointment.startTime || appointment.dateTime}
- Lead Industry / Tech: ${JSON.stringify(lead.enrichment?.techStack || [])}

Return a JSON object with exact fields:
{
  "companyOverview": "Concise summary of ${lead.company}'s market position, scale, and operational scope",
  "contactOverview": "Analysis of ${lead.firstName}'s likely priorities, decision authority, and communication preferences",
  "keyDiscussionPoints": [
    "3 core agenda topics to cover during the call"
  ],
  "suggestedQuestions": [
    "3 insightful open-ended questions to uncover pain points and timeline"
  ],
  "possibleObjections": [
    "Objection 1; Counter response 1",
    "Objection 2; Counter response 2"
  ],
  "meetingStrategy": "Strategic roadmap for the call (e.g. 5m Rapport -> 10m Discovery -> 10m Demo -> 5m Next Steps)"
}

Return ONLY valid JSON.`;

  const fallback: MeetingBriefResult = {
    id: `brief_${appointment.id}`,
    appointmentId: appointment.id,
    organizationId: appointment.organizationId || 'org_salespilot_lifetime',
    companyOverview: `${lead.company} is an active industry participant with established operational workflows and growth ambitions in their sector.`,
    contactOverview: `${lead.firstName} holds a senior position (${lead.title || 'Decision Maker'}) with direct oversight on operational efficiency and vendor evaluation.`,
    keyDiscussionPoints: [
      `Review ${lead.company}'s current lead sourcing and outbound outreach workflows`,
      `Demonstrate SalesPilot's dynamic enrichment and automatic email sequence triggers`,
      `Discuss team seats, local INR billing compliance, and pilot onboarding timeline`
    ],
    suggestedQuestions: [
      `What is currently your biggest bottleneck when scaling new client acquisition?`,
      `How are your sales reps managing email deliverability and domain reputation right now?`,
      `What key criteria will determine whether you adopt a new outbound automation platform this quarter?`
    ],
    possibleObjections: [
      `We already use an existing CRM and email tool; Highlight SalesPilot's API integrations and dual-sync workflows.`,
      `We need to evaluate budget for next quarter; Offer flexible monthly terms and a 14-day trial period.`
    ],
    meetingStrategy: `Start with 5 minutes on rapport and background, spend 10 minutes on diagnostic discovery questions, deliver a targeted 10-minute feature walkthrough focusing on pain points, and lock in specific next steps in the final 5 minutes.`,
    createdAt: new Date().toISOString()
  };

  const aiData = await GeminiService.generateContentSafely(apiKey, prompt, fallback);

  return {
    id: `brief_${appointment.id}`,
    appointmentId: appointment.id,
    organizationId: appointment.organizationId || 'org_salespilot_lifetime',
    companyOverview: aiData.companyOverview || fallback.companyOverview,
    contactOverview: aiData.contactOverview || fallback.contactOverview,
    keyDiscussionPoints: aiData.keyDiscussionPoints || fallback.keyDiscussionPoints,
    suggestedQuestions: aiData.suggestedQuestions || fallback.suggestedQuestions,
    possibleObjections: aiData.possibleObjections || fallback.possibleObjections,
    meetingStrategy: aiData.meetingStrategy || fallback.meetingStrategy,
    createdAt: new Date().toISOString()
  };
}
