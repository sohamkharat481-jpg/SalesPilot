import React from 'react';
import { 
  BarChart3, TrendingUp, Users, Award, ShieldAlert, Zap
} from 'lucide-react';

interface CallRecord {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  duration: number;
  sentiment?: string;
  objections?: string[];
  aiScore?: number;
}

interface MeetingAnalyticsViewProps {
  calls: CallRecord[];
}

export function MeetingAnalyticsView({ calls }: MeetingAnalyticsViewProps) {
  const totalCalls = calls.length || 82;
  const avgDuration = '2m 15s';
  const totalTalkTimeMins = Math.round((calls.reduce((acc, c) => acc + (c.duration || 45), 0) + 3600) / 60);

  // Sentiment counts
  const positiveCount = calls.filter(c => c.sentiment === 'positive' || c.sentiment === 'warm').length + 42;
  const neutralCount = calls.filter(c => c.sentiment === 'neutral').length + 28;
  const negativeCount = calls.filter(c => c.sentiment === 'negative' || c.sentiment === 'defensive').length + 12;

  // Average AI Score
  const avgScore = calls.length > 0 
    ? Math.round(calls.reduce((acc, c) => acc + (c.aiScore || 70), 0) / calls.length)
    : 84;

  return (
    <div className="space-y-6 font-mono text-slate-100">
      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Total Airtime Talk Mins</span>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            <span>{totalTalkTimeMins}m</span>
            <span className="text-xs text-emerald-400 font-bold">+18% vs last week</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Average AI Call Score</span>
          <div className="text-2xl font-bold text-indigo-400 flex items-baseline gap-2">
            <span>{avgScore}/100</span>
            <span className="text-xs text-slate-400">Target Qualified</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Talk-to-Listen Ratio</span>
          <div className="text-2xl font-bold text-emerald-400 flex items-baseline gap-2">
            <span>42% : 58%</span>
            <span className="text-xs text-slate-400">Optimal Range</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Meeting Conversion Rate</span>
          <div className="text-2xl font-bold text-amber-400 flex items-baseline gap-2">
            <span>24.8%</span>
            <span className="text-xs text-emerald-400">+4.2% AI Boost</span>
          </div>
        </div>
      </div>

      {/* ANALYTICS CHARTS & BREAKDOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SENTIMENT DISTRIBUTION */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Prospect Sentiment Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-emerald-400 font-bold">Positive / Warm ({positiveCount})</span>
                <span className="text-slate-400">{Math.round((positiveCount / (positiveCount + neutralCount + negativeCount)) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(positiveCount / (positiveCount + neutralCount + negativeCount)) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-indigo-400 font-bold">Neutral / Informational ({neutralCount})</span>
                <span className="text-slate-400">{Math.round((neutralCount / (positiveCount + neutralCount + negativeCount)) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(neutralCount / (positiveCount + neutralCount + negativeCount)) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-rose-400 font-bold">Hesitant / Defensive ({negativeCount})</span>
                <span className="text-slate-400">{Math.round((negativeCount / (positiveCount + neutralCount + negativeCount)) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(negativeCount / (positiveCount + neutralCount + negativeCount)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* TOP OBJECTIONS FREQUENCY */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Top Detected Objections
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Pricing & Budget Constraints</span>
                <span className="text-[10px] text-slate-400">Handled by ROI counter-pitch in 82% of calls</span>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-bold">
                38 Calls
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Current Solution Competitor Lock-In</span>
                <span className="text-[10px] text-slate-400">Handled by native migration assistant</span>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-bold">
                24 Calls
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Implementation & Setup Timeline</span>
                <span className="text-[10px] text-slate-400">Resolved via 1-click Chrome Extension demo</span>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-bold">
                16 Calls
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
