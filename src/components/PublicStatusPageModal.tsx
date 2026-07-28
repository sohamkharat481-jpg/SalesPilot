import React, { useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, RefreshCw, X, Server, Database, Globe, Zap, Cpu } from 'lucide-react';

interface PublicStatusPageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublicStatusPageModal({ isOpen, onClose }: PublicStatusPageModalProps) {
  if (!isOpen) return null;

  const services = [
    { name: 'Core REST API Gateway', status: 'OPERATIONAL', uptime: '99.99%', latency: '18ms' },
    { name: 'Gemini AI SDR & Copilot Engine', status: 'OPERATIONAL', uptime: '99.95%', latency: '240ms' },
    { name: 'Background Worker Queues', status: 'OPERATIONAL', uptime: '100.00%', latency: '8ms' },
    { name: 'Redis Cache & Vector Store', status: 'OPERATIONAL', uptime: '99.98%', latency: '2ms' },
    { name: 'Database Replication & Storage', status: 'OPERATIONAL', uptime: '100.00%', latency: '12ms' },
    { name: 'Outbound Webhook Delivery', status: 'OPERATIONAL', uptime: '99.92%', latency: '45ms' },
    { name: 'Mobile Push Notification Service', status: 'OPERATIONAL', uptime: '99.99%', latency: '30ms' },
    { name: 'White-Label DNS Gateway', status: 'OPERATIONAL', uptime: '100.00%', latency: '15ms' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                SalesPilot System Status Page
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  All Systems Normal
                </span>
              </h2>
              <p className="text-xs text-slate-500">Live operational status across global edge locations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Health Grid */}
        <div className="space-y-3">
          {services.map((s, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{s.name}</span>
              </div>

              <div className="flex items-center gap-4 text-slate-500">
                <span>Latency: <strong className="text-slate-700 dark:text-slate-300 font-mono">{s.latency}</strong></span>
                <span>Uptime: <strong className="text-slate-700 dark:text-slate-300 font-mono">{s.uptime}</strong></span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Incident History */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Past Incident Log (7 Days)
          </h3>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400">
            No active incidents reported in the past 7 days. System availability: 99.99%.
          </div>
        </div>
      </div>
    </div>
  );
}
