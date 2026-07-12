import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Mail, Calendar, Key, CreditCard, Sparkles, Rocket,
  Check, ArrowRight, Loader2, Info, ChevronRight, HelpCircle,
  AlertCircle, ShieldCheck, Globe, CheckCircle2
} from 'lucide-react';
import { WorkspaceUser } from '../types';

interface OnboardingWizardProps {
  user: WorkspaceUser;
  onComplete: (orgData: { companyName: string; industry: string }) => void;
}

export function OnboardingWizard({ user, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Org State
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('SaaS & Software');
  const [website, setWebsite] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');

  // Step 2: Gmail State
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState(user.email || '');

  // Step 3: Google Calendar State
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Step 4: OpenAI API Key State
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiSaved, setOpenaiSaved] = useState(false);

  // Step 5: Gemini API Key State
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiSaved, setGeminiSaved] = useState(false);

  // Step 6: Cashfree Payments State
  const [cashfreeAppId, setCashfreeAppId] = useState('');
  const [cashfreeSecret, setCashfreeSecret] = useState('');
  const [cashfreeEnv, setCashfreeEnv] = useState<'TEST' | 'PROD'>('TEST');
  const [cashfreeConnected, setCashfreeConnected] = useState(false);

  // Step 7: Campaign State
  const [campaignName, setCampaignName] = useState('Initial Outbound Sequence');
  const [targetAudience, setTargetAudience] = useState('Marketing Agencies');
  const [campaignLaunched, setCampaignLaunched] = useState(false);

  const steps = [
    { number: 1, name: 'Organization', icon: Building, desc: 'Setup workspace profile' },
    { number: 2, name: 'Gmail', icon: Mail, desc: 'Connect outbound mailbox' },
    { number: 3, name: 'Calendar', icon: Calendar, desc: 'Configure smart scheduling' },
    { number: 4, name: 'OpenAI', icon: Key, desc: 'Integrate GPT sequence writer' },
    { number: 5, name: 'Gemini', icon: Sparkles, desc: 'Enable autonomous research' },
    { number: 6, name: 'Cashfree', icon: CreditCard, desc: 'Setup INR billing gateway' },
    { number: 7, name: 'First Campaign', icon: Rocket, desc: 'Launch active sequence' },
  ];

  const handleNextStep = async () => {
    setError(null);
    setLoading(true);

    try {
      if (currentStep === 1) {
        if (!companyName.trim()) {
          throw new Error('Company Name is required.');
        }
        // Save organization server-side
        const res = await fetch('/api/v1/auth/profile-setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: user.fullName,
            title: 'Founder & CEO',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            companyName,
            industry,
            website,
            timezone,
            currency
          })
        });
        if (!res.ok) throw new Error('Failed to configure organization. Please try again.');
      }

      if (currentStep === 2 && !gmailConnected) {
        throw new Error('Please authorize and connect your Gmail account to proceed.');
      }

      if (currentStep === 3 && !calendarConnected) {
        throw new Error('Please authorize Google Calendar to enable meeting bookings.');
      }

      if (currentStep === 4) {
        if (!openaiKey) {
          throw new Error('OpenAI API key is required to activate AI generation models.');
        }
        // Save OpenAI key
        const res = await fetch('/api/v1/integrations/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: openaiKey })
        });
        if (!res.ok) throw new Error('API validation failed. Verify your secret key.');
        setOpenaiSaved(true);
      }

      if (currentStep === 5) {
        if (!geminiKey) {
          throw new Error('Gemini API key is required for multi-agent background enrichment.');
        }
        // Save Gemini key
        const res = await fetch('/api/v1/integrations/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: geminiKey })
        });
        if (!res.ok) throw new Error('API connection failed. Verify your Gemini secret key.');
        setGeminiSaved(true);
      }

      if (currentStep === 6) {
        if (!cashfreeAppId || !cashfreeSecret) {
          throw new Error('Both Cashfree App ID and Secret Key are required.');
        }
        // Save Cashfree details
        const res = await fetch('/api/v1/integrations/cashfree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId: cashfreeAppId, secretKey: cashfreeSecret, environment: cashfreeEnv })
        });
        if (!res.ok) throw new Error('Failed to securely verify Cashfree credentials.');
        setCashfreeConnected(true);
      }

      if (currentStep === 7) {
        // Create first campaign
        const res = await fetch('/api/v1/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: campaignName,
            targetAudience: targetAudience.toUpperCase().replace(' ', '_'),
            status: 'ACTIVE',
            steps: [
              {
                id: `step_${Date.now()}_1`,
                stepNumber: 1,
                type: 'EMAIL',
                subject: `Solving client pipelines for ${companyName}`,
                bodyTemplate: 'Hi {first_name},\n\nHope this finds you well. I was reviewing your work and wanted to ask: are you currently looking for high-value contracts?\n\nLet me know!\n\nBest,\n' + user.fullName,
                delayDays: 0
              }
            ]
          })
        });
        if (!res.ok) throw new Error('Failed to instantiate outbound sequence.');
        setCampaignLaunched(true);
        setTimeout(() => {
          onComplete({ companyName, industry });
        }, 1200);
        return;
      }

      setCurrentStep(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'An error occurred during onboarding setup.');
    } finally {
      setLoading(false);
    }
  };

  const simulateGmailConnect = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setGmailConnected(true);
      setLoading(false);
    }, 1000);
  };

  const simulateCalendarConnect = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setCalendarConnected(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start py-12 px-6 font-sans text-slate-100">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Title Header */}
      <div className="w-full max-w-4xl text-center mb-10 z-10">
        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 font-mono tracking-wider uppercase">
          Workspace Initializer
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
          Welcome to your SalesPilot AI Agent Team
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
          Complete these 7 fast steps to configure your autonomous B2B sales pipeline.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 mb-8 z-10 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-7 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.number;
            const isCompleted = currentStep > s.number;
            return (
              <div key={s.number} className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30' :
                  isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  'bg-slate-800/50 text-slate-500 border border-slate-800'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-medium mt-2 hidden sm:block ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Container Card */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 z-10 shadow-2xl relative overflow-hidden">
        
        {/* Card Header */}
        <div className="mb-6">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
            Step {currentStep} of 7 • {steps[currentStep-1].desc}
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {steps[currentStep-1].name} Setup
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="min-h-[200px] mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1: ORGANIZATION */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Company / Organization Name</label>
                      <input 
                        type="text" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Marketing"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Industry Segment</label>
                      <select 
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="SaaS & Software">SaaS & Software</option>
                        <option value="Marketing Agency">Marketing Agency</option>
                        <option value="Consulting & Advisory">Consulting & Advisory</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Company Website</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="url" 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://acme.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Operational Timezone</label>
                      <select 
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Currency Billing Preference</label>
                      <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="INR">INR (₹) - Cashfree Enabled</option>
                        <option value="USD">USD ($) - Global</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: GMAIL CONNECTION */}
              {currentStep === 2 && (
                <div className="space-y-5 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 border border-red-500/20 mb-2">
                    <Mail className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-white">Authorize Gmail Outreach Nodes</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                      Connect your corporate G-Suite or personal Gmail securely via OAuth. Gmail handles high-performance automatic sending limit checks.
                    </p>
                  </div>

                  {gmailConnected ? (
                    <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 max-w-sm mx-auto text-emerald-400 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Gmail authorized for <strong>{gmailEmail}</strong></span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={simulateGmailConnect}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-600/15 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Google Mail'}
                    </button>
                  )}
                </div>
              )}

              {/* STEP 3: GOOGLE CALENDAR */}
              {currentStep === 3 && (
                <div className="space-y-5 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-500 border border-blue-500/20 mb-2">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-white">Sync Google Calendar & Meetings</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                      Allows SalesPilot to read active calendar slots, avoid double bookings, and insert Google Meet invites on booked deals dynamically.
                    </p>
                  </div>

                  {calendarConnected ? (
                    <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 max-w-sm mx-auto text-emerald-400 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Google Calendar Linked Successfully</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={simulateCalendarConnect}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/15 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Google Calendar'}
                    </button>
                  )}
                </div>
              )}

              {/* STEP 4: OPENAI API */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Configure OpenAI Service</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Powers highly converting automated outbound scripts, sequence variant suggestions, and custom BANT qualification reviews.
                    </p>
                  </div>

                  <div className="relative">
                    <Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-or-proj-..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 text-[11px] text-slate-400 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p>
                      Your API keys are saved locally in this runtime's secure environment variables and never sent to outside third-party aggregators.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 5: GEMINI API */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Configure Gemini Research Engine</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enables high-frequency company scraping, automated search querying, LinkedIn profiles analysis, and pain points compilation.
                    </p>
                  </div>

                  <div className="relative">
                    <Sparkles className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 text-[11px] text-slate-400 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p>
                      The multi-agent research processor uses Gemini 1.5 Pro or Flash to enrich Leads metrics in the background.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 6: CASHFREE INTEGRATION */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Setup Cashfree INR Payment Gateway</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enables seamless subscription management, license provisioning, automated GST compliant invoicing, and live client checkout in INR.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Cashfree App ID</label>
                      <input 
                        type="text" 
                        value={cashfreeAppId}
                        onChange={(e) => setCashfreeAppId(e.target.value)}
                        placeholder="TEST817293817..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Secret Key</label>
                      <input 
                        type="password" 
                        value={cashfreeSecret}
                        onChange={(e) => setCashfreeSecret(e.target.value)}
                        placeholder="cf_secret_..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Gateway Environment</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="cfEnv" 
                          checked={cashfreeEnv === 'TEST'} 
                          onChange={() => setCashfreeEnv('TEST')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-300 font-mono">Sandbox Test Environment</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="cfEnv" 
                          checked={cashfreeEnv === 'PROD'} 
                          onChange={() => setCashfreeEnv('PROD')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-300 font-mono">Live Production</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: FIRST CAMPAIGN */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white font-sans">Formulate First Cold Campaign</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Your first autonomous outreach campaign will instantiate immediately and start scanning leads match once saved.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Campaign Name</label>
                      <input 
                        type="text" 
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Marketing agencies outbound"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5 font-mono">Target Audience Category</label>
                      <select 
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Marketing Agencies">Marketing Agencies</option>
                        <option value="SaaS Startups">SaaS Startups</option>
                        <option value="E-commerce Brands">E-commerce Brands</option>
                        <option value="B2B Advisors">B2B Advisors</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500 block mb-1">AUTOMATIC COLD OUTBOX SEQUENCING SCHEMA</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      Step 1: Automated customized cold draft via connected Gmail account. Wait interval: 3 days. 
                      Step 2: Deep research trigger. Advanced painpoints enrich via Astra Multi-Agent loops.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-6 mt-6">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || loading}
            className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold disabled:opacity-30 transition-all"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            disabled={loading}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/15 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentStep === 7 ? (
              <>
                Launch Platform
                <Rocket className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
