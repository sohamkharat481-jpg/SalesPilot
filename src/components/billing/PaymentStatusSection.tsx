import React, { useState } from 'react';
import { QrCode, Check, ShieldCheck, Clock, AlertCircle, Copy, CheckCircle2, IndianRupee } from 'lucide-react';
import { WorkspaceUser } from '../../types';

export interface AuditLog {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  type: 'success' | 'info' | 'warn';
}

interface PaymentStatusSectionProps {
  user?: WorkspaceUser | null;
  auditLogs: AuditLog[];
  onLogMessage: (text: string, type: 'info' | 'success' | 'warn') => void;
  upiId?: string;
  businessName?: string;
}

export function PaymentStatusSection({
  user,
  auditLogs,
  onLogMessage,
  upiId = 'sohamkharat85@oksbi',
  businessName = 'SalesPilot CRM Technologies'
}: PaymentStatusSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    onLogMessage(`Copied UPI ID: ${upiId}`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="payment_status_section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Visual UPI Payment Profile */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col justify-between space-y-6">
        <div>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Payment Method</h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded flex items-center gap-1">
              <Check className="w-3 h-3" /> Direct UPI Scan & Pay
            </span>
          </div>
          
          {/* UPI Badge Graphic */}
          <div className="mt-5 p-5 bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 rounded-xl relative overflow-hidden text-white shadow-md select-none border border-slate-800">
            <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-emerald-500/10 rounded-l-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-300 block">DIRECT UPI GATEWAY</span>
                  <span className="text-xs text-slate-300">{businessName}</span>
                </div>
              </div>
              <span className="font-mono font-bold text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                0% Gateway Fee
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg border border-slate-700/60">
              <div>
                <span className="block text-[8px] text-slate-400 font-mono uppercase tracking-widest">Active UPI ID</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{upiId}</span>
              </div>
              <button
                onClick={handleCopyUpi}
                className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1"
                title="Copy UPI ID"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400">
              <span>Supported: GPay, PhonePe, Paytm, BHIM, Cred</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> NPCI Verified
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <span>Settlement Destination:</span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">Direct Verified Bank Account</span>
        </div>
      </div>

      {/* Transaction & Verification Audit Logs */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-500" /> Payment & Verification Audit Trail
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Real-time audit log of payment submissions, UTR checks, and subscription lifecycle state changes.
          </p>
        </div>

        {/* Audit Log timeline list */}
        <div className="flex-grow space-y-3 overflow-y-auto max-h-[180px] pr-2 scrollbar-thin">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex gap-2.5 text-xs">
              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 w-16 shrink-0 pt-0.5">{log.timestamp}</span>
              <div className="space-y-0.5">
                <span className={`font-semibold flex items-center gap-1 ${
                  log.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : log.type === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {log.event}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{log.details}</p>
              </div>
            </div>
          ))}
        </div>

        <span className="block text-[9.5px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800 pt-3">
          Verification Pipeline: <strong className="text-emerald-600 dark:text-emerald-400">● SECURE / HUMAN VERIFIED</strong>
        </span>
      </div>
    </div>
  );
}
