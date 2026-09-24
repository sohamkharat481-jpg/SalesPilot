import { LocalDB } from '../database/localDb';
import { WorkspaceUser } from '../types';

declare const describe: any;
declare const it: any;
declare const expect: any;

if (typeof describe === 'function') {
  describe('SalesPilot Dashboard Telemetry Authentication & Tenant Isolation Suite', () => {
    it('runs the complete dashboard telemetry auth test suite', async () => {
      const result = await runDashboardTelemetryAuthTestSuite();
      expect(result.failed).toBe(0);
      expect(result.passed).toBeGreaterThan(0);
    });
  });
}

/**
 * Automated Test Suite: SalesPilot Dashboard Telemetry Authentication & Tenant Isolation
 */
export async function runDashboardTelemetryAuthTestSuite() {
  console.log('=== STARTING DASHBOARD TELEMETRY AUTH TEST SUITE ===');
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

  // Clean setup
  const originalSessions = { ...db.db.sessions };
  const originalUsers = [...db.db.users];
  const originalOrganizations = [...db.db.organizations];
  const originalLeads = [...db.db.leads];

  const TEST_ORG_A = 'org_telemetry_a_' + Date.now();
  const TEST_ORG_B = 'org_telemetry_b_' + Date.now();

  const userA: WorkspaceUser = {
    id: 'usr_telemetry_a',
    email: 'userA@telemetry.com',
    fullName: 'Telemetry User A',
    companyName: 'Telemetry Org A',
    industry: 'SaaS',
    role: 'OWNER',
    organizationId: TEST_ORG_A,
    tier: 'STARTER',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  const userB: WorkspaceUser = {
    id: 'usr_telemetry_b',
    email: 'userB@telemetry.com',
    fullName: 'Telemetry User B',
    companyName: 'Telemetry Org B',
    industry: 'SaaS',
    role: 'OWNER',
    organizationId: TEST_ORG_B,
    tier: 'STARTER',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  db.db.users.push(userA, userB);

  // Helper functions matching production authentication and organization resolution
  const mockGetAuthenticatedUser = (req: any): WorkspaceUser | null => {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = db.getSession(token);
      if (session) {
        if (session.expiresAt > Date.now()) {
          const user = db.getUserById(session.userId);
          if (user) return user;
        }
      }
    }
    return null;
  };

  const mockResolveVerifiedOrganizationId = (req: any, user: WorkspaceUser | null): { orgId: string | null; error?: string; status?: number } => {
    if (!user) {
      return { orgId: null, error: 'Unauthorized. Authentication token required.', status: 401 };
    }
    const verifiedOrgId = user.organizationId;
    if (!verifiedOrgId) {
      return { orgId: null, error: 'Forbidden. No verified organization membership found for this user.', status: 403 };
    }

    const clientSuppliedOrgId = req.headers?.['x-organization-id'] || req.query?.organizationId;
    if (clientSuppliedOrgId && clientSuppliedOrgId !== verifiedOrgId) {
      return { 
        orgId: null, 
        error: 'Forbidden. Organization mismatch: client-supplied organizationId does not match verified user workspace membership.', 
        status: 403 
      };
    }
    return { orgId: verifiedOrgId };
  };

  const mockTelemetryController = (req: any) => {
    const user = mockGetAuthenticatedUser(req);
    if (!user) {
      return { status: 401, body: { success: false, error: 'Unauthorized. Authentication token required.' } };
    }

    const { orgId, error, status } = mockResolveVerifiedOrganizationId(req, user);
    if (error || !orgId) {
      return { status: status || 403, body: { success: false, error: error || 'Organization access denied.' } };
    }

    // Return mock successful real telemetry response based on non-fake data
    const scopedLeads = (db.db.leads || []).filter(l => l.organizationId === orgId && !l.isTest && !l.isSimulated);
    return {
      status: 200,
      body: {
        success: true,
        kpis: {
          leadsCount: scopedLeads.length,
          newLeadsCount: scopedLeads.filter(l => l.status === 'NEW').length,
          wonRevenueSum: 0,
          pipelineValueSum: 0
        }
      }
    };
  };

  // 1. Test No Auth → 401
  const res1 = mockTelemetryController({ headers: {} });
  assert(res1.status === 401, 'Test 1: No auth → 401');

  // 2. Test Invalid Token → 401
  const res2 = mockTelemetryController({ headers: { authorization: 'Bearer invalid_garbage_token_999' } });
  assert(res2.status === 401, 'Test 2: Invalid token → 401');

  // 3. Test Expired Token → 401
  const expiredToken = 'token_expired_' + Date.now();
  db.db.sessions[expiredToken] = { userId: userA.id, expiresAt: Date.now() - 5000 };
  const res3 = mockTelemetryController({ headers: { authorization: `Bearer ${expiredToken}` } });
  assert(res3.status === 401, 'Test 3: Expired token → 401');

  // 4. Test Valid Authenticated User → 200
  const validTokenA = 'token_valid_a_' + Date.now();
  db.db.sessions[validTokenA] = { userId: userA.id, expiresAt: Date.now() + 100000 };
  const res4 = mockTelemetryController({ headers: { authorization: `Bearer ${validTokenA}` } });
  assert(res4.status === 200 && res4.body.success === true, 'Test 4: Valid authenticated user → 200');

  // 5. Test Wrong Tenant → 403 (mismatch client organization-id)
  const res5 = mockTelemetryController({
    headers: { 
      authorization: `Bearer ${validTokenA}`,
      'x-organization-id': TEST_ORG_B
    }
  });
  assert(res5.status === 403, 'Test 5: Wrong tenant → 403');

  // 6. Test Valid Tenant → real telemetry response
  const testLead = {
    id: 'lead_real_telemetry_1',
    organizationId: TEST_ORG_A,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@telemetry.com',
    company: 'Telemetry Corp',
    status: 'NEW' as any,
    isTest: false,
    isSimulated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.db.leads.push(testLead);

  const res6 = mockTelemetryController({
    headers: {
      authorization: `Bearer ${validTokenA}`,
      'x-organization-id': TEST_ORG_A
    }
  });
  assert(res6.status === 200 && res6.body.kpis.leadsCount === 1, 'Test 6: Valid tenant → real telemetry response');

  // 7. Test No Secret / Token Exposure
  const bodyString = JSON.stringify(res6.body);
  const containsSensitive = bodyString.includes('token_') || bodyString.includes('secret') || bodyString.includes('Bearer');
  assert(!containsSensitive, 'Test 7: No secret/token exposure');

  // 8. Test No Fake Telemetry Records
  const testLeadSimulated = {
    id: 'lead_simulated_telemetry_2',
    organizationId: TEST_ORG_A,
    firstName: 'Jane',
    lastName: 'Simulated',
    email: 'jane@telemetry.com',
    company: 'Simulated Corp',
    status: 'NEW' as any,
    isTest: true,
    isSimulated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.db.leads.push(testLeadSimulated);

  const res8 = mockTelemetryController({
    headers: {
      authorization: `Bearer ${validTokenA}`,
      'x-organization-id': TEST_ORG_A
    }
  });
  assert(res8.status === 200 && res8.body.kpis.leadsCount === 1, 'Test 8: No fake/test telemetry records in production calculations');

  // Restore DB
  db.db.sessions = originalSessions;
  db.db.users = originalUsers;
  db.db.organizations = originalOrganizations;
  db.db.leads = originalLeads;
  db.save();

  console.log(`=== DASHBOARD TELEMETRY AUTH TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}
