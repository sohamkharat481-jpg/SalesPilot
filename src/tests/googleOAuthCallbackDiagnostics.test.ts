import assert from 'assert';
import {
  classifyGoogleCallbackError,
  escapeOAuthHtmlText,
  persistAuthoritativeGoogleAccount,
  persistGoogleAccountWithPolicy,
  isAuthoritativeGooglePersistenceRequired,
  createGmailConnectHandler,
  queryAuthoritativeGmailAccounts
} from '../backend/googleAccountsService';
import { sanitizeUserFacingError } from '../utils/errorMapper';
import { LocalDB } from '../database/localDb';
import {
  authenticateUser,
  verifySupabaseBearerJwt,
  resolveAuthenticatedUser,
  isProductionAuthRuntime,
  isPublicAuthExemptPath,
  isValidLocalDevSession,
  resolveGoogleOAuthStateSecret,
  signGoogleOAuthState,
  verifyGoogleOAuthState,
  createSupabaseOAuthNonceStore,
  GOOGLE_OAUTH_STATE_TTL_MS
} from '../security/authMiddleware';

function createMockSupabaseForSyncTest(options: {
  userExists: boolean;
  orgExists: boolean;
  membershipActive: boolean;
  userRole?: string;
}) {
  const insertedGoogleRows: any[] = [];

  const mockClient: any = {
    from(table: string) {
      const filters: Record<string, any> = {};
      const builder: any = {
        select() {
          return builder;
        },
        eq(col: string, val: any) {
          filters[col] = val;
          return builder;
        },
        in() {
          return builder;
        },
        not() {
          return builder;
        },
        order() {
          return builder;
        },
        limit() {
          return builder;
        },
        async maybeSingle() {
          if (table === 'users') {
            if (!options.userExists) return { data: null, error: null };
            return {
              data: {
                id: filters.id || 'usr_sync_1',
                email: options.userEmail || filters.email || 'user@company.com',
                organization_id: options.membershipActive ? 'org_sync_1' : null,
                role: options.userRole || 'SALES',
                is_verified: true,
                is_founder: false
              },
              error: null
            };
          }
          if (table === 'organizations') {
            if (!options.orgExists) return { data: null, error: null };
            return {
              data: {
                id: filters.id || 'org_sync_1',
                owner_id: 'usr_owner_1',
                status: 'ACTIVE'
              },
              error: null
            };
          }
          if (table === 'team_members' || table === 'organization_members') {
            if (!options.membershipActive) return { data: null, error: null };
            return {
              data: {
                id: 'tm_1',
                user_id: filters.user_id || 'usr_sync_1',
                organization_id: filters.organization_id || 'org_sync_1',
                role: options.userRole || 'SALES',
                status: 'ACTIVE'
              },
              error: null
            };
          }
          if (table === 'google_accounts') {
            return { data: null, error: null };
          }
          return { data: null, error: null };
        },
        async insert(payload: any) {
          if (table === 'google_accounts') {
            if (Array.isArray(payload)) insertedGoogleRows.push(...payload);
            else insertedGoogleRows.push(payload);
            return { error: null };
          }
          return { error: null };
        },
        async upsert(payload: any) {
          if (table === 'google_accounts') {
            if (Array.isArray(payload)) insertedGoogleRows.push(...payload);
            else insertedGoogleRows.push(payload);
            return { error: null };
          }
          return { error: null };
        },
        async update() {
          return { error: null };
        }
      };
      return builder;
    }
  };

  return { mockClient, insertedGoogleRows };
}

export async function runGoogleOAuthCallbackDiagnosticsTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n================================================================');
  console.log('  GOOGLE OAUTH ERROR TRANSPARENCY & SYNC DIAGNOSTICS SUITE      ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function runTest(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err?.message || err);
      failed++;
    }
  }

  await runTest('1. Callback classifier preserves redirect_uri_mismatch diagnostics', () => {
    const err = classifyGoogleCallbackError(
      'Google exchange failed (400): {"error":"redirect_uri_mismatch","error_description":"Bad Request"}'
    );
    assert(err.toLowerCase().includes('redirect uri mismatch'), `Unexpected message: ${err}`);
    assert(!err.includes('{') && !err.includes('secret'), 'Must not leak raw JSON or secrets');
  });

  await runTest('2. Callback classifier preserves invalid_client diagnostics', () => {
    const err = classifyGoogleCallbackError(
      'Google exchange failed (401): {"error":"invalid_client","error_description":"Unauthorized"}'
    );
    assert(err.includes('invalid_client'), `Unexpected message: ${err}`);
  });

  await runTest('3. Callback classifier preserves invalid_grant (expired code) diagnostics', () => {
    const err = classifyGoogleCallbackError(
      'Google exchange failed (400): {"error":"invalid_grant","error_description":"Malformed auth code."}'
    );
    assert(err.toLowerCase().includes('expired or was already used'), `Unexpected message: ${err}`);
  });

  await runTest('4. Callback classifier preserves missing user/org/membership DB persistence causes', () => {
    const missingUser = classifyGoogleCallbackError(
      'Database persistence failed: Cannot persist Google account: authenticated user does not exist in database.'
    );
    assert(missingUser.toLowerCase().includes('user record was not found'), `Got: ${missingUser}`);

    const missingOrg = classifyGoogleCallbackError(
      'Database persistence failed: Cannot persist Google account: target organization does not exist in database.'
    );
    assert(missingOrg.toLowerCase().includes('organization record was not found'), `Got: ${missingOrg}`);

    const missingMember = classifyGoogleCallbackError(
      'Database persistence failed: Cannot persist Google account: authenticated user does not have verified membership in the target organization.'
    );
    assert(missingMember.toLowerCase().includes('membership'), `Got: ${missingMember}`);
  });

  await runTest('5. sanitizeUserFacingError preserves specific backend OAuth/401/402 diagnostics', () => {
    const cases = [
      'Unauthorized. Authentication token required. Please sign in again.',
      'Your SalesPilot subscription has expired. Renew your subscription to continue using SalesPilot.',
      'Google OAuth redirect URI mismatch. Verify Authorized Redirect URIs in Google Cloud Console match the callback URL.',
      'Google OAuth client credentials were rejected by Google (invalid_client). Check your configured OAuth Client ID and Secret.',
      'Google OAuth authorization code expired or was already used. Please try connecting again.',
      'Unable to save Google authorization: authenticated user record was not found in the workspace database.',
      'Required Google Gmail and Calendar permissions were not granted. Please approve all requested permissions and try again.'
    ];

    for (const msg of cases) {
      const result = sanitizeUserFacingError(msg, 'Unable to connect your Google account. Please try again.');
      assert.strictEqual(result, msg, `Expected actionable error to be preserved verbatim, got "${result}" for "${msg}"`);
    }
  });

  await runTest('6. sanitizeUserFacingError STILL redacts raw Supabase/Postgres/URL/secret leaks', () => {
    const leak1 = sanitizeUserFacingError(
      'PostgreSQL error 42P01: relation "users" does not exist in Supabase',
      'Unable to connect your Google account. Please try again.'
    );
    assert.strictEqual(leak1, 'Something went wrong. Please try again.');

    const leak2 = sanitizeUserFacingError(
      'OAuth error: invalid_request in Supabase Auth v1 at https://auth.supabase.co/oauth/v1/authorize',
      'Unable to connect your Google account. Please try again.'
    );
    assert(!leak2.includes('Supabase') && !leak2.includes('https://') && !leak2.includes('invalid_request'));

    const leak3 = sanitizeUserFacingError(
      'GOOGLE_CLIENT_ID is not configured in server environment variables.'
    );
    assert.strictEqual(leak3, 'Google integration is temporarily unavailable. Please try again later.');
  });

  await runTest('7. escapeOAuthHtmlText safely escapes HTML characters', () => {
    const escaped = escapeOAuthHtmlText('<script>alert("xss")</script> & \'test\'');
    assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;');
  });

  await runTest('8. Existing synced user with SALES role persists Google account without elevation to OWNER', async () => {
    const { mockClient, insertedGoogleRows } = createMockSupabaseForSyncTest({
      userExists: true,
      orgExists: true,
      membershipActive: true,
      userRole: 'SALES',
      userEmail: 'rep@company.com'
    });

    const result = await persistAuthoritativeGoogleAccount({
      userId: 'usr_sync_1',
      userEmail: 'rep@company.com',
      organizationId: 'org_sync_1',
      email: 'rep.gmail@gmail.com',
      name: 'Sales Rep',
      accessToken: 'ya29.real_access_token_xyz',
      refreshToken: '1//0g_real_refresh_token',
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar'
      ],
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      calendarAccessVerified: true,
      privilegedClient: mockClient
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(insertedGoogleRows.length, 2);
    assert(insertedGoogleRows.every(r => r.organization_id === 'org_sync_1' && r.user_id === 'usr_sync_1'));
  });

  await runTest('9. queryAuthoritativeGmailAccounts marks missing gmail.send scope as REAUTH_REQUIRED cleanly', async () => {
    const fakeClient: any = {
      from() {
        const b: any = {
          select() { return b; },
          eq() { return b; },
          in() { return b; },
          not() { return b; },
          order() { return b; },
          then(resolve: any) {
            resolve({
              data: [
                {
                  id: 'ga_1',
                  user_id: 'u1',
                  organization_id: 'o1',
                  email: 'calonly@gmail.com',
                  access_token: 'ya29.token',
                  refresh_token: '1//refresh',
                  expiry_date: new Date(Date.now() + 3600000).toISOString(),
                  scopes: ['https://www.googleapis.com/auth/calendar'],
                  status: 'CONNECTED',
                  account_type: 'gmail'
                }
              ],
              error: null
            });
          }
        };
        return b;
      }
    };

    const accounts = await queryAuthoritativeGmailAccounts({
      organizationId: 'o1',
      userId: 'u1',
      privilegedClient: fakeClient
    });
    assert.strictEqual(accounts.length, 1);
    assert.strictEqual(accounts[0].status, 'REAUTH_REQUIRED');
  });

  await runTest('10. persistAuthoritativeGoogleAccount rejects SUSPENDED/REMOVED/INVITED members and never mutates users/orgs/roles', async () => {
    const mutatedTables: string[] = [];
    for (const status of ['SUSPENDED', 'REMOVED', 'INVITED', 'PENDING', 'REVOKED']) {
      const mockClient: any = {
        from(table: string) {
          const b: any = {
            select() { return b; },
            eq() { return b; },
            in() { return b; },
            not() { return b; },
            limit() { return b; },
            async maybeSingle() {
              if (table === 'users') {
                return { data: { id: 'usr_blocked_1', email: 'rep@company.com', organization_id: null, role: 'SALES', is_verified: true }, error: null };
              }
              if (table === 'organizations') {
                return { data: { id: 'org_blocked_1', owner_id: 'usr_owner_1', status: 'ACTIVE' }, error: null };
              }
              if (table === 'team_members' || table === 'organization_members') {
                return { data: { id: 'tm_blk', user_id: 'usr_blocked_1', organization_id: 'org_blocked_1', role: 'SALES', status }, error: null };
              }
              return { data: null, error: null };
            },
            async insert() { mutatedTables.push(`insert:${table}`); return { error: null }; },
            async upsert() { mutatedTables.push(`upsert:${table}`); return { error: null }; },
            async update() { mutatedTables.push(`update:${table}`); return { error: null }; }
          };
          return b;
        }
      };

      let threw = false;
      try {
        await persistAuthoritativeGoogleAccount({
          userId: 'usr_blocked_1',
          userEmail: 'rep@company.com',
          organizationId: 'org_blocked_1',
          email: 'rep@gmail.com',
          accessToken: 'ya29.real_token_123',
          scopes: ['https://www.googleapis.com/auth/gmail.send'],
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          privilegedClient: mockClient
        });
      } catch (err: any) {
        threw = true;
        assert(String(err?.message || '').includes('does not have verified membership'), `Unexpected error: ${err?.message}`);
      }
      assert.strictEqual(threw, true, `Expected rejection for status ${status}`);
    }
    assert.strictEqual(mutatedTables.length, 0, `Unexpected table mutations: ${mutatedTables.join(', ')}`);
  });

  await runTest('11. server.ts and authMiddleware.ts contain ZERO unverified JWT base64url decoding and enforce strict role/membership protections', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const authMwSrc = fs.readFileSync(path.join(process.cwd(), 'src/security/authMiddleware.ts'), 'utf8');

    // server.ts must contain ZERO base64url decoding; only HMAC-verified OAuth state inside authMiddleware.ts uses base64url after crypto.timingSafeEqual
    const serverBase64urlMatches = [...serverSrc.matchAll(/Buffer\.from\([^)]*base64url/g)].map(m => m[0]);
    assert.strictEqual(serverBase64urlMatches.length, 0, `Expected 0 base64url decodes in server.ts, found: ${serverBase64urlMatches.join(' | ')}`);
    const mwBase64urlMatches = [...authMwSrc.matchAll(/Buffer\.from\([^)]*base64url/g)].map(m => m[0]);
    assert.strictEqual(mwBase64urlMatches.length, 1, `Expected only signed OAuth state decode in authMiddleware.ts, found: ${mwBase64urlMatches.join(' | ')}`);
    assert(mwBase64urlMatches[0].includes('payload,'), 'Only HMAC-verified OAuth state payload may be decoded');
    assert(!authMwSrc.includes('atob('), 'authMiddleware.ts must never decode unverified JWT payloads');
    assert(!serverSrc.includes('ALLOW_UNVERIFIED_DEV_JWT'), 'Unverified JWT dev bypass flag must be completely removed');

    assert(
      serverSrc.includes('verifySupabaseBearerJwt(') &&
      serverSrc.includes('resolveAuthenticatedUser(') &&
      serverSrc.includes('req.authMiddlewareExecuted = true') &&
      serverSrc.includes('req.authVerificationFailed = true'),
      'server.ts must route all Bearer JWT verification and getAuthenticatedUser() through verified middleware helpers'
    );

    assert(
      serverSrc.includes("const blockedMemberStatuses = new Set(['REMOVED', 'SUSPENDED', 'DISABLED', 'REVOKED', 'INACTIVE'])") &&
      serverSrc.includes('!blockedOrgIds.has(customerOrgId)'),
      'Auth middleware must block REMOVED/SUSPENDED/DISABLED/REVOKED/INACTIVE memberships from re-activation'
    );

    assert(
      serverSrc.includes(': (dbTeamMember?.role || dbOrgMember?.role || dbProfile?.role || dbUserRow?.role)'),
      'Non-owner team member role resolution must prioritize team_members/organization_members over public.users SQL default role'
    );
  });

  await runTest('12. Invalidly signed JWT cannot authenticate in production and routes return 401 without bypassing middleware', async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      assert.strictEqual(isProductionAuthRuntime(), true);

      // Construct forged 3-part JWT attempting to impersonate founder
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const forgedPayload = Buffer.from(
        JSON.stringify({
          sub: 'forged_founder_sub',
          email: 'sohamkharat481@gmail.com',
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      ).toString('base64url');
      const forgedJwt = `${header}.${forgedPayload}.invalid_forged_signature`;

      // Even if a local user existed with that id/email, invalidly signed JWT must be rejected
      const sessions = new Map<string, { userId: string; expiresAt: number }>();
      const users = new Map<string, any>([
        ['forged_founder_sub', { id: 'forged_founder_sub', email: 'sohamkharat481@gmail.com', role: 'OWNER', organizationId: 'org_salespilot_lifetime', isFounder: true }]
      ]);

      // Supabase rejects forged signature
      const rejectingSupabase = {
        auth: {
          async getUser() {
            return { data: { user: null }, error: { message: 'invalid signature', status: 401 } };
          }
        }
      };

      const verifyRes = await verifySupabaseBearerJwt(forgedJwt, rejectingSupabase);
      assert.strictEqual(verifyRes.verified, false, 'Forged JWT must fail verification');
      assert.strictEqual(verifyRes.user, null, 'Forged JWT must return null user');

      // Simulate middleware rejection + route handler calling getAuthenticatedUser() directly
      const reqAfterMiddleware: any = {
        path: '/api/v1/auth/user',
        headers: { authorization: `Bearer ${forgedJwt}` },
        authMiddlewareExecuted: true,
        authVerificationFailed: true
      };
      const directCallRes = resolveAuthenticatedUser(
        reqAfterMiddleware,
        t => sessions.get(t) || null,
        id => users.get(id)
      );
      assert.strictEqual(directCallRes, null, 'getAuthenticatedUser must return null after failed middleware verification');

      // Also verify direct call WITHOUT middleware cannot decode a 3-part JWT
      const rawReqNoMiddleware: any = {
        headers: { authorization: `Bearer ${forgedJwt}` }
      };
      const rawRes = resolveAuthenticatedUser(
        rawReqNoMiddleware,
        t => sessions.get(t) || null,
        id => users.get(id)
      );
      assert.strictEqual(rawRes, null, 'Direct getAuthenticatedUser call must never decode unverified 3-part JWT');
      assert.strictEqual(isPublicAuthExemptPath('/api/v1/auth/user'), false);
      assert.strictEqual(isPublicAuthExemptPath('/api/auth/google/url'), false);
      assert.strictEqual(isPublicAuthExemptPath('/gmail/status'), false);
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  await runTest('13. Supabase verification failure (error, null client, or exception) never falls back to decoded JWT claims', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: 'usr_victim_123',
        email: 'owner@customer.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    ).toString('base64url');
    const badJwt = `${header}.${payload}.bad_sig`;

    // Case A: supabase.auth.getUser returns an error
    const errClient = {
      auth: { async getUser() { return { data: null, error: new Error('JWT expired or revoked') }; } }
    };
    const resA = await verifySupabaseBearerJwt(badJwt, errClient);
    assert.strictEqual(resA.verified, false);
    assert.strictEqual(resA.user, null);

    // Case B: supabase.auth.getUser throws network/auth error
    const throwingClient = {
      auth: { async getUser() { throw new Error('Supabase Auth service unavailable'); } }
    };
    const resB = await verifySupabaseBearerJwt(badJwt, throwingClient);
    assert.strictEqual(resB.verified, false);
    assert.strictEqual(resB.user, null);

    // Case C: supabase client is unconfigured (null)
    const resC = await verifySupabaseBearerJwt(badJwt, null);
    assert.strictEqual(resC.verified, false);
    assert.strictEqual(resC.user, null);

    // Confirm resolveAuthenticatedUser returns null even if middleware somehow omitted authVerificationFailed flag
    const reqWithMiddlewareOnly: any = {
      headers: { authorization: `Bearer ${badJwt}` },
      authMiddlewareExecuted: true
    };
    const user = resolveAuthenticatedUser(reqWithMiddlewareOnly, () => null, () => undefined);
    assert.strictEqual(user, null, 'Route cannot bypass authMiddlewareExecuted via direct getAuthenticatedUser call');
  });

  await runTest('14. Legitimate local session auth works for valid opaque tokens and preserves OWNER/ADMIN/SALES/VIEWER roles cleanly', () => {
    const validSessionToken = 'sp_sess_opaque_valid_12345';
    const expiredSessionToken = 'sp_sess_opaque_expired_999';
    const sessions = new Map<string, { userId: string; expiresAt: number }>([
      [validSessionToken, { userId: 'usr_sales_1', expiresAt: Date.now() + 60000 }],
      [expiredSessionToken, { userId: 'usr_sales_1', expiresAt: Date.now() - 1000 }]
    ]);

    const roles: Array<'OWNER' | 'ADMIN' | 'SALES' | 'VIEWER'> = ['OWNER', 'ADMIN', 'SALES', 'VIEWER'];
    for (const role of roles) {
      const users = new Map<string, any>([
        ['usr_sales_1', { id: 'usr_sales_1', email: 'member@acme.com', role, organizationId: 'org_acme_1', isFounder: false }]
      ]);

      // Valid opaque local session succeeds and preserves role + org
      const reqValid: any = { headers: { authorization: `Bearer ${validSessionToken}` } };
      const resolvedValid = resolveAuthenticatedUser(reqValid, t => sessions.get(t) || null, id => users.get(id));
      assert(resolvedValid !== null, `Valid local session should resolve for role ${role}`);
      assert.strictEqual(resolvedValid!.role, role);
      assert.strictEqual(resolvedValid!.organizationId, 'org_acme_1');
      assert.strictEqual(resolvedValid!.isFounder, false);

      // Expired local session is rejected
      const reqExpired: any = { headers: { authorization: `Bearer ${expiredSessionToken}` } };
      const resolvedExpired = resolveAuthenticatedUser(reqExpired, t => sessions.get(t) || null, id => users.get(id));
      assert.strictEqual(resolvedExpired, null, 'Expired local session must be rejected');

      // Supabase-verified middleware context preserves authoritative role even if LocalDB has stale role
      const staleLocalUsers = new Map<string, any>([
        ['usr_sales_1', { id: 'usr_sales_1', email: 'member@acme.com', role: 'OWNER', organizationId: 'org_salespilot_lifetime', isFounder: true }]
      ]);
      const reqSupabase: any = {
        authMiddlewareExecuted: true,
        authVerifiedVia: 'supabase',
        authenticatedUser: { id: 'usr_sales_1', email: 'member@acme.com', role, organizationId: 'org_acme_1', isFounder: false }
      };
      const resolvedSb = resolveAuthenticatedUser(reqSupabase, () => null, id => staleLocalUsers.get(id));
      assert(resolvedSb !== null);
      assert.strictEqual(resolvedSb!.role, role, 'Must preserve Supabase-verified role over stale LocalDB role');
      assert.strictEqual(resolvedSb!.organizationId, 'org_acme_1', 'Must preserve Supabase-verified org over stale LocalDB org');
      assert.strictEqual(resolvedSb!.isFounder, false, 'Must preserve isFounder=false over stale LocalDB flag');
    }
  });

  await runTest('15. Production blocks LocalDB sessions; undefined/invalid/expired expiresAt is rejected and never auto-extended', () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercel = process.env.VERCEL;
    const db = LocalDB.getInstance();
    const userId = 'usr_local_sess_chk';
    const users = new Map<string, any>([
      [userId, { id: userId, email: 'dev@acme.com', role: 'SALES', organizationId: 'org_acme_1', isFounder: false }]
    ]);

    try {
      // A. Outside production: undefined, NaN, string, or expired expiresAt MUST be rejected & never extended
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL;

      const undefinedExpirySession: any = { userId };
      const nanExpirySession: any = { userId, expiresAt: NaN };
      const strExpirySession: any = { userId, expiresAt: '2099-01-01' };
      const expiredSession: any = { userId, expiresAt: Date.now() - 5000 };
      const futureExpiry = Date.now() + 60_000;
      const validSession: any = { userId, expiresAt: futureExpiry };

      assert.strictEqual(isValidLocalDevSession(undefinedExpirySession, false), false, 'undefined expiresAt must be rejected');
      assert.strictEqual(undefinedExpirySession.expiresAt, undefined, 'undefined expiresAt must NEVER be extended automatically');
      assert.strictEqual(isValidLocalDevSession(nanExpirySession, false), false, 'NaN expiresAt must be rejected');
      assert.strictEqual(isValidLocalDevSession(strExpirySession, false), false, 'non-numeric expiresAt must be rejected');
      assert.strictEqual(isValidLocalDevSession(expiredSession, false), false, 'expired expiresAt must be rejected');

      // Direct LocalDB.getSession checks
      db.db.sessions['tok_undef_exp'] = undefinedExpirySession;
      db.db.sessions['tok_past_exp'] = expiredSession;
      db.db.sessions['tok_valid_dev'] = validSession;
      assert.strictEqual(db.getSession('tok_undef_exp'), null, 'LocalDB.getSession must reject undefined expiresAt');
      assert.strictEqual(db.getSession('tok_past_exp'), null, 'LocalDB.getSession must reject expired expiresAt');
      assert.strictEqual(db.getSession('tok_valid_dev')?.userId, userId, 'LocalDB.getSession preserves valid dev session');
      assert.strictEqual(validSession.expiresAt, futureExpiry, 'Valid session expiry must not be silently mutated on read');

      // B. In production (NODE_ENV=production or VERCEL=1): EVEN a valid unexpired LocalDB session MUST be rejected
      process.env.NODE_ENV = 'production';
      assert.strictEqual(isValidLocalDevSession(validSession), false, 'Production must block LocalDB sessions');
      const prodReq: any = { headers: { authorization: 'Bearer tok_valid_dev' } };
      assert.strictEqual(
        resolveAuthenticatedUser(prodReq, () => validSession, id => users.get(id)),
        null,
        'Production resolveAuthenticatedUser must never fall back to LocalDB sessions'
      );

      delete process.env.NODE_ENV;
      process.env.VERCEL = '1';
      assert.strictEqual(isValidLocalDevSession(validSession), false, 'VERCEL=1 runtime must block LocalDB sessions');
    } finally {
      delete db.db.sessions['tok_undef_exp'];
      delete db.db.sessions['tok_past_exp'];
      delete db.db.sessions['tok_valid_dev'];
      process.env.NODE_ENV = prevNodeEnv;
      if (prevVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prevVercel;
    }
  });

  await runTest('16. authenticateUser() requires Supabase getUser verification and returns 401 on invalid/expired tokens', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    assert(!serverSrc.includes('authenticateUser('), 'Confirm no server.ts route depends on legacy authenticateUser helper');

    // A. Invalid/expired Bearer token must return 401 and NOT call next()
    let statusCodeA = 0;
    let bodyA: any = null;
    let nextCalledA = false;
    const reqA: any = { headers: { authorization: 'Bearer invalid_or_expired_jwt' } };
    const resA: any = {
      status(code: number) {
        statusCodeA = code;
        return { json(b: any) { bodyA = b; } };
      }
    };
    await authenticateUser(reqA, resA, () => { nextCalledA = true; }, {
      auth: {
        async getUser() {
          return { data: null, error: { message: 'Token expired', status: 401 } };
        }
      }
    });
    assert.strictEqual(statusCodeA, 401, 'Invalid token must return 401');
    assert.strictEqual(nextCalledA, false, 'next() must NOT be called for unverified Bearer token');
    assert.strictEqual(reqA.user, undefined, 'req.user must remain undefined');
    assert(String(bodyA?.error || '').includes('Unauthorized'));

    // B. Missing Supabase client also fails closed with 401 (even if Bearer token string is present)
    let statusCodeB = 0;
    let nextCalledB = false;
    const reqB: any = { headers: { authorization: 'Bearer arbitrary_bearer_token' } };
    const resB: any = {
      status(code: number) {
        statusCodeB = code;
        return { json() {} };
      }
    };
    await authenticateUser(reqB, resB, () => { nextCalledB = true; }, null);
    assert.strictEqual(statusCodeB, 401, 'Missing Supabase verifier must reject Bearer token with 401');
    assert.strictEqual(nextCalledB, false);

    // C. Verified Supabase JWT calls next() with authenticated identity (non-elevated role)
    let nextCalledC = false;
    const reqC: any = { headers: { authorization: 'Bearer valid_supabase_jwt' } };
    const resC: any = { status() { return { json() {} }; } };
    await authenticateUser(reqC, resC, () => { nextCalledC = true; }, {
      auth: {
        async getUser(tok: string) {
          assert.strictEqual(tok, 'valid_supabase_jwt');
          return {
            data: {
              user: {
                id: 'usr_sb_verified_1',
                email: 'sales@company.com',
                email_confirmed_at: new Date().toISOString(),
                user_metadata: { full_name: 'Rep One' }
              }
            },
            error: null
          };
        }
      }
    });
    assert.strictEqual(nextCalledC, true, 'Verified Supabase JWT must call next()');
    assert.strictEqual(reqC.user?.id, 'usr_sb_verified_1');
    assert.strictEqual(reqC.user?.role, 'MEMBER', 'authenticateUser must not auto-elevate to OWNER or ADMIN');
    assert.strictEqual(reqC.user?.isFounder, false);
  });

  function createSharedMockPostgresNonceDb() {
    const rows = new Map<string, { nonce: string; user_id: string; organization_id: string | null; expires_at: string }>();

    function makeClient() {
      return {
        from(table: string) {
          assert.strictEqual(table, 'oauth_nonces', `Expected oauth_nonces table, got ${table}`);
          return {
            async insert(row: { nonce: string; user_id: string; organization_id: string | null; expires_at: string }) {
              // Simulate async network round-trip; atomic uniqueness check executes when DB commits row
              await Promise.resolve();
              if (rows.has(row.nonce)) {
                return {
                  error: {
                    code: '23505',
                    message: 'duplicate key value violates unique constraint "oauth_nonces_pkey"'
                  }
                };
              }
              rows.set(row.nonce, { ...row });
              return { error: null };
            },
            delete() {
              return {
                lt(col: string, cutoffIso: string) {
                  assert.strictEqual(col, 'expires_at');
                  const executeDelete = async () => {
                    await Promise.resolve();
                    const cutoffMs = Date.parse(cutoffIso);
                    const deleted: Array<{ nonce: string }> = [];
                    for (const [k, r] of rows.entries()) {
                      if (Date.parse(r.expires_at) < cutoffMs) {
                        rows.delete(k);
                        deleted.push({ nonce: k });
                      }
                    }
                    return { data: deleted, error: null };
                  };
                  return {
                    select() {
                      return executeDelete();
                    },
                    then(resolve: any, reject: any) {
                      return executeDelete().then(resolve, reject);
                    }
                  };
                }
              };
            }
          };
        }
      };
    }

    return { rows, makeClient };
  }

  await runTest('17. Google OAuth state removes hardcoded fallback secret & in-memory Set, fails closed when secret missing, and preserves HMAC/expiry checks', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const authMwSrc = fs.readFileSync(path.join(process.cwd(), 'src/security/authMiddleware.ts'), 'utf8');
    assert(!serverSrc.includes('salespilot_oauth_secret_default_key_2026'), 'Hardcoded OAuth state fallback secret must be removed from server.ts');
    assert(!serverSrc.includes('usedOAuthNonces'), 'In-memory usedOAuthNonces Set must be removed from server.ts');
    assert(!authMwSrc.includes('usedNonces.clear()'), 'Replay-protection store must never clear all entries');
    assert(!authMwSrc.includes('> 5000'), '5000-entry Set clearing logic must be completely removed');

    const emptyEnv: any = {};
    assert.strictEqual(resolveGoogleOAuthStateSecret(emptyEnv), '', 'Missing secret must resolve empty');
    assert.strictEqual(
      resolveGoogleOAuthStateSecret({ GOOGLE_CLIENT_SECRET: 'salespilot_oauth_secret_default_key_2026' } as any),
      '',
      'Known hardcoded default secret must be rejected'
    );

    const { makeClient } = createSharedMockPostgresNonceDb();
    const store = createSupabaseOAuthNonceStore(makeClient());

    // Fail closed when secret missing
    const missingSigned = signGoogleOAuthState(
      { userId: 'usr_1', organizationId: 'org_1', source: 'integrations' },
      emptyEnv
    );
    assert.strictEqual(missingSigned, '', 'signGoogleOAuthState must fail closed when secret is missing');
    assert.strictEqual(await verifyGoogleOAuthState('abc.def', store, emptyEnv), null, 'verifyGoogleOAuthState must fail closed when secret is missing');

    // Valid secret signs and verifies with timing-safe HMAC, expiry, and nonce persistence
    const validEnv: any = { NODE_ENV: 'production', GOOGLE_CLIENT_SECRET: 'super_strong_prod_oauth_secret_xyz' };
    const signed = signGoogleOAuthState(
      { userId: 'usr_real_1', userEmail: 'Rep@Acme.com', organizationId: 'org_acme_1', source: 'integrations' },
      validEnv
    );
    assert(signed.includes('.'), 'Signed OAuth state must contain payload.signature');

    // Tampered signature must fail
    const [p, s] = signed.split('.');
    const tamperedSig = `${s.slice(0, -1)}${s.endsWith('a') ? 'b' : 'a'}`;
    assert.strictEqual(await verifyGoogleOAuthState(`${p}.${tamperedSig}`, store, validEnv), null, 'Tampered HMAC signature must be rejected');

    // Valid verification succeeds once and records nonce
    const verifiedOnce = await verifyGoogleOAuthState(signed, store, validEnv);
    assert(verifiedOnce !== null, 'Valid HMAC state must verify');
    assert.strictEqual(verifiedOnce!.userId, 'usr_real_1');
    assert.strictEqual(verifiedOnce!.organizationId, 'org_acme_1');
    assert.strictEqual(verifiedOnce!.source, 'integrations');

    // Expired state (> 15 minutes) MUST be rejected even with valid HMAC signature
    const crypto = await import('crypto');
    const expiredPayload = Buffer.from(
      JSON.stringify({
        userId: 'usr_real_1',
        organizationId: 'org_acme_1',
        source: 'integrations',
        nonce: crypto.randomBytes(16).toString('hex'),
        issuedAt: Date.now() - 16 * 60 * 1000
      })
    ).toString('base64url');
    const expiredSig = crypto.createHmac('sha256', validEnv.GOOGLE_CLIENT_SECRET).update(expiredPayload).digest('base64url');
    assert.strictEqual(await verifyGoogleOAuthState(`${expiredPayload}.${expiredSig}`, store, validEnv), null, 'Expired OAuth state must be rejected');
  });

  await runTest('18. Replaying an already-used nonce and concurrent callback attempts with the same nonce are strictly rejected', async () => {
    const validEnv: any = { NODE_ENV: 'production', GOOGLE_CLIENT_SECRET: 'prod_oauth_secret_concurrent_test' };
    const { rows, makeClient } = createSharedMockPostgresNonceDb();
    const store = createSupabaseOAuthNonceStore(makeClient());

    // 1. Sequential replay rejection
    const stateSequential = signGoogleOAuthState(
      { userId: 'usr_seq_1', userEmail: 'seq@acme.com', organizationId: 'org_seq_1', source: 'integrations' },
      validEnv
    );
    const firstAccept = await verifyGoogleOAuthState(stateSequential, store, validEnv);
    assert(firstAccept !== null, 'First callback attempt must succeed');
    const replayAttempt = await verifyGoogleOAuthState(stateSequential, store, validEnv);
    assert.strictEqual(replayAttempt, null, 'Replaying an already-used nonce must be rejected');

    // 2. Concurrent callback race attempts using the same nonce across simultaneous requests
    const stateConcurrent = signGoogleOAuthState(
      { userId: 'usr_race_1', userEmail: 'race@acme.com', organizationId: 'org_race_1', source: 'scheduler' },
      validEnv
    );
    const concurrentResults = await Promise.all([
      verifyGoogleOAuthState(stateConcurrent, store, validEnv),
      verifyGoogleOAuthState(stateConcurrent, store, validEnv),
      verifyGoogleOAuthState(stateConcurrent, store, validEnv),
      verifyGoogleOAuthState(stateConcurrent, store, validEnv)
    ]);
    const acceptedCount = concurrentResults.filter(r => r !== null).length;
    const rejectedCount = concurrentResults.filter(r => r === null).length;
    assert.strictEqual(acceptedCount, 1, `Exactly 1 concurrent callback may succeed, got ${acceptedCount}`);
    assert.strictEqual(rejectedCount, 3, `Remaining concurrent callbacks must be rejected, got ${rejectedCount}`);
    assert.strictEqual(rows.size, 2, 'Both consumed nonces must remain persisted in oauth_nonces');
  });

  await runTest('19. Multiple application instances sharing PostgreSQL nonce storage prevent cross-instance replay and store 15m expiry', async () => {
    const validEnv: any = { NODE_ENV: 'production', GOOGLE_CLIENT_SECRET: 'prod_oauth_secret_multi_instance' };
    const { rows, makeClient } = createSharedMockPostgresNonceDb();

    // Two independent serverless instances connected to the same PostgreSQL database
    const instanceAStore = createSupabaseOAuthNonceStore(makeClient());
    const instanceBStore = createSupabaseOAuthNonceStore(makeClient());

    const signed = signGoogleOAuthState(
      { userId: 'usr_inst_1', userEmail: 'inst@acme.com', organizationId: 'org_inst_1', source: 'integrations' },
      validEnv
    );
    const [payloadB64] = signed.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // Instance A handles the legitimate callback
    const verifiedA = await verifyGoogleOAuthState(signed, instanceAStore, validEnv);
    assert(verifiedA !== null, 'Instance A should accept fresh valid OAuth state');
    assert.strictEqual(verifiedA!.userId, 'usr_inst_1');
    assert.strictEqual(verifiedA!.organizationId, 'org_inst_1');

    // Stored record has exact 15-minute expiry timestamp
    const persisted = rows.get(decoded.nonce);
    assert(persisted !== undefined, 'Nonce must be persisted in shared DB');
    assert.strictEqual(
      Date.parse(persisted!.expires_at),
      decoded.issuedAt + GOOGLE_OAUTH_STATE_TTL_MS,
      'Stored expires_at must match OAuth state 15-minute validity'
    );

    // Instance B receives replay of the exact same state and MUST reject it
    const replayedOnB = await verifyGoogleOAuthState(signed, instanceBStore, validEnv);
    assert.strictEqual(replayedOnB, null, 'Instance B must reject OAuth state already consumed by Instance A');
  });

  await runTest('20. Expired nonce cleanup deletes expired records safely without affecting active records', async () => {
    const validEnv: any = { NODE_ENV: 'production', GOOGLE_CLIENT_SECRET: 'prod_oauth_secret_cleanup_test' };
    const { rows, makeClient } = createSharedMockPostgresNonceDb();
    const store = createSupabaseOAuthNonceStore(makeClient());

    const nowMs = Date.now();
    // Seed expired nonces and an active nonce directly in persistent DB
    rows.set('expired_nonce_alpha_123456', {
      nonce: 'expired_nonce_alpha_123456',
      user_id: 'usr_old_1',
      organization_id: 'org_1',
      expires_at: new Date(nowMs - 60_000).toISOString()
    });
    rows.set('expired_nonce_beta_123456', {
      nonce: 'expired_nonce_beta_123456',
      user_id: 'usr_old_2',
      organization_id: 'org_1',
      expires_at: new Date(nowMs - 5_000).toISOString()
    });

    const activeState = signGoogleOAuthState(
      { userId: 'usr_active_1', organizationId: 'org_1', source: 'integrations' },
      validEnv
    );
    const activeNonce = JSON.parse(Buffer.from(activeState.split('.')[0], 'base64url').toString('utf8')).nonce;
    const verifiedActive = await verifyGoogleOAuthState(activeState, store, validEnv);
    assert(verifiedActive !== null, 'Active state must be accepted');

    // Cleanup ran safely during consumeNonce: expired records deleted, active nonce preserved
    assert.strictEqual(rows.has('expired_nonce_alpha_123456'), false, 'Expired alpha nonce should be cleaned up');
    assert.strictEqual(rows.has('expired_nonce_beta_123456'), false, 'Expired beta nonce should be cleaned up');
    assert.strictEqual(rows.has(activeNonce), true, 'Active nonce MUST NOT be deleted during expired cleanup');

    // Replaying active state still fails because active record was preserved
    assert.strictEqual(await verifyGoogleOAuthState(activeState, store, validEnv), null, 'Active nonce must remain blocked after cleanup');

    // Explicit cleanup call preserves active nonce and cleans only expired ones
    rows.set('expired_nonce_gamma_123456', {
      nonce: 'expired_nonce_gamma_123456',
      user_id: 'usr_old_3',
      organization_id: 'org_1',
      expires_at: new Date(nowMs - 1_000).toISOString()
    });
    const cleanedCount = await store.cleanupExpiredNonces!(nowMs);
    assert.strictEqual(cleanedCount, 1);
    assert.strictEqual(rows.has(activeNonce), true, 'Active nonce remains intact after explicit cleanup');
  });

  await runTest('21. Database errors and missing persistent nonce storage fail closed in production', async () => {
    const prodEnv: any = { NODE_ENV: 'production', GOOGLE_CLIENT_SECRET: 'prod_oauth_secret_fail_closed' };
    const vercelEnv: any = { VERCEL: '1', GOOGLE_CLIENT_SECRET: 'prod_oauth_secret_fail_closed' };
    const signed = signGoogleOAuthState(
      { userId: 'usr_prod_1', organizationId: 'org_prod_1', source: 'integrations' },
      prodEnv
    );

    // 1. Missing store fails closed in production
    assert.strictEqual(await verifyGoogleOAuthState(signed, null, prodEnv), null, 'Null nonce store must fail closed in production');
    assert.strictEqual(await verifyGoogleOAuthState(signed, undefined, vercelEnv), null, 'Undefined nonce store must fail closed on Vercel');

    // 2. Null Supabase client fails closed
    const nullSbStore = createSupabaseOAuthNonceStore(null);
    assert.strictEqual(await verifyGoogleOAuthState(signed, nullSbStore, prodEnv), null, 'Null Supabase client must fail closed');

    // 3. Supabase insert DB error (e.g. relation missing 42P01 / connection error) fails closed
    const dbErrorStore = createSupabaseOAuthNonceStore({
      from() {
        return {
          async insert() {
            return { error: { code: '42P01', message: 'relation "public.oauth_nonces" does not exist' } };
          }
        };
      }
    });
    assert.strictEqual(await verifyGoogleOAuthState(signed, dbErrorStore, prodEnv), null, 'DB insert error must fail closed in production');

    // 4. Supabase client throwing network/timeout exception fails closed
    const throwingStore = createSupabaseOAuthNonceStore({
      from() {
        return {
          async insert() {
            throw new Error('PostgreSQL connection pool timeout');
          }
        };
      }
    });
    assert.strictEqual(await verifyGoogleOAuthState(signed, throwingStore, prodEnv), null, 'Throwing DB client must fail closed in production');

    // 5. server.ts check: production missing SUPABASE_SERVICE_ROLE_KEY returns UNAVAILABLE store (never falls back to LocalDB or Set)
    const fs = await import('fs');
    const path = await import('path');
    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    assert(
      serverSrc.includes('SUPABASE_SERVICE_ROLE_KEY is required for persistent OAuth nonce verification in production.'),
      'server.ts must fail closed in production when SUPABASE_SERVICE_ROLE_KEY is unavailable'
    );
  });

  await runTest('22. PostgreSQL error 23503 FK constraints (google_accounts_user_id_fkey & google_accounts_organization_id_fkey) are diagnosed precisely', async () => {
    // 1. google_accounts_user_id_fkey error mapping
    const userFkErr = classifyGoogleCallbackError(
      'Failed to persist Google account to database: foreign key constraint violation on user record (google_accounts_user_id_fkey). The user record "usr_missing_123" does not exist in the database.'
    );
    assert(userFkErr.includes('google_accounts_user_id_fkey') && userFkErr.toLowerCase().includes('user record was not found'), `Unexpected user FK error: ${userFkErr}`);

    // 2. Raw postgres 23503 user_id error mapping
    const rawUserFkErr = classifyGoogleCallbackError(
      'Database persistence failed: insert or update on table "google_accounts" violates foreign key constraint "google_accounts_user_id_fkey"'
    );
    assert(rawUserFkErr.includes('google_accounts_user_id_fkey') && rawUserFkErr.toLowerCase().includes('user record was not found'), `Unexpected raw user FK error: ${rawUserFkErr}`);

    // 3. google_accounts_organization_id_fkey error mapping
    const orgFkErr = classifyGoogleCallbackError(
      'Failed to persist Google account to database: foreign key constraint violation on organization record (google_accounts_organization_id_fkey). The workspace organization "org_missing_456" does not exist in the database.'
    );
    assert(orgFkErr.includes('google_accounts_organization_id_fkey') && orgFkErr.toLowerCase().includes('workspace organization record was not found'), `Unexpected org FK error: ${orgFkErr}`);

    // 4. Raw postgres 23503 organization_id error mapping
    const rawOrgFkErr = classifyGoogleCallbackError(
      'Database persistence failed: insert or update on table "google_accounts" violates foreign key constraint "google_accounts_organization_id_fkey"'
    );
    assert(rawOrgFkErr.includes('google_accounts_organization_id_fkey') && rawOrgFkErr.toLowerCase().includes('workspace organization record was not found'), `Unexpected raw org FK error: ${rawOrgFkErr}`);

    // 5. Simulated database upsert returning 23503 on user_id produces specific diagnostic
    const mockUserFkClient: any = {
      from(table: string) {
        const b: any = {
          select() { return b; },
          eq() { return b; },
          in() { return b; },
          not() { return b; },
          limit() { return b; },
          async maybeSingle() {
            if (table === 'users') {
              return { data: { id: 'usr_valid_sim', email: 'sim@example.com', organization_id: 'org_valid_sim', role: 'SALES', is_verified: true }, error: null };
            }
            if (table === 'organizations') {
              return { data: { id: 'org_valid_sim', owner_id: 'usr_owner_sim', status: 'ACTIVE' }, error: null };
            }
            if (table === 'team_members') {
              return { data: { id: 'tm_sim', user_id: 'usr_valid_sim', organization_id: 'org_valid_sim', status: 'ACTIVE' }, error: null };
            }
            return { data: null, error: null };
          },
          async upsert() {
            return { error: { code: '23503', message: 'insert or update on table "google_accounts" violates foreign key constraint "google_accounts_user_id_fkey"' } };
          }
        };
        return b;
      }
    };

    let caughtUserFk = '';
    try {
      await persistAuthoritativeGoogleAccount({
        userId: 'usr_valid_sim',
        userEmail: 'sim@example.com',
        organizationId: 'org_valid_sim',
        email: 'sim@gmail.com',
        accessToken: 'ya29.sim_token',
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        privilegedClient: mockUserFkClient
      });
    } catch (err: any) {
      caughtUserFk = err?.message || String(err);
    }
    assert(caughtUserFk.includes('google_accounts_user_id_fkey'), `Expected google_accounts_user_id_fkey in error, got: ${caughtUserFk}`);

    // 6. Simulated database upsert returning 23503 on organization_id produces specific diagnostic
    const mockOrgFkClient: any = {
      from(table: string) {
        const b: any = {
          select() { return b; },
          eq() { return b; },
          in() { return b; },
          not() { return b; },
          limit() { return b; },
          async maybeSingle() {
            if (table === 'users') {
              return { data: { id: 'usr_valid_sim', email: 'sim@example.com', organization_id: 'org_valid_sim', role: 'SALES', is_verified: true }, error: null };
            }
            if (table === 'organizations') {
              return { data: { id: 'org_valid_sim', owner_id: 'usr_owner_sim', status: 'ACTIVE' }, error: null };
            }
            if (table === 'team_members') {
              return { data: { id: 'tm_sim', user_id: 'usr_valid_sim', organization_id: 'org_valid_sim', status: 'ACTIVE' }, error: null };
            }
            return { data: null, error: null };
          },
          async upsert() {
            return { error: { code: '23503', message: 'insert or update on table "google_accounts" violates foreign key constraint "google_accounts_organization_id_fkey"' } };
          }
        };
        return b;
      }
    };

    let caughtOrgFk = '';
    try {
      await persistAuthoritativeGoogleAccount({
        userId: 'usr_valid_sim',
        userEmail: 'sim@example.com',
        organizationId: 'org_valid_sim',
        email: 'sim@gmail.com',
        accessToken: 'ya29.sim_token',
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        privilegedClient: mockOrgFkClient
      });
    } catch (err: any) {
      caughtOrgFk = err?.message || String(err);
    }
    assert(caughtOrgFk.includes('google_accounts_organization_id_fkey'), `Expected google_accounts_organization_id_fkey in error, got: ${caughtOrgFk}`);
  });

  await runTest('23. Zero automatic organization/user provisioning and zero OWNER role escalation in server.ts', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');

    // 1. Must never invent autoOrgId = 'org_' + user.id.substring(0, 12)
    assert(!serverSrc.includes("org_${user.id.substring(0, 12)}"), 'Must never generate unpersisted autoOrgId');

    // 2. Must never auto-create customer users or organizations during authentication
    assert(!serverSrc.includes("Customer organization insert notice"), 'Must not auto-insert customer organizations in auth middleware');
    assert(!serverSrc.includes("Customer users insert notice"), 'Must not auto-insert customer users in auth middleware');

    // 3. Must not auto-elevate role to OWNER
    assert(!serverSrc.includes("resolvedRole = 'OWNER';\n            }\n\n            if (dbClient)"), 'Must not auto-elevate non-owner to OWNER role');
  });

  await runTest('24. Shared authoritative persistence policy enforces mandatory Supabase persistence across production, Vercel, and service-key runtimes', async () => {
    assert.strictEqual(isAuthoritativeGooglePersistenceRequired({ NODE_ENV: 'production' } as any), true);
    assert.strictEqual(isAuthoritativeGooglePersistenceRequired({ VERCEL: '1' } as any), true);
    assert.strictEqual(isAuthoritativeGooglePersistenceRequired({ ENVIRONMENT: 'production' } as any), true);
    assert.strictEqual(isAuthoritativeGooglePersistenceRequired({ SUPABASE_SERVICE_ROLE_KEY: 'srv_key_123' } as any), true);
    assert.strictEqual(isAuthoritativeGooglePersistenceRequired({ NODE_ENV: 'development' } as any), false);

    // Production/Vercel fails closed when persistFn throws OR returns success=false
    for (const env of [
      { NODE_ENV: 'production' },
      { VERCEL: '1' },
      { NODE_ENV: 'development', SUPABASE_SERVICE_ROLE_KEY: 'srv_key_123' }
    ]) {
      let threwOnErr = false;
      try {
        await persistGoogleAccountWithPolicy({
          params: {
            userId: 'u_pol_1',
            organizationId: 'o_pol_1',
            email: 'rep@acme.com',
            accessToken: 'ya29.real_token',
            scopes: ['https://www.googleapis.com/auth/gmail.send'],
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          },
          env: env as any,
          persistFn: async () => {
            throw new Error('PostgreSQL connection refused at postgresql://postgres:secret@db.host:5432/postgres');
          }
        });
      } catch (err: any) {
        threwOnErr = true;
        assert(String(err?.message || '').includes('Database persistence failed:'), `Unexpected error: ${err?.message}`);
      }
      assert.strictEqual(threwOnErr, true, `Expected policy failure for env ${JSON.stringify(env)}`);

      let threwOnFalse = false;
      try {
        await persistGoogleAccountWithPolicy({
          params: {
            userId: 'u_pol_1',
            organizationId: 'o_pol_1',
            email: 'rep@acme.com',
            accessToken: 'ya29.real_token',
            scopes: ['https://www.googleapis.com/auth/gmail.send'],
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          },
          env: env as any,
          persistFn: async () => ({ success: false, gmailId: '', calendarId: '' })
        });
      } catch (_) {
        threwOnFalse = true;
      }
      assert.strictEqual(threwOnFalse, true, `Expected failure when success=false for env ${JSON.stringify(env)}`);
    }

    // Missing SUPABASE_SERVICE_ROLE_KEY on Vercel also throws inside persistAuthoritativeGoogleAccount
    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercel = process.env.VERCEL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      delete process.env.NODE_ENV;
      process.env.VERCEL = '1';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      let threwMissingKey = false;
      try {
        await persistAuthoritativeGoogleAccount({
          userId: 'u_vercel_1',
          organizationId: 'o_vercel_1',
          email: 'rep@acme.com',
          accessToken: 'ya29.real_vercel_tok',
          scopes: ['https://www.googleapis.com/auth/gmail.send'],
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        });
      } catch (err: any) {
        threwMissingKey = String(err?.message || '').includes('SUPABASE_SERVICE_ROLE_KEY');
      }
      assert.strictEqual(threwMissingKey, true, 'Missing SUPABASE_SERVICE_ROLE_KEY must fail closed on VERCEL=1');
    } finally {
      if (prevNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prevNodeEnv;
      if (prevVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = prevVercel;
      if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
    }
  });

  await runTest('25. POST /gmail/connect fails closed in production and Vercel when Supabase persistence fails without returning success or mutating state', async () => {
    const createMockRes = () => {
      const state: { statusCode: number; body: any } = { statusCode: 200, body: null };
      const res: any = {
        status(code: number) {
          state.statusCode = code;
          return res;
        },
        json(payload: any) {
          state.body = payload;
          return res;
        }
      };
      return { res, state };
    };

    const sensitiveFailures = [
      'Failed to persist Google account to database (Code 23503): insert or update on table "google_accounts" violates foreign key constraint "google_accounts_user_id_fkey" with access_token ya29.secret_tok postgresql://user:pass@host/db',
      'Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required in production to persist Google accounts to public.google_accounts.',
      'Cannot persist Google account: authenticated user does not have verified membership in the target organization.',
      'PostgreSQL error 42P01: relation "google_accounts" does not exist in Supabase with GOCSPX-secret_val'
    ];

    for (const env of [{ NODE_ENV: 'production' }, { VERCEL: '1' }, { NODE_ENV: 'development', SUPABASE_SERVICE_ROLE_KEY: 'srv_key' }]) {
      for (const failureMsg of sensitiveFailures) {
        const gmailAccounts: any[] = [];
        let saveDiskCalls = 0;

        const handler = createGmailConnectHandler({
          getAuthenticatedUser: () => ({ id: 'usr_1', email: 'rep@acme.com', organizationId: 'org_1', emailConfirmedAt: '2026-01-01T00:00:00Z' }),
          resolveVerifiedOrganizationId: () => ({ orgId: 'org_1' }),
          resolveCanonicalGoogleIdentity: async () => ({ userId: 'usr_1', organizationId: 'org_1' }),
          getGmailAccounts: () => gmailAccounts,
          saveAccountsToDisk: () => { saveDiskCalls++; },
          getEnv: () => env as any,
          persistAccount: async () => {
            throw new Error(failureMsg);
          }
        });

        const { res, state } = createMockRes();
        await handler(
          {
            body: {
              email: 'Rep@Gmail.com',
              fullName: 'Sales Rep',
              accessToken: 'ya29.real_access_token_should_never_leak',
              refreshToken: '1//real_refresh_token_should_never_leak',
              expiresAt: new Date(Date.now() + 3600000).toISOString()
            }
          },
          res
        );

        assert(state.statusCode >= 400, `Expected non-success HTTP status for ${JSON.stringify(env)}, got ${state.statusCode}`);
        assert.strictEqual(state.body?.success, false, 'Failure response must mark success=false');
        assert(!String(state.body?.message || '').includes('connected successfully'), 'Must never report Gmail as connected on persistence failure');
        assert.strictEqual(gmailAccounts.length, 0, 'gmailAccounts in-memory array must not be mutated on failure');
        assert.strictEqual(saveDiskCalls, 0, 'saveAccountsToDisk must not be called on persistence failure');

        const errOut = String(state.body?.error || '');
        assert(errOut.length > 0, 'Failure response must contain clear error message');
        assert(!errOut.includes('ya29.') && !errOut.includes('1//') && !errOut.includes('GOCSPX-'), 'Must never expose tokens or client secrets');
        assert(!errOut.includes('postgresql://') && !errOut.includes('42P01') && !errOut.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Must never expose SQL internals or env secret names');

        // Also verify frontend error mapper preserves actionable persistence message cleanly without replacing with generic text
        const mappedFrontendMsg = sanitizeUserFacingError(errOut, 'Fallback');
        assert.strictEqual(mappedFrontendMsg, errOut, `Expected frontend errorMapper to preserve "${errOut}", got "${mappedFrontendMsg}"`);
      }

      // Mock token submitted to /gmail/connect in production/Vercel must fail closed (400), never succeed
      const mockTokenAccounts: any[] = [];
      let mockSaveCalls = 0;
      const mockTokenHandler = createGmailConnectHandler({
        getAuthenticatedUser: () => ({ id: 'usr_1', email: 'rep@acme.com', organizationId: 'org_1' }),
        resolveVerifiedOrganizationId: () => ({ orgId: 'org_1' }),
        resolveCanonicalGoogleIdentity: async () => ({ userId: 'usr_1', organizationId: 'org_1' }),
        getGmailAccounts: () => mockTokenAccounts,
        saveAccountsToDisk: () => { mockSaveCalls++; },
        getEnv: () => env as any
      });
      const mockRes = createMockRes();
      await mockTokenHandler(
        { body: { email: 'sandbox@acme.com', accessToken: 'mock_sandbox_token_123' } },
        mockRes.res
      );
      assert.strictEqual(mockRes.state.statusCode, 400, 'Mock sandbox token in production/Vercel must fail closed with 400');
      assert.strictEqual(mockRes.state.body?.success, false);
      assert.strictEqual(mockTokenAccounts.length, 0);
      assert.strictEqual(mockSaveCalls, 0);
      assert.strictEqual(
        sanitizeUserFacingError(mockRes.state.body.error, 'Fallback'),
        mockRes.state.body.error,
        'Frontend mapper must surface mock-credential production rejection message cleanly'
      );
    }
  });

  await runTest('26. POST /gmail/connect preserves dev-only fallback without SUPABASE_SERVICE_ROLE_KEY and succeeds when authoritative persistence succeeds', async () => {
    const createMockRes = () => {
      const state: { statusCode: number; body: any } = { statusCode: 200, body: null };
      const res: any = {
        status(code: number) {
          state.statusCode = code;
          return res;
        },
        json(payload: any) {
          state.body = payload;
          return res;
        }
      };
      return { res, state };
    };

    // 1. Development-only without SUPABASE_SERVICE_ROLE_KEY preserves local sandbox behavior
    const devAccounts: any[] = [];
    let devSaveCalls = 0;
    const devHandler = createGmailConnectHandler({
      getAuthenticatedUser: () => ({ id: 'usr_dev_1', email: 'dev@acme.com', organizationId: 'org_dev_1' }),
      resolveVerifiedOrganizationId: () => ({ orgId: 'org_dev_1' }),
      resolveCanonicalGoogleIdentity: async () => ({ userId: 'usr_dev_1', organizationId: 'org_dev_1' }),
      getGmailAccounts: () => devAccounts,
      saveAccountsToDisk: () => { devSaveCalls++; },
      getEnv: () => ({ NODE_ENV: 'development' } as any)
    });
    const devRes = createMockRes();
    await devHandler(
      { body: { email: 'Sandbox@Acme.com', fullName: 'Sandbox', accessToken: 'mock_sandbox_token_dev_1' } },
      devRes.res
    );
    assert.strictEqual(devRes.state.statusCode, 200);
    assert(String(devRes.state.body?.message || '').includes('connected successfully'));
    assert.strictEqual(devAccounts.length, 1);
    assert.strictEqual(devAccounts[0].email, 'sandbox@acme.com');
    assert.strictEqual(devSaveCalls, 1);

    // 2. Production succeeds cleanly ONLY when authoritative persistence returns success=true
    const prodAccounts: any[] = [];
    let prodSaveCalls = 0;
    const prodHandler = createGmailConnectHandler({
      getAuthenticatedUser: () => ({ id: 'usr_prod_1', email: 'rep@acme.com', organizationId: 'org_prod_1', emailConfirmedAt: '2026-01-01T00:00:00Z' }),
      resolveVerifiedOrganizationId: () => ({ orgId: 'org_prod_1' }),
      resolveCanonicalGoogleIdentity: async () => ({ userId: 'usr_prod_1', organizationId: 'org_prod_1' }),
      getGmailAccounts: () => prodAccounts,
      saveAccountsToDisk: () => { prodSaveCalls++; },
      getEnv: () => ({ NODE_ENV: 'production', VERCEL: '1', SUPABASE_SERVICE_ROLE_KEY: 'srv_key' } as any),
      persistAccount: async () => ({ success: true, gmailId: 'ga_gmail_1', calendarId: 'ga_cal_1' })
    });
    const prodRes = createMockRes();
    await prodHandler(
      { body: { email: 'Rep.Gmail@gmail.com', fullName: 'Rep Gmail', accessToken: 'ya29.valid_prod_tok' } },
      prodRes.res
    );
    assert.strictEqual(prodRes.state.statusCode, 200);
    assert(String(prodRes.state.body?.message || '').includes('connected successfully'));
    assert.strictEqual(prodAccounts.length, 1);
    assert.strictEqual(prodSaveCalls, 1);
  });

  await runTest('27. OAuth callback, /gmail/connect, and IntegrationsView follow unified persistence policy and error mapping', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const integrationsSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/IntegrationsView.tsx'), 'utf8');

    // Both callback and /gmail/connect route use unified persistence policy
    assert(
      serverSrc.includes("contextLabel: 'GOOGLE CALLBACK FLOW'") &&
      serverSrc.includes("app.post('/gmail/connect', createGmailConnectHandler("),
      'Both OAuth callback and /gmail/connect must enforce unified persistence policy'
    );
    assert(!serverSrc.includes('[GMAIL CONNECT PERSISTENCE NOTICE]'), 'server.ts /gmail/connect must not swallow persistence errors directly');

    // Callback executes persistGoogleAccountWithPolicy before mutating local gmailAccounts/calendarAccounts/saveAccountsToDisk
    const persistIdx = serverSrc.indexOf("contextLabel: 'GOOGLE CALLBACK FLOW'");
    const diskSaveIdx = serverSrc.indexOf('saveAccountsToDisk();', persistIdx);
    const localMutateIdx = serverSrc.indexOf('const existingGmail = gmailAccounts.find(', persistIdx - 200);
    assert(persistIdx > 0 && diskSaveIdx > persistIdx && localMutateIdx > persistIdx, 'Callback must persist authoritatively before mutating local memory/disk');

    // Frontend IntegrationsView maps /gmail/connect error through sanitizeUserFacingError and displays banner + alert
    assert(
      integrationsSrc.includes('const friendlyError = sanitizeUserFacingError(rawError,') &&
      integrationsSrc.includes('setOauthErrorBanner(friendlyError);'),
      'IntegrationsView handleConnectAccount must map and display backend persistence errors via sanitizeUserFacingError'
    );
  });

  console.log('\n================================================================');
  console.log(`  OAUTH DIAGNOSTICS RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  return { passed, failed };
}

