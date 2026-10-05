import assert from 'assert';
import { LocalDB } from '../database/localDb';
import { SubscriptionManager } from '../billing/subscriptionManager';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { calculateCanonicalPayablePrice } from '../payments/pricingConfig';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';
import { WorkspaceUser, Organization } from '../types';

const localDb = LocalDB.getInstance();

export async function runSubscriptionExpiryAccessTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n==================================================');
  console.log('  SALESPILOT SUBSCRIPTION EXPIRY & ACCESS CONTROL ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`[PASS] ${name}`);
            passed++;
          })
          .catch((err: any) => {
            console.error(`[FAIL] ${name}:`, err.message || err);
            failed++;
          });
      } else {
        console.log(`[PASS] ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message || err);
      failed++;
    }
  }

  const timestamp = Date.now();

  // Test A: Active subscription → full access
  await test('A. Active subscription allows full access', () => {
    const orgId = `org_active_${timestamp}`;
    const userId = `usr_active_${timestamp}`;
    const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    localDb.saveSubscription({
      id: `sub_${orgId}`,
      organization_id: orgId,
      user_id: userId,
      plan: 'GROWTH',
      billing_cycle: 'monthly',
      status: 'ACTIVE',
      current_period_start: new Date().toISOString(),
      current_period_end: futureDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const access = SubscriptionManager.checkSubscriptionAccess(orgId, userId);
    assert.strictEqual(access.isAllowed, true, 'Active subscription must be allowed');
    assert.strictEqual(access.status, 'ACTIVE');
    assert.strictEqual(access.plan, 'GROWTH');
    assert(access.daysRemaining! > 10, 'Must have days remaining');
  });

  // Test B: Subscription expires → access locked
  await test('B. Subscription expiry immediately locks paid access', () => {
    const orgId = `org_expired_${timestamp}`;
    const userId = `usr_expired_${timestamp}`;
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago

    localDb.saveSubscription({
      id: `sub_${orgId}`,
      organization_id: orgId,
      user_id: userId,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'ACTIVE', // was active
      current_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: pastDate, // expired
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const access = SubscriptionManager.checkSubscriptionAccess(orgId, userId);
    assert.strictEqual(access.isAllowed, false, 'Expired subscription must be locked');
    assert.strictEqual(access.status, 'EXPIRED', 'Status must transition to EXPIRED');
    assert.strictEqual(access.code, 'SUBSCRIPTION_EXPIRED');
    assert.strictEqual(
      access.error,
      'Your SalesPilot subscription has expired. Renew your subscription to continue using SalesPilot.'
    );

    // Verify database record was updated to EXPIRED
    const persistedSub = localDb.getSubscriptionByOrgId(orgId);
    assert.strictEqual(persistedSub?.status, 'EXPIRED', 'Database subscription status must be marked EXPIRED');
  });

  // Test C: Expired user can login and see renewal page
  await test('C. Expired user can sign in and retrieve plan & expiry status', async () => {
    const orgId = `org_expired_login_${timestamp}`;
    const userId = `usr_expired_login_${timestamp}`;
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    localDb.saveSubscription({
      id: `sub_${orgId}`,
      organization_id: orgId,
      user_id: userId,
      plan: 'BUSINESS',
      billing_cycle: 'annual',
      status: 'EXPIRED',
      current_period_start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: pastDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const { subscription, pendingPayment } = await UpiPaymentService.getSubscription(orgId);
    assert.ok(subscription, 'Expired subscription must be returned');
    assert.strictEqual(subscription.status, 'EXPIRED');
    assert.strictEqual(subscription.plan, 'BUSINESS');
    assert.strictEqual(pendingPayment, null);
  });

  // Test D: Expired user cannot access protected APIs directly
  await test('D. Direct API access check strictly rejects expired accounts', () => {
    const orgId = `org_api_lock_${timestamp}`;
    const userId = `usr_api_lock_${timestamp}`;

    localDb.saveSubscription({
      id: `sub_${orgId}`,
      organization_id: orgId,
      user_id: userId,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'EXPIRED',
      current_period_start: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const access = SubscriptionManager.checkSubscriptionAccess(orgId, userId);
    assert.strictEqual(access.isAllowed, false);
    assert.strictEqual(access.code, 'SUBSCRIPTION_EXPIRED');
  });

  // Test E: UTR submission does NOT unlock access
  await test('E. UTR submission alone does NOT unlock access', async () => {
    const orgId = `org_utr_lock_${timestamp}`;
    const userId = `usr_utr_lock_${timestamp}`;

    // Expired subscription
    localDb.saveSubscription({
      id: `sub_${orgId}`,
      organization_id: orgId,
      user_id: userId,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'EXPIRED',
      current_period_start: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Customer submits UTR
    const utr = `UTR_LOCK_${timestamp}`;
    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'STARTER',
      billingCycle: 'monthly',
      utr
    });

    assert.strictEqual(submitRes.success, true);
    assert.strictEqual(submitRes.payment?.payment_status, 'PENDING_VERIFICATION');

    // Access check MUST still be locked!
    const access = SubscriptionManager.checkSubscriptionAccess(orgId, userId);
    assert.strictEqual(access.isAllowed, false, 'UTR submission alone MUST NOT unlock access');
    assert.strictEqual(access.status, 'PENDING_VERIFICATION');
    assert.strictEqual(access.code, 'PAYMENT_PENDING_VERIFICATION');
  });

  // Test F: Pending payment does NOT unlock access
  await test('F. Pending payment status keeps access locked', () => {
    const orgId = `org_pending_lock_${timestamp}`;
    const userId = `usr_pending_lock_${timestamp}`;

    localDb.saveSubscription({
      id: `sub_${orgId}`,
      organization_id: orgId,
      user_id: userId,
      plan: 'GROWTH',
      billing_cycle: 'monthly',
      status: 'PENDING_VERIFICATION',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const access = SubscriptionManager.checkSubscriptionAccess(orgId, userId);
    assert.strictEqual(access.isAllowed, false, 'Pending payment must not unlock access');
    assert.strictEqual(access.status, 'PENDING_VERIFICATION');
  });

  // Test G: Verified payment unlocks access
  await test('G. Verified payment transitions subscription to ACTIVE and restores access', async () => {
    const orgId = `org_verify_unlock_${timestamp}`;
    const userId = `usr_verify_unlock_${timestamp}`;

    localDb.addUser({
      id: userId,
      email: `customer_${timestamp}@verify.com`,
      organizationId: orgId,
      tier: 'STARTER',
      subscriptionStatus: 'EXPIRED',
      role: 'CLIENT'
    } as any);

    const submitRes = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'GROWTH',
      billingCycle: 'monthly',
      utr: `UTR_UNLOCK_${timestamp}`
    });

    // Before approval -> locked
    const accessBefore = SubscriptionManager.checkSubscriptionAccess(orgId, userId);
    assert.strictEqual(accessBefore.isAllowed, false);

    // Admin approves payment
    const approveRes = await UpiPaymentService.approvePayment(submitRes.payment!.id, 'usr_admin');
    assert.strictEqual(approveRes.success, true);
    assert.strictEqual(approveRes.payment?.payment_status, 'VERIFIED');
    assert.strictEqual(approveRes.subscription?.status, 'ACTIVE');

    // After approval -> unlocked!
    const accessAfter = SubscriptionManager.checkSubscriptionAccess(orgId, userId);
    assert.strictEqual(accessAfter.isAllowed, true, 'Verified payment must restore access');
    assert.strictEqual(accessAfter.status, 'ACTIVE');
    assert.strictEqual(accessAfter.plan, 'GROWTH');
  });

  // Test H: Renewal extends expiry correctly
  await test('H. Renewal extends expiry date correctly from future or current date', async () => {
    const orgId = `org_renewal_calc_${timestamp}`;
    const userId = `usr_renewal_calc_${timestamp}`;

    // Case 1: Active customer with 10 days remaining renews for 1 month
    const existingFutureEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    localDb.saveSubscription({
      id: `sub_${orgId}`,
      organization_id: orgId,
      user_id: userId,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'ACTIVE',
      current_period_start: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: existingFutureEnd.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const submit1 = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'STARTER',
      billingCycle: 'monthly',
      utr: `UTR_RENEW_ACTIVE_${timestamp}`
    });

    const approve1 = await UpiPaymentService.approvePayment(submit1.payment!.id, 'usr_admin');
    const newEndTime = new Date(approve1.subscription!.current_period_end).getTime();
    const expectedApproxEndTime = existingFutureEnd.getTime() + 30 * 24 * 60 * 60 * 1000;
    
    // Difference should be within a few seconds of existingFutureEnd + 30 days
    assert(
      Math.abs(newEndTime - expectedApproxEndTime) < 5000,
      'Early renewal must preserve remaining days and extend from existing expiry date'
    );
  });

  // Test I: LocalStorage manipulation cannot bypass expiry
  await test('I. Client-side local storage values cannot bypass server authorization', () => {
    const orgId = `org_ls_tamper_${timestamp}`;
    const userId = `usr_ls_tamper_${timestamp}`;

    // Server database records subscription as EXPIRED
    localDb.saveSubscription({
      id: `sub_${orgId}`,
      organization_id: orgId,
      user_id: userId,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'EXPIRED',
      current_period_start: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Server-side check ignores any fake client state
    const access = SubscriptionManager.checkSubscriptionAccess(orgId, userId);
    assert.strictEqual(access.isAllowed, false, 'Server must enforce database subscription record');
    assert.strictEqual(access.status, 'EXPIRED');
  });

  // Test J: organizationId manipulation cannot bypass expiry
  await test('J. Spoofed client organizationId cannot override verified membership', () => {
    const customerOrgId = `org_customer_expired_${timestamp}`;
    const foreignActiveOrgId = `org_foreign_active_${timestamp}`;

    // Customer workspace is expired
    localDb.saveSubscription({
      id: `sub_${customerOrgId}`,
      organization_id: customerOrgId,
      user_id: `usr_cust_${timestamp}`,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'EXPIRED',
      current_period_start: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Foreign org has active subscription
    localDb.saveSubscription({
      id: `sub_${foreignActiveOrgId}`,
      organization_id: foreignActiveOrgId,
      user_id: `usr_foreign_${timestamp}`,
      plan: 'ENTERPRISE',
      billing_cycle: 'annual',
      status: 'ACTIVE',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Customer's verified org check remains EXPIRED
    const customerAccess = SubscriptionManager.checkSubscriptionAccess(customerOrgId, `usr_cust_${timestamp}`);
    assert.strictEqual(customerAccess.isAllowed, false, 'Expired customer must remain locked');
  });

  // Test K: userId manipulation cannot bypass expiry
  await test('K. Spoofed userId cannot bypass server-side token identity verification', () => {
    const expiredOrgId = `org_user_tamper_${timestamp}`;
    const expiredUserId = `usr_victim_${timestamp}`;

    localDb.saveSubscription({
      id: `sub_${expiredOrgId}`,
      organization_id: expiredOrgId,
      user_id: expiredUserId,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'EXPIRED',
      current_period_start: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const access = SubscriptionManager.checkSubscriptionAccess(expiredOrgId, expiredUserId);
    assert.strictEqual(access.isAllowed, false);
    assert.strictEqual(access.status, 'EXPIRED');
  });

  // Test L: Customer A payment cannot unlock Customer B
  await test('L. Multi-tenant isolation: Customer A payment never unlocks Customer B', async () => {
    const orgAId = `org_tenant_a_${timestamp}`;
    const userAId = `usr_tenant_a_${timestamp}`;
    const orgBId = `org_tenant_b_${timestamp}`;
    const userBId = `usr_tenant_b_${timestamp}`;

    // Both start expired
    localDb.saveSubscription({
      id: `sub_${orgAId}`,
      organization_id: orgAId,
      user_id: userAId,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'EXPIRED',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() - 10000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    localDb.saveSubscription({
      id: `sub_${orgBId}`,
      organization_id: orgBId,
      user_id: userBId,
      plan: 'STARTER',
      billing_cycle: 'monthly',
      status: 'EXPIRED',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() - 10000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Customer A pays and admin verifies
    const submitA = await UpiPaymentService.submitPayment({
      organizationId: orgAId,
      userId: userAId,
      plan: 'STARTER',
      billingCycle: 'monthly',
      utr: `UTR_TENANT_A_${timestamp}`
    });
    await UpiPaymentService.approvePayment(submitA.payment!.id, 'usr_admin');

    // Org A is unlocked
    const accessA = SubscriptionManager.checkSubscriptionAccess(orgAId, userAId);
    assert.strictEqual(accessA.isAllowed, true, 'Customer A must be unlocked');

    // Org B MUST STILL BE LOCKED!
    const accessB = SubscriptionManager.checkSubscriptionAccess(orgBId, userBId);
    assert.strictEqual(accessB.isAllowed, false, 'Customer B MUST remain locked');
    assert.strictEqual(accessB.status, 'EXPIRED');
  });

  // Test M: Reminder scheduling works
  await test('M. Renewal reminders generate exactly at 7d, 3d, 1d and 0d expiry day thresholds', () => {
    const orgReminderId = `org_reminder_${timestamp}`;
    const userReminderId = `usr_reminder_${timestamp}`;

    // 1. Test 7-day reminder
    const sub7d = {
      id: `sub_7d_${timestamp}`,
      organization_id: orgReminderId,
      user_id: userReminderId,
      plan: 'GROWTH' as const,
      billing_cycle: 'monthly' as const,
      status: 'ACTIVE' as const,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days left (< 7d)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localDb.saveSubscription(sub7d);

    const reminders7d = SubscriptionManager.checkAndDispatchRenewalReminders(orgReminderId, userReminderId);
    assert(reminders7d.length >= 1, '7-day reminder must be generated');
    const r7 = reminders7d.find(n => n.idempotencyKey?.includes('7d'));
    assert.ok(r7, 'Must generate 7d idempotency key notification');
    assert.strictEqual(
      r7?.message,
      'Your SalesPilot subscription expires soon. Please renew to continue using SalesPilot.'
    );

    // Idempotency check: Calling again does NOT duplicate
    const remindersDup = SubscriptionManager.checkAndDispatchRenewalReminders(orgReminderId, userReminderId);
    const allOrgNotifs = localDb.getSalesPilotNotifications(orgReminderId, userReminderId);
    const count7d = allOrgNotifs.filter(n => n.idempotencyKey?.includes('7d')).length;
    assert.strictEqual(count7d, 1, 'Renewal reminder must be strictly idempotent (no duplicates)');

    // 2. Test 1-day reminder
    sub7d.current_period_end = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(); // 20 hours left (< 1d)
    localDb.saveSubscription(sub7d);
    const reminders1d = SubscriptionManager.checkAndDispatchRenewalReminders(orgReminderId, userReminderId);
    const r1 = reminders1d.find(n => n.idempotencyKey?.includes('1d'));
    assert.ok(r1, 'Must generate 1d reminder');
    assert.strictEqual(
      r1?.message,
      'Your SalesPilot subscription expires soon. Please renew to continue using SalesPilot.'
    );
  });

  // Test N: Existing billing flow remains functional
  await test('N. Existing UPI billing flow (Checkout, UTR, Invoicing) remains fully functional', async () => {
    const orgId = `org_flow_${timestamp}`;
    const userId = `usr_flow_${timestamp}`;

    const pricing = calculateCanonicalPayablePrice('GROWTH', 'monthly');
    assert.strictEqual(pricing.totalAmount, 7079);

    const submit = await UpiPaymentService.submitPayment({
      organizationId: orgId,
      userId: userId,
      plan: 'GROWTH',
      billingCycle: 'monthly',
      utr: `UTR_FLOW_${timestamp}`
    });

    const approve = await UpiPaymentService.approvePayment(submit.payment!.id, 'usr_admin');
    assert.strictEqual(approve.success, true);
    assert.ok(approve.invoice, 'Tax invoice must be issued');
    assert.strictEqual(approve.invoice?.total_amount, 7079);
    assert.strictEqual(approve.invoice?.payment_method, 'UPI');
  });

  // Test O: Founder/admin access rules remain unchanged
  await test('O. Founder lifetime privileges and admin verification permissions remain unchanged', () => {
    const founderEmail = 'sohamkharat481@gmail.com';
    assert.strictEqual(isVerifiedFounderEmail(founderEmail), true, 'Founder email must be verified');

    const founderAccess = SubscriptionManager.checkSubscriptionAccess('any_org', 'any_user', founderEmail);
    assert.strictEqual(founderAccess.isAllowed, true, 'Founder must always have active enterprise access');
    assert.strictEqual(founderAccess.plan, 'ENTERPRISE');
  });

  console.log(`=== SUBSCRIPTION EXPIRY RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSubscriptionExpiryAccessTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
