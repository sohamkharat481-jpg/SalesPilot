import {
  resolveAuthoritativeGmailAccount,
  resolveAuthoritativeCalendarAccount,
  queryAuthoritativeGmailAccounts,
  persistAuthoritativeGoogleAccount,
  hasRequiredGmailSendScope,
  normalizeExpiryMs,
  formatExpiryIso
} from '../backend/googleAccountsService';
import { LocalDB } from '../database/localDb';

export async function runGmailResolutionTests() {
  console.log('=== STARTING GMAIL RESOLUTION & OWNERSHIP REGRESSION TESTS ===');
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, description: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passedCount++;
    } else {
      console.error(`  ✕ FAIL: ${description}`);
      throw new Error(`Test Failed: ${description}`);
    }
  }

  const localDb = LocalDB.getInstance();
  const testOrg1 = 'org_test_ownership_1';
  const testOrg2 = 'org_test_ownership_2';
  const testUser1 = 'usr_owner_1';
  const testUser2 = 'usr_owner_2';
  const validToken = 'ya29.valid_test_access_token_12345';
  const futureExpiry = new Date(Date.now() + 3600000).toISOString();
  const pastExpiry = new Date(Date.now() - 3600000).toISOString();

  // 1. Save valid clean test account
  localDb.saveGmailAccount({
    id: `ga_${testUser1}_user1_clean_test@example.com_gmail`,
    userId: testUser1,
    organizationId: testOrg1,
    email: 'user1_clean_test@example.com',
    accessToken: validToken,
    refreshToken: '1//refresh_token_user1',
    expiresAt: futureExpiry,
    status: 'CONNECTED',
    scopes: ['https://www.googleapis.com/auth/gmail.send']
  });

  // 2. Account with missing ownership
  localDb.saveGmailAccount({
    id: 'ga_unowned_unowned_test@example.com_gmail',
    userId: '',
    organizationId: '',
    email: 'unowned_test@example.com',
    accessToken: validToken,
    refreshToken: '',
    expiresAt: futureExpiry,
    status: 'CONNECTED'
  });

  // 3. Expired account without refresh token
  localDb.saveGmailAccount({
    id: `ga_${testUser2}_expired_no_refresh_test@example.com_gmail`,
    userId: testUser2,
    organizationId: testOrg2,
    email: 'expired_no_refresh_test@example.com',
    accessToken: validToken,
    refreshToken: '',
    expiresAt: pastExpiry,
    status: 'CONNECTED'
  });

  // 4. Invalid/NaN expiry date account with no refresh token
  localDb.saveGmailAccount({
    id: `ga_${testUser1}_invalid_expiry_test@example.com_gmail`,
    userId: testUser1,
    organizationId: testOrg1,
    email: 'invalid_expiry_test@example.com',
    accessToken: validToken,
    refreshToken: '',
    expiresAt: 'not-a-valid-date-string',
    status: 'CONNECTED'
  });

  // 5. Account lacking required Gmail scope
  localDb.saveGmailAccount({
    id: `ga_${testUser1}_lacking_scopes_test@example.com_gmail`,
    userId: testUser1,
    organizationId: testOrg1,
    email: 'lacking_scopes_test@example.com',
    accessToken: validToken,
    refreshToken: '1//valid_refresh_token',
    expiresAt: futureExpiry,
    status: 'CONNECTED',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'] // Missing gmail send scope
  });

  // 6. Account with empty scopes array
  localDb.saveGmailAccount({
    id: `ga_${testUser1}_empty_scopes_test@example.com_gmail`,
    userId: testUser1,
    organizationId: testOrg1,
    email: 'empty_scopes_test@example.com',
    accessToken: validToken,
    refreshToken: '1//valid_refresh_token',
    expiresAt: futureExpiry,
    status: 'CONNECTED',
    scopes: []
  });

  // 7. Account with space-delimited string scopes
  localDb.saveGmailAccount({
    id: `ga_${testUser1}_string_scopes_test@example.com_gmail`,
    userId: testUser1,
    organizationId: testOrg1,
    email: 'string_scopes_test@example.com',
    accessToken: validToken,
    refreshToken: '1//valid_refresh_token',
    expiresAt: futureExpiry,
    status: 'CONNECTED',
    scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email' as any
  });

  // Test 1: Missing userId or organizationId
  console.log('\nTest 1: Rejects resolution when userId or organizationId is missing');
  const missingOrg = await resolveAuthoritativeGmailAccount({ organizationId: '', userId: testUser1 });
  assert(missingOrg === null, 'Rejects empty organizationId');
  const missingUser = await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: '' });
  assert(missingUser === null, 'Rejects empty userId in LocalDB fallback');

  // Test 2: Mismatched user or organization
  console.log('\nTest 2: Rejects mismatched userId or organizationId');
  const userMismatch = await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: testUser2 });
  assert(userMismatch === null, 'Rejects when requested userId does not match stored account userId');
  const orgMismatch = await resolveAuthoritativeGmailAccount({ organizationId: testOrg2, userId: testUser1 });
  assert(orgMismatch === null, 'Rejects when requested organizationId does not match stored account organizationId');

  // Test 3: Unowned accounts rejected
  console.log('\nTest 3: Rejects accounts missing stored ownership fields');
  const unownedMatch = await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: 'usr_some_other', senderEmail: 'unowned_test@example.com' });
  assert(unownedMatch === null, 'Rejects unowned account missing stored userId and organizationId');

  // Test 4: Expired token without refresh marked REAUTH_REQUIRED
  console.log('\nTest 4: Expired token without refresh token sets REAUTH_REQUIRED status');
  const expiredRes = await resolveAuthoritativeGmailAccount({ organizationId: testOrg2, userId: testUser2, senderEmail: 'expired_no_refresh_test@example.com' });
  assert(expiredRes !== null && expiredRes.status === 'REAUTH_REQUIRED', 'Expired token without refresh token returns REAUTH_REQUIRED status');

  // Test 5: Invalid/NaN expiry date string marked REAUTH_REQUIRED
  console.log('\nTest 5: Invalid/NaN expiry date string safely marked REAUTH_REQUIRED status');
  const nanExpiryRes = await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: testUser1, senderEmail: 'invalid_expiry_test@example.com' });
  assert(nanExpiryRes !== null && nanExpiryRes.status === 'REAUTH_REQUIRED', 'NaN expiry date without refresh returns REAUTH_REQUIRED status');

  // Test 6: Missing required scopes marked REAUTH_REQUIRED
  console.log('\nTest 6: Account lacking Gmail scopes sets REAUTH_REQUIRED status');
  const missingScopeRes = await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: testUser1, senderEmail: 'lacking_scopes_test@example.com' });
  assert(missingScopeRes !== null && missingScopeRes.status === 'REAUTH_REQUIRED', 'Account lacking Gmail scopes returns REAUTH_REQUIRED status');

  // Test 7: Empty scopes array marked REAUTH_REQUIRED
  console.log('\nTest 7: Account with empty scopes array sets REAUTH_REQUIRED status');
  const emptyScopeRes = await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: testUser1, senderEmail: 'empty_scopes_test@example.com' });
  assert(emptyScopeRes !== null && emptyScopeRes.status === 'REAUTH_REQUIRED', 'Empty scopes array returns REAUTH_REQUIRED status');

  // Test 8: Space-separated string scopes with gmail.send resolves as CONNECTED
  console.log('\nTest 8: Account with space-separated string scopes resolves successfully');
  const stringScopeRes = await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: testUser1, senderEmail: 'string_scopes_test@example.com' });
  assert(stringScopeRes !== null && stringScopeRes.status === 'CONNECTED', 'String scopes containing gmail.send returns CONNECTED');

  // Test 9: Direct hasRequiredGmailSendScope unit verification
  console.log('\nTest 9: Unit verification of hasRequiredGmailSendScope');
  assert(hasRequiredGmailSendScope(null) === false, 'Rejects null scopes');
  assert(hasRequiredGmailSendScope(undefined) === false, 'Rejects undefined scopes');
  assert(hasRequiredGmailSendScope([]) === false, 'Rejects empty array');
  assert(hasRequiredGmailSendScope(['https://www.googleapis.com/auth/calendar.readonly']) === false, 'Rejects insufficient scope list');
  assert(hasRequiredGmailSendScope(['https://www.googleapis.com/auth/gmail.send']) === true, 'Accepts standard gmail.send scope');
  assert(hasRequiredGmailSendScope(['https://mail.google.com/']) === true, 'Accepts full mail scope');
  assert(hasRequiredGmailSendScope('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email') === true, 'Accepts string space-delimited gmail.send scope');

  // Test 10: Production mode safety guard
  console.log('\nTest 10: Production mode safety guard blocks unverified fallback without service role key');
  const origNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  delete process.env.ALLOW_LOCALDB_FALLBACK_IN_PRODUCTION;
  let prodErrorThrown = false;
  try {
    await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: testUser1, senderEmail: 'user1_clean_test@example.com' });
  } catch (err: any) {
    prodErrorThrown = err.message.includes('SUPABASE_SERVICE_ROLE_KEY is required in production');
  }
  assert(prodErrorThrown, 'Production mode correctly blocks unverified LocalDB fallback and throws configuration error');
  const prodQueryEmpty = await queryAuthoritativeGmailAccounts({ organizationId: testOrg1, userId: testUser1 });
  assert(prodQueryEmpty.length === 0, 'Production mode blocks unverified LocalDB fallback in queryAuthoritativeGmailAccounts');
  process.env.NODE_ENV = origNodeEnv;

  // Test 11: Valid, properly owned LocalDB account resolves successfully in development
  console.log('\nTest 11: Valid, properly owned LocalDB account resolves successfully when Supabase unavailable in dev');
  const validRes = await resolveAuthoritativeGmailAccount({ organizationId: testOrg1, userId: testUser1, senderEmail: 'user1_clean_test@example.com' });
  assert(validRes !== null && validRes.email === 'user1_clean_test@example.com' && validRes.status === 'CONNECTED', 'Successfully resolves user1 account from LocalDB');
  assert(validRes?.userId === testUser1 && validRes?.organizationId === testOrg1, 'Preserves strict userId and organizationId');

  // Test 12: Cross-tenant Gmail access attempts blocked
  console.log('\nTest 12: Cross-tenant Gmail access attempt strictly blocked');
  const crossTenantRes = await resolveAuthoritativeGmailAccount({ organizationId: testOrg2, userId: testUser1, senderEmail: 'user1_clean_test@example.com' });
  assert(crossTenantRes === null, 'Cross-tenant access attempt returned null');

  // Test 13: Query summary status agreement
  console.log('\nTest 13: queryAuthoritativeGmailAccounts agrees with resolveAuthoritativeGmailAccount');
  const queryRes = await queryAuthoritativeGmailAccounts({ organizationId: testOrg1, userId: testUser1 });
  const matchedInQuery = queryRes.find(q => q.email === 'user1_clean_test@example.com');
  assert(matchedInQuery !== undefined && matchedInQuery.status === 'CONNECTED', 'Query summary returns matching connected account');

  // Test 14: BIGINT expiry_date normalization, existing user/org verification & persistence round-trip
  console.log('\nTest 14: persistAuthoritativeGoogleAccount verifies existing user/org/membership and writes BIGINT expiry_date & status');
  const storedDbRows = new Map<string, any>();
  const usersTable = new Map<string, any>([
    [
      'usr_prod_cold_1',
      {
        id: 'usr_prod_cold_1',
        email: 'alice@coldorg.com',
        organization_id: 'org_cold_1',
        role: 'SALES',
        is_verified: false,
        is_founder: false
      }
    ],
    [
      'usr_no_membership',
      {
        id: 'usr_no_membership',
        email: 'outsider@otherorg.com',
        organization_id: 'org_other_99',
        role: 'MEMBER',
        is_verified: false,
        is_founder: false
      }
    ],
    [
      'usr_invited_only',
      {
        id: 'usr_invited_only',
        email: 'invited@coldorg.com',
        organization_id: 'org_other_99',
        role: 'VIEWER',
        is_verified: false,
        is_founder: false
      }
    ],
    [
      'usr_team_member_sales',
      {
        id: 'usr_team_member_sales',
        email: 'rep@coldorg.com',
        organization_id: null,
        role: 'SALES',
        is_verified: false,
        is_founder: false
      }
    ],
    [
      'usr_founder_real',
      {
        id: 'usr_founder_real',
        email: 'founder@salespilot.ai',
        organization_id: 'org_salespilot_lifetime',
        role: 'OWNER',
        is_verified: true,
        is_founder: true
      }
    ]
  ]);
  const orgsTable = new Map<string, any>([
    ['org_cold_1', { id: 'org_cold_1', owner_id: 'usr_owner_real', status: 'ACTIVE' }],
    ['org_salespilot_lifetime', { id: 'org_salespilot_lifetime', owner_id: 'usr_founder_real', status: 'ACTIVE' }]
  ]);
  const teamMembersTable: any[] = [
    { id: 'tm_invited', organization_id: 'org_cold_1', user_id: 'usr_invited_only', role: 'SALES', status: 'INVITED' },
    { id: 'tm_active_rep', organization_id: 'org_cold_1', user_id: 'usr_team_member_sales', role: 'SALES', status: 'ACTIVE' }
  ];
  const orgMembersTable: any[] = [];
  let unauthorizedPrivilegedWrites = 0;

  const buildFilterChain = (rowsSource: () => any[], filters: Record<string, any> = {}, inFilters: Record<string, any[]> = {}) => {
    const applyFilter = () => {
      return rowsSource().filter(row => {
        for (const [k, v] of Object.entries(filters)) {
          if (k === '__not_null') {
            if (row[v] === null || row[v] === undefined) return false;
          } else if (row[k] !== v) {
            return false;
          }
        }
        for (const [k, arr] of Object.entries(inFilters)) {
          if (!arr.includes(row[k])) return false;
        }
        return true;
      });
    };
    const chain: any = {
      in: (k: string, vals: any[]) => buildFilterChain(rowsSource, filters, { ...inFilters, [k]: vals }),
      eq: (k: string, val: any) => buildFilterChain(rowsSource, { ...filters, [k]: val }, inFilters),
      not: (k: string, _op: string, _val: any) => buildFilterChain(rowsSource, { ...filters, __not_null: k }, inFilters),
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => {
        const res = applyFilter();
        return { data: res[0] || null, count: res.length, error: null };
      },
      then: (resolve: any) => {
        const res = applyFilter();
        return Promise.resolve({ data: res, error: null }).then(resolve);
      }
    };
    return chain;
  };

  let forceGoogleAccountsFkError = false;
  const mockSupabaseClient: any = {
    from: (table: string) => {
      if (table === 'organizations') {
        return {
          select: () => buildFilterChain(() => Array.from(orgsTable.values())),
          upsert: async () => {
            unauthorizedPrivilegedWrites++;
            return { error: { message: 'Security violation: OAuth must never upsert organizations' } };
          },
          insert: async () => {
            unauthorizedPrivilegedWrites++;
            return { error: { message: 'Security violation: OAuth must never insert organizations' } };
          }
        };
      }
      if (table === 'users') {
        return {
          select: () => buildFilterChain(() => Array.from(usersTable.values())),
          upsert: async () => {
            unauthorizedPrivilegedWrites++;
            return { error: { message: 'Security violation: OAuth must never upsert users' } };
          },
          insert: async () => {
            unauthorizedPrivilegedWrites++;
            return { error: { message: 'Security violation: OAuth must never insert users' } };
          },
          update: () => {
            unauthorizedPrivilegedWrites++;
            return { eq: async () => ({ error: { message: 'Security violation: OAuth must never update users' } }) };
          }
        };
      }
      if (table === 'team_members') {
        return {
          select: () => buildFilterChain(() => teamMembersTable),
          upsert: async () => {
            unauthorizedPrivilegedWrites++;
            return { error: { message: 'Security violation: OAuth must never upsert team_members' } };
          },
          insert: async () => {
            unauthorizedPrivilegedWrites++;
            return { error: { message: 'Security violation: OAuth must never insert team_members' } };
          }
        };
      }
      if (table === 'organization_members') {
        return {
          select: () => buildFilterChain(() => orgMembersTable),
          upsert: async () => {
            unauthorizedPrivilegedWrites++;
            return { error: { message: 'Security violation: OAuth must never upsert organization_members' } };
          }
        };
      }
      if (table === 'google_accounts') {
        return {
          select: () => buildFilterChain(() => Array.from(storedDbRows.values())),
          upsert: async (rows: any[]) => {
            if (forceGoogleAccountsFkError) {
              return { error: { code: '23503', message: 'insert or update on table "google_accounts" violates foreign key constraint' } };
            }
            for (const r of rows) {
              storedDbRows.set(r.id, { ...r, created_at: new Date().toISOString() });
            }
            return { error: null };
          }
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }
  };

  const futureMs = Date.now() + 3600000;
  const futureIso = new Date(futureMs).toISOString();
  const persistOut = await persistAuthoritativeGoogleAccount({
    userId: 'usr_prod_cold_1',
    userEmail: 'alice@coldorg.com',
    organizationId: 'org_cold_1',
    email: 'sohamkharat481@gmail.com',
    name: 'Soham Kharat',
    accessToken: 'ya29.real_cold_token_abc',
    refreshToken: '1//real_cold_refresh_abc',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/calendar'],
    expiresAt: futureIso,
    calendarAccessVerified: true,
    privilegedClient: mockSupabaseClient
  });
  assert(persistOut.success === true && unauthorizedPrivilegedWrites === 0, 'persistAuthoritativeGoogleAccount verifies existing user/org/membership with zero user/org mutations');
  const persistedGmail = storedDbRows.get('ga_usr_prod_cold_1_sohamkharat481@gmail.com_gmail');
  assert(typeof persistedGmail?.expiry_date === 'number' && persistedGmail.expiry_date === normalizeExpiryMs(futureIso), 'Persists expiry_date as BIGINT integer ms matching schema.sql');
  assert(persistedGmail?.status === 'CONNECTED', 'Persists explicit CONNECTED status for Gmail row when gmail.send scope granted');
  assert(usersTable.get('usr_prod_cold_1')?.role === 'SALES' && usersTable.get('usr_prod_cold_1')?.is_verified === false, 'Preserves existing non-owner role (SALES) and unverified flag untouched');

  // Test 15: Unified status & send resolution round-trip + same-org multi-user isolation
  console.log('\nTest 15: Same-org multi-user isolation guarantees status & send resolvers agree strictly');
  const origEnv15 = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const aliceStatus = await queryAuthoritativeGmailAccounts({
    organizationId: 'org_cold_1',
    userId: 'usr_prod_cold_1',
    privilegedClient: mockSupabaseClient
  });
  const aliceResolved = await resolveAuthoritativeGmailAccount({
    organizationId: 'org_cold_1',
    userId: 'usr_prod_cold_1',
    privilegedClient: mockSupabaseClient
  });
  assert(aliceStatus.length === 1 && aliceStatus[0].status === 'CONNECTED' && aliceStatus[0].email === 'sohamkharat481@gmail.com', 'Status endpoint query returns CONNECTED account in production');
  assert((aliceStatus[0] as any).accessToken === undefined && (aliceStatus[0] as any).refreshToken === undefined, 'Status query strips all OAuth tokens');
  assert(aliceResolved !== null && aliceResolved.status === 'CONNECTED' && aliceResolved.email === 'sohamkharat481@gmail.com', 'Test Email resolver resolves identical CONNECTED account');

  // Same org, different user (Bob) must see NOTHING and resolve NOTHING
  const bobStatus = await queryAuthoritativeGmailAccounts({
    organizationId: 'org_cold_1',
    userId: 'usr_prod_bob_2',
    privilegedClient: mockSupabaseClient
  });
  const bobResolved = await resolveAuthoritativeGmailAccount({
    organizationId: 'org_cold_1',
    userId: 'usr_prod_bob_2',
    privilegedClient: mockSupabaseClient
  });
  assert(bobStatus.length === 0 && bobResolved === null, 'Different user in SAME org never inherits User 1 connected Gmail account');

  // Test 16: Calendar account resolution with BIGINT expiry_date
  console.log('\nTest 16: resolveAuthoritativeCalendarAccount parses BIGINT expiry_date properly');
  const calResolved = await resolveAuthoritativeCalendarAccount({
    organizationId: 'org_cold_1',
    userId: 'usr_prod_cold_1',
    privilegedClient: mockSupabaseClient
  });
  assert(calResolved !== null && calResolved.status === 'CONNECTED' && calResolved.expiresAt === formatExpiryIso(futureMs), 'Calendar resolver handles BIGINT expiry_date accurately');

  // Test 17: Expired BIGINT token without refresh sets REAUTH_REQUIRED consistently across status & send
  console.log('\nTest 17: Expired BIGINT token without refresh reports REAUTH_REQUIRED identically across status and resolver');
  storedDbRows.set('ga_usr_expired_1_expired@coldorg.com_gmail', {
    id: 'ga_usr_expired_1_expired@coldorg.com_gmail',
    user_id: 'usr_expired_1',
    organization_id: 'org_cold_1',
    email: 'expired@coldorg.com',
    access_token: 'ya29.expired_real_token',
    refresh_token: '',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    expiry_date: Date.now() - 120000,
    account_type: 'gmail',
    status: 'CONNECTED',
    created_at: new Date().toISOString()
  });
  const expiredQuery = await queryAuthoritativeGmailAccounts({
    organizationId: 'org_cold_1',
    userId: 'usr_expired_1',
    privilegedClient: mockSupabaseClient
  });
  const expiredResolve = await resolveAuthoritativeGmailAccount({
    organizationId: 'org_cold_1',
    userId: 'usr_expired_1',
    privilegedClient: mockSupabaseClient
  });
  assert(expiredQuery[0]?.status === 'REAUTH_REQUIRED' && expiredResolve?.status === 'REAUTH_REQUIRED', 'Expired BIGINT expiry_date without refresh agrees across query & resolve');
  process.env.NODE_ENV = origEnv15;

  // Test 18: Security — Missing user cannot trigger automatic user/OWNER creation or verification
  console.log('\nTest 18: Missing authenticated user rejects clearly and never creates OWNER or verified user');
  const userCountBefore = usersTable.size;
  const googleCountBeforeMissingUser = storedDbRows.size;
  let missingUserErr = '';
  try {
    await persistAuthoritativeGoogleAccount({
      userId: 'usr_nonexistent_attacker',
      userEmail: 'attacker@evil.com',
      organizationId: 'org_cold_1',
      email: 'attacker-gmail@gmail.com',
      accessToken: 'ya29.real_token_attacker',
      refreshToken: '1//refresh_attacker',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      expiresAt: futureIso,
      privilegedClient: mockSupabaseClient
    });
  } catch (err: any) {
    missingUserErr = err?.message || String(err);
  }
  assert(
    missingUserErr.includes('authenticated user does not exist') &&
      usersTable.size === userCountBefore &&
      storedDbRows.size === googleCountBeforeMissingUser &&
      unauthorizedPrivilegedWrites === 0,
    'Missing user throws clear persistence error with zero user/OWNER creation and zero google_accounts write'
  );

  // Test 19: Security — Missing organization cannot trigger automatic organization/OWNER creation
  console.log('\nTest 19: Missing organization rejects clearly and never provisions organizations or OWNER roles');
  const orgCountBefore = orgsTable.size;
  let missingOrgErr = '';
  try {
    await persistAuthoritativeGoogleAccount({
      userId: 'usr_prod_cold_1',
      userEmail: 'alice@coldorg.com',
      organizationId: 'org_nonexistent_target',
      email: 'alice.gmail@gmail.com',
      accessToken: 'ya29.real_token_alice',
      refreshToken: '1//refresh_alice',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      expiresAt: futureIso,
      privilegedClient: mockSupabaseClient
    });
  } catch (err: any) {
    missingOrgErr = err?.message || String(err);
  }
  assert(
    missingOrgErr.includes('target organization does not exist') &&
      orgsTable.size === orgCountBefore &&
      storedDbRows.size === googleCountBeforeMissingUser &&
      unauthorizedPrivilegedWrites === 0,
    'Missing organization throws clear persistence error with zero org creation and zero role escalation'
  );

  // Test 20: Security — Existing user without verified membership (or INVITED only) in target org is rejected
  console.log('\nTest 20: User lacking active organization membership rejects clearly without creating membership or OWNER');
  let noMembershipErr = '';
  try {
    await persistAuthoritativeGoogleAccount({
      userId: 'usr_no_membership',
      userEmail: 'outsider@otherorg.com',
      organizationId: 'org_cold_1',
      email: 'outsider@gmail.com',
      accessToken: 'ya29.real_token_outsider',
      refreshToken: '1//refresh_outsider',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      expiresAt: futureIso,
      privilegedClient: mockSupabaseClient
    });
  } catch (err: any) {
    noMembershipErr = err?.message || String(err);
  }
  assert(
    noMembershipErr.includes('verified membership') &&
      usersTable.get('usr_no_membership')?.role === 'MEMBER' &&
      unauthorizedPrivilegedWrites === 0,
    'User without membership in target organization is rejected and stays MEMBER'
  );

  let invitedOnlyErr = '';
  try {
    await persistAuthoritativeGoogleAccount({
      userId: 'usr_invited_only',
      userEmail: 'invited@coldorg.com',
      organizationId: 'org_cold_1',
      email: 'invited@gmail.com',
      accessToken: 'ya29.real_token_invited',
      refreshToken: '1//refresh_invited',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      expiresAt: futureIso,
      privilegedClient: mockSupabaseClient
    });
  } catch (err: any) {
    invitedOnlyErr = err?.message || String(err);
  }
  assert(
    invitedOnlyErr.includes('verified membership') &&
      usersTable.get('usr_invited_only')?.role === 'VIEWER' &&
      unauthorizedPrivilegedWrites === 0,
    'INVITED-only team member cannot persist credentials or auto-activate/escalate role'
  );

  // Test 21: Canonical identity resolution via verified userEmail preserves existing canonical ID & active team_members membership
  console.log('\nTest 21: Resolves canonical database user ID from verified userEmail and checks active team_members membership');
  const repPersistOut = await persistAuthoritativeGoogleAccount({
    userId: 'sb_jwt_alias_rep_999',
    userEmail: 'rep@coldorg.com',
    organizationId: 'org_cold_1',
    email: 'rep.outreach@gmail.com',
    accessToken: 'ya29.real_token_rep',
    refreshToken: '1//refresh_rep',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    expiresAt: futureIso,
    privilegedClient: mockSupabaseClient
  });
  assert(
    repPersistOut.success === true &&
      repPersistOut.gmailId === 'ga_usr_team_member_sales_rep.outreach@gmail.com_gmail' &&
      storedDbRows.get(repPersistOut.gmailId)?.user_id === 'usr_team_member_sales' &&
      usersTable.get('usr_team_member_sales')?.role === 'SALES' &&
      usersTable.get('usr_team_member_sales')?.is_verified === false &&
      unauthorizedPrivilegedWrites === 0,
    'Resolves canonical user_id from public.users without altering SALES role or is_verified=false'
  );

  // Test 22: Founder role & customer roles remain untouched across OAuth persistence
  console.log('\nTest 22: Legitimate founder account persists Gmail OAuth while preserving founder role intact');
  const founderPersistOut = await persistAuthoritativeGoogleAccount({
    userId: 'usr_founder_real',
    userEmail: 'founder@salespilot.ai',
    organizationId: 'org_salespilot_lifetime',
    email: 'founder@salespilot.ai',
    accessToken: 'ya29.real_token_founder',
    refreshToken: '1//refresh_founder',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    expiresAt: futureIso,
    privilegedClient: mockSupabaseClient
  });
  assert(
    founderPersistOut.success === true &&
      usersTable.get('usr_founder_real')?.role === 'OWNER' &&
      usersTable.get('usr_founder_real')?.is_founder === true &&
      unauthorizedPrivilegedWrites === 0,
    'Legitimate founder account persists OAuth cleanly without mutating user or organization rows'
  );

  // Test 23: FK 23503 from google_accounts never auto-creates users/orgs and propagates persistence error
  console.log('\nTest 23: FK 23503 error on google_accounts never auto-creates users or organizations');
  forceGoogleAccountsFkError = true;
  let fkErrMsg = '';
  try {
    await persistAuthoritativeGoogleAccount({
      userId: 'usr_prod_cold_1',
      userEmail: 'alice@coldorg.com',
      organizationId: 'org_cold_1',
      email: 'fktest@gmail.com',
      accessToken: 'ya29.real_token_fk',
      refreshToken: '1//refresh_fk',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      expiresAt: futureIso,
      privilegedClient: mockSupabaseClient
    });
  } catch (err: any) {
    fkErrMsg = err?.message || String(err);
  } finally {
    forceGoogleAccountsFkError = false;
  }
  assert(
    fkErrMsg.includes('Failed to persist Google account to database') && unauthorizedPrivilegedWrites === 0,
    'FK 23503 fails loudly with zero user or organization upsert attempts'
  );

  console.log(`\n=== ALL GMAIL RESOLUTION REGRESSION TESTS PASSED (${passedCount}/${totalCount}) ===\n`);
  return { passedCount, totalCount };
}

// Auto-run if executed via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runGmailResolutionTests().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
}
