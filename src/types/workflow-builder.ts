export type NodeType = 
  | 'trigger'
  | 'condition'
  | 'delay'
  | 'ai'
  | 'crm'
  | 'gmail'
  | 'calendar'
  | 'webhook'
  | 'http'
  | 'loop'
  | 'error';

export interface WorkflowNodePort {
  id: string;
  label: string;
  type: 'input' | 'output';
  conditionValue?: 'true' | 'false' | 'success' | 'error' | 'next';
}

export interface WorkflowBuilderNode {
  id: string;
  type: NodeType;
  subType: string;
  title: string;
  description: string;
  position: { x: number; y: number };
  ports: WorkflowNodePort[];
  config: {
    // General
    label?: string;
    // Trigger config
    triggerEvent?: 'NEW_LEAD' | 'WEBHOOK' | 'STATUS_CHANGE' | 'CRON_SCHEDULE' | 'FORM_SUBMIT';
    cronSchedule?: string;
    // Condition config
    conditionField?: string;
    conditionOperator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty';
    conditionValue?: string;
    // Delay config
    delayValue?: number;
    delayUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
    // AI config
    aiPrompt?: string;
    aiModel?: string;
    aiTask?: 'GENERATE_PITCH' | 'SENTIMENT' | 'SUMMARIZE' | 'EXTRACT_ENTITIES';
    // CRM config
    crmAction?: 'UPDATE_LEAD_STATUS' | 'CREATE_DEAL' | 'CREATE_TASK' | 'ADD_NOTE';
    targetStatus?: string;
    dealStage?: string;
    taskTitle?: string;
    // Gmail config
    gmailAction?: 'SEND_EMAIL' | 'DRAFT_EMAIL' | 'REPLY';
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
    // Calendar config
    calendarAction?: 'CREATE_EVENT' | 'CHECK_AVAILABILITY' | 'CANCEL_EVENT';
    eventTitle?: string;
    durationMinutes?: number;
    // Webhook config
    webhookUrl?: string;
    webhookSecret?: string;
    // HTTP Request config
    httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    httpUrl?: string;
    httpHeaders?: Record<string, string>;
    httpBody?: string;
    // Loop config
    loopArrayVariable?: string;
    maxIterations?: number;
    // Error Handling config
    onErrorStrategy?: 'RETRY' | 'FALLBACK_BRANCH' | 'HALT' | 'IGNORE';
    maxRetries?: number;
  };
}

export interface WorkflowBuilderEdge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  label?: string;
}

export interface WorkflowVariable {
  id: string;
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  defaultValue: string;
  scope: 'global' | 'local';
}

export interface ExecutionStepLog {
  nodeId: string;
  nodeTitle: string;
  nodeType: NodeType;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'SKIPPED';
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  executionTimeMs: number;
  error?: string;
}

export interface WorkflowRunHistory {
  runId: string;
  workflowId: string;
  workflowTitle: string;
  startedAt: string;
  completedAt?: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  triggerPayload: Record<string, any>;
  stepLogs: ExecutionStepLog[];
  variableSnapshots: Record<string, any>;
}

export interface WorkflowBuilderTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Sales Outbound' | 'Lead Enrichment' | 'CRM Sync' | 'Meetings' | 'API Automation';
  icon: string;
  nodes: WorkflowBuilderNode[];
  edges: WorkflowBuilderEdge[];
  defaultVariables?: WorkflowVariable[];
}
