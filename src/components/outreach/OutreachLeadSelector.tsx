import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, CheckSquare, Square, Users, Mail, Building, 
  Send, Plus, ChevronDown, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight
} from 'lucide-react';
import { Lead } from '../../types';

interface OutreachLeadSelectorProps {
  leads: Lead[];
  campaigns?: any[];
  selectedLeadIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onAddToCampaign?: (selectedIds: string[], campaignId: string) => Promise<void> | void;
  onCreateCampaignWithLeads?: (selectedIds: string[]) => void;
  isLoading?: boolean;
}

export function OutreachLeadSelector({
  leads,
  campaigns = [],
  selectedLeadIds,
  onSelectionChange,
  onAddToCampaign,
  onCreateCampaignWithLeads,
  isLoading = false
}: OutreachLeadSelectorProps) {
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedOutreachFilter, setSelectedOutreachFilter] = useState('ALL'); // ALL, NOT_CONTACTED, CONTACTED, REPLIED, INTERESTED
  const [selectedTargetCampaignId, setSelectedTargetCampaignId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase();
        const company = (lead.company || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const title = (lead.title || '').toLowerCase();
        if (!fullName.includes(q) && !company.includes(q) && !email.includes(q) && !title.includes(q)) {
          return false;
        }
      }

      // 2. Campaign Filter
      if (selectedCampaignFilter !== 'ALL') {
        if (selectedCampaignFilter === 'UNASSIGNED') {
          if (lead.campaignId) return false;
        } else {
          if (lead.campaignId !== selectedCampaignFilter) return false;
        }
      }

      // 3. Lead Status Filter
      if (selectedStatusFilter !== 'ALL') {
        if (lead.status !== selectedStatusFilter) return false;
      }

      // 4. Outreach Status Filter
      if (selectedOutreachFilter !== 'ALL') {
        const st = (lead.status || '').toUpperCase();
        if (selectedOutreachFilter === 'NOT_CONTACTED') {
          if (['CONTACTED', 'OUTREACH', 'INTERESTED', 'MEETING_BOOKED', 'WON'].includes(st)) return false;
        } else if (selectedOutreachFilter === 'CONTACTED') {
          if (!['CONTACTED', 'OUTREACH'].includes(st)) return false;
        } else if (selectedOutreachFilter === 'REPLIED') {
          if (!['INTERESTED', 'MEETING_BOOKED', 'QUALIFIED'].includes(st) && !lead.notesList?.some(n => n.text?.toLowerCase().includes('reply'))) return false;
        } else if (selectedOutreachFilter === 'INTERESTED') {
          if (st !== 'INTERESTED' && st !== 'MEETING_BOOKED' && st !== 'QUALIFIED') return false;
        }
      }

      return true;
    });
  }, [leads, searchQuery, selectedCampaignFilter, selectedStatusFilter, selectedOutreachFilter]);

  // Selection handlers
  const isAllFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered leads
      const filteredIdSet = new Set(filteredLeads.map(l => l.id));
      onSelectionChange(selectedLeadIds.filter(id => !filteredIdSet.has(id)));
    } else {
      // Select all filtered leads
      const mergedSet = new Set([...selectedLeadIds, ...filteredLeads.map(l => l.id)]);
      onSelectionChange(Array.from(mergedSet));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      onSelectionChange(selectedLeadIds.filter(item => item !== id));
    } else {
      onSelectionChange([...selectedLeadIds, id]);
    }
  };

  const handleBulkAddToCampaign = async () => {
    if (!selectedTargetCampaignId || selectedLeadIds.length === 0) return;
    setIsAdding(true);
    setAddMessage('');
    try {
      if (onAddToCampaign) {
        await onAddToCampaign(selectedLeadIds, selectedTargetCampaignId);
        setAddMessage(`Successfully linked ${selectedLeadIds.length} leads to campaign.`);
        setTimeout(() => setAddMessage(''), 4000);
      }
    } catch (err: any) {
      setAddMessage(`Failed: ${err.message || err}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top Controls: Search + Filter Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, company, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Campaign Filter */}
          <select
            value={selectedCampaignFilter}
            onChange={(e) => setSelectedCampaignFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-medium"
          >
            <option value="ALL">All Campaigns</option>
            <option value="UNASSIGNED">Unassigned Leads</option>
            {campaigns.map((c: any) => (
              <option key={c.id || c.campaignId} value={c.id || c.campaignId}>
                {c.name || c.campaignName || 'Campaign'}
              </option>
            ))}
          </select>

          {/* Lead Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-medium"
          >
            <option value="ALL">All CRM Stages</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="INTERESTED">Interested</option>
            <option value="MEETING_BOOKED">Meeting Booked</option>
            <option value="WON">Closed Won</option>
            <option value="LOST">Lost</option>
          </select>

          {/* Outreach Status Filter */}
          <select
            value={selectedOutreachFilter}
            onChange={(e) => setSelectedOutreachFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-medium"
          >
            <option value="ALL">All Outreach Statuses</option>
            <option value="NOT_CONTACTED">Not Contacted</option>
            <option value="CONTACTED">Contacted</option>
            <option value="REPLIED">Replied</option>
            <option value="INTERESTED">Interested / Positive</option>
          </select>
        </div>
      </div>

      {/* Action Bar with Selection Counter & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer disabled:opacity-40"
          >
            {isAllFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            {isAllFilteredSelected ? 'Deselect All' : 'Select All Filtered'}
          </button>

          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-900/50">
            {selectedLeadIds.length} lead{selectedLeadIds.length === 1 ? '' : 's'} selected
          </span>
          
          <span className="text-[11px] text-slate-400">
            (Showing {filteredLeads.length} of {leads.length} leads)
          </span>
        </div>

        {/* Action Buttons for Selected Leads */}
        {selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-2">
            {campaigns.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedTargetCampaignId}
                  onChange={(e) => setSelectedTargetCampaignId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">Select Target Campaign...</option>
                  {campaigns.map((c: any) => (
                    <option key={c.id || c.campaignId} value={c.id || c.campaignId}>
                      {c.name || c.campaignName || 'Campaign'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleBulkAddToCampaign}
                  disabled={!selectedTargetCampaignId || isAdding}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isAdding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add to Campaign
                </button>
              </div>
            )}

            {onCreateCampaignWithLeads && (
              <button
                type="button"
                onClick={() => onCreateCampaignWithLeads(selectedLeadIds)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                Start Outreach with Selected
              </button>
            )}
          </div>
        )}
      </div>

      {addMessage && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {addMessage}
        </div>
      )}

      {/* Leads List Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" /> Loading leads...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 rounded-xl text-slate-500 text-xs">
          No leads match your current search and filter criteria.
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredLeads.map((lead) => {
            const isSelected = selectedLeadIds.includes(lead.id);
            return (
              <div
                key={lead.id}
                onClick={() => toggleSelectLead(lead.id)}
                className={`pt-1.5 flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition text-xs ${
                  isSelected 
                    ? 'bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 shadow-2xs' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-850/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {lead.firstName} {lead.lastName}
                      </span>
                      {lead.title && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          • {lead.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" /> {lead.company}
                      </span>
                      {lead.email && (
                        <span className="font-mono text-slate-500 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    lead.status === 'NEW' 
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' 
                      : lead.status === 'CONTACTED' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : lead.status === 'QUALIFIED' || lead.status === 'INTERESTED'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {lead.status || 'NEW'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
