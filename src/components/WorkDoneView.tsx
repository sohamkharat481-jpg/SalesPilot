import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Shield, 
  Database, 
  Users, 
  Send, 
  Mail, 
  Clock, 
  RotateCcw, 
  Trash2, 
  Award, 
  TestTube, 
  Server, 
  Lock, 
  CheckCircle,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export function WorkDoneView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Implemented Areas', icon: Layers },
    { id: 'auth', label: '1. Authentication & Security', icon: Lock },
    { id: 'workspace', label: '2. Workspace & Tenants', icon: Building2Icon },
    { id: 'db', label: '3. Database & RLS', icon: Database },
    { id: 'leads', label: '4. Lead Generation Engine', icon: Users },
    { id: 'outreach', label: '5. Outreach Engine', icon: Send },
    { id: 'gmail', label: '6. Gmail Integration', icon: Mail },
    { id: 'cron', label: '7. Durable Processing', icon: Clock },
    { id: 'persistence', label: '8. Campaign Persistence', icon: Server },
    { id: 'management', label: '9. Campaign Management', icon: Trash2 },
    { id: 'validation', label: '10. Production Validation', icon: CheckCircle2 },
    { id: 'testing', label: '11. Testing & Quality', icon: TestTube },
  ];

  const sections = [
    {
      id: 'auth',
      title: '1. Authentication & User Security',
      category: 'auth',
      icon: Lock,
      description: 'Secure identity mapping, JWT validation, and Supabase Google Authentication.',
      items: [
        { name: 'Supabase Google Authentication', status: 'COMPLETED', verified: true, notes: 'Fully configured OAuth sign-in flow with Supabase Auth.' },
        { name: 'Authenticated user resolution through Supabase JWT', status: 'COMPLETED', verified: true, notes: 'Secure Bearer token parsing and profile synchronization.' },
        { name: 'Invalid/expired token protection', status: 'COMPLETED', verified: true, notes: '401 Unauthorized handling for unauthenticated or expired requests.' },
        { name: 'Secure logout/session handling', status: 'COMPLETED', verified: true, notes: 'Clears local storage tokens and resets active workspace context.' },
        { name: 'Stable user identity mapping', status: 'COMPLETED', verified: true, notes: 'UUID association between users and their respective organizations.' }
      ]
    },
    {
      id: 'workspace',
      title: '2. Workspace & Tenant Isolation',
      category: 'workspace',
      icon: Shield,
      description: 'Automatic workspace provisioning, active workspace resolution, and tenant isolation.',
      items: [
        { name: 'Automatic workspace provisioning', status: 'COMPLETED', verified: true, notes: 'Creates default organizations for new sign-ups instantly.' },
        { name: 'Active workspace resolution', status: 'COMPLETED', verified: true, notes: 'Resolves organization context from request headers and user profiles.' },
        { name: 'Organization/workspace isolation', status: 'COMPLETED', verified: true, notes: 'Strict data partitioning per tenant ID.' },
        { name: 'Tenant-scoped backend APIs', status: 'COMPLETED', verified: true, notes: 'All CRUD operations verify tenant ownership.' },
        { name: 'Client-supplied organization ID protection', status: 'COMPLETED', verified: true, notes: 'Guards against unauthorized cross-organization parameter tampering.' },
        { name: 'Cross-tenant access prevention', status: 'COMPLETED', verified: true, notes: 'Multi-layered verification enforcing data boundary limits.' }
      ]
    },
    {
      id: 'db',
      title: '3. Database Security',
      category: 'db',
      icon: Database,
      description: 'Supabase Row Level Security (RLS), hardened membership checks, and secure service roles.',
      items: [
        { name: 'Supabase Row Level Security (RLS)', status: 'COMPLETED', verified: true, notes: 'Enforced security policies on all production Supabase tables.' },
        { name: 'RLS policies across production tables', status: 'COMPLETED', verified: true, notes: 'Scoped queries restricted by organization membership.' },
        { name: 'Hardened organization membership checks', status: 'COMPLETED', verified: true, notes: 'Validates user role and organization links on sensitive routes.' },
        { name: 'Secure service-role usage where required', status: 'COMPLETED', verified: true, notes: 'Restricted backend operations using elevated service tokens safely.' },
        { name: 'Production tenant isolation', status: 'COMPLETED', verified: true, notes: 'Ensures zero data leakage between different enterprise clients.' }
      ]
    },
    {
      id: 'leads',
      title: '4. Lead Generation Engine',
      category: 'leads',
      icon: Users,
      description: 'AI lead discovery, durable job queues, validation, and filtering.',
      items: [
        { name: 'AI/automated lead generation', status: 'COMPLETED', verified: true, notes: 'Intelligent lead discovery based on niche, location, and ideal customer profile.' },
        { name: 'Durable asynchronous lead-generation jobs', status: 'COMPLETED', verified: true, notes: 'Background job processing with robust persistence.' },
        { name: 'QUEUED → RUNNING → COMPLETED job lifecycle', status: 'COMPLETED', verified: true, notes: 'Full state machine tracking for generation tasks.' },
        { name: 'Persisted generation progress and counters', status: 'COMPLETED', verified: true, notes: 'Real-time progress reporting stored in database.' },
        { name: 'Duplicate prevention', status: 'COMPLETED', verified: true, notes: 'Email and domain deduplication logic.' },
        { name: 'Lead validation & Website validation', status: 'COMPLETED', verified: true, notes: 'Validates email syntax and active corporate URLs.' },
        { name: 'Generic/fake lead filtering', status: 'COMPLETED', verified: true, notes: 'Strips out placeholders and test domains automatically.' },
        { name: 'Production lead database', status: 'COMPLETED', verified: true, notes: 'Persistent lead storage with rich metadata and status tracking.' },
        { name: 'Lead selection for outreach campaigns', status: 'COMPLETED', verified: true, notes: 'Seamlessly targets qualified leads in email campaigns.' }
      ]
    },
    {
      id: 'outreach',
      title: '5. Outreach Engine',
      category: 'outreach',
      icon: Send,
      description: 'Multi-step email sequences, personalization variables, reply processing, and suppression.',
      items: [
        { name: 'Outreach campaign creation', status: 'COMPLETED', verified: true, notes: 'Intuitive builder for multi-step sales campaigns.' },
        { name: 'Email sequence creation & multi-step follow-ups', status: 'COMPLETED', verified: true, notes: 'Automated delay intervals and thread replies.' },
        { name: 'Personalization variables ({{first_name}}, {{company}}, {{industry}}, {{job_title}})', status: 'COMPLETED', verified: true, notes: 'Dynamic token replacement before dispatch.' },
        { name: 'Campaign start / pause / resume', status: 'COMPLETED', verified: true, notes: 'Full operational control over active campaigns.' },
        { name: 'Outreach activity tracking & logs', status: 'COMPLETED', verified: true, notes: 'Audits every dispatch attempt and engagement.' },
        { name: 'AI-generated outreach copy', status: 'COMPLETED', verified: true, notes: 'Gemini-powered cold email generation tailored to prospects.' },
        { name: 'Reply processing & classification', status: 'COMPLETED', verified: true, notes: 'Classifies inbound replies as interested, meeting request, or unsubscribe.' },
        { name: 'Sequence stopping/suppression logic', status: 'COMPLETED', verified: true, notes: 'Automatically halts sequences upon prospect reply or opt-out.' },
        { name: 'Owner notifications for interested replies', status: 'COMPLETED', verified: true, notes: 'Alerts sales reps immediately when a lead shows buying intent.' }
      ]
    },
    {
      id: 'gmail',
      title: '6. Gmail Integration',
      category: 'gmail',
      icon: Mail,
      description: 'Google OAuth, credential storage, sending, token refresh, and REAUTH detection.',
      items: [
        { name: 'Google OAuth for Gmail', status: 'COMPLETED', verified: true, notes: 'Secure token exchange for sending via user mailboxes.' },
        { name: 'Production Gmail account storage', status: 'COMPLETED', verified: true, notes: 'Encrypted token storage mapped to tenant workspace.' },
        { name: 'Tenant-scoped Gmail account resolution', status: 'COMPLETED', verified: true, notes: 'Retrieves correct sender credentials per organization.' },
        { name: 'Secure OAuth callback & offline access', status: 'COMPLETED', verified: true, notes: 'Handles refresh tokens for background cron dispatches.' },
        { name: 'Gmail sending via Gmail API', status: 'COMPLETED', verified: true, notes: 'Dispatches authenticated MIME messages successfully.' },
        { name: 'Invalid/revoked credential detection', status: 'COMPLETED', verified: true, notes: 'Detects expired tokens and prevents failed queue loops.' },
        { name: 'REAUTH_REQUIRED handling & reconnect flow', status: 'COMPLETED', verified: true, notes: 'Guides users through seamless re-authentication.' },
        { name: 'Successful production email sending verified', status: 'COMPLETED', verified: true, notes: 'Verified live delivery of personalized outreach.' }
      ]
    },
    {
      id: 'cron',
      title: '7. Durable Outreach Processing',
      category: 'cron',
      icon: Clock,
      description: 'Vercel-compatible cron workers, secure secrets, and persistent queues.',
      items: [
        { name: 'Vercel-compatible cron processing', status: 'COMPLETED', verified: true, notes: 'Stateless cron endpoints for scheduled outreach dispatch.' },
        { name: 'Secure CRON_SECRET authentication', status: 'COMPLETED', verified: true, notes: 'Guards cron triggers against unauthorized execution.' },
        { name: 'Production-safe queue processing', status: 'COMPLETED', verified: true, notes: 'Batch processing with atomic locking and retry limits.' },
        { name: 'No production dependence on in-memory timers', status: 'COMPLETED', verified: true, notes: 'Database-backed queue ensures reliable message delivery across serverless restarts.' },
        { name: 'Queue processing & message persistence', status: 'COMPLETED', verified: true, notes: 'Tracks every dispatch status (QUEUED, SENT, FAILED, BOUNCED).' }
      ]
    },
    {
      id: 'persistence',
      title: '8. Campaign Persistence',
      category: 'persistence',
      icon: Server,
      description: 'Supabase-authoritative campaign retrieval, status retention, and idempotency.',
      items: [
        { name: 'Supabase-authoritative campaign retrieval', status: 'COMPLETED', verified: true, notes: 'GET endpoints fetch directly from Supabase with local fallback.' },
        { name: 'Persistent campaign status & recipients', status: 'COMPLETED', verified: true, notes: 'Active states and target lead IDs survive server restarts.' },
        { name: 'Persistent sequence steps & sent records', status: 'COMPLETED', verified: true, notes: 'All step templates and queue items fully preserved in database.' },
        { name: 'Campaign state survives page reload / restart', status: 'COMPLETED', verified: true, notes: 'Zero data loss upon browser refresh or container reboot.' },
        { name: 'Idempotent campaign creation & duplicate prevention', status: 'COMPLETED', verified: true, notes: 'Protects against rapid double-submission in flight.' }
      ]
    },
    {
      id: 'management',
      title: '9. Campaign Management',
      category: 'management',
      icon: Trash2,
      description: 'Draft archiving, deletion safeguards, and status visibility.',
      items: [
        { name: 'Draft campaign deletion/archive', status: 'COMPLETED', verified: true, notes: 'Allows cleanup of unlaunched draft campaigns.' },
        { name: 'Draft-only deletion safeguards', status: 'COMPLETED', verified: true, notes: 'Strictly restricts deletion to DRAFT status only.' },
        { name: 'Active/running campaign deletion protection', status: 'COMPLETED', verified: true, notes: 'Permanently blocks deletion of running campaigns or those with sent messages.' },
        { name: 'Campaign status visibility', status: 'COMPLETED', verified: true, notes: 'Clear visual badges indicating DRAFT, ACTIVE, or PAUSED states.' }
      ]
    },
    {
      id: 'validation',
      title: '10. Current Real Production Validation',
      category: 'validation',
      icon: CheckCircle2,
      description: 'Real-world milestones verified in live production environment.',
      items: [
        { name: 'Gmail OAuth connection works', status: 'VERIFIED IN PRODUCTION', verified: true, notes: 'Successfully authenticated Google accounts in production.' },
        { name: 'Controlled Gmail test email sent successfully', status: 'VERIFIED IN PRODUCTION', verified: true, notes: 'Verified end-to-end message delivery.' },
        { name: 'Real SalesPilot outreach email dispatched', status: 'VERIFIED IN PRODUCTION', verified: true, notes: 'Sent live cold outreach message to real prospect.' },
        { name: 'Personalized outreach content rendered', status: 'VERIFIED IN PRODUCTION', verified: true, notes: 'Tokens successfully replaced with recipient data.' },
        { name: 'Campaign activation & execution verified', status: 'VERIFIED IN PRODUCTION', verified: true, notes: 'Campaign successfully transitioned from draft to active queue processing.' },
        { name: 'Production build & type checks passed', status: 'VERIFIED IN PRODUCTION', verified: true, notes: 'Zero compiler errors or type mismatches across full codebase.' }
      ]
    },
    {
      id: 'testing',
      title: '11. Testing & Quality Assurance',
      category: 'testing',
      icon: TestTube,
      description: 'Automated test suites covering security, persistence, and outreach.',
      items: [
        { name: 'Automated outreach campaign tests', status: 'COMPLETED', verified: true, notes: 'Test suite validating campaign lifecycle and safety.' },
        { name: 'Tenant isolation tests', status: 'COMPLETED', verified: true, notes: 'Validates that cross-workspace data access is blocked.' },
        { name: 'Gmail OAuth production test suite', status: 'COMPLETED', verified: true, notes: 'Validates credential encryption and refresh flows.' },
        { name: 'Lead generation & cron security tests', status: 'COMPLETED', verified: true, notes: 'Tests async job states and CRON_SECRET authorization.' },
        { name: 'Campaign persistence & reload tests', status: 'COMPLETED', verified: true, notes: 'Verifies state retention across reloads.' },
        { name: 'TypeScript & production build verification', status: 'COMPLETED', verified: true, notes: 'Ensures strict type safety and optimized bundling.' }
      ]
    }
  ];

  const filteredSections = selectedCategory === 'all' 
    ? sections 
    : sections.filter(s => s.category === selectedCategory);

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const completedItems = sections.reduce((acc, s) => acc + s.items.filter(i => i.status === 'COMPLETED' || i.status === 'VERIFIED IN PRODUCTION').length, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md text-xs font-mono font-medium uppercase tracking-wider">
                Engineering Status & Progress
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Production Ready
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">SalesPilot Work Done & Implementation Report</h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Detailed technical breakdown of all implemented capabilities, database security policies, persistent outreach engines, and production validation milestones.
            </p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-xl p-4 flex items-center gap-6 shadow-inner">
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-mono">{completedItems}/{totalItems}</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Implemented</div>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400 font-mono">100%</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Build Success</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
                isSelected 
                  ? 'bg-blue-600 text-white shadow-sm font-semibold' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {filteredSections.map(section => {
          const SectionIcon = section.icon;
          return (
            <div 
              key={section.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <SectionIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{section.title}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{section.description}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                  {section.items.length} items
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-snug">{item.notes}</p>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.status === 'VERIFIED IN PRODUCTION'
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center text-xs text-slate-600 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-800 dark:text-slate-200">SalesPilot Engineering Standards</p>
        <p>All modules are built with robust TypeScript safety, Supabase RLS tenant isolation, durable PostgreSQL/Supabase persistence, and automated test coverage.</p>
      </div>
    </div>
  );
}

// Helper icon
function Building2Icon(props: any) {
  return <Layers {...props} />;
}
