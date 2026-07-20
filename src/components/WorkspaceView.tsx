import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Bell, 
  FileText, 
  Search, 
  Plus, 
  UserPlus, 
  Trash2, 
  Lock, 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Globe, 
  ArrowRight, 
  RefreshCw, 
  Activity, 
  TrendingUp, 
  Check, 
  UserMinus,
  Briefcase,
  HelpCircle,
  Copy,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkspaceViewProps {
  user: any;
  onRefreshUser?: () => void;
}

export default function WorkspaceView({ user, onRefreshUser }: WorkspaceViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'org' | 'team' | 'permissions' | 'audit' | 'notifications'>('org');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [activeOrg, setActiveOrg] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [orgLogo, setOrgLogo] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Sales Representative');
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');

  // UI helpers
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaceData();
  }, [user]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Organizations
      const orgsRes = await fetch('/api/v1/workspace/organizations');
      const orgsData = await orgsRes.json();
      if (orgsData.success) {
        setOrganizations(orgsData.organizations);
        const current = orgsData.organizations.find((o: any) => o.id === user?.organizationId) || orgsData.organizations[0];
        setActiveOrg(current);
        if (current) {
          setOrgName(current.name || '');
          setOrgDomain(current.domain || '');
          setOrgLogo(current.logo || '');
        }
      }

      // 2. Fetch Team Members & Invitations
      const membersRes = await fetch('/api/v1/team/invite'); // backported or general team
      const membersData = await membersRes.json();
      // Or fetch from active organization context
      const teamRes = await fetch('/api/v1/workspace/invitations');
      const teamData = await teamRes.json();
      if (teamData.success) {
        setInvitations(teamData.invitations);
      }

      const teamMembersRes = await fetch('/api/v1/workspace/permissions/matrix');
      const teamMembersData = await teamMembersRes.json();
      if (teamMembersData.success) {
        setPermissionMatrix(teamMembersData.matrix);
        // Map back to teamMembers state
        setTeamMembers(teamMembersData.matrix.map((item: any) => ({
          id: item.memberId,
          fullName: item.fullName,
          email: item.email,
          role: item.role,
          status: item.memberId.startsWith('tm_sim_') ? 'INVITED' : 'ACTIVE'
        })));
      }

      // 3. Fetch Roles & Permissions
      const rolesRes = await fetch('/api/v1/workspace/roles');
      const rolesData = await rolesRes.json();
      if (rolesData.success) {
        setRoles(rolesData.roles);
      }

      const permsRes = await fetch('/api/v1/workspace/permissions');
      const permsData = await permsRes.json();
      if (permsData.success) {
        setPermissions(permsData.permissions);
      }

      // 4. Fetch Audit Logs & Activities
      const auditRes = await fetch('/api/v1/workspace/audit-logs');
      const auditData = await auditRes.json();
      if (auditData.success) {
        setAuditLogs(auditData.auditLogs);
      }

      const actsRes = await fetch('/api/v1/workspace/crm/activities');
      const actsData = await actsRes.json();
      if (actsData.success) {
        setActivities(actsData.activities);
      }

      // 5. Fetch Notifications
      const notifsRes = await fetch('/api/v1/workspace/notifications');
      const notifsData = await notifsRes.json();
      if (notifsData.success) {
        setNotifications(notifsData.notifications);
      }

    } catch (err: any) {
      console.error('Error fetching workspace data:', err);
      showError('Failed to synchronize cloud workspace data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspace/organizations/${activeOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          domain: orgDomain,
          logo: orgLogo
        })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Organization settings saved successfully.');
        fetchWorkspaceData();
        if (onRefreshUser) onRefreshUser();
      } else {
        showError(data.error || 'Failed to update organization.');
      }
    } catch (err) {
      showError('Network error updating organization settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      showError('Please specify an email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/workspace/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Workspace invitation sent to ${inviteEmail}.`);
        setInviteEmail('');
        fetchWorkspaceData();
      } else {
        showError(data.error || 'Failed to send invitation.');
      }
    } catch (err) {
      showError('Network error dispatching invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondInvitation = async (id: string, action: 'ACCEPTED' | 'DECLINED') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspace/invitations/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Invitation ${action.toLowerCase()} successfully.`);
        fetchWorkspaceData();
        if (onRefreshUser) onRefreshUser();
      } else {
        showError(data.error || 'Failed to respond to invitation.');
      }
    } catch (err) {
      showError('Network error responding to invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to remove this member from the organization?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/team/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Team member removed from workspace.');
        fetchWorkspaceData();
      } else {
        showError(data.error || 'Failed to remove member.');
      }
    } catch (err) {
      showError('Network error removing team member.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/team/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Teammate status updated to ${status}.`);
        fetchWorkspaceData();
      } else {
        showError(data.error || 'Failed to update status.');
      }
    } catch (err) {
      showError('Network error updating teammate status.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (id: string, role: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/team/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Teammate role updated to ${role}.`);
        fetchWorkspaceData();
      } else {
        showError(data.error || 'Failed to update role.');
      }
    } catch (err) {
      showError('Network error updating teammate role.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetId) {
      showError('Please select a target team member.');
      return;
    }
    if (!confirm('Are you sure you want to transfer full billing ownership and Owner role to this member? You will become an Admin.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspace/organizations/${activeOrg.id}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: transferTargetId })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Workspace ownership transferred successfully.');
        setTransferTargetId('');
        fetchWorkspaceData();
        if (onRefreshUser) onRefreshUser();
      } else {
        showError(data.error || 'Failed to transfer ownership.');
      }
    } catch (err) {
      showError('Network error transferring ownership.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (memberId: string, permissionId: string, currentAllowed: boolean) => {
    // Find member matrix row
    const row = permissionMatrix.find(item => item.memberId === memberId);
    if (!row) return;

    const currentMapping = row.permissions || {};
    const updatedMapping = { ...currentMapping, [permissionId]: !currentAllowed };

    // Prepare permissions array for POST
    const permsArray = Object.keys(updatedMapping).map(pId => ({
      permissionId: pId,
      allowed: updatedMapping[pId]
    }));

    try {
      const res = await fetch('/api/v1/workspace/permissions/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, permissions: permsArray })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Teammate permission overrides updated on-the-fly.');
        fetchWorkspaceData();
      } else {
        showError(data.error || 'Failed to update permissions.');
      }
    } catch (err) {
      showError('Network error updating permission overrides.');
    }
  };

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleName) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/workspace/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customRoleName, description: customRoleDesc })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Custom role "${customRoleName}" defined successfully.`);
        setCustomRoleName('');
        setCustomRoleDesc('');
        fetchWorkspaceData();
      } else {
        showError(data.error || 'Failed to create role.');
      }
    } catch (err) {
      showError('Network error creating custom role.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this custom role?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspace/roles/${roleId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Custom role deleted.');
        fetchWorkspaceData();
      } else {
        showError(data.error || 'Failed to delete role.');
      }
    } catch (err) {
      showError('Network error deleting custom role.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/v1/workspace/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter lists
  const filteredAuditLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Alert / Notification banners */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-800 text-xs font-mono flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="font-bold text-emerald-500 hover:text-emerald-700">✕</button>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg text-rose-800 text-xs font-mono flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="font-bold text-rose-500 hover:text-rose-700">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Building2 className="w-32 h-32 text-white" />
        </div>
        <div className="space-y-4 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/15 border border-blue-500/30 rounded-full text-blue-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enterprise Workspace Active</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white">
            {activeOrg ? activeOrg.name : 'Organization Workspace'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Manage your organizations, dynamic team member seats, custom granular permission overrides, notifications, compliance logs, and cross-team CRM task flows.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400 pt-2">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              Domain: <strong className="text-slate-200">{activeOrg?.domain || 'salespilot.co'}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              Tier: <strong className="text-blue-400">{activeOrg?.subscriptionPlan || 'ENTERPRISE'}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Launched: <strong className="text-slate-200">{activeOrg ? new Date(activeOrg.createdAt).toLocaleDateString() : 'Active'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center overflow-x-auto border-b border-slate-200 pb-px scrollbar-none gap-6">
        {[
          { id: 'org', label: 'Organization Settings', icon: Building2 },
          { id: 'team', label: 'Team Directory', icon: Users },
          { id: 'permissions', label: 'Permission Overrides', icon: ShieldCheck },
          { id: 'audit', label: 'Compliance Audit & Activity', icon: FileText },
          { id: 'notifications', label: 'Notifications Center', icon: Bell, badge: notifications.filter(n => !n.read).length }
        ].map((sub) => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`pb-4 px-1 text-xs font-medium flex items-center gap-2 border-b-2 transition-all relative shrink-0 ${
                isActive 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{sub.label}</span>
              {sub.badge !== undefined && sub.badge > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-600 text-white rounded-full font-bold">
                  {sub.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* PANEL 1: ORG SETTINGS & OWNERSHIP */}
        {activeSubTab === 'org' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Company Hub Identity</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure company credentials and visual branding logo URL for user portals.</p>
                </div>

                <form onSubmit={handleUpdateOrg} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Organization Name</label>
                      <input 
                        type="text" 
                        value={orgName} 
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. SalesPilot Labs"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Verified Domain</label>
                      <input 
                        type="text" 
                        value={orgDomain} 
                        onChange={(e) => setOrgDomain(e.target.value)}
                        placeholder="e.g. salespilot.co"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Visual Logo URL</label>
                    <input 
                      type="url" 
                      value={orgLogo} 
                      onChange={(e) => setOrgLogo(e.target.value)}
                      placeholder="e.g. https://domain.com/logo.png"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-sm flex items-center gap-1.5"
                    >
                      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Ownership Transfer Module */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider text-rose-600 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Transfer Workspace Ownership</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">This operation assigns primary billing and owner administration credentials to another team member.</p>
                </div>

                <form onSubmit={handleTransferOwnership} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Select Target Teammate</label>
                    <select
                      value={transferTargetId}
                      onChange={(e) => setTransferTargetId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Choose verified member --</option>
                      {permissionMatrix
                        .filter(item => item.email !== user?.email)
                        .map(item => (
                          <option key={item.memberId} value={item.memberId}>
                            {item.fullName} ({item.email})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !transferTargetId}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition shadow-sm flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Transfer Authority</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar Org Metrics */}
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Workspace Details</div>
                <div className="divide-y divide-slate-200 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">Org Identifier</span>
                    <strong className="font-mono text-slate-800 text-[10px] flex items-center gap-1">
                      {activeOrg?.id}
                      <button onClick={() => copyToClipboard(activeOrg?.id || '', 'id')} className="text-slate-400 hover:text-slate-600">
                        {copiedId === 'id' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </strong>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">Active Seats</span>
                    <strong className="text-slate-800">{teamMembers.length} active</strong>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">Owner ID</span>
                    <span className="font-mono text-slate-800 text-[9px] truncate max-w-[120px]">{activeOrg?.ownerId}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">Billing Plan</span>
                    <strong className="text-blue-600 font-mono text-[10px]">{activeOrg?.subscriptionPlan || 'ENTERPRISE'}</strong>
                  </div>
                </div>
              </div>

              {/* Custom Roles List */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Custom Workspace Roles</div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                    {roles.filter(r => r.isCustom).length} custom
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {roles.filter(r => r.isCustom).length > 0 ? (
                    roles.filter(r => r.isCustom).map((role) => (
                      <div key={role.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between text-xs">
                        <div>
                          <strong className="text-slate-800 block">{role.name}</strong>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{role.description}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteCustomRole(role.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400 font-mono text-center py-4 bg-slate-50/50 rounded-lg">
                      No custom roles defined yet.
                    </div>
                  )}
                </div>

                {/* Create Custom Role Inline Form */}
                <form onSubmit={handleCreateCustomRole} className="space-y-3 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    placeholder="Role Name (e.g. Lead Editor)"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={customRoleDesc}
                    onChange={(e) => setCustomRoleDesc(e.target.value)}
                    placeholder="Short Description..."
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    Add Custom Role
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: TEAM DIRECTORY */}
        {activeSubTab === 'team' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Dispatch Teammate Invitation */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">Invite Teammate Seat</h4>
                    <p className="text-[11px] text-slate-500">Send an organization workspace invitation link instantly.</p>
                  </div>
                </div>

                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full sm:w-56"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full sm:w-40"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Support">Support</option>
                    <option value="Viewer">Viewer</option>
                    {roles.filter(r => r.isCustom).map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1 justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* List Team Directory */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Teammates & Seat Directory</div>
                <span className="text-[10px] font-mono text-slate-500">{teamMembers.length} Seats Registered</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Teammate Details</th>
                      <th className="px-6 py-3.5 font-semibold">Role</th>
                      <th className="px-6 py-3.5 font-semibold">Status</th>
                      <th className="px-6 py-3.5 font-semibold">Action Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                              {member.fullName ? member.fullName[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <strong className="text-slate-800 block text-xs font-semibold">{member.fullName || 'Teammate'}</strong>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700 focus:outline-none"
                          >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="Sales Manager">Sales Manager</option>
                            <option value="Sales Representative">Sales Representative</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Support">Support</option>
                            <option value="Viewer">Viewer</option>
                            {roles.filter(r => r.isCustom).map(r => (
                              <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-semibold ${
                            member.status === 'ACTIVE' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : member.status === 'INVITED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'ACTIVE' ? 'bg-emerald-500' : member.status === 'INVITED' ? 'bg-blue-400' : 'bg-rose-500'
                            }`} />
                            {member.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {member.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleUpdateMemberStatus(member.id, 'SUSPENDED')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition"
                              >
                                Suspend
                              </button>
                            ) : member.status === 'SUSPENDED' ? (
                              <button
                                onClick={() => handleUpdateMemberStatus(member.id, 'ACTIVE')}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-medium transition"
                              >
                                Reactivate
                              </button>
                            ) : null}

                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Delete member"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Mock Invitations Flow */}
            {invitations.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Dispatched Pending Invites (Simulation Controls)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <strong className="text-slate-800 text-xs block font-semibold">{inv.email}</strong>
                        <span className="text-[10px] text-slate-500 font-mono block">Role: {inv.role}</span>
                        <span className="text-[10px] text-slate-400 block">Invited by: {inv.invitedBy}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespondInvitation(inv.id, 'ACCEPTED')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRespondInvitation(inv.id, 'DECLINED')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-0.5"
                        >
                          ✕
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL 3: PERMISSION MATRIX OVERRIDES */}
        {activeSubTab === 'permissions' && (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-indigo-800 text-xs leading-relaxed font-sans flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Granular Authorization Override Engine</strong>
                Each cell corresponds to an individual teammate override. Activating/deactivating checkboxes updates permissions for specific CRM directories on the fly. System owner privileges bypass limitations automatically.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-mono text-[9px] uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold min-w-[200px] sticky left-0 bg-slate-50 border-r border-slate-200 z-10">Teammate Seat</th>
                      {permissions.map(p => (
                        <th key={p.id} className="px-4 py-4 font-semibold text-center whitespace-nowrap" title={p.description}>
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-sans">
                    {permissionMatrix.map((row) => (
                      <tr key={row.memberId} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5 sticky left-0 bg-white border-r border-slate-200 font-semibold text-slate-800 z-10">
                          <div>
                            <span className="block text-xs">{row.fullName}</span>
                            <span className="block text-[9px] font-mono text-slate-400 font-normal mt-0.5">{row.role}</span>
                          </div>
                        </td>
                        {permissions.map(p => {
                          const isAllowed = !!row.permissions[p.id];
                          const isOwner = row.role === 'OWNER' || row.email === user?.email;
                          return (
                            <td key={p.id} className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                disabled={isOwner}
                                onChange={() => handleTogglePermission(row.memberId, p.id, isAllowed)}
                                className={`w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 transition ${isOwner ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                title={isOwner ? "Owner permissions cannot be overridden" : `Toggle ${p.name}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: COMPLIANCE AUDIT & HISTORY */}
        {activeSubTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Audit Logs Column */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Enterprise Audit logs</h3>
                  <p className="text-xs text-slate-500 mt-1">Immutable session record capturing settings changes, user log-ins, and sequence deployments.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter audit logs..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 hover:bg-slate-100/50 transition">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-slate-900 text-slate-300 rounded font-mono text-[9px] uppercase tracking-wider font-semibold">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-sans">{log.details}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/50">
                        <span>User: <strong>{log.userEmail}</strong></span>
                        <span>IP Address: <strong>{log.ipAddress}</strong></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 font-mono text-center py-12 bg-slate-50 rounded-lg">
                    No compliance logs matched the search criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Team Activity Timeline */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Team Activity Feed</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Real-time collaborative timeline tracking CRM assignments and mentions.</p>
              </div>

              <div className="relative border-l-2 border-slate-150 pl-4 ml-2 space-y-6 max-h-[460px] overflow-y-auto py-2">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <div key={act.id} className="relative space-y-1">
                      {/* Node point */}
                      <span className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                      
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <strong className="text-slate-800">{act.userName}</strong>
                        <span className="text-slate-400">{new Date(act.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{act.details}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 font-mono text-center py-12">
                    No timeline activity logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANEL 5: NOTIFICATIONS CENTER */}
        {activeSubTab === 'notifications' && (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Notifications & Alerts</h3>
                <p className="text-xs text-slate-500 mt-1">A historical view of workspace tasks, team assignments, and mentions.</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">
                {notifications.filter(n => !n.read).length} Unread
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`py-4 flex items-start gap-4 transition-all ${notif.read ? 'opacity-65' : 'bg-slate-50/50 p-3 rounded-lg border border-slate-100/80 my-2'}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {notif.type === 'assignment' ? (
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      ) : notif.type === 'alert' ? (
                        <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-slate-800 font-semibold">{notif.title}</strong>
                        <span className="text-[9px] font-mono text-slate-400">{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">{notif.message}</p>
                      
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-[10px] font-mono text-blue-600 hover:text-blue-800 font-bold block pt-1.5"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 font-mono text-center py-16">
                  You have no notifications or alerts.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
