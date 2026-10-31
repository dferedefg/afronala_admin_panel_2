import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Code2,
  Database,
  Download,
  FileCode2,
  Layers,
  Play,
  RefreshCw,
  Search,
  Terminal,
  X,
  Globe,
  MapPin,
  ShieldCheck,
  Smartphone,
  Radio,
  Zap,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Shield,
  Activity,
  Server,
  Cpu,
  CreditCard,
  Truck,
  Car,
  ChevronRight,
  Sparkles,
  Filter,
} from 'lucide-react';
import {
  AdminUser,
  EastAfricaCountryCode,
  EastAfricaNodeDiagnosticSummary,
  PermissionAction,
  SuperAppClassSyncAuditRow,
  SuperAppCloudFunctionContract,
  SuperAppMonorepoManifest,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { back4AppService } from '../services/back4app';
import { downloadCsv, DEMO_PERSONAS } from '../services/rbac';
import {
  EAST_AFRICAN_COUNTRIES_META,
  EAST_AFRICAN_COUNTRIES_ORDERED,
  ALL_COUNTRY_OPTIONS,
} from '../services/eastAfricaModules';
import { EAST_AFRICA_PROFILES } from '../services/eastAfricaScreens';
import { Back4AppDatabaseClassesView } from './Back4AppDatabaseClassesView';

export interface SuperAppMonorepoViewProps {
  darkMode: boolean;
  user?: AdminUser | null;
  userRole: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  onSwitchPersona?: (persona: AdminUser) => void;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type InspectorTab = 'country_matrix' | 'packages' | 'schemas' | 'functions' | 'back4app_classes';

// Realistic sample payloads keyed by function and country
function getCountrySamplePayload(functionName: string, countryCode: Exclude<EastAfricaCountryCode, 'ALL'>): Record<string, any> {
  const meta = EAST_AFRICAN_COUNTRIES_META[countryCode] || EAST_AFRICAN_COUNTRIES_META.ET;
  const profile = EAST_AFICA_SAFE_PROFILE(countryCode);

  const zones: Record<Exclude<EastAfricaCountryCode, 'ALL'>, string> = {
    ET: 'add_bole_transit',
    KE: 'nbo_cbd_westlands',
    UG: 'kla_nakasero_hub',
    RW: 'kgl_nyarugenge_core',
    TZ: 'dar_kariakoo_port',
    DJ: 'jib_doraleh_terminal',
    SO: 'mgq_airport_k4',
    SS: 'jub_customs_port',
  };

  const sampleAmounts: Record<Exclude<EastAfricaCountryCode, 'ALL'>, number> = {
    ET: 450,
    KE: 850,
    UG: 18500,
    RW: 4200,
    TZ: 14000,
    DJ: 3800,
    SO: 14,
    SS: 8500,
  };

  const phones: Record<Exclude<EastAfricaCountryCode, 'ALL'>, string> = {
    ET: '+251911234567',
    KE: '+254712345678',
    UG: '+256772123456',
    RW: '+250788123456',
    TZ: '+255754123456',
    DJ: '+25377123456',
    SO: '+252615123456',
    SS: '+211912123456',
  };

  const licensePrefixes: Record<Exclude<EastAfricaCountryCode, 'ALL'>, string> = {
    ET: 'ET-LIC-44910',
    KE: 'KE-NTSA-DL-8821',
    UG: 'UG-MOWT-DL-5120',
    RW: 'RW-RURA-DL-9904',
    TZ: 'TZ-LATRA-DL-7731',
    DJ: 'DJ-DTT-DL-3301',
    SO: 'SO-MOTCA-DL-1180',
    SS: 'SS-MOTR-DL-2245',
  };

  const sampleAmount = sampleAmounts[countryCode] || 500;
  const currency = meta.currency;
  const primaryRail = meta.primaryPaymentRail;

  switch (functionName) {
    case 'getPlatformMetrics':
      return {
        countryCode,
        currency,
        includeEscrowSummary: true,
        includeRegulatorTelemetry: true,
        primaryCorridor: meta.corridor,
      };
    case 'admin_getPendingDocuments':
      return {
        countryCode,
        includeAllQueues: true,
        regulatorAcronym: meta.shortRegulator,
      };
    case 'admin_verifyDocument':
      return {
        targetId: `VER-${countryCode}-401`,
        countryCode,
        regulator: meta.shortRegulator,
        licenseNumber: licensePrefixes[countryCode],
        decision: 'approved',
        notes: `Validated against ${meta.transportRegulator} commercial database`,
      };
    case 'approveVehicleVerification':
      return {
        targetId: `VEH-${countryCode}-202`,
        countryCode,
        decision: 'approved',
        inspectionAuthority: meta.shortRegulator,
        speedLimiterCertified: meta.speedLimiterMandate,
        notes: `Physical and emission inspection passed for ${meta.name}`,
      };
    case 'rejectVehicleVerification':
      return {
        targetId: `VEH-${countryCode}-202`,
        countryCode,
        decision: 'rejected',
        reason: `Expired roadworthiness certificate under ${meta.shortRegulator} regulations`,
      };
    case 'approveServiceActivation':
      return {
        targetId: `ACT-${countryCode}-109`,
        countryCode,
        phone: phones[countryCode],
        serviceType: 'ride',
        statutoryCommissionCapPct: meta.statutoryCommissionCapPct,
        decision: 'approved',
      };
    case 'rejectDriverRequest':
      return {
        targetId: `DRV-${countryCode}-088`,
        countryCode,
        decision: 'rejected',
        reason: `National identification or commercial TIN not cleared with ${meta.name} authorities`,
      };
    case 'evaluateBatchDriverEligibility':
      return {
        countryCode,
        corridor: meta.corridor,
        speedLimiterMandate: meta.speedLimiterMandate,
        evIncentiveActive: meta.evIncentiveActive,
        scope: 'regional_fleet',
      };
    case 'evaluateBiddingAuction':
      return {
        bookingId: `BK-${countryCode}-8801`,
        countryCode,
        corridor: meta.corridor,
        cargoWeightTons: 28,
        currency,
        targetBudgetAmount: sampleAmount * 15,
      };
    case 'releaseEscrowPayout':
      return {
        escrowId: `ESC-${countryCode}-991`,
        countryCode,
        currency,
        paymentRail: primaryRail,
        grossAmount: sampleAmount * 20,
        platformCommissionPct: meta.statutoryCommissionCapPct,
        recipientPhone: phones[countryCode],
      };
    case 'calculateSurgePricing':
    case 'getCurrentSurge':
      return {
        zoneId: zones[countryCode],
        countryCode,
        currency,
        baseFare: sampleAmount,
        corridorName: meta.corridor,
      };
    default:
      return {
        countryCode,
        currency,
        operatingAuthority: meta.transportRegulator,
        timestamp: new Date().toISOString(),
      };
  }
}

function EAST_AFICA_SAFE_PROFILE(code: Exclude<EastAfricaCountryCode, 'ALL'>) {
  return (
    EAST_AFRICA_PROFILES[code] || {
      code,
      name: 'East Africa',
      flag: '🌍',
      capital: 'Regional Hub',
      currency: 'ETB',
      currencySymbol: 'Br',
      regulatorName: 'Regional Transport Authority',
      regulatorShort: 'RTA',
      hotline: '991',
      operatorPersona: {
        name: 'Regional Operator',
        role: 'Operations Coordinator',
        email: 'ops@afronala.com',
        title: 'Corridor Dispatch Supervisor',
        scopeSummary: 'Regional fleet dispatch',
      },
      primaryCorridors: ['Trans-African Highway Corridor'],
      keyGeofences: [{ name: 'Central Dry Port', type: 'dry_port' as const, status: 'active' as const, activeVehicles: 45 }],
      paymentRails: [{ gateway: 'telebirr' as const, name: 'Local Mobile Money', provider: 'National Telco', dailyVolumeLocal: '1,000,000', latencyMs: 80, speed: 'Instant IPN' }],
      operationalStats: { activeFleetCount: 250, dailyTrips: 1800, dailyFreightTons: 4200, dailyVolumeLocal: '12,500,000' },
    }
  );
}

export const SuperAppMonorepoView: React.FC<SuperAppMonorepoViewProps> = ({
  darkMode,
  user,
  userRole,
  userJurisdiction,
  userJurisdictionName,
  assignedCorridors = [],
  onSwitchPersona,
  onGuardPermission,
  onNotify,
}) => {
  // Selected country filter defaults to user's operational country or ALL
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(() => {
    return userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ALL';
  });

  // Sync when logged in persona changes
  useEffect(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL') {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  const [activeTab, setActiveTab] = useState<InspectorTab>('country_matrix');
  const [manifest, setManifest] = useState<SuperAppMonorepoManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');

  // Edge node diagnostics state
  const [edgeNodes, setEdgeNodes] = useState<EastAfricaNodeDiagnosticSummary[]>([]);
  const [loadingEdgeNodes, setLoadingEdgeNodes] = useState(false);
  const [pingingCountry, setPingingCountry] = useState<string | null>(null);

  // Live Schema Sync Audit state
  const [auditRows, setAuditRows] = useState<Record<string, SuperAppClassSyncAuditRow>>({});
  const [auditing, setAuditing] = useState(false);
  const [provisioningClass, setProvisioningClass] = useState<string | null>(null);

  // Archive File Source Drawer
  const [fileDrawer, setFileDrawer] = useState<{
    path: string;
    sizeBytes: number;
    content: string;
  } | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // Cloud Function Live RPC Runner
  const [selectedRpc, setSelectedRpc] = useState<SuperAppCloudFunctionContract | null>(null);
  const [rpcPayloadText, setRpcPayloadText] = useState<string>('{}');
  const [rpcCountryTarget, setRpcCountryTarget] = useState<Exclude<EastAfricaCountryCode, 'ALL'>>(
    userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET'
  );
  const [rpcOutput, setRpcOutput] = useState<{
    mode: string;
    latencyMs: number;
    data: any;
  } | null>(null);
  const [runningRpc, setRunningRpc] = useState(false);

  // Load manifest & edge node diagnostics
  const loadArchiveManifest = async () => {
    setLoading(true);
    try {
      const [manifestData, nodeSummaries] = await Promise.all([
        superAppBridgeService.getMonorepoManifest(),
        back4AppService.getEastAfricaNodeSummaries().catch(() => []),
      ]);
      setManifest(manifestData);
      setEdgeNodes(nodeSummaries);

      if (manifestData.cloudFunctions.length > 0) {
        const defaultFn =
          manifestData.cloudFunctions.find((f) => f.functionName === 'getPlatformMetrics') ||
          manifestData.cloudFunctions[0];
        setSelectedRpc(defaultFn);
        const targetCode = userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET';
        setRpcPayloadText(
          JSON.stringify(getCountrySamplePayload(defaultFn.functionName, targetCode), null, 2)
        );
      }
    } catch (err: any) {
      onNotify('Archive Parse Failed', err?.message || 'Unable to inspect zip', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchiveManifest();
  }, []);

  const handleOpenSourceFile = async (filePath: string) => {
    setLoadingFile(true);
    try {
      const fileData = await superAppBridgeService.readArchiveFile(filePath);
      setFileDrawer(fileData);
    } catch (err: any) {
      onNotify('Source Read Error', err?.message, 'warning');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleVerifyBackendSync = async () => {
    setAuditing(true);
    try {
      const res = await superAppBridgeService.runSchemaSyncAudit();
      const map: Record<string, SuperAppClassSyncAuditRow> = {};
      for (const r of res.rows) {
        map[r.className] = r;
      }
      setAuditRows(map);
      const reachableCount = res.rows.filter((r) => r.reachableOnBack4App).length;
      onNotify(
        'Backend Schema Sync Verified',
        `${reachableCount}/${res.rows.length} Flutter Parse classes reachable on Back4App.`,
        'success'
      );
    } catch (err: any) {
      onNotify('Sync Audit Error', err?.message, 'error');
    } finally {
      setAuditing(false);
    }
  };

  const handleProvisionClass = async (className: string, fields: string[]) => {
    if (!onGuardPermission('manage_modules', `Provision Parse class ${className}`)) return;
    setProvisioningClass(className);
    try {
      const typedFields = fields
        .filter((f) => !['objectId', 'createdAt', 'updatedAt'].includes(f))
        .map((name) => ({
          name,
          type: (name.toLowerCase().includes('amount') ||
          name.toLowerCase().includes('tons') ||
          name.toLowerCase().includes('rating') ||
          name.toLowerCase().includes('multiplier')
            ? 'Number'
            : name.toLowerCase().startsWith('is') || name.toLowerCase().includes('enabled')
            ? 'Boolean'
            : 'String') as 'String' | 'Number' | 'Boolean',
          required: false,
        }));

      const res = await back4AppService.provisionClassWithFields(className, typedFields);
      onNotify('Schema Provisioned', res.message, 'success');
      await handleVerifyBackendSync();
    } catch (err: any) {
      onNotify('Provisioning Failed', err?.message, 'error');
    } finally {
      setProvisioningClass(null);
    }
  };

  const handlePingCountryNode = async (code: Exclude<EastAfricaCountryCode, 'ALL'>) => {
    setPingingCountry(code);
    try {
      const res = await back4AppService.runConnectivityPingTest({ countryCode: code, cleanupProbe: true });
      const updatedNodes = await back4AppService.getEastAfricaNodeSummaries();
      setEdgeNodes(updatedNodes);
      onNotify(
        `${EAST_AFRICAN_COUNTRIES_META[code]?.name} Relay Verified`,
        `HTTP ${res.handshake.statusCode} · ${res.handshake.latencyMs}ms latency · Status: ${res.overallStatus.toUpperCase()}`,
        res.overallStatus === 'healthy' ? 'success' : 'warning'
      );
    } catch (err: any) {
      onNotify('Node Ping Error', err?.message, 'error');
    } finally {
      setPingingCountry(null);
    }
  };

  const handleLoadCountryPayload = (code: Exclude<EastAfricaCountryCode, 'ALL'>) => {
    setRpcCountryTarget(code);
    if (!selectedRpc) return;
    const payload = getCountrySamplePayload(selectedRpc.functionName, code);
    setRpcPayloadText(JSON.stringify(payload, null, 2));
    setRpcOutput(null);
    onNotify(
      `Loaded ${EAST_AFRICAN_COUNTRIES_META[code]?.name} Sample`,
      `Context set to ${EAST_AFRICAN_COUNTRIES_META[code]?.currency} & ${EAST_AFRICAN_COUNTRIES_META[code]?.shortRegulator}`,
      'info'
    );
  };

  const handleInvokeSelectedRpc = async () => {
    if (!selectedRpc) return;
    let parsedPayload: Record<string, any> = {};
    try {
      parsedPayload = rpcPayloadText.trim() ? JSON.parse(rpcPayloadText) : {};
    } catch {
      onNotify('Invalid JSON Payload', 'Fix the JSON syntax before invoking RPC.', 'warning');
      return;
    }

    setRunningRpc(true);
    try {
      const res = await superAppBridgeService.callCloudFunction(
        selectedRpc.functionName,
        parsedPayload
      );
      setRpcOutput({
        mode: res.executionMode,
        latencyMs: res.latencyMs,
        data: res.result,
      });
      onNotify(
        `Invoked ${selectedRpc.functionName}`,
        `Completed in ${res.latencyMs}ms (${res.executionMode}).`,
        'success'
      );
    } catch (err: any) {
      onNotify('Cloud Function Blocked / Failed', err?.message, 'error');
    } finally {
      setRunningRpc(false);
    }
  };

  // Find persona for country to switch
  const getPersonaForCountry = (countryCode: EastAfricaCountryCode) => {
    if (countryCode === 'ALL') {
      return DEMO_PERSONAS.find((p) => p.jurisdictionCountry === 'ALL') || DEMO_PERSONAS[0];
    }
    return DEMO_PERSONAS.find((p) => p.jurisdictionCountry === countryCode);
  };

  const handleSwitchToCountryPersona = (countryCode: EastAfricaCountryCode) => {
    const persona = getPersonaForCountry(countryCode);
    if (persona && onSwitchPersona) {
      onSwitchPersona(persona);
      setSelectedCountry(countryCode);
    }
  };

  const filteredCloudFunctions = useMemo(() => {
    if (!manifest) return [];
    return manifest.cloudFunctions.filter((fn) => {
      if (domainFilter !== 'all' && fn.domain !== domainFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          fn.functionName.toLowerCase().includes(q) ||
          fn.description.toLowerCase().includes(q) ||
          fn.domain.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [manifest, domainFilter, searchQuery]);

  const handleExportCsv = () => {
    if (!manifest) return;
    if (activeTab === 'country_matrix') {
      downloadCsv(
        'afronala_east_africa_apk_deployment_matrix.csv',
        ['Country Code', 'Country Name', 'Regulator', 'Commission Cap %', 'Speed Limiter Mandated', 'Currency', 'Payment Rail', 'Primary Corridor'],
        EAST_AFRICAN_COUNTRIES_ORDERED.map((code) => {
          const m = EAST_AFRICAN_COUNTRIES_META[code];
          return [
            m.code,
            m.name,
            m.transportRegulator,
            String(m.statutoryCommissionCapPct),
            m.speedLimiterMandate ? 'YES' : 'NO',
            m.currency,
            m.primaryPaymentRail,
            m.corridor,
          ];
        })
      );
    } else if (activeTab === 'packages') {
      downloadCsv(
        'afronala_superapp_packages.csv',
        ['Package Name', 'Path', 'Category', 'Dart Files', 'Total Files', 'Dependencies'],
        manifest.packages.map((p) => [
          p.name,
          p.relativePath,
          p.category,
          p.dartFileCount,
          p.totalFileCount,
          p.dependencies.join(' | '),
        ])
      );
    } else if (activeTab === 'schemas') {
      downloadCsv(
        'afronala_superapp_parse_classes.csv',
        ['Parse Class', 'Admin Bridge Mapping', 'Bridge Mode', 'Domain', 'Extracted Fields', 'Sync Status'],
        manifest.parseClasses.map((c) => [
          c.className,
          c.adminBridgeClass,
          c.bridgeMode,
          c.domain,
          c.extractedFields.join(' | '),
          auditRows[c.className]?.syncStatus || 'Not Audited Yet',
        ])
      );
    } else {
      downloadCsv(
        'afronala_superapp_cloud_functions.csv',
        ['Cloud Function', 'Domain', 'Mutating', 'Allowed Admin Roles', 'Referenced Files'],
        filteredCloudFunctions.map((f) => [
          f.functionName,
          f.domain,
          f.mutating ? 'MUTATING' : 'READ',
          f.requiredRoles.join(' | '),
          f.referencedInFiles.join(' | '),
        ])
      );
    }
    onNotify('CSV Exported', `Exported ${activeTab} contract inventory.`, 'success');
  };

  if (loading || !manifest) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
      </div>
    );
  }

  const sizeMb = (manifest.archiveSizeBytes / (1024 * 1024)).toFixed(2);
  const activeCountryMeta = selectedCountry !== 'ALL' ? EAST_AFRICAN_COUNTRIES_META[selectedCountry] : null;
  const activeCountryProfile = selectedCountry !== 'ALL' ? EAST_AFICA_SAFE_PROFILE(selectedCountry) : null;
  const activeCountryNode = selectedCountry !== 'ALL' ? edgeNodes.find((n) => n.countryCode === selectedCountry) : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Platform Engineering</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{manifest.archiveFileName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{sizeMb} MB Parsed</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-400">
              <Globe className="w-3.5 h-3.5" />
              <span>8 East African Sovereign Corridors</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            SuperApp Monorepo, Multi-Country APK &amp; Cloud RPC Inspector
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleVerifyBackendSync}
            disabled={auditing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
            <span>Verify Parse Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* EAST AFRICAN SOVEREIGN JURISDICTION & LOGGED-IN OPERATOR BAR */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-cyan-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 text-xl">
              {userJurisdiction === 'ET' ? '🇪🇹' :
               userJurisdiction === 'KE' ? '🇰🇪' :
               userJurisdiction === 'RW' ? '🇷🇼' :
               userJurisdiction === 'UG' ? '🇺🇬' :
               userJurisdiction === 'TZ' ? '🇹🇿' :
               userJurisdiction === 'DJ' ? '🇩🇯' :
               userJurisdiction === 'SO' ? '🇸🇴' :
               userJurisdiction === 'SS' ? '🇸🇸' : '🌍'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                  Logged-in Operator Jurisdiction
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                  {userRole}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                <span>{user?.name || 'Operator'}</span>
                <span className="text-xs font-normal text-slate-500">({user?.email || 'authenticated'})</span>
                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">· {userJurisdictionName || 'Pan-East Africa'}</span>
              </h3>
            </div>
          </div>

          {/* Quick Persona Switcher for Country of Operation */}
          {selectedCountry !== (userJurisdiction || 'ALL') && (
            <button
              type="button"
              onClick={() => handleSwitchToCountryPersona(selectedCountry)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors self-start md:self-auto shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                Switch Session Persona to {selectedCountry !== 'ALL' ? EAST_AFRICAN_COUNTRIES_META[selectedCountry]?.name : 'Pan-East Africa'} Operator
              </span>
            </button>
          )}
        </div>

        {/* 8-Country Pill Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Filter SuperApp Inspector by Country of Operation:</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Active: {selectedCountry === 'ALL' ? 'Pan-East Africa (All 8 Nations)' : `${EAST_AFRICAN_COUNTRIES_META[selectedCountry]?.flag} ${EAST_AFRICAN_COUNTRIES_META[selectedCountry]?.name}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCountry('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                selectedCountry === 'ALL'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>🌍</span>
              <span>All 8 Nations</span>
            </button>

            {EAST_AFRICAN_COUNTRIES_ORDERED.map((code) => {
              const meta = EAST_AFRICAN_COUNTRIES_META[code];
              const isSelected = selectedCountry === code;
              const isUserNative = userJurisdiction === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedCountry(code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 relative ${
                    isSelected
                      ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">{meta.flag}</span>
                  <span>{meta.name}</span>
                  {isUserNative && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Your logged-in jurisdiction" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Melos Monorepo Packages</span>
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {manifest.packages.length}
          </p>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
            Dart {manifest.dartSdkConstraint}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Active Sovereign Corridors</span>
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            8 Corridors
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Northern, Central, Berbera &amp; Horn
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Parse Cloud Schemas</span>
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {manifest.parseClasses.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Dual-compatible REST &amp; schema bridge
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Cloud Function RPCs</span>
            <Terminal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {manifest.cloudFunctions.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            + {manifest.cloudJobs.length} scheduled Cloud job
          </p>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('country_matrix')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'country_matrix'
              ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-400 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>East Africa Deployment &amp; APK Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'packages'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Workspace Packages &amp; Mini-Apps
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schemas')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'schemas'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Parse Class Schemas &amp; Sync Audit
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('functions')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'functions'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Cloud Function RPC Bridge ({manifest.cloudFunctions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('back4app_classes')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'back4app_classes'
              ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Back4App Database Classes</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 0: EAST AFRICA DEPLOYMENT & APK MATRIX                             */}
      {/* ===================================================================== */}
      {activeTab === 'country_matrix' && (
        <div className="space-y-6">
          {/* Detailed Active Country Profile (if a specific country is chosen) */}
          {selectedCountry !== 'ALL' && activeCountryMeta && activeCountryProfile && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeCountryMeta.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {activeCountryMeta.name} Deployment Profile
                      </h2>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                        {activeCountryMeta.currency} ({activeCountryMeta.currencySymbol})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Capital: {activeCountryMeta.capital} · Primary Corridor: {activeCountryMeta.corridor}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pingingCountry === selectedCountry}
                    onClick={() => handlePingCountryNode(selectedCountry as Exclude<EastAfricaCountryCode, 'ALL'>)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                  >
                    <Radio className={`w-3.5 h-3.5 ${pingingCountry === selectedCountry ? 'animate-pulse' : ''}`} />
                    <span>{pingingCountry === selectedCountry ? 'Pinging Node...' : 'Ping Country Edge Relay'}</span>
                  </button>
                </div>
              </div>

              {/* 3-Column Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* Column 1: Sovereign Regulatory Rules */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Sovereign Regulatory Mandates</span>
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <p className="text-[11px] text-slate-500">Statutory Commission Ceiling</p>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {activeCountryMeta.statutoryCommissionCapPct}% Maximum Platform Fee
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Supervisory Agency</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {activeCountryMeta.transportRegulator}
                      </p>
                    </div>
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        activeCountryMeta.speedLimiterMandate
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {activeCountryMeta.speedLimiterMandate ? '✓ Speed Limiter Mandated' : 'Speed Limiter Optional'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        activeCountryMeta.evIncentiveActive
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {activeCountryMeta.evIncentiveActive ? '⚡ EV Taxi Priority' : 'Standard Fleet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: In-App Payments & Mobile Money */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Mobile Money &amp; Payout Rails</span>
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <p className="text-[11px] text-slate-500">Integrated Driver Payout Rails</p>
                      <p className="font-bold text-sm text-cyan-700 dark:text-cyan-400">
                        {activeCountryMeta.primaryPaymentRail}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {activeCountryProfile.paymentRails.slice(0, 3).map((r) => (
                        <div key={r.gateway} className="flex items-center justify-between text-[11px]">
                          <span>{r.name} ({r.provider})</span>
                          <span className="font-mono tabular-nums text-slate-500">{r.dailyVolumeLocal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 3: Edge Relay Node & APK Flavor */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Edge Relay Node &amp; APK Flavor</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Relay Online</span>
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <p className="text-[11px] text-slate-500">Regional Edge Node</p>
                      <p className="font-mono text-xs text-slate-900 dark:text-white truncate">
                        {activeCountryNode?.edgeNodeHostname || `${selectedCountry.toLowerCase()}-edge.east1.afronala.internal`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Average Latency</span>
                      <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        {activeCountryNode?.latencyMs || 42} ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>APK Flavor Spec</span>
                      <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                        afronala_{selectedCountry.toLowerCase()}_release.apk
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All 8 Nations Deployment Grid */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pan-East Africa Sovereign Deployment Matrix (8 Nations)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Comparison of regulatory ceilings, mobile payments, and edge latency across all operational countries
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                8 Active Nations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-4">Country &amp; Capital</th>
                    <th className="py-2.5 px-4">Transport Regulator</th>
                    <th className="py-2.5 px-4">Statutory Cap</th>
                    <th className="py-2.5 px-4">In-App Payment Rail</th>
                    <th className="py-2.5 px-4">Primary Corridor</th>
                    <th className="py-2.5 px-4 text-right">Edge Node</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {EAST_AFRICAN_COUNTRIES_ORDERED.map((code) => {
                    const meta = EAST_AFRICAN_COUNTRIES_META[code];
                    const node = edgeNodes.find((n) => n.countryCode === code);
                    const isSelected = selectedCountry === code;
                    const isUserNative = userJurisdiction === code;
                    return (
                      <tr
                        key={code}
                        className={`h-12 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{meta.flag}</span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{meta.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">({code})</span>
                                {isUserNative && (
                                  <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                    Your Role
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {meta.capital} · {meta.currency}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {meta.shortRegulator}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {meta.transportRegulator}
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                            {meta.statutoryCommissionCapPct}%
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {meta.speedLimiterMandate ? 'Speed Limiter Mandated' : 'Optional Telemetry'}
                          </span>
                        </td>

                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {meta.primaryPaymentRail}
                          </div>
                          <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                            Instant Webhook IPN
                          </div>
                        </td>

                        <td className="py-2.5 px-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                          {meta.corridor}
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <div className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                            {node?.latencyMs || 38} ms
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Online</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCountry(code)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Inspect Country
                            </button>
                            <button
                              type="button"
                              disabled={pingingCountry === code}
                              onClick={() => handlePingCountryNode(code)}
                              className="p-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white"
                              title="Ping Node"
                            >
                              <Radio className={`w-3.5 h-3.5 ${pingingCountry === code ? 'animate-spin' : ''}`} />
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: WORKSPACE PACKAGES & MINI-APPS                                */}
      {/* ===================================================================== */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Melos Monorepo Packages ({manifest.workspaceName})
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Country scoped Flutter packages and mini-app terminals across East Africa
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenSourceFile('pubspec.yaml')}
                className="text-xs font-mono text-cyan-700 dark:text-cyan-400 hover:underline"
              >
                Inspect Root pubspec.yaml
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-4">Package &amp; Path</th>
                    <th className="py-2.5 px-4">Layer</th>
                    <th className="py-2.5 px-4">East Africa Role &amp; Dependencies</th>
                    <th className="py-2.5 px-4 text-right">Dart Files</th>
                    <th className="py-2.5 px-4 text-right">Source Reader</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {manifest.packages.map((pkg) => (
                    <tr
                      key={pkg.relativePath}
                      className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {pkg.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {pkg.relativePath}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 capitalize font-medium text-slate-700 dark:text-slate-300">
                        {pkg.category.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-4 max-w-md">
                        <p className="text-slate-800 dark:text-slate-200 truncate">
                          {pkg.description}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {pkg.dependencies.slice(0, 6).join(', ') || 'flutter sdk'}
                        </p>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {pkg.dartFileCount}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={loadingFile}
                            onClick={() => handleOpenSourceFile(`${pkg.relativePath}/pubspec.yaml`)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            pubspec
                          </button>
                          <button
                            type="button"
                            disabled={loadingFile}
                            onClick={() => handleOpenSourceFile(pkg.sampleFile)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                          >
                            <FileCode2 className="w-3 h-3" />
                            <span>Read Dart</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cloud Jobs & UnifiedAppRegistry Descriptors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                UnifiedAppRegistry Mini-App Descriptors
              </h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {manifest.miniAppDescriptors.map((desc) => (
                  <div key={desc.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{desc.title}</p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Roles: {desc.requiredRoles.join(', ')} · Service: {desc.serviceType}
                      </p>
                    </div>
                    <span
                      className={`font-semibold text-[11px] ${
                        desc.enabledByDefault
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {desc.enabledByDefault ? 'Active' : 'Staged'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Parse Cloud Background Jobs &amp; Infrastructure
              </h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {manifest.cloudJobs.map((job) => (
                  <div key={job.name} className="py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {job.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSourceFile(job.filePath)}
                        className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 hover:underline"
                      >
                        Inspect Job Source
                      </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{job.description}</p>
                  </div>
                ))}

                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      Back4AppClient (Multi-Region Retries)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenSourceFile('back4app_client.dart')}
                      className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 hover:underline"
                    >
                      Inspect Client Dart
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Core Flutter HTTP/Parse transport binding /classes/*, /functions/*, and /config with circuit breaker.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PARSE CLASS SCHEMAS & LIVE SYNC AUDIT                         */}
      {/* ===================================================================== */}
      {activeTab === 'schemas' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Flutter SuperApp Parse Classes vs. Live Back4App Environment
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Includes East African sovereign schemas (countryCode, currency, driverLicensePrefix, taxId)
              </p>
            </div>
            <button
              type="button"
              disabled={auditing}
              onClick={handleVerifyBackendSync}
              className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
              <span>Verify Sync</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-4">Flutter Parse Class</th>
                  <th className="py-2.5 px-4">Admin Bridge Mapping</th>
                  <th className="py-2.5 px-4">Extracted Dart Fields</th>
                  <th className="py-2.5 px-4">Live Back4App Status</th>
                  <th className="py-2.5 px-4 text-right">Schema Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {manifest.parseClasses.map((cls) => {
                  const audit = auditRows[cls.className];
                  return (
                    <tr key={cls.className} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {cls.className}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {cls.domain}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-mono text-slate-800 dark:text-slate-200">
                          {cls.adminBridgeClass}
                        </div>
                        <div className="text-[11px] text-cyan-700 dark:text-cyan-400">
                          {cls.bridgeMode}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 max-w-sm">
                        <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate">
                          {cls.extractedFields.join(', ')}
                        </p>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {audit ? (
                          <div>
                            <span
                              className={`font-semibold ${
                                audit.reachableOnBack4App
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {audit.syncStatus}
                            </span>
                            <span className="block text-[10px] font-mono tabular-nums text-slate-500">
                              HTTP {audit.statusCode} · {audit.latencyMs}ms
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">
                            Ready to audit
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {cls.sampleSourceFile && (
                            <button
                              type="button"
                              onClick={() => handleOpenSourceFile(cls.sampleSourceFile!)}
                              className="px-2 py-1 rounded-md text-[11px] font-mono border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Source
                            </button>
                          )}
                          {cls.className !== '_User' && (
                            <button
                              type="button"
                              disabled={provisioningClass === cls.className}
                              onClick={() =>
                                handleProvisionClass(cls.className, cls.extractedFields)
                              }
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                            >
                              {provisioningClass === cls.className ? 'Syncing...' : 'Provision'}
                            </button>
                          )}
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

      {/* ===================================================================== */}
      {/* TAB 3: CLOUD FUNCTION RPC CONSOLE (Country-Aware)                    */}
      {/* ===================================================================== */}
      {activeTab === 'functions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter Cloud Functions (e.g. payout, surge, verify)..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Domains</option>
                <option value="Approvals & Compliance">Approvals &amp; Compliance</option>
                <option value="Fleet, Bidding & Escrow">Fleet, Bidding &amp; Escrow</option>
                <option value="Pricing, Surge & Config">Pricing, Surge &amp; Config</option>
                <option value="Ride & Telemetry">Ride &amp; Telemetry</option>
                <option value="Auth & System">Auth &amp; System</option>
              </select>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredCloudFunctions.map((fn) => {
                const isSelected = selectedRpc?.functionName === fn.functionName;
                return (
                  <button
                    key={fn.functionName}
                    type="button"
                    onClick={() => {
                      setSelectedRpc(fn);
                      const targetCode = rpcCountryTarget || (userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET');
                      setRpcPayloadText(JSON.stringify(getCountrySamplePayload(fn.functionName, targetCode), null, 2));
                      setRpcOutput(null);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-cyan-50/80 dark:bg-cyan-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                        {fn.functionName}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {fn.domain} · Roles: {fn.requiredRoles.join(', ')}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold shrink-0 ${
                        fn.mutating
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {fn.mutating ? 'MUTATE' : 'READ'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live RPC Execution Runner */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            {selectedRpc ? (
              <>
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                      POST /api/back4app/functions/{selectedRpc.functionName}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold ${
                      selectedRpc.mutating ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {selectedRpc.mutating ? 'MUTATING' : 'READ'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {selectedRpc.functionName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {selectedRpc.description}
                  </p>
                </div>

                {/* Country Simulation Picker */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Simulate Country Context</span>
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                      {EAST_AFRICAN_COUNTRIES_META[rpcCountryTarget]?.flag} {EAST_AFRICAN_COUNTRIES_META[rpcCountryTarget]?.name} ({EAST_AFRICAN_COUNTRIES_META[rpcCountryTarget]?.currency})
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {EAST_AFRICAN_COUNTRIES_ORDERED.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleLoadCountryPayload(c)}
                        className={`py-1 px-1.5 rounded text-[10px] font-semibold text-center transition-colors ${
                          rpcCountryTarget === c
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {EAST_AFRICAN_COUNTRIES_META[c].flag} {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    JSON Request Parameters
                  </label>
                  <textarea
                    rows={6}
                    value={rpcPayloadText}
                    onChange={(e) => setRpcPayloadText(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  {selectedRpc.referencedInFiles[0] && (
                    <button
                      type="button"
                      onClick={() => handleOpenSourceFile(selectedRpc.referencedInFiles[0])}
                      className="text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>View Dart Caller</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={runningRpc}
                    onClick={handleInvokeSelectedRpc}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{runningRpc ? 'Invoking RPC...' : 'Invoke Cloud Function'}</span>
                  </button>
                </div>

                {rpcOutput && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {rpcOutput.mode}
                      </span>
                      <span className="tabular-nums text-slate-500">{rpcOutput.latencyMs}ms</span>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] max-h-56 overflow-auto">
                      {JSON.stringify(rpcOutput.data, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: BACK4APP DATABASE CLASSES EXPLORER (With Country Scope)       */}
      {/* ===================================================================== */}
      {activeTab === 'back4app_classes' && (
        <Back4AppDatabaseClassesView
          darkMode={darkMode}
          userRole={userRole}
          userJurisdiction={selectedCountry === 'ALL' ? undefined : selectedCountry}
          userJurisdictionName={selectedCountry !== 'ALL' ? EAST_AFRICAN_COUNTRIES_META[selectedCountry]?.name : 'Pan-East Africa'}
          currentUserName={user?.name}
          currentUserEmail={user?.email}
          assignedCorridors={assignedCorridors}
          onNotify={onNotify}
        />
      )}

      {/* Archive Source Code Viewer Drawer */}
      {fileDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                  Live Read from {manifest.archiveFileName} ({fileDrawer.sizeBytes.toLocaleString()} bytes)
                </span>
                <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
                  {fileDrawer.path}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFileDrawer(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="flex-1 p-4 overflow-auto bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed">
              {fileDrawer.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
