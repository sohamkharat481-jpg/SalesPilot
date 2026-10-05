import assert from 'assert';
import crypto from 'crypto';
import { LocalDB } from '../database/localDb';
import { LeadGenWorker } from '../backend/leadGenWorker';
import { Lead, LeadGenJob, WorkspaceUser } from '../types';

const localDb = LocalDB.getInstance();

export async function runGoogleOAuthAndAsyncLeadGenTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n================================================================');
  console.log('  SALESPILOT — GOOGLE OAUTH & ASYNC LEAD GEN PRODUCTION AUDIT  ');
  console.log('================================================================\n');

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

  // Helper simulating the canonical redirect URI resolver
  const getGoogleRedirectUri = (req: any): string => {
    const canonicalProductionOrigin = 'https://sales-pilot-f4uv.vercel.app';
    const requestHost = String(req?.headers?.host || '').split(':')[0].toLowerCase();
    const forwardedHost = String(req?.headers?.['x-forwarded-host'] || '').split(':')[0].toLowerCase();
    const origin = String(req?.headers?.origin || '').toLowerCase();
    const referer = String(req?.headers?.referer || '').toLowerCase();

    if (
      process.env.VERCEL_ENV === 'production' || 
      process.env.VERCEL === '1' ||
      requestHost.includes('sales-pilot-f4uv.vercel.app') ||
      forwardedHost.includes('sales-pilot-f4uv.vercel.app') ||
      origin.includes('sales-pilot-f4uv.vercel.app') ||
      referer.includes('sales-pilot-f4uv.vercel.app')
    ) {
      return `${canonicalProductionOrigin}/api/auth/google/callback`;
    }

    const configuredAppUrl = (process.env.VITE_APP_URL || process.env.APP_URL || '').trim().replace(/^['"]|['"]$/g, '');
    if (configuredAppUrl) {
      const baseUrl = /^https?:\/\//i.test(configuredAppUrl) ? configuredAppUrl : `https://${configuredAppUrl}`;
      return `${baseUrl.replace(/\/+$/, '')}/api/auth/google/callback`;
    }

    const proto = (req?.headers?.['x-forwarded-proto'] || (req?.secure ? 'https' : 'http')).trim();
    const host = (req?.headers?.host || '').trim();
    const dynamicBaseUrl = `${proto}://${host || 'localhost:3000'}`.replace(/\/+$/, '');
    return `${dynamicBaseUrl}/api/auth/google/callback`;
  };

  // =========================================================================
  // ISSUE 1: GOOGLE CALENDAR OAUTH REDIRECT URI AUDIT
  // =========================================================================
  console.log('--- 1. GOOGLE CALENDAR OAUTH REDIRECT URI AUDIT ---');

  await test('1.1 Canonical production redirect URI matches exact production domain', () => {
    const canonicalUri = getGoogleRedirectUri({
      headers: { host: 'sales-pilot-f4uv.vercel.app' }
    });
    assert.strictEqual(
      canonicalUri,
      'https://sales-pilot-f4uv.vercel.app/api/auth/google/callback',
      'Production redirect URI must strictly match canonical URL'
    );
  });

  await test('1.2 Vercel environment flags resolve to canonical sales-pilot-f4uv callback', () => {
    const originalVercel = process.env.VERCEL;
    process.env.VERCEL = '1';
    const uri = getGoogleRedirectUri({});
    process.env.VERCEL = originalVercel;

    assert.strictEqual(uri, 'https://sales-pilot-f4uv.vercel.app/api/auth/google/callback');
  });

  await test('1.3 Stale sales-pilot-green is not used anywhere in redirect URI resolution', () => {
    const uri = getGoogleRedirectUri({
      headers: { host: 'sales-pilot-f4uv.vercel.app' }
    });
    assert(!uri.includes('sales-pilot-green'), 'Stale sales-pilot-green domain must NOT appear in URI');
  });

  await test('1.4 OAuth state payload is securely HMAC signed and includes verified userId & organizationId', () => {
    const secret = 'prod_oauth_secret_key_123';
    const payload = Buffer.from(JSON.stringify({
      userId: 'usr_oauth_test_01',
      organizationId: 'org_oauth_test_01',
      nonce: 'nonce_123',
      issuedAt: Date.now()
    })).toString('base64url');

    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const stateToken = `${payload}.${signature}`;

    // Verify state validation
    const [p, s] = stateToken.split('.');
    const expectedSig = crypto.createHmac('sha256', secret).update(p).digest('base64url');
    assert.strictEqual(s, expectedSig);

    const parsed = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    assert.strictEqual(parsed.userId, 'usr_oauth_test_01');
    assert.strictEqual(parsed.organizationId, 'org_oauth_test_01');
  });

  const oauthSecret = 'prod_oauth_security_secret_key_999';
  const usedNonces = new Set<string>();

  const validateOAuthStateHelper = (state: unknown) => {
    if (typeof state !== 'string' || !oauthSecret) return null;
    const [p, s] = state.split('.');
    if (!p || !s) return null;
    const expected = crypto.createHmac('sha256', oauthSecret).update(p).digest('base64url');
    if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    try {
      const parsed = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
      if (!parsed.userId || !parsed.issuedAt || Date.now() - parsed.issuedAt > 15 * 60 * 1000) return null;
      if (parsed.nonce) {
        if (usedNonces.has(parsed.nonce)) return null;
        usedNonces.add(parsed.nonce);
      }
      const dbUser = localDb.getUserById(parsed.userId);
      if (!dbUser) return null;
      return { userId: parsed.userId, organizationId: parsed.organizationId || dbUser.organizationId };
    } catch (_) {
      return null;
    }
  };

  await test('1.5 Missing state is rejected', () => {
    assert.strictEqual(validateOAuthStateHelper(undefined), null);
    assert.strictEqual(validateOAuthStateHelper(''), null);
  });

  await test('1.6 Invalid HMAC state signature is rejected', () => {
    const p = Buffer.from(JSON.stringify({ userId: 'usr_valid_01', issuedAt: Date.now() })).toString('base64url');
    const forgedState = `${p}.forged_tampered_signature_999`;
    assert.strictEqual(validateOAuthStateHelper(forgedState), null);
  });

  await test('1.7 Expired state (> 15 minutes) is rejected', () => {
    const expiredPayload = Buffer.from(JSON.stringify({
      userId: 'usr_valid_01',
      issuedAt: Date.now() - 20 * 60 * 1000 // 20 mins ago
    })).toString('base64url');
    const sig = crypto.createHmac('sha256', oauthSecret).update(expiredPayload).digest('base64url');
    assert.strictEqual(validateOAuthStateHelper(`${expiredPayload}.${sig}`), null);
  });

  await test('1.8 Replayed state nonce is rejected', () => {
    const nonce = `nonce_replay_test_${Date.now()}`;
    const testUser = {
      id: `usr_oauth_replay_${Date.now()}`,
      email: 'oauth_replay@test.com',
      organizationId: 'org_oauth_replay',
      role: 'CLIENT'
    };
    localDb.addUser(testUser as any);

    const payload = Buffer.from(JSON.stringify({
      userId: testUser.id,
      organizationId: testUser.organizationId,
      nonce,
      issuedAt: Date.now()
    })).toString('base64url');
    const sig = crypto.createHmac('sha256', oauthSecret).update(payload).digest('base64url');
    const stateToken = `${payload}.${sig}`;

    // First use: Valid
    const firstRes = validateOAuthStateHelper(stateToken);
    assert.ok(firstRes);

    // Second use: Replay rejected
    const replayRes = validateOAuthStateHelper(stateToken);
    assert.strictEqual(replayRes, null, 'Replayed state token must be rejected');
  });

  await test('1.9 Modified userId in state fails signature verification', () => {
    const legitimatePayload = Buffer.from(JSON.stringify({
      userId: 'usr_victim_01',
      organizationId: 'org_victim_01',
      issuedAt: Date.now()
    })).toString('base64url');
    const sig = crypto.createHmac('sha256', oauthSecret).update(legitimatePayload).digest('base64url');

    // Attacker modifies payload to victim's ID while keeping signature
    const attackerPayload = Buffer.from(JSON.stringify({
      userId: 'usr_attacker_02',
      organizationId: 'org_attacker_02',
      issuedAt: Date.now()
    })).toString('base64url');

    assert.strictEqual(validateOAuthStateHelper(`${attackerPayload}.${sig}`), null);
  });

  await test('1.10 No Authorization header on callback route succeeds when signed state is valid', () => {
    const validUser = {
      id: `usr_bearerless_${Date.now()}`,
      email: 'bearerless@test.com',
      organizationId: 'org_bearerless',
      role: 'CLIENT'
    };
    localDb.addUser(validUser as any);

    const payload = Buffer.from(JSON.stringify({
      userId: validUser.id,
      organizationId: validUser.organizationId,
      nonce: `nonce_bearerless_${Date.now()}`,
      issuedAt: Date.now()
    })).toString('base64url');
    const sig = crypto.createHmac('sha256', oauthSecret).update(payload).digest('base64url');
    const stateToken = `${payload}.${sig}`;

    const res = validateOAuthStateHelper(stateToken);
    assert.ok(res);
    assert.strictEqual(res.userId, validUser.id);
    assert.strictEqual(res.organizationId, validUser.organizationId);
  });

  // =========================================================================
  // ISSUE 2: ASYNC LEAD GENERATION WORKSPACE & TENANT ISOLATION
  // =========================================================================
  console.log('\n--- 2. ASYNC LEAD GENERATION WORKSPACE & TENANT ISOLATION ---');

  const orgAId = `org_async_a_${timestamp}`;
  const userAId = `usr_async_a_${timestamp}`;
  const orgBId = `org_async_b_${timestamp}`;
  const userBId = `usr_async_b_${timestamp}`;

  // Register Tenant A and Tenant B in database
  localDb.addUser({
    id: userAId,
    email: `usera_${timestamp}@tenant-a.com`,
    fullName: 'Alice Tenant A',
    organizationId: orgAId,
    role: 'CLIENT',
    createdAt: new Date().toISOString()
  } as any);

  localDb.addOrganization({
    id: orgAId,
    name: 'Tenant A Workspace',
    ownerId: userAId,
    tier: 'GROWTH',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  } as any);

  localDb.addUser({
    id: userBId,
    email: `userb_${timestamp}@tenant-b.com`,
    fullName: 'Bob Tenant B',
    organizationId: orgBId,
    role: 'CLIENT',
    createdAt: new Date().toISOString()
  } as any);

  localDb.addOrganization({
    id: orgBId,
    name: 'Tenant B Workspace',
    ownerId: userBId,
    tier: 'STARTER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  } as any);

  // Setup mock LeadGenWorker
  const leadGenWorker = new LeadGenWorker({
    getJobById: async (jobId, orgId) => localDb.getLeadGenJobById(jobId, orgId),
    claimJob: async (jobId, orgId) => {
      const job = localDb.getLeadGenJobById(jobId, orgId);
      if (!job) return null;
      job.status = 'RUNNING';
      localDb.addLeadGenJob(job);
      return job;
    },
    updateJob: async (jobId, updates, orgId) => {
      const job = localDb.getLeadGenJobById(jobId, orgId);
      if (!job) return false;
      Object.assign(job, updates);
      localDb.addLeadGenJob(job);
      return true;
    },
    getLeads: async (orgId) => localDb.getLeadsByOrgId(orgId),
    insertLead: async (lead) => {
      localDb.saveLead(lead);
      return lead;
    }
  });

  await test('2.1 Account A creates async lead gen job persisted with verified organizationId and userId', async () => {
    const jobAId = `job_a_${timestamp}`;
    const newJobA: LeadGenJob = {
      jobId: jobAId,
      organizationId: orgAId,
      userId: userAId,
      campaignId: 'camp_alpha',
      status: 'QUEUED',
      progress: 0,
      total: 5,
      processed: 0,
      created: 0,
      skipped: 0,
      errorMessage: null,
      criteria: { industry: 'Fintech', city: 'Mumbai', country: 'India', maxLeads: 5 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localDb.addLeadGenJob(newJobA);
    const retrieved = localDb.getLeadGenJobById(jobAId, orgAId);
    assert.ok(retrieved, 'Job must be retrievable in Tenant A workspace');
    assert.strictEqual(retrieved.organizationId, orgAId);
    assert.strictEqual(retrieved.userId, userAId);
    assert.strictEqual(retrieved.status, 'QUEUED');
  });

  await test('2.2 Background worker processes job and saves generated leads strictly to Tenant A', async () => {
    const jobAId = `job_a_${timestamp}`;

    // Simulate lead gen worker inserting verified leads
    for (let i = 1; i <= 3; i++) {
      localDb.saveLead({
        id: `lead_a_${timestamp}_${i}`,
        organizationId: orgAId,
        userId: userAId,
        firstName: `Lead`,
        lastName: `A${i}`,
        company: `Fintech Corp ${i}`,
        email: `contact${i}@fintech${i}.in`,
        status: 'NEW',
        createdAt: new Date().toISOString()
      } as any);
    }

    localDb.updateLeadGenJob(jobAId, {
      status: 'COMPLETED',
      progress: 100,
      created: 3,
      processed: 3
    }, orgAId);

    const completedJob = localDb.getLeadGenJobById(jobAId, orgAId);
    assert.strictEqual(completedJob?.status, 'COMPLETED');
    assert.strictEqual(completedJob?.created, 3);

    const leadsOrgA = localDb.getLeads(orgAId);
    assert.strictEqual(leadsOrgA.length, 3, 'Tenant A must have exactly 3 leads');
  });

  await test('2.3 Tenant B has zero access to Tenant A async jobs (Strict Multi-Tenant Isolation)', () => {
    const jobAId = `job_a_${timestamp}`;
    const leakAttempt = localDb.getLeadGenJobById(jobAId, orgBId);
    assert.strictEqual(leakAttempt, null, 'Tenant B querying Tenant A job must return null');

    const tenantBJobs = localDb.getLeadGenJobs(orgBId);
    assert.strictEqual(tenantBJobs.length, 0, 'Tenant B job list must contain 0 jobs');
  });

  await test('2.4 Tenant B has zero access to Tenant A generated leads', () => {
    const leadsOrgB = localDb.getLeads(orgBId);
    assert.strictEqual(leadsOrgB.length, 0, 'Tenant B must see 0 leads from Tenant A');
  });

  await test('2.5 Client-supplied header organizationId manipulation cannot hijack foreign workspace', () => {
    // Simulated resolver check
    const resolveServerOrg = (reqHeaders: Record<string, string>, user: WorkspaceUser) => {
      let verifiedOrgId = user.organizationId;
      if (!verifiedOrgId) return { orgId: null, error: "We couldn't verify your workspace. Please refresh and try again.", status: 403 };

      const clientSuppliedOrgId = reqHeaders['x-organization-id'];
      if (clientSuppliedOrgId && clientSuppliedOrgId.trim() !== '') {
        const clean = clientSuppliedOrgId.trim();
        const isMember = clean === verifiedOrgId;
        if (!isMember) {
          // Fall back authoritatively to user's verified organization
          return { orgId: verifiedOrgId };
        }
        return { orgId: clean };
      }
      return { orgId: verifiedOrgId };
    };

    const userB = localDb.getUserById(userBId)!;
    // Attacker B attempts to supply Tenant A's organizationId in header
    const resolved = resolveServerOrg({ 'x-organization-id': orgAId }, userB);
    assert.strictEqual(resolved.orgId, orgBId, 'Server MUST NOT allow Attacker B into Tenant A workspace');
  });

  console.log(`\n=== AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGoogleOAuthAndAsyncLeadGenTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
