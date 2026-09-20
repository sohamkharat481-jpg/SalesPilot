import React from 'react';
import { 
  Activity, CheckCircle2, AlertCircle, Clock, Loader2, 
  RefreshCw, Layers, Sparkles, ExternalLink, ArrowRight,
  Check, XCircle, ShieldCheck
} from 'lucide-react';
import { LeadGenJob, LeadGenJobStatus } from '../../types';

interface LeadGenJobsManagerProps {
  activeJob: LeadGenJob | null;
  setActiveJob: React.Dispatch<React.SetStateAction<LeadGenJob | null>>;
  recentJobs: LeadGenJob[];
  isLoadingJobs: boolean;
  onRefreshJobs: () => Promise<void>;
  onViewDatabaseTab: () => void;
  onRetryJob?: (job: LeadGenJob) => Promise<void>;
}

export function LeadGenJobsManager({
  activeJob,
  setActiveJob,
  recentJobs,
  isLoadingJobs,
  onRefreshJobs,
  onViewDatabaseTab,
  onRetryJob
}: LeadGenJobsManagerProps) {

  const getStatusBadge = (status: LeadGenJobStatus) => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 animate-spin" /> QUEUED IN PIPELINE
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Loader2 className="w-3 h-3 animate-spin" /> RUNNING WORKER
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> FAILED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
            <XCircle className="w-3 h-3" /> CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const isTerminal = (status: LeadGenJobStatus) => 
    status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. ACTIVE / HIGHLIGHTED JOB MONITOR */}
      {activeJob && (
        <div 
          id="active_lead_gen_job_card"
          className={`border rounded-2xl p-5 sm:p-6 transition-all shadow-sm ${
            activeJob.status === 'RUNNING'
              ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/60'
              : activeJob.status === 'QUEUED'
              ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/60'
              : activeJob.status === 'COMPLETED'
              ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
              : activeJob.status === 'FAILED'
              ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/60'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Async Lead Generation Job
                </span>
                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {activeJob.jobId}
                </span>
                {getStatusBadge(activeJob.status)}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {activeJob.criteria?.campaignName || activeJob.criteria?.industry || 'Target Sourcing Run'}
                {activeJob.criteria?.city && (
                  <span className="text-xs font-normal text-slate-500">
                    in {activeJob.criteria.city}, {activeJob.criteria.country || 'Global'}
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {!isTerminal(activeJob.status) && (
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-semibold">
                  <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Telemetry Active
                </span>
              )}
              {activeJob.status === 'COMPLETED' && (
                <button
                  type="button"
                  id="view_completed_leads_button"
                  onClick={onViewDatabaseTab}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> View Sourced Leads
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                {activeJob.status === 'QUEUED' && 'Worker awaiting thread assignment...'}
                {activeJob.status === 'RUNNING' && 'Autonomous worker actively querying, scoring & persisting prospects...'}
                {activeJob.status === 'COMPLETED' && 'All target prospects processed and stored to tenant database.'}
                {activeJob.status === 'FAILED' && 'Job terminated with error. See failure details below.'}
                {activeJob.status === 'CANCELLED' && 'Job was cancelled.'}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {Math.round(activeJob.progress || 0)}%
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeJob.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : activeJob.status === 'FAILED'
                    ? 'bg-rose-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(activeJob.progress || 0, activeJob.status === 'RUNNING' ? 5 : 0))}%` }}
              />
            </div>
          </div>

          {/* Real-time Counters Grid (Processed / Created / Skipped / Target) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-mono uppercase text-slate-400 tracking-wider">Target Total</span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
                {activeJob.total || 0}
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-mono uppercase text-slate-400 tracking-wider">Processed</span>
              <div className="text-base sm:text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                {activeJob.processed || 0}
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-950/60 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-mono uppercase text-emerald-600 dark:text-emerald-400 tracking-wider font-semibold">
                Created (Saved)
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {activeJob.created || 0}
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-mono uppercase text-slate-400 tracking-wider">Skipped / Filtered</span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-600 dark:text-slate-400">
                {activeJob.skipped || 0}
              </div>
            </div>
          </div>

          {/* Failure Error Message Callout */}
          {activeJob.status === 'FAILED' && activeJob.errorMessage && (
            <div 
              id="job_error_message_alert"
              className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs space-y-1 animate-slide-down"
            >
              <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" /> Execution Error Diagnostic
              </div>
              <p className="font-mono text-[11px] text-rose-600 dark:text-rose-300 leading-relaxed break-words">
                {activeJob.errorMessage}
              </p>
              {onRetryJob && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onRetryJob(activeJob)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition cursor-pointer"
                  >
                    Retry Job
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timestamps and Meta footer */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span>Started: {new Date(activeJob.createdAt).toLocaleTimeString()}</span>
            <span>Last Updated: {new Date(activeJob.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* 2. RECENT TENANT ASYNC JOBS LOGS & HISTORY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" /> Recent Asynchronous Generation Jobs
            </h3>
            <p className="text-[11px] text-slate-500">
              Audit log of all background lead generation worker jobs strictly scoped to your tenant organization.
            </p>
          </div>

          <button
            type="button"
            id="refresh_jobs_list_button"
            onClick={onRefreshJobs}
            disabled={isLoadingJobs}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingJobs ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {recentJobs.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
            <Clock className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No async lead generation jobs recorded yet.</p>
            <p className="text-[11px] text-slate-400">Launch a campaign above to dispatch an autonomous background worker.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Criteria / Target</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3">Updated</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {recentJobs.map((job) => {
                  const isSelected = activeJob?.jobId === job.jobId;
                  return (
                    <tr 
                      key={job.jobId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-850/50 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/30 dark:bg-blue-950/20 font-semibold' : ''
                      }`}
                      onClick={() => setActiveJob(job)}
                    >
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-mono">
                        {job.jobId}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-sans">
                        <span className="font-semibold">{job.criteria?.industry || job.criteria?.campaignName || 'Sourcing Run'}</span>
                        {job.criteria?.city && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {job.criteria.city}, {job.criteria.country}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                job.status === 'COMPLETED' ? 'bg-emerald-500' : job.status === 'FAILED' ? 'bg-rose-500' : 'bg-blue-500'
                              }`} 
                              style={{ width: `${job.progress}%` }} 
                            />
                          </div>
                          <span>{job.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                        {job.created} / {job.total}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[10px]">
                        {new Date(job.updatedAt || job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveJob(job);
                          }}
                          className="px-2.5 py-1 text-[10px] font-sans font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
