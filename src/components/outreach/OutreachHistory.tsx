import React, { useState } from 'react';
import { 
  Clock, Search, Mail, Linkedin, MessageSquare, Calendar, Check, 
  Trash, Eye, ArrowUpRight, ShieldCheck, RefreshCw, AlertCircle
} from 'lucide-react';

interface OutreachHistoryProps {
  history: any[];
}

export function OutreachHistory({ history }: OutreachHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');

  const filtered = history.filter(item => {
    const matchesChannel = channelFilter === 'ALL' || item.type === channelFilter;
    const matchesSearch = 
      item.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.event.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const getEventIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'EMAIL':
        return (
          <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-150 dark:border-blue-900/40">
            <Mail className="w-4 h-4" />
          </span>
        );
      case 'LINKEDIN':
        return (
          <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-150 dark:border-indigo-900/40">
            <Linkedin className="w-4 h-4" />
          </span>
        );
      case 'WHATSAPP':
        return (
          <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-150 dark:border-emerald-900/40">
            <MessageSquare className="w-4 h-4" />
          </span>
        );
      case 'CALENDAR':
        return (
          <span className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-150 dark:border-purple-900/40">
            <Calendar className="w-4 h-4" />
          </span>
        );
      default:
        return (
          <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-150 dark:border-slate-800">
            <Clock className="w-4 h-4" />
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sent':
      case 'Delivered':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50';
      case 'Opened':
      case 'Replied':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'Meeting Booked':
        return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm">
        <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-850 p-1 border border-slate-200 dark:border-slate-800 rounded-lg self-start">
          {[
            { id: 'ALL', label: 'All Audits' },
            { id: 'EMAIL', label: 'Emails' },
            { id: 'LINKEDIN', label: 'LinkedIn' },
            { id: 'WHATSAPP', label: 'WhatsApp' },
            { id: 'CALENDAR', label: 'Meetings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setChannelFilter(tab.id)}
              className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-md transition cursor-pointer ${
                channelFilter === tab.id 
                  ? 'bg-slate-900 text-white dark:bg-slate-800' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search history, logs, leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none w-full font-medium"
          />
        </div>
      </div>

      {/* Visual Timeline Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-5 md:p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Outbound Audits Logbook</h3>
          <p className="text-[11px] text-slate-500">Chronological list of all system actions, dispatches, replies, and books.</p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            No history logs found matching filters.
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6">
            {filtered.map((item, index) => (
              <div key={item.id} className="relative">
                {/* Node marker */}
                <span className="absolute -left-[37px] top-0.5 z-10">
                  {getEventIcon(item.type)}
                </span>

                {/* Log item details */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/30 p-4 border border-slate-200/60 dark:border-slate-850 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.event}</span>
                      <span className="text-[10px] text-slate-400 font-mono">|</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{item.leadName}</span>
                      <span className="text-[10px] text-slate-400">({item.company})</span>
                    </div>

                    <p className="text-xs text-slate-500 font-mono leading-relaxed max-w-xl">
                      {item.details}
                    </p>

                    <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
