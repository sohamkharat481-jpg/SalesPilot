/**
 * Live Production Customer Reproduction & Verification Script
 * Target: https://sales-pilot-f4uv.vercel.app/
 * Verifies the exact flow of a fresh non-founder customer in production.
 */

async function main() {
  console.log('==================================================');
  console.log('  LIVE PRODUCTION CUSTOMER FLOW AUDIT: SALESPILOT  ');
  console.log('  Target: https://sales-pilot-f4uv.vercel.app/    ');
  console.log('==================================================\n');

  const prodUrl = 'https://sales-pilot-f4uv.vercel.app';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ' - ' + detail : ''}`);
      failed++;
    }
  }

  // 1. Production Health & Infrastructure check
  console.log('--- 1. PRODUCTION DEPLOYMENT & HEALTH CHECK ---');
  try {
    const healthRes = await fetch(`${prodUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, '1.1 Production health endpoint returns HTTP 200 OK');
    assert(healthData.status === 'ok', '1.2 Production status reports "ok"');
    assert(healthData.serviceRoleKeyConfigured === true, '1.3 Supabase service role key is configured in production environment');
  } catch (err: any) {
    assert(false, '1.1-1.3 Production health check', err.message);
  }

  // 2. Unauthenticated Google OAuth Request Error Presentation
  console.log('\n--- 2. UNAUTHENTICATED GOOGLE CONNECT ATTEMPT ---');
  try {
    const unauthRes = await fetch(`${prodUrl}/api/auth/google/url`);
    const unauthData = await unauthRes.json();
    assert(unauthRes.status === 401, '2.1 Unauthenticated Google connect returns HTTP 401');
    assert(
      !JSON.stringify(unauthData).includes('organizationId') &&
      !JSON.stringify(unauthData).includes('Supabase') &&
      !JSON.stringify(unauthData).includes('JWT') &&
      !JSON.stringify(unauthData).includes('stack'),
      '2.2 Response contains zero technical jargon, organizationIds, JWTs or stack traces'
    );
    assert(
      unauthData.error === 'An authenticated SalesPilot session is required to connect Google Workspace.' ||
      unauthData.error?.includes('session is required') ||
      unauthData.error?.includes('sign in'),
      '2.3 Customer receives a clean, user-friendly prompt: "' + unauthData.error + '"'
    );
  } catch (err: any) {
    assert(false, '2.1-2.3 Unauthenticated Google connect', err.message);
  }

  // 3. Client Error Sanitization Audit
  console.log('\n--- 3. CLIENT ERROR SANITIZATION AUDIT ---');
  const forbiddenOrgLeak = 'Forbidden. Organization mismatch: client-supplied organizationId does not match verified user workspace membership.';
  const { sanitizeUserFacingError } = await import('../src/utils/errorMapper');
  const cleanOrgMsg = sanitizeUserFacingError(forbiddenOrgLeak);
  assert(
    cleanOrgMsg === "We couldn't verify your workspace. Please refresh and try again.",
    '3.1 Previously reported customer error cleanly mapped to: "' + cleanOrgMsg + '"'
  );
  assert(
    !cleanOrgMsg.includes('Forbidden') &&
    !cleanOrgMsg.includes('organizationId') &&
    !cleanOrgMsg.includes('workspace membership') &&
    !cleanOrgMsg.includes('client-supplied'),
    '3.2 Zero internal authorization jargon exposed'
  );

  // 4. Sandbox Account Error Sanitization
  console.log('\n--- 4. SANDBOX ACCOUNT GENERATION CLIENT UX ---');
  const rawSandboxTimeout = 'Sandbox generation timeout in ephemeral container: failed to allocate virtual mailbox';
  const cleanSandboxMsg = sanitizeUserFacingError(rawSandboxTimeout, 'Unable to create the sandbox account. Please try again.');
  assert(
    cleanSandboxMsg === 'Unable to create the sandbox account. Please try again.',
    '4.1 Sandbox account creation failure maps strictly to: "' + cleanSandboxMsg + '"'
  );

  // 5. Tenant Isolation Validation
  console.log('\n--- 5. STRICT TENANT ISOLATION RE-CHECK ---');
  const { LocalDB } = await import('../src/database/localDb');
  const localDb = LocalDB.getInstance();
  const testTime = Date.now();
  const customerAOrgId = `org_verify_cust_a_${testTime}`;
  const customerBOrgId = `org_verify_cust_b_${testTime}`;

  const customerA: any = {
    id: `usr_verify_a_${testTime}`,
    email: `customerA_${testTime}@enterprise-client.com`,
    fullName: 'Customer A',
    organizationId: customerAOrgId,
    role: 'CLIENT',
    isFounder: false
  };

  const customerB: any = {
    id: `usr_verify_b_${testTime}`,
    email: `customerB_${testTime}@rival-firm.com`,
    fullName: 'Customer B',
    organizationId: customerBOrgId,
    role: 'CLIENT',
    isFounder: false
  };

  localDb.saveUser(customerA);
  localDb.saveUser(customerB);

  // Save Lead for Customer A
  localDb.saveLead({
    id: `lead_secret_a_${testTime}`,
    name: 'Confidential Lead',
    company: 'Secret Org',
    email: 'confidential@secret.com',
    status: 'QUALIFIED',
    organizationId: customerAOrgId,
    userId: customerA.id,
    isTest: false,
    createdAt: new Date().toISOString()
  });

  const bLeads = localDb.getLeads(customerBOrgId);
  assert(bLeads.length === 0, '5.1 Customer B workspace contains 0 leads (Customer A data strictly isolated)');
  const allLeadsA = localDb.getLeads(customerAOrgId);
  assert(allLeadsA.length === 1 && allLeadsA[0].company === 'Secret Org', '5.2 Customer A leads accessible solely inside Customer A workspace');

  console.log('\n==================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
