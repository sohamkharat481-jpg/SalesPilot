/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Single source of truth for Supabase credentials.
// Supports both VITE_ and standard prefix across process.env and import.meta.env.
function resolveEnv(key: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {
    // Ignore process reference error
  }

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key] as string;
    }
  } catch {
    // Ignore import.meta reference error
  }

  return '';
}

export const SUPABASE_URL =
  resolveEnv('VITE_SUPABASE_URL') ||
  resolveEnv('SUPABASE_URL') ||
  '';

export const SUPABASE_ANON_KEY =
  resolveEnv('VITE_SUPABASE_ANON_KEY') ||
  resolveEnv('SUPABASE_ANON_KEY') ||
  '';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL.startsWith('http') &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY.length > 0
  );
}

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the single singleton instance of the Supabase client.
 * Lazily initializes on first call if valid credentials are present.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    console.warn(
      '⚠️ Supabase credentials missing or unconfigured (VITE_SUPABASE_URL / SUPABASE_URL or VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY). Running in local fallback mode.'
    );
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      console.log('🔌 Single Supabase client singleton successfully initialized.');
    } catch (err) {
      console.error('❌ Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
}

// Single exported client instance
export const supabase: SupabaseClient | null = getSupabaseClient();

/**
 * Executes a Supabase query operation with automatic retry and exponential backoff
 */
export async function executeSupabaseWithRetry<T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  initialDelayMs = 500
): Promise<{ data: T | null; error: any }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      const res = await queryFn(client);
      if (!res.error) {
        return res;
      }

      // If network or transient error, retry
      attempt++;
      if (attempt > maxRetries) {
        return res;
      }

      console.warn(`🔄 [SUPABASE RETRY] Attempt ${attempt}/${maxRetries} failed: ${res.error.message || res.error}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) {
        return { data: null, error: err };
      }
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  return { data: null, error: new Error('Supabase retry limit exceeded') };
}

