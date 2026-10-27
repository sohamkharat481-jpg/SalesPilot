import { SupabaseClient } from '@supabase/supabase-js';
import { getPrivilegedSupabaseServerClient } from '../lib/supabase.server';
import { LocalDB } from '../database/localDb';

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

export interface PersistGoogleAccountParams {
  userId: string;
  organizationId: string;
  email: string;
  name?: string;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  expiresAt: string;
  calendarAccessVerified?: boolean;
  privilegedClient?: SupabaseClient;
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
      let isExpired = true;
      if (storedExpiry) {
        const parsedTime = new Date(storedExpiry).getTime();
        isExpired = isNaN(parsedTime) || parsedTime <= Date.now();
      }

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
        expiresAt: storedExpiry || new Date(0).toISOString(),
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

      let isExpired = true;
      if (storedExpiry) {
        const parsedTime = new Date(storedExpiry).getTime();
        isExpired = isNaN(parsedTime) || parsedTime <= Date.now();
      }

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
        expiresAt: storedExpiry || new Date(0).toISOString(),
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
    .not('access_token', 'is', null)
    .not('access_token', 'eq', '');

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

  if (!data || !data.access_token) {
    return resolveLocalDbFallback(cleanOrgId, userId, senderEmail);
  }

  // Double check user isolation: if userId was provided, ensure record strictly matches
  if (userId && data.user_id && data.user_id !== userId.trim()) {
    console.warn(`[OUTREACH GOOGLE ACCOUNT] User ID mismatch: record owned by ${data.user_id}, requested by ${userId}. Rejecting cross-user send.`);
    return null;
  }

  const hasGmailScope = hasRequiredGmailSendScope(data.scopes);
  const isReauthRequired = data.status === 'REAUTH_REQUIRED' || data.status === 'REAUTH_NEEDED' || !hasGmailScope;

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
    resolverResult: isReauthRequired ? 'REAUTH_REQUIRED' : 'success'
  });

  const email = (data.email || '').toLowerCase().trim();
  const expiresAt = data.expiry_date
    ? (typeof data.expiry_date === 'number' ? new Date(data.expiry_date).toISOString() : String(data.expiry_date))
    : new Date(Date.now() + 3600000).toISOString();

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

  if (error || !data || !data.access_token) {
    return resolveLocalDbCalendarFallback(cleanOrgId, cleanUserId);
  }

  const isReauthRequired = data.status === 'REAUTH_REQUIRED' || data.status === 'REAUTH_NEEDED';
  const email = (data.email || '').toLowerCase().trim();
  const expiresAt = data.expiry_date
    ? (typeof data.expiry_date === 'number' ? new Date(data.expiry_date).toISOString() : String(data.expiry_date))
    : new Date(Date.now() + 3600000).toISOString();

  return {
    id: data.id,
    userId: data.user_id,
    email,
    fullName: email.split('@')[0],
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresAt,
    status: isReauthRequired ? 'REAUTH_REQUIRED' : (data.status || 'CONNECTED'),
    calendarAccessVerified: data.status === 'CONNECTED',
    createdAt: data.created_at || new Date().toISOString(),
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
    organizationId: cleanOrgId,
    accountType: 'calendar'
  };
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
    organizationId,
    email,
    name,
    accessToken,
    refreshToken,
    scopes,
    expiresAt,
    calendarAccessVerified = false,
    privilegedClient: customClient
  } = params;

  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address for Google account persistence.');
  }
  if (!organizationId || organizationId.trim() === '') {
    throw new Error('Organization ID is required to persist Google account.');
  }
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required to persist Google account.');
  }
  if (!accessToken || accessToken.startsWith('mock_')) {
    throw new Error('Valid, non-mock access token is required to persist Google account.');
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanOrgId = organizationId.trim();
  const cleanUserId = userId.trim();

  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim());
  if (!hasServiceRoleKey && !customClient) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required in production to persist Google accounts to public.google_accounts.');
    }
    console.warn('[OUTREACH GOOGLE ACCOUNT] Skipping database persistence: SUPABASE_SERVICE_ROLE_KEY is missing.');
    return { success: false, gmailId: '', calendarId: '' };
  }

  const client = customClient || getPrivilegedSupabaseServerClient();
  const now = new Date().toISOString();

  let effectiveRefreshToken = refreshToken || '';
  if (!effectiveRefreshToken) {
    try {
      const { data: existingRec } = await client
        .from('google_accounts')
        .select('refresh_token')
        .eq('id', `ga_${cleanUserId}_${cleanEmail}_calendar`)
        .maybeSingle();
      if (existingRec?.refresh_token) {
        effectiveRefreshToken = existingRec.refresh_token;
      }
    } catch (_) {}
  }

  const calendarStatus = calendarAccessVerified ? 'CONNECTED' : 'CONNECTING';

  const rows = [
    {
      id: `ga_${cleanUserId}_${cleanEmail}_calendar`,
      user_id: cleanUserId,
      organization_id: cleanOrgId,
      email: cleanEmail,
      access_token: accessToken,
      refresh_token: effectiveRefreshToken,
      scopes: scopes || [],
      expiry_date: expiresAt,
      account_type: 'calendar',
      updated_at: now
    },
    {
      id: `ga_${cleanUserId}_${cleanEmail}_gmail`,
      user_id: cleanUserId,
      organization_id: cleanOrgId,
      email: cleanEmail,
      access_token: accessToken,
      refresh_token: effectiveRefreshToken,
      scopes: scopes || [],
      expiry_date: expiresAt,
      account_type: 'gmail',
      updated_at: now
    }
  ];

  const { error } = await client.from('google_accounts').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('[OUTREACH GOOGLE ACCOUNT] Failed to persist accounts to public.google_accounts:', error.message);
    throw new Error(`Failed to persist Google account to database: ${error.message}`);
  }

  return {
    success: true,
    gmailId: `ga_${cleanUserId}_${cleanEmail}_gmail`,
    calendarId: `ga_${cleanUserId}_${cleanEmail}_calendar`
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
        .select('id, user_id, organization_id, email, scopes, account_type, created_at, updated_at')
        .in('account_type', ['gmail', 'GMAIL'])
        .eq('organization_id', cleanOrgId)
        .not('access_token', 'is', null);

      if (userId && typeof userId === 'string' && userId.trim() !== '') {
        query = query.eq('user_id', userId.trim());
      }

      let { data, error } = await query.order('created_at', { ascending: false });

      if ((!data || data.length === 0) && userId) {
        const fallbackRes = await client
          .from('google_accounts')
          .select('id, user_id, organization_id, email, scopes, account_type, created_at, updated_at')
          .in('account_type', ['gmail', 'GMAIL'])
          .eq('organization_id', cleanOrgId)
          .not('access_token', 'is', null)
          .order('created_at', { ascending: false });

        if (!fallbackRes.error && Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          data = fallbackRes.data;
          error = fallbackRes.error;
        }
      }
      if (!error && Array.isArray(data)) {
        return data.map(d => {
          const hasGmailScope = hasRequiredGmailSendScope(d.scopes);
          const rawStatus = (d as any).status || 'CONNECTED';
          const isReauth = rawStatus === 'REAUTH_REQUIRED' || rawStatus === 'REAUTH_NEEDED' || !hasGmailScope;
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

  // Fallback: If database is inaccessible or empty, fallback to LocalDB
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

        const isExpired = storedExpiry ? new Date(storedExpiry).getTime() <= Date.now() : true;
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
  privilegedClient?: SupabaseClient
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
        console.log(`[OUTREACH GOOGLE ACCOUNT] Marked account ${cleanEmail} as REAUTH_REQUIRED in public.google_accounts.`);
      }
    } catch (err: any) {
      console.warn('[OUTREACH GOOGLE ACCOUNT] Supabase update notice:', err.message || String(err));
    }
  }

  // 2. Update LocalDB store for both Gmail and Calendar accounts
  try {
    const localDb = LocalDB.getInstance();
    
    // Update Gmail accounts
    if (localDb.db.gmailAccounts && Array.isArray(localDb.db.gmailAccounts)) {
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

    // Update Calendar accounts
    if (localDb.db.calendarAccounts && Array.isArray(localDb.db.calendarAccounts)) {
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
    console.log(`[OUTREACH GOOGLE ACCOUNT] Marked account ${cleanEmail} as REAUTH_REQUIRED in LocalDB.`);
  } catch (localErr: any) {
    console.warn('[OUTREACH GOOGLE ACCOUNT] LocalDB mark status notice:', localErr?.message);
  }
}

