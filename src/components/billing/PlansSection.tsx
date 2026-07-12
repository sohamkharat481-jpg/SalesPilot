import React, { useState } from 'react';
import { Check, Sparkles, Loader2, Award, Info, HelpCircle, Star, Quote } from 'lucide-react';
import { SubscriptionTier, WorkspaceUser } from '../../types';

export interface Plan {
  id: SubscriptionTier;
  name: string;
  priceInrMonthly: number;
  priceInrAnnual: number;
  description: string;
  features: string[];
  popular?: boolean;
}

interface PlansSectionProps {
  user: WorkspaceUser | null;
  billingCycle: 'monthly' | 'annual';
  setBillingCycle: (cycle: 'monthly' | 'annual') => void;
  onSelectPlan: (tier: SubscriptionTier, price: number) => void;
  loadingPlanId: string | null;
}

export const PLANS: Plan[] = [
  {
    id: 'STARTER',
    name: 'Starter Pilot',
    priceInrMonthly: 1999,
    priceInrAnnual: 19990,
    description: 'Perfect for early-stage outbound pioneers & single consultants.',
    features: [
      '1 Workspace User Seat',
      '1 Connected Organization',
      '1,000 Sourced Lead Searches / Mo',
      '500 Personalized AI Emails / Mo',
      'Unlimited CRM Local Contacts',
      'Gmail Account Outbox Sync',
      'Google Calendar Integration',
      'Basic AI Corporate Research',
      'Basic Performance Analytics',
      'Standard Support Ticketing'
    ]
  },
  {
    id: 'GROWTH',
    name: 'Growth Professional',
    priceInrMonthly: 4999,
    priceInrAnnual: 49990,
    description: 'The definitive sweet-spot for scaling B2B marketing teams.',
    features: [
      '5 Included User Seats',
      '3 Connected Organizations',
      '10,000 Sourced Lead Searches / Mo',
      '5,000 Personalized AI Emails / Mo',
      'Unlimited Campaign Sequences',
      'Advanced CRM & Kanban Pipeline',
      'Deep AI Research & Dossiers',
      'Personalized AI Outreach Engine',
      'Appointment Booking Automation',
      'Priority Support Queue Routing',
      'Comprehensive Reports Engine',
      'Advanced Campaign Analytics'
    ],
    popular: true
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional Scale',
    priceInrMonthly: 9999,
    priceInrAnnual: 99990,
    description: 'Designed for high-frequency agencies and sales teams.',
    features: [
      '20 Included User Seats',
      'Unlimited Organizations',
      '50,000 Sourced Lead Searches / Mo',
      'Unlimited Personalized AI Emails',
      'Unlimited Campaign Sequences',
      'Autonomous AI Agent Deployments',
      'Advanced Report & Funnel Analytics',
      'Developer REST API Key Access',
      'Custom White-Label Branding',
      'Highest Priority Job Queue',
      'Dedicated Customer Success Manager'
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise Apex',
    priceInrMonthly: 29999,
    priceInrAnnual: 249990,
    description: 'High-performance infrastructure, custom billing, & SLA compliance.',
    features: [
      'Unlimited User Seats',
      'Unlimited Organizations',
      'Unlimited Lead Searches',
      'Unlimited AI Emails & Credits',
      'Custom Whitelabeled Portal',
      'Dedicated Secure Virtual Machines',
      'Enterprise SSO (SAML/OIDC Ready)',
      'Custom CRM & API Integrations',
      '24/7/365 Phone Support Helpline',
      'Strict SLA Guarantee Commitments',
      'Dedicated Enterprise Account Director'
    ]
  }
];

export function PlansSection({
  user,
  billingCycle,
  setBillingCycle,
  onSelectPlan,
  loadingPlanId
}: PlansSectionProps) {
  const currentTier = user?.tier || 'STARTER';
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const getPrice = (plan: Plan) => {
    return billingCycle === 'annual' ? plan.priceInrAnnual : plan.priceInrMonthly;
  };

  const getSavings = (plan: Plan) => {
    const monthlyTotal = plan.priceInrMonthly * 12;
    const savings = monthlyTotal - plan.priceInrAnnual;
    return savings;
  };

  const comparisonRows = [
    { category: 'Licensing', feature: 'Included User Seats', starter: '1 User', growth: '5 Users', professional: '20 Users', enterprise: 'Unlimited' },
    { category: 'Licensing', feature: 'Connected Orgs', starter: '1 Org', growth: '3 Orgs', professional: 'Unlimited', enterprise: 'Unlimited' },
    { category: 'Limits', feature: 'Lead Sourcing / Mo', starter: '1,000 Leads', growth: '10,000 Leads', professional: '50,000 Leads', enterprise: 'Unlimited' },
    { category: 'Limits', feature: 'AI Email Drafts / Mo', starter: '500 Drafts', growth: '5,000 Drafts', professional: 'Unlimited', enterprise: 'Unlimited' },
    { category: 'Outreach', feature: 'Active Campaigns', starter: '3 Pipelines', growth: 'Unlimited', professional: 'Unlimited', enterprise: 'Unlimited' },
    { category: 'AI Abilities', feature: 'AI Company Research', starter: 'Basic Summary', growth: 'Full Dossier & PDF', professional: 'Full Dossier & PDF', enterprise: 'Custom Models' },
    { category: 'AI Abilities', feature: 'Autonomous Agents', starter: '—', growth: '—', professional: 'Enabled (Up to 5)', enterprise: 'Unlimited' },
    { category: 'Integrations', feature: 'Workspace (Gmail/GCal)', starter: 'Standard Connect', growth: 'Multi-account Sync', professional: 'Multi-account Sync', enterprise: 'Custom Handshakes' },
    { category: 'Integrations', feature: 'REST API & Webhooks', starter: '—', growth: 'Standard', professional: 'Full REST Keys', enterprise: 'Custom Endpoints' },
    { category: 'Security & SLA', feature: 'Enterprise SSO', starter: '—', growth: '—', professional: '—', enterprise: 'SAML / OIDC Ready' },
    { category: 'Security & SLA', feature: 'Service Level Agreement', starter: '—', growth: '—', professional: 'Standard Support', enterprise: '99.99% Guaranteed uptime' },
    { category: 'Support', feature: 'Assistance Class', starter: 'Standard Ticketing', growth: 'Priority Routing', professional: 'Dedicated CS Manager', enterprise: 'Dedicated Account Director' },
  ];

  const faqs = [
    {
      q: "How do I choose the right plan for my organization?",
      a: "Our Starter Pilot is ideal for individual consultants starting cold outreach. The Growth Professional is the sweet spot for scaling B2B teams looking for deep AI research and outbound templates, while Professional Scale and Enterprise options support higher seat volume and advanced automated integrations."
    },
    {
      q: "Is Indian GST calculated at checkout?",
      a: "Yes. All subscription transactions processed inside India are subject to the standard 18% Goods and Services Tax (GST). If you enter a valid GSTIN in your billing dashboard, it will be validated and appended directly to your formal tax invoices for complete corporate compliance."
    },
    {
      q: "Can I upgrade or downgrade my plan at any time?",
      a: "Absolutely. Upgrades process instantly. Any remaining days on your existing billing cycle are computed as pro-rata credits and deducted from your new invoice automatically. Downgrades take effect at the end of your current cycle."
    },
    {
      q: "What payment gateways are supported?",
      a: "Through our production integration with Cashfree, we securely support UPI transactions (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit cards (Visa, Mastercard, RuPay, Diners Club), Net Banking (65+ Indian Banks), and popular Digital Wallets."
    },
    {
      q: "What happens when I exceed my lead search or AI email limits?",
      a: "Our system tracks usage in real-time. If you reach 100% of your allocated monthly quota, further outbound searches and email sequences will be paused. You can instantly upgrade to a higher tier or buy add-on credit bundles to resume operations."
    }
  ];

  const testimonials = [
    {
      quote: "SalesPilot completely changed how we handle outbound. The clay-like research is fully automated and our email replies have doubled.",
      author: "Rajesh Kumar",
      title: "VP of Growth, TechNode India",
      rating: 5
    },
    {
      quote: "Having multi-model AI routing with dedicated Indian GST compliant invoicing made this the easiest purchase for our finance team.",
      author: "Sneha Kapoor",
      title: "Operations Director, Astra Logistics",
      rating: 5
    }
  ];

  return (
    <div id="plans_section_wrapper" className="space-y-12">
      
      {/* Primary Plans Segment */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
              <Award className="w-4 h-4 text-indigo-600" /> CHOOSE YOUR ACCELERATION TIER
            </h3>
            <p className="text-xs text-slate-500 mt-1">Select an outbound framework that corresponds to your weekly campaign dispatch volume.</p>
          </div>

          {/* Toggle Monthly vs Annual */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-850">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>Annual</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">Save ~20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const planPrice = getPrice(plan);
            const isHigher = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentTier);
            const savings = getSavings(plan);

            return (
              <div
                key={plan.id}
                id={`plan_card_${plan.id.toLowerCase()}`}
                className={`p-6 bg-white dark:bg-slate-900 border rounded-xl flex flex-col justify-between relative transition-all duration-300 ${
                  plan.popular 
                    ? 'border-indigo-500 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/10 dark:ring-indigo-400/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-4 px-2.5 py-0.5 bg-indigo-600 dark:bg-indigo-500 text-white text-[9px] font-mono font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Popular Choice
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">{plan.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed min-h-[32px]">{plan.description}</p>
                  </div>

                  <div className="py-2 flex flex-col border-b border-slate-100 dark:border-slate-850">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        ₹{planPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        / {billingCycle === 'annual' ? 'Yr' : 'Mo'}
                      </span>
                    </div>
                    {billingCycle === 'annual' && savings > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 font-mono">
                        Save ₹{savings.toLocaleString('en-IN')} / Yr compared to monthly
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2.5 pt-2">
                    {plan.features.slice(0, 7).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-normal">
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                    {plan.features.length > 7 && (
                      <li className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold pl-5">
                        + {plan.features.length - 7} more advanced capabilities
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  id={`btn_select_plan_${plan.id.toLowerCase()}`}
                  onClick={() => onSelectPlan(plan.id, planPrice)}
                  disabled={isCurrent || loadingPlanId !== null}
                  className={`w-full py-2.5 mt-8 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed font-mono'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {loadingPlanId === plan.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Handshaking...
                    </>
                  ) : isCurrent ? (
                    'Your Active Tier'
                  ) : isHigher ? (
                    <>Upgrade to {plan.name}</>
                  ) : (
                    <>Downgrade to {plan.name}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Complete Comparison Matrix */}
      <div id="feature_comparison_matrix" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-150 dark:border-slate-850">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Enterprise Feature Comparison Table</h3>
          <p className="text-xs text-slate-500 mt-1">SLA guarantees, support speeds, and API limits across all active commercial plans.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 font-mono text-[10px] uppercase text-slate-500 border-b border-slate-150 dark:border-slate-850">
                <th className="p-4 font-semibold">Features & Quotas</th>
                <th className="p-4 font-semibold text-center">Starter</th>
                <th className="p-4 font-semibold text-center">Growth</th>
                <th className="p-4 font-semibold text-center">Professional</th>
                <th className="p-4 font-semibold text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition">
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-200">
                    <span className="block text-[9px] text-indigo-500 font-mono uppercase tracking-wider font-semibold mb-0.5">{row.category}</span>
                    {row.feature}
                  </td>
                  <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-mono">{row.starter}</td>
                  <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-mono font-semibold">{row.growth}</td>
                  <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-mono">{row.professional}</td>
                  <td className="p-4 text-center text-indigo-600 dark:text-indigo-400 font-mono font-bold">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ & Social Proof Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FAQs */}
        <div id="faq_section" className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-500" /> FREQUENTLY ASKED QUESTIONS
            </h3>
            <p className="text-xs text-slate-500 mt-1">Everything you need to know about corporate billing and quotas.</p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="border border-slate-100 dark:border-slate-850 rounded-lg p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-all cursor-pointer"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">{faq.q}</span>
                  <span className="text-indigo-500 font-mono text-sm shrink-0">{activeFaq === i ? '−' : '+'}</span>
                </div>
                {activeFaq === i && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed pl-1 border-l border-indigo-500">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div id="testimonials_section" className="lg:col-span-5 bg-indigo-950 text-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden border border-indigo-900">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-800/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase">PROVEN SOCIAL PROOF</h4>
            <Quote className="w-8 h-8 text-indigo-400 opacity-50" />
            
            <div className="space-y-4">
              {testimonials.map((t, idx) => (
                <div key={idx} className="space-y-2 border-b border-indigo-900/60 pb-4 last:border-b-0 last:pb-0">
                  <p className="text-xs italic text-slate-300 leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-white">{t.author}, <span className="text-indigo-300 font-normal">{t.title}</span></span>
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-indigo-900/40 rounded-lg text-center text-[10px] text-indigo-300 border border-indigo-900/30">
            Backed by 99.9% API uptime guarantees & compliant GST e-invoice generation systems.
          </div>
        </div>

      </div>

    </div>
  );
}
