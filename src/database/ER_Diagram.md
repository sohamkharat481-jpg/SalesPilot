# SalesPilot Production Database - Entity Relationship Diagram

This diagram outlines the relationships, primary keys, and foreign keys of the migrated PostgreSQL database schema.

```mermaid
erDiagram
    ORGANIZATIONS ||--o| USERS : "has owner"
    USERS ||--o| ORGANIZATIONS : "belongs to"
    ORGANIZATIONS ||--o{ TEAM_MEMBERS : "has members"
    USERS ||--o{ TEAM_MEMBERS : "is represented by"
    TEAM_MEMBERS ||--|| ORGANIZATION_MEMBERS : "subclass link"
    ORGANIZATIONS ||--o{ GOOGLE_ACCOUNTS : "holds credentials"
    USERS ||--o{ GOOGLE_ACCOUNTS : "owns oauth"
    USERS ||--o{ SESSIONS : "has active"
    ORGANIZATIONS ||--o{ LEADS : "manages"
    LEADS ||--o{ CONTACTS : "promoted to"
    ORGANIZATIONS ||--o{ COMPANIES : "manages"
    ORGANIZATIONS ||--o{ PIPELINES : "owns"
    PIPELINES ||--o{ PIPELINE_STAGES : "has stages"
    LEADS ||--o{ DEALS : "generates"
    ORGANIZATIONS ||--o{ DEALS : "closed by"
    LEADS ||--o{ APPOINTMENTS : "books"
    ORGANIZATIONS ||--o{ APPOINTMENTS : "schedules"
    APPOINTMENTS ||--o{ CALENDAR_EVENTS : "synced to"
    ORGANIZATIONS ||--o{ CAMPAIGNS : "dispatches"
    ORGANIZATIONS ||--o{ EMAIL_TEMPLATES : "saves"
    ORGANIZATIONS ||--o{ EMAIL_SEQUENCES : "schedules"
    LEADS ||--o| SENT_EMAILS : "receives"
    ORGANIZATIONS ||--o{ SENT_EMAILS : "sends"
    ORGANIZATIONS ||--o{ ANALYTICS : "aggregates"
    USERS ||--o{ ACTIVITY_LOGS : "logs"
    ACTIVITY_LOGS ||--|| ACTIVITIES : "extended detail"
    USERS ||--o{ NOTIFICATIONS : "receives"
    ORGANIZATIONS ||--o{ TASKS : "assigns"
    LEADS ||--o{ NOTES : "annotated with"
    ORGANIZATIONS ||--o{ BILLING : "receives invoices"
    ORGANIZATIONS ||--o{ SUBSCRIPTIONS : "subscribes to"
    ORGANIZATIONS ||--o{ API_KEYS : "hashes"
    ORGANIZATIONS ||--o{ AUDIT_LOGS : "registers"

    ORGANIZATIONS {
        text id PK
        text name
        text domain
        text industry
        text company_name
        text slug
        text website
        text gst_number
        text country
        text timezone
        text currency
        text logo
        text owner_id FK
        text subscription_plan
        text status
        timestamptz created_at
    }

    USERS {
        text id PK
        text email UNIQUE
        text full_name
        text company_name
        text industry
        text tier
        text role
        text organization_id FK
        boolean is_verified
        text phone
        text timezone
        text language
        jsonb notification_prefs
        text password_hash
        boolean is_founder
        text subscription_status
        timestamptz created_at
    }

    PROFILES {
        text id PK, FK
        text email UNIQUE
        text full_name
        text timezone
        text role
        text organization_id FK
        timestamptz created_at
    }

    TEAM_MEMBERS {
        text id PK
        text organization_id FK
        text user_id FK
        text email
        text full_name
        text role
        text status
        timestamptz joined_at
    }

    LEADS {
        text id PK
        text organization_id FK
        text first_name
        text last_name
        text email
        text phone
        text company
        text website
        text status
        text source
        integer score
        text campaign_id
        text notes
        text tags
        jsonb custom_fields
        timestamptz created_at
        timestamptz updated_at
    }

    DEALS {
        text id PK
        text organization_id FK
        text lead_id FK
        text lead_name
        text company
        numeric value_inr
        text stage
        timestamptz created_at
        timestamptz updated_at
    }

    APPOINTMENTS {
        text id PK
        text organization_id FK
        text lead_id FK
        text lead_name
        text company
        text title
        timestamptz time
        integer duration_mins
        text status
        text notes
        jsonb timeline
        timestamptz created_at
    }

    CAMPAIGNS {
        text id PK
        text organization_id FK
        text name
        text target_audience
        text status
        text subject
        text body
        timestamptz schedule_time
        timestamptz created_at
        timestamptz updated_at
    }
```
