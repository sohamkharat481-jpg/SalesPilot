export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type FollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type FollowUpSource = 'MANUAL_CALL' | 'LEAD' | 'APPOINTMENT' | 'MANUAL';

export interface FollowUp {
  id: string;
  organizationId: string;
  userId: string;
  leadId: string;
  callId?: string | null;
  title: string;
  description: string;
  dueAt: string; // ISO String
  priority: FollowUpPriority;
  status: FollowUpStatus;
  source: FollowUpSource;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  completedBy?: string | null;
}
