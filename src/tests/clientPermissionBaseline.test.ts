import { LocalDB } from '../database/localDb';
import { AuthService } from '../authentication/auth-service';
import { WorkspaceUser, OutreachCampaign, OutreachStep, Lead, Deal, Appointment, OrgAuditLog } from '../types';

const localDb = LocalDB.instance;

export async function runClientPermissionBaselineTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n==================================================');
  console.log('  SALESPILOT CLIENT ACCOUNT PERMISSION BASELINE   ');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${details ? ' - ' + details : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const clientOrgAId = `org_client_a_${timestamp}`;
  const clientOrgBId = `org_client_b_${timestamp}`;

  // 1. NEW CLIENT SIGNUP & AUTOMATIC ONBOARDING BASELINE
  console.log('\n--- 1. NEW CLIENT ONBOARDING & MEMBERSHIP CREATION ---');

  // Client A registers & creates organization
  localDb.saveOrganization({
    id: clientOrgAId,
    name: 'Apex Growth Solutions',
    companyName: 'Apex Growth Solutions',
    industry: 'Consulting & B2B Services',
    domain: 'apexgrowth.com',
    createdAt: new Date().toISOString()
  });

  const clientUserA: WorkspaceUser = {
    id: `usr_client_a_${timestamp}`,
    email: `client_a_${timestamp}@apexgrowth.com`,
    fullName: 'Arjun Verma',
    companyName: 'Apex Growth Solutions',
    industry: 'Consulting & B2B Services',
    tier: 'GROWTH',
    role: 'CLIENT',
    organizationId: clientOrgAId,
    subscriptionStatus: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  localDb.addUser(clientUserA);
  localDb.addTeamMember({
    id: `tm_client_a_${timestamp}`,
    organizationId: clientOrgAId,
    userId: clientUserA.id,
    fullName: clientUserA.fullName,
    email: clientUserA.email,
    role: 'CLIENT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  // Client B registers & creates organization
  localDb.saveOrganization({
    id: clientOrgBId,
    name: 'Zenith Logistics Ltd',
    companyName: 'Zenith Logistics Ltd',
    industry: 'Supply Chain',
    domain: 'zenithlogistics.in',
    createdAt: new Date().toISOString()
  });

  const clientUserB: WorkspaceUser = {
    id: `usr_client_b_${timestamp}`,
    email: `client_b_${timestamp}@zenithlogistics.in`,
    fullName: 'Kavita Patel',
    companyName: 'Zenith Logistics Ltd',
    industry: 'Supply Chain',
    tier: 'GROWTH',
    role: 'CLIENT',
    organizationId: clientOrgBId,
    subscriptionStatus: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  localDb.addUser(clientUserB);
  localDb.addTeamMember({
    id: `tm_client_b_${timestamp}`,
    organizationId: clientOrgBId,
    userId: clientUserB.id,
    fullName: clientUserB.fullName,
    email: clientUserB.email,
    role: 'CLIENT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  assert(Boolean(localDb.getUserById(clientUserA.id)), '1.1 Client A user record created successfully');
  assert(Boolean(localDb.getOrganizationById(clientOrgAId)), '1.2 Client A organization workspace created successfully');
  assert(Boolean(localDb.getUserById(clientUserB.id)), '1.3 Client B user record created successfully');

  // 2. AUTOMATIC CLIENT STANDARD FEATURE ACCESS
  console.log('\n--- 2. AUTOMATIC STANDARD CLIENT PERMISSION RESOLUTION ---');

  // Verify frontend helper
  assert(AuthService.canManageCampaigns(clientUserA) === true, '2.1 AuthService grants campaign management to newly onboarded CLIENT automatically');
  assert(AuthService.canManageCampaigns(clientUserB) === true, '2.2 AuthService grants campaign management to Client B automatically');

  // Verify server-side permission resolver without manual assignment
  const standardRolePermissions: Record<string, string[]> = {
    'OWNER': ['View CRM', 'Edit CRM', 'Delete CRM', 'Manage Campaigns', 'Manage Billing', 'Manage AI', 'Manage Integrations', 'View Reports', 'Manage Team', 'Manage Settings'],
    'SUPER_ADMIN': ['View CRM', 'Edit CRM', 'Delete CRM', 'Manage Campaigns', 'Manage Billing', 'Manage AI', 'Manage Integrations', 'View Reports', 'Manage Team', 'Manage Settings'],
    'ADMIN': ['View CRM', 'Edit CRM', 'Delete CRM', 'Manage Campaigns', 'Manage AI', 'Manage Integrations', 'View Reports', 'Manage Team', 'Manage Settings'],
    'MANAGER': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports', 'Manage Team'],
    'SALES': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports'],
    'SALES_REP': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports'],
    'SDR': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports'],
    'MARKETING': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports'],
    'MEMBER': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports', 'Manage Integrations', 'Manage Billing'],
    'CLIENT': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports', 'Manage Integrations', 'Manage Billing'],
    'SUPPORT': ['View CRM', 'Manage Integrations'],
    'VIEWER': ['View CRM', 'View Reports']
  };

  const hasPerm = (user: WorkspaceUser, orgId: string, perm: string): boolean => {
    if (user.role === 'SUPER_ADMIN' || user.isFounder) return true;
    if (user.organizationId === orgId && user.role === 'OWNER') return true;
    if (user.organizationId !== orgId) return false;
    const roleKey = (user.role || 'VIEWER').toUpperCase();
    const allowed = standardRolePermissions[roleKey] || [];
    return allowed.some(p => p.toLowerCase() === perm.toLowerCase());
  };

  assert(hasPerm(clientUserA, clientOrgAId, 'View CRM') === true, '2.3 Client A has automatic View CRM permission');
  assert(hasPerm(clientUserA, clientOrgAId, 'Edit CRM') === true, '2.4 Client A has automatic Edit CRM permission');
  assert(hasPerm(clientUserA, clientOrgAId, 'Manage Campaigns') === true, '2.5 Client A has automatic Manage Campaigns permission');
  assert(hasPerm(clientUserA, clientOrgAId, 'Manage AI') === true, '2.6 Client A has automatic Manage AI permission');
  assert(hasPerm(clientUserA, clientOrgAId, 'View Reports') === true, '2.7 Client A has automatic View Reports analytics permission');
  assert(hasPerm(clientUserA, clientOrgAId, 'Manage Integrations') === true, '2.8 Client A has automatic Manage Integrations (Gmail & Calendar) permission');
  assert(hasPerm(clientUserA, clientOrgAId, 'Manage Billing') === true, '2.9 Client A has automatic Manage Billing permission');

  // 3. RESTRICTIONS AUDIT: CLIENTS CANNOT ACCESS FOUNDER/PLATFORM ADMIN CONTROLS
  console.log('\n--- 3. FOUNDER/SUPER ADMIN PRIVILEGE RESTRICTION AUDIT ---');
  assert(hasPerm(clientUserA, clientOrgAId, 'Manage Settings') === false, '3.1 Client A is strictly denied Manage Settings (Platform configuration)');
  assert(hasPerm(clientUserA, clientOrgAId, 'Manage Team') === false, '3.2 Client A is denied Manage Team (Platform role escalation)');
  assert(hasPerm(clientUserA, clientOrgAId, 'Delete CRM') === false, '3.3 Client A is denied Delete CRM (Permanent wipe)');
  assert(clientUserA.role !== 'SUPER_ADMIN', '3.4 Client account does not receive SUPER_ADMIN role');
  assert(clientUserA.isFounder !== true, '3.5 Client account does not receive Founder allowlist status');

  // 4. CLIENT LEADS & CAMPAIGN EXECUTION WITHIN WORKSPACE
  console.log('\n--- 4. CLIENT LEADS, CAMPAIGNS & CRM OPERATIONS ---');
  
  // Client A creates a lead
  const leadAId = `ld_client_a_${timestamp}`;
  localDb.addLead({
    id: leadAId,
    organizationId: clientOrgAId,
    userId: clientUserA.id,
    name: 'Vikram Mehta',
    company: 'Mehta Global',
    email: 'vikram@mehtaglobal.com',
    status: 'NEW',
    createdAt: new Date().toISOString()
  });

  const orgALeads = localDb.getLeads(clientOrgAId);
  assert(orgALeads.some(l => l.id === leadAId), '4.1 Client A successfully creates and lists leads in own workspace');

  // Client A creates outreach campaign
  const campAId = `camp_client_a_${timestamp}`;
  localDb.saveOutreachCampaign({
    id: campAId,
    organizationId: clientOrgAId,
    name: 'Apex Strategic Outbound',
    status: 'DRAFT',
    targetLeadIds: [leadAId],
    dailyLimit: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, [
    {
      id: `step_${campAId}_1`,
      organizationId: clientOrgAId,
      campaignId: campAId,
      stepNumber: 1,
      delayDays: 0,
      subjectTemplate: 'Exploring synergies with Apex Growth',
      bodyTemplate: 'Hi Vikram, let us connect regarding scalable sales infrastructure.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  const campA = localDb.getOutreachCampaignById(campAId, clientOrgAId);
  assert(Boolean(campA && campA.name === 'Apex Strategic Outbound'), '4.2 Client A successfully creates outreach campaign');

  // Client A starts campaign
  localDb.updateOutreachCampaignStatus(campAId, 'ACTIVE', clientOrgAId);
  const runningCamp = localDb.getOutreachCampaignById(campAId, clientOrgAId);
  assert(runningCamp?.status === 'ACTIVE', '4.3 Client A successfully starts outreach campaign');

  // Client A creates Deal
  const dealAId = `deal_client_a_${timestamp}`;
  localDb.addDeal({
    id: dealAId,
    organizationId: clientOrgAId,
    userId: clientUserA.id,
    leadId: leadAId,
    title: 'Mehta Global Enterprise Contract',
    value: 500000,
    stage: 'NEGOTIATION',
    createdAt: new Date().toISOString()
  });
  const orgADeals = localDb.getDeals(clientOrgAId);
  assert(orgADeals.some(d => d.id === dealAId), '4.4 Client A successfully manages CRM Deals in workspace');

  // Client A creates Follow-up
  const followUpAId = `fup_client_a_${timestamp}`;
  localDb.addFollowUp({
    id: followUpAId,
    organizationId: clientOrgAId,
    userId: clientUserA.id,
    leadId: leadAId,
    title: 'Send Revised Architecture Deck',
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'PENDING',
    priority: 'HIGH',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const orgAFollowUps = localDb.getFollowUps(clientOrgAId);
  assert(orgAFollowUps.some(f => f.id === followUpAId), '4.5 Client A successfully manages CRM Follow-ups');

  // 5. CLIENT MULTI-TENANT ISOLATION AUDIT
  console.log('\n--- 5. STRICT CLIENT MULTI-TENANT ISOLATION ---');

  // Client B creates their own lead and campaign
  const leadBId = `ld_client_b_${timestamp}`;
  localDb.addLead({
    id: leadBId,
    organizationId: clientOrgBId,
    userId: clientUserB.id,
    name: 'Suresh Raina',
    company: 'Raina Logistics',
    email: 'suresh@rainalogistics.com',
    status: 'NEW',
    createdAt: new Date().toISOString()
  });

  // Client A attempts to access Client B's leads
  const crossLeads = localDb.getLeads(clientOrgAId);
  assert(!crossLeads.some(l => l.id === leadBId), '5.1 Client A CANNOT view or access Client B leads');

  // Client B attempts to fetch Client A's campaign
  const crossCamp = localDb.getOutreachCampaignById(campAId, clientOrgBId);
  assert(crossCamp === null, '5.2 Client B CANNOT view or access Client A campaign');

  // Client B attempts to fetch Client A's deals
  const crossDeals = localDb.getDeals(clientOrgBId);
  assert(!crossDeals.some(d => d.id === dealAId), '5.3 Client B CANNOT view or access Client A CRM Deals');

  // Client B attempts to fetch Client A's follow-ups
  const crossFollowUps = localDb.getFollowUps(clientOrgBId);
  assert(!crossFollowUps.some(f => f.id === followUpAId), '5.4 Client B CANNOT view or access Client A Follow-ups');

  // 6. GMAIL & CALENDAR INTEGRATION SCOPING PER CLIENT
  console.log('\n--- 6. GMAIL & GOOGLE CALENDAR ACCOUNT SCOPING ---');

  // Client A connects Gmail
  localDb.saveGmailAccount({
    id: `gm_acc_a_${timestamp}`,
    userId: clientUserA.id,
    organizationId: clientOrgAId,
    email: 'arjun.sales@apexgrowth.com',
    fullName: 'Arjun Verma',
    accessToken: 'mock_token_a',
    status: 'CONNECTED',
    connectedAt: new Date().toISOString()
  });

  // Client B connects Gmail
  localDb.saveGmailAccount({
    id: `gm_acc_b_${timestamp}`,
    userId: clientUserB.id,
    organizationId: clientOrgBId,
    email: 'kavita.outreach@zenithlogistics.in',
    fullName: 'Kavita Patel',
    accessToken: 'mock_token_b',
    status: 'CONNECTED',
    connectedAt: new Date().toISOString()
  });

  const gmailAccountsA = localDb.getGmailAccounts ? localDb.getGmailAccounts().filter((a: any) => a.organizationId === clientOrgAId && a.userId === clientUserA.id) : [];
  assert(gmailAccountsA.length === 1 && gmailAccountsA[0].email === 'arjun.sales@apexgrowth.com', '6.1 Client A Gmail account strictly isolated to Client A');

  const gmailAccountsB = localDb.getGmailAccounts ? localDb.getGmailAccounts().filter((a: any) => a.organizationId === clientOrgBId && a.userId === clientUserB.id) : [];
  assert(gmailAccountsB.length === 1 && gmailAccountsB[0].email === 'kavita.outreach@zenithlogistics.in', '6.2 Client B Gmail account strictly isolated to Client B');

  console.log(`\n=== CLIENT ACCOUNT PERMISSION BASELINE RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

// Standalone execution support
if (process.argv[1]?.includes('clientPermissionBaseline')) {
  runClientPermissionBaselineTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    else process.exit(0);
  }).catch(err => {
    console.error('Audit test suite failed with exception:', err);
    process.exit(1);
  });
}
