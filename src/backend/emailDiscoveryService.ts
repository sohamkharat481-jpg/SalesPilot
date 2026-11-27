import dns from 'dns';
import net from 'net';
import { Lead } from '../types';

export type EmailVerificationStatus =
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'RISKY'
  | 'INVALID'
  | 'EMAIL_NOT_FOUND';

export type ProviderConnectionStatus =
  | 'CONNECTED'
  | 'UNCONFIGURED'
  | 'ERROR'
  | 'RATE_LIMITED';

export type EmailDiscoveryProviderId =
  | 'google-maps'
  | 'apollo'
  | 'peopledatalabs'
  | 'clearbit'
  | 'hunter'
  | 'google-search'
  | 'website-crawler'
  | 'crunchbase';

export interface ProviderDiagnosticEntry {
  providerId: EmailDiscoveryProviderId;
  providerName: string;
  configured: boolean;
  connectionStatus: ProviderConnectionStatus;
  leadsProcessed: number;
  emailsDiscovered: number;
  verifiedEmails: number;
  unverifiedEmails: number;
  errors: string[];
  lastError: string | null;
  lastStatusCode: number | null;
  rateLimitRemaining: string | null;
  lastSuccessfulRequest: string | null;
  lastAttemptAt: string | null;
}

export interface EmailDiscoveryResult {
  email: string;
  emailStatus: EmailVerificationStatus;
  emailSource: string;
  verificationProvider?: string;
  emailVerifiedAt?: string;
  discoveredEmails: Array<{
    email: string;
    source: string;
    status: EmailVerificationStatus;
    pageUrl?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
  }>;
  contactFirstName?: string;
  contactLastName?: string;
  contactTitle?: string;
  officialWebsite?: string;
  officialDomain?: string;
  diagnostics: string[];
}

export const ALL_PROVIDER_METADATA: Array<{
  id: EmailDiscoveryProviderId;
  name: string;
  requiresKey: boolean;
}> = [
  { id: 'google-maps', name: 'Google Maps Local Scraper', requiresKey: true },
  { id: 'apollo', name: 'Apollo.io', requiresKey: true },
  { id: 'peopledatalabs', name: 'People Data Labs (PDL)', requiresKey: true },
  { id: 'clearbit', name: 'Clearbit', requiresKey: true },
  { id: 'hunter', name: 'Hunter.io', requiresKey: true },
  { id: 'google-search', name: 'Google Search / Serper', requiresKey: true },
  { id: 'website-crawler', name: 'Website Email Crawler', requiresKey: false },
  { id: 'crunchbase', name: 'Crunchbase', requiresKey: true },
];

export class ProviderDiagnosticsTracker {
  private entries: Map<EmailDiscoveryProviderId, ProviderDiagnosticEntry> = new Map();

  constructor(configuredMap?: Partial<Record<EmailDiscoveryProviderId, boolean>>) {
    for (const meta of ALL_PROVIDER_METADATA) {
      const isConfigured = meta.requiresKey
        ? Boolean(configuredMap?.[meta.id])
        : true;
      this.entries.set(meta.id, {
        providerId: meta.id,
        providerName: meta.name,
        configured: isConfigured,
        connectionStatus: isConfigured ? 'CONNECTED' : 'UNCONFIGURED',
        leadsProcessed: 0,
        emailsDiscovered: 0,
        verifiedEmails: 0,
        unverifiedEmails: 0,
        errors: [],
        lastError: null,
        lastStatusCode: null,
        rateLimitRemaining: null,
        lastSuccessfulRequest: null,
        lastAttemptAt: null,
      });
    }
  }

  public syncConfiguredStates(
    configuredMap: Partial<Record<EmailDiscoveryProviderId, boolean>>
  ): void {
    for (const meta of ALL_PROVIDER_METADATA) {
      const entry = this.entries.get(meta.id);
      if (!entry) continue;
      const isConfigured = meta.requiresKey
        ? Boolean(configuredMap[meta.id])
        : true;
      entry.configured = isConfigured;
      if (!isConfigured && entry.connectionStatus !== 'ERROR' && entry.connectionStatus !== 'RATE_LIMITED') {
        entry.connectionStatus = 'UNCONFIGURED';
      } else if (isConfigured && entry.connectionStatus === 'UNCONFIGURED') {
        entry.connectionStatus = 'CONNECTED';
      }
    }
  }

  public recordAttempt(
    providerId: EmailDiscoveryProviderId,
    opts: {
      leadsProcessedDelta?: number;
      emailsDiscoveredDelta?: number;
      verifiedDelta?: number;
      unverifiedDelta?: number;
      statusCode?: number | null;
      rateLimitRemaining?: string | null;
      error?: string | null;
      rateLimited?: boolean;
      success?: boolean;
    }
  ): void {
    const entry = this.entries.get(providerId);
    if (!entry) return;
    const now = new Date().toISOString();
    entry.lastAttemptAt = now;

    if (opts.leadsProcessedDelta) entry.leadsProcessed += opts.leadsProcessedDelta;
    if (opts.emailsDiscoveredDelta) entry.emailsDiscovered += opts.emailsDiscoveredDelta;
    if (opts.verifiedDelta) entry.verifiedEmails += opts.verifiedDelta;
    if (opts.unverifiedDelta) entry.unverifiedEmails += opts.unverifiedDelta;
    if (opts.statusCode !== undefined) entry.lastStatusCode = opts.statusCode;
    if (opts.rateLimitRemaining !== undefined && opts.rateLimitRemaining !== null) {
      entry.rateLimitRemaining = opts.rateLimitRemaining;
    }

    if (opts.rateLimited || opts.statusCode === 429) {
      entry.connectionStatus = 'RATE_LIMITED';
      const msg = opts.error || `Rate limited by ${entry.providerName} (HTTP 429)`;
      entry.lastError = msg;
      if (!entry.errors.includes(msg)) {
        entry.errors = [msg, ...entry.errors].slice(0, 10);
      }
    } else if (opts.error) {
      entry.connectionStatus = entry.configured ? 'ERROR' : 'UNCONFIGURED';
      entry.lastError = opts.error;
      if (!entry.errors.includes(opts.error)) {
        entry.errors = [opts.error, ...entry.errors].slice(0, 10);
      }
    } else if (opts.success) {
      entry.connectionStatus = 'CONNECTED';
      entry.lastSuccessfulRequest = now;
    }
  }

  public getSnapshot(): ProviderDiagnosticEntry[] {
    return ALL_PROVIDER_METADATA.map((m) => ({
      ...this.entries.get(m.id)!,
      errors: [...(this.entries.get(m.id)?.errors || [])],
    }));
  }

  public mergeFrom(other: ProviderDiagnosticsTracker): void {
    for (const otherEntry of other.getSnapshot()) {
      const target = this.entries.get(otherEntry.providerId);
      if (!target) continue;
      target.configured = otherEntry.configured;
      target.leadsProcessed += otherEntry.leadsProcessed;
      target.emailsDiscovered += otherEntry.emailsDiscovered;
      target.verifiedEmails += otherEntry.verifiedEmails;
      target.unverifiedEmails += otherEntry.unverifiedEmails;
      if (otherEntry.lastAttemptAt) target.lastAttemptAt = otherEntry.lastAttemptAt;
      if (otherEntry.lastSuccessfulRequest) {
        target.lastSuccessfulRequest = otherEntry.lastSuccessfulRequest;
      }
      if (otherEntry.lastStatusCode !== null) {
        target.lastStatusCode = otherEntry.lastStatusCode;
      }
      if (otherEntry.rateLimitRemaining !== null) {
        target.rateLimitRemaining = otherEntry.rateLimitRemaining;
      }
      if (otherEntry.lastError) {
        target.lastError = otherEntry.lastError;
      }
      for (const e of otherEntry.errors) {
        if (!target.errors.includes(e)) {
          target.errors = [e, ...target.errors].slice(0, 10);
        }
      }
      if (otherEntry.connectionStatus === 'RATE_LIMITED') {
        target.connectionStatus = 'RATE_LIMITED';
      } else if (otherEntry.connectionStatus === 'ERROR' && !otherEntry.lastSuccessfulRequest) {
        target.connectionStatus = 'ERROR';
      } else if (otherEntry.lastSuccessfulRequest) {
        target.connectionStatus = 'CONNECTED';
      } else if (!target.configured) {
        target.connectionStatus = 'UNCONFIGURED';
      }
    }
  }
}

export const globalProviderDiagnostics = new ProviderDiagnosticsTracker();

// Domains representing directories, maps, aggregators, or social profiles (NOT the company's own email domain)
const DIRECTORY_OR_SOCIAL_DOMAINS = new Set<string>([
  'google.com',
  'maps.google.com',
  'goo.gl',
  'maps.app.goo.gl',
  'linkedin.com',
  'facebook.com',
  'fb.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'youtu.be',
  'yelp.com',
  'justdial.com',
  'indiamart.com',
  'sulekha.com',
  'tradeindia.com',
  'yellowpages.com',
  'crunchbase.com',
  'zoominfo.com',
  'glassdoor.com',
  'trustpilot.com',
  'wikipedia.org',
  'tripadvisor.com',
  'linktr.ee',
  'whatsapp.com',
  'wa.me',
  'bit.ly',
  't.co',
  'apple.com',
  'play.google.com',
]);

// Third-party template/infrastructure/tracking domains that appear in page source or footers
const IGNORED_INFRA_EMAIL_DOMAINS = new Set<string>([
  'example.com',
  'example.org',
  'example.net',
  'domain.com',
  'email.com',
  'yoursite.com',
  'yourdomain.com',
  'company.com',
  'test.com',
  'placeholder.com',
  'sentry.io',
  'ingest.sentry.io',
  'wixpress.com',
  'wix.com',
  'squarespace.com',
  'wordpress.org',
  'wordpress.com',
  'w3.org',
  'schema.org',
  'cloudflare.com',
  'amazonaws.com',
  'googleusercontent.com',
  'gstatic.com',
  'googleapis.com',
  'godaddy.com',
  'shopify.com',
  'hubspot.com',
  'hsforms.com',
  'mailchimp.com',
  'typeform.com',
  'intercom.io',
  'zendesk.com',
  'freshdesk.com',
  'tawk.to',
  'crisp.chat',
  'gravatar.com',
  'fontawesome.com',
  'jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'jquery.com',
]);

const FREE_WEBMAIL_DOMAINS = new Set<string>([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'protonmail.com',
  'proton.me',
  'rediffmail.com',
  'zoho.com',
  'aol.com',
  'yandex.com',
]);

const DISPOSABLE_DOMAINS = new Set<string>([
  'tempmail.com',
  'mailinator.com',
  'yopmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'trashmail.com',
]);

const BLOCKED_LOCAL_PARTS = new Set<string>([
  'noreply',
  'no-reply',
  'donotreply',
  'do-not-reply',
  'mailer-daemon',
  'postmaster',
  'bounce',
  'bounces',
  'abuse',
  'root',
  'daemon',
  'example',
  'user',
  'name',
  'someone',
  'yourname',
  'youremail',
  'email',
]);

const ASSET_EXTENSION_REGEX =
  /\.(png|jpe?g|gif|svg|webp|ico|bmp|tiff|css|js|mjs|cjs|jsx|tsx|ts|map|woff2?|ttf|eot|otf|pdf|zip|gz|tar|mp4|mp3|wav|avi|mov|xml|json)$/i;

export function isDirectoryOrSocialDomain(hostnameOrUrl: string): boolean {
  const domain = extractNormalizedDomain(hostnameOrUrl, { allowDirectories: true });
  if (!domain) return true;
  if (DIRECTORY_OR_SOCIAL_DOMAINS.has(domain)) return true;
  for (const dirDom of DIRECTORY_OR_SOCIAL_DOMAINS) {
    if (domain.endsWith(`.${dirDom}`)) return true;
  }
  return false;
}

export function extractNormalizedDomain(
  input: string | null | undefined,
  options?: { allowDirectories?: boolean }
): string {
  if (!input || typeof input !== 'string') return '';
  let trimmed = input.trim().toLowerCase();
  if (!trimmed) return '';

  // Handle plain email input cleanly
  if (trimmed.includes('@') && !trimmed.includes('://') && !trimmed.includes('/')) {
    trimmed = trimmed.split('@').pop() || '';
  }

  // Reject whitespace phrases like "Software in Bengaluru"
  if (/\s/.test(trimmed)) return '';

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    let host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
    if (!host || !host.includes('.') || host.includes(' ')) return '';
    if (!/^[a-z0-9.-]+$/.test(host)) return '';

    if (!options?.allowDirectories) {
      if (DIRECTORY_OR_SOCIAL_DOMAINS.has(host)) return '';
      for (const dirDom of DIRECTORY_OR_SOCIAL_DOMAINS) {
        if (host.endsWith(`.${dirDom}`)) return '';
      }
    }
    return host;
  } catch {
    return '';
  }
}

export function getRegistrableRoot(domain: string): string {
  const clean = domain.toLowerCase().replace(/^www\./, '').trim();
  const parts = clean.split('.').filter(Boolean);
  if (parts.length <= 2) return clean;
  // Handle common 2-level ccTLDs (.co.in, .co.uk, .com.au, .org.in, .net.in, .co.jp)
  const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  const multiTlds = new Set([
    'co.in', 'org.in', 'net.in', 'ac.in', 'gov.in', 'firm.in',
    'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
    'com.au', 'net.au', 'org.au',
    'co.jp', 'co.nz', 'com.sg', 'com.br', 'com.mx',
  ]);
  if (multiTlds.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export function isPrivateOrReservedIp(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, '').toLowerCase();
  if (clean === '::1' || clean === '::') return true;
  if (clean.startsWith('::ffff:')) {
    const v4Part = clean.slice(7);
    if (net.isIPv4(v4Part)) return isPrivateOrReservedIp(v4Part);
  }
  if (net.isIPv6(clean)) {
    // Link-local fe80::/10, ULA fc00::/7
    if (/^fe[89ab][0-9a-f]:/i.test(clean)) return true;
    if (/^f[cd][0-9a-f]{2}:/i.test(clean)) return true;
    return false;
  }
  if (!net.isIPv4(clean)) return false;

  const octets = clean.split('.').map(Number);
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
    return true;
  }
  const [a, b] = octets;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast/reserved
  return false;
}

export async function isSafePublicUrl(
  rawUrl: string,
  options?: { skipDnsCheck?: boolean }
): Promise<{ safe: boolean; reason?: string; normalizedUrl?: string; hostname?: string }> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, reason: 'Empty URL' };
  }
  let target = rawUrl.trim();
  if (!/^https?:\/\//i.test(target)) {
    if (/^[a-z0-9+.-]+:/i.test(target)) {
      return { safe: false, reason: 'Unsupported URL scheme' };
    }
    target = `https://${target}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: `Blocked protocol: ${parsed.protocol}` };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.arpa')
  ) {
    return { safe: false, reason: `Blocked internal hostname: ${host}` };
  }

  if (net.isIP(host) && isPrivateOrReservedIp(host)) {
    return { safe: false, reason: `Blocked private or reserved IP address: ${host}` };
  }

  if (!options?.skipDnsCheck && !net.isIP(host)) {
    try {
      const addresses = await dns.promises.lookup(host, { all: true });
      for (const addr of addresses) {
        if (isPrivateOrReservedIp(addr.address)) {
          return {
            safe: false,
            reason: `Hostname ${host} resolves to private/reserved IP (${addr.address})`,
          };
        }
      }
    } catch {
      // Allow fetch to fail normally or resolve via custom test fetch stubs
    }
  }

  return { safe: true, normalizedUrl: parsed.toString(), hostname: host };
}

export async function safeFetchHtml(
  rawUrl: string,
  options?: {
    timeoutMs?: number;
    maxRedirects?: number;
    maxBytes?: number;
    skipDnsCheck?: boolean;
  }
): Promise<{
  ok: boolean;
  status: number;
  finalUrl: string;
  html: string;
  error?: string;
}> {
  const timeoutMs = options?.timeoutMs ?? 6000;
  const maxRedirects = options?.maxRedirects ?? 4;
  const maxBytes = options?.maxBytes ?? 1_500_000;

  let currentUrl = rawUrl;
  let redirects = 0;

  while (redirects <= maxRedirects) {
    const check = await isSafePublicUrl(currentUrl, { skipDnsCheck: options?.skipDnsCheck });
    if (!check.safe || !check.normalizedUrl) {
      return {
        ok: false,
        status: 0,
        finalUrl: currentUrl,
        html: '',
        error: check.reason || 'Unsafe target URL',
      };
    }

    currentUrl = check.normalizedUrl;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          return {
            ok: false,
            status: response.status,
            finalUrl: currentUrl,
            html: '',
            error: `HTTP ${response.status} redirect without Location header`,
          };
        }
        const nextUrl = new URL(location, currentUrl).toString();
        const redirectCheck = await isSafePublicUrl(nextUrl, {
          skipDnsCheck: options?.skipDnsCheck,
        });
        if (!redirectCheck.safe) {
          return {
            ok: false,
            status: response.status,
            finalUrl: nextUrl,
            html: '',
            error: `Blocked unsafe redirect: ${redirectCheck.reason}`,
          };
        }
        currentUrl = nextUrl;
        redirects++;
        continue;
      }

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          finalUrl: currentUrl,
          html: '',
          error: `HTTP ${response.status}`,
        };
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (
        contentType &&
        !contentType.includes('text/') &&
        !contentType.includes('html') &&
        !contentType.includes('xml') &&
        !contentType.includes('json')
      ) {
        return {
          ok: false,
          status: response.status,
          finalUrl: currentUrl,
          html: '',
          error: `Non-HTML content-type: ${contentType}`,
        };
      }

      const text = await response.text();
      const bounded = text.length > maxBytes ? text.slice(0, maxBytes) : text;
      return {
        ok: true,
        status: response.status,
        finalUrl: currentUrl,
        html: bounded,
      };
    } catch (err: any) {
      clearTimeout(timer);
      return {
        ok: false,
        status: 0,
        finalUrl: currentUrl,
        html: '',
        error: err?.name === 'AbortError' ? 'Request timed out' : err?.message || String(err),
      };
    }
  }

  return {
    ok: false,
    status: 0,
    finalUrl: currentUrl,
    html: '',
    error: 'Too many redirects',
  };
}

export function normalizeEmailCandidate(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.trim();

  // Strip mailto: and query string
  cleaned = cleaned.replace(/^mailto:/i, '').split('?')[0].split('#')[0];
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // keep raw cleaned if malformed URI
  }

  cleaned = cleaned
    .trim()
    .toLowerCase()
    .replace(/^[<("'`\s.,;:]+/, '')
    .replace(/[>)"'`\s.,;:!?]+$/, '');

  // Strip stray prefix characters or JSON-escaped unicode prefixes (e.g. u003e)
  cleaned = cleaned.replace(/^(?:u003[ce])+/i, '').replace(/^[^a-z0-9]+/, '');

  if (!cleaned || cleaned.length > 254) return null;
  if (ASSET_EXTENSION_REGEX.test(cleaned)) return null;

  const emailRegex = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
  if (!emailRegex.test(cleaned)) return null;

  const [localPart, domain] = cleaned.split('@');
  if (!localPart || !domain) return null;
  if (localPart.includes('..') || domain.includes('..')) return null;
  // Reject long pure-hex local parts (typically Sentry/telemetry IDs, never human contacts)
  if (/^[a-f0-9]{20,}$/i.test(localPart)) return null;

  const tld = domain.split('.').pop() || '';
  if (tld.length < 2 || /^\d+$/.test(tld)) return null;

  if (BLOCKED_LOCAL_PARTS.has(localPart)) return null;
  if (localPart.startsWith('noreply') || localPart.startsWith('no-reply')) return null;

  if (IGNORED_INFRA_EMAIL_DOMAINS.has(domain) || DISPOSABLE_DOMAINS.has(domain)) {
    return null;
  }
  const rootDomain = getRegistrableRoot(domain);
  if (IGNORED_INFRA_EMAIL_DOMAINS.has(rootDomain) || DISPOSABLE_DOMAINS.has(rootDomain)) {
    return null;
  }

  return cleaned;
}

/**
 * Decodes Cloudflare's XOR-obfuscated email strings from `data-cfemail="..."`
 * or `/cdn-cgi/l/email-protection#...`.
 */
export function decodeCloudflareEmail(hex: string): string | null {
  if (!hex || typeof hex !== 'string') return null;
  const cleanHex = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6,}$/.test(cleanHex) || cleanHex.length % 2 !== 0) {
    return null;
  }
  const key = parseInt(cleanHex.slice(0, 2), 16);
  if (Number.isNaN(key)) return null;
  let decoded = '';
  for (let i = 2; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return null;
    decoded += String.fromCharCode(byte ^ key);
  }
  return normalizeEmailCandidate(decoded);
}

export interface ExtractedHtmlEmail {
  email: string;
  via: 'mailto' | 'jsonld' | 'cfemail' | 'text' | 'obfuscated';
}

export function extractEmailsFromHtml(html: string): ExtractedHtmlEmail[] {
  if (!html || typeof html !== 'string') return [];
  const foundMap = new Map<string, ExtractedHtmlEmail>();

  const add = (candidate: string | null, via: ExtractedHtmlEmail['via']) => {
    if (!candidate) return;
    if (!foundMap.has(candidate)) {
      foundMap.set(candidate, { email: candidate, via });
    }
  };

  // Decode basic HTML entities & common JS/JSON unicode escapes used to obfuscate addresses
  const decoded = html
    .replace(/&#0*64;|&#x0*40;|&commat;|\\u0040|\\x40/gi, '@')
    .replace(/&#0*46;|&#x0*2e;|&period;/gi, '.')
    .replace(/\\u003c|&lt;/gi, '<')
    .replace(/\\u003e|&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');

  // 1. Extract mailto: links (highest confidence)
  const mailtoRegex = /href\s*=\s*["']\s*mailto:([^"'>\s]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = mailtoRegex.exec(decoded)) !== null) {
    add(normalizeEmailCandidate(match[1]), 'mailto');
  }

  // 2. Decode Cloudflare data-cfemail attributes and /cdn-cgi/l/email-protection#... links
  const cfAttrRegex = /data-cfemail\s*=\s*["']([0-9a-fA-F]{6,})["']/gi;
  while ((match = cfAttrRegex.exec(decoded)) !== null) {
    add(decodeCloudflareEmail(match[1]), 'cfemail');
  }
  const cfHrefRegex = /\/cdn-cgi\/l\/email-protection(?:#|%23)([0-9a-fA-F]{6,})/gi;
  while ((match = cfHrefRegex.exec(decoded)) !== null) {
    add(decodeCloudflareEmail(match[1]), 'cfemail');
  }

  // 3. Extract JSON-LD & Next.js/structured JSON script business emails
  const jsonScriptRegex = /<script[^>]+(?:type=["']application\/(?:ld\+json|json)["']|id=["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonScriptRegex.exec(decoded)) !== null) {
    const rawJson = match[1];
    const jsonEmailMatches = rawJson.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const je of jsonEmailMatches) {
      add(normalizeEmailCandidate(je), 'jsonld');
    }
  }

  // 4. Extract explicit data-email / data-mail attributes
  const dataEmailRegex = /data-(?:email|mail)\s*=\s*["']([^"']+)["']/gi;
  while ((match = dataEmailRegex.exec(decoded)) !== null) {
    add(normalizeEmailCandidate(match[1]), 'mailto');
  }

  // 5. Strip non-visible <script>, <style>, <svg>, <noscript> and tags
  const visibleText = decoded
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

  // 6. Standard visible email pattern
  const standardRegex = /\b[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,253}\.[a-zA-Z]{2,24}\b/g;
  const textMatches = visibleText.match(standardRegex) || [];
  for (const rawEmail of textMatches) {
    add(normalizeEmailCandidate(rawEmail), 'text');
  }

  // 7. Obfuscated visible email patterns: e.g. info [at] company [dot] com
  const obfuscatedRegex =
    /\b([a-zA-Z0-9._%+-]{1,64})\s*(?:\[at\]|\(at\)|\s+at\s+)\s*([a-zA-Z0-9.-]{1,120})\s*(?:\[dot\]|\(dot\)|\s+dot\s+)\s*([a-zA-Z]{2,12}(?:\s*(?:\[dot\]|\(dot\)|\.)\s*[a-zA-Z]{2,12})?)\b/gi;
  while ((match = obfuscatedRegex.exec(visibleText)) !== null) {
    const domainTail = match[3].replace(/\s*(?:\[dot\]|\(dot\))\s*/gi, '.').replace(/\s+/g, '');
    const reconstructed = `${match[1]}@${match[2]}.${domainTail}`.replace(/\.\.+/g, '.');
    add(normalizeEmailCandidate(reconstructed), 'obfuscated');
  }

  return Array.from(foundMap.values());
}

export function extractContactLinksFromHtml(
  html: string,
  baseUrl: string,
  maxLinks = 10
): string[] {
  const candidates: Array<{ url: string; priority: number }> = [];
  const seen = new Set<string>();

  let parsedBase: URL;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    return [];
  }
  const baseRoot = getRegistrableRoot(parsedBase.hostname);

  const linkRegex = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(html)) !== null) {
    const href = (m[1] || '').trim();
    const anchorText = (m[2] || '').replace(/<[^>]+>/g, ' ').toLowerCase();
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }

    try {
      const resolved = new URL(href, parsedBase);
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') continue;
      if (getRegistrableRoot(resolved.hostname) !== baseRoot) continue;
      if (ASSET_EXTENSION_REGEX.test(resolved.pathname)) continue;

      const combined = `${resolved.pathname.toLowerCase()} ${anchorText}`;
      const pathLower = resolved.pathname.toLowerCase();
      let priority = 0;
      if (/contact-us|contactus|\/contact\b|contact-sales|get-in-touch|reach-us/.test(combined)) {
        priority = 5;
      } else if (/privacy-policy|\/privacy\b|grievance|imprint|impressum/.test(combined)) {
        priority = 4;
      } else if (/\/support\b|\/help\b|customer-care/.test(combined)) {
        priority = 4;
      } else if (/\/(about|about-us|team|leadership|company)\/?$/.test(pathLower)) {
        priority = 3;
      } else if (/terms|legal/.test(combined)) {
        priority = 2;
      } else if (/\/about|support|connect|inquiry|enquiry/.test(combined) && !/awards|press-releases|news|blog|careers|events/.test(pathLower)) {
        priority = 1;
      }
      if (priority > 0) {
        resolved.hash = '';
        const normalized = resolved.toString();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          candidates.push({ url: normalized, priority });
        }
      }
    } catch {
      // ignore invalid relative URL
    }
  }

  // Add standard fallback contact/about/support/legal paths if not already discovered
  const fallbackPaths: Array<{ path: string; priority: number }> = [
    { path: '/contact', priority: 5 },
    { path: '/contact-us', priority: 5 },
    { path: '/support', priority: 4 },
    { path: '/privacy-policy', priority: 4 },
    { path: '/privacy', priority: 4 },
    { path: '/.well-known/security.txt', priority: 3 },
    { path: '/about', priority: 2 },
    { path: '/about-us', priority: 2 },
    { path: '/terms', priority: 2 },
  ];
  for (const fp of fallbackPaths) {
    const u = `${parsedBase.origin}${fp.path}`;
    if (!seen.has(u)) {
      seen.add(u);
      candidates.push({ url: u, priority: fp.priority });
    }
  }

  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxLinks)
    .map((c) => c.url);
}

/**
 * Verifies whether a discovered email belongs to the target business or contact.
 * Prevents leaking unrelated third-party agency or directory emails onto leads.
 */
export function isEmailRelevantToBusiness(
  email: string,
  officialDomain: string,
  companyName?: string,
  options?: { fromOfficialWebsite?: boolean }
): boolean {
  const normalized = normalizeEmailCandidate(email);
  if (!normalized) return false;

  const emailDomain = normalized.split('@')[1];
  const emailRoot = getRegistrableRoot(emailDomain);
  const officialRoot = officialDomain ? getRegistrableRoot(officialDomain) : '';

  if (DIRECTORY_OR_SOCIAL_DOMAINS.has(emailRoot)) {
    return false;
  }

  if (officialRoot && emailRoot === officialRoot) {
    return true;
  }

  // Free webmail (e.g. gmail.com / outlook.com) is ONLY accepted if found directly on the business's verified official website
  if (FREE_WEBMAIL_DOMAINS.has(emailDomain) || FREE_WEBMAIL_DOMAINS.has(emailRoot)) {
    return Boolean(options?.fromOfficialWebsite);
  }

  // Check if the email domain shares a clear brand token with the business name or official root label
  // (e.g., official site acme-dental.in, email care@acmedental.com)
  const cleanCompanyTokens = (companyName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !['india', 'private', 'limited', 'solutions', 'services', 'technologies', 'group', 'global'].includes(t));

  const emailBrandLabel = emailRoot.split('.')[0].replace(/[^a-z0-9]/g, '');
  const officialBrandLabel = officialRoot.split('.')[0].replace(/[^a-z0-9]/g, '');

  if (officialBrandLabel && emailBrandLabel === officialBrandLabel) {
    return true;
  }

  if (!officialRoot && cleanCompanyTokens.some((tok) => emailBrandLabel.includes(tok))) {
    return true;
  }

  return false;
}

const LOW_PRIORITY_COMPLIANCE_LOCAL_REGEX =
  /^(privacy|legal|dmca|security|compliance|dpo|grievance|grievances|grievanceofficercs|nodal-officer|datarequest)$/i;

export function rankEmailPriority(
  email: string,
  officialDomain: string,
  via?: ExtractedHtmlEmail['via']
): number {
  const domain = email.split('@')[1] || '';
  const local = email.split('@')[0] || '';
  const isDomainMatch =
    officialDomain && getRegistrableRoot(domain) === getRegistrableRoot(officialDomain);
  let score = 0;

  if (isDomainMatch) score += 100;
  if (via === 'mailto') score += 30;
  else if (via === 'cfemail') score += 28;
  else if (via === 'jsonld') score += 25;
  else if (via === 'text') score += 15;
  else if (via === 'obfuscated') score += 10;

  // Prefer named corporate contacts over generic role addresses when domain matches,
  // and sales/info/contact/hello over privacy/legal/dpo/security
  if (/^(hello|contact|info|sales|support|team|enquiries|enquiry|office|admin|care|reservations)$/.test(local)) {
    score += 12;
  } else if (/^[a-z]+\.[a-z]+$/.test(local)) {
    score += 18;
  } else if (LOW_PRIORITY_COMPLIANCE_LOCAL_REGEX.test(local)) {
    score -= 10;
  }

  return score;
}

export async function crawlWebsiteForEmails(
  websiteUrl: string,
  options?: {
    companyName?: string;
    maxPages?: number;
    timeoutMs?: number;
    skipDnsCheck?: boolean;
  }
): Promise<{
  emails: Array<{ email: string; via: ExtractedHtmlEmail['via']; pageUrl: string }>;
  pagesCrawled: number;
  finalWebsiteUrl: string;
  domain: string;
  errors: string[];
}> {
  const maxPages = options?.maxPages ?? 10;
  const timeoutMs = options?.timeoutMs ?? 6000;
  const errors: string[] = [];

  if (!websiteUrl) {
    return { emails: [], pagesCrawled: 0, finalWebsiteUrl: '', domain: '', errors: ['Missing URL'] };
  }

  let normalizedStart = websiteUrl.trim();
  if (!/^https?:\/\//i.test(normalizedStart)) {
    normalizedStart = `https://${normalizedStart}`;
  }

  const domain = extractNormalizedDomain(normalizedStart);
  if (!domain) {
    return {
      emails: [],
      pagesCrawled: 0,
      finalWebsiteUrl: normalizedStart,
      domain: '',
      errors: ['URL is a directory, social profile, or invalid domain'],
    };
  }

  let homeRes = await safeFetchHtml(normalizedStart, {
    timeoutMs,
    skipDnsCheck: options?.skipDnsCheck,
  });

  if (!homeRes.ok && normalizedStart.startsWith('https://')) {
    const httpFallback = normalizedStart.replace(/^https:\/\//i, 'http://');
    const retryRes = await safeFetchHtml(httpFallback, {
      timeoutMs,
      skipDnsCheck: options?.skipDnsCheck,
    });
    if (retryRes.ok) {
      homeRes = retryRes;
    }
  }

  const collectedMap = new Map<
    string,
    { email: string; via: ExtractedHtmlEmail['via']; pageUrl: string }
  >();
  let pagesCrawled = 0;

  // Determine effective finalUrl/domain even if homepage returned HTTP 403/503 (e.g. WAF blocking `/` while `/contact` or `/privacy` returns 200)
  const effectiveFinalUrl = homeRes.finalUrl || normalizedStart;
  const finalDomain = extractNormalizedDomain(effectiveFinalUrl) || domain;

  if (!homeRes.ok && homeRes.error) {
    errors.push(`Homepage (${normalizedStart}): ${homeRes.error}`);
  }
  // Only abort completely on SSRF blocks or invalid URL; still attempt /contact and /privacy on HTTP 403/5xx/timeouts
  if (!homeRes.ok && homeRes.status === 0 && /Unsafe|Blocked|Invalid URL|Too many redirects/i.test(homeRes.error || '')) {
    return {
      emails: [],
      pagesCrawled: 0,
      finalWebsiteUrl: effectiveFinalUrl,
      domain,
      errors,
    };
  }

  const ingestHtml = (html: string, pageUrl: string) => {
    const rawExtracted = extractEmailsFromHtml(html);
    for (const item of rawExtracted) {
      if (
        isEmailRelevantToBusiness(item.email, finalDomain, options?.companyName, {
          fromOfficialWebsite: true,
        })
      ) {
        if (!collectedMap.has(item.email)) {
          collectedMap.set(item.email, { email: item.email, via: item.via, pageUrl });
        }
      }
    }
  };

  if (homeRes.ok) {
    pagesCrawled++;
    ingestHtml(homeRes.html, effectiveFinalUrl);
  }

  const totalSubBudget = Math.max(0, maxPages - (homeRes.ok ? 1 : 0));
  const subLinks = extractContactLinksFromHtml(
    homeRes.ok ? homeRes.html : '',
    effectiveFinalUrl,
    Math.max(totalSubBudget, 12)
  ).filter((u) => u !== effectiveFinalUrl);

  const hasPrimaryContactEmail = () =>
    Array.from(collectedMap.values()).some(
      (entry) => !LOW_PRIORITY_COMPLIANCE_LOCAL_REGEX.test(entry.email.split('@')[0] || '')
    );

  // Wave 1: crawl top 4 contact/support/about links first (saving privacy/legal for Wave 2 if needed)
  const isComplianceOrSecurityPath = (u: string) =>
    /privacy|security\.txt|terms|legal|grievance|imprint|impressum|tnc/i.test(u);
  const nonComplianceLinks = subLinks.filter((u) => !isComplianceOrSecurityPath(u));
  const complianceLinks = subLinks.filter((u) => isComplianceOrSecurityPath(u));

  const wave1 = (nonComplianceLinks.length > 0 ? nonComplianceLinks : subLinks).slice(
    0,
    Math.min(4, totalSubBudget)
  );
  const wave1Set = new Set(wave1);

  if (wave1.length > 0) {
    const wave1Results = await Promise.all(
      wave1.map((subUrl) =>
        safeFetchHtml(subUrl, {
          timeoutMs,
          skipDnsCheck: options?.skipDnsCheck,
        })
      )
    );
    for (const subRes of wave1Results) {
      if (!subRes.ok) continue;
      pagesCrawled++;
      ingestHtml(subRes.html, subRes.finalUrl);
    }
  }

  // Wave 2: if no primary contact email found yet, crawl compliance/privacy/security.txt + remaining links within budget
  const remainingBudget = Math.max(0, totalSubBudget - wave1.length);
  const wave2 = [...complianceLinks, ...nonComplianceLinks]
    .filter((u) => !wave1Set.has(u))
    .slice(0, remainingBudget);
  if (wave2.length > 0 && !hasPrimaryContactEmail()) {
    const wave2Results = await Promise.all(
      wave2.map((subUrl) =>
        safeFetchHtml(subUrl, {
          timeoutMs,
          skipDnsCheck: options?.skipDnsCheck,
        })
      )
    );
    for (const subRes of wave2Results) {
      if (!subRes.ok) continue;
      pagesCrawled++;
      ingestHtml(subRes.html, subRes.finalUrl);
    }
  }

  const sortedEmails = Array.from(collectedMap.values()).sort(
    (a, b) =>
      rankEmailPriority(b.email, finalDomain, b.via) -
      rankEmailPriority(a.email, finalDomain, a.via)
  );

  return {
    emails: sortedEmails,
    pagesCrawled,
    finalWebsiteUrl: effectiveFinalUrl,
    domain: finalDomain,
    errors,
  };
}

export async function checkDomainMxRecords(
  domain: string
): Promise<'HAS_MX' | 'NO_MX' | 'UNKNOWN'> {
  if (!domain) return 'UNKNOWN';
  try {
    const records = await dns.promises.resolveMx(domain);
    if (records && records.length > 0) return 'HAS_MX';
    return 'NO_MX';
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      // Double check via Cloudflare DoH before returning NO_MX
      try {
        const dohRes = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
          {
            headers: { accept: 'application/dns-json' },
            signal: AbortSignal.timeout(3000),
          }
        );
        if (dohRes.ok) {
          const dohJson = (await dohRes.json()) as any;
          if (Array.isArray(dohJson.Answer) && dohJson.Answer.length > 0) {
            return 'HAS_MX';
          }
          if (dohJson.Status === 3 || dohJson.Status === 0) {
            return 'NO_MX';
          }
        }
        return 'UNKNOWN';
      } catch {
        return 'UNKNOWN';
      }
    }
    return 'UNKNOWN';
  }
}

export async function verifyDiscoveredEmail(
  email: string,
  options?: {
    hunterApiKey?: string | null;
    providerVerified?: boolean;
    skipNetworkMx?: boolean;
    diagnostics?: ProviderDiagnosticsTracker;
  }
): Promise<{
  status: EmailVerificationStatus;
  verificationProvider: string;
  mxStatus: 'HAS_MX' | 'NO_MX' | 'UNKNOWN';
}> {
  const normalized = normalizeEmailCandidate(email);
  if (!normalized) {
    return { status: 'INVALID', verificationProvider: 'SYNTAX_GUARD', mxStatus: 'UNKNOWN' };
  }

  const domain = normalized.split('@')[1];
  const mxStatus = options?.skipNetworkMx
    ? 'UNKNOWN'
    : await checkDomainMxRecords(domain);

  if (mxStatus === 'NO_MX') {
    return { status: 'INVALID', verificationProvider: 'DNS_MX', mxStatus };
  }

  // If Hunter API key is configured, run real SMTP/deliverability verification
  const hunterKey = options?.hunterApiKey || process.env.HUNTER_API_KEY;
  if (hunterKey) {
    try {
      const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(
        normalized
      )}&api_key=${encodeURIComponent(hunterKey)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
      const rlRem = res.headers.get('x-ratelimit-remaining');
      if (res.ok) {
        const data = (await res.json()) as any;
        const hunterStatus = data?.data?.status;
        options?.diagnostics?.recordAttempt('hunter', {
          statusCode: res.status,
          rateLimitRemaining: rlRem,
          success: true,
        });
        if (hunterStatus === 'valid') {
          return { status: 'VERIFIED', verificationProvider: 'HUNTER_VERIFIER', mxStatus };
        }
        if (hunterStatus === 'invalid' || hunterStatus === 'disposable') {
          return { status: 'INVALID', verificationProvider: 'HUNTER_VERIFIER', mxStatus };
        }
        if (hunterStatus === 'accept_all') {
          return { status: 'RISKY', verificationProvider: 'HUNTER_VERIFIER', mxStatus };
        }
        return { status: 'UNVERIFIED', verificationProvider: 'HUNTER_VERIFIER', mxStatus };
      } else {
        const errBody = await res.text().catch(() => '');
        options?.diagnostics?.recordAttempt('hunter', {
          statusCode: res.status,
          rateLimitRemaining: rlRem,
          rateLimited: res.status === 429,
          error: `Hunter Verifier HTTP ${res.status}: ${errBody.slice(0, 140)}`,
        });
      }
    } catch (err: any) {
      options?.diagnostics?.recordAttempt('hunter', {
        error: `Hunter Verifier error: ${err?.message || String(err)}`,
      });
    }
  }

  if (options?.providerVerified) {
    return { status: 'VERIFIED', verificationProvider: 'PROVIDER_VERIFIED', mxStatus };
  }

  // Strictly NEVER mark unverified website/search emails as VERIFIED
  return {
    status: 'UNVERIFIED',
    verificationProvider: mxStatus === 'HAS_MX' ? 'DNS_MX_ONLY' : 'UNVERIFIED_SOURCE',
    mxStatus,
  };
}

export async function discoverAndVerifyLeadEmail(params: {
  company: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  existingEmail?: string;
  existingEmailSource?: string;
  existingEmailVerified?: boolean;
  keys?: {
    hunterKey?: string | null;
    apolloKey?: string | null;
    pdlKey?: string | null;
    clearbitKey?: string | null;
    serperKey?: string | null;
  };
  diagnostics?: ProviderDiagnosticsTracker;
  skipNetworkMx?: boolean;
  skipDnsCheck?: boolean;
}): Promise<EmailDiscoveryResult> {
  const diagnosticsLogs: string[] = [];
  const discoveredEmails: EmailDiscoveryResult['discoveredEmails'] = [];
  const tracker = params.diagnostics;

  let officialWebsite = (params.website || '').trim();
  let officialDomain = extractNormalizedDomain(officialWebsite);

  // Step 1: If website is missing or a directory/Maps URL, try finding official website via Serper if key present
  if (!officialDomain && params.keys?.serperKey && params.company) {
    try {
      const q = `"${params.company}" official website`;
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': params.keys.serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q, num: 4 }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const organic = data.organic || [];
        for (const item of organic) {
          const dom = extractNormalizedDomain(item.link || '');
          if (dom) {
            officialWebsite = item.link;
            officialDomain = dom;
            tracker?.recordAttempt('google-search', { statusCode: res.status, success: true });
            diagnosticsLogs.push(`[SERPER] Resolved official website: ${officialWebsite}`);
            break;
          }
        }
      } else {
        tracker?.recordAttempt('google-search', {
          statusCode: res.status,
          rateLimited: res.status === 429,
          error: `Serper website lookup HTTP ${res.status}`,
        });
      }
    } catch (err: any) {
      tracker?.recordAttempt('google-search', {
        error: `Serper website lookup failed: ${err?.message || String(err)}`,
      });
    }
  }

  let bestContactFirstName = params.firstName || '';
  let bestContactLastName = params.lastName || '';
  let bestContactTitle = '';

  const considerCandidate = async (
    rawEmail: string,
    source: string,
    opts?: {
      pageUrl?: string;
      fromOfficialWebsite?: boolean;
      providerVerified?: boolean;
      firstName?: string;
      lastName?: string;
      title?: string;
    }
  ) => {
    const clean = normalizeEmailCandidate(rawEmail);
    if (!clean) return;
    if (
      !isEmailRelevantToBusiness(clean, officialDomain, params.company, {
        fromOfficialWebsite: opts?.fromOfficialWebsite,
      })
    ) {
      diagnosticsLogs.push(
        `[ACCURACY GUARD] Rejected unrelated or unverified webmail "${clean}" from ${source} (expected domain: ${officialDomain || 'N/A'})`
      );
      return;
    }

    if (discoveredEmails.some((d) => d.email === clean)) return;

    const verification = await verifyDiscoveredEmail(clean, {
      hunterApiKey: params.keys?.hunterKey,
      providerVerified: opts?.providerVerified,
      skipNetworkMx: params.skipNetworkMx,
      diagnostics: tracker,
    });

    if (verification.status === 'INVALID') {
      diagnosticsLogs.push(
        `[VERIFICATION] Discarded invalid email "${clean}" (${verification.verificationProvider})`
      );
      return;
    }

    discoveredEmails.push({
      email: clean,
      source,
      status: verification.status,
      pageUrl: opts?.pageUrl,
      firstName: opts?.firstName,
      lastName: opts?.lastName,
      title: opts?.title,
    });

    if (!bestContactFirstName && opts?.firstName) bestContactFirstName = opts.firstName;
    if (!bestContactLastName && opts?.lastName) bestContactLastName = opts.lastName;
    if (!bestContactTitle && opts?.title) bestContactTitle = opts.title;
  };

  // Step 2: Inspect existing email returned by primary provider (e.g., Apollo / PDL / Hunter)
  if (params.existingEmail) {
    await considerCandidate(
      params.existingEmail,
      params.existingEmailSource || 'PRIMARY_PROVIDER',
      {
        fromOfficialWebsite: false,
        providerVerified: params.existingEmailVerified,
      }
    );
  }

  // Step 3: Website Email Crawler (Homepage + /contact + /about + /support + /privacy + security.txt)
  if (officialWebsite && officialDomain) {
    tracker?.recordAttempt('website-crawler', { leadsProcessedDelta: 1 });
    const crawlRes = await crawlWebsiteForEmails(officialWebsite, {
      companyName: params.company,
      maxPages: 10,
      timeoutMs: 6000,
      skipDnsCheck: params.skipDnsCheck,
    });
    if (crawlRes.pagesCrawled > 0) {
      tracker?.recordAttempt('website-crawler', { statusCode: 200, success: true });
      diagnosticsLogs.push(
        `[WEBSITE_CRAWLER] Crawled ${crawlRes.pagesCrawled} page(s) on ${crawlRes.domain}, found ${crawlRes.emails.length} candidate(s).`
      );
      for (const found of crawlRes.emails.slice(0, 5)) {
        await considerCandidate(found.email, 'WEBSITE_CRAWLER', {
          pageUrl: found.pageUrl,
          fromOfficialWebsite: true,
        });
      }
      const crawlerDiscovered = discoveredEmails.filter((d) => d.source === 'WEBSITE_CRAWLER');
      if (crawlerDiscovered.length > 0) {
        tracker?.recordAttempt('website-crawler', {
          emailsDiscoveredDelta: 1,
          verifiedDelta: crawlerDiscovered.some((d) => d.status === 'VERIFIED') ? 1 : 0,
          unverifiedDelta: crawlerDiscovered.some((d) => d.status !== 'VERIFIED') ? 1 : 0,
        });
      }
    } else if (crawlRes.errors.length > 0) {
      tracker?.recordAttempt('website-crawler', {
        error: crawlRes.errors[0],
      });
      diagnosticsLogs.push(`[WEBSITE_CRAWLER] ${crawlRes.errors[0]}`);
    }
  }

  // Step 4: Hunter.io Domain Search (if not yet VERIFIED and key configured)
  const hasVerified = () => discoveredEmails.some((d) => d.status === 'VERIFIED');
  if (!hasVerified() && officialDomain && params.keys?.hunterKey) {
    tracker?.recordAttempt('hunter', { leadsProcessedDelta: 1 });
    try {
      const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(
        officialDomain
      )}&api_key=${encodeURIComponent(params.keys.hunterKey)}&limit=5`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
      const rlRem = res.headers.get('x-ratelimit-remaining');
      if (res.ok) {
        const data = (await res.json()) as any;
        const emailsList = data?.data?.emails || [];
        tracker?.recordAttempt('hunter', {
          statusCode: res.status,
          rateLimitRemaining: rlRem,
          success: true,
        });
        let hunterFoundCount = 0;
        let hunterVerifiedCount = 0;
        for (const item of emailsList) {
          if (!item?.value) continue;
          const isValid = item.verification?.status === 'valid';
          await considerCandidate(item.value, 'HUNTER', {
            providerVerified: isValid,
            firstName: item.first_name,
            lastName: item.last_name,
            title: item.position,
          });
          hunterFoundCount++;
          if (isValid) hunterVerifiedCount++;
        }
        if (hunterFoundCount > 0) {
          tracker?.recordAttempt('hunter', {
            emailsDiscoveredDelta: 1,
            verifiedDelta: hunterVerifiedCount > 0 ? 1 : 0,
            unverifiedDelta: hunterVerifiedCount === 0 ? 1 : 0,
          });
        }
        diagnosticsLogs.push(`[HUNTER] Domain search on ${officialDomain} returned ${emailsList.length} email(s).`);
      } else {
        const errText = await res.text().catch(() => '');
        tracker?.recordAttempt('hunter', {
          statusCode: res.status,
          rateLimitRemaining: rlRem,
          rateLimited: res.status === 429,
          error: `Hunter Domain Search HTTP ${res.status}: ${errText.slice(0, 140)}`,
        });
        diagnosticsLogs.push(`[HUNTER] HTTP ${res.status}`);
      }
    } catch (err: any) {
      tracker?.recordAttempt('hunter', {
        error: `Hunter exception: ${err?.message || String(err)}`,
      });
    }
  }

  // Step 5: Apollo.io People/Company Enrichment
  if (discoveredEmails.length === 0 && officialDomain && params.keys?.apolloKey) {
    tracker?.recordAttempt('apollo', { leadsProcessedDelta: 1 });
    try {
      const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': params.keys.apolloKey,
        },
        body: JSON.stringify({
          q_organization_domains_list: [officialDomain],
          per_page: 3,
          page: 1,
        }),
        signal: AbortSignal.timeout(5000),
      });
      const rlRem = res.headers.get('x-ratelimit-remaining');
      if (res.ok) {
        const data = (await res.json()) as any;
        const people = data?.people || [];
        tracker?.recordAttempt('apollo', {
          statusCode: res.status,
          rateLimitRemaining: rlRem,
          success: true,
        });
        let apolloFound = 0;
        let apolloVerified = 0;
        for (const person of people) {
          let email = person.email;
          let emailStatusRaw = person.email_status;
          // If api_search omits email, try people/match with person id if contact has_email
          if (!email && person.id && person.has_email) {
            try {
              const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Api-Key': params.keys.apolloKey,
                },
                body: JSON.stringify({ id: person.id, reveal_personal_emails: false }),
                signal: AbortSignal.timeout(4500),
              });
              if (matchRes.ok) {
                const matchData = (await matchRes.json()) as any;
                email = matchData?.person?.email;
                emailStatusRaw = matchData?.person?.email_status || emailStatusRaw;
              }
            } catch {
              // ignore individual match failure
            }
          }
          if (email) {
            const isVerified = emailStatusRaw === 'verified';
            await considerCandidate(email, 'APOLLO', {
              providerVerified: isVerified,
              firstName: person.first_name,
              lastName: person.last_name,
              title: person.title,
            });
            apolloFound++;
            if (isVerified) apolloVerified++;
          }
        }
        if (apolloFound > 0) {
          tracker?.recordAttempt('apollo', {
            emailsDiscoveredDelta: 1,
            verifiedDelta: apolloVerified > 0 ? 1 : 0,
            unverifiedDelta: apolloVerified === 0 ? 1 : 0,
          });
        }
        diagnosticsLogs.push(`[APOLLO] Found ${apolloFound} email(s) for ${officialDomain}.`);
      } else {
        const errText = await res.text().catch(() => '');
        tracker?.recordAttempt('apollo', {
          statusCode: res.status,
          rateLimitRemaining: rlRem,
          rateLimited: res.status === 429,
          error: `Apollo HTTP ${res.status}: ${errText.slice(0, 140)}`,
        });
        diagnosticsLogs.push(`[APOLLO] HTTP ${res.status}`);
      }
    } catch (err: any) {
      tracker?.recordAttempt('apollo', {
        error: `Apollo exception: ${err?.message || String(err)}`,
      });
    }
  }

  // Step 6: People Data Labs (PDL) Company Person Lookup
  if (discoveredEmails.length === 0 && officialDomain && params.keys?.pdlKey) {
    tracker?.recordAttempt('peopledatalabs', { leadsProcessedDelta: 1 });
    try {
      const res = await fetch('https://api.peopledatalabs.com/v5/person/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': params.keys.pdlKey,
        },
        body: JSON.stringify({
          query: {
            bool: {
              must: [{ term: { job_company_website: officialDomain } }],
            },
          },
          size: 3,
        }),
        signal: AbortSignal.timeout(5000),
      });
      const rlRem = res.headers.get('x-ratelimit-remaining');
      if (res.ok) {
        const data = (await res.json()) as any;
        const records = data?.data || [];
        tracker?.recordAttempt('peopledatalabs', {
          statusCode: res.status,
          rateLimitRemaining: rlRem,
          success: true,
        });
        let pdlFound = 0;
        for (const rec of records) {
          const email = rec.work_email || rec.emails?.[0]?.address;
          if (email) {
            await considerCandidate(email, 'PDL', {
              firstName: rec.first_name,
              lastName: rec.last_name,
              title: rec.job_title,
            });
            pdlFound++;
          }
        }
        if (pdlFound > 0) {
          tracker?.recordAttempt('peopledatalabs', {
            emailsDiscoveredDelta: 1,
            unverifiedDelta: 1,
          });
        }
        diagnosticsLogs.push(`[PDL] Returned ${records.length} record(s), ${pdlFound} email(s).`);
      } else {
        const errText = await res.text().catch(() => '');
        tracker?.recordAttempt('peopledatalabs', {
          statusCode: res.status,
          rateLimitRemaining: rlRem,
          rateLimited: res.status === 429,
          error: `PDL HTTP ${res.status}: ${errText.slice(0, 140)}`,
        });
      }
    } catch (err: any) {
      tracker?.recordAttempt('peopledatalabs', {
        error: `PDL exception: ${err?.message || String(err)}`,
      });
    }
  }

  // Step 7: Clearbit Prospector Lookup (GET query params)
  if (discoveredEmails.length === 0 && officialDomain && params.keys?.clearbitKey) {
    tracker?.recordAttempt('clearbit', { leadsProcessedDelta: 1 });
    try {
      const url = `https://prospector.clearbit.com/v1/people/search?domain=${encodeURIComponent(
        officialDomain
      )}&limit=3`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${params.keys.clearbitKey}`,
        },
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const records = (await res.json()) as any;
        const list = Array.isArray(records) ? records : records?.results || [];
        tracker?.recordAttempt('clearbit', { statusCode: res.status, success: true });
        let cbFound = 0;
        for (const rec of list) {
          if (rec?.email) {
            await considerCandidate(rec.email, 'CLEARBIT', {
              firstName: rec.name?.givenName,
              lastName: rec.name?.familyName,
              title: rec.title,
            });
            cbFound++;
          }
        }
        if (cbFound > 0) {
          tracker?.recordAttempt('clearbit', {
            emailsDiscoveredDelta: 1,
            unverifiedDelta: 1,
          });
        }
      } else {
        const errText = await res.text().catch(() => '');
        tracker?.recordAttempt('clearbit', {
          statusCode: res.status,
          rateLimited: res.status === 429,
          error: `Clearbit HTTP ${res.status}: ${errText.slice(0, 140)}`,
        });
      }
    } catch (err: any) {
      tracker?.recordAttempt('clearbit', {
        error: `Clearbit exception: ${err?.message || String(err)}`,
      });
    }
  }

  // Step 8: Google Search / Serper public email search (site:domain "@" OR email OR contact)
  if (discoveredEmails.length === 0 && officialDomain && params.keys?.serperKey) {
    tracker?.recordAttempt('google-search', { leadsProcessedDelta: 1 });
    try {
      const q = `site:${officialDomain} ("@${officialDomain}" OR email OR contact)`;
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': params.keys.serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q, num: 5 }),
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const organic = data?.organic || [];
        tracker?.recordAttempt('google-search', { statusCode: res.status, success: true });
        let serperFound = 0;
        for (const item of organic) {
          const textBlob = `${item.title || ''} ${item.snippet || ''}`;
          const matches =
            textBlob.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
          for (const rawEmail of matches) {
            await considerCandidate(rawEmail, 'GOOGLE_SEARCH_SERPER', {
              pageUrl: item.link,
            });
            serperFound++;
          }
        }
        if (serperFound > 0) {
          tracker?.recordAttempt('google-search', {
            emailsDiscoveredDelta: 1,
            unverifiedDelta: 1,
          });
        }
        diagnosticsLogs.push(`[SERPER] Email search on ${officialDomain} extracted ${serperFound} candidate(s).`);
      } else {
        const errText = await res.text().catch(() => '');
        tracker?.recordAttempt('google-search', {
          statusCode: res.status,
          rateLimited: res.status === 429,
          error: `Serper HTTP ${res.status}: ${errText.slice(0, 140)}`,
        });
      }
    } catch (err: any) {
      tracker?.recordAttempt('google-search', {
        error: `Serper exception: ${err?.message || String(err)}`,
      });
    }
  }

  // Choose highest-ranked discovered email (VERIFIED > UNVERIFIED > RISKY, domain-match prioritized)
  if (discoveredEmails.length === 0) {
    return {
      email: '',
      emailStatus: 'EMAIL_NOT_FOUND',
      emailSource: 'NONE',
      discoveredEmails: [],
      contactFirstName: bestContactFirstName || undefined,
      contactLastName: bestContactLastName || undefined,
      contactTitle: bestContactTitle || undefined,
      officialWebsite: officialWebsite || undefined,
      officialDomain: officialDomain || undefined,
      diagnostics: diagnosticsLogs,
    };
  }

  const statusRank: Record<EmailVerificationStatus, number> = {
    VERIFIED: 4,
    UNVERIFIED: 3,
    RISKY: 2,
    EMAIL_NOT_FOUND: 1,
    INVALID: 0,
  };

  const sorted = [...discoveredEmails].sort((a, b) => {
    const sDiff = statusRank[b.status] - statusRank[a.status];
    if (sDiff !== 0) return sDiff;
    return rankEmailPriority(b.email, officialDomain) - rankEmailPriority(a.email, officialDomain);
  });

  const best = sorted[0];

  return {
    email: best.email,
    emailStatus: best.status,
    emailSource: best.source,
    verificationProvider:
      best.status === 'VERIFIED'
        ? params.keys?.hunterKey
          ? 'HUNTER_VERIFIER'
          : best.source
        : best.source,
    emailVerifiedAt: best.status === 'VERIFIED' ? new Date().toISOString() : undefined,
    discoveredEmails: sorted,
    contactFirstName: best.firstName || bestContactFirstName || undefined,
    contactLastName: best.lastName || bestContactLastName || undefined,
    contactTitle: best.title || bestContactTitle || undefined,
    officialWebsite: officialWebsite || undefined,
    officialDomain: officialDomain || undefined,
    diagnostics: diagnosticsLogs,
  };
}
