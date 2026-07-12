import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users, CreditCard, ShieldCheck, Plus, Trash2, Edit2, 
  Check, X, RefreshCw, Sparkles, Receipt, Database, Download, Mail, 
  Search, Sliders, Play, Pause, AlertTriangle, ArrowUpRight, Percent, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { SubscriptionTier } from '../../types';
import { AVAILABLE_COUPONS, Coupon } from './CouponsSection';
import { Invoice } from './InvoicesSection';

interface AdminBillingConsoleProps {
  onLogMessage: (text: string, type: 'info' | 'success' | 'warn') => void;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

interface AdminPlan {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  description: string;
}

interface ClientSubscription {
  id: string;
  companyName: string;
  email: string;
  tier: SubscriptionTier;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  billingCycle: 'monthly' | 'annual';
  autoRenew: boolean;
  nextRenewalDate: string;
}

export function AdminBillingConsole({ onLogMessage, invoices, setInvoices }: AdminBillingConsoleProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'plans' | 'coupons' | 'subscriptions' | 'invoices'>('metrics');

  // Local Admin Plans State
  const [plans, setPlans] = useState<AdminPlan[]>([
    { id: 'STARTER', name: 'Starter Pilot', monthlyPrice: 1999, annualPrice: 19990, description: 'Best for individual sales agents starting out.', features: ['1 User', '1 Organization', '1,000 Lead Searches / mo', '500 AI Emails / mo', 'Gmail Integration'] },
    { id: 'GROWTH', name: 'Growth Professional', monthlyPrice: 4999, annualPrice: 49990, description: 'Supercharge mid-sized teams looking for growth.', features: ['3 Users', '3 Organizations', '5,000 Lead Searches / mo', '2,500 AI Emails / mo', 'Vinci copywriting API'] },
    { id: 'PROFESSIONAL', name: 'Scale Professional', monthlyPrice: 9999, annualPrice: 99990, description: 'Perfect for established agencies and enterprises.', features: ['8 Users', '8 Organizations', '15,000 Lead Searches / mo', '10,000 AI Emails / mo', 'Advanced AI Researches'] },
    { id: 'ENTERPRISE', name: 'Enterprise Agency', monthlyPrice: 24999, annualPrice: 249990, description: 'Bespoke high-volume solutions with dedicated support.', features: ['Unlimited Users', 'Unlimited Orgs', '50,000 Lead Searches / mo', '30,000 AI Emails / mo', 'Custom API access'] }
  ]);

  // Local Admin Coupons State
  const [adminCoupons, setAdminCoupons] = useState<Coupon[]>(AVAILABLE_COUPONS);

  // Local Client Subscriptions State
  const [clients, setClients] = useState<ClientSubscription[]>([
    { id: 'cli-1', companyName: 'Horizon Media Group', email: 'billing@horizonmedia.co', tier: 'PROFESSIONAL', status: 'ACTIVE', billingCycle: 'monthly', autoRenew: true, nextRenewalDate: 'Aug 01, 2026' },
    { id: 'cli-2', companyName: 'Apex Marketing Solutions', email: 'finance@apexmarketing.in', tier: 'ENTERPRISE', status: 'ACTIVE', billingCycle: 'annual', autoRenew: true, nextRenewalDate: 'Jul 15, 2027' },
    { id: 'cli-3', companyName: 'StellarTech Labs', email: 'admin@stellartech.io', tier: 'GROWTH', status: 'PAUSED', billingCycle: 'monthly', autoRenew: false, nextRenewalDate: 'Aug 10, 2026' },
    { id: 'cli-4', companyName: 'CloudFlow SaaS', email: 'ops@cloudflowsaas.com', tier: 'STARTER', status: 'CANCELLED', billingCycle: 'monthly', autoRenew: false, nextRenewalDate: 'Jul 28, 2026' }
  ]);

  // Modals / Form states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanId, setNewPlanId] = useState<SubscriptionTier>('STARTER');
  const [newPlanMonthly, setNewPlanMonthly] = useState('');
  const [newPlanAnnual, setNewPlanAnnual] = useState('');
  const [newPlanFeatures, setNewPlanFeatures] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState('2026-12-31');
  const [newCouponMax, setNewCouponMax] = useState('500');
  const [newCouponMin, setNewCouponMin] = useState('1999');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Core Revenue Calculations
  const metrics = useMemo(() => {
    // Basic summation of MRR based on active tiers
    let mrrSum = 0;
    let inactiveCount = 1240;
    let activeCount = 845;
    let cancelledCount = 142;

    clients.forEach(c => {
      if (c.status === 'ACTIVE') {
        const plan = plans.find(p => p.id === c.tier);
        if (plan) {
          const monthlyEquivalent = c.billingCycle === 'annual' ? plan.annualPrice / 12 : plan.monthlyPrice;
          mrrSum += monthlyEquivalent;
        }
      }
    });

    const calculatedMrr = mrrSum + 245000; // adding baseline dummy MRR for high-fidelity values
    const arr = calculatedMrr * 12;
    const churn = 2.4;

    return {
      mrr: calculatedMrr,
      arr,
      churn,
      inactiveCount,
      activeCount,
      cancelledCount
    };
  }, [clients, plans]);

  // Chart data
  const revenueTrendData = [
    { month: 'Jan', MRR: 420000, ARR: 5040000 },
    { month: 'Feb', MRR: 460000, ARR: 5520000 },
    { month: 'Mar', MRR: 510000, ARR: 6120000 },
    { month: 'Apr', MRR: 535000, ARR: 6420000 },
    { month: 'May', MRR: 560000, ARR: 6720000 },
    { month: 'Jun', MRR: 584000, ARR: 7008000 }
  ];

  const userDistributionData = [
    { name: 'Inactive Users', count: metrics.inactiveCount, fill: '#6366f1' },
    { name: 'Active Paid', count: metrics.activeCount, fill: '#10b981' },
    { name: 'Cancelled', count: metrics.cancelledCount, fill: '#ef4444' }
  ];

  // 2. Action: Create / Edit Plan
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanMonthly || !newPlanAnnual) return;

    const parsedMonthly = parseInt(newPlanMonthly) || 0;
    const parsedAnnual = parseInt(newPlanAnnual) || 0;
    const parsedFeatures = newPlanFeatures.split(',').map(f => f.trim()).filter(Boolean);

    if (editingPlan) {
      // Edit
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? {
        ...p,
        name: newPlanName,
        monthlyPrice: parsedMonthly,
        annualPrice: parsedAnnual,
        description: newPlanDesc,
        features: parsedFeatures
      } : p));
      onLogMessage(`Admin Action: Updated features and prices for plan tier "${editingPlan.id}"`, 'success');
    } else {
      // Create
      const exist = plans.find(p => p.id === newPlanId);
      if (exist) {
        onLogMessage(`Admin Error: Subscription tier "${newPlanId}" already configured.`, 'warn');
        return;
      }
      const created: AdminPlan = {
        id: newPlanId,
        name: newPlanName,
        monthlyPrice: parsedMonthly,
        annualPrice: parsedAnnual,
        description: newPlanDesc,
        features: parsedFeatures
      };
      setPlans(prev => [...prev, created]);
      onLogMessage(`Admin Action: Successfully created new plan tier "${newPlanId}"`, 'success');
    }

    // Reset
    setShowPlanModal(false);
    setEditingPlan(null);
    setNewPlanName('');
    setNewPlanMonthly('');
    setNewPlanAnnual('');
    setNewPlanFeatures('');
    setNewPlanDesc('');
  };

  const handleEditPlanClick = (p: AdminPlan) => {
    setEditingPlan(p);
    setNewPlanId(p.id);
    setNewPlanName(p.name);
    setNewPlanMonthly(p.monthlyPrice.toString());
    setNewPlanAnnual(p.annualPrice.toString());
    setNewPlanFeatures(p.features.join(', '));
    setNewPlanDesc(p.description);
    setShowPlanModal(true);
  };

  const handleDeletePlan = (id: SubscriptionTier) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    onLogMessage(`Admin Action: Decommissioned and deleted plan tier "${id}"`, 'warn');
  };

  // 3. Action: Create Coupon
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponValue) return;

    const created: Coupon = {
      code: newCouponCode.toUpperCase().trim(),
      type: newCouponType,
      value: parseInt(newCouponValue) || 0,
      description: newCouponDesc || `${newCouponCode} Promo Discount Coupon`,
      expiryDate: newCouponExpiry,
      maxUsage: parseInt(newCouponMax) || 100,
      currentUsage: 0,
      minAmount: parseInt(newCouponMin) || 1999
    };

    setAdminCoupons(prev => [created, ...prev]);
    setShowCouponModal(false);
    // Reset fields
    setNewCouponCode('');
    setNewCouponValue('');
    setNewCouponDesc('');
    setNewCouponExpiry('2026-12-31');
    setNewCouponMax('500');
    setNewCouponMin('1999');

    onLogMessage(`Admin Action: Deployed new coupon campaign "${created.code}" with min-spend requirement.`, 'success');
  };

  const handleDeleteCoupon = (code: string) => {
    setAdminCoupons(prev => prev.filter(c => c.code !== code));
    onLogMessage(`Admin Action: Revoked and disabled coupon "${code}"`, 'warn');
  };

  // 4. Action: Manage Client Subscriptions
  const handleUpdateClientStatus = (clientId: string, newStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED') => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
    onLogMessage(`Admin Action: Forced subscription status update to "${newStatus}" for Client ID "${clientId}"`, 'info');
  };

  const handleUpdateClientTier = (clientId: string, newTier: SubscriptionTier) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, tier: newTier } : c));
    onLogMessage(`Admin Action: Forced manual upgrade/downgrade to "${newTier}" for Client ID "${clientId}"`, 'success');
  };

  const handleToggleClientAutoRenew = (clientId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, autoRenew: !c.autoRenew } : c));
    onLogMessage(`Admin Action: Overrode automated renewal configuration for client "${clientId}"`, 'info');
  };

  // Filter lists based on search
  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.tier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  return (
    <div id="admin_billing_console" className="space-y-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
      
      {/* Header and navigation tabs */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" /> SUPERADMIN CONSOLE
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
            Billing & Revenue Control Center
          </h2>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          {[
            { id: 'metrics', label: 'Revenue Hub' },
            { id: 'plans', label: 'Manage Plans' },
            { id: 'coupons', label: 'Coupons' },
            { id: 'subscriptions', label: 'Client Accounts' },
            { id: 'invoices', label: 'Audit Invoices' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRICS VIEW */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">MONTH RECURRING REV (MRR)</span>
              <p className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">₹{metrics.mrr.toLocaleString('en-IN')}</p>
              <span className="text-[9px] text-emerald-500 font-bold block flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +14.2% MoM Growth
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ANNUAL RECURRING REV (ARR)</span>
              <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">₹{metrics.arr.toLocaleString('en-IN')}</p>
              <span className="text-[9px] text-indigo-400 block font-mono font-medium">Forward Projected Run-rate</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">CHURN RATE</span>
              <p className="text-xl font-mono font-bold text-rose-500">2.4%</p>
              <span className="text-[9px] text-slate-400 block font-mono">B2B Standard Target &lt; 3%</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">INACTIVE LEADS</span>
              <p className="text-xl font-mono font-bold text-indigo-400">{metrics.inactiveCount}</p>
              <span className="text-[9px] text-slate-400 block font-mono">Unconverted count</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ACTIVE PAID TIER</span>
              <p className="text-xl font-mono font-bold text-emerald-500">{metrics.activeCount}</p>
              <span className="text-[9px] text-emerald-500 font-bold block">Paying subscribers</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">CANCELLED ACCTS</span>
              <p className="text-xl font-mono font-bold text-slate-500">{metrics.cancelledCount}</p>
              <span className="text-[9px] text-slate-400 block font-mono">In last 60 cycles</span>
            </div>

          </div>

          {/* Recharts Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Area Chart */}
            <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase">MRR/ARR Monthly Growth Curve</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData}>
                    <defs>
                      <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(val) => `₹${(val/1000)}k`} />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                    <Area type="monotone" dataKey="MRR" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMRR)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User segment split */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase">User Cohort Segments</h3>
              <div className="h-64 flex flex-col justify-between">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(v) => [`${v} Users`, 'Count']} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {userDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-[10px]">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs" /> Funnel Conversions Goal:</span>
                    <strong className="text-slate-800 dark:text-slate-200">25.5% Target</strong>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" /> Expansion MRR:</span>
                    <strong className="text-slate-800 dark:text-slate-200">12% Current</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PLANS MANAGER */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Subscription Price Catalog</h3>
            <button
              id="btn_create_plan_init"
              onClick={() => {
                setEditingPlan(null);
                setNewPlanId('STARTER');
                setNewPlanName('');
                setNewPlanMonthly('');
                setNewPlanAnnual('');
                setNewPlanFeatures('');
                setNewPlanDesc('');
                setShowPlanModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Create Plan
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                  <th className="px-5 py-3">Tier ID</th>
                  <th className="px-5 py-3">Catalog Name</th>
                  <th className="px-5 py-3">Monthly Cost</th>
                  <th className="px-5 py-3">Annual Cost (Year)</th>
                  <th className="px-5 py-3">Features Included</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">{p.id}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-350">{p.name}</td>
                    <td className="px-5 py-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">₹{p.monthlyPrice.toLocaleString('en-IN')}/mo</td>
                    <td className="px-5 py-3.5 font-mono text-emerald-600 dark:text-emerald-450">₹{p.annualPrice.toLocaleString('en-IN')}/yr</td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-500" title={p.features.join(', ')}>
                      {p.features.join(', ')}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleEditPlanClick(p)}
                        className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer inline-flex items-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COUPONS CONSOLE */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Promotion Campaign Codes</h3>
            <button
              onClick={() => setShowCouponModal(true)}
              className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Deploy Coupon
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                  <th className="px-5 py-3">Promo Code</th>
                  <th className="px-5 py-3">Discount Value</th>
                  <th className="px-5 py-3">Description Campaign</th>
                  <th className="px-5 py-3">Expiry Date</th>
                  <th className="px-5 py-3">Min Spend (INR)</th>
                  <th className="px-5 py-3">Redemption Usage</th>
                  <th className="px-5 py-3 text-right">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {adminCoupons.map((c) => (
                  <tr key={c.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.code}</td>
                    <td className="px-5 py-3.5 font-mono">
                      {c.type === 'FLAT' ? `₹${c.value.toLocaleString('en-IN')} Flat` : `${c.value}% Off`}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.description}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">{c.expiryDate}</td>
                    <td className="px-5 py-3.5 font-mono">₹{c.minAmount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {c.currentUsage}/{c.maxUsage}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(c.code)}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLIENT ACCOUNTS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Client Subscription Matrix</h3>
            
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search by company or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                  <th className="px-5 py-3">Company Details</th>
                  <th className="px-5 py-3">Billing Tier</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Cycle</th>
                  <th className="px-5 py-3 font-mono">AutoRenew</th>
                  <th className="px-5 py-3">Next Renewal</th>
                  <th className="px-5 py-3 text-right">Override Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredClients.map((cli) => (
                  <tr key={cli.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="px-5 py-3.5 space-y-0.5">
                      <strong className="text-slate-800 dark:text-slate-350 block font-semibold">{cli.companyName}</strong>
                      <span className="text-[10px] text-slate-400 block font-mono">{cli.email}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <select
                        value={cli.tier}
                        onChange={(e) => handleUpdateClientTier(cli.id, e.target.value as SubscriptionTier)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="STARTER">STARTER</option>
                        <option value="GROWTH">GROWTH</option>
                        <option value="PROFESSIONAL">PROFESSIONAL</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                        cli.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : cli.status === 'PAUSED' 
                          ? 'bg-amber-500/10 text-amber-600' 
                          : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {cli.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono capitalize">{cli.billingCycle}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleClientAutoRenew(cli.id)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                          cli.autoRenew 
                            ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        {cli.autoRenew ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">{cli.nextRenewalDate}</td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {cli.status !== 'ACTIVE' ? (
                        <button
                          onClick={() => handleUpdateClientStatus(cli.id, 'ACTIVE')}
                          className="px-2 py-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[10px] font-bold rounded cursor-pointer"
                        >
                          Activate
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateClientStatus(cli.id, 'PAUSED')}
                            className="px-2 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Pause
                          </button>
                          <button
                            onClick={() => handleUpdateClientStatus(cli.id, 'CANCELLED')}
                            className="px-2 py-1 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Enterprise Invoice Repository</h3>
            <span className="text-xs font-mono text-slate-500">Logged Invoices: {invoices.length}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                  <th className="px-5 py-3">Invoice Number</th>
                  <th className="px-5 py-3">Client details</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Taxable base</th>
                  <th className="px-5 py-3">18% GST Amount</th>
                  <th className="px-5 py-3 font-mono">Invoice Value</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-350">Horizon Media</span>
                      <span className="text-[10px] text-slate-450 block font-mono">{inv.state} | GSTIN: {inv.gstin || 'None'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{inv.date}</td>
                    <td className="px-5 py-3.5 font-mono">₹{(inv.baseAmount - inv.discount).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">₹{inv.gstAmount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">₹{inv.totalInr.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-450">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          onLogMessage(`GST Tax Invoice ${inv.invoiceNumber} has been securely dispatched to client finance inbox via SMTP routing.`, "success");
                        }}
                        title="Email Invoice"
                        className="p-1 text-slate-500 hover:text-indigo-650 cursor-pointer inline-flex items-center"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLAN CREATION / EDITING MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSavePlan} className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingPlan ? `Edit Tier: ${editingPlan.id}` : 'Create Subscription Catalog Plan'}
              </h3>
              <button type="button" onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {!editingPlan && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Subscription Tier ID</label>
                  <select
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value as SubscriptionTier)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="GROWTH">GROWTH</option>
                    <option value="PROFESSIONAL">PROFESSIONAL</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase">Catalog Display Name</label>
                <input 
                  type="text" 
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Growth Professional Special"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Monthly Price (₹ INR)</label>
                  <input 
                    type="number" 
                    value={newPlanMonthly}
                    onChange={(e) => setNewPlanMonthly(e.target.value)}
                    placeholder="1999"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Annual Price (₹ INR)</label>
                  <input 
                    type="number" 
                    value={newPlanAnnual}
                    onChange={(e) => setNewPlanAnnual(e.target.value)}
                    placeholder="19990"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase">Features list (comma separated)</label>
                <textarea 
                  value={newPlanFeatures}
                  onChange={(e) => setNewPlanFeatures(e.target.value)}
                  placeholder="1 User, 1 Organization, 1000 searches"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase">Short description</label>
                <input 
                  type="text" 
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="Best for starter operations"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => {
                  setShowPlanModal(false);
                  setEditingPlan(null);
                }}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {editingPlan ? 'Save Changes' : 'Publish Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* COUPON DEPLOYMENT MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveCoupon} className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-indigo-500" /> Deploy Promo Coupon
              </h3>
              <button type="button" onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Promo Code</label>
                  <input 
                    type="text" 
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    placeholder="e.g. LAUNCH30"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono font-bold uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Coupon Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
                  >
                    <option value="PERCENT">Percentage Discount (%)</option>
                    <option value="FLAT">Flat Rate Discount (₹ INR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Discount Value</label>
                  <input 
                    type="number" 
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    placeholder="30"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Min spend requirement (₹)</label>
                  <input 
                    type="number" 
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(e.target.value)}
                    placeholder="1999"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Expiration Date</label>
                  <input 
                    type="date" 
                    value={newCouponExpiry}
                    onChange={(e) => setNewCouponExpiry(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Max redemption limit</label>
                  <input 
                    type="number" 
                    value={newCouponMax}
                    onChange={(e) => setNewCouponMax(e.target.value)}
                    placeholder="500"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase">Campaign Description</label>
                <input 
                  type="text" 
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  placeholder="30% flat discount on yearly professional tier memberships"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowCouponModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Deploy Campaign
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
