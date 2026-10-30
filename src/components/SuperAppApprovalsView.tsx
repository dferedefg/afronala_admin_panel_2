import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  FileCheck2,
  Globe,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  EastAfricaCountryCode,
  PermissionAction,
  SuperAppVerificationItem,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { downloadCsv } from '../services/rbac';
import { EAST_AFRICA_PROFILES } from '../services/eastAfricaScreens';

interface SuperAppApprovalsViewProps {
  darkMode: boolean;
  userRole: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  userName?: string;
  userEmail?: string;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type QueueTab = 'all' | 'document' | 'vehicle' | 'service_activation' | 'eligibility';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface CountryMeta {
  code: EastAfricaCountryCode;
  name: string;
  nativeName: string;
  flag: string;
  regulatorShort: string;
  regulatorName: string;
  keyDoc: string;
}

const EAST_AFRICA_NATIONS: CountryMeta[] = [
  {
    code: 'ALL',
    name: 'All 8 Nations',
    nativeName: 'Pan-East Africa',
    flag: '🌍',
    regulatorShort: 'EAC / COMESA',
    regulatorName: 'East African Community Unified Transport Governance',
    keyDoc: 'Harmonized Cross-Border Transit Manifest',
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    nativeName: 'ኢትዮጵያ',
    flag: '🇪🇹',
    regulatorShort: 'FTA / AACTB',
    regulatorName: 'Federal Transport Authority & Addis Ababa City Transport Bureau',
    keyDoc: 'Commercial Bola & Grade-3/5 CDL',
  },
  {
    code: 'KE',
    name: 'Kenya',
    nativeName: 'Kenya',
    flag: '🇰🇪',
    regulatorShort: 'NTSA',
    regulatorName: 'National Transport and Safety Authority & KeNHA',
    keyDoc: 'NTSA PSV Badge & Speed Limiter Cert',
  },
  {
    code: 'UG',
    name: 'Uganda',
    nativeName: 'Uganda',
    flag: '🇺🇬',
    regulatorShort: 'MoWT',
    regulatorName: 'Ministry of Works and Transport & Uganda Revenue Authority',
    keyDoc: 'Class B/CM Permit & Fitness Cert',
  },
  {
    code: 'RW',
    name: 'Rwanda',
    nativeName: 'u Rwanda',
    flag: '🇷🇼',
    regulatorShort: 'RURA',
    regulatorName: 'Rwanda Utilities Regulatory Authority & National Police',
    keyDoc: 'Police Contrôle & Smart Meter Badge',
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    nativeName: 'Tanzania',
    flag: '🇹🇿',
    regulatorShort: 'LATRA',
    regulatorName: 'Land Transport Regulatory Authority & TRA',
    keyDoc: 'LATRA VTS Tracker & Commercial CDL',
  },
  {
    code: 'DJ',
    name: 'Djibouti',
    nativeName: 'Jabuuti',
    flag: '🇩🇯',
    regulatorShort: 'DPFZA / MET',
    regulatorName: 'Ministère de l’Équipement et des Transports & DPFZA Port',
    keyDoc: 'Port Access Badge & Carte Rose',
  },
  {
    code: 'SO',
    name: 'Somalia',
    nativeName: 'Soomaaliya',
    flag: '🇸🇴',
    regulatorShort: 'MOTCA',
    regulatorName: 'Ministry of Transport and Civil Aviation',
    keyDoc: 'MOTCA Permit & Port Transit Pass',
  },
  {
    code: 'SS',
    name: 'South Sudan',
    nativeName: 'South Sudan',
    flag: '🇸🇸',
    regulatorShort: 'MoTR / NRA',
    regulatorName: 'Ministry of Transport & National Revenue Authority',
    keyDoc: 'Interstate Concession & Customs Convoy',
  },
];

// Country-specific typical compliance deficiency templates
const COUNTRY_REJECTION_REASONS: Record<string, string[]> = {
  ET: [
    'FTA Annual Commercial Bola inspection stamp missing or unreadable',
    'Addis Ababa City Transport Bureau (AACTB) commercial sticker expired',
    'Federal Tax Identification Number (TIN) certificate missing endorsement',
    'Speed limiter or reflective rear axle sticker photo missing',
  ],
  KE: [
    'NTSA PSV Driver Badge missing valid Police DCI Certificate of Good Conduct',
    'Speed limiter telematics calibration certificate expired (> 12 months)',
    'KeNHA electronic weighbridge certificate ticket omitted',
    'KRA PIN compliance certificate could not be validated via iTax',
  ],
  UG: [
    'MoWT Uganda Class B/CM driving permit renewal overdue',
    'Uganda Revenue Authority (URA) TIN clearance not matched',
    'Certificate of Fitness from MoWT automotive inspection center omitted',
    'Third-party statutory insurance sticker missing stamp',
  ],
  RW: [
    'Police Contrôle Technique annual mechanical inspection certificate expired',
    'RURA Smart Taxi-Meter calibration seal unverified',
    'Rwanda Revenue Authority (RRA) electronic cargo tracking seal (ECTS) pending',
    'Commercial driving license endorsement category mismatch',
  ],
  TZ: [
    'LATRA Vehicle Tracking System (VTS) telematics certificate omitted',
    'Tanzania Revenue Authority (TRA) tax clearance certificate missing for current fiscal year',
    'Tanzania Port Authority (TPA) commercial gate pass unlinked',
    'Police vehicle inspection report overdue',
  ],
  DJ: [
    'DPFZA Doraleh Container Terminal port access credential missing',
    'Ministère de l’Équipement Carte Rose vehicle technical inspection stamp missing',
    'Bilateral Djibouti-Ethiopia cross-border freight transit permit expired',
  ],
  SO: [
    'MOTCA commercial driver permit missing Mogadishu Benadir municipality endorsement',
    'Berbera Port Logistics pass not attached to vehicle registration',
    'Annual municipal commercial road tax sticker missing',
  ],
  SS: [
    'MoTR South Sudan interstate cargo concession permit missing',
    'National Revenue Authority (NRA) Nimule OSBP customs clearance stamp absent',
    'Lifeline highway security convoy manifest incomplete',
  ],
  ALL: [
    'Regulatory document image blurry, cropped, or illegible',
    'License plate characters do not match official vehicle registration card',
    'Insurance policy schedule expired or missing insurer stamp',
    'Driver selfie photo does not match official government identity card',
  ],
};

export const SuperAppApprovalsView: React.FC<SuperAppApprovalsViewProps> = ({
  userRole,
  userJurisdiction = 'ET',
  userJurisdictionName = 'Ethiopia (Headquarters)',
  assignedCorridors = [],
  userName = 'Daniel Ferede',
  userEmail = 'daniel@afronala.com',
  onGuardPermission,
  onNotify,
}) => {
  const [items, setItems] = useState<SuperAppVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<QueueTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(
    userJurisdiction || 'ET'
  );
  const [selectedItem, setSelectedItem] = useState<SuperAppVerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rpcMode, setRpcMode] = useState<'live-cloud-function' | 'dual-bridge-synthesized'>(
    'dual-bridge-synthesized'
  );
  const [rpcLatency, setRpcLatency] = useState<number>(0);

  // Sync to operator jurisdiction if prop changes
  useEffect(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL') {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        allVerifications?: SuperAppVerificationItem[];
        items?: SuperAppVerificationItem[];
      }>('admin_getPendingDocuments', { includeAllQueues: true });

      setRpcMode(res.executionMode);
      setRpcLatency(res.latencyMs);
      const list = res.result?.allVerifications || res.result?.items || [];
      setItems(list);
    } catch (err: any) {
      onNotify('Verification Fetch Error', err?.message || 'Unable to load queues', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  // Compute pending counts per sovereign country
  const countsByCountry = useMemo(() => {
    const map: Record<string, { total: number; pending: number }> = {
      ALL: { total: items.length, pending: items.filter((i) => i.status === 'pending').length },
    };
    for (const c of EAST_AFRICA_NATIONS) {
      if (c.code === 'ALL') continue;
      const cItems = items.filter((i) => (i.countryCode || 'ET') === c.code);
      map[c.code] = {
        total: cItems.length,
        pending: cItems.filter((i) => i.status === 'pending').length,
      };
    }
    return map;
  }, [items]);

  // Filtered by active country, queue, status, and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemCountry = item.countryCode || 'ET';
      if (selectedCountry !== 'ALL' && itemCountry !== selectedCountry) {
        return false;
      }
      if (activeQueue !== 'all' && item.queue !== activeQueue) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.applicantName.toLowerCase().includes(q) ||
          item.identifierCode.toLowerCase().includes(q) ||
          item.documentOrVehicleLabel.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          (item.countryName && item.countryName.toLowerCase().includes(q)) ||
          (item.regulatorShort && item.regulatorShort.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, selectedCountry, activeQueue, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    const list =
      selectedCountry === 'ALL'
        ? items
        : items.filter((i) => (i.countryCode || 'ET') === selectedCountry);
    const pending = list.filter((i) => i.status === 'pending').length;
    const approved = list.filter((i) => i.status === 'approved').length;
    const rejected = list.filter((i) => i.status === 'rejected').length;
    const avgScore =
      list.length > 0
        ? Math.round(list.reduce((s, i) => s + i.eligibilityScore, 0) / list.length)
        : 0;
    return { pending, approved, rejected, avgScore, total: list.length };
  }, [items, selectedCountry]);

  const currentCountryMeta = useMemo(() => {
    return (
      EAST_AFRICA_NATIONS.find((n) => n.code === selectedCountry) || EAST_AFRICA_NATIONS[1]
    );
  }, [selectedCountry]);

  const activeCountryProfile = useMemo(() => {
    if (selectedCountry === 'ALL') return null;
    return EAST_AFRICA_PROFILES[selectedCountry as keyof typeof EAST_AFRICA_PROFILES] || null;
  }, [selectedCountry]);

  const handleDecision = async (
    item: SuperAppVerificationItem,
    decision: 'approved' | 'rejected' | 'reverted'
  ) => {
    if (!onGuardPermission('manage_approvals', `${decision} ${item.id}`)) return;

    if (decision === 'rejected' && !rejectionReason.trim()) {
      onNotify(
        'Rejection Reason Required',
        'Enter a sovereign compliance deficiency note before rejecting this application.',
        'warning'
      );
      setSelectedItem(item);
      return;
    }

    setBusyId(item.id);
    try {
      const fnName =
        decision === 'reverted'
          ? 'revertVehicleVerification'
          : decision === 'rejected'
          ? item.queue === 'vehicle'
            ? 'rejectVehicleVerification'
            : 'rejectDriverRequest'
          : item.queue === 'document'
          ? 'admin_verifyDocument'
          : item.queue === 'vehicle'
          ? 'approveVehicleVerification'
          : 'approveServiceActivation';

      const res = await superAppBridgeService.callCloudFunction<{
        verifications?: SuperAppVerificationItem[];
      }>(fnName, {
        targetId: item.id,
        decision: decision === 'reverted' ? 'pending' : decision,
        reason: rejectionReason.trim() || undefined,
        notes:
          decision === 'approved'
            ? `Verified by ${userRole} (${userName} · ${item.countryCode || 'ET'})`
            : decision === 'rejected'
            ? rejectionReason.trim()
            : 'Reverted to pending queue for re-evaluation',
      });

      setRpcMode(res.executionMode);
      setRpcLatency(res.latencyMs);

      if (res.result?.verifications) {
        setItems(res.result.verifications);
        const updatedTarget = res.result.verifications.find((v) => v.id === item.id) || null;
        if (selectedItem?.id === item.id) {
          setSelectedItem(updatedTarget);
        }
      } else {
        const nextStatus = decision === 'reverted' ? 'pending' : decision;
        setItems((prev) =>
          prev.map((v) => (v.id === item.id ? { ...v, status: nextStatus } : v))
        );
      }

      setRejectionReason('');
      onNotify(
        `Submission ${decision === 'reverted' ? 'Re-Queued' : decision === 'approved' ? 'Approved' : 'Rejected'}`,
        `${item.applicantName} (${item.identifierCode} · ${item.countryCode || 'ET'}) updated via ${fnName}.`,
        decision === 'rejected' ? 'warning' : 'success'
      );
    } catch (err: any) {
      onNotify('Cloud RPC Failed', err?.message || 'Verification action failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleBatchEligibilityCheck = async () => {
    setBusyId('batch-eval');
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        totalEvaluated: number;
      }>('evaluateBatchDriverEligibility', {
        scope: selectedCountry === 'ALL' ? 'all_pending' : `country_${selectedCountry}`,
      });
      setRpcMode(res.executionMode);
      setRpcLatency(res.latencyMs);
      onNotify(
        'Batch Eligibility Evaluated',
        `Evaluated ${res.result?.totalEvaluated ?? filteredItems.length} driver & vehicle owner profiles for ${currentCountryMeta.name} (${res.latencyMs}ms).`,
        'success'
      );
    } catch (err: any) {
      onNotify('Eligibility Check Failed', err?.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    const scopeLabel = selectedCountry === 'ALL' ? 'all_east_africa' : selectedCountry.toLowerCase();
    downloadCsv(
      `afronala_superapp_approvals_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Verification ID',
        'Country Code',
        'Country Name',
        'Regulator',
        'Corridor',
        'Queue',
        'Applicant Name',
        'Role',
        'Phone',
        'Service',
        'Document / Vehicle',
        'Identifier',
        'Eligibility Score',
        'Status',
        'Submitted',
      ],
      filteredItems.map((i) => [
        i.id,
        i.countryCode || 'ET',
        i.countryName || 'Ethiopia',
        i.regulatorShort || 'FTA / AACTB',
        i.corridorName || 'Central Corridor',
        i.queue,
        i.applicantName,
        i.applicantRole,
        i.phone,
        i.serviceType.toUpperCase(),
        i.documentOrVehicleLabel,
        i.identifierCode,
        `${i.eligibilityScore}%`,
        i.status.toUpperCase(),
        i.submittedAt,
      ])
    );
    onNotify('CSV Exported', `Downloaded ${filteredItems.length} compliance records for ${currentCountryMeta.name}.`, 'success');
  };

  const queueLabels: { key: QueueTab; label: string }[] = [
    { key: 'all', label: 'All Queues' },
    { key: 'document', label: 'Identity Documents' },
    { key: 'vehicle', label: 'Vehicle Verifications' },
    { key: 'service_activation', label: 'Service Activations' },
    { key: 'eligibility', label: 'Comprehensive Eligibility' },
  ];

  const getStatusClass = (status: SuperAppVerificationItem['status']) => {
    if (status === 'approved') return 'text-emerald-700 dark:text-emerald-400';
    if (status === 'rejected') return 'text-rose-700 dark:text-rose-400';
    return 'text-amber-700 dark:text-amber-400';
  };

  const getCountryBadge = (code?: string) => {
    const match = EAST_AFRICA_NATIONS.find((n) => n.code === code) || EAST_AFRICA_NATIONS[1];
    return match;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Sovereign KYC &amp; Verification
            </span>
            <span aria-hidden="true">·</span>
            <span>All 8 East African Member States</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-cyan-700 dark:text-cyan-400">
              {rpcMode === 'live-cloud-function' ? 'Live Cloud RPC' : 'Dual-Bridge RPC'} ({rpcLatency}ms)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Driver &amp; Vehicle KYC Compliance Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-border identity validation, commercial transport licenses, vehicle fitness &amp; role activation across EAC &amp; Horn of Africa.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleBatchEligibilityCheck}
            disabled={busyId === 'batch-eval'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busyId === 'batch-eval' ? 'animate-spin' : ''}`} />
            <span>Evaluate Eligibility</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Operator Jurisdiction Context Banner */}
      <div className="p-4 rounded-xl border border-cyan-200/80 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-500/10 via-slate-50 to-emerald-500/5 dark:from-cyan-950/40 dark:via-slate-900 dark:to-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-lg shrink-0">
              {EAST_AFRICA_NATIONS.find((n) => n.code === userJurisdiction)?.flag || '🌍'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Active Operator Jurisdiction:
                </span>
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                  {userJurisdictionName} ({userJurisdiction})
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-medium">
                  {userRole}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  · {userName}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Regulator Authority:
                </span>
                <span className="text-slate-900 dark:text-white font-mono">
                  {currentCountryMeta.regulatorName} ({currentCountryMeta.regulatorShort})
                </span>
                {assignedCorridors.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-md">
                      Corridors: {assignedCorridors.join(' · ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {selectedCountry !== userJurisdiction && (
            <button
              type="button"
              onClick={() => setSelectedCountry(userJurisdiction)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Reset to My Base ({userJurisdiction})</span>
            </button>
          )}
        </div>
      </div>

      {/* East Africa 8-Nation Selector Ribbon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            East African Sovereign Jurisdiction Filter:
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white font-mono">{filteredItems.length}</strong> items in <strong className="text-cyan-700 dark:text-cyan-300">{currentCountryMeta.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {EAST_AFRICA_NATIONS.map((nation) => {
            const isSelected = selectedCountry === nation.code;
            const isUserBase = userJurisdiction === nation.code;
            const cCount = countsByCountry[nation.code] || { total: 0, pending: 0 };

            return (
              <button
                key={nation.code}
                type="button"
                onClick={() => setSelectedCountry(nation.code)}
                className={`relative p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/40 ring-2 ring-cyan-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xl leading-none" role="img" aria-label={nation.name}>
                    {nation.flag}
                  </span>
                  {cCount.pending > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      {cCount.pending}
                    </span>
                  )}
                </div>

                <div className="mt-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {nation.code}
                    </span>
                    {isUserBase && (
                      <span className="text-[9px] px-1 py-0.1 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                        Base
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {nation.name}
                  </p>
                  <p className="text-[9px] font-mono text-cyan-700 dark:text-cyan-400 truncate">
                    {nation.regulatorShort}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Pending Triage</span>
            <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {counts.pending}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {currentCountryMeta.regulatorShort} review queue
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Approved &amp; Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {counts.approved}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Active in driver_app &amp; vehicle_owner
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Flagged / Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {counts.rejected}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Deficiency notices dispatched
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Avg Sovereign Score</span>
            <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {counts.avgScore}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {currentCountryMeta.name} compliance index
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Queue category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          {queueLabels.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => setActiveQueue(q.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                activeQueue === q.key
                  ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 dark:border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Secondary Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by applicant, vehicle plate, phone, document label, corridor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
            {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Verifications Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Jurisdiction &amp; ID</th>
                <th className="py-2.5 px-4">Applicant Profile</th>
                <th className="py-2.5 px-4">Document / Vehicle / Regulator</th>
                <th className="py-2.5 px-4">Trade Corridor</th>
                <th className="py-2.5 px-4 text-right">Score</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3" colSpan={7}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No KYC submissions match current filters for {currentCountryMeta.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Driver and Vehicle Owner verification requests submitted via the Flutter SuperApp across {currentCountryMeta.regulatorName} will appear here.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQueue('all');
                          setStatusFilter('all');
                          setSearchQuery('');
                          setSelectedCountry('ALL');
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
                      >
                        View All 8 Nations
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQueue('all');
                          setStatusFilter('all');
                          setSearchQuery('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const itemCountry = getCountryBadge(item.countryCode);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="h-12 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      {/* Jurisdiction & ID */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none" role="img" aria-label={itemCountry.name}>
                            {itemCountry.flag}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {item.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                          {itemCountry.code} · {item.queue.replace('_', ' ')} · {item.submittedAt}
                        </div>
                      </td>

                      {/* Applicant Profile */}
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.applicantName}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="capitalize">{item.applicantRole.replace('_', ' ')}</span>
                          <span aria-hidden="true">·</span>
                          <span className="uppercase font-mono font-semibold text-cyan-700 dark:text-cyan-400">{item.serviceType}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{item.phone}</span>
                        </div>
                      </td>

                      {/* Document / Vehicle / Regulator */}
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {item.documentOrVehicleLabel}
                        </div>
                        <div className="text-[11px] flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.regulatorShort || itemCountry.regulatorShort}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {item.identifierCode}
                          </span>
                          {item.missingChecks.length > 0 && (
                            <span className="text-amber-700 dark:text-amber-400 font-sans font-medium">
                              · {item.missingChecks.length} flag
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Corridor */}
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                          {item.corridorName || 'National Metropolitan Grid'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.countryName || itemCountry.name}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        <span className={item.eligibilityScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : item.eligibilityScore >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>
                          {item.eligibilityScore}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`font-semibold capitalize ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-2.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {item.status !== 'approved' && (
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleDecision(item, 'approved')}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {item.status !== 'rejected' && (
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => {
                                setSelectedItem(item);
                              }}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                          {item.status !== 'pending' && (
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleDecision(item, 'reverted')}
                              title="Revert to pending queue"
                              className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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

      {/* Sovereign Inspection & Decision Drawer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getCountryBadge(selectedItem.countryCode).flag}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      {selectedItem.id} · {selectedItem.countryCode || 'ET'} · {selectedItem.queue.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {selectedItem.applicantName}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedItem.applicantRole === 'vehicle_owner'
                      ? 'Vehicle Owner Fleet Carrier'
                      : 'SuperApp Commercial Driver'}{' '}
                    · {selectedItem.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Sovereign Authority Banner */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Sovereign Regulatory Mandate
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedItem.regulatorName || getCountryBadge(selectedItem.countryCode).regulatorName}
                  </div>
                  <div className="text-[11px] text-cyan-700 dark:text-cyan-400 mt-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Corridor: {selectedItem.corridorName || 'Cross-Border Highway Corridor'}</span>
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Target Mini-App Service</span>
                  <span className="font-semibold uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    {selectedItem.serviceType}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Identifier / License / Plate</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {selectedItem.identifierCode}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Comprehensive Eligibility</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {selectedItem.eligibilityScore}%
                  </span>
                </div>

                <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">
                    Submitted Regulatory Artifact
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedItem.documentOrVehicleLabel}
                  </span>
                </div>

                {selectedItem.missingChecks.length > 0 && (
                  <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Flagged Sovereign Compliance Checks
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {selectedItem.missingChecks.map((chk) => (
                        <li key={chk}>{chk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedItem.notes && (
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Audit Trail Note</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedItem.notes}
                    </p>
                  </div>
                )}

                {/* Country Quick Deficiency Fill Templates */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Quick Regulatory Deficiency Templates ({selectedItem.countryCode || 'ET'}):
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(
                      COUNTRY_REJECTION_REASONS[selectedItem.countryCode || 'ET'] ||
                      COUNTRY_REJECTION_REASONS.ALL
                    ).map((reason, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReason(reason)}
                        className="px-2 py-1 rounded text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors text-left"
                      >
                        + {reason.slice(0, 48)}...
                      </button>
                    ))}
                  </div>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Compliance Rejection Note (required for rejection):
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Specify missing sovereign authority stamp, expired inspection certificate, unverified plate..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={busyId === selectedItem.id}
                onClick={() => handleDecision(selectedItem, 'rejected')}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                Reject with Note
              </button>
              <button
                type="button"
                disabled={busyId === selectedItem.id}
                onClick={() => handleDecision(selectedItem, 'approved')}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Authorize &amp; Activate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
