import React from 'react';
import { 
  Users, TrendingUp, Calendar, Mail, MessageSquare, ArrowUpRight, 
  Sparkles, Layers, BarChart2, CheckCircle2 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell 
} from 'recharts';
import { AnalyticsMetrics, FunnelStageData, MonthlyTrendPoint } from '../../analytics/analytics-data';

interface AnalyticsOverviewProps {
  metrics: AnalyticsMetrics;
  funnelData: FunnelStageData[];
  monthlyTrend: MonthlyTrendPoint[];
}

export function AnalyticsOverview({ metrics, funnelData, monthlyTrend }: AnalyticsOverviewProps) {
  const funnelColors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Top 6 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Leads Generated */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-blue-500/50 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Leads Generated</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.totalLeads.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" /> +{metrics.monthlyGrowth.leadsGrowth}% MoM
          </div>
        </div>

        {/* Card 2: Conversion Rate */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500/50 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.conversionRate}%
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            {metrics.qualifiedLeads} qualified
          </div>
        </div>

        {/* Card 3: Meetings Booked */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-purple-500/50 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Meetings Booked</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.meetingsBooked}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" /> +{metrics.monthlyGrowth.meetingsGrowth}% vs prev
          </div>
        </div>

        {/* Card 4: Emails Sent */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-emerald-500/50 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Emails Sent</span>
            <Mail className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.emailsSent.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            100% verified SMTP
          </div>
        </div>

        {/* Card 5: Replies Received */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-amber-500/50 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Replies Received</span>
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.repliesReceived}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-bold">
            {metrics.responseRate}% reply rate
          </div>
        </div>

        {/* Card 6: Response Rate */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-rose-500/50 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Response Rate</span>
            <Sparkles className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.responseRate}%
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            4.2x B2B benchmark
          </div>
        </div>
      </div>

      {/* Responsive Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Lead & Email Growth Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" /> Monthly Growth Trajectory
            </h3>
            <span className="text-[10px] font-mono text-slate-400">6-Month Trend</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fillOpacity={1} fill="url(#leadGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Stage Visualization */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Sales Funnel Conversion Stage
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Lead-to-Won Conversion</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="stage" type="category" width={110} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Volume" radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
