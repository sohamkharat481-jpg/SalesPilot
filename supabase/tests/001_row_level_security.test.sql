-- =========================================================================
-- SUPABASE CLI / pgTAP STANDARD TEST SUITE
-- Path: supabase/tests/001_row_level_security.test.sql
-- Description: Standard pgTAP automated test file for Supabase CLI (supabase test db)
-- Safety: Enclosed in transaction with ROLLBACK.
-- =========================================================================

BEGIN;

-- Load pgTAP extension if available in the database
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(41);

-- -------------------------------------------------------------------------
-- SETUP MOCK AUTH CONTEXT & TEST FIXTURES
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.set_test_auth(user_uuid text, role_name text DEFAULT 'authenticated')
RETURNS void AS $$
BEGIN
    PERFORM set_config('request.jwt.claim.sub', user_uuid, true);
    PERFORM set_config('role', role_name, true);
END;
$$ LANGUAGE plpgsql;

-- Seed Organizations
INSERT INTO public.organizations (id, name, owner_id)
VALUES 
    ('org_salespilot_lifetime', 'SalesPilot Lifetime Org', 'usr_81927391'),
    ('org_pordigy_enterprise', 'Pordigy Enterprise Org', 'usr_pordigy_auth_01')
ON CONFLICT (id) DO NOTHING;

-- Seed Users
INSERT INTO public.users (id, email, full_name, role, organization_id)
VALUES
    ('usr_81927391', 'soham@salespilot.io', 'Soham Kharat', 'OWNER', 'org_salespilot_lifetime'),
    ('usr_test_admin_a', 'admin.a@salespilot.io', 'Admin A', 'ADMIN', 'org_salespilot_lifetime'),
    ('usr_test_member_a', 'member.a@salespilot.io', 'Member A', 'MEMBER', 'org_salespilot_lifetime'),
    ('usr_pordigy_auth_01', 'pordigy@pordigy.io', 'Pordigy User', 'OWNER', 'org_pordigy_enterprise'),
    ('usr_test_member_b', 'member.b@pordigy.io', 'Member B', 'MEMBER', 'org_pordigy_enterprise')
ON CONFLICT (id) DO NOTHING;

-- Seed Memberships
INSERT INTO public.organization_members (id, organization_id, user_id, role, status)
VALUES
    ('mem_soham', 'org_salespilot_lifetime', 'usr_81927391', 'OWNER', 'ACTIVE'),
    ('mem_admin_a', 'org_salespilot_lifetime', 'usr_test_admin_a', 'ADMIN', 'ACTIVE'),
    ('mem_member_a', 'org_salespilot_lifetime', 'usr_test_member_a', 'MEMBER', 'ACTIVE'),
    ('mem_pordigy', 'org_pordigy_enterprise', 'usr_pordigy_auth_01', 'OWNER', 'ACTIVE'),
    ('mem_member_b', 'org_pordigy_enterprise', 'usr_test_member_b', 'MEMBER', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Seed Pipeline & Stages
INSERT INTO public.pipelines (id, organization_id, name)
VALUES 
    ('pipe_sp_01', 'org_salespilot_lifetime', 'Default Sales Pipeline'),
    ('pipe_pd_01', 'org_pordigy_enterprise', 'Pordigy Sales Pipeline')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pipeline_stages (id, pipeline_id, name, "order")
VALUES 
    ('stage_sp_01', 'pipe_sp_01', 'Discovery Stage SP', 1),
    ('stage_pd_01', 'pipe_pd_01', 'Discovery Stage PD', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Business Records (Leads, Campaigns, Deals, Appointments)
INSERT INTO public.leads (id, organization_id, first_name, last_name, email)
VALUES
    ('lead_sp_01', 'org_salespilot_lifetime', 'Alice', 'Sales', 'alice@customer.com'),
    ('lead_pd_01', 'org_pordigy_enterprise', 'Bob', 'Pordigy', 'bob@prospect.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.campaigns (id, organization_id, name)
VALUES
    ('camp_sp_01', 'org_salespilot_lifetime', 'Outreach SP'),
    ('camp_pd_01', 'org_pordigy_enterprise', 'Outreach PD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deals (id, organization_id, title, value)
VALUES
    ('deal_sp_01', 'org_salespilot_lifetime', 'Big Deal SP', 50000),
    ('deal_pd_01', 'org_pordigy_enterprise', 'Big Deal PD', 80000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.appointments (id, organization_id, title)
VALUES
    ('appt_sp_01', 'org_salespilot_lifetime', 'Demo Meeting SP'),
    ('appt_pd_01', 'org_pordigy_enterprise', 'Demo Meeting PD')
ON CONFLICT (id) DO NOTHING;

-- Seed Sensitive Data (Google Accounts, API Keys, Billing, Audit Logs, Sessions)
INSERT INTO public.google_accounts (id, user_id, organization_id, email, access_token, refresh_token)
VALUES
    ('ga_soham', 'usr_81927391', 'org_salespilot_lifetime', 'soham@salespilot.io', 'token_soham_secret', 'refresh_soham'),
    ('ga_pordigy', 'usr_pordigy_auth_01', 'org_pordigy_enterprise', 'pordigy@pordigy.io', 'token_pordigy_secret', 'refresh_pordigy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.api_keys (id, organization_id, name, key_hash)
VALUES
    ('key_sp_01', 'org_salespilot_lifetime', 'Production Key SP', 'secret_hash_sp'),
    ('key_pd_01', 'org_pordigy_enterprise', 'Production Key PD', 'secret_hash_pd')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.billing (id, organization_id, plan, amount)
VALUES
    ('bill_sp_01', 'org_salespilot_lifetime', 'ENTERPRISE', 999),
    ('bill_pd_01', 'org_pordigy_enterprise', 'STARTER', 299)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (id, organization_id, status, plan)
VALUES
    ('sub_sp_01', 'org_salespilot_lifetime', 'ACTIVE', 'ENTERPRISE'),
    ('sub_pd_01', 'org_pordigy_enterprise', 'ACTIVE', 'STARTER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_logs (id, organization_id, user_id, action)
VALUES
    ('log_sp_01', 'org_salespilot_lifetime', 'usr_81927391', 'USER_LOGIN'),
    ('log_pd_01', 'org_pordigy_enterprise', 'usr_pordigy_auth_01', 'USER_LOGIN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sessions (id, user_id, token, expires_at)
VALUES
    ('sess_soham', 'usr_81927391', 'token_soham_sess', NOW() + INTERVAL '1 day'),
    ('sess_pordigy', 'usr_pordigy_auth_01', 'token_pordigy_sess', NOW() + INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- TESTS 1-4: ANONYMOUS ACCESS RESTRICTIONS
-- =========================================================================
SELECT pg_temp.set_test_auth(NULL, 'anon');

-- Test 1: Anonymous SELECT
SELECT is_empty(
    'SELECT * FROM public.leads',
    'Test 1: Anonymous user SELECT on leads must return 0 rows'
);

-- Test 2: Anonymous INSERT
SELECT throws_ok(
    'INSERT INTO public.leads (id, organization_id, email) VALUES (''lead_anon'', ''org_salespilot_lifetime'', ''anon@test.com'')',
    NULL,
    'Test 2: Anonymous user INSERT on leads must be denied'
);

-- Test 3: Anonymous UPDATE
SELECT is_empty(
    'UPDATE public.leads SET first_name = ''Hacked'' WHERE id = ''lead_sp_01'' RETURNING id',
    'Test 3: Anonymous user UPDATE on leads must affect 0 rows'
);

-- Test 4: Anonymous DELETE
SELECT is_empty(
    'DELETE FROM public.leads WHERE id = ''lead_sp_01'' RETURNING id',
    'Test 4: Anonymous user DELETE on leads must affect 0 rows'
);

-- =========================================================================
-- TESTS 5-12: SOHAM TENANT ISOLATION
-- =========================================================================
SELECT pg_temp.set_test_auth('usr_81927391', 'authenticated');

-- Test 5: Soham -> own organization SELECT
SELECT results_eq(
    'SELECT id FROM public.leads WHERE id = ''lead_sp_01''',
    ARRAY['lead_sp_01'],
    'Test 5: Soham can read leads in own organization'
);

-- Test 6: Soham -> Pordigy organization SELECT
SELECT is_empty(
    'SELECT id FROM public.leads WHERE id = ''lead_pd_01''',
    'Test 6: Soham cannot read leads in Pordigy organization'
);

-- Test 7: Soham -> create in own organization
SELECT lives_ok(
    'INSERT INTO public.leads (id, organization_id, email) VALUES (''lead_sp_02'', ''org_salespilot_lifetime'', ''sp2@test.com'')',
    'Test 7: Soham can create lead in own organization'
);

-- Test 8: Soham -> create in Pordigy organization
SELECT throws_ok(
    'INSERT INTO public.leads (id, organization_id, email) VALUES (''lead_pd_bad'', ''org_pordigy_enterprise'', ''leak@test.com'')',
    NULL,
    'Test 8: Soham cannot create lead in Pordigy organization'
);

-- Test 9: Soham -> update in own organization
SELECT results_eq(
    'UPDATE public.leads SET first_name = ''Alice Updated'' WHERE id = ''lead_sp_01'' RETURNING id',
    ARRAY['lead_sp_01'],
    'Test 9: Soham can update lead in own organization'
);

-- Test 10: Soham -> update Pordigy record
SELECT is_empty(
    'UPDATE public.leads SET first_name = ''Tampered'' WHERE id = ''lead_pd_01'' RETURNING id',
    'Test 10: Soham cannot update lead in Pordigy organization'
);

-- Test 11: Soham -> delete in own organization
SELECT results_eq(
    'DELETE FROM public.leads WHERE id = ''lead_sp_02'' RETURNING id',
    ARRAY['lead_sp_02'],
    'Test 11: Soham can delete lead in own organization'
);

-- Test 12: Soham -> delete in Pordigy organization
SELECT is_empty(
    'DELETE FROM public.leads WHERE id = ''lead_pd_01'' RETURNING id',
    'Test 12: Soham cannot delete lead in Pordigy organization'
);

-- =========================================================================
-- TESTS 13-20: PORDIGY TENANT ISOLATION
-- =========================================================================
SELECT pg_temp.set_test_auth('usr_pordigy_auth_01', 'authenticated');

-- Test 13: Pordigy -> own organization SELECT
SELECT results_eq(
    'SELECT id FROM public.leads WHERE id = ''lead_pd_01''',
    ARRAY['lead_pd_01'],
    'Test 13: Pordigy can read leads in own organization'
);

-- Test 14: Pordigy -> Soham organization SELECT
SELECT is_empty(
    'SELECT id FROM public.leads WHERE id = ''lead_sp_01''',
    'Test 14: Pordigy cannot read leads in Soham organization'
);

-- Test 15: Pordigy -> create in own organization
SELECT lives_ok(
    'INSERT INTO public.leads (id, organization_id, email) VALUES (''lead_pd_02'', ''org_pordigy_enterprise'', ''pd2@test.com'')',
    'Test 15: Pordigy can create lead in own organization'
);

-- Test 16: Pordigy -> create in Soham organization
SELECT throws_ok(
    'INSERT INTO public.leads (id, organization_id, email) VALUES (''lead_sp_bad'', ''org_salespilot_lifetime'', ''leak@test.com'')',
    NULL,
    'Test 16: Pordigy cannot create lead in Soham organization'
);

-- Test 17: Pordigy -> update in own organization
SELECT results_eq(
    'UPDATE public.leads SET first_name = ''Bob Updated'' WHERE id = ''lead_pd_01'' RETURNING id',
    ARRAY['lead_pd_01'],
    'Test 17: Pordigy can update lead in own organization'
);

-- Test 18: Pordigy -> update Soham record
SELECT is_empty(
    'UPDATE public.leads SET first_name = ''Tampered'' WHERE id = ''lead_sp_01'' RETURNING id',
    'Test 18: Pordigy cannot update lead in Soham organization'
);

-- Test 19: Pordigy -> delete in own organization
SELECT results_eq(
    'DELETE FROM public.leads WHERE id = ''lead_pd_02'' RETURNING id',
    ARRAY['lead_pd_02'],
    'Test 19: Pordigy can delete lead in own organization'
);

-- Test 20: Pordigy -> delete Soham record
SELECT is_empty(
    'DELETE FROM public.leads WHERE id = ''lead_sp_01'' RETURNING id',
    'Test 20: Pordigy cannot delete lead in Soham organization'
);

-- =========================================================================
-- TESTS 21-27: MEMBERSHIP & PRIVILEGE ESCALATION
-- =========================================================================
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');

-- Test 21: MEMBER -> add member -> DENY
SELECT throws_ok(
    'INSERT INTO public.organization_members (id, organization_id, user_id, role) VALUES (''mem_esc_1'', ''org_salespilot_lifetime'', ''usr_pordigy_auth_01'', ''MEMBER'')',
    NULL,
    'Test 21: MEMBER cannot add a member to organization'
);

-- Test 22: MEMBER -> change role -> DENY
SELECT throws_ok(
    'UPDATE public.organization_members SET role = ''OWNER'' WHERE user_id = ''usr_test_member_a''',
    NULL,
    'Test 22: MEMBER cannot escalate own or other role'
);

-- Test 23: MEMBER -> remove member -> DENY
SELECT is_empty(
    'DELETE FROM public.organization_members WHERE user_id = ''usr_81927391'' RETURNING id',
    'Test 23: MEMBER cannot delete organization owner or member'
);

-- Test 24: ADMIN -> permitted membership operation -> ALLOW
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');
SELECT lives_ok(
    'INSERT INTO public.organization_members (id, organization_id, user_id, role) VALUES (''mem_new_rep'', ''org_salespilot_lifetime'', ''usr_new_rep_tmp'', ''MEMBER'')',
    'Test 24: ADMIN can add a regular MEMBER'
);

-- Test 25: MEMBER -> assign OWNER role -> DENY (Already verified in 22)
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');
SELECT throws_ok(
    'INSERT INTO public.organization_members (id, organization_id, user_id, role) VALUES (''mem_bad_own'', ''org_salespilot_lifetime'', ''usr_some_rep'', ''OWNER'')',
    NULL,
    'Test 25: MEMBER cannot assign OWNER role'
);

-- Test 26: ADMIN -> assign OWNER role -> DENY
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');
SELECT throws_ok(
    'UPDATE public.organization_members SET role = ''OWNER'' WHERE user_id = ''usr_test_admin_a''',
    NULL,
    'Test 26: ADMIN cannot promote self or others to OWNER'
);

-- Test 27: OWNER -> owner-level membership operation -> ALLOW
SELECT pg_temp.set_test_auth('usr_81927391', 'authenticated');
SELECT results_eq(
    'UPDATE public.organization_members SET role = ''ADMIN'' WHERE user_id = ''usr_test_member_a'' RETURNING id',
    ARRAY['mem_member_a'],
    'Test 27: OWNER can change member roles'
);

-- =========================================================================
-- TESTS 28-33: ORGANIZATION OWNERSHIP & DELETION
-- =========================================================================
-- Test 28: MEMBER -> change owner_id -> DENY
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');
SELECT throws_ok(
    'UPDATE public.organizations SET owner_id = ''usr_test_member_a'' WHERE id = ''org_salespilot_lifetime''',
    NULL,
    'Test 28: MEMBER cannot change organization owner_id'
);

-- Test 29: ADMIN -> change owner_id -> DENY
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');
SELECT throws_ok(
    'UPDATE public.organizations SET owner_id = ''usr_test_admin_a'' WHERE id = ''org_salespilot_lifetime''',
    NULL,
    'Test 29: ADMIN cannot transfer organization owner_id'
);

-- Test 30: OWNER -> permitted ownership update -> ALLOW
SELECT pg_temp.set_test_auth('usr_81927391', 'authenticated');
SELECT results_eq(
    'UPDATE public.organizations SET name = ''SalesPilot Pro Workspace'' WHERE id = ''org_salespilot_lifetime'' RETURNING id',
    ARRAY['org_salespilot_lifetime'],
    'Test 30: OWNER can update organization details'
);

-- Test 31: MEMBER -> delete organization -> DENY
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');
SELECT is_empty(
    'DELETE FROM public.organizations WHERE id = ''org_salespilot_lifetime'' RETURNING id',
    'Test 31: MEMBER cannot delete organization'
);

-- Test 32: ADMIN -> delete organization -> DENY
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');
SELECT is_empty(
    'DELETE FROM public.organizations WHERE id = ''org_salespilot_lifetime'' RETURNING id',
    'Test 32: ADMIN cannot delete organization'
);

-- Test 33: OWNER -> delete organization -> ALLOW
SELECT pg_temp.set_test_auth('usr_81927391', 'authenticated');
SELECT results_eq(
    'DELETE FROM public.organizations WHERE id = ''org_salespilot_lifetime'' RETURNING id',
    ARRAY['org_salespilot_lifetime'],
    'Test 33: OWNER can delete organization'
);

-- Recreate SalesPilot org for subsequent tests
INSERT INTO public.organizations (id, name, owner_id)
VALUES ('org_salespilot_lifetime', 'SalesPilot Recreated Org', 'usr_81927391')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- TESTS 34-41: SENSITIVE DATA & HELPER ISOLATION
-- =========================================================================
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');

-- Test 34: Teammate -> another user google_accounts -> DENY
SELECT is_empty(
    'SELECT access_token FROM public.google_accounts WHERE user_id = ''usr_81927391''',
    'Test 34: Member cannot see teammate google account tokens'
);

-- Test 35: User -> own google_accounts -> ALLOW
SELECT pg_temp.set_test_auth('usr_81927391', 'authenticated');
SELECT results_eq(
    'SELECT access_token FROM public.google_accounts WHERE user_id = ''usr_81927391''',
    ARRAY['token_soham_secret'],
    'Test 35: User can see own google account tokens'
);

-- Test 36: MEMBER -> API keys -> DENY
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');
SELECT is_empty(
    'SELECT id FROM public.api_keys WHERE organization_id = ''org_salespilot_lifetime''',
    'Test 36: Ordinary member cannot view API keys'
);

-- Test 37: ADMIN/OWNER -> API keys -> ALLOW
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');
SELECT results_eq(
    'SELECT id FROM public.api_keys WHERE organization_id = ''org_salespilot_lifetime''',
    ARRAY['key_sp_01'],
    'Test 37: ADMIN can view organization API keys'
);

-- Test 38: MEMBER -> billing mutation -> DENY
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');
SELECT throws_ok(
    'INSERT INTO public.billing (id, organization_id, plan, amount) VALUES (''bill_bad'', ''org_salespilot_lifetime'', ''ENTERPRISE'', 100)',
    NULL,
    'Test 38: MEMBER cannot mutate billing'
);

-- Test 39: ADMIN/OWNER -> billing mutation -> ALLOW
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');
SELECT lives_ok(
    'INSERT INTO public.billing (id, organization_id, plan, amount) VALUES (''bill_adm'', ''org_salespilot_lifetime'', ''ENTERPRISE'', 100)',
    'Test 39: ADMIN can mutate billing'
);

-- Test 40: Audit log UPDATE -> DENY
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');
SELECT is_empty(
    'UPDATE public.audit_logs SET action = ''TAMPERED'' WHERE id = ''log_sp_01'' RETURNING id',
    'Test 40: Audit logs are immutable (UPDATE disallowed)'
);

-- Test 41: Pipeline Stage inherits organization tenant isolation
SELECT results_eq(
    'SELECT id FROM public.pipeline_stages WHERE id = ''stage_sp_01''',
    ARRAY['stage_sp_01'],
    'Test 41: Pipeline stages inherit organization isolation from pipelines'
);

SELECT * FROM finish();
ROLLBACK;
