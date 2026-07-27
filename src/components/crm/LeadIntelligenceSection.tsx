import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Loader2, Building2, TrendingUp, Cpu, Users, 
  DollarSign, Target, Zap, Globe, Share2, Award, CheckCircle2, Flame, 
  HelpCircle, ShieldCheck, Clock, MessageSquare, ChevronRight
} from 'lucide-react';
import { Lead } from '../../types';
import { LeadIntelligence } from '../../types/lead-intelligence';
import { LeadIntelligenceService } from '../../ai/lead-intelligence-service';

interface LeadIntelligenceSectionProps {
  lead: Lead;
  onUpdateLead?: (updatedLead: Lead) => void;
}

export function LeadIntelligenceSection({ lead, onUpdateLead }: LeadIntelligenceSectionProps) {
  const [intelligence, setIntelligence] = useState<LeadIntelligence | null>(lead.intelligence || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If intelligence isn't attached yet, analyze on mount
    if (!intelligence || intelligence.leadId !== lead.id) {
      loadIntelligence(false);
    }
  }, [lead.id]);

  const loadIntelligence = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const intel = await LeadIntelligenceService.analyzeLeadIntelligence(lead, forceRefresh);
      setIntelligence(intel);
      if (onUpdateLead) {
        onUpdateLead({ ...lead, intelligence: intel });
      }
    } catch (err: any) {
      console.error('Lead Intelligence Error:', err);
      setError('Failed to load Lead Intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const getIcpBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (score >= 70) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
  };

  return (
    <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5 animate-fade-in">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase font-mono tracking-wide">
              <Sparkles className="w-4 h-4 text-purple-500" /> AI Lead Intelligence
            </h3>
            {intelligence && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getIcpBadgeColor(intelligence.icpMatchScore)}`}>
                {intelligence.icpMatchScore}/100 ICP Match
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Automated company research, tech stack discovery, intent signals & outreach playbook.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {intelligence && (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
              <Clock className="w-3 h-3 text-slate-400" />
              {intelligence.isCached ? 'Cached Result' : 'Real-Time AI'}
            </span>
          )}

          <button
            onClick={() => loadIntelligence(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                <span>Refresh Intelligence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SKELETON LOADING STATE */}
      {loading && !intelligence && (
        <div className="p-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-xs font-mono text-slate-500">Scanning tech stack, hiring signals & buying intent for {lead.company}...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => loadIntelligence(true)} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* CONTENT GRID */}
      {intelligence && (
        <div className="space-y-4 text-xs">
          {/* AI Company Summary Banner */}
          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider block">
              Company AI Summary
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {intelligence.companySummary}
            </p>
          </div>

          {/* Grid 2x2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Company Profile & Financial Metrics */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono text-[11px] uppercase">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" /> Company Profile & Scale
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Firmographics</span>
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Industry:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{intelligence.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Headcount Size:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{intelligence.companySize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Revenue:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{intelligence.estimatedRevenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Funding Stage:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{intelligence.funding}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Tech Stack & Digital Presence */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono text-[11px] uppercase">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Detected Tech Stack
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Stack Profiler</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {intelligence.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold"
                  >
                    ⚡ {tech}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>{intelligence.websiteQuality}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                  <Share2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{intelligence.socialPresence}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Hiring & Growth Signals */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono text-[11px] uppercase">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Hiring & Growth Signals
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Growth Triggers</span>
              </div>

              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                💼 {intelligence.hiringActivity}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Detected Expansion Indicators:</span>
                <ul className="space-y-1">
                  {intelligence.growthSignals.map((sig, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card 4: Buying Intent & Decision Authority */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono text-[11px] uppercase">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Buying Intent & Decision Authority
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Intent Score</span>
              </div>

              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
                🎯 {intelligence.decisionMakerLikelihood}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Intent Signals Identified:</span>
                <ul className="space-y-1">
                  {intelligence.buyingIntentIndicators.map((ind, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Card 5: Recommended Outreach Playbook */}
          <div className="p-4 bg-gradient-to-r from-blue-900/20 via-slate-900 to-slate-900 border border-blue-800/40 rounded-xl space-y-3 text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="font-bold text-blue-300 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <Target className="w-3.5 h-3.5 text-blue-400" /> Recommended AI Outreach Strategy
              </h4>
              <span className="text-[10px] font-mono text-blue-400 font-bold">
                Confidence: {intelligence.confidenceScore}%
              </span>
            </div>

            <p className="text-slate-200 leading-relaxed font-sans text-xs">
              {intelligence.recommendedOutreachStrategy}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[10px]">
              <div className="p-2 bg-slate-800/60 rounded-lg space-y-0.5">
                <span className="text-slate-400 uppercase">Best Channel</span>
                <div className="font-bold text-blue-300 truncate">{intelligence.bestChannel}</div>
              </div>

              <div className="p-2 bg-slate-800/60 rounded-lg space-y-0.5">
                <span className="text-slate-400 uppercase">Optimal Timing</span>
                <div className="font-bold text-purple-300 truncate">{intelligence.bestTiming}</div>
              </div>

              <div className="p-2 bg-slate-800/60 rounded-lg space-y-0.5">
                <span className="text-slate-400 uppercase">Top Competitors</span>
                <div className="font-bold text-emerald-300 truncate">
                  {intelligence.competitors.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
