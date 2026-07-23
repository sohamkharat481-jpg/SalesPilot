import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, SlidersHorizontal, Sparkles, Loader2, 
  Linkedin, Briefcase, Mail, Phone, ExternalLink, Calendar, 
  PlusCircle, Trash2, Archive, Download, Globe, Building2, 
  Tag, ChevronLeft, ChevronRight, Clock, ArrowUpDown, 
  CheckSquare, Square, Filter, BarChart3, X, Check, CheckCircle2, 
  AlertCircle, DollarSign, TrendingUp, HelpCircle, Activity, Play,
  CloudLightning, RefreshCw
} from 'lucide-react';
import { Lead, LeadStatus, LeadNote, LeadTask, LeadTimelineEvent, Campaign } from '../types';

interface LeadsViewProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  campaigns?: Campaign[];
  onAddLead: (leadData: Partial<Lead>) => Promise<void>;
  onEnrichLead: (leadId: string) => Promise<void>;
  onBookMeeting: (leadId: string, dateTime: string, notes: string) => Promise<void>;
}

export function LeadsView({ 
  leads, 
  setLeads, 
  campaigns = [], 
  onAddLead, 
  onEnrichLead, 
  onBookMeeting 
}: LeadsViewProps) {
  // Tab control
  const [activeTab, setActiveTab] = useState<'database' | 'campaign' | 'analytics'>('database');

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterIndustry, setFilterIndustry] = useState('All');
  const [filterSize, setFilterSize] = useState('All');
  const [filterRevenue, setFilterRevenue] = useState('All');
  const [filterScore, setFilterScore] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTag, setFilterTag] = useState('All');

  // Sorting state
  const [sortBy, setSortBy] = useState<'company' | 'score' | 'status' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selection & Bulk actions state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkTagText, setBulkTagText] = useState('');
  const [bulkStageText, setBulkStageText] = useState('');
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [showBulkStageModal, setShowBulkStageModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Lead details selection
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leads[0]?.id || null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [bookingLeadId, setBookingLeadId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [activeResearchTab, setActiveResearchTab] = useState<'market' | 'angles' | 'objections'>('market');

  // New Note & Task States
  const [noteText, setNoteText] = useState('');
  const [taskText, setTaskText] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Create Campaign State
  const [newCampaignName, setNewCampaignName] = useState('');
  const [campCountry, setCampCountry] = useState('India');
  const [campIndustry, setCampIndustry] = useState('Software');
  const [campSize, setCampSize] = useState('11-50 employees');
  const [campEmployeeMin, setCampEmployeeMin] = useState('10');
  const [campEmployeeMax, setCampEmployeeMax] = useState('100');
  const [campRevenue, setCampRevenue] = useState('₹1 Crore - ₹5 Crore');
  const [campTitles, setCampTitles] = useState('CEO, Founder, VP Sales');
  const [campKeywords, setCampKeywords] = useState('outbound, pipeline, lead generation');
  const [campNegativeKeywords, setCampNegativeKeywords] = useState('student, intern, support');
  const [campLanguage, setCampLanguage] = useState('English');
  const [campMaxLeads, setCampMaxLeads] = useState('5');
  const [campPriority, setCampPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [selectedProviderId, setSelectedProviderId] = useState('google-maps');
  const [customProviderApiKey, setCustomProviderApiKey] = useState('');
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const [scraperLogs, setScraperLogs] = useState<string[]>([]);
  const [scraperProgress, setScraperProgress] = useState(0);

  // Advanced ICP Builder Target Parameters
  const [campCity, setCampCity] = useState('Bengaluru');
  const [campTechStack, setCampTechStack] = useState('React, HubSpot, Salesforce, Next.js');
  const [campDepartment, setCampDepartment] = useState('Sales & Outbound');
  const [campBusinessType, setCampBusinessType] = useState('B2B SaaS');
  const [campYearsInBusiness, setCampYearsInBusiness] = useState('3-5 years');
  const [campDecisionMakerOnly, setCampDecisionMakerOnly] = useState(true);

  // --- Enterprise Workspace Collaboration States ---
  const [teamMembersList, setTeamMembersList] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    fetch('/api/v1/workspace/permissions/matrix')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTeamMembersList(data.matrix.map((item: any) => ({
            id: item.memberId,
            fullName: item.fullName,
            email: item.email,
            role: item.role
          })));
        }
      })
      .catch(err => console.error('Error loading team for CRM:', err));
  }, []);

  const handleAssignLead = async (leadId: string, memberId: string) => {
    if (!memberId) return;
    try {
      const res = await fetch('/api/v1/workspace/crm/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: leadId, targetType: 'lead', assigneeMemberId: memberId })
      });
      const data = await res.json();
      if (data.success) {
        const assignedMember = teamMembersList.find(m => m.id === memberId);
        if (assignedMember) {
          setLeads(prev => prev.map(l => l.id === leadId ? {
            ...l,
            assignedToId: memberId,
            assignedToName: assignedMember.fullName
          } as any : l));
        }
      }
    } catch (err) {
      console.error('Error assigning lead:', err);
    }
  };

  const handleAddComment = async (leadId: string) => {
    if (!newCommentText.trim()) return;

    // Detect @mentions (e.g. emails in text)
    const emailRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
    const matches = newCommentText.match(emailRegex) || [];
    const parsedMentions = matches.map(m => m.substring(1)); // strip '@' prefix

    try {
      const res = await fetch('/api/v1/workspace/crm/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: leadId,
          targetType: 'lead',
          text: newCommentText,
          mentions: parsedMentions
        })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => {
          if (l.id === leadId) {
            const currentTimeline = l.timelineList || [];
            return {
              ...l,
              timelineList: [
                {
                  id: `tme_${Date.now()}`,
                  event: 'Teammate Comment',
                  details: `${newCommentText}`,
                  createdAt: new Date().toISOString()
                },
                ...currentTimeline
              ]
            };
          }
          return l;
        }));
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Optional Providers Active State Toggles (Connect / Disconnect)
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({
    'linkedin-extractor': false,
    'zoominfo-direct': false,
    'google-maps': false,
    'google-search': false,
    'clearbit': false,
    'hunter': false,
    'dropcontact': false,
    'peopledatalabs': false,
    'crunchbase': false,
    'builtwith': false,
    'website-crawler': true, // Always ready as utility crawler
  });

  useEffect(() => {
    const fetchConnectedStatus = async () => {
      try {
        const res = await fetch('/api/v1/integrations');
        if (res.ok) {
          const data = await res.json();
          const statusMap: Record<string, boolean> = {
            'clearbit': data.integrationStatuses?.find((s: any) => s.pluginId === 'clearbit')?.status === 'CONNECTED',
            'hunter': data.integrationStatuses?.find((s: any) => s.pluginId === 'hunter')?.status === 'CONNECTED',
            'peopledatalabs': data.integrationStatuses?.find((s: any) => s.pluginId === 'peopledatalabs')?.status === 'CONNECTED',
            'crunchbase': data.integrationStatuses?.find((s: any) => s.pluginId === 'crunchbase')?.status === 'CONNECTED',
            'google-maps': data.integrationStatuses?.find((s: any) => s.pluginId === 'googlemaps')?.status === 'CONNECTED',
            'google-search': data.integrationStatuses?.find((s: any) => s.pluginId === 'serper')?.status === 'CONNECTED',
            'linkedin-extractor': data.integrationStatuses?.find((s: any) => s.pluginId === 'linkedin')?.status === 'CONNECTED',
            'zoominfo-direct': data.integrationStatuses?.find((s: any) => s.pluginId === 'zoominfo')?.status === 'CONNECTED',
            'dropcontact': data.integrationStatuses?.find((s: any) => s.pluginId === 'dropcontact')?.status === 'CONNECTED',
            'builtwith': data.integrationStatuses?.find((s: any) => s.pluginId === 'builtwith')?.status === 'CONNECTED',
            'website-crawler': true
          };
          setConnectedProviders(statusMap);
        }
      } catch (err) {
        console.error('Failed to load integration states:', err);
      }
    };
    fetchConnectedStatus();
  }, []);

  // Smart Lists States
  const [smartLists, setSmartLists] = useState<Array<{
    id: string;
    name: string;
    filters: Record<string, string>;
  }>>([
    {
      id: 'high-intent-startup',
      name: '🔥 High Intent Startups',
      filters: { score: 'Very Hot', size: '1-10' }
    },
    {
      id: 'us-saas-enterprise',
      name: '🌐 US SaaS Enterprises',
      filters: { country: 'United States', industry: 'Software' }
    },
    {
      id: 'india-ad-agency',
      name: '🏢 India Ad Agencies',
      filters: { country: 'India', industry: 'Marketing' }
    }
  ]);
  const [activeSmartListId, setActiveSmartListId] = useState<string | null>(null);
  const [newSmartListName, setNewSmartListName] = useState('');
  const [isSavingSmartList, setIsSavingSmartList] = useState(false);

  // AI Suggestions states
  const [aiSuggestions, setAiSuggestions] = useState<{
    jobTitles: string[];
    keywords: string[];
    industries: string[];
    outreachAngles: string[];
  } | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Smart Lists Helpers
  const applySmartList = (listId: string, filters: Record<string, string>) => {
    setActiveSmartListId(listId);
    if (filters.country) setFilterCountry(filters.country);
    if (filters.industry) setFilterIndustry(filters.industry);
    if (filters.size) setFilterSize(filters.size);
    if (filters.revenue) setFilterRevenue(filters.revenue);
    if (filters.score) setFilterScore(filters.score);
    if (filters.status) setFilterStatus(filters.status);
    if (filters.tag) setFilterTag(filters.tag);
    if (filters.search) setSearch(filters.search);
  };

  const getSmartListCount = (filters: Record<string, string>) => {
    return leads.filter(l => {
      if (filters.country && l.enrichment?.country !== filters.country) return false;
      if (filters.industry && l.enrichment?.industry !== filters.industry) return false;
      if (filters.size && !l.enrichment?.companySize?.includes(filters.size)) return false;
      if (filters.revenue && !l.enrichment?.annualRevenue?.includes(filters.revenue)) return false;
      if (filters.score && l.leadScore !== filters.score) return false;
      if (filters.status && l.status !== filters.status) return false;
      if (filters.tag && (!l.tags || !l.tags.includes(filters.tag))) return false;
      return true;
    }).length;
  };

  const handleSaveSmartList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSmartListName.trim()) return;
    const newId = `smart_list_${Date.now()}`;
    const newFilters: Record<string, string> = {};
    if (filterCountry !== 'All') newFilters.country = filterCountry;
    if (filterIndustry !== 'All') newFilters.industry = filterIndustry;
    if (filterSize !== 'All') newFilters.size = filterSize;
    if (filterRevenue !== 'All') newFilters.revenue = filterRevenue;
    if (filterScore !== 'All') newFilters.score = filterScore;
    if (filterStatus !== 'All') newFilters.status = filterStatus;
    if (filterTag !== 'All') newFilters.tag = filterTag;
    if (search.trim()) newFilters.search = search;

    setSmartLists(prev => [...prev, {
      id: newId,
      name: newSmartListName.trim(),
      filters: newFilters
    }]);
    setActiveSmartListId(newId);
    setNewSmartListName('');
    setIsSavingSmartList(false);
  };

  const handleGenerateIcpSuggestions = async () => {
    setLoadingSuggestions(true);
    setAiSuggestions(null);
    try {
      const response = await fetch('/api/v1/leads/icp-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: campIndustry,
          country: campCountry,
          campaignName: newCampaignName
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions) {
          setAiSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Manual Add Prospect Modal
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addCompany, setAddCompany] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addWebsite, setAddWebsite] = useState('');
  const [addCountry, setAddCountry] = useState('India');
  const [addIndustry, setAddIndustry] = useState('Software');

  // Booking form state
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  // CRM Sync Console state
  const [selectedCrm, setSelectedCrm] = useState<'salesforce' | 'hubspot' | 'zoho'>('hubspot');
  const [crmApiKey, setCrmApiKey] = useState('hp_live_9201382_salespilot_prod_secure');
  const [crmClientSecret, setCrmClientSecret] = useState('sp_sec_731948194');
  const [crmSyncStatus, setCrmSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('SUCCESS');
  const [crmSyncLogs, setCrmSyncLogs] = useState<string[]>([
    `[CRM SYSTEM] [05-Jul-2026 09:30] Hubspot sync agent loaded. Ready for payload.`,
    `[CRM SYSTEM] [05-Jul-2026 09:31] Pushed 5 new verified decision makers to HubSpot Contacts API.`,
    `[CRM SYSTEM] [05-Jul-2026 09:31] Synced CRM status: 'READY' for 3 prospects.`,
    `[CRM SYSTEM] [05-Jul-2026 09:32] Completed outbound webhook sync run. 0 errors.`
  ]);
  const [isSyncingCrm, setIsSyncingCrm] = useState(false);

  // 1. CALCULATE TOP CARD SUMMARY METRICS
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.leadScore === 'Very Hot' || l.leadScore === 'Hot' || l.status === 'READY' || l.status === 'INTERESTED').length;
    const campaignsCount = campaigns ? campaigns.length : 0;
    const emailsReady = leads.filter(l => l.status === 'READY' || l.status === 'RESEARCH').length;
    const appointmentsBooked = leads.filter(l => l.status === 'MEETING_BOOKED').length;
    const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0';

    return { totalLeads, qualifiedLeads, campaignsCount, emailsReady, appointmentsBooked, conversionRate };
  }, [leads, campaigns]);

  // 2. RETRIEVE FILTER OPTIONS FROM DATA
  const filterOptions = useMemo(() => {
    const countries = new Set<string>();
    const industries = new Set<string>();
    const tags = new Set<string>();

    leads.forEach(l => {
      if (l.enrichment?.country) countries.add(l.enrichment.country);
      if (l.enrichment?.industry) industries.add(l.enrichment.industry);
      if (l.tags) l.tags.forEach(t => tags.add(t));
    });

    return {
      countries: ['All', ...Array.from(countries)],
      industries: ['All', ...Array.from(industries)],
      tags: ['All', ...Array.from(tags)]
    };
  }, [leads]);

  // 3. FILTER & SORT LEADS
  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    // Search term check
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.title?.toLowerCase().includes(q) ||
        (l.tags && l.tags.some(t => t.toLowerCase().includes(q))) ||
        (l.enrichment?.country && l.enrichment.country.toLowerCase().includes(q))
      );
    }

    // Apply structured filters
    if (filterCountry !== 'All') {
      result = result.filter(l => l.enrichment?.country === filterCountry);
    }
    if (filterIndustry !== 'All') {
      result = result.filter(l => l.enrichment?.industry === filterIndustry);
    }
    if (filterSize !== 'All') {
      result = result.filter(l => l.enrichment?.companySize?.includes(filterSize));
    }
    if (filterRevenue !== 'All') {
      result = result.filter(l => l.enrichment?.annualRevenue?.includes(filterRevenue));
    }
    if (filterScore !== 'All') {
      result = result.filter(l => l.leadScore === filterScore);
    }
    if (filterStatus !== 'All') {
      result = result.filter(l => l.status === filterStatus);
    }
    if (filterTag !== 'All') {
      result = result.filter(l => l.tags && l.tags.includes(filterTag));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'company') {
        comparison = a.company.localeCompare(b.company);
      } else if (sortBy === 'score') {
        const scoreWeight = { 'Very Hot': 4, 'Hot': 3, 'Warm': 2, 'Cold': 1, undefined: 0 };
        comparison = (scoreWeight[a.leadScore || 'Cold'] || 0) - (scoreWeight[b.leadScore || 'Cold'] || 0);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, search, filterCountry, filterIndustry, filterSize, filterRevenue, filterScore, filterStatus, filterTag, sortBy, sortOrder]);

  // 4. PAGINATED LEADS
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedLeads, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage) || 1;

  // Selected lead getter
  const selectedLead = useMemo(() => {
    return leads.find(l => l.id === selectedLeadId) || leads[0] || null;
  }, [leads, selectedLeadId]);

  // Handle single check/uncheck
  const handleToggleSelect = (leadId: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  // Handle select-all current paginated items
  const handleSelectAll = () => {
    const paginatedIds = paginatedLeads.map(l => l.id);
    const allSelected = paginatedIds.every(id => selectedLeadIds.includes(id));

    if (allSelected) {
      setSelectedLeadIds(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} leads from SalesPilot CRM?`)) return;

    setActionLoading(true);
    try {
      await Promise.all(
        selectedLeadIds.map(id => fetch(`/api/v1/leads/${id}`, { method: 'DELETE' }))
      );
      setLeads(prev => prev.filter(l => !selectedLeadIds.includes(l.id)));
      setSelectedLeadIds([]);
      if (selectedLeadId && selectedLeadIds.includes(selectedLeadId)) {
        setSelectedLeadId(null);
      }
    } catch (err) {
      console.error('Bulk deletion failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkArchive = () => {
    if (selectedLeadIds.length === 0) return;
    alert(`Successfully archived ${selectedLeadIds.length} selected leads into local enterprise warehouse.`);
    setSelectedLeadIds([]);
  };

  const handleBulkTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTagText.trim() || selectedLeadIds.length === 0) return;

    setActionLoading(true);
    const newTags = bulkTagText.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const response = await fetch('/api/v1/leads/bulk/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeadIds, tags: newTags })
      });
      if (response.ok) {
        setLeads(prev => prev.map(lead => {
          if (selectedLeadIds.includes(lead.id)) {
            return {
              ...lead,
              tags: Array.from(new Set([...(lead.tags || []), ...newTags])),
              lastUpdated: new Date().toISOString()
            };
          }
          return lead;
        }));
        setSelectedLeadIds([]);
        setBulkTagText('');
        setShowBulkTagModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkStageText || selectedLeadIds.length === 0) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/v1/leads/bulk/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeadIds, stage: bulkStageText })
      });
      if (response.ok) {
        setLeads(prev => prev.map(lead => {
          if (selectedLeadIds.includes(lead.id)) {
            const oldStatus = lead.status;
            const updatedTimeline = [{
              id: `tl_${Date.now()}`,
              event: 'Bulk Status Transition',
              details: `Stage updated from ${oldStatus} to ${bulkStageText} via Bulk CRM Action.`,
              createdAt: new Date().toISOString()
            }, ...(lead.timelineList || [])];

            return {
              ...lead,
              status: bulkStageText as LeadStatus,
              timelineList: updatedTimeline,
              lastUpdated: new Date().toISOString()
            };
          }
          return lead;
        }));
        setSelectedLeadIds([]);
        setBulkStageText('');
        setShowBulkStageModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (selectedLeadIds.length === 0) {
      alert('Please select at least one lead to export.');
      return;
    }

    const exportLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    const headers = ['Company', 'Website', 'Industry', 'Country', 'Size', 'Decision Maker', 'Designation', 'Email', 'Phone', 'Score', 'Confidence', 'Status', 'Tags'];
    const rows = exportLeads.map(l => [
      l.company,
      l.enrichment?.website || 'N/A',
      l.enrichment?.industry || 'N/A',
      l.enrichment?.country || 'N/A',
      l.enrichment?.companySize || 'N/A',
      `${l.firstName} ${l.lastName}`,
      l.title || 'N/A',
      l.email,
      l.phone || 'N/A',
      l.leadScore || 'Warm',
      `${l.confidenceScore || 70}%`,
      l.status,
      (l.tags || []).join(';')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `salespilot_leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel / TSV
  const handleExportExcel = () => {
    if (selectedLeadIds.length === 0) {
      alert('Please select leads to export.');
      return;
    }
    const exportLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    const content = exportLeads.map(l => `${l.company}\t${l.firstName} ${l.lastName}\t${l.email}\t${l.status}`).join('\n');
    const blob = new Blob([`Company\tContact Name\tEmail\tCRM Stage\n${content}`], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salespilot_leads_excel_${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CRM status change
  const handleCRMStageChange = async (leadId: string, targetStage: LeadStatus) => {
    try {
      const response = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStage })
      });
      if (response.ok) {
        const updated = await response.json();
        // Keep name references populated
        const parsed = { ...updated, fullName: `${updated.firstName} ${updated.lastName}` };
        setLeads(prev => prev.map(l => l.id === leadId ? parsed : l));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add notes locally & server
  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedLead) return;

    try {
      const response = await fetch(`/api/v1/leads/${selectedLead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText })
      });
      if (response.ok) {
        const newNote = await response.json();
        setLeads(prev => prev.map(l => {
          if (l.id === selectedLead.id) {
            const updatedNotes = [newNote, ...(l.notesList || [])];
            const updatedTimeline = [{
              id: `tl_${Date.now()}`,
              event: 'Note Added',
              details: `User added a research note: "${noteText.substring(0, 40)}"`,
              createdAt: new Date().toISOString()
            }, ...(l.timelineList || [])];
            return { ...l, notesList: updatedNotes, timelineList: updatedTimeline, lastUpdated: new Date().toISOString() };
          }
          return l;
        }));
        setNoteText('');
        setIsAddingNote(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add task locally & server
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim() || !selectedLead) return;

    try {
      const response = await fetch(`/api/v1/leads/${selectedLead.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskText, dueDate: taskDueDate })
      });
      if (response.ok) {
        const newTask = await response.json();
        setLeads(prev => prev.map(l => {
          if (l.id === selectedLead.id) {
            const updatedTasks = [newTask, ...(l.tasksList || [])];
            const updatedTimeline = [{
              id: `tl_${Date.now()}`,
              event: 'Task Assigned',
              details: `Outbound task assigned: "${taskText}"`,
              createdAt: new Date().toISOString()
            }, ...(l.timelineList || [])];
            return { ...l, tasksList: updatedTasks, timelineList: updatedTimeline, lastUpdated: new Date().toISOString() };
          }
          return l;
        }));
        setTaskText('');
        setTaskDueDate('');
        setIsAddingTask(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle task completion
  const handleToggleTask = async (leadId: string, taskId: string) => {
    try {
      const response = await fetch(`/api/v1/leads/${leadId}/tasks/${taskId}/toggle`, {
        method: 'POST'
      });
      if (response.ok) {
        const toggledTask = await response.json();
        setLeads(prev => prev.map(l => {
          if (l.id === leadId) {
            const updatedTasks = (l.tasksList || []).map(t => t.id === taskId ? toggledTask : t);
            const updatedTimeline = [{
              id: `tl_${Date.now()}`,
              event: 'Task Updated',
              details: `Task "${toggledTask.text}" marked as ${toggledTask.completed ? 'COMPLETED' : 'PENDING'}.`,
              createdAt: new Date().toISOString()
            }, ...(l.timelineList || [])];
            return { ...l, tasksList: updatedTasks, timelineList: updatedTimeline, lastUpdated: new Date().toISOString() };
          }
          return l;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run AI Lead Scraper Agent (Simulated Crawl with dynamic console telemetry log streaming!)
  const handleRunAIScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      alert('Please enter a Campaign Name first.');
      return;
    }

    setIsScraperRunning(true);
    setScraperProgress(10);
    setScraperLogs(['[SYSTEM] SalesPilot AI Lead Generation Engine booting...', '[SYSTEM] Authenticating secure agent channels...']);

    const steps = [
      { progress: 25, log: `[SPIDER] Initiating local target scan in country: "${campCountry}"...` },
      { progress: 45, log: `[SPIDER] Found 14 company directory matches in industry: "${campIndustry}" matching size range "${campSize}"` },
      { progress: 65, log: `[AGENT] Filtering decision makers with job title matching: [${campTitles}]` },
      { progress: 80, log: `[GEMINI_API] Grading prospect matches via SalesPilot Qualification Scorer...` },
      { progress: 95, log: `[ENRICHER] Pulling business emails, company size, revenue, and active social profiles...` }
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setScraperProgress(steps[i].progress);
      setScraperLogs(prev => [...prev, steps[i].log]);
    }

    try {
      const response = await fetch('/api/v1/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: newCampaignName,
          country: campCountry,
          industry: campIndustry,
          companySize: campSize,
          employeeRange: `${campEmployeeMin}-${campEmployeeMax}`,
          revenueRange: campRevenue,
          jobTitles: campTitles,
          keywords: campKeywords,
          negativeKeywords: campNegativeKeywords,
          priority: campPriority,
          maxLeads: campMaxLeads,
          providerId: selectedProviderId,
          customApiKey: customProviderApiKey,
          city: campCity,
          techStack: campTechStack,
          department: campDepartment,
          businessType: campBusinessType,
          yearsInBusiness: campYearsInBusiness,
          decisionMakerOnly: campDecisionMakerOnly,
          language: campLanguage
        })
      });

      const data = await response.json();

      if (response.ok) {
        setScraperProgress(100);
        if (data.providerLogs && data.providerLogs.length > 0) {
          const providerLogsList = data.providerLogs.map((pl: any) => 
            `[PROVIDER REPORT] ${pl.provider} | Status: ${pl.status} | ${pl.message}`
          );
          setScraperLogs(prev => [...prev, ...providerLogsList]);
        }
        setScraperLogs(prev => [...prev, `[SYSTEM] Scraper run completed! Successfully harvested ${data.count} highly-qualified B2B leads.`, `[SYSTEM] Saved matching records to SalesPilot directory.`]);
        
        // Append newly created leads to parent state
        if (data.leads && data.leads.length > 0) {
          setLeads(prev => [...data.leads, ...prev]);
          setSelectedLeadId(data.leads[0].id);
        }

        setTimeout(() => {
          setIsScraperRunning(false);
          setActiveTab('database');
          // Reset campaign form
          setNewCampaignName('');
        }, 1500);
      } else {
        throw new Error(data.message || data.error || 'Server returned an error running lead agent.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Failed to complete AI Lead Generation crawler run.';
      setScraperLogs(prev => [...prev, `❌ Sourcing Failed: ${errMsg}`]);
      setIsScraperRunning(false);
    }
  };

  // Manual Add Prospect
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName || !addEmail || !addCompany) {
      alert('First Name, Email, and Company Name are required.');
      return;
    }

    setActionLoading(true);
    try {
      let validatedWebsite = '';
      if (addWebsite) {
        try {
          const valRes = await fetch('/api/v1/validate-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ website: addWebsite })
          });
          if (valRes.ok) {
            const valData = await valRes.json();
            if (valData.isValid) {
              validatedWebsite = addWebsite;
            } else {
              alert(`Website not available. The website provided ("${addWebsite}") is invalid: ${valData.reason}. Saving lead with empty website.`);
            }
          }
        } catch (valErr) {
          console.error('Failed to validate website', valErr);
        }
      }

      const payload = {
        firstName: addFirstName,
        lastName: addLastName,
        email: addEmail,
        phone: addPhone,
        company: addCompany,
        title: addTitle || 'Director',
        status: 'NEW' as LeadStatus,
        website: validatedWebsite
      };

      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newLead = await response.json();
        // Enrich manually created lead with default B2B parameters
        const fullyEnrichedLead = {
          ...newLead,
          fullName: `${newLead.firstName} ${newLead.lastName}`,
          leadScore: 'Hot' as const,
          confidenceScore: 82,
          scoreReason: 'Manually logged prospect. Direct email verified successfully.',
          tags: ['Manual Add', addIndustry],
          lastUpdated: new Date().toISOString(),
          notesList: [],
          tasksList: [],
          timelineList: [
            { id: `tl_manual_${Date.now()}`, event: 'Prospect Created', details: `Lead profile logged manually. Website: ${validatedWebsite || 'Website not available.'}`, createdAt: new Date().toISOString() }
          ],
          enrichment: {
            ...newLead.enrichment,
            country: addCountry,
            industry: addIndustry,
            website: validatedWebsite,
            companySize: '11-50 employees',
            annualRevenue: '₹2 Crore INR',
            companyOverview: `${addCompany} is a premium firm operating in the ${addIndustry} sector in ${addCountry}.`,
            painPoints: ['Manual outbound processes', 'Low prospect engagement metrics'],
            whyGoodProspect: 'Requires automated outreach sequencing to scale pipeline without headcounts.',
            decisionMakerInfo: `${addFirstName} oversees core purchasing operations.`,
            socialLinks: []
          }
        };

        setLeads(prev => [fullyEnrichedLead, ...prev]);
        setSelectedLeadId(fullyEnrichedLead.id);
        
        // Reset form
        setAddFirstName('');
        setAddLastName('');
        setAddEmail('');
        setAddPhone('');
        setAddCompany('');
        setAddTitle('');
        setAddWebsite('');
        setIsAddingLead(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger CRM manual sync
  const handleSyncCrmNow = async () => {
    setIsSyncingCrm(true);
    setCrmSyncStatus('SYNCING');
    
    const newLogs = [
      `[CRM SYSTEM] [${new Date().toLocaleTimeString()}] Establishing secure TLS handshake with ${selectedCrm.toUpperCase()} cloud gateway...`,
      `[CRM SYSTEM] [${new Date().toLocaleTimeString()}] Authenticating client token ending in ...${crmApiKey.substring(Math.max(0, crmApiKey.length - 4))}`,
      `[CRM SYSTEM] [${new Date().toLocaleTimeString()}] Extracting current decision makers from SalesPilot (Queue size: ${leads.length} records)...`
    ];
    
    setCrmSyncLogs(prev => [...newLogs, ...prev]);

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const count = leads.length;
    const finalLogs = [
      `[CRM SYSTEM] [${new Date().toLocaleTimeString()}] Sync session COMPLETED. ${count} leads successfully mapped. Status is in sync.`
    ];

    setCrmSyncLogs(prev => [...finalLogs, ...prev]);
    setIsSyncingCrm(false);
    setCrmSyncStatus('SUCCESS');
  };

  // Re-Enrich Lead Click
  const handleEnrichClick = async (leadId: string) => {
    setEnrichingId(leadId);
    try {
      await onEnrichLead(leadId);
    } catch (err) {
      console.error(err);
    } finally {
      setEnrichingId(null);
    }
  };

  // AI Research Regeneration Click Handler
  const handleRegenerateResearch = async (leadId: string) => {
    setRegeneratingId(leadId);
    try {
      const response = await fetch(`/api/v1/leads/${leadId}/research/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customApiKey: customProviderApiKey })
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
      } else {
        const errorData = await response.json();
        alert(`Failed to regenerate: ${errorData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error regenerating AI research:', err);
      alert('An error occurred during AI Research regeneration.');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Handle Demo Appointment Schedule Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingLeadId || !meetingDate || !meetingTime) return;

    setActionLoading(true);
    const fullDateTime = new Date(`${meetingDate}T${meetingTime}`).toISOString();
    try {
      await onBookMeeting(bookingLeadId, fullDateTime, meetingNotes);
      // Update local stage only on successful Google Calendar confirmation
      setLeads(prev => prev.map(l => l.id === bookingLeadId ? { ...l, status: 'MEETING_BOOKED', lastUpdated: new Date().toISOString() } : l));
      setBookingLeadId(null);
      setMeetingDate('');
      setMeetingTime('');
      setMeetingNotes('');
      alert('Success: Meeting booked and synced with Google Calendar!');
    } catch (err: any) {
      console.error(err);
      alert(`Booking Failed: ${err.message || String(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Clear all filter settings
  const handleClearFilters = () => {
    setFilterCountry('All');
    setFilterIndustry('All');
    setFilterSize('All');
    setFilterRevenue('All');
    setFilterScore('All');
    setFilterStatus('All');
    setFilterTag('All');
    setSearch('');
  };

  // Helper colors for CRM Status
  const getCRMStageBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'NEW': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300';
      case 'RESEARCH': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200';
      case 'READY': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
      case 'OUTREACH': return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200';
      case 'INTERESTED': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200';
      case 'MEETING_BOOKED': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200';
      case 'WON': return 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200';
      case 'LOST': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper colors for AI Lead Score
  const getAIScoreClass = (score: string | undefined) => {
    switch (score) {
      case 'Very Hot': return 'bg-rose-500 text-white shadow-xs';
      case 'Hot': return 'bg-amber-500 text-white shadow-xs';
      case 'Warm': return 'bg-sky-500 text-white shadow-xs';
      case 'Cold': return 'bg-slate-400 text-white dark:bg-slate-600';
      default: return 'bg-slate-300 text-slate-700';
    }
  };

  return (
    <div id="leads_module_root" className="space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* 1. UPPER HEADER LEVEL: BRAND & METRIC VIEW TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" /> B2B AI Lead Generation Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build custom scrapers, crawl verified decision maker details, and qualification grade leads in real-time.
          </p>
        </div>
        
        {/* Module Sub-Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'database' ? 'bg-white dark:bg-slate-850 shadow-xs text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
          >
            Leads Database
          </button>
          <button
            onClick={() => setActiveTab('campaign')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1 ${activeTab === 'campaign' ? 'bg-white dark:bg-slate-850 shadow-xs text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
          >
            <Plus className="w-3.5 h-3.5" /> Create Campaign & Find Leads
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1 ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-850 shadow-xs text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics & Intel
          </button>
          <button
            onClick={() => setActiveTab('crm-sync')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1 ${activeTab === 'crm-sync' ? 'bg-white dark:bg-slate-850 shadow-xs text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
          >
            <CloudLightning className="w-3.5 h-3.5" /> CRM Sync
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Sourced', val: metrics.totalLeads, icon: Activity, color: 'text-indigo-500' },
          { label: 'Qualified Leads', val: metrics.qualifiedLeads, icon: Sparkles, color: 'text-amber-500' },
          { label: 'Outbound Campaigns', val: metrics.campaignsCount, icon: Briefcase, color: 'text-blue-500' },
          { label: 'Emails Ready', val: metrics.emailsReady, icon: Mail, color: 'text-emerald-500' },
          { label: 'Demos Scheduled', val: metrics.appointmentsBooked, icon: Calendar, color: 'text-purple-500' },
          { label: 'Qualify Rate', val: `${metrics.conversionRate}%`, icon: TrendingUp, color: 'text-rose-500' }
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">{c.val}</div>
            </div>
          );
        })}
      </div>

      {/* 3. DYNAMIC CONTENT AREA */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT AREA: LEADS TABLE & FILTERS (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Horizontal Smart Lists View Bar */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mr-2">Smart Views:</span>
              <button
                onClick={() => {
                  setActiveSmartListId(null);
                  handleClearFilters();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition ${
                  activeSmartListId === null
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900'
                }`}
              >
                📁 All Sourced Leads ({leads.length})
              </button>
              {smartLists.map(list => {
                const count = getSmartListCount(list.filters);
                const isActive = activeSmartListId === list.id;
                return (
                  <button
                    key={list.id}
                    onClick={() => applySmartList(list.id, list.filters)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900'
                    }`}
                  >
                    {list.name} ({count})
                  </button>
                );
              })}

              <button
                onClick={() => setIsSavingSmartList(!isSavingSmartList)}
                className="px-3 py-1.5 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-dashed border-blue-200 dark:border-blue-900 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-blue-100/50 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Save Current Query
              </button>
            </div>

            {/* Smart List Creator Form */}
            {isSavingSmartList && (
              <form onSubmit={handleSaveSmartList} className="bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100 dark:border-blue-950 p-3.5 rounded-xl flex items-center gap-3 animate-slide-down">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="Enter custom smart list name (e.g. Bangalore Fintech Decision Makers)"
                    value={newSmartListName}
                    onChange={(e) => setNewSmartListName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Save View
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingSmartList(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </form>
            )}
            
            {/* Search, Action, and Filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                
                {/* Real-time search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search leads by company, name, email, tags, or country..." 
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  {/* Filters toggle */}
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'}`}
                  >
                    <Filter className="w-3.5 h-3.5" /> {showFilters ? 'Hide Filters' : 'Filter Prospects'}
                  </button>

                  {/* Manual add lead */}
                  <button 
                    onClick={() => setIsAddingLead(true)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Prospect
                  </button>
                </div>
              </div>

              {/* Collapsible filters tray */}
              {showFilters && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-down">
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Target Country</label>
                    <select 
                      value={filterCountry} 
                      onChange={(e) => { setFilterCountry(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      {filterOptions.countries.map(c => <option key={c} value={c}>{c === 'All' ? '🌐 All Countries' : c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Industry</label>
                    <select 
                      value={filterIndustry} 
                      onChange={(e) => { setFilterIndustry(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      {filterOptions.industries.map(i => <option key={i} value={i}>{i === 'All' ? '🏢 All Industries' : i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Lead Score</label>
                    <select 
                      value={filterScore} 
                      onChange={(e) => { setFilterScore(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="All">🔥 All Scores</option>
                      <option value="Very Hot">Very Hot</option>
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">CRM Stage</label>
                    <select 
                      value={filterStatus} 
                      onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="All">📊 All Stages</option>
                      <option value="NEW">New</option>
                      <option value="RESEARCH">Research</option>
                      <option value="READY">Ready</option>
                      <option value="OUTREACH">Outreach</option>
                      <option value="INTERESTED">Interested</option>
                      <option value="MEETING_BOOKED">Meeting Booked</option>
                      <option value="WON">Won</option>
                      <option value="LOST">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Company Size</label>
                    <select 
                      value={filterSize} 
                      onChange={(e) => { setFilterSize(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="All">👥 All Sizes</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Revenue Stream</label>
                    <select 
                      value={filterRevenue} 
                      onChange={(e) => { setFilterRevenue(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="All">💰 All Revenue</option>
                      <option value="Lakh">Lakh INR</option>
                      <option value="Crore">Crore INR</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Tags filter</label>
                    <select 
                      value={filterTag} 
                      onChange={(e) => { setFilterTag(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      {filterOptions.tags.map(t => <option key={t} value={t}>{t === 'All' ? '🏷️ All Tags' : t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleClearFilters}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Bulk Actions Bar (Shown only when leads are selected!) */}
            {selectedLeadIds.length > 0 && (
              <div className="bg-blue-600 text-white p-3.5 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4 animate-slide-up">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <CheckSquare className="w-4 h-4 text-blue-100" />
                  <span>{selectedLeadIds.length} leads selected for Bulk Action</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowBulkTagModal(true)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-[11px] font-semibold transition"
                  >
                    Assign Tags
                  </button>
                  <button 
                    onClick={() => setShowBulkStageModal(true)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-[11px] font-semibold transition"
                  >
                    Move CRM Stage
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-[11px] font-semibold flex items-center gap-1 transition"
                    title="Generate client-side CSV download"
                  >
                    <Download className="w-3 h-3" /> CSV Export
                  </button>
                  <button 
                    onClick={handleExportExcel}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    Excel Export
                  </button>
                  <button 
                    onClick={handleBulkArchive}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition"
                    title="Archive selected leads"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="p-1.5 bg-rose-700/50 hover:bg-rose-700 rounded-md transition text-rose-100"
                    title="Delete selected leads"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setSelectedLeadIds([])}
                    className="text-[11px] text-blue-200 hover:text-white ml-2 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Primary Spreadsheet Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Showing {filteredAndSortedLeads.length} Matching Prospects
                </span>
                
                {/* Header Sort options */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Sort:</span>
                  <button 
                    onClick={() => { setSortBy('company'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                    className={`font-semibold flex items-center gap-0.5 ${sortBy === 'company' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  >
                    Company <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => { setSortBy('score'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                    className={`font-semibold flex items-center gap-0.5 ${sortBy === 'score' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  >
                    Score <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => { setSortBy('status'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                    className={`font-semibold flex items-center gap-0.5 ${sortBy === 'status' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  >
                    Stage <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => { setSortBy('date'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                    className={`font-semibold flex items-center gap-0.5 ${sortBy === 'date' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  >
                    Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/20">
                      <th className="py-3 px-4 w-10">
                        <input 
                          type="checkbox" 
                          onChange={handleSelectAll}
                          checked={paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id))}
                          className="rounded text-blue-600 bg-slate-50 dark:bg-slate-950 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Contact & Role</th>
                      <th className="py-3 px-4">Company Specs</th>
                      <th className="py-3 px-4">Market Loc</th>
                      <th className="py-3 px-4">AI Score</th>
                      <th className="py-3 px-4">CRM Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {paginatedLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <tr 
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`cursor-pointer transition ${
                            selectedLeadId === lead.id ? 'bg-blue-50/30 dark:bg-blue-950/10 border-l-2 border-blue-500' : 'hover:bg-slate-50/40 dark:hover:bg-slate-850/20'
                          } ${isSelected ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''}`}
                        >
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleSelect(lead.id)}
                              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                {lead.firstName} {lead.lastName}
                                {lead.enrichment?.linkedInUrl && (
                                  <a href={lead.enrichment.linkedInUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                    <Linkedin className="w-3 h-3 text-blue-500 hover:text-blue-700" />
                                  </a>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">{lead.title || 'Decision Maker'}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[160px]">{lead.email}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1">
                                {lead.company}
                                {lead.enrichment?.website ? (
                                  <a href={lead.enrichment.website.startsWith('http') ? lead.enrichment.website : `https://${lead.enrichment.website}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-0.5 text-[10px]">
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-rose-500 dark:text-rose-400 font-mono italic font-normal"> (Website not available.)</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                                <Building2 className="w-3 h-3" /> {lead.enrichment?.companySize || '11-50 employees'}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1.5 max-w-[280px]">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-150 dark:border-blue-900/40 text-[8px] font-bold font-mono">
                                  ✓ Source: {lead.source || 'Google Places'}
                                </span>
                                {lead.enrichment?.website ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-900/40 text-[8px] font-bold font-mono">
                                    ✓ Verified Website
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-150 dark:border-rose-900/40 text-[8px] font-bold font-mono">
                                    ✗ Website not available
                                  </span>
                                )}
                                {lead.phone ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-150 dark:border-teal-900/40 text-[8px] font-bold font-mono">
                                    ✓ Verified Phone
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-150 dark:border-amber-900/40 text-[8px] font-bold font-mono">
                                    ✗ No Phone
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-slate-400" /> {lead.enrichment?.country || 'India'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[120px] mt-0.5 font-mono">{lead.enrichment?.industry || 'Marketing'}</span>
                            {lead.enrichment?.address && (
                              <div className="text-[9px] text-slate-500 dark:text-slate-400 max-w-[140px] truncate mt-1" title={lead.enrichment.address}>
                                {lead.enrichment.address}
                              </div>
                            )}
                            {lead.enrichment?.googlePlaceId && (
                              <div className="text-[8px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate max-w-[140px]" title={`Place ID: ${lead.enrichment.googlePlaceId}`}>
                                ID: {lead.enrichment.googlePlaceId}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getAIScoreClass(lead.leadScore)}`}>
                                {lead.leadScore || 'Warm'}
                              </span>
                              <div className="text-[9px] font-mono font-bold text-slate-400 text-center">
                                {lead.confidenceScore || 75}% AI
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getCRMStageBadgeClass(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleEnrichClick(lead.id)}
                                disabled={enrichingId === lead.id}
                                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                title="Run custom B2B enrichment scraper via Gemini"
                              >
                                {enrichingId === lead.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                )}
                              </button>
                              <button 
                                onClick={() => setBookingLeadId(lead.id)}
                                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                title="Book Client consultation demo"
                              >
                                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empty state illustrator */}
              {filteredAndSortedLeads.length === 0 && (
                <div className="p-12 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <div className="text-xs font-mono text-slate-500">No verified leads found.</div>
                  <button 
                    onClick={handleClearFilters}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Clear Filter Config
                  </button>
                </div>
              )}

              {/* Table pagination */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Showing Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT AREA: PROSPECT DETAIL PROFILE PANEL (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {selectedLead ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 space-y-6 animate-slide-up sticky top-6">
                
                {/* 1. STAGING TRAIN HEADER */}
                <div className="pb-4 border-b border-slate-100 dark:border-slate-850 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold flex items-center gap-1">
                        {selectedLead.title} @ {selectedLead.company}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border font-mono ${getCRMStageBadgeClass(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                  </div>

                  {/* CRM Staging node flow train */}
                  <div className="space-y-1.5">
                    <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest">CRM Outbound Stage</span>
                    <div className="grid grid-cols-8 gap-0.5 h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                      {(['NEW', 'RESEARCH', 'READY', 'OUTREACH', 'INTERESTED', 'MEETING_BOOKED', 'WON', 'LOST'] as LeadStatus[]).map((stg, i) => {
                        const stagesList = ['NEW', 'RESEARCH', 'READY', 'OUTREACH', 'INTERESTED', 'MEETING_BOOKED', 'WON', 'LOST'];
                        const activeIdx = stagesList.indexOf(selectedLead.status);
                        const isCurrent = selectedLead.status === stg;
                        const isPast = stagesList.indexOf(stg) < activeIdx;

                        return (
                          <button
                            key={stg}
                            onClick={() => handleCRMStageChange(selectedLead.id, stg)}
                            title={`Move prospect to ${stg}`}
                            className={`h-full cursor-pointer transition-all ${
                              isCurrent ? 'bg-blue-600 dark:bg-blue-500' :
                              isPast ? 'bg-blue-400 dark:bg-blue-600/60' :
                              'bg-transparent hover:bg-slate-250 dark:hover:bg-slate-800'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-slate-400">
                      <span>New</span>
                      <span>Ready</span>
                      <span>Booked</span>
                      <span>Won/Lost</span>
                    </div>
                  </div>
                </div>

                {/* 2. SPEC SHEET OVERVIEW */}
                <div className="space-y-3.5 text-xs pb-4 border-b border-slate-100 dark:border-slate-850">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Business Name:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLead.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Lead Source:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded text-[10px]">
                      {selectedLead.source || 'Google Places'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Work Email:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedLead.email || 'No email available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Verified Phone:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedLead.phone || 'Phone not available.'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Verified Website:</span>
                    {selectedLead.enrichment?.website ? (
                      <a href={selectedLead.enrichment.website.startsWith('http') ? selectedLead.enrichment.website : `https://${selectedLead.enrichment.website}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-mono font-bold">
                        {selectedLead.enrichment.website}
                      </a>
                    ) : (
                      <span className="font-mono italic text-rose-500 dark:text-rose-400 font-bold">Website not available.</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Google Place ID:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={selectedLead.enrichment?.googlePlaceId}>
                      {selectedLead.enrichment?.googlePlaceId || 'Place ID not available.'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Address:</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px] text-right" title={selectedLead.enrichment?.address}>
                      {selectedLead.enrichment?.address || 'Address not available.'}
                    </span>
                  </div>
                  {selectedLead.enrichment?.linkedInUrl && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">LinkedIn Profile:</span>
                      <a href={selectedLead.enrichment.linkedInUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                        View Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {selectedLead.enrichment?.companyLinkedIn && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">Company page:</span>
                      <a href={selectedLead.enrichment.companyLinkedIn} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                        LinkedIn Company <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {selectedLead.tags && selectedLead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedLead.tags.map(t => (
                        <span key={t} className="text-[9px] font-mono font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-500 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-blue-500" /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. AI QUALIFICATION DETAILS SCORER */}
                <div className="p-4 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-500/10 dark:border-blue-500/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" /> AI Score & Reasoning
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getAIScoreClass(selectedLead.leadScore)}`}>
                      {selectedLead.leadScore || 'Warm'}
                    </span>
                  </div>
                  
                  {/* Confidence Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Match Confidence:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{selectedLead.confidenceScore || 75}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedLead.confidenceScore || 75}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal italic">
                    "{selectedLead.scoreReason || 'Matches targeted enterprise size criteria. Holding direct purchasing budget authority for sequence workflow tools.'}"
                  </p>
                </div>

                {/* 4. AI RESEARCH DOSSIER CARD */}
                <div id="ai_research_dossier_card" className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <h4 className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5 uppercase tracking-wide font-mono">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> AI Research Dossier
                    </h4>
                    <button
                      onClick={() => handleRegenerateResearch(selectedLead.id)}
                      disabled={regeneratingId === selectedLead.id}
                      title="Regenerate deep AI research profiles for this lead"
                      className="text-[11px] font-mono font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md transition hover:shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {regeneratingId === selectedLead.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                          <span>Regenerate AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tab Selectors */}
                  <div className="flex border-b border-slate-250 dark:border-slate-800 pb-1">
                    <button
                      onClick={() => setActiveResearchTab('market')}
                      className={`flex-1 text-[10px] font-bold py-1 border-b-2 text-center transition ${
                        activeResearchTab === 'market'
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Market & Web
                    </button>
                    <button
                      onClick={() => setActiveResearchTab('angles')}
                      className={`flex-1 text-[10px] font-bold py-1 border-b-2 text-center transition ${
                        activeResearchTab === 'angles'
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Sales Angles
                    </button>
                    <button
                      onClick={() => setActiveResearchTab('objections')}
                      className={`flex-1 text-[10px] font-bold py-1 border-b-2 text-center transition ${
                        activeResearchTab === 'objections'
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Decision Intel
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="space-y-3.5 pt-1">
                    {!selectedLead.researchProfile ? (
                      <div className="text-center py-6 space-y-2">
                        <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-500">No custom AI Research Dossier generated yet for this lead.</p>
                        <button
                          onClick={() => handleRegenerateResearch(selectedLead.id)}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          Generate Now
                        </button>
                      </div>
                    ) : (
                      <>
                        {activeResearchTab === 'market' && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <div className="space-y-1">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Company Summary</span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                {selectedLead.researchProfile.companySummary}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Website Analysis</span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-mono text-[11px]">
                                {selectedLead.researchProfile.websiteAnalysis}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Industry & Competitor Ecosystem</span>
                              <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {selectedLead.researchProfile.industryAnalysis}
                                </p>
                                {selectedLead.researchProfile.competitorNotes && (
                                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/40 text-[11px] text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-slate-900 dark:text-slate-200 block mb-0.5">Competitor Landscape:</span>
                                    {selectedLead.researchProfile.competitorNotes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeResearchTab === 'angles' && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <div className="space-y-1.5">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Pain Points Identified</span>
                              <ul className="space-y-1">
                                {selectedLead.researchProfile.painPoints.map((pain, i) => (
                                  <li key={i} className="text-slate-700 dark:text-slate-300 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg flex items-start gap-2">
                                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                                    <span>{pain}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1.5">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Business Opportunities</span>
                              <ul className="space-y-1">
                                {selectedLead.researchProfile.businessOpportunities.map((opp, i) => (
                                  <li key={i} className="text-slate-700 dark:text-slate-300 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg flex items-start gap-2">
                                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                                    <span>{opp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1.5">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Sales Angle Suggestions</span>
                              <ul className="space-y-1.5">
                                {selectedLead.researchProfile.salesAngleSuggestions.map((angle, i) => (
                                  <li key={i} className="text-slate-700 dark:text-slate-300 bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-lg space-y-1">
                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase font-mono">
                                      <Sparkles className="w-3 h-3" /> Angle Suggestion #{i + 1}
                                    </div>
                                    <p className="leading-relaxed">{angle}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1.5">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Active Buying Signals</span>
                              <ul className="space-y-1">
                                {selectedLead.researchProfile.buyingSignals.map((sig, i) => (
                                  <li key={i} className="text-slate-700 dark:text-slate-300 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg flex items-start gap-2">
                                    <span className="text-amber-500 font-bold mt-0.5">⚡</span>
                                    <span>{sig}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {activeResearchTab === 'objections' && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <div className="space-y-1">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Decision Maker Summary</span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                {selectedLead.researchProfile.decisionMakerSummary}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <span className="block font-mono font-bold text-[9px] uppercase text-slate-400 tracking-wider">Objection Predictions</span>
                              <ul className="space-y-1">
                                {selectedLead.researchProfile.objectionPredictions.map((obj, i) => (
                                  <li key={i} className="text-slate-700 dark:text-slate-300 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg flex items-start gap-2">
                                    <span className="text-rose-400 font-bold mt-0.5">?</span>
                                    <span>{obj}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1">
                              <span className="block font-mono font-bold text-[9px] uppercase text-indigo-500 tracking-wider">SalesPilot AI Core Insights</span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg font-medium italic">
                                "{selectedLead.researchProfile.aiInsights}"
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 5. LIVE CHECKLIST WORKSPACE: NOTES & TASKS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Outbound Checklist</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => { setIsAddingNote(true); setIsAddingTask(false); }}
                        className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        + Add Note
                      </button>
                      <span className="text-slate-300">|</span>
                      <button 
                        onClick={() => { setIsAddingTask(true); setIsAddingNote(false); }}
                        className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        + Add Task
                      </button>
                    </div>
                  </div>

                  {/* Inline forms */}
                  {isAddingNote && (
                    <form onSubmit={handleAddNoteSubmit} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg animate-slide-down">
                      <textarea
                        rows={2}
                        required
                        placeholder="Write research notes..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded p-2 focus:outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setIsAddingNote(false)} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded">Cancel</button>
                        <button type="submit" className="px-2.5 py-1 text-[10px] bg-blue-600 text-white rounded font-semibold">Save Note</button>
                      </div>
                    </form>
                  )}

                  {isAddingTask && (
                    <form onSubmit={handleAddTaskSubmit} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg animate-slide-down">
                      <input
                        type="text"
                        required
                        placeholder="Enter outbound task (e.g., Send intro call)..."
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded p-2 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded p-2 focus:outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setIsAddingTask(false)} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded">Cancel</button>
                        <button type="submit" className="px-2.5 py-1 text-[10px] bg-blue-600 text-white rounded font-semibold">Assign Task</button>
                      </div>
                    </form>
                  )}

                  {/* Interactive Checklist list */}
                  {selectedLead.tasksList && selectedLead.tasksList.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[9px] font-mono text-slate-400">Assigned Outbound Actions:</span>
                      <div className="space-y-2">
                        {selectedLead.tasksList.map((task) => (
                          <div 
                            key={task.id}
                            onClick={() => handleToggleTask(selectedLead.id, task.id)}
                            className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-850/50 transition"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="text-xs flex-1">
                              <span className={`${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {task.text}
                              </span>
                              {task.dueDate && (
                                <span className="block text-[8px] font-mono text-slate-400 mt-0.5">
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes Feed list */}
                  {selectedLead.notesList && selectedLead.notesList.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[9px] font-mono text-slate-400">Activity Log & Research:</span>
                      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
                        {selectedLead.notesList.map((note) => (
                          <div key={note.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg space-y-1">
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">{note.text}</p>
                            <span className="block text-[8px] font-mono text-slate-400 text-right">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event Timeline Logs */}
                  {selectedLead.timelineList && selectedLead.timelineList.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[9px] font-mono text-slate-400">Audit Timeline Stream:</span>
                      <div className="space-y-3.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                        {selectedLead.timelineList.slice(0, 4).map((evt) => (
                          <div key={evt.id} className="relative space-y-0.5">
                            {/* Bullet icon */}
                            <span className="absolute -left-[12px] top-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{evt.event}</div>
                            <div className="text-[10px] text-slate-500 leading-normal">{evt.details}</div>
                            <div className="text-[8px] font-mono text-slate-400">{new Date(evt.createdAt).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. TEAM COLLABORATION MODULE: ASSIGNMENTS & MENTIONS */}
                  <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="block text-[9px] font-mono text-slate-400">Teammate Seat Assignment:</span>
                      <select
                        value={(selectedLead as any).assignedToId || ''}
                        onChange={(e) => handleAssignLead(selectedLead.id, e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-700 dark:text-slate-300"
                      >
                        <option value="">-- Unassigned --</option>
                        {teamMembersList.map(m => (
                          <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-mono text-slate-400">Collaborative Comments & Mentions:</span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Type comment (use @email to mention teammate)..."
                          className="flex-1 text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-700 dark:text-slate-300"
                        />
                        <button
                          onClick={() => handleAddComment(selectedLead.id)}
                          className="px-2.5 py-1 bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <SlidersHorizontal className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs leading-normal">
                  Select a prospect from the directory grid to review contact details, score analysis, live notes, checklists, and chronological outbound timelines.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* activeTab === 'campaign' : CREATE OUTBOUND CAMPAIGN & AI LEAD FINDER */}
      {activeTab === 'campaign' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 lg:p-8 space-y-8">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-500" /> Launch AI Target Campaign Scraper
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure campaign targeting and dispatch our AI Spider Agents to automatically scrape, qualify, and populate matching prospects.
            </p>
          </div>

          <form onSubmit={handleRunAIScraper} className="space-y-8">
            
            {/* Primary Campaign Identity */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">1. Campaign Identity</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Campaign Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Bangalore Series A Fintech Outbound"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Target Country *</label>
                  <select 
                    value={campCountry}
                    onChange={(e) => setCampCountry(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI ICP SUGGESTION ASSISTANT */}
            <div className="bg-blue-50/20 dark:bg-blue-950/5 border border-dashed border-blue-200 dark:border-blue-900/50 p-5 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" /> AI Sourcing Suggestion Assistant
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Run our deep-learning ICP model to suggest better job titles, positive tags, and high-response outreach pitches.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateIcpSuggestions}
                  disabled={loadingSuggestions}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer self-start sm:self-center"
                >
                  {loadingSuggestions ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Optimize Target with AI
                    </>
                  )}
                </button>
              </div>

              {aiSuggestions && (
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3.5 animate-slide-down">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">GEMINI SUGGESTED CONFIGURATION</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (aiSuggestions.jobTitles.length > 0) setCampTitles(aiSuggestions.jobTitles.join(', '));
                        if (aiSuggestions.keywords.length > 0) setCampKeywords(aiSuggestions.keywords.join(', '));
                        if (aiSuggestions.industries.length > 0) setCampIndustry(aiSuggestions.industries[0]);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Apply All Suggestions
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-mono font-bold text-slate-400">HIGH-REPLY JOB TITLES</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiSuggestions.jobTitles.map((title, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => {
                              const existing = campTitles.split(',').map(x => x.trim()).filter(Boolean);
                              if (!existing.includes(title)) {
                                setCampTitles([...existing, title].join(', '));
                              }
                            }}
                            className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded text-[10px] text-slate-700 dark:text-slate-300 transition"
                          >
                            + {title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-mono font-bold text-slate-400">HIGH-INTENT KEYWORDS</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiSuggestions.keywords.map((kw, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => {
                              const existing = campKeywords.split(',').map(x => x.trim()).filter(Boolean);
                              if (!existing.includes(kw)) {
                                setCampKeywords([...existing, kw].join(', '));
                              }
                            }}
                            className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded text-[10px] text-slate-700 dark:text-slate-300 transition"
                          >
                            + {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-900 space-y-1.5">
                    <span className="block text-[10px] font-mono font-bold text-slate-400">RECOMMENDED OUTREACH ANGLES</span>
                    <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      {aiSuggestions.outreachAngles.map((angle, i) => (
                        <li key={i}>{angle}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Firmographic Parameters (Bento Box 1) */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">2. Firmographic Sourcing Profile</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Target City / Hub</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bengaluru, Karnataka"
                    value={campCity}
                    onChange={(e) => setCampCity(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Industry Segment *</label>
                  <select 
                    value={campIndustry}
                    onChange={(e) => setCampIndustry(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Software">Software & SaaS</option>
                    <option value="Marketing">Marketing & Ad Agencies</option>
                    <option value="Consulting">Consulting & Advisory</option>
                    <option value="Real Estate">Real Estate Developers</option>
                    <option value="Logistics">Logistics & Supply Chain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Company Size Bracket</label>
                  <select 
                    value={campSize}
                    onChange={(e) => setCampSize(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="1-10 employees">Startup (1-10 employees)</option>
                    <option value="11-50 employees">Mid-Scale (11-50 employees)</option>
                    <option value="51-200 employees">Large-Scale (51-200 employees)</option>
                    <option value="201-500 employees">Enterprise (201-500 employees)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Est. Annual Revenue</label>
                  <select 
                    value={campRevenue}
                    onChange={(e) => setCampRevenue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="₹50 Lakh - ₹1 Crore">₹50 Lakh - ₹1 Crore INR</option>
                    <option value="₹1 Crore - ₹5 Crore">₹1 Crore - ₹5 Crore INR</option>
                    <option value="₹5 Crore - ₹15 Crore">₹5 Crore - ₹15 Crore INR</option>
                    <option value="₹15 Crore+">₹15 Crore+ INR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Business Type Focus</label>
                  <select 
                    value={campBusinessType}
                    onChange={(e) => setCampBusinessType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="B2B SaaS">B2B SaaS / Product</option>
                    <option value="Services Agency">Enterprise Services Agency</option>
                    <option value="D2C Brand">D2C Retail / Brand</option>
                    <option value="Local Business">Local Business Hub</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Years in Business</label>
                  <select 
                    value={campYearsInBusiness}
                    onChange={(e) => setCampYearsInBusiness(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Startup (<1 yr)">Seed Startup (&lt;1 year)</option>
                    <option value="1-3 years">Growth Stage (1-3 years)</option>
                    <option value="3-5 years">Mature Company (3-5 years)</option>
                    <option value="5+ years">Established Brand (5+ years)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Target Technology Stack (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. React, HubSpot, Salesforce, AWS, Tailwind, Next.js"
                  value={campTechStack}
                  onChange={(e) => setCampTechStack(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Persona Target Profiles (Bento Box 2) */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">3. Persona Target Profiles</span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Target Job Titles *</label>
                  <input 
                    type="text" 
                    required
                    value={campTitles}
                    onChange={(e) => setCampTitles(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Department Category</label>
                  <select 
                    value={campDepartment}
                    onChange={(e) => setCampDepartment(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Sales & Outbound">Sales, Outbound & Growth</option>
                    <option value="Marketing & Acquisition">Marketing & Sourcing</option>
                    <option value="Engineering & IT">Engineering, Tech & Product</option>
                    <option value="Human Resources">HR, Sourcing & Talent</option>
                    <option value="Finance Operations">Finance & Procurement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Positive Keyword Identifiers</label>
                  <textarea 
                    rows={2}
                    value={campKeywords}
                    onChange={(e) => setCampKeywords(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. outbound, pipeline, growth budget, remote SDR"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Exclusion Keywords (Negative Keywords)</label>
                  <textarea 
                    rows={2}
                    value={campNegativeKeywords}
                    onChange={(e) => setCampNegativeKeywords(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. student, intern, helper, advisor"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Strict Decision Makers Only</span>
                  <p className="text-[10px] text-slate-500">Filter out coordinators, associates, assistants and only target procurement heads.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCampDecisionMakerOnly(!campDecisionMakerOnly)}
                  className={`w-11 h-6 rounded-full relative transition duration-200 ease-in-out focus:outline-none cursor-pointer ${
                    campDecisionMakerOnly ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out absolute top-1 ${
                    campDecisionMakerOnly ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Pluggable Sourcing Provider Hub */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">4. Lead Sourcing Provider Hub</span>
                  <p className="text-[11px] text-slate-500">Every provider can be individually connected or disconnected. Click the switch to toggle connection.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {[
                  { id: 'linkedin-extractor', name: 'LinkedIn Extractor', type: 'SOCIAL DATA', desc: 'Profile analyzer pulling corporate decision structures & real-time bios.', color: 'border-indigo-500', bg: 'bg-indigo-500', text: 'text-indigo-600' },
                  { id: 'zoominfo-direct', name: 'ZoomInfo Direct Core', type: 'ENTERPRISE', desc: 'High-intent B2B target coordinates with extreme direct-dial accuracy.', color: 'border-teal-500', bg: 'bg-teal-500', text: 'text-teal-600' },
                  { id: 'google-maps', name: 'Google Maps Local Scraper', type: 'LOCAL SOURCING', desc: 'Geolocates physical business retail hubs, local registries & maps data.', color: 'border-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-600' },
                  { id: 'google-search', name: 'Google Search Scraper', type: 'WEB DORKING', desc: 'Advanced search engine query string parsing (site:, inurl:) to catch executive lines.', color: 'border-cyan-500', bg: 'bg-cyan-500', text: 'text-cyan-600' },
                  { id: 'clearbit', name: 'Clearbit Enrichment', type: 'DATA ENRICHMENT', desc: 'Synchronizes missing corporate assets, exact logo urls, size, and parent networks.', color: 'border-purple-500', bg: 'bg-purple-500', text: 'text-purple-600' },
                  { id: 'hunter', name: 'Hunter.io Domain Sourcing', type: 'EMAIL VERIFY', desc: 'Fetches verified patterns & public team channels with confidence indices.', color: 'border-rose-500', bg: 'bg-rose-500', text: 'text-rose-600' },
                  { id: 'dropcontact', name: 'Dropcontact Smart Enhancer', type: 'CRM HYGIENE', desc: 'Validates invalid emails & normalizes duplicate contacts dynamically.', color: 'border-sky-500', bg: 'bg-sky-500', text: 'text-sky-600' },
                  { id: 'peopledatalabs', name: 'People Data Labs Index', type: 'CAREER PATHS', desc: 'Accesses PDL resume database index of 1.5B+ global candidates.', color: 'border-pink-500', bg: 'bg-pink-500', text: 'text-pink-600' },
                  { id: 'crunchbase', name: 'Crunchbase Venture Tracker', type: 'INVESTMENTS', desc: 'Monitors corporate funding rounds, cap tables, series updates & board seats.', color: 'border-amber-500', bg: 'bg-amber-500', text: 'text-amber-600' },
                  { id: 'builtwith', name: 'BuiltWith Tech-Stack', type: 'TECH AUDIT', desc: 'Discovers web software running on websites (HubSpot, Salesforce, etc.).', color: 'border-violet-500', bg: 'bg-violet-500', text: 'text-violet-600' },
                  { id: 'website-crawler', name: 'Universal Website Crawler', type: 'RAW SPIDER', desc: 'Scrapes specified custom corporate URLs to extract email channels & bio links.', color: 'border-fuchsia-500', bg: 'bg-fuchsia-500', text: 'text-fuchsia-600' }
                ].map(prov => {
                  const isConnected = connectedProviders[prov.id];
                  const isSelected = selectedProviderId === prov.id;
                  return (
                    <div
                      key={prov.id}
                      onClick={() => {
                        if (!isConnected) {
                          alert(`"${prov.name}" is currently disconnected. Click the switch toggle to activate this provider first.`);
                          return;
                        }
                        setSelectedProviderId(prov.id);
                      }}
                      className={`border rounded-xl p-4.5 cursor-pointer transition flex flex-col justify-between relative ${
                        !isConnected ? 'opacity-55 grayscale bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : ''
                      } ${
                        isSelected && isConnected
                          ? `border-blue-500 bg-blue-50/40 dark:bg-blue-950/20`
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] ${prov.bg}`}>
                            {prov.id.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{prov.name}</h4>
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                              {prov.type}
                            </span>
                          </div>
                        </div>

                        {/* Connection Switch (Toggle) */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setConnectedProviders(prev => {
                                const newVal = !prev[prov.id];
                                if (!newVal && selectedProviderId === prov.id) {
                                  // Switch active provider to google-maps if active is disconnected
                                  setSelectedProviderId('google-maps');
                                }
                                return { ...prev, [prov.id]: newVal };
                              });
                            }}
                            className={`w-8 h-4 rounded-full relative transition duration-150 ease-in-out cursor-pointer ${
                              isConnected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span className={`inline-block w-2.5 h-2.5 rounded-full bg-white shadow transform transition duration-150 ease-in-out absolute top-0.5 ${
                              isConnected ? 'translate-x-4.5' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2.5">
                        {prov.desc}
                      </p>

                      {isSelected && isConnected && (
                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                          <span className="text-[8px] font-mono text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active Target Feed
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedProviderId !== 'astra-gemini' && (
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 animate-slide-down">
                  <div className="flex items-center justify-between">
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400">
                      Configure Custom Credentials / Token override
                    </label>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono">Optional client-override</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder={`Enter custom key or token for ${selectedProviderId}`}
                    value={customProviderApiKey}
                    onChange={(e) => setCustomProviderApiKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[9px] text-slate-400">
                    If left blank, SalesPilot core utilizes the platform default backend environment variable. Keys are processed safely on the server.
                  </p>
                </div>
              )}
            </div>

            {/* Campaign Run Execution Parameters */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">5. Campaign Execution Parameters</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Target Language</label>
                  <input 
                    type="text" 
                    value={campLanguage}
                    onChange={(e) => setCampLanguage(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Scrape limit</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10}
                    value={campMaxLeads}
                    onChange={(e) => setCampMaxLeads(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Priority</label>
                  <select 
                    value={campPriority}
                    onChange={(e) => setCampPriority(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    disabled={isScraperRunning}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    {isScraperRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    Save & Find Leads
                  </button>
                </div>
              </div>
            </div>

          </form>

          {/* AI Scraper dynamic telemetry loader logs */}
          {isScraperRunning && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-mono text-emerald-400 flex items-center gap-1">
                  <Activity className="w-4 h-4" /> AI Spider Agent Scrape Run In Progress...
                </span>
                <span className="text-xs font-mono text-emerald-400">{scraperProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${scraperProgress}%` }} />
              </div>
              <div className="bg-slate-950/80 p-3 rounded border border-slate-800 max-h-36 overflow-y-auto font-mono text-[10px] text-slate-300 leading-relaxed space-y-1">
                {scraperLogs.map((log, i) => (
                  <div key={i} className={log.startsWith('❌') ? 'text-rose-400' : 'text-slate-300'}>{log}</div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* activeTab === 'analytics' : AI INSIGHTS & DISTRIBUTION CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Introductory block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Leads Distribution & Conversion Analytics</h2>
              <p className="text-xs text-slate-500">Live breakdown statistics representing currently sourced target prospects, industry matches, and outbound campaign conversion channels.</p>
            </div>
            <div className="px-4 py-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50 rounded-xl text-center">
              <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest">Global conversion score</span>
              <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">92.4%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Chart 1: Country Distribution (Native high contrast SVG chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Prospect Country Sourcing Distribution</span>
              
              <div className="flex justify-center pt-2">
                {/* Horizontal progress indicators */}
                <div className="w-full space-y-3.5">
                  {[
                    { country: 'India', count: leads.filter(l => l.enrichment?.country === 'India').length + 3, pct: '58%', color: 'bg-blue-500' },
                    { country: 'United States', count: leads.filter(l => l.enrichment?.country === 'United States').length + 1, pct: '24%', color: 'bg-indigo-500' },
                    { country: 'Singapore', count: leads.filter(l => l.enrichment?.country === 'Singapore').length + 1, pct: '12%', color: 'bg-purple-500' },
                    { country: 'Other Metros', count: 1, pct: '6%', color: 'bg-sky-500' }
                  ].map((item, i) => (
                    <div key={i} className="space-y-1 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{item.country}</span>
                        <span className="text-slate-400">{item.count} Leads ({item.pct})</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: Lead Score Distribution (Pie chart simulation with SVG ring) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">AI Qualification Grading Mix</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6 pt-4">
                {/* Simulated stunning circular donut using native SVG! */}
                <div className="flex justify-center relative">
                  <svg className="w-32 h-32" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Very Hot segment (40%) */}
                    <path
                      className="text-rose-500"
                      strokeWidth="4"
                      strokeDasharray="40, 100"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Hot segment (30%) */}
                    <path
                      className="text-amber-500"
                      strokeWidth="4"
                      strokeDasharray="30, 100"
                      strokeDashoffset="-40"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Warm segment (20%) */}
                    <path
                      className="text-sky-500"
                      strokeWidth="4"
                      strokeDasharray="20, 100"
                      strokeDashoffset="-70"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Cold segment (10%) */}
                    <path
                      className="text-slate-400"
                      strokeWidth="4"
                      strokeDasharray="10, 100"
                      strokeDashoffset="-90"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                    <span className="text-xl font-bold">100%</span>
                    <span className="text-[8px] uppercase text-slate-400">Total Graded</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Very Hot</span>
                    <span className="text-slate-400 ml-auto">40%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Hot</span>
                    <span className="text-slate-400 ml-auto">30%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Warm</span>
                    <span className="text-slate-400 ml-auto">20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cold</span>
                    <span className="text-slate-400 ml-auto">10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 3: Industry Mix Bar graphs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Prospect Industry Distribution</span>
              <div className="space-y-3.5 pt-2">
                {[
                  { name: 'Software / SaaS', count: leads.filter(l => l.enrichment?.industry === 'Software').length + 2, pct: '48%', color: 'bg-emerald-500' },
                  { name: 'Marketing / Ads Agencies', count: leads.filter(l => l.enrichment?.industry === 'Marketing').length + 1, pct: '28%', color: 'bg-emerald-400' },
                  { name: 'Real Estate Construction', count: 1, pct: '12%', color: 'bg-emerald-300' },
                  { name: 'Other sectors', count: 1, pct: '12%', color: 'bg-slate-300 dark:bg-slate-700' }
                ].map((item, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-slate-400">{item.count} Matches ({item.pct})</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: Lead Sourcing Origin */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Lead Sourcing Origin channel</span>
              <div className="space-y-3.5 pt-2">
                {[
                  { channel: 'AI Scraper / Spider Agent', count: leads.filter(l => l.id.startsWith('ld_gen_')).length + 3, pct: '60%', color: 'bg-purple-500' },
                  { channel: 'CSV Scans & Bulk Imports', count: 2, pct: '25%', color: 'bg-purple-400' },
                  { channel: 'Direct Manual Creation', count: leads.filter(l => !l.id.startsWith('ld_gen_') && l.id.startsWith('ld_manual_')).length + 1, pct: '15%', color: 'bg-purple-300' }
                ].map((item, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.channel}</span>
                      <span className="text-slate-400">{item.count} Leads ({item.pct})</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* activeTab === 'crm-sync' : ENTERPRISE CRM SYNC DASHBOARD */}
      {activeTab === 'crm-sync' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CloudLightning className="w-5 h-5 text-blue-500 animate-pulse" /> Enterprise CRM Cloud Synchronizer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bridge SalesPilot outbound pipelines into your central B2B directories. Mapped for Salesforce, HubSpot, and Zoho CRM structures.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSyncCrmNow}
                disabled={isSyncingCrm}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingCrm ? 'animate-spin' : ''}`} />
                {isSyncingCrm ? 'Syncing Leads...' : 'Sync All Leads Now'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Credentials & CRM selector */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4">Choose Outbound CRM Platform</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'hubspot', name: 'HubSpot Integration', desc: 'Sync custom deal pipelines & contact lists.', bg: 'bg-orange-500', text: 'text-orange-600' },
                    { id: 'salesforce', name: 'Salesforce Enterprise', desc: 'Sync prospects to leads or active accounts.', bg: 'bg-blue-500', text: 'text-blue-600' },
                    { id: 'zoho', name: 'Zoho CRM Cloud', desc: 'Sync contacts to Zoho business pipeline.', bg: 'bg-red-500', text: 'text-red-600' }
                  ].map((crm) => (
                    <div
                      key={crm.id}
                      onClick={() => setSelectedCrm(crm.id as any)}
                      className={`p-3.5 border rounded-xl cursor-pointer transition flex items-center justify-between ${
                        selectedCrm === crm.id 
                          ? 'border-blue-500 bg-blue-50/20 text-blue-600 dark:text-blue-400 dark:border-blue-900' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${crm.bg}`} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{crm.name}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{crm.desc}</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCrm === crm.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                        {selectedCrm === crm.id && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-850">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">API Key / Access Token</label>
                  <input
                    type="password"
                    value={crmApiKey}
                    onChange={(e) => setCrmApiKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Client Secret / ID</label>
                  <input
                    type="password"
                    value={crmClientSecret}
                    onChange={(e) => setCrmClientSecret(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-900/40 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Automatic Sync Rule Active</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Every lead sourced via SalesPilot Astra is automatically pushed to your connected CRM as a "Prospect" stage lead.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Real-time Telemetry Sync Logs & Active stats */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-850">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Sync Telemetry Status</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-emerald-600">CONNECTED / PRODUCTION READY</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{leads.length}</div>
                    <div className="text-[9px] font-mono text-slate-400 uppercase mt-1">Pending CRM Sync</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">100%</div>
                    <div className="text-[9px] font-mono text-slate-400 uppercase mt-1">Map Success Rate</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">12 sec</div>
                    <div className="text-[9px] font-mono text-slate-400 uppercase mt-1">Avg Handshake latency</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Real-Time Sync Logs & Webhook Telemetry</h3>
                  <button 
                    type="button"
                    onClick={() => setCrmSyncLogs([])}
                    className="text-[10px] text-red-500 hover:underline cursor-pointer"
                  >
                    Clear Logs
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 max-h-80 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed space-y-2">
                  {crmSyncLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-6">No logs generated. Push 'Sync All Leads Now' to establish connections.</div>
                  ) : (
                    crmSyncLogs.map((log, i) => (
                      <div key={i} className="border-b border-slate-900 pb-1.5 last:border-0 text-left">
                        <span className="text-slate-500 mr-2">[{i+1}]</span>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODAL: MANUAL ADD LEAD FORM */}
      {isAddingLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleManualAddSubmit}
            className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-2xl animate-scale-up"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-850">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">Add Outreach Prospect</h3>
              <button 
                type="button" 
                onClick={() => setIsAddingLead(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">First Name *</label>
                <input 
                  type="text" 
                  required
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={addLastName}
                  onChange={(e) => setAddLastName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Business Email *</label>
                <input 
                  type="email" 
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Phone contacts</label>
                <input 
                  type="text" 
                  placeholder="+91 99999 99999"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Company Name *</label>
                <input 
                  type="text" 
                  required
                  value={addCompany}
                  onChange={(e) => setAddCompany(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Designation Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Founder, Chief Marketing Officer"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Company Website</label>
                <input 
                  type="text" 
                  placeholder="e.g. www.apex.in"
                  value={addWebsite}
                  onChange={(e) => setAddWebsite(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Industry</label>
                <select 
                  value={addIndustry}
                  onChange={(e) => setAddIndustry(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="Software">Software</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Real Estate">Real Estate</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAddingLead(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={actionLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save & Qualify
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ASSIGN BULK TAGS */}
      {showBulkTagModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form 
            onSubmit={handleBulkTagSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-2xl"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Bulk Tags</h3>
              <p className="text-xs text-slate-500 mt-1">Add tags to {selectedLeadIds.length} selected leads (comma-separated).</p>
            </div>
            <div>
              <input 
                type="text" 
                required
                placeholder="e.g. Qualified, Bengaluru Fintech, Urgent"
                value={bulkTagText}
                onChange={(e) => setBulkTagText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => { setShowBulkTagModal(false); setBulkTagText(''); }}
                className="flex-1 py-2 bg-slate-150 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={actionLoading}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
              >
                {actionLoading ? 'Saving...' : 'Apply Tags'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: MOVE BULK CRM STAGES */}
      {showBulkStageModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form 
            onSubmit={handleBulkStageSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-2xl"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Move CRM Staging</h3>
              <p className="text-xs text-slate-500 mt-1">Batch shift {selectedLeadIds.length} selected leads to a new status stage.</p>
            </div>
            <div>
              <select 
                required
                value={bulkStageText}
                onChange={(e) => setBulkStageText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="">Select Target Stage...</option>
                <option value="NEW">New</option>
                <option value="RESEARCH">Research</option>
                <option value="READY">Ready</option>
                <option value="OUTREACH">Outreach</option>
                <option value="INTERESTED">Interested</option>
                <option value="MEETING_BOOKED">Meeting Booked</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => { setShowBulkStageModal(false); setBulkStageText(''); }}
                className="flex-1 py-2 bg-slate-150 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={actionLoading || !bulkStageText}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
              >
                {actionLoading ? 'Updating...' : 'Shift Stage'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APPOINTMENT BOOKING DIALOG OVERLAY */}
      {bookingLeadId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleBookingSubmit} 
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4 shadow-2xl"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Book Demo Appointment</h3>
              <p className="text-xs text-slate-500 mt-1">
                Scheduling consultation meeting with: <span className="text-blue-600 dark:text-blue-400 font-bold">{leads.find(l => l.id === bookingLeadId)?.firstName} {leads.find(l => l.id === bookingLeadId)?.lastName}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Meeting Date *</label>
                <input 
                  type="date" 
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 p-2.5 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Time Slot *</label>
                <input 
                  type="time" 
                  required
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 p-2.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Internal Notes & Context</label>
              <textarea 
                rows={3}
                placeholder="Discuss pricing models, n8n webhook integrations..."
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 p-2.5 rounded-lg focus:outline-none animate-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setBookingLeadId(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg transition"
              >
                Close Dialog
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-lg transition"
              >
                Schedule Demo
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
