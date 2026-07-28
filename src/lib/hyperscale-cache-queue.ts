export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

/**
 * Enterprise LRU Cache with TTL
 */
export class HyperscaleCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hits += 1;
    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  public set(key: string, value: T, ttlMs: number = 300000): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      hits: 0
    });
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats() {
    let active = 0;
    let totalHits = 0;
    const now = Date.now();

    this.cache.forEach((entry) => {
      if (now <= entry.expiresAt) {
        active += 1;
        totalHits += entry.hits;
      }
    });

    return {
      totalKeys: this.cache.size,
      activeKeys: active,
      totalHits,
      maxEntries: this.maxEntries
    };
  }
}

export const globalCache = new HyperscaleCache(5000);

export interface JobTask {
  id: string;
  type: string;
  payload: any;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Background Distributed Job Queue Engine
 */
export class BackgroundJobQueue {
  private queue: JobTask[] = [];
  private concurrency: number = 4;
  private activeJobsCount: number = 0;
  private listeners: Array<(jobs: JobTask[]) => void> = [];

  constructor(concurrency: number = 4) {
    this.concurrency = concurrency;
    this.seedInitialQueue();
  }

  private seedInitialQueue() {
    this.queue = [
      {
        id: 'job-101',
        type: 'EMAIL_SEQUENCE_DISPATCH',
        payload: { sequenceId: 'seq-sdr-01', recipientsCount: 150 },
        status: 'COMPLETED',
        attempts: 1,
        maxAttempts: 3,
        result: { dispatched: 150, opened: 42, bounced: 0 },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3500000).toISOString()
      },
      {
        id: 'job-102',
        type: 'AI_LEAD_ENRICHMENT_SYNC',
        payload: { targetIndustry: 'Software & Technology', depth: 'FULL' },
        status: 'COMPLETED',
        attempts: 1,
        maxAttempts: 3,
        result: { enrichedLeads: 45, confidenceAvg: 0.94 },
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1700000).toISOString()
      },
      {
        id: 'job-103',
        type: 'WEBHOOK_OUTBOUND_RETRY',
        payload: { webhookId: 'wh-009', url: 'https://n8n.horizonmedia.in' },
        status: 'QUEUED',
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  public enqueueJob(type: string, payload: any, maxAttempts: number = 3): JobTask {
    const job: JobTask = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      status: 'QUEUED',
      attempts: 0,
      maxAttempts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.queue.unshift(job);
    this.notifyListeners();
    this.processNext();
    return job;
  }

  public async processNext() {
    if (this.activeJobsCount >= this.concurrency) return;

    const job = this.queue.find(j => j.status === 'QUEUED' || j.status === 'RETRYING');
    if (!job) return;

    job.status = 'RUNNING';
    job.attempts += 1;
    job.updatedAt = new Date().toISOString();
    this.activeJobsCount += 1;
    this.notifyListeners();

    try {
      // Simulate task processing latency
      await new Promise(res => setTimeout(res, 800 + Math.random() * 1200));

      job.status = 'COMPLETED';
      job.result = { success: true, processedAt: new Date().toISOString(), details: `Processed ${job.type}` };
    } catch (err: any) {
      if (job.attempts < job.maxAttempts) {
        job.status = 'RETRYING';
        job.error = err?.message || 'Transient network glitch';
      } else {
        job.status = 'FAILED';
        job.error = err?.message || 'Max retry limit reached';
      }
    } finally {
      job.updatedAt = new Date().toISOString();
      this.activeJobsCount -= 1;
      this.notifyListeners();
      this.processNext();
    }
  }

  public getJobs(): JobTask[] {
    return [...this.queue];
  }

  public subscribe(cb: (jobs: JobTask[]) => void) {
    this.listeners.push(cb);
    cb(this.getJobs());
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.getJobs()));
  }
}

export const globalJobQueue = new BackgroundJobQueue(4);

/**
 * Enterprise Circuit Breaker Pattern
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private failureThreshold: number;
  private recoveryTimeoutMs: number;
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;

  constructor(failureThreshold: number = 5, recoveryTimeoutMs: number = 10000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeoutMs = recoveryTimeoutMs;
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('CircuitBreaker is OPEN. Outgoing request blocked for system protection.');
      }
    }

    try {
      const result = await action();
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      return result;
    } catch (err) {
      this.failureCount += 1;
      this.lastFailureTime = now;

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      throw err;
    }
  }

  public reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  public getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.failureThreshold
    };
  }
}

export const globalCircuitBreaker = new CircuitBreaker(5, 10000);

/**
 * Virtualized List Math Helper
 */
export function calculateVirtualWindow(
  totalItems: number,
  scrollTop: number,
  viewportHeight: number,
  itemHeight: number,
  overscan: number = 3
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalItems - 1, Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan);
  const paddingTop = startIndex * itemHeight;
  const paddingBottom = Math.max(0, (totalItems - 1 - endIndex) * itemHeight);

  return {
    startIndex,
    endIndex,
    paddingTop,
    paddingBottom,
    visibleCount: Math.max(0, endIndex - startIndex + 1)
  };
}
