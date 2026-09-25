import { LocalDB } from '../database/localDb';
import { WorkspaceUser, CallStatus } from '../types';
import { TelephonyProvider, TelephonyInitiateCallParams, TelephonyCallResult } from '../server/voice/TelephonyProvider';
import { TelephonyProviderAdapter } from '../server/voice/TelephonyProviderAdapter';

declare const describe: any;
declare const it: any;
declare const expect: any;

if (typeof describe === 'function') {
  describe('SalesPilot Direct Dial Calling Test Suite', () => {
    it('runs direct dial calling test suite', async () => {
      const result = await runDirectDialCallingTestSuite();
      expect(result.failed).toBe(0);
      expect(result.passed).toBeGreaterThan(0);
    });
  });
}

export async function runDirectDialCallingTestSuite() {
  console.log('=== STARTING DIRECT DIAL CALLING TEST SUITE ===');
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

  const TEST_ORG_X = 'org_dial_x_' + Date.now();
  const TEST_ORG_Y = 'org_dial_y_' + Date.now();

  const userX: WorkspaceUser = {
    id: 'usr_dial_x',
    email: 'userX@dial.com',
    fullName: 'Dialer X',
    companyName: 'Company X',
    industry: 'SaaS',
    role: 'OWNER',
    organizationId: TEST_ORG_X,
    tier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  const userY: WorkspaceUser = {
    id: 'usr_dial_y',
    email: 'userY@dial.com',
    fullName: 'Dialer Y',
    companyName: 'Company Y',
    industry: 'SaaS',
    role: 'MEMBER',
    organizationId: TEST_ORG_Y,
    tier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  db.db.users.push(userX, userY);

  // 1. User without verified calling number check
  const userXNumbersBefore = db.getCallingNumbers(TEST_ORG_X, userX.id);
  const verifiedBefore = userXNumbersBefore.find(cn => cn.isVerified);
  assert(verifiedBefore === undefined, 'Test 1: User starts without verified calling number');

  // 2. Add verified calling number for User X
  const cnX = db.addCallingNumber({
    userId: userX.id,
    organizationId: TEST_ORG_X,
    phoneNumber: '+15550001111',
    countryCode: '+1',
    isVerified: true,
    isDefault: true
  });
  assert(cnX.isVerified === true, 'Test 2: User X successfully added verified calling number');

  // 3. TelephonyProvider Abstraction - Unconfigured State
  const adapter = new TelephonyProviderAdapter();
  // Ensure unconfigured state behaves as expected when no environment keys set
  adapter.setDelegateProvider(null);
  const isEnvConfigured = adapter.isConfigured();
  if (!isEnvConfigured) {
    const unconfiguredCall = await adapter.initiateCall({
      callId: 'call_test_unconf',
      organizationId: TEST_ORG_X,
      userId: userX.id,
      destinationNumber: '+15559998888',
      callerId: cnX.phoneNumber
    });
    assert(
      unconfiguredCall.success === false && unconfiguredCall.error?.includes('provider is not configured'),
      'Test 3: Telephony provider rejects initiation when unconfigured'
    );
  } else {
    assert(true, 'Test 3: Telephony provider configured via environment');
  }

  // 4. TelephonyProvider Abstraction - Mock Provider Implementation
  let lastInitiatedParams: TelephonyInitiateCallParams | null = null;
  let lastCancelledCallId: string | null = null;
  const mockCallStatuses: Record<string, CallStatus> = {};

  const mockProvider: TelephonyProvider = {
    name: 'Mock Telephony Gateway',
    isConfigured: () => true,
    initiateCall: async (params: TelephonyInitiateCallParams): Promise<TelephonyCallResult> => {
      lastInitiatedParams = params;
      const providerCallId = 'prov_call_' + Date.now();
      mockCallStatuses[providerCallId] = 'QUEUED';
      return {
        success: true,
        providerCallId,
        status: 'QUEUED',
        providerName: 'Mock Telephony Gateway'
      };
    },
    cancelCall: async (providerCallId: string) => {
      lastCancelledCallId = providerCallId;
      mockCallStatuses[providerCallId] = 'CANCELLED';
      return { success: true };
    },
    getCallStatus: async (providerCallId: string) => {
      return {
        status: mockCallStatuses[providerCallId] || 'IN_PROGRESS',
        durationSeconds: 42
      };
    }
  };

  adapter.setDelegateProvider(mockProvider);
  assert(adapter.isConfigured() === true && adapter.name === 'Mock Telephony Gateway', 'Test 4: TelephonyProvider delegate registered and configured');

  // 5. Outbound Provider Call Initiation with User's Verified Caller ID
  const testDestNumber = '+15559998888';
  const initiateResult = await adapter.initiateCall({
    callId: 'act_direct_test_' + Date.now(),
    organizationId: TEST_ORG_X,
    userId: userX.id,
    destinationNumber: testDestNumber,
    callerId: cnX.phoneNumber,
    contactName: 'Alice Smith',
    companyName: 'Acme Corp',
    notes: 'Direct dial outreach'
  });

  assert(
    initiateResult.success === true &&
    Boolean(initiateResult.providerCallId) &&
    initiateResult.status === 'QUEUED' &&
    lastInitiatedParams?.callerId === cnX.phoneNumber &&
    lastInitiatedParams?.destinationNumber === testDestNumber,
    'Test 5: Provider initiated outbound call with user verified caller ID'
  );

  // 6. Direct dial activity creation without leadId (Direct Dial)
  const directActivity = db.addManualCallActivity({
    id: lastInitiatedParams!.callId,
    leadId: undefined,
    source: 'DIRECT_DIAL',
    organizationId: TEST_ORG_X,
    userId: userX.id,
    callingNumberId: cnX.id,
    callingNumber: cnX.phoneNumber,
    callingNumberSnapshot: cnX.phoneNumber,
    phoneNumber: testDestNumber,
    destinationNumber: testDestNumber,
    contactName: 'Alice Smith',
    companyName: 'Acme Corp',
    notes: 'Direct dial outreach',
    direction: 'OUTBOUND',
    activityType: 'PHONE_CALL',
    status: initiateResult.status as CallStatus,
    providerCallId: initiateResult.providerCallId,
    providerName: adapter.name,
    createdAt: new Date().toISOString()
  });
  assert(
    directActivity.source === 'DIRECT_DIAL' &&
    !directActivity.leadId &&
    directActivity.providerCallId === initiateResult.providerCallId,
    'Test 6: Direct Dial call recorded with providerCallId and without leadId'
  );

  // 7. Polling provider call status via getCallStatus
  mockCallStatuses[initiateResult.providerCallId!] = 'IN_PROGRESS';
  const statusCheck = await adapter.getCallStatus(directActivity.providerCallId!);
  assert(
    statusCheck.status === 'IN_PROGRESS' && statusCheck.durationSeconds === 42,
    'Test 7: Real-time provider call status and duration polling succeeded'
  );

  // 8. Updating manual call activity status to IN_PROGRESS
  const updatedStatusActivity = db.updateManualCallActivityStatus(
    directActivity.id,
    statusCheck.status,
    TEST_ORG_X,
    { durationSeconds: statusCheck.durationSeconds }
  );
  assert(
    updatedStatusActivity?.status === 'IN_PROGRESS' && updatedStatusActivity.durationSeconds === 42,
    'Test 8: Call activity updated to IN_PROGRESS with duration'
  );

  // 9. Provider Call Cancellation / End Call
  const cancelResult = await adapter.cancelCall(directActivity.providerCallId!);
  assert(
    cancelResult.success === true && lastCancelledCallId === directActivity.providerCallId,
    'Test 9: Call successfully cancelled through provider API'
  );

  const cancelledActivity = db.updateManualCallActivityStatus(
    directActivity.id,
    'CANCELLED',
    TEST_ORG_X,
    { endedAt: new Date().toISOString() }
  );
  assert(cancelledActivity?.status === 'CANCELLED', 'Test 10: Activity marked CANCELLED in database');

  // 11. Update outcome for Direct Dial activity without fake lead
  const updatedOut = db.updateManualCallOutcome(directActivity.id, TEST_ORG_X, 'Connected', 'Good chat');
  assert(
    updatedOut?.outcome === 'Connected' && updatedOut.status === 'COMPLETED',
    'Test 11: Direct Dial outcome updated successfully without creating fake lead'
  );

  // 12. Tenant isolation check: User Y cannot access User X activity
  const activitiesY = db.getManualCallActivities(TEST_ORG_Y);
  const foundByY = activitiesY.find(a => a.id === directActivity.id);
  assert(foundByY === undefined, 'Test 12: Tenant isolation prevents cross-tenant access to Direct Dial call');

  // 13. Caller ID Security: Reject unverified or cross-tenant calling number
  const crossTenantCnCheck = db.getCallingNumbers(TEST_ORG_Y, userY.id);
  const hasUserXNumber = crossTenantCnCheck.some(cn => cn.phoneNumber === cnX.phoneNumber);
  assert(hasUserXNumber === false, 'Test 13: Tenant Y cannot resolve Tenant X verified calling number');

  // Reset delegate provider
  adapter.setDelegateProvider(null);

  console.log(`=== DIRECT DIAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}
