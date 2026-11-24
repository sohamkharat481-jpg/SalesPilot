-- =========================================================================
-- MIGRATION: 20261123000001_ensure_google_accounts_schema.sql
-- Purpose: 100% Idempotent, Non-Destructive Schema Reconciliation for public.google_accounts
-- Safety Guarantees:
--   1. NEVER drops or recreates public.google_accounts.
--   2. NEVER deletes existing Gmail/Calendar rows or overwrites access_token / refresh_token.
--   3. Safely inspects parent public.users(id) and public.organizations(id) identifier types (UUID vs TEXT).
--   4. Safely adds missing columns (including missing id + PK reconciliation after validation).
--   5. Safely converts expiry_date (TIMESTAMPTZ/TEXT/INT -> BIGINT ms) and scopes (TEXT/JSONB -> TEXT[]).
--   6. Preserves & restores RLS policies when altering column types; enforces cross-tenant isolation.
--   7. Reconciles FK constraints ONLY after validating zero orphan rows; logs clear diagnostics otherwise.
--   8. Audits duplicate records without creating a unique index that could reject legitimate rows.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Helper functions in pg_temp for safe, exception-resilient conversions
-- (Scoped strictly to the current session; leaves zero objects in public)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp._sp_safe_expiry_ms(raw_val TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_trimmed TEXT;
  v_ts TIMESTAMPTZ;
BEGIN
  IF raw_val IS NULL THEN
    RETURN NULL;
  END IF;
  v_trimmed := BTRIM(raw_val);
  IF v_trimmed = '' THEN
    RETURN NULL;
  END IF;
  IF v_trimmed ~ '^[0-9]{1,18}$' THEN
    RETURN v_trimmed::BIGINT;
  END IF;
  v_ts := v_trimmed::TIMESTAMPTZ;
  RETURN FLOOR(EXTRACT(EPOCH FROM v_ts) * 1000)::BIGINT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp._sp_safe_parse_scopes(raw_val TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  v_trimmed TEXT;
  v_res TEXT[];
  v_item TEXT;
BEGIN
  IF raw_val IS NULL THEN
    RETURN '{}'::text[];
  END IF;
  v_trimmed := BTRIM(raw_val);
  IF v_trimmed = '' OR v_trimmed = '{}' OR v_trimmed = '[]' THEN
    RETURN '{}'::text[];
  END IF;

  -- PostgreSQL array literal e.g. {scope1,"scope 2"}
  IF LEFT(v_trimmed, 1) = '{' AND RIGHT(v_trimmed, 1) = '}' THEN
    BEGIN
      v_res := v_trimmed::text[];
      RETURN COALESCE(array_remove(v_res, ''), '{}'::text[]);
    EXCEPTION
      WHEN OTHERS THEN
        v_trimmed := SUBSTRING(v_trimmed FROM 2 FOR CHAR_LENGTH(v_trimmed) - 2);
    END;
  END IF;

  -- JSON array literal e.g. ["https://...", "openid"]
  IF LEFT(v_trimmed, 1) = '[' AND RIGHT(v_trimmed, 1) = ']' THEN
    BEGIN
      SELECT COALESCE(array_agg(BTRIM(elem)), '{}'::text[])
      INTO v_res
      FROM jsonb_array_elements_text(v_trimmed::jsonb) AS elem
      WHERE BTRIM(elem) <> '';
      RETURN COALESCE(v_res, '{}'::text[]);
    EXCEPTION
      WHEN OTHERS THEN
        v_trimmed := regexp_replace(SUBSTRING(v_trimmed FROM 2 FOR CHAR_LENGTH(v_trimmed) - 2), '"', '', 'g');
    END;
  END IF;

  -- Whitespace or comma-separated scopes string
  v_res := '{}'::text[];
  FOR v_item IN
    SELECT BTRIM(tok)
    FROM regexp_split_to_table(v_trimmed, '[\s,]+') AS tok
    WHERE BTRIM(tok) <> ''
  LOOP
    v_item := BTRIM(v_item, '"''');
    IF v_item <> '' THEN
      v_res := array_append(v_res, v_item);
    END IF;
  END LOOP;
  RETURN COALESCE(v_res, '{}'::text[]);
END;
$$;

-- -------------------------------------------------------------------------
-- Main Non-Destructive Reconciliation Block
-- -------------------------------------------------------------------------
DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_users_exists BOOLEAN := FALSE;
  v_orgs_exists BOOLEAN := FALSE;
  v_users_id_type TEXT := 'text';
  v_orgs_id_type TEXT := 'text';
  v_users_has_unique_id BOOLEAN := FALSE;
  v_orgs_has_unique_id BOOLEAN := FALSE;

  v_ga_id_exists BOOLEAN := FALSE;
  v_ga_id_type TEXT;
  v_ga_user_id_type TEXT;
  v_ga_org_id_type TEXT;
  v_ga_expiry_type TEXT;
  v_ga_scopes_type TEXT;

  v_has_pk BOOLEAN := FALSE;
  v_pk_cols TEXT[];
  v_null_id_count BIGINT := 0;
  v_dup_id_count BIGINT := 0;
  v_non_uuid_count BIGINT := 0;
  v_unparseable_expiry_count BIGINT := 0;
  v_orphan_user_count BIGINT := 0;
  v_orphan_org_count BIGINT := 0;
  v_dup_scoped_groups BIGINT := 0;
  v_total_rows BIGINT := 0;
  v_policy_count BIGINT := 0;
  v_need_policy_cycle BOOLEAN := FALSE;

  v_saved_policies JSONB := '[]'::jsonb;
  v_pol RECORD;
  v_con RECORD;
  v_idx RECORD;
  v_roles_sql TEXT;
  v_using_sql TEXT;
  v_check_sql TEXT;
BEGIN
  -- 1. Inspect parent tables public.users & public.organizations
  v_users_exists := to_regclass('public.users') IS NOT NULL;
  v_orgs_exists := to_regclass('public.organizations') IS NOT NULL;

  IF v_users_exists THEN
    SELECT a.atttypid::regtype::text
    INTO v_users_id_type
    FROM pg_attribute a
    WHERE a.attrelid = 'public.users'::regclass
      AND a.attname = 'id'
      AND NOT a.attisdropped
      AND a.attnum > 0;

    v_users_id_type := CASE WHEN LOWER(COALESCE(v_users_id_type, 'text')) = 'uuid' THEN 'uuid' ELSE 'text' END;

    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.users'::regclass
        AND c.contype IN ('p', 'u')
        AND array_length(c.conkey, 1) = 1
        AND a.attname = 'id'
    ) INTO v_users_has_unique_id;
  END IF;

  IF v_orgs_exists THEN
    SELECT a.atttypid::regtype::text
    INTO v_orgs_id_type
    FROM pg_attribute a
    WHERE a.attrelid = 'public.organizations'::regclass
      AND a.attname = 'id'
      AND NOT a.attisdropped
      AND a.attnum > 0;

    v_orgs_id_type := CASE WHEN LOWER(COALESCE(v_orgs_id_type, 'text')) = 'uuid' THEN 'uuid' ELSE 'text' END;

    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.organizations'::regclass
        AND c.contype IN ('p', 'u')
        AND array_length(c.conkey, 1) = 1
        AND a.attname = 'id'
    ) INTO v_orgs_has_unique_id;
  END IF;

  RAISE NOTICE '[google_accounts migration] Parent ID types detected: users.id=% (exists=%, unique=%), organizations.id=% (exists=%, unique=%)',
    v_users_id_type, v_users_exists, v_users_has_unique_id, v_orgs_id_type, v_orgs_exists, v_orgs_has_unique_id;

  -- 2. Create public.google_accounts ONLY if missing (using parent-compatible user_id / organization_id types)
  v_table_exists := to_regclass('public.google_accounts') IS NOT NULL;
  IF NOT v_table_exists THEN
    EXECUTE format(
      'CREATE TABLE public.google_accounts (
         id TEXT PRIMARY KEY,
         user_id %s,
         organization_id %s,
         email TEXT NOT NULL,
         access_token TEXT,
         refresh_token TEXT,
         scopes TEXT[] DEFAULT ''{}''::text[],
         expiry_date BIGINT,
         account_type TEXT DEFAULT ''gmail'',
         status TEXT DEFAULT ''CONNECTED'',
         created_at TIMESTAMPTZ DEFAULT NOW(),
         updated_at TIMESTAMPTZ DEFAULT NOW()
       )',
      CASE WHEN v_users_id_type = 'uuid' THEN 'UUID' ELSE 'TEXT' END,
      CASE WHEN v_orgs_id_type = 'uuid' THEN 'UUID' ELSE 'TEXT' END
    );
    RAISE NOTICE '[google_accounts migration] Created missing public.google_accounts table with user_id=% and organization_id=%.',
      v_users_id_type, v_orgs_id_type;
  END IF;

  SELECT COUNT(*) INTO v_total_rows FROM public.google_accounts;
  RAISE NOTICE '[google_accounts migration] Existing row count preserved: %', v_total_rows;

  -- 3. Repair missing `id` column & backfill NULL/empty `id` values non-destructively
  SELECT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.google_accounts'::regclass
      AND attname = 'id'
      AND NOT attisdropped
      AND attnum > 0
  ) INTO v_ga_id_exists;

  IF NOT v_ga_id_exists THEN
    ALTER TABLE public.google_accounts ADD COLUMN id TEXT;
    RAISE NOTICE '[google_accounts migration] Added missing column id (TEXT).';
  END IF;

  SELECT a.atttypid::regtype::text
  INTO v_ga_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.google_accounts'::regclass
    AND a.attname = 'id'
    AND NOT a.attisdropped
    AND a.attnum > 0;

  IF LOWER(COALESCE(v_ga_id_type, 'text')) = 'uuid' THEN
    UPDATE public.google_accounts
    SET id = (
      substr(md5(random()::text || clock_timestamp()::text || ctid::text), 1, 8) || '-' ||
      substr(md5(random()::text || clock_timestamp()::text || ctid::text), 9, 4) || '-4' ||
      substr(md5(random()::text || clock_timestamp()::text || ctid::text), 14, 3) || '-a' ||
      substr(md5(random()::text || clock_timestamp()::text || ctid::text), 18, 3) || '-' ||
      substr(md5(random()::text || clock_timestamp()::text || ctid::text), 21, 12)
    )::uuid
    WHERE id IS NULL;
  ELSIF LOWER(COALESCE(v_ga_id_type, 'text')) IN ('text', 'character varying', 'varchar', 'character', 'bpchar') THEN
    UPDATE public.google_accounts
    SET id = 'ga_migrated_' || md5(
      COALESCE(ctid::text, '') || ':' ||
      random()::text || ':' ||
      clock_timestamp()::text
    )
    WHERE id IS NULL OR BTRIM(id::text) = '';
  ELSE
    -- Numeric/serial or custom id column type: never overwrite existing values; log if NULLs exist
    RAISE NOTICE '[google_accounts migration] Existing id column has type "%"; preserving existing values.', v_ga_id_type;
  END IF;

  -- Reconcile PRIMARY KEY ONLY if table currently lacks one and existing id values are unique & non-null
  SELECT c.contype = 'p',
         ARRAY(
           SELECT a.attname::text
           FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
           JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
           ORDER BY k.ord
         )
  INTO v_has_pk, v_pk_cols
  FROM pg_constraint c
  WHERE c.conrelid = 'public.google_accounts'::regclass
    AND c.contype = 'p'
  LIMIT 1;

  IF NOT COALESCE(v_has_pk, FALSE) THEN
    SELECT
      COUNT(*) FILTER (WHERE id IS NULL OR BTRIM(id::text) = ''),
      COUNT(*) - COUNT(DISTINCT id)
    INTO v_null_id_count, v_dup_id_count
    FROM public.google_accounts;

    IF v_null_id_count = 0 AND v_dup_id_count = 0 THEN
      ALTER TABLE public.google_accounts ALTER COLUMN id SET NOT NULL;
      ALTER TABLE public.google_accounts ADD CONSTRAINT google_accounts_pkey PRIMARY KEY (id);
      RAISE NOTICE '[google_accounts migration] Added validated PRIMARY KEY (id) to public.google_accounts.';
    ELSE
      RAISE NOTICE '[google_accounts migration] Skipped ADD PRIMARY KEY (id): null_ids=%, duplicate_ids=%. Existing rows preserved.',
        v_null_id_count, v_dup_id_count;
    END IF;
  ELSE
    RAISE NOTICE '[google_accounts migration] Existing PRIMARY KEY preserved on columns: %', array_to_string(v_pk_cols, ', ');
  END IF;

  -- 4. Add any remaining missing columns non-destructively (no NOT NULL failures on populated tables)
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.google_accounts'::regclass AND attname = 'user_id' AND NOT attisdropped AND attnum > 0
  ) THEN
    EXECUTE format('ALTER TABLE public.google_accounts ADD COLUMN user_id %s', CASE WHEN v_users_id_type = 'uuid' THEN 'UUID' ELSE 'TEXT' END);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.google_accounts'::regclass AND attname = 'organization_id' AND NOT attisdropped AND attnum > 0
  ) THEN
    EXECUTE format('ALTER TABLE public.google_accounts ADD COLUMN organization_id %s', CASE WHEN v_orgs_id_type = 'uuid' THEN 'UUID' ELSE 'TEXT' END);
  END IF;

  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;
  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS refresh_token TEXT;
  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT '{}'::text[];
  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS expiry_date BIGINT;
  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'gmail';
  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'CONNECTED';
  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.google_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

  -- 5. Inspect current types of user_id & organization_id to determine if type reconciliation is needed
  SELECT t.typname
  INTO v_ga_user_id_type
  FROM pg_attribute a
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE a.attrelid = 'public.google_accounts'::regclass AND a.attname = 'user_id' AND NOT a.attisdropped AND a.attnum > 0;

  SELECT t.typname
  INTO v_ga_org_id_type
  FROM pg_attribute a
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE a.attrelid = 'public.google_accounts'::regclass AND a.attname = 'organization_id' AND NOT a.attisdropped AND a.attnum > 0;

  v_need_policy_cycle := (
    (v_users_exists AND v_ga_user_id_type = 'uuid' AND v_users_id_type = 'text') OR
    (v_users_exists AND v_ga_user_id_type IN ('text', 'varchar', 'bpchar') AND v_users_id_type = 'uuid') OR
    (v_orgs_exists AND v_ga_org_id_type = 'uuid' AND v_orgs_id_type = 'text') OR
    (v_orgs_exists AND v_ga_org_id_type IN ('text', 'varchar', 'bpchar') AND v_orgs_id_type = 'uuid')
  );

  -- Capture and temporarily drop RLS policies on public.google_accounts ONLY if altering user_id/organization_id types
  IF v_need_policy_cycle THEN
    FOR v_pol IN
      SELECT policyname, permissive, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'google_accounts'
    LOOP
      v_saved_policies := v_saved_policies || jsonb_build_array(
        jsonb_build_object(
          'policyname', v_pol.policyname,
          'permissive', v_pol.permissive,
          'cmd', v_pol.cmd,
          'roles', to_jsonb(v_pol.roles),
          'qual', v_pol.qual,
          'with_check', v_pol.with_check
        )
      );
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.google_accounts', v_pol.policyname);
    END LOOP;
  END IF;

  -- 5a. Reconcile user_id type with parent public.users.id safely
  IF v_users_exists AND v_ga_user_id_type = 'uuid' AND v_users_id_type = 'text' THEN
    -- Drop existing FK constraints on user_id before altering type
    FOR v_con IN
      SELECT conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.google_accounts'::regclass AND c.contype = 'f' AND a.attname = 'user_id'
    LOOP
      EXECUTE format('ALTER TABLE public.google_accounts DROP CONSTRAINT IF EXISTS %I', v_con.conname);
    END LOOP;
    ALTER TABLE public.google_accounts ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    v_ga_user_id_type := 'text';
    RAISE NOTICE '[google_accounts migration] Converted google_accounts.user_id UUID -> TEXT to match public.users.id.';
  ELSIF v_users_exists AND v_ga_user_id_type IN ('text', 'varchar', 'bpchar') AND v_users_id_type = 'uuid' THEN
    SELECT COUNT(*)
    INTO v_non_uuid_count
    FROM public.google_accounts
    WHERE user_id IS NOT NULL
      AND BTRIM(user_id::text) <> ''
      AND BTRIM(user_id::text) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    IF v_non_uuid_count = 0 THEN
      FOR v_con IN
        SELECT conname
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = 'public.google_accounts'::regclass AND c.contype = 'f' AND a.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE public.google_accounts DROP CONSTRAINT IF EXISTS %I', v_con.conname);
      END LOOP;
      ALTER TABLE public.google_accounts
        ALTER COLUMN user_id TYPE UUID
        USING CASE WHEN user_id IS NULL OR BTRIM(user_id::text) = '' THEN NULL ELSE BTRIM(user_id::text)::uuid END;
      v_ga_user_id_type := 'uuid';
      RAISE NOTICE '[google_accounts migration] Converted google_accounts.user_id TEXT -> UUID to match public.users.id.';
    ELSE
      RAISE NOTICE '[google_accounts migration] Preserved google_accounts.user_id as TEXT: % existing row(s) contain non-UUID identifiers.', v_non_uuid_count;
    END IF;
  END IF;

  -- 5b. Reconcile organization_id type with parent public.organizations.id safely
  IF v_orgs_exists AND v_ga_org_id_type = 'uuid' AND v_orgs_id_type = 'text' THEN
    FOR v_con IN
      SELECT conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.google_accounts'::regclass AND c.contype = 'f' AND a.attname = 'organization_id'
    LOOP
      EXECUTE format('ALTER TABLE public.google_accounts DROP CONSTRAINT IF EXISTS %I', v_con.conname);
    END LOOP;
    ALTER TABLE public.google_accounts ALTER COLUMN organization_id TYPE TEXT USING organization_id::text;
    v_ga_org_id_type := 'text';
    RAISE NOTICE '[google_accounts migration] Converted google_accounts.organization_id UUID -> TEXT to match public.organizations.id.';
  ELSIF v_orgs_exists AND v_ga_org_id_type IN ('text', 'varchar', 'bpchar') AND v_orgs_id_type = 'uuid' THEN
    SELECT COUNT(*)
    INTO v_non_uuid_count
    FROM public.google_accounts
    WHERE organization_id IS NOT NULL
      AND BTRIM(organization_id::text) <> ''
      AND BTRIM(organization_id::text) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    IF v_non_uuid_count = 0 THEN
      FOR v_con IN
        SELECT conname
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = 'public.google_accounts'::regclass AND c.contype = 'f' AND a.attname = 'organization_id'
      LOOP
        EXECUTE format('ALTER TABLE public.google_accounts DROP CONSTRAINT IF EXISTS %I', v_con.conname);
      END LOOP;
      ALTER TABLE public.google_accounts
        ALTER COLUMN organization_id TYPE UUID
        USING CASE WHEN organization_id IS NULL OR BTRIM(organization_id::text) = '' THEN NULL ELSE BTRIM(organization_id::text)::uuid END;
      v_ga_org_id_type := 'uuid';
      RAISE NOTICE '[google_accounts migration] Converted google_accounts.organization_id TEXT -> UUID to match public.organizations.id.';
    ELSE
      RAISE NOTICE '[google_accounts migration] Preserved google_accounts.organization_id as TEXT: % existing row(s) contain non-UUID identifiers.', v_non_uuid_count;
    END IF;
  END IF;

  -- Restore any saved RLS policies cleanly, normalizing UUID/TEXT operator compatibility
  IF v_need_policy_cycle AND jsonb_array_length(v_saved_policies) > 0 THEN
    FOR i IN 0 .. jsonb_array_length(v_saved_policies) - 1 LOOP
      DECLARE
        p JSONB := v_saved_policies -> i;
        p_name TEXT := p ->> 'policyname';
        p_perm TEXT := CASE WHEN UPPER(COALESCE(p ->> 'permissive', 'PERMISSIVE')) = 'RESTRICTIVE' THEN 'AS RESTRICTIVE' ELSE 'AS PERMISSIVE' END;
        p_cmd TEXT := COALESCE(p ->> 'cmd', 'ALL');
        p_qual TEXT := p ->> 'qual';
        p_check TEXT := p ->> 'with_check';
        p_roles TEXT[];
      BEGIN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p -> 'roles')) INTO p_roles;
        SELECT string_agg(CASE WHEN LOWER(r) = 'public' THEN 'PUBLIC' ELSE quote_ident(r) END, ', ')
        INTO v_roles_sql
        FROM unnest(p_roles) AS r;
        IF COALESCE(v_roles_sql, '') = '' THEN
          v_roles_sql := 'PUBLIC';
        END IF;

        IF p_qual IS NOT NULL THEN
          IF to_regprocedure('public.is_org_member(text)') IS NOT NULL THEN
            p_qual := regexp_replace(p_qual, '\yis_org_member\(\s*organization_id\s*\)', 'is_org_member(organization_id::text)', 'g');
          ELSIF to_regprocedure('public.is_org_member(uuid)') IS NOT NULL THEN
            p_qual := regexp_replace(p_qual, '\yis_org_member\(\s*organization_id\s*\)', 'is_org_member(organization_id::uuid)', 'g');
          END IF;
          p_qual := regexp_replace(p_qual, '\yuser_id\y\s*=\s*\(?\s*auth\.uid\(\)\s*\)?\s*::\s*text\y', 'user_id::text = (auth.uid())::text', 'g');
          p_qual := regexp_replace(p_qual, '\yuser_id\y\s*=\s*auth\.uid\(\)(?!\s*::)', 'user_id::text = (auth.uid())::text', 'g');
          p_qual := regexp_replace(p_qual, '\(?\s*auth\.uid\(\)\s*\)?\s*::\s*text\s*=\s*\yuser_id\y(?!\s*::)', '(auth.uid())::text = user_id::text', 'g');
          p_qual := regexp_replace(p_qual, 'auth\.uid\(\)(?!\s*::)\s*=\s*\yuser_id\y(?!\s*::)', '(auth.uid())::text = user_id::text', 'g');
          p_qual := regexp_replace(p_qual, '\yuser_id\y\s*=\s*\yu\.id\y(?!\s*::)', 'user_id::text = u.id::text', 'g');
          v_using_sql := ' USING (' || p_qual || ')';
        ELSE
          v_using_sql := '';
        END IF;

        IF p_check IS NOT NULL THEN
          IF to_regprocedure('public.is_org_member(text)') IS NOT NULL THEN
            p_check := regexp_replace(p_check, '\yis_org_member\(\s*organization_id\s*\)', 'is_org_member(organization_id::text)', 'g');
          ELSIF to_regprocedure('public.is_org_member(uuid)') IS NOT NULL THEN
            p_check := regexp_replace(p_check, '\yis_org_member\(\s*organization_id\s*\)', 'is_org_member(organization_id::uuid)', 'g');
          END IF;
          p_check := regexp_replace(p_check, '\yuser_id\y\s*=\s*\(?\s*auth\.uid\(\)\s*\)?\s*::\s*text\y', 'user_id::text = (auth.uid())::text', 'g');
          p_check := regexp_replace(p_check, '\yuser_id\y\s*=\s*auth\.uid\(\)(?!\s*::)', 'user_id::text = (auth.uid())::text', 'g');
          p_check := regexp_replace(p_check, '\(?\s*auth\.uid\(\)\s*\)?\s*::\s*text\s*=\s*\yuser_id\y(?!\s*::)', '(auth.uid())::text = user_id::text', 'g');
          p_check := regexp_replace(p_check, 'auth\.uid\(\)(?!\s*::)\s*=\s*\yuser_id\y(?!\s*::)', '(auth.uid())::text = user_id::text', 'g');
          p_check := regexp_replace(p_check, '\yuser_id\y\s*=\s*\yu\.id\y(?!\s*::)', 'user_id::text = u.id::text', 'g');
          v_check_sql := ' WITH CHECK (' || p_check || ')';
        ELSE
          v_check_sql := '';
        END IF;

        EXECUTE format(
          'CREATE POLICY %I ON public.google_accounts %s FOR %s TO %s%s%s',
          p_name, p_perm, p_cmd, v_roles_sql, v_using_sql, v_check_sql
        );
      END;
    END LOOP;
    RAISE NOTICE '[google_accounts migration] Restored % RLS policy/policies after identifier type reconciliation.', jsonb_array_length(v_saved_policies);
  END IF;

  -- 6. Safely reconcile expiry_date -> BIGINT (epoch milliseconds)
  SELECT t.typname
  INTO v_ga_expiry_type
  FROM pg_attribute a
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE a.attrelid = 'public.google_accounts'::regclass AND a.attname = 'expiry_date' AND NOT a.attisdropped AND a.attnum > 0;

  IF v_ga_expiry_type IN ('timestamptz', 'timestamp') THEN
    ALTER TABLE public.google_accounts ALTER COLUMN expiry_date DROP DEFAULT;
    ALTER TABLE public.google_accounts
      ALTER COLUMN expiry_date TYPE BIGINT
      USING CASE
        WHEN expiry_date IS NULL THEN NULL
        ELSE FLOOR(EXTRACT(EPOCH FROM expiry_date) * 1000)::BIGINT
      END;
    RAISE NOTICE '[google_accounts migration] Converted expiry_date (%) -> BIGINT epoch ms safely.', v_ga_expiry_type;
  ELSIF v_ga_expiry_type IN ('int2', 'int4', 'numeric', 'float4', 'float8') THEN
    ALTER TABLE public.google_accounts ALTER COLUMN expiry_date DROP DEFAULT;
    ALTER TABLE public.google_accounts
      ALTER COLUMN expiry_date TYPE BIGINT
      USING CASE WHEN expiry_date IS NULL THEN NULL ELSE ROUND(expiry_date)::BIGINT END;
    RAISE NOTICE '[google_accounts migration] Converted expiry_date (%) -> BIGINT safely.', v_ga_expiry_type;
  ELSIF v_ga_expiry_type IN ('text', 'varchar', 'bpchar') THEN
    SELECT COUNT(*)
    INTO v_unparseable_expiry_count
    FROM public.google_accounts
    WHERE expiry_date IS NOT NULL
      AND BTRIM(expiry_date::text) <> ''
      AND pg_temp._sp_safe_expiry_ms(expiry_date::text) IS NULL;

    IF v_unparseable_expiry_count > 0 THEN
      RAISE NOTICE '[google_accounts migration] % row(s) had unparseable text expiry_date values and were safely normalized to NULL (rows & tokens preserved).',
        v_unparseable_expiry_count;
    END IF;

    ALTER TABLE public.google_accounts ALTER COLUMN expiry_date DROP DEFAULT;
    ALTER TABLE public.google_accounts
      ALTER COLUMN expiry_date TYPE BIGINT
      USING pg_temp._sp_safe_expiry_ms(expiry_date::text);
    RAISE NOTICE '[google_accounts migration] Converted expiry_date (%) -> BIGINT epoch ms safely.', v_ga_expiry_type;
  ELSIF v_ga_expiry_type <> 'int8' THEN
    RAISE NOTICE '[google_accounts migration] Unexpected expiry_date type "%" left unchanged for manual review.', v_ga_expiry_type;
  END IF;

  -- 7. Safely reconcile scopes -> TEXT[]
  SELECT t.typname
  INTO v_ga_scopes_type
  FROM pg_attribute a
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE a.attrelid = 'public.google_accounts'::regclass AND a.attname = 'scopes' AND NOT a.attisdropped AND a.attnum > 0;

  IF v_ga_scopes_type = '_varchar' THEN
    ALTER TABLE public.google_accounts ALTER COLUMN scopes DROP DEFAULT;
    ALTER TABLE public.google_accounts ALTER COLUMN scopes TYPE TEXT[] USING COALESCE(scopes::text[], '{}'::text[]);
    ALTER TABLE public.google_accounts ALTER COLUMN scopes SET DEFAULT '{}'::text[];
    RAISE NOTICE '[google_accounts migration] Converted scopes VARCHAR[] -> TEXT[].';
  ELSIF v_ga_scopes_type IN ('text', 'varchar', 'bpchar') THEN
    ALTER TABLE public.google_accounts ALTER COLUMN scopes DROP DEFAULT;
    ALTER TABLE public.google_accounts
      ALTER COLUMN scopes TYPE TEXT[]
      USING pg_temp._sp_safe_parse_scopes(scopes::text);
    ALTER TABLE public.google_accounts ALTER COLUMN scopes SET DEFAULT '{}'::text[];
    RAISE NOTICE '[google_accounts migration] Converted scopes (%) -> TEXT[] safely.', v_ga_scopes_type;
  ELSIF v_ga_scopes_type IN ('jsonb', 'json') THEN
    ALTER TABLE public.google_accounts ALTER COLUMN scopes DROP DEFAULT;
    ALTER TABLE public.google_accounts
      ALTER COLUMN scopes TYPE TEXT[]
      USING pg_temp._sp_safe_parse_scopes(scopes::text);
    ALTER TABLE public.google_accounts ALTER COLUMN scopes SET DEFAULT '{}'::text[];
    RAISE NOTICE '[google_accounts migration] Converted scopes (%) -> TEXT[] safely.', v_ga_scopes_type;
  ELSIF v_ga_scopes_type = '_text' THEN
    ALTER TABLE public.google_accounts ALTER COLUMN scopes SET DEFAULT '{}'::text[];
  ELSE
    RAISE NOTICE '[google_accounts migration] Unexpected scopes type "%" left unchanged for manual review.', v_ga_scopes_type;
  END IF;

  -- Ensure non-destructive defaults on account_type / status / timestamps
  ALTER TABLE public.google_accounts ALTER COLUMN account_type SET DEFAULT 'gmail';
  ALTER TABLE public.google_accounts ALTER COLUMN status SET DEFAULT 'CONNECTED';
  ALTER TABLE public.google_accounts ALTER COLUMN created_at SET DEFAULT NOW();
  ALTER TABLE public.google_accounts ALTER COLUMN updated_at SET DEFAULT NOW();

  -- 8. Reconcile Foreign Keys ONLY after validating existing data (0 orphans and compatible types)
  IF v_users_exists AND v_users_has_unique_id AND v_ga_user_id_type = v_users_id_type THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.google_accounts'::regclass
        AND c.contype = 'f'
        AND c.confrelid = 'public.users'::regclass
        AND a.attname = 'user_id'
    ) THEN
      SELECT COUNT(*)
      INTO v_orphan_user_count
      FROM public.google_accounts g
      WHERE g.user_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = g.user_id);

      IF v_orphan_user_count = 0 THEN
        ALTER TABLE public.google_accounts
          ADD CONSTRAINT google_accounts_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        RAISE NOTICE '[google_accounts migration] Added validated FK google_accounts_user_id_fkey.';
      ELSE
        RAISE NOTICE '[google_accounts migration] Skipped FK google_accounts_user_id_fkey: % orphaned user_id row(s) found. Existing rows preserved.', v_orphan_user_count;
      END IF;
    END IF;
  END IF;

  IF v_orgs_exists AND v_orgs_has_unique_id AND v_ga_org_id_type = v_orgs_id_type THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.google_accounts'::regclass
        AND c.contype = 'f'
        AND c.confrelid = 'public.organizations'::regclass
        AND a.attname = 'organization_id'
    ) THEN
      SELECT COUNT(*)
      INTO v_orphan_org_count
      FROM public.google_accounts g
      WHERE g.organization_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = g.organization_id);

      IF v_orphan_org_count = 0 THEN
        ALTER TABLE public.google_accounts
          ADD CONSTRAINT google_accounts_organization_id_fkey
          FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
        RAISE NOTICE '[google_accounts migration] Added validated FK google_accounts_organization_id_fkey.';
      ELSE
        RAISE NOTICE '[google_accounts migration] Skipped FK google_accounts_organization_id_fkey: % orphaned organization_id row(s) found. Existing rows preserved.', v_orphan_org_count;
      END IF;
    END IF;
  END IF;

  -- 9. Audit existing duplicates and warn about any overly broad unique indexes (no destructive unique index added)
  SELECT COUNT(*)
  INTO v_dup_scoped_groups
  FROM (
    SELECT user_id, organization_id, LOWER(email), LOWER(COALESCE(account_type, 'gmail'))
    FROM public.google_accounts
    GROUP BY user_id, organization_id, LOWER(email), LOWER(COALESCE(account_type, 'gmail'))
    HAVING COUNT(*) > 1
  ) dup_groups;

  IF v_dup_scoped_groups > 0 THEN
    RAISE NOTICE '[google_accounts migration] Detected % duplicate scoped (user_id, organization_id, email, account_type) group(s); all records preserved and no unique index enforced.',
      v_dup_scoped_groups;
  END IF;

  FOR v_idx IN
    SELECT i.relname AS index_name, pg_get_indexdef(idx.indexrelid) AS index_def
    FROM pg_index idx
    JOIN pg_class i ON i.oid = idx.indexrelid
    WHERE idx.indrelid = 'public.google_accounts'::regclass
      AND idx.indisunique = TRUE
      AND idx.indisprimary = FALSE
  LOOP
    RAISE NOTICE '[google_accounts migration] Existing non-PK unique index detected: % -> %', v_idx.index_name, v_idx.index_def;
  END LOOP;

  -- 10. Ensure Row Level Security & baseline tenant-ownership policies remain intact
  ALTER TABLE public.google_accounts ENABLE ROW LEVEL SECURITY;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'google_accounts';

  IF v_policy_count = 0 THEN
    IF to_regprocedure('public.is_org_member(text)') IS NOT NULL THEN
      CREATE POLICY google_accounts_select ON public.google_accounts
        FOR SELECT TO authenticated
        USING (
          (
            user_id::text = auth.uid()::text
            OR user_id::text IN (SELECT u.id::text FROM public.users u WHERE u.id::text = auth.uid()::text)
          )
          AND public.is_org_member(organization_id::text)
        );

      CREATE POLICY google_accounts_insert ON public.google_accounts
        FOR INSERT TO authenticated
        WITH CHECK (
          (
            user_id::text = auth.uid()::text
            OR user_id::text IN (SELECT u.id::text FROM public.users u WHERE u.id::text = auth.uid()::text)
          )
          AND public.is_org_member(organization_id::text)
        );

      CREATE POLICY google_accounts_update ON public.google_accounts
        FOR UPDATE TO authenticated
        USING (
          (
            user_id::text = auth.uid()::text
            OR user_id::text IN (SELECT u.id::text FROM public.users u WHERE u.id::text = auth.uid()::text)
          )
          AND public.is_org_member(organization_id::text)
        )
        WITH CHECK (
          (
            user_id::text = auth.uid()::text
            OR user_id::text IN (SELECT u.id::text FROM public.users u WHERE u.id::text = auth.uid()::text)
          )
          AND public.is_org_member(organization_id::text)
        );

      CREATE POLICY google_accounts_delete ON public.google_accounts
        FOR DELETE TO authenticated
        USING (
          (
            user_id::text = auth.uid()::text
            OR user_id::text IN (SELECT u.id::text FROM public.users u WHERE u.id::text = auth.uid()::text)
          )
          AND public.is_org_member(organization_id::text)
        );
    ELSE
      CREATE POLICY google_accounts_owner_isolation ON public.google_accounts
        FOR ALL TO authenticated
        USING (user_id::text = auth.uid()::text)
        WITH CHECK (user_id::text = auth.uid()::text);
    END IF;
    RAISE NOTICE '[google_accounts migration] Enabled RLS and installed default owner + tenant policies on public.google_accounts.';
  END IF;
END $$;

-- 11. Non-unique scoped lookup indexes (safe even with historical duplicates, Gmail + Calendar pairs, or multi-tenant emails)
CREATE INDEX IF NOT EXISTS idx_google_accounts_user_org_email_type
    ON public.google_accounts(user_id, organization_id, email, account_type);

CREATE INDEX IF NOT EXISTS idx_google_accounts_user_org_lower_email_type
    ON public.google_accounts(user_id, organization_id, LOWER(email), LOWER(COALESCE(account_type, 'gmail')));

CREATE INDEX IF NOT EXISTS idx_google_accounts_org_email
    ON public.google_accounts(organization_id, email);

CREATE INDEX IF NOT EXISTS idx_google_accounts_organization_id
    ON public.google_accounts(organization_id);

CREATE INDEX IF NOT EXISTS idx_google_accounts_user_id
    ON public.google_accounts(user_id);

-- Clean up session-local conversion helpers explicitly
DROP FUNCTION IF EXISTS pg_temp._sp_safe_expiry_ms(TEXT);
DROP FUNCTION IF EXISTS pg_temp._sp_safe_parse_scopes(TEXT);
