import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Settings, Users, Building, CreditCard, Sparkles, Calendar, FileText, 
  HelpCircle, Terminal, ToggleLeft, Activity, TrendingUp, Search, Plus, Trash2, 
  Check, X, RefreshCw, ArrowUpRight, AlertTriangle, ShieldCheck, Play, Pause, 
  Download, Eye, Lock, Mail, Globe, Cpu, Server, Database, Key, Sliders, Layers
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import { Lead, Campaign, Appointment } from '../types';

interface SuperAdminViewProps {
  leads: Lead[];
  campaigns: Campaign[];
  appointments: Appointment[];
  user: any;
}

// Interfaces for Admin Panel
interface AdminOrg {
  id: string;
  name: string;
  domain: string;
  tier: 'FREE_TRIAL' | 'STARTER' | 'GROWTH' | 'BUSINESS' | 'ENTERPRISE' | 'PROFESSIONAL' | 'AGENCY';
  status: 'ACTIVE' | 'SUSPENDED';
  mrrInr: number;
  usersCount: number;
  aiCreditLimit: number;
  aiCreditsUsed: number;
  createdAt: string;
}

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES' | 'VIEWER' | 'CLIENT';
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
  isVerified: boolean;
  createdAt: string;
}

interface AdminPayment {
  id: string;
  orgName: string;
  amountInr: number;
  plan: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  gateway: 'CASHFREE' | 'STRIPE' | 'RAZORPAY';
  date: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  service: 'MAPS_SPIDER' | 'GEMINI_API' | 'AUTH_SVC' | 'EMAIL_NODE' | 'BILLING_GATEWAY';
  message: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  category: 'STABILITY' | 'GEMINI' | 'OUTBOUND' | 'EXPERIMENT';
}

interface SupportTicket {
  id: string;
  orgName: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  description: string;
  createdAt: string;
  messages: {
    sender: 'CLIENT' | 'SUPPORT';
    text: string;
    time: string;
  }[];
}

export function SuperAdminView({ leads, campaigns, appointments, user }: SuperAdminViewProps) {
  const [adminTab, setAdminTab] = useState<'monitoring' | 'infrastructure' | 'orgs' | 'users' | 'payments' | 'ai-usage' | 'campaigns' | 'meetings' | 'reports' | 'tickets' | 'logs' | 'flags'>('monitoring');

  // 1. Initial State: Organizations
  const [organizations, setOrganizations] = useState<AdminOrg[]>([
    { id: 'org-1', name: 'Horizon Media', domain: 'horizonmedia.co', tier: 'PROFESSIONAL', status: 'ACTIVE', mrrInr: 8500, usersCount: 4, aiCreditLimit: 500000, aiCreditsUsed: 125000, createdAt: '2026-01-10 09:30' },
    { id: 'org-2', name: 'Apex Marketing Solutions', domain: 'apexmarketing.in', tier: 'AGENCY', status: 'ACTIVE', mrrInr: 25000, usersCount: 8, aiCreditLimit: 2000000, aiCreditsUsed: 840000, createdAt: '2026-03-15 14:20' },
    { id: 'org-3', name: 'StellarTech Labs', domain: 'stellartech.io', tier: 'BUSINESS', status: 'ACTIVE', mrrInr: 15000, usersCount: 5, aiCreditLimit: 1000000, aiCreditsUsed: 320000, createdAt: '2026-04-02 11:15' },
    { id: 'org-4', name: 'CloudFlow SaaS', domain: 'cloudflowsaas.com', tier: 'GROWTH', status: 'ACTIVE', mrrInr: 6500, usersCount: 3, aiCreditLimit: 250000, aiCreditsUsed: 98000, createdAt: '2026-05-20 16:40' },
    { id: 'org-5', name: 'CyberSec India', domain: 'cybersec.co.in', tier: 'ENTERPRISE', status: 'SUSPENDED', mrrInr: 50000, usersCount: 12, aiCreditLimit: 5000000, aiCreditsUsed: 1450000, createdAt: '2026-02-18 10:00' }
  ]);
  const [searchOrg, setSearchOrg] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');
  const [newOrgTier, setNewOrgTier] = useState<AdminOrg['tier']>('GROWTH');
  const [newOrgLimit, setNewOrgLimit] = useState(500000);

  // 2. Initial State: Users
  const [usersList, setUsersList] = useState<AdminUser[]>([
    { id: 'usr-1', fullName: 'Soham Kharat', email: 'sohamkharat481@gmail.com', companyName: 'Horizon Media', role: 'ADMIN', status: 'ACTIVE', isVerified: true, createdAt: '2026-01-10 09:35' },
    { id: 'usr-2', fullName: 'Ananya Sharma', email: 'ananya@apexmarketing.in', companyName: 'Apex Marketing Solutions', role: 'OWNER', status: 'ACTIVE', isVerified: true, createdAt: '2026-03-15 14:25' },
    { id: 'usr-3', fullName: 'Rohan Mehta', email: 'rohan@stellartech.io', companyName: 'StellarTech Labs', role: 'MANAGER', status: 'ACTIVE', isVerified: true, createdAt: '2026-04-02 11:20' },
    { id: 'usr-4', fullName: 'Sneha Kapoor', email: 'sneha@cloudflow.com', companyName: 'CloudFlow SaaS', role: 'SALES', status: 'ACTIVE', isVerified: false, createdAt: '2026-05-20 16:45' },
    { id: 'usr-5', fullName: 'Vikram Joshi', email: 'v.joshi@cybersec.co.in', companyName: 'CyberSec India', role: 'OWNER', status: 'SUSPENDED', isVerified: true, createdAt: '2026-02-18 10:05' }
  ]);
  const [searchUser, setSearchUser] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('Horizon Media');
  const [newUserRole, setNewUserRole] = useState<AdminUser['role']>('SALES');

  // 3. Initial State: Payments
  const [paymentsList, setPaymentsList] = useState<AdminPayment[]>([
    { id: 'txn-9981', orgName: 'Horizon Media', amountInr: 8500, plan: 'Professional Plan', status: 'SUCCESS', gateway: 'CASHFREE', date: '2026-07-01 10:30' },
    { id: 'txn-9982', orgName: 'Apex Marketing Solutions', amountInr: 25000, plan: 'Agency Plan', status: 'SUCCESS', gateway: 'CASHFREE', date: '2026-07-01 11:15' },
    { id: 'txn-9983', orgName: 'StellarTech Labs', amountInr: 15000, plan: 'Business Plan', status: 'SUCCESS', gateway: 'STRIPE', date: '2026-07-02 09:00' },
    { id: 'txn-9984', orgName: 'CloudFlow SaaS', amountInr: 6500, plan: 'Growth Plan', status: 'FAILED', gateway: 'RAZORPAY', date: '2026-07-03 16:40' },
    { id: 'txn-9985', orgName: 'CyberSec India', amountInr: 50000, plan: 'Enterprise Plan', status: 'REFUNDED', gateway: 'STRIPE', date: '2026-06-15 14:00' }
  ]);
  const [newInvoiceOrg, setNewInvoiceOrg] = useState('Horizon Media');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState(8500);
  const [newInvoicePlan, setNewInvoicePlan] = useState('Professional Plan');

  // 4. Initial State: AI Usage Log
  const [aiUsageList, setAiUsageList] = useState([
    { id: 'ai-req-1', org: 'Horizon Media', apiCall: 'Lead Enrichment', tokens: 1850, model: 'gemini-3.5-flash', status: 'SUCCESS', costInr: 0.15, timestamp: '12 seconds ago' },
    { id: 'ai-req-2', org: 'Apex Marketing Solutions', apiCall: 'Outreach Sequence', tokens: 4200, model: 'gemini-3.5-flash', status: 'SUCCESS', costInr: 0.35, timestamp: '1 minute ago' },
    { id: 'ai-req-3', org: 'StellarTech Labs', apiCall: 'Reply Analysis', tokens: 2400, model: 'gemini-3.5-flash', status: 'SUCCESS', costInr: 0.20, timestamp: '5 minutes ago' },
    { id: 'ai-req-4', org: 'CloudFlow SaaS', apiCall: 'Ask Insights', tokens: 1200, model: 'gemini-3.5-flash', status: 'SUCCESS', costInr: 0.10, timestamp: '15 minutes ago' },
    { id: 'ai-req-5', org: 'Apex Marketing Solutions', apiCall: 'Lead Enrichment', tokens: 9800, model: 'gemini-3.5-pro', status: 'SUCCESS', costInr: 1.85, timestamp: '30 minutes ago' }
  ]);
  const [globalModelWeights, setGlobalModelWeights] = useState({
    'gemini-3.5-flash': 85,
    'gemini-3.5-pro': 15,
    'gemini-2.5-flash': 0
  });

  // 5. Initial State: Support Tickets
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([
    {
      id: 'tkt-401',
      orgName: 'Horizon Media',
      subject: 'Optimize Bangalore SaaS Leads Targeting',
      category: 'Campaign Criteria',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      description: 'We would like to narrow down our target criteria to focus purely on SaaS startups with post-seed funding in the tech corridor.',
      createdAt: '2026-07-03 11:20',
      messages: [
        { sender: 'CLIENT', text: 'We need to focus on startups with seed/A rounds.', time: '2026-07-03 11:20' },
        { sender: 'SUPPORT', text: 'Hi team, understood. I have updated our Google Maps spider to prioritize tech startups with funding parameters. Will share the new lead batch shortly!', time: '2026-07-03 14:15' }
      ]
    },
    {
      id: 'tkt-402',
      orgName: 'CyberSec India',
      subject: 'SMTP Server Node Validation Error',
      category: 'SMTP Integrations',
      priority: 'CRITICAL',
      status: 'OPEN',
      description: 'Our outbound sending node is returning connection timed out when mapping to port 587.',
      createdAt: '2026-07-05 22:10',
      messages: [
        { sender: 'CLIENT', text: 'Our outbound sending node is returning connection timed out when mapping to port 587.', time: '2026-07-05 22:10' }
      ]
    }
  ]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminTicketReply, setAdminTicketReply] = useState('');

  // 6. Initial State: Feature Flags
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    { id: 'flag-1', name: 'Enable Gemini 3.5 Models', key: 'ENABLE_GEMINI_3_5', description: 'Enable route requests to prioritize gemini-3.5-flash.', enabled: true, category: 'GEMINI' },
    { id: 'flag-2', name: 'Live LinkedIn Scraping Bot', key: 'LIVE_LINKEDIN_SCRAPER', description: 'Crawl LinkedIn pages via spider nodes in real-time.', enabled: true, category: 'OUTBOUND' },
    { id: 'flag-3', name: 'Auto-Meeting Booking Engine', key: 'AUTO_MEETING_BOOKING', description: 'Allow AI reply analyzer to inject Google Meet links and register Google calendar hooks.', enabled: true, category: 'STABILITY' },
    { id: 'flag-4', name: 'Cashfree Sandbox Mode', key: 'CASHFREE_SANDBOX', description: 'Toggle between live and sandbox payment gateways in India.', enabled: true, category: 'EXPERIMENT' },
    { id: 'flag-5', name: 'Daily Outbound Email Warm-up', key: 'DAILY_WARMUP_BOT', description: 'Automatically warm up client SMTP ports with artificial seed deliveries.', enabled: false, category: 'OUTBOUND' }
  ]);

  // 7. Initial State: System Logs
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    { id: 'log-101', timestamp: '02:08:24', level: 'INFO', service: 'AUTH_SVC', message: 'Token signed successfully for usr_81927391 (Soham Kharat)' },
    { id: 'log-102', timestamp: '02:09:15', level: 'INFO', service: 'GEMINI_API', message: 'Model gemini-3.5-flash response completed in 410ms. 1250 tokens.' },
    { id: 'log-103', timestamp: '02:11:40', level: 'WARN', service: 'MAPS_SPIDER', message: 'LinkedIn URL rate limits near. Throttling crawling node for 15s.' },
    { id: 'log-104', timestamp: '02:15:02', level: 'INFO', service: 'EMAIL_NODE', message: 'Delivered batch of 45 outbound sequences for Horizon Media' },
    { id: 'log-105', timestamp: '02:18:55', level: 'INFO', service: 'BILLING_GATEWAY', message: 'Webhook received for transaction inv-1004. Marking status PAID.' }
  ]);
  const [liveLogStreaming, setLiveLogStreaming] = useState(true);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Reports Generation States
  const [reportsList, setReportsList] = useState([
    { id: 'rep-x1', name: 'System_Cohort_Churn_Audit_June_2026', type: 'PDF', date: '2026-07-01', size: '2.4 MB' },
    { id: 'rep-x2', name: 'Gemini_API_Token_Invoice_Ledger_Q2', type: 'CSV', date: '2026-06-30', size: '1.1 MB' }
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStep, setCompileStep] = useState('');

  // Live log streamer simulation
  useEffect(() => {
    if (!liveLogStreaming) return;

    const interval = setInterval(() => {
      const logLevels: SystemLog['level'][] = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
      const services: SystemLog['service'][] = ['MAPS_SPIDER', 'GEMINI_API', 'AUTH_SVC', 'EMAIL_NODE', 'BILLING_GATEWAY'];
      const messages = [
        'Google Maps spider fetched 12 startup targets from techpark-bangalore listings.',
        'Gemini response generated successfully for enrichment request. Cost ₹0.22.',
        'Session validation check for tenant group. Status Active.',
        'Outbound queue flushed. 8 emails pushed via SMTP port 587.',
        'API Request logged: GET /api/v1/leads. Status 200.',
        'Billing ledger synchronized. Account balances valid.',
        'Sync task scheduler booked: meeting_link verify checklist.',
        'Security token validation complete. Cryptographic integrity secured.'
      ];

      const newLog: SystemLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        level: logLevels[Math.floor(Math.random() * logLevels.length)],
        service: services[Math.floor(Math.random() * services.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      };

      setSystemLogs(prev => [...prev.slice(-35), newLog]);
      
      // Also simulate occasional AI usage activity in background
      if (Math.random() > 0.6) {
        const orgs = ['Horizon Media', 'Apex Marketing', 'StellarTech Labs', 'CloudFlow SaaS'];
        const apiCalls = ['Lead Enrichment', 'Outreach Sequence', 'Reply Analysis', 'Ask Insights'];
        const tokensVal = Math.floor(Math.random() * 8000) + 1000;
        setAiUsageList(prev => [
          {
            id: `ai-req-${Date.now()}`,
            org: orgs[Math.floor(Math.random() * orgs.length)],
            apiCall: apiCalls[Math.floor(Math.random() * apiCalls.length)],
            tokens: tokensVal,
            model: Math.random() > 0.85 ? 'gemini-3.5-pro' : 'gemini-3.5-flash',
            status: 'SUCCESS',
            costInr: parseFloat((tokensVal * 0.0001).toFixed(2)),
            timestamp: 'Just now'
          },
          ...prev.slice(0, 9)
        ]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [liveLogStreaming]);

  // Scroll logs container to bottom when logs update
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [systemLogs]);

  // Organizations Logic
  const handleToggleOrgStatus = (id: string) => {
    setOrganizations(prev => prev.map(o => {
      if (o.id === id) {
        const nextStatus = o.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        return { ...o, status: nextStatus };
      }
      return o;
    }));
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgDomain.trim()) return;

    const newOrg: AdminOrg = {
      id: `org-${Date.now()}`,
      name: newOrgName,
      domain: newOrgDomain,
      tier: newOrgTier,
      status: 'ACTIVE',
      mrrInr: newOrgTier === 'AGENCY' ? 25000 : newOrgTier === 'BUSINESS' ? 15000 : newOrgTier === 'PROFESSIONAL' ? 8500 : 6500,
      usersCount: 1,
      aiCreditLimit: newOrgLimit,
      aiCreditsUsed: 0,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setOrganizations(prev => [...prev, newOrg]);
    setNewOrgName('');
    setNewOrgDomain('');
  };

  // Users Logic
  const handleToggleUserStatus = (id: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' };
      }
      return u;
    }));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserFullName.trim() || !newUserEmail.trim()) return;

    const newUserObj: AdminUser = {
      id: `usr-${Date.now()}`,
      fullName: newUserFullName,
      email: newUserEmail,
      companyName: newUserCompany,
      role: newUserRole,
      status: 'ACTIVE',
      isVerified: true,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setUsersList(prev => [...prev, newUserObj]);
    setNewUserFullName('');
    setNewUserEmail('');
  };

  // Payments Logic
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const newTxn: AdminPayment = {
      id: `txn-${Math.floor(1000 + Math.random() * 9000)}`,
      orgName: newInvoiceOrg,
      amountInr: Number(newInvoiceAmount),
      plan: newInvoicePlan,
      status: 'SUCCESS',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      gateway: 'CASHFREE'
    };

    setPaymentsList(prev => [newTxn, ...prev]);
  };

  // Support Ticket reply logic
  const handleAdminReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTicketReply.trim() || !selectedTicket) return;

    const timeString = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updatedMessages = [
      ...selectedTicket.messages,
      { sender: 'SUPPORT' as const, text: adminTicketReply.trim(), time: timeString }
    ];

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      status: 'RESOLVED',
      messages: updatedMessages
    };

    setTicketsList(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    setAdminTicketReply('');
  };

  // Compile Super Report logic
  const handleCompileAdminReport = () => {
    setIsCompiling(true);
    setCompileProgress(0);
    const steps = [
      'Extracting aggregate multitenant tables...',
      'Mapping billing logs and Cashfree callback receipts...',
      'Aggregating global token metrics for models/gemini-3.5-flash...',
      'Calculating server response latency across clusters...',
      'Signing SHA-256 Administrative checksum digest...',
      'Compiling production compliance reports...'
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 8;
      const stepIdx = Math.min(Math.floor((currentProgress / 100) * steps.length), steps.length - 1);
      setCompileStep(steps[stepIdx]);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setCompileProgress(100);
        setIsCompiling(false);
        
        const newRep = {
          id: `rep-${Date.now()}`,
          name: `Global_System_Perf_Cohort_${new Date().toISOString().slice(0, 10)}`,
          type: 'PDF',
          date: new Date().toISOString().slice(0, 10),
          size: '3.6 MB'
        };
        setReportsList(prev => [newRep, ...prev]);
      } else {
        setCompileProgress(currentProgress);
      }
    }, 350);
  };

  // Mock download of files
  const handleDownloadFile = (fileName: string) => {
    const content = `SalesPilot Super Administrative Log & Metrics Record\nFile: ${fileName}\nSigned: Security Master Node\nIntegrity: Verified 100%\nTime: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Totals calculations
  const totalOrganizations = organizations.length;
  const activeOrgs = organizations.filter(o => o.status === 'ACTIVE').length;
  const totalUsers = usersList.length;
  const totalMrr = organizations.filter(o => o.status === 'ACTIVE').reduce((s, o) => s + o.mrrInr, 0);
  const totalTokensUsed = organizations.reduce((s, o) => s + o.aiCreditsUsed, 0);

  // Filtered lists
  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(searchOrg.toLowerCase()) || 
    o.domain.toLowerCase().includes(searchOrg.toLowerCase())
  );

  const filteredUsers = usersList.filter(u => 
    u.fullName.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.companyName.toLowerCase().includes(searchUser.toLowerCase())
  );

  // Charts simulated data
  const realTimeLoadData = [
    { name: '02:00', requests: 450, errorRate: 0.1, tokenCount: 15 },
    { name: '02:03', requests: 520, errorRate: 0.0, tokenCount: 22 },
    { name: '02:06', requests: 610, errorRate: 0.2, tokenCount: 38 },
    { name: '02:09', requests: 580, errorRate: 0.0, tokenCount: 29 },
    { name: '02:12', requests: 720, errorRate: 0.5, tokenCount: 41 },
    { name: '02:15', requests: 830, errorRate: 0.0, tokenCount: 52 },
    { name: '02:18', requests: 910, errorRate: 0.1, tokenCount: 61 }
  ];

  const subTabNavigation = [
    { id: 'monitoring', label: 'Monitor Dashboard', icon: Activity },
    { id: 'infrastructure', label: 'Global Infrastructure', icon: Server },
    { id: 'orgs', label: 'Organizations', icon: Building },
    { id: 'users', label: 'Users Manager', icon: Users },
    { id: 'payments', label: 'Payments & Ledger', icon: CreditCard },
    { id: 'ai-usage', label: 'AI Credit Pool', icon: Sparkles },
    { id: 'campaigns', label: 'Global Sequences', icon: Sliders },
    { id: 'meetings', label: 'Demos & Meetings', icon: Calendar },
    { id: 'reports', label: 'Super Reports', icon: FileText },
    { id: 'tickets', label: 'Tickets Center', icon: HelpCircle, badge: ticketsList.filter(t => t.status === 'OPEN').length },
    { id: 'logs', label: 'Event terminal', icon: Terminal },
    { id: 'flags', label: 'Feature Flags', icon: ToggleLeft }
  ];

  return (
    <div id="super_admin_panel_root" className="space-y-8 animate-fade-in text-slate-150">
      
      {/* Super Admin Top Header Banner with retro styling */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
          <Sliders className="w-96 h-96" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-rose-600 text-white font-mono font-bold text-[9px] px-2.5 py-0.5 rounded-full tracking-wider uppercase flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> SUPER ADMIN CONTROL ROOM
            </span>
            <span className="text-slate-500 font-mono text-[10px]">&bull; Server Root: node_cluster_1a</span>
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white flex items-center gap-2">
            Global Systems Master Panel
          </h2>
          <p className="text-sm text-slate-400 max-w-xl">
            Execute root multi-tenant parameters, inspect model weights, adjust feature toggles, refund Cashfree transactions, and audit live Google Maps spider loops.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10 shrink-0 bg-slate-950/60 p-4 border border-slate-850 rounded-xl">
          <div className="text-right">
            <div className="text-[9px] text-slate-500 font-mono">CLUSTER CONTEXT</div>
            <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> ONLINE & SECURED
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-650/15 border border-rose-500/30 flex items-center justify-center font-bold text-lg text-rose-500 shadow-inner">
            SA
          </div>
        </div>
      </div>

      {/* Grid containing navigation & content frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column navigation panel */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl shadow-md space-y-1">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest px-2.5 mb-3 font-semibold">Root Modules</span>
            {subTabNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setAdminTab(item.id as any);
                    setSelectedTicket(null);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    adminTab === item.id 
                      ? 'bg-rose-650 text-white shadow-lg shadow-rose-600/10' 
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${adminTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-rose-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Cpu className="w-4 h-4 text-rose-500" />
              <span>Model Weight Proxy</span>
            </div>
            <div className="space-y-1.5 text-[10px] font-mono text-slate-450">
              <div className="flex justify-between">
                <span>gemini-3.5-flash:</span>
                <span className="text-emerald-400 font-bold">{globalModelWeights['gemini-3.5-flash']}%</span>
              </div>
              <div className="flex justify-between">
                <span>gemini-3.5-pro:</span>
                <span className="text-amber-400 font-bold">{globalModelWeights['gemini-3.5-pro']}%</span>
              </div>
              <div className="flex justify-between">
                <span>gemini-2.5-flash:</span>
                <span className="text-slate-500">{globalModelWeights['gemini-2.5-flash']}%</span>
              </div>
            </div>
            <button 
              onClick={() => setAdminTab('ai-usage')}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-[9px] rounded-lg border border-slate-700 transition"
            >
              Configure Router
            </button>
          </div>
        </div>

        {/* Right column master content Segment based on active sub tab */}
        <div className="lg:col-span-9 space-y-6">

          {/* TAB 1: MONITORING & REAL-TIME ANALYTICS */}
          {adminTab === 'monitoring' && (
            <div className="space-y-6">
              
              {/* Core Real-time Grid Numbers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">MRR Aggregation</div>
                  <div className="text-2xl font-extrabold text-white font-mono">₹{totalMrr.toLocaleString('en-IN')}</div>
                  <div className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">&uarr; 24.2% MoM</div>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">Organizations</div>
                  <div className="text-2xl font-extrabold text-white font-mono">{totalOrganizations} <span className="text-xs text-slate-550">({activeOrgs} live)</span></div>
                  <div className="text-[9px] text-slate-450 font-mono">1 pending migration</div>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">Global Users</div>
                  <div className="text-2xl font-extrabold text-white font-mono">{totalUsers}</div>
                  <div className="text-[9px] text-emerald-400 font-mono font-bold">&bull; 4 active sessions</div>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">Token Pool Used</div>
                  <div className="text-2xl font-extrabold text-white font-mono">{(totalTokensUsed / 1000000).toFixed(2)}M</div>
                  <div className="text-[9px] text-rose-500 font-mono">Quota Cap: 100M limit</div>
                </div>

              </div>

              {/* Server health and latency dial displays */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-950 text-blue-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Node Server Latency</div>
                    <div className="text-lg font-bold text-white font-mono">4.12 ms</div>
                    <div className="text-[9px] text-emerald-400 font-mono">Region: Asia Pacific Cloud Run</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-rose-950 text-rose-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Master CPU Consumption</div>
                    <div className="text-lg font-bold text-white font-mono">24.5%</div>
                    <div className="text-[9px] text-emerald-400 font-mono">Active threads: 128 / 512</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-indigo-950 text-indigo-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">In-Memory Cache Size</div>
                    <div className="text-lg font-bold text-white font-mono">1.84 MB</div>
                    <div className="text-[9px] text-emerald-400 font-mono">No latency database node</div>
                  </div>
                </div>

              </div>

              {/* Real-time Load Traffic Chart */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">Live Traffic Analytics</h3>
                    <p className="text-sm font-bold text-white">API requests/min and total token logs</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span> Requests/min</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500 block"></span> API Tokens (K)</span>
                  </div>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={realTimeLoadData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTok" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 11 }} />
                      <Area type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReq)" />
                      <Area type="monotone" dataKey="tokenCount" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTok)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 1.5: GLOBAL INFRASTRUCTURE & OBSERVABILITY */}
          {adminTab === 'infrastructure' && (
            <div className="space-y-6 animate-fade-in text-slate-300">
              
              {/* Quick Action Controls */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Infrastructure Control Hub</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Control live container routing, trigger backup cron audits, and manage regional server boundaries.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => alert('Hot snapshot of master database cluster initiated. Bundling and routing encrypted GZIP tarball to dual-region secure buckets.')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer"
                  >
                    Backup DB Snapshot
                  </button>
                  <button 
                    onClick={() => {
                      const confirmSim = confirm('Simulate dry-run Disaster Recovery protocol? This will temporarily divert live WebSocket traffic in our Singapore cluster to the Tokyo read replica and execute state validation.');
                      if (confirmSim) {
                        alert('Disaster Recovery Dry-Run Complete. Heartbeat synchronization validation: 100% SUCCESS.');
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold font-mono transition cursor-pointer"
                  >
                    Disaster Recovery Dry-Run
                  </button>
                  <button 
                    onClick={() => alert('Flushing Redis memory cache tables... 12,402 active session variables re-cached.')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer"
                  >
                    Flush Redis Cache
                  </button>
                </div>
              </div>

              {/* Server Nodes grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">Active Regional Cloud Run Clusters</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { region: 'asia-southeast1 (Mumbai)', ip: '34.85.122.90', load: '18.4%', ping: '4ms', status: 'PRIMARY / LEADER' },
                    { region: 'europe-west1 (Dublin)', ip: '104.42.90.18', load: '12.1%', ping: '11ms', status: 'ACTIVE READ-REPLICA' },
                    { region: 'us-east1 (S. Carolina)', ip: '35.12.150.112', load: '24.5%', ping: '8ms', status: 'ACTIVE READ-REPLICA' },
                    { region: 'asia-east2 (Singapore)', ip: '34.90.111.45', load: '8.2%', ping: '5ms', status: 'HOT-FAILOVER STANDBY' }
                  ].map((cluster, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-white font-mono">{cluster.region}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        <p>IP: {cluster.ip}</p>
                        <p>Throughput Load: {cluster.load}</p>
                        <p>Latency: {cluster.ping}</p>
                      </div>
                      <span className="bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 text-[8px] font-bold font-mono rounded block text-center uppercase tracking-wider">
                        {cluster.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentry & OpenTelemetry logs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Sentry Logs */}
                <div className="md:col-span-6 bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Sentry Exception Monitoring</h4>
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 text-[8px] font-mono font-bold rounded">Live Tracker</span>
                  </div>

                  <div className="space-y-3 font-mono text-[9px]">
                    {[
                      { issue: 'UNAUTHORIZED_INTEGRATION_TOKEN', file: '/src/services/api.ts:44', occurrences: '24', status: 'UNRESOLVED' },
                      { issue: 'CASHFREE_CALLBACK_TIMEOUT', file: '/server.ts:382', occurrences: '3', status: 'INVESTIGATING' },
                      { issue: 'REDIS_CONNECTION_REFUSED_RETRY', file: '/server/redis.ts:18', occurrences: '1', status: 'RESOLVED' }
                    ].map((err, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded border border-slate-850 flex justify-between items-center gap-3">
                        <div className="space-y-1">
                          <p className="font-bold text-red-400">{err.issue}</p>
                          <p className="text-slate-500">{err.file}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{err.occurrences} events</p>
                          <span className={`text-[8px] font-bold px-1 rounded ${
                            err.status === 'UNRESOLVED' ? 'bg-red-500/20 text-red-400 animate-pulse' : err.status === 'INVESTIGATING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>{err.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OpenTelemetry & Queue metrics */}
                <div className="md:col-span-6 bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">OpenTelemetry Queue & Worker Threads</h4>
                    <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 text-[8px] font-mono font-bold rounded">Auto-scaled</span>
                  </div>

                  <div className="space-y-3 font-mono text-[10px]">
                    <div className="p-3 bg-slate-950 rounded border border-slate-850 flex justify-between items-center">
                      <span>Outbound Dispatcher Node</span>
                      <div className="text-right text-[11px]">
                        <span className="text-emerald-400 font-bold">8 active instances</span>
                        <p className="text-[9px] text-slate-500">Processing: 410 mails/min</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded border border-slate-850 flex justify-between items-center">
                      <span>Google Maps Spider Broker</span>
                      <div className="text-right text-[11px]">
                        <span className="text-emerald-400 font-bold">12 queue workers</span>
                        <p className="text-[9px] text-slate-500">Load limit: 41.5% allocated</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded border border-slate-850 flex justify-between items-center">
                      <span>Voice TTS Synthesizer Cluster</span>
                      <div className="text-right text-[11px]">
                        <span className="text-amber-400 font-bold">4 active compilers</span>
                        <p className="text-[9px] text-slate-500">Idle thread wait: 12ms</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Slow Query Detection Log */}
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">PostgreSQL Slow Query Audit Logs (Supabase)</h4>
                  <span className="text-[9px] text-slate-500 font-mono">Limit threshold &gt; 100ms</span>
                </div>

                <div className="space-y-2.5 font-mono text-[9px]">
                  {[
                    { duration: '384ms', query: 'SELECT * FROM leads WHERE company_name ILIKE \'%Bangalore%\' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100;', recommendation: 'INDEX_REQUIRED: Create multi-column index on (company_name, deleted_at, created_at)' },
                    { duration: '142ms', query: 'SELECT SUM(amount_inr) FROM payments WHERE status = \'SUCCESS\' AND created_at &gt;= \'2026-07-01\';', recommendation: 'RESOLVED: Index verified on status + created_at' }
                  ].map((sq, i) => (
                    <div key={i} className="p-3 bg-slate-950 rounded border border-slate-850 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-red-400 font-bold">Duration: {sq.duration}</span>
                        <span className="text-emerald-400 text-[8px] font-bold uppercase">{sq.recommendation}</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed overflow-x-auto whitespace-pre">{sq.query}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ORGANIZATIONS MANAGER */}
          {adminTab === 'orgs' && (
            <div className="space-y-6">
              
              {/* Creator & search bar form */}
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Provision New Tenant Organization</h3>
                  <Building className="w-4 h-4 text-slate-450" />
                </div>

                <form onSubmit={handleCreateOrg} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Company Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newOrgName} 
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="e.g. CyberSec India" 
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Corporate Domain</label>
                    <input 
                      type="text" 
                      required 
                      value={newOrgDomain} 
                      onChange={(e) => setNewOrgDomain(e.target.value)}
                      placeholder="e.g. cybersec.co.in" 
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Subscription Tier</label>
                    <select 
                      value={newOrgTier} 
                      onChange={(e: any) => setNewOrgTier(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-bold font-mono"
                    >
                      <option value="FREE_TRIAL">FREE_TRIAL</option>
                      <option value="STARTER">STARTER</option>
                      <option value="GROWTH">GROWTH</option>
                      <option value="PROFESSIONAL">PROFESSIONAL</option>
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="AGENCY">AGENCY</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-1.5 bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" /> Provision Tenant
                  </button>
                </form>
              </div>

              {/* Organization List Grid */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
                
                <div className="p-4 border-b border-slate-850 flex items-center justify-between gap-4">
                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Search tenants..." 
                      value={searchOrg}
                      onChange={(e) => setSearchOrg(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Showing {filteredOrgs.length} tenant organizations</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-[9px] font-mono uppercase text-slate-500 tracking-wider border-b border-slate-850">
                        <th className="py-3 px-5">Organization</th>
                        <th className="py-3 px-5">Tier / Monthly Fee</th>
                        <th className="py-3 px-5">AI Credits Pool</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Root Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {filteredOrgs.map((org) => (
                        <tr key={org.id} className="hover:bg-slate-850/20 text-slate-300">
                          <td className="py-4 px-5">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {org.name}
                              <span className="text-[9px] font-mono text-slate-550">({org.usersCount} users)</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">{org.domain} &bull; Created {org.createdAt.split(' ')[0]}</div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="font-bold font-mono text-rose-400 text-[11px]">{org.tier}</span>
                            <div className="text-[10px] text-slate-400 font-mono">₹{org.mrrInr.toLocaleString('en-IN')}/mo</div>
                          </td>
                          <td className="py-4 px-5 font-mono text-[11px]">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 max-w-xs">
                              <span>{(org.aiCreditsUsed / 1000).toFixed(0)}K / {(org.aiCreditLimit / 1000).toFixed(0)}K</span>
                              <span>{((org.aiCreditsUsed / org.aiCreditLimit) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full max-w-xs h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${org.aiCreditsUsed / org.aiCreditLimit > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${(org.aiCreditsUsed / org.aiCreditLimit) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              org.status === 'ACTIVE' 
                                ? 'bg-emerald-950/40 border-emerald-850 text-emerald-400' 
                                : 'bg-rose-950/40 border-rose-850 text-rose-400'
                            }`}>
                              {org.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button 
                              onClick={() => handleToggleOrgStatus(org.id)}
                              className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded border transition ${
                                org.status === 'ACTIVE'
                                  ? 'border-rose-900 hover:bg-rose-950 text-rose-400'
                                  : 'border-emerald-900 hover:bg-emerald-950 text-emerald-400'
                              }`}
                            >
                              {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: USERS MANAGER */}
          {adminTab === 'users' && (
            <div className="space-y-6">
              
              {/* Add User form card */}
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Register Master Account</h3>
                  <Users className="w-4 h-4 text-slate-450" />
                </div>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newUserFullName} 
                      onChange={(e) => setNewUserFullName(e.target.value)}
                      placeholder="e.g. Divya Nair" 
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={newUserEmail} 
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. divya@horizon.co" 
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Tenant Workspace</label>
                    <select 
                      value={newUserCompany} 
                      onChange={(e) => setNewUserCompany(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-bold font-mono"
                    >
                      {organizations.map(o => (
                        <option key={o.id} value={o.name}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-1.5 bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register Account
                  </button>
                </form>
              </div>

              {/* User Accounts Grid table */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
                
                <div className="p-4 border-b border-slate-850 flex items-center justify-between gap-4">
                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Search accounts..." 
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Showing {filteredUsers.length} total users</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-[9px] font-mono uppercase text-slate-500 tracking-wider border-b border-slate-850">
                        <th className="py-3 px-5">User Profile</th>
                        <th className="py-3 px-5">Organization Node</th>
                        <th className="py-3 px-5">Role Permission</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-850/20 text-slate-300">
                          <td className="py-4 px-5">
                            <div className="font-bold text-white flex items-center gap-2">
                              {u.fullName}
                              {u.isVerified ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" title="Email Verified" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-amber-500" title="Verification Pending" />
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">{u.email}</div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-semibold text-slate-200">{u.companyName}</div>
                            <div className="text-[9px] text-slate-500 font-mono">ID: {u.id}</div>
                          </td>
                          <td className="py-4 px-5 font-mono">
                            <span className="px-2 py-0.5 bg-slate-950 text-indigo-400 font-bold border border-indigo-950 rounded text-[10px]">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              u.status === 'ACTIVE' 
                                ? 'bg-emerald-950/40 border-emerald-850 text-emerald-400' 
                                : 'bg-rose-950/40 border-rose-850 text-rose-400'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right space-x-2">
                            <button 
                              onClick={() => {
                                alert(`Password reset link simulated and sent for ${u.fullName} (${u.email}).`);
                              }}
                              className="px-2 py-1 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded font-mono text-[9px]"
                            >
                              Reset
                            </button>
                            <button 
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`px-2 py-1 font-mono text-[9px] font-bold rounded border transition ${
                                u.status === 'ACTIVE'
                                  ? 'border-rose-900 hover:bg-rose-950 text-rose-400'
                                  : 'border-emerald-900 hover:bg-emerald-950 text-emerald-400'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: PAYMENTS & SUBSCRIPTION LEDGER */}
          {adminTab === 'payments' && (
            <div className="space-y-6">
              
              {/* Quick invoice generation manual form */}
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Inject Manual Callback Transaction (Cashfree API Simulator)</h3>
                  <CreditCard className="w-4 h-4 text-slate-450" />
                </div>

                <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Select Organization</label>
                    <select 
                      value={newInvoiceOrg} 
                      onChange={(e) => setNewInvoiceOrg(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-bold font-mono"
                    >
                      {organizations.map(o => (
                        <option key={o.id} value={o.name}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Amount (INR)</label>
                    <input 
                      type="number" 
                      required 
                      value={newInvoiceAmount} 
                      onChange={(e) => setNewInvoiceAmount(Number(e.target.value))}
                      placeholder="8500" 
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-450 font-bold">Subscription Plan</label>
                    <input 
                      type="text" 
                      required 
                      value={newInvoicePlan} 
                      onChange={(e) => setNewInvoicePlan(e.target.value)}
                      placeholder="Professional Plan" 
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-1.5 bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" /> Push Receipt Ledger
                  </button>
                </form>
              </div>

              {/* Transaction ledger list */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
                
                <div className="p-4 border-b border-slate-850 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase text-slate-450 tracking-wide">Production Transaction Ledger</span>
                  <span className="text-[10px] text-slate-500 font-mono">Gateway webhook callbacks verified</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-[9px] font-mono uppercase text-slate-500 tracking-wider border-b border-slate-850">
                        <th className="py-3 px-5">Transaction ID</th>
                        <th className="py-3 px-5">Organization Node</th>
                        <th className="py-3 px-5">Plan Level</th>
                        <th className="py-3 px-5">Billing Date</th>
                        <th className="py-3 px-5">Gateway</th>
                        <th className="py-3 px-5">Receipt State</th>
                        <th className="py-3 px-5 text-right">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {paymentsList.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-850/20 text-slate-300">
                          <td className="py-4 px-5 font-mono text-[11px] font-semibold text-rose-400">
                            {pay.id}
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-bold text-white">{pay.orgName}</div>
                          </td>
                          <td className="py-4 px-5 font-mono">
                            <div>{pay.plan}</div>
                            <div className="text-[10px] text-emerald-400 font-semibold font-mono">₹{pay.amountInr.toLocaleString('en-IN')}</div>
                          </td>
                          <td className="py-4 px-5 text-slate-400 font-mono text-[10px]">
                            {pay.date}
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-[10px] font-mono font-bold bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-slate-400">
                              {pay.gateway}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              pay.status === 'SUCCESS' 
                                ? 'bg-emerald-950/40 border-emerald-850 text-emerald-400' 
                                : pay.status === 'FAILED'
                                ? 'bg-rose-950/40 border-rose-850 text-rose-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-400'
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            {pay.status === 'SUCCESS' ? (
                              <button 
                                onClick={() => {
                                  setPaymentsList(prev => prev.map(p => p.id === pay.id ? { ...p, status: 'REFUNDED' } : p));
                                  alert(`Refund issued successfully via ${pay.gateway} API for transaction ${pay.id}.`);
                                }}
                                className="px-2 py-0.5 border border-rose-950 hover:bg-rose-950 text-rose-400 rounded font-mono text-[9px]"
                              >
                                Refund
                              </button>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">Settled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: AI USAGE & MODEL WEIGHING */}
          {adminTab === 'ai-usage' && (
            <div className="space-y-6">
              
              {/* Dynamic model weights adjuster */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Dynamic Router Model Allocation</h3>
                    <p className="text-xs text-slate-400">Configure global model prioritization thresholds for multitenant lead profiling requests.</p>
                  </div>
                  <Sliders className="w-5 h-5 text-rose-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-2 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white font-bold">gemini-3.5-flash</span>
                      <span className="text-emerald-400 font-bold">{globalModelWeights['gemini-3.5-flash']}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={globalModelWeights['gemini-3.5-flash']}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGlobalModelWeights(prev => ({
                          ...prev,
                          'gemini-3.5-flash': val,
                          'gemini-3.5-pro': Math.max(0, 100 - val),
                          'gemini-2.5-flash': 0
                        }));
                      }}
                      className="w-full accent-emerald-500"
                    />
                    <div className="text-[10px] text-slate-500 font-mono">High velocity, low cost model. Standard routing option.</div>
                  </div>

                  <div className="space-y-2 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white font-bold">gemini-3.5-pro</span>
                      <span className="text-amber-400 font-bold">{globalModelWeights['gemini-3.5-pro']}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={globalModelWeights['gemini-3.5-pro']}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGlobalModelWeights(prev => ({
                          ...prev,
                          'gemini-3.5-pro': val,
                          'gemini-3.5-flash': Math.max(0, 100 - val),
                          'gemini-2.5-flash': 0
                        }));
                      }}
                      className="w-full accent-amber-500"
                    />
                    <div className="text-[10px] text-slate-500 font-mono">Complex reasoning models for deep corporate intelligence profiles.</div>
                  </div>

                  <div className="space-y-2 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">gemini-2.5-flash</span>
                      <span className="text-slate-500">Disabled</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded" />
                    <div className="text-[10px] text-slate-500 font-mono">Legacy flash models. Staged for deprecation.</div>
                  </div>
                </div>
              </div>

              {/* Live API Requests Counter Table */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
                
                <div className="p-4 border-b border-slate-850 flex justify-between items-center">
                  <span className="text-xs font-bold font-mono uppercase text-slate-450 tracking-wide">Live Gemini API Requests Feed</span>
                  <button 
                    onClick={() => {
                      alert('Clearing visual ledger. Memory count retained.');
                      setAiUsageList([]);
                    }}
                    className="text-[10px] font-mono text-slate-500 hover:text-white"
                  >
                    Clear Feed
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-[9px] font-mono uppercase text-slate-500 tracking-wider border-b border-slate-850">
                        <th className="py-3 px-5">Request ID</th>
                        <th className="py-3 px-5">Organization Node</th>
                        <th className="py-3 px-5">API Interface</th>
                        <th className="py-3 px-5">Model</th>
                        <th className="py-3 px-5">Token Weight</th>
                        <th className="py-3 px-5">Cost (INR)</th>
                        <th className="py-3 px-5 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs font-mono">
                      {aiUsageList.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-850/20 text-slate-350">
                          <td className="py-3.5 px-5 font-semibold text-rose-450 text-[11px]">{req.id}</td>
                          <td className="py-3.5 px-5 font-sans font-bold text-slate-200">{req.org}</td>
                          <td className="py-3.5 px-5 text-indigo-400 text-[10px]">{req.apiCall}</td>
                          <td className="py-3.5 px-5">{req.model}</td>
                          <td className="py-3.5 px-5">{req.tokens.toLocaleString()} tok</td>
                          <td className="py-3.5 px-5 text-emerald-400 font-bold">₹{req.costInr.toFixed(3)}</td>
                          <td className="py-3.5 px-5 text-right text-slate-500 text-[10px]">{req.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: GLOBAL CAMPAIGNS MONITOR */}
          {adminTab === 'campaigns' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">Global Active Sequences</h3>
                <p className="text-xs text-slate-450">Administrative oversight of outbound drip programs initialized by tenant marketing directors.</p>
              </div>

              <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-[9px] font-mono uppercase text-slate-500 tracking-wider border-b border-slate-850">
                        <th className="py-3 px-5">Campaign Name</th>
                        <th className="py-3 px-5">Target Audience</th>
                        <th className="py-3 px-5">Total Sent</th>
                        <th className="py-3 px-5">Open Ratio</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Master Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {campaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-slate-850/20 text-slate-350">
                          <td className="py-4 px-5">
                            <div className="font-bold text-white">{camp.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">ID: {camp.id}</div>
                          </td>
                          <td className="py-4 px-5 font-mono text-[11px] text-slate-400">{camp.targetAudience}</td>
                          <td className="py-4 px-5 font-mono font-semibold">{camp.totalSent || 150}</td>
                          <td className="py-4 px-5 font-mono font-bold text-blue-400">
                            {camp.totalSent ? ((camp.totalOpened / camp.totalSent) * 100).toFixed(1) : 65}%
                          </td>
                          <td className="py-4 px-5">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              camp.status === 'ACTIVE' 
                                ? 'bg-emerald-950/40 border-emerald-850 text-emerald-400' 
                                : 'bg-amber-950/40 border-amber-850 text-amber-400'
                            }`}>
                              {camp.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right space-x-2">
                            <button 
                              onClick={() => {
                                camp.status = camp.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                                alert(`Campaign status updated successfully to ${camp.status}.`);
                                setAdminTab('monitoring');
                                setTimeout(() => setAdminTab('campaigns'), 50);
                              }}
                              className="px-2 py-1 font-mono text-[9px] font-bold rounded border border-rose-950 hover:bg-rose-950 text-rose-400"
                            >
                              {camp.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: DEMOS & MEETING TRACKER */}
          {adminTab === 'meetings' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">Global Booked Meetings</h3>
                <p className="text-xs text-slate-450">Active strategy sessions and prospect alignment slots booked globally across all workspaces.</p>
              </div>

              <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-[9px] font-mono uppercase text-slate-500 tracking-wider border-b border-slate-850">
                        <th className="py-3 px-5">Prospect Contact</th>
                        <th className="py-3 px-5">Company Node</th>
                        <th className="py-3 px-5">DateTime (IST)</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {appointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-slate-850/20 text-slate-350">
                          <td className="py-4 px-5">
                            <div className="font-bold text-white">{apt.leadName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{apt.email}</div>
                          </td>
                          <td className="py-4 px-5 font-semibold text-slate-250">{apt.company}</td>
                          <td className="py-4 px-5 font-mono text-[11px]">
                            {new Date(apt.dateTime).toLocaleDateString()} {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-4 px-5">
                            <span className="px-2 py-0.5 font-mono font-bold text-[10px] bg-emerald-950/40 border border-emerald-850 text-emerald-400 rounded">
                              {apt.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button 
                              onClick={() => {
                                apt.status = 'CANCELLED';
                                alert(`Meeting session for ${apt.leadName} has been cancelled administratively.`);
                                setAdminTab('monitoring');
                                setTimeout(() => setAdminTab('meetings'), 50);
                              }}
                              className="px-2 py-1 border border-rose-950 hover:bg-rose-950 text-rose-400 font-mono text-[9px] rounded"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: SUPER REPORTS COMPILER */}
          {adminTab === 'reports' && (
            <div className="space-y-6">
              
              {/* Compiler panel header */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-500 animate-bounce" /> Administrative Intelligence Compiler
                    </h3>
                    <p className="text-xs text-slate-400">Assemble multi-tenant financial registries, Gemini credit cohorts, and gateway callback statistics.</p>
                  </div>
                  <button 
                    onClick={handleCompileAdminReport}
                    disabled={isCompiling}
                    className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs rounded transition flex items-center gap-1.5 shadow-md shadow-rose-600/10"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} /> Compile System Report
                  </button>
                </div>

                {isCompiling && (
                  <div className="space-y-2 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-rose-400 font-bold">{compileStep}</span>
                      <span className="text-slate-400 font-bold">{compileProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${compileProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Saved reports registry */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-850">
                  <span className="text-xs font-bold font-mono uppercase text-slate-450 tracking-wide">Archived System Digests</span>
                </div>

                <div className="divide-y divide-slate-850">
                  {reportsList.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-850/10 transition">
                      <div className="space-y-1">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-450" />
                          {r.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">FORMAT: <span className="text-rose-400 font-bold">{r.type}</span> &bull; Extracted: {r.date} &bull; Checksum: SHA-256 Valid</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-slate-400">{r.size}</span>
                        <button 
                          onClick={() => handleDownloadFile(r.name)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 transition"
                          title="Download Digest"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 9: TICKETS CENTER */}
          {adminTab === 'tickets' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">Root HelpDesk Support Triage</h3>
                <p className="text-xs text-slate-450">Manage ticket queries raised from customer accounts and active client portals.</p>
              </div>

              {/* Tickets list splitting into workspace console */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Tickets list panel */}
                <div className="md:col-span-5 bg-slate-900 border border-slate-850 rounded-xl overflow-hidden">
                  <div className="p-3 bg-slate-950 border-b border-slate-850 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                    Inbox Support Queue
                  </div>
                  <div className="divide-y divide-slate-850 max-h-120 overflow-y-auto">
                    {ticketsList.map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-4 cursor-pointer hover:bg-slate-850/20 transition text-xs space-y-2 ${
                          selectedTicket?.id === t.id ? 'bg-slate-850/40 border-l-2 border-rose-500' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-slate-200 truncate">{t.orgName}</span>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            t.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border-rose-900' : 'bg-slate-950 text-slate-450 border-slate-850'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                        <div className="font-semibold text-white leading-normal line-clamp-1">{t.subject}</div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>{t.createdAt.split(' ')[0]}</span>
                          <span className="uppercase text-rose-450 font-bold">{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket conversation screen */}
                <div className="md:col-span-7 bg-slate-900 border border-slate-850 rounded-xl overflow-hidden flex flex-col justify-between min-h-120">
                  {selectedTicket ? (
                    <>
                      {/* Ticket header */}
                      <div className="p-4 bg-slate-950 border-b border-slate-850 flex justify-between items-start gap-4">
                        <div>
                          <div className="text-[9px] font-mono text-slate-550 uppercase tracking-widest">TICKET CONSOLE &bull; {selectedTicket.id}</div>
                          <h4 className="font-bold text-white text-sm mt-0.5">{selectedTicket.subject}</h4>
                          <p className="text-[10px] text-slate-400">Organization: <strong className="text-slate-300">{selectedTicket.orgName}</strong></p>
                        </div>
                        <span className="bg-indigo-950 border border-indigo-900 text-indigo-400 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0">
                          {selectedTicket.category}
                        </span>
                      </div>

                      {/* Conversation thread list */}
                      <div className="p-4 flex-1 overflow-y-auto space-y-4 max-h-80 bg-slate-950/20">
                        {selectedTicket.messages.map((m, idx) => (
                          <div key={idx} className={`flex flex-col ${m.sender === 'SUPPORT' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 rounded-xl text-xs max-w-sm ${
                              m.sender === 'SUPPORT' 
                                ? 'bg-rose-650 text-white rounded-tr-none' 
                                : 'bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800'
                            }`}>
                              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">{m.time}</span>
                          </div>
                        ))}
                      </div>

                      {/* Reply form */}
                      <form onSubmit={handleAdminReplyTicket} className="p-4 border-t border-slate-850 bg-slate-950/40">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            required 
                            value={adminTicketReply} 
                            onChange={(e) => setAdminTicketReply(e.target.value)}
                            placeholder="Type resolution message to customer..." 
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                          />
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs rounded transition shadow"
                          >
                            Reply
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                      <HelpCircle className="w-12 h-12 text-slate-700 mb-3" />
                      <p className="text-sm font-semibold">No Ticket Selected</p>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">Select an active customer query from the support triaging queue to reply and mark resolved.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 10: SYSTEM EVENT TERMINAL LOGS */}
          {adminTab === 'logs' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">Production System Logs Terminal</h3>
                  <p className="text-xs text-slate-450">Live background diagnostic monitoring mapping websocket channels and email SMTP delivery.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setLiveLogStreaming(!liveLogStreaming)}
                    className={`px-3 py-1 font-mono text-[10px] font-bold rounded border transition ${
                      liveLogStreaming 
                        ? 'border-emerald-900 text-emerald-400 bg-emerald-950/20' 
                        : 'border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {liveLogStreaming ? 'Streaming...' : 'Stream Paused'}
                  </button>
                  <button 
                    onClick={() => {
                      alert('Clearing visual logger buffer. Master production records persistent.');
                      setSystemLogs([]);
                    }}
                    className="text-[10px] font-mono text-slate-500 hover:text-white"
                  >
                    Clear Logs
                  </button>
                </div>
              </div>

              {/* Retro Terminal Display Card */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl shadow-lg space-y-4">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
                    <span className="text-[10px] text-slate-500 font-mono ml-2">salespilot@master_cluster ~ logs --stream</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">BUFFER: 256 lines</span>
                </div>

                <div 
                  ref={logTerminalRef}
                  className="h-100 overflow-y-auto space-y-1.5 font-mono text-[11px] text-slate-400 leading-normal scrollbar-thin scrollbar-thumb-slate-800"
                >
                  {systemLogs.map((log) => {
                    const levelColors = {
                      INFO: 'text-emerald-400',
                      WARN: 'text-amber-400',
                      ERROR: 'text-rose-500 font-bold',
                      CRITICAL: 'text-rose-600 bg-rose-950/50 px-1 font-extrabold'
                    };
                    return (
                      <div key={log.id} className="hover:bg-slate-900/40 p-0.5 rounded transition flex items-start gap-2">
                        <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className={`shrink-0 font-bold uppercase text-[10px] w-14 ${levelColors[log.level]}`}>
                          {log.level}
                        </span>
                        <span className="text-indigo-400 shrink-0 font-semibold text-[10px] w-28">
                          [{log.service}]
                        </span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                      </div>
                    );
                  })}
                  
                  {systemLogs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-600 font-mono text-xs py-20">
                      Master stream initialized. Waiting for background system transactions...
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 11: MASTER FEATURE FLAGS */}
          {adminTab === 'flags' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">Developer Feature Flags</h3>
                <p className="text-xs text-slate-450">Centralized database toggles to selectively activate preview features and prototype integrations.</p>
              </div>

              {/* Feature Flags Cards list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-white">{flag.name}</h4>
                          <span className="text-[10px] font-mono text-indigo-400 font-bold">{flag.key}</span>
                        </div>
                        <span className="bg-slate-950 border border-slate-850 text-slate-450 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                          {flag.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-normal">{flag.description}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                      <span className="text-[10px] font-mono text-slate-500">Status: <strong className={flag.enabled ? 'text-emerald-400' : 'text-slate-500'}>{flag.enabled ? 'ENABLED' : 'DISABLED'}</strong></span>
                      <button 
                        onClick={() => {
                          setFeatureFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
                          alert(`Feature flag "${flag.name}" state updated dynamically.`);
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                          flag.enabled ? 'bg-emerald-600 flex justify-end' : 'bg-slate-850 flex justify-start border border-slate-800'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white block shadow" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
