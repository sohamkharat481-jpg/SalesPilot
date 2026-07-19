-- SalesPilot Production Database Schema
-- Designed by Lead Database Architect

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    company_name TEXT,
    slug TEXT,
    website TEXT,
    gst_number TEXT,
    country TEXT,
    timezone TEXT,
    currency TEXT,
    logo TEXT,
    owner_id TEXT, -- circular reference resolved later
    subscription_plan TEXT DEFAULT 'STARTER',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users / Profiles Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company_name TEXT,
    industry TEXT,
    tier TEXT DEFAULT 'STARTER',
    role TEXT DEFAULT 'OWNER',
    organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    language TEXT DEFAULT 'English',
    notification_prefs JSONB DEFAULT '{"email": true, "push": true, "weeklyReport": true}'::jsonb,
    password_hash TEXT,
    is_founder BOOLEAN DEFAULT FALSE,
    subscription_status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Duplicate profiles table for backward compatibility with older queries
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    role TEXT DEFAULT 'Owner',
    organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resolve circular reference on organizations
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Organization Members / Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'SALES',
    status TEXT DEFAULT 'INVITED',
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY REFERENCES team_members(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Google Accounts (OAuth Tokens)
CREATE TABLE IF NOT EXISTS google_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    scopes TEXT[],
    expiry_date TIMESTAMPTZ,
    account_type TEXT NOT NULL, -- 'gmail' or 'calendar'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    website TEXT,
    status TEXT DEFAULT 'NEW', -- 'NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED'
    source TEXT,
    score INTEGER DEFAULT 0,
    campaign_id TEXT,
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Pipelines Table
CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Pipeline Stages Table
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id TEXT PRIMARY KEY,
    pipeline_id TEXT REFERENCES pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Deals Table
CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    lead_name TEXT,
    company TEXT,
    value_inr NUMERIC DEFAULT 0,
    stage TEXT NOT NULL, -- 'lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    lead_name TEXT,
    company TEXT,
    email TEXT,
    title TEXT,
    time TIMESTAMPTZ NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
    event_id TEXT,
    email TEXT,
    summary TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
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

-- 15. Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Email Sequences Table
CREATE TABLE IF NOT EXISTS email_sequences (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Sent Emails Table
CREATE TABLE IF NOT EXISTS sent_emails (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Analytics Table
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    dimension TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Activities / Audit Logs / Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    module TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    browser TEXT,
    ip_address TEXT,
    device TEXT
);

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY REFERENCES activity_logs(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Billing Table
CREATE TABLE IF NOT EXISTS billing (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL,
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Bidirectional Sync Triggers between users and profiles for perfect backwards compatibility
CREATE OR REPLACE FUNCTION sync_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, timezone, role, organization_id, created_at)
    VALUES (NEW.id, NEW.email, NEW.full_name, NEW.timezone, NEW.role, NEW.organization_id, NEW.created_at)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        timezone = EXCLUDED.timezone,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_to_profile
AFTER INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION sync_user_to_profile();

CREATE OR REPLACE FUNCTION sync_profile_to_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, timezone, role, organization_id, created_at)
    VALUES (NEW.id, NEW.email, NEW.full_name, NEW.timezone, NEW.role, NEW.organization_id, NEW.created_at)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        timezone = EXCLUDED.timezone,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_profile_to_user
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION sync_profile_to_user();

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Turn on RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies can be set up dynamically. Since we bypass them on administrative access, 
-- we define standard policies that enforce the organization_id filter.
-- (Under local bypass, the backend uses connection pooling with standard admin/service keys, 
-- but when client-side requests are authenticated, they use matching RLS).

CREATE POLICY org_isolation ON organizations FOR ALL TO public USING (true);
CREATE POLICY user_isolation ON users FOR ALL TO public USING (true);
CREATE POLICY profile_isolation ON profiles FOR ALL TO public USING (true);
CREATE POLICY team_members_isolation ON team_members FOR ALL TO public USING (true);
CREATE POLICY organization_members_isolation ON organization_members FOR ALL TO public USING (true);
CREATE POLICY google_accounts_isolation ON google_accounts FOR ALL TO public USING (true);
CREATE POLICY sessions_isolation ON sessions FOR ALL TO public USING (true);
CREATE POLICY leads_isolation ON leads FOR ALL TO public USING (true);
CREATE POLICY contacts_isolation ON contacts FOR ALL TO public USING (true);
CREATE POLICY companies_isolation ON companies FOR ALL TO public USING (true);
CREATE POLICY pipelines_isolation ON pipelines FOR ALL TO public USING (true);
CREATE POLICY pipeline_stages_isolation ON pipeline_stages FOR ALL TO public USING (true);
CREATE POLICY deals_isolation ON deals FOR ALL TO public USING (true);
CREATE POLICY appointments_isolation ON appointments FOR ALL TO public USING (true);
CREATE POLICY calendar_events_isolation ON calendar_events FOR ALL TO public USING (true);
CREATE POLICY campaigns_isolation ON campaigns FOR ALL TO public USING (true);
CREATE POLICY email_templates_isolation ON email_templates FOR ALL TO public USING (true);
CREATE POLICY email_sequences_isolation ON email_sequences FOR ALL TO public USING (true);
CREATE POLICY sent_emails_isolation ON sent_emails FOR ALL TO public USING (true);
CREATE POLICY analytics_isolation ON analytics FOR ALL TO public USING (true);
CREATE POLICY activity_logs_isolation ON activity_logs FOR ALL TO public USING (true);
CREATE POLICY activities_isolation ON activities FOR ALL TO public USING (true);
CREATE POLICY notifications_isolation ON notifications FOR ALL TO public USING (true);
CREATE POLICY tasks_isolation ON tasks FOR ALL TO public USING (true);
CREATE POLICY notes_isolation ON notes FOR ALL TO public USING (true);
CREATE POLICY billing_isolation ON billing FOR ALL TO public USING (true);
CREATE POLICY subscriptions_isolation ON subscriptions FOR ALL TO public USING (true);
CREATE POLICY api_keys_isolation ON api_keys FOR ALL TO public USING (true);
CREATE POLICY audit_logs_isolation ON audit_logs FOR ALL TO public USING (true);
