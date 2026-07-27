import React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from './useNetworkStatus';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white dark:bg-slate-800 border border-red-500/30 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold text-slate-100">Working Offline</p>
          <p className="text-[11px] text-slate-400">Connection lost. Local changes will sync when reconnected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-emerald-900/90 text-white border border-emerald-500/30 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <Wifi className="w-4 h-4" />
      </div>
      <div className="text-left">
        <p className="text-xs font-semibold text-emerald-100">Back Online</p>
        <p className="text-[11px] text-emerald-300">Synchronized latest real-time workspace updates.</p>
      </div>
    </div>
  );
}
