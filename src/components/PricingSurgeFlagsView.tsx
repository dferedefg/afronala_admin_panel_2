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
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Truck,
  Car,
  AlertTriangle,
  RotateCcw,
  Zap,
  Building2,
  Compass,
  Landmark,
  BadgePercent,
  Check,
  Fuel,
  MapPin,
  Clock,
  Coins,
} from 'lucide-react';
import {
  AdminUser,
  EastAfricaCountryCode,
  EastAfricaCurrency,
  PermissionAction,
  RegionalCountryPricingContext,
  SuperAppFeatureFlagItem,
  SuperAppRuntimeConfig,
  SuperAppSurgeZone,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { downloadCsv } from '../services/rbac';
import { EAST_AFRICA_HUBS } from '../services/payments';

interface PricingSurgeFlagsViewProps {
  darkMode?: boolean;
  user?: AdminUser | null;
  userRole?: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  userName?: string;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type StudioTab = 'pricing' | 'surge' | 'flags';
type PreviewRole = 'customer' | 'driver' | 'vehicle_owner' | 'admin';

interface CorridorPreset {
  id: string;
  name: string;
  countryCode: EastAfricaCountryCode;
  serviceType: 'ride' | 'truck';
  defaultDistanceKm: number;
  defaultDurationMin: number;
  defaultTons: number;
  note: string;
  gateway: string;
}

const REGIONAL_CORRIDOR_PRESETS: CorridorPreset[] = [
  // 🇪🇹 Ethiopia
  {
    id: 'corridor-aa-city',
    name: 'Addis Ababa Bole → Piassa Urban Ride',
    countryCode: 'ET',
    serviceType: 'ride',
    defaultDistanceKm: 10,
    defaultDurationMin: 24,
    defaultTons: 0,
    note: 'Urban metropolitan ride hailing with AmbaLay route matrix',
    gateway: 'Telebirr / CBE Birr',
  },
  {
    id: 'corridor-modjo-djibouti',
    name: 'Modjo Dry Port ⇄ Doraleh Port Djibouti (Container Vein)',
    countryCode: 'ET',
    serviceType: 'truck',
    defaultDistanceKm: 910,
    defaultDurationMin: 960,
    defaultTons: 28,
    note: 'Bilateral export/import heavy container haul (ETB/DJF dual-rail clearing)',
    gateway: 'CBE Birr ⇄ D-Money',
  },
  {
    id: 'corridor-hawassa-express',
    name: 'Hawassa Industrial Park ⇄ Addis Ababa Southern Tollway',
    countryCode: 'ET',
    serviceType: 'truck',
    defaultDistanceKm: 275,
    defaultDurationMin: 320,
    defaultTons: 22,
    note: 'Apparel & textile export corridor with bonded customs escrow',
    gateway: 'Telebirr Enterprise',
  },

  // 🇰🇪 Kenya
  {
    id: 'corridor-nbo-westlands',
    name: 'Nairobi Westlands → Upper Hill Corporate Ride',
    countryCode: 'KE',
    serviceType: 'ride',
    defaultDistanceKm: 12,
    defaultDurationMin: 30,
    defaultTons: 0,
    note: 'Nairobi commercial express lane via Safaricom M-PESA',
    gateway: 'Safaricom M-PESA',
  },
  {
    id: 'corridor-mombasa-nbo',
    name: 'Mombasa Port Container Terminal ⇄ Nairobi ICD SGR Depot',
    countryCode: 'KE',
    serviceType: 'truck',
    defaultDistanceKm: 485,
    defaultDurationMin: 540,
    defaultTons: 32,
    note: 'Standard Gauge Railway & highway freight artery linking Mombasa harbor',
    gateway: 'Safaricom B2C Paybill',
  },
  {
    id: 'corridor-moyale-nbo',
    name: 'Moyale Border OSBP ⇄ Marsabit ⇄ Nairobi Commercial Route',
    countryCode: 'KE',
    serviceType: 'truck',
    defaultDistanceKm: 780,
    defaultDurationMin: 720,
    defaultTons: 24,
    note: 'Cross-border livestock, goods & agricultural commodities transit',
    gateway: 'M-PESA / KEPSS',
  },

  // 🇺🇬 Uganda
  {
    id: 'corridor-kla-kololo',
    name: 'Kampala Kololo & CBD Urban Ride',
    countryCode: 'UG',
    serviceType: 'ride',
    defaultDistanceKm: 8,
    defaultDurationMin: 22,
    defaultTons: 0,
    note: 'Kampala urban mobility with dynamic traffic congestion multiplier',
    gateway: 'MTN MoMo Uganda',
  },
  {
    id: 'corridor-kla-malaba',
    name: 'Malaba OSBP Border ⇄ Tororo ⇄ Kampala Namanve Hub',
    countryCode: 'UG',
    serviceType: 'truck',
    defaultDistanceKm: 220,
    defaultDurationMin: 280,
    defaultTons: 24,
    note: 'Northern Transit Corridor connecting Kenya SGR to Kampala manufacturing',
    gateway: 'MTN MoMo / Airtel Money',
  },
  {
    id: 'corridor-entebbe-express',
    name: 'Entebbe International Airport ⇄ Kampala CBD Express',
    countryCode: 'UG',
    serviceType: 'ride',
    defaultDistanceKm: 42,
    defaultDurationMin: 45,
    defaultTons: 0,
    note: 'High-speed airport corridor with integrated electronic toll collection',
    gateway: 'MTN MoMo Open API',
  },

  // 🇷🇼 Rwanda
  {
    id: 'corridor-kgl-heights',
    name: 'Kigali Heights → Kimihurura Convention Center Ride',
    countryCode: 'RW',
    serviceType: 'ride',
    defaultDistanceKm: 14,
    defaultDurationMin: 28,
    defaultTons: 0,
    note: 'Clean urban corridor regulated by National Bank of Rwanda (BNR)',
    gateway: 'MTN MoMo Rwanda',
  },
  {
    id: 'corridor-klp-rusumo',
    name: 'Kigali Logistics Platform (KLP Masaka) ⇄ Rusumo OSBP',
    countryCode: 'RW',
    serviceType: 'truck',
    defaultDistanceKm: 165,
    defaultDurationMin: 210,
    defaultTons: 28,
    note: 'Central Corridor gateway connecting Rwanda to Tanzania maritime ports',
    gateway: 'MTN MoMo Pay BNR',
  },

  // 🇹🇿 Tanzania
  {
    id: 'corridor-dar-kariakoo',
    name: 'Dar es Salaam CBD Kariakoo Commercial Ride',
    countryCode: 'TZ',
    serviceType: 'ride',
    defaultDistanceKm: 11,
    defaultDurationMin: 35,
    defaultTons: 0,
    note: 'Coastal commercial mobility with Vodacom M-Pesa instant fare clearing',
    gateway: 'Vodacom M-Pesa TZ',
  },
  {
    id: 'corridor-dar-port',
    name: 'Dar es Salaam Port Kurasini ⇄ Isaka Dry Port Route',
    countryCode: 'TZ',
    serviceType: 'truck',
    defaultDistanceKm: 520,
    defaultDurationMin: 600,
    defaultTons: 30,
    note: 'Tanzania maritime container transit into interior Great Lakes dry hubs',
    gateway: 'TISS / M-Pesa B2C',
  },

  // 🇩🇯 Djibouti
  {
    id: 'corridor-dj-balbala',
    name: 'Djibouti City Center → Balbala Port District Ride',
    countryCode: 'DJ',
    serviceType: 'ride',
    defaultDistanceKm: 9,
    defaultDurationMin: 20,
    defaultTons: 0,
    note: 'Urban harbor transit linking ministerial district to residential port zone',
    gateway: 'D-Money Djibouti Telecom',
  },
  {
    id: 'corridor-doraleh-galafi',
    name: 'Doraleh Multipurpose Port (DMP) ⇄ Galafi Border Link',
    countryCode: 'DJ',
    serviceType: 'truck',
    defaultDistanceKm: 215,
    defaultDurationMin: 260,
    defaultTons: 34,
    note: 'Red Sea Deepwater container terminal to Ethiopia bonded customs border',
    gateway: 'D-Money / BCIMR Clearing',
  },

  // 🇸🇴 Somalia
  {
    id: 'corridor-mgq-airport',
    name: 'Mogadishu Aden Adde Airport ⇄ Bakara Commercial Ride',
    countryCode: 'SO',
    serviceType: 'ride',
    defaultDistanceKm: 14,
    defaultDurationMin: 25,
    defaultTons: 0,
    note: 'Secure transport corridor operating on USD/EVC Plus mobile wallet',
    gateway: 'Hormuud EVC Plus (USD)',
  },
  {
    id: 'corridor-berbera-hargeisa',
    name: 'Berbera Port DP World Terminal ⇄ Tog Wajaale Border',
    countryCode: 'SO',
    serviceType: 'truck',
    defaultDistanceKm: 240,
    defaultDurationMin: 300,
    defaultTons: 25,
    note: 'DP World deepwater hub connecting Somaliland trade to Eastern Ethiopia',
    gateway: 'Telesom Zaad / EVC Plus',
  },

  // 🇸🇸 South Sudan
  {
    id: 'corridor-jub-custom',
    name: 'Juba Munuki ⇄ Konyo Konyo Market Urban Ride',
    countryCode: 'SS',
    serviceType: 'ride',
    defaultDistanceKm: 10,
    defaultDurationMin: 26,
    defaultTons: 0,
    note: 'Juba urban mobility operating with m-GURUSH electronic payment rail',
    gateway: 'm-GURUSH Mobile Money',
  },
  {
    id: 'corridor-nimule-juba',
    name: 'Nimule Border OSBP ⇄ Juba River Port Lifeline Route',
    countryCode: 'SS',
    serviceType: 'truck',
    defaultDistanceKm: 195,
    defaultDurationMin: 240,
    defaultTons: 26,
    note: 'White Nile humanitarian lifeline connecting Uganda imports into South Sudan',
    gateway: 'm-GURUSH / BSS Clearing',
  },
];

export const PricingSurgeFlagsView: React.FC<PricingSurgeFlagsViewProps> = ({
  darkMode = true,
  user,
  userRole = 'Super Admin',
  userJurisdiction = 'ALL',
  userJurisdictionName,
  assignedCorridors,
  userName,
  onGuardPermission,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('pricing');

  // Resolve initial country from operator persona
  const resolveOperatorCountry = (): EastAfricaCountryCode | 'ALL' => {
    if (userJurisdiction && userJurisdiction !== 'ALL') return userJurisdiction;
    if (user?.jurisdictionCountry && user.jurisdictionCountry !== 'ALL') return user.jurisdictionCountry;
    return 'ALL';
  };

  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode | 'ALL'>(() => resolveOperatorCountry());
  const [config, setConfig] = useState<SuperAppRuntimeConfig | null>(null);
  const [configSource, setConfigSource] = useState<string>('governance-store');
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [previewRole, setPreviewRole] = useState<PreviewRole>('customer');

  // Simulator Interactive States
  const [selectedCorridorPresetId, setSelectedCorridorPresetId] = useState<string>('corridor-aa-city');
  const [simDistanceKm, setSimDistanceKm] = useState<number>(10);
  const [simDurationMin, setSimDurationMin] = useState<number>(24);
  const [simTonnage, setSimTonnage] = useState<number>(20);
  const [simPriorityMultiplier, setSimPriorityMultiplier] = useState<number>(1.0);
  const [simSurgeMultiplier, setSimSurgeMultiplier] = useState<number>(1.0);

  // Sync with persona/jurisdiction changes in top bar
  useEffect(() => {
    const operatorStation = resolveOperatorCountry();
    setSelectedCountry(operatorStation);
    if (operatorStation !== 'ALL') {
      const matchingPreset = REGIONAL_CORRIDOR_PRESETS.find((p) => p.countryCode === operatorStation);
      if (matchingPreset) {
        setSelectedCorridorPresetId(matchingPreset.id);
        setSimDistanceKm(matchingPreset.defaultDistanceKm);
        setSimDurationMin(matchingPreset.defaultDurationMin);
        setSimTonnage(matchingPreset.defaultTons || 20);
      }
    }
  }, [userJurisdiction, user?.jurisdictionCountry]);

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

  const handleCountryChange = (cCode: EastAfricaCountryCode | 'ALL') => {
    setSelectedCountry(cCode);
    if (cCode !== 'ALL') {
      const matchingPreset = REGIONAL_CORRIDOR_PRESETS.find((p) => p.countryCode === cCode);
      if (matchingPreset) {
        setSelectedCorridorPresetId(matchingPreset.id);
        setSimDistanceKm(matchingPreset.defaultDistanceKm);
        setSimDurationMin(matchingPreset.defaultDurationMin);
        setSimTonnage(matchingPreset.defaultTons || 20);
      }
    }
  };

  const handleCorridorPresetChange = (presetId: string) => {
    setSelectedCorridorPresetId(presetId);
    const p = REGIONAL_CORRIDOR_PRESETS.find((cp) => cp.id === presetId);
    if (p) {
      setSimDistanceKm(p.defaultDistanceKm);
      setSimDurationMin(p.defaultDurationMin);
      setSimTonnage(p.defaultTons || 20);
      if (selectedCountry !== p.countryCode) {
        setSelectedCountry(p.countryCode);
      }
    }
  };

  const activeHub = selectedCountry !== 'ALL' ? EAST_AFRICA_HUBS[selectedCountry] : null;

  // Active pricing context (country specific or base global)
  const currentPricing = useMemo(() => {
    if (!config) return null;
    if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
      return config.regionalCountryPricing[selectedCountry];
    }
    // Default to Ethiopia base
    return {
      countryCode: 'ET' as EastAfricaCountryCode,
      countryName: 'Ethiopia (Base Ledger)',
      flag: '🇪🇹',
      currency: 'ETB' as EastAfricaCurrency,
      currencySymbol: 'Br',
      exchangeRateToETB: 1.0,
      regulator: 'National Bank of Ethiopia (NBE)',
      rideBaseFare: config.pricingFinancialContext.rideBaseFareETB,
      ridePerKm: config.pricingFinancialContext.ridePerKmETB,
      ridePerMin: config.pricingFinancialContext.ridePerMinETB,
      truckBaseFare: config.pricingFinancialContext.truckBaseFareETB,
      truckPerTonKm: config.pricingFinancialContext.truckPerTonKmETB,
      biddingFloorPct: config.pricingFinancialContext.biddingFloorPct,
      biddingCeilingPct: config.pricingFinancialContext.biddingCeilingPct,
      platformMarginPct: config.pricingFinancialContext.platformMarginPct,
      withholdingTaxPct: config.pricingFinancialContext.withholdingTaxPct,
      autoBidWindowMinutes: config.pricingFinancialContext.autoBidWindowMinutes,
      corridorNotes: 'Global Core Ledger / Addis Ababa Axis',
    };
  }, [config, selectedCountry]);

  const handleSavePricingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    if (!onGuardPermission('manage_pricing_flags', 'Save Parse Config & PricingFinancialContext')) {
      return;
    }

    setSavingConfig(true);
    try {
      const payload: Partial<SuperAppRuntimeConfig> = {
        bookingPriorities: config.bookingPriorities,
        pricingFinancialContext: config.pricingFinancialContext,
      };

      if (config.regionalCountryPricing) {
        payload.regionalCountryPricing = config.regionalCountryPricing;
      }

      const res = await superAppBridgeService.updateParseConfig(payload);
      setConfig(res.params);
      onNotify(
        'Parse Config Synchronized',
        res.persistedToBack4App
          ? `Saved to Back4App runtime snapshot & SuperApp PricingConfigService (${selectedCountry === 'ALL' ? 'All Hubs' : selectedCountry}).`
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

  const handleBulkSetCountrySurge = async (targetMultiplier: number) => {
    if (selectedCountry === 'ALL') {
      onNotify('Select Country Hub', 'Please select a specific country to bulk-adjust surge multipliers.', 'info');
      return;
    }
    if (!onGuardPermission('manage_pricing_flags', `Bulk set surge in ${selectedCountry}`)) return;
    if (!config) return;

    const targetZones = config.regionalSurgeZones.filter((z) => (z.countryCode || 'ET') === selectedCountry);
    if (targetZones.length === 0) return;

    setBusyItem('bulk-surge');
    try {
      for (const zone of targetZones) {
        await superAppBridgeService.callCloudFunction('updateSurgeMultiplier', {
          zoneId: zone.zoneId,
          multiplier: targetMultiplier,
          autoSurgeEnabled: targetMultiplier === 1.0,
        });
      }
      await loadRuntimeConfig();
      onNotify(
        'Bulk Surge Multiplier Applied',
        `All ${targetZones.length} zones in ${EAST_AFRICA_HUBS[selectedCountry]?.countryName} updated to ${targetMultiplier.toFixed(2)}x.`,
        'success'
      );
    } catch (err: any) {
      onNotify('Bulk Surge Error', err?.message, 'error');
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

  // Filtered surge zones by country
  const filteredSurgeZones = useMemo(() => {
    if (!config) return [];
    if (selectedCountry === 'ALL') return config.regionalSurgeZones;
    return config.regionalSurgeZones.filter((z) => (z.countryCode || 'ET') === selectedCountry);
  }, [config, selectedCountry]);

  // Filtered feature flags by country
  const filteredFeatureFlags = useMemo(() => {
    if (!config) return [];
    if (selectedCountry === 'ALL') return config.featureFlags;
    return config.featureFlags.filter(
      (f) => !f.countries || f.countries.length === 0 || f.countries.includes(selectedCountry)
    );
  }, [config, selectedCountry]);

  // Comprehensive multi-currency fare calculation
  const fareSimulation = useMemo(() => {
    if (!config || !currentPricing) return null;
    const cp = currentPricing;

    // Ride fare in native currency
    const rideGrossNative =
      (cp.rideBaseFare + simDistanceKm * cp.ridePerKm + simDurationMin * cp.ridePerMin) *
      simPriorityMultiplier *
      simSurgeMultiplier;
    const rideMarginNative = (rideGrossNative * cp.platformMarginPct) / 100;
    const rideTaxNative = (rideGrossNative * cp.withholdingTaxPct) / 100;
    const rideNetNative = rideGrossNative - rideMarginNative - rideTaxNative;

    // Truck fare in native currency
    const truckGrossNative =
      (cp.truckBaseFare + simTonnage * simDistanceKm * cp.truckPerTonKm) *
      simPriorityMultiplier *
      simSurgeMultiplier;
    const truckMarginNative = (truckGrossNative * cp.platformMarginPct) / 100;
    const truckTaxNative = (truckGrossNative * cp.withholdingTaxPct) / 100;
    const truckNetNative = truckGrossNative - truckMarginNative - truckTaxNative;

    // Convert to ETB equivalent
    const rateToETB = cp.exchangeRateToETB || 1.0;
    const rideGrossETB = rideGrossNative * rateToETB;
    const rideNetETB = rideNetNative * rateToETB;
    const truckGrossETB = truckGrossNative * rateToETB;
    const truckNetETB = truckNetNative * rateToETB;

    return {
      currency: cp.currency,
      currencySymbol: cp.currencySymbol,
      rateToETB,
      rideGrossNative,
      rideMarginNative,
      rideTaxNative,
      rideNetNative,
      truckGrossNative,
      truckMarginNative,
      truckTaxNative,
      truckNetNative,
      rideGrossETB,
      rideNetETB,
      truckGrossETB,
      truckNetETB,
    };
  }, [
    config,
    currentPricing,
    simDistanceKm,
    simDurationMin,
    simTonnage,
    simPriorityMultiplier,
    simSurgeMultiplier,
  ]);

  const roleLauncherFlags = useMemo(() => {
    if (!config) return [];
    return filteredFeatureFlags.filter(
      (f) => f.enabled && f.rolloutPercentage > 0 && f.targetRoles.includes(previewRole)
    );
  }, [config, filteredFeatureFlags, previewRole]);

  const handleDownloadCsv = () => {
    if (!config) return;
    if (activeTab === 'surge') {
      downloadCsv(
        `afronala_surge_zones_${selectedCountry.toLowerCase()}_${Date.now()}.csv`,
        ['Zone ID', 'Country', 'City', 'Corridor Name', 'Service', 'Active Requests', 'Available Drivers', 'Multiplier', 'Auto Surge', 'Currency'],
        filteredSurgeZones.map((z) => [
          z.zoneId,
          z.countryCode || 'ET',
          z.city || 'Addis Ababa',
          z.zoneName,
          z.serviceType,
          z.activeRequests,
          z.availableDrivers,
          `${z.currentMultiplier.toFixed(2)}x`,
          z.autoSurgeEnabled ? 'Auto-Dynamic' : 'Manual Lock',
          z.currency || 'ETB',
        ])
      );
    } else if (activeTab === 'flags') {
      downloadCsv(
        `afronala_feature_flags_${selectedCountry.toLowerCase()}_${Date.now()}.csv`,
        ['Flag Key', 'Name', 'Service', 'Enabled', 'Rollout %', 'Target Roles', 'Target Countries', 'Description'],
        filteredFeatureFlags.map((f) => [
          f.key,
          f.name,
          f.serviceType,
          f.enabled ? 'TRUE' : 'FALSE',
          `${f.rolloutPercentage}%`,
          f.targetRoles.join(' | '),
          f.countries ? f.countries.join(' | ') : 'ALL',
          f.description,
        ])
      );
    } else {
      const c = currentPricing || config.pricingFinancialContext;
      downloadCsv(
        `afronala_pricing_matrix_${selectedCountry.toLowerCase()}_${Date.now()}.csv`,
        ['Hub / Scope', 'Parameter', 'Native Value', 'Currency', 'Exchange Rate to ETB'],
        [
          [selectedCountry === 'ALL' ? 'Global Base' : selectedCountry, 'Ride Base Fare', 'rideBaseFare' in c ? c.rideBaseFare : c.rideBaseFareETB, 'currency' in c ? c.currency : 'ETB', 'exchangeRateToETB' in c ? c.exchangeRateToETB : 1.0],
          [selectedCountry === 'ALL' ? 'Global Base' : selectedCountry, 'Ride Distance Rate', 'ridePerKm' in c ? c.ridePerKm : c.ridePerKmETB, `${'currency' in c ? c.currency : 'ETB'}/km`, 'exchangeRateToETB' in c ? c.exchangeRateToETB : 1.0],
          [selectedCountry === 'ALL' ? 'Global Base' : selectedCountry, 'Ride Time Rate', 'ridePerMin' in c ? c.ridePerMin : c.ridePerMinETB, `${'currency' in c ? c.currency : 'ETB'}/min`, 'exchangeRateToETB' in c ? c.exchangeRateToETB : 1.0],
          [selectedCountry === 'ALL' ? 'Global Base' : selectedCountry, 'Truck Base Dispatch', 'truckBaseFare' in c ? c.truckBaseFare : c.truckBaseFareETB, 'currency' in c ? c.currency : 'ETB', 'exchangeRateToETB' in c ? c.exchangeRateToETB : 1.0],
          [selectedCountry === 'ALL' ? 'Global Base' : selectedCountry, 'Truck Ton-Km Rate', 'truckPerTonKm' in c ? c.truckPerTonKm : c.truckPerTonKmETB, `${'currency' in c ? c.currency : 'ETB'}/ton-km`, 'exchangeRateToETB' in c ? c.exchangeRateToETB : 1.0],
          [selectedCountry === 'ALL' ? 'Global Base' : selectedCountry, 'Platform Margin', c.platformMarginPct, '%', 'N/A'],
          [selectedCountry === 'ALL' ? 'Global Base' : selectedCountry, 'Withholding Tax', c.withholdingTaxPct, '%', 'N/A'],
        ]
      );
    }
    onNotify('CSV Exported', `Downloaded ${activeTab} configuration table for ${selectedCountry}.`, 'success');
  };

  const userStationCountry = user?.jurisdictionCountry || userJurisdiction || 'ALL';
  const isAssignedToSpecificCountry = userStationCountry !== 'ALL';
  const assignedHub = isAssignedToSpecificCountry ? EAST_AFRICA_HUBS[userStationCountry] : null;

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
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Financial Governance &amp; Tariffs</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 font-medium text-cyan-600 dark:text-cyan-400">
              <Globe className="w-3.5 h-3.5" />
              <span>East Africa Cross-Border Pricing Studio (8 Nations)</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{configSource}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 flex items-center gap-2.5">
            <span>Dynamic Pricing &amp; Surge Studio</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
              Corridor Telemetry
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap shrink-0 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Operator Station Governance Context Banner */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-linear-to-r from-cyan-950/40 via-slate-900 to-slate-900/80 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-lg shrink-0">
              {assignedHub ? assignedHub.flag : '🌐'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-mono text-cyan-400 font-semibold">
                  Operator Tariff Governance
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-xs font-bold text-slate-200">
                  {userName || user?.name || 'Authorized Tariff Admin'} ({userRole})
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-xs text-slate-300">
                  Station: <strong className="text-cyan-300">{user?.jurisdictionName || (assignedHub ? assignedHub.countryName : 'Pan-East Africa Cross-Border Matrix')}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {isAssignedToSpecificCountry && assignedHub ? (
                  <span>
                    Direct statutory pricing &amp; surge authority under <strong>{assignedHub.regulator}</strong>. Native currency: <strong>{assignedHub.currency} ({assignedHub.currencySymbol})</strong> at 1 {assignedHub.currency} = {assignedHub.exchangeRateToETB} ETB base. Corridors: {assignedCorridors && assignedCorridors.length > 0 ? assignedCorridors.join(' · ') : assignedHub.settlementCorridorNote}.
                  </span>
                ) : (
                  <span>
                    Pan-regional cross-border tariff authority covering all 8 member states: Ethiopia, Kenya, Uganda, Rwanda, Tanzania, Djibouti, Somalia, and South Sudan with real-time surge balancing and corridor escrows.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {isAssignedToSpecificCountry && selectedCountry !== userStationCountry && (
              <button
                type="button"
                onClick={() => handleCountryChange(userStationCountry)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Snap to My Station ({userStationCountry})</span>
              </button>
            )}
            {selectedCountry !== 'ALL' && (
              <button
                type="button"
                onClick={() => handleCountryChange('ALL')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                View Pan-East Africa Grid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* East Africa Regional Country Selector Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Regional Pricing Hub &amp; Freight Corridor Scope
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Regulated tariffs, fuel benchmarks &amp; statutory tax withholdings
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => handleCountryChange('ALL')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border ${
              selectedCountry === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
            }`}
          >
            <span className="text-sm">🌍</span>
            <span>All Regional Hubs</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${selectedCountry === 'ALL' ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              8 Nations
            </span>
          </button>

          {(Object.keys(EAST_AFRICA_HUBS) as EastAfricaCountryCode[]).map((cCode) => {
            const hub = EAST_AFRICA_HUBS[cCode];
            const isSelected = selectedCountry === cCode;
            const isOperatorStation = userStationCountry === cCode;

            return (
              <button
                key={cCode}
                type="button"
                onClick={() => handleCountryChange(cCode)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border relative ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                }`}
              >
                <span className="text-base leading-none">{hub.flag}</span>
                <span>{hub.countryName}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {hub.currency}
                </span>
                {isOperatorStation && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-900 ml-0.5">
                    Your Station
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Hub Detail Banner */}
        {activeHub && currentPricing ? (
          <div className="mt-2 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeHub.flag}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {activeHub.countryName} Dynamic Tariff Profile
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30">
                    Regulator: {currentPricing.regulator}
                  </span>
                  {userStationCountry === activeHub.countryCode && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                      Primary Operator Assigned Hub
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Strategic Corridor:</span> {currentPricing.corridorNotes || activeHub.settlementCorridorNote}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700 flex-wrap">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Base Currency</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {currentPricing.currency} ({currentPricing.currencySymbol})
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ETB Peg / Rate</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  1 {currentPricing.currency} = {currentPricing.exchangeRateToETB} ETB
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Statutory Withholding</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {currentPricing.withholdingTaxPct}% Tax · {currentPricing.platformMarginPct}% Margin
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>
                <strong>Cross-Border Tariff Federation:</strong> Managing dynamic fares, surge multipliers, and feature rollout across 8 East African countries.
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
              Bilateral Flagship: Modjo Dry Port (ET) ⇄ Doraleh Port (DJ) Multimodal Corridor
            </div>
          </div>
        )}
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
          <span>Pricing &amp; Corridor Tariffs</span>
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
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Regional Surge Controller ({filteredSurgeZones.length} Zones)</span>
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
          <Flag className="w-3.5 h-3.5 text-cyan-500" />
          <span>FeatureFlags &amp; Regional Rollout ({filteredFeatureFlags.length})</span>
        </button>
      </div>

      {/* TAB 1: PRICING FINANCIAL CONTEXT & REGIONAL CORRIDOR SIMULATOR */}
      {activeTab === 'pricing' && currentPricing && (
        <form onSubmit={handleSavePricingConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-6">
            {/* Priority Multipliers */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>SystemConfig Booking Priority Multipliers</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Global Fleet Dispatch Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multipliers synchronized across Flutter client applications for normal, urgent, and express tiers
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                {(['normal', 'urgent', 'express'] as const).map((tier) => (
                  <div key={tier}>
                    <label className="block text-xs font-semibold capitalize text-slate-700 dark:text-slate-300 mb-1">
                      {tier} Tier (x)
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

            {/* Regional Tariff Formula Inputs */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedCountry !== 'ALL'
                    ? `${currentPricing.countryName} (${currentPricing.currency}) Tariff Parameters`
                    : 'Global Base Ledger (ETB) Tariffs & Bounds'}
                </h2>
                <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                  {currentPricing.currency} Rail
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Ride and freight tariff matrix enforced by {currentPricing.regulator}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ride Base Fare ({currentPricing.currency})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={
                      selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]
                        ? config.regionalCountryPricing[selectedCountry].rideBaseFare
                        : config.pricingFinancialContext.rideBaseFareETB
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                        setConfig({
                          ...config,
                          regionalCountryPricing: {
                            ...config.regionalCountryPricing,
                            [selectedCountry]: {
                              ...config.regionalCountryPricing[selectedCountry],
                              rideBaseFare: val,
                            },
                          },
                        });
                      } else {
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            rideBaseFareETB: val,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ride Distance Rate ({currentPricing.currency}/km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={
                      selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]
                        ? config.regionalCountryPricing[selectedCountry].ridePerKm
                        : config.pricingFinancialContext.ridePerKmETB
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                        setConfig({
                          ...config,
                          regionalCountryPricing: {
                            ...config.regionalCountryPricing,
                            [selectedCountry]: {
                              ...config.regionalCountryPricing[selectedCountry],
                              ridePerKm: val,
                            },
                          },
                        });
                      } else {
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            ridePerKmETB: val,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ride Time Rate ({currentPricing.currency}/min)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={
                      selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]
                        ? config.regionalCountryPricing[selectedCountry].ridePerMin
                        : config.pricingFinancialContext.ridePerMinETB
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                        setConfig({
                          ...config,
                          regionalCountryPricing: {
                            ...config.regionalCountryPricing,
                            [selectedCountry]: {
                              ...config.regionalCountryPricing[selectedCountry],
                              ridePerMin: val,
                            },
                          },
                        });
                      } else {
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            ridePerMinETB: val,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Truck Base Dispatch ({currentPricing.currency})
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={
                      selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]
                        ? config.regionalCountryPricing[selectedCountry].truckBaseFare
                        : config.pricingFinancialContext.truckBaseFareETB
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                        setConfig({
                          ...config,
                          regionalCountryPricing: {
                            ...config.regionalCountryPricing,
                            [selectedCountry]: {
                              ...config.regionalCountryPricing[selectedCountry],
                              truckBaseFare: val,
                            },
                          },
                        });
                      } else {
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            truckBaseFareETB: val,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Truck Ton-Km Rate ({currentPricing.currency})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={
                      selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]
                        ? config.regionalCountryPricing[selectedCountry].truckPerTonKm
                        : config.pricingFinancialContext.truckPerTonKmETB
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                        setConfig({
                          ...config,
                          regionalCountryPricing: {
                            ...config.regionalCountryPricing,
                            [selectedCountry]: {
                              ...config.regionalCountryPricing[selectedCountry],
                              truckPerTonKm: val,
                            },
                          },
                        });
                      } else {
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            truckPerTonKmETB: val,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Take Margin (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentPricing.platformMarginPct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                        setConfig({
                          ...config,
                          regionalCountryPricing: {
                            ...config.regionalCountryPricing,
                            [selectedCountry]: {
                              ...config.regionalCountryPricing[selectedCountry],
                              platformMarginPct: val,
                            },
                          },
                        });
                      } else {
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            platformMarginPct: val,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statutory Tax Withholding (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentPricing.withholdingTaxPct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                        setConfig({
                          ...config,
                          regionalCountryPricing: {
                            ...config.regionalCountryPricing,
                            [selectedCountry]: {
                              ...config.regionalCountryPricing[selectedCountry],
                              withholdingTaxPct: val,
                            },
                          },
                        });
                      } else {
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            withholdingTaxPct: val,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Carrier Bid Floor / Ceiling (%)
                  </label>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <input
                      type="number"
                      value={currentPricing.biddingFloorPct}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                          setConfig({
                            ...config,
                            regionalCountryPricing: {
                              ...config.regionalCountryPricing,
                              [selectedCountry]: {
                                ...config.regionalCountryPricing[selectedCountry],
                                biddingFloorPct: val,
                              },
                            },
                          });
                        } else {
                          setConfig({
                            ...config,
                            pricingFinancialContext: {
                              ...config.pricingFinancialContext,
                              biddingFloorPct: val,
                            },
                          });
                        }
                      }}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="number"
                      value={currentPricing.biddingCeilingPct}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                          setConfig({
                            ...config,
                            regionalCountryPricing: {
                              ...config.regionalCountryPricing,
                              [selectedCountry]: {
                                ...config.regionalCountryPricing[selectedCountry],
                                biddingCeilingPct: val,
                              },
                            },
                          });
                        } else {
                          setConfig({
                            ...config,
                            pricingFinancialContext: {
                              ...config.pricingFinancialContext,
                              biddingCeilingPct: val,
                            },
                          });
                        }
                      }}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Auto-Bid Window (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={currentPricing.autoBidWindowMinutes}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedCountry !== 'ALL' && config.regionalCountryPricing?.[selectedCountry]) {
                        setConfig({
                          ...config,
                          regionalCountryPricing: {
                            ...config.regionalCountryPricing,
                            [selectedCountry]: {
                              ...config.regionalCountryPricing[selectedCountry],
                              autoBidWindowMinutes: val,
                            },
                          },
                        });
                      } else {
                        setConfig({
                          ...config,
                          pricingFinancialContext: {
                            ...config.pricingFinancialContext,
                            autoBidWindowMinutes: val,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Active Regulatory Authority: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPricing.regulator}</span>
              </span>
              <button
                type="submit"
                disabled={savingConfig}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingConfig ? 'Syncing Parse Config...' : 'Save to Parse Config'}</span>
              </button>
            </div>
          </div>

          {/* Live Regional Corridor Split Simulator */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Corridor Fare &amp; Take-Rate Simulator
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                Live Dual-Currency
              </span>
            </div>

            {/* Corridor Preset Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Tested Trade Corridor / Route:
              </label>
              <select
                value={selectedCorridorPresetId}
                onChange={(e) => handleCorridorPresetChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
              >
                {REGIONAL_CORRIDOR_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {EAST_AFRICA_HUBS[p.countryCode]?.flag} [{p.countryCode}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Interactive Simulation Sliders */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Distance</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{simDistanceKm} km</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="1200"
                  step="5"
                  value={simDistanceKm}
                  onChange={(e) => setSimDistanceKm(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Cargo Weight</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{simTonnage} Tons</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={simTonnage}
                  onChange={(e) => setSimTonnage(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Duration</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{simDurationMin} min</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="1440"
                  step="5"
                  value={simDurationMin}
                  onChange={(e) => setSimDurationMin(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Surge / Priority</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {(simPriorityMultiplier * simSurgeMultiplier).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={simSurgeMultiplier}
                  onChange={(e) => setSimSurgeMultiplier(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Output Breakdown */}
            {fareSimulation && (
              <div className="space-y-3 text-xs">
                {/* Ride Preview Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Metropolitan Passenger Ride ({simDistanceKm} km · {simDurationMin} min)</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Surge: {simSurgeMultiplier.toFixed(2)}x
                    </span>
                  </div>

                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-500 dark:text-slate-400">Passenger Gross Fare</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {fareSimulation.currency} {fareSimulation.rideGrossNative.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {fareSimulation.currency !== 'ETB' && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          ≈ ETB {fareSimulation.rideGrossETB.toFixed(2)} base
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between font-mono tabular-nums pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">
                      Platform Take ({currentPricing.platformMarginPct}%) + Tax ({currentPricing.withholdingTaxPct}%)
                    </span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      -{fareSimulation.currency} {(fareSimulation.rideMarginNative + fareSimulation.rideTaxNative).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono tabular-nums pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-semibold">
                    <span className="text-emerald-700 dark:text-emerald-400">Net Driver Wallet Take-Home</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {fareSimulation.currency} {fareSimulation.rideNetNative.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Freight Haul Preview Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Heavy Freight Corridor ({simTonnage}T · {simDistanceKm} km)</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Escrow Protected
                    </span>
                  </div>

                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-500 dark:text-slate-400">Escrow Locked Gross</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {fareSimulation.currency} {Math.round(fareSimulation.truckGrossNative).toLocaleString()}
                      </span>
                      {fareSimulation.currency !== 'ETB' && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          ≈ ETB {Math.round(fareSimulation.truckGrossETB).toLocaleString()} base
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between font-mono tabular-nums pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">
                      Platform Fee ({currentPricing.platformMarginPct}%) + Statutory Tax ({currentPricing.withholdingTaxPct}%)
                    </span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      -{fareSimulation.currency} {Math.round(fareSimulation.truckMarginNative + fareSimulation.truckTaxNative).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono tabular-nums pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-semibold">
                    <span className="text-blue-700 dark:text-blue-400">Net Fleet / Carrier Payout</span>
                    <span className="text-blue-700 dark:text-blue-400 font-bold">
                      {fareSimulation.currency} {Math.round(fareSimulation.truckNetNative).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Fleet Vehicle Categories Configured ({config.availableTransportCategories.length})
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
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Regional Surge Demand &amp; Multipliers Controller</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  (Showing {filteredSurgeZones.length} of {config.regionalSurgeZones.length} East African Zones)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic dispatch algorithm monitoring real-time passenger requests vs available fleet capacity
              </p>
            </div>

            {selectedCountry !== 'ALL' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Bulk Actions ({selectedCountry}):</span>
                <button
                  type="button"
                  onClick={() => handleBulkSetCountrySurge(1.25)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors"
                >
                  Apply 1.25x Peak
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetCountrySurge(1.50)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-colors"
                >
                  Apply 1.50x Weather
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetCountrySurge(1.0)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset 1.0x</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-4">Hub &amp; City</th>
                  <th className="py-2.5 px-4">Corridor / Zone</th>
                  <th className="py-2.5 px-4">Service</th>
                  <th className="py-2.5 px-4 text-right">Demand / Supply</th>
                  <th className="py-2.5 px-4 text-right">Active Surge</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4 text-right">Multiplier Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredSurgeZones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No surge zones configured for this regional hub.
                    </td>
                  </tr>
                ) : (
                  filteredSurgeZones.map((zone) => {
                    const cCode = zone.countryCode || 'ET';
                    const hub = EAST_AFRICA_HUBS[cCode] || EAST_AFRICA_HUBS.ET;
                    const pressure = (zone.activeRequests / Math.max(1, zone.availableDrivers)).toFixed(2);
                    const isSurgeHigh = zone.currentMultiplier >= 1.4;

                    return (
                      <tr key={zone.zoneId} className="h-14 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            <span>{hub.flag}</span>
                            <span className="font-semibold">{zone.city || hub.countryName}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {zone.zoneName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {zone.zoneId} · {zone.corridor || 'Corridor Route'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              zone.serviceType === 'truck'
                                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {zone.serviceType === 'truck' ? (
                              <Truck className="w-3 h-3" />
                            ) : (
                              <Car className="w-3 h-3" />
                            )}
                            <span>{zone.serviceType}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {zone.activeRequests} req / {zone.availableDrivers} fleet
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Pressure: {pressure}x
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`font-mono font-bold text-sm px-2 py-0.5 rounded-md ${
                              isSurgeHigh
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
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
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                              zone.autoSurgeEnabled
                                ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {zone.autoSurgeEnabled ? 'Auto-Dynamic' : 'Manual Lock'}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={busyItem === zone.zoneId || zone.currentMultiplier <= 1.0}
                              onClick={() => handleAdjustSurge(zone, zone.currentMultiplier - 0.05)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300"
                              title="Decrease Surge by 0.05x"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busyItem === zone.zoneId || zone.currentMultiplier >= 3.5}
                              onClick={() => handleAdjustSurge(zone, zone.currentMultiplier + 0.05)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300"
                              title="Increase Surge by 0.05x"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {zone.currentMultiplier !== 1.0 && (
                              <button
                                type="button"
                                disabled={busyItem === zone.zoneId}
                                onClick={() => handleAdjustSurge(zone, 1.0, true)}
                                className="px-2 py-1 text-[10px] font-semibold rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                title="Reset to base 1.00x"
                              >
                                1.0x
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FEATURE FLAGS & REGIONAL ROLLOUT */}
      {activeTab === 'flags' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>FeatureFlags &amp; UnifiedAppRegistry Launcher</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      ({filteredFeatureFlags.length} flags)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Toggle feature flags and regional rollout percentages across East African mobile clients
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredFeatureFlags.map((flag) => {
                  const isBusy = busyItem === flag.key;
                  return (
                    <div
                      key={flag.key}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                              {flag.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {flag.key}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {flag.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleFlag(flag, !flag.enabled)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              flag.enabled
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      {/* Country Badges & Rollout Slider */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Target Hubs:</span>
                          {flag.countries && flag.countries.length > 0 ? (
                            flag.countries.map((c) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                              >
                                {EAST_AFRICA_HUBS[c]?.flag} {c}
                              </span>
                            ))
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              🌍 All 8 Hubs
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Rollout: <strong className="text-slate-900 dark:text-white font-mono">{flag.rolloutPercentage}%</strong>
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={flag.rolloutPercentage}
                            onChange={(e) => handleToggleFlag(flag, flag.enabled, Number(e.target.value))}
                            className="w-28 accent-cyan-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Client Role Preview */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Flutter Client Role Preview ({selectedCountry === 'ALL' ? 'Pan-East Africa' : selectedCountry})
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preview active launcher tiles exposed to Flutter apps based on role &amp; regional flags
              </p>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(['customer', 'driver', 'vehicle_owner', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPreviewRole(r)}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-md capitalize transition-colors ${
                      previewRole === r
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Handset Mockup Container */}
              <div className="p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-3 font-sans shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1">
                    <span>{activeHub ? activeHub.flag : '🌍'}</span>
                    <span className="font-semibold text-slate-200">
                      {activeHub ? activeHub.countryName : 'East Africa SuperApp'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400 uppercase">
                    Role: {previewRole}
                  </span>
                </div>

                {/* Role Specific Live Preview */}
                {previewRole === 'customer' && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ride Hailing Quote</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300">
                        AmbaLay GPS
                      </span>
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {currentPricing?.currency || 'ETB'} {fareSimulation?.rideGrossNative.toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Payment Rail: {activeHub?.gateways[0]?.name || 'Mobile Money'}
                    </p>
                  </div>
                )}

                {previewRole === 'driver' && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Driver Net Payout</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                        83% Net
                      </span>
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {currentPricing?.currency || 'ETB'} {fareSimulation?.rideNetNative.toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Tax Withheld: {currentPricing?.withholdingTaxPct ?? 2}% ({currentPricing?.regulator || 'Central Bank'})
                    </p>
                  </div>
                )}

                {previewRole === 'vehicle_owner' && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Freight Escrow Dispatch</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300">
                        Auto-Bid Active
                      </span>
                    </div>
                    <div className="text-sm font-mono font-bold text-blue-400">
                      {currentPricing?.currency || 'ETB'} {fareSimulation ? Math.round(fareSimulation.truckGrossNative).toLocaleString() : '0'}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Bidding Window: {currentPricing?.autoBidWindowMinutes ?? 20} min · Floor: {currentPricing?.biddingFloorPct ?? 85}%
                    </p>
                  </div>
                )}

                {previewRole === 'admin' && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Parse Bridge:</span>
                      <span className="text-emerald-400">CONNECTED</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Rate to ETB:</span>
                      <span className="text-cyan-300">1 {currentPricing?.currency || 'ETB'} = {currentPricing?.exchangeRateToETB ?? 1.0} ETB</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Surge Multiplier:</span>
                      <span className="text-amber-300">{simSurgeMultiplier.toFixed(2)}x</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <h4 className="text-[11px] font-semibold text-slate-300">
                    Active Tiles ({roleLauncherFlags.length}):
                  </h4>
                  {roleLauncherFlags.length === 0 ? (
                    <p className="text-[10px] text-slate-500 p-2 bg-slate-900 rounded-lg text-center">
                      No flags active for this role.
                    </p>
                  ) : (
                    roleLauncherFlags.slice(0, 4).map((rf) => (
                      <div
                        key={rf.key}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate text-slate-200">{rf.name}</span>
                        </div>
                        <span className="text-[9px] font-mono text-cyan-400 shrink-0">
                          {rf.rolloutPercentage}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
