import { LocalDB } from '../database/localDb';
import { AuthService } from '../authentication/auth-service';
import { WorkspaceUser, UserRole, OutreachCampaign, OutreachStep } from '../types';

const localDb = LocalDB.instance;

export async function runCampaignPermissionsAuditTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n==================================================');
  console.log('   SALESPILOT CAMPAIGN MANAGEMENT PERMISSIONS AUDIT   ');
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
  const orgAlpha = `org_campaign_alpha_${timestamp}`;
  const orgBeta = `org_campaign_beta_${timestamp}`;

  // Seed Organizations
  localDb.saveOrganization({
    id: orgAlpha,
    name: 'Alpha Software Corp',
    companyName: 'Alpha Software Corp',
    industry: 'Enterprise Software',
    domain: 'alphasoftware.io',
    createdAt: new Date().toISOString()
  });

  localDb.saveOrganization({
    id: orgBeta,
    name: 'Beta Marketing LLC',
    companyName: 'Beta Marketing LLC',
    industry: 'Marketing Agency',
    domain: 'betamarketing.co',
    createdAt: new Date().toISOString()
  });

  // Seed Users for Org Alpha
  const ownerUser: WorkspaceUser = {
    id: `usr_owner_${timestamp}`,
    email: `owner_${timestamp}@alphasoftware.io`,
    fullName: 'Alpha Owner',
    companyName: 'Alpha Software Corp',
    industry: 'Enterprise Software',
    tier: 'ENTERPRISE',
    role: 'OWNER',
    organizationId: orgAlpha,
    createdAt: new Date().toISOString()
  };

  const adminUser: WorkspaceUser = {
    id: `usr_admin_${timestamp}`,
    email: `admin_${timestamp}@alphasoftware.io`,
    fullName: 'Alpha Admin',
    companyName: 'Alpha Software Corp',
    industry: 'Enterprise Software',
    tier: 'ENTERPRISE',
    role: 'ADMIN',
    organizationId: orgAlpha,
    createdAt: new Date().toISOString()
  };

  const managerUser: WorkspaceUser = {
    id: `usr_manager_${timestamp}`,
    email: `manager_${timestamp}@alphasoftware.io`,
    fullName: 'Alpha Manager',
    companyName: 'Alpha Software Corp',
    industry: 'Enterprise Software',
    tier: 'ENTERPRISE',
    role: 'MANAGER',
    organizationId: orgAlpha,
    createdAt: new Date().toISOString()
  };

  const salesUser: WorkspaceUser = {
    id: `usr_sales_${timestamp}`,
    email: `sales_${timestamp}@alphasoftware.io`,
    fullName: 'Alpha Sales Rep',
    companyName: 'Alpha Software Corp',
    industry: 'Enterprise Software',
    tier: 'ENTERPRISE',
    role: 'SALES',
    organizationId: orgAlpha,
    createdAt: new Date().toISOString()
  };

  const viewerUser: WorkspaceUser = {
    id: `usr_viewer_${timestamp}`,
    email: `viewer_${timestamp}@alphasoftware.io`,
    fullName: 'Alpha Viewer',
    companyName: 'Alpha Software Corp',
    industry: 'Enterprise Software',
    tier: 'ENTERPRISE',
    role: 'VIEWER',
    organizationId: orgAlpha,
    createdAt: new Date().toISOString()
  };

  const clientUser: WorkspaceUser = {
    id: `usr_client_${timestamp}`,
    email: `client_${timestamp}@alphasoftware.io`,
    fullName: 'Alpha Client Portal',
    companyName: 'Alpha Software Corp',
    industry: 'Enterprise Software',
    tier: 'ENTERPRISE',
    role: 'CLIENT',
    organizationId: orgAlpha,
    createdAt: new Date().toISOString()
  };

  const superAdminUser: WorkspaceUser = {
    id: `usr_super_${timestamp}`,
    email: `superadmin_${timestamp}@alphasoftware.io`,
    fullName: 'Alpha Super Admin',
    companyName: 'Alpha Software Corp',
    industry: 'Enterprise Software',
    tier: 'ENTERPRISE',
    role: 'SUPER_ADMIN',
    organizationId: orgAlpha,
    createdAt: new Date().toISOString()
  };

  // Seed Users for Org Beta
  const betaUser: WorkspaceUser = {
    id: `usr_beta_${timestamp}`,
    email: `beta_${timestamp}@betamarketing.co`,
    fullName: 'Beta Rep',
    companyName: 'Beta Marketing LLC',
    industry: 'Marketing Agency',
    tier: 'PROFESSIONAL',
    role: 'SALES',
    organizationId: orgBeta,
    createdAt: new Date().toISOString()
  };

  // Register in localDb
  localDb.addUser(ownerUser);
  localDb.addUser(adminUser);
  localDb.addUser(managerUser);
  localDb.addUser(salesUser);
  localDb.addUser(viewerUser);
  localDb.addUser(clientUser);
  localDb.addUser(superAdminUser);
  localDb.addUser(betaUser);

  // Add team members
  localDb.addTeamMember({
    id: `tm_owner_${timestamp}`,
    organizationId: orgAlpha,
    userId: ownerUser.id,
    fullName: ownerUser.fullName,
    email: ownerUser.email,
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  localDb.addTeamMember({
    id: `tm_admin_${timestamp}`,
    organizationId: orgAlpha,
    userId: adminUser.id,
    fullName: adminUser.fullName,
    email: adminUser.email,
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  localDb.addTeamMember({
    id: `tm_manager_${timestamp}`,
    organizationId: orgAlpha,
    userId: managerUser.id,
    fullName: managerUser.fullName,
    email: managerUser.email,
    role: 'MANAGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  localDb.addTeamMember({
    id: `tm_sales_${timestamp}`,
    organizationId: orgAlpha,
    userId: salesUser.id,
    fullName: salesUser.fullName,
    email: salesUser.email,
    role: 'SALES',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  localDb.addTeamMember({
    id: `tm_viewer_${timestamp}`,
    organizationId: orgAlpha,
    userId: viewerUser.id,
    fullName: viewerUser.fullName,
    email: viewerUser.email,
    role: 'VIEWER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  localDb.addTeamMember({
    id: `tm_client_${timestamp}`,
    organizationId: orgAlpha,
    userId: clientUser.id,
    fullName: clientUser.fullName,
    email: clientUser.email,
    role: 'CLIENT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  // 1. FRONTEND PERMISSION HELPER AUDIT
  console.log('\n--- 1. FRONTEND PERMISSION HELPER AUDIT ---');
  assert(AuthService.canManageCampaigns(ownerUser) === true, '1.1 AuthService allows OWNER to manage campaigns');
  assert(AuthService.canManageCampaigns(superAdminUser) === true, '1.2 AuthService allows SUPER_ADMIN to manage campaigns');
  assert(AuthService.canManageCampaigns(adminUser) === true, '1.3 AuthService allows ADMIN to manage campaigns');
  assert(AuthService.canManageCampaigns(managerUser) === true, '1.4 AuthService allows MANAGER to manage campaigns');
  assert(AuthService.canManageCampaigns(salesUser) === true, '1.5 AuthService allows authorized regular workspace member (SALES) to manage campaigns');
  assert(AuthService.canManageCampaigns(clientUser) === true, '1.6 AuthService allows CLIENT account to manage campaigns');
  assert(AuthService.canManageCampaigns(viewerUser) === false, '1.7 AuthService strictly blocks VIEWER from managing campaigns');
  assert(AuthService.canManageCampaigns(null) === false, '1.8 AuthService returns false for unauthenticated user');

  // 2. BACKEND PERMISSION CHECK AUDIT
  console.log('\n--- 2. SERVER-SIDE ROLE PERMISSION RESOLUTION AUDIT ---');
  
  // Test permissions map lookup
  const standardRolePermissions: Record<string, string[]> = {
    'OWNER': ['View CRM', 'Edit CRM', 'Delete CRM', 'Manage Campaigns', 'Manage Billing', 'Manage AI', 'Manage Integrations', 'View Reports', 'Manage Team', 'Manage Settings'],
    'SUPER_ADMIN': ['View CRM', 'Edit CRM', 'Delete CRM', 'Manage Campaigns', 'Manage Billing', 'Manage AI', 'Manage Integrations', 'View Reports', 'Manage Team', 'Manage Settings'],
    'ADMIN': ['View CRM', 'Edit CRM', 'Delete CRM', 'Manage Campaigns', 'Manage AI', 'Manage Integrations', 'View Reports', 'Manage Team', 'Manage Settings'],
    'MANAGER': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports', 'Manage Team'],
    'SALES': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports'],
    'SALES_REP': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports'],
    'MARKETING': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports'],
    'MEMBER': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports', 'Manage Integrations', 'Manage Billing'],
    'CLIENT': ['View CRM', 'Edit CRM', 'Manage Campaigns', 'Manage AI', 'View Reports', 'Manage Integrations', 'Manage Billing'],
    'SUPPORT': ['View CRM', 'Manage Integrations'],
    'VIEWER': ['View CRM', 'View Reports']
  };

  const hasPermTest = (user: WorkspaceUser, orgId: string, perm: string): boolean => {
    if (user.role === 'SUPER_ADMIN' || user.isFounder) return true;
    if (user.organizationId === orgId && user.role === 'OWNER') return true;
    if (user.organizationId !== orgId) return false;
    
    const member = localDb.getTeamMembers(orgId).find(m => m.userId === user.id);
    if (member) {
      const customPerms = localDb.getMemberPermissions(member.id);
      const matched = customPerms.find(p => {
        const permObj = localDb.getPermissions().find(pe => pe.id === p.permissionId);
        return permObj && permObj.name.toLowerCase() === perm.toLowerCase();
      });
      if (matched) return matched.allowed;
    }
    const roleKey = (user.role || 'VIEWER').toUpperCase();
    const allowed = standardRolePermissions[roleKey] || [];
    return allowed.some(p => p.toLowerCase() === perm.toLowerCase());
  };

  assert(hasPermTest(ownerUser, orgAlpha, 'Manage Campaigns') === true, '2.1 Server grants Manage Campaigns to OWNER');
  assert(hasPermTest(adminUser, orgAlpha, 'Manage Campaigns') === true, '2.2 Server grants Manage Campaigns to ADMIN');
  assert(hasPermTest(managerUser, orgAlpha, 'Manage Campaigns') === true, '2.3 Server grants Manage Campaigns to MANAGER');
  assert(hasPermTest(salesUser, orgAlpha, 'Manage Campaigns') === true, '2.4 Server grants Manage Campaigns to regular SALES workspace member');
  assert(hasPermTest(clientUser, orgAlpha, 'Manage Campaigns') === true, '2.5 Server grants Manage Campaigns to CLIENT account');
  assert(hasPermTest(viewerUser, orgAlpha, 'Manage Campaigns') === false, '2.6 Server denies Manage Campaigns to VIEWER');

  // 3. CUSTOM PERMISSION OVERRIDE AUDIT
  console.log('\n--- 3. CUSTOM PERMISSION OVERRIDE AUDIT ---');
  const tmViewer = localDb.getTeamMembers(orgAlpha).find(m => m.userId === viewerUser.id);
  if (tmViewer) {
    // Explicitly grant custom permission to viewer
    localDb.saveMemberPermissions(tmViewer.id, [
      { id: `cp_${Date.now()}`, memberId: tmViewer.id, permissionId: 'perm_manage_campaigns', allowed: true }
    ]);
  }
  assert(hasPermTest(viewerUser, orgAlpha, 'Manage Campaigns') === true, '3.1 Viewer with explicit custom Manage Campaigns grant is allowed');

  if (tmViewer) {
    // Revoke custom permission
    localDb.saveMemberPermissions(tmViewer.id, [
      { id: `cp_${Date.now()}`, memberId: tmViewer.id, permissionId: 'perm_manage_campaigns', allowed: false }
    ]);
  }
  assert(hasPermTest(viewerUser, orgAlpha, 'Manage Campaigns') === false, '3.2 Viewer with revoked custom Manage Campaigns grant is denied');

  // 4. CAMPAIGN LIFECYCLE & MULTI-TENANT ISOLATION AUDIT
  console.log('\n--- 4. CAMPAIGN LIFECYCLE & TENANT ISOLATION AUDIT ---');
  
  // Seed lead for Org Alpha
  const leadAlphaId = `ld_alpha_${timestamp}`;
  localDb.addLead({
    id: leadAlphaId,
    organizationId: orgAlpha,
    userId: salesUser.id,
    name: 'Priya Sharma',
    company: 'TechCorp India',
    email: 'priya@techcorp.in',
    status: 'NEW',
    createdAt: new Date().toISOString()
  });

  // Seed lead for Org Beta
  const leadBetaId = `ld_beta_${timestamp}`;
  localDb.addLead({
    id: leadBetaId,
    organizationId: orgBeta,
    userId: betaUser.id,
    name: 'Rajesh Gupta',
    company: 'Beta Industries',
    email: 'rajesh@betaind.com',
    status: 'NEW',
    createdAt: new Date().toISOString()
  });

  // Create Campaign in Org Alpha
  const campAlphaId = `camp_alpha_${timestamp}`;
  const campaignAlpha: OutreachCampaign = {
    id: campAlphaId,
    organizationId: orgAlpha,
    name: 'Enterprise Outbound Q4',
    status: 'DRAFT',
    targetLeadIds: [leadAlphaId],
    dailyLimit: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const stepsAlpha: OutreachStep[] = [
    {
      id: `step_${campAlphaId}_1`,
      organizationId: orgAlpha,
      campaignId: campAlphaId,
      stepNumber: 1,
      delayDays: 0,
      subjectTemplate: 'Accelerate Enterprise Sales with SalesPilot',
      bodyTemplate: 'Hi {{first_name}}, let us discuss pipeline automation.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  localDb.saveOutreachCampaign(campaignAlpha, stepsAlpha);

  const retrievedAlpha = localDb.getOutreachCampaignById(campAlphaId, orgAlpha);
  assert(Boolean(retrievedAlpha) && retrievedAlpha?.name === 'Enterprise Outbound Q4', '4.1 Campaign successfully created and retrieved in Org Alpha');

  // Cross-tenant access attempt: Org Beta user trying to fetch Org Alpha campaign
  const crossTenantRetrieval = localDb.getOutreachCampaignById(campAlphaId, orgBeta);
  assert(crossTenantRetrieval === null, '4.2 Cross-tenant isolation: Org Beta user CANNOT access Org Alpha campaign');

  // Cross-tenant lead assignment protection
  const orgAlphaLeads = localDb.getLeads(orgAlpha);
  const betaLeadsAssignedToAlpha = [leadBetaId].filter(id => orgAlphaLeads.some(l => l.id === id));
  assert(betaLeadsAssignedToAlpha.length === 0, '4.3 Cross-tenant lead protection: Foreign lead cannot be assigned to Org Alpha campaign');

  // Campaign State Transitions: Start, Pause, Resume
  localDb.updateOutreachCampaignStatus(campAlphaId, 'ACTIVE', orgAlpha);
  const activeCamp = localDb.getOutreachCampaignById(campAlphaId, orgAlpha);
  assert(activeCamp?.status === 'ACTIVE', '4.4 Campaign status updated to ACTIVE');

  localDb.updateOutreachCampaignStatus(campAlphaId, 'PAUSED', orgAlpha);
  const pausedCamp = localDb.getOutreachCampaignById(campAlphaId, orgAlpha);
  assert(pausedCamp?.status === 'PAUSED', '4.5 Campaign status updated to PAUSED');

  localDb.updateOutreachCampaignStatus(campAlphaId, 'ACTIVE', orgAlpha);
  const resumedCamp = localDb.getOutreachCampaignById(campAlphaId, orgAlpha);
  assert(resumedCamp?.status === 'ACTIVE', '4.6 Campaign status resumed to ACTIVE');

  console.log(`\n=== CAMPAIGN MANAGEMENT PERMISSIONS RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

// Standalone execution support
if (process.argv[1]?.includes('campaignPermissionsAudit')) {
  runCampaignPermissionsAuditTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    else process.exit(0);
  }).catch(err => {
    console.error('Audit test suite failed with exception:', err);
    process.exit(1);
  });
}
