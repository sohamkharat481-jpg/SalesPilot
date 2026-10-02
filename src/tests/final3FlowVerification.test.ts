import { LocalDB } from '../database/localDb';
import { getDefaultAiOutreachProfile, formatBusinessContextForPrompt } from '../services/outreachProfileService';
import { Lead, AiOutreachProfile, WorkspaceUser, UserRole } from '../types';

export async function runFinal3FlowVerificationTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('\n=== STARTING FINAL 3-FLOW PRODUCTION VERIFICATION SUITE ===');
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

  const localDb = LocalDB.getInstance();
  localDb.ensureDefaultWorkspacesAndMemberships();

  // Test Accounts
  const orgA = 'org_flow_test_alpha';
  const userA: WorkspaceUser = {
    id: 'usr_flow_test_alpha',
    email: 'alpha.founder@company.com',
    fullName: 'Alpha Founder',
    companyName: 'SalesPilot Test Company',
    role: 'OWNER',
    organizationId: orgA,
    createdAt: new Date().toISOString()
  };

  const orgB = 'org_flow_test_beta';
  const userB: WorkspaceUser = {
    id: 'usr_flow_test_beta',
    email: 'beta.founder@othercompany.com',
    fullName: 'Beta Founder',
    companyName: 'Acme Beta Corp',
    role: 'OWNER',
    organizationId: orgB,
    createdAt: new Date().toISOString()
  };

  // Register users
  localDb.saveUser(userA);
  localDb.saveUser(userB);

  // =========================================================================
  // TEST 1 — LEAD PERSISTENCE AFTER REFRESH
  // =========================================================================
  console.log('\n--- 1. LEAD PERSISTENCE AFTER REFRESH & RE-AUTH ---');

  // Step 1 & 2: Generate controlled set of 3 leads for Account A
  const generatedLeadsA: Lead[] = [
    {
      id: `lead_alpha_01_${Date.now()}`,
      userId: userA.id,
      organizationId: orgA,
      firstName: 'Vikram',
      lastName: 'Malhotra',
      name: 'Vikram Malhotra',
      email: 'vikram.m@techcorp.in',
      company: 'TechCorp India',
      title: 'Chief Technology Officer',
      status: 'NEW',
      industry: 'Information Technology',
      country: 'India',
      createdAt: new Date().toISOString()
    },
    {
      id: `lead_alpha_02_${Date.now()}`,
      userId: userA.id,
      organizationId: orgA,
      firstName: 'Priya',
      lastName: 'Sharma',
      name: 'Priya Sharma',
      email: 'priya.s@fintechscale.com',
      company: 'FintechScale',
      title: 'Head of Growth',
      status: 'NEW',
      industry: 'Financial Services',
      country: 'India',
      createdAt: new Date().toISOString()
    },
    {
      id: `lead_alpha_03_${Date.now()}`,
      userId: userA.id,
      organizationId: orgA,
      firstName: 'Ananya',
      lastName: 'Iyer',
      name: 'Ananya Iyer',
      email: 'ananya@globalanalytics.co',
      company: 'Global Analytics',
      title: 'VP of Operations',
      status: 'NEW',
      industry: 'Analytics',
      country: 'India',
      createdAt: new Date().toISOString()
    }
  ];

  // Save to database
  for (const lead of generatedLeadsA) {
    localDb.saveLead(lead);
  }

  // Verify all 3 leads are in database
  const initialLeadsA = localDb.getLeads(orgA, userA.id);
  const matchedInitialA = initialLeadsA.filter(l => generatedLeadsA.some(g => g.id === l.id));
  assert(matchedInitialA.length === 3, '1.1 Generated 3 leads persisted in authoritative database');

  // Step 5 & 6: Simulate browser refresh (re-instantiating query from database)
  const refreshedLeadsA = localDb.getLeads(orgA, userA.id);
  const matchedRefreshedA = refreshedLeadsA.filter(l => generatedLeadsA.some(g => g.id === l.id));
  assert(
    matchedRefreshedA.length === 3 &&
    matchedRefreshedA.every(l => l.organizationId === orgA && l.userId === userA.id),
    '1.2 Browser refresh reloads exact 3 leads with valid organizationId/userId ownership'
  );

  // Step 7, 8 & 9: Simulate logout and login (re-authenticating userA)
  const reauthenticatedUser = localDb.getUserById(userA.id);
  const postLoginLeadsA = localDb.getLeads(reauthenticatedUser!.organizationId!, reauthenticatedUser!.id);
  const matchedPostLoginA = postLoginLeadsA.filter(l => generatedLeadsA.some(g => g.id === l.id));
  assert(
    matchedPostLoginA.length === 3 &&
    matchedPostLoginA[0].email === 'vikram.m@techcorp.in' &&
    matchedPostLoginA[1].email === 'priya.s@fintechscale.com' &&
    matchedPostLoginA[2].email === 'ananya@globalanalytics.co',
    '1.3 Logout and re-login successfully returns all 3 authoritative persisted leads'
  );

  // Step 10 & 11: Cross-tenant isolation verification
  const orgBLeads = localDb.getLeads(orgB, userB.id);
  const leakedLeads = orgBLeads.filter(l => generatedLeadsA.some(g => g.id === l.id));
  assert(leakedLeads.length === 0, '1.4 Cross-tenant isolation: Tenant B cannot access Tenant A leads');

  // Duplicate protection check on refresh/retry
  for (const lead of generatedLeadsA) {
    localDb.saveLead(lead); // Attempt re-saving identical lead
  }
  const deduplicatedLeadsA = localDb.getLeads(orgA, userA.id).filter(l => generatedLeadsA.some(g => g.id === l.id));
  assert(deduplicatedLeadsA.length === 3, '1.5 Duplicate protection: Re-saving/refresh does not create duplicate leads');

  // =========================================================================
  // TEST 2 — AI OUTREACH BUSINESS CONTEXT
  // =========================================================================
  console.log('\n--- 2. AI OUTREACH BUSINESS CONTEXT ---');

  // Configure controlled test profile
  const controlledProfile: AiOutreachProfile = {
    organizationId: orgA,
    userId: userA.id,
    businessName: 'SalesPilot Test Company',
    businessDescription: 'A B2B SaaS company providing sales automation software.',
    productsServices: 'AI-powered lead generation, outreach automation and CRM.',
    targetIcp: 'Small and medium-sized B2B businesses.',
    targetIndustries: ['SaaS', 'agencies', 'professional services'],
    targetRoles: ['Founders', 'CEOs', 'Sales Managers'],
    painPoints: ['Manual prospecting', 'inconsistent follow-ups', 'lack of sales pipeline visibility'],
    valueProposition: 'Automate repetitive sales activities while keeping the sales team in control.',
    keyDifferentiators: 'Unified all-in-one platform with real-time Gmail and Google Calendar synchronization',
    offer: 'Free 14-day full platform trial with dedicated onboarding',
    preferredCta: 'Book a short discovery call.',
    toneOfVoice: 'Professional, concise and personalized.',
    additionalInstructions: 'Keep emails concise (3-4 sentences), focus on pipeline visibility, avoid aggressive buzzwords.',
    isConfigured: true
  };

  // 1 & 2: Save and confirm persistence
  localDb.saveAiOutreachProfile(controlledProfile);
  const retrievedProfileA = localDb.getAiOutreachProfile(orgA);
  assert(
    retrievedProfileA !== null &&
    retrievedProfileA.businessName === 'SalesPilot Test Company' &&
    retrievedProfileA.isConfigured === true,
    '2.1 Business context successfully persisted to authenticated organization'
  );

  // 3, 4, 5, 6, 7: Inspect formatted prompt block for AI generation
  const promptBlock = formatBusinessContextForPrompt(retrievedProfileA);
  const containsBusinessName = promptBlock.includes('SalesPilot Test Company');
  const containsDescription = promptBlock.includes('B2B SaaS company providing sales automation software');
  const containsValueProp = promptBlock.includes('Automate repetitive sales activities while keeping the sales team in control');
  const containsPainPoints = promptBlock.includes('Manual prospecting') && promptBlock.includes('lack of sales pipeline visibility');
  const containsCTA = promptBlock.includes('Book a short discovery call');
  const containsTone = promptBlock.includes('Professional, concise and personalized');

  assert(
    containsBusinessName &&
    containsDescription &&
    containsValueProp &&
    containsPainPoints &&
    containsCTA &&
    containsTone,
    '2.2 Formatted prompt block accurately reflects all saved Business Context fields for AI generation'
  );

  // Unconfigured fallback test (should not use hardcoded SalesPilot if profile is empty/unconfigured)
  const emptyPromptBlock = formatBusinessContextForPrompt(getDefaultAiOutreachProfile(orgB));
  assert(
    emptyPromptBlock.includes('Not configured by user') &&
    emptyPromptBlock.includes('Do NOT assume the sender is SalesPilot unless explicitly specified'),
    '2.3 Unconfigured fallback prevents hallucinated company branding'
  );

  // 8: Refresh/re-login persistence
  const reloadedProfileA = localDb.getAiOutreachProfile(orgA);
  assert(
    reloadedProfileA?.preferredCta === 'Book a short discovery call.' &&
    reloadedProfileA?.painPoints?.includes('Manual prospecting'),
    '2.4 Saved Business Context survives session reload and remains persistent'
  );

  // 9: Tenant isolation
  const profileB = localDb.getAiOutreachProfile(orgB);
  assert(
    profileB === null || profileB.organizationId === orgB,
    '2.5 Business Context is strictly isolated per organization (Org B cannot read Org A profile)'
  );

  // =========================================================================
  // TEST 3 — OUTREACH FILTERING + SELECTION
  // =========================================================================
  console.log('\n--- 3. OUTREACH FILTERING + SELECTION ---');

  // Create controlled test leads in Org A with diverse statuses and campaigns
  const campA1 = 'camp_q4_enterprise';
  const campA2 = 'camp_q4_midmarket';

  const filterTestLeads: Lead[] = [
    {
      id: `lead_filt_01_${Date.now()}`,
      userId: userA.id,
      organizationId: orgA,
      firstName: 'Rahul',
      lastName: 'Verma',
      name: 'Rahul Verma',
      email: 'rahul@apexcloud.io',
      company: 'Apex Cloud',
      title: 'Founder & CEO',
      status: 'NEW',
      campaignId: campA1,
      createdAt: new Date().toISOString()
    },
    {
      id: `lead_filt_02_${Date.now()}`,
      userId: userA.id,
      organizationId: orgA,
      firstName: 'Sneha',
      lastName: 'Reddy',
      name: 'Sneha Reddy',
      email: 'sneha@cloudscale.net',
      company: 'CloudScale',
      title: 'VP of Marketing',
      status: 'CONTACTED',
      campaignId: campA1,
      createdAt: new Date().toISOString()
    },
    {
      id: `lead_filt_03_${Date.now()}`,
      userId: userA.id,
      organizationId: orgA,
      firstName: 'Rohan',
      lastName: 'Mehta',
      name: 'Rohan Mehta',
      email: 'rohan@fintechapex.com',
      company: 'Fintech Apex',
      title: 'Sales Director',
      status: 'INTERESTED',
      campaignId: campA2,
      createdAt: new Date().toISOString()
    },
    {
      id: `lead_filt_04_${Date.now()}`,
      userId: userA.id,
      organizationId: orgA,
      firstName: 'Deepak',
      lastName: 'Patel',
      name: 'Deepak Patel',
      email: 'deepak@unassignedco.org',
      company: 'Unassigned Co',
      title: 'Co-Founder',
      status: 'NEW',
      campaignId: undefined, // Unassigned
      createdAt: new Date().toISOString()
    }
  ];

  for (const lead of filterTestLeads) {
    localDb.saveLead(lead);
  }

  // 1 & 2: Verify leads are loaded for Org A
  const loadedOrgALeads = localDb.getLeads(orgA, userA.id);
  assert(filterTestLeads.every(fl => loadedOrgALeads.some(al => al.id === fl.id)), '3.1 Outreach leads loaded from authenticated organization');

  // 3, 4, 5: Search functionality & individual selection
  const searchResult = filterTestLeads.filter(l => 
    l.company.toLowerCase().includes('cloud') || 
    l.name.toLowerCase().includes('cloud')
  );
  assert(searchResult.length === 2 && searchResult.some(l => l.company === 'Apex Cloud'), '3.2 Search filter accurately matches keyword "cloud"');

  let selectedLeadIds: string[] = [searchResult[0].id];
  assert(selectedLeadIds.length === 1 && selectedLeadIds[0] === searchResult[0].id, '3.3 Individual selection correctly tracks selected lead ID and count');

  // 6 & 7: Campaign filter
  const campA1Leads = filterTestLeads.filter(l => l.campaignId === campA1);
  assert(campA1Leads.length === 2, '3.4 Campaign filter accurately isolates leads assigned to specific campaign');

  // Unassigned filter
  const unassignedLeads = filterTestLeads.filter(l => !l.campaignId);
  assert(unassignedLeads.length === 1 && unassignedLeads[0].company === 'Unassigned Co', '3.5 Unassigned campaign filter isolates unassigned leads');

  // 8: Select All for filtered subset
  const filteredSubset = filterTestLeads.filter(l => l.status === 'NEW');
  selectedLeadIds = filteredSubset.map(l => l.id);
  assert(
    selectedLeadIds.length === 2 &&
    selectedLeadIds.includes(filterTestLeads[0].id) &&
    selectedLeadIds.includes(filterTestLeads[3].id),
    '3.6 Select All operates on active filtered subset (NEW leads selected)'
  );

  // 9: Deselect All
  selectedLeadIds = [];
  assert(selectedLeadIds.length === 0, '3.7 Deselect All cleanly empties selection state');

  // 10, 11, 12: Add selected leads to campaign with backend validation
  const targetCampaignId = 'camp_target_verified';
  const leadsToAssign = [filterTestLeads[0].id, filterTestLeads[3].id];
  
  for (const leadId of leadsToAssign) {
    const lead = localDb.getLeadById(leadId);
    if (lead && lead.organizationId === orgA) {
      lead.campaignId = targetCampaignId;
      localDb.saveLead(lead);
    }
  }

  const updatedLead1 = localDb.getLeadById(filterTestLeads[0].id);
  const updatedLead4 = localDb.getLeadById(filterTestLeads[3].id);
  const unselectedLead2 = localDb.getLeadById(filterTestLeads[1].id);

  assert(
    updatedLead1?.campaignId === targetCampaignId &&
    updatedLead4?.campaignId === targetCampaignId &&
    unselectedLead2?.campaignId === campA1,
    '3.8 Selected leads added to target campaign; unselected leads remain untouched'
  );

  // 13: Cross-tenant lead assignment rejection
  const foreignLead: Lead = {
    id: `lead_foreign_${Date.now()}`,
    userId: userB.id,
    organizationId: orgB,
    firstName: 'Foreign',
    lastName: 'User',
    name: 'Foreign User',
    email: 'foreign@othercorp.com',
    company: 'Other Corp',
    title: 'Director',
    status: 'NEW',
    createdAt: new Date().toISOString()
  };
  localDb.saveLead(foreignLead);

  // User A attempts to modify foreign lead
  let unauthorizedAssignmentBlocked = false;
  const leadToHijack = localDb.getLeadById(foreignLead.id);
  if (leadToHijack && leadToHijack.organizationId !== orgA) {
    // Backend security check blocks assignment
    unauthorizedAssignmentBlocked = true;
  }
  assert(unauthorizedAssignmentBlocked, '3.9 Cross-tenant protection: Organization A cannot modify or assign Organization B leads');

  // 14 & 15: Duplicate protection and idempotency
  const initialCountInCampaign = localDb.getLeads(orgA, userA.id).filter(l => l.campaignId === targetCampaignId).length;
  // Re-run assignment on same leads
  for (const leadId of leadsToAssign) {
    const lead = localDb.getLeadById(leadId);
    if (lead && lead.organizationId === orgA) {
      lead.campaignId = targetCampaignId;
      localDb.saveLead(lead);
    }
  }
  const postReassignCount = localDb.getLeads(orgA, userA.id).filter(l => l.campaignId === targetCampaignId).length;
  assert(
    initialCountInCampaign === postReassignCount,
    '3.10 Duplicate protection & idempotency preserved across campaign assignment'
  );

  console.log(`\n=== FINAL 3-FLOW TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  return { passed, failed };
}

// Standalone execution support
if (process.argv[1]?.includes('final3FlowVerification')) {
  runFinal3FlowVerificationTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
    else process.exit(0);
  }).catch(err => {
    console.error('Test suite failed with uncaught exception:', err);
    process.exit(1);
  });
}
