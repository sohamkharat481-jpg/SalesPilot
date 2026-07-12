/**
 * Config Manager for SalesPilot
 * Handles environmental configurations and lazy-initializes
 * the Supabase client and Gemini API SDK with strict error guards.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Safe environment variables retrieval
export const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || '',
  CASHFREE_APP_ID: process.env.CASHFREE_APP_ID || '',
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY || '',
  PORT: 3000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Lazy singletons
let supabaseInstance: SupabaseClient | null = null;
let geminiInstance: GoogleGenAI | null = null;

/**
 * Gets or initializes the Supabase client safely.
 * Returns null if Supabase credentials are not configured,
 * preventing server startup failures.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const url = CONFIG.SUPABASE_URL;
  const anonKey = CONFIG.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(
      '⚠️ Supabase is not fully configured. Database operations will use secure in-memory/JSON store fallback.'
    );
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey);
    console.log('🔌 Supabase client successfully initialized.');
    return supabaseInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    return null;
  }
}

/**
 * Gets or initializes the Gemini API client.
 * Uses process.env.GEMINI_API_KEY. Throws a clear error
 * on usage if the key is missing, avoiding crashes on load.
 */
export function getGemini(): GoogleGenAI {
  if (geminiInstance) {
    return geminiInstance;
  }

  const key = CONFIG.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required for AI-powered sales automation features. Please configure it in your Secrets.'
    );
  }

  try {
    geminiInstance = new GoogleGenAI({ apiKey: key });
    console.log('🤖 Google GenAI (Gemini) SDK successfully initialized.');
    return geminiInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Google GenAI (Gemini) SDK:', error);
    throw error;
  }
}

/**
 * Validates if necessary variables are provided and logs status.
 */
export function checkConfigStatus() {
  const status = {
    supabase: !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY),
    gemini: !!CONFIG.GEMINI_API_KEY,
    n8n: !!CONFIG.N8N_WEBHOOK_URL,
    cashfree: !!(CONFIG.CASHFREE_APP_ID && CONFIG.CASHFREE_SECRET_KEY)
  };

  console.log('\n--- 🚀 SALES_PILOT ARCHITECTURE CONFIG STATUS ---');
  console.log(`📡 Supabase (Auth/DB/Storage):   ${status.supabase ? '✅ CONFIGURED' : '⚠️ FALLBACK_MODE (Local)'}`);
  console.log(`🧠 Gemini AI Outreach Engine:     ${status.gemini ? '✅ CONFIGURED' : '❌ MISSING_API_KEY'}`);
  console.log(`🔗 n8n Workflow Automation:      ${status.n8n ? '✅ ACTIVE' : '⚠️ LOCAL_SIMULATION'}`);
  console.log(`💳 Cashfree Billing Gateway:     ${status.cashfree ? '✅ LIVE' : '⚠️ SIMULATED'}`);
  console.log('-------------------------------------------------\n');

  return status;
}
