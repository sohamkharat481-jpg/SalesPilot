import assert from 'assert';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { LocalDB } from '../database/localDb';
const localDb = LocalDB.instance;
import { calculateCanonicalPayablePrice } from '../payments/pricingConfig';

export async function runExpiredTrialCheckoutTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING EXPIRED TRIAL CHECKOUT TEST SUITE ===');
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

  await test('Expired trial user can select and checkout paid plan', async () => {
    const orgId = 'org_expired_' + Date.now();
    const userId = 'usr_expired_' + Date.now();
    
    // 1. Setup expired user in localDb
    localDb.addOrganization({ id: orgId, name: 'Expired Org', tier: 'FREE_TRIAL' } as any);
    localDb.addUser({ id: userId, email: 'expired@test.com', organizationId: orgId, tier: 'FREE_TRIAL', role: 'MEMBER' } as any);

    // 2. Pricing verification
    const pricing = calculateCanonicalPayablePrice('STARTER', 'monthly');
    assert.strictEqual(pricing.totalPayable, 2949, 'Should calculate STARTER monthly correctly');

    // 3. Initiate checkout (mocking API flow)
    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'STARTER',
      billingCycle: 'monthly',
      utr: 'UTR_EXPIRED_PAYMENT_' + Date.now(),
    });
    assert(submitRes.success, 'Checkout initiation should succeed even if trial is expired');

    // 4. Admin approve payment
    const approveRes = await UpiPaymentService.approvePayment(submitRes.payment!.id, 'usr_admin_admin');
    assert(approveRes.success, 'Admin approval should succeed');
    assert.strictEqual(approveRes.payment?.payment_status, 'VERIFIED');
    assert.strictEqual(approveRes.subscription?.status, 'ACTIVE', 'Subscription should be active');
    assert.ok(approveRes.invoice, 'Invoice should be generated');
  });

  console.log(`=== EXPIRED TRIAL CHECKOUT TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}
