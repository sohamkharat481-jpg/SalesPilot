/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Layers, Users, Award, Calendar, CreditCard, 
  Settings, Loader2, LogOut, Check, ChevronRight, ChevronLeft, Menu, X, ArrowUpRight, ShieldAlert,
  Bell, Search, Bot, FileText, TrendingUp, Sun, Moon, Clock, Activity, Send, Briefcase, ShieldCheck,
  Rocket, Building2, Terminal, HelpCircle, PhoneCall, Smartphone, Globe, Lock
} from 'lucide-react';
import { Lead, Campaign, Deal, Appointment, IntegrationCredentials, 
  WorkspaceUser, SubscriptionTier, DealStage, SequenceStep 
 } from './types';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { CampaignsView } from './components/CampaignsView';
import { PipelineView } from './components/PipelineView';
import { SchedulerView } from './components/SchedulerView';
import { BillingView } from './components/BillingView';
import { IntegrationsView } from './components/IntegrationsView';
import { OutreachView } from './components/OutreachView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { AiAgentsView } from './components/AiAgentsView';
import { OpenAiSuiteView } from './components/OpenAiSuiteView';
import { ClientPortalView } from './components/ClientPortalView';
import { SuperAdminView } from './components/SuperAdminView';
import { LaunchCenterView } from './components/LaunchCenterView';
import WorkspaceView from './components/WorkspaceView';
import { useAuth } from './authentication/AuthContext';
import { AuthView } from './components/AuthView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { AutomationView } from './components/AutomationView';
import { DeveloperPortalView } from './components/DeveloperPortalView';
import { LaunchHelpCenter } from './components/LaunchHelpCenter';
import { VoiceCallingView } from './components/VoiceCallingView';
import { MobileHubView } from './components/MobileHubView';
import { WhiteLabelView } from './components/WhiteLabelView';
import { EnterpriseSecurityView } from './components/EnterpriseSecurityView';
import { RevenueIntelligenceView } from './components/RevenueIntelligenceView';
import { MarketplaceView } from './components/MarketplaceView';
import { ComplianceView } from './components/ComplianceView';
import { BetaProgramView } from './components/BetaProgramView';

function RestrictedViewPlaceholder({ 
  title, 
  description, 
  icon: Icon, 
  onResumeSetup 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  onResumeSetup: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 max-w-md mx-auto text-center space-y-6 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-slate-900 border border-amber-100 dark:border-slate-800 flex items-center justify-center text-amber-500 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title} Integration Required</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      <button
        onClick={onResumeSetup}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
        Connect in Setup Wizard
      </button>
    </div>
  );
}

export default function App() {
  const { user, logout, isLoading: authLoading, isSandbox } = useAuth();

  const isFounderUser = Boolean(
    user && (
      user.isFounder ||
      user.subscriptionStatus === 'LIFETIME' ||
      user.tier === 'ENTERPRISE' ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'OWNER' ||
      (user.email && (
        user.email.toLowerCase() === 'sohamkharat481@gmail.com' ||
        user.email.toLowerCase() === 'soham@gmail.com' ||
        user.email.toLowerCase().includes('founder') ||
        user.email.toLowerCase().includes('soham')
      ))
    )
  );

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState(() => {
    const saved = localStorage.getItem('salespilot_trial_time');
    return saved ? parseInt(saved, 10) : 86400; // 24 hours in seconds
  });
  const [trialActive, setTrialActive] = useState(() => {
    const saved = localStorage.getItem('salespilot_trial_active');
    return saved === null ? true : saved === 'true';
  });

  // Simulated 1-Day Trial countdown interval timer (bypassed for Founder accounts)
  useEffect(() => {
    if (isFounderUser) return; // Founder accounts completely bypass trial timer
    if (!trialActive || trialTimeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTrialTimeRemaining(prev => {
        const next = prev - 1;
        localStorage.setItem('salespilot_trial_time', String(next));
        if (next <= 0) {
          clearInterval(interval);
          setTrialActive(false);
          localStorage.setItem('salespilot_trial_active', 'false');
          // Automatically trigger redirect to billing
          setActiveTab('billing');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFounderUser, trialActive, trialTimeRemaining]);

  const formatTrialTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationCredentials>({});
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  
  // Custom SaaS Layout Specs
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingRightPanel, setIsResizingRightPanel] = useState(false);

  // Right Panel AI Chat
  const [aiChatMessages, setAiChatMessages] = useState<Array<{id: string; sender: 'user' | 'bot'; text: string; time: string}>>([
    { id: 'm1', sender: 'bot', text: 'Welcome to SalesPilot strategy control. I am your specialized AI Agent. Let me help you write sequences, find leads, or review your pipeline metrics!', time: 'Just now' }
  ]);
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([
    'Research Indian marketing agencies response rates',
    'Write a cold follow-up sequence for IT staff',
    'Compile pipeline health review'
  ]);
  
  const [notifications, setNotifications] = useState([
    { id: 'not-1', text: 'Lead "Rajesh Kumar" status advanced to QUALIFIED', time: '10 mins ago', read: false },
    { id: 'not-2', text: 'Astra Agent scanned 15 new SaaS profiles in Chennai', time: '1 hr ago', read: false },
    { id: 'not-3', text: 'Vesper Agent generated 4 personalized email copies', time: '3 hrs ago', read: true },
    { id: 'not-4', text: 'Google Meet reservation confirmed with Soham', time: '1 day ago', read: true }
  ]);

  const [activities, setActivities] = useState([
    { id: 'act-1', text: 'Soham Kharat logged into enterprise workspace', time: 'Just now', icon: 'Users', color: 'text-blue-500' },
    { id: 'act-2', text: 'Astra Prospector scraped 12 marketing agencies', time: '15 mins ago', icon: 'Bot', color: 'text-purple-500' },
    { id: 'act-3', text: 'New lead "Preeti Sen" added manually', time: '1 hr ago', icon: 'Users', color: 'text-emerald-500' },
    { id: 'act-4', text: 'Campaign "Growth Outbound July" active sequence updated', time: '2 hrs ago', icon: 'Sparkles', color: 'text-amber-500' }
  ]);

  // Redirect non-subscribers/non-founders to billing immediately
  useEffect(() => {
    if (isFounderUser) return; // Founder accounts bypass all billing redirects
    if (user && !user.isFounder && user.subscriptionStatus !== 'ACTIVE' && user.subscriptionStatus !== 'TRIAL' && !trialActive) {
      if (activeTab !== 'billing') {
        setActiveTab('billing');
      }
    }
  }, [isFounderUser, user, activeTab, trialActive]);

  // Synchronize Dark Mode on Document Element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Handle Dragging / Resizing controls for Sidebar & Right Panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(160, Math.min(360, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isResizingRightPanel) {
        const newWidth = Math.max(240, Math.min(480, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingRightPanel(false);
    };

    if (isResizingSidebar || isResizingRightPanel) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingRightPanel]);

  // Load initial data from Express Server
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [leadsRes, campsRes, dealsRes, aptsRes, configRes, notRes, actRes] = await Promise.all([
          fetch('/api/v1/leads'),
          fetch('/api/v1/campaigns'),
          fetch('/api/v1/deals'),
          fetch('/api/v1/appointments'),
          fetch('/api/v1/integrations'),
          fetch('/api/v1/dashboard/notifications').catch(() => null),
          fetch('/api/v1/dashboard/activities').catch(() => null)
        ]);

        const leadsData = await leadsRes.json();
        const campsData = await campsRes.json();
        const dealsData = await dealsRes.json();
        const aptsData = await aptsRes.json();
        const configData = await configRes.json();

        setLeads(leadsData.leads);
        setCampaigns(campsData.campaigns);
        setDeals(dealsData.deals);
        setAppointments(aptsData.appointments);
        setIntegrations(configData.integrations);

        if (notRes) {
          const notData = await notRes.json();
          if (notData.success && notData.notifications) {
            setNotifications(notData.notifications);
          }
        }

        if (actRes) {
          const actData = await actRes.json();
          if (actData.success && actData.activities) {
            setActivities(actData.activities.map((a: any) => ({
              id: a.id,
              text: a.text,
              time: a.time,
              icon: a.type === 'LEAD_CREATED' ? 'Users' : a.type === 'MEETING_BOOKED' ? 'Calendar' : 'Activity',
              color: a.type === 'MEETING_BOOKED' ? 'text-emerald-500' : 'text-blue-500'
            })));
          }
        }
      } catch (err) {
        console.error('Failed to preload live SalesPilot records:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Real Lead addition handler
  const handleAddLead = async (leadData: Partial<Lead>) => {
    if (user?.role === 'VIEWER') {
      alert('Permission Denied: Read-only Viewer permissions active.');
      return;
    }
    try {
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      const newLead = await response.json();
      setLeads(prev => [newLead, ...prev]);
      
      // Telemetry log and notification push
      setActivities(prev => [{ id: `act-${Date.now()}`, text: `Lead "${newLead.fullName}" created manually.`, time: 'Just now', icon: 'Users', color: 'text-emerald-500' }, ...prev]);
      setNotifications(prev => [{ id: `not-${Date.now()}`, text: `New lead "${newLead.fullName}" added.`, time: 'Just now', read: false }, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  // Real Lead enrich handler (using server Gemini)
  const handleEnrichLead = async (leadId: string) => {
    if (user?.role === 'VIEWER') {
      alert('Permission Denied: Read-only Viewer permissions active.');
      return;
    }
    try {
      const response = await fetch(`/api/v1/leads/${leadId}/enrich`, {
        method: 'POST'
      });
      const updatedLead = await response.json();
      setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));

      // Telemetry log and notification push
      setActivities(prev => [{ id: `act-${Date.now()}`, text: `Lead "${updatedLead.fullName}" enriched via Gemini AI.`, time: 'Just now', icon: 'Bot', color: 'text-cyan-500' }, ...prev]);
      setNotifications(prev => [{ id: `not-${Date.now()}`, text: `Gemini enriched lead "${updatedLead.fullName}".`, time: 'Just now', read: false }, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  // Real Campaign Addition
  const handleAddCampaign = async (campaignData: Partial<Campaign>) => {
    if (user?.role === 'VIEWER' || user?.role === 'SALES') {
      alert('Permission Denied: Campaign management is restricted to Admin & Manager roles.');
      return;
    }
    try {
      const response = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      const newCamp = await response.json();
      setCampaigns(prev => [newCamp, ...prev]);

      // Telemetry log and notification push
      setActivities(prev => [{ id: `act-${Date.now()}`, text: `Campaign "${newCamp.name}" successfully created.`, time: 'Just now', icon: 'Sparkles', color: 'text-blue-500' }, ...prev]);
      setNotifications(prev => [{ id: `not-${Date.now()}`, text: `Campaign "${newCamp.name}" launched.`, time: 'Just now', read: false }, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  // Real AI Sequence Generator (using server Gemini)
  const handleGenerateAISequence = async (campaignName: string, targetAudience: string) => {
    if (user?.role === 'VIEWER' || user?.role === 'SALES') {
      alert('Permission Denied: Campaign management is restricted to Admin & Manager roles.');
      return [];
    }
    try {
      const response = await fetch('/api/v1/ai/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignName, targetAudience })
      });
      const data = await response.json();
      
      // Telemetry log
      setActivities(prev => [{ id: `act-${Date.now()}`, text: `AI sequence generated for "${campaignName}".`, time: 'Just now', icon: 'Bot', color: 'text-purple-500' }, ...prev]);
      
      return data.steps || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Real Deal Stage Update
  const handleUpdateDealStage = async (dealId: string, stage: DealStage) => {
    if (user?.role === 'VIEWER') {
      alert('Permission Denied: Read-only Viewer permissions active.');
      return;
    }
    try {
      const response = await fetch(`/api/v1/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage })
      });
      const updatedDeal = await response.json();
      setDeals(prev => prev.map(d => d.id === dealId ? updatedDeal : d));

      // Telemetry log and notification push
      setActivities(prev => [{ id: `act-${Date.now()}`, text: `Deal stage advanced to ${stage}.`, time: 'Just now', icon: 'Award', color: 'text-indigo-500' }, ...prev]);
      setNotifications(prev => [{ id: `not-${Date.now()}`, text: `Deal stage advanced to ${stage}.`, time: 'Just now', read: false }, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  // Real Meeting Booking Linker
  const handleBookMeeting = async (leadId: string, dateTime: string, notes: string) => {
    if (user?.role === 'VIEWER') {
      alert('Permission Denied: Read-only Viewer permissions active.');
      return;
    }
    try {
      const response = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, dateTime, notes })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to book meeting');
      }

      const newApt = await response.json();
      setAppointments(prev => [newApt, ...prev]);
      
      // Since booking automatically changes Lead status to contacted, refresh leads as well
      const updatedLead = leads.find(l => l.id === leadId);
      if (updatedLead) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'CONTACTED' } : l));
        
        // Also automatically spin up a deal pipeline card representing this booked demo!
        const dealResponse = await fetch('/api/v1/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, valueInr: 50000, stage: 'DEMO_SCHEDULED', notes: `Demo scheduled via booking link. Link: ${newApt.meetingLink}` })
        });
        const newDeal = await dealResponse.json();
        setDeals(prev => [...prev, newDeal]);

        // Telemetry log and notification push
        setActivities(prev => [{ id: `act-${Date.now()}`, text: `Google Meet scheduled with ${updatedLead.fullName}.`, time: 'Just now', icon: 'Calendar', color: 'text-emerald-500' }, ...prev]);
        setNotifications(prev => [{ id: `not-${Date.now()}`, text: `Meeting scheduled with ${updatedLead.fullName}.`, time: 'Just now', read: false }, ...prev]);
      }
      return newApt;
    } catch (err: any) {
      console.error('Booking failed:', err);
      throw err;
    }
  };

  // Real Credentials Integrations Saver
  const handleSaveCredentials = async (creds: Partial<IntegrationCredentials>) => {
    if (user?.role !== 'ADMIN') {
      alert('Permission Denied: Settings configuration is restricted to Workspace Admin.');
      return;
    }
    try {
      const response = await fetch('/api/v1/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await response.json();
      setIntegrations(data.integrations);
    } catch (err) {
      console.error(err);
    }
  };

  // Tier billing updater
  const handleUpdateTier = (newTier: SubscriptionTier) => {
    if (user) {
      user.tier = newTier; // Mutate locally for instant visual feedback
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-mono text-slate-500">Authenticating SalesPilot session...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (isFounderUser) {
    if (!user.isFounder || !user.companyName || user.subscriptionStatus !== 'LIFETIME' || user.tier !== 'ENTERPRISE') {
      console.log("Founder detected. Enforcing lifetime access and skipping onboarding.");
      user.isFounder = true;
      user.companyName = user.companyName || 'SalesPilot';
      user.subscriptionStatus = 'LIFETIME';
      user.tier = 'ENTERPRISE';
      user.onboardingCompleted = true;
    }
  }

  if (user && !user.companyName && !user.onboardingCompleted) {
    return (
      <OnboardingWizard 
        user={user} 
        onComplete={(orgData) => {
          user.companyName = orgData.companyName;
          user.industry = orgData.industry;
          user.onboardingCompleted = true;
          // Force state update to trigger re-render
          setLeads([...leads]);
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-mono text-slate-500">Compiling sleek layout & seed records...</p>
      </div>
    );
  }

  const checkIntegration = (id: 'gmail' | 'calendar' | 'ai' | 'cashfree') => {
    if (!user?.onboardingProgress) return true; // Existing or legacy users are completely unrestricted
    
    if (id === 'gmail') {
      return user.onboardingProgress.find((s: any) => s.id === 'gmail')?.status === 'COMPLETED';
    }
    if (id === 'calendar') {
      return user.onboardingProgress.find((s: any) => s.id === 'calendar')?.status === 'COMPLETED';
    }
    if (id === 'ai') {
      return user.onboardingProgress.find((s: any) => s.id === 'openai')?.status === 'COMPLETED' || 
             user.onboardingProgress.find((s: any) => s.id === 'gemini')?.status === 'COMPLETED';
    }
    if (id === 'cashfree') {
      return user.onboardingProgress.find((s: any) => s.id === 'cashfree')?.status === 'COMPLETED';
    }
    return true;
  };

  const isSubscriber = isFounderUser || user?.isFounder || user?.subscriptionStatus === 'ACTIVE' || user?.subscriptionStatus === 'LIFETIME' || user?.subscriptionStatus === 'TRIAL' || trialActive;

  const navItems = isSubscriber ? [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'leads', label: 'Lead Engine', icon: Users, badge: leads.length },
    { id: 'openai-suite', label: 'Research', icon: Sparkles },
    { id: 'campaigns', label: 'Campaigns', icon: Sparkles },
    { id: 'automation', label: 'Workflows', icon: Activity },
    { id: 'outreach', label: 'Outreach', icon: Send },
    { id: 'scheduler', label: 'Appointments', icon: Calendar, badge: appointments.filter(a => a.status === 'SCHEDULED').length },
    { id: 'pipeline', label: 'CRM', icon: Award },
    { id: 'voice-calling', label: 'AI Voice Calling', icon: PhoneCall },
    { id: 'mobile-app', label: 'Mobile Workspace', icon: Smartphone },
    { id: 'ai-agents', label: 'AI Agents', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Settings },
    { id: 'developer-portal', label: 'API & Developer Hub', icon: Terminal },
    { id: 'revenue-intelligence', label: 'AI Revenue Intel', icon: Sparkles },
    { id: 'marketplace', label: 'App Marketplace', icon: Layers },
    { id: 'white-label', label: 'White Labeling', icon: Globe },
    { id: 'enterprise-security', label: 'Enterprise Security', icon: Lock },
    { id: 'compliance', label: 'Compliance Center', icon: ShieldCheck },
    { id: 'beta-program', label: 'Beta Control Center', icon: Rocket },
    { id: 'launch-center', label: 'Enterprise Launch', icon: Rocket },
    { id: 'workspace', label: 'Workspace Hub', icon: Building2 },
    { id: 'client-portal', label: 'Client Portal', icon: Briefcase },
    ...((user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') ? [{ id: 'super-admin', label: 'Admin (Owner Only)', icon: ShieldCheck }] : [])
  ] : [
    { id: 'billing', label: 'Pricing & Plans', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      
      {/* 1-Day Trial Status Banner Alert - Bypassed for Founder Accounts */}
      {!isFounderUser && (
        trialActive ? (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white px-6 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse shrink-0" />
              <span>
                <strong>1-Day Free Trial (Active):</strong> Full feature access is unlocked. Connect Gmail and CRM to execute your outbound AI-SDR campaigns.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 px-2.5 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide border border-white/20">
                ⏰ {formatTrialTime(trialTimeRemaining)} remaining
              </div>
              <button 
                onClick={() => setActiveTab('billing')}
                className="px-3 py-1 bg-white text-blue-700 hover:bg-slate-50 font-bold rounded font-sans text-[10px] transition cursor-pointer"
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => {
                  setTrialTimeRemaining(0);
                  setTrialActive(false);
                  localStorage.setItem('salespilot_trial_active', 'false');
                  localStorage.setItem('salespilot_trial_time', '0');
                  setActiveTab('billing');
                  alert("Trial has been ended. Secure subscription status to continue workspace access.");
                }}
                className="text-white/70 hover:text-white underline font-mono text-[9px] cursor-pointer"
                title="Instantly expire trial to test checkout redirect and upgrade flow"
              >
                Test Expiry Redirect
              </button>
            </div>
          </div>
        ) : (
          localStorage.getItem('salespilot_trial_time') === '0' && (
            <div className="bg-red-600 text-white px-6 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2 font-mono">
                <ShieldAlert className="w-4 h-4 text-red-200 animate-bounce shrink-0" />
                <span>
                  <strong>Your 1-Day Free Trial has expired!</strong> Workspace features are locked. Secure a Subscription Plan via Cashfree gateway to resume campaign scheduling.
                </span>
              </div>
              <button 
                onClick={() => setActiveTab('billing')}
                className="px-4 py-1.5 bg-white text-red-700 hover:bg-slate-50 font-bold rounded-xl font-sans text-xs shadow-md shadow-red-950/25 transition cursor-pointer animate-pulse"
              >
                Upgrade & Reactivate Workspace
              </button>
            </div>
          )
        )
      )}
      
      {/* Top Header bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold font-display text-base shadow-sm">
            SP
          </div>
          <div>
            <h1 className="text-sm font-display font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              SalesPilot <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 rounded">v1.0</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono hidden sm:block">AI-Powered Sales Pipeline Engine</p>
          </div>
        </div>

        {/* Search, Notifications, Dark Mode, Profile Dropdowns */}
        <div className="flex items-center gap-4 text-xs">
          {/* Instant Search Bar */}
          <div className="relative hidden lg:block w-72">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text"
              placeholder="Search leads, campaigns..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 font-mono text-[10px] uppercase font-bold"
              >
                Clear
              </button>
            )}

            {/* Instant Search Dropdown Popover */}
            {showSearch && searchQuery && (
              <div className="absolute top-10 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg shadow-xl p-3 z-50 max-h-64 overflow-y-auto space-y-3">
                {/* Match Leads */}
                <div>
                  <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Leads matched</div>
                  {leads.filter(l => l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || l.companyName.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                    leads.filter(l => l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || l.companyName.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map(l => (
                      <button 
                        key={l.id}
                        onClick={() => {
                          setActiveTab('leads');
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded flex items-center justify-between text-xs transition"
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{l.fullName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{l.companyName}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-400 font-mono pl-1">No leads found</div>
                  )}
                </div>

                {/* Match Campaigns */}
                <div>
                  <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Campaigns matched</div>
                  {campaigns.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                    campaigns.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map(c => (
                      <button 
                        key={c.id}
                        onClick={() => {
                          setActiveTab('campaigns');
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded flex items-center justify-between text-xs transition"
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{c.channels.join(', ')}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-400 font-mono pl-1">No campaigns found</div>
                  )}
                </div>
              </div>
            )}
            
            {showSearch && !searchQuery && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSearch(false)}
              />
            )}
          </div>

          {/* Help & Product Tour Hub button */}
          <button 
            onClick={() => setShowHelpCenter(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/10 hover:bg-blue-600/25 rounded-lg font-bold text-[11px] transition cursor-pointer"
            title="Launch Interactive Product Tour & Support Help Desk"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Help & Product Tour</span>
          </button>

          {/* AI Assistant Button */}
          <button 
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`p-2 border rounded-lg transition cursor-pointer relative ${rightPanelOpen ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800'}`}
            title="Toggle Ask SalesPilot AI Strategist Panel"
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
          </button>

          {/* Dark/Light Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg transition cursor-pointer"
            title="Toggle Visual Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications Bell Control */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
                setShowActivities(false);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg transition cursor-pointer relative"
              title="View system notices"
            >
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold font-mono text-[9px] rounded-full flex items-center justify-center animate-bounce">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg shadow-xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-blue-500" /> System Notices
                    </span>
                    <button 
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      }}
                      className="text-[9px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Read All
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-none">
                    {notifications.map(n => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                        }}
                        className={`p-2 rounded-lg text-xs leading-normal transition cursor-pointer ${n.read ? 'bg-slate-50/50 dark:bg-slate-850/10 text-slate-500' : 'bg-blue-50/40 dark:bg-blue-950/20 border-l-2 border-blue-500 text-slate-800 dark:text-slate-100'}`}
                      >
                        <div>{n.text}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {n.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Activities Drawer Trigger */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowActivities(!showActivities);
                setShowNotifications(false);
                setShowProfileDropdown(false);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg transition cursor-pointer"
              title="Recent Activities telemetry"
            >
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
            </button>

            {showActivities && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setShowActivities(false)} />
                <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg shadow-xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" /> Recent Activities
                    </span>
                    <button 
                      onClick={() => setActivities([{ id: 'act-0', text: 'Telemetry logs reset.', time: 'Just now', icon: 'Clock', color: 'text-slate-500' }])}
                      className="text-[9px] font-mono text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-none pl-1">
                    {activities.map((act) => (
                      <div key={act.id} className="relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-0 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
                        <span className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </span>
                        <div className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-normal">{act.text}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{act.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Interactive User Profile & Role Switcher Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
                setShowActivities(false);
              }}
              className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 shrink-0 text-left"
            >
              {user?.avatarUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">
                  {user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'SP'}
                </div>
              )}
              <div className="hidden md:block">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 uppercase text-[10px]">
                  {user?.role}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  {user?.fullName}
                </div>
              </div>
            </button>

            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setShowProfileDropdown(false)} />
                <div className="absolute right-0 top-10 w-56 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg shadow-xl p-4 z-50 space-y-3">
                  <div className="border-b border-slate-100 dark:border-slate-850 pb-2 text-center sm:text-left">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{user?.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{user?.companyName}</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">{user?.tier} Plan</div>
                  </div>

                  {/* Dynamic Role Switcher */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-mono uppercase text-slate-400 font-bold mb-1">Role Simulator</label>
                    {['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'VIEWER', 'CLIENT'].map((roleOption) => (
                      <button 
                        key={roleOption}
                        onClick={() => {
                          if (user) {
                            user.role = roleOption as any;
                            if (roleOption === 'CLIENT') {
                              setActiveTab('client-portal');
                            } else if (roleOption === 'SUPER_ADMIN') {
                              setActiveTab('super-admin');
                            }
                          }
                          setShowProfileDropdown(false);
                          alert(`Switched to role: ${roleOption}. ${
                            roleOption === 'CLIENT' ? 'Client Portal workspace has loaded automatically.' :
                            roleOption === 'SUPER_ADMIN' ? 'Super Admin Control Panel has loaded automatically.' :
                            'Permissions and alert banners have adapted immediately.'
                          }`);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono font-medium flex items-center justify-between transition ${
                          user?.role === roleOption 
                            ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/10' 
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        {roleOption}
                        {user?.role === roleOption && <Check className="w-3 h-3 text-blue-500" />}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2 flex justify-between items-center">
                    <button 
                      onClick={() => logout()}
                      className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/10 dark:hover:bg-red-900/20 font-bold text-[10px] rounded flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu triggers */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg ml-2 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Role-Based Workspace Access Status Alerts */}
      {user?.role === 'VIEWER' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-[11px] text-amber-800 flex items-center gap-2 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span><strong>Read-Only Access:</strong> Viewer mode is active. You can monitor pipeline statistics and sequences, but all state-changing actions are disabled.</span>
        </div>
      )}
      {user?.role === 'SALES' && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-[11px] text-blue-800 flex items-center gap-2 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span><strong>Sales Outbound Access:</strong> You can manage leads, book demos, and move deal stages. Campaign sequence changes, Billing, and Settings are restricted.</span>
        </div>
      )}
      {user?.role === 'MANAGER' && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-[11px] text-emerald-800 flex items-center gap-2 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span><strong>Manager Access:</strong> Full workspace sequence, campaign, scheduler, and pipeline boards active. Master integration settings and Billing plans are read-only.</span>
        </div>
      )}
      {user?.role === 'CLIENT' && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-2 text-[11px] text-indigo-800 flex items-center gap-2 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span><strong>Client Portal Access:</strong> Active client simulation mode is enabled. Review outreach sequences, leads feed, book strategy sessions, and chat with Aero.</span>
        </div>
      )}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 text-[11px] text-rose-800 flex items-center gap-2 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span><strong>Super Admin System Access:</strong> Real-time multitenant command center loaded. Execute root parameter adjustments, refund transactions, edit model weights, and override feature flags.</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Left Sidebar Navigation */}
        <aside 
          style={{ width: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
          className={`
            fixed md:sticky top-[64px] bottom-0 left-0 bg-slate-950 border-r border-slate-800 p-4 flex flex-col justify-between z-30 transition-all duration-300 relative shrink-0
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Resizing handlebar */}
          {!sidebarCollapsed && (
            <div 
              onMouseDown={() => setIsResizingSidebar(true)} 
              className="hidden md:block absolute right-0 top-0 bottom-0 w-1 bg-slate-800/20 hover:bg-blue-500 cursor-col-resize transition z-50"
            />
          )}

          <div className="space-y-1.5 overflow-y-auto scrollbar-none flex-1">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest px-3 mb-2 mt-2">
              {sidebarCollapsed ? 'NAV' : 'Navigation Panel'}
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  title={item.label}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-xs flex items-center justify-between transition-all ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' 
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-slate-300 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar collapse button and workspace summary */}
          <div className="space-y-3 pt-3 border-t border-slate-800 mt-auto">
            {!sidebarCollapsed && (
              <div className="bg-slate-900/50 rounded-lg p-3 space-y-1.5 border border-slate-800/50">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Pipeline Value</div>
                <div className="text-sm font-bold text-white font-mono">
                  ₹{deals.reduce((sum, d) => d.stage !== 'CLOSED_LOST' ? sum + d.valueInr : sum, 0).toLocaleString('en-IN')}
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            )}

            {/* Sidebar toggle */}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full py-2 bg-slate-900/40 hover:bg-slate-900 border-t border-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition text-[10px] font-mono uppercase tracking-wider rounded-md"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-blue-500" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Collapse bar</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Primary Content View Stage */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full">
          {activeTab === 'dashboard' && (
            <DashboardView 
              leads={leads} 
              campaigns={campaigns} 
              deals={deals} 
              appointments={appointments} 
              setActiveTab={setActiveTab} 
              user={user}
              onReopenOnboarding={() => setShowOnboarding(true)}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView 
              leads={leads} 
              setLeads={setLeads}
              campaigns={campaigns}
              onAddLead={handleAddLead} 
              onEnrichLead={handleEnrichLead} 
              onBookMeeting={handleBookMeeting} 
            />
          )}

          {activeTab === 'campaigns' && (
            checkIntegration('gmail') ? (
              <CampaignsView 
                campaigns={campaigns} 
                onAddCampaign={handleAddCampaign} 
                onGenerateAISequence={handleGenerateAISequence} 
              />
            ) : (
              <RestrictedViewPlaceholder 
                title="Gmail Integration" 
                description="Campaign orchestration, automatic sequence sending, and automated sequence drips require an active Gmail connection." 
                icon={Send} 
                onResumeSetup={() => setShowOnboarding(true)} 
              />
            )
          )}

          {activeTab === 'automation' && (
            <AutomationView />
          )}

          {activeTab === 'outreach' && (
            checkIntegration('gmail') ? (
              <OutreachView />
            ) : (
              <RestrictedViewPlaceholder 
                title="Gmail Connection" 
                description="Sending personalized cold emails, answering lead threads, and checking inbox delivery require a connected Gmail account." 
                icon={Send} 
                onResumeSetup={() => setShowOnboarding(true)} 
              />
            )
          )}

          {activeTab === 'pipeline' && (
            <PipelineView 
              deals={deals} 
              onUpdateDealStage={handleUpdateDealStage} 
            />
          )}

          {activeTab === 'scheduler' && (
            checkIntegration('calendar') ? (
              <SchedulerView 
                appointments={appointments} 
                leads={leads}
                setAppointments={setAppointments}
                setLeads={setLeads}
                setDeals={setDeals}
                setActiveTab={setActiveTab} 
              />
            ) : (
              <RestrictedViewPlaceholder 
                title="Google Calendar Connection" 
                description="Scheduling lead follow-ups, managing prospect bookings, and syncing real-time calendars require a Google Calendar connection." 
                icon={Calendar} 
                onResumeSetup={() => setShowOnboarding(true)} 
              />
            )
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}
          
          {activeTab === 'openai-suite' && (
            checkIntegration('ai') ? (
              <OpenAiSuiteView />
            ) : (
              <RestrictedViewPlaceholder 
                title="AI Service Connection" 
                description="AI lead enrichment, research tools, personalized email writing, and AI-assisted campaigns require a connected OpenAI or Gemini API key." 
                icon={Sparkles} 
                onResumeSetup={() => setShowOnboarding(true)} 
              />
            )
          )}

          {activeTab === 'ai-agents' && (
            checkIntegration('ai') ? (
              <AiAgentsView />
            ) : (
              <RestrictedViewPlaceholder 
                title="AI SDR Agent Provider" 
                description="Hiring or starting autonomous SDR agents like Astra or Vesper requires connecting an OpenAI or Gemini API key." 
                icon={Bot} 
                onResumeSetup={() => setShowOnboarding(true)} 
              />
            )
          )}

          {activeTab === 'voice-calling' && (
            <VoiceCallingView 
              leads={leads}
              setLeads={setLeads}
              appointments={appointments}
              setAppointments={setAppointments}
              deals={deals}
              setDeals={setDeals}
            />
          )}

          {activeTab === 'mobile-app' && (
            <MobileHubView 
              leads={leads}
              setLeads={setLeads}
              appointments={appointments}
              setAppointments={setAppointments}
              deals={deals}
              setDeals={setDeals}
            />
          )}

          {activeTab === 'client-portal' && (
            <ClientPortalView 
              leads={leads}
              campaigns={campaigns}
              appointments={appointments}
              user={user}
            />
          )}

          {activeTab === 'super-admin' && (
            <SuperAdminView 
              leads={leads}
              campaigns={campaigns}
              appointments={appointments}
              user={user}
            />
          )}

          {activeTab === 'white-label' && (
            <WhiteLabelView />
          )}

          {activeTab === 'enterprise-security' && (
            <EnterpriseSecurityView />
          )}

          {activeTab === 'revenue-intelligence' && (
            <RevenueIntelligenceView />
          )}

          {activeTab === 'marketplace' && (
            <MarketplaceView />
          )}

          {activeTab === 'compliance' && (
            <ComplianceView />
          )}

          {activeTab === 'beta-program' && (
            <BetaProgramView 
              user={user}
              leads={leads}
              setLeads={setLeads}
              campaigns={campaigns}
              setCampaigns={setCampaigns}
              deals={deals}
              setDeals={setDeals}
              onSelectTab={setActiveTab}
              onShowOnboarding={() => setShowOnboarding(true)}
            />
          )}

          {activeTab === 'launch-center' && (
            <LaunchCenterView />
          )}

          {activeTab === 'workspace' && (
            <WorkspaceView 
              user={user} 
              onRefreshUser={async () => {
                // Trigger profile refresh if needed
                console.log('Refreshing user context in Workspace Hub');
              }}
            />
          )}

          {activeTab === 'billing' && (
            checkIntegration('cashfree') ? (
              <BillingView 
                user={user} 
                onUpdateTier={handleUpdateTier} 
              />
            ) : (
              <RestrictedViewPlaceholder 
                title="Cashfree Setup" 
                description="SaaS billing management, checkout forms, custom invoices, and recurring subscription setup require an active Cashfree integration." 
                icon={CreditCard} 
                onResumeSetup={() => setShowOnboarding(true)} 
              />
            )
          )}

          {activeTab === 'integrations' && (
            <IntegrationsView 
              credentials={integrations} 
              onSaveCredentials={handleSaveCredentials} 
              onReopenOnboarding={() => setShowOnboarding(true)}
            />
          )}

          {activeTab === 'developer-portal' && (
            <DeveloperPortalView />
          )}
        </main>

        {/* Right AI Panel (Ask SalesPilot / Strategist Chat) */}
        {rightPanelOpen && (
          <aside 
            style={{ width: `${rightPanelWidth}px` }}
            className="hidden xl:flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shrink-0 h-[calc(100vh-64px)] sticky top-[64px] right-0 z-25 relative overflow-hidden"
          >
            {/* Resizing handlebar */}
            <div 
              onMouseDown={() => setIsResizingRightPanel(true)} 
              className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 hover:bg-purple-500 cursor-col-resize transition z-50"
            />

            {/* AI Panel Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">Ask SalesPilot</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] text-slate-400 font-mono">Gemini Outbound AI active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setRightPanelOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                title="Hide right panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Panel Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              
              {/* Dynamic Chat Dialog */}
              <div className="space-y-3">
                {aiChatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-xl text-xs space-y-1 max-w-[90%] transition-all ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white ml-auto rounded-tr-none' 
                        : 'bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 mr-auto rounded-tl-none border border-slate-200/40 dark:border-slate-800'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                    <span className="block text-[8px] opacity-70 text-right font-mono">{msg.time}</span>
                  </div>
                ))}

                {isAiResponding && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 text-slate-400 rounded-xl rounded-tl-none mr-auto text-xs flex items-center gap-2 max-w-[80%]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                    <span className="font-mono">Strategizing outbound payload...</span>
                  </div>
                )}
              </div>

              {/* Dynamic Suggested Actions */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Suggested AI actions</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Generate Leads', query: 'Generate active high-intent marketing leads in Pune.' },
                    { label: 'Research Company', query: 'Conduct full background research on Apex Tech Solutions India.' },
                    { label: 'Write Cold Email', query: 'Write a hyper-personalized email series introducing growth scaling services.' },
                    { label: 'Analyze CRM Pipeline', query: 'Review my CRM pipeline and identify risk categories.' }
                  ].map((act, i) => (
                    <button
                      key={i}
                      onClick={async () => {
                        const userMsgId = `um-${Date.now()}`;
                        const botMsgId = `bm-${Date.now()}`;
                        setAiChatMessages(prev => [
                          ...prev, 
                          { id: userMsgId, sender: 'user', text: act.query, time: 'Just now' }
                        ]);
                        setIsAiResponding(true);
                        try {
                          const res = await fetch('/api/v1/ai/ask-insights', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              query: act.query, 
                              leadsCount: leads.length, 
                              campaignsCount: campaigns.length, 
                              dealsValue: deals.reduce((sum, d) => d.stage !== 'CLOSED_LOST' ? sum + d.valueInr : sum, 0) 
                            })
                          });
                          const data = await res.json();
                          if (res.ok && data.answer) {
                            setAiChatMessages(prev => [
                              ...prev, 
                              { id: botMsgId, sender: 'bot', text: data.answer, time: 'Just now' }
                            ]);
                          } else {
                            setAiChatMessages(prev => [
                              ...prev, 
                              { id: botMsgId, sender: 'bot', text: `Error contacting AI: ${data.error || 'Server error occurred.'}`, time: 'Just now' }
                            ]);
                          }
                        } catch (e: any) {
                          setAiChatMessages(prev => [
                            ...prev, 
                            { id: botMsgId, sender: 'bot', text: `Error contacting AI: ${e.message || String(e)}`, time: 'Just now' }
                          ]);
                        } finally {
                          setIsAiResponding(false);
                        }
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-mono border border-slate-200/50 dark:border-slate-800 transition text-left shrink-0 cursor-pointer"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt History list */}
              <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-850 pt-3">
                <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Prompt History</span>
                <div className="space-y-1.5">
                  {promptHistory.map((h, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiChatQuery(h)}
                      className="w-full text-left p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded text-[10px] text-slate-500 truncate font-mono"
                    >
                      ⚡ {h}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* AI Panel Chat input */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!aiChatQuery.trim()) return;
                const queryStr = aiChatQuery;
                setAiChatQuery('');
                
                const userMsgId = `um-${Date.now()}`;
                const botMsgId = `bm-${Date.now()}`;

                setAiChatMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: queryStr, time: 'Just now' }]);
                setIsAiResponding(true);

                 try {
                  const res = await fetch('/api/v1/ai/ask-insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      query: queryStr, 
                      leadsCount: leads.length, 
                      campaignsCount: campaigns.length, 
                      dealsValue: deals.reduce((sum, d) => d.stage !== 'CLOSED_LOST' ? sum + d.valueInr : sum, 0) 
                    })
                  });
                  const data = await res.json();
                  if (res.ok && data.answer) {
                    setAiChatMessages(prev => [...prev, { id: botMsgId, sender: 'bot', text: data.answer, time: 'Just now' }]);
                  } else {
                    setAiChatMessages(prev => [...prev, { id: botMsgId, sender: 'bot', text: `Error contacting AI: ${data.error || 'Server error occurred.'}`, time: 'Just now' }]);
                  }
                } catch (err: any) {
                  setAiChatMessages(prev => [...prev, { id: botMsgId, sender: 'bot', text: `Error contacting AI: ${err.message || String(err)}`, time: 'Just now' }]);
                } finally {
                  setIsAiResponding(false);
                }
              }}
              className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-2"
            >
              <input 
                type="text"
                placeholder="Ask SalesPilot..."
                value={aiChatQuery}
                onChange={(e) => setAiChatQuery(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button 
                type="submit"
                disabled={isAiResponding}
                className="p-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </aside>
        )}

      </div>

      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={() => setShowOnboarding(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Exit Wizard
            </button>
          </div>
          <OnboardingWizard
            user={user}
            onComplete={(orgData) => {
              user.companyName = orgData.companyName;
              user.industry = orgData.industry;
              setShowOnboarding(false);
              // Force state update to trigger re-render
              setLeads([...leads]);
            }}
          />
        </div>
      )}

      {showHelpCenter && (
        <LaunchHelpCenter 
          isOpen={showHelpCenter} 
          onClose={() => setShowHelpCenter(false)} 
          user={user} 
          leads={leads}
          setLeads={setLeads}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          deals={deals}
          setDeals={setDeals}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          onShowOnboarding={() => setShowOnboarding(true)}
          onTriggerToast={(msg) => alert(msg)}
        />
      )}
    </div>
  );
}
