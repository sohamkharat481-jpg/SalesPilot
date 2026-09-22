export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'STOPPED';

export type QueueItemStatus = 
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'WAITING'
  | 'REPLIED'
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'UNSUBSCRIBED'
  | 'BOUNCED'
  | 'FAILED'
  | 'CANCELLED';

export type ReplyClassification = 
  | 'INTERESTED'
  | 'MEETING_REQUEST'
  | 'NEEDS_MORE_INFO'
  | 'NOT_INTERESTED'
  | 'UNSUBSCRIBE'
  | 'OUT_OF_OFFICE'
  | 'UNCLEAR';

export type OutreachEventType = 
  | 'campaign_created'
  | 'campaign_started'
  | 'email_queued'
  | 'email_sent'
  | 'email_failed'
  | 'followup_scheduled'
  | 'followup_sent'
  | 'reply_received'
  | 'interest_detected'
  | 'unsubscribe_detected'
  | 'campaign_paused'
  | 'campaign_stopped'
  | 'test_email_sent'
  | 'campaign_deleted';

export interface OutreachStep {
  id: string;
  organizationId: string;
  campaignId: string;
  stepNumber: number;
  delayDays: number;
  subjectTemplate: string;
  bodyTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachCampaign {
  id: string;
  organizationId: string;
  name: string;
  status: CampaignStatus;
  targetLeadIds: string[];
  dailyLimit: number;
  steps?: OutreachStep[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalLeads: number;
    queued: number;
    sent: number;
    waiting: number;
    replied: number;
    interested: number;
    unsubscribed: number;
    bounced: number;
    failed: number;
  };
}

export interface OutreachQueueItem {
  id: string;
  organizationId: string;
  campaignId: string;
  stepId?: string;
  stepNumber: number;
  leadId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  status: QueueItemStatus;
  scheduledAt: string;
  sentAt?: string;
  messageId?: string;
  providerMessageId?: string;
  error?: string;
  attempts: number;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachMessage {
  id: string;
  organizationId: string;
  campaignId: string;
  leadId: string;
  queueId?: string;
  stepNumber: number;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  providerMessageId?: string;
  threadId?: string;
  status: 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED';
  sentAt: string;
  createdAt: string;
}

export interface OutreachReply {
  id: string;
  organizationId: string;
  campaignId: string;
  leadId: string;
  leadName?: string;
  companyName?: string;
  senderEmail: string;
  recipientEmail: string;
  subject?: string;
  snippet?: string;
  body?: string;
  classification: ReplyClassification;
  aiSummary?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  receivedAt: string;
  createdAt: string;
}

export interface OutreachEvent {
  id: string;
  organizationId: string;
  campaignId?: string;
  leadId?: string;
  eventType: OutreachEventType;
  details?: Record<string, any>;
  createdAt: string;
}

export interface OutreachActivityRow {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  recipientEmail: string;
  campaignName: string;
  stepNumber: number;
  subject: string;
  status: QueueItemStatus;
  sentAt?: string;
  nextFollowup?: string;
  lastReply?: string;
  interestStatus?: ReplyClassification | string;
}
