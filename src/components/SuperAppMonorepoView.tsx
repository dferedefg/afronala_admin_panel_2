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
} from 'lucide-react';
import {
  PermissionAction,
  SuperAppClassSyncAuditRow,
  SuperAppCloudFunctionContract,
  SuperAppMonorepoManifest,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { back4AppService } from '../services/back4app';
import { downloadCsv } from '../services/rbac';
import { Back4AppDatabaseClassesView } from './Back4AppDatabaseClassesView';

interface SuperAppMonorepoViewProps {
  darkMode: boolean;
  userRole: string;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type InspectorTab = 'packages' | 'schemas' | 'functions' | 'back4app_classes';

export const SuperAppMonorepoView: React.FC<SuperAppMonorepoViewProps> = ({
  darkMode,
  onGuardPermission,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('packages');
  const [manifest, setManifest] = useState<SuperAppMonorepoManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');

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
  const [rpcOutput, setRpcOutput] = useState<{
    mode: string;
    latencyMs: number;
    data: any;
  } | null>(null);
  const [runningRpc, setRunningRpc] = useState(false);

  const loadArchiveManifest = async () => {
    setLoading(true);
    try {
      const data = await superAppBridgeService.getMonorepoManifest();
      setManifest(data);
      if (data.cloudFunctions.length > 0) {
        const defaultFn =
          data.cloudFunctions.find((f) => f.functionName === 'getPlatformMetrics') ||
          data.cloudFunctions[0];
        setSelectedRpc(defaultFn);
        setRpcPayloadText(JSON.stringify(defaultFn.samplePayload || {}, null, 2));
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
    if (activeTab === 'packages') {
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
    onNotify('Contract CSV Exported', `Exported ${activeTab} contract inventory.`, 'success');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Platform Engineering</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{manifest.archiveFileName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{sizeMb} MB Parsed Server-Side</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            SuperApp Monorepo, Schema Sync &amp; Cloud RPC Inspector
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
            <span>Verify Backend Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Melos Workspace Packages</span>
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
            <span>Indexed Archive Files</span>
            <Archive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {manifest.totalEntries.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
            {manifest.totalDartFiles.toLocaleString()} Dart source files
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Extracted Parse Classes</span>
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
            <span>Cloud Function Contracts</span>
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

      {/* Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 w-fit">
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
          <span>Back4App Database Classes (7 Classes · 260+ Records)</span>
        </button>
      </div>

      {/* TAB 0: UPLOADED BACK4APP PARSE DATABASE CLASSES */}
      {activeTab === 'back4app_classes' && (
        <Back4AppDatabaseClassesView
          darkMode={darkMode}
          onNotify={onNotify}
        />
      )}

      {/* TAB 1: WORKSPACE PACKAGES & MINI-APP DESCRIPTORS */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Melos Monorepo Packages ({manifest.workspaceName})
              </h2>
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
                    <th className="py-2.5 px-4">Core Dependencies &amp; Screens</th>
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
                Parse Cloud Background Jobs &amp; Core Infrastructure
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
                      Back4AppClient (Circuit Breaker + Retries)
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
                    Core Flutter HTTP/Parse transport binding /classes/*, /functions/*, and /config.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARSE CLASS SCHEMAS & LIVE SYNC AUDIT */}
      {activeTab === 'schemas' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Flutter SuperApp Parse Classes vs. Live Back4App Environment
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Click Verify Backend Sync to probe live Parse Server classes
            </span>
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

      {/* TAB 3: CLOUD FUNCTION RPC CONSOLE */}
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
                  placeholder="Filter Cloud Functions (e.g. payout, bid, verify)..."
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

            <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredCloudFunctions.map((fn) => {
                const isSelected = selectedRpc?.functionName === fn.functionName;
                return (
                  <button
                    key={fn.functionName}
                    type="button"
                    onClick={() => {
                      setSelectedRpc(fn);
                      setRpcPayloadText(JSON.stringify(fn.samplePayload || {}, null, 2));
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
                  <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                    POST /api/back4app/functions/{selectedRpc.functionName}
                  </span>
                  <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {selectedRpc.functionName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {selectedRpc.description}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    JSON Request Parameters
                  </label>
                  <textarea
                    rows={5}
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
                    <span>{runningRpc ? 'Invoking...' : 'Invoke Cloud Function'}</span>
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
