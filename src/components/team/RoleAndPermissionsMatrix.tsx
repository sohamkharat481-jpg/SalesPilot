import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  Search, 
  Crown, 
  UserCheck, 
  Users, 
  Plus, 
  RefreshCw 
} from 'lucide-react';
import { WorkspaceMember, WorkspaceRole } from '../../types/team-collaboration';

interface RoleAndPermissionsMatrixProps {
  user: any;
  teamMembers: WorkspaceMember[];
  permissionMatrix: any[];
  permissionsList: Array<{ id: string; key: string; name: string; category: string; description: string }>;
  onTogglePermission: (memberId: string, permissionId: string, currentAllowed: boolean) => Promise<void>;
  onUpdateMemberRole: (memberId: string, newRole: WorkspaceRole) => Promise<void>;
  onUpdateMemberStatus: (memberId: string, status: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
  loading: boolean;
}

export const RoleAndPermissionsMatrix: React.FC<RoleAndPermissionsMatrixProps> = ({
  user,
  teamMembers,
  permissionMatrix,
  permissionsList,
  onTogglePermission,
  onUpdateMemberRole,
  onUpdateMemberStatus,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'CRM', 'CAMPAIGN', 'WORKFLOW', 'TEAM', 'SETTINGS'];

  const isFounder = Boolean(
    user?.isFounder || 
    user?.role === 'SUPER_ADMIN' || 
    user?.role === 'OWNER' ||
    user?.email?.toLowerCase().includes('soham')
  );

  const filteredPermissions = permissionsList.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.key.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRoleBadge = (role: WorkspaceRole) => {
    switch (role) {
      case 'FOUNDER':
      case 'OWNER':
        return <span className="px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold rounded-full flex items-center gap-1"><Crown className="w-3 h-3" /> FOUNDER</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold rounded-full">ADMIN</span>;
      case 'MANAGER':
        return <span className="px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold rounded-full">MANAGER</span>;
      case 'SALES_REP':
      case 'SDR':
        return <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-full">SALES</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 text-[10px] font-mono font-bold rounded-full">VIEWER</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Enterprise Permission Matrix & RBAC
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure fine-grained access rules for leads, deals, campaign sequences, automated workflows, and billing operations.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter permissions..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permissions Matrix Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="p-4 min-w-[220px]">Permission Key & Description</th>
                <th className="p-4 w-24">Category</th>
                {teamMembers.map(member => (
                  <th key={member.id} className="p-4 text-center min-w-[140px] border-l border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                        {member.fullName}
                      </span>
                      {getRoleBadge(member.role)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredPermissions.map(perm => (
                <tr key={perm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4 space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-white font-mono">{perm.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{perm.description}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px] rounded-md font-bold">
                      {perm.category}
                    </span>
                  </td>
                  {teamMembers.map(member => {
                    const row = permissionMatrix.find(r => r.memberId === member.id);
                    const isAllowed = row?.permissions?.[perm.id] ?? (member.role === 'ADMIN' || member.role === 'OWNER' || member.role === 'FOUNDER');
                    const isMemberFounder = member.role === 'FOUNDER' || member.role === 'OWNER';

                    return (
                      <td key={member.id} className="p-4 text-center border-l border-slate-100 dark:border-slate-800">
                        {isMemberFounder ? (
                          <div className="inline-flex items-center gap-1 text-amber-500 font-bold font-mono text-[10px]" title="Founder rights are permanently locked">
                            <Lock className="w-3.5 h-3.5" /> Full Access
                          </div>
                        ) : (
                          <button
                            onClick={() => onTogglePermission(member.id, perm.id, isAllowed)}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                              isAllowed 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' 
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20'
                            }`}
                            title={isAllowed ? 'Click to revoke' : 'Click to grant'}
                          >
                            {isAllowed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Role Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map(member => (
          <div key={member.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-blue-600">
                  {member.fullName ? member.fullName.substring(0, 2).toUpperCase() : 'TM'}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{member.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{member.email}</div>
                </div>
              </div>
              {getRoleBadge(member.role)}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Change Access Level</label>
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) => onUpdateMemberRole(member.id, e.target.value as WorkspaceRole)}
                  disabled={member.role === 'FOUNDER' || member.role === 'OWNER'}
                  className="flex-1 text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none disabled:opacity-50"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="SALES_REP">SALES_REP</option>
                  <option value="SDR">SDR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>

                <button
                  onClick={() => onUpdateMemberStatus(member.id, member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                  disabled={member.role === 'FOUNDER' || member.role === 'OWNER'}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 ${
                    member.status === 'ACTIVE'
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400'
                  }`}
                >
                  {member.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
