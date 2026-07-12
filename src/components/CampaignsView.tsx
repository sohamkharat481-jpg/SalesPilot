import React, { useState } from 'react';
import { 
  Plus, Play, Pause, Layers, Sparkles, Loader2, Mail, 
  Linkedin, ArrowRight, Trash2, Edit3, Settings, Share2, PlusCircle 
} from 'lucide-react';
import { Campaign, SequenceStep, CampaignStatus, SequenceType } from '../types';

interface CampaignsViewProps {
  campaigns: Campaign[];
  onAddCampaign: (campaignData: Partial<Campaign>) => Promise<void>;
  onGenerateAISequence: (campaignName: string, targetAudience: string) => Promise<SequenceStep[]>;
}

export function CampaignsView({ campaigns, onAddCampaign, onGenerateAISequence }: CampaignsViewProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(campaigns[0]?.id || null);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // New Campaign Form State
  const [campaignName, setCampaignName] = useState('');
  const [targetAudience, setTargetAudience] = useState<'MARKETING_AGENCY' | 'SAAS' | 'IT_COMPANY' | 'WEB_DEV' | 'REAL_ESTATE' | 'RECRUITMENT' | 'GENERAL'>('MARKETING_AGENCY');
  const [campaignSteps, setCampaignSteps] = useState<SequenceStep[]>([]);

  // Manual Step Form State
  const [newStepType, setNewStepType] = useState<SequenceType>('EMAIL');
  const [newStepSubject, setNewStepSubject] = useState('');
  const [newStepBody, setNewStepBody] = useState('');
  const [newStepDelay, setNewStepDelay] = useState(2);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const triggerAIGenerator = async () => {
    if (!campaignName) return;
    setIsGeneratingAI(true);
    try {
      const generated = await onGenerateAISequence(campaignName, targetAudience);
      setCampaignSteps(generated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addManualStep = () => {
    const nextNum = campaignSteps.length + 1;
    const newStep: SequenceStep = {
      id: `step_man_${Date.now()}_${nextNum}`,
      stepNumber: nextNum,
      type: newStepType,
      subject: newStepType === 'EMAIL' ? newStepSubject : undefined,
      bodyTemplate: newStepBody || 'Hey {first_name},\n\nWould love to catch up.',
      delayDays: newStepDelay
    };

    setCampaignSteps([...campaignSteps, newStep]);
    setNewStepSubject('');
    setNewStepBody('');
    setNewStepDelay(2);
  };

  const removeStep = (index: number) => {
    const updated = campaignSteps.filter((_, idx) => idx !== index).map((step, idx) => ({
      ...step,
      stepNumber: idx + 1
    }));
    setCampaignSteps(updated);
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName) return;

    await onAddCampaign({
      name: campaignName,
      targetAudience,
      steps: campaignSteps
    });

    setCampaignName('');
    setTargetAudience('MARKETING_AGENCY');
    setCampaignSteps([]);
    setIsCreatingCampaign(false);
  };

  return (
    <div id="campaigns_view" className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Left Column: Campaigns Hub List */}
      <div className="xl:col-span-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Outbound Sequences</h3>
          <button 
            onClick={() => setIsCreatingCampaign(!isCreatingCampaign)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Start Campaign
          </button>
        </div>

        <div className="space-y-3">
          {campaigns.map((camp) => (
            <div 
              key={camp.id}
              onClick={() => {
                setSelectedCampaignId(camp.id);
                setIsCreatingCampaign(false);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedCampaignId === camp.id && !isCreatingCampaign
                  ? 'bg-white border-blue-500 shadow-sm stripe-glow' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-relaxed">{camp.name}</h4>
                  <span className="text-[10px] font-mono text-slate-500 block mt-1">
                    Audience: <span className="text-slate-700 font-semibold">{camp.targetAudience}</span>
                  </span>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                  camp.status === 'ACTIVE' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' 
                    : 'bg-slate-100 text-slate-500 border-slate-200 font-bold'
                }`}>
                  {camp.status}
                </span>
              </div>

              {/* Stats benchmarks */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center font-mono">
                <div>
                  <span className="block text-[9px] text-slate-500">SENT</span>
                  <span className="text-xs font-bold text-slate-900">{camp.totalSent}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500">OPEN RATE</span>
                  <span className="text-xs font-bold text-blue-600">
                    {camp.totalSent > 0 ? `${Math.round((camp.totalOpened / camp.totalSent) * 100)}%` : '0%'}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500">REPLIED</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {camp.totalSent > 0 ? `${Math.round((camp.totalReplied / camp.totalSent) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Dynamic Editor Screen */}
      <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
        
        {/* VIEW 1: CREATING A NEW CAMPAIGN */}
        {isCreatingCampaign ? (
          <form onSubmit={handleCreateCampaignSubmit} className="space-y-6">
            <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Configure Outreach Campaign</h3>
                <p className="text-xs text-slate-500 mt-1">Design an outbound campaign with custom AI email sequences.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreatingCampaign(false)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>

            {/* Config metadata fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Campaign Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bangalore Marketing Agencies Outbound"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 p-2.5 rounded-lg focus:outline-none focus:bg-white focus:border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Target Audience Profile *</label>
                <select 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 p-2.5 rounded-lg focus:outline-none focus:bg-white focus:border-slate-300"
                >
                  <option value="MARKETING_AGENCY">Marketing Agencies</option>
                  <option value="SAAS">SaaS Startup Companies</option>
                  <option value="IT_COMPANY">IT Infrastructure Firms</option>
                  <option value="WEB_DEV">Web Design Studios</option>
                  <option value="REAL_ESTATE">Premium Real Estate Brokers</option>
                  <option value="RECRUITMENT">Headhunting / Recruitment Agencies</option>
                  <option value="GENERAL">General B2B Outreach</option>
                </select>
              </div>
            </div>

            {/* AI Auto personalizer option */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Autowrite Sequence with Gemini
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Let AI read the campaign details and generate high-converting email copy templates.</p>
              </div>
              <button 
                type="button" 
                onClick={triggerAIGenerator}
                disabled={isGeneratingAI || !campaignName}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold rounded-lg flex items-center gap-1.5 self-stretch sm:self-auto justify-center transition"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-blue-600" /> AI Autowrite
                  </>
                )}
              </button>
            </div>

            {/* List of current steps in sequence */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Campaign Drip Sequence Steps ({campaignSteps.length})</h4>
              
              <div className="space-y-3">
                {campaignSteps.map((step, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-bold">
                          STEP {step.stepNumber}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1">
                          {step.type === 'EMAIL' ? <Mail className="w-3 h-3 text-slate-400" /> : <Linkedin className="w-3 h-3 text-blue-600" />}
                          {step.type}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (Delay: {step.delayDays} days)
                        </span>
                      </div>
                      {step.subject && (
                        <div className="text-xs text-slate-900 font-semibold">Subject: {step.subject}</div>
                      )}
                      <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed mt-2 line-clamp-3 bg-white p-2.5 rounded-lg border border-slate-200">
                        {step.bodyTemplate}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeStep(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Block to add manual steps */}
              <div className="p-4 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl space-y-3">
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Insert Manual Sequence Step</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={newStepType}
                    onChange={(e) => setNewStepType(e.target.value as any)}
                    className="col-span-1 bg-white border border-slate-200 text-xs text-slate-900 p-2.5 rounded-lg focus:outline-none"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="LINKEDIN_MESSAGE">LinkedIn Message</option>
                  </select>
                  <input 
                    type="number" 
                    placeholder="Delay days"
                    value={newStepDelay}
                    onChange={(e) => setNewStepDelay(Number(e.target.value))}
                    className="col-span-1 bg-white border border-slate-200 text-xs text-slate-900 p-2.5 rounded-lg focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={addManualStep}
                    className="col-span-1 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                </div>

                {newStepType === 'EMAIL' && (
                  <input 
                    type="text" 
                    placeholder="Email Subject Subject template (supports {company})"
                    value={newStepSubject}
                    onChange={(e) => setNewStepSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-900 p-2.5 rounded-lg focus:outline-none"
                  />
                )}

                <textarea 
                  rows={3}
                  placeholder="Type message body template here. Supports {first_name}, {company}, {title}, etc."
                  value={newStepBody}
                  onChange={(e) => setNewStepBody(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs text-slate-900 p-2.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg transition shadow-sm"
            >
              Compile & Save Outreach Campaign
            </button>
          </form>
        ) : (
          /* VIEW 2: DISPLAYING SELECTED ACTIVE CAMPAIGN */
          selectedCampaign ? (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{selectedCampaign.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Audience target profile: <span className="text-blue-600 font-semibold">{selectedCampaign.targetAudience}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                    selectedCampaign.status === 'ACTIVE' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {selectedCampaign.status}
                  </span>
                </div>
              </div>

              {/* Display list of active steps */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Outbound Sequence Sequence Pipeline</h4>
                
                {selectedCampaign.steps && selectedCampaign.steps.length > 0 ? (
                  <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {selectedCampaign.steps.map((step, idx) => (
                      <div key={idx} className="relative pl-10">
                        {/* Bullet step dot */}
                        <div className="absolute left-[9px] top-1.5 w-[18px] h-[18px] rounded-full bg-white border-2 border-slate-300 text-[10px] font-mono flex items-center justify-center font-bold text-slate-600">
                          {idx + 1}
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-600 flex items-center gap-1 font-semibold">
                              {step.type === 'EMAIL' ? <Mail className="w-3.5 h-3.5 text-slate-400" /> : <Linkedin className="w-3.5 h-3.5 text-blue-600" />}
                              {step.type} Outreach
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Delay: {step.delayDays === 0 ? 'Immediate (0d)' : `Wait ${step.delayDays} days`}
                            </span>
                          </div>

                          {step.subject && (
                            <div className="text-xs text-slate-900 font-semibold">Subject: <span className="text-slate-600 font-normal">{step.subject}</span></div>
                          )}

                          <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-lg border border-slate-100 font-sans">
                            {step.bodyTemplate}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 font-mono">
                    This campaign does not have outreach steps. Click Add Campaign above to construct sequences.
                  </div>
                )}
              </div>

              {/* Active integration info */}
              <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600">
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Automation Node</span>
                <p className="leading-relaxed">
                  Campaign runs are processed through our full-stack server endpoints, compatible with <strong>n8n workflows</strong> for automated webhook triggering and lead synchronization.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center text-xs text-slate-400">
              Select or start a campaign outbound sequence from the directory panel to begin automation edits.
            </div>
          )
        )}
      </div>
    </div>
  );
}
