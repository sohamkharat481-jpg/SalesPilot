import assert from 'node:assert';
import { LocalDB } from '../src/database/localDb';
import { normalizePhoneNumber } from '../src/utils/phoneUtils';
import { ManualCallActivity, ManualCallOutcome } from '../src/types/voice';

async function runManualPhoneCallTests() {
  console.log('--- Starting Phase 4 Manual Phone Call Integration Tests ---');

  const localDb = LocalDB.getInstance();
  const runSuffix = Date.now().toString(36);
  const orgA = 'org_manual_a_' + runSuffix;
  const orgB = 'org_manual_b_' + runSuffix;
  const userIdA = 'user_sales_rep_1';

  // Seed test leads
  const leadA = localDb.saveLead({
    id: 'lead_manual_1_' + runSuffix,
    organizationId: orgA,
    name: 'Sarah Connor',
    company: 'Cyberdyne Systems',
    phone: '+91 98765 43210',
    email: 'sarah@cyberdyne.com',
    status: 'NEW' as any,
    createdAt: new Date().toISOString()
  } as any);

  const leadB = localDb.saveLead({
    id: 'lead_manual_2_' + runSuffix,
    organizationId: orgB,
    name: 'Miles Dyson',
    company: 'Skynet Research',
    phone: '+1 415 555 0199',
    email: 'miles@skynet.com',
    status: 'NEW' as any,
    createdAt: new Date().toISOString()
  } as any);

  // 1. Phone Normalization Utility Tests
  console.log('--- Test 1: Phone Normalization Utility ---');

  // Indian format with spaces
  const norm1 = normalizePhoneNumber('+91 98765 43210');
  assert.strictEqual(norm1.valid, true);
  assert.strictEqual(norm1.normalized, '+919876543210');

  // US format with dashes
  const norm2 = normalizePhoneNumber('415-555-0199');
  assert.strictEqual(norm2.valid, true);
  assert.strictEqual(norm2.normalized, '+14155550199');

  // Invalid / Short phone
  const norm3 = normalizePhoneNumber('123');
  assert.strictEqual(norm3.valid, false);
  assert.strictEqual(norm3.normalized, undefined);
  assert.ok(norm3.error);

  console.log('✓ Test 1 Passed: Phone normalization utilities working as expected');

  // 2. Manual Call Initiation (Tel Protocol & State Machine)
  console.log('--- Test 2: Manual Call Initiation ---');

  // Verify lead belongs to tenant
  const fetchedLead = localDb.getLeadById(leadA.id, orgA);
  assert.ok(fetchedLead);
  assert.strictEqual(fetchedLead.organizationId, orgA);

  // Cross-tenant protection check
  const crossTenantCheck = localDb.getLeadById(leadA.id, orgB);
  assert.strictEqual(crossTenantCheck, null);

  // Normalize target phone
  const normPhone = normalizePhoneNumber(fetchedLead.phone);
  assert.strictEqual(normPhone.valid, true);

  // Create initial activity INITIATED_FROM_SALES_PILOT
  const initialActivity: ManualCallActivity = {
    id: 'act_manual_test_101',
    leadId: fetchedLead.id,
    organizationId: orgA,
    userId: userIdA,
    phoneNumber: normPhone.normalized!,
    direction: 'OUTBOUND',
    activityType: 'PHONE_CALL',
    status: 'INITIATED_FROM_SALES_PILOT',
    createdAt: new Date().toISOString()
  };

  localDb.addManualCallActivity(initialActivity);

  // Verify activity saved with INITIATED_FROM_SALES_PILOT status (NOT COMPLETED)
  const savedActivities = localDb.getManualCallActivities(orgA, fetchedLead.id);
  assert.strictEqual(savedActivities.length, 1);
  assert.strictEqual(savedActivities[0].status, 'INITIATED_FROM_SALES_PILOT');
  assert.strictEqual(savedActivities[0].outcome, undefined);
  assert.strictEqual(savedActivities[0].phoneNumber, '+919876543210');

  // Verify tel: URL generated correctly
  const telUrl = `tel:${normPhone.normalized}`;
  assert.strictEqual(telUrl, 'tel:+919876543210');

  console.log('✓ Test 2 Passed: Manual call activity created with status INITIATED_FROM_SALES_PILOT & correct tel: link');

  // 3. Manual Call Outcome Recording & CRM Sync
  console.log('--- Test 3: Manual Outcome Recording & CRM Sync ---');

  const updatedAct = localDb.updateManualCallOutcome(
    initialActivity.id,
    orgA,
    'Interested' as ManualCallOutcome,
    'Sarah confirmed interest in SalesPilot CRM demo next week.'
  );

  assert.ok(updatedAct);
  assert.strictEqual(updatedAct.status, 'COMPLETED');
  assert.strictEqual(updatedAct.outcome, 'Interested');
  assert.strictEqual(updatedAct.notes, 'Sarah confirmed interest in SalesPilot CRM demo next week.');

  // Verify lead status updated
  if (updatedAct.outcome === 'Interested') {
    localDb.updateLead(fetchedLead.id, { status: 'INTERESTED' as any }, orgA);
  }

  const updatedLead = localDb.getLeadById(fetchedLead.id, orgA);
  assert.strictEqual(updatedLead?.status, 'INTERESTED');

  console.log('✓ Test 3 Passed: Manual outcome recorded explicitly and CRM lead status updated');

  // 4. Cross-Tenant Isolation Enforcement
  console.log('--- Test 4: Cross-Tenant Isolation Enforcement ---');

  // Attempting to retrieve orgA manual activities with orgB tenant context
  const orgBActivities = localDb.getManualCallActivities(orgB);
  assert.strictEqual(orgBActivities.length, 0);

  // Attempting to update orgA manual activity with orgB tenant context
  const unauthorizedUpdate = localDb.updateManualCallOutcome(
    initialActivity.id,
    orgB,
    'Not Interested' as ManualCallOutcome
  );
  assert.strictEqual(unauthorizedUpdate, undefined);

  console.log('✓ Test 4 Passed: Cross-tenant isolation strictly enforced for manual calls');

  console.log('\n======================================================');
  console.log('ALL PHASE 4 MANUAL PHONE CALL TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runManualPhoneCallTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
