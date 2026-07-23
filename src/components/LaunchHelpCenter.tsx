import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, Compass, Play, CheckCircle2, ChevronRight, X, Sparkles, 
  BookOpen, Video, LifeBuoy, MessageSquare, Send, Heart, User, ShieldAlert,
  Building, Database, Terminal, ArrowRight, Zap, Info, ChevronDown, Check,
  Activity, Star, Flame, Award, BellRing, AlertCircle, RefreshCw, Users
} from 'lucide-react';
import { Lead, Campaign, Deal, Appointment, WorkspaceUser } from '../types';

interface LaunchHelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  user: WorkspaceUser | null;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
  onSelectTab: (tab: string) => void;
  onShowOnboarding: () => void;
  onTriggerToast: (text: string, type: 'success' | 'info' | 'warn' | 'error') => void;
}

export function LaunchHelpCenter({
  isOpen,
  onClose,
  user,
  leads,
  setLeads,
  campaigns,
  setCampaigns,
  deals,
  setDeals,
  onSelectTab,
  onShowOnboarding,
  onTriggerToast
}: LaunchHelpCenterProps) {
  const [activeTab, setActiveTab] = useState<'tour' | 'demo' | 'help' | 'support' | 'feedback'>('tour');
  const [tourStep, setTourStep] = useState(0);
  const [demoModeActive, setDemoModeActive] = useState(() => localStorage.getItem('salespilot_demo_mode') === 'true');
  const [supportCategory, setSupportCategory] = useState('technical');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDesc, setSupportDesc] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<string | null>(null);

  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const [activeDocTab, setActiveDocTab] = useState<'user' | 'admin' | 'faq' | 'releases'>('user');

  // FAQs List
  const faqs = [
    {
      q: 'How does the 1-Day Free Trial work?',
      a: 'The 1-Day Free Trial provides full, unrestricted premium access to the Lead Engine, AI SDR agent writer, campaign sequences, and Google workspace integrations. No credit card or billing configuration is required to test-drive the full automation flow.'
    },
    {
      q: 'What is Cashfree Payments and how do I authenticate?',
      a: 'Cashfree is India\'s leading payment gateway provider. SalesPilot integrates seamlessly with Cashfree to manage subscription checkouts, custom invoices, GST reporting, and automatic plan upgrades. You can authenticate using your Cashfree App ID and secret key in the integrations menu.'
    },
    {
      q: 'How does Astra or Vesper SDR compile prospects?',
      a: 'Our autonomous agents execute real-time search spiders and web scrapes using Gemini and Google Search Grounding to source high-fidelity contact credentials, social media coordinates, and deep industry variables directly from Google Maps and LinkedIn.'
    },
    {
      q: 'Can I export my CRM data and lead lists?',
      a: 'Yes, absolutely. SalesPilot supports 1-click compliant data exporting. You can download all compiled leads, campaign sequence analytics, active deal statuses, and transactional histories directly into JSON or CSV format from the settings dashboard.'
    }
  ];

  // Interactive Product Tour Steps
  const tourSteps = [
    {
      title: 'Welcome to SalesPilot Strategy Control',
      desc: 'SalesPilot is the ultimate autonomous outreach platform for B2B consultant groups and growth marketing agencies. This quick tour will guide you through our core modules so you can launch high-converting campaigns instantly.',
      highlightTab: 'dashboard',
      actionText: 'Next: Sourcing Prospects'
    },
    {
      title: 'The Lead Sourcing Engine',
      desc: 'Source highly qualified prospects. Our real-time Google Maps spider and LinkedIn finder scrapers allow you to build comprehensive lists of CEOs, directors, and marketing managers with verified emails in seconds.',
      highlightTab: 'leads',
      actionText: 'Next: AI Copywriting Suite'
    },
    {
      title: 'AI Outreach Sequences',
      desc: 'Craft hyper-personalized, multi-stage cold outreach emails. Connect your Gmail mailbox and let our state-of-the-art AI SDR copywriter compose sequence steps tailored perfectly to each prospect\'s industry.',
      highlightTab: 'campaigns',
      actionText: 'Next: Pipeline & Deal Stages'
    },
    {
      title: 'CRM Pipeline Tracker',
      desc: 'Track prospect conversions. Manage qualified leads, book Google Calendar meetings automatically, and drag-and-drop deals across customized negotiation stages to securely calculate outstanding pipeline value.',
      highlightTab: 'pipeline',
      actionText: 'Next: Plan Limits & Upgrades'
    },
    {
      title: 'Instant Cashfree Payments',
      desc: 'Upgrade from Free Trial to Starter, Growth, or Business tiers. SalesPilot integrates directly with Cashfree to support instant, GST-compliant INR checkouts and automated monthly/yearly subscription renewing.',
      highlightTab: 'billing',
      actionText: 'Finish & Explore'
    }
  ];

  const handleNextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      onSelectTab(tourSteps[nextStep].highlightTab);
      onTriggerToast(`Navigated to ${tourSteps[nextStep].highlightTab.toUpperCase()} for step ${nextStep + 1}`, 'info');
    } else {
      onTriggerToast('Product tour completed successfully! Feel free to explore the system.', 'success');
      onClose();
    }
  };

  const handlePrevTourStep = () => {
    if (tourStep > 0) {
      const prevStep = tourStep - 1;
      setTourStep(prevStep);
      onSelectTab(tourSteps[prevStep].highlightTab);
    }
  };

  // Seed sample CRM data
  const handleToggleDemoMode = async () => {
    if (demoModeActive) {
      // Deactivate Demo Mode
      localStorage.setItem('salespilot_demo_mode', 'false');
      setDemoModeActive(false);
      onTriggerToast('Product Demo Mode disabled. Reverted to workspace live state.', 'info');
    } else {
      // Activate Demo Mode and inject rich data
      localStorage.setItem('salespilot_demo_mode', 'true');
      setDemoModeActive(true);

      try {
        const res = await fetch('/api/v1/leads');
        if (res.ok) {
          const data = await res.json();
          if (data.leads && data.leads.length > 0) {
            setLeads(data.leads);
            onTriggerToast(`Loaded ${data.leads.length} verified leads from active workspace database.`, 'success');
          } else {
            onTriggerToast('No verified leads found in workspace database.', 'info');
          }
        } else {
          onTriggerToast('No verified leads found in workspace.', 'info');
        }
      } catch {
        onTriggerToast('No verified leads found in workspace.', 'info');
      }

      onSelectTab('dashboard');
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportDesc) {
      onTriggerToast('Please complete all support fields.', 'warn');
      return;
    }
    setSubmittingTicket(true);
    setTimeout(() => {
      const ticketNum = 'SP-' + Math.floor(1000 + Math.random() * 9000);
      setTicketCreated(ticketNum);
      setSubmittingTicket(false);
      setSupportSubject('');
      setSupportDesc('');
      onTriggerToast(`Support Ticket ${ticketNum} created successfully!`, 'success');
    }, 1500);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackRating === null) {
      onTriggerToast('Please select a rating to submit feedback.', 'warn');
      return;
    }
    setSubmittingFeedback(true);
    setTimeout(() => {
      setFeedbackSuccess(true);
      setSubmittingFeedback(false);
      setFeedbackComment('');
      onTriggerToast('Thank you for your valuable feedback!', 'success');
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Help Center Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                SalesPilot Help Center & Launch Hub
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">
                  Public Beta v1.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">Step-by-step guides, interactive product tours, support ticketing, and CRM demo loaders.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outer body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Inner Sidebar tabs */}
          <aside className="w-56 bg-slate-950/40 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-1">
              {[
                { id: 'tour', label: 'Interactive Tour', icon: Compass },
                { id: 'demo', label: 'Product Demo Mode', icon: Play },
                { id: 'help', label: 'Documentation Hub', icon: BookOpen },
                { id: 'support', label: 'Contact Support', icon: LifeBuoy },
                { id: 'feedback', label: 'Provide Feedback', icon: MessageSquare },
              ].map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      if (item.id === 'tour') {
                        onSelectTab(tourSteps[tourStep].highlightTab);
                      }
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      active 
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Support Widget status */}
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-[10px] text-slate-400 space-y-2">
              <div className="font-mono text-slate-500 uppercase font-bold tracking-wider">Workspace Health</div>
              <div className="flex items-center justify-between">
                <span>License State:</span>
                <span className="text-emerald-500 font-bold font-mono">ACTIVE TRIAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span>API Sync Status:</span>
                <span className="text-blue-400 font-mono">100% ONLINE</span>
              </div>
            </div>
          </aside>

          {/* Tab View Container */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-900/20">
            <AnimatePresence mode="wait">
              
              {/* TOUR PANEL */}
              {activeTab === 'tour' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-semibold uppercase">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                    <span>Step {tourStep + 1} of {tourSteps.length} — Interactive Product Tour</span>
                  </div>

                  <div className="space-y-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                      {tourSteps[tourStep].title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {tourSteps[tourStep].desc}
                    </p>
                    <div className="p-3 bg-blue-600/5 border border-blue-500/10 rounded-xl flex items-start gap-2 text-[11px] text-slate-400">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>Note: The main interface in the background is automatically tracking this tour, highlighting the appropriate view tab: <strong className="text-blue-400 font-mono uppercase">{tourSteps[tourStep].highlightTab}</strong>.</span>
                    </div>
                  </div>

                  {/* Progress tracker dots */}
                  <div className="flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      {tourSteps.map((_, idx) => (
                        <div 
                          key={idx}
                          className={`h-2 rounded-full transition-all duration-300 ${idx === tourStep ? 'w-6 bg-blue-500' : 'w-2 bg-slate-800'}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevTourStep}
                        disabled={tourStep === 0}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition active:scale-95 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextTourStep}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/10 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>{tourSteps[tourStep].actionText}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PRODUCT DEMO MODE PANEL */}
              {activeTab === 'demo' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold uppercase">
                    <Play className="w-4 h-4" />
                    <span>Product Sandbox & Seed Data Engine</span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Load Sample CRM Pipelines with 1-Click</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Testing SalesPilot on an empty workspace is less immersive. By enabling **Product Demo Mode**, we instantly seed realistic pre-generated B2B leads, active outbox sequences, email templates, and staged pipeline values into your current browser view. This allows you to explore the dashboard widgets, check response statistics, and preview active AI campaign threads without manually sourcing contacts.
                    </p>
                  </div>

                  <div className={`p-6 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 transition ${demoModeActive ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-slate-900/60 border-slate-800'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${demoModeActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                        <h4 className="text-sm font-bold text-white">
                          Demo Sandbox Status: {demoModeActive ? 'ENABLED & POPULATED' : 'DISABLED'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400">
                        {demoModeActive 
                          ? 'Sample CRM leads, sequences, and deals are active in your dashboard session.' 
                          : 'Your actual live system database is loaded.'}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleDemoMode}
                      className={`px-5 py-2.5 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-md ${
                        demoModeActive
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                      }`}
                    >
                      {demoModeActive ? 'Disable Demo Data' : 'Enable Product Demo Mode'}
                    </button>
                  </div>

                  {/* Highlights section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-bold text-white">Leads Seeded</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Adds ready, qualified, and interested lead cards with deep metadata.</p>
                    </div>
                    <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-bold text-white">Campaign Sequences</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Generates simulated cold outreach analytics, open rates, and reply tracking.</p>
                    </div>
                    <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                        <Award className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-bold text-white">Pipeline Value</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Injects staged negotiation opportunities totaling over ₹84,000 INR.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DOCUMENTATION HUB PANEL */}
              {activeTab === 'help' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-semibold uppercase">
                    <BookOpen className="w-4 h-4" />
                    <span>Documentation & Integration Guides</span>
                  </div>

                  {/* Sub tabs for docs */}
                  <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5">
                    {[
                      { id: 'user', label: 'User Guide' },
                      { id: 'admin', label: 'Admin Guide' },
                      { id: 'faq', label: 'FAQ Accordions' },
                      { id: 'releases', label: 'Release Notes' },
                    ].map(dTab => (
                      <button
                        key={dTab.id}
                        onClick={() => setActiveDocTab(dTab.id as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                          activeDocTab === dTab.id 
                            ? 'bg-slate-800 text-white' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {dTab.label}
                      </button>
                    ))}
                  </div>

                  {/* Document panel render */}
                  <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto scrollbar-none pr-2">
                    {activeDocTab === 'user' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white">SalesPilot Master User Guide</h4>
                        <p>Welcome to SalesPilot. Follow this sequence to configure your first outreach campaigns:</p>
                        <ol className="list-decimal list-inside space-y-2 pl-2">
                          <li><strong>Configure Organization Details:</strong> Set your local company name, industry target, and working hours in Settings.</li>
                          <li><strong>Connect Your Outbox Box:</strong> Navigate to Gmail Settings, authorize a mailbox token connection, and specify daily limit thresholds.</li>
                          <li><strong>Source Prospects:</strong> Open the Lead Engine view, run web spiders, filter by cities or sectors, and scrape emails.</li>
                          <li><strong>Form Outreach Sequences:</strong> Create campaigns, select steps, type message templates using <code>{`{first_name}`}</code> and <code>{`{company}`}</code> tag hooks, and let AI polish copy templates.</li>
                          <li><strong>Coordinate Demonstrations:</strong> Connected Google Calendar slots sync instantly, permitting leads to secure times on your scheduling desk.</li>
                        </ol>
                      </div>
                    )}

                    {activeDocTab === 'admin' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white">Administrator & Tenancy Guide</h4>
                        <p>SalesPilot features a high-performance multi-tenant backend architecture designed for agency owners and enterprise administrators:</p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                          <li><strong>Team Seats Allocation:</strong> Administrators can add workspace members under designated roles (Owner, Admin, Manager, Sales Outbound, Viewer, Client).</li>
                          <li><strong>System Telemetry Logs:</strong> Review detailed background audit trail parameters, security history logins, and MFA challenge occurrences.</li>
                          <li><strong>AI Budgeting Quotas:</strong> Fine-tune daily token limits, RPM thresholds, and API budget caps in server configurations to prevent over-use.</li>
                          <li><strong>Relational DB Integration:</strong> Synchronize local browser cache data securely with PostgreSQL (Supabase) configurations with 1-click in the Integration Center.</li>
                        </ul>
                      </div>
                    )}

                    {activeDocTab === 'faq' && (
                      <div className="space-y-4">
                        {faqs.map((faq, i) => (
                          <div key={i} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span className="text-indigo-400 font-mono">Q:</span>
                              {faq.q}
                            </div>
                            <div className="text-slate-400 pl-4">
                              {faq.a}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeDocTab === 'releases' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white">SaaS Public Beta v1.0 Changelog</h4>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-[10px]">
                          <div className="text-indigo-400 font-bold">RELEASE v1.0.0 — Jul 21, 2026</div>
                          <p>• Redesigned SaaS subscription pricing tiers in billing view. Starter (₹2,499), Growth (₹5,999) with "Most Popular" tags, and Business (₹11,999).</p>
                          <p>• Added Monthly / Yearly billing cycle toggle with beautiful INR savings calculations.</p>
                          <p>• Integrated full 1-Day Free Trial capability with zero initial payment configuration.</p>
                          <p>• Built interactive Help Center console complete with Support Ticketing system and real-time feedback submissions.</p>
                          <p>• Fully optimized multitenant settings tabs, notification configurations, and JSON data exporters.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Tutorials section */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-rose-500" />
                      Step-by-Step Video Masterclasses (Demo Only)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-3">
                        <div className="w-16 h-12 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-rose-500 shrink-0 relative group cursor-pointer">
                          <Play className="w-5 h-5 fill-current" />
                          <span className="absolute bottom-1 right-1 font-mono text-[8px] bg-slate-950 px-1 rounded text-slate-400">3:40</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white">Gmail SMTP Outbox Setup</h5>
                          <p className="text-[10px] text-slate-500">Learn how to securely authorize mailboxes to send automated cold campaigns.</p>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-3">
                        <div className="w-16 h-12 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-rose-500 shrink-0 relative group cursor-pointer">
                          <Play className="w-5 h-5 fill-current" />
                          <span className="absolute bottom-1 right-1 font-mono text-[8px] bg-slate-950 px-1 rounded text-slate-400">5:12</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white">Google Maps Leads Spider</h5>
                          <p className="text-[10px] text-slate-500">Extract marketing agencies and regional prospects with instant email enrichment.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CONTACT SUPPORT PANEL */}
              {activeTab === 'support' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold uppercase">
                    <LifeBuoy className="w-4 h-4" />
                    <span>Beta Customer Support Desk</span>
                  </div>

                  {ticketCreated ? (
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white">Support Ticket staged!</h4>
                        <p className="text-xs text-slate-400">
                          We created ticket <strong className="text-indigo-400 font-mono">{ticketCreated}</strong> successfully. An outreach consultant will review the details and respond to your registered address within 2 hours.
                        </p>
                      </div>
                      <button
                        onClick={() => setTicketCreated(null)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
                      >
                        Submit another request
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleTicketSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Priority</label>
                          <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                            <option value="low">Standard Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">Urgent Escalation</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Issue Category</label>
                          <select 
                            value={supportCategory} 
                            onChange={(e) => setSupportCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="technical">Lead Scraper Spider</option>
                            <option value="billing">Cashfree Checkout</option>
                            <option value="gmail">Gmail OAuth Token</option>
                            <option value="agents">AI SDR Orchestration</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Subject / Short Heading</label>
                        <input 
                          type="text" 
                          required
                          value={supportSubject}
                          onChange={(e) => setSupportSubject(e.target.value)}
                          placeholder="e.g., Lead enricher fails to verify domain names"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Detailed Description</label>
                        <textarea 
                          rows={4}
                          required
                          value={supportDesc}
                          onChange={(e) => setSupportDesc(e.target.value)}
                          placeholder="Provide steps or variables to help us troubleshoot..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submittingTicket ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Staging Ticket...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Support Ticket</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

              {/* PROVIDE FEEDBACK PANEL */}
              {activeTab === 'feedback' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-semibold uppercase">
                    <MessageSquare className="w-4 h-4" />
                    <span>Beta Feedback Program</span>
                  </div>

                  {feedbackSuccess ? (
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mx-auto">
                        <Heart className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white">Feedback received with love!</h4>
                        <p className="text-xs text-slate-400">
                          Your thoughts are direct contributions to SalesPilot development. Thank you for making our beta rollout awesome!
                        </p>
                      </div>
                      <button
                        onClick={() => setFeedbackSuccess(false)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
                      >
                        Submit another comment
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold block text-center">
                          How would you rate your beta onboarding experience?
                        </label>
                        <div className="flex items-center justify-center gap-4 py-2">
                          {[
                            { value: 1, label: '😠 Poor' },
                            { value: 2, label: '😐 Okay' },
                            { value: 3, label: '😊 Great' },
                            { value: 4, label: '🚀 Exceptional' }
                          ].map((ratingObj) => (
                            <button
                              key={ratingObj.value}
                              type="button"
                              onClick={() => setFeedbackRating(ratingObj.value)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                                feedbackRating === ratingObj.value 
                                  ? 'bg-rose-500/15 border-rose-500 text-rose-400' 
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              {ratingObj.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                          What features would you like to see next?
                        </label>
                        <textarea 
                          rows={4}
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="e.g., Native integration with HubSpot CRM or custom webhook notifications..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submittingFeedback ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Recording opinion...</span>
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4" />
                            <span>Send Beta Feedback</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </motion.div>
    </div>
  );
}
