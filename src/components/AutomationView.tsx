import React, { useState, useEffect } from 'react';
import { 
  Plus, Play, Pause, Save, Trash2, Copy, FileDown, FileUp, History, Clock, 
  GitBranch, RefreshCw, CheckCircle, AlertTriangle, ChevronRight, Settings, 
  HelpCircle, ArrowLeft, Bot, Mail, Calendar, UserPlus, FileText, Check, 
  CalendarDays, Hourglass, RotateCcw, Sliders, Globe, Search, ArrowRight, X, Info
} from 'lucide-react';
import { useAuth } from '../authentication/AuthContext';
import { AutomationWorkflow, WorkflowNode, WorkflowEdge, WorkflowRun, WorkflowLog, ScheduledJob, AutomationHistory } from '../types';

export function AutomationView() {
  const { user } = useAuth();
  const token = localStorage.getItem('token') || '';
  const orgId = user?.organizationId || 'org_salespilot_lifetime';

  // State managers
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [runLogs, setRunLogs] = useState<WorkflowLog[]>([]);
  const [history, setHistory] = useState<AutomationHistory[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  
  const [activeSubTab, setActiveSubTab] = useState<'workflows' | 'history' | 'jobs'>('workflows');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Builder panel states
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [triggerType, setTriggerType] = useState('NEW_LEAD');
  
  // Interactive Simulator
  const [simPayload, setSimPayload] = useState('{\n  "firstName": "John",\n  "lastName": "Doe",\n  "email": "john.doe@example.com",\n  "company": "Stark Industries",\n  "budget": "$10,000"\n}');
  const [simulating, setSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

  // Load workflows on mount
  useEffect(() => {
    fetchWorkflows();
    fetchHistory();
    fetchJobs();
  }, [activeSubTab]);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/workflows', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.workflows) {
        setWorkflows(data.workflows);
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/v1/workflows/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch automation history:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/v1/workflows/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Fallback: fetch all logs/jobs if desired
    } catch (err) {}
    
    // Simulate fetching scheduled jobs for organization (multi-tenant safe)
    try {
      // In a real database we'd have a specific list. We will query our general API logs 
      // or retrieve via customized endpoint.
    } catch (err) {}
  };

  const handleCreateWorkflow = async () => {
    try {
      const res = await fetch('/api/v1/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'New Sequence Outbound Workflow',
          description: 'Custom SDR automation logic triggered on new lead ingestion',
          triggerType: 'NEW_LEAD'
        })
      });
      const data = await res.json();
      if (data.success) {
        setWorkflows([data.workflow, ...workflows]);
        handleOpenBuilder(data.workflow);
      }
    } catch (err) {
      console.error('Failed to create workflow:', err);
    }
  };

  const handleOpenBuilder = (wf: AutomationWorkflow) => {
    setSelectedWorkflow(wf);
    setNodes(wf.nodes || []);
    setEdges(wf.edges || []);
    setWorkflowName(wf.name);
    setWorkflowDesc(wf.description || '');
    setTriggerType(wf.triggerType);
    setActiveNodeId(null);
    setIsEditing(true);
    fetchRuns(wf.id);
  };

  const fetchRuns = async (workflowId: string) => {
    try {
      const res = await fetch(`/api/v1/workflows/${workflowId}/runs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.runs) {
        setRuns(data.runs);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    }
  };

  const fetchRunLogs = async (workflowId: string, runId: string) => {
    try {
      const res = await fetch(`/api/v1/workflows/logs?workflowId=${workflowId}&runId=${runId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.logs) {
        setRunLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch run logs:', err);
    }
  };

  const handleSaveWorkflow = async (statusOverride?: 'DRAFT' | 'PUBLISHED' | 'PAUSED') => {
    if (!selectedWorkflow) return;
    
    const body: any = {
      name: workflowName,
      description: workflowDesc,
      triggerType,
      nodes,
      edges
    };

    if (statusOverride) {
      body.status = statusOverride;
    }

    try {
      const res = await fetch(`/api/v1/workflows/${selectedWorkflow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setSelectedWorkflow(data.workflow);
        setWorkflows(workflows.map(w => w.id === data.workflow.id ? data.workflow : w));
        alert('Workflow automation saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow? All metrics and rules will be wiped.')) return;
    try {
      const res = await fetch(`/api/v1/workflows/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWorkflows(workflows.filter(w => w.id !== id));
        if (selectedWorkflow?.id === id) {
          setIsEditing(false);
          setSelectedWorkflow(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  const handleCloneWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/workflows/${id}/clone`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWorkflows([data.workflow, ...workflows]);
        alert('Workflow duplicated successfully.');
      }
    } catch (err) {
      console.error('Failed to clone workflow:', err);
    }
  };

  const handleTriggerSimulate = async () => {
    if (!selectedWorkflow) return;
    setSimulating(true);
    setSimSuccess(null);
    try {
      let payloadObj = {};
      try {
        payloadObj = JSON.parse(simPayload);
      } catch (e) {
        alert('Invalid JSON payload structure.');
        setSimulating(false);
        return;
      }

      const res = await fetch('/api/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workflowId: selectedWorkflow.id,
          contextData: payloadObj
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimSuccess(data.runId);
        fetchRuns(selectedWorkflow.id);
        // Automatically fetch details for this run
        setTimeout(() => {
          setSelectedRun(data.runId);
          fetchRunLogs(selectedWorkflow.id, data.runId);
        }, 800);
      }
    } catch (err) {
      console.error('Trigger simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Node & Edge manipulation helpers
  const handleAddNode = (type: WorkflowNode['type']) => {
    const id = 'node_' + Math.random().toString(36).substring(2, 9);
    let label = 'New Node';
    let config: any = {};

    switch (type) {
      case 'condition':
        label = 'Condition Check';
        config = { conditionRules: { field: 'status', operator: 'equals', value: 'NEW' } };
        break;
      case 'action':
        label = 'Trigger Action';
        config = { actionType: 'SEND_GMAIL', actionConfig: { subject: 'Follow up', template: 'Hey, noticed your profile..' } };
        break;
      case 'delay':
        label = 'Time Delay';
        config = { delayMs: 60, delayType: 'duration' };
        break;
      case 'loop':
        label = 'Iterator Loop';
        config = { loopConfig: { loopCount: 3 } };
        break;
      case 'end':
        label = 'End Node';
        break;
    }

    const newNode: WorkflowNode = {
      id,
      type,
      label,
      config,
      position: { x: 100, y: nodes.length * 90 + 150 }
    };

    setNodes([...nodes, newNode]);
    setActiveNodeId(id);
  };

  const handleDeleteNode = (id: string) => {
    if (id === 'node_trigger') {
      alert('The root Trigger Node cannot be deleted.');
      return;
    }
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.source !== id && e.target !== id));
    if (activeNodeId === id) setActiveNodeId(null);
  };

  const handleAddEdge = (source: string, target: string, conditionValue?: string) => {
    if (source === target) return;
    const id = 'edge_' + Math.random().toString(36).substring(2, 9);
    const newEdge: WorkflowEdge = { id, source, target, conditionValue };
    setEdges([...edges, newEdge]);
  };

  const handleUpdateNodeConfig = (nodeId: string, updatedConfig: any) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, config: { ...n.config, ...updatedConfig } } : n));
  };

  const handleUpdateNodeLabel = (nodeId: string, label: string) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, label } : n));
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            No-Code Workflow Engine
          </h1>
          <p className="text-sm text-slate-500">
            Automate lead generation, custom AI SDR pitches, calendar meetings, and Instagram outreach sequences.
          </p>
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSubTab('workflows')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeSubTab === 'workflows' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Workflows
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeSubTab === 'history' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Execution History
            </button>
            <button
              onClick={handleCreateWorkflow}
              className="bg-blue-600 text-white text-xs px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-1.5 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        /* ==================== WORKFLOW BUILDER VIEW ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Visual Board (Left/Middle 8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-500"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="font-bold text-slate-900 border-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 text-lg w-72"
                    placeholder="Workflow Title"
                  />
                  <input
                    type="text"
                    value={workflowDesc}
                    onChange={(e) => setWorkflowDesc(e.target.value)}
                    className="text-xs text-slate-500 border-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 block w-full"
                    placeholder="Workflow Description"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-bold ${
                  selectedWorkflow?.status === 'PUBLISHED' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : selectedWorkflow?.status === 'PAUSED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {selectedWorkflow?.status || 'DRAFT'}
                </span>

                <button
                  onClick={() => handleSaveWorkflow()}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-md transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>

                <button
                  onClick={() => handleSaveWorkflow(selectedWorkflow?.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED')}
                  className={`text-white text-xs px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                    selectedWorkflow?.status === 'PUBLISHED' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {selectedWorkflow?.status === 'PUBLISHED' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {selectedWorkflow?.status === 'PUBLISHED' ? 'Pause Engine' : 'Go Live (Publish)'}
                </button>
              </div>
            </div>

            {/* Canvas Panel with Interactive Nodes */}
            <div className="bg-slate-900 rounded-xl p-6 relative border border-slate-800 shadow-inner overflow-hidden min-h-[580px] flex flex-col justify-between">
              
              {/* Visual Grid Lines Background */}
              <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

              <div className="relative z-10 flex flex-col items-center space-y-6">
                
                {/* Trigger Selector Block */}
                <div 
                  onClick={() => setActiveNodeId('node_trigger')}
                  className={`w-full max-w-md bg-slate-950 border-2 rounded-xl p-4 transition-all cursor-pointer ${
                    activeNodeId === 'node_trigger' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-mono text-blue-400">
                      <Sliders className="w-4 h-4" />
                      TRIGGER ROOT
                    </span>
                    <span className="text-[10px] font-mono bg-blue-900/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/30">
                      {triggerType}
                    </span>
                  </div>
                  <div className="mt-2">
                    <label className="block text-[10px] text-slate-500 uppercase tracking-widest">INGESTION EVENT</label>
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(e.target.value)}
                      className="mt-1 bg-slate-900 border border-slate-800 text-slate-100 rounded text-xs w-full p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="NEW_LEAD">New Lead Ingested</option>
                      <option value="LEAD_UPDATED">CRM Lead Ingested/Updated</option>
                      <option value="EMAIL_OPENED">Prospect Opened Email</option>
                      <option value="EMAIL_REPLIED">Prospect Replied To Outbound</option>
                      <option value="MEETING_BOOKED">Prospect Booked Calendar Demo</option>
                      <option value="PAYMENT_RECEIVED">Payment Successfully Received</option>
                      <option value="MANUAL_TRIGGER">Manual Button Run</option>
                    </select>
                  </div>
                </div>

                {/* Nodes Stack with Visual Links */}
                {nodes.map((node, index) => {
                  if (node.id === 'node_trigger') return null;
                  const isNodeActive = activeNodeId === node.id;
                  
                  return (
                    <div key={node.id} className="w-full flex flex-col items-center">
                      
                      {/* Connection Line & Add Edge Indicator */}
                      <div className="h-6 w-0.5 bg-blue-500/50 flex items-center justify-center relative">
                        <div className="absolute w-2 h-2 rounded-full bg-blue-400 -bottom-1" />
                      </div>

                      <div 
                        onClick={() => setActiveNodeId(node.id)}
                        className={`w-full max-w-md bg-slate-950 border rounded-xl p-4 transition-all cursor-pointer relative ${
                          isNodeActive ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="absolute top-3 right-3 text-slate-600 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            node.type === 'condition' ? 'bg-amber-900/20 text-amber-400' :
                            node.type === 'action' ? 'bg-emerald-900/20 text-emerald-400' :
                            node.type === 'delay' ? 'bg-purple-900/20 text-purple-400' :
                            'bg-slate-900/50 text-slate-400'
                          }`}>
                            {node.type === 'condition' && <GitBranch className="w-4 h-4" />}
                            {node.type === 'action' && <Bot className="w-4 h-4" />}
                            {node.type === 'delay' && <Hourglass className="w-4 h-4" />}
                            {node.type === 'end' && <Check className="w-4 h-4" />}
                          </div>
                          
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">{node.type}</span>
                            <span className="text-xs font-semibold text-slate-200 block">{node.label}</span>
                          </div>
                        </div>

                        {/* Node Specific Details Tag */}
                        <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/50 p-1.5 rounded border border-slate-800/30">
                          {node.type === 'action' && `Action: ${node.config?.actionType || 'Unset'}`}
                          {node.type === 'delay' && `Delay: ${node.config?.delayMs || 0} seconds`}
                          {node.type === 'condition' && `Rule: ${node.config?.conditionRules?.field || 'status'} ${node.config?.conditionRules?.operator || 'equals'} ${node.config?.conditionRules?.value || ''}`}
                          {node.type === 'end' && 'Terminates Execution Run'}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Nodes Empty Placeholder / Inserter Toolbar */}
                <div className="pt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleAddNode('action')}
                    className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-md text-xs font-mono transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Action Node
                  </button>

                  <button
                    onClick={() => handleAddNode('condition')}
                    className="bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-md text-xs font-mono transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Condition Node
                  </button>

                  <button
                    onClick={() => handleAddNode('delay')}
                    className="bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 px-3 py-1.5 rounded-md text-xs font-mono transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Delay Node
                  </button>

                  <button
                    onClick={() => handleAddNode('end')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-xs font-mono transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    + End Node
                  </button>
                </div>

              </div>

              {/* Bottom Instruction Panel */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>ACTIVE PIPELINE ID: {selectedWorkflow?.id}</span>
                <span>CHRONOLOGICAL SEQUENTIAL FLOW</span>
              </div>
            </div>

          </div>

          {/* Configuration Inspector Sidebar (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Inspector Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-600" />
                Node Properties
              </h3>

              {activeNodeId ? (
                (() => {
                  const activeNode = nodes.find(n => n.id === activeNodeId);
                  if (!activeNode) return <p className="text-xs text-slate-500">Node not found.</p>;

                  return (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase">NODE TITLE</label>
                        <input
                          type="text"
                          value={activeNode.label}
                          onChange={(e) => handleUpdateNodeLabel(activeNode.id, e.target.value)}
                          className="mt-1 w-full bg-slate-50 border border-slate-200 rounded text-xs p-2 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {activeNode.type === 'action' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">ACTION TYPE</label>
                            <select
                              value={activeNode.config?.actionType || 'SEND_GMAIL'}
                              onChange={(e) => handleUpdateNodeConfig(activeNode.id, { actionType: e.target.value })}
                              className="mt-1 w-full bg-slate-50 border border-slate-200 rounded text-xs p-2 focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="SEND_GMAIL">Send Email via Gmail Integration</option>
                              <option value="GENERATE_PROPOSAL">Generate AI Proposal (Gemini)</option>
                              <option value="SCHEDULE_MEETING">Book Google Meet Appointment</option>
                              <option value="CREATE_LEAD">Create CRM Lead</option>
                              <option value="UPDATE_LEAD">Update CRM Lead</option>
                              <option value="ASSIGN_LEAD">Assign Lead to Agent</option>
                              <option value="CREATE_NOTE">Log Timeline Activity Note</option>
                              <option value="SEND_INSTAGRAM_MESSAGE">Direct Message @Instagram DM</option>
                            </select>
                          </div>

                          {/* Action Parameters */}
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2.5">
                            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Payload Parameters</span>
                            
                            {activeNode.config?.actionType === 'SEND_GMAIL' && (
                              <>
                                <input
                                  type="text"
                                  placeholder="Subject Line"
                                  value={activeNode.config?.actionConfig?.subject || ''}
                                  onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                    actionConfig: { ...activeNode.config?.actionConfig, subject: e.target.value } 
                                  })}
                                  className="w-full bg-white border border-slate-200 rounded text-xs p-1.5"
                                />
                                <textarea
                                  placeholder="Message Body (supports context tokens)"
                                  value={activeNode.config?.actionConfig?.template || ''}
                                  onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                    actionConfig: { ...activeNode.config?.actionConfig, template: e.target.value } 
                                  })}
                                  className="w-full h-24 bg-white border border-slate-200 rounded text-xs p-1.5 focus:outline-none"
                                />
                              </>
                            )}

                            {activeNode.config?.actionType === 'GENERATE_PROPOSAL' && (
                              <input
                                type="text"
                                placeholder="Target Budget Context Token (e.g. {{budget}})"
                                value={activeNode.config?.actionConfig?.budget || ''}
                                onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                  actionConfig: { ...activeNode.config?.actionConfig, budget: e.target.value } 
                                })}
                                className="w-full bg-white border border-slate-200 rounded text-xs p-1.5"
                              />
                            )}

                            {activeNode.config?.actionType === 'CREATE_LEAD' && (
                              <>
                                <input
                                  type="text"
                                  placeholder="Company Name"
                                  value={activeNode.config?.actionConfig?.company || ''}
                                  onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                    actionConfig: { ...activeNode.config?.actionConfig, company: e.target.value } 
                                  })}
                                  className="w-full bg-white border border-slate-200 rounded text-xs p-1.5 mb-1"
                                />
                                <input
                                  type="text"
                                  placeholder="Lead Ingestion Email"
                                  value={activeNode.config?.actionConfig?.email || ''}
                                  onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                    actionConfig: { ...activeNode.config?.actionConfig, email: e.target.value } 
                                  })}
                                  className="w-full bg-white border border-slate-200 rounded text-xs p-1.5"
                                />
                              </>
                            )}

                            {activeNode.config?.actionType === 'CREATE_NOTE' && (
                              <input
                                type="text"
                                placeholder="Activity text (e.g. Lead signed proposal)"
                                value={activeNode.config?.actionConfig?.note || ''}
                                onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                  actionConfig: { ...activeNode.config?.actionConfig, note: e.target.value } 
                                })}
                                className="w-full bg-white border border-slate-200 rounded text-xs p-1.5"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {activeNode.type === 'condition' && (
                        <div className="space-y-3">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase">RULES ROUTING</label>
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
                            <input
                              type="text"
                              placeholder="Lead Field (e.g. company, status)"
                              value={activeNode.config?.conditionRules?.field || ''}
                              onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                conditionRules: { ...activeNode.config?.conditionRules, field: e.target.value } 
                              })}
                              className="w-full bg-white border border-slate-200 rounded text-xs p-1.5"
                            />
                            <select
                              value={activeNode.config?.conditionRules?.operator || 'equals'}
                              onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                conditionRules: { ...activeNode.config?.conditionRules, operator: e.target.value } 
                              })}
                              className="w-full bg-white border border-slate-200 rounded text-xs p-1.5"
                            >
                              <option value="equals">Equals (exact matches)</option>
                              <option value="contains">Contains (substrings)</option>
                              <option value="gt">Greater Than (numerics)</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Match target value"
                              value={activeNode.config?.conditionRules?.value || ''}
                              onChange={(e) => handleUpdateNodeConfig(activeNode.id, { 
                                conditionRules: { ...activeNode.config?.conditionRules, value: e.target.value } 
                              })}
                              className="w-full bg-white border border-slate-200 rounded text-xs p-1.5"
                            />
                          </div>
                        </div>
                      )}

                      {activeNode.type === 'delay' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">DURATION (SECONDS)</label>
                            <input
                              type="number"
                              value={activeNode.config?.delayMs || 30}
                              onChange={(e) => handleUpdateNodeConfig(activeNode.id, { delayMs: Number(e.target.value) })}
                              className="mt-1 w-full bg-slate-50 border border-slate-200 rounded text-xs p-2 focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="block text-[10px] text-slate-500 font-mono mt-1">Simulates queue delay in backend</span>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-6 text-slate-400 space-y-1">
                  <Info className="w-5 h-5 mx-auto text-slate-300" />
                  <p className="text-xs">Click any node on the canvas layout board to edit properties and action payloads.</p>
                </div>
              )}
            </div>

            {/* Simulated Execution Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Play className="w-4 h-4 text-emerald-600" />
                Live Ingestion Sandbox
              </h3>

              <div className="space-y-3">
                <span className="block text-[11px] text-slate-500 font-mono">Simulate a real lead ingested to test routing outputs:</span>
                <textarea
                  value={simPayload}
                  onChange={(e) => setSimPayload(e.target.value)}
                  className="w-full h-32 bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-lg focus:outline-none"
                />

                <button
                  onClick={handleTriggerSimulate}
                  disabled={simulating}
                  className="w-full bg-slate-900 text-white font-semibold text-xs py-2 rounded-md hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                >
                  {simulating ? <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  {simulating ? 'Ingesting Mock Event...' : 'Trigger Simulation Run'}
                </button>

                {simSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-700 font-bold block">✓ SANDBOX INGESTION RUN STARTED</span>
                    <span className="text-[9px] font-mono text-slate-500 block">ID: {simSuccess}</span>
                    <p className="text-[10px] text-slate-600">The workflow run was dispatched to background runner successfully.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Run Execution Logs */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 max-h-[300px] overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-600" />
                Execution Runs
              </h3>

              <div className="space-y-2">
                {runs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No logged runs detected.</p>
                ) : (
                  runs.map(run => (
                    <div 
                      key={run.id}
                      onClick={() => {
                        setSelectedRun(run);
                        fetchRunLogs(selectedWorkflow.id, run.id);
                      }}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                        selectedRun?.id === run.id ? 'bg-blue-50/50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">{run.id}</span>
                        <span className="text-[11px] font-semibold text-slate-700 block">Started: {new Date(run.startedAt).toLocaleTimeString()}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        run.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Execution Trace Logs Modal if a run is selected */}
          {selectedRun && runLogs.length > 0 && (
            <div className="col-span-12 bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-slate-200 font-mono">Trace Logs: {selectedRun.id || selectedRun}</h4>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    selectedRun.status === 'COMPLETED' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/30' :
                    selectedRun.status === 'FAILED' ? 'bg-rose-900/30 text-rose-400 border border-rose-800/30' :
                    'bg-blue-900/30 text-blue-400 border border-blue-800/30'
                  }`}>
                    {selectedRun.status || 'RUNNING'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="p-1 hover:bg-slate-800 rounded transition text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto font-mono text-xs">
                {runLogs.map((log, index) => (
                  <div key={log.id || index} className="border-l-2 border-blue-500/30 pl-3 py-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                        {log.status === 'SUCCESS' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        {log.nodeType ? `${log.nodeType.toUpperCase()} Step` : 'Run Event'}
                      </span>
                      <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-200">{log.message}</p>
                    {log.details && (
                      <pre className="mt-1.5 p-2 bg-slate-950 border border-slate-800/50 rounded text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {log.details}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ==================== WORKFLOWS LIST VIEW ==================== */
        activeSubTab === 'workflows' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-slate-500 mt-2">Loading multi-tenant workflow engines...</p>
              </div>
            ) : workflows.length === 0 ? (
              <div className="col-span-full border-2 border-dashed border-slate-200 rounded-xl p-12 text-center space-y-4">
                <Bot className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="font-bold text-slate-800">No active workflows defined.</h3>
                  <p className="text-xs text-slate-500">Create automated outbound sequences using AI SDR or Gmail triggers.</p>
                </div>
                <button
                  onClick={handleCreateWorkflow}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-md font-semibold transition"
                >
                  Create Your First Automation
                </button>
              </div>
            ) : (
              workflows.map(wf => (
                <div 
                  key={wf.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        {wf.id}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-bold ${
                        wf.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {wf.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-3">{wf.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{wf.description}</p>

                    <div className="mt-4 flex items-center gap-4 text-[11px] font-mono text-slate-400 border-t border-slate-50 pt-3">
                      <div>
                        <span className="block text-slate-500 uppercase text-[9px]">Trigger Event</span>
                        <span className="font-bold text-slate-700">{wf.triggerType}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase text-[9px]">Nodes Count</span>
                        <span className="font-bold text-slate-700">{wf.nodes?.length || 2}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase text-[9px]">Revision</span>
                        <span className="font-bold text-slate-700">v{wf.version || 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenBuilder(wf)}
                      className="flex-1 bg-slate-900 text-white text-xs py-1.5 rounded hover:bg-slate-800 transition font-semibold"
                    >
                      Open Visual Editor
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCloneWorkflow(wf.id)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-600 transition"
                        title="Duplicate Workflow"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteWorkflow(wf.id)}
                        className="p-1.5 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded text-slate-500 hover:text-rose-600 transition"
                        title="Wipe Workflow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ==================== EXECUTION TIMELINE HISTORY VIEW ==================== */
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Historical Operational Audit</h3>
              <button 
                onClick={fetchHistory}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-600 transition flex items-center gap-1.5 text-xs font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">No audit log records tracked yet.</p>
              ) : (
                history.map(item => (
                  <div key={item.id} className="border-l-2 border-slate-200 pl-4 py-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          item.action === 'CREATE' ? 'bg-blue-100 text-blue-800' :
                          item.action === 'PUBLISH' ? 'bg-emerald-100 text-emerald-800' :
                          item.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {item.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Workflow: {item.workflowName} (ID: {item.workflowId})</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{item.details}</p>
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">Operator: {item.userEmail} (ID: {item.userId})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
