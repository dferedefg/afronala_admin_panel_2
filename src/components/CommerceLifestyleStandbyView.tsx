import React, { useState, useEffect } from 'react';
import {
  Utensils,
  ShoppingBag,
  Calendar,
  Building2,
  Wallet,
  Package,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Globe2,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Clock,
  Sparkles,
  MapPin,
  Lock,
} from 'lucide-react';
import { AdminUser, EastAfricaCountryCode, PermissionAction } from '../types';
import {
  CommerceReadinessStage,
  CommerceVerticalKey,
  COMMERCE_VERTICAL_SPECS,
  CountryCommerceHubProfile,
  EAST_AFRICA_COMMERCE_DATA,
  generateDartSdkCodeForCommerce,
  simulateCommerceOrder,
  SimulatedCommerceOrderResult,
} from '../services/eastAfricaCommerce';
import { back4AppService } from '../services/back4app';

interface CommerceLifestyleStandbyViewProps {
  darkMode: boolean;
  user: AdminUser | null;
  userRole?: string;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify?: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  initialVertical?: CommerceVerticalKey;
  onNavigateModules?: () => void;
}

const ALL_COUNTRIES: { code: Exclude<EastAfricaCountryCode, 'ALL'>; name: string; flag: string }[] = [
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
];

export const CommerceLifestyleStandbyView: React.FC<CommerceLifestyleStandbyViewProps> = ({
  darkMode,
  user,
  userRole = 'Super Admin',
  onGuardPermission,
  onNotify,
  initialVertical = 'food',
  onNavigateModules,
}) => {
  // Infer active country from user's logged-in jurisdiction, or fallback to Ethiopia
  const userCountryCode: Exclude<EastAfricaCountryCode, 'ALL'> =
    user?.jurisdictionCountry && user.jurisdictionCountry !== 'ALL'
      ? (user.jurisdictionCountry as Exclude<EastAfricaCountryCode, 'ALL'>)
      : 'ET';

  const [selectedCountry, setSelectedCountry] = useState<Exclude<EastAfricaCountryCode, 'ALL'>>(userCountryCode);
  const [activeVertical, setActiveVertical] = useState<CommerceVerticalKey>(initialVertical);
  const [activeTab, setActiveTab] = useState<'catalog' | 'sandbox' | 'compliance' | 'sdk'>('catalog');
  const [copiedDart, setCopiedDart] = useState(false);

  // Sync state if user persona switched
  useEffect(() => {
    if (user?.jurisdictionCountry && user.jurisdictionCountry !== 'ALL') {
      setSelectedCountry(user.jurisdictionCountry as Exclude<EastAfricaCountryCode, 'ALL'>);
    }
  }, [user]);

  // Stage overrides per country
  const [stageOverrides, setStageOverrides] = useState<
    Record<string, Record<CommerceVerticalKey, CommerceReadinessStage>>
  >({});

  // Simulated orders history
  const [simulatedOrders, setSimulatedOrders] = useState<SimulatedCommerceOrderResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const countryProfile: CountryCommerceHubProfile =
    EAST_AFRICA_COMMERCE_DATA[selectedCountry] || EAST_AFRICA_COMMERCE_DATA.ET;

  const currentStages = stageOverrides[selectedCountry] || countryProfile.standbyStages;
  const currentStage = currentStages[activeVertical];

  const canManageModules = userRole === 'Super Admin' || userRole === 'Operations Director';

  const checkAuthority = (featureLabel: string): boolean => {
    if (onGuardPermission) {
      return onGuardPermission('manage_modules', featureLabel);
    }
    return canManageModules;
  };

  const handleStageChange = async (vertical: CommerceVerticalKey, nextStage: CommerceReadinessStage) => {
    if (!checkAuthority(`Change ${vertical} status to ${nextStage}`)) return;

    setStageOverrides((prev) => ({
      ...prev,
      [selectedCountry]: {
        ...(prev[selectedCountry] || countryProfile.standbyStages),
        [vertical]: nextStage,
      },
    }));

    // Record activity to Back4App proxy
    await back4AppService.addClassRecord('ActivityLog', {
      summary: `Commerce Vertical "${COMMERCE_VERTICAL_SPECS[vertical].name}" transitioned to ${nextStage.replace('_', ' ').toUpperCase()} in ${countryProfile.countryName} (${countryProfile.flag})`,
      category: 'regulatory',
      vertical,
      countryCode: selectedCountry,
      createdAt: new Date().toISOString(),
    }).catch(() => null);

    onNotify?.(
      'Stage Transitioned',
      `${COMMERCE_VERTICAL_SPECS[vertical].name} in ${countryProfile.countryName} updated to ${nextStage.replace('_', ' ')}.`,
      'success'
    );
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const order = simulateCommerceOrder(selectedCountry, activeVertical, simulatedOrders.length);
      setSimulatedOrders((prev) => [order, ...prev]);

      // Record to Back4App ActivityLog and specific Parse class
      await back4AppService.addClassRecord('ActivityLog', {
        summary: `[${order.countryCode}] ${order.customerName} placed ${order.vertical.toUpperCase()} order: ${order.itemsSummary} (${order.currency} ${order.amountLocal.toLocaleString()} via ${order.paymentRail})`,
        category: 'operations',
        vertical: order.vertical,
        countryCode: order.countryCode,
        createdAt: new Date().toISOString(),
      }).catch(() => null);

      await back4AppService.addClassRecord(order.parseRecordClass, {
        orderId: order.orderId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        itemsSummary: order.itemsSummary,
        amountLocal: order.amountLocal,
        currency: order.currency,
        amountETB: order.amountETB,
        paymentRail: order.paymentRail,
        countryCode: order.countryCode,
        countryName: order.countryName,
        status: order.status,
        createdAt: new Date().toISOString(),
      }).catch(() => null);

      onNotify?.(
        `Simulation Executed (${countryProfile.flag} ${countryProfile.currency} ${order.amountLocal.toLocaleString()})`,
        `Dispatched simulated order ${order.orderId} for ${order.customerName} via ${order.paymentRail}.`,
        'success'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyDart = () => {
    const code = generateDartSdkCodeForCommerce(activeVertical);
    navigator.clipboard.writeText(code);
    setCopiedDart(true);
    setTimeout(() => setCopiedDart(false), 2500);
    onNotify?.('Dart SDK Copied', `Copied model for ${COMMERCE_VERTICAL_SPECS[activeVertical].name}.`, 'info');
  };

  const getVerticalIcon = (key: CommerceVerticalKey, className = 'w-5 h-5') => {
    switch (key) {
      case 'food':
        return <Utensils className={className} />;
      case 'marketplace':
        return <ShoppingBag className={className} />;
      case 'events':
        return <Calendar className={className} />;
      case 'hotels':
        return <Building2 className={className} />;
      case 'wallet':
        return <Wallet className={className} />;
      case 'courier':
        return <Package className={className} />;
    }
  };

  const getStageLabel = (stage: CommerceReadinessStage) => {
    switch (stage) {
      case 'standby_prelaunch':
        return { label: 'Standby · Pre-Launch', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' };
      case 'pilot_sandbox':
        return { label: 'Pilot Sandbox Active', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800' };
      case 'public_live':
        return { label: 'Public Live in SuperApp', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' };
      case 'regulatory_review':
        return { label: 'Under Regulatory Review', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' };
    }
  };

  const cardClass = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            {onNavigateModules && (
              <>
                <button
                  onClick={onNavigateModules}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Platform Modules
                </button>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              Commerce &amp; Lifestyle Services
            </span>
            <span aria-hidden="true">·</span>
            <span>Standby Command Center</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
              East Africa Multi-Country Suite
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Modules Standby · Commerce &amp; Lifestyle</span>
            <span className="text-xl">{countryProfile.flag}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Pre-launch governance, local vendor catalogs, merchant QR payment rails, and sandbox order simulators for the 6 consumer verticals across all 8 East African partner nations.
          </p>
        </div>

        {/* Right side quick actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : `Simulate ${countryProfile.currency} Order`}</span>
          </button>

          <button
            onClick={handleCopyDart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            {copiedDart ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Flutter/Dart SDK</span>
          </button>
        </div>
      </div>

      {/* East African Country Jurisdiction Selector */}
      <div className={`p-4 rounded-xl ${cardClass} space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Country Jurisdiction of Operation
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (Logged in operator: <strong className="text-slate-800 dark:text-slate-200">{user?.name || 'Operator'}</strong> · {user?.jurisdictionName || 'East Africa'})
            </span>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Selected: <span className="font-semibold text-slate-900 dark:text-white">{countryProfile.countryName}</span> ({countryProfile.currency}) · Exchange: <span className="font-mono">1 {countryProfile.currency} = {countryProfile.exchangeRateToETB} ETB</span>
          </div>
        </div>

        {/* Country Flag Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {ALL_COUNTRIES.map((c) => {
            const isSelected = selectedCountry === c.code;
            const isUserHome = userCountryCode === c.code;
            const profile = EAST_AFRICA_COMMERCE_DATA[c.code];

            return (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 text-slate-900 dark:text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{c.flag}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    {c.code}
                  </span>
                </div>
                <div className="font-semibold text-xs truncate">{c.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {profile.currency} · {profile.readinessOverallPercent}% ready
                </div>
                {isUserHome && (
                  <div className="mt-1 text-[9px] font-semibold text-cyan-600 dark:text-cyan-400">
                    User Station
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 Standby Pillars Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {(Object.keys(COMMERCE_VERTICAL_SPECS) as CommerceVerticalKey[]).map((vKey) => {
          const meta = COMMERCE_VERTICAL_SPECS[vKey];
          const stage = currentStages[vKey];
          const stageMeta = getStageLabel(stage);
          const isSelected = activeVertical === vKey;

          return (
            <button
              key={vKey}
              onClick={() => setActiveVertical(vKey)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-50/40 dark:bg-slate-900 text-slate-900 dark:text-white ring-1 ring-cyan-500/30 shadow-xs'
                  : `${cardClass} text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700`
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {getVerticalIcon(vKey, 'w-4 h-4')}
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-300">
                    {meta.category}
                  </span>
                </div>

                <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                  {meta.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {meta.tagline}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] flex items-center justify-between">
                <span className={`font-semibold ${stageMeta.color}`}>
                  {stage === 'public_live' ? 'Live' : stage === 'pilot_sandbox' ? 'Pilot' : 'Standby'}
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{countryProfile.currency} Rail</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Vertical Banner & Standby Stage Governor */}
      <div className={`p-5 rounded-xl ${cardClass} space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
              {getVerticalIcon(activeVertical, 'w-6 h-6')}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                <span>{countryProfile.flag} {countryProfile.countryName} Hub</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {COMMERCE_VERTICAL_SPECS[activeVertical].category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px]">{COMMERCE_VERTICAL_SPECS[activeVertical].mobileRoute}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {COMMERCE_VERTICAL_SPECS[activeVertical].name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {COMMERCE_VERTICAL_SPECS[activeVertical].description}
              </p>
            </div>
          </div>

          {/* Standby State Dropdown / Controller */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400 ml-1" />
            <div className="text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-300 block">
                Governance State in {countryProfile.countryCode}
              </span>
              <select
                value={currentStage}
                disabled={!canManageModules}
                onChange={(e) => handleStageChange(activeVertical, e.target.value as CommerceReadinessStage)}
                className="bg-transparent font-semibold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="standby_prelaunch">Standby · Pre-Launch Readiness</option>
                <option value="pilot_sandbox">Pilot Sandbox (Field Testing)</option>
                <option value="regulatory_review">Under Regulatory Review</option>
                <option value="public_live">Public Live (SuperApp Active)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Detailed Sections */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pt-2 flex-wrap">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'catalog'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Local Country Catalog &amp; Fleet ({countryProfile.capital})
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'sandbox'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Order Dispatch Sandbox ({simulatedOrders.length} test records)
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'compliance'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Regulatory Gates ({countryProfile.regulatoryGates.length} Authorities)
          </button>
          <button
            onClick={() => setActiveTab('sdk')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'sdk'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Back4App Parse Schema &amp; Flutter SDK
          </button>
        </div>

        {/* TAB 1: LOCAL CATALOG & VENDORS */}
        {activeTab === 'catalog' && (
          <div className="space-y-4 pt-1">
            {activeVertical === 'food' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Verified Restaurant &amp; Cloud Kitchen Partners in <strong>{countryProfile.capital}</strong>
                  </span>
                  <span>Currency: <strong className="font-mono text-slate-800 dark:text-slate-200">{countryProfile.currency} ({countryProfile.currencySymbol})</strong></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countryProfile.foodVendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{vendor.area}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-amber-600 dark:text-amber-400">★ {vendor.rating}</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                            {vendor.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{vendor.category}</p>
                        </div>
                        <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
                          {vendor.leadTimeOrCapacity}
                        </span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Sample Regional Specialties:
                        </div>
                        {vendor.sampleItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="pr-2">
                              <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{item.desc}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-slate-900 dark:text-white font-mono">
                                {countryProfile.currencySymbol} {item.priceLocal.toLocaleString()}
                              </span>
                              <span className="block text-[10px] text-slate-500 font-mono">
                                ~Br {item.priceETB.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Lic: <span className="font-mono">{vendor.regulatoryLicense}</span></span>
                        <span>{vendor.paymentMethods.join(' · ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeVertical === 'marketplace' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Curated Multi-Vendor Products &amp; Cultural Handicrafts</span>
                  <span>Origin: <strong>{countryProfile.countryName}</strong></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {countryProfile.marketplaceProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          <span>{prod.category}</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {prod.stockUnits} in stock
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{prod.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Merchant: <span className="font-medium text-slate-800 dark:text-slate-200">{prod.merchantName}</span> ({prod.city})
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                          {prod.warrantyOrOrigin}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-base text-slate-900 dark:text-white font-mono">
                            {countryProfile.currencySymbol} {prod.priceLocal.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            ~Br {prod.priceETB.toLocaleString()} ETB
                          </span>
                        </div>
                        <button
                          onClick={handleRunSimulation}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                        >
                          Simulate Buy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeVertical === 'events' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Major Cultural Gatherings, Conferences &amp; Sports Championships</span>
                  <span>Permit Status: Verified</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countryProfile.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{ev.dateString}</span>
                            <span aria-hidden="true">·</span>
                            <span>{ev.city}</span>
                          </div>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">{ev.title}</h4>
                          <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">{ev.venueName}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {ev.permitStatus}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="text-slate-600 dark:text-slate-400">
                          Expected Attendance: <strong className="text-slate-900 dark:text-white">{ev.expectedAttendance.toLocaleString()}</strong>
                          <span className="block text-[11px] text-slate-500">Org: {ev.organizer}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                            {countryProfile.currencySymbol} {ev.ticketPriceLocal.toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-mono">
                            ~Br {ev.ticketPriceETB.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeVertical === 'hotels' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Safari Lodges, Business Suites &amp; Eco-Resorts in {countryProfile.countryName}</span>
                  <span>Instant API Booking Synchronization</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countryProfile.hotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{hotel.cityOrPark}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-500">{'★'.repeat(hotel.stars)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {hotel.partnerTier}
                            </span>
                          </div>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">{hotel.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{hotel.type}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-base text-slate-900 dark:text-white font-mono">
                            {countryProfile.currencySymbol} {hotel.nightlyRateLocal.toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-mono">
                            /night (~Br {hotel.nightlyRateETB.toLocaleString()})
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-[11px] text-slate-500">Amenities:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {hotel.amenities.map((a, i) => (
                            <span
                              key={i}
                              className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
                        <span>{hotel.roomsAvailable} rooms allocated in SuperApp pool</span>
                        <button
                          onClick={handleRunSimulation}
                          className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white"
                        >
                          Simulate Booking
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeVertical === 'wallet' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Multi-Currency Mobile Money &amp; Instant Banking Switches in {countryProfile.countryName}</span>
                  <span>Central Bank Interoperability Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countryProfile.walletRails.map((rail) => (
                    <div
                      key={rail.railId}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                            {rail.type} · {rail.settlementSpeed}
                          </span>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">{rail.brand}</h4>
                          <p className="text-xs text-slate-500">{rail.operatorName}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          API {rail.apiHealth}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="text-[11px] text-slate-500">Active QR Merchants:</span>
                          <span className="block font-bold text-slate-900 dark:text-white font-mono">
                            {rail.activeQrMerchants.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500">Daily Regional Volume:</span>
                          <span className="block font-bold text-slate-900 dark:text-white font-mono">
                            {rail.dailyVolumeLocal}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        Bank Switch: <span className="font-mono text-slate-700 dark:text-slate-300">{rail.connectedBank}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeVertical === 'courier' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Urban Motorcycle &amp; Express Freight Relay Stations</span>
                  <span>AmbaLay GPS Coordinates Linked</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countryProfile.courierHubs.map((hub) => (
                    <div
                      key={hub.hubId}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                            {hub.city} Dispatch Node
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hub.hubName}</h4>
                          <p className="text-xs text-slate-500">{hub.vehicleFleet}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                          ~{hub.avgDeliveryMinutes}m SLA
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500">Active Station Riders:</span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{hub.activeRiders} couriers</span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500">Base Dispatch Tariff:</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {countryProfile.currencySymbol} {hub.baseDeliveryFeeLocal} (~Br {hub.baseDeliveryFeeETB})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Cold Chain Pharma Insulated:</span>
                          <span className={hub.coldChainPharmaSupport ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                            {hub.coldChainPharmaSupport ? 'Yes (Certified)' : 'Standard'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Coverage: {hub.coverageZones.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDER DISPATCH SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 text-xs text-cyan-900 dark:text-cyan-200">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>
                  Simulate an interactive consumer order in <strong>{countryProfile.countryName}</strong> to verify real-time payment settlement, dispatch queues, and Back4App Parse state.
                </span>
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold whitespace-nowrap self-start sm:self-auto"
              >
                {isSimulating ? 'Processing...' : 'Run Simulation'}
              </button>
            </div>

            {simulatedOrders.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
                <Play className="w-8 h-8 mx-auto mb-2 text-cyan-500/60" />
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">No simulated orders dispatched yet for this session</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click the button above to fire a synthetic transaction in {countryProfile.countryName} ({countryProfile.currency}).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Recent Simulated Orders ({simulatedOrders.length})
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Country &amp; Vertical</th>
                        <th className="py-2.5 px-3">Customer &amp; Location</th>
                        <th className="py-2.5 px-3">Merchant / Items</th>
                        <th className="py-2.5 px-3">Amount (Local &amp; ETB)</th>
                        <th className="py-2.5 px-3">Payment Rail</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {simulatedOrders.map((ord) => (
                        <tr key={ord.orderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-medium text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                            {ord.orderId}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-medium">{ord.countryName}</span>
                            <span className="text-[10px] text-slate-500 block uppercase">{ord.vertical}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold">{ord.customerName}</span>
                            <span className="block text-[11px] text-slate-500 truncate max-w-xs">{ord.deliveryAddressOrSeat}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-900 dark:text-white truncate block max-w-xs">
                              {ord.merchantOrEventName}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate block max-w-xs">{ord.itemsSummary}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                            <span className="font-bold">{ord.currency} {ord.amountLocal.toLocaleString()}</span>
                            <span className="block text-[10px] text-slate-500">~Br {ord.amountETB.toLocaleString()}</span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              {ord.paymentRail}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGULATORY GATES */}
        {activeTab === 'compliance' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>National Regulatory Authorities &amp; Merchant Operating Permits</span>
              <span>Jurisdiction: <strong>{countryProfile.countryName}</strong></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {countryProfile.regulatoryGates.map((gate) => (
                <div
                  key={gate.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {gate.authorityAcronym}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                        {gate.authorityName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{gate.regulationType}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {gate.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {gate.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Audit Date: <strong className="text-slate-700 dark:text-slate-300">{gate.lastAuditDate}</strong></span>
                    <span>{gate.mandatoryForPublicLaunch ? 'Mandatory Gate' : 'Secondary'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BACK4APP PARSE SCHEMA & FLUTTER DART SDK */}
        {activeTab === 'sdk' && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Back4App Parse Class: <code className="font-mono text-cyan-600 dark:text-cyan-400">{COMMERCE_VERTICAL_SPECS[activeVertical].parseClasses[0]}</code>
                </span>
                <p className="text-slate-500 text-[11px]">
                  Generated Dart Model for Flutter SuperApp Consumer and Merchant Client
                </p>
              </div>

              <button
                onClick={handleCopyDart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                {copiedDart ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDart ? 'Copied!' : 'Copy Dart Code'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto max-h-96">
              <pre>{generateDartSdkCodeForCommerce(activeVertical)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
