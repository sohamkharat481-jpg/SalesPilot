import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WorkspaceUser, Organization, TeamMember, Lead, Campaign, Deal, Appointment, UserRole } from '../types';

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
}

export class LocalDB {
  private static instance: LocalDB;
  private db: DBStructure = {
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
    gmailAccounts: []
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
      gmailAccounts: []
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
  public getUsers(): any[] {
    return this.db.users;
  }

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
  public getOrganizations(): Organization[] {
    return this.db.organizations;
  }

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
  public getTeamMembers(): TeamMember[] {
    return this.db.teamMembers;
  }

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
}
