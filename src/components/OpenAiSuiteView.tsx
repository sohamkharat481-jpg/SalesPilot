import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Bot, FileText, Globe, Search, RefreshCw, Key, 
  AlertTriangle, Check, Layers, BarChart3, HelpCircle, ArrowRight, 
  ThumbsUp, Volume2, Copy, Trash2, Cpu, MessageSquare, Briefcase, 
  Flame, CheckCircle2, Award, Clock, DollarSign, BookOpen,
  History, Printer, Calculator, Save, Download
} from 'lucide-react';
import { ResearchEngineDashboard } from './ResearchEngineDashboard';

interface Template {
  id: string;
  name: string;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
}

interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  requestCount: number;
  lastRequestTime: string;
}

interface LimitInfo {
  dailyTokenLimit: number;
  dailyCostLimitUsd: number;
  requestsPerMinuteLimit: number;
}

export function OpenAiSuiteView() {
  // Navigation sub-tabs within the OpenAI Suite
  type SubTab = 'research-engine' | 'chat' | 'outbound' | 'intelligence' | 'documents' | 'coach' | 'crm-advisor' | 'usage' | 'gemini-suite';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('research-engine');

  // Load state & configuration
  const [templates, setTemplates] = useState<Template[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [tier, setTier] = useState<string>('PROFESSIONAL');
  const [limits, setLimits] = useState<Record<string, LimitInfo>>({});
  const [loading, setLoading] = useState(true);

  // OpenAI Key stored in client, never exposed directly, sent to backend proxy only if customized
  const [customKey, setCustomKey] = useState<string>(() => localStorage.getItem('salespilot_custom_openai_key') || '');
  const [keySaved, setKeySaved] = useState(false);

  // Streaming & Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentOutput, setCurrentOutput] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // --- FEATURE-SPECIFIC STATES ---

  // 1. AI Chat (with Session memory)
  const [chatSessionId] = useState<string>(() => `session_sp_${Date.now()}`);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    { role: 'assistant', text: 'Welcome to the enterprise SalesPilot OpenAI Co-Pilot! I have active memory of our conversation. Ask me to write campaigns, respond to prospects, or analyze pipeline metrics.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 2. Outbound Copilot
  const [outboundSubTool, setOutboundSubTool] = useState<'email' | 'followup' | 'reply'>('email');
  // Cold Email Writer inputs
  const [emailLeadName, setEmailLeadName] = useState('Ananya Sharma');
  const [emailLeadTitle, setEmailLeadTitle] = useState('Managing Director');
  const [emailCompany, setEmailCompany] = useState('Apex Marketing Solutions');
  const [emailIndustry, setEmailIndustry] = useState('Marketing Agency');
  const [emailPainPoints, setEmailPainPoints] = useState('Sales reps waste 2 hours a day manually typing pitches and outbound email delivery is dropping');
  const [emailStyle, setEmailStyle] = useState('Warm, punchy, consultative & short (3 sentences)');
  // Follow-up Generator inputs
  const [followupThread, setFollowupThread] = useState(`Prospect: thanks for reaching out. We are quite busy right now. Maybe next quarter.\nRep: Understood. Let me know if anything changes.\nProspect: Sure thing.`);
  const [followupTone, setFollowupTone] = useState('Value-focused, dynamic, low-friction');
  // Reply Analysis inputs
  const [replyText, setReplyText] = useState(`Hey Soham, thanks for the ping. Yes, we are currently hiring 3 sales reps and manual personalization is a huge pain point. What are your pricing plans in INR? Do you have an automated scheduler?`);
  const [replyContext, setReplyContext] = useState(`Initial cold email sent on Monday introducing SalesPilot's automatic SMTP scheduling and lead enrichment.`);

  // 3. Intelligence Suite
  const [intelSubTool, setIntelSubTool] = useState<'research' | 'qualify'>('research');
  // AI Research inputs
  const [researchCompany, setResearchCompany] = useState('Apex Marketing Solutions');
  const [researchIndustry, setResearchIndustry] = useState('Outbound Marketing & Advertising');
  const [researchWebsite, setResearchWebsite] = useState('https://apexmarketing.in');
  // Lead Qualification inputs
  const [qualifyLeadName, setQualifyLeadName] = useState('Ananya Sharma');
  const [qualifyCompany, setQualifyCompany] = useState('Apex Marketing Solutions');
  const [qualifyIndustry, setQualifyIndustry] = useState('Outbound Marketing');
  const [qualifyHistory, setQualifyHistory] = useState('Opened email copy 3 times, clicked scheduling calendar slot, responded asking for INR billing terms and pricing plans.');
  const [qualifyNotes, setQualifyNotes] = useState('Wants to equip 3 incoming sales reps by next Tuesday. Seems highly motivated.');

  // 4. Document Studio
  const [docSubTool, setDocSubTool] = useState<'proposal' | 'meeting'>('proposal');
  // Proposal Generator inputs
  const [proposalCompany, setProposalCompany] = useState('Apex Marketing Solutions');
  const [proposalContact, setProposalContact] = useState('Ananya Sharma');
  const [proposalValue, setProposalValue] = useState('50000');
  const [proposalDemands, setProposalDemands] = useState('Must support localized INR Cashfree checkout links, 3 enterprise seats, and warm auxiliary SMTP setup.');
  
  // Enterprise Proposal Generator advanced states
  const [proposalType, setProposalType] = useState<'PROPOSAL' | 'QUOTATION' | 'INVOICE' | 'CONTRACT' | 'SOW'>('PROPOSAL');
  const [proposalEditorContent, setProposalEditorContent] = useState<string>(`# Enterprise Outbound Proposal: Apex Marketing Solutions

**Prepared for:** Apex Marketing Solutions
**Lead contact:** Ananya Sharma
**Value:** ₹50,000 INR (6-Month License)
**Date:** July 08, 2026

---

### 1. Executive Summary
Apex Marketing Solutions is scaling its customer outreach and sales pipeline. Horizon Media will deliver SalesPilot enterprise licenses, automating outbound deliverability and equipping 3 new representatives with server-side AI-personalization sequencers.

### 2. Solution Specifications & Deliverables
- **3x Enterprise Seats:** Full CRM integration, Google Calendar synchronization, and automated sequence triggers.
- **Warm SMTP Setup:** Setup of 4 auxiliary email domains with automated warmup routines.
- **OpenAI & Gemini API Access:** High-performance server-side LLM modules for cold copy composition and instant lead enrichment.

### 3. Financial Agreement (INR)
- **Total Investment:** ₹50,000 INR (Prepaid for 6 Months).
- **Billing Terms:** 100% upfront activation. GST breakdown included on invoice.
- **SLA Commitment:** Priority support under 2 hours response time.`);
  const [showPricingSuggestions, setShowPricingSuggestions] = useState<boolean>(true);
  const [seatCount, setSeatCount] = useState<number>(3);
  const [supportTier, setSupportTier] = useState<'standard' | 'premium' | 'enterprise'>('premium');
  const [proposalHistory, setProposalHistory] = useState<any[]>([
    {
      id: 'prop_hist_1',
      version: '1.0.0',
      type: 'PROPOSAL',
      companyName: 'Apex Marketing Solutions',
      leadName: 'Ananya Sharma',
      valueInr: '50000',
      demands: 'Initial setup for 3 enterprise representatives and dedicated SLA support.',
      content: `# Enterprise Outbound Proposal: Apex Marketing Solutions\n\n**Client:** Apex Marketing Solutions\n**Contact:** Ananya Sharma\n**Value:** ₹50,000 INR (6 Months)\n\n### 1. Executive Summary\nApex Marketing requires enterprise-grade cold email outbounds and verified lead research profiling to scale lead flow.\n\n### 2. Solution Specifications\n- **3 Seats** - Full CRM, Kanban pipelines, & Calendar sync.\n- **Support** - Premium support SLA (under 2 hours response time).\n- **Cashfree Setup** - Native INR payments setup.\n\n### 3. Financial Agreement\n- Total: ₹50,000 INR prepaid.`,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  // Meeting Summary inputs
  const [meetingTranscript, setMeetingTranscript] = useState(`Soham (Horizon Media): Thanks for joining Rajesh.
Rajesh (Apex Sales Admin): Absolutely. We want to scale our outreach next week.
Soham: Perfect. We can set up 3 enterprise seats. The cost is ₹50,000 INR for a 6-month contract.
Rajesh: That sounds perfect. Can we do a pilot of the campaign tool?
Soham: Yes, we can initiate next Tuesday. I will send over the proposal and invoice link today.
Rajesh: Perfect. I will import the leads by Thursday.`);

  // 5. Sales Sparring Coach
  const [objectionText, setObjectionText] = useState('Your software is too expensive. We can just hire cheap interns to copy-paste outreach messages.');
  const [salespersonResponse, setSalespersonResponse] = useState('Interns are error-prone and slow. Our tool is way more secure and fast, and it works 24/7.');

  // 6. CRM Advisory Assistant
  const [crmQuery, setCrmQuery] = useState('Which of my current leads are showing the highest interest, and what outreach campaign is currently performing best?');

  // 7. Gemini AI Co-Pilot Suite
  type GeminiTool = 'website' | 'document' | 'competitor' | 'proposal' | 'knowledge';
  const [geminiTool, setGeminiTool] = useState<GeminiTool>('website');
  const [geminiProvider, setGeminiProvider] = useState<'router' | 'gemini' | 'openai'>('router');
  
  // Website inputs
  const [webUrl, setWebUrl] = useState('https://apexmarketing.in');
  const [webFocus, setWebFocus] = useState('Identify conversion bottlenecks and extract custom pain points for personalized outbound sequence pitches.');
  
  // Document inputs
  const [docTextState, setDocTextState] = useState(`ENTERPRISE SLA & OUTBOUND CAMPAIGN CHARTER v4.2\n- Target Client: Apex Marketing Solutions\n- Volume Commitment: 50,000 monthly outbounds\n- Local Checkout Integration: Cashfree payment API configured with 100% compliant INR pricing.\n- Support: Tier-1 priority support SLA (under 2 hours response time).`);
  const [docObjective, setDocObjective] = useState('Audit this contract draft for gaps, compliance bottlenecks, and list the core business commitments.');
  
  // Competitor inputs
  const [compName, setCompName] = useState('Outreach.io');
  const [compAdvantage, setCompAdvantage] = useState('We provide 100% compliant local INR pricing with built-in Cashfree checkout, custom n8n webhook pipelines, and automatic AI router failovers.');
  
  // Proposal inputs
  const [propText, setPropText] = useState(`PROPOSAL: SalesPilot Outreach Infrastructure Setup\n- Prepared for: Ananya Sharma, Apex Marketing Solutions\n- Seat Licenses: 3 Enterprise Seats\n- Payment: ₹50,000 INR prepaid for 6-months\n- Integrations: Google Gmail and n8n webhook triggers\n- Key SLA: 2 hours support response time`);
  const [propConstraints, setPropConstraints] = useState('Verify proposal matches enterprise package limitations, check local INR billing parameters, and confirm SLA compliance.');
  
  // Knowledge inputs
  const [searchSector, setSearchSector] = useState('Indian B2B SaaS Outreach Compliance 2026');
  const [searchGoal, setSearchGoal] = useState('Summarize major telecom, DND, and email anti-spam laws, highlighting the top 3 compliance guardrails.');

  // Fetch initial setup configurations from express
  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const [tplRes, usageRes] = await Promise.all([
        fetch('/api/v1/openai/templates'),
        fetch('/api/v1/openai/usage')
      ]);
      const tplData = await tplRes.json();
      const usageData = await usageRes.json();

      if (tplData.success) setTemplates(tplData.templates);
      if (usageData.success) {
        setUsage(usageData.stats);
        setTier(usageData.tier);
        setLimits(usageData.limits);
      }
    } catch (err) {
      console.error('Failed to load OpenAI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Auto scroll chat to bottom on conversation update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, currentOutput]);

  // Save/Clear Custom API Key
  const handleSaveCustomKey = (key: string) => {
    localStorage.setItem('salespilot_custom_openai_key', key);
    setCustomKey(key);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleClearCustomKey = () => {
    localStorage.removeItem('salespilot_custom_openai_key');
    setCustomKey('');
  };

  // Helper to force fetch refreshed usage metrics
  const refreshUsage = async () => {
    try {
      const res = await fetch('/api/v1/openai/usage');
      const data = await res.json();
      if (data.success) {
        setUsage(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Execute Stream API
  const handleExecuteAI = async (
    systemPrompt: string, 
    userPrompt: string, 
    sessionId?: string,
    onSuccessCallback?: (response: string) => void,
    provider: 'openai' | 'gemini' | 'router' = 'router'
  ) => {
    setIsGenerating(true);
    setCurrentOutput('');
    setGenerationError(null);

    try {
      const response = await fetch('/api/v1/openai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          model: 'gpt-4o-mini',
          stream: true,
          sessionId,
          customApiKey: customKey || undefined,
          provider
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server rejected generation request.');
      }

      // Stream Reader
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('ReadableStream not supported on this client.');

      let done = false;
      let accumulated = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulated += parsed.text;
                setCurrentOutput(prev => prev + parsed.text);
              }
            } catch (e) {
              // Non-fatal parse errors
            }
          }
        }
      }

      setIsGenerating(false);
      refreshUsage(); // Pull updated token metrics
      if (onSuccessCallback) {
        onSuccessCallback(accumulated);
      }
    } catch (err: any) {
      console.error('AI execution failed:', err);
      setGenerationError(err.message || 'Transmission error. Check server status or API keys.');
      setIsGenerating(false);
    }
  };

  // Chat Submission Handler
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isGenerating) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

    const chatTemplate = templates.find(t => t.id === 'tpl-crm-assistant');
    const sysPrompt = chatTemplate?.systemPrompt || 'You are SalesPilot Co-Pilot, an expert sales growth assistant.';

    // Execute with active SessionId to preserve memory on server
    await handleExecuteAI(
      sysPrompt,
      userText,
      chatSessionId,
      (finalText) => {
        setChatMessages(prev => [...prev, { role: 'assistant', text: finalText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setCurrentOutput(''); // Clear buffer
      }
    );
  };

  // Reset Usage Counter
  const handleResetUsage = async () => {
    if (!confirm('Are you sure you want to reset the organization daily token tracker? This action will be logged in the audit trail.')) return;
    try {
      const res = await fetch('/api/v1/openai/reset-usage', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUsage(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy AI output helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Bespoke AI copy successfully copied to clipboard!');
  };

  // Variable replacement helper for Templates
  const getReplacedTemplatePrompt = (templateId: string, variables: Record<string, string>): { sys: string; user: string } => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return { sys: '', user: '' };

    let userPrompt = tpl.userPromptTemplate;
    Object.entries(variables).forEach(([key, val]) => {
      userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });

    return { sys: tpl.systemPrompt, user: userPrompt };
  };

  // Render specific tool outputs
  const renderCurrentGeneratingOutputCard = (title: string) => {
    return (
      <div id="ai-output-panel" className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600 animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">{title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isGenerating && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                <RefreshCw className="w-3 h-3 animate-spin" /> Live Streaming...
              </span>
            )}
            {!isGenerating && currentOutput && (
              <button 
                onClick={() => handleCopyText(currentOutput)}
                className="px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Custom Copy
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-950 rounded-lg p-4 font-sans text-xs text-slate-100 leading-relaxed whitespace-pre-wrap min-h-32 border border-slate-800">
          {currentOutput || (isGenerating ? 'Synthesizing pipeline intelligence...' : 'Awaiting parameters to execute model...')}
        </div>

        {generationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-lg flex items-start gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Generation Stopped:</strong> {generationError}
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeLimit = limits[tier] || { dailyTokenLimit: 500000, dailyCostLimitUsd: 10.00, requestsPerMinuteLimit: 30 };
  const currentTokenPct = usage ? Math.min(100, Math.round((usage.totalTokens / activeLimit.dailyTokenLimit) * 100)) : 0;
  const currentCostPct = usage ? Math.min(100, Math.round((usage.estimatedCostUsd / activeLimit.dailyCostLimitUsd) * 100)) : 0;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col gap-6 select-none">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" /> SalesPilot OpenAI Co-Pilot Suite
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Leverage premium OpenAI models to generate cold scripts, qualification grids, solution blueprints, and obj-handling coaching tracks.
          </p>
        </div>

        {/* Quick Micro Token Telemetry */}
        {usage && (
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs font-mono text-[10px]">
            <div>
              <p className="text-slate-400">Total API calls</p>
              <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">{usage.requestCount}</p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <p className="text-slate-400">Tokens Daily budget</p>
              <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                {usage.totalTokens.toLocaleString()} / {activeLimit.dailyTokenLimit.toLocaleString()}
              </p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <p className="text-slate-400">Daily Cost Tracker</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-500 leading-tight mt-0.5">
                ${usage.estimatedCostUsd.toFixed(3)} / ${activeLimit.dailyCostLimitUsd.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Vertical Sub-Tab List */}
        <div className="lg:col-span-3 flex flex-col gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs">
          <div className="px-3 py-1.5 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">AI Modules & Tools</div>
          
          <button 
            onClick={() => { setActiveSubTab('research-engine'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'research-engine' ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" /> AI Research Engine
            </span>
            <span className="text-[9px] font-mono bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">LIVE</span>
          </button>

          <button 
            onClick={() => { setActiveSubTab('chat'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'chat' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" /> Co-Pilot AI Chat
            </span>
            <span className="text-[9px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold uppercase">Memory</span>
          </button>

          <button 
            onClick={() => { setActiveSubTab('outbound'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'outbound' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" /> Outbound Copilot
            </span>
            <span className="text-[9px] font-mono bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold uppercase">Pitches</span>
          </button>

          <button 
            onClick={() => { setActiveSubTab('intelligence'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'intelligence' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" /> Intel & Qualification
            </span>
            <span className="text-[9px] font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold uppercase">Bant</span>
          </button>

          <button 
            onClick={() => { setActiveSubTab('documents'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'documents' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Document Studio
            </span>
            <span className="text-[9px] font-mono bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold">Doc</span>
          </button>

          <button 
            onClick={() => { setActiveSubTab('coach'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'coach' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" /> Sales Sparring Coach
            </span>
            <span className="text-[9px] font-mono bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold uppercase">Objections</span>
          </button>

          <button 
            onClick={() => { setActiveSubTab('crm-advisor'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'crm-advisor' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" /> CRM Advisory AI
            </span>
          </button>

          <button 
            onClick={() => { setActiveSubTab('gemini-suite'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'gemini-suite' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" /> Gemini Co-Pilot Suite
            </span>
            <span className="text-[9px] font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold uppercase">Multi-Modal</span>
          </button>

          <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
          
          <button 
            onClick={() => { setActiveSubTab('usage'); setCurrentOutput(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              activeSubTab === 'usage' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" /> Usage, Tiers & Limits
            </span>
          </button>
        </div>

        {/* Right Active Work Panel */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {/* AI RESEARCH ENGINE COCKPIT */}
          {activeSubTab === 'research-engine' && (
            <div className="space-y-6 animate-fade-in">
              <ResearchEngineDashboard />
            </div>
          )}

          {/* TAB 1: CO-PILOT CHAT (CONVERSATION MEMORY) */}
          {activeSubTab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
              
              {/* Chat Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Active Memory Stream</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Session ID: {chatSessionId}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-150 dark:bg-slate-800 px-2.5 py-0.5 rounded font-bold uppercase">
                  GPT-4o mini
                </span>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[360px] bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-2/3 rounded-xl p-3.5 text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className={`block text-[8px] font-mono text-right mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
                {isGenerating && currentOutput && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-2/3 bg-white border border-slate-200 text-slate-800 rounded-xl rounded-tl-none p-3.5 text-xs leading-relaxed shadow-xs relative">
                      <p className="whitespace-pre-wrap">{currentOutput}</p>
                      <span className="block text-[8px] font-mono text-right text-slate-400 mt-1.5">
                        Streaming Co-Pilot Response...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-white">
                <input 
                  type="text"
                  placeholder="Ask the SalesPilot Co-Pilot anything..."
                  value={chatInput}
                  disabled={isGenerating}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
                <button 
                  type="submit"
                  disabled={isGenerating || !chatInput.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: OUTBOUND COPILOT (COLD EMAIL, FOLLOWUP, REPLY ANALYSIS) */}
          {activeSubTab === 'outbound' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                
                {/* Outbound Tool Selector Header */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
                  <button 
                    onClick={() => setOutboundSubTool('email')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
                      outboundSubTool === 'email' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cold Email Writer
                  </button>
                  <button 
                    onClick={() => setOutboundSubTool('followup')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
                      outboundSubTool === 'followup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Follow-up Generator
                  </button>
                  <button 
                    onClick={() => setOutboundSubTool('reply')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
                      outboundSubTool === 'reply' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Reply Analysis
                  </button>
                </div>

                {/* Sub Tool: Cold Email Writer */}
                {outboundSubTool === 'email' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Lead Full Name</label>
                        <input 
                          type="text"
                          value={emailLeadName}
                          onChange={(e) => setEmailLeadName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Lead Title / Role</label>
                        <input 
                          type="text"
                          value={emailLeadTitle}
                          onChange={(e) => setEmailLeadTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Company Name</label>
                        <input 
                          type="text"
                          value={emailCompany}
                          onChange={(e) => setEmailCompany(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Industry Sector</label>
                        <input 
                          type="text"
                          value={emailIndustry}
                          onChange={(e) => setEmailIndustry(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Target Pain Points / Value Hook</label>
                      <textarea 
                        rows={2}
                        value={emailPainPoints}
                        onChange={(e) => setEmailPainPoints(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Email Style Tone</label>
                      <input 
                        type="text"
                        value={emailStyle}
                        onChange={(e) => setEmailStyle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        const { sys, user } = getReplacedTemplatePrompt('tpl-cold-email', {
                          leadName: emailLeadName,
                          leadTitle: emailLeadTitle,
                          companyName: emailCompany,
                          industry: emailIndustry,
                          painPoints: emailPainPoints,
                          style: emailStyle
                        });
                        handleExecuteAI(sys, user);
                      }}
                      disabled={isGenerating}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Generate Sleek Cold Pitch
                    </button>
                  </div>
                )}

                {/* Sub Tool: Follow-up Generator */}
                {outboundSubTool === 'followup' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Email Thread History / Context</label>
                      <textarea 
                        rows={4}
                        value={followupThread}
                        onChange={(e) => setFollowupThread(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-mono font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Desired Tone</label>
                      <input 
                        type="text"
                        value={followupTone}
                        onChange={(e) => setFollowupTone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        const { sys, user } = getReplacedTemplatePrompt('tpl-followup-generator', {
                          emailThread: followupThread,
                          tone: followupTone
                        });
                        handleExecuteAI(sys, user);
                      }}
                      disabled={isGenerating}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Generate Contextual Drip Reminder
                    </button>
                  </div>
                )}

                {/* Sub Tool: Reply Analysis */}
                {outboundSubTool === 'reply' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Incoming Customer Reply</label>
                      <textarea 
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Initial Campaign Context</label>
                      <textarea 
                        rows={2}
                        value={replyContext}
                        onChange={(e) => setReplyContext(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        const { sys, user } = getReplacedTemplatePrompt('tpl-reply-analysis', {
                          leadName: emailLeadName,
                          companyName: emailCompany,
                          threadContext: replyContext,
                          replyText: replyText
                        });
                        handleExecuteAI(sys, user);
                      }}
                      disabled={isGenerating}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Categorize Intent & Classify Reply
                    </button>
                  </div>
                )}

              </div>
              {renderCurrentGeneratingOutputCard('Generated Outbound Copy')}
            </div>
          )}

          {/* TAB 3: INTELLIGENCE SUITE (AI RESEARCH, BANT QUALIFICATION) */}
          {activeSubTab === 'intelligence' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                
                {/* Tab select header */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
                  <button 
                    onClick={() => setIntelSubTool('research')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
                      intelSubTool === 'research' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    B2B Prospect AI Research
                  </button>
                  <button 
                    onClick={() => setIntelSubTool('qualify')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
                      intelSubTool === 'qualify' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Lead Qualification (BANT Scoring)
                  </button>
                </div>

                {/* AI Research Inputs */}
                {intelSubTool === 'research' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Target Company Name</label>
                        <input 
                          type="text"
                          value={researchCompany}
                          onChange={(e) => setResearchCompany(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Industry Segment</label>
                        <input 
                          type="text"
                          value={researchIndustry}
                          onChange={(e) => setResearchIndustry(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Corporate Website</label>
                      <input 
                        type="text"
                        value={researchWebsite}
                        onChange={(e) => setResearchWebsite(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-mono"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        const { sys, user } = getReplacedTemplatePrompt('tpl-ai-research', {
                          companyName: researchCompany,
                          industry: researchIndustry,
                          website: researchWebsite
                        });
                        handleExecuteAI(sys, user);
                      }}
                      disabled={isGenerating}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Globe className="w-4 h-4 animate-pulse" /> Conduct Telemetry Research
                    </button>
                  </div>
                )}

                {/* BANT qualification */}
                {intelSubTool === 'qualify' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Contact Name</label>
                        <input 
                          type="text"
                          value={qualifyLeadName}
                          onChange={(e) => setQualifyLeadName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Company Name</label>
                        <input 
                          type="text"
                          value={qualifyCompany}
                          onChange={(e) => setQualifyCompany(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">CRM Interaction History (Bounces, Clicks, Opens)</label>
                      <textarea 
                        rows={2}
                        value={qualifyHistory}
                        onChange={(e) => setQualifyHistory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Deal/Enrichment Notes</label>
                      <textarea 
                        rows={2}
                        value={qualifyNotes}
                        onChange={(e) => setQualifyNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        const { sys, user } = getReplacedTemplatePrompt('tpl-lead-qualification', {
                          leadName: qualifyLeadName,
                          companyName: qualifyCompany,
                          industry: qualifyIndustry,
                          interactionHistory: qualifyHistory,
                          notes: qualifyNotes
                        });
                        handleExecuteAI(sys, user);
                      }}
                      disabled={isGenerating}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Award className="w-4 h-4" /> Qualify Lead & Score BANT
                    </button>
                  </div>
                )}

              </div>
              {renderCurrentGeneratingOutputCard('AI Intelligence Analysis')}
            </div>
          )}

          {/* TAB 4: DOCUMENT STUDIO (PROPOSAL GENERATION & MEETING SUMMARIES) */}
          {activeSubTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                
                {/* Selector */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
                  <button 
                    onClick={() => setDocSubTool('proposal')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
                      docSubTool === 'proposal' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Enterprise Proposal & Contract Builder
                  </button>
                  <button 
                    onClick={() => setDocSubTool('meeting')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
                      docSubTool === 'meeting' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Demo Meeting Summarizer
                  </button>
                </div>

                {/* Sub Tool: Proposal */}
                {docSubTool === 'proposal' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Document Type Ribbon */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {(['PROPOSAL', 'QUOTATION', 'INVOICE', 'CONTRACT', 'SOW'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setProposalType(type);
                            // Set suitable boilerplate
                            if (type === 'PROPOSAL') {
                              setProposalEditorContent(`# Enterprise Outbound Proposal: ${proposalCompany}\n\n**Prepared for:** ${proposalCompany}\n**Lead contact:** ${proposalContact}\n**Value:** ₹${proposalValue} INR\n\n### 1. Executive Summary\n${proposalCompany} requires automated email deliverability and verified lead research profiling to scale outbound deal pipelines.\n\n### 2. Solutions & Deliverables\n- **3 seats** of SalesPilot Outbound Sequencers.\n- **SMTP Warmup** and domain validation setup.\n- **Integrations:** CRM & Google Calendar bi-directional sync.`);
                            } else if (type === 'QUOTATION') {
                              setProposalEditorContent(`# Official Sales Quotation: ${proposalCompany}\n\n**Quote No:** SP-QT-2026-0921\n**Prepared for:** ${proposalCompany} (Attn: ${proposalContact})\n\n| Product / Seat | Seats | Price (INR) | Total (INR) |\n| :--- | :---: | :---: | :---: |\n| SalesPilot Enterprise License (6m) | ${seatCount} | ₹15,000 | ₹${seatCount * 15000} |\n| Priority Support SLA (${supportTier.toUpperCase()}) | 1 | ₹10,000 | ₹10,000 |\n\n**Base Amount:** ₹${seatCount * 15000 + 10000} INR\n**CGST/SGST (18%):** ₹${Math.round((seatCount * 15000 + 10000) * 0.18)} INR\n**Gross Total:** ₹${Math.round((seatCount * 15000 + 10000) * 1.18)} INR`);
                            } else if (type === 'INVOICE') {
                              setProposalEditorContent(`# Proforma Invoice Draft: ${proposalCompany}\n\n**Invoice ID:** SP-INV-2026-${Math.floor(Math.random()*10000)}\n**Date:** July 08, 2026\n\n**Bill To:**\n- ${proposalCompany}\n- Attn: ${proposalContact}\n\n**Services Provided:**\n- 6-Month SalesPilot Outbound Pilot (3 Seats): ₹45,000 INR\n- SLA Support Access: ₹5,000 INR\n\n**Subtotal:** ₹50,000 INR\n**GST (18%):** ₹9,000 INR\n**Grand Total due:** ₹59,000 INR`);
                            } else if (type === 'CONTRACT') {
                              setProposalEditorContent(`# Master Services Agreement: SalesPilot CRM\n\n**Provider:** Horizon Media (SalesPilot Operator)\n**Client:** ${proposalCompany}\n**Effective Date:** July 08, 2026\n\n### 1. Scope of Licensing\nHorizon Media grants Client ${seatCount} enterprise licenses to the SalesPilot application. All users are bound to compliance with anti-spam legislation.\n\n### 2. Payment Terms\nClient agrees to complete payments through secure Cashfree PG nodes in INR currency. Access is granted instantly upon order capturing.`);
                            } else if (type === 'SOW') {
                              setProposalEditorContent(`# Statement of Work (SOW): Outbound Implementation\n\n**Client:** ${proposalCompany}\n\n### 1. Phased Deliverables\n- **Phase 1 (Week 1):** Domain and auxiliary SMTP warmup routines configured.\n- **Phase 2 (Week 2):** Campaign sequence copy finalized using OpenAI and Gemini models.\n- **Phase 3 (Week 3):** CRM live integration setup.`);
                            }
                          }}
                          className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            proposalType === type
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" /> {type}
                        </button>
                      ))}
                    </div>

                    {/* Left & Right Split Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left Block: Controls & Recommendations (5/12) */}
                      <div className="lg:col-span-5 space-y-4">
                        
                        {/* Meta Settings */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Document Metadata</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Company Name</label>
                              <input 
                                type="text"
                                value={proposalCompany}
                                onChange={(e) => setProposalCompany(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2 rounded-lg outline-none font-semibold text-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Lead Contact</label>
                              <input 
                                type="text"
                                value={proposalContact}
                                onChange={(e) => setProposalContact(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2 rounded-lg outline-none font-semibold text-slate-800 dark:text-slate-100"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Agreement Value (INR)</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold text-xs font-mono">₹</span>
                              <input 
                                type="number"
                                value={proposalValue}
                                onChange={(e) => setProposalValue(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs pl-6 pr-3 py-2 rounded-lg outline-none font-mono font-bold text-blue-600 dark:text-blue-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* AI PRICING CALCULATOR HUD */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 text-blue-500/10 pointer-events-none">
                            <Calculator className="w-16 h-16" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                              <Calculator className="w-3.5 h-3.5 text-blue-500" /> AI Pricing Suggestions
                            </h4>
                            <span className="text-[9px] font-mono bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 px-1.5 py-0.2 rounded font-bold uppercase">INR Mode</span>
                          </div>

                          <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                            <div>
                              <div className="flex justify-between text-[11px] mb-1 font-semibold">
                                <span>Enterprise User Seats</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{seatCount} Representatives</span>
                              </div>
                              <input 
                                type="range" 
                                min="1" 
                                max="15" 
                                value={seatCount}
                                onChange={(e) => setSeatCount(Number(e.target.value))}
                                className="w-full accent-blue-600 cursor-pointer"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">SLA Support Access</label>
                                <select
                                  value={supportTier}
                                  onChange={(e) => setSupportTier(e.target.value as any)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg outline-none font-medium"
                                >
                                  <option value="standard">Standard Included</option>
                                  <option value="premium">Premium (15% Disc)</option>
                                  <option value="enterprise">Enterprise (25% Disc)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Aux Warm SMTP</label>
                                <select
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg outline-none font-medium"
                                >
                                  <option>Included Setup</option>
                                  <option>Additional Domains (+₹5,000)</option>
                                </select>
                              </div>
                            </div>

                            {/* Recommendation Card */}
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 text-[11px] space-y-1">
                              <p className="text-slate-500">Calculated suggestions based on industry metrics:</p>
                              <div className="flex justify-between font-mono font-bold text-slate-800 dark:text-slate-100">
                                <span>Suggested Fee (Prepaid):</span>
                                <span className="text-blue-600 dark:text-blue-400">
                                  ₹{(seatCount * 15000 * (supportTier === 'enterprise' ? 0.75 : supportTier === 'premium' ? 0.85 : 1.0)).toLocaleString('en-IN')} INR
                                </span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setProposalValue(String(seatCount * 15000 * (supportTier === 'enterprise' ? 0.75 : supportTier === 'premium' ? 0.85 : 1.0)))}
                                className="w-full mt-1.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer"
                              >
                                Apply suggested pricing to form
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* MILITARY REQUIREMENT BOX */}
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Specific Requirements & SOW Deliverables</label>
                          <textarea 
                            rows={3}
                            value={proposalDemands}
                            onChange={(e) => setProposalDemands(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-lg outline-none font-medium text-slate-800 dark:text-slate-200"
                          />
                        </div>

                        {/* HISTORY LOG / VERSION CONTROL SIDEBAR */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-indigo-500" /> Stored History & Version Control
                          </h4>
                          
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {proposalHistory.map((hist, idx) => (
                              <div 
                                key={hist.id}
                                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-[11px] hover:border-blue-400 transition"
                              >
                                <div>
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span className="px-1.5 bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-600 dark:text-slate-400 rounded-md">v{hist.version}</span>
                                    <span>{hist.type}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">{hist.companyName} • ₹{Number(hist.valueInr).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      setProposalType(hist.type);
                                      setProposalCompany(hist.companyName);
                                      setProposalContact(hist.leadName);
                                      setProposalValue(hist.valueInr);
                                      setProposalDemands(hist.demands);
                                      setProposalEditorContent(hist.content);
                                      alert(`Restored Version ${hist.version} into active editor workspace.`);
                                    }}
                                    className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-bold rounded hover:bg-blue-100 text-[10px] cursor-pointer"
                                  >
                                    Load
                                  </button>
                                  <button
                                    onClick={() => {
                                      setProposalHistory(prev => prev.filter(p => p.id !== hist.id));
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {proposalHistory.length === 0 && (
                              <p className="text-[10px] text-slate-400 italic">No saved versions registered yet.</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Right Block: Dynamic Document Editor (7/12) */}
                      <div className="lg:col-span-7 space-y-4">
                        
                        {/* Editor Header Tools */}
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 font-mono flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-600 animate-pulse" /> Live Document Editor
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Save New Version */}
                            <button
                              onClick={() => {
                                const nextVer = `1.${proposalHistory.length}.0`;
                                const newHist = {
                                  id: `prop_hist_${Date.now()}`,
                                  version: nextVer,
                                  type: proposalType,
                                  companyName: proposalCompany,
                                  leadName: proposalContact,
                                  valueInr: proposalValue,
                                  demands: proposalDemands,
                                  content: proposalEditorContent,
                                  createdAt: new Date().toISOString()
                                };
                                setProposalHistory(prev => [newHist, ...prev]);
                                alert(`Saved New Version ${nextVer} to workspace logs.`);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              title="Save current state as minor version"
                            >
                              <Save className="w-3.5 h-3.5" /> Save Version
                            </button>

                            {/* Export PDF */}
                            <button
                              onClick={() => {
                                // Prepare elegant print layout popup
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${proposalType} - ${proposalCompany}</title>
                                        <style>
                                          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 45px; color: #1e293b; line-height: 1.6; }
                                          .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                                          .logo { font-size: 26px; font-weight: bold; color: #2563eb; letter-spacing: -0.5px; }
                                          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
                                          .meta-table td { padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
                                          .meta-table td.label { font-weight: bold; background-color: #f8fafc; width: 150px; }
                                          .content-body { white-space: pre-wrap; font-size: 14px; margin-top: 20px; font-family: monospace; border: 1px solid #f1f5f9; padding: 15px; background: #fafbfc; border-radius: 8px; }
                                          .watermark { position: fixed; bottom: 30px; right: 30px; font-size: 11px; color: #cbd5e1; font-family: monospace; }
                                          .footer-totals { margin-top: 40px; border-top: 2px solid #2563eb; padding-top: 25px; font-size: 14px; text-align: right; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <div>
                                            <div class="logo">SalesPilot Enterprise</div>
                                            <div style="font-size: 12px; color: #64748b; font-family: monospace;">Workspace Reference Integration Node</div>
                                          </div>
                                          <div style="text-align: right; font-size: 12px; font-family: monospace;">
                                            <strong>Doc Reference ID:</strong> SP-CF-DOC-${Date.now().toString().substring(7)}<br/>
                                            <strong>Export Date:</strong> ${new Date().toLocaleDateString()}
                                          </div>
                                        </div>
                                        
                                        <h2 style="text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 12px; color: #0f172a; font-size: 18px;">
                                          ${proposalType} SPECIFICATION DATA SHEET
                                        </h2>
                                        
                                        <table class="meta-table">
                                          <tr>
                                            <td class="label">Target Client</td>
                                            <td>${proposalCompany}</td>
                                            <td class="label">Lead Contact</td>
                                            <td>${proposalContact}</td>
                                          </tr>
                                          <tr>
                                            <td class="label">Agreement Type</td>
                                            <td>${proposalType} Document (v1.${proposalHistory.length}.0)</td>
                                            <td class="label">Transaction Value</td>
                                            <td><strong>₹${Number(proposalValue).toLocaleString('en-IN')} INR</strong></td>
                                          </tr>
                                          <tr>
                                            <td class="label">User Licenses</td>
                                            <td>${seatCount} Enterprise seats</td>
                                            <td class="label">Service Level Agreement</td>
                                            <td>Priority support SLA (${supportTier.toUpperCase()})</td>
                                          </tr>
                                        </table>
                                        
                                        <div class="content-body">${proposalEditorContent.replace(/#/g, '')}</div>
                                        
                                        <div class="footer-totals">
                                          <p style="margin: 3px 0;">Base Fee: ₹${(Number(proposalValue) / 1.18).toFixed(2)} INR</p>
                                          <p style="margin: 3px 0; color: #64748b;">CGST/SGST Tax Breakdown (18%): ₹${(Number(proposalValue) - (Number(proposalValue) / 1.18)).toFixed(2)} INR</p>
                                          <h3 style="color: #2563eb; margin: 8px 0; font-size: 18px;">Gross Total (Compliant INR): ₹${Number(proposalValue).toLocaleString('en-IN')} INR</h3>
                                        </div>
                                        
                                        <div class="watermark">SALESPILOT CLOUD AGENT • 100% SECURE EXPORT COMPLETED</div>
                                        <script>
                                          window.onload = function() { window.print(); }
                                        </script>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                } else {
                                  alert('Print popup blocked. Please configure browser exemptions for SalesPilot.');
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" /> Export PDF Draft
                            </button>
                          </div>
                        </div>

                        {/* Editor Box */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-slate-500 uppercase">Interactive Draft Content (Markdown-Friendly Plaintext)</label>
                          <textarea
                            rows={15}
                            value={proposalEditorContent}
                            onChange={(e) => setProposalEditorContent(e.target.value)}
                            className="w-full bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-xl leading-relaxed outline-none border border-slate-800 focus:border-blue-500"
                            placeholder="Compiling blueprint..."
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>Lines: {proposalEditorContent.split('\n').length} • Chars: {proposalEditorContent.length}</span>
                            <span>Target Currency: INR (₹)</span>
                          </div>
                        </div>

                        {/* Master AI Compiler Trigger */}
                        <button 
                          onClick={() => {
                            let sys = "You are an enterprise sales coordinator. Review this proposal draft against pricing limitations, localized currency factors, and support SLA rules to identify gaps.";
                            let user = `Draft Proposal Content:\n${proposalEditorContent}\n\nAuditing Constraints: ${proposalDemands}`;
                            if (proposalType === 'PROPOSAL') {
                              sys = "You are an enterprise sales director. Formulate a highly structured professional proposal, incorporating: 1. Executive Summary, 2. Solution design mapping, 3. Structured Pricing in INR, 4. Detailed implementation roadmap.";
                              user = `Generate a comprehensive business proposal for "${proposalCompany}" (Contact Name: ${proposalContact}) valued at ₹${proposalValue} INR.\nKey Client Requirements:\n${proposalDemands}\n\nDeliver the proposal in a sleek, beautifully structured format.`;
                            } else if (proposalType === 'QUOTATION') {
                              sys = "You are a pricing controller. Formulate a detailed sales quotation sheet with a table format, itemized license costs, 18% GST tax rate, and final gross amount in INR.";
                              user = `Generate a sales quotation for "${proposalCompany}" (Contact: ${proposalContact}). Estimated value: ₹${proposalValue} INR.\nSeat configurations: ${seatCount} enterprise seats. Support SLA tier: ${supportTier.toUpperCase()}.\nInclude specific line items, unit pricing, 18% CGST/SGST taxes, and net payment conditions.`;
                            } else if (proposalType === 'INVOICE') {
                              sys = "You are an billing accountant. Compose a professional invoice draft with clear invoice numbers, issue/due dates, client GSTIN numbers, and a fully breakdown table of fees with 18% local GST tax lines.";
                              user = `Draft a formal invoice for "${proposalCompany}" (Contact: ${proposalContact}). Invoice amount: ₹${proposalValue} INR. Support tier: ${supportTier.toUpperCase()}. Include terms like standard Cashfree PG checkout links and bank wire directions.`;
                            } else if (proposalType === 'CONTRACT') {
                              sys = "You are an enterprise corporate legal counsel. Draft a detailed Master Services Agreement (MSA) contract draft containing clauses for Intellectual Property, Confidentiality, Limitation of Liability, Payment Default, and Termination SLAs.";
                              user = `Draft a legal contract agreement between Horizon Media (SalesPilot platform operator) and "${proposalCompany}" (Representative: ${proposalContact}) for a transaction value of ₹${proposalValue} INR. Include clauses for 3 user licenses and 2-hour Priority support response times.`;
                            } else if (proposalType === 'SOW') {
                              sys = "You are a technical delivery program manager. Formulate a detailed Statement of Work (SOW) outlining Phase-wise Milestones, Delivery timelines, Acceptance criteria, and SLA compliance procedures.";
                              user = `Generate a Statement of Work (SOW) for "${proposalCompany}" (Contact: ${proposalContact}) detailing the implementation of SalesPilot CRM and outreach nodes. Total scope fee: ₹${proposalValue} INR.\nSpecific deliverables: ${proposalDemands}.`;
                            }

                            handleExecuteAI(sys, user, undefined, (response) => {
                              setProposalEditorContent(response);
                            });
                          }}
                          disabled={isGenerating}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                        >
                          <Sparkles className="w-4 h-4 animate-spin-slow" /> 
                          {isGenerating ? 'Compiling Document via AI Models...' : `AI Generate / Refine ${proposalType} Draft`}
                        </button>

                      </div>

                    </div>

                  </div>
                )}

                {/* Sub Tool: Meeting summary */}
                {docSubTool === 'meeting' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Google Meet / Call Transcript</label>
                      <textarea 
                        rows={6}
                        value={meetingTranscript}
                        onChange={(e) => setMeetingTranscript(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-lg outline-none font-mono text-slate-700 dark:text-slate-300 font-medium"
                        placeholder="Paste rough call recording transcript here..."
                      />
                    </div>

                    <button 
                      onClick={() => {
                        const { sys, user } = getReplacedTemplatePrompt('tpl-meeting-summary', {
                          transcript: meetingTranscript
                        });
                        handleExecuteAI(sys, user, undefined, (response) => {
                          setProposalEditorContent(response);
                        });
                      }}
                      disabled={isGenerating}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Clock className="w-4 h-4" /> Summarize Boardroom Call
                    </button>
                  </div>
                )}

              </div>
              
              {/* Show output feedback when generating */}
              {isGenerating && renderCurrentGeneratingOutputCard('Streaming Realtime Compilation...')}
            </div>
          )}

          {/* TAB 5: SALES COACH */}
          {activeSubTab === 'coach' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Objection Handling Sparring Partner</h3>
                    <p className="text-[10px] text-slate-500">Train against custom enterprise complaints and objections under pressure.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Common Customer Objection / Block</label>
                    <input 
                      type="text"
                      value={objectionText}
                      onChange={(e) => setObjectionText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Salesperson Proposed Pivot Response</label>
                    <textarea 
                      rows={3}
                      value={salespersonResponse}
                      onChange={(e) => setSalespersonResponse(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const { sys, user } = getReplacedTemplatePrompt('tpl-sales-coach', {
                      objection: objectionText,
                      salespersonResponse: salespersonResponse
                    });
                    handleExecuteAI(sys, user);
                  }}
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Award className="w-4 h-4 animate-pulse" /> Grade Objection Handling & Script Alternative
                </button>
              </div>
              {renderCurrentGeneratingOutputCard('Sales Coach Evaluation')}
            </div>
          )}

          {/* TAB 6: CRM ADVISOR */}
          {activeSubTab === 'crm-advisor' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Workspace Health Advisory Engine</h3>
                    <p className="text-[10px] text-slate-500">Examines current pipeline metrics, campaigns, and appointments to prioritize outreach schedules.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">CRM Advisory Inquiry</label>
                  <textarea 
                    rows={3}
                    value={crmQuery}
                    onChange={(e) => setCrmQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                  />
                </div>

                <button 
                  onClick={() => {
                    // Mapped metrics based on dummy states
                    const { sys, user } = getReplacedTemplatePrompt('tpl-crm-assistant', {
                      leadsCount: '15',
                      hotCount: '4',
                      dealsCount: '6',
                      aptsCount: '3',
                      query: crmQuery
                    });
                    handleExecuteAI(sys, user);
                  }}
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 animate-spin-slow" /> Advise Pipeline Priorities
                </button>
              </div>
              {renderCurrentGeneratingOutputCard('AI CRM Advisory Analysis')}
            </div>
          )}

          {/* TAB 6.5: GEMINI AI CO-PILOT SUITE */}
          {activeSubTab === 'gemini-suite' && (
            <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
              {/* Header block */}
              <div className="p-6 bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl text-white space-y-4 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl">
                      <Bot className="w-6 h-6 text-indigo-300 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Gemini Multi-Modal Outreach Co-Pilot</h3>
                      <p className="text-xs text-indigo-200 mt-1 font-sans">
                        Utilizing Google's million-token context window for elite website scans, document audits, and compliant B2B intelligence.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Intelligent Router Active
                  </span>
                </div>
              </div>

              {/* ROUTER TELEMETRY HUD */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Router Nodes Layout */}
                <div className="lg:col-span-8 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Dynamic AI Router Nodes</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Active Failover Fallbacks</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Node 1 */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700">OpenAI Node</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-900">gpt-4o-mini</p>
                      <p className="text-[9px] text-slate-500">Primary outbound generator.</p>
                    </div>

                    {/* Node 2 */}
                    <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-lg space-y-1.5 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-700">Gemini Node</span>
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      </div>
                      <p className="text-[11px] font-bold text-indigo-900">gemini-2.0-flash</p>
                      <p className="text-[9px] text-indigo-600">Complex long-contexts & website scans.</p>
                    </div>

                    {/* Node 3 */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700">Local Recovery</span>
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-900">Fallback Sim</p>
                      <p className="text-[9px] text-slate-500">Activates if third-parties error.</p>
                    </div>
                  </div>

                  {/* Provider controller selector */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Routing Policy Selector</h5>
                      <p className="text-[10px] text-slate-500">Force specific providers or allow our intelligent router to optimize based on prompt context size.</p>
                    </div>
                    <div className="flex bg-slate-200 p-1 rounded-lg gap-1 shrink-0">
                      {(['router', 'gemini', 'openai'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setGeminiProvider(mode)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase transition cursor-pointer ${
                            geminiProvider === mode 
                              ? 'bg-white text-slate-900 shadow-xs' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Router logs panel */}
                <div className="lg:col-span-4 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Routing Event Logs</h4>
                    <span className="text-[9px] font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Traceable</span>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto font-mono text-[9px] leading-relaxed">
                    {usage?.routingEvents && usage.routingEvents.length > 0 ? (
                      usage.routingEvents.map((evt, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 border border-slate-150 rounded text-slate-700 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase text-[8px] text-slate-500">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`px-1 rounded text-[7px] font-bold ${
                              evt.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                              evt.status === 'FAILOVER' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>{evt.status}</span>
                          </div>
                          <p className="font-sans text-[10px] text-slate-800 leading-normal">{evt.event}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 py-4 font-sans text-xs">No active routing events recorded yet.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* COMPREHENSIVE TOOLS INTERFACES */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Tools Submenu Selection */}
                <div className="lg:col-span-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5">
                  <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Gemini Operations</h4>
                  
                  <button
                    onClick={() => setGeminiTool('website')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                      geminiTool === 'website' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-indigo-600" /> Website Analysis & Crawl
                  </button>

                  <button
                    onClick={() => setGeminiTool('document')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                      geminiTool === 'document' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-indigo-600" /> Document & Large PDF Ingestion
                  </button>

                  <button
                    onClick={() => setGeminiTool('competitor')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                      geminiTool === 'competitor' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Search className="w-4 h-4 text-indigo-600" /> Competitor Gap Intelligence
                  </button>

                  <button
                    onClick={() => setGeminiTool('proposal')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                      geminiTool === 'proposal' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Award className="w-4 h-4 text-indigo-600" /> Proposal Review & Audit
                  </button>

                  <button
                    onClick={() => setGeminiTool('knowledge')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                      geminiTool === 'knowledge' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-indigo-600" /> Compliance Knowledge Search
                  </button>
                </div>

                {/* Sub-tool Parameters & Inputs */}
                <div className="lg:col-span-8 p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
                  
                  {/* Website Crawler Inputs */}
                  {geminiTool === 'website' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase">🌐 website crawler analysis</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Crawls website content to extract high-leverage pain points and product selling pitches.</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Target Website URL</label>
                          <input 
                            type="text" 
                            value={webUrl}
                            onChange={(e) => setWebUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Crawling Focus Objective</label>
                          <textarea 
                            rows={3}
                            value={webFocus}
                            onChange={(e) => setWebFocus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deep Contract / Document Audit Inputs */}
                  {geminiTool === 'document' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase">📄 Document & Large PDF Ingestion</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Extract terms, licensing thresholds, pricing rules, and list support guarantees from raw text or simulated PDF content.</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Paste Raw Document Text (Simulated up to 1M tokens)</label>
                          <textarea 
                            rows={5}
                            value={docTextState}
                            onChange={(e) => setDocTextState(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Extraction & Ingestion Target</label>
                          <textarea 
                            rows={2}
                            value={docObjective}
                            onChange={(e) => setDocObjective(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Competitor Gaps Inputs */}
                  {geminiTool === 'competitor' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase">📊 Competitor Intelligence Gaps Scan</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Run an advanced competitive research audit mapping features, pricing models, and rebuttals.</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Competitor Platform Name</label>
                          <input 
                            type="text" 
                            value={compName}
                            onChange={(e) => setCompName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Our Core Advantaged Value Proposition</label>
                          <textarea 
                            rows={3}
                            value={compAdvantage}
                            onChange={(e) => setCompAdvantage(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Proposal Gaps Inputs */}
                  {geminiTool === 'proposal' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase">🏆 Proposal Review & Gaps Check</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Audit draft proposals for SLA compliance, localized INR currencies, and delivery seat alignment.</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Paste Draft Proposal Context</label>
                          <textarea 
                            rows={4}
                            value={propText}
                            onChange={(e) => setPropText(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Auditing Constraints</label>
                          <textarea 
                            rows={2}
                            value={propConstraints}
                            onChange={(e) => setPropConstraints(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Knowledge Search Compliance Inputs */}
                  {geminiTool === 'knowledge' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase">🔍 Regulatory Compliance Research</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Ingest local telecom regulations, DND codes, and antispam protocols to build secure outbound guides.</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Regulatory Market Search Sector</label>
                          <input 
                            type="text" 
                            value={searchSector}
                            onChange={(e) => setSearchSector(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Research Directive Objective</label>
                          <textarea 
                            rows={3}
                            value={searchGoal}
                            onChange={(e) => setSearchGoal(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit execution button */}
                  <button
                    type="button"
                    onClick={() => {
                      let sys = '';
                      let user = '';
                      if (geminiTool === 'website') {
                        sys = 'You are a senior website intelligence analyst and outbound strategist. Review the website focus goals and extract custom ICP pain points, convert objectives to 3 outbound sequences, and map delivery targets.';
                        user = `Website Target URL: ${webUrl}\nCrawling Focus Objective: ${webFocus}`;
                      } else if (geminiTool === 'document') {
                        sys = 'You are an AI deep document comprehension engine. Audit this unstructured text for gaps, pricing commitments, support SLA limits, and extract compliant rules.';
                        user = `Document Raw Content:\n${docTextState}\n\nObjective: ${docObjective}`;
                      } else if (geminiTool === 'competitor') {
                        sys = 'You are a competitive intelligence strategist. Ingest the competitor name and map out clear competitive gaps, highlight SalesPilot advantages, and provide objection rebuttals.';
                        user = `Competitor Product: ${compName}\nOur Advantage Value Prop: ${compAdvantage}`;
                      } else if (geminiTool === 'proposal') {
                        sys = 'You are a professional enterprise sales coordinator. Review this proposal draft against pricing limitations, localized currency factors, and support SLA rules to identify gaps.';
                        user = `Draft Proposal Content:\n${propText}\n\nAuditing Constraints: ${propConstraints}`;
                      } else if (geminiTool === 'knowledge') {
                        sys = 'You are a regulatory B2B compliance expert. Analyze telecom, anti-spam, and email laws for the specified sector, outlining key rules for sales campaigns.';
                        user = `Search Sector: ${searchSector}\nResearch Directive Goal: ${searchGoal}`;
                      }
                      
                      handleExecuteAI(sys, user, undefined, undefined, geminiProvider);
                    }}
                    disabled={isGenerating}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 animate-spin-slow" /> Execute Gemini Pipeline Scan
                  </button>

                </div>

              </div>

              {/* Streaming Output Card */}
              {renderCurrentGeneratingOutputCard('Gemini Intelligence Output Stream')}

            </div>
          )}

          {/* TAB 7: USAGE, RATES & DAILY API BUDGETS */}
          {activeSubTab === 'usage' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* API Limits Card */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Daily Token & Cost Budgets</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Manage workspace rate ceilings to protect your business API billing cycles. Counter resets automatically at midnight UTC.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Daily Token Limit bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Token Volume Ceiling</span>
                      <span className="font-mono text-[11px] font-bold text-slate-800">
                        {usage ? usage.totalTokens.toLocaleString() : 0} / {activeLimit.dailyTokenLimit.toLocaleString()} tokens ({currentTokenPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${currentTokenPct > 85 ? 'bg-rose-500' : 'bg-blue-600'}`} 
                        style={{ width: `${currentTokenPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">Resets in 14 hours 20 minutes</p>
                  </div>

                  {/* Daily Cost Limit bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Daily Cost Cap (USD)</span>
                      <span className="font-mono text-[11px] font-bold text-slate-800">
                        ${usage ? usage.estimatedCostUsd.toFixed(3) : '0.00'} / ${activeLimit.dailyCostLimitUsd.toFixed(2)} ({currentCostPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${currentCostPct > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${currentCostPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">Max API budget allowed on {tier} tier</p>
                  </div>

                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Rate-Limiting Parameters</h4>
                    <p className="text-[10px] text-slate-500">Maximum allowed API transmissions on your subscription package level.</p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] font-bold text-slate-800">
                    <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded">
                      {activeLimit.requestsPerMinuteLimit} RPM Limit
                    </span>
                  </div>
                </div>

                {/* Admin controls */}
                <div className="border-t border-slate-100 pt-5 flex justify-end">
                  <button 
                    onClick={handleResetUsage}
                    className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition duration-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Reset daily telemetry counter
                  </button>
                </div>
              </div>

              {/* Secure Key Storage Card */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-4.5 h-4.5 text-blue-600" /> Custom OpenAI API credentials
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Store your company\'s custom OpenAI secret key safely inside your browser localStorage context. It will only ever be passed server-side for proxy routing.
                    </p>
                  </div>
                  {customKey && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Client Override Key Active
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Custom OpenAI API Secret Key</label>
                    <div className="flex gap-3">
                      <input 
                        type="password"
                        placeholder="sk-proj-..."
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg font-mono outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {customKey ? (
                        <button 
                          onClick={handleClearCustomKey}
                          className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveCustomKey(customKey)}
                    disabled={!customKey.trim()}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {keySaved ? '✓ Credentials Saved to browser storage' : 'Save override key'}
                  </button>
                  
                  <div className="p-3 bg-blue-50 border border-blue-150 rounded-xl text-[10px] text-slate-600 font-sans leading-relaxed">
                    <strong>Pro-Tip:</strong> If you omit entering a custom key, the SalesPilot backend will automatically proxy requests to our server-managed Gemini models or secure system simulations, ensuring fully active, production-ready outputs at zero cost!
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
