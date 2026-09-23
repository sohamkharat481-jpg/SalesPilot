import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Mail, Linkedin, MessageSquare, Plus, CheckCircle, 
  Clock, AlertCircle, RefreshCw, Send, HelpCircle, ArrowRight,
  Sparkles, Calendar, Heart, Shield, Library, History, LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../authentication/AuthContext';

// Subcomponents
import { OutreachDashboard } from './outreach/OutreachDashboard';
import { CampaignCreator } from './outreach/CampaignCreator';
import { MessagePersonalizer } from './outreach/MessagePersonalizer';
import { MessageApprover } from './outreach/MessageApprover';
import { ReplyAnalyzer } from './outreach/ReplyAnalyzer';
import { TemplateLibrary } from './outreach/TemplateLibrary';
import { OutreachHistory } from './outreach/OutreachHistory';
import { ProviderHub } from './outreach/ProviderHub';
import { TestEmailModal } from './outreach/TestEmailModal';

interface OutreachViewProps {
  initialCampaigns?: any[];
}

export function OutreachView({ initialCampaigns }: OutreachViewProps = {}) {
  const { user, organization } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<string>('dashboard'); // dashboard, creator, personalizer, approver, analyzer, templates, history
  const [campaigns, setCampaigns] = useState<any[]>(initialCampaigns && initialCampaigns.length > 0 ? initialCampaigns : []);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Outbox Approvals Queue State
  const [queuedMessages, setQueuedMessages] = useState<any[]>([]);

  // Custom Templates state
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);

  // Controlled Test Outreach Modal state
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);

  // Synchronize campaigns when initialCampaigns prop updates from App.tsx
  useEffect(() => {
    if (initialCampaigns && initialCampaigns.length > 0) {
      setCampaigns(prev => {
        if (!prev || prev.length === 0) return initialCampaigns;
        const map = new Map(prev.map(c => [c.id || c.campaignId, c]));
        initialCampaigns.forEach(c => {
          const cid = c.id || c.campaignId;
          if (!map.has(cid)) map.set(cid, c);
        });
        return Array.from(map.values());
      });
    }
  }, [initialCampaigns]);

  // Fetch campaigns and outreach history from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('salespilot_token') || localStorage.getItem('salespilot_session_token');
      const verifiedOrgId = organization?.id || user?.organizationId;

      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (verifiedOrgId) {
        headers['x-organization-id'] = verifiedOrgId;
      }

      // Safe JSON fetch helper
      const safeFetchJson = async (url: string) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return null;
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      const extractCampaigns = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.campaigns) && data.campaigns.length > 0) return data.campaigns;
        if (Array.isArray(data.outreachCampaigns) && data.outreachCampaigns.length > 0) return data.outreachCampaigns;
        return [];
      };

      // Fetch Outreach Campaigns
      let loadedCampaigns: any[] = [];
      const campData = await safeFetchJson('/api/v1/outreach/campaigns');
      const ocList = extractCampaigns(campData);
      if (ocList.length > 0) {
        loadedCampaigns = ocList;
      } else {
        // Fallback to general campaigns endpoint
        const fallbackData = await safeFetchJson('/api/v1/campaigns');
        const fbList = extractCampaigns(fallbackData);
        if (fbList.length > 0) {
          loadedCampaigns = fbList;
        }
      }

      if (loadedCampaigns.length > 0) {
        setCampaigns(prev => {
          const map = new Map(prev.map(c => [c.id || c.campaignId, c]));
          loadedCampaigns.forEach(c => map.set(c.id || c.campaignId, c));
          return Array.from(map.values());
        });
      }

      // Fetch History
      const histData = await safeFetchJson('/api/v1/outreach/history');
      if (histData && histData.history) {
        setHistory(histData.history);
      }

      // Fetch Queued Outbox Messages
      const qData = await safeFetchJson('/api/v1/outreach/queue');
      if (qData && qData.queue) {
        setQueuedMessages(qData.queue);
      }
    } catch (err) {
      console.warn('Failed to load outreach engine details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, organization?.id]);

  const handleToggleCampaignStatus = async (id: string) => {
    const current = campaigns.find(c => c.id === id);
    if (!current) return;
    const nextStatus = current.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const endpointAction = nextStatus === 'ACTIVE' ? 'resume' : 'pause';

    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: nextStatus };
      }
      return c;
    }));

    try {
      const token = localStorage.getItem('salespilot_token') || localStorage.getItem('salespilot_session_token');
      const storedOrg = localStorage.getItem('salespilot_org');
      let orgId = 'org_salespilot_lifetime';
      if (storedOrg) {
        try {
          const parsed = JSON.parse(storedOrg);
          if (parsed?.id) orgId = parsed.id;
        } catch {
          // ignore
        }
      }
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-organization-id': orgId
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/outreach/campaigns/${id}/${endpointAction}`, {
        method: 'POST',
        headers
      });
    } catch (err) {
      console.error('Failed to toggle campaign status on server:', err);
    }
  };

  const handleSaveCampaign = (newCamp: any) => {
    setCampaigns(prev => [newCamp, ...prev]);
    setActiveSubTab('dashboard');
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const token = localStorage.getItem('salespilot_token') || localStorage.getItem('salespilot_session_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/outreach/campaigns/${id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete campaign.');
        return;
      }
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting campaign:', err);
    }
  };

  // Queue an approved message from Personalizer to the Outbox queue
  const handleQueueApprovedMessage = (msg: any) => {
    const newQueuedItem = {
      id: `q_${Date.now()}`,
      leadName: msg.leadName,
      company: msg.company,
      channel: msg.channel,
      subject: msg.subject,
      body: msg.body,
      status: 'PENDING',
      timestamp: msg.timestamp
    };
    setQueuedMessages(prev => [newQueuedItem, ...prev]);
    
    // Switch to manual approver view so they can see their queued messages
    setActiveSubTab('approver');
  };

  // Approver Action: Approve
  const handleApproveMessage = async (id: string) => {
    const msg = queuedMessages.find(m => m.id === id);
    if (!msg) return;

    // Optimistically update status to Approved
    setQueuedMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'APPROVED' } : m));

    try {
      const res = await fetch(`/api/v1/outreach/queue/${id}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to log approved audit item:', err);
    }
  };

  // Approver Action: Reject
  const handleRejectMessage = async (id: string) => {
    const msg = queuedMessages.find(m => m.id === id);
    if (!msg) return;

    // Optimistically update status to Rejected
    setQueuedMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'REJECTED' } : m));

    try {
      const res = await fetch(`/api/v1/outreach/queue/${id}/reject`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMessageContent = async (id: string, updatedBody: string) => {
    setQueuedMessages(prev => prev.map(m => m.id === id ? { ...m, body: updatedBody } : m));
    try {
      await fetch(`/api/v1/outreach/queue/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: updatedBody })
      });
    } catch (err) {
      console.error('Failed to save message body edits:', err);
    }
  };

  const handleAddNewCustomTemplate = (template: any) => {
    setCustomTemplates(prev => [template, ...prev]);
  };

  // Log meeting scheduled via AI Reply Analyzer
  const handleLogCRMMeeting = async (meeting: any) => {
    try {
      const res = await fetch('/api/v1/outreach/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CALENDAR',
          event: 'Google Meet Booked',
          leadName: meeting.leadName,
          company: meeting.company,
          details: `AI Reply Analyzer automatically scheduled meeting on slot "${meeting.timeSlot}". Agenda: ${meeting.agenda}`,
          status: 'Meeting Booked'
        })
      });
      const loggedEvent = await res.json();
      setHistory(prev => [loggedEvent, ...prev]);
    } catch (err) {
      console.error('Failed to record calendar meeting:', err);
    }
  };

  return (
    <div id="outreach_view" className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            AI Outreach Engine <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-900/50 font-bold">MULTICHANNEL v2.5</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-normal max-w-xl">
            Automate personalized outbound campaigns. AI Personalized draft generators, reply classification, custom queues, and real-time auditable timelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsTestEmailModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" /> Send Test Email
          </button>
          <button 
            onClick={() => setActiveSubTab('creator')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Campaign Sequence
          </button>
        </div>
      </div>

      {/* Modern Horizontal Navigation Bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'dashboard', label: 'Outreach Dashboard', icon: LayoutDashboard },
          { id: 'personalizer', label: 'AI Personalizer', icon: Sparkles },
          { id: 'approver', label: 'Outbox Queue', icon: Mail, badge: queuedMessages.filter(m => m.status === 'PENDING').length },
          { id: 'analyzer', label: 'AI Reply Analyzer', icon: MessageSquare },
          { id: 'templates', label: 'Template Vault', icon: Library },
          { id: 'integrations', label: 'Modular Providers', icon: Shield },
          { id: 'history', label: 'Audit Timeline', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer ${
                active 
                  ? 'bg-slate-900 text-white dark:bg-slate-850 border border-slate-800 dark:border-slate-700 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850/50'
              }`}
            >
              <Icon className="w-4 h-4 text-slate-400" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-rose-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Render Subcomponents dynamically based on selection */}
      <div className="pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs font-mono text-slate-500">Compiling active copywriting pools...</span>
          </div>
        ) : (
          <>
            {activeSubTab === 'dashboard' && (
              <OutreachDashboard 
                campaigns={campaigns}
                onToggleStatus={handleToggleCampaignStatus}
                onCreateNewClick={() => setActiveSubTab('creator')}
                onDeleteCampaign={handleDeleteCampaign}
              />
            )}

            {activeSubTab === 'creator' && (
              <CampaignCreator 
                onSaveCampaign={handleSaveCampaign}
                onCancel={() => setActiveSubTab('dashboard')}
              />
            )}

            {activeSubTab === 'personalizer' && (
              <MessagePersonalizer 
                onQueueApprovedMessage={handleQueueApprovedMessage}
                onSaveAsTemplate={(tpl) => {
                  handleAddNewCustomTemplate(tpl);
                  alert('Outbound template saved to vault!');
                }}
              />
            )}

            {activeSubTab === 'approver' && (
              <MessageApprover 
                queuedMessages={queuedMessages}
                onApprove={handleApproveMessage}
                onReject={handleRejectMessage}
                onUpdateMessage={handleUpdateMessageContent}
              />
            )}

            {activeSubTab === 'analyzer' && (
              <ReplyAnalyzer 
                onLogCRMMeeting={handleLogCRMMeeting}
              />
            )}

            {activeSubTab === 'templates' && (
              <TemplateLibrary 
                customTemplates={customTemplates}
                onAddNewCustomTemplate={handleAddNewCustomTemplate}
              />
            )}

            {activeSubTab === 'integrations' && (
              <ProviderHub />
            )}

            {activeSubTab === 'history' && (
              <OutreachHistory 
                history={history}
              />
            )}
          </>
        )}
      </div>

      {/* Controlled Test Outreach Modal */}
      <TestEmailModal 
        isOpen={isTestEmailModalOpen}
        onClose={() => setIsTestEmailModalOpen(false)}
        onSuccess={() => {
          fetchData(); // Refresh history timeline
        }}
      />
    </div>
  );
}
