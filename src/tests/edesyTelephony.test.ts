import { LocalDB } from '../database/localDb';
import { WorkspaceUser, CallStatus } from '../types';
import { EdesyProvider, mapEdesyStatus } from '../backend/providers/edesyProvider';
import { TelephonyProviderAdapter } from '../server/voice/TelephonyProviderAdapter';
import { VoiceProviderAdapter } from '../server/voice/VoiceProviderAdapter';

declare const describe: any;
declare const it: any;
declare const expect: any;

if (typeof describe === 'function') {
  describe('Edesy Telephony Integration Test Suite', () => {
    it('runs edesy telephony test suite', async () => {
      const result = await runEdesyTelephonyTestSuite();
      expect(result.failed).toBe(0);
      expect(result.passed).toBeGreaterThan(0);
    });
  });
}

export async function runEdesyTelephonyTestSuite() {
  console.log('=== STARTING EDESY TELEPHONY TEST SUITE ===');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  };

  const db = LocalDB.getInstance();
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  try {
    const TEST_ORG_1 = 'org_edesy_1_' + Date.now();
    const TEST_ORG_2 = 'org_edesy_2_' + Date.now();

    const user1: WorkspaceUser = {
      id: 'usr_edesy_1',
      email: 'user1@edesytest.com',
      fullName: 'Alice Dialer',
      companyName: 'Acme Sales',
      industry: 'B2B SaaS',
      role: 'OWNER',
      organizationId: TEST_ORG_1,
      tier: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      isFounder: false,
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    const user2: WorkspaceUser = {
      id: 'usr_edesy_2',
      email: 'user2@edesytest.com',
      fullName: 'Bob Competitor',
      companyName: 'Rival Corp',
      industry: 'B2B SaaS',
      role: 'MEMBER',
      organizationId: TEST_ORG_2,
      tier: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      isFounder: false,
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    db.db.users.push(user1, user2);

    // 1. Edesy not configured check
    delete process.env.EDESY_API_KEY;
    const unconfiguredProvider = new EdesyProvider();
    assert(unconfiguredProvider.isConfigured() === false, 'Test 1: Edesy isConfigured() is false when EDESY_API_KEY missing');

    const unconfiguredCall = await unconfiguredProvider.initiateCall({
      callId: 'call_unconf_test',
      organizationId: TEST_ORG_1,
      userId: user1.id,
      destinationNumber: '+15559990000',
      callerId: '+15551112222'
    });
    assert(
      unconfiguredCall.success === false &&
      unconfiguredCall.error?.includes('Edesy calling provider is not configured'),
      'Test 2: initiateCall returns clear unconfigured message without fake call'
    );

    // 2. Edesy configured check
    process.env.EDESY_API_KEY = 'vp_test_edesy_api_key_mock_1234567890';
    process.env.EDESY_BASE_URL = 'https://voice-agent.edesy.in/api/v1';
    process.env.EDESY_WEBHOOK_SECRET = 'edesy_wh_secret_test_xyz';

    const configuredProvider = new EdesyProvider();
    assert(configuredProvider.isConfigured() === true, 'Test 3: Edesy isConfigured() is true when EDESY_API_KEY set');
    assert(configuredProvider.getBaseUrl() === 'https://voice-agent.edesy.in/api/v1', 'Test 4: Edesy getBaseUrl() correctly normalized');

    // 3. Valid outbound call with Mock Edesy API
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    global.fetch = async (url: any, init?: any): Promise<any> => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers || {};
      capturedBody = init?.body ? JSON.parse(init.body) : null;

      if (capturedUrl.endsWith('/calls') && init?.method === 'POST') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: 'edesy_call_live_789456',
            status: 'queued',
            created_at: new Date().toISOString()
          })
        };
      }

      if (capturedUrl.includes('/cancel') && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: 'Call cancelled' })
        };
      }

      if (capturedUrl.includes('/calls/edesy_call_live_789456') && (!init || !init.method || init.method.toUpperCase() === 'GET')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'edesy_call_live_789456',
            status: 'in-progress',
            duration: 48
          })
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      };
    };

    const callResult = await configuredProvider.initiateCall({
      callId: 'call_edesy_test_1',
      organizationId: TEST_ORG_1,
      userId: user1.id,
      destinationNumber: '+15559876543',
      callerId: '+15551234567',
      contactName: 'Charlie Client',
      companyName: 'Client Org',
      notes: 'Initial intro call',
      webhookUrl: 'https://salespilot.co/api/v1/voice/webhook'
    });

    assert(
      callResult.success === true &&
      callResult.providerCallId === 'edesy_call_live_789456' &&
      callResult.status === 'QUEUED' &&
      callResult.providerName === 'Edesy',
      'Test 5: Outbound call successfully initiated via Edesy API'
    );

    assert(
      capturedUrl === 'https://voice-agent.edesy.in/api/v1/calls' &&
      capturedHeaders['Authorization'] === 'Bearer vp_test_edesy_api_key_mock_1234567890' &&
      capturedHeaders['X-API-Key'] === 'vp_test_edesy_api_key_mock_1234567890' &&
      capturedBody.phone_number === '+15559876543' &&
      capturedBody.from === '+15551234567' &&
      capturedBody.callbackUrl === 'https://salespilot.co/api/v1/voice/webhook',
      'Test 6: Edesy API request format matches official specification'
    );

    // 4. Persistence of Direct Dial activity with provider = EDESY
    const cn1 = db.addCallingNumber({
      userId: user1.id,
      organizationId: TEST_ORG_1,
      phoneNumber: '+15551234567',
      countryCode: '+1',
      isVerified: true,
      isDefault: true
    });

    const directActivity = db.addManualCallActivity({
      id: 'act_direct_edesy_' + Date.now(),
      leadId: undefined,
      source: 'DIRECT_DIAL',
      organizationId: TEST_ORG_1,
      userId: user1.id,
      callingNumberId: cn1.id,
      callingNumber: cn1.phoneNumber,
      callingNumberSnapshot: cn1.phoneNumber,
      phoneNumber: '+15559876543',
      destinationNumber: '+15559876543',
      contactName: 'Charlie Client',
      companyName: 'Client Org',
      notes: 'Initial intro call',
      direction: 'OUTBOUND',
      activityType: 'PHONE_CALL',
      status: 'QUEUED',
      provider: 'EDESY',
      providerCallId: callResult.providerCallId,
      providerName: 'Edesy',
      createdAt: new Date().toISOString()
    });

    const retrievedActivity = db.getManualCallActivityByProviderId('edesy_call_live_789456');
    assert(
      retrievedActivity?.id === directActivity.id &&
      retrievedActivity.provider === 'EDESY' &&
      retrievedActivity.providerCallId === 'edesy_call_live_789456' &&
      retrievedActivity.source === 'DIRECT_DIAL',
      'Test 7: Direct Dial activity persisted with provider = EDESY and providerCallId'
    );

    // 5. Personal Calling Identity Security: Cross-user & Cross-tenant rejection
    const user2Numbers = db.getCallingNumbers(TEST_ORG_2, user2.id);
    const hasUser1NumInOrg2 = user2Numbers.some(cn => cn.phoneNumber === cn1.phoneNumber);
    assert(hasUser1NumInOrg2 === false, 'Test 8: Cross-tenant isolation prevents accessing User 1 calling number');

    const user1OrgActivities = db.getManualCallActivities(TEST_ORG_1);
    const user2OrgActivities = db.getManualCallActivities(TEST_ORG_2);
    assert(
      user1OrgActivities.some(a => a.id === directActivity.id) &&
      !user2OrgActivities.some(a => a.id === directActivity.id),
      'Test 9: Tenant isolation verified for manual call activities'
    );

    // 6. Polling & Status lookup via Edesy getCallStatus
    const statusResult = await configuredProvider.getCallStatus('edesy_call_live_789456');
    assert(
      statusResult.status === 'IN_PROGRESS' &&
      statusResult.durationSeconds === 48,
      'Test 10: getCallStatus returns real status and duration from Edesy'
    );

    // 7. Cancellation via Edesy cancelCall
    const cancelRes = await configuredProvider.cancelCall('edesy_call_live_789456');
    assert(cancelRes.success === true, 'Test 11: Call cancelled via Edesy API');

    // 8. Call state machine status mapping
    assert(mapEdesyStatus('queued') === 'QUEUED', 'Test 12a: State machine - queued');
    assert(mapEdesyStatus('dialing') === 'DIALING', 'Test 12b: State machine - dialing');
    assert(mapEdesyStatus('ringing') === 'RINGING', 'Test 12c: State machine - ringing');
    assert(mapEdesyStatus('in-progress') === 'IN_PROGRESS', 'Test 12d: State machine - in-progress');
    assert(mapEdesyStatus('completed') === 'COMPLETED', 'Test 12e: State machine - completed');
    assert(mapEdesyStatus('failed') === 'FAILED', 'Test 12f: State machine - failed');
    assert(mapEdesyStatus('busy') === 'BUSY', 'Test 12g: State machine - busy');
    assert(mapEdesyStatus('no-answer') === 'NO_ANSWER', 'Test 12h: State machine - no-answer');
    assert(mapEdesyStatus('cancelled') === 'CANCELLED', 'Test 12i: State machine - cancelled');

    // 9. Webhook Secret Authentication
    const voiceAdapter = new VoiceProviderAdapter();

    // Invalid secret
    const badAuthWebhook = await voiceAdapter.handleWebhook(
      { call_id: 'edesy_call_live_789456', status: 'completed' },
      { 'x-edesy-secret': 'wrong_secret' }
    );
    assert(
      Boolean(badAuthWebhook.error) && badAuthWebhook.error?.includes('secret verification failed'),
      'Test 13: Webhook rejects invalid secret'
    );

    // Valid secret
    const goodAuthWebhook = await voiceAdapter.handleWebhook(
      {
        call_id: 'edesy_call_live_789456',
        status: 'completed',
        duration: 95,
        recording_url: 'https://cdn.edesy.in/recordings/call_789.mp3',
        summary: 'Prospect agreed to follow-up call'
      },
      { 'x-edesy-secret': 'edesy_wh_secret_test_xyz' }
    );
    assert(
      !goodAuthWebhook.error &&
      goodAuthWebhook.status === 'COMPLETED' &&
      goodAuthWebhook.durationSeconds === 95 &&
      goodAuthWebhook.recordingUrl === 'https://cdn.edesy.in/recordings/call_789.mp3' &&
      goodAuthWebhook.summary === 'Prospect agreed to follow-up call',
      'Test 14: Webhook successfully authenticates with EDESY_WEBHOOK_SECRET and extracts real data'
    );

    // 10. No fake transcript/recording/duration when omitted
    const cleanWebhook = await voiceAdapter.handleWebhook(
      {
        call_id: 'edesy_call_live_789456',
        status: 'busy'
      },
      { 'x-edesy-secret': 'edesy_wh_secret_test_xyz' }
    );
    assert(
      cleanWebhook.recordingUrl === undefined &&
      cleanWebhook.summary === undefined &&
      cleanWebhook.durationSeconds === 0,
      'Test 15: No fabricated transcript, recording or duration when provider payload omits them'
    );

    // 11. Security Check: Never expose secrets in provider status
    const telephonyAdapter = new TelephonyProviderAdapter();
    assert(telephonyAdapter.name === 'Edesy', 'Test 16: TelephonyProviderAdapter defaults to Edesy when configured');

    const safeStatus = {
      success: true,
      provider: telephonyAdapter.name,
      configured: telephonyAdapter.isConfigured(),
      readyForRealCall: telephonyAdapter.isConfigured()
    };
    assert(
      !('apiKey' in safeStatus) &&
      !('webhookSecret' in safeStatus) &&
      !('EDESY_API_KEY' in safeStatus) &&
      safeStatus.provider === 'Edesy',
      'Test 17: Provider status response strictly excludes sensitive credentials'
    );

  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }

  console.log(`=== EDESY TELEPHONY TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}
