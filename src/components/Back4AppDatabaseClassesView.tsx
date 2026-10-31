import React, { useEffect, useMemo, useState } from 'react';
import {
  Database,
  Layers,
  Search,
  RefreshCw,
  Download,
  FileCode2,
  Table,
  Eye,
  X,
  Copy,
  Check,
  MapPin,
  Link2,
  Shield,
  Truck,
  Car,
  Users,
  Compass,
  Globe2,
  ChevronRight,
  Info,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building2,
  CreditCard,
  Hash,
} from 'lucide-react';
import {
  Back4AppClassDetailResponse,
  Back4AppClassSummary,
  Back4AppUploadedClassesManifest,
  EastAfricaCountryCode,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { downloadCsv } from '../services/rbac';
import { EAST_AFRICAN_COUNTRIES_META } from '../services/eastAfricaModules';

export interface Back4AppDatabaseClassesViewProps {
  darkMode: boolean;
  userRole?: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  currentUserName?: string;
  currentUserEmail?: string;
  assignedCorridors?: string[];
  onNotify?: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type ViewSubTab = 'records' | 'schema' | 'topology';

const EAST_AFRICA_ORDERED_CODES: Array<Exclude<EastAfricaCountryCode, 'ALL'>> = [
  'ET',
  'KE',
  'UG',
  'RW',
  'TZ',
  'DJ',
  'SO',
  'SS',
];

export const Back4AppDatabaseClassesView: React.FC<Back4AppDatabaseClassesViewProps> = ({
  userRole = 'Super Admin',
  userJurisdiction = 'ALL',
  userJurisdictionName = 'Pan-East Africa',
  currentUserName = 'Operator',
  onNotify,
}) => {
  const [manifest, setManifest] = useState<Back4AppUploadedClassesManifest | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('_User');
  const [classDetail, setClassDetail] = useState<Back4AppClassDetailResponse | null>(null);
  const [subTab, setSubTab] = useState<ViewSubTab>('records');

  // Country of operation filter: defaults to the logged-in user's jurisdiction!
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(() => {
    return userJurisdiction || 'ALL';
  });

  // Keep in sync when user persona / jurisdiction switches
  useEffect(() => {
    if (userJurisdiction) {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  // Loading & Action states
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // JSON Drawer Modal
  const [inspectingRecord, setInspectingRecord] = useState<Record<string, any> | null>(null);

  // Fetch Manifest
  const loadManifest = async (showToast = false) => {
    setLoadingManifest(true);
    try {
      const data = await superAppBridgeService.getUploadedClassesManifest();
      setManifest(data);
      if (showToast) {
        onNotify?.(
          'Classes Scanned',
          `Loaded ${data.totalClasses} classes with ${data.totalRecords} records across 8 nations.`,
          'success'
        );
      }
    } catch (err: any) {
      onNotify?.('Inspection Failed', err?.message || 'Unable to scan Back4App CSV classes.', 'error');
    } finally {
      setLoadingManifest(false);
    }
  };

  // Fetch Class Records with country filter
  const loadClassDetail = async (className: string, country: EastAfricaCountryCode) => {
    setLoadingRecords(true);
    try {
      const data = await superAppBridgeService.getUploadedClassRecords(className, country);
      setClassDetail(data);
      setCurrentPage(1);
      setSearchQuery('');
    } catch (err: any) {
      onNotify?.('Class Load Failed', err?.message || `Unable to fetch records for ${className}`, 'error');
    } finally {
      setLoadingRecords(false);
    }
  };

  // Rescan Directory
  const handleRescan = async () => {
    setRescanning(true);
    try {
      const res = await superAppBridgeService.rescanUploadedClasses();
      setManifest(res.manifest);
      await loadClassDetail(selectedClass, selectedCountry);
      onNotify?.(
        'Rescan Complete',
        'Successfully re-indexed Back4App 7 classes from disk with East African country data.',
        'success'
      );
    } catch (err: any) {
      onNotify?.('Rescan Error', err?.message || 'Failed to rescan directory.', 'error');
    } finally {
      setRescanning(false);
    }
  };

  useEffect(() => {
    loadManifest();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassDetail(selectedClass, selectedCountry);
    }
  }, [selectedClass, selectedCountry]);

  // Filtered classes in the selector
  const filteredClasses = useMemo(() => {
    if (!manifest) return [];
    return manifest.classes.filter((c) => {
      if (categoryFilter === 'all') return true;
      return c.category === categoryFilter;
    });
  }, [manifest, categoryFilter]);

  // Filtered rows for current class
  const filteredRows = useMemo(() => {
    if (!classDetail?.records) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return classDetail.records;

    return classDetail.records.filter((row) =>
      Object.entries(row).some(([_, val]) => {
        if (val === null || val === undefined) return false;
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return strVal.toLowerCase().includes(query);
      })
    );
  }, [classDetail, searchQuery]);

  // Pagination slice
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Identity':
        return <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'Customer':
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Mobility (Ride)':
        return <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Logistics (Truck)':
        return <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Database className="w-4 h-4 text-slate-500" />;
    }
  };

  // Helper to extract country from a row
  const getRowCountryMeta = (row: Record<string, any>) => {
    const code = (row.countryCode || 'ET').toUpperCase() as Exclude<EastAfricaCountryCode, 'ALL'>;
    return EAST_AFRICAN_COUNTRIES_META[code] || EAST_AFRICAN_COUNTRIES_META.ET;
  };

  // Type badge styling helper
  const getTypeBadge = (type: string, target?: string) => {
    switch (type) {
      case 'Pointer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Link2 className="w-3 h-3" />
            Pointer&lt;{target || 'Object'}&gt;
          </span>
        );
      case 'GeoPoint':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <MapPin className="w-3 h-3" />
            GeoPoint
          </span>
        );
      case 'Array':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Array[]
          </span>
        );
      case 'Object (JSON)':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Object (JSON)
          </span>
        );
      case 'Boolean':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            Boolean
          </span>
        );
      case 'Date':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Date (ISO)
          </span>
        );
      case 'Number':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Number
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            String
          </span>
        );
    }
  };

  // Render cell value intelligently
  const renderCellValue = (val: any, colName: string) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-400 dark:text-slate-500 italic">null</span>;
    }

    const str = String(val).trim();

    // Country Code column
    if (colName === 'countryCode') {
      const code = str.toUpperCase() as Exclude<EastAfricaCountryCode, 'ALL'>;
      const meta = EAST_AFRICAN_COUNTRIES_META[code];
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
          <span className="text-sm">{meta?.flag || '🌍'}</span>
          <span className="font-mono text-[11px]">{code}</span>
        </span>
      );
    }

    // GeoPoint detection
    if (str.startsWith('{') && str.includes('GeoPoint')) {
      try {
        const parsed = JSON.parse(str);
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
            <MapPin className="w-3 h-3 text-emerald-600" />
            {Number(parsed.latitude).toFixed(4)}, {Number(parsed.longitude).toFixed(4)}
          </span>
        );
      } catch {
        // fallback
      }
    }

    // Pointer detection
    if (str.startsWith('{') && str.includes('Pointer')) {
      try {
        const parsed = JSON.parse(str);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (parsed.className && parsed.className !== selectedClass) {
                setSelectedClass(parsed.className);
              }
            }}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900 px-1.5 py-0.5 rounded transition-colors"
          >
            <Link2 className="w-3 h-3 text-purple-600" />
            <span>
              {parsed.className}:{parsed.objectId?.slice(0, 8)}…
            </span>
          </button>
        );
      } catch {
        // fallback
      }
    }

    // Boolean
    if (str === 'true' || str === 'false') {
      const isTrue = str === 'true';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
            isTrue
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {str}
        </span>
      );
    }

    // JSON array
    if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
            <span>{Array.isArray(parsed) ? `${parsed.length} items: [${parsed.slice(0, 2).join(', ')}${parsed.length > 2 ? '…' : ''}]` : str}</span>
          </span>
        );
      } catch {
        // fallback
      }
    }

    // RoleCodes or Status badges
    if (colName === 'status' || colName === 'onlineStatus' || colName === 'shiftStatus') {
      const isOnline = str === 'online' || str === 'active';
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
          />
          {str}
        </span>
      );
    }

    return <span className="font-mono text-slate-700 dark:text-slate-300">{str}</span>;
  };

  // Copy full record JSON
  const handleCopyJson = (record: Record<string, any>) => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    onNotify?.('Copied to Clipboard', `Record JSON copied successfully.`, 'info');
  };

  // Export current class records to CSV
  const handleExportCsv = () => {
    if (!classDetail?.records || classDetail.records.length === 0) return;
    const cols = classDetail.summary.columns.map((c) => c.name);
    const scopeLabel = selectedCountry === 'ALL' ? 'all_east_africa' : selectedCountry.toLowerCase();
    downloadCsv(
      `afronala_${selectedClass.toLowerCase()}_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`,
      cols,
      classDetail.records.map((r) => cols.map((col) => r[col]))
    );
    onNotify?.(
      'Export Complete',
      `Downloaded ${classDetail.records.length} records for ${selectedClass} (${selectedCountry}) as CSV.`,
      'success'
    );
  };

  // Current class breakdown counts per country
  const currentClassCountryCounts = useMemo(() => {
    if (classDetail?.countryBreakdown) {
      return classDetail.countryBreakdown;
    }
    const currentSummary = manifest?.classes.find((c) => c.className === selectedClass);
    return currentSummary?.countryCounts || {};
  }, [classDetail, manifest, selectedClass]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Back4App Cloud Code Explorer
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
              <span>7 Core Database Classes · Pan-East Africa Schema</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Back4App Database Classes (7 Classes)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Full relational inspection, pointer topology, and schema audit across all 8 East African nations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!classDetail?.records.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-xs whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            <span>Export {selectedClass} CSV</span>
          </button>

          <button
            type="button"
            onClick={handleRescan}
            disabled={rescanning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? 'animate-spin' : ''}`} />
            <span>{rescanning ? 'Re-Indexing Classes...' : 'Re-Index 7 Classes'}</span>
          </button>
        </div>
      </div>

      {/* Operator Jurisdiction Context Card */}
      <div className="p-4 rounded-xl border border-cyan-200/80 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-50/70 via-white to-blue-50/50 dark:from-cyan-950/20 dark:via-slate-900 dark:to-blue-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 text-xl font-bold">
            {userJurisdiction && userJurisdiction !== 'ALL'
              ? EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.flag || '🌍'
              : '🌍'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                Logged In Operator Database Scope
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800">
                {userJurisdictionName || 'Pan-East Africa'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                ({currentUserName} · {userRole})
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              {userJurisdiction && userJurisdiction !== 'ALL' ? (
                <>
                  Inspecting Back4App Parse classes for <strong>{EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.name}</strong> ({EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.shortRegulator}). All records, GPS GeoPoints, and CDL/TIN numbers are scoped to local corridors.
                </>
              ) : (
                <>
                  Unified <strong>Pan-East Africa Multi-Country Database Topology</strong> covering all 8 member states.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-cyan-100 dark:border-cyan-900/40">
          {userJurisdiction && userJurisdiction !== 'ALL' && selectedCountry !== userJurisdiction && (
            <button
              type="button"
              onClick={() => setSelectedCountry(userJurisdiction)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <span>Focus My Station ({EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.flag} {userJurisdiction})</span>
            </button>
          )}

          {selectedCountry !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedCountry('ALL')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Globe2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>View All 8 Nations</span>
            </button>
          )}
        </div>
      </div>

      {/* East African Country Switcher Tabs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
          <span className="font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Select Country of Operation for 7 Database Classes:</span>
          </span>
          <span className="text-[11px] font-mono">
            Class {selectedClass}: {currentClassCountryCounts[selectedCountry] ?? classDetail?.records.length ?? 0} records
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* All East Africa Tab */}
          <button
            type="button"
            onClick={() => setSelectedCountry('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 border ${
              selectedCountry === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm ring-2 ring-cyan-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <span className="text-sm">🌍</span>
            <span>All East Africa</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                selectedCountry === 'ALL'
                  ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {currentClassCountryCounts.ALL ?? manifest?.totalRecords ?? 0}
            </span>
          </button>

          {/* 8 East African Member Countries */}
          {EAST_AFRICA_ORDERED_CODES.map((code) => {
            const meta = EAST_AFRICAN_COUNTRIES_META[code];
            const isSelected = selectedCountry === code;
            const isUserHome = userJurisdiction === code;
            const count = currentClassCountryCounts[code] ?? 0;

            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedCountry(code)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 border relative ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-sm">{meta.flag}</span>
                <span>{meta.name}</span>
                {isUserHome && (
                  <span
                    title="Your Assigned Jurisdiction"
                    className="px-1 py-0.2 rounded text-[9px] uppercase tracking-wider font-bold bg-amber-400 text-slate-950 dark:bg-amber-300 dark:text-slate-950"
                  >
                    You
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-cyan-700 text-white dark:bg-cyan-700 dark:text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Architectural Topology Summary Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-mono">
                Architecture Standard
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Single-Identity Multi-Role Actor Model &amp; Pointer Topology
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mt-1">
              Authentication is anchored in <strong className="font-semibold text-slate-900 dark:text-white">_User</strong>. A single human logs in once and assumes roles dynamically across all 8 East African countries via <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">roleCodes: [&quot;customer&quot;, &quot;driver&quot;, &quot;rideOwner&quot;, &quot;truckOwner&quot;, &quot;truckDispatcher&quot;]</code>. Child classes maintain relational pointers back to <strong className="font-semibold text-slate-900 dark:text-white">_User</strong>, with commercial contracts linked through <strong className="font-semibold text-slate-900 dark:text-white">RideDriver</strong> and cross-border transport coordinated by <strong className="font-semibold text-slate-900 dark:text-white">TruckDispatcher</strong>.
            </p>
          </div>
        </div>

        {/* Pointer Flow Diagram */}
        <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { name: '_User', role: 'Root Identity (Auth & Roles)', ptr: 'Target of 5 Classes' },
            { name: 'Customer', role: 'Riders & Shippers', ptr: '→ _User (user)' },
            { name: 'Driver', role: 'Ride/Truck Operator', ptr: '→ _User, Vehicle' },
            { name: 'RideDriver', role: 'Revenue Split Agreements', ptr: '→ _User, RideOwner' },
            { name: 'RideOwner', role: 'Taxi Fleet Entity', ptr: '→ _User (ownerUserId)' },
            { name: 'TruckDispatcher', role: 'Waybill Corridor Hub', ptr: '→ _User (user)' },
            { name: 'TruckOwner', role: 'Freight Carrier Corp', ptr: '→ _User, Fleet' },
          ].map((item) => (
            <div
              key={item.name}
              onClick={() => setSelectedClass(item.name)}
              className={`cursor-pointer p-2 rounded-lg border text-left transition-all ${
                selectedClass === item.name
                  ? 'bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500 dark:bg-cyan-950/40'
                  : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-cyan-300 dark:hover:border-cyan-700'
              }`}
            >
              <div className="text-[11px] font-mono font-bold text-slate-900 dark:text-white truncate">
                {item.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {item.role}
              </div>
              <div className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                {item.ptr}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class Selector Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Filter by Category:
            </span>
            <div className="flex items-center gap-1">
              {['all', 'Identity', 'Customer', 'Mobility (Ride)', 'Logistics (Truck)'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-cyan-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All (7 Classes)' : cat}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Active Class: <strong className="text-slate-800 dark:text-slate-200">{selectedClass}</strong> ({selectedCountry === 'ALL' ? 'Pan-East Africa' : selectedCountry})
          </span>
        </div>

        {/* 7 Class Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredClasses.map((cls) => {
            const isSelected = selectedClass === cls.className;
            const scopedCount =
              cls.countryCounts && selectedCountry !== 'ALL'
                ? cls.countryCounts[selectedCountry] ?? 0
                : cls.recordCount;

            return (
              <div
                key={cls.className}
                onClick={() => setSelectedClass(cls.className)}
                className={`p-4 rounded-xl border cursor-pointer transition-all text-left relative overflow-hidden ${
                  isSelected
                    ? 'border-cyan-500 bg-white dark:bg-slate-800/90 shadow-md ring-2 ring-cyan-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getCategoryIcon(cls.category)}
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {cls.className}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {cls.category}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    {scopedCount} recs
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {cls.primaryFunction}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{cls.columnCount} columns</span>
                  <span>{cls.outgoingPointers.length} pointers</span>
                  <span>{(cls.fileSizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Detail Inspector Surface */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Class Surface Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  Class: {selectedClass}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedCountry === 'ALL' ? 'Pan-East Africa' : `${EAST_AFRICAN_COUNTRIES_META[selectedCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.flag || ''} ${selectedCountry}`}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({filteredRows.length} displayed records)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {classDetail?.summary?.primaryFunction}
              </p>
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 shrink-0">
            <button
              onClick={() => setSubTab('records')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                subTab === 'records'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Records ({filteredRows.length})</span>
            </button>
            <button
              onClick={() => setSubTab('schema')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                subTab === 'schema'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Schema ({classDetail?.summary?.columnCount || 0})</span>
            </button>
            <button
              onClick={() => setSubTab('topology')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                subTab === 'topology'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Topology</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab 1: Interactive Records Table */}
        {subTab === 'records' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${selectedClass} records in ${selectedCountry === 'ALL' ? 'all 8 nations' : selectedCountry}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-slate-500 font-mono">Page size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Records Data Table */}
            {loadingRecords ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-600" />
                <p className="text-xs font-mono">Parsing Back4App {selectedClass} records...</p>
              </div>
            ) : paginatedRows.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <p className="text-xs">No records matched your search query in {selectedCountry}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        #
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        Nation
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        Inspect
                      </th>
                      {classDetail?.summary?.columns.map((col) => (
                        <th
                          key={col.name}
                          className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300 font-mono"
                        >
                          <div className="flex flex-col">
                            <span>{col.name}</span>
                            <span className="text-[9px] font-normal text-slate-400">
                              {col.type}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {paginatedRows.map((row, idx) => {
                      const absoluteIdx = (currentPage - 1) * pageSize + idx + 1;
                      const rCountry = getRowCountryMeta(row);

                      return (
                        <tr
                          key={row.objectId || `row-${absoluteIdx}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            {absoluteIdx}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                              <span>{rCountry.flag}</span>
                              <span className="font-mono">{rCountry.code}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => setInspectingRecord(row)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900 border border-cyan-200 dark:border-cyan-800 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>JSON</span>
                            </button>
                          </td>
                          {classDetail?.summary?.columns.map((col) => (
                            <td key={col.name} className="py-2.5 px-3 max-w-[260px] truncate">
                              {renderCellValue(row[col.name], col.name)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredRows.length > pageSize && (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
                <span>
                  Showing {paginatedRows.length} of {filteredRows.length} records
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="px-2 font-mono">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab 2: Schema Breakdown */}
        {subTab === 'schema' && (
          <div className="p-4 sm:p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      Column Field Name
                    </th>
                    <th className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      Inferred Parse Type
                    </th>
                    <th className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      Pointer Target
                    </th>
                    <th className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      Non-Null Count
                    </th>
                    <th className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      Sample Values
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {classDetail?.summary?.columns.map((col) => (
                    <tr
                      key={col.name}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {col.name}
                      </td>
                      <td className="py-3 px-3">{getTypeBadge(col.type, col.pointerTarget)}</td>
                      <td className="py-3 px-3 font-mono text-purple-600 dark:text-purple-400">
                        {col.pointerTarget ? (
                          <button
                            onClick={() => setSelectedClass(col.pointerTarget!)}
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>{col.pointerTarget}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {col.nonNullCount}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {col.sampleValues.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Topology Graph */}
        {subTab === 'topology' && (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                Relational Pointers &amp; Foreign Keys Diagram
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Visual map of foreign keys and relational pointers across the 7 Back4App Parse classes operating across East African corridors.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {manifest?.pointerTopology.edges.map((edge, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {edge.source}
                      </span>
                      <span className="text-slate-400 mx-1.5">.</span>
                      <span className="font-mono text-cyan-600 dark:text-cyan-400">{edge.via}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-2" />
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {edge.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* JSON Record Inspector Drawer Modal */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getRowCountryMeta(inspectingRecord).flag}</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    {selectedClass} Record: {inspectingRecord.objectId}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {getRowCountryMeta(inspectingRecord).name} ({getRowCountryMeta(inspectingRecord).code}) Jurisdiction
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyJson(inspectingRecord)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setInspectingRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
                {JSON.stringify(inspectingRecord, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
