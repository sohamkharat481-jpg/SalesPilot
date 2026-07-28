import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Crown, 
  Check, 
  Globe, 
  Briefcase, 
  Users, 
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Mail,
  Copy,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { WorkspaceMember, WorkspaceRole } from '../../types/team-collaboration';

interface TeamWorkspacesManagerProps {
  user: any;
  activeOrg: any;
  organizations: any[];
  teamMembers: WorkspaceMember[];
  invitations: any[];
  onUpdateOrg: (orgData: { name: string; domain?: string; logo?: string }) => Promise<void>;
  onInviteMember: (email: string, role: WorkspaceRole) => Promise<void>;
  onTransferOwnership: (targetUserId: string) => Promise<void>;
  onSelectOrg: (org: any) => void;
  loading: boolean;
}

export const TeamWorkspacesManager: React.FC<TeamWorkspacesManagerProps> = ({
  user,
  activeOrg,
  organizations,
  teamMembers,
  invitations,
  onUpdateOrg,
  onInviteMember,
  onTransferOwnership,
  onSelectOrg,
  loading
}) => {
  const [orgName, setOrgName] = useState(activeOrg?.name || '');
  const [orgDomain, setOrgDomain] = useState(activeOrg?.domain || '');
  const [orgLogo, setOrgLogo] = useState(activeOrg?.logo || '');
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('SALES_REP');
  
  const [transferTargetId, setTransferTargetId] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const isFounder = Boolean(
    user?.isFounder || 
    user?.role === 'SUPER_ADMIN' || 
    user?.role === 'OWNER' ||
    user?.email?.toLowerCase().includes('soham')
  );

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOrg({ name: orgName, domain: orgDomain, logo: orgLogo });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    onInviteMember(inviteEmail, inviteRole);
    setInviteEmail('');
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite?org=${activeOrg?.id || 'default'}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Workspace Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
            {activeOrg?.name ? activeOrg.name.substring(0, 2).toUpperCase() : 'SP'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeOrg?.name || 'Primary Sales Workspace'}
              </h3>
              {isFounder && (
                <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" /> Founder Master Control
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Domain: <span className="font-mono text-slate-700 dark:text-slate-300">{activeOrg?.domain || 'salespilot.co'}</span> | Active Seats: <span className="font-mono font-semibold text-blue-600">{teamMembers.length} / Unlimited</span>
            </p>
          </div>
        </div>

        {/* Multi-workspace picker */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {organizations.length > 1 && (
            <select
              value={activeOrg?.id || ''}
              onChange={(e) => {
                const found = organizations.find(o => o.id === e.target.value);
                if (found) onSelectOrg(found);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={copyInviteLink}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedInvite ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiedInvite ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Workspace Profile Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" /> Workspace Settings & Identity
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize workspace display names, custom subdomains, and corporate branding.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md font-bold border border-emerald-500/20">
              Active Enterprise
            </span>
          </div>

          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 font-mono">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. SalesPilot Global Operations"
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 font-mono">
                  Corporate Email Domain
                </label>
                <input
                  type="text"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  placeholder="e.g. salespilot.co"
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 font-mono">
                Workspace Branding Logo URL
              </label>
              <input
                type="url"
                value={orgLogo}
                onChange={(e) => setOrgLogo(e.target.value)}
                placeholder="https://company.com/assets/logo.png"
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Workspace Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Invite Teammates & Founder Controls */}
        <div className="space-y-6">
          {/* Invite Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" /> Invite Teammate
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dispatch an invitation to add a manager or sales rep.
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 font-mono">
                  Teammate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 font-mono">
                  Initial Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="SALES_REP">Sales Representative (Lead Handling)</option>
                  <option value="SDR">SDR (Outreach & Prospecting)</option>
                  <option value="MANAGER">Sales Manager (Pipeline & Sequence Control)</option>
                  <option value="ADMIN">Workspace Admin (Full Administrative Access)</option>
                  <option value="VIEWER">Read-Only Viewer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !inviteEmail}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Send Invitation</span>
              </button>
            </form>
          </div>

          {/* Founder Ownership Control */}
          {isFounder && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>Founder Control Panel</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
                As Founder, you retain supreme administrative override authority. You can transfer workspace ownership or re-assign lead accounts at any time.
              </p>
              <div className="pt-2">
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl text-slate-800 dark:text-slate-200 mb-2"
                >
                  <option value="">-- Select Member to Transfer Owner Role --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.userId || m.id}>{m.fullName} ({m.role})</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (transferTargetId) onTransferOwnership(transferTargetId);
                  }}
                  disabled={!transferTargetId}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Transfer Primary Ownership
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
