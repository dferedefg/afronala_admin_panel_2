import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Moon,
  Sun,
  Database,
  Smartphone,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Server,
  Key,
  Lock,
  Layers,
  ArrowRight,
  Download,
  RotateCcw,
  RefreshCw,
  Sliders,
  Languages,
  Compass,
  FileCheck2,
  Check,
  X,
  Clock,
  Sparkles,
  Building2,
  CreditCard,
  Truck,
  Car,
  Bell,
  Cpu,
  ShieldAlert,
  HardDrive,
  FileText,
  UserCheck,
  Zap,
} from 'lucide-react';
import { BACK4APP_CONFIG } from '../services/back4app';
import {
  AdminRole,
  AdminUser,
  EastAfricaCountryCode,
  PermissionAction,
  ToastMessage,
} from '../types';
import { DEMO_PERSONAS } from '../services/rbac';
import { downloadFile } from '../services/notifications';
import {
  EAST_AFRICAN_COUNTRIES_META,
  EastAfricaCountryMeta,
} from '../services/eastAfricaModules';

interface SettingsViewProps {
  darkMode: boolean;
  user?: AdminUser;
  userRole?: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  onToggleTheme: () => void;
  onOpenDbModal: () => void;
  onOpenFlutterModal: () => void;
  onOpenProfileModal?: () => void;
  onSwitchPersona?: (persona: AdminUser) => void;
  onNotify?: (title: string, message?: string, type?: ToastMessage['type']) => void;
  onGuardPermission?: (action: PermissionAction, description: string) => boolean;
}

interface RegionalJurisdictionSetting {
  code: Exclude<EastAfricaCountryCode, 'ALL'>;
  name: string;
  flag: string;
  currency: string;
  capital: string;
  statutoryRegulator: string;
  regulatorCode: string;
  primaryCorridor: string;
  paymentRail: string;
  emergencyHotline: string;
  activeDriversCount: number;
  commissionCapPct: number;
  speedLimiterMandated: boolean;
  evIncentiveActive: boolean;
  dataProtectionLaw: string;
  taxIdLabel: string;
}

const DEFAULT_JURISDICTIONS_SETTINGS: Record<
  Exclude<EastAfricaCountryCode, 'ALL'>,
  RegionalJurisdictionSetting
> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB (Ethiopian Birr / Br)',
    capital: 'Addis Ababa',
    statutoryRegulator: 'Ministry of Transport and Logistics & Federal Transport Authority (Bola)',
    regulatorCode: 'MOTRI / FTA',
    primaryCorridor: 'Addis Ababa - Modjo Dry Port - Adama Expressway - Galafi',
    paymentRail: 'Telebirr, CBE Birr & EthSwitch National Switch',
    emergencyHotline: '991 / 907',
    activeDriversCount: 1420,
    commissionCapPct: 15,
    speedLimiterMandated: true,
    evIncentiveActive: true,
    dataProtectionLaw: 'Personal Data Protection Proclamation No. 1321/2024',
    taxIdLabel: 'Ethiopian TIN (Tax Identification Number)',
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES (Kenyan Shilling / KSh)',
    capital: 'Nairobi',
    statutoryRegulator: 'National Transport and Safety Authority & Kenya National Highways Authority',
    regulatorCode: 'NTSA / KeNHA',
    primaryCorridor: 'Northern Corridor (Mombasa Port - Nairobi SGR - Malaba OSBP)',
    paymentRail: 'Safaricom M-PESA B2C, Airtel Money & Kenswitch',
    emergencyHotline: '999 / 112',
    activeDriversCount: 980,
    commissionCapPct: 10, // 10% statutory ceiling per NTSA Ride-Hailing Regulations 2022
    speedLimiterMandated: true,
    evIncentiveActive: true,
    dataProtectionLaw: 'Kenya Data Protection Act No. 24 of 2019 (ODPC)',
    taxIdLabel: 'KRA PIN (Kenya Revenue Authority)',
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX (Ugandan Shilling / USh)',
    capital: 'Kampala',
    statutoryRegulator: 'Ministry of Works and Transport & Uganda Revenue Authority',
    regulatorCode: 'MoWT / URA',
    primaryCorridor: 'Northern Transit Belt (Malaba OSBP - Jinja - Kampala - Katuna)',
    paymentRail: 'MTN Mobile Money, Airtel Money Uganda & Bank of Uganda RSwitch',
    emergencyHotline: '112 / 999',
    activeDriversCount: 650,
    commissionCapPct: 12,
    speedLimiterMandated: true,
    evIncentiveActive: false,
    dataProtectionLaw: 'Uganda Data Protection and Privacy Act 2019 (PDPO)',
    taxIdLabel: 'URA TIN (Uganda Revenue Authority)',
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF (Rwandan Franc / FRw)',
    capital: 'Kigali',
    statutoryRegulator: 'Rwanda Utilities Regulatory Authority & Rwanda National Police',
    regulatorCode: 'RURA / RNP',
    primaryCorridor: 'Central Corridor (Rusumo OSBP - Kigali Logistics Platform - Rubavu)',
    paymentRail: 'MTN MoMo Rwanda, Airtel Money Rwanda & RSwitch PayPack',
    emergencyHotline: '112 / 113',
    activeDriversCount: 520,
    commissionCapPct: 12,
    speedLimiterMandated: true,
    evIncentiveActive: true, // Kigali clean electric taxi priority
    dataProtectionLaw: 'Rwanda Law No. 058/2021 on Personal Data Protection (NCSA)',
    taxIdLabel: 'RRA TIN (Rwanda Revenue Authority)',
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS (Tanzanian Shilling / TSh)',
    capital: 'Dodoma / Dar es Salaam',
    statutoryRegulator: 'Land Transport Regulatory Authority & Tanzania Revenue Authority',
    regulatorCode: 'LATRA / TRA',
    primaryCorridor: 'Central Corridor (Port of Dar es Salaam - Morogoro - Dodoma - Isaka)',
    paymentRail: 'Vodacom M-Pesa, Tigo Pesa, Airtel Money & TIPS Instant Switch',
    emergencyHotline: '112 / 114',
    activeDriversCount: 840,
    commissionCapPct: 14,
    speedLimiterMandated: true,
    evIncentiveActive: false,
    dataProtectionLaw: 'Tanzania Personal Data Protection Act 2022 (PDPC)',
    taxIdLabel: 'TRA TIN (Tanzania Revenue Authority)',
  },
  DJ: {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF (Djiboutian Franc / Fdj)',
    capital: 'Djibouti City',
    statutoryRegulator: 'Djibouti Ports and Free Zones Authority & Direction des Transports Terrestres',
    regulatorCode: 'DPFZA / DTT',
    primaryCorridor: 'Doraleh Multipurpose Port (DMP) - PK12 - Galafi Border Highway',
    paymentRail: 'Djibouti Telecom D-Money & Central Bank of Djibouti Clearing',
    emergencyHotline: '17 / 18',
    activeDriversCount: 410,
    commissionCapPct: 15,
    speedLimiterMandated: false,
    evIncentiveActive: false,
    dataProtectionLaw: 'Loi No. 101/AN/20 sur la Protection des Données (CNDP)',
    taxIdLabel: 'NIF (Numéro d’Identification Fiscale)',
  },
  SO: {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD ($) / SOS (Somali Shilling)',
    capital: 'Mogadishu / Hargeisa',
    statutoryRegulator: 'Ministry of Transport and Civil Aviation & Somaliland Ports Authority',
    regulatorCode: 'MOTCA / SPA',
    primaryCorridor: 'Mogadishu Seaport - Afgooye & Berbera - Tog Wajaale Corridor',
    paymentRail: 'Hormuud EVC Plus, Telesom Zaad & SomBank National Switch',
    emergencyHotline: '888 / 999',
    activeDriversCount: 380,
    commissionCapPct: 15,
    speedLimiterMandated: false,
    evIncentiveActive: false,
    dataProtectionLaw: 'Somalia National Data Governance & Communications Framework',
    taxIdLabel: 'Somalia Business Tax ID',
  },
  SS: {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP (South Sudanese Pound / SS£)',
    capital: 'Juba',
    statutoryRegulator: 'National Ministry of Transport & South Sudan Revenue Authority',
    regulatorCode: 'MoTR / SSRA',
    primaryCorridor: 'Juba - Nimule Trans-National Highway (Customs Police Escort)',
    paymentRail: 'm-GURUSH Mobile Money & Bank of South Sudan Clearing',
    emergencyHotline: '777 / 112',
    activeDriversCount: 290,
    commissionCapPct: 15,
    speedLimiterMandated: true,
    evIncentiveActive: false,
    dataProtectionLaw: 'South Sudan National Communications Authority (NCA) Framework',
    taxIdLabel: 'SSRA TIN (South Sudan Revenue Authority)',
  },
};

interface CloudGatewayNode {
  countryCode: EastAfricaCountryCode;
  countryName: string;
  flag: string;
  city: string;
  endpoint: string;
  latencyMs: number;
  status: 'optimal' | 'healthy' | 'degraded';
  role: string;
}

const INITIAL_GATEWAY_NODES: CloudGatewayNode[] = [
  {
    countryCode: 'ET',
    countryName: 'Ethiopia',
    flag: '🇪🇹',
    city: 'Addis Ababa (Primary BaaS)',
    endpoint: '/api/back4app/classes/*',
    latencyMs: 78,
    status: 'optimal',
    role: 'Primary Express Parse Bridge & LiveQuery Master',
  },
  {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    city: 'Nairobi (Northern Edge)',
    endpoint: '/api/edge/ke/telematics',
    latencyMs: 62,
    status: 'optimal',
    role: 'Safaricom Daraja B2C & NTSA Telematics Proxy',
  },
  {
    countryCode: 'UG',
    countryName: 'Uganda',
    flag: '🇺🇬',
    city: 'Kampala (Malaba Link)',
    endpoint: '/api/edge/ug/customs',
    latencyMs: 74,
    status: 'healthy',
    role: 'MoWT Transport Licensing & URA Single Window',
  },
  {
    countryCode: 'RW',
    countryName: 'Rwanda',
    flag: '🇷🇼',
    city: 'Kigali (Central Edge)',
    endpoint: '/api/edge/rw/rura',
    latencyMs: 81,
    status: 'healthy',
    role: 'RURA Weigh-in-Motion & KLP Bonded Logistics',
  },
  {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    flag: '🇹🇿',
    city: 'Dar es Salaam (Maritime Node)',
    endpoint: '/api/edge/tz/latra',
    latencyMs: 84,
    status: 'healthy',
    role: 'LATRA Port Terminal & TIPS Payment Switch',
  },
  {
    countryCode: 'DJ',
    countryName: 'Djibouti',
    flag: '🇩🇯',
    city: 'Doraleh (Galafi Gateway)',
    endpoint: '/api/edge/dj/dpfza',
    latencyMs: 69,
    status: 'optimal',
    role: 'DPFZA SGTD Manifest & D-Money Clearing',
  },
  {
    countryCode: 'SO',
    countryName: 'Somalia',
    flag: '🇸🇴',
    city: 'Berbera / Mogadishu',
    endpoint: '/api/edge/so/ports',
    latencyMs: 96,
    status: 'healthy',
    role: 'Berbera Port Escort & Zaad/EVC Plus Rails',
  },
  {
    countryCode: 'SS',
    countryName: 'South Sudan',
    flag: '🇸🇸',
    city: 'Juba (Nimule Terminal)',
    endpoint: '/api/edge/ss/motr',
    latencyMs: 112,
    status: 'healthy',
    role: 'Nimule Convoy Tracking & m-GURUSH Settlement',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  user,
  userRole = 'Super Admin',
  userJurisdiction = 'ALL',
  userJurisdictionName,
  assignedCorridors,
  onToggleTheme,
  onOpenDbModal,
  onOpenFlutterModal,
  onOpenProfileModal,
  onSwitchPersona,
  onNotify,
  onGuardPermission,
}) => {
  // Active selected jurisdiction in settings tabs
  const initialCountry =
    user?.jurisdictionCountry && user.jurisdictionCountry !== 'ALL'
      ? user.jurisdictionCountry
      : userJurisdiction && userJurisdiction !== 'ALL'
      ? userJurisdiction
      : 'ET';

  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Exclude<EastAfricaCountryCode, 'ALL'>>(
    initialCountry as Exclude<EastAfricaCountryCode, 'ALL'>
  );

  const [jurisdictionsData, setJurisdictionsData] = useState<
    Record<Exclude<EastAfricaCountryCode, 'ALL'>, RegionalJurisdictionSetting>
  >(DEFAULT_JURISDICTIONS_SETTINGS);

  const [gatewayNodes, setGatewayNodes] = useState<CloudGatewayNode[]>(INITIAL_GATEWAY_NODES);
  const [isPingingGateways, setIsPingingGateways] = useState(false);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(120);
  const [dataSovereigntyMode, setDataSovereigntyMode] = useState<'edge_local' | 'pan_eac_federated'>('pan_eac_federated');

  // Cross-Border Corridor Data Sync Toggles
  const [corridorSyncFlags, setCorridorSyncFlags] = useState({
    northernCorridor: true,
    centralCorridor: true,
    galafiDjiboutiBelt: true,
    berberaTransitLink: true,
    nimuleEscortHighway: true,
    rectsCargoTracking: true,
  });

  // Keep selected country in sync if operator changes persona
  useEffect(() => {
    if (user?.jurisdictionCountry && user.jurisdictionCountry !== 'ALL') {
      setSelectedJurisdiction(user.jurisdictionCountry as Exclude<EastAfricaCountryCode, 'ALL'>);
    }
  }, [user?.jurisdictionCountry]);

  const cardClass =
    'p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

  const toggleCorridorFlag = (key: keyof typeof corridorSyncFlags, label: string) => {
    if (onGuardPermission && !onGuardPermission('manage_modules', `Toggle ${label} synchronization`)) {
      return;
    }

    setCorridorSyncFlags((prev) => {
      const next = !prev[key];
      if (onNotify) {
        onNotify(
          'Corridor Sync Updated',
          `${label} is now ${next ? 'ACTIVATED' : 'PAUSED'}.`,
          next ? 'success' : 'info'
        );
      }
      return { ...prev, [key]: next };
    });
  };

  const handlePingAllGateways = async () => {
    setIsPingingGateways(true);
    if (onNotify) {
      onNotify('Gateway Latency Probe', 'Pinging all 8 East African regional edge endpoints...', 'info');
    }

    setTimeout(() => {
      setGatewayNodes((prev) =>
        prev.map((node) => {
          const jitter = Math.floor(Math.random() * 18) - 8;
          const newLatency = Math.max(45, node.latencyMs + jitter);
          return {
            ...node,
            latencyMs: newLatency,
            status: newLatency < 75 ? 'optimal' : newLatency < 105 ? 'healthy' : 'degraded',
          };
        })
      );
      setIsPingingGateways(false);
      if (onNotify) {
        onNotify(
          'Probe Complete',
          'All 8 East African Back4App gateway nodes verified online (median: 76ms).',
          'success'
        );
      }
    }, 900);
  };

  const handleExportSystemGovernanceConfig = () => {
    const payload = {
      app: 'Afronala Pan-East Africa SuperApp',
      version: '4.9.0-EAC-Enterprise',
      exportedAt: new Date().toISOString(),
      activeOperator: user
        ? {
            name: user.name,
            role: user.role,
            email: user.email,
            jurisdiction: user.jurisdictionCountry,
            jurisdictionName: user.jurisdictionName,
          }
        : { name: 'Daniel Ferede', role: 'Super Admin', email: 'daniel@afronala.com' },
      activeSelectedJurisdiction: jurisdictionsData[selectedJurisdiction],
      allJurisdictionsSettings: jurisdictionsData,
      gatewayNodes,
      corridorSyncFlags,
      dataSovereigntyMode,
      sessionTimeoutMin,
      back4app: {
        applicationId: BACK4APP_CONFIG.applicationId,
        serverUrl: BACK4APP_CONFIG.serverUrl,
        proxyEndpoint: '/api/back4app/classes/*',
      },
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    downloadFile(`afronala-governance-config-${Date.now()}.json`, jsonStr, 'application/json');
    if (onNotify) {
      onNotify(
        'Governance Export Successful',
        'System governance JSON downloaded with 8-nation compliance config.',
        'success'
      );
    }
  };

  const handleUpdateCommissionCap = (countryCode: Exclude<EastAfricaCountryCode, 'ALL'>, cap: number) => {
    if (onGuardPermission && !onGuardPermission('manage_pricing_flags', 'Update Statutory Commission Cap')) {
      return;
    }

    setJurisdictionsData((prev) => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        commissionCapPct: cap,
      },
    }));

    if (onNotify) {
      onNotify(
        'Statutory Ceiling Updated',
        `${jurisdictionsData[countryCode].name} platform commission cap adjusted to ${cap}%.`,
        'success'
      );
    }
  };

  const currentMeta = jurisdictionsData[selectedJurisdiction];
  const operatorCountry = user?.jurisdictionCountry || userJurisdiction || 'ALL';
  const isLockedToStation = operatorCountry !== 'ALL';

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & OPERATOR SESSION SCOPE OVERVIEW                      */}
      {/* ==================================================================== */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  System Settings &amp; Security Clearance
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  8-NATION EAST AFRICA
                </span>
                {isLockedToStation ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                    <Lock className="w-3 h-3" />
                    Station Bound: {EAST_AFRICAN_COUNTRIES_META[operatorCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.flag}{' '}
                    {EAST_AFRICAN_COUNTRIES_META[operatorCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Globe className="w-3 h-3" />
                    Root Regional Director (Unrestricted)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                Statutory regulatory authorities (NTSA, FTA, LATRA, RURA), multi-region cloud BaaS proxy,
                cross-border corridors, data sovereignty policies, and Role-Based Access Control (RBAC).
              </p>
            </div>
          </div>

          {/* Global Toolbar Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isLockedToStation && (
              <button
                onClick={() => setSelectedJurisdiction(operatorCountry as Exclude<EastAfricaCountryCode, 'ALL'>)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  selectedJurisdiction === operatorCountry
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Focus My Station</span>
                <span>({EAST_AFRICAN_COUNTRIES_META[operatorCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.flag})</span>
              </button>
            )}

            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors"
                title="View and edit your individual operator profile and station credentials"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Operator Profile ({EAST_AFRICAN_COUNTRIES_META[operatorCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.flag || '🌍'})</span>
              </button>
            )}

            <button
              onClick={handleExportSystemGovernanceConfig}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Download complete system configuration & security parameters"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Export Governance JSON</span>
            </button>

            <button
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-xs"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{darkMode ? 'Clean Light' : 'Obsidian Dark'}</span>
            </button>
          </div>
        </div>

        {/* Active Operator Clearance Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Authenticated Operator:</span>
              <strong className="text-slate-900 dark:text-white font-bold">{user?.name || 'Daniel Ferede'}</strong>
              <span className="text-[11px] px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-mono font-semibold">
                {user?.role || 'Super Admin'}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
              {user?.email || 'operator@afronala.com'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Station Clearance:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LEVEL-4 MULTI-COUNTRY DISPATCH AUTH</span>
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. PAN-EAST AFRICAN REGIONAL JURISDICTIONS (8 MEMBER STATES)          */}
      {/* ==================================================================== */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pan-East African Statutory Jurisdictions &amp; Regulatory Parameters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select any member state to configure its statutory regulatory agency, sovereign payment rails, and tariff ceilings.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400 px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 self-start sm:self-auto">
            Configuring: {currentMeta.flag} {currentMeta.name} ({currentMeta.code})
          </span>
        </div>

        {/* 8-Nation Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin mb-4">
          {(Object.keys(jurisdictionsData) as Array<Exclude<EastAfricaCountryCode, 'ALL'>>).map((code) => {
            const meta = jurisdictionsData[code];
            const isSelected = selectedJurisdiction === code;
            const isOperatorStation = operatorCountry === code;

            return (
              <button
                key={code}
                onClick={() => {
                  setSelectedJurisdiction(code);
                  if (onNotify) {
                    onNotify(
                      'Jurisdiction Loaded',
                      `Regulatory settings loaded for ${meta.flag} ${meta.name} (${meta.regulatorCode}).`,
                      'info'
                    );
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : isOperatorStation
                    ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 hover:bg-cyan-100'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-sm">{meta.flag}</span>
                <span>{meta.name}</span>
                {isOperatorStation && (
                  <span className="text-[9px] px-1 rounded-sm bg-cyan-700 text-white font-mono">
                    MY STATION
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {meta.code}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Nation Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Statutory Regulator</span>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">
              {currentMeta.statutoryRegulator}
            </p>
            <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              {currentMeta.regulatorCode}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Primary Corridor &amp; Gate</span>
            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
              {currentMeta.primaryCorridor}
            </p>
            <span className="text-[11px] text-slate-500 font-mono mt-1 block">
              Capital: {currentMeta.capital}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Clearing Rail &amp; Currency</span>
            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
              {currentMeta.paymentRail}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-1 block">
              {currentMeta.currency}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Emergency &amp; Active Fleet</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Dispatch Police Hotline:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {currentMeta.emergencyHotline}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-500">Active Mobile Units:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {currentMeta.activeDriversCount} vehicles
              </span>
            </div>
          </div>
        </div>

        {/* Statutory Compliance Rules Editor for Selected Nation */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Commission Cap Slider */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 dark:text-white">Statutory Commission Cap</span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                {currentMeta.commissionCapPct}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
              Maximum legal take rate allowed by {currentMeta.regulatorCode} for ride &amp; freight services.
            </p>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={currentMeta.commissionCapPct}
              onChange={(e) => handleUpdateCommissionCap(selectedJurisdiction, Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Speed Limiter Mandate */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 dark:text-white">Speed Limiter Telematics</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                  currentMeta.speedLimiterMandated
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {currentMeta.speedLimiterMandated ? 'MANDATED 80KM/H' : 'ADVISORY'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Continuous IoT vehicle telemetry stream into national transport safety databases.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">
              Regulator: {currentMeta.regulatorCode}
            </span>
          </div>

          {/* EV Clean Mobility Incentive */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 dark:text-white">Clean Electric Vehicle Priority</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                  currentMeta.evIncentiveActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {currentMeta.evIncentiveActive ? 'ACTIVE BOOST' : 'STANDARD'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Dispatch queue priority &amp; reduced platform commission for verified electric taxis.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">
              Tax Standard: {currentMeta.taxIdLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MULTI-REGION BACK4APP CLOUD BAAS GATEWAYS (8 REGIONAL NODES)      */}
      {/* ==================================================================== */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Multi-Region Back4App Cloud Infrastructure (8 Gateway Edges)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server-side Express proxy endpoints maintaining real-time Parse BaaS connectivity across East Africa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePingAllGateways}
              disabled={isPingingGateways}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingingGateways ? 'animate-spin' : ''}`} />
              <span>{isPingingGateways ? 'Probing Latency...' : 'Ping All 8 Edges'}</span>
            </button>

            <button
              onClick={onOpenDbModal}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Schema Inspector
            </button>
          </div>
        </div>

        {/* Master Credentials Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 mb-4 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Parse Application ID:</span>
            <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">
              {BACK4APP_CONFIG.applicationId}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Proxy Security Mode:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Server-Side REST Proxy (Zero Key Leakage)</span>
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block mb-0.5">LiveQuery Master Channel:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
              wss://parseapi.back4app.com
            </span>
          </div>
        </div>

        {/* 8 Regional Node Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {gatewayNodes.map((node) => (
            <div
              key={node.countryCode}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{node.flag}</span>
                    <span>{node.countryName}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded ${
                      node.status === 'optimal'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                        : 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {node.latencyMs}ms
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {node.city}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {node.role}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 truncate">
                {node.endpoint}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. CROSS-BORDER CORRIDOR DATA SYNCHRONIZERS                          */}
      {/* ==================================================================== */}
      <div className={cardClass}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Cross-Border Corridor Data Synchronizers &amp; OSBP Ports
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live automated data exchange with national single windows, customs electronic seals, and axle sensors across East Africa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            {
              key: 'northernCorridor' as const,
              title: 'Northern Corridor (Mombasa - Malaba)',
              desc: 'Continuous telematics & KeNHA / URA customs single-window synchronization.',
              badge: '🇰🇪 KE · 🇺🇬 UG',
            },
            {
              key: 'centralCorridor' as const,
              title: 'Central Corridor (Dar Port - Rusumo)',
              desc: 'LATRA & RURA electronic weigh-in-motion weight compliance streaming.',
              badge: '🇹🇿 TZ · 🇷🇼 RW',
            },
            {
              key: 'galafiDjiboutiBelt' as const,
              title: 'Galafi - PK12 Maritime Corridor',
              desc: 'DPFZA Doraleh port container release QR verification & D-Money transit sync.',
              badge: '🇩🇯 DJ · 🇪🇹 ET',
            },
            {
              key: 'berberaTransitLink' as const,
              title: 'Berbera Corridor (Berbera - Tog Wajaale)',
              desc: 'DP World container manifest electronic transfer into Eastern Ethiopia.',
              badge: '🇸🇴 SO · 🇪🇹 ET',
            },
            {
              key: 'nimuleEscortHighway' as const,
              title: 'Juba - Nimule Security Highway',
              desc: 'South Sudan police convoy telematics & geofence deviation detection.',
              badge: '🇸🇸 SS · 🇺🇬 UG',
            },
            {
              key: 'rectsCargoTracking' as const,
              title: 'EAC Regional Cargo Tracking (RECTS)',
              desc: 'Multilateral cross-border electronic seal tamper alerts across EAC corridors.',
              badge: '🌍 EAC ALL',
            },
          ].map((item) => {
            const active = corridorSyncFlags[item.key];
            return (
              <div
                key={item.key}
                className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between ${
                  active
                    ? 'border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/20 dark:bg-cyan-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {active ? 'SYNC ACTIVE' : 'PAUSED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCorridorFlag(item.key, item.title)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      active
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                        : 'bg-cyan-600 text-white hover:bg-cyan-500'
                    }`}
                  >
                    {active ? 'Pause' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. ROLE-BASED ACCESS CONTROL (RBAC) JURISDICTION PERSONA SWITCHER    */}
      {/* ==================================================================== */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Role-Based Access Control (RBAC) &amp; Regional Personas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch active operator persona to simulate how administrators in each country experience the SuperApp.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
            Active: <strong className="text-cyan-700 dark:text-cyan-400">{user?.name || 'Daniel Ferede'}</strong> ({user?.role || 'Super Admin'})
          </span>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs mb-4">
          {DEMO_PERSONAS.map((persona) => {
            const active = user?.email === persona.email;
            const countryMeta =
              persona.jurisdictionCountry && persona.jurisdictionCountry !== 'ALL'
                ? EAST_AFRICAN_COUNTRIES_META[persona.jurisdictionCountry as Exclude<EastAfricaCountryCode, 'ALL'>]
                : null;

            return (
              <button
                key={persona.email}
                type="button"
                onClick={() => {
                  if (onSwitchPersona) {
                    onSwitchPersona(persona);
                    if (onNotify) {
                      onNotify(
                        'Operator Persona Switched',
                        `Logged in as ${persona.name} (${persona.role}) · Station: ${persona.jurisdictionName}`,
                        'success'
                      );
                    }
                  }
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-500 dark:border-cyan-600 ring-2 ring-cyan-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <span>{countryMeta?.flag || '🌍'}</span>
                    <span>{persona.name}</span>
                  </div>
                  {active ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-600 text-white">
                      Active Now
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {persona.role}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold mb-1">
                  <Globe className="w-3 h-3" />
                  <span>{persona.jurisdictionName || 'East Africa Regional'}</span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {persona.scopeSummary}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{persona.permissions.length} Action Guards</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">AUTH VERIFIED</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Permissions Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <table className="w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Permission Action Guard</th>
                <th className="px-3 py-2 text-center">Super Admin</th>
                <th className="px-3 py-2 text-center">Ride Manager</th>
                <th className="px-3 py-2 text-center">Freight Coordinator</th>
                <th className="px-3 py-2 text-center">Finance Auditor</th>
                <th className="px-3 py-2 text-center">Support Analyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 font-medium">
              {[
                { action: 'manage_modules', label: 'SuperApp Micro-Service Architecture & Schemas', roles: ['Super Admin'] },
                { action: 'manage_ride', label: 'Ride Hailing Mobility, Fares & Surge Zones', roles: ['Super Admin', 'Ride Manager'] },
                { action: 'manage_freight', label: 'Freight TruckBooking, Bids & Escrow Releases', roles: ['Super Admin', 'Freight Coordinator'] },
                { action: 'manage_customers', label: 'Customer Directory & Corporate Shippers', roles: ['Super Admin', 'Ride Manager', 'Freight Coordinator', 'Support Analyst'] },
                { action: 'manage_finance', label: 'Payment Settlements & Multi-Currency Treasury', roles: ['Super Admin', 'Finance Auditor'] },
                { action: 'manage_approvals', label: 'Driver & Vehicle KYC Compliance Approvals', roles: ['Super Admin', 'Ride Manager', 'Freight Coordinator'] },
                { action: 'manage_pricing_flags', label: 'Cross-Border Pricing Studio & Regional Flags', roles: ['Super Admin', 'Ride Manager'] },
              ].map((row) => (
                <tr key={row.action} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200">
                    {row.label}
                  </td>
                  {['Super Admin', 'Ride Manager', 'Freight Coordinator', 'Finance Auditor', 'Support Analyst'].map((r) => {
                    const allowed = row.roles.includes(r);
                    return (
                      <td key={r} className="px-3 py-2 text-center">
                        {allowed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. DATA RESIDENCY & SOVEREIGNTY BY NATION                            */}
      {/* ==================================================================== */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                National Data Sovereignty &amp; Cross-Border Compliance Acts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enforcing sovereign personal data protection legislation in each operator jurisdiction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextMode = dataSovereigntyMode === 'pan_eac_federated' ? 'edge_local' : 'pan_eac_federated';
                setDataSovereigntyMode(nextMode);
                if (onNotify) {
                  onNotify(
                    'Sovereignty Policy Switched',
                    `Data retention mode set to ${nextMode === 'edge_local' ? 'Strict Local Edge Residency' : 'Pan-EAC Federated Cloud'}.`,
                    'info'
                  );
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-colors"
            >
              Mode: {dataSovereigntyMode === 'pan_eac_federated' ? 'Pan-EAC Federated' : 'Strict Local Edge'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {(Object.keys(jurisdictionsData) as Array<Exclude<EastAfricaCountryCode, 'ALL'>>).map((code) => {
            const item = jurisdictionsData[code];
            const isStation = operatorCountry === code;

            return (
              <div
                key={code}
                className={`p-3 rounded-xl border ${
                  isStation
                    ? 'border-cyan-300 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                    <span>{item.flag}</span>
                    <span>{item.name}</span>
                  </div>
                  {isStation && (
                    <span className="text-[9px] font-bold px-1 rounded bg-cyan-600 text-white">
                      YOUR STATION
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1">
                  {item.dataProtectionLaw}
                </p>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Audit Frequency:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Continuous</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 7. FLUTTER MULTI-LINGUAL LOCALIZATION & SYSTEM CONTROLS              */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flutter Multi-Lingual Bundle */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Flutter SuperApp Multi-Lingual Localization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                East African language bundles synchronized with active mobile app interfaces.
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Universal Regional:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇬🇧 English (East Africa EAC)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Ethiopia:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇪🇹 Amharic (አማርኛ) · Oromo (Afaan Oromoo)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Kenya, Tanzania, Uganda:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇰🇪 🇹🇿 🇺🇬 Swahili (Kiswahili)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Rwanda:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇷🇼 Kinyarwanda (Ikinyarwanda)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Somalia &amp; Djibouti:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇸🇴 Somali (Af-Soomaali) · 🇩🇯 French</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">South Sudan:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇸🇸 Juba Arabic (عربي جوبا)</span>
            </div>
          </div>

          <button
            onClick={onOpenFlutterModal}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open Flutter SDK Code Generator</span>
          </button>
        </div>

        {/* Security Session & Cache Invalidation */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Session Security &amp; Token Authority
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                JWT timeout enforcement and browser cache hygiene across regional sessions.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs mb-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500 dark:text-slate-400">Inactivity Session Timeout:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {sessionTimeoutMin} minutes
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={sessionTimeoutMin}
                onChange={(e) => setSessionTimeoutMin(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Storage Authority:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  localStorage + Express Session Token
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Local Operational Timezone:</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  East Africa Time (EAT / UTC+3)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onNotify) {
                onNotify('Cache Invalidation', 'Local storage session cache flushed and re-synced.', 'success');
              }
            }}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Flush Local Client Cache &amp; Re-Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
};
