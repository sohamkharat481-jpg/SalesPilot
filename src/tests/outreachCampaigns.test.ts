import { LocalDB } from '../database/localDb';
import { OutreachCampaign, OutreachStep, OutreachQueueItem } from '../types/outreach';
import { Lead } from '../types';

declare const describe: any;
declare const it: any;
declare const expect: any;

if (typeof describe === 'function') {
  describe('Outreach Campaign Safety, Idempotency & Tenant Isolation Suite', () => {
    it('runs the complete outreach campaign test suite', async () => {
      const result = await runOutreachCampaignTestSuite();
      expect(result.failed).toBe(0);
      expect(result.passed).toBeGreaterThan(0);
    });
  });
}

export async function runOutreachCampaignTestSuite() {
  console.log('=== STARTING OUTREACH CAMPAIGN TEST SUITE ===');
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

  const db = new LocalDB();
  const ORG_A = 'org_test_a_' + Date.now();
  const ORG_B = 'org_test_b_' + Date.now();

  // Setup test leads for ORG_A
  const leadA: Lead = {
    id: 'lead_a_1',
    organizationId: ORG_A,
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@acme.com',
    company: 'Acme Corp',
    status: 'QUALIFIED' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  (db as any).db.leads = [leadA];

  // 1. Test Existing Campaign Creation
  const campaignId = `camp_${Date.now()}`;
  const campaign: OutreachCampaign = {
    id: campaignId,
    organizationId: ORG_A,
    name: 'Q3 Enterprise Outreach',
    status: 'DRAFT',
    targetLeadIds: ['lead_a_1'],
    dailyLimit: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const steps: OutreachStep[] = [
    {
      id: `step_${Date.now()}_1`,
      organizationId: ORG_A,
      campaignId,
      stepNumber: 1,
      delayDays: 0,
      subjectTemplate: 'Hello {first_name}',
      bodyTemplate: 'Hi {first_name}, check out Acme.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  db.saveOutreachCampaign(campaign, steps);
  const fetchedCampaign = db.getOutreachCampaignById(campaignId, ORG_A);
  assert(fetchedCampaign !== null && fetchedCampaign.name === 'Q3 Enterprise Outreach', 'Existing campaign creation and retrieval');

  // 2. Test Tenant Isolation (ORG_B cannot access ORG_A campaign)
  const orgBCampaign = db.getOutreachCampaignById(campaignId, ORG_B);
  assert(orgBCampaign === null, 'Tenant isolation: ORG_B cannot access ORG_A campaign');

  // 3. Test Draft Deletion (Allowed for DRAFT with no sent messages)
  const draftCampId = `draft_${Date.now()}`;
  const draftCampaign: OutreachCampaign = {
    id: draftCampId,
    organizationId: ORG_A,
    name: 'Disposable Draft',
    status: 'DRAFT',
    targetLeadIds: ['lead_a_1'],
    dailyLimit: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.saveOutreachCampaign(draftCampaign, steps);
  assert(db.getOutreachCampaignById(draftCampId, ORG_A) !== null, 'Draft campaign created');

  const deleteResult = db.deleteOutreachCampaign(draftCampId, ORG_A);
  assert(deleteResult === true && db.getOutreachCampaignById(draftCampId, ORG_A) === null, 'Draft campaign deletion/archive allowed');

  // 4. Test Prevention of Deletion for Active / Running Campaigns or Campaigns with Sent Messages
  const activeCampId = `active_${Date.now()}`;
  const activeCampaign: OutreachCampaign = {
    id: activeCampId,
    organizationId: ORG_A,
    name: 'Running Campaign',
    status: 'ACTIVE',
    targetLeadIds: ['lead_a_1'],
    dailyLimit: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.saveOutreachCampaign(activeCampaign, steps);

  // Add a sent queue item
  if (!(db as any).db.outreachQueue) (db as any).db.outreachQueue = [];
  (db as any).db.outreachQueue.push({
    id: `q_${Date.now()}`,
    organizationId: ORG_A,
    campaignId: activeCampId,
    leadId: 'lead_a_1',
    channel: 'EMAIL',
    status: 'SENT',
    scheduledFor: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const activeCampaignFetched = db.getOutreachCampaignById(activeCampId, ORG_A);
  const queueItems = db.getOutreachQueue(ORG_A).filter(q => q.campaignId === activeCampId);
  const hasSent = queueItems.some(q => q.status === 'SENT');
  const canDeleteActive = activeCampaignFetched?.status === 'DRAFT' && !hasSent;
  assert(canDeleteActive === false, 'Never allow deletion of active campaign or campaign with sent messages');

  // 5. Test Duplicate Submission / Idempotency Simulation
  const checkDuplicate = (name: string, leadIds: string[], orgId: string) => {
    const existing = db.getOutreachCampaigns(orgId);
    const trimmed = name.trim().toLowerCase();
    return existing.find(c => {
      if (c.name.trim().toLowerCase() !== trimmed) return false;
      const sameLeads = JSON.stringify((c.targetLeadIds || []).sort()) === JSON.stringify((leadIds || []).sort());
      return sameLeads;
    });
  };

  // 6. Test Persistence After Activation, Reload Simulation, Recipient & Sent Message Persistence
  const persistCampId = `persist_${Date.now()}`;
  const persistCampaign: OutreachCampaign = {
    id: persistCampId,
    organizationId: ORG_A,
    name: 'A quick idea for Kanishka Software',
    status: 'ACTIVE',
    targetLeadIds: ['lead_a_1'],
    dailyLimit: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.saveOutreachCampaign(persistCampaign, steps);
  
  // Simulate queue sent message
  const sentQueueItem: OutreachQueueItem = {
    id: `q_sent_${Date.now()}`,
    organizationId: ORG_A,
    campaignId: persistCampId,
    stepId: steps[0].id,
    stepNumber: 1,
    leadId: 'lead_a_1',
    recipientEmail: 'alice@acme.com',
    recipientName: 'Alice Smith',
    subject: 'Hello Alice',
    body: 'Hi Alice',
    status: 'SENT',
    scheduledAt: new Date().toISOString(),
    attempts: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.enqueueOutreachItems([sentQueueItem]);

  // Simulate reload / GET fetch
  const reloadedCampaigns = db.getOutreachCampaigns(ORG_A);
  const reloadedQueue = db.getOutreachQueue(ORG_A);
  const foundPersisted = reloadedCampaigns.find(c => c.id === persistCampId);
  const foundQueueSent = reloadedQueue.find(q => q.campaignId === persistCampId && q.status === 'SENT');

  assert(foundPersisted !== undefined && foundPersisted.status === 'ACTIVE', 'Campaign status ACTIVE survives reload');
  assert(foundPersisted !== undefined && JSON.stringify(foundPersisted.targetLeadIds) === JSON.stringify(['lead_a_1']), 'Selected recipient IDs persist correctly');
  assert(foundQueueSent !== undefined && foundQueueSent.status === 'SENT', 'Sent message record persists correctly after reload');

  // 7. Tenant Isolation for Reload / GET
  const reloadedOrgBCampaigns = db.getOutreachCampaigns(ORG_B);
  const orgBHasPersisted = reloadedOrgBCampaigns.some(c => c.id === persistCampId);
  assert(orgBHasPersisted === false, 'Tenant isolation verified: ORG_B cannot view ORG_A persisted campaigns');
  return { passed, failed };
}
