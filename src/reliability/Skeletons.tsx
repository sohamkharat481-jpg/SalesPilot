import React from 'react';
import { Database, Inbox, SearchX, FileText } from 'lucide-react';

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 animate-pulse">
      <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/30 rounded w-full flex items-center px-4 justify-between gap-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-16"></div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title = 'No Data Found',
  description = 'There are no records currently available in this view.',
  actionLabel,
  onAction,
  icon: Icon = Inbox
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl my-4 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
