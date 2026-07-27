import React from 'react';
import { 
  X, Trash2, Settings2, Code, Sparkles, Database, Mail, Calendar, 
  Globe, Clock, GitBranch, Repeat, ShieldAlert, FileJson, Copy
} from 'lucide-react';
import { WorkflowBuilderNode, WorkflowVariable } from '../../types/workflow-builder';

interface WorkflowNodeInspectorProps {
  node: WorkflowBuilderNode | null;
  variables: WorkflowVariable[];
  onUpdateNode: (updatedNode: WorkflowBuilderNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export function WorkflowNodeInspector({
  node,
  variables,
  onUpdateNode,
  onDeleteNode,
  onClose
}: WorkflowNodeInspectorProps) {
  if (!node) return null;

  const handleConfigChange = (key: string, value: any) => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        [key]: value
      }
    });
  };

  const insertVariable = (targetKey: string, variableKey: string) => {
    const currentVal = node.config[targetKey as keyof typeof node.config] || '';
    handleConfigChange(targetKey, `${currentVal} {{${variableKey}}}`);
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-500" />
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase">Node Inspector</h3>
            <span className="text-[10px] text-slate-500 font-mono">ID: {node.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDeleteNode(node.id)}
            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer"
            title="Delete Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Node Name & Label */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono">
            Node Label / Title
          </label>
          <input
            type="text"
            value={node.title}
            onChange={(e) => onUpdateNode({ ...node, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dynamic Variable Insertion Quick Bar */}
        {variables.length > 0 && (
          <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase">
              Available Context Variables:
            </span>
            <div className="flex flex-wrap gap-1">
              {variables.map((v) => (
                <span
                  key={v.id}
                  className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono rounded cursor-pointer hover:bg-indigo-200"
                  title={`Insert {{${v.key}}}`}
                >
                  {`{{${v.key}}}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 1. TRIGGER CONFIG */}
        {node.type === 'trigger' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Trigger Type</label>
              <select
                value={node.config.triggerEvent || node.subType}
                onChange={(e) => handleConfigChange('triggerEvent', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
              >
                <option value="NEW_LEAD">New Lead Added to CRM</option>
                <option value="WEBHOOK">Incoming Webhook Payload</option>
                <option value="CRON_SCHEDULE">Cron Schedule Timer</option>
                <option value="STATUS_CHANGE">Lead Status Changed</option>
              </select>
            </div>

            {node.config.triggerEvent === 'CRON_SCHEDULE' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Cron Schedule (e.g. 0 9 * * 1)</label>
                <input
                  type="text"
                  value={node.config.cronSchedule || '0 9 * * 1'}
                  onChange={(e) => handleConfigChange('cronSchedule', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
                  placeholder="0 9 * * 1"
                />
              </div>
            )}
          </div>
        )}

        {/* 2. AI CONFIG */}
        {node.type === 'ai' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">AI Task Type</label>
              <select
                value={node.config.aiTask || 'GENERATE_PITCH'}
                onChange={(e) => handleConfigChange('aiTask', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
              >
                <option value="GENERATE_PITCH">Generate Hyper-Personalized Pitch</option>
                <option value="SENTIMENT">Analyze Reply Sentiment</option>
                <option value="SUMMARIZE">Auto-Summarize Prospect Data</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Gemini Prompt Template</label>
                <button
                  onClick={() => insertVariable('aiPrompt', 'lead.firstName')}
                  className="text-[10px] text-indigo-500 hover:underline"
                >
                  + Add {'{{lead.firstName}}'}
                </button>
              </div>
              <textarea
                rows={4}
                value={node.config.aiPrompt || 'Generate a 3-sentence personalized cold outreach email for {{lead.firstName}} at {{lead.company}} focusing on scaling outbound sales velocity.'}
                onChange={(e) => handleConfigChange('aiPrompt', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* 3. CONDITION CONFIG */}
        {node.type === 'condition' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Condition Field</label>
              <input
                type="text"
                value={node.config.conditionField || 'lead.confidenceScore'}
                onChange={(e) => handleConfigChange('conditionField', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
                placeholder="lead.confidenceScore"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Operator</label>
              <select
                value={node.config.conditionOperator || 'greater_than'}
                onChange={(e) => handleConfigChange('conditionOperator', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
              >
                <option value="greater_than">Greater Than (&gt;)</option>
                <option value="equals">Equals (==)</option>
                <option value="contains">Contains</option>
                <option value="less_than">Less Than (&lt;)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Comparison Value</label>
              <input
                type="text"
                value={node.config.conditionValue || '75'}
                onChange={(e) => handleConfigChange('conditionValue', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
                placeholder="75"
              />
            </div>
          </div>
        )}

        {/* 4. DELAY CONFIG */}
        {node.type === 'delay' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Delay Duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={node.config.delayValue || 1}
                  onChange={(e) => handleConfigChange('delayValue', parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
                />
                <select
                  value={node.config.delayUnit || 'days'}
                  onChange={(e) => handleConfigChange('delayUnit', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 5. GMAIL / EMAIL CONFIG */}
        {node.type === 'gmail' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Recipient Email</label>
              <input
                type="text"
                value={node.config.emailTo || '{{lead.email}}'}
                onChange={(e) => handleConfigChange('emailTo', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Subject Line</label>
              <input
                type="text"
                value={node.config.emailSubject || 'Scaling outbound sales at {{lead.company}}'}
                onChange={(e) => handleConfigChange('emailSubject', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Email Body Template</label>
              <textarea
                rows={4}
                value={node.config.emailBody || 'Hi {{lead.firstName}},\n\n{{ai.pitch}}\n\nBest regards,\nSalesPilot AI SDR'}
                onChange={(e) => handleConfigChange('emailBody', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* 6. HTTP REQUEST CONFIG */}
        {node.type === 'http' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={node.config.httpMethod || 'POST'}
                onChange={(e) => handleConfigChange('httpMethod', e.target.value)}
                className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white font-bold"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={node.config.httpUrl || 'https://api.salespilot.in/v1/webhook'}
                onChange={(e) => handleConfigChange('httpUrl', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
                placeholder="https://api.example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">JSON Request Body</label>
              <textarea
                rows={4}
                value={node.config.httpBody || '{\n  "lead_id": "{{lead.id}}",\n  "event": "QUALIFIED"\n}'}
                onChange={(e) => handleConfigChange('httpBody', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* 7. ERROR HANDLING & RETRIES */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Error Handling Strategy
          </label>
          <select
            value={node.config.onErrorStrategy || 'RETRY'}
            onChange={(e) => handleConfigChange('onErrorStrategy', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
          >
            <option value="RETRY">Auto-Retry (Up to 3 times)</option>
            <option value="FALLBACK_BRANCH">Fallback Error Branch</option>
            <option value="IGNORE">Ignore & Continue Workflow</option>
            <option value="HALT">Halt Workflow Immediately</option>
          </select>
        </div>
      </div>
    </div>
  );
}
