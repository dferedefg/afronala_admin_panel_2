import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Car,
  Truck,
  Users,
  Sliders,
  Settings,
  Bell,
  Plus,
  Moon,
  Sun,
  Database,
  Code2,
  ArrowRight,
  Navigation,
  Radio,
  Layers,
  Compass,
  ShieldCheck,
  CreditCard,
  Leaf,
  BarChart3,
  FileCheck2,
  Gavel,
  Flame,
  Archive,
  Activity,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onToggleTheme: () => void;
  onOpenDbModal: () => void;
  onOpenFlutterModal: () => void;
  onOpenRegisterModal: () => void;
  onOpenSchemaModal?: () => void;
  darkMode: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  onOpenDbModal,
  onOpenFlutterModal,
  onOpenRegisterModal,
  onOpenSchemaModal,
  darkMode,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'dashboard', label: 'Go to Dashboard', group: 'Navigation', icon: <LayoutDashboard className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
    { id: 'superapp-approvals', label: 'SuperApp Approvals, Vehicle & Eligibility Queue', group: 'SuperApp Governance', icon: <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'superapp-bidding', label: 'Vehicle Owner Fleet, Truck Bidding & Escrow Desk', group: 'SuperApp Governance', icon: <Gavel className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { id: 'superapp-pricing', label: 'Dynamic Pricing, Surge & FeatureFlag Studio', group: 'SuperApp Governance', icon: <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
    { id: 'superapp-inspector', label: 'SuperApp Monorepo, Schema Sync & Cloud RPC Inspector', group: 'SuperApp Governance', icon: <Archive className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
    { id: 'back4app-classes', label: 'Back4App Database Classes (7 Classes · 260+ Records Explorer)', group: 'SuperApp Governance', icon: <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
    { id: 'superapp-diagnostics', label: 'Bridge Diagnostics: Connectivity Ping & .apk Activity Stream', group: 'SuperApp Governance', icon: <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'dispatch', label: 'Autonomous GPS Dispatch Simulator', group: 'Operations', icon: <Navigation className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
    { id: 'ambalay', label: 'AmbaLay Maps Ethiopia Geospatial Hub', group: 'Geospatial', icon: <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
    { id: 'geofences', label: 'AmbaLay Geofence Perimeter Manager', group: 'Geospatial', icon: <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> },
    { id: 'settlements', label: 'Telebirr, CBE Birr & Chapa Payment Hub', group: 'Finance', icon: <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'reports', label: 'Financial & Operational Reports (CSV Export)', group: 'Finance', icon: <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'compliance', label: 'Fuel Efficiency & Tariff Regulatory Compliance', group: 'Operations', icon: <Leaf className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
    { id: 'livequery', label: 'Parse LiveQuery & Webhooks Hub', group: 'Real-Time', icon: <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'schema', label: 'Visual Back4App Schema Designer', group: 'Admin', icon: <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> },
    { id: 'modules', label: 'Open Module Management', group: 'Admin', icon: <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
    { id: 'register-module', label: 'Register New Module (Back4App Schema)', group: 'Admin', icon: <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
    { id: 'ride', label: 'Go to Ride Module', group: 'Navigation', icon: <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
    { id: 'truck', label: 'Go to Truck Delivery', group: 'Navigation', icon: <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { id: 'customers', label: 'Customer & Shipper Directory', group: 'Navigation', icon: <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" /> },
    { id: 'notifications', label: 'Open Notification History', group: 'Navigation', icon: <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400" /> },
    { id: 'settings', label: 'System Settings & RBAC Governance', group: 'Navigation', icon: <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" /> },
    { id: 'theme', label: `Switch to ${darkMode ? 'Light' : 'Dark'} Mode`, group: 'Preferences', icon: darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" /> },
    { id: 'db', label: 'Inspect Back4App Proxy Status', group: 'Cloud', icon: <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'flutter', label: 'View Flutter / Dart SDK Code', group: 'Developer', icon: <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
  ];

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.group.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onClose();
    if (id === 'theme') {
      onToggleTheme();
    } else if (id === 'db') {
      onOpenDbModal();
    } else if (id === 'flutter') {
      onOpenFlutterModal();
    } else if (id === 'register-module') {
      onOpenRegisterModal();
    } else if (id === 'schema') {
      onOpenSchemaModal?.();
    } else {
      onNavigate(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        {/* Search header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search views..."
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* List of actions */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg transition-colors text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.group}</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              No matching commands found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Afronala Command Palette</span>
          <span className="font-mono">Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
