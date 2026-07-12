import React, { useState } from 'react';
import { Activity, ShieldAlert, Zap, Layers, RefreshCw, Users, Folder, MessageSquare, Database, Globe, Calendar, CheckCircle2 } from 'lucide-react';
import { WorkspaceUser } from '../../types';

interface UsageSectionProps {
  user: WorkspaceUser | null;
}

export function UsageSection({ user }: UsageSectionProps) {
  const currentTier = user?.tier || 'STARTER';
  const [simulationBlocked, setSimulationBlocked] = useState(false);
  const [customLimitsSim, setCustomLimitsSim] = useState<Record<string, number>>({});

  // 10 requested metrics across all plans
  const planLimits: Record<string, Record<string, { limit: number | string; label: string; icon: any; unit: string }>> = {
    STARTER: {
      searches: { limit: 1000, label: 'Lead Searches', icon: Zap, unit: 'searches' },
      ai_requests: { limit: 500, label: 'AI Requests', icon: MessageSquare, unit: 'requests' },
      ai_tokens: { limit: 250000, label: 'AI Tokens', icon: RefreshCw, unit: 'tokens' },
      emails_sent: { limit: 500, label: 'AI Emails Sent', icon: Activity, unit: 'emails' },
      meetings: { limit: 10, label: 'Meetings Booked', icon: Calendar, unit: 'slots' },
      campaigns: { limit: 3, label: 'Campaign Sequences', icon: Layers, unit: 'campaigns' },
      organizations: { limit: 1, label: 'Connected Orgs', icon: Folder, unit: 'org' },
      users: { limit: 1, label: 'Team User Seats', icon: Users, unit: 'seats' },
      storage: { limit: 1000, label: 'Cloud Storage', icon: Database, unit: 'MB' },
      api_requests: { limit: 5000, label: 'Public API Calls', icon: Globe, unit: 'requests' },
    },
    GROWTH: {
      searches: { limit: 10000, label: 'Lead Searches', icon: Zap, unit: 'searches' },
      ai_requests: { limit: 5000, label: 'AI Requests', icon: MessageSquare, unit: 'requests' },
      ai_tokens: { limit: 1000000, label: 'AI Tokens', icon: RefreshCw, unit: 'tokens' },
      emails_sent: { limit: 5000, label: 'AI Emails Sent', icon: Activity, unit: 'emails' },
      meetings: { limit: 50, label: 'Meetings Booked', icon: Calendar, unit: 'slots' },
      campaigns: { limit: 10, label: 'Campaign Sequences', icon: Layers, unit: 'campaigns' },
      organizations: { limit: 3, label: 'Connected Orgs', icon: Folder, unit: 'orgs' },
      users: { limit: 5, label: 'Team User Seats', icon: Users, unit: 'seats' },
      storage: { limit: 5000, label: 'Cloud Storage', icon: Database, unit: 'MB' },
      api_requests: { limit: 50000, label: 'Public API Calls', icon: Globe, unit: 'requests' },
    },
    PROFESSIONAL: {
      searches: { limit: 50000, label: 'Lead Searches', icon: Zap, unit: 'searches' },
      ai_requests: { limit: 'Unlimited', label: 'AI Requests', icon: MessageSquare, unit: 'requests' },
      ai_tokens: { limit: 'Unlimited', label: 'AI Tokens', icon: RefreshCw, unit: 'tokens' },
      emails_sent: { limit: 'Unlimited', label: 'AI Emails Sent', icon: Activity, unit: 'emails' },
      meetings: { limit: 'Unlimited', label: 'Meetings Booked', icon: Calendar, unit: 'slots' },
      campaigns: { limit: 'Unlimited', label: 'Campaign Sequences', icon: Layers, unit: 'campaigns' },
      organizations: { limit: 'Unlimited', label: 'Connected Orgs', icon: Folder, unit: 'orgs' },
      users: { limit: 20, label: 'Team User Seats', icon: Users, unit: 'seats' },
      storage: { limit: 20000, label: 'Cloud Storage', icon: Database, unit: 'MB' },
      api_requests: { limit: 250000, label: 'Public API Calls', icon: Globe, unit: 'requests' },
    },
    ENTERPRISE: {
      searches: { limit: 'Unlimited', label: 'Lead Searches', icon: Zap, unit: 'searches' },
      ai_requests: { limit: 'Unlimited', label: 'AI Requests', icon: MessageSquare, unit: 'requests' },
      ai_tokens: { limit: 'Unlimited', label: 'AI Tokens', icon: RefreshCw, unit: 'tokens' },
      emails_sent: { limit: 'Unlimited', label: 'AI Emails Sent', icon: Activity, unit: 'emails' },
      meetings: { limit: 'Unlimited', label: 'Meetings Booked', icon: Calendar, unit: 'slots' },
      campaigns: { limit: 'Unlimited', label: 'Campaign Sequences', icon: Layers, unit: 'campaigns' },
      organizations: { limit: 'Unlimited', label: 'Connected Orgs', icon: Folder, unit: 'orgs' },
      users: { limit: 'Unlimited', label: 'Team User Seats', icon: Users, unit: 'seats' },
      storage: { limit: 'Unlimited', label: 'Cloud Storage', icon: Database, unit: 'MB' },
      api_requests: { limit: 'Unlimited', label: 'Public API Calls', icon: Globe, unit: 'requests' },
    }
  };

  // Static usage mapping representing current real consumption
  const staticUsage: Record<string, number> = {
    searches: 840,
    ai_requests: 485,
    ai_tokens: 195000,
    emails_sent: 445,
    meetings: 9,
    campaigns: 3, // Hitting the limit on Starter!
    organizations: 1,
    users: 1,
    storage: 720,
    api_requests: 4100,
  };

  const getLimitObj = (key: string) => {
    const limits = planLimits[currentTier] || planLimits.STARTER;
    return limits[key] || { limit: 100, label: key, icon: Zap, unit: '' };
  };

  const getUsed = (key: string) => {
    if (customLimitsSim[key] !== undefined) {
      return customLimitsSim[key];
    }
    return staticUsage[key] || 0;
  };

  const getPercentage = (key: string) => {
    const used = getUsed(key);
    const { limit } = getLimitObj(key);
    if (typeof limit === 'string') return 100; // Unlimited is safe, show filled bar as fully available
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getPercentageForProgress = (key: string) => {
    const used = getUsed(key);
    const { limit } = getLimitObj(key);
    if (typeof limit === 'string') return 10; // For visual progress bar on Unlimited, just show low filled percentage
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getProgressColor = (pct: number, limitVal: string | number) => {
    if (typeof limitVal === 'string') return 'bg-indigo-500';
    if (pct >= 100) return 'bg-rose-500 animate-pulse';
    if (pct >= 85) return 'bg-amber-500';
    return 'bg-indigo-600';
  };

  const triggerExceedSimulation = (key: string) => {
    const { limit } = getLimitObj(key);
    if (typeof limit === 'number') {
      // Set value to exceed limit
      setCustomLimitsSim(prev => ({
        ...prev,
        [key]: limit + 1
      }));
      setSimulationBlocked(true);
    }
  };

  const resetSimulation = () => {
    setCustomLimitsSim({});
    setSimulationBlocked(false);
  };

  const metricsKeys = ['searches', 'ai_requests', 'ai_tokens', 'emails_sent', 'meetings', 'campaigns', 'organizations', 'users', 'storage', 'api_requests'];

  // Check if any of the key limits are currently exceeded
  const exceededItems = metricsKeys.filter(key => {
    const used = getUsed(key);
    const { limit } = getLimitObj(key);
    return typeof limit === 'number' && used >= limit;
  });

  return (
    <div id="usage_metrics_hub" className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">REAL-TIME USAGE & LIMIT MANAGEMENT</h3>
          <p className="text-xs text-slate-500 mt-1">Live execution tracking of 10 primary workspace resource bounds.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={resetSimulation}
            className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 rounded font-mono font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reset Limits
          </button>
        </div>
      </div>

      {/* Block Alert Banner if any is exceeded */}
      {exceededItems.length > 0 && (
        <div id="quota_exceeded_blocking_alert" className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse">
          <div className="flex gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <span className="font-bold block uppercase tracking-wider font-mono">QUOTA BINDING EXCEEDED — WRITES LOCKED</span>
              <p className="leading-relaxed mt-0.5">
                You have reached your absolute limit on: <strong className="font-mono text-rose-600 dark:text-rose-400">{exceededItems.map(k => getLimitObj(k).label).join(', ')}</strong>. Outbound dispatch queues have been locked to protect compliance rules.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('plans_section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shrink-0 cursor-pointer transition shadow-xs font-mono uppercase tracking-wider"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* 10-Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metricsKeys.map((key) => {
          const { label, icon: Icon, unit, limit } = getLimitObj(key);
          const used = getUsed(key);
          const pct = getPercentage(key);
          const pctVisual = getPercentageForProgress(key);
          const isUnlimited = typeof limit === 'string';
          const isNearMax = !isUnlimited && pct >= 85;
          const isOverLimit = !isUnlimited && used >= (limit as number);

          return (
            <div 
              key={key} 
              id={`usage_card_${key}`}
              className={`p-4 bg-white dark:bg-slate-900 border rounded-xl flex flex-col justify-between transition gap-3 shadow-xs ${
                isOverLimit 
                  ? 'border-rose-350 dark:border-rose-900 bg-rose-500/5' 
                  : isNearMax 
                  ? 'border-amber-300 dark:border-amber-900 bg-amber-500/5' 
                  : 'border-slate-200 dark:border-slate-850 hover:border-slate-250'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${isOverLimit ? 'text-rose-500' : isNearMax ? 'text-amber-500' : 'text-indigo-500'}`} />
                  {label}
                </span>
                
                {!isUnlimited && !isOverLimit && (
                  <button 
                    onClick={() => triggerExceedSimulation(key)}
                    className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
                  >
                    Simulate Block
                  </button>
                )}
                {isOverLimit && (
                  <span className="text-[9.5px] px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 rounded-md font-bold font-mono uppercase">
                    Blocked
                  </span>
                )}
                {isUnlimited && (
                  <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-md font-bold font-mono uppercase">
                    Unlimited
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-slate-950 dark:text-white font-mono">
                    {used.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    / {isUnlimited ? '∞' : (limit as number).toLocaleString()} {unit}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct, limit)}`} 
                    style={{ width: `${pctVisual}%` }} 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-450 font-mono">
                <span>
                  {isUnlimited ? (
                    <span>Fully available in {currentTier}</span>
                  ) : isOverLimit ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Exceeded by {used - (limit as number)} {unit}</span>
                  ) : (
                    <span>Remaining: <strong>{((limit as number) - used).toLocaleString()}</strong></span>
                  )}
                </span>
                <span className="font-semibold">{isUnlimited ? '100% active' : `${pct}% consumed`}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan comparison and Upgrade prompt */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-500 block">TIER UPGRADE RECOMMENDATION</span>
          <p className="text-xs text-slate-600 dark:text-slate-350">
            Starter Pilot tier supports 1 Organization & 3 Campaigns. <strong className="text-slate-900 dark:text-white">Growth Professional</strong> unlocks 3 Organizations, 10 campaign pipelines, and 10,000 lead searches.
          </p>
        </div>
        <button
          onClick={() => {
            const el = document.getElementById('plans_section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition shadow-xs"
        >
          Compare Plans
        </button>
      </div>

    </div>
  );
}
