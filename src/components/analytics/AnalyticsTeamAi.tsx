import React from 'react';
import { Bot, Cpu, Users, Award, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { AnalyticsMetrics, TeamMemberPerformance } from '../../analytics/analytics-data';

interface AnalyticsTeamAiProps {
  metrics: AnalyticsMetrics;
  teamMembers: TeamMemberPerformance[];
}

export function AnalyticsTeamAi({ metrics, teamMembers }: AnalyticsTeamAiProps) {
  return (
    <div className="space-y-6">
      {/* AI Usage & Cost Efficiency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Token Usage */}
        <div className="p-5 bg-gradient-to-br from-purple-900/30 via-slate-900 to-slate-900 border border-purple-800/50 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-400 text-xs font-mono font-bold">
            <span>AI TOKENS PROCESSED</span>
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {(metrics.aiTokensUsed / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {metrics.aiInvocations.toLocaleString()} total model inferences
          </div>
        </div>

        {/* Cost Savings */}
        <div className="p-5 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-900 border border-emerald-800/50 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-mono font-bold">
            <span>ESTIMATED SDR COST SAVINGS</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{metrics.aiCostSavedInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 font-bold">
            Replaces ~3.5 full-time SDR manual roles
          </div>
        </div>

        {/* Autonomous Autonomy Rate */}
        <div className="p-5 bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-900 border border-blue-800/50 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-400 text-xs font-mono font-bold">
            <span>AUTONOMOUS AUTONOMY RATE</span>
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            86%
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Zero-touch lead enrichment & sequence generation
          </div>
        </div>
      </div>

      {/* Team & AI Agent Performance Leaderboard Table */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> Hybrid Team & AI SDR Leaderboard
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Human vs AI Productivity</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 font-semibold">Rep / Agent</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Leads Handled</th>
                <th className="pb-3 font-semibold">Meetings Booked</th>
                <th className="pb-3 font-semibold">Revenue Generated</th>
                <th className="pb-3 font-semibold">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {member.isAiAgent ? (
                      <span className="p-1 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                        <Bot className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {member.name}
                  </td>
                  <td className="py-3 text-slate-500">{member.role}</td>
                  <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {member.leadsHandled.toLocaleString()}
                  </td>
                  <td className="py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                    {member.meetingsBooked}
                  </td>
                  <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{member.revenueGeneratedInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 font-mono">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {member.winRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
