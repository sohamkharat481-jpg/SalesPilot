import React, { useState, useEffect } from 'react';
import { 
  Bell, Clock, Check, CheckCircle2, Search, Filter, Calendar, 
  UserCheck, X, MessageSquare, AlertTriangle, AlertCircle, Trash2, Archive, 
  ChevronRight, Inbox, HelpCircle, ArrowUpRight, CheckCircle
} from 'lucide-react';
import { SalesPilotNotification } from '../types';

interface NotificationsViewProps {
  setActiveTab: (tab: string) => void;
  onSelectLeadId?: (leadId: string) => void;
  onSelectDealId?: (dealId: string) => void;
}

export function NotificationsView({ setActiveTab, onSelectLeadId, onSelectDealId }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<SalesPilotNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'unread' | 'assignments' | 'activity' | 'tasks' | 'meetings'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(15);

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('salespilot_token') : null;
  const workspaceId = typeof window !== 'undefined' ? sessionStorage.getItem('salespilot_workspace_id') : null;

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (workspaceId) headers['x-organization-id'] = workspaceId;

      let url = `/api/v1/notifications?page=${page}&limit=${limit}`;
      if (activeSubTab === 'unread') {
        url += `&isRead=false`;
      }
      if (priorityFilter !== 'ALL') {
        url += `&priority=${priorityFilter}`;
      }
      if (typeFilter !== 'ALL') {
        url += `&type=${typeFilter}`;
      }
      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      if (endDate) {
        url += `&endDate=${endDate}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        let list: SalesPilotNotification[] = data.notifications || [];

        // Apply tab-specific local categorization filters
        if (activeSubTab === 'assignments') {
          list = list.filter(n => n.type === 'LEAD_ASSIGNED' || n.type === 'DEAL_STAGE_CHANGED');
        } else if (activeSubTab === 'activity') {
          list = list.filter(n => ['NEW_LEAD', 'OUTREACH_REPLY', 'INTERESTED_LEAD', 'DEAL_CREATED', 'DEAL_WON', 'DEAL_LOST'].includes(n.type));
        } else if (activeSubTab === 'tasks') {
          list = list.filter(n => n.type === 'FOLLOW_UP_DUE' || n.type === 'FOLLOW_UP_OVERDUE' || n.type === 'TASK_COMPLETED');
        } else if (activeSubTab === 'meetings') {
          list = list.filter(n => n.type === 'MEETING_REQUESTED' || n.type === 'MEETING_BOOKED');
        }

        // Handle Search term
        if (search) {
          const s = search.toLowerCase();
          list = list.filter(n => n.title.toLowerCase().includes(s) || n.message.toLowerCase().includes(s));
        }

        setNotifications(list);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
        }
      } else {
        setError(data.error || 'Failed to fetch notifications.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while loading notifications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (workspaceId) headers['x-organization-id'] = workspaceId;

      const res = await fetch('/api/v1/notifications/unread-count', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.count);
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [page, activeSubTab, priorityFilter, typeFilter, startDate, endDate]);

  const handleMarkRead = async (id: string, isRead: boolean) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (workspaceId) headers['x-organization-id'] = workspaceId;

      const url = `/api/v1/notifications/${id}/${isRead ? 'read' : 'unread'}`;
      const res = await fetch(url, { method: 'POST', headers });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead } : n));
        fetchUnreadCount();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (workspaceId) headers['x-organization-id'] = workspaceId;

      const res = await fetch('/api/v1/notifications/read-all', { method: 'POST', headers });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (workspaceId) headers['x-organization-id'] = workspaceId;

      const res = await fetch(`/api/v1/notifications/${id}/archive`, { method: 'POST', headers });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        fetchUnreadCount();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeepLinkClick = (n: SalesPilotNotification) => {
    if (!n.entityId || !n.entityType) return;

    // Handle deep linking based on type
    if (n.entityType === 'LEAD') {
      if (onSelectLeadId) onSelectLeadId(n.entityId);
      setActiveTab('leads');
    } else if (n.entityType === 'DEAL') {
      if (onSelectDealId) onSelectDealId(n.entityId);
      setActiveTab('pipeline');
    } else if (n.entityType === 'MEETING') {
      setActiveTab('scheduler');
    } else if (n.entityType === 'FOLLOW_UP') {
      setActiveTab('leads'); // Typically followups are shown under leads
    } else if (n.entityType === 'CALL') {
      setActiveTab('voice-calling');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">LOW</span>;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LEAD_ASSIGNED':
        return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case 'NEW_LEAD':
        return <CheckCircle className="w-4 h-4 text-sky-500" />;
      case 'OUTREACH_REPLY':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'INTERESTED_LEAD':
        return <AlertCircle className="w-4 h-4 text-emerald-500 animate-pulse" />;
      case 'MEETING_BOOKED':
      case 'MEETING_REQUESTED':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'FOLLOW_UP_OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />;
      case 'FOLLOW_UP_DUE':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'DEAL_WON':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'DEAL_LOST':
        return <X className="w-4 h-4 text-slate-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" /> Notifications Control Inbox
          </h1>
          <p className="text-xs text-slate-400">
            Audit logs and smart activity streams across the team, active outreach, pipeline progression, and scheduler meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold uppercase rounded-lg transition border border-blue-200/50 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Mark All As Read
            </button>
          )}
          <button 
            onClick={() => fetchNotifications()} 
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-mono font-bold uppercase rounded-lg transition text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Sync Center
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1">
        {[
          { id: 'all', label: 'All Operations' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'assignments', label: 'Mentions & Assignments' },
          { id: 'activity', label: 'Sales Activity' },
          { id: 'tasks', label: 'Tasks & Reminders' },
          { id: 'meetings', label: 'Calendar Bookings' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setActiveSubTab(t.id as any);
              setPage(1);
            }}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 transition ${activeSubTab === t.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3.5 bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-850 rounded-xl">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notification title, notes, message..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 dark:text-white"
          />
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Priority: All</option>
            <option value="URGENT">Urgent Only</option>
            <option value="HIGH">High + Urgent</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Event Type: All</option>
            <option value="LEAD_ASSIGNED">Lead Assigned</option>
            <option value="NEW_LEAD">New Lead Added</option>
            <option value="OUTREACH_REPLY">Outreach Reply</option>
            <option value="INTERESTED_LEAD">Lead Interested</option>
            <option value="MEETING_BOOKED">Meeting Booked</option>
            <option value="FOLLOW_UP_DUE">Follow-Up Due</option>
            <option value="FOLLOW_UP_OVERDUE">Follow-Up Overdue</option>
            <option value="DEAL_WON">Deal Won</option>
            <option value="DEAL_LOST">Deal Lost</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400"
            placeholder="Start date"
          />
        </div>

        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400"
            placeholder="End date"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <span className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 animate-spin rounded-full" />
            Synchronizing telemetry records...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 font-mono text-xs">
            ⚠️ {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center space-y-3.5">
            <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Inbox completely up-to-date!</p>
              <p className="text-xs text-slate-400 mt-1">No pending notifications match your active search and filter categories.</p>
            </div>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              className={`p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${n.isRead ? 'bg-slate-50/20 dark:bg-slate-900/25 text-slate-500' : 'bg-blue-50/15 dark:bg-blue-950/10 border-l-4 border-blue-500'}`}
            >
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-850 rounded-lg mt-0.5 shrink-0 flex items-center justify-center">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`font-bold text-xs ${n.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {n.title}
                    </span>
                    {getPriorityBadge(n.priority)}
                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                      {n.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${n.isRead ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleString()}
                    </span>
                    {n.entityType && (
                      <span className="text-blue-500 dark:text-blue-400 font-bold uppercase">
                        🏷️ {n.entityType}: {n.entityId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Operations */}
              <div className="flex items-center gap-1.5 md:self-center shrink-0">
                {n.entityId && n.entityType && (
                  <button
                    onClick={() => handleDeepLinkClick(n)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 transition flex items-center gap-1 text-[10px] font-mono font-bold uppercase cursor-pointer"
                    title="Navigate to resource"
                  >
                    View <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleMarkRead(n.id, !n.isRead)}
                  className={`p-1.5 rounded transition cursor-pointer text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${n.isRead ? 'bg-slate-50 hover:bg-slate-100 text-slate-500' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}
                  title={n.isRead ? 'Mark as Unread' : 'Mark as Read'}
                >
                  <Check className="w-3.5 h-3.5" /> {n.isRead ? 'Unread' : 'Read'}
                </button>
                <button
                  onClick={() => handleArchive(n.id)}
                  className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-850 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Archive Notification"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold uppercase disabled:opacity-40 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            ◀ Back
          </button>
          <span className="text-xs font-mono font-bold text-slate-500">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold uppercase disabled:opacity-40 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}
