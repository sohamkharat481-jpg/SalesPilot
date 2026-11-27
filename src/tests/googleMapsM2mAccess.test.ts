import assert from 'assert';
import express from 'express';
import http from 'http';
import {
  createGoogleMapsSearchHandler,
  createGoogleMapsRateLimiter,
  timingSafeSecretMatch,
  isStrongSharedSecret,
  validateGoogleMapsSearchBody,
  sanitizeUpstreamMapsError,
  GOOGLE_MAPS_PLACES_ENDPOINT,
  GOOGLE_MAPS_PLACES_FIELD_MASK,
  GOOGLE_MAPS_QUERY_MAX_LENGTH,
  GOOGLE_MAPS_LOCATION_MAX_LENGTH,
  GOOGLE_MAPS_DEFAULT_LOCATION,
} from '../backend/googleMapsSearchService';

const TEST_SHARED_SECRET = 'sp_m2m_linkedin_tool_9f4c2e8a71b0d53c6e4a1f8b';
const MOCK_GMAPS_KEY = 'AIzaSyMockTestKeyForUnitTestsOnly1234567890';

async function withExpressServer(
  handler: express.RequestHandler,
  fn: (baseUrl: string) => Promise<void>
): Promise<void> {
  const testApp = express();
  testApp.use(express.json());
  testApp.post('/api/v1/googlemaps/search', handler);

  const server = await new Promise<http.Server>((resolve) => {
    const s = testApp.listen(0, '127.0.0.1', () => resolve(s));
  });

  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    server.close();
    throw new Error('Failed to bind ephemeral test port');
  }

  try {
    await fn(`http://127.0.0.1:${addr.port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

export async function runGoogleMapsM2mAccessTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n================================================================');
  console.log('   GOOGLE MAPS M2M ACCESS & SECURITY REGRESSION SUITE           ');
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

  await runTest('1. Secret strength & timing-safe comparison', () => {
    assert.strictEqual(isStrongSharedSecret(''), false);
    assert.strictEqual(isStrongSharedSecret('short'), false);
    assert.strictEqual(isStrongSharedSecret('placeholder'), false);
    assert.strictEqual(isStrongSharedSecret(TEST_SHARED_SECRET), true);

    assert.strictEqual(timingSafeSecretMatch(TEST_SHARED_SECRET, TEST_SHARED_SECRET), true);
    assert.strictEqual(timingSafeSecretMatch(TEST_SHARED_SECRET + 'x', TEST_SHARED_SECRET), false);
    assert.strictEqual(timingSafeSecretMatch('wrong-key', TEST_SHARED_SECRET), false);
    assert.strictEqual(timingSafeSecretMatch('', TEST_SHARED_SECRET), false);
  });

  await runTest('2. Authentication rejects missing, invalid, or weak-server-configured secrets with 401', async () => {
    let placesCalled = 0;
    const handler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => MOCK_GMAPS_KEY,
      getSharedSecret: () => TEST_SHARED_SECRET,
      getAuthenticatedUser: () => null,
      rateLimiter: createGoogleMapsRateLimiter({ maxRequests: 10 }),
      fetchFn: (async () => {
        placesCalled++;
        return new Response(JSON.stringify({ places: [] }), { status: 200 });
      }) as typeof fetch,
    });

    await withExpressServer(handler, async (baseUrl) => {
      // Missing auth
      const r1 = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'SaaS', location: 'Mumbai' }),
      });
      assert.strictEqual(r1.status, 401);
      const b1 = await r1.json();
      assert.strictEqual(b1.success, false);

      // Wrong X-API-Key
      const r2 = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'wrong_key_1234567890' },
        body: JSON.stringify({ query: 'SaaS', location: 'Mumbai' }),
      });
      assert.strictEqual(r2.status, 401);

      // Empty X-API-Key
      const r3 = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': '   ' },
        body: JSON.stringify({ query: 'SaaS', location: 'Mumbai' }),
      });
      assert.strictEqual(r3.status, 401);
    });

    assert.strictEqual(placesCalled, 0, 'Google Places must never be called for 401 requests');

    // Weak / unset server secret must fail closed
    const weakHandler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => MOCK_GMAPS_KEY,
      getSharedSecret: () => 'too-short',
      getAuthenticatedUser: () => null,
      fetchFn: (async () => new Response(JSON.stringify({ places: [] }), { status: 200 })) as typeof fetch,
    });

    await withExpressServer(weakHandler, async (baseUrl) => {
      const rWeak = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'too-short' },
        body: JSON.stringify({ query: 'SaaS', location: 'Mumbai' }),
      });
      assert.strictEqual(rWeak.status, 401);
    });
  });

  await runTest('3. Valid X-API-Key authenticates LinkedIn-Tool, preserves exact Places FieldMask & response schema', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;
    let successCallbackCalls = 0;

    const handler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => MOCK_GMAPS_KEY,
      getSharedSecret: () => TEST_SHARED_SECRET,
      getAuthenticatedUser: () => null,
      rateLimiter: createGoogleMapsRateLimiter({ maxRequests: 10 }),
      onSearchSuccess: () => {
        successCallbackCalls++;
      },
      fetchFn: (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = typeof input === 'string' ? input : input.toString();
        const hdrs = new Headers(init?.headers);
        capturedHeaders = {
          'x-goog-api-key': hdrs.get('X-Goog-Api-Key') || '',
          'x-goog-fieldmask': hdrs.get('X-Goog-FieldMask') || '',
        };
        capturedBody = JSON.parse(String(init?.body || '{}'));
        return new Response(
          JSON.stringify({
            places: [
              {
                id: 'ChIJ_test_1',
                displayName: { text: 'Acme Cloud Labs' },
                formattedAddress: '100 MG Road, Bengaluru',
                nationalPhoneNumber: '+91 80 1234 5678',
                websiteUri: 'https://acmecloud.example',
                rating: 4.8,
                userRatingCount: 142,
              },
              {
                id: 'ChIJ_test_2',
                displayName: 'Beta Logistics',
                formattedAddress: '42 Whitefield, Bengaluru',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as typeof fetch,
    });

    await withExpressServer(handler, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': TEST_SHARED_SECRET,
        },
        body: JSON.stringify({ query: 'B2B SaaS', location: 'Bengaluru' }),
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-ratelimit-limit'), '10');
      assert.strictEqual(res.headers.get('x-ratelimit-remaining'), '9');

      const data = await res.json();
      assert.deepStrictEqual(data, {
        success: true,
        results: [
          {
            name: 'Acme Cloud Labs',
            address: '100 MG Road, Bengaluru',
            phone: '+91 80 1234 5678',
            website: 'https://acmecloud.example',
            rating: 4.8,
            reviewsCount: 142,
            placeId: 'ChIJ_test_1',
          },
          {
            name: 'Beta Logistics',
            address: '42 Whitefield, Bengaluru',
            phone: '',
            website: '',
            rating: 0,
            reviewsCount: 0,
            placeId: 'ChIJ_test_2',
          },
        ],
      });
    });

    assert.strictEqual(capturedUrl, GOOGLE_MAPS_PLACES_ENDPOINT);
    assert.strictEqual(capturedHeaders['x-goog-api-key'], MOCK_GMAPS_KEY);
    assert.strictEqual(capturedHeaders['x-goog-fieldmask'], GOOGLE_MAPS_PLACES_FIELD_MASK);
    assert.deepStrictEqual(capturedBody, { textQuery: 'B2B SaaS in Bengaluru' });
    assert.strictEqual(successCallbackCalls, 1);
  });

  await runTest('4. Signed-in SalesPilot users continue to work without X-API-Key; explicit invalid X-API-Key still fails closed', async () => {
    const handler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => MOCK_GMAPS_KEY,
      getSharedSecret: () => TEST_SHARED_SECRET,
      getAuthenticatedUser: () => ({ id: 'usr_salespilot_1', email: 'rep@salespilot.co' } as any),
      rateLimiter: createGoogleMapsRateLimiter({ maxRequests: 10 }),
      fetchFn: (async () =>
        new Response(JSON.stringify({ places: [] }), { status: 200 })
      ) as typeof fetch,
    });

    await withExpressServer(handler, async (baseUrl) => {
      const okRes = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Clinics' }),
      });
      assert.strictEqual(okRes.status, 200);

      // Even if user session exists, an invalid X-API-Key must fail closed with 401
      const badKeyRes = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'invalid_override_attempt' },
        body: JSON.stringify({ query: 'Clinics' }),
      });
      assert.strictEqual(badKeyRes.status, 401);
    });
  });

  await runTest('5. Rate limiting enforces 429 + headers (no loopback/X-Forwarded-For bypass) & 401 does not burn quota', async () => {
    let nowMs = 1_700_000_000_000;
    const limiter = createGoogleMapsRateLimiter({
      maxRequests: 2,
      windowMs: 60_000,
      nowFn: () => nowMs,
    });

    const handler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => MOCK_GMAPS_KEY,
      getSharedSecret: () => TEST_SHARED_SECRET,
      getAuthenticatedUser: () => null,
      rateLimiter: limiter,
      fetchFn: (async () =>
        new Response(JSON.stringify({ places: [] }), { status: 200 })
      ) as typeof fetch,
    });

    await withExpressServer(handler, async (baseUrl) => {
      // Unauthenticated 401 attempts must not drain M2M quota
      for (let i = 0; i < 3; i++) {
        const unauth = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': 'bad_key' },
          body: JSON.stringify({ query: 'Dentists' }),
        });
        assert.strictEqual(unauth.status, 401);
      }

      // Request 1 & 2 succeed (including spoofed X-Forwarded-For: 127.0.0.1)
      const r1 = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': TEST_SHARED_SECRET,
          'X-Forwarded-For': '127.0.0.1',
        },
        body: JSON.stringify({ query: 'Dentists' }),
      });
      assert.strictEqual(r1.status, 200);
      assert.strictEqual(r1.headers.get('x-ratelimit-remaining'), '1');

      const r2 = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': TEST_SHARED_SECRET,
          'X-Forwarded-For': '127.0.0.1',
        },
        body: JSON.stringify({ query: 'Dentists' }),
      });
      assert.strictEqual(r2.status, 200);
      assert.strictEqual(r2.headers.get('x-ratelimit-remaining'), '0');

      // Request 3 blocked with 429
      const r3 = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': TEST_SHARED_SECRET,
          'X-Forwarded-For': '127.0.0.1',
        },
        body: JSON.stringify({ query: 'Dentists' }),
      });
      assert.strictEqual(r3.status, 429);
      assert.strictEqual(r3.headers.get('x-ratelimit-remaining'), '0');
      assert.ok(Number(r3.headers.get('retry-after')) >= 1);
      const b3 = await r3.json();
      assert.strictEqual(b3.success, false);
      assert.ok(b3.retryAfterSeconds >= 1);

      // Advance clock past windowMs -> quota resets
      nowMs += 60_001;
      const r4 = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': TEST_SHARED_SECRET,
        },
        body: JSON.stringify({ query: 'Dentists' }),
      });
      assert.strictEqual(r4.status, 200);
    });
  });

  await runTest('6. Request validation enforces query/location bounds, default location, and blocks bulk/unsupported fields', () => {
    assert.strictEqual(validateGoogleMapsSearchBody(null).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody([]).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: '' }).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: '   ' }).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: 123 }).valid, false);

    // Exact max query & location lengths succeed; +1 char fails
    const maxQuery = 'a'.repeat(GOOGLE_MAPS_QUERY_MAX_LENGTH);
    const overQuery = 'a'.repeat(GOOGLE_MAPS_QUERY_MAX_LENGTH + 1);
    const maxLoc = 'b'.repeat(GOOGLE_MAPS_LOCATION_MAX_LENGTH);
    const overLoc = 'b'.repeat(GOOGLE_MAPS_LOCATION_MAX_LENGTH + 1);

    const vDefault = validateGoogleMapsSearchBody({ query: maxQuery });
    assert.strictEqual(vDefault.valid, true);
    if (vDefault.valid) {
      assert.strictEqual(vDefault.location, GOOGLE_MAPS_DEFAULT_LOCATION);
    }

    assert.strictEqual(validateGoogleMapsSearchBody({ query: overQuery }).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: 'SaaS', location: maxLoc }).valid, true);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: 'SaaS', location: overLoc }).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: 'SaaS', location: '' }).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: 'SaaS', location: 42 }).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: 'SaaS\n', location: 'Pune' }).valid, false);
    assert.strictEqual(validateGoogleMapsSearchBody({ query: 'SaaS', location: 'Pune\t' }).valid, false);

    // Reject unsupported bulk/pagination/fieldMask override parameters
    assert.strictEqual(
      validateGoogleMapsSearchBody({ query: 'SaaS', bulkExport: true }).valid,
      false
    );
    assert.strictEqual(
      validateGoogleMapsSearchBody({ query: 'SaaS', pageToken: 'abc' }).valid,
      false
    );
    assert.strictEqual(
      validateGoogleMapsSearchBody({ query: 'SaaS', maxResultCount: 100 }).valid,
      false
    );
  });

  await runTest('7. Upstream error responses (503, 502, 504) never leak Google API keys or internal credentials', async () => {
    // Missing Google Maps API key -> 503 without secret disclosure
    const unconfiguredHandler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => '',
      getSharedSecret: () => TEST_SHARED_SECRET,
      getAuthenticatedUser: () => null,
      fetchFn: (async () => new Response('{}', { status: 200 })) as typeof fetch,
    });
    await withExpressServer(unconfiguredHandler, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': TEST_SHARED_SECRET },
        body: JSON.stringify({ query: 'SaaS' }),
      });
      assert.strictEqual(res.status, 503);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(!JSON.stringify(body).includes('AIza'));
      assert.ok(!JSON.stringify(body).includes(TEST_SHARED_SECRET));
    });

    // Upstream 403 -> mapped to 502, never leaks Google API key
    const upstream403Handler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => MOCK_GMAPS_KEY,
      getSharedSecret: () => TEST_SHARED_SECRET,
      getAuthenticatedUser: () => null,
      fetchFn: (async () =>
        new Response(
          JSON.stringify({
            error: { message: `API key ${MOCK_GMAPS_KEY} is not authorized` },
          }),
          { status: 403 }
        )) as typeof fetch,
    });
    await withExpressServer(upstream403Handler, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': TEST_SHARED_SECRET },
        body: JSON.stringify({ query: 'SaaS' }),
      });
      assert.strictEqual(res.status, 502);
      const raw = await res.text();
      assert.ok(!raw.includes(MOCK_GMAPS_KEY), 'Response must not include Google API key');
      assert.ok(!raw.includes(TEST_SHARED_SECRET), 'Response must not include shared secret');
    });

    // Upstream 429 -> mapped to 503 cleanly
    const upstream429Handler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => MOCK_GMAPS_KEY,
      getSharedSecret: () => TEST_SHARED_SECRET,
      getAuthenticatedUser: () => null,
      fetchFn: (async () =>
        new Response(JSON.stringify({ error: { message: 'Quota exceeded' } }), { status: 429 })
      ) as typeof fetch,
    });
    await withExpressServer(upstream429Handler, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': TEST_SHARED_SECRET },
        body: JSON.stringify({ query: 'SaaS' }),
      });
      assert.strictEqual(res.status, 503);
    });

    // Upstream TimeoutError -> 504
    const timeoutHandler = createGoogleMapsSearchHandler({
      getGoogleMapsApiKey: () => MOCK_GMAPS_KEY,
      getSharedSecret: () => TEST_SHARED_SECRET,
      getAuthenticatedUser: () => null,
      fetchFn: (async () => {
        const err: any = new Error('The operation was aborted due to timeout');
        err.name = 'TimeoutError';
        throw err;
      }) as typeof fetch,
    });
    await withExpressServer(timeoutHandler, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/googlemaps/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': TEST_SHARED_SECRET },
        body: JSON.stringify({ query: 'SaaS' }),
      });
      assert.strictEqual(res.status, 504);
    });

    // Direct redaction check
    const redacted = sanitizeUpstreamMapsError(
      `Failed with ${MOCK_GMAPS_KEY} and Bearer tok_1234567890 and ${TEST_SHARED_SECRET}`,
      [MOCK_GMAPS_KEY, TEST_SHARED_SECRET]
    );
    assert.ok(!redacted.includes(MOCK_GMAPS_KEY));
    assert.ok(!redacted.includes(TEST_SHARED_SECRET));
    assert.ok(!redacted.includes('tok_1234567890'));
  });

  console.log(`\n  GOOGLE MAPS M2M ACCESS RESULTS: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGoogleMapsM2mAccessTests().then((res) => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
