import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, ChevronRight, MessageSquare, 
  Sparkles, Award, User, Layers, ArrowUpRight, Plus, Search, 
  Filter, Trash2, Download, Upload, FileText, Tag, CheckCircle2, 
  Clock, Calendar, CheckSquare, Square, RefreshCw, AlertCircle, 
  BarChart3, Building, Users, Activity, FileUp, Database, 
  FileSpreadsheet, PlusCircle, Trash, Check, X, Shield, Globe, Edit3, HeartHandshake, Skull
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Deal, DealStage, Lead } from '../types';

interface PipelineViewProps {
  deals: Deal[];
  onUpdateDealStage: (dealId: string, stage: DealStage) => Promise<void>;
  setActiveTab?: (tab: string) => void;
}

const LANES: { id: string; label: string; color: string; hoverColor: string; weight: number }[] = [
  { id: 'QUALIFIED', label: 'Qualified', color: 'border-t-blue-500 bg-blue-50/5 text-blue-900 dark:text-blue-200', hoverColor: 'hover:bg-blue-50/10', weight: 0.20 },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-t-purple-500 bg-purple-50/5 text-purple-900 dark:text-purple-200', hoverColor: 'hover:bg-purple-50/10', weight: 0.30 },
  { id: 'INTERESTED', label: 'Interested', color: 'border-t-indigo-500 bg-indigo-50/5 text-indigo-900 dark:text-indigo-200', hoverColor: 'hover:bg-indigo-50/10', weight: 0.45 },
  { id: 'MEETING_REQUESTED', label: 'Meeting Requested', color: 'border-t-teal-500 bg-teal-50/5 text-teal-900 dark:text-teal-200', hoverColor: 'hover:bg-teal-50/10', weight: 0.60 },
  { id: 'PROPOSAL', label: 'Proposal', color: 'border-t-amber-500 bg-amber-50/5 text-amber-900 dark:text-amber-200', hoverColor: 'hover:bg-amber-50/10', weight: 0.75 },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-t-orange-500 bg-orange-50/5 text-orange-900 dark:text-orange-200', hoverColor: 'hover:bg-orange-50/10', weight: 0.85 },
  { id: 'WON', label: 'Won', color: 'border-t-emerald-500 bg-emerald-50/10 text-emerald-950 dark:text-emerald-200', hoverColor: 'hover:bg-emerald-50/15', weight: 1.00 },
  { id: 'LOST', label: 'Lost', color: 'border-t-rose-500 bg-rose-50/10 text-rose-950 dark:text-rose-200', hoverColor: 'hover:bg-rose-50/15', weight: 0.00 }
];

export function PipelineView({ deals: initialDeals, onUpdateDealStage, setActiveTab }: PipelineViewProps) {
  // Navigation State
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'forecast' | 'companies' | 'contacts' | 'tasks' | 'notes' | 'files'>('pipeline');
  
  // Deals State (loads & syncs from server state via REST API)
  const [deals, setDeals] = useState<Deal[]>(initialDeals || []);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterMinVal, setFilterMinVal] = useState('');
  const [filterMaxVal, setFilterMaxVal] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Selected Detail Drawer State
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isEditingDeal, setIsEditingDeal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Deal>>({});
  const [scheduleFollowUpOpen, setScheduleFollowUpOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    title: '',
    description: '',
    dueAt: '',
    priority: 'MEDIUM'
  });

  // Won / Lost Dialogs
  const [wonModalOpen, setWonModalOpen] = useState(false);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');

  // Other CRM states (using localStorage cache)
  const [companies, setCompanies] = useState<any[]>(() => {
    const local = localStorage.getItem('crm_companies');
    return local ? JSON.parse(local) : [
      { id: 'co_1', name: 'Horizon Media Group', domain: 'horizon.media', industry: 'Advertising & Marketing', size: '50-100 employees', revenue: '₹5 Crore', tags: ['Enterprise', 'High-Priority'], createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
      { id: 'co_2', name: 'Nippon Steel Corp', domain: 'nippon-steel.co.jp', industry: 'Heavy Manufacturing', size: '10,000+ employees', revenue: '₹120 Crore', tags: ['Corporate', 'Multi-National'], createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() }
    ];
  });

  const [contacts, setContacts] = useState<any[]>(() => {
    const local = localStorage.getItem('crm_contacts');
    return local ? JSON.parse(local) : [
      { id: 'ct_1', fullName: 'Sarah Jenkins', email: 'sarah@horizon.media', phone: '+91 98231 11029', company: 'Horizon Media Group', title: 'VP Growth & Operations', leadScore: 'Very Hot', tags: ['SDR-Outreach'], createdAt: new Date().toISOString() },
      { id: 'ct_2', fullName: 'Hiroshi Tanaka', email: 'h.tanaka@nippon-steel.co.jp', phone: '+81 90 2311 9923', company: 'Nippon Steel Corp', title: 'Senior Procurement Director', leadScore: 'Hot', tags: ['Inbound'], createdAt: new Date().toISOString() }
    ];
  });

  const [tasks, setTasks] = useState<any[]>(() => {
    const local = localStorage.getItem('crm_tasks');
    return local ? JSON.parse(local) : [
      { id: 'tk_1', title: 'Draft custom contract detailing cold email CTR guarantees', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0], associatedTo: 'Horizon Media Group', createdAt: new Date().toISOString() },
      { id: 'tk_2', title: 'Prepare technical architecture presentation deck', priority: 'MEDIUM', status: 'TODO', dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0], associatedTo: 'Nippon Steel Corp', createdAt: new Date().toISOString() }
    ];
  });

  const [notes, setNotes] = useState<any[]>(() => {
    const local = localStorage.getItem('crm_notes');
    return local ? JSON.parse(local) : [
      { id: 'nt_1', title: 'Horizon Pricing Review', text: 'Sarah prefers a hybrid performance billing where we collect a base with success commissions per booked qualified consultation.', associatedTo: 'Horizon Media Group', createdAt: new Date().toISOString() }
    ];
  });

  const [files, setFiles] = useState<any[]>(() => {
    const local = localStorage.getItem('crm_files');
    return local ? JSON.parse(local) : [
      { id: 'fl_1', name: 'Outreach_Campaign_Brief_v3.pdf', size: '2.4 MB', type: 'application/pdf', associatedTo: 'Horizon Media Group', uploadedAt: new Date().toISOString() }
    ];
  });

  // Modal display toggles for subtabs
  const [isAddingCompanyModal, setIsAddingCompanyModal] = useState(false);
  const [isAddingContactModal, setIsAddingContactModal] = useState(false);
  const [isAddingTaskModal, setIsAddingTaskModal] = useState(false);
  const [isAddingNoteModal, setIsAddingNoteModal] = useState(false);

  const [newCompanyForm, setNewCompanyForm] = useState({ name: '', domain: '', industry: '', size: '', revenue: '', tags: '' });
  const [newContactForm, setNewContactForm] = useState({ fullName: '', email: '', phone: '', company: '', title: '', leadScore: 'Warm', tags: '' });
  const [newTaskForm, setNewTaskForm] = useState({ title: '', priority: 'MEDIUM', dueDate: '', associatedTo: '' });
  const [newNoteForm, setNewNoteForm] = useState({ title: '', text: '', associatedTo: '' });

  // Load deals & analytics on mount & whenever they update
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('salespilot_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Build Query String
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStage) params.append('stage', filterStage);
      if (filterUser) params.append('assignedUserId', filterUser);
      if (filterCompany) params.append('company', filterCompany);
      if (filterMinVal) params.append('minValue', filterMinVal);
      if (filterMaxVal) params.append('maxValue', filterMaxVal);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const [dealsRes, analyticsRes, teamRes] = await Promise.all([
        fetch(`/api/v1/deals?${params.toString()}`, { headers }),
        fetch('/api/v1/pipeline/analytics', { headers }),
        fetch('/api/v1/team/members', { headers })
      ]);

      if (dealsRes.ok) {
        const dData = await dealsRes.json();
        setDeals(dData.deals || []);
      }
      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData);
      }
      if (teamRes.ok) {
        const tData = await teamRes.json();
        setTeamMembers(tData.members || tData || []);
      }
    } catch (err) {
      console.error('[PIPELINE_VIEW] Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [searchQuery, filterStage, filterUser, filterCompany, filterMinVal, filterMaxVal, filterStartDate, filterEndDate]);

  // Clean filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStage('');
    setFilterUser('');
    setFilterCompany('');
    setFilterMinVal('');
    setFilterMaxVal('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  // Stage Moves (Drag-and-drop equivalent buttons / selectors)
  const handleStageMove = async (dealId: string, currentStage: string, direction: 'forward' | 'backward') => {
    const activeIdx = LANES.findIndex(l => l.id === currentStage);
    if (activeIdx === -1) return;

    let nextStage = currentStage;
    if (direction === 'forward' && activeIdx < LANES.length - 1) {
      nextStage = LANES[activeIdx + 1].id;
    } else if (direction === 'backward' && activeIdx > 0) {
      nextStage = LANES[activeIdx - 1].id;
    }

    if (nextStage === currentStage) return;

    try {
      const token = localStorage.getItem('salespilot_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/deals/${dealId}/stage`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ stage: nextStage })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update stage');
      }

      await fetchAllData();
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal(prev => prev ? { ...prev, stage: nextStage } : null);
      }
    } catch (err: any) {
      alert(`Error moving stage: ${err.message}`);
    }
  };

  const handleUpdateDealDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;

    try {
      const token = localStorage.getItem('salespilot_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/deals/${selectedDeal.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update opportunity');
      }

      const updated = await res.json();
      setSelectedDeal(updated);
      setIsEditingDeal(false);
      await fetchAllData();
    } catch (err: any) {
      alert(`Error updating details: ${err.message}`);
    }
  };

  // Mark Won
  const handleMarkWon = async () => {
    if (!selectedDeal) return;
    try {
      const token = localStorage.getItem('salespilot_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/deals/${selectedDeal.id}/won`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to close deal');
      }

      setWonModalOpen(false);
      setSelectedDeal(null);
      await fetchAllData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Mark Lost
  const handleMarkLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    try {
      const token = localStorage.getItem('salespilot_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/deals/${selectedDeal.id}/lost`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lostReason })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to close deal');
      }

      setLostModalOpen(false);
      setLostReason('');
      setSelectedDeal(null);
      await fetchAllData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Delete Deal
  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal from CRM? This action preserves audit activities but erases active pipeline metrics.')) return;
    try {
      const token = localStorage.getItem('salespilot_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/deals/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete deal');
      }

      setSelectedDeal(null);
      await fetchAllData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Schedule FollowUp Workflow integration
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;

    try {
      const token = localStorage.getItem('salespilot_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const body = {
        leadId: selectedDeal.leadId,
        callId: null,
        title: followUpForm.title || `Follow-up on ${selectedDeal.leadName}`,
        description: followUpForm.description,
        dueAt: followUpForm.dueAt,
        priority: followUpForm.priority,
        source: 'MANUAL',
        dealId: selectedDeal.id
      };

      const res = await fetch('/api/v1/follow-ups', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to schedule follow-up');
      }

      alert('Follow-up scheduled successfully in calendar registry!');
      setScheduleFollowUpOpen(false);
      setFollowUpForm({ title: '', description: '', dueAt: '', priority: 'MEDIUM' });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Navigation Helper
  const handleOpenLead = (leadId: string) => {
    localStorage.setItem('selected_lead_id', leadId);
    if (setActiveTab) {
      setActiveTab('leads');
    } else {
      alert(`Redirect context: navigate to CRM leads matching ID ${leadId}.`);
    }
  };

  // Save other registries helper
  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanForm = {
      id: `co_${Date.now()}`,
      name: newCompanyForm.name,
      domain: newCompanyForm.domain || 'domain.com',
      industry: newCompanyForm.industry || 'B2B Services',
      size: newCompanyForm.size || '10-50 employees',
      revenue: newCompanyForm.revenue || '₹1 Crore',
      tags: newCompanyForm.tags ? newCompanyForm.tags.split(',').map(t => t.trim()) : [],
      createdAt: new Date().toISOString()
    };
    const updated = [cleanForm, ...companies];
    setCompanies(updated);
    localStorage.setItem('crm_companies', JSON.stringify(updated));
    setIsAddingCompanyModal(false);
    setNewCompanyForm({ name: '', domain: '', industry: '', size: '', revenue: '', tags: '' });
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanForm = {
      id: `ct_${Date.now()}`,
      fullName: newContactForm.fullName,
      email: newContactForm.email,
      phone: newContactForm.phone || 'N/A',
      company: newContactForm.company || 'Enterprise',
      title: newContactForm.title || 'Executive Representative',
      leadScore: newContactForm.leadScore,
      tags: newContactForm.tags ? newContactForm.tags.split(',').map(t => t.trim()) : [],
      createdAt: new Date().toISOString()
    };
    const updated = [cleanForm, ...contacts];
    setContacts(updated);
    localStorage.setItem('crm_contacts', JSON.stringify(updated));
    setIsAddingContactModal(false);
    setNewContactForm({ fullName: '', email: '', phone: '', company: '', title: '', leadScore: 'Warm', tags: '' });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanForm = {
      id: `tk_${Date.now()}`,
      title: newTaskForm.title,
      priority: newTaskForm.priority,
      status: 'TODO',
      dueDate: newTaskForm.dueDate || new Date().toISOString().split('T')[0],
      associatedTo: newTaskForm.associatedTo || 'Enterprise General',
      createdAt: new Date().toISOString()
    };
    const updated = [cleanForm, ...tasks];
    setTasks(updated);
    localStorage.setItem('crm_tasks', JSON.stringify(updated));
    setIsAddingTaskModal(false);
    setNewTaskForm({ title: '', priority: 'MEDIUM', dueDate: '', associatedTo: '' });
  };

  // Format Helper
  const formatCurrency = (val: number, curr = 'INR') => {
    if (curr === 'INR') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(val);
  };

  // Forecast Aggregations
  const forecastChartData = useMemo(() => {
    // Group open/won deals by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    
    // Create sliding 6 month projections
    const timeline = Array.from({ length: 6 }).map((_, i) => {
      const idx = (currentMonthIdx + i) % 12;
      return {
        month: months[idx],
        openValue: 0,
        weightedValue: 0,
        wonValue: 0
      };
    });

    deals.forEach(d => {
      const dateStr = d.expectedCloseDate || d.updatedAt;
      if (!dateStr) return;
      const mIdx = new Date(dateStr).getMonth();
      const relativeIdx = (mIdx - currentMonthIdx + 12) % 12;
      if (relativeIdx >= 0 && relativeIdx < 6) {
        const val = d.value || d.valueInr || 0;
        if (d.stage === 'WON') {
          timeline[relativeIdx].wonValue += val;
        } else if (d.stage !== 'LOST') {
          timeline[relativeIdx].openValue += val;
          // Apply standard weights
          const lane = LANES.find(l => l.id === d.stage);
          const prob = d.probability !== undefined ? d.probability : (lane ? lane.weight : 0.1);
          timeline[relativeIdx].weightedValue += (val * prob);
        }
      }
    });

    return timeline;
  }, [deals]);

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black tracking-tight">Enterprise Sales Pipeline</h1>
          </div>
          <p className="text-xs text-slate-300">
            Real-time pipeline value tracing, conversion funnel analytics, and transactional stage orchestration.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 mt-4 md:mt-0 bg-slate-850/80 p-1 rounded-xl border border-slate-750/50">
          {[
            { id: 'pipeline', label: 'Funnel Board', icon: Layers },
            { id: 'forecast', label: 'Projections', icon: TrendingUp },
            { id: 'companies', label: 'Companies', icon: Building },
            { id: 'contacts', label: 'Contacts', icon: User },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id 
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI DASHBOARD CARDS ROW */}
      {analytics && (activeSubTab === 'pipeline' || activeSubTab === 'forecast') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block tracking-wider">Total Open Pipeline</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(analytics.totalPipelineValue)}</span>
              <span className="text-xs text-slate-500 font-medium">({analytics.totalOpenDeals} Active)</span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">Unweighted gross volume of all active, unresolved accounts.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-500 block tracking-wider">Weighted Value</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(analytics.weightedPipelineValue)}</span>
              <span className="text-xs text-slate-500 font-mono">({((analytics.weightedPipelineValue / (analytics.totalPipelineValue || 1)) * 100).toFixed(0)}% Probability)</span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">Calculated dynamically based on real historic column coefficients.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-500 block tracking-wider">Won Revenue</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(analytics.wonValue)}</span>
              <span className="text-xs text-slate-500 font-medium">({analytics.wonDeals} deals)</span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">Completed won value representing real enterprise billings.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-rose-500 block tracking-wider">Lost Opportunity</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(analytics.lostValue)}</span>
              <span className="text-xs text-slate-500 font-medium">({analytics.lostDeals} lost)</span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">Gross pipeline attrition due to scheduling conflicts or pricing friction.</p>
          </div>
        </div>
      )}

      {/* SEARCH / FILTERS BAR */}
      {activeSubTab === 'pipeline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Advanced Tracing Filters
            </div>
            {(filterStage || filterUser || filterCompany || filterMinVal || filterMaxVal || filterStartDate || filterEndDate || searchQuery) && (
              <button 
                onClick={handleClearFilters}
                className="text-[10px] font-mono text-indigo-500 hover:underline flex items-center gap-1"
              >
                Clear Active Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[9px] font-mono font-bold text-slate-400 mb-1 uppercase">Search Keywords</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Company, contact or opportunity..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-8 pr-2.5 py-1.5 rounded-lg text-xs placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 mb-1 uppercase">Stage</label>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs focus:outline-none"
              >
                <option value="">All Columns</option>
                {LANES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 mb-1 uppercase">Assigned Rep</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs focus:outline-none"
              >
                <option value="">All Reps</option>
                {teamMembers.map(tm => (
                  <option key={tm.id} value={tm.id}>{tm.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 mb-1 uppercase">Value Scope</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input 
                  type="number" 
                  placeholder="Min"
                  value={filterMinVal}
                  onChange={(e) => setFilterMinVal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs placeholder-slate-400 focus:outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Max"
                  value={filterMaxVal}
                  onChange={(e) => setFilterMaxVal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[9px] font-mono font-bold text-slate-400 mb-1 uppercase">Created / Shift Window</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input 
                  type="date" 
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs focus:outline-none"
                />
                <input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC CONTENT LAYOUTS */}

      {/* 1. PIPELINE KANBAN BOARD VIEW */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-indigo-500/30">
            {LANES.map(lane => {
              const laneDeals = deals.filter(d => String(d.stage).toUpperCase() === lane.id);
              const laneSum = laneDeals.reduce((sum, d) => sum + (d.value || d.valueInr || 0), 0);

              return (
                <div 
                  key={lane.id}
                  className={`flex-1 min-w-[280px] max-w-[340px] bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-3 border-t-4 border border-slate-200 dark:border-slate-800 flex flex-col space-y-3.5 shrink-0 ${lane.color}`}
                >
                  {/* Lane Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 pb-2">
                    <div>
                      <h3 className="text-xs font-black tracking-tight">{lane.label}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-500 block mt-0.5">
                        {laneDeals.length} opportunity{laneDeals.length !== 1 ? 'ies' : ''}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black">
                      {formatCurrency(laneSum)}
                    </span>
                  </div>

                  {/* Deals Stack */}
                  <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
                    {laneDeals.map(deal => {
                      const prob = deal.probability !== undefined ? deal.probability : lane.weight;
                      const hasOverdueAction = deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date() && deal.stage !== 'WON' && deal.stage !== 'LOST';

                      return (
                        <div
                          key={deal.id}
                          onClick={() => {
                            setSelectedDeal(deal);
                            setEditForm(deal);
                          }}
                          className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition duration-150 cursor-pointer space-y-3 group ${lane.hoverColor}`}
                        >
                          {/* Deal Card Header */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div>
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">{deal.company}</span>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 mt-0.5 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                {deal.leadName || deal.contactName}
                              </h4>
                            </div>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white shrink-0">
                              {formatCurrency(deal.value || deal.valueInr || 0, deal.currency)}
                            </span>
                          </div>

                          {/* Deal Metadata */}
                          {deal.nextAction && (
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-normal bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-850 truncate">
                              <strong>Next:</strong> {deal.nextAction}
                            </p>
                          )}

                          {/* Close timeline & Owner info */}
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-850">
                            <span className="flex items-center gap-1 font-semibold">
                              <User className="w-3 h-3 text-slate-400" />
                              {deal.assignedUserName || 'Unassigned'}
                            </span>

                            {deal.expectedCloseDate && (
                              <span className={`flex items-center gap-1 font-bold ${hasOverdueAction ? 'text-rose-500' : 'text-slate-400'}`}>
                                <Clock className="w-3 h-3" />
                                {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {laneDeals.length === 0 && (
                      <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center p-6 text-[10px] text-slate-400 font-mono bg-slate-50/5/50">
                        <AlertCircle className="w-4 h-4 text-slate-300 mb-1" />
                        Empty Stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ANALYTICS SECTION BELOW FUNNEL BOARD */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              {/* Funnel Stage comparative bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 font-mono flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Value Distribution by Stage
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={LANES.map(l => ({ stage: l.label, Value: analytics.valueByStage[l.id] || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="stage" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="Value" radius={[4, 4, 0, 0]}>
                        {LANES.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#3B82F6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Deal Count breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 font-mono flex items-center gap-1">
                  <PieChart className="w-4 h-4 text-purple-500" />
                  Opportunity Stage Breakdown
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={LANES.map(l => ({ name: l.label, value: analytics.countByStage[l.id] || 0 })).filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {LANES.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366F1' : '#10B981'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Won vs Lost Comparison */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 font-mono flex items-center gap-1">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Conversion Funnel Efficiency
                  </h3>
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Total Deals Resolved</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{analytics.wonDeals + analytics.lostDeals}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">Closed Won Ratio</span>
                        <span>
                          {((analytics.wonDeals / (analytics.wonDeals + analytics.lostDeals || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-750">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300" 
                          style={{ width: `${((analytics.wonDeals / (analytics.wonDeals + analytics.lostDeals || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-rose-600 dark:text-rose-400">Deal Drop-off Attrition</span>
                        <span>
                          {((analytics.lostDeals / (analytics.wonDeals + analytics.lostDeals || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-750">
                        <div 
                          className="bg-rose-500 h-full transition-all duration-300" 
                          style={{ width: `${((analytics.lostDeals / (analytics.wonDeals + analytics.lostDeals || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-[10px] font-medium text-slate-500 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Conversion metric measures stage performance of all resolved, unarchived deal entries.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PROJECTIONS & FORECASTING GRAPHS */}
      {activeSubTab === 'forecast' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Moving Sales Projection Curve
            </h2>
            <p className="text-xs text-slate-400">
              Future revenue forecasts mapped against expected closing dates using dynamic lane coefficients.
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChartData}>
                <defs>
                  <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWeighted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Area type="monotone" dataKey="wonValue" name="Won Closed Revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorWon)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="weightedValue" name="Weighted Expected Value" stroke="#6366F1" fillOpacity={1} fill="url(#colorWeighted)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-slate-600 dark:text-slate-300">
            <h4 className="font-bold text-indigo-950 dark:text-indigo-200 mb-1">How weighted estimation works:</h4>
            We cross-calculate the gross value of all open pipeline opportunities against conservative stage coefficients:
            <span className="font-semibold block mt-1">Qualified (20%) · Contacted (30%) · Interested (45%) · Meeting (60%) · Proposal (75%) · Negotiation (85%)</span>
          </div>
        </div>
      )}

      {/* 3. COMPANIES REGISTRY TABLE */}
      {activeSubTab === 'companies' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-500" />
              Corporate Workspace Register
            </h3>
            <button 
              onClick={() => setIsAddingCompanyModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Company
            </button>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-850 uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Company Name</th>
                <th className="py-3 px-4 font-bold">Domain</th>
                <th className="py-3 px-4 font-bold">Industry</th>
                <th className="py-3 px-4 font-bold">Size</th>
                <th className="py-3 px-4 font-bold">Annual Revenue</th>
                <th className="py-3 px-4 font-bold">Tags</th>
                <th className="py-3 px-4 font-bold text-right">Registered At</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(co => (
                <tr key={co.id} className="border-b border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {co.name}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    <a href={`https://${co.domain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-500">
                      {co.domain}
                      <Globe className="w-3 h-3 text-slate-400" />
                    </a>
                  </td>
                  <td className="py-3.5 px-4">{co.industry}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{co.size}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-semibold">{co.revenue}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {co.tags?.map((t: string, i: number) => (
                        <span key={i} className="text-[9px] font-mono bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-1.5 py-0.2 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                    {new Date(co.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. CONTACTS REGISTER TABLE */}
      {activeSubTab === 'contacts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-500" />
              Contacts Registry Database
            </h3>
            <button 
              onClick={() => setIsAddingContactModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Contact
            </button>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-850 uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Contact Name</th>
                <th className="py-3 px-4 font-bold">Business Email</th>
                <th className="py-3 px-4 font-bold">Associated Corp</th>
                <th className="py-3 px-4 font-bold">Job Title</th>
                <th className="py-3 px-4 font-bold">Lead Score</th>
                <th className="py-3 px-4 font-bold">Tags</th>
                <th className="py-3 px-4 font-bold text-right">Registered</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(ct => (
                <tr key={ct.id} className="border-b border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      {ct.fullName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{ct.email}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">{ct.company}</td>
                  <td className="py-3.5 px-4 text-slate-500">{ct.title}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                      {ct.leadScore}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {ct.tags?.map((t: string, i: number) => (
                        <span key={i} className="text-[9px] font-mono bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 px-1.5 py-0.2 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                    {new Date(ct.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TASKS REGISTER */}
      {activeSubTab === 'tasks' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              Strategic Actionable Tasks
            </h3>
            <button 
              onClick={() => setIsAddingTaskModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Task
            </button>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-850 uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Task Objective</th>
                <th className="py-3 px-4 font-bold">Priority</th>
                <th className="py-3 px-4 font-bold">Associated To</th>
                <th className="py-3 px-4 font-bold">Due Date</th>
                <th className="py-3 px-4 font-bold text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(tk => (
                <tr key={tk.id} className="border-b border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {tk.title}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      tk.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {tk.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">{tk.associatedTo}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{tk.dueDate}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                    {new Date(tk.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DEAL DETAIL DRAWER */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-40">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 sticky top-0 backdrop-blur-sm z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Opportunity Detail Profile</span>
                <h2 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                  {selectedDeal.leadName}
                </h2>
                <span className="text-[10px] font-mono text-slate-500 block">{selectedDeal.company}</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedDeal(null);
                  setIsEditingDeal(false);
                }}
                className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              
              {/* STAGE & TRANSITION BAR */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Funnel Stage</span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                    {selectedDeal.stage}
                  </span>
                </div>

                {/* Transition Actions */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleStageMove(selectedDeal.id, selectedDeal.stage, 'backward')}
                    className="py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    ◀ Backstage
                  </button>
                  <button
                    onClick={() => handleStageMove(selectedDeal.id, selectedDeal.stage, 'forward')}
                    className="py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    Stage Advance ▶
                  </button>
                </div>

                {/* WON / LOST FINAL ACTIONS */}
                {selectedDeal.stage !== 'WON' && selectedDeal.stage !== 'LOST' && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => setWonModalOpen(true)}
                      className="py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      Mark Won
                    </button>
                    <button
                      onClick={() => {
                        setLostReason('');
                        setLostModalOpen(true);
                      }}
                      className="py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Skull className="w-4 h-4" />
                      Mark Lost
                    </button>
                  </div>
                )}
              </div>

              {/* QUICK NAVIGATE LINK */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenLead(selectedDeal.leadId)}
                  className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100/50 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  Open Prospect CRM File
                </button>
                <button
                  onClick={() => {
                    setScheduleFollowUpOpen(true);
                  }}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Schedule Follow-Up
                </button>
              </div>

              {/* DETAILS FORM / VIEW */}
              {!isEditingDeal ? (
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-850 pt-5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-bold text-slate-800 dark:text-white text-sm">Specification Overview</span>
                    <button 
                      onClick={() => {
                        setIsEditingDeal(true);
                        setEditForm(selectedDeal);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-500 flex items-center gap-1 font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Modify Specifications
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase">Contract Value</span>
                      <span className="font-black text-slate-800 dark:text-slate-150 text-sm">
                        {formatCurrency(selectedDeal.value || selectedDeal.valueInr || 0, selectedDeal.currency)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase">Expected Closing</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">
                        {selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString() : 'Not Specified'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase">Sales Representative</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">
                        {selectedDeal.assignedUserName || 'Unassigned Representative'}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase">Source Generation</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-150">
                        {selectedDeal.source || 'MANUAL'}
                      </span>
                    </div>
                  </div>

                  {selectedDeal.description && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase mb-1">Strategic Description</span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {selectedDeal.description}
                      </p>
                    </div>
                  )}

                  {selectedDeal.nextAction && (
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-3 rounded-lg border border-indigo-100/50 dark:border-indigo-950/30">
                      <span className="text-[9px] font-mono text-indigo-500 block uppercase mb-1 font-bold">Immediate Next Action</span>
                      <p className="text-indigo-950 dark:text-indigo-200 font-bold">
                        {selectedDeal.nextAction}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Created: {new Date(selectedDeal.createdAt).toLocaleString()}</span>
                    <span>Updated: {new Date(selectedDeal.updatedAt).toLocaleString()}</span>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                    <button
                      onClick={() => handleDeleteDeal(selectedDeal.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold flex items-center gap-1 text-[11px] transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Erase Deal File
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateDealDetails} className="space-y-4 border-t border-slate-100 dark:border-slate-850 pt-5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-bold text-slate-800 dark:text-white text-sm">Edit Specifications</span>
                    <button 
                      type="button"
                      onClick={() => setIsEditingDeal(false)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Deal Value *</label>
                    <input 
                      type="number" 
                      required
                      min={1}
                      value={editForm.value || editForm.valueInr || 0}
                      onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Expected Close Date</label>
                    <input 
                      type="date" 
                      value={editForm.expectedCloseDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Description</label>
                    <textarea 
                      rows={4}
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Next Action Plan</label>
                    <input 
                      type="text" 
                      value={editForm.nextAction || ''}
                      onChange={(e) => setEditForm({ ...editForm, nextAction: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Save Specifications
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE FOLLOW-UP OVERLAY DIALOG */}
      {scheduleFollowUpOpen && selectedDeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Schedule Follow-up
              </h3>
              <button onClick={() => setScheduleFollowUpOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Follow-up Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Discuss onboarding proposal"
                  value={followUpForm.title}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Due Date/Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={followUpForm.dueAt}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, dueAt: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Priority</label>
                <select
                  value={followUpForm.priority}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Brief Description</label>
                <textarea 
                  rows={3}
                  placeholder="Notes about conversation goals, details..."
                  value={followUpForm.description}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setScheduleFollowUpOpen(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WON CONFIRMATION OVERLAY DIALOG */}
      {wonModalOpen && selectedDeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Close Opportunity as WON?</h3>
              <p className="text-xs text-slate-400">
                You are marking the deal for <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedDeal.leadName}</span> as <strong>WON</strong>. This records gross revenue of <strong>{formatCurrency(selectedDeal.value || selectedDeal.valueInr || 0)}</strong>.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setWonModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                No, cancel
              </button>
              <button 
                type="button" 
                onClick={handleMarkWon}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Yes, Close as WON!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOST CONFIRMATION OVERLAY DIALOG */}
      {lostModalOpen && selectedDeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Close Opportunity as LOST?</h3>
              <p className="text-xs text-slate-400">
                Please specify the friction reason for archiving this deal context.
              </p>
            </div>

            <form onSubmit={handleMarkLost} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Lost Reason *</label>
                <select
                  required
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="">Select a reason...</option>
                  <option value="Pricing Friction">Pricing Friction / Budget Limits</option>
                  <option value="Scheduling Conflicts">Scheduling Conflicts / No-show</option>
                  <option value="Selected Alternative Partner">Selected Alternative B2B Partner</option>
                  <option value="Internal Strategy Pivot">Internal Corporate Strategy Pivot</option>
                  <option value="Unresponsive Thread Attrition">Unresponsive Thread Attrition</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setLostModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Close as LOST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER COMPANY MODAL */}
      {isAddingCompanyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono">Add Corporate Registry</h3>
              <button onClick={() => setIsAddingCompanyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Company Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Horizon Labs"
                  value={newCompanyForm.name}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Corporate Domain</label>
                <input 
                  type="text" 
                  placeholder="horizon.media"
                  value={newCompanyForm.domain}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, domain: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Industry</label>
                <input 
                  type="text" 
                  placeholder="SaaS / Web3"
                  value={newCompanyForm.industry}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, industry: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAddingCompanyModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Add Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER CONTACT MODAL */}
      {isAddingContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono">Register Contact File</h3>
              <button onClick={() => setIsAddingContactModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Sarah Jenkins"
                  value={newContactForm.fullName}
                  onChange={(e) => setNewContactForm({ ...newContactForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Business Email *</label>
                <input 
                  type="email" 
                  required
                  placeholder="sarah@domain.com"
                  value={newContactForm.email}
                  onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Corporate Client</label>
                <input 
                  type="text" 
                  placeholder="e.g. Horizon Labs"
                  value={newContactForm.company}
                  onChange={(e) => setNewContactForm({ ...newContactForm, company: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAddingContactModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG TASK MODAL */}
      {isAddingTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono">Create Actionable Task</h3>
              <button onClick={() => setIsAddingTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Objective *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Prepare deck guaranteed contract scope"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Priority</label>
                <select
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Corporate Association</label>
                <input 
                  type="text" 
                  placeholder="e.g. Horizon Labs"
                  value={newTaskForm.associatedTo}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, associatedTo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAddingTaskModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
