import React, { useState, useEffect } from 'react';
import { 
  Database, Globe, Search, RefreshCw, AlertTriangle, Check, Layers, 
  HelpCircle, Sparkles, Send, Briefcase, Flame, CheckCircle2, Award, 
  Clock, DollarSign, BookOpen, Users, Activity, Zap, ArrowRight, Copy, 
  X, CheckCircle, List, History, Play, AlertCircle, Trash2, ChevronRight
} from 'lucide-react';
import { Lead, LeadResearchProfile } from '../types';

export function ResearchEngineDashboard() {
  // Config & state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [providers, setProviders] = useState<Record<string, { enabled: boolean; name: string }>>({});
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESEARCHING' | 'COMPLETED' | 'FAILED'>('ALL');
  
  // Tab within dossier explorer
  type DossierTab = 'company' | 'website' | 'decision-maker' | 'competitors' | 'signals' | 'outreach' | 'history';
  const [activeTab, setActiveTab] = useState<DossierTab>('company');
  
  // History comparison state
  const [viewedHistoryProfile, setViewedHistoryProfile] = useState<LeadResearchProfile | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load data helper
  const fetchData = async (silent = false) => {
    if (!silent) setLoadingLeads(true);
    try {
      // Fetch leads
      const leadsRes = await fetch('/api/v1/leads');
      const leadsData = await leadsRes.json();
      const loadedLeads = leadsData.leads || [];
      setLeads(loadedLeads);
      
      // Update selected lead to have fresh progress/status
      if (selectedLead) {
        const fresh = loadedLeads.find((l: Lead) => l.id === selectedLead.id);
        if (fresh) {
          setSelectedLead(fresh);
          // If viewing historical version, don't auto-reset it unless selected lead completes fresh research
          if (fresh.researchStatus === 'COMPLETED' && !viewedHistoryProfile && fresh.researchProfile) {
            setViewedHistoryProfile(null); // Reset to latest
          }
        }
      } else if (loadedLeads.length > 0 && !selectedLead) {
        setSelectedLead(loadedLeads[0]);
      }

      // Fetch research providers config
      const provRes = await fetch('/api/v1/research/providers');
      const provData = await provRes.json();
      setProviders(provData);

      // Fetch queue
      const qRes = await fetch('/api/v1/research/queue');
      const qData = await qRes.json();
      setQueue(qData.queue || []);

    } catch (err) {
      console.error('Failed to poll AI Research Engine state:', err);
    } finally {
      if (!silent) setLoadingLeads(false);
    }
  };

  // Poll for live queue progress updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 3000); // Poll every 3 seconds for smooth progress updates
    return () => clearInterval(interval);
  }, []);

  // Update provider toggles
  const handleToggleProvider = async (providerId: string) => {
    const updatedProviders = {
      ...providers,
      [providerId]: {
        ...providers[providerId],
        enabled: !providers[providerId].enabled
      }
    };
    setProviders(updatedProviders);

    try {
      await fetch('/api/v1/research/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: updatedProviders })
      });
    } catch (err) {
      console.error('Failed to update provider config on server:', err);
    }
  };

  // Trigger manual regeneration
  const handleRegenerate = async (leadId: string) => {
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/research/regenerate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed to schedule regeneration:', err);
    }
  };

  // Force Retry failed job
  const handleRetry = async (leadId: string) => {
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/research/retry`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed to force retry research job:', err);
    }
  };

  // Copy outreach messages or profiles
  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filters & searches
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && lead.researchStatus === statusFilter;
  });

  const activeProfile = viewedHistoryProfile || selectedLead?.researchProfile;

  return (
    <div className="space-y-6">
      
      {/* 1. TOP STATS BAR & INTEGRATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time queue and engine status */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider">Engine Queue Live</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Active Queue Jobs</span>
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{queue.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Completed Reports</span>
                <span className="text-xs font-bold font-mono text-emerald-600">{leads.filter(l => l.researchStatus === 'COMPLETED').length}</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">Failed / Pending Retries</span>
                <span className="text-xs font-bold font-mono text-rose-500">{leads.filter(l => l.researchStatus === 'FAILED').length}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              💡 <span className="font-semibold">AI Memory Sync Active:</span> Completed business intelligence reports are cached for 24 hours to eliminate duplicate crawler work and stay within API limit quotas.
            </div>
          </div>
        </div>

        {/* Dynamic Plugin toggles panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider">B2B Plugins & Research Sources</h3>
              <p className="text-[10px] text-slate-500">Enable or disable pipeline sources. The AI automatically merges active records.</p>
            </div>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 font-semibold px-2 py-0.5 rounded uppercase">
              15+ Providers Loaded
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(providers).map(([id, item]) => {
              const info = item as { enabled: boolean; name: string };
              // Custom icons or colors based on provider type
              let color = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
              if (id === 'website') color = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
              if (id === 'linkedin') color = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
              if (id === 'google_search' || id === 'google_maps') color = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
              if (id === 'clearbit') color = 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
              if (id === 'future_apis') color = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

              return (
                <button
                  key={id}
                  onClick={() => handleToggleProvider(id)}
                  className={`p-2 rounded-lg border text-left transition relative overflow-hidden flex flex-col justify-between h-14 ${
                    info.enabled 
                      ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-xs' 
                      : 'border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{info.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${info.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  </div>
                  
                  <span className={`text-[8px] font-mono font-semibold px-1.5 py-0.2 rounded-sm border w-fit ${color}`}>
                    {id.toUpperCase().replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. MAIN SPLIT-VIEW COMPONENT */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* LEADS PANEL - 1 COLUMN */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[680px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider">Prospect Directory</h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input 
                type="text" 
                placeholder="Search target leads..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 focus:border-blue-500"
              />
            </div>

            {/* Status Filter buttons */}
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'RESEARCHING', 'COMPLETED', 'FAILED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition ${
                    statusFilter === f 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Leads list block */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
            {loadingLeads ? (
              <div className="p-4 text-center space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500" />
                <p className="text-[10px] text-slate-400">Synchronizing database...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No matching leads found.
              </div>
            ) : (
              filteredLeads.map(lead => {
                const isSelected = selectedLead?.id === lead.id;
                let statusBadge = '';
                if (lead.researchStatus === 'PENDING') statusBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                if (lead.researchStatus === 'RESEARCHING') statusBadge = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
                if (lead.researchStatus === 'COMPLETED') statusBadge = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                if (lead.researchStatus === 'FAILED') statusBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/20';

                return (
                  <button
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setViewedHistoryProfile(null); // Reset history selector
                    }}
                    className={`w-full text-left p-3.5 transition flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-l-2 border-blue-600' 
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {lead.firstName} {lead.lastName}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-sm border ${statusBadge}`}>
                        {lead.researchStatus || 'COMPLETED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 w-full">
                      <span className="truncate max-w-[120px] font-semibold">{lead.company}</span>
                      <span className="font-mono text-[9px]">{lead.enrichment?.industry || 'B2B software'}</span>
                    </div>

                    {/* Progress indicator while generating */}
                    {lead.researchStatus === 'RESEARCHING' && (
                      <div className="w-full mt-1.5 space-y-1">
                        <div className="flex justify-between text-[8px] font-mono text-slate-400">
                          <span className="truncate max-w-[140px] animate-pulse">{lead.researchStatusText}</span>
                          <span className="font-bold">{lead.researchProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${lead.researchProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* INTEL EXPLORER - 3 COLUMNS */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[600px] max-h-[680px]">
          {selectedLead ? (
            <>
              {/* DOSSIER HEADER */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-blue-600 uppercase">Lead Intelligence Dossier</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs text-slate-500 truncate">{selectedLead.email}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {selectedLead.firstName} {selectedLead.lastName}
                    <span className="text-xs font-normal text-slate-500">at</span>
                    <span className="text-blue-600 dark:text-blue-400 underline decoration-dotted">{selectedLead.company}</span>
                  </h2>
                </div>

                {/* Regeneration/Queue manual controls */}
                <div className="flex items-center gap-2">
                  {selectedLead.researchStatus === 'FAILED' ? (
                    <button
                      onClick={() => handleRetry(selectedLead.id)}
                      className="px-3.5 py-1.5 bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <RotateCwIcon className="w-3.5 h-3.5" /> Force Retry Pipeline
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegenerate(selectedLead.id)}
                      disabled={selectedLead.researchStatus === 'RESEARCHING'}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                        selectedLead.researchStatus === 'RESEARCHING'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${selectedLead.researchStatus === 'RESEARCHING' ? 'animate-spin' : ''}`} /> 
                      {selectedLead.researchStatus === 'RESEARCHING' ? 'Researching...' : 'Regenerate Dossier'}
                    </button>
                  )}
                </div>
              </div>

              {/* DOSSIER SUB-NAVIGATION TABS */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 overflow-x-auto bg-white dark:bg-slate-900 scrollbar-none">
                {[
                  { id: 'company', label: 'Company Profile', icon: Layers },
                  { id: 'website', label: 'Website Audit', icon: Globe },
                  { id: 'decision-maker', label: 'Decision Person', icon: Users },
                  { id: 'competitors', label: 'Competition Matrix', icon: Activity },
                  { id: 'signals', label: 'Signals & Pain Points', icon: Zap },
                  { id: 'outreach', label: 'Outreach Playbook', icon: Send },
                  { id: 'history', label: 'Version History', icon: History }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as DossierTab)}
                    className={`py-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === t.id 
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT PANEL */}
              <div className="flex-1 p-5 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20">
                
                {/* 1. LOADING SKELETON STATE */}
                {selectedLead.researchStatus === 'RESEARCHING' && !activeProfile ? (
                  <div className="space-y-5 py-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-full"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-5/6"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-4/5"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse"></div>
                      <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse"></div>
                    </div>
                    
                    <div className="border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 bg-blue-500/5 mt-4">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 flex flex-col">
                          <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest text-[9px] mb-0.5">Real-Time Extraction Log</span>
                          <span className="animate-pulse">Active pipeline: "{selectedLead.researchStatusText}"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : !activeProfile ? (
                  <div className="text-center py-12 space-y-3">
                    <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500">No profile dossier generated yet. Hit Regenerate to schedule background research.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* IF VIEWING HISTORICAL LOG WARNING */}
                    {viewedHistoryProfile && (
                      <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-400 rounded-lg flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" />
                          <span>Viewing historical research version generated on: <span className="font-bold font-mono">{new Date(viewedHistoryProfile.generatedAt).toLocaleString()}</span></span>
                        </span>
                        <button 
                          onClick={() => setViewedHistoryProfile(null)}
                          className="text-[10px] underline font-bold cursor-pointer"
                        >
                          Restore Current Latest
                        </button>
                      </div>
                    )}

                    {/* DYNAMIC DOSSIER VIEWS */}
                    {activeTab === 'company' && (
                      <div className="space-y-6">
                        
                        {/* Summary & Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="md:col-span-2 space-y-4">
                            <div className="space-y-1">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Executive Dossier Summary</span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 text-xs">
                                {activeProfile.companySummary}
                              </p>
                            </div>
                          </div>

                          {/* Quick indicators */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Lead Heat Rating</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">{activeProfile.insightsHotnessScore || 92}</span>
                                <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${activeProfile.insightsHotnessScore || 92}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <div>
                                <span className="block text-[8px] uppercase font-mono text-slate-400">Buying Intent</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeProfile.insightsBuyingIntent || 'HIGH'}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] uppercase font-mono text-slate-400">Urgency</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeProfile.insightsUrgency || 'HIGH'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Complete attributes matrix */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                          <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Corporate Attributes Registry</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">Business Model</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfile.businessModel || 'B2B Services'}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">Business Category</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfile.businessCategory || 'Technology'}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">Corporate Size</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfile.businessSize || '50-100 Employees'}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">Revenue Estimate</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-blue-600">{activeProfile.revenueEstimate || '₹5 Crore INR'}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">Years in Business</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfile.yearsInBusiness || '6 Years'}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">Employee Growth Trend</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{activeProfile.employeeGrowth || 'Steady YoY hiring'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Unique Selling Proposition (USP)</span>
                              <p className="text-slate-700 dark:text-slate-300 italic">"{activeProfile.usp}"</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Vision & Mission</span>
                              <p className="text-slate-700 dark:text-slate-300">{activeProfile.mission || activeProfile.vision}</p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold mb-1.5">Social Profiles</span>
                            <div className="flex flex-wrap gap-2">
                              {(activeProfile.socialPresence || ['LinkedIn Profile Found']).map((s, idx) => (
                                <span key={idx} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-400">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Products & Tech Stacks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                            <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Key Products / Services Offered</h4>
                            <ul className="space-y-1.5">
                              {([...(activeProfile.products || []), ...(activeProfile.services || [])]).map((p, idx) => (
                                <li key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-900">
                                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                            <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Verified Technology Stack Audit</h4>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {(activeProfile.techStack || ['Salesforce', 'Next.js', 'HubSpot']).map((tech, idx) => (
                                <span key={idx} className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {activeTab === 'website' && (
                      <div className="space-y-5">
                        
                        {/* URL Summary */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">Website Telemetry Crawl Audit</h4>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {activeProfile.websiteAnalysis}
                          </p>
                        </div>

                        {/* Keywords & Offers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">SEO & Brand Keywords Extracted</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {(activeProfile.extractedKeywords || ['outbound agency', 'lead enrichment', 'growth']).map((kw, i) => (
                                <span key={i} className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded text-[10px]">
                                  #{kw}
                                </span>
                              ))}
                            </div>

                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider pt-2">Active Offers / Lead Magnets</h5>
                            <ul className="space-y-1">
                              {(activeProfile.extractedOffers || ['Free Strategic Audit Consultation']).map((offer, i) => (
                                <li key={i} className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-slate-700 dark:text-slate-300">
                                  🎁 {offer}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Forms & Lead Captures Located</h5>
                            <ul className="space-y-1">
                              {(activeProfile.extractedForms || ['Get Started Form', 'Contact Us Form']).map((form, i) => (
                                <li key={i} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                                  📝 {form}
                                </li>
                              ))}
                            </ul>

                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider pt-2">Extracted Call-to-Actions (CTAs)</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {(activeProfile.extractedCTAs || ['Schedule Dem', 'Book a Demo']).map((cta, i) => (
                                <span key={i} className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-2.5 py-0.5 rounded font-mono text-[10px]">
                                  "{cta}"
                                </span>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Customer segments targeted on page */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-1.5">
                          <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Audited Customer Segments (on site)</h5>
                          <div className="flex flex-wrap gap-2">
                            {(activeProfile.customerTypes || ['Marketing Directors', 'B2B SaaS Founders']).map((c, i) => (
                              <span key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {activeTab === 'decision-maker' && (
                      <div className="space-y-5">
                        
                        {/* Direct DM Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
                          <div className="w-14 h-14 rounded-full bg-blue-600/10 text-blue-600 border border-blue-500/20 flex items-center justify-center font-bold text-lg font-display">
                            {selectedLead.firstName[0]}{selectedLead.lastName ? selectedLead.lastName[0] : ''}
                          </div>
                          
                          <div className="flex-1 text-center sm:text-left space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{activeProfile.dmName || `${selectedLead.firstName} ${selectedLead.lastName}`}</h4>
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 border border-blue-200 dark:border-blue-800 rounded-md font-mono font-bold uppercase w-fit mx-auto sm:mx-0">
                                Authority: {activeProfile.dmBuyingAuthority || 'HIGH'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{activeProfile.dmRole || selectedLead.title || 'Director'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Department: {activeProfile.dmDepartment || 'Sales & Operations'}</p>
                          </div>

                          {/* Influence score gauge */}
                          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-900 text-center flex flex-col justify-center items-center h-20 w-28">
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Influence Score</span>
                            <span className="text-xl font-black font-mono text-emerald-600">{activeProfile.dmInfluenceScore || 85} / 100</span>
                          </div>
                        </div>

                        {/* Summary & Responsibilities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Persona Background Evaluation</h5>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-900">
                              {activeProfile.decisionMakerSummary}
                            </p>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Core Responsibilities & Scope</h5>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {activeProfile.dmResponsibilities || `${selectedLead.firstName} oversees performance operations, evaluates strategic tools, and drives pipeline health.`}
                            </p>
                            
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider pt-2">Preferred Communication Style</h5>
                            <span className="inline-block bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 p-2 rounded-lg font-semibold w-full">
                              💬 {activeProfile.dmPreferredCommunication || 'Short, value-focused email outlining concrete business cases.'}
                            </span>
                          </div>
                        </div>

                        {/* Goals, interests, role-specific pain points */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Direct Pain Points</h5>
                            <ul className="space-y-1.5">
                              {(activeProfile.dmPainPoints || ['Outbound rep manual logging fatigue']).map((pain, idx) => (
                                <li key={idx} className="text-rose-600 dark:text-rose-400 font-semibold">• {pain}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Likely Performance Goals</h5>
                            <ul className="space-y-1.5">
                              {(activeProfile.dmGoals || ['Increase outbound booking rates by 2.5x']).map((goal, idx) => (
                                <li key={idx} className="text-slate-700 dark:text-slate-300 font-semibold">✓ {goal}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Professional Interests</h5>
                            <ul className="space-y-1.5">
                              {(activeProfile.dmInterests || ['AI-driven lead lists', 'Outbound analytics']).map((interest, idx) => (
                                <li key={idx} className="text-slate-700 dark:text-slate-300">💡 {interest}</li>
                              ))}
                            </ul>
                          </div>

                        </div>

                      </div>
                    )}

                    {activeTab === 'competitors' && (
                      <div className="space-y-5">
                        
                        {/* Competitors summary */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono mb-2">Competitive Landscape Notes</h4>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {activeProfile.competitorNotes}
                          </p>
                        </div>

                        {/* Detailed competitor table */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-x-auto text-xs">
                          <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-3">Audited Competitors & Differentiators</h4>
                          
                          <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400">
                                <th className="pb-2">Competitor Name</th>
                                <th className="pb-2">Market Position</th>
                                <th className="pb-2">Target Strengths</th>
                                <th className="pb-2">Target Weaknesses</th>
                                <th className="pb-2">Our Opportunity</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                              {(activeProfile.detailedCompetitors || [
                                { name: 'LegacyOutreach Corp', marketPosition: 'Market Leader', differentiation: 'Bespoke custom profile extracts', strengths: 'Large bulk database', weaknesses: 'High rate of stale contacts, manual log exhaustion', potentialOpportunity: 'Compete on data verify accuracy and automated multi-channel.' }
                              ]).map((comp, idx) => (
                                <tr key={idx} className="text-slate-700 dark:text-slate-300">
                                  <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{comp.name}</td>
                                  <td className="py-2.5 font-semibold text-blue-600 dark:text-blue-400">{comp.marketPosition}</td>
                                  <td className="py-2.5 max-w-[140px] truncate" title={comp.strengths}>{comp.strengths}</td>
                                  <td className="py-2.5 max-w-[140px] truncate" title={comp.weaknesses}>{comp.weaknesses}</td>
                                  <td className="py-2.5 max-w-[140px] truncate font-semibold text-emerald-600" title={comp.potentialOpportunity}>{comp.potentialOpportunity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    )}

                    {activeTab === 'signals' && (
                      <div className="space-y-5">
                        
                        {/* Interactive Pain point checklist with severity indicator */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">Business Pain Point Analysis</h4>
                            <p className="text-[10px] text-slate-500">Predicted organizational hurdles mapped to SalesPilot solutions.</p>
                          </div>

                          <div className="space-y-3">
                            {(activeProfile.predictedProblems || [
                              { problem: 'Manual Sales', severity: 'HIGH', reasoning: 'High representative burnout rates scanning LinkedIn profile directories manually and copying email addresses.' },
                              { problem: 'Poor Automation', severity: 'MEDIUM', reasoning: 'Inconsistent multi-touch follow-ups, decreasing email campaign response rate.' },
                              { problem: 'No AI', severity: 'HIGH', reasoning: 'No custom-tailored background context cards generated before scheduling or pitching.' }
                            ]).map((prob, i) => {
                              let tagColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50';
                              if (prob.severity === 'HIGH') tagColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50';
                              if (prob.severity === 'LOW') tagColor = 'bg-slate-100 text-slate-800 dark:bg-slate-950/40 dark:text-slate-400 border-slate-200/50';

                              return (
                                <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-start gap-3 text-xs">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold uppercase ${tagColor}`}>
                                    {prob.severity}
                                  </span>
                                  <div className="space-y-1">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{prob.problem}</span>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{prob.reasoning}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Buying signals list */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-3">
                          <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Detected Outbound Outcrop Buying Signals</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeProfile.buyingSignals.map((sig, i) => (
                              <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg flex gap-2.5 items-start">
                                <span className="text-amber-500 font-bold text-base mt-0.5">⚡</span>
                                <span className="text-slate-700 dark:text-slate-300 font-semibold">{sig}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {activeTab === 'outreach' && (
                      <div className="space-y-5">
                        
                        {/* Blueprint header */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-[8px] font-mono uppercase text-slate-400">Target Product Fit</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{activeProfile.salesOppRecommendedProduct || 'SalesPilot Scale Suite'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-mono uppercase text-slate-400">Budget Range</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono text-emerald-600">{activeProfile.salesOppBudgetRange || '₹35,000 INR per month'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-mono uppercase text-slate-400">Timeline / Priority</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{activeProfile.salesOppTimeline || 'Immediate'} / {activeProfile.salesOppPriorityLevel || 'HIGH'}</span>
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-1.5">
                          <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Opportunity Rationale</h5>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {activeProfile.salesOppWhyBuy}
                          </p>
                        </div>

                        {/* Personalized outreach first message script */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-3">
                          <div className="flex items-center justify-between w-full">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Bespoke First-Touch Outreach Script</h5>
                            
                            <button
                              onClick={() => triggerCopy(activeProfile.strategyFirstMessage || '', 'first_message')}
                              className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" /> 
                              {copiedText === 'first_message' ? 'Copied!' : 'Copy Script'}
                            </button>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200/60 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                            {activeProfile.strategyFirstMessage}
                          </div>
                        </div>

                        {/* Objections predictions and handling scripts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Expected Outreach Objections</h5>
                            <ul className="space-y-2">
                              {(activeProfile.strategyExpectedObjections || activeProfile.objectionPredictions || ['Concern over implementation complexity']).map((obj, i) => (
                                <li key={i} className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                  <span className="text-rose-500 font-bold font-mono">?</span>
                                  <span>{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                            <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Tactical Handling Scripts</h5>
                            <ul className="space-y-2">
                              {(activeProfile.strategyObjectionHandling || ['Demonstrate our 1-click automatic synchronizations']).map((h, i) => (
                                <li key={i} className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                  <span className="text-emerald-500 font-bold font-mono">✓</span>
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>

                        {/* Multi-step follow up timeline sequence */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-3">
                          <h5 className="font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Suggested Multi-Touch Follow-up Sequence</h5>
                          <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-4 ml-2">
                            {(activeProfile.strategyFollowUpSequence || ['LinkedIn connect', 'Value pitch follow-up']).map((step, idx) => (
                              <div key={idx} className="relative">
                                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Touchpoint #{idx + 1}</span>
                                <p className="text-slate-600 dark:text-slate-400">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {activeTab === 'history' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">Historical Report Timeline</h4>
                            <p className="text-[10px] text-slate-500">Track and compare previous audit profiles for {selectedLead.firstName}.</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-mono px-2 py-0.5 rounded border">
                            {selectedLead.researchHistory?.length || 1} Version(s) Stored
                          </span>
                        </div>

                        <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-4 ml-2 text-xs">
                          {/* Display the active latest one */}
                          <div className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10"></span>
                            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  Version 1.0 (Current Latest)
                                  <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 rounded border border-emerald-500/20 uppercase font-mono font-bold">Active</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                  Generated at: {selectedLead.researchProfile ? new Date(selectedLead.researchProfile.generatedAt).toLocaleString() : 'Freshly compiled'}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => setViewedHistoryProfile(null)}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                Currently Displayed
                              </button>
                            </div>
                          </div>

                          {/* Historical records */}
                          {selectedLead.researchHistory && selectedLead.researchHistory.slice(1).map((hist, idx) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                              <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-slate-100">Version 0.{selectedLead.researchHistory!.length - 1 - idx}</span>
                                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                    Generated at: {new Date(hist.generatedAt).toLocaleString()}
                                  </span>
                                </div>
                                
                                <button
                                  onClick={() => setViewedHistoryProfile(hist)}
                                  className={`text-[10px] font-bold px-3 py-1 rounded border transition ${
                                    viewedHistoryProfile?.generatedAt === hist.generatedAt
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {viewedHistoryProfile?.generatedAt === hist.generatedAt ? 'Viewing Version' : 'Compare Profile'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    )}

                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 p-8 text-slate-400">
              <Database className="w-10 h-10 text-slate-300 animate-bounce" />
              <p className="text-sm">Select a target prospect from the list to explore corporate intelligence.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// Inline fallback for mini icon if not loaded properly
function RotateCwIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
