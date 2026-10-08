/**
 * Authoritative Verified Founder Allowlist
 * 
 * Rules:
 * 1. ONLY explicit exact-match emails in this allowlist receive automatic Lifetime Enterprise privileges.
 * 2. Organization OWNER role does NOT grant Lifetime Enterprise.
 * 3. Substring matching (e.g. includes('soham') or includes('founder')) is strictly prohibited.
 * 4. Frontend-supplied flags (isFounder, subscriptionStatus) are NEVER trusted for privilege escalation.
 */

export const VERIFIED_FOUNDER_EMAILS: ReadonlySet<string> = new Set<string>(
  [
    'sohamkharat481@gmail.com',
    'soham@gmail.com',
    ...(typeof process !== 'undefined' && process.env?.FOUNDER_EMAIL ? [process.env.FOUNDER_EMAIL] : []),
    ...(typeof process !== 'undefined' && process.env?.FOUNDER_EMAILS ? process.env.FOUNDER_EMAILS.split(',') : [])
  ]
    .map(e => String(e || '').trim().toLowerCase())
    .filter(Boolean)
);

/**
 * Validates whether an email belongs to an authoritative verified platform founder.
 * Strict exact match only.
 */
export function isVerifiedFounderEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return VERIFIED_FOUNDER_EMAILS.has(clean);
}
