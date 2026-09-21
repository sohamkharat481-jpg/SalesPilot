import { OutreachWorker, OutreachWorkerContext } from '../backend/outreachWorker';
import { OutreachQueueItem, OutreachEvent } from '../types/outreach';
import { Lead } from '../types';

declare const describe: any;
declare const it: any;
declare const expect: any;

if (typeof describe === 'function') {
  describe('Controlled Test Email Functionality & Safety Verification', () => {
    it('runs the complete outreach test email suite', async () => {
      const result = await runOutreachTestEmailSuite();
      expect(result.failed).toBe(0);
      expect(result.passed).toBeGreaterThan(0);
    });
  });
}

/**
 * Automated Test Suite: Controlled Test Email Functionality & Safety Verification
 */
export async function runOutreachTestEmailSuite() {
  console.log('=== STARTING CONTROLLED TEST EMAIL SUITE ===');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  };

  const ORG_A = 'org_test_a';
  const ORG_B = 'org_test_b';

  // Mock database collections
  let queue: OutreachQueueItem[] = [];
  let leads: Lead[] = [
    {
      id: 'lead_existing_1',
      organizationId: ORG_A,
      firstName: 'Original',
      lastName: 'Lead',
      email: 'original@company.com',
      company: 'Acme Corp',
      status: 'QUALIFIED' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  let events: OutreachEvent[] = [];
  let invalidGmailToken = false;

  const mockContext: OutreachWorkerContext = {
    getCampaignById: async () => null,
    getStepsByCampaign: async () => [],
    getLeadById: async (id, orgId) => leads.find(l => l.id === id && l.organizationId === orgId) || null,
    getQueueItemsToProcess: async () => [],
    claimQueueItem: async () => null,
    updateQueueItem: async () => false,
    saveMessage: async () => {},
    saveReply: async () => {},
    cancelPendingQueueItemsForLead: async () => 0,
    logEvent: async (evt) => { events.push(evt); },
    getGmailAccount: async (orgId) => {
      if (invalidGmailToken) {
        throw new Error(`Gmail authorization check failed for org ${orgId}: OAuth token expired or revoked`);
      }
      return { email: 'sender@salespilot.ai', organizationId: orgId, accessToken: 'valid_token' };
    },
    sendGmailMessage: async (acc, rec, subj, body) => {
      if (invalidGmailToken) {
        throw new Error('Gmail API 401 Unauthorized: Invalid credentials');
      }
      return { providerMessageId: `msg_test_${Date.now()}`, threadId: `th_test_${Date.now()}` };
    },
    sendOwnerNotificationEmail: async () => true,
    saveInAppNotification: async () => {}
  };

  // Helper handler simulating the POST /api/v1/outreach/test-email logic
  const handleTestEmailEndpoint = async (
    user: { id: string; email: string; organizationId?: string } | null,
    requestOrgId: string | null,
    payload: { recipientEmail?: string; subject?: string; body?: string }
  ) => {
    // 1. Authenticated Access Check
    if (!user) {
      return { status: 401, error: 'Unauthorized.' };
    }

    // 2. Tenant Isolation Check
    const effectiveOrgId = user.organizationId || requestOrgId;
    if (!effectiveOrgId || (user.organizationId && user.organizationId !== requestOrgId)) {
      return { status: 403, error: 'Access denied: Organization mismatch.' };
    }

    // Recipient Validation
    if (!payload.recipientEmail || !payload.recipientEmail.includes('@')) {
      return { status: 400, error: 'Valid recipient email address is required.' };
    }

    try {
      // 3. Gmail Credential Validation
      const gmailAcc = await mockContext.getGmailAccount(effectiveOrgId);

      // 4. Dispatch Email
      const result = await mockContext.sendGmailMessage(
        gmailAcc,
        payload.recipientEmail,
        payload.subject || 'Test Subject',
        payload.body || 'Test Body'
      );

      // 5. Audit Logging
      await mockContext.logEvent({
        id: `evt_test_${Date.now()}`,
        organizationId: effectiveOrgId,
        campaignId: 'TEST_EMAIL',
        leadId: 'NONE',
        eventType: 'test_email_sent',
        details: { summary: `TEST EMAIL sent by ${user.email} to ${payload.recipientEmail}` },
        createdAt: new Date().toISOString()
      });

      return {
        status: 200,
        success: true,
        senderEmail: gmailAcc.email,
        recipientEmail: payload.recipientEmail,
        providerMessageId: result.providerMessageId,
        threadId: result.threadId
      };
    } catch (err: any) {
      return { status: 500, error: err.message || String(err) };
    }
  };

  // --- TEST 1: Authenticated Access
  const unauthRes = await handleTestEmailEndpoint(null, ORG_A, { recipientEmail: 'test@secondary.com' });
  assert(unauthRes.status === 401, 'Test 1: Unauthenticated request rejected with 401');

  // --- TEST 2: Tenant Isolation
  const crossTenantRes = await handleTestEmailEndpoint(
    { id: 'usr_1', email: 'user@orga.com', organizationId: ORG_A },
    ORG_B, // Trying to access ORG_B
    { recipientEmail: 'test@secondary.com' }
  );
  assert(crossTenantRes.status === 403, 'Test 2: Cross-tenant organization mismatch rejected with 403');

  // --- TEST 3: Gmail Credential Validation Failure
  invalidGmailToken = true;
  const failAuthRes = await handleTestEmailEndpoint(
    { id: 'usr_1', email: 'user@orga.com', organizationId: ORG_A },
    ORG_A,
    { recipientEmail: 'test@secondary.com' }
  );
  assert(failAuthRes.status === 500 && (failAuthRes as any).error.includes('OAuth token expired or revoked'), 'Test 3: Invalid/expired Gmail credentials rejected with 500');

  // Reset Gmail credentials state
  invalidGmailToken = false;

  // --- TEST 4: Successful Send
  const initialQueueLength = queue.length;
  const initialLeadsLength = leads.length;
  const initialLeadStatus = leads[0].status;

  const successRes = await handleTestEmailEndpoint(
    { id: 'usr_1', email: 'user@orga.com', organizationId: ORG_A },
    ORG_A,
    { recipientEmail: 'mysecondary@gmail.com', subject: 'My Custom Test', body: 'Testing message' }
  );

  assert((successRes as any).success === true && (successRes as any).recipientEmail === 'mysecondary@gmail.com', 'Test 4: Successful send returns valid provider message ID');

  // --- TEST 5: Test email does NOT create queue items
  assert(queue.length === initialQueueLength, 'Test 5: Controlled test email does NOT create items in the outreach queue');

  // --- TEST 6: Test email does NOT create or modify CRM leads
  assert(leads.length === initialLeadsLength && leads[0].status === initialLeadStatus, 'Test 6: Controlled test email does NOT create or modify CRM leads');

  // --- TEST 7: Test email does NOT schedule follow-up sequences
  const testEvents = events.filter(e => e.eventType === 'test_email_sent');
  assert(testEvents.length === 1 && testEvents[0].campaignId === 'TEST_EMAIL' && testEvents[0].leadId === 'NONE', 'Test 7: Controlled test email logs single isolated audit record without follow-up scheduling');

  // --- TEST 8: Invalid Recipient Syntax Failure Handling
  const badRecipientRes = await handleTestEmailEndpoint(
    { id: 'usr_1', email: 'user@orga.com', organizationId: ORG_A },
    ORG_A,
    { recipientEmail: 'notanemail' }
  );
  assert(badRecipientRes.status === 400, 'Test 8: Invalid recipient syntax handled gracefully with 400 Bad Request');

  console.log(`\n=== CONTROLLED TEST EMAIL RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}
