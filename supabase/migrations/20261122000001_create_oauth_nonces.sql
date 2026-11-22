-- =========================================================================
-- MIGRATION: create_oauth_nonces.sql
-- Purpose: Persistent, atomic single-use OAuth nonce store for replay protection
-- Target Platform: Supabase / PostgreSQL
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.oauth_nonces (
    nonce TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Explicit unique constraint/index enforcing atomic single-use semantics across instances
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_nonces_nonce_unique
    ON public.oauth_nonces(nonce);

-- Index to support safe, fast cleanup of expired nonce records
CREATE INDEX IF NOT EXISTS idx_oauth_nonces_expires_at
    ON public.oauth_nonces(expires_at);

-- Lock down table with RLS; only privileged server-side service_role access is permitted
ALTER TABLE public.oauth_nonces ENABLE ROW LEVEL SECURITY;
