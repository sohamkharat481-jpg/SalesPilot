import React, { useState, useRef } from 'react';
import { 
  Play, Save, Plus, Trash2, Zap, Sparkles, Database, Mail, Calendar, 
  Globe, Clock, GitBranch, Key, History, RefreshCw, ZoomIn, ZoomOut, 
  Maximize2, Layers, AlertCircle, CheckCircle2, Loader2, ArrowRight
} from 'lucide-react';
import { WorkflowNodePalette } from './WorkflowNodePalette';
import { WorkflowNodeInspector } from './WorkflowNodeInspector';
import { WorkflowVariablesModal } from './WorkflowVariablesModal';
import { WorkflowTemplatesModal } from './WorkflowTemplatesModal';
import { WorkflowExecutionDrawer } from './WorkflowExecutionDrawer';
import { 
  NodeType, WorkflowBuilderNode, WorkflowBuilderEdge, 
  WorkflowVariable, WorkflowRunHistory, ExecutionStepLog, WorkflowBuilderTemplate 
} from '../../types/workflow-builder';
import { GeminiService } from '../../ai/gemini-service';

interface WorkflowCanvasProps {
  initialNodes?: WorkflowBuilderNode[];
  initialEdges?: WorkflowBuilderEdge[];
  onTriggerToast?: (msg: string) => void;
}

export function WorkflowCanvas({ initialNodes, initialEdges, onTriggerToast }: WorkflowCanvasProps) {
  // Nodes & Edges State
  const [nodes, setNodes] = useState<WorkflowBuilderNode[]>(initialNodes || [
    {
      id: 'node_trigger_1',
      type: 'trigger',
      subType: 'NEW_LEAD',
      title: 'Trigger: New Lead in CRM',
      description: 'Fires when prospect enters pipeline',
      position: { x: 280, y: 40 },
      ports: [{ id: 'port_trig_out', label: 'Out', type: 'output' }],
      config: { triggerEvent: 'NEW_LEAD' }
    },
    {
      id: 'node_ai_1',
      type: 'ai',
      subType: 'GEMINI_PROMPT',
      title: 'Gemini AI Hyper-Personalization',
      description: 'Generate email copy tailored to title & company',
      position: { x: 280, y: 170 },
      ports: [
        { id: 'port_ai_in', label: 'In', type: 'input' },
        { id: 'port_ai_out', label: 'Out', type: 'output' }
      ],
      config: {
        aiTask: 'GENERATE_PITCH',
        aiPrompt: 'Score {{lead.firstName}} at {{lead.company}} and draft a high-converting cold outreach pitch.'
      }
    },
    {
      id: 'node_condition_1',
      type: 'condition',
      subType: 'CONDITION_IF_ELSE',
      title: 'Branch: If ICP Score > 75',
      description: 'Check score threshold',
      position: { x: 280, y: 300 },
      ports: [
        { id: 'port_cond_in', label: 'In', type: 'input' },
        { id: 'port_cond_true', label: 'True', type: 'output', conditionValue: 'true' },
        { id: 'port_cond_false', label: 'False', type: 'output', conditionValue: 'false' }
      ],
      config: { conditionField: 'confidenceScore', conditionOperator: 'greater_than', conditionValue: '75' }
    },
    {
      id: 'node_gmail_1',
      type: 'gmail',
      subType: 'SEND_EMAIL',
      title: 'Send Hot Lead Email via Gmail',
      description: 'Dispatch tailored email sequence',
      position: { x: 120, y: 440 },
      ports: [
        { id: 'port_gmail_in', label: 'In', type: 'input' },
        { id: 'port_gmail_out', label: 'Out', type: 'output' }
      ],
      config: { emailTo: '{{lead.email}}', emailSubject: 'Accelerating growth at {{lead.company}}' }
    },
    {
      id: 'node_crm_1',
      type: 'crm',
      subType: 'UPDATE_LEAD_STATUS',
      title: 'Update CRM Status to ENGAGED',
      description: 'Log engagement status',
      position: { x: 440, y: 440 },
      ports: [
        { id: 'port_crm_in', label: 'In', type: 'input' },
        { id: 'port_crm_out', label: 'Out', type: 'output' }
      ],
      config: { crmAction: 'UPDATE_LEAD_STATUS', targetStatus: 'ENGAGED' }
    }
  ]);

  const [edges, setEdges] = useState<WorkflowBuilderEdge[]>(initialEdges || [
    { id: 'e1', sourceNodeId: 'node_trigger_1', sourcePortId: 'port_trig_out', targetNodeId: 'node_ai_1', targetPortId: 'port_ai_in' },
    { id: 'e2', sourceNodeId: 'node_ai_1', sourcePortId: 'port_ai_out', targetNodeId: 'node_condition_1', targetPortId: 'port_cond_in' },
    { id: 'e3', sourceNodeId: 'node_condition_1', sourcePortId: 'port_cond_true', targetNodeId: 'node_gmail_1', targetPortId: 'port_gmail_in', label: 'True' },
    { id: 'e4', sourceNodeId: 'node_condition_1', sourcePortId: 'port_cond_false', targetNodeId: 'node_crm_1', targetPortId: 'port_crm_in', label: 'False' }
  ]);

  // Variables & Modals State
  const [variables, setVariables] = useState<WorkflowVariable[]>([
    { id: 'v1', key: 'api_key', label: 'API Key', type: 'string', defaultValue: 'sp_live_902', scope: 'global' },
    { id: 'v2', key: 'target_budget', label: 'Target Budget', type: 'string', defaultValue: '$10,000', scope: 'global' }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showExecutionDrawer, setShowExecutionDrawer] = useState(false);
  const [activeExecutionHistory, setActiveExecutionHistory] = useState<WorkflowRunHistory | null>(null);

  // Execution & Dragging states
  const [isRunning, setIsRunning] = useState(false);
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Add new node from palette
  const handleAddNode = (type: NodeType, subType: string) => {
    const id = `node_${type}_${Date.now()}`;
    let title = `${type.toUpperCase()} Node`;
    let ports = [
      { id: `port_${id}_in`, label: 'In', type: 'input' as const },
      { id: `port_${id}_out`, label: 'Out', type: 'output' as const }
    ];

    if (type === 'trigger') {
      ports = [{ id: `port_${id}_out`, label: 'Out', type: 'output' as const }];
    } else if (type === 'condition') {
      ports = [
        { id: `port_${id}_in`, label: 'In', type: 'input' as const },
        { id: `port_${id}_true`, label: 'True', type: 'output' as const, conditionValue: 'true' as const },
        { id: `port_${id}_false`, label: 'False', type: 'output' as const, conditionValue: 'false' as const }
      ];
    }

    const newNode: WorkflowBuilderNode = {
      id,
      type,
      subType,
      title,
      description: `Configured for ${subType}`,
      position: { x: 300, y: nodes.length * 90 + 60 },
      ports,
      config: {}
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(id);
  };

  // Node Dragging on Canvas
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggedNodeId(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - node.position.x,
        y: e.clientY - rect.top - node.position.y
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.min(1200, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(20, Math.min(800, e.clientY - rect.top - dragOffset.y));

    setNodes(
      nodes.map((n) => (n.id === draggedNodeId ? { ...n, position: { x: newX, y: newY } } : n))
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggedNodeId(null);
  };

  // Execute Workflow Engine (Real Execution Simulation)
  const handleRunWorkflow = async () => {
    if (isRunning) return;
    setIsRunning(true);

    const runId = `run_${Date.now()}`;
    const startedAt = new Date().toISOString();
    const stepLogs: ExecutionStepLog[] = [];

    const leadPayload = {
      id: 'lead_901',
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      company: 'TechCorp India',
      email: 'ananya@techcorp.in',
      confidenceScore: 88
    };

    if (onTriggerToast) {
      onTriggerToast('Workflow Execution Started...');
    }

    try {
      for (const node of nodes) {
        setExecutingNodeId(node.id);
        const startTime = Date.now();

        // Simulate execution per node type
        let outputData: any = {};
        if (node.type === 'trigger') {
          outputData = { triggeredBy: 'NEW_LEAD', payload: leadPayload };
        } else if (node.type === 'ai') {
          // Real Gemini API call attempt
          const apiKey = localStorage.getItem('gemini_api_key') || undefined;
          const prompt = `Generate a 2-sentence cold outreach email for ${leadPayload.firstName} at ${leadPayload.company}`;
          const aiResp = await GeminiService.generateTextSafely(apiKey, prompt, "Hi Ananya, noticed TechCorp's expansion.");
          outputData = { generatedPitch: aiResp, score: 88 };
        } else if (node.type === 'condition') {
          const pass = leadPayload.confidenceScore > 75;
          outputData = { evaluation: pass ? 'TRUE_PATH' : 'FALSE_PATH', score: leadPayload.confidenceScore };
        } else if (node.type === 'gmail') {
          outputData = { emailSent: true, recipient: leadPayload.email, timestamp: new Date().toISOString() };
        } else if (node.type === 'crm') {
          outputData = { crmUpdated: true, newStatus: 'ENGAGED', leadId: leadPayload.id };
        } else {
          outputData = { executed: true };
        }

        const executionTimeMs = Date.now() - startTime + 120;
        stepLogs.push({
          nodeId: node.id,
          nodeTitle: node.title,
          nodeType: node.type,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          inputData: leadPayload,
          outputData,
          executionTimeMs
        });

        // Small pause for visual execution flow
        await new Promise((res) => setTimeout(res, 350));
      }

      const history: WorkflowRunHistory = {
        runId,
        workflowId: 'wf_visual_01',
        workflowTitle: 'No-Code Workflow Execution',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'SUCCESS',
        triggerPayload: leadPayload,
        stepLogs,
        variableSnapshots: { leadPayload }
      };

      setActiveExecutionHistory(history);
      setShowExecutionDrawer(true);
      if (onTriggerToast) {
        onTriggerToast('Workflow Executed Successfully!');
      }
    } catch (err: any) {
      console.error('Workflow execution error:', err);
    } finally {
      setIsRunning(false);
      setExecutingNodeId(null);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-[750px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-fade-in relative">
      {/* CANVAS HEADER BAR */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-xs font-bold font-mono tracking-wide uppercase">Visual Workflow Canvas</h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            NO-CODE ENGINE
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setShowVariablesModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" /> Variables ({variables.length})
          </button>

          <button
            onClick={() => setShowTemplatesModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" /> Templates
          </button>

          {activeExecutionHistory && (
            <button
              onClick={() => setShowExecutionDrawer(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" /> Execution Log
            </button>
          )}

          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Test Run Flow
              </>
            )}
          </button>
        </div>
      </div>

      {/* CANVAS MAIN BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PALETTE SIDEBAR */}
        <WorkflowNodePalette onAddNode={handleAddNode} />

        {/* INTERACTIVE BOARD AREA */}
        <div
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="flex-1 bg-slate-950 relative overflow-hidden cursor-crosshair select-none"
        >
          {/* GRID BACKGROUND */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:28px_28px]" />

          {/* SVG CONNECTING LINES */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
              const targetNode = nodes.find((n) => n.id === edge.targetNodeId);

              if (!sourceNode || !targetNode) return null;

              const x1 = sourceNode.position.x + 110;
              const y1 = sourceNode.position.y + 50;
              const x2 = targetNode.position.x + 110;
              const y2 = targetNode.position.y;

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeDasharray={isRunning ? '6 6' : undefined}
                    className={isRunning ? 'animate-pulse' : ''}
                  />
                  {edge.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      fill="#a5b4fc"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* NODES RENDER */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isExecuting = executingNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`
                }}
                className={`absolute w-56 p-3 rounded-xl border backdrop-blur-md cursor-grab active:cursor-grabbing transition-all z-20 ${
                  isExecuting
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                    : isSelected
                    ? 'bg-slate-900 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-[9px] font-mono font-bold uppercase text-indigo-400">
                    {node.type}
                  </span>
                  {isExecuting && (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  )}
                </div>

                <div className="py-1">
                  <h4 className="text-xs font-bold text-white leading-snug">{node.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{node.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT INSPECTOR SIDEBAR */}
        {selectedNode && (
          <WorkflowNodeInspector
            node={selectedNode}
            variables={variables}
            onUpdateNode={(updated) =>
              setNodes(nodes.map((n) => (n.id === updated.id ? updated : n)))
            }
            onDeleteNode={(nodeId) => {
              setNodes(nodes.filter((n) => n.id !== nodeId));
              setEdges(edges.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId));
              setSelectedNodeId(null);
            }}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* MODALS */}
      {showVariablesModal && (
        <WorkflowVariablesModal
          variables={variables}
          onSaveVariables={setVariables}
          onClose={() => setShowVariablesModal(false)}
        />
      )}

      {showTemplatesModal && (
        <WorkflowTemplatesModal
          onSelectTemplate={(tmpl: WorkflowBuilderTemplate) => {
            setNodes(tmpl.nodes);
            setEdges(tmpl.edges);
          }}
          onClose={() => setShowTemplatesModal(false)}
        />
      )}

      {showExecutionDrawer && (
        <WorkflowExecutionDrawer
          runHistory={activeExecutionHistory}
          onClose={() => setShowExecutionDrawer(false)}
          onReRun={handleRunWorkflow}
        />
      )}
    </div>
  );
}
