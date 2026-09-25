import { CallStatus } from '../../types';

export interface TelephonyInitiateCallParams {
  callId: string;
  organizationId: string;
  userId: string;
  destinationNumber: string;
  callerId: string;
  contactName?: string;
  companyName?: string;
  notes?: string;
  webhookUrl?: string;
}

export interface TelephonyCallResult {
  success: boolean;
  providerCallId?: string;
  status?: CallStatus;
  providerName?: string;
  error?: string;
}

export interface TelephonyProvider {
  name: string;
  isConfigured(): boolean;
  initiateCall(params: TelephonyInitiateCallParams): Promise<TelephonyCallResult>;
  cancelCall(providerCallId: string): Promise<{ success: boolean; error?: string }>;
  getCallStatus(providerCallId: string): Promise<{ status: CallStatus; durationSeconds?: number; error?: string }>;
}
