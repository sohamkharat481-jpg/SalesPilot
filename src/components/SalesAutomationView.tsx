import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, Calendar, CheckCircle2, AlertCircle, ArrowUpRight, 
  Sparkles, ShieldCheck, RefreshCw, UserCheck, Zap, History, FileText, 
  ListTodo, Mail, Phone, ChevronRight, BarChart2, Layers
} from 'lucide-react';
import { Lead, Appointment, Deal } from '../types';
import { FollowupScheduler, FollowupScheduleItem, MeetingReminderItem } from '../automation/followup-scheduler';
import { LeadAgingEngine, AgedLeadReport } from '../automation/lead-aging';
import { AutoTaskEngine, AutoTask, DailyAgenda } from '../automation/auto-task-engine';
import { PriorityEngine, LeadPriorityScore, PipelineAutomationRule } from '../automation/priority-engine';
import { NextBestActionEngine, NextBestActionResult, PipelineRecommendationResult } from '../automation/next-best-action';
import { CrmSyncTimelineManager, ActivityTimelineItem, CrmHistoryRecord } from '../automation/crm-sync-timeline';

interface SalesAutomationViewProps {
  leads: Lead[];
  appointments: Appointment[];
  deals: Deal[];
  onRefreshLeads?: () => void;
}

export function SalesAutomationView({ leads, appointments, deals, onRefreshLeads }: SalesAutomationViewProps) {
  const [activeTab, setActiveTab] = useState<'agenda' | 'priority' | 'aging' | 'tasks' | 'timeline' | 'rules'>('agenda');
  
  // Automation Engine States
  const [dailyAgenda, setDailyAgenda] = useState<DailyAgenda | null>(null);
  const [priorities, setPriorities] = useState<LeadPriorityScore[]>([]);
  const [agingReports, setAgingReports] = useState<AgedLeadReport[]>([]);
  const [autoTasks, setAutoTasks] = useState<AutoTask[]>([]);
  const [reminders, setReminders] = useState<MeetingReminderItem[]>([]);
  const [timeline, setTimeline] = useState<ActivityTimelineItem[]>([]);
  const [historyLedger, setHistoryLedger] = useState<CrmHistoryRecord[]>([]);
  const [pipelineRules, setPipelineRules] = useState<PipelineAutomationRule[]>([]);
  
  // AI Next Best Action State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);
  const [nextAction, setNextAction] = useState<NextBestActionResult | null>(null);
  const [dealRec, setDealRec] = useState<PipelineRecommendationResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [autoMovedMsg, setAutoMovedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (leads.length > 0) {
      if (!selectedLead) setSelectedLead(leads[0]);
      
      const agenda = AutoTaskEngine.buildDailyAgenda(leads, appointments, deals);
      setDailyAgenda(agenda);

      const prio = PriorityEngine.calculateLeadPriorities(leads);
      setPriorities(prio);

      const aging = LeadAgingEngine.analyzeLeadAging(leads);
      setAgingReports(aging);

      const tasks = AutoTaskEngine.generateAutoTasks(leads, appointments, deals);
      setAutoTasks(tasks);

      const rems = FollowupScheduler.generateMeetingReminders(appointments);
      setReminders(rems);

      setTimeline(CrmSyncTimelineManager.getActivityTimeline());
      setHistoryLedger(CrmSyncTimelineManager.getCrmHistory());
      setPipelineRules(PriorityEngine.getDefaultPipelineRules());
    }
  }, [leads, appointments, deals]);

  // Handle Automatic Lead Status Movement
  const handleTriggerAutoAgingSync = () => {
    const { movedCount } = LeadAgingEngine.applyAutomaticStatusMovement(leads);
    setAutoMovedMsg(`Successfully analyzed ${leads.length} accounts. ${movedCount} stale leads automatically transitioned to STALE/ARCHIVED stage in CRM.`);
    if (onRefreshLeads) onRefreshLeads();
  };

  // Trigger AI Next Best Action calculation
  const handleFetchNextBestAction = async (lead: Lead) => {
    setSelectedLead(lead);
    setLoadingAi(true);
    try {
      const res = await NextBestActionEngine.generateNextBestAction(lead);
      setNextAction(res);
      
      const deal = deals.find(d => d.leadId === lead.id) || deals[0];
      if (deal) {
        const dRec = await NextBestActionEngine.generateDealRecommendation(deal);
        setDealRec(dRec);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Sales Automation Mode Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-900/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              SALES AUTOMATION MODE
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Autonomous Outbound Engine</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Real-time lead aging detection, auto task assignment, pipeline status movement, meeting reminders, and AI next-best-action execution synced to CRM.
          </p>
        </div>

        <button
          onClick={handleTriggerAutoAgingSync}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          Trigger Auto Status Sync
        </button>
      </div>

      {autoMovedMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {autoMovedMsg}
          </span>
          <button onClick={() => setAutoMovedMsg(null)} className="text-emerald-600 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'agenda' as const, label: 'Daily Agenda', icon: Calendar },
          { id: 'priority' as const, label: 'Priority Engine', icon: Zap },
          { id: 'aging' as const, label: 'Lead Aging', icon: Clock },
          { id: 'tasks' as const, label: 'Auto Tasks', icon: ListTodo },
          { id: 'timeline' as const, label: 'Activity & History', icon: History },
          { id: 'rules' as const, label: 'Pipeline Rules', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                active 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DAILY AGENDA */}
      {activeTab === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" /> Today's Prioritized Agenda ({dailyAgenda?.date})
                </h3>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {dailyAgenda?.totalTasks || 0} Total Actions Due
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl">
                <strong>AI Executive Guidance:</strong> {dailyAgenda?.aiActionSummary}
              </p>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">High Priority Tasks</h4>
                {autoTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{task.company} • {task.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 uppercase">
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Reminders Engine */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" /> Automated Meeting Reminders ({reminders.length})
              </h3>
              {reminders.map((rem) => (
                <div key={rem.id} className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">{rem.leadName} ({rem.company})</span>
                    <p className="text-[11px] text-slate-500">{rem.message}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {rem.reminderType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Next Best Action Widget */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" /> AI Next-Best-Action Advisor
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Select Target Account</label>
              <select
                value={selectedLead?.id || ''}
                onChange={(e) => {
                  const lead = leads.find(l => l.id === e.target.value);
                  if (lead) handleFetchNextBestAction(lead);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.firstName} {l.lastName} ({l.company})</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => selectedLead && handleFetchNextBestAction(selectedLead)}
              disabled={loadingAi}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Generate Next Action Script
            </button>

            {nextAction && (
              <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold text-purple-900 dark:text-purple-300">
                  <span>Recommendation: {nextAction.actionType}</span>
                  <span className="text-[10px] font-mono text-emerald-600">{nextAction.expectedConversionImpact}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px]">{nextAction.primaryRecommendation}</p>
                <div className="p-2 bg-white dark:bg-slate-900 rounded border border-purple-100 dark:border-purple-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  "{nextAction.suggestedScript}"
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRIORITY ENGINE */}
      {activeTab === 'priority' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Lead Priority & ICP Fit Matrix
            </h3>
            <span className="text-xs text-slate-500 font-mono">Calculated on title, company size, tech stack & engagement</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {priorities.map((prio) => (
              <div key={prio.leadId} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{prio.leadName}</span>
                    <span className="text-slate-500">({prio.company})</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      prio.tier === 'TIER_1_HOT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {prio.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{prio.recommendedAction}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{prio.priorityScore}/100</div>
                    <div className="text-[9px] font-mono text-slate-400">Priority Index</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LEAD AGING */}
      {activeTab === 'aging' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Lead Aging & Inactivity Detection
            </h3>
            <button
              onClick={handleTriggerAutoAgingSync}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Auto-Move Stale Leads
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agingReports.map((report) => (
              <div key={report.leadId} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{report.leadName}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                    report.agingCategory === 'FRESH' ? 'bg-emerald-100 text-emerald-800' :
                    report.agingCategory === 'STALE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {report.agingCategory} ({report.daysUncontacted}d)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{report.company}</div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">Action: {report.actionRequired}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUTO TASKS */}
      {activeTab === 'tasks' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-emerald-500" /> Auto-Generated Task Queue ({autoTasks.length})
          </h3>
          <div className="space-y-2">
            {autoTasks.map((t) => (
              <div key={t.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                  <p className="text-slate-500 text-[11px]">{t.description}</p>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                  {t.taskType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVITY TIMELINE & CRM HISTORY */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Activity Timeline
            </h3>
            <div className="space-y-3">
              {timeline.map((act) => (
                <div key={act.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">{act.title}</span>
                    <span className="text-[9px] font-mono text-slate-400">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{act.description}</p>
                  <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400">Actor: {act.actor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-500" /> CRM Audit & History Ledger
            </h3>
            <div className="space-y-3">
              {historyLedger.map((hist) => (
                <div key={hist.id} className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                    <span>{hist.leadName}</span>
                    <span className="text-[9px] font-mono text-purple-600 dark:text-purple-300">{hist.fieldChanged.toUpperCase()}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">Changed from <strong className="line-through">{hist.oldValue}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{hist.newValue}</strong></p>
                  <span className="text-[9px] font-mono text-slate-400">Logged by: {hist.changedBy}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PIPELINE AUTOMATION RULES */}
      {activeTab === 'rules' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> Active Pipeline Trigger Rules
          </h3>
          <div className="space-y-2">
            {pipelineRules.map((rule) => (
              <div key={rule.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">{rule.name}</span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span>Trigger: <strong>{rule.trigger}</strong></span>
                    <span>•</span>
                    <span>Action: <strong>{rule.action} {rule.targetStage ? `-> ${rule.targetStage}` : ''}</strong></span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
