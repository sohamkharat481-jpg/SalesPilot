import React, { useState, useEffect } from 'react';
import { Server, Cpu, Database, Activity, RefreshCw, Zap, ShieldAlert, Layers, Play, CheckCircle, Clock, BarChart3, AlertCircle } from 'lucide-react';
import { globalCache, globalJobQueue, globalCircuitBreaker, JobTask } from '../lib/hyperscale-cache-queue';

export function HyperscaleInfraView() {
  const [cacheStats, setCacheStats] = useState(globalCache.getStats());
  const [jobs, setJobs] = useState<JobTask[]>([]);
  const [circuitState, setCircuitState] = useState(globalCircuitBreaker.getState());
  const [taskName, setTaskName] = useState('EMAIL_SEQUENCE_DISPATCH');

  useEffect(() => {
    const unsubscribe = globalJobQueue.subscribe((updatedJobs) => {
      setJobs(updatedJobs);
      setCacheStats(globalCache.getStats());
      setCircuitState(globalCircuitBreaker.getState());
    });
    return unsubscribe;
  }, []);

  const handleDispatchJob = () => {
    globalJobQueue.enqueueJob(taskName, { timestamp: new Date().toISOString(), source: 'HYPERSCALE_DASHBOARD' });
  };

  const handleClearCache = () => {
    globalCache.clear();
    setCacheStats(globalCache.getStats());
  };

  const handleResetCircuit = () => {
    globalCircuitBreaker.reset();
    setCircuitState(globalCircuitBreaker.getState());
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Server className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Hyperscale Infrastructure & Workers
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
                Distributed Grid Active
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time cluster monitoring for Redis-compatible cache, background job queues, circuit breakers, and edge workers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDispatchJob}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            Enqueue Background Worker
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Distributed Cache</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {cacheStats.activeKeys} <span className="text-xs text-slate-400 font-normal">/ {cacheStats.maxEntries} keys</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>Cache Hits: {cacheStats.totalHits}</span>
            <button onClick={handleClearCache} className="text-blue-600 dark:text-blue-400 hover:underline">Flush</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Active Worker Pool</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            4 Workers <span className="text-xs text-emerald-500 font-normal">● 100% Healthy</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            Concurrency limit: 4 threads
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Circuit Breaker</span>
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            {circuitState.state}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>Failures: {circuitState.failureCount}/{circuitState.threshold}</span>
            <button onClick={handleResetCircuit} className="text-blue-600 dark:text-blue-400 hover:underline">Reset</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Global CDN & Compression</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            Brotli / Gzip <span className="text-xs text-emerald-500 font-normal">Active</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            Average edge latency: 14ms
          </div>
        </div>
      </div>

      {/* Background Job Queue Monitor */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            Distributed Job Worker Stream
          </h2>

          <div className="flex items-center gap-3">
            <select
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
            >
              <option value="EMAIL_SEQUENCE_DISPATCH">Email Sequence Dispatch</option>
              <option value="AI_LEAD_ENRICHMENT_SYNC">AI Lead Enrichment Sync</option>
              <option value="WEBHOOK_OUTBOUND_RETRY">Outbound Webhook Retry</option>
              <option value="VECTOR_EMBEDDING_REINDEX">Vector Embedding Reindex</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Task Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Attempts</th>
                <th className="p-3">Created</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="p-3 font-mono text-slate-800 dark:text-slate-200 font-semibold">{job.id}</td>
                  <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{job.type}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      job.status === 'RUNNING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse' :
                      job.status === 'QUEUED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}>
                      {job.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                      {job.status === 'RUNNING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{job.attempts} / {job.maxAttempts}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{new Date(job.createdAt).toLocaleTimeString()}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {job.result ? JSON.stringify(job.result) : job.error || 'Processing in worker thread...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
