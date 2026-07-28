import React, { useState } from 'react';
import { 
  Calendar, Sparkles, User, CheckCircle2, Copy, BookOpen, Clock, HelpCircle, Lightbulb
} from 'lucide-react';
import { Lead, Appointment } from '../../types';

interface CalendarAssistantAndPrepProps {
  leads: Lead[];
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  triggerToast: (msg: string) => void;
}

export function CalendarAssistantAndPrep({
  leads,
  appointments,
  setAppointments,
  triggerToast
}: CalendarAssistantAndPrepProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [meetingTitle, setMeetingTitle] = useState<string>('Sales Demo & Product Discovery');
  const [meetingDateTime, setMeetingDateTime] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  
  // AI Prep State
  const [isGeneratingPrep, setIsGeneratingPrep] = useState<boolean>(false);
  const [briefingResult, setBriefingResult] = useState<any | null>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  // Schedule Appointment directly into SalesPilot Calendar
  const handleScheduleAppointment = () => {
    if (!selectedLead) {
      triggerToast('Please select a lead first.');
      return;
    }

    const newApt: Appointment = {
      id: 'apt-' + Math.random().toString(36).substr(2, 9),
      leadId: selectedLead.id,
      leadName: `${selectedLead.firstName} ${selectedLead.lastName}`,
      company: selectedLead.company,
      email: selectedLead.email,
      dateTime: new Date(meetingDateTime).toISOString(),
      durationMins: 30,
      status: 'SCHEDULED',
      meetingLink: `https://meet.google.com/sp-demo-${selectedLead.id}`,
      notes: `Meeting scheduled via AI Calendar Assistant. Goal: ${meetingTitle}`,
      timezone: 'Asia/Kolkata',
      googleSynced: true
    };

    setAppointments(prev => [...prev, newApt]);
    triggerToast('🗓️ Meeting scheduled and synced to SalesPilot Calendar!');
  };

  // Generate Pre-Meeting Briefing Dossier
  const handleGenerateBriefing = async () => {
    setIsGeneratingPrep(true);
    try {
      const res = await fetch('/api/meeting-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId || leads[0]?.id,
          meetingTitle,
          dateTime: meetingDateTime
        })
      });

      const data = await res.json();
      if (data.success) {
        setBriefingResult(data.briefing);
        triggerToast('AI Pre-Meeting Dossier generated!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-slate-100">
      {/* LEFT COL: CALENDAR SCHEDULER & BRIEFING TRIGGER (5 COLS) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase text-white">Calendar Assistant & Slot Booking</h3>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Book sales demo slots directly in SalesPilot Calendar and generate AI pre-meeting dossiers with prospect background and counter-objection cheat sheets.
        </p>

        {/* SELECT LEAD */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Target Lead</label>
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
          >
            <option value="">-- Choose Lead from CRM --</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.firstName} {l.lastName} • {l.company}
              </option>
            ))}
          </select>
        </div>

        {/* MEETING TITLE */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Meeting Objective / Title</label>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>

        {/* DATE TIME */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Date & Time Slot</label>
          <input
            type="datetime-local"
            value={meetingDateTime}
            onChange={(e) => setMeetingDateTime(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-indigo-300"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleScheduleAppointment}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Book Slot in SalesPilot Calendar
          </button>

          <button
            onClick={handleGenerateBriefing}
            disabled={isGeneratingPrep}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isGeneratingPrep ? 'Analyzing Prospect History...' : 'Generate AI Pre-Meeting Briefing'}
          </button>
        </div>

        {/* UPCOMING MEETINGS LIST SUMMARY */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Upcoming Calendar Meetings ({appointments.length})
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {appointments.map(apt => (
              <div key={apt.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-0.5">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>{apt.leadName}</span>
                  <span className="text-[10px] text-emerald-400">{apt.status}</span>
                </div>
                <p className="text-[10px] text-slate-400">{apt.company} • {new Date(apt.dateTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COL: PRE-MEETING AI BRIEFING DOSSIER (7 COLS) */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-xs font-bold uppercase text-white">Pre-Meeting Dossier & Cheat Sheet</h3>
          </div>
        </div>

        {!briefingResult ? (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">Click 'Generate AI Pre-Meeting Briefing'</p>
            <p className="text-[11px]">Creates personalized prospect summary, drivers, talking points, and counter-objections.</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-xl space-y-2">
              <span className="font-bold text-purple-400 uppercase text-[10px]">Prospect & Company Overview</span>
              <p className="text-slate-200 leading-relaxed">{briefingResult.prospectSummary}</p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-indigo-400 uppercase text-[10px]">Core Deal Drivers</span>
              <p className="text-slate-300 leading-relaxed">{briefingResult.dealContext}</p>
            </div>

            {briefingResult.recommendedTalkingPoints && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-emerald-400 uppercase text-[10px]">Recommended Talking Points</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {briefingResult.recommendedTalkingPoints.map((tp: string, i: number) => (
                    <li key={i}>{tp}</li>
                  ))}
                </ul>
              </div>
            )}

            {briefingResult.objectionCheatSheet && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-amber-400 uppercase text-[10px]">Objection Counter Cheat-Sheet</span>
                <div className="space-y-2">
                  {briefingResult.objectionCheatSheet.map((item: any, i: number) => (
                    <div key={i} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <p className="text-rose-400 font-bold">Objection: "{item.objection}"</p>
                      <p className="text-emerald-300">Strategy: {item.counterStrategy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {briefingResult.targetCallOutcome && (
              <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl space-y-1">
                <span className="font-bold text-indigo-300 uppercase text-[10px]">Target Call Outcome</span>
                <p className="text-white font-bold">{briefingResult.targetCallOutcome}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
