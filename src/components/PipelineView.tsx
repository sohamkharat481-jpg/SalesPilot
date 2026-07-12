import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DollarSign, TrendingUp, ChevronRight, MessageSquare, 
  Sparkles, Award, User, Layers, ArrowUpRight, Plus, Search, 
  Filter, Trash2, Download, Upload, FileText, Tag, CheckCircle2, 
  Clock, Calendar, CheckSquare, Square, RefreshCw, AlertCircle, 
  BarChart3, Building, Users, Activity, FileUp, Database, 
  FileSpreadsheet, PlusCircle, Trash, Check, X, Shield, Globe
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Deal, DealStage, Lead } from '../types';
import { getSupabaseClient } from '../lib/supabase';

// Real-time weights for pipeline estimation
const LANES: { id: DealStage; label: string; color: string; weight: number }[] = [
  { id: 'PROSPECTING', label: 'Prospecting', color: 'border-t-slate-400 bg-slate-50/40 text-slate-700', weight: 0.10 },
  { id: 'QUALIFIED', label: 'Qualified', color: 'border-t-blue-300 bg-blue-50/10 text-blue-800', weight: 0.25 },
  { id: 'DEMO_SCHEDULED', label: 'Demo Booked', color: 'border-t-blue-500 bg-blue-50/20 text-blue-900', weight: 0.50 },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'border-t-indigo-500 bg-indigo-50/10 text-indigo-900', weight: 0.70 },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-t-amber-500 bg-amber-50/10 text-amber-900', weight: 0.85 },
  { id: 'CLOSED_WON', label: 'Closed Won', color: 'border-t-emerald-500 bg-emerald-50/20 text-emerald-900', weight: 1.00 },
  { id: 'CLOSED_LOST', label: 'Closed Lost', color: 'border-t-rose-500 bg-rose-50/20 text-rose-900', weight: 0.00 }
];

interface PipelineViewProps {
  deals: Deal[];
  onUpdateDealStage: (dealId: string, stage: DealStage) => Promise<void>;
}

interface CRMCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: string;
  tags?: string[];
  createdAt: string;
}

interface CRMContact {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  leadScore: 'Very Hot' | 'Hot' | 'Warm' | 'Cold';
  tags?: string[];
  createdAt: string;
}

interface CRMTask {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'COMPLETED';
  dueDate: string;
  associatedTo: string; // Company/Contact/Deal name
  createdAt: string;
}

interface CRMNote {
  id: string;
  title: string;
  text: string;
  associatedTo: string;
  createdAt: string;
}

interface CRMFile {
  id: string;
  name: string;
  size: string;
  type: string;
  associatedTo: string;
  uploadedAt: string;
}

export function PipelineView({ deals: externalDeals, onUpdateDealStage }: PipelineViewProps) {
  // CRM Navigation State
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'companies' | 'contacts' | 'tasks' | 'notes' | 'files' | 'forecast'>('pipeline');
  
  // Real-time Database Status Indicator
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Core CRM Local Cache (persists to localStorage or syncs with Supabase)
  const [deals, setDeals] = useState<Deal[]>(() => {
    const local = localStorage.getItem('crm_deals');
    return local ? JSON.parse(local) : [];
  });

  const [companies, setCompanies] = useState<CRMCompany[]>(() => {
    const local = localStorage.getItem('crm_companies');
    return local ? JSON.parse(local) : [
      { id: 'co_1', name: 'Apex Marketing Solutions', domain: 'apexmarketing.in', industry: 'Marketing', size: '11-50 employees', revenue: '₹2.5 Crore INR', tags: ['Enterprise', 'Hot Prospect'], createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'co_2', name: 'StellarTech Labs', domain: 'stellartech.io', industry: 'Technology', size: '51-200 employees', revenue: '₹12 Crore INR', tags: ['SaaS scale', 'AWS Ecosystem'], createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'co_3', name: 'Zylker Systems', domain: 'zylker.co', industry: 'Web Development', size: '1-10 employees', revenue: '₹50 Lakh INR', tags: ['Inbound', 'Mid-market'], createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
    ];
  });

  const [contacts, setContacts] = useState<CRMContact[]>(() => {
    const local = localStorage.getItem('crm_contacts');
    return local ? JSON.parse(local) : [
      { id: 'ct_1', fullName: 'Ananya Sharma', email: 'ananya@apexmarketing.in', phone: '+91 98765 43210', company: 'Apex Marketing Solutions', title: 'Managing Director', leadScore: 'Very Hot', tags: ['Decision Maker'], createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'ct_2', fullName: 'Rohan Mehta', email: 'rohan@stellartech.io', phone: '+91 87654 32109', company: 'StellarTech Labs', title: 'VP of Engineering', leadScore: 'Hot', tags: ['Technical Buyer'], createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'ct_3', fullName: 'Vikram Rao', email: 'vikram@zylker.co', phone: '+91 76543 21098', company: 'Zylker Systems', title: 'Founder', leadScore: 'Warm', tags: ['Inbound Lead'], createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
    ];
  });

  const [tasks, setTasks] = useState<CRMTask[]>(() => {
    const local = localStorage.getItem('crm_tasks');
    return local ? JSON.parse(local) : [
      { id: 'tk_1', title: 'Follow up on proposal review status', description: 'Call Ananya directly to resolve budget concerns', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], associatedTo: 'Apex Marketing Solutions', createdAt: new Date().toISOString() },
      { id: 'tk_2', title: 'Generate custom API integration docs', description: 'Review AWS Cognito hooks and schema requirements', priority: 'MEDIUM', status: 'TODO', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], associatedTo: 'StellarTech Labs', createdAt: new Date().toISOString() },
      { id: 'tk_3', title: 'Onboard team on pilot campaign builder', description: 'Walk through AI personalized sequences demo', priority: 'LOW', status: 'COMPLETED', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], associatedTo: 'Zylker Systems', createdAt: new Date().toISOString() }
    ];
  });

  const [notes, setNotes] = useState<CRMNote[]>(() => {
    const local = localStorage.getItem('crm_notes');
    return local ? JSON.parse(local) : [
      { id: 'nt_1', title: 'Pricing negotiation feedback', text: 'Ananya requested a detailed pricing layout in INR currency. She prefers quarterly billing structure to align with corporate audit pipeline requirements.', associatedTo: 'Apex Marketing Solutions', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'nt_2', title: 'AWS Stack Architecture notes', text: 'StellarTech runs fully containerized Kubernetes infrastructure on AWS. They require a dedicated web hook node to capture webhook triggers in real-time.', associatedTo: 'StellarTech Labs', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ];
  });

  const [files, setFiles] = useState<CRMFile[]>(() => {
    const local = localStorage.getItem('crm_files');
    return local ? JSON.parse(local) : [
      { id: 'fl_1', name: 'Horizon_Media_SaaS_Outbound_Proposal.pdf', size: '2.4 MB', type: 'application/pdf', associatedTo: 'Apex Marketing Solutions', uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'fl_2', name: 'Enterprise_Pilot_Security_Architecture.pdf', size: '1.8 MB', type: 'application/pdf', associatedTo: 'StellarTech Labs', uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ];
  });

  const [activities, setActivities] = useState<{ id: string; text: string; details: string; time: string; type: string }[]>(() => {
    const local = localStorage.getItem('crm_activities');
    return local ? JSON.parse(local) : [
      { id: 'act_1', text: 'Deal Stage Advanced', details: 'Apex Marketing Solutions deal moved to PROPOSAL_SENT', time: '2 hours ago', type: 'pipeline' },
      { id: 'act_2', text: 'New File Uploaded', details: 'Horizon_Media_SaaS_Outbound_Proposal.pdf added to Apex Marketing Solutions record', time: '1 day ago', type: 'file' },
      { id: 'act_3', title: 'Task Completed', text: 'Onboard team on pilot campaign builder', details: 'Marked completed for Zylker Systems', time: '2 days ago', type: 'task' }
    ];
  });

  // Global Sync / Sync Fallback states
  useEffect(() => {
    localStorage.setItem('crm_deals', JSON.stringify(deals));
    localStorage.setItem('crm_companies', JSON.stringify(companies));
    localStorage.setItem('crm_contacts', JSON.stringify(contacts));
    localStorage.setItem('crm_tasks', JSON.stringify(tasks));
    localStorage.setItem('crm_notes', JSON.stringify(notes));
    localStorage.setItem('crm_files', JSON.stringify(files));
    localStorage.setItem('crm_activities', JSON.stringify(activities));
  }, [deals, companies, contacts, tasks, notes, files, activities]);

  // Merge external deals if they update
  useEffect(() => {
    if (externalDeals && externalDeals.length > 0) {
      setDeals(prev => {
        // Keep unique deals, merging external overrides
        const map = new Map(prev.map(d => [d.id, d]));
        externalDeals.forEach(ext => {
          map.set(ext.id, {
            ...ext,
            stage: ext.stage || 'PROSPECTING'
          });
        });
        return Array.from(map.values());
      });
    }
  }, [externalDeals]);

  // Supabase Sync check on mount
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      setIsSupabaseActive(true);
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔌 Supabase detected. Initializing Enterprise Database Synced Node...`]);
      loadSupabaseCrmData(supabase);

      // Realtime subscription setup
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_pipeline' }, (payload) => {
          setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚡ Realtime update received from Supabase channel.`]);
          loadSupabaseCrmData(supabase);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setIsSupabaseActive(false);
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 💾 No Supabase credentials. Operating on local CRM Replica State.`]);
    }
  }, []);

  const loadSupabaseCrmData = async (supabase: any) => {
    setIsSyncing(true);
    try {
      // Pulling from Supabase standard pipeline tables
      const { data: pipelineData, error } = await supabase.from('crm_pipeline').select('*');
      if (!error && pipelineData) {
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Synced ${pipelineData.length} live deal rows.`]);
        // Merge into local representation
        if (pipelineData.length > 0) {
          const mappedDeals = pipelineData.map((row: any) => ({
            id: row.id,
            leadId: row.lead_id,
            leadName: row.lead_name || 'Prospect Contact',
            company: row.company_name || 'Enterprise Client',
            valueInr: row.expected_revenue,
            stage: row.stage.toUpperCase() as DealStage,
            updatedAt: row.updated_at || row.created_at
          }));
          setDeals(mappedDeals);
        }
      }
    } catch (err) {
      console.error('Supabase CRM Pull Failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await loadSupabaseCrmData(supabase);
    } else {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Saved local state cache.`]);
      }, 500);
    }
  };

  // Drag & Drop / Lane Shifting state
  const [movingId, setMovingId] = useState<string | null>(null);

  // Search & Filtering State for CRM Tables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedScore, setSelectedScore] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');

  // Bulk Edit / Selection states
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<DealStage | ''>('');
  const [bulkTagToAdd, setBulkTagToAdd] = useState('');

  // Modals / Add Entity State
  const [isAddingCompanyModal, setIsAddingCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDomain, setNewCompanyDomain] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('');
  const [newCompanySize, setNewCompanySize] = useState('11-50 employees');
  const [newCompanyRevenue, setNewCompanyRevenue] = useState('₹1 Crore - ₹5 Crore');
  const [newCompanyTags, setNewCompanyTags] = useState('');

  const [isAddingContactModal, setIsAddingContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactScore, setNewContactScore] = useState<'Cold' | 'Warm' | 'Hot' | 'Very Hot'>('Warm');
  const [newContactTags, setNewContactTags] = useState('');

  const [isAddingTaskModal, setIsAddingTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssoc, setNewTaskAssoc] = useState('');

  const [isAddingNoteModal, setIsAddingNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteAssoc, setNewNoteAssoc] = useState('');

  // CSV Import State
  const [isImportModal, setIsImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importType, setImportType] = useState<'companies' | 'contacts' | 'deals'>('contacts');

  // Unified activity logger
  const logCRMActivity = (text: string, details: string, type: string) => {
    const newAct = {
      id: `act_${Date.now()}`,
      text,
      details,
      time: 'Just now',
      type
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Real-time lane movement
  const handleStageMove = async (dealId: string, currentStage: DealStage, direction: 'forward' | 'backward') => {
    setMovingId(dealId);
    const stagesOrder: DealStage[] = [
      'PROSPECTING', 'QUALIFIED', 'DEMO_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'
    ];
    
    const currentIndex = stagesOrder.indexOf(currentStage);
    let nextIndex = currentIndex;
    
    if (direction === 'forward' && currentIndex < stagesOrder.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'backward' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex !== currentIndex) {
      const targetStage = stagesOrder[nextIndex];
      
      // Update locally
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: targetStage, updatedAt: new Date().toISOString() } : d));
      
      // Push via external prop
      try {
        await onUpdateDealStage(dealId, targetStage);
      } catch (err) {
        console.warn('External handler failed, local backup persisted.', err);
      }

      // Supabase Push if connected
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('crm_pipeline').update({ stage: targetStage.toLowerCase(), updated_at: new Date().toISOString() }).eq('id', dealId);
      }

      logCRMActivity(
        'Deal Stage Advanced', 
        `Deal was updated to ${targetStage}`,
        'pipeline'
      );
    }
    setMovingId(null);
  };

  const handleCreateDealDirect = (leadId: string, valueInr: number, stage: DealStage, clientCompany: string, clientName: string) => {
    const newDeal: Deal = {
      id: `dl_${Date.now()}`,
      leadId,
      leadName: clientName,
      company: clientCompany,
      valueInr,
      stage,
      updatedAt: new Date().toISOString()
    };
    setDeals(prev => [newDeal, ...prev]);
    logCRMActivity('Deal Created', `New CRM Deal initialized for ${clientCompany} valued at ₹${valueInr.toLocaleString('en-IN')}`, 'pipeline');
  };

  const handleDeleteDeal = (dealId: string) => {
    setDeals(prev => prev.filter(d => d.id !== dealId));
    logCRMActivity('Deal Deleted', `Removed Deal record ID: ${dealId}`, 'pipeline');
  };

  // Add Company Handler
  const handleAddCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;

    const newCompany: CRMCompany = {
      id: `co_${Date.now()}`,
      name: newCompanyName,
      domain: newCompanyDomain,
      industry: newCompanyIndustry,
      size: newCompanySize,
      revenue: newCompanyRevenue,
      tags: newCompanyTags ? newCompanyTags.split(',').map(s => s.trim()) : [],
      createdAt: new Date().toISOString()
    };

    setCompanies(prev => [newCompany, ...prev]);
    logCRMActivity('Company Registered', `Company ${newCompanyName} added to database registry.`, 'company');
    
    // Automatically spin up a pipeline deal!
    handleCreateDealDirect(`ld_${Date.now()}`, 150000, 'PROSPECTING', newCompanyName, 'Lead Contact');

    // Reset Form
    setNewCompanyName('');
    setNewCompanyDomain('');
    setNewCompanyIndustry('');
    setIsAddingCompanyModal(false);
  };

  // Add Contact Handler
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactCompany) return;

    const newContact: CRMContact = {
      id: `ct_${Date.now()}`,
      fullName: newContactName,
      email: newContactEmail,
      phone: newContactPhone,
      company: newContactCompany,
      title: newContactTitle,
      leadScore: newContactScore,
      tags: newContactTags ? newContactTags.split(',').map(s => s.trim()) : [],
      createdAt: new Date().toISOString()
    };

    setContacts(prev => [newContact, ...prev]);
    logCRMActivity('Contact Created', `Contact person ${newContactName} associated with ${newContactCompany}.`, 'contact');

    // Close Modal
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactCompany('');
    setNewContactTitle('');
    setIsAddingContactModal(false);
  };

  // Add Task Handler
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const newTask: CRMTask = {
      id: `tk_${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      status: 'TODO',
      dueDate: newTaskDueDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      associatedTo: newTaskAssoc || 'General Workspace',
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    logCRMActivity('Task Created', `New CRM Task added: ${newTaskTitle}`, 'task');

    // Reset Form
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskAssoc('');
    setIsAddingTaskModal(false);
  };

  // Add Note Handler
  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteText) return;

    const newNote: CRMNote = {
      id: `nt_${Date.now()}`,
      title: newNoteTitle,
      text: newNoteText,
      associatedTo: newNoteAssoc || 'Apex Marketing Solutions',
      createdAt: new Date().toISOString()
    };

    setNotes(prev => [newNote, ...prev]);
    logCRMActivity('Note Logged', `Scribbled strategic note: ${newNoteTitle}`, 'note');

    // Reset Form
    setNewNoteTitle('');
    setNewNoteText('');
    setNewNoteAssoc('');
    setIsAddingNoteModal(false);
  };

  // Toggle Task Completed
  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'TODO' ? 'COMPLETED' : 'TODO';
        logCRMActivity(
          nextStatus === 'COMPLETED' ? 'Task Completed' : 'Task Reopened', 
          `Task "${t.title}" status changed to ${nextStatus}`, 
          'task'
        );
        return { ...t, status: nextStatus as 'TODO' | 'COMPLETED' };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    logCRMActivity('Task Deleted', `Removed task ID: ${taskId}`, 'task');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    logCRMActivity('Note Erased', `Erased notebook draft ID: ${noteId}`, 'note');
  };

  // Mock File Dropper Action
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const filesUploaded = e.dataTransfer.files;
    if (filesUploaded && filesUploaded.length > 0) {
      processFile(filesUploaded[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;
    
    const newFile: CRMFile = {
      id: `fl_${Date.now()}`,
      name: file.name,
      size: sizeStr,
      type: file.type || 'document/raw',
      associatedTo: 'Apex Marketing Solutions',
      uploadedAt: new Date().toISOString()
    };

    setFiles(prev => [newFile, ...prev]);
    logCRMActivity('Document Attached', `Uploaded document: ${file.name} to CRM vault`, 'file');
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    logCRMActivity('Document Removed', `Deleted document file ID: ${fileId}`, 'file');
  };

  // CSV Import Mechanism
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText) return;

    try {
      const lines = importCsvText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) throw new Error('CSV must contain a header and at least 1 record.');
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      let importCount = 0;
      if (importType === 'companies') {
        const newCoList: CRMCompany[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < 1) continue;
          
          const nameIdx = headers.indexOf('company') !== -1 ? headers.indexOf('company') : headers.indexOf('name');
          const domainIdx = headers.indexOf('domain') !== -1 ? headers.indexOf('domain') : headers.indexOf('website');
          const industryIdx = headers.indexOf('industry');
          const sizeIdx = headers.indexOf('size') !== -1 ? headers.indexOf('size') : headers.indexOf('employees');

          newCoList.push({
            id: `co_imp_${Date.now()}_${i}`,
            name: cols[nameIdx !== -1 ? nameIdx : 0] || 'Imported Corp',
            domain: cols[domainIdx !== -1 ? domainIdx : 1] || 'imported.co',
            industry: cols[industryIdx !== -1 ? industryIdx : 2] || 'Tech SaaS',
            size: cols[sizeIdx !== -1 ? sizeIdx : 3] || '11-50 employees',
            revenue: '₹1 Crore INR',
            tags: ['Imported'],
            createdAt: new Date().toISOString()
          });
          importCount++;
        }
        setCompanies(prev => [...newCoList, ...prev]);
      } else if (importType === 'contacts') {
        const newCtList: CRMContact[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < 2) continue;

          const nameIdx = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('fullname');
          const emailIdx = headers.indexOf('email');
          const companyIdx = headers.indexOf('company');
          const titleIdx = headers.indexOf('title') !== -1 ? headers.indexOf('title') : headers.indexOf('role');

          newCtList.push({
            id: `ct_imp_${Date.now()}_${i}`,
            fullName: cols[nameIdx !== -1 ? nameIdx : 0] || 'Imported Contact',
            email: cols[emailIdx !== -1 ? emailIdx : 1] || 'contact@imported.co',
            phone: '+91 99999 99999',
            company: cols[companyIdx !== -1 ? companyIdx : 2] || 'Apex Marketing',
            title: cols[titleIdx !== -1 ? titleIdx : 3] || 'Director',
            leadScore: 'Warm',
            tags: ['Imported CSV'],
            createdAt: new Date().toISOString()
          });
          importCount++;
        }
        setContacts(prev => [...newCtList, ...prev]);
      } else if (importType === 'deals') {
        const newDlList: Deal[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < 2) continue;

          const nameIdx = headers.indexOf('leadname') !== -1 ? headers.indexOf('leadname') : headers.indexOf('contact');
          const compIdx = headers.indexOf('company');
          const valIdx = headers.indexOf('value') !== -1 ? headers.indexOf('value') : headers.indexOf('revenue');
          const stageIdx = headers.indexOf('stage');

          newDlList.push({
            id: `dl_imp_${Date.now()}_${i}`,
            leadId: `ld_imp_${Date.now()}_${i}`,
            leadName: cols[nameIdx !== -1 ? nameIdx : 0] || 'Imported Contact',
            company: cols[compIdx !== -1 ? compIdx : 1] || 'Apex Marketing',
            valueInr: Number(cols[valIdx !== -1 ? valIdx : 2]) || 85000,
            stage: (cols[stageIdx !== -1 ? stageIdx : 3]?.toUpperCase() || 'PROSPECTING') as DealStage,
            updatedAt: new Date().toISOString()
          });
          importCount++;
        }
        setDeals(prev => [...newDlList, ...prev]);
      }

      logCRMActivity('Bulk CSV Imported', `Imported ${importCount} elements via CRM Import Node.`, 'pipeline');
      alert(`Import complete! Loaded ${importCount} ${importType} records.`);
      setImportCsvText('');
      setIsImportModal(false);
    } catch (err: any) {
      alert(`Parsing failed: ${err.message || 'Check CSV column layout'}`);
    }
  };

  // CSV Export Mechanism
  const handleExportData = (type: 'companies' | 'contacts' | 'deals') => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (type === 'companies') {
      csvContent += 'ID,Company Name,Domain,Industry,Size,Revenue,Created At\n';
      companies.forEach(c => {
        csvContent += `"${c.id}","${c.name}","${c.domain || ''}","${c.industry || ''}","${c.size || ''}","${c.revenue || ''}","${c.createdAt}"\n`;
      });
    } else if (type === 'contacts') {
      csvContent += 'ID,Full Name,Email,Phone,Company,Title,Lead Score,Created At\n';
      contacts.forEach(c => {
        csvContent += `"${c.id}","${c.fullName}","${c.email}","${c.phone || ''}","${c.company}","${c.title || ''}","${c.leadScore}","${c.createdAt}"\n`;
      });
    } else if (type === 'deals') {
      csvContent += 'ID,Lead Name,Company Name,Deal Value (INR),Current Stage,Last Updated\n';
      deals.forEach(d => {
        csvContent += `"${d.id}","${d.leadName}","${d.company}",${d.valueInr},"${d.stage}","${d.updatedAt}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `salespilot_crm_${type}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logCRMActivity('Data Exported', `Exported CRM ${type} as secure CSV snapshot.`, 'pipeline');
  };

  // Row selection helpers
  const handleToggleRowSelection = (id: string) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllRows = (allIds: string[]) => {
    if (selectedRowIds.length === allIds.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(allIds);
    }
  };

  const handleBulkStageChange = () => {
    if (!bulkStage || selectedRowIds.length === 0) return;
    setDeals(prev => prev.map(d => 
      selectedRowIds.includes(d.id) ? { ...d, stage: bulkStage, updatedAt: new Date().toISOString() } : d
    ));
    logCRMActivity('Bulk Stage Shifted', `Updated ${selectedRowIds.length} deal stages to ${bulkStage}.`, 'pipeline');
    setSelectedRowIds([]);
    setBulkStage('');
  };

  const handleBulkDelete = (type: 'deals' | 'contacts' | 'companies') => {
    if (selectedRowIds.length === 0) return;
    if (type === 'deals') {
      setDeals(prev => prev.filter(d => !selectedRowIds.includes(d.id)));
    } else if (type === 'contacts') {
      setContacts(prev => prev.filter(c => !selectedRowIds.includes(c.id)));
    } else if (type === 'companies') {
      setCompanies(prev => prev.filter(c => !selectedRowIds.includes(c.id)));
    }
    logCRMActivity('Bulk Records Deleted', `Bulk erased ${selectedRowIds.length} CRM entries.`, 'pipeline');
    setSelectedRowIds([]);
  };

  // Searching & Filtering calculations
  const filteredCompanies = useMemo(() => {
    return companies.filter(co => {
      const matchSearch = co.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (co.industry && co.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (co.domain && co.domain.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTag = selectedTag === 'All' || (co.tags && co.tags.includes(selectedTag));
      return matchSearch && matchTag;
    });
  }, [companies, searchQuery, selectedTag]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(ct => {
      const matchSearch = ct.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ct.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ct.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = selectedTag === 'All' || (ct.tags && ct.tags.includes(selectedTag));
      const matchScore = selectedScore === 'All' || ct.leadScore === selectedScore;
      return matchSearch && matchTag && matchScore;
    });
  }, [contacts, searchQuery, selectedTag, selectedScore]);

  const filteredDealsList = useMemo(() => {
    return deals.filter(dl => {
      const matchSearch = dl.leadName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dl.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStage = selectedStage === 'All' || dl.stage === selectedStage;
      return matchSearch && matchStage;
    });
  }, [deals, searchQuery, selectedStage]);

  // Aggregate stats / Revenue Forecasting Calculations
  const totalPipelineValue = useMemo(() => {
    return deals.reduce((sum, d) => d.stage !== 'CLOSED_LOST' ? sum + d.valueInr : sum, 0);
  }, [deals]);

  const weightedPipelineValue = useMemo(() => {
    return deals.reduce((sum, d) => {
      const lane = LANES.find(l => l.id === d.stage);
      const weight = lane ? lane.weight : 0;
      return sum + (d.valueInr * weight);
    }, 0);
  }, [deals]);

  const closedWonRevenue = useMemo(() => {
    return deals.filter(d => d.stage === 'CLOSED_WON').reduce((sum, d) => sum + d.valueInr, 0);
  }, [deals]);

  // Forecast charts projection
  const monthlyProjectionData = useMemo(() => {
    const months = ['July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Distribute weighted deals based on some decay
    return months.map((m, idx) => {
      const factor = 1 - (idx * 0.15); // simulate decay
      const forecasted = Math.round(weightedPipelineValue * factor * 0.45);
      const target = Math.round(500000 + (idx * 150000));
      return {
        month: m,
        Forecasted: forecasted,
        Target: target,
        Won: idx === 0 ? closedWonRevenue : Math.round(closedWonRevenue * factor * 0.7)
      };
    });
  }, [weightedPipelineValue, closedWonRevenue]);

  return (
    <div id="pipeline_view" className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Real-time Status banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-blue-400">Enterprise Database Cluster</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[11px] font-mono font-medium">
                {isSupabaseActive ? '🔌 Active Supabase Connection (Synced)' : '💾 SQLite/Local Storage Offline Replica Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button 
            onClick={handleManualSync}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 font-mono text-[10px] rounded flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Database
          </button>
          
          <button 
            onClick={() => setIsImportModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 font-mono text-[10px] rounded flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            CSV Import
          </button>
        </div>
      </div>

      {/* CRM Global Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Total Weighted Forecast</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono">₹{weightedPipelineValue.toLocaleString('en-IN')}</div>
          <p className="text-[9px] text-slate-400">Risk-adjusted probability weights applied</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Closed Won Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{closedWonRevenue.toLocaleString('en-IN')}</div>
          <p className="text-[9px] text-slate-400">Successfully closed enterprise business</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Gross Pipeline Value</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono">₹{totalPipelineValue.toLocaleString('en-IN')}</div>
          <p className="text-[9px] text-slate-400">Total unweighted value in negotiation</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Sales Target Match</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold font-mono">78%</div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: '78%' }} />
            </div>
          </div>
          <p className="text-[9px] text-slate-400">Quarterly quota: ₹50,00,000 INR</p>
        </div>
      </div>

      {/* Navigation Panel */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'pipeline', label: 'Deal Pipeline', icon: Layers },
          { id: 'companies', label: 'Companies Registry', icon: Building },
          { id: 'contacts', label: 'Contacts Database', icon: Users },
          { id: 'tasks', label: 'Actionable Tasks', icon: CheckCircle2 },
          { id: 'notes', label: 'Strategic Notes', icon: FileText },
          { id: 'files', label: 'Document Vault', icon: FileUp },
          { id: 'forecast', label: 'Revenue Forecast', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setSelectedRowIds([]);
              }}
              className={`px-4 py-3 font-medium text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-850' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEARCH / FILTERS / GLOBAL BULK CONTROL BAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${activeSubTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dynamic Controls based on selected tab */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {selectedRowIds.length > 0 && (
            <div className="flex items-center gap-2 p-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg text-xs">
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 px-1.5">{selectedRowIds.length} Selected</span>
              
              {activeSubTab === 'pipeline' && (
                <select 
                  value={bulkStage}
                  onChange={(e) => setBulkStage(e.target.value as any)}
                  className="bg-white dark:bg-slate-800 border border-slate-250 text-xs rounded px-1.5 py-0.5"
                >
                  <option value="">Move Stage...</option>
                  {LANES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              )}

              {bulkStage && (
                <button 
                  onClick={handleBulkStageChange}
                  className="px-2 py-0.5 bg-blue-600 text-white font-semibold rounded text-[10px]"
                >
                  Apply
                </button>
              )}

              <button 
                onClick={() => handleBulkDelete(activeSubTab as any)}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                title="Bulk Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeSubTab === 'companies' && (
            <button 
              onClick={() => setIsAddingCompanyModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Company
            </button>
          )}

          {activeSubTab === 'contacts' && (
            <button 
              onClick={() => setIsAddingContactModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          )}

          {activeSubTab === 'tasks' && (
            <button 
              onClick={() => setIsAddingTaskModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Task
            </button>
          )}

          {activeSubTab === 'notes' && (
            <button 
              onClick={() => setIsAddingNoteModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Write Note
            </button>
          )}

          <div className="flex gap-1">
            <button 
              onClick={() => handleExportData(activeSubTab as any)}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
              title="Export registry as CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC CONTENT PANELS */}
      
      {/* 1. DEAL PIPELINE (KANBAN BOARD) */}
      {activeSubTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
          {LANES.map((lane) => {
            const laneDeals = deals.filter(d => d.stage === lane.id);
            const laneSum = laneDeals.reduce((sum, d) => sum + d.valueInr, 0);

            return (
              <div 
                key={lane.id} 
                className={`flex-1 min-w-[210px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col space-y-3 border-t-4 shadow-sm ${lane.color}`}
              >
                {/* Lane Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h3 className="text-xs font-bold leading-tight">{lane.label}</h3>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">{laneDeals.length} Deals · Weight: {lane.weight * 100}%</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                    ₹{(laneSum / 1000).toFixed(0)}k
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-3.5 min-h-[400px]">
                  {laneDeals.map((deal) => (
                    <div 
                      key={deal.id}
                      className={`p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-3.5 transition-all ${
                        movingId === deal.id ? 'opacity-50' : 'hover:border-blue-400/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{deal.leadName}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{deal.company}</div>
                        </div>
                        <input 
                          type="checkbox"
                          checked={selectedRowIds.includes(deal.id)}
                          onChange={() => handleToggleRowSelection(deal.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                          ₹{deal.valueInr.toLocaleString('en-IN')}
                        </span>
                        
                        {/* Dynamic Lead Score Indicator */}
                        <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400`}>
                          Very Hot
                        </span>
                      </div>

                      {deal.notes && (
                        <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                          {deal.notes}
                        </p>
                      )}

                      {/* Shift Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[10px] font-mono">
                        <button 
                          onClick={() => handleStageMove(deal.id, deal.stage, 'backward')}
                          disabled={lane.id === 'PROSPECTING'}
                          className="hover:text-slate-900 dark:hover:text-white disabled:opacity-20 transition px-1 py-0.5 cursor-pointer"
                        >
                          ◀ Back
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="text-slate-400 hover:text-red-500 font-mono text-[9px]"
                          title="Delete deal record"
                        >
                          Erase
                        </button>

                        <button 
                          onClick={() => handleStageMove(deal.id, deal.stage, 'forward')}
                          disabled={lane.id === 'CLOSED_LOST'}
                          className="hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-20 transition px-1 py-0.5 cursor-pointer"
                        >
                          Next ▶
                        </button>
                      </div>
                    </div>
                  ))}

                  {laneDeals.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-slate-400 font-mono bg-slate-50/10">
                      Empty Lane
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. COMPANIES REGISTRY TABLE */}
      {activeSubTab === 'companies' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <th className="py-3 px-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    checked={selectedRowIds.length === filteredCompanies.length && filteredCompanies.length > 0}
                    onChange={() => handleSelectAllRows(filteredCompanies.map(co => co.id))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                  />
                </th>
                <th className="py-3 px-4 font-bold">Company Name</th>
                <th className="py-3 px-4 font-bold">Domain</th>
                <th className="py-3 px-4 font-bold">Industry</th>
                <th className="py-3 px-4 font-bold">Size</th>
                <th className="py-3 px-4 font-bold">Annual Revenue</th>
                <th className="py-3 px-4 font-bold">Tags</th>
                <th className="py-3 px-4 font-bold text-right">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(co => (
                <tr key={co.id} className="border-b border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedRowIds.includes(co.id)}
                      onChange={() => handleToggleRowSelection(co.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                    />
                  </td>
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
                  <td className="py-3.5 px-4">{co.industry || 'Tech SaaS'}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{co.size}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-semibold">{co.revenue || '₹2.5 Crore'}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {co.tags?.map((t, i) => (
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
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    No matching company registries located.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. CONTACTS DATABASE TABLE */}
      {activeSubTab === 'contacts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <th className="py-3 px-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    checked={selectedRowIds.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={() => handleSelectAllRows(filteredContacts.map(ct => ct.id))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                  />
                </th>
                <th className="py-3 px-4 font-bold">Contact Name</th>
                <th className="py-3 px-4 font-bold">Business Email</th>
                <th className="py-3 px-4 font-bold">Associated Corporate</th>
                <th className="py-3 px-4 font-bold">Job Title</th>
                <th className="py-3 px-4 font-bold">Lead Score</th>
                <th className="py-3 px-4 font-bold">Tags</th>
                <th className="py-3 px-4 font-bold text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(ct => (
                <tr key={ct.id} className="border-b border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedRowIds.includes(ct.id)}
                      onChange={() => handleToggleRowSelection(ct.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                    />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      {ct.fullName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{ct.email}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">{ct.company}</td>
                  <td className="py-3.5 px-4 text-slate-500">{ct.title || 'Executive Decision Maker'}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      ct.leadScore === 'Very Hot' ? 'bg-red-50 text-red-600 border border-red-200' :
                      ct.leadScore === 'Hot' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                      ct.leadScore === 'Warm' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {ct.leadScore}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {ct.tags?.map((t, i) => (
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
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    No matching contacts detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. ACTIONABLE TASKS LIST */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => handleToggleTask(t.id)}
                    className="mt-1 text-slate-400 hover:text-blue-600 cursor-pointer transition"
                  >
                    {t.status === 'COMPLETED' ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <h4 className={`text-sm font-bold ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 items-center mt-2 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {t.associatedTo}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {t.dueDate}
                      </span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.2 rounded font-semibold ${
                        t.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                        t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleDeleteTask(t.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition cursor-pointer"
                  title="Remove task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-mono">
                Excellent! All tasks across CRM have been fully checked off.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. NOTES & CRM TIMELINE VIEW */}
      {activeSubTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Notes Workspace */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400">Strategic CRM Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(n => (
                <div key={n.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-4 hover:shadow transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{n.title}</h4>
                      <button 
                        onClick={() => handleDeleteNote(n.id)}
                        className="text-slate-300 hover:text-red-500 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line">{n.text}</p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {n.associatedTo}
                    </span>
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline logs */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400">Activity Timeline</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-5">
              <div className="relative border-l border-slate-150 dark:border-slate-800 pl-4 ml-2.5 space-y-6">
                {activities.map(act => (
                  <div key={act.id} className="relative">
                    <span className="absolute -left-[25px] top-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center shadow-sm" />
                    
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">{act.text}</span>
                      <span className="block text-[11px] text-slate-500 mt-1 leading-relaxed">{act.details}</span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3" />
                        {act.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DOCUMENT STORAGE VAULT */}
      {activeSubTab === 'files' && (
        <div className="space-y-6">
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-350 dark:border-slate-800 hover:border-blue-500 rounded-xl p-8 bg-white dark:bg-slate-900/50 text-center space-y-3 cursor-pointer transition-all hover:bg-slate-50/50"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <FileUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop files here, or click to upload</p>
              <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, CSV or Images (Max 20MB limit)</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Document Vault ({files.length} attachments)</h3>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {files.map(f => (
                <div key={f.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 flex items-center justify-center font-bold text-[10px]">
                      PDF
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">{f.name}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                        <span>Size: {f.size}</span>
                        <span>•</span>
                        <span>Associated: {f.associatedTo}</span>
                        <span>•</span>
                        <span>Uploaded: {new Date(f.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => alert('Secure file download successfully initiated.')}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Download document file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteFile(f.id)}
                      className="p-1.5 bg-slate-50 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                      title="Delete document"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {files.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-mono">
                  No attachments saved to enterprise pipeline storage vault.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. PREDICTIVE REVENUE & FORECASTING */}
      {activeSubTab === 'forecast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Area Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Risk-Adjusted Outbound Forecast</h3>
                <p className="text-[11px] text-slate-500 mt-1">Predictive sales forecasting comparing weighted target projections with actual achievements in INR.</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyProjectionData}>
                    <defs>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Legend />
                    <Area type="monotone" dataKey="Forecasted" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
                    <Area type="monotone" dataKey="Target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTarget)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Deal Stage Probability break up */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Risk Probabilities</h3>
                <p className="text-[11px] text-slate-500 mt-1">SaaS standard pipeline stage risk weighting parameters.</p>
              </div>

              <div className="space-y-3.5 my-4">
                {LANES.map(lane => (
                  <div key={lane.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{lane.label}</span>
                      <span className="font-mono text-slate-500 font-bold">{lane.weight * 100}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${lane.weight * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 leading-normal leading-relaxed">
                * Based on verified outbound benchmark metrics. To override specific stage probability factors, please consult the CRM master config.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ALL POPUP MODALS ==================== */}

      {/* A. CSV IMPORT MODAL */}
      {isImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">Secure CSV Import Node</h3>
              <button onClick={() => setIsImportModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Target Registry Module</label>
                <div className="flex gap-2">
                  {['contacts', 'companies', 'deals'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setImportType(t as any)}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold capitalize border transition cursor-pointer ${
                        importType === t 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Paste CSV raw data</label>
                <textarea 
                  rows={6}
                  placeholder={
                    importType === 'contacts' ? "name, email, company, title\nSoham, soham@horizon.in, Horizon Media, CEO\nPreeti Sen, preeti@sen.com, Sen Consulting, Founder" :
                    importType === 'companies' ? "company, website, industry, size\nHorizon Media, horizon.in, Media, 11-50 employees" :
                    "contact, company, value, stage\nSoham, Horizon Media, 85000, QUALIFIED"
                  }
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Process Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. ADD COMPANY MODAL */}
      {isAddingCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">Add Company Registry</h3>
              <button onClick={() => setIsAddingCompanyModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddCompanySubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Company Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Acme Corporation"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Corporate Domain</label>
                  <input 
                    type="text" 
                    placeholder="acme.co"
                    value={newCompanyDomain}
                    onChange={(e) => setNewCompanyDomain(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Industry</label>
                  <input 
                    type="text" 
                    placeholder="SaaS / WebDev"
                    value={newCompanyIndustry}
                    onChange={(e) => setNewCompanyIndustry(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Company Size</label>
                  <select 
                    value={newCompanySize}
                    onChange={(e) => setNewCompanySize(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded dark:bg-slate-850"
                  >
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201+ employees</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Tags (comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="Hot, Enterprise"
                    value={newCompanyTags}
                    onChange={(e) => setNewCompanyTags(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingCompanyModal(false)}
                  className="px-4 py-2 text-xs font-semibold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer"
                >
                  Save Registry Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. ADD CONTACT MODAL */}
      {isAddingContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">Add Contact Database</h3>
              <button onClick={() => setIsAddingContactModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Contact Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Vikram Rao"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Business Email</label>
                  <input 
                    type="email" 
                    placeholder="vikram@company.co"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="+91 99999 99999"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Associated Corporate</label>
                  <input 
                    type="text" 
                    placeholder="Acme Corporation"
                    value={newContactCompany}
                    onChange={(e) => setNewContactCompany(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. VP Sales"
                    value={newContactTitle}
                    onChange={(e) => setNewContactTitle(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Lead Score Vibe</label>
                  <select 
                    value={newContactScore}
                    onChange={(e) => setNewContactScore(e.target.value as any)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded dark:bg-slate-850"
                  >
                    <option>Cold</option>
                    <option>Warm</option>
                    <option>Hot</option>
                    <option>Very Hot</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Tags</label>
                  <input 
                    type="text" 
                    placeholder="Decision Maker"
                    value={newContactTags}
                    onChange={(e) => setNewContactTags(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingContactModal(false)}
                  className="px-4 py-2 text-xs font-semibold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer"
                >
                  Save Contact Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. ADD TASK MODAL */}
      {isAddingTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">Log Actionable Task</h3>
              <button onClick={() => setIsAddingTaskModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddTaskSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Task Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Schedule deep-dive proposal demo"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Description Details</label>
                <textarea 
                  rows={2}
                  placeholder="Details of what needs to happen..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Priority Rating</label>
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded dark:bg-slate-850"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-500 uppercase">Due Date</label>
                  <input 
                    type="date" 
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded dark:bg-slate-850"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Associated Enterprise Corp</label>
                <input 
                  type="text" 
                  placeholder="e.g. Apex Marketing Solutions"
                  value={newTaskAssoc}
                  onChange={(e) => setNewTaskAssoc(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer"
                >
                  Create Task Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. WRITE NOTE MODAL */}
      {isAddingNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">Write Notebook entry</h3>
              <button onClick={() => setIsAddingNoteModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddNoteSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Note Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Call feedback, competitor update"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Strategic Note body</label>
                <textarea 
                  rows={4}
                  placeholder="Scribble down raw notes..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase">Associate Client</label>
                <input 
                  type="text" 
                  placeholder="Apex Marketing Solutions"
                  value={newNoteAssoc}
                  onChange={(e) => setNewNoteAssoc(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-850"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingNoteModal(false)}
                  className="px-4 py-2 text-xs font-semibold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
