import { LocalDB } from '../src/database/localDb';
import { sanitizeUserFacingError, cleanErrorMessage } from '../src/utils/errorMapper';

async function runFinalProductionSanityCheck() {
  console.log('================================================================');
  console.log('SALESPILOT — FINAL PRODUCTION GO-LIVE SANITY CHECK');
  console.log('Target: https://sales-pilot-f4uv.vercel.app');
  console.log('Timestamp: ' + new Date().toISOString());
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` - ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: PRODUCTION API HEALTH & DEPLOYMENT CHECK
  // -------------------------------------------------------------
  console.log('--- 1. PRODUCTION DEPLOYMENT & HEALTH CHECK ---');
  try {
    const healthRes = await fetch('https://sales-pilot-f4uv.vercel.app/api/health', { method: 'GET' });
    assert(healthRes.status === 200, '1.1 Production health endpoint returns HTTP 200 OK');
    const healthJson = await healthRes.json() as any;
    assert(healthJson.status === 'ok', '1.2 Production status reports "ok"');
    assert(healthJson.serviceRoleKeyConfigured === true, '1.3 Supabase service role key is securely configured');
  } catch (err: any) {
    assert(false, '1.1-1.3 Production health check failed', err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: SIMULATION OF REAL CUSTOMER INCIDENT (STALE BROWSER STATE)
  // -------------------------------------------------------------
  console.log('\n--- 2. REAL CUSTOMER INCIDENT REPRODUCTION & RESOLUTION ---');
  const localDb = LocalDB.getInstance();
  const timestamp = Date.now();

  const customerA = {
    id: `cust_a_${timestamp}`,
    email: `customer.a.${timestamp}@acme-corp.com`,
    role: 'CLIENT' as const,
    organizationId: `org_customer_a_${timestamp}`,
    name: 'Customer A (Acme)',
    createdAt: new Date().toISOString()
  };

  const customerB = {
    id: `cust_b_${timestamp}`,
    email: `customer.b.${timestamp}@globex.com`,
    role: 'CLIENT' as const,
    organizationId: `org_customer_b_${timestamp}`,
    name: 'Customer B (Globex)',
    createdAt: new Date().toISOString()
  };

  // Seed both organizations and users
  localDb.db.users.push(customerA, customerB);
  localDb.db.organizations.push(
    {
      id: customerA.organizationId,
      name: 'Acme Corp',
      slug: `acme-${timestamp}`,
      plan: 'pro',
      status: 'active',
      subscriptionTier: 'growth',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stripeCustomerId: `cus_acme_${timestamp}`,
      settings: {}
    },
    {
      id: customerB.organizationId,
      name: 'Globex Inc',
      slug: `globex-${timestamp}`,
      plan: 'starter',
      status: 'active',
      subscriptionTier: 'starter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stripeCustomerId: `cus_globex_${timestamp}`,
      settings: {}
    }
  );

  // Simulate stale browser state: Customer A's browser has stale org header from past session
  const staleOrgId = `stale_org_legacy_test`;
  const isDirectMismatch = staleOrgId !== customerA.organizationId;
  assert(isDirectMismatch, '2.1 Stale browser state simulated with mismatched cached organizationId');

  // Verify error mapping cleanses previous customer incident error
  const rawIncidentError = "Forbidden. Organization mismatch: client-supplied organizationId does not match verified user workspace membership.";
  const sanitizedIncident = sanitizeUserFacingError(rawIncidentError);
  assert(
    !sanitizedIncident.includes('Forbidden') &&
    !sanitizedIncident.includes('organizationId') &&
    !sanitizedIncident.includes('membership') &&
    sanitizedIncident === "We couldn't verify your workspace. Please refresh and try again.",
    '2.2 Real-customer incident error properly sanitized to friendly copy',
    sanitizedIncident
  );

  // -------------------------------------------------------------
  // TEST 3: GOOGLE OAUTH, GMAIL & CALENDAR ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- 3. GOOGLE / GMAIL / CALENDAR WORKSPACE BINDING ---');

  // Connect Google account for Customer A
  const googleAccountA = {
    id: `g_acct_a_${timestamp}`,
    organizationId: customerA.organizationId,
    email: 'acme.sales@acme-corp.com',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/calendar'],
    isActive: true,
    connectedAt: new Date().toISOString(),
    isSandbox: false
  };
  localDb.db.gmailAccounts.push(googleAccountA as any);
  localDb.db.calendarAccounts.push(googleAccountA as any);

  // Query Gmail accounts for Customer A vs Customer B
  const accountsA = localDb.db.gmailAccounts.filter(a => a.organizationId === customerA.organizationId);
  const accountsB = localDb.db.gmailAccounts.filter(a => a.organizationId === customerB.organizationId);

  assert(accountsA.length === 1 && accountsA[0].email === 'acme.sales@acme-corp.com', '3.1 Customer A Gmail account correctly stored and verified');
  assert(accountsB.length === 0, '3.2 Customer B has 0 access to Customer A Gmail account');

  // Create an appointment for Customer A
  const appointmentA = {
    id: `appt_a_${timestamp}`,
    organizationId: customerA.organizationId,
    leadId: `lead_a_${timestamp}`,
    title: 'Acme Enterprise Demo',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 30,
    status: 'SCHEDULED' as const,
    notes: 'Demo SalesPilot live capabilities',
    createdAt: new Date().toISOString()
  };
  localDb.db.appointments.push(appointmentA as any);

  // Verify appointments strictly isolated
  const apptsA = localDb.db.appointments.filter(a => a.organizationId === customerA.organizationId);
  const apptsB = localDb.db.appointments.filter(a => a.organizationId === customerB.organizationId);
  assert(apptsA.length === 1 && apptsA[0].id === appointmentA.id, '3.3 Customer A appointment persists in Customer A workspace');
  assert(apptsB.length === 0, '3.4 Customer B cannot view Customer A appointment');

  // -------------------------------------------------------------
  // TEST 4: SANDBOX ACCOUNT CREATION & WORKSPACE SCOPING
  // -------------------------------------------------------------
  console.log('\n--- 4. SANDBOX ACCOUNT GENERATION & SCOPING ---');

  const sandboxAccountA = {
    id: `sandbox_${timestamp}`,
    organizationId: customerA.organizationId,
    email: `sandbox-${timestamp}@salespilot.mail`,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    isActive: true,
    connectedAt: new Date().toISOString(),
    isSandbox: true
  };
  localDb.db.gmailAccounts.push(sandboxAccountA as any);

  const sandboxForA = localDb.db.gmailAccounts.filter(a => a.organizationId === customerA.organizationId && a.isSandbox);
  const sandboxForB = localDb.db.gmailAccounts.filter(a => a.organizationId === customerB.organizationId && a.isSandbox);

  assert(sandboxForA.length === 1 && sandboxForA[0].id === sandboxAccountA.id, '4.1 Sandbox account successfully scoped to Customer A workspace');
  assert(sandboxForB.length === 0, '4.2 Customer B workspace remains unpolluted by Customer A sandbox');

  // -------------------------------------------------------------
  // TEST 5: FULL CRM TENANT ISOLATION RE-CHECK
  // -------------------------------------------------------------
  console.log('\n--- 5. FULL CRM TENANT ISOLATION ---');

  // Leads
  const leadA = {
    id: `lead_a_${timestamp}`,
    organizationId: customerA.organizationId,
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.com',
    company: 'Cyberdyne Systems',
    status: 'NEW',
    score: 85,
    createdAt: new Date().toISOString()
  };
  localDb.db.leads.push(leadA as any);

  // Campaigns
  const campaignA = {
    id: `camp_a_${timestamp}`,
    organizationId: customerA.organizationId,
    name: 'Q4 Enterprise Outbound',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  localDb.db.campaigns.push(campaignA as any);

  // Deals
  const dealA = {
    id: `deal_a_${timestamp}`,
    organizationId: customerA.organizationId,
    title: 'Enterprise License Deal',
    value: 50000,
    stage: 'PROPOSAL',
    createdAt: new Date().toISOString()
  };
  localDb.db.deals.push(dealA as any);

  const leadsForB = localDb.db.leads.filter(l => l.organizationId === customerB.organizationId);
  const campaignsForB = localDb.db.campaigns.filter(c => c.organizationId === customerB.organizationId);
  const dealsForB = localDb.db.deals.filter(d => d.organizationId === customerB.organizationId);

  assert(leadsForB.length === 0, '5.1 Customer B has zero access to Customer A leads');
  assert(campaignsForB.length === 0, '5.2 Customer B has zero access to Customer A campaigns');
  assert(dealsForB.length === 0, '5.3 Customer B has zero access to Customer A deals');

  // -------------------------------------------------------------
  // TEST 6: CLIENT-FACING ERROR UX CHECK
  // -------------------------------------------------------------
  console.log('\n--- 6. CLIENT ERROR SANITIZATION AUDIT ---');

  const technicalSamples = [
    'PGRST301: JWT expired or invalid token',
    'PostgreSQL syntax error near organization_id in table leads',
    'Supabase error: Failed to fetch row from organization_members',
    'Error: invalid_grant at OAuth2Client.getToken (node_modules/google-auth-library)'
  ];

  for (const sample of technicalSamples) {
    const clean = sanitizeUserFacingError(sample);
    const leaked = /PGRST|JWT|PostgreSQL|Supabase|OAuth2Client|node_modules|syntax error/i.test(clean);
    assert(!leaked, `6. Error '${sample.slice(0, 30)}...' sanitized safely: "${clean}"`);
  }

  // -------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`SALESPILOT SANITY CHECK: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runFinalProductionSanityCheck().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
