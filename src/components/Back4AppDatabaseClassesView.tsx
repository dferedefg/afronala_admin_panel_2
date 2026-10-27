import React, { useEffect, useMemo, useState } from 'react';
import {
  Database,
  Layers,
  Search,
  RefreshCw,
  Download,
  FileCode2,
  ExternalLink,
  Code2,
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
  ChevronRight,
  Info,
  Filter,
  ArrowRight,
} from 'lucide-react';
import {
  Back4AppClassDetailResponse,
  Back4AppClassSummary,
  Back4AppUploadedClassesManifest,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { downloadCsv } from '../services/rbac';

interface Back4AppDatabaseClassesViewProps {
  darkMode: boolean;
  onNotify?: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type ViewSubTab = 'records' | 'schema' | 'topology';

export const Back4AppDatabaseClassesView: React.FC<Back4AppDatabaseClassesViewProps> = ({
  onNotify,
}) => {
  const [manifest, setManifest] = useState<Back4AppUploadedClassesManifest | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('_User');
  const [classDetail, setClassDetail] = useState<Back4AppClassDetailResponse | null>(null);
  const [subTab, setSubTab] = useState<ViewSubTab>('records');

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
        onNotify?.('Classes Scanned', `Loaded ${data.totalClasses} classes with ${data.totalRecords} records.`, 'success');
      }
    } catch (err: any) {
      onNotify?.('Inspection Failed', err?.message || 'Unable to scan Back4App CSV classes.', 'error');
    } finally {
      setLoadingManifest(false);
    }
  };

  // Fetch Class Records
  const loadClassDetail = async (className: string) => {
    setLoadingRecords(true);
    try {
      const data = await superAppBridgeService.getUploadedClassRecords(className);
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
      await loadClassDetail(selectedClass);
      onNotify?.('Rescan Complete', 'Successfully re-indexed Back4App CSV classes from disk.', 'success');
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
      loadClassDetail(selectedClass);
    }
  }, [selectedClass]);

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
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded">
            <Link2 className="w-3 h-3 text-purple-600" />
            {parsed.className}#{String(parsed.objectId).slice(0, 8)}
          </span>
        );
      } catch {
        // fallback
      }
    }

    // JSON objects / arrays
    if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
      const isArr = str.startsWith('[');
      return (
        <span
          className={`inline-block font-mono text-[10px] truncate max-w-[140px] px-1.5 py-0.5 rounded ${
            isArr
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
          }`}
          title={str}
        >
          {str}
        </span>
      );
    }

    // Boolean
    if (str.toLowerCase() === 'true' || str.toLowerCase() === 'false') {
      const isTrue = str.toLowerCase() === 'true';
      return (
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
            isTrue
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          {str}
        </span>
      );
    }

    return <span className="font-mono text-xs text-slate-800 dark:text-slate-200">{str}</span>;
  };

  // Copy JSON to clipboard
  const handleCopyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedJson(true);
    onNotify?.('Copied to Clipboard', 'Full Parse document JSON copied.', 'info');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Export current class records to CSV
  const handleExportCsv = () => {
    if (!classDetail?.records || classDetail.records.length === 0) return;
    const headers = classDetail.summary.columns.map((c) => c.name);
    const rows = classDetail.records.map((r) =>
      headers.map((h) => {
        const val = r[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      })
    );
    downloadCsv(`back4app_${selectedClass}_export.csv`, headers, rows);
    onNotify?.('Export Downloaded', `Exported ${classDetail.records.length} records from ${selectedClass}.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel-light dark:glass-panel-dark rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/80">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Back4App Parse Database Classes
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    7 Classes · {manifest?.totalRecords || 259} Seed Records
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct inspection of production BaaS database schemas, single-identity multi-role actors, and relational pointers in <code className="font-mono text-[11px] text-cyan-700 dark:text-cyan-300">back4app_cloud_code/back4app_classes/</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleRescan}
              disabled={rescanning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors disabled:opacity-50"
              title="Rescan CSV files from directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? 'animate-spin' : ''}`} />
              <span>{rescanning ? 'Rescanning...' : 'Rescan CSVs'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={!classDetail?.records?.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors disabled:opacity-50"
              title="Export current class records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Relational Pointer Topology Banner Card */}
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/50 via-slate-50/30 to-cyan-50/40 dark:from-indigo-950/20 dark:via-slate-900/30 dark:to-cyan-950/20 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                Single-Identity Multi-Role Actor Model &amp; Pointer Topology
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
              Root authentication is centralized in <strong className="font-semibold text-slate-900 dark:text-white">_User</strong>. A single human logs in with one phone/email and dynamically assumes multiple roles via <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">roleCodes: [&quot;customer&quot;, &quot;driver&quot;, &quot;rideOwner&quot;, &quot;truckOwner&quot;]</code>. Child classes store relational pointers back to <strong className="font-semibold text-slate-900 dark:text-white">_User</strong>, with commercial contracts linked through <strong className="font-semibold text-slate-900 dark:text-white">RideDriver</strong> and fleet operations coordinated by <strong className="font-semibold text-slate-900 dark:text-white">TruckDispatcher</strong>.
            </p>
          </div>
        </div>

        {/* Pointer Flow Mini Diagram */}
        <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { name: '_User', role: 'Root Identity (Auth & Roles)', ptr: 'Target of 5 Classes' },
            { name: 'Customer', role: 'Riders & Shippers', ptr: '→ _User (user)' },
            { name: 'Driver', role: 'Ride/Truck Operator', ptr: '→ _User, Vehicle' },
            { name: 'RideDriver', role: 'Revenue Split 80/20', ptr: '→ _User, RideOwner' },
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
                  {cat === 'all' ? 'All (7)' : cat}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Selected: <strong className="text-slate-800 dark:text-slate-200">{selectedClass}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {filteredClasses.map((cls) => {
            const isSelected = selectedClass === cls.className;
            return (
              <button
                key={cls.className}
                onClick={() => setSelectedClass(cls.className)}
                className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="p-1 rounded bg-slate-100 dark:bg-slate-700/60">
                      {getCategoryIcon(cls.category)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {cls.recordCount} rows
                    </span>
                  </div>

                  <h4 className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
                    {cls.className}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {cls.primaryFunction}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{cls.columnCount} columns</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Class Inspection Panel */}
      <div className="glass-panel-light dark:glass-panel-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Panel Header & Sub-Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {selectedClass}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {classDetail?.summary?.fileName || `${selectedClass}.csv`}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  {classDetail?.summary?.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {classDetail?.summary?.primaryFunction}
              </p>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 w-full sm:w-auto">
            <button
              onClick={() => setSubTab('records')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                subTab === 'records'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Record Browser ({filteredRows.length})</span>
            </button>

            <button
              onClick={() => setSubTab('schema')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                subTab === 'schema'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Schema Breakdown ({classDetail?.summary?.columnCount || 0} cols)</span>
            </button>

            <button
              onClick={() => setSubTab('topology')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                subTab === 'topology'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Relational Pointers</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab 1: Record Browser */}
        {subTab === 'records' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Search and Pagination Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${selectedClass} records...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per page</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 px-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
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
                <p className="text-xs">No records matched your search query.</p>
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
                        Action
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
                      return (
                        <tr
                          key={row.objectId || `row-${absoluteIdx}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            {absoluteIdx}
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
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {col.name}
                      </td>
                      <td className="py-2.5 px-3">{getTypeBadge(col.type, col.pointerTarget)}</td>
                      <td className="py-2.5 px-3">
                        {col.pointerTarget ? (
                          <button
                            onClick={() => setSelectedClass(col.pointerTarget!)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline"
                          >
                            <span>{col.pointerTarget}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {col.nonNullCount} / {classDetail.summary.recordCount} (
                        {Math.round((col.nonNullCount / classDetail.summary.recordCount) * 100)}%)
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {col.sampleValues.map((sample, sIdx) => {
                            const strSample =
                              typeof sample === 'object' ? JSON.stringify(sample) : String(sample);
                            return (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-[180px] truncate"
                                title={strSample}
                              >
                                {strSample}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Relational Pointer Mapping */}
        {subTab === 'topology' && (
          <div className="p-4 sm:p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Outgoing Pointers Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/40 dark:bg-slate-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                  <ArrowRight className="w-4 h-4 text-cyan-600" />
                  Outgoing Pointers from {selectedClass}
                </h4>

                {classDetail?.summary?.outgoingPointers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">
                    {selectedClass} does not contain outgoing relational pointers (acts as a root reference class).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {classDetail?.summary?.outgoingPointers.map((ptr, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {selectedClass}.{ptr.sourceColumn}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Points to parent entity in Parse Server
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedClass(ptr.targetClass)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100"
                        >
                          <span>→ {ptr.targetClass}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Incoming Pointers Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/40 dark:bg-slate-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                  <Link2 className="w-4 h-4 text-purple-600" />
                  Incoming Pointers to {selectedClass}
                </h4>

                {classDetail?.summary?.incomingPointers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">
                    No other uploaded classes explicitly point directly to {selectedClass}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {classDetail?.summary?.incomingPointers.map((ptr, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {ptr.sourceClass}.{ptr.sourceColumn}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Refers to objectId in {selectedClass}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedClass(ptr.sourceClass)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                        >
                          <span>{ptr.sourceClass}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* JSON Record Drawer Modal */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {selectedClass} Record: {inspectingRecord.objectId || 'JSON Document'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyJson(inspectingRecord)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setInspectingRecord(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 text-slate-200">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(inspectingRecord, null, 2)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
