import { VoiceProvider, CreateCallParams, VoiceProviderResult, WebhookParseResult } from './VoiceProvider';
import { CallStatus, CallTranscriptItem } from '../../types';

export class VoiceProviderAdapter implements VoiceProvider {
  public name: string;

  constructor() {
    this.name = this.detectProviderName();
  }

  private detectProviderName(): string {
    if (process.env.EDESY_API_KEY?.trim()) return 'Edesy';
    if (process.env.BLAND_API_KEY?.trim()) return 'Bland AI';
    if (process.env.VAPI_API_KEY?.trim()) return 'Vapi AI';
    if (process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()) return 'Twilio Voice';
    if (process.env.ELEVENLABS_API_KEY?.trim()) return 'ElevenLabs Voice';
    if (process.env.VOICE_PROVIDER_API_KEY?.trim()) return 'Generic Voice Provider';
    return 'Edesy';
  }

  public isConfigured(): boolean {
    const key = process.env.EDESY_API_KEY?.trim() ||
                process.env.BLAND_API_KEY?.trim() ||
                process.env.VAPI_API_KEY?.trim() ||
                process.env.TWILIO_ACCOUNT_SID?.trim() ||
                process.env.ELEVENLABS_API_KEY?.trim() ||
                process.env.VOICE_PROVIDER_API_KEY?.trim();
    return Boolean(key);
  }

  public async createCall(params: CreateCallParams): Promise<VoiceProviderResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.'
      };
    }

    try {
      if (process.env.EDESY_API_KEY?.trim()) {
        const apiKey = process.env.EDESY_API_KEY.trim();
        const baseUrl = (process.env.EDESY_BASE_URL?.trim() || 'https://voice-agent.edesy.in/api/v1').replace(/\/$/, '');
        const taskPrompt = `You are ${params.agentName || 'Astra AI SDR'}, an AI Growth & Revenue Assistant calling on behalf of SalesPilot / GrowCurve.
RECIPIENT & CONTEXT:
- Lead Name: ${params.leadName || 'Prospect'}
- Company: ${params.company || 'Prospect Company'}
- Job Title: ${params.jobTitle || 'Decision Maker'}
- Company Context: ${params.companyContext || 'B2B enterprise prospect in active outreach campaign.'}
- Lead Context: ${params.leadContext || 'Target lead for automated SDR qualification.'}

OPENING MESSAGE:
"${params.openingMessage}"

PRIMARY CALL OBJECTIVE:
${params.callObjective}
${params.meetingBookingGoal ? 'If the recipient shows genuine interest, offer to schedule a brief 15-minute executive introduction and ask for their preferred day/time.' : 'Focus on answering their questions and qualifying their business needs.'}
`;
        const res = await fetch(`${baseUrl}/calls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-API-Key': apiKey
          },
          body: JSON.stringify({
            phone_number: params.phoneNumber,
            to: params.phoneNumber,
            from: params.fromNumber,
            caller_id: params.fromNumber,
            task: taskPrompt,
            callbackUrl: params.webhookUrl,
            webhook_url: params.webhookUrl,
            metadata: {
              callId: params.callId,
              leadId: params.leadId,
              organizationId: params.organizationId,
              source: 'LEAD_CALL'
            }
          })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.call_id || data.id || data.callId || data.data?.id)) {
          return {
            success: true,
            providerCallId: String(data.call_id || data.id || data.callId || data.data?.id),
            status: 'QUEUED',
            providerName: 'Edesy'
          };
        }
        return {
          success: false,
          error: data.message || data.error || `Edesy API rejected call initiation (HTTP ${res.status})`
        };
      }

      if (process.env.BLAND_API_KEY?.trim()) {
        const taskPrompt = `You are ${params.agentName || 'Astra AI SDR'}, an AI Growth & Revenue Assistant calling on behalf of SalesPilot / GrowCurve.

RECIPIENT & CONTEXT:
- Lead Name: ${params.leadName || 'Prospect'}
- Company: ${params.company || 'Prospect Company'}
- Job Title: ${params.jobTitle || 'Decision Maker'}
- Company Context: ${params.companyContext || 'B2B enterprise prospect in active outreach campaign.'}
- Lead Context: ${params.leadContext || 'Target lead for automated SDR qualification.'}

SALESPILOT OS CONTEXT:
SalesPilot is an AI Growth & Revenue OS helping teams automate B2B lead sourcing, intelligent research, multi-channel email outreach, and CRM workflow management.

OPENING MESSAGE:
"${params.openingMessage}"

PRIMARY CALL OBJECTIVE:
${params.callObjective}

MEETING BOOKING INSTRUCTION:
${params.meetingBookingGoal ? 'If the recipient shows genuine interest, offer to schedule a brief 15-minute executive introduction and ask for their preferred day/time.' : 'Focus on answering their questions and qualifying their business needs.'}

BEHAVIORAL RULES:
1. Truthfully identify yourself as an AI assistant from SalesPilot / GrowCurve.
2. Never claim an existing relationship or prior conversation that did not happen.
3. Never claim customer interest that has not been explicitly stated.
4. Do not state a meeting is booked unless the prospect explicitly agrees to a specific time.`;

        const response = await fetch('https://api.bland.ai/v1/calls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': process.env.BLAND_API_KEY.trim()
          },
          body: JSON.stringify({
            phone_number: params.phoneNumber,
            task: taskPrompt,
            model: 'enhanced',
            language: params.language || 'en-US',
            voice: params.voiceId || 'nat',
            max_duration: (params.maxDurationMinutes || 5) * 60,
            webhook: params.webhookUrl,
            metadata: {
              callId: params.callId,
              organizationId: params.organizationId
            }
          })
        });

        const data = await response.json();
        if (response.ok && data.call_id) {
          return {
            success: true,
            providerCallId: data.call_id,
            status: 'QUEUED',
            providerName: 'Bland AI'
          };
        } else {
          return {
            success: false,
            error: data.message || data.error || 'Voice provider rejected call request'
          };
        }
      }

      return {
        success: false,
        error: 'Voice provider not configured'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Voice provider network error'
      };
    }
  }

  public async getCallStatus(providerCallId: string): Promise<{ status: CallStatus; durationSeconds?: number; error?: string }> {
    if (!this.isConfigured()) {
      return { status: 'FAILED', error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.' };
    }

    try {
      if (process.env.EDESY_API_KEY?.trim()) {
        const apiKey = process.env.EDESY_API_KEY.trim();
        const baseUrl = (process.env.EDESY_BASE_URL?.trim() || 'https://voice-agent.edesy.in/api/v1').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/calls/${providerCallId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'X-API-Key': apiKey }
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data) {
          const rawStatus = (data.status || '').toLowerCase().replace(/[-_]/g, '');
          let status: CallStatus = 'IN_PROGRESS';
          if (['completed', 'ended', 'done', 'finished'].includes(rawStatus)) status = 'COMPLETED';
          else if (['failed', 'error', 'rejected'].includes(rawStatus)) status = 'FAILED';
          else if (['noanswer', 'unanswered', 'timeout'].includes(rawStatus)) status = 'NO_ANSWER';
          else if (['busy'].includes(rawStatus)) status = 'BUSY';
          else if (['ringing'].includes(rawStatus)) status = 'RINGING';
          else if (['queued', 'initiated', 'scheduled', 'created'].includes(rawStatus)) status = 'QUEUED';
          else if (['cancelled', 'canceled', 'stopped'].includes(rawStatus)) status = 'CANCELLED';
          const dur = typeof data.duration === 'number' ? data.duration : (typeof data.duration_seconds === 'number' ? data.duration_seconds : 0);
          return { status, durationSeconds: Math.max(0, Math.round(dur)) };
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
          return { status, durationSeconds: Number(data.corrected_duration || data.duration || 0) };
        }
      }
      return { status: 'IN_PROGRESS' };
    } catch (err: any) {
      return { status: 'FAILED', error: err.message };
    }
  }

  public async endCall(providerCallId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.' };
    }

    try {
      if (process.env.EDESY_API_KEY?.trim()) {
        const apiKey = process.env.EDESY_API_KEY.trim();
        const baseUrl = (process.env.EDESY_BASE_URL?.trim() || 'https://voice-agent.edesy.in/api/v1').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/calls/${providerCallId}/cancel`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        });
        if (res.ok) return { success: true };
        const resStop = await fetch(`${baseUrl}/calls/${providerCallId}/stop`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        });
        return { success: resStop.ok };
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

  public async getTranscript(providerCallId: string): Promise<{ transcript: CallTranscriptItem[] }> {
    if (!this.isConfigured() || !process.env.BLAND_API_KEY?.trim()) {
      return { transcript: [] };
    }

    try {
      const res = await fetch(`https://api.bland.ai/v1/calls/${providerCallId}`, {
        headers: { authorization: process.env.BLAND_API_KEY.trim() }
      });
      const data = await res.json();
      if (res.ok && data?.transcripts && Array.isArray(data.transcripts)) {
        const transcript: CallTranscriptItem[] = data.transcripts.map((t: any) => ({
          speaker: t.user === 'user' ? 'customer' : 'agent',
          text: t.text || t.message || '',
          timestamp: t.created_at || new Date().toISOString()
        }));
        return { transcript };
      }
      return { transcript: [] };
    } catch (err) {
      return { transcript: [] };
    }
  }

  public async getRecording(providerCallId: string): Promise<{ recordingUrl?: string }> {
    if (!this.isConfigured() || !process.env.BLAND_API_KEY?.trim()) {
      return { recordingUrl: undefined };
    }

    try {
      const res = await fetch(`https://api.bland.ai/v1/calls/${providerCallId}`, {
        headers: { authorization: process.env.BLAND_API_KEY.trim() }
      });
      const data = await res.json();
      return { recordingUrl: data?.recording_url || undefined };
    } catch (err) {
      return { recordingUrl: undefined };
    }
  }

  public async handleWebhook(payload: any, headers: Record<string, any>): Promise<WebhookParseResult> {
    if (!payload) {
      return { error: 'Empty webhook payload' };
    }

    // Secret Verification if EDESY_WEBHOOK_SECRET or BLAND_WEBHOOK_SECRET is set
    const expectedSecret = process.env.EDESY_WEBHOOK_SECRET?.trim() || process.env.BLAND_WEBHOOK_SECRET?.trim() || process.env.VOICE_WEBHOOK_SECRET?.trim();
    if (expectedSecret) {
      const authHeader = headers['authorization'] || headers['x-webhook-secret'] || headers['x-edesy-secret'] || headers['x-edesy-signature'] || headers['x-bland-secret'];
      const secretQuery = payload?.secret;
      const bearerSecret = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader;
      if (authHeader !== expectedSecret && bearerSecret !== expectedSecret && secretQuery !== expectedSecret) {
        return { error: 'Webhook signature/secret verification failed' };
      }
    }

    const providerCallId = payload.call_id || payload.id || payload.providerCallId;
    if (!providerCallId) {
      return { error: 'Missing providerCallId in webhook payload' };
    }

    const rawStatus = (payload.status || payload.event || '').toLowerCase();
    let status: CallStatus = 'IN_PROGRESS';
    if (['completed', 'ended', 'finished'].includes(rawStatus)) status = 'COMPLETED';
    else if (['no-answer', 'no_answer', 'unanswered'].includes(rawStatus)) status = 'NO_ANSWER';
    else if (['busy'].includes(rawStatus)) status = 'BUSY';
    else if (['failed', 'error', 'canceled'].includes(rawStatus)) status = 'FAILED';
    else if (['ringing'].includes(rawStatus)) status = 'RINGING';
    else if (['queued', 'initiated'].includes(rawStatus)) status = 'QUEUED';
    else if (['in-progress', 'in_progress', 'connected', 'answered'].includes(rawStatus)) status = 'IN_PROGRESS';

    const durationSeconds = Number(payload.corrected_duration || payload.duration || payload.call_duration || 0);
    const recordingUrl = payload.recording_url || payload.recordingUrl || undefined;
    const summary = payload.summary || payload.transcript_summary || undefined;

    let transcript: CallTranscriptItem[] = [];
    if (Array.isArray(payload.transcript)) {
      transcript = payload.transcript.map((item: any) => ({
        speaker: item.user === 'user' || item.speaker === 'user' || item.speaker === 'customer' ? 'customer' : 'agent',
        text: item.text || item.content || item.message || '',
        timestamp: item.timestamp || item.created_at || new Date().toISOString()
      }));
    } else if (Array.isArray(payload.transcripts)) {
      transcript = payload.transcripts.map((item: any) => ({
        speaker: item.user === 'user' || item.speaker === 'user' || item.speaker === 'customer' ? 'customer' : 'agent',
        text: item.text || item.message || '',
        timestamp: item.created_at || new Date().toISOString()
      }));
    } else if (typeof payload.concatenated_transcript === 'string' && payload.concatenated_transcript.trim()) {
      transcript = [{
        speaker: 'agent',
        text: payload.concatenated_transcript,
        timestamp: new Date().toISOString()
      }];
    }

    // Categorize conversation outcome based on summary/transcript if present
    let outcome = payload.outcome;
    if (!outcome && summary) {
      const summaryLower = summary.toLowerCase();
      if (summaryLower.includes('meeting') || summaryLower.includes('demo') || summaryLower.includes('schedule')) {
        outcome = 'MEETING_REQUESTED';
      } else if (summaryLower.includes('interested') || summaryLower.includes('send info')) {
        outcome = 'INTERESTED';
      } else if (summaryLower.includes('not interested') || summaryLower.includes('decline') || summaryLower.includes('remove')) {
        outcome = 'NOT_INTERESTED';
      } else if (summaryLower.includes('call back') || summaryLower.includes('later')) {
        outcome = 'CALLBACK_REQUESTED';
      }
    }

    return {
      providerCallId,
      status,
      durationSeconds,
      recordingUrl,
      summary,
      transcript,
      outcome,
      rawPayload: payload
    };
  }
}
