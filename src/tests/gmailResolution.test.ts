import { resolveAuthoritativeGmailAccount, queryAuthoritativeGmailAccounts, hasRequiredGmailSendScope } from '../backend/googleAccountsService';
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
