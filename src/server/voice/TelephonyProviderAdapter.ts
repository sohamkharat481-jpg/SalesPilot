import { TelephonyProvider, TelephonyInitiateCallParams, TelephonyCallResult } from './TelephonyProvider';
import { CallStatus } from '../../types';
import { EdesyProvider } from '../../backend/providers/edesyProvider';

export class TelephonyProviderAdapter implements TelephonyProvider {
  public name: string;
  private delegateProvider: TelephonyProvider | null = null;
  private edesyProvider: EdesyProvider;

  constructor() {
    this.edesyProvider = new EdesyProvider();
    this.name = this.detectProviderName();
  }

  public setDelegateProvider(provider: TelephonyProvider | null) {
    this.delegateProvider = provider;
    this.name = provider ? provider.name : this.detectProviderName();
  }

  private detectProviderName(): string {
    if (process.env.EDESY_API_KEY?.trim()) {
      return 'Edesy';
    }
    if (process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()) {
      return 'Twilio Voice';
    }
    if (process.env.BLAND_API_KEY?.trim()) {
      return 'Bland AI Telephony';
    }
    if (process.env.VAPI_API_KEY?.trim()) {
      return 'Vapi Telephony';
    }
    if (process.env.TELEPHONY_PROVIDER_API_KEY?.trim()) {
      return 'Generic Telephony Provider';
    }
    return 'Edesy';
  }

  public isConfigured(): boolean {
    if (this.delegateProvider) {
      return this.delegateProvider.isConfigured();
    }
    return (
      this.edesyProvider.isConfigured() ||
      Boolean(
        (process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()) ||
        process.env.BLAND_API_KEY?.trim() ||
        process.env.VAPI_API_KEY?.trim() ||
        process.env.TELEPHONY_PROVIDER_API_KEY?.trim()
      )
    );
  }

  public async initiateCall(params: TelephonyInitiateCallParams): Promise<TelephonyCallResult> {
    if (this.delegateProvider) {
      return this.delegateProvider.initiateCall(params);
    }

    if (this.edesyProvider.isConfigured()) {
      return this.edesyProvider.initiateCall(params);
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.'
      };
    }

    try {
      // 1. Twilio Voice Support
      if (process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID.trim();
        const authToken = process.env.TWILIO_AUTH_TOKEN.trim();
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;

        const formBody = new URLSearchParams({
          To: params.destinationNumber,
          From: params.callerId,
          Url: params.webhookUrl || 'https://salespilot.co/twiml/outbound-connect',
          StatusCallback: params.webhookUrl || '',
          StatusCallbackEvent: 'initiated ringing answered completed'
        });

        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
          },
          body: formBody.toString()
        });

        const data = await response.json();
        if (response.ok && data.sid) {
          return {
            success: true,
            providerCallId: data.sid,
            status: 'QUEUED',
            providerName: 'Twilio Voice'
          };
        } else {
          return {
            success: false,
            error: data.message || 'Telephony provider rejected call initiation.'
          };
        }
      }

      // 2. Bland AI Telephony Support
      if (process.env.BLAND_API_KEY?.trim()) {
        const response = await fetch('https://api.bland.ai/v1/calls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': process.env.BLAND_API_KEY.trim()
          },
          body: JSON.stringify({
            phone_number: params.destinationNumber,
            from: params.callerId,
            task: `Direct dial phone conversation with ${params.contactName || 'client'}. Context: ${params.notes || 'SalesPilot outbound call.'}`,
            webhook: params.webhookUrl,
            metadata: {
              callId: params.callId,
              organizationId: params.organizationId,
              userId: params.userId,
              source: 'DIRECT_DIAL'
            }
          })
        });

        const data = await response.json();
        if (response.ok && data.call_id) {
          return {
            success: true,
            providerCallId: data.call_id,
            status: 'QUEUED',
            providerName: 'Bland AI Telephony'
          };
        } else {
          return {
            success: false,
            error: data.message || data.error || 'Telephony provider rejected call initiation.'
          };
        }
      }

      return {
        success: false,
        error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Telephony network communication error.'
      };
    }
  }

  public async cancelCall(providerCallId: string): Promise<{ success: boolean; error?: string }> {
    if (this.delegateProvider) {
      return this.delegateProvider.cancelCall(providerCallId);
    }

    if (this.edesyProvider.isConfigured()) {
      return this.edesyProvider.cancelCall(providerCallId);
    }

    if (!this.isConfigured()) {
      return { success: false, error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.' };
    }

    try {
      if (process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID.trim();
        const authToken = process.env.TWILIO_AUTH_TOKEN.trim();
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${providerCallId}.json`;

        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
          },
          body: new URLSearchParams({ Status: 'canceled' }).toString()
        });

        return { success: response.ok };
      }

      if (process.env.BLAND_API_KEY?.trim()) {
        const res = await fetch(`https://api.bland.ai/v1/calls/${providerCallId}/stop`, {
          method: 'POST',
          headers: { authorization: process.env.BLAND_API_KEY.trim() }
        });
        const data = await res.json();
        return { success: res.ok, error: data.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async getCallStatus(providerCallId: string): Promise<{ status: CallStatus; durationSeconds?: number; recordingUrl?: string; transcript?: string; summary?: string; error?: string }> {
    if (this.delegateProvider) {
      return this.delegateProvider.getCallStatus(providerCallId);
    }

    if (this.edesyProvider.isConfigured()) {
      return this.edesyProvider.getCallStatus(providerCallId);
    }

    if (!this.isConfigured()) {
      return { status: 'FAILED', error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.' };
    }

    try {
      if (process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID.trim();
        const authToken = process.env.TWILIO_AUTH_TOKEN.trim();
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${providerCallId}.json`;

        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const res = await fetch(twilioUrl, { headers: { 'Authorization': authHeader } });
        const data = await res.json();

        if (res.ok && data) {
          const raw = (data.status || '').toLowerCase();
          let status: CallStatus = 'IN_PROGRESS';
          if (raw === 'queued') status = 'QUEUED';
          else if (['ringing', 'initiated'].includes(raw)) status = 'RINGING';
          else if (raw === 'in-progress') status = 'IN_PROGRESS';
          else if (raw === 'completed') status = 'COMPLETED';
          else if (['failed', 'canceled'].includes(raw)) status = 'FAILED';
          else if (raw === 'busy') status = 'BUSY';
          else if (raw === 'no-answer') status = 'NO_ANSWER';
          return { status, durationSeconds: Number(data.duration || 0) };
        }
      }

      if (process.env.BLAND_API_KEY?.trim()) {
        const res = await fetch(`https://api.bland.ai/v1/calls/${providerCallId}`, {
          headers: { authorization: process.env.BLAND_API_KEY.trim() }
        });
        const data = await res.json();
        if (res.ok && data) {
          const rawStatus = (data.status || '').toLowerCase();
          let status: CallStatus = 'IN_PROGRESS';
          if (['completed', 'ended'].includes(rawStatus)) status = 'COMPLETED';
          else if (['failed', 'error'].includes(rawStatus)) status = 'FAILED';
          else if (['no-answer', 'no_answer'].includes(rawStatus)) status = 'NO_ANSWER';
          else if (['busy'].includes(rawStatus)) status = 'BUSY';
          else if (['queued'].includes(rawStatus)) status = 'QUEUED';
          else if (['ringing'].includes(rawStatus)) status = 'RINGING';
          return { status, durationSeconds: Number(data.corrected_duration || data.duration || 0) };
        }
      }

      return { status: 'IN_PROGRESS' };
    } catch (err: any) {
      return { status: 'FAILED', error: err.message };
    }
  }
}
