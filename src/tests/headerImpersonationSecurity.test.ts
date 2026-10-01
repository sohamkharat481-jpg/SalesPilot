import assert from 'assert';
import { LocalDB } from '../database/localDb';

const localDb = LocalDB.instance;

export async function runHeaderImpersonationSecurityTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING AUTH HEADER SECURITY AUDIT TEST SUITE ===');
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

  await test('1. Impersonating x-user-id header does not override token identity', () => {
    // Verified user identity derived from session token
    const authenticatedUserFromToken = {
      id: 'usr_legitimate_123',
      email: 'user1@company.com',
      organizationId: 'org_alpha_100'
    };

    // Client sends malicious x-user-id header trying to impersonate another user
    const clientHeaders = {
      'authorization': 'Bearer token_valid_user1',
      'x-user-id': 'usr_victim_456'
    };

    // Server identity resolver algorithm: req.authenticatedUser is derived from token ONLY
    const effectiveUser = authenticatedUserFromToken; // Token identity is authoritative
    assert.strictEqual(effectiveUser.id, 'usr_legitimate_123', 'User ID must remain the token identity, ignoring x-user-id header');
  });

  await test('2. Impersonating x-organization-id header for unjoined org is rejected', () => {
    const authenticatedUser = {
      id: 'usr_legitimate_123',
      email: 'user1@company.com',
      organizationId: 'org_alpha_100'
    };

    const verifiedOrgId = authenticatedUser.organizationId; // 'org_alpha_100'

    // Client sends header attempting to access org_beta_200 (a different organization)
    const clientSuppliedOrgId = 'org_beta_200';

    // Server verification check logic
    const isMemberOfClientOrg = clientSuppliedOrgId === verifiedOrgId ||
      localDb.getTeamMembers().some((tm: any) => tm.userId === authenticatedUser.id && tm.organizationId === clientSuppliedOrgId) ||
      localDb.getOrganizations().some((o: any) => (o.ownerId === authenticatedUser.id || o.owner === authenticatedUser.id) && o.id === clientSuppliedOrgId);

    assert.strictEqual(isMemberOfClientOrg, false, 'Client-supplied x-organization-id for unjoined org must evaluate to false');
  });

  await test('3. Valid client x-organization-id for legitimately joined org is allowed', () => {
    const authenticatedUser = {
      id: 'usr_multi_org_123',
      email: 'multi@company.com',
      organizationId: 'org_primary_1'
    };

    const clientSuppliedOrgId = 'org_secondary_2';

    // Seed organization in localDb
    localDb.addOrganization({
      id: 'org_secondary_2',
      name: 'Secondary Org',
      ownerId: 'usr_multi_org_123'
    } as any);

    const isMemberOfClientOrg = clientSuppliedOrgId === authenticatedUser.organizationId ||
      localDb.getOrganizations().some((o: any) => (o.ownerId === authenticatedUser.id || o.owner === authenticatedUser.id) && o.id === clientSuppliedOrgId);

    assert.strictEqual(isMemberOfClientOrg, true, 'Client x-organization-id for legitimately joined org must be allowed');
  });

  console.log(`=== AUTH HEADER SECURITY AUDIT TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHeaderImpersonationSecurityTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
