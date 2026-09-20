-- =========================================================================
-- SALESPILOT PRODUCTION DATABASE MIGRATION: 002_add_lead_uniqueness_constraints.sql
-- Purpose: Enforce tenant-scoped concurrency-safe duplicate protection for leads
-- Target Platform: Supabase / PostgreSQL
-- Safety: Non-destructive, handles NULL / empty values gracefully
-- =========================================================================

-- Tenant-scoped unique index on normalized email for non-empty emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_org_email_unique 
    ON public.leads (organization_id, LOWER(email)) 
    WHERE email IS NOT NULL AND TRIM(email) != '';

-- Tenant-scoped unique index on normalized company website for non-empty websites
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_org_website_unique 
    ON public.leads (organization_id, LOWER(website)) 
    WHERE website IS NOT NULL AND TRIM(website) != '';
