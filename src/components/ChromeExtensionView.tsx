import React, { useState } from 'react';
import { Chrome, Sparkles, Download, Play, Database } from 'lucide-react';
import { Lead } from '../types';
import { ExtensionSimulator } from './extension/ExtensionSimulator';
import { ExtensionPackageTab } from './extension/ExtensionPackageTab';
import { ExtensionHistoryTab } from './extension/ExtensionHistoryTab';

interface ChromeExtensionViewProps {
  onLeadAdded?: (lead: Lead) => void;
}

export function ChromeExtensionView({ onLeadAdded }: ChromeExtensionViewProps) {
  // Simulator State
  const [targetUrl, setTargetUrl] = useState('https://www.linkedin.com/in/satya-nadella');
  const [pageType, setPageType] = useState<'linkedin' | 'website'>('linkedin');
  
  // Scraped / Detected Form State
  const [firstName, setFirstName] = useState('Satya');
  const [lastName, setLastName] = useState('Nadella');
  const [title, setTitle] = useState('Chairman & CEO');
  const [company, setCompany] = useState('Microsoft');
  const [detectedEmail, setDetectedEmail] = useState('satya.nadella@microsoft.com');
  const [emailConfidence] = useState(96);
  const [phone] = useState('+1 (425) 882-8080');
  const [website, setWebsite] = useState('microsoft.com');
  const [notes, setNotes] = useState('Key decision maker interested in AI productivity workflows.');
  const [tags, setTags] = useState<string[]>(['LinkedInLead', 'Enterprise', 'Executive']);
  const [newTagInput, setNewTagInput] = useState('');

  // AI Research State
  const [isResearching, setIsResearching] = useState(false);
  const [aiResearchResult, setAiResearchResult] = useState<any | null>(null);

  // AI Outreach State
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachChannel] = useState<'email' | 'linkedin'>('email');
  const [outreachTone] = useState<'Professional' | 'Direct' | 'Consultative'>('Professional');
  const [generatedOutreach, setGeneratedOutreach] = useState<any | null>(null);

  // CRM Sync & Duplicate State
  const [, setIsCheckingDuplicate] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Package Export State
  const [, setCopiedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'package' | 'captured-leads'>('simulator');
  const [extensionApiKey] = useState('sp_ext_key_9918237128913812');

  // Captured Leads History Log
  const [recentExtensionLeads, setRecentExtensionLeads] = useState<any[]>([
    {
      id: 'ext_1',
      name: 'Ananya Deshmukh',
      company: 'TechCorp India',
      email: 'ananya@techcorp.in',
      sourceUrl: 'https://linkedin.com/in/ananya-deshmukh',
      capturedAt: '10 mins ago',
      status: 'Saved to CRM'
    },
    {
      id: 'ext_2',
      name: 'Rohan Mehta',
      company: 'Infinia Software',
      email: 'rohan.mehta@infinia.io',
      sourceUrl: 'https://infinia.io/team',
      capturedAt: '1 hour ago',
      status: 'Saved to CRM'
    }
  ]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // URL Target Presets
  const loadPreset = (preset: 'satya' | 'stripe' | 'hubspot') => {
    if (preset === 'satya') {
      setTargetUrl('https://www.linkedin.com/in/satya-nadella');
      setPageType('linkedin');
      setFirstName('Satya');
      setLastName('Nadella');
      setTitle('Chairman & CEO');
      setCompany('Microsoft');
      setDetectedEmail('satya.nadella@microsoft.com');
      setWebsite('microsoft.com');
      setNotes('Executive lead captured from LinkedIn profile page.');
    } else if (preset === 'stripe') {
      setTargetUrl('https://stripe.com');
      setPageType('website');
      setFirstName('Patrick');
      setLastName('Collison');
      setTitle('CEO & Co-founder');
      setCompany('Stripe');
      setDetectedEmail('patrick@stripe.com');
      setWebsite('stripe.com');
      setNotes('Fintech leader. High transaction volume target.');
    } else {
      setTargetUrl('https://hubspot.com/about');
      setPageType('website');
      setFirstName('Yamini');
      setLastName('Rangan');
      setTitle('CEO');
      setCompany('HubSpot');
      setDetectedEmail('yrangan@hubspot.com');
      setWebsite('hubspot.com');
      setNotes('Marketing & CRM platform executive.');
    }
    setSaveSuccess(false);
    setDuplicateFound(null);
    setAiResearchResult(null);
    setGeneratedOutreach(null);
  };

  // Duplicate Detection Trigger
  const handleCheckDuplicate = async () => {
    setIsCheckingDuplicate(true);
    try {
      const res = await fetch(`/api/v1/extension/check-duplicate?email=${encodeURIComponent(detectedEmail)}&company=${encodeURIComponent(company)}&fullName=${encodeURIComponent(firstName + ' ' + lastName)}`);
      const data = await res.json();
      if (data.isDuplicate) {
        setDuplicateFound(data.existingLead);
        triggerToast('⚠️ Duplicate detected: Contact already exists in CRM!');
      } else {
        setDuplicateFound(null);
        triggerToast('✅ Clear: No duplicate found in CRM.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Run AI Page Research via Gemini
  const handleRunAiResearch = async () => {
    setIsResearching(true);
    try {
      const res = await fetch('/api/v1/extension/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageText: `Page URL: ${targetUrl}. Name: ${firstName} ${lastName}, Title: ${title}, Company: ${company}, Website: ${website}. Notes: ${notes}`,
          targetName: `${firstName} ${lastName}`,
          targetCompany: company
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiResearchResult(data.research);
        triggerToast('AI Page Intelligence complete!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResearching(false);
    }
  };

  // Generate AI Outreach Copy
  const handleGenerateOutreach = async () => {
    setIsGeneratingOutreach(true);
    try {
      const res = await fetch('/api/v1/extension/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName: `${firstName} ${lastName}`,
          targetCompany: company,
          title,
          channel: outreachChannel,
          tone: outreachTone
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedOutreach(data.outreach);
        triggerToast('Outreach copy generated!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // Save Contact to CRM
  const handleSaveToCrm = async (force = false) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/extension/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          title,
          company,
          email: detectedEmail,
          phone,
          linkedinUrl: pageType === 'linkedin' ? targetUrl : '',
          website,
          pageUrl: targetUrl,
          notes,
          tags,
          source: 'Chrome Extension Overlay',
          forceSave: force
        })
      });
      const data = await res.json();
      if (data.isDuplicate && !force) {
        setDuplicateFound(data.existingLead);
        triggerToast('Duplicate lead caught! Review duplicate warning.');
      } else if (data.success) {
        setSaveSuccess(true);
        setDuplicateFound(null);
        triggerToast('🎉 Contact saved directly to SalesPilot CRM!');
        
        setRecentExtensionLeads(prev => [
          {
            id: data.lead?.id || 'ext_' + Date.now(),
            name: `${firstName} ${lastName}`,
            company,
            email: detectedEmail,
            sourceUrl: targetUrl,
            capturedAt: 'Just now',
            status: 'Saved to CRM'
          },
          ...prev
        ]);

        if (onLeadAdded && data.lead) {
          onLeadAdded(data.lead);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    triggerToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-indigo-500 text-white text-xs font-mono px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Chrome className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold font-mono text-white uppercase tracking-tight">
              Chrome Extension SDR Mode
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              MANIFEST V3 READY
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Capture LinkedIn prospects, detect verified business emails, run AI page research, and sync contacts into SalesPilot CRM in 1 click.
          </p>
        </div>

        {/* MODE NAVIGATION TABS */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Extension Overlay Simulator
          </button>

          <button
            onClick={() => setActiveTab('package')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'package'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Manifest V3 Package
          </button>

          <button
            onClick={() => setActiveTab('captured-leads')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'captured-leads'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Captured Leads ({recentExtensionLeads.length})
          </button>
        </div>
      </div>

      {/* TAB 1: EXTENSION SIMULATOR */}
      {activeTab === 'simulator' && (
        <ExtensionSimulator
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          pageType={pageType}
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          title={title}
          setTitle={setTitle}
          company={company}
          setCompany={setCompany}
          detectedEmail={detectedEmail}
          setDetectedEmail={setDetectedEmail}
          emailConfidence={emailConfidence}
          phone={phone}
          website={website}
          notes={notes}
          setNotes={setNotes}
          tags={tags}
          newTagInput={newTagInput}
          setNewTagInput={setNewTagInput}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          loadPreset={loadPreset}
          handleCheckDuplicate={handleCheckDuplicate}
          duplicateFound={duplicateFound}
          saveSuccess={saveSuccess}
          isSaving={isSaving}
          handleSaveToCrm={handleSaveToCrm}
          isResearching={isResearching}
          handleRunAiResearch={handleRunAiResearch}
          aiResearchResult={aiResearchResult}
          isGeneratingOutreach={isGeneratingOutreach}
          handleGenerateOutreach={handleGenerateOutreach}
          generatedOutreach={generatedOutreach}
        />
      )}

      {/* TAB 2: MANIFEST PACKAGE */}
      {activeTab === 'package' && (
        <ExtensionPackageTab
          extensionApiKey={extensionApiKey}
          copyToClipboard={copyToClipboard}
        />
      )}

      {/* TAB 3: CAPTURED LEADS HISTORY */}
      {activeTab === 'captured-leads' && (
        <ExtensionHistoryTab recentExtensionLeads={recentExtensionLeads} />
      )}
    </div>
  );
}
