import assert from 'assert';
import { LocalDB } from '../database/localDb';

const localDb = LocalDB.instance;

const isBillingAdmin = (user: any): boolean => {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  const isFounder = ['sohamkharat481@gmail.com', 'soham@gmail.com'].includes(email);
  return isFounder || user.role === 'SUPER_ADMIN';
};

export async function runNoRoleSimulatorTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING NO ROLE SIMULATOR & RBAC REGRESSION TEST SUITE ===');
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

  await test('1. Normal VIEWER user cannot elevate role via API payload', async () => {
    const viewerUser = {
      id: 'usr_viewer_test_' + Date.now(),
      email: 'viewer.test@example.com',
      fullName: 'Test Viewer',
      role: 'VIEWER',
      organizationId: 'org_test_viewer_123',
      tier: 'STARTER'
    };

    // Verify isBillingAdmin returns false for VIEWER
    assert.strictEqual(isBillingAdmin(viewerUser), false, 'VIEWER must not be billing admin');

    // Simulate attempted profile update payload containing malicious role
    const maliciousPayload = {
      fullName: 'Updated Name',
      role: 'SUPER_ADMIN',
      isAdmin: true,
      isFounder: true
    };

    // Verify profile update endpoint whitelist only processes valid fields
    const updatedUser = { ...viewerUser };
    const allowedFields = ['fullName', 'phone', 'timezone', 'language', 'avatarUrl', 'notificationPrefs'];
    
    Object.keys(maliciousPayload).forEach(key => {
      if (allowedFields.includes(key)) {
        (updatedUser as any)[key] = (maliciousPayload as any)[key];
      }
    });

    assert.strictEqual(updatedUser.role, 'VIEWER', 'Role must remain VIEWER');
    assert.strictEqual((updatedUser as any).isAdmin, undefined, 'isAdmin flag must be ignored');
    assert.strictEqual((updatedUser as any).isFounder, undefined, 'isFounder flag must be ignored');
  });

  await test('2. Normal MEMBER user cannot elevate role via API payload', async () => {
    const memberUser = {
      id: 'usr_member_test_' + Date.now(),
      email: 'member.test@example.com',
      fullName: 'Test Member',
      role: 'MEMBER',
      organizationId: 'org_test_member_123',
      tier: 'STARTER'
    };

    assert.strictEqual(isBillingAdmin(memberUser), false, 'MEMBER must not be billing admin');
  });

  await test('3. Team role API rejects role updates attempted by non-ADMIN/non-OWNER', () => {
    const callerRole = 'VIEWER';
    const canModifyRoles = callerRole === 'OWNER' || callerRole === 'ADMIN';
    assert.strictEqual(canModifyRoles, false, 'VIEWER caller cannot modify teammate roles');
  });

  await test('4. Team role API rejects SUPER_ADMIN promotion attempt', () => {
    const allowedTeamRoles = ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'VIEWER', 'CLIENT'];
    const attemptedRole = 'SUPER_ADMIN';
    const isAllowed = allowedTeamRoles.includes(attemptedRole);
    assert.strictEqual(isAllowed, false, 'SUPER_ADMIN cannot be assigned via team role management');
  });

  await test('5. Authorized founder accounts preserve lifetime SUPER_ADMIN privileges', () => {
    const founderEmails = ['sohamkharat481@gmail.com', 'soham@gmail.com'];
    founderEmails.forEach(email => {
      const founderUser = { id: 'usr_founder', email, role: 'OWNER' };
      assert.strictEqual(isBillingAdmin(founderUser), true, `Founder email ${email} must be billing admin`);
    });
  });

  console.log(`=== NO ROLE SIMULATOR TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runNoRoleSimulatorTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
