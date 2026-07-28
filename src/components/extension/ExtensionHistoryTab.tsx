import React from 'react';
import { Database } from 'lucide-react';

interface ExtensionHistoryTabProps {
  recentExtensionLeads: any[];
}

export function ExtensionHistoryTab({ recentExtensionLeads }: ExtensionHistoryTabProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase">Recent Extension Captures Feed</h3>
        </div>
        <span className="text-xs text-slate-500">{recentExtensionLeads.length} Total Captured</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2.5 px-3">Contact Name</th>
              <th className="py-2.5 px-3">Company</th>
              <th className="py-2.5 px-3">Detected Email</th>
              <th className="py-2.5 px-3">Source URL</th>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">CRM Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {recentExtensionLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white">{lead.name}</td>
                <td className="py-3 px-3 text-slate-300">{lead.company}</td>
                <td className="py-3 px-3 text-emerald-400">{lead.email}</td>
                <td className="py-3 px-3 text-indigo-400 truncate max-w-xs">{lead.sourceUrl}</td>
                <td className="py-3 px-3 text-slate-500">{lead.capturedAt}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
