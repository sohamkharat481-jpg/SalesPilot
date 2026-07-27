import { GeminiService } from '../ai/gemini-service';
import { Lead, Deal } from '../types';

export interface NextBestActionResult {
  leadId: string;
  leadName: string;
  company: string;
  primaryRecommendation: string;
  actionType: 'SEND_EMAIL' | 'SCHEDULE_CALL' | 'SEND_PROPOSAL' | 'LINKEDIN_TOUCH' | 'QUALIFY_LEAD';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  suggestedScript: string;
  expectedConversionImpact: string;
}

export interface PipelineRecommendationResult {
  dealId: string;
  dealTitle: string;
  company: string;
  dealValueInr: number;
  currentStage: string;
  aiRecommendation: string;
  riskAssessment: string;
  recommendedDiscountOffer?: string;
  nextBestMilestone: string;
}

/**
 * Enterprise AI Next-Best-Action & Pipeline Recommendation Engine
 */
export class NextBestActionEngine {
  /**
   * Generates AI Next-Best-Action for a specific lead using Gemini
   */
  public static async generateNextBestAction(
    lead: Lead,
    apiKey?: string
  ): Promise<NextBestActionResult> {
    const prompt = `You are a Chief Revenue Officer and AI SDR Strategy Director.
Determine the single NEXT BEST ACTION for this prospect:
- Prospect: ${lead.firstName} ${lead.lastName || ''} (${lead.title || 'Decision Maker'})
- Company: ${lead.company}
- Lead Status: ${lead.status}
- Confidence Score: ${lead.confidenceScore || 70}%
- Industry: ${lead.enrichment?.industryGroup || 'B2B Services'}

Output JSON:
{
  "leadId": "${lead.id}",
  "leadName": "${lead.firstName} ${lead.lastName || ''}",
  "company": "${lead.company}",
  "primaryRecommendation": "Specific tactical action step e.g., 'Send personalized value audit note via email'",
  "actionType": "SEND_EMAIL",
  "urgency": "HIGH",
  "reasoning": "Brief 1-2 sentence explanation based on ICP fit and status",
  "suggestedScript": "1-2 sentence quick opening script or email icebreaker",
  "expectedConversionImpact": "+18% reply probability"
}
Return ONLY valid JSON.`;

    const fallback: NextBestActionResult = {
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
      company: lead.company,
      primaryRecommendation: `Dispatch personalized AI value audit email to ${lead.firstName}`,
      actionType: 'SEND_EMAIL',
      urgency: (lead.confidenceScore || 50) >= 75 ? 'HIGH' : 'MEDIUM',
      reasoning: `Prospect has high ICP alignment (${lead.confidenceScore || 75}% confidence). Initiating value-driven outreach accelerates discovery.`,
      suggestedScript: `Hi ${lead.firstName}, I noticed ${lead.company} is scaling outbound initiatives. I created a custom 10-lead sample list for your team.`,
      expectedConversionImpact: '+22% reply rate boost'
    };

    return GeminiService.generateContentSafely(apiKey, prompt, fallback);
  }

  /**
   * Generates AI Pipeline Recommendations for active deals
   */
  public static async generateDealRecommendation(
    deal: Deal,
    apiKey?: string
  ): Promise<PipelineRecommendationResult> {
    const dealTitleStr = deal.title || `${deal.company} Pipeline Opportunity`;
    const prompt = `Analyze this CRM deal and output next strategic recommendation:
- Deal: ${dealTitleStr} (${deal.company})
- Value: ₹${(deal.valueInr || 0).toLocaleString('en-IN')}
- Current Stage: ${deal.stage}
- Probability: ${deal.probability || 50}%

Return JSON:
{
  "dealId": "${deal.id}",
  "dealTitle": "${dealTitleStr}",
  "company": "${deal.company}",
  "dealValueInr": ${deal.valueInr || 0},
  "currentStage": "${deal.stage}",
  "aiRecommendation": "Concrete deal strategy to move to next stage",
  "riskAssessment": "Risk factor assessment",
  "nextBestMilestone": "Target next stage milestone"
}
Return ONLY valid JSON.`;

    const fallback: PipelineRecommendationResult = {
      dealId: deal.id,
      dealTitle: dealTitleStr,
      company: deal.company,
      dealValueInr: deal.valueInr,
      currentStage: deal.stage,
      aiRecommendation: `Schedule executive alignment call with technical stakeholders at ${deal.company} to lock scope.`,
      riskAssessment: `Low risk if technical requirements are validated this week.`,
      recommendedDiscountOffer: `Offer 5% upfront payment incentive for annual billing cycle.`,
      nextBestMilestone: deal.stage === 'PROPOSAL_SENT' ? 'NEGOTIATION' : 'CLOSED_WON'
    };

    return GeminiService.generateContentSafely(apiKey, prompt, fallback);
  }
}
