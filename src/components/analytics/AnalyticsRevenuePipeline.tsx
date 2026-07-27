import React from 'react';
import { DollarSign, Award, TrendingUp, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  Cell, PieChart, Pie 
} from 'recharts';
import { AnalyticsMetrics, MonthlyTrendPoint } from '../../analytics/analytics-data';
import { Deal } from '../../types';

interface AnalyticsRevenuePipelineProps {
  metrics: AnalyticsMetrics;
  monthlyTrend: MonthlyTrendPoint[];
  deals: Deal[];
}

export function AnalyticsRevenuePipeline({ metrics, monthlyTrend, deals }: AnalyticsRevenuePipelineProps) {
  // Aggregate deal stages
  const stageMap: Record<string, number> = {};
  deals.forEach((d) => {
    stageMap[d.stage] = (stageMap[d.stage] || 0) + (d.valueInr || 0);
  });

  const pieData = Object.keys(stageMap).map((stage) => ({
    name: stage.replace('_', ' '),
    value: stageMap[stage]
  }));

  if (pieData.length === 0) {
    pieData.push(
      { name: 'Qualified', value: 450000 },
      { name: 'Proposal Sent', value: 850000 },
      { name: 'Negotiation', value: 650000 },
      { name: 'Closed Won', value: 840000 }
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Financial Core Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Revenue */}
        <div className="p-5 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-900 border border-emerald-800/50 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-mono font-bold">
            <span>CLOSED REVENUE (ARR)</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{metrics.totalRevenueInr.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" /> +{metrics.monthlyGrowth.revenueGrowth}% MoM Revenue Growth
          </div>
        </div>

        {/* Metric 2: Pipeline Value */}
        <div className="p-5 bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-900 border border-blue-800/50 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-400 text-xs font-mono font-bold">
            <span>TOTAL PIPELINE VALUE</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{metrics.pipelineValueInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {metrics.totalDealsCount} active enterprise pipeline opportunities
          </div>
        </div>

        {/* Metric 3: Win Rate */}
        <div className="p-5 bg-gradient-to-br from-purple-900/30 via-slate-900 to-slate-900 border border-purple-800/50 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-400 text-xs font-mono font-bold">
            <span>WIN RATE</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {metrics.winRate}%
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {metrics.wonDealsCount} won out of {metrics.totalDealsCount} closed deals
          </div>
        </div>
      </div>

      {/* Revenue & Pipeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Monthly Revenue Trend (INR)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Monthly Bookings</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip 
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenueInr" name="Revenue (INR)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Value Distribution Pie Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-500" /> Pipeline Stage Breakdown
            </h3>
            <span className="text-[10px] font-mono text-slate-400">By Deal Stage</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Value']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
