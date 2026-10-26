import React from 'react';
import {
  LayoutDashboard,
  Car,
  Truck,
  Users,
  BarChart3,
  Bell,
  Settings,
  Sliders,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Utensils,
  ShoppingBag,
  Calendar,
  Building2,
  Wallet,
  Package,
  LogOut,
  ChevronLeft,
  Heart,
  Compass,
  Wrench,
  Briefcase,
  Navigation,
  Radio,
  CreditCard,
  Leaf,
  FileCheck2,
  Gavel,
  Flame,
  Archive,
  Activity,
} from 'lucide-react';
import { ModuleItem } from '../types';

interface SidebarProps {
  modules: ModuleItem[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  unreadCount: number;
  activePulseCount?: number;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  modules,
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  darkMode,
  unreadCount,
  activePulseCount = 0,
  onLogout,
}) => {
  const isRideEnabled = modules.some((m) => m.key === 'ride' && m.enabled);
  const isTruckEnabled = modules.some((m) => m.key === 'truck' && m.enabled);
  const isFoodEnabled = modules.some((m) => m.key === 'food' && m.enabled);
  const isMarketplaceEnabled = modules.some((m) => m.key === 'marketplace' && m.enabled);
  const isEventsEnabled = modules.some((m) => m.key === 'events' && m.enabled);
  const isHotelsEnabled = modules.some((m) => m.key === 'hotels' && m.enabled);
  const isWalletEnabled = modules.some((m) => m.key === 'wallet' && m.enabled);
  const isCourierEnabled = modules.some((m) => m.key === 'courier' && m.enabled);

  const getModuleIcon = (key: string, iconName?: string) => {
    if (iconName === 'Heart') return <Heart className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />;
    if (iconName === 'Compass') return <Compass className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400" />;
    if (iconName === 'Wrench') return <Wrench className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />;
    if (iconName === 'Briefcase') return <Briefcase className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />;

    switch (key) {
      case 'ride':
        return <Car className="w-4 h-4 shrink-0" />;
      case 'truck':
        return <Truck className="w-4 h-4 shrink-0" />;
      case 'food':
        return <Utensils className="w-4 h-4 shrink-0" />;
      case 'marketplace':
        return <ShoppingBag className="w-4 h-4 shrink-0" />;
      case 'events':
        return <Calendar className="w-4 h-4 shrink-0" />;
      case 'hotels':
        return <Building2 className="w-4 h-4 shrink-0" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 shrink-0" />;
      case 'courier':
        return <Package className="w-4 h-4 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
      isActive
        ? darkMode
          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
          : 'bg-cyan-50 text-cyan-900 border border-cyan-200 font-semibold'
        : darkMode
        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
    }`;

  return (
    <aside
      className={`relative flex flex-col justify-between border-r transition-colors duration-200 z-10 select-none ${
        collapsed ? 'w-20' : 'w-64'
      } ${
        darkMode
          ? 'bg-slate-900/95 border-slate-800 text-slate-300'
          : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      {/* Top section: Nav list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Nav */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Platform Overview
            </p>
          )}

          <button
            onClick={() => onSelectTab('dashboard')}
            className={`w-full ${navItemClass(activeTab === 'dashboard')}`}
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            {!collapsed && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => onSelectTab('modules')}
            className={`w-full ${navItemClass(activeTab === 'modules')}`}
            title="Module Management"
          >
            <Sliders className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            {!collapsed && <span>Module Management</span>}
          </button>

          <button
            onClick={() => onSelectTab('dispatch')}
            className={`w-full ${navItemClass(activeTab === 'dispatch')}`}
            title="Autonomous GPS Dispatch Simulator"
          >
            <Navigation className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            {!collapsed && <span>GPS Dispatcher</span>}
          </button>
        </div>

        {/* Afronala Flutter SuperApp Control Plane */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                SuperApp Governance
              </p>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono">
                Flutter
              </span>
            </div>
          )}

          <button
            onClick={() => onSelectTab('superapp-approvals')}
            className={`w-full ${navItemClass(activeTab === 'superapp-approvals')}`}
            title="Document, Vehicle & Role Activation Approvals"
          >
            <FileCheck2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {!collapsed && <span>Approvals &amp; Eligibility</span>}
          </button>

          <button
            onClick={() => onSelectTab('superapp-bidding')}
            className={`w-full ${navItemClass(activeTab === 'superapp-bidding')}`}
            title="Vehicle Owner Fleet, Truck Bidding & Escrow"
          >
            <Gavel className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            {!collapsed && <span>Fleet, Bids &amp; Escrow</span>}
          </button>

          <button
            onClick={() => onSelectTab('superapp-pricing')}
            className={`w-full ${navItemClass(activeTab === 'superapp-pricing')}`}
            title="Dynamic Pricing, Surge & FeatureFlag Studio"
          >
            <Flame className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            {!collapsed && <span>Pricing, Surge &amp; Flags</span>}
          </button>

          <button
            onClick={() => onSelectTab('superapp-inspector')}
            className={`w-full ${navItemClass(activeTab === 'superapp-inspector')}`}
            title="SuperApp Monorepo, Schema Sync & Cloud RPC Inspector"
          >
            <Archive className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            {!collapsed && <span>SuperApp Inspector</span>}
          </button>

          <button
            onClick={() => onSelectTab('superapp-diagnostics')}
            className={`w-full ${navItemClass(activeTab === 'superapp-diagnostics')}`}
            title="Back4App Connectivity Ping & .apk Activity Stream"
          >
            <Activity
              className={`w-4 h-4 shrink-0 ${
                activePulseCount > 0
                  ? 'text-rose-600 dark:text-rose-400 animate-pulse motion-reduce:animate-none'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Bridge Diagnostics</span>
                {activePulseCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400 animate-ping motion-reduce:animate-none" />
                    {activePulseCount}
                  </span>
                )}
              </div>
            )}
          </button>
        </div>

        {/* Dynamic SuperApp Modules */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Active Modules
              </p>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono">
                Back4App
              </span>
            </div>
          )}

          {isRideEnabled && (
            <button
              onClick={() => onSelectTab('ride')}
              className={`w-full ${navItemClass(activeTab === 'ride' || activeTab.startsWith('ride-'))}`}
              title="Ride Module"
            >
              <div className="text-cyan-600 dark:text-cyan-400">{getModuleIcon('ride')}</div>
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Ride Module</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              )}
            </button>
          )}

          {isTruckEnabled && (
            <button
              onClick={() => onSelectTab('truck')}
              className={`w-full ${navItemClass(activeTab === 'truck' || activeTab.startsWith('truck-'))}`}
              title="Truck Delivery"
            >
              <div className="text-blue-600 dark:text-blue-400">{getModuleIcon('truck')}</div>
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Truck Delivery</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              )}
            </button>
          )}

          {isFoodEnabled && (
            <button
              onClick={() => onSelectTab('module-food')}
              className={`w-full ${navItemClass(activeTab === 'module-food')}`}
              title="Food Delivery"
            >
              <div className="text-orange-600 dark:text-orange-400">{getModuleIcon('food')}</div>
              {!collapsed && <span>Food Delivery</span>}
            </button>
          )}

          {isMarketplaceEnabled && (
            <button
              onClick={() => onSelectTab('module-marketplace')}
              className={`w-full ${navItemClass(activeTab === 'module-marketplace')}`}
              title="Marketplace"
            >
              <div className="text-purple-600 dark:text-purple-400">{getModuleIcon('marketplace')}</div>
              {!collapsed && <span>Marketplace</span>}
            </button>
          )}

          {isEventsEnabled && (
            <button
              onClick={() => onSelectTab('module-events')}
              className={`w-full ${navItemClass(activeTab === 'module-events')}`}
              title="Events & Tickets"
            >
              <div className="text-pink-600 dark:text-pink-400">{getModuleIcon('events')}</div>
              {!collapsed && <span>Events</span>}
            </button>
          )}

          {isHotelsEnabled && (
            <button
              onClick={() => onSelectTab('module-hotels')}
              className={`w-full ${navItemClass(activeTab === 'module-hotels')}`}
              title="Hotels"
            >
              <div className="text-indigo-600 dark:text-indigo-400">{getModuleIcon('hotels')}</div>
              {!collapsed && <span>Hotels</span>}
            </button>
          )}

          {isWalletEnabled && (
            <button
              onClick={() => onSelectTab('module-wallet')}
              className={`w-full ${navItemClass(activeTab === 'module-wallet')}`}
              title="Wallet & Payments"
            >
              <div className="text-emerald-600 dark:text-emerald-400">{getModuleIcon('wallet')}</div>
              {!collapsed && <span>Wallet</span>}
            </button>
          )}

          {isCourierEnabled && (
            <button
              onClick={() => onSelectTab('module-courier')}
              className={`w-full ${navItemClass(activeTab === 'module-courier')}`}
              title="Courier Service"
            >
              <div className="text-teal-600 dark:text-teal-400">{getModuleIcon('courier')}</div>
              {!collapsed && <span>Courier</span>}
            </button>
          )}

          {modules
            .filter(
              (m) =>
                m.enabled &&
                m.key !== 'more' &&
                !['ride', 'truck', 'food', 'marketplace', 'events', 'hotels', 'wallet', 'courier'].includes(m.key)
            )
            .map((customMod) => (
              <button
                key={customMod.key}
                onClick={() => onSelectTab(`module-${customMod.key}`)}
                className={`w-full ${navItemClass(activeTab === `module-${customMod.key}`)}`}
                title={customMod.name}
              >
                <div className="text-cyan-600 dark:text-cyan-400">
                  {getModuleIcon(customMod.key, customMod.icon)}
                </div>
                {!collapsed && <span className="truncate">{customMod.name}</span>}
              </button>
            ))}

          {!isRideEnabled &&
            !isTruckEnabled &&
            modules.filter((m) => m.enabled && m.key !== 'more').length === 0 && (
              <div className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                All modules inactive. Enable them in Module Management.
              </div>
            )}
        </div>

        {/* Operations & Insights */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Operations &amp; Insights
            </p>
          )}

          <button
            onClick={() => onSelectTab('customers')}
            className={`w-full ${navItemClass(activeTab === 'customers')}`}
            title="Customers & Corporate Shippers"
          >
            <Users className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
            {!collapsed && <span>Customers</span>}
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className={`w-full ${navItemClass(activeTab === 'reports')}`}
            title="Financial Reports & Ledger"
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
            {!collapsed && <span>Reports</span>}
          </button>

          <button
            onClick={() => onSelectTab('notifications')}
            className={`w-full ${navItemClass(activeTab === 'notifications')}`}
            title="Notifications"
          >
            <Bell className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                    {unreadCount}
                  </span>
                )}
              </div>
            )}
          </button>

          <button
            onClick={() => onSelectTab('livequery')}
            className={`w-full ${navItemClass(activeTab === 'livequery')}`}
            title="Parse LiveQuery & Webhook Triggers"
          >
            <Radio className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {!collapsed && <span>LiveQuery &amp; Webhooks</span>}
          </button>

          <button
            onClick={() => onSelectTab('ambalay')}
            className={`w-full ${navItemClass(activeTab === 'ambalay')}`}
            title="AmbaLay Maps Ethiopia Geospatial Suite"
          >
            <Compass className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            {!collapsed && <span>AmbaLay Maps</span>}
          </button>

          <button
            onClick={() => onSelectTab('geofences')}
            className={`w-full ${navItemClass(activeTab === 'geofences')}`}
            title="AmbaLay Geofence Security & Perimeter Manager"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            {!collapsed && <span>Geofence Manager</span>}
          </button>

          <button
            onClick={() => onSelectTab('settlements')}
            className={`w-full ${navItemClass(activeTab === 'settlements')}`}
            title="Telebirr, CBE Birr & Chapa Settlements"
          >
            <CreditCard className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {!collapsed && <span>Payment Hub</span>}
          </button>

          <button
            onClick={() => onSelectTab('compliance')}
            className={`w-full ${navItemClass(activeTab === 'compliance')}`}
            title="Fuel Efficiency & Tariff Regulatory Compliance"
          >
            <Leaf className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            {!collapsed && <span>Fleet Compliance</span>}
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full ${navItemClass(activeTab === 'settings')}`}
            title="Settings & Governance"
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </div>

      {/* Footer: Collapse button & logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {!collapsed && (
          <div className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Back4App Proxy</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">SYNCED</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Server-side Parse BaaS</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-1">
          <button
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar collapse"
            className={`p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              collapsed ? 'w-full flex justify-center' : ''
            }`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {!collapsed && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors whitespace-nowrap"
              title="Lock Screen / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Panel</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
