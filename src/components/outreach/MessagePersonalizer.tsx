import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Mail, Linkedin, MessageSquare, Plus, Check, Star, 
  ChevronRight, Edit3, Save, RefreshCw, AlertCircle, FileText, ArrowRight, UserCheck, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MessagePersonalizerProps {
  onQueueApprovedMessage: (msg: any) => void;
  onSaveAsTemplate: (template: any) => void;
}

export function MessagePersonalizer({ onQueueApprovedMessage, onSaveAsTemplate }: MessagePersonalizerProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  
  // Input contexts for personalization
  const [name, setName] = useState('Ananya Sharma');
  const [jobTitle, setJobTitle] = useState('Managing Director');
  const [company, setCompany] = useState('Apex Marketing Solutions');
  const [website, setWebsite] = useState('www.apexmarketing.in');
  const [industry, setIndustry] = useState('Marketing');
  const [companySize, setCompanySize] = useState('11-50 employees');
  const [businessType, setBusinessType] = useState('B2B Enterprise');
  const [painPoints, setPainPoints] = useState('Extremely low email response rates from manual outreach sequences');
  const [country, setCountry] = useState('India');
  const [language, setLanguage] = useState('English');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any | null>(null);
  const [activeTypeTab, setActiveTypeTab] = useState('coldEmail'); // coldEmail, linkedinMessage, whatsappMessage, followUpMessage, meetingInvitation, reEngagementMessage
  const [activeVariation, setActiveVariation] = useState<'variationA' | 'variationB'>('variationA');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [approvedList, setApprovedList] = useState<string[]>([]); // Approved message keys

  // Load leads from API
  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/v1/leads');
        const data = await res.json();
        if (data && data.leads) {
          setLeads(data.leads);
        }
      } catch (err) {
        console.error('Failed to load CRM leads:', err);
      }
    }
    fetchLeads();
  }, []);

  // Pre-fill fields when selecting an existing lead
  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) return;

    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setName(`${lead.firstName} ${lead.lastName}`);
      setJobTitle(lead.title || 'Decision Maker');
      setCompany(lead.company);
      
      if (lead.enrichment) {
        setWebsite(lead.enrichment.website || '');
        setIndustry(lead.enrichment.industry || '');
        setCompanySize(lead.enrichment.companySize || '');
        setBusinessType(lead.enrichment.fundingRound ? `${lead.enrichment.fundingRound} Tech` : 'B2B Business');
        setPainPoints(Array.isArray(lead.enrichment.painPoints) 
          ? lead.enrichment.painPoints.join(', ') 
          : lead.enrichment.painPoints || ''
        );
        setCountry(lead.enrichment.country || 'India');
        setLanguage(lead.enrichment.language || 'English');
      }
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setGeneratedResults(null);
    setIsEditing(false);

    try {
      const res = await fetch('/api/v1/ai/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, jobTitle, company, website, industry, companySize,
          businessType, painPoints, country, language
        })
      });
      const data = await res.json();
      setGeneratedResults(data);
      
      // Set default text for composer
      if (data && data.coldEmail) {
        setEditedText(data.coldEmail.variationA);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTypeTab(tab);
    if (generatedResults && generatedResults[tab]) {
      setEditedText(generatedResults[tab][activeVariation]);
    }
    setIsEditing(false);
  };

  const handleVariationChange = (variation: 'variationA' | 'variationB') => {
    setActiveVariation(variation);
    if (generatedResults && generatedResults[activeTypeTab]) {
      setEditedText(generatedResults[activeTypeTab][variation]);
    }
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (generatedResults && generatedResults[activeTypeTab]) {
      generatedResults[activeTypeTab][activeVariation] = editedText;
      setIsEditing(false);
    }
  };

  const toggleFavorite = (key: string) => {
    if (favorites.includes(key)) {
      setFavorites(favorites.filter(item => item !== key));
    } else {
      setFavorites([...favorites, key]);
    }
  };

  const handleApproveMessage = () => {
    if (!generatedResults) return;
    
    const key = `${activeTypeTab}_${activeVariation}`;
    setApprovedList([...approvedList, key]);

    const msgObj = {
      leadName: name,
      company,
      channel: activeTypeTab.replace('Message', '').replace('Invitation', '').toUpperCase(),
      subject: generatedResults[activeTypeTab].subject || `Outbound to ${company}`,
      body: editedText,
      timestamp: new Date().toISOString()
    };

    onQueueApprovedMessage(msgObj);
  };

  const handleSaveAsTemplateClick = () => {
    if (!generatedResults) return;
    onSaveAsTemplate({
      title: `${activeTypeTab.toUpperCase()} - ${company} Pitch`,
      channel: activeTypeTab.includes('email') ? 'EMAIL' : activeTypeTab.includes('linkedin') ? 'LINKEDIN' : 'WHATSAPP',
      category: industry || 'SaaS',
      subject: generatedResults[activeTypeTab].subject || '',
      body: editedText
    });
  };

  return (
    <div className="space-y-6">
      {/* CRM Loader Option */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-500" />
            Integrate Lead Context
          </h3>
          <p className="text-[11px] text-slate-500">Auto-inject company insights directly from your active SalesPilot CRM leads.</p>
        </div>
        <select
          value={selectedLeadId}
          onChange={(e) => handleSelectLead(e.target.value)}
          className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none max-w-xs"
        >
          <option value="">-- Choose Lead from CRM --</option>
          {leads.map(l => (
            <option key={l.id} value={l.id}>{l.firstName} {l.lastName} ({l.company})</option>
          ))}
        </select>
      </div>

      {/* Grid containing Input Forms & Output display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wide">Prospect Context Analyzer</h3>
            <span className="text-[10px] font-mono text-slate-400">Step 1 of 2</span>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Prospect Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Job Title</label>
                <input 
                  type="text" 
                  value={jobTitle} 
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Company Name</label>
                <input 
                  type="text" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Website URL</label>
                <input 
                  type="text" 
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono text-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Industry</label>
                <input 
                  type="text" 
                  value={industry} 
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Company Size</label>
                <input 
                  type="text" 
                  value={companySize} 
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Business Type</label>
                <input 
                  type="text" 
                  value={businessType} 
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase text-slate-400">Country</label>
                  <input 
                    type="text" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase text-slate-400">Language</label>
                  <input 
                    type="text" 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-mono uppercase text-slate-400">Pain Points / Core Constraints</label>
              <textarea 
                rows={3}
                value={painPoints} 
                onChange={(e) => setPainPoints(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 leading-normal"
                placeholder="Describe current issues (e.g. low meeting bookings, CRM leaks, high CAC)"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing & Compiling with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate AI Message Set
              </>
            )}
          </button>
        </div>

        {/* Right Side: Message Generator Playground */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm flex flex-col min-h-[560px]">
          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full text-blue-600 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div className="text-center">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Writing Outreach Copysheets...</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1 max-w-xs leading-normal">Gemini is researching {company} size, website structure, and drafting hyper-relevant cold templates.</p>
              </div>
            </div>
          ) : generatedResults ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Type Selection Tabs */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wide flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    AI Outreach Playground
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleVariationChange('variationA')}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded ${
                        activeVariation === 'variationA' 
                          ? 'bg-slate-900 text-white dark:bg-slate-800' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Variation A
                    </button>
                    <button
                      onClick={() => handleVariationChange('variationB')}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded ${
                        activeVariation === 'variationB' 
                          ? 'bg-slate-900 text-white dark:bg-slate-800' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Variation B
                    </button>
                  </div>
                </div>

                {/* Sub tabs of channels */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {[
                    { id: 'coldEmail', label: 'Cold Email', icon: Mail },
                    { id: 'linkedinMessage', label: 'LinkedIn Msg', icon: Linkedin },
                    { id: 'whatsappMessage', label: 'WhatsApp Drip', icon: MessageSquare },
                    { id: 'followUpMessage', label: 'Follow Up', icon: FileText },
                    { id: 'meetingInvitation', label: 'Google Calendar Invite', icon: UserCheck },
                    { id: 'reEngagementMessage', label: 'Re-engage', icon: RefreshCw }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const active = activeTypeTab === tab.id;
                    const approved = approvedList.includes(`${tab.id}_${activeVariation}`);
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-2.5 py-1.5 text-[10px] rounded-md font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                          active 
                            ? 'bg-blue-600/10 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400 font-bold' 
                            : 'bg-transparent border-slate-150 dark:border-slate-850 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {approved && <Check className="w-3 h-3 text-emerald-500 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Subject Block (Only for email and invite) */}
                {generatedResults[activeTypeTab]?.subject && (
                  <div className="bg-slate-50 dark:bg-slate-850 p-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1">
                    <strong className="text-slate-400 uppercase text-[9px] font-mono mr-1">Subject:</strong>
                    {generatedResults[activeTypeTab].subject}
                  </div>
                )}

                {/* Content text block */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-850/50 border border-slate-250 dark:border-slate-800/80 rounded-xl p-4 min-h-[220px] relative">
                  {isEditing ? (
                    <textarea
                      rows={9}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-lg p-2.5 text-xs font-mono text-slate-950 dark:text-slate-50 leading-relaxed focus:outline-none"
                    />
                  ) : (
                    <p className="text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {editedText || generatedResults[activeTypeTab][activeVariation]}
                    </p>
                  )}

                  <div className="absolute right-3.5 bottom-3.5 flex gap-1 bg-white/80 dark:bg-slate-900/85 backdrop-blur-sm p-1 rounded-lg border border-slate-200/50 dark:border-slate-800/80">
                    {isEditing ? (
                      <button 
                        onClick={handleSaveEdit}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded transition"
                        title="Save modifications"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setIsEditing(true);
                          setEditedText(editedText || generatedResults[activeTypeTab][activeVariation]);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded transition"
                        title="Edit text"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={() => toggleFavorite(`${activeTypeTab}_${activeVariation}`)}
                      className={`p-1.5 rounded transition ${
                        favorites.includes(`${activeTypeTab}_${activeVariation}`) 
                          ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Favorite template"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action operations strip */}
              <div className="mt-5 pt-4 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSaveAsTemplateClick}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-850 flex items-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Save Template
                </button>

                <button
                  type="button"
                  onClick={handleApproveMessage}
                  disabled={approvedList.includes(`${activeTypeTab}_${activeVariation}`)}
                  className={`px-4.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow ${
                    approvedList.includes(`${activeTypeTab}_${activeVariation}`)
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer'
                  }`}
                >
                  {approvedList.includes(`${activeTypeTab}_${activeVariation}`) ? (
                    <>
                      <Check className="w-4 h-4" /> Message Approved
                    </>
                  ) : (
                    <>
                      Approve & Queue Outbox <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12 text-center text-slate-400">
              <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-850" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Outbox playground is idle</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">Configure your prospect parameters on the left and hit "Generate AI Message Set" to let Gemini build outbound campaigns.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
