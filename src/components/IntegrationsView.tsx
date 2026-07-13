import React, { useState } from 'react';
import { 
  Settings, Database, Brain, Network, CreditCard, Check, 
  HelpCircle, ShieldCheck, RefreshCw, AlertTriangle, Key, Code,
  User, Building, Globe, Shield, Activity, Users, LogOut, Clock,
  Plus, Trash2, ArrowUpRight, Copy, CheckCircle, Smartphone, Lock, Search, Play,
  Mail, Inbox, Send, Paperclip, ChevronRight, MessageSquare, CheckSquare, 
  FileText, Layout, AlertCircle, Sparkles, X, ChevronDown, CheckCircle2, RefreshCw as LoopIcon
} from 'lucide-react';
import { useAuth } from '../authentication/AuthContext';
import { IntegrationCredentials, UserRole, SubscriptionTier } from '../types';

interface IntegrationsViewProps {
  credentials: IntegrationCredentials;
  onSaveCredentials: (creds: Partial<IntegrationCredentials>) => Promise<void>;
}

export function IntegrationsView({ credentials, onSaveCredentials }: IntegrationsViewProps) {
  const {
    user,
    organization,
    teamMembers,
    updateProfile,
    updateOrganization,
    changePassword,
    enrollMFA,
    verifyAndEnableMFA,
    disableMFA,
    deactivateUser,
    transferOwnership,
    activityLogs,
    loginHistory,
    logActivity,
    inviteTeamMember,
    updateTeamMemberRole,
    deleteTeamMember,
    sessionExpiryCountdown,
    extendSession
  } = useAuth();

  // Settings Tabs: 'profile' | 'organization' | 'team' | 'security' | 'integrations' | 'gmail' | 'workflows' | 'prompts'
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'organization' | 'team' | 'security' | 'integrations' | 'gmail' | 'workflows' | 'prompts'>('profile');

  // Profile Form States
  const [profName, setProfName] = useState(user?.fullName || '');
  const [profPhone, setProfPhone] = useState(user?.phone || '+91 98765 43210');
  const [profTimezone, setProfTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [profLang, setProfLang] = useState(user?.language || 'English');
  const [profSuccess, setProfSuccess] = useState(false);

  // Org Form States
  const [orgName, setOrgName] = useState(organization?.name || user?.companyName || '');
  const [orgDomain, setOrgDomain] = useState((organization as any)?.domain || '');
  const [orgIndustry, setOrgIndustry] = useState(organization?.industry || user?.industry || 'Marketing Agency');
  const [orgCountry, setOrgCountry] = useState((organization as any)?.country || 'India');
  const [orgCurrency, setOrgCurrency] = useState((organization as any)?.currency || 'INR');
  const [orgGst, setOrgGst] = useState((organization as any)?.gst || '27AAAAA1111A1Z1');
  const [orgAddress, setOrgAddress] = useState((organization as any)?.address || '88, MG Road, Camp');
  const [orgWorkingHoursStart, setOrgWorkingHoursStart] = useState((organization as any)?.workingHours?.start || '09:00');
  const [orgWorkingHoursEnd, setOrgWorkingHoursEnd] = useState((organization as any)?.workingHours?.end || '18:00');
  const [orgSuccess, setOrgSuccess] = useState(false);

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  // MFA States
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState(false);

  // Team Invite States
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('SALES');
  const [inviteName, setInviteName] = useState('');

  // API Credentials States
  const [supabaseUrl, setSupabaseUrl] = useState(credentials.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(credentials.supabaseAnonKey || '');
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(credentials.n8nWebhookUrl || '');
  const [cashfreeAppId, setCashfreeAppId] = useState(credentials.cashfreeAppId || '');
  const [geminiApiKey, setGeminiApiKey] = useState(credentials.geminiApiKey || '');
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  React.useEffect(() => {
    setSupabaseUrl(credentials.supabaseUrl || '');
    setSupabaseAnonKey(credentials.supabaseAnonKey || '');
    setN8nWebhookUrl(credentials.n8nWebhookUrl || '');
    setCashfreeAppId(credentials.cashfreeAppId || '');
    setGeminiApiKey(credentials.geminiApiKey || '');
  }, [credentials]);

  // --- GMAIL API STATES ---
  const [gmailAccounts, setGmailAccounts] = useState<any[]>([]);
  const [gmailQueue, setGmailQueue] = useState<any[]>([]);
  const [gmailLogs, setGmailLogs] = useState<any[]>([]);
  const [gmailTemplates, setGmailTemplates] = useState<any[]>([]);
  const [gmailThreads, setGmailThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [activeGmailLabel, setActiveGmailLabel] = useState<string>('INBOX');
  const [selectedGmailAccount, setSelectedGmailAccount] = useState<string>('');
  
  // Connect Modal state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  
  // Compose Email state
  const [composeSender, setComposeSender] = useState('');
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeTemplate, setComposeTemplate] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [composeSuccess, setComposeSuccess] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Template Designer state
  const [newTplName, setNewTplName] = useState('');
  const [newTplSubject, setNewTplSubject] = useState('');
  const [newTplBody, setNewTplBody] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('Cold Outreach');
  const [tplSuccess, setTplSuccess] = useState(false);

  // Quick reply state
  const [replyBody, setReplyBody] = useState('');

  // Confirmation modal states
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);

  // Drag and drop attachment helper state
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // --- WORKFLOWS STATE ENGINE ---
  const [workflowsList, setWorkflowsList] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [workflowAnalytics, setWorkflowAnalytics] = useState<any>({
    totalExecutions: 0,
    successRate: 100,
    activeWorkflows: 0,
    averageDurationMs: 0,
    failedCount: 0
  });
  const [promptsList, setPromptsList] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  // Workflow Modal States
  const [isWfModalOpen, setIsWfModalOpen] = useState(false);
  const [editingWf, setEditingWf] = useState<any>(null);
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [wfTriggerType, setWfTriggerType] = useState<'WEBHOOK' | 'MANUAL' | 'CRON' | 'API'>('WEBHOOK');
  const [wfWebhookUrl, setWfWebhookUrl] = useState('');
  const [wfRetries, setWfRetries] = useState(3);
  const [wfErrorAction, setWfErrorAction] = useState<'NOTIFY' | 'RETRY' | 'FALLBACK'>('RETRY');
  const [wfSteps, setWfSteps] = useState<any[]>([
    { name: 'Trigger Event', type: 'Trigger', description: 'Starts the workflow sequence' },
    { name: 'AI Decision Router', type: 'AI Router', description: 'Evaluates parameters and selects route' },
    { name: 'Final Dispatch Node', type: 'Action', description: 'Fulfills the sequence' }
  ]);

  // Prompt Modal States
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [promptName, setPromptName] = useState('');
  const [promptCategory, setPromptCategory] = useState('Outreach');
  const [promptSystem, setPromptSystem] = useState('');
  const [promptUserTemplate, setPromptUserTemplate] = useState('');
  const [promptVariables, setPromptVariables] = useState<string[]>(['leadName', 'companyName']);

  // Selected Workflow Detail state
  const [selectedWf, setSelectedWf] = useState<any>(null);
  const [isRunningWf, setIsRunningWf] = useState<string | null>(null);
  const [isRetryingExec, setIsRetryingExec] = useState<string | null>(null);

  // --- SUB-TABS LOCAL TO INTEGRATIONS CENTER ---
  const [localIntegrationsTab, setLocalIntegrationsTab] = useState<'connectors' | 'ai_playground' | 'b2b_directory' | 'google_maps' | 'webhooks' | 'workers' | 'diagnostics'>('connectors');

  // AI Playground states
  const [geminiUrl, setGeminiUrl] = useState('https://apexmarketing.in');
  const [geminiFocus, setGeminiFocus] = useState('Identify B2B pain points');
  const [geminiAnalysis, setGeminiAnalysis] = useState<any>(null);
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);

  const [geminiDocText, setGeminiDocText] = useState('CONTRACT AGREEMENT\n\nThis Service Level Agreement (the "SLA") is entered into by and between SalesPilot and Horizon Media.\n\nCommitment: Outbound campaigns must target 50,000 corporate prospects monthly. SalesPilot guarantees under 2 hours response time for system escalations.\nAny invoice billing will be handled exclusively in Indian Rupees (INR) under local regulatory compliance.');
  const [geminiObjective, setGeminiObjective] = useState('Audit contract and outline gaps');
  const [geminiDocResult, setGeminiDocResult] = useState<any>(null);
  const [isAuditingDoc, setIsAuditingDoc] = useState(false);

  const [competitorName, setCompetitorName] = useState('ZoomInfo');
  const [competitorAdvantage, setCompetitorAdvantage] = useState('Built-in Indian Cashfree compliance, active multi-node local n8n flows, AI model fallback router preventing costly api downtimes.');
  const [competitorResult, setCompetitorResult] = useState<any>(null);
  const [isResearchingComp, setIsResearchingComp] = useState(false);

  const [complianceSector, setComplianceSector] = useState('Financial Outreach');
  const [complianceQuery, setComplianceQuery] = useState('Indian direct cold email compliance guidelines');
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [isSearchingCompliance, setIsSearchingCompliance] = useState(false);

  const [hunterEmail, setHunterEmail] = useState('ananya@apexmarketing.in');
  const [hunterVerifyResult, setHunterVerifyResult] = useState<any>(null);
  const [isVerifyingHunter, setIsVerifyingHunter] = useState(false);

  const [clearbitDomain, setClearbitDomain] = useState('apexmarketing.in');
  const [clearbitResult, setClearbitResult] = useState<any>(null);
  const [isEnrichingClearbit, setIsEnrichingClearbit] = useState(false);

  const [pdlName, setPdlName] = useState('Ananya Sharma');
  const [pdlResult, setPdlResult] = useState<any>(null);
  const [isSearchingPdl, setIsSearchingPdl] = useState(false);

  const [crunchbaseCompany, setCrunchbaseCompany] = useState('Apex Marketing');
  const [crunchbaseResult, setCrunchbaseResult] = useState<any>(null);
  const [isSearchingCrunchbase, setIsSearchingCrunchbase] = useState(false);

  // Google Maps Scraper states
  const [mapsQuery, setMapsQuery] = useState('Software developer');
  const [mapsLocation, setMapsLocation] = useState('Bangalore');
  const [mapsResults, setMapsResults] = useState<any[]>([]);
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [isImportingMaps, setIsImportingMaps] = useState<string | null>(null);

  // WhatsApp & Slack states
  const [waPhone, setWaPhone] = useState('+919876543210');
  const [waTemplate, setWaTemplate] = useState('wa_tpl_1');
  const [waVariables, setWaVariables] = useState('Soham Kharat, Next Tuesday, Asia/Kolkata, https://g.co/meet/salespilot');
  const [waSuccess, setWaSuccess] = useState<string | null>(null);
  const [isSendingWa, setIsSendingWa] = useState(false);

  const [slackChannel, setSlackChannel] = useState('#sales-alerts');
  const [slackMessage, setSlackMessage] = useState('🚀 DEAL CLOSED: Apex Marketing Solutions Pvt Ltd has upgraded to SalesPilot Advanced tier. ₹50,000 INR prepaid received successfully!');
  const [slackSuccess, setSlackSuccess] = useState<string | null>(null);
  const [isSendingSlack, setIsSendingSlack] = useState(false);

  // Webhook Engine states
  const [whName, setWhName] = useState('SDR Dispatch Trigger');
  const [whEvent, setWhEvent] = useState('lead.created');
  const [whTargetUrl, setWhTargetUrl] = useState('https://n8n.yourbrand.com/webhook/lead-sdr');
  const [whConfigs, setWhConfigs] = useState<any[]>([]);
  const [whLogs, setWhLogs] = useState<any[]>([]);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);

  // Background Workers & Sync states
  const [workerQueues, setWorkerQueues] = useState<any>(null);
  const [failedJobs, setFailedJobs] = useState<any[]>([]);
  const [isRetryingJob, setIsRetryingJob] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  // System Diagnostics states
  const [healthServices, setHealthServices] = useState<any>(null);
  const [isPingingHealth, setIsPingingHealth] = useState(false);
  const [aiStats, setAiStats] = useState<any>(null);
  const [lastCheckedHealth, setLastCheckedHealth] = useState('');

  // --- INTEGRATIONS EVENT HANDLERS ---
  const handleWebsiteAudit = async () => {
    setIsAnalyzingWebsite(true);
    setGeminiAnalysis(null);
    try {
      const res = await fetch('/api/v1/gemini/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: geminiUrl, focus: geminiFocus })
      });
      if (res.ok) {
        const data = await res.json();
        setGeminiAnalysis(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingWebsite(false);
    }
  };

  const handleDocumentAudit = async () => {
    setIsAuditingDoc(true);
    setGeminiDocResult(null);
    try {
      const res = await fetch('/api/v1/gemini/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: geminiDocText, objective: geminiObjective })
      });
      if (res.ok) {
        const data = await res.json();
        setGeminiDocResult(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditingDoc(false);
    }
  };

  const handleCompetitorResearch = async () => {
    setIsResearchingComp(true);
    setCompetitorResult(null);
    try {
      const res = await fetch('/api/v1/gemini/research-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: competitorName, myAdvantage: competitorAdvantage })
      });
      if (res.ok) {
        const data = await res.json();
        setCompetitorResult(data.research);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResearchingComp(false);
    }
  };

  const handleComplianceSearch = async () => {
    setIsSearchingCompliance(true);
    setComplianceResult(null);
    try {
      const res = await fetch('/api/v1/gemini/knowledge-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: complianceSector, query: complianceQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setComplianceResult(data.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingCompliance(false);
    }
  };

  const handleHunterVerify = async () => {
    setIsVerifyingHunter(true);
    setHunterVerifyResult(null);
    try {
      const res = await fetch('/api/v1/hunter/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: hunterEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setHunterVerifyResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifyingHunter(false);
    }
  };

  const handleClearbitEnrich = async () => {
    setIsEnrichingClearbit(true);
    setClearbitResult(null);
    try {
      const res = await fetch('/api/v1/clearbit/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: clearbitDomain })
      });
      if (res.ok) {
        const data = await res.json();
        setClearbitResult(data.enriched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnrichingClearbit(false);
    }
  };

  const handlePdlSearch = async () => {
    setIsSearchingPdl(true);
    setPdlResult(null);
    try {
      const res = await fetch('/api/v1/peopledatalabs/search-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pdlName })
      });
      if (res.ok) {
        const data = await res.json();
        setPdlResult(data.person);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingPdl(false);
    }
  };

  const handleCrunchbaseSearch = async () => {
    setIsSearchingCrunchbase(true);
    setCrunchbaseResult(null);
    try {
      const res = await fetch('/api/v1/crunchbase/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: crunchbaseCompany })
      });
      if (res.ok) {
        const data = await res.json();
        setCrunchbaseResult(data.intelligence);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingCrunchbase(false);
    }
  };

  const handleMapsSearch = async () => {
    setIsSearchingMaps(true);
    setMapsResults([]);
    try {
      const res = await fetch('/api/v1/googlemaps/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mapsQuery, location: mapsLocation })
      });
      if (res.ok) {
        const data = await res.json();
        setMapsResults(data.results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingMaps(false);
    }
  };

  const handleMapsImport = async (business: any) => {
    setIsImportingMaps(business.placeId);
    try {
      const res = await fetch('/api/v1/googlemaps/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business })
      });
      if (res.ok) {
        alert(`Lead "${business.name}" imported directly into SalesPilot CRM!`);
        fetchWebhookAndWorkerData(); // refresh logs
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImportingMaps(null);
    }
  };

  const handleSendWa = async () => {
    setIsSendingWa(true);
    setWaSuccess(null);
    try {
      const res = await fetch('/api/v1/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone, templateId: waTemplate, variables: waVariables.split(',').map(s => s.trim()) })
      });
      if (res.ok) {
        setWaSuccess('WhatsApp message dispatched successfully to ' + waPhone);
        fetchWebhookAndWorkerData(); // refresh logs
        setTimeout(() => setWaSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingWa(false);
    }
  };

  const handleSendSlack = async () => {
    setIsSendingSlack(true);
    setSlackSuccess(null);
    try {
      const res = await fetch('/api/v1/slack/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: slackChannel, message: slackMessage })
      });
      if (res.ok) {
        setSlackSuccess('Slack notification posted to ' + slackChannel);
        fetchWebhookAndWorkerData(); // refresh logs
        setTimeout(() => setSlackSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingSlack(false);
    }
  };

  const handleCreateWebhook = async () => {
    setIsCreatingWebhook(true);
    try {
      const res = await fetch('/api/v1/webhooks/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: whName, event: whEvent, targetUrl: whTargetUrl })
      });
      if (res.ok) {
        setWhName('');
        setWhTargetUrl('');
        fetchWebhookAndWorkerData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/webhooks/configs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWebhookAndWorkerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryFailedJob = async (jobId: string) => {
    setIsRetryingJob(jobId);
    try {
      const res = await fetch('/api/v1/workers/retry-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      if (res.ok) {
        fetchWebhookAndWorkerData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRetryingJob(null);
    }
  };

  const handlePingHealth = async () => {
    setIsPingingHealth(true);
    try {
      const res = await fetch('/api/v1/monitoring/health');
      if (res.ok) {
        const data = await res.json();
        setHealthServices(data.services);
        setLastCheckedHealth(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPingingHealth(false);
    }
  };

  const fetchWebhookAndWorkerData = async () => {
    try {
      const [whRes, workerRes, diagRes] = await Promise.all([
        fetch('/api/v1/webhooks/configs'),
        fetch('/api/v1/workers/status'),
        fetch('/api/v1/monitoring/dashboard')
      ]);
      if (whRes.ok) {
        const whData = await whRes.json();
        setWhConfigs(whData.configs);
        setWhLogs(whData.logs);
      }
      if (workerRes.ok) {
        const workerData = await workerRes.json();
        setWorkerQueues(workerData.queues);
        setFailedJobs(workerData.failedJobs);
      }
      if (diagRes.ok) {
        const diagData = await diagRes.json();
        setAiStats(diagData.aiStats);
      }
      const logsRes = await fetch('/gmail/status');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setSyncLogs(logsData.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API Call: Fetch Workflows Data
  const fetchWorkflowsData = async () => {
    setLoadingWorkflows(true);
    try {
      const [wfRes, execRes, analyticRes] = await Promise.all([
        fetch('/api/v1/workflows'),
        fetch('/api/v1/workflows/executions'),
        fetch('/api/v1/workflows/analytics')
      ]);
      if (wfRes.ok) {
        const wfData = await wfRes.json();
        if (wfData.success) setWorkflowsList(wfData.workflows);
      }
      if (execRes.ok) {
        const execData = await execRes.json();
        if (execData.success) setExecutionLogs(execData.executions);
      }
      if (analyticRes.ok) {
        const analyticData = await analyticRes.json();
        if (analyticData.success) setWorkflowAnalytics(analyticData.metrics);
      }
    } catch (err) {
      console.error('Failed to load workflow automation data:', err);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  // API Call: Fetch Prompt Templates
  const fetchPromptsData = async () => {
    setLoadingPrompts(true);
    try {
      const res = await fetch('/api/v1/prompts');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPromptsList(data.templates);
        }
      } else {
        // Fallback to fetching via direct endpoint if template route differs
        const resAlt = await fetch('/api/v1/prompts');
        const dataAlt = await resAlt.json();
        if (dataAlt.success) setPromptsList(dataAlt.templates);
      }
    } catch (err) {
      console.error('Failed to fetch prompt templates:', err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  // Run initial sync when active tab matches
  React.useEffect(() => {
    if (activeSubTab === 'workflows') {
      fetchWorkflowsData();
    } else if (activeSubTab === 'prompts') {
      fetchPromptsData();
    } else if (activeSubTab === 'integrations') {
      fetchWebhookAndWorkerData();
      handlePingHealth();
    }
  }, [activeSubTab]);

  // Create or Update Workflow
  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName) return;

    try {
      const url = editingWf ? `/api/v1/workflows/${editingWf.id}` : '/api/v1/workflows';
      const method = editingWf ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wfName,
          description: wfDesc,
          triggerType: wfTriggerType,
          webhookUrl: wfWebhookUrl,
          retries: wfRetries,
          errorAction: wfErrorAction,
          steps: wfSteps
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsWfModalOpen(false);
          setEditingWf(null);
          // Refresh list
          fetchWorkflowsData();
        }
      }
    } catch (err) {
      console.error('Error saving workflow:', err);
    }
  };

  // Delete Workflow
  const handleDeleteWorkflow = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this workflow? This will disrupt active webhook connections.')) return;
    try {
      const res = await fetch(`/api/v1/workflows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkflowsData();
        if (selectedWf?.id === id) {
          setSelectedWf(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  // Clone Workflow
  const handleCloneWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/workflows/${id}/clone`, { method: 'POST' });
      if (res.ok) {
        fetchWorkflowsData();
      }
    } catch (err) {
      console.error('Failed to clone workflow:', err);
    }
  };

  // Enable / Disable Toggle Workflow
  const handleToggleWorkflow = async (wf: any) => {
    const nextStatus = wf.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/v1/workflows/${wf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchWorkflowsData();
      }
    } catch (err) {
      console.error('Failed to toggle workflow status:', err);
    }
  };

  // Run Workflow Simulation
  const handleRunWorkflow = async (id: string) => {
    setIsRunningWf(id);
    try {
      const res = await fetch(`/api/v1/workflows/${id}/run`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Immediately refresh workflows list & logs
          await fetchWorkflowsData();
        }
      }
    } catch (err) {
      console.error('Failed to run workflow:', err);
    } finally {
      setIsRunningWf(null);
    }
  };

  // Retry Failed Workflow execution
  const handleRetryExecution = async (execId: string) => {
    setIsRetryingExec(execId);
    try {
      const res = await fetch(`/api/v1/workflows/executions/${execId}/retry`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await fetchWorkflowsData();
        }
      }
    } catch (err) {
      console.error('Failed to retry workflow execution:', err);
    } finally {
      setIsRetryingExec(null);
    }
  };

  // Save Prompt Template
  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptName || !promptSystem || !promptUserTemplate) return;

    try {
      const url = editingPrompt ? `/api/v1/prompts/${editingPrompt.id}` : '/api/v1/prompts';
      const method = editingPrompt ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: promptName,
          category: promptCategory,
          systemPrompt: promptSystem,
          userPromptTemplate: promptUserTemplate,
          variables: promptVariables
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsPromptModalOpen(false);
          setEditingPrompt(null);
          fetchPromptsData();
        }
      }
    } catch (err) {
      console.error('Error saving prompt template:', err);
    }
  };

  // Delete Prompt Template
  const handleDeletePrompt = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prompt template?')) return;
    try {
      const res = await fetch(`/api/v1/prompts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPromptsData();
      }
    } catch (err) {
      console.error('Failed to delete prompt template:', err);
    }
  };

  const fetchGmailStatus = async () => {
    try {
      const res = await fetch('/gmail/status');
      if (res.ok) {
        const data = await res.json();
        setGmailAccounts(data.accounts);
        setGmailQueue(data.queue);
        setGmailLogs(data.logs);
        setGmailTemplates(data.templates);
        
        // Auto-select initial active accounts
        if (data.accounts.length > 0) {
          if (!selectedGmailAccount) {
            setSelectedGmailAccount(data.accounts[0].email);
          }
          if (!composeSender) {
            setComposeSender(data.accounts[0].email);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching Gmail status:', err);
    }
  };

  const fetchGmailInbox = async () => {
    try {
      const accountQuery = selectedGmailAccount ? `?accountId=${selectedGmailAccount}` : '';
      const labelQuery = activeGmailLabel ? `${accountQuery ? '&' : '?'}label=${activeGmailLabel}` : '';
      const res = await fetch(`/gmail/inbox${accountQuery}${labelQuery}`);
      if (res.ok) {
        const data = await res.json();
        setGmailThreads(data.threads);
      }
    } catch (err) {
      console.error('Error fetching Gmail inbox:', err);
    }
  };

  const fetchThreadMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/gmail/thread?threadId=${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setThreadMessages(data.messages);
        setActiveThreadId(threadId);
        // Refresh unreads
        fetchGmailInbox();
      }
    } catch (err) {
      console.error('Error fetching thread:', err);
    }
  };

  // Poll server state while tab is open to show live retries, queue progress and customer replies
  React.useEffect(() => {
    if (activeSubTab === 'gmail') {
      fetchGmailStatus();
      fetchGmailInbox();
      
      const timer = setInterval(() => {
        fetchGmailStatus();
        fetchGmailInbox();
        if (activeThreadId) {
          fetch(`/gmail/thread?threadId=${activeThreadId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) setThreadMessages(data.messages);
            });
        }
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeSubTab, selectedGmailAccount, activeGmailLabel, activeThreadId]);

  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    try {
      const res = await fetch('/gmail/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customEmail,
          fullName: customName || customEmail.split('@')[0],
          accessToken: 'mock_sandbox_token_' + Date.now(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        })
      });

      if (res.ok) {
        const data = await res.json();
        logActivity(`Connected Gmail Account: ${customEmail}`, 'Gmail Integration');
        fetchGmailStatus();
        setIsConnectModalOpen(false);
        setCustomEmail('');
        setCustomName('');
      }
    } catch (err) {
      console.error('Error connecting account:', err);
    }
  };

  const handleDisconnectAccount = async (email: string) => {
    try {
      const res = await fetch('/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        logActivity(`Disconnected Gmail Account: ${email}`, 'Gmail Integration');
        fetchGmailStatus();
        setDeleteConfirmEmail(null);
        if (selectedGmailAccount === email) {
          setSelectedGmailAccount('');
        }
        if (composeSender === email) {
          setComposeSender('');
        }
      }
    } catch (err) {
      console.error('Error disconnecting account:', err);
    }
  };

  const handleSendEmail = async (isDraft = false) => {
    if (!composeSender || !composeRecipient || !composeSubject || !composeBody) {
      setComposeError('All email parameters (Sender, Recipient, Subject, and Body) are required.');
      return;
    }

    setComposeError(null);
    setComposeSuccess(null);
    setIsSending(true);

    try {
      const res = await fetch('/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: composeSender,
          recipient: composeRecipient,
          subject: composeSubject,
          body: composeBody,
          attachments: uploadedFiles,
          isDraft
        })
      });

      const data = await res.json();
      if (res.ok) {
        setComposeSuccess(isDraft ? 'Draft successfully stored to Google folder!' : 'Email queued in SalesPilot outbox!');
        logActivity(isDraft ? `Draft created: ${composeSubject}` : `Email queued to ${composeRecipient}`, 'Gmail Integration');
        
        // Reset composer if not draft
        if (!isDraft) {
          setComposeRecipient('');
          setComposeSubject('');
          setComposeBody('');
          setComposeTemplate('');
          setUploadedFiles([]);
        }
        fetchGmailStatus();
      } else {
        setComposeError(data.error || 'Failed to dispatch email.');
      }
    } catch (err) {
      setComposeError('Network transmission failure.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyBody || !activeThreadId || threadMessages.length === 0) return;

    const lastMsg = threadMessages[threadMessages.length - 1];
    const replyRecipient = lastMsg.from === selectedGmailAccount ? lastMsg.to : lastMsg.from;
    const replySubject = lastMsg.subject.startsWith('Re:') ? lastMsg.subject : `Re: ${lastMsg.subject}`;

    try {
      const res = await fetch('/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedGmailAccount,
          recipient: replyRecipient,
          subject: replySubject,
          body: replyBody.replace(/\n/g, '<br/>')
        })
      });

      if (res.ok) {
        logActivity(`Sent inline reply on thread to ${replyRecipient}`, 'Gmail Integration');
        setReplyBody('');
        // Append simulated item immediately for quick visual gratification
        const localReply = {
          id: `local_reply_${Date.now()}`,
          threadId: activeThreadId,
          from: selectedGmailAccount,
          to: replyRecipient,
          subject: replySubject,
          body: replyBody,
          snippet: replyBody.substring(0, 50) + '...',
          timestamp: new Date().toISOString(),
          labels: ['SENT'],
          isRead: true
        };
        setThreadMessages(prev => [...prev, localReply]);
        fetchGmailStatus();
      }
    } catch (err) {
      console.error('Error replying:', err);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName || !newTplSubject || !newTplBody) return;

    try {
      const res = await fetch('/gmail/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTplName,
          subject: newTplSubject,
          body: newTplBody,
          category: newTplCategory
        })
      });

      if (res.ok) {
        setTplSuccess(true);
        setNewTplName('');
        setNewTplSubject('');
        setNewTplBody('');
        fetchGmailStatus();
        setTimeout(() => setTplSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const handleSelectTemplate = (tplId: string) => {
    const tpl = gmailTemplates.find(t => t.id === tplId);
    if (tpl) {
      setComposeTemplate(tplId);
      setComposeSubject(tpl.subject);
      setComposeBody(tpl.body);
    } else {
      setComposeTemplate('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files).map((f: any) => ({
        filename: f.name,
        size: Math.round(f.size / 1024), // kb
        content: 'dummy_binary_data'
      }));
      setUploadedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files).map((f: any) => ({
        filename: f.name,
        size: Math.round(f.size / 1024), // kb
        content: 'dummy_binary_data'
      }));
      setUploadedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerRealGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch Google Auth URL.');
      }
      const data = await res.json();
      
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );
      
      if (!popup) {
        alert('Popup blocker active. Please allow popups for this site to complete Google OAuth.');
      }
    } catch (err: any) {
      console.error('Real Google OAuth Error:', err);
      alert(`Production Google Connection Blocked:\n\n${err.message || String(err)}\n\nPlease ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are defined in your environment variables via the Settings tab in AI Studio or Vercel.`);
    }
  };

  const triggerSaveCreds = async (section: string, creds: Partial<IntegrationCredentials>) => {
    setSavingSection(section);
    try {
      await onSaveCredentials(creds);
      setSavedSection(section);
      setTimeout(() => setSavedSection(null), 2000);
      logActivity(`Credentials updated for ${section}`, 'Integrations');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSection(null);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfSuccess(false);
    const ok = await updateProfile({
      fullName: profName,
      phone: profPhone,
      timezone: profTimezone,
      language: profLang
    } as any);
    if (ok) {
      setProfSuccess(true);
      setTimeout(() => setProfSuccess(false), 2000);
    }
  };

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSuccess(false);
    const ok = await updateOrganization({
      name: orgName,
      domain: orgDomain,
      industry: orgIndustry,
      country: orgCountry,
      currency: orgCurrency,
      gst: orgGst,
      address: orgAddress,
      workingHours: { start: orgWorkingHoursStart, end: orgWorkingHoursEnd }
    } as any);
    if (ok) {
      setOrgSuccess(true);
      setTimeout(() => setOrgSuccess(false), 2000);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    const ok = await changePassword(newPassword);
    if (ok) {
      setPassSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 2000);
    } else {
      setPassError('Failed to update password.');
    }
  };

  const handleStartMFAEnroll = async () => {
    setMfaError(null);
    const { qrCode, secret } = await enrollMFA();
    setMfaQrCode(qrCode);
    setMfaSecret(secret);
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError(null);
    const ok = await verifyAndEnableMFA(mfaToken);
    if (ok) {
      setMfaSuccess(true);
      setMfaQrCode(null);
      setMfaToken('');
    } else {
      setMfaError('Incorrect validation code. Please try again.');
    }
  };

  const handleDisableMFA = async () => {
    const ok = await disableMFA();
    if (ok) {
      setMfaSuccess(false);
    }
  };

  const handleAddTeammate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const ok = await inviteTeamMember(inviteEmail, inviteRole, inviteName || inviteEmail.split('@')[0]);
    if (ok) {
      setInviteEmail('');
      setInviteName('');
    }
  };

  return (
    <div id="settings_control_center" className="space-y-6 animate-fade-in pb-16">
      
      {/* Session Timeout Warning overlay block */}
      {sessionExpiryCountdown !== null && (
        <div className="p-4 bg-amber-500 border border-amber-600 rounded-xl text-amber-950 flex items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-xs font-mono font-medium">
            <Clock className="w-5 h-5 animate-spin" />
            <span>
              Inactivity Warning: Your secure workspace session expires in <strong>{sessionExpiryCountdown}</strong> seconds.
            </span>
          </div>
          <button 
            onClick={extendSession}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Extend Session
          </button>
        </div>
      )}

      {/* Modern Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400">
            <Settings className="w-6 h-6 animate-spin-slow text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">SalesPilot Control Center</h2>
            <p className="text-xs text-slate-400 mt-0.5">Define role permissions, manage multi-factor parameters, and trace logs.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-400 z-10">
          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">ROLE: <strong className="text-blue-400">{user?.role || 'ADMIN'}</strong></span>
          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">TIER: <strong className="text-emerald-400">{user?.tier || 'GROWTH'}</strong></span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        {[
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'organization', label: 'Organization', icon: Building },
          { id: 'team', label: 'Team & RBAC', icon: Users },
          { id: 'security', label: 'Security & Logs', icon: Shield },
          { id: 'integrations', label: 'Integration Center', icon: Database },
          { id: 'gmail', label: 'Gmail Settings', icon: Mail },
          { id: 'workflows', label: 'Workflow Automation', icon: Network },
          { id: 'prompts', label: 'Prompt Library', icon: Brain }
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === tab.id 
                  ? 'border-blue-600 text-blue-600 font-bold bg-slate-50' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 md:p-8">
        
        {/* TAB 1: USER PROFILE */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">My Personal Profile</h3>
              <p className="text-xs text-slate-500">Configure your professional contact details and language configurations.</p>
            </div>

            {profSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Profile details successfully updated.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Default Language</label>
                <select 
                  value={profLang}
                  onChange={(e) => setProfLang(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800 min-h-[42px]"
                >
                  <option value="English">English (US)</option>
                  <option value="English_UK">English (UK)</option>
                  <option value="Hindi">Hindi (INR)</option>
                  <option value="Spanish">Spanish (ES)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Local Timezone</label>
                <select 
                  value={profTimezone}
                  onChange={(e) => setProfTimezone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800 min-h-[42px]"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Save Profile Settings
            </button>
          </form>
        )}

        {/* TAB 2: ORGANIZATION PROFILE */}
        {activeSubTab === 'organization' && (
          <form onSubmit={handleOrgSave} className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Company & Workspace Metadata</h3>
              <p className="text-xs text-slate-500">Configure global parameters, invoice credentials, and default office working hours.</p>
            </div>

            {orgSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Organization details successfully saved.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <input 
                  type="text" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Company Website Domain</label>
                <input 
                  type="text" 
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800"
                  placeholder="domain.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Industry Segment</label>
                <input 
                  type="text" 
                  value={orgIndustry}
                  onChange={(e) => setOrgIndustry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">GST/VAT Number (India/International)</label>
                <input 
                  type="text" 
                  value={orgGst}
                  onChange={(e) => setOrgGst(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800 font-mono"
                  placeholder="GSTIN Format"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Operational Region / Country</label>
                <select 
                  value={orgCountry}
                  onChange={(e) => setOrgCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800 min-h-[42px]"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Base Billing Currency</label>
                <select 
                  value={orgCurrency}
                  onChange={(e) => setOrgCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800 min-h-[42px]"
                >
                  <option value="INR">INR (₹) - Standard</option>
                  <option value="USD">USD ($) - International</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Registered Corporate Address</label>
                <textarea 
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Office Operational Hours Start</label>
                <input 
                  type="time" 
                  value={orgWorkingHoursStart}
                  onChange={(e) => setOrgWorkingHoursStart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Office Operational Hours End</label>
                <input 
                  type="time" 
                  value={orgWorkingHoursEnd}
                  onChange={(e) => setOrgWorkingHoursEnd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs p-3 rounded-lg outline-none text-slate-800"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Save Organization Profile
            </button>
          </form>
        )}

        {/* TAB 3: TEAM & ROLE BASED ACCESS CONTROL (RBAC) */}
        {activeSubTab === 'team' && (
          <div className="space-y-8">
            {/* Staff Header */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Staff Access Management</h3>
              <p className="text-xs text-slate-500">Map precise role permissions and transfer workspace ownership parameters safely.</p>
            </div>

            {/* Direct Ownership Transfer block */}
            {user?.role === 'OWNER' && (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Transfer Workspace Ownership</h4>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  As the supreme <strong>OWNER</strong> of this organization, you can transfer corporate account credentials to an Admin teammate. This demotes your role status to Admin.
                </p>
                <div className="flex items-center gap-2 max-w-sm">
                  <select 
                    onChange={async (e) => {
                      const uid = e.target.value;
                      if (!uid) return;
                      if (window.confirm('Are you absolutely sure you want to transfer full SalesPilot ownership? This action is irreversible.')) {
                        await transferOwnership(uid);
                        alert('Ownership successfully transferred.');
                      }
                    }}
                    defaultValue=""
                    className="flex-1 bg-white border border-slate-300 text-xs p-2.5 rounded-lg outline-none"
                  >
                    <option value="" disabled>Select target Administrator...</option>
                    {teamMembers.map(tm => (
                      <option key={tm.id} value={tm.id}>{tm.fullName} ({tm.role})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Active Staff List Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Workspace Personnel</h4>
                <span className="text-[10px] font-mono text-slate-400">Total Size: {teamMembers.length + 1}</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User details</th>
                      <th className="px-4 py-3 font-semibold">Workspace Role</th>
                      <th className="px-4 py-3 font-semibold">Status Code</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Owner/Self */}
                    <tr className="bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {user?.fullName} <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-medium">You</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{user?.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-mono font-bold uppercase">
                          {user?.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs text-slate-800">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[10px] text-slate-400">
                        Admin Root
                      </td>
                    </tr>

                    {/* Invites */}
                    {teamMembers.map(tm => (
                      <tr key={tm.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{tm.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{tm.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            value={tm.role}
                            onChange={(e) => updateTeamMemberRole(tm.id, e.target.value as UserRole)}
                            className="bg-slate-50 border border-slate-200 text-[11px] px-2 py-1 rounded"
                            disabled={user?.role !== 'ADMIN' && user?.role !== 'OWNER'}
                          >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="SALES">Sales Rep</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs text-slate-800">
                            <span className={`w-1.5 h-1.5 rounded-full ${tm.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-400'}`} /> 
                            {tm.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {tm.status === 'ACTIVE' && (
                              <button 
                                onClick={() => deactivateUser(tm.id)}
                                className="px-2 py-1 text-[10px] border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-600"
                              >
                                Suspend
                              </button>
                            )}
                            <button 
                              onClick={() => deleteTeamMember(tm.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleAddTeammate} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Invite Team Member
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Teammate Name</label>
                  <input 
                    type="text" 
                    placeholder="Ankit Patel"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Corporate Email Address</label>
                  <input 
                    type="email" 
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Workspace Role</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none min-h-[38px]"
                  >
                    <option value="ADMIN">Admin (Full Control)</option>
                    <option value="MANAGER">Manager (Campaign Creator)</option>
                    <option value="SALES">Sales Representative</option>
                    <option value="VIEWER">Viewer (Read-Only)</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Send Team Invitation PIN
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SECURITY VAULT, MFA & LIVE SYSTEM LOGS */}
        {activeSubTab === 'security' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Security Configuration Panel</h3>
              <p className="text-xs text-slate-500">Configure Multi-Factor parameters, change security keys, and inspect trace logs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card A: Multi-Factor Authentication */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4.5 h-4.5 text-blue-600" /> Multi-Factor Authentication (MFA)
                </h4>

                <p className="text-xs text-slate-600 leading-normal">
                  Secure your outreach dashboard logins by requiring a secondary verification token from google authenticator.
                </p>

                {mfaSuccess || (user as any)?.mfaEnabled ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      MFA is currently <strong>ENABLED</strong> and securing this account.
                    </div>
                    <button 
                      onClick={handleDisableMFA}
                      className="px-3.5 py-2 bg-white hover:bg-red-50 border border-red-200 text-xs text-red-600 font-semibold rounded-lg transition-colors"
                    >
                      Disable Multi-Factor Auth
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-800 text-[11px]">
                      MFA is currently inactive. Secure your SalesPilot space today.
                    </div>

                    {!mfaQrCode ? (
                      <button 
                        onClick={handleStartMFAEnroll}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Enroll MFA Token Generator
                      </button>
                    ) : (
                      <form onSubmit={handleVerifyMFA} className="space-y-4 bg-white p-4 border border-slate-200 rounded-xl">
                        <div className="text-center">
                          <img src={mfaQrCode} alt="TOTP QR Code" className="mx-auto border border-slate-100 rounded-lg" />
                          <p className="text-[10px] font-mono text-slate-500 mt-2">Secret Code: <strong className="text-slate-800">{mfaSecret}</strong></p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Authentication Token PIN</label>
                          <input 
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-center text-sm font-bold tracking-widest p-2.5 rounded-lg outline-none"
                            required
                          />
                        </div>
                        {mfaError && <p className="text-[10px] text-red-600 font-bold">{mfaError}</p>}
                        <button 
                          type="submit"
                          className="w-full py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition"
                        >
                          Verify and Enable MFA
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Card B: Change Account Password */}
              <form onSubmit={handlePasswordSave} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-blue-600" /> Reset User Password
                </h4>

                {passSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs">
                    Password successfully updated!
                  </div>
                )}

                {passError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
                    {passError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                    <input 
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Apply New Password
                </button>
              </form>
            </div>

            {/* Card C: Device Activity & Login History */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4.5 h-4.5 text-blue-600" /> Dynamic Device Login History
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Logs of active client connections, mapped via browser agents, IP networks, and location tracking.</p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-mono text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Connection IP</th>
                      <th className="px-4 py-2.5">Client Device / Browser</th>
                      <th className="px-4 py-2.5">Network Location</th>
                      <th className="px-4 py-2.5 text-right">Status Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[10px]">
                    {loginHistory.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-600 font-sans">{new Date(item.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-2 font-bold text-slate-800">{item.ip}</td>
                        <td className="px-4 py-2 text-slate-600 font-sans">{item.browser} ({item.device})</td>
                        <td className="px-4 py-2 text-slate-500 font-sans">{item.location}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            item.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card D: Real-Time Security Audit logs */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4.5 h-4.5 text-blue-600" /> Real-time System Audit Trails
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">TLS-encrypted traces documenting security status alterations and personnel creations.</p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-mono text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Audit Action</th>
                      <th className="px-4 py-2.5">Category Module</th>
                      <th className="px-4 py-2.5">Browser/Device</th>
                      <th className="px-4 py-2.5">Network Node</th>
                      <th className="px-4 py-2.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[10px]">
                    {activityLogs.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-900 font-sans font-bold">{item.action}</td>
                        <td className="px-4 py-2 text-blue-600 font-sans font-medium">{item.module}</td>
                        <td className="px-4 py-2 text-slate-600 font-sans">{item.browser} ({item.device})</td>
                        <td className="px-4 py-2 text-slate-400">{item.ip}</td>
                        <td className="px-4 py-2 text-right text-slate-500 font-sans">{new Date(item.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INTEGRATION CENTER */}
        {activeSubTab === 'integrations' && (
          <div className="space-y-8 animate-fade-in text-slate-800">
            {/* Elegant Main Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Integration Center Hub</h3>
                <p className="text-xs text-slate-500">
                  Provision API configurations, trigger AI companion audits, verify B2B leads, sync Google Maps scrapers, post Slack webhooks, and monitor worker queues.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchWebhookAndWorkerData}
                  className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-all cursor-pointer"
                  title="Force Sync Server Logs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  99.8% Online
                </div>
              </div>
            </div>

            {/* Local Hub Sub-Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'connectors', label: '1. Connectors', icon: Key },
                { id: 'ai_playground', label: '2. AI Companion', icon: Brain },
                { id: 'b2b_directory', label: '3. B2B Directories', icon: Users },
                { id: 'google_maps', label: '4. Maps Scraper', icon: Globe },
                { id: 'webhooks', label: '5. Alerts & Hooks', icon: Network },
                { id: 'workers', label: '6. Workers & Queues', icon: Clock },
                { id: 'diagnostics', label: '7. Health & Costs', icon: Activity }
              ].map((subT) => {
                const SubIcon = subT.icon;
                const isSelected = localIntegrationsTab === subT.id;
                return (
                  <button
                    key={subT.id}
                    onClick={() => setLocalIntegrationsTab(subT.id as any)}
                    className={`flex-1 py-2 px-3 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                    {subT.label}
                  </button>
                );
              })}
            </div>

            {/* SUBTAB 1: API KEYS AND CONNECTORS CONFIG */}
            {localIntegrationsTab === 'connectors' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LLM Platform Credentials */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Platform Keys</h4>
                    </div>
                    <p className="text-xs text-slate-500">Required to power the AI Outbound Copy generator, Website auditors, and model fallback router.</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">OpenAI Enterprise Key</label>
                        <input 
                          type="password" 
                          placeholder="••••••••••••••••••••••••"
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono"
                          disabled
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">Managed securely under platform environment variables.</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Gemini API Key Override</label>
                        <input 
                          type="password" 
                          placeholder="AI Studio API key"
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none text-slate-800"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerSaveCreds('gemini', { geminiApiKey })}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all"
                    >
                      {savingSection === 'gemini' ? 'Saving Override...' : savedSection === 'gemini' ? '✓ Overrode Gemini Active' : 'Update Gemini API Key'}
                    </button>
                  </div>

                  {/* B2B Directory Integration Keys */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Directory & Scraper Keys</h4>
                    </div>
                    <p className="text-xs text-slate-500">Enables high-speed prospecting, email discovery, and corporate record enrichment databases.</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Hunter.io Organization Key</label>
                        <input 
                          type="password" 
                          placeholder="••••••••••••••••••••••••"
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono"
                          disabled
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('Directory service credentials stored safely on platform vaults.')}
                      className="w-full py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-all"
                    >
                      Authorize Third-Party Scrapers
                    </button>
                  </div>

                  {/* CRM Integration Sync */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Supabase & CRM Sync</h4>
                    </div>
                    <p className="text-xs text-slate-500">Sync lead status, outreach attempts, appointments, and deal milestones to Supabase tables.</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Supabase REST Endpoint</label>
                        <input 
                          type="text" 
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Supabase Service Role Key (Encrypted)</label>
                        <input 
                          type="password" 
                          value={supabaseAnonKey}
                          onChange={(e) => setSupabaseAnonKey(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none text-slate-800"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerSaveCreds('supabase', { supabaseUrl, supabaseAnonKey })}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all"
                    >
                      {savingSection === 'supabase' ? 'Synchronizing Keys...' : savedSection === 'supabase' ? '✓ CRM Synced' : 'Update Database Connection'}
                    </button>
                  </div>

                  {/* Payment Gateway and Messaging */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Gateways & Notifications</h4>
                    </div>
                    <p className="text-xs text-slate-500">Required to manage Cashfree billing checkouts and WhatsApp Business/Slack trigger nodes.</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Cashfree App ID Override</label>
                        <input 
                          type="text" 
                          value={cashfreeAppId}
                          onChange={(e) => setCashfreeAppId(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">WhatsApp Sandbox Access Token</label>
                        <input 
                          type="password" 
                          placeholder="••••••••••••••••••••••••"
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono"
                          disabled
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerSaveCreds('cashfree', { cashfreeAppId })}
                      className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg transition-all"
                    >
                      {savingSection === 'cashfree' ? 'Saving App ID...' : savedSection === 'cashfree' ? '✓ Gateway Set' : 'Save Checkout Gateway App ID'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: AI COMPANION RESEARCH PLAYGROUND */}
            {localIntegrationsTab === 'ai_playground' && (
              <div className="space-y-8">
                {/* 1. Website Audit */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Gemini Website Conversion Audit</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-2 py-0.5">Gemini 1.5 Flash</span>
                  </div>
                  <p className="text-xs text-slate-500">Provide any B2B company website. Gemini will audit copy, estimate their tech stack, and craft custom sales hooks.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Target Site URL</label>
                      <input 
                        type="text" 
                        value={geminiUrl}
                        onChange={(e) => setGeminiUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Audit Focus</label>
                      <select 
                        value={geminiFocus}
                        onChange={(e) => setGeminiFocus(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                      >
                        <option>Identify B2B pain points</option>
                        <option>Extract estimated tech stack</option>
                        <option>Draft 3 personalized email angles</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleWebsiteAudit}
                    disabled={isAnalyzingWebsite}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2"
                  >
                    {isAnalyzingWebsite ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Analyze Company Website
                  </button>

                  {geminiAnalysis && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs leading-relaxed text-slate-700 font-mono">
                      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">AUDIT ANALYSIS RESULT</div>
                      {geminiAnalysis.bottlenecks && (
                        <div>
                          <p className="font-bold text-slate-800">⚠️ Conversion Bottlenecks:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {geminiAnalysis.bottlenecks.map((b: string, i: number) => <li key={i}>{b}</li>)}
                          </ul>
                        </div>
                      )}
                      {geminiAnalysis.outboundAngles && (
                        <div className="mt-2">
                          <p className="font-bold text-slate-800">✉️ Generated Outbound Email Hooks:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {geminiAnalysis.outboundAngles.map((a: string, i: number) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      )}
                      {geminiAnalysis.estimatedTechStack && (
                        <div className="mt-2">
                          <p className="font-bold text-slate-800">🛠️ Estimated Tech Stack:</p>
                          <p className="text-slate-600">{geminiAnalysis.estimatedTechStack.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Document Audit */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Gemini Contract & Document Auditor</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-100 rounded px-2 py-0.5">Gemini 1.5 Pro</span>
                  </div>
                  <p className="text-xs text-slate-500">Paste any sales proposals, legal SLAs, or service agreements. Gemini will check commitments and spot potential compliance loopholes.</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Document Content</label>
                      <textarea 
                        value={geminiDocText}
                        onChange={(e) => setGeminiDocText(e.target.value)}
                        rows={5}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Auditing Objective</label>
                      <input 
                        type="text" 
                        value={geminiObjective}
                        onChange={(e) => setGeminiObjective(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleDocumentAudit}
                    disabled={isAuditingDoc}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2"
                  >
                    {isAuditingDoc ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Audit SLA & Document
                  </button>

                  {geminiDocResult && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs leading-relaxed text-slate-700 font-mono">
                      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex justify-between">
                        <span>DOCUMENT AUDIT SUMMARY</span>
                        <span className="text-blue-700">Compliance Score: {geminiDocResult.complianceScore}%</span>
                      </div>
                      <div>
                        <p className="font-bold text-amber-600">⚠️ Loopholes & Risks:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {geminiDocResult.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                      <div className="mt-2">
                        <p className="font-bold text-slate-800">🔍 Key Commitments Extracted:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {geminiDocResult.commitments.map((c: string, i: number) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                      <div className="mt-2">
                        <p className="font-bold text-red-600">⛔ Legal Gaps:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {geminiDocResult.gapsIdentified.map((g: string, i: number) => <li key={i}>{g}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Competitive Intelligence */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">3. Gemini Competitor Battle Cards</h4>
                  </div>
                  <p className="text-xs text-slate-500">Input competitor name. Gemini compiles structural counter-arguments, pricing analysis, and battlecard hooks.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Competitor Name</label>
                      <input 
                        type="text" 
                        value={competitorName}
                        onChange={(e) => setCompetitorName(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">My Unique Selling Proposition</label>
                      <input 
                        type="text" 
                        value={competitorAdvantage}
                        onChange={(e) => setCompetitorAdvantage(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleCompetitorResearch}
                    disabled={isResearchingComp}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2"
                  >
                    {isResearchingComp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Build Competitor Battle Card
                  </button>

                  {competitorResult && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs leading-relaxed text-slate-700 font-mono">
                      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex justify-between">
                        <span>BATTLE CARD: {competitorName.toUpperCase()}</span>
                        <span>Tier: {competitorResult.marketShare}</span>
                      </div>
                      <div>
                        <p className="font-bold text-red-600">❌ Competitor Core Gaps:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {competitorResult.competitorWeaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                      <div className="mt-2">
                        <p className="font-bold text-emerald-600">🛡️ SalesPilot Winning Pitch Angles:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {competitorResult.battleCardAngles.map((a: string, i: number) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded flex justify-between text-[11px]">
                        <div><strong>Competitor Average Price:</strong> {competitorResult.pricingComparison.competitor}</div>
                        <div><strong>SalesPilot Edge Price:</strong> {competitorResult.pricingComparison.salespilot}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Compliance Knowledge Search */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">4. Industry Compliance Knowledge Search</h4>
                  </div>
                  <p className="text-xs text-slate-500">Consult the central LLM compliance engine regarding B2B lead list scraping or email regulations (e.g. GDPR, Indian DPDP Act).</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Regulatory Sector</label>
                      <input 
                        type="text" 
                        value={complianceSector}
                        onChange={(e) => setComplianceSector(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Compliance Target Query</label>
                      <input 
                        type="text" 
                        value={complianceQuery}
                        onChange={(e) => setComplianceQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleComplianceSearch}
                    disabled={isSearchingCompliance}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2"
                  >
                    {isSearchingCompliance ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Search Compliance Guidelines
                  </button>

                  {complianceResult && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs leading-relaxed text-slate-700 font-mono">
                      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">COMPLIANCE REPORT</div>
                      <p>{complianceResult.summary}</p>
                      <div className="mt-2 space-y-2">
                        <p className="font-bold text-emerald-600">📋 Essential Guardrails:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {complianceResult.guardrails.map((g: string, i: number) => <li key={i}>{g}</li>)}
                        </ul>
                      </div>
                      <p className="mt-2 text-slate-500 italic">Recommendation: {complianceResult.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 3: B2B DIRECTORIES */}
            {localIntegrationsTab === 'b2b_directory' && (
              <div className="space-y-8">
                {/* 2. Hunter.io Email Verifier */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Hunter Email Deliverability Verifier</h4>
                  </div>
                  <p className="text-xs text-slate-500">Input any business email. Checks SMTP servers, bounces risk, Catch-all setups, and verifies validity.</p>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={hunterEmail}
                      onChange={(e) => setHunterEmail(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none"
                    />
                    <button 
                      onClick={handleHunterVerify}
                      disabled={isVerifyingHunter}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 font-mono"
                    >
                      {isVerifyingHunter ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'VERIFY SMTP'}
                    </button>
                  </div>

                  {hunterVerifyResult && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <strong>Target Email: {hunterVerifyResult.email}</strong>
                        <span className={`font-bold ${hunterVerifyResult.status === 'DELIVERABLE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {hunterVerifyResult.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-slate-600">
                        <div>SMTP Handshake: <strong className="text-slate-800">{hunterVerifyResult.smtpCheck}</strong></div>
                        <div>Deliverability Confidence: <strong className="text-slate-800">{hunterVerifyResult.confidenceScore}%</strong></div>
                        <div>Disposable Domain: <strong className="text-slate-800">{hunterVerifyResult.isDisposable ? 'YES' : 'NO'}</strong></div>
                        <div>Catch-all Inbox: <strong className="text-slate-800">{hunterVerifyResult.isCatchAll ? 'YES' : 'NO'}</strong></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Deep Enrichment Lookups */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Clearbit */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase">
                      <Building className="w-4 h-4 text-blue-600" />
                      Clearbit Techstack
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter Domain"
                      value={clearbitDomain}
                      onChange={(e) => setClearbitDomain(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg"
                    />
                    <button 
                      onClick={handleClearbitEnrich}
                      disabled={isEnrichingClearbit}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg"
                    >
                      {isEnrichingClearbit ? 'Enriching...' : 'Enrich Domain'}
                    </button>
                    {clearbitResult && (
                      <div className="p-2 bg-white border border-slate-150 rounded space-y-1 text-[11px]">
                        <div><strong>Legal:</strong> {clearbitResult.legalName}</div>
                        <div><strong>Employees:</strong> {clearbitResult.metrics.employees}</div>
                        <div><strong>Revenue:</strong> {clearbitResult.metrics.estimatedRevenue}</div>
                        <div className="text-[10px] text-slate-500 overflow-hidden text-ellipsis"><strong>Tech:</strong> {clearbitResult.techStack.slice(0, 3).join(', ')}</div>
                      </div>
                    )}
                  </div>

                  {/* PDL */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase">
                      <User className="w-4 h-4 text-indigo-600" />
                      People Data Labs
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter Person Name"
                      value={pdlName}
                      onChange={(e) => setPdlName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg"
                    />
                    <button 
                      onClick={handlePdlSearch}
                      disabled={isSearchingPdl}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg"
                    >
                      {isSearchingPdl ? 'Searching...' : 'Search Job History'}
                    </button>
                    {pdlResult && (
                      <div className="p-2 bg-white border border-slate-150 rounded space-y-1 text-[11px]">
                        <div><strong>Title:</strong> {pdlResult.title}</div>
                        <div><strong>Company:</strong> {pdlResult.currentCompany}</div>
                        <div><strong>Location:</strong> {pdlResult.location}</div>
                        <div className="text-[10px] text-slate-500"><strong>Prev:</strong> {pdlResult.jobHistory[1]?.title || 'N/A'}</div>
                      </div>
                    )}
                  </div>

                  {/* Crunchbase */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase">
                      <Database className="w-4 h-4 text-purple-600" />
                      Crunchbase Funding
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter Corporate"
                      value={crunchbaseCompany}
                      onChange={(e) => setCrunchbaseCompany(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg"
                    />
                    <button 
                      onClick={handleCrunchbaseSearch}
                      disabled={isSearchingCrunchbase}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg"
                    >
                      {isSearchingCrunchbase ? 'Searching...' : 'Fetch Funding Rounds'}
                    </button>
                    {crunchbaseResult && (
                      <div className="p-2 bg-white border border-slate-150 rounded space-y-1 text-[11px]">
                        <div><strong>Total funding:</strong> {crunchbaseResult.totalFundingRaised}</div>
                        <div><strong>Last Round:</strong> {crunchbaseResult.lastFundingType}</div>
                        <div className="text-[10px] text-slate-500 overflow-hidden text-ellipsis"><strong>Lead:</strong> {crunchbaseResult.leadInvestors[0]}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: GOOGLE MAPS SCRAAPER & IMPORT SYSTEM */}
            {localIntegrationsTab === 'google_maps' && (
              <div className="space-y-6">
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Google Maps B2B Local Leads Scraper</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Extract local businesses (Web agencies, corporate offices, clinics, logistics, manufacturing units) matching a keyword and location. 
                    <strong> Scrape detailed address, rating, website, and phone, then import them directly into the SalesPilot CRM Leads dashboard with 1 click!</strong>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Local Business Query Keyword</label>
                      <input 
                        type="text" 
                        value={mapsQuery}
                        onChange={(e) => setMapsQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Target Indian City / Location</label>
                      <input 
                        type="text" 
                        value={mapsLocation}
                        onChange={(e) => setMapsLocation(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleMapsSearch}
                    disabled={isSearchingMaps}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 font-mono"
                  >
                    {isSearchingMaps ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Scrape Google Maps Listings
                  </button>

                  {mapsResults.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-slate-500 uppercase font-mono">SCRAPED LOCAL BUSINESSES (READY FOR EXPORT TO CRM)</div>
                      <div className="grid grid-cols-1 gap-4">
                        {mapsResults.map((biz) => (
                          <div key={biz.placeId} className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs font-mono">
                            <div className="space-y-1.5 flex-1">
                              <p className="text-sm font-bold text-slate-900">{biz.name}</p>
                              <p className="text-slate-600">📍 {biz.address}</p>
                              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                <span className="text-amber-600 font-bold">⭐ {biz.rating} ({biz.reviewsCount} reviews)</span>
                                <span>🌐 {biz.website}</span>
                                <span>📞 {biz.phone}</span>
                              </div>
                            </div>
                            <div className="md:text-right">
                              <button 
                                onClick={() => handleMapsImport(biz)}
                                disabled={isImportingMaps === biz.placeId}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              >
                                {isImportingMaps === biz.placeId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                Import into CRM
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 5: ALERTS & WEBHOOK TARGETS CONFIG */}
            {localIntegrationsTab === 'webhooks' && (
              <div className="space-y-8">
                {/* Outbound Messaging Alerts (WhatsApp & Slack) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* WhatsApp Sandbox dispatch */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      WhatsApp Notification Dispatcher
                    </div>
                    <p className="text-slate-500 text-xs">Send templated WhatsApp notifications (e.g., appointment reminders or invoice status upgrades).</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Recipient Mobile (With Country Code)</label>
                        <input 
                          type="text" 
                          value={waPhone}
                          onChange={(e) => setWaPhone(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Approved Message Template</label>
                        <select 
                          value={waTemplate}
                          onChange={(e) => setWaTemplate(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg"
                        >
                          <option value="wa_tpl_1">consultation_reminder (Utility)</option>
                          <option value="wa_tpl_2">payment_receipt (Utility)</option>
                          <option value="wa_tpl_3">campaign_alert (Marketing)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Template Variables (Comma separated)</label>
                        <input 
                          type="text" 
                          value={waVariables}
                          onChange={(e) => setWaVariables(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSendWa}
                      disabled={isSendingWa}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all"
                    >
                      {isSendingWa ? 'Dispatching...' : 'Dispatch WhatsApp Alert'}
                    </button>
                    {waSuccess && <div className="text-emerald-700 font-mono font-bold text-[11px] mt-1">✓ {waSuccess}</div>}
                  </div>

                  {/* Slack Alert posting */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase">
                      <Network className="w-4 h-4 text-pink-600" />
                      Slack Channel Webhook Alert
                    </div>
                    <p className="text-slate-500 text-xs">Post real-time deal alerts, system telemetry updates, or outbound analytics warnings to team channels.</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Target Channel</label>
                        <input 
                          type="text" 
                          value={slackChannel}
                          onChange={(e) => setSlackChannel(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Custom Message Body</label>
                        <textarea 
                          value={slackMessage}
                          onChange={(e) => setSlackMessage(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSendSlack}
                      disabled={isSendingSlack}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-all"
                    >
                      {isSendingSlack ? 'Posting...' : 'Post Slack Notification'}
                    </button>
                    {slackSuccess && <div className="text-pink-700 font-mono font-bold text-[11px] mt-1">✓ {slackSuccess}</div>}
                  </div>
                </div>

                {/* Webhooks Subscriptions Engine */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Outgoing Webhooks Subscription Engine</h4>
                  </div>
                  <p className="text-xs text-slate-500">Configure target URLs to receive JSON POST payloads when events occur in SalesPilot (e.g. lead.created, payment.success).</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Webhook Name</label>
                      <input 
                        type="text" 
                        value={whName}
                        onChange={(e) => setWhName(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Trigger Event</label>
                      <select 
                        value={whEvent}
                        onChange={(e) => setWhEvent(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg"
                      >
                        <option value="lead.created">lead.created</option>
                        <option value="payment.success">payment.success</option>
                        <option value="meeting.scheduled">meeting.scheduled</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Destination Target URL</label>
                      <input 
                        type="text" 
                        value={whTargetUrl}
                        onChange={(e) => setWhTargetUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateWebhook}
                    disabled={isCreatingWebhook}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 font-mono"
                  >
                    <Plus className="w-4 h-4" /> Register Outgoing Hook
                  </button>

                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-500 uppercase font-mono">ACTIVE WEBHOOK CONFIGURATIONS</div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs font-mono">
                        <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[10px]">
                          <tr>
                            <th className="p-3 text-left">NAME</th>
                            <th className="p-3 text-left">EVENT</th>
                            <th className="p-3 text-left">TARGET URL</th>
                            <th className="p-3 text-left">SECURE SIGNATURE SECRET</th>
                            <th className="p-3 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {whConfigs.map((cfg) => (
                            <tr key={cfg.id}>
                              <td className="p-3 font-bold text-slate-900">{cfg.name}</td>
                              <td className="p-3 text-indigo-600">{cfg.event}</td>
                              <td className="p-3 truncate max-w-xs">{cfg.targetUrl}</td>
                              <td className="p-3 text-[10px] text-slate-500 font-mono">{cfg.secret}</td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => handleDeleteWebhook(cfg.id)}
                                  className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 6: BACKGROUND WORKERS & SYNCS LOGS */}
            {localIntegrationsTab === 'workers' && (
              <div className="space-y-8">
                {/* Workers Status and fail recovery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Queues capacity */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Background Redis Queue Worker Capacity</h4>
                    </div>
                    <div className="space-y-3 font-mono text-xs">
                      {workerQueues ? (
                        Object.entries(workerQueues).map(([key, q]: any) => (
                          <div key={key} className="p-3.5 bg-white border border-slate-150 rounded-xl space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-800">{q.name}</span>
                              <span className="text-indigo-600">Active jobs: {q.activeJobs}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>Throughput: {q.completedJobs} completed / {q.failedJobs} failures</span>
                              <span>Concurrency: {q.concurrency} worker loops ({q.rateLimit})</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 p-4 text-center">Loading Worker details...</div>
                      )}
                    </div>
                  </div>

                  {/* Failed Jobs manager */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Failed Worker Job Recovery Loop</h4>
                    </div>
                    <div className="space-y-3 font-mono text-xs">
                      {failedJobs.length > 0 ? (
                        failedJobs.map((job) => (
                          <div key={job.id} className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl space-y-2">
                            <div className="flex justify-between font-bold text-rose-700">
                              <span>Queue: {job.queue}</span>
                              <span>Retries: {job.retries}/{job.maxRetries}</span>
                            </div>
                            <p className="text-[11px] text-rose-600">Error: {job.error}</p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-400">Next attempt: {new Date(job.nextRetryAt).toLocaleTimeString()}</span>
                              <button 
                                onClick={() => handleRetryFailedJob(job.id)}
                                disabled={isRetryingJob === job.id}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded cursor-pointer"
                              >
                                {isRetryingJob === job.id ? 'Recovering...' : 'Force Retry Now'}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-white border border-slate-100 rounded text-center text-slate-500">
                          🎉 Zero failed background jobs currently in recovery queue.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit synchronization logs */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Enterprise Integration Audit & Sync Logs</h4>
                  </div>
                  <p className="text-xs text-slate-500">Live operational events audit trail logging API transactions, credentials usage, and sync completions.</p>
                  
                  <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-2.5 h-64 overflow-y-auto">
                    {syncLogs.length > 0 ? (
                      syncLogs.map((log) => (
                        <div key={log.id} className="border-b border-slate-800 pb-2 flex gap-4">
                          <span className="text-slate-500 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className={`font-bold ${log.level === 'ERROR' ? 'text-rose-500' : log.level === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {log.level}
                          </span>
                          <span className="text-blue-400 font-bold uppercase">{log.pluginId}</span>
                          <div className="flex-1 space-y-1">
                            <p className="text-slate-200 font-bold">{log.message}</p>
                            {log.details && <p className="text-slate-400 text-[10px] leading-relaxed">{log.details}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 text-center py-10">No operational audit logs generated yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 7: HEALTH DIAGNOSTICS & AI COSTS */}
            {localIntegrationsTab === 'diagnostics' && (
              <div className="space-y-8">
                {/* Active Latency Pings & Uptime checklist */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Connection Health & Latency Pings</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      {lastCheckedHealth && <span className="text-[10px] text-slate-400 font-mono">Last Checked: {lastCheckedHealth}</span>}
                      <button 
                        onClick={handlePingHealth}
                        disabled={isPingingHealth}
                        className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg text-xs font-mono flex items-center gap-1 transition-all"
                      >
                        {isPingingHealth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'RUN Active ping tests'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {healthServices ? (
                      Object.entries(healthServices).map(([key, s]: any) => (
                        <div key={key} className="p-4 bg-white border border-slate-150 rounded-xl flex items-center justify-between font-mono text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 uppercase text-[11px]">{s.name}</span>
                            <div className="flex gap-3 text-[10px] text-slate-500">
                              <span>Latency: <strong className="text-slate-800">{s.pingMs}ms</strong></span>
                              <span>Uptime: <strong className="text-slate-800">{s.uptime}%</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-600">ONLINE</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 md:col-span-3">
                        Run active connection health-checks to list live latency pings.
                      </div>
                    )}
                  </div>
                </div>

                {/* Enterprise Token Tracking & Cost Management */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Enterprise Token Usage & Cost Routing Dashboard (24H)</h4>
                  </div>
                  <p className="text-xs text-slate-500">Governance analytics monitoring tokens spent, direct cost tracking, and router failovers across OpenAI vs Gemini engines.</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs text-slate-700">
                    {/* OpenAI Stats */}
                    <div className="p-5 bg-white border border-slate-150 rounded-xl space-y-2">
                      <div className="font-bold text-purple-700 border-b border-slate-100 pb-1 uppercase text-[11px]">OpenAI Metrics</div>
                      <div>Completed Calls: <strong className="text-slate-800">{aiStats ? aiStats.openai.calls : 1240}</strong></div>
                      <div>Tokens Consumed: <strong className="text-slate-800">{aiStats ? aiStats.openai.tokens : 450000}</strong></div>
                      <div>Total Cost: <strong className="text-slate-800">${aiStats ? aiStats.openai.costUsd : '1.35'} USD</strong></div>
                      <div>Error Fail Rate: <strong className="text-rose-600">{aiStats ? aiStats.openai.errorRatePct : 0.9}%</strong></div>
                    </div>

                    {/* Gemini Stats */}
                    <div className="p-5 bg-white border border-slate-150 rounded-xl space-y-2">
                      <div className="font-bold text-blue-700 border-b border-slate-100 pb-1 uppercase text-[11px]">Gemini Metrics</div>
                      <div>Completed Calls: <strong className="text-slate-800">{aiStats ? aiStats.gemini.calls : 850}</strong></div>
                      <div>Tokens Consumed: <strong className="text-slate-800">{aiStats ? aiStats.gemini.tokens : 320000}</strong></div>
                      <div>Total Cost: <strong className="text-slate-800">${aiStats ? aiStats.gemini.costUsd : '0.24'} USD</strong></div>
                      <div>Error Fail Rate: <strong className="text-emerald-600">{aiStats ? aiStats.gemini.errorRatePct : 0.5}%</strong></div>
                    </div>

                    {/* Smart Routing Stats */}
                    <div className="p-5 bg-white border border-slate-150 rounded-xl space-y-2 bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
                      <div className="font-bold text-indigo-700 border-b border-slate-100 pb-1 uppercase text-[11px]">AI Router Failovers</div>
                      <div>Failover Redirects: <strong className="text-indigo-600">{aiStats ? aiStats.router_failovers : 18} instances</strong></div>
                      <div>Fallback Trigger Path: <span className="text-slate-500 font-bold block text-[10px] mt-0.5">OpenAI → Gemini → Offline Notify</span></div>
                      <div className="mt-2 text-[11px] bg-indigo-100/50 text-indigo-800 p-2 rounded leading-tight font-sans">
                        💡 <strong>Fallback routing cost-saving:</strong> Router averted 18 operational blockages and saved ${aiStats ? aiStats.totalSavingsUsd : '4.82'} USD today!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5B: WORKFLOW AUTOMATION ENGINE */}
        {activeSubTab === 'workflows' && (
          <div className="space-y-8 animate-fade-in text-slate-800">
            {/* Header with action button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-600" /> n8n Automation Engine
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Design, manage, and execute complex multi-node CRM and outreach pipelines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingWf(null);
                  setWfName('');
                  setWfDesc('');
                  setWfTriggerType('WEBHOOK');
                  setWfWebhookUrl('');
                  setWfRetries(3);
                  setWfErrorAction('RETRY');
                  setWfSteps([
                    { name: 'Lead Created Hook', type: 'Trigger', description: 'Starts workflow sequence' },
                    { name: 'AI Decision Router', type: 'AI Router', description: 'Evaluates parameters and selects route' },
                    { name: 'Final Dispatch Node', type: 'Action', description: 'Fulfills the sequence' }
                  ]);
                  setIsWfModalOpen(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Workflow
              </button>
            </div>

            {/* Analytics Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Total Executions</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{workflowAnalytics.totalExecutions}</div>
                <p className="text-[9px] text-slate-400 mt-1">Sourced via webhooks & API</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Success Rate</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">{workflowAnalytics.successRate}%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${workflowAnalytics.successRate}%` }}></div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Active Pipelines</div>
                <div className="text-xl font-bold text-indigo-600 mt-1">
                  {workflowAnalytics.activeWorkflows} / {workflowsList.length}
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Running continuously</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Avg Duration</div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{workflowAnalytics.averageDurationMs}ms</div>
                <p className="text-[9px] text-slate-400 mt-1">Optimized parallel execution</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Failures (24h)</div>
                <div className="text-xl font-bold text-rose-600 mt-1">{workflowAnalytics.failedCount}</div>
                <p className="text-[9px] text-rose-400 mt-1">Requires user retry review</p>
              </div>
            </div>

            {/* Split Screen Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Workflows Index List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Workflows Directory</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Total loaded: {workflowsList.length}</span>
                </div>

                {loadingWorkflows ? (
                  <div className="p-12 text-center text-xs text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300 mb-2" />
                    Synchronizing workflows index with n8n instance...
                  </div>
                ) : workflowsList.length === 0 ? (
                  <div className="p-12 text-center text-xs border border-dashed border-slate-200 rounded-xl text-slate-500">
                    No workflows registered. Click "Add Workflow" to initiate your first automation pipeline.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workflowsList.map((wf) => {
                      const isSelected = selectedWf?.id === wf.id;
                      return (
                        <div 
                          key={wf.id}
                          className={`p-5 rounded-xl border transition-all ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/40 shadow-xs' 
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1 cursor-pointer" onClick={() => setSelectedWf(wf)}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-xs font-bold text-slate-900">{wf.name}</h5>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                  wf.triggerType === 'WEBHOOK' ? 'bg-orange-100 text-orange-700' :
                                  wf.triggerType === 'CRON' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {wf.triggerType}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{wf.description}</p>
                              
                              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono pt-2">
                                <div>Nodes: <strong className="text-slate-600">{wf.nodesCount}</strong></div>
                                <div>Error policy: <strong className="text-slate-600">{wf.errorAction}</strong></div>
                                {wf.lastRun && (
                                  <div>Last execution: <strong className="text-slate-600">{new Date(wf.lastRun).toLocaleTimeString()}</strong></div>
                                )}
                              </div>
                            </div>

                            {/* Controls Panel */}
                            <div className="flex flex-col items-end gap-2">
                              {/* Enable / Disable toggle */}
                              <button 
                                onClick={() => handleToggleWorkflow(wf)}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                  wf.status === 'ACTIVE' 
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {wf.status === 'ACTIVE' ? '● ACTIVE' : '○ DISABLED'}
                              </button>

                              {/* Trigger Dispatch */}
                              <button
                                onClick={() => handleRunWorkflow(wf.id)}
                                disabled={isRunningWf === wf.id}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 disabled:text-slate-400 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer"
                              >
                                {isRunningWf === wf.id ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Running...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 fill-indigo-700 text-indigo-700" />
                                    Manual Run
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Quick row of action buttons */}
                          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 justify-between text-[10px] text-slate-400 font-mono">
                            <span className="text-[9px]">ID: {wf.id}</span>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => {
                                  setSelectedWf(wf);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                              >
                                View Pipeline
                              </button>
                              <button 
                                onClick={() => handleCloneWorkflow(wf.id)}
                                className="hover:text-slate-700 font-semibold cursor-pointer"
                              >
                                Clone
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingWf(wf);
                                  setWfName(wf.name);
                                  setWfDesc(wf.description);
                                  setWfTriggerType(wf.triggerType);
                                  setWfWebhookUrl(wf.webhookUrl || '');
                                  setWfRetries(wf.retries);
                                  setWfErrorAction(wf.errorAction);
                                  setWfSteps(wf.steps);
                                  setIsWfModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                              >
                                Edit Settings
                              </button>
                              <button 
                                onClick={() => handleDeleteWorkflow(wf.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Steps Pipeline Visual Visualizer */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider font-mono">
                    Pipeline Visualizer
                  </h4>
                  {selectedWf && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold">
                      {selectedWf.name}
                    </span>
                  )}
                </div>

                {selectedWf ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-normal">
                      Flow map of all execution steps in this sequencer. Active trigger type: <strong>{selectedWf.triggerType}</strong>.
                    </p>

                    {/* Timeline Vertical Layout */}
                    <div className="relative pl-6 space-y-5 border-l-2 border-indigo-200 ml-3">
                      {selectedWf.steps.map((st: any, idx: number) => (
                        <div key={idx} className="relative">
                          {/* Circle Dot Marker */}
                          <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center font-bold text-[9px] text-indigo-600">
                            {idx + 1}
                          </span>
                          <div className="p-3 bg-white border border-slate-150 rounded-lg shadow-2xs">
                            <div className="flex items-center justify-between">
                              <h6 className="text-xs font-bold text-slate-900">{st.name}</h6>
                              <span className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase">
                                {st.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal">{st.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>CREATED: {new Date(selectedWf.createdAt).toLocaleDateString()}</span>
                        <span>NODES COUNT: {selectedWf.nodesCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                    <Network className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
                    Select a workflow pipeline from directory to explore visual execution steps.
                  </div>
                )}
              </div>

            </div>

            {/* Workflow execution logs history panel */}
            <div className="space-y-4 border-t border-slate-100 pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Workflow Execution History Logs</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Live monitoring telemetry stream of active webhook queues and API events.</p>
                </div>
                <button 
                  onClick={fetchWorkflowsData}
                  className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  title="Refresh logs stream"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                      <th className="p-3.5 font-bold">Execution ID</th>
                      <th className="p-3.5 font-bold">Workflow Name</th>
                      <th className="p-3.5 font-bold">Triggered By</th>
                      <th className="p-3.5 font-bold">Duration</th>
                      <th className="p-3.5 font-bold">Started At</th>
                      <th className="p-3.5 font-bold">Status</th>
                      <th className="p-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {executionLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-mono text-slate-500 font-bold">{log.id}</td>
                        <td className="p-3.5 font-bold text-slate-900">{log.workflowName}</td>
                        <td className="p-3.5 text-slate-600 font-mono">{log.triggeredBy}</td>
                        <td className="p-3.5 text-slate-600 font-mono">{log.durationMs}ms</td>
                        <td className="p-3.5 text-slate-500 font-mono">{new Date(log.startedAt).toLocaleTimeString()}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] font-mono ${
                            log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                            log.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                alert(`Payload details:\n${JSON.stringify(log.payload, null, 2)}\n\nSteps status trace:\n${log.stepsExecuted.map((s: any) => `- ${s.stepName}: ${s.status} ${s.output ? `(${s.output})` : ''} ${s.error ? `ERROR: ${s.error}` : ''}`).join('\n')}`);
                              }}
                              className="text-slate-600 hover:text-slate-900 font-mono text-[10px] font-bold underline cursor-pointer"
                            >
                              Explore Payload Trace
                            </button>
                            {log.status === 'FAILED' && (
                              <button
                                onClick={() => handleRetryExecution(log.id)}
                                disabled={isRetryingExec === log.id}
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                              >
                                {isRetryingExec === log.id ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-2.5 h-2.5" />
                                )}
                                Retry Node
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5C: PROMPT LIBRARY */}
        {activeSubTab === 'prompts' && (
          <div className="space-y-8 animate-fade-in text-slate-800">
            {/* Header with action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" /> Enterprise Prompt Template Library
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Design reusable system instructions, declare user variables, and lock baseline safety prompts for outreach sequences.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPrompt(null);
                  setPromptName('');
                  setPromptCategory('Outreach');
                  setPromptSystem('You are an expert sales strategist...');
                  setPromptUserTemplate('Write a cold email pitch to {{leadName}} working at {{companyName}}.');
                  setPromptVariables(['leadName', 'companyName']);
                  setIsPromptModalOpen(true);
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Prompt Template
              </button>
            </div>

            {loadingPrompts ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300 mb-2" />
                Synchronizing secure prompt library modules...
              </div>
            ) : promptsList.length === 0 ? (
              <div className="p-12 text-center text-xs border border-dashed border-slate-200 rounded-xl text-slate-500">
                No templates configured. Click "Add Prompt Template" to begin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {promptsList.map((tpl) => (
                  <div key={tpl.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-2xs relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-purple-100 text-purple-700 rounded-sm">
                            {tpl.category}
                          </span>
                          <h4 className="text-xs font-bold text-slate-950 mt-1.5">{tpl.name}</h4>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">ID: {tpl.id}</span>
                      </div>

                      {/* System Prompt container */}
                      <div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">SYSTEM INSTRUCTIONS</div>
                        <div className="p-3 bg-white border border-slate-150 rounded-lg text-xs text-slate-600 font-mono line-clamp-3 leading-relaxed">
                          {tpl.systemPrompt}
                        </div>
                      </div>

                      {/* User template container */}
                      <div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">USER PROMPT PATTERN</div>
                        <div className="p-3 bg-white border border-slate-150 rounded-lg text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                          {tpl.userPromptTemplate.split(/(\{\{[a-zA-Z0-9_]+\}\})/g).map((word, widx) => {
                            if (word.startsWith('{{') && word.endsWith('}}')) {
                              return <strong key={widx} className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-[10px] font-mono font-bold">{word}</strong>;
                            }
                            return word;
                          })}
                        </div>
                      </div>

                      {/* Variables list */}
                      <div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">DECLARED INPUT VARIABLES</div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tpl.variables.map((variable: string, vidx: number) => (
                            <span key={vidx} className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-mono font-bold rounded-sm border border-slate-300">
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`System: ${tpl.systemPrompt}\nUser: ${tpl.userPromptTemplate}`);
                          alert('Prompt copied successfully to clipboard! Ready to load in sales workspace.');
                        }}
                        className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-bold cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Prompt Code
                      </button>

                      <div className="flex items-center gap-3 text-[10px] font-mono font-bold">
                        <button
                          onClick={() => {
                            setEditingPrompt(tpl);
                            setPromptName(tpl.name);
                            setPromptCategory(tpl.category);
                            setPromptSystem(tpl.systemPrompt);
                            setPromptUserTemplate(tpl.userPromptTemplate);
                            setPromptVariables(tpl.variables);
                            setIsPromptModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(tpl.id)}
                          className="text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WORKFLOW CREATOR / EDITOR MODAL */}
        {isWfModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  {editingWf ? 'Edit Automation Settings' : 'Create Custom Automation Workflow'}
                </h4>
                <button 
                  onClick={() => setIsWfModalOpen(false)}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSaveWorkflow} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Workflow Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Inbound AI routing Sequence"
                    value={wfName}
                    onChange={(e) => setWfName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe what triggers this sequence and what results are saved."
                    value={wfDesc}
                    onChange={(e) => setWfDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 leading-normal"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Trigger Event Node</label>
                    <select
                      value={wfTriggerType}
                      onChange={(e: any) => setWfTriggerType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 font-mono font-bold"
                    >
                      <option value="WEBHOOK">Webhook (Listening URL)</option>
                      <option value="MANUAL">Manual (Button Dispatch)</option>
                      <option value="CRON">Cron (Scheduled Recurrence)</option>
                      <option value="API">API Gateway Endpoint</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Error Failure Policy</label>
                    <select
                      value={wfErrorAction}
                      onChange={(e: any) => setWfErrorAction(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 font-mono font-bold"
                    >
                      <option value="RETRY">Automatic Retry Node (3 Times)</option>
                      <option value="NOTIFY">Slack Admin Warning alert</option>
                      <option value="FALLBACK">Switch to Gemini standard flow</option>
                    </select>
                  </div>
                </div>

                {wfTriggerType === 'WEBHOOK' && (
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Webhook Listening endpoint (n8n)</label>
                    <input
                      type="text"
                      placeholder="https://n8n.yourbrand.com/webhook/flow-name"
                      value={wfWebhookUrl}
                      onChange={(e) => setWfWebhookUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 font-mono"
                    />
                  </div>
                )}

                {/* Steps configuration list builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase">Interactive Step Pipeline Map</label>
                    <button
                      type="button"
                      onClick={() => {
                        setWfSteps([...wfSteps, { name: 'New Custom Node', type: 'Action', description: 'Describe step action here...' }]);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Step Node
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto border border-slate-200 p-3 rounded-xl bg-slate-50">
                    {wfSteps.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-slate-150 rounded-lg shadow-3xs">
                        <span className="text-[10px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) => {
                            const copy = [...wfSteps];
                            copy[idx].name = e.target.value;
                            setWfSteps(copy);
                          }}
                          className="text-xs p-1 outline-none text-slate-800 font-semibold flex-1 min-w-0"
                          placeholder="Step Name"
                        />
                        <select
                          value={st.type}
                          onChange={(e) => {
                            const copy = [...wfSteps];
                            copy[idx].type = e.target.value;
                            setWfSteps(copy);
                          }}
                          className="text-[10px] p-1 font-mono outline-none border border-slate-100 rounded text-slate-600 bg-slate-50"
                        >
                          <option value="Trigger">Trigger</option>
                          <option value="Action">Action</option>
                          <option value="AI Router">AI Router</option>
                          <option value="Gemini Node">Gemini Node</option>
                          <option value="OpenAI Node">OpenAI Node</option>
                          <option value="Gmail Node">Gmail Node</option>
                          <option value="Integration">Integration</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setWfSteps(wfSteps.filter((_, sidx) => sidx !== idx));
                          }}
                          className="p-1 hover:bg-slate-100 text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setIsWfModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    {editingWf ? 'Save Changes' : 'Initialize Workflow Pipeline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PROMPT CREATOR / EDITOR MODAL */}
        {isPromptModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  {editingPrompt ? 'Edit Prompt Template' : 'Add Reusable Prompt Template'}
                </h4>
                <button 
                  onClick={() => setIsPromptModalOpen(false)}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSavePrompt} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Template Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Sleek Outbound Pitch"
                      value={promptName}
                      onChange={(e) => setPromptName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Workspace Category</label>
                    <select
                      value={promptCategory}
                      onChange={(e) => setPromptCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 font-mono font-bold"
                    >
                      <option value="Outreach">Outreach Campaigns</option>
                      <option value="Research">Research Scrapes</option>
                      <option value="CRM">CRM & Qualification</option>
                      <option value="Deals">Deals & Proposals</option>
                      <option value="Custom">Custom Operations</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">System Instructions (Role & Tone)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="You are an elite outreach strategist..."
                    value={promptSystem}
                    onChange={(e) => setPromptSystem(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">User Prompt template (with Variables)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Draft an outbound cold pitch for {{leadName}} at {{companyName}}."
                    value={promptUserTemplate}
                    onChange={(e) => setPromptUserTemplate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 leading-relaxed font-sans"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Declare dynamic parameters using twin braces, e.g., <strong>{`{{leadName}}`}</strong>, <strong>{`{{companyName}}`}</strong>.
                  </p>
                </div>

                {/* Variables tag configuration */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Declared input variables</label>
                  <div className="flex flex-wrap gap-2 items-center p-3 border border-slate-200 bg-slate-50 rounded-xl">
                    {promptVariables.map((variable, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-0.5 text-xs font-mono font-bold rounded flex items-center gap-1">
                        {variable}
                        <button
                          type="button"
                          onClick={() => {
                            setPromptVariables(promptVariables.filter((_, vidx) => vidx !== idx));
                          }}
                          className="hover:text-purple-900 cursor-pointer text-[10px] font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const nextVar = prompt('Enter name of new custom variable:');
                        if (nextVar) {
                          setPromptVariables([...promptVariables, nextVar.trim()]);
                        }
                      }}
                      className="px-2 py-0.5 border border-dashed border-slate-300 hover:border-indigo-500 text-indigo-600 text-xs font-mono font-bold rounded cursor-pointer"
                    >
                      + Variable
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setIsPromptModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    {editingPrompt ? 'Save Changes' : 'Initialize Reusable Prompt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: GMAIL CONTROL CENTER & OUTBOX COMPOSER */}
        {activeSubTab === 'gmail' && (
          <div className="space-y-8 animate-fade-in text-slate-800">
            {/* Elegant Tab Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" /> Google Gmail Workspace Sync
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Securely link multiple enterprise Gmail profiles. Send personalized, rate-limited campaigns, read threads, and track bounces.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Link Gmail Profile
                </button>
              </div>
            </div>

            {/* Grid 1: Linked Profiles */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Linked Google Profiles</h4>
              {gmailAccounts.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No Google Workspace accounts linked to this pipeline workspace.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gmailAccounts.map((account) => (
                    <div key={account.email} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-xs relative">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold font-mono text-sm uppercase">
                            {account.fullName.charAt(0)}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 leading-tight">{account.fullName}</h5>
                            <p className="text-[10px] font-mono text-slate-500 leading-normal">{account.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmEmail(account.email)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="Disconnect account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stats Section */}
                      <div className="grid grid-cols-3 gap-1 bg-white border border-slate-100 rounded-lg p-2.5 text-center font-mono text-[10px]">
                        <div>
                          <p className="text-slate-400">Limits</p>
                          <p className="font-bold text-slate-800 leading-tight mt-0.5">{account.sentToday}/{account.sendingLimit}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Bounces</p>
                          <p className="font-bold text-slate-800 leading-tight mt-0.5">{account.bounceCount}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Retries</p>
                          <p className="font-bold text-slate-800 leading-tight mt-0.5">{account.retryCount}</p>
                        </div>
                      </div>

                      {/* Connection status badge */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-400">STATUS</span>
                        <span className={`px-2 py-0.5 font-bold rounded-full border ${
                          account.status === 'CONNECTED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          ● {account.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grid 2: Composer and Outbox Split */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* Left Column (8/12 wide on big screens): Outbox Composer */}
              <div className="xl:col-span-7 p-6 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-blue-600" /> Outbound Dispatch Composer
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Draft individual test sequences or trigger simulated campaign dispatches.</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Rate-limited outbox</span>
                </div>

                <div className="space-y-4">
                  {/* Sender Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">SELECT SENDER PROFILE</label>
                      <select
                        value={composeSender}
                        onChange={(e) => setComposeSender(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                      >
                        <option value="">-- Choose Connected Email --</option>
                        {gmailAccounts.map((a) => (
                          <option key={a.email} value={a.email}>{a.fullName} ({a.email})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">PREFILL FROM TEMPLATE</label>
                      <select
                        value={composeTemplate}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                      >
                        <option value="">-- Custom (No prefill) --</option>
                        {gmailTemplates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">RECIPIENT EMAIL ADDRESS</label>
                    <input
                      type="email"
                      placeholder="e.g. lead-name@apexmarketing.in (or bounce@test.com to trigger bounce simulation)"
                      value={composeRecipient}
                      onChange={(e) => setComposeRecipient(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">EMAIL SUBJECT LINE</label>
                    <input
                      type="text"
                      placeholder="e.g. Scaling client pipeline for your agency"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                    />
                  </div>

                  {/* Body Textarea */}
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center justify-between">
                      <span>EMAIL MESSAGE BODY (HTML SUPPORTED)</span>
                      <span className="text-[9px] text-slate-400 capitalize">Variable merges active</span>
                    </label>
                    <textarea
                      rows={8}
                      placeholder="Dear Ananya,\n\nI was reviewing Apex Marketing Solutions and loved your projects..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-3 rounded-lg outline-none text-slate-800 font-sans leading-relaxed"
                    />
                  </div>

                  {/* Drag and Drop Attachment zone */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase">ADD ATTACHMENTS</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDropFile}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        isDraggingFile 
                          ? 'border-blue-500 bg-blue-50/50 text-blue-600' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                      }`}
                      onClick={() => document.getElementById('manual_file_upload_input')?.click()}
                    >
                      <input
                        id="manual_file_upload_input"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleManualFileSelect}
                      />
                      <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Drag files here or click to select</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, CSV, and DOCX (Max 25MB)</p>
                    </div>

                    {/* Attachment listings */}
                    {uploadedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-[11px] font-mono text-slate-700">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>{file.filename} ({file.size} KB)</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feedback line */}
                  {composeSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>{composeSuccess}</span>
                    </div>
                  )}

                  {composeError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                      <span>{composeError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSending || gmailAccounts.length === 0}
                      onClick={() => handleSendEmail(true)}
                      className="px-4 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      disabled={isSending || gmailAccounts.length === 0}
                      onClick={() => handleSendEmail(false)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSending ? 'Dispatching...' : 'Dispatch Outbox Email'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column (5/12 wide): Queue & Limits Status */}
              <div className="xl:col-span-5 space-y-6">
                
                {/* Panel A: Queue list tracker */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4.5 h-4.5 text-blue-600" /> Dispatch Queue States
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      {gmailQueue.filter(q => q.status === 'QUEUED' || q.status === 'RETRYING').length} Active
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2.5">
                    {gmailQueue.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-slate-400 font-mono">
                        Queue empty. Dispatched mail dispatches immediately.
                      </div>
                    ) : (
                      gmailQueue.map((item) => (
                        <div key={item.id} className="pt-2 text-xs space-y-1.5 font-sans">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-800 leading-tight truncate max-w-xs">{item.subject}</p>
                              <p className="text-[10px] text-slate-400 font-mono">To: {item.recipient} • Attempts: {item.retryAttempts}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 border ${
                              item.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              item.status === 'QUEUED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              item.status === 'BOUNCED' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                              item.status === 'RETRYING' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          {item.error && (
                            <p className="text-[9px] font-mono text-amber-600 bg-amber-50 p-1.5 rounded leading-normal">
                              Warning: {item.error}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Panel B: Template Designer */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4.5 h-4.5 text-blue-600" /> Custom Sequence Templates
                    </h4>
                  </div>

                  <form onSubmit={handleCreateTemplate} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Template Name</label>
                        <input
                          type="text"
                          placeholder="Warm Intro"
                          value={newTplName}
                          onChange={(e) => setNewTplName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded outline-none text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Category</label>
                        <input
                          type="text"
                          placeholder="Follow Up"
                          value={newTplCategory}
                          onChange={(e) => setNewTplCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded outline-none text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Subject Template</label>
                      <input
                        type="text"
                        placeholder="Scaling client pipeline for {company}"
                        value={newTplSubject}
                        onChange={(e) => setNewTplSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded outline-none text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Body Template</label>
                      <textarea
                        rows={3}
                        placeholder="Hi {first_name}, I loved your project at {company}..."
                        value={newTplBody}
                        onChange={(e) => setNewTplBody(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded outline-none text-slate-800"
                      />
                    </div>

                    {tplSuccess && (
                      <p className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded text-center font-semibold">
                        ✓ Template registered successfully to outbox templates dropdown!
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={!newTplName || !newTplSubject || !newTplBody}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Save Outbound Template
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Split Screen Panel 3: Received Inbox Threads & Replies Chronology */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
              
              {/* Left Panel: Threads List (5/12 column width) */}
              <div className="lg:col-span-5 border-r border-slate-200 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Inbox className="w-4.5 h-4.5 text-blue-600" /> Active Inbox & Replies
                    </h4>
                    
                    {/* Account filter inside split pane */}
                    <select
                      value={selectedGmailAccount}
                      onChange={(e) => setSelectedGmailAccount(e.target.value)}
                      className="text-[11px] font-semibold border-none bg-transparent outline-none text-slate-600 focus:ring-0 max-w-44 truncate"
                    >
                      <option value="">All Accounts</option>
                      {gmailAccounts.map((a) => (
                        <option key={a.email} value={a.email}>{a.email}</option>
                      ))}
                    </select>
                  </div>

                  {/* Gmail Category filter */}
                  <div className="flex items-center gap-1 font-mono text-[9px] overflow-x-auto">
                    {['INBOX', 'SENT', 'DRAFT', 'BOUNCED'].map((lbl) => (
                      <button
                        key={lbl}
                        onClick={() => setActiveGmailLabel(lbl)}
                        className={`px-2.5 py-1 rounded border transition-all shrink-0 cursor-pointer ${
                          activeGmailLabel === lbl 
                            ? 'bg-slate-950 text-white border-slate-900 font-bold' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Threads listings */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-150 max-h-[420px]">
                  {gmailThreads.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">
                      <Inbox className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                      No threads matched active filters.
                    </div>
                  ) : (
                    gmailThreads.map((thread) => (
                      <div
                        key={thread.threadId}
                        onClick={() => fetchThreadMessages(thread.threadId)}
                        className={`p-4 transition-all hover:bg-slate-100 cursor-pointer relative ${
                          activeThreadId === thread.threadId ? 'bg-white border-l-4 border-blue-600 pl-3 shadow-xs' : ''
                        }`}
                      >
                        {thread.isRead === false && (
                          <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-600" />
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span className="truncate max-w-[150px] font-bold text-slate-700 font-sans">{thread.from}</span>
                          <span>{new Date(thread.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <h5 className={`text-xs leading-tight truncate ${thread.isRead === false ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                          {thread.subject}
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate leading-relaxed">
                          {thread.snippet}
                        </p>
                        
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[9px] font-mono px-1.5 py-0.1 bg-slate-200 text-slate-500 rounded uppercase">
                            {thread.messageCount} msg
                          </span>
                          {thread.isDraft && (
                            <span className="text-[9px] font-mono px-1.5 py-0.1 bg-amber-100 text-amber-700 border border-amber-200 rounded font-semibold uppercase">
                              DRAFT
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Panel: Conversation Chronology (7/12 column width) */}
              <div className="lg:col-span-7 flex flex-col bg-white">
                {activeThreadId && threadMessages.length > 0 ? (
                  <div className="flex flex-col h-full">
                    {/* Detail panel header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-sm lg:max-w-md">{threadMessages[0].subject}</h4>
                        <p className="text-[10px] font-mono text-slate-400">Thread ID: {activeThreadId}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveThreadId(null)}
                        className="text-slate-400 hover:text-slate-600 font-mono text-[10px] uppercase border border-slate-200 px-2 py-1 rounded bg-white hover:bg-slate-50 cursor-pointer"
                      >
                        Close Thread
                      </button>
                    </div>

                    {/* Chronic message bubble feeds */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[320px] bg-slate-50/20">
                      {threadMessages.map((msg) => {
                        const isSelf = msg.from === selectedGmailAccount || msg.from === 'sohamkharat481@gmail.com';
                        return (
                          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs uppercase font-mono ${
                              isSelf ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-800'
                            }`}>
                              {isSelf ? 'S' : msg.from.charAt(0)}
                            </div>
                            
                            <div className="space-y-1">
                              <div className={`p-4 rounded-xl shadow-xs text-xs leading-relaxed ${
                                isSelf 
                                  ? 'bg-blue-600 text-white rounded-tr-none' 
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}>
                                <div className="border-b border-white/10 pb-1 mb-2 flex items-center justify-between gap-4 text-[9px] font-mono opacity-80">
                                  <span>From: {msg.from}</span>
                                  <span>{new Date(msg.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: msg.body }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Thread quick reply composer */}
                    <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Quick Inline Reply</label>
                        <textarea
                          rows={2.5}
                          placeholder="Type your response... (Customer will simulate another reply on delivery)"
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                        />
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          disabled={!replyBody}
                          onClick={handleSendReply}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Dispatch Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16">
                    <MessageSquare className="w-12 h-12 text-slate-200 mb-2.5" />
                    <p className="text-xs font-semibold text-slate-500">No message thread selected</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Select a thread from the replies feed on the left to review chronological communications.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Panel 4: Email System Audit Logs */}
            <div className="p-6 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4.5 h-4.5 text-blue-600" /> Complete Campaign Email Logs
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time system trace tracking SMTP handshakes, delivery completions, and bounce states.</p>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-mono text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Sender</th>
                      <th className="px-4 py-2.5">Recipient</th>
                      <th className="px-4 py-2.5">Subject</th>
                      <th className="px-4 py-2.5">Status Trace</th>
                      <th className="px-4 py-2.5 text-right">Attempts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-mono text-[10px]">
                    {gmailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-500 font-sans">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-2 text-slate-700">{log.accountId}</td>
                        <td className="px-4 py-2 text-slate-700 font-bold">{log.recipient}</td>
                        <td className="px-4 py-2 text-slate-600 font-sans truncate max-w-xs">{log.subject}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            log.status === 'BOUNCED' ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' :
                            log.status === 'RETRY_INITIATED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-600">{log.attempts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LINK ACCOUNT MODAL OVERLAY */}
            {isConnectModalOpen && (
              <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
                <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-in">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" /> Link Google Profile
                    </h4>
                    <button onClick={() => setIsConnectModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Sandbox Connect Option */}
                    <form onSubmit={handleConnectAccount} className="space-y-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Option A: Instant Sandbox Simulation</h5>
                        <p className="text-xs text-slate-500 leading-normal mb-3">
                          Quickly provision a mock Google connection with full interactive queueing, bounce checks, and customer reply automations. No credentials needed.
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">PROSPECTIVE EMAIL ADDRESS</label>
                            <input
                              type="email"
                              placeholder="e.g. sales@horizonmedia.io"
                              value={customEmail}
                              onChange={(e) => setCustomEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">FULL SENDER NAME</label>
                            <input
                              type="text"
                              placeholder="e.g. Soham Kharat"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none text-slate-800"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={!customEmail}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors mt-3.5 cursor-pointer disabled:opacity-50"
                        >
                          Generate Sandbox Account
                        </button>
                      </div>
                    </form>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-4 text-[9px] font-mono font-bold text-slate-400 uppercase">OR</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    {/* Real OAuth Option */}
                    <div className="space-y-3">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Option B: Real Google Workspace Sign-In</h5>
                      <p className="text-xs text-slate-500 leading-normal">
                        Authorize SalesPilot to request secure Google REST tokens using client-side OAuth popups. Direct secure pipeline to your real inbox.
                      </p>
                      
                      <button
                        type="button"
                        onClick={triggerRealGoogleLogin}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.59 4.54 1.74l2.36-2.36C17.2 1.54 14.86 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.74 0 10.24-4.5 10.24-10.24 0-.6-.06-1.19-.17-1.74H12.24z"/>
                        </svg>
                        Authenticate Google Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIRM DESTRUCTION DIALOG MODAL */}
            {deleteConfirmEmail && (
              <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
                <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-in p-6 space-y-4">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-8 h-8 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 leading-none">Disconnect Gmail Connection</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Destructive account revocation</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Are you absolutely sure you want to disconnect <strong>{deleteConfirmEmail}</strong>? This will revoke active OAuth tokens from server-side memory immediately. Any queued outbox sequences for this account will fail.
                  </p>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmEmail(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnectAccount(deleteConfirmEmail)}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                    >
                      Agree & Disconnect
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
