export type CallStatus = 
  | 'QUEUED'
  | 'DIALING'
  | 'RINGING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NO_ANSWER'
  | 'BUSY'
  | 'FAILED'
  | 'CANCELLED';

export type CallOutcome = 
  | 'INTERESTED'
  | 'MEETING_REQUESTED'
  | 'NOT_INTERESTED'
  | 'NO_ANSWER'
  | 'BUSY'
  | 'FAILED'
  | 'VOICEMAIL'
  | 'WRONG_NUMBER'
  | 'CALLBACK_REQUESTED'
  | 'PENDING';

export interface CallTranscriptItem {
  speaker: 'agent' | 'customer' | 'system';
  text: string;
  timestamp: string;
}

export interface VoiceCallRecord {
  id: string; // callId
  organizationId: string;
  leadId: string;
  leadName?: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  website?: string;
  phoneNumber: string;
  status: CallStatus;
  startedAt?: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  providerCallId?: string;
  providerName?: string;
  outcome?: CallOutcome;
  transcript?: CallTranscriptItem[];
  summary?: string;
  recordingUrl?: string;
  agentName?: string;
  openingMessage?: string;
  callObjective?: string;
  companyContext?: string;
  leadContext?: string;
  maxDurationMinutes?: number;
  language?: string;
  voiceId?: string;
  meetingBookingGoal?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceCallEvent {
  id: string;
  organizationId: string;
  callId: string;
  fromStatus?: CallStatus;
  toStatus: CallStatus;
  details?: string | Record<string, any>;
  createdAt: string;
}

export interface VoiceCallConfig {
  leadId: string;
  agentName: string;
  openingMessage: string;
  callObjective: string;
  companyContext?: string;
  leadContext?: string;
  maxDurationMinutes?: number;
  language?: string;
  voiceId?: string;
  meetingBookingGoal?: boolean;
}

export interface VoiceProviderConfig {
  configured: boolean;
  providerName?: string;
  webhookUrl?: string;
  supportedVoices?: { id: string; name: string; gender?: string; language?: string }[];
}

export type ManualCallOutcome =
  | 'Connected'
  | 'No Answer'
  | 'Busy'
  | 'Call Back Later'
  | 'Not Interested'
  | 'Interested'
  | 'Meeting Requested';

export interface CallingNumber {
  id: string;
  userId: string;
  organizationId: string;
  phoneNumber: string; // E.164 format (e.g., +917498630805)
  countryCode: string; // (e.g., +91)
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManualCallAuditEntry {
  timestamp: string;
  action: 'INITIATED' | 'OUTCOME_UPDATED' | 'NOTES_UPDATED';
  actorId?: string;
  actorName?: string;
  details?: string;
}

export interface ManualCallActivity {
  id: string;
  leadId: string;
  organizationId: string;
  userId?: string;
  callingNumberId?: string;
  callingNumber?: string; // safe historical snapshot of user's calling number
  phoneNumber: string; // Target lead's phone number
  direction: 'OUTBOUND';
  activityType: 'PHONE_CALL';
  status: 'INITIATED_FROM_SALES_PILOT' | 'COMPLETED';
  outcome?: ManualCallOutcome;
  notes?: string;
  auditHistory?: ManualCallAuditEntry[];
  createdAt: string;
  updatedAt?: string;
}

