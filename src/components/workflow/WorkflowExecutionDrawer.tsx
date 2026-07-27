import React, { useState } from 'react';
import { 
  X, History, Play, CheckCircle2, AlertTriangle, Clock, 
  ChevronRight, Terminal, ArrowRight, RefreshCw, FileText
} from 'lucide-react';
import { WorkflowRunHistory, ExecutionStepLog } from '../../types/workflow-builder';

interface WorkflowExecutionDrawerProps {
  runHistory: WorkflowRunHistory | null;
  onClose: () => void;
  onReRun?: () => void;
}

export function WorkflowExecutionDrawer({
  runHistory,
  onClose,
  onReRun
}: WorkflowExecutionDrawerProps) {
  const [selectedLog, setSelectedLog] = useState<ExecutionStepLog | null>(
    runHistory?.stepLogs?.[0] || null
  );

  if (!runHistory) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase">
              Execution Debugger & History Log
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Run ID: {runHistory.runId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReRun && (
            <button
              onClick={onReRun}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Run Flow
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            runHistory.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
          }`}>
            {runHistory.status}
          </span>
          <span className="text-slate-500">Started: {runHistory.startedAt.split('T')[1]?.slice(0, 8)}</span>
        </div>
        <span className="text-slate-400">{runHistory.stepLogs.length} Steps Executed</span>
      </div>

      {/* CONTENT: STEP LIST (LEFT) & STEP DATA INSPECTOR (RIGHT) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {/* STEP LIST */}
        <div className="p-3 space-y-2 overflow-y-auto">
          <h4 className="text-[11px] font-bold font-mono text-slate-500 uppercase">
            Step Execution Flow
          </h4>

          {runHistory.stepLogs.map((step, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedLog(step)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition space-y-1 ${
                selectedLog === step
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {step.nodeTitle}
                </span>

                <span className={`text-[10px] font-mono font-bold ${
                  step.status === 'SUCCESS' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {step.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{step.executionTimeMs}ms</span>
                <span className="uppercase">{step.nodeType}</span>
              </div>
            </div>
          ))}
        </div>

        {/* STEP INSPECTOR */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs font-mono">
          {selectedLog ? (
            <>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedLog.nodeTitle}
                </h4>
                <p className="text-[10px] text-slate-500">
                  Execution Time: {selectedLog.executionTimeMs} ms
                </p>
              </div>

              {/* Input Data */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Input Payload:</span>
                <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl text-[10px] overflow-x-auto">
                  <pre>{JSON.stringify(selectedLog.inputData, null, 2)}</pre>
                </div>
              </div>

              {/* Output Data */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Output Result:</span>
                <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl text-[10px] overflow-x-auto">
                  <pre>{JSON.stringify(selectedLog.outputData, null, 2)}</pre>
                </div>
              </div>

              {/* Error Trace if failed */}
              {selectedLog.error && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl text-[11px] space-y-1">
                  <span className="font-bold uppercase block">Error Trace:</span>
                  <p>{selectedLog.error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-400 text-center py-10">Select a step on the left to inspect logs.</div>
          )}
        </div>
      </div>
    </div>
  );
}
