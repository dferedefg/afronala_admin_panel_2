import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DriverDocumentComplianceRecord,
  DriverDocumentType,
  FleetTripCompliance,
  PermissionAction,
  ToastMessage,
} from '../types';
import { back4AppService } from '../services/back4app';
import {
  auditTripCompliance,
  EXPIRY_WARNING_WINDOW_DAYS,
  fleetComplianceService,
  offsetIsoDateFromToday,
  PUMP_PRICE_ETB_PER_LITER,
  summarizeDriverCompliance,
  VEHICLE_FUEL_STANDARDS,
} from '../services/compliance';
import {
  exportDriverComplianceReportPdf,
  exportSingleDriverCompliancePdf,
  exportTripTariffCompliancePdf,
} from '../services/compliancePdf';
import {
  AlertTriangle,
  Bell,
  Car,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Fuel,
  Leaf,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';

interface FleetComplianceViewProps {
  darkMode?: boolean;
  userRole?: string;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify?: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type ComplianceWorkspaceSection = 'driver_scoring' | 'trip_tariff';
type DocFilterMode = 'all' | 'expiring_30d' | 'expired' | 'compliant';
type FleetModuleFilter = 'all' | 'ride' | 'truck';

export const FleetComplianceView: React.FC<FleetComplianceViewProps> = ({
  userRole = 'Super Admin',
  onGuardPermission,
  onNotify,
}) => {
  const [activeSection, setActiveSection] = useState<ComplianceWorkspaceSection>('driver_scoring');

  // Automated Driver Document Compliance State (Back4App-backed)
  const [driverRecords, setDriverRecords] = useState<DriverDocumentComplianceRecord[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [isSyncingAction, setIsSyncingAction] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState<DocFilterMode>('all');
  const [moduleFilter, setModuleFilter] = useState<FleetModuleFilter>('all');

  // Selected Driver Breakdown & Renewal Modal State
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [customRenewalDates, setCustomRenewalDates] = useState<Record<DriverDocumentType, string>>({
    commercial_license: offsetIsoDateFromToday(365),
    bola_inspection: offsetIsoDateFromToday(365),
    third_party_insurance: offsetIsoDateFromToday(365),
    tin_clearance: offsetIsoDateFromToday(365),
  });

  // Trip Fuel & Tariff Regulatory State
  const [records, setRecords] = useState<FleetTripCompliance[]>(() =>
    fleetComplianceService.getRecords()
  );
  const [summary, setSummary] = useState(() => fleetComplianceService.getSummary());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'tariff_exceeded'>('all');

  // New Trip Audit Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [newTripId, setNewTripId] = useState(`TRP${Math.floor(1000 + Math.random() * 9000)}`);
  const [newVehicleType, setNewVehicleType] = useState<'sedan' | 'minibus' | 'cargo_truck'>('sedan');
  const [newPlate, setNewPlate] = useState('AA-2-88192');
  const [newModel, setNewModel] = useState('Toyota Vitz');
  const [newDriver, setNewDriver] = useState('Abebe Kebede');
  const [newDistanceKm, setNewDistanceKm] = useState(12.5);
  const [newDurationMin, setNewDurationMin] = useState(28);
  const [newActualFareETB, setNewActualFareETB] = useState(420);
  const [newCorridor, setNewCorridor] = useState('Bole Medhanealem → Gotera Interchange');

  const loadDriverCompliance = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoadingDocs(true);
    try {
      const fetched = await back4AppService.getDriverComplianceRecords();
      setDriverRecords(fetched);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadDriverCompliance(true);
  }, [loadDriverCompliance]);

  const docSummary = useMemo(() => summarizeDriverCompliance(driverRecords), [driverRecords]);

  const flaggedWithin30dList = useMemo(
    () => driverRecords.filter((r) => r.flaggedWithin30Days),
    [driverRecords]
  );

  const filteredDriverRecords = useMemo(() => {
    return driverRecords.filter((rec) => {
      if (moduleFilter !== 'all' && rec.module !== moduleFilter) return false;
      if (docFilter === 'expiring_30d' && !rec.flaggedWithin30Days) return false;
      if (docFilter === 'expired' && !rec.hasExpiredDocument) return false;
      if (
        docFilter === 'compliant' &&
        (rec.flaggedWithin30Days || rec.hasExpiredDocument)
      ) {
        return false;
      }

      if (!docSearchQuery.trim()) return true;
      const q = docSearchQuery.toLowerCase();
      return (
        rec.driverName.toLowerCase().includes(q) ||
        rec.vehiclePlate.toLowerCase().includes(q) ||
        rec.vehicleModel.toLowerCase().includes(q) ||
        rec.phone.toLowerCase().includes(q) ||
        rec.documents.some((d) => d.documentNumber.toLowerCase().includes(q))
      );
    });
  }, [driverRecords, moduleFilter, docFilter, docSearchQuery]);

  const selectedDriver = useMemo(
    () => driverRecords.find((d) => d.driverId === selectedDriverId) || null,
    [driverRecords, selectedDriverId]
  );

  const openDriverInspector = (record: DriverDocumentComplianceRecord) => {
    const oneYearOut = offsetIsoDateFromToday(365);
    const initialDates: Record<DriverDocumentType, string> = {
      commercial_license: oneYearOut,
      bola_inspection: oneYearOut,
      third_party_insurance: oneYearOut,
      tin_clearance: oneYearOut,
    };
    for (const doc of record.documents) {
      initialDates[doc.docType] = doc.daysRemaining <= 30 ? oneYearOut : doc.expiresAt;
    }
    setCustomRenewalDates(initialDates);
    setSelectedDriverId(record.driverId);
  };

  const canMutateDriverRecord = (module: 'ride' | 'truck', actionLabel: string): boolean => {
    if (!onGuardPermission) return true;
    const requiredPerm: PermissionAction =
      userRole === 'Freight Coordinator' || module === 'truck'
        ? 'manage_freight'
        : 'manage_ride';
    return onGuardPermission(requiredPerm, actionLabel);
  };

  const handleRenewDocument = async (
    record: DriverDocumentComplianceRecord,
    docType: DriverDocumentType,
    targetDate: string
  ) => {
    if (!canMutateDriverRecord(record.module, `Renew ${docType} for ${record.driverName}`)) {
      return;
    }
    setIsSyncingAction(true);
    try {
      const updated = await back4AppService.updateDriverDocumentExpiry({
        driverId: record.driverId,
        objectId: record.objectId,
        phone: record.phone,
        sourceClass: record.sourceClass,
        docType,
        newExpiresAt: targetDate,
      });
      setDriverRecords(updated);
      onNotify?.(
        'Credential Expiry Updated',
        `${record.driverName} compliance score recalculated via Back4App.`,
        'success'
      );
    } finally {
      setIsSyncingAction(false);
    }
  };

  const handleSendReminder = async (targets: DriverDocumentComplianceRecord[]) => {
    if (targets.length === 0) return;
    if (onGuardPermission && userRole === 'Finance Auditor') {
      if (!onGuardPermission('manage_approvals', 'Send compliance renewal reminder')) return;
    }
    setIsSyncingAction(true);
    try {
      const updated = await back4AppService.sendDriverComplianceReminder(
        targets.map((t) => ({
          driverId: t.driverId,
          objectId: t.objectId,
          phone: t.phone,
          driverName: t.driverName,
        }))
      );
      setDriverRecords(updated);
      onNotify?.(
        'Renewal Notice Dispatched',
        targets.length === 1
          ? `30-day document expiry alert sent to ${targets[0].driverName}.`
          : `Sent renewal reminders to ${targets.length} flagged drivers.`,
        'info'
      );
    } finally {
      setIsSyncingAction(false);
    }
  };

  const handleExportDriverComplianceCSV = () => {
    const headers =
      'DriverName,Phone,Module,VehiclePlate,VehicleModel,SourceClass,ComplianceScore,RiskTier,FlaggedWithin30Days,NearestExpiryLabel,NearestExpiryDate,NearestExpiryDays,LicenseExpiry,BolaExpiry,InsuranceExpiry,TinTaxExpiry\n';
    const rows = filteredDriverRecords
      .map((r) => {
        const byType = Object.fromEntries(r.documents.map((d) => [d.docType, d.expiresAt]));
        return `"${r.driverName}","${r.phone}","${r.module}","${r.vehiclePlate}","${r.vehicleModel}","${r.sourceClass}",${r.complianceScore},"${r.riskTier}",${r.flaggedWithin30Days},"${r.nearestExpiryLabel}","${r.nearestExpiryDate}",${r.nearestExpiryDays},"${byType.commercial_license || ''}","${byType.bola_inspection || ''}","${byType.third_party_insurance || ''}","${byType.tin_clearance || ''}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afronala_driver_compliance_scores_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.(
      'Compliance CSV Downloaded',
      `Exported ${filteredDriverRecords.length} driver compliance records.`,
      'success'
    );
  };

  const handleExportDriverCompliancePDF = () => {
    setIsExportingPdf(true);
    try {
      const docFilterLabels: Record<DocFilterMode, string> = {
        all: 'All Standing Tiers',
        expiring_30d: `Flagged <= ${EXPIRY_WARNING_WINDOW_DAYS} Days`,
        expired: 'Expired / Overdue Only',
        compliant: `Cleared (> ${EXPIRY_WARNING_WINDOW_DAYS} Days)`,
      };
      const moduleLabels: Record<FleetModuleFilter, string> = {
        all: 'All Fleet (Ride & Freight)',
        ride: 'Urban Ride-Hailing',
        truck: 'Freight & Logistics',
      };

      const { auditRef } = exportDriverComplianceReportPdf({
        records: filteredDriverRecords,
        allRecordsCount: driverRecords.length,
        userRole,
        docFilterLabel: docFilterLabels[docFilter],
        moduleFilterLabel: moduleLabels[moduleFilter],
        searchQuery: docSearchQuery,
      });

      onNotify?.(
        'Audit PDF Exported',
        `Generated ${auditRef} (${filteredDriverRecords.length} driver records) for offline filing.`,
        'success'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportSingleDriverPDF = (record: DriverDocumentComplianceRecord) => {
    setIsExportingPdf(true);
    try {
      const { auditRef } = exportSingleDriverCompliancePdf(record, userRole);
      onNotify?.(
        'Driver Dossier PDF Exported',
        `Saved statutory verification sheet (${auditRef}) for ${record.driverName}.`,
        'success'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filtered Trip Fuel & Tariff Records
  const filteredRecords = records.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.complianceStatus === statusFilter;
    const matchesSearch =
      r.tripId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.routeCorridor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleRunAudit = () => {
    const newRecord = auditTripCompliance(
      newTripId,
      newVehicleType,
      newPlate,
      newModel,
      newDriver,
      newDistanceKm,
      newDurationMin,
      newActualFareETB,
      newCorridor
    );
    fleetComplianceService.addRecord(newRecord);
    setRecords(fleetComplianceService.getRecords());
    setSummary(fleetComplianceService.getSummary());
    setIsAuditModalOpen(false);
    setNewTripId(`TRP${Math.floor(1000 + Math.random() * 9000)}`);
    onNotify?.('Trip Tariff Audited', `Certified ${newRecord.tripId} against municipal tariff cap.`, 'success');
  };

  const handleExportTripCSV = () => {
    const headers =
      'TripID,VehiclePlate,Model,Type,Driver,DistanceKm,DurationMin,Corridor,FuelLiters,FuelCostETB,CO2Kg,ActualFareETB,LegalMaxETB,Status,Date\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.tripId}","${r.vehiclePlate}","${r.vehicleModel}","${r.vehicleType}","${r.driverName}",${r.distanceKm},${r.durationMin},"${r.routeCorridor}",${r.estimatedFuelLiters},${r.fuelCostETB},${r.co2Kg},${r.actualFareETB},${r.legalMaxFareETB},"${r.complianceStatus}","${r.date}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afronala_fleet_compliance_audit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.(
      'Tariff CSV Downloaded',
      `Exported ${filteredRecords.length} trip tariff audit records.`,
      'success'
    );
  };

  const handleExportTripPDF = () => {
    setIsExportingPdf(true);
    try {
      const { auditRef } = exportTripTariffCompliancePdf({
        records: filteredRecords,
        userRole,
        statusFilterLabel: statusFilter === 'all' ? 'All Audited Trips' : 'Tariff Violations Only',
        searchQuery,
        summary,
      });
      onNotify?.(
        'Tariff Audit PDF Exported',
        `Generated ${auditRef} (${filteredRecords.length} trips) for offline auditing.`,
        'success'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Fleet Operations</span>
            <span aria-hidden="true">·</span>
            <span>Regulatory Governance</span>
            <span aria-hidden="true">·</span>
            <span>Addis Ababa Transport Bureau</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Automated Driver Compliance &amp; Regulatory Audit
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {activeSection === 'driver_scoring' ? (
            <>
              <button
                onClick={() => loadDriverCompliance(true)}
                disabled={isLoadingDocs}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                <span>Sync Back4App</span>
              </button>
              <button
                onClick={handleExportDriverComplianceCSV}
                disabled={isLoadingDocs}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
              <button
                onClick={handleExportDriverCompliancePDF}
                disabled={isLoadingDocs || isExportingPdf}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Generating PDF...' : 'Export Audit PDF'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Audit Trip Tariff</span>
              </button>
              <button
                onClick={handleExportTripCSV}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
              <button
                onClick={handleExportTripPDF}
                disabled={isExportingPdf}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Generating PDF...' : 'Export Audit PDF'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Workspace Mode Segmented Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/90 rounded-lg self-start">
          <button
            onClick={() => setActiveSection('driver_scoring')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeSection === 'driver_scoring'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>
              Driver Document Scoring ({docSummary.flaggedWithin30dDrivers} Flagged ≤ {EXPIRY_WARNING_WINDOW_DAYS}d)
            </span>
          </button>
          <button
            onClick={() => setActiveSection('trip_tariff')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeSection === 'trip_tariff'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Trip Fuel &amp; Municipal Tariff Audit ({summary.totalTrips})</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
          Window threshold: ≤ {EXPIRY_WARNING_WINDOW_DAYS} days · Source: Back4App Driver &amp; DriverProfile
        </p>
      </div>

      {activeSection === 'driver_scoring' ? (
        <div className="space-y-6">
          {/* 4-Column Automated Compliance KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fleet Avg Compliance Score
                </span>
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {docSummary.averageScore}{' '}
                  <span className="text-sm font-normal text-slate-600 dark:text-slate-400">/ 100</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                  Weighted across {docSummary.totalDrivers} active &amp; pending drivers
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Flagged ≤ {EXPIRY_WARNING_WINDOW_DAYS} Days to Expiry
                </span>
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-amber-700 dark:text-amber-400 tabular-nums">
                  {docSummary.flaggedWithin30dDrivers}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                  {docSummary.expiringDocumentsTotal} credentials inside 30-day renewal window
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Expired / Overdue Credentials
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-rose-700 dark:text-rose-400 tabular-nums">
                  {docSummary.expiredDrivers}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {docSummary.expiredDrivers === 0
                    ? 'Zero overdue credentials'
                    : 'Requires renewal before dispatch activation'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fully Cleared (&gt; {EXPIRY_WARNING_WINDOW_DAYS} Days)
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {docSummary.fullyCompliantDrivers}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                  All 4 statutory documents valid &gt; 30 days
                </p>
              </div>
            </div>
          </div>

          {/* 30-Day Expiration Action Banner (Single-elevation, hairline border, no thick left bar) */}
          {flaggedWithin30dList.length > 0 && (
            <div className="p-4 sm:p-5 rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Automated 30-Day Expiration Watchlist Active ({flaggedWithin30dList.length} Drivers Flagged)
                  </h2>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    Drivers with Commercial Licenses, Bola Inspections, 3rd-Party Insurance, or TIN Tax Clearances expiring within {EXPIRY_WARNING_WINDOW_DAYS} days receive automated score deductions.
                    {flaggedWithin30dList[0] && (
                      <span className="font-mono tabular-nums">
                        {' '}
                        Nearest upcoming: {flaggedWithin30dList[0].driverName} ({flaggedWithin30dList[0].nearestExpiryLabel} in{' '}
                        {Math.max(0, flaggedWithin30dList[0].nearestExpiryDays)}d).
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    setDocFilter(docFilter === 'expiring_30d' ? 'all' : 'expiring_30d')
                  }
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-400 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  {docFilter === 'expiring_30d' ? 'Show All Drivers' : 'Isolate Flagged (≤ 30d)'}
                </button>
                <button
                  onClick={() => handleSendReminder(flaggedWithin30dList)}
                  disabled={isSyncingAction}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-700 hover:bg-amber-600 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notify Flagged ({flaggedWithin30dList.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Automated Driver Compliance Scoring Table */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Driver Credential Scoring &amp; 30-Day Expiry Matrix
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Automated 100-point scoring across License (30), Bola (25), Insurance (25), and TIN Tax (20)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search driver, plate, or doc ID..."
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 w-56"
                  />
                </div>

                {/* Risk State Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(
                    [
                      { id: 'all', label: `All (${driverRecords.length})` },
                      {
                        id: 'expiring_30d',
                        label: `Flagged ≤ 30d (${docSummary.flaggedWithin30dDrivers})`,
                      },
                      { id: 'expired', label: `Expired (${docSummary.expiredDrivers})` },
                      { id: 'compliant', label: `Cleared (${docSummary.fullyCompliantDrivers})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDocFilter(tab.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        docFilter === tab.id
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Fleet Module Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(
                    [
                      { id: 'all', label: 'All Fleet' },
                      { id: 'ride', label: 'Ride' },
                      { id: 'truck', label: 'Freight' },
                    ] as const
                  ).map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setModuleFilter(mod.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        moduleFilter === mod.id
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {mod.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                    <th className="py-2.5 pl-3 pr-4">Driver &amp; Fleet Unit</th>
                    <th className="py-2.5 px-4">Automated Score</th>
                    <th className="py-2.5 px-4">Credential Expiry Breakdown (30-Day Rule)</th>
                    <th className="py-2.5 px-4 text-right">Nearest Expiration</th>
                    <th className="py-2.5 pl-4 pr-3 text-right">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {isLoadingDocs ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="py-4 pl-3 pr-4">
                          <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                          <div className="h-3 w-44 bg-slate-100 dark:bg-slate-800/70 rounded" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                          <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800/70 rounded" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-3.5 w-64 bg-slate-100 dark:bg-slate-800/70 rounded" />
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                        </td>
                        <td className="py-4 pl-4 pr-3 text-right">
                          <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredDriverRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          No driver compliance records match the current filter
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Adjust your search query or reset the 30-day risk filter to view the complete fleet roster.
                        </p>
                        <button
                          onClick={() => {
                            setDocFilter('all');
                            setModuleFilter('all');
                            setDocSearchQuery('');
                          }}
                          className="mt-3 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredDriverRecords.map((rec) => {
                      const scoreColorClass =
                        rec.complianceScore >= 85
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : rec.complianceScore >= 60
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-rose-700 dark:text-rose-400';

                      const barColorClass =
                        rec.complianceScore >= 85
                          ? 'bg-emerald-600 dark:bg-emerald-500'
                          : rec.complianceScore >= 60
                          ? 'bg-amber-600 dark:bg-amber-500'
                          : 'bg-rose-600 dark:bg-rose-500';

                      return (
                        <tr
                          key={rec.driverId}
                          className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Driver & Fleet Unit (Unboxed metadata with · separators) */}
                          <td className="py-3.5 pl-3 pr-4 align-top">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {rec.driverName}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                              <span>{rec.vehiclePlate}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-sans">{rec.vehicleModel}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-sans">
                                {rec.module === 'truck' ? 'Freight' : 'Ride'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              <span className="font-mono tabular-nums">{rec.phone}</span>
                              <span aria-hidden="true">·</span>
                              <span>{rec.driverStatus}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{rec.sourceClass}</span>
                            </div>
                          </td>

                          {/* Automated Score & Risk State */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className={`text-sm font-bold font-mono tabular-nums ${scoreColorClass}`}
                              >
                                {rec.complianceScore} / 100
                              </span>
                            </div>
                            <div
                              className="grid grid-cols-10 gap-0.5 w-24 mt-1.5"
                              aria-hidden="true"
                            >
                              {Array.from({ length: 10 }).map((_, segIdx) => {
                                const filled = segIdx < Math.round(rec.complianceScore / 10);
                                return (
                                  <span
                                    key={segIdx}
                                    className={`h-1.5 rounded-xs ${
                                      filled ? barColorClass : 'bg-slate-200 dark:bg-slate-800'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <div className="mt-1.5">
                              {rec.hasExpiredDocument ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                  <span>Expired ({rec.expiredCount})</span>
                                </span>
                              ) : rec.flaggedWithin30Days ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Flagged ≤ 30d ({rec.expiringSoonCount})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Cleared (&gt; 30d)</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Credential Breakdown */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                              {rec.documents.map((doc) => {
                                const isExpiring = doc.expiryState === 'expiring_within_30d';
                                const isExpired = doc.expiryState === 'expired';
                                return (
                                  <div
                                    key={doc.docType}
                                    className="flex items-center justify-between gap-2 py-0.5"
                                  >
                                    <span className="text-slate-700 dark:text-slate-300 truncate">
                                      {doc.shortLabel}:
                                    </span>
                                    {isExpired ? (
                                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-rose-700 dark:text-rose-400 tabular-nums whitespace-nowrap">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        <span>{Math.abs(doc.daysRemaining)}d overdue</span>
                                      </span>
                                    ) : isExpiring ? (
                                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-800 dark:text-amber-300 tabular-nums whitespace-nowrap">
                                        <Clock className="w-3 h-3 shrink-0" />
                                        <span>{doc.daysRemaining}d left</span>
                                      </span>
                                    ) : (
                                      <span className="font-mono text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                                        {doc.daysRemaining}d
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Nearest Expiration */}
                          <td className="py-3.5 px-4 text-right align-top font-mono tabular-nums">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {rec.nearestExpiryDate}
                            </p>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                rec.nearestExpiryDays < 0
                                  ? 'text-rose-700 dark:text-rose-400 font-semibold'
                                  : rec.nearestExpiryDays <= EXPIRY_WARNING_WINDOW_DAYS
                                  ? 'text-amber-800 dark:text-amber-300 font-semibold'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {rec.nearestExpiryLabel} ·{' '}
                              {rec.nearestExpiryDays < 0
                                ? `${Math.abs(rec.nearestExpiryDays)}d ago`
                                : `in ${rec.nearestExpiryDays}d`}
                            </p>
                            {rec.complianceNoticeSentAt && (
                              <p className="text-[10px] font-sans text-slate-600 dark:text-slate-400 mt-0.5">
                                Notice: {rec.complianceNoticeSentAt}
                              </p>
                            )}
                          </td>

                          {/* Governance Actions */}
                          <td className="py-3.5 pl-4 pr-3 text-right align-top">
                            <div className="inline-flex items-center justify-end gap-2">
                              {(rec.flaggedWithin30Days || rec.hasExpiredDocument) && (
                                <button
                                  onClick={() => handleSendReminder([rec])}
                                  disabled={isSyncingAction}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                                >
                                  {rec.complianceNoticeSentAt ? 'Resend Alert' : 'Send Alert'}
                                </button>
                              )}
                              <button
                                onClick={() => openDriverInspector(rec)}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-colors whitespace-nowrap shrink-0"
                              >
                                Score &amp; Renew
                              </button>
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
        </div>
      ) : (
        /* Trip Fuel & Municipal Tariff Audit Section */
        <div className="space-y-6">
          {/* KPI Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tariff Compliance Rate
                </span>
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {summary.complianceRate}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {summary.violationsCount === 0
                    ? 'Zero tariff ceiling breaches'
                    : `${summary.violationsCount} trip fare violation flagged`}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fleet Fuel Consumed
                </span>
                <Fuel className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {summary.totalFuelLiters} L
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                  Pump cost: ETB {summary.totalFuelCostETB.toLocaleString()} (@ {PUMP_PRICE_ETB_PER_LITER} ETB/L)
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estimated CO2 Emissions
                </span>
                <Leaf className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {summary.totalCo2Kg} kg
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  UNEP African transport benchmark
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Total Audited Trips
                </span>
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {summary.totalTrips}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Monitored urban &amp; regional routes
                </p>
              </div>
            </div>
          </div>

          {/* Regulatory Standards Card (Hairline dividers, zero nested bordered boxes) */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Official Addis Ababa City Transport Bureau Regulatory Limits
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Authorized municipal tariff caps and fuel benchmark formulas
                </p>
              </div>
              <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                Directive 2026/04 · Municipal Tariff Schedule
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 pt-4 text-xs">
              <div className="pb-3 md:pb-0 md:pr-5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Metered Sedan Taxi</span>
                </div>
                <div className="mt-2 space-y-1 text-slate-700 dark:text-slate-300 font-mono text-[11px] tabular-nums">
                  <p>Base Fare: ETB {VEHICLE_FUEL_STANDARDS.sedan.baseFareETB}.00</p>
                  <p>Max Per-Km Cap: ETB {VEHICLE_FUEL_STANDARDS.sedan.maxRatePerKmETB}.00 / km</p>
                  <p className="text-slate-600 dark:text-slate-400">Consumption: ~7.2 L / 100km</p>
                </div>
              </div>

              <div className="py-3 md:py-0 md:px-5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Minibus / HiAce Shuttle</span>
                </div>
                <div className="mt-2 space-y-1 text-slate-700 dark:text-slate-300 font-mono text-[11px] tabular-nums">
                  <p>Base Fare: ETB {VEHICLE_FUEL_STANDARDS.minibus.baseFareETB}.00</p>
                  <p>Max Per-Km Cap: ETB {VEHICLE_FUEL_STANDARDS.minibus.maxRatePerKmETB}.00 / km</p>
                  <p className="text-slate-600 dark:text-slate-400">Consumption: ~11.5 L / 100km</p>
                </div>
              </div>

              <div className="pt-3 md:pt-0 md:pl-5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Freight Cargo Truck</span>
                </div>
                <div className="mt-2 space-y-1 text-slate-700 dark:text-slate-300 font-mono text-[11px] tabular-nums">
                  <p>Base Fare: ETB {VEHICLE_FUEL_STANDARDS.cargo_truck.baseFareETB}.00</p>
                  <p>Max Per-Km Cap: ETB {VEHICLE_FUEL_STANDARDS.cargo_truck.maxRatePerKmETB}.00 / km</p>
                  <p className="text-slate-600 dark:text-slate-400">Consumption: ~21.0 L / 100km</p>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Log Table */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Audit Log &amp; Trip Telematics
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Trip-by-trip fuel burn, CO2 emission, and regulatory fare ceiling check
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search trip, plate or driver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 w-52"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Records
                  </button>
                  <button
                    onClick={() => setStatusFilter('tariff_exceeded')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === 'tariff_exceeded'
                        ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Violations
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                    <th className="py-2.5 pl-3 pr-4">Trip &amp; Vehicle</th>
                    <th className="py-2.5 px-4">Corridor &amp; Distance</th>
                    <th className="py-2.5 px-4 text-right">Fuel Burn</th>
                    <th className="py-2.5 px-4 text-right">Fuel Cost</th>
                    <th className="py-2.5 px-4 text-right">CO2 Footprint</th>
                    <th className="py-2.5 px-4 text-right">Actual Fare</th>
                    <th className="py-2.5 px-4 text-right">Legal Max</th>
                    <th className="py-2.5 pl-4 pr-3 text-right">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 pl-3 pr-4">
                        <p className="font-mono font-semibold text-slate-900 dark:text-white">
                          {r.tripId}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {r.vehiclePlate} · {r.vehicleModel}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Driver: {r.driverName}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {r.routeCorridor}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                          {r.distanceKm} km · {r.durationMin} mins · {r.date}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                        {r.estimatedFuelLiters} L
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                        ETB {r.fuelCostETB.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                        {r.co2Kg} kg
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        ETB {r.actualFareETB.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                        ETB {r.legalMaxFareETB.toFixed(2)}
                      </td>
                      <td className="py-3.5 pl-4 pr-3 text-right">
                        {r.complianceStatus === 'compliant' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Compliant</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Ceiling Exceeded</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Driver Automated Score Breakdown & Credential Renewal Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                  <span>{selectedDriver.vehiclePlate}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-sans">{selectedDriver.vehicleModel}</span>
                  <span aria-hidden="true">·</span>
                  <span>Back4App {selectedDriver.sourceClass}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDriver.driverName} — Automated Compliance Audit
                </h3>
              </div>

              <button
                onClick={() => setSelectedDriverId(null)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg"
                aria-label="Close compliance inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Calculation Ledger */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Computed Regulatory Standing
                </p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {selectedDriver.complianceScore} / 100
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {selectedDriver.deductions.length === 0
                    ? 'Base 100 pts preserved — zero expirations within 30 days.'
                    : `Base 100 pts minus ${selectedDriver.deductions.reduce(
                        (s, d) => s + d.points,
                        0
                      )} pts across ${selectedDriver.deductions.length} risk factor(s).`}
                </p>
              </div>

              <div className="space-y-1 text-xs">
                {selectedDriver.deductions.map((ded, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-4 font-mono tabular-nums ${
                      ded.severity === 'critical'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <span className="font-sans">{ded.reason}</span>
                    <span className="font-bold">-{ded.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Statutory Credentials Renewal List */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {selectedDriver.documents.map((doc) => {
                const isFlagged = doc.expiryState === 'expiring_within_30d';
                const isOverdue = doc.expiryState === 'expired';

                return (
                  <div
                    key={doc.docType}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {doc.label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          · {doc.documentNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1 font-mono tabular-nums">
                        <span className="text-slate-700 dark:text-slate-300">
                          Expires: {doc.expiresAt}
                        </span>
                        <span aria-hidden="true">·</span>
                        {isOverdue ? (
                          <span className="text-rose-700 dark:text-rose-400 font-semibold">
                            Overdue by {Math.abs(doc.daysRemaining)}d (-{doc.pointDeduction} pts)
                          </span>
                        ) : isFlagged ? (
                          <span className="text-amber-800 dark:text-amber-300 font-semibold">
                            Flagged: {doc.daysRemaining}d remaining (-{doc.pointDeduction} pts)
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            Valid ({doc.daysRemaining}d remaining · 0 deduction)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="date"
                        aria-label={`New expiry date for ${doc.label}`}
                        value={customRenewalDates[doc.docType] || doc.expiresAt}
                        onChange={(e) =>
                          setCustomRenewalDates((prev) => ({
                            ...prev,
                            [doc.docType]: e.target.value,
                          }))
                        }
                        className="px-2.5 py-1.5 rounded-lg text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() =>
                          handleRenewDocument(
                            selectedDriver,
                            doc.docType,
                            customRenewalDates[doc.docType] || offsetIsoDateFromToday(365)
                          )
                        }
                        disabled={isSyncingAction}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                      >
                        Save Expiry
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSendReminder([selectedDriver])}
                  disabled={isSyncingAction}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Send Renewal Notice</span>
                </button>
                <button
                  onClick={() => handleExportSingleDriverPDF(selectedDriver)}
                  disabled={isExportingPdf}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Export Dossier PDF</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedDriverId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-colors whitespace-nowrap shrink-0"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Trip Tariff Audit Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Audit Trip Tariff &amp; Fuel
              </h3>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Trip Reference ID:
                </label>
                <input
                  type="text"
                  value={newTripId}
                  onChange={(e) => setNewTripId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Vehicle Category:
                  </label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value as 'sedan' | 'minibus' | 'cargo_truck')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="sedan">Sedan Taxi</option>
                    <option value="minibus">Minibus Shuttle</option>
                    <option value="cargo_truck">Cargo Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Plate Number:
                  </label>
                  <input
                    type="text"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Vehicle Model:
                  </label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Driver Name:
                  </label>
                  <input
                    type="text"
                    value={newDriver}
                    onChange={(e) => setNewDriver(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Distance (km):
                  </label>
                  <input
                    type="number"
                    value={newDistanceKm}
                    onChange={(e) => setNewDistanceKm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Duration (min):
                  </label>
                  <input
                    type="number"
                    value={newDurationMin}
                    onChange={(e) => setNewDurationMin(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Fare (ETB):
                  </label>
                  <input
                    type="number"
                    value={newActualFareETB}
                    onChange={(e) => setNewActualFareETB(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Corridor Description:
                </label>
                <input
                  type="text"
                  value={newCorridor}
                  onChange={(e) => setNewCorridor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAudit}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors"
              >
                Certify &amp; Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
