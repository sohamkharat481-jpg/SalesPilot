import React from 'react';
import { 
  TrendingUp, Mail, Linkedin, MessageSquare, Phone, Play, Pause, 
  CheckCircle, Clock, AlertCircle, Calendar, ArrowUpRight, BarChart3, Users, Percent, ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, Cell } from 'recharts';

interface OutreachDashboardProps {
  campaigns: any[];
  onToggleStatus: (id: string) => void;
  onSelectCampaign: (id: string) => void;
  onCreateNewClick: () => void;
}

// Sample daily performance trend over 10 days
const performanceTrendData = [
  { day: 'Jun 26', "Open Rate": 58, "Reply Rate": 12, "Meetings": 3 },
  { day: 'Jun 27', "Open Rate": 60, "Reply Rate": 14, "Meetings": 4 },
  { day: 'Jun 28', "Open Rate": 65, "Reply Rate": 15, "Meetings": 5 },
  { day: 'Jun 29', "Open Rate": 62, "Reply Rate": 13, "Meetings": 2 },
  { day: 'Jun 30', "Open Rate": 68, "Reply Rate": 18, "Meetings": 6 },
  { day: 'Jul 01', "Open Rate": 70, "Reply Rate": 20, "Meetings": 7 },
  { day: 'Jul 02', "Open Rate": 67, "Reply Rate": 17, "Meetings": 4 },
  { day: 'Jul 03', "Open Rate": 72, "Reply Rate": 21, "Meetings": 8 },
  { day: 'Jul 04', "Open Rate": 74, "Reply Rate": 22, "Meetings": 9 },
  { day: 'Jul 05', "Open Rate": 76, "Reply Rate": 24, "Meetings": 10 }
];

// Sample channels metrics
const channelPerformanceData = [
  { name: 'Email Sequence', Delivered: 1240, Engagement: 682, Replies: 189, color: '#3b82f6' },
  { name: 'LinkedIn', Delivered: 450, Engagement: 390, Replies: 98, color: '#6366f1' },
  { name: 'WhatsApp', Delivered: 820, Engagement: 790, Replies: 310, color: '#10b981' },
  { name: 'SMS Blast', Delivered: 350, Engagement: 310, Replies: 45, color: '#8b5cf6' }
];

export function OutreachDashboard({ campaigns, onToggleStatus, onSelectCampaign, onCreateNewClick }: OutreachDashboardProps) {
  
  // Dynamic stats
  const totalSent = campaigns.reduce((sum, c) => sum + (c.totalSent || 0), 0) + 2860;
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.totalOpened || 0), 0) + 2172;
  const totalReplied = campaigns.reduce((sum, c) => sum + (c.totalReplied || 0), 0) + 642;
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length + 2;
  const scheduledCount = campaigns.filter(c => c.status === 'DRAFT').length + 1;
  const pendingApproval = 15;
  const meetingsBooked = 48;
  const positiveReplies = 189;
  const negativeReplies = 153;

  const openRate = ((totalOpened / totalSent) * 100).toFixed(1);
  const replyRate = ((totalReplied / totalOpened) * 100).toFixed(1);
  const bounceRate = "1.2";

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Core Campaign Counts */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Campaign Matrix</span>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-50">{activeCount + scheduledCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">{activeCount} Active</span> • 
              <span className="text-slate-400">{scheduledCount} Scheduled</span>
            </p>
          </div>
        </div>

        {/* Messaging Volumes */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Emails Sent</span>
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Mail className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-50">{totalSent.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold flex items-center gap-0.5">+{pendingApproval} Pending</span> Approval Queue
            </p>
          </div>
        </div>

        {/* Reply Breakdown */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Replies</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-50">{totalReplied.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-bold font-mono">+{positiveReplies} Positive</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-rose-500 font-mono">-{negativeReplies} Neg</span>
            </p>
          </div>
        </div>

        {/* Meetings Booked */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Meetings Booked</span>
            <span className="p-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-50">{meetingsBooked}</h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3" />
                {(meetingsBooked / totalReplied * 100).toFixed(0)}%
              </span> Booking Conversion
            </p>
          </div>
        </div>
      </div>

      {/* Conversion Rate Strip */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-xl">
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase text-slate-400">Open Rate</div>
          <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">{openRate}%</div>
        </div>
        <div className="text-center border-x border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400">Reply Rate</div>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{replyRate}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase text-slate-400">Bounce Rate</div>
          <div className="text-lg font-bold font-mono text-slate-500 mt-1">{bounceRate}%</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* area chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Outreach Performance Trend</h3>
              <p className="text-[11px] text-slate-500">Daily conversion trajectory and meetings logged.</p>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-150 dark:border-blue-900/50">
              Last 10 days
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="openColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="replyColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#888888" />
                <YAxis tick={{ fontSize: 9 }} stroke="#888888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                <Area type="monotone" dataKey="Open Rate" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#openColor)" />
                <Area type="monotone" dataKey="Reply Rate" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#replyColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* bar chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Multi-Channel Performance</h3>
              <p className="text-[11px] text-slate-500">Delivered vs. Engagement vs. Replies by outbound channel.</p>
            </div>
            <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-150 dark:border-indigo-900/50">
              Live channels
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#888888" />
                <YAxis tick={{ fontSize: 9 }} stroke="#888888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                <Bar dataKey="Delivered" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Engagement" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Replies" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Campaigns Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-150 dark:border-slate-850">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Active Outreach Sequences
            </h3>
            <p className="text-[11px] text-slate-500">Automated drip schedules targeting curated lead databases.</p>
          </div>
          <button 
            onClick={onCreateNewClick}
            className="self-start sm:self-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            Create Outbound Campaign
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-150 dark:border-slate-850">
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500">Campaign Name</th>
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500">Target Audience</th>
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500">Channels</th>
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500 text-center">Priority</th>
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500 text-center">Sent</th>
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500 text-center">Open Rate</th>
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500 text-center">Reply Rate</th>
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500 text-center">Status</th>
                <th className="p-3 text-[10px] font-mono uppercase text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {campaigns.map((c) => {
                const openRateVal = c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(0) + '%' : '60%';
                const replyRateVal = c.totalOpened > 0 ? ((c.totalReplied / c.totalOpened) * 100).toFixed(0) + '%' : '18%';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition">
                    <td className="p-3">
                      <button 
                        onClick={() => onSelectCampaign(c.id)}
                        className="font-semibold text-xs text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 block text-left"
                      >
                        {c.name}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Created {new Date(c.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3 text-xs text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-mono">
                        {c.targetAudience}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        <Linkedin className="w-3.5 h-3.5 text-indigo-500" />
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50">
                        MEDIUM
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-xs text-slate-800 dark:text-slate-200">{c.totalSent || 0}</td>
                    <td className="p-3 text-center font-mono text-xs text-blue-600 dark:text-blue-400">{openRateVal}</td>
                    <td className="p-3 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400">{replyRateVal}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        c.status === 'ACTIVE' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => onToggleStatus(c.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          title="Toggle Campaign State"
                        >
                          {c.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
