import React, { useState } from 'react';
import { 
  Activity, 
  UserPlus, 
  ArrowRightLeft, 
  Award, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  Search, 
  Filter 
} from 'lucide-react';
import { WorkspaceActivity } from '../../types/team-collaboration';

interface TeamActivityFeedProps {
  activities: WorkspaceActivity[];
  loading: boolean;
}

export const TeamActivityFeed: React.FC<TeamActivityFeedProps> = ({
  activities,
  loading
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'MEMBER_INVITED':
      case 'MEMBER_ROLE_CHANGED':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'LEAD_ASSIGNED':
        return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
      case 'DEAL_STAGE_ADVANCED':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'COMMENT_ADDED':
      case 'INTERNAL_NOTE_PINNED':
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case 'PERMISSION_OVERRIDDEN':
      case 'OWNERSHIP_TRANSFERRED':
        return <ShieldCheck className="w-4 h-4 text-rose-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredActivities = activities.filter(act => {
    const matchesFilter = filterType === 'ALL' || act.actionType === filterType;
    const matchesSearch = 
      act.actorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      act.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.targetName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Team Audit & Activity Feed Stream
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time chronological log of teammate actions, lead handoffs, and pipeline progression.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter activity..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="LEAD_ASSIGNED">Lead Assignments</option>
            <option value="DEAL_STAGE_ADVANCED">Deal Progress</option>
            <option value="COMMENT_ADDED">Notes & Mentions</option>
            <option value="MEMBER_INVITED">Team Invites</option>
          </select>
        </div>
      </div>

      {/* Activities Timeline Stream */}
      <div className="space-y-4 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 font-mono">
            No activity records match the selected filter.
          </div>
        ) : (
          filteredActivities.map(act => (
            <div key={act.id} className="relative pl-10 space-y-1">
              <div className="absolute left-3 top-0.5 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                {getEventIcon(act.actionType)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {act.actorName}
                  </span>
                  <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[9px] rounded-md font-bold">
                    {act.actorRole}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(act.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {act.details} <strong className="text-blue-600 dark:text-blue-400 font-mono">{act.targetName}</strong>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
