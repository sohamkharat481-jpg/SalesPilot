import React, { useState, useMemo } from 'react';
import { 
  CreditCard, Loader2, IndianRupee, Sparkles, Server, Check, HelpCircle, ArrowUpRight, Sliders, User
} from 'lucide-react';
import { WorkspaceUser, SubscriptionTier } from '../types';
import { PlansSection } from './billing/PlansSection';
import { SubscriptionsSection } from './billing/SubscriptionsSection';
import { UsageSection } from './billing/UsageSection';
import { GstComplianceSection } from './billing/GstComplianceSection';
import { CouponsSection, AVAILABLE_COUPONS } from './billing/CouponsSection';
import { InvoicesSection, Invoice } from './billing/InvoicesSection';
import { PaymentStatusSection, AuditLog } from './billing/PaymentStatusSection';
import { CashfreeArchitectureSection } from './billing/CashfreeArchitectureSection';
import { ReferralsSection } from './billing/ReferralsSection';
import { AdminBillingConsole } from './billing/AdminBillingConsole';

interface BillingViewProps {
  user: WorkspaceUser | null;
  onUpdateTier: (newTier: SubscriptionTier) => void;
}

export function BillingView({ user, onUpdateTier }: BillingViewProps) {
  // Shared States
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [gstin, setGstin] = useState('27AAPCS1429M1Z5');
  const [gstState, setGstState] = useState('Maharashtra');
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'ACTIVE' | 'PAUSED' | 'CANCELLED'>('ACTIVE');
  const [autoRenew, setAutoRenew] = useState(true);

  // Card details
  const [cardDigits, setCardDigits] = useState('•••• •••• •••• 2309');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('***');

  // Checkout modal simulator states
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [cashfreeEnvelope, setCashfreeEnvelope] = useState<any>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Invoices list
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'cf_order_2319401',
      invoiceNumber: 'SP-2026-INV-1092',
      date: 'Jul 01, 2026',
      baseAmount: 9999,
      discount: 0,
      gstAmount: 1800,
      totalInr: 11799,
      couponUsed: null,
      state: 'Maharashtra',
      gstin: '27AAPCS1429M1Z5',
      paymentMethod: 'Visa Ending 2309',
      cashfreeRef: 'cf_tx_9012480124',
      status: 'PAID'
    },
    {
      id: 'cf_order_2104914',
      invoiceNumber: 'SP-2026-INV-0982',
      date: 'Jun 01, 2026',
      baseAmount: 4999,
      discount: 2500,
      gstAmount: 450,
      totalInr: 2949,
      couponUsed: 'PILOT50',
      state: 'Karnataka',
      gstin: '',
      paymentMethod: 'Visa Ending 2309',
      cashfreeRef: 'cf_tx_8124901231',
      status: 'PAID'
    }
  ]);

  // Transaction audit webhooks list
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: '1', timestamp: '10:14 AM', event: 'Order Captured', details: 'Client-side payment session finalized via Cashfree Checkout', type: 'success' },
    { id: '2', timestamp: '10:14 AM', event: 'Signature Verified', details: 'Crypto validation approved for server webhook', type: 'success' },
    { id: '3', timestamp: '09:00 AM', event: 'Daily Quota Reset', details: 'All automated sequence counters synchronized with active limits', type: 'info' }
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

  // Pricing calculations for currently selected checkouts
  const getSelectedPlanBasePrice = (planId: SubscriptionTier) => {
    const basePrices = { 
      STARTER: 4999, 
      GROWTH: 9999, 
      PROFESSIONAL: 19999, 
      ENTERPRISE: 49999, 
      AGENCY: 49999 
    };
    const price = basePrices[planId] || 4999;
    if (billingCycle === 'annual') {
      return Math.round(price * 12 * 0.8);
    }
    return price;
  };

  const getPriceBreakdown = (basePrice: number) => {
    let discountAmount = 0;
    let waveGst = false;

    if (activeCoupon) {
      const matched = AVAILABLE_COUPONS.find(c => c.code === activeCoupon);
      if (matched) {
        waveGst = matched.waveGst || false;
        if (matched.type === 'PERCENT' || matched.type === 'REFERRAL') {
          discountAmount = Math.round(basePrice * (matched.value / 100)); // using percentage discount formula
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

  // Initiate Cashfree checkout
  const handleInitiateCashfreeCheckout = async (tier: SubscriptionTier, price: number) => {
    setLoadingPlanId(tier);
    setCashfreeEnvelope(null);
    setPaymentVerified(false);

    try {
      const response = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, valueInr: price })
      });
      const data = await response.json();
      
      if (data.success) {
        setCashfreeEnvelope(data.cashfreeResponse);
        setShowCheckoutModal(true);
        handleLogMessage(`API Order: Created Cashfree checkout session ${data.order_id}`, "info");
      } else {
        handleLogMessage(`API Error: Could not generate order context from Cashfree backend service`, "warn");
      }
    } catch (err) {
      console.error(err);
      handleLogMessage(`Network Error: Server endpoint not responding to PG initialization`, "warn");
    } finally {
      setLoadingPlanId(null);
    }
  };

  // Verify payment link
  const handleVerifyCashfreePayment = async () => {
    if (!cashfreeEnvelope) return;
    setVerifyingPayment(true);

    try {
      const response = await fetch('/api/v1/payments/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: cashfreeEnvelope.order_id })
      });
      const data = await response.json();

      if (data.success) {
        // Compute finalized prices for dynamic tax invoice insertion
        let tier: SubscriptionTier = 'STARTER';
        if (cashfreeEnvelope.order_id.includes('GROWTH')) {
          tier = 'GROWTH';
        } else if (cashfreeEnvelope.order_id.includes('PROFESSIONAL')) {
          tier = 'PROFESSIONAL';
        } else if (cashfreeEnvelope.order_id.includes('ENTERPRISE') || cashfreeEnvelope.order_id.includes('AGENCY')) {
          tier = 'ENTERPRISE';
        }
        const basePrice = getSelectedPlanBasePrice(tier);
        const breakdown = getPriceBreakdown(basePrice);

        onUpdateTier(tier);
        setPaymentVerified(true);
        handleLogMessage(`Payment Webhook: ORDER_PAID payload validated for ${cashfreeEnvelope.order_id}`, "success");

        // Insert new invoice record
        const newInvoice: Invoice = {
          id: cashfreeEnvelope.order_id,
          invoiceNumber: `SP-2026-INV-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          baseAmount: basePrice,
          discount: breakdown.discountAmount,
          gstAmount: breakdown.gstAmount,
          totalInr: breakdown.grandTotal,
          couponUsed: activeCoupon,
          state: gstState,
          gstin: gstin,
          paymentMethod: `Visa Ending ${cardDigits.slice(-4)}`,
          cashfreeRef: `cf_tx_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          status: 'PAID'
        };

        setInvoices(prev => [newInvoice, ...prev]);

        setTimeout(() => {
          setShowCheckoutModal(false);
          setCashfreeEnvelope(null);
        }, 1500);
      } else {
        handleLogMessage(`Payment Error: Order verification failed on Cashfree API. Check card credentials.`, "warn");
      }
    } catch (err) {
      console.error(err);
      handleLogMessage(`Payment Error: Verification handler faulted during signature matching.`, "warn");
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Compute active plan renewal prices
  const activePlanPriceBreakdown = useMemo(() => {
    const currentTier = user?.tier || 'STARTER';
    const base = getSelectedPlanBasePrice(currentTier);
    return getPriceBreakdown(base);
  }, [user?.tier, billingCycle, activeCoupon]);

  if (user?.isFounder || user?.subscriptionStatus === 'LIFETIME') {
    return (
      <div id="billing_view_founder" className="space-y-6 animate-fade-in pb-12">
        {/* Beautiful display for founder */}
        <div className="p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-500/20 inline-flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Executive Control Panel
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Welcome back, {user?.fullName || 'Founder'}
              </h2>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                You are authenticated as a SalesPilot Founder. This account is provisioned with lifetime unrestricted access to the **Enterprise Agency** suite, all premium Gemini capabilities, and infinite resource quotas.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 bg-slate-950/45 p-4 rounded-xl border border-slate-800 shrink-0">
              <Server className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Licence Tier</span>
                <span className="text-xs font-bold text-white font-mono">LIFETIME ENTERPRISE APEX</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-indigo-900/30">
            <div className="p-4 bg-slate-950/30 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Billing Status</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">Exempt (No Billing Required)</span>
            </div>
            <div className="p-4 bg-slate-950/30 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Usage & Search Limits</span>
              <span className="text-xs font-bold text-indigo-400 font-mono">Unlimited Everything</span>
            </div>
            <div className="p-4 bg-slate-950/30 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Subscription Expiration</span>
              <span className="text-xs font-bold text-amber-400 font-mono">Never (Infinite Lifetime)</span>
            </div>
          </div>
        </div>

        {/* Quota overview and direct access block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">Quota Allocations</h3>
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">Lead Sourcing</span>
                  <span className="font-bold text-slate-900 dark:text-white">Infinite (No limits)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">AI Copywriting Campaigns</span>
                  <span className="font-bold text-slate-900 dark:text-white">Infinite (No limits)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">Active Autonomous Agents</span>
                  <span className="font-bold text-slate-900 dark:text-white">Infinite (No limits)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">Premium Features Enabled</h3>
              <ul className="text-xs text-slate-500 dark:text-slate-450 space-y-2 pt-1 font-mono">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Full Google Maps Places API direct search</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Serper Web Scraping & Description enrichment</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unlimited Bulk Outreach sequence triggers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Real-time multitenant administrator permissions</li>
              </ul>
            </div>

            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 rounded-lg flex gap-2.5">
              <User className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-300">Developer Notes:</strong> Since your email <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{user?.email}</strong> is identified as the primary Founder Account, you bypass all billing middleware checks and never receive payment prompts or expiration notices.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="billing_view" className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-sm font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <CreditCard className="w-4 h-4 text-blue-600" /> SaaS Billing & Credits Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage active Indian outbound channels, compute GST tax invoice compliance sheets, and process payments in INR.</p>
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
            Current Tier: <span className="text-blue-600 dark:text-blue-400 font-bold">{user?.tier || 'STARTER'}</span>
          </div>
        </div>
      </div>

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
            onSelectPlan={handleInitiateCashfreeCheckout}
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

              {/* Integration Blueprint documentation */}
              <CashfreeArchitectureSection />

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

              {/* Linked card, webhooks list */}
              <PaymentStatusSection
                cardDigits={cardDigits}
                setCardDigits={setCardDigits}
                cardExpiry={cardExpiry}
                setCardExpiry={setCardExpiry}
                cardCvv={cardCvv}
                setCardCvv={setCardCvv}
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

      {/* Simulated Checkout Modal Overlay */}
      {showCheckoutModal && cashfreeEnvelope && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-800">
            
            {/* Modal Left: Gateway Simulator */}
            <div className="flex-1 p-6 space-y-6 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 tracking-widest uppercase">CASHFREE SUBSCRIPTION PORTAL</span>
                </div>
                <span className="text-[9px] font-mono text-slate-450 dark:text-slate-500">TEST SANDBOX</span>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-slate-550 dark:text-slate-500 uppercase">Grand Invoice Price (INR)</div>
                <h3 className="text-2xl font-bold text-slate-950 dark:text-white font-mono">
                  ₹{cashfreeEnvelope.order_amount.toLocaleString('en-IN')}.00 INR
                </h3>
                <div className="text-[10px] text-slate-500 font-mono">
                  Order Hash: <span className="text-blue-600 dark:text-blue-400 font-semibold">{cashfreeEnvelope.order_id}</span>
                </div>
              </div>

              {/* Payment credentials */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono text-slate-500 uppercase">Credit Card Number</label>
                  <input 
                    type="text"
                    value={cardDigits}
                    onChange={(e) => setCardDigits(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-mono text-slate-900 dark:text-white p-2.5 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono text-slate-500 uppercase">Expiry</label>
                    <input 
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-mono text-slate-900 dark:text-white p-2.5 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono text-slate-500 uppercase">CVV Security</label>
                    <input 
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-mono text-slate-900 dark:text-white p-2.5 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                {paymentVerified ? (
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs rounded-lg text-center font-mono font-bold animate-pulse">
                    Capture Approved! Dispatching Cashfree Webhooks...
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowCheckoutModal(false)}
                      className="flex-grow py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-350 rounded-lg font-semibold cursor-pointer"
                    >
                      Cancel Pay
                    </button>
                    <button 
                      type="button" 
                      onClick={handleVerifyCashfreePayment}
                      disabled={verifyingPayment}
                      className="flex-grow py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      {verifyingPayment ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying Signatures...
                        </>
                      ) : (
                        <>Confirm Pay ₹{cashfreeEnvelope.order_amount.toLocaleString('en-IN')}</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Right: Live Json logger */}
            <div className="flex-1 p-6 bg-slate-950 font-mono flex flex-col justify-between max-h-[420px] md:max-h-none text-slate-200">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">API Payload Envelope</span>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Server-to-server transaction context generated by the backend API controller. Includes dynamic order ID hashes and customer identifiers.
                </p>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto text-[10px] text-blue-400 leading-normal max-h-[220px] overflow-y-auto">
                  <pre>{JSON.stringify(cashfreeEnvelope, null, 2)}</pre>
                </div>
              </div>
              <span className="block text-[9.5px] text-zinc-500 border-t border-zinc-900 pt-3 mt-4">
                API Endpoint: POST /api/v1/payments/create-order
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
