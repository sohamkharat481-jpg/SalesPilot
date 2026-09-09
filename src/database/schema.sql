-- =========================================================================
-- SALESPIILOT IDEMPOTENT PRODUCTION SUPABASE MIGRATION
-- Project Target: skzijzqomufqrpovvcki.supabase.co
-- Designed for safe re-runs: Preserves all existing tables, rows, and schema.
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 2. ORGANIZATIONS TABLE (Multi-tenant Root)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Default Organization',
    domain TEXT,
    industry TEXT,
    company_name TEXT,
    slug TEXT,
    website TEXT,
    gst_number TEXT,
    country TEXT DEFAULT 'India',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    currency TEXT DEFAULT 'INR',
    logo TEXT,
    owner_id TEXT,
    subscription_plan TEXT DEFAULT 'STARTER',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Default Organization';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'STARTER';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 3. USERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company_name TEXT,
    industry TEXT,
    tier TEXT DEFAULT 'ENTERPRISE',
    role TEXT DEFAULT 'OWNER',
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    language TEXT DEFAULT 'English',
    notification_prefs JSONB DEFAULT '{"email": true, "push": true, "weeklyReport": true}'::jsonb,
    password_hash TEXT,
    is_founder BOOLEAN DEFAULT FALSE,
    subscription_status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'ENTERPRISE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'OWNER';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"email": true, "push": true, "weeklyReport": true}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 4. PROFILES TABLE (Supabase compatibility layer)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    role TEXT DEFAULT 'Owner',
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Owner';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Safely handle circular foreign key constraint fk_organizations_owner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_organizations_owner'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT fk_organizations_owner
      FOREIGN KEY (owner_id)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================================
-- 5. TEAM MEMBERS & ORGANIZATION MEMBERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'SALES',
    status TEXT DEFAULT 'INVITED',
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'SALES';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'INVITED';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.organization_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER';
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 6. GOOGLE ACCOUNTS (OAuth integrations)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.google_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    scopes TEXT[] DEFAULT '{}'::text[],
    expiry_date BIGINT,
    account_type TEXT DEFAULT 'GMAIL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS expiry_date BIGINT;
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'GMAIL';
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 7. SESSIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 8. LEADS TABLE (Primary Lead Engine Source of Truth)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    business_email TEXT,
    phone TEXT,
    company TEXT,
    website TEXT,
    industry TEXT,
    country TEXT,
    linkedin TEXT,
    lead_score INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    lead_temperature TEXT DEFAULT 'WARM',
    status TEXT DEFAULT 'NEW',
    source TEXT DEFAULT 'Manual',
    campaign_id TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}'::text[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_temperature TEXT DEFAULT 'WARM';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NEW';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Manual';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS campaign_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 9. CONTACTS & COMPANIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 10. PIPELINES & PIPELINE STAGES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.pipelines (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pipelines ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.pipelines ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.pipelines ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id TEXT PRIMARY KEY,
    pipeline_id TEXT REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pipeline_stages ADD COLUMN IF NOT EXISTS pipeline_id TEXT;
ALTER TABLE public.pipeline_stages ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.pipeline_stages ADD COLUMN IF NOT EXISTS position INTEGER;
ALTER TABLE public.pipeline_stages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 11. DEALS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.deals (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
    lead_name TEXT,
    company TEXT,
    value_inr NUMERIC DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'lead',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lead_name TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS value_inr NUMERIC DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'lead';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 12. APPOINTMENTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
    lead_name TEXT,
    company TEXT,
    email TEXT,
    title TEXT,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_mins INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled',
    meeting_link TEXT,
    notes TEXT,
    timezone TEXT,
    google_synced BOOLEAN DEFAULT false,
    google_event_id TEXT,
    gmail_message_id TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS lead_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS time TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS duration_mins INTEGER DEFAULT 30;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_synced BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 13. CALENDAR EVENTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
    event_id TEXT,
    email TEXT,
    summary TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS appointment_id TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 14. CAMPAIGNS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_audience TEXT,
    status TEXT DEFAULT 'DRAFT',
    subject TEXT,
    body TEXT,
    schedule_time TIMESTAMPTZ,
    steps JSONB DEFAULT '[]'::jsonb,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_replied INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS schedule_time TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS total_opened INTEGER DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS total_replied INTEGER DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 15. EMAIL TEMPLATES, SEQUENCES & SENT EMAILS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.email_sequences (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.sent_emails (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'SENT',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sent_emails ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.sent_emails ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.sent_emails ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.sent_emails ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.sent_emails ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SENT';
ALTER TABLE public.sent_emails ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 16. ANALYTICS & ACTIVITY LOGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    dimension TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS metric_name TEXT;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS metric_value NUMERIC;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS dimension TEXT;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS activity_type TEXT;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 17. NOTIFICATIONS, TASKS & NOTES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'INFO';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    assigned_to TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 18. BILLING, SUBSCRIPTIONS & API KEYS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.billing (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'STARTER',
    billing_cycle TEXT NOT NULL DEFAULT 'MONTHLY',
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.billing ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.billing ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'STARTER';
ALTER TABLE public.billing ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'MONTHLY';
ALTER TABLE public.billing ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE public.billing ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.billing ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.api_keys (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_hash TEXT;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 19. AI MODULE TABLES (SalesPilot AI SDR)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.ai_company_research (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    summary TEXT,
    industry TEXT,
    products_services JSONB DEFAULT '[]'::jsonb,
    website_analysis TEXT,
    team_size TEXT,
    technologies JSONB DEFAULT '[]'::jsonb,
    pain_points JSONB DEFAULT '[]'::jsonb,
    recent_news JSONB DEFAULT '[]'::jsonb,
    icp_fit_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS products_services JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS website_analysis TEXT;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS technologies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS recent_news JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS icp_fit_score NUMERIC DEFAULT 0;
ALTER TABLE public.ai_company_research ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.ai_contact_profiles (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT,
    title TEXT,
    seniority TEXT,
    decision_maker BOOLEAN DEFAULT FALSE,
    personality_insights TEXT,
    suggested_approach TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS seniority TEXT;
ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS decision_maker BOOLEAN DEFAULT FALSE;
ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS personality_insights TEXT;
ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS suggested_approach TEXT;
ALTER TABLE public.ai_contact_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.ai_email_generations (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    subject TEXT,
    body TEXT,
    framework TEXT,
    confidence_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_email_generations ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.ai_email_generations ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.ai_email_generations ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.ai_email_generations ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.ai_email_generations ADD COLUMN IF NOT EXISTS framework TEXT;
ALTER TABLE public.ai_email_generations ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0;
ALTER TABLE public.ai_email_generations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.ai_followups (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    step INTEGER DEFAULT 1,
    delay_days INTEGER DEFAULT 3,
    subject TEXT,
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_followups ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.ai_followups ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.ai_followups ADD COLUMN IF NOT EXISTS step INTEGER DEFAULT 1;
ALTER TABLE public.ai_followups ADD COLUMN IF NOT EXISTS delay_days INTEGER DEFAULT 3;
ALTER TABLE public.ai_followups ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.ai_followups ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.ai_followups ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.ai_meeting_briefs (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_summary TEXT,
    talking_points JSONB DEFAULT '[]'::jsonb,
    objection_prep JSONB DEFAULT '[]'::jsonb,
    deal_size_estimate TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_meeting_briefs ADD COLUMN IF NOT EXISTS appointment_id TEXT;
ALTER TABLE public.ai_meeting_briefs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.ai_meeting_briefs ADD COLUMN IF NOT EXISTS lead_summary TEXT;
ALTER TABLE public.ai_meeting_briefs ADD COLUMN IF NOT EXISTS talking_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_meeting_briefs ADD COLUMN IF NOT EXISTS objection_prep JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_meeting_briefs ADD COLUMN IF NOT EXISTS deal_size_estimate TEXT;
ALTER TABLE public.ai_meeting_briefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.ai_proposals (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    executive_summary TEXT,
    scope_of_work JSONB DEFAULT '[]'::jsonb,
    deliverables JSONB DEFAULT '[]'::jsonb,
    pricing_inr NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS executive_summary TEXT;
ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS scope_of_work JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS pricing_inr NUMERIC DEFAULT 0;
ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.ai_scores (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    overall_score NUMERIC DEFAULT 0,
    fit_score NUMERIC DEFAULT 0,
    intent_score NUMERIC DEFAULT 0,
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_scores ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.ai_scores ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.ai_scores ADD COLUMN IF NOT EXISTS overall_score NUMERIC DEFAULT 0;
ALTER TABLE public.ai_scores ADD COLUMN IF NOT EXISTS fit_score NUMERIC DEFAULT 0;
ALTER TABLE public.ai_scores ADD COLUMN IF NOT EXISTS intent_score NUMERIC DEFAULT 0;
ALTER TABLE public.ai_scores ADD COLUMN IF NOT EXISTS reasoning TEXT;
ALTER TABLE public.ai_scores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- 20. TRIGGERS & AUTO-SYNC
-- =========================================================================
CREATE OR REPLACE FUNCTION public.sync_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, timezone, role, organization_id, created_at, updated_at)
        VALUES (NEW.id, NEW.email, NEW.full_name, NEW.timezone, NEW.role, NEW.organization_id, NEW.created_at, NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            timezone = EXCLUDED.timezone,
            role = EXCLUDED.role,
            organization_id = EXCLUDED.organization_id,
            updated_at = NOW();
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_user_to_profile ON public.users;
CREATE TRIGGER trigger_sync_user_to_profile
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_to_profile();

CREATE OR REPLACE FUNCTION public.sync_profile_to_user()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;
    BEGIN
        INSERT INTO public.users (id, email, full_name, timezone, role, organization_id, created_at, updated_at)
        VALUES (NEW.id, NEW.email, NEW.full_name, NEW.timezone, NEW.role, NEW.organization_id, NEW.created_at, NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            timezone = EXCLUDED.timezone,
            role = EXCLUDED.role,
            organization_id = EXCLUDED.organization_id,
            updated_at = NOW();
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_profile_to_user ON public.profiles;
CREATE TRIGGER trigger_sync_profile_to_user
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_user();

-- =========================================================================
-- 21. PERFORMANCE INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org ON public.team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_org ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON public.appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_company_research_org ON public.ai_company_research(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_contact_profiles_org ON public.ai_contact_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_generations_org ON public.ai_email_generations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_followups_org ON public.ai_followups(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_meeting_briefs_org ON public.ai_meeting_briefs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_org ON public.ai_proposals(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_org ON public.ai_scores(organization_id);

-- =========================================================================
-- 22. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_company_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_contact_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_meeting_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_scores ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies with full read/write for application operations
DROP POLICY IF EXISTS org_isolation ON public.organizations;
CREATE POLICY org_isolation ON public.organizations FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_isolation ON public.users;
CREATE POLICY user_isolation ON public.users FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS profile_isolation ON public.profiles;
CREATE POLICY profile_isolation ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS team_members_isolation ON public.team_members;
CREATE POLICY team_members_isolation ON public.team_members FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS organization_members_isolation ON public.organization_members;
CREATE POLICY organization_members_isolation ON public.organization_members FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS google_accounts_isolation ON public.google_accounts;
CREATE POLICY google_accounts_isolation ON public.google_accounts FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS sessions_isolation ON public.sessions;
CREATE POLICY sessions_isolation ON public.sessions FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS leads_isolation ON public.leads;
CREATE POLICY leads_isolation ON public.leads FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS contacts_isolation ON public.contacts;
CREATE POLICY contacts_isolation ON public.contacts FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS companies_isolation ON public.companies;
CREATE POLICY companies_isolation ON public.companies FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS pipelines_isolation ON public.pipelines;
CREATE POLICY pipelines_isolation ON public.pipelines FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS pipeline_stages_isolation ON public.pipeline_stages;
CREATE POLICY pipeline_stages_isolation ON public.pipeline_stages FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS deals_isolation ON public.deals;
CREATE POLICY deals_isolation ON public.deals FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS appointments_isolation ON public.appointments;
CREATE POLICY appointments_isolation ON public.appointments FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS calendar_events_isolation ON public.calendar_events;
CREATE POLICY calendar_events_isolation ON public.calendar_events FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS campaigns_isolation ON public.campaigns;
CREATE POLICY campaigns_isolation ON public.campaigns FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS email_templates_isolation ON public.email_templates;
CREATE POLICY email_templates_isolation ON public.email_templates FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS email_sequences_isolation ON public.email_sequences;
CREATE POLICY email_sequences_isolation ON public.email_sequences FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS sent_emails_isolation ON public.sent_emails;
CREATE POLICY sent_emails_isolation ON public.sent_emails FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS analytics_isolation ON public.analytics;
CREATE POLICY analytics_isolation ON public.analytics FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS activity_logs_isolation ON public.activity_logs;
CREATE POLICY activity_logs_isolation ON public.activity_logs FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS activities_isolation ON public.activities;
CREATE POLICY activities_isolation ON public.activities FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS notifications_isolation ON public.notifications;
CREATE POLICY notifications_isolation ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS tasks_isolation ON public.tasks;
CREATE POLICY tasks_isolation ON public.tasks FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS notes_isolation ON public.notes;
CREATE POLICY notes_isolation ON public.notes FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS billing_isolation ON public.billing;
CREATE POLICY billing_isolation ON public.billing FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS subscriptions_isolation ON public.subscriptions;
CREATE POLICY subscriptions_isolation ON public.subscriptions FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_keys_isolation ON public.api_keys;
CREATE POLICY api_keys_isolation ON public.api_keys FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS audit_logs_isolation ON public.audit_logs;
CREATE POLICY audit_logs_isolation ON public.audit_logs FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ai_company_research_isolation ON public.ai_company_research;
CREATE POLICY ai_company_research_isolation ON public.ai_company_research FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ai_contact_profiles_isolation ON public.ai_contact_profiles;
CREATE POLICY ai_contact_profiles_isolation ON public.ai_contact_profiles FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ai_email_generations_isolation ON public.ai_email_generations;
CREATE POLICY ai_email_generations_isolation ON public.ai_email_generations FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ai_followups_isolation ON public.ai_followups;
CREATE POLICY ai_followups_isolation ON public.ai_followups FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ai_meeting_briefs_isolation ON public.ai_meeting_briefs;
CREATE POLICY ai_meeting_briefs_isolation ON public.ai_meeting_briefs FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ai_proposals_isolation ON public.ai_proposals;
CREATE POLICY ai_proposals_isolation ON public.ai_proposals FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ai_scores_isolation ON public.ai_scores;
CREATE POLICY ai_scores_isolation ON public.ai_scores FOR ALL TO public USING (true) WITH CHECK (true);

-- =========================================================================
-- 23. INITIAL SYSTEM SEED DATA (Safe Idempotent Block)
-- Pre-populates default organization and founder if missing
-- =========================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = 'org_salespilot_lifetime') THEN
        INSERT INTO public.organizations (id, name, company_name, country)
        VALUES ('org_salespilot_lifetime', 'SalesPilot Lifetime', 'SalesPilot', 'India');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = 'usr_81927391' OR email = 'sohamkharat481@gmail.com') THEN
        INSERT INTO public.users (id, email, full_name, role, tier, organization_id, is_verified, is_founder, subscription_status)
        VALUES ('usr_81927391', 'sohamkharat481@gmail.com', 'Soham Kharat', 'OWNER', 'ENTERPRISE', 'org_salespilot_lifetime', true, true, 'LIFETIME');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'usr_81927391' OR email = 'sohamkharat481@gmail.com') THEN
        INSERT INTO public.profiles (id, email, full_name, role, organization_id)
        VALUES ('usr_81927391', 'sohamkharat481@gmail.com', 'Soham Kharat', 'OWNER', 'org_salespilot_lifetime');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
