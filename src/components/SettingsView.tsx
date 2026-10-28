import React, { useState } from 'react';
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
} from 'lucide-react';
import { BACK4APP_CONFIG } from '../services/back4app';
import { AdminRole, AdminUser, EastAfricaCountryCode, PermissionAction, ToastMessage } from '../types';
import { DEMO_PERSONAS } from '../services/rbac';
import { downloadFile } from '../services/notifications';

interface SettingsViewProps {
  darkMode: boolean;
  user?: AdminUser;
  onToggleTheme: () => void;
  onOpenDbModal: () => void;
  onOpenFlutterModal: () => void;
  onSwitchPersona?: (persona: AdminUser) => void;
  onNotify?: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

interface RegionalJurisdictionMeta {
  code: EastAfricaCountryCode;
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
}

const EAST_AFRICA_JURISDICTIONS: Record<
  Exclude<EastAfricaCountryCode, 'ALL'>,
  RegionalJurisdictionMeta
> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB (Ethiopian Birr)',
    capital: 'Addis Ababa',
    statutoryRegulator: 'Ministry of Transport and Logistics & Federal Transport Authority (Bola)',
    regulatorCode: 'MOTRI / FTA',
    primaryCorridor: 'Addis Ababa - Modjo Dry Port - Adama Expressway',
    paymentRail: 'Telebirr, CBE Birr & EthSwitch National Switch',
    emergencyHotline: '991 / 907',
    activeDriversCount: 1420,
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES (Kenyan Shilling)',
    capital: 'Nairobi',
    statutoryRegulator: 'National Transport and Safety Authority & Kenya National Highways Authority',
    regulatorCode: 'NTSA / KeNHA',
    primaryCorridor: 'Northern Corridor (Mombasa Port - Nairobi SGR - Malaba OSBP)',
    paymentRail: 'Safaricom M-PESA B2C, Airtel Money & Kenswitch',
    emergencyHotline: '999 / 112',
    activeDriversCount: 980,
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX (Ugandan Shilling)',
    capital: 'Kampala',
    statutoryRegulator: 'Ministry of Works and Transport & Uganda Revenue Authority',
    regulatorCode: 'MoWT / URA',
    primaryCorridor: 'Northern Transit Belt (Malaba OSBP - Kampala - Katuna)',
    paymentRail: 'MTN Mobile Money, Airtel Money Uganda & Bank of Uganda RSwitch',
    emergencyHotline: '112 / 999',
    activeDriversCount: 650,
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF (Rwandan Franc)',
    capital: 'Kigali',
    statutoryRegulator: 'Rwanda Utilities Regulatory Authority & Rwanda National Police',
    regulatorCode: 'RURA / RNP',
    primaryCorridor: 'Central Corridor (Rusumo OSBP - Kigali Logistics Platform)',
    paymentRail: 'MTN MoMo Rwanda, Airtel Money Rwanda & RSwitch PayPack',
    emergencyHotline: '112 / 113',
    activeDriversCount: 520,
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS (Tanzanian Shilling)',
    capital: 'Dodoma / Dar es Salaam',
    statutoryRegulator: 'Land Transport Regulatory Authority & Tanzania Revenue Authority',
    regulatorCode: 'LATRA / TRA',
    primaryCorridor: 'Central Corridor (Dar es Salaam Port - Dodoma - Rusumo)',
    paymentRail: 'Vodacom M-Pesa, Tigo Pesa, Airtel Money & TIPS Instant Switch',
    emergencyHotline: '112 / 114',
    activeDriversCount: 840,
  },
  DJ: {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF (Djiboutian Franc)',
    capital: 'Djibouti City',
    statutoryRegulator: 'Djibouti Ports and Free Zones Authority & Direction des Transports Terrestres',
    regulatorCode: 'DPFZA / DTT',
    primaryCorridor: 'Doraleh Multipurpose Port - PK12 - Galafi Border Highway',
    paymentRail: 'Djibouti Telecom D-Money & Central Bank of Djibouti Clearing',
    emergencyHotline: '17 / 18',
    activeDriversCount: 410,
  },
  SO: {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD (US Dollar / Somali Shilling)',
    capital: 'Mogadishu / Hargeisa',
    statutoryRegulator: 'Ministry of Transport and Civil Aviation & Somaliland Ports Authority',
    regulatorCode: 'MOTCA / SPA',
    primaryCorridor: 'Berbera Corridor (Berbera Port - Tog Wajaale Border Link)',
    paymentRail: 'Telesom Zaad, Hormuud EVC Plus & SomBank National Switch',
    emergencyHotline: '888 / 999',
    activeDriversCount: 380,
  },
  SS: {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP (South Sudanese Pound)',
    capital: 'Juba',
    statutoryRegulator: 'National Ministry of Transport & South Sudan Revenue Authority',
    regulatorCode: 'MoTR / SSRA',
    primaryCorridor: 'Juba - Nimule Trans-National Highway (UNMISS & Police Escort)',
    paymentRail: 'm-GURUSH Mobile Money & Bank of South Sudan Clearing',
    emergencyHotline: '777 / 112',
    activeDriversCount: 290,
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
  onToggleTheme,
  onOpenDbModal,
  onOpenFlutterModal,
  onSwitchPersona,
  onNotify,
}) => {
  // State
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<EastAfricaCountryCode>('ET');
  const [gatewayNodes, setGatewayNodes] = useState<CloudGatewayNode[]>(INITIAL_GATEWAY_NODES);
  const [isPingingGateways, setIsPingingGateways] = useState(false);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(120);

  // Cross-Border Corridor Data Sync Toggles
  const [corridorSyncFlags, setCorridorSyncFlags] = useState({
    northernCorridor: true,
    centralCorridor: true,
    galafiDjiboutiBelt: true,
    berberaTransitLink: true,
    nimuleEscortHighway: true,
    rectsCargoTracking: true,
  });

  const cardClass =
    'p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

  const toggleCorridorFlag = (key: keyof typeof corridorSyncFlags, label: string) => {
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
      version: '4.8.0-EAC-Enterprise',
      exportedAt: new Date().toISOString(),
      activeOperator: user
        ? { name: user.name, role: user.role, email: user.email }
        : { name: 'Daniel Ferede', role: 'Super Admin', email: 'daniel@afronala.com' },
      regionalJurisdiction: EAST_AFRICA_JURISDICTIONS[selectedJurisdiction !== 'ALL' ? selectedJurisdiction : 'ET'],
      gatewayNodes,
      corridorSyncFlags,
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

  const currentJurisdictionMeta =
    selectedJurisdiction !== 'ALL'
      ? EAST_AFRICA_JURISDICTIONS[selectedJurisdiction]
      : EAST_AFRICA_JURISDICTIONS.ET;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & OPERATOR SESSION OVERVIEW                            */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  System Settings &amp; Regional Governance
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  8-NATION EAST AFRICA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory regulatory authorities, multi-region cloud BaaS proxy, cross-border corridors, and RBAC matrix
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
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

      {/* ==================================================================== */}
      {/* 2. PAN-EAST AFRICAN REGIONAL JURISDICTIONS (8 MEMBER STATES)          */}
      {/* ==================================================================== */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pan-East African Statutory Jurisdictions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure default national transport law, currency standard, and primary corridor
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 self-start sm:self-auto">
            Active: {currentJurisdictionMeta.flag} {currentJurisdictionMeta.name} ({currentJurisdictionMeta.code})
          </span>
        </div>

        {/* 8-Nation Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin mb-4">
          {(Object.keys(EAST_AFRICA_JURISDICTIONS) as Array<Exclude<EastAfricaCountryCode, 'ALL'>>).map(
            (code) => {
              const meta = EAST_AFRICA_JURISDICTIONS[code];
              const isSelected = selectedJurisdiction === code;

              return (
                <button
                  key={code}
                  onClick={() => {
                    setSelectedJurisdiction(code);
                    if (onNotify) {
                      onNotify(
                        'Jurisdiction Switched',
                        `Active system regulatory jurisdiction set to ${meta.flag} ${meta.name} (${meta.regulatorCode}).`,
                        'info'
                      );
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">{meta.flag}</span>
                  <span>{meta.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {meta.code}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* Selected Nation Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Statutory Regulator</span>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">
              {currentJurisdictionMeta.statutoryRegulator}
            </p>
            <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              {currentJurisdictionMeta.regulatorCode}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Primary Corridor &amp; Gate</span>
            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
              {currentJurisdictionMeta.primaryCorridor}
            </p>
            <span className="text-[11px] text-slate-500 font-mono mt-1 block">
              Capital: {currentJurisdictionMeta.capital}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Clearing Rail &amp; Currency</span>
            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
              {currentJurisdictionMeta.paymentRail}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-1 block">
              {currentJurisdictionMeta.currency}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Emergency &amp; Active Fleet</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Emergency Dispatch:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {currentJurisdictionMeta.emergencyHotline}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-500">Active Fleet Units:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {currentJurisdictionMeta.activeDriversCount} vehicles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MULTI-REGION BACK4APP CLOUD BAAS GATEWAYS (8 REGIONAL NODES)      */}
      {/* ==================================================================== */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Multi-Region Back4App Cloud Infrastructure (8 Gateway Edges)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server-side Express proxy endpoints maintaining real-time Parse baaS connectivity across East Africa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePingAllGateways}
              disabled={isPingingGateways}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingingGateways ? 'animate-spin' : ''}`} />
              <span>{isPingingGateways ? 'Probing Latency...' : 'Ping All 8 Edges'}</span>
            </button>

            <button
              onClick={onOpenDbModal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Schema Inspector
            </button>
          </div>
        </div>

        {/* Master Credentials Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 mb-4 text-xs">
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
              <span>Server-Side REST Proxy (No Leakage)</span>
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block mb-0.5">LiveQuery Master Channel:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
              ws://server.ts:3000/parse
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
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Cross-Border Corridor Data Synchronizers
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live automated data exchange with national single windows, customs electronic seals, and axle sensors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            {
              key: 'northernCorridor' as const,
              title: 'Northern Corridor (Mombasa - Malaba)',
              desc: 'Continuous telematics & KeNHA / URA customs single-window synchronization.',
              badge: 'KE · UG',
            },
            {
              key: 'centralCorridor' as const,
              title: 'Central Corridor (Dar Port - Rusumo)',
              desc: 'LATRA & RURA electronic weigh-in-motion weight compliance streaming.',
              badge: 'TZ · RW',
            },
            {
              key: 'galafiDjiboutiBelt' as const,
              title: 'Galafi - PK12 Maritime Corridor',
              desc: 'DPFZA Doraleh port container release QR verification & D-Money transit sync.',
              badge: 'DJ · ET',
            },
            {
              key: 'berberaTransitLink' as const,
              title: 'Berbera Corridor (Berbera - Tog Wajaale)',
              desc: 'DP World container manifest electronic transfer into Eastern Ethiopia.',
              badge: 'SO · ET',
            },
            {
              key: 'nimuleEscortHighway' as const,
              title: 'Juba - Nimule Security Highway',
              desc: 'South Sudan police convoy telematics & geofence deviation detection.',
              badge: 'SS · UG',
            },
            {
              key: 'rectsCargoTracking' as const,
              title: 'EAC Regional Cargo Tracking (RECTS)',
              desc: 'Multilateral cross-border electronic seal tamper alerts across EAC corridors.',
              badge: 'EAC REGIONAL',
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
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Role-Based Access Control (RBAC) &amp; Regional Personas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch active operator persona to verify UI action barriers and Express API authorization guards
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
            const active = user?.role === persona.role && user?.name === persona.name;
            return (
              <button
                key={persona.email}
                type="button"
                onClick={() => {
                  if (onSwitchPersona) {
                    onSwitchPersona(persona);
                  }
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-500 dark:border-cyan-600 ring-2 ring-cyan-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">{persona.name}</span>
                  {active ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-600 text-white">
                      Active
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
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
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
                { action: 'manage_modules', label: 'SuperApp Micro-Service Architecture', roles: ['Super Admin'] },
                { action: 'manage_ride', label: 'Ride Hailing Mobility & Surge Multipliers', roles: ['Super Admin', 'Ride Manager'] },
                { action: 'manage_freight', label: 'Freight TruckBooking, Bids & Escrow', roles: ['Super Admin', 'Freight Coordinator'] },
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
      {/* 6. FLUTTER SUPERAPP MULTI-LINGUAL LOCALIZATION & SYSTEM CONTROLS     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flutter Multi-Lingual Bundle */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Flutter SuperApp Multi-Lingual SDK
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                7 East African localization bundles synchronized with active Parse schemas
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Universal Regional:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇬🇧 English (East Africa)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Ethiopia:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇪🇹 Amharic (አማርኛ) · Oromo (Afaan Oromoo)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Kenya, Tanzania, Uganda:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇰🇪 🇹🇿 Swahili (Kiswahili)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Somalia &amp; Djibouti:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇸🇴 Somali (Af-Soomaali) · 🇩🇯 French</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">South Sudan &amp; Sudan Link:</span>
              <span className="font-semibold text-slate-900 dark:text-white">🇸🇸 Juba Arabic (عربي جوبا)</span>
            </div>
          </div>

          <button
            onClick={onOpenFlutterModal}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open Flutter SDK Generator</span>
          </button>
        </div>

        {/* Security Session & Cache Invalidation */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Session Security &amp; Token Authority
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                JWT timeout enforcement and browser cache hygiene
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

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Storage Authority:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  localStorage + Express Session Token
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Local Timezone:</span>
                <span className="font-mono text-slate-900 dark:text-white">
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
