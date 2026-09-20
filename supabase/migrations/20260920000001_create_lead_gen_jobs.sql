-- =========================================================================
-- MIGRATION: create_lead_gen_jobs.sql
-- Purpose: Add lead_gen_jobs table with RLS and tenant isolation
-- Target Platform: Supabase / PostgreSQL
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.lead_gen_jobs (
    job_id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'QUEUED',
    progress INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    processed INTEGER NOT NULL DEFAULT 0,
    created INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance and Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_lead_gen_jobs_organization_id 
    ON public.lead_gen_jobs(organization_id);

CREATE INDEX IF NOT EXISTS idx_lead_gen_jobs_org_created 
    ON public.lead_gen_jobs(organization_id, created_at);

CREATE INDEX IF NOT EXISTS idx_lead_gen_jobs_org_status 
    ON public.lead_gen_jobs(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_lead_gen_jobs_job_id 
    ON public.lead_gen_jobs(job_id);

-- Enable RLS
ALTER TABLE public.lead_gen_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_gen_jobs_isolation ON public.lead_gen_jobs;
DROP POLICY IF EXISTS lead_gen_jobs_select ON public.lead_gen_jobs;
DROP POLICY IF EXISTS lead_gen_jobs_insert ON public.lead_gen_jobs;
DROP POLICY IF EXISTS lead_gen_jobs_update ON public.lead_gen_jobs;
DROP POLICY IF EXISTS lead_gen_jobs_delete ON public.lead_gen_jobs;

CREATE POLICY lead_gen_jobs_select ON public.lead_gen_jobs
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY lead_gen_jobs_insert ON public.lead_gen_jobs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY lead_gen_jobs_update ON public.lead_gen_jobs
    FOR UPDATE TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY lead_gen_jobs_delete ON public.lead_gen_jobs
    FOR DELETE TO authenticated
    USING (public.is_org_member(organization_id));
