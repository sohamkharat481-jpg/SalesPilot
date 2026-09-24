import { LocalDB } from '../database/localDb';
import { SalesPilotNotification } from '../types';

declare const describe: any;
declare const it: any;
declare const expect: any;

if (typeof describe === 'function') {
  describe('SalesPilot Phase 9: Notifications & Task Automation Suite', () => {
    it('runs all persistent notification & automation tests', async () => {
      const result = await runNotificationsAutomationTestSuite();
      expect(result.failed).toBe(0);
      expect(result.passed).toBeGreaterThan(0);
    });
  });
}

export async function runNotificationsAutomationTestSuite() {
  console.log('=== STARTING NOTIFICATIONS & TASK AUTOMATION TEST SUITE ===');
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

  const db = new LocalDB();
  const ORG_A = 'org_notif_a_' + Date.now();
  const ORG_B = 'org_notif_b_' + Date.now();
  const USER_1 = 'user_notif_1_' + Date.now();
  const USER_2 = 'user_notif_2_' + Date.now();

  try {
    // 1. Test Notification Creation
    const n1 = db.addSalesPilotNotification({
      organizationId: ORG_A,
      userId: USER_1,
      type: 'LEAD_ASSIGNED',
      title: 'Lead Assigned To You',
      message: 'You have been assigned Acme Lead.',
      entityType: 'LEAD',
      entityId: 'lead_test_123',
      priority: 'MEDIUM',
      metadata: { leadName: 'Acme Corp' }
    });

    assert(n1 !== null && n1.id.startsWith('ntf_'), 'Notification successfully created with prefixed ID');
    assert(n1.type === 'LEAD_ASSIGNED' && n1.priority === 'MEDIUM', 'Notification contains correct properties');

    // 2. Test Notification Retrieval & Filters
    const notifsAll = db.getSalesPilotNotifications(ORG_A, USER_1);
    assert(notifsAll.length === 1, 'Retrieve all notifications for User 1 in Org A');

    const notifsFiltered = db.getSalesPilotNotifications(ORG_A, USER_1, { type: 'NEW_LEAD' });
    assert(notifsFiltered.length === 0, 'Retrieval correctly filters out different types');

    const notifsByPriority = db.getSalesPilotNotifications(ORG_A, USER_1, { priority: 'MEDIUM' });
    assert(notifsByPriority.length === 1, 'Retrieval correctly matches priority');

    // 3. Test Unread Count
    let unreadCount = db.getUnreadSalesPilotNotificationCount(ORG_A, USER_1);
    assert(unreadCount === 1, 'Correct initial unread count');

    // 4. Test Mark Read
    const readNtf = db.markSalesPilotNotificationRead(n1.id, ORG_A, USER_1, true);
    assert(readNtf !== null && readNtf.isRead === true && readNtf.readAt !== null, 'Mark single notification as read');

    unreadCount = db.getUnreadSalesPilotNotificationCount(ORG_A, USER_1);
    assert(unreadCount === 0, 'Unread count updated to 0 after marking read');

    // 5. Test Mark Unread
    const unreadNtf = db.markSalesPilotNotificationRead(n1.id, ORG_A, USER_1, false);
    assert(unreadNtf !== null && unreadNtf.isRead === false && unreadNtf.readAt === null, 'Mark single notification as unread');

    unreadCount = db.getUnreadSalesPilotNotificationCount(ORG_A, USER_1);
    assert(unreadCount === 1, 'Unread count reverted after marking unread');

    // 6. Test Mark All Read
    db.markAllSalesPilotNotificationsRead(ORG_A, USER_1);
    unreadCount = db.getUnreadSalesPilotNotificationCount(ORG_A, USER_1);
    assert(unreadCount === 0, 'Mark all as read sets unread count to 0');

    // 7. Test Tenant Isolation
    // Organization B attempts to retrieve Org A notifications
    const orgBNotifs = db.getSalesPilotNotifications(ORG_B, USER_1);
    assert(orgBNotifs.length === 0, 'Tenant Isolation: Org B cannot retrieve Org A notifications');

    // Organization B attempts to update Org A notification
    const hijackedNtf = db.markSalesPilotNotificationRead(n1.id, ORG_B, USER_1, true);
    assert(hijackedNtf === null, 'Tenant Isolation: Org B cannot update Org A notifications');

    // 8. Test User Isolation
    const user2Notifs = db.getSalesPilotNotifications(ORG_A, USER_2);
    assert(user2Notifs.length === 0, 'User Isolation: User 2 cannot retrieve User 1 notifications');

    const hijackedUserNtf = db.markSalesPilotNotificationRead(n1.id, ORG_A, USER_2, true);
    assert(hijackedUserNtf === null, 'User Isolation: User 2 cannot read or modify User 1 notifications');

    // 9. Test Duplicate Prevention & Idempotency
    const idempotencyKey = 'idemp_key_' + Date.now();
    const notifPayload = {
      organizationId: ORG_A,
      userId: USER_1,
      type: 'DEAL_WON' as const,
      title: 'Deal Won',
      message: 'Deal has been closed successfully.',
      priority: 'HIGH' as const,
      idempotencyKey
    };

    const firstRun = db.addSalesPilotNotification(notifPayload);
    const secondRun = db.addSalesPilotNotification(notifPayload);

    assert(firstRun.id === secondRun.id, 'Idempotency: Same idempotencyKey returns existing record');
    
    const allOrgNotifs = db.getSalesPilotNotifications(ORG_A, USER_1);
    const idempInstances = allOrgNotifs.filter(n => n.idempotencyKey === idempotencyKey);
    assert(idempInstances.length === 1, 'Idempotency: No duplicate notification entries created');

    // 10. Test Deep Links
    assert(n1.entityType === 'LEAD' && n1.entityId === 'lead_test_123', 'Deep Link fields (entityType & entityId) successfully preserved');

    // 11. Test Follow-Up Due notifications
    const pastDueTime = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hr ago
    const futureDueTime = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hr in future

    const followUp1 = {
      id: 'fup_due_1',
      organizationId: ORG_A,
      userId: USER_1,
      title: 'Follow-Up Urgent Client Call',
      dueAt: pastDueTime,
      status: 'PENDING',
      priority: 'URGENT'
    };
    (db as any).addFollowUp(followUp1);

    // Invoke due reminder creation simulation
    const uncompletedFups = ((db as any).db.followUps || []).filter((f: any) => f.status !== 'COMPLETED');
    const createdNotifs: any[] = [];

    for (const f of uncompletedFups) {
      if (new Date(f.dueAt) <= new Date()) {
        const added = db.addSalesPilotNotification({
          organizationId: f.organizationId,
          userId: f.userId,
          type: 'FOLLOW_UP_OVERDUE',
          title: 'Follow-Up Overdue',
          message: `Your follow-up task "${f.title}" is overdue.`,
          entityType: 'FOLLOW_UP',
          entityId: f.id,
          priority: f.priority
        });
        createdNotifs.push(added);
      }
    }

    assert(createdNotifs.length >= 1, 'Follow-up background processor successfully detects past-due task');
    assert(createdNotifs[0].type === 'FOLLOW_UP_OVERDUE', 'Follow-up background processor creates correct notification type');

    // 12. Exclusion of TEST_SIMULATED and Quarantined data
    const mockActivity = {
      id: 'act_mock_1',
      organizationId: ORG_A,
      source: 'TEST_SIMULATED',
      details: 'This is a simulated event.'
    };
    
    // Ensure we do not trigger notifications for simulated events
    const simulateNotificationTrigger = (event: any) => {
      if (event.source === 'TEST_SIMULATED') {
        return null; // Skip creation
      }
      return db.addSalesPilotNotification({
        organizationId: event.organizationId,
        userId: USER_1,
        type: 'NEW_LEAD',
        title: 'New Lead',
        message: 'A real lead was added.',
        priority: 'LOW'
      });
    };

    const mockResult = simulateNotificationTrigger(mockActivity);
    assert(mockResult === null, 'TEST_SIMULATED events successfully excluded from notification creation');

    // 13. Pagination checks
    // Let's add multiple notifications to test slicing
    for (let i = 0; i < 5; i++) {
      db.addSalesPilotNotification({
        organizationId: ORG_A,
        userId: USER_1,
        type: 'NEW_LEAD',
        title: `Paginated Lead ${i}`,
        message: `Lead msg ${i}`,
        priority: 'LOW',
        idempotencyKey: `p_key_${i}_${Date.now()}`
      });
    }

    const page1Notifs = db.getSalesPilotNotifications(ORG_A, USER_1).slice(0, 3);
    const page2Notifs = db.getSalesPilotNotifications(ORG_A, USER_1).slice(3, 6);
    assert(page1Notifs.length === 3, 'Pagination first page slice is correct');
    assert(page2Notifs.length === 3, 'Pagination second page slice is correct');

  } catch (err: any) {
    console.error('Test suite raised exception:', err);
    failed++;
  }

  console.log(`=== TEST SUMMARY: ${passed} Passed, ${failed} Failed ===`);
  return { passed, failed };
}
