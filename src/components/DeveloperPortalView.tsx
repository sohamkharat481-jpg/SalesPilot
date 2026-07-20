import React, { useState, useEffect } from 'react';
import { 
  Terminal, Key, Activity, ShieldCheck, RefreshCw, Copy, Check, Eye, EyeOff,
  Plus, Trash2, Send, Zap, BookOpen, Layers, Play, Database, Server,
  Globe, Clock, AlertTriangle, Cpu, CheckCircle, HelpCircle, Laptop, Settings, Link
} from 'lucide-react';

export function DeveloperPortalView() {
  const [activeTab, setActiveTab] = useState<'docs' | 'keys' | 'webhooks' | 'oauth' | 'marketplace' | 'logs'>('docs');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<any[]>([]);
  const [oauthClients, setOauthClients] = useState<any[]>([]);
  const [marketplaceApps, setMarketplaceApps] = useState<any[]>([]);
  const [devLogs, setDevLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Key creation states
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['*']);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  // Webhook creation states
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['*']);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);

  // OAuth client creation states
  const [newClientName, setNewClientName] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');
  const [newClientRedirect, setNewClientRedirect] = useState('');
  const [newClientScopes, setNewClientScopes] = useState<string[]>(['leads:read']);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Marketplace settings states
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [appSettingsJson, setAppSettingsJson] = useState('');
  const [showAppSettingsModal, setShowAppSettingsModal] = useState(false);

  // API Explorer states
  const [explorerMethod, setExplorerMethod] = useState<'GET' | 'POST'>('GET');
  const [explorerPath, setExplorerPath] = useState('/api/v1/public/leads');
  const [explorerBody, setExplorerBody] = useState('{\n  "firstName": "Developer",\n  "lastName": "Partner",\n  "email": "dev@partner.com",\n  "company": "Developer Labs"\n}');
  const [explorerApiKey, setExplorerApiKey] = useState('');
  const [explorerResponse, setExplorerResponse] = useState<string | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Utility copy states
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('salespilot_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [keysRes, whsRes, oauthRes, marketRes, logsRes] = await Promise.all([
        fetch('/api/v1/developer/keys', { headers: getHeaders() }),
        fetch('/api/v1/developer/webhooks', { headers: getHeaders() }),
        fetch('/api/v1/developer/oauth-clients', { headers: getHeaders() }),
        fetch('/api/v1/developer/marketplace', { headers: getHeaders() }),
        fetch('/api/v1/developer/logs', { headers: getHeaders() })
      ]);

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.apiKeys || []);
      }
      if (whsRes.ok) {
        const whsData = await whsRes.json();
        setWebhooks(whsData.endpoints || []);
        setWebhookDeliveries(whsData.deliveries || []);
      }
      if (oauthRes.ok) {
        const oauthData = await oauthRes.json();
        setOauthClients(oauthData.oauthClients || []);
      }
      if (marketRes.ok) {
        const marketData = await marketRes.json();
        setMarketplaceApps(marketData.apps || []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setDevLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error('Failed to query developer backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [activeTab]);

  // Create API Key
  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch('/api/v1/developer/keys', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newKeyName,
          scopes: newKeyScopes,
          rateLimit: newKeyRateLimit
        })
      });
      const data = await res.json();
      if (data.success) {
        setApiKeys(prev => [data.apiKey, ...prev]);
        setRevealedKey(data.apiKey.secretKey);
        setNewKeyName('');
        setShowCreateKeyModal(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke/Delete API Key
  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to revoke this API key? This action is immediate and permanent.')) return;
    try {
      const res = await fetch(`/api/v1/developer/keys/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.id !== id));
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Rotate API Key
  const handleRotateApiKey = async (id: string) => {
    if (!confirm('Rotate this API key? All applications using the old key will be denied immediately.')) return;
    try {
      const res = await fetch(`/api/v1/developer/keys/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ rotate: true })
      });
      if (res.ok) {
        alert('API Key rotated successfully! Please check the key list to retrieve the fresh value.');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Webhook endpoint
  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    try {
      const res = await fetch('/api/v1/developer/webhooks', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          url: newWebhookUrl,
          events: newWebhookEvents
        })
      });
      const data = await res.json();
      if (data.success) {
        setWebhooks(prev => [...prev, data.endpoint]);
        setNewWebhookUrl('');
        setShowCreateWebhookModal(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Webhook
  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Delete this Webhook registration?')) return;
    try {
      const res = await fetch(`/api/v1/developer/webhooks/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setWebhooks(prev => prev.filter(w => w.id !== id));
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger test webhook delivery
  const handleTestWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/developer/webhooks/${id}/test`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert('Test Webhook (lead.created) successfully sent! Check logs or deliveries below for payload audit details.');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create OAuth Client App
  const handleCreateOAuthClient = async () => {
    if (!newClientName.trim() || !newClientRedirect.trim()) return;
    try {
      const res = await fetch('/api/v1/developer/oauth-clients', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newClientName,
          description: newClientDesc,
          redirectUris: [newClientRedirect],
          scopes: newClientScopes
        })
      });
      const data = await res.json();
      if (data.success) {
        setOauthClients(prev => [data.client, ...prev]);
        setNewClientName('');
        setNewClientDesc('');
        setNewClientRedirect('');
        setShowCreateClientModal(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete OAuth Client
  const handleDeleteOAuthClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this OAuth App? This will revoke all active user authorizations.')) return;
    try {
      const res = await fetch(`/api/v1/developer/oauth-clients/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setOauthClients(prev => prev.filter(c => c.id !== id));
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Install Marketplace App
  const handleInstallApp = async (appId: string) => {
    try {
      const res = await fetch(`/api/v1/developer/marketplace/${appId}/install`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          settings: { webhookUrl: `https://api.partner.io/v1/webhook/${appId}`, syncEnabled: true }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`${appId} integrated successfully! Connection is now active.`);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Uninstall Marketplace App
  const handleUninstallApp = async (appId: string) => {
    if (!confirm(`Are you sure you want to disconnect and uninstall the ${appId} integration?`)) return;
    try {
      const res = await fetch(`/api/v1/developer/marketplace/${appId}/uninstall`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update App Settings
  const handleSaveAppSettings = async () => {
    if (!selectedApp) return;
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(appSettingsJson);
      } catch (err) {
        alert('Invalid JSON settings payload format. Please input a valid key-value configuration.');
        return;
      }

      const res = await fetch(`/api/v1/developer/marketplace/${selectedApp.id}/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ settings: parsed })
      });
      const data = await res.json();
      if (data.success) {
        alert('Settings persisted successfully.');
        setShowAppSettingsModal(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run Explorer
  const handleRunExplorer = async () => {
    setExplorerLoading(true);
    setExplorerResponse(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (explorerApiKey) {
        headers['Authorization'] = `Bearer ${explorerApiKey}`;
      } else {
        const token = localStorage.getItem('salespilot_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method: explorerMethod,
        headers
      };

      if (explorerMethod === 'POST') {
        options.body = explorerBody;
      }

      const res = await fetch(explorerPath, options);
      const data = await res.json();
      setExplorerResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setExplorerResponse(JSON.stringify({ error: 'Failed to complete execution', details: err.message || String(err) }, null, 2));
    } finally {
      setExplorerLoading(false);
    }
  };

  // Simulate webhooks easily
  const handleSimulatePayment = async () => {
    try {
      const res = await fetch('/api/v1/developer/simulate-payment-success', { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        alert('Simulated "payment.success" webhook successfully dispatched to your active endpoints!');
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateSubscription = async () => {
    try {
      const res = await fetch('/api/v1/developer/simulate-subscription-update', { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        alert('Simulated "subscription.updated" webhook successfully dispatched to your active endpoints!');
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Document templates
  const curlTemplate = `curl -X GET "https://salespilot.ai/api/v1/public/leads" \\
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`;

  const nodeTemplate = `import axios from 'axios';

const client = axios.create({
  baseURL: 'https://salespilot.ai/api/v1/public',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY_HERE',
    'Content-Type': 'application/json'
  }
});

// Fetch high-intent leads
const response = await client.get('/leads', {
  params: { status: 'NEW', limit: 10 }
});
console.log(response.data.leads);`;

  const pyTemplate = `import requests

url = "https://salespilot.ai/api/v1/public/leads"
headers = {
    "Authorization": "Bearer YOUR_API_KEY_HERE",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
print(response.json())`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Visual Hub Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 sm:space-y-0 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/25 border border-blue-500/20 rounded-lg">
              <Terminal className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Developer Marketplace & API Hub</h1>
              <p className="text-xs text-slate-400 font-mono">Build robust integrations, configure real-time webhooks, and utilize secure OAuth apps.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={fetchAllData}
            className="px-3.5 py-2 text-xs font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg flex items-center gap-2 cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Hub
          </button>
          <button 
            onClick={handleSimulatePayment}
            className="px-3 py-2 text-xs font-mono font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/30 border border-emerald-800/50 rounded-lg flex items-center gap-1 cursor-pointer transition"
            title="Fire a payment.success event to testing webhooks"
          >
            ⚡ Test Payment WH
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto space-x-1">
        {[
          { id: 'docs', label: 'Overview & Docs', icon: BookOpen },
          { id: 'keys', label: 'API Keys', icon: Key },
          { id: 'webhooks', label: 'Webhooks', icon: Activity },
          { id: 'oauth', label: 'OAuth Apps', icon: ShieldCheck },
          { id: 'marketplace', label: 'Marketplace', icon: Layers },
          { id: 'logs', label: 'Telemetry Logs', icon: Cpu }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold bg-blue-500/5' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-850">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-mono text-slate-500">Retrieving secure developer structures...</p>
        </div>
      )}

      {/* TABS CONTENT */}
      {!loading && (
        <div className="space-y-6">
          
          {/* TAB 1: DOCS & EXPLORER */}
          {activeTab === 'docs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SDK Snippets Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-100 dark:border-slate-850 pb-2">REST API Quickstart</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Authenticate your scripts by attaching your secure API Key as a <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">Bearer</code> token inside the standard <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">Authorization</code> header.
                </p>

                {/* Curl Code Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Shell / cURL</span>
                    <button 
                      onClick={() => handleCopy(curlTemplate)}
                      className="hover:text-blue-500 flex items-center gap-1 cursor-pointer transition text-[10px]"
                    >
                      {copiedText === curlTemplate ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copy Code
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
                    {curlTemplate}
                  </pre>
                </div>

                {/* Node.js Code Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Node.js / Axios</span>
                    <button 
                      onClick={() => handleCopy(nodeTemplate)}
                      className="hover:text-blue-500 flex items-center gap-1 cursor-pointer transition text-[10px]"
                    >
                      {copiedText === nodeTemplate ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copy Code
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-slate-800 max-h-48 overflow-y-auto scrollbar-thin">
                    {nodeTemplate}
                  </pre>
                </div>

                {/* Python Snippet */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Python / Requests</span>
                    <button 
                      onClick={() => handleCopy(pyTemplate)}
                      className="hover:text-blue-500 flex items-center gap-1 cursor-pointer transition text-[10px]"
                    >
                      {copiedText === pyTemplate ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copy Code
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
                    {pyTemplate}
                  </pre>
                </div>
              </div>

              {/* Interactive API Explorer Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Interactive API Explorer</h2>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-mono font-bold px-2 py-0.5 rounded-full">Sandbox Mode</span>
                </div>
                
                <p className="text-xs text-slate-500">Test live API requests directly against the SalesPilot secure memory tables.</p>

                <div className="space-y-3">
                  {/* Select Key */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Authentication Key override</label>
                    <select 
                      value={explorerApiKey}
                      onChange={(e) => setExplorerApiKey(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Use current session auth (Cookie bearer)</option>
                      {apiKeys.map(k => (
                        <option key={k.id} value={k.secretKey}>{k.name} ({k.keyPrefix})</option>
                      ))}
                    </select>
                  </div>

                  {/* Route details */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Method</label>
                      <select 
                        value={explorerMethod}
                        onChange={(e) => setExplorerMethod(e.target.value as any)}
                        className="w-full text-xs font-mono font-bold text-blue-500 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Endpoint Path</label>
                      <input 
                        type="text"
                        value={explorerPath}
                        onChange={(e) => setExplorerPath(e.target.value)}
                        className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* POST Payload editor */}
                  {explorerMethod === 'POST' && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">JSON Request Body</label>
                      <textarea 
                        rows={4}
                        value={explorerBody}
                        onChange={(e) => setExplorerBody(e.target.value)}
                        className="w-full text-xs font-mono bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Run button */}
                  <button 
                    onClick={handleRunExplorer}
                    disabled={explorerLoading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    {explorerLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} 
                    Execute Sandbox Query
                  </button>

                  {/* Explorer Response */}
                  {explorerResponse && (
                    <div className="space-y-1.5 pt-2 animate-fadeIn">
                      <span className="block text-[10px] font-mono font-bold uppercase text-slate-400">Response Payloads</span>
                      <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto border border-slate-800 max-h-48 overflow-y-auto leading-relaxed scrollbar-thin">
                        {explorerResponse}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: API KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              {/* Explanation Banner */}
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-250 dark:border-slate-850 p-4 rounded-xl flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 leading-normal">
                  Create secure API keys to integrate external CRM services, custom website contact forms, or automated lead sequence triggers. 
                  Keep your secrets safe. <strong>API keys are only shown in full once upon creation.</strong>
                </div>
              </div>

              {/* Create API Key trigger */}
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400">Active API Keys ({apiKeys.length})</h3>
                <button 
                  onClick={() => setShowCreateKeyModal(true)}
                  className="px-3.5 py-2 text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" /> Create API Key
                </button>
              </div>

              {/* Reveal Newly Created Key alert banner */}
              {revealedKey && (
                <div className="bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-250 dark:border-emerald-800/40 p-4 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Key Created Successfully! Copy this value now:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={revealedKey} 
                      className="flex-1 text-xs font-mono bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900 rounded p-2 text-slate-800 dark:text-emerald-200 select-all"
                    />
                    <button 
                      onClick={() => handleCopy(revealedKey)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition cursor-pointer"
                    >
                      {copiedText === revealedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-500 font-mono">For safety, this cleartext secret key won't be shown again.</span>
                </div>
              )}

              {/* Keys Grid */}
              {apiKeys.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Key className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-500">No API keys configured yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apiKeys.map((key) => (
                    <div 
                      key={key.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3.5 shadow-sm relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase font-mono tracking-wider">{key.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">{key.keyPrefix}</span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${key.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                              {key.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleRotateApiKey(key.id)}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md border border-slate-100 dark:border-slate-800 cursor-pointer transition"
                            title="Rotate Key secret"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteApiKey(key.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-md border border-slate-100 dark:border-slate-800 cursor-pointer transition"
                            title="Revoke and delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>Scopes:</span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {key.scopes.map((sc: string) => (
                              <code key={sc} className="bg-slate-50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 px-1.5 py-0.2 rounded text-[9px] text-slate-600 dark:text-slate-300 font-mono">{sc}</code>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>Rate Limit:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{key.rateLimit} req/min</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>Created At:</span>
                          <span className="text-slate-500">{new Date(key.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEBHOOKS */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              {/* Event catalog */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-mono font-bold text-blue-500 uppercase">leads events</div>
                  <ul className="text-[10px] font-mono text-slate-500 space-y-1 list-disc pl-4">
                    <li>lead.created</li>
                    <li>lead.updated</li>
                    <li>lead.assigned</li>
                  </ul>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-mono font-bold text-amber-500 uppercase">billing & campaigns</div>
                  <ul className="text-[10px] font-mono text-slate-500 space-y-1 list-disc pl-4">
                    <li>payment.success</li>
                    <li>subscription.updated</li>
                    <li>campaign.started</li>
                  </ul>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-mono font-bold text-purple-500 uppercase">appointments & workflows</div>
                  <ul className="text-[10px] font-mono text-slate-500 space-y-1 list-disc pl-4">
                    <li>meeting.scheduled</li>
                    <li>email.replied</li>
                    <li>workflow.completed</li>
                  </ul>
                </div>
              </div>

              {/* Webhooks Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400">Registered Webhook Endpoints ({webhooks.length})</h3>
                <button 
                  onClick={() => setShowCreateWebhookModal(true)}
                  className="px-3.5 py-2 text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" /> Add Webhook Endpoint
                </button>
              </div>

              {/* Active list */}
              {webhooks.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-500">No Webhook endpoints registered yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((wh) => (
                    <div 
                      key={wh.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono break-all">{wh.url}</span>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                              {wh.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                            <span>Signing Secret: <code className="bg-slate-100 dark:bg-slate-850 px-1 py-0.2 rounded text-slate-600 dark:text-slate-300">{wh.secret}</code></span>
                            <button 
                              onClick={() => handleCopy(wh.secret)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button 
                            onClick={() => handleTestWebhook(wh.id)}
                            className="px-2.5 py-1 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/25 border border-blue-200/50 rounded cursor-pointer transition"
                          >
                            Send Test Event
                          </button>
                          <button 
                            onClick={() => handleDeleteWebhook(wh.id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded border border-slate-100 dark:border-slate-800 cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400">Events:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {wh.events.map((e: string) => (
                            <code key={e} className="bg-slate-50 dark:bg-slate-850 border border-slate-200 px-1.5 py-0.2 rounded text-[9px] text-slate-600 dark:text-slate-400 font-mono">{e}</code>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery History */}
              <div className="space-y-3.5 pt-4">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400">Webhook Delivery Deliveries history</h3>
                {webhookDeliveries.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs font-mono text-slate-500">No webhook events triggered yet.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead>
                          <tr className="bg-slate-550/10 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[9px]">
                            <th className="p-3">Status</th>
                            <th className="p-3">Attempt</th>
                            <th className="p-3">Event Type</th>
                            <th className="p-3">Response Status</th>
                            <th className="p-3">Triggered Time</th>
                            <th className="p-3">ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {webhookDeliveries.map((dlv) => (
                            <tr key={dlv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 text-slate-700 dark:text-slate-300">
                              <td className="p-3">
                                <span className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${dlv.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : dlv.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {dlv.status}
                                </span>
                              </td>
                              <td className="p-3">#{dlv.attemptNumber} attempt</td>
                              <td className="p-3 font-semibold">{dlv.event}</td>
                              <td className="p-3 font-bold">{dlv.statusCode || 'N/A'}</td>
                              <td className="p-3 text-[10px] text-slate-400">{new Date(dlv.createdAt).toLocaleTimeString()}</td>
                              <td className="p-3 text-slate-400 font-mono text-[10px]">{dlv.id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OAUTH CLIENTS */}
          {activeTab === 'oauth' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400">OAuth Clients Integrations ({oauthClients.length})</h3>
                <button 
                  onClick={() => setShowCreateClientModal(true)}
                  className="px-3.5 py-2 text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" /> Create OAuth App
                </button>
              </div>

              {/* Listing */}
              {oauthClients.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-500">No OAuth developer client applications configured.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {oauthClients.map((client) => (
                    <div 
                      key={client.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">{client.name}</h4>
                          <p className="text-xs text-slate-500 leading-normal">{client.description || 'No description provided.'}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteOAuthClient(client.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded border border-slate-100 dark:border-slate-800 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Client credentials */}
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                        <div className="space-y-1">
                          <span className="block text-[10px] font-mono font-bold uppercase text-slate-400">Client ID</span>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="text" 
                              readOnly 
                              value={client.id} 
                              className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-slate-200 select-all focus:outline-none"
                            />
                            <button 
                              onClick={() => handleCopy(client.id)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="block text-[10px] font-mono font-bold uppercase text-slate-400">Client Secret</span>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type={revealedSecrets[client.id] ? "text" : "password"} 
                              readOnly 
                              value={client.secret} 
                              className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-slate-200 select-all focus:outline-none"
                            />
                            <button 
                              onClick={() => setRevealedSecrets(prev => ({ ...prev, [client.id]: !prev[client.id] }))}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                            >
                              {revealedSecrets[client.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button 
                              onClick={() => handleCopy(client.secret)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-850">
                          <span>Redirect URIs:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold font-mono text-[9px] break-all">{client.redirectUris.join(', ')}</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>Authorized Scopes:</span>
                          <span className="text-slate-600 dark:text-slate-400 font-bold font-mono text-[9px]">{client.scopes.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MARKETPLACE APPS */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400">Integration Marketplace Catalog</h3>
                <span className="text-xs text-slate-500 font-mono">Easily bridge standard CRMs & pipelines with 1-click connectors</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceApps.map((app) => {
                  const isConnected = app.status === 'CONNECTED';
                  return (
                    <div 
                      key={app.id} 
                      className={`bg-white dark:bg-slate-900 border p-6 rounded-xl space-y-4 shadow-sm flex flex-col justify-between transition ${
                        isConnected ? 'border-blue-500/45 dark:border-blue-900/40 ring-1 ring-blue-500/10' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-white font-mono text-xs shadow-inner">
                            {app.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${isConnected ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400'}`}>
                            {app.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase font-mono tracking-wider">{app.name}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{app.description}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-850 pt-3.5 flex items-center justify-between gap-2">
                        {isConnected ? (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedApp(app);
                                setAppSettingsJson(JSON.stringify(app.settings || {}, null, 2));
                                setShowAppSettingsModal(true);
                              }}
                              className="px-3 py-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition flex items-center gap-1"
                            >
                              <Settings className="w-3 h-3" /> Config
                            </button>
                            <button 
                              onClick={() => handleUninstallApp(app.id)}
                              className="px-3 py-1.5 text-xs font-mono font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200/20 rounded-lg cursor-pointer transition"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleInstallApp(app.id)}
                            className="w-full py-1.5 text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition flex items-center justify-center gap-1"
                          >
                            <Link className="w-3 h-3" /> Connect Account
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: TELEMETRY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-400">Developer API & Webhook Request Telemetry logs ({devLogs.length})</h3>

              {devLogs.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-500">No developer requests have been received yet.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="bg-slate-550/10 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[9px]">
                          <th className="p-3">Method/Type</th>
                          <th className="p-3">Path/Detail</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">IP Address</th>
                          <th className="p-3">Triggered At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {devLogs.map((log) => {
                          const isExpanded = expandedLog === log.id;
                          return (
                            <React.Fragment key={log.id}>
                              <tr 
                                onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 cursor-pointer text-slate-700 dark:text-slate-300 transition"
                              >
                                <td className="p-3">
                                  <span className={`font-bold text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                                    log.type === 'API_REQUEST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400'
                                  }`}>
                                    {log.method || log.type}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold text-[11px] truncate max-w-xs">{log.path || log.message}</td>
                                <td className="p-3">
                                  <span className={`font-bold font-mono ${log.statusCode < 300 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {log.statusCode || '200'}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                                <td className="p-3 text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-slate-50/40 dark:bg-slate-950/40">
                                  <td colSpan={5} className="p-4 border-t border-slate-100 dark:border-slate-850 animate-fadeIn">
                                    <div className="space-y-2 font-mono">
                                      <div className="text-[10px] text-slate-400 uppercase font-bold">Raw Audit Log Details:</div>
                                      <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-lg overflow-x-auto border border-slate-800 leading-normal max-h-40 overflow-y-auto">
                                        {JSON.stringify(log, null, 2)}
                                      </pre>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* MODAL 1: CREATE API KEY */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-500" /> Create API Key
              </h3>
              <button onClick={() => setShowCreateKeyModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Key Identifier Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Lead Form Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Rate Limit Restriction</label>
                <select 
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none"
                >
                  <option value={30}>30 requests / minute (Relaxed)</option>
                  <option value={60}>60 requests / minute (Standard)</option>
                  <option value={120}>120 requests / minute (Enterprise Developer)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-mono font-bold uppercase text-slate-400">Scope Permissions (Defaults to all '*')</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  {[
                    { id: '*', label: 'All Access (*)' },
                    { id: 'leads:read', label: 'Read Leads' },
                    { id: 'leads:write', label: 'Write Leads' },
                    { id: 'deals:read', label: 'Read Deals' },
                    { id: 'deals:write', label: 'Write Deals' },
                    { id: 'campaigns:read', label: 'Read Campaigns' },
                    { id: 'campaigns:write', label: 'Write Campaigns' },
                    { id: 'workflows:write', label: 'Trigger Workflows' }
                  ].map((sc) => {
                    const isChecked = newKeyScopes.includes(sc.id);
                    return (
                      <label key={sc.id} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (sc.id === '*') {
                              setNewKeyScopes(['*']);
                            } else {
                              let filtered = newKeyScopes.filter(x => x !== '*');
                              if (isChecked) {
                                filtered = filtered.filter(x => x !== sc.id);
                                if (filtered.length === 0) filtered = ['*'];
                              } else {
                                filtered.push(sc.id);
                              }
                              setNewKeyScopes(filtered);
                            }
                          }}
                        />
                        {sc.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreateApiKey}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg cursor-pointer transition"
            >
              Generate Fresh API Key
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE WEBHOOK */}
      {showCreateWebhookModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Register Webhook Endpoint
              </h3>
              <button onClick={() => setShowCreateWebhookModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Target Listener URL</label>
                <input 
                  type="url" 
                  placeholder="https://api.yourdomain.com/webhooks/salespilot"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-mono font-bold uppercase text-slate-400">Select Subscribed Events (Defaults to all '*')</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  {[
                    { id: '*', label: 'All Events (*)' },
                    { id: 'lead.created', label: 'Lead Created' },
                    { id: 'lead.updated', label: 'Lead Updated' },
                    { id: 'deal.won', label: 'Deal Won / Won Stage' },
                    { id: 'campaign.started', label: 'Campaign Started' },
                    { id: 'meeting.scheduled', label: 'Meeting Booked' },
                    { id: 'email.replied', label: 'Email Replied' },
                    { id: 'payment.success', label: 'Payment Received' },
                    { id: 'subscription.updated', label: 'Subscription Updated' }
                  ].map((evt) => {
                    const isChecked = newWebhookEvents.includes(evt.id);
                    return (
                      <label key={evt.id} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (evt.id === '*') {
                              setNewWebhookEvents(['*']);
                            } else {
                              let filtered = newWebhookEvents.filter(x => x !== '*');
                              if (isChecked) {
                                filtered = filtered.filter(x => x !== evt.id);
                                if (filtered.length === 0) filtered = ['*'];
                              } else {
                                filtered.push(evt.id);
                              }
                              setNewWebhookEvents(filtered);
                            }
                          }}
                        />
                        {evt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreateWebhook}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg cursor-pointer transition"
            >
              Add Active Webhook Registration
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE OAUTH CLIENT */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" /> Create Third-Party OAuth App
              </h3>
              <button onClick={() => setShowCreateClientModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Application Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Notion Analytics sync"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Brief Description</label>
                <input 
                  type="text" 
                  placeholder="Allows secure access to CRM leads"
                  value={newClientDesc}
                  onChange={(e) => setNewClientDesc(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Authorized Redirect URI (Redirect callback URL)</label>
                <input 
                  type="url" 
                  placeholder="https://yourapp.io/oauth/callback"
                  value={newClientRedirect}
                  onChange={(e) => setNewClientRedirect(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-mono font-bold uppercase text-slate-400">Authorized Scopes</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-850 p-2 rounded-lg">
                  {[
                    { id: 'leads:read', label: 'leads:read' },
                    { id: 'leads:write', label: 'leads:write' },
                    { id: 'deals:read', label: 'deals:read' },
                    { id: 'campaigns:read', label: 'campaigns:read' }
                  ].map((sc) => {
                    const isChecked = newClientScopes.includes(sc.id);
                    return (
                      <label key={sc.id} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewClientScopes(prev => prev.filter(x => x !== sc.id));
                            } else {
                              setNewClientScopes(prev => [...prev, sc.id]);
                            }
                          }}
                        />
                        {sc.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreateOAuthClient}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg cursor-pointer transition"
            >
              Register OAuth Application
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: APP SETTINGS */}
      {showAppSettingsModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-500" /> Config {selectedApp.name} settings
              </h3>
              <button onClick={() => setShowAppSettingsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <span className="block text-[10px] font-mono font-bold uppercase text-slate-400">Settings Payload JSON</span>
              <textarea 
                rows={8}
                value={appSettingsJson}
                onChange={(e) => setAppSettingsJson(e.target.value)}
                className="w-full text-xs font-mono bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            <button 
              onClick={handleSaveAppSettings}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg cursor-pointer transition"
            >
              Persist Settings JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
