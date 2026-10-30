import React, { useState, useEffect } from 'react';
import {
  Car,
  Truck,
  CreditCard,
  FileCheck2,
  MapPin,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Globe2,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Coins,
  Shield,
  Layers,
  Sparkles,
  PhoneCall,
  UserCheck,
  Maximize2,
  X,
  Play,
  RotateCw,
} from 'lucide-react';
import { AdminUser, EastAfricaCountryCode } from '../types';
import {
  ALL_EAST_AFRICA_COUNTRY_CODES,
  CountryScreenItem,
  EAST_AFRICA_PROFILES,
  EastAfricaCountryProfile,
  getEastAfricaProfile,
} from '../services/eastAfricaScreens';
import { DEMO_PERSONAS } from '../services/rbac';

interface EastAfricaCountryPreviewerProps {
  user: AdminUser;
  darkMode: boolean;
  onNavigateTab: (tab: string) => void;
  onSwitchPersona?: (persona: AdminUser) => void;
  onPushToast?: (title: string, message?: string, type?: 'info' | 'success' | 'warning') => void;
}

export const EastAfricaCountryPreviewer: React.FC<EastAfricaCountryPreviewerProps> = ({
  user,
  darkMode,
  onNavigateTab,
  onSwitchPersona,
  onPushToast,
}) => {
  // Country selection state - default to logged in user's jurisdiction if valid country code, else ET
  const initialCountry: Exclude<EastAfricaCountryCode, 'ALL'> =
    user.jurisdictionCountry && user.jurisdictionCountry !== 'ALL'
      ? (user.jurisdictionCountry as Exclude<EastAfricaCountryCode, 'ALL'>)
      : 'ET';

  const [selectedCountry, setSelectedCountry] =
    useState<Exclude<EastAfricaCountryCode, 'ALL'>>(initialCountry);
  const [activeScreenType, setActiveScreenType] = useState<
    'ride' | 'truck' | 'payments' | 'compliance' | 'geofences' | 'driver_app'
  >('ride');
  const [modalScreen, setModalScreen] = useState<CountryScreenItem | null>(null);
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  // Sync selected country if user changes persona
  useEffect(() => {
    if (user.jurisdictionCountry && user.jurisdictionCountry !== 'ALL') {
      setSelectedCountry(user.jurisdictionCountry as Exclude<EastAfricaCountryCode, 'ALL'>);
    }
  }, [user.jurisdictionCountry]);

  const profile: EastAfricaCountryProfile = EAST_AFRICA_PROFILES[selectedCountry];
  const currentScreen: CountryScreenItem =
    profile.screens.find((s) => s.screenType === activeScreenType) || profile.screens[0];

  // Matching operator persona for quick switch
  const matchingPersona = DEMO_PERSONAS.find(
    (p) => p.jurisdictionCountry === selectedCountry
  );

  const isCurrentPersonaFromCountry =
    user.jurisdictionCountry === selectedCountry;

  const handleSwitchToCountryOperator = () => {
    if (matchingPersona && onSwitchPersona) {
      onSwitchPersona(matchingPersona);
      onPushToast?.(
        `Switched to ${profile.name} Operator`,
        `Active session updated to ${matchingPersona.name} (${matchingPersona.role}).`,
        'success'
      );
    }
  };

  const handleSimulateAction = (actionDesc: string) => {
    setIsSimulatingAction(true);
    setSimulatedNotice(null);
    setTimeout(() => {
      setIsSimulatingAction(false);
      const msg = `Simulated ${actionDesc} in ${profile.name} (${profile.currency}) completed. Telemetry synced to Back4App cloud.`;
      setSimulatedNotice(msg);
      onPushToast?.(`Operational Event in ${profile.name}`, msg, 'info');
      setTimeout(() => setSimulatedNotice(null), 5000);
    }, 450);
  };

  const getScreenIcon = (type: CountryScreenItem['screenType']) => {
    switch (type) {
      case 'ride':
        return <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'truck':
        return <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'payments':
        return <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'compliance':
        return <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'geofences':
        return <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'driver_app':
        return <Smartphone className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* Top Header & Operational Context */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-400">
                <Globe2 className="w-3.5 h-3.5" />
                <span>East Africa Operations Console</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>8 Member Nations</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{profile.timeZone}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              Country-Specific Operational Screens &amp; Dispatch Preview
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Explore how each operations module (Mobility Dispatch, Heavy Freight, Payment Clearing, Inspection Compliance, Geofences, and Mobile Driver Experience) behaves for users logging in from their respective country of operation.
            </p>
          </div>

          {/* Active Operator Status & 1-Click Persona Switcher */}
          <div className="flex items-center gap-3 shrink-0 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Logged-in:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {user.name.split(' ')[0]} ({user.role})
                </span>
              </div>
              <p className="text-[11px] text-cyan-700 dark:text-cyan-400 mt-0.5">
                Jurisdiction: {user.jurisdictionName || 'Pan-East Africa'}
              </p>
            </div>

            {!isCurrentPersonaFromCountry && matchingPersona && (
              <button
                type="button"
                onClick={handleSwitchToCountryOperator}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Log in as {matchingPersona.name.split(' ')[0]} ({profile.flag})</span>
              </button>
            )}
          </div>
        </div>

        {/* 8 East African Country Selector Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Select Country of Operation to Preview Screens:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ALL_EAST_AFRICA_COUNTRY_CODES.map((code) => {
              const c = EAST_AFRICA_PROFILES[code];
              const isSelected = selectedCountry === code;
              const isOperatorCountry = user.jurisdictionCountry === code;

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedCountry(code)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-500 shadow-sm'
                      : 'bg-white hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-[10px] font-mono opacity-80">({c.currency})</span>
                  {isOperatorCountry && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Your current jurisdiction" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Preview Work Area: Country Snapshot + Screen Tabs + Interactive Canvas */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Country Operational Snapshot & Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{profile.flag}</span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {profile.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {profile.nativeName} · Capital: {profile.capital}
                    </p>
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                1 ETB = {(profile.exchangeRateToETB === 1 ? '1.0 ETB' : `${(1 / profile.exchangeRateToETB).toFixed(2)} ${profile.currency}`)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Daily Volume</span>
                <p className="font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {profile.operationalStats.dailyVolumeLocal}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">≈ {profile.operationalStats.dailyVolumeETB}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Active Fleet</span>
                <p className="font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {profile.operationalStats.activeFleetCount.toLocaleString()} vehicles
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {profile.operationalStats.complianceScore}% compliant
                </span>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Transport Regulator:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                  {profile.regulatorShort}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Central Bank:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[180px]">
                  {profile.centralBank.split('(')[0]}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">License Standard:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {profile.driverLicensePrefix}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Operator Card for this country */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>Stationed Operational Lead</span>
              </span>
              <span className="text-[10px] text-slate-500">Live Auth Scope</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-600/15 text-cyan-700 dark:text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                {profile.operatorPersona.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {profile.operatorPersona.name}
                </p>
                <p className="text-[11px] text-cyan-700 dark:text-cyan-400 font-medium truncate">
                  {profile.operatorPersona.role} · {profile.operatorPersona.title}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-snug">
              {profile.operatorPersona.scopeSummary}
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">Emergency Ops:</span>
              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {profile.hotline}
              </span>
            </div>
          </div>

          {/* National Payment Rails Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active Payment Rails ({profile.currency})</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">T+0 Clearing</span>
            </div>

            <div className="space-y-2 mt-2">
              {profile.paymentRails.map((rail) => (
                <div
                  key={rail.gateway}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {rail.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {rail.provider} · {rail.speed}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 dark:text-white">
                      {rail.dailyVolumeLocal}
                    </p>
                    <span className="text-[10px] font-mono text-emerald-600">
                      {rail.latencyMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Screen Selector & Interactive Screen Mockup Canvas */}
        <div className="lg:col-span-8 space-y-4">
          {/* 6 Screen Category Selector Tabs */}
          <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none">
            {profile.screens.map((screen) => {
              const isActive = screen.screenType === activeScreenType;
              return (
                <button
                  key={screen.id}
                  type="button"
                  onClick={() => setActiveScreenType(screen.screenType)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {getScreenIcon(screen.screenType)}
                  <span>{screen.title.split('&')[0].trim().split(' ')[0]} {screen.screenType === 'ride' ? 'Mobility' : screen.screenType === 'truck' ? 'Freight' : screen.screenType === 'payments' ? 'Settlement' : screen.screenType === 'compliance' ? 'Inspection' : screen.screenType === 'geofences' ? 'Geofences' : 'Driver PWA'}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Preview Frame */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 relative overflow-hidden">
            {/* Screen Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {profile.flag} {currentScreen.title}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {currentScreen.statusBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentScreen.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalScreen(currentScreen)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Expand Screen Preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab(currentScreen.targetTab)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white transition-colors whitespace-nowrap shadow-xs"
                >
                  <span>{currentScreen.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulation Feedback Alert */}
            {simulatedNotice && (
              <div className="my-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{simulatedNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulatedNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Metric Banner for the Screen */}
            <div className="my-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {currentScreen.headlineMetric.label}
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {currentScreen.headlineMetric.value}
                  </div>
                  {currentScreen.headlineMetric.secondary && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentScreen.headlineMetric.secondary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSimulatingAction}
                    onClick={() =>
                      handleSimulateAction(
                        currentScreen.screenType === 'ride'
                          ? 'Real-Time Dispatch Match'
                          : currentScreen.screenType === 'truck'
                          ? 'Axle-Load Weighbridge Clearance'
                          : currentScreen.screenType === 'payments'
                          ? 'Driver Payout Settlement Probe'
                          : currentScreen.screenType === 'compliance'
                          ? 'Roadworthiness Sticker Audit'
                          : currentScreen.screenType === 'geofences'
                          ? 'Terminal Virtual Boundary Scan'
                          : 'In-Cab Trip Acceptance Handshake'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-100 text-xs font-semibold transition-colors"
                  >
                    {isSimulatingAction ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>Simulate {currentScreen.screenType === 'ride' ? 'Dispatch' : currentScreen.screenType === 'truck' ? 'Weighbridge' : currentScreen.screenType === 'payments' ? 'Payout' : currentScreen.screenType === 'compliance' ? 'Inspection' : currentScreen.screenType === 'geofences' ? 'Geofence' : 'Driver Offer'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Supporting Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                {currentScreen.metrics.map((m, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {m.label}
                    </span>
                    <p className="font-bold font-mono text-slate-900 dark:text-white truncate">
                      {m.value}
                    </p>
                    {m.sublabel && (
                      <span className="text-[10px] text-slate-500 block truncate">
                        {m.sublabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Screen Highlights List */}
            <div className="my-3 space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Country Configuration &amp; Governance Rules:
              </span>
              {currentScreen.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Sample Live Records in this Screen */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Live Sample Records ({profile.name} Data Stream)
                </span>
                <span className="text-[11px] text-slate-500">
                  Back4App Cloud Synced
                </span>
              </div>

              <div className="space-y-2">
                {currentScreen.sampleItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab(currentScreen.targetTab)}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {item.id}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.meta}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.amount && (
                        <p className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {item.amount}
                        </p>
                      )}
                      <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 group-hover:underline">
                        {item.status} →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Modal for Deep Screen Inspection */}
      {modalScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{profile.flag}</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {profile.name} · {modalScreen.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Full Resolution Operational Preview
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalScreen(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">Headline Metric</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {modalScreen.headlineMetric.value}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {modalScreen.headlineMetric.label} {modalScreen.headlineMetric.secondary ? `· ${modalScreen.headlineMetric.secondary}` : ''}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Statutory Guidelines &amp; Enforced Corridors:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {modalScreen.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalScreen(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalScreen(null);
                  onNavigateTab(modalScreen.targetTab);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5"
              >
                <span>Launch {modalScreen.actionLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
