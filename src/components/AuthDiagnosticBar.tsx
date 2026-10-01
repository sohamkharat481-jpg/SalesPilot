import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Database, Key, Layers, RefreshCw } from 'lucide-react';
import { WorkspaceUser } from '../types';

interface AuthDiagnosticsData {
  authenticatedSupabaseUserId: string | null;
  authenticatedEmail: string | null;
  serverUserId: string | null;
  serverEmail: string | null;
  serverOrgId: string | null;
  serverRole: string | null;
  profileRole: string | null;
  profileOrgId: string | null;
  teamMembersRole: string | null;
  teamMembersOrgId: string | null;
  sourceOfRole: string | null;
  sourceOfOrg: string | null;
  sessionUserId: string | null;
}

interface AuthDiagnosticBarProps {
  user: WorkspaceUser | null;
}

export const AuthDiagnosticBar: React.FC<AuthDiagnosticBarProps> = ({ user }) => {
  const [diagnostics, setDiagnostics] = useState<AuthDiagnosticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [roleLogs, setRoleTransitionLogs] = useState<any[]>([]);

  const isDebugRequested = typeof window !== 'undefined' && (
    window.location.search.includes('debug=1') ||
    window.location.hash.includes('debug=1') ||
    Boolean(user?.isFounder) ||
    import.meta.env.DEV
  );

  const fetchDiagnostics = async () => {
    const token = localStorage.getItem('salespilot_token');
    if (!token) {
      setDiagnostics(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/diagnostics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.diagnostics) {
          setDiagnostics(data.diagnostics);
        }
      }
    } catch (err) {
      console.warn('[DIAGNOSTICS FETCH NOTICE]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isDebugRequested) {
      fetchDiagnostics();
    }
  }, [user?.id, user?.role, isDebugRequested]);

  if (!isDebugRequested || !user) {
    return null;
  }

  return (
    <div id="auth_diagnostic_bar" className="bg-slate-950 text-slate-200 border-b border-indigo-500/30 px-4 py-2 font-mono text-[11px] shadow-md relative z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AUTH IDENTITY DIAGNOSTICS</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/40">POSTGRESQL AUTHORITATIVE</span>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-slate-300">
          <div>
            <span className="text-slate-500">SB User ID:</span>{' '}
            <strong className="text-indigo-300">{diagnostics?.authenticatedSupabaseUserId || user.id || 'N/A'}</strong>
          </div>

          <div>
            <span className="text-slate-500">Email:</span>{' '}
            <strong className="text-white">{diagnostics?.authenticatedEmail || user.email}</strong>
          </div>

          <div>
            <span className="text-slate-500">Server Role:</span>{' '}
            <strong className="text-emerald-400">{diagnostics?.serverRole || user.role}</strong>
          </div>

          <div>
            <span className="text-slate-500">PostgreSQL Profile Role:</span>{' '}
            <strong className="text-amber-400">{diagnostics?.profileRole || diagnostics?.teamMembersRole || 'N/A'}</strong>
          </div>

          <div>
            <span className="text-slate-500">Org ID:</span>{' '}
            <strong className="text-cyan-300">{diagnostics?.serverOrgId || user.organizationId || 'N/A'}</strong>
          </div>

          <div>
            <span className="text-slate-500">Source:</span>{' '}
            <strong className="text-indigo-400">{diagnostics?.sourceOfRole || 'Direct Database Query'}</strong>
          </div>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded border border-slate-700 flex items-center gap-1 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Diagnostics</span>
        </button>
      </div>
    </div>
  );
};
