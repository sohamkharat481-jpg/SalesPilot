import { Lead, Deal, DealStage } from '../types';

export interface LeadPriorityScore {
  leadId: string;
  leadName: string;
  company: string;
  priorityScore: number; // 0 - 100
  tier: 'TIER_1_HOT' | 'TIER_2_WARM' | 'TIER_3_STANDARD';
  scoringFactors: {
    titleAuthorityScore: number;
    companySizeScore: number;
    techStackRelevance: number;
    engagementSignals: number;
  };
  recommendedAction: string;
}

export interface PipelineAutomationRule {
  id: string;
  name: string;
  trigger: 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'MEETING_BOOKED' | 'PROPOSAL_VIEWED' | 'NO_TOUCH_7_DAYS';
  action: 'MOVE_STAGE' | 'ASSIGN_TAG' | 'TRIGGER_AI_EMAIL' | 'CREATE_HIGH_PRIO_TASK';
  targetStage?: DealStage;
  enabled: boolean;
}

/**
 * Enterprise Lead Priority Engine & Pipeline Automation Manager
 */
export class PriorityEngine {
  /**
   * Computes priority score (0-100) for all leads using title, company size, tech stack, and engagement
   */
  public static calculateLeadPriorities(leads: Lead[]): LeadPriorityScore[] {
    return leads.map((lead) => {
      // 1. Title Authority Score (max 30)
      const titleLower = (lead.title || '').toLowerCase();
      let titleAuthorityScore = 15;
      if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('head')) {
        titleAuthorityScore = 30;
      } else if (titleLower.includes('director') || titleLower.includes('chief') || titleLower.includes('ceo') || titleLower.includes('founder')) {
        titleAuthorityScore = 28;
      } else if (titleLower.includes('manager') || titleLower.includes('lead')) {
        titleAuthorityScore = 20;
      }

      // 2. Company Size / Value Score (max 25)
      const companySize = (lead.enrichment?.companySize || '').toLowerCase();
      let companySizeScore = 15;
      if (companySize.includes('500+') || companySize.includes('enterprise')) {
        companySizeScore = 25;
      } else if (companySize.includes('100-500') || companySize.includes('50-200')) {
        companySizeScore = 22;
      } else if (companySize.includes('20-100') || companySize.includes('10-50')) {
        companySizeScore = 18;
      }

      // 3. Tech Stack Relevance (max 25)
      const techStackCount = lead.enrichment?.techStack?.length || 0;
      const techStackRelevance = Math.min(25, techStackCount * 5 + 10);

      // 4. Engagement / Confidence Signals (max 20)
      const engagementSignals = Math.min(20, Math.round((lead.confidenceScore || 50) / 5));

      const totalScore = Math.min(100, titleAuthorityScore + companySizeScore + techStackRelevance + engagementSignals);

      let tier: LeadPriorityScore['tier'] = 'TIER_3_STANDARD';
      let recommendedAction = 'Standard sequence queue';

      if (totalScore >= 80) {
        tier = 'TIER_1_HOT';
        recommendedAction = 'Immediate 1-on-1 personalized AI outreach & executive call';
      } else if (totalScore >= 60) {
        tier = 'TIER_2_WARM';
        recommendedAction = 'Enroll in automated multi-step email & LinkedIn drip';
      }

      return {
        leadId: lead.id,
        leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
        company: lead.company,
        priorityScore: totalScore,
        tier,
        scoringFactors: {
          titleAuthorityScore,
          companySizeScore,
          techStackRelevance,
          engagementSignals
        },
        recommendedAction
      };
    });
  }

  /**
   * Returns standard enterprise pipeline automation rules
   */
  public static getDefaultPipelineRules(): PipelineAutomationRule[] {
    return [
      {
        id: 'rule_1',
        name: 'Auto-advance to QUALIFIED on email click',
        trigger: 'EMAIL_CLICKED',
        action: 'MOVE_STAGE',
        targetStage: 'QUALIFIED',
        enabled: true
      },
      {
        id: 'rule_2',
        name: 'Auto-advance to DEMO_SCHEDULED on appointment booking',
        trigger: 'MEETING_BOOKED',
        action: 'MOVE_STAGE',
        targetStage: 'DEMO_SCHEDULED',
        enabled: true
      },
      {
        id: 'rule_3',
        name: 'Create High Prio Task on proposal view',
        trigger: 'PROPOSAL_VIEWED',
        action: 'CREATE_HIGH_PRIO_TASK',
        enabled: true
      },
      {
        id: 'rule_4',
        name: 'Flag for follow-up if uncontacted for 7 days',
        trigger: 'NO_TOUCH_7_DAYS',
        action: 'TRIGGER_AI_EMAIL',
        enabled: true
      }
    ];
  }
}
