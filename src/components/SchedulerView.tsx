import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Video, User, Briefcase, ExternalLink, 
  CheckCircle, AlertCircle, PlusCircle, ArrowUpRight, Check, XCircle, 
  Globe, Sparkles, TrendingUp, Plus, RefreshCw, Sliders, ChevronLeft, 
  ChevronRight, Info, Bell, Edit2, History, Save, ChevronDown, CheckSquare,
  Trash2
} from 'lucide-react';
import { Appointment, Lead } from '../types';

interface SchedulerViewProps {
  appointments: Appointment[];
  leads: Lead[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setLeads?: React.Dispatch<React.SetStateAction<Lead[]>>;
  setDeals?: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveTab: (tab: string) => void;
}

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST) - GMT+5:30' },
  { value: 'America/New_York', label: 'Eastern Standard Time (EST) - GMT-5:00' },
  { value: 'America/Chicago', label: 'Central Standard Time (CST) - GMT-6:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Standard Time (PST) - GMT-8:00' },
  { value: 'Europe/London', label: 'London Standard Time (GMT) - GMT+0:00' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST) - GMT+9:00' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST) - GMT+10:00' }
];

export function SchedulerView({ 
  appointments, 
  leads, 
  setAppointments, 
  setLeads, 
  setDeals, 
  setActiveTab 
}: SchedulerViewProps) {
  
  // Auto-detect timezone
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Component States
  const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('SCHEDULED');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July (0-indexed 6)
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [timezoneView, setTimezoneView] = useState<'local' | 'scheduled'>('local');
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Google Calendar Integration States
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState('');
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState('CONNECTED');
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [externalEvents, setExternalEvents] = useState<any[]>([]);

  // Check backend connected accounts state on load
  const checkConnectionStatus = async () => {
    try {
      const res = await fetch('/calendar/accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && data.accounts.length > 0) {
          const acc = data.accounts[0];
          setGoogleCalendarConnected(true);
          setGoogleCalendarEmail(acc.email);
          setGoogleCalendarStatus(acc.status || 'CONNECTED');
        } else {
          setGoogleCalendarConnected(false);
          setGoogleCalendarEmail('');
          setGoogleCalendarStatus('DISCONNECTED');
        }
      }
    } catch (err) {
      console.error('Failed to query calendar connection accounts:', err);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Listen for Google Auth callback success postMessages from popup
  useEffect(() => {
    const handleGoogleAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const email = event.data.email;
        setGoogleCalendarConnected(true);
        setGoogleCalendarEmail(email);
        alert(`Successfully connected Google Account: ${email}.\nGmail and Calendar integrations are now fully synchronized with offline refresh support.`);
        checkConnectionStatus();
      } else if (event.data?.type === 'GOOGLE_AUTH_FAILURE') {
        alert(`Google Authentication Failed: ${event.data.error || 'Unknown error'}`);
      }
    };

    window.addEventListener('message', handleGoogleAuthMessage);
    return () => window.removeEventListener('message', handleGoogleAuthMessage);
  }, []);

  // Fetch Google Calendar External Events
  const fetchExternalEvents = async () => {
    if (!googleCalendarConnected || !googleCalendarEmail) return;
    try {
      const response = await fetch(`/calendar/events?email=${googleCalendarEmail}`);
      if (response.ok) {
        const data = await response.json();
        setExternalEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch external Google Calendar events:', err);
    }
  };

  useEffect(() => {
    fetchExternalEvents();
  }, [googleCalendarConnected, googleCalendarEmail]);

  const handleSyncCalendar = async () => {
    setIsSyncingCalendar(true);
    try {
      const response = await fetch(`/calendar/events?email=${googleCalendarEmail}`);
      if (response.ok) {
        const data = await response.json();
        setExternalEvents(data.events || []);
        // Also fetch local appointments
        const aptRes = await fetch('/api/v1/appointments');
        if (aptRes.ok) {
          const aptData = await aptRes.json();
          setAppointments(aptData.appointments || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleConnectCalendar = async () => {
    const isReconnect = googleCalendarStatus === 'REAUTH_NEEDED';
    console.log(`[GOOGLE OAUTH] Starting ${isReconnect ? 'RECONNECT' : 'CONNECT'} flow...`);
    setLoadingId(isReconnect ? 'reconnect-calendar' : 'connect-calendar');
    try {
      console.log(`[GOOGLE OAUTH] Fetching auth URL from /api/auth/google/url...`);
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const errData = await res.json();
        console.error(`[GOOGLE OAUTH] Server returned error fetching auth URL:`, errData);
        throw new Error(errData.error || 'Failed to fetch Google Auth URL.');
      }
      const data = await res.json();
      console.log(`[GOOGLE OAUTH] Successfully fetched auth URL:`, data.url);
      
      const width = 550;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      console.log(`[GOOGLE OAUTH] Attempting to open popup for Google authorization...`);
      const popup = window.open(
        data.url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );
      
      if (!popup) {
        console.warn(`[GOOGLE OAUTH] Popup blocked or failed. Redirecting browser window directly to Google OAuth:`, data.url);
        window.location.href = data.url;
      } else {
        console.log(`[GOOGLE OAUTH] Popup successfully opened.`);
      }
    } catch (err: any) {
      console.error(`[GOOGLE OAUTH ERROR]`, err);
      alert(`Authorization failed: ${err.message || String(err)}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar integration?')) return;
    
    setLoadingId('disconnect-calendar');
    try {
      const res = await fetch('/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleCalendarEmail })
      });
      if (res.ok) {
        setGoogleCalendarConnected(false);
        setGoogleCalendarEmail('');
        setExternalEvents([]);
        alert('Google Calendar has been disconnected.');
      }
    } catch (err) {
      console.error('Failed to disconnect Google Calendar:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event from Google Calendar?')) return;
    setLoadingId(`delete-${eventId}`);
    try {
      const response = await fetch('/calendar/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      if (response.ok) {
        setExternalEvents(prev => prev.filter(e => e.id !== eventId));
        // Refresh local appointments too if it was synced
        const aptRes = await fetch('/api/v1/appointments');
        if (aptRes.ok) {
          const aptData = await aptRes.json();
          setAppointments(aptData.appointments || []);
        }
        alert('Event deleted successfully from Google Calendar.');
      } else {
        alert('Failed to delete Google Calendar event.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  // Form States
  const [bookingForm, setBookingForm] = useState({
    leadId: '',
    date: '2026-07-10',
    time: '14:30',
    durationMins: 30,
    timezone: detectedTimezone || 'Asia/Kolkata',
    notes: '',
    isOnline: true
  });

  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleRunE2ETest = async () => {
    setIsRunningTest(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/v1/test-calendar-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setTestResult(data);
      if (data.success) {
        alert(`Google Calendar E2E Test Succeeded!\n\nSubject: ${data.summary.summary}\nEvent ID: ${data.summary.eventId}\nMeet URL: ${data.summary.meetLink || 'N/A'}`);
      } else {
        alert(`Google Calendar E2E Test Failed:\n\n${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Network failure triggering E2E test: ${err.message || String(err)}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    durationMins: 30,
    timezone: 'Asia/Kolkata',
    notes: '',
    status: 'SCHEDULED' as any
  });

  // Calendar Helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  // Convert dates dynamically
  const formatAptTime = (isoString: string, aptTimezone?: string) => {
    const d = new Date(isoString);
    const tz = timezoneView === 'local' ? detectedTimezone : (aptTimezone || 'Asia/Kolkata');
    try {
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: tz
      }) + ` (${tz.split('/').pop()?.replace('_', ' ')})`;
    } catch (e) {
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const formatAptDate = (isoString: string, aptTimezone?: string) => {
    const d = new Date(isoString);
    const tz = timezoneView === 'local' ? detectedTimezone : (aptTimezone || 'Asia/Kolkata');
    try {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: tz
      });
    } catch (e) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Check which days have appointments
  const getAppointmentsForDay = (dayNum: number) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return (
        aptDate.getDate() === dayNum &&
        aptDate.getMonth() === currentMonth &&
        aptDate.getFullYear() === currentYear
      );
    });
  };

  // Create Book Appointment Action
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.leadId) {
      alert('Please select a prospect lead.');
      return;
    }

    setLoadingId('booking');
    try {
      const dateTimeIso = new Date(`${bookingForm.date}T${bookingForm.time}:00`).toISOString();
      const response = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: bookingForm.leadId,
          dateTime: dateTimeIso,
          durationMins: bookingForm.durationMins,
          notes: bookingForm.notes,
          timezone: bookingForm.timezone,
          isOnline: bookingForm.isOnline
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to book appointment');
      }

      const newApt = await response.json();
      setAppointments(prev => [newApt, ...prev]);

      // Sync CRM status locally
      if (setLeads) {
        setLeads(prev => prev.map(l => l.id === bookingForm.leadId ? { ...l, status: 'CONTACTED' } : l));
      }

      // Automatically create a Deal Pipeline stage if available
      if (setDeals) {
        try {
          const dealRes = await fetch('/api/v1/deals');
          if (dealRes.ok) {
            const data = await dealRes.json();
            if (data.deals) {
              setDeals(data.deals);
            }
          }
        } catch (dealErr) {
          console.warn('Failed to refresh deals automatically:', dealErr);
        }
      }

      setIsBookingOpen(false);
      setBookingForm({
        leadId: '',
        date: '2026-07-10',
        time: '14:30',
        durationMins: 30,
        timezone: detectedTimezone || 'Asia/Kolkata',
        notes: '',
        isOnline: true
      });
      alert('Success! Meeting scheduled and synced with Google Calendar.');
    } catch (err: any) {
      console.error(err);
      alert(`Failed to book appointment: ${err.message || String(err)}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Edit / Reschedule Trigger
  const handleStartEdit = (apt: Appointment) => {
    const d = new Date(apt.dateTime);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);

    setEditForm({
      date: dateStr,
      time: timeStr,
      durationMins: apt.durationMins,
      timezone: apt.timezone || 'Asia/Kolkata',
      notes: apt.notes || '',
      status: apt.status
    });
    setEditingAptId(apt.id);
  };

  const handleSaveEdit = async (aptId: string) => {
    setLoadingId(aptId);
    try {
      const dateTimeIso = new Date(`${editForm.date}T${editForm.time}:00`).toISOString();
      const response = await fetch(`/api/v1/appointments/${aptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateTime: dateTimeIso,
          durationMins: editForm.durationMins,
          timezone: editForm.timezone,
          notes: editForm.notes,
          status: editForm.status
        })
      });

      if (!response.ok) throw new Error('Failed to save edits');
      const updatedApt = await response.json();

      setAppointments(prev => prev.map(a => a.id === aptId ? updatedApt : a));

      // Trigger automatic CRM update locally
      if (editForm.status === 'COMPLETED' && setLeads) {
        setLeads(prev => prev.map(l => l.id === updatedApt.leadId ? { ...l, status: 'QUALIFIED' } : l));
      }

      setEditingAptId(null);
      alert('Meeting rescheduled and Google Calendar sequence updated!');
    } catch (err) {
      console.error(err);
      alert('Error saving modifications.');
    } finally {
      setLoadingId(null);
    }
  };

  // Quick Status Transition (Complete / Cancel)
  const handleUpdateStatus = async (aptId: string, status: 'COMPLETED' | 'CANCELLED') => {
    setLoadingId(`status-${aptId}`);
    try {
      const response = await fetch(`/api/v1/appointments/${aptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update status');
      const updatedApt = await response.json();

      setAppointments(prev => prev.map(a => a.id === aptId ? updatedApt : a));

      // Update lead list status as well
      if (setLeads && status === 'COMPLETED') {
        setLeads(prev => prev.map(l => l.id === updatedApt.leadId ? { ...l, status: 'QUALIFIED' } : l));
      }

      alert(`Meeting status updated to ${status}. CRM log synchronized.`);
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    } finally {
      setLoadingId(null);
    }
  };

  // Trigger Immediate Reminder notification simulator
  const handleTriggerReminder = async (aptId: string, channel: 'email' | 'sms' | 'whatsapp') => {
    setLoadingId(`remind-${aptId}`);
    try {
      const response = await fetch(`/api/v1/appointments/${aptId}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });

      if (!response.ok) throw new Error('Failed to send reminder');
      const data = await response.json();

      setAppointments(prev => prev.map(a => a.id === aptId ? data.appointment : a));
      alert(`Success! Scheduled 1-hour pre-meeting reminder dispatched over ${channel.toUpperCase()}.`);
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch pre-meeting reminder.');
    } finally {
      setLoadingId(null);
    }
  };

  // Appointment Analytics Calculations
  const stats = {
    totalBooked: appointments.length,
    scheduledCount: appointments.filter(a => a.status === 'SCHEDULED').length,
    completedCount: appointments.filter(a => a.status === 'COMPLETED').length,
    cancelledCount: appointments.filter(a => a.status === 'CANCELLED').length,
    completionRate: appointments.length > 0 
      ? Math.round((appointments.filter(a => a.status === 'COMPLETED').length / appointments.length) * 100) 
      : 0,
    averageDuration: appointments.length > 0
      ? Math.round(appointments.reduce((sum, current) => sum + current.durationMins, 0) / appointments.length)
      : 0
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesTab = activeStatusTab === 'ALL' || apt.status === activeStatusTab;
    
    if (selectedDay !== null) {
      const aptDate = new Date(apt.dateTime);
      const matchesDay = (
        aptDate.getDate() === selectedDay &&
        aptDate.getMonth() === currentMonth &&
        aptDate.getFullYear() === currentYear
      );
      return matchesTab && matchesDay;
    }

    return matchesTab;
  });

  const filteredExternalEvents = externalEvents.filter(evt => {
    const matchesTab = activeStatusTab === 'ALL' || activeStatusTab === 'SCHEDULED';
    if (!matchesTab) return false;

    if (selectedDay !== null) {
      const evtDate = new Date(evt.start);
      const matchesDay = (
        evtDate.getDate() === selectedDay &&
        evtDate.getMonth() === currentMonth &&
        evtDate.getFullYear() === currentYear
      );
      return matchesDay;
    }
    return true;
  });

  // Unified chronological agenda
  const unifiedAgenda = [
    ...filteredAppointments.map(apt => ({
      ...apt,
      keyId: `apt-${apt.id}`,
      itemType: 'CRM_APPOINTMENT' as const,
      sortTime: new Date(apt.dateTime).getTime()
    })),
    ...filteredExternalEvents.map(evt => ({
      ...evt,
      keyId: `evt-${evt.id}`,
      itemType: 'GOOGLE_EVENT' as const,
      sortTime: new Date(evt.start).getTime()
    }))
  ].sort((a, b) => a.sortTime - b.sortTime);

  return (
    <div id="scheduler_manager" className="space-y-6 animate-fade-in">
      
      {/* Top Heading Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Calendar & Schedulers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Google Calendar bi-directional orchestration, smart timezone offsets, CRM automation logs, and manual reminder dispatch.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimezoneView(prev => prev === 'local' ? 'scheduled' : 'local')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500 animate-spin" style={{ animationDuration: '8s' }} />
            Display: {timezoneView === 'local' ? 'Local System' : 'Prospect TZ'}
          </button>

          <button 
            onClick={() => setIsBookingOpen(!isBookingOpen)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> 
            Book New Consult
          </button>
        </div>
      </div>

      {/* Google Calendar Sync Hub */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {googleCalendarConnected ? (
          <>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg text-white ${googleCalendarStatus === 'REAUTH_NEEDED' ? 'bg-rose-600' : 'bg-blue-600'}`}>
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Google Calendar Sync Hub
                  {googleCalendarStatus === 'REAUTH_NEEDED' ? (
                    <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      REAUTH NEEDED
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      CONNECTED
                    </span>
                  )}
                </h4>
                {googleCalendarStatus === 'REAUTH_NEEDED' ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 font-semibold">
                    ⚠️ Connection Expired: Your Google integration requires re-authentication. Please reconnect to restore sync.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Secure OAuth 2.0 connected to <strong className="text-slate-700 dark:text-slate-200">{googleCalendarEmail}</strong>. Real-time Meet link injection & invite dispatches active.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
              <button
                onClick={handleRunE2ETest}
                disabled={isRunningTest || googleCalendarStatus === 'REAUTH_NEEDED'}
                className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/40 border border-blue-150 dark:border-blue-900/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-pulse' : ''}`} />
                {isRunningTest ? 'Testing...' : 'Run E2E Test'}
              </button>
              <button
                onClick={handleSyncCalendar}
                disabled={isSyncingCalendar || googleCalendarStatus === 'REAUTH_NEEDED'}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-250 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
                {isSyncingCalendar ? 'Syncing...' : 'Force Calendar Sync'}
              </button>
              <button
                onClick={googleCalendarStatus === 'REAUTH_NEEDED' ? handleConnectCalendar : handleDisconnectCalendar}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-150 dark:border-rose-900/30 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                {googleCalendarStatus === 'REAUTH_NEEDED' ? 'Reconnect' : 'Disconnect'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-450">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Google Calendar Not Syncing
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Link with your workspace to automate invitation updates, check dynamic availability, and inject real Google Meet URLs.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnectCalendar}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Connect Workspace Account
            </button>
          </>
        )}
      </div>

      {testResult && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 space-y-2 animate-fade-in shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${testResult.success ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              Google Calendar Integration Test Logs ({testResult.isRealGoogleAPI ? 'REAL END-TO-END' : 'MOCK PREVIEW'})
            </span>
            <button 
              onClick={() => setTestResult(null)}
              className="px-2 py-0.5 bg-slate-850 hover:bg-slate-700 text-[10px] text-slate-300 hover:text-white rounded font-mono transition"
            >
              Close Logs
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed select-all">
            {testResult.logs?.map((logLine: string, idx: number) => (
              <div 
                key={idx} 
                className={
                  logLine.includes('FAIL') 
                    ? 'text-rose-400 bg-rose-950/10 px-1 rounded' 
                    : logLine.includes('SUCCESS') 
                      ? 'text-emerald-400 bg-emerald-950/10 px-1 rounded' 
                      : 'text-slate-300'
                }
              >
                {logLine}
              </div>
            ))}
          </div>
          {testResult.success && (
            <div className="pt-2 border-t border-slate-850 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
              <div><span className="text-slate-500 font-mono">Event Subject:</span> <strong className="text-slate-200">{testResult.summary.summary}</strong></div>
              <div><span className="text-slate-500 font-mono">Confirmed Event ID:</span> <span className="bg-slate-850 text-slate-300 px-1 rounded font-semibold text-[10px]">{testResult.summary.eventId}</span></div>
              <div className="md:col-span-2 flex items-center gap-2">
                <span className="text-slate-500 font-mono">Generated Google Meet:</span> 
                {testResult.summary.meetLink ? (
                  <a href={testResult.summary.meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-mono underline hover:text-blue-300 flex items-center gap-1">
                    {testResult.summary.meetLink}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                ) : (
                  <span className="text-slate-400 font-sans italic">None generated (Offline Meet)</span>
                )}
              </div>
              <div className="md:col-span-2"><span className="text-slate-500 font-mono font-normal">Attendees:</span> <strong className="text-slate-300 font-mono">{testResult.summary.attendee}</strong></div>
            </div>
          )}
        </div>
      )}

      {/* Appointment Analytics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">Total Meetings</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-950 dark:text-white">{stats.totalBooked}</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">100%</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
          <span className="block text-[10px] font-mono font-bold text-amber-500 uppercase">Pending Demo</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-950 dark:text-white">{stats.scheduledCount}</span>
            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">Active</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
          <span className="block text-[10px] font-mono font-bold text-emerald-500 uppercase">Demo Success</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-950 dark:text-white">{stats.completedCount}</span>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">+{stats.completedCount}</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 shadow-xs">
          <span className="block text-[10px] font-mono font-bold text-rose-500 uppercase">Completion Rate</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-950 dark:text-white">{stats.completionRate}%</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl col-span-2 lg:col-span-1 space-y-1 shadow-xs">
          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">Avg Slot Duration</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-950 dark:text-white">{stats.averageDuration}m</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">Standard</span>
          </div>
        </div>
      </div>

      {/* Booking Form Dialog Box */}
      {isBookingOpen && (
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900 rounded-2xl animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Book Real Google Meet Demo
            </h3>
            <button 
              onClick={() => setIsBookingOpen(false)}
              className="text-[10px] font-mono text-slate-400 hover:text-slate-600 font-bold"
            >
              [ Close ]
            </button>
          </div>

          <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
            <div className="md:col-span-4 space-y-1.5">
              <label className="block font-mono font-bold text-[9px] text-slate-400 uppercase">Select Target Prospect</label>
              <select
                value={bookingForm.leadId}
                onChange={(e) => {
                  const val = e.target.value;
                  setBookingForm(prev => ({ ...prev, leadId: val }));
                  const lead = leads.find(l => l.id === val);
                  if (lead) {
                    setBookingForm(prev => ({ ...prev, notes: `SalesPilot outreach followup with ${lead.firstName} ${lead.lastName} from ${lead.company}.` }));
                  }
                }}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2 rounded-lg outline-none font-sans"
              >
                <option value="">-- Choose interested prospect --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.firstName} {l.lastName} ({l.company})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="block font-mono font-bold text-[9px] text-slate-400 uppercase">Appointment Date</label>
              <input
                type="date"
                value={bookingForm.date}
                onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2 rounded-lg outline-none font-mono"
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="block font-mono font-bold text-[9px] text-slate-400 uppercase">Slot Time</label>
              <input
                type="time"
                value={bookingForm.time}
                onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2 rounded-lg outline-none font-mono"
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="block font-mono font-bold text-[9px] text-slate-400 uppercase">Prospect Preferred Timezone</label>
              <select
                value={bookingForm.timezone}
                onChange={(e) => setBookingForm(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2 rounded-lg outline-none"
              >
                <option value={detectedTimezone}>Auto: {detectedTimezone} (Detected)</option>
                {COMMON_TIMEZONES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="block font-mono font-bold text-[9px] text-slate-400 uppercase">Demo Duration (Minutes)</label>
              <select
                value={bookingForm.durationMins}
                onChange={(e) => setBookingForm(prev => ({ ...prev, durationMins: parseInt(e.target.value) }))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2 rounded-lg outline-none font-mono"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="md:col-span-12 flex items-center gap-2.5 py-1">
              <input
                type="checkbox"
                id="booking_form_is_online"
                checked={bookingForm.isOnline}
                onChange={(e) => setBookingForm(prev => ({ ...prev, isOnline: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-opacity-25"
              />
              <label htmlFor="booking_form_is_online" className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-500" />
                Online Meeting: Generate unique Google Meet URL and dispatch invite emails automatically
              </label>
            </div>

            <div className="md:col-span-12 space-y-1.5">
              <label className="block font-mono font-bold text-[9px] text-slate-400 uppercase">Agenda & Internal Notes</label>
              <textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="Details of custom pain points, what features they requested..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2.5 rounded-lg outline-none text-xs"
              />
            </div>

            <div className="md:col-span-12 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-250 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingId === 'booking'}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {loadingId === 'booking' ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : 'Confirm Google Calendar Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE MONTHLY CALENDAR GRID */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-blue-600" /> Interactive Grid Map
            </h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrevMonth} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono px-1">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button 
                onClick={handleNextMonth} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty offset spaces */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-10 bg-slate-50/40 dark:bg-slate-950/10 rounded-lg" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected = selectedDay === dayNum;
                const dayApts = getAppointmentsForDay(dayNum);
                const hasApt = dayApts.length > 0;
                
                // Color mapping based on status inside day
                let dayColorClass = 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800';
                if (isSelected) {
                  dayColorClass = 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20';
                } else if (hasApt) {
                  const hasScheduled = dayApts.some(a => a.status === 'SCHEDULED');
                  const hasCompleted = dayApts.some(a => a.status === 'COMPLETED');
                  if (hasScheduled) {
                    dayColorClass = 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-500/20';
                  } else if (hasCompleted) {
                    dayColorClass = 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-500/20';
                  } else {
                    dayColorClass = 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-500 hover:bg-slate-200';
                  }
                }

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDay(selectedDay === dayNum ? null : dayNum)}
                    className={`h-10 text-xs font-mono font-semibold rounded-lg border flex flex-col items-center justify-center relative cursor-pointer transition ${dayColorClass}`}
                  >
                    <span>{dayNum}</span>
                    {hasApt && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDay !== null && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between text-xs animate-fade-in">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Filtering bookings on <strong>{monthNames[currentMonth]} {selectedDay}, {currentYear}</strong>
                </span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Google Calendar Platform Architecture Description */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-500" /> Google Calendar Architecture
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Our pipeline integrates directly with your organization's Google Workspace credentials via a <strong>state-secure OAuth client flow</strong>. When bookings arrive:
              </p>
              <ul className="text-[10px] space-y-1.5 pl-3 border-l-2 border-blue-500/30 text-slate-500 dark:text-slate-400 font-mono">
                <li>• Generates unique Google Meet room tokens (meet.google.com/sp-*).</li>
                <li>• Dispatches calendar invites dynamically respecting timezone shifts.</li>
                <li>• Auto-triggers updates in CRM Lead lists and Pipeline Deals stages.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BOOKED SLOTS & TIMELINES */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Tabs header & filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'SCHEDULED', label: 'Upcoming' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'CANCELLED', label: 'Cancelled' },
                { id: 'ALL', label: 'All Logs' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatusTab(tab.id as any)}
                  className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg transition cursor-pointer ${
                    activeStatusTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              Showing {unifiedAgenda.length} matching events
            </span>
          </div>

          {/* List layout */}
          <div className="space-y-4">
            {unifiedAgenda.map(item => {
              if (item.itemType === 'GOOGLE_EVENT') {
                const isWorking = loadingId === `delete-${item.id}`;
                return (
                  <div 
                    key={item.keyId}
                    className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-xl shadow-xs overflow-hidden transition-all duration-200 animate-fade-in"
                  >
                    <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900">
                            GOOGLE CALENDAR
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Synchronized External Event
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.summary}</h4>
                        {item.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 italic max-w-xl leading-relaxed">
                            "{item.description}"
                          </p>
                        )}
                        {item.attendees && item.attendees.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            <span className="text-[10px] text-slate-400 font-mono">Invited:</span>
                            {item.attendees.map((email, i) => (
                              <span key={i} className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                {email}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-stretch sm:items-end gap-2.5 self-stretch sm:self-auto min-w-[190px]">
                        <div className="text-left sm:text-right space-y-0.5">
                          <span className="block text-xs font-bold text-slate-900 dark:text-slate-150 flex items-center gap-1.5 sm:justify-end">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> {formatAptDate(item.start, item.timezone)}
                          </span>
                          <span className="block text-xs font-mono text-slate-500 flex items-center gap-1.5 sm:justify-end">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatAptTime(item.start, item.timezone)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteCalendarEvent(item.id)}
                            disabled={isWorking}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            {isWorking ? 'Deleting...' : 'Delete Event'}
                          </button>
                          {item.meetingLink && (
                            <a 
                              href={item.meetingLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-1 transition shadow-sm"
                            >
                              <Video className="w-3.5 h-3.5" /> Join Meet <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const apt = item;
              const isExpanded = expandedAptId === apt.id;
              const isEditing = editingAptId === apt.id;
              const isWorking = loadingId === apt.id || loadingId === `status-${apt.id}` || loadingId === `remind-${apt.id}`;

              return (
                <div 
                  key={apt.id}
                  className={`bg-white dark:bg-slate-900 border rounded-xl shadow-xs overflow-hidden transition-all duration-200 ${
                    apt.status === 'SCHEDULED' 
                      ? 'border-slate-200 dark:border-slate-800' 
                      : apt.status === 'COMPLETED'
                      ? 'border-emerald-200/60 dark:border-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 opacity-80'
                  }`}
                >
                  {/* Primary card body */}
                  <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold ${
                          apt.status === 'SCHEDULED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40'
                            : apt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          {apt.status}
                        </span>
                        
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {apt.durationMins} Mins Slot
                        </span>

                        {apt.timezone && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-800">
                            Preferred TZ: {apt.timezone.split('/').pop()}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{apt.leadName}</h4>
                      <p className="text-xs text-slate-500">
                        {apt.company} • <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{apt.email}</span>
                      </p>

                      {apt.notes && !isEditing && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 italic max-w-xl leading-relaxed">
                          "{apt.notes}"
                        </p>
                      )}
                    </div>

                    {/* Date and actions */}
                    <div className="flex flex-col items-stretch sm:items-end gap-2.5 self-stretch sm:self-auto min-w-[190px]">
                      <div className="text-left sm:text-right space-y-0.5">
                        <span className="block text-xs font-bold text-slate-900 dark:text-slate-150 flex items-center gap-1.5 sm:justify-end">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> {formatAptDate(apt.dateTime, apt.timezone)}
                        </span>
                        <span className="block text-xs font-mono text-slate-500 flex items-center gap-1.5 sm:justify-end">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatAptTime(apt.dateTime, apt.timezone)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpandedAptId(isExpanded ? null : apt.id)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <History className="w-3 h-3 text-indigo-500" />
                          {isExpanded ? 'Hide History' : 'Timeline Notes'}
                        </button>

                        <a 
                          href={apt.meetingLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-1 transition shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" /> Google Meet <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Editing Reschedule Block */}
                  {isEditing && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-4 space-y-1">
                          <label className="block font-mono text-[9px] uppercase text-slate-400 font-bold">New Date</label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg font-mono outline-none"
                          />
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <label className="block font-mono text-[9px] uppercase text-slate-400 font-bold">New Slot Time</label>
                          <input
                            type="time"
                            value={editForm.time}
                            onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg font-mono outline-none"
                          />
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <label className="block font-mono text-[9px] uppercase text-slate-400 font-bold">Preferred Timezone</label>
                          <select
                            value={editForm.timezone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, timezone: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg outline-none"
                          >
                            {COMMON_TIMEZONES.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <label className="block font-mono text-[9px] uppercase text-slate-400 font-bold">Meeting Status</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg outline-none font-bold"
                          >
                            <option value="SCHEDULED">SCHEDULED (Upcoming)</option>
                            <option value="COMPLETED">COMPLETED (Success)</option>
                            <option value="CANCELLED">CANCELLED (Halted)</option>
                          </select>
                        </div>
                        <div className="md:col-span-8 space-y-1">
                          <label className="block font-mono text-[9px] uppercase text-slate-400 font-bold">Agenda & Internal Followup Notes</label>
                          <input
                            type="text"
                            value={editForm.notes}
                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <button
                          onClick={() => setEditingAptId(null)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 font-bold rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(apt.id)}
                          disabled={isWorking}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          {isWorking ? <RefreshCw className="w-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Apply Reschedule & Sync
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded Timeline & Reminder Dispatches */}
                  {isExpanded && !isEditing && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
                      
                      {/* Reminder Trigger Bar */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="block font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5 text-blue-500" /> Dispatch Pre-Meeting Reminders
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Send a 1-hour pre-meeting alert to {apt.leadName} via your active delivery route.</p>
                        </div>

                        <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end">
                          <button
                            onClick={() => handleTriggerReminder(apt.id, 'email')}
                            disabled={isWorking}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 rounded-md cursor-pointer disabled:opacity-50"
                          >
                            Trigger Email Alert
                          </button>
                          <button
                            onClick={() => handleTriggerReminder(apt.id, 'whatsapp')}
                            disabled={isWorking}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 rounded-md cursor-pointer disabled:opacity-50"
                          >
                            WhatsApp Alert
                          </button>
                          <button
                            onClick={() => handleTriggerReminder(apt.id, 'sms')}
                            disabled={isWorking}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 rounded-md cursor-pointer disabled:opacity-50"
                          >
                            SMS Alert
                          </button>
                        </div>
                      </div>

                      {/* CRM Status Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs pt-1 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">Manual CRM State Handler</span>
                          <p className="text-[10px] text-slate-500">Quickly transition stages to auto-sync back with Pipelines.</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {apt.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                                disabled={isWorking}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-md cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Mark Completed
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                                disabled={isWorking}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] rounded-md cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" /> Cancel Appointment
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleStartEdit(apt)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] rounded-md cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Reschedule / Edit
                          </button>
                        </div>
                      </div>

                      {/* History Timeline of Bookings */}
                      <div className="space-y-3">
                        <span className="block text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Appointment Audit History</span>
                        
                        <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-4">
                          {(apt.timelineList || []).map((t, idx) => (
                            <div key={t.id || idx} className="text-xs space-y-0.5 relative">
                              {/* Small circle dot indicator */}
                              <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                              
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{t.event}</span>
                                <span className="text-slate-400">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal">{t.details}</p>
                            </div>
                          ))}

                          {(!apt.timelineList || apt.timelineList.length === 0) && (
                            <div className="text-[11px] font-mono text-slate-400 italic">No timeline triggers registered yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {unifiedAgenda.length === 0 && (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 font-mono bg-slate-50/20">
                No meetings scheduled for this filter. Use the interactive grid or click "Book New Consult" to schedule demo slots with your leads.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
