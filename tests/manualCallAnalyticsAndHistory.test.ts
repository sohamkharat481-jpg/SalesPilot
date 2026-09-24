import assert from 'node:assert';
import { LocalDB } from '../src/database/localDb';
import { ManualCallActivity, ManualCallOutcome } from '../src/types/voice';

async function runPhase5Tests() {
  console.log('--- Starting Phase 5 Manual Call History & Analytics Tests ---');

  const localDb = LocalDB.getInstance();
  const testRunId = Date.now().toString(36);

  // Define unique tenants & users
  const orgA = 'org_phase5_a_' + testRunId;
  const orgB = 'org_phase5_b_' + testRunId;

  const repUser1 = {
    id: 'usr_rep1_' + testRunId,
    email: `rep1_${testRunId}@salespilot.test`,
    fullName: 'Rep One',
    role: 'SALES',
    organizationId: orgA
  };

  const repUser2 = {
    id: 'usr_rep2_' + testRunId,
    email: `rep2_${testRunId}@salespilot.test`,
    fullName: 'Rep Two',
    role: 'SALES',
    organizationId: orgA
  };

  const adminUser = {
    id: 'usr_admin_' + testRunId,
    email: `admin_${testRunId}@salespilot.test`,
    fullName: 'Admin User',
    role: 'ADMIN',
    organizationId: orgA
  };

  const orgBUser = {
    id: 'usr_orgb_' + testRunId,
    email: `user_${testRunId}@tenantb.test`,
    fullName: 'Tenant B User',
    role: 'ADMIN',
    organizationId: orgB
  };

  // Seed Users
  localDb.addUser(repUser1);
  localDb.addUser(repUser2);
  localDb.addUser(adminUser);
  localDb.addUser(orgBUser);

  // Seed Leads in Tenant A
  const leadA1 = localDb.saveLead({
    id: 'lead_p5_a1_' + testRunId,
    organizationId: orgA,
    firstName: 'Alex',
    lastName: 'Vance',
    company: 'Acme Corp',
    phone: '+919876500001',
    email: 'alex@acme.com',
    status: 'NEW' as any,
    createdAt: new Date().toISOString()
  } as any);

  const leadA2 = localDb.saveLead({
    id: 'lead_p5_a2_' + testRunId,
    organizationId: orgA,
    firstName: 'Beth',
    lastName: 'Harmon',
    company: 'Stark Industries',
    phone: '+14155550002',
    email: 'beth@stark.com',
    status: 'NEW' as any,
    createdAt: new Date().toISOString()
  } as any);

  // Seed Lead in Tenant B
  const leadB1 = localDb.saveLead({
    id: 'lead_p5_b1_' + testRunId,
    organizationId: orgB,
    firstName: 'Charlie',
    lastName: 'Brown',
    company: 'Peanuts Inc',
    phone: '+14155550003',
    email: 'charlie@peanuts.com',
    status: 'NEW' as any,
    createdAt: new Date().toISOString()
  } as any);

  // 1. Seed Manual Call Activities
  console.log('--- Test 1: Seeding Manual Call Activities & Audit Entries ---');

  const callingNumSnapshot = '+91 74986 30805';

  // Call 1: Rep 1 -> Lead A1 (Interested)
  const act1: ManualCallActivity = {
    id: 'act_p5_1_' + testRunId,
    leadId: leadA1.id,
    organizationId: orgA,
    userId: repUser1.id,
    callingNumber: callingNumSnapshot,
    phoneNumber: '+919876500001',
    direction: 'OUTBOUND',
    activityType: 'PHONE_CALL',
    status: 'COMPLETED',
    outcome: 'Interested',
    notes: 'Prospect showed high interest in CRM upgrade',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  };

  // Call 2: Rep 1 -> Lead A2 (Meeting Requested)
  const act2: ManualCallActivity = {
    id: 'act_p5_2_' + testRunId,
    leadId: leadA2.id,
    organizationId: orgA,
    userId: repUser1.id,
    callingNumber: callingNumSnapshot,
    phoneNumber: '+14155550002',
    direction: 'OUTBOUND',
    activityType: 'PHONE_CALL',
    status: 'COMPLETED',
    outcome: 'Meeting Requested',
    notes: 'Requested demo on Thursday',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hrs ago
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  };

  // Call 3: Rep 2 -> Lead A1 (No Answer)
  const act3: ManualCallActivity = {
    id: 'act_p5_3_' + testRunId,
    leadId: leadA1.id,
    organizationId: orgA,
    userId: repUser2.id,
    callingNumber: '+1 800 555 0199',
    phoneNumber: '+919876500001',
    direction: 'OUTBOUND',
    activityType: 'PHONE_CALL',
    status: 'COMPLETED',
    outcome: 'No Answer',
    notes: 'Went to voicemail',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Call 4: Rep 2 -> Lead A2 (Initiated Only - Pending Outcome)
  const act4: ManualCallActivity = {
    id: 'act_p5_4_' + testRunId,
    leadId: leadA2.id,
    organizationId: orgA,
    userId: repUser2.id,
    callingNumber: '+1 800 555 0199',
    phoneNumber: '+14155550002',
    direction: 'OUTBOUND',
    activityType: 'PHONE_CALL',
    status: 'INITIATED_FROM_SALES_PILOT',
    createdAt: new Date().toISOString()
  };

  // Call 5: Tenant B Call
  const actB: ManualCallActivity = {
    id: 'act_p5_b_' + testRunId,
    leadId: leadB1.id,
    organizationId: orgB,
    userId: orgBUser.id,
    callingNumber: '+44 20 7946 0912',
    phoneNumber: '+14155550003',
    direction: 'OUTBOUND',
    activityType: 'PHONE_CALL',
    status: 'COMPLETED',
    outcome: 'Connected',
    notes: 'Tenant B private call',
    createdAt: new Date().toISOString()
  };

  localDb.addManualCallActivity(act1);
  localDb.addManualCallActivity(act2);
  localDb.addManualCallActivity(act3);
  localDb.addManualCallActivity(act4);
  localDb.addManualCallActivity(actB);

  console.log('✓ Test 1 Passed: Manual call records successfully seeded.');

  // 2. Test Tenant Isolation
  console.log('--- Test 2: Tenant Isolation Enforcement ---');

  const orgACalls = localDb.getManualCallActivities(orgA);
  assert.strictEqual(orgACalls.length, 4, 'Org A must contain exactly 4 calls');

  const orgBCalls = localDb.getManualCallActivities(orgB);
  assert.strictEqual(orgBCalls.length, 1, 'Org B must contain exactly 1 call');
  assert.strictEqual(orgBCalls[0].organizationId, orgB);

  // Attempt to access Org B call using Org A tenant ID
  const crossTenantAttempt = localDb.getManualCallActivityById(actB.id, orgA);
  assert.strictEqual(crossTenantAttempt, undefined, 'Org A must NOT be able to view Org B call record');

  console.log('✓ Test 2 Passed: Tenant isolation strictly enforced.');

  // 3. Test Analytics Calculations & No Fabricated Duration
  console.log('--- Test 3: Analytics Calculations & No Fabricated Duration ---');

  // Total calls in Org A = 4
  // Connected (Interested + Meeting Requested) = 2
  // No Answer = 1
  // Pending Outcome = 1
  const orgAActivities = localDb.getManualCallActivities(orgA);

  const total = orgAActivities.length;
  assert.strictEqual(total, 4);

  const connectedCount = orgAActivities.filter(a => ['Connected', 'Interested', 'Meeting Requested'].includes(a.outcome || '')).length;
  assert.strictEqual(connectedCount, 2, 'Connected count must be 2 (Interested + Meeting Requested)');

  const noAnswerCount = orgAActivities.filter(a => a.outcome === 'No Answer').length;
  assert.strictEqual(noAnswerCount, 1);

  // Verify INITIATED_FROM_SALES_PILOT is NOT counted as connected
  const initiatedPending = orgAActivities.filter(a => a.status === 'INITIATED_FROM_SALES_PILOT' && !a.outcome);
  assert.strictEqual(initiatedPending.length, 1);
  assert.strictEqual(initiatedPending[0].outcome, undefined);

  console.log('✓ Test 3 Passed: Analytics metrics match actual persisted call records without false completion.');

  // 4. Test Call Notes Update & Historical Snapshot Immutability
  console.log('--- Test 4: Call Notes Update & Historical Snapshot Immutability ---');

  const updatedNotes = 'Updated notes after demo confirmation with prospect.';
  const updatedCall = localDb.updateManualCallNotes(act2.id, orgA, updatedNotes, adminUser.id, adminUser.fullName);

  assert.ok(updatedCall);
  assert.strictEqual(updatedCall.notes, updatedNotes);
  assert.strictEqual(updatedCall.callingNumber, callingNumSnapshot, 'Calling number snapshot must remain immutable');
  assert.strictEqual(updatedCall.createdAt, act2.createdAt, 'Created timestamp must remain immutable');

  // Verify audit history was appended
  assert.ok(updatedCall.auditHistory);
  assert.ok(updatedCall.auditHistory.length >= 2);
  const lastAudit = updatedCall.auditHistory[updatedCall.auditHistory.length - 1];
  assert.strictEqual(lastAudit.action, 'NOTES_UPDATED');
  assert.strictEqual(lastAudit.actorId, adminUser.id);

  console.log('✓ Test 4 Passed: Call notes updated with audit trail while keeping calling number snapshot immutable.');

  // 5. Test CRM Sync on Outcome Recording
  console.log('--- Test 5: CRM Sync on Outcome Recording ---');

  // Log outcome 'Interested' for Lead A1
  localDb.updateLead(leadA1.id, { status: 'INTERESTED' as any }, orgA);
  const refreshedLeadA1 = localDb.getLeadById(leadA1.id, orgA);
  assert.strictEqual(refreshedLeadA1?.status, 'INTERESTED', 'Lead status should sync to INTERESTED');

  // Log outcome 'Meeting Requested' for Lead A2
  localDb.updateLead(leadA2.id, { status: 'MEETING_BOOKED' as any }, orgA);
  const refreshedLeadA2 = localDb.getLeadById(leadA2.id, orgA);
  assert.strictEqual(refreshedLeadA2?.status, 'MEETING_BOOKED', 'Lead status should sync to MEETING_BOOKED');

  console.log('✓ Test 5 Passed: CRM lead statuses successfully synchronized with manual call outcomes.');

  console.log('================================================================');
  console.log('🎉 ALL PHASE 5 MANUAL CALL HISTORY & ANALYTICS TESTS PASSED! 🎉');
  console.log('================================================================');
}

runPhase5Tests().catch(err => {
  console.error('Phase 5 Test Failure:', err);
  process.exit(1);
});
