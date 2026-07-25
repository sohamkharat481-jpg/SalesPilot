import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function resolveEnvVar(names: string[]): string {
  const meta = (import.meta as any) || {};
  const proc = typeof process !== 'undefined' && process.env ? (process.env as any) : {};

  for (const name of names) {
    if (meta.env && meta.env[name]) return meta.env[name];
    if (proc && proc[name]) return proc[name];
  }
  return '';
}

/**
 * Checks if Supabase credentials are configured in the environment or locally.
 */
export function isSupabaseConfigured(): boolean {
  const url = resolveEnvVar(['VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) || localStorage.getItem('supabase_url') || '';
  const key = resolveEnvVar(['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) || localStorage.getItem('supabase_anon_key') || '';
  return !!(url && key);
}

/**
 * Lazy initialization of Supabase client to prevent application crash on startup
 * if environment keys are not configured yet.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = resolveEnvVar(['VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) || localStorage.getItem('supabase_url') || '';
  const key = resolveEnvVar(['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) || localStorage.getItem('supabase_anon_key') || '';

  const missingVars: string[] = [];
  if (!url) {
    missingVars.push('SUPABASE_URL (checked: VITE_SUPABASE_URL, SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, localStorage.supabase_url)');
  }
  if (!key) {
    missingVars.push('SUPABASE_ANON_KEY (checked: VITE_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, localStorage.supabase_anon_key)');
  }

  if (missingVars.length > 0) {
    console.warn('[SUPABASE INITIALIZATION ERROR] Cannot initialize Supabase client.');
    console.warn('[SUPABASE MISSING VARIABLES]:\n - ' + missingVars.join('\n - '));
    console.warn('[SUPABASE EXACT REASON]: getSupabaseClient() returned null because required environment variables (SUPABASE_URL and SUPABASE_ANON_KEY) are not set in client environment (import.meta.env / process.env / Vercel env / localStorage).');
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
    console.log('[SUPABASE] Live client successfully initialized with URL:', url);
    return supabaseInstance;
  } catch (err: any) {
    console.error('[SUPABASE EXCEPTION] Handshake failed to initialize client:', err?.message || err);
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
