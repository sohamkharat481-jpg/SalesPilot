import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { getPrivilegedSupabaseServerClient } from '../lib/supabase.server';
import { LocalDB } from '../database/localDb';

export function createCorrelationRequestId(existingId?: string | null): string {
  const clean = typeof existingId === 'string' ? existingId.trim() : '';
  if (clean) return clean;
  return `req_${crypto.randomBytes(8).toString('hex')}`;
}

export interface GooglePersistenceDiagnosticEntry {
  requestId: string;
  stage: string;
  userId?: string | null;
  organizationId?: string | null;
  operation: string;
  pgCode?: string;
  constraint?: string;
  classification: string;
  success: boolean;
  timestamp: string;
}

export function logGooglePersistenceDiagnostic(entry: Omit<GooglePersistenceDiagnosticEntry, 'timestamp'>): void {
  const payload: GooglePersistenceDiagnosticEntry = {
    requestId: entry.requestId,
    stage: entry.stage,
    userId: entry.userId || null,
    organizationId: entry.organizationId || null,
    operation: entry.operation,
    ...(entry.pgCode ? { pgCode: entry.pgCode } : {}),
    ...(entry.constraint ? { constraint: entry.constraint } : {}),
    classification: entry.classification,
    success: entry.success,
    timestamp: new Date().toISOString()
  };
  if (entry.success) {
    console.info('[GOOGLE OAUTH DIAGNOSTIC]', JSON.stringify(payload));
  } else {
    console.error('[GOOGLE OAUTH DIAGNOSTIC]', JSON.stringify(payload));
  }
}

export class GooglePersistenceDiagnosticsError extends Error {
  requestId: string;
  stage: string;
  pgCode?: string;
  classification: string;
  constraint?: string;
  httpStatus: number;

  constructor(
    message: string,
    meta: {
      requestId: string;
      stage: string;
      pgCode?: string;
      classification: string;
      constraint?: string;
      httpStatus?: number;
    }
  ) {
    super(message);
    this.name = 'GooglePersistenceDiagnosticsError';
    this.requestId = meta.requestId;
    this.stage = meta.stage;
    this.pgCode = meta.pgCode;
    this.classification = meta.classification;
    this.constraint = meta.constraint;
    this.httpStatus = meta.httpStatus || 500;
  }
}

export interface AuthoritativeGmailAccount {
  id?: string;
  userId?: string;
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  status: 'CONNECTED' | 'REAUTH_REQUIRED' | 'REAUTH_NEEDED' | 'ERROR' | string;
  createdAt: string;
  scopes: string[];
  organizationId: string;
  accountType: 'gmail';
}

export interface AuthoritativeCalendarAccount {
  id?: string;
  userId?: string;
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  status: 'CONNECTED' | 'REAUTH_REQUIRED' | 'REAUTH_NEEDED' | 'ERROR' | 'DISCONNECTED' | string;
  calendarAccessVerified?: boolean;
  createdAt: string;
  scopes: string[];
  organizationId: string;
  accountType: 'calendar';
}

export interface ResolveGmailAccountOptions {
  organizationId: string;
  userId?: string;
  senderEmail?: string;
  xOrganizationId?: string;
  privilegedClient?: SupabaseClient;
}

export interface ResolveCalendarAccountOptions {
  organizationId: string;
  userId: string;
  privilegedClient?: SupabaseClient;
}

export interface SupabaseAuthIdentityContext {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, any>;
  [key: string]: any;
}

export interface PersistGoogleAccountParams {
  userId: string;
  userEmail?: string;
  authIdentity?: SupabaseAuthIdentityContext | null;
  emailConfirmedAt?: string | null;
  organizationId: string;
  email: string;
  name?: string;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  expiresAt: string;
  calendarAccessVerified?: boolean;
  privilegedClient?: SupabaseClient;
  requestId?: string;
}

/**
 * Validates that an account possesses a required Gmail sending scope.
 *
 * Minimum required scope requested during OAuth: https://www.googleapis.com/auth/gmail.send
 * Also accepts full mail scopes: https://mail.google.com/, https://www.googleapis.com/auth/gmail.compose, https://www.googleapis.com/auth/gmail.modify.
 * An empty array, null, undefined, or missing scope is strictly treated as unauthorized.
 */
export function hasRequiredGmailSendScope(scopes: any): boolean {
  if (!scopes) return false;

  let scopesList: string[] = [];
  if (Array.isArray(scopes)) {
    scopesList = scopes.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof scopes === 'string') {
    scopesList = scopes.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  } else {
    return false;
  }

  if (scopesList.length === 0) {
    return false;
  }

  const validSendScopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://mail.google.com/',
    'https://mail.google.com',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify'
  ];

  return scopesList.some(s => validSendScopes.includes(s.toLowerCase()));
}

/**
 * Validates that an account possesses a Google Calendar scope.
 */
export function hasRequiredCalendarScope(scopes: any): boolean {
  if (!scopes) return false;
  let scopesList: string[] = [];
  if (Array.isArray(scopes)) {
    scopesList = scopes.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof scopes === 'string') {
    scopesList = scopes.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  } else {
    return false;
  }
  if (scopesList.length === 0) return false;
  return scopesList.some(s => {
    const lower = s.toLowerCase();
    return (
      lower === 'https://www.googleapis.com/auth/calendar' ||
      lower === 'https://www.googleapis.com/auth/calendar.events' ||
      lower === 'https://www.googleapis.com/auth/calendar.readonly' ||
      lower.includes('auth/calendar')
    );
  });
}

/**
 * Normalizes an expiry value (ISO string, epoch ms number, or numeric string) into epoch milliseconds.
 * Matches schema.sql where public.google_accounts.expiry_date is BIGINT.
 */
export function normalizeExpiryMs(rawExpiry: string | number | null | undefined): number {
  if (typeof rawExpiry === 'number' && Number.isFinite(rawExpiry)) {
    return Math.floor(rawExpiry);
  }
  if (typeof rawExpiry === 'string') {
    const trimmed = rawExpiry.trim();
    if (trimmed !== '') {
      if (/^\d+$/.test(trimmed)) {
        const num = Number(trimmed);
        if (Number.isFinite(num)) return Math.floor(num);
      }
      const parsed = Date.parse(trimmed);
      if (Number.isFinite(parsed)) {
        return Math.floor(parsed);
      }
    }
  }
  return Date.now() + 3600000;
}

/**
 * Formats an expiry value (BIGINT epoch ms, numeric string, or ISO string) into an ISO-8601 string.
 */
export function formatExpiryIso(rawExpiry: string | number | null | undefined, fallbackMs: number = Date.now() + 3600000): string {
  if (typeof rawExpiry === 'number' && Number.isFinite(rawExpiry)) {
    return new Date(rawExpiry).toISOString();
  }
  if (typeof rawExpiry === 'string') {
    const trimmed = rawExpiry.trim();
    if (trimmed !== '') {
      if (/^\d+$/.test(trimmed)) {
        const num = Number(trimmed);
        if (Number.isFinite(num)) return new Date(num).toISOString();
      }
      const parsed = Date.parse(trimmed);
      if (Number.isFinite(parsed)) {
        return new Date(parsed).toISOString();
      }
    }
  }
  return new Date(fallbackMs).toISOString();
}

/**
 * Returns true if the stored expiry value is missing, unparseable (NaN), or <= Date.now().
 */
export function isExpiryExpired(rawExpiry: string | number | null | undefined): boolean {
  if (rawExpiry === null || rawExpiry === undefined || rawExpiry === '') {
    return true;
  }
  if (typeof rawExpiry === 'number') {
    return !Number.isFinite(rawExpiry) || rawExpiry <= Date.now();
  }
  const trimmed = String(rawExpiry).trim();
  if (!trimmed) return true;
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    return !Number.isFinite(num) || num <= Date.now();
  }
  const parsedTime = Date.parse(trimmed);
  return !Number.isFinite(parsedTime) || parsedTime <= Date.now();
}

function resolveLocalDbFallback(cleanOrgId: string, userId?: string, senderEmail?: string): AuthoritativeGmailAccount | null {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCALDB_FALLBACK_IN_PRODUCTION !== 'true') {
      console.warn('[SAFE GMAIL RESOLVER] LocalDB fallback is disabled in production to prevent instance inconsistency.');
      return null;
    }
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      console.warn('[SAFE GMAIL RESOLVER] Rejection: userId is required for LocalDB fallback resolution.');
      return null;
    }
    const cleanUserId = userId.trim();
    const localDb = LocalDB.getInstance();
    const localAccounts = localDb.getGmailAccounts(cleanOrgId, cleanUserId);

    const matchingLocal = localAccounts.find(a => {
      const storedUserId = a.userId || a.user_id;
      const storedOrgId = a.organizationId || a.organization_id;
      const storedToken = a.accessToken || a.access_token;

      // Enforce strict ownership: stored userId and organizationId MUST exist and match exactly
      if (!storedUserId || String(storedUserId).trim() !== cleanUserId) return false;
      if (!storedOrgId || String(storedOrgId).trim() !== cleanOrgId) return false;

      // Must have valid non-mock access token
      if (!storedToken || typeof storedToken !== 'string' || storedToken.startsWith('mock_')) return false;

      // Filter by senderEmail if specified
      if (senderEmail && typeof senderEmail === 'string' && senderEmail.trim() !== '') {
        if ((a.email || '').toLowerCase().trim() !== senderEmail.trim().toLowerCase()) return false;
      }

      return true;
    });

    if (matchingLocal) {
      const storedToken = matchingLocal.accessToken || matchingLocal.access_token;
      const storedRefreshToken = matchingLocal.refreshToken || matchingLocal.refresh_token;
      const storedExpiry = matchingLocal.expiresAt || matchingLocal.expiry_date;
      const storedUserId = matchingLocal.userId || matchingLocal.user_id || cleanUserId;
      const storedOrgId = matchingLocal.organizationId || matchingLocal.organization_id || cleanOrgId;

      console.log('[SAFE GMAIL RESOLVER] Valid LocalDB account resolved for org:', cleanOrgId, 'user:', cleanUserId, 'email:', matchingLocal.email);
      const email = (matchingLocal.email || '').toLowerCase().trim();

      // OAuth Validation: Check expiration, NaN expiry handling, and explicit status
      const isExpired = isExpiryExpired(storedExpiry);

      const hasRefresh = Boolean(storedRefreshToken && String(storedRefreshToken).trim().length > 0);
      const isExplicitlyConnected = matchingLocal.status === 'CONNECTED';

      // Scope Validation: Validate required Gmail send scope presence
      const hasGmailScope = hasRequiredGmailSendScope(matchingLocal.scopes);

      let effectiveStatus = 'CONNECTED';
      if (!isExplicitlyConnected || (isExpired && !hasRefresh) || !hasGmailScope) {
        effectiveStatus = 'REAUTH_REQUIRED';
      }

      const scopesArr = Array.isArray(matchingLocal.scopes) 
        ? matchingLocal.scopes 
        : (typeof matchingLocal.scopes === 'string' ? matchingLocal.scopes.split(/[\s,]+/).filter(Boolean) : []);

      return {
        id: matchingLocal.id || `ga_${cleanUserId}_${email}_gmail`,
        userId: storedUserId,
        email,
        fullName: email.split('@')[0],
        accessToken: storedToken,
        refreshToken: storedRefreshToken || undefined,
        expiresAt: formatExpiryIso(storedExpiry, 0),
        status: effectiveStatus,
        createdAt: matchingLocal.createdAt || matchingLocal.created_at || new Date().toISOString(),
        scopes: scopesArr,
        organizationId: storedOrgId,
        accountType: 'gmail'
      };
    }
  } catch (localErr: any) {
    console.warn('[OUTREACH GOOGLE ACCOUNT] LocalDB fallback lookup failed:', localErr?.message);
  }
  return null;
}

function resolveLocalDbCalendarFallback(cleanOrgId: string, cleanUserId: string): AuthoritativeCalendarAccount | null {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCALDB_FALLBACK_IN_PRODUCTION !== 'true') {
      console.warn('[SAFE CALENDAR RESOLVER] LocalDB fallback is disabled in production to prevent instance inconsistency.');
      return null;
    }
    if (!cleanUserId || typeof cleanUserId !== 'string' || !cleanUserId.trim()) {
      return null;
    }
    const localDb = LocalDB.getInstance();
    const localAccounts = localDb.getCalendarAccounts(cleanOrgId, cleanUserId);

    const matchingLocal = localAccounts.find(a => {
      const storedUserId = a.userId || a.user_id;
      const storedOrgId = a.organizationId || a.organization_id;
      const storedToken = a.accessToken || a.access_token;

      if (!storedUserId || String(storedUserId).trim() !== cleanUserId) return false;
      if (!storedOrgId || String(storedOrgId).trim() !== cleanOrgId) return false;
      if (!storedToken || typeof storedToken !== 'string') return false;

      return true;
    });

    if (matchingLocal) {
      const storedToken = matchingLocal.accessToken || matchingLocal.access_token;
      const storedRefreshToken = matchingLocal.refreshToken || matchingLocal.refresh_token;
      const storedExpiry = matchingLocal.expiresAt || matchingLocal.expiry_date;
      const storedUserId = matchingLocal.userId || matchingLocal.user_id || cleanUserId;
      const storedOrgId = matchingLocal.organizationId || matchingLocal.organization_id || cleanOrgId;

      const email = (matchingLocal.email || '').toLowerCase().trim();

      const isExpired = isExpiryExpired(storedExpiry);

      const hasRefresh = Boolean(storedRefreshToken && String(storedRefreshToken).trim().length > 0);
      const isExplicitlyConnected = matchingLocal.status === 'CONNECTED';

      let effectiveStatus = 'CONNECTED';
      if (!isExplicitlyConnected || (isExpired && !hasRefresh && !storedToken.startsWith('mock_'))) {
        effectiveStatus = 'REAUTH_REQUIRED';
      }

      return {
        id: matchingLocal.id || `ca_${cleanUserId}_${email}_calendar`,
        userId: storedUserId,
        email,
        fullName: email.split('@')[0],
        accessToken: storedToken,
        refreshToken: storedRefreshToken || undefined,
        expiresAt: formatExpiryIso(storedExpiry, 0),
        status: effectiveStatus,
        calendarAccessVerified: effectiveStatus === 'CONNECTED',
        createdAt: matchingLocal.createdAt || matchingLocal.created_at || new Date().toISOString(),
        scopes: Array.isArray(matchingLocal.scopes) ? matchingLocal.scopes : [],
        organizationId: storedOrgId,
        accountType: 'calendar'
      };
    }
  } catch (localErr: any) {
    console.warn('[CALENDAR RESOLVER] LocalDB fallback lookup failed:', localErr?.message);
  }
  return null;
}

/**
 * Resolves an authorized Gmail account strictly scoped to the authenticated user + organization.
 *
 * Never falls back to a global account, founder account, or another user's account.
 */
export async function resolveAuthoritativeGmailAccount(
  options: ResolveGmailAccountOptions
): Promise<AuthoritativeGmailAccount | null> {
  const { organizationId, senderEmail, userId, xOrganizationId, privilegedClient: customClient } = options;

  // Strict tenant isolation: organizationId is required
  if (!organizationId || typeof organizationId !== 'string' || organizationId.trim() === '') {
    console.warn('[OUTREACH GOOGLE ACCOUNT] Missing organization_id in resolveAuthoritativeGmailAccount. Rejecting for tenant isolation.');
    return null;
  }

  const cleanOrgId = organizationId.trim();
  console.log('[DEBUG-GMAIL-RESOLVER] Params:', {
    orgId: cleanOrgId,
    userId: userId
  });

  // In production, SUPABASE_SERVICE_ROLE_KEY is mandatory for accessing public.google_accounts
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim());
  if (!hasServiceRoleKey && !customClient) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required in production to resolve authorized Gmail accounts from public.google_accounts.');
    }
    console.warn('[OUTREACH GOOGLE ACCOUNT] Protected google_accounts access blocked: SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to LocalDB.');
    return resolveLocalDbFallback(cleanOrgId, userId, senderEmail);
  }

  let client: SupabaseClient;
  try {
    client = customClient || getPrivilegedSupabaseServerClient();
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.warn('[OUTREACH GOOGLE ACCOUNT] Failed to obtain privileged Supabase client:', err?.message || err);
    return resolveLocalDbFallback(cleanOrgId, userId, senderEmail);
  }

  // Query authoritative public.google_accounts with strict tenant and user isolation
  let query = client
    .from('google_accounts')
    .select('*', { count: 'exact' })
    .in('account_type', ['gmail', 'GMAIL'])
    .eq('organization_id', cleanOrgId)
    .not('access_token', 'is', null);

  // If authenticated userId is provided, strictly enforce user ownership
  if (userId && typeof userId === 'string' && userId.trim() !== '') {
    query = query.eq('user_id', userId.trim());
  }

  if (senderEmail && typeof senderEmail === 'string' && senderEmail.trim() !== '') {
    query = query.eq('email', senderEmail.trim().toLowerCase());
  }

  let { data, count, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

  console.log('[DEBUG-GMAIL-RESOLVER] Diagnostic info:', {
    authenticatedUserId: userId,
    verifiedOrgId: cleanOrgId,
    error: error ? error.message : 'no-error',
    dataPresent: !!data
  });

  // Fallback: If specific senderEmail filter yielded no record for this user, search by user_id and organization_id
  if (!data && senderEmail && userId) {
    let fallbackQuery = client
      .from('google_accounts')
      .select('*', { count: 'exact' })
      .in('account_type', ['gmail', 'GMAIL'])
      .eq('organization_id', cleanOrgId)
      .eq('user_id', userId.trim())
      .not('access_token', 'is', null);

    const fallbackRes = await fallbackQuery.order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (fallbackRes.data) {
      data = fallbackRes.data;
      count = fallbackRes.count;
      error = fallbackRes.error;
    }
  }

  const queryCount = count !== null && count !== undefined ? count : (data ? 1 : 0);
  const matchedEmail = data?.email || null;
  const matchedAccountType = data?.account_type || null;
  const credentialsPresent = Boolean(data?.access_token);

  if (error) {
    console.error('[OUTREACH GOOGLE ACCOUNT] Database query error on google_accounts:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Database error querying authoritative google_accounts: ${error.message}`);
    }
    return resolveLocalDbFallback(cleanOrgId, userId, senderEmail);
  }

  if (!data || !data.access_token || String(data.access_token).startsWith('mock_')) {
    if (data && String(data.access_token || '').startsWith('mock_')) {
      return null;
    }
    return resolveLocalDbFallback(cleanOrgId, userId, senderEmail);
  }

  // Double check user isolation: if userId was provided, ensure record strictly matches
  if (userId && userId.trim() !== '' && (!data.user_id || String(data.user_id).trim() !== userId.trim())) {
    console.warn(`[OUTREACH GOOGLE ACCOUNT] User ID mismatch: record owned by ${data.user_id}, requested by ${userId}. Rejecting cross-user send.`);
    return null;
  }

  const hasGmailScope = hasRequiredGmailSendScope(data.scopes);
  const hasRefresh = Boolean(data.refresh_token && String(data.refresh_token).trim().length > 0);
  const isExpired = data.expiry_date != null ? isExpiryExpired(data.expiry_date) : false;
  const isReauthRequired =
    data.status === 'REAUTH_REQUIRED' ||
    data.status === 'REAUTH_NEEDED' ||
    (isExpired && !hasRefresh) ||
    !hasGmailScope;

  console.log('[SAFE GMAIL RESOLVER DIAGNOSTICS]', {
    authenticatedUserId: userId || null,
    verifiedOrganizationId: cleanOrgId,
    xOrganizationIdReceived: xOrganizationId || null,
    senderEmail: senderEmail || null,
    googleAccountsQueryCount: queryCount,
    matchedAccountEmail: matchedEmail,
    matchedAccountType: matchedAccountType,
    credentialsPresent: true,
    hasRequiredGmailScope: hasGmailScope,
    isExpired,
    hasRefresh,
    resolverResult: isReauthRequired ? 'REAUTH_REQUIRED' : 'success'
  });

  const email = (data.email || '').toLowerCase().trim();
  const expiresAt = formatExpiryIso(data.expiry_date);

  const scopesArr = Array.isArray(data.scopes) 
    ? data.scopes 
    : (typeof data.scopes === 'string' ? data.scopes.split(/[\s,]+/).filter(Boolean) : []);

  return {
    id: data.id,
    userId: data.user_id,
    email,
    fullName: email.split('@')[0],
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresAt,
    status: isReauthRequired ? 'REAUTH_REQUIRED' : (data.status || 'CONNECTED'),
    createdAt: data.created_at || new Date().toISOString(),
    scopes: scopesArr,
    organizationId: cleanOrgId,
    accountType: 'gmail'
  };
}

/**
 * Resolves an authorized Google Calendar account strictly scoped to authenticated user + organization.
 */
export async function resolveAuthoritativeCalendarAccount(
  options: ResolveCalendarAccountOptions
): Promise<AuthoritativeCalendarAccount | null> {
  const { organizationId, userId, privilegedClient: customClient } = options;

  if (!organizationId || !userId) {
    return null;
  }

  const cleanOrgId = organizationId.trim();
  const cleanUserId = userId.trim();

  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim());
  if (!hasServiceRoleKey && !customClient) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCALDB_FALLBACK_IN_PRODUCTION !== 'true') {
      console.warn('[CALENDAR ACCOUNT RESOLVER] SUPABASE_SERVICE_ROLE_KEY is missing in production and LocalDB fallback is disabled.');
      return null;
    }
    return resolveLocalDbCalendarFallback(cleanOrgId, cleanUserId);
  }

  let client: SupabaseClient;
  try {
    client = customClient || getPrivilegedSupabaseServerClient();
  } catch (err: any) {
    return resolveLocalDbCalendarFallback(cleanOrgId, cleanUserId);
  }

  const { data, error } = await client
    .from('google_accounts')
    .select('*')
    .in('account_type', ['calendar', 'CALENDAR'])
    .eq('organization_id', cleanOrgId)
    .eq('user_id', cleanUserId)
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || !data.access_token || String(data.access_token).startsWith('mock_')) {
    if (data && String(data.access_token || '').startsWith('mock_')) {
      return null;
    }
    return resolveLocalDbCalendarFallback(cleanOrgId, cleanUserId);
  }

  const scopesArr = Array.isArray(data.scopes)
    ? data.scopes
    : (typeof data.scopes === 'string' ? data.scopes.split(/[\s,]+/).filter(Boolean) : []);
  const hasRefresh = Boolean(data.refresh_token && String(data.refresh_token).trim().length > 0);
  const isExpired = data.expiry_date != null ? isExpiryExpired(data.expiry_date) : false;
  const hasCalendarScope = scopesArr.length === 0 ? true : hasRequiredCalendarScope(scopesArr);
  const isReauthRequired =
    data.status === 'REAUTH_REQUIRED' ||
    data.status === 'REAUTH_NEEDED' ||
    (isExpired && !hasRefresh) ||
    !hasCalendarScope;
  const email = (data.email || '').toLowerCase().trim();
  const expiresAt = formatExpiryIso(data.expiry_date);

  return {
    id: data.id,
    userId: data.user_id,
    email,
    fullName: email.split('@')[0],
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresAt,
    status: isReauthRequired ? 'REAUTH_REQUIRED' : (data.status || 'CONNECTED'),
    calendarAccessVerified: !isReauthRequired && (data.status || 'CONNECTED') === 'CONNECTED',
    createdAt: data.created_at || new Date().toISOString(),
    scopes: scopesArr,
    organizationId: cleanOrgId,
    accountType: 'calendar'
  };
}

function deterministicUuidFromSeed(seed: string): string {
  const hash = crypto.createHash('sha256').update(seed).digest();
  hash[6] = (hash[6] & 0x0f) | 0x40;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.toString('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function extractPgErrorParts(error: any): {
  code: string;
  message: string;
  details: string;
  hint: string;
  constraint: string;
  combinedLower: string;
} {
  const code = String(error?.code || '').trim();
  const message = String(error?.message || '').trim();
  const details = String(error?.details || '').trim();
  const hint = String(error?.hint || '').trim();
  const constraint = String(error?.constraint || '').trim();
  const combinedLower = `${code} ${message} ${details} ${hint} ${constraint}`.toLowerCase();
  return { code, message, details, hint, constraint, combinedLower };
}

function isMissingColumnErrorFor(parts: ReturnType<typeof extractPgErrorParts>, columnName: string): boolean {
  const col = columnName.toLowerCase();
  const mentionsCol =
    parts.message.toLowerCase().includes(`'${col}'`) ||
    parts.message.toLowerCase().includes(`"${col}"`) ||
    parts.message.toLowerCase().includes(`.${col}`) ||
    parts.message.toLowerCase().includes(`column ${col}`) ||
    parts.details.toLowerCase().includes(col);
  if (!mentionsCol) return false;
  return (
    parts.code === '42703' ||
    parts.code === 'PGRST204' ||
    parts.combinedLower.includes('does not exist') ||
    parts.combinedLower.includes('schema cache') ||
    parts.combinedLower.includes('could not find')
  );
}

/**
 * Persists an authenticated Google account to public.google_accounts using the
 * privileged Supabase client. Normalizes account_type to lowercase "gmail" / "calendar".
 */
export async function persistAuthoritativeGoogleAccount(
  params: PersistGoogleAccountParams
): Promise<{ success: boolean; gmailId: string; calendarId: string }> {
  const {
    userId,
    userEmail,
    organizationId,
    email,
    accessToken,
    refreshToken,
    scopes,
    expiresAt,
    calendarAccessVerified = false,
    privilegedClient: customClient
  } = params;
  const requestId = createCorrelationRequestId(params.requestId);

  if (!email || !email.includes('@')) {
    throw new GooglePersistenceDiagnosticsError('Invalid email address for Google account persistence.', {
      requestId,
      stage: 'input_validation',
      classification: 'invalid_email',
      httpStatus: 400
    });
  }
  if (!organizationId || organizationId.trim() === '') {
    throw new GooglePersistenceDiagnosticsError('Organization ID is required to persist Google account.', {
      requestId,
      stage: 'input_validation',
      classification: 'missing_organization_id',
      httpStatus: 400
    });
  }
  if (!userId || userId.trim() === '') {
    throw new GooglePersistenceDiagnosticsError('User ID is required to persist Google account.', {
      requestId,
      stage: 'input_validation',
      classification: 'missing_user_id',
      httpStatus: 400
    });
  }
  if (!accessToken || accessToken.startsWith('mock_')) {
    throw new GooglePersistenceDiagnosticsError('Valid, non-mock access token is required to persist Google account.', {
      requestId,
      stage: 'input_validation',
      classification: 'mock_or_missing_access_token',
      httpStatus: 400
    });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanOrgId = organizationId.trim();
  const cleanUserId = userId.trim();

  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim());
  const isProdOrVercel =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    process.env.ENVIRONMENT === 'production';
  if (!hasServiceRoleKey && !customClient) {
    if (isProdOrVercel) {
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'config_check',
        userId: cleanUserId,
        organizationId: cleanOrgId,
        operation: 'check_service_role_key',
        classification: 'missing_service_role_key',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError(
        'Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required in production to persist Google accounts to public.google_accounts.',
        {
          requestId,
          stage: 'config_check',
          classification: 'missing_service_role_key',
          httpStatus: 500
        }
      );
    }
    console.warn('[OUTREACH GOOGLE ACCOUNT] Skipping database persistence: SUPABASE_SERVICE_ROLE_KEY is missing.');
    return { success: false, gmailId: '', calendarId: '' };
  }

  const client = customClient || getPrivilegedSupabaseServerClient();
  const now = new Date().toISOString();
  const expiryMs = normalizeExpiryMs(expiresAt);
  const expiryIso = new Date(expiryMs).toISOString();
  const authIdentity = params.authIdentity;
  const authIdentityEmail = authIdentity?.email ? String(authIdentity.email).trim().toLowerCase() : '';
  const explicitUserEmail = userEmail ? String(userEmail).trim().toLowerCase() : '';
  if (authIdentityEmail && explicitUserEmail && authIdentityEmail !== explicitUserEmail) {
    logGooglePersistenceDiagnostic({
      requestId,
      stage: 'identity_verify',
      userId: cleanUserId,
      organizationId: cleanOrgId,
      operation: 'compare_auth_emails',
      classification: 'authenticated_email_mismatch',
      success: false
    });
    throw new GooglePersistenceDiagnosticsError('Cannot persist Google account: authenticated user email mismatch.', {
      requestId,
      stage: 'identity_verify',
      classification: 'authenticated_email_mismatch',
      httpStatus: 403
    });
  }

  const cleanAuthUserEmail =
    authIdentityEmail || (explicitUserEmail.includes('@') ? explicitUserEmail : '');

  // 1. Resolve authenticated user's existing canonical database identity (read-only; never auto-provision OWNER/verified users)
  let existingUser: any = null;
  let { data: userById, error: userByIdErr } = await client
    .from('users')
    .select('id, email, organization_id, role, is_verified, is_founder')
    .eq('id', cleanUserId)
    .maybeSingle();

  if (userByIdErr && isMissingColumnErrorFor(extractPgErrorParts(userByIdErr), 'is_founder')) {
    const fallbackUserRes = await client
      .from('users')
      .select('id, email, organization_id, role, is_verified')
      .eq('id', cleanUserId)
      .maybeSingle();
    userById = fallbackUserRes.data as any;
    userByIdErr = fallbackUserRes.error;
  }

  if (userByIdErr) {
    const parts = extractPgErrorParts(userByIdErr);
    logGooglePersistenceDiagnostic({
      requestId,
      stage: 'identity_verify',
      userId: cleanUserId,
      organizationId: cleanOrgId,
      operation: 'select_users_by_id',
      pgCode: parts.code || undefined,
      constraint: parts.constraint || undefined,
      classification: 'user_lookup_db_error',
      success: false
    });
    throw new GooglePersistenceDiagnosticsError(
      `Failed to verify authenticated user in database${parts.code ? ` (Code ${parts.code})` : ''}: ${userByIdErr.message}`,
      {
        requestId,
        stage: 'identity_verify',
        pgCode: parts.code || undefined,
        classification: 'user_lookup_db_error',
        httpStatus: 500
      }
    );
  }
  existingUser = userById;

  if (existingUser) {
    const dbUserEmail = String(existingUser.email || '').toLowerCase().trim();
    if (cleanAuthUserEmail && dbUserEmail && dbUserEmail !== cleanAuthUserEmail) {
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'identity_verify',
        userId: cleanUserId,
        organizationId: cleanOrgId,
        operation: 'verify_user_email_match',
        classification: 'authenticated_email_mismatch',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError('Cannot persist Google account: authenticated user email mismatch.', {
        requestId,
        stage: 'identity_verify',
        classification: 'authenticated_email_mismatch',
        httpStatus: 403
      });
    }
  }

  // Fallback: If user ID not found in database, verify authenticated Supabase Auth identity context and map to canonical public.users record
  if (!existingUser) {
    const authEmail = cleanAuthUserEmail;
    const rawConfirmedAt =
      authIdentity?.email_confirmed_at ??
      authIdentity?.confirmed_at ??
      params.emailConfirmedAt ??
      null;
    const authConfirmedAt = typeof rawConfirmedAt === 'string' ? rawConfirmedAt.trim() : '';

    if (!authEmail || !authEmail.includes('@')) {
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'identity_verify',
        userId: cleanUserId,
        organizationId: cleanOrgId,
        operation: 'email_fallback_check',
        classification: 'missing_verified_user_email',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError(
        'Cannot persist Google account: authenticated user ID was not found in database and verified user email is missing.',
        {
          requestId,
          stage: 'identity_verify',
          classification: 'missing_verified_user_email',
          httpStatus: 403
        }
      );
    }

    // Query public.users using case-insensitive email match (escaping LIKE wildcards)
    const escapedAuthEmail = authEmail.replace(/([%_\\])/g, '\\$1');
    let { data: userByEmail, error: userByEmailErr } = await client
      .from('users')
      .select('id, email, organization_id, role, is_verified, is_founder')
      .ilike('email', escapedAuthEmail)
      .maybeSingle();

    if (userByEmailErr && isMissingColumnErrorFor(extractPgErrorParts(userByEmailErr), 'is_founder')) {
      const fallbackEmailRes = await client
        .from('users')
        .select('id, email, organization_id, role, is_verified')
        .ilike('email', escapedAuthEmail)
        .maybeSingle();
      userByEmail = fallbackEmailRes.data as any;
      userByEmailErr = fallbackEmailRes.error;
    }

    if (userByEmailErr) {
      const parts = extractPgErrorParts(userByEmailErr);
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'identity_verify',
        userId: cleanUserId,
        organizationId: cleanOrgId,
        operation: 'select_users_by_email',
        pgCode: parts.code || undefined,
        classification: 'user_email_lookup_db_error',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError(
        `Failed to verify authenticated user by email in database${parts.code ? ` (Code ${parts.code})` : ''}: ${userByEmailErr.message}`,
        {
          requestId,
          stage: 'identity_verify',
          pgCode: parts.code || undefined,
          classification: 'user_email_lookup_db_error',
          httpStatus: 500
        }
      );
    }

    if (!userByEmail) {
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'identity_verify',
        userId: cleanUserId,
        organizationId: cleanOrgId,
        operation: 'select_users_by_email',
        classification: 'authenticated_user_not_found',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError(
        'Cannot persist Google account: authenticated user does not exist in database.',
        {
          requestId,
          stage: 'identity_verify',
          classification: 'authenticated_user_not_found',
          httpStatus: 403
        }
      );
    }

    // Require the authenticated Supabase user's email_confirmed_at to be present
    if (!authConfirmedAt || !Number.isFinite(Date.parse(authConfirmedAt))) {
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'identity_verify',
        userId: cleanUserId,
        organizationId: cleanOrgId,
        operation: 'verify_email_confirmed_at',
        classification: 'missing_email_confirmed_at',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError(
        'Cannot persist Google account: authenticated user email confirmation timestamp is missing (email_confirmed_at required).',
        {
          requestId,
          stage: 'identity_verify',
          classification: 'missing_email_confirmed_at',
          httpStatus: 403
        }
      );
    }

    // Compare the authenticated email against public.users.email case-insensitively
    const dbUserEmail = String(userByEmail.email || '').toLowerCase().trim();
    if (dbUserEmail !== authEmail) {
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'identity_verify',
        userId: cleanUserId,
        organizationId: cleanOrgId,
        operation: 'verify_db_email_match',
        classification: 'authenticated_email_mismatch',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError(
        'Cannot persist Google account: email mismatch between authenticated user and database record.',
        {
          requestId,
          stage: 'identity_verify',
          classification: 'authenticated_email_mismatch',
          httpStatus: 403
        }
      );
    }

    // Reject unverified emails even when active team membership exists
    if (!userByEmail.is_verified) {
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'identity_verify',
        userId: cleanUserId,
        organizationId: cleanOrgId,
        operation: 'verify_db_is_verified',
        classification: 'unverified_db_email',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError(
        'Cannot persist Google account: database user email is unverified. Unverified email identities are strictly rejected even when active team membership exists.',
        {
          requestId,
          stage: 'identity_verify',
          classification: 'unverified_db_email',
          httpStatus: 403
        }
      );
    }

    existingUser = userByEmail;
  }

  if (!existingUser || !existingUser.id) {
    throw new GooglePersistenceDiagnosticsError(
      'Cannot persist Google account: authenticated user does not exist in database.',
      {
        requestId,
        stage: 'identity_verify',
        classification: 'authenticated_user_not_found',
        httpStatus: 403
      }
    );
  }

  const canonicalUserId = String(existingUser.id).trim();

  // 2. Verify target organization exists (read-only; never auto-provision organizations)
  let { data: existingOrg, error: orgLookupErr } = await client
    .from('organizations')
    .select('id, owner_id, status')
    .eq('id', cleanOrgId)
    .maybeSingle();

  if (orgLookupErr && (isMissingColumnErrorFor(extractPgErrorParts(orgLookupErr), 'status') || isMissingColumnErrorFor(extractPgErrorParts(orgLookupErr), 'owner_id'))) {
    const fallbackOrgRes = await client
      .from('organizations')
      .select('id, owner_id')
      .eq('id', cleanOrgId)
      .maybeSingle();
    existingOrg = fallbackOrgRes.data as any;
    orgLookupErr = fallbackOrgRes.error;
    if (orgLookupErr && isMissingColumnErrorFor(extractPgErrorParts(orgLookupErr), 'owner_id')) {
      const minimalOrgRes = await client
        .from('organizations')
        .select('id')
        .eq('id', cleanOrgId)
        .maybeSingle();
      existingOrg = minimalOrgRes.data as any;
      orgLookupErr = minimalOrgRes.error;
    }
  }

  if (orgLookupErr) {
    const parts = extractPgErrorParts(orgLookupErr);
    logGooglePersistenceDiagnostic({
      requestId,
      stage: 'organization_verify',
      userId: canonicalUserId,
      organizationId: cleanOrgId,
      operation: 'select_organizations_by_id',
      pgCode: parts.code || undefined,
      classification: 'organization_lookup_db_error',
      success: false
    });
    throw new GooglePersistenceDiagnosticsError(
      `Failed to verify target organization in database${parts.code ? ` (Code ${parts.code})` : ''}: ${orgLookupErr.message}`,
      {
        requestId,
        stage: 'organization_verify',
        pgCode: parts.code || undefined,
        classification: 'organization_lookup_db_error',
        httpStatus: 500
      }
    );
  }

  if (!existingOrg || !existingOrg.id) {
    logGooglePersistenceDiagnostic({
      requestId,
      stage: 'organization_verify',
      userId: canonicalUserId,
      organizationId: cleanOrgId,
      operation: 'select_organizations_by_id',
      classification: 'target_organization_not_found',
      success: false
    });
    throw new GooglePersistenceDiagnosticsError(
      'Cannot persist Google account: target organization does not exist in database.',
      {
        requestId,
        stage: 'organization_verify',
        classification: 'target_organization_not_found',
        httpStatus: 403
      }
    );
  }

  // 3. Verify existing organization membership without creating memberships or granting roles
  const inactiveMemberStatuses = new Set([
    'INVITED',
    'PENDING',
    'REMOVED',
    'SUSPENDED',
    'DISABLED',
    'REVOKED',
    'INACTIVE'
  ]);

  let hasVerifiedMembership =
    (existingOrg.owner_id && String(existingOrg.owner_id).trim() === canonicalUserId) ||
    (existingUser.organization_id && String(existingUser.organization_id).trim() === cleanOrgId);

  if (!hasVerifiedMembership) {
    try {
      const { data: tmRow, error: tmErr } = await client
        .from('team_members')
        .select('id, user_id, organization_id, role, status')
        .eq('organization_id', cleanOrgId)
        .eq('user_id', canonicalUserId)
        .limit(1)
        .maybeSingle();
      if (!tmErr && tmRow) {
        const tmStatus = tmRow.status ? String(tmRow.status).toUpperCase().trim() : 'ACTIVE';
        if (!inactiveMemberStatuses.has(tmStatus)) {
          hasVerifiedMembership = true;
        }
      }
    } catch (_) {
      // Proceed to check organization_members
    }
  }

  if (!hasVerifiedMembership) {
    try {
      const { data: omRow, error: omErr } = await client
        .from('organization_members')
        .select('id, user_id, organization_id, role, status')
        .eq('organization_id', cleanOrgId)
        .eq('user_id', canonicalUserId)
        .limit(1)
        .maybeSingle();
      if (!omErr && omRow) {
        const omStatus = omRow.status ? String(omRow.status).toUpperCase().trim() : 'ACTIVE';
        if (!inactiveMemberStatuses.has(omStatus)) {
          hasVerifiedMembership = true;
        }
      }
    } catch (_) {
      // Optional table absent; rely on already checked signals
    }
  }

  if (!hasVerifiedMembership) {
    logGooglePersistenceDiagnostic({
      requestId,
      stage: 'membership_verify',
      userId: canonicalUserId,
      organizationId: cleanOrgId,
      operation: 'verify_organization_membership',
      classification: 'missing_verified_membership',
      success: false
    });
    throw new GooglePersistenceDiagnosticsError(
      'Cannot persist Google account: authenticated user does not have verified membership in the target organization.',
      {
        requestId,
        stage: 'membership_verify',
        classification: 'missing_verified_membership',
        httpStatus: 403
      }
    );
  }

  const defaultCalendarId = `ga_${canonicalUserId}_${cleanEmail}_calendar`;
  const defaultGmailId = `ga_${canonicalUserId}_${cleanEmail}_gmail`;

  // 4. Lookup existing scoped records so we preserve existing IDs (UUID or legacy IDs) and existing non-empty refresh_token
  let existingCalendarRow: { id?: string; user_id?: string; organization_id?: string; email?: string; refresh_token?: string | null } | null = null;
  let existingGmailRow: { id?: string; user_id?: string; organization_id?: string; email?: string; refresh_token?: string | null } | null = null;

  const findExistingGoogleAccountRow = async (accountTypes: string[]) => {
    try {
      const exactRes = await client
        .from('google_accounts')
        .select('id, user_id, organization_id, email, refresh_token')
        .eq('user_id', canonicalUserId)
        .eq('organization_id', cleanOrgId)
        .eq('email', cleanEmail)
        .in('account_type', accountTypes)
        .limit(1)
        .maybeSingle();
      if (!exactRes?.error && exactRes?.data?.id) {
        return exactRes.data;
      }

      // Guarded case-insensitive fallback for legacy mixed-case google_accounts.email rows
      const escapedEmail = cleanEmail.replace(/([%_\\])/g, '\\$1');
      const tableQuery: any = client
        .from('google_accounts')
        .select('id, user_id, organization_id, email, refresh_token')
        .eq('user_id', canonicalUserId)
        .eq('organization_id', cleanOrgId);
      if (typeof tableQuery?.ilike === 'function') {
        const ilikeRes = await tableQuery
          .ilike('email', escapedEmail)
          .in('account_type', accountTypes)
          .limit(1)
          .maybeSingle();
        if (
          !ilikeRes?.error &&
          ilikeRes?.data?.id &&
          (!ilikeRes.data.email || String(ilikeRes.data.email).toLowerCase().trim() === cleanEmail)
        ) {
          return ilikeRes.data;
        }
      }
    } catch (_) {}
    return null;
  };

  try {
    const [calExisting, gmailExisting] = await Promise.all([
      findExistingGoogleAccountRow(['calendar', 'CALENDAR']),
      findExistingGoogleAccountRow(['gmail', 'GMAIL'])
    ]);
    if (calExisting) existingCalendarRow = calExisting;
    if (gmailExisting) existingGmailRow = gmailExisting;
  } catch (_) {}

  const directRefreshToken = typeof refreshToken === 'string' && refreshToken.trim() ? refreshToken.trim() : '';
  let effectiveRefreshToken = directRefreshToken;
  if (!effectiveRefreshToken) {
    const rowToken =
      (existingGmailRow?.refresh_token && String(existingGmailRow.refresh_token).trim()) ||
      (existingCalendarRow?.refresh_token && String(existingCalendarRow.refresh_token).trim()) ||
      '';
    if (rowToken) {
      effectiveRefreshToken = rowToken;
    } else {
      try {
        const { data: existingRec } = await client
          .from('google_accounts')
          .select('refresh_token')
          .in('id', [defaultGmailId, defaultCalendarId])
          .not('refresh_token', 'is', null)
          .limit(1)
          .maybeSingle();
        if (existingRec?.refresh_token && String(existingRec.refresh_token).trim()) {
          effectiveRefreshToken = String(existingRec.refresh_token).trim();
        }
      } catch (_) {}
    }
  }

  const calendarStatus = calendarAccessVerified ? 'CONNECTED' : 'CONNECTING';
  const gmailStatus = hasRequiredGmailSendScope(scopes) ? 'CONNECTED' : 'REAUTH_REQUIRED';

  const normalizedScopes = Array.isArray(scopes) ? scopes : [];
  let currentExpiry: number | string = expiryMs;
  let includeStatus = true;
  let includeUpdatedAt = true;
  let includeProvider = false;
  let scopesAsString = false;
  let useUuidIds = false;
  let forceEmptyRefreshOnNullRejection = false;

  const resolvedCalendarId = (useUuid: boolean) =>
    existingCalendarRow?.id
      ? String(existingCalendarRow.id)
      : useUuid
        ? deterministicUuidFromSeed(defaultCalendarId)
        : defaultCalendarId;
  const resolvedGmailId = (useUuid: boolean) =>
    existingGmailRow?.id
      ? String(existingGmailRow.id)
      : useUuid
        ? deterministicUuidFromSeed(defaultGmailId)
        : defaultGmailId;

  const buildRowPayload = (
    accountType: 'calendar' | 'gmail',
    existingRow: { id?: string; refresh_token?: string | null } | null
  ) => {
    const id = accountType === 'calendar' ? resolvedCalendarId(useUuidIds) : resolvedGmailId(useUuidIds);
    const statusVal = accountType === 'calendar' ? calendarStatus : gmailStatus;
    const scopesVal = scopesAsString ? normalizedScopes.join(' ') : normalizedScopes;
    const isUpdatingExisting = Boolean(existingRow?.id);
    const rowOwnRefreshToken =
      existingRow?.refresh_token && String(existingRow.refresh_token).trim()
        ? String(existingRow.refresh_token).trim()
        : '';
    const resolvedRefreshToken = directRefreshToken || rowOwnRefreshToken || effectiveRefreshToken;
    const payload: Record<string, any> = {
      id,
      user_id: canonicalUserId,
      organization_id: cleanOrgId,
      email: cleanEmail,
      access_token: accessToken,
      scopes: scopesVal,
      expiry_date: currentExpiry,
      account_type: accountType
    };
    if (resolvedRefreshToken) {
      payload.refresh_token = resolvedRefreshToken;
    } else if (!isUpdatingExisting || forceEmptyRefreshOnNullRejection) {
      // Never overwrite an existing non-empty refresh_token on update when Google didn't send a new one
      payload.refresh_token = '';
    }
    if (includeStatus) {
      payload.status = statusVal;
    }
    if (includeUpdatedAt) {
      payload.updated_at = now;
    }
    if (includeProvider) {
      payload.provider = 'google';
    }
    return payload;
  };

  const executeWrite = async (): Promise<{ error: any }> => {
    const calendarPayload = buildRowPayload('calendar', existingCalendarRow);
    const gmailPayload = buildRowPayload('gmail', existingGmailRow);
    const tableRef = client.from('google_accounts') as any;

    const canDirectUpdate = typeof tableRef?.update === 'function';
    const calNeedsDirectUpdate = Boolean(
      existingCalendarRow?.id && existingCalendarRow.id !== defaultCalendarId && canDirectUpdate
    );
    const gmailNeedsDirectUpdate = Boolean(
      existingGmailRow?.id && existingGmailRow.id !== defaultGmailId && canDirectUpdate
    );

    if (calNeedsDirectUpdate || gmailNeedsDirectUpdate) {
      const pairs: Array<{ existing: { id?: string } | null; payload: Record<string, any> }> = [
        { existing: existingCalendarRow, payload: calendarPayload },
        { existing: existingGmailRow, payload: gmailPayload }
      ];
      for (const pair of pairs) {
        if (pair.existing?.id && canDirectUpdate) {
          const { id: _omittedId, ...updateFields } = pair.payload;
          const upRes = await client
            .from('google_accounts')
            .update(updateFields)
            .eq('id', pair.existing.id)
            .eq('user_id', canonicalUserId)
            .eq('organization_id', cleanOrgId);
          if (upRes?.error) {
            return { error: upRes.error };
          }
        } else {
          const insRes = await client.from('google_accounts').upsert([pair.payload], { onConflict: 'id' });
          if (insRes?.error) {
            return { error: insRes.error };
          }
        }
      }
      return { error: null };
    }

    const res = await client.from('google_accounts').upsert([calendarPayload, gmailPayload], { onConflict: 'id' });
    return { error: res?.error || null };
  };

  let error: any = null;
  let attempts = 0;
  const maxAttempts = 8;
  const appliedAdaptations = new Set<string>();

  while (attempts < maxAttempts) {
    attempts++;
    const writeRes = await executeWrite();
    error = writeRes.error;
    if (!error) break;

    const parts = extractPgErrorParts(error);
    let adapted = false;

    // 1. Live DB expiry_date is TIMESTAMPTZ instead of BIGINT
    if (
      !appliedAdaptations.has('expiry_iso') &&
      currentExpiry !== expiryIso &&
      (parts.combinedLower.includes('timestamp') ||
        parts.combinedLower.includes('date/time field value out of range') ||
        parts.code === '22007' ||
        parts.code === '22008')
    ) {
      currentExpiry = expiryIso;
      appliedAdaptations.add('expiry_iso');
      adapted = true;
    }

    // 2. Live DB schema lacks optional status column
    if (!appliedAdaptations.has('omit_status') && includeStatus && isMissingColumnErrorFor(parts, 'status')) {
      includeStatus = false;
      appliedAdaptations.add('omit_status');
      adapted = true;
    }

    // 3. Live DB schema lacks optional updated_at column
    if (!appliedAdaptations.has('omit_updated_at') && includeUpdatedAt && isMissingColumnErrorFor(parts, 'updated_at')) {
      includeUpdatedAt = false;
      appliedAdaptations.add('omit_updated_at');
      adapted = true;
    }

    // 4. Live DB has scopes as TEXT instead of TEXT[]
    if (
      !appliedAdaptations.has('scopes_text') &&
      !scopesAsString &&
      (parts.combinedLower.includes('scopes') || parts.combinedLower.includes('array value must start with')) &&
      (parts.code === '22P02' || parts.code === '42804' || parts.combinedLower.includes('malformed array literal'))
    ) {
      scopesAsString = true;
      appliedAdaptations.add('scopes_text');
      adapted = true;
    }

    // 5. Live DB has provider NOT NULL column (23502)
    if (
      !appliedAdaptations.has('include_provider') &&
      !includeProvider &&
      parts.code === '23502' &&
      parts.combinedLower.includes('provider')
    ) {
      includeProvider = true;
      appliedAdaptations.add('include_provider');
      adapted = true;
    }

    // 6. Live DB enforces refresh_token NOT NULL on update (23502)
    if (
      !appliedAdaptations.has('empty_refresh_token') &&
      !forceEmptyRefreshOnNullRejection &&
      parts.code === '23502' &&
      parts.combinedLower.includes('refresh_token')
    ) {
      forceEmptyRefreshOnNullRejection = true;
      appliedAdaptations.add('empty_refresh_token');
      adapted = true;
    }

    // 7. Live DB uses UUID PK for google_accounts.id instead of TEXT (22P02)
    if (
      !appliedAdaptations.has('uuid_id') &&
      !useUuidIds &&
      parts.code === '22P02' &&
      parts.combinedLower.includes('uuid') &&
      parts.combinedLower.includes('ga_')
    ) {
      useUuidIds = true;
      appliedAdaptations.add('uuid_id');
      adapted = true;
    }

    // 8. Unique violation (23505): reconcile ONLY if existing row belongs to THIS exact canonicalUserId + cleanOrgId
    if (!appliedAdaptations.has('reconcile_23505') && parts.code === '23505') {
      appliedAdaptations.add('reconcile_23505');
      try {
        const [calLookupData, gmailLookupData] = await Promise.all([
          findExistingGoogleAccountRow(['calendar', 'CALENDAR']),
          findExistingGoogleAccountRow(['gmail', 'GMAIL'])
        ]);
        if (calLookupData?.id && calLookupData.id !== existingCalendarRow?.id) {
          existingCalendarRow = calLookupData;
          adapted = true;
        }
        if (gmailLookupData?.id && gmailLookupData.id !== existingGmailRow?.id) {
          existingGmailRow = gmailLookupData;
          adapted = true;
        }
      } catch (_) {}
    }

    if (!adapted) {
      break;
    }
  }

  if (error) {
    const parts = extractPgErrorParts(error);
    const errCode = parts.code;
    const errMsg = parts.message;
    const errDetails = parts.details;
    const errHint = parts.hint;
    const errConstraint = parts.constraint;
    const combined = parts.combinedLower;

    console.error('[OUTREACH GOOGLE ACCOUNT] Failed to persist accounts to public.google_accounts:', {
      requestId,
      code: errCode,
      message: errMsg,
      details: errDetails,
      hint: errHint,
      constraint: errConstraint
    });

    if (
      errCode === '23503' ||
      errConstraint.includes('google_accounts_user_id_fkey') ||
      errConstraint.includes('google_accounts_organization_id_fkey') ||
      combined.includes('foreign key') ||
      combined.includes('fkey')
    ) {
      if (
        errConstraint === 'google_accounts_user_id_fkey' ||
        (errCode === '23503' && (errConstraint.includes('user_id') || combined.includes('google_accounts_user_id_fkey') || combined.includes('users')))
      ) {
        logGooglePersistenceDiagnostic({
          requestId,
          stage: 'google_accounts_upsert',
          userId: canonicalUserId,
          organizationId: cleanOrgId,
          operation: 'upsert_google_accounts',
          pgCode: errCode || '23503',
          constraint: errConstraint || 'google_accounts_user_id_fkey',
          classification: 'fk_violation_user_id',
          success: false
        });
        throw new GooglePersistenceDiagnosticsError(
          `Failed to persist Google account to database: foreign key constraint violation on user record (google_accounts_user_id_fkey). The user record "${canonicalUserId}" does not exist in the database.`,
          {
            requestId,
            stage: 'google_accounts_upsert',
            pgCode: errCode || '23503',
            constraint: errConstraint || 'google_accounts_user_id_fkey',
            classification: 'fk_violation_user_id'
          }
        );
      }
      if (
        errConstraint === 'google_accounts_organization_id_fkey' ||
        (errCode === '23503' &&
          (errConstraint.includes('organization_id') || combined.includes('google_accounts_organization_id_fkey') || combined.includes('organizations')))
      ) {
        logGooglePersistenceDiagnostic({
          requestId,
          stage: 'google_accounts_upsert',
          userId: canonicalUserId,
          organizationId: cleanOrgId,
          operation: 'upsert_google_accounts',
          pgCode: errCode || '23503',
          constraint: errConstraint || 'google_accounts_organization_id_fkey',
          classification: 'fk_violation_organization_id',
          success: false
        });
        throw new GooglePersistenceDiagnosticsError(
          `Failed to persist Google account to database: foreign key constraint violation on organization record (google_accounts_organization_id_fkey). The workspace organization "${cleanOrgId}" does not exist in the database.`,
          {
            requestId,
            stage: 'google_accounts_upsert',
            pgCode: errCode || '23503',
            constraint: errConstraint || 'google_accounts_organization_id_fkey',
            classification: 'fk_violation_organization_id'
          }
        );
      }
      logGooglePersistenceDiagnostic({
        requestId,
        stage: 'google_accounts_upsert',
        userId: canonicalUserId,
        organizationId: cleanOrgId,
        operation: 'upsert_google_accounts',
        pgCode: errCode || '23503',
        constraint: errConstraint || undefined,
        classification: 'fk_violation_generic',
        success: false
      });
      throw new GooglePersistenceDiagnosticsError(
        `Failed to persist Google account to database: foreign key constraint violation (${errMsg || error.message}).`,
        {
          requestId,
          stage: 'google_accounts_upsert',
          pgCode: errCode || '23503',
          constraint: errConstraint || undefined,
          classification: 'fk_violation_generic'
        }
      );
    }

    const classification =
      errCode === '23502'
        ? 'not_null_violation'
        : errCode === '23505'
          ? 'unique_constraint_violation'
          : errCode === '42P01'
            ? 'undefined_table'
            : errCode === '42703' || errCode === 'PGRST204'
              ? 'undefined_column_or_schema_cache'
              : errCode === '42501' || combined.includes('row-level security') || combined.includes('permission denied')
                ? 'rls_or_permission_denied'
                : errCode === '22P02' || errCode === '22007' || errCode === '22008'
                  ? 'data_type_format_mismatch'
                  : 'database_upsert_error';

    logGooglePersistenceDiagnostic({
      requestId,
      stage: 'google_accounts_upsert',
      userId: canonicalUserId,
      organizationId: cleanOrgId,
      operation: 'upsert_google_accounts',
      pgCode: errCode || undefined,
      constraint: errConstraint || undefined,
      classification,
      success: false
    });

    if (errCode) {
      throw new GooglePersistenceDiagnosticsError(
        `Failed to persist Google account to database (Code ${errCode}): ${errMsg || error.message}`,
        {
          requestId,
          stage: 'google_accounts_upsert',
          pgCode: errCode,
          constraint: errConstraint || undefined,
          classification
        }
      );
    }
    throw new GooglePersistenceDiagnosticsError(
      `Failed to persist Google account to database: ${errMsg || error.message}`,
      {
        requestId,
        stage: 'google_accounts_upsert',
        constraint: errConstraint || undefined,
        classification
      }
    );
  }

  const finalGmailId = resolvedGmailId(useUuidIds);
  const finalCalendarId = resolvedCalendarId(useUuidIds);

  logGooglePersistenceDiagnostic({
    requestId,
    stage: 'google_accounts_upsert',
    userId: canonicalUserId,
    organizationId: cleanOrgId,
    operation: 'upsert_google_accounts',
    classification: 'persisted',
    success: true
  });

  return {
    success: true,
    gmailId: finalGmailId,
    calendarId: finalCalendarId
  };
}

export interface SafeAuthoritativeGmailAccountSummary {
  id?: string;
  userId?: string;
  email: string;
  fullName: string;
  status: string;
  createdAt: string;
  scopes: string[];
  organizationId: string;
  accountType: 'gmail';
  sendingLimit: number;
  sentToday: number;
  bounceCount: number;
  retryCount: number;
}

/**
 * Queries authoritative public.google_accounts records for an organization and optional user.
 * Strips all sensitive credentials (access_token, refresh_token) before returning.
 */
export async function queryAuthoritativeGmailAccounts(options: {
  organizationId: string;
  userId?: string;
  privilegedClient?: SupabaseClient;
}): Promise<SafeAuthoritativeGmailAccountSummary[]> {
  const { organizationId, userId, privilegedClient: customClient } = options;
  if (!organizationId || typeof organizationId !== 'string' || organizationId.trim() === '') {
    return [];
  }
  const cleanOrgId = organizationId.trim();
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim());

  if (hasServiceRoleKey || customClient) {
    try {
      const client = customClient || getPrivilegedSupabaseServerClient();
      let query = client
        .from('google_accounts')
        .select('id, user_id, organization_id, email, scopes, status, expiry_date, access_token, refresh_token, account_type, created_at, updated_at')
        .in('account_type', ['gmail', 'GMAIL'])
        .eq('organization_id', cleanOrgId)
        .not('access_token', 'is', null);

      if (userId && typeof userId === 'string' && userId.trim() !== '') {
        query = query.eq('user_id', userId.trim());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const cleanUserId = userId && typeof userId === 'string' ? userId.trim() : '';
        return data
          .filter(d => {
            if (cleanUserId && (!d.user_id || String(d.user_id).trim() !== cleanUserId)) return false;
            if (!d.access_token || String(d.access_token).startsWith('mock_')) return false;
            return true;
          })
          .map(d => {
            const hasGmailScope = hasRequiredGmailSendScope(d.scopes);
            const hasRefresh = Boolean(d.refresh_token && String(d.refresh_token).trim().length > 0);
            const isExpired = d.expiry_date != null ? isExpiryExpired(d.expiry_date) : false;
            const rawStatus = (d as any).status || 'CONNECTED';
            const isReauth =
              rawStatus === 'REAUTH_REQUIRED' ||
              rawStatus === 'REAUTH_NEEDED' ||
              (isExpired && !hasRefresh) ||
              !hasGmailScope;
            const scopesArr = Array.isArray(d.scopes)
              ? d.scopes
              : (typeof d.scopes === 'string' ? d.scopes.split(/[\s,]+/).filter(Boolean) : []);

            return {
              id: d.id,
              userId: d.user_id,
              email: d.email,
              fullName: d.email ? d.email.split('@')[0] : '',
              status: isReauth ? 'REAUTH_REQUIRED' : rawStatus,
              createdAt: d.created_at || new Date().toISOString(),
              scopes: scopesArr,
              organizationId: d.organization_id || cleanOrgId,
              accountType: 'gmail',
              sendingLimit: 500,
              sentToday: 0,
              bounceCount: 0,
              retryCount: 0
            };
          });
      }
    } catch (err: any) {
      console.warn('[OUTREACH GOOGLE ACCOUNT] Database query on google_accounts failed:', err.message);
    }
  }

  // Production safety guard: Do not fall back to local disk/memory accounts in production
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCALDB_FALLBACK_IN_PRODUCTION !== 'true') {
    return [];
  }

  // Fallback: If database is inaccessible or empty in development, fallback to LocalDB strictly scoped to userId + organizationId
  try {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return [];
    }
    const cleanUserId = userId.trim();
    const localDb = LocalDB.getInstance();
    const localAccounts = localDb.getGmailAccounts(cleanOrgId, cleanUserId);

    if (Array.isArray(localAccounts) && localAccounts.length > 0) {
      const validAccounts = localAccounts.filter(a => {
        const storedUserId = a.userId || a.user_id;
        const storedOrgId = a.organizationId || a.organization_id;
        const storedToken = a.accessToken || a.access_token;

        if (!storedUserId || String(storedUserId).trim() !== cleanUserId) return false;
        if (!storedOrgId || String(storedOrgId).trim() !== cleanOrgId) return false;
        if (!storedToken || typeof storedToken !== 'string' || storedToken.startsWith('mock_')) return false;
        return true;
      });

      return validAccounts.map(d => {
        const storedRefreshToken = d.refreshToken || d.refresh_token;
        const storedExpiry = d.expiresAt || d.expiry_date;
        const storedUserId = d.userId || d.user_id || cleanUserId;
        const storedOrgId = d.organizationId || d.organization_id || cleanOrgId;

        const isExpired = isExpiryExpired(storedExpiry);
        const hasRefresh = Boolean(storedRefreshToken && String(storedRefreshToken).trim().length > 0);
        const isExplicitlyConnected = d.status === 'CONNECTED';
        const hasGmailScope = hasRequiredGmailSendScope(d.scopes);
        const effectiveStatus = (isExplicitlyConnected && (!isExpired || hasRefresh) && hasGmailScope) ? 'CONNECTED' : 'REAUTH_REQUIRED';

        const scopesArr = Array.isArray(d.scopes) 
          ? d.scopes 
          : (typeof d.scopes === 'string' ? d.scopes.split(/[\s,]+/).filter(Boolean) : []);

        return {
          id: d.id,
          userId: storedUserId,
          email: d.email,
          fullName: d.email ? d.email.split('@')[0] : '',
          status: effectiveStatus,
          createdAt: d.createdAt || d.created_at || new Date().toISOString(),
          scopes: scopesArr,
          organizationId: storedOrgId,
          accountType: 'gmail',
          sendingLimit: 500,
          sentToday: 0,
          bounceCount: 0,
          retryCount: 0
        };
      });
    }
  } catch (err: any) {
    console.warn('[OUTREACH GOOGLE ACCOUNT] LocalDB query fallback failed:', err?.message);
  }

  return [];
}

export async function verifyGoogleCalendarConnection(
  organizationId: string,
  userId: string,
  privilegedClient?: SupabaseClient
): Promise<{ success: boolean; status: string }> {
  const acct = await resolveAuthoritativeCalendarAccount({ organizationId, userId, privilegedClient });
  if (!acct) {
    return { success: false, status: 'DISCONNECTED' };
  }
  return { success: acct.status === 'CONNECTED', status: acct.status };
}

/**
 * Invalidates and marks a Google account as REAUTH_REQUIRED in public.google_accounts.
 */
export async function markGoogleAccountReauthRequired(
  email: string,
  organizationId?: string,
  userId?: string,
  privilegedClient?: SupabaseClient,
  accountType?: 'gmail' | 'calendar'
): Promise<void> {
  if (!email || !email.includes('@')) return;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Update Supabase if SUPABASE_SERVICE_ROLE_KEY or custom privilegedClient is available
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim());
  if (hasServiceRoleKey || privilegedClient) {
    try {
      const client = privilegedClient || getPrivilegedSupabaseServerClient();
      let query = client
        .from('google_accounts')
        .update({
          status: 'REAUTH_REQUIRED',
          updated_at: new Date().toISOString()
        })
        .eq('email', cleanEmail);

      if (accountType === 'gmail') {
        query = query.in('account_type', ['gmail', 'GMAIL']);
      } else if (accountType === 'calendar') {
        query = query.in('account_type', ['calendar', 'CALENDAR']);
      }

      if (organizationId && organizationId.trim()) {
        query = query.eq('organization_id', organizationId.trim());
      }
      if (userId && userId.trim()) {
        query = query.eq('user_id', userId.trim());
      }

      const { error } = await query;
      if (error) {
        console.warn('[OUTREACH GOOGLE ACCOUNT] Failed to mark account as REAUTH_REQUIRED in Supabase:', error.message);
      } else {
        console.log(`[OUTREACH GOOGLE ACCOUNT] Marked account ${cleanEmail}${accountType ? ` (${accountType})` : ''} as REAUTH_REQUIRED in public.google_accounts.`);
      }
    } catch (err: any) {
      console.warn('[OUTREACH GOOGLE ACCOUNT] Supabase update notice:', err.message || String(err));
    }
  }

  // 2. Update LocalDB store only for the targeted account type (or both when unspecified)
  try {
    const localDb = LocalDB.getInstance();

    if ((!accountType || accountType === 'gmail') && localDb.db.gmailAccounts && Array.isArray(localDb.db.gmailAccounts)) {
      localDb.db.gmailAccounts.forEach(g => {
        if ((g.email || '').toLowerCase().trim() === cleanEmail) {
          const matchOrg = !organizationId || (g.organizationId || g.organization_id) === organizationId.trim();
          const matchUser = !userId || (g.userId || g.user_id) === userId.trim();
          if (matchOrg && matchUser) {
            g.status = 'REAUTH_REQUIRED';
          }
        }
      });
    }

    if ((!accountType || accountType === 'calendar') && localDb.db.calendarAccounts && Array.isArray(localDb.db.calendarAccounts)) {
      localDb.db.calendarAccounts.forEach(c => {
        if ((c.email || '').toLowerCase().trim() === cleanEmail) {
          const matchOrg = !organizationId || (c.organizationId || c.organization_id) === organizationId.trim();
          const matchUser = !userId || (c.userId || c.user_id) === userId.trim();
          if (matchOrg && matchUser) {
            c.status = 'REAUTH_REQUIRED';
          }
        }
      });
    }

    localDb.save();
    console.log(`[OUTREACH GOOGLE ACCOUNT] Marked account ${cleanEmail}${accountType ? ` (${accountType})` : ''} as REAUTH_REQUIRED in LocalDB.`);
  } catch (localErr: any) {
    console.warn('[OUTREACH GOOGLE ACCOUNT] LocalDB mark status notice:', localErr?.message);
  }
}

/**
 * Classifies Google OAuth callback failures into clear, actionable, sanitized diagnostic
 * messages without exposing OAuth tokens, client secrets, or raw SQL internals.
 */
export function classifyGoogleCallbackError(rawError: unknown, requestId?: string): string {
  const errObj = rawError as any;
  const derivedRequestId =
    typeof requestId === 'string' && requestId.trim()
      ? requestId.trim()
      : typeof errObj?.requestId === 'string' && errObj.requestId.trim()
        ? errObj.requestId.trim()
        : '';
  const withRef = (base: string) =>
    derivedRequestId && !base.includes(derivedRequestId) ? `${base} (Reference: ${derivedRequestId})` : base;

  const msg = rawError instanceof Error
    ? rawError.message
    : typeof rawError === 'string'
      ? rawError
      : String(rawError || '');
  const lower = msg.toLowerCase();

  // 1. Token exchange errors returned by https://oauth2.googleapis.com/token
  if (lower.includes('google exchange failed') || lower.includes('redirect_uri_mismatch') || lower.includes('invalid_client') || lower.includes('invalid_grant') || lower.includes('unauthorized_client') || lower.includes('disabled_client')) {
    let parsedError = '';
    let parsedDesc = '';
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        parsedError = String(parsed.error || '').toLowerCase().trim();
        parsedDesc = String(parsed.error_description || '').trim();
      } catch (_) {}
    }

    const combined = `${parsedError} ${lower}`;
    if (combined.includes('redirect_uri_mismatch')) {
      return withRef('Google OAuth redirect URI mismatch. Verify Authorized Redirect URIs in Google Cloud Console match the callback URL.');
    }
    if (combined.includes('invalid_client')) {
      return withRef('Google OAuth client credentials were rejected by Google (invalid_client). Check your configured OAuth Client ID and Secret.');
    }
    if (combined.includes('invalid_grant')) {
      return withRef('Google OAuth authorization code expired or was already used. Please try connecting again.');
    }
    if (combined.includes('unauthorized_client')) {
      return withRef('Google OAuth client is not authorized for this grant type in Google Cloud Console.');
    }
    if (combined.includes('disabled_client')) {
      return withRef('Google OAuth client is disabled in Google Cloud Console.');
    }
    if (combined.includes('invalid_scope')) {
      return withRef('Requested Google Gmail or Calendar scopes are invalid or not enabled on the OAuth client.');
    }
    if (combined.includes('access_denied')) {
      return withRef('Google authorization was canceled or denied by the user.');
    }
    if (parsedError) {
      return withRef(
        parsedDesc && parsedDesc.length <= 120
          ? `Google token exchange failed (${parsedError}): ${parsedDesc}`
          : `Google token exchange failed (${parsedError}). Please verify Google OAuth settings and try again.`
      );
    }
    return withRef('Google token exchange failed. Please verify OAuth client configuration and try again.');
  }

  // 2. Google UserInfo failure
  if (lower.includes('failed to fetch user info') || lower.includes('userinfo')) {
    return withRef('Unable to retrieve your Google account profile after authorization. Please try again.');
  }

  // 3. Authoritative Database Persistence failures
  if (lower.includes('google_accounts_user_id_fkey') || (lower.includes('foreign key') && lower.includes('user_id'))) {
    return withRef('Unable to save Google authorization: user record was not found in the database (google_accounts_user_id_fkey).');
  }
  if (lower.includes('google_accounts_organization_id_fkey') || (lower.includes('foreign key') && lower.includes('organization_id'))) {
    return withRef('Unable to save Google authorization: workspace organization record was not found in the database (google_accounts_organization_id_fkey).');
  }
  if (lower.includes('authenticated user does not exist in database') || lower.includes('authenticated user does not exist in the database')) {
    return withRef('Unable to save Google authorization: authenticated user record was not found in the workspace database.');
  }
  if (lower.includes('target organization does not exist in database') || lower.includes('target organization does not exist in the database')) {
    return withRef('Unable to save Google authorization: workspace organization record was not found in the database.');
  }
  if (lower.includes('does not have verified membership') || lower.includes('does not have verified active membership')) {
    return withRef('Unable to save Google authorization: user does not have an active membership in this workspace.');
  }
  if (lower.includes('confirmation timestamp is missing') || lower.includes('email_confirmed_at required')) {
    return withRef('Unable to save Google authorization: authenticated user email confirmation timestamp is missing.');
  }
  if (lower.includes('email is unverified') || lower.includes('unverified email identities are strictly rejected')) {
    return withRef('Unable to save Google authorization: user email is unverified in the workspace database.');
  }
  if (lower.includes('email mismatch')) {
    return withRef('Unable to save Google authorization: user email does not match authenticated identity.');
  }
  if (lower.includes('non-mock access token is required')) {
    return withRef('Unable to save Google authorization: valid non-mock credentials are required in production.');
  }
  if (lower.includes('supabase_service_role_key') || lower.includes('privileged server-side')) {
    return withRef('Server database configuration error: privileged database service key is missing.');
  }

  // Specific PostgreSQL / schema classifications without exposing SQL/table internals
  const pgCode = String(errObj?.pgCode || '').trim();
  if (pgCode === '23502' || lower.includes('code 23502') || lower.includes('not-null constraint')) {
    return withRef('Unable to save Google authorization: a required database field was missing.');
  }
  if (pgCode === '23505' || lower.includes('code 23505') || lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return withRef('Unable to save Google authorization: a conflicting Google account record already exists.');
  }
  if (pgCode === '42P01' || lower.includes('code 42p01') || (lower.includes('relation') && lower.includes('does not exist'))) {
    return withRef('Unable to save Google authorization: required database table is missing or migrations are incomplete.');
  }
  if (pgCode === '42703' || pgCode === 'PGRST204' || lower.includes('code 42703') || lower.includes('code pgrst204') || lower.includes('schema cache')) {
    return withRef('Unable to save Google authorization: database schema is out of sync with application expectations.');
  }
  if (pgCode === '42501' || lower.includes('code 42501') || lower.includes('row-level security') || lower.includes('permission denied')) {
    return withRef('Unable to save Google authorization: database permission check rejected the write.');
  }
  if (pgCode === '22P02' || pgCode === '22007' || pgCode === '22008' || lower.includes('code 22p02') || lower.includes('code 22007') || lower.includes('code 22008') || lower.includes('invalid input syntax')) {
    return withRef('Unable to save Google authorization: database column format mismatch.');
  }

  if (
    lower.includes('database persistence failed') ||
    lower.includes('failed to persist google account') ||
    lower.includes('failed to insert google account') ||
    lower.includes('failed to update google account') ||
    lower.includes('failed to verify authenticated user') ||
    lower.includes('failed to verify target organization')
  ) {
    return withRef('Unable to save Google authorization to the database. Please check server database logs.');
  }

  return withRef('Unable to connect your Google account. Please try again.');
}

/**
 * Unified production persistence policy shared across both the Google OAuth callback
 * (/api/auth/google/callback) and /gmail/connect.
 *
 * Authoritative Supabase persistence is mandatory when running in production, on Vercel,
 * or whenever SUPABASE_SERVICE_ROLE_KEY is configured.
 */
export function isAuthoritativeGooglePersistenceRequired(env: NodeJS.ProcessEnv = process.env): boolean {
  const hasServiceRoleKey = Boolean(env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.trim());
  return (
    env.NODE_ENV === 'production' ||
    Boolean(env.VERCEL) ||
    env.ENVIRONMENT === 'production' ||
    hasServiceRoleKey
  );
}

/**
 * Executes persistAuthoritativeGoogleAccount under the unified production/development policy.
 * - Production / Vercel / configured SUPABASE_SERVICE_ROLE_KEY: fails closed on any persistence error.
 * - Local development without SUPABASE_SERVICE_ROLE_KEY: logs a warning and allows local dev fallback.
 */
export async function persistGoogleAccountWithPolicy(options: {
  params: PersistGoogleAccountParams;
  contextLabel?: string;
  env?: NodeJS.ProcessEnv;
  persistFn?: typeof persistAuthoritativeGoogleAccount;
  requestId?: string;
}): Promise<{
  persisted: boolean;
  persistenceRequired: boolean;
  gmailId: string;
  calendarId: string;
  requestId: string;
  warning?: string;
}> {
  const env = options.env || process.env;
  const contextLabel = options.contextLabel || 'GOOGLE ACCOUNT PERSISTENCE';
  const persistFn = options.persistFn || persistAuthoritativeGoogleAccount;
  const persistenceRequired = isAuthoritativeGooglePersistenceRequired(env);
  const requestId = createCorrelationRequestId(options.requestId || options.params.requestId);

  try {
    const result = await persistFn({
      ...options.params,
      requestId
    });
    if (persistenceRequired && !result?.success) {
      throw new GooglePersistenceDiagnosticsError('Authoritative Supabase persistence did not succeed.', {
        requestId,
        stage: 'policy_enforcement',
        classification: 'persistence_returned_false',
        httpStatus: 500
      });
    }
    return {
      persisted: Boolean(result?.success),
      persistenceRequired,
      gmailId: result?.gmailId || '',
      calendarId: result?.calendarId || '',
      requestId
    };
  } catch (pErr: any) {
    const errMsg = pErr?.message || String(pErr) || 'Unable to save Google authorization to database.';
    if (persistenceRequired) {
      console.error(`[${contextLabel}] Supabase persistence error [${requestId}]:`, errMsg);
      if (pErr instanceof GooglePersistenceDiagnosticsError) {
        throw new GooglePersistenceDiagnosticsError(`Database persistence failed: ${errMsg}`, {
          requestId: pErr.requestId || requestId,
          stage: pErr.stage,
          pgCode: pErr.pgCode,
          classification: pErr.classification,
          constraint: pErr.constraint,
          httpStatus: pErr.httpStatus
        });
      }
      throw new GooglePersistenceDiagnosticsError(`Database persistence failed: ${errMsg}`, {
        requestId,
        stage: 'policy_enforcement',
        pgCode: typeof pErr?.pgCode === 'string' ? pErr.pgCode : undefined,
        classification: 'persistence_exception',
        httpStatus: 500
      });
    }
    console.warn(`[${contextLabel} PERSISTENCE NOTICE] Continuing with local development store [${requestId}]:`, errMsg);
    return {
      persisted: false,
      persistenceRequired: false,
      gmailId: '',
      calendarId: '',
      requestId,
      warning: errMsg
    };
  }
}

export interface GmailConnectAccountRecord {
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scopes?: string[];
  status: 'CONNECTED' | 'REAUTH_REQUIRED' | 'REAUTH_NEEDED' | 'DISCONNECTED' | 'ERROR';
  sendingLimit: number;
  sentToday: number;
  bounceCount: number;
  retryCount: number;
  organizationId?: string;
  userId?: string;
  createdAt: string;
}

export interface GmailConnectHandlerDeps {
  getAuthenticatedUser: (req: any) => any;
  resolveVerifiedOrganizationId: (req: any, user: any) => { orgId?: string | null; error?: string; status?: number };
  resolveCanonicalGoogleIdentity: (req: any, user: any, verifiedOrgId: string) => Promise<{ userId: string; organizationId: string }>;
  getGmailAccounts: () => GmailConnectAccountRecord[];
  saveAccountsToDisk: () => void;
  persistAccount?: typeof persistAuthoritativeGoogleAccount;
  getEnv?: () => NodeJS.ProcessEnv;
}

/**
 * Express route handler factory for POST /gmail/connect.
 * Enforces the identical production persistence policy as /api/auth/google/callback:
 * authoritative Supabase persistence runs before local state mutation and fails closed
 * in production/Vercel on persistence errors without returning a success response.
 */
export function createGmailConnectHandler(deps: GmailConnectHandlerDeps) {
  return async (req: any, res: any) => {
    const requestId = createCorrelationRequestId(req?.requestId || req?.id);
    if (typeof res?.setHeader === 'function') {
      res.setHeader('x-request-id', requestId);
    }
    const user = deps.getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Authentication token required.', requestId });
    }
    const { orgId, error, status } = deps.resolveVerifiedOrganizationId(req, user);
    if (error || !orgId) {
      return res.status(status || 403).json({ error: error || 'Organization access denied.', requestId });
    }
    const effectiveOrgId = orgId;
    const { email, fullName, accessToken, refreshToken, expiresAt } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim() || !accessToken || typeof accessToken !== 'string' || !accessToken.trim()) {
      return res.status(400).json({ error: 'Missing required parameters: email, accessToken', requestId });
    }

    const cleanEmail = email.toLowerCase().trim();
    const defaultScopes = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/calendar'];
    const canonicalIdentity = await deps.resolveCanonicalGoogleIdentity(req, user, effectiveOrgId);
    const expiresTimestamp = expiresAt || new Date(Date.now() + 3600000).toISOString();
    const resolvedName = (typeof fullName === 'string' && fullName.trim()) ? fullName.trim() : cleanEmail.split('@')[0];

    try {
      await persistGoogleAccountWithPolicy({
        params: {
          userId: canonicalIdentity.userId,
          userEmail: (req as any)?.supabaseAuthUser?.email || user.email,
          authIdentity: (req as any)?.supabaseAuthUser || {
            id: user.id,
            email: user.email,
            email_confirmed_at: (user as any).emailConfirmedAt || null
          },
          emailConfirmedAt:
            (req as any)?.supabaseAuthUser?.email_confirmed_at ??
            (req as any)?.supabaseAuthUser?.confirmed_at ??
            (user as any).emailConfirmedAt ??
            null,
          organizationId: effectiveOrgId,
          email: cleanEmail,
          name: resolvedName,
          accessToken,
          refreshToken: refreshToken || '',
          scopes: defaultScopes,
          expiresAt: expiresTimestamp,
          requestId
        },
        contextLabel: 'GMAIL CONNECT',
        env: deps.getEnv ? deps.getEnv() : process.env,
        persistFn: deps.persistAccount,
        requestId
      });
    } catch (pErr: any) {
      const rawMessage = pErr?.message || String(pErr) || 'Unable to save Google authorization to database.';
      const safeError = classifyGoogleCallbackError(pErr || rawMessage, requestId);
      const httpStatus = rawMessage.toLowerCase().includes('non-mock access token')
        ? 400
        : (pErr?.httpStatus || 500);
      return res.status(httpStatus).json({
        error: safeError,
        success: false,
        requestId
      });
    }

    const gmailAccounts = deps.getGmailAccounts();
    const existingAcc = gmailAccounts.find(
      a =>
        (a.email || '').toLowerCase().trim() === cleanEmail &&
        a.organizationId === effectiveOrgId &&
        a.userId === canonicalIdentity.userId
    );

    if (existingAcc) {
      existingAcc.email = cleanEmail;
      existingAcc.accessToken = accessToken;
      if (refreshToken) existingAcc.refreshToken = refreshToken;
      existingAcc.expiresAt = expiresTimestamp;
      existingAcc.scopes = defaultScopes;
      existingAcc.status = 'CONNECTED';
      existingAcc.fullName = resolvedName || existingAcc.fullName;
      existingAcc.organizationId = effectiveOrgId;
      existingAcc.userId = canonicalIdentity.userId;
    } else {
      const newAcc: GmailConnectAccountRecord = {
        email: cleanEmail,
        fullName: resolvedName,
        accessToken,
        refreshToken,
        expiresAt: expiresTimestamp,
        scopes: defaultScopes,
        status: 'CONNECTED',
        sendingLimit: 500,
        sentToday: 0,
        bounceCount: 0,
        retryCount: 0,
        organizationId: effectiveOrgId,
        userId: canonicalIdentity.userId,
        createdAt: new Date().toISOString()
      };
      gmailAccounts.push(newAcc);
    }
    deps.saveAccountsToDisk();

    const connectedAcc = gmailAccounts.find(
      a =>
        (a.email || '').toLowerCase().trim() === cleanEmail &&
        a.organizationId === effectiveOrgId &&
        a.userId === canonicalIdentity.userId
    );
    return res.json({
      message: 'Gmail account connected successfully to SalesPilot.',
      account: connectedAcc
        ? {
            email: connectedAcc.email,
            fullName: connectedAcc.fullName,
            status: connectedAcc.status,
            organizationId: connectedAcc.organizationId,
            userId: connectedAcc.userId
          }
        : null
    });
  };
}

export function escapeOAuthHtmlText(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


