import assert from 'assert';
import {
  classifyGoogleCallbackError,
  escapeOAuthHtmlText,
  persistAuthoritativeGoogleAccount,
  persistGoogleAccountWithPolicy,
  isAuthoritativeGooglePersistenceRequired,
  createGmailConnectHandler,
  queryAuthoritativeGmailAccounts,
  resolveAuthoritativeGmailAccount,
  resolveAuthoritativeCalendarAccount,
  markGoogleAccountReauthRequired,
  hasRequiredCalendarScope
} from '../backend/googleAccountsService';
import { sanitizeUserFacingError } from '../utils/errorMapper';
import { LocalDB, isProductionDiskPersistenceDisabled } from '../database/localDb';
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

  await runTest('28. Email normalization, refresh_token preservation on re-auth, and authoritative readback for Gmail & Calendar', async () => {
    const storedRows = new Map<string, any>([
      [
        'legacy_uuid_cal_1',
        {
          id: '11111111-1111-4111-8111-111111111111',
          user_id: 'usr_reauth_1',
          organization_id: 'org_reauth_1',
          email: 'rep@company.com',
          account_type: 'calendar',
          access_token: 'ya29.old_cal',
          refresh_token: '1//0g_preserved_refresh_token_abc',
          status: 'REAUTH_REQUIRED',
          expiry_date: Date.now() - 10000,
          scopes: ['https://www.googleapis.com/auth/calendar']
        }
      ],
      [
        'legacy_uuid_gmail_1',
        {
          id: '22222222-2222-4222-8222-222222222222',
          user_id: 'usr_reauth_1',
          organization_id: 'org_reauth_1',
          email: 'rep@company.com',
          account_type: 'gmail',
          access_token: 'ya29.old_gmail',
          refresh_token: '1//0g_preserved_refresh_token_abc',
          status: 'REAUTH_REQUIRED',
          expiry_date: Date.now() - 10000,
          scopes: ['https://www.googleapis.com/auth/gmail.send']
        }
      ]
    ]);

    const updatesLog: Array<{ id: string; fields: any }> = [];
    const mockDb: any = {
      from(table: string) {
        const filters: Record<string, any> = {};
        const inFilters: Record<string, any[]> = {};
        let updateFields: Record<string, any> | null = null;
        const b: any = {
          select() { return b; },
          eq(col: string, val: any) { filters[col] = val; return b; },
          in(col: string, vals: any[]) { inFilters[col] = vals; return b; },
          not() { return b; },
          order() { return b; },
          limit() { return b; },
          update(fields: Record<string, any>) {
            updateFields = fields;
            return {
              eq(c1: string, v1: any) {
                filters[c1] = v1;
                return {
                  eq(c2: string, v2: any) {
                    filters[c2] = v2;
                    return {
                      async eq(c3: string, v3: any) {
                        filters[c3] = v3;
                        const existing = Array.from(storedRows.values()).find(r => r.id === filters.id);
                        if (existing && existing.user_id === filters.user_id && existing.organization_id === filters.organization_id) {
                          updatesLog.push({ id: existing.id, fields: { ...updateFields } });
                          Object.assign(existing, updateFields);
                          return { error: null };
                        }
                        return { error: { message: 'Row not found' } };
                      }
                    };
                  }
                };
              }
            };
          },
          async maybeSingle() {
            if (table === 'users') {
              return { data: { id: 'usr_reauth_1', email: 'Rep@Company.com', organization_id: 'org_reauth_1', role: 'SALES', is_verified: true }, error: null };
            }
            if (table === 'organizations') {
              return { data: { id: 'org_reauth_1', owner_id: 'usr_owner_1', status: 'ACTIVE' }, error: null };
            }
            if (table === 'team_members') {
              return { data: { id: 'tm_r1', user_id: 'usr_reauth_1', organization_id: 'org_reauth_1', role: 'SALES', status: 'ACTIVE' }, error: null };
            }
            if (table === 'google_accounts') {
              const rows = Array.from(storedRows.values()).filter(r => {
                if (filters.user_id && r.user_id !== filters.user_id) return false;
                if (filters.organization_id && r.organization_id !== filters.organization_id) return false;
                if (filters.email && r.email !== filters.email) return false;
                if (inFilters.account_type && !inFilters.account_type.includes(r.account_type)) return false;
                return true;
              });
              return { data: rows[0] || null, error: null };
            }
            return { data: null, error: null };
          },
          then(resolve: any) {
            if (table === 'google_accounts') {
              const rows = Array.from(storedRows.values()).filter(r => {
                if (filters.organization_id && r.organization_id !== filters.organization_id) return false;
                if (filters.user_id && r.user_id !== filters.user_id) return false;
                if (inFilters.account_type && !inFilters.account_type.includes(r.account_type)) return false;
                return true;
              });
              resolve({ data: rows, error: null });
              return;
            }
            resolve({ data: [], error: null });
          }
        };
        return b;
      }
    };

    // Re-authorize when Google omits refresh_token (empty string passed) & mixed-case email
    const res = await persistAuthoritativeGoogleAccount({
      userId: 'usr_reauth_1',
      userEmail: 'rep@company.com',
      organizationId: 'org_reauth_1',
      email: '  Rep@Company.com ',
      accessToken: 'ya29.fresh_access_token_999',
      refreshToken: '',
      scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/calendar'],
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      calendarAccessVerified: true,
      privilegedClient: mockDb
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.gmailId, '22222222-2222-4222-8222-222222222222');
    assert.strictEqual(res.calendarId, '11111111-1111-4111-8111-111111111111');
    assert.strictEqual(updatesLog.length, 2, 'Existing UUID rows should update cleanly');
    for (const u of updatesLog) {
      assert.strictEqual(u.fields.email, 'rep@company.com', 'Email must be normalized to lowercase');
      assert.strictEqual(u.fields.refresh_token, '1//0g_preserved_refresh_token_abc', 'Existing refresh_token must never be overwritten with empty string');
    }

    // Authoritative readback reflects new CONNECTED state and token
    const readback = await queryAuthoritativeGmailAccounts({
      organizationId: 'org_reauth_1',
      userId: 'usr_reauth_1',
      privilegedClient: mockDb
    });
    assert.strictEqual(readback.length, 1);
    assert.strictEqual(readback[0].status, 'CONNECTED');
    assert.strictEqual(readback[0].email, 'rep@company.com');
  });

  await runTest('29. Composable schema compatibility adapts to TIMESTAMPTZ expiry, missing status/updated_at, TEXT scopes, provider NOT NULL, and UUID PK', async () => {
    const upsertAttempts: any[] = [];
    const strictSchemaDb: any = {
      from(table: string) {
        const b: any = {
          select() { return b; },
          eq() { return b; },
          in() { return b; },
          not() { return b; },
          limit() { return b; },
          async maybeSingle() {
            if (table === 'users') {
              return { data: { id: 'usr_schema_1', email: 'schema@acme.com', organization_id: 'org_schema_1', role: 'SALES', is_verified: true }, error: null };
            }
            if (table === 'organizations') {
              return { data: { id: 'org_schema_1', owner_id: 'usr_owner_1', status: 'ACTIVE' }, error: null };
            }
            if (table === 'team_members') {
              return { data: { id: 'tm_sch_1', user_id: 'usr_schema_1', organization_id: 'org_schema_1', status: 'ACTIVE' }, error: null };
            }
            return { data: null, error: null };
          },
          async upsert(rows: any[]) {
            const first = rows[0];
            upsertAttempts.push(rows);
            if (typeof first.id === 'string' && first.id.startsWith('ga_')) {
              return { error: { code: '22P02', message: `invalid input syntax for type uuid: "${first.id}"` } };
            }
            if ('status' in first) {
              return { error: { code: 'PGRST204', message: "Could not find the 'status' column of 'google_accounts' in the schema cache" } };
            }
            if ('updated_at' in first) {
              return { error: { code: '42703', message: 'column "updated_at" of relation "google_accounts" does not exist' } };
            }
            if (typeof first.expiry_date === 'number') {
              return { error: { code: '22008', message: 'date/time field value out of range for type timestamp with time zone' } };
            }
            if (Array.isArray(first.scopes)) {
              return { error: { code: '22P02', message: 'malformed array literal: scopes column expects text' } };
            }
            if (!first.provider) {
              return { error: { code: '23502', message: 'null value in column "provider" violates not-null constraint' } };
            }
            return { error: null };
          }
        };
        return b;
      }
    };

    const result = await persistAuthoritativeGoogleAccount({
      userId: 'usr_schema_1',
      userEmail: 'schema@acme.com',
      organizationId: 'org_schema_1',
      email: 'schema@gmail.com',
      accessToken: 'ya29.schema_compat_tok',
      refreshToken: '1//schema_refresh',
      scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/calendar'],
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      calendarAccessVerified: true,
      privilegedClient: strictSchemaDb
    });

    assert.strictEqual(result.success, true, 'Schema adaptation loop should succeed within retry budget');
    assert(/^[0-9a-f-]{36}$/i.test(result.gmailId), `Expected deterministic UUID gmailId, got ${result.gmailId}`);
    assert(/^[0-9a-f-]{36}$/i.test(result.calendarId), `Expected deterministic UUID calendarId, got ${result.calendarId}`);
    const lastRows = upsertAttempts[upsertAttempts.length - 1];
    assert.strictEqual(lastRows[0].provider, 'google');
    assert.strictEqual(typeof lastRows[0].scopes, 'string');
    assert.strictEqual(typeof lastRows[0].expiry_date, 'string');
    assert(!('status' in lastRows[0]));
    assert(!('updated_at' in lastRows[0]));
  });

  await runTest('30. Cross-tenant 23505 unique conflict fails closed and never overwrites another tenant/user row', async () => {
    let updateCalled = false;
    const crossTenantDb: any = {
      from(table: string) {
        const b: any = {
          select() { return b; },
          eq() { return b; },
          in() { return b; },
          not() { return b; },
          limit() { return b; },
          update() {
            updateCalled = true;
            return b;
          },
          async maybeSingle() {
            if (table === 'users') {
              return { data: { id: 'usr_a', email: 'usera@acme.com', organization_id: 'org_a', role: 'SALES', is_verified: true }, error: null };
            }
            if (table === 'organizations') {
              return { data: { id: 'org_a', owner_id: 'usr_owner', status: 'ACTIVE' }, error: null };
            }
            if (table === 'team_members') {
              return { data: { id: 'tm_a', user_id: 'usr_a', organization_id: 'org_a', status: 'ACTIVE' }, error: null };
            }
            // No matching row exists for THIS user+org scope (conflict belongs to a different tenant/user)
            return { data: null, error: null };
          },
          async upsert() {
            return {
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "google_accounts_email_unique"'
              }
            };
          }
        };
        return b;
      }
    };

    let caughtErr: any = null;
    try {
      await persistAuthoritativeGoogleAccount({
        userId: 'usr_a',
        userEmail: 'usera@acme.com',
        organizationId: 'org_a',
        email: 'shared@gmail.com',
        accessToken: 'ya29.cross_tenant_attempt',
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        privilegedClient: crossTenantDb
      });
    } catch (err) {
      caughtErr = err;
    }

    assert(caughtErr !== null, 'Cross-tenant 23505 conflict must fail closed');
    assert.strictEqual(updateCalled, false, 'Must NEVER update a row belonging to another user/tenant');
    assert.strictEqual(caughtErr.pgCode, '23505');
  });

  await runTest('31. PostgreSQL error classifications (23502, 23505, 42P01, 42703/PGRST204, 42501, 22P02) map safely with reference IDs and zero leaks', () => {
    const reqId = 'req_deadbeef12345678';
    const pgCases: Array<{ code: string; msg: string; expectedSubstr: string }> = [
      { code: '23502', msg: 'null value in column "email" violates not-null constraint', expectedSubstr: 'required database field was missing' },
      { code: '23505', msg: 'duplicate key value violates unique constraint', expectedSubstr: 'conflicting Google account record' },
      { code: '42P01', msg: 'relation "public.google_accounts" does not exist', expectedSubstr: 'required database table is missing' },
      { code: 'PGRST204', msg: "Could not find the 'status' column in the schema cache", expectedSubstr: 'database schema is out of sync' },
      { code: '42703', msg: 'column "scopes" does not exist', expectedSubstr: 'database schema is out of sync' },
      { code: '42501', msg: 'new row violates row-level security policy for table "google_accounts"', expectedSubstr: 'database permission check rejected' },
      { code: '22P02', msg: 'invalid input syntax for type bigint', expectedSubstr: 'database column format mismatch' }
    ];

    for (const tc of pgCases) {
      const classified = classifyGoogleCallbackError(
        `Database persistence failed: Failed to persist Google account to database (Code ${tc.code}): ${tc.msg}`,
        reqId
      );
      assert(
        classified.toLowerCase().includes(tc.expectedSubstr.toLowerCase()),
        `Expected "${tc.expectedSubstr}" for ${tc.code}, got "${classified}"`
      );
      assert(classified.includes(`(Reference: ${reqId})`), `Expected reference ID in "${classified}"`);

      // Must pass cleanly through frontend sanitizeUserFacingError without leaking raw SQL/codes/tokens
      const frontendMapped = sanitizeUserFacingError(classified, 'Fallback');
      assert.strictEqual(frontendMapped, classified, `Frontend mapper altered safe diagnostic: "${frontendMapped}"`);
      assert(!frontendMapped.includes('postgresql://') && !frontendMapped.includes('42P01') && !frontendMapped.includes('23502'));
    }

    // Secrets / tokens injected into raw error must NEVER survive sanitizeUserFacingError
    const redactedToken = sanitizeUserFacingError('Failed with access_token ya29.secret_123 and refresh 1//secret_456');
    assert(!redactedToken.includes('ya29.') && !redactedToken.includes('1//'));
  });

  await runTest('32. Correlation requestId propagates across /gmail/connect failure header + JSON body and server.ts callback', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');

    assert(
      serverSrc.includes('const requestId = createCorrelationRequestId(') &&
      serverSrc.includes("res.setHeader('x-request-id', requestId);") &&
      serverSrc.includes('classifyGoogleCallbackError(err, requestId)'),
      'server.ts OAuth callback must generate, attach, and classify errors with correlation requestId'
    );

    const headersWritten: Record<string, string> = {};
    let statusOut = 0;
    let bodyOut: any = null;
    const handler = createGmailConnectHandler({
      getAuthenticatedUser: () => ({ id: 'usr_corr_1', email: 'corr@acme.com', organizationId: 'org_corr_1', emailConfirmedAt: '2026-01-01T00:00:00Z' }),
      resolveVerifiedOrganizationId: () => ({ orgId: 'org_corr_1' }),
      resolveCanonicalGoogleIdentity: async () => ({ userId: 'usr_corr_1', organizationId: 'org_corr_1' }),
      getGmailAccounts: () => [],
      saveAccountsToDisk: () => {},
      getEnv: () => ({ NODE_ENV: 'production', SUPABASE_SERVICE_ROLE_KEY: 'srv_key' } as any),
      persistAccount: async ({ requestId }) => {
        const err: any = new Error('Failed to persist Google account to database (Code 42501): permission denied for table google_accounts');
        err.pgCode = '42501';
        err.requestId = requestId;
        throw err;
      }
    });

    await handler(
      {
        requestId: 'req_trace_correlation_99',
        body: { email: 'corr@gmail.com', accessToken: 'ya29.valid_tok' }
      },
      {
        setHeader(k: string, v: string) { headersWritten[k.toLowerCase()] = v; },
        status(code: number) {
          statusOut = code;
          return {
            json(payload: any) { bodyOut = payload; }
          };
        }
      }
    );

    assert.strictEqual(statusOut, 500);
    assert.strictEqual(bodyOut?.success, false);
    assert.strictEqual(bodyOut?.requestId, 'req_trace_correlation_99');
    assert.strictEqual(headersWritten['x-request-id'], 'req_trace_correlation_99');
    assert(String(bodyOut?.error || '').includes('(Reference: req_trace_correlation_99)'));
    assert(String(bodyOut?.error || '').includes('permission check rejected'));
  });

  await runTest('33. SchedulerView displays sanitized Calendar OAuth error banner without alert on OAuth failure', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const schedulerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SchedulerView.tsx'), 'utf8');
    assert(
      schedulerSrc.includes('const [calendarAuthError, setCalendarAuthError] = useState<string | null>(null);') &&
      schedulerSrc.includes('setCalendarAuthError(friendlyError)') &&
      schedulerSrc.includes('{calendarAuthError && ('),
      'SchedulerView must render sanitized calendarAuthError banner for GOOGLE_AUTH_FAILURE and google=error'
    );
  });

  await runTest('34. 20261123000001_ensure_google_accounts_schema.sql is non-destructive, UUID/TEXT aware, and fixes all 6 schema review findings', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), 'supabase/migrations/20261123000001_ensure_google_accounts_schema.sql'),
      'utf8'
    );
    const upperSql = migrationSql.toUpperCase();

    // Must NEVER drop/recreate table, truncate, delete records, or create rejecting unique indexes
    assert(!upperSql.includes('DROP TABLE'), 'Migration must NEVER drop google_accounts');
    assert(!upperSql.includes('TRUNCATE '), 'Migration must NEVER truncate existing rows');
    assert(!upperSql.includes('DELETE FROM PUBLIC.GOOGLE_ACCOUNTS'), 'Migration must NEVER delete existing Google account rows');
    assert(!upperSql.includes('CREATE UNIQUE INDEX'), 'Migration must NEVER create a unique index that could reject existing duplicate rows');

    // Review fixes verification:
    assert(migrationSql.includes("v_users_id_type := CASE WHEN LOWER(COALESCE(v_users_id_type, 'text')) = 'uuid'"), 'Must dynamically inspect parent users.id type (UUID vs TEXT)');
    assert(migrationSql.includes("v_orgs_id_type := CASE WHEN LOWER(COALESCE(v_orgs_id_type, 'text')) = 'uuid'"), 'Must dynamically inspect parent organizations.id type (UUID vs TEXT)');
    assert(migrationSql.includes('ALTER TABLE public.google_accounts ADD COLUMN id TEXT;') && migrationSql.includes('ADD CONSTRAINT google_accounts_pkey PRIMARY KEY (id);'), 'Must repair missing id column and add validated PK');
    assert(migrationSql.includes('ALTER TABLE public.google_accounts ALTER COLUMN expiry_date DROP DEFAULT;') && migrationSql.includes('FLOOR(EXTRACT(EPOCH FROM expiry_date) * 1000)::BIGINT') && migrationSql.includes('pg_temp._sp_safe_expiry_ms'), 'Must safely convert TIMESTAMPTZ/TEXT expiry_date to BIGINT ms');
    assert(migrationSql.includes('pg_temp._sp_safe_parse_scopes') && migrationSql.includes("ALTER COLUMN scopes TYPE TEXT[]"), 'Must safely reconcile TEXT/JSONB/VARCHAR[] scopes to TEXT[]');
    assert(migrationSql.includes('v_orphan_user_count = 0') && migrationSql.includes('google_accounts_user_id_fkey'), 'Must validate zero orphans before adding user_id FK');
    assert(migrationSql.includes('v_orphan_org_count = 0') && migrationSql.includes('google_accounts_organization_id_fkey'), 'Must validate zero orphans before adding organization_id FK');
    assert(migrationSql.includes('v_dup_scoped_groups') && migrationSql.includes('DROP POLICY IF EXISTS') && migrationSql.includes('user_id::text = (auth.uid())::text') && migrationSql.includes('ENABLE ROW LEVEL SECURITY'), 'Must preserve RLS policies across column type alterations and audit duplicates without rejecting rows');
  });

  await runTest('35. verify_google_accounts_schema.sql provides read-only schema, constraint, RLS, orphan, and duplicate audits without exposing tokens', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const verifyPath = path.join(process.cwd(), 'supabase/verify_google_accounts_schema.sql');
    assert(fs.existsSync(verifyPath), 'Verification SQL script must exist at supabase/verify_google_accounts_schema.sql');
    const verifySql = fs.readFileSync(verifyPath, 'utf8');
    const upperSql = verifySql.toUpperCase();

    // Strictly read-only
    for (const forbidden of ['INSERT ', 'UPDATE ', 'DELETE ', 'DROP ', 'ALTER ', 'CREATE ', 'TRUNCATE ']) {
      assert(!upperSql.includes(forbidden), `Verification script must be strictly read-only (found "${forbidden.trim()}")`);
    }

    assert(verifySql.includes('information_schema.columns'));
    assert(verifySql.includes('pg_constraint'));
    assert(verifySql.includes('pg_indexes') || verifySql.includes('pg_index'));
    assert(verifySql.includes('pg_policies'));
    assert(verifySql.includes('orphaned_user_id_rows') && verifySql.includes('orphaned_organization_id_rows'));
    assert(verifySql.includes('HAVING COUNT(*) > 1'));
    // Must only count non-empty tokens, never return raw access_token/refresh_token columns directly
    assert(verifySql.includes('COUNT(*) FILTER (WHERE access_token IS NOT NULL'));
    assert(verifySql.includes('COUNT(*) FILTER (WHERE refresh_token IS NOT NULL'));
  });

  await runTest('36. Mixed-case legacy email update updates existing row without creating duplicate and preserves per-row refresh_token', async () => {
    const legacyCalRow = {
      id: '33333333-3333-4333-8333-333333333333',
      user_id: 'usr_mix_1',
      organization_id: 'org_mix_1',
      email: 'MixedCase@Company.COM',
      account_type: 'calendar',
      access_token: 'ya29.old_mix_cal',
      refresh_token: '1//cal_refresh_preserved_999',
      status: 'CONNECTED',
      expiry_date: Date.now() - 5000,
      scopes: ['https://www.googleapis.com/auth/calendar']
    };
    const legacyGmailRow = {
      id: '44444444-4444-4444-8444-444444444444',
      user_id: 'usr_mix_1',
      organization_id: 'org_mix_1',
      email: 'MixedCase@Company.COM',
      account_type: 'gmail',
      access_token: 'ya29.old_mix_gmail',
      refresh_token: '1//gmail_refresh_preserved_777',
      status: 'CONNECTED',
      expiry_date: Date.now() - 5000,
      scopes: ['https://www.googleapis.com/auth/gmail.send']
    };
    const tableRows = [legacyCalRow, legacyGmailRow];
    let upsertCalled = false;

    const mockDb: any = {
      from(table: string) {
        const filters: Record<string, any> = {};
        let ilikeEmail: string | null = null;
        let inVals: any[] | null = null;
        let pendingUpdate: Record<string, any> | null = null;
        const b: any = {
          select() { return b; },
          eq(col: string, val: any) { filters[col] = val; return b; },
          ilike(col: string, val: any) {
            if (col === 'email') ilikeEmail = String(val).replace(/\\/g, '').toLowerCase();
            return b;
          },
          in(col: string, vals: any[]) {
            if (col === 'account_type') inVals = vals;
            return b;
          },
          not() { return b; },
          limit() { return b; },
          update(fields: Record<string, any>) {
            pendingUpdate = fields;
            return {
              eq(c1: string, v1: any) {
                filters[c1] = v1;
                return {
                  eq(c2: string, v2: any) {
                    filters[c2] = v2;
                    return {
                      async eq(c3: string, v3: any) {
                        filters[c3] = v3;
                        const row = tableRows.find(
                          r => r.id === filters.id && r.user_id === filters.user_id && r.organization_id === filters.organization_id
                        );
                        if (!row) return { error: { message: 'Row not found' } };
                        Object.assign(row, pendingUpdate);
                        return { error: null };
                      }
                    };
                  }
                };
              }
            };
          },
          async upsert() {
            upsertCalled = true;
            return { error: null };
          },
          async maybeSingle() {
            if (table === 'users') {
              return { data: { id: 'usr_mix_1', email: 'rep@company.com', organization_id: 'org_mix_1', role: 'SALES', is_verified: true }, error: null };
            }
            if (table === 'organizations') {
              return { data: { id: 'org_mix_1', owner_id: 'usr_owner_mix', status: 'ACTIVE' }, error: null };
            }
            if (table === 'team_members') {
              return { data: { id: 'tm_mix_1', user_id: 'usr_mix_1', organization_id: 'org_mix_1', role: 'SALES', status: 'ACTIVE' }, error: null };
            }
            if (table === 'google_accounts') {
              const found = tableRows.find(r => {
                if (filters.user_id && r.user_id !== filters.user_id) return false;
                if (filters.organization_id && r.organization_id !== filters.organization_id) return false;
                if (filters.email && r.email !== filters.email) return false;
                if (ilikeEmail && r.email.toLowerCase() !== ilikeEmail) return false;
                if (inVals && !inVals.includes(r.account_type)) return false;
                return true;
              });
              return { data: found || null, error: null };
            }
            return { data: null, error: null };
          }
        };
        return b;
      }
    };

    const result = await persistAuthoritativeGoogleAccount({
      userId: 'usr_mix_1',
      userEmail: 'rep@company.com',
      authIdentity: { id: 'usr_mix_1', email: 'rep@company.com', email_confirmed_at: '2026-01-01T00:00:00Z' },
      organizationId: 'org_mix_1',
      email: 'mixedcase@company.com',
      name: 'Rep Mixed',
      accessToken: 'ya29.fresh_access_tok',
      refreshToken: '',
      scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/calendar'],
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      calendarAccessVerified: true,
      privilegedClient: mockDb,
      requestId: 'req_mix_test_1'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(upsertCalled, false, 'Existing mixed-case UUID rows must be updated via .update(), not duplicated');
    assert.strictEqual(tableRows.length, 2, 'Row count must remain 2 without duplicate inserts');
    assert.strictEqual(legacyCalRow.refresh_token, '1//cal_refresh_preserved_999', 'Calendar row must preserve its own refresh_token');
    assert.strictEqual(legacyGmailRow.refresh_token, '1//gmail_refresh_preserved_777', 'Gmail row must preserve its own refresh_token');
    assert.strictEqual(legacyCalRow.access_token, 'ya29.fresh_access_tok');
    assert.strictEqual(legacyGmailRow.access_token, 'ya29.fresh_access_tok');
  });

  await runTest('37. Gmail and Calendar resolve independently and scoped reauth marking isolates service statuses', async () => {
    const accountRows = [
      {
        id: 'ga_indep_gmail',
        user_id: 'usr_indep_1',
        organization_id: 'org_indep_1',
        email: 'rep@indep.com',
        account_type: 'gmail',
        access_token: 'ya29.gmail_ok',
        refresh_token: '',
        expiry_date: Date.now() - 10000, // Expired with no refresh_token -> REAUTH_REQUIRED
        status: 'CONNECTED',
        scopes: ['https://www.googleapis.com/auth/gmail.send']
      },
      {
        id: 'ga_indep_cal',
        user_id: 'usr_indep_1',
        organization_id: 'org_indep_1',
        email: 'rep@indep.com',
        account_type: 'calendar',
        access_token: 'ya29.cal_ok',
        refresh_token: '1//cal_refresh_valid',
        expiry_date: Date.now() + 3600_000,
        status: 'CONNECTED',
        scopes: ['https://www.googleapis.com/auth/calendar']
      }
    ];

    const mockClient: any = {
      from(table: string) {
        const filters: Record<string, any> = {};
        let inVals: any[] | null = null;
        let updatePayload: Record<string, any> | null = null;
        const applyUpdate = () => {
          if (!updatePayload) return { error: null };
          for (const r of accountRows) {
            if (filters.email && r.email !== filters.email) continue;
            if (filters.organization_id && r.organization_id !== filters.organization_id) continue;
            if (filters.user_id && r.user_id !== filters.user_id) continue;
            if (inVals && !inVals.includes(r.account_type)) continue;
            Object.assign(r, updatePayload);
          }
          return { error: null };
        };
        const b: any = {
          select() { return b; },
          update(fields: Record<string, any>) {
            updatePayload = fields;
            return b;
          },
          eq(col: string, val: any) { filters[col] = val; return b; },
          in(col: string, vals: any[]) { if (col === 'account_type') inVals = vals; return b; },
          not() { return b; },
          order() { return b; },
          limit() { return b; },
          then(resolve: any) { return Promise.resolve(applyUpdate()).then(resolve); },
          async maybeSingle() {
            if (table !== 'google_accounts') return { data: null, error: null };
            const found = accountRows.find(r => {
              if (filters.organization_id && r.organization_id !== filters.organization_id) return false;
              if (filters.user_id && r.user_id !== filters.user_id) return false;
              if (inVals && !inVals.includes(r.account_type)) return false;
              return true;
            });
            return { data: found || null, error: null, count: found ? 1 : 0 };
          }
        };
        return b;
      }
    };

    const gmailBefore = await resolveAuthoritativeGmailAccount({
      organizationId: 'org_indep_1',
      userId: 'usr_indep_1',
      privilegedClient: mockClient
    });
    const calBefore = await resolveAuthoritativeCalendarAccount({
      organizationId: 'org_indep_1',
      userId: 'usr_indep_1',
      privilegedClient: mockClient
    });
    assert.strictEqual(gmailBefore?.status, 'REAUTH_REQUIRED', 'Expired Gmail without refresh_token resolves REAUTH_REQUIRED');
    assert.strictEqual(calBefore?.status, 'CONNECTED', 'Valid Calendar account resolves CONNECTED independently');

    // Marking only 'gmail' REAUTH_REQUIRED must NOT invalidate 'calendar'
    await markGoogleAccountReauthRequired('rep@indep.com', 'org_indep_1', 'usr_indep_1', mockClient, 'gmail');
    assert.strictEqual(accountRows[0].status, 'REAUTH_REQUIRED');
    assert.strictEqual(accountRows[1].status, 'CONNECTED', 'Calendar status must stay CONNECTED when only gmail is invalidated');

    // Conversely, expired Calendar without calendar scope or refresh resolves REAUTH_REQUIRED independently
    accountRows[1].scopes = ['https://www.googleapis.com/auth/userinfo.email'];
    const calMissingScope = await resolveAuthoritativeCalendarAccount({
      organizationId: 'org_indep_1',
      userId: 'usr_indep_1',
      privilegedClient: mockClient
    });
    assert.strictEqual(calMissingScope?.status, 'REAUTH_REQUIRED', 'Calendar missing calendar scope must resolve REAUTH_REQUIRED');
    assert.strictEqual(hasRequiredCalendarScope(['https://www.googleapis.com/auth/calendar.events']), true);
    assert.strictEqual(hasRequiredCalendarScope(['https://www.googleapis.com/auth/gmail.send']), false);
  });

  await runTest('38. Production runtime disables local filesystem DB/token persistence and rejects sandbox fallback', async () => {
    const fs = await import('fs');
    const path = await import('path');
    assert.strictEqual(isProductionDiskPersistenceDisabled({ NODE_ENV: 'production' } as any), true);
    assert.strictEqual(isProductionDiskPersistenceDisabled({ VERCEL: '1' } as any), true);
    assert.strictEqual(isProductionDiskPersistenceDisabled({ ENVIRONMENT: 'production' } as any), true);
    assert.strictEqual(isProductionDiskPersistenceDisabled({ NODE_ENV: 'development' } as any), false);
    assert.strictEqual(
      isProductionDiskPersistenceDisabled({ NODE_ENV: 'production', ALLOW_LOCALDB_FALLBACK_IN_PRODUCTION: 'true' } as any),
      false
    );

    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const authCtxSrc = fs.readFileSync(path.join(process.cwd(), 'src/authentication/AuthContext.tsx'), 'utf8');
    assert(!serverSrc.includes('calendarAccounts[0]'), 'No cross-tenant calendarAccounts[0] fallback may remain in server.ts');
    assert(serverSrc.includes('isProductionAuthRuntime() && process.env.ALLOW_LOCALDB_FALLBACK_IN_PRODUCTION !== \'true\''), 'saveAccountsToDisk/loadAccountsFromDisk must be guarded in production');
    assert(authCtxSrc.includes('if (!isLocalDev) {'), 'AuthContext.loginWithGoogle must block sandbox fallback outside local dev');
  });

  await runTest('39. Server identity resolution guards, token refresh sync, and requestId correlation across frontend & backend', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const integrationsSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/IntegrationsView.tsx'), 'utf8');
    const schedulerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SchedulerView.tsx'), 'utf8');

    // Middleware and resolveCanonicalGoogleIdentity enforce confirmed email + is_verified
    assert(serverSrc.includes('if (!dbUserRow && emailLower && isSupabaseEmailConfirmed)'), 'Middleware email fallback must require isSupabaseEmailConfirmed');
    assert(serverSrc.includes('if (!foundById && emailLower && isAuthEmailConfirmed)'), 'resolveCanonicalGoogleIdentity email fallback must require !foundById and isAuthEmailConfirmed');
    assert(serverSrc.includes('Boolean(dbUser.is_verified)'), 'resolveCanonicalGoogleIdentity email fallback must require dbUser.is_verified');

    // Refresh updates authoritativeAccount and DB scoped by account_type
    assert(serverSrc.includes('authoritativeAccount.accessToken = tempCalAcc.accessToken;'), 'GET /calendar/accounts must sync refreshed accessToken onto authoritativeAccount');
    assert(serverSrc.includes('.in(\'account_type\', accountTypesList)'), 'ensureAndRefreshGoogleToken must scope Supabase refresh update by account_type');

    // requestId correlation across /api/auth/google/url, /gmail/status, IntegrationsView, SchedulerView
    assert(serverSrc.includes('res.json({ url: authUrl, redirectUri, source, requestId });'), '/api/auth/google/url must return requestId');
    assert(integrationsSrc.includes('errData?.requestId') && integrationsSrc.includes('data?.requestId'), 'IntegrationsView must preserve requestId on error');
    assert(schedulerSrc.includes('data?.requestId'), 'SchedulerView must preserve requestId on error');
  });

  console.log('\n================================================================');
  console.log(`  OAUTH DIAGNOSTICS RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  return { passed, failed };
}

