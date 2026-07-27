import React from 'react';
import { X, Sparkles, Zap, ArrowRight, Layers, FileCode } from 'lucide-react';
import { WorkflowBuilderTemplate, WorkflowBuilderNode, WorkflowBuilderEdge } from '../../types/workflow-builder';

interface WorkflowTemplatesModalProps {
  onSelectTemplate: (template: WorkflowBuilderTemplate) => void;
  onClose: () => void;
}

export function WorkflowTemplatesModal({ onSelectTemplate, onClose }: WorkflowTemplatesModalProps) {
  const templates: WorkflowBuilderTemplate[] = [
    {
      id: 'tmpl_ai_sdr_drip',
      title: 'AI Lead Scoring & Automated Outreach Drip',
      description: 'Scores incoming leads with Gemini AI, branches based on score >75, sends Gmail sequence and updates CRM status.',
      category: 'Sales Outbound',
      icon: 'Sparkles',
      nodes: [
        {
          id: 'node_1',
          type: 'trigger',
          subType: 'NEW_LEAD',
          title: 'Trigger: New Lead Created',
          description: 'Fires when prospect is added',
          position: { x: 250, y: 50 },
          ports: [{ id: 'out_1', label: 'Out', type: 'output' }],
          config: { triggerEvent: 'NEW_LEAD' }
        },
        {
          id: 'node_2',
          type: 'ai',
          subType: 'GEMINI_PROMPT',
          title: 'Gemini Lead Scoring & Pitch',
          description: 'Scores lead and generates personalized email copy',
          position: { x: 250, y: 160 },
          ports: [
            { id: 'in_1', label: 'In', type: 'input' },
            { id: 'out_1', label: 'Out', type: 'output' }
          ],
          config: {
            aiTask: 'GENERATE_PITCH',
            aiPrompt: 'Score {{lead.firstName}} at {{lead.company}} and draft a high-converting cold email.'
          }
        },
        {
          id: 'node_3',
          type: 'condition',
          subType: 'CONDITION_IF_ELSE',
          title: 'If Score > 75',
          description: 'Branch on lead quality',
          position: { x: 250, y: 270 },
          ports: [
            { id: 'in_1', label: 'In', type: 'input' },
            { id: 'out_true', label: 'True', type: 'output', conditionValue: 'true' },
            { id: 'out_false', label: 'False', type: 'output', conditionValue: 'false' }
          ],
          config: { conditionField: 'confidenceScore', conditionOperator: 'greater_than', conditionValue: '75' }
        },
        {
          id: 'node_4',
          type: 'gmail',
          subType: 'SEND_EMAIL',
          title: 'Send Hot Outreach Email',
          description: 'Dispatch tailored email via Gmail API',
          position: { x: 100, y: 390 },
          ports: [
            { id: 'in_1', label: 'In', type: 'input' },
            { id: 'out_1', label: 'Out', type: 'output' }
          ],
          config: { emailTo: '{{lead.email}}', emailSubject: 'Scaling outbound growth at {{lead.company}}' }
        },
        {
          id: 'node_5',
          type: 'crm',
          subType: 'UPDATE_LEAD_STATUS',
          title: 'Update CRM to ENGAGED',
          description: 'Mark lead as engaged in CRM',
          position: { x: 400, y: 390 },
          ports: [
            { id: 'in_1', label: 'In', type: 'input' },
            { id: 'out_1', label: 'Out', type: 'output' }
          ],
          config: { crmAction: 'UPDATE_LEAD_STATUS', targetStatus: 'ENGAGED' }
        }
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node_1', sourcePortId: 'out_1', targetNodeId: 'node_2', targetPortId: 'in_1' },
        { id: 'e2', sourceNodeId: 'node_2', sourcePortId: 'out_1', targetNodeId: 'node_3', targetPortId: 'in_1' },
        { id: 'e3', sourceNodeId: 'node_3', sourcePortId: 'out_true', targetNodeId: 'node_4', targetPortId: 'in_1', label: 'True' },
        { id: 'e4', sourceNodeId: 'node_3', sourcePortId: 'out_false', targetNodeId: 'node_5', targetPortId: 'in_1', label: 'False' }
      ]
    },
    {
      id: 'tmpl_webhook_crm',
      title: 'Incoming Webhook -> Gemini Research -> CRM & Calendar Sync',
      description: 'Receives external lead webhook, conducts company deep research, creates CRM deal and Google Calendar meeting invite.',
      category: 'CRM Sync',
      icon: 'Zap',
      nodes: [
        {
          id: 'node_1',
          type: 'webhook',
          subType: 'WEBHOOK',
          title: 'Incoming Webhook Listener',
          description: 'Listens for payload at /api/v1/webhook',
          position: { x: 250, y: 50 },
          ports: [{ id: 'out_1', label: 'Out', type: 'output' }],
          config: { webhookUrl: 'https://api.salespilot.in/v1/webhook' }
        },
        {
          id: 'node_2',
          type: 'ai',
          subType: 'SUMMARIZE',
          title: 'Deep Research Company',
          description: 'Extract tech stack & employee count',
          position: { x: 250, y: 160 },
          ports: [
            { id: 'in_1', label: 'In', type: 'input' },
            { id: 'out_1', label: 'Out', type: 'output' }
          ],
          config: { aiTask: 'SUMMARIZE' }
        },
        {
          id: 'node_3',
          type: 'calendar',
          subType: 'CREATE_EVENT',
          title: 'Auto-Schedule Demo Call',
          description: 'Create Google Calendar invitation',
          position: { x: 250, y: 270 },
          ports: [
            { id: 'in_1', label: 'In', type: 'input' },
            { id: 'out_1', label: 'Out', type: 'output' }
          ],
          config: { calendarAction: 'CREATE_EVENT', durationMinutes: 30 }
        }
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node_1', sourcePortId: 'out_1', targetNodeId: 'node_2', targetPortId: 'in_1' },
        { id: 'e2', sourceNodeId: 'node_2', sourcePortId: 'out_1', targetNodeId: 'node_3', targetPortId: 'in_1' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white uppercase">
              No-Code Workflow Templates Library
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-2xl space-y-3 cursor-pointer group transition"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  {tmpl.category}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {tmpl.description}
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <span>{tmpl.nodes.length} Nodes</span>
                <span>•</span>
                <span>{tmpl.edges.length} Connectors</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
