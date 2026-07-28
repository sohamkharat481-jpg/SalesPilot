import React from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Pause, Play, 
  RotateCw, Sparkles, CheckSquare, Calendar, ShieldCheck, 
  User, Send, Bot, ShieldAlert, BadgeCheck, HelpCircle, Lightbulb
} from 'lucide-react';
import { Lead } from '../../types';

interface VoiceConsoleProps {
  leads: Lead[];
  selectedLeadId: string;
  setSelectedLeadId: (id: string) => void;
  customPhoneNumber: string;
  setCustomPhoneNumber: (num: string) => void;
  isCalling: boolean;
  callState: 'dialing' | 'ringing' | 'connected' | 'ended' | 'voicemail';
  callDuration: number;
  callDirection: 'outbound' | 'incoming';
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isOnHold: boolean;
  setIsOnHold: React.Dispatch<React.SetStateAction<boolean>>;
  isListening: boolean;
  toggleSpeechRecognition: () => void;
  startOutboundCall: () => void;
  endCall: () => void;
  dropVoicemail: () => void;
  customerMessage: string;
  setCustomerMessage: (msg: string) => void;
  handleCustomerUtterance: (msg: string) => void;
  liveTranscript: { speaker: 'agent' | 'customer'; text: string; timestamp: string }[];
  isAgentReplying: boolean;
  waveHeight: number[];
  hasDroppedVoicemail: boolean;
}

export function VoiceConsole({
  leads,
  selectedLeadId,
  setSelectedLeadId,
  customPhoneNumber,
  setCustomPhoneNumber,
  isCalling,
  callState,
  callDuration,
  isMuted,
  setIsMuted,
  isOnHold,
  setIsOnHold,
  isListening,
  toggleSpeechRecognition,
  startOutboundCall,
  endCall,
  dropVoicemail,
  customerMessage,
  setCustomerMessage,
  handleCustomerUtterance,
  liveTranscript,
  isAgentReplying,
  waveHeight,
  hasDroppedVoicemail
}: VoiceConsoleProps) {
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-slate-100 font-mono shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">AI Voice Assistant Console</h2>
        </div>
        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
          LIVE DIALER READY
        </span>
      </div>

      {!isCalling ? (
        <div className="space-y-5">
          {/* LEAD SELECTOR */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">
              Select Prospect / Lead to Call
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Lead from CRM --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.firstName} {l.lastName} • {l.company} ({l.phone || 'No Phone'})
                </option>
              ))}
            </select>
          </div>

          {/* CUSTOM PHONE OVERRIDE */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">
              Or Enter Direct Phone Number
            </label>
            <input
              type="text"
              placeholder="+91 99999 88888"
              value={customPhoneNumber}
              onChange={(e) => setCustomPhoneNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* SELECTED PROSPECT BRIEF SUMMARY */}
          {selectedLead && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  {selectedLead.firstName} {selectedLead.lastName}
                </span>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] rounded">
                  {selectedLead.status}
                </span>
              </div>
              <p className="text-slate-400">{selectedLead.title} at <strong className="text-slate-200">{selectedLead.company}</strong></p>
              <p className="text-slate-500 text-[11px]">{selectedLead.email} • {selectedLead.phone || 'Phone pending'}</p>
            </div>
          )}

          {/* START CALL BUTTON */}
          <button
            onClick={startOutboundCall}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Phone className="w-4 h-4 fill-current" />
            Launch AI Outbound Call
          </button>
        </div>
      ) : (
        /* ACTIVE CALL INTERFACE */
        <div className="space-y-6">
          {/* CALL STATE HEADER & WAVEFORM */}
          <div className="p-5 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-4 text-center">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                {callState.toUpperCase()}
              </span>
              <span className="text-slate-400 font-bold text-sm">{formatTime(callDuration)}</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {selectedLead ? `${selectedLead.firstName} ${selectedLead.lastName}` : 'Direct Dial Contact'}
              </h3>
              <p className="text-xs text-indigo-400">{selectedLead?.company || customPhoneNumber}</p>
            </div>

            {/* LIVE AUDIO WAVEFORM */}
            <div className="flex items-center justify-center gap-1.5 h-10">
              {waveHeight.map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${h * 1.5}px` }}
                  className="w-1.5 bg-indigo-500 rounded-full transition-all duration-150"
                />
              ))}
            </div>

            {/* CALL CONTROL BUTTONS */}
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isMuted ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOnHold(!isOnHold)}
                className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isOnHold ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={dropVoicemail}
                disabled={hasDroppedVoicemail}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Drop Voicemail
              </button>

              <button
                onClick={endCall}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <PhoneOff className="w-4 h-4" /> End Call
              </button>
            </div>
          </div>

          {/* LIVE DIALOGUE TRANSCRIPT STREAM */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center justify-between">
              <span>Live Dialogue Transcript</span>
              {isAgentReplying && <span className="text-indigo-400 animate-pulse text-[10px]">AI Speaking...</span>}
            </h4>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-h-60 overflow-y-auto space-y-3 text-xs">
              {liveTranscript.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl ${
                    msg.speaker === 'agent'
                      ? 'bg-indigo-950/60 border border-indigo-800/40 text-indigo-200 ml-4'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                    <span className="font-bold uppercase text-indigo-400">
                      {msg.speaker === 'agent' ? '🤖 AI Voice Assistant' : '👤 Prospect'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* INPUT & MIC SPEECH RECOGNITION CONTROLS */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening ? 'Listening...' : 'Speak'}
              </button>

              <input
                type="text"
                placeholder="Type prospect reply to test live AI voice response..."
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customerMessage.trim()) {
                    handleCustomerUtterance(customerMessage.trim());
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />

              <button
                onClick={() => handleCustomerUtterance(customerMessage)}
                disabled={!customerMessage.trim() || isAgentReplying}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LIVE CALL SPEAKING POINTS & OBJECTION CHEAT SHEET */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
              <Lightbulb className="w-4 h-4" /> Real-time Call Assistant & Speaking Points
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Value Proposition:</span>
                <p className="text-slate-400 text-[11px]">
                  Automates lead discovery, enrichment, automated email sequences, and AI CRM updating.
                </p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Price Objection Counter:</span>
                <p className="text-slate-400 text-[11px]">
                  Professional plan is ₹8,500/mo ($99/mo) with guaranteed 3x ROI in qualified leads.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
