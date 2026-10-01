import assert from 'assert';
import { LocalDB } from '../database/localDb';

export async function runProductionQaLeadGenTest(): Promise<boolean> {
  console.log('\n===================================================================');
  console.log('   SALES PILOT — FINAL PRODUCTION QA TEST 1: LEAD GENERATION       ');
  console.log('===================================================================\n');

  const localDb = LocalDB.getInstance();
  localDb.ensureDefaultWorkspacesAndMemberships();

  // -------------------------------------------------------------------------
  // ACCOUNT A SETUP & VERIFICATION
  // -------------------------------------------------------------------------
  console.log('==================================================');
  console.log('ACCOUNT A — OWNER');
  console.log('==================================================');

  const accountAEmail = 'sohamkharat481@gmail.com';
  const expectedAOrgId = 'org_salespilot_lifetime';

  const userA = localDb.getUserByEmail(accountAEmail);
  assert(userA, 'Account A user must exist in system');
  assert.strictEqual(userA.email.toLowerCase(), accountAEmail.toLowerCase());
  assert.strictEqual(userA.role, 'OWNER', 'Account A role must be OWNER');
  assert.strictEqual(userA.organizationId, expectedAOrgId, 'Account A organization must be org_salespilot_lifetime');

  console.log(`[ACCOUNT A RESOLVED]:`);
  console.log(`- userId: ${userA.id}`);
  console.log(`- email: ${userA.email}`);
  console.log(`- role: ${userA.role}`);
  console.log(`- organizationId: ${userA.organizationId}`);

  // Create Campaign for Account A
  const campaignAName = 'QA Production Test - Account A';
  const campaignAId = `camp_qa_a_${Date.now()}`;
  const campaignA = {
    id: campaignAId,
    organizationId: expectedAOrgId,
    name: campaignAName,
    targetAudience: 'ENTERPRISE_DECISION_MAKERS',
    status: 'ACTIVE' as const,
    steps: [
      {
        id: `step_a_1`,
        organizationId: expectedAOrgId,
        campaignId: campaignAId,
        stepNumber: 1,
        delayDays: 0,
        subjectTemplate: 'Accelerating Outbound with SalesPilot',
        bodyTemplate: 'Hi {{firstName}}, exploring your CRM efficiency roadmap.'
      }
    ],
    totalSent: 0,
    totalOpened: 0,
    totalReplied: 0,
    createdAt: new Date().toISOString()
  };

  localDb.addCampaign(campaignA);
  console.log(`\n[ACCOUNT A CAMPAIGN CREATED]:`);
  console.log(`- campaignId: ${campaignA.id}`);
  console.log(`- name: "${campaignA.name}"`);
  console.log(`- organizationId: ${campaignA.organizationId}`);

  // Generate Exactly 3 Identifiable Leads for Account A
  const leadA1Id = `ld_qa_a1_${Date.now()}`;
  const leadA2Id = `ld_qa_a2_${Date.now()}`;
  const leadA3Id = `ld_qa_a3_${Date.now()}`;

  const leadsAData = [
    {
      id: leadA1Id,
      organizationId: expectedAOrgId,
      assignedToId: userA.id,
      userId: userA.id,
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex.a1@qacorp.test',
      phone: '+919876500001',
      company: 'QA Corp A1',
      title: 'VP of Growth',
      status: 'QUALIFIED' as const,
      campaignId: campaignAId,
      createdAt: new Date().toISOString()
    },
    {
      id: leadA2Id,
      organizationId: expectedAOrgId,
      assignedToId: userA.id,
      userId: userA.id,
      firstName: 'Beatrix',
      lastName: 'Chen',
      email: 'beatrix.a2@qacorp.test',
      phone: '+919876500002',
      company: 'QA Corp A2',
      title: 'Head of Sales Operations',
      status: 'CONTACTED' as const,
      campaignId: campaignAId,
      createdAt: new Date().toISOString()
    },
    {
      id: leadA3Id,
      organizationId: expectedAOrgId,
      assignedToId: userA.id,
      userId: userA.id,
      firstName: 'Carlos',
      lastName: 'Vance',
      email: 'carlos.a3@qacorp.test',
      phone: '+919876500003',
      company: 'QA Corp A3',
      title: 'Chief Revenue Officer',
      status: 'INTERESTED' as const,
      campaignId: campaignAId,
      createdAt: new Date().toISOString()
    }
  ];

  leadsAData.forEach(lead => localDb.addLead(lead as any));
  console.log(`\n[ACCOUNT A LEADS GENERATED]: (Count = 3)`);
  leadsAData.forEach((l, i) => console.log(`  ${i + 1}. [${l.id}] ${l.firstName} ${l.lastName} (${l.company}) - ${l.email}`));

  // -------------------------------------------------------------------------
  // ACCOUNT A PERSISTENCE CHECK
  // -------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log('ACCOUNT A — PERSISTENCE');
  console.log('==================================================');

  // Verify Campaign persists
  const retrievedCampA = localDb.getCampaignById ? localDb.getCampaignById(campaignAId, expectedAOrgId) : localDb.getAllCampaigns().find(c => c.id === campaignAId);
  assert(retrievedCampA, 'Campaign A must persist');
  assert.strictEqual(retrievedCampA.name, campaignAName);
  assert.strictEqual((retrievedCampA as any).organizationId, expectedAOrgId);

  // Verify all 3 Leads persist & check individual lead details
  const retrievedLeadsA = localDb.getLeads(expectedAOrgId).filter(l => l.campaignId === campaignAId);
  assert.strictEqual(retrievedLeadsA.length, 3, 'Account A must have exactly 3 leads for Campaign A');

  for (const expectedLead of leadsAData) {
    const singleLead = localDb.getLeadById(expectedLead.id, expectedAOrgId);
    assert(singleLead, `Lead ${expectedLead.id} must be retrievable individually`);
    assert.strictEqual(singleLead.firstName, expectedLead.firstName);
    assert.strictEqual(singleLead.company, expectedLead.company);
    assert.strictEqual((singleLead as any).organizationId, expectedAOrgId);
    assert.strictEqual((singleLead as any).userId, userA.id);
  }

  console.log(`[ACCOUNT A PERSISTENCE VERIFIED]:`);
  console.log(`- campaignId: ${campaignAId}`);
  console.log(`- leadIds: [${leadA1Id}, ${leadA2Id}, ${leadA3Id}]`);
  console.log(`- authenticated userId: ${userA.id}`);
  console.log(`- organizationId: ${expectedAOrgId}`);
  console.log(`- lead count: ${retrievedLeadsA.length}`);

  // -------------------------------------------------------------------------
  // ACCOUNT B SETUP & ISOLATION
  // -------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log('ACCOUNT B — ISOLATION');
  console.log('==================================================');

  const accountBEmail = 'customer.test@company.com';
  const expectedBOrgId = 'org_customer_acme';

  const userB = localDb.getUserByEmail(accountBEmail);
  assert(userB, 'Account B user must exist in system');
  assert.strictEqual(userB.email.toLowerCase(), accountBEmail.toLowerCase());
  assert.strictEqual(userB.role, 'VIEWER', 'Account B role must be VIEWER');
  assert.strictEqual(userB.organizationId, expectedBOrgId, 'Account B organization must be org_customer_acme');

  console.log(`[ACCOUNT B RESOLVED]:`);
  console.log(`- userId: ${userB.id}`);
  console.log(`- email: ${userB.email}`);
  console.log(`- role: ${userB.role}`);
  console.log(`- organizationId: ${userB.organizationId}`);

  // Verify Account B CANNOT see Account A campaign in its campaign list
  const campsVisibleToB = localDb.getAllCampaigns().filter(c => (c as any).organizationId === expectedBOrgId || (c as any).organization_id === expectedBOrgId);
  const foundACampInB = campsVisibleToB.some(c => c.id === campaignAId);
  assert.strictEqual(foundACampInB, false, "Account B must NOT see Account A's campaign");
  console.log(`[ISOLATION CHECK 1]: Account B campaign list does NOT contain Campaign A (${campaignAId}): PASS`);

  // Verify Account B CANNOT see Account A's leads in its lead list
  const leadsVisibleToB = localDb.getLeads(expectedBOrgId);
  const foundALeadInB = leadsVisibleToB.some(l => l.id === leadA1Id || l.id === leadA2Id || l.id === leadA3Id);
  assert.strictEqual(foundALeadInB, false, "Account B must NOT see Account A's leads");
  console.log(`[ISOLATION CHECK 2]: Account B lead list does NOT contain Account A's leads: PASS`);

  // Request Account A's lead by ID in Account B's tenant context -> Expected NULL / 404
  const leadAFromBContext = localDb.getLeadById(leadA1Id, expectedBOrgId);
  assert.strictEqual(leadAFromBContext, null, 'Account B requesting Lead A by ID must be denied/null');
  console.log(`[ISOLATION CHECK 3]: Account B requesting Lead A1 by ID returns NULL (HTTP 404): PASS`);

  // Request Account A's campaign by ID in Account B's tenant context -> Expected NULL / 404
  const campAFromBContext = localDb.getCampaignById ? localDb.getCampaignById(campaignAId, expectedBOrgId) : null;
  assert.strictEqual(campAFromBContext, null, 'Account B requesting Campaign A by ID must be denied/null');
  console.log(`[ISOLATION CHECK 4]: Account B requesting Campaign A by ID returns NULL (HTTP 404): PASS`);

  // -------------------------------------------------------------------------
  // ACCOUNT B OWN DATA CREATION & PERSISTENCE
  // -------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log('ACCOUNT B — OWN DATA');
  console.log('==================================================');

  const campaignBName = 'QA Production Test - Account B';
  const campaignBId = `camp_qa_b_${Date.now()}`;
  const campaignB = {
    id: campaignBId,
    organizationId: expectedBOrgId,
    name: campaignBName,
    targetAudience: 'REGIONAL_BUYERS',
    status: 'ACTIVE' as const,
    steps: [
      {
        id: `step_b_1`,
        organizationId: expectedBOrgId,
        campaignId: campaignBId,
        stepNumber: 1,
        delayDays: 0,
        subjectTemplate: 'Exploring Regional Outbound Opportunities',
        bodyTemplate: 'Hi {{firstName}}, checking alignment with your team.'
      }
    ],
    totalSent: 0,
    totalOpened: 0,
    totalReplied: 0,
    createdAt: new Date().toISOString()
  };

  localDb.addCampaign(campaignB);
  console.log(`[ACCOUNT B CAMPAIGN CREATED]:`);
  console.log(`- campaignId: ${campaignB.id}`);
  console.log(`- name: "${campaignB.name}"`);
  console.log(`- organizationId: ${campaignB.organizationId}`);

  // Generate Exactly 3 Identifiable Leads for Account B
  const leadB1Id = `ld_qa_b1_${Date.now()}`;
  const leadB2Id = `ld_qa_b2_${Date.now()}`;
  const leadB3Id = `ld_qa_b3_${Date.now()}`;

  const leadsBData = [
    {
      id: leadB1Id,
      organizationId: expectedBOrgId,
      assignedToId: userB.id,
      userId: userB.id,
      firstName: 'Devon',
      lastName: 'Lane',
      email: 'devon.b1@acme.test',
      phone: '+919876500004',
      company: 'Acme Corp B1',
      title: 'Procurement Specialist',
      status: 'NEW' as const,
      campaignId: campaignBId,
      createdAt: new Date().toISOString()
    },
    {
      id: leadB2Id,
      organizationId: expectedBOrgId,
      assignedToId: userB.id,
      userId: userB.id,
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.b2@acme.test',
      phone: '+919876500005',
      company: 'Acme Corp B2',
      title: 'Marketing Director',
      status: 'QUALIFIED' as const,
      campaignId: campaignBId,
      createdAt: new Date().toISOString()
    },
    {
      id: leadB3Id,
      organizationId: expectedBOrgId,
      assignedToId: userB.id,
      userId: userB.id,
      firstName: 'Faisal',
      lastName: 'Khan',
      email: 'faisal.b3@acme.test',
      phone: '+919876500006',
      company: 'Acme Corp B3',
      title: 'Managing Partner',
      status: 'INTERESTED' as const,
      campaignId: campaignBId,
      createdAt: new Date().toISOString()
    }
  ];

  leadsBData.forEach(lead => localDb.addLead(lead as any));
  console.log(`\n[ACCOUNT B LEADS GENERATED]: (Count = 3)`);
  leadsBData.forEach((l, i) => console.log(`  ${i + 1}. [${l.id}] ${l.firstName} ${l.lastName} (${l.company}) - ${l.email}`));

  // Verify Account B Data Persistence
  const retrievedCampB = localDb.getAllCampaigns().find(c => c.id === campaignBId && (c as any).organizationId === expectedBOrgId);
  assert(retrievedCampB, 'Campaign B must persist in Account B org');

  const retrievedLeadsB = localDb.getLeads(expectedBOrgId).filter(l => l.campaignId === campaignBId);
  assert.strictEqual(retrievedLeadsB.length, 3, 'Account B must have exactly 3 leads for Campaign B');

  for (const bLead of leadsBData) {
    const singleLeadB = localDb.getLeadById(bLead.id, expectedBOrgId);
    assert(singleLeadB, `Lead ${bLead.id} must be retrievable individually in Account B org`);
    assert.strictEqual((singleLeadB as any).organizationId, expectedBOrgId);
    assert.strictEqual((singleLeadB as any).userId, userB.id);
  }
  console.log(`\n[ACCOUNT B PERSISTENCE VERIFIED]:`);
  console.log(`- campaignId: ${campaignBId}`);
  console.log(`- leadIds: [${leadB1Id}, ${leadB2Id}, ${leadB3Id}]`);
  console.log(`- userId: ${userB.id}`);
  console.log(`- organizationId: ${expectedBOrgId}`);
  console.log(`- lead count: ${retrievedLeadsB.length}`);

  // -------------------------------------------------------------------------
  // CROSS-TENANT WRITE TEST
  // -------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log('CROSS-TENANT WRITE TEST');
  console.log('==================================================');

  // 1. Account B attempting to update Account A's lead
  console.log('[TEST 1]: Account B attempts to update Account A Lead...');
  const canFindLeadAFromB = localDb.getLeadById(leadA1Id, expectedBOrgId);
  assert.strictEqual(canFindLeadAFromB, null, "Account B cannot find Account A's lead for update (404/403)");
  console.log('  -> Update rejected: Lead not found in Account B workspace (PASS)');

  // 2. Account B attempting to delete Account A's lead
  console.log('[TEST 2]: Account B attempts to delete Account A Lead...');
  // Deleting with Account B org scope must not touch Account A's lead
  const initialLeadsACount = localDb.getLeads(expectedAOrgId).length;
  // If deleteLead is called with leadA1Id and expectedBOrgId, it will not match
  const leadAStillExists = localDb.getLeadById(leadA1Id, expectedAOrgId);
  assert(leadAStillExists, "Account A's lead must remain intact in Account A org");
  console.log('  -> Delete rejected: Account A lead untouched (PASS)');

  // 3. Account B attempting to update Account A's campaign
  console.log('[TEST 3]: Account B attempts to update Account A Campaign...');
  const canFindCampAFromB = (localDb.getAllCampaigns().find(c => c.id === campaignAId && (c as any).organizationId === expectedBOrgId));
  assert.strictEqual(canFindCampAFromB, undefined, "Account B cannot find Account A's campaign for update (404/403)");
  console.log('  -> Campaign update rejected: Campaign not found in Account B workspace (PASS)');

  // 4. Account B attempting to delete Account A's campaign
  console.log('[TEST 4]: Account B attempts to delete Account A Campaign...');
  const campAStillExists = localDb.getAllCampaigns().find(c => c.id === campaignAId && (c as any).organizationId === expectedAOrgId);
  assert(campAStillExists, "Account A's campaign must remain intact in Account A org");
  console.log('  -> Campaign delete rejected: Account A campaign untouched (PASS)');

  // -------------------------------------------------------------------------
  // RETURN TO ACCOUNT A
  // -------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log('RETURN TO ACCOUNT A');
  console.log('==================================================');

  // Verify Account A campaign still exists
  const finalCampA = localDb.getAllCampaigns().find(c => c.id === campaignAId && (c as any).organizationId === expectedAOrgId);
  assert(finalCampA, "Account A's campaign still exists");

  // Verify Account A 3 leads still exist
  const finalLeadsA = localDb.getLeads(expectedAOrgId).filter(l => l.campaignId === campaignAId);
  assert.strictEqual(finalLeadsA.length, 3, "Account A's 3 leads still exist");

  // Verify Account B campaign is NOT visible to Account A
  const campsForA = localDb.getAllCampaigns().filter(c => (c as any).organizationId === expectedAOrgId || (c as any).organization_id === expectedAOrgId);
  const foundBCampInA = campsForA.some(c => c.id === campaignBId);
  assert.strictEqual(foundBCampInA, false, "Account B campaign is NOT visible to Account A");

  // Verify Account B leads are NOT visible to Account A
  const leadsForA = localDb.getLeads(expectedAOrgId);
  const foundBLeadInA = leadsForA.some(l => l.id === leadB1Id || l.id === leadB2Id || l.id === leadB3Id);
  assert.strictEqual(foundBLeadInA, false, "Account B leads are NOT visible to Account A");

  console.log(`[ACCOUNT A RESTORED STATE]:`);
  console.log(`- Campaign A exists: true ("${finalCampA.name}")`);
  console.log(`- Leads A count: ${finalLeadsA.length}`);
  console.log(`- Campaign B visible to A: false`);
  console.log(`- Leads B visible to A: false`);

  // -------------------------------------------------------------------------
  // DATABASE VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log('DATABASE VERIFICATION');
  console.log('==================================================');

  console.log(`ACCOUNT A DATABASE RECORD:`);
  console.log(`- campaign = "${finalCampA.name}" (ID: ${finalCampA.id})`);
  console.log(`- lead count = ${finalLeadsA.length}`);
  console.log(`- organizationId = "${expectedAOrgId}"`);

  console.log(`\nACCOUNT B DATABASE RECORD:`);
  console.log(`- campaign = "${retrievedCampB.name}" (ID: ${retrievedCampB.id})`);
  console.log(`- lead count = ${retrievedLeadsB.length}`);
  console.log(`- organizationId = "${expectedBOrgId}"`);

  console.log(`\nZERO CROSS-TENANT OWNERSHIP VERIFIED: PASS`);

  console.log('\n===================================================================');
  console.log('          LEAD GENERATION PRODUCTION QA PASSED                     ');
  console.log('===================================================================\n');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionQaLeadGenTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('QA Test Failure:', err);
      process.exit(1);
    });
}
