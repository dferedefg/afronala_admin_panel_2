import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileCheck2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  PermissionAction,
  SuperAppVerificationItem,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { downloadCsv } from '../services/rbac';

interface SuperAppApprovalsViewProps {
  darkMode: boolean;
  userRole: string;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type QueueTab = 'all' | 'document' | 'vehicle' | 'service_activation' | 'eligibility';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export const SuperAppApprovalsView: React.FC<SuperAppApprovalsViewProps> = ({
  userRole,
  onGuardPermission,
  onNotify,
}) => {
  const [items, setItems] = useState<SuperAppVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<QueueTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SuperAppVerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rpcMode, setRpcMode] = useState<'live-cloud-function' | 'dual-bridge-synthesized'>(
    'dual-bridge-synthesized'
  );
  const [rpcLatency, setRpcLatency] = useState<number>(0);

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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeQueue !== 'all' && item.queue !== activeQueue) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.applicantName.toLowerCase().includes(q) ||
          item.identifierCode.toLowerCase().includes(q) ||
          item.documentOrVehicleLabel.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, activeQueue, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    const pending = items.filter((i) => i.status === 'pending').length;
    const approved = items.filter((i) => i.status === 'approved').length;
    const rejected = items.filter((i) => i.status === 'rejected').length;
    const avgScore =
      items.length > 0
        ? Math.round(items.reduce((s, i) => s + i.eligibilityScore, 0) / items.length)
        : 0;
    return { pending, approved, rejected, avgScore };
  }, [items]);

  const handleDecision = async (
    item: SuperAppVerificationItem,
    decision: 'approved' | 'rejected' | 'reverted'
  ) => {
    if (!onGuardPermission('manage_approvals', `${decision} ${item.id}`)) return;

    if (decision === 'rejected' && !rejectionReason.trim()) {
      onNotify(
        'Rejection Reason Required',
        'Enter a clear compliance rejection note in the inspection drawer before rejecting.',
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
            ? `Verified by ${userRole}`
            : decision === 'rejected'
            ? rejectionReason.trim()
            : 'Reverted to pending queue',
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
        `${item.applicantName} (${item.identifierCode}) updated via ${fnName}.`,
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
      }>('evaluateBatchDriverEligibility', { scope: 'all_pending' });
      setRpcMode(res.executionMode);
      setRpcLatency(res.latencyMs);
      onNotify(
        'Batch Eligibility Evaluated',
        `Evaluated ${res.result?.totalEvaluated ?? items.length} driver & vehicle owner profiles (${res.latencyMs}ms).`,
        'success'
      );
    } catch (err: any) {
      onNotify('Eligibility Check Failed', err?.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      `afronala_superapp_approvals_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Verification ID',
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
    onNotify('CSV Exported', `Downloaded ${filteredItems.length} compliance records.`, 'success');
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

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>SuperApp Governance</span>
            <span aria-hidden="true">·</span>
            <span>Approvals &amp; Eligibility</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-cyan-700 dark:text-cyan-400">
              {rpcMode === 'live-cloud-function' ? 'Live Cloud RPC' : 'Dual-Bridge RPC'} ({rpcLatency}ms)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Document, Vehicle &amp; Role Activation Center
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Awaiting admin_verifyDocument / vehicle review
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Approved &amp; Active</span>
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {counts.approved}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Cleared for UnifiedAppRegistry dispatch
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Rejected / Remediation</span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {counts.rejected}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Blocked until re-upload in Driver / Owner app
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Mean Eligibility Index</span>
            <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {counts.avgScore}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Across KYC, Bola inspection &amp; TIN checks
          </p>
        </div>
      </div>

      {/* Filters & High-Density Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
            {queueLabels.map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => setActiveQueue(q.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  activeQueue === q.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applicant, plate, TIN..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <th className="py-2.5 px-4">ID &amp; Queue</th>
                <th className="py-2.5 px-4">Applicant &amp; Role</th>
                <th className="py-2.5 px-4">Document / Vehicle Verification</th>
                <th className="py-2.5 px-4 text-right">Eligibility</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="h-11 animate-pulse">
                    <td className="px-4 py-2.5" colSpan={6}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No compliance submissions match the current filter
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Driver and Vehicle Owner submissions from the Flutter SuperApp appear here automatically.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQueue('all');
                        setStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {item.id}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                        {item.queue.replace('_', ' ')} · {item.submittedAt}
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.applicantName}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="capitalize">{item.applicantRole.replace('_', ' ')}</span>
                        <span aria-hidden="true">·</span>
                        <span className="uppercase font-mono">{item.serviceType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{item.phone}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.documentOrVehicleLabel}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Ref: {item.identifierCode}
                        {item.missingChecks.length > 0 && (
                          <span className="text-amber-700 dark:text-amber-400 ml-2 font-sans">
                            · {item.missingChecks.length} flag
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {item.eligibilityScore}%
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className={`font-semibold capitalize ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

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
                            title="Revert to pending"
                            className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection & Decision Drawer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                    {selectedItem.id} · {selectedItem.queue.toUpperCase()}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedItem.applicantName}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedItem.applicantRole === 'vehicle_owner'
                      ? 'Vehicle Owner Fleet Operator'
                      : 'Independent SuperApp Driver'}{' '}
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
                    Submitted Artifact
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedItem.documentOrVehicleLabel}
                  </span>
                </div>

                {selectedItem.missingChecks.length > 0 && (
                  <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300">
                    <p className="font-semibold mb-1">Flagged Compliance Checks</p>
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

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Compliance / Rejection Reason (required for rejection)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Specify missing Bola stamp, blurry TIN certificate, or plate mismatch..."
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
                Reject Submission
              </button>
              <button
                type="button"
                disabled={busyId === selectedItem.id}
                onClick={() => handleDecision(selectedItem, 'approved')}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve via Cloud RPC</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
