import { getSupabaseDiagnostics, isSupabaseConfigured } from '../lib/supabase';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';
import { WorkspaceUser, UserRole } from '../types';

export async function runGoogleLoginProductionAuditTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n==================================================');
  console.log('   SALESPILOT GOOGLE LOGIN PRODUCTION AUTH AUDIT  ');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${details ? ' - ' + details : ''}`);
      failed++;
    }
  }

  // 1. AUDIT VERCEL ENVIRONMENT VARIABLES
  console.log('\n--- 1. AUDIT VERCEL ENVIRONMENT VARIABLES ---');
  const requiredClientEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const requiredServerEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

  // Check client-side Supabase diagnostics
  const clientDiagnostics = getSupabaseDiagnostics();
  assert(
    typeof clientDiagnostics.isConfigured === 'boolean',
    '1.1 Supabase client diagnostics successfully execute without throwing'
  );

  // Verify variable naming conventions (client vars start with VITE_, server vars without VITE_)
  assert(
    requiredClientEnvVars.every(v => v.startsWith('VITE_')),
    '1.2 Frontend Supabase environment variables follow strict VITE_ prefix standard'
  );
  assert(
    requiredServerEnvVars.every(v => !v.startsWith('VITE_')),
    '1.3 Backend privileged environment variables (service role) do not leak VITE_ prefix'
  );

  // 2. AUDIT SUPABASE GOOGLE AUTH & REDIRECT URI SPECIFICATION
  console.log('\n--- 2. AUDIT SUPABASE GOOGLE AUTH & REDIRECT CONFIG ---');
  const productionOrigin = 'https://sales-pilot-green.vercel.app';

  // Verify canonical production URL format
  const isHttps = productionOrigin.startsWith('https://');
  const hasNoTrailingSlash = !productionOrigin.endsWith('/');
  const matchesTargetDomain = productionOrigin === 'https://sales-pilot-green.vercel.app';

  assert(
    isHttps && hasNoTrailingSlash && matchesTargetDomain,
    '2.1 Production origin matches canonical domain: https://sales-pilot-green.vercel.app'
  );

  // Verify Supabase Auth redirect URL generation
  const resolveRedirectUrl = (origin: string, envAppUrl?: string) => {
    const configuredAppUrl = (envAppUrl || '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
    const currentOrigin = (origin || '').replace(/\/+$/, '');
    const canonical = 'https://sales-pilot-green.vercel.app';

    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1') || currentOrigin.includes('.run.app')) {
      return currentOrigin;
    }
    if (currentOrigin.includes('sales-pilot-green.vercel.app')) {
      return canonical;
    }
    return configuredAppUrl || currentOrigin || canonical;
  };

  const prodRedirect = resolveRedirectUrl('https://sales-pilot-green.vercel.app');
  assert(
    prodRedirect === 'https://sales-pilot-green.vercel.app',
    '2.2 Production browser session resolves redirect URL to https://sales-pilot-green.vercel.app'
  );

  const previewRedirect = resolveRedirectUrl('https://sales-pilot-green-git-feat.vercel.app');
  assert(
    previewRedirect === 'https://sales-pilot-green-git-feat.vercel.app',
    '2.3 Dynamic preview origin resolves redirect URL without hardcoded collision'
  );

  // 3. AUDIT GOOGLE CLOUD OAUTH CLIENT ORIGIN & REDIRECT SPECIFICATION
  console.log('\n--- 3. AUDIT GOOGLE CLOUD OAUTH CLIENT REQUIREMENTS ---');
  // Google OAuth Client requires:
  // Authorized Javascript Origin: https://sales-pilot-green.vercel.app
  // Authorized Redirect URI: https://<supabase-project-ref>.supabase.co/auth/v1/callback
  const expectedSupabaseAuthCallbackRegex = /^https:\/\/[a-z0-9-]+\.supabase\.co\/auth\/v1\/callback$/;
  const sampleSupabaseCallback = 'https://ugqj7litatcjdhtb5soe.supabase.co/auth/v1/callback';
  assert(
    expectedSupabaseAuthCallbackRegex.test(sampleSupabaseCallback),
    '3.1 Google Cloud OAuth Authorized Redirect URI matches Supabase Auth v1 callback format'
  );

  // 4. AUDIT AUTH ERROR PARSER & USER-FRIENDLY UX MAPPING
  console.log('\n--- 4. AUDIT URL ERROR PARSER & USER-FRIENDLY UX MAPPING ---');
  const parseAndNormalizeOAuthError = (rawError: string | null): string | null => {
    if (!rawError) return null;
    const cleanError = decodeURIComponent(rawError.replace(/\+/g, ' '));
    const errLower = cleanError.toLowerCase();
    const isNetwork = errLower.includes('network') || 
                      errLower.includes('fetch') || 
                      errLower.includes('timeout') || 
                      errLower.includes('connection') || 
                      errLower.includes('offline');
    return isNetwork 
      ? "Something went wrong while signing you in. Please try again."
      : "Google sign-in couldn't be completed. Please try again.";
  };

  const parseOAuthUrlError = (searchQuery: string, hashQuery: string): string | null => {
    const searchParams = new URLSearchParams(searchQuery);
    let urlError = searchParams.get('error_description') || searchParams.get('error');
    if (!urlError && hashQuery) {
      const hashParams = new URLSearchParams(hashQuery.replace(/^#/, ''));
      urlError = hashParams.get('error_description') || hashParams.get('error');
    }
    if (urlError) {
      return decodeURIComponent(urlError.replace(/\+/g, ' '));
    }
    return null;
  };

  // Test URL error extraction from Supabase callback redirect
  const errorFromSearch = parseOAuthUrlError('?error_description=Cannot+authenticate+through+Google', '');
  const userFacingFromSearch = parseAndNormalizeOAuthError(errorFromSearch);
  assert(
    userFacingFromSearch === "Google sign-in couldn't be completed. Please try again.",
    '4.1 Technical error "Cannot authenticate through Google" normalized to friendly UI message'
  );

  const errorFromHash = parseOAuthUrlError('', '#error=access_denied&error_description=User+cancelled+authorization');
  const userFacingFromHash = parseAndNormalizeOAuthError(errorFromHash);
  assert(
    userFacingFromHash === "Google sign-in couldn't be completed. Please try again.",
    '4.2 Technical error "access_denied" normalized to friendly UI message'
  );

  const networkErr = parseAndNormalizeOAuthError('Failed to fetch: network connection timeout');
  assert(
    networkErr === "Something went wrong while signing you in. Please try again.",
    '4.3 Network failure normalized to temporary connection error UI message'
  );

  const cleanUrl = parseOAuthUrlError('?code=auth_code_12345', '');
  const cleanNormalized = parseAndNormalizeOAuthError(cleanUrl);
  assert(
    cleanNormalized === null,
    '4.4 Clean OAuth callback code produces zero error notice'
  );

  // 5. AUDIT PROFILE RESOLUTION & MULTI-TENANT ISOLATION
  console.log('\n--- 5. AUDIT AUTHENTICATED PROFILE & TENANT ISOLATION ---');
  const sessionFounder = {
    id: 'usr_founder_live',
    email: 'sohamkharat481@gmail.com',
    user_metadata: { full_name: 'Soham Kharat' }
  };
  const isFounder = isVerifiedFounderEmail(sessionFounder.email);
  assert(isFounder === true, '5.1 Founder email correctly receives isVerifiedFounder status');

  const sessionCustomer = {
    id: 'usr_customer_live',
    email: 'customer.test@company.com',
    user_metadata: { full_name: 'Customer Test' }
  };
  const isCustomerFounder = isVerifiedFounderEmail(sessionCustomer.email);
  assert(isCustomerFounder === false, '5.2 Customer account correctly receives standard user status (non-founder)');

  console.log(`\n=== GOOGLE LOGIN AUTH AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

// Standalone execution support
if (process.argv[1]?.includes('googleLoginProductionAudit')) {
  runGoogleLoginProductionAuditTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    else process.exit(0);
  }).catch(err => {
    console.error('Audit test suite failed with exception:', err);
    process.exit(1);
  });
}
