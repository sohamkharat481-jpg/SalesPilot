import assert from 'assert';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { LocalDB } from '../database/localDb';
import { calculateCanonicalPayablePrice, normalizePlanId, CANONICAL_PLANS } from '../payments/pricingConfig';
import { getUpiBillingConfig } from '../payments/upiConfig';

const localDb = LocalDB.instance;

export async function runUpiTestModeTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING CANONICAL UPI BILLING & PRODUCTION PLANS TEST SUITE ===');
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

  await test('1. Canonical plans include only FREE_TRIAL, STARTER, GROWTH, BUSINESS, ENTERPRISE', () => {
    const validPlans = Object.keys(CANONICAL_PLANS);
    assert.deepStrictEqual(validPlans.sort(), ['BUSINESS', 'ENTERPRISE', 'FREE_TRIAL', 'GROWTH', 'STARTER'].sort());
  });

  await test('2. Obsolete TEST_PAYMENT plan input safely normalizes to STARTER', () => {
    const normalized = normalizePlanId('TEST_PAYMENT');
    assert.strictEqual(normalized, 'STARTER', 'TEST_PAYMENT must normalize to default STARTER plan');
  });

  await test('3. Canonical payable prices with 18% GST match production standards exactly', () => {
    const starter = calculateCanonicalPayablePrice('STARTER', 'monthly');
    assert.strictEqual(starter.baseAmount, 2499);
    assert.strictEqual(starter.gstAmount, 450);
    assert.strictEqual(starter.totalAmount, 2949);

    const growth = calculateCanonicalPayablePrice('GROWTH', 'monthly');
    assert.strictEqual(growth.baseAmount, 5999);
    assert.strictEqual(growth.gstAmount, 1080);
    assert.strictEqual(growth.totalAmount, 7079);

    const business = calculateCanonicalPayablePrice('BUSINESS', 'monthly');
    assert.strictEqual(business.baseAmount, 11999);
    assert.strictEqual(business.gstAmount, 2160);
    assert.strictEqual(business.totalAmount, 14159);

    const enterprise = calculateCanonicalPayablePrice('ENTERPRISE', 'monthly');
    assert.strictEqual(enterprise.baseAmount, 29999);
    assert.strictEqual(enterprise.gstAmount, 5400);
    assert.strictEqual(enterprise.totalAmount, 35399);
  });

  await test('4. Production VPA is configured as sohamkharat85@oksbi', () => {
    const upiConfig = getUpiBillingConfig();
    assert.strictEqual(upiConfig.upiId, 'sohamkharat85@oksbi', 'VPA must be sohamkharat85@oksbi');
  });

  await test('5. Commercial payment submission and verification activates subscription and tax invoice', async () => {
    const orgId = 'org_billing_test_' + Date.now();
    const userId = 'usr_billing_test_' + Date.now();
    
    localDb.addOrganization({ id: orgId, name: 'Canonical Billing Org', tier: 'FREE_TRIAL' } as any);
    localDb.addUser({ id: userId, email: 'customer@company.com', organizationId: orgId, tier: 'FREE_TRIAL', role: 'OWNER' } as any);

    // 1. Submit Commercial Payment
    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'GROWTH',
      billingCycle: 'monthly',
      utr: 'UTR_GROWTH_' + Date.now(),
      notes: 'Customer growth tier subscription'
    });
    
    assert(submitRes.success, 'Payment submission should succeed');
    assert.strictEqual(submitRes.payment?.amount, 7079, 'Amount must be ₹7,079 (₹5,999 + 18% GST)');
    assert.strictEqual(submitRes.payment?.plan, 'GROWTH');
    assert.strictEqual(submitRes.payment?.payment_status, 'PENDING_VERIFICATION');
    
    // 2. Approve Payment
    const approveRes = await UpiPaymentService.approvePayment(submitRes.payment!.id, 'usr_admin');
    assert(approveRes.success, 'Payment approval should succeed');
    assert.strictEqual(approveRes.payment?.payment_status, 'VERIFIED');
    
    // 3. Verify subscription was created and activated
    assert(approveRes.subscription, 'Subscription must be activated');
    assert.strictEqual(approveRes.subscription.status, 'ACTIVE');
    assert.strictEqual(approveRes.subscription.plan, 'GROWTH');

    // 4. Verify tax invoice was issued
    assert(approveRes.invoice, 'Tax invoice must be generated');
    assert.strictEqual(approveRes.invoice.base_amount, 5999);
    assert.strictEqual(approveRes.invoice.gst_amount, 1080);
    assert.strictEqual(approveRes.invoice.total_amount, 7079);
  });

  console.log(`=== CANONICAL UPI BILLING & PRODUCTION PLANS RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runUpiTestModeTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
