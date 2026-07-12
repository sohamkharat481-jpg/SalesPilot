import React, { useState, useMemo } from 'react';
import { Tag, Sparkles, X, Check, ArrowRight, Calendar, AlertCircle } from 'lucide-react';

export interface Coupon {
  code: string;
  type: 'PERCENT' | 'FLAT' | 'REFERRAL';
  value: number; // e.g. 50 for 50% or 1000 for ₹1000 flat
  description: string;
  expiryDate: string; // ISO format or human readable
  maxUsage: number;
  currentUsage: number;
  minAmount: number;
  waveGst?: boolean;
}

interface CouponsSectionProps {
  basePrice: number;
  activeCoupon: string | null;
  setActiveCoupon: (coupon: string | null) => void;
  gstRate: number; // usually 0.18 (18%)
  onLogMessage: (text: string, type: 'info' | 'success' | 'warn') => void;
}

export const AVAILABLE_COUPONS: Coupon[] = [
  { 
    code: 'PILOT50', 
    type: 'PERCENT', 
    value: 50, 
    description: '50% Flat discount on all monthly B2B sequences', 
    expiryDate: '2026-12-31', 
    maxUsage: 500, 
    currentUsage: 342, 
    minAmount: 1999 
  },
  { 
    code: 'FLAT2000', 
    type: 'FLAT', 
    value: 2000, 
    description: 'Flat ₹2,000 off on any Scale or Growth professional plans', 
    expiryDate: '2026-09-30', 
    maxUsage: 100, 
    currentUsage: 89, 
    minAmount: 4999 
  },
  { 
    code: 'REF_FRIEND25', 
    type: 'REFERRAL', 
    value: 25, 
    description: 'Referral discount coupon: 25% discount for invitees', 
    expiryDate: '2026-11-15', 
    maxUsage: 50, 
    currentUsage: 12, 
    minAmount: 1999 
  },
  { 
    code: 'GSTFREE', 
    type: 'PERCENT', 
    value: 0, 
    description: 'Special exemption waiver for Indian GST surcharges entirely', 
    expiryDate: '2026-12-31', 
    maxUsage: 1000, 
    currentUsage: 215, 
    minAmount: 1999,
    waveGst: true 
  }
];

export function CouponsSection({
  basePrice,
  activeCoupon,
  setActiveCoupon,
  gstRate,
  onLogMessage
}: CouponsSectionProps) {
  const [promoInput, setPromoInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApplyCoupon = (e?: React.FormEvent, codeToApply?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const inputCode = (codeToApply || promoInput).toUpperCase().trim();
    if (!inputCode) return;

    const matched = AVAILABLE_COUPONS.find(c => c.code === inputCode);

    if (!matched) {
      setErrorMsg("Promo code not recognized or has expired. Try 'PILOT50' or 'FLAT2000'.");
      return;
    }

    // 1. Minimum Amount Check
    if (basePrice < matched.minAmount) {
      setErrorMsg(`Minimum cart value required is ₹${matched.minAmount.toLocaleString('en-IN')} to apply "${matched.code}". Current plan is too low.`);
      return;
    }

    // 2. Maximum Usage Check
    if (matched.currentUsage >= matched.maxUsage) {
      setErrorMsg(`Coupon "${matched.code}" has reached its maximum usage limit (${matched.maxUsage}/${matched.maxUsage}).`);
      return;
    }

    // 3. Expiry Date Check
    const expiry = new Date(matched.expiryDate);
    const today = new Date();
    if (today > expiry) {
      setErrorMsg(`Coupon "${matched.code}" expired on ${matched.expiryDate}.`);
      return;
    }

    // Successful Application
    setActiveCoupon(matched.code);
    setPromoInput('');
    onLogMessage(`Promo code "${matched.code}" applied: ${matched.description}`, "success");
  };

  const handleRemoveCoupon = () => {
    onLogMessage(`Promo code "${activeCoupon}" removed.`, "info");
    setActiveCoupon(null);
  };

  // Live calculations for current active coupon
  const calculations = useMemo(() => {
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
    const activeGstRate = waveGst ? 0 : gstRate;
    const gstAmount = Math.round(subtotal * activeGstRate);
    const grandTotal = subtotal + gstAmount;

    return {
      discountAmount,
      subtotal,
      gstAmount,
      grandTotal,
      activeGstRate
    };
  }, [basePrice, activeCoupon, gstRate]);

  return (
    <div id="coupons_section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Coupon Form & Available code hints */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-indigo-600" /> APPLY REDEMPTION COUPONS
          </h3>
          <p className="text-xs text-slate-500 mt-1">Acquire percentage discounts, flat fee reductions, or referral credit matchers.</p>
        </div>

        <form onSubmit={(e) => handleApplyCoupon(e)} className="flex gap-2">
          <input 
            type="text" 
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="PROMO CODE (e.g., FLAT2000)"
            className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2.5 rounded-lg font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:bg-white"
          />
          <button
            id="btn_apply_coupon"
            type="submit"
            className="px-4 py-2 bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1"
          >
            Apply <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 rounded-lg text-[10px] font-mono leading-relaxed flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Public testing coupons */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" /> Available Promotional Coupons (Click to apply)
          </span>
          <div className="space-y-1.5">
            {AVAILABLE_COUPONS.map((c) => {
              const isApplied = activeCoupon === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => handleApplyCoupon(undefined, c.code)}
                  className={`w-full text-left p-3 border rounded-lg transition flex justify-between items-start text-[10px] cursor-pointer ${
                    isApplied 
                      ? 'border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/25' 
                      : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/45'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-indigo-600 dark:text-indigo-400 text-xs">{c.code}</strong>
                      <span className="text-[8px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold">{c.type}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-normal">{c.description}</p>
                    <div className="flex items-center gap-3 text-[8px] text-slate-400 font-mono">
                      <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> Expires {c.expiryDate}</span>
                      <span>Usage: {c.currentUsage}/{c.maxUsage}</span>
                      <span>Min Spend: ₹{c.minAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  {isApplied && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Numerical Price Breakdown card */}
      <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Live Invoice Value Calculation</h4>

        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-350">
          
          <div className="flex justify-between items-center">
            <span>Base Subscription Price:</span>
            <span className="font-mono text-slate-900 dark:text-white font-medium">₹{basePrice.toLocaleString('en-IN')}</span>
          </div>

          {activeCoupon && (
            <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400">
              <span className="flex items-center gap-1 font-semibold">
                Promo Applied (<strong className="font-mono">{activeCoupon}</strong>):
                <button onClick={handleRemoveCoupon} className="hover:text-red-500 focus:outline-none cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
              <span className="font-mono font-bold">-₹{calculations.discountAmount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-850 pt-2.5">
            <span>Taxable Value (Subtotal):</span>
            <span className="font-mono font-semibold text-slate-950 dark:text-white">₹{calculations.subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Estimated GST ({Math.round(calculations.activeGstRate * 100)}%):</span>
            <span className="font-mono text-slate-950 dark:text-white">₹{calculations.gstAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-baseline border-t-2 border-slate-350 dark:border-slate-800 pt-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Total Charge (INR):</span>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">₹{calculations.grandTotal.toLocaleString('en-IN')}</span>
              <span className="text-[9px] block text-slate-400 font-mono font-medium">All Taxes Included</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
