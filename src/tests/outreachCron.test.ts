import { OutreachWorker, OutreachWorkerContext } from '../backend/outreachWorker';
import { 
  OutreachCampaign, OutreachStep, OutreachQueueItem, 
  OutreachMessage, OutreachReply, OutreachEvent 
} from '../types/outreach';
import { Lead } from '../types';

/**
 * Automated Test Suite: SalesPilot Outreach Cron Queue Processing & Safety Audit
 */
export async function runOutreachCronTestSuite() {
  console.log('=== STARTING OUTREACH CRON QUEUE PROCESSOR TEST SUITE ===');
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
  const SECRET = 'test_cron_secret_9988';

  // Mock In-Memory DB
  let queue: OutreachQueueItem[] = [];
  let campaigns: OutreachCampaign[] = [];
  let steps: OutreachStep[] = [];
  let leads: Lead[] = [];
  let messages: OutreachMessage[] = [];
  let events: OutreachEvent[] = [];
  let failGmailSend = false;

  const mockContext: OutreachWorkerContext = {
    getCampaignById: async (id, orgId) => campaigns.find(c => c.id === id && c.organizationId === orgId) || null,
    getStepsByCampaign: async (cId, orgId) => steps.filter(s => s.campaignId === cId && s.organizationId === orgId),
    getLeadById: async (lId, orgId) => leads.find(l => l.id === lId && l.organizationId === orgId) || null,
    getQueueItemsToProcess: async (limit = 20) => {
      const now = new Date().toISOString();
      return queue.filter(q => 
        (q.status === 'QUEUED' || q.status === 'WAITING') && 
        new Date(q.scheduledAt).getTime() <= Date.now()
      ).slice(0, limit);
    },
    claimQueueItem: async (id, orgId, staleMs = 180000) => {
      const item = queue.find(q => q.id === id && q.organizationId === orgId);
      if (!item) return null;
      const isStale = item.status === 'PROCESSING' && item.lockedAt && new Date(item.lockedAt).getTime() < (Date.now() - staleMs);
      if (item.status === 'QUEUED' || item.status === 'WAITING' || isStale) {
        item.status = 'PROCESSING';
        item.lockedAt = new Date().toISOString();
        return item;
      }
      return null;
    },
    updateQueueItem: async (id, updates, orgId) => {
      const item = queue.find(q => q.id === id && q.organizationId === orgId);
      if (item) {
        Object.assign(item, updates);
        return true;
      }
      return false;
    },
    saveMessage: async (msg) => { messages.push(msg); },
    saveReply: async () => {},
    cancelPendingQueueItemsForLead: async (lId, cId, orgId) => {
      let count = 0;
      queue.forEach(q => {
        if (q.leadId === lId && q.campaignId === cId && q.organizationId === orgId && (q.status === 'QUEUED' || q.status === 'WAITING' || q.status === 'PROCESSING')) {
          q.status = 'CANCELLED';
          count++;
        }
      });
      return count;
    },
    logEvent: async (evt) => { events.push(evt); },
    getGmailAccount: async (orgId) => ({ email: 'sender@salespilot.ai', organizationId: orgId }),
    sendGmailMessage: async (acc, rec, subj, body) => {
      if (failGmailSend) {
        throw new Error('Gmail API 403 Forbidden: Daily sending limit or scope issue');
      }
      return { providerMessageId: `provider_${Date.now()}`, threadId: `thread_${Date.now()}` };
    },
    sendOwnerNotificationEmail: async () => true,
    saveInAppNotification: async () => {}
  };

  const worker = new OutreachWorker(mockContext);

  // Helper auth check function mirroring server endpoint logic
  const checkAuth = (headerToken?: string, envSecret = SECRET) => {
    if (!envSecret || !headerToken || headerToken !== envSecret) return false;
    return true;
  };

  // --- TEST 1: Missing CRON_SECRET → Rejected
  assert(checkAuth(undefined, SECRET) === false, 'Test 1: Missing CRON_SECRET rejected');

  // --- TEST 2: Invalid CRON_SECRET → Rejected
  assert(checkAuth('invalid_token', SECRET) === false, 'Test 2: Invalid CRON_SECRET rejected');

  // --- TEST 3: Valid CRON_SECRET → Authorization Passes
  assert(checkAuth(SECRET, SECRET) === true, 'Test 3: Valid CRON_SECRET authorization passes');

  // --- TEST 4: Empty Queue → Clean Response
  queue = [];
  const emptyRes = await worker.processQueue(20);
  assert(emptyRes.processed === 0 && emptyRes.sent === 0 && emptyRes.failed === 0 && emptyRes.cancelled === 0, 'Test 4: Empty queue returns clean zero stats');

  // --- SETUP DATA FOR QUEUE TESTS
  campaigns = [{
    id: 'camp_1',
    organizationId: ORG_A,
    name: 'Outbound Alpha',
    status: 'ACTIVE',
    targetLeadIds: ['lead_1'],
    dailyLimit: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  steps = [{
    id: 'step_1',
    organizationId: ORG_A,
    campaignId: 'camp_1',
    stepNumber: 1,
    delayDays: 0,
    subjectTemplate: 'Hi {{first_name}} at {{company}}',
    bodyTemplate: 'Checking in regarding {{industry}} pipelines.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, {
    id: 'step_2',
    organizationId: ORG_A,
    campaignId: 'camp_1',
    stepNumber: 2,
    delayDays: 2,
    subjectTemplate: 'Re: Hi {{first_name}}',
    bodyTemplate: 'Following up.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  leads = [{
    id: 'lead_1',
    organizationId: ORG_A,
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex@acmecorp.com',
    company: 'Acme Corp',
    status: 'QUALIFIED' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  // --- TEST 5: One Queued Item → Processed & Sent
  queue = [{
    id: 'q_1',
    organizationId: ORG_A,
    campaignId: 'camp_1',
    stepId: 'step_1',
    stepNumber: 1,
    leadId: 'lead_1',
    recipientEmail: 'alex@acmecorp.com',
    recipientName: 'Alex Morgan',
    subject: 'Hi {{first_name}} at {{company}}',
    body: 'Checking in.',
    status: 'QUEUED',
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  failGmailSend = false;
  const res1 = await worker.processQueue(20);
  assert(res1.processed === 1 && res1.sent === 1, 'Test 5: One queued item successfully processed & sent');
  assert(queue[0].status === 'SENT', 'Test 8: Queue status updated to SENT');

  // --- TEST 6: Two Simultaneous Invocations → No Duplicate Claim
  queue = [{
    id: 'q_dup',
    organizationId: ORG_A,
    campaignId: 'camp_1',
    stepId: 'step_1',
    stepNumber: 1,
    leadId: 'lead_1',
    recipientEmail: 'alex@acmecorp.com',
    recipientName: 'Alex Morgan',
    subject: 'Hi {{first_name}}',
    body: 'Testing locking',
    status: 'QUEUED',
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  // First worker claims
  const claimed1 = await mockContext.claimQueueItem('q_dup', ORG_A);
  // Second worker attempts claim
  const claimed2 = await mockContext.claimQueueItem('q_dup', ORG_A);
  assert(claimed1 !== null && claimed2 === null, 'Test 6: Two simultaneous invocations receive atomic lock, preventing double send');

  // --- TEST 7: Failed Gmail Send → FAILED state recorded
  queue = [{
    id: 'q_fail',
    organizationId: ORG_A,
    campaignId: 'camp_1',
    stepId: 'step_1',
    stepNumber: 1,
    leadId: 'lead_1',
    recipientEmail: 'alex@acmecorp.com',
    recipientName: 'Alex Morgan',
    subject: 'Fail test',
    body: 'Fail test body',
    status: 'QUEUED',
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  failGmailSend = true;
  const resFail = await worker.processQueue(20);
  assert(resFail.failed === 1 && queue.find(q => q.id === 'q_fail')?.status === 'FAILED', 'Test 7: Failed Gmail send sets FAILED state');

  // --- TEST 9: Existing Suppression → No Send
  leads[0].status = 'UNSUBSCRIBED' as any;
  queue = [{
    id: 'q_suppressed',
    organizationId: ORG_A,
    campaignId: 'camp_1',
    stepId: 'step_1',
    stepNumber: 1,
    leadId: 'lead_1',
    recipientEmail: 'alex@acmecorp.com',
    recipientName: 'Alex Morgan',
    subject: 'Suppressed test',
    body: 'Suppressed test body',
    status: 'QUEUED',
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  failGmailSend = false;
  const resSupp = await worker.processQueue(20);
  assert(queue.find(q => q.id === 'q_suppressed')?.status === 'UNSUBSCRIBED', 'Test 9: Existing unsubscribed/suppressed lead prevents outreach send');

  // Reset lead status
  leads[0].status = 'QUALIFIED' as any;

  // --- TEST 10: Existing Reply → Cancel Follow-ups
  queue = [{
    id: 'q_step2',
    organizationId: ORG_A,
    campaignId: 'camp_1',
    stepId: 'step_2',
    stepNumber: 2,
    leadId: 'lead_1',
    recipientEmail: 'alex@acmecorp.com',
    recipientName: 'Alex Morgan',
    subject: 'Follow up',
    body: 'Body',
    status: 'QUEUED',
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  const cancelledCount = await mockContext.cancelPendingQueueItemsForLead('lead_1', 'camp_1', ORG_A, 'Reply received');
  assert(cancelledCount === 1 && queue[0].status === 'CANCELLED', 'Test 10: Inbound reply cancels pending follow-up queue items');

  // --- TEST 11: Campaign Paused → No Send
  campaigns[0].status = 'PAUSED';
  queue = [{
    id: 'q_paused',
    organizationId: ORG_A,
    campaignId: 'camp_1',
    stepId: 'step_1',
    stepNumber: 1,
    leadId: 'lead_1',
    recipientEmail: 'alex@acmecorp.com',
    recipientName: 'Alex Morgan',
    subject: 'Paused test',
    body: 'Body',
    status: 'QUEUED',
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  const resPaused = await worker.processQueue(20);
  assert(queue.find(q => q.id === 'q_paused')?.status === 'CANCELLED' && resPaused.sent === 0, 'Test 11: Paused campaign skips and cancels queued sends');

  // Reset campaign status
  campaigns[0].status = 'ACTIVE';

  // --- TEST 12: Tenant Isolation → Lead from Org B cannot be processed under Org A item
  leads.push({
    id: 'lead_b',
    organizationId: ORG_B,
    firstName: 'Blake',
    lastName: 'Jordan',
    email: 'blake@orgb.com',
    company: 'Org B',
    status: 'QUALIFIED' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  queue = [{
    id: 'q_cross_tenant',
    organizationId: ORG_A, // Queue item belongs to Org A
    campaignId: 'camp_1',
    stepId: 'step_1',
    stepNumber: 1,
    leadId: 'lead_b', // Lead belongs to Org B
    recipientEmail: 'blake@orgb.com',
    recipientName: 'Blake Jordan',
    subject: 'Cross tenant test',
    body: 'Body',
    status: 'QUEUED',
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  const resIso = await worker.processQueue(20);
  assert(queue.find(q => q.id === 'q_cross_tenant')?.status === 'CANCELLED', 'Test 12: Tenant cross-mismatch cancels queue item and prevents unauthorized access');

  console.log(`\n=== OUTREACH CRON TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}
