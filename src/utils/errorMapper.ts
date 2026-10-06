/**
 * Production-Safe Client Error Mapping Layer
 * Ensures internal technical details (JWTs, Supabase, Postgres, tenant IDs, stack traces, 
 * organizationId mismatches, Vercel/OAuth internals) are NEVER exposed to end customers.
 */

export function sanitizeUserFacingError(rawError: unknown, fallbackMessage = 'Something went wrong. Please try again.'): string {
  if (!rawError) return fallbackMessage;

  const errorStr = typeof rawError === 'string' 
    ? rawError 
    : typeof rawError === 'object' && rawError !== null && 'message' in rawError && typeof (rawError as any).message === 'string'
      ? (rawError as any).message
      : typeof rawError === 'object' && rawError !== null && 'error' in rawError && typeof (rawError as any).error === 'string'
        ? (rawError as any).error
        : String(rawError);

  const lower = errorStr.toLowerCase();

  // 1. Session Expiry & Authentication
  if (
    lower.includes('jwt expired') ||
    lower.includes('invalid jwt') ||
    lower.includes('session expired') ||
    lower.includes('token expired') ||
    lower.includes('no active session') ||
    lower.includes('auth session expired') ||
    lower.includes('sign in before') ||
    lower.includes('authenticated salespilot session expired')
  ) {
    return 'Your session has expired. Please sign in again.';
  }

  // 2. Sandbox Creation Failures
  if (
    lower.includes('sandbox')
  ) {
    return 'Unable to create the sandbox account. Please try again.';
  }

  // 3. Organization / Workspace / Tenant Access
  if (
    lower.includes('organization') ||
    lower.includes('orgid') ||
    lower.includes('tenant') ||
    lower.includes('workspace membership') ||
    lower.includes('mismatch') ||
    lower.includes('not a member') ||
    lower.includes('cross-tenant') ||
    lower.includes('access denied') ||
    lower.includes('forbidden')
  ) {
    return "We couldn't verify your workspace. Please refresh and try again.";
  }

  // 3. Google Configuration Missing / Unavailable
  if (
    lower.includes('google_client_id') ||
    lower.includes('google_client_secret') ||
    lower.includes('client_id is missing') ||
    lower.includes('client_secret is missing') ||
    lower.includes('environment variables') ||
    lower.includes('temporarily unavailable')
  ) {
    return 'Google integration is temporarily unavailable. Please try again later.';
  }

  // 4. Google OAuth / Connection Failures
  if (
    lower.includes('google') ||
    lower.includes('oauth') ||
    lower.includes('access_denied') ||
    lower.includes('popup blocker') ||
    lower.includes('scopes')
  ) {
    return 'Unable to connect your Google account. Please try again.';
  }

  // 5. Network Failures & Connectivity
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused') ||
    lower.includes('connection') ||
    lower.includes('failed to fetch') ||
    lower.includes('offline')
  ) {
    return 'Connection failed. Please check your internet connection and try again.';
  }

  // 6. Database / Supabase / Technical Stack Trace Leaks
  if (
    lower.includes('supabase') ||
    lower.includes('postgres') ||
    lower.includes('sql') ||
    lower.includes('database') ||
    lower.includes('vercel') ||
    lower.includes('stack') ||
    lower.includes('error:') ||
    lower.includes('http 5') ||
    lower.includes('500') ||
    lower.includes('undefined') ||
    lower.includes('null')
  ) {
    return 'Something went wrong. Please try again.';
  }

  // Default clean fallback
  return fallbackMessage;
}

export const cleanErrorMessage = sanitizeUserFacingError;
