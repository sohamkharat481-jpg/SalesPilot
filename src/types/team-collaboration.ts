/**
 * Enterprise Team Collaboration Types
 * Defines data structures for multi-user workspaces, RBAC, mentions,
 * comments, internal notes, lead assignments, and team analytics.
 */

export type WorkspaceRole = 
  | 'FOUNDER' 
  | 'OWNER' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'SALES_REP' 
  | 'SDR' 
  | 'VIEWER';

export interface GranularPermission {
  id: string;
  key: string;
  name: string;
  category: 'CRM' | 'CAMPAIGN' | 'WORKFLOW' | 'TEAM' | 'BILLING' | 'SETTINGS';
  description: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  roleKey: WorkspaceRole;
  description: string;
  isSystemRole: boolean;
  defaultPermissions: string[];
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: WorkspaceRole;
  title?: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  assignedLeadsCount: number;
  dealsWonCount: number;
  revenueGeneratedInr: number;
  joinedAt: string;
  lastActiveAt: string;
  customPermissions?: Record<string, boolean>;
}

export interface CRMComment {
  id: string;
  workspaceId: string;
  entityType: 'LEAD' | 'DEAL' | 'CAMPAIGN' | 'CALL' | 'WORKFLOW';
  entityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: WorkspaceRole;
  text: string;
  mentions: { userId: string; name: string; email: string }[];
  isInternal: boolean;
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface InternalNote {
  id: string;
  workspaceId: string;
  entityId: string;
  authorId: string;
  authorName: string;
  text: string;
  category?: 'CALL_SUMMARY' | 'DEAL_BLOCKER' | 'STRATEGY' | 'GENERAL';
  isPinned: boolean;
  createdAt: string;
}

export interface LeadAssignment {
  id: string;
  leadId: string;
  leadName: string;
  assignedToUserId: string;
  assignedToName: string;
  assignedByUserId: string;
  assignedByName: string;
  assignedAt: string;
  note?: string;
}

export interface WorkspaceActivity {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  actorRole: WorkspaceRole;
  actionType: 
    | 'MEMBER_INVITED'
    | 'MEMBER_ROLE_CHANGED'
    | 'LEAD_ASSIGNED'
    | 'LEAD_STATUS_CHANGED'
    | 'DEAL_STAGE_ADVANCED'
    | 'COMMENT_ADDED'
    | 'INTERNAL_NOTE_PINNED'
    | 'PERMISSION_OVERRIDDEN'
    | 'OWNERSHIP_TRANSFERRED';
  targetType: 'MEMBER' | 'LEAD' | 'DEAL' | 'COMMENT' | 'PERMISSION';
  targetId: string;
  targetName: string;
  details: string;
  createdAt: string;
}

export interface TeamNotification {
  id: string;
  workspaceId: string;
  recipientId: string;
  senderName: string;
  senderAvatar?: string;
  title: string;
  message: string;
  link?: string;
  type: 'MENTION' | 'ASSIGNMENT' | 'COMMENT' | 'ROLE_CHANGE' | 'SYSTEM';
  read: boolean;
  createdAt: string;
}

export interface TeamMemberPerformance {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  role: WorkspaceRole;
  assignedLeads: number;
  contactedLeads: number;
  meetingsScheduled: number;
  dealsWon: number;
  pipelineValueInr: number;
  wonRevenueInr: number;
  conversionRatePercent: number;
  avgResponseTimeHours: number;
}

export interface TeamAnalyticsData {
  totalTeamMembers: number;
  activeLeadsCount: number;
  unassignedLeadsCount: number;
  totalPipelineValueInr: number;
  wonRevenueThisMonthInr: number;
  topPerformer: { name: string; revenueInr: number; dealsWon: number } | null;
  members: TeamMemberPerformance[];
}
