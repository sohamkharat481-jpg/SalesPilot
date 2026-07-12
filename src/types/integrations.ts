export type IntegrationCategory = 
  | 'Lead Providers'
  | 'CRM'
  | 'Email'
  | 'Calendar'
  | 'Payments'
  | 'AI'
  | 'Automation'
  | 'Communication';

export interface IntegrationAuthField {
  key: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  required: boolean;
  helpText?: string;
}

export interface IntegrationPlugin {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  iconName: string; // Corresponds to lucide-react icon name
  authType: 'API_KEY' | 'OAUTH' | 'BOTH';
  authFields: IntegrationAuthField[];
  defaultUsageLimit?: number;
  usageUnit?: string;
}

export interface IntegrationStatus {
  pluginId: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SANDBOX';
  averageLatencyMs: number;
  successRate: number;
  uptimeRate: number;
  totalCalls: number;
  usageCount: number;
  usageLimit: number;
  lastSyncTime?: string;
}

export interface IntegrationSyncLog {
  id: string;
  pluginId: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  details?: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRIED';
}

export interface IntegrationCredentialsMap {
  [pluginId: string]: {
    [fieldKey: string]: string;
  };
}
