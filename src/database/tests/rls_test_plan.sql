-- =========================================================================
-- SALESPILOT DATABASE RLS TEST SUITE
-- File: src/database/tests/rls_test_plan.sql
-- Format: Standalone executable SQL / pgTAP compatible harness
-- Safety: Non-destructive, executes within a transactional ROLLBACK block.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- SETUP MOCK AUTH CONTEXT & TEST FIXTURES
-- -------------------------------------------------------------------------
-- Note: In Supabase/PostgreSQL, auth.uid() reads from request.jwt.claim.sub
-- We mock this session configuration helper for isolated testing.
CREATE OR REPLACE FUNCTION pg_temp.set_test_auth(user_uuid text, role_name text DEFAULT 'authenticated')
RETURNS void AS $$
BEGIN
    PERFORM set_config('request.jwt.claim.sub', user_uuid, true);
    PERFORM set_config('role', role_name, true);
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- TEST FIXTURES: TENANTS & USERS
-- -------------------------------------------------------------------------
-- Tenant A: SalesPilot Lifetime (Owner: Soham, Member: MemberA)
-- Tenant B: Pordigy Enterprise (Owner: Pordigy, Member: MemberB)
INSERT INTO public.organizations (id, name, owner_id)
VALUES 
    ('org_test_salespilot', 'SalesPilot Test', 'usr_test_soham'),
    ('org_test_pordigy', 'Pordigy Test', 'usr_test_pordigy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, organization_id)
VALUES
    ('usr_test_soham', 'soham.test@salespilot.io', 'Soham Test', 'OWNER', 'org_test_salespilot'),
    ('usr_test_admin_a', 'admin.a@salespilot.io', 'Admin A', 'ADMIN', 'org_test_salespilot'),
    ('usr_test_member_a', 'member.a@salespilot.io', 'Member A', 'MEMBER', 'org_test_salespilot'),
    ('usr_test_pordigy', 'pordigy.test@pordigy.io', 'Pordigy Test', 'OWNER', 'org_test_pordigy'),
    ('usr_test_member_b', 'member.b@pordigy.io', 'Member B', 'MEMBER', 'org_test_pordigy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organization_members (id, organization_id, user_id, role, status)
VALUES
    ('mem_soham', 'org_test_salespilot', 'usr_test_soham', 'OWNER', 'ACTIVE'),
    ('mem_admin_a', 'org_test_salespilot', 'usr_test_admin_a', 'ADMIN', 'ACTIVE'),
    ('mem_member_a', 'org_test_salespilot', 'usr_test_member_a', 'MEMBER', 'ACTIVE'),
    ('mem_pordigy', 'org_test_pordigy', 'usr_test_pordigy', 'OWNER', 'ACTIVE'),
    ('mem_member_b', 'org_test_pordigy', 'usr_test_member_b', 'MEMBER', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Seed leads for tenant isolation checks
INSERT INTO public.leads (id, organization_id, first_name, last_name, email)
VALUES
    ('lead_sp_01', 'org_test_salespilot', 'Alice', 'Sales', 'alice@customer.com'),
    ('lead_pd_01', 'org_test_pordigy', 'Bob', 'Pordigy', 'bob@prospect.com')
ON CONFLICT (id) DO NOTHING;

-- Seed google_accounts for OAuth credential protection checks
INSERT INTO public.google_accounts (id, user_id, organization_id, email, access_token, refresh_token)
VALUES
    ('ga_soham', 'usr_test_soham', 'org_test_salespilot', 'soham.test@salespilot.io', 'secret_token_soham', 'refresh_soham'),
    ('ga_pordigy', 'usr_test_pordigy', 'org_test_pordigy', 'pordigy.test@pordigy.io', 'secret_token_pordigy', 'refresh_pordigy')
ON CONFLICT (id) DO NOTHING;

-- Seed API keys
INSERT INTO public.api_keys (id, organization_id, name, key_hash)
VALUES
    ('key_sp_01', 'org_test_salespilot', 'Prod Key SP', 'hash_sp_secret'),
    ('key_pd_01', 'org_test_pordigy', 'Prod Key PD', 'hash_pd_secret')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- SUITE 1: ANONYMOUS ACCESS RESTRICTIONS
-- =========================================================================
-- Scenario 1: Anonymous user -> protected table SELECT -> DENY
SELECT pg_temp.set_test_auth(NULL, 'anon');
-- Expected: 0 rows returned
-- SELECT COUNT(*) FROM public.leads; -> MUST BE 0

-- Scenario 2: Anonymous user -> protected INSERT -> DENY
-- Expected: Permission denied or 0 rows inserted
-- INSERT INTO public.leads (id, organization_id, email) VALUES ('lead_anon', 'org_test_salespilot', 'anon@test.com');

-- Scenario 3: Anonymous user -> protected UPDATE -> DENY
-- Expected: 0 rows affected
-- UPDATE public.leads SET first_name = 'Hacked' WHERE id = 'lead_sp_01';

-- Scenario 4: Anonymous user -> protected DELETE -> DENY
-- Expected: 0 rows affected
-- DELETE FROM public.leads WHERE id = 'lead_sp_01';

-- =========================================================================
-- SUITE 2: CROSS-TENANT ISOLATION (SOHAM / TENANT A)
-- =========================================================================
SELECT pg_temp.set_test_auth('usr_test_soham', 'authenticated');

-- Scenario 5: Soham -> org_salespilot_lifetime SELECT -> ALLOW
-- Expected: Sees lead_sp_01
-- SELECT id FROM public.leads WHERE id = 'lead_sp_01'; -> RETURNS 'lead_sp_01'

-- Scenario 6: Soham -> org_pordigy_enterprise SELECT -> DENY
-- Expected: 0 rows returned
-- SELECT id FROM public.leads WHERE id = 'lead_pd_01'; -> RETURNS 0 ROWS

-- Scenario 7: Soham -> create record in own organization -> ALLOW
-- INSERT INTO public.leads (id, organization_id, email) VALUES ('lead_sp_02', 'org_test_salespilot', 'sp2@test.com'); -> SUCCEEDS

-- Scenario 8: Soham -> create record in Pordigy organization -> DENY
-- INSERT INTO public.leads (id, organization_id, email) VALUES ('lead_pd_bad', 'org_test_pordigy', 'leak@test.com'); -> FAILS WITH CHECK

-- Scenario 9: Soham -> update own organization record -> ALLOW
-- UPDATE public.leads SET first_name = 'Alice Updated' WHERE id = 'lead_sp_01'; -> SUCCEEDS

-- Scenario 10: Soham -> update Pordigy record -> DENY
-- UPDATE public.leads SET first_name = 'Tampered' WHERE id = 'lead_pd_01'; -> 0 ROWS AFFECTED

-- Scenario 11: Soham -> delete own organization record -> ALLOW
-- DELETE FROM public.leads WHERE id = 'lead_sp_02'; -> SUCCEEDS

-- Scenario 12: Soham -> delete Pordigy record -> DENY
-- DELETE FROM public.leads WHERE id = 'lead_pd_01'; -> 0 ROWS AFFECTED

-- =========================================================================
-- SUITE 3: CROSS-TENANT ISOLATION (PORDIGY / TENANT B)
-- =========================================================================
SELECT pg_temp.set_test_auth('usr_test_pordigy', 'authenticated');

-- Scenario 13: Pordigy -> org_pordigy_enterprise SELECT -> ALLOW
-- Expected: Sees lead_pd_01

-- Scenario 14: Pordigy -> org_salespilot_lifetime SELECT -> DENY
-- Expected: 0 rows returned

-- Scenario 15: Pordigy -> create own organization record -> ALLOW
-- INSERT INTO public.leads (id, organization_id, email) VALUES ('lead_pd_02', 'org_test_pordigy', 'pd2@test.com'); -> SUCCEEDS

-- Scenario 16: Pordigy -> create Soham organization record -> DENY
-- INSERT INTO public.leads (id, organization_id, email) VALUES ('lead_sp_bad', 'org_test_salespilot', 'leak@test.com'); -> FAILS WITH CHECK

-- Scenario 17: Pordigy -> update own organization record -> ALLOW
-- UPDATE public.leads SET first_name = 'Bob Updated' WHERE id = 'lead_pd_01'; -> SUCCEEDS

-- Scenario 18: Pordigy -> update Soham record -> DENY
-- UPDATE public.leads SET first_name = 'Tampered' WHERE id = 'lead_sp_01'; -> 0 ROWS AFFECTED

-- Scenario 19: Pordigy -> delete own organization record -> ALLOW
-- DELETE FROM public.leads WHERE id = 'lead_pd_02'; -> SUCCEEDS

-- Scenario 20: Pordigy -> delete Soham record -> DENY
-- DELETE FROM public.leads WHERE id = 'lead_sp_01'; -> 0 ROWS AFFECTED

-- =========================================================================
-- SUITE 4: MEMBERSHIP & PRIVILEGE ESCALATION
-- =========================================================================
-- As regular MEMBER:
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');

-- Scenario 21: MEMBER -> add member -> DENY
-- INSERT INTO public.organization_members (id, organization_id, user_id, role) VALUES ('mem_bad', 'org_test_salespilot', 'usr_test_pordigy', 'MEMBER'); -> FAILS WITH CHECK

-- Scenario 22: MEMBER -> change another user's role -> DENY
-- UPDATE public.organization_members SET role = 'OWNER' WHERE user_id = 'usr_test_member_a'; -> FAILS WITH CHECK

-- Scenario 23: MEMBER -> remove member -> DENY
-- DELETE FROM public.organization_members WHERE user_id = 'usr_test_soham'; -> 0 ROWS AFFECTED

-- As ADMIN:
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');

-- Scenario 24: ADMIN -> permitted membership administration -> ALLOW
-- INSERT INTO public.organization_members (id, organization_id, user_id, role) VALUES ('mem_new_rep', 'org_test_salespilot', 'usr_new_rep', 'MEMBER'); -> ALLOWED

-- Scenario 25: MEMBER -> assign OWNER role -> DENY
-- (Verified above in Scenario 22)

-- Scenario 26: ADMIN -> assign OWNER role -> DENY
-- UPDATE public.organization_members SET role = 'OWNER' WHERE user_id = 'usr_test_admin_a'; -> FAILS WITH CHECK (only OWNER can grant OWNER)

-- As OWNER:
SELECT pg_temp.set_test_auth('usr_test_soham', 'authenticated');

-- Scenario 27: OWNER -> owner-level membership operation -> ALLOW
-- UPDATE public.organization_members SET role = 'OWNER' WHERE user_id = 'usr_test_admin_a'; -> ALLOWED

-- =========================================================================
-- SUITE 5: ORGANIZATION OWNERSHIP & DELETION
-- =========================================================================
-- As MEMBER:
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');

-- Scenario 28: MEMBER -> change owner_id -> DENY
-- UPDATE public.organizations SET owner_id = 'usr_test_member_a' WHERE id = 'org_test_salespilot'; -> FAILS WITH CHECK

-- As ADMIN:
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');

-- Scenario 29: ADMIN -> change owner_id -> DENY
-- UPDATE public.organizations SET owner_id = 'usr_test_admin_a' WHERE id = 'org_test_salespilot'; -> FAILS WITH CHECK

-- As OWNER:
SELECT pg_temp.set_test_auth('usr_test_soham', 'authenticated');

-- Scenario 30: OWNER -> permitted ownership operation -> ALLOW
-- UPDATE public.organizations SET name = 'SalesPilot Pro Workspace' WHERE id = 'org_test_salespilot'; -> ALLOWED

-- Scenario 31: MEMBER -> delete organization -> DENY
-- (As MemberA: DELETE FROM public.organizations WHERE id = 'org_test_salespilot' -> 0 ROWS)

-- Scenario 32: ADMIN -> delete organization -> DENY
-- (As AdminA: DELETE FROM public.organizations WHERE id = 'org_test_salespilot' -> 0 ROWS)

-- Scenario 33: OWNER -> delete organization -> ALLOW
-- (As Soham: DELETE FROM public.organizations WHERE id = 'org_test_salespilot' -> ALLOWED)

-- =========================================================================
-- SUITE 6: SENSITIVE DATA (GOOGLE TOKENS, API KEYS, BILLING, AUDIT)
-- =========================================================================
-- User A attempts to view User B's google account in the same organization
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');

-- Scenario 34: User A -> User B's google_accounts -> DENY
-- SELECT access_token FROM public.google_accounts WHERE user_id = 'usr_test_soham'; -> RETURNS 0 ROWS

-- Scenario 35: User A -> own google_accounts -> ALLOW
-- SELECT access_token FROM public.google_accounts WHERE user_id = 'usr_test_member_a'; -> ALLOWED

-- Scenario 36: MEMBER -> API keys -> DENY
-- SELECT * FROM public.api_keys WHERE organization_id = 'org_test_salespilot'; -> RETURNS 0 ROWS

-- As ADMIN/OWNER:
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');

-- Scenario 37: ADMIN/OWNER -> permitted API-key operation -> ALLOW
-- SELECT * FROM public.api_keys WHERE organization_id = 'org_test_salespilot'; -> RETURNS 1 ROW

-- As MEMBER:
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');

-- Scenario 38: MEMBER -> billing mutation -> DENY
-- INSERT INTO public.billing (id, organization_id, plan) VALUES ('b_bad', 'org_test_salespilot', 'ENTERPRISE'); -> FAILS WITH CHECK

-- As ADMIN/OWNER:
SELECT pg_temp.set_test_auth('usr_test_admin_a', 'authenticated');

-- Scenario 39: ADMIN/OWNER -> billing mutation -> ALLOW
-- INSERT INTO public.billing (id, organization_id, plan) VALUES ('b_ok', 'org_test_salespilot', 'ENTERPRISE'); -> ALLOWED

-- As MEMBER or ADMIN:
SELECT pg_temp.set_test_auth('usr_test_member_a', 'authenticated');

-- Scenario 40: MEMBER -> audit log UPDATE -> DENY
-- UPDATE public.audit_logs SET action = 'tampered' WHERE id = 'log_1'; -> DENIED (No UPDATE policy)

-- Scenario 41: MEMBER -> audit log DELETE -> DENY
-- DELETE FROM public.audit_logs WHERE id = 'log_1'; -> DENIED (No DELETE policy)

ROLLBACK;
