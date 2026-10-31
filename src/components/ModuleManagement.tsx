import React, { useState, useMemo } from 'react';
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
  Globe2,
  Sliders,
  SlidersHorizontal,
  Search,
  Filter,
  Check,
  X,
  Scale,
  MapPin,
  CreditCard,
  Building,
  AlertTriangle,
  Info,
  Table,
  LayoutGrid,
  Percent,
  Radio,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  AdminUser,
  EastAfricaCountryCode,
  EastAfricaCurrency,
  EastAfricaModuleCountryConfig,
  ModuleItem,
  ModuleOperatingStatus,
  PermissionAction,
  ToastMessage,
} from '../types';
import { hasPermission } from '../services/rbac';
import {
  ALL_COUNTRY_OPTIONS,
  EAST_AFRICAN_COUNTRIES_META,
  EAST_AFRICAN_COUNTRIES_ORDERED,
  calculateRegionalModuleStats,
} from '../services/eastAfricaModules';

interface ModuleManagementProps {
  modules: ModuleItem[];
  darkMode: boolean;
  user?: AdminUser;
  userRole?: string;
  userJurisdiction?: EastAfricaCountryCode;
  onToggleModule: (key: string, enabled: boolean) => Promise<void>;
  onToggleModuleCountry?: (
    key: string,
    countryCode: Exclude<EastAfricaCountryCode, 'ALL'>,
    enabled: boolean
  ) => Promise<void>;
  onUpdateModuleCountryConfig?: (
    key: string,
    countryCode: Exclude<EastAfricaCountryCode, 'ALL'>,
    config: Partial<EastAfricaModuleCountryConfig>
  ) => Promise<void>;
  onForceSync: () => Promise<void>;
  onOpenRegisterModal: () => void;
  onOpenSchemaEditor?: (moduleKey: string) => void;
  onSelectModule: (key: string) => void;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify?: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

export const ModuleManagement: React.FC<ModuleManagementProps> = ({
  modules,
  darkMode,
  user,
  userRole = 'Super Admin',
  userJurisdiction = 'ALL',
  onToggleModule,
  onToggleModuleCountry,
  onUpdateModuleCountryConfig,
  onForceSync,
  onOpenRegisterModal,
  onOpenSchemaEditor,
  onSelectModule,
  onGuardPermission,
  onNotify,
}) => {
  // Determine initial jurisdiction: if user has an assigned country, default to it; otherwise default to 'ALL'
  const assignedCountry = (user?.jurisdictionCountry || userJurisdiction || 'ALL') as EastAfricaCountryCode;
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<EastAfricaCountryCode>(assignedCountry);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  // Edit Country Parameters Modal State
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [editingCountryCode, setEditingCountryCode] = useState<Exclude<EastAfricaCountryCode, 'ALL'> | null>(null);
  const [editForm, setEditForm] = useState<Partial<EastAfricaModuleCountryConfig>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  const canManageModules = hasPermission(userRole, 'manage_modules');

  const checkModuleAuthority = (label: string): boolean => {
    if (onGuardPermission) {
      return onGuardPermission('manage_modules', label);
    }
    return canManageModules;
  };

  // Global module toggle
  const handleToggleGlobal = async (key: string, currentEnabled: boolean) => {
    if (!checkModuleAuthority(`Toggle global ${key} module state`)) return;
    setTogglingKey(key);
    try {
      await onToggleModule(key, !currentEnabled);
      onNotify?.(
        `${key.toUpperCase()} Status Updated`,
        `Global availability set to ${!currentEnabled ? 'Enabled' : 'Disabled'}.`,
        'success'
      );
    } finally {
      setTogglingKey(null);
    }
  };

  // Country-scoped module toggle
  const handleToggleCountry = async (
    key: string,
    countryCode: Exclude<EastAfricaCountryCode, 'ALL'>,
    currentCountryEnabled: boolean
  ) => {
    const meta = EAST_AFRICAN_COUNTRIES_META[countryCode];
    if (!checkModuleAuthority(`Toggle ${key} in ${meta.name} (${countryCode})`)) return;

    setTogglingKey(`${key}-${countryCode}`);
    try {
      if (onToggleModuleCountry) {
        await onToggleModuleCountry(key, countryCode, !currentCountryEnabled);
      } else {
        // Fallback to global
        await onToggleModule(key, !currentCountryEnabled);
      }
      onNotify?.(
        `${meta.flag} ${meta.name} · ${key.toUpperCase()}`,
        `${!currentCountryEnabled ? 'Activated' : 'Deactivated'} in ${meta.name}.`,
        'success'
      );
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
      onNotify?.('Cloud Sync Complete', 'ModuleRegistry synchronized with Back4App.', 'success');
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

  // Open Edit Modal for a module in a country
  const handleOpenEditModal = (
    mod: ModuleItem,
    countryCode: Exclude<EastAfricaCountryCode, 'ALL'>
  ) => {
    if (!checkModuleAuthority(`Configure ${mod.name} parameters for ${countryCode}`)) return;
    const config = mod.countryConfigs?.[countryCode];
    setEditingModule(mod);
    setEditingCountryCode(countryCode);
    setEditForm(
      config
        ? { ...config }
        : {
            countryCode,
            countryName: EAST_AFRICAN_COUNTRIES_META[countryCode].name,
            flag: EAST_AFRICAN_COUNTRIES_META[countryCode].flag,
            enabled: true,
            operatingStatus: 'active',
            statusLabel: 'Active',
            regulatoryAuthority: EAST_AFRICAN_COUNTRIES_META[countryCode].transportRegulator,
            statutoryCommissionCapPct: EAST_AFRICAN_COUNTRIES_META[countryCode].statutoryCommissionCapPct,
            withholdingTaxPct: countryCode === 'KE' ? 5 : countryCode === 'UG' ? 6 : countryCode === 'RW' ? 3 : 2,
            currency: EAST_AFRICAN_COUNTRIES_META[countryCode].currency,
            primaryPaymentRail: EAST_AFRICAN_COUNTRIES_META[countryCode].primaryPaymentRail,
            activeFleetCount: 20,
            supportedCities: [EAST_AFRICAN_COUNTRIES_META[countryCode].capital],
            primaryHubs: [`${EAST_AFRICAN_COUNTRIES_META[countryCode].capital} Central Hub`],
            speedLimiterRequired: EAST_AFRICAN_COUNTRIES_META[countryCode].speedLimiterMandate,
            cashOnDeliveryAllowed: countryCode !== 'RW',
            crossBorderBondedTransit: mod.category === 'Logistics',
            emergencySOSHooked: true,
            notes: `Configured parameters for ${mod.name} in ${EAST_AFRICAN_COUNTRIES_META[countryCode].name}.`,
          }
    );
  };

  // Save updated parameters
  const handleSaveCountryConfig = async () => {
    if (!editingModule || !editingCountryCode || !onUpdateModuleCountryConfig) return;
    setSavingConfig(true);
    try {
      await onUpdateModuleCountryConfig(editingModule.key, editingCountryCode, editForm);
      const meta = EAST_AFRICAN_COUNTRIES_META[editingCountryCode];
      onNotify?.(
        `Configuration Saved (${meta.flag} ${meta.code})`,
        `Updated regulatory, commission, and feature parameters for ${editingModule.name}.`,
        'success'
      );
      setEditingModule(null);
      setEditingCountryCode(null);
    } finally {
      setSavingConfig(false);
    }
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

  // Filter modules by search and category
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      // Search
      const matchesSearch =
        searchQuery.trim() === '' ||
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mod.customClasses && mod.customClasses.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));

      // Category
      const matchesCategory =
        selectedCategory === 'all' ||
        mod.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [modules, searchQuery, selectedCategory]);

  // Statistics for selected jurisdiction
  const regionalStats = useMemo(() => {
    return calculateRegionalModuleStats(modules, selectedJurisdiction);
  }, [modules, selectedJurisdiction]);

  // Calculate country badge counts (number of active modules per country)
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const code of EAST_AFRICAN_COUNTRIES_ORDERED) {
      counts[code] = modules.filter(
        (m) => m.key !== 'more' && m.countryConfigs?.[code]?.enabled
      ).length;
    }
    return counts;
  }, [modules]);

  const cardClass = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs';

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. HEADER & TOP CONTROLS                                               */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>East Africa Regional Monorepo</span>
            <span aria-hidden="true">·</span>
            <span>ModuleRegistry Class</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                canManageModules
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-amber-600 dark:text-amber-400 font-medium'
              }
            >
              {canManageModules ? 'Super Admin Write Authority' : `Read-Only (${userRole})`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-amber-500" />
            <span>SuperApp Module Registry</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure, deploy, and govern SuperApp micro-verticals across all 8 East African nations (ET, KE, UG, RW, TZ, DJ, SO, SS) with local regulatory ceilings and mobile rails.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800/60">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Cross-Border Matrix</span>
            </button>
          </div>

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

      {/* ---------------------------------------------------------------------- */}
      {/* 2. LOGGED-IN OPERATOR CONTEXT & COUNTRY JURISDICTION FILTER BAR        */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-slate-100/50 to-slate-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 space-y-3 shadow-xs">
        {/* User Persona & Operating Scope Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm shrink-0">
              {assignedCountry !== 'ALL' ? (
                <span>{EAST_AFRICAN_COUNTRIES_META[assignedCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.flag || '🌍'}</span>
              ) : (
                <Globe2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {user?.name || 'Operator'} ({userRole})
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {assignedCountry === 'ALL'
                    ? 'Assigned Operating Jurisdiction: Pan-East Africa (8 Member States)'
                    : `Assigned Operating Jurisdiction: ${EAST_AFRICAN_COUNTRIES_META[assignedCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.name} (${assignedCountry})`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedJurisdiction === assignedCountry
                  ? `✓ Showing Module Registry dynamically filtered for your operating country of login.`
                  : `Currently viewing ${selectedJurisdiction} scope. Click below to return to your assigned jurisdiction.`}
              </p>
            </div>
          </div>

          {selectedJurisdiction !== assignedCountry && (
            <button
              onClick={() => setSelectedJurisdiction(assignedCountry)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to My Country ({assignedCountry})</span>
            </button>
          )}
        </div>

        {/* 9-Country Interactive Filter Cards / Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Select Jurisdictional Operating Scope (8 Member States)</span>
            </span>

            {/* Quick dropdown for fast selection */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Jump to country:
              </span>
              <select
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value as EastAfricaCountryCode)}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {ALL_COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {ALL_COUNTRY_OPTIONS.map((c) => {
              const isSelected = selectedJurisdiction === c.code;
              const isUserAssigned = assignedCountry === c.code;
              const activeCount =
                c.code === 'ALL'
                  ? modules.filter((m) => m.key !== 'more' && m.enabled).length
                  : countryCounts[c.code] || 0;

              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedJurisdiction(c.code)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 dark:border-cyan-400 shadow-xs ring-1 ring-cyan-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {isUserAssigned && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" title="Your assigned home jurisdiction" />
                  )}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-base">{c.flag}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isSelected
                          ? 'bg-cyan-200 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {activeCount} active
                    </span>
                  </div>
                  <div>
                    <p className={`font-bold text-xs truncate ${isSelected ? 'text-cyan-900 dark:text-cyan-100' : 'text-slate-800 dark:text-slate-200'}`}>
                      {c.code === 'ALL' ? 'Pan-East Africa' : c.code}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {c.code === 'ALL' ? '8 Nations' : EAST_AFRICAN_COUNTRIES_META[c.code as Exclude<EastAfricaCountryCode, 'ALL'>]?.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. REGIONAL KPI & REGULATORY BENCHMARK SUMMARY ROW                     */}
      {/* ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${cardClass}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Active Services Deployed</span>
            <span className="text-base">{regionalStats.flag}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {regionalStats.activeCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {regionalStats.totalModules} Verticals
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {selectedJurisdiction === 'ALL'
              ? 'Platform-wide production modules'
              : `Active in ${regionalStats.scopeTitle}`}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${cardClass}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Transport Authority</span>
            <Scale className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {selectedJurisdiction === 'ALL'
              ? 'EAC & National Regulators'
              : (regionalStats as any).shortRegulator || 'FTA / NTSA / RURA'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {selectedJurisdiction === 'ALL'
              ? '8 Member State Transport Authorities'
              : (regionalStats as any).primaryRegulators}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${cardClass}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Statutory Commission Cap</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {selectedJurisdiction === 'ALL'
                ? '10% - 15%'
                : `${(regionalStats as any).statutoryCommissionCap}%`}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">ceiling</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {selectedJurisdiction === 'KE'
              ? 'NTSA Ride-Hailing Regulations 2022'
              : selectedJurisdiction === 'ALL'
              ? 'National statutory maximums'
              : 'Jurisdictional ceiling rule'}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${cardClass}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Primary Mobile Clearing</span>
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {selectedJurisdiction === 'ALL'
              ? 'Telebirr · M-PESA · MoMo · TIPS'
              : (regionalStats as any).primaryRails}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {selectedJurisdiction === 'ALL'
              ? 'Pan-regional cross-border settlement'
              : `Local currency: ${(regionalStats as any).currency} (${(regionalStats as any).currencySymbol})`}
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. SEARCH, CATEGORY FILTER & VIEW TABS                                  */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Verticals' },
            { id: 'Mobility', label: 'Mobility' },
            { id: 'Logistics', label: 'Logistics' },
            { id: 'Commerce', label: 'Commerce' },
            { id: 'Lifestyle', label: 'Lifestyle' },
            { id: 'Hospitality', label: 'Hospitality' },
            { id: 'Fintech', label: 'Fintech' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search modules, classes, corridors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* JSON Schema Inspector */}
      {showJsonInspector && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-cyan-300 font-mono text-[11px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans font-bold text-white flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Back4App Parse Class: ModuleRegistry</span>
            </span>
            <span className="text-[11px] text-slate-400 font-sans">Live Regional JSON Representation</span>
          </div>
          <pre className="overflow-x-auto max-h-48 p-3 rounded-lg bg-slate-950/90 border border-slate-800">
            {JSON.stringify(modules, null, 2)}
          </pre>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 5. VIEW MODE A: REGIONAL MODULE CARDS GRID                             */}
      {/* ---------------------------------------------------------------------- */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((mod) => {
            const isToggling =
              togglingKey === mod.key ||
              (selectedJurisdiction !== 'ALL' && togglingKey === `${mod.key}-${selectedJurisdiction}`);

            if (mod.key === 'more') {
              return (
                <div
                  key="more-modules-card"
                  onClick={handleRegisterClick}
                  className="p-5 rounded-xl border-2 border-dashed border-cyan-300 dark:border-cyan-500/30 bg-cyan-50/40 dark:bg-slate-900/60 hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors cursor-pointer flex flex-col justify-between group min-h-[300px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400">
                        East Africa Provisioning
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                      Register New Regional Module
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Launch the multi-country provisioning dialog to deploy new SuperApp verticals (Healthcare, Rentals, Agricultural Haulage) with Back4App Parse classes across ET, KE, UG, RW, TZ, DJ, SO, SS.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-cyan-200/70 dark:border-slate-800 flex items-center justify-between text-xs text-cyan-700 dark:text-cyan-400 font-semibold">
                    <span>Open Multi-Country Modal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            }

            // Resolve country-specific configuration for selected jurisdiction
            const targetCountryCode = selectedJurisdiction !== 'ALL' ? selectedJurisdiction : 'ET';
            const countryCfg = mod.countryConfigs?.[targetCountryCode as Exclude<EastAfricaCountryCode, 'ALL'>];
            const isCountryEnabled = countryCfg ? countryCfg.enabled : mod.enabled;
            const operatingStatus = countryCfg ? countryCfg.operatingStatus : (mod.enabled ? 'active' : 'disabled');
            const countryMeta = EAST_AFRICAN_COUNTRIES_META[targetCountryCode as Exclude<EastAfricaCountryCode, 'ALL'>];

            return (
              <div
                key={mod.key}
                className={`p-5 rounded-xl transition-all flex flex-col justify-between min-h-[320px] ${cardClass} ${
                  (selectedJurisdiction === 'ALL' ? mod.enabled : isCountryEnabled)
                    ? 'border-cyan-500/50 dark:border-cyan-500/30 shadow-xs'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Card Header: Icon, Name, Category, & Main Toggle */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                          (selectedJurisdiction === 'ALL' ? mod.enabled : isCountryEnabled)
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {getModuleIcon(mod.key, mod.icon)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {mod.name}
                          </h3>
                          {mod.isCustom && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{mod.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-cyan-600 dark:text-cyan-400">{mod.key}</span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    {mod.canToggle ? (
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => {
                            if (selectedJurisdiction === 'ALL') {
                              handleToggleGlobal(mod.key, mod.enabled);
                            } else {
                              handleToggleCountry(mod.key, selectedJurisdiction, isCountryEnabled);
                            }
                          }}
                          aria-label={`Toggle ${mod.name}`}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                            (selectedJurisdiction === 'ALL' ? mod.enabled : isCountryEnabled)
                              ? 'bg-cyan-600 dark:bg-cyan-500'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-150 ${
                              (selectedJurisdiction === 'ALL' ? mod.enabled : isCountryEnabled)
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                          {selectedJurisdiction === 'ALL' ? 'Global Switch' : `${selectedJurisdiction} Scope`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">Planned</span>
                    )}
                  </div>

                  {/* Status Badges Strip */}
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    {selectedJurisdiction === 'ALL' ? (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          mod.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${mod.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{mod.enabled ? 'Globally Active' : 'Globally Disabled'}</span>
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          operatingStatus === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : operatingStatus === 'pilot'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : operatingStatus === 'staged'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{countryMeta?.flag}</span>
                        <span>
                          {operatingStatus === 'active'
                            ? `Active in ${countryMeta?.name}`
                            : operatingStatus === 'pilot'
                            ? `Pilot in ${countryMeta?.name}`
                            : operatingStatus === 'staged'
                            ? `Staged in ${countryMeta?.name}`
                            : `Disabled in ${countryMeta?.name}`}
                        </span>
                      </span>
                    )}

                    {/* Regional Scope Badge */}
                    {mod.countries && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        {mod.countries.length}/8 Nations Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                    {mod.description}
                  </p>

                  {/* Local Country Operational Parameters Strip */}
                  {selectedJurisdiction !== 'ALL' && countryCfg ? (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Percent className="w-3 h-3 text-amber-500" />
                          <span>Commission Ceiling:</span>
                        </span>
                        <span className="font-bold font-mono text-amber-700 dark:text-amber-300">
                          {countryCfg.statutoryCommissionCapPct}% Max ({countryCfg.currency})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-cyan-500" />
                          <span>Regulator:</span>
                        </span>
                        <span className="font-medium truncate max-w-[170px]" title={countryCfg.regulatoryAuthority}>
                          {countryCfg.regulatoryAuthority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-emerald-500" />
                          <span>Payment Rail:</span>
                        </span>
                        <span className="font-medium text-emerald-700 dark:text-emerald-400 truncate max-w-[170px]">
                          {countryCfg.primaryPaymentRail}
                        </span>
                      </div>

                      {countryCfg.supportedCities && countryCfg.supportedCities.length > 0 && (
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span>Hubs:</span>
                          </span>
                          <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[170px]">
                            {countryCfg.supportedCities.slice(0, 3).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Pan-East Africa View: Country Deployment Pills */
                    <div className="mb-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center justify-between mb-1.5 text-slate-400">
                        <span>East Africa Member States:</span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                          {mod.countries?.length || 0}/8
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {EAST_AFRICAN_COUNTRIES_ORDERED.map((code) => {
                          const isDeployed = mod.countryConfigs?.[code]?.enabled;
                          const meta = EAST_AFRICAN_COUNTRIES_META[code];
                          return (
                            <span
                              key={code}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJurisdiction(code);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                                isDeployed
                                  ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-300 hover:bg-cyan-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50'
                              }`}
                              title={`${meta.name}: ${isDeployed ? 'Active' : 'Disabled'}`}
                            >
                              {meta.flag} {code}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {mod.customClasses && mod.customClasses.length > 0 && (
                    <div className="mb-3 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex flex-wrap gap-1.5 items-center">
                      <span className="text-slate-400 font-sans text-[10px]">Parse Classes:</span>
                      <span className="truncate">{mod.customClasses.join(' · ')}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                  {/* Left: Configure Country Button */}
                  {selectedJurisdiction !== 'ALL' ? (
                    <button
                      onClick={() => handleOpenEditModal(mod, selectedJurisdiction)}
                      className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 transition-colors whitespace-nowrap flex items-center gap-1"
                      title={`Configure ${countryMeta?.name} specific parameters`}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Configure {selectedJurisdiction}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedJurisdiction('ET')}
                      className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <Globe2 className="w-3 h-3" />
                      <span>Inspect Nations</span>
                    </button>
                  )}

                  {/* Right: Schema & Navigate */}
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
                        <span>Standby</span>
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
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 6. VIEW MODE B: EAST AFRICA CROSS-BORDER MATRIX                         */}
      {/* ---------------------------------------------------------------------- */}
      {viewMode === 'matrix' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Pan-East Africa Cross-Border Module Deployment Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect and toggle activation states across all 8 member states. Click any cell to configure country parameters.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Module Vertical</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Global State</th>
                  {EAST_AFRICAN_COUNTRIES_ORDERED.map((code) => {
                    const meta = EAST_AFRICAN_COUNTRIES_META[code];
                    return (
                      <th
                        key={code}
                        className={`py-3 px-3 text-center cursor-pointer transition-colors ${
                          selectedJurisdiction === code
                            ? 'bg-cyan-100/70 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-200 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setSelectedJurisdiction(code)}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{meta.flag}</span>
                          <span>{code}</span>
                          <span className="text-[9px] font-normal lowercase text-slate-400">{meta.currency}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sans">
                {modules
                  .filter((m) => m.key !== 'more')
                  .map((mod) => (
                    <tr key={mod.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {getModuleIcon(mod.key, mod.icon)}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{mod.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{mod.key}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                        {mod.category}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleGlobal(mod.key, mod.enabled)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            mod.enabled
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {mod.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      {EAST_AFRICAN_COUNTRIES_ORDERED.map((code) => {
                        const cfg = mod.countryConfigs?.[code];
                        const isEnabled = cfg?.enabled ?? false;
                        const status = cfg?.operatingStatus || (isEnabled ? 'active' : 'disabled');

                        return (
                          <td
                            key={code}
                            className={`py-3 px-2 text-center transition-colors ${
                              selectedJurisdiction === code ? 'bg-cyan-50/30 dark:bg-cyan-950/20' : ''
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleCountry(mod.key, code, isEnabled)}
                                className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                                  isEnabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                                title={`Toggle in ${code}`}
                              >
                                <span
                                  className={`w-3 h-3 rounded-full bg-white shadow-xs transform transition-transform ${
                                    isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(mod, code)}
                                className="text-[9px] font-mono font-semibold text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline"
                                title="Edit commission and parameters"
                              >
                                {cfg?.statutoryCommissionCapPct || 15}% cap
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 7. MODAL: CONFIGURE COUNTRY PARAMETERS                                 */}
      {/* ---------------------------------------------------------------------- */}
      {editingModule && editingCountryCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col justify-between p-6 sm:p-7 rounded-2xl border shadow-2xl overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div>
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Configure {editingModule.name}</span>
                      <span className="text-slate-400">·</span>
                      <span>
                        {EAST_AFRICAN_COUNTRIES_META[editingCountryCode].flag} {EAST_AFRICAN_COUNTRIES_META[editingCountryCode].name} ({editingCountryCode})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Customize local regulatory filing number, statutory commission ceiling, payment rail, and feature mandates.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingModule(null);
                    setEditingCountryCode(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 text-xs">
                {/* Status & Enablement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Operating Deployment Status
                    </label>
                    <select
                      value={editForm.operatingStatus || 'active'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          operatingStatus: e.target.value as ModuleOperatingStatus,
                          enabled: e.target.value !== 'disabled',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="active">Active (Production Ready)</option>
                      <option value="pilot">Pilot Sandbox</option>
                      <option value="staged">Staged for Launch</option>
                      <option value="regulatory_pending">Regulatory Pending</option>
                      <option value="disabled">Disabled in Country</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Local Currency Standard
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${EAST_AFRICAN_COUNTRIES_META[editingCountryCode].currency} (${EAST_AFRICAN_COUNTRIES_META[editingCountryCode].currencySymbol}) · Primary: ${EAST_AFRICAN_COUNTRIES_META[editingCountryCode].primaryPaymentRail}`}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Statutory Commission & Withholding Tax */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Statutory Commission Cap (%)</span>
                      <span className="text-[10px] text-amber-600 font-normal">
                        Ceiling: {EAST_AFRICAN_COUNTRIES_META[editingCountryCode].statutoryCommissionCapPct}%
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={editForm.statutoryCommissionCapPct ?? 15}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          statutoryCommissionCapPct: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {editingCountryCode === 'KE'
                        ? 'Under NTSA 2022 Regulations, digital hailing operators cannot exceed 10% platform commission.'
                        : 'Statutory commission ceiling enforced on all trip and delivery dispatches in this country.'}
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Statutory Withholding Tax (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={editForm.withholdingTaxPct ?? 2}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          withholdingTaxPct: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Revenue authority withholding tax deducted automatically from daily driver disbursements.
                    </p>
                  </div>
                </div>

                {/* Regulatory Authority & Filing Directive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Local Regulatory Authority
                    </label>
                    <input
                      type="text"
                      value={editForm.regulatoryAuthority || ''}
                      onChange={(e) => setEditForm({ ...editForm, regulatoryAuthority: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Filing / License / Directive Number
                    </label>
                    <input
                      type="text"
                      value={editForm.regulatoryFilingNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, regulatoryFilingNumber: e.target.value })}
                      placeholder="e.g. NTSA/RH/2022-0941"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Primary Payment Rail */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Primary Payment Rail &amp; Clearing Switch
                  </label>
                  <input
                    type="text"
                    value={editForm.primaryPaymentRail || ''}
                    onChange={(e) => setEditForm({ ...editForm, primaryPaymentRail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Supported Cities */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Supported Municipalities &amp; Dispatch Zones (comma separated)
                  </label>
                  <input
                    type="text"
                    value={(editForm.supportedCities || []).join(', ')}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        supportedCities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Feature Mandates & Checkboxes */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                  <p className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                    Country-Level Governance &amp; Telematics Flags
                  </p>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.speedLimiterRequired)}
                      onChange={(e) => setEditForm({ ...editForm, speedLimiterRequired: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Mandate Telematics Speed Limiter Compliance (e.g. KS 2295 / ERA speed governors)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.cashOnDeliveryAllowed)}
                      onChange={(e) => setEditForm({ ...editForm, cashOnDeliveryAllowed: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Allow Cash On Delivery (COD) Transactions (disable if country mandates 100% cashless)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.crossBorderBondedTransit)}
                      onChange={(e) => setEditForm({ ...editForm, crossBorderBondedTransit: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Enable Cross-Border Bonded Customs Transit Manifest Tracking
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.emergencySOSHooked)}
                      onChange={(e) => setEditForm({ ...editForm, emergencySOSHooked: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Hook Emergency SOS 999 / National Police Operations Dispatch
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingModule(null);
                  setEditingCountryCode(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingConfig}
                onClick={handleSaveCountryConfig}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors text-xs"
              >
                {savingConfig ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save {editingCountryCode} Parameters</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
