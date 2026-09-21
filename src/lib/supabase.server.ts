import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClientInstance: SupabaseClient | null = null;
let privilegedServerClientInstance: SupabaseClient | null = null;

/**
 * Singleton factory for backend Server Supabase client.
 * Uses Node process.env exclusively.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    return null;
  }

  if (!serverClientInstance) {
    try {
      serverClientInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err: any) {
      console.error('❌ Failed to initialize backend Supabase client:', err?.message || err);
      return null;
    }
  }

  return serverClientInstance;
}

/**
 * Privileged Server Supabase client factory for trusted operations (e.g. public.google_accounts).
 * MUST use SUPABASE_SERVICE_ROLE_KEY exclusively.
 * NEVER falls back to anon key.
 * If SUPABASE_SERVICE_ROLE_KEY is missing, fails clearly with a configuration error.
 */
export function getPrivilegedSupabaseServerClient(): SupabaseClient {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!serviceKey) {
    throw new Error('Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required for privileged server-side operations on google_accounts.');
  }

  if (!url) {
    throw new Error('Configuration Error: SUPABASE_URL is required for server-side database operations.');
  }

  if (!privilegedServerClientInstance) {
    privilegedServerClientInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return privilegedServerClientInstance;
}

export function resetPrivilegedSupabaseServerClient(): void {
  privilegedServerClientInstance = null;
}

// Backwards-compatible alias for localDb / backend tools
export const getSupabaseClient = getSupabaseServerClient;
