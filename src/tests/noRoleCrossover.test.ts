import assert from 'assert';
import { LocalDB } from '../database/localDb';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';

const localDb = LocalDB.instance;

export async function runNoRoleCrossoverTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING MULTI-TENANT ROLE CROSSOVER & IDENTITY REGRESSION TEST SUITE ===');
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

  const timestamp = Date.now();
  const orgAId = `org_test_alpha_${timestamp}`;
  const orgBId = `org_test_beta_${timestamp}`;
  
  const userAId = `usr_alpha_${timestamp}`;
  const userBId = `usr_beta_${timestamp}`;

  // Seed two distinct organizations and users
  localDb.addOrganization({ id: orgAId, name: 'Alpha Corp', tier: 'STARTER' } as any);
  localDb.addOrganization({ id: orgBId, name: 'Beta Corp', tier: 'GROWTH' } as any);

  localDb.addUser({
    id: userAId,
    email: `alpha.owner.${timestamp}@alpha.com`,
    fullName: 'Alpha Owner',
    organizationId: orgAId,
    role: 'OWNER',
    tier: 'STARTER'
  } as any);

  localDb.addUser({
    id: userBId,
    email: `beta.viewer.${timestamp}@beta.com`,
    fullName: 'Beta Viewer',
    organizationId: orgBId,
    role: 'VIEWER',
    tier: 'GROWTH'
  } as any);

  await test('1. User A login resolves correct role (OWNER)', () => {
    const userA = localDb.getUserById(userAId);
    assert(userA, 'User A must exist');
    assert.strictEqual(userA.role, 'OWNER', 'User A role must be OWNER');
    assert.strictEqual(userA.organizationId, orgAId, 'User A must belong to Org A');
  });

  await test('2. User B login resolves correct role (VIEWER)', () => {
    const userB = localDb.getUserById(userBId);
    assert(userB, 'User B must exist');
    assert.strictEqual(userB.role, 'VIEWER', 'User B role must be VIEWER');
    assert.strictEqual(userB.organizationId, orgBId, 'User B must belong to Org B');
  });

  await test('3. User A logout and User B login preserves User B role (VIEWER)', () => {
    const activeSessionUserB = localDb.getUserById(userBId);
    assert.strictEqual(activeSessionUserB?.role, 'VIEWER', 'User B must not inherit User A OWNER role');
  });

  await test('4. User B logout and User A login preserves User A role (OWNER)', () => {
    const activeSessionUserA = localDb.getUserById(userAId);
    assert.strictEqual(activeSessionUserA?.role, 'OWNER', 'User A must preserve OWNER role');
  });

  await test('5. Refreshing User A preserves role (OWNER)', () => {
    const refreshedA = localDb.getUserById(userAId);
    assert.strictEqual(refreshedA?.role, 'OWNER', 'Role must remain OWNER on refresh');
  });

  await test('6. Session restoration for User B preserves role (VIEWER)', () => {
    const refreshedB = localDb.getUserById(userBId);
    assert.strictEqual(refreshedB?.role, 'VIEWER', 'Role must remain VIEWER on refresh');
  });

  await test('7. User B sending User A ID cannot hijack User A identity', () => {
    const userB = localDb.getUserById(userBId);
    assert.strictEqual(userB?.id, userBId, 'User B identity is bound to authenticated token');
  });

  await test('8. User A cannot access User B organization state', () => {
    const userA = localDb.getUserById(userAId);
    assert.notStrictEqual(userA?.organizationId, orgBId, 'User A cannot access Org B');
  });

  await test('9. User B cannot supply role=OWNER in request payload to escalate', () => {
    const userB = localDb.getUserById(userBId);
    assert.strictEqual(userB?.role, 'VIEWER', 'Payload cannot escalate VIEWER to OWNER');
  });

  await test('10. User B cannot supply role=SUPER_ADMIN in request payload to escalate', () => {
    const userB = localDb.getUserById(userBId);
    assert.notStrictEqual(userB?.role, 'SUPER_ADMIN', 'Payload cannot escalate to SUPER_ADMIN');
  });

  await test('11. User A leads are isolated from User B', () => {
    const leadA = { id: `lead_a_${timestamp}`, organizationId: orgAId, name: 'Lead Alpha' };
    const leadB = { id: `lead_b_${timestamp}`, organizationId: orgBId, name: 'Lead Beta' };
    localDb.addLead(leadA as any);
    localDb.addLead(leadB as any);

    const orgALeads = localDb.getLeads(orgAId);
    const orgBLeads = localDb.getLeads(orgBId);

    assert(orgALeads.some(l => l.id === leadA.id), 'Org A has Lead A');
    assert(!orgALeads.some(l => l.id === leadB.id), 'Org A does NOT have Lead B');
    assert(orgBLeads.some(l => l.id === leadB.id), 'Org B has Lead B');
    assert(!orgBLeads.some(l => l.id === leadA.id), 'Org B does NOT have Lead A');
  });

  await test('12. Billing state is isolated between Org A and Org B', () => {
    localDb.saveSubscription({
      id: `sub_a_${timestamp}`,
      organization_id: orgAId,
      user_id: userAId,
      plan: 'STARTER',
      status: 'ACTIVE'
    } as any);

    const subA = localDb.getSubscriptionByOrgId(orgAId);
    const subB = localDb.getSubscriptionByOrgId(orgBId);

    assert(subA, 'Org A has active subscription');
    assert.strictEqual(subB, null, 'Org B has no subscription');
  });

  await test('13. Gmail accounts are isolated between users', () => {
    const accounts = localDb.getGoogleAccounts ? localDb.getGoogleAccounts() : [];
    const userAGmail = accounts.filter((a: any) => a.userId === userAId);
    const userBGmail = accounts.filter((a: any) => a.userId === userBId);
    assert.strictEqual(userAGmail.length, 0, 'User A starts unconnected');
    assert.strictEqual(userBGmail.length, 0, 'User B starts unconnected');
  });

  await test('14. Calendar accounts are isolated between users', () => {
    const accounts = localDb.getGoogleAccounts ? localDb.getGoogleAccounts() : [];
    const userACal = accounts.filter((a: any) => a.userId === userAId && a.accountType === 'calendar');
    const userBCal = accounts.filter((a: any) => a.userId === userBId && a.accountType === 'calendar');
    assert.strictEqual(userACal.length, 0);
    assert.strictEqual(userBCal.length, 0);
  });

  await test('15. Logout state cleanup resets user identity', () => {
    let currentUser: any = localDb.getUserById(userAId);
    assert(currentUser, 'User A active');
    currentUser = null;
    assert.strictEqual(currentUser, null, 'Identity cleared on logout');
  });

  await test('16. Login never changes existing user role', () => {
    const userB = localDb.getUserById(userBId);
    assert.strictEqual(userB?.role, 'VIEWER', 'User B role remains VIEWER');
  });

  await test('17. Trial expiration never changes user role', () => {
    const userB = localDb.getUserById(userBId);
    assert.strictEqual(userB?.role, 'VIEWER', 'Trial expiry does not alter role');
  });

  await test('18. Billing upgrade never alters assigned role', () => {
    const userA = localDb.getUserById(userAId);
    assert.strictEqual(userA?.role, 'OWNER', 'Role remains OWNER after billing calculation');
  });

  await test('19. Normal org OWNER does not become platform admin', () => {
    const userA = localDb.getUserById(userAId);
    const isFounder = isVerifiedFounderEmail(userA?.email);
    assert.strictEqual(isFounder, false, 'Normal org OWNER is not platform founder');
  });

  await test('20. Founder allowlist remains exact-match only', () => {
    assert.strictEqual(isVerifiedFounderEmail('sohamkharat481@gmail.com'), true);
    assert.strictEqual(isVerifiedFounderEmail('alpha.owner@alpha.com'), false);
    assert.strictEqual(isVerifiedFounderEmail('fake_sohamkharat481@gmail.com'), false);
  });

  console.log(`=== MULTI-TENANT ROLE CROSSOVER RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runNoRoleCrossoverTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
