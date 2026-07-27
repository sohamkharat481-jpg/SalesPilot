import React, { useState } from 'react';
import { 
  Bot, Sparkles, Play, RefreshCw, Loader2, CheckCircle2, AlertTriangle, 
  Layers, ArrowRight, MessageSquare, Database, ShieldCheck, Cpu, Zap, 
  Search, Globe, Mail, Calendar, BarChart3, Award
} from 'lucide-react';
import { AgentOrchestrator } from '../../ai/agents/agent-orchestrator';
import { OrchestrationPlan, AgentType } from '../../types/agent-orchestrator';

interface MultiAgentOrchestratorViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function MultiAgentOrchestratorView({ onTriggerToast }: MultiAgentOrchestratorViewProps) {
  const [orchestrator] = useState(() => new AgentOrchestrator());
  const [goal, setGoal] = useState('Research Apex Solutions, evaluate ICP match, draft 3-step email sequence, and update CRM data.');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activePlan, setActivePlan] = useState<OrchestrationPlan | null>(null);

  const agents = orchestrator.getAgents();

  const handleRunOrchestration = async () => {
    if (!goal.trim() || isOrchestrating) return;

    setIsOrchestrating(true);
    try {
      const sampleLead = {
        id: 'lead_apex_902',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        company: 'Apex Solutions',
        email: 'rajesh@apexsolutions.in',
        title: 'VP of Engineering & Sales Ops'
      };

      const plan = await orchestrator.orchestrateGoal(goal, { lead: sampleLead });
      setActivePlan(plan);

      if (onTriggerToast) {
        onTriggerToast(`Multi-Agent Plan Completed: ${plan.overallStatus}`);
      }
    } catch (err) {
      console.error('Orchestration error:', err);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const getAgentBadgeColor = (type: AgentType) => {
    switch (type) {
      case 'sdr': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'research': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'crm': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'outreach': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'meeting': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'analytics': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'founder': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BANNER HEADER */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl text-white space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold font-mono tracking-wide uppercase">Multi-Agent AI Orchestrator</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                7 INDEPENDENT AGENTS
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Coordinated swarm execution: SDR, Research, CRM, Outreach, Meeting, Analytics & Founder Agents with shared context & failure recovery.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300">
              Inter-Agent Bus Active
            </span>
          </div>
        </div>

        {/* INPUT ORCHESTRATION GOAL */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe high-level campaign goal or multi-agent directive..."
            className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
          />
          <button
            onClick={handleRunOrchestration}
            disabled={isOrchestrating || !goal.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold font-mono rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isOrchestrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                <span>Orchestrating Swarm...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Dispatch Multi-Agent Swarm</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AGENT SWARM FLEET GRID (7 AGENTS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {agents.map((agent) => (
          <div
            key={agent.type}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getAgentBadgeColor(agent.type)}`}>
                {agent.type}
              </span>
              <span className={`w-2 h-2 rounded-full ${agent.status === 'WORKING' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{agent.name}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{agent.role}</p>
            </div>

            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 font-mono text-[9px] text-slate-400">
              Memory: {agent.memory.length} tasks
            </div>
          </div>
        ))}
      </div>

      {/* ACTIVE ORCHESTRATION PIPELINE PLAN */}
      {activePlan && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" /> Execution Plan ID: {activePlan.planId}
                </h3>
                <p className="text-[11px] text-slate-500">User Goal: "{activePlan.userGoal}"</p>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                activePlan.overallStatus === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              }`}>
                {activePlan.overallStatus}
              </span>
            </div>

            {/* PIPELINE TASKS LIST */}
            <div className="space-y-3">
              {activePlan.tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="p-3.5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{task.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getAgentBadgeColor(task.targetAgent)}`}>
                        {task.targetAgent} AGENT
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        task.status === 'COMPLETED' ? 'text-emerald-500' : task.status === 'RECOVERED' ? 'text-amber-500' : 'text-slate-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{task.description}</p>

                  {/* Task Result JSON Box */}
                  {task.resultData && (
                    <div className="p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] space-y-1 overflow-x-auto">
                      <span className="text-slate-400 uppercase font-bold block">Agent Output Data:</span>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(task.resultData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* INTER-AGENT MESSAGES & BUS */}
          {activePlan.interAgentMessages.length > 0 && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold font-mono text-slate-900 dark:text-white uppercase flex items-center gap-1.5 text-[11px]">
                <MessageSquare className="w-4 h-4 text-blue-500" /> Inter-Agent Communication Bus
              </h4>

              <div className="space-y-2">
                {activePlan.interAgentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between font-mono text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-600 dark:text-purple-400 uppercase">{msg.fromAgent}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{msg.toAgent}</span>
                    </div>

                    <span className="text-slate-400 text-[10px]">{msg.timestamp.split('T')[1]?.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
