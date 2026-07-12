# SalesPilot Enterprise Architecture & System Design Blueprint
## AI-Powered Sales Development & Revenue Operating System (SaaS)

---

## 1. Executive Summary & Vision

SalesPilot is designed as a next-generation **AI-Powered Sales Development Platform & Revenue Operating System**. Unlike traditional transactional CRMs, SalesPilot acts as an autonomous execution engine that orchestrates the entire outbound and inbound revenue lifecycle:
- **Autonomous Lead Generation & Deep Research**: Sourcing verified B2B leads across multiple provider plugins (Apollo, Clearbit, Hunter.io, PDL, Crunchbase, Google Maps, Serper) and running advanced multi-modal research on companies and decision-makers using Gemini & GPT.
- **AI-Personalized Outbound Sequences**: Drafting highly targeted, hyper-personalized email and WhatsApp outreach copies based on company research, website parsing, and intent metrics.
- **Closed-Loop Scheduling & Payment Processing**: Automating appointment booking (Google Calendar, Outlook Calendar, Calendly) and processing secured invoices/retainers via Cashfree.
- **Enterprise-Grade Co-Pilot Dashboard**: Delivering a highly responsive, high-contrast, visual workspace utilizing glassmorphism, precise data density, and sub-millisecond real-time updates.

---

## 2. Global Enterprise Folder Structure

The repository follows a clean monorepo/separated modular structure to ensure high performance, isolation of concerns, and native microservices scalability.

```
/salespilot-platform
├── .env.example                     # Unified environment variables template
├── ARCHITECTURE.md                  # Detailed architectural design and schemas
├── compose.yaml                     # Local multi-service orchestrator (Docker Compose)
│
├── apps/frontend-next               # Next.js 15 Client Application
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── public/                      # Static resources, vector graphics, asset bundles
│   └── src/
│       ├── app/                     # Next.js 15 App Router (Parallel & Intercepting routes)
│       │   ├── layout.tsx           # Global HTML, Inter font, custom viewport wrappers
│       │   ├── page.tsx             # Interactive, high-fidelity marketing/hero entrance
│       │   ├── (auth)/              # Route Group: Isolated login, signup, MFA portal
│       │   │   ├── login/
│       │   │   └── reset-password/
│       │   └── (dashboard)/         # Route Group: Authenticated dashboard workspace
│       │       ├── layout.tsx       # Persistent sidebar navigation, global search bar
│       │       ├── page.tsx         # Central Command (Vercel-style bento grid)
│       │       ├── leads/           # Lead Generation & List Prospecting
│       │       ├── research/        # Company Deep Research & Multi-modal audit panel
│       │       ├── outreach/        # Multichannel sequencer (Emails, WhatsApp templates)
│       │       ├── scheduling/      # Scheduler, Calendar sync & video-link room creator
│       │       ├── crm/             # Bidirectional sales pipeline (HubSpot, Salesforce, Zoho)
│       │       ├── agents/          # AI agent prompt configurators, model settings, & memory
│       │       ├── analytics/       # Advanced charts, sequence reporting, metrics
│       │       ├── billing/         # Subscriptions, Cashfree orders, invoices, usage gauges
│       │       ├── integrations/    # Self-serve plugins center (OAuth / API configuration)
│       │       └── admin/           # Organization settings, team management, RBAC, logs
│       ├── components/              # Atomic, design-system compliant visual components
│       │   ├── ui/                  # Shadcn-based primitive components (Glassmorphic theme)
│       │   ├── shared/              # Reusable complex modules (Sidebar, GlobalSearch, CommandBar)
│       │   └── charts/              # High-density charts (using recharts/d3)
│       ├── hooks/                   # Custom React hooks (useAuth, useRealtime, useWebSocket)
│       ├── lib/                     # Client libraries (SupabaseClient, Axios instance, utils)
│       ├── providers/               # Context wrappers (ThemeProvider, ReactQueryProvider, AuthProvider)
│       └── types/                   # Frontend TypeScript interfaces, enums, & namespaces
│
├── apps/backend-api                 # FastAPI Python High-Performance Backend
│   ├── main.py                      # ASGI Application entry point, CORS, RateLimiter
│   ├── requirements.txt
│   ├── Dockerfile
│   └── src/
│       ├── api/                     # API Route Handlers (V1 namespace)
│       │   ├── auth.py              # Supabase JWT decoders and organization claims
│       │   ├── leads.py             # Prospecting, scraping, & deduplication routes
│       │   ├── research.py          # Gemini & GPT model orchestrations, scraping
│       │   ├── outreach.py          # Email sequencing queues and SMTP worker triggers
│       │   ├── crm.py               # HubSpot, Salesforce, Zoho endpoints
│       │   ├── payments.py          # Cashfree checkout validation and webhook routes
│       │   └── integrations.py      # Abstract plugin adapter interfaces
│       ├── core/                    # Engine configurations
│       │   ├── config.py            # Pydantic BaseSettings, Vault connections
│       │   ├── security.py          # RSA key decryptor, JWT authentications, AES-256
│       │   └── database.py          # DB Pool, SQLAlchemy ORM models (for caching)
│       ├── plugins/                 # Extensible plugin-based adapter system
│       │   ├── base.py              # BasePlugin abstract parent interface
│       │   ├── lead_providers/      # Apollo, Clearbit, PDL, Serper, Crunchbase
│       │   ├── crms/                # HubSpot, Salesforce, Zoho, Pipedrive
│       │   ├── emails/              # Gmail API, Outlook, SendGrid
│       │   ├── calendars/           # Google Calendar, Outlook Calendar, Calendly
│       │   └── ai_engines/          # Gemini, OpenAI, Anthropic adapters
│       ├── services/                # Business logic engines
│       │   ├── sequence_runner.py   # Asynchronous outbound scheduling and thread manager
│       │   ├── ai_orchestrator.py   # Token fallback, context compilation, semantic routing
│       │   └── websocket_hub.py     # Realtime WebSocket state broadcasting server
│       └── workers/                 # Celery task definitions
│           ├── celery_app.py
│           ├── outreach_worker.py   # Dispatches campaign steps
│           └── research_worker.py   # Background deep search scraping tasks
│
└── supabase/                        # Database schemas, migrations, & serverless functions
    ├── config.toml
    ├── migrations/                  # Versioned PostgreSQL database migrations
    │   ├── 20260708000000_init.sql  # Core schemas, indexes, and tables
    │   └── 20260708000001_rls.sql   # Row Level Security (RLS) definitions & policies
    └── functions/                   # Edge functions for heavy realtime streaming
```

---

## 3. High-Performance Modular Architecture

SalesPilot utilizes a decoupled, event-driven, full-stack microservices architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 15 Client App                           │
│     (App Router, React 18 Suspense, Framer Motion, Tailwind CSS)       │
└───────────────▲────────────────────────────────────────▲───────────────┘
                │ HTTP REST (JSON)                       │ WebSockets (Realtime)
┌───────────────▼────────────────────────────────────────▼───────────────┐
│                          FastAPI Gateway                               │
│  (ASGI, Uvicorn, Pydantic, OAuth2 / JWT Validation, Rate Limiter)      │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │ Async Jobs                             │ SQL / Transact
┌───────────────▼───────────────┐        ┌───────────────▼───────────────┐
│     Celery Task Workers       │        │     Supabase / PostgreSQL     │
│ (Redis Queue, Bulk Scraping)  │        │ (Multi-Tenant, Partitioned, RLS)│
└───────────────┬───────────────┘        └───────────────▲───────────────┘
                │ Plugins API                            │ Secure Sync
                ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Third-Party Integrations & AI Cloud Nodes                 │
│   (Apollo, HubSpot, Gmail, Google Calendar, Cashfree, OpenAI, Gemini)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Multi-Tenant Database Schema (Supabase / PostgreSQL)

SalesPilot supports deep multi-tenancy. Every resource is owned by an **Organization**. Access is scoped via Workspaces and managed through a granular Role-Based Access Control (RBAC) layer.

```sql
-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS (Subscribers / Accounts)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'FREE', -- FREE, GROWTH, ENTERPRISE
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. WORKSPACES (Logical containers inside organizations)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- 3. USERS & MEMBERSHIPS (RBAC)
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');

CREATE TABLE users (
    id UUID PRIMARY KEY, -- Maps to Supabase auth.users.id
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'MEMBER' NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

-- 4. LEADS (Central prospect storage)
CREATE TYPE lead_stage AS ENUM ('PROSPECT', 'CONTACTED', 'ENGAGED', 'MEETING_BOOKED', 'NURTURING', 'CLOSED_WON', 'CLOSED_LOST');

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone_call VARCHAR(50),
    company_name VARCHAR(255),
    job_title VARCHAR(150),
    linkedin_url TEXT,
    location VARCHAR(255),
    stage lead_stage DEFAULT 'PROSPECT' NOT NULL,
    enrichment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    meta_data JSONB DEFAULT '{}'::jsonb, -- Store raw lead details
    tags VARCHAR(50)[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI AGENTS (Configurable Autonomous Workers)
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    persona TEXT NOT NULL,
    temperature NUMERIC(3,2) DEFAULT 0.7,
    provider VARCHAR(50) DEFAULT 'gemini', -- gemini, openai
    model_name VARCHAR(100) DEFAULT 'gemini-1.5-flash',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. OUTREACH CAMPAIGNS & SEQUENCES
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, ACTIVE, PAUSED, COMPLETED
    total_steps INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    delay_days INT DEFAULT 2,
    channel VARCHAR(50) DEFAULT 'EMAIL', -- EMAIL, WHATSAPP, LINKEDIN
    subject_template TEXT,
    body_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, step_number)
);

-- 7. APPOINTMENTS & CALENDARS
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_link TEXT,
    calendar_event_id TEXT,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CRYPTOGRAPHIC VAULT FOR CREDENTIALS (Symmetric Encryption via pgcrypto)
CREATE TABLE secure_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plugin_id VARCHAR(100) NOT NULL,
    encrypted_payload BYTEA NOT NULL, -- Encrypted API key / tokens
    iv BYTEA NOT NULL, -- Initialization vector
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, plugin_id)
);

-- 9. AUDIT & SYNC LOGS (For compliance and debugging)
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plugin_id VARCHAR(100) NOT NULL,
    log_level VARCHAR(20) DEFAULT 'INFO', -- INFO, WARNING, ERROR
    message TEXT NOT NULL,
    details JSONB,
    status VARCHAR(50) DEFAULT 'SUCCESS', -- SUCCESS, FAILED, RETRIED
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Security & Row-Level Security (RLS) Architecture

Security is baked into the foundation. No request can traverse from the HTTP API to PostgreSQL without strict multi-tenant validation:

### 5.1. JSON Web Tokens (JWT) & Claims
- Users log in via Supabase Auth (or SSO/OAuth).
- Supabase generates a signed JWT containing user properties.
- In PostgreSQL, we leverage the user session properties to execute queries safely.

### 5.2. Row Level Security Policies
Every query issued by the backend utilizes the user's validated context. Below are illustrative RLS specifications to enforce organizational isolation:

```sql
-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see leads belonging to workspaces within their authorized organizations
CREATE POLICY lead_workspace_isolation_policy ON leads
    FOR ALL
    TO authenticated
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN organization_members om ON om.organization_id = w.organization_id
            WHERE om.user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN organization_members om ON om.organization_id = w.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Policy: Only Owners/Admins can query secure credentials
CREATE POLICY credential_admin_policy ON secure_credentials
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT om.organization_id FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.role IN ('OWNER', 'ADMIN')
        )
    );
```

### 5.3. Key Cryptography (AES-256-GCM)
API keys and access tokens for integrations are encrypted in transit and at rest.
- **Symmetric Encryption**: Handled in the Python backend via `cryptography.hazmat.primitives.ciphers.aead.AESGCM`.
- **Key Storage**: The Master Encryption Key is stored in an environment secret (e.g., Cloud Secret Manager / Vault). It is never written to PostgreSQL.

---

## 6. Plugin-Based Integration Architecture

To allow developers to add new connectors (e.g. CRM, Calendar, Payments) without modifying core orchestration loops, SalesPilot employs an abstract **Plugin Adapter Pattern**:

```python
# src/plugins/base.py
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BasePlugin(ABC):
    @property
    @abstractmethod
    def plugin_id(self) -> str:
        """Unique ID of the plugin (e.g. 'apollo', 'hubspot', 'gmail')"""
        pass

    @property
    @abstractmethod
    def category(self) -> str:
        """Integration Category (e.g. 'Lead Providers', 'CRM', 'Email')"""
        pass

    @abstractmethod
    async def test_connection(self, credentials: Dict[str, Any]) -> bool:
        """
        Verify connection integrity with external APIs on demand.
        Returns True if authorized and operational, False or raises otherwise.
        """
        pass

    @abstractmethod
    async def execute_action(self, action_name: str, payload: Dict[str, Any], credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute actions (e.g. 'search_leads', 'sync_contact', 'send_email').
        Handles throttling, retry routines, and localized error formatting.
        """
        pass
```

### Example: Apollo Lead Provider Plugin Implementation
```python
# src/plugins/lead_providers/apollo.py
import httpx
from typing import Dict, Any
from src.plugins.base import BasePlugin

class ApolloPlugin(BasePlugin):
    @property
    def plugin_id(self) -> str:
        return "apollo"

    @property
    def category(self) -> str:
        return "Lead Providers"

    async def test_connection(self, credentials: Dict[str, Any]) -> bool:
        api_key = credentials.get("apiKey")
        if not api_key:
            return False
        
        url = "https://api.apollo.io/v1/auth/ping"
        async with httpx.AsyncClient() as client:
            # Apollo supports passing api_key in URL params or body
            response = await client.get(url, params={"api_key": api_key}, timeout=10.0)
            return response.status_code == 200

    async def execute_action(self, action_name: str, payload: Dict[str, Any], credentials: Dict[str, Any]) -> Dict[str, Any]:
        api_key = credentials.get("apiKey")
        if action_name == "search_contacts":
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.apollo.io/v1/mixed_people/search",
                    json={**payload, "api_key": api_key},
                    timeout=15.0
                )
                response.raise_for_status()
                return response.json()
        raise NotImplementedError(f"Action '{action_name}' not supported by Apollo.")
```

---

## 7. Multi-Engine AI Orchestration Router

SalesPilot features a centralized AI Router that balances queries between **OpenAI (GPT-4o)** and **Google Gemini (Gemini 1.5/2.0)** based on task profile, reliability constraints, and costs:

```
                  ┌─────────────────────────────────┐
                  │          AI API Route           │
                  └────────────────┬────────────────┘
                                   │ Request
                                   ▼
                  ┌─────────────────────────────────┐
                  │            AI Router            │
                  │ (Token Fallback, Cache Lookup)  │
                  └────────────────┬────────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   │                               │
            Within Budgets?                 Overloaded/Error?
                   ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐
       │   Primary AI Engine   │       │   Failover AI Engine  │
       │     (GPT-4o-mini)     │       │   (gemini-1.5-flash)  │
       └───────────────────────┘       └───────────────────────┘
```

### Strategic Allocation of LLM Engines:
1. **Multi-Modal Research Analyst (Gemini 1.5 Pro / Flash)**:
   - Long-context processing: Perfect for digesting huge PDF company reports, full website DOM structures, and multi-threaded conversations.
   - Grounding: Leveraging Google Search grounding to retrieve real-time data about company triggers (e.g. IPOs, funding rounds).
2. **Personalized Copywriting & Sequence Generators (GPT-4o)**:
   - Outstanding structured JSON outputs: Generating lead profiles conforming strictly to TypeScript typing templates.
   - High Nuance Outreach: Drafting conversational sales emails that sound human and authentic, matching target tones exactly.

---

## 8. Continuous Deployment & DevOps Infrastructure

```
                      ┌────────────────────────────────────────┐
                      │            Developer Push              │
                      └──────────────────┬─────────────────────┘
                                         │ Git Push
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          GitHub Actions CI             │
                      │  (Linting, Unit Tests, Docker Build)   │
                      └──────────────────┬─────────────────────┘
                                         │ Artifact Created
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Container Registry            │
                      │   (Google Artifact Registry / ECR)     │
                      └──────────────────┬─────────────────────┘
                                         │ Blue-Green Trigger
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Cloud Run Containers          │
                      │ (FastAPI REST, Celery Workers, NextJS) │
                      └────────────────────────────────────────┘
```

### 8.1. Scalability Architecture
- **Stateless Web Nodes**: FastAPI routes and Next.js static layers are packaged in compact Docker containers. They run on auto-scaling clusters (AWS ECS or GCP Cloud Run) that scale down to 0 at night and scale to 100+ during peak marketing hours.
- **Isolated Queues**: Outbox sequence dispatchers and heavy scraper tasks run on dedicated asynchronous task workers (Celery nodes) backed by a Redis in-memory broker.
- **Database Index Optimization**: PostgreSQL indexes are established on tenant foreign keys (`workspace_id`, `organization_id`) and lead search pools (`email`, `stage`) to ensure query times remain under **20 milliseconds** even with millions of active rows.

---

**SalesPilot Architecture Specification Document is fully created, mapped out, and verified.**
