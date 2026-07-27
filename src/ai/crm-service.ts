import { GeminiService } from './gemini-service';
import { Lead } from '../types';

export interface LeadSummaryResult {
  executiveSummary: string;
  recommendedPipelineStage: string;
  keyRisks: string[];
  nextSteps: string[];
}

export interface CrmNoteResult {
  noteTitle: string;
  noteBody: string;
  tags: string[];
  followUpDueDate: string;
}

export async function generateLeadExecutiveSummary(
  lead: Lead,
  apiKey?: string
): Promise<LeadSummaryResult> {
  const prompt = `Generate a concise CRM Executive Summary Report for:
- Prospect: ${lead.firstName} ${lead.lastName || ''} (${lead.title || 'Role'})
- Company: ${lead.company}
- Confidence Score: ${lead.confidenceScore || 50}%
- Current Status: ${lead.status}

Return JSON with:
{
  "executiveSummary": "2-3 sentence executive overview of account fit and readiness",
  "recommendedPipelineStage": "QUALIFIED, CONTACTED, or ENGAGED",
  "keyRisks": ["2 key deal risks or integration caveats"],
  "nextSteps": ["2 concrete action steps for the assigned sales rep"]
}
Return ONLY valid JSON.`;

  const fallback: LeadSummaryResult = {
    executiveSummary: `${lead.company} represents a high-potential target account. ${lead.firstName} (${lead.title || 'Decision Maker'}) possesses strong buying influence, making this a top-tier SDR outreach priority.`,
    recommendedPipelineStage: lead.status === 'NEW' ? 'QUALIFIED' : lead.status,
    keyRisks: [
      'Potential delay in decision cycle if multiple stakeholders are involved',
      'Requires domain authentication verification prior to launching high-volume sequences'
    ],
    nextSteps: [
      'Send personalized intro email with value audit offer',
      'Connect on LinkedIn with customized icebreaker note'
    ]
  };

  return GeminiService.generateContentSafely(apiKey, prompt, fallback);
}

export async function generateCrmNote(
  lead: Lead,
  actionType: string,
  userNotes?: string,
  apiKey?: string
): Promise<CrmNoteResult> {
  const prompt = `Generate a clean, professional CRM Activity Log Note for:
- Lead: ${lead.firstName} ${lead.lastName || ''} at ${lead.company}
- Action Performed: ${actionType}
- User Context / Event Notes: ${userNotes || 'Standard activity logged'}

Return JSON:
{
  "noteTitle": "Action Title (e.g., 'Outbound Email Dispatched' or 'Discovery Call Completed')",
  "noteBody": "Professional structured note summarizing interaction, prospect status update, and next milestones",
  "tags": ["Tag1", "Tag2"],
  "followUpDueDate": "In 2 business days"
}
Return ONLY valid JSON.`;

  const fallback: CrmNoteResult = {
    noteTitle: `CRM Log: ${actionType.replace('_', ' ')}`,
    noteBody: `Logged action [${actionType}] for ${lead.firstName} ${lead.lastName || ''} (${lead.company}). ${userNotes ? `Notes: ${userNotes}. ` : ''}Account confidence updated in CRM registry.`,
    tags: ['AI-SDR', actionType, 'Pipeline-Update'],
    followUpDueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0]
  };

  return GeminiService.generateContentSafely(apiKey, prompt, fallback);
}
