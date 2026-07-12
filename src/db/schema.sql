-- =========================================================================
-- SalesPilot - Production-Grade Multi-Tenant Supabase PostgreSQL Schema
-- Designed for enterprise-level scale, tight security, and high performance.
-- Author: Principal Database Architect & DevOps Engineer
-- Version: 2.1.0 (Production Blueprint)
-- =========================================================================

-- =========================================================================
-- SECTION 1: SYSTEM SETUP & EXTENSIONS
-- =========================================================================

-- Enable core database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- SECTION 2: GLOBAL ENUMS & DOMAINS
-- =========================================================================

-- System Roles matching Enterprise RBAC specifications
CREATE TYPE user_role AS ENUM (
    'Owner', 
    'Admin', 
    'Manager', 
    'Sales Representative', 
    'Viewer'
);

-- User registration and activation status
CREATE TYPE user_status AS ENUM (
    'ACTIVE', 
    'SUSPENDED', 
    'INVITED'
);

-- Lead pipeline stages for Sales Pilot's modular CRM
CREATE TYPE crm_stage AS ENUM (
    'New', 
    'Research', 
    'Qualified', 
    'Outreach', 
    'Interested', 
    'Meeting Scheduled', 
    'Proposal Sent', 
    'Negotiation',
    'Won', 
    'Lost'
);

-- Multichannel sequencing outlets
CREATE TYPE outreach_channel AS ENUM (
    'EMAIL', 
    'LINKEDIN', 
    'WHATSAPP', 
    'MULTICHANNEL'
);

-- Outreach delivery states
CREATE TYPE message_delivery_status AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED'
);

-- Followup execution scheduler status
CREATE TYPE followup_status AS ENUM (
    'PENDING',
    'SENT',
    'SKIPPED',
    'CANCELLED'
);

-- Active Autonomous AI Copilots
CREATE TYPE agent_purpose AS ENUM (
    'Lead Finder', 
    'Research', 
    'Email Writer', 
    'Outreach', 
    'Follow-up', 
    'Appointment Setter', 
    'Proposal Generator', 
    'CRM Manager', 
    'Analytics Agent',
    'Reporting Agent'
);

-- General Priority levels for notifications, alerts, and tasks
CREATE TYPE priority_level AS ENUM (
    'LOW', 
    'MEDIUM', 
    'HIGH'
);

-- Invoice status states
CREATE TYPE invoice_status AS ENUM (
    'UNPAID', 
    'PAID', 
    'OVERDUE', 
    'VOIDED'
);

-- SaaS subscription plan categories
CREATE TYPE subscription_tier AS ENUM (
    'STARTER',
    'PROFESSIONAL',
    'AGENCY'
);

-- Subscription billing frequency
CREATE TYPE billing_cycle AS ENUM (
    'MONTHLY',
    'ANNUAL'
);

-- Subscription statuses
CREATE TYPE subscription_status AS ENUM (
    'ACTIVE', 
    'PAST_DUE', 
    'CANCELED', 
    'UNPAID'
);

-- Payment transaction status
CREATE TYPE payment_status AS ENUM (
    'PENDING', 
    'COMPLETED', 
    'FAILED', 
    'REFUNDED'
);

-- =========================================================================
-- SECTION 3: CORE DATA MODELS
-- =========================================================================

-- 1. ORGANIZATIONS Table (The primary tenant anchor)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    logo VARCHAR(512),
    industry VARCHAR(100),
    website VARCHAR(512),
    gst_number VARCHAR(15), -- GSTIN identifier for GST-compliant invoicing (default default default)
    country VARCHAR(100) DEFAULT 'India' NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata' NOT NULL,
    owner_id UUID, -- Managed as backlink configured as foreign key below profiles table
    subscription_plan subscription_tier DEFAULT 'STARTER'::subscription_tier NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PROFILES Table (User metadata, mapped to Supabase auth.users.id)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    phone VARCHAR(50),
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata' NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    role user_role DEFAULT 'Viewer'::user_role NOT NULL,
    status user_status DEFAULT 'ACTIVE'::user_status NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Establish self-referencing Organization owner key constraints
ALTER TABLE organizations 
ADD CONSTRAINT fk_organizations_owner 
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. TEAM MEMBERS Table (Multi-tenant permissions and membership map)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role user_role DEFAULT 'Sales Representative'::user_role NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb NOT NULL,
    invitation_status VARCHAR(50) DEFAULT 'ACCEPTED' NOT NULL CHECK (invitation_status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (organization_id, user_id)
);

-- 4. COMPANIES Table (Account-Based Marketing targeting index)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(512),
    industry VARCHAR(150),
    country VARCHAR(100),
    employee_count INTEGER DEFAULT 0,
    revenue NUMERIC(15, 2) DEFAULT 0.00,
    linkedin VARCHAR(512),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (organization_id, company_name)
);

-- 5. CAMPAIGNS Table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type outreach_channel DEFAULT 'EMAIL'::outreach_channel NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')),
    country VARCHAR(100),
    industry VARCHAR(150),
    keywords TEXT[] DEFAULT '{}'::text[] NOT NULL,
    negative_keywords TEXT[] DEFAULT '{}'::text[] NOT NULL,
    target_audience VARCHAR(255),
    messages_sent INTEGER DEFAULT 0 NOT NULL,
    replies INTEGER DEFAULT 0 NOT NULL,
    meetings INTEGER DEFAULT 0 NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. LEADS Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    lead_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    website VARCHAR(512),
    industry VARCHAR(150),
    country VARCHAR(100),
    employee_count INTEGER DEFAULT 0,
    annual_revenue NUMERIC(15, 2) DEFAULT 0.00,
    decision_maker BOOLEAN DEFAULT FALSE NOT NULL,
    designation VARCHAR(150),
    business_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    linkedin VARCHAR(512),
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    lead_temperature VARCHAR(50) DEFAULT 'COLD' NOT NULL CHECK (lead_temperature IN ('COLD', 'WARM', 'HOT')),
    status crm_stage DEFAULT 'New'::crm_stage NOT NULL,
    tags VARCHAR(50)[] DEFAULT '{}'::varchar(50)[] NOT NULL,
    source VARCHAR(100) DEFAULT 'OUTBOUND' NOT NULL,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_tenant_lead_email UNIQUE (organization_id, business_email)
);

-- 7. OUTREACH Table (Core outreach logging)
CREATE TABLE outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    channel outreach_channel DEFAULT 'EMAIL'::outreach_channel NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT FALSE NOT NULL,
    approved BOOLEAN DEFAULT FALSE NOT NULL,
    sent BOOLEAN DEFAULT FALSE NOT NULL,
    delivered BOOLEAN DEFAULT FALSE NOT NULL,
    opened BOOLEAN DEFAULT FALSE NOT NULL,
    clicked BOOLEAN DEFAULT FALSE NOT NULL,
    replied BOOLEAN DEFAULT FALSE NOT NULL,
    meeting_booked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. FOLLOW UPS Table
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status followup_status DEFAULT 'PENDING'::followup_status NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (campaign_id, lead_id, sequence_number)
);

-- 9. MEETINGS Table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME WITHOUT TIME ZONE NOT NULL,
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata' NOT NULL,
    calendar_event_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'SCHEDULED' NOT NULL CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    summary TEXT,
    notes TEXT,
    recording_url TEXT, -- Dynamic attachments linkage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. CRM PIPELINE Table
CREATE TABLE crm_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    stage crm_stage DEFAULT 'New'::crm_stage NOT NULL,
    probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
    expected_revenue NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. TASKS Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    priority priority_level DEFAULT 'MEDIUM'::priority_level NOT NULL,
    status VARCHAR(50) DEFAULT 'TODO' NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. AI AGENTS Table (Dynamic autonomous micro-agents)
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    agent_type agent_purpose NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'IDLE', 'RUNNING')),
    current_task VARCHAR(512),
    completed_tasks INTEGER DEFAULT 0 NOT NULL,
    performance_score NUMERIC(5, 2) DEFAULT 100.00 NOT NULL CHECK (performance_score >= 0.00 AND performance_score <= 100.00),
    average_time NUMERIC(10, 2) DEFAULT 0.00 NOT NULL, -- Average completion time in seconds
    errors_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (organization_id, agent_type)
);

-- 13. ANALYTICS Table (Aggregated daily performance matrices)
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    leads_count INTEGER DEFAULT 0 NOT NULL,
    emails_count INTEGER DEFAULT 0 NOT NULL,
    replies_count INTEGER DEFAULT 0 NOT NULL,
    meetings_count INTEGER DEFAULT 0 NOT NULL,
    revenue NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    open_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    reply_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    meeting_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    conversion_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. NOTIFICATIONS Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority priority_level DEFAULT 'MEDIUM'::priority_level NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 15. FILES Table (Metadata links for files residing inside Buckets)
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL, -- Size in bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 16. INVOICES Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    gst NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    status invoice_status DEFAULT 'UNPAID'::invoice_status NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 17. SUBSCRIPTIONS Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    plan subscription_tier DEFAULT 'STARTER'::subscription_tier NOT NULL,
    billing_cycle billing_cycle DEFAULT 'MONTHLY'::billing_cycle NOT NULL,
    renewal_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status subscription_status DEFAULT 'ACTIVE'::subscription_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 18. PAYMENTS Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    cashfree_order_id VARCHAR(255) NOT NULL,
    cashfree_payment_id VARCHAR(255),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    status payment_status DEFAULT 'PENDING'::payment_status NOT NULL,
    gateway VARCHAR(50) DEFAULT 'CASHFREE' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 19. ACTIVITY LOGS Table (Multi-tenant system-wide audit logging tracker)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    browser VARCHAR(255),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- SECTION 4: SUPABASE STORAGE CONFIGURATION
-- =========================================================================

-- Provision all buckets requested for Sales Pilot
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('avatars', 'avatars', true, 5242880, '{"image/png", "image/jpeg", "image/webp"}'),
  ('company-logos', 'company-logos', true, 5242880, '{"image/png", "image/jpeg", "image/svg+xml"}'),
  ('attachments', 'attachments', false, 20971520, NULL),
  ('documents', 'documents', false, 20971520, NULL),
  ('meeting-recordings', 'meeting-recordings', false, 209715200, NULL),
  ('exports', 'exports', false, 52428800, '{"text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}')
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Control on Storage.objects
CREATE POLICY "Allow public select of avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow public select of company-logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Allow authenticated insert of own avatars" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable Row Level Security (RLS) on all core models
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 5.1. RLS SECURITY DEFINERS (Access rules bypass verification helpers)
CREATE OR REPLACE FUNCTION get_user_org_membership(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.organization_id = org_id 
        AND team_members.user_id = auth.uid()
        AND team_members.invitation_status = 'ACCEPTED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role_in_org(org_id UUID)
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role 
    FROM team_members 
    WHERE team_members.organization_id = org_id 
    AND team_members.user_id = auth.uid()
    AND team_members.invitation_status = 'ACCEPTED';
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2. APPLIED POLICIES

-- ORGANIZATIONS Policies
CREATE POLICY org_select_policy ON organizations FOR SELECT USING (get_user_org_membership(id));
CREATE POLICY org_update_policy ON organizations FOR UPDATE USING (get_user_role_in_org(id) IN ('Owner', 'Admin'));

-- PROFILES Policies
CREATE POLICY profile_select_policy ON profiles FOR SELECT USING (auth.uid() = id OR get_user_org_membership(organization_id));
CREATE POLICY profile_update_self ON profiles FOR UPDATE USING (auth.uid() = id);

-- TEAM MEMBERS Policies
CREATE POLICY member_select_policy ON team_members FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY member_all_policy ON team_members FOR ALL USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin'));

-- COMPANIES Policies
CREATE POLICY company_select_policy ON companies FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY company_all_policy ON companies FOR ALL USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));

-- CAMPAIGNS Policies
CREATE POLICY campaign_select_policy ON campaigns FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY campaign_write_policy ON campaigns FOR ALL USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));

-- LEADS Policies
CREATE POLICY lead_select_policy ON leads FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY lead_write_policy ON leads FOR INSERT WITH CHECK (get_user_org_membership(organization_id) AND get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));
CREATE POLICY lead_update_policy ON leads FOR UPDATE USING (get_user_org_membership(organization_id) AND get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));
CREATE POLICY lead_delete_policy ON leads FOR DELETE USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin'));

-- OUTREACH Policies
CREATE POLICY outreach_select_policy ON outreach FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY outreach_write_policy ON outreach FOR ALL USING (get_user_org_membership(organization_id) AND get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));

-- FOLLOW UPS Policies
CREATE POLICY follow_select_policy ON follow_ups FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY follow_write_policy ON follow_ups FOR ALL USING (get_user_org_membership(organization_id) AND get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));

-- MEETINGS Policies
CREATE POLICY meeting_select_policy ON meetings FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY meeting_write_policy ON meetings FOR ALL USING (get_user_org_membership(organization_id) AND get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));

-- CRM PIPELINE Policies
CREATE POLICY crm_select_policy ON crm_pipeline FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY crm_write_policy ON crm_pipeline FOR ALL USING (get_user_org_membership(organization_id) AND get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));

-- TASKS Policies
CREATE POLICY task_select_policy ON tasks FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY task_write_policy ON tasks FOR ALL USING (get_user_org_membership(organization_id) AND get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));

-- AI AGENTS Policies
CREATE POLICY agent_select_policy ON ai_agents FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY agent_write_policy ON ai_agents FOR ALL USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager'));

-- ANALYTICS Policies
CREATE POLICY analytic_select_policy ON analytics FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY analytic_admin_policy ON analytics FOR ALL USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin'));

-- NOTIFICATIONS Policies
CREATE POLICY notify_select_policy ON notifications FOR SELECT USING (auth.uid() = user_id AND get_user_org_membership(organization_id));
CREATE POLICY notify_update_self ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- FILES Policies
CREATE POLICY file_select_policy ON files FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY file_write_policy ON files FOR ALL USING (get_user_org_membership(organization_id) AND get_user_role_in_org(organization_id) IN ('Owner', 'Admin', 'Manager', 'Sales Representative'));

-- INVOICES Policies
CREATE POLICY invoice_select_policy ON invoices FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY invoice_all_policy ON invoices FOR ALL USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin'));

-- SUBSCRIPTIONS Policies
CREATE POLICY sub_select_policy ON subscriptions FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY sub_all_policy ON subscriptions FOR ALL USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin'));

-- PAYMENTS Policies
CREATE POLICY payment_select_policy ON payments FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY payment_all_policy ON payments FOR ALL USING (get_user_role_in_org(organization_id) IN ('Owner', 'Admin'));

-- AUDIT TRAIL ACTIVITY LOGS Policies
CREATE POLICY log_select_policy ON activity_logs FOR SELECT USING (get_user_org_membership(organization_id));
CREATE POLICY log_insert_policy ON activity_logs FOR INSERT WITH CHECK (get_user_org_membership(organization_id));

-- =========================================================================
-- SECTION 6: PERFORMANCE OPTIMIZED INDEXES
-- =========================================================================

-- Profiles and team membership junction indices
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_org ON team_members(organization_id);

-- Company index
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);

-- Campaigns Indices
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Leads Indices (optimized for complex outbound filters)
CREATE INDEX IF NOT EXISTS idx_leads_org_deleted ON leads(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(business_email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score_temp ON leads(lead_score, lead_temperature);

-- Outreach indexing
CREATE INDEX IF NOT EXISTS idx_outreach_lead ON outreach(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_campaign ON outreach(campaign_id);

-- Scheduled follow ups
CREATE INDEX IF NOT EXISTS idx_follow_ups_queue ON follow_ups(scheduled_time) WHERE status = 'PENDING';

-- Meetings scheduling
CREATE INDEX IF NOT EXISTS idx_meetings_org_date ON meetings(organization_id, meeting_date);

-- CRM Pipeline tracking
CREATE INDEX IF NOT EXISTS idx_crm_stage ON crm_pipeline(stage);

-- Tasks prioritization
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_due ON tasks(assigned_user_id, status, due_date);

-- Financial indicators index
CREATE INDEX IF NOT EXISTS idx_invoices_num ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_cashfree ON payments(cashfree_order_id);

-- Audit/Activity logs indices
CREATE INDEX IF NOT EXISTS idx_activity_logs_lookup ON activity_logs(organization_id, timestamp DESC);

-- =========================================================================
-- SECTION 7: DATABASE AUTOMATION TRIGGERS & FUNCTIONS
-- =========================================================================

-- 7.1. TIMESTAMP MAINTENANCE ENGINE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organizations BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_team_members BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_companies BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_campaigns BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_leads BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_crm_pipeline BEFORE UPDATE ON crm_pipeline FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_invoices BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7.2. AUTOMATIC SEQUENCE INVOICE NUMBER GENERATOR
CREATE SEQUENCE IF NOT EXISTS global_invoice_seq START 1001;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_val INTEGER;
    v_date_prefix VARCHAR(8);
BEGIN
    v_date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');
    v_seq_val := NEXTVAL('global_invoice_seq');
    NEW.invoice_number := 'INV-' || v_date_prefix || '-' || LPAD(v_seq_val::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_invoice_num
BEFORE INSERT ON invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();

-- 7.3. SYSTEM AUDIT & ACTIVITY LOGGER TRIGGER
CREATE OR REPLACE FUNCTION log_activity_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_action VARCHAR(255);
    v_module VARCHAR(100);
BEGIN
    -- Determine organization and user coordinates
    IF TG_OP = 'DELETE' THEN
        v_org_id := OLD.organization_id;
        v_action := 'DELETED';
    ELSIF TG_OP = 'INSERT' THEN
        v_org_id := NEW.organization_id;
        v_action := 'CREATED';
    ELSE
        v_org_id := NEW.organization_id;
        v_action := 'UPDATED';
    END IF;

    v_user_id := auth.uid();
    v_module := TG_TABLE_NAME;

    -- Safeguard for headless tasks (e.g. AI Agents execution)
    IF v_user_id IS NULL AND TG_OP <> 'DELETE' THEN
        -- If updated by assigned agent or systems, find owner
        IF TG_TABLE_NAME = 'leads' THEN
            v_user_id := NEW.assigned_user_id;
        END IF;
    END IF;

    -- Dynamic action context parsing
    IF TG_TABLE_NAME = 'leads' THEN
        v_action := v_action || ' lead: ' || COALESCE(NEW.lead_name, OLD.lead_name);
    ELSIF TG_TABLE_NAME = 'campaigns' THEN
        v_action := v_action || ' campaign: ' || COALESCE(NEW.campaign_name, OLD.campaign_name);
    ELSIF TG_TABLE_NAME = 'payments' THEN
        v_action := v_action || ' cashfree payment ID: ' || COALESCE(NEW.cashfree_payment_id, 'Pending');
    END IF;

    -- Avoid infinite loops logging inside activity_logs itself
    IF v_org_id IS NOT NULL THEN
        INSERT INTO activity_logs (organization_id, user_id, action, module)
        VALUES (v_org_id, v_user_id, v_action, v_module);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Audit logging mechanisms on core sales assets
CREATE TRIGGER trigger_audit_leads AFTER INSERT OR UPDATE OR DELETE ON leads FOR EACH ROW EXECUTE FUNCTION log_activity_trigger_fn();
CREATE TRIGGER trigger_audit_campaigns AFTER INSERT OR UPDATE OR DELETE ON campaigns FOR EACH ROW EXECUTE FUNCTION log_activity_trigger_fn();
CREATE TRIGGER trigger_audit_payments AFTER INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION log_activity_trigger_fn();

-- 7.4. CASCADING SOFT DELETE TRIGGER
CREATE OR REPLACE FUNCTION soft_delete_cascade_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        -- Cascade soft delete state to related assets
        IF TG_TABLE_NAME = 'organizations' THEN
            UPDATE profiles SET is_deleted = TRUE WHERE organization_id = NEW.id;
            UPDATE campaigns SET is_deleted = TRUE WHERE organization_id = NEW.id;
            UPDATE leads SET is_deleted = TRUE WHERE organization_id = NEW.id;
        ELSIF TG_TABLE_NAME = 'campaigns' THEN
            UPDATE leads SET is_deleted = TRUE WHERE campaign_id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_soft_delete_organizations_cascade BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION soft_delete_cascade_fn();
CREATE TRIGGER trigger_soft_delete_campaigns_cascade BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION soft_delete_cascade_fn();

-- =========================================================================
-- SECTION 8: ARCHITECTURAL PERFORMANCE OPTIMIZATION NOTES
-- =========================================================================
/*
  1. HYPER-SCALING via RANGE PARTITIONING:
     - For production environments handling >100 million leads or campaigns outreach messages, 
       range partition the `outreach` and `activity_logs` tables monthly using PostgreSQL native declarative partitioning.
       Example: CREATE TABLE outreach_y2026m07 PARTITION OF outreach FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

  2. CUSTOM ATTRIBUTES ENHANCEMENT:
     - To prevent column clutter in `leads` and `companies` tables from various scraping plugins, 
       use PostgreSQL JSONB queries. Create a GIN index on lead custom values:
       CREATE INDEX idx_leads_meta_gin ON leads USING gin (meta_data);

  3. CACHE HIT RATE VERIFICATION:
     - Continuously monitor indexes performance by querying:
       SELECT relname, 100 * idx_scan / (seq_scan + idx_scan) as index_usage FROM pg_stat_user_tables WHERE seq_scan + idx_scan > 0;
       Ensure SalesPilot maintains index usage > 98.5%.
*/
