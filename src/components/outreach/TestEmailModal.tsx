import React, { useState, useEffect } from 'react';
import { Mail, Send, AlertTriangle, CheckCircle, X, ShieldCheck, RefreshCw } from 'lucide-react';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export function TestEmailModal({ isOpen, onClose, onSuccess }: TestEmailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('SalesPilot Outreach Engine Connection Test');
  const [body, setBody] = useState(
    'Hi,\n\nThis is a controlled test outreach message sent from SalesPilot Outreach Engine.\n\nBest,\nSalesPilot Team'
  );
  const [senderAccount, setSenderAccount] = useState<string>('sohamkharat481@gmail.com');
  const [step, setStep] = useState<'compose' | 'confirm'>('compose');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    // Reset state when opened
    if (isOpen) {
      setStep('compose');
      setError(null);
      setSuccessResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject line is required.');
      return;
    }
    if (!body.trim()) {
      setError('Email message body is required.');
      return;
    }
    setStep('confirm');
  };

  const handleSendTestEmail = async () => {
    if (sending) return;
    setSending(true);
    setError(null);

    try {
      const token = localStorage.getItem('salespilot_token') || localStorage.getItem('salespilot_session_token');
      const workspaceId = localStorage.getItem('salespilot_workspace_id') || localStorage.getItem('salespilot_org_id') || (() => {
        try {
          const org = JSON.parse(localStorage.getItem('salespilot_org') || '{}');
          return org.id;
        } catch {
          return null;
        }
      })();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (workspaceId) {
        headers['x-organization-id'] = workspaceId;
      }

      const res = await fetch('/api/v1/outreach/test-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          subject: subject.trim(),
          body: body.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send test email.');
      }

      setSuccessResult(data);
      if (onSuccess) onSuccess(data);
    } catch (err: any) {
      console.error('[TEST EMAIL ERROR]', err);
      setError(err.message || 'Failed to send test email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Controlled Test Outreach
              </h3>
              <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                TEST EMAIL — does not belong to a CRM lead
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Warning */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Safety Isolation Guaranteed</p>
            <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-0.5 leading-relaxed">
              This test email sends a single message directly via OAuth Gmail. It does <strong>NOT</strong> create CRM leads, does <strong>NOT</strong> modify lead status, and will <strong>NOT</strong> create follow-up sequence items.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Success View */}
        {successResult ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Test Email Sent Successfully
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dispatched to <strong className="text-slate-800 dark:text-slate-200">{successResult.recipientEmail}</strong> via <span className="font-mono">{successResult.senderEmail}</span>.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-left font-mono text-[11px] space-y-1 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              <div><span className="text-slate-400">Provider Message ID:</span> {successResult.providerMessageId}</div>
              <div><span className="text-slate-400">Thread ID:</span> {successResult.threadId}</div>
              <div><span className="text-slate-400">Timestamp:</span> {successResult.timestamp}</div>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : step === 'compose' ? (
          /* Step 1: Composition Form */
          <form onSubmit={handleProceedToConfirm} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Test Recipient Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="Enter your secondary test email (e.g. test@example.com)"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must be an email address you own/control for test receipt.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message Body
              </label>
              <textarea
                rows={4}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Review Confirmation <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirmation Dialog */
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Sender Account:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{senderAccount}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Test Recipient:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{recipientEmail}</span>
              </div>
              <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium block mb-0.5">Subject:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{subject}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Message Preview:</span>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                  {body}
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                TEST EMAIL — does not belong to a CRM lead
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => setStep('compose')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleSendTestEmail}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending Single Test Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Confirm & Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
