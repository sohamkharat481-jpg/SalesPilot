import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClientInstance: SupabaseClient | null = null;

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

// Backwards-compatible alias for localDb / backend tools
export const getSupabaseClient = getSupabaseServerClient;
