import React, { useState } from 'react';
import { Database, AlertTriangle, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getSupabaseDiagnostics, isSupabaseConfigured } from '../lib/supabase';

export function EnvDiagnosticBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const isDebug = Boolean(import.meta.env.VITE_DEBUG === 'true');
  const diagnostics = getSupabaseDiagnostics();

  // Hide banner unless VITE_DEBUG is explicitly enabled or when configured/dismissed
  if (!isDebug || diagnostics.isConfigured || dismissed) return null;

  return (
    <>
      <div id="env-diagnostic-banner" className="fixed bottom-4 left-4 z-50 max-w-md bg-slate-900/95 backdrop-blur text-white border border-amber-500/30 p-3 rounded-xl shadow-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <Database className="w-4 h-4" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-amber-200">Local Memory Sandbox Mode</p>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
              DB Fallback
            </span>
          </div>
          <p className="text-[11px] text-slate-300 truncate">
            {diagnostics.details}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowModal(true)}
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium rounded-lg transition"
          >
            Diagnostics
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Environment Diagnostics</h3>
                <p className="text-xs text-slate-400">SalesPilot Environment & Supabase Status</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-800/80 border border-slate-700/50 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-slate-300">Environment Diagnostics Details:</p>
                {diagnostics.missingVars.length > 0 && diagnostics.missingVars.map((v) => (
                  <div key={v} className="flex items-center gap-2 text-xs text-amber-300 font-mono bg-amber-950/30 px-2.5 py-1 rounded border border-amber-800/40">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Missing: {v}</span>
                  </div>
                ))}
                {diagnostics.detectedReason && (
                  <div className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-700/50 space-y-1 font-mono text-[11px]">
                    <p className="text-amber-300 font-semibold">Detected Reason:</p>
                    <p>{diagnostics.detectedReason}</p>
                    <p className="text-slate-400 mt-1">URL Length: {diagnostics.urlLength} | Key Length: {diagnostics.keyLength}</p>
                  </div>
                )}
                {diagnostics.initError && (
                  <div className="text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/40 font-mono text-[11px] space-y-1">
                    <p className="font-bold text-rose-400">Initialization Exception:</p>
                    <p>{diagnostics.initError}</p>
                    {diagnostics.initStackTrace && (
                      <pre className="text-[10px] text-rose-200/80 overflow-x-auto max-h-32 mt-1">
                        {diagnostics.initStackTrace}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-200 mb-1">How to configure:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>Set <span className="text-emerald-400">VITE_SUPABASE_URL</span> in your .env or platform secrets</li>
                  <li>Set <span className="text-emerald-400">VITE_SUPABASE_ANON_KEY</span> in your .env or platform secrets</li>
                  <li>Rebuild or restart your development server</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Graceful Fallback Active:</strong> SalesPilot is running with local in-memory persistence and sandbox authentication. No features are blocked.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
