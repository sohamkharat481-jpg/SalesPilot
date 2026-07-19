# SalesPilot Database Schema Documentation

This document describes the 26 normalized tables deployed in the Supabase PostgreSQL instance for the SalesPilot Multi-Tenant CRM Platform.

---

## 1. Organizations (`organizations`)
Stores details about the customer's organization/tenant.
* **id** (`TEXT`, PK): Unique organization identifier.
* **name** (`TEXT`): Visual organization name.
* **domain** (`TEXT`): Linked workspace domain.
* **industry** (`TEXT`): Business vertical.
* **company_name** (`TEXT`): Incorporated business name.
* **slug** (`TEXT`): URL-friendly unique handle.
* **website** (`TEXT`): Corporate web link.
* **gst_number** (`TEXT`): Tax identification value.
* **country** (`TEXT`): Localization country.
* **timezone** (`TEXT`): Operational timezone.
* **currency** (`TEXT`): Billing currency.
* **logo** (`TEXT`): Public URL of the uploaded brand logo image.
* **owner_id** (`TEXT`, FK): Points to `users.id` of the primary tenant admin.
* **subscription_plan** (`TEXT`): Plan level (`STARTER`, `GROWTH`, `ENTERPRISE`).
* **status** (`TEXT`): Account state (`ACTIVE`, `SUSPENDED`).
* **created_at** (`TIMESTAMPTZ`): Record creation time.

---

## 2. Users (`users`) & Profiles (`profiles`)
Contains credentials, settings, preferences, and identity parameters.
* **id** (`TEXT`, PK): Unique user identifier.
* **email** (`TEXT`, Unique): Primary email address.
* **full_name** (`TEXT`): Visual user name.
* **company_name** (`TEXT`): Self-declared company.
* **industry** (`TEXT`): Field of work.
* **tier** (`TEXT`): Assigned service tier.
* **role** (`TEXT`): System level permissions (`OWNER`, `MANAGER`, `SALES`).
* **organization_id** (`TEXT`, FK): Points to `organizations.id` (null if unassigned).
* **is_verified** (`BOOLEAN`): Email validation flag.
* **phone** (`TEXT`): Dynamic contact phone.
* **timezone** (`TEXT`): Local timezone.
* **language** (`TEXT`): Preferred language.
* **notification_prefs** (`JSONB`): Key-value dictionary of email and push settings.
* **password_hash** (`TEXT`): Salted Bcrypt hash of password.
* **is_founder** (`BOOLEAN`): True for platform founders.
* **subscription_status** (`TEXT`): Status flag for billing.
* **created_at** (`TIMESTAMPTZ`): Registration time.

*Note: Bidirectional triggers automatically synchronize inserts/updates between `users` and `profiles` for strict backwards-compatibility.*

---

## 3. Team Members (`team_members`) & Organization Members (`organization_members`)
Lists staff members added to workspace tenants.
* **id** (`TEXT`, PK): Unique team member id.
* **organization_id** (`TEXT`, FK): References `organizations.id`.
* **user_id** (`TEXT`, FK): References `users.id`.
* **email** (`TEXT`): Identity email.
* **full_name** (`TEXT`): Member name.
* **role** (`TEXT`): Workspace role.
* **status** (`TEXT`): Invite status (`ACTIVE`, `INVITED`, `SUSPENDED`).
* **joined_at** (`TIMESTAMPTZ`): Acceptance date.

---

## 4. Google Accounts (`google_accounts`)
Stores active Google OAuth tokens, scopes, and expiration details for the Gmail and Google Calendar integrations.
* **id** (`TEXT`, PK): Unique Google account credential link.
* **user_id** (`TEXT`, FK): References `users.id`.
* **organization_id** (`TEXT`, FK): References `organizations.id`.
* **email** (`TEXT`): Verified Google email address.
* **access_token** (`TEXT`): Active access token.
* **refresh_token** (`TEXT`): Off-line permanent refresh token.
* **scopes** (`TEXT[]`): Scope privileges granted.
* **expiry_date** (`TIMESTAMPTZ`): Token expiration milestone.
* **account_type** (`TEXT`): Type of account (`gmail` or `calendar`).
* **created_at** (`TIMESTAMPTZ`): Added timestamp.
* **updated_at** (`TIMESTAMPTZ`): Updated timestamp.

---

## 5. Sessions (`sessions`)
Secures stateful login tokens.
* **token** (`TEXT`, PK): Bearer auth session token.
* **user_id** (`TEXT`, FK): References `users.id`.
* **expires_at** (`TIMESTAMPTZ`): Session expiry.
* **created_at** (`TIMESTAMPTZ`): Created timestamp.

---

## 6. Leads (`leads`)
Primary records for prospective CRM sales leads.
* **id** (`TEXT`, PK): Lead identifier.
* **organization_id** (`TEXT`, FK): Multi-tenant isolation link references `organizations.id`.
* **first_name** (`TEXT`): Given name.
* **last_name** (`TEXT`): Family name.
* **email** (`TEXT`): Email address.
* **phone** (`TEXT`): Phone number.
* **company** (`TEXT`): Corporate name.
* **website** (`TEXT`): Web URL.
* **status** (`TEXT`): Leads progress stage (`NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`).
* **source** (`TEXT`): Attribution channel.
* **score** (`INTEGER`): Computed conversion propensity score.
* **campaign_id** (`TEXT`): Associated campaign.
* **notes** (`TEXT`): Detailed annotations.
* **tags** (`TEXT[]`): Key metadata tags.
* **custom_fields** (`JSONB`): Struct for third-party extensions.
* **created_at** / **updated_at** (`TIMESTAMPTZ`): Lifecycle metrics.

---

## 7. Deals (`deals`)
Value opportunities within the pipelines.
* **id** (`TEXT`, PK): Deal id.
* **organization_id** (`TEXT`, FK): References `organizations.id`.
* **lead_id** (`TEXT`, FK): References `leads.id`.
* **lead_name** (`TEXT`): Cached contact display name.
* **company** (`TEXT`): Linked company.
* **value_inr** (`NUMERIC`): Estimated currency valuation.
* **stage** (`TEXT`): Pipeline stage (`lead`, `contacted`, `proposal`, `negotiation`, `won`, `lost`).

---

## 8. Appointments (`appointments`)
Scheduled booking dates with leads and prospects.
* **id** (`TEXT`, PK): Appointment ID.
* **organization_id** (`TEXT`, FK): References `organizations.id`.
* **lead_id** (`TEXT`, FK): References `leads.id`.
* **lead_name** (`TEXT`): Prospect name.
* **company** (`TEXT`): Corporate association.
* **title** (`TEXT`): Scheduled event name.
* **time** (`TIMESTAMPTZ`): Occurrence time.
* **duration_mins** (`INTEGER`): Event length.
* **status** (`TEXT`): Progress (`scheduled`, `completed`, `cancelled`).
* **notes** (`TEXT`): Internal description.
* **timeline** (`JSONB`): Historical logs of status updates.

---

## 9. Campaigns (`campaigns`)
Stores target groups and template-driven batch dispatches.
* **id** (`TEXT`, PK): Campaign ID.
* **organization_id** (`TEXT`, FK): References `organizations.id`.
* **name** (`TEXT`): Campaign title.
* **target_audience** (`TEXT`): Targeting filters.
* **status** (`TEXT`): Flow stage (`DRAFT`, `SCHEDULED`, `RUNNING`, `COMPLETED`).
* **subject** / **body** (`TEXT`): Content templates.
* **schedule_time** (`TIMESTAMPTZ`): Target run milestone.

---

## Security, Indexes and Connection Pooling
* **Primary Key & Indexes**: Implemented on all entities for fast standard lookups.
* **RLS (Row Level Security)**: Active on every table, isolating all records by `organization_id`.
* **Transaction Resilience**: Backed by connection-pool-ready transactional execution blocks.
