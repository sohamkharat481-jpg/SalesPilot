import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, Phone, PhoneOff, AlertTriangle, AlertCircle, CheckCircle2, XCircle, Clock, 
  User, Building2, Mail, Globe, Briefcase, Calendar, Sparkles, FileText, 
  Play, ShieldAlert, ChevronRight, RefreshCw, Plus, Filter, Search, Check, Info,
  History, BarChart2, Smartphone
} from 'lucide-react';
import { Lead, Appointment, Deal } from '../types';
import { VoiceCallRecord, CallStatus, CallOutcome, VoiceProviderConfig, CallingNumber } from '../types/voice';
import { MyCallingNumbers } from './voice/MyCallingNumbers';
import { CallHistoryView } from './voice/CallHistoryView';
import { ManualCallingAnalyticsView } from './voice/ManualCallingAnalyticsView';
import { FollowUpsView } from './voice/FollowUpsView';
import { ISO_3166_1_COUNTRIES, validateAndNormalizeE164 } from '../utils/isoCountries';

const ISO_COUNTRIES = ISO_3166_1_COUNTRIES;

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
  // Provider Configuration State
  const [providerConfig, setProviderConfig] = useState<VoiceProviderConfig>({
    configured: false,
    providerName: 'None',
    supportedVoices: []
  });
  const [isLoadingProvider, setIsLoadingProvider] = useState<boolean>(true);

  // Calls & Dashboard State
  const [calls, setCalls] = useState<VoiceCallRecord[]>([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    completedCalls: 0,
    callsInProgress: 0,
    interestedLeads: 0,
    meetingsRequested: 0,
    failedCalls: 0
  });
  const [isLoadingCalls, setIsLoadingCalls] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Lead Selection State
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const selectedLead = leads.find(l => l.id === selectedLeadId) || (leads.length > 0 ? leads[0] : null);

  // Call Configuration Modal State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [configForm, setConfigForm] = useState({
    agentName: 'Astra - SalesPilot SDR',
    openingMessage: '',
    callObjective: 'Qualify budget and authority for CRM upgrade demo',
    companyContext: 'SalesPilot is an AI-powered revenue engine with autonomous SDR agents.',
    leadContext: 'Interested in automating outbound sales and multi-channel followup.',
    maxDurationMinutes: 5,
    language: 'en-US',
    voiceId: 'nat',
    meetingBookingGoal: true
  });
  const [isInitiating, setIsInitiating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Call State
  const [activeCall, setActiveCall] = useState<VoiceCallRecord | null>(null);
  const [activeDuration, setActiveDuration] = useState<number>(0);

  // Call Detail Drawer State
  const [selectedCall, setSelectedCall] = useState<VoiceCallRecord | null>(null);
  const [callEvents, setCallEvents] = useState<any[]>([]);
  const [showOutcomeModal, setShowOutcomeModal] = useState<boolean>(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>('INTERESTED');
  const [outcomeSummary, setOutcomeSummary] = useState<string>('');
  const [bookMeeting, setBookMeeting] = useState<boolean>(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00'
  });

  // Calling Mode Tab State: 'MANUAL' (Default), 'HISTORY', 'ANALYTICS', 'CALLING_NUMBERS', 'FOLLOW_UPS', or 'AI_VOICE'
  const [callingMode, setCallingMode] = useState<'MANUAL' | 'HISTORY' | 'ANALYTICS' | 'CALLING_NUMBERS' | 'AI_VOICE' | 'FOLLOW_UPS'>('MANUAL');

  // Calling Mode Preference (Phase 5/6 Dual Mode)
  const [callingModePreference, setCallingModePreference] = useState<'NATIVE_DIALER' | 'PROVIDER_CALLING'>('NATIVE_DIALER');
  const [isUpdatingMode, setIsUpdatingMode] = useState<boolean>(false);

  // Calling Numbers States (Phase 5)
  const [userCallingNumbers, setUserCallingNumbers] = useState<CallingNumber[]>([]);
  const [selectedCallingNumberId, setSelectedCallingNumberId] = useState<string>('');

  // Manual Phone Call States (Phase 4)
  const [isDirectDial, setIsDirectDial] = useState<boolean>(false);
  const [showManualConfirmModal, setShowManualConfirmModal] = useState<boolean>(false);
  const [isInitiatingManualCall, setIsInitiatingManualCall] = useState<boolean>(false);
  const [activeManualActivity, setActiveManualActivity] = useState<any>(null);
  const [showManualOutcomeCard, setShowManualOutcomeCard] = useState<boolean>(false);
  const [manualOutcome, setManualOutcome] = useState<string>('Connected');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [isSavingOutcome, setIsSavingOutcome] = useState<boolean>(false);
  const [manualCallHistory, setManualCallHistory] = useState<any[]>([]);
  const [manualCallNotice, setManualCallNotice] = useState<string | null>(null);

  // Direct Dial States
  const [manualTab, setManualTab] = useState<'LEAD' | 'DIRECT_DIAL'>('LEAD');
  const [directNumberInput, setDirectNumberInput] = useState<string>('');
  const [directCountryCode, setDirectCountryCode] = useState<string>('+91');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [directContactName, setDirectContactName] = useState<string>('');
  const [directCompanyName, setDirectCompanyName] = useState<string>('');
  const [directNotes, setDirectNotes] = useState<string>('');
  const [isDialingDirect, setIsDialingDirect] = useState<boolean>(false);
  const [directDialDuration, setDirectDialDuration] = useState<number>(0);
  const [isCancellingDirectDial, setIsCancellingDirectDial] = useState<boolean>(false);
  const [dialerLaunchFailed, setDialerLaunchFailed] = useState<boolean>(false);

  // Poll active direct dial call status when running
  useEffect(() => {
    let interval: any;
    if (activeManualActivity && activeManualActivity.source === 'DIRECT_DIAL' && 
        ['QUEUED', 'DIALING', 'RINGING', 'IN_PROGRESS'].includes(activeManualActivity.status)) {
      interval = setInterval(async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const res = await fetch(`/api/v1/manual-calls/${activeManualActivity.id}/status`, { headers });
          const data = await res.json();
          if (data.success && data.activity) {
            setActiveManualActivity(data.activity);
            if (data.activity.status === 'IN_PROGRESS') {
              setDirectDialDuration(prev => prev + 2);
            }
            if (['COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY', 'CANCELLED'].includes(data.activity.status)) {
              fetchManualCallHistory();
            }
          }
        } catch (err) {
          console.error('Error polling direct dial call status:', err);
        }
      }, 2000);
    } else if (!activeManualActivity || !['QUEUED', 'DIALING', 'RINGING', 'IN_PROGRESS'].includes(activeManualActivity?.status)) {
      if (!activeManualActivity) setDirectDialDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeManualActivity]);

  const handleCancelDirectDialCall = async (activityId: string) => {
    setIsCancellingDirectDial(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const res = await fetch(`/api/v1/manual-calls/${activityId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success && data.activity) {
        setActiveManualActivity(data.activity);
        fetchManualCallHistory();
      }
    } catch (err) {
      console.error('Error cancelling direct dial call:', err);
    } finally {
      setIsCancellingDirectDial(false);
    }
  };

  const handleStartDirectDial = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setManualCallNotice(null);
    setDialerLaunchFailed(false);

    if (!directNumberInput.trim()) {
      setErrorMessage('Please enter a destination phone number.');
      return;
    }

    const selectedCountry = ISO_COUNTRIES.find(c => c.dialCode === directCountryCode);
    if (!selectedCountry) {
      setErrorMessage('Invalid country selected.');
      return;
    }

    const norm = validateAndNormalizeE164(directNumberInput, { 
      dialCode: directCountryCode,
      countryCode: selectedCountry.code
    });

    if (!norm.valid || !norm.e164Number) {
      setErrorMessage(norm.error || 'Invalid phone number format.');
      return;
    }

    if (callingModePreference === 'PROVIDER_CALLING') {
      const verifiedCn = userCallingNumbers.find(cn => cn.isDefault && cn.isVerified) || userCallingNumbers.find(cn => cn.isVerified);
      if (!verifiedCn) {
        setErrorMessage('Connect and verify your personal calling number before placing calls.');
        return;
      }
    }
    
    // Show confirmation modal
    setIsDirectDial(true);
    setShowManualConfirmModal(true);
  };

  // Click outside to close country dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isCountryDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  // Phase 6 follow-up states inside outcome logger
  const [scheduleFollowUpAfterCall, setScheduleFollowUpAfterCall] = useState<boolean>(true);
  const [followUpDueAt, setFollowUpDueAt] = useState<string>('');
  const [followUpTitle, setFollowUpTitle] = useState<string>('');
  const [followUpPriority, setFollowUpPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  // Fetch Manual Call History
  const fetchManualCallHistory = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const url = selectedLead ? `/api/v1/manual-calls/history?leadId=${selectedLead.id}` : `/api/v1/manual-calls/history`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setManualCallHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching manual call history:', err);
    }
  };

  // Fetch User's Calling Numbers
  const fetchCallingNumbers = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/calling-numbers', { headers });
      const data = await res.json();
      if (data.success) {
        setUserCallingNumbers(data.callingNumbers || []);
        const defaultCn = (data.callingNumbers || []).find((cn: CallingNumber) => cn.isDefault);
        if (defaultCn) {
          setSelectedCallingNumberId(defaultCn.id);
        } else if ((data.callingNumbers || []).length > 0) {
          setSelectedCallingNumberId(data.callingNumbers[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching user calling numbers:', err);
    }
  };

  const fetchCallingMode = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/calling-mode', { headers });
      const data = await res.json();
      if (data.success) {
        setCallingModePreference(data.callingMode);
      }
    } catch (err) {
      console.error('Failed to fetch calling mode', err);
    }
  };

  const updateCallingMode = async (mode: 'NATIVE_DIALER' | 'PROVIDER_CALLING') => {
    setIsUpdatingMode(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/v1/calling-mode', {
        method: 'POST',
        headers,
        body: JSON.stringify({ callingMode: mode })
      });
      setCallingModePreference(mode);
    } catch (err) {
      console.error('Failed to update calling mode', err);
    } finally {
      setIsUpdatingMode(false);
    }
  };

  useEffect(() => {
    fetchManualCallHistory();
    fetchCallingNumbers();
    fetchCallingMode();
  }, [selectedLeadId]);

  // Handle Initiating Manual Call
  const handleStartManualCall = async () => {
    setErrorMessage(null);
    setManualCallNotice(null);
    setDialerLaunchFailed(false);

    let destinationNumber = '';
    let contactName = '';
    let companyName = '';
    let notes = '';

    if (isDirectDial) {
      const selectedCountry = ISO_COUNTRIES.find(c => c.dialCode === directCountryCode);
      if (!selectedCountry) {
        setErrorMessage('Invalid country selected.');
        return;
      }
      const norm = validateAndNormalizeE164(directNumberInput, {
        dialCode: directCountryCode,
        countryCode: selectedCountry.code
      });
      if (!norm.valid || !norm.e164Number) {
        setErrorMessage(norm.error || 'Invalid phone number format.');
        return;
      }
      destinationNumber = norm.e164Number;
      contactName = directContactName || 'Direct Dial Contact';
      companyName = directCompanyName || 'N/A';
      notes = directNotes || '';
    } else {
      if (!selectedLead) {
        setErrorMessage('Please select a lead first.');
        return;
      }
      const norm = validateAndNormalizeE164(selectedLead.phone || '');
      if (!norm.valid || !norm.e164Number) {
        setErrorMessage(`Lead phone number invalid: ${norm.error || 'Malformed phone number'}`);
        return;
      }
      destinationNumber = norm.e164Number;
      if (!isValidPhone(selectedLead.phone)) {
        setErrorMessage(`Lead "${selectedLead.name}" does not have a valid phone number.`);
        return;
      }
      destinationNumber = selectedLead.phone;
      contactName = selectedLead.name;
      companyName = selectedLead.company || 'N/A';
      notes = '';
    }

    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    
    // 1. If NATIVE_DIALER mode, trigger tel: launch synchronously inside user click event
    if (callingModePreference === 'NATIVE_DIALER') {
      if (isIframe) {
        setErrorMessage("Native dialing is unavailable in this preview. Open the deployed SalesPilot application in your normal browser/device to place the call.");
      } else {
        try {
          const link = document.createElement("a");
          link.href = `tel:${destinationNumber}`;
          link.rel = "nofollow";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setManualCallNotice(`Native dialing requested for ${contactName} at ${destinationNumber}.`);
        } catch (err) {
          console.error("Failed to open native dialer:", err);
          setDialerLaunchFailed(true);
          setErrorMessage("Could not open your device dialer. Please make sure Windows Phone Link or another phone application is configured to handle phone links.");
        }
      }
    }

    setIsInitiatingManualCall(true);
    setShowManualConfirmModal(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/v1/manual-calls/initiate';
      let payload: any = {
        leadId: isDirectDial ? undefined : selectedLead?.id,
        phoneNumber: destinationNumber,
        callingNumberId: selectedCallingNumberId || undefined,
        callingMode: callingModePreference
      };

      if (isDirectDial) {
        url = '/api/v1/manual-calls/dial';
        payload = {
          destinationNumber,
          contactName,
          companyName,
          notes,
          callingNumberId: selectedCallingNumberId || undefined,
          callingMode: callingModePreference
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate manual call');
      }

      setActiveManualActivity(data.activity);
      setShowManualOutcomeCard(true);
      setManualOutcome('Connected');
      setManualNotes('');
      
      const callingFromNotice = data.callingNumberUsed ? ` (from ${data.callingNumberUsed})` : '';
      setManualCallNotice(`Call initiated for ${contactName}${callingFromNotice}. Opening device dialer...`);

      // Update manual call activity status to DIALER_LAUNCH_REQUESTED in database if we are using NATIVE_DIALER
      if (callingModePreference === 'NATIVE_DIALER') {
        try {
          const updateRes = await fetch('/api/v1/manual-calls/outcome', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              activityId: data.activity.id,
              leadId: isDirectDial ? undefined : (selectedLead?.id || data.activity.leadId),
              outcome: 'DIALER_LAUNCH_REQUESTED',
              notes: 'Successfully handed tel: URL to the browser for native device dialing.'
            })
          });
          const updateData = await updateRes.json();
          if (updateData.success && updateData.activity) {
            setActiveManualActivity(updateData.activity);
          }
        } catch (err) {
          console.warn("Could not update call activity status to DIALER_LAUNCH_REQUESTED", err);
        }
      }

      // Refresh activity log
      fetchManualCallHistory();
    } catch (err: any) {
      console.error("Backend logging failed:", err);
      if (callingModePreference === 'PROVIDER_CALLING') {
        setErrorMessage(err.message || 'Error launching provider call');
      } else {
        setErrorMessage(`Backend activity log failed: ${err.message || 'Server connection error'}. However, your device dialer was launched.`);
      }
    } finally {
      setIsInitiatingManualCall(false);
    }
  };

  // Handle Saving Manual Call Outcome
  const handleSaveManualOutcome = async () => {
    if (!selectedLead && !activeManualActivity) return;

    setIsSavingOutcome(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/manual-calls/outcome', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          activityId: activeManualActivity?.id,
          leadId: selectedLead?.id || activeManualActivity?.leadId,
          outcome: manualOutcome,
          notes: manualNotes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save call outcome');
      }

      // Phase 6 follow-up auto-scheduling if outcome is 'Call Back Later'
      if (manualOutcome === 'Call Back Later' && scheduleFollowUpAfterCall && followUpDueAt) {
        const fupRes = await fetch('/api/v1/follow-ups', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            leadId: selectedLead?.id || activeManualActivity?.leadId,
            callId: activeManualActivity?.id || data.activity?.id || null,
            title: followUpTitle || `Follow-up Call with ${selectedLead?.name || 'Lead'}`,
            description: manualNotes || '',
            dueAt: new Date(followUpDueAt).toISOString(),
            priority: followUpPriority,
            source: 'MANUAL_CALL'
          })
        });
        const fupData = await fupRes.json();
        if (!fupRes.ok || !fupData.success) {
          console.warn('Follow-up auto-scheduling failed:', fupData.error);
        }
      }

      // Update lead status locally if affected
      if (selectedLead && (manualOutcome === 'Interested' || manualOutcome === 'Meeting Requested')) {
        const newStatus = manualOutcome === 'Interested' ? 'INTERESTED' : 'MEETING_BOOKED';
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newStatus as any } : l));
      }

      setShowManualOutcomeCard(false);
      setActiveManualActivity(null);
      setManualCallNotice('Call outcome successfully recorded in CRM.');
      fetchManualCallHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving outcome');
    } finally {
      setIsSavingOutcome(false);
    }
  };

  // Pre-populate follow-up schedule inputs when manualOutcome becomes 'Call Back Later'
  useEffect(() => {
    if (manualOutcome === 'Call Back Later' && selectedLead) {
      setFollowUpTitle(`Follow-up Call with ${selectedLead.name}`);
      // Pre-set to exactly 24 hours from now
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      const tzOffset = tomorrow.getTimezoneOffset() * 60000;
      const localIso = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
      setFollowUpDueAt(localIso);
    }
  }, [manualOutcome, selectedLead]);

  // Auto-populate config form opening message when selected lead changes
  useEffect(() => {
    if (selectedLead) {
      if (!selectedLeadId && leads.length > 0) {
        setSelectedLeadId(leads[0].id);
      }
      setConfigForm(prev => ({
        ...prev,
        openingMessage: `Hi ${selectedLead.name || 'there'}, this is Astra calling from SalesPilot regarding your business at ${selectedLead.company || 'your company'}. Do you have a quick minute?`
      }));
    }
  }, [selectedLeadId, leads]);

  // Fetch Provider Config & Calls on Mount
  const fetchProviderConfig = async () => {
    setIsLoadingProvider(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/voice/provider/config', { headers });
      const data = await res.json();
      if (data.success) {
        setProviderConfig({
          configured: data.configured,
          providerName: data.providerName,
          supportedVoices: data.supportedVoices || []
        });
      }
    } catch (err) {
      console.error('Error fetching voice provider config:', err);
    } finally {
      setIsLoadingProvider(false);
    }
  };

  const fetchCalls = async () => {
    setIsLoadingCalls(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/voice/calls', { headers });
      const data = await res.json();
      if (data.success) {
        setCalls(data.calls || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching voice calls:', err);
    } finally {
      setIsLoadingCalls(false);
    }
  };

  useEffect(() => {
    fetchProviderConfig();
    fetchCalls();
  }, []);

  // Poll active call status when a call is running
  useEffect(() => {
    let interval: any;
    if (activeCall && ['QUEUED', 'DIALING', 'RINGING', 'IN_PROGRESS'].includes(activeCall.status)) {
      interval = setInterval(async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const res = await fetch(`/api/v1/voice/calls/${activeCall.id}`, { headers });
          const data = await res.json();
          if (data.success && data.call) {
            setActiveCall(data.call);
            if (data.call.status === 'IN_PROGRESS') {
              setActiveDuration(prev => prev + 2);
            }
            if (['COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY', 'CANCELLED'].includes(data.call.status)) {
              fetchCalls(); // Refresh history
            }
          }
        } catch (err) {
          console.error('Error polling active call:', err);
        }
      }, 2000);
    } else if (!activeCall) {
      setActiveDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  // Phone Number Validation Helper
  const isValidPhone = (phone?: string): boolean => {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7;
  };

  // Open Call Detail Drawer & Fetch Events
  const openCallDetails = async (call: VoiceCallRecord) => {
    setSelectedCall(call);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/voice/calls/${call.id}`, { headers });
      const data = await res.json();
      if (data.success) {
        setSelectedCall(data.call);
        setCallEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching call detail events:', err);
    }
  };

  // Initiate AI Voice Call Handler
  const handleInitiateCall = async () => {
    setErrorMessage(null);
    if (!selectedLead) {
      setErrorMessage('Please select a lead first.');
      return;
    }

    if (!isValidPhone(selectedLead.phone)) {
      setErrorMessage(`Lead "${selectedLead.name}" does not have a valid phone number.`);
      return;
    }

    if (!providerConfig.configured) {
      setErrorMessage('Voice provider not configured');
      return;
    }

    setIsInitiating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const res = await fetch('/api/v1/voice/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          leadId: selectedLead.id,
          phoneNumber: selectedLead.phone,
          agentName: configForm.agentName,
          openingMessage: configForm.openingMessage,
          callObjective: configForm.callObjective,
          companyContext: configForm.companyContext,
          leadContext: configForm.leadContext,
          maxDurationMinutes: configForm.maxDurationMinutes,
          language: configForm.language,
          voiceId: configForm.voiceId,
          meetingBookingGoal: configForm.meetingBookingGoal
        })
      });

      const data = await res.json();
      if (data.success && data.call) {
        setActiveCall(data.call);
        setShowConfigModal(false);
        fetchCalls();
      } else {
        setErrorMessage(data.error || 'Voice provider failed to initiate call.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to voice server.');
    } finally {
      setIsInitiating(false);
    }
  };

  // Cancel / End Active Call Handler
  const handleCancelCall = async (callId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const res = await fetch(`/api/v1/voice/calls/${callId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success && data.call) {
        setActiveCall(data.call);
        fetchCalls();
      }
    } catch (err) {
      console.error('Error cancelling call:', err);
    }
  };

  // Confirm Outcome & Sync CRM Handler
  const handleConfirmOutcome = async () => {
    if (!selectedCall) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const res = await fetch(`/api/v1/voice/calls/${selectedCall.id}/outcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          outcome: selectedOutcome,
          summary: outcomeSummary || selectedCall.summary,
          bookMeeting,
          meetingDetails: bookMeeting ? {
            title: meetingForm.title || `Intro Call - ${selectedCall.company || selectedCall.leadName}`,
            date: meetingForm.date,
            time: meetingForm.time
          } : undefined
        })
      });

      const data = await res.json();
      if (data.success && data.call) {
        setSelectedCall(data.call);
        setShowOutcomeModal(false);
        fetchCalls();

        // Refresh CRM leads & appointments
        if (selectedOutcome === 'INTERESTED') {
          setLeads(prev => prev.map(l => l.id === selectedCall.leadId ? { ...l, status: 'INTERESTED' as any } : l));
        }
        if (bookMeeting) {
          const newAppt: Appointment = {
            id: 'appt_v_' + Date.now(),
            organizationId: selectedCall.organizationId,
            leadId: selectedCall.leadId,
            leadName: selectedCall.leadName || 'Contact',
            company: selectedCall.company || '',
            email: selectedCall.email || '',
            title: meetingForm.title || `Intro Call - ${selectedCall.company || selectedCall.leadName}`,
            dateTime: `${meetingForm.date}T${meetingForm.time}:00.000Z`,
            durationMins: 30,
            status: 'SCHEDULED',
            meetingLink: 'https://meet.google.com/salespilot-demo',
            notes: `Booked via AI Voice Call (${selectedCall.id}).`,
            createdAt: new Date().toISOString()
          };
          setAppointments(prev => [newAppt, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error confirming outcome:', err);
    }
  };

  // Filtered Calls History List
  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      (call.leadName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (call.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (call.phoneNumber || '').includes(searchQuery);
    
    const matchesStatus = statusFilter === 'ALL' || call.status === statusFilter || call.outcome === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Provider Notice */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl">
              <PhoneCall className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Voice Calling Assistant</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Production AI SDR calling module integrated with workspace leads, state machine, and CRM.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isLoadingProvider ? (
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking provider...</span>
            </div>
          ) : providerConfig.configured ? (
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Voice Provider Online: {providerConfig.providerName}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Voice provider not configured</span>
            </div>
          )}

          <button
            onClick={() => { fetchProviderConfig(); fetchCalls(); }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 md:space-x-4 pt-2 overflow-x-auto">
        <button
          onClick={() => setCallingMode('MANUAL')}
          className={`pb-3 px-3 font-bold text-xs md:text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            callingMode === 'MANUAL'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Make a Call</span>
          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">Native Dialer</span>
        </button>

        <button
          onClick={() => setCallingMode('HISTORY')}
          className={`pb-3 px-3 font-bold text-xs md:text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            callingMode === 'HISTORY'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Call History</span>
        </button>

        <button
          onClick={() => setCallingMode('ANALYTICS')}
          className={`pb-3 px-3 font-bold text-xs md:text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            callingMode === 'ANALYTICS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setCallingMode('CALLING_NUMBERS')}
          className={`pb-3 px-3 font-bold text-xs md:text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            callingMode === 'CALLING_NUMBERS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Calling Numbers</span>
          {userCallingNumbers.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {userCallingNumbers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCallingMode('FOLLOW_UPS')}
          className={`pb-3 px-3 font-bold text-xs md:text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            callingMode === 'FOLLOW_UPS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Follow-Ups</span>
        </button>

        <button
          onClick={() => setCallingMode('AI_VOICE')}
          className={`pb-3 px-3 font-bold text-xs md:text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            callingMode === 'AI_VOICE'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Voice Agent (Preview)</span>
        </button>
      </div>

      {/* CALL HISTORY TAB */}
      {callingMode === 'HISTORY' && (
        <CallHistoryView />
      )}

      {/* ANALYTICS TAB */}
      {callingMode === 'ANALYTICS' && (
        <ManualCallingAnalyticsView />
      )}

      {/* FOLLOW-UPS TAB */}
      {callingMode === 'FOLLOW_UPS' && (
        <FollowUpsView />
      )}

      {/* CALLING NUMBERS MANAGEMENT TAB */}
      {callingMode === 'CALLING_NUMBERS' && (
        <MyCallingNumbers />
      )}

      {/* MANUAL PHONE CALL MODE (Phase 4 & Direct Dial) */}
      {callingMode === 'MANUAL' && (
        <div className="space-y-6">
          {/* Global Notice / Error Messages */}
          {dialerLaunchFailed && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-3 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Could not open your device dialer</span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    Please make sure Windows Phone Link or another phone application is configured to handle phone links (tel:).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    const num = isDirectDial ? `${directCountryCode}${directNumberInput.replace(/\D/g, '')}` : (selectedLead?.phone || '');
                    navigator.clipboard.writeText(num);
                    setManualCallNotice(`Copied number ${num} to clipboard!`);
                  }}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-bold rounded-lg transition"
                >
                  Copy Number
                </button>
                <button
                  onClick={() => {
                    setDialerLaunchFailed(false);
                    handleStartManualCall();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  Try Dialer Again
                </button>
              </div>
            </div>
          )}

          {manualCallNotice && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{manualCallNotice}</span>
              </div>
              <button onClick={() => setManualCallNotice(null)} className="text-emerald-600 hover:text-emerald-800">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Calling Mode Selector */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max">
            <button
              onClick={() => updateCallingMode('NATIVE_DIALER')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg ${callingModePreference === 'NATIVE_DIALER' ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Native Dialer — Free
            </button>
            <button
              onClick={() => updateCallingMode('PROVIDER_CALLING')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg ${callingModePreference === 'PROVIDER_CALLING' ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Provider Calling — {providerConfig.configured ? 'Connected' : 'Not Configured'}
            </button>
          </div>

          {/* Mode Selector: [ Call a Lead ] | [ Dial Number ] */}
          <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setManualTab('LEAD')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer ${
                manualTab === 'LEAD'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Call a Lead</span>
            </button>

            <button
              onClick={() => setManualTab('DIRECT_DIAL')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer ${
                manualTab === 'DIRECT_DIAL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Dial Number (Direct Dial)</span>
            </button>
          </div>

          {manualTab === 'DIRECT_DIAL' ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  Direct Number Dialing
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter any phone number for existing customers, referrals, cold contacts, or external numbers.
                </p>
              </div>

              {/* Verified Calling Identity Status */}
              {callingModePreference === 'NATIVE_DIALER' ? (
                <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    Native Dialer Mode is active. Calls are placed using your device's native phone application. No telephony config or verified calling numbers are required.
                  </span>
                </div>
              ) : (() => {
                const verifiedCn = userCallingNumbers.find(cn => cn.isDefault && cn.isVerified) || userCallingNumbers.find(cn => cn.isVerified);
                if (!verifiedCn) {
                  return (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                      <div className="space-y-1">
                        <span className="font-bold">No Verified Calling Number</span>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Connect and verify your personal calling number before placing calls.
                        </p>
                      </div>
                      <button
                        onClick={() => setCallingMode('CALLING_NUMBERS')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition shrink-0 cursor-pointer"
                      >
                        Manage Numbers
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                    <span className="font-semibold">
                      Calling from (Your Verified Identity): <strong className="font-mono font-bold text-blue-600 dark:text-blue-400">{verifiedCn.phoneNumber}</strong>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                );
              })()}

              {callingModePreference === 'PROVIDER_CALLING' && !providerConfig.configured && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">Telephony Provider Not Configured</span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Edesy calling provider is not configured. Add EDESY_API_KEY in the server environment to place real calls.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleStartDirectDial} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Destination Phone Number *
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative shrink-0" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1.5 min-w-[75px] h-full justify-between"
                      >
                        <span>
                          {ISO_COUNTRIES.find(c => c.dialCode === directCountryCode)?.flag || '🌐'}{' '}
                          {directCountryCode}
                        </span>
                        <span className="text-[10px] text-slate-400">▼</span>
                      </button>

                      {isCountryDropdownOpen && (
                        <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-2 max-h-60 overflow-y-auto">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={countrySearchQuery}
                              onChange={e => setCountrySearchQuery(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                            {ISO_COUNTRIES.filter(c => 
                              c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) || 
                              c.dialCode.includes(countrySearchQuery) || 
                              c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
                            ).map(c => (
                              <button
                                key={`${c.code}-${c.dialCode}`}
                                type="button"
                                onClick={() => {
                                  setDirectCountryCode(c.dialCode);
                                  setIsCountryDropdownOpen(false);
                                  setCountrySearchQuery('');
                                }}
                                className="w-full flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-750 dark:text-slate-250 text-left"
                              >
                                <span className="flex items-center gap-2 overflow-hidden truncate">
                                  <span>{c.flag}</span>
                                  <span className="truncate">{c.name}</span>
                                </span>
                                <span className="font-mono text-slate-400 shrink-0">{c.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="tel"
                      value={directNumberInput}
                      onChange={(e) => setDirectNumberInput(e.target.value)}
                      placeholder="7498630805"
                      required
                      className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    E.164 preview: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{directCountryCode}{directNumberInput.replace(/\D/g, '') || 'XXXXXXXXXX'}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Contact Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={directContactName}
                      onChange={(e) => setDirectContactName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={directCompanyName}
                      onChange={(e) => setDirectCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Call Notes / Context (Optional)
                  </label>
                  <textarea
                    value={directNotes}
                    onChange={(e) => setDirectNotes(e.target.value)}
                    placeholder="Add brief notes about this contact..."
                    rows={3}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isDialingDirect || !directNumberInput.trim()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center space-x-2 cursor-pointer"
                  >
                    {isDialingDirect ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Initiating Call...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>Dial Number & Call</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Direct Dial Live Call & Outcome Tracker Card */}
              {showManualOutcomeCard && activeManualActivity && activeManualActivity.source === 'DIRECT_DIAL' && (
                <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>Outbound Direct Dial Call</span>
                        </h4>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px] rounded-full">
                          Direct Dial
                        </span>
                        {/* Live Call Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          activeManualActivity.status === 'IN_PROGRESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : activeManualActivity.status === 'RINGING'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : ['QUEUED', 'DIALING'].includes(activeManualActivity.status)
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : activeManualActivity.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            : ['FAILED', 'BUSY', 'NO_ANSWER', 'CANCELLED'].includes(activeManualActivity.status)
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {['QUEUED', 'DIALING', 'RINGING', 'IN_PROGRESS'].includes(activeManualActivity.status) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping mr-1" />
                          )}
                          <span>
                            {activeManualActivity.status === 'IN_PROGRESS'
                              ? 'In Progress (Connected)'
                              : activeManualActivity.status === 'RINGING'
                              ? 'Ringing...'
                              : activeManualActivity.status === 'DIALING'
                              ? 'Dialing...'
                              : activeManualActivity.status === 'QUEUED'
                              ? 'Queued'
                              : activeManualActivity.status === 'COMPLETED'
                              ? 'Completed'
                              : activeManualActivity.status === 'FAILED'
                              ? 'Failed'
                              : activeManualActivity.status === 'BUSY'
                              ? 'Busy'
                              : activeManualActivity.status === 'NO_ANSWER'
                              ? 'No Answer'
                              : activeManualActivity.status === 'CANCELLED'
                              ? 'Cancelled'
                              : activeManualActivity.status}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        Destination: <span className="font-bold text-slate-700 dark:text-slate-300">{activeManualActivity.destinationNumber}</span> ({activeManualActivity.contactName || 'Contact'}) • Caller ID: <span className="font-bold text-slate-700 dark:text-slate-300">{activeManualActivity.callingNumberSnapshot || activeManualActivity.callingNumber}</span>
                      </p>
                      {activeManualActivity.status === 'IN_PROGRESS' && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-bold">
                          Live Call Duration: {Math.floor(directDialDuration / 60)}:{(directDialDuration % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>

                    {/* End Call Button if call is active */}
                    {['QUEUED', 'DIALING', 'RINGING', 'IN_PROGRESS'].includes(activeManualActivity.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancelDirectDialCall(activeManualActivity.id)}
                        disabled={isCancellingDirectDial}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        {isCancellingDirectDial ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PhoneOff className="w-3.5 h-3.5" />}
                        <span>End Call</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Call Outcome
                      </label>
                      <select
                        value={manualOutcome}
                        onChange={(e) => setManualOutcome(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="Connected">Connected</option>
                        <option value="No Answer">No Answer</option>
                        <option value="Busy">Busy</option>
                        <option value="Call Back Later">Call Back Later</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Interested">Interested</option>
                        <option value="Meeting Requested">Meeting Requested</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Outcome Notes
                      </label>
                      <textarea
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="Log notes about the conversation..."
                        rows={2}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        onClick={handleSaveManualOutcome}
                        disabled={isSavingOutcome}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2 cursor-pointer"
                      >
                        {isSavingOutcome && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Call Outcome</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Manual Outbound Call Launcher
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a lead and initiate a call directly from your device's native phone app.
                </p>
              </div>

              <button
                onClick={() => { setIsDirectDial(false); setShowManualConfirmModal(true); }}
                disabled={!selectedLead || !isValidPhone(selectedLead?.phone)}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call Lead</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Lead Selector List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Workspace Leads ({leads.length})
                </label>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {leads.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                      No leads found in workspace.
                    </div>
                  ) : (
                    leads.map(lead => {
                      const validPhone = isValidPhone(lead.phone);
                      const isSelected = selectedLead?.id === lead.id;
                      return (
                        <div
                          key={lead.id}
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setShowManualOutcomeCard(false);
                          }}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{lead.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{lead.company || 'No Company'}</div>
                          </div>

                          <div className="text-right">
                            {validPhone ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                                {lead.phone}
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full">
                                No Valid Phone
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Lead Details Card */}
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                {selectedLead ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedLead.name || `${selectedLead.firstName || ''} ${selectedLead.lastName || ''}`.trim()}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedLead.title || (selectedLead as any).jobTitle || 'Decision Maker'}</p>
                      </div>

                      {isValidPhone(selectedLead.phone) ? (
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Phone Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Missing Phone Number</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Company Name
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLead.company || (selectedLead as any).companyName || 'N/A'}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> Phone Number
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {selectedLead.phone || 'Not provided'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLead.email || 'N/A'}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Website
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{(selectedLead as any).website || selectedLead.enrichment?.website || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Warning Notice Box */}
                    {callingModePreference === 'NATIVE_DIALER' ? (
                      <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-start space-x-3 text-xs text-blue-800 dark:text-blue-300">
                        <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-blue-900 dark:text-blue-200">Native Dialer — Free</span>
                          <p className="mt-0.5 text-blue-700 dark:text-blue-400">
                            Calls are placed using your device's phone/dialer. No telephony provider is required.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-amber-900 dark:text-amber-200">Provider Calling Mode</span>
                          <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                            {providerConfig.configured 
                              ? `Calls are routed securely through ${providerConfig.providerName || 'Edesy'} calling provider.`
                              : "Edesy telephony provider is not configured. Configure EDESY_API_KEY or switch to Native Dialer."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Button inside details card */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => { setIsDirectDial(false); setShowManualConfirmModal(true); }}
                        disabled={!isValidPhone(selectedLead.phone)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call {selectedLead.company || selectedLead.name} Now</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Select a lead from the list to preview details and place a phone call.
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Log Call Outcome Card (Shown after call initiation or on request) */}
          {(showManualOutcomeCard || activeManualActivity) && selectedLead && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-blue-500 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    Log Call Outcome for {selectedLead.name} ({selectedLead.company || 'Company'})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select the explicit outcome after placing your call from your phone app.
                  </p>
                </div>

                <button
                  onClick={() => setShowManualOutcomeCard(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Call Outcome Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[
                    'Connected',
                    'No Answer',
                    'Busy',
                    'Call Back Later',
                    'Not Interested',
                    'Interested',
                    'Meeting Requested'
                  ].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setManualOutcome(opt)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition ${
                        manualOutcome === opt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Call Notes & Next Steps
                  </label>
                  <textarea
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                    placeholder="Enter details from your phone conversation..."
                    rows={3}
                    className="w-full mt-1.5 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {manualOutcome === 'Call Back Later' && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Schedule Follow-Up Task</span>
                      </span>
                      <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        <input
                          type="checkbox"
                          checked={scheduleFollowUpAfterCall}
                          onChange={e => setScheduleFollowUpAfterCall(e.target.checked)}
                          className="rounded border-slate-300 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span>Enable Auto-Schedule</span>
                      </label>
                    </div>

                    {scheduleFollowUpAfterCall && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Task Title</label>
                          <input
                            type="text"
                            value={followUpTitle}
                            onChange={e => setFollowUpTitle(e.target.value)}
                            placeholder="e.g. Call back"
                            className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date & Time</label>
                          <input
                            type="datetime-local"
                            value={followUpDueAt}
                            onChange={e => setFollowUpDueAt(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                          <div className="flex space-x-2">
                            {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setFollowUpPriority(p as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                  followUpPriority === p
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setShowManualOutcomeCard(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  >
                    Skip / Log Later
                  </button>
                  <button
                    onClick={handleSaveManualOutcome}
                    disabled={isSavingOutcome}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2"
                  >
                    {isSavingOutcome && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Call Outcome to CRM</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Calls History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Manual Outbound Call History</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit trail of device calls initiated from SalesPilot.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 pl-5">Phone Number</th>
                    <th className="p-3.5">Direction</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Explicit Outcome</th>
                    <th className="p-3.5">Notes</th>
                    <th className="p-3.5 pr-5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {manualCallHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                        No manual call activities recorded yet. Select a lead and click "Call Lead" to launch a call from your phone.
                      </td>
                    </tr>
                  ) : (
                    manualCallHistory.map(act => (
                      <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 pl-5 font-mono font-semibold text-slate-900 dark:text-white">
                          {act.phoneNumber}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[10px]">
                            {act.direction || 'OUTBOUND'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            act.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {act.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {act.outcome || 'Pending Outcome'}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {act.notes || '—'}
                        </td>
                        <td className="p-3.5 pr-5 text-slate-400 text-[11px]">
                          {new Date(act.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI VOICE AGENT MODE (Keep Existing Functionality Intact) */}
      {callingMode === 'AI_VOICE' && (
        <div className="space-y-6">
          {/* Provider Diagnostic Banner */}
          {callingModePreference === 'PROVIDER_CALLING' && !providerConfig.configured ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-amber-800 dark:text-amber-300">Telephony Provider Not Configured</span>
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                  Edesy calling provider is not configured. Add <code className="bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-xs font-mono">EDESY_API_KEY</code> in server environment variables to place real calls.
                </p>
              </div>
            </div>
          ) : providerConfig.configured ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">Production Diagnostic: Telephony Provider Active ({providerConfig.providerName || 'Edesy'})</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">READY FOR CONTROLLED CALL</span>
                </div>
                <p className="text-emerald-700 dark:text-emerald-300 text-xs mt-1 font-mono">
                  Webhook Endpoint: {providerConfig.webhookUrl || 'https://sales-pilot-f4uv.vercel.app/api/v1/voice/webhook'} • Environment: production
                </p>
              </div>
            </div>
          ) : null}

      {/* 2. Dashboard KPI Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Calls</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalCalls}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Calls</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completedCalls}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Calls In Progress</span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.callsInProgress}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Interested Leads</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.interestedLeads}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Meetings Requested</span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.meetingsRequested}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Failed Calls</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.failedCalls}</div>
        </div>
      </div>

      {/* Active Call Floating Bar if call is running */}
      {activeCall && ['QUEUED', 'DIALING', 'RINGING', 'IN_PROGRESS'].includes(activeCall.status) && (
        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Phone className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base">{activeCall.leadName || 'Lead Call'}</span>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
                  {activeCall.status}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Calling {activeCall.phoneNumber} • Agent: {activeCall.agentName} • Duration: {activeDuration}s
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCancelCall(activeCall.id)}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      )}

      {/* Active Direct Dial Call Floating Bar if call is running */}
      {activeManualActivity && activeManualActivity.source === 'DIRECT_DIAL' && ['QUEUED', 'DIALING', 'RINGING', 'IN_PROGRESS'].includes(activeManualActivity.status) && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Phone className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base">{activeManualActivity.contactName || activeManualActivity.destinationNumber}</span>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
                  {activeManualActivity.status}
                </span>
                <span className="bg-emerald-800/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Direct Dial
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Calling {activeManualActivity.destinationNumber} • Caller ID: {activeManualActivity.callingNumberSnapshot || activeManualActivity.callingNumber} • Duration: {Math.floor(directDialDuration / 60)}:{(directDialDuration % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCancelDirectDialCall(activeManualActivity.id)}
            disabled={isCancellingDirectDial}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
          >
            {isCancellingDirectDial ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
            <span>End Call</span>
          </button>
        </div>
      )}

      {/* 3. Lead-to-Call Workflow Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Lead-to-Call Workflow
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an eligible workspace lead to configure and launch an AI voice call.
            </p>
          </div>

          <button
            onClick={() => setShowConfigModal(true)}
            disabled={!selectedLead || !isValidPhone(selectedLead?.phone)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center space-x-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Configure & Start AI Call</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Lead Selector List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Workspace Leads ({leads.length})
            </label>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {leads.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                  No leads found in workspace.
                </div>
              ) : (
                leads.map(lead => {
                  const validPhone = isValidPhone(lead.phone);
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{lead.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{lead.company || 'No Company'}</div>
                      </div>

                      <div className="text-right">
                        {validPhone ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                            {lead.phone}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full">
                            No Valid Phone
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Lead Detailed Card */}
          <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            {selectedLead ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedLead.name || `${selectedLead.firstName || ''} ${selectedLead.lastName || ''}`.trim()}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedLead.title || 'Decision Maker'}</p>
                  </div>

                  {isValidPhone(selectedLead.phone) ? (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready for Voice Call</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Missing Phone Number</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Company
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLead.company || selectedLead.companyName || 'N/A'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone Number
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedLead.phone || 'Not provided'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLead.email || 'N/A'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{(selectedLead as any).website || selectedLead.enrichment?.website || 'N/A'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Select a lead to preview contact parameters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Recent Call History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Call Activity History</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Persistent call records with transcripts, events, and CRM outcomes.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search lead or phone..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="INTERESTED">Interested</option>
              <option value="MEETING_REQUESTED">Meeting Requested</option>
              <option value="FAILED">Failed / No Answer</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Lead / Company</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Outcome</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingCalls ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <span>Loading call history...</span>
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No voice calls found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCalls.map(call => (
                  <tr key={call.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      <div>{call.leadName || 'Contact'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{call.company || 'N/A'}</div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {call.phoneNumber}
                    </td>

                    <td className="px-5 py-3.5">
                      {call.agentName || 'Astra SDR'}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        call.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' :
                        call.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 animate-pulse' :
                        call.status === 'DIALING' || call.status === 'RINGING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        {call.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono">
                      {call.durationSeconds ? `${call.durationSeconds}s` : '--'}
                    </td>

                    <td className="px-5 py-3.5 font-semibold">
                      {call.outcome ? (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400">
                          {call.outcome.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(call.createdAt).toLocaleDateString()} {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openCallDetails(call)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold text-xs inline-flex items-center space-x-1"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* Phase 4 Manual Call Confirmation Modal */}
  {showManualConfirmModal && (selectedLead || isDirectDial) && (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-600" />
            Call {isDirectDial ? (directContactName || 'Direct Contact') : (selectedLead?.company || selectedLead?.name)}?
          </h3>
          <button
            onClick={() => setShowManualConfirmModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Lead:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {isDirectDial ? (directContactName || 'Direct Dial Contact') : selectedLead?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Company:</span>
              <span className="font-semibold">
                {isDirectDial ? (directCompanyName || 'N/A') : (selectedLead?.company || 'N/A')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lead Phone Number:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {isDirectDial ? `${directCountryCode}${directNumberInput.replace(/\D/g, '')}` : selectedLead?.phone}
              </span>
            </div>
          </div>

          {/* Calling Number Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 block">
              Calling from (Your Device Number):
            </label>
            {userCallingNumbers.length > 0 ? (
              <select
                value={selectedCallingNumberId}
                onChange={e => setSelectedCallingNumberId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {userCallingNumbers.map(cn => (
                  <option key={cn.id} value={cn.id}>
                    {cn.phoneNumber} {cn.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500 italic">No specific calling number configured</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualConfirmModal(false);
                    setCallingMode('CALLING_NUMBERS');
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-2"
                >
                  + Add Number
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start space-x-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block font-semibold">Native Device Dialer Warning:</strong>
              <span>SalesPilot will open your device's native phone app. The call is placed directly from your device.</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            onClick={() => setShowManualConfirmModal(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={handleStartManualCall}
            disabled={isInitiatingManualCall}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2"
          >
            {isInitiatingManualCall ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Initiating...</span>
              </>
            ) : (
              <>
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )}

      {/* 5. Call Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Configure AI Voice Call
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">AI Agent Name</label>
                <input
                  type="text"
                  value={configForm.agentName}
                  onChange={e => setConfigForm({ ...configForm, agentName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Opening Message</label>
                <textarea
                  rows={2}
                  value={configForm.openingMessage}
                  onChange={e => setConfigForm({ ...configForm, openingMessage: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Call Objective</label>
                <input
                  type="text"
                  value={configForm.callObjective}
                  onChange={e => setConfigForm({ ...configForm, callObjective: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Language</label>
                  <select
                    value={configForm.language}
                    onChange={e => setConfigForm({ ...configForm, language: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="hi-IN">Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Voice Persona</label>
                  <select
                    value={configForm.voiceId}
                    onChange={e => setConfigForm({ ...configForm, voiceId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="nat">Nat - Professional Female</option>
                    <option value="dom">Dom - Confident Male</option>
                    <option value="rachel">Rachel - Warm Female</option>
                    <option value="adam">Adam - Executive Male</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Max Call Duration (Minutes)</label>
                <select
                  value={configForm.maxDurationMinutes}
                  onChange={e => setConfigForm({ ...configForm, maxDurationMinutes: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 Minute</option>
                  <option value={3}>3 Minutes</option>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="meetingBookingGoal"
                  checked={configForm.meetingBookingGoal}
                  onChange={e => setConfigForm({ ...configForm, meetingBookingGoal: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="meetingBookingGoal" className="text-slate-700 dark:text-slate-300 font-medium">
                  Enable automatic meeting booking objective
                </label>
              </div>

              {/* Controlled Launch Readiness Verification */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  Controlled Single Call Launch Readiness:
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Recipient: <strong>{selectedLead?.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Phone: <strong>{selectedLead?.phone}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    {providerConfig.configured ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                    )}
                    <span>Provider: <strong>{providerConfig.providerName || 'Bland AI'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Target: <strong>Exactly 1 Call</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={handleInitiateCall}
                disabled={isInitiating || !providerConfig.configured}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2"
              >
                {isInitiating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                <span>Confirm & Launch 1 Controlled Test Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Call Detail Drawer */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Call Record Details</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedCall.id}</p>
              </div>

              <button
                onClick={() => setSelectedCall(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Metadata Overview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Lead:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedCall.leadName} ({selectedCall.company})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono">{selectedCall.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-blue-600">{selectedCall.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Outcome:</span>
                <span className="font-semibold">{selectedCall.outcome || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-mono">{selectedCall.durationSeconds || 0}s</span>
              </div>
              {selectedCall.providerCallId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Provider Ref:</span>
                  <span className="font-mono text-[10px]">{selectedCall.providerCallId}</span>
                </div>
              )}
            </div>

            {/* Audio Recording Player if available */}
            {selectedCall.recordingUrl && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Call Audio Recording</span>
                <audio controls src={selectedCall.recordingUrl} className="w-full text-xs" />
              </div>
            )}

            {/* AI Summary Section */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">AI Call Summary</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {selectedCall.summary || 'No call summary recorded yet.'}
              </div>
            </div>

            {/* Transcript Viewer */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transcript</span>
              <div className="max-h-52 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                {!selectedCall.transcript || selectedCall.transcript.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">No transcript recorded.</div>
                ) : (
                  selectedCall.transcript.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs ${
                        item.speaker === 'agent'
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 ml-4'
                          : 'bg-white text-slate-800 dark:bg-slate-700 dark:text-white mr-4 border'
                      }`}
                    >
                      <div className="font-bold text-[10px] uppercase opacity-75">{item.speaker}</div>
                      <div className="mt-0.5">{item.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions: Manual Outcome Confirmation & Book Meeting */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <button
                onClick={() => setShowOutcomeModal(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition"
              >
                Confirm Call Outcome & Sync CRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outcome Confirmation & Booking Modal */}
      {showOutcomeModal && selectedCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Call Outcome</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Confirmed Outcome</label>
                <select
                  value={selectedOutcome}
                  onChange={e => setSelectedOutcome(e.target.value as CallOutcome)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="INTERESTED">Interested Lead</option>
                  <option value="MEETING_REQUESTED">Meeting Requested</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="CALLBACK_REQUESTED">Callback Requested</option>
                  <option value="NO_ANSWER">No Answer</option>
                  <option value="BUSY">Line Busy</option>
                  <option value="FAILED">Call Failed</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Call Outcome Notes / Summary</label>
                <textarea
                  rows={2}
                  value={outcomeSummary}
                  onChange={e => setOutcomeSummary(e.target.value)}
                  placeholder="Notes from call conversation..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="bookMeetingCheck"
                  checked={bookMeeting}
                  onChange={e => setBookMeeting(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bookMeetingCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                  Book Appointment in CRM
                </label>
              </div>

              {bookMeeting && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border">
                  <div>
                    <label className="text-[10px] text-slate-500">Meeting Title</label>
                    <input
                      type="text"
                      value={meetingForm.title}
                      onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
                      placeholder={`Intro Call - ${selectedCall.company}`}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-700 border rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Date</label>
                      <input
                        type="date"
                        value={meetingForm.date}
                        onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-700 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Time</label>
                      <input
                        type="time"
                        value={meetingForm.time}
                        onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-700 border rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end space-x-3">
              <button
                onClick={() => setShowOutcomeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmOutcome}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow"
              >
                Save Outcome & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
