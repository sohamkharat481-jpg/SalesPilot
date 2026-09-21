/**
 * Google OAuth Client Helper
 * Handles authenticated OAuth URL generation and session validation.
 */

export interface GoogleOAuthClientOptions {
  sessionToken?: string | null;
  workspaceId?: string | null;
  fetchImpl?: typeof fetch;
}

/**
 * Validates the active user session and builds authenticated headers for Google OAuth.
 * Throws a clear authentication error if no valid session token exists.
 */
export function buildGoogleOAuthHeaders(
  sessionToken?: string | null,
  workspaceId?: string | null
): Record<string, string> {
  if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.trim() === '') {
    throw new Error('Authentication Error: No active Supabase session found. Please sign in before connecting Google Workspace.');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${sessionToken.trim()}`
  };

  if (workspaceId && typeof workspaceId === 'string' && workspaceId.trim() !== '') {
    headers['x-organization-id'] = workspaceId.trim();
  }

  return headers;
}

/**
 * Initiates an authenticated request to generate a secure Google OAuth consent URL.
 * Does not call the OAuth endpoint if there is no valid session token.
 */
export async function requestGoogleOAuthUrl(options: GoogleOAuthClientOptions): Promise<{ url: string }> {
  const { sessionToken, workspaceId, fetchImpl = fetch } = options;

  // buildGoogleOAuthHeaders enforces session existence before network dispatch
  const headers = buildGoogleOAuthHeaders(sessionToken, workspaceId);

  const res = await fetchImpl('/api/auth/google/url', { headers });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch Google Auth URL (HTTP ${res.status}).`);
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error('Server response did not include a valid Google authorization URL.');
  }

  return data;
}
