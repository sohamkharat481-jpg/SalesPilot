import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineStorage } from './storage';

const TOKEN_KEY = '@salespilot_auth_token';
const API_BASE_URL = 'https://ais-pre-ugqj7litatcjdhtb5soe5h-1068642749697.asia-southeast1.run.app';

export const MobileApi = {
  // Authentication State
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  // HTTP Request Helper
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`Request to ${endpoint} failed. Cache may be loaded:`, err);
      throw err;
    }
  },

  // Syncing engine
  async triggerBackgroundSync(): Promise<{ success: boolean; syncedCount: number }> {
    const queue = await OfflineStorage.getSyncQueue();
    if (queue.length === 0) return { success: true, syncedCount: 0 };

    let syncedCount = 0;
    for (const item of queue) {
      try {
        if (item.action === 'CREATE_LEAD') {
          await this.request('/api/v1/leads', {
            method: 'POST',
            body: JSON.stringify(item.data)
          });
        } else if (item.action === 'UPDATE_LEAD') {
          await this.request(`/api/v1/leads/${item.data.id}/enrich`, {
            method: 'POST',
            body: JSON.stringify(item.data)
          });
        } else if (item.action === 'CREATE_TASK') {
          await this.request(`/api/v1/leads/${item.data.leadId}/tasks`, {
            method: 'POST',
            body: JSON.stringify(item.data)
          });
        }
        
        // Remove item from outbox queue
        await OfflineStorage.clearSyncItem(item.id);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to background sync queued transaction ${item.id}`, err);
        // Break sync cycle if network error persist
        break;
      }
    }

    return { success: true, syncedCount };
  }
};
