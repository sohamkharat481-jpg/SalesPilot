import React, { useState } from 'react';
import { 
  Bell, 
  AtSign, 
  UserCheck, 
  MessageSquare, 
  ShieldAlert, 
  CheckCheck, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import { TeamNotification } from '../../types/team-collaboration';

interface TeamNotificationsCenterProps {
  notifications: TeamNotification[];
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  loading: boolean;
}

export const TeamNotificationsCenter: React.FC<TeamNotificationsCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  loading
}) => {
  const [filterRead, setFilterRead] = useState<'ALL' | 'UNREAD'>('ALL');

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'MENTION':
        return <AtSign className="w-4 h-4 text-blue-500" />;
      case 'ASSIGNMENT':
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case 'COMMENT':
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-purple-500" />;
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filterRead === 'UNREAD') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Team Notification Center
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time alerts for lead assignments, team @mentions, and role permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-mono font-bold">
            <button
              onClick={() => setFilterRead('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                filterRead === 'ALL' ? 'bg-purple-600 text-white' : 'text-slate-500'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterRead('UNREAD')}
              className={`px-2.5 py-1 rounded-lg transition ${
                filterRead === 'UNREAD' ? 'bg-purple-600 text-white' : 'text-slate-500'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Stream List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 font-mono">
            No notifications available. All team catchups are complete!
          </div>
        ) : (
          filteredNotifs.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && onMarkAsRead(n.id)}
              className={`p-4 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                n.read
                  ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-70'
                  : 'bg-white dark:bg-slate-850 border-purple-500/30 shadow-sm'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {getNotifIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {n.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
