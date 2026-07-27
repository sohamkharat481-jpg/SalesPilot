import { GeminiService } from './gemini-service';
import { Lead } from '../types';

export interface ProspectIntelligenceResult {
  companySummary: string;
  websiteAnalysis: string;
  industry: string;
  teamSize: string;
  technologies: string[];
  painPoints: string[];
  recentNews: string[];
  icpFitScore: number;
  
  decisionMakerName: string;
  decisionMakerRole: string;
  decisionMakerScore: number;
  buyingIntentEstimate: 'HIGH' | 'MEDIUM' | 'LOW';
  talkingPoints: string[];
  
  objectionPredictions: { objection: string; counter: string }[];
  overallPriorityScore: number;
}

export async function analyzeProspectIntelligence(
  lead: Lead,
  apiKey?: string
): Promise<ProspectIntelligenceResult> {
  const prompt = `You are an elite AI SDR and B2B Prospecting Specialist.
Analyze the following lead profile:
- Name: ${lead.firstName} ${lead.lastName || ''}
- Role/Title: ${lead.title || 'Decision Maker'}
- Company: ${lead.company}
- Email: ${lead.email}
- Industry/Tech: ${JSON.stringify(lead.enrichment?.techStack || [])}

Perform deep research and output a JSON object with:
{
  "companySummary": "2-3 sentences explaining what ${lead.company} does, business model, positioning",
  "websiteAnalysis": "Analysis of their digital footprint, website structure, conversion vectors, and web tech gaps",
  "industry": "${lead.enrichment?.industryGroup || 'Technology & B2B Services'}",
  "teamSize": "${lead.enrichment?.companySize || '20-100 employees'}",
  "technologies": ["List 4-5 software/tools they use or likely use"],
  "painPoints": ["3 highly specific operational & outbound sales pain points"],
  "recentNews": ["2 recent growth signals or buying intent triggers"],
  "icpFitScore": 88,
  "decisionMakerName": "${lead.firstName} ${lead.lastName || ''}",
  "decisionMakerRole": "${lead.title || 'VP of Sales / Director'}",
  "decisionMakerScore": 85,
  "buyingIntentEstimate": "HIGH",
  "talkingPoints": ["3 personalized hook lines for outreach"],
  "objectionPredictions": [
    { "objection": "Predicted sales objection", "counter": "Tactical response handling" }
  ],
  "overallPriorityScore": 87
}

Return ONLY valid JSON.`;

  const fallback: ProspectIntelligenceResult = {
    companySummary: `${lead.company} is a dynamic B2B market operator expanding its regional footprint with strong core service offerings.`,
    websiteAnalysis: `Digital presence shows modern web design with lead capture forms, clear value propositions, and potential for automated lead routing integration.`,
    industry: lead.enrichment?.industryGroup || 'Technology & B2B Services',
    teamSize: lead.enrichment?.companySize || '25-100 employees',
    technologies: lead.enrichment?.techStack || ['Google Workspace', 'Salesforce', 'HubSpot', 'React'],
    painPoints: [
      'High lead response times on inbound inquiries',
      'Manual outbound prospecting creating workflow bottlenecks',
      'Inconsistent CRM pipeline hygiene across sales reps'
    ],
    recentNews: ['Scaling sales team', 'Evaluating outbound automation tools'],
    icpFitScore: lead.confidenceScore || 85,
    decisionMakerName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
    decisionMakerRole: lead.title || 'Decision Maker',
    decisionMakerScore: 82,
    buyingIntentEstimate: 'HIGH',
    talkingPoints: [
      `Reference their current position at ${lead.company} and operational scaling goals`,
      `Highlight how SalesPilot reduces outreach cycle time by 60%`
    ],
    objectionPredictions: [
      { objection: 'Already using another CRM or email tool', counter: 'SalesPilot integrates seamlessly alongside existing tech stacks as an execution layer.' },
      { objection: 'Budget constraints this quarter', counter: 'Offer flexible INR billing terms and a risk-free pilot phase.' }
    ],
    overallPriorityScore: Math.round(((lead.confidenceScore || 85) + 82 + 90) / 3)
  };

  return GeminiService.generateContentSafely(apiKey, prompt, fallback);
}
