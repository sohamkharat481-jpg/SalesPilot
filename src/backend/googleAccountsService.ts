import { SupabaseClient } from '@supabase/supabase-js';
import { getPrivilegedSupabaseServerClient } from '../lib/supabase.server';

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

  // In production, SUPABASE_SERVICE_ROLE_KEY is mandatory for accessing public.google_accounts
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim());
  if (!hasServiceRoleKey && !customClient) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required in production to resolve authorized Gmail accounts from public.google_accounts.');
    }
    console.warn('[OUTREACH GOOGLE ACCOUNT] Protected google_accounts access blocked: SUPABASE_SERVICE_ROLE_KEY is missing.');
    return null;
  }

  let client: SupabaseClient;
  try {
    client = customClient || getPrivilegedSupabaseServerClient();
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.warn('[OUTREACH GOOGLE ACCOUNT] Failed to obtain privileged Supabase client:', err?.message || err);
    return null;
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

  const { data, count, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

  const queryCount = count !== null && count !== undefined ? count : (data ? 1 : 0);
  const matchedEmail = data?.email || null;
  const matchedAccountType = data?.account_type || null;
  const credentialsPresent = Boolean(data?.access_token);

  if (error) {
    console.error('[OUTREACH GOOGLE ACCOUNT] Database query error on google_accounts:', error.message);
    console.log('[SAFE GMAIL RESOLVER DIAGNOSTICS]', {
      authenticatedUserId: userId || null,
      verifiedOrganizationId: cleanOrgId,
      xOrganizationIdReceived: xOrganizationId || null,
      senderEmail: senderEmail || null,
      googleAccountsQueryCount: queryCount,
      matchedAccountEmail: matchedEmail,
      matchedAccountType: matchedAccountType,
      credentialsPresent,
      resolverResult: 'error'
    });
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Database error querying authoritative google_accounts: ${error.message}`);
    }
    return null;
  }

  if (!data || !data.access_token) {
    console.log('[SAFE GMAIL RESOLVER DIAGNOSTICS]', {
      authenticatedUserId: userId || null,
      verifiedOrganizationId: cleanOrgId,
      xOrganizationIdReceived: xOrganizationId || null,
      senderEmail: senderEmail || null,
      googleAccountsQueryCount: queryCount,
      matchedAccountEmail: matchedEmail,
      matchedAccountType: matchedAccountType,
      credentialsPresent: false,
      resolverResult: 'not_found'
    });
    return null;
  }

  // Double check user isolation: if userId was provided, ensure record strictly matches
  if (userId && data.user_id && data.user_id !== userId.trim()) {
    console.warn(`[OUTREACH GOOGLE ACCOUNT] User ID mismatch: record owned by ${data.user_id}, requested by ${userId}. Rejecting cross-user send.`);
    return null;
  }

  const isReauthRequired = data.status === 'REAUTH_REQUIRED' || data.status === 'REAUTH_NEEDED';

  console.log('[SAFE GMAIL RESOLVER DIAGNOSTICS]', {
    authenticatedUserId: userId || null,
    verifiedOrganizationId: cleanOrgId,
    xOrganizationIdReceived: xOrganizationId || null,
    senderEmail: senderEmail || null,
    googleAccountsQueryCount: queryCount,
    matchedAccountEmail: matchedEmail,
    matchedAccountType: matchedAccountType,
    credentialsPresent: true,
    resolverResult: isReauthRequired ? 'REAUTH_REQUIRED' : 'success'
  });

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
    createdAt: data.created_at || new Date().toISOString(),
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
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

  let client: SupabaseClient;
  try {
    client = customClient || getPrivilegedSupabaseServerClient();
  } catch (err: any) {
    return null;
  }

  const { data, error } = await client
    .from('google_accounts')
    .select('*')
    .in('account_type', ['calendar', 'CALENDAR'])
    .eq('organization_id', cleanOrgId)
    .eq('user_id', cleanUserId)
    .not('access_token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || !data.access_token) {
    return null;
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

  const calendarStatus = calendarAccessVerified ? 'CONNECTED' : 'CONNECTING';

  const rows = [
    {
      id: `ga_${cleanUserId}_${cleanEmail}_calendar`,
      user_id: cleanUserId,
      organization_id: cleanOrgId,
      email: cleanEmail,
      access_token: accessToken,
      refresh_token: refreshToken || '',
      scopes: scopes || [],
      expiry_date: expiresAt,
      account_type: 'calendar',
      status: calendarStatus,
      updated_at: now
    },
    {
      id: `ga_${cleanUserId}_${cleanEmail}_gmail`,
      user_id: cleanUserId,
      organization_id: cleanOrgId,
      email: cleanEmail,
      access_token: accessToken,
      refresh_token: refreshToken || '',
      scopes: scopes || [],
      expiry_date: expiresAt,
      account_type: 'gmail',
      status: 'CONNECTED',
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
