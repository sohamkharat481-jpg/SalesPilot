-- Migration: 001_voice_calls.sql
-- Create voice_calls and voice_call_events tables with multi-tenant isolation & RLS

CREATE TABLE IF NOT EXISTS voice_calls (
    id VARCHAR(128) PRIMARY KEY,
    organization_id VARCHAR(128) NOT NULL,
    lead_id VARCHAR(128) NOT NULL,
    lead_name VARCHAR(255),
    company VARCHAR(255),
    job_title VARCHAR(255),
    email VARCHAR(255),
    website VARCHAR(255),
    phone_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
    started_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    provider_call_id VARCHAR(255),
    provider_name VARCHAR(64),
    outcome VARCHAR(64) DEFAULT 'PENDING',
    transcript JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    recording_url TEXT,
    agent_name VARCHAR(255),
    opening_message TEXT,
    call_objective TEXT,
    company_context TEXT,
    lead_context TEXT,
    max_duration_minutes INTEGER DEFAULT 5,
    language VARCHAR(16) DEFAULT 'en-US',
    voice_id VARCHAR(64),
    meeting_booking_goal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_call_events (
    id VARCHAR(128) PRIMARY KEY,
    organization_id VARCHAR(128) NOT NULL,
    call_id VARCHAR(128) NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_voice_calls_org_id ON voice_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_lead_id ON voice_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_calls_provider_id ON voice_calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_call_id ON voice_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_org_id ON voice_call_events(organization_id);

-- Enable Row Level Security (RLS)
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_events ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS voice_calls_tenant_isolation ON voice_calls;
CREATE POLICY voice_calls_tenant_isolation ON voice_calls
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id', true));

DROP POLICY IF EXISTS voice_call_events_tenant_isolation ON voice_call_events;
CREATE POLICY voice_call_events_tenant_isolation ON voice_call_events
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id', true));
