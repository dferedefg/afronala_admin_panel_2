import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Download,
  Flag,
  Flame,
  Minus,
  Plus,
  Save,
  Sliders,
  Smartphone,
} from 'lucide-react';
import {
  PermissionAction,
  SuperAppFeatureFlagItem,
  SuperAppRuntimeConfig,
  SuperAppSurgeZone,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { downloadCsv } from '../services/rbac';

interface PricingSurgeFlagsViewProps {
  darkMode: boolean;
  userRole: string;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type StudioTab = 'pricing' | 'surge' | 'flags';
type PreviewRole = 'customer' | 'driver' | 'vehicle_owner' | 'admin';

export const PricingSurgeFlagsView: React.FC<PricingSurgeFlagsViewProps> = ({
  onGuardPermission,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('pricing');
  const [config, setConfig] = useState<SuperAppRuntimeConfig | null>(null);
  const [configSource, setConfigSource] = useState<string>('governance-store');
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [previewRole, setPreviewRole] = useState<PreviewRole>('customer');

  const loadRuntimeConfig = async () => {
    setLoading(true);
    try {
      const res = await superAppBridgeService.getParseConfig();
      setConfig(res.params);
      setConfigSource(res.source);
    } catch (err: any) {
      onNotify('Parse Config Error', err?.message || 'Unable to load runtime config', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuntimeConfig();
  }, []);

  const handleSavePricingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    if (!onGuardPermission('manage_pricing_flags', 'Save Parse Config & PricingFinancialContext')) {
      return;
    }

    setSavingConfig(true);
    try {
      const res = await superAppBridgeService.updateParseConfig({
        bookingPriorities: config.bookingPriorities,
        pricingFinancialContext: config.pricingFinancialContext,
      });
      setConfig(res.params);
      onNotify(
        'Parse Config Synchronized',
        res.persistedToBack4App
          ? 'Saved to Back4App runtime snapshot & SuperApp PricingConfigService.'
          : 'Saved to server governance store.',
        'success'
      );
    } catch (err: any) {
      onNotify('Save Failed', err?.message, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAdjustSurge = async (
    zone: SuperAppSurgeZone,
    nextMultiplier: number,
    nextAuto?: boolean
  ) => {
    if (!onGuardPermission('manage_pricing_flags', `Update surge in ${zone.zoneName}`)) return;
    const clamped = Math.min(3.5, Math.max(1.0, Number(nextMultiplier.toFixed(2))));
    setBusyItem(zone.zoneId);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        zones: SuperAppSurgeZone[];
      }>('updateSurgeMultiplier', {
        zoneId: zone.zoneId,
        multiplier: clamped,
        autoSurgeEnabled: typeof nextAuto === 'boolean' ? nextAuto : zone.autoSurgeEnabled,
      });

      if (res.result?.zones && config) {
        setConfig({ ...config, regionalSurgeZones: res.result.zones });
      }
      onNotify(
        'Surge Multiplier Updated',
        `${zone.zoneName} set to ${clamped.toFixed(2)}x.`,
        'success'
      );
    } catch (err: any) {
      onNotify('Surge Update Error', err?.message, 'error');
    } finally {
      setBusyItem(null);
    }
  };

  const handleToggleFlag = async (
    flag: SuperAppFeatureFlagItem,
    enabled: boolean,
    rolloutPercentage?: number
  ) => {
    if (!onGuardPermission('manage_modules', `Update FeatureFlag ${flag.key}`)) return;
    setBusyItem(flag.key);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        featureFlags: SuperAppFeatureFlagItem[];
      }>('toggleFeatureFlag', {
        key: flag.key,
        enabled,
        rolloutPercentage:
          typeof rolloutPercentage === 'number' ? rolloutPercentage : flag.rolloutPercentage,
      });

      if (res.result?.featureFlags && config) {
        setConfig({ ...config, featureFlags: res.result.featureFlags });
      }
      onNotify(
        `FeatureFlag ${enabled ? 'Enabled' : 'Disabled'}`,
        `${flag.name} (${typeof rolloutPercentage === 'number' ? rolloutPercentage : flag.rolloutPercentage}% rollout)`,
        'success'
      );
    } catch (err: any) {
      onNotify('FeatureFlag Error', err?.message, 'error');
    } finally {
      setBusyItem(null);
    }
  };

  // Sample Ride & Truck Fare Preview using live PricingFinancialContext
  const farePreview = useMemo(() => {
    if (!config) return null;
    const p = config.pricingFinancialContext;
    const rideGross = p.rideBaseFareETB + 10 * p.ridePerKmETB + 22 * p.ridePerMinETB;
    const rideMargin = (rideGross * p.platformMarginPct) / 100;
    const rideTax = (rideGross * p.withholdingTaxPct) / 100;
    const rideNet = rideGross - rideMargin - rideTax;

    const truckGross =
      (p.truckBaseFareETB + 20 * 95 * p.truckPerTonKmETB) * config.bookingPriorities.urgent;
    const truckMargin = (truckGross * p.platformMarginPct) / 100;
    const truckTax = (truckGross * p.withholdingTaxPct) / 100;
    const truckNet = truckGross - truckMargin - truckTax;

    return {
      rideGross,
      rideNet,
      truckGross,
      truckNet,
    };
  }, [config]);

  const roleLauncherFlags = useMemo(() => {
    if (!config) return [];
    return config.featureFlags.filter(
      (f) => f.enabled && f.rolloutPercentage > 0 && f.targetRoles.includes(previewRole)
    );
  }, [config, previewRole]);

  const handleDownloadCsv = () => {
    if (!config) return;
    if (activeTab === 'surge') {
      downloadCsv(
        'afronala_superapp_surge_zones.csv',
        ['Zone ID', 'Corridor Name', 'Service', 'Active Requests', 'Available Drivers', 'Multiplier', 'Auto Surge'],
        config.regionalSurgeZones.map((z) => [
          z.zoneId,
          z.zoneName,
          z.serviceType,
          z.activeRequests,
          z.availableDrivers,
          `${z.currentMultiplier.toFixed(2)}x`,
          z.autoSurgeEnabled ? 'Enabled' : 'Manual',
        ])
      );
    } else if (activeTab === 'flags') {
      downloadCsv(
        'afronala_superapp_feature_flags.csv',
        ['Flag Key', 'Name', 'Service', 'Enabled', 'Rollout %', 'Target Roles', 'Description'],
        config.featureFlags.map((f) => [
          f.key,
          f.name,
          f.serviceType,
          f.enabled ? 'TRUE' : 'FALSE',
          `${f.rolloutPercentage}%`,
          f.targetRoles.join(' | '),
          f.description,
        ])
      );
    } else {
      const c = config.pricingFinancialContext;
      downloadCsv(
        'afronala_superapp_pricing_config.csv',
        ['Parameter', 'Value', 'Unit'],
        [
          ['Priority Normal', config.bookingPriorities.normal, 'x'],
          ['Priority Urgent', config.bookingPriorities.urgent, 'x'],
          ['Priority Express', config.bookingPriorities.express, 'x'],
          ['Ride Base Fare', c.rideBaseFareETB, 'ETB'],
          ['Ride Per Km', c.ridePerKmETB, 'ETB/km'],
          ['Ride Per Minute', c.ridePerMinETB, 'ETB/min'],
          ['Truck Base Fare', c.truckBaseFareETB, 'ETB'],
          ['Truck Per Ton-Km', c.truckPerTonKmETB, 'ETB/ton-km'],
          ['Platform Margin', c.platformMarginPct, '%'],
          ['Withholding Tax', c.withholdingTaxPct, '%'],
        ]
      );
    }
    onNotify('CSV Exported', `Downloaded ${activeTab} configuration table.`, 'success');
  };

  if (loading || !config) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>SuperApp Governance</span>
            <span aria-hidden="true">·</span>
            <span>Parse Runtime Config</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-700 dark:text-cyan-400">{configSource}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Dynamic Pricing, Surge &amp; FeatureFlag Studio
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'pricing'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Pricing &amp; Priorities</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('surge')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'surge'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Regional Surge Controller</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flags')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'flags'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>FeatureFlags &amp; UnifiedAppRegistry</span>
        </button>
      </div>

      {/* TAB 1: PRICING FINANCIAL CONTEXT & SYSTEMCONFIG PRIORITIES */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSavePricingConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                SystemConfig Booking Priority Multipliers
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Synchronized with Flutter SystemConfigService (normal, urgent, express tiers)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                {(['normal', 'urgent', 'express'] as const).map((tier) => (
                  <div key={tier}>
                    <label className="block text-xs font-semibold capitalize text-slate-700 dark:text-slate-300 mb-1">
                      {tier} Multiplier (x)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      max="4"
                      value={config.bookingPriorities[tier]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          bookingPriorities: {
                            ...config.bookingPriorities,
                            [tier]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                PricingFinancialContext Tariffs, Bidding Bounds &amp; Margins
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ride Base Fare (ETB)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={config.pricingFinancialContext.rideBaseFareETB}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricingFinancialContext: {
                          ...config.pricingFinancialContext,
                          rideBaseFareETB: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ride Distance Rate (ETB/km)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={config.pricingFinancialContext.ridePerKmETB}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricingFinancialContext: {
                          ...config.pricingFinancialContext,
                          ridePerKmETB: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ride Time Rate (ETB/min)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.pricingFinancialContext.ridePerMinETB}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricingFinancialContext: {
                          ...config.pricingFinancialContext,
                          ridePerMinETB: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Truck Base Dispatch (ETB)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={config.pricingFinancialContext.truckBaseFareETB}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricingFinancialContext: {
                          ...config.pricingFinancialContext,
                          truckBaseFareETB: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Truck Ton-Km Rate (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    value={config.pricingFinancialContext.truckPerTonKmETB}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricingFinancialContext: {
                          ...config.pricingFinancialContext,
                          truckPerTonKmETB: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Auto-Bid Window (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={config.pricingFinancialContext.autoBidWindowMinutes}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricingFinancialContext: {
                          ...config.pricingFinancialContext,
                          autoBidWindowMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="40"
                    value={config.pricingFinancialContext.platformMarginPct}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricingFinancialContext: {
                          ...config.pricingFinancialContext,
                          platformMarginPct: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Withholding Tax (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="15"
                    value={config.pricingFinancialContext.withholdingTaxPct}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricingFinancialContext: {
                          ...config.pricingFinancialContext,
                          withholdingTaxPct: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bid Floor / Ceiling (%)
                  </label>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <input
                      type="number"
                      value={config.pricingFinancialContext.biddingFloorPct}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            biddingFloorPct: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="number"
                      value={config.pricingFinancialContext.biddingCeilingPct}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            biddingCeilingPct: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingConfig ? 'Syncing Parse Config...' : 'Save to Parse Config'}</span>
              </button>
            </div>
          </div>

          {/* Live Financial Split Preview */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Tariff &amp; Split Simulator
              </h3>
            </div>

            {farePreview && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    10 km · 22 min Addis City Ride
                  </span>
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-400">Passenger Gross</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ETB {farePreview.rideGross.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-400">Net Driver Wallet</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      ETB {farePreview.rideNet.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    20T · 95 km Urgent Freight ({config.bookingPriorities.urgent.toFixed(2)}x)
                  </span>
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-400">Escrow Lock Gross</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ETB {Math.round(farePreview.truckGross).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-400">Net Fleet / Carrier</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      ETB {Math.round(farePreview.truckNet).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Enabled Transport Categories ({config.availableTransportCategories.length})
                  </p>
                  <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                    {config.availableTransportCategories.join(' · ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* TAB 2: REGIONAL SURGE CONTROLLER */}
      {activeTab === 'surge' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Live Corridor Demand &amp; Surge Multipliers (getCurrentSurge)
            </h2>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Range 1.00x – 3.50x
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-4">Corridor / Zone</th>
                  <th className="py-2.5 px-4">Service</th>
                  <th className="py-2.5 px-4 text-right">Demand / Supply</th>
                  <th className="py-2.5 px-4 text-right">Active Surge</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4 text-right">Multiplier Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {config.regionalSurgeZones.map((zone) => {
                  const pressure = (zone.activeRequests / Math.max(1, zone.availableDrivers)).toFixed(2);
                  return (
                    <tr key={zone.zoneId} className="h-12">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {zone.zoneName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {zone.zoneId} · {zone.updatedAt}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono uppercase text-slate-700 dark:text-slate-300">
                        {zone.serviceType}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {zone.activeRequests} req / {zone.availableDrivers} drv ({pressure})
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">
                        <span
                          className={
                            zone.currentMultiplier > 1.25
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }
                        >
                          {zone.currentMultiplier.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          disabled={busyItem === zone.zoneId}
                          onClick={() =>
                            handleAdjustSurge(zone, zone.currentMultiplier, !zone.autoSurgeEnabled)
                          }
                          className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
                        >
                          {zone.autoSurgeEnabled ? 'Auto-Dynamic' : 'Manual Override'}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busyItem === zone.zoneId || zone.currentMultiplier <= 1.0}
                            onClick={() => handleAdjustSurge(zone, zone.currentMultiplier - 0.1)}
                            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                            title="Decrease surge by 0.10x"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busyItem === zone.zoneId}
                            onClick={() => handleAdjustSurge(zone, 1.0)}
                            className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            1.00x
                          </button>
                          <button
                            type="button"
                            disabled={busyItem === zone.zoneId || zone.currentMultiplier >= 3.5}
                            onClick={() => handleAdjustSurge(zone, zone.currentMultiplier + 0.1)}
                            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                            title="Increase surge by 0.10x"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FEATUREFLAGS & UNIFIEDAPPREGISTRY PREVIEW */}
      {activeTab === 'flags' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Parse FeatureFlag Class &amp; Rollout Percentages
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Super Admin gated mutations
              </span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {config.featureFlags.map((flag) => (
                <div
                  key={flag.key}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{flag.name}</span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="font-mono text-[11px] text-cyan-700 dark:text-cyan-400">
                        {flag.key}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{flag.description}</p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Roles: {flag.targetRoles.join(', ')} · Service: {flag.serviceType}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-32">
                      <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400 mb-1">
                        <span>Rollout</span>
                        <span>{flag.rolloutPercentage}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={25}
                        value={flag.rolloutPercentage}
                        onChange={(e) =>
                          handleToggleFlag(flag, flag.enabled, Number(e.target.value))
                        }
                        className="w-full accent-cyan-600 cursor-pointer"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={busyItem === flag.key}
                      onClick={() =>
                        handleToggleFlag(
                          flag,
                          !flag.enabled,
                          !flag.enabled && flag.rolloutPercentage === 0
                            ? 100
                            : flag.rolloutPercentage
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        flag.enabled
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UnifiedAppRegistry Mobile Role Simulator */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                UnifiedAppRegistry Role Gate Preview
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Preview active capabilities rendered inside the Flutter SuperApp launcher per authenticated role.
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {(['customer', 'driver', 'vehicle_owner', 'admin'] as PreviewRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPreviewRole(r)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                    previewRole === r
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 pt-2">
              {roleLauncherFlags.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No active FeatureFlags targeting {previewRole}.
                </p>
              ) : (
                roleLauncherFlags.map((f) => (
                  <div key={f.key} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-white">{f.name}</span>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] text-slate-500">
                      {f.rolloutPercentage}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
