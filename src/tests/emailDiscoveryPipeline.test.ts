import assert from 'assert';
import {
  extractNormalizedDomain,
  isDirectoryOrSocialDomain,
  isPrivateOrReservedIp,
  isSafePublicUrl,
  safeFetchHtml,
  normalizeEmailCandidate,
  decodeCloudflareEmail,
  extractEmailsFromHtml,
  extractContactLinksFromHtml,
  isEmailRelevantToBusiness,
  rankEmailPriority,
  crawlWebsiteForEmails,
  verifyDiscoveredEmail,
  discoverAndVerifyLeadEmail,
  ProviderDiagnosticsTracker,
  ALL_PROVIDER_METADATA,
} from '../backend/emailDiscoveryService';
import {
  LeadProviderRegistry,
  ApolloLeadProvider,
  PeopleDataLabsLeadProvider,
  ClearbitLeadProvider,
  HunterLeadProvider,
  CrunchbaseLeadProvider,
  GoogleSearchLeadProvider,
  WebsiteCrawlingLeadProvider,
  GoogleMapsLeadProvider,
} from '../backend/leadProviders';
import { LeadGenWorker } from '../backend/leadGenWorker';
import { OutreachWorker } from '../backend/outreachWorker';
import { Lead, LeadGenJob } from '../types';

async function withMockedFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
  fn: () => Promise<void>
): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return handler(url, init);
  }) as typeof fetch;

  try {
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function htmlResponse(html: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', ...headers },
  });
}

function jsonResponse(body: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

export async function runEmailDiscoveryPipelineTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n================================================================');
  console.log('   EMAIL DISCOVERY & PROVIDER DIAGNOSTICS REGRESSION SUITE      ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  const runTest = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}: ${err?.message || err}`);
      failed++;
    }
  };

  await runTest('1. Domain normalization rejects directories, social profiles, and whitespace phrases', () => {
    assert.strictEqual(extractNormalizedDomain('https://www.AcmeRobotics.com/about'), 'acmerobotics.com');
    assert.strictEqual(extractNormalizedDomain('https://maps.google.com/?cid=12345'), '');
    assert.strictEqual(extractNormalizedDomain('https://www.linkedin.com/company/acme'), '');
    assert.strictEqual(extractNormalizedDomain('https://www.justdial.com/Bangalore/Clinic'), '');
    assert.strictEqual(extractNormalizedDomain('Software in Bengaluru'), '');
    assert.strictEqual(isDirectoryOrSocialDomain('https://facebook.com/acme'), true);
    assert.strictEqual(isDirectoryOrSocialDomain('https://acmerobotics.com'), false);
  });

  await runTest('2. SSRF protection blocks localhost, private ranges, cloud metadata IPs, and unsafe redirects', async () => {
    assert.strictEqual(isPrivateOrReservedIp('127.0.0.1'), true);
    assert.strictEqual(isPrivateOrReservedIp('10.0.0.5'), true);
    assert.strictEqual(isPrivateOrReservedIp('169.254.169.254'), true);
    assert.strictEqual(isPrivateOrReservedIp('172.16.0.1'), true);
    assert.strictEqual(isPrivateOrReservedIp('192.168.1.10'), true);
    assert.strictEqual(isPrivateOrReservedIp('8.8.8.8'), false);

    assert.strictEqual((await isSafePublicUrl('http://127.0.0.1:3000/admin', { skipDnsCheck: true })).safe, false);
    assert.strictEqual((await isSafePublicUrl('http://169.254.169.254/latest/meta-data', { skipDnsCheck: true })).safe, false);
    assert.strictEqual((await isSafePublicUrl('http://localhost:8080', { skipDnsCheck: true })).safe, false);
    assert.strictEqual((await isSafePublicUrl('file:///etc/passwd', { skipDnsCheck: true })).safe, false);

    await withMockedFetch(
      async () =>
        new Response('', {
          status: 302,
          headers: { location: 'http://127.0.0.1:8080/internal-secret' },
        }),
      async () => {
        const res = await safeFetchHtml('https://public-redirect-test.example', { skipDnsCheck: true });
        assert.strictEqual(res.ok, false);
        assert(res.error?.includes('Blocked unsafe redirect'), `Expected blocked redirect error, got: ${res.error}`);
      }
    );
  });

  await runTest('3. HTML email extraction handles mailto, JSON-LD, obfuscated [at]/[dot], and ignores noise/assets', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {"@type":"Organization","email":"leadership@acmeindustrial.com"}
          </script>
        </head>
        <body>
          <img src="hero@2x.png" />
          <p>Do not reply to noreply@acmeindustrial.com or alerts@sentry.io</p>
          <a href="mailto:Sales@AcmeIndustrial.com?subject=Inquiry">Email Sales</a>
          <p>Support: care [at] acmeindustrial [dot] com</p>
          <p>Web agency footer: dev@unrelated-agency.io</p>
        </body>
      </html>
    `;
    const extracted = extractEmailsFromHtml(html);
    const emails = extracted.map((e) => e.email);
    assert(emails.includes('sales@acmeindustrial.com'), 'Should extract mailto email');
    assert(emails.includes('leadership@acmeindustrial.com'), 'Should extract JSON-LD email');
    assert(emails.includes('care@acmeindustrial.com'), 'Should decode [at]/[dot] obfuscated email');
    assert(!emails.includes('noreply@acmeindustrial.com'), 'Should reject noreply@');
    assert(!emails.includes('alerts@sentry.io'), 'Should reject sentry.io infrastructure email');
    assert(!emails.some((e) => e.endsWith('.png')), 'Should reject asset filenames');
    assert.strictEqual(normalizeEmailCandidate('hello@example.com'), null);

    assert.strictEqual(isEmailRelevantToBusiness('sales@acmeindustrial.com', 'acmeindustrial.com', 'Acme Industrial'), true);
    assert.strictEqual(isEmailRelevantToBusiness('dev@unrelated-agency.io', 'acmeindustrial.com', 'Acme Industrial'), false);
    assert.strictEqual(
      isEmailRelevantToBusiness('acme.owner@gmail.com', 'acmeindustrial.com', 'Acme Industrial', { fromOfficialWebsite: true }),
      true
    );
    assert.strictEqual(
      isEmailRelevantToBusiness('random@gmail.com', 'acmeindustrial.com', 'Acme Industrial', { fromOfficialWebsite: false }),
      false
    );
  });

  await runTest('4. Website crawler follows /contact links and discovers genuine emails without guessing', async () => {
    await withMockedFetch(async (url) => {
      if (url === 'https://precisiongears.example/') {
        return htmlResponse(`
          <html><body>
            <h1>Precision Gears Pvt Ltd</h1>
            <a href="/contact-us">Contact Us</a>
            <a href="/about">About</a>
            <footer>Built by dev@webshop-agency.com</footer>
          </body></html>
        `);
      }
      if (url === 'https://precisiongears.example/contact-us') {
        return htmlResponse(`
          <html><body>
            <p>Reach our team at <a href="mailto:procurement@precisiongears.example">procurement@precisiongears.example</a></p>
          </body></html>
        `);
      }
      return htmlResponse('Not found', 404);
    }, async () => {
      const links = extractContactLinksFromHtml('<a href="/contact-us">Contact Us</a>', 'https://precisiongears.example');
      assert(links[0].endsWith('/contact-us'), 'Contact link should be prioritized first');

      const crawl = await crawlWebsiteForEmails('https://precisiongears.example', {
        companyName: 'Precision Gears',
        skipDnsCheck: true,
      });
      assert.strictEqual(crawl.emails.length, 1);
      assert.strictEqual(crawl.emails[0].email, 'procurement@precisiongears.example');
      assert(!crawl.emails.some((e) => e.email.includes('webshop-agency.com')), 'Unrelated footer domain must be excluded');
    });
  });

  await runTest('5. Strict accuracy: returns EMAIL_NOT_FOUND with empty email when website has no email (NEVER guesses info@/contact@)', async () => {
    await withMockedFetch(async () => {
      return htmlResponse('<html><body><h1>Silent Corp</h1><p>Call us at +91-80-12345678</p></body></html>');
    }, async () => {
      const tracker = new ProviderDiagnosticsTracker();
      const result = await discoverAndVerifyLeadEmail({
        company: 'Silent Corp',
        website: 'https://silentcorp.example',
        diagnostics: tracker,
        skipDnsCheck: true,
        skipNetworkMx: true,
      });
      assert.strictEqual(result.email, '');
      assert.strictEqual(result.emailStatus, 'EMAIL_NOT_FOUND');
      assert.strictEqual(result.emailSource, 'NONE');
      assert(!result.discoveredEmails.some((d) => d.email.startsWith('info@') || d.email.startsWith('contact@')));
    });
  });

  await runTest('6. Strict verification: website-crawled email without SMTP verifier is marked UNVERIFIED, never VERIFIED', async () => {
    await withMockedFetch(async (url) => {
      if (url.startsWith('https://novatech.example')) {
        return htmlResponse('<html><body><a href="mailto:founders@novatech.example">Contact</a></body></html>');
      }
      return htmlResponse('', 404);
    }, async () => {
      const tracker = new ProviderDiagnosticsTracker();
      const result = await discoverAndVerifyLeadEmail({
        company: 'NovaTech Systems',
        website: 'https://novatech.example',
        diagnostics: tracker,
        skipDnsCheck: true,
        skipNetworkMx: true,
      });
      assert.strictEqual(result.email, 'founders@novatech.example');
      assert.strictEqual(result.emailStatus, 'UNVERIFIED');
      assert.strictEqual(result.emailSource, 'WEBSITE_CRAWLER');

      const snap = tracker.getSnapshot().find((p) => p.providerId === 'website-crawler')!;
      assert.strictEqual(snap.emailsDiscovered, 1);
      assert.strictEqual(snap.unverifiedEmails, 1);
      assert.strictEqual(snap.verifiedEmails, 0);
    });
  });

  await runTest('7. Hunter verifier marks valid -> VERIFIED, invalid -> rejected, and HTTP 429 -> RATE_LIMITED diagnostics', async () => {
    await withMockedFetch(async (url) => {
      if (url.includes('api.hunter.io/v2/email-verifier') && url.includes('valid%40')) {
        return jsonResponse({ data: { status: 'valid', score: 96 } }, 200, { 'x-ratelimit-remaining': '48' });
      }
      if (url.includes('api.hunter.io/v2/email-verifier') && url.includes('bounce%40')) {
        return jsonResponse({ data: { status: 'invalid', score: 10 } }, 200);
      }
      if (url.includes('api.hunter.io/v2/email-verifier') && url.includes('ratelimit%40')) {
        return jsonResponse({ errors: [{ details: 'Too many requests' }] }, 429, { 'x-ratelimit-remaining': '0' });
      }
      return jsonResponse({}, 404);
    }, async () => {
      const tracker = new ProviderDiagnosticsTracker({ hunter: true });

      const v1 = await verifyDiscoveredEmail('valid@acme.example', {
        hunterApiKey: 'test-hunter-key',
        skipNetworkMx: true,
        diagnostics: tracker,
      });
      assert.strictEqual(v1.status, 'VERIFIED');
      assert.strictEqual(v1.verificationProvider, 'HUNTER_VERIFIER');

      const v2 = await verifyDiscoveredEmail('bounce@acme.example', {
        hunterApiKey: 'test-hunter-key',
        skipNetworkMx: true,
        diagnostics: tracker,
      });
      assert.strictEqual(v2.status, 'INVALID');

      const v3 = await verifyDiscoveredEmail('ratelimit@acme.example', {
        hunterApiKey: 'test-hunter-key',
        skipNetworkMx: true,
        diagnostics: tracker,
      });
      assert.strictEqual(v3.status, 'UNVERIFIED');
      const hunterDiag = tracker.getSnapshot().find((p) => p.providerId === 'hunter')!;
      assert.strictEqual(hunterDiag.connectionStatus, 'RATE_LIMITED');
      assert.strictEqual(hunterDiag.lastStatusCode, 429);
      assert.strictEqual(hunterDiag.rateLimitRemaining, '0');
    });
  });

  await runTest('8. All 8 providers registered and Apollo/PDL/Clearbit/Serper/Crunchbase work without email fabrication', async () => {
    const ids = LeadProviderRegistry.getAllProviders().map((p) => p.id);
    for (const meta of ALL_PROVIDER_METADATA) {
      assert(ids.includes(meta.id), `Missing provider in LeadProviderRegistry: ${meta.id}`);
    }

    await withMockedFetch(async (url, init) => {
      if (url.includes('cloudflare-dns.com/dns-query')) {
        if (url.includes('type=MX')) {
          return jsonResponse({ Status: 0, Answer: [{ data: '10 mx.mockdomain.io.' }] });
        }
        return jsonResponse({ Status: 0, Answer: [{ data: '93.184.216.34' }] });
      }
      if (url.includes('api.apollo.io/api/v1/mixed_people/api_search')) {
        return jsonResponse({
          people: [
            {
              id: 'ap_1',
              first_name: 'Riya',
              last_name: 'Mehta',
              title: 'VP Sales',
              email: 'riya@orbitalcloud.io',
              email_status: 'verified',
              organization: { name: 'Orbital Cloud', website_url: 'https://orbitalcloud.io' },
            },
          ],
        });
      }
      if (url.includes('api.peopledatalabs.com/v5/person/search')) {
        assert.strictEqual(init?.method, 'POST');
        return jsonResponse({
          data: [
            {
              first_name: 'Arjun',
              last_name: 'Nair',
              job_title: 'CTO',
              work_email: 'arjun@kestrelrobotics.io',
              job_company_name: 'Kestrel Robotics',
              job_company_website: 'kestrelrobotics.io',
            },
          ],
        });
      }
      if (url.includes('prospector.clearbit.com/v1/people/search')) {
        assert.strictEqual(init?.method, 'GET');
        return jsonResponse([
          {
            name: { givenName: 'Elena', familyName: 'Rostova' },
            title: 'Head of Growth',
            email: 'elena@vervebio.io',
          },
        ]);
      }
      if (url.includes('company.clearbit.com/v2/companies/find')) {
        return jsonResponse({ name: 'Verve Bio', domain: 'vervebio.io', metrics: { employees: 45 } });
      }
      if (url.includes('google.serper.dev/search')) {
        const bodyStr = String(init?.body || '');
        if (bodyStr.includes('site:linkedin.com/in')) {
          return jsonResponse({
            organic: [
              {
                title: 'Vikram Rao - Director - Atlas Logistics | LinkedIn',
                link: 'https://www.linkedin.com/in/vikram-rao',
                snippet: 'Director at Atlas Logistics',
              },
            ],
          });
        }
        if (bodyStr.includes('official website')) {
          return jsonResponse({
            organic: [
              {
                title: 'Atlas Logistics',
                link: 'https://atlaslogistics.io',
                snippet: 'Freight & supply chain',
              },
            ],
          });
        }
        return jsonResponse({
          organic: [
            {
              title: 'Contact Atlas Logistics',
              link: 'https://atlaslogistics.io/contact',
              snippet: 'Reach our dispatch desk at dispatch@atlaslogistics.io',
            },
          ],
        });
      }
      if (url.includes('api.crunchbase.com/api/v4/searches/organizations')) {
        return jsonResponse({
          entities: [
            {
              properties: {
                identifier: { value: 'Solstice Energy' },
                website_url: 'https://solsticeenergy.io',
                contact_email: 'partnerships@solsticeenergy.io',
                short_description: 'Grid storage',
              },
            },
          ],
        });
      }
      if (url.includes('places.googleapis.com/v1/places:searchText')) {
        return jsonResponse({
          places: [{ id: 'gp_1', displayName: { text: 'Crest Dental Studio' } }],
        });
      }
      if (url.includes('places.googleapis.com/v1/places/gp_1')) {
        return jsonResponse({
          id: 'gp_1',
          displayName: { text: 'Crest Dental Studio' },
          websiteUri: 'https://crestdental.io',
          nationalPhoneNumber: '+91 80 4444 5555',
          formattedAddress: 'Indiranagar, Bengaluru',
          rating: 4.8,
        });
      }
      if (url.startsWith('https://solsticeenergy.io')) {
        return htmlResponse('<html><body><a href="mailto:partnerships@solsticeenergy.io">Partnerships</a></body></html>');
      }
      return htmlResponse('', 200);
    }, async () => {
      const apollo = new ApolloLeadProvider();
      const apolloLeads = await apollo.generateLeads({
        campaignName: 'SaaS',
        country: 'India',
        industry: 'Software',
        jobTitles: 'VP Sales',
        keywords: 'orbitalcloud.io',
        maxLeads: 3,
        customApiKey: 'test-apollo',
      });
      assert.strictEqual(apolloLeads[0]?.email, 'riya@orbitalcloud.io');
      assert.strictEqual(apolloLeads[0]?.emailStatus, 'VERIFIED');

      const pdl = new PeopleDataLabsLeadProvider();
      const pdlLeads = await pdl.generateLeads({
        campaignName: 'Robotics',
        country: 'India',
        industry: 'Robotics',
        jobTitles: 'CTO',
        keywords: 'kestrelrobotics.io',
        maxLeads: 3,
        customApiKey: 'test-pdl',
      });
      assert.strictEqual(pdlLeads[0]?.email, 'arjun@kestrelrobotics.io');
      assert.strictEqual(pdlLeads[0]?.emailStatus, 'UNVERIFIED');

      const clearbit = new ClearbitLeadProvider();
      const cbLeads = await clearbit.generateLeads({
        campaignName: 'Bio',
        country: 'USA',
        industry: 'Biotech',
        jobTitles: 'Head of Growth',
        keywords: 'vervebio.io',
        maxLeads: 3,
        customApiKey: 'test-cb',
      });
      assert.strictEqual(cbLeads[0]?.email, 'elena@vervebio.io');

      const serper = new GoogleSearchLeadProvider();
      const serperLeads = await serper.generateLeads({
        campaignName: 'Logistics',
        country: 'India',
        industry: 'Logistics',
        jobTitles: 'Director',
        keywords: 'atlaslogistics.io',
        maxLeads: 3,
        customApiKey: 'test-serper',
      });
      assert.strictEqual(serperLeads[0]?.email, 'dispatch@atlaslogistics.io');

      const crunchbase = new CrunchbaseLeadProvider();
      const crunchLeads = await crunchbase.generateLeads({
        campaignName: 'Energy',
        country: 'India',
        industry: 'Energy',
        jobTitles: 'CEO',
        keywords: 'Solstice Energy',
        maxLeads: 3,
        customApiKey: 'test-cb',
      });
      assert.strictEqual(crunchLeads[0]?.email, 'partnerships@solsticeenergy.io');

      const maps = new GoogleMapsLeadProvider();
      const mapLeads = await maps.generateLeads({
        campaignName: 'Dental',
        country: 'India',
        industry: 'Healthcare',
        jobTitles: 'Doctor',
        keywords: 'Crest Dental',
        maxLeads: 3,
        customApiKey: 'test-gmaps',
      });
      assert.strictEqual(mapLeads[0]?.email, '');
      assert.strictEqual(mapLeads[0]?.emailStatus, 'EMAIL_NOT_FOUND');

      const crawler = new WebsiteCrawlingLeadProvider();
      await assert.rejects(
        () =>
          crawler.generateLeads({
            campaignName: 'NoDomain',
            country: 'India',
            industry: 'Software',
            jobTitles: 'CEO',
            keywords: 'software startups',
            maxLeads: 3,
          }),
        /requires a valid website URL or domain/i
      );

      const hunter = new HunterLeadProvider();
      assert.strictEqual(hunter.id, 'hunter');
    });
  });

  await runTest('9. LeadGenWorker preserves genuine discovered emails, sets EMAIL_NOT_FOUND on missing, and persists providerDiagnostics', async () => {
    const savedLeads: Lead[] = [];
    let currentJob: LeadGenJob = {
      jobId: 'job_test_email_pipeline',
      organizationId: 'org_test',
      userId: 'usr_test',
      status: 'QUEUED',
      total: 2,
      processed: 0,
      created: 0,
      skipped: 0,
      progress: 0,
      criteria: {
        campaignName: 'Industrial Test',
        country: 'India',
        city: 'Pune',
        industry: 'Manufacturing',
        keywords: 'valves',
        maxLeads: 2,
        providerId: 'google-maps',
        customApiKey: 'mock-gmaps-key',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await withMockedFetch(async (url) => {
      if (url.includes('cloudflare-dns.com/dns-query')) {
        if (url.includes('type=MX')) {
          return jsonResponse({ Status: 0, Answer: [{ data: '10 mx.mockdomain.io.' }] });
        }
        return jsonResponse({ Status: 0, Answer: [{ data: '93.184.216.34' }] });
      }
      if (url.includes('places.googleapis.com/v1/places:searchText')) {
        return jsonResponse({
          places: [
            {
              id: 'pl_1',
              displayName: { text: 'Apex Valves Pvt Ltd' },
              websiteUri: 'https://apexvalves.io',
              nationalPhoneNumber: '+91 20 1111 2222',
              formattedAddress: 'Chakan, Pune',
            },
            {
              id: 'pl_2',
              displayName: { text: 'Silent Forgings' },
              websiteUri: 'https://silentforgings.io',
              nationalPhoneNumber: '+91 20 3333 4444',
              formattedAddress: 'Bhosari, Pune',
            },
          ],
        });
      }
      if (url.startsWith('https://apexvalves.io')) {
        return htmlResponse('<html><body><a href="mailto:sales@apexvalves.io">Sales</a></body></html>');
      }
      if (url.startsWith('https://silentforgings.io')) {
        return htmlResponse('<html><body><p>Call us on landline only.</p></body></html>');
      }
      return htmlResponse('', 404);
    }, async () => {
      const worker = new LeadGenWorker({
        getJobById: async () => currentJob,
        claimJob: async () => {
          currentJob = { ...currentJob, status: 'RUNNING' };
          return currentJob;
        },
        updateJob: async (_jobId, updates) => {
          currentJob = { ...currentJob, ...updates };
          return true;
        },
        getLeads: async () => savedLeads,
        insertLead: async (lead) => {
          savedLeads.push(lead);
          return lead;
        },
        getProviderCredentials: () => ({ googlemaps: { apiKey: 'mock-gmaps-key' } }),
      });

      const finished = await worker.processJob('job_test_email_pipeline', 'org_test');
      assert.strictEqual(finished?.status, 'COMPLETED');
      assert.strictEqual(savedLeads.length, 2);

      const apex = savedLeads.find((l) => l.company === 'Apex Valves Pvt Ltd')!;
      assert.strictEqual(apex.email, 'sales@apexvalves.io');
      assert.strictEqual(apex.emailStatus, 'UNVERIFIED');
      assert.strictEqual(apex.emailSource, 'WEBSITE_CRAWLER');

      const silent = savedLeads.find((l) => l.company === 'Silent Forgings')!;
      assert.strictEqual(silent.email, '');
      assert.strictEqual(silent.emailStatus, 'EMAIL_NOT_FOUND');
      assert.strictEqual(silent.emailSource, 'NONE');

      assert(Array.isArray(finished?.providerDiagnostics) && finished!.providerDiagnostics!.length === 8);
      const crawlerDiag = finished!.providerDiagnostics!.find((d: any) => d.providerId === 'website-crawler');
      assert.strictEqual(crawlerDiag.leadsProcessed, 2);
      assert.strictEqual(crawlerDiag.emailsDiscovered, 1);

      // OutreachWorker must still refuse sending to the EMAIL_NOT_FOUND lead
      let blockedReason = '';
      const outreach = new OutreachWorker({
        getCampaignById: async () => ({ id: 'c1', status: 'ACTIVE', organizationId: 'org_test' }),
        getStepsByCampaign: async () => [],
        getLeadById: async () => silent,
        getQueueItemsToProcess: async () => [
          { id: 'q1', campaignId: 'c1', leadId: silent.id, organizationId: 'org_test', subject: 'Hi', body: 'Test', status: 'QUEUED' },
        ],
        claimQueueItem: async () => ({
          id: 'q1', campaignId: 'c1', leadId: silent.id, organizationId: 'org_test', subject: 'Hi', body: 'Test', status: 'QUEUED',
        }),
        updateQueueItem: async (_id: string, updates: any) => {
          blockedReason = updates.error || '';
          return true;
        },
        getGmailAccount: async () => ({ email: 'sender@salespilot.app', accessToken: 'tok' }),
      } as any);
      await outreach.processQueue(5);
      assert(blockedReason.includes('EMAIL_NOT_FOUND'), `Expected OutreachWorker to block EMAIL_NOT_FOUND, got: ${blockedReason}`);
    });
  });

  await runTest('10. Cloudflare email protection, escaped JSON/HTML entities, __NEXT_DATA__, and Sentry hex-hash filtering', () => {
    // XOR key 0x2a applied to "hello@zerodha.example"
    const plain = 'hello@zerodha.example';
    const key = 0x2a;
    const hex =
      key.toString(16).padStart(2, '0') +
      Array.from(plain)
        .map((c) => (c.charCodeAt(0) ^ key).toString(16).padStart(2, '0'))
        .join('');

    assert.strictEqual(decodeCloudflareEmail(hex), plain);
    assert.strictEqual(decodeCloudflareEmail('bad'), null);

    const html = `
      <html>
        <head>
          <script id="__NEXT_DATA__" type="application/json">
            {"props":{"contact":"\\u003edpo@saascorp.example","desk":"team\\u0040saascorp.example","dsn":"f1a2b3c4d5e6f7a8b9c0d1e2f3a4@saascorp.example"}}
          </script>
        </head>
        <body>
          <a href="/cdn-cgi/l/email-protection#${hex}"><span class="__cf_email__" data-cfemail="${hex}">[email&#160;protected]</span></a>
          <p>Support: care&#064;saascorp.example</p>
        </body>
      </html>
    `;

    const extracted = extractEmailsFromHtml(html);
    const emails = extracted.map((e) => e.email);
    assert(emails.includes('hello@zerodha.example'), 'Should decode Cloudflare data-cfemail / protection link');
    assert(emails.includes('dpo@saascorp.example'), 'Should strip \\u003e prefix from JSON email');
    assert(emails.includes('team@saascorp.example'), 'Should decode \\u0040 in JSON email');
    assert(emails.includes('care@saascorp.example'), 'Should decode zero-padded HTML entity &#064;');
    assert(
      !emails.some((e) => e.startsWith('f1a2b3c4d5e6')),
      'Should reject 20+ hex-char Sentry telemetry local parts'
    );
  });

  await runTest('11. safeFetchHtml sends Chrome Sec-Ch-Ua and Sec-Fetch navigation headers', async () => {
    let capturedHeaders: Record<string, string> = {};
    await withMockedFetch(async (_url, init) => {
      capturedHeaders = Object.fromEntries(
        Object.entries((init?.headers as Record<string, string>) || {}).map(([k, v]) => [k.toLowerCase(), v])
      );
      return htmlResponse('<html><body>ok</body></html>');
    }, async () => {
      const res = await safeFetchHtml('https://headers-check.example', { skipDnsCheck: true });
      assert.strictEqual(res.ok, true);
      assert(capturedHeaders['user-agent']?.includes('Chrome/'), 'Expected Chrome User-Agent');
      assert(Boolean(capturedHeaders['sec-ch-ua']), 'Expected Sec-Ch-Ua header');
      assert.strictEqual(capturedHeaders['sec-fetch-dest'], 'document');
      assert.strictEqual(capturedHeaders['sec-fetch-mode'], 'navigate');
    });
  });

  await runTest('12. Crawler continues to /contact and /privacy-policy when homepage returns HTTP 403', async () => {
    await withMockedFetch(async (url) => {
      if (url === 'https://wafblocked.example/' || url === 'http://wafblocked.example/') {
        return htmlResponse('Access Denied', 403);
      }
      if (url === 'https://wafblocked.example/contact') {
        return htmlResponse('<html><body><a href="mailto:sales@wafblocked.example">Sales</a></body></html>');
      }
      return htmlResponse('', 404);
    }, async () => {
      const crawl = await crawlWebsiteForEmails('https://wafblocked.example', {
        companyName: 'WAF Blocked Co',
        skipDnsCheck: true,
      });
      assert.strictEqual(crawl.emails[0]?.email, 'sales@wafblocked.example');
      assert(crawl.pagesCrawled >= 1);
    });
  });

  await runTest('13. Wave 2 reaches /privacy-policy despite noisy /about links and ranks sales@ above privacy@', async () => {
    await withMockedFetch(async (url) => {
      if (url === 'https://noisy-nav.example/') {
        return htmlResponse(`
          <html><body>
            <a href="/why/about/awards-and-accolades">Awards</a>
            <a href="/why/about/press-releases">Press</a>
            <a href="/why/about/inclusion">Inclusion</a>
            <a href="/why/about/company">Company</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy-policy">Privacy Policy</a>
          </body></html>
        `);
      }
      if (url === 'https://noisy-nav.example/privacy-policy') {
        return htmlResponse('<html><body><p>Questions? Write privacy@noisy-nav.example</p></body></html>');
      }
      return htmlResponse('<html><body><p>No email here</p></body></html>', 200);
    }, async () => {
      const crawl = await crawlWebsiteForEmails('https://noisy-nav.example', {
        companyName: 'Noisy Nav Corp',
        skipDnsCheck: true,
      });
      assert.strictEqual(crawl.emails[0]?.email, 'privacy@noisy-nav.example');
      assert(
        rankEmailPriority('sales@noisy-nav.example', 'noisy-nav.example', 'text') >
          rankEmailPriority('privacy@noisy-nav.example', 'noisy-nav.example', 'mailto'),
        'Primary sales@ role address must outrank compliance privacy@'
      );
    });
  });

  console.log('\n================================================================');
  console.log(`  EMAIL DISCOVERY PIPELINE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  return { passed, failed };
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.includes('emailDiscoveryPipeline.test');

if (isDirectExecution) {
  runEmailDiscoveryPipelineTests()
    .then((res) => {
      if (res.failed > 0) process.exit(1);
      process.exit(0);
    })
    .catch((err) => {
      console.error('emailDiscoveryPipeline.test crashed:', err);
      process.exit(1);
    });
}
