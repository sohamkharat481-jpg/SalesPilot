import React, { useState } from 'react';
import { AlertCircle, CreditCard, ShieldAlert, ArrowRight, Mail, LogOut, CheckCircle2, Clock } from 'lucide-react';
import { WorkspaceUser } from '../../types';

interface ExpiredSubscriptionScreenProps {
  user: WorkspaceUser | null;
  subscription?: any;
  pendingPayment?: any;
  onRenew: () => void;
  onLogout?: () => void;
}

export const ExpiredSubscriptionScreen: React.FC<ExpiredSubscriptionScreenProps> = ({
  user,
  subscription,
  pendingPayment,
  onRenew,
  onLogout
}) => {
  const [supportSent, setSupportSent] = useState(false);
  const planName = subscription?.plan || user?.tier || 'STARTER';
  const expiryDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })
    : 'Expired';

  const hasPendingPayment = Boolean(pendingPayment && pendingPayment.paymentStatus === 'PENDING_VERIFICATION');

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-rose-200 dark:border-rose-900/40 p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock / Expiry Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Subscription Status: EXPIRED
        </div>

        {/* Required Headline and Subtext */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Your SalesPilot subscription has expired.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
          Renew your subscription to continue using SalesPilot.
        </p>

        {/* Plan & Expiry Details Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 mb-6 text-left">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-400 font-semibold block">
                Workspace Plan
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {planName} Plan
              </span>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-400 font-semibold block">
                Access State
              </span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                Locked (Expired {expiryDate !== 'Expired' ? `on ${expiryDate}` : ''})
              </span>
            </div>
          </div>
        </div>

        {/* Pending Verification Notice (if UTR submitted) */}
        {hasPendingPayment && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-4 text-left mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-0.5">Renewal Payment Pending Verification</span>
              Your submitted transaction (UTR: <span className="font-mono font-semibold">{pendingPayment.utr}</span>) is being reviewed by an administrator. Once verified, full SalesPilot access will be restored automatically.
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={onRenew}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 cursor-pointer mb-6"
        >
          <CreditCard className="w-5 h-5" />
          Renew Subscription
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>

        {/* Help & Support / Logout footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Need assistance?{' '}
            <button
              onClick={() => {
                setSupportSent(true);
                window.location.href = 'mailto:support@salespilot.co?subject=SalesPilot%20Subscription%20Renewal%20Assistance';
              }}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              {supportSent ? 'Opening email client...' : 'Contact Support'}
            </button>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
