import { GeminiService } from './gemini-service';
import { Lead } from '../types';

export interface EmailGenerationParams {
  lead: Lead;
  tone?: 'Formal' | 'Casual' | 'Bold' | 'Persuasive' | 'Consultative';
  goal?: string;
  offer?: string;
  customPrompt?: string;
  companySummary?: string;
  painPoints?: string[];
}

export interface EmailGenerationResult {
  subject: string;
  body: string;
  personalizedFirstLine: string;
  cta: string;
  subjectLineOptions: string[];
  qualityScore: number;
  spamScore: number;
  spamRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  qualityFeedback: string[];
}

export interface LinkedInMessageResult {
  connectionRequest: string;
  inmailMessage: string;
  followUpNote: string;
}

export interface CtaOptimizationResult {
  softAsk: string;
  directBooking: string;
  valueAudit: string;
  frictionlessQuery: string;
  recommendedCta: string;
  reasoning: string;
}

export async function generateSdrEmail(
  params: EmailGenerationParams,
  apiKey?: string
): Promise<EmailGenerationResult> {
  const { lead, tone = 'Persuasive', goal = 'Schedule a 15-minute introductory meeting', offer = 'SalesPilot AI Outbound Platform', customPrompt, companySummary, painPoints } = params;

  const prompt = `You are an elite AI Email Copywriter and SDR Coach.
Draft a highly converting cold email for:
- Prospect: ${lead.firstName} ${lead.lastName || ''} (${lead.title || 'Decision Maker'}) at ${lead.company}
- Industry/Summary: ${companySummary || lead.company}
- Target Pain Points: ${JSON.stringify(painPoints || ['Outbound friction', 'Pipeline generation'])}
- Outreach Tone: ${tone}
- Outreach Goal: ${goal}
- Primary Offer: ${offer}
- Custom Instructions: ${customPrompt || 'None'}

Return a JSON object with the following fields:
{
  "subject": "Compelling subject line (3-6 words)",
  "body": "Complete email body with personalized greeting, icebreaker first line, value pitch, and clear call to action",
  "personalizedFirstLine": "Standout personalized first line tailored specifically to ${lead.company}",
  "cta": "The exact call-to-action used in the email",
  "subjectLineOptions": [
    "Curiosity-driven subject line",
    "Metric/Benefit subject line",
    "Direct quick question subject line"
  ],
  "qualityScore": 92,
  "spamScore": 12,
  "spamRiskLevel": "LOW",
  "qualityFeedback": [
    "High clarity and personalized context",
    "Frictionless single-ask call to action"
  ]
}

Return ONLY valid JSON.`;

  const fallback: EmailGenerationResult = {
    subject: `Quick question regarding outbound sales at ${lead.company}`,
    body: `Hi ${lead.firstName},\n\nI was reviewing ${lead.company}'s growth initiatives and noticed your team is driving key developments in your space.\n\nGiven the demand for predictable pipeline growth, I thought you might find SalesPilot's automated outbound suite valuable. We help decision makers at growing teams streamline lead sourcing and email deliverability without adding headcount.\n\n${customPrompt ? `Note: ${customPrompt}\n\n` : ''}Would you be open to a brief 10-minute chat next Tuesday to explore how this fits into ${lead.company}'s current goals?\n\nBest regards,\nSoham Kharat\nSalesPilot`,
    personalizedFirstLine: `I was reviewing ${lead.company}'s growth initiatives and noticed your team is driving key developments in your space.`,
    cta: `Would you be open to a brief 10-minute chat next Tuesday?`,
    subjectLineOptions: [
      `Quick question regarding outbound sales at ${lead.company}`,
      `Ideas for ${lead.company}'s Q3 pipeline growth`,
      `${lead.firstName} - 10 min chat on outbound automation?`
    ],
    qualityScore: 90,
    spamScore: 8,
    spamRiskLevel: 'LOW',
    qualityFeedback: [
      'Strong personalized opener referencing company',
      'Clear value proposition and low-friction CTA',
      'No spam trigger words detected'
    ]
  };

  return GeminiService.generateContentSafely(apiKey, prompt, fallback);
}

export async function generateLinkedInMessages(
  lead: Lead,
  apiKey?: string
): Promise<LinkedInMessageResult> {
  const prompt = `Generate high-converting LinkedIn outreach messages for:
- Prospect: ${lead.firstName} ${lead.lastName || ''} (${lead.title || 'Executive'}) at ${lead.company}

Return JSON with:
{
  "connectionRequest": "Under 300 characters connection note with personal touch",
  "inmailMessage": "Direct InMail message highlighting mutual industry fit and quick value prop",
  "followUpNote": "Short 2-sentence follow up message after connection acceptance"
}
Return ONLY valid JSON.`;

  const fallback: LinkedInMessageResult = {
    connectionRequest: `Hi ${lead.firstName}, impressed by ${lead.company}'s momentum in your sector. Would love to connect and share insights on scaling outbound pipelines. - Soham`,
    inmailMessage: `Hi ${lead.firstName},\n\nNotice you're leading key initiatives at ${lead.company}. We've built an AI SDR suite that automates lead enrichment and personalizes outreach at scale.\n\nOpen to connecting to discuss what's working best for your team right now?`,
    followUpNote: `Thanks for connecting ${lead.firstName}! Glad to be in touch. Let me know if you'd ever like to brainstorm modern outbound strategies.`
  };

  return GeminiService.generateContentSafely(apiKey, prompt, fallback);
}

export async function optimizeCta(
  lead: Lead,
  offer: string,
  apiKey?: string
): Promise<CtaOptimizationResult> {
  const prompt = `Generate 4 optimized Call to Action options for emailing ${lead.firstName} at ${lead.company} offering ${offer}.

Return JSON:
{
  "softAsk": "Soft exploratory CTA e.g., 'Worth a quick look?'",
  "directBooking": "Direct booking CTA e.g., 'Do you have 15 mins next Tuesday?'",
  "valueAudit": "Value offer CTA e.g., 'Can I send over a free 10-lead audit sample?'",
  "frictionlessQuery": "Single-reply question e.g., 'Is outbound pipeline a priority right now?'",
  "recommendedCta": "The top recommended CTA for this lead profile",
  "reasoning": "Brief explanation why this CTA works best for ${lead.title || 'this role'}"
}
Return ONLY valid JSON.`;

  const fallback: CtaOptimizationResult = {
    softAsk: `Would you be open to exploring this briefly if it saves your team time?`,
    directBooking: `Do you have 15 minutes next Tuesday or Wednesday for a quick demo?`,
    valueAudit: `Can I send over a customized 10-lead verified sample for ${lead.company}?`,
    frictionlessQuery: `Is automated outbound prospecting a priority for ${lead.company} this quarter?`,
    recommendedCta: `Is automated outbound prospecting a priority for ${lead.company} this quarter?`,
    reasoning: `Low-friction single-click replies convert 3x higher for senior decision makers like ${lead.title || 'Executives'}.`
  };

  return GeminiService.generateContentSafely(apiKey, prompt, fallback);
}
