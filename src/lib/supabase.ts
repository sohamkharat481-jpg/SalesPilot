/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Single source of truth for Frontend Supabase credentials using Vite static replacements.
 * Frontend MUST use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Safely masks sensitive string keys for diagnostic logging.
 * Retains first 4 and last 4 characters if long enough.
 */
export function maskSecret(val: string): string {
  if (!val) return '(empty)';
  if (val.length <= 8) return '****';
  return `${val.slice(0, 4)}...${val.slice(-4)}`;
}

let lastInitError: string | null = null;
let lastInitStackTrace: string | null = null;

// Debug logging gate
const isDebug = Boolean(import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true');

// Perform runtime environment audit log upon module load in browser context when debug flag is set
if (typeof window !== 'undefined' && isDebug) {
  const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();
  const commitSha = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || 'N/A';
  console.log('🔍 [DEPLOYMENT RUNTIME DIAGNOSTICS - SUPABASE INIT AUDIT]');
  console.log(` - VITE_SUPABASE_URL: ${maskSecret(SUPABASE_URL)} (length: ${SUPABASE_URL.length})`);
  console.log(` - VITE_SUPABASE_ANON_KEY: ${maskSecret(SUPABASE_ANON_KEY)} (length: ${SUPABASE_ANON_KEY.length})`);
  console.log(` - window.location.origin: ${window.location.origin}`);
  console.log(` - window.location.hostname: ${window.location.hostname}`);
  console.log(` - Build Timestamp: ${buildTime}`);
  console.log(` - Build Commit SHA: ${commitSha}`);
}

export interface SupabaseDiagnostics {
  isConfigured: boolean;
  missingVars: string[];
  details: string;
  initError?: string | null;
  initStackTrace?: string | null;
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

  let detectedReason = '';
  if (missing.length > 0) {
    detectedReason = 'Environment variables are missing or empty strings. Check if Vercel project environment variables were added before build.';
    return {
      isConfigured: false,
      missingVars: missing,
      details: `Supabase environment variables missing: ${missing.join(', ')}`,
      initError: lastInitError,
      initStackTrace: lastInitStackTrace,
      urlLength: SUPABASE_URL.length,
      keyLength: SUPABASE_ANON_KEY.length,
      detectedReason
    };
  }

  if (!SUPABASE_URL.startsWith('http://') && !SUPABASE_URL.startsWith('https://')) {
    detectedReason = `Invalid URL scheme in VITE_SUPABASE_URL: "${SUPABASE_URL}". Must begin with http:// or https://.`;
    return {
      isConfigured: false,
      missingVars: ['VITE_SUPABASE_URL (Invalid URL scheme)'],
      details: `VITE_SUPABASE_URL must start with http:// or https:// (received: "${SUPABASE_URL}")`,
      initError: lastInitError,
      initStackTrace: lastInitStackTrace,
      urlLength: SUPABASE_URL.length,
      keyLength: SUPABASE_ANON_KEY.length,
      detectedReason
    };
  }

  if (lastInitError) {
    return {
      isConfigured: false,
      missingVars: [],
      details: `Supabase initialization error: ${lastInitError}`,
      initError: lastInitError,
      initStackTrace: lastInitStackTrace,
      urlLength: SUPABASE_URL.length,
      keyLength: SUPABASE_ANON_KEY.length,
      detectedReason: 'Exception thrown inside createClient()'
    };
  }

  return {
    isConfigured: true,
    missingVars: [],
    details: 'Supabase credentials successfully configured.',
    initError: null,
    initStackTrace: null,
    urlLength: SUPABASE_URL.length,
    keyLength: SUPABASE_ANON_KEY.length,
    detectedReason: 'Validation passed successfully.'
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseDiagnostics().isConfigured;
}

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the single singleton instance of the Supabase client.
 * Lazily initializes on first call if valid credentials are present.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const diagnostics = getSupabaseDiagnostics();

  if (isDebug) {
    console.log(`🧪 [SUPABASE CLIENT AUDIT] URL Length: ${SUPABASE_URL.length}, Key Length: ${SUPABASE_ANON_KEY.length}`);
    console.log(`🧪 [SUPABASE CLIENT AUDIT] Validation Passed: ${diagnostics.isConfigured}`);
  }

  if (!diagnostics.isConfigured) {
    if (isDebug) {
      console.warn(`⚠️ [SUPABASE CONFIG DIAGNOSTIC]: ${diagnostics.details}. Running in Local Sandbox Fallback Mode.`);
    }
    return null;
  }

  if (!clientInstance) {
    try {
      console.log({
        viteUrlExists: !!import.meta.env.VITE_SUPABASE_URL,
        viteUrlLength: import.meta.env.VITE_SUPABASE_URL?.length ?? 0,
        viteKeyExists: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        viteKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length ?? 0,
        mode: import.meta.env.MODE,
        prod: import.meta.env.PROD
      });
      if (isDebug) {
        console.log(`🔌 Initializing createClient() with URL length ${SUPABASE_URL.length} and Key length ${SUPABASE_ANON_KEY.length}...`);
      }
      clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      if (isDebug) {
        console.log('🔌 Single Supabase client singleton successfully initialized.');
      }
    } catch (err: any) {
      lastInitError = err?.message || String(err);
      lastInitStackTrace = err?.stack || null;
      console.error('❌ Failed to initialize Supabase client:', lastInitError);
      if (lastInitStackTrace) {
        console.error('❌ Exception Stack Trace:', lastInitStackTrace);
      }
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

