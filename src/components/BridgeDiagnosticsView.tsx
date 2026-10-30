import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  KeyRound,
  Database,
  Server,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wrench,
  RotateCcw,
  Layers,
  FlaskConical,
  Globe,
  Radio,
  CreditCard,
  Truck,
  MapPin,
  ExternalLink,
  Shield,
  ArrowRight,
  Wifi,
} from 'lucide-react';
import {
  ConnectivityPingResult,
  DiagnosticAutoFixAction,
  DiagnosticAutoFixReport,
  EastAfricaCountryCode,
  EastAfricaNodeDiagnosticSummary,
  TriggeredActivityPulse,
} from '../types';
import { back4AppService } from '../services/back4app';
import { EAST_AFRICA_GPS_CONFIGS } from '../services/eastAfricaGpsData';
import { ActivityStream } from './ActivityStream';

interface BridgeDiagnosticsViewProps {
  darkMode: boolean;
  userRole: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  userName?: string;
  userEmail?: string;
  activePulses?: TriggeredActivityPulse[];
  onPulsesUpdated?: (
    pulses: TriggeredActivityPulse[],
    newlyTriggered?: TriggeredActivityPulse[]
  ) => void;
  onAcknowledgePulse?: (pulseId: string) => void;
  onNavigateDashboard?: () => void;
  onSchemaResynced?: () => Promise<void> | void;
  onNotify?: (
    title: string,
    message?: string,
    type?: 'success' | 'info' | 'warning' | 'error'
  ) => void;
}

interface EastAfricaCountryMeta {
  code: Exclude<EastAfricaCountryCode, 'ALL'>;
  name: string;
  flag: string;
  capital: string;
  currency: string;
  regulatorName: string;
  regulatorAcronym: string;
  paymentGateway: string;
  corridor: string;
}

const EAST_AFRICA_COUNTRIES: EastAfricaCountryMeta[] = [
  {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    capital: 'Addis Ababa',
    currency: 'ETB',
    regulatorName: 'Federal Transport Authority (FTA)',
    regulatorAcronym: 'FTA',
    paymentGateway: 'Telebirr & CBE Birr',
    corridor: 'Addis Ababa - Modjo Dry Port - Djibouti Corridor',
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    capital: 'Nairobi',
    currency: 'KES',
    regulatorName: 'National Transport and Safety Authority (NTSA)',
    regulatorAcronym: 'NTSA',
    paymentGateway: 'Safaricom Daraja M-PESA',
    corridor: 'Mombasa Port - Nairobi SGR - Malaba Border',
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    capital: 'Kampala',
    currency: 'UGX',
    regulatorName: 'Ministry of Works and Transport (MoWT)',
    regulatorAcronym: 'MoWT',
    paymentGateway: 'MTN Mobile Money & Airtel UG',
    corridor: 'Malaba OSBP - Jinja - Kampala - Katuna Link',
  },
  {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    capital: 'Kigali',
    currency: 'RWF',
    regulatorName: 'Rwanda Utilities Regulatory Authority (RURA)',
    regulatorAcronym: 'RURA',
    paymentGateway: 'MTN MoMo Rwanda & Airtel RW',
    corridor: 'Rusumo OSBP - Kigali Logistics Platform (KLP)',
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    capital: 'Dar es Salaam',
    currency: 'TZS',
    regulatorName: 'Land Transport Regulatory Authority (LATRA)',
    regulatorAcronym: 'LATRA',
    paymentGateway: 'Vodacom M-Pesa & Tigo Pesa',
    corridor: 'Port of Dar es Salaam - Isaka Dry Port',
  },
  {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    capital: 'Djibouti City',
    currency: 'DJF',
    regulatorName: 'Djibouti Ports and Free Zones Authority (DPFZA)',
    regulatorAcronym: 'DPFZA',
    paymentGateway: 'D-Money (Djibouti Telecom)',
    corridor: 'Doraleh Multi-Purpose Port - PK12 - Galafi Border',
  },
  {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    capital: 'Mogadishu',
    currency: 'USD',
    regulatorName: 'Ministry of Transport and Civil Aviation (MOTCA)',
    regulatorAcronym: 'MOTCA',
    paymentGateway: 'Hormuud EVC Plus & Telesom Zaad',
    corridor: 'Berbera Port - Hargeisa - Tog Wajaale Corridor',
  },
  {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    capital: 'Juba',
    currency: 'SSP',
    regulatorName: 'National Revenue Authority & Traffic Directorate',
    regulatorAcronym: 'NRA/Traffic',
    paymentGateway: 'm-GURUSH Mobile Money',
    corridor: 'Nimule Border - Juba Highway Lifeline Corridor',
  },
];

export const BridgeDiagnosticsView: React.FC<BridgeDiagnosticsViewProps> = ({
  darkMode: _unusedDarkMode,
  userRole,
  userJurisdiction = 'ET',
  userJurisdictionName = 'Ethiopia (Headquarters)',
  assignedCorridors = ['Addis Ababa Urban Grid', 'Modjo Dry Port - Djibouti Corridor'],
  userName = 'Daniel Ferede',
  userEmail = 'daniel@afronala.com',
  activePulses,
  onPulsesUpdated,
  onAcknowledgePulse,
  onNavigateDashboard,
  onSchemaResynced,
  onNotify,
}) => {
  // Country selection: default to user's operational country of login
  const defaultCountry = useMemo<EastAfricaCountryCode>(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL') {
      return userJurisdiction;
    }
    return 'ET';
  }, [userJurisdiction]);

  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(defaultCountry);

  // Sync selected country when operator switches persona
  useEffect(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL') {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  // Ping & Diagnostic state
  const [pingResult, setPingResult] = useState<ConnectivityPingResult | null>(null);
  const [pingHistory, setPingHistory] = useState<ConnectivityPingResult[]>([]);
  const [runningPing, setRunningPing] = useState<boolean>(false);
  const [sessionTokenInput, setSessionTokenInput] = useState<string>(() =>
    back4AppService.getDiagnosticSessionToken()
  );
  const [cleanupProbe, setCleanupProbe] = useState<boolean>(true);

  // East Africa regional node summaries
  const [eastAfricaNodes, setEastAfricaNodes] = useState<EastAfricaNodeDiagnosticSummary[]>([]);
  const [loadingNodes, setLoadingNodes] = useState<boolean>(false);

  // Diagnostic Auto-Fixer State
  const [runningAutoFix, setRunningAutoFix] = useState<DiagnosticAutoFixAction | null>(null);
  const [autoFixHistory, setAutoFixHistory] = useState<DiagnosticAutoFixReport[]>(() =>
    back4AppService.getAutoFixHistory()
  );
  const [autoHealOn502, setAutoHealOn502] = useState<boolean>(false);

  const activeCountryMeta = useMemo(() => {
    if (selectedCountry === 'ALL') {
      return {
        code: 'ALL' as const,
        name: 'Pan-East Africa Cross-Border Hub',
        flag: '🌍',
        capital: 'Regional Clearing Hub',
        currency: 'Multi-Currency (ETB, KES, UGX, RWF, TZS, DJF, USD, SSP)',
        regulatorName: 'East African Community (EAC) & Horn Regional Transit Accord',
        regulatorAcronym: 'EAC Transit',
        paymentGateway: 'Cross-Border Clearing Rails (Telebirr, M-PESA, MoMo, TIPS)',
        corridor: 'All Northern & Central Maritime Transit Corridors',
      };
    }
    return (
      EAST_AFRICA_COUNTRIES.find((c) => c.code === selectedCountry) || EAST_AFRICA_COUNTRIES[0]
    );
  }, [selectedCountry]);

  // Load East Africa node summaries
  const refreshEastAfricaNodes = useCallback(async () => {
    setLoadingNodes(true);
    try {
      const summaries = await back4AppService.getEastAfricaNodeSummaries();
      setEastAfricaNodes(summaries);
    } catch {
      // Fallback
    } finally {
      setLoadingNodes(false);
    }
  }, []);

  const handleSessionTokenChange = (val: string) => {
    setSessionTokenInput(val);
    back4AppService.setDiagnosticSessionToken(val);
  };

  const executePingTest = useCallback(
    async (
      silentToast = false,
      simulateFault?: '502-gateway' | 'handshake-failure'
    ) => {
      setRunningPing(true);
      try {
        const res = await back4AppService.runConnectivityPingTest({
          sessionToken: sessionTokenInput.trim() || undefined,
          cleanupProbe,
          simulateFault,
          countryCode: selectedCountry,
        });
        setPingResult(res);
        setPingHistory((prev) => [res, ...prev].slice(0, 10));

        const encountered502OrHandshake =
          !res.handshake.ok ||
          res.handshake.statusCode === 502 ||
          res.overallStatus === 'unreachable';

        if (!silentToast) {
          if (res.overallStatus === 'healthy') {
            onNotify?.(
              `${activeCountryMeta.flag} ${activeCountryMeta.name} Bridge Verified`,
              `Edge relay ${res.countryTelemetry?.edgeNodeHostname || 'active'} (${res.handshake.latencyMs}ms) · ConnectionTest probe OK (${res.totalRoundTripMs}ms total).`,
              'success'
            );
          } else if (res.overallStatus === 'degraded') {
            onNotify?.(
              `${activeCountryMeta.flag} ${activeCountryMeta.name} Connectivity Degraded`,
              res.connectionTest.writeError ||
                res.session.detail ||
                'Gateway reachable, but session or probe reported an issue. Use Diagnostic Auto-Fixer.',
              'warning'
            );
          } else {
            onNotify?.(
              `HTTP 502 / Handshake Fault on ${activeCountryMeta.name} Node`,
              res.handshake.detail ||
                'Could not complete Parse handshake. Diagnostic Auto-Fixer is ready.',
              'error'
            );
          }
        }

        if (encountered502OrHandshake && autoHealOn502 && !simulateFault) {
          await handleRunAutoFixResetSession(true);
        }
      } finally {
        setRunningPing(false);
      }
    },
    [sessionTokenInput, cleanupProbe, selectedCountry, activeCountryMeta, onNotify, autoHealOn502]
  );

  const handleRunAutoFixResetSession = useCallback(
    async (triggeredAutomatically = false) => {
      setRunningAutoFix('reset_session_tokens');
      try {
        const report = await back4AppService.autoResetStaleSessionTokens(sessionTokenInput);
        setSessionTokenInput('');
        setAutoFixHistory(back4AppService.getAutoFixHistory());
        if (report.postFixPing) {
          setPingResult(report.postFixPing);
          setPingHistory((prev) => [report.postFixPing!, ...prev].slice(0, 10));
        }

        onNotify?.(
          triggeredAutomatically
            ? `Auto-Fixer Recovered 502 Fault (${activeCountryMeta.name})`
            : `Stale Session Tokens Reset (${activeCountryMeta.name} Fleet)`,
          `${report.summary} (${report.durationMs}ms)`,
          report.success ? 'success' : 'warning'
        );
      } finally {
        setRunningAutoFix(null);
      }
    },
    [sessionTokenInput, activeCountryMeta, onNotify]
  );

  const handleRunAutoFixSchemaResync = useCallback(async () => {
    setRunningAutoFix('full_schema_resync');
    try {
      const report = await back4AppService.triggerFullSchemaResync();
      setSessionTokenInput('');
      setAutoFixHistory(back4AppService.getAutoFixHistory());
      if (report.postFixPing) {
        setPingResult(report.postFixPing);
        setPingHistory((prev) => [report.postFixPing!, ...prev].slice(0, 10));
      }
      await onSchemaResynced?.();

      onNotify?.(
        report.success
          ? `Full Schema Re-Sync Verified (${activeCountryMeta.name})`
          : 'Schema Re-Sync Completed with Warnings',
        `${report.summary} (${report.durationMs}ms)`,
        report.success ? 'success' : 'warning'
      );
    } finally {
      setRunningAutoFix(null);
    }
  }, [activeCountryMeta, onNotify, onSchemaResynced]);

  useEffect(() => {
    executePingTest(true);
    refreshEastAfricaNodes();
    // Run on mount or country change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  const renderStatusIndicator = (ok: boolean | undefined, pending: boolean) => {
    if (pending) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Testing...
        </span>
      );
    }
    if (ok) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        Failed
      </span>
    );
  };

  const is502OrHandshakeFailure = Boolean(
    pingResult &&
      (!pingResult.handshake.ok ||
        pingResult.handshake.statusCode === 502 ||
        pingResult.overallStatus === 'unreachable' ||
        pingResult.session.statusCode === 502 ||
        pingResult.connectionTest.writeStatus === 502)
  );
  const isSessionFault = Boolean(pingResult && !pingResult.session.valid);
  const isSchemaOrProbeFault = Boolean(
    pingResult &&
      (!pingResult.connectionTest.writeOk ||
        !pingResult.connectionTest.readOk ||
        !pingResult.connectionTest.nonceMatched)
  );
  const hasDiagnosticFault = is502OrHandshakeFailure || isSessionFault || isSchemaOrProbeFault;

  const isUserHomeJurisdiction =
    selectedCountry === userJurisdiction ||
    (userJurisdiction === 'ALL' && selectedCountry === 'ALL');

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Active Operator Jurisdiction Context */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span>East Africa Operations</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              Bridge Diagnostics &amp; National Edge Relays
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{activeCountryMeta.flag}</span>
            <span>{activeCountryMeta.name} Operational Bridge Diagnostics</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real-time edge connectivity, Parse REST handshake latency, localized{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activeCountryMeta.paymentGateway}
            </span>{' '}
            settlement webhooks, and national{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activeCountryMeta.regulatorAcronym}
            </span>{' '}
            regulatory mandate bridges.
          </p>
        </div>

        {/* Operator Login Context Card */}
        <div className="p-3 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-3 shrink-0 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-center font-bold text-cyan-800 dark:text-cyan-300 text-sm shrink-0">
            {activeCountryMeta.flag}
          </div>
          <div className="text-xs min-w-0">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
              <span>{userName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {userRole}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-xs mt-0.5">
              Operation Base: <strong>{userJurisdictionName}</strong>
            </p>
          </div>
          {!isUserHomeJurisdiction && (
            <button
              type="button"
              onClick={() => setSelectedCountry(defaultCountry)}
              className="text-[11px] px-2.5 py-1 rounded-md border border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 font-medium whitespace-nowrap ml-auto"
            >
              Reset to My Base ({userJurisdiction})
            </button>
          )}
        </div>
      </div>

      {/* 2. East Africa 8-Nation + Regional Hub Interactive Selector Ribbon */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
            <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>East Africa National Relay Hubs</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              (Select to inspect any country of operation)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshEastAfricaNodes}
              disabled={loadingNodes}
              className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loadingNodes ? 'animate-spin' : ''}`} />
              <span>Refresh Node Telemetry</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
          {/* Pan-East Africa Option */}
          <button
            type="button"
            onClick={() => setSelectedCountry('ALL')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedCountry === 'ALL'
                ? 'border-cyan-600 bg-cyan-50/80 dark:bg-cyan-950/40 ring-1 ring-cyan-600'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-base mb-1">
              <span>🌍</span>
              {userJurisdiction === 'ALL' && (
                <span className="text-[9px] px-1 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 font-bold uppercase">
                  Base
                </span>
              )}
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
              Pan-East Africa
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Regional Transit
            </div>
          </button>

          {/* 8 East African Sovereign Nations */}
          {EAST_AFRICA_COUNTRIES.map((country) => {
            const isSelected = selectedCountry === country.code;
            const isBase = userJurisdiction === country.code;
            const nodeSummary = eastAfricaNodes.find((n) => n.countryCode === country.code);
            const latency = nodeSummary?.latencyMs || 40;

            return (
              <button
                key={country.code}
                type="button"
                onClick={() => setSelectedCountry(country.code)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-600 bg-cyan-50/80 dark:bg-cyan-950/40 ring-1 ring-cyan-600'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between text-base mb-1">
                  <span>{country.flag}</span>
                  {isBase ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 font-bold uppercase tracking-wider">
                      My Base
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {latency}ms
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {country.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {country.regulatorAcronym} · {country.currency}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Diagnostic Probe Action Bar & Fault Simulation */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 font-bold text-sm ${
                pingResult?.overallStatus === 'healthy'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : pingResult?.overallStatus === 'degraded'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {pingResult?.overallStatus === 'healthy' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : pingResult?.overallStatus === 'degraded' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              {pingResult?.overallStatus === 'healthy'
                ? `${activeCountryMeta.name} Relay Synchronized`
                : pingResult?.overallStatus === 'degraded'
                ? `${activeCountryMeta.name} Relay Degraded`
                : `${activeCountryMeta.name} Gateway 502 / Offline`}
            </span>
            {pingResult && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  Round-Trip: <strong>{pingResult.totalRoundTripMs} ms</strong>
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  Node: {pingResult.countryTelemetry?.edgeNodeHostname || 'cluster-east1'}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  Operator: <strong className="text-slate-900 dark:text-white">{userName}</strong>
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => executePingTest(false, '502-gateway')}
              disabled={runningPing || Boolean(runningAutoFix)}
              title="Inject a diagnostic 502 handshake failure to test Auto-Fixer remediation"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Simulate 502 Fault</span>
            </button>

            <button
              type="button"
              onClick={() => executePingTest(false)}
              disabled={runningPing || Boolean(runningAutoFix)}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs transition-colors"
            >
              <Activity className={`w-4 h-4 ${runningPing ? 'animate-pulse' : ''}`} />
              <span>
                {runningPing
                  ? `Testing ${activeCountryMeta.name}...`
                  : `Run ${activeCountryMeta.name} Connectivity Ping`}
              </span>
            </button>
          </div>
        </div>

        {/* Optional Mobile .apk Session Token Verifier Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <Smartphone className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
            <span>
              <strong>Driver .apk Session Authority:</strong> Validate an{' '}
              <span className="font-mono">X-Parse-Session-Token</span> (<span className="font-mono">r:...</span>) from {activeCountryMeta.name} mobile drivers, or leave blank to verify server proxy REST authority.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-96 shrink-0">
            <input
              type="text"
              value={sessionTokenInput}
              onChange={(e) => handleSessionTokenChange(e.target.value)}
              placeholder="r:a1b2c3d4... (optional mobile token)"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            {sessionTokenInput && (
              <button
                type="button"
                onClick={() => handleSessionTokenChange('')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 4. Dedicated Country Operational Telemetry (4 Integrated Cards) */}
        {pingResult?.countryTelemetry && (
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>
                  Live In-Country Edge Infrastructure · {pingResult.countryTelemetry.countryName} ({pingResult.countryTelemetry.countryCode})
                </span>
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                Capital: {pingResult.countryTelemetry.capital} · Currency: {pingResult.countryTelemetry.currency}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: National Edge Node */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span className="font-medium flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    National Edge Node
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    {pingResult.countryTelemetry.edgeLatencyMs} ms
                  </span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                  {pingResult.countryTelemetry.edgeNodeHostname}
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {pingResult.countryTelemetry.telecomCarriers.map((tc) => (
                    <div key={tc.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1 truncate">
                        <Wifi className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        {tc.name}
                      </span>
                      <span className="font-mono tabular-nums text-[10px] text-slate-500">
                        {tc.pingMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Payment Settlement Bridge */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span className="font-medium flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Payment Clearing Bridge
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    {pingResult.countryTelemetry.primaryPaymentGateway.successRatePct}%
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {pingResult.countryTelemetry.primaryPaymentGateway.name}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Provider: {pingResult.countryTelemetry.primaryPaymentGateway.provider}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Webhook IPN:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {pingResult.countryTelemetry.primaryPaymentGateway.webhookLatencyMs} ms
                  </span>
                </div>
              </div>

              {/* Card 3: Regulatory & Inspection Mandate */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span className="font-medium flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Regulatory Mandate
                  </span>
                  <span className="text-[10px] px-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold">
                    {pingResult.countryTelemetry.regulatoryAgency.acronym}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate" title={pingResult.countryTelemetry.regulatoryAgency.name}>
                  {pingResult.countryTelemetry.regulatoryAgency.name}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {pingResult.countryTelemetry.regulatoryAgency.monitoredItems}
                </p>
              </div>

              {/* Card 4: In-Country Fleet & Corridor Telemetry */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span className="font-medium flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Fleet &amp; Corridor Health
                  </span>
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                    {pingResult.countryTelemetry.complianceHealthScore}%
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white truncate" title={pingResult.countryTelemetry.primaryCorridor.name}>
                  {pingResult.countryTelemetry.primaryCorridor.name}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  <span>Active .apk Drivers:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {pingResult.countryTelemetry.activeApkDriversCount}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  <span>Transit Trucks:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {pingResult.countryTelemetry.primaryCorridor.activeTrucks} ({pingResult.countryTelemetry.primaryCorridor.avgSpeedKmh} km/h)
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 4-Stage Diagnostic Verification Grid (Single-Elevation Divider Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Stage 1: Handshake Latency */}
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Server className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  1. Parse Proxy Handshake
                </span>
                {renderStatusIndicator(pingResult?.handshake.ok, runningPing && !pingResult)}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {pingResult ? `${pingResult.handshake.latencyMs} ms` : '—'}
                </span>
                {pingResult && (
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    HTTP {pingResult.handshake.statusCode}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pingResult?.handshake.detail || 'Measuring TLS handshake to Back4App Parse REST gateway...'}
            </p>
          </div>

          {/* Stage 2: Session Token Validity */}
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                  2. Session &amp; Auth Validity
                </span>
                {renderStatusIndicator(pingResult?.session.valid, runningPing && !pingResult)}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {pingResult ? `${pingResult.session.latencyMs} ms` : '—'}
                </span>
                {pingResult && (
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    HTTP {pingResult.session.statusCode}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {pingResult?.session.principal || 'Checking credentials...'}
              </p>
              <p className="mt-0.5">{pingResult?.session.detail || 'Validating Parse session authority...'}</p>
            </div>
          </div>

          {/* Stage 3: ConnectionTest Write Probe */}
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Database className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  3. ConnectionTest Write
                </span>
                {renderStatusIndicator(
                  pingResult?.connectionTest.writeOk,
                  runningPing && !pingResult
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {pingResult ? `${pingResult.connectionTest.writeLatencyMs} ms` : '—'}
                </span>
                {pingResult && (
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    HTTP {pingResult.connectionTest.writeStatus}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pingResult?.connectionTest.writeOk ? (
                <>
                  <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 truncate">
                    objectId: {pingResult.connectionTest.objectId}
                  </p>
                  <p className="mt-0.5">Created dummy probe document in Parse class ConnectionTest.</p>
                </>
              ) : (
                <p className="text-rose-700 dark:text-rose-400">
                  {pingResult?.connectionTest.writeError || 'Executing POST /classes/ConnectionTest...'}
                </p>
              )}
            </div>
          </div>

          {/* Stage 4: ConnectionTest Read-Back & Nonce Match */}
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  4. Read-Back &amp; Nonce Match
                </span>
                {renderStatusIndicator(
                  Boolean(
                    pingResult?.connectionTest.readOk && pingResult?.connectionTest.nonceMatched
                  ),
                  runningPing && !pingResult
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {pingResult ? `${pingResult.connectionTest.readLatencyMs} ms` : '—'}
                </span>
                {pingResult && (
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    HTTP {pingResult.connectionTest.readStatus || '—'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pingResult?.connectionTest.readOk ? (
                <>
                  <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 truncate">
                    Nonce {pingResult.connectionTest.nonceMatched ? 'Matched' : 'Mismatch'} ·{' '}
                    {pingResult.connectionTest.cleanupExecuted
                      ? pingResult.connectionTest.cleanupOk
                        ? `Cleaned (${pingResult.connectionTest.cleanupLatencyMs}ms)`
                        : 'Retained'
                      : 'Retained in DB'}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] truncate">
                    {pingResult.connectionTest.probeNonce}
                  </p>
                </>
              ) : (
                <p>
                  {pingResult?.connectionTest.readError ||
                    'Verifying GET /classes/ConnectionTest/:objectId...'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 6. Diagnostic Auto-Fixer Remediation Bar */}
        <div
          className={`p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 transition-colors ${
            is502OrHandshakeFailure
              ? 'bg-rose-50/85 dark:bg-rose-950/35'
              : hasDiagnosticFault
              ? 'bg-amber-50/85 dark:bg-amber-950/30'
              : 'bg-slate-50/70 dark:bg-slate-950/40'
          }`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 font-bold ${
                    is502OrHandshakeFailure
                      ? 'text-rose-800 dark:text-rose-300'
                      : hasDiagnosticFault
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 shrink-0" />
                  <span>Diagnostic Auto-Fixer ({activeCountryMeta.name})</span>
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                {is502OrHandshakeFailure ? (
                  <span className="font-mono font-semibold text-rose-700 dark:text-rose-300 tabular-nums">
                    Action Required: HTTP {pingResult?.handshake.statusCode || 502} Handshake / Gateway Failure
                  </span>
                ) : hasDiagnosticFault ? (
                  <span className="font-mono font-semibold text-amber-800 dark:text-amber-300 tabular-nums">
                    Degraded Probe Detected ({!pingResult?.session.valid ? `Session HTTP ${pingResult?.session.statusCode}` : 'Schema / CLP Mismatch'})
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Standby · Ready for 502 / Stale Token Recovery
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                {is502OrHandshakeFailure
                  ? `Upstream Parse proxy for ${activeCountryMeta.name} reported a 502 or handshake failure. Auto-reset stale session tokens to restore Server Proxy REST Authority, or trigger a full schema re-sync.`
                  : isSessionFault
                  ? `The supplied X-Parse-Session-Token was rejected by Back4App (/users/me). Resetting stale session tokens revokes expired credentials for ${activeCountryMeta.name} operators.`
                  : `Remediate 502 handshake drops, expired mobile session state, or unprovisioned SuperApp schemas across the ${activeCountryMeta.name} corridor.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none mr-1">
                <input
                  type="checkbox"
                  checked={autoHealOn502}
                  onChange={(e) => setAutoHealOn502(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="whitespace-nowrap">Auto-reset on live 502</span>
              </label>

              <button
                type="button"
                onClick={() => handleRunAutoFixResetSession(false)}
                disabled={Boolean(runningAutoFix) || runningPing}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors disabled:opacity-60 ${
                  hasDiagnosticFault
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                    : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${
                    runningAutoFix === 'reset_session_tokens' ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {runningAutoFix === 'reset_session_tokens'
                    ? 'Resetting Session Tokens...'
                    : 'Auto-Reset Stale Session'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleRunAutoFixSchemaResync}
                disabled={Boolean(runningAutoFix) || runningPing}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors disabled:opacity-60 ${
                  is502OrHandshakeFailure || isSchemaOrProbeFault
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                    : 'border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300'
                }`}
              >
                <Layers
                  className={`w-3.5 h-3.5 ${
                    runningAutoFix === 'full_schema_resync' ? 'animate-pulse' : ''
                  }`}
                />
                <span>
                  {runningAutoFix === 'full_schema_resync'
                    ? 'Re-Syncing Full Schema...'
                    : 'Trigger Full Schema Re-Sync'}
                </span>
              </button>
            </div>
          </div>

          {/* Recent Auto-Fix Remediation Audit Log */}
          {autoFixHistory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider">
                  Recent Auto-Fixer Remediation Runs
                </span>
                <span className="font-mono tabular-nums">
                  {autoFixHistory.length} {autoFixHistory.length === 1 ? 'operation' : 'operations'}
                </span>
              </div>
              <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80 text-xs">
                {autoFixHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(item.executedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                          })}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.action === 'reset_session_tokens'
                            ? 'Session Token Reset'
                            : 'Full Schema Re-Sync'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {item.summary}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] shrink-0">
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.durationMs} ms
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                        /
                      </span>
                      <span
                        className={
                          item.postFixPingStatus === 'healthy'
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-amber-700 dark:text-amber-400 font-semibold'
                        }
                      >
                        Post-Fix: {item.postFixPingStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7. Multi-Country Radar Matrix Table */}
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>East Africa Cross-Border Operational Grid (8 Nations)</span>
            </span>
            <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
              Active Jurisdiction: {activeCountryMeta.name} ({activeCountryMeta.code})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-900/40">
                  <th className="py-2.5 px-4 whitespace-nowrap">Country / Hub</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Edge Relay Host</th>
                  <th className="py-2.5 px-4 whitespace-nowrap text-right">Ping Latency</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Payment Settlement</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">National Regulator</th>
                  <th className="py-2.5 px-4 whitespace-nowrap text-right">Active Drivers</th>
                  <th className="py-2.5 px-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {EAST_AFRICA_COUNTRIES.map((c) => {
                  const isCurrent = selectedCountry === c.code;
                  const isBase = userJurisdiction === c.code;
                  const summary = eastAfricaNodes.find((n) => n.countryCode === c.code);
                  const latency = summary?.latencyMs || 38;
                  const drivers = summary?.activeDrivers || 200;

                  return (
                    <tr
                      key={c.code}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-cyan-50/50 dark:bg-cyan-950/20 font-medium'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {c.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 ml-1.5">
                              ({c.code})
                            </span>
                            {isBase && (
                              <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 font-bold uppercase">
                                Your Base
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Healthy
                        </span>
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {summary?.edgeNodeHostname || `${c.code.toLowerCase()}-edge.east1.afronala`}
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        <strong>{latency} ms</strong>
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {c.paymentGateway}
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{c.regulatorAcronym}</span>
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {drivers} .apk
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCountry(c.code)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            isCurrent
                              ? 'bg-cyan-600 text-white font-bold'
                              : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isCurrent ? 'Active Focus' : 'Target Bridge'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 8. Recent Diagnostic Probe History */}
        {pingHistory.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800">
            <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Diagnostic Probe Run Log (Session History)
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {pingHistory.length} {pingHistory.length === 1 ? 'run' : 'runs'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <th className="py-2 px-4 whitespace-nowrap">Time</th>
                    <th className="py-2 px-4 whitespace-nowrap">Country</th>
                    <th className="py-2 px-4 whitespace-nowrap">Result</th>
                    <th className="py-2 px-4 whitespace-nowrap">Auth Mode</th>
                    <th className="py-2 px-4 whitespace-nowrap">ConnectionTest ObjectId</th>
                    <th className="py-2 px-4 whitespace-nowrap text-right">Handshake</th>
                    <th className="py-2 px-4 whitespace-nowrap text-right">Write / Read</th>
                    <th className="py-2 px-4 whitespace-nowrap text-right">Total RTT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono tabular-nums">
                  {pingHistory.map((run) => (
                    <tr
                      key={run.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {new Date(run.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-sans font-semibold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1">
                          <span>{run.countryTelemetry?.flag || '🌍'}</span>
                          <span>{run.countryTelemetry?.countryCode || 'ALL'}</span>
                        </span>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-sans font-semibold">
                        <span
                          className={
                            run.overallStatus === 'healthy'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : run.overallStatus === 'degraded'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }
                        >
                          {run.overallStatus === 'healthy'
                            ? 'Healthy'
                            : run.overallStatus === 'degraded'
                            ? 'Degraded'
                            : `Unreachable (${run.handshake.statusCode})`}
                        </span>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-sans text-slate-700 dark:text-slate-300">
                        {run.session.mode === 'apk-session-token'
                          ? '.apk Session Token'
                          : 'Proxy REST Authority'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {run.connectionTest.objectId || '—'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-right text-slate-700 dark:text-slate-300">
                        {run.handshake.latencyMs} ms
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-right text-slate-700 dark:text-slate-300">
                        {run.connectionTest.writeLatencyMs} ms / {run.connectionTest.readLatencyMs} ms
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                        {run.totalRoundTripMs} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 9. Country-Filtered Activity Stream */}
      <ActivityStream
        darkMode={false}
        userCountry={userJurisdiction}
        selectedCountry={selectedCountry}
        onSelectCountry={(c) => setSelectedCountry(c)}
        activePulses={activePulses}
        onPulsesUpdated={onPulsesUpdated}
        onAcknowledgePulse={onAcknowledgePulse}
        onNavigateDashboard={onNavigateDashboard}
        onNotify={onNotify}
      />
    </div>
  );
};
