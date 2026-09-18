-- =========================================================================
-- SALESPILOT PRODUCTION DATABASE MIGRATION: 001_row_level_security.sql
-- Purpose: Enforce database-level multi-tenant isolation via Row Level Security (RLS)
-- Target Platform: Supabase / PostgreSQL
-- Safety: 100% Idempotent, Non-Destructive, Zero Data Modification
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. PERFORMANCE & LOOKUP INDEXES FOR RLS EVALUATION
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org 
    ON public.organization_members(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_status 
    ON public.organization_members(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_role 
    ON public.organization_members(organization_id, role);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id 
    ON public.pipeline_stages(pipeline_id);

-- High-volume organization_id lookup indexes to optimize RLS evaluations
CREATE INDEX IF NOT EXISTS idx_google_accounts_organization_id 
    ON public.google_accounts(organization_id);

CREATE INDEX IF NOT EXISTS idx_google_accounts_user_id 
    ON public.google_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_sent_emails_organization_id 
    ON public.sent_emails(organization_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id 
    ON public.activity_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id 
    ON public.audit_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_company_research_organization_id 
    ON public.ai_company_research(organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_email_generations_organization_id 
    ON public.ai_email_generations(organization_id);

-- -------------------------------------------------------------------------
-- 2. HARDENED TENANT AUTHORIZATION HELPER FUNCTIONS
-- Derives access strictly from:
-- auth.uid() -> organization_members -> organization_id -> organization-owned row
-- Using SECURITY DEFINER to safely break recursive RLS checks on organization_members
-- Tight search_path and fully-qualified table references prevent hijacking
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND (
        om.user_id = auth.uid()::text 
        OR om.user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
      )
      AND (om.status = 'ACTIVE' OR om.status IS NULL)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin_or_owner(target_org_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND (
        om.user_id = auth.uid()::text 
        OR om.user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
      )
      AND UPPER(COALESCE(om.role, 'MEMBER')) IN ('ADMIN', 'OWNER')
      AND (om.status = 'ACTIVE' OR om.status IS NULL)
  )
  OR EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = target_org_id
      AND (
        o.owner_id = auth.uid()::text
        OR o.owner_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(target_org_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = target_org_id
      AND (
        o.owner_id = auth.uid()::text
        OR o.owner_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND (
        om.user_id = auth.uid()::text 
        OR om.user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
      )
      AND UPPER(COALESCE(om.role, 'MEMBER')) = 'OWNER'
      AND (om.status = 'ACTIVE' OR om.status IS NULL)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_organizations()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
  SELECT om.organization_id
  FROM public.organization_members om
  WHERE (
      om.user_id = auth.uid()::text 
      OR om.user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
    )
    AND (om.status = 'ACTIVE' OR om.status IS NULL);
$$;

-- Restrict execution on helper functions: only authenticated and service roles
REVOKE ALL ON FUNCTION public.is_org_member(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_org_admin_or_owner(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_admin_or_owner(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_org_owner(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_owner(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_auth_user_organizations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_user_organizations() TO authenticated, service_role;

-- -------------------------------------------------------------------------
-- 3. ORGANIZATIONS (Root Multi-tenant Table)
-- Ownership and Deletion Protected:
-- Members may view and edit non-critical fields if admin/owner.
-- Ordinary members CANNOT change owner_id or delete the organization.
-- -------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation ON public.organizations;
DROP POLICY IF EXISTS organizations_select ON public.organizations;
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
DROP POLICY IF EXISTS organizations_update ON public.organizations;
DROP POLICY IF EXISTS organizations_delete ON public.organizations;

CREATE POLICY organizations_select ON public.organizations
    FOR SELECT TO authenticated
    USING (public.is_org_member(id));

CREATE POLICY organizations_insert ON public.organizations
    FOR INSERT TO authenticated
    WITH CHECK (
        owner_id = auth.uid()::text 
        OR owner_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
    );

CREATE POLICY organizations_update ON public.organizations
    FOR UPDATE TO authenticated
    USING (public.is_org_admin_or_owner(id))
    WITH CHECK (
        -- Members/Admins cannot change owner_id unless they are the verified owner
        (
            owner_id = (SELECT o.owner_id FROM public.organizations o WHERE o.id = organizations.id)
            OR public.is_org_owner(id)
        )
        AND public.is_org_admin_or_owner(id)
    );

CREATE POLICY organizations_delete ON public.organizations
    FOR DELETE TO authenticated
    USING (public.is_org_owner(id));

-- -------------------------------------------------------------------------
-- 4. ORGANIZATION MEMBERS (Tenant Membership Table)
-- Privilege Escalation Fixed:
-- Ordinary MEMBER can view organization membership, but CANNOT add, update, or remove members.
-- ADMIN/OWNER can invite or manage members.
-- Only OWNER can promote/transfer OWNER role.
-- -------------------------------------------------------------------------
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_members_isolation ON public.organization_members;
DROP POLICY IF EXISTS organization_members_select ON public.organization_members;
DROP POLICY IF EXISTS organization_members_insert ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete ON public.organization_members;

CREATE POLICY organization_members_select ON public.organization_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()::text 
        OR public.is_org_member(organization_id)
    );

CREATE POLICY organization_members_insert ON public.organization_members
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_admin_or_owner(organization_id)
        AND (
            UPPER(COALESCE(role, 'MEMBER')) != 'OWNER'
            OR public.is_org_owner(organization_id)
        )
    );

CREATE POLICY organization_members_update ON public.organization_members
    FOR UPDATE TO authenticated
    USING (public.is_org_admin_or_owner(organization_id))
    WITH CHECK (
        public.is_org_admin_or_owner(organization_id)
        AND (
            UPPER(COALESCE(role, 'MEMBER')) != 'OWNER'
            OR public.is_org_owner(organization_id)
        )
    );

CREATE POLICY organization_members_delete ON public.organization_members
    FOR DELETE TO authenticated
    USING (
        public.is_org_admin_or_owner(organization_id)
        AND (
            UPPER(COALESCE(role, 'MEMBER')) != 'OWNER'
            OR public.is_org_owner(organization_id)
        )
    );

-- -------------------------------------------------------------------------
-- 5. USERS & PROFILES
-- Teammate Mutation Fixed:
-- A user may UPDATE only their own record (id = auth.uid()).
-- Same-org membership allows SELECT (for team directory/collaboration),
-- but does NOT grant permission to mutate another user's identity or role.
-- -------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_isolation ON public.users;
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;

CREATE POLICY users_select ON public.users
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()::text 
        OR (organization_id IS NOT NULL AND public.is_org_member(organization_id))
    );

CREATE POLICY users_insert ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (
        id = auth.uid()::text 
        OR (organization_id IS NOT NULL AND public.is_org_admin_or_owner(organization_id))
    );

CREATE POLICY users_update ON public.users
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid()::text 
        OR (organization_id IS NOT NULL AND public.is_org_admin_or_owner(organization_id))
    )
    WITH CHECK (
        id = auth.uid()::text 
        OR (organization_id IS NOT NULL AND public.is_org_admin_or_owner(organization_id))
    );

CREATE POLICY users_delete ON public.users
    FOR DELETE TO authenticated
    USING (
        organization_id IS NOT NULL AND public.is_org_admin_or_owner(organization_id)
    );

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_isolation ON public.profiles;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
DROP POLICY IF EXISTS profiles_delete ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()::text 
        OR (organization_id IS NOT NULL AND public.is_org_member(organization_id))
    );

CREATE POLICY profiles_insert ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (
        id = auth.uid()::text 
        OR (organization_id IS NOT NULL AND public.is_org_admin_or_owner(organization_id))
    );

CREATE POLICY profiles_update ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid()::text 
        OR (organization_id IS NOT NULL AND public.is_org_admin_or_owner(organization_id))
    )
    WITH CHECK (
        id = auth.uid()::text 
        OR (organization_id IS NOT NULL AND public.is_org_admin_or_owner(organization_id))
    );

CREATE POLICY profiles_delete ON public.profiles
    FOR DELETE TO authenticated
    USING (
        organization_id IS NOT NULL AND public.is_org_admin_or_owner(organization_id)
    );

-- -------------------------------------------------------------------------
-- 6. TEAM MEMBERS
-- -------------------------------------------------------------------------
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_members_isolation ON public.team_members;
DROP POLICY IF EXISTS team_members_select ON public.team_members;
DROP POLICY IF EXISTS team_members_insert ON public.team_members;
DROP POLICY IF EXISTS team_members_update ON public.team_members;
DROP POLICY IF EXISTS team_members_delete ON public.team_members;

CREATE POLICY team_members_select ON public.team_members
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY team_members_insert ON public.team_members
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY team_members_update ON public.team_members
    FOR UPDATE TO authenticated
    USING (public.is_org_admin_or_owner(organization_id))
    WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY team_members_delete ON public.team_members
    FOR DELETE TO authenticated
    USING (public.is_org_admin_or_owner(organization_id));

-- -------------------------------------------------------------------------
-- 7. GOOGLE ACCOUNTS (OAuth access_token & refresh_token protection)
-- CRITICAL SECURITY FIX:
-- Access to OAuth tokens is strictly restricted to user_id ownership.
-- Organization membership alone does NOT expose OAuth credentials.
-- -------------------------------------------------------------------------
ALTER TABLE public.google_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS google_accounts_isolation ON public.google_accounts;
DROP POLICY IF EXISTS google_accounts_select ON public.google_accounts;
DROP POLICY IF EXISTS google_accounts_insert ON public.google_accounts;
DROP POLICY IF EXISTS google_accounts_update ON public.google_accounts;
DROP POLICY IF EXISTS google_accounts_delete ON public.google_accounts;

CREATE POLICY google_accounts_select ON public.google_accounts
    FOR SELECT TO authenticated
    USING (
        (
            user_id = auth.uid()::text
            OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
        )
        AND public.is_org_member(organization_id)
    );

CREATE POLICY google_accounts_insert ON public.google_accounts
    FOR INSERT TO authenticated
    WITH CHECK (
        (
            user_id = auth.uid()::text
            OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
        )
        AND public.is_org_member(organization_id)
    );

CREATE POLICY google_accounts_update ON public.google_accounts
    FOR UPDATE TO authenticated
    USING (
        (
            user_id = auth.uid()::text
            OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
        )
        AND public.is_org_member(organization_id)
    )
    WITH CHECK (
        (
            user_id = auth.uid()::text
            OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
        )
        AND public.is_org_member(organization_id)
    );

CREATE POLICY google_accounts_delete ON public.google_accounts
    FOR DELETE TO authenticated
    USING (
        (
            user_id = auth.uid()::text
            OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
        )
        AND public.is_org_member(organization_id)
    );

-- -------------------------------------------------------------------------
-- 8. SESSIONS
-- Protected strictly to session owner
-- -------------------------------------------------------------------------
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_isolation ON public.sessions;
DROP POLICY IF EXISTS sessions_select ON public.sessions;
DROP POLICY IF EXISTS sessions_insert ON public.sessions;
DROP POLICY IF EXISTS sessions_update ON public.sessions;
DROP POLICY IF EXISTS sessions_delete ON public.sessions;

CREATE POLICY sessions_select ON public.sessions
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()::text 
        OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
    );

CREATE POLICY sessions_insert ON public.sessions
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()::text 
        OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
    );

CREATE POLICY sessions_update ON public.sessions
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid()::text 
        OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
    )
    WITH CHECK (
        user_id = auth.uid()::text 
        OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
    );

CREATE POLICY sessions_delete ON public.sessions
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid()::text 
        OR user_id IN (SELECT u.id FROM public.users u WHERE u.id = auth.uid()::text)
    );

-- -------------------------------------------------------------------------
-- 9. LEADS
-- -------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_isolation ON public.leads;
DROP POLICY IF EXISTS leads_select ON public.leads;
DROP POLICY IF EXISTS leads_insert ON public.leads;
DROP POLICY IF EXISTS leads_update ON public.leads;
DROP POLICY IF EXISTS leads_delete ON public.leads;

CREATE POLICY leads_select ON public.leads
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY leads_insert ON public.leads
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY leads_update ON public.leads
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY leads_delete ON public.leads
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

-- -------------------------------------------------------------------------
-- 10. CONTACTS & COMPANIES
-- -------------------------------------------------------------------------
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_isolation ON public.contacts;
DROP POLICY IF EXISTS contacts_select ON public.contacts;
DROP POLICY IF EXISTS contacts_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_update ON public.contacts;
DROP POLICY IF EXISTS contacts_delete ON public.contacts;

CREATE POLICY contacts_select ON public.contacts
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY contacts_insert ON public.contacts
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY contacts_update ON public.contacts
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY contacts_delete ON public.contacts
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_isolation ON public.companies;
DROP POLICY IF EXISTS companies_select ON public.companies;
DROP POLICY IF EXISTS companies_insert ON public.companies;
DROP POLICY IF EXISTS companies_update ON public.companies;
DROP POLICY IF EXISTS companies_delete ON public.companies;

CREATE POLICY companies_select ON public.companies
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY companies_insert ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY companies_update ON public.companies
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY companies_delete ON public.companies
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

-- -------------------------------------------------------------------------
-- 11. PIPELINES & PIPELINE STAGES (Stages are indirectly scoped via pipelines)
-- -------------------------------------------------------------------------
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pipelines_isolation ON public.pipelines;
DROP POLICY IF EXISTS pipelines_select ON public.pipelines;
DROP POLICY IF EXISTS pipelines_insert ON public.pipelines;
DROP POLICY IF EXISTS pipelines_update ON public.pipelines;
DROP POLICY IF EXISTS pipelines_delete ON public.pipelines;

CREATE POLICY pipelines_select ON public.pipelines
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY pipelines_insert ON public.pipelines
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY pipelines_update ON public.pipelines
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY pipelines_delete ON public.pipelines
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pipeline_stages_isolation ON public.pipeline_stages;
DROP POLICY IF EXISTS pipeline_stages_select ON public.pipeline_stages;
DROP POLICY IF EXISTS pipeline_stages_insert ON public.pipeline_stages;
DROP POLICY IF EXISTS pipeline_stages_update ON public.pipeline_stages;
DROP POLICY IF EXISTS pipeline_stages_delete ON public.pipeline_stages;

CREATE POLICY pipeline_stages_select ON public.pipeline_stages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pipelines p 
            WHERE p.id = pipeline_stages.pipeline_id 
              AND public.is_org_member(p.organization_id)
        )
    );

CREATE POLICY pipeline_stages_insert ON public.pipeline_stages
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pipelines p 
            WHERE p.id = pipeline_stages.pipeline_id 
              AND public.is_org_member(p.organization_id)
        )
    );

CREATE POLICY pipeline_stages_update ON public.pipeline_stages
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pipelines p 
            WHERE p.id = pipeline_stages.pipeline_id 
              AND public.is_org_member(p.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pipelines p 
            WHERE p.id = pipeline_stages.pipeline_id 
              AND public.is_org_member(p.organization_id)
        )
    );

CREATE POLICY pipeline_stages_delete ON public.pipeline_stages
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pipelines p 
            WHERE p.id = pipeline_stages.pipeline_id 
              AND public.is_org_member(p.organization_id)
        )
    );

-- -------------------------------------------------------------------------
-- 12. DEALS
-- -------------------------------------------------------------------------
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deals_isolation ON public.deals;
DROP POLICY IF EXISTS deals_select ON public.deals;
DROP POLICY IF EXISTS deals_insert ON public.deals;
DROP POLICY IF EXISTS deals_update ON public.deals;
DROP POLICY IF EXISTS deals_delete ON public.deals;

CREATE POLICY deals_select ON public.deals
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY deals_insert ON public.deals
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY deals_update ON public.deals
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY deals_delete ON public.deals
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

-- -------------------------------------------------------------------------
-- 13. APPOINTMENTS & CALENDAR EVENTS
-- -------------------------------------------------------------------------
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS appointments_isolation ON public.appointments;
DROP POLICY IF EXISTS appointments_select ON public.appointments;
DROP POLICY IF EXISTS appointments_insert ON public.appointments;
DROP POLICY IF EXISTS appointments_update ON public.appointments;
DROP POLICY IF EXISTS appointments_delete ON public.appointments;

CREATE POLICY appointments_select ON public.appointments
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY appointments_insert ON public.appointments
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY appointments_update ON public.appointments
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY appointments_delete ON public.appointments
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_isolation ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_select ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_insert ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_update ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_delete ON public.calendar_events;

CREATE POLICY calendar_events_select ON public.calendar_events
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY calendar_events_insert ON public.calendar_events
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY calendar_events_update ON public.calendar_events
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY calendar_events_delete ON public.calendar_events
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

-- -------------------------------------------------------------------------
-- 14. CAMPAIGNS & EMAIL MANAGEMENT
-- -------------------------------------------------------------------------
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS campaigns_isolation ON public.campaigns;
DROP POLICY IF EXISTS campaigns_select ON public.campaigns;
DROP POLICY IF EXISTS campaigns_insert ON public.campaigns;
DROP POLICY IF EXISTS campaigns_update ON public.campaigns;
DROP POLICY IF EXISTS campaigns_delete ON public.campaigns;

CREATE POLICY campaigns_select ON public.campaigns
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY campaigns_insert ON public.campaigns
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY campaigns_update ON public.campaigns
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY campaigns_delete ON public.campaigns
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_templates_isolation ON public.email_templates;
DROP POLICY IF EXISTS email_templates_select ON public.email_templates;
DROP POLICY IF EXISTS email_templates_insert ON public.email_templates;
DROP POLICY IF EXISTS email_templates_update ON public.email_templates;
DROP POLICY IF EXISTS email_templates_delete ON public.email_templates;

CREATE POLICY email_templates_select ON public.email_templates
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY email_templates_insert ON public.email_templates
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY email_templates_update ON public.email_templates
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY email_templates_delete ON public.email_templates
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_sequences_isolation ON public.email_sequences;
DROP POLICY IF EXISTS email_sequences_select ON public.email_sequences;
DROP POLICY IF EXISTS email_sequences_insert ON public.email_sequences;
DROP POLICY IF EXISTS email_sequences_update ON public.email_sequences;
DROP POLICY IF EXISTS email_sequences_delete ON public.email_sequences;

CREATE POLICY email_sequences_select ON public.email_sequences
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY email_sequences_insert ON public.email_sequences
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY email_sequences_update ON public.email_sequences
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY email_sequences_delete ON public.email_sequences
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sent_emails_isolation ON public.sent_emails;
DROP POLICY IF EXISTS sent_emails_select ON public.sent_emails;
DROP POLICY IF EXISTS sent_emails_insert ON public.sent_emails;
DROP POLICY IF EXISTS sent_emails_update ON public.sent_emails;
DROP POLICY IF EXISTS sent_emails_delete ON public.sent_emails;

CREATE POLICY sent_emails_select ON public.sent_emails
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY sent_emails_insert ON public.sent_emails
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY sent_emails_update ON public.sent_emails
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY sent_emails_delete ON public.sent_emails
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

-- -------------------------------------------------------------------------
-- 15. ANALYTICS, ACTIVITIES & ACTIVITY LOGS
-- -------------------------------------------------------------------------
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_isolation ON public.analytics;
DROP POLICY IF EXISTS analytics_select ON public.analytics;
DROP POLICY IF EXISTS analytics_insert ON public.analytics;
DROP POLICY IF EXISTS analytics_update ON public.analytics;
DROP POLICY IF EXISTS analytics_delete ON public.analytics;

CREATE POLICY analytics_select ON public.analytics
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY analytics_insert ON public.analytics
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY analytics_update ON public.analytics
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY analytics_delete ON public.analytics
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_logs_isolation ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_select ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_insert ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_update ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_delete ON public.activity_logs;

CREATE POLICY activity_logs_select ON public.activity_logs
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY activity_logs_insert ON public.activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY activity_logs_update ON public.activity_logs
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY activity_logs_delete ON public.activity_logs
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activities_isolation ON public.activities;
DROP POLICY IF EXISTS activities_select ON public.activities;
DROP POLICY IF EXISTS activities_insert ON public.activities;
DROP POLICY IF EXISTS activities_update ON public.activities;
DROP POLICY IF EXISTS activities_delete ON public.activities;

CREATE POLICY activities_select ON public.activities
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY activities_insert ON public.activities
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY activities_update ON public.activities
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY activities_delete ON public.activities
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

-- -------------------------------------------------------------------------
-- 16. NOTIFICATIONS, TASKS & NOTES
-- -------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_isolation ON public.notifications;
DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
DROP POLICY IF EXISTS notifications_update ON public.notifications;
DROP POLICY IF EXISTS notifications_delete ON public.notifications;

CREATE POLICY notifications_select ON public.notifications
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY notifications_insert ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY notifications_update ON public.notifications
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY notifications_delete ON public.notifications
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_isolation ON public.tasks;
DROP POLICY IF EXISTS tasks_select ON public.tasks;
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
DROP POLICY IF EXISTS tasks_update ON public.tasks;
DROP POLICY IF EXISTS tasks_delete ON public.tasks;

CREATE POLICY tasks_select ON public.tasks
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY tasks_insert ON public.tasks
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY tasks_update ON public.tasks
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY tasks_delete ON public.tasks
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notes_isolation ON public.notes;
DROP POLICY IF EXISTS notes_select ON public.notes;
DROP POLICY IF EXISTS notes_insert ON public.notes;
DROP POLICY IF EXISTS notes_update ON public.notes;
DROP POLICY IF EXISTS notes_delete ON public.notes;

CREATE POLICY notes_select ON public.notes
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY notes_insert ON public.notes
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY notes_update ON public.notes
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY notes_delete ON public.notes
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

-- -------------------------------------------------------------------------
-- 17. BILLING & SUBSCRIPTIONS
-- Restrict mutations to organization ADMIN and OWNER only.
-- Ordinary members may view workspace billing details if required.
-- -------------------------------------------------------------------------
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_isolation ON public.billing;
DROP POLICY IF EXISTS billing_select ON public.billing;
DROP POLICY IF EXISTS billing_insert ON public.billing;
DROP POLICY IF EXISTS billing_update ON public.billing;
DROP POLICY IF EXISTS billing_delete ON public.billing;

CREATE POLICY billing_select ON public.billing
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY billing_insert ON public.billing
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY billing_update ON public.billing
    FOR UPDATE TO authenticated
    USING (public.is_org_admin_or_owner(organization_id))
    WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY billing_delete ON public.billing
    FOR DELETE TO authenticated
    USING (public.is_org_owner(organization_id));

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_isolation ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_insert ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_delete ON public.subscriptions;

CREATE POLICY subscriptions_select ON public.subscriptions
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY subscriptions_insert ON public.subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY subscriptions_update ON public.subscriptions
    FOR UPDATE TO authenticated
    USING (public.is_org_admin_or_owner(organization_id))
    WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY subscriptions_delete ON public.subscriptions
    FOR DELETE TO authenticated
    USING (public.is_org_owner(organization_id));

-- -------------------------------------------------------------------------
-- 18. API KEYS
-- Confidential secrets protection:
-- Only organization ADMIN or OWNER can view, generate, rotate, or delete API keys.
-- Ordinary members cannot view raw hashes or manage keys.
-- -------------------------------------------------------------------------
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_keys_isolation ON public.api_keys;
DROP POLICY IF EXISTS api_keys_select ON public.api_keys;
DROP POLICY IF EXISTS api_keys_insert ON public.api_keys;
DROP POLICY IF EXISTS api_keys_update ON public.api_keys;
DROP POLICY IF EXISTS api_keys_delete ON public.api_keys;

CREATE POLICY api_keys_select ON public.api_keys
    FOR SELECT TO authenticated
    USING (public.is_org_admin_or_owner(organization_id));

CREATE POLICY api_keys_insert ON public.api_keys
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY api_keys_update ON public.api_keys
    FOR UPDATE TO authenticated
    USING (public.is_org_admin_or_owner(organization_id))
    WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY api_keys_delete ON public.api_keys
    FOR DELETE TO authenticated
    USING (public.is_org_admin_or_owner(organization_id));

-- -------------------------------------------------------------------------
-- 19. AUDIT LOGS (Immutable Append-Only Audit Trail)
-- Ordinary authenticated users may read their organization logs and append (insert) entries.
-- UPDATE and DELETE are strictly disallowed for authenticated users.
-- -------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_isolation ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_update ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_delete ON public.audit_logs;

CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

-- Explicitly NO UPDATE or DELETE policy on audit_logs for authenticated users.
-- The default closed RLS state strictly blocks mutations, enforcing append-only immutability.

-- -------------------------------------------------------------------------
-- 20. AI MODULES (SalesPilot AI SDR)
-- -------------------------------------------------------------------------
ALTER TABLE public.ai_company_research ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_company_research_isolation ON public.ai_company_research;
DROP POLICY IF EXISTS ai_company_research_select ON public.ai_company_research;
DROP POLICY IF EXISTS ai_company_research_insert ON public.ai_company_research;
DROP POLICY IF EXISTS ai_company_research_update ON public.ai_company_research;
DROP POLICY IF EXISTS ai_company_research_delete ON public.ai_company_research;

CREATE POLICY ai_company_research_select ON public.ai_company_research
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY ai_company_research_insert ON public.ai_company_research
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_company_research_update ON public.ai_company_research
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_company_research_delete ON public.ai_company_research
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.ai_contact_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_contact_profiles_isolation ON public.ai_contact_profiles;
DROP POLICY IF EXISTS ai_contact_profiles_select ON public.ai_contact_profiles;
DROP POLICY IF EXISTS ai_contact_profiles_insert ON public.ai_contact_profiles;
DROP POLICY IF EXISTS ai_contact_profiles_update ON public.ai_contact_profiles;
DROP POLICY IF EXISTS ai_contact_profiles_delete ON public.ai_contact_profiles;

CREATE POLICY ai_contact_profiles_select ON public.ai_contact_profiles
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY ai_contact_profiles_insert ON public.ai_contact_profiles
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_contact_profiles_update ON public.ai_contact_profiles
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_contact_profiles_delete ON public.ai_contact_profiles
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.ai_email_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_email_generations_isolation ON public.ai_email_generations;
DROP POLICY IF EXISTS ai_email_generations_select ON public.ai_email_generations;
DROP POLICY IF EXISTS ai_email_generations_insert ON public.ai_email_generations;
DROP POLICY IF EXISTS ai_email_generations_update ON public.ai_email_generations;
DROP POLICY IF EXISTS ai_email_generations_delete ON public.ai_email_generations;

CREATE POLICY ai_email_generations_select ON public.ai_email_generations
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY ai_email_generations_insert ON public.ai_email_generations
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_email_generations_update ON public.ai_email_generations
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_email_generations_delete ON public.ai_email_generations
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.ai_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_followups_isolation ON public.ai_followups;
DROP POLICY IF EXISTS ai_followups_select ON public.ai_followups;
DROP POLICY IF EXISTS ai_followups_insert ON public.ai_followups;
DROP POLICY IF EXISTS ai_followups_update ON public.ai_followups;
DROP POLICY IF EXISTS ai_followups_delete ON public.ai_followups;

CREATE POLICY ai_followups_select ON public.ai_followups
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY ai_followups_insert ON public.ai_followups
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_followups_update ON public.ai_followups
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_followups_delete ON public.ai_followups
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.ai_meeting_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_meeting_briefs_isolation ON public.ai_meeting_briefs;
DROP POLICY IF EXISTS ai_meeting_briefs_select ON public.ai_meeting_briefs;
DROP POLICY IF EXISTS ai_meeting_briefs_insert ON public.ai_meeting_briefs;
DROP POLICY IF EXISTS ai_meeting_briefs_update ON public.ai_meeting_briefs;
DROP POLICY IF EXISTS ai_meeting_briefs_delete ON public.ai_meeting_briefs;

CREATE POLICY ai_meeting_briefs_select ON public.ai_meeting_briefs
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY ai_meeting_briefs_insert ON public.ai_meeting_briefs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_meeting_briefs_update ON public.ai_meeting_briefs
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_meeting_briefs_delete ON public.ai_meeting_briefs
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_proposals_isolation ON public.ai_proposals;
DROP POLICY IF EXISTS ai_proposals_select ON public.ai_proposals;
DROP POLICY IF EXISTS ai_proposals_insert ON public.ai_proposals;
DROP POLICY IF EXISTS ai_proposals_update ON public.ai_proposals;
DROP POLICY IF EXISTS ai_proposals_delete ON public.ai_proposals;

CREATE POLICY ai_proposals_select ON public.ai_proposals
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY ai_proposals_insert ON public.ai_proposals
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_proposals_update ON public.ai_proposals
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_proposals_delete ON public.ai_proposals
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

ALTER TABLE public.ai_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_scores_isolation ON public.ai_scores;
DROP POLICY IF EXISTS ai_scores_select ON public.ai_scores;
DROP POLICY IF EXISTS ai_scores_insert ON public.ai_scores;
DROP POLICY IF EXISTS ai_scores_update ON public.ai_scores;
DROP POLICY IF EXISTS ai_scores_delete ON public.ai_scores;

CREATE POLICY ai_scores_select ON public.ai_scores
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY ai_scores_insert ON public.ai_scores
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_scores_update ON public.ai_scores
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY ai_scores_delete ON public.ai_scores
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));

-- -------------------------------------------------------------------------
-- 21. LEAST-PRIVILEGE POSTGRESQL GRANTS HARMONIZATION
-- Ensure sensitive credential and billing tables are explicitly protected
-- from anonymous access while preserving backend service_role full authority.
-- -------------------------------------------------------------------------

-- Revoke all public and anonymous privileges on sensitive tables
REVOKE ALL ON public.google_accounts FROM PUBLIC, anon;
REVOKE ALL ON public.api_keys FROM PUBLIC, anon;
REVOKE ALL ON public.sessions FROM PUBLIC, anon;
REVOKE ALL ON public.billing FROM PUBLIC, anon;
REVOKE ALL ON public.subscriptions FROM PUBLIC, anon;
REVOKE ALL ON public.audit_logs FROM PUBLIC, anon;

-- Grant operational DML to authenticated users (RLS enforces row filtering)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Ensure service_role maintains full administrative privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
