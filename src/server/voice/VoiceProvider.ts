import { CallTranscriptItem, CallStatus } from '../../types';

export interface CreateCallParams {
  callId: string;
  organizationId: string;
  phoneNumber: string;
  fromNumber?: string;
  leadId?: string;
  leadName?: string;
  company?: string;
  jobTitle?: string;
  agentName: string;
  openingMessage: string;
  callObjective: string;
  companyContext?: string;
  leadContext?: string;
  maxDurationMinutes?: number;
  language?: string;
  voiceId?: string;
  meetingBookingGoal?: boolean;
  webhookUrl?: string;
}

export interface VoiceProviderResult {
  success: boolean;
  providerCallId?: string;
  status?: CallStatus;
  providerName?: string;
  error?: string;
}

export interface WebhookParseResult {
  providerCallId?: string;
  status?: CallStatus;
  durationSeconds?: number;
  transcript?: CallTranscriptItem[];
  recordingUrl?: string;
  summary?: string;
  outcome?: string;
  rawPayload?: any;
  error?: string;
}

export interface VoiceProvider {
  name: string;
  isConfigured(): boolean;
  createCall(params: CreateCallParams): Promise<VoiceProviderResult>;
  getCallStatus(providerCallId: string): Promise<{ status: CallStatus; durationSeconds?: number; error?: string }>;
  endCall(providerCallId: string): Promise<{ success: boolean; error?: string }>;
  getTranscript(providerCallId: string): Promise<{ transcript: CallTranscriptItem[] }>;
  getRecording(providerCallId: string): Promise<{ recordingUrl?: string }>;
  handleWebhook(payload: any, headers: Record<string, any>): Promise<WebhookParseResult>;
}
