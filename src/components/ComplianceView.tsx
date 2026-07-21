import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, Activity, HelpCircle, Save, Download, 
  Trash2, RefreshCw, Search, Sliders, AlertTriangle, Eye, ArrowUpRight, Info
} from 'lucide-react';

interface ActivityLog {
  id: string;
  actor: string;
  role: string;
  action: string;
  category: 'AUTH' | 'CRM' | 'BILLING' | 'AI' | 'SYSTEM' | 'WHITE_LABEL';
  ipAddress: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARN' | 'FAILED';
}

export function ComplianceView() {
  const [subTab, setSubTab] = useState<'policy' | 'cookie' | 'audit' | 'retention' | 'export'>('policy');
  const [privacyVersion, setPrivacyVersion] = useState('2.4.0');
  const [termsVersion, setTermsVersion] = useState('1.8.2');
  const [privacyContent, setPrivacyContent] = useState('## Privacy Policy\n\nSalesPilot is committed to protecting PII and customer data under GDPR, HIPAA, and CCPA regulations. We utilize zero-knowledge tenant isolation, secure TLS 1.3 tunnels, and AES-256 Bit storage-layer encryption.');
  const [termsContent, setTermsContent] = useState('## Terms & Conditions of Service\n\nBy accessing SalesPilot platform and connected API channels, you agree to comply with our acceptable resource thresholds, fair-use AI SDR credit quotas, and strict anti-spam SMTP sending policies.');
  const [savingLegal, setSavingLegal] = useState(false);
  const [searchAudit, setSearchAudit] = useState('');
  
  // Dynamic Data Retention states
  const [leadRetentionDays, setLeadRetentionDays] = useState(730);
  const [voiceRetentionDays, setVoiceRetentionDays] = useState(30);
  const [authLogsRetentionDays, setAuthLogsRetentionDays] = useState(365);

  const [cookieSettings, setCookieSettings] = useState({
    essential: true,
    functional: true,
    analytics: false,
    advertising: false
  });

  const [logs, setLogs] = useState<ActivityLog[]>([
    { id: 'log-1', actor: 'Soham Kharat', role: 'Owner', action: 'Modified custom SMTP relayer details', category: 'WHITE_LABEL', ipAddress: '184.22.90.10', timestamp: '2026-07-21 03:22:10', status: 'SUCCESS' },
    { id: 'log-2', actor: 'Ananya Sharma', role: 'Sales Admin', action: 'Bulk exported 4,812 prospects via CSV', category: 'CRM', ipAddress: '184.22.90.12', timestamp: '2026-07-21 02:44:05', status: 'WARN' },
    { id: 'log-3', actor: 'API Token Horizon', role: 'Integration API', action: 'Triggered Gemini Lead Enrichment endpoint', category: 'AI', ipAddress: '34.85.122.90', timestamp: '2026-07-21 02:15:18', status: 'SUCCESS' },
    { id: 'log-4', actor: 'Rohan Mehta', role: 'Support Agent', action: 'Modified organization billing subscription', category: 'BILLING', ipAddress: '203.44.150.18', timestamp: '2026-07-20 18:04:12', status: 'SUCCESS' },
    { id: 'log-5', actor: 'Sneha Kapoor', role: 'Sales rep', action: 'Failed login attempt (Invalid MFA token)', category: 'AUTH', ipAddress: '109.84.2.110', timestamp: '2026-07-20 14:10:02', status: 'FAILED' }
  ]);

  const handleSaveLegal = () => {
    setSavingLegal(true);
    setTimeout(() => {
      setSavingLegal(false);
      alert('Privacy & Terms legal updates successfully committed to IPFS. Domain CDN caches refreshed.');
    }, 1200);
  };

  const handleExportLegals = (format: 'json' | 'pdf' | 'csv') => {
    alert(`Assembling secure cryptographical bundle of your workspace's Activity Logs in ${format.toUpperCase()} format. This payload is signed with your private tenant RSA-4096 key.`);
  };

  const filteredLogs = logs.filter(log => {
    const term = searchAudit.toLowerCase();
    return log.actor.toLowerCase().includes(term) || 
           log.action.toLowerCase().includes(term) ||
           log.category.toLowerCase().includes(term) ||
           log.ipAddress.includes(term);
  });

  return (
    <div id="compliance-center-dashboard" className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sovereign Data Protection Active</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance & Data Center</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Fulfill PII governance specifications, edit global service terms, manage user tracking consent systems, define cold-storage database retention limits, and inspect immutable audit trails.
            </p>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold font-mono text-slate-200">GDPR / CCPA SECURED</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Nav Bar */}
        <div className="lg:col-span-3 flex flex-col gap-1.5">
          {[
            { id: 'policy', label: 'Privacy & Terms Editor', icon: FileText },
            { id: 'cookie', label: 'Cookie Consent Manager', icon: Sliders },
            { id: 'audit', label: 'Immutable Audit Center', icon: Activity },
            { id: 'retention', label: 'Data Retention Policies', icon: ShieldCheck },
            { id: 'export', label: 'Legal Data Portability', icon: Download }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border text-left transition duration-200 cursor-pointer ${
                subTab === tab.id 
                  ? 'border-emerald-500 bg-white text-slate-950 shadow-sm' 
                  : 'border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <tab.icon className={`w-4 h-4 shrink-0 ${subTab === tab.id ? 'text-emerald-500' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content Stages */}
        <div className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[450px]">
          
          {/* Sub Tab 1: Privacy and Terms Editor */}
          {subTab === 'policy' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Legal Disclosures & Policy Management</h3>
                  <p className="text-slate-400 text-[10px] font-medium">Update privacy disclosures linked on custom branded client-portal footers.</p>
                </div>
                <button 
                  onClick={handleSaveLegal}
                  disabled={savingLegal}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {savingLegal ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingLegal ? 'Publishing...' : 'Commit Disclosures'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">Privacy Policy (Markdown)</label>
                    <span className="font-mono text-slate-400">Ver: {privacyVersion}</span>
                  </div>
                  <textarea 
                    value={privacyContent}
                    onChange={(e) => setPrivacyContent(e.target.value)}
                    rows={8}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">Terms of Service (Markdown)</label>
                    <span className="font-mono text-slate-400">Ver: {termsVersion}</span>
                  </div>
                  <textarea 
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                    rows={8}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-150 p-4 rounded-xl flex gap-3 text-amber-950 text-xs leading-relaxed">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Cryptographic Policy Version Control</p>
                  <p className="text-amber-800 text-[11px]">
                    Sub-tenants are prompted with an overlay to re-verify acceptance of terms whenever major versions are bumped. Versioning protects platform liability across regulatory audits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab 2: Cookie Consent */}
          {subTab === 'cookie' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Branded Cookie Consent Settings</h3>
                <p className="text-slate-400 text-xs mt-0.5">Customize categories allowed inside lead sequences, scripts, and campaign landing links.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-950">Essential Core Storage</p>
                    <p className="text-[10px] text-slate-400">Secure tokens, CSRF payloads, local session bindings.</p>
                  </div>
                  <input type="checkbox" checked disabled className="w-4 h-4 rounded text-slate-300" />
                </div>

                <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-950">Functional Customization Preferences</p>
                    <p className="text-[10px] text-slate-400">Saves white label color presets, layout states, and column widths.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={cookieSettings.functional} 
                    onChange={(e) => setCookieSettings({ ...cookieSettings, functional: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 border-slate-300" 
                  />
                </div>

                <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-950">Performance & Analytics Trackers</p>
                    <p className="text-[10px] text-slate-400">Uses tracking pixels inside sent campaign emails to flag positive replies and clicks.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={cookieSettings.analytics} 
                    onChange={(e) => setCookieSettings({ ...cookieSettings, analytics: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 border-slate-300" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab 3: Immutable Activity Audit Logs */}
          {subTab === 'audit' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Immutable Compliance Logs</h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">Tamper-proof storage of read/write metrics across organization variables.</p>
                </div>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    value={searchAudit}
                    onChange={(e) => setSearchAudit(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-[11px] text-slate-600">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3">Actor & Role</th>
                      <th className="p-3">Action Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-950">{log.actor}</div>
                          <div className="text-[9px] text-slate-400">{log.role}</div>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{log.action}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold">
                            {log.category}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{log.ipAddress}</td>
                        <td className="p-3 text-slate-500 font-medium">{log.timestamp}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${
                            log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : log.status === 'WARN' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab 4: Dynamic Retention Policies */}
          {subTab === 'retention' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Database & PII Retention Schedules</h3>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Configure automatic purging thresholds to comply with sovereign right-to-be-forgotten laws.</p>
              </div>

              <div className="space-y-6 text-xs text-slate-800">
                <div className="space-y-2 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <p className="font-bold">Lead Prospect Profile Lifecycle (Days)</p>
                    <span className="font-mono font-bold text-slate-700 bg-white border border-slate-150 px-2 py-0.5 rounded">{leadRetentionDays} Days</span>
                  </div>
                  <input 
                    type="range" 
                    min={30} 
                    max={1000} 
                    value={leadRetentionDays} 
                    onChange={(e) => setLeadRetentionDays(parseInt(e.target.value))}
                    className="w-full accent-emerald-500" 
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">Stale prospect records with zero thread responses over this duration are hard-deleted automatically.</p>
                </div>

                <div className="space-y-2 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <p className="font-bold">AI Call Capture Transcripts (Days)</p>
                    <span className="font-mono font-bold text-slate-700 bg-white border border-slate-150 px-2 py-0.5 rounded">{voiceRetentionDays} Days</span>
                  </div>
                  <input 
                    type="range" 
                    min={7} 
                    max={180} 
                    value={voiceRetentionDays} 
                    onChange={(e) => setVoiceRetentionDays(parseInt(e.target.value))}
                    className="w-full accent-emerald-500" 
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">Permanently scrub audio recording WAV buffers and text transcription outputs after validation.</p>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab 5: Legal Data Portability */}
          {subTab === 'export' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Export Secure Tenant Portability Bundles</h3>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Satisfies GDPR Article 20 requirements allowing tenants to request complete copies of their stored parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleExportLegals('json')}
                  className="p-5 rounded-2xl border border-slate-150 bg-white hover:border-slate-300 text-left space-y-2 cursor-pointer transition"
                >
                  <span className="text-[9px] font-bold text-indigo-500 uppercase font-mono">Format JSON</span>
                  <h4 className="text-xs font-bold text-slate-950">Normalized Schema Payload</h4>
                  <p className="text-[10px] text-slate-400">Contains raw leads, sequences, configuration rules, and CRM deals.</p>
                </button>

                <button 
                  onClick={() => handleExportLegals('csv')}
                  className="p-5 rounded-2xl border border-slate-150 bg-white hover:border-slate-300 text-left space-y-2 cursor-pointer transition"
                >
                  <span className="text-[9px] font-bold text-indigo-500 uppercase font-mono">Format CSV</span>
                  <h4 className="text-xs font-bold text-slate-950">Sales Prospect Databases</h4>
                  <p className="text-[10px] text-slate-400">Export comma-separated files designed for immediate loading to CRM competitors.</p>
                </button>

                <button 
                  onClick={() => handleExportLegals('pdf')}
                  className="p-5 rounded-2xl border border-slate-150 bg-white hover:border-slate-300 text-left space-y-2 cursor-pointer transition"
                >
                  <span className="text-[9px] font-bold text-indigo-500 uppercase font-mono">Format PDF</span>
                  <h4 className="text-xs font-bold text-slate-950">Signed Security Certifications</h4>
                  <p className="text-[10px] text-slate-400">PDF signature summaries of your active SSL configurations and audit statuses.</p>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
