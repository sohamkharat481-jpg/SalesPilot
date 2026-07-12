import React, { useState, useEffect } from 'react';
import { 
  Rocket, Smartphone, Database, Globe, ShieldAlert, Cpu, Activity, Layout, Terminal, CheckCircle, 
  RefreshCw, Send, Lock, Eye, Check, ChevronRight, Sliders, Layers, Code, Settings, Bell, Server, 
  Play, Zap, FileText, ToggleLeft, HelpCircle, Award, CreditCard, Users, Trash2, ArrowUpRight, 
  AlertTriangle, Key, Heart, Wifi, Plus, CheckSquare, Square, CheckSquare2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export function LaunchCenterView() {
  // Navigation for Launch Center Modules
  const [activeModuleTab, setActiveModuleTab] = useState<'mobile' | 'api' | 'webhooks' | 'white-label' | 'multi-tenant' | 'notifications' | 'security' | 'monitoring' | 'performance' | 'cicd' | 'marketing' | 'checklist'>('checklist');

  // Multi-Tenant RBAC isolation States
  const [rbacUsers, setRbacUsers] = useState([
    { id: 'usr-1', name: 'Soham Kharat', email: 'sohamkharat481@gmail.com', orgId: 'org-horizon', orgName: 'Horizon Media', role: 'OWNER', verified: true },
    { id: 'usr-2', name: 'Ananya Sharma', email: 'ananya@apexmarketing.in', orgId: 'org-apex', orgName: 'Apex Marketing', role: 'ADMIN', verified: true },
    { id: 'usr-3', name: 'Rohan Mehta', email: 'rohan@stellartech.io', orgId: 'org-stellar', orgName: 'StellarTech Labs', role: 'MANAGER', verified: true },
    { id: 'usr-4', name: 'Sneha Kapoor', email: 'sneha@cloudflow.com', orgId: 'org-cloudflow', orgName: 'CloudFlow SaaS', role: 'SALES', verified: false }
  ]);
  const [selectedTenantUser, setSelectedTenantUser] = useState<string>('usr-1');
  const [crossTenantAuditLogs, setCrossTenantAuditLogs] = useState<string[]>([]);
  const [isAuditingTenants, setIsAuditingTenants] = useState(false);

  // Mobile App states
  const [mobileScreen, setMobileScreen] = useState<'chat' | 'pipeline' | 'smtp' | 'enrich'>('chat');
  const [pushTitle, setPushTitle] = useState('New High-Value Lead Found!');
  const [pushBody, setPushBody] = useState('Sneha Kapoor is ready to review Horizon Media Professional plan.');
  const [phoneToasts, setPhoneToasts] = useState<Array<{ id: string; title: string; body: string }>>([]);
  const [mobileCodeTab, setMobileCodeTab] = useState<'app-json' | 'chat-screen' | 'push-service'>('chat-screen');

  // Public API states
  const [apiEndpoint, setApiEndpoint] = useState<'leads' | 'enrich' | 'telemetry'>('leads');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiPayload, setApiPayload] = useState('{\n  "company": "Horizon Enterprises",\n  "firstName": "Deepak",\n  "email": "deepak@horizon.co"\n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiTokenBucket, setApiTokenBucket] = useState(100);
  const [apiSpikeActive, setApiSpikeActive] = useState(false);

  // Webhook states
  const [webhookUrl, setWebhookUrl] = useState('https://n8n.horizonmedia.in/webhook/salespilot-receive');
  const [webhookEvent, setWebhookEvent] = useState<'lead.qualified' | 'meeting.scheduled' | 'deal.won'>('lead.qualified');
  const [webhookLogs, setWebhookLogs] = useState<Array<{ id: string; timestamp: string; event: string; url: string; status: number; attempt: number; backoffMs: number; response: string }>>([]);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // White label states
  const [customDomain, setCustomDomain] = useState('outreach.horizonmedia.co');
  const [brandLogoText, setLogoText] = useState('Horizon Pilot');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [dnsStatus, setDnsStatus] = useState<'IDLE' | 'RESOLVING' | 'VALIDATED'>('IDLE');
  const [dnsChecks, setDnsChecks] = useState({
    aRecord: false,
    spfRecord: false,
    dkimRecord: false,
    sslCert: false
  });

  // Omnichannel notifications states
  const [notificationType, setNotificationType] = useState<'email' | 'push' | 'slack' | 'whatsapp'>('email');
  const [notifyTarget, setNotifyTarget] = useState('sohamkharat481@gmail.com');
  const [notifyMessage, setNotifyMessage] = useState('Hi Soham, your active outreach campaign generated 5 new high-ticket Bangalore agency replies.');
  const [notificationQueue, setNotificationQueue] = useState<Array<{ id: string; type: string; recipient: string; message: string; status: string; time: string }>>([
    { id: 'notq-1', type: 'Email', recipient: 'ananya@apexmarketing.in', message: 'Campaign summary report ready.', status: 'SENT', time: '5 mins ago' },
    { id: 'notq-2', type: 'Slack', recipient: '#sales-alerts', message: 'Deal Advanced: Ananya Sharma to NEGOTIATION', status: 'SENT', time: '12 mins ago' }
  ]);
  const [isSendingNotice, setIsSendingNotice] = useState(false);

  // Security states
  const [jwtTokenToDecode, setJwtTokenToDecode] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c3JfODE5MjczOTEiLCJ0ZW5hbnRJZCI6Im9yZ18xIiwiZnVsbE5hbWUiOiJTb2hhbSBLaGFyYXQiLCJyb2xlIjoiT1dORVIiLCJ0aWVyIjoiUFJPRkVTU0lPTkFMIiwiaWF0IjoxNzg4NzA0MDAwLCJleHAiOjE3ODg4NzA0MDB9.x_B2B_SalesPilotMasterSignatureKeys');
  const [decodedJwt, setDecodedJwt] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess-1', ip: '157.51.92.14', browser: 'Chrome/122.0', os: 'macOS Sonoma', country: 'India', active: true, device: 'Desktop' },
    { id: 'sess-2', ip: '49.206.115.42', browser: 'Safari/17.4', os: 'iOS 17', country: 'India', active: true, device: 'Mobile' }
  ]);
  const [twoFactorStatus, setTwoFactorStatus] = useState<'DISABLED' | 'SETUP' | 'ENABLED'>('DISABLED');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Performance cache states
  const [cacheKeys, setCacheKeys] = useState([
    { key: 'tenant:org_1:leads:feed', size: '14.2 KB', ttl: '240s' },
    { key: 'campaigns:all:steps:registry', size: '42.5 KB', ttl: '840s' },
    { key: 'auth:session:usr_81927391', size: '1.1 KB', ttl: '1250s' },
    { key: 'gemini:analytics:regression:cache', size: '154.2 KB', ttl: '50s' }
  ]);
  const [cacheFlushSuccess, setCacheFlushSuccess] = useState(false);

  // Marketing customizer states
  const [mktHeroTitle, setMktHeroTitle] = useState('Deploy Your AI Sales Team in 5 Minutes.');
  const [mktTheme, setMktTheme] = useState<'cool' | 'cosmic' | 'warm'>('cosmic');

  // Checklist compliance states
  const [checklist, setChecklist] = useState([
    { id: 'chk-1', category: 'Infrastructure', text: 'Multi-Tenant isolation with Supabase RLS Row-Level Security policies', done: true },
    { id: 'chk-2', category: 'Infrastructure', text: 'Production DNS mappings, SSL validation, SPF/DKIM outreach handshakes', done: true },
    { id: 'chk-3', category: 'Inference', text: 'Server-side Gemini API model chaining with graceful offline fallbacks', done: true },
    { id: 'chk-4', category: 'Inference', text: 'Lazy SDK initialization to prevent startup server thread blockages', done: true },
    { id: 'chk-5', category: 'Security', text: 'Cryptographic SHA-256 JWT secure tokens validation on endpoint handshakes', done: true },
    { id: 'chk-6', category: 'Security', text: 'Active user authentication audit logs and session revocation capability', done: true },
    { id: 'chk-7', category: 'Payments', text: 'Cashfree Gateway integration and automatic GST compliant invoice compilation', done: true },
    { id: 'chk-8', category: 'Performance', text: 'Client-side LocalStorage cache backup with lightweight React state persistence', done: true },
    { id: 'chk-9', category: 'Performance', text: 'Optimized touch target targets (min 44px) on mobile swipe views', done: true },
    { id: 'chk-10', category: 'Testing', text: 'Complete Jest unit testing & automated Playwright E2E browser automation', done: true },
    { id: 'chk-11', category: 'CI/CD', text: 'GitHub Actions workflow with Docker builds pushed to container registry', done: true },
    { id: 'chk-12', category: 'Compliance', text: 'SOC2 Security parameters audit logging & GDPR data erasure endpoints ready', done: false }
  ]);

  // System logs/telemetry metrics (Simulated live performance)
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [INFRA] Registered tenant isolation group. Row level security validated.`,
    `[${new Date().toLocaleTimeString()}] [REDIS] Local server cache mapped. 4 keys pre-loaded into cluster.`,
    `[${new Date().toLocaleTimeString()}] [API] Swagger OpenAPI descriptor mapped at /api/v1/api-docs.`,
    `[${new Date().toLocaleTimeString()}] [MOBILE] Push Notification dispatch worker bound to Expo backend.`
  ]);

  // Calculate SaaS Launch Readiness Score
  const checkedCount = checklist.filter(c => c.done).length;
  const readinessPercentage = Math.floor((checkedCount / checklist.length) * 100);

  // Trigger automated log pushes
  useEffect(() => {
    const interval = setInterval(() => {
      const logs = [
        `[${new Date().toLocaleTimeString()}] [REDIS] Cache Hit ratio: 94.2% on static leads query.`,
        `[${new Date().toLocaleTimeString()}] [API] GET /api/v1/leads - Status 200 - Rate Limit quota: ${apiTokenBucket}/100`,
        `[${new Date().toLocaleTimeString()}] [MONITOR] System CPU threads: 14.5% - RAM Consumption: 1.84GB`,
        `[${new Date().toLocaleTimeString()}] [WEBHOOK] Pushed events queue synced with n8n workflow cluster.`,
        `[${new Date().toLocaleTimeString()}] [SECURITY] Validated secure JWT access token signature.`
      ];
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      setTelemetryLogs(prev => [...prev.slice(-15), randomLog]);

      // Dynamic rate limiter token recovery
      setApiTokenBucket(prev => Math.min(100, prev + 2));
    }, 4500);

    return () => clearInterval(interval);
  }, [apiTokenBucket]);

  // Run multi-tenant penetration audit simulation
  const runPenetrationCheck = () => {
    setIsAuditingTenants(true);
    setCrossTenantAuditLogs([
      `[${new Date().toLocaleTimeString()}] [AUDIT] Launching automated Cross-Tenant Vulnerability scanner...`,
      `[${new Date().toLocaleTimeString()}] [AUDIT] Target: Attempting query parameter injection bypass...`,
      `[${new Date().toLocaleTimeString()}] [AUDIT] Query payload: "SELECT * FROM leads WHERE organization_id = 'org-apex'" executed under user context "usr-1" (Horizon Media)`,
      `[${new Date().toLocaleTimeString()}] [BYPASS FAILURE] Supabase Row-Level Security policy triggered: RLS_RESTRICTION_MATCHED.`,
      `[${new Date().toLocaleTimeString()}] [BYPASS FAILURE] Data Access denied. Return empty array (0 records fetched).`,
      `[${new Date().toLocaleTimeString()}] [AUDIT] Testing SQL mapping vectors on raw db hooks...`,
      `[${new Date().toLocaleTimeString()}] [INTEGRITY CHECK] Secure schema isolated successfully. Zero information leaks detected.`
    ]);

    setTimeout(() => {
      setIsAuditingTenants(false);
    }, 2500);
  };

  // Run Live API explorer request
  const executeApiRequest = async () => {
    setApiLoading(true);
    setApiResponse(null);

    if (apiTokenBucket <= 10) {
      setApiResponse({
        error: "429 Too Many Requests",
        message: "API Rate limit exceeded for Starter tier token bucket. Throttle active.",
        cooldownSeconds: 30
      });
      setApiLoading(false);
      return;
    }

    try {
      if (apiEndpoint === 'leads') {
        const res = await fetch('/api/v1/leads');
        const data = await res.json();
        setApiResponse(data);
        setApiTokenBucket(prev => Math.max(0, prev - 15));
      } else if (apiEndpoint === 'enrich') {
        setApiResponse({
          success: true,
          leadId: "ld_fake_819",
          enrichedProfile: {
            companySize: "11-50 employees",
            techStack: ["React", "Express", "Vercel"],
            whyGoodProspect: "Currently utilizing manual email Outreach sequence tools without automatic CRM integrations."
          }
        });
        setApiTokenBucket(prev => Math.max(0, prev - 25));
      } else {
        setApiResponse({
          success: true,
          cluster: "asia-south-1-node-a",
          status: "HEALTHY",
          uptime: "21.2 days",
          latencyMs: 14,
          memoryMb: 1840
        });
        setApiTokenBucket(prev => Math.max(0, prev - 5));
      }
    } catch (e: any) {
      setApiResponse({ error: "Network error", message: e.message });
    } finally {
      setApiLoading(false);
    }
  };

  // Simulate API query spikes to demonstrate rate limit triggers
  const triggerApiSpike = () => {
    setApiSpikeActive(true);
    setApiTokenBucket(0);
    setApiResponse({
      error: "429 Too Many Requests",
      message: "API Rate limit exceeded for Professional tier. Row request throttled via Token Bucket algorithm.",
      rateLimitClass: "TenantRateLimiter",
      policy: "REJECT_OUT_OF_TOKENS",
      clientIp: "157.51.92.14"
    });
    setTelemetryLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [THROTTLE] API Rate Limit exceeded for client IP 157.51.92.14. Returning 429 Error.`
    ]);
    setTimeout(() => setApiSpikeActive(false), 2000);
  };

  // Run Outbound Webhook Test Dispatcher
  const dispatchTestWebhook = () => {
    setIsSendingWebhook(true);
    const newLogId = `whl-${Date.now()}`;
    
    // Simulate exponential backoff retry schedules
    const mockWebhookLog = {
      id: newLogId,
      timestamp: new Date().toLocaleTimeString(),
      event: webhookEvent,
      url: webhookUrl,
      status: 200,
      attempt: 1,
      backoffMs: 0,
      response: '{"success":true,"received":true,"jobId":"n8n_work_19a2"}'
    };

    setWebhookLogs(prev => [mockWebhookLog, ...prev]);
    setTelemetryLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [WEBHOOK] Outgoing payload dispatched for event "${webhookEvent}" to ${webhookUrl}. HTTP 200 OK.`
    ]);

    setTimeout(() => {
      setIsSendingWebhook(false);
    }, 1200);
  };

  // Simulate Webhook dispatch failure with exponential backoff retries
  const simulateWebhookFailure = () => {
    setIsSendingWebhook(true);
    const timestamp = new Date().toLocaleTimeString();
    
    // Create detailed retry logs showing production-ready retry architecture!
    const failId = `whf-${Date.now()}`;
    const retryLogs = [
      { id: `${failId}-1`, timestamp, event: webhookEvent, url: "https://invalid-endpoint-target.org/hook", status: 504, attempt: 1, backoffMs: 1000, response: "Gateway Timeout" },
      { id: `${failId}-2`, timestamp, event: webhookEvent, url: "https://invalid-endpoint-target.org/hook", status: 504, attempt: 2, backoffMs: 2000, response: "Gateway Timeout (Retrying with 2s delay)" },
      { id: `${failId}-3`, timestamp, event: webhookEvent, url: "https://invalid-endpoint-target.org/hook", status: 504, attempt: 3, backoffMs: 4000, response: "Gateway Timeout (Retrying with 4s delay)" },
      { id: `${failId}-4`, timestamp, event: webhookEvent, url: "https://invalid-endpoint-target.org/hook", status: 504, attempt: 4, backoffMs: 8000, response: "Gateway Timeout (Retrying with 8s delay)" },
      { id: `${failId}-5`, timestamp, event: webhookEvent, url: "https://invalid-endpoint-target.org/hook", status: 504, attempt: 5, backoffMs: 16000, response: "Critical Failure: Maximum retry limit (5) reached. Moving payload to Dead Letter Queue (DLQ)." }
    ];

    setWebhookLogs(prev => [...retryLogs, ...prev]);
    setTelemetryLogs(prev => [
      ...prev,
      `[${timestamp}] [WEBHOOK] Dispatch failure. Initiated exponential backoff retries on endpoint.`
    ]);

    setTimeout(() => {
      setIsSendingWebhook(false);
    }, 1500);
  };

  // DNS settings resolution simulation
  const runDnsHandshake = () => {
    setDnsStatus('RESOLVING');
    setDnsChecks({ aRecord: false, spfRecord: false, dkimRecord: false, sslCert: false });

    setTimeout(() => {
      setDnsChecks({ aRecord: true, spfRecord: true, dkimRecord: false, sslCert: false });
    }, 800);

    setTimeout(() => {
      setDnsChecks({ aRecord: true, spfRecord: true, dkimRecord: true, sslCert: true });
      setDnsStatus('VALIDATED');
      setTelemetryLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [DNS] Custom domain mapping outreach.horizonmedia.co successfully routed and bound to secure SSL certificate.`
      ]);
    }, 1800);
  };

  // Omnichannel notification trigger
  const triggerNotification = () => {
    setIsSendingNotice(true);
    const time = 'Just now';

    setTimeout(() => {
      const newNotice = {
        id: `notq-${Date.now()}`,
        type: notificationType.toUpperCase(),
        recipient: notifyTarget,
        message: notifyMessage,
        status: 'DISPATCHED',
        time
      };

      setNotificationQueue(prev => [newNotice, ...prev]);
      setIsSendingNotice(false);
      setTelemetryLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [NOTIFICATION] Dynamic ${notificationType} dispatched to ${notifyTarget}. Status: DELIVERED.`
      ]);
    }, 1000);
  };

  // JWT Token Decoder
  const decodeJwtToken = () => {
    try {
      const parts = jwtTokenToDecode.split('.');
      if (parts.length !== 3) {
        setDecodedJwt({ error: "Invalid token structure (Must be 3 parts separated by dots)" });
        return;
      }
      const payload = JSON.parse(atob(parts[1]));
      setDecodedJwt(payload);
    } catch (e: any) {
      setDecodedJwt({ error: "Failed to decode Base64 payload. Please supply standard JWT." });
    }
  };

  // Clear cache keys
  const flushRedisCache = () => {
    setCacheFlushSuccess(true);
    setCacheKeys([]);
    setTelemetryLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [REDIS] Redis cache flushed. Cache-Hit ratio reset to 0%.`
    ]);
    setTimeout(() => {
      setCacheFlushSuccess(false);
    }, 2000);
  };

  // Send push notification into dynamic smartphone simulator
  const dispatchMockPushToPhone = () => {
    const newToast = {
      id: `toast-${Date.now()}`,
      title: pushTitle,
      body: pushBody
    };
    setPhoneToasts(prev => [...prev, newToast]);
    setTelemetryLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [PUSH] Dispatched Expo Push Token alert: ${pushTitle}`
    ]);
    setTimeout(() => {
      setPhoneToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4500);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-850 dark:text-slate-100">
      
      {/* Launch Center Title block */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
          <Rocket className="w-96 h-96" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-mono font-bold text-[9px] px-2.5 py-0.5 rounded-full tracking-wider uppercase flex items-center gap-1">
              <Rocket className="w-2.5 h-2.5" /> ENTERPRISE CORE ENGINE
            </span>
            <span className="text-slate-500 font-mono text-[10px]">&bull; Scale-ready: 100,000+ Tenants</span>
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white flex items-center gap-2">
            Enterprise SaaS Launch Center
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Test and manage all 15 cloud scalability modules of SalesPilot. Interact with mobile app screen simulators, test REST APIs with live sandbox data, debug webhook retries with backoff, and audit Row-Level Security in real-time.
          </p>
        </div>

        {/* Global Progress Gauge */}
        <div className="bg-slate-950/80 p-4 border border-slate-850 rounded-xl flex items-center gap-4 relative z-10 shrink-0 min-w-[220px]">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase">
              <span>SaaS Compliance</span>
              <span className="text-blue-400">{readinessPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${readinessPercentage}%` }} />
            </div>
            <div className="text-[9px] text-slate-550 font-mono">
              {checkedCount} of {checklist.length} core checks passed
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-blue-950/50 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Rocket className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Grid: Navigation modules and action console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation panel */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-1">
            <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2.5 mb-2 font-bold">Scaling Suite</span>
            
            {[
              { id: 'checklist', label: '15. Launch Checklist', icon: CheckSquare },
              { id: 'mobile', label: '1 & 2. Mobile Apps', icon: Smartphone },
              { id: 'api', label: '3. Public REST API', icon: Code },
              { id: 'webhooks', label: '4. Webhooks Hub', icon: Database },
              { id: 'white-label', label: '5. White Label Domains', icon: Globe },
              { id: 'multi-tenant', label: '6. Multi-Tenant RLS', icon: Users },
              { id: 'notifications', label: '7. Omnichannel Notices', icon: Bell },
              { id: 'security', label: '8. Audit & Security', icon: Lock },
              { id: 'monitoring', label: '9. Cluster Monitor', icon: Cpu },
              { id: 'performance', label: '10. Caching & CDN', icon: Activity },
              { id: 'cicd', label: '11 & 12. Actions & Docker', icon: Terminal },
              { id: 'marketing', label: '13 & 14. Marketing Site', icon: Layout }
            ].map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModuleTab === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModuleTab(mod.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick System Telemetry Panel */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[9px] leading-relaxed space-y-2 text-slate-450 h-52 overflow-y-auto">
            <div className="flex justify-between items-center text-blue-400 font-bold uppercase border-b border-slate-900 pb-1 mb-1">
              <span>SYSTEM EVENT BUS</span>
              <span className="flex items-center gap-1 text-[8px] text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> LIVE
              </span>
            </div>
            {telemetryLogs.map((log, index) => (
              <div key={index} className="border-b border-slate-900/40 pb-1 last:border-0 last:pb-0 break-all text-slate-300">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Master details pane */}
        <div className="lg:col-span-9">

          {/* ======================================================== */}
          {/* TAB 15: LAUNCH CHECKLIST & COMPLIANCE */}
          {/* ======================================================== */}
          {activeModuleTab === 'checklist' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Enterprise Launch Audit Checklist</h3>
                  <p className="text-xs text-slate-400 font-mono">Verify and toggle the readiness parameters of your SaaS tenant workspace.</p>
                </div>
                <Award className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, done: !c.done } : c));
                      setTelemetryLogs(prev => [
                        ...prev,
                        `[${new Date().toLocaleTimeString()}] [AUDIT] Compliance task "${item.text}" marked as ${!item.done ? 'COMPLETED' : 'PENDING'}`
                      ]);
                    }}
                    className={`w-full text-left p-4 rounded-xl border text-xs flex gap-3 transition-all cursor-pointer items-start ${
                      item.done 
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-350' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.done ? (
                        <CheckSquare2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold block mb-0.5 text-slate-400">
                        {item.category}
                      </span>
                      <p className="font-semibold">{item.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1 & 2: MOBILE APPLICATIONS */}
          {/* ======================================================== */}
          {activeModuleTab === 'mobile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Smartphone Simulator */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-72 h-[560px] bg-slate-950 border-[10px] border-slate-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                  {/* Dynamic phone toasts / pushes */}
                  <div className="absolute top-12 left-4 right-4 z-50 space-y-2">
                    {phoneToasts.map((t) => (
                      <div key={t.id} className="bg-slate-900/90 border border-slate-700/50 rounded-xl p-3 shadow-lg backdrop-blur-md animate-bounce">
                        <div className="flex justify-between items-center text-[10px] font-mono text-blue-400 font-bold">
                          <span>SalesPilot Alert</span>
                          <span className="text-[8px] text-slate-450">Just now</span>
                        </div>
                        <div className="text-white text-[11px] font-bold mt-0.5">{t.title}</div>
                        <div className="text-slate-300 text-[10px] leading-snug mt-0.5">{t.body}</div>
                      </div>
                    ))}
                  </div>

                  {/* Top notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 flex items-center justify-between px-6 z-45 text-[9px] text-white font-mono">
                    <span>9:41</span>
                    <div className="w-20 h-4 bg-slate-950 rounded-b-xl mx-auto absolute left-1/2 transform -translate-x-1/2" />
                    <div className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-white" />
                      <span>5G</span>
                    </div>
                  </div>

                  {/* Smartphone screen contents */}
                  <div className="flex-grow pt-8 pb-12 px-4 bg-slate-900 overflow-y-auto flex flex-col justify-between text-xs">
                    
                    {mobileScreen === 'chat' && (
                      <div className="flex flex-col h-full justify-between space-y-4">
                        <div className="border-b border-slate-800 pb-2 text-center">
                          <h4 className="font-bold text-white text-xs">Aero Client Chat</h4>
                          <span className="text-[8px] text-slate-400 font-mono uppercase">Decentralized Astra Core Node</span>
                        </div>
                        <div className="flex-1 space-y-3 pt-2">
                          <div className="p-2 bg-slate-850 rounded-lg text-slate-300 text-[10px]">
                            <strong>Astra AI:</strong> Welcome to SalesPilot. Tell me which qualified lead you want me to write a sequence for?
                          </div>
                          <div className="p-2 bg-blue-600 text-white rounded-lg text-[10px] self-end max-w-[80%] ml-auto text-right">
                            Write follow up on Sneha Kapoor for SaaS outreach plan.
                          </div>
                          <div className="p-2 bg-slate-850 rounded-lg text-slate-300 text-[10px] animate-pulse">
                            <strong>Aero composition logic:</strong> Analyzing CloudFlow HR tech stack profiles. Composing customized INR plan proposal...
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <input type="text" placeholder="Ask Aero Strategist..." className="flex-grow bg-slate-800 text-white text-[10px] rounded px-2.5 py-1 focus:outline-none" readOnly />
                          <button className="p-1 bg-blue-600 rounded text-white"><Send className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}

                    {mobileScreen === 'pipeline' && (
                      <div className="space-y-3">
                        <div className="border-b border-slate-800 pb-2 text-center">
                          <h4 className="font-bold text-white text-xs">Pipeline Tracker</h4>
                          <span className="text-[8px] text-slate-400 font-mono">Touch targets: 46px validated</span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center cursor-pointer min-h-[46px]">
                            <div>
                              <div className="font-bold text-white text-[10px]">Ananya Sharma</div>
                              <div className="text-[9px] text-slate-400 font-mono">Apex Marketing &bull; ₹125,000</div>
                            </div>
                            <span className="text-[8px] font-mono bg-blue-950 text-blue-400 font-bold px-1.5 py-0.5 rounded">NEGOTIATE</span>
                          </div>
                          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center cursor-pointer min-h-[46px]">
                            <div>
                              <div className="font-bold text-white text-[10px]">Sneha Kapoor</div>
                              <div className="text-[9px] text-slate-400 font-mono">CloudFlow SaaS &bull; ₹45,000</div>
                            </div>
                            <span className="text-[8px] font-mono bg-indigo-950 text-indigo-400 font-bold px-1.5 py-0.5 rounded">DEMO SCHEDULED</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {mobileScreen === 'smtp' && (
                      <div className="space-y-3">
                        <div className="border-b border-slate-800 pb-2 text-center">
                          <h4 className="font-bold text-white text-xs">SMTP Reputation</h4>
                          <span className="text-[8px] text-slate-400 font-mono">Warmup bots live</span>
                        </div>
                        <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-mono">outreach@horizonmedia.co</span>
                            <span className="text-emerald-400 font-bold font-mono">98.4% score</span>
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }} />
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono uppercase">
                            Delivered: 120 | Bounces: 0
                          </div>
                        </div>
                      </div>
                    )}

                    {mobileScreen === 'enrich' && (
                      <div className="space-y-3">
                        <div className="border-b border-slate-800 pb-2 text-center">
                          <h4 className="font-bold text-white text-xs">Enrichment Stream</h4>
                          <span className="text-[8px] text-slate-400 font-mono">Gemini live scraping</span>
                        </div>
                        <div className="p-2.5 bg-slate-850 border border-slate-800 rounded-lg text-slate-300 font-mono text-[9px] leading-relaxed">
                          <div className="text-emerald-400 font-bold mb-0.5">[SUCCESS] SNEHA KAPOOR</div>
                          <div>CEO at CloudFlow SaaS</div>
                          <div>Size: 1-10 Employees</div>
                          <div>Tech: React, Supabase, Stripe</div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Bottom bar nav */}
                  <div className="absolute bottom-0 inset-x-0 h-12 bg-slate-950 border-t border-slate-850 flex items-center justify-around px-4">
                    {[
                      { id: 'chat', label: 'Chat' },
                      { id: 'pipeline', label: 'Pipeline' },
                      { id: 'smtp', label: 'SMTP' },
                      { id: 'enrich', label: 'Scraper' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setMobileScreen(tab.id as any)}
                        className={`text-[8px] font-mono uppercase font-bold transition cursor-pointer ${
                          mobileScreen === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right smartphone code views & test push dispatcher */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Expo Mobile Push Dispatcher</span>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Push Alert Title</label>
                      <input 
                        type="text" 
                        value={pushTitle} 
                        onChange={(e) => setPushTitle(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Push Message Body</label>
                      <input 
                        type="text" 
                        value={pushBody} 
                        onChange={(e) => setPushBody(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2" 
                      />
                    </div>
                  </div>

                  <button
                    onClick={dispatchMockPushToPhone}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Test Push Notification
                  </button>
                </div>

                {/* React Native Expo Code Explorer */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Mobile Code Repository Explorer</span>
                    <div className="flex gap-2">
                      {['app-json', 'chat-screen', 'push-service'].map((fileTab) => (
                        <button
                          key={fileTab}
                          onClick={() => setMobileCodeTab(fileTab as any)}
                          className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase cursor-pointer border ${
                            mobileCodeTab === fileTab 
                              ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {fileTab}.ts
                        </button>
                      ))}
                    </div>
                  </div>

                  {mobileCodeTab === 'chat-screen' && (
                    <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-[9px] leading-relaxed rounded-lg overflow-x-auto max-h-56">
{`import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../services/supabaseClient';

export default function ChatScreen() {
  const [messages, setMessages] = useState([{ id: '1', text: 'Aero initialized. How can I assist?' }]);
  const [inputText, setInputText] = useState('');

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const newMsg = { id: Date.now().toString(), text: inputText };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    
    // Call serverless Gemini proxy
    const res = await fetch('https://api.salespilot.co/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: inputText })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { id: Date.now().toString(), text: data.reply }]);
  };

  return (
    <View style={styles.container}>
      <FlatList data={messages} renderItem={({ item }) => <Text style={styles.bubble}>{item.text}</Text>} />
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} value={inputText} onChangeText={setInputText} />
        <TouchableOpacity style={styles.btn} onPress={sendMessage}><Text>Send</Text></TouchableOpacity>
      </View>
    </View>
  );
}`}
                    </pre>
                  )}

                  {mobileCodeTab === 'app-json' && (
                    <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-[9px] leading-relaxed rounded-lg overflow-x-auto max-h-56">
{`{
  "expo": {
    "name": "SalesPilot Mobile Client",
    "slug": "salespilot-client",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f172a"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.salespilot.client"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      },
      "package": "com.salespilot.client"
    },
    "plugins": ["expo-notifications", "expo-secure-store"]
  }
}`}
                    </pre>
                  )}

                  {mobileCodeTab === 'push-service' && (
                    <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-[9px] leading-relaxed rounded-lg overflow-x-auto max-h-56">
{`import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to obtain push notification permissions token.');
    return;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Mobile Push Token mapped successfully:', token);
  
  // Store securely and map to Supabase User table
  await SecureStore.setItemAsync('push_token', token);
  return token;
}`}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PUBLIC REST & OPENAPI EXPLORER */}
          {/* ======================================================== */}
          {activeModuleTab === 'api' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">OpenAPI REST Endpoint Sandbox</h3>
                  <p className="text-xs text-slate-400 font-mono">Verify actual database query responses through direct gateway endpoints routing.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">API Rate Quota</span>
                    <span className="font-semibold text-xs font-mono text-emerald-400">{apiTokenBucket} / 100 req/min</span>
                  </div>
                  <button 
                    onClick={triggerApiSpike}
                    disabled={apiSpikeActive}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 font-semibold text-xs rounded text-white cursor-pointer shadow-xs font-mono"
                  >
                    Spike Queries (429 Test)
                  </button>
                </div>
              </div>

              {/* Endpoint configurations */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left controls */}
                <div className="md:col-span-4 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Configure REST Call</span>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Gateway Endpoint</label>
                      <select 
                        value={apiEndpoint} 
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setApiEndpoint(val);
                          setApiMethod(val === 'enrich' ? 'POST' : 'GET');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 font-mono text-xs cursor-pointer"
                      >
                        <option value="leads">GET /api/v1/leads</option>
                        <option value="enrich">POST /api/v1/leads/:id/enrich</option>
                        <option value="telemetry">GET /api/v1/health</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">HTTP Request Method</label>
                      <span className="font-mono font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded">
                        {apiMethod}
                      </span>
                    </div>

                    {apiMethod === 'POST' && (
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">JSON Body Parameters</label>
                        <textarea 
                          rows={4} 
                          value={apiPayload} 
                          onChange={(e) => setApiPayload(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 font-mono text-[10px]"
                        />
                      </div>
                    )}

                    <button
                      onClick={executeApiRequest}
                      disabled={apiLoading}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {apiLoading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Play className="w-4 h-4" />}
                      Execute REST Call
                    </button>
                  </div>
                </div>

                {/* Right developer panes */}
                <div className="md:col-span-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Sandbox Developer Response Terminal</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">CURL GENERATOR:</span>
                  </div>

                  {/* curl snippet code */}
                  <div className="p-3 bg-slate-950 rounded-lg font-mono text-[9px] text-slate-350 select-all border border-slate-900 leading-relaxed">
                    curl -X {apiMethod} "https://api.salespilot.co/api/v1/{apiEndpoint === 'leads' ? 'leads' : apiEndpoint === 'enrich' ? 'leads/ld_1/enrich' : 'health'}" \
                    <br />&nbsp;&nbsp;-H "Authorization: Bearer sp_live_8a1f9d" \
                    {apiMethod === 'POST' && <><br />&nbsp;&nbsp;-H "Content-Type: application/json" \<br />&nbsp;&nbsp;-d '{apiPayload.replace(/\n/g, '')}'</>}
                  </div>

                  {/* REST response console */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] leading-relaxed h-56 overflow-y-auto shadow-inner text-slate-300">
                    {apiLoading ? (
                      <div className="text-blue-400 animate-pulse">[INFO] Performing dynamic database transaction and parsing response payloads...</div>
                    ) : apiResponse ? (
                      <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                    ) : (
                      <div className="text-slate-500">[IDLE] Response payload is currently empty. Click 'Execute REST Call' above to query live Supabase collections.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: WEBHOOKS DISPATCHER & DELIVERY HUB */}
          {/* ======================================================== */}
          {activeModuleTab === 'webhooks' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Bi-Directional Webhooks Orchestrator</h3>
                  <p className="text-xs text-slate-400 font-mono">Synchronize campaigns workflows with n8n triggers or execute automated retries testing.</p>
                </div>
                <Database className="w-5 h-5 text-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left triggers */}
                <div className="md:col-span-5 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Webhook Config</span>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Outbound Target Endpoint URL</label>
                      <input 
                        type="url" 
                        value={webhookUrl} 
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Trigger Event Heuristics</label>
                      <select 
                        value={webhookEvent} 
                        onChange={(e) => setWebhookEvent(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 cursor-pointer font-semibold"
                      >
                        <option value="lead.qualified">lead.qualified (Astra verified lead)</option>
                        <option value="meeting.scheduled">meeting.scheduled (Google Meet booker)</option>
                        <option value="deal.won">deal.won (Cashfree callback completed)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={dispatchTestWebhook}
                        disabled={isSendingWebhook}
                        className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        {isSendingWebhook ? 'Sending...' : 'Dispatch Hook'}
                      </button>
                      <button
                        onClick={simulateWebhookFailure}
                        disabled={isSendingWebhook}
                        className="py-2 bg-rose-650 hover:bg-rose-600 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        Fail (Retry Test)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right dynamic delivery logs */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Webhook Logs (Exponential Backoff Monitoring)</span>
                    <button 
                      onClick={() => setWebhookLogs([])}
                      className="text-[10px] font-mono text-slate-400 hover:text-red-500"
                    >
                      Clear Logs
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {webhookLogs.length > 0 ? (
                      webhookLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-slate-950 text-slate-300 font-mono text-[9px] rounded-lg border border-slate-900 leading-relaxed">
                          <div className="flex justify-between items-center text-blue-400 font-bold mb-1">
                            <span>EVENT: {log.event}</span>
                            <span className={log.status === 200 ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}>
                              STATUS: {log.status} (Attempt {log.attempt}/5)
                            </span>
                          </div>
                          <div>Target: {log.url}</div>
                          <div>Retry Backoff Delay: {log.backoffMs} ms</div>
                          <div className="mt-1 text-slate-400 bg-slate-900 p-1.5 rounded text-[8px] break-all">
                            {log.response}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 font-mono text-xs">
                        [IDLE] Webhook pipeline queues are clear. Run a test dispatch.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: WHITE LABEL & DOMAINS PROVISIONING */}
          {/* ======================================================== */}
          {activeModuleTab === 'white-label' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Custom Brand & SSL Domain Provisioning</h3>
                  <p className="text-xs text-slate-400 font-mono">Map custom subdomains with automatic SPF, DKIM, DMARC, and SSL route handshakes.</p>
                </div>
                <Globe className="w-5 h-5 text-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left config form */}
                <div className="md:col-span-5 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">White Label Configuration</span>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Tenant Custom Outreach Domain</label>
                      <input 
                        type="text" 
                        value={customDomain} 
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="outreach.horizonmedia.in"
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Custom Platform Name</label>
                      <input 
                        type="text" 
                        value={brandLogoText} 
                        onChange={(e) => setLogoText(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Custom Brand Theme Palette</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={brandColor} 
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-200 bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={brandColor} 
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="flex-grow bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded px-2 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={runDnsHandshake}
                      disabled={dnsStatus === 'RESOLVING'}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      {dnsStatus === 'RESOLVING' ? 'Resolving DNS Handshake...' : 'Run DNS Propagation Handshake'}
                    </button>
                  </div>
                </div>

                {/* Right DNS records panel */}
                <div className="md:col-span-7 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">DNS Records Mappings Validator</span>
                  
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-700 dark:text-slate-350">A RECORD (IP Routing)</div>
                        <div className="text-[10px] text-slate-400">Host: @ | Value: 34.120.180.12</div>
                      </div>
                      <span className={dnsChecks.aRecord ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {dnsChecks.aRecord ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : "PENDING"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-700 dark:text-slate-350">TXT RECORD (SPF Security)</div>
                        <div className="text-[10px] text-slate-400">Host: @ | Value: v=spf1 include:mail.salespilot.co ~all</div>
                      </div>
                      <span className={dnsChecks.spfRecord ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {dnsChecks.spfRecord ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : "PENDING"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-700 dark:text-slate-350">TXT RECORD (DKIM Cryptography)</div>
                        <div className="text-[10px] text-slate-400">Host: sp._domainkey | Value: k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AM...</div>
                      </div>
                      <span className={dnsChecks.dkimRecord ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {dnsChecks.dkimRecord ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : "PENDING"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-700 dark:text-slate-350">SSL Certificate Verification</div>
                        <div className="text-[10px] text-slate-400">Let's Encrypt Wildcard Handshake SSL Secure Binding</div>
                      </div>
                      <span className={dnsChecks.sslCert ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {dnsChecks.sslCert ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: MULTI-TENANCY RBAC ROW LEVEL SECURITY ISOLATION */}
          {/* ======================================================== */}
          {activeModuleTab === 'multi-tenant' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Supabase Row-Level Security (RLS) Breach Auditor</h3>
                  <p className="text-xs text-slate-400 font-mono">Verify tenant database isolation, preventing cross-organization data leakage vectors.</p>
                </div>
                <button
                  onClick={runPenetrationCheck}
                  disabled={isAuditingTenants}
                  className="px-4 py-1.5 bg-rose-650 hover:bg-rose-600 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ShieldAlert className="w-4 h-4" /> Run Penetration Check
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Active Tenant select */}
                <div className="md:col-span-5 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Select Active Tenant Simulation Scope</span>
                  
                  <div className="space-y-2">
                    {rbacUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedTenantUser(u.id)}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition flex justify-between items-center cursor-pointer ${
                          selectedTenantUser === u.id 
                            ? 'border-blue-500 bg-blue-50/10 font-bold text-blue-600 dark:text-blue-400' 
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{u.orgName} | {u.email}</div>
                        </div>
                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded font-bold">
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Auditor Logs terminal */}
                <div className="md:col-span-7 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Vulnerability Assessment Logs</span>
                  
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] leading-relaxed h-56 overflow-y-auto shadow-inner text-slate-300">
                    {isAuditingTenants ? (
                      <div className="space-y-1">
                        <div className="text-blue-400 animate-pulse">[INFO] Initializing raw SQL vector injection vectors...</div>
                        <div className="text-blue-400 animate-pulse">[INFO] Bypassing auth proxy layers directly mapping to supabase socket connections...</div>
                      </div>
                    ) : crossTenantAuditLogs.length > 0 ? (
                      crossTenantAuditLogs.map((logLine, index) => (
                        <div 
                          key={index} 
                          className={logLine.includes('[BYPASS FAILURE]') ? 'text-emerald-400 font-bold' : logLine.includes('[INTEGRITY CHECK]') ? 'text-cyan-400 font-bold' : 'text-slate-300'}
                        >
                          {logLine}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500">[IDLE] Penetration logs empty. Click 'Run Penetration Check' above to trigger synthetic cross-tenant injection test.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: OMNICHANNEL NOTIFICATION ENGINE */}
          {/* ======================================================== */}
          {activeModuleTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Omnichannel Dispatch Command Center</h3>
                  <p className="text-xs text-slate-400 font-mono">Configure dispatch payloads templates and monitor queues across Email, Push, Slack, and WhatsApp.</p>
                </div>
                <Bell className="w-5 h-5 text-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left controls */}
                <div className="md:col-span-5 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Configure Test Dispatch</span>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Outbound Delivery Channel</label>
                      <select 
                        value={notificationType} 
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setNotificationType(val);
                          setNotifyTarget(
                            val === 'email' ? 'sohamkharat481@gmail.com' :
                            val === 'push' ? 'expo_push_token_8192a' :
                            val === 'slack' ? '#sales-alerts' : '+91 98765 43210'
                          );
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 cursor-pointer font-bold"
                      >
                        <option value="email">SMTP Email Drip</option>
                        <option value="push">Expo Client Push Notification</option>
                        <option value="slack">Incoming Slack Webhook</option>
                        <option value="whatsapp">Twilio WhatsApp Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Target Address / Token / Channel ID</label>
                      <input 
                        type="text" 
                        value={notifyTarget} 
                        onChange={(e) => setNotifyTarget(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Template Message Body (supports tokens)</label>
                      <textarea 
                        rows={3} 
                        value={notifyMessage} 
                        onChange={(e) => setNotifyMessage(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2"
                      />
                    </div>

                    <button
                      onClick={triggerNotification}
                      disabled={isSendingNotice}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-sm"
                    >
                      {isSendingNotice ? 'Dispatching...' : 'Dispatch Live Notice'}
                    </button>
                  </div>
                </div>

                {/* Right queue logs */}
                <div className="md:col-span-7 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Global Dispatcher Outbox Queue</span>
                  
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {notificationQueue.map((notice) => (
                      <div key={notice.id} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-lg text-[11px] leading-relaxed relative">
                        <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-250 mb-1 font-mono">
                          <span>CHANNEL: {notice.type}</span>
                          <span className="text-emerald-500 font-mono font-bold text-[9px] bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800/10">
                            {notice.status}
                          </span>
                        </div>
                        <div>Target: <strong className="font-mono text-[10px]">{notice.recipient}</strong></div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 italic">"{notice.message}"</p>
                        <span className="text-[8px] text-slate-400 font-mono absolute top-2.5 right-24">{notice.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: AUDIT SECURITY, JWT & 2FA */}
          {/* ======================================================== */}
          {activeModuleTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active Sessions Security Audits & JWT Decoders</h3>
                  <p className="text-xs text-slate-400 font-mono">Decode cryptographic user tokens or manage multi-factor authentication enrollment states.</p>
                </div>
                <Lock className="w-5 h-5 text-blue-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: JWT token input and decoded parameters */}
                <div className="lg:col-span-6 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">JWT Signature Parser</span>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Paste Active Access JWT Token</label>
                      <textarea 
                        rows={3} 
                        value={jwtTokenToDecode} 
                        onChange={(e) => setJwtTokenToDecode(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 font-mono text-[10px]"
                      />
                    </div>

                    <button
                      onClick={decodeJwtToken}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-lg cursor-pointer font-mono"
                    >
                      Decode Claims
                    </button>

                    {decodedJwt && (
                      <div className="p-3 bg-slate-950 text-slate-300 rounded border border-slate-850 font-mono text-[10px] space-y-1.5 shadow-inner">
                        <div className="text-blue-400 font-bold border-b border-slate-900 pb-1 mb-1 uppercase text-[8px]">Decoded payload parameters:</div>
                        {decodedJwt.error ? (
                          <div className="text-rose-400">{decodedJwt.error}</div>
                        ) : (
                          Object.keys(decodedJwt).map((k) => (
                            <div key={k}>
                              <span className="text-slate-500">{k}:</span> <strong>{JSON.stringify(decodedJwt[k])}</strong>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right user session lists and 2FA enrollment */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Active Multi-Tenant Session Auditing</span>
                    
                    <div className="space-y-2.5">
                      {activeSessions.map((sess) => (
                        <div key={sess.id} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-lg text-xs flex justify-between items-center font-mono">
                          <div>
                            <div className="font-bold text-slate-700 dark:text-slate-350">{sess.ip} &bull; {sess.country}</div>
                            <div className="text-[10px] text-slate-400">{sess.browser} | {sess.os}</div>
                          </div>
                          <button
                            onClick={() => {
                              setActiveSessions(prev => prev.filter(s => s.id !== sess.id));
                              setTelemetryLogs(prev => [
                                ...prev,
                                `[${new Date().toLocaleTimeString()}] [REVOKE] Administrative session revocation executed for IP ${sess.ip}. Token expired.`
                              ]);
                            }}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-400 transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-500/10 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">SaaS 2FA Authentication Setup</span>
                    
                    {twoFactorStatus === 'DISABLED' ? (
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                          <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&auto=format&fit=crop&q=40" alt="2FA QR" className="w-full h-full opacity-60 filter grayscale" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-500">Secure organization owners with Authenticator (TOTP) codes.</p>
                          <button 
                            onClick={() => setTwoFactorStatus('SETUP')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded cursor-pointer"
                          >
                            Enable 2FA
                          </button>
                        </div>
                      </div>
                    ) : twoFactorStatus === 'SETUP' ? (
                      <div className="space-y-2 text-xs">
                        <p className="text-[11px] font-semibold">Enter 6-digit verification pin to validate authentication hook:</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            maxLength={6} 
                            placeholder="e.g. 128912" 
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 font-mono text-xs max-w-[120px]"
                          />
                          <button 
                            onClick={() => {
                              if (twoFactorCode.length === 6) {
                                setTwoFactorStatus('ENABLED');
                                setTelemetryLogs(prev => [
                                  ...prev,
                                  `[${new Date().toLocaleTimeString()}] [2FA] Enterprise multi-factor authenticator enrollment completed successfully.`
                                ]);
                              }
                            }}
                            className="px-3 py-1 bg-emerald-600 text-white font-bold rounded"
                          >
                            Confirm code
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>TOTP 2FA Verification Hooks fully enabled on workspace login profiles.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 9: LIVE CLUSTER MONITORING */}
          {/* ======================================================== */}
          {activeModuleTab === 'monitoring' && (
            <div className="space-y-6">
              
              {/* Telemetry charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">Dynamic Cluster Load Heuristics</h3>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Average Cloud Run API request traffic</p>
                  </div>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: '10s', load: 15 },
                        { name: '20s', load: 24 },
                        { name: '30s', load: 42 },
                        { name: '40s', load: 38 },
                        { name: '50s', load: 65 },
                        { name: '60s', load: 45 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} />
                        <Area type="monotone" dataKey="load" stroke="#3b82f6" fillOpacity={0.15} fill="#3b82f6" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">Inference latency</h3>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Average token generation speeds (ms)</p>
                  </div>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: '10s', speed: 180 },
                        { name: '20s', speed: 195 },
                        { name: '30s', speed: 140 },
                        { name: '40s', speed: 165 },
                        { name: '50s', speed: 130 },
                        { name: '60s', speed: 110 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} />
                        <Area type="monotone" dataKey="speed" stroke="#10b981" fillOpacity={0.15} fill="#10b981" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Service Health Metrics */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Micro-service clusters telemetry health map</span>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-800">
                    <div className="text-[9px] text-slate-450 font-mono">ASTRA_PUPPETEER_CRAWLER</div>
                    <div className="text-xs font-bold mt-1 text-emerald-500 font-mono">ACTIVE (100%)</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-800">
                    <div className="text-[9px] text-slate-450 font-mono">GEMINI_INFERENCE_ROUTER</div>
                    <div className="text-xs font-bold mt-1 text-emerald-500 font-mono">ACTIVE (100%)</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-800">
                    <div className="text-[9px] text-slate-450 font-mono">REDIS_MEMORY_CACHE</div>
                    <div className="text-xs font-bold mt-1 text-emerald-500 font-mono">ACTIVE (100%)</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded border border-slate-150 dark:border-slate-800">
                    <div className="text-[9px] text-slate-450 font-mono">SUPABASE_POSTGRES_DB</div>
                    <div className="text-xs font-bold mt-1 text-emerald-500 font-mono">ACTIVE (100%)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 10: REDIS CACHING & PERFORMANCE */}
          {/* ======================================================== */}
          {activeModuleTab === 'performance' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Redis Cluster Caching Node Control</h3>
                  <p className="text-xs text-slate-400 font-mono">Inspect dynamic caching pools, clean TTL records, or optimize Static CDN hit ratios.</p>
                </div>
                <button
                  onClick={flushRedisCache}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  Flush Cache Node
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Active key records list */}
                <div className="md:col-span-6 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Active Caching Keys Pools</span>
                  
                  <div className="space-y-2">
                    {cacheKeys.length > 0 ? (
                      cacheKeys.map((k) => (
                        <div key={k.key} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-lg text-xs flex justify-between items-center font-mono text-slate-700 dark:text-slate-350">
                          <div className="truncate pr-4">
                            <span className="font-bold block text-slate-900 dark:text-white truncate">{k.key}</span>
                            <span className="text-[10px] text-slate-400">Size: {k.size}</span>
                          </div>
                          <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                            TTL {k.ttl}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-emerald-500 font-mono text-xs font-bold">
                        {cacheFlushSuccess ? '[SUCCESS] Cache keys flushed in memory! Performance optimized.' : '[EMPTY] Caching database is currently empty.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Static CDN metrics panel */}
                <div className="md:col-span-6 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Global edge static metrics</span>
                  
                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3.5 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-500/10 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">CDN Hit Ratio:</div>
                      <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-150">94.2%</div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Assets served directly from nearest Edge nodes, reducing backend computing load by 85%.</p>
                    </div>

                    <div className="p-3.5 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Compression Heuristics:</div>
                      <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-150">Brotli (11:1 Savings)</div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">All outbound JSON api sequences are zipped dynamically with Brotli compression pools.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 11 & 12: CI/CD WORKFLOWS & CONTAINER DOCKERFILES */}
          {/* ======================================================== */}
          {activeModuleTab === 'cicd' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">CI/CD Continuous Integration Pipelines & Containerizations</h3>
                  <p className="text-xs text-slate-400 font-mono">Inspect complete Dockerfile structures and automatic GitHub Actions release pipelines.</p>
                </div>
                <Terminal className="w-5 h-5 text-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: GitHub Actions deploy.yml file */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">.github/workflows/deploy.yml</span>
                  <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-[9px] leading-relaxed rounded-lg overflow-x-auto max-h-[340px]">
{`name: SalesPilot Continuous Delivery

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Install Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run code linter
      run: npm run lint

    - name: Run Jest & Playwright tests
      run: |
        npm run test:unit
        npm run test:e2e

    - name: Log in to Google Cloud Registry
      uses: google-github-actions/auth@v1
      with:
        credentials_json: \${{ secrets.GCP_SA_KEY }}

    - name: Build & Push Docker image
      run: |
        docker build -t gcr.io/salespilot-prod/core-server:latest .
        docker push gcr.io/salespilot-prod/core-server:latest

    - name: Deploy Rolling Update on Cloud Run
      run: |
        gcloud run deploy salespilot-server \\
          --image gcr.io/salespilot-prod/core-server:latest \\
          --platform managed \\
          --region asia-south1 \\
          --allow-unauthenticated`}
                  </pre>
                </div>

                {/* Right Dockerfile structure code */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Dockerfile</span>
                  <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-[9px] leading-relaxed rounded-lg overflow-x-auto max-h-[340px]">
{`# Multi-stage production containerization
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production minimal execution stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/src/backend ./src/backend

# Map container access port 3000
EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/server.cjs"]`}
                  </pre>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 13 & 14: MARKETING CUSTOMIZER & STATIC PREVIEWS */}
          {/* ======================================================== */}
          {activeModuleTab === 'marketing' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Marketing Landing Page & Customizer</h3>
                  <p className="text-xs text-slate-400 font-mono">Build and refine your public-facing sales pipeline page with responsive layout customization.</p>
                </div>
                <Layout className="w-5 h-5 text-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left control panel */}
                <div className="md:col-span-4 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Visual Page Customizer</span>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Headline Copy</label>
                      <input 
                        type="text" 
                        value={mktHeroTitle} 
                        onChange={(e) => setMktHeroTitle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Landing page theme preset</label>
                      <select 
                        value={mktTheme} 
                        onChange={(e) => setMktTheme(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-2 cursor-pointer font-bold"
                      >
                        <option value="cosmic">Cosmic Navy (Dark Mode)</option>
                        <option value="cool">Minimal Ice (Light Mode)</option>
                        <option value="warm">Sunset Twilight (Sophisticated)</option>
                      </select>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded text-[11px] leading-relaxed">
                      <span className="font-bold block text-[10px] uppercase text-slate-400 font-mono mb-1">Theme Colors Checklist:</span>
                      <div>Cool ice: Soft whites, deep grays</div>
                      <div>Cosmic Navy: Midnight, deep purples</div>
                    </div>
                  </div>
                </div>

                {/* Right mockup visual view */}
                <div className="md:col-span-8 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Live Marketing Landing Page Mockup</span>
                  
                  <div className={`p-6 rounded-xl border text-center space-y-6 transition-all duration-300 ${
                    mktTheme === 'cosmic' ? 'bg-slate-950 border-slate-850 text-white' :
                    mktTheme === 'cool' ? 'bg-slate-50 border-slate-200 text-slate-900' :
                    'bg-amber-950/20 border-amber-900/10 text-slate-100'
                  }`}>
                    
                    {/* Header bar mock */}
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-xs font-bold font-mono">
                      <span>{brandLogoText}</span>
                      <div className="flex gap-4">
                        <span>Product</span>
                        <span>Pricing</span>
                        <span className="text-blue-500">Log In</span>
                      </div>
                    </div>

                    {/* Hero section */}
                    <div className="py-6 space-y-3 max-w-md mx-auto">
                      <h2 className="text-lg md:text-xl font-display font-extrabold tracking-tight leading-tight">
                        {mktHeroTitle}
                      </h2>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        Automate your lead discovery, research deep technographic data, write cold emails, and schedule qualified appointments with AI sales agents.
                      </p>
                      <button className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer">
                        Select Subscription Plan
                      </button>
                    </div>

                    {/* Pricing grid mock */}
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left text-xs">
                      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-2">
                        <span className="text-[9px] font-mono uppercase font-bold text-slate-400">GROWTH PLAN</span>
                        <div className="text-lg font-bold">₹6,500 <span className="text-[9px] font-mono font-normal">/mo</span></div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Perfect for early founders scaling their outbound sales.</p>
                      </div>

                      <div className="p-4 bg-blue-950/30 rounded-xl border border-blue-500/20 space-y-2 relative">
                        <span className="text-[9px] font-mono uppercase font-bold text-blue-400">PROFESSIONAL</span>
                        <div className="text-lg font-bold">₹8,500 <span className="text-[9px] font-mono font-normal">/mo</span></div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Most popular. Includes bulk automated Gemini research.</p>
                        <span className="absolute top-2 right-2 bg-blue-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.2 rounded">POPULAR</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
