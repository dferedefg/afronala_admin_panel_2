import React, { useState } from 'react';
import {
  Car,
  Truck,
  Utensils,
  ShoppingBag,
  Calendar,
  Building2,
  Wallet,
  Package,
  Sparkles,
  ShieldAlert,
  Database,
  CheckCircle2,
  RefreshCw,
  Code2,
  Plus,
  ArrowRight,
  Heart,
  Wrench,
  Compass,
  Briefcase,
  Layers,
  Lock,
} from 'lucide-react';
import { ModuleItem, PermissionAction } from '../types';
import { hasPermission } from '../services/rbac';

interface ModuleManagementProps {
  modules: ModuleItem[];
  darkMode: boolean;
  userRole?: string;
  onToggleModule: (key: string, enabled: boolean) => Promise<void>;
  onForceSync: () => Promise<void>;
  onOpenRegisterModal: () => void;
  onOpenSchemaEditor?: (moduleKey: string) => void;
  onSelectModule: (key: string) => void;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
}

export const ModuleManagement: React.FC<ModuleManagementProps> = ({
  modules,
  userRole = 'Super Admin',
  onToggleModule,
  onForceSync,
  onOpenRegisterModal,
  onOpenSchemaEditor,
  onSelectModule,
  onGuardPermission,
}) => {
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  const canManageModules = hasPermission(userRole, 'manage_modules');

  const checkModuleAuthority = (label: string): boolean => {
    if (onGuardPermission) {
      return onGuardPermission('manage_modules', label);
    }
    return canManageModules;
  };

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    if (!checkModuleAuthority(`Toggle ${key} module state`)) return;
    setTogglingKey(key);
    try {
      await onToggleModule(key, !currentEnabled);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleSync = async () => {
    if (!checkModuleAuthority('Force cloud schema sync to Back4App')) return;
    setSyncing(true);
    try {
      await onForceSync();
      setSyncMessage('Successfully synchronized ModuleRegistry with Back4App Parse proxy.');
      setTimeout(() => setSyncMessage(null), 3500);
    } finally {
      setSyncing(false);
    }
  };

  const handleRegisterClick = () => {
    if (!checkModuleAuthority('Register new SuperApp module')) return;
    onOpenRegisterModal();
  };

  const handleSchemaClick = (moduleKey: string) => {
    if (!checkModuleAuthority(`Modify ${moduleKey} Parse class schema`)) return;
    onOpenSchemaEditor?.(moduleKey);
  };

  const getModuleIcon = (key: string, iconName?: string) => {
    if (iconName === 'Heart') return <Heart className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
    if (iconName === 'Compass') return <Compass className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
    if (iconName === 'Wrench') return <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (iconName === 'Briefcase') return <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;

    switch (key) {
      case 'ride':
        return <Car className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case 'truck':
        return <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'food':
        return <Utensils className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'marketplace':
        return <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'events':
        return <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'hotels':
        return <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'wallet':
        return <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'courier':
        return <Package className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  const cardClass =
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Platform Architecture</span>
            <span aria-hidden="true">·</span>
            <span>ModuleRegistry Class</span>
            <span aria-hidden="true">·</span>
            <span className={canManageModules ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
              {canManageModules ? 'Super Admin Write Authority' : `Read-Only (${userRole})`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Module Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enable, disable, or register SuperApp micro-verticals in real time. Changes dynamically rewire sidebar routes and server-proxied Parse schemas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleRegisterClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            {canManageModules ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Register New Module</span>
          </button>

          {onOpenSchemaEditor && (
            <button
              onClick={() => handleSchemaClick('ride')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Visual Schema</span>
            </button>
          )}

          <button
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{showJsonInspector ? 'Hide Schema' : 'Parse Schema'}</span>
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Back4App'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Governance Callout */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-400">
          {canManageModules ? <ShieldAlert className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </div>
        <div className="text-xs">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            {canManageModules
              ? 'Super Admin Governance Active'
              : `Read-Only View · Current Persona (${userRole}) Cannot Mutate ModuleRegistry`}
          </p>
          <p className="text-amber-800/80 dark:text-slate-400 mt-0.5">
            {canManageModules
              ? 'Disabling a module removes it from the Afronala mobile SuperApp and operations sidebar immediately. Registering a module provisions its Parse classes via the server proxy.'
              : 'Switch to Daniel Ferede (Super Admin) in the top-right persona menu to enable, disable, or provision SuperApp modules.'}
          </p>
        </div>
      </div>

      {/* East Africa Commerce & Lifestyle Standby Banner */}
      <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-gradient-to-r from-cyan-50/70 via-blue-50/50 to-slate-50/50 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Consumer Pillar Standby</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-cyan-700 dark:text-cyan-300">8 East African Countries</span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Modules Standby · Commerce &amp; Lifestyle Services
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Explore localized food delivery, multi-vendor marketplace, events, safari lodges, digital wallet rails, and express courier fleets across ET, KE, UG, RW, TZ, DJ, SO, and SS.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectModule('commerce-standby')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors whitespace-nowrap shrink-0 shadow-xs self-start sm:self-auto"
        >
          <span>Open Standby Console</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* JSON Schema Inspector */}
      {showJsonInspector && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-cyan-300 font-mono text-[11px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans font-bold text-white flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Back4App Parse Class: ModuleRegistry</span>
            </span>
            <span className="text-[11px] text-slate-400 font-sans">Live JSON Representation</span>
          </div>
          <pre className="overflow-x-auto max-h-48 p-3 rounded-lg bg-slate-950/90 border border-slate-800">
            {JSON.stringify(modules, null, 2)}
          </pre>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const isToggling = togglingKey === mod.key;

          if (mod.key === 'more') {
            return (
              <div
                key="more-modules-card"
                onClick={handleRegisterClick}
                className="p-5 rounded-xl border-2 border-dashed border-cyan-300 dark:border-cyan-500/30 bg-cyan-50/40 dark:bg-slate-900/60 hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium text-cyan-700 dark:text-cyan-400">
                      Provision Service
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                    Register New Module
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Launch the provisioning dialog to add new SuperApp verticals (Healthcare, Stays, Rentals) and generate typed Back4App Parse classes.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-cyan-200/70 dark:border-slate-800 flex items-center justify-between text-xs text-cyan-700 dark:text-cyan-400 font-semibold">
                  <span>Open Registration Modal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          }

          return (
            <div
              key={mod.key}
              className={`p-5 rounded-xl transition-colors flex flex-col justify-between ${cardClass} ${
                mod.enabled
                  ? 'border-cyan-500/40 dark:border-cyan-500/30'
                  : 'opacity-85 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        mod.enabled
                          ? 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {getModuleIcon(mod.key, mod.icon)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mod.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{mod.category}</span>
                        {mod.isCustom && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-purple-600 dark:text-purple-400 font-medium">Custom Vertical</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Functional Toggle Switch */}
                  {mod.canToggle ? (
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggle(mod.key, mod.enabled)}
                      aria-label={`Toggle ${mod.name}`}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                        mod.enabled ? 'bg-cyan-600 dark:bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-150 ${
                          mod.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      Planned
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  {mod.description}
                </p>

                {mod.customClasses && mod.customClasses.length > 0 && (
                  <div className="mb-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex flex-wrap gap-1.5 items-center">
                    <span className="text-slate-400 font-sans">Parse Classes:</span>
                    <span>{mod.customClasses.join(' · ')}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span
                  className={`font-semibold text-[11px] ${
                    mod.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'
                  }`}
                >
                  {mod.enabled ? 'Active in SuperApp' : 'Disabled'}
                </span>

                <div className="flex items-center gap-2">
                  {onOpenSchemaEditor && (
                    <button
                      onClick={() => handleSchemaClick(mod.key)}
                      className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                      title="Edit Parse class schema fields"
                    >
                      Schema
                    </button>
                  )}
                  {['food', 'marketplace', 'events', 'hotels', 'courier', 'wallet'].includes(mod.key) ? (
                    <button
                      onClick={() => onSelectModule(mod.key)}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-semibold flex items-center gap-1 whitespace-nowrap"
                      title="Open East Africa Standby Hub"
                    >
                      <span>Standby Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : mod.enabled ? (
                    <button
                      onClick={() => onSelectModule(mod.key)}
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
