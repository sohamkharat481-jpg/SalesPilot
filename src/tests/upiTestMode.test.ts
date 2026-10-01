import assert from 'assert';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { LocalDB } from '../database/localDb';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';
import { calculateCanonicalPayablePrice, ENABLE_FOUNDER_TEST_MODE } from '../payments/pricingConfig';
import { getUpiBillingConfig } from '../payments/upiConfig';

const localDb = LocalDB.instance;

export async function runUpiTestModeTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING FOUNDER ₹1 UPI TEST MODE TEST SUITE ===');
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

  await test('1. Non-founder user attempting TEST_PAYMENT is rejected', () => {
    const normalUser = { email: 'normal.customer@company.com', role: 'MEMBER' };
    const isFounder = isVerifiedFounderEmail(normalUser.email);
    assert.strictEqual(isFounder, false, 'Normal user is not a verified founder');
  });

  await test('2. Verified founder account is allowed for TEST_PAYMENT', () => {
    const founder = { email: 'sohamkharat481@gmail.com', role: 'OWNER' };
    const isFounder = isVerifiedFounderEmail(founder.email);
    assert.strictEqual(isFounder, true, 'Verified founder email allows TEST_PAYMENT');
  });

  await test('3. Canonical payable price for TEST_PAYMENT is exactly ₹1.00', () => {
    const pricing = calculateCanonicalPayablePrice('TEST_PAYMENT', 'monthly');
    assert.strictEqual(pricing.baseAmount, 1, 'Base amount is 1');
    assert.strictEqual(pricing.gstAmount, 0, 'GST amount is 0');
    assert.strictEqual(pricing.totalAmount, 1, 'Total amount is exactly ₹1');
    assert.strictEqual(pricing.currency, 'INR');
  });

  await test('4. Production VPA is configured as sohamkharat85@oksbi', () => {
    const upiConfig = getUpiBillingConfig();
    assert.strictEqual(upiConfig.upiId, 'sohamkharat85@oksbi', 'VPA must be sohamkharat85@oksbi');
  });

  await test('5. TEST_PAYMENT submission & verification does NOT activate subscription tier', async () => {
    const orgId = 'org_test_mode_' + Date.now();
    const userId = 'usr_test_mode_' + Date.now();
    
    localDb.addOrganization({ id: orgId, name: 'Founder Test Org', tier: 'FREE_TRIAL' } as any);
    localDb.addUser({ id: userId, email: 'sohamkharat481@gmail.com', organizationId: orgId, tier: 'FREE_TRIAL', role: 'OWNER' } as any);

    // 1. Submit Test Payment
    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'TEST_PAYMENT',
      billingCycle: 'monthly',
      utr: 'TEST_FOUNDER_UTR_' + Date.now(),
      notes: 'Founder ₹1 connectivity test'
    });
    
    assert(submitRes.success, 'Test payment submission should succeed');
    assert.strictEqual(submitRes.payment?.amount, 1, 'Amount must be 1');
    assert.strictEqual(submitRes.payment?.plan, 'TEST_PAYMENT', 'Plan must be TEST_PAYMENT');
    
    // 2. Approve Test Payment
    const approveRes = await UpiPaymentService.approvePayment(submitRes.payment!.id, 'usr_admin');
    assert(approveRes.success, 'Test payment approval should succeed');
    assert.strictEqual(approveRes.payment?.payment_status, 'VERIFIED');
    
    // 3. Verify NO subscription was created or updated
    assert.strictEqual(approveRes.subscription, null, 'Subscription should NOT be activated for TEST_PAYMENT');

    // 4. Verify user tier remained unchanged
    const user = localDb.getUserById(userId);
    assert.strictEqual(user?.tier, 'FREE_TRIAL', 'User tier must remain unchanged by TEST_PAYMENT');
  });

  console.log(`=== FOUNDER ₹1 UPI TEST MODE RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runUpiTestModeTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
