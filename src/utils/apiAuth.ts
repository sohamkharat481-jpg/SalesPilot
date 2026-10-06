import { getSupabaseClient } from '../lib/supabase';

/**
 * Authoritative Auth Session & API Utility
 * Provides single source of truth for Supabase session tokens and authenticated fetch requests.
 */

export async function getValidSupabaseSession(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.access_token && !error) {
        // Check if token expires within 60 seconds
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        if (expiresAt && expiresAt - Date.now() < 60000) {
          try {
            const { data: { session: refreshedSession }, error: refError } = await supabase.auth.refreshSession();
            if (refreshedSession?.access_token && !refError) {
              try { localStorage.setItem('salespilot_token', refreshedSession.access_token); } catch (_) {}
              return refreshedSession.access_token;
            }
          } catch (_) {}
        }
        try {
          localStorage.setItem('salespilot_token', session.access_token);
        } catch (_) {}
        return session.access_token;
      }
    } catch (_) {}
  }

  // Fallback to localStorage salespilot_token
  try {
    const token = localStorage.getItem('salespilot_token');
    if (token && token.trim() !== '' && token !== 'undefined' && token !== 'null') {
      return token;
    }
  } catch (_) {}

  // Scan localStorage for any Supabase auth token key (e.g. sb-<ref>-auth-token)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          const candidateToken = parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token;
          if (candidateToken && typeof candidateToken === 'string' && candidateToken.trim() !== '') {
            localStorage.setItem('salespilot_token', candidateToken);
            return candidateToken;
          }
        }
      }
    }
  } catch (_) {}

  return null;
}

export async function getAuthToken(): Promise<string | null> {
  return getValidSupabaseSession();
}

export async function getAuthHeaders(
  customHeaders?: Record<string, string>,
  workspaceId?: string | null
): Promise<Record<string, string>> {
  const token = await getValidSupabaseSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token && typeof token === 'string' && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const resolvedWorkspace = workspaceId || (typeof localStorage !== 'undefined' ? localStorage.getItem('salespilot_workspace_id') : null);
  if (resolvedWorkspace && typeof resolvedWorkspace === 'string' && resolvedWorkspace.trim() !== '') {
    headers['x-organization-id'] = resolvedWorkspace.trim();
  }

  return headers;
}

export async function authenticatedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getValidSupabaseSession();
  const existingHeaders = (init.headers || {}) as Record<string, string>;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...existingHeaders
  };

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const resolvedWorkspace = typeof localStorage !== 'undefined' ? localStorage.getItem('salespilot_workspace_id') : null;
  if (resolvedWorkspace && !headers['x-organization-id'] && !headers['X-Organization-ID']) {
    headers['x-organization-id'] = resolvedWorkspace;
  }

  let res = await fetch(url, { ...init, headers });

  // If 401 Unauthorized, attempt a single Supabase session refresh and retry once
  if (res.status === 401) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (session?.access_token && !error) {
          localStorage.setItem('salespilot_token', session.access_token);
          headers['Authorization'] = `Bearer ${session.access_token}`;
          res = await fetch(url, { ...init, headers });
        }
      } catch (_) {}
    }

    // If still 401 after retry/refresh, verify if authoritative session actually exists
    if (res.status === 401) {
      let hasValidSession = false;
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            hasValidSession = true;
          }
        } catch (_) {}
      }

      // ONLY trigger session expiry if Supabase session is truly missing/dead
      if (!hasValidSession) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('salespilot:session_expired'));
        }
      } else {
        console.warn('[AUTH] Received 401 on protected endpoint, but active Supabase session is valid. Suppressing false session expiry event (likely workspace/permission scoping).');
      }
    }
  }

  return res;
}

