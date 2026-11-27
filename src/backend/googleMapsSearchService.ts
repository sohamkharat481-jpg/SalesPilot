import crypto from 'crypto';
import type { Request, Response } from 'express';
import { WorkspaceUser } from '../types';
import { logAuditEvent } from '../security/auditLogger';

export const GOOGLE_MAPS_API_KEY_HEADER = 'x-api-key';
export const GOOGLE_MAPS_SHARED_SECRET_ENV_VAR = 'LINKEDIN_TOOL_MAPS_API_KEY';
export const GOOGLE_MAPS_MIN_SECRET_LENGTH = 16;
export const GOOGLE_MAPS_QUERY_MAX_LENGTH = 120;
export const GOOGLE_MAPS_LOCATION_MAX_LENGTH = 100;
export const GOOGLE_MAPS_DEFAULT_LOCATION = 'Bangalore';
export const GOOGLE_MAPS_RATE_LIMIT_MAX = 30;
export const GOOGLE_MAPS_RATE_LIMIT_WINDOW_MS = 60_000;
export const GOOGLE_MAPS_UPSTREAM_TIMEOUT_MS = 6_000;
export const GOOGLE_MAPS_PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
export const GOOGLE_MAPS_PLACES_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount';

const DISALLOWED_PLACEHOLDER_SECRETS = new Set([
  'changeme',
  'change-me',
  'placeholder',
  'your_api_key',
  'your-api-key',
  'your_secret_here',
  'linkedin_tool_maps_api_key',
  'secret',
  'test-secret',
]);

const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;
const ALLOWED_BODY_KEYS = new Set(['query', 'location']);

export interface GoogleMapsSearchResultItem {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewsCount: number;
  placeId: string;
}

export interface GoogleMapsSearchAuthSuccess {
  authorized: true;
  authMode: 'm2m' | 'user';
  rateLimitKey: string;
  user?: WorkspaceUser;
}

export interface GoogleMapsSearchAuthFailure {
  authorized: false;
  status: 401;
  error: string;
}

export type GoogleMapsSearchAuthResult = GoogleMapsSearchAuthSuccess | GoogleMapsSearchAuthFailure;

export function isStrongSharedSecret(secret: string): boolean {
  const clean = typeof secret === 'string' ? secret.trim() : '';
  if (clean.length < GOOGLE_MAPS_MIN_SECRET_LENGTH) {
    return false;
  }
  if (DISALLOWED_PLACEHOLDER_SECRETS.has(clean.toLowerCase())) {
    return false;
  }
  return true;
}

export function timingSafeSecretMatch(provided: string, expected: string): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') {
    return false;
  }
  const cleanProvided = provided.trim();
  const cleanExpected = expected.trim();
  if (!cleanProvided || !cleanExpected) {
    return false;
  }
  // Hash both values to fixed-size SHA-256 digests to avoid length mismatches and length-leakage
  const providedDigest = crypto.createHash('sha256').update(cleanProvided, 'utf8').digest();
  const expectedDigest = crypto.createHash('sha256').update(cleanExpected, 'utf8').digest();
  return crypto.timingSafeEqual(providedDigest, expectedDigest);
}

export function authorizeGoogleMapsSearchRequest(
  req: Pick<Request, 'headers'>,
  options: {
    getSharedSecret?: () => string;
    getAuthenticatedUser?: (req: any) => WorkspaceUser | null;
  } = {}
): GoogleMapsSearchAuthResult {
  const rawApiKey = req.headers?.[GOOGLE_MAPS_API_KEY_HEADER];

  if (rawApiKey !== undefined) {
    if (typeof rawApiKey !== 'string' || !rawApiKey.trim()) {
      return {
        authorized: false,
        status: 401,
        error: 'Unauthorized. Invalid API key.',
      };
    }

    const configuredSecret = (
      options.getSharedSecret?.() ??
      process.env[GOOGLE_MAPS_SHARED_SECRET_ENV_VAR] ??
      ''
    ).trim();

    if (!isStrongSharedSecret(configuredSecret) || !timingSafeSecretMatch(rawApiKey, configuredSecret)) {
      return {
        authorized: false,
        status: 401,
        error: 'Unauthorized. Invalid API key.',
      };
    }

    return {
      authorized: true,
      authMode: 'm2m',
      rateLimitKey: 'm2m:linkedin-tool',
    };
  }

  const user = options.getAuthenticatedUser ? options.getAuthenticatedUser(req) : null;
  if (user && typeof user.id === 'string' && user.id.trim()) {
    return {
      authorized: true,
      authMode: 'user',
      rateLimitKey: `user:${user.id.trim()}`,
      user,
    };
  }

  return {
    authorized: false,
    status: 401,
    error: 'Unauthorized. Valid authentication credentials are required.',
  };
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtEpochSeconds: number;
  retryAfterSeconds: number;
}

export function createGoogleMapsRateLimiter(options: {
  maxRequests?: number;
  windowMs?: number;
  nowFn?: () => number;
} = {}) {
  const maxRequests = Math.max(1, options.maxRequests ?? GOOGLE_MAPS_RATE_LIMIT_MAX);
  const windowMs = Math.max(1000, options.windowMs ?? GOOGLE_MAPS_RATE_LIMIT_WINDOW_MS);
  const nowFn = options.nowFn ?? (() => Date.now());
  const store = new Map<string, { count: number; resetAt: number }>();

  const pruneExpired = (now: number) => {
    if (store.size < 250) return;
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  };

  return {
    maxRequests,
    windowMs,
    check(rateLimitKey: string): RateLimitCheckResult {
      const now = nowFn();
      pruneExpired(now);

      const safeKey = typeof rateLimitKey === 'string' && rateLimitKey.trim() ? rateLimitKey.trim() : 'anonymous';
      const existing = store.get(safeKey);

      if (!existing || now >= existing.resetAt) {
        const resetAt = now + windowMs;
        store.set(safeKey, { count: 1, resetAt });
        return {
          allowed: true,
          limit: maxRequests,
          remaining: Math.max(0, maxRequests - 1),
          resetAtEpochSeconds: Math.ceil(resetAt / 1000),
          retryAfterSeconds: Math.ceil(windowMs / 1000),
        };
      }

      if (existing.count >= maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
        return {
          allowed: false,
          limit: maxRequests,
          remaining: 0,
          resetAtEpochSeconds: Math.ceil(existing.resetAt / 1000),
          retryAfterSeconds,
        };
      }

      existing.count += 1;
      return {
        allowed: true,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - existing.count),
        resetAtEpochSeconds: Math.ceil(existing.resetAt / 1000),
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    },
    reset() {
      store.clear();
    },
  };
}

export type GoogleMapsBodyValidationResult =
  | { valid: true; query: string; location: string }
  | { valid: false; status: 400; error: string };

export function validateGoogleMapsSearchBody(body: unknown): GoogleMapsBodyValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, status: 400, error: 'Request body must be a JSON object.' };
  }

  const record = body as Record<string, unknown>;
  const unknownKeys = Object.keys(record).filter((k) => !ALLOWED_BODY_KEYS.has(k));
  if (unknownKeys.length > 0) {
    return {
      valid: false,
      status: 400,
      error: `Unsupported request field(s): ${unknownKeys.join(', ')}`,
    };
  }

  if (typeof record.query !== 'string') {
    return { valid: false, status: 400, error: 'Search query is required' };
  }
  if (CONTROL_CHAR_REGEX.test(record.query)) {
    return {
      valid: false,
      status: 400,
      error: 'Search query contains invalid control characters.',
    };
  }
  const cleanQuery = record.query.trim();
  if (!cleanQuery) {
    return { valid: false, status: 400, error: 'Search query is required' };
  }
  if (cleanQuery.length > GOOGLE_MAPS_QUERY_MAX_LENGTH) {
    return {
      valid: false,
      status: 400,
      error: `Search query must not exceed ${GOOGLE_MAPS_QUERY_MAX_LENGTH} characters.`,
    };
  }

  let cleanLocation = GOOGLE_MAPS_DEFAULT_LOCATION;
  if (record.location !== undefined) {
    if (typeof record.location !== 'string') {
      return { valid: false, status: 400, error: 'Location must be a string.' };
    }
    if (CONTROL_CHAR_REGEX.test(record.location)) {
      return {
        valid: false,
        status: 400,
        error: 'Location contains invalid control characters.',
      };
    }
    cleanLocation = record.location.trim();
    if (!cleanLocation) {
      return { valid: false, status: 400, error: 'Location must be a non-empty string when provided.' };
    }
    if (cleanLocation.length > GOOGLE_MAPS_LOCATION_MAX_LENGTH) {
      return {
        valid: false,
        status: 400,
        error: `Location must not exceed ${GOOGLE_MAPS_LOCATION_MAX_LENGTH} characters.`,
      };
    }
  }

  return {
    valid: true,
    query: cleanQuery,
    location: cleanLocation,
  };
}

export function sanitizeUpstreamMapsError(
  rawMessage: unknown,
  secretsToRedact: string[] = []
): string {
  let msg = typeof rawMessage === 'string' ? rawMessage : 'Google Maps upstream search failed.';
  for (const secret of secretsToRedact) {
    const clean = typeof secret === 'string' ? secret.trim() : '';
    if (clean.length >= 6) {
      msg = msg.split(clean).join('[REDACTED]');
    }
  }
  msg = msg
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [REDACTED]');
  return msg.trim() || 'Google Maps upstream search failed.';
}

export function mapGooglePlacesToResults(places: unknown): GoogleMapsSearchResultItem[] {
  if (!Array.isArray(places)) {
    return [];
  }
  return places.map((p: any) => ({
    name:
      typeof p?.displayName?.text === 'string'
        ? p.displayName.text
        : typeof p?.displayName === 'string'
          ? p.displayName
          : '',
    address: typeof p?.formattedAddress === 'string' ? p.formattedAddress : '',
    phone: typeof p?.nationalPhoneNumber === 'string' ? p.nationalPhoneNumber : '',
    website: typeof p?.websiteUri === 'string' ? p.websiteUri : '',
    rating: typeof p?.rating === 'number' && Number.isFinite(p.rating) ? p.rating : 0,
    reviewsCount:
      typeof p?.userRatingCount === 'number' && Number.isFinite(p.userRatingCount)
        ? p.userRatingCount
        : 0,
    placeId: typeof p?.id === 'string' ? p.id : '',
  }));
}

export interface GoogleMapsSearchHandlerDeps {
  getGoogleMapsApiKey: () => string;
  getSharedSecret?: () => string;
  getAuthenticatedUser?: (req: any) => WorkspaceUser | null;
  rateLimiter?: ReturnType<typeof createGoogleMapsRateLimiter>;
  fetchFn?: typeof fetch;
  onSearchSuccess?: (meta: { authMode: 'm2m' | 'user'; resultCount: number }) => void;
}

export function createGoogleMapsSearchHandler(deps: GoogleMapsSearchHandlerDeps) {
  const limiter = deps.rateLimiter ?? createGoogleMapsRateLimiter();
  const fetchImpl = deps.fetchFn ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));

  return async (req: Request, res: Response) => {
    const sharedSecret = (
      deps.getSharedSecret?.() ??
      process.env[GOOGLE_MAPS_SHARED_SECRET_ENV_VAR] ??
      ''
    ).trim();

    const auth = authorizeGoogleMapsSearchRequest(req, {
      getSharedSecret: () => sharedSecret,
      getAuthenticatedUser: deps.getAuthenticatedUser,
    });

    if (auth.authorized !== true) {
      const authFailure = auth as GoogleMapsSearchAuthFailure;
      try {
        logAuditEvent(req, 'GOOGLE_MAPS_SEARCH_AUTH', 'MAPS_API', 'DENIED', undefined, {
          hasApiKeyHeader: req.headers?.[GOOGLE_MAPS_API_KEY_HEADER] !== undefined,
        });
      } catch (_) {}
      return res.status(authFailure.status).json({
        success: false,
        error: authFailure.error,
      });
    }

    const rateCheck = limiter.check(auth.rateLimitKey);
    res.setHeader('X-RateLimit-Limit', String(rateCheck.limit));
    res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
    res.setHeader('X-RateLimit-Reset', String(rateCheck.resetAtEpochSeconds));

    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      try {
        logAuditEvent(req, 'GOOGLE_MAPS_SEARCH_RATE_LIMIT', 'MAPS_API', 'DENIED', auth.user, {
          authMode: auth.authMode,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        });
      } catch (_) {}
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making additional Google Maps search requests.',
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const validation = validateGoogleMapsSearchBody(req.body);
    if (validation.valid !== true) {
      const validationError = validation as { valid: false; status: 400; error: string };
      return res.status(validationError.status).json({
        success: false,
        error: validationError.error,
      });
    }

    const gmapsKey = (deps.getGoogleMapsApiKey() || '').trim();
    if (!gmapsKey) {
      return res.status(503).json({
        success: false,
        error: 'Google Maps Places service is not configured.',
      });
    }

    try {
      const apiRes = await fetchImpl(GOOGLE_MAPS_PLACES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': gmapsKey,
          'X-Goog-FieldMask': GOOGLE_MAPS_PLACES_FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: `${validation.query} in ${validation.location}`,
        }),
        signal: AbortSignal.timeout(GOOGLE_MAPS_UPSTREAM_TIMEOUT_MS),
      });

      let data: any = null;
      try {
        data = await apiRes.json();
      } catch (_) {
        data = null;
      }

      if (!apiRes.ok) {
        // Never relay Google 401/403 directly as caller auth errors or expose API keys
        const mappedStatus =
          apiRes.status === 429 || apiRes.status === 503
            ? 503
            : apiRes.status === 504 || apiRes.status === 408
              ? 504
              : 502;
        const safeUpstreamMsg =
          apiRes.status === 401 || apiRes.status === 403
            ? 'Google Maps upstream authentication or billing error.'
            : apiRes.status === 429
              ? 'Google Maps upstream quota exceeded. Please try again later.'
              : sanitizeUpstreamMapsError(
                  data?.error?.message || `Google Places upstream HTTP ${apiRes.status}`,
                  [gmapsKey, sharedSecret]
                );

        return res.status(mappedStatus).json({
          success: false,
          error: safeUpstreamMsg,
        });
      }

      const results = mapGooglePlacesToResults(data?.places);
      deps.onSearchSuccess?.({
        authMode: auth.authMode,
        resultCount: results.length,
      });

      try {
        logAuditEvent(req, 'GOOGLE_MAPS_SEARCH', 'MAPS_API', 'SUCCESS', auth.user, {
          authMode: auth.authMode,
          queryLength: validation.query.length,
          locationLength: validation.location.length,
          resultCount: results.length,
        });
      } catch (_) {}

      return res.json({
        success: true,
        results,
      });
    } catch (err: any) {
      const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      const safeErr = sanitizeUpstreamMapsError(err?.message, [gmapsKey, sharedSecret]);
      return res.status(isTimeout ? 504 : 502).json({
        success: false,
        error: isTimeout
          ? 'Google Maps upstream request timed out.'
          : safeErr || 'Google Maps search failed.',
      });
    }
  };
}
