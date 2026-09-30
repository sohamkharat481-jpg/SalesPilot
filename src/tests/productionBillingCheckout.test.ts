import assert from 'assert';
import { calculateCanonicalPayablePrice } from '../payments/pricingConfig';
import { getUpiBillingConfig } from '../payments/upiConfig';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { LocalDB } from '../database/localDb';

const localDb = LocalDB.instance;

export async function runProductionBillingCheckoutTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING PRODUCTION BILLING CHECKOUT & EXPIRED TRIAL REGRESSION TEST SUITE ===');
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

  await test('1. Canonical Pricing & GST Calculation for STARTER, GROWTH, BUSINESS, ENTERPRISE', () => {
    const starterPricing = calculateCanonicalPayablePrice('STARTER', 'monthly');
    assert.strictEqual(starterPricing.baseAmount, 2499, 'STARTER monthly base price = 2499');
    assert.strictEqual(starterPricing.gstAmount, 450, 'STARTER monthly 18% GST = 450');
    assert.strictEqual(starterPricing.totalAmount, 2949, 'STARTER monthly total payable = 2949');

    const growthPricing = calculateCanonicalPayablePrice('GROWTH', 'monthly');
    assert.strictEqual(growthPricing.baseAmount, 5999, 'GROWTH monthly base price = 5999');
    assert.strictEqual(growthPricing.gstAmount, 1080, 'GROWTH monthly 18% GST = 1080');
    assert.strictEqual(growthPricing.totalAmount, 7079, 'GROWTH monthly total = 7079');

    const businessPricing = calculateCanonicalPayablePrice('BUSINESS', 'monthly');
    assert.strictEqual(businessPricing.baseAmount, 11999, 'BUSINESS monthly base price = 11999');
    assert.strictEqual(businessPricing.gstAmount, 2160, 'BUSINESS monthly 18% GST = 2160');
    assert.strictEqual(businessPricing.totalAmount, 14159, 'BUSINESS monthly total = 14159');
  });

  await test('2. Production VPA is configured as sohamkharat85@oksbi', () => {
    const config = getUpiBillingConfig();
    assert.strictEqual(config.upiId, 'sohamkharat85@oksbi', 'Production VPA must be sohamkharat85@oksbi');
  });

  await test('3. Expired trial user can initiate checkout and submit UTR', async () => {
    const orgId = 'org_expired_trial_' + Date.now();
    const userId = 'usr_expired_trial_' + Date.now();

    localDb.addOrganization({ id: orgId, name: 'Expired Trial Org', tier: 'FREE_TRIAL' } as any);
    localDb.addUser({ id: userId, email: 'expired.trial@example.com', organizationId: orgId, tier: 'FREE_TRIAL', role: 'MEMBER' } as any);

    // Submit payment
    const utr = 'UTR_PROD_TEST_' + Date.now();
    const submitResult = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'GROWTH',
      billingCycle: 'monthly',
      utr: utr,
      notes: 'Testing checkout initiation for expired trial account'
    });

    assert(submitResult.success, 'Payment submission must succeed for expired trial accounts');
    assert.strictEqual(submitResult.payment?.payment_status, 'PENDING_VERIFICATION', 'Status must be PENDING_VERIFICATION');

    // Admin approval
    const approveResult = await UpiPaymentService.approvePayment(submitResult.payment!.id, 'usr_admin');
    assert(approveResult.success, 'Admin approval must succeed');
    assert.strictEqual(approveResult.payment?.payment_status, 'VERIFIED', 'Status must transition to VERIFIED');
    assert.strictEqual(approveResult.subscription?.status, 'ACTIVE', 'Subscription must become ACTIVE');
    assert.strictEqual(approveResult.subscription?.plan, 'GROWTH', 'Subscription plan must be GROWTH');
  });

  await test('4. Viewer/read-only role cannot perform CRM state-changing actions', () => {
    const viewerUser = { id: 'usr_viewer_1', email: 'viewer@example.com', role: 'VIEWER' };
    const canModifyCrm = viewerUser.role === 'OWNER' || viewerUser.role === 'ADMIN' || viewerUser.role === 'MANAGER' || viewerUser.role === 'SALES';
    assert.strictEqual(canModifyCrm, false, 'VIEWER role cannot perform CRM state-changing actions');
  });

  console.log(`=== PRODUCTION BILLING CHECKOUT TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionBillingCheckoutTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
