import AsyncStorage from '@react-native-async-storage/async-storage';

const LEADS_CACHE_KEY = '@salespilot_leads_cache';
const MEETINGS_CACHE_KEY = '@salespilot_meetings_cache';
const SYNC_QUEUE_KEY = '@salespilot_sync_queue';

export interface PendingSyncItem {
  id: string;
  action: 'CREATE_LEAD' | 'UPDATE_LEAD' | 'DELETE_LEAD' | 'CREATE_TASK' | 'ADD_NOTE';
  data: any;
  timestamp: string;
}

export const OfflineStorage = {
  // Leads Cache Management
  async getLeads(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(LEADS_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to get leads from local cache', e);
      return [];
    }
  },

  async saveLeads(leads: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LEADS_CACHE_KEY, JSON.stringify(leads));
    } catch (e) {
      console.error('Failed to cache leads locally', e);
    }
  },

  // Meetings Cache Management
  async getMeetings(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(MEETINGS_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to get meetings from local cache', e);
      return [];
    }
  },

  async saveMeetings(meetings: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(MEETINGS_CACHE_KEY, JSON.stringify(meetings));
    } catch (e) {
      console.error('Failed to cache meetings locally', e);
    }
  },

  // Sync Queue Management (Outbox for Offline Action Syncing)
  async getSyncQueue(): Promise<PendingSyncItem[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to fetch sync queue', e);
      return [];
    }
  },

  async addToSyncQueue(action: PendingSyncItem['action'], data: any): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const newItem: PendingSyncItem = {
        id: 'sync-' + Math.random().toString(36).substr(2, 9),
        action,
        data,
        timestamp: new Date().toISOString()
      };
      queue.push(newItem);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to write to offline sync outbox', e);
    }
  },

  async clearSyncItem(id: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to pop item from sync outbox', e);
    }
  }
};
