import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Sparkles, Send, X, ChevronDown, Minimize2, Maximize2, 
  RefreshCw, MessageSquare, ArrowRight, Zap, Target, Search, 
  FileText, Calendar, Mail, CheckCircle2, Copy, Check
} from 'lucide-react';
import { Lead, Deal, Appointment, Campaign } from '../../types';
import { AnalyticsMetrics } from '../../analytics/analytics-data';
import { CopilotService, CopilotMessage, CopilotContext } from '../../ai/copilot-service';

interface AiSalesCopilotWidgetProps {
  leads: Lead[];
  deals: Deal[];
  appointments: Appointment[];
  campaigns: Campaign[];
  metrics?: AnalyticsMetrics;
  selectedLead?: Lead | null;
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export function AiSalesCopilotWidget({
  leads,
  deals,
  appointments,
  campaigns,
  metrics,
  selectedLead,
  activeTab,
  onNavigateTab
}: AiSalesCopilotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: `👋 Hi! I'm your **SalesPilot AI Copilot**. I have full context on your **${leads.length} leads**, **${deals.length} deals**, calendar, and analytics.\n\nAsk me anything or pick a quick suggestion below:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Find Overdue Follow-ups', action: 'Find overdue follow-ups in my CRM' },
        { label: 'Summarize Revenue & Pipeline', action: 'Summarize my sales pipeline and ARR' },
        { label: 'Recommend Top Hot Prospects', action: 'Recommend my best prospects to contact' },
        { label: 'Draft Email for Selected Lead', action: 'Draft a personalized outreach email' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: `user_msg_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const context: CopilotContext = {
        leads,
        deals,
        appointments,
        campaigns,
        metrics,
        selectedLead,
        activeTab
      };

      const response = await CopilotService.queryCopilot(q, context);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error('Copilot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'Apologies, I encountered an issue accessing the CRM data. Please try asking again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionStr: string) => {
    if (actionStr.includes('view_analytics') && onNavigateTab) {
      onNavigateTab('analytics');
    } else if (actionStr.includes('view_deals') && onNavigateTab) {
      onNavigateTab('pipeline');
    } else if (actionStr.includes('view_overdue_leads') && onNavigateTab) {
      onNavigateTab('leads');
    } else {
      handleSend(actionStr);
    }
  };

  const copyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (When closed or minimized) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border border-white/20 group"
          title="Open AI Sales Copilot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <span className="text-xs font-bold font-mono tracking-wide hidden sm:inline">AI Sales Copilot</span>
          <span className="p-1 rounded-full bg-white/20 text-white group-hover:bg-white/30 transition">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </button>
      )}

      {/* COPILOT CHAT DRAWER PANEL */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] bg-slate-900 text-white border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized ? 'h-[60px]' : 'h-[560px] max-h-[85vh]'
          }`}
        >
          {/* TOP HEADER BAR */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold font-mono text-white tracking-wide">AI Sales Copilot</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE CRM
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Context: {leads.length} leads • {deals.length} deals</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          {!isMinimized && (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto font-sans text-xs bg-slate-950/60">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1 ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 relative group ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {/* Copy button for assistant responses */}
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => copyText(msg.id, msg.text)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}

                    <div className="whitespace-pre-line font-normal">
                      {msg.text}
                    </div>

                    <span className="text-[9px] font-mono text-slate-400 block text-right pt-1 opacity-70">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Suggested Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                      {msg.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act.action)}
                          className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 text-[10px] font-semibold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Spinner */}
              {loading && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl text-slate-400 text-xs w-fit animate-pulse">
                  <Bot className="w-4 h-4 text-purple-400 animate-spin" />
                  <span>Synthesizing CRM intelligence...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* INPUT FORM FOOTER */}
          {!isMinimized && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask copilot... (e.g., 'Find overdue leads')"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Powered by Gemini 3.6 Flash</span>
                <span className="text-emerald-400 font-bold">100% Real CRM Sync</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
