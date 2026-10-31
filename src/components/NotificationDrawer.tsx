import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  X,
  Check,
  Car,
  Truck,
  Shield,
  Globe,
  MapPin,
  ArrowRight,
  PhoneCall,
  AlertTriangle,
  CreditCard,
  FileCheck2,
  Radio,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { EastAfricaCountryCode, NotificationItem } from '../types';
import { EAST_AFRICA_NOTIFICATION_COUNTRIES } from '../services/notifications';
import { EAST_AFRICAN_COUNTRIES_META } from '../services/eastAfricaModules';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  darkMode: boolean;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  userName?: string;
  userRole?: string;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
  darkMode,
  userJurisdiction = 'ET',
  userJurisdictionName,
  userName,
  userRole,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<
    'all' | 'unread' | 'dispatch' | 'regulatory' | 'settlement' | 'security' | 'system'
  >('all');

  // Default filter to the logged-in user's sovereign country of operation
  const [countryFilter, setCountryFilter] = useState<EastAfricaCountryCode | 'ALL'>(() => {
    return userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ALL';
  });

  // Re-sync when operator persona or jurisdiction changes
  useEffect(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL') {
      setCountryFilter(userJurisdiction);
    }
  }, [userJurisdiction, isOpen]);

  const countryFlags: Record<string, string> = {
    ET: '🇪🇹',
    KE: '🇰🇪',
    UG: '🇺🇬',
    RW: '🇷🇼',
    TZ: '🇹🇿',
    DJ: '🇩🇯',
    SO: '🇸🇴',
    SS: '🇸🇸',
  };

  const userCountryMeta = userJurisdiction && userJurisdiction !== 'ALL'
    ? EAST_AFRICAN_COUNTRIES_META[userJurisdiction]
    : null;

  const userStationNotifMeta = userJurisdiction && userJurisdiction !== 'ALL'
    ? EAST_AFRICA_NOTIFICATION_COUNTRIES[userJurisdiction]
    : null;

  // Counts computed dynamically
  const myCountryCounts = useMemo(() => {
    if (!userJurisdiction || userJurisdiction === 'ALL') return notifications.length;
    return notifications.filter(
      (n) => !n.countryCode || n.countryCode === userJurisdiction || n.countryCode === 'ALL'
    ).length;
  }, [notifications, userJurisdiction]);

  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    dispatch: notifications.filter((n) => n.category === 'dispatch' || n.category === 'operations').length,
    regulatory: notifications.filter((n) => n.category === 'regulatory').length,
    settlement: notifications.filter((n) => n.category === 'settlement').length,
    security: notifications.filter((n) => n.category === 'security').length,
    system: notifications.filter((n) => n.category === 'system').length,
  };

  const filtered = notifications.filter((n) => {
    // Country filter
    if (countryFilter !== 'ALL') {
      if (n.countryCode && n.countryCode !== countryFilter && n.countryCode !== 'ALL') return false;
    }
    // Category filter
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    if (filter === 'dispatch') return n.category === 'dispatch' || n.category === 'operations';
    return n.category === filter;
  });

  const getNotificationIcon = (item: NotificationItem) => {
    if (item.category === 'security') {
      return <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
    if (item.category === 'settlement' || item.type === 'payment') {
      return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (item.category === 'regulatory') {
      return <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    switch (item.type) {
      case 'driver':
      case 'trip':
        return <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'shipment':
      case 'vehicle':
        return <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md h-full flex flex-col justify-between border-l shadow-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">East Africa Dispatch Alerts</h2>
                {userCountryMeta && (
                  <span className="text-base" title={userCountryMeta.name}>
                    {userCountryMeta.flag}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {userJurisdictionName || 'Pan-East Africa'} · {userName || 'Active Operator'} ({userRole || 'Operator'})
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

        {/* Individual Operator Station Context Banner */}
        {userCountryMeta && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-50 to-blue-50/50 dark:from-cyan-950/40 dark:to-slate-900 border-b border-cyan-100 dark:border-cyan-900/40 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-900 dark:text-white">Station: </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {userStationNotifMeta?.stationHubName || `${userCountryMeta.name} Dispatch Command`}
                </span>
              </div>
            </div>

            {userStationNotifMeta?.emergencyHotline && (
              <span className="shrink-0 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                <PhoneCall className="w-2.5 h-2.5" />
                <span>{userStationNotifMeta.emergencyHotline.split('/')[0].trim()}</span>
              </span>
            )}
          </div>
        )}

        {/* 8-Nation Mini Country Pills & Station Focus Toggle */}
        <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-thin">
          {userCountryMeta && (
            <button
              onClick={() => setCountryFilter(userJurisdiction)}
              className={`px-2.5 py-1 rounded-md font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                countryFilter === userJurisdiction
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60'
              }`}
            >
              <span>{userCountryMeta.flag}</span>
              <span>My Station ({myCountryCounts})</span>
            </button>
          )}

          <button
            onClick={() => setCountryFilter('ALL')}
            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
              countryFilter === 'ALL'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            🌍 All East Africa
          </button>

          {Object.entries(countryFlags).map(([code, flag]) => (
            <button
              key={code}
              onClick={() => setCountryFilter(code as EastAfricaCountryCode)}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                countryFilter === code
                  ? 'bg-cyan-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{flag}</span>
              <span>{code}</span>
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto text-xs scrollbar-thin">
          {[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'unread', label: `Unread (${counts.unread})` },
            { id: 'dispatch', label: `Corridors (${counts.dispatch})` },
            { id: 'regulatory', label: `Tariffs (${counts.regulatory})` },
            { id: 'settlement', label: `Fintech (${counts.settlement})` },
            { id: 'security', label: `Security (${counts.security})` },
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
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkRead(item.id)}
                className={`p-3.5 rounded-xl border transition-colors cursor-pointer relative ${
                  !item.read
                    ? 'bg-cyan-50/60 dark:bg-slate-800/70 border-cyan-200 dark:border-cyan-500/30 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(item)}
                  </div>
                  <div className="flex-1 pr-4 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {item.countryCode && item.countryCode !== 'ALL' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {countryFlags[item.countryCode] || ''} {item.countryCode}
                        </span>
                      )}
                      {item.severity === 'critical' && (
                        <span className="text-[9px] font-bold uppercase px-1 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          Critical SOS
                        </span>
                      )}
                      {item.emergencyHotline && item.severity === 'critical' && (
                        <span className="text-[9px] font-mono px-1 rounded bg-rose-50 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300 flex items-center gap-0.5">
                          <PhoneCall className="w-2.5 h-2.5" />
                          <span>{item.emergencyHotline}</span>
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-xs text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                      {item.subtitle}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
                      <span>{item.timestamp || item.timeAgo}</span>
                      {item.corridor && (
                        <span className="truncate max-w-[150px] text-cyan-600 dark:text-cyan-400">
                          {item.corridor}
                        </span>
                      )}
                    </div>

                    {item.actionTab && onNavigateTab && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onNavigateTab(item.actionTab!);
                          }}
                          className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>{item.actionLabel || `Open ${item.actionTab}`}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!item.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-cyan-500 shadow-xs" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
              No notifications matching this category or station.
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
