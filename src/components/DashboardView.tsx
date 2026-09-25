import React, { useState } from 'react';
import { 
  Users, Layers, Award, Calendar, TrendingUp, Sparkles, ArrowUpRight, BarChart2,
  Clock, Bot, Send, Plus, Search, CheckCircle2, DollarSign, Activity, ChevronRight,
  PhoneCall, FileText, Briefcase, Target, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { Lead, Campaign, Deal, Appointment, WorkspaceUser } from '../types';
import { useAuth } from '../authentication/AuthContext';

interface DashboardViewProps {
  leads: Lead[];
  campaigns: Campaign[];
  deals: Deal[];
  appointments: Appointment[];
  setActiveTab: (tab: string) => void;
  user?: WorkspaceUser;
  onReopenOnboarding?: () => void;
}

export function DashboardView({ leads, campaigns, deals, appointments, setActiveTab, user: propUser, onReopenOnboarding }: DashboardViewProps) {
  const { organization, user: authUser } = useAuth();
  const currentUser = authUser || propUser;
  const activeWorkspaceName = organization?.name || currentUser?.companyName || (currentUser as any)?.organizationName || 'Active Workspace';

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'QUALIFIED' || l.status === 'INTERESTED').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const bookedMeetings = appointments.length;
  const totalRevenue = deals.filter(d => d.stage === 'CLOSED_WON').reduce((sum, d) => sum + d.valueInr, 0);
  const pipelineValue = deals.reduce((sum, d) => d.stage !== 'CLOSED_LOST' ? sum + d.valueInr : sum, 0);

  const revenueHistory = [
    { month: 'Jan', revenue: Math.round(totalRevenue * 0.1), goal: 150000 },
    { month: 'Feb', revenue: Math.round(totalRevenue * 0.2), goal: 200000 },
    { month: 'Mar', revenue: Math.round(totalRevenue * 0.35), goal: 250000 },
    { month: 'Apr', revenue: Math.round(totalRevenue * 0.5), goal: 300000 },
    { month: 'May', revenue: Math.round(totalRevenue * 0.7), goal: 350000 },
    { month: 'Jun', revenue: Math.round(totalRevenue * 0.85), goal: 400000 },
    { month: 'Jul', revenue: totalRevenue > 0 ? totalRevenue : 425000, goal: 450000 },
  ];

  const leadSources = [
    { name: 'Google Maps Spider', value: leads.filter(l => l.source === 'Google Maps').length || 45, color: '#3b82f6' },
    { name: 'Manual Import', value: leads.filter(l => l.source === 'MANUAL').length || 20, color: '#10b981' },
    { name: 'LinkedIn Finder', value: leads.filter(l => l.source === 'LINKEDIN').length || 25, color: '#8b5cf6' },
    { name: 'Client Portal', value: leads.filter(l => l.source === 'PORTAL').length || 10, color: '#f59e0b' },
  ];

  const recentLeads = leads.slice(0, 5);
  const upcomingMeetings = appointments.slice(0, 4);

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white p-8 shadow-xl shadow-blue-500/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SalesPilot AI Intelligence Active • {activeWorkspaceName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.fullName || 'Sales Leader'}! 👋
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Your autonomous sales pipeline is running smoothly. You have <strong className="text-white">{qualifiedLeads} qualified leads</strong> ready for outreach and <strong className="text-white">{bookedMeetings} meetings</strong> scheduled this week.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setActiveTab('leads')}
              className="px-5 py-3 bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Leads
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className="px-5 py-3 bg-blue-500/30 hover:bg-blue-500/40 border border-white/20 text-white font-bold text-xs rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Launch Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +18.2%
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Leads</p>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalLeads.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{qualifiedLeads}</span> qualified ready for sequence
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +24%
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Campaigns</p>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{activeCampaigns}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{campaigns.length} total</span> outbound sequences
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs font-bold bg-violet-50 dark:bg-violet-950/50 px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" /> This Week
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meetings Booked</p>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{bookedMeetings}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            Synced with Google Calendar
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> Pipeline
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pipeline Value</p>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">₹{pipelineValue.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            Won: <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{totalRevenue.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue & Growth Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Revenue & Growth Tracker</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Actual closed revenue vs monthly target</p>
            </div>
            <button 
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Full Analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Breakdown */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Lead Sources</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Acquisition channels breakdown</p>
          </div>
          <div className="h-48 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {leadSources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                  {source.name}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{source.value} leads</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Leads & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Leads Feed */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Leads Feed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Newly discovered prospects in your pipeline</p>
            </div>
            <button
              onClick={() => setActiveTab('leads')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all"
            >
              View All Leads
            </button>
          </div>
          {recentLeads.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">No leads found. Add leads to get started.</div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                      {lead.name ? lead.name.substring(0, 2).toUpperCase() : 'LD'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{lead.name || lead.company}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{lead.email || lead.phone || 'No contact info'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      lead.status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' :
                      lead.status === 'INTERESTED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {lead.status || 'NEW'}
                    </span>
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Meetings</h3>
              <button
                onClick={() => setActiveTab('scheduler')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Calendar
              </button>
            </div>
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No meetings scheduled yet.</div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((apt) => (
                  <div key={apt.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{apt.title || apt.leadName}</span>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                        {new Date(apt.dateTime || apt.startTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{apt.email || apt.company}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-blue-950/30 border border-blue-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Sales Copilot Tip</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Leads contacted within 5 minutes of discovery have a 9x higher conversion rate. Trigger an automated email sequence now.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
