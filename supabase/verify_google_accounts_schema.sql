-- =========================================================================
-- READ-ONLY VERIFICATION SCRIPT: verify_google_accounts_schema.sql
-- Purpose: Inspect live public.google_accounts schema, constraints, RLS,
--          indexes, and non-destructive data integrity metrics without
--          mutating any data or exposing OAuth tokens/secrets.
-- =========================================================================

-- 1. Table existence & Row-Level Security status
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('google_accounts', 'users', 'organizations', 'oauth_nonces')
ORDER BY c.relname;

-- 2. Column definitions & parent identifier type parity check
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    table_name = 'google_accounts'
    OR (table_name IN ('users', 'organizations') AND column_name = 'id')
  )
ORDER BY table_name, ordinal_position;

-- 3. Primary Key, Foreign Keys, and Unique Constraints on public.google_accounts
SELECT
  c.conname AS constraint_name,
  c.contype AS constraint_type,
  c.convalidated AS is_validated,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE c.conrelid = 'public.google_accounts'::regclass
ORDER BY c.contype, c.conname;

-- 4. Indexes on public.google_accounts (inspect any indisunique indexes)
SELECT
  i.relname AS index_name,
  idx.indisprimary AS is_primary,
  idx.indisunique AS is_unique,
  pg_get_indexdef(idx.indexrelid) AS index_definition
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
WHERE idx.indrelid = 'public.google_accounts'::regclass
ORDER BY idx.indisprimary DESC, idx.indisunique DESC, i.relname;

-- 5. Active RLS Policies on public.google_accounts
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'google_accounts'
ORDER BY policyname;

-- 6. Safe row & integrity summary (counts ONLY — never selects access_token or refresh_token values)
SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE LOWER(COALESCE(account_type, '')) = 'gmail') AS gmail_rows,
  COUNT(*) FILTER (WHERE LOWER(COALESCE(account_type, '')) = 'calendar') AS calendar_rows,
  COUNT(*) FILTER (WHERE access_token IS NOT NULL AND BTRIM(access_token) <> '') AS rows_with_access_token,
  COUNT(*) FILTER (WHERE refresh_token IS NOT NULL AND BTRIM(refresh_token) <> '') AS rows_with_refresh_token,
  COUNT(*) FILTER (WHERE id IS NULL OR BTRIM(id::text) = '') AS rows_missing_id,
  COUNT(*) FILTER (WHERE user_id IS NULL OR BTRIM(user_id::text) = '') AS rows_missing_user_id,
  COUNT(*) FILTER (WHERE organization_id IS NULL OR BTRIM(organization_id::text) = '') AS rows_missing_organization_id,
  COUNT(*) FILTER (WHERE email IS NULL OR BTRIM(email) = '') AS rows_missing_email,
  COUNT(*) FILTER (WHERE expiry_date IS NULL) AS rows_with_null_expiry,
  COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date > 0) AS rows_with_positive_expiry_ms,
  COUNT(*) FILTER (WHERE scopes IS NULL OR cardinality(scopes) = 0) AS rows_with_empty_scopes
FROM public.google_accounts;

-- 7. Orphaned user_id / organization_id audit (must be 0 before FK enforcement)
SELECT
  (
    SELECT COUNT(*)
    FROM public.google_accounts g
    WHERE g.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = g.user_id::text)
  ) AS orphaned_user_id_rows,
  (
    SELECT COUNT(*)
    FROM public.google_accounts g
    WHERE g.organization_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id::text = g.organization_id::text)
  ) AS orphaned_organization_id_rows;

-- 8. Duplicate scoped-identity group audit (non-destructive; no sensitive fields returned)
SELECT
  user_id,
  organization_id,
  LOWER(email) AS normalized_email,
  LOWER(COALESCE(account_type, 'gmail')) AS normalized_account_type,
  COUNT(*) AS record_count
FROM public.google_accounts
GROUP BY user_id, organization_id, LOWER(email), LOWER(COALESCE(account_type, 'gmail'))
HAVING COUNT(*) > 1
ORDER BY record_count DESC, normalized_email;
