import { runNotificationsAutomationTestSuite } from './notificationsTaskAutomation.test';
import { runOutreachCampaignTestSuite } from './outreachCampaigns.test';
import { runOutreachCronTestSuite } from './outreachCron.test';
import { runDashboardTelemetryAuthTestSuite } from './dashboardTelemetryAuth.test';
import { runPersonalCallingIdentityTestSuite } from './personalCallingIdentity.test';
import { runDirectDialCallingTestSuite } from './directDialCalling.test';
import { runEdesyTelephonyTestSuite } from './edesyTelephony.test';
import { runFinalProductionVerificationTestSuite } from './finalProductionVerification.test';
import { runMultiUserIsolationIntegrationsTestSuite } from './multiUserIsolationIntegrations.test';
import { runGoogleCalendarWriteTestSuite } from './googleCalendarWrite.test';
import { runExpiredTrialCheckoutTestSuite } from './expiredTrialCheckout.test';
import { runUpiTestModeTestSuite } from './upiTestMode.test';
import { runBillingAuditTestSuite } from './billingAudit.test';
import { runAdminBillingAuthTestSuite } from './adminBillingAuth.test';
import { runNoRoleSimulatorTestSuite } from './noRoleSimulator.test';
import { runProductionBillingCheckoutTestSuite } from './productionBillingCheckout.test';
import { runFinalProductionSmokeTestSuite } from './finalProductionSmokeTest';

async function runAllTests() {
  console.log('==================================================');
  console.log('      SALESPILOT MASTER INTEGRATED TEST RUNNER     ');
  console.log('==================================================');

  let totalPassed = 0;
  let totalFailed = 0;

  // 1. Phase 9: Notifications & Task Automation Suite
  try {
    const res = await runNotificationsAutomationTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Phase 9 Notification test suite crashed:', err);
    totalFailed++;
  }

  // 2. Phase 7: Outreach Campaigns Suite
  try {
    const res = await runOutreachCampaignTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Phase 7 Outreach Campaign test suite crashed:', err);
    totalFailed++;
  }

  // 3. Phase 8: Outreach Cron Safety Suite
  try {
    const res = await runOutreachCronTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Phase 8 Outreach Cron test suite crashed:', err);
    totalFailed++;
  }

  // 4. Dashboard Telemetry Authentication & Tenant Isolation Suite
  try {
    const res = await runDashboardTelemetryAuthTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Dashboard Telemetry test suite crashed:', err);
    totalFailed++;
  }

  // 5. Personal Calling Identity Suite
  try {
    const res = await runPersonalCallingIdentityTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Personal Calling Identity test suite crashed:', err);
    totalFailed++;
  }

  // 6. Direct Dial Calling Suite
  try {
    const res = await runDirectDialCallingTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Direct Dial Calling test suite crashed:', err);
    totalFailed++;
  }

  // 7. Edesy Telephony Suite
  try {
    const res = await runEdesyTelephonyTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Edesy Telephony test suite crashed:', err);
    totalFailed++;
  }

  // 8. Founder & Final Production Verification Suite
  try {
    const res = await runFinalProductionVerificationTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Final Production Verification test suite crashed:', err);
    totalFailed++;
  }

  // 9. Multi-User Isolation & Integrations Suite
  try {
    const res = await runMultiUserIsolationIntegrationsTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Multi-User Isolation test suite crashed:', err);
    totalFailed++;
  }

  // 10. Google Calendar Write & Sync Suite
  try {
    const res = await runGoogleCalendarWriteTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Google Calendar Write test suite crashed:', err);
    totalFailed++;
  }

  // 11. Phase 15: Billing & Subscription Audit Suite
  try {
    const res = await runBillingAuditTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Billing Audit test suite crashed:', err);
    totalFailed++;
  }

  // 12. UPI Test Mode Suite
  try {
    const res = await runUpiTestModeTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('UPI Test Mode test suite crashed:', err);
    totalFailed++;
  }

  // 13. Admin Billing Auth Suite
  try {
    const res = await runAdminBillingAuthTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Admin Billing Auth test suite crashed:', err);
    totalFailed++;
  }

  // 14. No Role Simulator & RBAC Suite
  try {
    const res = await runNoRoleSimulatorTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('No Role Simulator test suite crashed:', err);
    totalFailed++;
  }

  // 15. Production Billing Checkout Suite
  try {
    const res = await runProductionBillingCheckoutTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Production Billing Checkout test suite crashed:', err);
    totalFailed++;
  }

  // 16. Final Production Smoke Test Suite
  try {
    const res = await runFinalProductionSmokeTestSuite();
    totalPassed += res.passed;
    totalFailed += res.failed;
  } catch (err) {
    console.error('Final Production Smoke test suite crashed:', err);
    totalFailed++;
  }

  console.log('\n==================================================');
  console.log('                 FINAL TEST RESULTS               ');
  console.log(`  Passed: ${totalPassed}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log('==================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Master test runner crashed:', err);
  process.exit(1);
});
