import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Globe,
  MapPin,
  Lock,
  Filter,
  CheckCircle2,
  Users,
  Car,
  Package,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import {
  AdminUser,
  Driver,
  EastAfricaCountryCode,
  Shipment,
  SystemAlert,
  TriggeredActivityPulse,
  Trip,
} from '../types';
import { DashboardHome } from './DashboardHome';
import { EAST_AFRICA_GPS_CONFIGS } from '../services/eastAfricaGpsData';
import { ALL_EAST_AFRICA_COUNTRY_CODES } from '../services/eastAfricaScreens';
import { DEMO_PERSONAS } from '../services/rbac';

export interface JurisdictionDashboardWrapperProps {
  user: AdminUser;
  darkMode: boolean;
  trips: Trip[];
  shipments: Shipment[];
  drivers?: Driver[];
  alerts: SystemAlert[];
  activePulses?: TriggeredActivityPulse[];
  restrictToAssignedCountry?: boolean;
  onToggleCountryRestriction?: () => void;
  onAcknowledgePulse?: (pulseId: string) => void;
  onAcknowledgeAllPulses?: () => void;
  onResolveAlert?: (alertIdOrIndex: string | number) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onSwitchPersona?: (persona: AdminUser) => void;
  onPushToast?: (title: string, message?: string, type?: 'info' | 'success' | 'warning') => void;
}

/**
 * Robust helper function to infer or resolve the sovereign East African country code
 * for any Trip, Shipment, Driver, Vehicle, Customer, or Alert record.
 */
export function resolveItemCountryCode(
  item: any,
  type: 'trip' | 'shipment' | 'driver' | 'vehicle' | 'customer' | 'alert'
): Exclude<EastAfricaCountryCode, 'ALL'> {
  if (item && item.countryCode && item.countryCode !== 'ALL') {
    return item.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>;
  }

  if (type === 'trip') {
    const t = item as Trip;
    const text = `${t.pickup} ${t.destination} ${t.tripId} ${t.driverPhone || ''} ${t.passengerPhone || ''}`.toLowerCase();
    if (text.includes('-ke-') || text.includes('+254') || text.includes('nairobi') || text.includes('jkia') || text.includes('mombasa') || text.includes('westlands')) return 'KE';
    if (text.includes('-rw-') || text.includes('+250') || text.includes('kigali') || text.includes('masaka') || text.includes('nyabugogo')) return 'RW';
    if (text.includes('-ug-') || text.includes('+256') || text.includes('kampala') || text.includes('entebbe') || text.includes('malaba')) return 'UG';
    if (text.includes('-tz-') || text.includes('+255') || text.includes('dar es salaam') || text.includes('tanzania') || text.includes('kariakoo') || text.includes('bagamoyo')) return 'TZ';
    if (text.includes('-dj-') || text.includes('+253') || text.includes('djibouti') || text.includes('doraleh') || text.includes('pk12')) return 'DJ';
    if (text.includes('-so-') || text.includes('+252') || text.includes('mogadishu') || text.includes('bakara') || text.includes('somalia')) return 'SO';
    if (text.includes('-ss-') || text.includes('+211') || text.includes('juba') || text.includes('nimule') || text.includes('south sudan')) return 'SS';
    return 'ET';
  } else if (type === 'shipment') {
    const s = item as Shipment;
    const text = `${s.origin} ${s.destination} ${s.truckPlate} ${s.shipmentId}`.toLowerCase();
    if (text.includes('-ke-') || text.includes('mombasa') || text.includes('nairobi') || text.includes('kda-') || text.includes('kby-')) return 'KE';
    if (text.includes('-rw-') || text.includes('kigali') || text.includes('masaka') || text.includes('rad-')) return 'RW';
    if (text.includes('-ug-') || text.includes('kampala') || text.includes('malaba') || text.includes('uba-') || text.includes('ubb-')) return 'UG';
    if (text.includes('-tz-') || text.includes('dar es salaam') || text.includes('t-592') || text.includes('dodoma')) return 'TZ';
    if (text.includes('-dj-') || text.includes('djibouti') || text.includes('doraleh') || text.includes('dj-')) return 'DJ';
    if (text.includes('-so-') || text.includes('mogadishu') || text.includes('mog-')) return 'SO';
    if (text.includes('-ss-') || text.includes('juba') || text.includes('nimule') || text.includes('ssd-')) return 'SS';
    return 'ET';
  } else if (type === 'driver') {
    const d = item as Driver;
    const text = `${d.phone || ''} ${d.vehiclePlate || ''} ${d.name || ''}`.toLowerCase();
    if (text.startsWith('+254') || text.includes('kda-') || text.includes('kby-')) return 'KE';
    if (text.startsWith('+250') || text.includes('rad-')) return 'RW';
    if (text.startsWith('+256') || text.includes('uba-') || text.includes('ubb-')) return 'UG';
    if (text.startsWith('+255') || text.includes('t-592')) return 'TZ';
    if (text.startsWith('+253') || text.includes('dj-')) return 'DJ';
    if (text.startsWith('+252') || text.includes('mog-')) return 'SO';
    if (text.startsWith('+211') || text.includes('ssd-')) return 'SS';
    return 'ET';
  } else if (type === 'vehicle') {
    const v = item as any;
    const plate = (v.plate || '').toUpperCase();
    const city = (v.city || '').toLowerCase();
    if (plate.startsWith('KD') || plate.startsWith('KB') || city.includes('nairobi') || city.includes('mombasa')) return 'KE';
    if (plate.startsWith('RAD') || plate.startsWith('RA') || city.includes('kigali')) return 'RW';
    if (plate.startsWith('UB') || plate.startsWith('U') || city.includes('kampala')) return 'UG';
    if (plate.startsWith('T-') || plate.startsWith('TZ') || city.includes('dar es salaam')) return 'TZ';
    if (plate.startsWith('DJ-') || city.includes('djibouti')) return 'DJ';
    if (plate.startsWith('MOG') || city.includes('mogadishu')) return 'SO';
    if (plate.startsWith('SSD') || city.includes('juba')) return 'SS';
    return 'ET';
  } else if (type === 'customer') {
    const c = item as any;
    const phone = (c.phone || '').toLowerCase();
    const address = `${c.city || ''} ${c.address || ''} ${c.companyName || ''}`.toLowerCase();
    if (phone.startsWith('+254') || address.includes('nairobi') || address.includes('kenya')) return 'KE';
    if (phone.startsWith('+250') || address.includes('kigali') || address.includes('rwanda')) return 'RW';
    if (phone.startsWith('+256') || address.includes('kampala') || address.includes('uganda')) return 'UG';
    if (phone.startsWith('+255') || address.includes('dar es salaam') || address.includes('tanzania')) return 'TZ';
    if (phone.startsWith('+253') || address.includes('djibouti')) return 'DJ';
    if (phone.startsWith('+252') || address.includes('mogadishu') || address.includes('somalia')) return 'SO';
    if (phone.startsWith('+211') || address.includes('juba') || address.includes('south sudan')) return 'SS';
    return 'ET';
  } else {
    const a = item as any;
    const text = `${a.title || ''} ${a.message || ''} ${a.corridor || ''}`.toLowerCase();
    if (text.includes('kenya') || text.includes('nairobi') || text.includes('mombasa')) return 'KE';
    if (text.includes('rwanda') || text.includes('kigali')) return 'RW';
    if (text.includes('uganda') || text.includes('kampala')) return 'UG';
    if (text.includes('tanzania') || text.includes('dar es salaam')) return 'TZ';
    if (text.includes('djibouti')) return 'DJ';
    if (text.includes('somalia') || text.includes('mogadishu')) return 'SO';
    if (text.includes('south sudan') || text.includes('juba')) return 'SS';
    return 'ET';
  }
}

/**
 * Wrapper component for the Operations Dashboard.
 * Monitors `currentUser.jurisdictionCountry` and strictly restricts the visibility of `trips`,
 * `shipments`, and `drivers` data arrays to those matching the user's operational country code.
 */
export const JurisdictionDashboardWrapper: React.FC<JurisdictionDashboardWrapperProps> = ({
  user,
  darkMode,
  trips,
  shipments,
  drivers = [],
  alerts,
  activePulses = [],
  restrictToAssignedCountry = true,
  onToggleCountryRestriction,
  onAcknowledgePulse,
  onAcknowledgeAllPulses,
  onResolveAlert,
  onNavigateTab,
  onSwitchPersona,
  onPushToast,
}) => {
  // If user has an explicit sovereign jurisdiction (not ALL) and restriction is active:
  const isSovereignLocked = Boolean(
    restrictToAssignedCountry && user.jurisdictionCountry && user.jurisdictionCountry !== 'ALL'
  );
  const userCountryCode = (user.jurisdictionCountry || 'ALL') as EastAfricaCountryCode;

  // For Super Admins with 'ALL' or when restriction toggle is turned off, allow an interactive country filter override on the dashboard
  const [adminCountryFilter, setAdminCountryFilter] = useState<EastAfricaCountryCode>('ALL');

  // Effective operational country for data restriction
  const effectiveCountry: EastAfricaCountryCode = isSovereignLocked
    ? userCountryCode
    : adminCountryFilter;

  // Filtered trips array matching user's operational country code
  const filteredTrips = useMemo(() => {
    if (effectiveCountry === 'ALL') return trips;
    return trips.filter((t) => resolveItemCountryCode(t, 'trip') === effectiveCountry);
  }, [trips, effectiveCountry]);

  // Filtered shipments array matching user's operational country code
  const filteredShipments = useMemo(() => {
    if (effectiveCountry === 'ALL') return shipments;
    return shipments.filter((s) => resolveItemCountryCode(s, 'shipment') === effectiveCountry);
  }, [shipments, effectiveCountry]);

  // Filtered drivers array matching user's operational country code
  const filteredDrivers = useMemo(() => {
    if (effectiveCountry === 'ALL') return drivers;
    return drivers.filter((d) => resolveItemCountryCode(d, 'driver') === effectiveCountry);
  }, [drivers, effectiveCountry]);

  // Filtered alerts array matching user's operational country code
  const filteredAlerts = useMemo(() => {
    if (effectiveCountry === 'ALL') return alerts;
    return alerts.filter((a) => {
      const code = resolveItemCountryCode(a, 'alert');
      return code === effectiveCountry;
    });
  }, [alerts, effectiveCountry]);

  // Active country profile
  const activeCountryConfig = useMemo(() => {
    if (effectiveCountry === 'ALL') return null;
    return EAST_AFRICA_GPS_CONFIGS[effectiveCountry as Exclude<EastAfricaCountryCode, 'ALL'>];
  }, [effectiveCountry]);

  return (
    <div className="space-y-6">
      {/* Sovereign Jurisdiction Guard & Scope Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isSovereignLocked
            ? darkMode
              ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-800/60'
              : 'bg-gradient-to-r from-cyan-50 via-white to-slate-50 border-cyan-200 shadow-xs'
            : darkMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl text-white shadow-sm shrink-0 ${
                isSovereignLocked ? 'bg-cyan-600' : 'bg-slate-800 dark:bg-slate-700'
              }`}
            >
              {isSovereignLocked ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeCountryConfig && (
                  <span className="text-xl" title={activeCountryConfig.countryName}>
                    {activeCountryConfig.flag}
                  </span>
                )}
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isSovereignLocked
                    ? `${activeCountryConfig?.countryName} Sovereign Operations Scope`
                    : effectiveCountry === 'ALL'
                    ? 'Pan-African Multi-Country Operations Scope (Super Admin)'
                    : `${activeCountryConfig?.countryName} Scope (Filtered)`}
                </h2>
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                    isSovereignLocked
                      ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {isSovereignLocked
                    ? `Bound to ${user.jurisdictionCountry} · ${user.role}`
                    : effectiveCountry === 'ALL'
                    ? 'Unrestricted Cross-Border Governance'
                    : `Auditing ${effectiveCountry}`}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {isSovereignLocked ? (
                  <>
                    Data arrays strictly filtered to <strong>{activeCountryConfig?.countryName}</strong> based on logged-in operator jurisdiction ({user.email}). Unrelated cross-border data is withheld.
                  </>
                ) : (
                  <>
                    Monitoring real-time cross-border operations across all 8 East African regional member states.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Controls & Counts Strip */}
          <div className="flex items-center gap-2 text-xs self-start md:self-auto shrink-0 flex-wrap">
            {onToggleCountryRestriction && (
              <button
                type="button"
                onClick={onToggleCountryRestriction}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  restrictToAssignedCountry
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
                title={
                  restrictToAssignedCountry
                    ? 'Restricted to operational metrics for your assigned country. Click to view All East Africa.'
                    : 'Viewing all East Africa. Click to restrict to your assigned country.'
                }
              >
                <span>{restrictToAssignedCountry ? activeCountryConfig?.flag || '🔒' : '🌍'}</span>
                <span>{restrictToAssignedCountry ? `${userCountryCode} Restricted` : 'All EAC'}</span>
                <span
                  className={`w-6 h-3.5 rounded-full p-0.5 flex items-center transition-colors ${
                    restrictToAssignedCountry ? 'bg-white/30 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white shadow-2xs" />
                </span>
              </button>
            )}

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-semibold ${
                darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400">
                <Car className="w-3.5 h-3.5" />
                <strong>{filteredTrips.length}</strong> Trips
              </span>
              <span className="text-slate-400">·</span>
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <Package className="w-3.5 h-3.5" />
                <strong>{filteredShipments.length}</strong> Cargo
              </span>
              <span className="text-slate-400">·</span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <Users className="w-3.5 h-3.5" />
                <strong>{filteredDrivers.length}</strong> Drivers
              </span>
            </div>
          </div>
        </div>

        {/* Super Admin Country Switcher (shown when unrestricted) */}
        {!isSovereignLocked && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter Country:
              </span>
              <button
                onClick={() => setAdminCountryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  adminCountryFilter === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🌍 All 8 Nations ({trips.length} Trips)
              </button>
              {ALL_EAST_AFRICA_COUNTRY_CODES.map((code) => {
                const conf = EAST_AFRICA_GPS_CONFIGS[code];
                const isActive = adminCountryFilter === code;
                const cTrips = trips.filter((t) => resolveItemCountryCode(t, 'trip') === code).length;
                return (
                  <button
                    key={code}
                    onClick={() => setAdminCountryFilter(code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-cyan-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{conf.flag}</span>
                    <span>{conf.countryName}</span>
                    <span className="font-mono text-[10px] opacity-80">({cTrips})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Render the DashboardHome with Strictly Restricted Data Arrays */}
      <DashboardHome
        user={user}
        darkMode={darkMode}
        trips={filteredTrips}
        shipments={filteredShipments}
        drivers={filteredDrivers}
        alerts={filteredAlerts}
        activePulses={activePulses}
        onAcknowledgePulse={onAcknowledgePulse}
        onAcknowledgeAllPulses={onAcknowledgeAllPulses}
        onResolveAlert={onResolveAlert}
        onNavigateTab={onNavigateTab}
        onSwitchPersona={onSwitchPersona}
        onPushToast={onPushToast}
      />
    </div>
  );
};
