import React, { useState } from 'react';
import { 
  X, Phone, User, Building, Calendar, Clock, Shield, Edit3, 
  Check, FileText, History, Info, Smartphone, Mail
} from 'lucide-react';
import { ManualCallActivity, ManualCallAuditEntry } from '../../types/voice';

interface CallDetailDrawerProps {
  callId: string;
  onClose: () => void;
  onNotesUpdated?: () => void;
}

export const CallDetailDrawer: React.FC<CallDetailDrawerProps> = ({
  callId,
  onClose,
  onNotesUpdated
}) => {
  const [call, setCall] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit notes state
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [notesText, setNotesText] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Follow-up scheduling state inside CallDetailDrawer
  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);
  const [scheduleTitle, setScheduleTitle] = useState<string>('');
  const [scheduleDueAt, setScheduleDueAt] = useState<string>('');
  const [schedulePriority, setSchedulePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [scheduling, setScheduling] = useState<boolean>(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<boolean>(false);

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!call || !scheduleTitle || !scheduleDueAt) return;

    setScheduling(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/follow-ups', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          leadId: call.leadId,
          callId: call.id,
          title: scheduleTitle,
          description: `Follow-up scheduled from Call Detail Drawer. Call outcome: ${call.outcome || 'None'}.`,
          dueAt: new Date(scheduleDueAt).toISOString(),
          priority: schedulePriority,
          source: 'MANUAL_CALL'
        })
      });

      const data = await res.json();
      if (data.success) {
        setScheduleSuccess(true);
        setShowScheduleForm(false);
        setTimeout(() => setScheduleSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to schedule follow-up');
      }
    } catch (err) {
      alert('Error scheduling follow-up');
    } finally {
      setScheduling(false);
    }
  };

  // Fetch Call Details
  const fetchCallDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/manual-calls/${callId}`, { headers });
      const data = await res.json();

      if (data.success && data.call) {
        setCall(data.call);
        setNotesText(data.call.notes || '');
      } else {
        setError(data.error || 'Failed to load call details.');
      }
    } catch (err: any) {
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (callId) {
      fetchCallDetails();
    }
  }, [callId]);

  // Handle Save Notes
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setSaveSuccess(false);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/manual-calls/${callId}/notes`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ notes: notesText })
      });

      const data = await res.json();
      if (data.success) {
        setCall(data.activity || { ...call, notes: notesText });
        setIsEditingNotes(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onNotesUpdated) onNotesUpdated();
      } else {
        alert(data.error || 'Failed to save notes.');
      }
    } catch (err) {
      alert('Network error while saving notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const getOutcomeBadgeClass = (outcome?: string) => {
    switch (outcome) {
      case 'Connected':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Interested':
        return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border-green-300 dark:border-green-800';
      case 'Meeting Requested':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'Call Back Later':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'No Answer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      case 'Busy':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'Not Interested':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Manual Call Details</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {callId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading call details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : call ? (
            <>
              {/* Status & Outcome Summary Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Status</span>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{call.status === 'INITIATED_FROM_SALES_PILOT' ? 'Initiated (Device Dialer)' : 'Completed'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Call Outcome</span>
                  <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getOutcomeBadgeClass(call.outcome)}`}>
                    <span>{call.outcome || 'Pending Outcome'}</span>
                  </div>
                </div>
              </div>

              {/* Outcome based smart prompt */}
              {call.outcome === 'Call Back Later' && !showScheduleForm && !scheduleSuccess && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">This call is marked "Call Back Later". Schedule a follow-up reminder?</span>
                  </div>
                  <button
                    onClick={() => {
                      setScheduleTitle(`Follow-up Call with ${call.leadName}`);
                      const tomorrow = new Date();
                      tomorrow.setHours(tomorrow.getHours() + 24);
                      const tzOffset = tomorrow.getTimezoneOffset() * 60000;
                      const localIso = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
                      setScheduleDueAt(localIso);
                      setShowScheduleForm(true);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    Schedule Follow-Up Task
                  </button>
                </div>
              )}

              {/* General Schedule Follow-up Success Alert */}
              {scheduleSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Follow-up task scheduled successfully!</span>
                </div>
              )}

              {/* Inline Schedule Form */}
              {showScheduleForm && (
                <form onSubmit={handleCreateFollowUp} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Schedule Follow-Up Task</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Task Title</label>
                      <input
                        type="text"
                        required
                        value={scheduleTitle}
                        onChange={e => setScheduleTitle(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleDueAt}
                        onChange={e => setScheduleDueAt(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                      <div className="flex space-x-2">
                        {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setSchedulePriority(p as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              schedulePriority === p
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowScheduleForm(false)}
                        className="px-3 py-1.5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={scheduling}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] shadow-xs cursor-pointer"
                      >
                        {scheduling ? 'Scheduling...' : 'Schedule Follow-Up'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Lead & Contact Details Card */}
              <div className="space-y-3 p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Contact Information</span>
                  <User className="w-4 h-4 text-slate-400" />
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Lead Name</span>
                    <strong className="text-slate-900 dark:text-white font-semibold text-sm">{call.leadName}</strong>
                    {call.leadTitle && <span className="block text-[11px] text-slate-500">{call.leadTitle}</span>}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Company</span>
                    <strong className="text-slate-900 dark:text-white font-semibold text-sm flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{call.company}</span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Target Phone Number</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{call.phoneNumber || call.leadPhone}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Lead Email</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono truncate block">{call.leadEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Call Snapshot & Technical Info */}
              <div className="space-y-3 p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Call Snapshot</span>
                  <Shield className="w-4 h-4 text-blue-500" />
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Calling Number Used</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-900 dark:text-white font-mono font-bold">{call.callingNumber || 'Default Phone'}</span>
                      <span title="Immutable Historical Snapshot">
                        <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Team Member</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">{call.userName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Started Time</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">
                      {new Date(call.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Call Duration</span>
                    <span className="text-slate-500 italic font-medium">Not available</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Call duration is not captured for native device dialer calls.</span>
                </div>
              </div>

              {/* Editable Call Notes */}
              <div className="space-y-3 p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Call Notes</span>
                  </h4>

                  {!isEditingNotes && (
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Notes</span>
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesText}
                      onChange={e => setNotesText(e.target.value)}
                      rows={3}
                      placeholder="Add key takeaways, next steps, or conversation notes..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNotesText(call.notes || '');
                          setIsEditingNotes(false);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center space-x-1"
                      >
                        {savingNotes ? <span>Saving...</span> : <span>Save Notes</span>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {call.notes ? (
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                        {call.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No notes recorded for this call.</p>
                    )}
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Notes saved successfully!</span>
                  </div>
                )}
              </div>

              {/* Complete Audit History */}
              <div className="space-y-3 p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Audit History</span>
                </h4>

                <div className="space-y-2">
                  {(call.auditHistory || []).map((entry: ManualCallAuditEntry, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{entry.action}</span>
                        <span className="text-slate-400 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">{entry.details}</p>
                      {entry.actorName && (
                        <span className="text-[10px] text-slate-400 block">By: {entry.actorName}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
