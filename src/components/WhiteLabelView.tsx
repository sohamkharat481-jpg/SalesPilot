import React, { useState } from 'react';
import { 
  Globe, Upload, Check, RefreshCw, Sliders, Palette, Type, Mail, 
  Smartphone, ShieldCheck, Save, Eye, ArrowUpRight, CloudLightning, Info, Trash2
} from 'lucide-react';

interface WhiteLabelConfig {
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  theme: 'slate' | 'emerald' | 'indigo' | 'midnight' | 'cyberpunk';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'Inter' | 'Space Grotesk' | 'Playfair Display' | 'JetBrains Mono';
  loginWelcome: string;
  loginBgUrl: string;
  dashboardBanner: string;
  emailFooter: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  senderEmail: string;
  customDomain: string;
  domainVerified: boolean;
  sslStatus: 'ACTIVE' | 'PENDING' | 'NONE';
}

export function WhiteLabelView() {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    companyName: 'SalesPilot Enterprise',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    faviconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=32&q=80',
    theme: 'slate',
    primaryColor: '#0f172a',
    secondaryColor: '#1e293b',
    accentColor: '#10b981',
    fontFamily: 'Inter',
    loginWelcome: 'Welcome back to our Enterprise Portal',
    loginBgUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
    dashboardBanner: 'Unlocking Autonomous Pipeline Acceleration',
    emailFooter: '© 2026 SalesPilot System. All rights reserved.',
    smtpHost: 'smtp.mailgun.org',
    smtpPort: 587,
    smtpUser: 'postmaster@mg.yourdomain.com',
    senderEmail: 'notifications@yourdomain.com',
    customDomain: 'crm.horizonmedia.co',
    domainVerified: false,
    sslStatus: 'PENDING'
  });

  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'portal' | 'domain' | 'notifications' | 'mobile'>('branding');
  const [saving, setSaving] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [previewMode, setPreviewMode] = useState<'login' | 'portal' | 'email'>('login');

  const themes = [
    { id: 'slate', name: 'Classic Slate', primary: '#0f172a', accent: '#10b981' },
    { id: 'emerald', name: 'Emerald Horizon', primary: '#064e3b', accent: '#34d399' },
    { id: 'indigo', name: 'Deep Indigo', primary: '#1e1b4b', accent: '#6366f1' },
    { id: 'midnight', name: 'Midnight Violet', primary: '#110c1c', accent: '#a78bfa' },
    { id: 'cyberpunk', name: 'Cyber Neon', primary: '#030712', accent: '#f43f5e' }
  ];

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Enterprise White Label settings saved successfully. DNS tables and CDN configurations will propagate within 15 minutes.');
    }, 1200);
  };

  const handleVerifyDomain = () => {
    setVerifyingDomain(true);
    setTimeout(() => {
      setVerifyingDomain(false);
      setConfig(prev => ({ ...prev, domainVerified: true, sslStatus: 'ACTIVE' }));
    }, 2000);
  };

  return (
    <div id="white-label-dashboard" className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant White-Labeling Active</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">White Label Customization</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Completely customize the application interface, login page, subdomains, transactional emails, and system branding to deliver a fully aligned experience under your corporate identity.
            </p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 font-bold rounded-xl transition flex items-center gap-2 self-start md:self-center cursor-pointer text-sm shadow-lg shadow-emerald-500/20"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving Config...' : 'Apply White Labeling'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Column */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Sub Navigation */}
          <div className="flex border-b border-slate-100 pb-px overflow-x-auto gap-2 scrollbar-none">
            {[
              { id: 'branding', label: 'Theme & Brand', icon: Palette },
              { id: 'portal', label: 'Login & UI', icon: Sliders },
              { id: 'domain', label: 'Custom Domain', icon: Globe },
              { id: 'notifications', label: 'Email Branded SMTP', icon: Mail },
              { id: 'mobile', label: 'Mobile App Bundles', icon: Smartphone }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'border-emerald-500 text-slate-900 bg-slate-50/50' 
                    : 'border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50/20'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeSubTab === tab.id ? 'text-emerald-500' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content 1: Branding */}
          {activeSubTab === 'branding' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Organization Name</label>
                  <input 
                    type="text" 
                    value={config.companyName}
                    onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-sans"
                    placeholder="Enter custom agency/org name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Primary Font Family</label>
                  <select 
                    value={config.fontFamily}
                    onChange={(e) => setConfig({ ...config, fontFamily: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                  >
                    <option value="Inter">Inter (Clean Sans)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech Modern)</option>
                    <option value="Playfair Display">Playfair Display (Elegant Editorial)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Sleek Coding)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Logo URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={config.logoUrl}
                      onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                    />
                    <button className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Favicon URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={config.faviconUrl}
                      onChange={(e) => setConfig({ ...config, faviconUrl: e.target.value })}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                    />
                    <button className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Preset System Theme</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setConfig({ 
                        ...config, 
                        theme: t.id as any,
                        primaryColor: t.primary,
                        accentColor: t.accent
                      })}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        config.theme === t.id 
                          ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' 
                          : 'border-slate-100 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-950">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Hex: {t.primary}</p>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.accent }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Primary Palette</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-600">{config.primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Secondary</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-600">{config.secondaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Accent Highlight</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-600">{config.accentColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Login Welcome and Portal */}
          {activeSubTab === 'portal' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Custom Login Welcome Text</label>
                <input 
                  type="text" 
                  value={config.loginWelcome}
                  onChange={(e) => setConfig({ ...config, loginWelcome: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Login Page Background Image URL</label>
                <input 
                  type="text" 
                  value={config.loginBgUrl}
                  onChange={(e) => setConfig({ ...config, loginBgUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Client Portal Welcome Banner</label>
                <input 
                  type="text" 
                  value={config.dashboardBanner}
                  onChange={(e) => setConfig({ ...config, dashboardBanner: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-900">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold">Enterprise Client Visibility</p>
                  <p className="text-amber-800 text-[11px]">
                    Updating these portal options updates the custom branding variables loaded on the <code>/portal/*</code> endpoints for your sub-tenants, creating a complete firewall from SalesPilot branding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Custom Domains */}
          {activeSubTab === 'domain' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Custom Domain URL</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={config.customDomain}
                      onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                      placeholder="e.g. portal.yourdomain.com"
                    />
                    <button 
                      onClick={handleVerifyDomain}
                      disabled={verifyingDomain}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      {verifyingDomain ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudLightning className="w-3.5 h-3.5" />}
                      Verify DNS
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-950">DNS Target Records (Add these to your Domain Provider)</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    To route your custom domain, register a CNAME and TXT verification key inside your Domain DNS settings (e.g. Cloudflare, GoDaddy, Route53):
                  </p>

                  <div className="space-y-3 font-mono text-[10px]">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">CNAME</span>
                        <span className="ml-2 text-slate-950">crm.horizonmedia.co</span>
                      </div>
                      <div className="text-slate-500">Points to: <strong className="text-slate-900">ssl.salespilot.run.app</strong></div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">TXT</span>
                        <span className="ml-2 text-slate-950">_salespilot-challenge</span>
                      </div>
                      <div className="text-slate-500">Value: <strong className="text-slate-900">sp-ver-774b-ae889a</strong></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <div className="flex gap-2 items-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Let's Encrypt SSL Provisioner</p>
                      <p className="text-[10px] text-slate-500">Active secure endpoint routing status</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded-full ${
                    config.sslStatus === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {config.sslStatus === 'ACTIVE' ? 'SSL ACTIVE (TLS 1.3)' : 'SSL PENDING VERIFICATION'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4: SMTP Settings */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-900">White Label SMTP & Email Gateways</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Connect your organization's transactional mail service to dispatch outbound notifications, magic login links, and campaign follow-ups directly under your customized sender details.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Sender From Email</label>
                  <input 
                    type="text" 
                    value={config.senderEmail}
                    onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                    placeholder="notifications@youragency.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">SMTP Relayer Host</label>
                  <input 
                    type="text" 
                    value={config.smtpHost}
                    onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Port</label>
                  <input 
                    type="number" 
                    value={config.smtpPort}
                    onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">SMTP Username / API Key</label>
                  <input 
                    type="text" 
                    value={config.smtpUser}
                    onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-mono text-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Email Template Footer Message</label>
                <textarea 
                  value={config.emailFooter}
                  onChange={(e) => setConfig({ ...config, emailFooter: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-sans"
                />
              </div>
            </div>
          )}

          {/* Tab Content 5: Custom Mobile App Compilation */}
          {activeSubTab === 'mobile' && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-900">White-Labeled Native Mobile Apps</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                SalesPilot provides autonomous mobile source compilation. We will automatically output a fully customized and branded iOS (<code>.ipa</code>) and Android (<code>.apk</code> / <code>.aab</code>) bundle featuring your company name, custom splash screens, and chosen colors.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">iOS Native Package Bundle</span>
                  <p className="text-xs font-mono font-bold text-slate-900">com.horizonmedia.ios.salespilot</p>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Apple Developer Console Link Connected
                  </div>
                </div>

                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Android Play Store Package</span>
                  <p className="text-xs font-mono font-bold text-slate-900">com.horizonmedia.android.salespilot</p>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Google Play Developer Account Linked
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Trigger OTA App Bundle Update</h4>
                  <p className="text-[10px] text-slate-400">Pushes new logo, favicon, colors & theme values to existing mobile installs.</p>
                </div>
                <button className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Compile & Push OTA
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Live Branded Previews</h3>
              <div className="flex bg-slate-800 p-1 rounded-lg gap-1">
                {[
                  { id: 'login', label: 'Login Screen' },
                  { id: 'portal', label: 'Client App' },
                  { id: 'email', label: 'Branded Mail' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPreviewMode(p.id as any)}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded transition cursor-pointer ${
                      previewMode === p.id 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Display Stage */}
            <div className="border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden aspect-video relative flex flex-col justify-between p-4 font-sans">
              
              {previewMode === 'login' && (
                <div className="absolute inset-0 flex" style={{ fontFamily: config.fontFamily }}>
                  <div className="w-1/2 p-4 flex flex-col justify-between bg-black/80 z-10">
                    <div className="flex items-center gap-2">
                      <img src={config.logoUrl} alt="Logo" className="w-5 h-5 rounded-md object-cover" />
                      <span className="text-[10px] font-bold text-white">{config.companyName}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-white">{config.loginWelcome}</h4>
                      <p className="text-[8px] text-slate-400">Secure entry to tenant workspace accounts.</p>
                      <div className="w-full h-4 bg-slate-800 rounded mt-2" />
                      <div className="w-full h-4 bg-slate-800 rounded" />
                      <div className="w-full h-3 bg-emerald-500 rounded text-slate-950 flex items-center justify-center text-[7px] font-bold mt-1">Authenticate</div>
                    </div>
                    <span className="text-[6px] text-slate-500">Powered by Enterprise Vault</span>
                  </div>
                  <div className="w-1/2 bg-cover bg-center" style={{ backgroundImage: `url(${config.loginBgUrl})` }} />
                </div>
              )}

              {previewMode === 'portal' && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col" style={{ fontFamily: config.fontFamily }}>
                  {/* Top Bar */}
                  <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800" style={{ backgroundColor: config.primaryColor }}>
                    <div className="flex items-center gap-1.5">
                      <img src={config.logoUrl} alt="Logo" className="w-4 h-4 rounded-md object-cover" />
                      <span className="text-[9px] font-bold text-white">{config.companyName}</span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.accentColor }} />
                  </div>
                  {/* Dashboard body */}
                  <div className="p-3 space-y-2 flex-1">
                    <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/50">
                      <h5 className="text-[10px] font-bold text-white">{config.dashboardBanner}</h5>
                      <p className="text-[8px] text-slate-400">Enterprise workspace initialized successfully.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-800 text-center">
                        <span className="text-[6px] text-slate-400 uppercase">Leads Active</span>
                        <p className="text-[10px] font-bold text-white font-mono">1,842</p>
                      </div>
                      <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-800 text-center">
                        <span className="text-[6px] text-slate-400 uppercase">Conversion</span>
                        <p className="text-[10px] font-bold text-emerald-400 font-mono">84.2%</p>
                      </div>
                      <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-800 text-center">
                        <span className="text-[6px] text-slate-400 uppercase">AI SDR Status</span>
                        <p className="text-[10px] font-bold text-emerald-400 font-mono">ACTIVE</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewMode === 'email' && (
                <div className="absolute inset-0 bg-white p-4 flex flex-col justify-between text-slate-900 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <img src={config.logoUrl} alt="Logo" className="w-4 h-4 rounded-md object-cover" />
                      <span className="text-[9px] font-bold text-slate-950">{config.companyName}</span>
                    </div>
                    <span className="text-[7px] text-slate-400 font-mono">July 21, 2026</span>
                  </div>
                  <div className="my-2 space-y-1">
                    <p className="font-bold text-[10px] text-slate-950">Daily AI Enrichment Insights Delivered</p>
                    <p className="text-[8px] text-slate-500 leading-relaxed">
                      Hello Team, your autonomous campaign SDRs have scheduled 3 high-probability appointments with Apex Marketing. Review prospects below:
                    </p>
                    <div className="w-full h-4 bg-slate-50 rounded border border-slate-100" />
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[7px] text-slate-400">
                    <span>{config.emailFooter}</span>
                    <span>Unsubscribe</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Quick DNS Health Widget */}
          <div className="bg-slate-50 border border-slate-150 p-6 rounded-3xl space-y-3">
            <h4 className="text-xs font-bold text-slate-950">SSL & Custom Routing Health</h4>
            <div className="flex gap-2 items-center justify-between text-[11px]">
              <span className="text-slate-500">Domain Verification</span>
              <span className="font-mono text-slate-700">crm.horizonmedia.co</span>
            </div>
            <div className="flex gap-2 items-center justify-between text-[11px]">
              <span className="text-slate-500">Cert Issuer</span>
              <span className="font-mono text-slate-700">Let's Encrypt Authority X3</span>
            </div>
            <div className="flex gap-2 items-center justify-between text-[11px]">
              <span className="text-slate-500">Proxy Router</span>
              <span className="font-mono text-emerald-600 font-bold">Cloud Run Edge CDN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
