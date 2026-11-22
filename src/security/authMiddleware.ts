import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { WorkspaceUser } from '../types';
import { logAuditEvent } from './auditLogger';
import { getSupabaseServerClient } from '../lib/supabase.server';

export interface AuthenticatedRequest extends Request {
  user?: WorkspaceUser;
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  supabaseClient?: SupabaseJwtVerifierClient | null
) {
  const authHeader = req.headers?.authorization || (req.headers as any)?.Authorization;
  const token =
    authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

  const isProduction = isProductionAuthRuntime();

  if (!token) {
    // Explicit development bypass ONLY if configured in non-production local environments
    if (!isProduction && process.env.ENABLE_DEV_AUTH_BYPASS === 'true') {
      req.user = {
        id: 'usr_explicit_dev',
        fullName: 'Local Developer',
        email: 'dev@salespilot.dev',
        role: 'OWNER',
        companyName: 'SalesPilot Dev Workspace',
        industry: 'SaaS',
        tier: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        isFounder: false,
        isVerified: true,
        onboardingCompleted: true,
        createdAt: new Date().toISOString()
      };
      return next();
    }
    return res.status(401).json({
      error: 'Unauthorized: Authentication token required.',
      requestId: (req as any).id
    });
  }

  // Strictly verify Supabase JWT using supabase.auth.getUser(token); never trust presence of Bearer header alone
  const client = supabaseClient !== undefined ? supabaseClient : getSupabaseServerClient();
  const verification = await verifySupabaseBearerJwt(token, client);
  if (!verification.verified || !verification.user) {
    (req as any).authVerificationFailed = true;
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired authentication token.',
      requestId: (req as any).id
    });
  }

  (req as any).authVerifiedVia = 'supabase';
  (req as any).authTokenSub = verification.user.id;
  req.user = {
    id: verification.user.id,
    email: verification.user.email || '',
    fullName:
      verification.user.user_metadata?.full_name ||
      verification.user.user_metadata?.name ||
      (verification.user.email ? String(verification.user.email).split('@')[0] : 'User'),
    companyName: verification.user.user_metadata?.company_name || 'Workspace',
    industry: 'SaaS & Software',
    tier: 'STARTER',
    role: 'MEMBER' as any,
    isFounder: false,
    isVerified: Boolean(verification.user.email_confirmed_at || verification.user.confirmed_at),
    createdAt: verification.user.created_at || new Date().toISOString()
  };

  next();
}

export function requireFounder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (!req.user.isFounder && req.user.role !== 'ADMIN' && req.user.role !== 'OWNER')) {
    logAuditEvent(req, 'ACCESS_FOUNDER_PANEL', 'SECURITY', 'DENIED', req.user);
    res.status(403).json({
      error: 'Access Denied: Founder or Admin privilege required.',
      requestId: (req as any).id
    });
    return;
  }
  next();
}

export function requireEnterprisePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', requestId: (req as any).id });
      return;
    }
    // Enterprise Founder has all permissions
    if (req.user.isFounder || req.user.tier === 'ENTERPRISE' || req.user.role === 'ADMIN') {
      return next();
    }
    logAuditEvent(req, `PERMISSION_CHECK_${permission}`, 'SECURITY', 'DENIED', req.user);
    res.status(403).json({ error: `Forbidden: Missing required permission [${permission}]`, requestId: (req as any).id });
  };
}

export function apiTimeoutHandler(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        logAuditEvent(req, 'REQUEST_TIMEOUT', 'SYSTEM', 'FAILED');
        res.status(504).json({
          error: 'Gateway Timeout: Request execution exceeded time limit.',
          requestId: (req as any).id
        });
      }
    });
    next();
  };
}

export interface SupabaseJwtVerifierClient {
  auth: {
    getUser: (token: string) => Promise<{ data: { user: any } | null; error: any }>;
  };
}

export function isProductionAuthRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env.NODE_ENV === 'production' ||
    Boolean(env.VERCEL) ||
    env.ENVIRONMENT === 'production'
  );
}

/**
 * Verifies a Supabase Bearer JWT strictly via supabase.auth.getUser(token).
 * NEVER decodes unverified JWT payload claims under any circumstance.
 */
export async function verifySupabaseBearerJwt(
  token: string,
  supabaseClient: SupabaseJwtVerifierClient | null | undefined
): Promise<{ verified: boolean; user: any | null }> {
  const cleanToken = typeof token === 'string' ? token.trim() : '';
  if (!cleanToken || !supabaseClient) {
    return { verified: false, user: null };
  }
  try {
    const { data, error } = await supabaseClient.auth.getUser(cleanToken);
    if (!error && data?.user) {
      return { verified: true, user: data.user };
    }
  } catch (err) {
    console.warn('[AUTH] Supabase token verification failed:', err);
  }
  return { verified: false, user: null };
}

export function isPublicAuthExemptPath(rawPath: string): boolean {
  const cleanPath = String(rawPath || '').split('?')[0];
  return (
    cleanPath === '/api/health' ||
    cleanPath === '/api/v1/system/runtime-diagnostic' ||
    cleanPath === '/api/auth/google/callback' ||
    cleanPath === '/auth/google/callback' ||
    cleanPath === '/auth/login' ||
    cleanPath === '/api/v1/auth/login' ||
    cleanPath === '/auth/logout' ||
    cleanPath === '/api/v1/auth/logout' ||
    cleanPath === '/auth/signup' ||
    cleanPath === '/api/v1/auth/signup' ||
    cleanPath === '/api/v1/auth/google' ||
    cleanPath === '/api/v1/auth/verify-otp' ||
    cleanPath === '/api/v1/auth/forgot-password' ||
    cleanPath === '/api/v1/auth/reset-password' ||
    cleanPath.startsWith('/api/v1/billing/webhook')
  );
}

export function isValidLocalDevSession(
  session: { userId?: unknown; expiresAt?: unknown } | null | undefined,
  isProduction: boolean = isProductionAuthRuntime()
): session is { userId: string; expiresAt: number } {
  // Never fall back to LocalDB sessions in production
  if (isProduction) {
    return false;
  }
  if (!session || typeof session.userId !== 'string' || !session.userId.trim()) {
    return false;
  }
  // Reject missing, undefined, non-numeric, invalid, or expired expiresAt; never auto-extend
  if (typeof session.expiresAt !== 'number' || !Number.isFinite(session.expiresAt)) {
    return false;
  }
  return session.expiresAt > Date.now();
}

/**
 * Resolves the authenticated user without EVER decoding unverified JWT claims.
 * Routes cannot bypass verified authentication middleware: once authMiddlewareExecuted
 * is set, only middleware-authenticated requests resolve.
 * Production NEVER falls back to LocalDB sessions.
 */
export function resolveAuthenticatedUser(
  req: any,
  getSessionByToken: (token: string) => { userId: string; expiresAt?: unknown } | null | undefined,
  getUserById: (id: string) => WorkspaceUser | undefined
): WorkspaceUser | null {
  if (!req || req.authVerificationFailed) {
    return null;
  }

  if (req.authenticatedUser) {
    const freshUser = getUserById(req.authenticatedUser.id);
    if (freshUser) {
      if (req.authVerifiedVia === 'supabase') {
        req.authenticatedUser = {
          ...freshUser,
          role: req.authenticatedUser.role || freshUser.role,
          organizationId: req.authenticatedUser.organizationId || freshUser.organizationId,
          isFounder: req.authenticatedUser.isFounder
        };
      } else {
        req.authenticatedUser = freshUser;
      }
    }
    return req.authenticatedUser;
  }

  // Prevent routes from bypassing verified authentication middleware
  if (req.authMiddlewareExecuted) {
    return null;
  }

  // Fallback for direct helper usage without Express middleware:
  // Disabled in production; rejects JWTs; strictly validates finite unexpired expiresAt without mutating it.
  if (isProductionAuthRuntime()) {
    return null;
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();
    if (!token || token.split('.').length === 3) {
      return null;
    }
    const session = getSessionByToken(token);
    if (isValidLocalDevSession(session, false)) {
      const user = getUserById(session.userId);
      if (user) {
        req.authVerifiedVia = 'local_session';
        req.authenticatedUser = user;
        return user;
      }
    }
  }

  return null;
}

const DISALLOWED_DEFAULT_OAUTH_SECRET = 'salespilot_oauth_secret_default_key_2026';

export function resolveGoogleOAuthStateSecret(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.GOOGLE_OAUTH_STATE_SECRET || env.GOOGLE_CLIENT_SECRET || env.JWT_SECRET || '';
  const cleaned = String(raw).trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned === DISALLOWED_DEFAULT_OAUTH_SECRET) {
    return '';
  }
  return cleaned;
}

export interface SignedGoogleOAuthStatePayload {
  userId: string;
  userEmail?: string;
  organizationId: string;
  source: 'integrations' | 'scheduler';
}

export function signGoogleOAuthState(
  identity: SignedGoogleOAuthStatePayload,
  env: NodeJS.ProcessEnv = process.env
): string {
  const secret = resolveGoogleOAuthStateSecret(env);
  if (!secret || !identity?.userId || !String(identity.userId).trim()) {
    return '';
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = Buffer.from(
    JSON.stringify({
      userId: String(identity.userId).trim(),
      userEmail: identity.userEmail ? String(identity.userEmail).trim().toLowerCase() : '',
      organizationId: identity.organizationId ? String(identity.organizationId).trim() : '',
      source: identity.source === 'integrations' ? 'integrations' : 'scheduler',
      nonce,
      issuedAt: Date.now()
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export const GOOGLE_OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

export interface OAuthNonceConsumeInput {
  nonce: string;
  userId: string;
  organizationId?: string;
  expiresAtMs: number;
}

export interface OAuthNonceConsumeResult {
  consumed: boolean;
  reason?: 'REPLAY' | 'UNAVAILABLE';
  error?: string;
}

export interface OAuthNonceStore {
  consumeNonce: (input: OAuthNonceConsumeInput) => Promise<OAuthNonceConsumeResult>;
  cleanupExpiredNonces?: (nowMs?: number) => Promise<number>;
}

export function isUniqueViolationError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '').trim();
  const msg = String(error.message || error.details || '').toLowerCase();
  return (
    code === '23505' ||
    msg.includes('duplicate key') ||
    msg.includes('unique constraint') ||
    msg.includes('already exists')
  );
}

/**
 * Persistent PostgreSQL/Supabase-backed single-use nonce store.
 * Relies on a UNIQUE / PRIMARY KEY constraint on public.oauth_nonces.nonce
 * so concurrent callbacks across serverless instances race atomically.
 */
export function createSupabaseOAuthNonceStore(
  supabaseClient: { from: (table: string) => any } | null | undefined
): OAuthNonceStore {
  return {
    async consumeNonce({ nonce, userId, organizationId, expiresAtMs }): Promise<OAuthNonceConsumeResult> {
      if (!supabaseClient) {
        return {
          consumed: false,
          reason: 'UNAVAILABLE',
          error: 'Supabase client is unavailable for OAuth nonce verification.'
        };
      }

      const cleanNonce = typeof nonce === 'string' ? nonce.trim() : '';
      const cleanUserId = typeof userId === 'string' ? userId.trim() : '';
      if (!cleanNonce || !cleanUserId || !Number.isFinite(expiresAtMs)) {
        return {
          consumed: false,
          reason: 'UNAVAILABLE',
          error: 'Invalid OAuth nonce persistence payload.'
        };
      }

      const expiresAtIso = new Date(expiresAtMs).toISOString();
      try {
        const { error } = await supabaseClient
          .from('oauth_nonces')
          .insert({
            nonce: cleanNonce,
            user_id: cleanUserId,
            organization_id: organizationId ? String(organizationId).trim() : null,
            expires_at: expiresAtIso
          });

        if (error) {
          if (isUniqueViolationError(error)) {
            return { consumed: false, reason: 'REPLAY' };
          }
          return {
            consumed: false,
            reason: 'UNAVAILABLE',
            error: error.message || String(error)
          };
        }

        // Safely clean up only expired nonce records without affecting active records
        await this.cleanupExpiredNonces?.(Date.now());
        return { consumed: true };
      } catch (err: any) {
        return {
          consumed: false,
          reason: 'UNAVAILABLE',
          error: err?.message || String(err)
        };
      }
    },

    async cleanupExpiredNonces(nowMs: number = Date.now()): Promise<number> {
      if (!supabaseClient) return 0;
      const cutoffIso = new Date(nowMs).toISOString();
      try {
        const deleteQuery = supabaseClient
          .from('oauth_nonces')
          .delete()
          .lt('expires_at', cutoffIso);
        const result =
          typeof deleteQuery?.select === 'function'
            ? await deleteQuery.select('nonce')
            : await deleteQuery;
        if (result?.error) {
          console.warn('[OAUTH SECURITY] Failed to clean up expired OAuth nonces:', result.error.message || result.error);
          return 0;
        }
        return Array.isArray(result?.data) ? result.data.length : 0;
      } catch (err: any) {
        console.warn('[OAUTH SECURITY] Exception cleaning up expired OAuth nonces:', err?.message || err);
        return 0;
      }
    }
  };
}

export async function verifyGoogleOAuthState(
  state: unknown,
  nonceStore: OAuthNonceStore | null | undefined,
  env: NodeJS.ProcessEnv = process.env
): Promise<{ userId: string; userEmail?: string; organizationId?: string; source: 'integrations' | 'scheduler' } | null> {
  const secret = resolveGoogleOAuthStateSecret(env);
  if (typeof state !== 'string' || !secret) {
    return null;
  }

  const parts = state.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [payload, signature] = parts;
  if (!payload || !signature) {
    return null;
  }

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }

  if (
    !parsed ||
    typeof parsed.userId !== 'string' ||
    !parsed.userId.trim() ||
    typeof parsed.issuedAt !== 'number' ||
    !Number.isFinite(parsed.issuedAt)
  ) {
    return null;
  }

  // State expiry check: 15 minutes window (and disallow future-dated issuedAt beyond 60s clock skew)
  const ageMs = Date.now() - parsed.issuedAt;
  if (ageMs < -60_000 || ageMs > GOOGLE_OAUTH_STATE_TTL_MS) {
    return null;
  }

  // Mandatory nonce validation
  if (typeof parsed.nonce !== 'string' || parsed.nonce.trim().length < 16) {
    return null;
  }

  // Persistent, atomic single-use nonce consumption (fails closed if unavailable)
  if (!nonceStore || typeof nonceStore.consumeNonce !== 'function') {
    if (isProductionAuthRuntime(env)) {
      console.error('[OAUTH SECURITY] Persistent OAuth nonce store missing in production. Failing closed.');
    }
    return null;
  }

  const cleanNonce = parsed.nonce.trim();
  const cleanUserId = parsed.userId.trim();
  const cleanOrgId = parsed.organizationId ? String(parsed.organizationId).trim() : undefined;
  const expiresAtMs = parsed.issuedAt + GOOGLE_OAUTH_STATE_TTL_MS;

  const consumeResult = await nonceStore.consumeNonce({
    nonce: cleanNonce,
    userId: cleanUserId,
    organizationId: cleanOrgId,
    expiresAtMs
  });

  if (!consumeResult.consumed) {
    if (consumeResult.reason === 'REPLAY') {
      console.warn(`[OAUTH SECURITY] Replay detected for nonce ${cleanNonce}. Rejecting.`);
    } else {
      console.error(
        `[OAUTH SECURITY] Persistent OAuth nonce check unavailable (${consumeResult.error || 'unknown error'}). Failing closed.`
      );
    }
    return null;
  }

  return {
    userId: cleanUserId,
    userEmail: parsed.userEmail ? String(parsed.userEmail).trim().toLowerCase() : undefined,
    organizationId: cleanOrgId,
    source: parsed.source === 'integrations' ? 'integrations' : 'scheduler'
  };
}


