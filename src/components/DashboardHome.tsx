import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Car,
  Users,
  Package,
  Calendar,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  Check,
  Activity,
  BellRing,
} from 'lucide-react';
import {
  AdminUser,
  AlertRuleMetricCategory,
  Driver,
  Shipment,
  SystemAlert,
  TriggeredActivityPulse,
  Trip,
} from '../types';
import { paymentSettlementService } from '../services/payments';
import { EastAfricaCountryPreviewer } from './EastAfricaCountryPreviewer';

interface DashboardHomeProps {
  user: AdminUser;
  darkMode: boolean;
  trips: Trip[];
  shipments: Shipment[];
  drivers?: Driver[];
  alerts: SystemAlert[];
  activePulses?: TriggeredActivityPulse[];
  onAcknowledgePulse?: (pulseId: string) => void;
  onAcknowledgeAllPulses?: () => void;
  onResolveAlert?: (alertIdOrIndex: string | number) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onSwitchPersona?: (persona: AdminUser) => void;
  onPushToast?: (title: string, message?: string, type?: 'info' | 'success' | 'warning') => void;
}

const RANGE_MULTIPLIERS: Record<string, { mult: number; deltaRev: string; deltaTrips: string; compLabel: string }> = {
  Today: { mult: 1, deltaRev: '+12.4%', deltaTrips: '+8.2%', compLabel: 'vs yesterday' },
  'This Week': { mult: 6.4, deltaRev: '+15.1%', deltaTrips: '+11.4%', compLabel: 'vs prior week' },
  'This Month': { mult: 26.5, deltaRev: '+19.8%', deltaTrips: '+14.6%', compLabel: 'vs prior month' },
  'This Quarter': { mult: 78.2, deltaRev: '+24.3%', deltaTrips: '+18.9%', compLabel: 'vs prior quarter' },
};

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  darkMode,
  trips,
  shipments,
  drivers = [],
  alerts,
  activePulses = [],
  onAcknowledgePulse,
  onAcknowledgeAllPulses,
  onResolveAlert,
  onNavigateTab,
  onSwitchPersona,
  onPushToast,
}) => {
  const [timeRange, setTimeRange] = useState('Today');
  const [chartHorizon, setChartHorizon] = useState<'This Month' | 'Quarterly' | 'YTD'>('This Month');

  const formatMetricCategory = (cat: AlertRuleMetricCategory) => {
    switch (cat) {
      case 'ride_request':
        return 'ride requests';
      case 'truck_booking':
        return 'truck bookings';
      case 'user_login':
        return 'user logins';
      case 'driver_status':
        return 'driver status updates';
      default:
        return 'mobile events';
    }
  };

  const hasCriticalPulse = activePulses.some((p) => p.severity === 'critical');
  const isRidePulsing = activePulses.some(
    (p) => p.category === 'ride_request' || p.category === 'all'
  );
  const isTruckPulsing = activePulses.some(
    (p) => p.category === 'truck_booking' || p.category === 'all'
  );
  const isDriverOrAuthPulsing = activePulses.some(
    (p) => p.category === 'user_login' || p.category === 'driver_status'
  );

  // Dynamic EAT Date
  const eatDateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Africa/Addis_Ababa',
  }).format(new Date());

  // Live operational state + range scaling
  const rangeCfg = RANGE_MULTIPLIERS[timeRange] || RANGE_MULTIPLIERS.Today;
  const ledgerTxs = paymentSettlementService.getTransactions();

  const liveTripsFare = trips.reduce((s, t) => s + Number(t.fareETB || 0), 0);
  const liveFreightRevenue = shipments.reduce((s, sh) => s + Number(sh.freightRateETB || 0), 0);
  const liveLedgerGross = ledgerTxs.reduce((s, tx) => s + Number(tx.grossFareETB || 0), 0);

  const baseDailyRevenue = 945000 + liveTripsFare + liveFreightRevenue + liveLedgerGross;
  const scaledRevenue = Math.round(baseDailyRevenue * rangeCfg.mult);

  const scaledTrips = Math.round((4810 + trips.length) * rangeCfg.mult);
  const activeDriversCount =
    865 + drivers.filter((d) => d.status === 'Active' || d.status === 'Verified').length;
  const scaledDeliveries = Math.round((1450 + shipments.length) * rangeCfg.mult);

  // Dynamic Ride vs Freight share
  const rideSharePct = Math.min(
    85,
    Math.max(
      45,
      Math.round((scaledTrips / Math.max(1, scaledTrips + scaledDeliveries * 1.5)) * 100)
    )
  );
  const freightSharePct = 100 - rideSharePct;
  const circumference = 2 * Math.PI * 38; // ~238.76
  const rideArc = (rideSharePct / 100) * circumference;
  const freightArc = (freightSharePct / 100) * circumference;

  // Dynamic Chart Series based on selected horizon + live revenue delta
  const liveBoost = Math.round((liveTripsFare + liveFreightRevenue / 1000) / 15);
  const seriesByHorizon: Record<typeof chartHorizon, { label: string; val: number }[]> = {
    'This Month': [
      { label: 'W1', val: 280 },
      { label: 'W2', val: 340 },
      { label: 'W3', val: 390 },
      { label: 'W4', val: 445 },
      { label: 'W5', val: 510 + liveBoost },
    ],
    Quarterly: [
      { label: 'Jul', val: 480 },
      { label: 'Aug', val: 535 },
      { label: 'Sep', val: 560 },
      { label: 'Oct', val: 615 },
      { label: 'Nov', val: 670 },
      { label: 'Dec', val: 720 + liveBoost },
    ],
    YTD: [
      { label: 'Jan', val: 320 },
      { label: 'Feb', val: 380 },
      { label: 'Mar', val: 350 },
      { label: 'Apr', val: 490 },
      { label: 'May', val: 420 },
      { label: 'Jun', val: 510 },
      { label: 'Jul', val: 480 },
      { label: 'Aug', val: 560 },
      { label: 'Sep', val: 530 },
      { label: 'Oct', val: 590 },
      { label: 'Nov', val: 685 + liveBoost },
    ],
  };

  const activeSeries = seriesByHorizon[chartHorizon];
  const maxVal = Math.max(...activeSeries.map((p) => p.val), 750);
  const svgCoords = activeSeries.map((pt, idx) => {
    const x =
      activeSeries.length === 1 ? 350 : Math.round((idx / (activeSeries.length - 1)) * 700);
    const y = Math.round(170 - (pt.val / maxVal) * 145);
    return { ...pt, x, y };
  });

  const polylinePoints = svgCoords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPoints = `0,180 ${polylinePoints} 700,180`;

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  const cardClass =
    'p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

  const getStatusTextClass = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'On-Going':
      case 'In Transit':
        return 'text-cyan-700 dark:text-cyan-400';
      case 'Picked Up':
      case 'Pending':
        return 'text-amber-700 dark:text-amber-400';
      case 'Cancelled':
      case 'Suspended':
        return 'text-rose-700 dark:text-rose-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Executive Operations</span>
            <span aria-hidden="true">·</span>
            <span>{user.role}</span>
            <span aria-hidden="true">·</span>
            <span>Addis Ababa EAT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('superapp-diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activePulses.length > 0
                ? 'border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30'
                : 'border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300'
            }`}
          >
            {activePulses.length > 0 ? (
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 dark:bg-rose-400" />
              </span>
            ) : (
              <Activity className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            )}
            <span>Bridge Diagnostics</span>
            {activePulses.length > 0 && (
              <span className="font-mono tabular-nums font-bold">({activePulses.length})</span>
            )}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{eatDateLabel}</span>
          </div>

          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border appearance-none pr-7 cursor-pointer focus:outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Quarter">This Quarter</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* In-App Activity Stream Threshold Visual Pulse Banner */}
      {activePulses.length > 0 && (
        <div
          role="region"
          aria-label="Live Activity Stream Threshold Alerts"
          className={`rounded-xl border overflow-hidden transition-all ${
            hasCriticalPulse
              ? 'border-rose-300 dark:border-rose-500/45 bg-rose-50/90 dark:bg-rose-950/35 ring-2 ring-rose-500/25'
              : 'border-amber-300 dark:border-amber-500/45 bg-amber-50/90 dark:bg-amber-950/30 ring-2 ring-amber-500/25'
          }`}
        >
          <div className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-500/30 shrink-0 mt-0.5">
                <span
                  className={`animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-lg opacity-35 ${
                    hasCriticalPulse ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  aria-hidden="true"
                />
                <BellRing
                  className={`w-4 h-4 relative ${
                    hasCriticalPulse
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <span
                    className={`font-bold ${
                      hasCriticalPulse
                        ? 'text-rose-800 dark:text-rose-300'
                        : 'text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    Activity Stream Threshold Alert ({activePulses.length} Active)
                  </span>
                  <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
                    ·
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {activePulses[0].ruleName}
                  </span>
                  <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
                    ·
                  </span>
                  <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    Observed <strong>{activePulses[0].observedCount}</strong> (Rule{' '}
                    {activePulses[0].operator} {activePulses[0].threshold}{' '}
                    {formatMetricCategory(activePulses[0].category)} within{' '}
                    {activePulses[0].windowMinutes}m)
                  </span>
                </div>

                {activePulses.length > 1 ? (
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    +{activePulses.length - 1} additional threshold{' '}
                    {activePulses.length - 1 === 1 ? 'rule' : 'rules'} currently pulsing:{' '}
                    {activePulses
                      .slice(1)
                      .map((p) => p.ruleName)
                      .join(' · ')}
                  </p>
                ) : (
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Mobile .apk telemetry exceeded your configured rolling window threshold. Inspect the Activity Stream or acknowledge once dispatch capacity is balanced.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('superapp-diagnostics')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors ${
                  hasCriticalPulse
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                Inspect Activity Stream
              </button>

              {activePulses.length === 1 && onAcknowledgePulse && (
                <button
                  type="button"
                  onClick={() => onAcknowledgePulse(activePulses[0].id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
                >
                  Acknowledge Pulse
                </button>
              )}

              {activePulses.length > 1 && onAcknowledgeAllPulses && (
                <button
                  type="button"
                  onClick={onAcknowledgeAllPulses}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
                >
                  Acknowledge All ({activePulses.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4 Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Gross Volume ({timeRange})
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              ETB {scaledRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{rangeCfg.deltaRev}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-normal">
                {rangeCfg.compLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${cardClass} transition-all ${
            isRidePulsing
              ? 'ring-2 ring-rose-500/50 dark:ring-rose-400/50 border-rose-300 dark:border-rose-500/40'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
              <span>Mobility Trips ({timeRange})</span>
              {isRidePulsing && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400 animate-ping motion-reduce:animate-none" />
                  Surge
                </span>
              )}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              {scaledTrips.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{rangeCfg.deltaTrips}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-normal">
                {rangeCfg.compLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${cardClass} transition-all ${
            isDriverOrAuthPulsing
              ? 'ring-2 ring-amber-500/50 dark:ring-amber-400/50 border-amber-300 dark:border-amber-500/40'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
              <span>Verified Active Drivers</span>
              {isDriverOrAuthPulsing && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping motion-reduce:animate-none" />
                  Spike
                </span>
              )}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              {activeDriversCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+5.4%</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-normal">
                online across Addis
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${cardClass} transition-all ${
            isTruckPulsing
              ? 'ring-2 ring-amber-500/50 dark:ring-amber-400/50 border-amber-300 dark:border-amber-500/40'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
              <span>Freight Dispatches ({timeRange})</span>
              {isTruckPulsing && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping motion-reduce:animate-none" />
                  Surge
                </span>
              )}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              {scaledDeliveries.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+15.0%</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-normal">
                corridor manifests
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* East African Regional Operations Hub & Screen Previews */}
      <EastAfricaCountryPreviewer
        user={user}
        darkMode={darkMode}
        onNavigateTab={onNavigateTab}
        onSwitchPersona={onSwitchPersona}
        onPushToast={onPushToast}
      />

      {/* Flutter SuperApp Unified Governance Strip */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigateTab('superapp-approvals')}
          className="p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Approvals &amp; Eligibility
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              KYC docs, Bola vehicle checks &amp; role activation
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('superapp-bidding')}
          className="p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Fleet, Bidding &amp; Escrow
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Vehicle Owners, 1:1 trucks, bids &amp; payouts
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('superapp-pricing')}
          className="p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Pricing, Surge &amp; Flags
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Parse Config multipliers &amp; FeatureFlags
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('superapp-inspector')}
          className="p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              SuperApp Monorepo Sync
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live ZIP contracts, schemas &amp; Cloud RPCs
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        </button>
      </div>

      {/* Middle Row: Revenue Overview Chart & Service Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Trajectory</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gross transaction clearing in ETB thousands (live-adjusted)
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
              {(['This Month', 'Quarterly', 'YTD'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setChartHorizon(h)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    chartHorizon === h
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-56 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="40" x2="700" y2="40" stroke={darkMode ? '#334155' : '#e2e8f0'} strokeDasharray="3 3" opacity="0.6" />
              <line x1="0" y1="90" x2="700" y2="90" stroke={darkMode ? '#334155' : '#e2e8f0'} strokeDasharray="3 3" opacity="0.6" />
              <line x1="0" y1="140" x2="700" y2="140" stroke={darkMode ? '#334155' : '#e2e8f0'} strokeDasharray="3 3" opacity="0.6" />

              <polygon points={areaPoints} fill="url(#revenueGrad)" />

              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#0891b2"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {svgCoords.map((pt) => (
                <g key={pt.label}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill={darkMode ? '#0f172a' : '#ffffff'}
                    stroke="#0891b2"
                    strokeWidth="2.5"
                  />
                </g>
              ))}
            </svg>

            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-3 px-1">
              {svgCoords.map((p) => (
                <span key={p.label}>{p.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Service Distribution */}
        <div className={`lg:col-span-4 ${cardClass} flex flex-col justify-between`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Service Mix</h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{timeRange}</span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={darkMode ? '#1e293b' : '#f1f5f9'}
                  strokeWidth="14"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0891b2"
                  strokeWidth="14"
                  strokeDasharray={`${rideArc} ${circumference}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#2563eb"
                  strokeWidth="14"
                  strokeDasharray={`${freightArc} ${circumference}`}
                  strokeDashoffset={-rideArc - 2}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {rideSharePct}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Ride Mobility
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Ride Trips</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {rideSharePct}% ({scaledTrips.toLocaleString()})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Truck Freight</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {freightSharePct}% ({scaledDeliveries.toLocaleString()})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Trips, Recent Deliveries, System Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Trips */}
        <div className={`${cardClass} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Recent Trips</span>
              </h2>
              <button
                onClick={() => onNavigateTab('ride')}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {trips.slice(0, 3).map((trip) => (
                <div
                  key={trip.tripId}
                  onClick={() => onNavigateTab('ride')}
                  className="p-3 rounded-lg border transition-colors flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {trip.tripId}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className={`font-semibold text-[11px] ${getStatusTextClass(trip.status)}`}>
                        {trip.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {trip.pickup} → {trip.destination}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-xs tabular-nums text-slate-900 dark:text-white">
                      ETB {trip.fareETB.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{trip.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className={`${cardClass} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Recent Deliveries</span>
              </h2>
              <button
                onClick={() => onNavigateTab('truck')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View freight</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {shipments.slice(0, 3).map((ship) => (
                <div
                  key={ship.shipmentId}
                  onClick={() => onNavigateTab('truck')}
                  className="p-3 rounded-lg border transition-colors flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {ship.shipmentId}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className={`font-semibold text-[11px] ${getStatusTextClass(ship.status)}`}>
                        {ship.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {ship.origin.split(' ')[0]} → {ship.destination.split(' ')[0]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-xs tabular-nums text-slate-900 dark:text-white">
                      {ship.tonnage} Tons
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{ship.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Alerts with Acknowledge Action */}
        <div className={`${cardClass} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>System Alerts</span>
              </h2>
              <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                {unresolvedAlerts.length} Open
              </span>
            </div>

            <div className="space-y-2.5">
              {unresolvedAlerts.length > 0 ? (
                unresolvedAlerts.map((alert, idx) => (
                  <div
                    key={alert.id || idx}
                    className="p-3 rounded-lg border text-xs flex items-start justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50"
                  >
                    <div className="min-w-0">
                      <p className="text-slate-800 dark:text-slate-200 font-medium leading-snug">
                        {alert.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{alert.timeAgo}</p>
                    </div>
                    {onResolveAlert && (
                      <button
                        type="button"
                        onClick={() => onResolveAlert(alert.id || idx)}
                        title="Acknowledge alert"
                        className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  All operational alerts acknowledged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
