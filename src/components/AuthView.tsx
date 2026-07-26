import React from 'react';
import { useAuth } from '../authentication/AuthContext';
import { motion } from 'motion/react';
import { Sparkles, Shield, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export function AuthView() {
  const {
    loginWithGoogle,
    isLoading,
    authError,
    isSandbox
  } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans text-slate-100">
      
      {/* Background visual flair */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Supabase Auth Connection Badge */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-300 font-medium">
          {isSandbox ? 'Sandbox Auth Mode' : 'Supabase Auth Online'}
        </span>
      </div>

      <div className="w-full max-w-md z-10">
        
        {/* Main Branding Logo block */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_30px_rgba(37,99,235,0.35)] mb-4 border border-blue-400/20">
            SP
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">SalesPilot</h2>
          <p className="text-xs text-slate-400 font-mono mt-1.5">Autonomous B2B Outreach Engine</p>
        </div>

        {/* Global Error Alert Banner */}
        {authError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </motion.div>
        )}

        {/* SINGLE AUTHENTICATION CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl w-full"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-1.5">Sign In to Your Workspace</h3>
            <p className="text-xs text-slate-400">
              Access AI prospect enrichment, automated outreach campaigns, and deal analytics.
            </p>
          </div>

          {/* Single Google Sign-In Button */}
          <button
            type="button"
            onClick={() => loginWithGoogle()}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer group hover:scale-[1.01] active:scale-[0.99] min-h-[48px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                <span className="text-slate-700">Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29c-.81 1.62-1.29 3.44-1.29 5.42s.48 3.8 1.29 5.42l3.99-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Protected by Supabase Auth with Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct redirect to SalesPilot Command Dashboard</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Gemini AI Engine & Automated Workflows included</span>
            </div>
          </div>
        </motion.div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-600 mt-6 font-mono">
          SalesPilot Autonomous Platform &bull; Single Auth Provider Flow
        </p>
      </div>
    </div>
  );
}
