import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  MessageSquare, 
  Activity, 
  Bell, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Crown, 
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TeamWorkspacesManager } from './TeamWorkspacesManager';
import { RoleAndPermissionsMatrix } from './RoleAndPermissionsMatrix';
import { SharedCrmAndAssignments } from './SharedCrmAndAssignments';
import { MentionsAndCommentsThread } from './MentionsAndCommentsThread';
import { TeamActivityFeed } from './TeamActivityFeed';
import { TeamNotificationsCenter } from './TeamNotificationsCenter';
import { TeamAnalyticsDashboard } from './TeamAnalyticsDashboard';
import { WorkspaceMember, WorkspaceRole, CRMComment, LeadAssignment, WorkspaceActivity, TeamNotification } from '../../types/team-collaboration';
import { Lead, Deal } from '../../types';

interface TeamCollaborationHubProps {
  user: any;
  leads: Lead[];
  deals: Deal[];
  onRefreshData?: () => void;
}

export const TeamCollaborationHub: React.FC<TeamCollaborationHubProps> = ({
  user,
  leads,
  deals,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'workspaces' | 'rbac' | 'assignments' | 'comments' | 'feed' | 'notifications' | 'analytics'>('workspaces');
  
  // State variables
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [activeOrg, setActiveOrg] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [comments, setComments] = useState<CRMComment[]>([]);
  const [assignmentsHistory, setAssignmentsHistory] = useState<LeadAssignment[]>([]);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [notifications, setNotifications] = useState<TeamNotification[]>([]);
  
  // UI messaging
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamCollaborationData();
  }, [user]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const fetchTeamCollaborationData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orgs & Active Context
      const orgsRes = await fetch('/api/v1/workspace/organizations');
      const orgsData = await orgsRes.json();
      if (orgsData.success) {
        setOrganizations(orgsData.organizations || []);
        const current = (orgsData.organizations || []).find((o: any) => o.id === user?.organizationId) || orgsData.organizations[0];
        setActiveOrg(current);
      }

      // 2. Fetch Team Members & Matrix
      const matrixRes = await fetch('/api/v1/workspace/permissions/matrix');
      const matrixData = await matrixRes.json();
      if (matrixData.success) {
        setPermissionMatrix(matrixData.matrix || []);
        setTeamMembers((matrixData.matrix || []).map((item: any) => ({
          id: item.memberId,
          workspaceId: item.organizationId || 'default_org',
          userId: item.memberId,
          email: item.email || 'teammate@company.com',
          fullName: item.fullName || 'Workspace Teammate',
          role: item.role || 'SALES_REP',
          status: 'ACTIVE',
          assignedLeadsCount: leads.filter(l => (l as any).assignedToId === item.memberId).length,
          dealsWonCount: deals.filter(d => (d as any).assignedToId === item.memberId && d.stage === 'CLOSED_WON').length,
          revenueGeneratedInr: 500000,
          joinedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        })));
      }

      // 3. Permissions list
      const permsRes = await fetch('/api/v1/workspace/permissions');
      const permsData = await permsRes.json();
      if (permsData.success) {
        setPermissionsList(permsData.permissions || []);
      }

      // 4. Comments & Activity
      const commentsRes = await fetch('/api/v1/team/comments');
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }

      const actsRes = await fetch('/api/v1/workspace/crm/activities');
      const actsData = await actsRes.json();
      if (actsData.success) {
        setActivities((actsData.activities || []).map((a: any) => ({
          id: a.id,
          workspaceId: 'org_1',
          actorId: 'usr_1',
          actorName: a.actorName || user?.fullName || 'Sales Rep',
          actorRole: 'SALES_REP',
          actionType: a.actionType || 'LEAD_ASSIGNED',
          targetType: 'LEAD',
          targetId: 'lead_1',
          targetName: a.targetName || 'Prospect Account',
          details: a.text || 'Performed workspace action',
          createdAt: a.createdAt || new Date().toISOString()
        })));
      }

      // 5. Notifications
      const notifsRes = await fetch('/api/v1/workspace/notifications');
      const notifsData = await notifsRes.json();
      if (notifsData.success) {
        setNotifications((notifsData.notifications || []).map((n: any) => ({
          id: n.id,
          workspaceId: 'org_1',
          recipientId: user?.id || 'usr_1',
          senderName: 'SalesPilot Assistant',
          title: n.title || 'Workspace Update',
          message: n.message || n.text || 'Notification update',
          type: 'SYSTEM',
          read: n.read || false,
          createdAt: n.createdAt || new Date().toISOString()
        })));
      }

    } catch (err) {
      console.error('Error loading team collaboration hub:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrg = async (orgData: { name: string; domain?: string; logo?: string }) => {
    if (!activeOrg) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspace/organizations/${activeOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData)
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Organization profile updated.');
        fetchTeamCollaborationData();
      } else {
        showError(data.error || 'Failed to update organization.');
      }
    } catch (err) {
      showError('Network error updating organization.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (email: string, role: WorkspaceRole) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/workspace/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Invitation dispatched to ${email}.`);
        fetchTeamCollaborationData();
      } else {
        showError(data.error || 'Failed to invite teammate.');
      }
    } catch (err) {
      showError('Network error dispatching invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async (targetUserId: string) => {
    if (!activeOrg) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspace/organizations/${activeOrg.id}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Ownership transferred successfully.');
        fetchTeamCollaborationData();
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
    const row = permissionMatrix.find(item => item.memberId === memberId);
    if (!row) return;

    const currentMapping = row.permissions || {};
    const updatedMapping = { ...currentMapping, [permissionId]: !currentAllowed };

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
        showSuccess('Permission override applied immediately.');
        fetchTeamCollaborationData();
      } else {
        showError(data.error || 'Failed to update permissions.');
      }
    } catch (err) {
      showError('Network error updating permissions.');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: WorkspaceRole) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/team/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Role updated to ${newRole}.`);
        fetchTeamCollaborationData();
      } else {
        showError(data.error || 'Failed to update role.');
      }
    } catch (err) {
      showError('Network error updating role.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberStatus = async (memberId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/team/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, status })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Teammate status set to ${status}.`);
        fetchTeamCollaborationData();
      } else {
        showError(data.error || 'Failed to update status.');
      }
    } catch (err) {
      showError('Network error updating teammate status.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLead = async (leadId: string, assignedToUserId: string, note?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/team/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, assignedToUserId, note })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Lead reassigned with teammate notification.');
        fetchTeamCollaborationData();
        if (onRefreshData) onRefreshData();
      } else {
        showError(data.error || 'Failed to assign lead.');
      }
    } catch (err) {
      showError('Network error assigning lead.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (commentData: any) => {
    try {
      const res = await fetch('/api/v1/team/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData)
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Internal note posted.');
        fetchTeamCollaborationData();
      } else {
        showError(data.error || 'Failed to post note.');
      }
    } catch (err) {
      showError('Network error posting note.');
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

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/v1/workspace/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showSuccess('All notifications marked as read.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Alert Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 text-xs font-mono flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>{successMessage}</span></div>
            <button onClick={() => setSuccessMessage(null)} className="font-bold text-emerald-500 hover:text-emerald-700">✕</button>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-rose-800 text-xs font-mono flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /><span>{errorMessage}</span></div>
            <button onClick={() => setErrorMessage(null)} className="font-bold text-rose-500 hover:text-rose-700">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Banner Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="space-y-3 relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/15 border border-blue-500/30 rounded-full text-blue-400 text-[10px] font-mono uppercase font-bold tracking-wider">
            <Users className="w-3.5 h-3.5" /> Enterprise Team Collaboration Mode
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
            Multi-User Workspace & Shared CRM Hub
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Coordinate team lead handoffs, role-based access rules, internal @mentions, shared pipeline performance, and activity logs under Founder control.
          </p>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px gap-6 scrollbar-none">
        {[
          { id: 'workspaces', label: 'Multi-User Workspace', icon: Building2 },
          { id: 'rbac', label: 'Roles & Permissions Matrix', icon: ShieldCheck },
          { id: 'assignments', label: 'Shared CRM & Assignments', icon: Users },
          { id: 'comments', label: '@Mentions & Internal Notes', icon: MessageSquare },
          { id: 'feed', label: 'Team Activity Feed', icon: Activity },
          { id: 'notifications', label: 'Notification Center', icon: Bell, badge: notifications.filter(n => !n.read).length },
          { id: 'analytics', label: 'Team Analytics & Leaderboard', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 text-xs font-medium flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
                isActive 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-blue-600 text-white rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtab View Panels */}
      <div>
        {activeTab === 'workspaces' && (
          <TeamWorkspacesManager
            user={user}
            activeOrg={activeOrg}
            organizations={organizations}
            teamMembers={teamMembers}
            invitations={invitations}
            onUpdateOrg={handleUpdateOrg}
            onInviteMember={handleInviteMember}
            onTransferOwnership={handleTransferOwnership}
            onSelectOrg={(org) => setActiveOrg(org)}
            loading={loading}
          />
        )}

        {activeTab === 'rbac' && (
          <RoleAndPermissionsMatrix
            user={user}
            teamMembers={teamMembers}
            permissionMatrix={permissionMatrix}
            permissionsList={permissionsList}
            onTogglePermission={handleTogglePermission}
            onUpdateMemberRole={handleUpdateMemberRole}
            onUpdateMemberStatus={handleUpdateMemberStatus}
            loading={loading}
          />
        )}

        {activeTab === 'assignments' && (
          <SharedCrmAndAssignments
            user={user}
            leads={leads}
            teamMembers={teamMembers}
            assignmentsHistory={assignmentsHistory}
            onAssignLead={handleAssignLead}
            loading={loading}
          />
        )}

        {activeTab === 'comments' && (
          <MentionsAndCommentsThread
            user={user}
            entityType="LEAD"
            entityId=""
            comments={comments}
            teamMembers={teamMembers}
            onAddComment={handleAddComment}
            loading={loading}
          />
        )}

        {activeTab === 'feed' && (
          <TeamActivityFeed
            activities={activities}
            loading={loading}
          />
        )}

        {activeTab === 'notifications' && (
          <TeamNotificationsCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            loading={loading}
          />
        )}

        {activeTab === 'analytics' && (
          <TeamAnalyticsDashboard
            teamMembers={teamMembers}
            leads={leads}
            deals={deals}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};
