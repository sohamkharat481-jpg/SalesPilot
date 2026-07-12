import React, { useState } from 'react';
import { 
  Sparkles, Check, Send, ShieldAlert, AlertCircle, RefreshCw, 
  Calendar, Clock, UserCheck, MessageSquare, ArrowRight, ShieldCheck, Mail
} from 'lucide-react';

interface ReplyAnalyzerProps {
  onLogCRMMeeting: (meeting: any) => void;
}

const sampleReplies = [
  {
    label: "Interested Reply",
    text: "Hi Soham, yes, this sounds very interesting. We are actually facing low responses from our current campaigns. Can we schedule a 10-minute demo on Tuesday morning? Share your calendar link."
  },
  {
    label: "Out of Office Reply",
    text: "Thank you for your email. I am currently out of the office on annual leave returning July 15th. I will have limited access to my emails during this time. For urgent queries, contact support@enterprise.com."
  },
  {
    label: "Not Interested Reply",
    text: "Hi, please unsubscribe me from your mailing list. We are not looking for outbound services at this time, we do all marketing in-house. Thanks."
  },
  {
    label: "Request Callback Reply",
    text: "Please call me back at +91 98765 43210. I am interested but traveling. Thursday around 3 PM is perfect."
  }
];

export function ReplyAnalyzer({ onLogCRMMeeting }: ReplyAnalyzerProps) {
  const [replyText, setReplyText] = useState(sampleReplies[0].text);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [isMeetingBooked, setIsMeetingBooked] = useState(false);
  const [leadName, setLeadName] = useState('Ananya Sharma');
  const [company, setCompany] = useState('Apex Marketing Solutions');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsMeetingBooked(false);
    setSelectedSlot('');
    try {
      const res = await fetch('/api/v1/ai/analyze-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookMeeting = () => {
    if (!selectedSlot || !analysisResult) return;
    setIsMeetingBooked(true);

    const meetingObj = {
      leadName,
      company,
      timeSlot: selectedSlot,
      agenda: `SalesPilot Demo: resolving ${analysisResult.category} reply requirements.`
    };

    onLogCRMMeeting(meetingObj);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Interested':
      case 'Request Callback':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'Not Interested':
      case 'Spam':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50';
      case 'Out of Office':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50';
      case 'Wrong Contact':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Reply Input Box */}
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Inbound Reply Analyzer</h3>
          <p className="text-[11px] text-slate-500">Paste an incoming lead response to let SalesPilot AI auto-classify and recommend CRM actions.</p>
        </div>

        {/* Quick Simulator Buttons */}
        <div className="space-y-1.5">
          <span className="block text-[9px] font-mono uppercase text-slate-400">Simulation Triggers</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleReplies.map((sim, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setReplyText(sim.text);
                  setAnalysisResult(null);
                  setIsMeetingBooked(false);
                  setSelectedSlot('');
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                {sim.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[9px] font-mono uppercase text-slate-400">Lead Name</label>
              <input 
                type="text" 
                value={leadName} 
                onChange={(e) => setLeadName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-mono uppercase text-slate-400">Company Name</label>
              <input 
                type="text" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] font-mono uppercase text-slate-400">Raw Incoming Text</label>
            <textarea
              rows={8}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Paste email headers and body here..."
              className="w-full bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-lg px-3.5 py-2.5 text-xs font-mono leading-relaxed text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow transition cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Neural Categorizer...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-500" />
              Analyze Response Copy
            </>
          )}
        </button>
      </div>

      {/* AI Analysis Result Panel */}
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[480px]">
        {isAnalyzing ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
            <Sparkles className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs font-mono text-slate-500">Querying Gemini API classification parameters...</span>
          </div>
        ) : analysisResult ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  AI Classification Card
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/25 px-2 py-0.5 rounded border border-emerald-150 dark:border-emerald-900/50 font-bold">
                  98% Match Confident
                </span>
              </div>

              {/* Classification category pill */}
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Class Category</span>
                  <div className={`mt-1 inline-flex px-3 py-1.5 rounded-xl text-xs font-bold border ${getCategoryColor(analysisResult.category)}`}>
                    {analysisResult.category}
                  </div>
                </div>

                <div className="flex-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Confidence Score</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(analysisResult.confidence || 0.9) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      {((analysisResult.confidence || 0.9) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Recommended SalesPlaybook Action</span>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
                  {analysisResult.recommendedAction}
                </p>
              </div>

              {/* Meeting Slot Picker for positive responses */}
              {analysisResult.meetingSlots && analysisResult.meetingSlots.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    AI Auto-Suggest Calendar Slots
                  </span>
                  
                  {isMeetingBooked ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                      <div>
                        <strong>Google Meet scheduled successfully!</strong>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-500 font-mono mt-0.5">Time: {selectedSlot} | Agenda: SalesPilot Demo Sequence</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {analysisResult.meetingSlots.map((slot: string) => (
                          <button
                            type="button"
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 text-center text-xs font-semibold rounded-lg border transition cursor-pointer ${
                              selectedSlot === slot
                                ? 'bg-blue-600 border-blue-500 text-white shadow-sm font-bold'
                                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleBookMeeting}
                        disabled={!selectedSlot}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Book Google Meet & Log CRM Pipeline
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> State machine updated dynamically in CRM.
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-250 dark:text-slate-850" />
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Analyzer card is idle</h4>
              <p className="text-[10px] text-slate-500 max-w-xs mt-1">Select a simulated response on the left or type/paste your own text and click "Analyze Response Copy".</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
