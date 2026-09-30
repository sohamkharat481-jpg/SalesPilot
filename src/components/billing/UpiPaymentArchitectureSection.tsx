import React, { useState } from 'react';
import { QrCode, Terminal, Server, ArrowRight, ShieldCheck, CheckCircle2, IndianRupee } from 'lucide-react';

export function UpiPaymentArchitectureSection() {
  const [activeCodeTab, setActiveCodeTab] = useState<'checkout-initiate' | 'utr-submit' | 'admin-verify'>('checkout-initiate');

  const codeSnippets = {
    'checkout-initiate': `// POST /api/v1/billing/checkout/initiate
// 1. Server calculates canonical price (never trusts client amount)
// 2. Returns verified UPI ID, NPCI payment intent URI & QR configuration

router.post('/api/v1/billing/checkout/initiate', (req, res) => {
  const { plan, billingCycle } = req.body;
  
  // Resolves canonical pricing strictly from server database/config
  const pricing = calculateCanonicalPayablePrice(plan, billingCycle);
  const upiConfig = getUpiBillingConfig();
  
  // Generates canonical UPI payment URI (NPCI standard)
  const upiIntentUri = generateUpiIntentUri({
    upiId: upiConfig.upiId,
    businessName: upiConfig.businessName,
    amount: pricing.totalAmount,
    note: \`SalesPilot \${pricing.planId} (\${pricing.billingCycle})\`
  });

  res.json({
    success: true,
    checkout: {
      plan: pricing.planId,
      billingCycle: pricing.billingCycle,
      baseAmount: pricing.baseAmount,
      gstAmount: pricing.gstAmount,
      totalAmount: pricing.totalAmount,
      currency: 'INR',
      upiId: upiConfig.upiId,
      businessName: upiConfig.businessName,
      upiIntentUri
    }
  });
});`,

    'utr-submit': `// POST /api/v1/billing/payment/submit
// 1. Customer scans QR code in any UPI app and transfers money
// 2. Customer submits bank UTR / Transaction reference
// 3. Status set to PENDING_VERIFICATION (never auto-activated!)

router.post('/api/v1/billing/payment/submit', async (req, res) => {
  const { plan, billingCycle, utr, paymentDateTime, notes } = req.body;
  const { orgId } = resolveVerifiedOrganizationId(req, user);

  // Validates UTR uniqueness across all records
  const result = await UpiPaymentService.submitPayment({
    organizationId: orgId,
    userId: user.id,
    plan,
    billingCycle,
    utr,
    paymentDateTime,
    notes
  });

  res.json({
    success: true,
    message: 'Payment submitted. Awaiting administrator verification.',
    payment: result.payment // Status: PENDING_VERIFICATION
  });
});`,

    'admin-verify': `// POST /api/v1/billing/admin/payment/verify
// 1. Authorized administrator verifies UTR against bank records
// 2. Marks payment VERIFIED, sets verified_at and verified_by
// 3. Activates persistent subscription & issues formal tax invoice

router.post('/api/v1/billing/admin/payment/verify', async (req, res) => {
  // Enforces strict admin check: SUPER_ADMIN, OWNER, or Founder
  if (!isBillingAdmin(user)) {
    return res.status(403).json({ error: 'Unauthorized approval attempt.' });
  }

  const { paymentId } = req.body;
  const result = await UpiPaymentService.approvePayment(paymentId, user.id);

  res.json({
    success: true,
    message: 'Payment verified and subscription activated.',
    payment: result.payment,
    subscription: result.subscription,
    invoice: result.invoice
  });
});`
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 text-white">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400 mb-3">
          <QrCode className="w-3.5 h-3.5" /> Direct UPI QR Architecture
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Server-Authoritative Direct UPI Billing Pipeline
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Zero middleman fees. Customers scan the dynamic QR code using any UPI app (GPay, PhonePe, Paytm, BHIM), pay directly to your verified business account, and submit their UTR for human admin verification and instant entitlement activation.
        </p>
      </div>

      {/* 4-Step Pipeline Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-indigo-400">STEP 01</span>
            <h4 className="text-sm font-semibold text-white mt-1">Plan Selection</h4>
            <p className="text-xs text-slate-400 mt-1">
              Server resolves canonical price + 18% GST. Never trusts client input.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-indigo-300">
            <span>Canonical Pricing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-blue-400">STEP 02</span>
            <h4 className="text-sm font-semibold text-white mt-1">Scan & Pay QR</h4>
            <p className="text-xs text-slate-400 mt-1">
              Renders business UPI QR and NPCI intent URI for 1-tap app launch.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-blue-300">
            <span>Direct to Bank</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-amber-400">STEP 03</span>
            <h4 className="text-sm font-semibold text-white mt-1">UTR Submission</h4>
            <p className="text-xs text-slate-400 mt-1">
              Customer submits 12-digit bank reference. Stored as PENDING_VERIFICATION.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-amber-300">
            <span>Pending Check</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-400">STEP 04</span>
            <h4 className="text-sm font-semibold text-white mt-1">Admin Verification</h4>
            <p className="text-xs text-slate-400 mt-1">
              Admin approves payment. Activates entitlement & generates tax invoice.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-emerald-300">
            <span>Verified & Active</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Code Inspector Tabs */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 py-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCodeTab('checkout-initiate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCodeTab === 'checkout-initiate'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            1. Canonical Checkout
          </button>
          <button
            onClick={() => setActiveCodeTab('utr-submit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCodeTab === 'utr-submit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            2. UTR Submission
          </button>
          <button
            onClick={() => setActiveCodeTab('admin-verify')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCodeTab === 'admin-verify'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            3. Admin Verification
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-slate-950">
          <code>{codeSnippets[activeCodeTab]}</code>
        </pre>
      </div>
    </div>
  );
}
