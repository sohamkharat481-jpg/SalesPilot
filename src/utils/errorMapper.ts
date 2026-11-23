/**
 * Production-Safe Client Error Mapping Layer
 * Ensures internal technical details (JWTs, Supabase, Postgres, tenant IDs, stack traces, 
 * organizationId mismatches, Vercel/OAuth internals) are NEVER exposed to end customers.
 */

function hasInternalTechnicalLeak(errorStr: string): boolean {
  const lower = errorStr.toLowerCase();
  return (
    lower.includes('supabase') ||
    lower.includes('postgres') ||
    lower.includes('sql') ||
    lower.includes('database query failed') ||
    lower.includes('relation "') ||
    lower.includes('vercel') ||
    lower.includes('https://') ||
    lower.includes('http://') ||
    lower.includes('econnrefused') ||
    lower.includes('typeerror:') ||
    /^(error|typeerror|referenceerror|syntaxerror|rangeerror|internalerror):|\b(oauth error|postgresql error|postgres error|database error):/i.test(errorStr) ||
    lower.includes('{"error"') ||
    lower.includes('stack') ||
    lower.includes('postgresql://') ||
    lower.includes('postgres://') ||
    lower.includes('service_role') ||
    lower.includes('access_token') ||
    lower.includes('refresh_token') ||
    lower.includes('ya29.') ||
    lower.includes('gocspx-') ||
    lower.includes('google_client_id') ||
    lower.includes('google_client_secret') ||
    lower.includes('organizationid') ||
    lower.includes('cross-tenant') ||
    lower.includes('organization mismatch') ||
    lower.includes('invalid_request') ||
    lower.includes('tokenexpirederror') ||
    lower.includes('undefined') ||
    lower.includes('null')
  );
}

export function sanitizeUserFacingError(rawError: unknown, fallbackMessage = 'Something went wrong. Please try again.'): string {
  if (!rawError) return fallbackMessage;

  const errorStr = (
    typeof rawError === 'string'
      ? rawError
      : typeof rawError === 'object' && rawError !== null && 'message' in rawError && typeof (rawError as any).message === 'string'
        ? (rawError as any).message
        : typeof rawError === 'object' && rawError !== null && 'error' in rawError && typeof (rawError as any).error === 'string'
          ? (rawError as any).error
          : String(rawError)
  ).trim();

  if (!errorStr) return fallbackMessage;
  const lower = errorStr.toLowerCase();

  // 1. Session Expiry & Authentication Leaks
  if (
    lower.includes('jwt expired') ||
    lower.includes('invalid jwt') ||
    lower.includes('token expired') ||
    lower.includes('no active session') ||
    lower.includes('auth session expired') ||
    lower.includes('sign in before') ||
    lower.includes('authenticated salespilot session expired')
  ) {
    return 'Your session has expired. Please sign in again.';
  }

  // 2. Preserve actionable clean HTTP / Auth / Subscription / OAuth diagnostic messages
  // when they do NOT leak internal stack traces, secrets, URLs, SQL, or raw JSON.
  if (!hasInternalTechnicalLeak(errorStr)) {
    if (
      lower.includes('unauthorized') ||
      lower.includes('authentication token required') ||
      lower.includes('subscription has expired') ||
      lower.includes('renew your subscription') ||
      lower.includes('redirect uri mismatch') ||
      lower.includes('redirect_uri_mismatch') ||
      lower.includes('invalid_client') ||
      lower.includes('authorization code expired') ||
      lower.includes('authorization session expired') ||
      lower.includes('canceled or denied') ||
      lower.includes('permissions were not granted') ||
      lower.includes('scopes are invalid') ||
      lower.includes('google did not return') ||
      lower.includes('google oauth server credentials are missing') ||
      lower.includes('unable to save google authorization') ||
      lower.includes('server database configuration error') ||
      lower.includes('unable to retrieve your google account profile') ||
      lower.includes('google token exchange failed') ||
      lower.includes('google authorization failed') ||
      lower.includes('popup') ||
      lower.includes('http ')
    ) {
      return errorStr;
    }
  }

  // 3. Generic session expiry fallback
  if (lower.includes('session expired')) {
    return 'Your session has expired. Please sign in again.';
  }

  // 4. Sandbox Creation Failures
  if (lower.includes('sandbox')) {
    return 'Unable to create the sandbox account. Please try again.';
  }

  // 5. Organization / Workspace / Tenant Access Leaks
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

  // 6. Google Configuration Missing / Unavailable
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

  // 7. Raw Google OAuth / API Technical Failures
  if (
    lower.includes('google') ||
    lower.includes('oauth') ||
    lower.includes('access_denied') ||
    lower.includes('popup blocker') ||
    lower.includes('scopes')
  ) {
    return 'Unable to connect your Google account. Please try again.';
  }

  // 8. Network Failures & Connectivity
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

  // 9. Database / Supabase / Technical Stack Trace Leaks
  if (
    lower.includes('supabase') ||
    lower.includes('postgres') ||
    lower.includes('sql') ||
    lower.includes('database') ||
    lower.includes('vercel') ||
    lower.includes('stack') ||
    /^(error|typeerror|referenceerror|syntaxerror|rangeerror|internalerror):|\b(oauth error|postgresql error|postgres error|database error):/i.test(errorStr) ||
    lower.includes('http 5') ||
    lower.includes('500') ||
    lower.includes('undefined') ||
    lower.includes('null')
  ) {
    return 'Something went wrong. Please try again.';
  }

  // Preserve safe plain-text backend messages if concise & free of internal leaks
  if (!hasInternalTechnicalLeak(errorStr) && errorStr.length <= 240) {
    return errorStr;
  }

  return fallbackMessage;
}

export const cleanErrorMessage = sanitizeUserFacingError;

