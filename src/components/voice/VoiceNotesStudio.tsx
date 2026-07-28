import React, { useState } from 'react';
import { 
  Mic, MicOff, Sparkles, CheckCircle2, FileText, Send, Database, User
} from 'lucide-react';
import { Lead } from '../../types';

interface VoiceNotesStudioProps {
  leads: Lead[];
  triggerToast: (msg: string) => void;
  onNoteSaved?: () => void;
}

export function VoiceNotesStudio({ leads, triggerToast, onNoteSaved }: VoiceNotesStudioProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('Post-call Sales Dictation');
  const [dictatedText, setDictatedText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedResult, setProcessedResult] = useState<any | null>(null);

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerToast('Speech recognition not supported in browser. Please type dictation below.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        let transcript = '';
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript + ' ';
        }
        setDictatedText(transcript);
      };

      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      rec.start();
    }
  };

  const handleProcessVoiceNote = async () => {
    if (!dictatedText.trim()) {
      triggerToast('Please record or type a voice note first.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          noteText: dictatedText,
          title: noteTitle
        })
      });

      const data = await res.json();
      if (data.success) {
        setProcessedResult(data.analysis);
        triggerToast('🎙️ Voice note transcribed, analyzed, and stored in CRM Lead Notes!');
        if (onNoteSaved) onNoteSaved();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-slate-100">
      {/* LEFT COL: VOICE DICTATION STUDIO (6 COLS) */}
      <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase text-white">Voice Dictation & Sales Memos</h3>
          </div>
          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] rounded">
            AI Auto-Sync
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Dictate post-call notes, meeting thoughts, or quick deal updates. Gemini automatically extracts key takeaways and attaches them to the selected Lead in CRM.
        </p>

        {/* LEAD SELECTOR */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Associate with Lead</label>
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
          >
            <option value="">-- Select Lead from CRM --</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.firstName} {l.lastName} • {l.company}
              </option>
            ))}
          </select>
        </div>

        {/* TITLE INPUT */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Note Title / Topic</label>
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>

        {/* MIC RECORD BUTTON & TEXTAREA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase block">Audio Dictation Transcript</label>
            <button
              onClick={toggleRecording}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {isRecording ? 'Stop Recording' : 'Start Mic Recording'}
            </button>
          </div>

          <textarea
            rows={5}
            placeholder="Click 'Start Mic Recording' or type dictation text here... (e.g. 'Met with Satya. They have budget approval for Q3. Needs custom API onboarding sheet by Friday.')"
            value={dictatedText}
            onChange={(e) => setDictatedText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* PROCESS BUTTON */}
        <button
          onClick={handleProcessVoiceNote}
          disabled={isProcessing || !dictatedText.trim()}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          {isProcessing ? 'Transcribing & Analyzing with AI...' : 'Process & Store Voice Note in CRM'}
        </button>
      </div>

      {/* RIGHT COL: AI EXTRACTION & CRM STORED PREVIEW (6 COLS) */}
      <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase text-white">Extracted Key Takeaways & Tasks</h3>
          </div>
        </div>

        {!processedResult ? (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">Record a voice note to view AI extraction</p>
            <p className="text-[11px]">AI will extract sentiment, key points, and auto-assign tasks.</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 uppercase text-[10px]">CRM Note Created</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase">
                  {processedResult.sentiment || 'NEUTRAL'}
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed">{processedResult.summary}</p>
            </div>

            {processedResult.keyTakeaways && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-indigo-400 uppercase text-[10px]">Key Takeaways</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {processedResult.keyTakeaways.map((k: string, i: number) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>
            )}

            {processedResult.extractedTasks && processedResult.extractedTasks.length > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-amber-400 uppercase text-[10px]">Extracted CRM Tasks</span>
                <div className="space-y-1.5">
                  {processedResult.extractedTasks.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-200">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
