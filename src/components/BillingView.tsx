import React, { useState, useMemo, useEffect } from 'react';
import { 
  CreditCard, Loader2, IndianRupee, Sparkles, Server, Check, HelpCircle, ArrowUpRight, Sliders, User,
  QrCode, Copy, CheckCircle2, Clock, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, X
} from 'lucide-react';
import { WorkspaceUser, SubscriptionTier } from '../types';
import { PlansSection } from './billing/PlansSection';
import { SubscriptionsSection } from './billing/SubscriptionsSection';
import { UsageSection } from './billing/UsageSection';
import { GstComplianceSection } from './billing/GstComplianceSection';
import { CouponsSection, AVAILABLE_COUPONS } from './billing/CouponsSection';
import { InvoicesSection, Invoice } from './billing/InvoicesSection';
import { PaymentStatusSection, AuditLog } from './billing/PaymentStatusSection';
import { UpiPaymentArchitectureSection } from './billing/UpiPaymentArchitectureSection';
import { ReferralsSection } from './billing/ReferralsSection';
import { AdminBillingConsole } from './billing/AdminBillingConsole';
import { CANONICAL_PLANS, calculateCanonicalPayablePrice, CanonicalPlanId } from '../payments/pricingConfig';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';

interface BillingViewProps {
  user: WorkspaceUser | null;
  onUpdateTier: (newTier: SubscriptionTier) => void;
}

interface CheckoutContext {
  plan: CanonicalPlanId;
  billingCycle: 'monthly' | 'annual';
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  upiId: string;
  businessName: string;
  qrImage: string;
  upiIntentUri: string;
  note: string;
}

export function BillingView({ user, onUpdateTier }: BillingViewProps) {
  // Shared States
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [gstin, setGstin] = useState('27AAPCS1429M1Z5');
  const [gstState, setGstState] = useState('Maharashtra');
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'ACTIVE' | 'PENDING_VERIFICATION' | 'EXPIRED' | 'CANCELLED'>('ACTIVE');
  const [autoRenew, setAutoRenew] = useState(true);

  // Authoritative server data
  const [serverSubscription, setServerSubscription] = useState<any | null>(null);
  const [pendingPayment, setPendingPayment] = useState<any | null>(null);
  const [latestPayment, setLatestPayment] = useState<any | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Checkout modal states
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [checkoutContext, setCheckoutContext] = useState<CheckoutContext | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // UTR submission inputs
  const [inputUtr, setInputUtr] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Invoices list (Authoritative from server)
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Audit Logs list
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: '1', timestamp: '10:14 AM', event: 'Direct UPI Module', details: 'Initialized verified NPCI payment route', type: 'success' },
    { id: '2', timestamp: '09:00 AM', event: 'Authoritative Sync', details: 'Connected to PostgreSQL database source of truth', type: 'info' }
  ]);

  // Helper to add audit logs dynamically
  const handleLogMessage = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const parts = text.split(':');
    const title = parts[0] || 'Event';
    const body = parts.slice(1).join(':').trim() || text;

    const newLog: AuditLog = {
      id: Math.random().toString(),
      timestamp: timeStr,
      event: title,
      details: body,
      type
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper to attach authenticated session headers to server requests
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('salespilot_token') || 
                  localStorage.getItem('sb_session_token') || 
                  localStorage.getItem('sb_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (user?.id) {
      headers['x-user-id'] = user.id;
    }
    if (user?.organizationId) {
      headers['x-organization-id'] = user.organizationId;
    }
    return headers;
  };

  // Fetch Authoritative Subscription and Invoices from Server
  const fetchAuthoritativeBilling = async () => {
    setLoadingSubscription(true);
    try {
      const headers = getAuthHeaders();
      // 1. Subscription & usage
      const subRes = await fetch('/api/v1/billing/subscription', { headers });
      const subData = await subRes.json();
      if (subData.success) {
        setServerSubscription(subData.subscription);
        setPendingPayment(subData.pendingPayment);
        setLatestPayment(subData.latestPayment);
        setSubscriptionStatus(subData.status);
      }

      // 2. Invoices
      const invRes = await fetch('/api/v1/billing/invoices', { headers });
      const invData = await invRes.json();
      if (invData.success && Array.isArray(invData.invoices)) {
        setInvoices(invData.invoices.map((i: any) => ({
          id: i.id,
          invoiceNumber: i.invoice_number || `SP-INV-${i.id.slice(-4)}`,
          date: new Date(i.issued_at || i.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          baseAmount: Number(i.base_amount || i.total_amount * 0.82),
          discount: 0,
          gstAmount: Number(i.gst_amount || i.total_amount * 0.18),
          totalInr: Number(i.total_amount),
          couponUsed: null,
          state: gstState,
          gstin: gstin,
          paymentMethod: `UPI (UTR: ${i.utr || 'Direct'})`,
          paymentReference: i.utr ? `UTR: ${i.utr}` : 'VERIFIED',
          cashfreeRef: `UPI_${i.utr || 'VERIFIED'}`,
          status: 'PAID'
        })));
      }
    } catch (err) {
      console.error('Failed to load authoritative billing info', err);
    } finally {
      setLoadingSubscription(false);
    }
  };

  useEffect(() => {
    fetchAuthoritativeBilling();
  }, [user?.tier]);

  // Pricing calculations for currently selected checkouts
  const getSelectedPlanBasePrice = (planId: SubscriptionTier) => {
    const prices = {
      FREE_TRIAL: { monthly: 0, annual: 0 },
      STARTER: { monthly: 2499, annual: 24990 },
      GROWTH: { monthly: 5999, annual: 59990 },
      BUSINESS: { monthly: 11999, annual: 119990 },
      PROFESSIONAL: { monthly: 11999, annual: 119990 },
      ENTERPRISE: { monthly: 29999, annual: 249990 },
      AGENCY: { monthly: 29999, annual: 249990 }
    };
    const tierPrice = prices[planId] || prices.STARTER;
    return billingCycle === 'annual' ? tierPrice.annual : tierPrice.monthly;
  };

  const getPriceBreakdown = (basePrice: number) => {
    let discountAmount = 0;
    let waveGst = false;

    if (activeCoupon) {
      const matched = AVAILABLE_COUPONS.find(c => c.code === activeCoupon);
      if (matched) {
        waveGst = matched.waveGst || false;
        if (matched.type === 'PERCENT' || matched.type === 'REFERRAL') {
          discountAmount = Math.round(basePrice * (matched.value / 100));
        } else if (matched.type === 'FLAT') {
          discountAmount = Math.min(basePrice, matched.value);
        }
      }
    }

    const subtotal = Math.max(0, basePrice - discountAmount);
    const gstRate = waveGst ? 0 : 0.18;
    const gstAmount = Math.round(subtotal * gstRate);
    const grandTotal = subtotal + gstAmount;

    return {
      discountAmount,
      subtotal,
      gstAmount,
      grandTotal,
      gstRate
    };
  };

  // Initiate Direct UPI Checkout
  const handleInitiateUpiCheckout = async (tier: SubscriptionTier) => {
    if (tier === 'FREE_TRIAL') {
      setLoadingPlanId(tier);
      try {
        onUpdateTier('FREE_TRIAL');
        handleLogMessage(`Free Trial Activated: 1-Day Premium access unlocked successfully`, "success");
        alert("Your 1-Day Free Trial has been activated successfully! You now have full premium feature access.");
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPlanId(null);
      }
      return;
    }

    setLoadingPlanId(tier);
    setCheckoutContext(null);
    setInputUtr('');
    setInputNotes('');
    setSubmissionSuccess(null);
    setSubmissionError(null);

    try {
      const response = await fetch('/api/v1/billing/checkout/initiate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ plan: tier, billingCycle })
      });
      const data = await response.json();
      
      if (data.success && data.checkout) {
        setCheckoutContext(data.checkout);
        setShowCheckoutModal(true);
        handleLogMessage(`UPI Checkout: Generated Scan & Pay order for ${tier} (₹${data.checkout.totalAmount})`, "info");
      } else {
        const errorMsg = data.error || 'Could not generate UPI checkout context';
        handleLogMessage(`API Error: ${errorMsg}`, "warn");
        alert(`Checkout Initiation Failed: ${errorMsg}`);
      }
    } catch (err: any) {
      console.error(err);
      handleLogMessage(`Network Error: ${err.message || String(err)}`, "warn");
      alert(`Network Error: ${err.message || 'Server endpoint not responding to checkout initiation'}`);
    } finally {
      setLoadingPlanId(null);
    }
  };

  // Submit UTR for Admin Verification
  const handleSubmitUpiPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutContext) return;

    const cleanUtr = inputUtr.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      setSubmissionError('Please enter a valid 12-digit UTR or Transaction Reference number.');
      return;
    }

    setSubmittingPayment(true);
    setSubmissionError(null);

    try {
      const response = await fetch('/api/v1/billing/payment/submit', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          plan: checkoutContext.plan,
          billingCycle: checkoutContext.billingCycle,
          utr: cleanUtr,
          notes: inputNotes
        })
      });
      const data = await response.json();

      if (data.success) {
        setSubmissionSuccess(data.payment);
        setPendingPayment(data.payment);
        setSubscriptionStatus('PENDING_VERIFICATION');
        handleLogMessage(`Payment Submitted: UTR ${cleanUtr} recorded for verification (₹${checkoutContext.totalAmount})`, "success");
      } else {
        setSubmissionError(data.error || 'Failed to submit payment verification.');
        handleLogMessage(`Payment Error: ${data.error}`, "warn");
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'Network error submitting payment.');
      handleLogMessage(`Payment Error: Could not connect to verification server`, "warn");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const copyUpiId = () => {
    if (checkoutContext?.upiId) {
      navigator.clipboard.writeText(checkoutContext.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Compute active plan renewal prices
  const activePlanPriceBreakdown = useMemo(() => {
    const currentTier = user?.tier || 'STARTER';
    const base = getSelectedPlanBasePrice(currentTier);
    return getPriceBreakdown(base);
  }, [user?.tier, billingCycle, activeCoupon]);

  const isFounderAccount = Boolean(
    user && isVerifiedFounderEmail(user.email)
  );

  return (
    <div id="billing_view" className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-sm font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-600" /> Direct UPI Subscriptions & Billing
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Zero gateway surcharge. Scan & Pay directly via Google Pay, PhonePe, Paytm, BHIM, or any UPI app with human admin verification.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('customer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'customer' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700/50' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-400'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Subscriber View
            </button>
            <button
              id="tab_admin_billing"
              onClick={() => setViewMode('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'admin' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700/50' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Admin Console
            </button>
          </div>

          <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-xs text-slate-600 dark:text-slate-350 font-mono shrink-0">
            Current Plan: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{user?.tier || 'STARTER'}</span>
          </div>
        </div>
      </div>

      {/* Pending Payment Notification Banner */}
      {pendingPayment && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Payment Pending Verification
              </h4>
              <p className="text-xs mt-0.5 text-slate-700 dark:text-slate-300">
                Your payment submission for <strong>{pendingPayment.plan} ({pendingPayment.billingCycle || pendingPayment.billing_cycle})</strong> with UTR <strong className="font-mono">{pendingPayment.utr}</strong> (₹{pendingPayment.amount}) has been received and is currently awaiting administrator review.
              </p>
            </div>
          </div>
          <button
            onClick={fetchAuthoritativeBilling}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingSubscription ? 'animate-spin' : ''}`} /> Refresh Status
          </button>
        </div>
      )}

      {viewMode === 'admin' ? (
        <AdminBillingConsole 
          onLogMessage={handleLogMessage} 
          invoices={invoices} 
          setInvoices={setInvoices} 
        />
      ) : (
        <>
          {/* Primary Plans Grid */}
          <PlansSection
            user={user}
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            onSelectPlan={handleInitiateUpiCheckout}
            loadingPlanId={loadingPlanId}
          />

          {/* Two-column Billing workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column Controls */}
            <div className="space-y-8">
              
              {/* Coupons apply */}
              <CouponsSection
                basePrice={getSelectedPlanBasePrice(user?.tier || 'STARTER')}
                activeCoupon={activeCoupon}
                setActiveCoupon={setActiveCoupon}
                gstRate={0.18}
                onLogMessage={handleLogMessage}
              />

              {/* GST compliance details */}
              <GstComplianceSection
                gstin={gstin}
                setGstin={setGstin}
                gstState={gstState}
                setGstState={setGstState}
                onLogMessage={handleLogMessage}
              />

              {/* Direct UPI Architecture Documentation */}
              <UpiPaymentArchitectureSection />

            </div>

            {/* Right Column Controls */}
            <div className="space-y-8">
              
              {/* Subscriptions & Action controls */}
              <SubscriptionsSection
                user={user}
                subscriptionStatus={subscriptionStatus}
                setSubscriptionStatus={setSubscriptionStatus}
                autoRenew={autoRenew}
                setAutoRenew={setAutoRenew}
                nextBillingDate="August 06, 2026"
                cycle={billingCycle}
                upcomingPrice={activePlanPriceBreakdown.grandTotal}
                onLogMessage={handleLogMessage}
              />

              {/* Active quota meters */}
              <UsageSection user={user} />

              {/* Direct UPI Payment Source Profile */}
              <PaymentStatusSection
                user={user}
                auditLogs={auditLogs}
                onLogMessage={handleLogMessage}
              />

              {/* Invoices history */}
              <InvoicesSection
                user={user}
                gstState={gstState}
                gstin={gstin}
                invoices={invoices}
                onLogMessage={handleLogMessage}
              />

            </div>

          </div>

          {/* Referrals section spanning across bottom */}
          <div className="pt-4">
            <ReferralsSection 
              userEmail={user?.email} 
              onLogMessage={handleLogMessage} 
            />
          </div>
        </>
      )}

      {/* Direct UPI Scan & Pay Checkout Modal */}
      {showCheckoutModal && checkoutContext && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Direct UPI Scan & Pay</h3>
                  <p className="text-[11px] text-emerald-300 font-mono">Plan: {checkoutContext.plan} ({checkoutContext.billingCycle})</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setSubmissionSuccess(null);
                  setSubmissionError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {submissionSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Payment Submitted for Verification!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Your transaction reference <strong className="font-mono text-emerald-600 dark:text-emerald-400">{submissionSuccess.utr}</strong> for ₹{submissionSuccess.amount} has been saved. An administrator will verify the bank deposit and activate your subscription.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" /> Status: PENDING_VERIFICATION
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setSubmissionSuccess(null);
                        fetchAuthoritativeBilling();
                      }}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Amount Breakdown & UPI Info Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-center">
                      <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
                        {checkoutContext.qrImage ? (
                          <img 
                            src={checkoutContext.qrImage} 
                            alt="Scan & Pay UPI QR" 
                            className="w-48 h-48 object-contain rounded-lg"
                          />
                        ) : (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkoutContext.upiIntentUri)}`}
                            alt="Scan & Pay UPI QR"
                            className="w-48 h-48 object-contain"
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <QrCode className="w-3 h-3 text-emerald-500" /> Scan with any UPI app to pay
                      </span>
                      <a
                        href={checkoutContext.upiIntentUri}
                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 md:hidden"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Tap to Pay via UPI App
                      </a>
                    </div>

                    {/* Payable Summary & Bank Details */}
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Base Plan ({checkoutContext.billingCycle})</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">₹{checkoutContext.baseAmount.toLocaleString('en-IN')}.00</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>GST (18% standard)</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">₹{checkoutContext.gstAmount.toLocaleString('en-IN')}.00</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                          <span>Total Payable Amount</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">₹{checkoutContext.totalAmount.toLocaleString('en-IN')}.00 INR</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">Verified Business</span>
                          <span className="font-bold text-slate-900 dark:text-white">{checkoutContext.businessName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">UPI ID</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {checkoutContext.upiId}
                            </span>
                            <button
                              type="button"
                              onClick={copyUpiId}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                            >
                              {copiedUpi ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* UTR Form Submission */}
                  <form onSubmit={handleSubmitUpiPayment} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-500" /> Step 2: Submit Bank Reference / UTR
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        After completing the transfer in your UPI app, enter the 12-digit UTR (Unique Transaction Reference) below to submit for instant admin verification.
                      </p>
                    </div>

                    {submissionError && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{submissionError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase">
                          UTR / Transaction ID <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={inputUtr}
                          onChange={(e) => setInputUtr(e.target.value)}
                          placeholder="e.g. 429381920192"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase">
                          Payment Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={inputNotes}
                          onChange={(e) => setInputNotes(e.target.value)}
                          placeholder="e.g. Paid via Google Pay"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCheckoutModal(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingPayment || !inputUtr.trim()}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {submittingPayment ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" /> Submit Payment for Verification
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
