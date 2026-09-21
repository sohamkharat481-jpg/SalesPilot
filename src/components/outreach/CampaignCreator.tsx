import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Mail, Linkedin, MessageSquare, Phone, Plus, Trash2, 
  ChevronRight, Calendar, Clock, Globe, Shield, RefreshCw, AlertCircle, CheckSquare, Square, Users
} from 'lucide-react';
import { motion } from 'motion/react';

interface CampaignCreatorProps {
  onSaveCampaign: (campaign: any) => void;
  onCancel: () => void;
}

export function CampaignCreator({ onSaveCampaign, onCancel }: CampaignCreatorProps) {
  const [name, setName] = useState('');
  const [targetAudience, setTargetAudience] = useState('MARKETING_AGENCY');
  const [goal, setGoal] = useState('Lead Generation');
  const [channels, setChannels] = useState<string[]>(['email']);
  const [priority, setPriority] = useState('MEDIUM');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [maxMessagesPerDay, setMaxMessagesPerDay] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Real Database Leads state
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [autoStart, setAutoStart] = useState(true);

  // Fetch tenant qualified leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoadingLeads(true);
        const token = localStorage.getItem('salespilot_token') || localStorage.getItem('salespilot_session_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/v1/leads', { headers });
        const data = await res.json();
        if (data && data.leads) {
          // Filter leads with valid email and not unsubscribed/suppressed
          const valid = data.leads.filter((l: any) => {
            if (!l.email || !l.email.includes('@')) return false;
            const st = (l.status || '').toUpperCase();
            return !['UNSUBSCRIBED', 'SUPPRESSED', 'BOUNCED', 'NOT_INTERESTED', 'CONVERTED'].includes(st);
          });
          setAvailableLeads(valid);
          // Select all valid leads by default
          setSelectedLeadIds(valid.map((l: any) => l.id));
        }
      } catch (err) {
        console.error('Failed to fetch leads for campaign selection:', err);
      } finally {
        setLoadingLeads(false);
      }
    };
    fetchLeads();
  }, []);

  const toggleSelectAllLeads = () => {
    if (selectedLeadIds.length === availableLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(availableLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(item => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const toggleChannel = (ch: string) => {
    if (channels.includes(ch)) {
      if (channels.length > 1) {
        setChannels(channels.filter(item => item !== ch));
      }
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleUpdateStepType = (id: string, type: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, type, subject: type === 'EMAIL' ? 'Quick question' : '' } : s));
  };

  // Configurable follow-up sequence steps
  const [steps, setSteps] = useState([
    { id: '1', stepNumber: 1, type: 'EMAIL', delayDays: 0, subject: 'Scaling Outbound Pipelines for {{company}}', bodyTemplate: 'Hi {{first_name}},\n\nI was reviewing {{company}} and loved your market focus.\n\nQuick question: Are you open for a 5-minute chat regarding automated client acquisition pipelines for {{industry}}?\n\nBest,\nSoham | SalesPilot AI' },
    { id: '2', stepNumber: 2, type: 'EMAIL', delayDays: 2, subject: 'Re: Scaling Outbound Pipelines for {{company}}', bodyTemplate: 'Hi {{first_name}},\n\nJust bumping this brief note. We helped similar {{industry}} companies scale warm booked calls by 3x.\n\nWould love to share a 2-minute video overview if interested.\n\nBest,\nSoham' },
    { id: '3', stepNumber: 3, type: 'EMAIL', delayDays: 5, subject: 'Case study: 14 Warm Meetings in 7 Days', bodyTemplate: 'Hi {{first_name}},\n\nThought you might find this relevant—our latest SDR automation generated 14 warm decision-maker meetings in 7 days.\n\nOpen to reviewing the blueprint for {{company}}?\n\nBest,\nSoham' }
  ]);

  const handleAddStep = () => {
    const nextNum = steps.length + 1;
    setSteps([...steps, {
      id: `${Date.now()}`,
      stepNumber: nextNum,
      type: 'EMAIL',
      delayDays: nextNum === 2 ? 2 : nextNum === 3 ? 5 : 7,
      subject: `Follow-up #${nextNum} regarding {{company}}`,
      bodyTemplate: `Hi {{first_name}},\n\nFollowing up regarding our outbound automation blueprint for {{company}}.\n\nBest,\nSoham`
    }]);
  };

  const handleDeleteStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== id).map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
    }
  };

  const handleUpdateStepValue = (id: string, key: string, value: any) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [key]: value } : s));
  };

  const handleAutoGenerateAI = async () => {
    if (!name) {
      setError('Please provide a campaign name first to guide the AI writer.');
      return;
    }
    setError('');
    setIsGenerating(true);
    try {
      const res = await fetch('/api/v1/outreach/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: name, leadIndustry: targetAudience, stepNumber: 1 })
      });
      const data = await res.json();
      if (data && data.subject && data.body) {
        setSteps(prev => prev.map((s, idx) => idx === 0 ? { ...s, subject: data.subject, bodyTemplate: data.body } : s));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to trigger Gemini API. Keeping existing templates.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !name.trim()) {
      setError('Campaign Name is required');
      return;
    }
    if (selectedLeadIds.length === 0) {
      setError('Please select at least 1 lead from your database to launch this campaign.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('salespilot_token') || localStorage.getItem('salespilot_session_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Create Campaign
      const createRes = await fetch('/api/v1/outreach/campaigns', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          targetLeadIds: selectedLeadIds,
          dailyLimit: maxMessagesPerDay,
          steps: steps.map(s => ({
            stepNumber: s.stepNumber,
            delayDays: s.delayDays,
            subjectTemplate: s.subject,
            bodyTemplate: s.bodyTemplate
          }))
        })
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.campaign) {
        throw new Error(createData.error || 'Failed to create campaign.');
      }

      const campaign = createData.campaign;

      // 2. Start Campaign if requested
      if (autoStart) {
        const startRes = await fetch(`/api/v1/outreach/campaigns/${campaign.id}/start`, {
          method: 'POST',
          headers
        });
        const startData = await startRes.json();
        if (!startRes.ok) {
          console.warn('Notice starting campaign:', startData.error);
        }
      }

      onSaveCampaign(campaign);
    } catch (err: any) {
      console.error('[CAMPAIGN CREATOR ERROR]', err);
      setError(err.message || 'Failed to save campaign sequence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-6 shadow-sm animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Create Outbound Campaign Sequence</h2>
          <p className="text-xs text-slate-500">Configure parameters and compile AI-generated personalized copies.</p>
        </div>
        <button 
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-mono px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/50 rounded-lg text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Campaign Name</label>
            <input 
              type="text" 
              placeholder="e.g. Bangalore Real Estate Agency Pitch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Target Audience</label>
              <select 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="MARKETING_AGENCY">Marketing Agency</option>
                <option value="SAAS">SaaS Startup</option>
                <option value="IT_COMPANY">IT & Infrastructure</option>
                <option value="WEB_DEV">Web Development</option>
                <option value="REAL_ESTATE">Real Estate</option>
                <option value="RECRUITMENT">Recruitment</option>
                <option value="GENERAL">General B2B</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Daily Window Limit</label>
              <select 
                value={maxMessagesPerDay}
                onChange={(e) => setMaxMessagesPerDay(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value={10}>10 emails/day (Warmup)</option>
                <option value={20}>20 emails/day (Recommended)</option>
                <option value={35}>35 emails/day (Growth)</option>
                <option value={50}>50 emails/day (Max Safe)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lead Picker Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Target Recipient Leads ({selectedLeadIds.length} / {availableLeads.length} Selected)
              </label>
            </div>
            {availableLeads.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllLeads}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                {selectedLeadIds.length === availableLeads.length ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                {selectedLeadIds.length === availableLeads.length ? 'Deselect All' : 'Select All Leads'}
              </button>
            )}
          </div>

          {loadingLeads ? (
            <div className="py-4 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" /> Loading database leads...
            </div>
          ) : availableLeads.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
              No eligible leads found in database. Run the Lead Generator or add leads first before launching outreach.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {availableLeads.map((lead: any) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <div 
                    key={lead.id}
                    onClick={() => toggleSelectLead(lead.id)}
                    className={`pt-1.5 flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition text-xs ${
                      isSelected 
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`}</span>
                        <span className="text-slate-500 ml-1.5">({lead.company || lead.companyName || 'N/A'})</span>
                        <p className="text-[10px] text-slate-400 font-mono">{lead.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      {lead.status || 'QUALIFIED'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Channels Selector */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Communication Channels (Connect multiple to build multi-channel streams)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'email', name: 'Email sequence', icon: Mail, color: 'text-blue-500' },
              { id: 'linkedin', name: 'LinkedIn Automation', icon: Linkedin, color: 'text-indigo-500' },
              { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-500' },
              { id: 'sms', name: 'SMS Blast', icon: Phone, color: 'text-purple-500' }
            ].map(ch => {
              const Icon = ch.icon;
              const active = channels.includes(ch.id);
              return (
                <button
                  type="button"
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`p-3 border rounded-xl flex items-center gap-2.5 transition text-left cursor-pointer ${
                    active 
                      ? 'bg-white dark:bg-slate-900 border-blue-500 dark:border-blue-700 shadow-sm ring-1 ring-blue-500/10' 
                      : 'bg-transparent border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${ch.color}`} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{ch.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority & Scheduling parameters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Priority Tier</label>
            <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-850 p-1 border border-slate-200 dark:border-slate-800 rounded-lg">
              {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1 text-[9px] font-mono font-bold rounded cursor-pointer transition ${
                    priority === p 
                      ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Start Date</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 col-span-2">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Time / Timezone</label>
              <input 
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Max Msgs/Day</label>
              <input 
                type="number"
                value={maxMessagesPerDay}
                onChange={(e) => setMaxMessagesPerDay(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Follow-up sequence timeline configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-850 pt-5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Configurable Follow-up Sequence</h3>
              <p className="text-[11px] text-slate-500">Define delays and templates. Follow-up sequence stops automatically upon receiving replies.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoGenerateAI}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 dark:text-blue-400 text-xs font-mono font-bold rounded-lg border border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Gemini Sequence Write
              </button>
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <select
                      value={step.type}
                      onChange={(e) => handleUpdateStepType(step.id, e.target.value as any)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="EMAIL">Email</option>
                      <option value="LINKEDIN_MESSAGE">LinkedIn Message</option>
                      <option value="LINKEDIN_CONNECT">LinkedIn Connection Request</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-400">Delay:</span>
                      <input 
                        type="number"
                        value={step.delayDays}
                        onChange={(e) => handleUpdateStepValue(step.id, 'delayDays', Number(e.target.value))}
                        className="w-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs font-mono text-center text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-[10px] font-mono text-slate-400">days</span>
                    </div>

                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(step.id)}
                        className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {step.type === 'EMAIL' && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-slate-400">Subject line</label>
                    <input 
                      type="text"
                      placeholder="e.g. Scaling client acquisition for {company}"
                      value={step.subject}
                      onChange={(e) => handleUpdateStepValue(step.id, 'subject', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[9px] font-mono uppercase text-slate-400">Copy Template (Supported Tags: {'{first_name}'}, {'{company}'}, {'{title}'})</label>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Write template or use Gemini Sequence Writer above."
                    value={step.bodyTemplate}
                    onChange={(e) => handleUpdateStepValue(step.id, 'bodyTemplate', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono leading-normal text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> Compliant outbound scheduling.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition cursor-pointer"
            >
              Save Outreach Campaign
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
