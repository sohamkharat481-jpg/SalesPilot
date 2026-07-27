import { Lead, Deal, Appointment } from '../types';

export interface ActivityTimelineItem {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  activityType: 'EMAIL_SENT' | 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'MEETING_SCHEDULED' | 'STATUS_CHANGED' | 'CRM_NOTE_ADDED' | 'PROPOSAL_GENERATED';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  metadata?: Record<string, any>;
}

export interface CrmHistoryRecord {
  id: string;
  leadId: string;
  leadName: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  timestamp: string;
}

export interface EmailTrackingMetadata {
  pixelUrl: string;
  trackedLinks: { originalUrl: string; trackingUrl: string }[];
  trackingHeaders: { 'X-SalesPilot-Track-ID': string; 'X-SalesPilot-Lead-ID': string };
}

/**
 * Enterprise Activity Timeline & CRM History Ledger Sync Manager
 */
export class CrmSyncTimelineManager {
  private static timelineStore: ActivityTimelineItem[] = [
    {
      id: 'act_init_1',
      leadId: 'lead_1',
      leadName: 'Rajesh Kumar',
      company: 'Horizon Media',
      activityType: 'STATUS_CHANGED',
      title: 'Lead Status Updated to QUALIFIED',
      description: 'System automatically updated status based on high ICP match and positive reply.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      actor: 'SalesPilot AI Engine'
    },
    {
      id: 'act_init_2',
      leadId: 'lead_1',
      leadName: 'Rajesh Kumar',
      company: 'Horizon Media',
      activityType: 'EMAIL_SENT',
      title: 'Initial Outbound Pitch Email Dispatched',
      description: 'Subject: "Quick question regarding outbound sales at Horizon Media"',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      actor: 'Soham Kharat'
    }
  ];

  private static historyLedger: CrmHistoryRecord[] = [
    {
      id: 'hist_1',
      leadId: 'lead_1',
      leadName: 'Rajesh Kumar',
      fieldChanged: 'status',
      oldValue: 'NEW',
      newValue: 'QUALIFIED',
      changedBy: 'AI SDR Engine',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  /**
   * Prevents duplicate records by checking email & company uniqueness
   */
  public static isDuplicateLead(existingLeads: Lead[], email: string, company: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCompany = company.trim().toLowerCase();

    return existingLeads.some(l => 
      (l.email && l.email.trim().toLowerCase() === cleanEmail) ||
      (l.company && l.company.trim().toLowerCase() === cleanCompany && l.firstName.trim().toLowerCase() === l.firstName.trim().toLowerCase())
    );
  }

  /**
   * Logs a new activity timeline item safely without duplicate IDs
   */
  public static logActivity(item: Omit<ActivityTimelineItem, 'id' | 'timestamp'>): ActivityTimelineItem {
    const newItem: ActivityTimelineItem = {
      ...item,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString()
    };
    this.timelineStore.unshift(newItem);
    return newItem;
  }

  /**
   * Logs CRM field history changes
   */
  public static logHistoryChange(record: Omit<CrmHistoryRecord, 'id' | 'timestamp'>): CrmHistoryRecord {
    const newRecord: CrmHistoryRecord = {
      ...record,
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString()
    };
    this.historyLedger.unshift(newRecord);
    return newRecord;
  }

  /**
   * Returns activity timeline items for a specific lead or all leads
   */
  public static getActivityTimeline(leadId?: string): ActivityTimelineItem[] {
    if (leadId) {
      return this.timelineStore.filter(a => a.leadId === leadId);
    }
    return this.timelineStore;
  }

  /**
   * Returns CRM history audit log records
   */
  public static getCrmHistory(leadId?: string): CrmHistoryRecord[] {
    if (leadId) {
      return this.historyLedger.filter(h => h.leadId === leadId);
    }
    return this.historyLedger;
  }

  /**
   * Prepares email tracking metadata (tracking pixel & header metadata)
   */
  public static prepareEmailTracking(leadId: string, emailId: string): EmailTrackingMetadata {
    const trackId = `trk_${leadId}_${emailId}_${Date.now()}`;
    return {
      pixelUrl: `/api/v1/tracking/open/${trackId}.gif`,
      trackedLinks: [
        {
          originalUrl: 'https://salespilot.ai/demo',
          trackingUrl: `/api/v1/tracking/click/${trackId}?url=${encodeURIComponent('https://salespilot.ai/demo')}`
        }
      ],
      trackingHeaders: {
        'X-SalesPilot-Track-ID': trackId,
        'X-SalesPilot-Lead-ID': leadId
      }
    };
  }
}
