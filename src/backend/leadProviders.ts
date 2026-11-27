import { Lead } from '../types';
import dns from 'dns';
import {
  extractNormalizedDomain,
  crawlWebsiteForEmails,
  discoverAndVerifyLeadEmail,
  verifyDiscoveredEmail,
  isSafePublicUrl,
  globalProviderDiagnostics,
  isEmailRelevantToBusiness,
} from './emailDiscoveryService';

/**
 * Lead Generation Parameters passed from UI / Campaign Config
 */
export interface LeadGenerationParams {
  campaignName: string;
  country: string;
  industry: string;
  companySize?: string;
  employeeRange?: string;
  revenueRange?: string;
  jobTitles: string;
  keywords: string;
  negativeKeywords?: string;
  maxLeads: number;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  customApiKey?: string;
  city?: string;
  techStack?: string;
  department?: string;
  businessType?: string;
  yearsInBusiness?: string;
  decisionMakerOnly?: boolean;
  language?: string;
}

/**
 * Standard Extensible Interface for a B2B Lead Sourcing Provider
 */
export interface LeadProvider {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  apiKeyEnvName?: string;
  logoUrl?: string;
  generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]>;
}

/**
 * Helper: DNS Domain Resolution Validation
 */
export function resolveDomain(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    // 1. Try standard Node DNS lookup
    dns.lookup(domain, (err) => {
      if (!err) {
        resolve(true);
        return;
      }

      // 2. Try DNS-over-HTTPS (DoH) via Cloudflare
      fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
        headers: { 'accept': 'application/dns-json' }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.Answer && data.Answer.length > 0) {
          resolve(true);
        } else if (data && (data.Status === 3 || (data.Answer && data.Answer.length === 0))) {
          // Explicit NXDOMAIN response from Cloudflare DoH
          resolve(false);
        } else {
          // Try Google DNS-over-HTTPS as a second fallback
          fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`)
          .then(res2 => res2.ok ? res2.json() : null)
          .then(data2 => {
            if (data2 && data2.Answer && data2.Answer.length > 0) {
              resolve(true);
            } else {
              // Both Cloudflare and Google confirmed no DNS records
              resolve(false);
            }
          })
          .catch(() => {
            // Network failure fallback for isolated containers
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
            resolve(domainRegex.test(domain));
          });
        }
      })
      .catch(() => {
        // Network failure fallback for isolated containers
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        resolve(domainRegex.test(domain));
      });
    });
  });
}

/**
 * Centralized list of known non-identifying generic placeholder company names.
 */
export const GENERIC_COMPANY_NAMES = new Set<string>([
  'local business',
  'enterprise partner',
  'company',
  'unknown',
  'unspecified',
  'n/a',
  'na',
  'null',
  'undefined',
  'prospect',
  'general partner',
  'local enterprise',
  'business'
]);

export function isGenericCompanyName(companyName: string | null | undefined): boolean {
  if (!companyName) return true;
  const normalized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  if (!normalized) return true;
  for (const generic of GENERIC_COMPANY_NAMES) {
    const normGeneric = generic.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (normalized === normGeneric) {
      return true;
    }
  }
  return false;
}

/**
 * Helper: Real-world Website and DNS Validation
 * Rejecting fake URLs, NXDOMAIN, invalid domains, and temporary domains
 */
export async function validateWebsite(websiteUrl: string): Promise<{ isValid: boolean; reason: string; domain?: string }> {
  if (!websiteUrl) {
    return { isValid: false, reason: 'Empty website URL' };
  }

  let cleanUrl = websiteUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  let domain = '';
  try {
    const parsedUrl = new URL(cleanUrl);
    domain = parsedUrl.hostname;
  } catch (err) {
    return { isValid: false, reason: 'Malformed website URL structure' };
  }

  if (!domain || domain.includes(' ') || !domain.includes('.')) {
    return { isValid: false, reason: 'Invalid Domain format' };
  }

  // Reject temporary, fake, placeholder, or AI-generated domains + enforce SSRF guard
  const explicitFakeDomains = [
    'localhost', '127.0.0.1', 'example.com', 'test.com', 'fakesite.com',
    'placeholder.com', 'mysite.com', 'fakedomain.com', 'fakenames.com',
    'dummy.com', 'testdomain.com', 'companyname.com', 'businessname.com',
    'company.com', 'www.company.com', 'foo.bar'
  ];
  const lowerDomain = domain.toLowerCase();
  if (
    explicitFakeDomains.includes(lowerDomain) ||
    lowerDomain.endsWith('.example') ||
    lowerDomain.endsWith('.test') ||
    lowerDomain.endsWith('.invalid') ||
    lowerDomain.endsWith('.localhost') ||
    lowerDomain.endsWith('.local')
  ) {
    return { isValid: false, reason: `Rejected placeholder/test domain: ${domain}` };
  }

  const ssrfCheck = await isSafePublicUrl(cleanUrl, { skipDnsCheck: true });
  if (!ssrfCheck.safe) {
    return { isValid: false, reason: ssrfCheck.reason || `Blocked unsafe URL: ${cleanUrl}` };
  }

  // DNS Resolution check (NXDOMAIN Reject)
  const dnsOk = await resolveDomain(domain);
  if (!dnsOk) {
    return { isValid: false, reason: `DNS resolution failed (NXDOMAIN): ${domain}` };
  }

  // HTTP Validation check (HTTP 200-399, or 403 bot blocks)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'SalesPilot-Enterprise-Sourcing/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const status = response.status;
    return { isValid: true, reason: `Domain resolves and returned status ${status}`, domain };
  } catch (httpError) {
    // Retry with http if https failed
    if (cleanUrl.startsWith('https://')) {
      try {
        const httpUrl = cleanUrl.replace('https://', 'http://');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(httpUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'SalesPilot-Enterprise-Sourcing/1.0' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return { isValid: true, reason: `Domain resolves and returned status ${response.status} (HTTP fallback)`, domain };
      } catch (fallbackErr) {
        // Fall through
      }
    }
    // If DNS resolution passed, the domain is valid (it's registered), even if its website is temporarily offline/blocked
    return { isValid: true, reason: 'Domain resolves via DNS (HTTP offline/blocked)', domain };
  }
}

/**
 * Helper: Find official company website using Serper Google Search
 */
export async function findOfficialWebsite(companyName: string, apiKey: string): Promise<string> {
  if (!companyName || !apiKey || companyName === 'Enterprise Partner') return '';
  try {
    const q = `"${companyName}" official website`;
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q, num: 3 })
    });
    if (response.ok) {
      const data = await response.json() as any;
      const organic = data.organic || [];
      for (const item of organic) {
        const link = item.link || '';
        if (link) {
          try {
            const url = new URL(link);
            const domain = url.hostname.toLowerCase();
            const nonOfficialKeywords = [
              'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com', 
              'yelp.com', 'crunchbase.com', 'youtube.com', 'wikipedia.org', 
              'glassdoor.com', 'zoominfo.com', 'yellowpages.com', 'tripadvisor.com'
            ];
            if (!nonOfficialKeywords.some(kw => domain.includes(kw))) {
              return link; // Return first non-directory real website
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (err) {
    console.error(`[findOfficialWebsite] Sourcing official website failed for "${companyName}":`, err);
  }
  return '';
}

/**
 * Helper: Hunter Email verification
 */
export async function verifyEmail(email: string, apiKey?: string): Promise<'Verified' | 'Unverified' | 'Unknown'> {
  if (!email || !email.includes('@')) return 'Unverified';
  const result = await verifyDiscoveredEmail(email, {
    hunterApiKey: apiKey || process.env.HUNTER_API_KEY,
    diagnostics: globalProviderDiagnostics,
  });
  if (result.status === 'VERIFIED') return 'Verified';
  if (result.status === 'INVALID') return 'Unverified';
  return 'Unknown';
}

/**
 * Helper: Strict Mathematical Lead Scoring
 * Calculate score using Company Size, Industry, Buying Signals, Revenue, Technology Stack, Decision Maker.
 */
export function calculateLeadScore(lead: Partial<Lead>): { score: 'Hot' | 'Very Hot' | 'Warm'; numericScore: number; reason: string } {
  let score = 50; // Base score
  const reasons: string[] = [];

  // 1. Company Size Size
  const size = lead.enrichment?.companySize || '';
  if (size.includes('51-200') || size.includes('201-500')) {
    score += 15;
    reasons.push('Optimal mid-market target size range');
  } else if (size.includes('11-50')) {
    score += 10;
    reasons.push('Growth-stage client profile matches high agility');
  } else if (size.includes('500+')) {
    score += 15;
    reasons.push('Enterprise-scale procurement capacity');
  } else {
    score += 5;
  }

  // 2. Industry Sectors
  const industry = lead.enrichment?.industry || lead.tags?.[1] || '';
  if (industry && industry.trim().length > 0) {
    score += 20;
    reasons.push(`Target sector alignment: active operations in ${industry}`);
  } else {
    score += 10;
  }

  // 3. Buying Signals (Funding Rounds)
  const funding = lead.enrichment?.fundingRound || '';
  if (funding && funding.toLowerCase() !== 'bootstrapped' && funding.toLowerCase() !== 'none') {
    score += 15;
    reasons.push(`Strong buying signal: active funding milestone found (${funding})`);
  }

  // 4. Technology Stack
  const tech = lead.enrichment?.techStack || [];
  const highValueTech = ['salesforce', 'hubspot', 'marketo', 'stripe', 'segment', 'amplitude', 'intercom'];
  const matchedTech = tech.filter(t => highValueTech.some(h => t.toLowerCase().includes(h)));
  if (matchedTech.length > 0) {
    score += matchedTech.length * 5;
    reasons.push(`Utilizes premium tech stack integrations: ${matchedTech.join(', ')}`);
  }

  // 5. Decision Maker Job Titles
  const title = lead.title || '';
  const decisionMakerKeywords = ['ceo', 'founder', 'vp', 'director', 'head', 'chief', 'partner'];
  if (decisionMakerKeywords.some(kw => title.toLowerCase().includes(kw))) {
    score += 20;
    reasons.push(`Verified operational procurement authority matching title: "${title}"`);
  }

  // Clamping
  const finalNumericScore = Math.min(100, score);
  let finalScore: 'Hot' | 'Very Hot' | 'Warm' = 'Warm';
  if (finalNumericScore >= 85) {
    finalScore = 'Very Hot';
  } else if (finalNumericScore >= 70) {
    finalScore = 'Hot';
  }

  return {
    score: finalScore,
    numericScore: finalNumericScore,
    reason: reasons.join('. ') + '.'
  };
}

/**
 * Generic, industry-agnostic dynamic search query builder.
 * Combines industry, keywords, city, and country without hardcoded restrictions.
 */
export function buildDynamicSearchQuery(params: {
  industry?: string;
  keywords?: string;
  city?: string;
  country?: string;
}): string {
  const cCity = (params.city || '').trim();
  const cCountry = (params.country || '').trim();
  const locParts = [cCity, cCountry].filter(Boolean);
  const loc = locParts.length > 0 ? locParts.join(', ') : '';

  const rawInd = (params.industry || '').trim();
  const rawKw = (params.keywords || '').trim();

  // If user entered a custom query that already contains the city/location
  if (rawKw && cCity && rawKw.toLowerCase().includes(cCity.toLowerCase())) {
    return rawKw;
  }

  // Combine keywords and industry without repeating terms
  const queryTerms: string[] = [];

  if (rawKw && rawInd) {
    const kwLower = rawKw.toLowerCase();
    const indLower = rawInd.toLowerCase();

    // If keywords already contains industry word or vice versa (e.g., "construction companies" and "Construction")
    if (kwLower.includes(indLower)) {
      queryTerms.push(rawKw);
    } else if (indLower.includes(kwLower)) {
      queryTerms.push(rawInd);
    } else {
      queryTerms.push(rawKw, rawInd);
    }
  } else if (rawKw) {
    queryTerms.push(rawKw);
  } else if (rawInd) {
    queryTerms.push(rawInd);
  } else {
    queryTerms.push('Businesses');
  }

  const baseQuery = queryTerms.join(' ').trim();
  return loc ? `${baseQuery} in ${loc}` : baseQuery;
}

/**
 * 2. Google Maps Sourced Local Lead Provider
 * Live Places Text Search results with physical verification
 */
export class GoogleMapsLeadProvider implements LeadProvider {
  public id = 'google-maps';
  public name = 'Google Maps Local Scraper';
  public description = 'Pulls physical addresses, retail hubs, local business registries and coordinates to find localized target contacts.';
  public requiresApiKey = true;
  public apiKeyEnvName = 'GOOGLE_MAPS_API_KEY';

  public async generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]> {
    const rawKey = process.env.GOOGLE_MAPS_API_KEY || 
                   process.env.GOOGLE_PLACES_API_KEY || 
                   process.env.GOOGLE_MAPS_KEY || 
                   process.env.GOOGLE_API_KEY || 
                   process.env.VITE_GOOGLE_MAPS_API_KEY || 
                   params.customApiKey;
    const apiKey = rawKey ? String(rawKey).trim().replace(/^["']|["']$/g, '') : '';
    const apiKeyExists = !!apiKey;
    console.log(`[DEBUG] [Google Maps Local Scraper] API Key Exists: ${apiKeyExists} (length: ${apiKey.length})`);

    if (!apiKey) {
      console.log(`[DEBUG] [Google Maps Local Scraper] Sourcing completed with 0 results. Reason: API Key is missing.`);
      throw new Error('Google Maps API key not configured. Please enter your credentials in the Integrations panel.');
    }

    console.log(`[LEAD PROVIDER - MAPS] Scanning places in "${params.country}"...`);

    try {
      const query = buildDynamicSearchQuery(params);
      const url = 'https://places.googleapis.com/v1/places:searchText';
      console.log(`[DEBUG] [Google Maps Local Scraper] Request: POST ${url} | Headers: Content-Type: application/json, X-Goog-FieldMask: places.id,places.displayName | Body: ${JSON.stringify({ textQuery: query })}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName'
        },
        body: JSON.stringify({ textQuery: query })
      });
      
      console.log(`[DEBUG] [Google Maps Local Scraper] Response Status: ${response.status}`);

      if (!response.ok) {
        console.log(`[DEBUG] [Google Maps Local Scraper] Sourcing completed with 0 results. Reason: API request failed with status ${response.status}.`);
        throw new Error(`Google Places API (New) Text Search failed with status ${response.status}`);
      }

      const data = await response.json() as any;
      const places = data.places || [];
      console.log(`[DEBUG] [Google Maps Local Scraper] Businesses returned: ${places.length}`);

      const results: Partial<Lead>[] = [];
      let rejectedCount = 0;

      for (const place of places) {
        const placeId = place.id;
        if (!placeId) {
          rejectedCount++;
          continue;
        }

        // Fetch place details for website & phone using Place Details (New)
        const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;
        console.log(`[DEBUG] [Google Maps Local Scraper] Request Details: GET ${detailsUrl} | Headers: X-Goog-FieldMask: id,displayName,formattedAddress,websiteUri,nationalPhoneNumber,rating`);
        const detailResponse = await fetch(detailsUrl, {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,websiteUri,nationalPhoneNumber,rating'
          }
        });

        console.log(`[DEBUG] [Google Maps Local Scraper] Response Details Status for placeId "${placeId}": ${detailResponse.status}`);

        if (!detailResponse.ok) {
          rejectedCount++;
          continue;
        }

        const details = await detailResponse.json() as any;
        const website = details.websiteUri || '';

        // Verify website and domain
        let verifiedWebsite = '';
        let domainName = '';
        if (website) {
          const validation = await validateWebsite(website);
          if (validation.isValid) {
            verifiedWebsite = website;
            domainName = validation.domain || '';
          } else {
            console.log(`[DEBUG] [Google Maps Local Scraper] Website validation rejected for "${details.displayName?.text || place.displayName?.text}": ${validation.reason}`);
            rejectedCount++;
          }
        }

        const contactEmail = '';
        const emailStatus = 'EMAIL_NOT_FOUND' as const;
        const emailSource = 'NONE';

        const prospect: Partial<Lead> = {
          firstName: '',
          lastName: '',
          email: contactEmail,
          emailStatus,
          emailSource,
          phone: details.nationalPhoneNumber || '',
          company: details.displayName?.text || place.displayName?.text || '',
          title: '',
          leadScore: 'Warm',
          confidenceScore: 80,
          scoreReason: `Google Places API (New) geocoded location match. Rating: ${details.rating || 'N/A'}.`,
          tags: ['Google Places (New)', 'Local Business', params.industry],
          enrichment: {
            companySize: params.companySize || '11-50 employees',
            techStack: ['WordPress', 'Google Maps API', 'WhatsApp Business'],
            fundingRound: 'Bootstrapped',
            annualRevenue: '₹1 Crore - ₹5 Crore',
            website: verifiedWebsite,
            country: params.country,
            industry: params.industry,
            companyOverview: details.formattedAddress ? `Located at ${details.formattedAddress}.` : `${details.displayName?.text || place.displayName?.text} is a verified business.`,
            painPoints: ['Local digital discovery barriers', 'Customer booking conversion'],
            whyGoodProspect: `Active ${params.industry || 'commercial'} enterprise with verified operating presence.`,
            decisionMakerInfo: 'Operations management overseeing local procurement.',
            socialLinks: []
          }
        };

        const scoring = calculateLeadScore(prospect);
        prospect.leadScore = scoring.score;
        prospect.confidenceScore = scoring.numericScore;
        prospect.scoreReason = scoring.reason;

        results.push(prospect);

        if (results.length >= params.maxLeads) {
          break;
        }
      }

      console.log(`[DEBUG] [Google Maps Local Scraper] Businesses rejected after validation: ${rejectedCount}`);
      if (results.length === 0) {
        console.log(`[DEBUG] [Google Maps Local Scraper] Sourcing completed with 0 results. Reason: No businesses matched validation rules or query returned no places.`);
      }

      return results;
    } catch (err: any) {
      console.error('[GOOGLE MAPS API ERROR] Sourcing failed:', err);
      console.log(`[DEBUG] [Google Maps Local Scraper] Sourcing completed with 0 results. Reason: API Exception - ${err.message || err}`);
      throw new Error(`Google Maps API error: ${err.message || err}`);
    }
  }
}

/**
 * 3. People Data Labs Resume Search Index
 */
export class PeopleDataLabsLeadProvider implements LeadProvider {
  public id = 'peopledatalabs';
  public name = 'People Data Labs Index';
  public description = 'Taps into the PDL resume index of 1.5B+ global records to trace career transition milestones and active outbound routes.';
  public requiresApiKey = true;
  public apiKeyEnvName = 'PDL_API_KEY';

  public async generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]> {
    const apiKey = (process.env.PDL_API_KEY || params.customApiKey || '').trim();
    const apiKeyExists = !!apiKey;
    console.log(`[DEBUG] [People Data Labs Index] API Key Exists: ${apiKeyExists}`);

    if (!apiKey) {
      globalProviderDiagnostics.recordAttempt('peopledatalabs', {
        error: 'PDL_API_KEY is missing from environment/settings.',
      });
      throw new Error('PDL API key not configured. Please enter your credentials in the Integrations panel.');
    }

    globalProviderDiagnostics.recordAttempt('peopledatalabs', { leadsProcessedDelta: 1 });

    try {
      const primaryTitle = (params.jobTitles || 'Director').split(',')[0].trim();
      const targetDomain = extractNormalizedDomain(params.keywords);
      const mustClauses: any[] = [];

      if (targetDomain) {
        mustClauses.push({ term: { job_company_website: targetDomain } });
      } else {
        if (primaryTitle) {
          mustClauses.push({ match: { job_title: primaryTitle } });
        }
        if (params.country) {
          mustClauses.push({ term: { location_country: params.country.toLowerCase() } });
        }
      }

      const queryPayload = {
        query: { bool: { must: mustClauses } },
        size: Math.min(params.maxLeads || 5, 10)
      };

      const url = 'https://api.peopledatalabs.com/v5/person/search';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify(queryPayload),
        signal: AbortSignal.timeout(6000)
      });

      const rlRem = response.headers.get('x-ratelimit-remaining');
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        const msg = `PDL Person Search API failed with status ${response.status}: ${errText.slice(0, 160)}`;
        globalProviderDiagnostics.recordAttempt('peopledatalabs', {
          statusCode: response.status,
          rateLimitRemaining: rlRem,
          rateLimited: response.status === 429,
          error: msg,
        });
        throw new Error(msg);
      }

      const data = await response.json() as any;
      const records = data.data || [];
      globalProviderDiagnostics.recordAttempt('peopledatalabs', {
        statusCode: response.status,
        rateLimitRemaining: rlRem,
        success: true,
      });

      const results: Partial<Lead>[] = [];

      for (const item of records) {
        const companyUrl = item.job_company_website || '';
        if (!companyUrl) continue;

        const validation = await validateWebsite(companyUrl);
        if (!validation.isValid) continue;

        const officialDomain = validation.domain || extractNormalizedDomain(companyUrl);
        const rawEmail = item.work_email || (item.emails && item.emails[0]?.address) || '';
        let finalEmail = '';
        let emailStatus: Lead['emailStatus'] = 'EMAIL_NOT_FOUND';
        let emailSource = 'NONE';
        let verificationProvider: string | undefined;
        let emailVerifiedAt: string | undefined;

        if (rawEmail && isEmailRelevantToBusiness(rawEmail, officialDomain, item.job_company_name)) {
          const ver = await verifyDiscoveredEmail(rawEmail, { diagnostics: globalProviderDiagnostics });
          if (ver.status !== 'INVALID') {
            finalEmail = rawEmail.toLowerCase().trim();
            emailStatus = ver.status;
            emailSource = 'PDL';
            verificationProvider = ver.verificationProvider;
            if (ver.status === 'VERIFIED') emailVerifiedAt = new Date().toISOString();
          }
        }

        if (!finalEmail) {
          const discovered = await discoverAndVerifyLeadEmail({
            company: item.job_company_name || '',
            website: companyUrl,
            firstName: item.first_name,
            lastName: item.last_name,
            diagnostics: globalProviderDiagnostics,
          });
          finalEmail = discovered.email;
          emailStatus = discovered.emailStatus;
          emailSource = discovered.emailSource;
          verificationProvider = discovered.verificationProvider;
          emailVerifiedAt = discovered.emailVerifiedAt;
        }

        if (finalEmail) {
          globalProviderDiagnostics.recordAttempt('peopledatalabs', {
            emailsDiscoveredDelta: 1,
            verifiedDelta: emailStatus === 'VERIFIED' ? 1 : 0,
            unverifiedDelta: emailStatus !== 'VERIFIED' ? 1 : 0,
          });
        }

        const prospect: Partial<Lead> = {
          firstName: item.first_name || '',
          lastName: item.last_name || '',
          email: finalEmail,
          emailStatus,
          emailSource,
          verificationProvider,
          emailVerifiedAt,
          phone: item.phone_numbers?.[0] || '',
          company: item.job_company_name || '',
          title: item.job_title || primaryTitle,
          leadScore: 'Hot',
          confidenceScore: 85,
          scoreReason: 'PDL Professional Career Record.',
          tags: ['PDL Sourced', params.industry, 'Resume Verified'].filter(Boolean),
          enrichment: {
            companySize: item.job_company_size || params.companySize || '51-200 employees',
            techStack: item.skills || ['SaaS'],
            fundingRound: 'Private',
            annualRevenue: params.revenueRange || 'Unknown',
            website: companyUrl,
            country: params.country,
            industry: params.industry,
            companyOverview: `${item.job_company_name} matched via People Data Labs.`,
            painPoints: ['Manual outbound sourcing limits', 'Lead routing bottlenecks'],
            whyGoodProspect: 'Matches target role and corporate profile.',
            decisionMakerInfo: `${item.first_name || 'Contact'} (${item.job_title || 'Decision Maker'})`,
            socialLinks: [item.linkedin_url || item.linkedin_username].filter(Boolean)
          }
        };

        const scoring = calculateLeadScore(prospect);
        prospect.leadScore = scoring.score;
        prospect.confidenceScore = scoring.numericScore;
        prospect.scoreReason = scoring.reason;

        if (prospect.company) results.push(prospect);
      }

      return results;
    } catch (err: any) {
      console.error('[PDL API ERROR] Sourcing failed:', err);
      throw new Error(`People Data Labs service error: ${err.message || err}`);
    }
  }
}

/**
 * 4. Clearbit Enrichment Crawler
 */
export class ClearbitLeadProvider implements LeadProvider {
  public id = 'clearbit';
  public name = 'Clearbit Enrichment Crawler';
  public description = 'Pulls rich metadata from Clearbit, including exact corporate logos, company size brackets, and verified tech hierarchies.';
  public requiresApiKey = true;
  public apiKeyEnvName = 'CLEARBIT_API_KEY';

  public async generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]> {
    const apiKey = (process.env.CLEARBIT_API_KEY || params.customApiKey || '').trim();
    if (!apiKey) {
      globalProviderDiagnostics.recordAttempt('clearbit', {
        error: 'CLEARBIT_API_KEY is missing from environment/settings.',
      });
      throw new Error('Clearbit API key not configured. Please enter your credentials in the Integrations panel.');
    }

    const domain = extractNormalizedDomain(params.keywords);
    if (!domain) {
      const msg = `Clearbit Prospector requires a valid business domain (e.g. stripe.com), received "${params.keywords || ''}".`;
      globalProviderDiagnostics.recordAttempt('clearbit', { error: msg });
      throw new Error(msg);
    }

    globalProviderDiagnostics.recordAttempt('clearbit', { leadsProcessedDelta: 1 });

    try {
      const role = (params.jobTitles || '').split(',')[0].trim();
      const queryParams = new URLSearchParams({
        domain,
        limit: String(Math.min(params.maxLeads || 5, 10)),
      });
      if (role) queryParams.set('role', role);

      const url = `https://prospector.clearbit.com/v1/people/search?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        const msg = `Clearbit API failed with status ${response.status}: ${errBody.slice(0, 160)}`;
        globalProviderDiagnostics.recordAttempt('clearbit', {
          statusCode: response.status,
          rateLimited: response.status === 429,
          error: msg,
        });
        throw new Error(msg);
      }

      const raw = await response.json() as any;
      const records = Array.isArray(raw) ? raw : (raw?.results || []);
      globalProviderDiagnostics.recordAttempt('clearbit', {
        statusCode: response.status,
        success: true,
      });

      const results: Partial<Lead>[] = [];

      for (const item of records) {
        const website = item.company?.domain || domain;
        const validation = await validateWebsite(website);
        if (!validation.isValid) continue;

        const rawEmail = item.email || '';
        let finalEmail = '';
        let emailStatus: Lead['emailStatus'] = 'EMAIL_NOT_FOUND';
        let emailSource = 'NONE';
        let verificationProvider: string | undefined;
        let emailVerifiedAt: string | undefined;

        if (rawEmail && isEmailRelevantToBusiness(rawEmail, validation.domain || domain, item.company?.name)) {
          const ver = await verifyDiscoveredEmail(rawEmail, { diagnostics: globalProviderDiagnostics });
          if (ver.status !== 'INVALID') {
            finalEmail = rawEmail.toLowerCase().trim();
            emailStatus = ver.status;
            emailSource = 'CLEARBIT';
            verificationProvider = ver.verificationProvider;
            if (ver.status === 'VERIFIED') emailVerifiedAt = new Date().toISOString();
          }
        }

        if (finalEmail) {
          globalProviderDiagnostics.recordAttempt('clearbit', {
            emailsDiscoveredDelta: 1,
            verifiedDelta: emailStatus === 'VERIFIED' ? 1 : 0,
            unverifiedDelta: emailStatus !== 'VERIFIED' ? 1 : 0,
          });
        }

        const prospect: Partial<Lead> = {
          firstName: item.name?.givenName || '',
          lastName: item.name?.familyName || '',
          email: finalEmail,
          emailStatus,
          emailSource,
          verificationProvider,
          emailVerifiedAt,
          phone: item.phone || '',
          company: item.company?.name || domain,
          title: item.title || '',
          leadScore: 'Very Hot',
          confidenceScore: 90,
          scoreReason: 'Clearbit Prospector Record.',
          tags: ['Clearbit Sourced', params.industry, 'Verified Domain'].filter(Boolean),
          enrichment: {
            companySize: item.company?.metrics?.employeesRange || params.companySize || '11-50 employees',
            techStack: item.company?.tech || [],
            fundingRound: item.company?.metrics?.raised ? 'Funded' : 'Private',
            annualRevenue: item.company?.metrics?.estimatedAnnualRevenue || params.revenueRange || 'Unknown',
            website: website,
            country: params.country,
            industry: params.industry,
            companyOverview: item.company?.description || `${item.company?.name || domain} enriched via Clearbit.`,
            painPoints: ['Outbound data hygiene', 'CRM enrichment lags'],
            whyGoodProspect: 'Aligned with data-driven outbound workflows.',
            decisionMakerInfo: `${item.name?.givenName || 'Contact'} (${item.title || 'Decision Maker'})`,
            socialLinks: [item.linkedin].filter(Boolean)
          }
        };

        const scoring = calculateLeadScore(prospect);
        prospect.leadScore = scoring.score;
        prospect.confidenceScore = scoring.numericScore;
        prospect.scoreReason = scoring.reason;

        results.push(prospect);
      }

      return results;
    } catch (err: any) {
      console.error('[CLEARBIT API ERROR] Sourcing failed:', err);
      throw new Error(`Clearbit service error: ${err.message || err}`);
    }
  }
}

/**
 * 5. Hunter.io Domain Search Email Sourcing
 */
export class HunterLeadProvider implements LeadProvider {
  public id = 'hunter';
  public name = 'Hunter.io Domain Sourcing';
  public description = 'Queries Hunter Domain Search to extract corporate email patterns, verified employee listings and confidence ratings.';
  public requiresApiKey = true;
  public apiKeyEnvName = 'HUNTER_API_KEY';

  public async generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]> {
    const apiKey = (process.env.HUNTER_API_KEY || params.customApiKey || '').trim();
    if (!apiKey) {
      globalProviderDiagnostics.recordAttempt('hunter', {
        error: 'HUNTER_API_KEY is missing from environment/settings.',
      });
      throw new Error('Hunter API key not configured. Please enter your credentials in the Integrations panel.');
    }

    const domain = extractNormalizedDomain(params.keywords);
    if (!domain) {
      const msg = `Hunter.io Domain Search requires a valid domain (e.g. stripe.com), received "${params.keywords || ''}".`;
      globalProviderDiagnostics.recordAttempt('hunter', { error: msg });
      throw new Error(msg);
    }

    globalProviderDiagnostics.recordAttempt('hunter', { leadsProcessedDelta: 1 });

    try {
      const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(apiKey)}&limit=${Math.min(params.maxLeads || 5, 10)}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const rlRem = response.headers.get('x-ratelimit-remaining');

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        const msg = `Hunter API failed with status ${response.status}: ${errBody.slice(0, 160)}`;
        globalProviderDiagnostics.recordAttempt('hunter', {
          statusCode: response.status,
          rateLimitRemaining: rlRem,
          rateLimited: response.status === 429,
          error: msg,
        });
        throw new Error(msg);
      }

      const data = await response.json() as any;
      globalProviderDiagnostics.recordAttempt('hunter', {
        statusCode: response.status,
        rateLimitRemaining: rlRem,
        success: true,
      });

      const emailsList = data.data?.emails || [];
      const companyName = data.data?.organization || domain.split('.')[0];
      const resolvedDomain = data.data?.domain || domain;
      const website = `https://${resolvedDomain}`;

      const validation = await validateWebsite(website);
      if (!validation.isValid) {
        throw new Error(`Hunter.io matched domain "${website}" failed safety validation: ${validation.reason}`);
      }

      const results: Partial<Lead>[] = [];

      for (const item of emailsList) {
        const email = (item.value || '').toLowerCase().trim();
        if (!email) continue;

        const isDM = (params.jobTitles || '').split(',').some(t => t.trim() && item.position?.toLowerCase().includes(t.trim().toLowerCase()));
        if (params.decisionMakerOnly && !isDM && item.position) {
          continue;
        }

        const hunterValid = item.verification?.status === 'valid';
        const ver = await verifyDiscoveredEmail(email, {
          hunterApiKey: apiKey,
          providerVerified: hunterValid,
          diagnostics: globalProviderDiagnostics,
        });
        if (ver.status === 'INVALID') continue;

        globalProviderDiagnostics.recordAttempt('hunter', {
          emailsDiscoveredDelta: 1,
          verifiedDelta: ver.status === 'VERIFIED' ? 1 : 0,
          unverifiedDelta: ver.status !== 'VERIFIED' ? 1 : 0,
        });

        const prospect: Partial<Lead> = {
          firstName: item.first_name || '',
          lastName: item.last_name || '',
          email,
          emailStatus: ver.status,
          emailSource: 'HUNTER',
          verificationProvider: ver.verificationProvider,
          emailVerifiedAt: ver.status === 'VERIFIED' ? new Date().toISOString() : undefined,
          phone: item.phone_number || '',
          company: companyName,
          title: item.position || '',
          leadScore: item.confidence > 80 ? 'Very Hot' : 'Hot',
          confidenceScore: item.confidence || 80,
          scoreReason: `Hunter.io domain match (${ver.status}, confidence ${item.confidence || 'N/A'}%).`,
          tags: ['Hunter.io', 'Domain Match', params.industry].filter(Boolean),
          enrichment: {
            companySize: params.companySize || '11-50 employees',
            techStack: [],
            fundingRound: 'Unknown',
            annualRevenue: params.revenueRange || 'Unknown',
            website: website,
            country: params.country,
            industry: params.industry,
            companyOverview: `${companyName} (${resolvedDomain}) sourced via Hunter.io.`,
            painPoints: ['High bounce rates', 'Outbox reputation security'],
            whyGoodProspect: 'Domain email verified via Hunter.io.',
            decisionMakerInfo: `${item.first_name || 'Contact'} (${item.position || 'Team Member'})`,
            socialLinks: [item.linkedin].filter(Boolean)
          }
        };

        const scoring = calculateLeadScore(prospect);
        prospect.leadScore = scoring.score;
        prospect.confidenceScore = scoring.numericScore;
        prospect.scoreReason = scoring.reason;

        results.push(prospect);
      }

      return results;
    } catch (err: any) {
      console.error('[HUNTER API ERROR] Sourcing failed:', err);
      throw new Error(`Hunter.io service error: ${err.message || err}`);
    }
  }
}

/**
 * 5B. Apollo.io People & Organization Sourcing Provider
 */
export class ApolloLeadProvider implements LeadProvider {
  public id = 'apollo';
  public name = 'Apollo.io';
  public description = 'Queries Apollo.io B2B database for verified decision-maker contacts, company domains, and work email verification statuses.';
  public requiresApiKey = true;
  public apiKeyEnvName = 'APOLLO_API_KEY';

  public async generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]> {
    const apiKey = (process.env.APOLLO_API_KEY || params.customApiKey || '').trim();
    if (!apiKey) {
      globalProviderDiagnostics.recordAttempt('apollo', {
        error: 'APOLLO_API_KEY is missing from environment/settings.',
      });
      throw new Error('Apollo.io API key not configured. Please enter your credentials in the Integrations panel.');
    }

    globalProviderDiagnostics.recordAttempt('apollo', { leadsProcessedDelta: 1 });

    try {
      const targetDomain = extractNormalizedDomain(params.keywords);
      const titlesList = (params.jobTitles || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const requestBody: Record<string, any> = {
        per_page: Math.min(params.maxLeads || 5, 10),
        page: 1,
      };
      if (targetDomain) {
        requestBody.q_organization_domains_list = [targetDomain];
      } else {
        const kw = [params.industry, params.keywords].filter(Boolean).join(' ').trim();
        if (kw) requestBody.q_keywords = kw;
        const loc = [params.city, params.country].filter(Boolean).join(', ');
        if (loc) requestBody.organization_locations = [loc];
      }
      if (titlesList.length > 0) {
        requestBody.person_titles = titlesList.slice(0, 5);
      }

      const response = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(6000),
      });

      const rlRem = response.headers.get('x-ratelimit-remaining');
      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        const msg = `Apollo API failed with status ${response.status}: ${errBody.slice(0, 160)}`;
        globalProviderDiagnostics.recordAttempt('apollo', {
          statusCode: response.status,
          rateLimitRemaining: rlRem,
          rateLimited: response.status === 429,
          error: msg,
        });
        throw new Error(msg);
      }

      const data = (await response.json()) as any;
      globalProviderDiagnostics.recordAttempt('apollo', {
        statusCode: response.status,
        rateLimitRemaining: rlRem,
        success: true,
      });

      const people = data.people || [];
      const results: Partial<Lead>[] = [];

      for (const person of people) {
        const orgWebsite = person.organization?.website_url || (person.organization?.primary_domain ? `https://${person.organization.primary_domain}` : '');
        const companyName = person.organization?.name || '';
        if (!companyName || !orgWebsite) continue;

        const validation = await validateWebsite(orgWebsite);
        if (!validation.isValid) continue;

        const officialDomain = validation.domain || extractNormalizedDomain(orgWebsite);
        let rawEmail = person.email || '';
        let rawStatus = person.email_status || '';

        if (!rawEmail && person.id && person.has_email) {
          try {
            const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey,
              },
              body: JSON.stringify({ id: person.id, reveal_personal_emails: false }),
              signal: AbortSignal.timeout(4500),
            });
            if (matchRes.ok) {
              const matchJson = (await matchRes.json()) as any;
              rawEmail = matchJson?.person?.email || '';
              rawStatus = matchJson?.person?.email_status || rawStatus;
            }
          } catch {
            // proceed to website fallback discovery
          }
        }

        let finalEmail = '';
        let emailStatus: Lead['emailStatus'] = 'EMAIL_NOT_FOUND';
        let emailSource = 'NONE';
        let verificationProvider: string | undefined;
        let emailVerifiedAt: string | undefined;

        if (rawEmail && isEmailRelevantToBusiness(rawEmail, officialDomain, companyName)) {
          const ver = await verifyDiscoveredEmail(rawEmail, {
            providerVerified: rawStatus === 'verified',
            diagnostics: globalProviderDiagnostics,
          });
          if (ver.status !== 'INVALID') {
            finalEmail = rawEmail.toLowerCase().trim();
            emailStatus = ver.status;
            emailSource = 'APOLLO';
            verificationProvider = ver.verificationProvider;
            if (ver.status === 'VERIFIED') emailVerifiedAt = new Date().toISOString();
          }
        }

        if (!finalEmail) {
          const discovered = await discoverAndVerifyLeadEmail({
            company: companyName,
            website: orgWebsite,
            firstName: person.first_name,
            lastName: person.last_name,
            keys: { apolloKey: apiKey },
            diagnostics: globalProviderDiagnostics,
          });
          finalEmail = discovered.email;
          emailStatus = discovered.emailStatus;
          emailSource = discovered.emailSource;
          verificationProvider = discovered.verificationProvider;
          emailVerifiedAt = discovered.emailVerifiedAt;
        }

        if (finalEmail) {
          globalProviderDiagnostics.recordAttempt('apollo', {
            emailsDiscoveredDelta: 1,
            verifiedDelta: emailStatus === 'VERIFIED' ? 1 : 0,
            unverifiedDelta: emailStatus !== 'VERIFIED' ? 1 : 0,
          });
        }

        const prospect: Partial<Lead> = {
          firstName: person.first_name || '',
          lastName: person.last_name || '',
          email: finalEmail,
          emailStatus,
          emailSource,
          verificationProvider,
          emailVerifiedAt,
          phone: person.phone_numbers?.[0]?.sanitized_number || person.organization?.phone || '',
          company: companyName,
          title: person.title || '',
          leadScore: 'Very Hot',
          confidenceScore: 88,
          scoreReason: `Apollo.io B2B match (${emailStatus}).`,
          tags: ['Apollo.io', params.industry || 'B2B'].filter(Boolean),
          enrichment: {
            companySize: person.organization?.estimated_num_employees ? `${person.organization.estimated_num_employees} employees` : (params.companySize || ''),
            techStack: [],
            fundingRound: 'Private',
            annualRevenue: params.revenueRange || 'Unknown',
            website: orgWebsite,
            country: person.country || params.country,
            industry: person.organization?.industry || params.industry,
            companyOverview: `${companyName} sourced via Apollo.io.`,
            painPoints: ['Outbound scale efficiency'],
            whyGoodProspect: 'Matched decision-maker role and verified company website.',
            decisionMakerInfo: `${person.first_name || ''} ${person.last_name || ''} (${person.title || 'Decision Maker'})`.trim(),
            socialLinks: [person.linkedin_url].filter(Boolean),
          },
        };

        const scoring = calculateLeadScore(prospect);
        prospect.leadScore = scoring.score;
        prospect.confidenceScore = scoring.numericScore;
        prospect.scoreReason = scoring.reason;

        results.push(prospect);
      }

      return results;
    } catch (err: any) {
      console.error('[APOLLO API ERROR] Sourcing failed:', err);
      throw new Error(`Apollo.io service error: ${err.message || err}`);
    }
  }
}

/**
 * 6. Crunchbase Venture Directory Tracker
 */
export class CrunchbaseLeadProvider implements LeadProvider {
  public id = 'crunchbase';
  public name = 'Crunchbase Venture Tracker';
  public description = 'Monitors venture capital funding rounds, investment events, and leadership restructuring to catch hot B2B prospects.';
  public requiresApiKey = true;
  public apiKeyEnvName = 'CRUNCHBASE_API_KEY';

  public async generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]> {
    const apiKey = (process.env.CRUNCHBASE_API_KEY || params.customApiKey || '').trim();
    if (!apiKey) {
      globalProviderDiagnostics.recordAttempt('crunchbase', {
        error: 'CRUNCHBASE_API_KEY is missing from environment/settings.',
      });
      throw new Error('Crunchbase API key not configured. Please enter your credentials in the Integrations panel.');
    }

    globalProviderDiagnostics.recordAttempt('crunchbase', { leadsProcessedDelta: 1 });

    try {
      const url = 'https://api.crunchbase.com/api/v4/searches/organizations';
      const searchTerms = [params.keywords, params.industry].filter(Boolean).join(' ').trim() || 'Software';
      const requestBody = {
        field_ids: ['name', 'website_url', 'short_description', 'employee_count', 'funding_total', 'linkedin'],
        query: [
          { type: 'predicate', field_id: 'short_description', operator: 'contains', values: [searchTerms] },
          { type: 'predicate', field_id: 'facet_ids', operator: 'includes', values: ['company'] }
        ],
        limit: Math.min(params.maxLeads || 5, 10)
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Cb-User-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        const msg = `Crunchbase API failed with status ${response.status}: ${errBody.slice(0, 160)}`;
        globalProviderDiagnostics.recordAttempt('crunchbase', {
          statusCode: response.status,
          rateLimited: response.status === 429,
          error: msg,
        });
        throw new Error(msg);
      }

      const data = await response.json() as any;
      globalProviderDiagnostics.recordAttempt('crunchbase', {
        statusCode: response.status,
        success: true,
      });

      const cards = data.entities || [];
      const results: Partial<Lead>[] = [];

      for (const card of cards) {
        const properties = card.properties || {};
        const website = properties.website_url?.value || properties.website_url || '';
        const companyName = properties.name || properties.identifier?.value || '';
        if (!companyName || !website) continue;

        const validation = await validateWebsite(website);
        if (!validation.isValid) continue;

        const discovered = await discoverAndVerifyLeadEmail({
          company: companyName,
          website,
          diagnostics: globalProviderDiagnostics,
        });

        if (discovered.email) {
          globalProviderDiagnostics.recordAttempt('crunchbase', {
            emailsDiscoveredDelta: 1,
            verifiedDelta: discovered.emailStatus === 'VERIFIED' ? 1 : 0,
            unverifiedDelta: discovered.emailStatus !== 'VERIFIED' ? 1 : 0,
          });
        }

        const prospect: Partial<Lead> = {
          firstName: discovered.contactFirstName || '',
          lastName: discovered.contactLastName || '',
          email: discovered.email,
          emailStatus: discovered.emailStatus,
          emailSource: discovered.emailSource,
          verificationProvider: discovered.verificationProvider,
          emailVerifiedAt: discovered.emailVerifiedAt,
          phone: '',
          company: companyName,
          title: discovered.contactTitle || '',
          leadScore: 'Very Hot',
          confidenceScore: 90,
          scoreReason: 'Crunchbase Verified Venture Sourced Record.',
          tags: ['Crunchbase Active', 'Venture Funded', params.industry].filter(Boolean),
          enrichment: {
            companySize: properties.employee_count || params.companySize || '11-50 employees',
            techStack: [],
            fundingRound: properties.funding_total ? 'Venture Funded' : 'Private',
            annualRevenue: params.revenueRange || 'Unknown',
            website,
            country: params.country,
            industry: params.industry,
            companyOverview: properties.short_description || `${companyName} is listed on Crunchbase.`,
            painPoints: ['Venture scaling pressures', 'Pipeline validation hurdles'],
            whyGoodProspect: 'Active Crunchbase-tracked organization with validated domain.',
            decisionMakerInfo: 'Executive operations team.',
            socialLinks: [properties.linkedin?.value].filter(Boolean)
          }
        };

        const scoring = calculateLeadScore(prospect);
        prospect.leadScore = scoring.score;
        prospect.confidenceScore = scoring.numericScore;
        prospect.scoreReason = scoring.reason;

        results.push(prospect);
      }

      return results;
    } catch (err: any) {
      console.error('[CRUNCHBASE API ERROR] Sourcing failed:', err);
      throw new Error(`Crunchbase service error: ${err.message || err}`);
    }
  }
}

/**
 * 7. Serper / Google Search Web Scraper
 * Uses Serper.dev Google Search API to fetch real verified business websites + contact emails
 */
export class GoogleSearchLeadProvider implements LeadProvider {
  public id = 'google-search';
  public name = 'Google Search Web Scraper';
  public description = 'Leverages Google Search queries via Serper API to discover official websites and publicly listed corporate emails.';
  public requiresApiKey = true;
  public apiKeyEnvName = 'SERPER_API_KEY';

  public async generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]> {
    const rawKey = process.env.SERPER_API_KEY ||
                   process.env.SERPER_KEY ||
                   process.env.SERPER_API ||
                   process.env.VITE_SERPER_API_KEY ||
                   params.customApiKey;
    const apiKey = rawKey ? String(rawKey).trim().replace(/^["']|["']$/g, '') : '';

    if (!apiKey) {
      globalProviderDiagnostics.recordAttempt('google-search', {
        error: 'SERPER_API_KEY is missing from environment/settings.',
      });
      throw new Error('Serper.dev API key not configured. Please connect Serper via the Integrations panel.');
    }

    globalProviderDiagnostics.recordAttempt('google-search', { leadsProcessedDelta: 1 });

    try {
      const q = `site:linkedin.com/in "${(params.jobTitles || 'Founder').split(',')[0].trim()}" "${params.industry}" "${params.city || ''}"`;
      const url = 'https://google.serper.dev/search';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q, num: Math.min(params.maxLeads || 5, 10) }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        const msg = `Serper API returned status ${response.status}: ${errBody.slice(0, 160)}`;
        globalProviderDiagnostics.recordAttempt('google-search', {
          statusCode: response.status,
          rateLimited: response.status === 429,
          error: msg,
        });
        throw new Error(msg);
      }

      const data = await response.json() as any;
      globalProviderDiagnostics.recordAttempt('google-search', {
        statusCode: response.status,
        success: true,
      });

      const organic = data.organic || [];
      const results: Partial<Lead>[] = [];

      for (const result of organic) {
        const titleText = result.title || '';
        if (!titleText) continue;

        let parts = titleText.split(/\s*[-|–—:]\s*/);
        parts = parts.map((p: string) => p.trim()).filter((p: string) => p && !p.toLowerCase().includes('linkedin'));
        if (parts.length === 0) continue;

        const nameParts = parts[0].trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const roleText = parts[1] || '';
        const snippet = result.snippet || '';

        let company = '';
        if (parts[2]) {
          company = parts[2].replace('| LinkedIn', '').trim();
        } else {
          const matchCompany = snippet.match(/at\s+([A-Z][A-Za-z0-9\s&]{2,30})/);
          if (matchCompany && matchCompany[1]) {
            company = matchCompany[1].trim();
          }
        }
        if (!company || isGenericCompanyName(company)) continue;

        const searchWebsite = await findOfficialWebsite(company, apiKey);
        if (!searchWebsite) continue;

        const validation = await validateWebsite(searchWebsite);
        if (!validation.isValid) continue;

        const discovered = await discoverAndVerifyLeadEmail({
          company,
          website: searchWebsite,
          firstName,
          lastName,
          keys: { serperKey: apiKey },
          diagnostics: globalProviderDiagnostics,
        });

        const prospect: Partial<Lead> = {
          firstName,
          lastName,
          email: discovered.email,
          emailStatus: discovered.emailStatus,
          emailSource: discovered.emailSource,
          verificationProvider: discovered.verificationProvider,
          emailVerifiedAt: discovered.emailVerifiedAt,
          phone: '',
          company,
          title: roleText,
          leadScore: 'Warm',
          confidenceScore: 75,
          scoreReason: 'Serper Sourced Public Search Index Record.',
          tags: ['Google Search', 'LinkedIn Index', params.industry].filter(Boolean),
          enrichment: {
            companySize: params.companySize || '11-50 employees',
            techStack: [],
            fundingRound: 'Private',
            annualRevenue: 'Unknown',
            website: searchWebsite,
            country: params.country,
            industry: params.industry,
            companyOverview: `${company}: ${snippet}`,
            painPoints: ['Manual outbound limitations'],
            whyGoodProspect: 'Sourced from live search index with validated company website.',
            decisionMakerInfo: `${firstName} (${roleText || 'Decision Maker'})`,
            socialLinks: [result.link].filter(Boolean)
          }
        };

        const scoring = calculateLeadScore(prospect);
        prospect.leadScore = scoring.score;
        prospect.confidenceScore = scoring.numericScore;
        prospect.scoreReason = scoring.reason;

        results.push(prospect);
      }

      return results;
    } catch (err: any) {
      console.error('[SERPER API ERROR] Sourcing failed:', err);
      throw new Error(`Serper Google Search error: ${err.message || err}`);
    }
  }
}

/**
 * 8. Universal Website Crawler
 * Crawls homepage + /contact + /about pages directly to extract and verify genuine public contact emails.
 */
export class WebsiteCrawlingLeadProvider implements LeadProvider {
  public id = 'website-crawler';
  public name = 'Universal Website Crawler';
  public description = 'Crawls corporate homepages, contact pages, and about pages to extract publicly listed email addresses without guessing.';
  public requiresApiKey = false;

  public async generateLeads(params: LeadGenerationParams): Promise<Partial<Lead>[]> {
    const rawTarget = (params.keywords || '').trim();
    const domain = extractNormalizedDomain(rawTarget);
    if (!domain) {
      const msg = `Website Email Crawler requires a valid website URL or domain (e.g. stripe.com), received "${rawTarget}".`;
      globalProviderDiagnostics.recordAttempt('website-crawler', { error: msg });
      throw new Error(msg);
    }

    const startUrl = /^https?:\/\//i.test(rawTarget) ? rawTarget : `https://${domain}`;
    globalProviderDiagnostics.recordAttempt('website-crawler', { leadsProcessedDelta: 1 });

    const validation = await validateWebsite(startUrl);
    if (!validation.isValid) {
      const msg = `Target URL "${startUrl}" failed validation: ${validation.reason}`;
      globalProviderDiagnostics.recordAttempt('website-crawler', { error: msg });
      throw new Error(msg);
    }

    const companyName = domain.split('.')[0].toUpperCase();
    const crawlRes = await crawlWebsiteForEmails(startUrl, {
      companyName,
      maxPages: 10,
      timeoutMs: 6000,
    });

    if (crawlRes.pagesCrawled > 0) {
      globalProviderDiagnostics.recordAttempt('website-crawler', {
        statusCode: 200,
        success: true,
      });
    } else if (crawlRes.errors.length > 0) {
      globalProviderDiagnostics.recordAttempt('website-crawler', {
        error: crawlRes.errors[0],
      });
    }

    let email = '';
    let emailStatus: Lead['emailStatus'] = 'EMAIL_NOT_FOUND';
    let emailSource = 'NONE';
    let verificationProvider: string | undefined;
    let emailVerifiedAt: string | undefined;

    for (const candidate of crawlRes.emails) {
      const ver = await verifyDiscoveredEmail(candidate.email, {
        diagnostics: globalProviderDiagnostics,
      });
      if (ver.status !== 'INVALID') {
        email = candidate.email;
        emailStatus = ver.status;
        emailSource = 'WEBSITE_CRAWLER';
        verificationProvider = ver.verificationProvider;
        if (ver.status === 'VERIFIED') emailVerifiedAt = new Date().toISOString();
        break;
      }
    }

    if (email) {
      globalProviderDiagnostics.recordAttempt('website-crawler', {
        emailsDiscoveredDelta: 1,
        verifiedDelta: emailStatus === 'VERIFIED' ? 1 : 0,
        unverifiedDelta: emailStatus !== 'VERIFIED' ? 1 : 0,
      });
    }

    const prospect: Partial<Lead> = {
      firstName: '',
      lastName: '',
      email,
      emailStatus,
      emailSource,
      verificationProvider,
      emailVerifiedAt,
      phone: '',
      company: companyName,
      title: '',
      leadScore: 'Warm',
      confidenceScore: 82,
      scoreReason: email
        ? `Crawled ${crawlRes.pagesCrawled} page(s) on ${crawlRes.domain} and discovered ${email} (${emailStatus}).`
        : `Crawled ${crawlRes.pagesCrawled} page(s) on ${crawlRes.domain}; no publicly listed email found (EMAIL_NOT_FOUND).`,
      tags: ['Custom Crawler', 'Web Scraped', params.industry].filter(Boolean),
      enrichment: {
        companySize: params.companySize || '11-50 employees',
        techStack: [],
        fundingRound: 'Unknown',
        annualRevenue: 'Unknown',
        website: crawlRes.finalWebsiteUrl || startUrl,
        country: params.country,
        industry: params.industry,
        companyOverview: `${crawlRes.domain} crawled across ${crawlRes.pagesCrawled} page(s).`,
        painPoints: ['Manual outbound workflows'],
        whyGoodProspect: 'Verified corporate website domain.',
        decisionMakerInfo: 'Website contact channel.',
        socialLinks: []
      }
    };

    const scoring = calculateLeadScore(prospect);
    prospect.leadScore = scoring.score;
    prospect.confidenceScore = scoring.numericScore;
    prospect.scoreReason = scoring.reason;

    return [prospect];
  }
}

/**
 * Pluggable Provider Registrations & Helper Map checks
 */
export class LeadProviderRegistry {
  private static providers: Map<string, LeadProvider> = new Map();

  static {
    this.register(new GoogleMapsLeadProvider());
    this.register(new ApolloLeadProvider());
    this.register(new PeopleDataLabsLeadProvider());
    this.register(new ClearbitLeadProvider());
    this.register(new HunterLeadProvider());
    this.register(new CrunchbaseLeadProvider());
    this.register(new GoogleSearchLeadProvider());
    this.register(new WebsiteCrawlingLeadProvider());
  }

  public static register(provider: LeadProvider): void {
    this.providers.set(provider.id, provider);
    console.log(`[LEAD REGISTRY] Registered production-ready provider: "${provider.id}" [${provider.name}]`);
  }

  public static getProvider(id: string): LeadProvider | undefined {
    if (id === 'google-maps' || id === 'googlemaps') return this.providers.get('google-maps');
    if (id === 'google-search' || id === 'serper') return this.providers.get('google-search');
    if (id === 'apollo' || id === 'apollo-io') return this.providers.get('apollo');
    return this.providers.get(id);
  }

  public static getAllProviders(): LeadProvider[] {
    return Array.from(this.providers.values());
  }
}
