import React, { useState } from 'react';
import { 
  Check, X, Edit2, Calendar, Mail, Linkedin, MessageSquare, Phone, 
  Clock, CheckCircle2, AlertCircle, ArrowUpRight, Save, Eye, Search
} from 'lucide-react';

interface MessageApproverProps {
  queuedMessages: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateMessage: (id: string, updatedBody: string) => void;
}

export function MessageApprover({ queuedMessages, onApprove, onReject, onUpdateMessage }: MessageApproverProps) {
  const [activeStatusTab, setActiveStatusTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT'>('PENDING');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Filtered messages
  const filtered = queuedMessages.filter(msg => {
    const matchesStatus = msg.status === activeStatusTab;
    const matchesSearch = 
      msg.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel.toUpperCase()) {
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'LINKEDIN':
        return <Linkedin className="w-4 h-4 text-indigo-500" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      default:
        return <Phone className="w-4 h-4 text-purple-500" />;
    }
  };

  const handleStartEdit = (id: string, body: string) => {
    setEditingId(id);
    setEditText(body);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateMessage(id, editText);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl">
        {/* Tab filters */}
        <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-850/60 p-1 border border-slate-200 dark:border-slate-800 rounded-lg">
          {[
            { id: 'PENDING', label: 'Pending Approval', count: queuedMessages.filter(m => m.status === 'PENDING').length },
            { id: 'APPROVED', label: 'Approved Outbox', count: queuedMessages.filter(m => m.status === 'APPROVED').length },
            { id: 'REJECTED', label: 'Rejected', count: queuedMessages.filter(m => m.status === 'REJECTED').length },
            { id: 'SENT', label: 'Sent Logs', count: queuedMessages.filter(m => m.status === 'SENT').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveStatusTab(tab.id as any);
                setEditingId(null);
                setPreviewId(null);
              }}
              className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                activeStatusTab === tab.id 
                  ? 'bg-slate-900 text-white dark:bg-slate-800' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filter by prospect or copy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium w-full sm:w-60"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approvals Table / Card list */}
        <div className={`col-span-12 ${previewId ? 'lg:col-span-7' : ''} space-y-4`}>
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-12 text-center rounded-xl text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-800 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Approval folder empty</h4>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1">There are no outreach messages matching {activeStatusTab} in this sequence.</p>
            </div>
          ) : (
            filtered.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-sm hover:shadow-md transition duration-250 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  previewId === msg.id ? 'border-blue-500 dark:border-blue-800' : 'border-slate-200 dark:border-slate-850'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(msg.channel)}
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{msg.leadName}</span>
                    <span className="text-[10px] text-slate-400 truncate">({msg.company})</span>
                  </div>

                  {msg.subject && (
                    <div className="text-[10px] text-slate-500 truncate">
                      <strong className="font-mono text-slate-400 uppercase text-[9px] mr-1">Subject:</strong> {msg.subject}
                    </div>
                  )}

                  {editingId === msg.id ? (
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    />
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate font-mono bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg leading-relaxed">
                      {msg.body}
                    </p>
                  )}

                  <div className="flex items-center gap-2.5 text-[9px] font-mono text-slate-400 mt-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Queued {new Date(msg.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Operations Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {editingId === msg.id ? (
                    <button
                      onClick={() => handleSaveEdit(msg.id)}
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(msg.id, msg.body)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        title="Edit message content"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewId(previewId === msg.id ? null : msg.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 transition"
                        title="Preview details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {activeStatusTab === 'PENDING' && (
                    <>
                      <button
                        onClick={() => onReject(msg.id)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Reject / Discard"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onApprove(msg.id)}
                        className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Approve outbound sequence"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inline Drawer Preview details */}
        {previewId && (
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 p-5 rounded-xl space-y-4">
            {(() => {
              const previewMsg = queuedMessages.find(m => m.id === previewId);
              if (!previewMsg) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wide">Outbound Dispatch Preview</h3>
                    <button 
                      onClick={() => setPreviewId(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-mono"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Recipient Prospect</span>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{previewMsg.leadName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{previewMsg.company}</div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Channel Target</span>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                        {getChannelIcon(previewMsg.channel)} {previewMsg.channel} Outbound
                      </div>
                    </div>

                    {previewMsg.subject && (
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Subject Block</span>
                        <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{previewMsg.subject}</div>
                      </div>
                    )}

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Message Content</span>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-lg text-xs leading-normal font-mono whitespace-pre-wrap mt-0.5">
                        {previewMsg.body}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
