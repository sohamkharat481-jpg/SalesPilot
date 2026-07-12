import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, Sparkles, Users, Calendar, FileText, CreditCard, Building, 
  HelpCircle, Bot, Send, CheckCircle2, Clock, ArrowUpRight, Download, 
  Search, Plus, Trash2, Settings, Activity, Info, X, ShieldAlert, 
  RefreshCw, Check, Briefcase, Play, Pause, TrendingUp, MessageSquare, AlertTriangle, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { Lead, Campaign, Appointment } from '../types';

interface ClientPortalViewProps {
  leads: Lead[];
  campaigns: Campaign[];
  appointments: Appointment[];
  user: any;
}

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  description: string;
  createdAt: string;
  messages: {
    sender: 'CLIENT' | 'SUPPORT';
    text: string;
    time: string;
  }[];
}

interface ClientOrgMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'GUEST';
  status: 'ACTIVE' | 'INVITED';
}

interface ClientInvoice {
  id: string;
  date: string;
  amountInr: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  service: string;
}

export function ClientPortalView({ leads, campaigns, appointments, user }: ClientPortalViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'campaigns' | 'leads' | 'meetings' | 'reports' | 'billing' | 'organization' | 'support' | 'ai-assistant'>('dashboard');
  
  // Organization Details State
  const [orgProfile, setOrgProfile] = useState({
    name: user?.companyName || 'Stellar Enterprises',
    domain: user?.companyName ? `${user.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : 'stellarlabs.com',
    industry: user?.industry || 'Software & SaaS',
    size: '50-100 employees',
    phone: '+91 88765 43210',
    address: 'Vikas Tech Park, Sector 4, Bangalore, KA, 560001'
  });

  // Team Members State
  const [teamMembers, setTeamMembers] = useState<ClientOrgMember[]>([
    { id: 'm-1', name: user?.fullName || 'Soham Kharat', email: user?.email || 'soham@gmail.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: 'm-2', name: 'Divya Nair', email: 'divya@stellar.com', role: 'MEMBER', status: 'ACTIVE' },
    { id: 'm-3', name: 'Arun Kumar', email: 'arun@stellar.com', role: 'MEMBER', status: 'INVITED' }
  ]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'MEMBER' | 'GUEST'>('MEMBER');

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 't-101',
      category: 'Campaign Criteria',
      subject: 'Optimize Bangalore SaaS Leads Targeting',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      description: 'We would like to narrow down our target criteria to focus purely on SaaS startups with post-seed funding in the tech corridor.',
      createdAt: '2026-07-03 11:20',
      messages: [
        { sender: 'CLIENT', text: 'We need to focus on startups with seed/A rounds.', time: '2026-07-03 11:20' },
        { sender: 'SUPPORT', text: 'Hi team, understood. I have updated our Astra Agent crawler to prioritize tech startups with funding parameters. Will share the new lead batch shortly!', time: '2026-07-03 14:15' }
      ]
    },
    {
      id: 't-102',
      category: 'Billing',
      subject: 'Verify credit consumption for July sequence',
      priority: 'LOW',
      status: 'RESOLVED',
      description: 'Requesting clarification on outbound credit deduct cycles for our secondary campaign.',
      createdAt: '2026-06-30 09:40',
      messages: [
        { sender: 'CLIENT', text: 'Are credits deducted on delivery or reply?', time: '2026-06-30 09:40' },
        { sender: 'SUPPORT', text: 'Outbound credits are only counted per initial email successfully delivered. Auto-replies are always free.', time: '2026-06-30 10:10' }
      ]
    }
  ]);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Campaign Request');
  const [newTicketPriority, setNewTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Invoices State
  const [invoices, setInvoices] = useState<ClientInvoice[]>([
    { id: 'inv-1004', date: '2026-07-01', amountInr: 12500, status: 'PAID', service: 'Horizon Outreach Drip Program - July' },
    { id: 'inv-1003', date: '2026-06-01', amountInr: 12500, status: 'PAID', service: 'Horizon Outreach Drip Program - June' },
    { id: 'inv-1002', date: '2026-05-01', amountInr: 12500, status: 'PAID', service: 'Horizon Outreach Drip Program - May' }
  ]);

  // AI Chat Assistant State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string; time: string }[]>([
    { role: 'assistant', content: `Greetings! I am Aero, your dedicated SalesPilot intelligence proxy. I have real-time synchronization with your active outreach sequences and lead funnels. Ask me anything about your campaigns!`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Leads and Campaigns Filtered specifically for this client company name
  const clientLeads = leads.slice(0, 15); // Dynamic subset representing client leads
  const clientCampaigns = campaigns.slice(0, 4); // Dynamic subset representing client campaigns
  const clientAppointments = appointments.slice(0, 5); // Dynamic subset representing client scheduled calls

  // Lead Detail Drawer State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Report Compiler State
  const [reports, setReports] = useState([
    { id: 'cr-1', name: 'Weekly_Growth_Outbound_Digest', format: 'CSV', date: '2026-07-05 18:00', size: '150 KB' },
    { id: 'cr-2', name: 'Horizon_Media_Monthly_ROI_Analysis', format: 'PDF', date: '2026-07-01 10:00', size: '3.1 MB' },
    { id: 'cr-3', name: 'SaaS_Decision_Makers_Qualified_June', format: 'CSV', date: '2026-06-25 16:30', size: '420 KB' }
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStep, setCompileStep] = useState('');

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle Client AI Chat submission
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: userText, time: timeNow }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const response = await fetch('/api/v1/client-portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          companyName: orgProfile.name,
          clientIndustry: orgProfile.industry
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: data.answer || 'I am happy to assist you in monitoring your campaigns.', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I am experiencing some difficulties connecting to my memory bank. Please try again in a moment.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Compile Reports Logic
  const handleCompileReport = () => {
    setIsCompiling(true);
    setCompileProgress(0);
    const steps = [
      'Authenticating Client Key...',
      'Mapping Active Outreach Funnel Data...',
      'Calculating Campaign Click-to-Reply Ratios...',
      'Parsing Bangalore CRM Node Coordinates...',
      'Verifying SHA-256 Workspace Integrity Signature...',
      'Building Vector Chart Modules...',
      'Finalizing Document Compilation...'
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 5;
      const stepIdx = Math.min(Math.floor((currentProgress / 100) * steps.length), steps.length - 1);
      setCompileStep(steps[stepIdx]);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setCompileProgress(100);
        setIsCompiling(false);
        
        const newRep = {
          id: `cr-${Date.now()}`,
          name: `${orgProfile.name.replace(/[^a-zA-Z0-9]/g, '_')}_Outbound_Digest_${new Date().toISOString().slice(0, 10)}`,
          format: 'PDF',
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          size: '1.8 MB'
        };
        setReports(prev => [newRep, ...prev]);
      } else {
        setCompileProgress(currentProgress);
      }
    }, 450);
  };

  const handleDownloadReport = (report: any) => {
    const fileContent = `SalesPilot Client Portal Report Export\nFile: ${report.name}.${report.format.toLowerCase()}\nOrganization: ${orgProfile.name}\nGenerated: ${report.date}\nStatus: Authenticated Secured Signature`;
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.${report.format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Support ticket actions
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDescription.trim()) return;

    const newTicket: SupportTicket = {
      id: `t-${100 + tickets.length + 1}`,
      category: newTicketCategory,
      subject: newTicketSubject,
      priority: newTicketPriority,
      status: 'OPEN',
      description: newTicketDescription,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      messages: [
        { sender: 'CLIENT', text: newTicketDescription, time: new Date().toISOString().slice(0, 16).replace('T', ' ') }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    setNewTicketSubject('');
    setNewTicketDescription('');
    setShowCreateTicketModal(false);
  };

  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReplyText.trim() || !selectedTicketId) return;

    const timeString = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        const clientMsg = { sender: 'CLIENT' as const, text: ticketReplyText.trim(), time: timeString };
        
        // Auto simulated response after 1.5 seconds
        setTimeout(() => {
          setTickets(prevTickets => prevTickets.map(innerT => {
            if (innerT.id === selectedTicketId) {
              return {
                ...innerT,
                status: 'IN_PROGRESS',
                messages: [
                  ...innerT.messages,
                  { sender: 'SUPPORT' as const, text: `Received your update regarding "${innerT.subject}". Our B2B campaign operations manager will verify and execute this immediately.`, time: new Date().toISOString().slice(0, 16).replace('T', ' ') }
                ]
              };
            }
            return innerT;
          }));
        }, 1500);

        return {
          ...t,
          messages: [...t.messages, clientMsg]
        };
      }
      return t;
    }));

    setTicketReplyText('');
  };

  // Add Org Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const newM: ClientOrgMember = {
      id: `m-${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      status: 'INVITED'
    };

    setTeamMembers(prev => [...prev, newM]);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  // Billing credit details
  const activeInvoiceSum = invoices.reduce((s, i) => s + i.amountInr, 0);

  // Simulated chart data
  const chartData = [
    { name: 'Mon', Sent: 140, Opens: 80, Replies: 12 },
    { name: 'Tue', Sent: 220, Opens: 145, Replies: 24 },
    { name: 'Wed', Sent: 180, Opens: 110, Replies: 18 },
    { name: 'Thu', Sent: 290, Opens: 190, Replies: 32 },
    { name: 'Fri', Sent: 340, Opens: 215, Replies: 41 },
    { name: 'Sat', Sent: 110, Opens: 70, Replies: 8 },
    { name: 'Sun', Sent: 90, Opens: 55, Replies: 5 }
  ];

  const subNavigation = [
    { id: 'dashboard', label: 'Premium Dashboard', icon: Layers },
    { id: 'campaigns', label: 'Campaigns Monitor', icon: Sparkles },
    { id: 'leads', label: 'Leads Feed', icon: Users },
    { id: 'meetings', label: 'Meetings Calendar', icon: Calendar },
    { id: 'reports', label: 'Download Reports', icon: FileText },
    { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
    { id: 'organization', label: 'Company Workspace', icon: Building },
    { id: 'support', label: 'Support Ticket Hub', icon: HelpCircle },
    { id: 'ai-assistant', label: 'Aero AI Co-Pilot', icon: Bot }
  ];

  return (
    <div id="client_portal_root" className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Top Banner indicating Portal Status */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-2xl border border-blue-850 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <Bot className="w-96 h-96" />
        </div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full animate-pulse tracking-wide uppercase">PORTAL LINK ACTIVE</span>
            <span className="text-slate-300 font-mono text-[10px]">&bull; Secure 256-bit encryption</span>
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight">
            Welcome to Your Client Portal
          </h2>
          <p className="text-sm text-slate-200 font-medium max-w-xl">
            Monitor outreach pipelines, inspect qualified profiles, download performance digests, and interact directly with your growth team.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400 font-mono">CLIENT ORGANIZATION</div>
            <div className="text-sm font-bold text-white tracking-wide uppercase">{orgProfile.name}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/35 border border-blue-400/40 flex items-center justify-center font-bold text-xl text-white shadow-inner">
            {orgProfile.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Grid of Inner Tabs Navigation & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar sub-navigation inside Client Portal */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-sm space-y-1">
            <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2.5 mb-3 font-semibold">Portal Modules</span>
            {subNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubTab(item.id as any);
                    setSelectedTicketId(null);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${
                    activeSubTab === item.id 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${activeSubTab === item.id ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Bot className="w-4 h-4 text-blue-600 animate-bounce" />
              <span>Aero AI Assistant</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask Aero questions like <em className="text-slate-700 dark:text-slate-200">"Summarize my campaigns"</em> or <em className="text-slate-700 dark:text-slate-200">"Export lead records"</em> for instant support.
            </p>
            <button 
              onClick={() => setActiveSubTab('ai-assistant')}
              className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[10px] rounded-lg transition"
            >
              Open AI Chat Console
            </button>
          </div>
        </div>

        {/* Primary Content Segment based on activeSubTab */}
        <div className="lg:col-span-9 space-y-6">

          {/* MODULE 1: PREMIUM DASHBOARD */}
          {activeSubTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Premium Dashboard Metrics Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">Qualified Leads</span>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                    {clientLeads.length}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="text-emerald-600 font-bold font-mono">&uarr; 18.5%</span> this week
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">Active Sequences</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                    {clientCampaigns.length}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="text-emerald-600 font-bold font-mono">&bull; Active</span> running
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">Meetings Scheduled</span>
                    <Calendar className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                    {clientAppointments.length}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="text-blue-600 font-bold font-mono">&bull; 1 Upcoming</span> today
                  </div>
                </div>

              </div>

              {/* Data Visualization Chart Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">Horizon Growth Outbound Statistics</h3>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-50">Campaign Outreach & Replies Over Time</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-600 block"></span> Sent</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500 block"></span> Opens</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span> Replies</span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Area type="monotone" dataKey="Sent" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
                      <Area type="monotone" dataKey="Opens" stroke="#6366f1" strokeWidth={1.5} fillOpacity={0} />
                      <Area type="monotone" dataKey="Replies" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorReplies)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Split Layout: Upcoming meetings tracker & Recent Qualified Leads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Upcoming Meetings widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" /> Upcoming Strategy Calls
                    </h4>
                    <button 
                      onClick={() => setActiveSubTab('meetings')}
                      className="text-[10px] font-mono text-blue-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {clientAppointments.slice(0, 3).map((apt, index) => (
                      <div key={apt.id || index} className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-1.5 flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-100">Horizon Alignment Demo</p>
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {apt.dateTime ? new Date(apt.dateTime).toLocaleDateString() + ' ' + new Date(apt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD'}
                          </p>
                        </div>
                        <a 
                          href={apt.meetingLink || '#'} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-700 transition"
                        >
                          Join Call
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hot Leads list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" /> Recent Qualified Leads
                    </h4>
                    <button 
                      onClick={() => setActiveSubTab('leads')}
                      className="text-[10px] font-mono text-blue-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {clientLeads.slice(0, 3).map((lead) => (
                      <div 
                        key={lead.id} 
                        onClick={() => {
                          setSelectedLead(lead);
                          setActiveSubTab('leads');
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200/50 dark:border-slate-800 flex justify-between items-center hover:border-blue-300 transition cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-100">{lead.firstName} {lead.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{lead.company}</p>
                        </div>
                        <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded">
                          {lead.leadScore || 'Hot'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* MODULE 2: CAMPAIGNS MONITOR */}
          {activeSubTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-blue-600" /> Active Sequences & Outbounds
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Real-time status of targeted LinkedIn and email drips running on your behalf.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clientCampaigns.map((camp) => (
                  <div key={camp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{camp.name}</h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          camp.status === 'ACTIVE' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : 'bg-amber-50 border-amber-100 text-amber-600'
                        }`}>
                          {camp.status}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        AUDIENCE: <span className="font-bold text-slate-600 dark:text-slate-300">{camp.targetAudience}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-850/60 p-3 rounded-xl border border-slate-200/40 text-center">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400">Sent</div>
                        <div className="text-sm font-bold font-mono text-slate-850 dark:text-white">{camp.totalSent || 450}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-400">Open Rate</div>
                        <div className="text-sm font-bold font-mono text-blue-600">{((camp.totalOpened / camp.totalSent) * 100 || 68).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-400">Replied</div>
                        <div className="text-sm font-bold font-mono text-emerald-600">{((camp.totalReplied / camp.totalSent) * 100 || 12.5).toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Active Sequence Steps</div>
                      <div className="flex items-center gap-1">
                        {camp.steps?.map((step: any, index: number) => (
                          <div key={step.id || index} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] border border-slate-200/50 dark:border-slate-700" title={step.subject || 'Step step'}>
                            S{step.stepNumber || index + 1}
                          </div>
                        ))}
                        {(!camp.steps || camp.steps.length === 0) && (
                          <div className="text-[11px] font-mono text-slate-400">LinkedIn connect sequence active.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 3: LEADS FEED */}
          {activeSubTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-blue-600" /> Qualified Sales Leads
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">These prospects have passed active AI verification parameters and fit your buyer requirements.</p>
                </div>
              </div>

              {/* Leads Table Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] font-mono uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="py-3 px-5">Prospect</th>
                        <th className="py-3 px-5">Company / Title</th>
                        <th className="py-3 px-5">Score</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clientLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 text-xs">
                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-900 dark:text-slate-50">{lead.firstName} {lead.lastName}</div>
                            <div className="text-[10px] font-mono text-slate-400">{lead.email}</div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{lead.company}</div>
                            <div className="text-[10px] text-slate-400">{lead.title || 'Decision Maker'}</div>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                              lead.leadScore === 'Very Hot' || lead.leadScore === 'Hot'
                                ? 'bg-rose-50 text-rose-600' 
                                : 'bg-amber-50 text-amber-600'
                            }`}>
                              {lead.leadScore || 'Hot'}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-blue-600 bg-blue-50/70 px-2 py-0.5 rounded">
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button 
                              onClick={() => setSelectedLead(lead)}
                              className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold font-mono text-[10px] rounded transition"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lead Details Drawer Overlay */}
              {selectedLead && (
                <>
                  <div className="fixed inset-0 bg-black/40 z-45" onClick={() => setSelectedLead(null)} />
                  <div className="fixed right-0 top-0 bottom-0 w-full sm:w-130 bg-white dark:bg-slate-900 shadow-2xl z-50 p-6 sm:p-8 overflow-y-auto border-l border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-4">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">PROSPECT ARCHITECTURE</div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedLead.firstName} {selectedLead.lastName}</h3>
                        <p className="text-xs text-slate-500">{selectedLead.title} at <strong className="text-slate-700 dark:text-slate-300">{selectedLead.company}</strong></p>
                      </div>
                      <button 
                        onClick={() => setSelectedLead(null)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-5">
                      
                      {/* Standard Details */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/50">
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase font-semibold">Email Address</div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white font-mono truncate">{selectedLead.email}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase font-semibold">Contact Phone</div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white font-mono">{selectedLead.phone || '+91 99887 76655'}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase font-semibold">Lead Score</div>
                          <div className="text-xs font-bold text-rose-600 font-mono">{selectedLead.leadScore || 'Hot'}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase font-semibold">Confidence Rating</div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white font-mono">{selectedLead.confidenceScore || 85}%</div>
                        </div>
                      </div>

                      {/* AI Brief Enrichment */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-wide flex items-center gap-1">
                          <Bot className="w-4 h-4 text-blue-600" /> AI Executive Summary
                        </h4>
                        <div className="p-4 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-150 rounded-xl text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {selectedLead.enrichment?.aiBrief || `${selectedLead.company} is an active, modern enterprise specializing in high-value digital services and scalable systems. They are positioned to expand their client base aggressively in key regions using automated CRM integrations and live scheduling hooks.`}
                        </div>
                      </div>

                      {/* Opportunities */}
                      {selectedLead.researchProfile?.businessOpportunities && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-wide">Identified Value Hooks</h4>
                          <ul className="space-y-2">
                            {selectedLead.researchProfile.businessOpportunities.map((op, i) => (
                              <li key={i} className="text-xs flex items-start gap-2 text-slate-650 dark:text-slate-300">
                                <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[9px] mt-0.5">✓</span>
                                {op}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Pain points */}
                      {selectedLead.researchProfile?.painPoints && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-wide">Critical Client Pain Points</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedLead.researchProfile.painPoints.map((pain, i) => (
                              <span key={i} className="text-[10px] font-bold font-mono bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.8 rounded">
                                {pain}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes history */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-wide">Interaction Log</h4>
                        <div className="space-y-2.5">
                          {selectedLead.notesList && selectedLead.notesList.length > 0 ? (
                            selectedLead.notesList.map((n) => (
                              <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-xs border border-slate-200/50">
                                <p className="text-slate-750 dark:text-slate-200 leading-normal">{n.text}</p>
                                <div className="text-[9px] text-slate-400 font-mono mt-1">{new Date(n.createdAt).toLocaleDateString()}</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-xs border border-slate-200/50 text-slate-450 text-center font-mono">
                              Campaign sequence initiated. Waiting for first reply.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* MODULE 4: MEETINGS TRACKER */}
          {activeSubTab === 'meetings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-blue-600" /> Track Strategy Meetings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">All strategy alignment sync calls and qualified prospect demos are mapped here.</p>
                </div>
              </div>

              {/* Meetings List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clientAppointments.map((apt) => (
                  <div key={apt.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                          {apt.status || 'CONFIRMED'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-950 dark:text-white mt-1">Horizon Outreach Strategy Session</h4>
                      </div>
                      <Calendar className="w-5 h-5 text-emerald-500" />
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-850/60 p-3.5 rounded-xl border border-slate-200/40">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400 font-mono text-[10px]">Date & Time</span>
                        <span className="font-bold font-mono text-slate-850 dark:text-white">
                          {apt.dateTime ? new Date(apt.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400 font-mono text-[10px]">Meeting Channel</span>
                        <span className="font-bold text-blue-600 font-mono">Google Meet</span>
                      </div>
                      {apt.notes && (
                        <div className="border-t border-slate-200/40 mt-2 pt-2 text-[11px] leading-relaxed italic text-slate-450">
                          {apt.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <a 
                        href={apt.meetingLink || 'https://meet.google.com'} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center text-xs rounded-xl shadow transition"
                      >
                        Join Google Meet Room
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 5: DOWNLOAD REPORTS */}
          {activeSubTab === 'reports' && (
            <div className="space-y-6">
              
              {/* Compiler Header card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-blue-600" /> Compile Live Outreach Report
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Generate a custom real-time PDF summary of active leads, opens, and delivery rates.</p>
                  </div>
                  <button 
                    onClick={handleCompileReport}
                    disabled={isCompiling}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isCompiling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {isCompiling ? 'Compiling Report...' : 'Compile New Report'}
                  </button>
                </div>

                {isCompiling && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2 border border-slate-200/50">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-blue-600 font-bold">{compileStep}</span>
                      <span className="text-slate-500 font-bold">{compileProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${compileProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reports List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-850">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Available Reports History</h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reports.map((rep) => (
                    <div key={rep.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 border text-slate-600 px-1.5 py-0.2 rounded">
                            {rep.format}
                          </span>
                          <span className="font-bold text-xs text-slate-850 dark:text-white">{rep.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Generated: {rep.date} &bull; Size: {rep.size}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownloadReport(rep)}
                        className="py-1.5 px-4 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold font-mono text-[10px] rounded-lg border border-slate-200/50 transition flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3" /> Download File
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* MODULE 6: BILLING & INVOICES */}
          {activeSubTab === 'billing' && (
            <div className="space-y-6">
              
              {/* Plan Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm md:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">CURRENT MEMBERSHIP</div>
                      <h4 className="text-lg font-bold text-slate-950 dark:text-white mt-0.5">Growth Outbound Campaign Drip</h4>
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                      Active Plan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                    <div>
                      <div className="text-[10px] text-slate-450 font-mono">Cycle Outbound Limit</div>
                      <div className="text-base font-extrabold text-slate-800 dark:text-white font-mono">5,000 / month</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-450 font-mono">Remaining Credits</div>
                      <div className="text-base font-extrabold text-blue-600 font-mono">3,142 credits</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-450 font-mono">Renewal Cost</div>
                      <div className="text-base font-extrabold text-slate-800 dark:text-white font-mono">₹12,500 INR / mo</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-450 font-mono">Next Invoice Date</div>
                      <div className="text-base font-extrabold text-slate-800 dark:text-white font-mono">2026-08-01</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-6 rounded-2xl text-white space-y-4 border border-indigo-800 shadow-lg flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest font-bold">UPGRADE PROGRAM</span>
                    <h5 className="font-bold text-sm">Need More Delivery Credits?</h5>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Expand your outbound quota with advanced lead scrubbing and daily AI LinkedIn invite sequence drops.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      alert('Upgrade inquiry dispatched to Horizon Media. Our coordinator will contact you shortly!');
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer text-center block"
                  >
                    Inquire Enterprise
                  </button>
                </div>

              </div>

              {/* Invoices */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-850">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Transaction Receipts History</h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.2 rounded">
                            {inv.status}
                          </span>
                          <span className="font-bold text-xs text-slate-850 dark:text-white">{inv.service}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Cycle ID: {inv.id} &bull; Paid: {inv.date}
                        </div>
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                        ₹{inv.amountInr.toLocaleString('en-IN')} INR
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* MODULE 7: COMPANY WORKSPACE */}
          {activeSubTab === 'organization' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Profile Edit */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm md:col-span-7 space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" /> Corporate Information profile
                  </h4>
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Company Registered Name</label>
                      <input 
                        type="text" 
                        value={orgProfile.name}
                        onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Custom Domain</label>
                        <input 
                          type="text" 
                          value={orgProfile.domain}
                          onChange={(e) => setOrgProfile({ ...orgProfile, domain: e.target.value })}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Core Industry</label>
                        <input 
                          type="text" 
                          value={orgProfile.industry}
                          onChange={(e) => setOrgProfile({ ...orgProfile, industry: e.target.value })}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Operational Address</label>
                      <textarea 
                        rows={2}
                        value={orgProfile.address}
                        onChange={(e) => setOrgProfile({ ...orgProfile, address: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Members Invite segment */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm md:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" /> Invite Team Member
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Grant company managers permission to track outbounds, review profiles, and download performance sheets.
                    </p>
                    <form onSubmit={handleAddMember} className="space-y-2.5">
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                        required
                      />
                      <input 
                        type="email" 
                        placeholder="Work Email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                        required
                      />
                      <div className="flex gap-2 justify-between">
                        <select 
                          value={newMemberRole}
                          onChange={(e: any) => setNewMemberRole(e.target.value)}
                          className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none flex-1"
                        >
                          <option value="MEMBER">Member (Standard)</option>
                          <option value="ADMIN">Admin (All Access)</option>
                          <option value="GUEST">Guest (Read Only)</option>
                        </select>
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
                        >
                          Invite
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

              </div>

              {/* Members List Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-850">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Active Corporate Accounts</h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teamMembers.map((m) => (
                    <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-slate-850 dark:text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-150 border text-slate-650 rounded">
                          {m.role}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          m.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* MODULE 8: SUPPORT TICKET HUB */}
          {activeSubTab === 'support' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HelpCircle className="w-4.5 h-4.5 text-blue-600" /> Support Ticket Coordinator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Request outbound quota extensions, optimize targeting lists, or notify campaign specialists.</p>
                </div>
                <button 
                  onClick={() => setShowCreateTicketModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Support Ticket
                </button>
              </div>

              {/* Split Layout: Tickets index on left, active chat on right if selected */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Tickets list index */}
                <div className={`space-y-3 ${selectedTicketId ? 'md:col-span-5' : 'md:col-span-12'}`}>
                  {tickets.map((tick) => (
                    <div 
                      key={tick.id} 
                      onClick={() => setSelectedTicketId(tick.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                        selectedTicketId === tick.id 
                          ? 'bg-blue-600/5 dark:bg-blue-950/10 border-blue-500 shadow' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-350'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">{tick.createdAt}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            tick.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {tick.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-850 dark:text-white truncate">{tick.subject}</h4>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{tick.category}</div>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-2 text-[10px] font-mono">
                        <span className="text-slate-400">ID: {tick.id}</span>
                        <span className={`font-bold uppercase ${
                          tick.status === 'RESOLVED' ? 'text-emerald-600' : 'text-blue-600'
                        }`}>
                          {tick.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Ticket Thread Panel */}
                {selectedTicketId && (
                  <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm p-5 sm:p-6 flex flex-col justify-between h-[450px]">
                    
                    {/* Thread header */}
                    {(() => {
                      const activeT = tickets.find(t => t.id === selectedTicketId);
                      if (!activeT) return null;
                      return (
                        <>
                          <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex justify-between items-center gap-4 shrink-0">
                            <div className="min-w-0">
                              <div className="text-[9px] font-mono text-slate-400 uppercase">TICKET THREAD ID: {activeT.id}</div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">{activeT.subject}</h4>
                            </div>
                            <button 
                              onClick={() => setSelectedTicketId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Message bubble track */}
                          <div className="flex-1 overflow-y-auto space-y-3.5 my-4 pr-1 scrollbar-none">
                            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-xs leading-relaxed text-slate-650 border border-slate-200/50">
                              <p className="font-semibold text-slate-400 uppercase text-[9px] mb-1">ORIGINAL COMPLAINT DESCRIPTION</p>
                              {activeT.description}
                            </div>
                            
                            {activeT.messages.map((msg, idx) => (
                              <div 
                                key={idx} 
                                className={`p-3 rounded-lg text-xs leading-normal max-w-[85%] ${
                                  msg.sender === 'CLIENT' 
                                    ? 'bg-blue-600 text-white ml-auto' 
                                    : 'bg-slate-100 text-slate-800 mr-auto border border-slate-200/50'
                                }`}
                              >
                                <div>{msg.text}</div>
                                <div className={`text-[9px] font-mono mt-1 ${msg.sender === 'CLIENT' ? 'text-blue-200' : 'text-slate-400'}`}>
                                  {msg.time}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Input response */}
                          {activeT.status !== 'RESOLVED' ? (
                            <form onSubmit={handleReplyTicket} className="flex gap-2 shrink-0 border-t border-slate-100 dark:border-slate-850 pt-3">
                              <input 
                                type="text"
                                placeholder="Write response to operations support..."
                                value={ticketReplyText}
                                onChange={(e) => setTicketReplyText(e.target.value)}
                                className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                              />
                              <button 
                                type="submit"
                                className="px-3.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <div className="text-center p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-slate-450 font-mono text-[10px] shrink-0">
                              This ticket has been marked as resolved. If you still require help, please create a new support request.
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

              </div>

              {/* Create Ticket Modal Popup */}
              {showCreateTicketModal && (
                <>
                  <div className="fixed inset-0 bg-black/45 z-45" onClick={() => setShowCreateTicketModal(false)} />
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-250 rounded-2xl p-6 shadow-2xl z-50 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-sm text-slate-950 dark:text-white flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-blue-600" /> Dispatch New Support Ticket
                      </h4>
                      <button onClick={() => setShowCreateTicketModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateTicket} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Ticket Subject</label>
                        <input 
                          type="text" 
                          placeholder="Brief description of requirements"
                          value={newTicketSubject}
                          onChange={(e) => setNewTicketSubject(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Service Category</label>
                          <select 
                            value={newTicketCategory}
                            onChange={(e) => setNewTicketCategory(e.target.value)}
                            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="Campaign Request">Campaign Request</option>
                            <option value="Lead Criteria Adjust">Lead Criteria Adjust</option>
                            <option value="Technical Setup">Technical Setup</option>
                            <option value="Billing Discrepancy">Billing Discrepancy</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Urgency Priority</label>
                          <select 
                            value={newTicketPriority}
                            onChange={(e: any) => setNewTicketPriority(e.target.value)}
                            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="LOW">Low (Standard)</option>
                            <option value="MEDIUM">Medium (Normal)</option>
                            <option value="HIGH">High (Immediate Action)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Detailed Explanation</label>
                        <textarea 
                          rows={4}
                          placeholder="Explain what needs adjustment. Include campaign names, ideal client sizes, or preferred timeline parameters."
                          value={newTicketDescription}
                          onChange={(e) => setNewTicketDescription(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex gap-2.5 pt-2">
                        <button 
                          type="button" 
                          onClick={() => setShowCreateTicketModal(false)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                        >
                          Send Ticket
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}

            </div>
          )}

          {/* MODULE 9: AI CO-PILOT CHAT */}
          {activeSubTab === 'ai-assistant' && (
            <div className="space-y-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm h-[500px] flex flex-col justify-between overflow-hidden">
                
                {/* Chat Header */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
                  <div className="w-8.5 h-8.5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      Aero Intelligence Co-Pilot <span className="text-[9px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-bold">SECURE CORE</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">Synced with active leads registry of {orgProfile.name}</p>
                  </div>
                </div>

                {/* Message display log */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-none">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex gap-3.5 max-w-[85%] ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      {msg.role !== 'user' && (
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div 
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-slate-150 rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className={`text-[9px] text-slate-400 font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex gap-3.5 mr-auto">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Suggested prompt bubbles */}
                <div className="px-5 pb-3 flex flex-wrap gap-2 shrink-0">
                  {[
                    'Summarize our active campaign statistics',
                    'How many hot leads do we have in active funnel?',
                    'When is our next scheduled alignment meeting?',
                    'Recommend ways to improve target reply rates'
                  ].map((p, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setChatInput(p);
                      }}
                      className="text-[10px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/50 px-3 py-1.5 rounded-full transition cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Submit Form */}
                <form onSubmit={handleSendChatMessage} className="p-4 bg-slate-50 border-t border-slate-150 flex gap-2.5 shrink-0">
                  <input 
                    type="text"
                    placeholder="Type your strategic outreach question for Aero..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={chatLoading}
                  />
                  <button 
                    type="submit"
                    disabled={chatLoading}
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:bg-blue-400 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
