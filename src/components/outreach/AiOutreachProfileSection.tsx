import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Building2, Target, CheckCircle2, AlertCircle, 
  Save, RefreshCw, Layers, MessageSquare, Briefcase, Zap, 
  ShieldCheck, HelpCircle, ArrowRight
} from 'lucide-react';
import { AiOutreachProfile } from '../../types';
import { getDefaultAiOutreachProfile } from '../../services/outreachProfileService';
import { useAuth } from '../../authentication/AuthContext';

interface AiOutreachProfileSectionProps {
  onProfileUpdated?: (profile: AiOutreachProfile) => void;
}

export function AiOutreachProfileSection({ onProfileUpdated }: AiOutreachProfileSectionProps = {}) {
  const { user, organization } = useAuth();
  const [profile, setProfile] = useState<AiOutreachProfile>(
    getDefaultAiOutreachProfile(organization?.id || user?.organizationId || '', organization?.name || user?.companyName)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Raw string helper states for arrays
  const [industriesStr, setIndustriesStr] = useState('');
  const [rolesStr, setRolesStr] = useState('');
  const [painPointsStr, setPainPointsStr] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('salespilot_token') || localStorage.getItem('salespilot_session_token');
        const orgId = organization?.id || user?.organizationId;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (orgId) headers['x-organization-id'] = orgId;

        const res = await fetch('/api/v1/outreach/profile', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.profile) {
            setProfile(data.profile);
            setIndustriesStr(Array.isArray(data.profile.targetIndustries) ? data.profile.targetIndustries.join(', ') : '');
            setRolesStr(Array.isArray(data.profile.targetRoles) ? data.profile.targetRoles.join(', ') : '');
            setPainPointsStr(Array.isArray(data.profile.painPoints) ? data.profile.painPoints.join(', ') : '');
          }
        }
      } catch (err: any) {
        console.error('Failed to load AI outreach profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [organization?.id, user?.organizationId]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    const parseList = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

    const updated: AiOutreachProfile = {
      ...profile,
      organizationId: organization?.id || user?.organizationId || profile.organizationId,
      targetIndustries: parseList(industriesStr),
      targetRoles: parseList(rolesStr),
      painPoints: parseList(painPointsStr)
    };

    try {
      const token = localStorage.getItem('salespilot_token') || localStorage.getItem('salespilot_session_token');
      const orgId = organization?.id || user?.organizationId;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (orgId) headers['x-organization-id'] = orgId;

      const res = await fetch('/api/v1/outreach/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updated)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      setProfile(data.profile);
      setSaveSuccess(true);
      if (onProfileUpdated) onProfileUpdated(data.profile);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving AI outreach profile');
    } finally {
      setSaving(false);
    }
  };

  const isComplete = Boolean(
    profile.businessName?.trim() && 
    (profile.businessDescription?.trim() || profile.valueProposition?.trim()) &&
    profile.productsServices?.trim()
  );

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-mono">Loading your AI Outreach Business Context...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-850">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                AI Outreach Profile & Business Context
              </h3>
              {isComplete ? (
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold rounded-full border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Configured
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold rounded-full border border-amber-200 dark:border-amber-900/50 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Incomplete
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounds Gemini AI with your company's real value proposition, products, target ICP, and copywriting rules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save AI Business Context'}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          AI Outreach Business Profile saved successfully! Future outbound drafts will use this context.
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          {errorMessage}
        </div>
      )}

      {!isComplete && (
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Complete your Business Profile:</strong> Provide your company name, services, and value proposition so the AI writer creates tailored messaging instead of generic placeholders.
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Business Identity & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Business / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Growth Technologies"
              value={profile.businessName}
              onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Products & Services Offered <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. B2B Sales Automation Platform, Pipeline Consulting"
              value={profile.productsServices}
              onChange={(e) => setProfile({ ...profile, productsServices: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Business Description & Core Activities
          </label>
          <textarea
            rows={2}
            placeholder="Brief description of what your company does and who you serve..."
            value={profile.businessDescription}
            onChange={(e) => setProfile({ ...profile, businessDescription: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />
        </div>

        {/* Section 2: Value Proposition, Differentiators & Offer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Value Proposition
            </label>
            <textarea
              rows={2}
              placeholder="e.g. We help mid-market SaaS companies generate 3x qualified meetings with zero cold email manual effort."
              value={profile.valueProposition}
              onChange={(e) => setProfile({ ...profile, valueProposition: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Key Differentiators
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Native Indian GST invoicing, 99% inbox placement with Google Workspace APIs."
              value={profile.keyDifferentiators}
              onChange={(e) => setProfile({ ...profile, keyDifferentiators: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Specific Value Offer / Incentive
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Free 15-minute pipeline audit with customized outbound teardown."
              value={profile.offer}
              onChange={(e) => setProfile({ ...profile, offer: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Section 3: Target Audience & ICP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Target Customer Profile (ICP)
            </label>
            <input
              type="text"
              placeholder="e.g. Fast-growing B2B Tech Startups & Agencies with 10-200 employees"
              value={profile.targetIcp}
              onChange={(e) => setProfile({ ...profile, targetIcp: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Target Industries <span className="text-[10px] text-slate-400 font-normal">(Comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. SaaS, IT Services, Digital Marketing, FinTech, Logistics"
              value={industriesStr}
              onChange={(e) => setIndustriesStr(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Target Job Titles / Roles <span className="text-[10px] text-slate-400 font-normal">(Comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Founder, CEO, VP Sales, Head of Growth, Marketing Director"
              value={rolesStr}
              onChange={(e) => setRolesStr(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Customer Pain Points Solved <span className="text-[10px] text-slate-400 font-normal">(Comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Low email reply rates, High lead acquisition cost, Repetitive follow-ups"
              value={painPointsStr}
              onChange={(e) => setPainPointsStr(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section 4: Tone of Voice & Copywriting Directives */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Preferred Call to Action (CTA)
            </label>
            <input
              type="text"
              placeholder="e.g. Open to a quick 5-minute introductory call this Thursday?"
              value={profile.preferredCta}
              onChange={(e) => setProfile({ ...profile, preferredCta: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Brand Voice & Tone
            </label>
            <select
              value={profile.toneOfVoice}
              onChange={(e) => setProfile({ ...profile, toneOfVoice: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Professional, consultative and value-focused">Professional & Consultative</option>
              <option value="Direct, concise, and ROI-driven">Direct, Concise & ROI-Driven</option>
              <option value="Friendly, conversational, and peer-to-peer">Friendly & Peer-to-Peer</option>
              <option value="Casual and low-pressure">Casual & Low-Pressure</option>
              <option value="Authoritative and technical thought leader">Authoritative & Technical</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Custom Rules & Copywriting Instructions for AI
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Keep all emails under 75 words. Never use buzzwords like 'synergy' or 'revolutionary'. Always ask a single soft question at the end."
            value={profile.additionalInstructions}
            onChange={(e) => setProfile({ ...profile, additionalInstructions: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save AI Business Context'}
          </button>
        </div>
      </form>
    </div>
  );
}
