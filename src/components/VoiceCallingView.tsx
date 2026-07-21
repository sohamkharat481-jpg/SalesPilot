import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, Pause, Play, 
  RotateCw, RefreshCw, Sparkles, CheckSquare, Calendar, ShieldCheck, 
  BarChart3, User, Search, PlayCircle, Clock, Award, Flame, Star, 
  AlertCircle, ChevronRight, X, Heart, Plus, FileText, Send, Square, 
  Settings, Bot, ArrowRight, BookOpen, ShieldAlert, BadgeCheck, Users, TrendingUp
} from 'lucide-react';
import { Lead, Appointment, Deal } from '../types';

interface CallRecord {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  direction: 'outbound' | 'incoming';
  status: 'completed' | 'no-answer' | 'busy' | 'failed' | 'voicemail';
  duration: number; // in seconds
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
  // Tabs & Selections
  const [activeSubTab, setActiveSubTab] = useState<'console' | 'history'>('console');
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
  const [isRecording, setIsRecording] = useState<boolean>(true);
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

  // Simulating incoming call overlays
  const [incomingCallLead, setIncomingCallLead] = useState<Lead | null>(null);
  const [showIncomingOverlay, setShowIncomingOverlay] = useState<boolean>(false);

  // Stats
  const stats = {
    callsMade: calls.filter(c => c.direction === 'outbound').length + 82,
    callsAnswered: calls.filter(c => c.status === 'completed').length + 68,
    meetingsBooked: appointments.length + 12,
    avgDuration: '2m 15s',
    successRate: calls.length > 0 
      ? Math.round((calls.filter(c => (c.aiScore || 0) >= 80).length / calls.length) * 100) 
      : 84
  };

  // Timers and counters
  useEffect(() => {
    let interval: any;
    if (isCalling && callState === 'connected' && !isOnHold) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
        // Animate fake live waveform
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

  // Handle Speech Recognition Setup
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

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [currentCallId, liveTranscript]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported or permissions are blocked in this browser frame.');
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

  // Helper to trigger browser TTS (Text-to-Speech)
  const speakUtterance = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speaking
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Select a nice female or clear voice if available
      const voices = window.speechSynthesis.getVoices();
      const siriVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Siri'));
      if (siriVoice) utterance.voice = siriVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  // Initiate Outbound Browser Call
  const startOutboundCall = () => {
    let targetLead = leads.find(l => l.id === selectedLeadId);
    let name = targetLead ? `${targetLead.firstName} ${targetLead.lastName}` : 'Custom Number';
    let companyName = targetLead ? targetLead.company : 'Direct Dial';
    let phone = targetLead?.phone || customPhoneNumber || '+91 99999 88888';

    if (!selectedLeadId && !customPhoneNumber) {
      alert('Please select a lead or enter a phone number to place a call.');
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

    // Initial script
    const greeting = `Hello! Thank you for taking my call. This is SalesPilot's AI Outbound Voice agent calling. May I please speak with ${name} from ${companyName}?`;
    
    setLiveTranscript([
      { speaker: 'agent', text: greeting, timestamp: new Date().toLocaleTimeString() }
    ]);

    // Transition stages
    setTimeout(() => {
      setCallState('ringing');
      setTimeout(() => {
        setCallState('connected');
        speakUtterance(greeting);
      }, 2000);
    }, 1500);
  };

  // Process a customer message (either typed or spoken via Mic)
  const handleCustomerUtterance = async (text: string) => {
    if (!text.trim() || isAgentReplying) return;

    // Add to transcript
    const updatedTranscript = [
      ...liveTranscript,
      { speaker: 'customer' as const, text, timestamp: new Date().toLocaleTimeString() }
    ];
    setLiveTranscript(updatedTranscript);
    setCustomerMessage('');

    // Fetch AI Voice Agent Response
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

  // Handle Drop Voicemail
  const dropVoicemail = () => {
    if (callState !== 'connected') return;
    setHasDroppedVoicemail(true);
    setCallState('voicemail');
    
    const voicemailText = "Hi there, I'm sorry I missed you! This is Soham Kharat's AI Assistant from SalesPilot calling to follow up on your business lead discovery system. I will send over a comprehensive API and pricing sheet to your email address, and book a tentative demo slot in our calendar. Feel free to call us back! Goodbye.";
    
    setLiveTranscript(prev => [
      ...prev,
      { speaker: 'agent', text: `[Voicemail Deposited] ${voicemailText}`, timestamp: new Date().toLocaleTimeString() }
    ]);

    speakUtterance(voicemailText);

    // End call after deposition
    setTimeout(() => {
      endCall();
    }, 8000);
  };

  // End Call & Trigger Automated CRM/Calendar Analytics
  const endCall = async () => {
    setIsCalling(false);
    setCallState('ended');
    setIsListening(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    let targetLead = leads.find(l => l.id === selectedLeadId) || leads[0];
    if (!targetLead) return;

    setIsAnalyzing(true);
    setActiveSubTab('history');

    // Create call record
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
      // 1. Log Call
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callLog)
      });

      // 2. Perform AI Call Analytics (Triggers CRM Updates, Task schedules, Calendar bookings, Deals)
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
        // Refresh local history list
        await fetchCalls();
        
        // Select the newly finished call to show its analysis
        const finalCall = analyticsData.call;
        setSelectedCall(finalCall);

        // Update main application state in real-time
        if (analyticsData.appointment) {
          setAppointments(prev => [...prev, analyticsData.appointment]);
        }
        if (analyticsData.deal) {
          setDeals(prev => [...prev, analyticsData.deal]);
        }
        
        // Refresh leads list state in memory
        const leadsRes = await fetch('/api/v1/leads');
        const leadsData = await leadsRes.json();
        if (leadsData.success) {
          setLeads(leadsData.leads);
        }
      }
    } catch (err) {
      console.error('Error post-call analytics processing:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simulate incoming call from a Lead
  const simulateIncomingCall = (lead: Lead) => {
    setIncomingCallLead(lead);
    setShowIncomingOverlay(true);
  };

  const answerIncomingCall = () => {
    if (!incomingCallLead) return;
    
    const callId = 'call-' + Math.random().toString(36).substr(2, 9);
    setCurrentCallId(callId);
    setSelectedLeadId(incomingCallLead.id);
    setIsCalling(true);
    setCallDirection('incoming');
    setCallState('connected');
    setCallDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    setShowIncomingOverlay(false);

    const greeting = `Hello, thank you for calling SalesPilot's inbound sales desk! This is SalesPilot's AI assistant speaking. How can I help you accelerate your outbound pipelines today?`;
    
    setLiveTranscript([
      { speaker: 'agent', text: greeting, timestamp: new Date().toLocaleTimeString() }
    ]);

    setTimeout(() => {
      speakUtterance(greeting);
    }, 500);
  };

  return (
    <div className="space-y-6">
      
      {/* Platform Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-800 p-1.5 rounded-lg dark:bg-emerald-950 dark:text-emerald-300">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">AI Voice Calling Platform</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Interactive outbound calling with custom voice dialogues, real-time speech-to-text, and automated CRM transcription + calendar booking.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {leads.length > 0 && (
            <button
              onClick={() => simulateIncomingCall(leads[Math.floor(Math.random() * leads.length)])}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Simulate Incoming Call
            </button>
          )}
          
          <button
            onClick={() => setActiveSubTab(activeSubTab === 'console' ? 'history' : 'console')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            {activeSubTab === 'console' ? 'View Call Logs & History' : 'Open Dial Console'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calls Made</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.callsMade}</span>
            <span className="text-xs text-emerald-600 font-semibold">Total</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calls Answered</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.callsAnswered}</span>
            <span className="text-xs text-slate-500">{(stats.callsAnswered / stats.callsMade * 100).toFixed(0)}% answer</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meetings Booked</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.meetingsBooked}</span>
            <span className="text-xs text-emerald-600 font-semibold">Auto Synced</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Duration</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgDuration}</span>
            <span className="text-xs text-slate-500">Live sessions</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Success Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.successRate}%</span>
            <span className="text-xs text-emerald-600 font-semibold">Target Qualified</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Console/List Area */}
        <div className="lg:col-span-7 space-y-6">
          
          {activeSubTab === 'console' ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-emerald-600" />
                Live Voice Dial Console
              </h2>

              {!isCalling ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Select Lead to Call</label>
                    <div className="relative">
                      <select
                        value={selectedLeadId}
                        onChange={(e) => setSelectedLeadId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      >
                        <option value="">-- Choose from your CRM leads --</option>
                        {leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.firstName} {l.lastName} ({l.company}) - {l.phone || 'No phone'}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase">OR DIAL DIRECTLY</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Enter custom phone number</label>
                    <input
                      type="tel"
                      placeholder="+91 99999 88888"
                      value={customPhoneNumber}
                      onChange={(e) => setCustomPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                    />
                  </div>

                  <button
                    onClick={startOutboundCall}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 text-base"
                  >
                    <Phone className="w-5 h-5 animate-bounce" />
                    Place Outbound AI Voice Call
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Ongoing Call Control Board */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                    
                    {/* Ringing / pulsing caller icon */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-25"></div>
                      <div className="relative bg-emerald-100 text-emerald-800 p-6 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                        <PhoneCall className="w-8 h-8" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {leads.find(l => l.id === selectedLeadId) 
                          ? `${leads.find(l => l.id === selectedLeadId)?.firstName} ${leads.find(l => l.id === selectedLeadId)?.lastName}`
                          : 'Direct Outbound Line'
                        }
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 font-mono">
                        {leads.find(l => l.id === selectedLeadId)?.phone || customPhoneNumber || '+91 99999 88888'}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${callState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'}`}></span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {callState === 'dialing' && 'DIALING...'}
                          {callState === 'ringing' && 'RINGING...'}
                          {callState === 'connected' && `CONNECTED (${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')})`}
                          {callState === 'voicemail' && 'VOICEMAIL BOX'}
                        </span>
                      </div>
                    </div>

                    {/* Microphone Oscilloscope simulation */}
                    {callState === 'connected' && !isOnHold && (
                      <div className="flex items-center gap-1.5 py-4 h-12">
                        {waveHeight.map((h, i) => (
                          <div 
                            key={i} 
                            style={{ height: `${h}px` }}
                            className="w-1.5 bg-emerald-500 rounded-full transition-all duration-300"
                          ></div>
                        ))}
                      </div>
                    )}

                    {/* Call Actions Panel */}
                    <div className="grid grid-cols-4 gap-4 w-full pt-4">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`flex flex-col items-center p-3 rounded-xl border transition ${
                          isMuted 
                            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950 dark:border-red-900 dark:text-red-400' 
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isMuted ? <MicOff className="w-5 h-5 mb-1" /> : <Mic className="w-5 h-5 mb-1" />}
                        <span className="text-[10px] font-bold">Mute</span>
                      </button>

                      <button
                        onClick={() => setIsOnHold(!isOnHold)}
                        className={`flex flex-col items-center p-3 rounded-xl border transition ${
                          isOnHold 
                            ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-400' 
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Pause className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold">{isOnHold ? 'Unhold' : 'Hold'}</span>
                      </button>

                      <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`flex flex-col items-center p-3 rounded-xl border transition ${
                          isRecording 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400' 
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Square className={`w-5 h-5 mb-1 ${isRecording ? 'text-red-500 fill-red-500 animate-pulse' : ''}`} />
                        <span className="text-[10px] font-bold">Recording</span>
                      </button>

                      <button
                        onClick={dropVoicemail}
                        disabled={callState !== 'connected' || hasDroppedVoicemail}
                        className={`flex flex-col items-center p-3 rounded-xl border transition ${
                          hasDroppedVoicemail 
                            ? 'bg-purple-100 border-purple-200 text-purple-700' 
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50'
                        }`}
                      >
                        <Volume2 className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold">Voicemail</span>
                      </button>
                    </div>

                    <button
                      onClick={endCall}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-md"
                    >
                      <PhoneOff className="w-5 h-5" />
                      Hang Up / End Call
                    </button>

                  </div>

                  {/* Live Conversation Transcript Terminal */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 bg-white dark:bg-slate-950">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Conversational Transcript</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">Stream Real-time</span>
                    </div>

                    <div className="h-64 overflow-y-auto space-y-3 pr-2 text-sm flex flex-col scrollbar-thin">
                      {liveTranscript.map((t, index) => (
                        <div 
                          key={index} 
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            t.speaker === 'agent' 
                              ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 self-start rounded-tl-none' 
                              : 'bg-emerald-600 text-white self-end rounded-tr-none'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px] font-semibold">
                            {t.speaker === 'agent' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            <span>{t.speaker === 'agent' ? 'SalesPilot AI Assistant' : 'Prospect'}</span>
                            <span className="font-mono text-[9px]">{t.timestamp}</span>
                          </div>
                          <p className="leading-relaxed text-xs">{t.text}</p>
                        </div>
                      ))}
                      {isAgentReplying && (
                        <div className="bg-slate-100 text-slate-800 p-3 rounded-2xl self-start rounded-tl-none animate-pulse text-xs flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          AI SDR is formulating response...
                        </div>
                      )}
                    </div>

                    {/* Customer input area */}
                    <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <button
                        onClick={toggleSpeechRecognition}
                        className={`p-2.5 rounded-xl transition ${
                          isListening 
                            ? 'bg-red-100 text-red-600 animate-pulse' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                        title="Talk to the assistant with your microphone"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        placeholder={isListening ? "Listening with mic..." : "Type custom prospect reply or response..."}
                        value={customerMessage}
                        onChange={(e) => setCustomerMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomerUtterance(customerMessage)}
                        className="flex-grow px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        disabled={isListening}
                      />

                      <button
                        onClick={() => handleCustomerUtterance(customerMessage)}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Past Call History logs & Recording vault
                </h2>
                <button
                  onClick={fetchCalls}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition"
                  title="Reload history"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {isLoadingCalls ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <p className="text-sm text-slate-500">Loading call recordings database...</p>
                </div>
              ) : calls.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <PhoneOff className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500 font-semibold">No call records found yet</p>
                  <p className="text-xs text-slate-400">Initiate an outbound call in the Dial Console to generate records.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {calls.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCall(c)}
                      className={`p-4 border rounded-xl cursor-pointer transition flex items-center justify-between ${
                        selectedCall?.id === c.id 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-slate-800' 
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          c.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950'
                        }`}>
                          {c.direction === 'outbound' ? <PhoneCall className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.leadName}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span>{c.company}</span>
                            <span>•</span>
                            <span className="font-mono">{Math.floor(c.duration / 60)}m {c.duration % 60}s</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'completed' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950' 
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950'
                          }`}>
                            {c.status}
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Call Analytics Panel */}
        <div className="lg:col-span-5">
          {isAnalyzing ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center justify-center h-full min-h-[400px] space-y-4">
              <RefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Post-Call Analysis Running</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Gemini-3.5-Flash is processing the transcript, performing sentiment analysis, detecting objections, creating CRM action tasks, and scheduling calendar bookings...
                </p>
              </div>
            </div>
          ) : selectedCall ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Call Audit & CRM Update</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedCall.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center bg-emerald-50 text-emerald-800 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-slate-700">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Score</span>
                    <span className="text-xl font-black text-emerald-600">{selectedCall.aiScore || 85}</span>
                  </div>
                </div>
              </div>

              {/* Fake recording audio player */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-emerald-600" />
                    Recording Playback Track
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{Math.floor(selectedCall.duration / 60)}:{(selectedCall.duration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700">
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                  {/* Fake Audio Bar Waveform */}
                  <div className="flex-grow flex items-center gap-0.5 h-6">
                    {Array(25).fill(0).map((_, i) => (
                      <div 
                        key={i} 
                        style={{ height: `${[12, 16, 24, 8, 14, 20, 16, 6, 12, 22, 14, 8, 18, 12, 24, 16, 8, 10, 14, 6, 12, 18, 10, 8, 14][i]}px` }} 
                        className="w-1.5 bg-emerald-300 rounded-full dark:bg-slate-800"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sentiment Analysis & Objections */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prospect Sentiment</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      selectedCall.sentiment === 'positive' || selectedCall.sentiment === 'warm' ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}></span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs">{selectedCall.sentiment || 'neutral'}</span>
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Objection Detected</span>
                  <div className="flex flex-wrap gap-1">
                    {(selectedCall.objections || []).length > 0 ? (
                      (selectedCall.objections || []).map((o, idx) => (
                        <span key={idx} className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {o}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 font-semibold">None detected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Smart Objection Handling Recommendations */}
              {(selectedCall.objections || []).length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900 space-y-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Recommended Objection Handling Rebuttal
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedCall.objections?.includes('Price') && "Acknowledge the price concern and highlight the automatic scrapers saving 20+ hours of team labor weekly. Present the Starter discount tier (₹4,200/seat) to bypass budget caps."}
                    {selectedCall.objections?.includes('Timing') && "Establish urgency by citing competitors expanding inbound lead searches. Offer a soft, no-commitment 1-on-1 sandbox setup."}
                    {!selectedCall.objections?.includes('Price') && !selectedCall.objections?.includes('Timing') && "Prospect requires more functional details. Email detailed API configuration guides with step-by-step videos."}
                  </p>
                </div>
              )}

              {/* Action Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  Follow-up Action Items & Tasks Scheduled
                </span>
                <div className="space-y-1.5 text-xs">
                  {(selectedCall.actionItems || []).length > 0 ? (
                    (selectedCall.actionItems || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                        <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                        <span className="ml-auto text-[8px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">CRM Auto Synced</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 font-medium italic">No action items logged.</p>
                  )}
                </div>
              </div>

              {/* Transcript Drawer foldout */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Call Dialogue Transcript
                </span>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 max-h-[180px] overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-950 text-xs">
                  {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                    selectedCall.transcript.map((t: any, idx: number) => (
                      <div key={idx} className="space-y-0.5">
                        <span className={`font-black text-[9px] uppercase ${t.speaker === 'agent' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                          {t.speaker === 'agent' ? 'AI Agent' : 'Customer'}:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{t.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">No transcript recorded for this call.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center justify-center items-center flex flex-col h-full min-h-[400px] space-y-3 shadow-sm">
              <Bot className="w-10 h-10 text-slate-300" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Call Selected</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Select a completed call from the History tab to view smart CRM notes, sentiment analysis, objection handler guides, and automated checklist logs.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Simulated Incoming Call Ringing Overlay */}
      {showIncomingOverlay && incomingCallLead && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-6">
            
            {/* Pulsing ringing effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-30"></div>
              <div className="absolute inset-[-8px] bg-emerald-100 rounded-full animate-pulse dark:bg-emerald-950 opacity-50"></div>
              <div className="relative bg-emerald-600 text-white p-5 rounded-full">
                <Phone className="w-8 h-8 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest animate-pulse">Incoming CRM Contact Call</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {incomingCallLead.firstName} {incomingCallLead.lastName}
              </h3>
              <p className="text-sm font-semibold text-slate-500">{incomingCallLead.company}</p>
              <p className="text-xs text-slate-400 font-mono">{incomingCallLead.phone || '+91 91234 56789'}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl w-full text-xs text-slate-500 font-medium">
              This prospect is labeled <span className="text-emerald-600 font-bold">"{incomingCallLead.leadScore || 'Hot'}"</span> in SalesPilot. Answering will route the call directly to your active AI voice desk agent.
            </div>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowIncomingOverlay(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition text-sm dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Reject / Decline
              </button>
              <button
                onClick={answerIncomingCall}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-lg text-sm"
              >
                Answer Call
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
