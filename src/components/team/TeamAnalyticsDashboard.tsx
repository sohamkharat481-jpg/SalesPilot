import React from 'react';
import { 
  TrendingUp, 
  Award, 
  Users, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Crown, 
  ArrowUpRight 
} from 'lucide-react';
import { WorkspaceMember } from '../../types/team-collaboration';
import { Lead, Deal } from '../../types';

interface TeamAnalyticsDashboardProps {
  teamMembers: WorkspaceMember[];
  leads: Lead[];
  deals: Deal[];
  loading: boolean;
}

export const TeamAnalyticsDashboard: React.FC<TeamAnalyticsDashboardProps> = ({
  teamMembers,
  leads,
  deals,
  loading
}) => {
  // Compute team performance per member
  const memberStats = teamMembers.map(m => {
    const assignedLeads = leads.filter(l => (l as any).assignedToId === m.userId || (l as any).assignedToId === m.id);
    const contactedLeads = assignedLeads.filter(l => l.status === 'CONTACTED' || l.status === 'MEETING_BOOKED' || l.status === 'WON');
    const memberDeals = deals.filter(d => (d as any).assignedToId === m.userId || (d as any).assignedToId === m.id);
    const wonDeals = memberDeals.filter(d => d.stage === 'CLOSED_WON');
    
    const wonRevenue = wonDeals.reduce((sum, d) => sum + d.valueInr, 0);
    const pipelineValue = memberDeals.reduce((sum, d) => sum + d.valueInr, 0);
    const conversion = assignedLeads.length > 0 ? Math.round((wonDeals.length / assignedLeads.length) * 100) : 0;

    return {
      ...m,
      assignedCount: assignedLeads.length,
      contactedCount: contactedLeads.length,
      wonDealsCount: wonDeals.length,
      wonRevenueInr: wonRevenue,
      pipelineValueInr: pipelineValue,
      conversionRate: conversion
    };
  }).sort((a, b) => b.wonRevenueInr - a.wonRevenueInr);

  const totalWonRevenue = memberStats.reduce((sum, m) => sum + m.wonRevenueInr, 0);
  const totalPipeline = deals.reduce((sum, d) => sum + d.valueInr, 0);
  const topPerformer = memberStats[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Key Metrics Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Team Revenue Won</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            ₹{totalWonRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Top team closing performance
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Total Active Pipeline</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            ₹{totalPipeline.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-blue-600 font-mono font-bold">
            Across {deals.length} deals in motion
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Top Performing Rep</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {topPerformer ? topPerformer.fullName : 'Soham Kharat'}
          </div>
          <div className="text-[10px] text-amber-600 font-mono font-bold">
            ₹{topPerformer ? topPerformer.wonRevenueInr.toLocaleString('en-IN') : '0'} won
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Active Team Seats</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {teamMembers.length} Reps
          </div>
          <div className="text-[10px] text-purple-600 font-mono font-bold">
            Enterprise RBAC enabled
          </div>
        </div>
      </div>

      {/* Team Rep Leaderboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Sales Rep Performance Leaderboard
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of deal win rates, revenue closed, and prospect conversion efficiency.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="p-4">Rank & Sales Rep</th>
                <th className="p-4">Role</th>
                <th className="p-4">Assigned Prospects</th>
                <th className="p-4">Deals Won</th>
                <th className="p-4">Conversion Rate</th>
                <th className="p-4 text-right">Revenue Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {memberStats.map((rep, idx) => (
                <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4 flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{rep.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rep.email}</div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                    {rep.role}
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {rep.assignedCount}
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {rep.wonDealsCount}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(rep.conversionRate, 100)}%` }} />
                      </div>
                      <span className="font-mono text-xs font-bold text-blue-600">{rep.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹{rep.wonRevenueInr.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
