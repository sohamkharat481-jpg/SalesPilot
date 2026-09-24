import React, { useState, useEffect } from 'react';
import { 
  BarChart2, PhoneCall, PhoneIncoming, PhoneOff, PhoneMissed, 
  Clock, TrendingUp, Users, Building, Filter, RotateCcw, AlertTriangle, Info
} from 'lucide-react';

export const ManualCallingAnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedUserId) params.append('userId', selectedUserId);

      const res = await fetch(`/api/v1/manual-calls/analytics?${params.toString()}`, { headers });
      const data = await res.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || 'Failed to fetch calling analytics.');
      }
    } catch (err) {
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, selectedUserId]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedUserId('');
  };

  const kpis = analytics?.kpis || {};

  return (
    <div className="space-y-6">
      
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Manual Calling Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key metrics & team performance calculated from actual persisted manual call logs.
          </p>
        </div>

        {/* Date & Team Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          />

          {(startDate || endDate || selectedUserId) && (
            <button
              onClick={handleClearFilters}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Calculating call metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center text-sm">{error}</div>
      ) : analytics ? (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            
            {/* Total Calls */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Total Calls</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalCalls || 0}</div>
              <span className="text-[10px] text-slate-400 block">Initiated</span>
            </div>

            {/* Connected */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase block">Connected</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpis.connected || 0}</div>
              <span className="text-[10px] text-emerald-600/70 block">Reached Prospect</span>
            </div>

            {/* No Answer */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-orange-500 uppercase block">No Answer</span>
              <div className="text-2xl font-black text-orange-500">{kpis.noAnswer || 0}</div>
              <span className="text-[10px] text-slate-400 block">Unanswered</span>
            </div>

            {/* Busy */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-red-500 uppercase block">Busy</span>
              <div className="text-2xl font-black text-red-500">{kpis.busy || 0}</div>
              <span className="text-[10px] text-slate-400 block">Line Engaged</span>
            </div>

            {/* Call Back Later */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase block">Call Back</span>
              <div className="text-2xl font-black text-amber-500">{kpis.callBackLater || 0}</div>
              <span className="text-[10px] text-slate-400 block">Scheduled Followup</span>
            </div>

            {/* Interested */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-green-600 dark:text-green-400 uppercase block">Interested</span>
              <div className="text-2xl font-black text-green-600 dark:text-green-400">{kpis.interested || 0}</div>
              <span className="text-[10px] text-green-600/70 block">Qualified Prospect</span>
            </div>

            {/* Meeting Requested */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-purple-600 dark:text-purple-400 uppercase block">Meetings</span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{kpis.meetingRequested || 0}</div>
              <span className="text-[10px] text-purple-600/70 block">Requested</span>
            </div>

          </div>

          {/* Section: Calls over Time & Calls by Outcome */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Calls Over Time Chart List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Calls Over Time</span>
              </h3>

              {(analytics.callsOverTime || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No call activity recorded for this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {(analytics.callsOverTime || []).map((item: any) => {
                    const maxCount = Math.max(...analytics.callsOverTime.map((d: any) => d.total)) || 1;
                    const pct = Math.round((item.total / maxCount) * 100);
                    return (
                      <div key={item.date} className="space-y-1 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.date}</span>
                          <span className="text-slate-500">{item.total} calls ({item.connected} connected)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calls by Outcome Breakdown */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Outcome Distribution</span>
              </h3>

              <div className="space-y-3 text-xs">
                {(analytics.callsByOutcome || []).map((out: any) => (
                  <div key={out.outcome} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{out.outcome}</span>
                      <span className="text-slate-500 font-mono">{out.count} ({out.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        style={{ width: `${out.percentage}%` }}
                        className="bg-emerald-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Section: Team Member Analytics (Workspace Admin/Manager) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Team Member Calling Performance</span>
              </span>
              <span className="text-xs text-slate-400 font-normal">Scoped by workspace RBAC</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="p-3">Team Member</th>
                    <th className="p-3">Total Calls</th>
                    <th className="p-3">Connected</th>
                    <th className="p-3">No Answer</th>
                    <th className="p-3">Busy</th>
                    <th className="p-3">Interested</th>
                    <th className="p-3">Meetings Requested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(analytics.callsByTeamMember || []).map((member: any) => (
                    <tr key={member.userId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <strong className="text-slate-900 dark:text-white block">{member.userName}</strong>
                        {member.email && <span className="text-[10px] text-slate-400">{member.email}</span>}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{member.totalCalls}</td>
                      <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{member.connected}</td>
                      <td className="p-3 font-mono text-orange-500">{member.noAnswer}</td>
                      <td className="p-3 font-mono text-red-500">{member.busy}</td>
                      <td className="p-3 font-mono text-green-600 font-bold">{member.interested}</td>
                      <td className="p-3 font-mono text-purple-600 font-bold">{member.meetingRequested}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Accuracy & Duration Notice */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                <strong>Data Accuracy Guarantee:</strong> All call counts and outcomes are calculated exclusively from real user-recorded call events. Native device calls do not capture duration, which is reported as <em>"Not available"</em>.
              </span>
            </div>
          </div>
        </>
      ) : null}

    </div>
  );
};
