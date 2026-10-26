import React, { useState } from 'react';
import { Bell, X, Check, Car, Truck, Shield } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  darkMode: boolean;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'operations' | 'security'>('all');

  if (!isOpen) return null;

  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    system: notifications.filter((n) => n.category === 'system').length,
    operations: notifications.filter((n) => n.category === 'operations').length,
    security: notifications.filter((n) => n.category === 'security').length,
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const getNotificationIcon = (item: NotificationItem) => {
    if (item.category === 'security') {
      return <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    switch (item.type) {
      case 'driver':
      case 'trip':
        return <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'shipment':
      case 'vehicle':
        return <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md h-full flex flex-col justify-between border-l shadow-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Platform events, dispatch alerts, and RBAC security logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'unread', label: `Unread (${counts.unread})` },
            { id: 'operations', label: `Operations (${counts.operations})` },
            { id: 'security', label: `Security (${counts.security})` },
            { id: 'system', label: `System (${counts.system})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors tabular-nums ${
                filter === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkRead(item.id)}
                className={`p-3.5 rounded-xl border transition-colors cursor-pointer relative ${
                  !item.read
                    ? 'bg-cyan-50/60 dark:bg-slate-800/70 border-cyan-200 dark:border-cyan-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {getNotificationIcon(item)}
                  </div>
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-xs text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.subtitle}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1.5 inline-block">
                      {item.timeAgo}
                    </span>
                  </div>
                </div>

                {!item.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-cyan-500" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
              No notifications in this category.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onMarkAllRead}
            className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
