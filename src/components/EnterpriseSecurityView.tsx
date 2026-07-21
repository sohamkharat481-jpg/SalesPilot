import React, { useState } from 'react';
import { 
  Lock, Shield, Key, Users, Globe, Activity, CheckCircle, 
  AlertTriangle, RefreshCw, Smartphone, Trash2, ShieldCheck, Download, Ban, Info
} from 'lucide-react';

interface EnrolledDevice {
  id: string;
  user: string;
  role: string;
  device: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  status: 'SECURE' | 'SUSPICIOUS' | 'REVOKED';
}

interface SecurityPolicy {
  ssoEnabled: boolean;
  mfaRequired: boolean;
  passkeysActive: boolean;
  scimProvisioning: boolean;
  sessionTimeoutMinutes: number;
  ipAllowlist: string;
  gdprBannerActive: boolean;
  retentionDays: number;
}

export function EnterpriseSecurityView() {
  const [activeTab, setActiveTab] = useState<'sso' | 'policies' | 'devices' | 'compliance' | 'audit'>('sso');
  const [saving, setSaving] = useState(false);
  
  const [policy, setPolicy] = useState<SecurityPolicy>({
    ssoEnabled: true,
    mfaRequired: true,
    passkeysActive: false,
    scimProvisioning: true,
    sessionTimeoutMinutes: 120,
    ipAllowlist: '184.22.90.10, 203.44.150.*',
    gdprBannerActive: true,
    retentionDays: 730
  });

  const [devices, setDevices] = useState<EnrolledDevice[]>([
    { id: 'dev-1', user: 'Soham Kharat', role: 'CTO / Owner', device: 'MacBook Pro 16"', os: 'macOS Sonoma 14.5', ip: '184.22.90.10', location: 'Mumbai, IN', lastActive: 'Active Now', status: 'SECURE' },
    { id: 'dev-2', user: 'Ananya Sharma', role: 'Sales Director', device: 'iPhone 15 Pro Max', os: 'iOS 17.5.1', ip: '184.22.90.12', location: 'Mumbai, IN', lastActive: '3 minutes ago', status: 'SECURE' },
    { id: 'dev-3', user: 'Rohan Mehta', role: 'Support Lead', device: 'Lenovo ThinkPad X1 Carbon', os: 'Windows 11 Enterprise', ip: '203.44.150.18', location: 'Bengaluru, IN', lastActive: '1 hour ago', status: 'SECURE' },
    { id: 'dev-4', user: 'Sneha Kapoor', role: 'SDR Manager', device: 'Dell XPS 15', os: 'Ubuntu 24.04 LTS', ip: '109.84.2.110', location: 'London, UK', lastActive: '3 days ago', status: 'SUSPICIOUS' }
  ]);

  const [soc2Checklist, setSoc2Checklist] = useState([
    { id: 'cc1', text: 'TLS 1.3 Transport Layer Encryption enforced on all subdomains', checked: true },
    { id: 'cc2', text: 'AES-256 Bit Database encryption at rest with AWS KMS / GCP HSM keys', checked: true },
    { id: 'cc3', text: 'Multi-factor authentication (MFA) mandatory for all staff roles', checked: true },
    { id: 'cc4', text: 'Immutable central syslog storage with automated audit auditing enabled', checked: false },
    { id: 'cc5', text: 'Formal SOC 2 penetration test signed and published within the trailing 12 months', checked: true },
    { id: 'cc6', text: 'Automated background security training verified for all tenants and workspace members', checked: false }
  ]);

  const handleToggleSoc2 = (id: string) => {
    setSoc2Checklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleRevokeDevice = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: 'REVOKED' } : d));
    alert('Access token for this device has been immediately revoked. Force redirection back to Login initiated.');
  };

  const handleSavePolicies = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Enterprise security policies updated successfully.');
    }, 1000);
  };

  return (
    <div id="enterprise-security-dashboard" className="space-y-8">
      {/* Upper security center display */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Enterprise Vault Engine Active</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Enterprise Security Control</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Configure centralized single sign-on (SSO), SAML, security postures, IP limits, active authentication policies, and track real-time SOC 2 Type II audit readiness.
            </p>
          </div>
          
          <div className="flex gap-4 self-start md:self-center">
            <div className="bg-slate-800/50 border border-slate-800 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Overall Health</span>
              <p className="text-xl font-mono font-bold text-emerald-400">92 / 100</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-800 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Enforced MFA</span>
              <p className="text-xl font-mono font-bold text-white">100%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side Navigation Sub Tabs */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          {[
            { id: 'sso', label: 'Identity & SSO', icon: Key, desc: 'Okta, Google, Azure SSO' },
            { id: 'policies', label: 'Session Policies', icon: Lock, desc: 'MFA, IP rules, Passkeys' },
            { id: 'devices', label: 'Device Management', icon: Smartphone, desc: 'Registered system sessions' },
            { id: 'compliance', label: 'Compliance (GDPR)', icon: ShieldCheck, desc: 'PII tools, SOC 2 compliance' },
            { id: 'audit', label: 'Security Center Logs', icon: Activity, desc: 'Security Audit trails' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`p-4 rounded-2xl border text-left transition duration-200 cursor-pointer ${
                activeTab === t.id 
                  ? 'border-emerald-500 bg-white shadow-sm ring-1 ring-emerald-500/10' 
                  : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <t.icon className={`w-5 h-5 ${activeTab === t.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                <div>
                  <h4 className="text-xs font-bold text-slate-950">{t.label}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right Side Control Workspace */}
        <div className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[450px]">
          
          {/* Tab 1: Single Sign On / SSO */}
          {activeTab === 'sso' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Corporate Identity & SSO (SAML 2.0 / OIDC)</h3>
                  <p className="text-slate-500 text-xs mt-1">Configure unified employee access using Okta, Microsoft Azure AD, Google Workspace SSO, or SCIM.</p>
                </div>
                <button 
                  onClick={handleSavePolicies}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Save Identity Setup
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border transition ${policy.ssoEnabled ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-950">Google Workspace SSO</h4>
                      <p className="text-[10px] text-slate-400">OAuth 2.0 Identity broker validation</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={policy.ssoEnabled} 
                      onChange={(e) => setPolicy({ ...policy, ssoEnabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-500 focus:ring-0 rounded border-slate-300"
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <span className="text-[9px] font-bold text-slate-500 block">ORGANIZATION DOMAIN ALLOWLIST</span>
                    <input 
                      type="text" 
                      defaultValue="horizonmedia.co, horizonmedia.in"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-950">Microsoft Azure AD / Entra ID</h4>
                      <p className="text-[10px] text-slate-400">WS-Fed / OIDC directory connection</p>
                    </div>
                    <input type="checkbox" className="w-4 h-4 text-emerald-500 focus:ring-0 rounded border-slate-300" />
                  </div>
                  <div className="mt-4 text-[10px] text-slate-500">
                    Allows Entra enterprise accounts to authenticate securely using Microsoft Graph APIs.
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-950">Okta / PingFederate SAML 2.0 Integration</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Map custom Identity Provider (IdP) variables for instant directory authentication.</p>
                  </div>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase">SAML 2.0</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">SAML 2.0 Single Sign-On URL (IdP Entry)</label>
                    <input 
                      type="text" 
                      defaultValue="https://okta.horizonmedia.co/app/salespilot/ex8849b" 
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none font-mono text-[10px] text-slate-700" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">SAML Entity ID (Audience URI)</label>
                    <input 
                      type="text" 
                      defaultValue="urn:amazon:cognito:sp:salespilot-enterprise-saml" 
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none font-mono text-[10px] text-slate-700" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="flex gap-2 items-center">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">SCIM 2.0 User Provisioning Pipeline</p>
                    <p className="text-[10px] text-slate-500">Auto-create and purge user roles directly from employee directories in real-time.</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={policy.scimProvisioning} 
                  onChange={(e) => setPolicy({ ...policy, scimProvisioning: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 focus:ring-0 rounded border-slate-300"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Session Policies & IP Controls */}
          {activeTab === 'policies' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Access Policies & Multi-Factor Guardrails</h3>
                  <p className="text-slate-500 text-xs mt-1">Configure strict session timelines, WebAuthn passkeys, and trusted office IP allowlists.</p>
                </div>
                <button 
                  onClick={handleSavePolicies}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Save Policies
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-950">Force MFA Verification</p>
                      <p className="text-[10px] text-slate-400">Mandate authenticators/TOTP for all roles</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={policy.mfaRequired} 
                      onChange={(e) => setPolicy({ ...policy, mfaRequired: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300" 
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-950">Enforce WebAuthn Passkeys</p>
                      <p className="text-[10px] text-slate-400">Unlock securely with TouchID, FaceID or Hardware Keys</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={policy.passkeysActive} 
                      onChange={(e) => setPolicy({ ...policy, passkeysActive: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Session Expiration (Minutes)</label>
                    <input 
                      type="number" 
                      value={policy.sessionTimeoutMinutes}
                      onChange={(e) => setPolicy({ ...policy, sessionTimeoutMinutes: parseInt(e.target.value) || 120 })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900" 
                    />
                    <p className="text-[10px] text-slate-400">Force logout and token purging after inactivity.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">IP Range Allowlist (Comma-separated CIDRs)</label>
                <input 
                  type="text" 
                  value={policy.ipAllowlist}
                  onChange={(e) => setPolicy({ ...policy, ipAllowlist: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                  placeholder="e.g. 192.168.1.1, 10.0.0.0/24"
                />
                <p className="text-[10px] text-slate-400">Restricts tenant dashboard connections to corporate subnets or authenticated VPN channels.</p>
              </div>
            </div>
          )}

          {/* Tab 3: Device Management */}
          {activeTab === 'devices' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Employee Devices & Active Sessions</h3>
                <p className="text-slate-500 text-xs mt-1">Audit active systems connected to organization workspaces in real-time. Immediately revoke rogue devices.</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3">User & Role</th>
                      <th className="p-3">Device Details</th>
                      <th className="p-3">Location & IP</th>
                      <th className="p-3">Last Active</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {devices.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-950">{d.user}</div>
                          <div className="text-[10px] text-slate-400">{d.role}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{d.device}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.os}</div>
                        </td>
                        <td className="p-3 font-mono text-[10px]">
                          <div className="text-slate-800">{d.ip}</div>
                          <div className="text-slate-400 font-sans">{d.location}</div>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">{d.lastActive}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-mono ${
                            d.status === 'SECURE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : d.status === 'SUSPICIOUS' 
                              ? 'bg-amber-100 text-amber-800 animate-pulse' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => handleRevokeDevice(d.id)}
                            disabled={d.status === 'REVOKED'}
                            className="p-1 text-red-500 hover:text-red-700 disabled:text-slate-300 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Revoke Session Token"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Compliance Center (GDPR & SOC 2) */}
          {activeTab === 'compliance' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Global Privacy Compliance (GDPR, HIPAA, CCPA)</h3>
                  <p className="text-slate-500 text-xs mt-1 font-medium">Fulfill privacy mandates, consent requirements, data archiving, and sovereign data erasure.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                    <Download className="w-3.5 h-3.5" />
                    Export Org Archive
                  </button>
                  <button 
                    onClick={() => {
                      const confirmPurge = confirm('Warning! This will irreversibly purge all non-active, soft-deleted lead accounts, PII logs, tracking hashes, and caller voice captures to satisfy GDPR "Right to be Forgotten" policies. Proceed?');
                      if (confirmPurge) {
                        alert('PII database clean initiated. 1,482 stale client parameters permanently scrubbed.');
                      }
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge PII Ledger
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SOC 2 Readiness */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-950">SOC 2 Type II Compliance Tracker</h4>
                    <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[9px] font-bold rounded-full font-mono">82% Verified</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Continuous posture audit checklist for upcoming annual Certification validation.</p>

                  <div className="space-y-2.5 text-xs text-slate-700">
                    {soc2Checklist.map(c => (
                      <label key={c.id} className="flex gap-2.5 items-start cursor-pointer hover:text-slate-950">
                        <input 
                          type="checkbox" 
                          checked={c.checked} 
                          onChange={() => handleToggleSoc2(c.id)}
                          className="w-3.5 h-3.5 mt-0.5 rounded text-emerald-500 focus:ring-0" 
                        />
                        <span className={`${c.checked ? 'line-through text-slate-400 text-[11px]' : 'text-[11px] font-medium'}`}>{c.text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ISO 27001 Prep & GDPR */}
                <div className="space-y-6">
                  <div className="border border-slate-100 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-950 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      ISO 27001:2022 ISMS Controls
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      SalesPilot complies fully with ISO Annex A controls covering Asset Management, Access Control, and Physical Cryptography boundaries. Next audit scheduled: November 2026.
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 block">Status: Verified fully compliant</span>
                  </div>

                  <div className="border border-slate-100 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-950">GDPR Cookies Banner</span>
                      <input 
                        type="checkbox" 
                        checked={policy.gdprBannerActive} 
                        onChange={(e) => setPolicy({ ...policy, gdprBannerActive: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300" 
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Inject consent confirmation drawers on custom branded subdomains dynamically.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Security Audits */}
          {activeTab === 'audit' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security Center Live Audit Trails</h3>
                <p className="text-slate-500 text-xs mt-1">Audit log of system configurations, administrator actions, and token validations inside this workspace.</p>
              </div>

              <div className="space-y-3 font-mono text-[10px]">
                {[
                  { time: '2026-07-21 03:32:15', event: 'SSO_CONFIG_MODIFIED', ip: '184.22.90.10', user: 'soham@horizonmedia.co', status: 'SUCCESS' },
                  { time: '2026-07-21 03:20:41', event: 'TOKEN_REVOKED_BY_ADMIN', ip: '184.22.90.10', user: 'soham@horizonmedia.co', status: 'SUCCESS' },
                  { time: '2026-07-20 22:15:09', event: 'MFA_CHALLENGE_ISSUED', ip: '203.44.150.18', user: 'rohan@stellartech.io', status: 'VERIFIED' },
                  { time: '2026-07-20 18:04:30', event: 'SAML_METADATA_LOADED', ip: '184.22.90.10', user: 'soham@horizonmedia.co', status: 'SUCCESS' },
                  { time: '2026-07-19 14:22:11', event: 'SUSPICIOUS_GEO_LOGIN_ATTEMPT', ip: '109.84.2.110', user: 'sneha@cloudflow.com', status: 'BLOCKED' }
                ].map((log, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 gap-2">
                    <div className="flex gap-4 items-center">
                      <span className="text-slate-400">{log.time}</span>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded ${
                        log.event.includes('SUSPICIOUS') || log.event.includes('BLOCKED') 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {log.event}
                      </span>
                    </div>
                    <div className="flex gap-4 items-center justify-between md:justify-end text-slate-500">
                      <span>User: <strong className="text-slate-800">{log.user}</strong></span>
                      <span>IP: <strong className="text-slate-800">{log.ip}</strong></span>
                      <span className={`font-bold ${log.status === 'BLOCKED' ? 'text-red-500' : 'text-emerald-500'}`}>{log.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
