-- =========================================================================
-- SALESPILOT PRODUCTION DATABASE MIGRATION: 002_outreach_engine.sql
-- Purpose: Schema and Row-Level Security for Automated Outreach & Follow-Up Engine
-- Target Platform: Supabase / PostgreSQL
-- Safety: 100% Idempotent, Non-Destructive, Multi-Tenant Enforced
-- =========================================================================

-- 1. OUTREACH CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    target_lead_ids TEXT[] DEFAULT '{}'::text[],
    daily_limit INTEGER DEFAULT 20,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OUTREACH STEPS
CREATE TABLE IF NOT EXISTS public.outreach_steps (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_days INTEGER NOT NULL DEFAULT 0,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OUTREACH QUEUE
CREATE TABLE IF NOT EXISTS public.outreach_queue (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    step_id TEXT REFERENCES public.outreach_steps(id) ON DELETE SET NULL,
    step_number INTEGER NOT NULL DEFAULT 1,
    lead_id TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED',
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    message_id TEXT,
    provider_message_id TEXT,
    error TEXT,
    attempts INTEGER DEFAULT 0,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OUTREACH MESSAGES
CREATE TABLE IF NOT EXISTS public.outreach_messages (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    lead_id TEXT NOT NULL,
    queue_id TEXT,
    step_number INTEGER DEFAULT 1,
    sender_email TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    provider_message_id TEXT,
    thread_id TEXT,
    status TEXT NOT NULL DEFAULT 'SENT',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OUTREACH EVENTS / AUDIT LOG
CREATE TABLE IF NOT EXISTS public.outreach_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    campaign_id TEXT,
    lead_id TEXT,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. OUTREACH REPLIES
CREATE TABLE IF NOT EXISTS public.outreach_replies (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    lead_id TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT,
    snippet TEXT,
    body TEXT,
    classification TEXT NOT NULL DEFAULT 'UNCLEAR',
    ai_summary TEXT,
    gmail_message_id TEXT,
    gmail_thread_id TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- INDEXES FOR TENANT-SCOPED PERFORMANCE AND QUEUE PROCESSING
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_org ON public.outreach_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_outreach_steps_org_camp ON public.outreach_steps(organization_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_org_status ON public.outreach_queue(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_sched ON public.outreach_queue(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_lead ON public.outreach_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_lead ON public.outreach_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_org ON public.outreach_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_outreach_replies_org ON public.outreach_replies(organization_id);
CREATE INDEX IF NOT EXISTS idx_outreach_replies_lead ON public.outreach_replies(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_org ON public.outreach_events(organization_id);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------------
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_replies ENABLE ROW LEVEL SECURITY;

-- Grants for authenticated workspace users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_replies TO authenticated;

-- RLS Policies
DROP POLICY IF EXISTS outreach_campaigns_isolation ON public.outreach_campaigns;
CREATE POLICY outreach_campaigns_isolation ON public.outreach_campaigns
    FOR ALL TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS outreach_steps_isolation ON public.outreach_steps;
CREATE POLICY outreach_steps_isolation ON public.outreach_steps
    FOR ALL TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS outreach_queue_isolation ON public.outreach_queue;
CREATE POLICY outreach_queue_isolation ON public.outreach_queue
    FOR ALL TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS outreach_messages_isolation ON public.outreach_messages;
CREATE POLICY outreach_messages_isolation ON public.outreach_messages
    FOR ALL TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS outreach_events_isolation ON public.outreach_events;
CREATE POLICY outreach_events_isolation ON public.outreach_events
    FOR ALL TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS outreach_replies_isolation ON public.outreach_replies;
CREATE POLICY outreach_replies_isolation ON public.outreach_replies
    FOR ALL TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));
