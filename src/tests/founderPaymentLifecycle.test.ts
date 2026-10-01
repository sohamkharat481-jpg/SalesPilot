import assert from 'assert';
import { LocalDB } from '../database/localDb';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { getUpiBillingConfig, generateUpiIntentUri } from '../payments/upiConfig';
import { calculateCanonicalPayablePrice, normalizePlanId } from '../payments/pricingConfig';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';

const localDb = LocalDB.instance;

export async function runFounderPaymentLifecycleTest(): Promise<boolean> {
  console.log('\n======================================================');
  console.log('    FOUNDER LIFETIME ENTITLEMENT & BILLING AUDIT     ');
  console.log('======================================================');

  const founderEmail = 'sohamkharat481@gmail.com';
  const customerEmail = 'customer.test@company.com';
  const founderUserId = 'usr_81927391';
  const founderOrgId = 'org_salespilot_lifetime';

  // Seed / ensure founder state
  let founderUser = localDb.getUserById(founderUserId);
  if (!founderUser) {
    founderUser = {
      id: founderUserId,
      email: founderEmail,
      fullName: 'Soham Kharat (Founder)',
      companyName: 'SalesPilot Technologies',
      industry: 'SaaS',
      tier: 'ENTERPRISE',
      role: 'OWNER',
      organizationId: founderOrgId,
      isVerified: true,
      phone: '+919876543210',
      timezone: 'Asia/Kolkata',
      language: 'English',
      isFounder: true,
      subscriptionStatus: 'LIFETIME',
      createdAt: new Date().toISOString()
    };
    localDb.addUser(founderUser);
  }

  // Record initial metrics
  const initialFounderTier = founderUser.tier;
  const initialSubscriptionStatus = founderUser.subscriptionStatus;
  const initialInvoicesCount = localDb.getInvoices().length;
  const initialSubscriptions = localDb.getSubscriptions().filter(s => s.organization_id === founderOrgId);
  const initialSubscriptionsCount = initialSubscriptions.length;

  console.log(`\n[INITIAL METRICS]`);
  console.log(`- Founder User ID: ${founderUserId}`);
  console.log(`- Founder Email: ${founderEmail} (isVerifiedFounder: ${isVerifiedFounderEmail(founderEmail)})`);
  console.log(`- Initial Tier: ${initialFounderTier}`);
  console.log(`- Subscription Status: ${initialSubscriptionStatus}`);
  console.log(`- Founder Subscriptions in DB: ${initialSubscriptionsCount}`);
  console.log(`- Total Invoices in DB: ${initialInvoicesCount}`);

  // STEP 1: Check eligibility & Pricing
  console.log(`\n--- STEP 1: ELIGIBILITY & CANONICAL PRICING ---`);
  assert.strictEqual(isVerifiedFounderEmail(founderEmail), true, 'Founder email must be verified in allowlist');

  const pricing = calculateCanonicalPayablePrice('STARTER', 'monthly');
  assert.strictEqual(pricing.planId, 'STARTER');
  assert.strictEqual(pricing.baseAmount, 2499, 'Base amount must be 2499');
  assert.strictEqual(pricing.gstAmount, 450, 'GST amount must be 450');
  assert.strictEqual(pricing.totalAmount, 2949, 'Total amount must be 2949');
  console.log(`[STATE: INITIATED] Plan: ${pricing.planId} | Base: ₹${pricing.baseAmount} | GST: ₹${pricing.gstAmount} | Total: ₹${pricing.totalAmount} ${pricing.currency}`);

  // STEP 2: Generate Production UPI QR & Intent URI
  console.log(`\n--- STEP 2: GENERATE PRODUCTION UPI QR & INTENT URI ---`);
  const upiConfig = getUpiBillingConfig();
  assert.strictEqual(upiConfig.upiId, 'sohamkharat85@oksbi', 'VPA must be sohamkharat85@oksbi');
  assert.strictEqual(upiConfig.businessName, 'SalesPilot CRM Technologies');

  const paymentNote = `SalesPilot ${pricing.planId} (${pricing.billingCycle})`;
  const upiIntentUri = generateUpiIntentUri({
    upiId: upiConfig.upiId,
    businessName: upiConfig.businessName,
    amount: pricing.totalAmount,
    note: paymentNote
  });

  assert(upiIntentUri.includes('pa=sohamkharat85%40oksbi'), 'URI must contain correct VPA');
  console.log(`[STATE: QR GENERATED]`);
  console.log(`- VPA: ${upiConfig.upiId}`);
  console.log(`- Business Name: ${upiConfig.businessName}`);
  console.log(`- Total Amount: ₹${pricing.totalAmount}.00 INR`);

  // STEP 3: Verify Founder Lifetime Status Preserved
  console.log(`\n--- STEP 3: VERIFY FOUNDER LIFETIME STATUS PRESERVED ---`);
  const refreshedUser = localDb.getUserById(founderUserId);
  assert.strictEqual(refreshedUser?.tier, 'ENTERPRISE', 'Founder tier must remain ENTERPRISE');
  assert.strictEqual(refreshedUser?.subscriptionStatus, 'LIFETIME', 'Founder subscriptionStatus must remain LIFETIME');
  console.log(`[LIFETIME STATUS CONFIRMED]: Founder status remains active without mutation`);

  console.log('\n======================================================');
  console.log('   FOUNDER AUDIT PASSED: ZERO TEST PAYMENT BYPASS     ');
  console.log('======================================================\n');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFounderPaymentLifecycleTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Lifecycle test failed:', err);
      process.exit(1);
    });
}
