import React from 'react';
import { 
  Globe, Search, CheckCircle2, Chrome, AlertTriangle, Database, Sparkles, Zap
} from 'lucide-react';

interface ExtensionSimulatorProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  pageType: 'linkedin' | 'website';
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  company: string;
  setCompany: (val: string) => void;
  detectedEmail: string;
  setDetectedEmail: (val: string) => void;
  emailConfidence: number;
  phone: string;
  website: string;
  notes: string;
  setNotes: (val: string) => void;
  tags: string[];
  newTagInput: string;
  setNewTagInput: (val: string) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  loadPreset: (preset: 'satya' | 'stripe' | 'hubspot') => void;
  handleCheckDuplicate: () => void;
  duplicateFound: any;
  saveSuccess: boolean;
  isSaving: boolean;
  handleSaveToCrm: (force?: boolean) => void;
  isResearching: boolean;
  handleRunAiResearch: () => void;
  aiResearchResult: any;
  isGeneratingOutreach: boolean;
  handleGenerateOutreach: () => void;
  generatedOutreach: any;
}

export function ExtensionSimulator({
  targetUrl,
  setTargetUrl,
  pageType,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  title,
  setTitle,
  company,
  setCompany,
  detectedEmail,
  setDetectedEmail,
  emailConfidence,
  website,
  notes,
  setNotes,
  tags,
  newTagInput,
  setNewTagInput,
  handleAddTag,
  handleRemoveTag,
  loadPreset,
  handleCheckDuplicate,
  duplicateFound,
  saveSuccess,
  isSaving,
  handleSaveToCrm,
  isResearching,
  handleRunAiResearch,
  aiResearchResult,
  isGeneratingOutreach,
  handleGenerateOutreach,
  generatedOutreach
}: ExtensionSimulatorProps) {
  return (
    <div className="space-y-4">
      {/* SIMULATED BROWSER TOP BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          <span className="text-slate-500 ml-2">Browser Window Simulator</span>
        </div>

        {/* PRESET PICKER */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Presets:</span>
          <button
            onClick={() => loadPreset('satya')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] cursor-pointer"
          >
            LinkedIn: Satya Nadella
          </button>
          <button
            onClick={() => loadPreset('stripe')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] cursor-pointer"
          >
            Website: Stripe.com
          </button>
          <button
            onClick={() => loadPreset('hubspot')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] cursor-pointer"
          >
            Website: HubSpot
          </button>
        </div>
      </div>

      {/* ADDRESS BAR */}
      <div className="bg-slate-950 border-x border-b border-slate-800 p-2 flex items-center gap-2">
        <Globe className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-indigo-400 font-mono"
        />
        <button
          onClick={handleCheckDuplicate}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400" /> Duplicate Check
        </button>
      </div>

      {/* SIMULATED WEB PAGE WITH FLOATING EXTENSION SIDE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[550px]">
        {/* LEFT 2 COLS: MOCK TARGET WEB PAGE */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-4 right-4 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-mono text-slate-400">
            Active Browser Tab Contents
          </div>

          {pageType === 'linkedin' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl font-mono shadow-xl">
                  {firstName[0]}
                  {lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {firstName} {lastName}
                    <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                  </h2>
                  <p className="text-xs text-slate-300 font-mono">{title} at {company}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Greater Seattle Area • 500+ Connections</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase">About Profile</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  Empowering every person and every organization on the planet to achieve more. Focused on generative AI transformation, cloud infrastructure, and enterprise productivity software tools.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase">Experience</h4>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-white block">{company}</span>
                  <span className="text-slate-400 text-[11px] block">{title} • Feb 2014 - Present</span>
                  <p className="text-slate-500 text-[11px]">Leading global strategy, cloud computing, and AI platform innovation.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-6">
                <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase rounded">
                  Company Website
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">{company} ({website})</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Financial infrastructure for the internet. Millions of companies rely on Stripe software to accept payments online.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Headquarters</span>
                  <span className="text-white font-bold">San Francisco, CA</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Employees</span>
                  <span className="text-white font-bold">7,000+ Team Members</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>SalesPilot Extension Script Active</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Auto-Detecting Page Elements
            </span>
          </div>
        </div>

        {/* RIGHT 1 COL: CHROME EXTENSION SIDE PANEL POPUP */}
        <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-4 space-y-4 shadow-2xl relative flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <Chrome className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-white">SalesPilot SDR</h3>
                <span className="text-[9px] text-emerald-400 font-mono">Status: Connected to CRM</span>
              </div>
            </div>

            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-mono font-bold">
              v2.4
            </span>
          </div>

          {duplicateFound && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs space-y-1 text-rose-400 font-mono">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> Duplicate Found in CRM
              </div>
              <p className="text-[10px] text-rose-300">
                "{duplicateFound.fullName}" ({duplicateFound.company}) already exists.
              </p>
              <button
                onClick={() => handleSaveToCrm(true)}
                className="mt-1 w-full py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded transition cursor-pointer"
              >
                Force Save Duplicate
              </button>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1 text-emerald-400 font-mono">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Contact Saved to CRM!
              </div>
              <p className="text-[10px] text-emerald-300">
                {firstName} {lastName} was synced to your Lead Engine.
              </p>
            </div>
          )}

          <div className="space-y-2.5 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] text-slate-400">Detected Email</label>
                <span className="text-[9px] text-emerald-400 font-bold">{emailConfidence}% Verified</span>
              </div>
              <input
                type="text"
                value={detectedEmail}
                onChange={(e) => setDetectedEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-emerald-400 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Tags</label>
              <div className="flex flex-wrap gap-1 mb-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-[9px] flex items-center gap-1"
                  >
                    {t}
                    <button onClick={() => handleRemoveTag(t)} className="hover:text-rose-400">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-white"
                />
                <button
                  onClick={handleAddTag}
                  className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Prospect Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-[11px]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => handleSaveToCrm(false)}
              disabled={isSaving}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-mono text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              {isSaving ? 'Syncing to CRM...' : '1-Click Save Contact to CRM'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRunAiResearch}
                disabled={isResearching}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono text-[10px] font-bold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                {isResearching ? 'Analyzing...' : 'AI Page Research'}
              </button>

              <button
                onClick={handleGenerateOutreach}
                disabled={isGeneratingOutreach}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] font-bold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                {isGeneratingOutreach ? 'Writing...' : 'Generate Pitch'}
              </button>
            </div>
          </div>

          {aiResearchResult && (
            <div className="p-3 bg-slate-950 border border-purple-500/30 rounded-xl space-y-1.5 text-[10px] font-mono">
              <span className="font-bold text-purple-400 block uppercase">
                AI Research Summary (ICP Score: {aiResearchResult.icpMatchScore}/100):
              </span>
              <p className="text-slate-300">{aiResearchResult.summary}</p>
              <p className="text-amber-300">
                <strong>Suggested Hook:</strong> "{aiResearchResult.suggestedHook}"
              </p>
            </div>
          )}

          {generatedOutreach && (
            <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl space-y-1.5 text-[10px] font-mono">
              <span className="font-bold text-amber-400 block uppercase">Generated Pitch:</span>
              {generatedOutreach.subject && (
                <p className="text-white font-bold">Subject: {generatedOutreach.subject}</p>
              )}
              <p className="text-slate-300 whitespace-pre-line">{generatedOutreach.body}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
