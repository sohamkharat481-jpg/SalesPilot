/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Single source of truth for Frontend Supabase credentials using Vite static replacements.
 * Frontend MUST use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the single singleton instance of the Supabase client.
 * Lazily initializes on first call if valid credentials are present.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return clientInstance;
}

// Lazy accessor function for the single Supabase client instance
export function getSupabase(): SupabaseClient | null {
  return getSupabaseClient();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    (SUPABASE_URL.startsWith('http://') || SUPABASE_URL.startsWith('https://'))
  );
}

export interface SupabaseDiagnostics {
  isConfigured: boolean;
  missingVars: string[];
  details: string;
  urlLength: number;
  keyLength: number;
  detectedReason?: string;
}

/**
 * Returns detailed startup diagnostics indicating exactly which environment variables are missing.
 */
export function getSupabaseDiagnostics(): SupabaseDiagnostics {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    return {
      isConfigured: false,
      missingVars: missing,
      details: `Supabase environment variables missing: ${missing.join(', ')}`,
      urlLength: SUPABASE_URL.length,
      keyLength: SUPABASE_ANON_KEY.length,
      detectedReason: `Environment variables missing or empty strings: ${missing.join(', ')}`,
    };
  }

  if (!SUPABASE_URL.startsWith('http://') && !SUPABASE_URL.startsWith('https://')) {
    return {
      isConfigured: false,
      missingVars: ['VITE_SUPABASE_URL (Invalid URL scheme)'],
      details: `VITE_SUPABASE_URL must start with http:// or https:// (received: "${SUPABASE_URL}")`,
      urlLength: SUPABASE_URL.length,
      keyLength: SUPABASE_ANON_KEY.length,
      detectedReason: `Invalid URL scheme in VITE_SUPABASE_URL: "${SUPABASE_URL}". Must begin with http:// or https://.`,
    };
  }

  return {
    isConfigured: true,
    missingVars: [],
    details: 'Supabase credentials successfully configured.',
    urlLength: SUPABASE_URL.length,
    keyLength: SUPABASE_ANON_KEY.length,
    detectedReason: 'Validation passed successfully.',
  };
}

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

      attempt++;
      if (attempt > maxRetries) {
        return res;
      }

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
