import React, { useState, useEffect } from 'react';
import { 
  Rocket, Users, ShieldAlert, Cpu, Activity, Layout, Terminal, CheckCircle, 
  RefreshCw, Send, Lock, Eye, Check, ChevronRight, Sliders, Layers, Code, Settings, Bell, Server, 
  Play, Zap, FileText, ToggleLeft, HelpCircle, Award, CreditCard, Plus, Trash2, ArrowUpRight, 
  AlertTriangle, Key, Heart, Wifi, CheckSquare, Square, Inbox, Star, Share2, HelpCircle as HelpIcon,
  MessageSquare, Trash, CheckSquare as CheckSquareIcon, ListTodo, ThumbsUp, BarChart, Clock, Database, Globe,
  X, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Legend, LineChart, Line, FunnelChart, Funnel
} from 'recharts';
import { WorkspaceUser, Lead, Campaign, Deal } from '../types';

interface BetaProgramViewProps {
  user: WorkspaceUser | null;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
  onSelectTab: (tabId: string) => void;
  onShowOnboarding: () => void;
}

export function BetaProgramView({
  user,
  leads,
  setLeads,
  campaigns,
  setCampaigns,
  deals,
  setDeals,
  onSelectTab,
  onShowOnboarding
}: BetaProgramViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'onboarding' | 'feedback' | 'analytics' | 'emails' | 'stability'>('dashboard');

  // Interactive local states for Admin Beta Dashboard
  const [isPrivateBeta, setIsPrivateBeta] = useState(true);
  const [inviteCodes, setInviteCodes] = useState([
    { code: 'BETA-START-99', used: 12, maxUses: 50, expiry: '2026-12-31', creator: 'Soham Kharat' },
    { code: 'BETA-VIP-PRO', used: 5, maxUses: 10, expiry: '2026-10-15', creator: 'Soham Kharat' },
    { code: 'REF-ANANYA-7', used: 2, maxUses: 5, expiry: '2026-09-01', creator: 'Ananya Sharma' }
  ]);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(25);
  
  // Waitlist data state
  const [waitlist, setWaitlist] = useState([
    { id: 'w-1', name: 'Kabir Dev', email: 'kabir@devoutreach.in', company: 'Dev Agencies', source: 'Direct Signup', status: 'PENDING', date: '2026-07-20' },
    { id: 'w-2', name: 'Meera Iyer', email: 'meera@iyerconsulting.com', company: 'Iyer Consulting', source: 'Referral (Ananya)', status: 'APPROVED', date: '2026-07-19' },
    { id: 'w-3', name: 'Amit Patel', email: 'amit@patelventures.co', company: 'Patel Ventures', source: 'Google Ads', status: 'PENDING', date: '2026-07-18' },
    { id: 'w-4', name: 'Sneha Rao', email: 'sneha@raotech.io', company: 'RaoTech', source: 'Waitlist Form', status: 'REJECTED', date: '2026-07-17' }
  ]);

  // Referral system tracking
  const [referrals, setReferrals] = useState([
    { id: 'ref-1', referrer: 'Ananya Sharma', email: 'ananya@apexmarketing.in', rewardTier: 'Professional Free Seat', signups: 7, status: 'CLAIMED' },
    { id: 'ref-2', referrer: 'Rohan Mehta', email: 'rohan.mehta@apexlabs.io', rewardTier: '₹5,000 Cashfree Credit', signups: 3, status: 'PENDING' },
    { id: 'ref-3', referrer: 'Vikram Goel', email: 'vikram@goelconsulting.com', rewardTier: 'Double API Quotas', signups: 1, status: 'NOT_ELIGIBLE' }
  ]);

  // Onboarding Checklist
  const [onboardingChecklist, setOnboardingChecklist] = useState([
    { id: 'step-1', text: 'Welcome video & product overview tour', done: true },
    { id: 'step-2', text: 'Define organization metadata parameters', done: true },
    { id: 'step-3', text: 'Secure OAuth handshake for corporate Gmail box', done: false },
    { id: 'step-4', text: 'Sync Google Calendar conference availability slots', done: false },
    { id: 'step-5', text: 'Load demo workspace sandbox with seed CRM data', done: true },
    { id: 'step-6', text: 'Establish OpenAI or Gemini background key credentials', done: false },
    { id: 'step-7', text: 'Build and launch first cold automated sequence', done: false }
  ]);

  // Feedback states
  const [bugCategory, setBugCategory] = useState('SCRAPER');
  const [bugSeverity, setBugSeverity] = useState('MEDIUM');
  const [bugSteps, setBugSteps] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [mockScreenshotName, setMockScreenshotName] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Feature request state with upvoting
  const [features, setFeatures] = useState([
    { id: 'f-1', title: 'HubSpot & Salesforce Two-Way Sync', desc: 'Allow automated outbound leads and deal state modifications to synchronize with legacy enterprise platforms.', votes: 42, upvoted: false },
    { id: 'f-2', title: 'WhatsApp Outbound Drips', desc: 'Support omnichannel messaging sequences incorporating WhatsApp Business API templates.', votes: 29, upvoted: false },
    { id: 'f-3', title: 'AI Voice Message Drops', desc: 'Simulate automated custom sound recordings directly to lead call inboxes when they decline dialer queues.', votes: 18, upvoted: false }
  ]);

  // Captured Client Telemetry / Diagnostics State
  const [telemetry, setTelemetry] = useState({
    sessionId: 'sess_sp_' + Math.random().toString(36).substring(2, 11).toUpperCase(),
    userAgent: navigator.userAgent.substring(0, 55) + '...',
    platform: navigator.platform,
    screenWidth: `${window.innerWidth}px`,
    screenHeight: `${window.innerHeight}px`,
    language: navigator.language,
    networkLatencyMs: 14,
    errorsCaptured: [
      { timestamp: '09:42:15', type: 'CONSOLE_WARN', msg: '[vite] failed to connect to websocket. HMR is safely disabled by platform.' },
      { timestamp: '09:44:02', type: 'API_ERROR', msg: 'POST /api/v1/auth/profile-setup - Token bucket verified. status: 200' }
    ]
  });

  // Support Ticketing and automated live chat widget
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I am the SalesPilot Support Assistant. Need help with Gmail SMTP, Scraper spiders, or Cashfree setup?', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatResponding, setChatResponding] = useState(false);

  const [activeEmailTemplate, setActiveEmailTemplate] = useState<'welcome' | 'trial-started' | 'trial-ending' | 'upgrade' | 'feedback' | 'tips'>('welcome');
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  // Stability Testing simulation
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED'>('IDLE');

  // Rollback management & Versioning
  const [rollbackSimulationLogs, setRollbackSimulationLogs] = useState<string[]>([]);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Search filter for Documentation Index
  const [docSearch, setDocSearch] = useState('');

  // Notifications or toast simulation
  const [localNotification, setLocalNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setLocalNotification({ text, type });
    setTimeout(() => setLocalNotification(null), 3000);
  };

  // Generate invite code
  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) return;
    const cleanCode = newCodeName.toUpperCase().replace(/\s+/g, '-');
    setInviteCodes(prev => [
      ...prev,
      { code: cleanCode, used: 0, maxUses: newCodeMaxUses, expiry: '2026-10-31', creator: user?.fullName || 'Soham' }
    ]);
    setNewCodeName('');
    showToast(`Invite Code ${cleanCode} has been generated successfully!`, 'success');
  };

  // Action on waitlist
  const handleWaitlistAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status: action } : w));
    const target = waitlist.find(w => w.id === id);
    if (action === 'APPROVED' && target) {
      showToast(`Approved ${target.name} and dispatched custom beta welcome onboarding email!`, 'success');
    } else if (target) {
      showToast(`Rejected ${target.name} waitlist registration.`, 'info');
    }
  };

  // Interactive upvoting
  const handleUpvoteFeature = (id: string) => {
    setFeatures(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          votes: f.upvoted ? f.votes - 1 : f.votes + 1,
          upvoted: !f.upvoted
        };
      }
      return f;
    }));
  };

  // Drag-and-drop screenshot simulation
  const handleScreenshotMock = () => {
    const fileNames = ['dashboard_graph_bug.png', 'scraper_timeout_error.jpg', 'billing_invoice_alignment.png'];
    const chosen = fileNames[Math.floor(Math.random() * fileNames.length)];
    setMockScreenshotName(chosen);
    setScreenshotPreview('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80');
    showToast(`Mock screenshot "${chosen}" attached successfully.`, 'success');
  };

  // Automated chatbot
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const currentQuery = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: currentQuery, time: 'Just now' }]);
    setChatInput('');
    setChatResponding(true);

    setTimeout(() => {
      let reply = 'I understand your query. Let me fetch the relevant article. You can configure your Gmail connection from the "Onboarding Wizard" button!';
      if (currentQuery.toLowerCase().includes('gmail') || currentQuery.toLowerCase().includes('smtp')) {
        reply = 'To configure Gmail, make sure you use a G-Suite Workspace or an App Password. Standard Google passwords will fail due to active 2FA constraints.';
      } else if (currentQuery.toLowerCase().includes('cashfree') || currentQuery.toLowerCase().includes('billing')) {
        reply = 'Cashfree credentials require your App ID and Private Secret Key. These are located in your Cashfree Developer Dashboard under PG/API Keys.';
      } else if (currentQuery.toLowerCase().includes('scraper') || currentQuery.toLowerCase().includes('lead')) {
        reply = 'The lead engine uses autonomous scraper spiders using Gemini maps API. Scraped leads populate instantly in your Lead Engine view.';
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, time: 'Just now' }]);
      setChatResponding(false);
    }, 1200);
  };

  // Stability testing runner
  const runStabilitySuite = () => {
    setIsTesting(true);
    setTestProgress(0);
    setTestResult('RUNNING');
    setTestLogs([
      `[${new Date().toLocaleTimeString()}] [TEST] Launching E2E Automated Validation Suite...`,
      `[${new Date().toLocaleTimeString()}] [TEST] Target Endpoint: https://localhost:3000`
    ]);

    const testSteps = [
      'Performing E2E Regression checks: login, authorization tokens validation...',
      'Verifying Multitenant Isolation: RLS Row-Level Security checks on PostgreSQL schemas...',
      'Testing AI SDR sequence engine: checking Gemini-1.5 generation response chains...',
      'Testing Cashfree payment gateway webhook signature handshakes...',
      'Testing Cross-Browser response: responsive breakpoints, mobile click indices...',
      'Simulating load spike: executing 10,000 requests/sec token bucket stress parameters...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < testSteps.length) {
        setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [TEST] ${testSteps[currentStep]}`]);
        setTestProgress(prev => Math.min(95, prev + 16));
        currentStep++;
      } else {
        clearInterval(interval);
        setTestProgress(100);
        setTestResult('PASSED');
        setTestLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SUCCESS] All 15 core integration scenarios passed flawlessly!`,
          `[${new Date().toLocaleTimeString()}] [COMPLIANCE] SOC2 framework compliance parameters audited - 100% compliant.`
        ]);
        setIsTesting(false);
        showToast('Stability Suite tests passed successfully!', 'success');
      }
    }, 1200);
  };

  // Version rollback
  const triggerRollback = () => {
    setIsRollingBack(true);
    setRollbackSimulationLogs([
      `[${new Date().toLocaleTimeString()}] [ROLLBACK] Received disaster mitigation trigger from administrator.`,
      `[${new Date().toLocaleTimeString()}] [ROLLBACK] Target: Restore cluster state to previous stable build (v0.9.8-LTS)...`,
      `[${new Date().toLocaleTimeString()}] [ROLLBACK] Terminating ongoing Docker network threads...`,
      `[${new Date().toLocaleTimeString()}] [ROLLBACK] Restoring Supabase database schema to backup snapshot_2026_07_20.sql...`
    ]);

    setTimeout(() => {
      setRollbackSimulationLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ROLLBACK] DB integrity verified. 0 broken tables recorded.`,
        `[${new Date().toLocaleTimeString()}] [ROLLBACK] Swapped live route endpoints to stable version v0.9.8.`,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] System rollback completed in 1.4 seconds. Live cluster online.`
      ]);
      setIsRollingBack(false);
      showToast('System rollback simulation finished.', 'info');
    }, 2000);
  };

  // Simulated Inbox Loader
  const getEmailContent = () => {
    const name = user?.fullName || 'SalesPilot Client';
    switch (activeEmailTemplate) {
      case 'welcome':
        return {
          subject: `Welcome to SalesPilot Private Beta, ${name}!`,
          body: `Hi ${name.split(' ')[0]},\n\nWe are absolutely thrilled to welcome you to the private beta of SalesPilot v1.0. Your enterprise seat is fully provisioned.\n\nTo help you get started instantly, we have prepared a Welcome Tour inside your dashboard. Head over to the Help Center to execute. Your feedback is what shapes our roadmap!\n\nBest regards,\nSoham Kharat & The SalesPilot Team`
        };
      case 'trial-started':
        return {
          subject: `Your 1-Day Full Feature Free Trial has commenced!`,
          body: `Hi ${name.split(' ')[0]},\n\nYour 24-hour trial interval is active. You have full, unrestricted premium access to the Lead Engine, AI SDR agent writer, campaign sequences, and Google Workspace integrations.\n\nCheck your countdown timer at the top of your dashboard. No billing info is required to test-drive. Start sourcing leads now!\n\nCheers,\nSalesPilot Core System`
        };
      case 'trial-ending':
        return {
          subject: `ALERT: Your SalesPilot Free Trial is ending in 2 hours!`,
          body: `Hi ${name.split(' ')[0]},\n\nThis is a friendly automation nudge: your 24-hour full feature access is set to expire in 2 hours. Any outbound campaigns will pause once the interval passes.\n\nTo prevent interruption, configure Cashfree billing or upgrade to our Starter plan (₹2,499/mo) or Growth plan (₹5,999/mo) with full GST billing.\n\nUpgrade now in your Billing Tab!`
        };
      case 'upgrade':
        return {
          subject: `Success! Subscribed to SalesPilot Growth Tier`,
          body: `Hi ${name.split(' ')[0]},\n\nThank you for choosing SalesPilot for your outreach agency. Your payment has been securely settled via Cashfree Payments.\n\nYour plan is now active:\n• Plan: Growth Tier (₹5,999 / month)\n• Active Seats: 5 Workspace Members\n• AI Token Allowance: Unlimited Scrapes & Personalizations\n\nYour GST compliant invoice SP-INV-019 has been added to your Settings.`
        };
      case 'feedback':
        return {
          subject: `We want to hear from you! SalesPilot User Satisfaction Survey`,
          body: `Hi ${name.split(' ')[0]},\n\nHow is your experience with SalesPilot so far? Our engineering team reads every single submission.\n\nTake 30 seconds to rate your experience and suggest what features we should build next (HubSpot integration, automated CRM webhooks, etc.).\n\nWarmly,\nHead of Product, SalesPilot`
        };
      case 'tips':
        return {
          subject: `Weekly Product Tips: Maximize Scraper Deliverability & Avoid Spamboxes`,
          body: `Hi ${name.split(' ')[0]},\n\nHere are this week's pro tips for high-deliverability cold campaigns:\n\n1. Maintain low sending limits: keep G-Suite outbound sends below 150/day per seat.\n2. Leverage Vesper and Astra agents to double-enrich profiles. Leads with customized painpoints receive 3x higher open rates.\n3. Verify your custom domains have valid SPF, DKIM, and DMARC handshakes.\n\nGood luck selling!`
        };
    }
  };

  const currentEmail = getEmailContent();

  // Load Product Demo Data
  const handleLoadDemoWorkspace = () => {
    const demoLeads: Lead[] = [
      {
        id: 'ld-demo-1',
        firstName: 'Amit',
        lastName: 'Sharma',
        email: 'amit@sharmagrowth.in',
        company: 'Sharma Growth Marketing',
        phone: '+91 98765 43210',
        source: 'Google Maps',
        status: 'QUALIFIED',
        enrichment: { website: 'sharmagrowth.in', industry: 'Marketing Agency', linkedInUrl: 'https://linkedin.com' },
        createdAt: new Date().toISOString()
      },
      {
        id: 'ld-demo-2',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya@patelventures.co',
        company: 'Patel SaaS Advisory',
        phone: '+91 91234 56789',
        source: 'Google Maps',
        status: 'INTERESTED',
        enrichment: { website: 'patelventures.co', industry: 'SaaS & Software', linkedInUrl: 'https://linkedin.com' },
        createdAt: new Date().toISOString()
      }
    ];

    const demoCampaigns: Campaign[] = [
      {
        id: 'cp-demo-1',
        name: 'SaaS Outbound Accelerator',
        targetAudience: 'SAAS',
        status: 'ACTIVE',
        totalSent: 150,
        totalOpened: 110,
        totalReplied: 32,
        createdAt: new Date().toISOString(),
        steps: []
      }
    ];

    setLeads(demoLeads);
    setCampaigns(demoCampaigns);
    showToast('Demo Workspace Loaded! Pre-populated CRM leads and campaigns injected.', 'success');
  };

  // Recharts analytics values
  const conversionFunnelData = [
    { value: 100, name: '1. Waitlist Signups', fill: '#3b82f6' },
    { value: 85, name: '2. Approved Invites', fill: '#60a5fa' },
    { value: 68, name: '3. Completed Onboarding', fill: '#818cf8' },
    { value: 48, name: '4. First Campaign', fill: '#a78bfa' },
    { value: 34, name: '5. Cashfree Upgrades (Paid)', fill: '#10b981' }
  ];

  const userActivityData = [
    { day: 'Day 1', DAU: 120, WAU: 450, MAU: 1200 },
    { day: 'Day 5', DAU: 145, WAU: 490, MAU: 1250 },
    { day: 'Day 10', DAU: 190, WAU: 520, MAU: 1300 },
    { day: 'Day 15', DAU: 240, WAU: 610, MAU: 1410 },
    { day: 'Day 20', DAU: 310, WAU: 750, MAU: 1560 },
    { day: 'Day 25', DAU: 380, WAU: 890, MAU: 1800 },
    { day: 'Day 30', DAU: 450, WAU: 1100, MAU: 2100 }
  ];

  const featuresUsageData = [
    { name: 'Lead Engine Scrapes', count: 1840, fill: '#3b82f6' },
    { name: 'AI Copy Generation', count: 1250, fill: '#818cf8' },
    { name: 'AI Voice Calling', count: 850, fill: '#f59e0b' },
    { name: 'Developer REST API', count: 620, fill: '#10b981' },
    { name: 'White Label Domains', count: 420, fill: '#ec4899' }
  ];

  // Search filter documentation items
  const docItems = [
    { cat: 'USER', q: 'How does the 1-Day Trial countdown check interval function?', a: 'SalesPilot countdown timer calculates trial duration via backend intervals in seconds. Once it hits zero, write capabilities are disabled and redirection triggers.' },
    { cat: 'USER', q: 'How do I add and configure high-performance SMTP or Gmail keys?', a: 'Open Onboarding Wizard, choose Step 2, and execute the standard Google OAuth login process. This registers authorization nodes seamlessly.' },
    { cat: 'ADMIN', q: 'What is Supabase RLS tenant isolation configuration?', a: 'All Postgres queries execute with user tokens. Row-Level Security matches user tenancy identifiers, safely separating all databases.' },
    { cat: 'TROUBLESHOOTING', q: 'What causes "Missed rate limit bucket thresholds" in scraping?', a: 'The scraper limits scrapes per minute. Reduce your daily trigger counts or switch your API key to full production settings.' },
    { cat: 'KNOWN_ISSUES', q: 'Outlook mailboxes do not support automatic sequence drafts.', a: 'Active Outlook SDK restricts background composition drafts. Use standard G-Suite accounts to optimize outbound results.' }
  ].filter(d => 
    d.q.toLowerCase().includes(docSearch.toLowerCase()) || 
    d.a.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.cat.toLowerCase().includes(docSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-slate-850 dark:text-slate-100">
      
      {/* Toast Alert Notification Banner */}
      {localNotification && (
        <div className={`fixed top-4 right-4 z-55 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold animate-bounce ${
          localNotification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          localNotification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
          'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }`}>
          <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
          <span>{localNotification.text}</span>
        </div>
      )}

      {/* Main Title Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
          <Rocket className="w-96 h-96" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-rose-600 text-white font-mono font-bold text-[9px] px-2.5 py-0.5 rounded-full tracking-wider uppercase flex items-center gap-1">
              <Rocket className="w-2.5 h-2.5 animate-pulse" /> PUBLIC BETA rollout
            </span>
            <span className="text-slate-500 font-mono text-[10px]">&bull; Release Version: Beta v1.0</span>
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white flex items-center gap-2">
            Beta Program & Onboarding Control Center
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Prepare SalesPilot for public deployment. Oversee waitlist entries, manage private and public beta switches, trigger automated onboarding checklists, audit user feedback comments, and test stability regression suites.
          </p>
        </div>

        {/* Global Progress Indicator */}
        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center gap-4 relative z-10 shrink-0 min-w-[220px]">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase">
              <span>Beta Readiness</span>
              <span className="text-emerald-400">92%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '92%' }} />
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              All 11 launch criteria configured
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Sub tabs for Beta Launch Program */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'dashboard', label: 'Beta Invites & waitlist', icon: Users },
          { id: 'onboarding', label: 'User Onboarding Hub', icon: ListTodo },
          { id: 'feedback', label: 'In-App Feedback Desk', icon: MessageSquare },
          { id: 'analytics', label: 'Product Activity Monitor', icon: BarChart },
          { id: 'emails', label: 'Email Outreach Logs', icon: Inbox },
          { id: 'stability', label: 'E2E Stability & Releases', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                active 
                  ? 'bg-blue-600 text-white font-bold shadow-md' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="space-y-6">
        
        {/* ========================== TAB 1: INVITES & WAITLIST ========================== */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Private/Public beta toggles and Invite Generation */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Rollout State Toggle</span>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Launch Strategy</h4>
                    <p className="text-[10px] text-slate-500">Public signup or invite restricted.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsPrivateBeta(!isPrivateBeta);
                      showToast(`Switched strategy to ${!isPrivateBeta ? 'Private' : 'Public'} Beta!`, 'info');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition ${
                      isPrivateBeta 
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' 
                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isPrivateBeta ? '🔒 PRIVATE BETA (Invite-Only)' : '🔓 PUBLIC BETA (Open Signup)'}
                  </button>
                </div>

                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                  <strong>Waitlist Strategy:</strong> When private beta is active, new self-signup emails are routed to the <strong>Waitlist Database</strong> for admin authorization checks.
                </div>
              </div>

              {/* Generate Invite Code Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Generate Beta Promo Codes</span>
                
                <form onSubmit={handleGenerateCode} className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Code Name</label>
                    <input 
                      type="text" 
                      required
                      value={newCodeName}
                      onChange={(e) => setNewCodeName(e.target.value)}
                      placeholder="e.g. BETA-SPECIAL-50"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl p-2.5 text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Maximum Uses</label>
                    <input 
                      type="number" 
                      required
                      value={newCodeMaxUses}
                      onChange={(e) => setNewCodeMaxUses(parseInt(e.target.value) || 10)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl p-2.5 text-white" 
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-4 h-4" /> Create Beta Promo Code
                  </button>
                </form>

                {/* List of active invite codes */}
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">Active Promo Codes Registry</span>
                  {inviteCodes.map((c, i) => (
                    <div key={i} className="p-2 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center text-[10px]">
                      <div>
                        <div className="font-mono text-blue-400 font-bold">{c.code}</div>
                        <div className="text-slate-500">Created by {c.creator}</div>
                      </div>
                      <div className="text-right font-mono text-slate-300">
                        <div>{c.used}/{c.maxUses} uses</div>
                        <div className="text-[8px] text-slate-555">Exp: {c.expiry}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Waitlist Management & Referral System */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Waitlist Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active Waitlist Submissions Queue</h3>
                    <p className="text-xs text-slate-400 font-mono">Approve or reject prospective users to authorize welcome keys dispatch.</p>
                  </div>
                  <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                    {waitlist.filter(w => w.status === 'PENDING').length} PENDING SUBMISSIONS
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-mono text-[10px]">
                        <th className="pb-3 pl-2">Applicant</th>
                        <th className="pb-3">Company</th>
                        <th className="pb-3">Source Channel</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((w) => (
                        <tr key={w.id} className="border-b border-slate-100 dark:border-slate-850/50 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all">
                          <td className="py-3 pl-2">
                            <div className="font-bold text-slate-900 dark:text-white">{w.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{w.email}</div>
                          </td>
                          <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{w.company}</td>
                          <td className="py-3 font-mono text-[10px] text-slate-400">{w.source}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                              w.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                              w.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-rose-500/10 text-rose-400'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-2">
                            {w.status === 'PENDING' ? (
                              <div className="flex gap-1.5 justify-end">
                                <button 
                                  onClick={() => handleWaitlistAction(w.id, 'APPROVED')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] rounded-lg transition"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleWaitlistAction(w.id, 'REJECTED')}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9px] rounded-lg transition"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Referral based invites tracking */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Referral-Based Invites Tracker</h3>
                  <p className="text-xs text-slate-400 font-mono">Monitor beta users inviting their networks and verify milestone reward allocations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {referrals.map((r, i) => (
                    <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3 relative overflow-hidden">
                      <div className="absolute right-2 top-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[8px] font-bold ${
                          r.status === 'CLAIMED' ? 'bg-emerald-500/10 text-emerald-400' :
                          r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-800 text-slate-500'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block">Referrer Account</span>
                        <div className="font-bold text-white text-xs">{r.referrer}</div>
                        <div className="text-[10px] text-slate-400 truncate">{r.email}</div>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-900 pt-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block text-[8px]">Active Signups</span>
                          <span className="font-mono text-white font-bold">{r.signups} users</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block text-[8px]">Reward Tier</span>
                          <span className="font-bold text-blue-400">{r.rewardTier}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================== TAB 2: USER ONBOARDING ========================== */}
        {activeTab === 'onboarding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Welcome Tour & Product Walkthrough launch triggers */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Walkthrough & sandbox Triggers</span>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  SalesPilot contains interactive user onboarding suites. Execute these triggers to simulate the custom welcoming tour, start the full setup wizard, or seed mock CRM workspaces.
                </p>

                <div className="space-y-2.5">
                  <button 
                    onClick={() => {
                      onShowOnboarding();
                      showToast('Onboarding Wizard triggered!', 'info');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <ListTodo className="w-4 h-4" /> Run Onboarding Wizard
                  </button>
                  
                  <button 
                    onClick={handleLoadDemoWorkspace}
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-purple-400" /> Seed Sample CRM Data
                  </button>

                  <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-[10px] text-slate-400 flex items-start gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <span><strong>Skip Setup Capable:</strong> The onboarding wizard contains standard "Skip Setup" toggles, saving default organization contexts server-side to prevent system thread blocks.</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Demo Workspace parameters</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Seeding Demo Workspace instantiates:
                </p>
                <ul className="list-disc list-inside text-[10px] text-slate-300 space-y-1.5 pl-1.5">
                  <li>2 B2B Leads: Sharma Growth, Patel Advisory with phone, custom websites, LinkedIn coordinates.</li>
                  <li>IT cold outreach sequence templates and delay triggers.</li>
                  <li>Simulated payment invoices totaling ₹84,980.</li>
                </ul>
              </div>
            </div>

            {/* Right Setup Checklist status */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Workspace Onboarding Checklist</h3>
                    <p className="text-xs text-slate-400 font-mono">Toggle checkmarks to review setup progress. Users are shown this list upon login.</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full">
                    {Math.floor((onboardingChecklist.filter(c => c.done).length / onboardingChecklist.length) * 100)}% COMPLETE
                  </span>
                </div>

                <div className="space-y-2">
                  {onboardingChecklist.map((chk) => (
                    <button
                      key={chk.id}
                      onClick={() => {
                        setOnboardingChecklist(prev => prev.map(c => c.id === chk.id ? { ...c, done: !c.done } : c));
                        showToast(`Checklist step updated.`, 'info');
                      }}
                      className={`w-full text-left p-3.5 border rounded-xl flex items-start gap-3 transition cursor-pointer ${
                        chk.done 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      {chk.done ? (
                        <CheckSquare className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5 animate-pulse" />
                      ) : (
                        <Square className="w-4 h-4 shrink-0 text-slate-600 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-xs">{chk.text}</div>
                        <span className="text-[9px] text-slate-500 font-mono">REQUIRED ACTION STEP</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================== TAB 3: FEEDBACK, SUPPORT & BUGS ========================== */}
        {activeTab === 'feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Bug report form with mock file uploads */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Submit Beta Bug Report</span>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!bugDescription) return;
                  showToast('Bug Report successfully captured. Telemetry payload generated!', 'success');
                  setBugSteps('');
                  setBugDescription('');
                  setMockScreenshotName(null);
                  setScreenshotPreview(null);
                }} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Severity</label>
                      <select 
                        value={bugSeverity} 
                        onChange={(e) => setBugSeverity(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-2 text-white"
                      >
                        <option value="LOW">Low Nudge</option>
                        <option value="MEDIUM">Medium Warning</option>
                        <option value="HIGH">Critical Blocker</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Category</label>
                      <select 
                        value={bugCategory} 
                        onChange={(e) => setBugCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-2 text-white"
                      >
                        <option value="SCRAPER">Lead Scraper</option>
                        <option value="MAIL">Gmail OAuth</option>
                        <option value="VOICE">Voice Calling</option>
                        <option value="BILLING">Cashfree Pay</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Problem Description</label>
                    <textarea 
                      rows={2}
                      required
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder="e.g. Scraper hits rate limits when searching Mumbai agencies"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-2 text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Steps to Reproduce</label>
                    <textarea 
                      rows={2}
                      value={bugSteps}
                      onChange={(e) => setBugSteps(e.target.value)}
                      placeholder="1. Navigate to scraper page... 2. Type Mumbai..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-2 text-white resize-none"
                    />
                  </div>

                  {/* Screenshot upload area */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400">Attach Screenshot / Error Logs</label>
                    <div 
                      onClick={handleScreenshotMock}
                      className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-950/40 transition-all flex flex-col items-center justify-center space-y-1"
                    >
                      <Share2 className="w-5 h-5 text-slate-500 animate-pulse" />
                      <span className="text-[10px] text-slate-400">Drag & drop files or click to upload</span>
                      <span className="text-[8px] text-slate-550">JPG, PNG, JSON logs up to 5MB</span>
                    </div>

                    {mockScreenshotName && (
                      <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-850 rounded-xl">
                        {screenshotPreview && <img src={screenshotPreview} alt="Preview" className="w-8 h-8 rounded object-cover" />}
                        <div className="flex-1 truncate">
                          <div className="text-[10px] text-slate-300 truncate font-mono">{mockScreenshotName}</div>
                          <span className="text-[8px] text-emerald-400 font-mono">Attachment Loaded (Ready)</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setMockScreenshotName(null);
                            setScreenshotPreview(null);
                          }} 
                          className="p-1 hover:bg-slate-900 rounded"
                        >
                          <Trash className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition"
                  >
                    Submit Bug Report & Telemetry
                  </button>
                </form>
              </div>

              {/* Satisfaction score CSAT Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Satisfaction Analytics</h4>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-extrabold text-indigo-400 font-mono">94.8%</div>
                  <div>
                    <div className="text-xs font-bold text-slate-300">Beta Satisfaction Score (CSAT)</div>
                    <div className="text-[10px] text-slate-500">Calculated from 120 user rating submissions</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
                  <span className="text-[10px] text-slate-450 ml-1.5">(4.9 out of 5 stars)</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Monitor & Live Chat widget */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Telemetry diagnostics display */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active Session Telemetry Diagnostics</h3>
                  <p className="text-xs text-slate-400 font-mono">This diagnostics state is attached automatically to every bug report and ticket submission.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-500 block text-[9px] font-mono">User Session ID</span>
                    <span className="font-mono text-white font-bold">{telemetry.sessionId}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-500 block text-[9px] font-mono">Browser Core</span>
                    <span className="font-bold text-slate-300 truncate block">{telemetry.userAgent}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-500 block text-[9px] font-mono">Network Latency</span>
                    <span className="font-mono text-emerald-400 font-bold">{telemetry.networkLatencyMs}ms (Excellent)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-500 block text-[9px] font-mono">Resolutions</span>
                    <span className="font-mono text-slate-300 font-bold">{telemetry.screenWidth} x {telemetry.screenHeight}</span>
                  </div>
                </div>

                {/* Console Log Capture */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Captured Console Exceptions Stream</span>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 font-mono text-[10px] text-rose-300 leading-relaxed space-y-1.5">
                    {telemetry.errorsCaptured.map((err, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-slate-550 shrink-0">[{err.timestamp}]</span>
                        <span className="font-bold text-rose-400 shrink-0">[{err.type}]</span>
                        <span className="text-slate-300 break-all">{err.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature requests board */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Feature Requests Roadmap Board</h3>
                  <p className="text-xs text-slate-400 font-mono">Users can propose and upvote roadmap modules. Top requests are pushed to our development queue.</p>
                </div>

                <div className="space-y-3">
                  {features.map((feat) => (
                    <div key={feat.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-850 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">{feat.title}</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{feat.desc}</p>
                      </div>
                      <button 
                        onClick={() => handleUpvoteFeature(feat.id)}
                        className={`shrink-0 flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-90 min-w-[50px] cursor-pointer ${
                          feat.upvoted 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold font-mono">{feat.votes}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Help & Support Widget Trigger */}
              <div className="p-5 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <HelpIcon className="w-4 h-4 text-indigo-400 animate-pulse" /> Need Support / Have Questions?
                  </h4>
                  <p className="text-[10px] text-slate-400 max-w-md">Our Help Center FAQs, Troubleshooter, and instant Support Ticket desk is fully operational.</p>
                </div>
                <button 
                  onClick={() => setChatOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-xl transition shadow-md shadow-indigo-600/15 cursor-pointer"
                >
                  Open Live Support Chat
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================== TAB 4: PRODUCT ANALYTICS ========================== */}
        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active Beta Product Analytics</h3>
                <p className="text-xs text-slate-400 font-mono">Observe actual user behavior metrics, trial-to-paid conversion funnels, and most-used components.</p>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full font-bold">
                120 ACTIVE BETA USERS TRACKED
              </span>
            </div>

            {/* Top diagnostic counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">Daily Active (DAU)</span>
                <span className="text-2xl font-extrabold text-white font-mono">450 <span className="text-xs text-emerald-400 font-normal">+14%</span></span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">Weekly Active (WAU)</span>
                <span className="text-2xl font-extrabold text-white font-mono">1,100 <span className="text-xs text-emerald-400 font-normal">+8%</span></span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">Monthly Active (MAU)</span>
                <span className="text-2xl font-extrabold text-white font-mono">2,100 <span className="text-xs text-emerald-400 font-normal">+20%</span></span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">Trial Conversion Rate</span>
                <span className="text-2xl font-extrabold text-white font-mono">34.2% <span className="text-xs text-indigo-400 font-normal">Standard</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
              {/* Conversion Funnel chart */}
              <div className="lg:col-span-6 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Trial Conversion Funnel Drop-off</span>
                <div className="h-64 bg-slate-950 p-4 border border-slate-850 rounded-2xl flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <Funnel
                        dataKey="value"
                        data={conversionFunnelData}
                        isAnimationActive
                      >
                        {conversionFunnelData.map((entry, index) => (
                          <span key={index} style={{ color: entry.fill }} />
                        ))}
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1 text-[10px]">
                  <div className="font-bold text-slate-300">Drop-off Point Analysis:</div>
                  <p className="text-slate-500 leading-relaxed">Major onboarding drop-off happens between Step 2 and Step 3 (Gmail SMTP authorization). This is mitigated by the <strong>Skip Setup option</strong> and step guides.</p>
                </div>
              </div>

              {/* Line chart for DAU/WAU trends */}
              <div className="lg:col-span-6 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">User Growth Trends (DAU/WAU/MAU)</span>
                <div className="h-64 bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                      <Legend style={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="DAU" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="WAU" stroke="#818cf8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] pt-1">
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg">
                    <span className="text-slate-500 block text-[8px]">Session Duration Histogram</span>
                    <span className="font-bold text-white font-mono">18.4 minutes (Average)</span>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg">
                    <span className="text-slate-500 block text-[8px]">Churn Indicators Flagged</span>
                    <span className="font-bold text-amber-400 font-mono">4 Accounts (Low Activity)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features usage frequency */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Features Usage Frequency (Total Triggers)</span>
              <div className="h-60 bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={featuresUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 8, fontFamily: 'monospace' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* ========================== TAB 5: EMAIL AUTOMATION PREVIEW ========================== */}
        {activeTab === 'emails' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Email automation list */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Email Automation Engine</h3>
                  <p className="text-xs text-slate-400 font-mono">Select a template to verify content schemas and preview emails sent on stage triggers.</p>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'welcome', label: '1. Onboarding Welcome Email', trigger: 'Waitlist Approval / Direct Sign Up' },
                    { id: 'trial-started', label: '2. Free Trial Commencement', trigger: 'First Login Success' },
                    { id: 'trial-ending', label: '3. Trial Interval Nudge (2 hours)', trigger: '22 hours after sign up' },
                    { id: 'upgrade', label: '4. Growth Upgrade Confirmation', trigger: 'Cashfree Payment Settled' },
                    { id: 'feedback', label: '5. Beta User Opinion Request', trigger: '3 days active retention' },
                    { id: 'tips', label: '6. Weekly Scrape Delivery Tips', trigger: 'Every Monday morning' }
                  ].map((email) => {
                    const active = activeEmailTemplate === email.id;
                    return (
                      <button
                        key={email.id}
                        onClick={() => {
                          setActiveEmailTemplate(email.id as any);
                          setEmailPreviewOpen(true);
                        }}
                        className={`w-full text-left p-3 border rounded-xl flex flex-col transition cursor-pointer ${
                          active 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold' 
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <span className="text-xs font-semibold">{email.label}</span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">Trigger: {email.trigger}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Email Simulator Inbox */}
            <div className="lg:col-span-7">
              {emailPreviewOpen ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Live Email Inbox Simulator</span>
                    <button 
                      onClick={() => {
                        showToast(`Simulated dispatch to ${user?.email || 'user'}!`, 'success');
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Test Email
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white text-slate-900">
                    {/* Header values */}
                    <div className="bg-slate-100 p-4 space-y-1.5 border-b border-slate-200 text-xs text-slate-600 font-mono">
                      <div><strong>From:</strong> SalesPilot Team &lt;no-reply@salespilot.co&gt;</div>
                      <div><strong>To:</strong> {user?.fullName || 'Beta Candidate'} &lt;{user?.email || 'tester@gmail.com'}&gt;</div>
                      <div><strong>Subject:</strong> {currentEmail.subject}</div>
                    </div>
                    
                    {/* Email body */}
                    <div className="p-6 text-slate-800 font-sans text-xs leading-relaxed space-y-4 min-h-[220px] whitespace-pre-line">
                      {currentEmail.body}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                      SalesPilot Enterprise LLC, Bangalore, India &bull; Unsubscribe Preferences
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-slate-950 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center p-8 space-y-3 min-h-[350px]">
                  <Inbox className="w-12 h-12 text-slate-600 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-white">No Email Loaded</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">Select any automation email template on the left to review its raw formatting and trigger dispatch previews.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================== TAB 6: STABILITY & RELEASES ========================== */}
        {activeTab === 'stability' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Stability testing harness */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Stability unit testing runner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Stability & Testing Suite</span>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Run automated end-to-end integration checks. This simulates Jest testing units and Playwright regression checks across browsers, database tenancy limits, and API stress keys.
                </p>

                {isTesting ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono font-bold text-slate-300">
                      <span>Executing Tests...</span>
                      <span>{testProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${testProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={runStabilitySuite}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    <Play className="w-4 h-4" /> Run Stability Verification Suite
                  </button>
                )}

                {testResult !== 'IDLE' && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">Testing CLI Output Logs</span>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 font-mono text-[9px] text-slate-300 space-y-1 h-44 overflow-y-auto">
                      {testLogs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                  </div>
                )}
              </div>

              {/* Version Rollback & releases */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tenancy Disaster Rollback Manager</h3>
                  <p className="text-xs text-slate-400 font-mono">Simulate a root endpoint database rollback to restore the workspace to previous stable versions.</p>
                </div>

                <div className="flex gap-3 text-xs">
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex-1 text-center font-mono">
                    <span className="text-slate-500 block text-[8px]">Live Version</span>
                    <span className="font-bold text-white">v1.0.0-Beta</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex-1 text-center font-mono">
                    <span className="text-slate-500 block text-[8px]">Rollback target</span>
                    <span className="font-bold text-amber-500">v0.9.8-LTS</span>
                  </div>
                </div>

                {isRollingBack ? (
                  <button disabled className="w-full py-2 bg-slate-850 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Rolling Back Router...
                  </button>
                ) : (
                  <button 
                    onClick={triggerRollback}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/10"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Execute Rollback to v0.9.8
                  </button>
                )}

                {rollbackSimulationLogs.length > 0 && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-[9px] text-slate-400 leading-relaxed space-y-1">
                    {rollbackSimulationLogs.map((l, idx) => <div key={idx}>{l}</div>)}
                  </div>
                )}
              </div>

            </div>

            {/* Right Release notes & Documentation hub */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Release Notes */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 dark:border-slate-850 pb-2">Beta Changelog & Version History</span>
                
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl font-mono text-[10px] space-y-2.5 text-slate-300">
                  <div className="text-blue-400 font-bold">RELEASE v1.0.0 — Jul 21, 2026 (Public Beta)</div>
                  <p className="leading-relaxed pl-2">&bull; Added complete Beta Program Invites and waitlist approval schemas.</p>
                  <p className="leading-relaxed pl-2">&bull; Implemented step-by-step onboarding walkthrough guides and 1-click CRM seed loaders.</p>
                  <p className="leading-relaxed pl-2">&bull; Created automatic diagnostic log streams collecting session ID, latency, and client console exceptions.</p>
                  <p className="leading-relaxed pl-2">&bull; Connected automatic email previews for Welcome, Free Trial, and Invoice Upgrade sequences.</p>
                </div>
              </div>

              {/* Documentation Index searcher */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Searchable Beta Documentation Hub</h3>
                    <p className="text-xs text-slate-400 font-mono">Verify Troubleshooting manuals, admin guides, and known issue definitions.</p>
                  </div>
                  <input 
                    type="text"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search docs..."
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white max-w-[180px] focus:outline-none" 
                  />
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {docItems.map((doc, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10 uppercase">{doc.cat} Guide</span>
                        <span className="text-slate-500">Verified</span>
                      </div>
                      <h4 className="font-bold text-white mt-1">{doc.q}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed pt-0.5">{doc.a}</p>
                    </div>
                  ))}
                  {docItems.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs">No matching articles found.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* FLOATING LIVE CHAT SUPPORT WIDGET SIMULATOR */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-96 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-fade-in">
          {/* Widget header */}
          <div className="p-3 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold">Beta Support Live Chat</span>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-white/10 rounded text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-[10px] bg-slate-950/20">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-2.5 rounded-xl max-w-[85%] ${
                  msg.sender === 'bot' 
                    ? 'bg-slate-900 text-slate-300' 
                    : 'bg-indigo-600 text-white ml-auto text-right'
                }`}
              >
                <div>{msg.text}</div>
                <div className="text-[8px] text-slate-500 mt-1">{msg.time}</div>
              </div>
            ))}
            {chatResponding && (
              <div className="p-2 bg-slate-900 text-slate-500 rounded-xl max-w-[50%] animate-pulse font-mono">
                Assistant is typing...
              </div>
            )}
          </div>

          {/* Send Input */}
          <form onSubmit={handleSendChatMessage} className="p-2.5 border-t border-slate-800 bg-slate-900 flex gap-1.5">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask support assistant..." 
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none"
            />
            <button 
              type="submit" 
              className="p-1.5 bg-indigo-600 text-white rounded"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
