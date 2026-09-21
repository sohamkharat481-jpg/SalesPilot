import { GoogleGenAI } from '@google/genai';
import { 
  OutreachCampaign, 
  OutreachStep, 
  OutreachQueueItem, 
  OutreachMessage, 
  OutreachReply, 
  OutreachEvent, 
  ReplyClassification,
  QueueItemStatus 
} from '../types/outreach';
import { Lead } from '../types';

export interface OutreachWorkerContext {
  getCampaignById: (campaignId: string, orgId: string) => Promise<OutreachCampaign | null>;
  getStepsByCampaign: (campaignId: string, orgId: string) => Promise<OutreachStep[]>;
  getLeadById: (leadId: string, orgId: string) => Promise<Lead | null>;
  getQueueItemsToProcess: (limit?: number) => Promise<OutreachQueueItem[]>;
  claimQueueItem: (id: string, orgId: string, staleTimeoutMs?: number) => Promise<OutreachQueueItem | null>;
  updateQueueItem: (id: string, updates: Partial<OutreachQueueItem>, orgId: string) => Promise<boolean>;
  saveMessage: (msg: OutreachMessage) => Promise<void>;
  saveReply: (reply: OutreachReply) => Promise<void>;
  cancelPendingQueueItemsForLead: (leadId: string, campaignId: string, orgId: string, reason: string) => Promise<number>;
  logEvent: (event: OutreachEvent) => Promise<void>;
  getGmailAccount: (orgId: string, senderEmail?: string) => Promise<any>;
  sendGmailMessage: (account: any, recipientEmail: string, subject: string, body: string) => Promise<{ providerMessageId: string; threadId: string }>;
  sendOwnerNotificationEmail: (ownerEmail: string, subject: string, htmlBody: string) => Promise<boolean>;
  saveInAppNotification: (orgId: string, title: string, message: string, meta?: any) => Promise<void>;
  updateLeadStatus?: (leadId: string, status: string, orgId: string) => Promise<boolean>;
}

export class OutreachWorker {
  public context: OutreachWorkerContext;
  private aiClient: GoogleGenAI | null = null;

  constructor(context: OutreachWorkerContext) {
    this.context = context;
    if (process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  public setContext(context: OutreachWorkerContext): void {
    this.context = context;
  }

  /**
   * Safely substitute personalization variables in outreach template
   */
  public substituteVariables(template: string, lead: Lead): string {
    if (!template) return '';
    const firstName = lead.firstName || (lead.name ? lead.name.split(' ')[0] : '');
    const lastName = lead.lastName || (lead.name && lead.name.includes(' ') ? lead.name.split(' ').slice(1).join(' ') : '');
    const company = lead.company || lead.companyName || '';
    const jobTitle = lead.title || (lead as any).jobTitle || '';
    const industry = lead.industry || '';

    return template
      .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
      .replace(/\{\{\s*last_name\s*\}\}/gi, lastName)
      .replace(/\{\{\s*company\s*\}\}/gi, company)
      .replace(/\{\{\s*job_title\s*\}\}/gi, jobTitle)
      .replace(/\{\{\s*industry\s*\}\}/gi, industry);
  }

  /**
   * Process pending items in the durable outreach queue
   */
  public async processQueue(batchLimit: number = 20): Promise<{ processed: number; sent: number; failed: number; cancelled: number }> {
    let processed = 0;
    let sent = 0;
    let failed = 0;
    let cancelled = 0;

    try {
      const pendingItems = await this.context.getQueueItemsToProcess(batchLimit);
      if (!pendingItems || pendingItems.length === 0) {
        return { processed: 0, sent: 0, failed: 0, cancelled: 0 };
      }

      for (const item of pendingItems) {
        // 1. Atomically claim queue item
        const claimed = await this.context.claimQueueItem(item.id, item.organizationId, 180000); // 3 min lock
        if (!claimed) continue;

        processed++;

        // 2. Verify campaign status
        const campaign = await this.context.getCampaignById(claimed.campaignId, claimed.organizationId);
        if (!campaign || campaign.status !== 'ACTIVE') {
          await this.context.updateQueueItem(claimed.id, { status: 'CANCELLED', error: 'Campaign is not active' }, claimed.organizationId);
          cancelled++;
          continue;
        }

        // 3. Verify lead eligibility & tenant isolation
        const lead = await this.context.getLeadById(claimed.leadId, claimed.organizationId);
        if (!lead || lead.organizationId !== claimed.organizationId) {
          await this.context.updateQueueItem(claimed.id, { status: 'CANCELLED', error: 'Lead not found or tenant mismatch' }, claimed.organizationId);
          cancelled++;
          continue;
        }

        const leadStatus = (lead.status || '').toUpperCase();
        const leadTags = Array.isArray(lead.tags) ? lead.tags.map(t => t.toUpperCase()) : [];

        // Suppression & Eligibility checks
        if (
          leadStatus === 'UNSUBSCRIBED' || 
          leadStatus === 'SUPPRESSED' || 
          leadStatus === 'BOUNCED' || 
          leadStatus === 'NOT_INTERESTED' ||
          leadStatus === 'CONVERTED' ||
          leadTags.includes('UNSUBSCRIBED') ||
          leadTags.includes('SUPPRESSED') ||
          leadTags.includes('BOUNCED')
        ) {
          await this.context.updateQueueItem(claimed.id, { status: 'UNSUBSCRIBED', error: `Lead ineligible (Status: ${leadStatus})` }, claimed.organizationId);
          cancelled++;
          await this.context.logEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            organizationId: claimed.organizationId,
            campaignId: claimed.campaignId,
            leadId: claimed.leadId,
            eventType: 'unsubscribe_detected',
            details: { reason: `Lead status ${leadStatus}`, itemQueueId: claimed.id },
            createdAt: new Date().toISOString()
          });
          continue;
        }

        // 4. Retrieve connected Gmail account for sender
        const gmailAcc = await this.context.getGmailAccount(claimed.organizationId);
        if (!gmailAcc) {
          await this.context.updateQueueItem(claimed.id, { 
            status: 'FAILED', 
            error: 'No authorized Gmail account connected to organization.',
            attempts: (claimed.attempts || 0) + 1
          }, claimed.organizationId);
          failed++;
          continue;
        }

        // 5. Render Subject & Body templates safely
        const renderedSubject = this.substituteVariables(claimed.subject, lead);
        const renderedBody = this.substituteVariables(claimed.body, lead);

        // 6. Execute Gmail Send
        try {
          const sendResult = await this.context.sendGmailMessage(
            gmailAcc, 
            claimed.recipientEmail, 
            renderedSubject, 
            renderedBody
          );

          const sentAt = new Date().toISOString();

          // Mark Queue Item SENT
          await this.context.updateQueueItem(claimed.id, {
            status: 'SENT',
            sentAt,
            providerMessageId: sendResult.providerMessageId,
            error: undefined
          }, claimed.organizationId);

          // Record Sent Outreach Message
          const msgRecord: OutreachMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            organizationId: claimed.organizationId,
            campaignId: claimed.campaignId,
            leadId: claimed.leadId,
            queueId: claimed.id,
            stepNumber: claimed.stepNumber,
            senderEmail: gmailAcc.email || 'sohamkharat481@gmail.com',
            recipientEmail: claimed.recipientEmail,
            subject: renderedSubject,
            body: renderedBody,
            providerMessageId: sendResult.providerMessageId,
            threadId: sendResult.threadId,
            status: 'SENT',
            sentAt,
            createdAt: sentAt
          };

          await this.context.saveMessage(msgRecord);

          // Audit Event
          await this.context.logEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            organizationId: claimed.organizationId,
            campaignId: claimed.campaignId,
            leadId: claimed.leadId,
            eventType: 'email_sent',
            details: { stepNumber: claimed.stepNumber, providerMessageId: sendResult.providerMessageId },
            createdAt: sentAt
          });

          sent++;

          // 7. Schedule Next Sequence Step if available
          const steps = await this.context.getStepsByCampaign(claimed.campaignId, claimed.organizationId);
          const nextStep = steps.find(s => s.stepNumber === claimed.stepNumber + 1);

          if (nextStep) {
            const delayMs = (nextStep.delayDays || 1) * 24 * 60 * 60 * 1000;
            const scheduledAt = new Date(Date.now() + delayMs).toISOString();

            const nextQueueItem: OutreachQueueItem = {
              id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              organizationId: claimed.organizationId,
              campaignId: claimed.campaignId,
              stepId: nextStep.id,
              stepNumber: nextStep.stepNumber,
              leadId: claimed.leadId,
              recipientEmail: claimed.recipientEmail,
              recipientName: lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
              subject: nextStep.subjectTemplate,
              body: nextStep.bodyTemplate,
              status: 'WAITING',
              scheduledAt,
              attempts: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Queue next item
            await this.context.updateQueueItem(nextQueueItem.id, nextQueueItem, claimed.organizationId);

            await this.context.logEvent({
              id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              organizationId: claimed.organizationId,
              campaignId: claimed.campaignId,
              leadId: claimed.leadId,
              eventType: 'followup_scheduled',
              details: { nextStepNumber: nextStep.stepNumber, scheduledAt },
              createdAt: new Date().toISOString()
            });
          }

        } catch (sendErr: any) {
          console.error(`[OUTREACH WORKER SEND ERROR] Item ${claimed.id}:`, sendErr);
          const errMsg = sendErr.message || String(sendErr);

          await this.context.updateQueueItem(claimed.id, {
            status: 'FAILED',
            error: errMsg,
            attempts: (claimed.attempts || 0) + 1
          }, claimed.organizationId);

          await this.context.logEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            organizationId: claimed.organizationId,
            campaignId: claimed.campaignId,
            leadId: claimed.leadId,
            eventType: 'email_failed',
            details: { error: errMsg, stepNumber: claimed.stepNumber },
            createdAt: new Date().toISOString()
          });

          failed++;
        }
      }

    } catch (err) {
      console.error('[OUTREACH WORKER QUEUE PROCESSOR ERROR]', err);
    }

    return { processed, sent, failed, cancelled };
  }

  /**
   * AI Reply Classification using Gemini
   */
  public async classifyReplyText(replyText: string, subject?: string): Promise<{ classification: ReplyClassification; summary: string }> {
    if (!replyText) {
      return { classification: 'UNCLEAR', summary: 'Empty reply content' };
    }

    if (this.aiClient) {
      try {
        const prompt = `You are an expert sales reply analyzer for SalesPilot B2B CRM.
Analyze the following email reply received from a prospect in response to an outreach campaign:

Subject: ${subject || 'Outreach'}
Body:
${replyText}

Classify the intent into EXACTLY ONE of the following tags:
- INTERESTED: Prospect wants to learn more, pricing, demo, or continue discussion.
- MEETING_REQUEST: Prospect asks for a calendar link, meeting, call, or time slot.
- NEEDS_MORE_INFO: Prospect asks specific questions about product capabilities or details.
- NOT_INTERESTED: Prospect declines, says no thanks, or expresses no interest.
- UNSUBSCRIBE: Prospect explicitly asks to unsubscribe, stop emailing, or remove from list.
- OUT_OF_OFFICE: Automatic auto-responder or OOO message.
- UNCLEAR: Ambiguous reply or cannot determine clear intent.

CRITICAL RULE: Never treat uncertainty as interest.

Return JSON strictly in this format:
{
  "classification": "INTERESTED" | "MEETING_REQUEST" | "NEEDS_MORE_INFO" | "NOT_INTERESTED" | "UNSUBSCRIBE" | "OUT_OF_OFFICE" | "UNCLEAR",
  "summary": "1 sentence concise summary of prospect response and suggested next action"
}`;

        const response = await this.aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed && parsed.classification) {
            return {
              classification: parsed.classification as ReplyClassification,
              summary: parsed.summary || 'Analyzed reply'
            };
          }
        }
      } catch (err) {
        console.warn('[GEMINI REPLY CLASSIFY WARNING] Falling back to rule-based parser:', err);
      }
    }

    // Rule-based fallback
    const lower = replyText.toLowerCase();
    if (lower.includes('unsubscribe') || lower.includes('remove me') || lower.includes('stop emailing') || lower.includes('do not contact')) {
      return { classification: 'UNSUBSCRIBE', summary: 'Prospect requested to opt out.' };
    }
    if (lower.includes('not interested') || lower.includes('no thanks') || lower.includes('pass') || lower.includes('take me off')) {
      return { classification: 'NOT_INTERESTED', summary: 'Prospect expressed no interest.' };
    }
    if (lower.includes('out of office') || lower.includes('auto-reply') || lower.includes('vacation')) {
      return { classification: 'OUT_OF_OFFICE', summary: 'Out of office auto-responder.' };
    }
    if (lower.includes('book') || lower.includes('calendar') || lower.includes('demo') || lower.includes('call') || lower.includes('time')) {
      return { classification: 'MEETING_REQUEST', summary: 'Prospect requested a meeting or call.' };
    }
    if (lower.includes('yes') || lower.includes('tell me more') || lower.includes('send details') || lower.includes('interested')) {
      return { classification: 'INTERESTED', summary: 'Prospect showed positive interest.' };
    }

    return { classification: 'UNCLEAR', summary: 'Received response from prospect.' };
  }

  /**
   * Handle incoming prospect reply
   */
  public async handleIncomingReply(params: {
    organizationId: string;
    campaignId: string;
    leadId: string;
    senderEmail: string;
    recipientEmail: string;
    subject: string;
    body: string;
    snippet?: string;
    gmailMessageId?: string;
    gmailThreadId?: string;
  }): Promise<OutreachReply> {
    const { classification, summary } = await this.classifyReplyText(params.body, params.subject);

    const replyRecord: OutreachReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId: params.organizationId,
      campaignId: params.campaignId,
      leadId: params.leadId,
      senderEmail: params.senderEmail,
      recipientEmail: params.recipientEmail,
      subject: params.subject,
      snippet: params.snippet || params.body.substring(0, 150),
      body: params.body,
      classification,
      aiSummary: summary,
      gmailMessageId: params.gmailMessageId,
      gmailThreadId: params.gmailThreadId,
      receivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Save reply record
    await this.context.saveReply(replyRecord);

    // Stop all pending follow-up steps immediately
    await this.context.cancelPendingQueueItemsForLead(
      params.leadId, 
      params.campaignId, 
      params.organizationId, 
      `Reply received (${classification})`
    );

    // Update Lead Status if applicable
    if (classification === 'UNSUBSCRIBE') {
      if (this.context.updateLeadStatus) {
        await this.context.updateLeadStatus(params.leadId, 'UNSUBSCRIBED', params.organizationId);
      }
    } else if (classification === 'NOT_INTERESTED') {
      if (this.context.updateLeadStatus) {
        await this.context.updateLeadStatus(params.leadId, 'NOT_INTERESTED', params.organizationId);
      }
    } else if (classification === 'INTERESTED' || classification === 'MEETING_REQUEST') {
      if (this.context.updateLeadStatus) {
        await this.context.updateLeadStatus(params.leadId, 'QUALIFIED', params.organizationId);
      }
    }

    // Audit Event
    await this.context.logEvent({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: params.organizationId,
      campaignId: params.campaignId,
      leadId: params.leadId,
      eventType: 'reply_received',
      details: { classification, summary, gmailMessageId: params.gmailMessageId },
      createdAt: new Date().toISOString()
    });

    // Notify Account Owner if Interested or Meeting Requested
    if (classification === 'INTERESTED' || classification === 'MEETING_REQUEST') {
      const lead = await this.context.getLeadById(params.leadId, params.organizationId);
      const campaign = await this.context.getCampaignById(params.campaignId, params.organizationId);

      const ownerEmail = 'sohamkharat481@gmail.com';
      const notificationSubject = `🔥 SalesPilot High Intent Lead Alert: ${lead?.name || params.senderEmail} (${classification})`;
      const notificationBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="padding-bottom: 16px; border-bottom: 2px solid #10b981;">
            <h2 style="color: #065f46; margin: 0; font-size: 20px;">🔥 High Intent Reply Detected!</h2>
            <p style="color: #047857; margin: 4px 0 0 0; font-size: 14px;">Classification: <strong>${classification}</strong></p>
          </div>

          <div style="margin: 20px 0; background: #f8fafc; padding: 16px; border-radius: 8px;">
            <p style="margin: 4px 0;"><strong>Prospect:</strong> ${lead?.name || 'Lead'} (${lead?.title || 'Decision Maker'})</p>
            <p style="margin: 4px 0;"><strong>Company:</strong> ${lead?.company || lead?.companyName || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${params.senderEmail}</p>
            <p style="margin: 4px 0;"><strong>Campaign:</strong> ${campaign?.name || 'Outreach Campaign'}</p>
          </div>

          <div style="margin: 20px 0;">
            <p style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">AI Summary & Suggested Next Action:</p>
            <p style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; color: #065f46; margin: 0; border-radius: 4px;">${summary}</p>
          </div>

          <div style="margin: 20px 0;">
            <p style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">Original Outreach Subject:</p>
            <p style="color: #64748b; margin: 0;">${params.subject || 'SalesPilot Outreach'}</p>
          </div>

          <div style="margin: 20px 0;">
            <p style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">Latest Reply Content:</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 14px; color: #334155; white-space: pre-wrap;">${params.body}</div>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
            <a href="${process.env.APP_URL || 'https://salespilot.ai'}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open SalesPilot CRM</a>
          </div>
        </div>
      `;

      // Dispatch Email & In-App Notification
      await this.context.sendOwnerNotificationEmail(ownerEmail, notificationSubject, notificationBody);
      await this.context.saveInAppNotification(
        params.organizationId,
        `🔥 High-Intent Prospect Reply: ${lead?.name || params.senderEmail}`,
        `Reply classified as ${classification}. Summary: ${summary}`,
        { leadId: params.leadId, campaignId: params.campaignId, replyId: replyRecord.id }
      );

      await this.context.logEvent({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        organizationId: params.organizationId,
        campaignId: params.campaignId,
        leadId: params.leadId,
        eventType: 'interest_detected',
        details: { classification, ownerNotified: ownerEmail },
        createdAt: new Date().toISOString()
      });
    }

    return replyRecord;
  }
}
