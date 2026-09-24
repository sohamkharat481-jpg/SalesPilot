import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, Phone, User, Building, Smartphone, 
  RotateCcw, Eye, FileText, CheckCircle2, Info, ChevronRight
} from 'lucide-react';
import { ManualCallOutcome } from '../../types/voice';
import { CallDetailDrawer } from './CallDetailDrawer';

export const CallHistoryView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [selectedCallingNumber, setSelectedCallingNumber] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Workspace team members and calling numbers options
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [callingNumbersList, setCallingNumbersList] = useState<string[]>([]);
  const [isElevatedUser, setIsElevatedUser] = useState<boolean>(false);

  // Selected Call Drawer State
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedUserId) params.append('userId', selectedUserId);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedOutcome) params.append('outcome', selectedOutcome);
      if (selectedCallingNumber) params.append('callingNumber', selectedCallingNumber);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/v1/manual-calls/history?${params.toString()}`, { headers });
      const data = await res.json();

      if (data.success) {
        setHistory(data.history || []);
        setIsElevatedUser(!!data.isElevatedUser);

        // Extract unique team members & calling numbers for filter dropdowns
        const uniqueMembers = new Map<string, string>();
        const uniqueCallingNums = new Set<string>();

        (data.history || []).forEach((item: any) => {
          if (item.userId && item.userName) {
            uniqueMembers.set(item.userId, item.userName);
          }
          if (item.callingNumber) {
            uniqueCallingNums.add(item.callingNumber);
          }
        });

        setTeamMembers(Array.from(uniqueMembers.entries()).map(([id, name]) => ({ id, name })));
        setCallingNumbersList(Array.from(uniqueCallingNums));
      } else {
        setError(data.error || 'Failed to fetch call history.');
      }
    } catch (err) {
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate, selectedUserId, selectedStatus, selectedOutcome, selectedCallingNumber]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  // Clear Filters
  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedUserId('');
    setSelectedStatus('');
    setSelectedOutcome('');
    setSelectedCallingNumber('');
    setSearchQuery('');
  };

  const getOutcomeBadgeClass = (outcome?: string) => {
    switch (outcome) {
      case 'Connected':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Interested':
        return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300';
      case 'Meeting Requested':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
      case 'Call Back Later':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      case 'No Answer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300';
      case 'Busy':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300';
      case 'Not Interested':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Manual Call History</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real persisted records of direct manual calls placed via native device dialer.
          </p>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contact, company, phone..."
              className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Manual Calls</span>
          </div>

          <button
            onClick={handleClearFilters}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center space-x-1 font-normal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Start Date */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Team Member */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Team Member</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              disabled={!isElevatedUser && teamMembers.length <= 1}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Team Members</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Call Status */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Call Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="INITIATED_FROM_SALES_PILOT">Initiated (Device Dialer)</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Outcome */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Call Outcome</label>
            <select
              value={selectedOutcome}
              onChange={e => setSelectedOutcome(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Outcomes</option>
              <option value="Connected">Connected</option>
              <option value="Interested">Interested</option>
              <option value="Meeting Requested">Meeting Requested</option>
              <option value="Call Back Later">Call Back Later</option>
              <option value="No Answer">No Answer</option>
              <option value="Busy">Busy</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>

          {/* Calling Number */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Calling Number</label>
            <select
              value={selectedCallingNumber}
              onChange={e => setSelectedCallingNumber(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Calling Numbers</option>
              {callingNumbersList.map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Fetching call records...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 text-sm">{error}</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Phone className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No manual calls found</p>
            <p className="text-xs text-slate-500">Try adjusting your filter criteria or make a call using the native dialer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 pl-5">Date & Time</th>
                  <th className="p-3.5">Lead / Contact</th>
                  <th className="p-3.5">Company</th>
                  <th className="p-3.5">Lead Phone</th>
                  <th className="p-3.5">Calling Number Used</th>
                  <th className="p-3.5">Team Member</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Outcome</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map(item => (
                  <tr 
                    key={item.id}
                    onClick={() => setSelectedCallId(item.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    <td className="p-3.5 pl-5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                    <td className="p-3.5">
                      <strong className="text-slate-900 dark:text-white font-semibold block">{item.leadName}</strong>
                    </td>

                    <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.company}
                    </td>

                    <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {item.leadPhone || item.phoneNumber}
                    </td>

                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {item.callingNumber || 'Default Phone'}
                    </td>

                    <td className="p-3.5 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                      {item.userName}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        <Smartphone className="w-3 h-3" />
                        <span>{item.status === 'INITIATED_FROM_SALES_PILOT' ? 'Initiated' : 'Completed'}</span>
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getOutcomeBadgeClass(item.outcome)}`}>
                        {item.outcome || 'Pending'}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-400 italic font-medium whitespace-nowrap">
                      Not available
                    </td>

                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCallId(item.id);
                        }}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center text-xs text-slate-500">
          <span>Showing {history.length} call records</span>
          <span className="italic text-[11px]">Duration is strictly recorded as "Not available" for native device calls.</span>
        </div>
      </div>

      {/* Call Details Drawer */}
      {selectedCallId && (
        <CallDetailDrawer
          callId={selectedCallId}
          onClose={() => setSelectedCallId(null)}
          onNotesUpdated={fetchHistory}
        />
      )}

    </div>
  );
};
