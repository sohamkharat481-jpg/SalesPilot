import React from 'react';
import { 
  Zap, GitBranch, Clock, Sparkles, Database, Mail, Calendar, 
  Globe, ArrowRightLeft, Repeat, ShieldAlert, Plus, HelpCircle
} from 'lucide-react';
import { NodeType, WorkflowBuilderNode } from '../../types/workflow-builder';

interface WorkflowNodePaletteProps {
  onAddNode: (type: NodeType, subType: string) => void;
}

export function WorkflowNodePalette({ onAddNode }: WorkflowNodePaletteProps) {
  const nodeCategories = [
    {
      name: 'Triggers',
      icon: Zap,
      items: [
        { type: 'trigger' as NodeType, subType: 'NEW_LEAD', title: 'New Lead Created', desc: 'Fires when a new prospect is added to CRM' },
        { type: 'trigger' as NodeType, subType: 'WEBHOOK', title: 'Incoming Webhook', desc: 'Trigger workflow via HTTP POST endpoint' },
        { type: 'trigger' as NodeType, subType: 'CRON_SCHEDULE', title: 'Scheduled Cron Job', desc: 'Execute on recurring timer or cron interval' },
        { type: 'trigger' as NodeType, subType: 'STATUS_CHANGE', title: 'Lead Status Changed', desc: 'Fires on deal stage or status update' },
      ]
    },
    {
      name: 'AI & Intelligence',
      icon: Sparkles,
      items: [
        { type: 'ai' as NodeType, subType: 'GEMINI_PROMPT', title: 'Gemini AI Completion', desc: 'Generate customized copy, pitches or responses' },
        { type: 'ai' as NodeType, subType: 'SENTIMENT', title: 'Lead Sentiment Analyzer', desc: 'Analyze buyer intent and email reply sentiment' },
        { type: 'ai' as NodeType, subType: 'SUMMARIZE', title: 'Auto-Summarizer', desc: 'Compress call transcripts or long notes' },
      ]
    },
    {
      name: 'Logic & Control Flow',
      icon: GitBranch,
      items: [
        { type: 'condition' as NodeType, subType: 'CONDITION_IF_ELSE', title: 'If / Else Branch', desc: 'Split execution based on lead fields or scores' },
        { type: 'delay' as NodeType, subType: 'DELAY_DURATION', title: 'Time Delay', desc: 'Pause execution for N minutes, hours or days' },
        { type: 'loop' as NodeType, subType: 'LOOP_ARRAY', title: 'Loop / Iterator', desc: 'Iterate over lead lists or JSON array items' },
        { type: 'error' as NodeType, subType: 'ERROR_CATCH', title: 'Error Handler / Catch', desc: 'Handle failures, retries and fallback actions' },
      ]
    },
    {
      name: 'CRM & Workspace Apps',
      icon: Database,
      items: [
        { type: 'crm' as NodeType, subType: 'UPDATE_LEAD_STATUS', title: 'Update CRM Lead', desc: 'Modify lead stage, status or score' },
        { type: 'gmail' as NodeType, subType: 'SEND_EMAIL', title: 'Gmail / Email Action', desc: 'Send personalized email or draft sequence' },
        { type: 'calendar' as NodeType, subType: 'CREATE_EVENT', title: 'Google Calendar Event', desc: 'Auto-schedule discovery call or meeting' },
      ]
    },
    {
      name: 'Webhooks & HTTP APIs',
      icon: Globe,
      items: [
        { type: 'webhook' as NodeType, subType: 'WEBHOOK_DISPATCH', title: 'Dispatch Webhook', desc: 'Post JSON payload to external web service' },
        { type: 'http' as NodeType, subType: 'HTTP_REQUEST', title: 'Custom HTTP Request', desc: 'Make GET / POST / PUT REST API call' },
      ]
    }
  ];

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-500" /> Workflow Node Library
        </h3>
        <p className="text-[11px] text-slate-500 mt-1">
          Click or drag nodes onto the canvas to construct no-code automations.
        </p>
      </div>

      <div className="p-3 space-y-4">
        {nodeCategories.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300 uppercase">
                <CategoryIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>{category.name}</span>
              </div>

              <div className="space-y-1.5">
                {category.items.map((item) => (
                  <div
                    key={item.subType}
                    onClick={() => onAddNode(item.type, item.subType)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('nodeType', item.type);
                      e.dataTransfer.setData('subType', item.subType);
                    }}
                    className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-xl cursor-pointer hover:shadow-sm transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.title}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
