import { GoogleGenAI } from '@google/genai';

export interface AIMemoryItem {
  id: string;
  scope: 'WORKSPACE' | 'ORGANIZATION' | 'CUSTOMER' | 'LEAD' | 'CRM' | 'AGENT';
  scopeId: string;
  category: 'PREFERENCE' | 'INTERACTION' | 'BUYING_SIGNAL' | 'OBJECTION' | 'DEAL_FACT' | 'STRATEGY';
  content: string;
  embedding?: number[];
  importanceScore: number; // 1-10
  confidence: number; // 0-1
  sourceAgent: 'AI_SDR' | 'COPILOT' | 'VOICE_ASSISTANT' | 'AGENTS_HUB' | 'CRM_ENGINE' | 'USER_DIRECT';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  tags: string[];
}

export interface MemoryQueryFilter {
  scope?: 'WORKSPACE' | 'ORGANIZATION' | 'CUSTOMER' | 'LEAD' | 'CRM' | 'AGENT';
  scopeId?: string;
  category?: string;
  tags?: string[];
  minImportance?: number;
  limit?: number;
}

const STORAGE_KEY = 'salespilot_ai_long_term_memory_v1';

class AILongTermMemoryStore {
  private memories: Map<string, AIMemoryItem> = new Map();

  constructor() {
    this.loadFromStorage();
    this.ensureSeedMemories();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AIMemoryItem[] = JSON.parse(raw);
        parsed.forEach(m => this.memories.set(m.id, m));
      }
    } catch (e) {
      console.warn('Failed to parse AI memory from storage', e);
    }
  }

  private saveToStorage() {
    try {
      const items = Array.from(this.memories.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save AI memory to storage', e);
    }
  }

  private ensureSeedMemories() {
    if (this.memories.size > 0) return;

    const initialMemories: AIMemoryItem[] = [
      {
        id: 'mem-1',
        scope: 'ORGANIZATION',
        scopeId: 'org-horizon',
        category: 'PREFERENCE',
        content: 'Organization prefers concise B2B outbound emails with a warm tone and direct call booking links.',
        importanceScore: 9,
        confidence: 0.95,
        sourceAgent: 'USER_DIRECT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['tone', 'email', 'outreach', 'b2b']
      },
      {
        id: 'mem-2',
        scope: 'LEAD',
        scopeId: 'lead-rajesh',
        category: 'BUYING_SIGNAL',
        content: 'Rajesh Kumar expressed high interest in automated CRM lead distribution and webhook triggers.',
        importanceScore: 8,
        confidence: 0.9,
        sourceAgent: 'AI_SDR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['buying_signal', 'webhooks', 'crm']
      },
      {
        id: 'mem-3',
        scope: 'CRM',
        scopeId: 'deal-apex-closing',
        category: 'DEAL_FACT',
        content: 'Apex Marketing decision maker requires security audit documentation prior to annual contract signoff.',
        importanceScore: 10,
        confidence: 0.98,
        sourceAgent: 'COPILOT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['security', 'compliance', 'closing', 'enterprise']
      }
    ];

    initialMemories.forEach(m => this.memories.set(m.id, m));
    this.saveToStorage();
  }

  /**
   * Add a new memory item
   */
  public addMemory(item: Omit<AIMemoryItem, 'id' | 'createdAt' | 'updatedAt'>): AIMemoryItem {
    const newMemory: AIMemoryItem = {
      ...item,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.memories.set(newMemory.id, newMemory);
    this.saveToStorage();
    return newMemory;
  }

  /**
   * Update an existing memory
   */
  public updateMemory(id: string, updates: Partial<Omit<AIMemoryItem, 'id' | 'createdAt'>>): AIMemoryItem | null {
    const existing = this.memories.get(id);
    if (!existing) return null;

    const updated: AIMemoryItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.memories.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Delete a memory
   */
  public deleteMemory(id: string): boolean {
    const deleted = this.memories.delete(id);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  /**
   * Query memories by filters & semantic keyword relevance
   */
  public queryMemories(filter: MemoryQueryFilter, queryText?: string): AIMemoryItem[] {
    const now = new Date().getTime();
    let results = Array.from(this.memories.values()).filter(m => {
      if (m.expiresAt && new Date(m.expiresAt).getTime() < now) return false;
      if (filter.scope && m.scope !== filter.scope) return false;
      if (filter.scopeId && m.scopeId !== filter.scopeId) return false;
      if (filter.category && m.category !== filter.category) return false;
      if (filter.minImportance && m.importanceScore < filter.minImportance) return false;
      if (filter.tags && filter.tags.length > 0) {
        const hasTag = filter.tags.some(t => m.tags.includes(t));
        if (!hasTag) return false;
      }
      return true;
    });

    if (queryText && queryText.trim()) {
      const keywords = queryText.toLowerCase().split(/\s+/);
      results = results.map(m => {
        const text = `${m.content} ${m.category} ${m.tags.join(' ')}`.toLowerCase();
        let score = 0;
        keywords.forEach(kw => {
          if (text.includes(kw)) score += 1;
        });
        return { item: m, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || b.item.importanceScore - a.item.importanceScore)
      .map(x => x.item);
    } else {
      results.sort((a, b) => b.importanceScore - a.importanceScore || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  /**
   * Format retrieved memories as a context block for Gemini AI prompts
   */
  public buildContextBlock(filter: MemoryQueryFilter, queryText?: string): string {
    const retrieved = this.queryMemories(filter, queryText);
    if (retrieved.length === 0) return '';

    const lines = retrieved.map((m, idx) => 
      `[Memory ${idx + 1} | Scope: ${m.scope} | Category: ${m.category} | Source: ${m.sourceAgent}]\n- ${m.content} (Confidence: ${(m.confidence * 100).toFixed(0)}%)`
    );

    return `\n=== PERSISTENT ENTERPRISE AI MEMORY CONTEXT ===\n${lines.join('\n')}\n===============================================\n`;
  }

  /**
   * Summarize memories for a given scope
   */
  public async summarizeScopeMemories(scope: AIMemoryItem['scope'], scopeId: string): Promise<string> {
    const list = this.queryMemories({ scope, scopeId });
    if (list.length === 0) return 'No historical AI memories stored for this scope.';

    const memoryDump = list.map(m => `- [${m.category}] ${m.content}`).join('\n');

    try {
      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Summarize the following AI persistent sales memories into a concise, executive summary of key preferences, objections, and buying signals:\n\n${memoryDump}`
        });
        return response.text || memoryDump;
      }
    } catch (e) {
      console.warn('Failed to summarize memories via Gemini API', e);
    }

    return `Stored ${list.length} key facts including preferences and deal objections for scope ${scope}:${scopeId}.`;
  }

  /**
   * Get all memory items
   */
  public getAllMemories(): AIMemoryItem[] {
    return Array.from(this.memories.values());
  }
}

export const aiLongTermMemory = new AILongTermMemoryStore();
