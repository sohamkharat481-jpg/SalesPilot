import React, { useState } from 'react';
import { 
  Search, Mail, Linkedin, MessageSquare, Phone, Copy, Check, 
  ChevronRight, Plus, FolderHeart, Star, Edit, Trash
} from 'lucide-react';

interface TemplateLibraryProps {
  customTemplates: any[];
  onAddNewCustomTemplate: (template: any) => void;
}

const defaultTemplates = [
  {
    id: 't1',
    title: 'The "Problem Solver" Framework',
    channel: 'EMAIL',
    category: 'SaaS',
    subject: 'A better way to solve {pain_point} at {company}',
    body: "Hi {first_name},\n\nI noticed you are managing things as {title} at {company}.\n\nMany companies in {industry} struggle with {pain_point}, which wastes hours of productive engineering time.\n\nWe built SalesPilot to solve exactly this constraint. Would you be open to a 10-minute preview next Tuesday?\n\nWarmly,\nSoham Kharat",
    rating: 4.9
  },
  {
    id: 't2',
    title: 'LinkedIn "Soft Connect" Outreach',
    channel: 'LINKEDIN',
    category: 'Marketing Agency',
    subject: '',
    body: "Hi {first_name}, loved {company}'s focus on high-ticket client acquisition campaigns in India. As {title}, do you guys face challenges with scale or deliverability? Let's connect and share insights.",
    rating: 4.8
  },
  {
    id: 't3',
    title: 'WhatsApp Conversational Ping',
    channel: 'WHATSAPP',
    category: 'Technology',
    subject: '',
    body: "Hi {first_name}! Soham from SalesPilot here. I was impressed by {company}'s website and wanted to check if you are still looking to automate your outbound sequences? Open to a 5-minute sync this week?",
    rating: 4.7
  },
  {
    id: 't4',
    title: 'B2B Agency Growth Script',
    channel: 'EMAIL',
    category: 'Marketing Agency',
    subject: 'Outbound pipeline review for {company}',
    body: "Hey {first_name},\n\nI was looking at {company}'s branding portfolios on Behance/LinkedIn and noticed you guys are scaling fast.\n\nAt your size, manual sequence creation is likely causing outbound bottlenecks. We helped a similar agency scale to ₹20 Lakh in bookings using AI automation.\n\nLet me know if we can share our 3-step playbook. Open for a call next week?\n\nBest,\nSoham",
    rating: 4.9
  },
  {
    id: 't5',
    title: 'Talent Sourcing Invitation',
    channel: 'LINKEDIN',
    category: 'Recruitment',
    subject: '',
    body: "Hi {first_name}, your profile as {title} at {company} stands out. We are expanding our senior engineering division and looking for builders of automated orchestration engines. Would love to connect and share details.",
    rating: 4.6
  },
  {
    id: 't6',
    title: 'Property Pitch Follow Up',
    channel: 'WHATSAPP',
    category: 'Real Estate',
    subject: '',
    body: "Hello {first_name}! Just wanted to follow up on our last conversation regarding prime office plots in Bangalore. We have 2 slots remaining with custom flexible pricing. Let me know if you would like me to lock a site-visit slot.",
    rating: 4.8
  }
];

export function TemplateLibrary({ customTemplates, onAddNewCustomTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for creating custom templates
  const [showCreator, setShowCreator] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState('EMAIL');
  const [newCategory, setNewCategory] = useState('SaaS');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');

  const allTemplates = [...defaultTemplates, ...customTemplates];

  const filtered = allTemplates.filter(t => {
    const matchesChannel = selectedChannelFilter === 'ALL' || t.channel === selectedChannelFilter;
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'EMAIL': return <Mail className="w-3.5 h-3.5 text-blue-500" />;
      case 'LINKEDIN': return <Linkedin className="w-3.5 h-3.5 text-indigo-500" />;
      case 'WHATSAPP': return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Phone className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBody) return;

    onAddNewCustomTemplate({
      id: `custom_${Date.now()}`,
      title: newTitle,
      channel: newChannel,
      category: newCategory,
      subject: newSubject,
      body: newBody,
      rating: 5.0
    });

    // Reset states
    setNewTitle('');
    setNewSubject('');
    setNewBody('');
    setShowCreator(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Filter Block */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5 self-start">
          <button
            onClick={() => setSelectedChannelFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${selectedChannelFilter === 'ALL' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            All Channels
          </button>
          <button
            onClick={() => setSelectedChannelFilter('EMAIL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${selectedChannelFilter === 'EMAIL' ? 'bg-blue-600/10 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button
            onClick={() => setSelectedChannelFilter('LINKEDIN')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${selectedChannelFilter === 'LINKEDIN' ? 'bg-indigo-600/10 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
          </button>
          <button
            onClick={() => setSelectedChannelFilter('WHATSAPP')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${selectedChannelFilter === 'WHATSAPP' ? 'bg-emerald-600/10 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none w-full md:w-56 font-medium"
            />
          </div>

          <button
            onClick={() => setShowCreator(!showCreator)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Template
          </button>
        </div>
      </div>

      {/* Custom template writer modal overlay */}
      {showCreator && (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 p-5 rounded-xl space-y-4 animate-slide-in max-w-2xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wide flex items-center gap-1">
              <FolderHeart className="w-4 h-4 text-rose-500" /> Write Custom Template
            </h3>
            <button onClick={() => setShowCreator(false)} className="text-xs text-slate-400 hover:text-slate-600 font-mono">Close</button>
          </div>

          <form onSubmit={handleCreateCustom} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Template Title</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Agency Quick Bump"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Outbound Channel</label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="EMAIL">Email Sequence</option>
                  <option value="LINKEDIN">LinkedIn DM</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Sector Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="SaaS">SaaS Startup</option>
                  <option value="Marketing Agency">Marketing Agency</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Recruitment">Recruitment</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>
            </div>

            {newChannel === 'EMAIL' && (
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-slate-400">Email Subject Line</label>
                <input 
                  type="text" 
                  value={newSubject} 
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Quick question regarding scaling {company}"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[9px] font-mono uppercase text-slate-400">Template Body (Supported tags: {'{first_name}'}, {'{company}'}, {'{title}'}, {'{industry}'}, {'{pain_point}'})</label>
              <textarea
                rows={5}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Write outbound copywriting templates..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono leading-normal text-slate-950 dark:text-slate-50 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow"
            >
              <Check className="w-4 h-4" /> Save Template to My Vault
            </button>
          </form>
        </div>
      )}

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((t) => (
          <div key={t.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3.5">
            <div>
              {/* Header card info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {getChannelIcon(t.channel)}
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400">{t.channel}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[9px] font-mono font-bold">
                  {t.category}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{t.title}</h4>
              
              {t.subject && (
                <div className="text-[10px] text-slate-500 line-clamp-1 font-semibold mt-1 bg-slate-50 dark:bg-slate-850 p-1 px-2 rounded">
                  <strong className="text-[9px] font-mono text-slate-400 mr-1">SUBJ:</strong> {t.subject}
                </div>
              )}

              <p className="text-xs text-slate-500 line-clamp-5 mt-2 font-mono leading-relaxed whitespace-pre-wrap bg-slate-50/40 dark:bg-slate-950/20 p-2 rounded-lg">
                {t.body}
              </p>
            </div>

            {/* Actions panel */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5">
              <span className="text-[10px] text-amber-500 font-mono font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> {t.rating} rating
              </span>

              <button
                type="button"
                onClick={() => handleCopy(t.id, t.body)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                  copiedId === t.id
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-slate-900 text-white hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                {copiedId === t.id ? (
                  <>
                    <Check className="w-3 h-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Copy
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
