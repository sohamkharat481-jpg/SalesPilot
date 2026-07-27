import { Lead } from '../types';

export interface AgedLeadReport {
  leadId: string;
  leadName: string;
  company: string;
  daysUncontacted: number;
  currentStatus: string;
  recommendedStatus: string;
  agingCategory: 'FRESH' | 'WARM' | 'STALE' | 'COOLING' | 'DORMANT';
  actionRequired: string;
  autoMoved: boolean;
}

/**
 * Enterprise Lead Aging Detection & Automatic Status Movement Engine
 */
export class LeadAgingEngine {
  /**
   * Analyzes all leads for inactivity and calculates lead aging metrics
   */
  public static analyzeLeadAging(leads: Lead[]): AgedLeadReport[] {
    const now = new Date().getTime();

    return leads.map((lead) => {
      // Determine last interaction time
      const createdTime = new Date(lead.createdAt || Date.now()).getTime();
      const updatedTime = lead.updatedAt ? new Date(lead.updatedAt).getTime() : createdTime;
      const daysUncontacted = Math.max(0, Math.floor((now - updatedTime) / (1000 * 60 * 60 * 24)));

      let agingCategory: AgedLeadReport['agingCategory'] = 'FRESH';
      let recommendedStatus = lead.status;
      let actionRequired = 'Active pipeline tracking';
      let autoMoved = false;

      if (daysUncontacted >= 30) {
        agingCategory = 'DORMANT';
        recommendedStatus = 'ARCHIVED';
        actionRequired = 'Archive or trigger long-term re-engagement drip sequence';
        if (lead.status === 'NEW' || lead.status === 'CONTACTED') {
          autoMoved = true;
        }
      } else if (daysUncontacted >= 14) {
        agingCategory = 'COOLING';
        recommendedStatus = 'STALE';
        actionRequired = 'Schedule urgent follow-up or reassignment';
        if (lead.status === 'NEW') {
          autoMoved = true;
        }
      } else if (daysUncontacted >= 7) {
        agingCategory = 'STALE';
        recommendedStatus = lead.status === 'NEW' ? 'FOLLOW_UP_REQUIRED' : lead.status;
        actionRequired = 'Needs multi-channel touchpoint within 24 hours';
      } else if (daysUncontacted >= 3) {
        agingCategory = 'WARM';
        actionRequired = 'Check open rates and schedule step 2 email';
      }

      return {
        leadId: lead.id,
        leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
        company: lead.company,
        daysUncontacted,
        currentStatus: lead.status,
        recommendedStatus,
        agingCategory,
        actionRequired,
        autoMoved
      };
    });
  }

  /**
   * Automatically updates lead status in memory / CRM registry based on aging rules
   */
  public static applyAutomaticStatusMovement(leads: Lead[]): { updatedLeads: Lead[]; movedCount: number } {
    let movedCount = 0;
    const reports = this.analyzeLeadAging(leads);

    const updatedLeads = leads.map((lead) => {
      const report = reports.find(r => r.leadId === lead.id);
      if (report && report.autoMoved && lead.status !== report.recommendedStatus) {
        movedCount++;
        return {
          ...lead,
          status: report.recommendedStatus as any,
          updatedAt: new Date().toISOString()
        };
      }
      return lead;
    });

    return { updatedLeads, movedCount };
  }
}
