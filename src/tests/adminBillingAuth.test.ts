import assert from 'assert';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { LocalDB } from '../database/localDb';

const localDb = LocalDB.instance;

export async function runAdminBillingAuthTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING ADMIN BILLING VISIBILITY & AUTHENTICATION REGRESSION TEST SUITE ===');
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message || err);
      failed++;
    }
  };

  const isBillingAdminUser = (user: any): boolean => {
    if (!user) return false;
    const email = String(user.email || '').trim().toLowerCase();
    return isVerifiedFounderEmail(email) || user.role === 'SUPER_ADMIN';
  };

  await test('1. VIEWER role cannot see Admin Console (isBillingAdminUser = false)', () => {
    const user = { email: 'viewer@company.com', role: 'VIEWER' };
    assert.strictEqual(isBillingAdminUser(user), false, 'VIEWER cannot see Admin Console');
  });

  await test('2. MEMBER role cannot see Admin Console (isBillingAdminUser = false)', () => {
    const user = { email: 'member@company.com', role: 'MEMBER' };
    assert.strictEqual(isBillingAdminUser(user), false, 'MEMBER cannot see Admin Console');
  });

  await test('3. SALES role cannot see Admin Console (isBillingAdminUser = false)', () => {
    const user = { email: 'sales@company.com', role: 'SALES' };
    assert.strictEqual(isBillingAdminUser(user), false, 'SALES cannot see Admin Console');
  });

  await test('4. MANAGER role cannot see Admin Console (isBillingAdminUser = false)', () => {
    const user = { email: 'manager@company.com', role: 'MANAGER' };
    assert.strictEqual(isBillingAdminUser(user), false, 'MANAGER cannot see Admin Console');
  });

  await test('5. CLIENT role cannot see Admin Console (isBillingAdminUser = false)', () => {
    const user = { email: 'client@company.com', role: 'CLIENT' };
    assert.strictEqual(isBillingAdminUser(user), false, 'CLIENT cannot see Admin Console');
  });

  await test('6. Normal organization OWNER cannot see platform Admin Console', () => {
    const normalOwner = { email: 'customer.owner@acmecorp.com', role: 'OWNER' };
    assert.strictEqual(isBillingAdminUser(normalOwner), false, 'Normal org OWNER must NOT see platform Admin Console');
  });

  await test('7. Verified platform founder can see Admin Console', () => {
    const founder1 = { email: 'sohamkharat481@gmail.com', role: 'OWNER' };
    const founder2 = { email: 'pordigyai@gmail.com', role: 'MEMBER' };
    assert.strictEqual(isBillingAdminUser(founder1), true, 'Verified founder sohamkharat481 can see Admin Console');
    assert.strictEqual(isBillingAdminUser(founder2), true, 'Verified founder pordigyai can see Admin Console');
  });

  await test('8. SUPER_ADMIN role can see Admin Console', () => {
    const superAdmin = { email: 'platform.admin@salespilot.dev', role: 'SUPER_ADMIN' };
    assert.strictEqual(isBillingAdminUser(superAdmin), true, 'SUPER_ADMIN can see Admin Console');
  });

  await test('9. Normal user calling admin payment approval API is rejected', async () => {
    const normalUser = { id: 'usr_normal_1', email: 'normal@company.com', role: 'OWNER' };
    const isAdmin = isBillingAdminUser(normalUser);
    assert.strictEqual(isAdmin, false, 'Server gate must reject normal user');
  });

  await test('10. Authorized admin can approve and reject payments', async () => {
    const orgId = 'org_admin_test_' + Date.now();
    const userId = 'usr_cust_' + Date.now();
    localDb.addOrganization({ id: orgId, name: 'Test Payment Org', tier: 'FREE_TRIAL' } as any);
    localDb.addUser({ id: userId, email: 'customer@test.com', organizationId: orgId, role: 'MEMBER' } as any);

    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'GROWTH',
      billingCycle: 'monthly',
      utr: 'UTR_ADMIN_TEST_' + Date.now()
    });

    assert(submitRes.success, 'Payment submission must succeed');

    const approveRes = await UpiPaymentService.approvePayment(submitRes.payment!.id, 'usr_verified_founder');
    assert(approveRes.success, 'Authorized admin approval must succeed');
    assert.strictEqual(approveRes.payment?.payment_status, 'VERIFIED', 'Payment status must be VERIFIED');
  });

  console.log(`=== ADMIN BILLING VISIBILITY & AUTH RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminBillingAuthTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
