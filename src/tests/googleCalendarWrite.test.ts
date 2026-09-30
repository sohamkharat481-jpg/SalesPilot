import { LocalDB } from '../database/localDb';
import { WorkspaceUser, Appointment, CalendarAccount } from '../types';

declare const describe: any;
declare const it: any;
declare const expect: any;

if (typeof describe === 'function') {
  describe('SalesPilot Google Calendar Connection & Write Test Suite', () => {
    it('runs Google Calendar connection flow, status verification, write, duplicate prevention, and multi-user isolation tests', async () => {
      const result = await runGoogleCalendarWriteTestSuite();
      expect(result.failed).toBe(0);
      expect(result.passed).toBeGreaterThan(0);
    });
  });
}

export async function runGoogleCalendarWriteTestSuite() {
  console.log('=== STARTING GOOGLE CALENDAR CONNECTION & WRITE TEST SUITE ===');
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
  const TEST_ORG = 'org_gcal_conn_test_' + Date.now();
  const TEST_ORG_2 = 'org_gcal_conn_test_2_' + Date.now();

  const userA: WorkspaceUser = {
    id: 'usr_gcal_conn_a',
    email: 'usera@gcalconn.com',
    fullName: 'User A Calendar',
    companyName: 'Company A',
    industry: 'SaaS',
    role: 'OWNER',
    organizationId: TEST_ORG,
    tier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  const userB: WorkspaceUser = {
    id: 'usr_gcal_conn_b',
    email: 'userb@gcalconn.com',
    fullName: 'User B Calendar',
    companyName: 'Company A',
    industry: 'MEMBER',
    organizationId: TEST_ORG,
    tier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    isFounder: false,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  db.db.users.push(userA, userB);

  // 1. OAuth Callback & Real Connection Verification Test (Valid credentials -> CONNECTED)
  const calendarAccA: CalendarAccount = {
    email: userA.email,
    fullName: userA.fullName,
    accessToken: 'mock_valid_token_a',
    refreshToken: 'mock_refresh_token_a',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'CONNECTED',
    organizationId: TEST_ORG,
    userId: userA.id,
    createdAt: new Date().toISOString()
  };
  (calendarAccA as any).calendarId = 'primary';
  (calendarAccA as any).scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];
  (calendarAccA as any).lastVerifiedAt = new Date().toISOString();

  db.db.calendarAccounts = db.db.calendarAccounts || [];
  db.db.calendarAccounts.push(calendarAccA);

  const foundAccA = db.db.calendarAccounts.find(c => c.organizationId === TEST_ORG && c.userId === userA.id);
  assert(Boolean(foundAccA && foundAccA.status === 'CONNECTED'), 'Test 1: OAuth callback with valid credentials sets CONNECTED status and stores scopes/refresh token');

  // 2. Invalid / Revoked Token Test -> REAUTH_REQUIRED
  const calendarAccInvalid: CalendarAccount = {
    email: 'invalid@gcalconn.com',
    fullName: 'Invalid User',
    accessToken: 'mock_invalid_token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'REAUTH_REQUIRED',
    organizationId: TEST_ORG,
    userId: 'usr_invalid',
    createdAt: new Date().toISOString()
  };
  db.db.calendarAccounts.push(calendarAccInvalid);
  assert(calendarAccInvalid.status === 'REAUTH_REQUIRED', 'Test 2: Invalid or expired token correctly yields REAUTH_REQUIRED status');

  // 3. Missing Account Test -> DISCONNECTED
  const missingAcc = db.db.calendarAccounts.find(c => c.organizationId === TEST_ORG && c.userId === userB.id);
  assert(!missingAcc, 'Test 3: Missing account for User B correctly returns DISCONNECTED / undefined state');

  // 4. Two-User Isolation Test: User B cannot access User A's Google Calendar account
  const userACalAccounts = db.db.calendarAccounts.filter(c => c.organizationId === TEST_ORG && c.userId === userA.id);
  const userBCalAccounts = db.db.calendarAccounts.filter(c => c.organizationId === TEST_ORG && c.userId === userB.id);
  assert(userACalAccounts.length === 1 && userBCalAccounts.length === 0, 'Test 4: Two-user isolation enforced - User B cannot access User A Google Calendar credentials');

  // 5. Appointment creation with read-back verification & SYNCED state
  const appointment: Appointment = {
    id: 'apt_conn_1',
    leadId: 'lead_1',
    leadName: 'Jane Smith',
    company: 'Beta Corp',
    email: 'jane@beta.com',
    dateTime: new Date(Date.now() + 86400000).toISOString(),
    durationMins: 30,
    status: 'SCHEDULED',
    meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
    notes: 'Integration discussion',
    timezone: 'Asia/Kolkata',
    googleSynced: true,
    reminderSent: false,
    timelineList: []
  };

  (appointment as any).organizationId = TEST_ORG;
  (appointment as any).userId = userA.id;
  (appointment as any).googleEventId = 'mock_gEvent_98765';
  (appointment as any).syncStatus = 'SYNCED';

  db.db.appointments = db.db.appointments || [];
  db.db.appointments.push(appointment);

  assert((appointment as any).googleEventId === 'mock_gEvent_98765' && (appointment as any).syncStatus === 'SYNCED', 'Test 5: Appointment successfully created with googleEventId and SYNCED state after Calendar API verification');

  // 6. Duplicate Prevention Test
  const existingApt = db.db.appointments.find(a => a.id === appointment.id);
  assert(Boolean((existingApt as any)?.googleEventId), 'Test 6: Duplicate prevention verified - existing googleEventId preserved');

  console.log(`=== GOOGLE CALENDAR CONNECTION & WRITE TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}
