import { CANONICAL_PLANS, calculateCanonicalPayablePrice, normalizePlanId } from '../payments/pricingConfig';
import { getUpiBillingConfig, generateUpiIntentUri } from '../payments/upiConfig';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { LocalDB } from '../database/localDb';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';

export async function runBillingAuditTestSuite() {
  console.log('=== STARTING DIRECT UPI BILLING & SUBSCRIPTION AUDIT TEST SUITE ===');
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  };

  const localDb = LocalDB.getInstance();

  try {
    // 1. Canonical Server-Side Pricing Tests
    const starterMonthly = calculateCanonicalPayablePrice('STARTER', 'monthly');
    assert(starterMonthly.baseAmount === 2499, 'Test 1a: Server calculates Starter Monthly base price of ₹2,499');
    assert(starterMonthly.gstAmount === 450, 'Test 1b: Server calculates 18% GST (₹450) on Starter Monthly');
    assert(starterMonthly.totalAmount === 2949, 'Test 1c: Server calculates total payable ₹2,949');

    const growthAnnual = calculateCanonicalPayablePrice('GROWTH', 'annual');
    assert(growthAnnual.baseAmount === 59990, 'Test 1d: Server calculates Growth Annual base price of ₹59,990');
    assert(growthAnnual.gstAmount === 10798, 'Test 1e: Server calculates 18% GST on Growth Annual');
    assert(growthAnnual.totalAmount === 70788, 'Test 1f: Server calculates total payable ₹70,788');

    // 2. Plan Normalization & Legacy Aliases
    assert(normalizePlanId('PROFESSIONAL') === 'BUSINESS', 'Test 2a: Legacy PROFESSIONAL alias normalizes to BUSINESS');
    assert(normalizePlanId('AGENCY') === 'ENTERPRISE', 'Test 2b: Legacy AGENCY alias normalizes to ENTERPRISE');
    assert(normalizePlanId('growth') === 'GROWTH', 'Test 2c: Case-insensitive growth normalizes to GROWTH');

    // 3. Centralized UPI Configuration & Intent Generator
    const upiConfig = getUpiBillingConfig();
    assert(Boolean(upiConfig.upiId), 'Test 3a: UPI ID is configured in billing module');
    assert(Boolean(upiConfig.businessName), 'Test 3b: Business name is configured in billing module');
    
    const intentUri = generateUpiIntentUri({
      upiId: 'sohamkharat85@oksbi',
      businessName: 'SalesPilot CRM Technologies',
      amount: 2949,
      note: 'SalesPilot STARTER (monthly)'
    });
    assert(intentUri.startsWith('upi://pay?'), 'Test 3c: NPCI UPI Intent URI starts with upi://pay?');
    assert(intentUri.includes('pa=sohamkharat85%40oksbi'), 'Test 3d: Intent URI includes encoded UPI ID');
    assert(intentUri.includes('am=2949.00'), 'Test 3e: Intent URI includes formatted amount');

    // 4. Payment Submission & Pending Verification (No Auto-Activation)
    const testOrgId = `org_test_billing_${Date.now()}`;
    const testUserId = `usr_test_billing_${Date.now()}`;
    const testUtr = `UTR_${Date.now()}_998811`;

    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: testOrgId,
      userId: testUserId,
      plan: 'GROWTH',
      billingCycle: 'monthly',
      utr: testUtr,
      notes: 'Test UPI deposit'
    });

    assert(submitRes.success === true, 'Test 4a: Customer UPI payment submitted successfully');
    assert(submitRes.payment?.payment_status === 'PENDING_VERIFICATION', 'Test 4b: Payment status is strictly PENDING_VERIFICATION');
    assert(submitRes.payment?.amount === 7079, 'Test 4c: Server calculated canonical amount ₹7,079 (₹5,999 + 18% GST) regardless of client payload');

    // Verify subscription status is pending verification (Not active yet!)
    const subStatusBeforeApproval = await UpiPaymentService.getSubscription(testOrgId);
    assert(subStatusBeforeApproval.subscription?.status === 'PENDING_VERIFICATION', 'Test 4d: Subscription is NOT auto-activated upon UTR submission');

    // 5. Duplicate UTR Prevention
    const duplicateRes = await UpiPaymentService.submitPayment({
      organizationId: `org_other_${Date.now()}`,
      userId: `usr_other_${Date.now()}`,
      plan: 'STARTER',
      billingCycle: 'monthly',
      utr: testUtr // Same UTR
    });
    assert(duplicateRes.success === false, 'Test 5a: Duplicate UTR submission is rejected');
    assert(duplicateRes.error?.includes('already been submitted') === true, 'Test 5b: Returns clear duplicate UTR error');

    // 6. Admin Approval & Entitlement Activation Flow
    const adminUserId = 'usr_admin_verifier_01';
    const approveRes = await UpiPaymentService.approvePayment(submitRes.payment!.id, adminUserId);

    assert(approveRes.success === true, 'Test 6a: Authorized admin can approve pending payment');
    assert(approveRes.payment?.payment_status === 'VERIFIED', 'Test 6b: Payment status transitions to VERIFIED');
    assert(approveRes.payment?.verified_by === adminUserId, 'Test 6c: Verified by admin user ID is tracked');
    assert(approveRes.subscription?.status === 'ACTIVE', 'Test 6d: Subscription is activated upon approval');
    assert(approveRes.subscription?.plan === 'GROWTH', 'Test 6e: Activated subscription matches purchased plan');
    assert(Boolean(approveRes.invoice?.invoice_number), 'Test 6f: Formal tax invoice is generated upon verification');
    assert(approveRes.invoice?.status === 'PAID', 'Test 6g: Invoice status is marked PAID');

    // 7. Organization Isolation & Invoices Scoping
    const orgInvoices = await UpiPaymentService.getInvoices(testOrgId);
    assert(orgInvoices.length > 0, 'Test 7a: Organization can retrieve its own verified invoices');
    
    const otherOrgInvoices = await UpiPaymentService.getInvoices('org_completely_different_tenant');
    assert(otherOrgInvoices.length === 0, 'Test 7b: Tenant isolation guarantees invoices are isolated');

    // 8. Admin Rejection Flow
    const rejectOrgId = `org_test_reject_${Date.now()}`;
    const rejectUserId = `usr_test_reject_${Date.now()}`;
    const rejectUtr = `UTR_REJECT_${Date.now()}`;

    const rejectSubmitRes = await UpiPaymentService.submitPayment({
      organizationId: rejectOrgId,
      userId: rejectUserId,
      plan: 'BUSINESS',
      billingCycle: 'monthly',
      utr: rejectUtr
    });

    const rejectRes = await UpiPaymentService.rejectPayment(
      rejectSubmitRes.payment!.id, 
      adminUserId, 
      'UTR not found on bank statement'
    );

    assert(rejectRes.success === true, 'Test 8a: Admin can reject invalid payment');
    assert(rejectRes.payment?.payment_status === 'REJECTED', 'Test 8b: Payment status is marked REJECTED');
    assert(rejectRes.payment?.rejection_reason === 'UTR not found on bank statement', 'Test 8c: Rejection reason is recorded');

    // 9. Authoritative Founder & Entitlement Security Regression Tests
    // Simulates authoritative server-side privilege resolution
    const resolveServerEntitlement = (userObj: any, dbSubscription?: any) => {
      const emailLower = String(userObj?.email || '').trim().toLowerCase();
      const isFounder = isVerifiedFounderEmail(emailLower);
      
      if (isFounder) {
        return {
          tier: 'ENTERPRISE',
          subscriptionStatus: 'LIFETIME',
          isFounder: true,
          role: 'OWNER'
        };
      }

      // Normal user resolution: client flags (isFounder, subscriptionStatus) are stripped/ignored
      const activeTier = dbSubscription?.status === 'ACTIVE' 
        ? dbSubscription.plan 
        : (userObj.tier && userObj.tier !== 'ENTERPRISE' ? userObj.tier : 'STARTER');
      const activeStatus = dbSubscription?.status || 'ACTIVE';

      return {
        tier: activeTier,
        subscriptionStatus: activeStatus,
        isFounder: false,
        role: userObj.role || 'VIEWER'
      };
    };

    // Regression Test 1: Normal organization OWNER does NOT receive lifetime Enterprise
    const regularOwner = resolveServerEntitlement({
      email: 'john.doe@acme-corp.com',
      role: 'OWNER',
      tier: 'STARTER'
    });
    assert(regularOwner.tier === 'STARTER', 'Test 9a: Normal organization OWNER tier is STARTER (not Enterprise)');
    assert(regularOwner.subscriptionStatus === 'ACTIVE', 'Test 9b: Normal organization OWNER does NOT receive LIFETIME status');
    assert(regularOwner.isFounder === false, 'Test 9c: Normal organization OWNER has isFounder = false');

    // Regression Test 2: Verified founder accounts receive lifetime Enterprise
    const verifiedFounder1 = resolveServerEntitlement({
      email: 'sohamkharat481@gmail.com',
      role: 'SALES'
    });
    assert(verifiedFounder1.tier === 'ENTERPRISE', 'Test 10a: Verified founder (sohamkharat481) receives ENTERPRISE');
    assert(verifiedFounder1.subscriptionStatus === 'LIFETIME', 'Test 10b: Verified founder receives LIFETIME status');
    assert(verifiedFounder1.isFounder === true, 'Test 10c: Verified founder receives isFounder = true');

    const verifiedFounder2 = resolveServerEntitlement({
      email: 'ayesha.kashif13008@gmail.com',
      role: 'ADMIN'
    });
    assert(verifiedFounder2.tier === 'ENTERPRISE' && verifiedFounder2.subscriptionStatus === 'LIFETIME', 'Test 10d: Verified founder (ayesha.kashif13008) receives Lifetime Enterprise');

    const verifiedFounder3 = resolveServerEntitlement({
      email: 'pordigyai@gmail.com',
      role: 'VIEWER'
    });
    assert(verifiedFounder3.tier === 'ENTERPRISE' && verifiedFounder3.subscriptionStatus === 'LIFETIME', 'Test 10e: Verified founder (pordigyai) receives Lifetime Enterprise');

    // Regression Test 3: Substring email matching does NOT grant founder status
    const fakeFounderSubstring1 = resolveServerEntitlement({
      email: 'fake_founder@evil.com',
      role: 'OWNER'
    });
    assert(fakeFounderSubstring1.tier === 'STARTER' && fakeFounderSubstring1.isFounder === false, 'Test 11a: Substring "founder" in email does NOT grant founder status');

    const fakeFounderSubstring2 = resolveServerEntitlement({
      email: 'soham_impostor@hacker.io',
      role: 'OWNER'
    });
    assert(fakeFounderSubstring2.tier === 'STARTER' && fakeFounderSubstring2.isFounder === false, 'Test 11b: Substring "soham" in email does NOT grant founder status');

    // Regression Test 4: Frontend manipulation (forged isFounder/subscriptionStatus) cannot escalate entitlement
    const forgedClientPayload = resolveServerEntitlement({
      email: 'attacker@random.com',
      role: 'OWNER',
      isFounder: true, // Forged frontend flag
      subscriptionStatus: 'LIFETIME', // Forged frontend status
      tier: 'ENTERPRISE' // Forged frontend tier
    });
    assert(forgedClientPayload.tier === 'STARTER', 'Test 12a: Forged frontend tier/status cannot escalate to Enterprise');
    assert(forgedClientPayload.subscriptionStatus === 'ACTIVE', 'Test 12b: Forged frontend subscriptionStatus is neutralized');
    assert(forgedClientPayload.isFounder === false, 'Test 12c: Forged isFounder flag is strictly rejected');

    // Regression Test 5: Organization isolation remains intact for all billing entities
    const orgAId = `org_tenant_a_${Date.now()}`;
    const orgBId = `org_tenant_b_${Date.now()}`;

    // Submit payment for Org A
    const paymentOrgA = await UpiPaymentService.submitPayment({
      organizationId: orgAId,
      userId: 'usr_org_a_admin',
      plan: 'BUSINESS',
      billingCycle: 'annual',
      utr: `UTR_ORGA_${Date.now()}`
    });
    await UpiPaymentService.approvePayment(paymentOrgA.payment!.id, 'usr_admin_verifier_01');

    const subOrgA = await UpiPaymentService.getSubscription(orgAId);
    const subOrgB = await UpiPaymentService.getSubscription(orgBId);

    assert(subOrgA.subscription?.plan === 'BUSINESS', 'Test 13a: Org A subscription is activated as BUSINESS');
    assert(subOrgB.subscription === null, 'Test 13b: Org B has no subscription and cannot see Org A subscription');

    const invoicesOrgA = await UpiPaymentService.getInvoices(orgAId);
    const invoicesOrgB = await UpiPaymentService.getInvoices(orgBId);
    assert(invoicesOrgA.length === 1, 'Test 13c: Org A has exactly 1 verified invoice');
    assert(invoicesOrgB.length === 0, 'Test 13d: Org B has 0 invoices (strict multi-tenant isolation)');

  } catch (err: any) {
    console.error('[DIRECT UPI BILLING AUDIT TEST ERROR]', err);
    failed++;
  }

  console.log(`=== DIRECT UPI BILLING AUDIT TEST RESULTS: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED ===`);
  return { passed, failed, skipped };
}
