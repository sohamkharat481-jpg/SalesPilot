import React, { useState } from 'react';
import { 
  BadgeCheck, Clock, Calendar, ShieldCheck, AlertCircle, 
  Trash2, Play, RefreshCw, CreditCard, ChevronRight, Check, Hourglass, Bell, BellOff, Sparkles, CheckCircle2
} from 'lucide-react';
import { WorkspaceUser, SubscriptionTier } from '../../types';

interface SubscriptionsSectionProps {
  user: WorkspaceUser | null;
  subscriptionStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  setSubscriptionStatus: (status: 'ACTIVE' | 'PAUSED' | 'CANCELLED') => void;
  autoRenew: boolean;
  setAutoRenew: (val: boolean) => void;
  nextBillingDate: string;
  cycle: 'monthly' | 'annual';
  upcomingPrice: number;
  onLogMessage: (text: string, type: 'info' | 'success' | 'warn') => void;
}

export function SubscriptionsSection({
  user,
  subscriptionStatus,
  setSubscriptionStatus,
  autoRenew,
  setAutoRenew,
  nextBillingDate,
  cycle,
  upcomingPrice,
  onLogMessage
}: SubscriptionsSectionProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseDuration, setPauseDuration] = useState('1');

  const getStatusColor = () => {
    switch (subscriptionStatus) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'PAUSED': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const handleToggleAutoRenew = () => {
    const newVal = !autoRenew;
    setAutoRenew(newVal);
    onLogMessage(
      `Auto-renew was ${newVal ? 'ENABLED' : 'DISABLED'} for upcoming billing invoice.`,
      newVal ? 'success' : 'warn'
    );
  };

  const handleConfirmCancel = () => {
    setSubscriptionStatus('CANCELLED');
    setShowCancelModal(false);
    onLogMessage(`Subscription cancelled. Services will terminate on ${nextBillingDate}.`, 'warn');
  };

  const handleConfirmPause = () => {
    setSubscriptionStatus('PAUSED');
    setShowPauseModal(false);
    onLogMessage(`Subscription paused for ${pauseDuration} billing cycle(s). Resumes automatically thereafter.`, 'info');
  };

  const handleResumeSubscription = () => {
    setSubscriptionStatus('ACTIVE');
    onLogMessage(`Subscription reactivated successfully. Regular billing cycles resumed.`, 'success');
  };

  return (
    <div id="subscriptions_section" className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Active Subscription Details */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Active Subscription</h3>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {user?.tier === 'STARTER' 
                  ? 'Starter Pilot' 
                  : user?.tier === 'GROWTH' 
                  ? 'Growth Professional' 
                  : user?.tier === 'PROFESSIONAL' 
                  ? 'Scale Professional' 
                  : 'Enterprise Agency'}
              </h4>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor()}`}>
              {subscriptionStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Next Invoice Date
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-250 mt-1">
                {nextBillingDate}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500 uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Recurring Frequency
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-250 mt-1 capitalize">
                {`${cycle} billing`}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500 uppercase">Upcoming Renewal Price</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              ₹{upcomingPrice.toLocaleString('en-IN')} INR <span className="text-[10px] text-slate-500 font-mono">(Includes GST & applied credits)</span>
            </p>
          </div>

          {/* Subscription Control actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {subscriptionStatus === 'ACTIVE' ? (
              <>
                <button
                  id="btn_pause_subscription"
                  onClick={() => setShowPauseModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-750 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Pause Plan
                </button>
                <button
                  id="btn_cancel_subscription"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Cancel Plan
                </button>
              </>
            ) : (
              <button
                id="btn_resume_subscription"
                onClick={handleResumeSubscription}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Resume Subscription
              </button>
            )}
          </div>
        </div>

        {/* Auto-renew switch & security assurances */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">Automated Renewals</h3>
                <p className="text-[11px] text-slate-500 mt-1">Keep your automated sequence flows active with automated auto-debit renewals.</p>
              </div>
              
              <button
                id="auto_renew_switch"
                type="button"
                onClick={handleToggleAutoRenew}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                  autoRenew ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    autoRenew ? 'transform translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg flex gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-semibold text-slate-800 dark:text-slate-300 block">INR Compliance Guarantee</span>
                <p className="leading-relaxed">Renewals comply with RBI mandated e-mandate directives for Cashfree subscriptions. You will receive notification mailers 24 hours prior to each debit charge.</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 border-t border-slate-100 dark:border-slate-850 pt-3">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Need custom corporate invoicing layouts? Email billing@salespilot.ai</span>
          </div>
        </div>

      </div>

      {/* Cancel Modal Sim */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertCircle className="w-5 h-5 text-red-500" /> Cancel Outbound Subscription?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure? Sourced leads database, custom active campaigns, and Vinci copywriters will be frozen at the end of the current billing cycle (<strong className="text-slate-900 dark:text-slate-300">{nextBillingDate}</strong>).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                No, Keep Outbound Active
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Yes, Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal Sim */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-amber-500 animate-pulse" /> Pause Active Subscriptions
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Temporarily freeze outbound campaigns without losing configured sequences, sender credentials, or lead score indices.
            </p>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-slate-450 dark:text-slate-500 uppercase">Pause Period</label>
              <select
                value={pauseDuration}
                onChange={(e) => setPauseDuration(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
              >
                <option value="1">1 Billing Month (Resumes next billing)</option>
                <option value="2">2 Billing Months</option>
                <option value="3">3 Billing Months (Maximum)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPauseModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                Keep Active
              </button>
              <button
                onClick={handleConfirmPause}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
              >
                Confirm Pause Plan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
