import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Search, 
  Filter, 
  ArrowRightLeft, 
  Briefcase, 
  Building2, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Send, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { WorkspaceMember, LeadAssignment } from '../../types/team-collaboration';
import { Lead } from '../../types';

interface SharedCrmAndAssignmentsProps {
  user: any;
  leads: Lead[];
  teamMembers: WorkspaceMember[];
  assignmentsHistory: LeadAssignment[];
  onAssignLead: (leadId: string, assignedToUserId: string, note?: string) => Promise<void>;
  loading: boolean;
}

export const SharedCrmAndAssignments: React.FC<SharedCrmAndAssignmentsProps> = ({
  user,
  leads,
  teamMembers,
  assignmentsHistory,
  onAssignLead,
  loading
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assignmentNote, setAssignmentNote] = useState<string>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !assigneeId) return;
    onAssignLead(selectedLeadId, assigneeId, assignmentNote);
    setSelectedLeadId(null);
    setAssigneeId('');
    setAssignmentNote('');
  };

  const filteredLeads = leads.filter(lead => {
    const assignedId = (lead as any).assignedToId || 'UNASSIGNED';
    const matchesAssignee = 
      filterAssignee === 'ALL' || 
      (filterAssignee === 'UNASSIGNED' && (!assignedId || assignedId === 'UNASSIGNED')) ||
      assignedId === filterAssignee;
      
    const matchesSearch = 
      lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAssignee && matchesSearch;
  });

  const unassignedCount = leads.filter(l => !(l as any).assignedToId).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Workload Balancer Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Shared CRM Lead Assignment Engine
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Distribute incoming leads evenly among sales reps, monitor response speed, and maintain an authoritative assignment audit trail.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" /> {unassignedCount} Unassigned Prospects
            </span>
            <span className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-500" /> {leads.length - unassignedCount} Assigned
            </span>
          </div>
        </div>

        {/* Rep Workload Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
          {teamMembers.map(m => {
            const count = leads.filter(l => (l as any).assignedToId === m.userId || (l as any).assignedToId === m.id).length;
            return (
              <button
                key={m.id}
                onClick={() => setFilterAssignee(filterAssignee === m.id ? 'ALL' : m.id)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  filterAssignee === m.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className={`text-[10px] font-mono font-bold truncate ${filterAssignee === m.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  {m.fullName}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold">{m.role}</span>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded-md ${
                    filterAssignee === m.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared Lead List & Assignment Modal Trigger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, email, company..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Rep Assignments</option>
              <option value="UNASSIGNED">Unassigned Only</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.userId || m.id}>{m.fullName} ({m.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="p-4">Lead / Prospect</th>
                <th className="p-4">Company & Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned Sales Rep</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredLeads.map(lead => {
                const assignedMember = teamMembers.find(m => m.userId === (lead as any).assignedToId || m.id === (lead as any).assignedToId);

                return (
                  <tr key={lead.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{lead.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" /> {lead.company}
                      </div>
                      <div className="text-[10px] text-slate-400">{lead.title}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold rounded-md border border-blue-500/20">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {assignedMember ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-[10px] flex items-center justify-center">
                            {assignedMember.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {assignedMember.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono italic text-amber-500">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setAssigneeId((lead as any).assignedToId || '');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Reassign
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal Overlay */}
      {selectedLeadId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-500" /> Assign Lead to Sales Rep
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The assigned teammate will receive an instant notification and gain full CRM edit rights for this prospect.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Select Teammate</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  required
                >
                  <option value="">-- Choose Sales Rep --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.userId || m.id}>{m.fullName} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Assignment Handoff Note (Optional)</label>
                <textarea
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  placeholder="e.g. Prospect requested a demo this Thursday. High intent B2B client."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!assigneeId}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Confirm Lead Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
