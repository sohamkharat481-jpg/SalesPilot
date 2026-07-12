import React, { useState } from 'react';
import { 
  Shield, Mail, Linkedin, MessageSquare, Phone, Server, Check, 
  RefreshCw, Play, AlertCircle, Sparkles, HelpCircle, Eye, EyeOff, Settings, Database
} from 'lucide-react';
import { motion } from 'motion/react';

interface Provider {
  id: string;
  name: string;
  type: 'email' | 'linkedin' | 'whatsapp' | 'sms';
  description: string;
  fields: { key: string; label: string; type: 'text' | 'password'; placeholder: string; value: string }[];
  isDefault: boolean;
  isConnected: boolean;
}

export function ProviderHub() {
  const [activeChannel, setActiveChannel] = useState<'email' | 'linkedin' | 'whatsapp' | 'sms'>('email');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [providers, setProviders] = useState<Provider[]>([
    // Email Providers
    {
      id: 'sendgrid',
      name: 'SendGrid API',
      type: 'email',
      description: 'Enterprise email delivery via SendGrid SMTP and Web API routing nodes.',
      isDefault: true,
      isConnected: true,
      fields: [
        { key: 'apiKey', label: 'SendGrid API Key', type: 'password', placeholder: 'SG.xxxxxxxxxxxxxxxxx', value: 'SG.live_key_salespilot_sg_2026' },
        { key: 'senderEmail', label: 'Verified Sender Email', type: 'text', placeholder: 'sender@yourdomain.com', value: 'outbound@salespilot.co' }
      ]
    },
    {
      id: 'mailgun',
      name: 'Mailgun API',
      type: 'email',
      description: 'High-frequency transactional email system with robust domain verification.',
      isDefault: false,
      isConnected: false,
      fields: [
        { key: 'apiKey', label: 'Mailgun Private Key', type: 'password', placeholder: 'key-xxxxxxxxxxxxxxxxx', value: '' },
        { key: 'domain', label: 'Mailgun Mail Domain', type: 'text', placeholder: 'mg.yourdomain.com', value: '' }
      ]
    },
    {
      id: 'custom_smtp',
      name: 'Custom SMTP/IMAP',
      type: 'email',
      description: 'Connect raw Google Workspace, Office 365, or Zoho Mail SMTP/IMAP servers directly.',
      isDefault: false,
      isConnected: false,
      fields: [
        { key: 'smtpHost', label: 'SMTP Server Host', type: 'text', placeholder: 'smtp.gmail.com', value: '' },
        { key: 'smtpPort', label: 'SMTP Port', type: 'text', placeholder: '465', value: '' },
        { key: 'smtpUser', label: 'SMTP Login User', type: 'text', placeholder: 'user@domain.com', value: '' },
        { key: 'smtpPass', label: 'SMTP Login Password', type: 'password', placeholder: 'App Password', value: '' }
      ]
    },

    // LinkedIn Providers
    {
      id: 'phantombuster',
      name: 'PhantomBuster API',
      type: 'linkedin',
      description: 'Automated LinkedIn cloud orchestration sequences & connection handlers.',
      isDefault: true,
      isConnected: true,
      fields: [
        { key: 'apiKey', label: 'PhantomBuster API Key', type: 'password', placeholder: 'pb_xxxxxxxxx', value: 'pb_auth_token_live_2026' },
        { key: 'sessionCookie', label: 'LinkedIn li_at Cookie', type: 'password', placeholder: 'AQFA...cookie_string', value: 'AQFA_li_at_handshake_session_token_salespilot' }
      ]
    },
    {
      id: 'custom_li_node',
      name: 'Custom Unofficial Headless API',
      type: 'linkedin',
      description: 'Connect internal chromium-puppeteer microservices for local pipeline handshakes.',
      isDefault: false,
      isConnected: false,
      fields: [
        { key: 'endpoint', label: 'Puppeteer Node Endpoint', type: 'text', placeholder: 'http://localhost:8080/linkedin', value: '' },
        { key: 'secretToken', label: 'Authorization Bearer Token', type: 'password', placeholder: 'bearer_xxxx', value: '' }
      ]
    },

    // WhatsApp Providers
    {
      id: 'meta_whatsapp',
      name: 'Meta WhatsApp Cloud API',
      type: 'whatsapp',
      description: 'Official WhatsApp Business SDK with secure API routing and template matching.',
      isDefault: true,
      isConnected: true,
      fields: [
        { key: 'accessToken', label: 'Meta System Token', type: 'password', placeholder: 'EAAb...', value: 'EAAb_whatsapp_meta_cloud_token_salespilot' },
        { key: 'phoneId', label: 'Phone Number ID', type: 'text', placeholder: '1092837492348', value: '821947291739' },
        { key: 'wabaId', label: 'WhatsApp Business Account ID', type: 'text', placeholder: '918237492134', value: '739218374923' }
      ]
    },
    {
      id: 'twilio_whatsapp',
      name: 'Twilio Conversations & WhatsApp API',
      type: 'whatsapp',
      description: 'Modular WhatsApp delivery using Twilio messaging services and global proxy networks.',
      isDefault: false,
      isConnected: false,
      fields: [
        { key: 'accountSid', label: 'Twilio Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxxx', value: '' },
        { key: 'authToken', label: 'Twilio Auth Token', type: 'password', placeholder: 'Auth Token', value: '' },
        { key: 'fromWhatsapp', label: 'WhatsApp Sender Phone', type: 'text', placeholder: 'whatsapp:+14155238886', value: '' }
      ]
    },

    // SMS Providers
    {
      id: 'twilio_sms',
      name: 'Twilio SMS API',
      type: 'sms',
      description: 'Deliver crisp, localized, short text messages globally via premium Twilio hubs.',
      isDefault: true,
      isConnected: true,
      fields: [
        { key: 'accountSid', label: 'Twilio Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxxx', value: 'AC_twilio_salespilot_sid_2026' },
        { key: 'authToken', label: 'Twilio Auth Token', type: 'password', placeholder: 'Auth Token', value: 'twilio_secret_token_live_outbound_3918' },
        { key: 'fromNumber', label: 'SMS Sender Number', type: 'text', placeholder: '+1234567890', value: '+18559023411' }
      ]
    },
    {
      id: 'plivo',
      name: 'Plivo Smart SMS API',
      type: 'sms',
      description: 'Direct operator routes for premium SMS deliverability and carrier routing.',
      isDefault: false,
      isConnected: false,
      fields: [
        { key: 'authId', label: 'Plivo Auth ID', type: 'text', placeholder: 'Mxxxxxxxxxxxxxxxxx', value: '' },
        { key: 'authToken', label: 'Plivo Auth Token', type: 'password', placeholder: 'Auth Token', value: '' }
      ]
    },
    {
      id: 'custom_gateway',
      name: 'Future Custom Gateway Integration',
      type: 'sms',
      description: 'Connect any local, international, or custom cellular hardware gateway dynamically.',
      isDefault: false,
      isConnected: false,
      fields: [
        { key: 'webhookUrl', label: 'HTTP Outbound Target URL', type: 'text', placeholder: 'https://api.customsms.in/send', value: '' },
        { key: 'apiKeyHeader', label: 'X-API-KEY Header Value', type: 'password', placeholder: 'Secret Key', value: '' }
      ]
    }
  ]);

  const toggleShowSecret = (providerId: string) => {
    setShowSecrets(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleFieldChange = (providerId: string, fieldKey: string, newValue: string) => {
    setProviders(prev => prev.map(prov => {
      if (prov.id === providerId) {
        return {
          ...prov,
          fields: prov.fields.map(f => f.key === fieldKey ? { ...f, value: newValue } : f)
        };
      }
      return prov;
    }));
  };

  const handleSetActiveDefault = (id: string, type: 'email' | 'linkedin' | 'whatsapp' | 'sms') => {
    setProviders(prev => prev.map(prov => {
      if (prov.type === type) {
        return { ...prov, isDefault: prov.id === id };
      }
      return prov;
    }));
  };

  const handleSaveConfig = (providerId: string) => {
    setProviders(prev => prev.map(prov => {
      if (prov.id === providerId) {
        return { ...prov, isConnected: true };
      }
      return prov;
    }));
    alert(`Configuration saved for ${providerId.toUpperCase()}. Endpoint router is synced.`);
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResult(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    const provider = providers.find(p => p.id === id);
    if (!provider) return;

    try {
      const response = await fetch('/api/v1/outreach/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: id,
          providerName: provider.name,
          type: provider.type,
          fields: provider.fields.reduce((acc, f) => ({ ...acc, [f.key]: f.value }), {})
        })
      });
      const data = await response.json();
      setTestResult(prev => ({
        ...prev,
        [id]: {
          success: data.success,
          message: data.message
        }
      }));
    } catch (err) {
      console.error(err);
      setTestResult(prev => ({
        ...prev,
        [id]: {
          success: false,
          message: 'Connection failed: Service returned transient network error.'
        }
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Visual Banner of Modular Design */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-900/40 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shrink-0">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Modular Integration Engine <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-blue-600 text-white rounded-md">ZERO HARDCODING</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
              SalesPilot uses a <strong>Provider-Agnostic Routing Protocol</strong>. You can switch delivery systems (e.g. SMTP, SendGrid, Twilio, PhantomBuster, Meta API) with a single click. Adding custom or future endpoints requires absolutely no code rewrites.
            </p>
          </div>
        </div>
      </div>

      {/* Segment selectors */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'email', label: 'Cold Email Nodes', icon: Mail, color: 'text-blue-500' },
          { id: 'linkedin', label: 'LinkedIn Connectors', icon: Linkedin, color: 'text-indigo-500' },
          { id: 'whatsapp', label: 'WhatsApp Gateways', icon: MessageSquare, color: 'text-emerald-500' },
          { id: 'sms', label: 'SMS Blast Hubs', icon: Phone, color: 'text-purple-500' }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeChannel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveChannel(tab.id as any)}
              className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
                active 
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? tab.color : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Providers for the Active Channel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.filter(p => p.type === activeChannel).map(prov => {
          const isTesting = testingId === prov.id;
          const result = testResult[prov.id];

          return (
            <div 
              key={prov.id} 
              className={`p-5 bg-white dark:bg-slate-900 border rounded-xl shadow-sm space-y-4 transition-all duration-200 ${
                prov.isDefault 
                  ? 'border-blue-500 dark:border-blue-700 ring-2 ring-blue-500/10' 
                  : 'border-slate-200 dark:border-slate-850 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-500" />
                    {prov.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{prov.description}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSetActiveDefault(prov.id, prov.type)}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition cursor-pointer ${
                      prov.isDefault
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {prov.isDefault ? '● ACTIVE ROUTE' : 'Set Active'}
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                {prov.fields.map(f => (
                  <div key={f.key} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[9px] font-mono text-slate-400 uppercase">{f.label}</label>
                      {f.type === 'password' && (
                        <button 
                          onClick={() => toggleShowSecret(prov.id)} 
                          className="text-[9px] font-mono text-blue-500 hover:underline cursor-pointer"
                        >
                          {showSecrets[prov.id] ? <EyeOff className="w-3 h-3 inline mr-0.5" /> : <Eye className="w-3 h-3 inline mr-0.5" />}
                          {showSecrets[prov.id] ? 'Hide' : 'Reveal'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={f.type === 'password' && !showSecrets[prov.id] ? 'password' : 'text'}
                        value={f.value}
                        onChange={(e) => handleFieldChange(prov.id, f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs p-2 rounded-lg font-mono text-slate-850 dark:text-slate-150 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Connection Status and Controls */}
              {result && (
                <div className={`p-2.5 rounded-lg border text-[10px] font-mono flex items-start gap-2 ${
                  result.success 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  <span className="mt-0.5 font-bold">{result.success ? '✓ SUCCESS:' : '⚠ FAILURE:'}</span>
                  <p>{result.message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection(prov.id)}
                  disabled={isTesting}
                  className="py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? <RefreshCw className="w-3 h-3 animate-spin text-blue-500" /> : <Play className="w-3 h-3 text-blue-500" />}
                  Test Connection
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveConfig(prov.id)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Save Active Keys
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Developer Section: Future Extensibility Platform */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wide flex items-center gap-1.5 font-mono">
            <Settings className="w-4 h-4 text-indigo-500" /> Future API Architectural Handshake
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Want to plug in a custom, newly released provider API? Map your webhook payload structures below to translate any CRM trigger event into a delivery command.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-850 font-mono text-xs">
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-[9px] uppercase text-slate-400 font-bold mb-1">CRM OUTBOUND WEBHOOK</label>
              <input 
                type="text" 
                readOnly
                value="POST /api/v1/outreach/trigger"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400 cursor-text"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase text-slate-400 font-bold mb-1">DYNAMIC PROVIDER MAPPER</label>
              <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2 rounded text-[10px]">
                <option value="custom_json">Universal JSON Schema</option>
                <option value="rest_headers">Custom Headers Mapping</option>
                <option value="twilio_compat">Twilio-Compatible Endpoint</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-8">
            <label className="block text-[9px] uppercase text-slate-400 font-bold mb-1">REAL-TIME WEBHOOK HANDSHAKE PLAYLOAD PREVIEW (JSON)</label>
            <pre className="bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-850 text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto leading-normal">
{`{
  "timestamp": "2026-07-06T01:17:03.000Z",
  "channel": "WHATSAPP",
  "provider": "META_WHATSAPP_CLOUD",
  "recipient": {
    "name": "{first_name}",
    "phone": "+919876543210"
  },
  "payload": {
    "body": "Hi {first_name}, Soham from SalesPilot here. Are you open next week?"
  },
  "callback_url": "https://salespilot.co/api/v1/outreach/delivery-receipt"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
