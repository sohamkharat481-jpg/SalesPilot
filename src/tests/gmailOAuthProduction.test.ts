import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  buildGoogleOAuthHeaders, 
  requestGoogleOAuthUrl 
} from '../utils/googleOAuthClient';
import { 
  resolveAuthoritativeGmailAccount, 
  persistAuthoritativeGoogleAccount 
} from '../backend/googleAccountsService';
import { 
  getPrivilegedSupabaseServerClient, 
  resetPrivilegedSupabaseServerClient 
} from '../lib/supabase.server';

describe('Production Gmail OAuth & Authoritative Account Store', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetPrivilegedSupabaseServerClient();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    resetPrivilegedSupabaseServerClient();
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // 1. Integrations OAuth request includes Authorization header
  it('1. Integrations OAuth request includes Authorization header', async () => {
    let capturedHeaders: Record<string, string> = {};
    const mockFetch: any = async (url: string, init: any) => {
      capturedHeaders = init?.headers || {};
      return {
        ok: true,
        json: async () => ({ url: 'https://accounts.google.com/o/oauth2/v2/auth?state=xyz' })
      };
    };

    const res = await requestGoogleOAuthUrl({
      sessionToken: 'sb_access_token_user_valid_456',
      workspaceId: 'org_workspace_123',
      fetchImpl: mockFetch
    });

    expect(res.url).toContain('https://accounts.google.com');
    expect(capturedHeaders['Authorization']).toBe('Bearer sb_access_token_user_valid_456');
  });

  // 2. Integrations OAuth request includes verified x-organization-id
  it('2. Integrations OAuth request includes verified x-organization-id', async () => {
    let capturedHeaders: Record<string, string> = {};
    const mockFetch: any = async (url: string, init: any) => {
      capturedHeaders = init?.headers || {};
      return {
        ok: true,
        json: async () => ({ url: 'https://accounts.google.com/o/oauth2/v2/auth?state=xyz' })
      };
    };

    await requestGoogleOAuthUrl({
      sessionToken: 'sb_access_token_valid',
      workspaceId: 'org_verified_tenant_abc',
      fetchImpl: mockFetch
    });

    expect(capturedHeaders['x-organization-id']).toBe('org_verified_tenant_abc');
  });

  // 3. Missing session prevents OAuth request
  it('3. Missing session prevents OAuth request and does not dispatch network call', async () => {
    let fetchCalled = false;
    const mockFetch: any = async () => {
      fetchCalled = true;
      return { ok: true, json: async () => ({ url: 'https://accounts.google.com' }) };
    };

    // Case A: null session token
    await expect(
      requestGoogleOAuthUrl({
        sessionToken: null,
        workspaceId: 'org_workspace_123',
        fetchImpl: mockFetch
      })
    ).rejects.toThrow(/Authentication Error: No active Supabase session found/);

    // Case B: empty string session token
    await expect(
      requestGoogleOAuthUrl({
        sessionToken: '   ',
        workspaceId: 'org_workspace_123',
        fetchImpl: mockFetch
      })
    ).rejects.toThrow(/Authentication Error: No active Supabase session found/);

    expect(fetchCalled).toBe(false);
  });

  // 4. Server-side google_accounts query uses the privileged server client only
  it('4. Server-side google_accounts query uses the privileged server client only with SUPABASE_SERVICE_ROLE_KEY', () => {
    process.env.SUPABASE_URL = 'https://tenant.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_secret_key_trusted';
    process.env.SUPABASE_ANON_KEY = 'anon_public_key';

    const client = getPrivilegedSupabaseServerClient();
    expect(client).toBeDefined();

    // Verify it fails if service role key is missing, even if anon key is available
    resetPrivilegedSupabaseServerClient();
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    expect(() => getPrivilegedSupabaseServerClient()).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY is required for privileged server-side operations on google_accounts/
    );
  });

  // 5. Missing SUPABASE_SERVICE_ROLE_KEY fails safely in production
  it('5. Missing SUPABASE_SERVICE_ROLE_KEY fails safely in production with clear configuration error', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://prod.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    // A. Querying accounts fails safely with configuration error
    await expect(
      resolveAuthoritativeGmailAccount({
        organizationId: 'org_prod_tenant'
      })
    ).rejects.toThrow(
      /Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required in production/
    );

    // B. Persisting accounts fails safely with configuration error
    await expect(
      persistAuthoritativeGoogleAccount({
        userId: 'usr_123',
        organizationId: 'org_prod_tenant',
        email: 'workspace-owner@company.com',
        accessToken: 'ya29.valid_prod_token',
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        expiresAt: new Date().toISOString()
      })
    ).rejects.toThrow(
      /Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required in production/
    );
  });

  // 6. Cross-tenant Gmail account cannot be resolved
  it('6. Cross-tenant Gmail account cannot be resolved', async () => {
    // Mock database with account belonging strictly to org_tenant_ALPHA
    const storedAccounts = [
      {
        id: 'ga_owner_alpha_gmail',
        organization_id: 'org_tenant_ALPHA',
        email: 'owner@alpha-corp.com',
        access_token: 'ya29.alpha_real_oauth_token',
        refresh_token: '1//alpha_refresh',
        account_type: 'gmail',
        created_at: new Date().toISOString()
      }
    ];

    const mockPrivilegedClient: any = {
      from: (table: string) => {
        expect(table).toBe('google_accounts');
        return {
          select: () => ({
            in: (field: string, values: string[]) => ({
              eq: (orgField: string, orgVal: string) => ({
                not: (tokenField: string, op: string, val: any) => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => {
                        const found = storedAccounts.find(
                          a => a.organization_id === orgVal && values.includes(a.account_type)
                        );
                        return { data: found || null, error: null };
                      }
                    })
                  })
                })
              })
            })
          })
        };
      }
    };

    // Attempting to resolve with org_tenant_BETA must return null
    const betaResult = await resolveAuthoritativeGmailAccount({
      organizationId: 'org_tenant_BETA',
      privilegedClient: mockPrivilegedClient
    });

    expect(betaResult).toBeNull();

    // Resolving with org_tenant_ALPHA succeeds
    const alphaResult = await resolveAuthoritativeGmailAccount({
      organizationId: 'org_tenant_ALPHA',
      privilegedClient: mockPrivilegedClient
    });

    expect(alphaResult).not.toBeNull();
    expect(alphaResult?.email).toBe('owner@alpha-corp.com');
    expect(alphaResult?.organizationId).toBe('org_tenant_ALPHA');
  });

  // 7. OAuth callback persists Gmail account with correct organization_id
  it('7. OAuth callback persists Gmail account with correct organization_id and normalized lowercase gmail', async () => {
    let upsertedRows: any[] = [];
    const mockPrivilegedClient: any = {
      from: (table: string) => {
        expect(table).toBe('google_accounts');
        return {
          upsert: async (rows: any[], options: any) => {
            expect(options?.onConflict).toBe('id');
            upsertedRows = rows;
            return { error: null };
          }
        };
      }
    };

    const result = await persistAuthoritativeGoogleAccount({
      userId: 'usr_verified_owner_99',
      organizationId: 'org_verified_acme_corp',
      email: 'founder@acme.com',
      name: 'Acme Founder',
      accessToken: 'ya29.legitimate_access_token_123',
      refreshToken: '1//legitimate_refresh_token_456',
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
      ],
      expiresAt: '2026-12-31T23:59:59.000Z',
      privilegedClient: mockPrivilegedClient
    });

    expect(result.success).toBe(true);
    expect(upsertedRows.length).toBe(2);

    const gmailRow = upsertedRows.find(r => r.account_type === 'gmail');
    expect(gmailRow).toBeDefined();
    expect(gmailRow.organization_id).toBe('org_verified_acme_corp');
    expect(gmailRow.email).toBe('founder@acme.com');
    expect(gmailRow.access_token).toBe('ya29.legitimate_access_token_123');
    expect(gmailRow.refresh_token).toBe('1//legitimate_refresh_token_456');
    expect(gmailRow.account_type).toBe('gmail'); // normalized lowercase
  });

  // 8. getGmailAccount() resolves the connected Gmail account
  it('8. getGmailAccount() resolves the connected Gmail account (handling both lowercase and legacy uppercase)', async () => {
    const mockDb: any = {
      'org_tenant_normal': {
        id: 'ga_owner_normal_gmail',
        organization_id: 'org_tenant_normal',
        email: 'owner@normal.com',
        access_token: 'ya29.real_google_access_token',
        refresh_token: '1//refresh_token_valid',
        expiry_date: '2026-10-01T12:00:00.000Z',
        account_type: 'gmail',
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        created_at: '2026-09-21T06:00:00.000Z'
      },
      'org_tenant_legacy': {
        id: 'ga_owner_legacy_gmail',
        organization_id: 'org_tenant_legacy',
        email: 'owner@legacy.com',
        access_token: 'ya29.real_legacy_token',
        refresh_token: '1//refresh_token_legacy',
        expiry_date: '2026-10-01T12:00:00.000Z',
        account_type: 'GMAIL', // Legacy uppercase record
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        created_at: '2026-09-20T06:00:00.000Z'
      }
    };

    const mockPrivilegedClient: any = {
      from: () => ({
        select: () => ({
          in: (_field: string, allowedTypes: string[]) => ({
            eq: (_orgField: string, orgVal: string) => ({
              not: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => {
                      const item = mockDb[orgVal];
                      if (item && allowedTypes.includes(item.account_type)) {
                        return { data: item, error: null };
                      }
                      return { data: null, error: null };
                    }
                  })
                })
              })
            })
          })
        })
      })
    };

    // Test normalized "gmail"
    const normalAccount = await resolveAuthoritativeGmailAccount({
      organizationId: 'org_tenant_normal',
      privilegedClient: mockPrivilegedClient
    });
    expect(normalAccount).not.toBeNull();
    expect(normalAccount?.email).toBe('owner@normal.com');
    expect(normalAccount?.status).toBe('CONNECTED');
    expect(normalAccount?.accountType).toBe('gmail');

    // Test legacy "GMAIL" (Task 4: existing legitimate GMAIL records remain accessible)
    const legacyAccount = await resolveAuthoritativeGmailAccount({
      organizationId: 'org_tenant_legacy',
      privilegedClient: mockPrivilegedClient
    });
    expect(legacyAccount).not.toBeNull();
    expect(legacyAccount?.email).toBe('owner@legacy.com');
    expect(legacyAccount?.status).toBe('CONNECTED');
    expect(legacyAccount?.accountType).toBe('gmail');
  });

  // 9. No mock Gmail account is created or returned
  it('9. No mock Gmail account is created or resolved', async () => {
    const mockPrivilegedClient: any = {
      from: () => ({
        upsert: vi.fn(),
        select: () => ({
          in: () => ({
            eq: () => ({
              not: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: {
                        id: 'ga_mock',
                        organization_id: 'org_tenant_test',
                        email: 'mock@salespilot.com',
                        access_token: 'mock_access_token_123',
                        account_type: 'gmail'
                      },
                      error: null
                    })
                  })
                })
              })
            })
          })
        })
      })
    };

    // A. Attempting to persist a mock token throws error
    await expect(
      persistAuthoritativeGoogleAccount({
        userId: 'usr_test',
        organizationId: 'org_tenant_test',
        email: 'user@real.com',
        accessToken: 'mock_fake_token_abc',
        scopes: [],
        expiresAt: new Date().toISOString(),
        privilegedClient: mockPrivilegedClient
      })
    ).rejects.toThrow(/Valid, non-mock access token is required/);

    // B. Attempting to resolve an account with a mock token returns null
    const resolved = await resolveAuthoritativeGmailAccount({
      organizationId: 'org_tenant_test',
      privilegedClient: mockPrivilegedClient
    });
    expect(resolved).toBeNull();
  });

  // 10. REAUTH_REQUIRED state detection & mapping
  it('10. REAUTH_REQUIRED state is correctly detected and returned by resolver', async () => {
    const mockDbItem = {
      id: 'ga_expired_gmail',
      organization_id: 'org_tenant_reauth',
      email: 'expired@corp.com',
      access_token: 'ya29.expired_token',
      refresh_token: '1//revoked_refresh',
      status: 'REAUTH_REQUIRED',
      account_type: 'gmail',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      created_at: new Date().toISOString()
    };

    const mockPrivilegedClient: any = {
      from: () => ({
        select: () => ({
          in: () => ({
            eq: () => ({
              not: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: mockDbItem, error: null })
                  })
                })
              })
            })
          })
        })
      })
    };

    const account = await resolveAuthoritativeGmailAccount({
      organizationId: 'org_tenant_reauth',
      privilegedClient: mockPrivilegedClient
    });

    expect(account).not.toBeNull();
    expect(account?.status).toBe('REAUTH_REQUIRED');
  });

  // 11. Reconnect OAuth callback upserts existing record for same org + email without duplicates
  it('11. Reconnect OAuth callback updates existing record (same organization + same Gmail account) without duplication', async () => {
    let upsertedRows: any[] = [];
    const mockPrivilegedClient: any = {
      from: (table: string) => {
        expect(table).toBe('google_accounts');
        return {
          upsert: async (rows: any[], options: any) => {
            expect(options?.onConflict).toBe('id');
            upsertedRows = rows;
            return { error: null };
          }
        };
      }
    };

    // First auth persist
    await persistAuthoritativeGoogleAccount({
      userId: 'usr_1',
      organizationId: 'org_secure_1',
      email: 'soham@company.com',
      accessToken: 'ya29.token_v1',
      refreshToken: '1//refresh_v1',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      expiresAt: new Date().toISOString(),
      privilegedClient: mockPrivilegedClient
    });

    // Reconnect with new tokens
    const result = await persistAuthoritativeGoogleAccount({
      userId: 'usr_1',
      organizationId: 'org_secure_1',
      email: 'soham@company.com',
      accessToken: 'ya29.token_v2_reconnected',
      refreshToken: '1//refresh_v2_reconnected',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      expiresAt: new Date().toISOString(),
      privilegedClient: mockPrivilegedClient
    });

    expect(result.success).toBe(true);
    expect(upsertedRows.length).toBe(2);
    const gmailRow = upsertedRows.find(r => r.account_type === 'gmail');
    expect(gmailRow.access_token).toBe('ya29.token_v2_reconnected');
    expect(gmailRow.refresh_token).toBe('1//refresh_v2_reconnected');
    expect(gmailRow.id).toBe('ga_soham@company.com_gmail'); // deterministic ID prevents duplicates
  });
});
