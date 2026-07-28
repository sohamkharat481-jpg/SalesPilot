import React, { useState } from 'react';
import { 
  FileText, Sparkles, Clock, Copy, CheckCircle2, User
} from 'lucide-react';
import { Lead } from '../../types';

interface CallRecord {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  direction: 'outbound' | 'incoming';
  status: 'completed' | 'no-answer' | 'busy' | 'failed' | 'voicemail';
  duration: number;
  recordingUrl: string;
  createdAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'warm' | 'defensive';
  objections?: string[];
  actionItems?: string[];
  aiScore?: number;
  transcript?: { speaker: 'agent' | 'customer'; text: string; timestamp: string }[];
}

interface CallSummariesAndTranscriptsProps {
  calls: CallRecord[];
  selectedCall: CallRecord | null;
  setSelectedCall: (call: CallRecord | null) => void;
  isLoadingCalls: boolean;
  isAnalyzing: boolean;
  leads: Lead[];
  triggerToast: (msg: string) => void;
}

export function CallSummariesAndTranscripts({
  calls,
  selectedCall,
  setSelectedCall,
  isLoadingCalls,
  triggerToast
}: CallSummariesAndTranscriptsProps) {
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'action-items' | 'follow-up'>('summary');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [generatedFollowUp, setGeneratedFollowUp] = useState<any | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const handleToggleAction = (item: string) => {
    if (completedActions.includes(item)) {
      setCompletedActions(completedActions.filter(i => i !== item));
    } else {
      setCompletedActions([...completedActions, item]);
      triggerToast('Action item marked complete!');
    }
  };

  const handleGenerateFollowUpCopy = async () => {
    if (!selectedCall) return;
    setIsGeneratingFollowUp(true);
    try {
      const transcriptStr = (selectedCall.transcript || []).map(t => `${t.speaker}: ${t.text}`).join('\n');
      const res = await fetch('/api/generate-follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedCall.leadId,
          transcriptText: transcriptStr,
          summaryText: `Call with ${selectedCall.leadName} (${selectedCall.company}). Sentiment: ${selectedCall.sentiment}. AI Score: ${selectedCall.aiScore}%`,
          channel: 'email'
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedFollowUp(data.followUp);
        triggerToast('Follow-up copy generated!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${label} to clipboard!`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-slate-100">
      {/* CALL HISTORY LIST (4 COLS) */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Call History ({calls.length})
          </h3>
          {isLoadingCalls && <span className="text-[10px] text-indigo-400 animate-pulse">Syncing...</span>}
        </div>

        <div className="space-y-2 max-h-[550px] overflow-y-auto">
          {calls.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No recorded calls yet. Place a call in the Console!
            </div>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                onClick={() => {
                  setSelectedCall(call);
                  setGeneratedFollowUp(null);
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                  selectedCall?.id === call.id
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    {call.leadName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{call.company}</span>
                  <span className="text-emerald-400 font-bold">{call.duration || 45}s</span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                  {call.aiScore !== undefined && (
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-bold">
                      Score: {call.aiScore}/100
                    </span>
                  )}
                  {call.sentiment && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded uppercase font-bold">
                      {call.sentiment}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DETAILED CALL ANALYSIS & TRANSCRIPT PLAYER (8 COLS) */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {!selectedCall ? (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-400">Select a call record to view AI summary & transcript</p>
            <p className="text-xs">Extracted action items, sentiment score, and follow-ups will display here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CALL METADATA BANNER */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {selectedCall.leadName}
                  <span className="text-xs font-normal text-slate-400">({selectedCall.company})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phone: {selectedCall.phone} • Duration: {selectedCall.duration}s • Direction: {selectedCall.direction.toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {selectedCall.aiScore !== undefined && (
                  <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block">AI Score</span>
                    <span className="text-sm font-bold text-indigo-400">{selectedCall.aiScore}%</span>
                  </div>
                )}
                {selectedCall.sentiment && (
                  <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block">Sentiment</span>
                    <span className="text-sm font-bold text-emerald-400 uppercase">{selectedCall.sentiment}</span>
                  </div>
                )}
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'summary' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Call Summary
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'transcript' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Full Transcript ({selectedCall.transcript?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('action-items')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'action-items' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Action Items ({selectedCall.actionItems?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('follow-up')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'follow-up' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Follow-Up Drafts
              </button>
            </div>

            {/* TAB 1: SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="font-bold text-indigo-400 block uppercase">Key Executive Takeaway</span>
                  <p className="text-slate-300 leading-relaxed">
                    Call completed with {selectedCall.leadName}. Discussed SalesPilot AI automation features and platform integration. Lead expressed interest in outbound email sequencing.
                  </p>
                </div>

                {selectedCall.objections && selectedCall.objections.length > 0 && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <span className="font-bold text-rose-400 block uppercase">Detected Objections</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCall.objections.map((obj, i) => (
                        <span key={i} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg">
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TRANSCRIPT */}
            {activeTab === 'transcript' && (
              <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
                {(!selectedCall.transcript || selectedCall.transcript.length === 0) ? (
                  <p className="text-slate-500 text-center py-6">No transcript recorded for this call.</p>
                ) : (
                  selectedCall.transcript.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl ${
                        item.speaker === 'agent'
                          ? 'bg-indigo-950/60 border border-indigo-800/40 text-indigo-200 ml-6'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold uppercase text-indigo-400">
                          {item.speaker === 'agent' ? '🤖 AI Voice Agent' : `👤 ${selectedCall.leadName}`}
                        </span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{item.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: ACTION ITEMS */}
            {activeTab === 'action-items' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Tasks automatically parsed by Gemini from the call dialogue and synced to CRM Lead Tasks:
                </p>

                {(!selectedCall.actionItems || selectedCall.actionItems.length === 0) ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    No action items generated for this call.
                  </div>
                ) : (
                  selectedCall.actionItems.map((item, idx) => {
                    const isDone = completedActions.includes(item);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleAction(item)}
                        className={`p-3.5 bg-slate-950 border rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                          isDone ? 'border-emerald-500/40 text-slate-500 line-through' : 'border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border ${isDone ? 'bg-emerald-500 text-black border-emerald-500' : 'border-slate-700'}`}>
                            {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span>{item}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                          Synced to CRM
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 4: FOLLOW-UP GENERATOR */}
            {activeTab === 'follow-up' && (
              <div className="space-y-4 text-xs">
                <button
                  onClick={handleGenerateFollowUpCopy}
                  disabled={isGeneratingFollowUp}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {isGeneratingFollowUp ? 'Drafting Follow-Up Copy...' : 'Generate Follow-Up Email & SMS Copy'}
                </button>

                {generatedFollowUp && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 uppercase">Email Follow-Up Draft</span>
                        <button
                          onClick={() => copyText(generatedFollowUp.body, 'Email Copy')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-white font-bold">Subject: {generatedFollowUp.subject}</p>
                      <p className="text-slate-300 whitespace-pre-line leading-relaxed">{generatedFollowUp.body}</p>
                    </div>

                    {generatedFollowUp.smsVersion && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 uppercase">SMS Text Draft</span>
                          <button
                            onClick={() => copyText(generatedFollowUp.smsVersion, 'SMS Copy')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <p className="text-slate-300">{generatedFollowUp.smsVersion}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
