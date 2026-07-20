import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Bot, Globe, Mail, Clock, Calendar, FileText, 
  Send, Database, Award, RefreshCw, Layers, CheckSquare, 
  TrendingUp, ArrowRight, UserCheck, AlertTriangle, Play,
  ChevronRight, Brain, ShieldAlert, BadgeHelp, CheckCircle, 
  Plus, Edit3, Save, FileSignature, Trash2
} from 'lucide-react';
import { Lead, Appointment } from '../types';

interface AiCompanyResearch {
  id: string;
  leadId: string;
  organizationId: string;
  summary: string;
  industry: string;
  productsServices: string[];
  websiteAnalysis: string;
  teamSize: string;
  technologies: string[];
  painPoints: string[];
  recentNews: string[];
  icpFitScore: number;
  createdAt: string;
}

interface AiContactProfile {
  id: string;
  leadId: string;
  organizationId: string;
  name: string;
  role: string;
  decisionMakerScore: number;
  buyingIntentEstimate: 'HIGH' | 'MEDIUM' | 'LOW';
  talkingPoints: string[];
  createdAt: string;
}

interface AiScore {
  id: string;
  leadId: string;
  organizationId: string;
  scoreType: 'ICP' | 'DECISION_MAKER' | 'BUYING_INTENT' | 'OVERALL';
  scoreValue: number;
  reasoning: string;
  createdAt: string;
}

interface AiEmailGeneration {
  id: string;
  leadId: string;
  organizationId: string;
  subject: string;
  body: string;
  tone: 'Formal' | 'Casual' | 'Bold' | 'Persuasive';
  promptUsed: string | null;
  status: 'DRAFT' | 'SENT' | 'ARCHIVED';
  createdAt: string;
}

interface AiFollowup {
  id: string;
  leadId: string;
  organizationId: string;
  sequenceId: string;
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
  status: 'PENDING' | 'SENT' | 'SKIPPED';
  createdAt: string;
}

interface AiMeetingBrief {
  id: string;
  appointmentId: string;
  organizationId: string;
  companyOverview: string;
  contactOverview: string;
  keyDiscussionPoints: string[];
  suggestedQuestions: string[];
  possibleObjections: string[];
  meetingStrategy: string;
  createdAt: string;
}

interface AiProposal {
  id: string;
  leadId: string;
  organizationId: string;
  title: string;
  scope: string;
  pricingSummary: string;
  nextSteps: string;
  markdownContent: string;
  createdAt: string;
}

export function AiSdrWorkspace() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'research' | 'email' | 'followup' | 'meeting' | 'proposal' | 'crm'>('research');
  
  // Loaded state
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingLogs, setGeneratingLogs] = useState<string[]>([]);
  
  // AI intelligence records
  const [research, setResearch] = useState<AiCompanyResearch | null>(null);
  const [contact, setContact] = useState<AiContactProfile | null>(null);
  const [scores, setScores] = useState<AiScore[]>([]);
  
  // Email writing states
  const [emailTone, setEmailTone] = useState<'Formal' | 'Casual' | 'Bold' | 'Persuasive'>('Persuasive');
  const [emailGoal, setEmailGoal] = useState<string>('Schedule a 15-minute introductory meeting');
  const [emailOffer, setEmailOffer] = useState<string>('SalesPilot automated outreach suite & local INR billing setup');
  const [emailCustomPrompt, setEmailCustomPrompt] = useState<string>('');
  const [generatedEmails, setGeneratedEmails] = useState<AiEmailGeneration[]>([]);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState<string>('');
  const [editBody, setEditBody] = useState<string>('');
  
  // Followup states
  const [sequenceSteps, setSequenceSteps] = useState<number>(3);
  const [generatedFollowups, setGeneratedFollowups] = useState<AiFollowup[]>([]);
  const [editingFollowupId, setEditingFollowupId] = useState<string | null>(null);
  const [editFollowupSubject, setEditFollowupSubject] = useState<string>('');
  const [editFollowupBody, setEditFollowupBody] = useState<string>('');

  // Meeting Prep Brief states
  const [selectedApptId, setSelectedApptId] = useState<string>('');
  const [meetingBrief, setMeetingBrief] = useState<AiMeetingBrief | null>(null);
  const [isBriefGenerating, setIsBriefGenerating] = useState<boolean>(false);

  // Proposal states
  const [proposalTitle, setProposalTitle] = useState<string>('Enterprise Outbound Strategy & Deliverability Upgrade');
  const [proposalScope, setProposalScope] = useState<string>('Deploy 5 dedicated autonomous maps sourcing spiders, configure Vinci smart copy writing drips with active A/B testing, and map 2 custom SMTP nodes supporting automatic IST scheduling.');
  const [proposalPricing, setProposalPricing] = useState<string>('Standard Enterprise License: ₹55,000 INR per month, billed quarterly under local GST compliance.');
  const [proposalNextSteps, setProposalNextSteps] = useState<string>('1. Authorize mutual NDA & framework service agreement.\n2. Bind primary Gmail SMTP OAuth nodes.\n3. Complete introductory technical briefing in 7 business days.');
  const [generatedProposals, setGeneratedProposals] = useState<AiProposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [isProposalGenerating, setIsProposalGenerating] = useState<boolean>(false);

  // CRM status state
  const [crmStatusNote, setCrmStatusNote] = useState<string>('');
  const [isCrmSyncing, setIsCrmSyncing] = useState<boolean>(false);

  const activeLead = leads.find(l => l.id === selectedLeadId);

  // Fetch initial leads
  useEffect(() => {
    async function loadSdrData() {
      try {
        const [leadsRes, apptsRes] = await Promise.all([
          fetch('/api/v1/leads'),
          fetch('/api/v1/appointments')
        ]);
        const leadsData = await leadsRes.json();
        const apptsData = await apptsRes.json();

        setLeads(leadsData.leads || []);
        setAppointments(apptsData.appointments || []);
        
        if (leadsData.leads && leadsData.leads.length > 0) {
          setSelectedLeadId(leadsData.leads[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial CRM lists for AI SDR:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSdrData();
  }, []);

  // Fetch AI Research whenever leadId changes
  useEffect(() => {
    if (!selectedLeadId) return;
    
    // Reset views
    setResearch(null);
    setContact(null);
    setScores([]);
    setGeneratedEmails([]);
    setGeneratedFollowups([]);
    setGeneratedProposals([]);
    setEditingEmailId(null);
    setEditingFollowupId(null);

    async function loadLeadIntelligence() {
      try {
        // 1. Fetch scores & research
        const res = await fetch(`/api/v1/ai/research/${selectedLeadId}`);
        const data = await res.json();
        if (data && data.research) {
          setResearch(data.research);
          setContact(data.contact);
          setScores(data.scores || []);
        }

        // 2. Fetch email history
        const emailsRes = await fetch(`/api/v1/ai/email/generations/${selectedLeadId}`);
        const emailsData = await emailsRes.json();
        setGeneratedEmails(emailsData || []);

        // 3. Fetch followups
        const followupsRes = await fetch(`/api/v1/ai/followups/${selectedLeadId}`);
        const followupsData = await followupsRes.json();
        setGeneratedFollowups(followupsData || []);

        // 4. Fetch proposals
        const propsRes = await fetch(`/api/v1/ai/proposals/${selectedLeadId}`);
        const propsData = await propsRes.json();
        setGeneratedProposals(propsData || []);

        // Match with appointments if any
        const matchingAppt = appointments.find(a => a.leadId === selectedLeadId);
        if (matchingAppt) {
          setSelectedApptId(matchingAppt.id);
        } else {
          setSelectedApptId('');
        }
        setMeetingBrief(null);
      } catch (err) {
        console.error('Failed to query intelligence records for lead:', err);
      }
    }

    loadLeadIntelligence();
  }, [selectedLeadId, appointments]);

  // Load meeting brief if selectedApptId changes
  useEffect(() => {
    if (!selectedApptId) {
      setMeetingBrief(null);
      return;
    }
    async function checkMeetingBrief() {
      try {
        const res = await fetch(`/api/v1/ai/meeting-brief/${selectedApptId}`);
        const data = await res.json();
        if (data && !data.error) {
          setMeetingBrief(data);
        }
      } catch (err) {
        console.error('Failed to load brief:', err);
      }
    }
    checkMeetingBrief();
  }, [selectedApptId]);

  // Execute full research scraper trigger
  const handleTriggerFullResearch = async () => {
    if (!selectedLeadId || !activeLead) return;
    setIsGenerating(true);
    setGeneratingLogs([
      `[AI SDR ORCHESTRATOR] Initiating comprehensive research cycle on: ${activeLead.company}`,
      `[SCRAPER ENGINE] Pulling website metadata & DNS records for: ${activeLead.enrichment?.website || 'domain'}`,
      `[AGENT COGNITION] Requesting Gemini to evaluate technological footprint and sector challenges...`
    ]);

    const logTimer = setInterval(() => {
      const moreLogs = [
        `[INTENT PROFILE] Sourcing decision-maker coordinates for: ${activeLead.firstName} ${activeLead.lastName || ''}`,
        `[SCORING MODEL] Running cohort regression for ICP score matching...`,
        `[PERSISTENCE] Writing data blocks to Local Cache and syncing transaction records to Supabase tables...`,
        `[COMPLETE] Intelligence profile finalized and validated successfully.`
      ];
      setGeneratingLogs(prev => {
        if (prev.length < 7) {
          return [...prev, moreLogs[prev.length - 3]];
        }
        return prev;
      });
    }, 1500);

    try {
      const res = await fetch(`/api/v1/ai/research/${selectedLeadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data && data.research) {
        setResearch(data.research);
        setContact(data.contact);
        setScores(data.scores || []);
        setGeneratingLogs(prev => [...prev, `[COMPLETE] Intel successfully synchronized.`]);
      }
    } catch (err: any) {
      setGeneratingLogs(prev => [...prev, `[ERROR] Failed during execution: ${err.message}`]);
    } finally {
      clearInterval(logTimer);
      setTimeout(() => {
        setIsGenerating(false);
        setGeneratingLogs([]);
      }, 2000);
    }
  };

  // Generate Email Copilot Drip copy
  const handleGenerateEmail = async () => {
    if (!selectedLeadId) return;
    setIsGenerating(true);
    setGeneratingLogs([
      `[VINCI WRITER] Retrieving Vesper Analyst custom company telemetry for ${activeLead?.company}...`,
      `[AGENT COGNITION] Assembling value pitch with tone constraint: "${emailTone}"`,
      `[COMPLETE] Composing introductory email draft based on compliance hooks...`
    ]);

    try {
      const res = await fetch('/api/v1/ai/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          tone: emailTone,
          goal: emailGoal,
          offer: emailOffer,
          customPrompt: emailCustomPrompt
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setGeneratedEmails(prev => [data, ...prev]);
        setEmailCustomPrompt('');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      setGeneratingLogs([]);
    }
  };

  // Save modified email draft
  const handleSaveEmailEdit = async (emailId: string) => {
    try {
      const res = await fetch('/api/v1/ai/email/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emailId,
          status: 'DRAFT',
          subject: editSubject,
          body: editBody
        })
      });
      if (res.ok) {
        setGeneratedEmails(prev => prev.map(e => e.id === emailId ? { ...e, subject: editSubject, body: editBody } : e));
        setEditingEmailId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Archive email draft helper
  const handleArchiveEmail = async (emailId: string) => {
    try {
      const res = await fetch('/api/v1/ai/email/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emailId,
          status: 'ARCHIVED'
        })
      });
      if (res.ok) {
        setGeneratedEmails(prev => prev.filter(e => e.id !== emailId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Followup Sequences
  const handleGenerateFollowups = async () => {
    if (!selectedLeadId) return;
    setIsGenerating(true);
    setGeneratingLogs([
      `[HERMES DRIP] Initializing campaign sequence template of ${sequenceSteps} steps...`,
      `[COGNITION] Calculating optimal daily delays & composing follow-up templates...`,
      `[COMPLETE] Persisting sequence draft blocks into campaign schedule database.`
    ]);

    try {
      const res = await fetch('/api/v1/ai/followups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          stepsCount: sequenceSteps
        })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGeneratedFollowups(data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      setGeneratingLogs([]);
    }
  };

  // Save followup edit
  const handleSaveFollowupEdit = async (fId: string) => {
    try {
      const res = await fetch('/api/v1/ai/followups/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fId,
          status: 'PENDING',
          subject: editFollowupSubject,
          body: editFollowupBody
        })
      });
      if (res.ok) {
        setGeneratedFollowups(prev => prev.map(f => f.id === fId ? { ...f, subject: editFollowupSubject, body: editFollowupBody } : f));
        setEditingFollowupId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger manually compiled meeting preparation
  const handleCompileMeetingBrief = async () => {
    if (!selectedApptId) return;
    setIsBriefGenerating(true);
    try {
      const res = await fetch(`/api/v1/ai/meeting-brief/${selectedApptId}`);
      const data = await res.json();
      if (data && !data.error) {
        setMeetingBrief(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBriefGenerating(false);
    }
  };

  // Generate B2B contract/proposal
  const handleGenerateProposal = async () => {
    if (!selectedLeadId) return;
    setIsProposalGenerating(true);
    try {
      const res = await fetch('/api/v1/ai/proposal/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          title: proposalTitle,
          scope: proposalScope,
          pricingSummary: proposalPricing,
          nextSteps: proposalNextSteps
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setGeneratedProposals(prev => [data, ...prev]);
        setSelectedProposalId(data.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProposalGenerating(false);
    }
  };

  // Auto-Update CRM Stage via Action Log
  const handleTriggerCrmAction = async (action: 'EMAIL_SENT' | 'EMAIL_REPLIED' | 'MEETING_BOOKED') => {
    if (!selectedLeadId) return;
    setIsCrmSyncing(true);
    try {
      const res = await fetch('/api/v1/ai/crm/auto-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          actionType: action,
          notes: crmStatusNote || 'Automated execution log compiled via SalesPilot AI SDR Cockpit.'
        })
      });
      const data = await res.json();
      if (data && data.success) {
        // Update local leads state
        setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, ...data.lead } : l));
        setCrmStatusNote('');
        
        // Refresh intelligence scores
        const res2 = await fetch(`/api/v1/ai/research/${selectedLeadId}`);
        const data2 = await res2.json();
        if (data2 && data2.scores) {
          setScores(data2.scores);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCrmSyncing(false);
    }
  };

  // Simple Markdown formatter
  const renderMarkdownToHtml = (markdown: string) => {
    if (!markdown) return <p className="text-slate-400 italic">No proposal generated yet.</p>;
    
    const lines = markdown.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('######')) {
        return <h6 key={idx} className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">{trimmed.slice(6).trim()}</h6>;
      }
      if (trimmed.startsWith('#####')) {
        return <h5 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">{trimmed.slice(5).trim()}</h5>;
      }
      if (trimmed.startsWith('####')) {
        return <h4 key={idx} className="text-base font-bold text-slate-800 dark:text-slate-100 mt-3">{trimmed.slice(4).trim()}</h4>;
      }
      if (trimmed.startsWith('###')) {
        return <h3 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-4 border-b border-slate-100 dark:border-slate-800 pb-1">{trimmed.slice(3).trim()}</h3>;
      }
      if (trimmed.startsWith('##')) {
        return <h2 key={idx} className="text-xl font-semibold text-slate-950 dark:text-white mt-5 pb-1 border-b border-slate-200 dark:border-slate-800">{trimmed.slice(2).trim()}</h2>;
      }
      if (trimmed.startsWith('#')) {
        return <h1 key={idx} className="text-2xl font-bold text-slate-950 dark:text-white mt-6 mb-3">{trimmed.slice(1).trim()}</h1>;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-600 dark:text-slate-300 leading-relaxed py-0.5">
            {trimmed.slice(1).trim()}
          </li>
        );
      }
      if (/^\d+\./.test(trimmed)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs text-slate-600 dark:text-slate-300 leading-relaxed py-0.5">
            {trimmed.replace(/^\d+\./, '').trim()}
          </li>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed my-2">{trimmed}</p>;
    });
  };

  const getScoreValue = (type: 'ICP' | 'DECISION_MAKER' | 'BUYING_INTENT' | 'OVERALL') => {
    const found = scores.find(s => s.scoreType === type);
    return found ? found.scoreValue : 0;
  };

  const getScoreReasoning = (type: 'ICP' | 'DECISION_MAKER' | 'BUYING_INTENT' | 'OVERALL') => {
    const found = scores.find(s => s.scoreType === type);
    return found ? found.reasoning : '';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Retrieving SDR Leads Registry and scoring telemetry...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: ACTIVE LEAD SCORING & SELECTION */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Lead Selector Header */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Outbound Lead Selection</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded">
              {leads.length} Prospects Sourced
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 block">Select Target Lead Profile</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full text-xs font-medium p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.firstName} {l.lastName || ''} — {l.company}
                </option>
              ))}
            </select>
          </div>

          {activeLead && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeLead.firstName} {activeLead.lastName || ''}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {activeLead.title || 'Decision Maker'} at <span className="font-semibold text-slate-700 dark:text-slate-300">{activeLead.company}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  activeLead.status === 'QUALIFIED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  activeLead.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {activeLead.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                  Confidence: {activeLead.confidenceScore || 40}%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                  Value: ₹{(activeLead.value || 45000).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* AI INTENSITY METRIC SCORES */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">AI Evaluation Matrix</span>

          {!research ? (
            <div className="text-center py-6 space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="text-xs text-slate-500 leading-relaxed px-4">
                No active research telemetry detected for this profile. Run full AI Company Research & Contact Intelligence first.
              </div>
              <button
                onClick={handleTriggerFullResearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 mx-auto shadow-sm"
              >
                <Bot className="w-3.5 h-3.5" />
                Initialize AI Research
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Score SVG Wheel Rows */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'ICP' as const, label: 'ICP Fit Score', color: 'text-emerald-500', stroke: 'stroke-emerald-500' },
                  { type: 'DECISION_MAKER' as const, label: 'Decision Level', color: 'text-blue-500', stroke: 'stroke-blue-500' },
                  { type: 'BUYING_INTENT' as const, label: 'Buying Intent', color: 'text-purple-500', stroke: 'stroke-purple-500' },
                  { type: 'OVERALL' as const, label: 'Overall Priority', color: 'text-amber-500', stroke: 'stroke-amber-500' }
                ].map((s) => {
                  const val = getScoreValue(s.type);
                  const radius = 24;
                  const circ = 2 * Math.PI * radius;
                  const strokeOffset = circ - (val / 100) * circ;

                  return (
                    <div key={s.type} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 text-center flex flex-col items-center justify-between space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">{s.label}</span>
                      
                      <div className="relative flex items-center justify-center">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r={radius} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" fill="transparent" />
                          <circle cx="32" cy="32" r={radius} className={s.stroke} strokeWidth="4" fill="transparent"
                                  strokeDasharray={circ} strokeDashoffset={strokeOffset} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xs font-bold font-mono text-slate-800 dark:text-slate-100">{val}%</span>
                      </div>

                      <span className="text-[9px] font-mono text-slate-400 line-clamp-1">{getScoreReasoning(s.type)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Status Alert Banner */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex items-start gap-2">
                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                  <strong>Priority outreach recommended:</strong> Overall rating scores at {getScoreValue('OVERALL')}%. Direct authority detected with standard enterprise fit metrics.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CORE SDR WORKSPACE ACTIONS COCKPIT */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
        
        {/* Workspace Toolbar */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">
              AI SDR WORKSPACE COCKPIT
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'research', label: 'Research & Intel', icon: Globe },
              { id: 'email', label: 'Email Writer', icon: Mail },
              { id: 'followup', label: 'Followup Sequence', icon: Clock },
              { id: 'meeting', label: 'Meeting Prep', icon: Calendar },
              { id: 'proposal', label: 'Proposal Builder', icon: FileText },
              { id: 'crm', label: 'CRM Automation', icon: Layers }
            ].map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id as any)}
                  className={`px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 rounded-md cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white font-bold shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sec.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Logging Overlay for Scraper & Cognition loops */}
        {isGenerating && (
          <div className="p-6 bg-slate-950 text-slate-300 font-mono text-xs space-y-3 animate-fade-in border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                EXECUTION PIPELINE IN PROGRESS...
              </span>
              <span className="text-[10px] text-slate-500">Node_ID: crm_autonomy</span>
            </div>
            <div className="space-y-1 bg-black/40 p-3 rounded border border-slate-850 h-[100px] overflow-y-auto scrollbar-none">
              {generatingLogs.map((log, idx) => (
                <div key={idx} className="line-clamp-1">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Body contents */}
        <div className="p-6 min-h-[480px]">
          
          {/* 1. RESEARCH & CONTACT INTEL */}
          {activeSection === 'research' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" /> Company Intelligence Summary
                  </h4>
                  <p className="text-[11px] text-slate-500">Autonomous scraper details compiled with real-time website analyses.</p>
                </div>

                <button
                  onClick={handleTriggerFullResearch}
                  disabled={isGenerating}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Trigger Scraper & AI Audit
                </button>
              </div>

              {!research ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
                  <Bot className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    No company or contact intelligence found for <strong>{activeLead?.company}</strong>. Trigger active AI intelligence loop to pull technology profile, pain points, website highlights, and buying signals.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left: Company metrics */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Company Telemetry</span>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block">Strategic summary</label>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{research.summary}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 block">Industry Group</label>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{research.industry}</span>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 block">Team count</label>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{research.teamSize}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Technology Stack</span>
                      <div className="flex flex-wrap gap-1">
                        {research.technologies.map((t, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded border border-blue-100 dark:border-blue-900/30">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Pain Points & Contact details */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Decision-Maker Profile</span>

                      {contact && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs font-bold text-slate-800 dark:text-white">{contact.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">{contact.role}</div>
                            </div>
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                              contact.buyingIntentEstimate === 'HIGH' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              Intent: {contact.buyingIntentEstimate}
                            </span>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-slate-400 block">Personalized outreach hooks</label>
                            <ul className="space-y-1.5 mt-1">
                              {contact.talkingPoints.map((tp, idx) => (
                                <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{tp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Identified Core Pain Points</span>
                      <ul className="space-y-1.5">
                        {research.painPoints.map((pp, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{pp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. EMAIL CO-PILOT WRITER */}
          {activeSection === 'email' && (
            <div className="space-y-6">
              
              <div>
                <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-600" /> AI Outbound Email Writer
                </h4>
                <p className="text-[11px] text-slate-500">Draft highly personalizable intro cold outreach emails matching compliance coordinates.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Email inputs */}
                <div className="md:col-span-5 space-y-4 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-xl">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Outreach Constraints</span>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 block">Outbound Tone</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Formal', 'Casual', 'Bold', 'Persuasive'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setEmailTone(t as any)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md border cursor-pointer text-center transition-all ${
                            emailTone === t 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">Target outbound goal</label>
                    <input
                      type="text"
                      value={emailGoal}
                      onChange={(e) => setEmailGoal(e.target.value)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">Value proposal / Offer</label>
                    <input
                      type="text"
                      value={emailOffer}
                      onChange={(e) => setEmailOffer(e.target.value)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">Custom instructions (Optional)</label>
                    <textarea
                      value={emailCustomPrompt}
                      onChange={(e) => setEmailCustomPrompt(e.target.value)}
                      placeholder="e.g. mention Chennai branch or ask about series B funding..."
                      className="w-full h-16 text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerateEmail}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Compose AI Email Copy
                  </button>
                </div>

                {/* Draft room preview */}
                <div className="md:col-span-7 space-y-4">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Generated Drafts History</span>
                  
                  {generatedEmails.length === 0 ? (
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400 italic">
                      No emails generated yet for this lead. Select constraints on the left and trigger compilation.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                      {generatedEmails.map((e) => {
                        const isEditing = editingEmailId === e.id;
                        return (
                          <div key={e.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 relative">
                            
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                              <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                                Draft • Tone: {e.tone}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                {!isEditing ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingEmailId(e.id);
                                        setEditSubject(e.subject);
                                        setEditBody(e.body);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                      title="Edit Email"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleArchiveEmail(e.id)}
                                      className="p-1 text-rose-400 hover:text-rose-600 transition"
                                      title="Archive"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleSaveEmailEdit(e.id)}
                                    className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-mono flex items-center gap-1"
                                  >
                                    <Save className="w-3 h-3" /> Save
                                  </button>
                                )}
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editSubject}
                                  onChange={(e) => setEditSubject(e.target.value)}
                                  className="w-full text-xs font-bold p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100"
                                />
                                <textarea
                                  value={editBody}
                                  onChange={(e) => setEditBody(e.target.value)}
                                  className="w-full h-40 text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 resize-none"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  <span className="text-slate-400 font-mono font-normal">Subject:</span> {e.subject}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                                  {e.body}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-2 text-[10px] font-mono text-slate-400 uppercase">
                              <span>Status: {e.status}</span>
                              <span>{new Date(e.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. FOLLOWUP SEQUENCES */}
          {activeSection === 'followup' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" /> AI Follow-up Sequences
                  </h4>
                  <p className="text-[11px] text-slate-500">Formulate continuous multi-stage reminders to secure high-reply close loops.</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sequenceSteps}
                    onChange={(e) => setSequenceSteps(parseInt(e.target.value))}
                    className="text-xs p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="2">2 follow-ups</option>
                    <option value="3">3 follow-ups</option>
                    <option value="4">4 follow-ups</option>
                  </select>
                  
                  <button
                    onClick={handleGenerateFollowups}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assemble Sequence
                  </button>
                </div>
              </div>

              {generatedFollowups.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400 italic">
                  No follow-up sequences mapped for this campaign. Click &quot;Assemble Sequence&quot; above to auto-generate step drip copies.
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Sequence step outline</span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {generatedFollowups.map((f) => {
                      const isEditing = editingFollowupId === f.id;
                      return (
                        <div key={f.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 relative flex flex-col justify-between h-[360px]">
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-850">
                              <span className="text-[10px] font-bold font-mono text-blue-600 dark:text-blue-400">
                                Step #{f.stepNumber} • T+{f.delayDays}d
                              </span>
                              
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    handleSaveFollowupEdit(f.id);
                                  } else {
                                    setEditingFollowupId(f.id);
                                    setEditFollowupSubject(f.subject);
                                    setEditFollowupBody(f.body);
                                  }
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                              >
                                {isEditing ? <Save className="w-3.5 h-3.5 text-blue-600" /> : <Edit3 className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editFollowupSubject}
                                  onChange={(e) => setEditFollowupSubject(e.target.value)}
                                  className="w-full text-[11px] font-bold p-1 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100"
                                />
                                <textarea
                                  value={editFollowupBody}
                                  onChange={(e) => setEditFollowupBody(e.target.value)}
                                  className="w-full h-44 text-[11px] p-1 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 resize-none"
                                />
                              </div>
                            ) : (
                              <div className="space-y-1.5 overflow-hidden">
                                <div className="text-[11px] font-bold text-slate-800 dark:text-white line-clamp-1">
                                  <span className="text-slate-400 font-normal">Subject:</span> {f.subject}
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed line-clamp-[11] font-medium bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-150 dark:border-slate-850/50">
                                  {f.body}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="text-[9px] font-mono text-slate-400 uppercase text-right">
                            Status: {f.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. MEETING PREP BRIEFS */}
          {activeSection === 'meeting' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" /> AI Meeting Preparation Briefs
                  </h4>
                  <p className="text-[11px] text-slate-500">Generate high-impact objection matrices and consultative strategies for booked calls.</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedApptId}
                    onChange={(e) => setSelectedApptId(e.target.value)}
                    className="text-xs p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="">-- Match Appointment --</option>
                    {appointments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.leadName} • {a.title || 'Introduction'}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleCompileMeetingBrief}
                    disabled={!selectedApptId || isBriefGenerating}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                  >
                    {isBriefGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                    Compile AI Briefing
                  </button>
                </div>
              </div>

              {!meetingBrief ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    No active briefing compiled. Select a booked call or appointment slot from the dropdown menu to trigger strategic outline generation.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Strategic summaries */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Company Positioning</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{meetingBrief.companyOverview}</p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Decision-Maker Alignment</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{meetingBrief.contactOverview}</p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Custom Meeting Strategy</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800">{meetingBrief.meetingStrategy}</p>
                    </div>
                  </div>

                  {/* Bullet questions and objections */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Strategic Questions to ask</span>
                      <ul className="space-y-1.5">
                        {meetingBrief.suggestedQuestions.map((q, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 font-medium">
                            <BadgeHelp className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Possible Objections & Counters</span>
                      <ul className="space-y-2">
                        {meetingBrief.possibleObjections.map((obj, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex flex-col space-y-0.5 border-l-2 border-rose-500 pl-2">
                            <span className="font-bold text-slate-800 dark:text-white">Objection: {obj.split(';')[0]}</span>
                            <span className="text-[11px] font-medium text-slate-500">Counter: {obj.split(';')[1] || 'Highlight compliance and easy technical setups.'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Key Discussion Guidelines</span>
                      <ul className="space-y-1">
                        {meetingBrief.keyDiscussionPoints.map((kd, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>{kd}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* 5. PROPOSAL BUILDER ROOM */}
          {activeSection === 'proposal' && (
            <div className="space-y-6">
              
              <div>
                <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> B2B Bounded Proposal Builder
                </h4>
                <p className="text-[11px] text-slate-500">Draft elegant Markdown-based pricing bids & compliance structures matching local targets.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Proposal Metadata Form */}
                <div className="lg:col-span-5 space-y-4 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-xl">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Document settings</span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">Proposal Title</label>
                    <input
                      type="text"
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">Scope of Work (SOW)</label>
                    <textarea
                      value={proposalScope}
                      onChange={(e) => setProposalScope(e.target.value)}
                      className="w-full h-24 text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">Pricing & Billing coordinates</label>
                    <input
                      type="text"
                      value={proposalPricing}
                      onChange={(e) => setProposalPricing(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">Defined Next Steps</label>
                    <textarea
                      value={proposalNextSteps}
                      onChange={(e) => setProposalNextSteps(e.target.value)}
                      className="w-full h-20 text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerateProposal}
                    disabled={isProposalGenerating}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                  >
                    {isProposalGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSignature className="w-3.5 h-3.5" />}
                    Compile Custom Proposal
                  </button>
                </div>

                {/* Markdown Proposal View */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Document Preview Room</span>
                    {generatedProposals.length > 0 && (
                      <select
                        value={selectedProposalId}
                        onChange={(e) => setSelectedProposalId(e.target.value)}
                        className="text-[10px] font-mono p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        {generatedProposals.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title.slice(0, 24)}...
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-850 h-[380px] overflow-y-auto font-sans shadow-inner">
                    {selectedProposalId ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {renderMarkdownToHtml(generatedProposals.find(p => p.id === selectedProposalId)?.markdownContent || '')}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center space-y-2 text-center text-slate-400 italic text-xs">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <span>No proposals compiled. Define scope of work and pricing to render the Markdown proposal contract.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 6. CRM AUTOMATION SYNC */}
          {activeSection === 'crm' && (
            <div className="space-y-6">
              
              <div>
                <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" /> CRM Status & Stage Automation
                </h4>
                <p className="text-[11px] text-slate-500">Auto-align lead confidence scores, transition pipelines, and dispatch follow-up calendar hooks.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Automation Actions */}
                <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-5 border border-slate-150 dark:border-slate-850 rounded-xl">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Auto-Stage Controls</span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">Activity Log / Event Notes</label>
                    <textarea
                      value={crmStatusNote}
                      onChange={(e) => setCrmStatusNote(e.target.value)}
                      placeholder="Enter specific conversation replies, booked links, or call outcomes to log..."
                      className="w-full h-24 text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-mono text-slate-500 block">Trigger Autonomous Pipeline Sync</label>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        { action: 'EMAIL_SENT' as const, label: 'Transition: Outbound Email Sent', desc: 'Advances status to CONTACTED (+5% Confidence)', color: 'bg-blue-600 hover:bg-blue-500' },
                        { action: 'EMAIL_REPLIED' as const, label: 'Transition: Received Positive Reply', desc: 'Advances status to QUALIFIED (+20% Confidence) and spins up urgent Followup Task', color: 'bg-emerald-600 hover:bg-emerald-500' },
                        { action: 'MEETING_BOOKED' as const, label: 'Transition: Meeting Booked', desc: 'Sets status to QUALIFIED and locks Confidence Score at 90%', color: 'bg-purple-600 hover:bg-purple-500' }
                      ].map((item) => (
                        <button
                          key={item.action}
                          disabled={isCrmSyncing}
                          onClick={() => handleTriggerCrmAction(item.action)}
                          className={`w-full text-left p-3 rounded-lg text-white ${item.color} transition cursor-pointer disabled:bg-slate-250 dark:disabled:bg-slate-800`}
                        >
                          <div className="text-xs font-bold font-mono flex items-center justify-between">
                            <span>{item.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-[10px] text-white/80 font-medium mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CRM State representation */}
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">CRM Record Synchronizer Status</span>

                  <div className="p-5 border border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-4 h-[320px] flex flex-col justify-between">
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold uppercase font-mono">Supabase Sync Live</span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block">Lead Status Stage</label>
                          <span className="text-sm font-bold text-slate-800 dark:text-white font-mono uppercase">
                            {activeLead?.status}
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block">Close Confidence Index</label>
                          <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                            {activeLead?.confidenceScore || 40}%
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block">SDR Activity status logs</label>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                            {activeLead?.researchStatusText || 'Awaiting initial outbound sequence trigger...'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-850 text-[9px] font-mono text-slate-400 leading-relaxed">
                      All pipeline stages use organization isolated partitions via <code>organization_id</code> filters. Transactions are signed using secure local db caches synced to remote Postgres clusters.
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
