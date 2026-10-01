import assert from 'assert';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { LocalDB } from '../database/localDb';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';
import { calculateCanonicalPayablePrice, normalizePlanId, CANONICAL_PLANS } from '../payments/pricingConfig';
import { getUpiBillingConfig } from '../payments/upiConfig';

const localDb = LocalDB.instance;

export async function runUpiTestModeTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING UPI PRODUCTION BILLING & TEST_PAYMENT DEPRECATION TEST SUITE ===');
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

  await test('1. TEST_PAYMENT is removed from CANONICAL_PLANS and normalizes to STARTER', () => {
    assert.strictEqual('TEST_PAYMENT' in CANONICAL_PLANS, false, 'TEST_PAYMENT must not exist in CANONICAL_PLANS');
    const normalized = normalizePlanId('TEST_PAYMENT');
    assert.strictEqual(normalized, 'STARTER', 'TEST_PAYMENT must fallback/normalize to standard STARTER');
  });

  await test('2. Production VPA is configured as sohamkharat85@oksbi for standard subscriptions', () => {
    const upiConfig = getUpiBillingConfig();
    assert.strictEqual(upiConfig.upiId, 'sohamkharat85@oksbi', 'VPA must be sohamkharat85@oksbi');
    assert.strictEqual(upiConfig.businessName, 'SalesPilot CRM Technologies');
  });

  await test('3. Canonical pricing & 18% GST calculation for STARTER (₹2,499) and GROWTH (₹5,999)', () => {
    const starter = calculateCanonicalPayablePrice('STARTER', 'monthly');
    assert.strictEqual(starter.baseAmount, 2499);
    assert.strictEqual(starter.gstAmount, 450); // 18% of 2499 = 449.82 -> 450
    assert.strictEqual(starter.totalAmount, 2949);

    const growth = calculateCanonicalPayablePrice('GROWTH', 'monthly');
    assert.strictEqual(growth.baseAmount, 5999);
    assert.strictEqual(growth.gstAmount, 1080); // 18% of 5999 = 1079.82 -> 1080
    assert.strictEqual(growth.totalAmount, 7079);
  });

  await test('4. Standard subscription submission & admin approval activates commercial tier with invoice', async () => {
    const orgId = 'org_standard_billing_' + Date.now();
    const userId = 'usr_standard_billing_' + Date.now();
    
    localDb.addOrganization({ id: orgId, name: 'Standard Billing Org', tier: 'FREE_TRIAL' } as any);
    localDb.addUser({ id: userId, email: 'customer.pilot@company.com', organizationId: orgId, tier: 'FREE_TRIAL', role: 'OWNER' } as any);

    // 1. Submit Commercial Payment
    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'STARTER',
      billingCycle: 'monthly',
      utr: 'UTR_STD_' + Date.now(),
      notes: 'Monthly starter subscription'
    });
    
    assert(submitRes.success, 'Standard payment submission should succeed');
    assert.strictEqual(submitRes.payment?.amount, 2949, 'Amount must be ₹2,949 for STARTER');
    assert.strictEqual(submitRes.payment?.plan, 'STARTER');
    assert.strictEqual(submitRes.payment?.payment_status, 'PENDING_VERIFICATION');
    
    // 2. Approve Payment
    const approveRes = await UpiPaymentService.approvePayment(submitRes.payment!.id, 'usr_admin');
    assert(approveRes.success, 'Standard payment approval should succeed');
    assert.strictEqual(approveRes.payment?.payment_status, 'VERIFIED');
    
    // 3. Verify subscription was activated
    assert(approveRes.subscription, 'Subscription must be activated for commercial plans');
    assert.strictEqual(approveRes.subscription?.plan, 'STARTER');
    assert.strictEqual(approveRes.subscription?.status, 'ACTIVE');

    // 4. Verify GST Invoice was generated
    assert(approveRes.invoice, 'GST tax invoice must be issued');
    assert.strictEqual(approveRes.invoice?.plan, 'STARTER');
    assert.strictEqual(approveRes.invoice?.status, 'PAID');

    // 5. Verify user tier was updated
    const user = localDb.getUserById(userId);
    assert.strictEqual(user?.tier, 'STARTER', 'User tier must be upgraded to STARTER');
  });

  console.log(`=== UPI PRODUCTION BILLING TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runUpiTestModeTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
