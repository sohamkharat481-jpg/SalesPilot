import { TelephonyProvider, TelephonyInitiateCallParams, TelephonyCallResult } from '../../server/voice/TelephonyProvider';
import { CallStatus } from '../../types';

export function mapEdesyStatus(status?: string): CallStatus {
  if (!status) return 'QUEUED';
  const s = String(status).toLowerCase().trim().replace(/[-_]/g, '');
  if (['queued', 'initiated', 'scheduled', 'created', 'pending'].includes(s)) return 'QUEUED';
  if (['dialing', 'calling'].includes(s)) return 'DIALING';
  if (['ringing'].includes(s)) return 'RINGING';
  if (['inprogress', 'ongoing', 'answered', 'connected', 'active'].includes(s)) return 'IN_PROGRESS';
  if (['completed', 'ended', 'done', 'finished', 'success'].includes(s)) return 'COMPLETED';
  if (['busy'].includes(s)) return 'BUSY';
  if (['noanswer', 'unanswered', 'timeout', 'missed'].includes(s)) return 'NO_ANSWER';
  if (['failed', 'error', 'rejected'].includes(s)) return 'FAILED';
  if (['cancelled', 'canceled', 'stopped', 'terminated'].includes(s)) return 'CANCELLED';
  return 'IN_PROGRESS';
}

export class EdesyProvider implements TelephonyProvider {
  public name: string = 'Edesy';

  public isConfigured(): boolean {
    return Boolean(process.env.EDESY_API_KEY?.trim());
  }

  public getBaseUrl(): string {
    return (process.env.EDESY_BASE_URL?.trim() || 'https://voice-agent.edesy.in/api/v1').replace(/\/$/, '');
  }

  public async initiateCall(params: TelephonyInitiateCallParams): Promise<TelephonyCallResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.'
      };
    }

    const apiKey = process.env.EDESY_API_KEY!.trim();
    const baseUrl = this.getBaseUrl();
    const endpoint = `${baseUrl}/calls`;

    try {
      const payload: Record<string, any> = {
        phone_number: params.destinationNumber,
        to: params.destinationNumber,
        from: params.callerId,
        caller_id: params.callerId,
        task: params.notes || `Outbound phone call from SalesPilot to ${params.contactName || 'Contact'}${params.companyName ? ` at ${params.companyName}` : ''}.`,
        prompt: params.notes || `Outbound direct call from SalesPilot to ${params.contactName || 'Contact'}.`,
        metadata: {
          callId: params.callId,
          organizationId: params.organizationId,
          userId: params.userId,
          contactName: params.contactName,
          companyName: params.companyName,
          source: 'DIRECT_DIAL'
        }
      };

      if (params.webhookUrl) {
        payload.callbackUrl = params.webhookUrl;
        payload.webhook_url = params.webhookUrl;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && (data.id || data.call_id || data.callId || data.data?.id)) {
        const providerCallId = String(data.id || data.call_id || data.callId || data.data?.id);
        const mappedStatus = mapEdesyStatus(data.status || 'queued');
        return {
          success: true,
          providerCallId,
          status: mappedStatus,
          providerName: 'Edesy'
        };
      }

      return {
        success: false,
        error: data.message || data.error || `Edesy API rejected call initiation (HTTP ${response.status})`
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error communicating with Edesy Voice API'
      };
    }
  }

  public async cancelCall(providerCallId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.'
      };
    }

    const apiKey = process.env.EDESY_API_KEY!.trim();
    const baseUrl = this.getBaseUrl();

    try {
      // 1. Try POST /calls/{id}/cancel
      const resCancel = await fetch(`${baseUrl}/calls/${providerCallId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (resCancel.ok) {
        return { success: true };
      }

      // 2. Fallback to POST /calls/{id}/stop
      const resStop = await fetch(`${baseUrl}/calls/${providerCallId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (resStop.ok) {
        return { success: true };
      }

      const data = await resCancel.json().catch(() => ({}));
      return {
        success: false,
        error: data.message || data.error || `Failed to cancel call with Edesy (HTTP ${resCancel.status})`
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async getCallStatus(providerCallId: string): Promise<{
    status: CallStatus;
    durationSeconds?: number;
    recordingUrl?: string;
    transcript?: string;
    summary?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        status: 'FAILED',
        error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.'
      };
    }

    const apiKey = process.env.EDESY_API_KEY!.trim();
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/calls/${providerCallId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          status: 'FAILED',
          error: data.message || data.error || `HTTP ${response.status} from Edesy`
        };
      }

      const status = mapEdesyStatus(data.status);
      const result: {
        status: CallStatus;
        durationSeconds?: number;
        recordingUrl?: string;
        transcript?: string;
        summary?: string;
      } = { status };

      // Strictly persist duration only when provided
      const rawDuration = data.duration !== undefined ? data.duration : (data.duration_seconds !== undefined ? data.duration_seconds : data.corrected_duration);
      if (typeof rawDuration === 'number' && !isNaN(rawDuration)) {
        result.durationSeconds = Math.max(0, Math.round(rawDuration));
      }

      // Persist real recording only when provided
      const rec = data.recording_url || data.recordingUrl || data.recording;
      if (typeof rec === 'string' && rec.trim()) {
        result.recordingUrl = rec.trim();
      }

      // Persist real transcript only when provided
      const tr = data.transcript || data.call_transcript;
      if (typeof tr === 'string' && tr.trim()) {
        result.transcript = tr.trim();
      }

      // Persist real summary only when provided
      const sum = data.summary;
      if (typeof sum === 'string' && sum.trim()) {
        result.summary = sum.trim();
      }

      return result;
    } catch (err: any) {
      return {
        status: 'FAILED',
        error: err.message
      };
    }
  }
}
