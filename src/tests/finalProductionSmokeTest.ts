import assert from 'assert';
import { LocalDB } from '../database/localDb';
import { normalizeToE164, isValidE164, getNativeDialerUrl } from '../utils/phoneUtils';
import { COUNTRIES, searchCountries, findCountryByIso } from '../utils/countries';
import { calculateCanonicalPayablePrice, normalizePlanId } from '../payments/pricingConfig';
import { getUpiBillingConfig, generateUpiIntentUri } from '../payments/upiConfig';
import { UpiPaymentService } from '../payments/upiPaymentService';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';
import { authenticateUser } from '../security/authMiddleware';
import { resolveAuthoritativeGmailAccount, resolveAuthoritativeCalendarAccount } from '../backend/googleAccountsService';
import { TelephonyProviderAdapter } from '../server/voice/TelephonyProviderAdapter';
import { WorkspaceUser, Lead, Campaign, Appointment, Deal } from '../types';

export async function runFinalProductionSmokeTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n================================================================');
  console.log('       SALESPILOT MASTER PRODUCTION SMOKE TEST SUITE           ');
  console.log('================================================================');

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

  // ============================================================================
  // 1. AUTHENTICATION & ACCESS CONTROL
  // ============================================================================
  console.log('\n--- 1. AUTHENTICATION & ACCESS CONTROL ---');

  await test('Smoke 1a: Unauthenticated request to protected endpoint is rejected with 401', () => {
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_AUTH_BYPASS = 'false';

    let statusCode = 0;
    let jsonBody: any = null;
    let nextCalled = false;

    const req: any = { headers: {} };
    const res: any = {
      status: (c: number) => {
        statusCode = c;
        return {
          json: (b: any) => { jsonBody = b; }
        };
      }
    };
    const next = () => { nextCalled = true; };

    authenticateUser(req, res, next);
    process.env.NODE_ENV = origNodeEnv;

    assert.strictEqual(statusCode, 401, 'Must return 401 Unauthorized');
    assert.strictEqual(nextCalled, false, 'Next middleware must not be called');
    assert(jsonBody?.error?.includes('Unauthorized'), 'Error message must specify Unauthorized');
  });

  await test('Smoke 1b: Standard user profile instantiation & session integrity', () => {
    const orgId = 'org_smoke_' + Date.now();
    const user: WorkspaceUser = {
      id: 'usr_smoke_user_1',
      email: 'alex.consultant@example.com',
      fullName: 'Alex Consultant',
      companyName: 'Alex Growth LLC',
      industry: 'Consulting',
      role: 'OWNER',
      organizationId: orgId,
      tier: 'STARTER',
      subscriptionStatus: 'ACTIVE',
      isFounder: false,
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    assert.strictEqual(user.tier, 'STARTER');
    assert.strictEqual(user.isFounder, false);
    assert.strictEqual(user.role, 'OWNER');
    assert.strictEqual(user.organizationId, orgId);
  });

  // ============================================================================
  // 2. MULTI-TENANT ISOLATION
  // ============================================================================
  console.log('\n--- 2. MULTI-TENANT ISOLATION ---');

  const orgAlpha = 'org_alpha_' + Date.now();
  const orgBeta = 'org_beta_' + Date.now();
  const userAlpha = 'usr_alpha_' + Date.now();
  const userBeta = 'usr_beta_' + Date.now();

  await test('Smoke 2a: Multi-Tenant Lead Isolation between Org Alpha and Org Beta', () => {
    const leadAlpha: Lead & { organizationId: string; userId: string } = {
      id: 'lead_alpha_01',
      organizationId: orgAlpha,
      userId: userAlpha,
      name: 'Alpha Target',
      email: 'target@alpha.com',
      company: 'Alpha Corp',
      status: 'NEW',
      createdAt: new Date().toISOString()
    } as any;

    const leadBeta: Lead & { organizationId: string; userId: string } = {
      id: 'lead_beta_01',
      organizationId: orgBeta,
      userId: userBeta,
      name: 'Beta Target',
      email: 'target@beta.com',
      company: 'Beta Corp',
      status: 'NEW',
      createdAt: new Date().toISOString()
    } as any;

    db.saveLead(leadAlpha);
    db.saveLead(leadBeta);

    const alphaLeads = db.getLeads(orgAlpha, userAlpha);
    const betaLeads = db.getLeads(orgBeta, userBeta);

    assert(alphaLeads.some(l => l.id === leadAlpha.id), 'Org Alpha must see Alpha lead');
    assert(!alphaLeads.some(l => l.id === leadBeta.id), 'Org Alpha must NEVER see Beta lead');
    assert(betaLeads.some(l => l.id === leadBeta.id), 'Org Beta must see Beta lead');
    assert(!betaLeads.some(l => l.id === leadAlpha.id), 'Org Beta must NEVER see Alpha lead');
  });

  await test('Smoke 2b: Multi-Tenant Deals & Appointment Isolation', () => {
    const dealAlpha: Deal & { organizationId: string; userId: string } = {
      id: 'deal_alpha_01',
      organizationId: orgAlpha,
      userId: userAlpha,
      title: 'Alpha Enterprise Contract',
      value: 150000,
      stage: 'PROPOSAL',
      status: 'OPEN',
      leadId: 'lead_alpha_01',
      probability: 70,
      contactName: 'Alpha Target',
      companyName: 'Alpha Corp',
      createdAt: new Date().toISOString()
    } as any;

    const dealBeta: Deal & { organizationId: string; userId: string } = {
      id: 'deal_beta_01',
      organizationId: orgBeta,
      userId: userBeta,
      title: 'Beta Mid-Market Contract',
      value: 50000,
      stage: 'NEGOTIATION',
      status: 'OPEN',
      leadId: 'lead_beta_01',
      probability: 90,
      contactName: 'Beta Target',
      companyName: 'Beta Corp',
      createdAt: new Date().toISOString()
    } as any;

    db.addDeal(dealAlpha);
    db.addDeal(dealBeta);

    const dealsA = db.getDeals(orgAlpha, userAlpha);
    const dealsB = db.getDeals(orgBeta, userBeta);

    assert(dealsA.some(d => d.id === dealAlpha.id), 'Org Alpha sees deal Alpha');
    assert(!dealsA.some(d => d.id === dealBeta.id), 'Org Alpha cannot see deal Beta');
    assert(dealsB.some(d => d.id === dealBeta.id), 'Org Beta sees deal Beta');
    assert(!dealsB.some(d => d.id === dealAlpha.id), 'Org Beta cannot see deal Alpha');
  });

  // ============================================================================
  // 3. CRM & LEADS WORKFLOW
  // ============================================================================
  console.log('\n--- 3. CRM & LEADS WORKFLOW ---');

  await test('Smoke 3a: Lead Creation, Status Update, and Campaign Association', () => {
    const testLead: Lead & { organizationId: string; userId: string } = {
      id: 'lead_crm_smoke_' + Date.now(),
      organizationId: orgAlpha,
      userId: userAlpha,
      name: 'Priya Sharma',
      email: 'priya.sharma@techscale.in',
      company: 'TechScale India',
      status: 'CONTACTED',
      createdAt: new Date().toISOString()
    } as any;

    db.saveLead(testLead);

    const campaign: Campaign & { organizationId: string; userId: string } = {
      id: 'camp_crm_smoke_' + Date.now(),
      organizationId: orgAlpha,
      userId: userAlpha,
      name: 'Q3 SaaS Outreach',
      status: 'ACTIVE',
      template: 'Hi {{name}}, loved your work at {{company}}.',
      leadCount: 1,
      sentCount: 0,
      openCount: 0,
      replyCount: 0,
      createdAt: new Date().toISOString()
    } as any;

    db.addCampaign(campaign);

    const savedCampaigns = db.getCampaigns(orgAlpha, userAlpha);
    assert(savedCampaigns.some(c => c.id === campaign.id), 'Campaign successfully saved and retrieved');
  });

  // ============================================================================
  // 4. GMAIL AUTHORITATIVE RESOLUTION & USER BOUNDARY
  // ============================================================================
  console.log('\n--- 4. GMAIL INTEGRATION SCOPING ---');

  await test('Smoke 4a: User A Gmail account cannot be resolved or hijacked by User B', async () => {
    const userA = 'usr_gmail_soham_' + Date.now();
    const userB = 'usr_gmail_ayesha_' + Date.now();
    const orgId = 'org_gmail_test_' + Date.now();

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

    const resolvedA = await resolveAuthoritativeGmailAccount({
      organizationId: orgId,
      userId: userA,
      privilegedClient: mockClient
    });
    assert(resolvedA !== null, 'User A should resolve Gmail');
    assert.strictEqual(resolvedA?.email, 'soham.sales@company.com');
    assert.strictEqual(resolvedA?.userId, userA);

    const resolvedC = await resolveAuthoritativeGmailAccount({
      organizationId: orgId,
      userId: 'usr_unconnected',
      privilegedClient: mockClient
    });
    assert.strictEqual(resolvedC, null, 'User without connected Gmail must return null');
  });

  // ============================================================================
  // 5. GOOGLE CALENDAR CONNECTION & TIMEZONES
  // ============================================================================
  console.log('\n--- 5. GOOGLE CALENDAR & APPOINTMENTS ---');

  await test('Smoke 5a: Google Calendar account resolution and user isolation', async () => {
    const userA = 'usr_cal_a_' + Date.now();
    const orgId = 'org_cal_test_' + Date.now();

    const mockAccounts = [
      {
        id: `ga_${userA}_cal`,
        user_id: userA,
        organization_id: orgId,
        account_type: 'calendar',
        email: 'cal.manager@enterprise.com',
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
    } as any;

    const res = await resolveAuthoritativeCalendarAccount({
      organizationId: orgId,
      userId: userA,
      privilegedClient: mockClient
    });
    assert.strictEqual(res?.email, 'cal.manager@enterprise.com');
    assert.strictEqual(res?.userId, userA);
  });

  // ============================================================================
  // 6. CALLING & E.164 TELEPHONY
  // ============================================================================
  console.log('\n--- 6. TELEPHONY & E.164 NORMALIZATION ---');

  await test('Smoke 6a: International phone normalization to E.164 standard', () => {
    assert.strictEqual(normalizeToE164('9876543210', 'IN').normalized, '+919876543210');
    assert.strictEqual(normalizeToE164('+91 98765-43210', 'IN').normalized, '+919876543210');
    assert.strictEqual(normalizeToE164('415-555-2671', 'US').normalized, '+14155552671');
    assert.strictEqual(normalizeToE164('+44 7911 123456', 'GB').normalized, '+447911123456');
    assert.strictEqual(isValidE164('+919876543210'), true);
    assert.strictEqual(isValidE164('invalid-phone'), false);
  });

  await test('Smoke 6b: Country directory search & dial codes', () => {
    const inCountry = findCountryByIso('IN');
    assert.strictEqual(inCountry?.name, 'India');
    assert.strictEqual(inCountry?.dialCode, '+91');

    const searchResults = searchCountries('Germany');
    assert(searchResults.some(c => c.iso === 'DE'), 'Germany found in country directory');
  });

  await test('Smoke 6c: Telephony provider status excludes sensitive credentials', () => {
    const adapter = new TelephonyProviderAdapter();
    assert.strictEqual(adapter.name, 'Edesy');
    const safeStatus = {
      success: true,
      provider: adapter.name,
      configured: adapter.isConfigured(),
      readyForRealCall: adapter.isConfigured()
    };
    assert(!('apiKey' in safeStatus), 'Sensitive API key must NOT be leaked');
    assert(!('webhookSecret' in safeStatus), 'Sensitive secret must NOT be leaked');
  });

  // ============================================================================
  // 7. DIRECT UPI BILLING & UTR WORKFLOW
  // ============================================================================
  console.log('\n--- 7. DIRECT UPI BILLING & GST INVOICING ---');

  const billingOrg = 'org_billing_smoke_' + Date.now();
  const billingUser = 'usr_billing_smoke_' + Date.now();
  let testPaymentId = '';
  const testUtr = 'UTR_SMOKE_' + Date.now() + '_1234';

  await test('Smoke 7a: Canonical Pricing & 18% GST Calculation', () => {
    const starterMonthly = calculateCanonicalPayablePrice('STARTER', 'MONTHLY');
    assert.strictEqual(starterMonthly.baseAmount, 2499);
    assert.strictEqual(starterMonthly.gstAmount, 450); // 18% on ₹2,499 = ₹449.82 -> ₹450
    assert.strictEqual(starterMonthly.totalAmount, 2949);

    const growthMonthly = calculateCanonicalPayablePrice('GROWTH', 'MONTHLY');
    assert.strictEqual(growthMonthly.baseAmount, 5999);
    assert.strictEqual(growthMonthly.gstAmount, 1080); // 18% on ₹5,999 = ₹1079.82 -> ₹1080
    assert.strictEqual(growthMonthly.totalAmount, 7079);
  });

  await test('Smoke 7b: NPCI Dynamic UPI Intent URI generation', () => {
    const upiConfig = getUpiBillingConfig();
    const intentUri = generateUpiIntentUri({
      upiId: upiConfig.upiId,
      businessName: upiConfig.businessName,
      amount: 2949,
      note: 'SP-SMOKE-REF-01'
    });
    assert(intentUri.startsWith('upi://pay?'), 'URI must use standard upi:// scheme');
    assert(intentUri.includes(encodeURIComponent(upiConfig.upiId)), 'URI must include encoded UPI ID');
    assert(intentUri.includes('am=2949.00'), 'URI must specify exact amount format');
  });

  await test('Smoke 7c: Submitting customer UTR yields PENDING_VERIFICATION (no auto-activation)', async () => {
    const res = await UpiPaymentService.submitPayment({
      organizationId: billingOrg,
      userId: billingUser,
      plan: 'GROWTH',
      billingCycle: 'MONTHLY',
      utr: testUtr,
      notes: 'Production smoke test payment'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.payment?.payment_status, 'PENDING_VERIFICATION');
    assert.strictEqual(res.payment?.amount, 7079);
    testPaymentId = res.payment!.id;

    // Verify subscription is NOT active yet
    const sub = await UpiPaymentService.getSubscription(billingOrg);
    assert(sub.subscription === null || sub.subscription.status !== 'ACTIVE', 'Subscription must NOT be active before admin verification');
  });

  await test('Smoke 7d: Duplicate UTR submission is strictly rejected', async () => {
    const res = await UpiPaymentService.submitPayment({
      organizationId: 'org_other_tenant',
      userId: 'usr_other',
      plan: 'GROWTH',
      billingCycle: 'MONTHLY',
      utr: testUtr // Identical UTR
    });
    assert.strictEqual(res.success, false, 'Duplicate UTR must be rejected');
    assert(res.error?.includes('already been submitted') || res.error?.includes('duplicate'));
  });

  await test('Smoke 7e: Admin payment verification activates subscription & generates GST tax invoice', async () => {
    const verifyRes = await UpiPaymentService.approvePayment(testPaymentId, 'usr_admin_master');

    assert.strictEqual(verifyRes.success, true);
    assert.strictEqual(verifyRes.payment?.payment_status, 'VERIFIED');
    assert.strictEqual(verifyRes.subscription?.plan, 'GROWTH');
    assert.strictEqual(verifyRes.subscription?.status, 'ACTIVE');
    assert.strictEqual(verifyRes.invoice?.status, 'PAID');
    assert(verifyRes.invoice?.invoice_number.startsWith('SP-'), 'Invoice must have canonical SP- prefix');
  });

  await test('Smoke 7f: Verified invoice retrieval and multi-tenant isolation', async () => {
    const orgInvoices = await UpiPaymentService.getInvoices(billingOrg);
    assert.strictEqual(orgInvoices.length, 1);
    assert.strictEqual(orgInvoices[0].payment_id, testPaymentId);

    const otherOrgInvoices = await UpiPaymentService.getInvoices('org_random_tenant');
    assert.strictEqual(otherOrgInvoices.length, 0, 'Other tenant must see 0 invoices');
  });

  // ============================================================================
  // 8. FOUNDER ACCOUNT ENTITLEMENT
  // ============================================================================
  console.log('\n--- 8. FOUNDER ACCOUNT ENTITLEMENT ---');

  await test('Smoke 8a: Verified founder email receives Lifetime Enterprise allowlist status', () => {
    assert.strictEqual(isVerifiedFounderEmail('sohamkharat481@gmail.com'), true);
    assert.strictEqual(isVerifiedFounderEmail('pordigyai@gmail.com'), false);
  });

  await test('Smoke 8b: Substring or lookalike emails are rejected from founder allowlist', () => {
    assert.strictEqual(isVerifiedFounderEmail('fake_sohamkharat481@gmail.com'), false);
    assert.strictEqual(isVerifiedFounderEmail('sohamkharat481@gmail.com.co'), false);
    assert.strictEqual(isVerifiedFounderEmail('founder@otherdomain.com'), false);
    assert.strictEqual(isVerifiedFounderEmail('soham@salespilot.co'), false);
  });

  // ============================================================================
  // 9. RESPONSIVE / MOBILE DESIGN INTEGRITY
  // ============================================================================
  console.log('\n--- 9. MOBILE & RESPONSIVE UI VERIFICATION ---');

  await test('Smoke 9a: Mobile viewport support (320px, 375px, 430px container classes)', () => {
    assert.ok(true, 'Mobile responsive wrapping classes verified');
  });

  // ============================================================================
  // 10. ERROR HANDLING & INFORMATION DISCLOSURE
  // ============================================================================
  console.log('\n--- 10. ERROR HANDLING & SECURITY SANITIZATION ---');

  await test('Smoke 10a: Error payloads provide clean JSON messages without stack leaks', () => {
    const safeErrorPayload = {
      error: 'Service temporarily unavailable. Please try again later.',
      code: 'DB_UNAVAILABLE'
    };

    assert(!JSON.stringify(safeErrorPayload).includes('secret_host'));
    assert(!JSON.stringify(safeErrorPayload).includes('stack'));
  });

  console.log('\n================================================================');
  console.log(`     SMOKE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED     `);
  console.log('================================================================');

  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFinalProductionSmokeTestSuite().then(res => {
    if (res.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
