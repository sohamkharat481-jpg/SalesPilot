import React, { useState } from 'react';
import { 
  Bell, Clock, CheckCircle2, AlertCircle, Sparkles, Send, Calendar
} from 'lucide-react';
import { Lead } from '../../types';

interface AiRemindersQueueProps {
  leads: Lead[];
  triggerToast: (msg: string) => void;
}

export function AiRemindersQueue({ leads, triggerToast }: AiRemindersQueueProps) {
  const [reminders, setReminders] = useState<any[]>([
    {
      id: 'rem_1',
      title: 'Follow up with Satya Nadella on API Sheet',
      leadName: 'Satya Nadella',
      company: 'Microsoft',
      dueTime: 'Today at 4:00 PM',
      type: 'voice-call',
      priority: 'high',
      status: 'pending'
    },
    {
      id: 'rem_2',
      title: 'Send demo calendar invite to Patrick Collison',
      leadName: 'Patrick Collison',
      company: 'Stripe',
      dueTime: 'Tomorrow at 10:30 AM',
      type: 'email',
      priority: 'medium',
      status: 'pending'
    },
    {
      id: 'rem_3',
      title: 'Review call transcript & action items for Yamini Rangan',
      leadName: 'Yamini Rangan',
      company: 'HubSpot',
      dueTime: 'July 29 at 2:00 PM',
      type: 'task',
      priority: 'high',
      status: 'pending'
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [selectedLead, setSelectedLead] = useState('');

  const handleAddReminder = () => {
    if (!newTitle.trim()) return;
    const lObj = leads.find(l => l.id === selectedLead);
    const item = {
      id: 'rem_' + Date.now(),
      title: newTitle,
      leadName: lObj ? `${lObj.firstName} ${lObj.lastName}` : 'Prospect',
      company: lObj?.company || 'CRM Contact',
      dueTime: 'Tomorrow at 9:00 AM',
      type: 'voice-call',
      priority: 'medium',
      status: 'pending'
    };
    setReminders([item, ...reminders]);
    setNewTitle('');
    triggerToast('🔔 AI Reminder scheduled!');
  };

  const handleCompleteReminder = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, status: 'completed' } : r));
    triggerToast('Reminder marked completed!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-slate-100">
      {/* LEFT COL: ADD REMINDER FORM (5 COLS) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="text-xs font-bold uppercase text-white">Schedule AI Voice Reminder</h3>
        </div>

        <p className="text-xs text-slate-400">
          Set automated voice call or follow-up triggers for your CRM leads.
        </p>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Associate Lead</label>
          <select
            value={selectedLead}
            onChange={(e) => setSelectedLead(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
          >
            <option value="">-- Choose Lead --</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>{l.firstName} {l.lastName} ({l.company})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Reminder Description</label>
          <input
            type="text"
            placeholder="e.g. Call back regarding custom onboarding contract..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>

        <button
          onClick={handleAddReminder}
          disabled={!newTitle.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" /> Add AI Reminder
        </button>
      </div>

      {/* RIGHT COL: REMINDERS QUEUE (7 COLS) */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Pending Reminders Queue ({reminders.filter(r => r.status === 'pending').length})
          </h3>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {reminders.map((rem) => {
            const isDone = rem.status === 'completed';
            return (
              <div
                key={rem.id}
                className={`p-4 rounded-xl border transition flex items-center justify-between text-xs ${
                  isDone ? 'bg-slate-950 border-slate-800 text-slate-500 line-through' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{rem.title}</span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[9px] uppercase font-bold">
                      {rem.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Target: <strong className="text-slate-300">{rem.leadName}</strong> ({rem.company}) • Due: <span className="text-indigo-400 font-bold">{rem.dueTime}</span>
                  </p>
                </div>

                {!isDone && (
                  <button
                    onClick={() => handleCompleteReminder(rem.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
