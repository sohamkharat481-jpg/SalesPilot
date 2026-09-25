import { LocalDB } from '../database/localDb';
import { WorkspaceUser } from '../types';

declare const describe: any;
declare const it: any;
declare const expect: any;

if (typeof describe === 'function') {
  describe('SalesPilot Multi-User Personal Calling Identity & Verification State Suite', () => {
    it('runs calling verification state and identity tests', async () => {
      const result = await runPersonalCallingIdentityTestSuite();
      expect(result.failed).toBe(0);
      expect(result.passed).toBeGreaterThan(0);
    });
  });
}

export async function runPersonalCallingIdentityTestSuite() {
  console.log('=== STARTING PERSONAL CALLING IDENTITY & VERIFICATION TEST SUITE ===');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  };

  const db = LocalDB.getInstance();

  const TEST_ORG_1 = 'org_call_ver_1_' + Date.now();
  const TEST_ORG_2 = 'org_call_ver_2_' + Date.now();

  const userA: WorkspaceUser = {
    id: 'usr_ver_a',
    email: 'usera@calling.com',
    fullName: 'User A',
    companyName: 'Company A',
    industry: 'SaaS',
    role: 'OWNER',
    organizationId: TEST_ORG_1,
    tier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  const userB: WorkspaceUser = {
    id: 'usr_ver_b',
    email: 'userb@calling.com',
    fullName: 'User B',
    companyName: 'Company A',
    industry: 'SaaS',
    role: 'MEMBER',
    organizationId: TEST_ORG_1,
    tier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  const userC: WorkspaceUser = {
    id: 'usr_ver_c',
    email: 'userc@calling.com',
    fullName: 'User C',
    companyName: 'Company B',
    industry: 'SaaS',
    role: 'OWNER',
    organizationId: TEST_ORG_2,
    tier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  db.db.users.push(userA, userB, userC);

  // Helper for case-insensitive verification check
  const isCnVerified = (cn: any) => {
    if (!cn) return false;
    if (cn.isVerified === true) return true;
    const stat = String(cn.verificationStatus || '').trim().toUpperCase();
    return stat === 'VERIFIED';
  };

  // 1. Verified number => calling enabled
  const cnVerified = db.addCallingNumber({
    userId: userA.id,
    organizationId: TEST_ORG_1,
    phoneNumber: '+15551112222',
    countryCode: '+1',
    isVerified: true,
    isDefault: true
  });
  assert(isCnVerified(cnVerified), 'Test 1: Verified number correctly recognized as verified');

  // 2. Pending number => calling blocked
  const cnPending = db.addCallingNumber({
    userId: userA.id,
    organizationId: TEST_ORG_1,
    phoneNumber: '+15553334444',
    countryCode: '+1',
    isVerified: false,
    isDefault: false
  });
  // Simulate setting pending status
  (cnPending as any).verificationStatus = 'PENDING_VERIFICATION';
  assert(!isCnVerified(cnPending), 'Test 2: Pending number correctly recognized as unverified');

  // 3. Revoked number => calling blocked
  const cnRevoked = db.addCallingNumber({
    userId: userA.id,
    organizationId: TEST_ORG_1,
    phoneNumber: '+15555556666',
    countryCode: '+1',
    isVerified: false,
    isDefault: false
  });
  (cnRevoked as any).verificationStatus = 'REVOKED';
  assert(!isCnVerified(cnRevoked), 'Test 3: Revoked number correctly recognized as unverified');

  // 4. Verified number belonging to another user => calling blocked
  const cnUserB = db.getCallingNumberById(cnVerified.id, TEST_ORG_1, userB.id);
  assert(cnUserB === undefined, 'Test 4: Verified number belonging to User A cannot be accessed by User B');

  // 5. Verified number from another tenant => calling blocked
  const cnTenant2 = db.getCallingNumberById(cnVerified.id, TEST_ORG_2, userC.id);
  assert(cnTenant2 === undefined, 'Test 5: Verified number from Tenant 1 cannot be accessed by Tenant 2');

  // 6. Authenticated user with verified default => default selected
  const userANumbers = db.getCallingNumbers(TEST_ORG_1, userA.id);
  const selectedDefault = userANumbers.find(cn => cn.isDefault && isCnVerified(cn));
  assert(selectedDefault?.id === cnVerified.id, 'Test 6: Authenticated user verified default number correctly selected');

  // 7. Authenticated user with verified non-default => usable and can be made default
  const cnNonDefault = db.addCallingNumber({
    userId: userB.id,
    organizationId: TEST_ORG_1,
    phoneNumber: '+15557778888',
    countryCode: '+1',
    isVerified: true,
    isDefault: true // default for userB
  });
  const cnNonDefault2 = db.addCallingNumber({
    userId: userB.id,
    organizationId: TEST_ORG_1,
    phoneNumber: '+15559990000',
    countryCode: '+1',
    isVerified: true,
    isDefault: false
  });
  assert(isCnVerified(cnNonDefault2), 'Test 7a: Non-default verified number is usable');
  
  db.setDefaultCallingNumber(cnNonDefault2.id, userB.id, TEST_ORG_1);
  const updatedUserBNumbers = db.getCallingNumbers(TEST_ORG_1, userB.id);
  const newDefault = updatedUserBNumbers.find(cn => cn.isDefault);
  assert(newDefault?.id === cnNonDefault2.id, 'Test 7b: Non-default verified number successfully set as default');

  console.log(`=== PERSONAL CALLING IDENTITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}
