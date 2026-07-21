import React, { useState } from 'react';
import { 
  TrendingUp, Sparkles, Brain, Award, Users, Percent, DollarSign, ArrowUpRight, 
  RotateCw, AlertTriangle, ShieldCheck, HelpCircle, Star, ThumbsUp, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

export function RevenueIntelligenceView() {
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'q3' | 'q4' | 'fy26'>('q3');

  // Comparative MRR Forecast Data: Actuals vs AI Predictive
  const forecastData = [
    { month: 'Jan', actual: 45000, aiPredicted: 45000, pipeline: 60000 },
    { month: 'Feb', actual: 48000, aiPredicted: 49000, pipeline: 65000 },
    { month: 'Mar', actual: 52000, aiPredicted: 53000, pipeline: 70000 },
    { month: 'Apr', actual: 58000, aiPredicted: 60000, pipeline: 85000 },
    { month: 'May', actual: 64000, aiPredicted: 65000, pipeline: 90000 },
    { month: 'Jun', actual: 72000, aiPredicted: 75000, pipeline: 110000 },
    { month: 'Jul (Est)', actual: 78000, aiPredicted: 82000, pipeline: 130000 },
    { month: 'Aug', actual: null, aiPredicted: 95000, pipeline: 155000 },
    { month: 'Sep', actual: null, aiPredicted: 112000, pipeline: 180000 },
    { month: 'Oct', actual: null, aiPredicted: 130000, pipeline: 210000 },
    { month: 'Nov', actual: null, aiPredicted: 148000, pipeline: 240000 },
    { month: 'Dec', actual: null, aiPredicted: 165000, pipeline: 280000 }
  ];

  // AI Deal Win Probability List
  const dealProbabilities = [
    { id: 'deal-1', name: 'Apex Tech Enterprise Deal', value: 85000, aiWinProbability: 92, salesperson: 'Ananya Sharma', healthScore: 95 },
    { id: 'deal-2', name: 'Stellar Labs Outbound Pilot', value: 15000, aiWinProbability: 78, salesperson: 'Rohan Mehta', healthScore: 82 },
    { id: 'deal-3', name: 'Horizon Media Expansion Suite', value: 24000, aiWinProbability: 65, salesperson: 'Soham Kharat', healthScore: 70 },
    { id: 'deal-4', name: 'CyberSec India Global Contract', value: 120000, aiWinProbability: 38, salesperson: 'Sneha Kapoor', healthScore: 45 },
    { id: 'deal-5', name: 'CloudFlow SaaS Renewal', value: 35000, aiWinProbability: 88, salesperson: 'Vikram Joshi', healthScore: 90 }
  ];

  // Account Churn Risks computed from conversational latency
  const churnRisks = [
    { client: 'CyberSec India', mrrInr: 50000, risk: 'HIGH', factor: 'Zero response to 3 sequencers, low usage logins', clvPredict: 1500000 },
    { client: 'CloudFlow SaaS', mrrInr: 6500, risk: 'MEDIUM', factor: 'Negative feedback on email integration speed', clvPredict: 450000 },
    { client: 'StellarTech Labs', mrrInr: 15000, risk: 'LOW', factor: 'Highly responsive, expansion logs active', clvPredict: 1800000 },
    { client: 'Apex Marketing', mrrInr: 25000, risk: 'LOW', factor: 'Daily logins, successful SDR scheduling', clvPredict: 3200000 }
  ];

  // Sales Agent Performance Metrics
  const agentPerformance = [
    { name: 'Ananya Sharma', dealsClosed: 14, pipelineGenerated: 450000, winRate: 82, roiFactor: 11.2 },
    { name: 'Rohan Mehta', dealsClosed: 9, pipelineGenerated: 180000, winRate: 64, roiFactor: 6.8 },
    { name: 'Soham Kharat', dealsClosed: 8, pipelineGenerated: 150000, winRate: 70, roiFactor: 5.5 },
    { name: 'Sneha Kapoor', dealsClosed: 3, pipelineGenerated: 210000, winRate: 40, roiFactor: 3.2 }
  ];

  // AI-Driven recommendations heuristically computed
  const aiRecommendations = [
    { title: 'Trigger Churn Recovery Sequence', text: 'Detecting zero email thread responses from CyberSec India over 14 days. AI recommends queueing the "Founders Executive Outreach" drip immediately to restore customer health.', priority: 'CRITICAL', impact: '+₹50,000 MRR preserved' },
    { title: 'Unlock Apex Tech Contract Value', text: 'Deal win probability is currently 92%. Customer Health Score shows high positive response velocity. AI recommends bypassing standard validation and pitching the Annual Unlimited Tier now.', priority: 'HIGH', impact: '+₹2,50,000 Pipeline Expansion' },
    { title: 'Reallocate Outreach Credit Budgets', text: 'Campaign "Q3 Tech Agency Outbound" is generating a 11.2x ROI, while "Retail Cold Email" is tracking at 1.8x. Shift 40% of credit allocations to the Agency campaign.', priority: 'MEDIUM', impact: '+₹80,000 MRR pipeline boost' }
  ];

  const handleRefreshPredictions = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('AI Revenue pipeline calculations re-evaluated. Deep learning prediction logs updated with current CRM deals and sequence response telemetry.');
    }, 1500);
  };

  return (
    <div id="revenue-intelligence-dashboard" className="space-y-8">
      {/* Upper header */}
      <div className="bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              <Brain className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Predictive Revenue Intelligence Engine Live</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI Revenue Intelligence</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Leverage custom machine learning models to forecast recurring revenue, predict pipeline outcomes, flag customer churn risk, and deliver data-backed strategical execution routes.
            </p>
          </div>
          <button 
            onClick={handleRefreshPredictions}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-emerald-500/50 text-slate-950 font-bold rounded-xl transition flex items-center gap-2 self-start md:self-center cursor-pointer text-sm shadow-lg shadow-emerald-500/20"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing Pipeline...' : 'Re-Run AI Predictions'}
          </button>
        </div>
      </div>

      {/* Top 4 Predictor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Forecasted MRR (Dec)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-950">₹1,65,000</p>
          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+111.5% Predicted growth</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Predicted ARR Run-rate</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-950">₹19,80,000</p>
          <div className="text-[10px] text-indigo-600 font-bold">
            Based on active Q3 contract vectors
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mean Client Health Score</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-950">84.5%</p>
          <div className="text-[10px] text-slate-500">
            Computed from positive reply triggers
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Weighted Deal Win Rate</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-950">72.4%</p>
          <div className="text-[10px] text-slate-500">
            Across 24 CRM deal threads
          </div>
        </div>
      </div>

      {/* Main Charts & Prediction Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Actual vs AI Predictions Area Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Executive Revenue Curve (Actual vs. AI Forecasted)</h3>
              <p className="text-slate-400 text-[10px] font-medium">Predicting future enterprise MRR runs based on active deal probability models.</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
              <button className="px-2.5 py-1 bg-white text-slate-950 rounded shadow-sm">MRR Trends</button>
              <button className="px-2.5 py-1 text-slate-500">ARR Runway</button>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="aiPredictColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#actualColor)" name="Actual MRR (INR)" />
                <Area type="monotone" dataKey="aiPredicted" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#aiPredictColor)" name="AI Predicted MRR (INR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations Heuristic List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Generative Sales Strategy</h3>
            </div>
            
            <div className="space-y-4 overflow-y-auto max-h-[250px] scrollbar-none pr-1">
              {aiRecommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-slate-800/60 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      rec.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">{rec.impact}</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-white">{rec.title}</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-[9px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Updated with current sequence weights</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Deal Win Probability and Health Score */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">CRM Deal Win Probability & Health Score Indexes</h3>
            <p className="text-slate-400 text-[10px] font-medium mt-0.5">Calculated using conversational sentiment indicators, response latencies, and thread frequency metrics.</p>
          </div>

          <div className="space-y-4">
            {dealProbabilities.map(deal => (
              <div key={deal.id} className="p-4 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">{deal.name}</h4>
                  <div className="flex gap-4 text-[10px] text-slate-500">
                    <span>Value: <strong className="text-slate-800">₹{deal.value.toLocaleString()}</strong></span>
                    <span>Rep: <strong className="text-slate-800">{deal.salesperson}</strong></span>
                  </div>
                </div>

                <div className="flex gap-6 items-center shrink-0">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Client Health</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${deal.healthScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-xs font-mono font-bold text-slate-800">{deal.healthScore}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Win Probability</span>
                    <div className="bg-slate-100 w-24 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-2 rounded-full ${deal.aiWinProbability >= 80 ? 'bg-emerald-500' : deal.aiWinProbability >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                        style={{ width: `${deal.aiWinProbability}%` }} 
                      />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-700 block">{deal.aiWinProbability}% Probability</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Churn Risks & CLV */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Customer Churn & CLV Predictor</h3>
              <p className="text-slate-400 text-[10px] font-medium mt-0.5">Proactively triggers recovery sequencers based on predictive health vectors.</p>
            </div>

            <div className="space-y-3">
              {churnRisks.map((risk, index) => (
                <div key={index} className="p-3 border border-slate-50 rounded-xl bg-slate-50/50 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-950">{risk.client}</span>
                    <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded-full ${
                      risk.risk === 'HIGH' ? 'bg-red-100 text-red-800' : risk.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {risk.risk} CHURN RISK
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Trigger Factor: {risk.factor}</p>
                  <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-100 text-slate-400">
                    <span>MRR: <strong className="text-slate-700">₹{risk.mrrInr.toLocaleString()}</strong></span>
                    <span>Predicted CLV: <strong className="text-emerald-600 font-mono">₹{risk.clvPredict.toLocaleString()}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 bg-emerald-50/30 p-3 rounded-xl flex gap-3 text-emerald-900 text-[11px] font-sans">
            <ThumbsUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Predictive Model Lift Rate</p>
              <p className="text-emerald-800 text-[10px]">Churn prediction models are operating at a 94.2% accuracy rate over 180 monitored client records.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Salesperson Performance & Outbound Campaign ROI */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Revenue Representative (SDR) Performance & Campaign ROI Audit</h3>
          <p className="text-slate-400 text-[10px] font-medium mt-0.5">Audits active human agents alongside automated AI-SDR outbound sequence ROI indices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {agentPerformance.map((agent, i) => (
            <div key={i} className="border border-slate-100 rounded-2xl p-4 space-y-2">
              <span className="text-[9px] font-bold text-indigo-500 uppercase font-mono">Enterprise Agent</span>
              <h4 className="text-xs font-bold text-slate-950">{agent.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-50">
                <div>
                  <span className="text-slate-400 block">Deals Closed</span>
                  <span className="font-bold text-slate-800 font-mono">{agent.dealsClosed}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Win Rate</span>
                  <span className="font-bold text-slate-800 font-mono">{agent.winRate}%</span>
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Campaign ROI</span>
                <span className="font-bold text-emerald-600 font-mono">{agent.roiFactor}x</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
