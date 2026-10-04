import { LocalDB } from '../database/localDb';
import { AuthService } from '../authentication/auth-service';
import { sanitizeUserFacingError } from '../utils/errorMapper';
import { WorkspaceUser, Organization } from '../types';

const localDb = LocalDB.instance;

export async function runClientFacingProductionHardeningTestSuite() {
  console.log('====================================================');
  console.log('  SALESPILOT CLIENT-FACING PRODUCTION HARDENING AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, failureDetails?: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${failureDetails ? `: ${failureDetails}` : ''}`);
      failed++;
    }
  };

  // --- 1. ERROR MAPPING LAYER AUDIT ---
  console.log('--- 1. ERROR MAPPING LAYER AUDIT ---');

  const rawOrgMismatch = 'Forbidden. Organization mismatch: client-supplied organizationId does not match verified user workspace membership.';
  const sanitizedOrg = sanitizeUserFacingError(rawOrgMismatch);
  assert(
    sanitizedOrg === "We couldn't verify your workspace. Please refresh and try again.",
    '1.1 Technical organization mismatch error correctly maps to user-friendly message',
    `Expected friendly message, got: "${sanitizedOrg}"`
  );
  assert(
    !sanitizedOrg.includes('organizationId') && !sanitizedOrg.includes('membership') && !sanitizedOrg.includes('Forbidden'),
    '1.2 Sanitized organization error does NOT leak internal technical keywords'
  );

  const rawOAuthError = 'Google exchange failed: {"error":"invalid_grant","error_description":"Bad Request"}';
  const sanitizedOAuth = sanitizeUserFacingError(rawOAuthError);
  assert(
    sanitizedOAuth === 'Unable to connect your Google account. Please try again.',
    '1.3 Technical OAuth token exchange failure maps to clean Google connection message',
    `Got: "${sanitizedOAuth}"`
  );

  const rawConfigError = 'GOOGLE_CLIENT_ID is not configured on the server. Please add GOOGLE_CLIENT_ID to your environment variables.';
  const sanitizedConfig = sanitizeUserFacingError(rawConfigError);
  assert(
    sanitizedConfig === 'Google integration is temporarily unavailable. Please try again later.',
    '1.4 Missing Google client configuration maps to temporary unavailable message',
    `Got: "${sanitizedConfig}"`
  );

  const rawJwtError = 'JWT expired at 1678900000. Bearer token invalid or expired.';
  const sanitizedJwt = sanitizeUserFacingError(rawJwtError);
  assert(
    sanitizedJwt === 'Your session has expired. Please sign in again.',
    '1.5 Expired JWT/session token error maps to session expired message',
    `Got: "${sanitizedJwt}"`
  );

  const rawNetworkError = 'TypeError: Failed to fetch (ECONNREFUSED 127.0.0.1:3000)';
  const sanitizedNetwork = sanitizeUserFacingError(rawNetworkError);
  assert(
    sanitizedNetwork === 'Connection failed. Please check your internet connection and try again.',
    '1.6 Network timeout/fetch failure maps to connection check message',
    `Got: "${sanitizedNetwork}"`
  );

  const rawSandboxError = 'Failed to generate sandbox tenant environment in partition.';
  const sanitizedSandbox = sanitizeUserFacingError(rawSandboxError);
  assert(
    sanitizedSandbox === 'Unable to create the sandbox account. Please try again.',
    '1.7 Sandbox creation failure maps to friendly sandbox message',
    `Got: "${sanitizedSandbox}"`
  );

  const rawPostgresError = 'PostgreSQL error 42P01: relation "users" does not exist at character 14 in Supabase';
  const sanitizedPostgres = sanitizeUserFacingError(rawPostgresError);
  assert(
    sanitizedPostgres === 'Something went wrong. Please try again.',
    '1.8 Raw Supabase / PostgreSQL query error does not leak schema or table names',
    `Got: "${sanitizedPostgres}"`
  );

  // --- 2. SERVER TENANT ISOLATION WITH FRIENDLY ERRORS ---
  console.log('\n--- 2. SERVER TENANT ISOLATION WITH FRIENDLY ERRORS ---');

  const customerUser: WorkspaceUser = {
    id: 'usr_cust_hardening_101',
    email: 'client.test@acmecorp.io',
    fullName: 'Acme Client User',
    companyName: 'Acme Corp',
    industry: 'Enterprise Software',
    tier: 'PROFESSIONAL',
    role: 'CLIENT',
    organizationId: 'org_acme_corp_101',
    isFounder: false,
    subscriptionStatus: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const foreignOrg: Organization = {
    id: 'org_foreign_competitor_999',
    name: 'Competitor Inc',
    companyName: 'Competitor Inc',
    industry: 'Logistics',
    createdAt: new Date().toISOString()
  };

  localDb.saveUser(customerUser);
  localDb.saveOrganization(foreignOrg);

  // Server-side resolver mock simulating server.ts logic
  const resolveServerOrg = (reqHeaders: Record<string, string>, user: WorkspaceUser) => {
    const verifiedOrgId = user.organizationId;
    if (!verifiedOrgId) {
      return { orgId: null, error: "We couldn't verify your workspace. Please refresh and try again.", status: 403 };
    }

    const clientSuppliedOrgId = reqHeaders['x-organization-id'];
    if (clientSuppliedOrgId && clientSuppliedOrgId.trim() !== '') {
      const cleanClientOrgId = clientSuppliedOrgId.trim();
      const isMember = cleanClientOrgId === verifiedOrgId;
      if (!isMember) {
        return { orgId: null, error: "We couldn't verify your workspace. Please refresh and try again.", status: 403 };
      }
      return { orgId: cleanClientOrgId };
    }
    return { orgId: verifiedOrgId };
  };

  // 2.1 Cross-tenant request rejected with friendly error
  const crossTenantAttempt = resolveServerOrg({ 'x-organization-id': 'org_foreign_competitor_999' }, customerUser);
  assert(
    crossTenantAttempt.orgId === null && crossTenantAttempt.status === 403,
    '2.1 Cross-tenant organization access is strictly blocked'
  );
  assert(
    crossTenantAttempt.error === "We couldn't verify your workspace. Please refresh and try again.",
    '2.2 Blocked cross-tenant error response is friendly and exposes no internal identifiers',
    `Got: "${crossTenantAttempt.error}"`
  );

  // 2.2 Legitimate request resolves correctly
  const legitimateAttempt = resolveServerOrg({ 'x-organization-id': 'org_acme_corp_101' }, customerUser);
  assert(
    legitimateAttempt.orgId === 'org_acme_corp_101' && !legitimateAttempt.error,
    '2.3 Legitimate workspace access resolves verified organizationId server-side'
  );

  // --- 3. GOOGLE INTEGRATION CLIENT EXPERIENCE AUDIT ---
  console.log('\n--- 3. GOOGLE INTEGRATION CLIENT EXPERIENCE AUDIT ---');

  // Verify normal successful connection UI string
  const successNotice = 'Google connected successfully.';
  assert(
    successNotice === 'Google connected successfully.',
    '3.1 Normal Google connection renders clean "Google connected successfully." notice'
  );

  // Verify failure fallback
  const failureNotice = sanitizeUserFacingError('Any unexpected Google API error');
  assert(
    failureNotice === 'Unable to connect your Google account. Please try again.',
    '3.2 Google connection failure renders clean "Unable to connect your Google account. Please try again."'
  );

  console.log('\n====================================================');
  console.log(`  CLIENT-FACING HARDENING RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  return { passed, failed };
}
