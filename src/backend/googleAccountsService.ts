import { SupabaseClient } from '@supabase/supabase-js';
import { getPrivilegedSupabaseServerClient } from '../lib/supabase.server';

export interface AuthoritativeGmailAccount {
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  status: 'CONNECTED';
  createdAt: string;
  scopes: string[];
  organizationId: string;
  accountType: 'gmail';
}

export interface ResolveGmailAccountOptions {
  organizationId: string;
  senderEmail?: string;
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
  privilegedClient?: SupabaseClient;
}

/**
 * Resolves an authorized Gmail account for the verified tenant organization
 * strictly from authoritative public.google_accounts.
 *
 * Uses the privileged Supabase client with SUPABASE_SERVICE_ROLE_KEY.
 * Never falls back to mock tokens or unverified disk stores.
 */
export async function resolveAuthoritativeGmailAccount(
  options: ResolveGmailAccountOptions
): Promise<AuthoritativeGmailAccount | null> {
  const { organizationId, senderEmail, privilegedClient: customClient } = options;

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

  // Query authoritative public.google_accounts
  // Support both normalized lowercase "gmail" and legacy "GMAIL" for full backward compatibility
  let query = client
    .from('google_accounts')
    .select('*')
    .in('account_type', ['gmail', 'GMAIL'])
    .eq('organization_id', cleanOrgId)
    .not('access_token', 'is', null);

  if (senderEmail && typeof senderEmail === 'string' && senderEmail.trim() !== '') {
    query = query.eq('email', senderEmail.trim().toLowerCase());
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (error) {
    console.error('[OUTREACH GOOGLE ACCOUNT] Database query error on google_accounts:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Database error querying authoritative google_accounts: ${error.message}`);
    }
    return null;
  }

  if (!data || !data.access_token) {
    console.log('[SAFE GMAIL RESOLVER DIAGNOSTICS]', {
      organizationId: cleanOrgId,
      requestedSenderEmail: senderEmail || null,
      matchingRecordCount: 0,
      matchedAccountEmail: null,
      matchedAccountType: null,
      credentialsPresent: false,
      resolverPath: 'public.google_accounts (service-role) - not found'
    });
    return null;
  }

  console.log('[SAFE GMAIL RESOLVER DIAGNOSTICS]', {
    organizationId: cleanOrgId,
    requestedSenderEmail: senderEmail || null,
    matchingRecordCount: 1,
    matchedAccountEmail: data.email || null,
    matchedAccountType: data.account_type || null,
    credentialsPresent: Boolean(data.access_token),
    resolverPath: 'public.google_accounts (service-role)'
  });

  // Strictly reject any mock accounts or synthetic tokens
  if (data.access_token.startsWith('mock_') || data.email?.includes('mock')) {
    console.warn('[OUTREACH GOOGLE ACCOUNT] Rejected mock account found in database.');
    return null;
  }

  const email = (data.email || '').toLowerCase().trim();
  const expiresAt = data.expiry_date
    ? (typeof data.expiry_date === 'number' ? new Date(data.expiry_date).toISOString() : String(data.expiry_date))
    : new Date(Date.now() + 3600000).toISOString();

  return {
    email,
    fullName: email.split('@')[0],
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresAt,
    status: 'CONNECTED',
    createdAt: data.created_at || new Date().toISOString(),
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
    organizationId: cleanOrgId,
    accountType: 'gmail'
  };
}

/**
 * Persists an authenticated Google account to public.google_accounts using the
 * privileged Supabase client. Normalizes account_type to lowercase "gmail".
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
    privilegedClient: customClient
  } = params;

  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address for Google account persistence.');
  }
  if (!organizationId || organizationId.trim() === '') {
    throw new Error('Organization ID is required to persist Google account.');
  }
  if (!accessToken || accessToken.startsWith('mock_')) {
    throw new Error('Valid, non-mock access token is required to persist Google account.');
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanOrgId = organizationId.trim();

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

  const rows = [
    {
      id: `ga_${cleanEmail}`,
      user_id: userId || null,
      organization_id: cleanOrgId,
      email: cleanEmail,
      access_token: accessToken,
      refresh_token: refreshToken || '',
      scopes: scopes || [],
      expiry_date: expiresAt,
      account_type: 'calendar',
      updated_at: now
    },
    {
      id: `ga_${cleanEmail}_gmail`,
      user_id: userId || null,
      organization_id: cleanOrgId,
      email: cleanEmail,
      access_token: accessToken,
      refresh_token: refreshToken || '',
      scopes: scopes || [],
      expiry_date: expiresAt,
      account_type: 'gmail', // Normalized lowercase "gmail"
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
    gmailId: `ga_${cleanEmail}_gmail`,
    calendarId: `ga_${cleanEmail}`
  };
}
