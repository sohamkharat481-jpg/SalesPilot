import assert from 'node:assert';
import { LocalDB } from '../src/database/localDb';
import { normalizePhoneNumber } from '../src/utils/phoneUtils';
import { CallingNumber, ManualCallActivity } from '../src/types/voice';

async function runCallingNumbersTests() {
  console.log('--- Starting Multi-User Calling Number Management Tests ---');

  const localDb = LocalDB.getInstance();
  const testRunId = Date.now().toString(36);
  const orgA = 'org_cn_a_' + testRunId;
  const orgB = 'org_cn_b_' + testRunId;
  const userA = 'user_cn_john_' + testRunId;
  const userB = 'user_cn_jane_' + testRunId;

  // 1. Add First Calling Number (Auto-Default)
  console.log('--- Test 1: Add First Calling Number (Auto-Default) ---');
  
  const num1 = localDb.addCallingNumber({
    userId: userA,
    organizationId: orgA,
    phoneNumber: '+91 74986 30805',
    countryCode: '+91',
    isVerified: true
  });

  assert.ok(num1.id);
  assert.strictEqual(num1.userId, userA);
  assert.strictEqual(num1.organizationId, orgA);
  assert.strictEqual(num1.phoneNumber, '+91 74986 30805');
  assert.strictEqual(num1.isDefault, true, 'First calling number must automatically be default');
  assert.strictEqual(num1.isVerified, true);

  console.log('✓ Test 1 Passed: First number successfully set as default.');

  // 2. Add Second Calling Number & Set Default Logic
  console.log('--- Test 2: Add Second Calling Number & Set Default Logic ---');

  const num2 = localDb.addCallingNumber({
    userId: userA,
    organizationId: orgA,
    phoneNumber: '+1 415 555 0188',
    countryCode: '+1',
    isVerified: true,
    isDefault: true // Explicitly requested as default
  });

  assert.strictEqual(num2.isDefault, true);

  // Re-fetch userA's calling numbers to verify num1 is no longer default
  const userANumbers = localDb.getCallingNumbers(orgA, userA);
  assert.strictEqual(userANumbers.length, 2);

  const num1Updated = userANumbers.find(cn => cn.id === num1.id);
  assert.strictEqual(num1Updated?.isDefault, false, 'Old default number must be unset when new default is set');

  console.log('✓ Test 2 Passed: Second number added and default flag updated correctly.');

  // 3. Duplicate Phone Number Rejection
  console.log('--- Test 3: Rejection of Duplicate Calling Number ---');

  assert.throws(() => {
    localDb.addCallingNumber({
      userId: userA,
      organizationId: orgA,
      phoneNumber: '+91 74986 30805', // Same as num1
      countryCode: '+91'
    });
  }, /Duplicate phone number/, 'Must throw error on duplicate phone number for same user/org');

  console.log('✓ Test 3 Passed: Duplicate phone number successfully rejected.');

  // 4. Update Calling Number & Set Default Method
  console.log('--- Test 4: Update Calling Number & Set Default Method ---');

  localDb.setDefaultCallingNumber(num1.id, userA, orgA);
  const reUpdatedANumbers = localDb.getCallingNumbers(orgA, userA);

  const num1NowDefault = reUpdatedANumbers.find(cn => cn.id === num1.id);
  const num2NowNotDefault = reUpdatedANumbers.find(cn => cn.id === num2.id);

  assert.strictEqual(num1NowDefault?.isDefault, true);
  assert.strictEqual(num2NowNotDefault?.isDefault, false);

  console.log('✓ Test 4 Passed: setDefaultCallingNumber updated default status correctly.');

  // 5. Cross-User and Cross-Tenant Isolation
  console.log('--- Test 5: Cross-User and Cross-Tenant Isolation ---');

  // User B in Org A
  const numUserB = localDb.addCallingNumber({
    userId: userB,
    organizationId: orgA,
    phoneNumber: '+44 20 7946 0912',
    countryCode: '+44'
  });

  // Query User A numbers again - should not include User B numbers
  const onlyUserANumbers = localDb.getCallingNumbers(orgA, userA);
  assert.strictEqual(onlyUserANumbers.length, 2);
  assert.ok(!onlyUserANumbers.some(cn => cn.userId === userB));

  // User A trying to get/update User B's number should return undefined
  const crossUserFetch = localDb.getCallingNumberById(numUserB.id, orgA, userA);
  assert.strictEqual(crossUserFetch, undefined, 'User A cannot access User B calling number');

  // User trying to access across Org B
  const crossOrgFetch = localDb.getCallingNumberById(numUserB.id, orgB, userB);
  assert.strictEqual(crossOrgFetch, undefined, 'Cannot access calling number from wrong organization');

  console.log('✓ Test 5 Passed: Strict tenant and user isolation enforced.');

  // 6. Manual Call Initiation with Calling Number Snapshot Logging
  console.log('--- Test 6: Manual Call Logging with Calling Number Snapshot ---');

  const leadA = localDb.saveLead({
    id: 'lead_cn_test_1',
    organizationId: orgA,
    name: 'Robert Thorne',
    company: 'Apex Logistics',
    phone: '+91 98765 43210',
    status: 'NEW' as any,
    createdAt: new Date().toISOString()
  } as any);

  // Initiate manual call using num1
  const manualActivity: ManualCallActivity = {
    id: 'act_cn_test_1',
    leadId: leadA.id,
    organizationId: orgA,
    userId: userA,
    callingNumberId: num1.id,
    callingNumber: num1.phoneNumber,
    phoneNumber: leadA.phone,
    direction: 'OUTBOUND',
    activityType: 'PHONE_CALL',
    status: 'INITIATED_FROM_SALES_PILOT',
    createdAt: new Date().toISOString()
  };

  localDb.addManualCallActivity(manualActivity);

  // Verify historical activity log
  const history = localDb.getManualCallActivities(orgA, leadA.id);
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0].callingNumberId, num1.id);
  assert.strictEqual(history[0].callingNumber, '+91 74986 30805');
  assert.strictEqual(history[0].phoneNumber, '+91 98765 43210');

  console.log('✓ Test 6 Passed: Call activity recorded with calling number snapshot.');

  // 7. Removing Calling Number & Default Re-assignment without deleting history
  console.log('--- Test 7: Remove Calling Number & Default Re-assignment ---');

  // Remove num1 (which is currently default)
  const remainingNumbers = localDb.removeCallingNumber(num1.id, userA, orgA);
  assert.strictEqual(remainingNumbers.length, 1);
  assert.strictEqual(remainingNumbers[0].id, num2.id);
  assert.strictEqual(remainingNumbers[0].isDefault, true, 'Remaining number must automatically become default when old default is deleted');

  // Verify historical call activity still exists intact
  const historyAfterDelete = localDb.getManualCallActivities(orgA, leadA.id);
  assert.strictEqual(historyAfterDelete.length, 1, 'Historical call log must NOT be deleted when calling number is removed');
  assert.strictEqual(historyAfterDelete[0].callingNumber, '+91 74986 30805', 'Historical snapshot preserved');

  console.log('✓ Test 7 Passed: Calling number removed, default re-assigned, historical logs preserved.');

  console.log('\n==================================================');
  console.log('🎉 ALL CALLING NUMBER MANAGEMENT TESTS PASSED! 🎉');
  console.log('==================================================\n');
}

runCallingNumbersTests().catch(err => {
  console.error('❌ Calling Number Test Failure:', err);
  process.exit(1);
});
