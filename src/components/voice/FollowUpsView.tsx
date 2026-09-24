import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, Clock, AlertCircle, CheckCircle2, 
  Trash2, Edit3, Plus, Check, X, User, Phone, Tag, 
  Building, RefreshCw, AlertTriangle, ShieldCheck, CheckSquare, ListTodo
} from 'lucide-react';
import { Lead } from '../../types';

interface FollowUp {
  id: string;
  organizationId: string;
  userId: string;
  leadId: string;
  callId?: string | null;
  title: string;
  description: string;
  dueAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  source: 'MANUAL_CALL' | 'LEAD' | 'APPOINTMENT' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  // Enriched fields from API:
  leadName?: string;
  company?: string;
  userName?: string;
  userEmail?: string;
}

export const FollowUpsView: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('PENDING'); // Default to pending
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

  // Form State
  const [formLeadId, setFormLeadId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDueAt, setFormDueAt] = useState<string>('');
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [formSource, setFormSource] = useState<'MANUAL_CALL' | 'LEAD' | 'APPOINTMENT' | 'MANUAL'>('MANUAL');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Stats calculation
  const stats = {
    pending: followUps.filter(f => f.status === 'PENDING').length,
    overdue: followUps.filter(f => f.status === 'OVERDUE').length,
    completed: followUps.filter(f => f.status === 'COMPLETED').length,
    highPriority: followUps.filter(f => f.status === 'PENDING' && f.priority === 'HIGH').length
  };

  const fetchLeads = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/leads', { headers });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads for selector', err);
    }
  };

  const fetchFollowUps = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/v1/follow-ups?${params.toString()}`, { headers });
      const data = await res.json();

      if (data.success) {
        setFollowUps(data.followUps || []);
      } else {
        setError(data.error || 'Failed to fetch follow-up tasks.');
      }
    } catch (err) {
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFollowUps();
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLeadId || !formTitle || !formDueAt) {
      alert('Please fill in all required fields (Lead, Title, and Due Date).');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/follow-ups', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          leadId: formLeadId,
          title: formTitle,
          description: formDescription,
          dueAt: new Date(formDueAt).toISOString(),
          priority: formPriority,
          source: formSource
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        resetForm();
        fetchFollowUps();
      } else {
        alert(data.error || 'Failed to create follow-up task.');
      }
    } catch (err) {
      alert('Error creating follow-up task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp) return;

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/follow-ups/${selectedFollowUp.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          dueAt: new Date(formDueAt).toISOString(),
          priority: formPriority,
          status: selectedFollowUp.status // preserve status or update
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedFollowUp(null);
        resetForm();
        fetchFollowUps();
      } else {
        alert(data.error || 'Failed to update follow-up task.');
      }
    } catch (err) {
      alert('Error updating follow-up task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/follow-ups/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (data.success) {
        fetchFollowUps();
      } else {
        alert(data.error || 'Failed to change task status.');
      }
    } catch (err) {
      alert('Error changing task status.');
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this follow-up task?')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/follow-ups/${id}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (data.success) {
        fetchFollowUps();
      } else {
        alert(data.error || 'Failed to delete task.');
      }
    } catch (err) {
      alert('Error deleting task.');
    }
  };

  const openEditModal = (fup: FollowUp) => {
    setSelectedFollowUp(fup);
    setFormLeadId(fup.leadId);
    setFormTitle(fup.title);
    setFormDescription(fup.description);
    // Convert to YYYY-MM-DDThh:mm format for local datetime-local input
    const localTime = new Date(fup.dueAt);
    const tzOffset = localTime.getTimezoneOffset() * 60000;
    const localIso = new Date(localTime.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormDueAt(localIso);
    setFormPriority(fup.priority);
    setFormSource(fup.source);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormLeadId('');
    setFormTitle('');
    setFormDescription('');
    setFormDueAt('');
    setFormPriority('MEDIUM');
    setFormSource('MANUAL');
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. KEY PERFORMANCE WIDGETS (Internal Reminder Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Due / Pending Follow-Ups */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Tasks</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.pending}</span>
          </div>
        </div>

        {/* Overdue Warnings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Warnings</span>
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{stats.overdue}</span>
          </div>
        </div>

        {/* High-Priority Upcoming */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">High Priority</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.highPriority}</span>
          </div>
        </div>

        {/* Completed Follow-Ups */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed Actions</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
          </div>
        </div>

      </div>

      {/* 2. HEADER AND ACTIONS CONTROL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Smart CRM Follow-Up Engine</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Persisted task schedule trigger callbacks, manual call reminders, and sales cycle followups.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Manual Follow-Up</span>
        </button>
      </div>

      {/* 3. FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tab buttons */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { value: 'PENDING', label: 'Pending' },
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  statusFilter === tab.value
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">🔥 High</option>
            <option value="MEDIUM">⚡ Medium</option>
            <option value="LOW">💤 Low</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            Go
          </button>
        </form>

      </div>

      {/* 4. MAIN TASK CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading follow-ups...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 text-sm">{error}</div>
        ) : followUps.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ListTodo className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No scheduled follow-ups found</p>
            <p className="text-xs text-slate-500">Log a manual call as "Call Back Later" or tap Schedule above to initiate one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-5">Status / Check</th>
                  <th className="p-4">Follow-Up Task</th>
                  <th className="p-4">Lead Context</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Scheduled Due Date</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Source</th>
                  <th className="p-4 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {followUps.map(fup => (
                  <tr key={fup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    
                    {/* Status checkbox / Check */}
                    <td className="p-4 pl-5 whitespace-nowrap">
                      {fup.status === 'COMPLETED' ? (
                        <button
                          onClick={() => handleStatusChange(fup.id, 'PENDING')}
                          className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 text-left font-bold"
                          title="Click to revert to Pending"
                        >
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200">Completed</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(fup.id, 'COMPLETED')}
                          className="flex items-center space-x-1.5 text-slate-400 hover:text-emerald-600 transition text-left"
                          title="Click to complete task"
                        >
                          <Clock className={`w-5 h-5 shrink-0 ${fup.status === 'OVERDUE' ? 'text-red-500 animate-spin' : 'text-blue-500'}`} />
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(fup.status)}`}>
                            {fup.status}
                          </span>
                        </button>
                      )}
                    </td>

                    {/* Follow Up Title */}
                    <td className="p-4">
                      <div>
                        <strong className="text-slate-900 dark:text-white font-bold block">{fup.title}</strong>
                        {fup.description && (
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 max-w-xs truncate">{fup.description}</p>
                        )}
                      </div>
                    </td>

                    {/* Lead Contact Info */}
                    <td className="p-4 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {fup.leadName}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          {fup.company}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${getPriorityBadgeClass(fup.priority)}`}>
                        {fup.priority}
                      </span>
                    </td>

                    {/* Scheduled Due Date */}
                    <td className="p-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[11px]">{new Date(fup.dueAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400">{new Date(fup.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>

                    {/* Team Rep */}
                    <td className="p-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                      {fup.userName}
                    </td>

                    {/* Source */}
                    <td className="p-4 whitespace-nowrap text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {fup.source.replace('_', ' ')}
                    </td>

                    {/* CRUD Options */}
                    <td className="p-4 pr-5 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => openEditModal(fup)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFollowUp(fup.id)}
                        className="p-1.5 text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. CREATE FOLLOW-UP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Schedule Follow-Up Task</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-5 space-y-4">
              {/* Select Lead */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Lead *</label>
                <select
                  required
                  value={formLeadId}
                  onChange={e => setFormLeadId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose CRM Lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim()} • {l.company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Follow-Up Action Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Call back to finalize CRM proposal"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Context Notes & Instructions</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Describe context of conversation or guidelines for next pitch..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Due Date & Time */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formDueAt}
                  onChange={e => setFormDueAt(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source Trigger</label>
                  <select
                    value={formSource}
                    onChange={e => setFormSource(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MANUAL">Manual Task</option>
                    <option value="MANUAL_CALL">Manual Call Outcome</option>
                    <option value="LEAD">CRM Lead</option>
                    <option value="APPOINTMENT">Appointment Prep</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition"
                >
                  {submitting ? 'Creating...' : 'Schedule Task'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT FOLLOW-UP MODAL */}
      {showEditModal && selectedFollowUp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Modify Scheduled Follow-Up</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFollowUp} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Follow-Up Action Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Call back to finalize CRM proposal"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Context Notes & Instructions</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Describe context of conversation or guidelines for next pitch..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Due Date & Time */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formDueAt}
                  onChange={e => setFormDueAt(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Task Status</label>
                  <select
                    value={selectedFollowUp.status}
                    onChange={e => setSelectedFollowUp({ ...selectedFollowUp, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
