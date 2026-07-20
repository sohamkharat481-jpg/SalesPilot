import React, { useState, useEffect } from 'react';
import { 
  Terminal, Bot, Brain, ShieldCheck, CheckCircle2, AlertTriangle, 
  RefreshCw, Play, Pause, Send, Check, X, FileText, Calendar, 
  TrendingUp, Users, Mail, DollarSign, Activity, HelpCircle, 
  Clock, ShieldAlert, Award, ArrowUpRight, Zap
} from 'lucide-react';
import { AIAgent, AgentTask, AgentMemory, AgentLog } from '../types/brain';

export function BrainView() {
  const [command, setCommand] = useState('');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTaskTab, setActiveTaskTab] = useState<'all' | 'pending' | 'running' | 'approval' | 'completed'>('all');
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const presets = [
    { text: "Find 100 SaaS companies in Mumbai.", icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { text: "Email all hot leads.", icon: Mail, color: "text-emerald-500 bg-emerald-500/10" },
    { text: "Book meetings with CEOs.", icon: Calendar, color: "text-purple-500 bg-purple-500/10" },
    { text: "Generate proposals.", icon: FileText, color: "text-amber-500 bg-amber-500/10" },
    { text: "Show today's revenue.", icon: TrendingUp, color: "text-cyan-500 bg-cyan-500/10" }
  ];

  // Fetch all data
  const fetchData = async (showProgress = false) => {
    if (showProgress) setIsRefreshing(true);
    try {
      const [tasksRes, historyRes] = await Promise.all([
        fetch('/api/v1/brain/tasks'),
        fetch('/api/v1/brain/history')
      ]);

      const tasksData = await tasksRes.json();
      const historyData = await historyRes.json();

      if (tasksData.success) {
        setTasks(tasksData.tasks || []);
        setAgents(tasksData.agents || []);
      }

      if (historyData.success) {
        setLogs(historyData.logs || []);
        setMemories(historyData.memories || []);
      }
    } catch (err) {
      console.error('[BrainView] Error fetching brain statistics:', err);
    } finally {
      if (showProgress) setIsRefreshing(false);
    }
  };

  // Poll for real-time changes
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 3000);
    return () => clearInterval(interval);
  }, []);

  // Submit natural language command
  const handleSubmitCommand = async (e?: React.FormEvent, customCommand?: string) => {
    if (e) e.preventDefault();
    const commandToSubmit = customCommand || command;
    if (!commandToSubmit.trim() || isLoading) return;

    setIsLoading(true);
    setCommand('');
    try {
      const response = await fetch('/api/v1/brain/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandToSubmit })
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert(`Failed to execute: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error contacting SalesPilot Brain Engine.');
    } finally {
      setIsLoading(false);
    }
  };

  // Process human approval
  const handleApproval = async (taskId: string, approvalId: string, approved: boolean) => {
    const notes = approvalNotes[approvalId] || '';
    setProcessingId(approvalId);
    try {
      const response = await fetch('/api/v1/brain/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, approvalId, approved, notes })
      });
      const data = await response.json();
      if (data.success) {
        // Clear notes slot
        setApprovalNotes(prev => {
          const updated = { ...prev };
          delete updated[approvalId];
          return updated;
        });
        fetchData();
      } else {
        alert(`Failed to submit decision: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter(t => {
    if (activeTaskTab === 'all') return true;
    if (activeTaskTab === 'pending') return t.status === 'pending';
    if (activeTaskTab === 'running') return t.status === 'running';
    if (activeTaskTab === 'approval') return t.status === 'approval_required';
    if (activeTaskTab === 'completed') return t.status === 'completed' || t.status === 'failed';
    return true;
  });

  // Count helper
  const getTaskCount = (status: string) => {
    if (status === 'all') return tasks.length;
    if (status === 'approval') return tasks.filter(t => t.status === 'approval_required').length;
    return tasks.filter(t => t.status === status).length;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600 animate-pulse" />
            SalesPilot Brain
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Autonomous multi-agent orchestration, continuous B2B research, and secure CRM pipeline synchronization.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Brain Core: Active
          </span>
          <button 
            onClick={() => fetchData(true)}
            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition"
            title="Refresh logs & statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CORE GRID: TOP PANEL IS THE TERMINAL COMMAND CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COMMAND CENTER TERMINAL */}
        <div className="lg:col-span-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between">
          <div className="border-b border-slate-900 px-4 py-3 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-purple-400">AI Intelligent Command Terminal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
          </div>

          <div className="p-5 flex-1 min-h-[160px] space-y-4">
            <p className="text-xs text-slate-400 font-mono">
              $ salespilot --brain-mode=autonomous --secure-oversight
              <br />
              <span className="text-emerald-400">✓ System initialized. All 8 collaborative sales agents logged in.</span>
            </p>

            {/* PRESETS BUTTON GRID */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Preset commands available:</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmitCommand(undefined, p.text)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-[11px] text-slate-300 font-sans rounded-lg border border-slate-800/60 hover:border-purple-500/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <p.icon className="w-3.5 h-3.5" />
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSubmitCommand} className="p-3 bg-slate-900/30 border-t border-slate-900 flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                placeholder="Instruct the Brain (e.g., 'Find SaaS companies in Mumbai and pitch CEOs')..."
                className="w-full bg-slate-950 text-slate-100 border border-slate-850 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-purple-500 font-sans placeholder-slate-600"
                disabled={isLoading}
              />
              <Bot className="absolute right-3 top-3 w-4 h-4 text-slate-600 animate-pulse" />
            </div>
            <button
              type="submit"
              disabled={!command.trim() || isLoading}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Dispatch
            </button>
          </form>
        </div>

        {/* AGENTS MONITORING GRID */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-blue-500" /> Active Agent Network
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">Count: 8</span>
          </div>

          <div className="space-y-2.5 max-h-[295px] overflow-y-auto pr-1">
            {agents.map(a => {
              const isWorking = a.status === 'working';
              return (
                <div 
                  key={a.id} 
                  className={`p-2.5 rounded-lg border transition ${isWorking ? 'bg-purple-50/40 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/40' : 'bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{a.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${isWorking ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-semibold' : 'bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400'}`}>
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Capabilities: {a.capabilities.slice(0, 2).join(', ')}...
                  </div>
                </div>
              );
            })}
            {agents.length === 0 && (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-mono">
                No active agent network registered. Click "Dispatch" to spin up.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HUMAN APPROVAL GATEWAY - SENSITIVE OPERATION QUEUE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Human Approval Hub</h2>
              <p className="text-[10px] text-slate-400">Strict safety controls active. Require manual rep authorization before dispatching emails or updating billing.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30">
            {tasks.filter(t => t.status === 'approval_required').length} Pending Requests
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.filter(t => t.status === 'approval_required').flatMap(t => 
            (t.approvals || []).filter(a => a.status === 'pending').map(a => (
              <div key={a.id} className="border border-amber-200 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-500 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Action Authorization Required
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Req ID: {a.id}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{a.details}</div>
                </div>

                {/* Optional reviewer notes input */}
                <input
                  type="text"
                  placeholder="Reviewer notes (optional)..."
                  value={approvalNotes[a.id] || ''}
                  onChange={e => setApprovalNotes(prev => ({ ...prev, [a.id]: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproval(t.id, a.id, true)}
                    disabled={processingId === a.id}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Action
                  </button>
                  <button
                    onClick={() => handleApproval(t.id, a.id, false)}
                    disabled={processingId === a.id}
                    className="py-1.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}

          {tasks.filter(t => t.status === 'approval_required').length === 0 && (
            <div className="md:col-span-2 py-8 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-xs font-semibold">All transactions authorized</div>
              <div className="text-[10px] mt-0.5 text-slate-400">Sensitive triggers are clear and compliant.</div>
            </div>
          )}
        </div>
      </div>

      {/* TABS FOR PLANNED TASK LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TASK QUEUE TIMELINE (PLANNER) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-500" /> AI Planner Task Queue
            </h2>
            
            {/* Filter Buttons */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-850 p-1 rounded-lg text-[10px] font-semibold border border-slate-150 dark:border-slate-800">
              {(['all', 'pending', 'running', 'approval', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTaskTab(tab)}
                  className={`px-2.5 py-1 rounded-md capitalize transition cursor-pointer ${activeTaskTab === tab ? 'bg-white dark:bg-slate-900 shadow-sm text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab === 'approval' ? 'Approval Reqd' : tab} ({getTaskCount(tab)})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {filteredTasks.map(t => {
              let badgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400";
              if (t.status === 'running') badgeColor = "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 animate-pulse";
              if (t.status === 'completed') badgeColor = "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
              if (t.status === 'approval_required') badgeColor = "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-bold";
              if (t.status === 'failed') badgeColor = "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400";

              return (
                <div key={t.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {t.title}
                        {t.retryCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-mono">
                            Retry {t.retryCount}/3
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.description}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase shrink-0 ${badgeColor}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Steps Progress Checklist */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/10 rounded-lg p-2.5 space-y-2">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">Planned steps execution</div>
                    <div className="space-y-1.5">
                      {t.steps.map((s, idx) => {
                        const isStepCompleted = s.status === 'completed';
                        const isStepRunning = s.status === 'running';
                        return (
                          <div key={s.id} className="flex items-center gap-2 text-xs">
                            {isStepCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : isStepRunning ? (
                              <RefreshCw className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                            ) : s.status === 'failed' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] text-slate-400 font-mono font-bold">{idx + 1}</span>
                            )}
                            <span className={`${isStepCompleted ? 'text-slate-400 line-through' : isStepRunning ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>{s.description}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No active planner tasks matching selection found.
              </div>
            )}
          </div>
        </div>

        {/* ORGANIZATIONAL MEMORY DIRECTORY */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-purple-500" /> AI Memory Directory
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">Keys: {memories.length}</span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {memories.map(m => (
              <div key={m.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-850/40 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
                    {m.category}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">{new Date(m.lastAccessedAt).toLocaleTimeString()}</span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.key}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-normal bg-white dark:bg-slate-950 p-1.5 rounded border border-slate-100 dark:border-slate-850 overflow-x-auto scrollbar-none">
                  {typeof m.value === 'object' ? JSON.stringify(m.value, null, 2) : String(m.value)}
                </div>
              </div>
            ))}

            {memories.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No active memories logged. Submit commands to train memory context.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTINUOUS WORKSPACE TELEMETRY (CHAIN-OF-THOUGHT LOGS) */}
      <div className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <h2 className="text-xs font-bold tracking-wider uppercase text-purple-400 flex items-center gap-1.5 font-mono">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" /> Workspace Chain-of-Thought Telemetry
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Live Logs: {logs.length}</span>
        </div>

        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 font-mono text-[11px] leading-relaxed">
          {logs.map(l => {
            let prefix = "⚙️ [SYSTEM]";
            let color = "text-slate-300";
            if (l.level === 'warn') {
              prefix = "⚠️ [WARN]";
              color = "text-amber-400";
            } else if (l.level === 'error') {
              prefix = "🚨 [ERROR]";
              color = "text-rose-500";
            } else if (l.level === 'debug') {
              prefix = "🐛 [DEBUG]";
              color = "text-cyan-500";
            } else if (l.agentId) {
              prefix = `🤖 [AGENT: ${l.level.toUpperCase()}]`;
              color = "text-purple-400";
            }

            return (
              <div key={l.id} className="p-1.5 rounded hover:bg-slate-900/40 transition">
                <span className="text-slate-500 mr-2">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                <span className={`font-bold mr-1.5 ${color}`}>{prefix}</span>
                <span className="text-slate-200">{l.message}</span>
                {l.reasoning && (
                  <div className="text-[10px] text-purple-500 dark:text-purple-400 pl-4 mt-0.5 border-l border-purple-900/50">
                    ↳ <span className="italic font-sans">Reasoning: {l.reasoning}</span>
                  </div>
                )}
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="text-center py-8 text-slate-600 text-xs font-mono">
              No continuous workspace telemetry recorded yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
