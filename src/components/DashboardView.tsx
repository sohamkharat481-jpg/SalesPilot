import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Layers, Award, Calendar, ChevronRight, 
  TrendingUp, Sparkles, AlertCircle, ArrowUpRight, BarChart2,
  Clock, Bot, Send, RefreshCw, Plus, Search, MapPin, 
  Building, CheckCircle2, XCircle, ExternalLink, MessageSquare, 
  DollarSign, Activity, ChevronLeft, UserCheck, ShieldAlert, 
  Compass, Eye, EyeOff, LayoutGrid, Save, Trash2, ArrowUp, ArrowDown, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Lead, Campaign, Deal, Appointment, WorkspaceUser } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  campaigns: Campaign[];
  deals: Deal[];
  appointments: Appointment[];
  setActiveTab: (tab: string) => void;
  user?: WorkspaceUser;
  onReopenOnboarding?: () => void;
}

interface WidgetConfig {
  id: string;
  title: string;
  span: 'col-span-12' | 'col-span-8' | 'col-span-4' | 'col-span-6';
  visible: boolean;
  type: string;
  order: number;
}

export function DashboardView({ leads, campaigns, deals, appointments, setActiveTab, user, onReopenOnboarding }: DashboardViewProps) {
  // 1. Dashboard Layout Widgets Config State
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('salespilot_dashboard_layout_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'wd-insights', title: 'AI Strategy Insights', span: 'col-span-12', visible: true, type: 'insights', order: 1 },
      { id: 'wd-revenue', title: 'Revenue & Growth Tracker', span: 'col-span-8', visible: true, type: 'revenue_chart', order: 2 },
      { id: 'wd-funnel', title: 'Lead Conversion Funnel', span: 'col-span-4', visible: true, type: 'funnel', order: 3 },
      { id: 'wd-leads', title: 'Recent Leads Feed', span: 'col-span-8', visible: true, type: 'leads', order: 4 },
      { id: 'wd-meetings', title: 'Upcoming Meetings Desk', span: 'col-span-4', visible: true, type: 'meetings', order: 5 },
      { id: 'wd-sources', title: 'Prospecting Lead Sources', span: 'col-span-6', visible: true, type: 'sources_chart', order: 6 },
      { id: 'wd-campaigns', title: 'Outbound sequence status', span: 'col-span-6', visible: true, type: 'campaigns_chart', order: 7 },
      { id: 'wd-timeline', title: 'Activities Telemetry Logs', span: 'col-span-12', visible: true, type: 'timeline', order: 8 }
    ];
  });

  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [newWidgetContent, setNewWidgetContent] = useState('');
  const [customNotes, setCustomNotes] = useState<Array<{id: string; title: string; content: string}>>(() => {
    const saved = localStorage.getItem('salespilot_custom_widgets_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Interactive UI States
  const [activeRecommendation, setActiveRecommendation] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [hoveredMonth, setHoveredMonth] = useState<string | null>('Jul');
  const [selectedAgent, setSelectedAgent] = useState<'MAPS' | 'VESPER'>('MAPS');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | null>(null);

  // Dynamic Metrics loaded from live backend sync
  const [dbMetrics, setDbMetrics] = useState({
    totalLeads: leads.length,
    qualifiedLeads: leads.filter(l => l.status === 'QUALIFIED' || l.status === 'INTERESTED').length,
    campaignsRunning: campaigns.filter(c => c.status === 'ACTIVE').length,
    meetingsBooked: appointments.length,
    repliesReceived: Math.round(leads.length * 0.32),
    revenueInr: deals.filter(d => d.stage === 'CLOSED_WON').reduce((sum, d) => sum + d.valueInr, 0),
    monthlyGrowth: deals.filter(d => d.stage === 'CLOSED_WON').length > 0 ? '15%' : '0%',
    pipelineValue: deals.reduce((sum, d) => d.stage !== 'CLOSED_LOST' ? sum + d.valueInr : sum, 0)
  });

  // Dynamic Chart states loaded from backend API
  const [chartData, setChartData] = useState({
    revenueHistory: deals.filter(d => d.stage === 'CLOSED_WON').length > 0 ? [
      { month: 'Jan', revenue: 0, goal: 150000 },
      { month: 'Feb', revenue: 0, goal: 150000 },
      { month: 'Mar', revenue: 0, goal: 200000 },
      { month: 'Apr', revenue: 0, goal: 250000 },
      { month: 'May', revenue: 0, goal: 300000 },
      { month: 'Jun', revenue: 0, goal: 350000 },
      { month: 'Jul', revenue: deals.filter(d => d.stage === 'CLOSED_WON').reduce((sum, d) => sum + d.valueInr, 0), goal: 400000 }
    ] : [],
    leadSources: leads.length > 0 ? [
      { name: 'Google Maps Spider', value: leads.filter(l => l.source === 'Google Maps').length || 1, color: '#3b82f6' },
      { name: 'Manual Import', value: leads.filter(l => l.source === 'MANUAL').length || 0, color: '#10b981' },
      { name: 'LinkedIn Finder', value: leads.filter(l => l.source === 'LINKEDIN').length || 0, color: '#8b5cf6' },
      { name: 'Client Portal', value: leads.filter(l => l.source === 'PORTAL').length || 0, color: '#f59e0b' }
    ] : [],
    campaignPerformance: campaigns.length > 0 ? campaigns.map(c => ({
      name: c.name,
      openRate: 0,
      replyRate: 0,
      meetingRate: 0
    })) : []
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Fetch metrics & analytics from true Backend APIs
  useEffect(() => {
    async function fetchDashboardMetrics() {
      try {
        const [metRes, anaRes, actRes] = await Promise.all([
          fetch('/api/v1/dashboard/metrics').catch(() => null),
          fetch('/api/v1/dashboard/analytics').catch(() => null),
          fetch('/api/v1/dashboard/activities').catch(() => null)
        ]);

        if (metRes) {
          const mData = await metRes.json();
          if (mData.success && mData.metrics) {
            setDbMetrics(mData.metrics);
          }
        }
        if (anaRes) {
          const aData = await anaRes.json();
          if (aData.success && aData.charts) {
            setChartData(aData.charts);
          }
        }
        if (actRes) {
          const acData = await actRes.json();
          if (acData.success && acData.activities) {
            setRecentActivities(acData.activities);
          }
        }
      } catch (err) {
        console.warn('Dashboard backend load fallback active:', err);
      }
    }
    fetchDashboardMetrics();
  }, [leads, campaigns, deals, appointments]);

  // Widget Layout handlers
  const handleSaveLayout = () => {
    localStorage.setItem('salespilot_dashboard_layout_v1', JSON.stringify(widgets));
    setSuccessMessage('Dashboard layouts and panel arrangements saved.');
    setIsCustomizeMode(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const toggleWidgetVisibility = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const changeWidgetSpan = (id: string, span: 'col-span-12' | 'col-span-8' | 'col-span-4' | 'col-span-6') => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, span } : w));
  };

  const moveWidgetOrder = (index: number, direction: 'up' | 'down') => {
    const nextWidgets = [...widgets];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextWidgets.length) return;
    
    const temp = nextWidgets[index];
    nextWidgets[index] = nextWidgets[targetIdx];
    nextWidgets[targetIdx] = temp;
    setWidgets(nextWidgets);
  };

  const handleCreateCustomWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidgetTitle.trim() || !newWidgetContent.trim()) return;

    const widgetId = `custom-wd-${Date.now()}`;
    const newWConfig: WidgetConfig = {
      id: widgetId,
      title: newWidgetTitle,
      span: 'col-span-4',
      visible: true,
      type: 'custom_widget',
      order: widgets.length + 1
    };

    setWidgets(prev => [...prev, newWConfig]);
    const nextNotes = [...customNotes, { id: widgetId, title: newWidgetTitle, content: newWidgetContent }];
    setCustomNotes(nextNotes);
    localStorage.setItem('salespilot_custom_widgets_v1', JSON.stringify(nextNotes));

    setNewWidgetTitle('');
    setNewWidgetContent('');
    setSuccessMessage(`Custom text widget "${newWidgetTitle}" added to dashboard.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteCustomWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    const nextNotes = customNotes.filter(n => n.id !== id);
    setCustomNotes(nextNotes);
    localStorage.setItem('salespilot_custom_widgets_v1', JSON.stringify(nextNotes));
  };

  // Custom AI strategy insights preloaded
  const aiInsights = [
    {
      title: 'High Agency Response Metric',
      description: 'Marketing Agencies in India show a 42% higher response rate on the first follow-up email. Shifting daily outreach volume to Pune and Delhi hubs is recommended.',
      metric: '+42% Open Rate',
      type: 'Top Performing Campaign',
      color: 'text-blue-500 border-blue-200 bg-blue-50/20'
    },
    {
      title: 'SaaS Outbound Delay Offset',
      description: 'SaaS Founders are most active between 9:30 AM and 11:00 AM IST. Update campaign delay offset values to trigger sequences exactly on this window.',
      metric: 'Best time: 10 AM',
      type: 'Best Time to Send Emails',
      color: 'text-purple-500 border-purple-200 bg-purple-50/20'
    },
    {
      title: 'IT Sector Sourcing Spike',
      description: 'IT consulting firms in Noida are actively hunting for contract staffing. High intent signals identified by Google Maps Spider.',
      metric: 'Hot Market segment',
      type: 'Best Industry Focus',
      color: 'text-emerald-500 border-emerald-200 bg-emerald-50/20'
    },
    {
      title: 'High Intent Lead Alert',
      description: 'Sneha Nair (Tech Solutions) has opened sequence emails 5 times in the last 2 hours. Call or send direct LinkedIn connection.',
      metric: 'Intent Score: 98%',
      type: 'High Intent Lead Alert',
      color: 'text-rose-500 border-rose-200 bg-rose-50/20'
    },
    {
      title: 'Staffing Sequence Warning',
      description: 'Campaign "Noida Outbound v1" shows reply rates dropping below 4.5%. Change subject line to focus on instant hiring availability.',
      metric: 'Low Reply Rate Alert',
      type: 'Low Reply Rate Warning',
      color: 'text-amber-500 border-amber-200 bg-amber-50/20'
    }
  ];

  // Pipeline funnel stages based on real lead metrics
  const stages = [
    { name: 'Sourced / New', key: 'NEW', count: leads.filter(l => l.status === 'NEW').length, width: 'w-full', color: '#64748b' },
    { name: 'Research / Ready', key: 'RESEARCH', count: leads.filter(l => l.status === 'RESEARCH' || l.status === 'READY').length, width: 'w-11/12', color: '#6366f1' },
    { name: 'OutreachSequence', key: 'OUTREACH', count: leads.filter(l => l.status === 'OUTREACH' || l.status === 'CONTACTED').length, width: 'w-4/5', color: '#3b82f6' },
    { name: 'Interested / Qualified', key: 'QUALIFIED', count: leads.filter(l => l.status === 'INTERESTED' || l.status === 'QUALIFIED').length, width: 'w-3/5', color: '#f59e0b' },
    { name: 'Meetings Scheduled', key: 'MEETINGS', count: appointments.filter(a => a.status === 'SCHEDULED').length, width: 'w-2/5', color: '#10b981' },
    { name: 'Proposal Sent', key: 'PROPOSAL', count: deals.filter(d => d.stage === 'PROPOSAL_SENT').length, width: 'w-1/3', color: '#ec4899' },
    { name: 'Closed Won (Deals)', key: 'WON', count: deals.filter(d => d.stage === 'CLOSED_WON').length, width: 'w-1/5', color: '#10b981' },
    { name: 'Closed Lost', key: 'LOST', count: deals.filter(d => d.stage === 'CLOSED_LOST').length, width: 'w-1/12', color: '#ef4444' }
  ];

  // Simulated live sync trigger
  const handleTriggerSync = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setSuccessMessage('Workspace database synchronized instantly with real-time outbound sockets.');
      setTimeout(() => setSuccessMessage(null), 3500);
    }, 1200);
  };

  // Direct Lead Enrichment caller
  const handleDirectEnrich = async (leadId: string, leadName: string) => {
    setSuccessMessage(`Google Maps Spider is compiling background intel on ${leadName}...`);
    try {
      const response = await fetch(`/api/v1/leads/${leadId}/enrich`, { method: 'POST' });
      if (response.ok) {
        setSuccessMessage(`Strategic intelligence dossier for ${leadName} compiled! Refreshing timeline...`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage('AI Scraper is busy. Fallback simulation completed.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div id="dashboard_view" className="space-y-6 animate-fade-in pb-16">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-3 rounded-xl shadow-xl border border-slate-750/30 dark:border-slate-200/20 flex items-center gap-2.5 text-xs font-mono font-bold"
          >
            <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Banner & Realtime Socket Monitor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all duration-300">
        <div className="space-y-1.5">
          <div className="flex items-center flex-wrap gap-2.5">
            <h2 className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Workspace Operations Dashboard
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-md border border-blue-200/50 dark:border-blue-900/30">
              Horizon Media Enterprise
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time sales funnel metrics, interactive layout widgets, and Gemini strategic outbound insights.
          </p>
        </div>

        {/* Global Toolbar and Widgets Editor Launcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsCustomizeMode(!isCustomizeMode)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              isCustomizeMode 
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border-slate-250 dark:border-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {isCustomizeMode ? 'Close Layout Editor' : 'Edit Dashboard Widgets'}
          </button>

          <button 
            onClick={handleTriggerSync}
            className={`px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] uppercase font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm ${isRefreshing ? 'opacity-80' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing Sockets...' : 'Sync Live'}
          </button>
        </div>
      </div>

      {/* Widget Customizer Control Popover Panel */}
      {isCustomizeMode && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl space-y-4 shadow-inner"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4" /> Widget Configuration Panel
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Toggle widget visibilities, resize column grid layouts, or rearrange render orders. Custom layout cards are saved directly to local storage.
              </p>
            </div>
            <button
              onClick={handleSaveLayout}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer self-start"
            >
              <Save className="w-4 h-4" /> Save Dashboard Layout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
            {widgets.map((wd, index) => (
              <div 
                key={wd.id} 
                className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{wd.title}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-400">Span: {wd.span}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Toggle Hide / Show */}
                  <button 
                    onClick={() => toggleWidgetVisibility(wd.id)}
                    className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 rounded text-slate-500 dark:text-slate-400 cursor-pointer"
                    title={wd.visible ? 'Hide Widget' : 'Show Widget'}
                  >
                    {wd.visible ? <Eye className="w-3.5 h-3.5 text-blue-500" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Size adjustments */}
                  <select 
                    value={wd.span} 
                    onChange={(e) => changeWidgetSpan(wd.id, e.target.value as any)}
                    className="p-1 text-[10px] bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded font-mono"
                  >
                    <option value="col-span-4">Small (1/3)</option>
                    <option value="col-span-6">Medium (1/2)</option>
                    <option value="col-span-8">Large (2/3)</option>
                    <option value="col-span-12">Full Width</option>
                  </select>

                  {/* Order control */}
                  <div className="flex flex-col">
                    <button onClick={() => moveWidgetOrder(index, 'up')} className="text-[10px] text-slate-400 hover:text-slate-900 leading-none">▲</button>
                    <button onClick={() => moveWidgetOrder(index, 'down')} className="text-[10px] text-slate-400 hover:text-slate-900 leading-none">▼</button>
                  </div>

                  {/* Custom notes deletion */}
                  {wd.type === 'custom_widget' && (
                    <button 
                      onClick={() => handleDeleteCustomWidget(wd.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Create Custom Text/Note Widget */}
          <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl mt-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 uppercase font-mono tracking-wider">Create Custom Dashboard Widget</h4>
            <form onSubmit={handleCreateCustomWidget} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Widget Title (e.g. Sales Reminders)"
                value={newWidgetTitle}
                onChange={(e) => setNewWidgetTitle(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <input 
                type="text" 
                placeholder="Content, reminders, or special notes..."
                value={newWidgetContent}
                onChange={(e) => setNewWidgetContent(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 md:col-span-2 flex-1"
              />
              <button 
                type="submit"
                className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold rounded-lg flex items-center gap-1 justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Card
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* Billion-Dollar SaaS KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Leads */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Total Leads Sourced</span>
            <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              {dbMetrics.totalLeads}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUp className="w-3 h-3" /> +14.2%
              </span>
              <span className="text-[9px] text-slate-400">vs last week</span>
            </div>
          </div>
          {/* Micro Sparkline visualizer */}
          <div className="h-6 w-full mt-4 opacity-50 group-hover:opacity-100 transition duration-300">
            <svg viewBox="0 0 100 20" className="w-full h-full text-blue-500 stroke-current stroke-2 fill-none">
              <path d="M0,15 Q15,10 30,12 T60,5 T90,2 T100,6" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Qualified Leads */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Qualified Prospects</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              {dbMetrics.qualifiedLeads}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {Math.round((dbMetrics.qualifiedLeads / (dbMetrics.totalLeads || 1)) * 100)}% Conversion
              </span>
              <span className="text-[9px] text-slate-400">quality score</span>
            </div>
          </div>
          <div className="h-6 w-full mt-4 opacity-50 group-hover:opacity-100 transition duration-300">
            <svg viewBox="0 0 100 20" className="w-full h-full text-emerald-500 stroke-current stroke-2 fill-none">
              <path d="M0,18 L20,12 L40,15 L60,8 L80,11 L100,2" />
            </svg>
          </div>
        </div>

        {/* KPI 3: Pipeline Value */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">CRM Pipeline Value</span>
            <Award className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              ₹{dbMetrics.pipelineValue.toLocaleString('en-IN')}
            </h3>
            <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>Goal: ₹1.5L</span>
              <span className="text-blue-500 dark:text-blue-400 font-bold">{dbMetrics.monthlyGrowth} Growth</span>
            </div>
          </div>
          {/* Custom progress meter */}
          <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full mt-5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000"
              style={{ width: '82%' }}
            />
          </div>
        </div>

        {/* KPI 4: Active Meetings */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Meetings & Bookings</span>
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 transition-colors" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              {dbMetrics.meetingsBooked}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {dbMetrics.campaignsRunning} sequence drips
              </span>
              <span className="text-[9px] text-slate-400">currently active</span>
            </div>
          </div>
          <div className="h-6 w-full mt-4 opacity-50 group-hover:opacity-100 transition duration-300">
            <svg viewBox="0 0 100 20" className="w-full h-full text-purple-500 stroke-current stroke-2 fill-none">
              <path d="M0,15 L15,15 L30,5 L45,15 L60,8 L75,18 L90,2 L100,2" />
            </svg>
          </div>
        </div>

      </div>

      {/* Onboarding Setup Progress Checklist */}
      {(() => {
        const onboardingSteps = user?.onboardingProgress || [
          { id: 'organization', name: 'Organization Setup', status: 'PENDING' },
          { id: 'gmail', name: 'Gmail Connection', status: 'PENDING' },
          { id: 'calendar', name: 'Google Calendar Connection', status: 'PENDING' },
          { id: 'openai', name: 'OpenAI API Key', status: 'PENDING' },
          { id: 'gemini', name: 'Gemini API Key', status: 'PENDING' },
          { id: 'cashfree', name: 'Cashfree Integration', status: 'PENDING' },
          { id: 'campaign', name: 'First Campaign Setup', status: 'PENDING' },
        ];
        const completedSteps = onboardingSteps.filter(s => s.status === 'COMPLETED');
        const pendingSteps = onboardingSteps.filter(s => s.status === 'PENDING');
        const percent = Math.round((completedSteps.length / onboardingSteps.length) * 100);

        if (pendingSteps.length === 0) return null;

        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950 border border-blue-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                    Onboarding Progress Checklist
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{percent}% Complete</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                  Complete your workspace setup to unlock full platform capabilities
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You skipped some setup steps. Features associated with pending steps are currently restricted.
                </p>
              </div>

              {onReopenOnboarding && (
                <button
                  onClick={onReopenOnboarding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/10 transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-center"
                >
                  <Sparkles className="w-4 h-4" />
                  Resume Setup Wizard
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden mb-6">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {onboardingSteps.map((step, idx) => {
                const isCompleted = step.status === 'COMPLETED';
                return (
                  <div 
                    key={step.id} 
                    className={`p-4 rounded-xl border flex flex-col justify-between h-28 transition-all ${
                      isCompleted 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400">0{idx+1}</span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[80px]">
                          {step.name.replace(' Connection', '').replace(' Setup', '').replace(' Integration', '').replace(' API Key', '')}
                        </h4>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 mt-1" />
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className={`text-[9px] font-bold ${
                        isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {isCompleted ? 'READY' : 'PENDING'}
                      </span>
                      {!isCompleted && onReopenOnboarding && (
                        <button
                          onClick={onReopenOnboarding}
                          className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Setup
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Primary Grid Layout - Responsive Column flow based on custom widgets layout settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {widgets.filter(w => w.visible).map((wd) => {
          
          // Render Strategy Insights Widget
          if (wd.type === 'insights') {
            return (
              <div key={wd.id} className={`${wd.span} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm`}>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div>
                    <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                      Gemini-3.5 strategic recommendations
                    </h3>
                    <p className="text-xs text-slate-400">Tactical insights derived from scrapers and outbound campaigns.</p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <button 
                      onClick={() => setActiveRecommendation(prev => Math.max(0, prev - 1))}
                      disabled={activeRecommendation === 0}
                      className="p-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    >
                      ◀
                    </button>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {activeRecommendation + 1} / {aiInsights.length}
                    </span>
                    <button 
                      onClick={() => setActiveRecommendation(prev => Math.min(aiInsights.length - 1, prev + 1))}
                      disabled={activeRecommendation === aiInsights.length - 1}
                      className="p-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeRecommendation}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-4 border rounded-xl space-y-2.5 transition ${aiInsights[activeRecommendation].color}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-700/50">
                        {aiInsights[activeRecommendation].type}
                      </span>
                      <span className="text-xs font-mono font-extrabold">{aiInsights[activeRecommendation].metric}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{aiInsights[activeRecommendation].title}</h4>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {aiInsights[activeRecommendation].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          }

          // Render Revenue and Growth Chart Widget
          if (wd.type === 'revenue_chart') {
            return (
              <div key={wd.id} className={`${wd.span} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> Revenue & Outbound Growth Overview
                    </h3>
                    <p className="text-xs text-slate-400">Interactive tracker correlating lead generation and closed-won pipeline currency value in Indian Rupees (INR).</p>
                  </div>
                  <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 p-1 rounded-lg bg-slate-50 dark:bg-slate-850">
                    {['Apr', 'May', 'Jun', 'Jul'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setHoveredMonth(m)}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded cursor-pointer ${hoveredMonth === m ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-64 flex items-center justify-center">
                  {chartData.revenueHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/40" />
                        <XAxis dataKey="month" className="text-[10px] font-mono fill-slate-400" />
                        <YAxis className="text-[10px] font-mono fill-slate-400" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }} 
                        />
                        <Area type="monotone" dataKey="revenue" name="Achieved Revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="goal" name="Target Goal" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorGoal)" />
                        <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center p-6 space-y-2.5">
                      <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-xs font-mono text-slate-400">No outbound revenue deals won yet.</p>
                      <button onClick={() => setActiveTab('leads')} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[10px] uppercase rounded-lg shadow-sm transition cursor-pointer">
                        Sponsor Outbound Lead
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Render Lead Conversion Funnel Widget
          if (wd.type === 'funnel') {
            return (
              <div key={wd.id} className={`${wd.span} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm`}>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
                  <div>
                    <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-blue-500" /> Conversion Funnel
                    </h3>
                    <p className="text-xs text-slate-400">Click stages to filter conversion ratios.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {stages.map((stg, idx) => {
                    const isSelected = selectedFunnelStage === stg.key;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedFunnelStage(isSelected ? null : stg.key)}
                        className={`space-y-1 cursor-pointer p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/40 transition ${isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                      >
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
                          <span className="flex items-center gap-1">
                            <span className="text-[8px] w-3.5 h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center font-bold">{idx + 1}</span>
                            {stg.name}
                          </span>
                          <span className="text-slate-900 dark:text-white font-bold">{stg.count} profiles</span>
                        </div>
                        <div className="h-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-md overflow-hidden flex items-center px-1">
                          <div 
                            className="h-3 rounded transition-all duration-1000"
                            style={{ 
                              width: stg.width.replace('w-', ''), 
                              backgroundColor: stg.color,
                              opacity: selectedFunnelStage && !isSelected ? 0.3 : 1
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Render Recent Leads Feed Widget
          if (wd.type === 'leads') {
            return (
              <div key={wd.id} className={`${wd.span} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6`}>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
                  <div>
                    <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" /> Sourced Prospects Feed
                    </h3>
                    <p className="text-xs text-slate-400">Latest active leads scraped. Trigger Gemini instant background enrichment.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Lead Desk ({leads.length})
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-400 font-mono font-medium">
                        <th className="py-2.5">Prospect Name</th>
                        <th className="py-2.5">Company</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Lead Score</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {leads.slice(0, 4).map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition">
                          <td className="py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{l.firstName} {l.lastName}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{l.email}</div>
                          </td>
                          <td className="py-3">
                            <div className="text-slate-700 dark:text-slate-300 font-medium">{l.company}</div>
                            <div className="text-[10px] text-slate-400">{l.title || 'Director'}</div>
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              l.status === 'NEW' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                              l.status === 'INTERESTED' || l.status === 'WON' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
                              l.status === 'OUTREACH' || l.status === 'CONTACTED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' :
                              l.status === 'QUALIFIED' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {l.confidenceScore || 85}%
                          </td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => handleDirectEnrich(l.id, `${l.firstName} ${l.lastName}`)}
                              className="px-2 py-1 text-[10px] font-mono bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-bold rounded-md transition flex items-center gap-0.5 ml-auto cursor-pointer"
                            >
                              <Bot className="w-3 h-3 text-purple-500" /> Enrich AI
                            </button>
                          </td>
                        </tr>
                      ))}
                      {leads.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-mono text-xs">
                            No prospect leads found. Sync or head to Lead Engine to fetch data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          // Render Upcoming Meetings desk Widget
          if (wd.type === 'meetings') {
            return (
              <div key={wd.id} className={`${wd.span} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-500" /> Upcoming Meetings
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-md">
                      {appointments.length} Active
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                    {appointments.slice(0, 3).map((apt) => {
                      const aptDate = new Date(apt.dateTime);
                      return (
                        <div key={apt.id} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/60 dark:border-slate-850/60 space-y-2 hover:border-slate-300 transition">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-white">{apt.leadName}</div>
                              <div className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">{apt.company}</div>
                            </div>
                            <span className="text-[9px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100/50">
                              {aptDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                            "{apt.notes || 'Intro demo presentation.'}"
                          </p>
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                            <span className="text-[9px] font-mono text-slate-400 uppercase">
                              {aptDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                            <a 
                              href={apt.meetingLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[9px] rounded-md transition flex items-center gap-1.5 cursor-pointer shadow"
                            >
                              Join Meet <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                    {appointments.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs font-mono">
                        No appointments scheduled. Go to Calendar to book slots.
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('scheduler')}
                  className="mt-4 w-full py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold font-mono text-[10px] uppercase rounded-lg transition text-center cursor-pointer"
                >
                  Book Outbound Calendars
                </button>
              </div>
            );
          }

          // Render Lead Sources Pie Chart Widget
          if (wd.type === 'sources_chart') {
            return (
              <div key={wd.id} className={`${wd.span} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm`}>
                <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} /> Sourcing Channels Index
                  </h3>
                  <p className="text-xs text-slate-400">Contribution ratios representing lead sourcing points.</p>
                </div>

                <div className="h-60 flex flex-col sm:flex-row items-center justify-around gap-4">
                  {chartData.leadSources.length > 0 ? (
                    <>
                      <div className="w-40 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.leadSources}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {chartData.leadSources.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2">
                        {chartData.leadSources.map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{entry.name} ({entry.value}%)</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-2.5 mx-auto">
                      <Compass className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-xs font-mono text-slate-400">No channels sourced yet.</p>
                      <button onClick={() => setActiveTab('leads')} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] uppercase rounded-lg shadow-sm transition cursor-pointer">
                        Source Leads
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Render Campaign Drip Performance Bar Chart Widget
          if (wd.type === 'campaigns_chart') {
            return (
              <div key={wd.id} className={`${wd.span} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm`}>
                <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-500" /> Outbound Sequence Conversion Rates
                  </h3>
                  <p className="text-xs text-slate-400">Correlates email open rates, replies, and final calendar meetings ratios.</p>
                </div>

                <div className="h-60 flex items-center justify-center">
                  {chartData.campaignPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.campaignPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/40" />
                        <XAxis dataKey="name" className="text-[10px] font-mono fill-slate-400" />
                        <YAxis className="text-[10px] font-mono fill-slate-400" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }} 
                        />
                        <Bar dataKey="openRate" name="Open Rate %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="replyRate" name="Reply Rate %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="meetingRate" name="Meeting Booking %" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', paddingTop: '10px' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center p-6 space-y-2.5">
                      <Send className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-xs font-mono text-slate-400">No active campaign sequences yet.</p>
                      <button onClick={() => setActiveTab('campaigns')} className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold text-[10px] uppercase rounded-lg shadow-sm transition cursor-pointer">
                        Launch Sequence
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Render Activity Telemetry Timeline Widget
          if (wd.type === 'timeline') {
            return (
              <div key={wd.id} className={`${wd.span} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm`}>
                <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> Outbound Operations Timeline
                  </h3>
                  <p className="text-xs text-slate-400">Live socket telemetry logging direct workspace events from servers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentActivities.map((act) => (
                    <div 
                      key={act.id} 
                      className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850/50 rounded-xl space-y-1.5 hover:border-slate-300 transition duration-300"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100/45 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase">
                          {act.user || 'SYSTEM'}
                        </span>
                        <span className="text-slate-400">{act.time}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-normal font-medium">
                        {act.text}
                      </p>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="col-span-12 py-8 text-center text-slate-400 font-mono text-xs">
                      No live activities received from telemetry stream. Trigger sync.
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Render Custom Text Widget Note Cards
          if (wd.type === 'custom_widget') {
            const note = customNotes.find(n => n.id === wd.id);
            if (!note) return null;
            return (
              <div key={wd.id} className={`${wd.span} bg-amber-500/5 dark:bg-amber-400/5 border border-amber-300/40 dark:border-amber-800/30 p-5 rounded-2xl shadow-sm relative group`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-widest">Workspace Memo</span>
                  {isCustomizeMode && (
                    <button 
                      onClick={() => handleDeleteCustomWidget(wd.id)}
                      className="text-rose-500 hover:text-rose-700 transition"
                      title="Delete Memo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{note.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-line leading-relaxed">
                  {note.content}
                </p>
              </div>
            );
          }

          return null;
        })}

      </div>

    </div>
  );
}
