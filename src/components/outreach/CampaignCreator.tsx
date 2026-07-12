import React, { useState } from 'react';
import { 
  Sparkles, Mail, Linkedin, MessageSquare, Phone, Plus, Trash2, 
  ChevronRight, Calendar, Clock, Globe, Shield, RefreshCw, AlertCircle
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
  const [maxMessagesPerDay, setMaxMessagesPerDay] = useState(150);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Configurable follow-up sequence steps
  const [steps, setSteps] = useState([
    { id: '1', stepNumber: 1, type: 'EMAIL', delayDays: 0, subject: 'Scaling Client Acquisition', bodyTemplate: 'Hi {first_name},\n\nI was looking at {company} and loved your branding work.\n\nQuick question: Are you open for a brief 5-minute chat regarding custom automated client pipelines?\n\nBest,\nSalesPilot AI' },
    { id: '2', stepNumber: 2, type: 'LINKEDIN_MESSAGE', delayDays: 3, subject: '', bodyTemplate: 'Hey {first_name} - sent you a brief email. Would love to connect and share our automated outbound blueprint!' }
  ]);

  const toggleChannel = (ch: string) => {
    if (channels.includes(ch)) {
      if (channels.length > 1) {
        setChannels(channels.filter(item => item !== ch));
      }
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleAddStep = () => {
    const nextNum = steps.length + 1;
    const isEmail = channels.includes('email');
    setSteps([...steps, {
      id: `${Date.now()}`,
      stepNumber: nextNum,
      type: isEmail ? 'EMAIL' : 'LINKEDIN_MESSAGE',
      delayDays: nextNum === 3 ? 7 : 14,
      subject: isEmail ? 'Just bumping this' : '',
      bodyTemplate: `Hi {first_name},\n\nJust bumping this regarding our automation blueprint.\n\nBest,\nSalesPilot`
    }]);
  };

  const handleDeleteStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== id).map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
    }
  };

  const handleUpdateStepType = (id: string, type: 'EMAIL' | 'LINKEDIN_MESSAGE' | 'LINKEDIN_CONNECT') => {
    setSteps(steps.map(s => s.id === id ? { ...s, type, subject: type === 'EMAIL' ? 'Quick question' : '' } : s));
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
      const res = await fetch('/api/v1/ai/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignName: name, targetAudience })
      });
      const data = await res.json();
      if (data && data.steps && data.steps.length > 0) {
        setSteps(data.steps.map((s: any, idx: number) => ({
          id: s.id || `${Date.now()}_${idx}`,
          stepNumber: idx + 1,
          type: s.type || 'EMAIL',
          delayDays: s.delayDays || (idx === 0 ? 0 : idx === 1 ? 3 : 7),
          subject: s.subject || '',
          bodyTemplate: s.bodyTemplate || ''
        })));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to trigger Gemini API. Loaded default premium copywriting sequence instead.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Campaign Name is required');
      return;
    }

    onSaveCampaign({
      name,
      targetAudience,
      goal,
      channels,
      priority,
      startDate,
      scheduleTime,
      timezone,
      maxMessagesPerDay,
      steps,
      status: 'ACTIVE',
      totalSent: 0,
      totalOpened: 0,
      totalReplied: 0,
      createdAt: new Date().toISOString()
    });
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
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Campaign Goal</label>
              <select 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="Lead Generation">Lead Gen</option>
                <option value="Talent Acquisition">Talent Hiring</option>
                <option value="Deal Closing">Deal Closing</option>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="Consultation Booking">Book Demos</option>
              </select>
            </div>
          </div>
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
