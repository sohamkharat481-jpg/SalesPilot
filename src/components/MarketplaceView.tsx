import React, { useState } from 'react';
import { 
  Layers, Bot, Sliders, Mail, FileText, Settings, Play, Pause, Trash2, 
  Upload, Star, Sparkles, Check, ChevronRight, PlusCircle, Search, Info, RefreshCw
} from 'lucide-react';

interface MarketplaceApp {
  id: string;
  name: string;
  publisher: string;
  description: string;
  category: 'agents' | 'extensions' | 'workflows' | 'emails' | 'widgets' | 'integrations';
  rating: number;
  downloads: number;
  version: string;
  latestVersion: string;
  status: 'NOT_INSTALLED' | 'INSTALLED' | 'DISABLED' | 'UPDATE_AVAILABLE';
  icon: any;
}

export function MarketplaceView() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'agents' | 'extensions' | 'workflows' | 'emails' | 'widgets' | 'integrations'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // New Extension submission form states
  const [newAppName, setNewAppName] = useState('');
  const [newAppCategory, setNewAppCategory] = useState<MarketplaceApp['category']>('agents');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppVersion, setNewAppVersion] = useState('1.0.0');

  const [apps, setApps] = useState<MarketplaceApp[]>([
    { id: 'app-1', name: 'HubSpot Sync Engine', publisher: 'SalesPilot Labs', description: 'Two-way contacts and timeline sync to port lead status changes in real-time.', category: 'integrations', rating: 4.8, downloads: 1420, version: '2.4.1', latestVersion: '2.4.2', status: 'UPDATE_AVAILABLE', icon: Settings },
    { id: 'app-2', name: 'Zodiac Auto-Responder', publisher: 'StellarTech Devs', description: 'AI Agent that reads lead local times and responds during prime click-rate hours.', category: 'agents', rating: 4.9, downloads: 840, version: '1.2.0', latestVersion: '1.2.0', status: 'INSTALLED', icon: Bot },
    { id: 'app-3', name: 'E-commerce Checkout Trigger', publisher: 'Cashfree Corp', description: 'Auto-generates custom invoice links when deal status updates to "Invoice Needed" in CRM.', category: 'workflows', rating: 4.7, downloads: 2100, version: '1.0.5', latestVersion: '1.0.5', status: 'INSTALLED', icon: Sliders },
    { id: 'app-4', name: 'SaaS SaaS Outbound Pack', publisher: 'GrowthHacks Ltd', description: 'Curated set of 12 email templates optimized for founders pitching enterprise IT leaders.', category: 'emails', rating: 4.5, downloads: 350, version: '1.0.0', latestVersion: '1.0.0', status: 'NOT_INSTALLED', icon: Mail },
    { id: 'app-5', name: 'Executive MRR Predictor Widget', publisher: 'RevenueAI', description: 'A customized, embeddable dashboard visualizer showing forecast runtimes directly on your main portal.', category: 'widgets', rating: 4.9, downloads: 980, version: '1.1.0', latestVersion: '1.1.0', status: 'INSTALLED', icon: Layers },
    { id: 'app-6', name: 'Apollo.io Lead Enricher', publisher: 'SalesPilot Labs', description: 'Auto-queries the Apollo databases using lead domain attributes during onboarding checks.', category: 'extensions', rating: 4.6, downloads: 3100, version: '3.0.0', latestVersion: '3.0.0', status: 'DISABLED', icon: Sparkles },
    { id: 'app-7', name: 'Vesper Agent Plus', publisher: 'DeepMind Dev', description: 'Advanced conversational agent wrapper allowing manual voice-cloning overrides.', category: 'agents', rating: 5.0, downloads: 490, version: '1.4.2', latestVersion: '1.4.2', status: 'NOT_INSTALLED', icon: Bot }
  ]);

  const handleAction = (id: string, action: 'install' | 'uninstall' | 'disable' | 'enable' | 'update') => {
    setApps(prev => prev.map(app => {
      if (app.id !== id) return app;
      
      switch (action) {
        case 'install':
          return { ...app, status: 'INSTALLED' };
        case 'uninstall':
          return { ...app, status: 'NOT_INSTALLED' };
        case 'disable':
          return { ...app, status: 'DISABLED' };
        case 'enable':
          return { ...app, status: 'INSTALLED' };
        case 'update':
          return { ...app, status: 'INSTALLED', version: app.latestVersion };
        default:
          return app;
      }
    }));
  };

  const handlePublishApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppDesc) {
      alert('Please complete all developer portal parameters.');
      return;
    }
    setPublishing(true);
    setTimeout(() => {
      const newApp: MarketplaceApp = {
        id: `app-${Date.now()}`,
        name: newAppName,
        publisher: 'Tenant Custom Developer',
        description: newAppDesc,
        category: newAppCategory,
        rating: 5.0,
        downloads: 1,
        version: newAppVersion,
        latestVersion: newAppVersion,
        status: 'INSTALLED',
        icon: newAppCategory === 'agents' ? Bot : newAppCategory === 'workflows' ? Sliders : Settings
      };
      setApps(prev => [newApp, ...prev]);
      setPublishing(false);
      setShowPublishModal(false);
      setNewAppName('');
      setNewAppDesc('');
      alert('Congratulations! Your app has been published to the SalesPilot Marketplace and is immediately enabled in your Workspace.');
    }, 1200);
  };

  const filteredApps = apps.filter(app => {
    const matchesCategory = activeCategory === 'all' || app.category === activeCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.publisher.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="marketplace-dashboard" className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-mono">
              <Layers className="w-3.5 h-3.5" />
              <span>SalesPilot Integrated Extensions Engine Active</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">App & Extension Marketplace</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Expand the capabilities of your SalesPilot instance. Install community-contributed AI agents, pre-packaged automation templates, widgets, and secure integrations, or publish your own custom wrappers.
            </p>
          </div>
          <button 
            onClick={() => setShowPublishModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-2 self-start md:self-center cursor-pointer text-sm shadow-lg shadow-indigo-500/20"
          >
            <Upload className="w-4 h-4" />
            Publish Extension
          </button>
        </div>
      </div>

      {/* Main Categories & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-px">
          {[
            { id: 'all', label: 'All Extensions' },
            { id: 'agents', label: 'AI Agents' },
            { id: 'extensions', label: 'CRM Extensions' },
            { id: 'workflows', label: 'Workflow Blueprints' },
            { id: 'emails', label: 'Email Templates' },
            { id: 'widgets', label: 'Portal Widgets' },
            { id: 'integrations', label: 'Integrations' }
          ].map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer ${
                activeCategory === category.id 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search Marketplace..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-slate-950 text-slate-900"
          />
        </div>
      </div>

      {/* Apps Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map(app => (
          <div key={app.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <app.icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-950">{app.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">By {app.publisher}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 text-[9px] font-bold font-mono rounded-full uppercase">
                    v{app.version}
                  </span>
                  <div className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{app.rating}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">
                {app.description}
              </p>
            </div>

            {/* Bottom Actions and downloads */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                {app.downloads.toLocaleString()} active installs
              </span>

              {/* State Machine Action Button */}
              <div className="flex items-center gap-1.5">
                {app.status === 'NOT_INSTALLED' && (
                  <button 
                    onClick={() => handleAction(app.id, 'install')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer text-[10px]"
                  >
                    Install Extension
                  </button>
                )}

                {app.status === 'INSTALLED' && (
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-600 font-bold text-[10px] mr-2 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                    <button 
                      onClick={() => handleAction(app.id, 'disable')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer text-[10px]"
                    >
                      Disable
                    </button>
                    <button 
                      onClick={() => handleAction(app.id, 'uninstall')}
                      className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                      title="Uninstall app"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {app.status === 'DISABLED' && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold text-[10px] mr-2">Disabled</span>
                    <button 
                      onClick={() => handleAction(app.id, 'enable')}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition cursor-pointer text-[10px]"
                    >
                      Enable
                    </button>
                    <button 
                      onClick={() => handleAction(app.id, 'uninstall')}
                      className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {app.status === 'UPDATE_AVAILABLE' && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleAction(app.id, 'update')}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition cursor-pointer text-[10px] flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      Update (v{app.latestVersion})
                    </button>
                    <button 
                      onClick={() => handleAction(app.id, 'disable')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer text-[10px]"
                    >
                      Disable
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Developer publish Drawer / Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-950">Publish Custom Extension</h3>
              </div>
              <button 
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-slate-950 font-bold cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishApp} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Extension Name</label>
                <input 
                  type="text" 
                  value={newAppName} 
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. Stripe Sync Bridge" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Category</label>
                  <select 
                    value={newAppCategory}
                    onChange={(e) => setNewAppCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  >
                    <option value="agents">AI Agent</option>
                    <option value="extensions">CRM Extension</option>
                    <option value="workflows">Workflow Template</option>
                    <option value="emails">Email Template</option>
                    <option value="widgets">Portal Widget</option>
                    <option value="integrations">Integration</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Version</label>
                  <input 
                    type="text" 
                    value={newAppVersion}
                    onChange={(e) => setNewAppVersion(e.target.value)}
                    placeholder="1.0.0" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Developer Description</label>
                <textarea 
                  rows={3}
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  placeholder="Describe what resources, webhooks, or schemas this app maps into SalesPilot Workspace..." 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  required
                />
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex gap-2 text-indigo-950">
                <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                  Tenant extensions undergo immediate, sandbox static analysis before publishing. Sandbox security parameters prohibit outbound sockets not configured in OAuth allowlists.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={publishing}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  {publishing ? 'Analyzing...' : 'Publish to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
