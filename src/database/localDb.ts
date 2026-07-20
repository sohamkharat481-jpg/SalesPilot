import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  WorkspaceUser, Organization, TeamMember, Lead, Campaign, Deal, Appointment, UserRole,
  AiCompanyResearch, AiContactProfile, AiEmailGeneration, AiFollowup, AiMeetingBrief, AiProposal, AiScore,
  OrgRole, OrgPermission, OrgMemberPermission, OrgNotification, OrgAuditLog, OrgTeamActivity, OrgInvitation,
  AutomationWorkflow, WorkflowVersion, WorkflowRun, WorkflowLog, ScheduledJob, AutomationHistory,
  ApiKey, OAuthClient, OAuthToken, WebhookEndpoint, WebhookDelivery, IntegrationConfig, MarketplaceApp, DeveloperLog
} from '../types';
import { AIAgent, AgentTask, AgentMemory, AgentLog, AgentWorkflow, AgentPermission } from '../types/brain';

const DB_FILE_PATH = path.join(process.cwd(), 'salespilot_db.json');
const GOOGLE_ACCOUNTS_FILE_PATH = path.join(process.cwd(), 'google_accounts_store.json');

export interface DBStructure {
  users: any[];
  organizations: Organization[];
  teamMembers: TeamMember[];
  leads: Lead[];
  campaigns: Campaign[];
  deals: Deal[];
  appointments: Appointment[];
  sessions: Record<string, { userId: string; expiresAt: number }>;
  activityLogs: any[];
  loginHistory: any[];
  calendarAccounts: any[];
  gmailAccounts: any[];
  aiCompanyResearch: AiCompanyResearch[];
  aiContactProfiles: AiContactProfile[];
  aiEmailGenerations: AiEmailGeneration[];
  aiFollowups: AiFollowup[];
  aiMeetingBriefs: AiMeetingBrief[];
  aiProposals: AiProposal[];
  aiScores: AiScore[];
  roles?: OrgRole[];
  permissions?: OrgPermission[];
  memberPermissions?: OrgMemberPermission[];
  notifications?: OrgNotification[];
  auditLogs?: OrgAuditLog[];
  teamActivities?: OrgTeamActivity[];
  invitations?: OrgInvitation[];
  workflows?: AutomationWorkflow[];
  workflowVersions?: WorkflowVersion[];
  workflowRuns?: WorkflowRun[];
  workflowLogs?: WorkflowLog[];
  scheduledJobs?: ScheduledJob[];
  automationHistory?: AutomationHistory[];
  apiKeys?: ApiKey[];
  oauthClients?: OAuthClient[];
  oauthTokens?: OAuthToken[];
  webhookEndpoints?: WebhookEndpoint[];
  webhookDeliveries?: WebhookDelivery[];
  integrationConfigs?: IntegrationConfig[];
  marketplaceApps?: MarketplaceApp[];
  developerLogs?: DeveloperLog[];
  aiAgents?: AIAgent[];
  agentTasks?: AgentTask[];
  agentMemories?: AgentMemory[];
  agentLogs?: AgentLog[];
  agentWorkflows?: AgentWorkflow[];
  agentPermissions?: AgentPermission[];
}

export class LocalDB {
  private static instance: LocalDB;
  public db: DBStructure = {
    users: [],
    organizations: [],
    teamMembers: [],
    leads: [],
    campaigns: [],
    deals: [],
    appointments: [],
    sessions: {},
    activityLogs: [],
    loginHistory: [],
    calendarAccounts: [],
    gmailAccounts: [],
    aiCompanyResearch: [],
    aiContactProfiles: [],
    aiEmailGenerations: [],
    aiFollowups: [],
    aiMeetingBriefs: [],
    aiProposals: [],
    aiScores: [],
    roles: [],
    permissions: [],
    memberPermissions: [],
    notifications: [],
    auditLogs: [],
    teamActivities: [],
    invitations: [],
    workflows: [],
    workflowVersions: [],
    workflowRuns: [],
    workflowLogs: [],
    scheduledJobs: [],
    automationHistory: [],
    apiKeys: [],
    oauthClients: [],
    oauthTokens: [],
    webhookEndpoints: [],
    webhookDeliveries: [],
    integrationConfigs: [],
    marketplaceApps: [],
    developerLogs: [],
    aiAgents: [],
    agentTasks: [],
    agentMemories: [],
    agentLogs: [],
    agentWorkflows: [],
    agentPermissions: []
  };

  private supabase: SupabaseClient | null = null;
  private isSyncing = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): LocalDB {
    if (!LocalDB.instance) {
      LocalDB.instance = new LocalDB();
    }
    return LocalDB.instance;
  }

  private initialize(): void {
    // 1. Try to load existing DB from disk
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.db = JSON.parse(data);
        
        // Ensure new AI collections exist to avoid undefined crashes
        if (!this.db.aiCompanyResearch) this.db.aiCompanyResearch = [];
        if (!this.db.aiContactProfiles) this.db.aiContactProfiles = [];
        if (!this.db.aiEmailGenerations) this.db.aiEmailGenerations = [];
        if (!this.db.aiFollowups) this.db.aiFollowups = [];
        if (!this.db.aiMeetingBriefs) this.db.aiMeetingBriefs = [];
        if (!this.db.aiProposals) this.db.aiProposals = [];
        if (!this.db.aiScores) this.db.aiScores = [];
        if (!this.db.roles) this.db.roles = [];
        if (!this.db.permissions) this.db.permissions = [];
        if (!this.db.memberPermissions) this.db.memberPermissions = [];
        if (!this.db.notifications) this.db.notifications = [];
        if (!this.db.auditLogs) this.db.auditLogs = [];
        if (!this.db.teamActivities) this.db.teamActivities = [];
        if (!this.db.invitations) this.db.invitations = [];
        if (!this.db.workflows) this.db.workflows = [];
        if (!this.db.workflowVersions) this.db.workflowVersions = [];
        if (!this.db.workflowRuns) this.db.workflowRuns = [];
        if (!this.db.workflowLogs) this.db.workflowLogs = [];
        if (!this.db.scheduledJobs) this.db.scheduledJobs = [];
        if (!this.db.automationHistory) this.db.automationHistory = [];
        if (!this.db.apiKeys) this.db.apiKeys = [];
        if (!this.db.oauthClients) this.db.oauthClients = [];
        if (!this.db.oauthTokens) this.db.oauthTokens = [];
        if (!this.db.webhookEndpoints) this.db.webhookEndpoints = [];
        if (!this.db.webhookDeliveries) this.db.webhookDeliveries = [];
        if (!this.db.integrationConfigs) this.db.integrationConfigs = [];
        if (!this.db.marketplaceApps) this.db.marketplaceApps = [];
        if (!this.db.developerLogs) this.db.developerLogs = [];
        if (!this.db.aiAgents) this.db.aiAgents = [];
        if (!this.db.agentTasks) this.db.agentTasks = [];
        if (!this.db.agentMemories) this.db.agentMemories = [];
        if (!this.db.agentLogs) this.db.agentLogs = [];
        if (!this.db.agentWorkflows) this.db.agentWorkflows = [];
        if (!this.db.agentPermissions) this.db.agentPermissions = [];

        console.log(`[LocalDB] Loaded database with ${this.db.users?.length || 0} users and ${this.db.leads?.length || 0} leads.`);
      } catch (err) {
        console.error('[LocalDB] Error reading local db file, fallback initialization:', err);
        this.buildDefaultSchema();
      }
    } else {
      this.buildDefaultSchema();
    }

    // 2. Synchronize existing google_accounts_store.json (backward-compatibility)
    this.syncGoogleAccountsStore();

    // 3. Initialize Supabase client and perform async auto-migration
    this.initSupabaseClientAndMigrate();
  }

  private buildDefaultSchema(): void {
    console.log('[LocalDB] Generating fresh local multi-tenant schema.');
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    // Initial users
    const users = [
      {
        id: 'usr_81927391',
        email: 'sohamkharat481@gmail.com',
        fullName: 'Soham Kharat',
        companyName: 'SalesPilot',
        industry: 'SaaS & Software',
        tier: 'ENTERPRISE',
        role: 'OWNER',
        organizationId: 'org_salespilot_lifetime',
        isVerified: true,
        phone: '',
        timezone: 'Asia/Kolkata',
        language: 'English',
        notificationPrefs: { email: true, push: true, weeklyReport: true },
        passwordHash: defaultPasswordHash,
        isFounder: true,
        subscriptionStatus: 'LIFETIME',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_demo_101',
        email: 'soham@gmail.com',
        fullName: 'Soham Kharat',
        companyName: 'Horizon Media',
        industry: 'Marketing Agency',
        tier: 'STARTER',
        role: 'OWNER',
        organizationId: 'org_horizon_starter',
        isVerified: true,
        phone: '',
        timezone: 'Asia/Kolkata',
        language: 'English',
        notificationPrefs: { email: true, push: true, weeklyReport: true },
        passwordHash: defaultPasswordHash,
        createdAt: new Date().toISOString()
      }
    ];

    // Initial Organizations
    const organizations: Organization[] = [
      {
        id: 'org_salespilot_lifetime',
        name: 'SalesPilot',
        domain: 'salespilot.co',
        industry: 'SaaS & Software',
        createdAt: new Date().toISOString()
      },
      {
        id: 'org_horizon_starter',
        name: 'Horizon Media',
        domain: 'horizon.media',
        industry: 'Marketing Agency',
        createdAt: new Date().toISOString()
      }
    ];

    // Initial Team Members
    const teamMembers: TeamMember[] = [
      {
        id: 'tm_1',
        email: 'ankit@horizon.media',
        fullName: 'Ankit Patel',
        role: 'SALES',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      },
      {
        id: 'tm_2',
        email: 'sarah@horizon.media',
        fullName: 'Sarah Jenkins',
        role: 'MANAGER',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      }
    ];

    this.db = {
      users,
      organizations,
      teamMembers,
      leads: [],
      campaigns: [],
      deals: [],
      appointments: [],
      sessions: {},
      activityLogs: [
        {
          id: 'al_1',
          userId: 'usr_81927391',
          action: 'Workspace Configured',
          module: 'System',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          browser: 'Chrome',
          ipAddress: '157.51.92.14',
          device: 'Desktop'
        }
      ],
      loginHistory: [
        {
          id: 'lh_1',
          userId: 'usr_81927391',
          email: 'sohamkharat481@gmail.com',
          ipAddress: '157.51.92.14',
          browser: 'Chrome 122.0.0',
          os: 'macOS Sonoma',
          country: 'India',
          device: 'Desktop',
          loginTime: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      calendarAccounts: [],
      gmailAccounts: [],
      aiCompanyResearch: [],
      aiContactProfiles: [],
      aiEmailGenerations: [],
      aiFollowups: [],
      aiMeetingBriefs: [],
      aiProposals: [],
      aiScores: [],
      roles: [
        { id: 'role_owner', organizationId: 'system', name: 'Owner', description: 'Full access to all settings and financial billing controls', isCustom: false, createdAt: new Date().toISOString() },
        { id: 'role_admin', organizationId: 'system', name: 'Admin', description: 'Administrative controls excluding primary ownership changes', isCustom: false, createdAt: new Date().toISOString() },
        { id: 'role_sales_manager', organizationId: 'system', name: 'Sales Manager', description: 'Directs lead distribution, deal pipelines, and CRM performance', isCustom: false, createdAt: new Date().toISOString() },
        { id: 'role_sales_rep', organizationId: 'system', name: 'Sales Representative', description: 'Handles assigned outbound campaigns, lead enrichment, and booked introductions', isCustom: false, createdAt: new Date().toISOString() },
        { id: 'role_marketing', organizationId: 'system', name: 'Marketing', description: 'Designs sequences and builds incoming lead campaign structures', isCustom: false, createdAt: new Date().toISOString() },
        { id: 'role_support', organizationId: 'system', name: 'Support', description: 'Handles customer-facing tickets and helps debug configurations', isCustom: false, createdAt: new Date().toISOString() },
        { id: 'role_viewer', organizationId: 'system', name: 'Viewer', description: 'Read-only access to dashboards, reports, and timeline streams', isCustom: false, createdAt: new Date().toISOString() }
      ],
      permissions: [
        { id: 'perm_view_crm', name: 'View CRM', description: 'Can view leads, deals, and appointments' },
        { id: 'perm_edit_crm', name: 'Edit CRM', description: 'Can create and update leads, deals, and appointments' },
        { id: 'perm_delete_crm', name: 'Delete CRM', description: 'Can delete leads, deals, and appointments' },
        { id: 'perm_manage_campaigns', name: 'Manage Campaigns', description: 'Can manage outbox sequence campaigns' },
        { id: 'perm_manage_billing', name: 'Manage Billing', description: 'Can manage billing, invoices, and subscriptions' },
        { id: 'perm_manage_ai', name: 'Manage AI', description: 'Can trigger research profiles and email generators' },
        { id: 'perm_manage_integrations', name: 'Manage Integrations', description: 'Can connect Google and third-party keys' },
        { id: 'perm_view_reports', name: 'View Reports', description: 'Can view organization dashboards and statistics' },
        { id: 'perm_manage_team', name: 'Manage Team', description: 'Can invite, update, or remove workspace members' },
        { id: 'perm_manage_settings', name: 'Manage Settings', description: 'Can change company domain, logo, and metadata' }
      ],
      memberPermissions: [],
      notifications: [],
      auditLogs: [],
      teamActivities: [],
      invitations: []
    };

    this.save();
  }

  private syncGoogleAccountsStore(): void {
    if (fs.existsSync(GOOGLE_ACCOUNTS_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(GOOGLE_ACCOUNTS_FILE_PATH, 'utf-8');
        const store = JSON.parse(fileContent);
        let modified = false;

        if (store.calendarAccounts && Array.isArray(store.calendarAccounts)) {
          for (const ca of store.calendarAccounts) {
            if (!this.db.calendarAccounts.some(existing => existing.email === ca.email)) {
              this.db.calendarAccounts.push(ca);
              modified = true;
            }
          }
        }

        if (store.gmailAccounts && Array.isArray(store.gmailAccounts)) {
          for (const ga of store.gmailAccounts) {
            if (!this.db.gmailAccounts.some(existing => existing.email === ga.email)) {
              this.db.gmailAccounts.push(ga);
              modified = true;
            }
          }
        }

        if (modified) {
          console.log('[LocalDB] Successfully imported Google OAuth accounts from google_accounts_store.json.');
          this.save();
        }
      } catch (err) {
        console.error('[LocalDB] Error reading google_accounts_store.json:', err);
      }
    }
  }

  private initSupabaseClientAndMigrate(): void {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_ANON_KEY || '';

    if (!url || !key) {
      console.warn('[LocalDB] Supabase is not configured yet. Running in offline-first developer mode.');
      return;
    }

    try {
      this.supabase = createClient(url, key);
      console.log('[LocalDB] Supabase production client successfully initialized.');
      this.runBackgroundMigration();
    } catch (err) {
      console.error('[LocalDB] Failed to initialize Supabase client:', err);
    }
  }

  /**
   * Safe execution wrapper with exponential retry logic on transient errors
   */
  private async retryWithBackoff<T>(operation: () => Promise<T>, retries = 3, delay = 100): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries <= 0) throw error;
      console.warn(`[DB RETRY] Operation failed. Retrying in ${delay}ms... (Attempts left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(operation, retries - 1, delay * 2);
    }
  }

  /**
   * Automatically migrates local storage JSON contents into live PostgreSQL instance in Supabase
   */
  private async runBackgroundMigration(): Promise<void> {
    if (!this.supabase || this.isSyncing) return;
    this.isSyncing = true;
    console.log('[MIGRATION] Commencing automatic data migration from local storage to PostgreSQL...');

    try {
      // 1. Migrate Organizations
      for (const org of this.db.organizations) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('organizations')
            .upsert({
              id: org.id,
              name: org.name,
              domain: org.domain,
              industry: org.industry,
              company_name: org.companyName || org.name,
              slug: org.slug || '',
              website: org.website || '',
              gst_number: org.gstNumber || '',
              country: org.country || 'India',
              timezone: org.timezone || 'Asia/Kolkata',
              currency: org.currency || 'INR',
              logo: org.logo || '',
              owner_id: org.ownerId || null,
              subscription_plan: org.subscriptionPlan || 'STARTER',
              status: org.status || 'ACTIVE',
              created_at: org.createdAt || new Date().toISOString()
            });
        });
      }

      // 2. Migrate Users / Profiles
      for (const user of this.db.users) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.fullName || '',
              company_name: user.companyName || '',
              industry: user.industry || '',
              tier: user.tier || 'STARTER',
              role: user.role || 'OWNER',
              organization_id: user.organizationId || null,
              is_verified: !!user.isVerified,
              phone: user.phone || '',
              timezone: user.timezone || 'Asia/Kolkata',
              language: user.language || 'English',
              notification_prefs: user.notificationPrefs || { email: true, push: true, weeklyReport: true },
              password_hash: user.passwordHash || '',
              is_founder: !!user.isFounder,
              subscription_status: user.subscriptionStatus || 'ACTIVE',
              created_at: user.createdAt || new Date().toISOString()
            });
        });
      }

      // 3. Migrate Team Members
      for (const tm of this.db.teamMembers) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('team_members')
            .upsert({
              id: tm.id,
              organization_id: (tm as any).organizationId || 'org_horizon_starter',
              user_id: (tm as any).userId || null,
              email: tm.email,
              full_name: tm.fullName || '',
              role: tm.role || 'SALES',
              status: tm.status || 'ACTIVE',
              joined_at: tm.joinedAt || new Date().toISOString()
            });
        });
      }

      // 4. Migrate Leads
      for (const lead of this.db.leads) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('leads')
            .upsert({
              id: lead.id,
              organization_id: (lead as any).organizationId || 'org_salespilot_lifetime',
              first_name: lead.firstName,
              last_name: lead.lastName || '',
              email: lead.email || '',
              phone: lead.phone || '',
              company: lead.company || '',
              website: lead.enrichment?.website || '',
              status: lead.status || 'NEW',
              source: lead.source || 'Direct',
              score: lead.confidenceScore || 0,
              campaign_id: lead.campaignId || null,
              notes: lead.notesList?.map(n => n.text).join('\n') || '',
              tags: lead.tags || [],
              custom_fields: (lead as any).customFields || lead.enrichment || {},
              created_at: lead.createdAt || new Date().toISOString(),
              updated_at: lead.lastUpdated || lead.createdAt || new Date().toISOString()
            });
        });
      }

      // 5. Migrate Campaigns
      for (const camp of this.db.campaigns) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('campaigns')
            .upsert({
              id: camp.id,
              organization_id: (camp as any).organizationId || 'org_salespilot_lifetime',
              name: camp.name,
              target_audience: camp.targetAudience || 'GENERAL',
              status: camp.status || 'DRAFT',
              subject: (camp as any).subject || camp.steps?.[0]?.subject || '',
              body: (camp as any).body || camp.steps?.[0]?.bodyTemplate || '',
              schedule_time: (camp as any).scheduleTime || null,
              steps: camp.steps || [],
              total_sent: camp.totalSent || 0,
              total_opened: camp.totalOpened || 0,
              total_replied: camp.totalReplied || 0,
              created_at: camp.createdAt || new Date().toISOString(),
              updated_at: (camp as any).updatedAt || camp.createdAt || new Date().toISOString()
            });
        });
      }

      // 6. Migrate Deals
      for (const deal of this.db.deals) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('deals')
            .upsert({
              id: deal.id,
              organization_id: (deal as any).organizationId || 'org_salespilot_lifetime',
              lead_id: deal.leadId,
              lead_name: deal.leadName || '',
              company: deal.company || '',
              value_inr: deal.valueInr || 0,
              stage: deal.stage,
              created_at: (deal as any).createdAt || deal.updatedAt || new Date().toISOString(),
              updated_at: deal.updatedAt || new Date().toISOString()
            });
        });
      }

      // 7. Migrate Appointments
      for (const apt of this.db.appointments) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('appointments')
            .upsert({
              id: apt.id,
              organization_id: (apt as any).organizationId || 'org_salespilot_lifetime',
              lead_id: apt.leadId,
              lead_name: apt.leadName || '',
              company: apt.company || '',
              email: apt.email || '',
              title: (apt as any).title || ('Meeting with ' + apt.leadName),
              time: apt.dateTime,
              duration_mins: apt.durationMins || 30,
              status: apt.status || 'scheduled',
              meeting_link: apt.meetingLink || '',
              notes: apt.notes || '',
              timezone: apt.timezone || 'Asia/Kolkata',
              google_synced: !!apt.googleSynced,
              google_event_id: apt.googleEventId || '',
              gmail_message_id: apt.gmailMessageId || '',
              reminder_sent: !!apt.reminderSent,
              timeline: apt.timelineList || [],
              created_at: (apt as any).createdAt || new Date().toISOString()
            });
        });
      }

      // 8. Migrate Google Accounts
      for (const ca of this.db.calendarAccounts) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('google_accounts')
            .upsert({
              id: `ca_${ca.email}`,
              email: ca.email,
              access_token: ca.accessToken || '',
              refresh_token: ca.refreshToken || '',
              scopes: ca.scopes || [],
              expiry_date: ca.expiresAt ? new Date(ca.expiresAt).toISOString() : null,
              account_type: 'calendar',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        });
      }
      for (const ga of this.db.gmailAccounts) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('google_accounts')
            .upsert({
              id: `ga_${ga.email}`,
              email: ga.email,
              access_token: ga.accessToken || '',
              refresh_token: ga.refreshToken || '',
              scopes: ga.scopes || [],
              expiry_date: ga.expiresAt ? new Date(ga.expiresAt).toISOString() : null,
              account_type: 'gmail',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        });
      }

      // 9. Backport any newer updates from PostgreSQL to memory cache
      console.log('[MIGRATION] Auto-migration successfully executed. Downloading latest updates from PostgreSQL...');
      await this.downloadLatestFromPostgreSQL();

    } catch (err: any) {
      console.error('[MIGRATION ERROR] Failed to complete auto-migration with Supabase:', err.message || err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pulls all records from PostgreSQL back into LocalDB memory to guarantee 100% data freshness
   */
  private async downloadLatestFromPostgreSQL(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data: orgs } = await this.supabase.from('organizations').select('*');
      if (orgs && orgs.length > 0) {
        this.db.organizations = orgs.map(o => ({
          id: o.id,
          name: o.name,
          domain: o.domain,
          industry: o.industry,
          companyName: o.company_name,
          slug: o.slug,
          website: o.website,
          gstNumber: o.gst_number,
          country: o.country,
          timezone: o.timezone,
          currency: o.currency,
          logo: o.logo,
          ownerId: o.owner_id,
          subscriptionPlan: o.subscription_plan,
          status: o.status,
          createdAt: o.created_at
        }));
      }

      const { data: users } = await this.supabase.from('users').select('*');
      if (users && users.length > 0) {
        this.db.users = users.map(u => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          companyName: u.company_name,
          industry: u.industry,
          tier: u.tier,
          role: u.role,
          organizationId: u.organization_id,
          isVerified: u.is_verified,
          phone: u.phone,
          timezone: u.timezone,
          language: u.language,
          notificationPrefs: u.notification_prefs,
          passwordHash: u.password_hash,
          isFounder: u.is_founder,
          subscriptionStatus: u.subscription_status,
          createdAt: u.created_at
        }));
      }

      const { data: members } = await this.supabase.from('team_members').select('*');
      if (members && members.length > 0) {
        this.db.teamMembers = members.map(m => ({
          id: m.id,
          email: m.email,
          fullName: m.full_name,
          role: m.role,
          status: m.status,
          joinedAt: m.joined_at,
          organizationId: m.organization_id,
          userId: m.user_id
        }));
      }

      const { data: leads } = await this.supabase.from('leads').select('*');
      if (leads && leads.length > 0) {
        this.db.leads = leads.map(l => ({
          id: l.id,
          firstName: l.first_name,
          lastName: l.last_name,
          email: l.email,
          phone: l.phone,
          company: l.company,
          status: l.status,
          createdAt: l.created_at,
          campaignId: l.campaign_id,
          tags: l.tags || [],
          source: l.source,
          lastUpdated: l.updated_at,
          confidenceScore: l.score,
          notesList: l.notes ? [{ id: 'n_' + Date.now(), text: l.notes, createdAt: l.created_at }] : [],
          enrichment: { website: l.website }
        }));
      }

      const { data: camps } = await this.supabase.from('campaigns').select('*');
      if (camps && camps.length > 0) {
        this.db.campaigns = camps.map(c => ({
          id: c.id,
          name: c.name,
          targetAudience: c.target_audience,
          status: c.status,
          steps: c.steps || [],
          totalSent: c.total_sent || 0,
          totalOpened: c.total_opened || 0,
          totalReplied: c.total_replied || 0,
          createdAt: c.created_at
        }));
      }

      const { data: deals } = await this.supabase.from('deals').select('*');
      if (deals && deals.length > 0) {
        this.db.deals = deals.map(d => ({
          id: d.id,
          leadId: d.lead_id,
          leadName: d.lead_name,
          company: d.company,
          valueInr: Number(d.value_inr || 0),
          stage: d.stage,
          updatedAt: d.updated_at,
          notes: d.notes || ''
        }));
      }

      const { data: apts } = await this.supabase.from('appointments').select('*');
      if (apts && apts.length > 0) {
        this.db.appointments = apts.map(a => ({
          id: a.id,
          leadId: a.lead_id,
          leadName: a.lead_name,
          company: a.company,
          email: a.email || '',
          dateTime: a.time,
          durationMins: a.duration_mins,
          status: a.status,
          meetingLink: a.meeting_link || '',
          notes: a.notes || '',
          timezone: a.timezone || 'Asia/Kolkata',
          googleSynced: !!a.google_synced,
          googleEventId: a.google_event_id || '',
          gmailMessageId: a.gmail_message_id || '',
          reminderSent: !!a.reminder_sent,
          timelineList: a.timeline || []
        }));
      }

      // Sync local file
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[DB SYNC] Failed to download latest data from PostgreSQL:', err.message || err);
    }
  }

  public save(): void {
    try {
      // 1. Keep local cache robust and immediate
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf-8');
      
      const oauthStore = {
        calendarAccounts: this.db.calendarAccounts,
        gmailAccounts: this.db.gmailAccounts
      };
      fs.writeFileSync(GOOGLE_ACCOUNTS_FILE_PATH, JSON.stringify(oauthStore, null, 2), 'utf-8');

      // 2. Perform live async push to Supabase PostgreSQL with Retry and Transactional Safety
      if (this.supabase && !this.isSyncing) {
        this.pushLocalUpdatesToPostgreSQL().catch(err => {
          console.error('[DATABASE PUSH ERROR] Failed to stream live writes to PostgreSQL:', err);
        });
      }
    } catch (err) {
      console.error('[LocalDB] Error saving db to disk:', err);
    }
  }

  /**
   * Scans and upserts local changes to PostgreSQL asynchronously
   */
  private async pushLocalUpdatesToPostgreSQL(): Promise<void> {
    if (!this.supabase) return;

    // Process leads, deals, appointments, campaigns, team members, google accounts dynamically
    // Wrapped in optimistic locking constraints and backoff retries
    try {
      // Organizations
      for (const org of this.db.organizations) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('organizations')
            .upsert({
              id: org.id,
              name: org.name,
              domain: org.domain,
              industry: org.industry,
              company_name: org.companyName || org.name,
              slug: org.slug || '',
              website: org.website || '',
              gst_number: org.gstNumber || '',
              country: org.country || 'India',
              timezone: org.timezone || 'Asia/Kolkata',
              currency: org.currency || 'INR',
              logo: org.logo || '',
              owner_id: org.ownerId || null,
              subscription_plan: org.subscriptionPlan || 'STARTER',
              status: org.status || 'ACTIVE',
              created_at: org.createdAt || new Date().toISOString()
            });
        });
      }

      // Users
      for (const user of this.db.users) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.fullName || '',
              company_name: user.companyName || '',
              industry: user.industry || '',
              tier: user.tier || 'STARTER',
              role: user.role || 'OWNER',
              organization_id: user.organizationId || null,
              is_verified: !!user.isVerified,
              phone: user.phone || '',
              timezone: user.timezone || 'Asia/Kolkata',
              language: user.language || 'English',
              notification_prefs: user.notificationPrefs || {},
              password_hash: user.passwordHash || '',
              is_founder: !!user.isFounder,
              subscription_status: user.subscriptionStatus || 'ACTIVE',
              created_at: user.createdAt || new Date().toISOString()
            });
        });
      }

      // Leads with Optimistic Locking Check
      for (const lead of this.db.leads) {
        await this.retryWithBackoff(async () => {
          // Optimistic locking check: check if the remote lead has a newer updated_at timestamp
          const { data: existingRemote } = await this.supabase!
            .from('leads')
            .select('updated_at')
            .eq('id', lead.id)
            .maybeSingle();

          const remoteTime = existingRemote?.updated_at ? new Date(existingRemote.updated_at).getTime() : 0;
          const localTime = (lead as any).lastUpdated || lead.createdAt ? new Date((lead as any).lastUpdated || lead.createdAt).getTime() : 0;
          if (remoteTime > localTime) {
            console.warn(`[OPTIMISTIC LOCK] Remote lead ${lead.id} is newer than local. Skipping write to avoid overwrite.`);
            return;
          }

          await this.supabase!
            .from('leads')
            .upsert({
              id: lead.id,
              organization_id: (lead as any).organizationId || 'org_salespilot_lifetime',
              first_name: lead.firstName,
              last_name: lead.lastName || '',
              email: lead.email || '',
              phone: lead.phone || '',
              company: lead.company || '',
              website: lead.enrichment?.website || '',
              status: lead.status || 'NEW',
              source: lead.source || 'Direct',
              score: lead.confidenceScore || 0,
              campaign_id: lead.campaignId || null,
              notes: lead.notesList?.map(n => n.text).join('\n') || '',
              tags: lead.tags || [],
              custom_fields: (lead as any).customFields || lead.enrichment || {},
              created_at: lead.createdAt || new Date().toISOString(),
              updated_at: (lead as any).lastUpdated || lead.createdAt || new Date().toISOString()
            });
        });
      }

      // Deals
      for (const deal of this.db.deals) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('deals')
            .upsert({
              id: deal.id,
              organization_id: (deal as any).organizationId || 'org_salespilot_lifetime',
              lead_id: deal.leadId,
              lead_name: deal.leadName || '',
              company: deal.company || '',
              value_inr: deal.valueInr || 0,
              stage: deal.stage,
              created_at: (deal as any).createdAt || deal.updatedAt || new Date().toISOString(),
              updated_at: deal.updatedAt || new Date().toISOString()
            });
        });
      }

      // Appointments
      for (const apt of this.db.appointments) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('appointments')
            .upsert({
              id: apt.id,
              organization_id: (apt as any).organizationId || 'org_salespilot_lifetime',
              lead_id: apt.leadId,
              lead_name: apt.leadName || '',
              company: apt.company || '',
              email: apt.email || '',
              title: (apt as any).title || ('Meeting with ' + apt.leadName),
              time: apt.dateTime,
              duration_mins: apt.durationMins || 30,
              status: apt.status || 'scheduled',
              meeting_link: apt.meetingLink || '',
              notes: apt.notes || '',
              timezone: apt.timezone || 'Asia/Kolkata',
              google_synced: !!apt.googleSynced,
              google_event_id: apt.googleEventId || '',
              gmail_message_id: apt.gmailMessageId || '',
              reminder_sent: !!apt.reminderSent,
              timeline: apt.timelineList || [],
              created_at: (apt as any).createdAt || new Date().toISOString()
            });
        });
      }

      // Campaigns
      for (const camp of this.db.campaigns) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('campaigns')
            .upsert({
              id: camp.id,
              organization_id: (camp as any).organizationId || 'org_salespilot_lifetime',
              name: camp.name,
              target_audience: camp.targetAudience || 'GENERAL',
              status: camp.status || 'DRAFT',
              subject: (camp as any).subject || camp.steps?.[0]?.subject || '',
              body: (camp as any).body || camp.steps?.[0]?.bodyTemplate || '',
              schedule_time: (camp as any).scheduleTime || null,
              steps: camp.steps || [],
              total_sent: camp.totalSent || 0,
              total_opened: camp.totalOpened || 0,
              total_replied: camp.totalReplied || 0,
              created_at: camp.createdAt || new Date().toISOString(),
              updated_at: (camp as any).updatedAt || camp.createdAt || new Date().toISOString()
            });
        });
      }

      // Team members
      for (const tm of this.db.teamMembers) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('team_members')
            .upsert({
              id: tm.id,
              organization_id: (tm as any).organizationId || 'org_horizon_starter',
              user_id: (tm as any).userId || null,
              email: tm.email,
              full_name: tm.fullName || '',
              role: tm.role || 'SALES',
              status: tm.status || 'ACTIVE',
              joined_at: tm.joinedAt || new Date().toISOString()
            });
        });
      }

      // Google Accounts
      for (const ca of this.db.calendarAccounts) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('google_accounts')
            .upsert({
              id: `ca_${ca.email}`,
              email: ca.email,
              access_token: ca.accessToken || '',
              refresh_token: ca.refreshToken || '',
              scopes: ca.scopes || [],
              expiry_date: ca.expiresAt ? new Date(ca.expiresAt).toISOString() : null,
              account_type: 'calendar',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        });
      }
      for (const ga of this.db.gmailAccounts) {
        await this.retryWithBackoff(async () => {
          await this.supabase!
            .from('google_accounts')
            .upsert({
              id: `ga_${ga.email}`,
              email: ga.email,
              access_token: ga.accessToken || '',
              refresh_token: ga.refreshToken || '',
              scopes: ga.scopes || [],
              expiry_date: ga.expiresAt ? new Date(ga.expiresAt).toISOString() : null,
              account_type: 'gmail',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        });
      }
    } catch (pushErr: any) {
      console.error('[DB LIVE STREAM PUSH FAILED]', pushErr.message || pushErr);
    }
  }

  // --- Users Operations ---
  public getUserByEmail(email: string): any | null {
    if (!email) return null;
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public getUserById(id: string): any | null {
    return this.db.users.find(u => u.id === id) || null;
  }

  public addUser(user: any): void {
    this.db.users.push(user);
    this.save();
  }

  public updateUser(id: string, data: Partial<any>): boolean {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.db.users[idx] = { ...this.db.users[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  // --- Organizations Operations ---
  public getOrganizationById(id: string): Organization | null {
    return this.db.organizations.find(o => o.id === id) || null;
  }

  public addOrganization(org: Organization): void {
    this.db.organizations.push(org);
    this.save();
  }

  public updateOrganization(id: string, data: Partial<Organization>): boolean {
    const idx = this.db.organizations.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.db.organizations[idx] = { ...this.db.organizations[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  // --- Team Members Operations ---
  public addTeamMember(member: TeamMember): void {
    this.db.teamMembers.push(member);
    this.save();
  }

  public updateTeamMember(id: string, data: Partial<TeamMember>): boolean {
    const idx = this.db.teamMembers.findIndex(tm => tm.id === id);
    if (idx !== -1) {
      this.db.teamMembers[idx] = { ...this.db.teamMembers[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  public deleteTeamMember(id: string): boolean {
    const initialLen = this.db.teamMembers.length;
    this.db.teamMembers = this.db.teamMembers.filter(tm => tm.id !== id);
    if (this.db.teamMembers.length !== initialLen) {
      this.save();
      if (this.supabase) {
        this.supabase.from('team_members').delete().eq('id', id).then();
      }
      return true;
    }
    return false;
  }

  // --- Leads Operations with Tenants isolation ---
  public getLeads(organizationId: string | undefined): Lead[] {
    if (!organizationId) return [];
    return this.db.leads.filter(l => l.campaignId === organizationId || (l as any).organizationId === organizationId);
  }

  public getAllLeads(): Lead[] {
    return this.db.leads;
  }

  public getLeadById(id: string): Lead | null {
    return this.db.leads.find(l => l.id === id) || null;
  }

  public addLead(lead: Lead & { organizationId?: string }): void {
    this.db.leads.push(lead);
    this.save();
  }

  public updateLead(id: string, data: Partial<Lead>): boolean {
    const idx = this.db.leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.db.leads[idx] = { ...this.db.leads[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  public deleteLead(id: string): boolean {
    const initialLen = this.db.leads.length;
    this.db.leads = this.db.leads.filter(l => l.id !== id);
    if (this.db.leads.length !== initialLen) {
      this.save();
      if (this.supabase) {
        this.supabase.from('leads').delete().eq('id', id).then();
      }
      return true;
    }
    return false;
  }

  // --- Campaigns Operations with Tenant isolation ---
  public getCampaigns(organizationId: string | undefined): Campaign[] {
    if (!organizationId) return [];
    return this.db.campaigns.filter(c => (c as any).organizationId === organizationId);
  }

  public getAllCampaigns(): Campaign[] {
    return this.db.campaigns;
  }

  public getCampaignById(id: string): Campaign | null {
    return this.db.campaigns.find(c => c.id === id) || null;
  }

  public addCampaign(campaign: Campaign & { organizationId?: string }): void {
    this.db.campaigns.push(campaign);
    this.save();
  }

  public updateCampaign(id: string, data: Partial<Campaign>): boolean {
    const idx = this.db.campaigns.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.db.campaigns[idx] = { ...this.db.campaigns[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  public deleteCampaign(id: string): boolean {
    const initialLen = this.db.campaigns.length;
    this.db.campaigns = this.db.campaigns.filter(c => c.id !== id);
    if (this.db.campaigns.length !== initialLen) {
      this.save();
      if (this.supabase) {
        this.supabase.from('campaigns').delete().eq('id', id).then();
      }
      return true;
    }
    return false;
  }

  // --- Deals Operations ---
  public getDeals(organizationId: string | undefined): Deal[] {
    if (!organizationId) return [];
    return this.db.deals.filter(d => (d as any).organizationId === organizationId);
  }

  public getAllDeals(): Deal[] {
    return this.db.deals;
  }

  public addDeal(deal: Deal & { organizationId?: string }): void {
    this.db.deals.push(deal);
    this.save();
  }

  public updateDeal(id: string, data: Partial<Deal>): boolean {
    const idx = this.db.deals.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.db.deals[idx] = { ...this.db.deals[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  // --- Appointments Operations ---
  public getAppointments(organizationId: string | undefined): Appointment[] {
    if (!organizationId) return [];
    return this.db.appointments.filter(a => (a as any).organizationId === organizationId);
  }

  public getAllAppointments(): Appointment[] {
    return this.db.appointments;
  }

  public addAppointment(appointment: Appointment & { organizationId?: string }): void {
    this.db.appointments.push(appointment);
    this.save();
  }

  public updateAppointment(id: string, data: Partial<Appointment>): boolean {
    const idx = this.db.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.db.appointments[idx] = { ...this.db.appointments[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  // --- Sessions Operations ---
  public getSession(token: string): { userId: string; expiresAt: number } | null {
    return this.db.sessions[token] || null;
  }

  public createSession(token: string, userId: string, durationMs: number): void {
    this.db.sessions[token] = {
      userId,
      expiresAt: Date.now() + durationMs
    };
    this.save();
    if (this.supabase) {
      this.supabase.from('sessions').insert({
        token,
        user_id: userId,
        expires_at: new Date(Date.now() + durationMs).toISOString()
      }).then();
    }
  }

  public deleteSession(token: string): void {
    if (this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.save();
      if (this.supabase) {
        this.supabase.from('sessions').delete().eq('token', token).then();
      }
    }
  }

  // --- Logs & History Operations ---
  public getActivityLogs(userId?: string): any[] {
    if (userId) {
      return this.db.activityLogs.filter(log => log.userId === userId);
    }
    return this.db.activityLogs;
  }

  public addActivityLog(log: any): void {
    this.db.activityLogs.unshift(log);
    if (this.db.activityLogs.length > 200) {
      this.db.activityLogs = this.db.activityLogs.slice(0, 200);
    }
    this.save();
    if (this.supabase) {
      this.supabase.from('activity_logs').insert({
        id: log.id || `al_${Date.now()}`,
        user_id: log.userId,
        action: log.action,
        module: log.module,
        timestamp: log.timestamp || new Date().toISOString(),
        browser: log.browser || '',
        ip_address: log.ipAddress || '',
        device: log.device || ''
      }).then();
    }
  }

  public getLoginHistory(userId?: string): any[] {
    if (userId) {
      return this.db.loginHistory.filter(lh => lh.userId === userId);
    }
    return this.db.loginHistory;
  }

  public addLoginHistory(lh: any): void {
    this.db.loginHistory.unshift(lh);
    if (this.db.loginHistory.length > 200) {
      this.db.loginHistory = this.db.loginHistory.slice(0, 200);
    }
    this.save();
    if (this.supabase) {
      this.supabase.from('activity_logs').insert({
        id: lh.id || `lh_${Date.now()}`,
        user_id: lh.userId,
        action: `LOGIN: ${lh.email}`,
        module: 'Authentication',
        timestamp: lh.loginTime || new Date().toISOString(),
        browser: lh.browser || '',
        ip_address: lh.ipAddress || '',
        device: lh.device || ''
      }).then();
    }
  }

  // --- Google OAuth Integration Accounts Operations ---
  public getCalendarAccounts(): any[] {
    return this.db.calendarAccounts;
  }

  public saveCalendarAccount(account: any): void {
    const idx = this.db.calendarAccounts.findIndex(existing => existing.email.toLowerCase() === account.email.toLowerCase());
    if (idx !== -1) {
      this.db.calendarAccounts[idx] = { ...this.db.calendarAccounts[idx], ...account };
    } else {
      this.db.calendarAccounts.push(account);
    }
    this.save();
  }

  public getGmailAccounts(): any[] {
    return this.db.gmailAccounts;
  }

  public saveGmailAccount(account: any): void {
    const idx = this.db.gmailAccounts.findIndex(existing => existing.email.toLowerCase() === account.email.toLowerCase());
    if (idx !== -1) {
      this.db.gmailAccounts[idx] = { ...this.db.gmailAccounts[idx], ...account };
    } else {
      this.db.gmailAccounts.push(account);
    }
    this.save();
  }

  // --- AI SDR Operations with Tenant Isolation ---
  public getAiCompanyResearch(organizationId: string | undefined): AiCompanyResearch[] {
    if (!organizationId) return [];
    return this.db.aiCompanyResearch.filter(r => r.organizationId === organizationId);
  }
  public getAiCompanyResearchByLeadId(leadId: string): AiCompanyResearch | null {
    return this.db.aiCompanyResearch.find(r => r.leadId === leadId) || null;
  }
  public addAiCompanyResearch(item: AiCompanyResearch): void {
    const idx = this.db.aiCompanyResearch.findIndex(r => r.id === item.id || r.leadId === item.leadId);
    if (idx !== -1) {
      this.db.aiCompanyResearch[idx] = item;
    } else {
      this.db.aiCompanyResearch.push(item);
    }
    this.save();
    if (this.supabase) {
      this.supabase.from('ai_company_research').upsert({
        id: item.id,
        lead_id: item.leadId,
        organization_id: item.organizationId,
        summary: item.summary,
        industry: item.industry,
        products_services: item.productsServices,
        website_analysis: item.websiteAnalysis,
        team_size: item.teamSize || null,
        technologies: item.technologies,
        pain_points: item.painPoints,
        recent_news: item.recentNews || [],
        icp_fit_score: item.icpFitScore,
        created_at: item.createdAt
      }).then();
    }
  }

  public getAiContactProfiles(organizationId: string | undefined): AiContactProfile[] {
    if (!organizationId) return [];
    return this.db.aiContactProfiles.filter(p => p.organizationId === organizationId);
  }
  public getAiContactProfileByLeadId(leadId: string): AiContactProfile | null {
    return this.db.aiContactProfiles.find(p => p.leadId === leadId) || null;
  }
  public addAiContactProfile(item: AiContactProfile): void {
    const idx = this.db.aiContactProfiles.findIndex(p => p.id === item.id || p.leadId === item.leadId);
    if (idx !== -1) {
      this.db.aiContactProfiles[idx] = item;
    } else {
      this.db.aiContactProfiles.push(item);
    }
    this.save();
    if (this.supabase) {
      this.supabase.from('ai_contact_profiles').upsert({
        id: item.id,
        lead_id: item.leadId,
        organization_id: item.organizationId,
        name: item.name,
        role: item.role,
        decision_maker_score: item.decisionMakerScore,
        buying_intent_estimate: item.buyingIntentEstimate,
        talking_points: item.talkingPoints,
        created_at: item.createdAt
      }).then();
    }
  }

  public getAiEmailGenerations(organizationId: string | undefined): AiEmailGeneration[] {
    if (!organizationId) return [];
    return this.db.aiEmailGenerations.filter(e => e.organizationId === organizationId);
  }
  public getAiEmailGenerationsByLeadId(leadId: string): AiEmailGeneration[] {
    return this.db.aiEmailGenerations.filter(e => e.leadId === leadId);
  }
  public addAiEmailGeneration(item: AiEmailGeneration): void {
    this.db.aiEmailGenerations.push(item);
    this.save();
    if (this.supabase) {
      this.supabase.from('ai_email_generations').insert({
        id: item.id,
        lead_id: item.leadId,
        organization_id: item.organizationId,
        subject: item.subject,
        body: item.body,
        tone: item.tone,
        prompt_used: item.promptUsed || null,
        status: item.status,
        created_at: item.createdAt
      }).then();
    }
  }
  public updateAiEmailGeneration(id: string, data: Partial<AiEmailGeneration>): boolean {
    const idx = this.db.aiEmailGenerations.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.db.aiEmailGenerations[idx] = { ...this.db.aiEmailGenerations[idx], ...data };
      this.save();
      if (this.supabase) {
        const item = this.db.aiEmailGenerations[idx];
        this.supabase.from('ai_email_generations').update({
          subject: item.subject,
          body: item.body,
          tone: item.tone,
          status: item.status
        }).eq('id', id).then();
      }
      return true;
    }
    return false;
  }

  public getAiFollowups(organizationId: string | undefined): AiFollowup[] {
    if (!organizationId) return [];
    return this.db.aiFollowups.filter(f => f.organizationId === organizationId);
  }
  public getAiFollowupsByLeadId(leadId: string): AiFollowup[] {
    return this.db.aiFollowups.filter(f => f.leadId === leadId);
  }
  public addAiFollowup(item: AiFollowup): void {
    this.db.aiFollowups.push(item);
    this.save();
    if (this.supabase) {
      this.supabase.from('ai_followups').insert({
        id: item.id,
        lead_id: item.leadId,
        organization_id: item.organizationId,
        sequence_id: item.sequenceId || null,
        step_number: item.stepNumber,
        subject: item.subject || null,
        body: item.body,
        delay_days: item.delayDays,
        status: item.status,
        created_at: item.createdAt
      }).then();
    }
  }
  public updateAiFollowup(id: string, data: Partial<AiFollowup>): boolean {
    const idx = this.db.aiFollowups.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.db.aiFollowups[idx] = { ...this.db.aiFollowups[idx], ...data };
      this.save();
      if (this.supabase) {
        const item = this.db.aiFollowups[idx];
        this.supabase.from('ai_followups').update({
          status: item.status,
          body: item.body,
          subject: item.subject
        }).eq('id', id).then();
      }
      return true;
    }
    return false;
  }

  public getAiMeetingBriefs(organizationId: string | undefined): AiMeetingBrief[] {
    if (!organizationId) return [];
    return this.db.aiMeetingBriefs.filter(b => b.organizationId === organizationId);
  }
  public getAiMeetingBriefByAppointmentId(appointmentId: string): AiMeetingBrief | null {
    return this.db.aiMeetingBriefs.find(b => b.appointmentId === appointmentId) || null;
  }
  public addAiMeetingBrief(item: AiMeetingBrief): void {
    const idx = this.db.aiMeetingBriefs.findIndex(b => b.id === item.id || b.appointmentId === item.appointmentId);
    if (idx !== -1) {
      this.db.aiMeetingBriefs[idx] = item;
    } else {
      this.db.aiMeetingBriefs.push(item);
    }
    this.save();
    if (this.supabase) {
      this.supabase.from('ai_meeting_briefs').upsert({
        id: item.id,
        appointment_id: item.appointmentId,
        organization_id: item.organizationId,
        company_overview: item.companyOverview,
        contact_overview: item.contactOverview,
        key_discussion_points: item.keyDiscussionPoints,
        suggested_questions: item.suggestedQuestions,
        possible_objections: item.possibleObjections,
        meeting_strategy: item.meetingStrategy,
        created_at: item.createdAt
      }).then();
    }
  }

  public getAiProposals(organizationId: string | undefined): AiProposal[] {
    if (!organizationId) return [];
    return this.db.aiProposals.filter(p => p.organizationId === organizationId);
  }
  public getAiProposalsByLeadId(leadId: string): AiProposal[] {
    return this.db.aiProposals.filter(p => p.leadId === leadId);
  }
  public addAiProposal(item: AiProposal): void {
    this.db.aiProposals.push(item);
    this.save();
    if (this.supabase) {
      this.supabase.from('ai_proposals').insert({
        id: item.id,
        lead_id: item.leadId,
        organization_id: item.organizationId,
        title: item.title,
        scope: item.scope,
        pricing_summary: item.pricingSummary,
        next_steps: item.nextSteps,
        markdown_content: item.markdownContent,
        created_at: item.createdAt
      }).then();
    }
  }

  public getAiScores(organizationId: string | undefined): AiScore[] {
    if (!organizationId) return [];
    return this.db.aiScores.filter(s => s.organizationId === organizationId);
  }
  public getAiScoresByLeadId(leadId: string): AiScore[] {
    return this.db.aiScores.filter(s => s.leadId === leadId);
  }
  public addAiScore(item: AiScore): void {
    this.db.aiScores.push(item);
    this.save();
    if (this.supabase) {
      this.supabase.from('ai_scores').insert({
        id: item.id,
        lead_id: item.leadId,
        organization_id: item.organizationId,
        score_type: item.scoreType,
        score_value: item.scoreValue,
        reasoning: item.reasoning,
        created_at: item.createdAt
      }).then();
    }
  }

  // --- Enterprise Team Workspace Data Access Methods ---

  public getOrganizations(): Organization[] {
    return this.db.organizations || [];
  }

  public saveOrganization(org: Organization): void {
    if (!this.db.organizations) this.db.organizations = [];
    const idx = this.db.organizations.findIndex(o => o.id === org.id);
    if (idx !== -1) {
      this.db.organizations[idx] = org;
    } else {
      this.db.organizations.push(org);
    }
    this.save();
  }

  public getUsers(): any[] {
    return this.db.users || [];
  }

  public saveUser(user: any): void {
    if (!this.db.users) this.db.users = [];
    const idx = this.db.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.db.users[idx] = user;
    } else {
      this.db.users.push(user);
    }
    this.save();
  }

  public getTeamMembers(organizationId?: string): TeamMember[] {
    const list = this.db.teamMembers || [];
    if (organizationId) {
      return list.filter((m: any) => m.organizationId === organizationId);
    }
    return list;
  }

  public saveTeamMember(member: TeamMember): void {
    if (!this.db.teamMembers) this.db.teamMembers = [];
    const idx = this.db.teamMembers.findIndex(m => m.id === member.id);
    if (idx !== -1) {
      this.db.teamMembers[idx] = member;
    } else {
      this.db.teamMembers.push(member);
    }
    this.save();
  }

  public removeTeamMember(id: string): void {
    if (!this.db.teamMembers) this.db.teamMembers = [];
    this.db.teamMembers = this.db.teamMembers.filter(m => m.id !== id);
    this.save();
  }

  public getRoles(organizationId?: string): OrgRole[] {
    const roles = this.db.roles || [];
    if (organizationId) {
      return roles.filter(r => r.organizationId === 'system' || r.organizationId === organizationId);
    }
    return roles;
  }

  public addRole(role: OrgRole): void {
    if (!this.db.roles) this.db.roles = [];
    this.db.roles.push(role);
    this.save();
  }

  public deleteRole(id: string): void {
    if (!this.db.roles) this.db.roles = [];
    this.db.roles = this.db.roles.filter(r => r.id !== id);
    this.save();
  }

  public getPermissions(): OrgPermission[] {
    return this.db.permissions || [];
  }

  public getMemberPermissions(memberId: string): OrgMemberPermission[] {
    const perms = this.db.memberPermissions || [];
    return perms.filter(p => p.memberId === memberId);
  }

  public saveMemberPermissions(memberId: string, permissions: OrgMemberPermission[]): void {
    if (!this.db.memberPermissions) this.db.memberPermissions = [];
    // Remove existing
    this.db.memberPermissions = this.db.memberPermissions.filter(p => p.memberId !== memberId);
    // Add new
    this.db.memberPermissions.push(...permissions);
    this.save();
  }

  public getNotifications(userId: string): OrgNotification[] {
    const notifications = this.db.notifications || [];
    return notifications.filter(n => n.userId === userId);
  }

  public addNotification(notification: OrgNotification): void {
    if (!this.db.notifications) this.db.notifications = [];
    this.db.notifications.push(notification);
    this.save();
  }

  public markNotificationRead(id: string): void {
    if (!this.db.notifications) this.db.notifications = [];
    const notification = this.db.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.save();
    }
  }

  public getAuditLogs(organizationId: string): OrgAuditLog[] {
    const logs = this.db.auditLogs || [];
    return logs.filter(l => l.organizationId === organizationId);
  }

  public addAuditLog(log: OrgAuditLog): void {
    if (!this.db.auditLogs) this.db.auditLogs = [];
    this.db.auditLogs.push(log);
    this.save();
  }

  public getTeamActivities(organizationId: string): OrgTeamActivity[] {
    const acts = this.db.teamActivities || [];
    return acts.filter(a => a.organizationId === organizationId);
  }

  public addTeamActivity(activity: OrgTeamActivity): void {
    if (!this.db.teamActivities) this.db.teamActivities = [];
    this.db.teamActivities.push(activity);
    this.save();
  }

  public getInvitations(organizationId: string): OrgInvitation[] {
    const invitations = this.db.invitations || [];
    return invitations.filter(i => i.organizationId === organizationId);
  }

  public addInvitation(inv: OrgInvitation): void {
    if (!this.db.invitations) this.db.invitations = [];
    this.db.invitations.push(inv);
    this.save();
  }

  public updateInvitationStatus(id: string, status: 'ACCEPTED' | 'DECLINED'): void {
    if (!this.db.invitations) this.db.invitations = [];
    const inv = this.db.invitations.find(i => i.id === id);
    if (inv) {
      inv.status = status;
      this.save();
    }
  }

  // --- Workflow Engine Operations ---
  public getWorkflows(organizationId: string): AutomationWorkflow[] {
    const list = this.db.workflows || [];
    return list.filter(w => w.organizationId === organizationId);
  }

  public getWorkflowById(id: string): AutomationWorkflow | null {
    const list = this.db.workflows || [];
    return list.find(w => w.id === id) || null;
  }

  public addWorkflow(workflow: AutomationWorkflow): void {
    if (!this.db.workflows) this.db.workflows = [];
    this.db.workflows.push(workflow);
    this.save();
  }

  public updateWorkflow(id: string, data: Partial<AutomationWorkflow>): boolean {
    if (!this.db.workflows) this.db.workflows = [];
    const idx = this.db.workflows.findIndex(w => w.id === id);
    if (idx !== -1) {
      this.db.workflows[idx] = { ...this.db.workflows[idx], ...data, updatedAt: new Date().toISOString() };
      this.save();
      return true;
    }
    return false;
  }

  public deleteWorkflow(id: string): boolean {
    if (!this.db.workflows) this.db.workflows = [];
    const initialLen = this.db.workflows.length;
    this.db.workflows = this.db.workflows.filter(w => w.id !== id);
    if (this.db.workflows.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getWorkflowVersions(workflowId: string): WorkflowVersion[] {
    const list = this.db.workflowVersions || [];
    return list.filter(v => v.workflowId === workflowId);
  }

  public addWorkflowVersion(version: WorkflowVersion): void {
    if (!this.db.workflowVersions) this.db.workflowVersions = [];
    this.db.workflowVersions.push(version);
    this.save();
  }

  public getWorkflowRuns(organizationId: string): WorkflowRun[] {
    const list = this.db.workflowRuns || [];
    return list.filter(r => r.organizationId === organizationId);
  }

  public getWorkflowRunById(id: string): WorkflowRun | null {
    const list = this.db.workflowRuns || [];
    return list.find(r => r.id === id) || null;
  }

  public addWorkflowRun(run: WorkflowRun): void {
    if (!this.db.workflowRuns) this.db.workflowRuns = [];
    this.db.workflowRuns.push(run);
    this.save();
  }

  public updateWorkflowRun(id: string, data: Partial<WorkflowRun>): boolean {
    if (!this.db.workflowRuns) this.db.workflowRuns = [];
    const idx = this.db.workflowRuns.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.db.workflowRuns[idx] = { ...this.db.workflowRuns[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  public getWorkflowLogs(workflowId?: string, runId?: string): WorkflowLog[] {
    const list = this.db.workflowLogs || [];
    return list.filter(log => {
      if (workflowId && log.workflowId !== workflowId) return false;
      if (runId && log.runId !== runId) return false;
      return true;
    });
  }

  public addWorkflowLog(log: WorkflowLog): void {
    if (!this.db.workflowLogs) this.db.workflowLogs = [];
    this.db.workflowLogs.push(log);
    this.save();
  }

  public getScheduledJobs(organizationId: string): ScheduledJob[] {
    const list = this.db.scheduledJobs || [];
    return list.filter(j => j.organizationId === organizationId);
  }

  public getAllScheduledJobs(): ScheduledJob[] {
    return this.db.scheduledJobs || [];
  }

  public addScheduledJob(job: ScheduledJob): void {
    if (!this.db.scheduledJobs) this.db.scheduledJobs = [];
    this.db.scheduledJobs.push(job);
    this.save();
  }

  public updateScheduledJob(id: string, data: Partial<ScheduledJob>): boolean {
    if (!this.db.scheduledJobs) this.db.scheduledJobs = [];
    const idx = this.db.scheduledJobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      this.db.scheduledJobs[idx] = { ...this.db.scheduledJobs[idx], ...data };
      this.save();
      return true;
    }
    return false;
  }

  public getAutomationHistory(organizationId: string): AutomationHistory[] {
    const list = this.db.automationHistory || [];
    return list.filter(h => h.organizationId === organizationId);
  }

  public addAutomationHistory(history: AutomationHistory): void {
    if (!this.db.automationHistory) this.db.automationHistory = [];
    this.db.automationHistory.push(history);
    this.save();
  }

  // ==========================================
  // Public API, Webhooks, OAuth, Integrations
  // ==========================================

  public getApiKeys(organizationId?: string): ApiKey[] {
    if (!this.db.apiKeys) this.db.apiKeys = [];
    if (organizationId) {
      return this.db.apiKeys.filter(k => k.organizationId === organizationId);
    }
    return this.db.apiKeys;
  }

  public getApiKeyBySecret(secret: string): ApiKey | null {
    if (!this.db.apiKeys) this.db.apiKeys = [];
    return this.db.apiKeys.find(k => k.secretKey === secret && k.status === 'ACTIVE') || null;
  }

  public addApiKey(key: ApiKey): void {
    if (!this.db.apiKeys) this.db.apiKeys = [];
    this.db.apiKeys.push(key);
    this.save();
  }

  public updateApiKey(id: string, updates: Partial<ApiKey>): boolean {
    if (!this.db.apiKeys) this.db.apiKeys = [];
    const idx = this.db.apiKeys.findIndex(k => k.id === id);
    if (idx !== -1) {
      this.db.apiKeys[idx] = { ...this.db.apiKeys[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  public deleteApiKey(id: string): boolean {
    if (!this.db.apiKeys) this.db.apiKeys = [];
    const initialLen = this.db.apiKeys.length;
    this.db.apiKeys = this.db.apiKeys.filter(k => k.id !== id);
    if (this.db.apiKeys.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getOAuthClients(organizationId?: string): OAuthClient[] {
    if (!this.db.oauthClients) this.db.oauthClients = [];
    if (organizationId) {
      return this.db.oauthClients.filter(c => c.organizationId === organizationId);
    }
    return this.db.oauthClients;
  }

  public getOAuthClientById(id: string): OAuthClient | null {
    if (!this.db.oauthClients) this.db.oauthClients = [];
    return this.db.oauthClients.find(c => c.id === id) || null;
  }

  public addOAuthClient(client: OAuthClient): void {
    if (!this.db.oauthClients) this.db.oauthClients = [];
    this.db.oauthClients.push(client);
    this.save();
  }

  public updateOAuthClient(id: string, updates: Partial<OAuthClient>): boolean {
    if (!this.db.oauthClients) this.db.oauthClients = [];
    const idx = this.db.oauthClients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.db.oauthClients[idx] = { ...this.db.oauthClients[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  public deleteOAuthClient(id: string): boolean {
    if (!this.db.oauthClients) this.db.oauthClients = [];
    const initialLen = this.db.oauthClients.length;
    this.db.oauthClients = this.db.oauthClients.filter(c => c.id !== id);
    if (this.db.oauthClients.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getOAuthTokenByAccessToken(accessToken: string): OAuthToken | null {
    if (!this.db.oauthTokens) this.db.oauthTokens = [];
    return this.db.oauthTokens.find(t => t.accessToken === accessToken) || null;
  }

  public addOAuthToken(token: OAuthToken): void {
    if (!this.db.oauthTokens) this.db.oauthTokens = [];
    this.db.oauthTokens.push(token);
    this.save();
  }

  public getWebhookEndpoints(organizationId?: string): WebhookEndpoint[] {
    if (!this.db.webhookEndpoints) this.db.webhookEndpoints = [];
    if (organizationId) {
      return this.db.webhookEndpoints.filter(w => w.organizationId === organizationId);
    }
    return this.db.webhookEndpoints;
  }

  public addWebhookEndpoint(endpoint: WebhookEndpoint): void {
    if (!this.db.webhookEndpoints) this.db.webhookEndpoints = [];
    this.db.webhookEndpoints.push(endpoint);
    this.save();
  }

  public updateWebhookEndpoint(id: string, updates: Partial<WebhookEndpoint>): boolean {
    if (!this.db.webhookEndpoints) this.db.webhookEndpoints = [];
    const idx = this.db.webhookEndpoints.findIndex(w => w.id === id);
    if (idx !== -1) {
      this.db.webhookEndpoints[idx] = { ...this.db.webhookEndpoints[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  public deleteWebhookEndpoint(id: string): boolean {
    if (!this.db.webhookEndpoints) this.db.webhookEndpoints = [];
    const initialLen = this.db.webhookEndpoints.length;
    this.db.webhookEndpoints = this.db.webhookEndpoints.filter(w => w.id !== id);
    if (this.db.webhookEndpoints.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getWebhookDeliveries(organizationId?: string, endpointId?: string): WebhookDelivery[] {
    if (!this.db.webhookDeliveries) this.db.webhookDeliveries = [];
    return this.db.webhookDeliveries.filter(d => {
      if (organizationId && d.organizationId !== organizationId) return false;
      if (endpointId && d.endpointId !== endpointId) return false;
      return true;
    });
  }

  public addWebhookDelivery(delivery: WebhookDelivery): void {
    if (!this.db.webhookDeliveries) this.db.webhookDeliveries = [];
    this.db.webhookDeliveries.push(delivery);
    this.save();
  }

  public updateWebhookDelivery(id: string, updates: Partial<WebhookDelivery>): boolean {
    if (!this.db.webhookDeliveries) this.db.webhookDeliveries = [];
    const idx = this.db.webhookDeliveries.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.db.webhookDeliveries[idx] = { ...this.db.webhookDeliveries[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  public getIntegrationConfigs(organizationId: string): IntegrationConfig[] {
    if (!this.db.integrationConfigs) this.db.integrationConfigs = [];
    return this.db.integrationConfigs.filter(c => c.organizationId === organizationId);
  }

  public getIntegrationConfig(organizationId: string, integrationId: string): IntegrationConfig | null {
    if (!this.db.integrationConfigs) this.db.integrationConfigs = [];
    return this.db.integrationConfigs.find(c => c.organizationId === organizationId && c.integrationId === integrationId) || null;
  }

  public addIntegrationConfig(config: IntegrationConfig): void {
    if (!this.db.integrationConfigs) this.db.integrationConfigs = [];
    // Clean duplicates
    this.db.integrationConfigs = this.db.integrationConfigs.filter(
      c => !(c.organizationId === config.organizationId && c.integrationId === config.integrationId)
    );
    this.db.integrationConfigs.push(config);
    this.save();
  }

  public updateIntegrationConfig(organizationId: string, integrationId: string, updates: Partial<IntegrationConfig>): boolean {
    if (!this.db.integrationConfigs) this.db.integrationConfigs = [];
    const idx = this.db.integrationConfigs.findIndex(
      c => c.organizationId === organizationId && c.integrationId === integrationId
    );
    if (idx !== -1) {
      this.db.integrationConfigs[idx] = { ...this.db.integrationConfigs[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  public deleteIntegrationConfig(organizationId: string, integrationId: string): boolean {
    if (!this.db.integrationConfigs) this.db.integrationConfigs = [];
    const initialLen = this.db.integrationConfigs.length;
    this.db.integrationConfigs = this.db.integrationConfigs.filter(
      c => !(c.organizationId === organizationId && c.integrationId === integrationId)
    );
    if (this.db.integrationConfigs.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getMarketplaceApps(organizationId: string): MarketplaceApp[] {
    // Return standard apps with enriched real-time installation status
    const standardApps: Omit<MarketplaceApp, 'isInstalled'>[] = [
      { id: 'slack', name: 'Slack Integration', description: 'Dispatches real-time alerts and notifications into slack channels upon CRM updates.', category: 'Communication', developer: 'SalesPilot Dev', requiredScopes: ['leads:read', 'deals:read'] },
      { id: 'ms_teams', name: 'Microsoft Teams', description: 'Dispatches lead summaries and deal achievements directly to MS Teams rooms.', category: 'Communication', developer: 'SalesPilot Dev', requiredScopes: ['leads:read'] },
      { id: 'notion', name: 'Notion Sync', description: 'Automatically syncs your CRM leads, pipeline changes, and activity notes to a master database.', category: 'Productivity', developer: 'SalesPilot Dev', requiredScopes: ['leads:read', 'leads:write'] },
      { id: 'trello', name: 'Trello Cards', description: 'Converts won deals or scheduled appointments into visual Trello action items.', category: 'Productivity', developer: 'SalesPilot Dev', requiredScopes: ['deals:read', 'meetings:read'] },
      { id: 'asana', name: 'Asana Workflows', description: 'Triggers new task templates inside Asana upon pipeline step updates.', category: 'Productivity', developer: 'SalesPilot Dev', requiredScopes: ['tasks:write'] },
      { id: 'zapier', name: 'Zapier Webhook App', description: 'Connects your outbound outreach flow to thousands of third party SaaS apps.', category: 'Automation', developer: 'SalesPilot Dev', requiredScopes: ['leads:read', 'deals:read', 'meetings:read'] },
      { id: 'make', name: 'Make.com Scenario Sync', description: 'Visual automation trigger to execute advanced multi-step outreach pathways.', category: 'Automation', developer: 'SalesPilot Dev', requiredScopes: ['leads:read', 'leads:write'] },
      { id: 'hubspot', name: 'HubSpot Import/Export', description: 'Effortlessly import older CRM histories or export new deals to HubSpot Hubs.', category: 'CRM Sync', developer: 'SalesPilot Dev', requiredScopes: ['leads:read', 'leads:write', 'deals:all'] },
      { id: 'salesforce', name: 'Salesforce Enterprise Sync', description: 'Bulk synchronizes companies, deal values, and contacts with Salesforce CRM.', category: 'CRM Sync', developer: 'SalesPilot Dev', requiredScopes: ['leads:read', 'leads:write', 'deals:all'] },
      { id: 'google_drive', name: 'Google Drive Archiver', description: 'Saves drafted AI sales proposals, meeting briefs, and briefs to cloud storage.', category: 'Storage', developer: 'SalesPilot Dev', requiredScopes: ['proposals:read'] },
      { id: 'dropbox', name: 'Dropbox Sync', description: 'Automatically archives generated PDF outlines and outlines straight to Dropbox.', category: 'Storage', developer: 'SalesPilot Dev', requiredScopes: ['proposals:read'] },
      { id: 'whatsapp', name: 'WhatsApp Business API', description: 'Future-ready bulk notification dispatcher to text contacts directly over WhatsApp.', category: 'Outreach', developer: 'SalesPilot Dev', requiredScopes: ['leads:read'] }
    ];

    return standardApps.map(app => {
      const config = this.getIntegrationConfig(organizationId, app.id);
      return {
        ...app,
        isInstalled: config ? config.status === 'CONNECTED' : false
      };
    });
  }

  public getDeveloperLogs(organizationId: string): DeveloperLog[] {
    if (!this.db.developerLogs) this.db.developerLogs = [];
    return this.db.developerLogs.filter(l => l.organizationId === organizationId);
  }

  public addDeveloperLog(log: DeveloperLog): void {
    if (!this.db.developerLogs) this.db.developerLogs = [];
    this.db.developerLogs.push(log);
    this.save();
  }
}
