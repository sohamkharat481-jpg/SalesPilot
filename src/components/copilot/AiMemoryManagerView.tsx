import React, { useState, useEffect } from 'react';
import { Brain, Search, Plus, Trash2, Edit, RefreshCw, Database, Sparkles, Filter, Tag, Clock, ShieldCheck } from 'lucide-react';
import { aiLongTermMemory, AIMemoryItem } from '../../ai/ai-long-term-memory';

export function AiMemoryManagerView() {
  const [memories, setMemories] = useState<AIMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryOutput, setSummaryOutput] = useState<string>('');

  // New Memory Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newScope, setNewScope] = useState<AIMemoryItem['scope']>('ORGANIZATION');
  const [newScopeId, setNewScopeId] = useState('org-horizon');
  const [newCategory, setNewCategory] = useState<AIMemoryItem['category']>('PREFERENCE');
  const [newTags, setNewTags] = useState('sales, preference');
  const [newImportance, setNewImportance] = useState(8);

  const refreshList = () => {
    let items = aiLongTermMemory.getAllMemories();
    if (selectedScope !== 'ALL') {
      items = items.filter(m => m.scope === selectedScope);
    }
    if (selectedCategory !== 'ALL') {
      items = items.filter(m => m.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m => 
        m.content.toLowerCase().includes(q) || 
        m.tags.some(t => t.toLowerCase().includes(q)) ||
        m.sourceAgent.toLowerCase().includes(q)
      );
    }
    setMemories(items);
  };

  useEffect(() => {
    refreshList();
  }, [searchQuery, selectedScope, selectedCategory]);

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    aiLongTermMemory.addMemory({
      scope: newScope,
      scopeId: newScopeId,
      category: newCategory,
      content: newContent.trim(),
      importanceScore: newImportance,
      confidence: 0.95,
      sourceAgent: 'USER_DIRECT',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
    });

    setNewContent('');
    setShowAddModal(false);
    refreshList();
  };

  const handleDelete = (id: string) => {
    aiLongTermMemory.deleteMemory(id);
    refreshList();
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const scope = selectedScope === 'ALL' ? 'ORGANIZATION' : selectedScope as AIMemoryItem['scope'];
      const text = await aiLongTermMemory.summarizeScopeMemories(scope, 'org-horizon');
      setSummaryOutput(text);
    } catch (e) {
      setSummaryOutput('Failed to summarize memories.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Persistent AI Long-Term Memory
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-semibold">
                Vector & Semantic Store
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Cross-agent memory repository sharing preferences, buying signals, deal facts, and customer objections across SDR, Copilot, and Voice Agents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSummary}
            disabled={isSummarizing}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            {isSummarizing ? 'Summarizing...' : 'Summarize Scope'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Memory Fact
          </button>
        </div>
      </div>

      {/* Summary Output Banner if generated */}
      {summaryOutput && (
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 p-4 rounded-xl text-sm text-purple-900 dark:text-purple-200 relative">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            AI Scope Memory Synthesis:
          </div>
          <p className="whitespace-pre-wrap text-slate-700 dark:text-purple-100/90 leading-relaxed">{summaryOutput}</p>
        </div>
      )}

      {/* Controls & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search AI memories, tags, or source agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Scopes</option>
            <option value="ORGANIZATION">Organization</option>
            <option value="WORKSPACE">Workspace</option>
            <option value="CUSTOMER">Customer</option>
            <option value="LEAD">Lead</option>
            <option value="CRM">CRM</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Categories</option>
            <option value="PREFERENCE">Preference</option>
            <option value="BUYING_SIGNAL">Buying Signal</option>
            <option value="OBJECTION">Objection</option>
            <option value="DEAL_FACT">Deal Fact</option>
            <option value="STRATEGY">Strategy</option>
          </select>

          <button
            onClick={refreshList}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            title="Refresh Memory Index"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Memory Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memories.map((mem) => (
          <div
            key={mem.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-medium">
                  {mem.scope}: {mem.scopeId}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Score: {mem.importanceScore}/10
                </span>
              </div>

              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                {mem.content}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Tag className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{mem.tags.join(', ')}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDelete(mem.id)}
                  className="p-1 hover:text-red-600 transition"
                  title="Delete Fact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Add Memory */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" /> Add Persistent Memory Fact
            </h3>

            <form onSubmit={handleCreateMemory} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fact / Preference Content
                </label>
                <textarea
                  rows={3}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. Client prefers quarterly billing cycles and security documentation prior to demo..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scope
                  </label>
                  <select
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="ORGANIZATION">Organization</option>
                    <option value="WORKSPACE">Workspace</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="LEAD">Lead</option>
                    <option value="CRM">CRM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="PREFERENCE">Preference</option>
                    <option value="BUYING_SIGNAL">Buying Signal</option>
                    <option value="OBJECTION">Objection</option>
                    <option value="DEAL_FACT">Deal Fact</option>
                    <option value="STRATEGY">Strategy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Importance (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newImportance}
                    onChange={(e) => setNewImportance(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
