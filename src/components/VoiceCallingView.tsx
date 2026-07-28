import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, Mic, FileText, Calendar, BarChart3, Bell, ChevronRight, Phone, Sparkles
} from 'lucide-react';
import { Lead, Appointment, Deal } from '../types';
import { VoiceConsole } from './voice/VoiceConsole';
import { CallSummariesAndTranscripts } from './voice/CallSummariesAndTranscripts';
import { VoiceNotesStudio } from './voice/VoiceNotesStudio';
import { CalendarAssistantAndPrep } from './voice/CalendarAssistantAndPrep';
import { MeetingAnalyticsView } from './voice/MeetingAnalyticsView';
import { AiRemindersQueue } from './voice/AiRemindersQueue';

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

interface VoiceCallingViewProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
}

export function VoiceCallingView({ 
  leads, 
  setLeads, 
  appointments, 
  setAppointments, 
  deals, 
  setDeals 
}: VoiceCallingViewProps) {
  // Navigation Tabs for AI Voice Assistant Mode
  const [activeTab, setActiveTab] = useState<
    'console' | 'transcripts' | 'voice-notes' | 'calendar-prep' | 'analytics' | 'reminders'
  >('console');

  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [customPhoneNumber, setCustomPhoneNumber] = useState<string>('');
  
  // Call History State
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [isLoadingCalls, setIsLoadingCalls] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Ongoing Call State
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callState, setCallState] = useState<'dialing' | 'ringing' | 'connected' | 'ended' | 'voicemail'>('dialing');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [currentCallId, setCurrentCallId] = useState<string>('');
  const [callDirection, setCallDirection] = useState<'outbound' | 'incoming'>('outbound');
  
  // Call Controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isOnHold, setIsOnHold] = useState<boolean>(false);
  const [hasDroppedVoicemail, setHasDroppedVoicemail] = useState<boolean>(false);

  // Live Dialog State
  const [customerMessage, setCustomerMessage] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: 'agent' | 'customer'; text: string; timestamp: string }[]>([]);
  const [isAgentReplying, setIsAgentReplying] = useState<boolean>(false);

  // Simulated Speech Recognition
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Fake waveform anim
  const [waveHeight, setWaveHeight] = useState<number[]>(Array(15).fill(4));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Timers and counters
  useEffect(() => {
    let interval: any;
    if (isCalling && callState === 'connected' && !isOnHold) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
        setWaveHeight(Array(15).fill(0).map(() => Math.floor(Math.random() * 24) + 4));
      }, 1000);
    } else {
      setWaveHeight(Array(15).fill(4));
    }
    return () => clearInterval(interval);
  }, [isCalling, callState, isOnHold]);

  // Fetch Calls on Mount
  const fetchCalls = async () => {
    setIsLoadingCalls(true);
    try {
      const res = await fetch('/api/calls');
      const data = await res.json();
      if (data.success) {
        setCalls(data.calls);
        if (data.calls.length > 0 && !selectedCall) {
          setSelectedCall(data.calls[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching calls:', err);
    } finally {
      setIsLoadingCalls(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [appointments, deals]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        if (text) {
          handleCustomerUtterance(text);
        }
      };

      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, [currentCallId, liveTranscript]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      triggerToast('Speech Recognition not supported in browser frame. Type message below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Browser Text-to-Speech
  const speakUtterance = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const siriVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Siri'));
      if (siriVoice) utterance.voice = siriVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Call
  const startOutboundCall = () => {
    let targetLead = leads.find(l => l.id === selectedLeadId);
    let name = targetLead ? `${targetLead.firstName} ${targetLead.lastName}` : 'Direct Contact';
    let companyName = targetLead ? targetLead.company : 'Direct Dial';

    if (!selectedLeadId && !customPhoneNumber) {
      triggerToast('Please select a lead or enter a phone number.');
      return;
    }

    const callId = 'call-' + Math.random().toString(36).substr(2, 9);
    setCurrentCallId(callId);
    setIsCalling(true);
    setCallDirection('outbound');
    setCallState('dialing');
    setCallDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    setHasDroppedVoicemail(false);

    const greeting = `Hello! Thank you for taking my call. This is SalesPilot's AI Outbound Voice agent calling. May I please speak with ${name} from ${companyName}?`;
    
    setLiveTranscript([
      { speaker: 'agent', text: greeting, timestamp: new Date().toLocaleTimeString() }
    ]);

    setTimeout(() => {
      setCallState('ringing');
      setTimeout(() => {
        setCallState('connected');
        speakUtterance(greeting);
      }, 2000);
    }, 1500);
  };

  // Process customer utterance
  const handleCustomerUtterance = async (text: string) => {
    if (!text.trim() || isAgentReplying) return;

    const updatedTranscript = [
      ...liveTranscript,
      { speaker: 'customer' as const, text, timestamp: new Date().toLocaleTimeString() }
    ];
    setLiveTranscript(updatedTranscript);
    setCustomerMessage('');

    setIsAgentReplying(true);
    try {
      const response = await fetch('/api/voice-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId || 'lead-demo-1',
          customerInput: text,
          history: updatedTranscript
        })
      });

      const data = await response.json();
      if (data.success) {
        const agentUtterance = data.text;
        setLiveTranscript(prev => [
          ...prev,
          { speaker: 'agent', text: agentUtterance, timestamp: new Date().toLocaleTimeString() }
        ]);
        speakUtterance(agentUtterance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAgentReplying(false);
    }
  };

  const dropVoicemail = () => {
    if (callState !== 'connected') return;
    setHasDroppedVoicemail(true);
    setCallState('voicemail');
    
    const voicemailText = "Hi there! This is Soham Kharat's AI Assistant from SalesPilot following up on your business lead discovery system. I will send over pricing to your email address and book a demo slot in our calendar. Goodbye!";
    
    setLiveTranscript(prev => [
      ...prev,
      { speaker: 'agent', text: `[Voicemail Deposited] ${voicemailText}`, timestamp: new Date().toLocaleTimeString() }
    ]);

    speakUtterance(voicemailText);
    setTimeout(() => endCall(), 6000);
  };

  const endCall = async () => {
    setIsCalling(false);
    setCallState('ended');
    setIsListening(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    let targetLead = leads.find(l => l.id === selectedLeadId) || leads[0];
    if (!targetLead) return;

    setIsAnalyzing(true);
    setActiveTab('transcripts');

    const callLog = {
      id: currentCallId,
      leadId: targetLead.id,
      leadName: `${targetLead.firstName} ${targetLead.lastName}`,
      company: targetLead.company,
      phone: targetLead.phone || customPhoneNumber || '+91 99999 88888',
      direction: callDirection,
      status: hasDroppedVoicemail ? 'voicemail' : 'completed',
      duration: callDuration || 45,
      recordingUrl: `/recordings/${currentCallId}.mp3`,
      transcript: liveTranscript,
      createdAt: new Date().toISOString()
    };

    try {
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callLog)
      });

      const analyticsRes = await fetch('/api/call-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: currentCallId,
          transcript: liveTranscript
        })
      });

      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        await fetchCalls();
        setSelectedCall(analyticsData.call);

        if (analyticsData.appointment) {
          setAppointments(prev => [...prev, analyticsData.appointment]);
        }
        if (analyticsData.deal) {
          setDeals(prev => [...prev, analyticsData.deal]);
        }
        
        const leadsRes = await fetch('/api/v1/leads');
        const leadsData = await leadsRes.json();
        if (leadsData.success) {
          setLeads(leadsData.leads);
        }
        triggerToast('🎉 Call completed! Summary, action items & calendar appointments stored in CRM!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-slate-100 animate-fade-in relative">
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold text-white uppercase tracking-tight">
              AI Voice Assistant Mode
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              REAL-TIME VOICE & CRM SYNC
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time outbound voice dialer, meeting transcription, AI call summaries, action item extraction, calendar prep dossiers, and voice dictation.
          </p>
        </div>

        {/* MODE TABS */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'console' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Dial Console
          </button>

          <button
            onClick={() => setActiveTab('transcripts')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transcripts' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Summaries & Transcripts
          </button>

          <button
            onClick={() => setActiveTab('voice-notes')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'voice-notes' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-purple-400" /> Voice Notes Studio
          </button>

          <button
            onClick={() => setActiveTab('calendar-prep')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'calendar-prep' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Calendar & Prep
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reminders' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Reminders Queue
          </button>
        </div>
      </div>

      {/* TAB VIEWS */}
      {activeTab === 'console' && (
        <VoiceConsole
          leads={leads}
          selectedLeadId={selectedLeadId}
          setSelectedLeadId={setSelectedLeadId}
          customPhoneNumber={customPhoneNumber}
          setCustomPhoneNumber={setCustomPhoneNumber}
          isCalling={isCalling}
          callState={callState}
          callDuration={callDuration}
          callDirection={callDirection}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isOnHold={isOnHold}
          setIsOnHold={setIsOnHold}
          isListening={isListening}
          toggleSpeechRecognition={toggleSpeechRecognition}
          startOutboundCall={startOutboundCall}
          endCall={endCall}
          dropVoicemail={dropVoicemail}
          customerMessage={customerMessage}
          setCustomerMessage={setCustomerMessage}
          handleCustomerUtterance={handleCustomerUtterance}
          liveTranscript={liveTranscript}
          isAgentReplying={isAgentReplying}
          waveHeight={waveHeight}
          hasDroppedVoicemail={hasDroppedVoicemail}
        />
      )}

      {activeTab === 'transcripts' && (
        <CallSummariesAndTranscripts
          calls={calls}
          selectedCall={selectedCall}
          setSelectedCall={setSelectedCall}
          isLoadingCalls={isLoadingCalls}
          isAnalyzing={isAnalyzing}
          leads={leads}
          triggerToast={triggerToast}
        />
      )}

      {activeTab === 'voice-notes' && (
        <VoiceNotesStudio
          leads={leads}
          triggerToast={triggerToast}
          onNoteSaved={() => fetchCalls()}
        />
      )}

      {activeTab === 'calendar-prep' && (
        <CalendarAssistantAndPrep
          leads={leads}
          appointments={appointments}
          setAppointments={setAppointments}
          triggerToast={triggerToast}
        />
      )}

      {activeTab === 'analytics' && (
        <MeetingAnalyticsView calls={calls} />
      )}

      {activeTab === 'reminders' && (
        <AiRemindersQueue leads={leads} triggerToast={triggerToast} />
      )}
    </div>
  );
}
