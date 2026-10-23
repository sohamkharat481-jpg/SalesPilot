import { LocalDB } from '../database/localDb';
import { isVerifiedFounderEmail, isLifetimeSubscriberEmail } from '../security/founderAllowlist';
import { SubscriptionManager } from '../billing/subscriptionManager';

async function runLifetimeAccessVerification() {
  console.log('=== RUNNING LIFETIME ACCESS GRANT VERIFICATION SUITE ===');

  const localDb = LocalDB.getInstance();
  localDb.ensureDefaultWorkspacesAndMemberships();

  const targetEmail = 'anjanapadhi21@gmail.com';

  // Test 1: Verify exact email allowlist matching
  console.log('\n[TEST 1] Testing allowlist verification...');
  if (!isLifetimeSubscriberEmail(targetEmail)) {
    throw new Error(`FAIL: ${targetEmail} is not recognized by isLifetimeSubscriberEmail.`);
  }
  if (isVerifiedFounderEmail(targetEmail)) {
    throw new Error(`FAIL: ${targetEmail} must NOT be recognized as platform founder!`);
  }
  console.log('PASS: Allowlist correctly identifies lifetime subscriber without granting founder status.');

  // Test 2: Verify user record in localDb
  console.log('\n[TEST 2] Verifying user record in database...');
  const user = localDb.getUserByEmail(targetEmail);
  if (!user) {
    throw new Error(`FAIL: User record for ${targetEmail} not found in database.`);
  }

  console.log(`User Found: ID=${user.id}, Email=${user.email}, Role=${user.role}, Tier=${user.tier}, SubStatus=${user.subscriptionStatus}, OrgID=${user.organizationId}, isFounder=${user.isFounder}`);

  if (user.email.toLowerCase() !== targetEmail) {
    throw new Error(`FAIL: User email mismatch. Expected ${targetEmail}, got ${user.email}`);
  }
  if (user.subscriptionStatus !== 'LIFETIME') {
    throw new Error(`FAIL: subscriptionStatus must be 'LIFETIME'. Got: ${user.subscriptionStatus}`);
  }
  if (user.tier !== 'ENTERPRISE') {
    throw new Error(`FAIL: tier must be 'ENTERPRISE'. Got: ${user.tier}`);
  }
  if (user.isFounder !== false) {
    throw new Error(`FAIL: isFounder must be false! Got: ${user.isFounder}`);
  }
  if (user.organizationId !== 'org_anjana_21') {
    throw new Error(`FAIL: Workspace must be isolated as 'org_anjana_21'. Got: ${user.organizationId}`);
  }
  if (user.role !== 'OWNER') {
    throw new Error(`FAIL: Role must be 'OWNER'. Got: ${user.role}`);
  }
  console.log('PASS: User profile matches all lifetime subscription and tenant isolation requirements.');

  // Test 3: Verify organization record and subscription
  console.log('\n[TEST 3] Verifying organization and subscription records...');
  const org = localDb.getOrganizationById('org_anjana_21');
  if (!org) {
    throw new Error('FAIL: Organization org_anjana_21 not found!');
  }
  if (org.ownerId !== user.id) {
    throw new Error(`FAIL: Org ownerId mismatch. Expected ${user.id}, got ${org.ownerId}`);
  }

  const sub = localDb.getSubscriptionByOrgId('org_anjana_21');
  if (!sub) {
    throw new Error('FAIL: Subscription record sub_anjana_lifetime not found for org_anjana_21!');
  }
  if (sub.subscription_type !== 'LIFETIME') {
    throw new Error(`FAIL: Subscription type must be LIFETIME. Got: ${sub.subscription_type}`);
  }
  if (sub.current_period_end !== null && sub.current_period_end !== undefined) {
    throw new Error(`FAIL: Lifetime subscription must have no expiry date (current_period_end must be null). Got: ${sub.current_period_end}`);
  }
  console.log('PASS: Organization & Subscription record verified with no expiry date.');

  // Test 4: Verify SubscriptionManager access check
  console.log('\n[TEST 4] Verifying SubscriptionManager access check...');
  const accessByEmail = SubscriptionManager.checkSubscriptionAccess('org_anjana_21', user.id, targetEmail);
  if (!accessByEmail.isAllowed || accessByEmail.status !== 'ACTIVE' || accessByEmail.plan !== 'ENTERPRISE') {
    throw new Error(`FAIL: SubscriptionManager denied access or returned unexpected state: ${JSON.stringify(accessByEmail)}`);
  }
  console.log('PASS: SubscriptionManager allows full active Enterprise access.');

  // Test 5: Verify tenant isolation (Ensure other users like Soham & Pordigy remain unaffected)
  console.log('\n[TEST 5] Verifying tenant isolation & non-impact on other accounts...');
  const founder = localDb.getUserByEmail('sohamkharat481@gmail.com');
  if (!founder || founder.organizationId !== 'org_salespilot_lifetime' || !founder.isFounder) {
    throw new Error('FAIL: Founder account modified or affected!');
  }

  const pordigy = localDb.getUserByEmail('pordigyai@gmail.com');
  if (!pordigy || pordigy.organizationId !== 'org_pordigy_enterprise') {
    throw new Error('FAIL: Pordigy account modified or affected!');
  }

  if (user.organizationId === founder.organizationId) {
    throw new Error('FAIL: Anjana user MUST NOT share workspace with founder!');
  }
  console.log('PASS: Workspace tenant isolation verified intact across all accounts.');

  console.log('\n======================================================');
  console.log('SUCCESS: All 9 requirements verified cleanly!');
  console.log('======================================================\n');
}

runLifetimeAccessVerification().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
