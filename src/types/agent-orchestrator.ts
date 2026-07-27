export type AgentType = 
  | 'sdr'
  | 'research'
  | 'crm'
  | 'outreach'
  | 'meeting'
  | 'analytics'
  | 'founder';

export type AgentStatus = 'IDLE' | 'WORKING' | 'PAUSED' | 'FAILED' | 'RECOVERED';

export interface AgentMemory {
  id: string;
  agentType: AgentType;
  timestamp: string;
  inputPrompt: string;
  outputResult: string;
  status: 'SUCCESS' | 'FAILURE' | 'RECOVERED';
  metadata?: Record<string, any>;
}

export interface InterAgentMessage {
  id: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  taskPayload: any;
  timestamp: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  result?: any;
}

export interface OrchestratedTask {
  id: string;
  title: string;
  description: string;
  targetAgent: AgentType;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'RECOVERED';
  inputData: any;
  resultData?: any;
  errorMessage?: string;
  retryCount: number;
  assignedTimestamp: string;
  completedTimestamp?: string;
}

export interface OrchestrationPlan {
  planId: string;
  userGoal: string;
  tasks: OrchestratedTask[];
  overallStatus: 'PLANNING' | 'EXECUTING' | 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED';
  interAgentMessages: InterAgentMessage[];
  sharedContext: Record<string, any>;
}
