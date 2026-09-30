import assert from 'assert';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { LocalDB } from '../database/localDb';

export async function runUpiTestModeTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING UPI TEST MODE TEST SUITE ===');
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

  await test('TEST_PAYMENT is verified but does not activate subscription', async () => {
    const orgId = 'org_test_mode_' + Date.now();
    const userId = 'usr_test_mode_' + Date.now();
    
    // 1. Submit Test Payment
    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'TEST_PAYMENT',
      billingCycle: 'monthly',
      utr: 'TEST_UTR_' + Date.now(),
      notes: 'Test payment mode validation'
    });
    
    assert(submitRes.success, 'Test payment submission should succeed');
    const paymentId = submitRes.payment!.id;
    
    // 2. Approve Test Payment
    const approveRes = await UpiPaymentService.approvePayment(paymentId, 'usr_admin');
    assert(approveRes.success, 'Test payment approval should succeed');
    assert.strictEqual(approveRes.payment?.payment_status, 'VERIFIED');
    
    // 3. Verify NO subscription was created
    assert.strictEqual(approveRes.subscription, null, 'Subscription should NOT be activated for TEST_PAYMENT');
  });

  console.log(`=== UPI TEST MODE TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runUpiTestModeTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
