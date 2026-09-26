import assert from 'assert';
import { LocalDB } from '../database/localDb';
import { normalizeToE164, isValidE164, getNativeDialerUrl } from '../utils/phoneUtils';
import { COUNTRIES, searchCountries, findCountryByIso } from '../utils/countries';
import { resolveAuthoritativeGmailAccount, resolveAuthoritativeCalendarAccount } from '../backend/googleAccountsService';
import { Lead, Deal } from '../types';

export async function runMultiUserIsolationIntegrationsTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING MULTI-USER ISOLATION & INTEGRATIONS TEST SUITE ===');
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message || err);
      failed++;
    }
  };

  const db = LocalDB.getInstance();

  // ==========================================
  // SECTION 1: LEAD & CRM DATA ISOLATION
  // ==========================================
  await test('Multi-User Lead Isolation: User A cannot see User B leads', async () => {
    const userA = 'usr_iso_a_' + Date.now();
    const userB = 'usr_iso_b_' + Date.now();
    const orgId = 'org_test_iso_' + Date.now();

    const leadA: Lead & { organizationId: string; userId: string } = {
      id: 'lead_a_' + Date.now(),
      organizationId: orgId,
      userId: userA,
      name: 'Alice Prospect',
      email: 'alice@prospect.com',
      company: 'Alice Co',
      status: 'NEW',
      createdAt: new Date().toISOString()
    } as any;
    db.saveLead(leadA);

    const leadB: Lead & { organizationId: string; userId: string } = {
      id: 'lead_b_' + Date.now(),
      organizationId: orgId,
      userId: userB,
      name: 'Bob Prospect',
      email: 'bob@prospect.com',
      company: 'Bob Corp',
      status: 'NEW',
      createdAt: new Date().toISOString()
    } as any;
    db.saveLead(leadB);

    // Query for User A
    const leadsForA = db.getLeads(orgId, userA);
    assert(leadsForA.some(l => l.id === leadA.id), 'User A should see Lead A');
    assert(!leadsForA.some(l => l.id === leadB.id), 'User A must NOT see Lead B');

    // Query for User B
    const leadsForB = db.getLeads(orgId, userB);
    assert(leadsForB.some(l => l.id === leadB.id), 'User B should see Lead B');
    assert(!leadsForB.some(l => l.id === leadA.id), 'User B must NOT see Lead A');
  });

  await test('Multi-User Deals & Appointments Isolation', async () => {
    const userA = 'usr_deal_a_' + Date.now();
    const userB = 'usr_deal_b_' + Date.now();
    const orgId = 'org_deal_iso_' + Date.now();

    const dealA: Deal & { organizationId: string; userId: string } = {
      id: 'deal_a_' + Date.now(),
      organizationId: orgId,
      userId: userA,
      title: 'Enterprise Contract A',
      value: 50000,
      stage: 'PROPOSAL',
      createdAt: new Date().toISOString()
    } as any;
    db.addDeal(dealA);

    const dealB: Deal & { organizationId: string; userId: string } = {
      id: 'deal_b_' + Date.now(),
      organizationId: orgId,
      userId: userB,
      title: 'SMB Contract B',
      value: 5000,
      stage: 'QUALIFICATION',
      createdAt: new Date().toISOString()
    } as any;
    db.addDeal(dealB);

    const dealsForA = db.getDeals(orgId, userA);
    assert(dealsForA.some(d => d.id === dealA.id), 'User A should see Deal A');
    assert(!dealsForA.some(d => d.id === dealB.id), 'User A must NOT see Deal B');

    const dealsForB = db.getDeals(orgId, userB);
    assert(dealsForB.some(d => d.id === dealB.id), 'User B should see Deal B');
    assert(!dealsForB.some(d => d.id === dealA.id), 'User B must NOT see Deal A');
  });

  // ==========================================
  // SECTION 2: GMAIL & SENDER IDENTITY RESOLUTION
  // ==========================================
  await test('Gmail Sender Resolution: strictly scoped to authenticated user and organization', async () => {
    const userA = 'usr_gmail_soham_' + Date.now();
    const userB = 'usr_gmail_ayesha_' + Date.now();
    const orgId = 'org_gmail_test_' + Date.now();

    // Mock client to test resolveAuthoritativeGmailAccount
    const mockAccounts = [
      {
        id: `ga_${userA}_gmail`,
        user_id: userA,
        organization_id: orgId,
        account_type: 'gmail',
        email: 'soham.sales@company.com',
        access_token: 'token_soham_123',
        status: 'CONNECTED',
        created_at: new Date().toISOString()
      },
      {
        id: `ga_${userB}_gmail`,
        user_id: userB,
        organization_id: orgId,
        account_type: 'gmail',
        email: 'ayesha.sales@company.com',
        access_token: 'token_ayesha_456',
        status: 'CONNECTED',
        created_at: new Date().toISOString()
      }
    ];

    const createMockSupabase = () => ({
      from: (table: string) => ({
        select: () => ({
          in: (col: string, vals: any[]) => ({
            eq: (col1: string, val1: any) => ({
              not: () => ({
                eq: (col2: string, val2: any) => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => {
                        const acc = mockAccounts.find(a => 
                          (col1 === 'organization_id' ? a.organization_id === val1 : true) &&
                          (col2 === 'user_id' ? a.user_id === val2 : true)
                        );
                        return { data: acc || null, error: null };
                      }
                    })
                  })
                })
              })
            })
          })
        })
      })
    }) as any;

    const mockClient = createMockSupabase();

    // Resolution for User A
    const resolvedA = await resolveAuthoritativeGmailAccount({
      organizationId: orgId,
      userId: userA,
      privilegedClient: mockClient
    });
    assert(resolvedA !== null, 'User A should resolve Gmail');
    assert.strictEqual(resolvedA?.email, 'soham.sales@company.com', 'User A resolved email must match');
    assert.strictEqual(resolvedA?.userId, userA, 'User A resolved userId must match');

    // Resolution for User B
    const resolvedB = await resolveAuthoritativeGmailAccount({
      organizationId: orgId,
      userId: userB,
      privilegedClient: mockClient
    });
    assert(resolvedB !== null, 'User B should resolve Gmail');
    assert.strictEqual(resolvedB?.email, 'ayesha.sales@company.com', 'User B resolved email must match');
    assert.strictEqual(resolvedB?.userId, userB, 'User B resolved userId must match');

    // User without account returns null (no fallback)
    const resolvedC = await resolveAuthoritativeGmailAccount({
      organizationId: orgId,
      userId: 'usr_unconnected',
      privilegedClient: mockClient
    });
    assert.strictEqual(resolvedC, null, 'User without connected Gmail must return null');
  });

  // ==========================================
  // SECTION 3: ISO 3166-1 COUNTRIES & PHONE NORMALIZATION
  // ==========================================
  await test('ISO 3166-1 Country Dataset & Search', async () => {
    assert(COUNTRIES.length >= 200, `Country dataset must be complete (found ${COUNTRIES.length})`);
    
    const us = findCountryByIso('US');
    assert(us !== undefined && us.dialCode === '+1', 'US should have dialCode +1');

    const inCountry = findCountryByIso('IN');
    assert(inCountry !== undefined && inCountry.dialCode === '+91', 'IN should have dialCode +91');

    const ae = findCountryByIso('AE');
    assert(ae !== undefined && ae.dialCode === '+971', 'AE should have dialCode +971');

    const searchResults = searchCountries('united');
    assert(searchResults.length > 0, 'Search for "united" should return results');
    assert(searchResults.some(c => c.iso === 'US'), 'Search should include US');
    assert(searchResults.some(c => c.iso === 'GB'), 'Search should include GB');
    assert(searchResults.some(c => c.iso === 'AE'), 'Search should include AE (United Arab Emirates)');
  });

  await test('Phone E.164 Normalization & Native Dialer', async () => {
    const res1 = normalizeToE164('9876543210', 'IN');
    assert(res1.valid && res1.normalized === '+919876543210', 'Should normalize Indian number to +919876543210');

    const res2 = normalizeToE164('415-555-2671', 'US');
    assert(res2.valid && res2.normalized === '+14155552671', 'Should normalize US number to +14155552671');

    const res3 = normalizeToE164('+44 20 7946 0958');
    assert(res3.valid && res3.normalized === '+442079460958', 'Should recognize international +44 prefix');

    assert(isValidE164('+919876543210'), 'E.164 format check should pass');
    assert(!isValidE164('9876543210'), 'Raw number without + country code is not E.164');

    const telUrl = getNativeDialerUrl('+919876543210');
    assert.strictEqual(telUrl, 'tel:+919876543210', 'Native dialer URL format must be tel:E164');
  });

  // ==========================================
  // SECTION 4: GOOGLE CALENDAR VERIFICATION & ISOLATION
  // ==========================================
  await test('Google Calendar Multi-User Isolation & Verification', async () => {
    const userA = 'usr_cal_a_' + Date.now();
    const userB = 'usr_cal_b_' + Date.now();
    const orgId = 'org_cal_iso_' + Date.now();

    const calAccounts = [
      {
        id: `ga_${userA}_cal`,
        user_id: userA,
        organization_id: orgId,
        account_type: 'calendar',
        email: 'usera.calendar@company.com',
        access_token: 'valid_cal_token_123',
        status: 'CONNECTED',
        created_at: new Date().toISOString()
      }
    ];

    const mockClient = {
      from: (table: string) => ({
        select: () => ({
          in: (col: string, vals: any[]) => ({
            eq: (col1: string, val1: any) => ({
              eq: (col2: string, val2: any) => ({
                not: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => {
                        const acc = calAccounts.find(a => 
                          (col1 === 'organization_id' ? a.organization_id === val1 : true) &&
                          (col2 === 'user_id' ? a.user_id === val2 : true)
                        );
                        return { data: acc || null, error: null };
                      }
                    })
                  })
                })
              })
            })
          })
        })
      })
    } as any;

    const calA = await resolveAuthoritativeCalendarAccount({
      organizationId: orgId,
      userId: userA,
      privilegedClient: mockClient
    });
    assert(calA !== null, 'User A calendar should resolve');
    assert.strictEqual(calA?.status, 'CONNECTED', 'User A calendar status should be CONNECTED');
    assert.strictEqual(calA?.email, 'usera.calendar@company.com');

    const calB = await resolveAuthoritativeCalendarAccount({
      organizationId: orgId,
      userId: userB,
      privilegedClient: mockClient
    });
    assert.strictEqual(calB, null, 'User B calendar should return null (isolated)');
  });

  console.log(`\n=== MULTI-USER ISOLATION & INTEGRATIONS TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}
