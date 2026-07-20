export type AgentType = 
  | 'research' 
  | 'email' 
  | 'calendar' 
  | 'crm' 
  | 'proposal' 
  | 'analytics' 
  | 'support' 
  | 'billing';

export interface AIAgent {
  id: string;
  organizationId: string;
  name: string;
  type: AgentType;
  status: 'idle' | 'working' | 'offline';
  capabilities: string[];
  systemPrompt: string;
  currentTaskId?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AgentTaskStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: string;
  output?: string;
}

export interface AgentApprovalRequest {
  id: string;
  taskId: string;
  action: 'send_email' | 'delete_record' | 'cancel_meeting' | 'process_refund' | 'change_billing';
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export interface AgentTask {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'approval_required';
  priority: 'low' | 'medium' | 'high';
  assignedAgentId?: string;
  parentTaskId?: string;
  steps: AgentTaskStep[];
  inputData?: any;
  outputData?: any;
  approvals?: AgentApprovalRequest[];
  retryCount: number;
  maxRetries: number;
  executionTimeMs?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentMemory {
  id: string;
  organizationId: string;
  key: string;
  category: 'organization' | 'preference' | 'conversation' | 'lead' | 'campaign' | 'meeting';
  value: any;
  context?: string;
  lastAccessedAt: string;
  createdAt: string;
}

export interface AgentLog {
  id: string;
  organizationId: string;
  agentId?: string;
  taskId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  reasoning?: string;
  metadata?: any;
  timestamp: string;
}

export interface AgentWorkflowStep {
  id: string;
  agentType: AgentType;
  action: string;
  dependsOnStepId?: string;
  requiresApproval: boolean;
}

export interface AgentWorkflow {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  trigger: string;
  steps: AgentWorkflowStep[];
  createdAt: string;
}

export interface AgentPermission {
  id: string;
  organizationId: string;
  agentType: AgentType;
  action: 'send_email' | 'delete_record' | 'cancel_meeting' | 'process_refund' | 'change_billing' | 'read_crm' | 'write_crm';
  requiresApproval: boolean;
  createdAt: string;
}
