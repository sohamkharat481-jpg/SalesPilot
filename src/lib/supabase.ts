import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Checks if Supabase credentials are configured in the environment or locally.
 */
export function isSupabaseConfigured(): boolean {
  // Check standard client env variables or session config overrides
  const meta = import.meta as any;
  const url = meta.env?.VITE_SUPABASE_URL || localStorage.getItem('supabase_url');
  const key = meta.env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');
  return !!(url && key);
}

/**
 * Lazy initialization of Supabase client to prevent application crash on startup
 * if environment keys are not configured yet.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const meta = import.meta as any;
  const url = meta.env?.VITE_SUPABASE_URL || localStorage.getItem('supabase_url');
  const key = meta.env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');

  if (!url || !key) {
    console.warn('[SUPABASE] URL or Anon Key is missing. Running in high-performance local Sandbox mode.');
    return null;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    console.log('[SUPABASE] Live client successfully initialized.');
    return supabaseInstance;
  } catch (err) {
    console.error('[SUPABASE] Handshake failed to initialize client:', err);
    return null;
  }
}

/**
 * Saves client credentials to localStorage for live interactive sandbox connections
 */
export function setLocalSupabaseCredentials(url: string, key: string) {
  if (url && key) {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', key);
    supabaseInstance = null; // force re-initialization
  } else {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    supabaseInstance = null;
  }
}
