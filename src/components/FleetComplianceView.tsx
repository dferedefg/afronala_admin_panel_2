import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DriverDocumentComplianceRecord,
  DriverDocumentType,
  EastAfricaCountryCode,
  FleetTripCompliance,
  PermissionAction,
  ToastMessage,
} from '../types';
import { back4AppService } from '../services/back4app';
import {
  auditTripCompliance,
  CountryRegulatoryAuthorityInfo,
  DOCUMENT_SPECIFICATIONS,
  EAST_AFRICA_REGULATORY_AUTHORITIES,
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
  Compass,
  Download,
  FileCheck2,
  FileText,
  Fuel,
  Globe2,
  Info,
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
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify?: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type ComplianceWorkspaceSection = 'driver_scoring' | 'trip_tariff' | 'cross_border_directives';
type DocFilterMode = 'all' | 'expiring_30d' | 'expired' | 'compliant';
type FleetModuleFilter = 'all' | 'ride' | 'truck';

export const FleetComplianceView: React.FC<FleetComplianceViewProps> = ({
  userRole = 'Super Admin',
  userJurisdiction = 'ET',
  userJurisdictionName,
  assignedCorridors,
  onGuardPermission,
  onNotify,
}) => {
  const [activeSection, setActiveSection] = useState<ComplianceWorkspaceSection>('driver_scoring');
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(() => {
    return userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET';
  });

  // Automatically sync to user's country of operation upon login / persona switch
  useEffect(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL') {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

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

  // Trip & Freight Tariff Regulatory State
  const [records, setRecords] = useState<FleetTripCompliance[]>(() =>
    fleetComplianceService.getRecords()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'tariff_exceeded'>('all');
  const [serviceModuleFilter, setServiceModuleFilter] = useState<'all' | 'ride' | 'truck'>('all');

  // New Trip / Freight Tariff Audit Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditCountry, setAuditCountry] = useState<Exclude<EastAfricaCountryCode, 'ALL'>>('ET');
  const [auditServiceModule, setAuditServiceModule] = useState<'ride' | 'truck'>('ride');
  const [newTripId, setNewTripId] = useState(`TRP${Math.floor(1000 + Math.random() * 9000)}`);
  const [newVehicleType, setNewVehicleType] = useState<'sedan' | 'minibus' | 'cargo_truck'>('sedan');
  const [newCargoWeightTons, setNewCargoWeightTons] = useState<number>(12);
  const [newPlate, setNewPlate] = useState('AA-2-88192');
  const [newModel, setNewModel] = useState('Toyota Vitz');
  const [newDriver, setNewDriver] = useState('Abebe Kebede');
  const [newDistanceKm, setNewDistanceKm] = useState(14.5);
  const [newDurationMin, setNewDurationMin] = useState(32);
  const [newActualFare, setNewActualFare] = useState(480);
  const [newPlatformCommissionPct, setNewPlatformCommissionPct] = useState(15);
  const [newSurgeMultiplier, setNewSurgeMultiplier] = useState(1.0);
  const [newCorridor, setNewCorridor] = useState('Bole Medhanealem → Meskel Square');

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

  // Current Country Authority Info (falls back to Ethiopia if 'ALL' is selected)
  const activeCountryInfo: CountryRegulatoryAuthorityInfo = useMemo(() => {
    if (selectedCountry === 'ALL') {
      return EAST_AFRICA_REGULATORY_AUTHORITIES.ET;
    }
    return EAST_AFRICA_REGULATORY_AUTHORITIES[selectedCountry] || EAST_AFRICA_REGULATORY_AUTHORITIES.ET;
  }, [selectedCountry]);

  // Filter driver records by selected country, risk state, module, and search
  const filteredDriverRecords = useMemo(() => {
    return driverRecords.filter((rec) => {
      if (selectedCountry !== 'ALL' && rec.countryCode !== selectedCountry) {
        return false;
      }
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
        (rec.countryName && rec.countryName.toLowerCase().includes(q)) ||
        (rec.countryCode && rec.countryCode.toLowerCase().includes(q)) ||
        rec.documents.some((d) => d.documentNumber.toLowerCase().includes(q))
      );
    });
  }, [driverRecords, selectedCountry, moduleFilter, docFilter, docSearchQuery]);

  const docSummary = useMemo(() => {
    const list = selectedCountry === 'ALL'
      ? driverRecords
      : driverRecords.filter((r) => r.countryCode === selectedCountry);
    return summarizeDriverCompliance(list);
  }, [driverRecords, selectedCountry]);

  const flaggedWithin30dList = useMemo(
    () => filteredDriverRecords.filter((r) => r.flaggedWithin30Days),
    [filteredDriverRecords]
  );

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
          ? `30-day credential renewal alert sent to ${targets[0].driverName}.`
          : `Sent renewal notices to ${targets.length} flagged drivers across regional hubs.`,
        'info'
      );
    } finally {
      setIsSyncingAction(false);
    }
  };

  const handleExportDriverComplianceCSV = () => {
    const headers =
      'Country,CountryCode,DriverName,Phone,Module,VehiclePlate,VehicleModel,SourceClass,ComplianceScore,RiskTier,FlaggedWithin30Days,NearestExpiryLabel,NearestExpiryDate,NearestExpiryDays,LicenseExpiry,InspectionExpiry,InsuranceExpiry,TaxClearanceExpiry\n';
    const rows = filteredDriverRecords
      .map((r) => {
        const byType = Object.fromEntries(r.documents.map((d) => [d.docType, d.expiresAt]));
        return `"${r.countryName || 'Ethiopia'}","${r.countryCode || 'ET'}","${r.driverName}","${r.phone}","${r.module}","${r.vehiclePlate}","${r.vehicleModel}","${r.sourceClass}",${r.complianceScore},"${r.riskTier}",${r.flaggedWithin30Days},"${r.nearestExpiryLabel}","${r.nearestExpiryDate}",${r.nearestExpiryDays},"${byType.commercial_license || ''}","${byType.bola_inspection || ''}","${byType.third_party_insurance || ''}","${byType.tin_clearance || ''}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afronala_driver_compliance_${selectedCountry.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.(
      'Compliance CSV Downloaded',
      `Exported ${filteredDriverRecords.length} driver compliance records for ${selectedCountry === 'ALL' ? 'East Africa Region' : activeCountryInfo.countryName}.`,
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

      const scopeTag = selectedCountry === 'ALL' ? 'All East Africa Hubs' : activeCountryInfo.countryName;
      const { auditRef } = exportDriverComplianceReportPdf({
        records: filteredDriverRecords,
        allRecordsCount: driverRecords.length,
        userRole: `${userRole} (${scopeTag})`,
        docFilterLabel: docFilterLabels[docFilter],
        moduleFilterLabel: moduleLabels[moduleFilter],
        searchQuery: docSearchQuery,
      });

      onNotify?.(
        'Audit PDF Exported',
        `Generated ${auditRef} (${filteredDriverRecords.length} driver records) for ${scopeTag}.`,
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
        `Saved statutory verification sheet (${auditRef}) for ${record.driverName} (${record.countryName || 'Ethiopia'}).`,
        'success'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filtered Trip & Freight Tariff Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedCountry !== 'ALL' && r.countryCode !== selectedCountry) {
        return false;
      }
      if (serviceModuleFilter !== 'all') {
        const isTruck = r.serviceModule === 'truck' || r.vehicleType === 'cargo_truck';
        if (serviceModuleFilter === 'truck' && !isTruck) return false;
        if (serviceModuleFilter === 'ride' && isTruck) return false;
      }
      const matchesStatus = statusFilter === 'all' || r.complianceStatus === statusFilter;
      const matchesSearch =
        r.tripId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.routeCorridor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.regulatoryAuthority && r.regulatoryAuthority.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [records, selectedCountry, statusFilter, serviceModuleFilter, searchQuery]);

  const tripSummary = useMemo(() => {
    const list = filteredRecords;
    const totalTrips = list.length;
    const compliantCount = list.filter((r) => r.complianceStatus === 'compliant').length;
    const violationsCount = list.filter((r) => r.complianceStatus === 'tariff_exceeded').length;
    const commissionCompliantCount = list.filter(
      (r) => r.commissionCompliance !== 'commission_exceeded'
    ).length;
    const commissionAdherenceRate =
      totalTrips > 0 ? Math.round((commissionCompliantCount / totalTrips) * 100) : 100;
    const rideTripsCount = list.filter(
      (r) => r.serviceModule !== 'truck' && r.vehicleType !== 'cargo_truck'
    ).length;
    const freightTrucksCount = list.filter(
      (r) => r.serviceModule === 'truck' || r.vehicleType === 'cargo_truck'
    ).length;
    const totalFuelLiters = list.reduce((acc, r) => acc + r.estimatedFuelLiters, 0);
    const totalFuelCostETB = list.reduce((acc, r) => acc + r.fuelCostETB, 0);
    const totalCo2Kg = list.reduce((acc, r) => acc + r.co2Kg, 0);

    return {
      totalTrips,
      complianceRate: totalTrips > 0 ? Math.round((compliantCount / totalTrips) * 100) : 100,
      violationsCount,
      commissionAdherenceRate,
      rideTripsCount,
      freightTrucksCount,
      totalFuelLiters: Math.round(totalFuelLiters * 10) / 10,
      totalFuelCostETB: Math.round(totalFuelCostETB),
      totalCo2Kg: Math.round(totalCo2Kg * 10) / 10,
    };
  }, [filteredRecords]);

  // When opening audit modal, pre-select audit country to match current tab or user's jurisdiction
  const handleOpenAuditModal = () => {
    const initialCountry = selectedCountry === 'ALL'
      ? (userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET')
      : selectedCountry;
    setAuditCountry(initialCountry);
    const info = EAST_AFRICA_REGULATORY_AUTHORITIES[initialCountry];
    setNewTripId(`TRP-${initialCountry}-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewCorridor(info.defaultCorridors[0] || 'Urban Central Logistics Corridor');
    setNewPlatformCommissionPct(info.rideCommissionCapPct || 15);
    setIsAuditModalOpen(true);
  };

  const handleAuditCountryChange = (cCode: Exclude<EastAfricaCountryCode, 'ALL'>) => {
    setAuditCountry(cCode);
    const info = EAST_AFRICA_REGULATORY_AUTHORITIES[cCode];
    setNewTripId(`TRP-${cCode}-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewCorridor(info.defaultCorridors[0] || 'Trade Corridor');
    setNewPlatformCommissionPct(info.rideCommissionCapPct || 15);
    if (cCode === 'KE') {
      setNewPlate('KDA-219P');
      setNewDriver('James Mwangi');
      setNewActualFare(info.standards[newVehicleType].baseFare + newDistanceKm * info.standards[newVehicleType].standardRatePerKm);
    } else if (cCode === 'UG') {
      setNewPlate('UBA-331K');
      setNewDriver('John Okello');
      setNewActualFare(info.standards[newVehicleType].baseFare + newDistanceKm * info.standards[newVehicleType].standardRatePerKm);
    } else if (cCode === 'RW') {
      setNewPlate('RAD-442B');
      setNewDriver('Jean-Paul Habimana');
      setNewActualFare(info.standards[newVehicleType].baseFare + newDistanceKm * info.standards[newVehicleType].standardRatePerKm);
    } else if (cCode === 'TZ') {
      setNewPlate('T-381-DKS');
      setNewDriver('Juma Rashid');
      setNewActualFare(info.standards[newVehicleType].baseFare + newDistanceKm * info.standards[newVehicleType].standardRatePerKm);
    } else if (cCode === 'DJ') {
      setNewPlate('DJ-1922-A');
      setNewDriver('Mohamed Farah');
      setNewActualFare(info.standards[newVehicleType].baseFare + newDistanceKm * info.standards[newVehicleType].standardRatePerKm);
    } else if (cCode === 'SO') {
      setNewPlate('MOG-4419');
      setNewDriver('Hassan Warsame');
      setNewActualFare(info.standards[newVehicleType].baseFare + newDistanceKm * info.standards[newVehicleType].standardRatePerKm);
    } else if (cCode === 'SS') {
      setNewPlate('SSD-1192-A');
      setNewDriver('Deng Garang');
      setNewActualFare(info.standards[newVehicleType].baseFare + newDistanceKm * info.standards[newVehicleType].standardRatePerKm);
    } else {
      setNewPlate('AA-2-88192');
      setNewDriver('Abebe Kebede');
      setNewActualFare(info.standards[newVehicleType].baseFare + newDistanceKm * info.standards[newVehicleType].standardRatePerKm);
    }
  };

  const handleRunAudit = () => {
    const newRecord = auditTripCompliance(
      newTripId,
      newVehicleType,
      newPlate,
      newModel,
      newDriver,
      newDistanceKm,
      newDurationMin,
      newActualFare,
      newCorridor,
      auditCountry,
      {
        serviceModule: auditServiceModule,
        cargoWeightTons: auditServiceModule === 'truck' ? newCargoWeightTons : undefined,
        platformCommissionPct: newPlatformCommissionPct,
        surgeMultiplierApplied: newSurgeMultiplier,
      }
    );
    fleetComplianceService.addRecord(newRecord);
    setRecords(fleetComplianceService.getRecords());
    setIsAuditModalOpen(false);
    onNotify?.(
      'Rate Audit Certified',
      `Audited ${newRecord.tripId} (${newRecord.serviceModule === 'truck' ? 'Freight Haul' : 'Ride'}) under ${newRecord.regulatoryAuthority} statutory rate schedule.`,
      newRecord.complianceStatus === 'compliant' ? 'success' : 'warning'
    );
  };

  const handleExportTripCSV = () => {
    const headers =
      'TripID,Module,Country,CountryCode,RegulatoryAuthority,VehiclePlate,Model,Driver,DistanceKm,DurationMin,Tonnage,Corridor,ActualFareLocal,ActualFareETB,LegalMaxLocal,LegalMaxETB,Currency,CommissionPct,CommissionCapPct,VariancePct,Status,Date\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.tripId}","${r.serviceModule || (r.vehicleType === 'cargo_truck' ? 'truck' : 'ride')}","${r.countryCode || 'ET'}","${r.countryCode || 'ET'}","${r.regulatoryAuthority || 'FTA'}","${r.vehiclePlate}","${r.vehicleModel}","${r.driverName}",${r.distanceKm},${r.durationMin},${r.cargoWeightTons || ''},"${r.routeCorridor}",${r.actualFareLocal ?? r.actualFareETB},${r.actualFareETB},${r.legalMaxFareLocal ?? r.legalMaxFareETB},${r.legalMaxFareETB},"${r.currency || 'ETB'}",${r.platformCommissionPct ?? 15},${r.platformCommissionCapPct ?? 15},${r.variancePct ?? 0},"${r.complianceStatus}","${r.date}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afronala_tariff_compliance_${selectedCountry.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.(
      'Tariff CSV Downloaded',
      `Exported ${filteredRecords.length} ride and truck tariff compliance records for ${selectedCountry === 'ALL' ? 'East Africa' : activeCountryInfo.countryName}.`,
      'success'
    );
  };

  const handleExportTripPDF = () => {
    setIsExportingPdf(true);
    try {
      const scopeLabel = selectedCountry === 'ALL' ? 'East Africa Region' : activeCountryInfo.countryName;
      const { auditRef } = exportTripTariffCompliancePdf({
        records: filteredRecords,
        userRole: `${userRole} (${scopeLabel})`,
        statusFilterLabel: statusFilter === 'all' ? 'All Rate Records' : 'Ceiling Breaches Only',
        searchQuery,
        countryScope: scopeLabel,
        summary: tripSummary,
      });
      onNotify?.(
        'Tariff Audit PDF Exported',
        `Generated ${auditRef} (${filteredRecords.length} records) for ${scopeLabel}.`,
        'success'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const countriesList: {
    code: EastAfricaCountryCode;
    label: string;
    flag: string;
    authority: string;
    currency: string;
  }[] = [
    { code: 'ALL', label: 'All East Africa', flag: '🌍', authority: 'EAC / IGAD', currency: 'Multi-FX' },
    { code: 'ET', label: 'Ethiopia', flag: '🇪🇹', authority: 'FTA / Bola', currency: 'ETB' },
    { code: 'KE', label: 'Kenya', flag: '🇰🇪', authority: 'NTSA / EPRA', currency: 'KES' },
    { code: 'UG', label: 'Uganda', flag: '🇺🇬', authority: 'MoWT / UNBS', currency: 'UGX' },
    { code: 'RW', label: 'Rwanda', flag: '🇷🇼', authority: 'RURA / RNP', currency: 'RWF' },
    { code: 'TZ', label: 'Tanzania', flag: '🇹🇿', authority: 'LATRA / EWURA', currency: 'TZS' },
    { code: 'DJ', label: 'Djibouti', flag: '🇩🇯', authority: 'DTT / Port', currency: 'DJF' },
    { code: 'SO', label: 'Somalia', flag: '🇸🇴', authority: 'MoTCA', currency: 'USD' },
    { code: 'SS', label: 'South Sudan', flag: '🇸🇸', authority: 'MoTR', currency: 'SSP' },
  ];

  // Live telemetry counts aggregated by jurisdiction
  const jurisdictionStats = useMemo(() => {
    const stats: Record<EastAfricaCountryCode, { trips: number; drivers: number; violations: number }> = {
      ALL: {
        trips: records.length,
        drivers: driverRecords.length,
        violations: records.filter((r) => r.complianceStatus === 'tariff_exceeded').length,
      },
      ET: { trips: 0, drivers: 0, violations: 0 },
      KE: { trips: 0, drivers: 0, violations: 0 },
      UG: { trips: 0, drivers: 0, violations: 0 },
      RW: { trips: 0, drivers: 0, violations: 0 },
      TZ: { trips: 0, drivers: 0, violations: 0 },
      DJ: { trips: 0, drivers: 0, violations: 0 },
      SO: { trips: 0, drivers: 0, violations: 0 },
      SS: { trips: 0, drivers: 0, violations: 0 },
    };

    records.forEach((r) => {
      const c = (r.countryCode || 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>;
      if (stats[c]) {
        stats[c].trips += 1;
        if (r.complianceStatus === 'tariff_exceeded') {
          stats[c].violations += 1;
        }
      }
    });

    driverRecords.forEach((d) => {
      const c = (d.countryCode || 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>;
      if (stats[c]) {
        stats[c].drivers += 1;
      }
    });

    return stats;
  }, [records, driverRecords]);

  const handleSelectCountry = (code: EastAfricaCountryCode) => {
    setSelectedCountry(code);
    const countryName =
      code === 'ALL'
        ? 'All East Africa (8 Nations)'
        : EAST_AFRICA_REGULATORY_AUTHORITIES[code]?.countryName || code;
    onNotify?.(
      'Jurisdiction Filter Active',
      `Displaying tariff, freight ceilings, and compliance data for ${countryName}.`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Fleet Operations</span>
            <span aria-hidden="true">·</span>
            <span>Cross-Border Regulatory Governance</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {selectedCountry === 'ALL'
                ? 'East Africa 8-Nation Transport Regulatory Standards'
                : `${activeCountryInfo.flag} ${activeCountryInfo.authorityName}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tariff &amp; Regulatory Rate Compliance
            </h1>
            {userJurisdiction && userJurisdiction !== 'ALL' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 flex items-center gap-1">
                <span>{EAST_AFRICA_REGULATORY_AUTHORITIES[userJurisdiction]?.flag || '🌍'}</span>
                <span>Operating Hub: {userJurisdictionName || EAST_AFRICA_REGULATORY_AUTHORITIES[userJurisdiction]?.countryName}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Statutory metered ride-hailing fares, freight ton-km price ceilings, and platform commission caps across 8 East African nations
          </p>
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
          ) : activeSection === 'trip_tariff' ? (
            <>
              <button
                onClick={handleOpenAuditModal}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Audit Ride / Truck Tariff</span>
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
                <span>{isExportingPdf ? 'Generating PDF...' : 'Export Tariff PDF'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveSection('trip_tariff')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Audit Corridors</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* JURISDICTIONAL FILTER CONSOLE (East Africa 8-Nation Selector)       */}
      {/* ==================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Jurisdictional Tariff &amp; Regulatory Filter
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  8 Member States
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toggle between East African countries to dynamically filter national tariff ceilings, freight models, and compliance dossiers
              </p>
            </div>
          </div>

          {/* Quick Dropdown Selector for Rapid Access */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="jurisdiction-select" className="text-xs font-medium text-slate-600 dark:text-slate-400 sr-only">
              Select Jurisdiction
            </label>
            <div className="relative">
              <select
                id="jurisdiction-select"
                value={selectedCountry}
                onChange={(e) => handleSelectCountry(e.target.value as EastAfricaCountryCode)}
                className="pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                {countriesList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label} {c.code !== 'ALL' ? `(${c.currency})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {userJurisdiction && userJurisdiction !== 'ALL' && selectedCountry !== userJurisdiction && (
              <button
                type="button"
                onClick={() => handleSelectCountry(userJurisdiction)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
                title={`Reset to assigned hub: ${userJurisdictionName || userJurisdiction}`}
              >
                Reset to {userJurisdiction} Hub
              </button>
            )}
          </div>
        </div>

        {/* 9 Interactive Country Filter Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {countriesList.map((c) => {
            const isSelected = selectedCountry === c.code;
            const stats = jurisdictionStats[c.code] || { trips: 0, drivers: 0, violations: 0 };
            const isHomeHub = userJurisdiction === c.code && c.code !== 'ALL';

            return (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelectCountry(c.code)}
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-cyan-600 dark:border-cyan-600 shadow-md ring-2 ring-cyan-500/30'
                    : 'bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xl leading-none">{c.flag}</span>
                  <div className="flex items-center gap-1">
                    {isHomeHub && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-cyan-300' : 'bg-cyan-500'
                        }`}
                        title="Assigned Operating Hub"
                      />
                    )}
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c.code}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {c.label}
                  </p>
                  <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    {c.currency} · {c.authority}
                  </p>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}>
                    {stats.trips} {stats.trips === 1 ? 'trip' : 'trips'}
                  </span>
                  {stats.violations > 0 ? (
                    <span className={`font-semibold ${isSelected ? 'text-rose-200' : 'text-rose-600 dark:text-rose-400'}`}>
                      {stats.violations} err
                    </span>
                  ) : (
                    <span className={isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}>
                      ✓ OK
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Regulatory Jurisdiction Context Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <span className="text-xl shrink-0">{activeCountryInfo.flag}</span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedCountry === 'ALL'
                  ? 'East Africa Inter-State Transport Corridor Standards (All 8 Nations)'
                  : `${activeCountryInfo.authorityName} · ${activeCountryInfo.directiveCode}`}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-mono text-[11px]">
                {activeCountryInfo.shortAuthority} Statutory Directive
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[11px]">
                Commission Cap ≤ {activeCountryInfo.rideCommissionCapPct}%
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5">
              Ride Wait Rate: {activeCountryInfo.currency} {activeCountryInfo.rideWaitMinRate}/min · Freight Ceiling: {activeCountryInfo.currency} {activeCountryInfo.truckTonKmRate}/ton-km · {activeCountryInfo.truckWeighbridgeDirective}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono text-[11px] tabular-nums text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
            <Scale className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Max Surge: {activeCountryInfo.maxSurgeMultiplierCap}x</span>
          </div>
          <span aria-hidden="true">·</span>
          <span>1 {activeCountryInfo.currency} ≈ {activeCountryInfo.exchangeRateToETB} ETB</span>
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
              Driver Credential Scoring ({docSummary.flaggedWithin30dDrivers} Flagged ≤ {EXPIRY_WARNING_WINDOW_DAYS}d)
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
            <span>Trip &amp; Freight Rate Compliance Audit ({tripSummary.totalTrips})</span>
          </button>
          <button
            onClick={() => setActiveSection('cross_border_directives')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeSection === 'cross_border_directives'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Cross-Border Tariff Schedules &amp; Directives</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
          Scope: {selectedCountry === 'ALL' ? '8 East African Corridors' : activeCountryInfo.countryName} · Back4App Live Telematics
        </p>
      </div>

      {/* SECTION 1: Automated Driver Document Compliance Scoring */}
      {activeSection === 'driver_scoring' && (
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
                  Weighted across {docSummary.totalDrivers} drivers in {selectedCountry === 'ALL' ? 'all 8 hubs' : activeCountryInfo.countryName}
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
                  {docSummary.expiringDocumentsTotal} credentials inside renewal window
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
                    : 'Dispatch suspension enforced pending renewal'}
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
                  All statutory transport credentials verified &gt; 30d
                </p>
              </div>
            </div>
          </div>

          {/* 30-Day Expiration Action Watchlist Banner */}
          {flaggedWithin30dList.length > 0 && (
            <div className="p-4 sm:p-5 rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Automated 30-Day Expiration Watchlist Active ({flaggedWithin30dList.length} Drivers Flagged)
                  </h2>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    Statutory transport licenses, roadworthiness inspections, third-party liability policies, or national tax clearances expiring within {EXPIRY_WARNING_WINDOW_DAYS} days receive automated score deductions.
                    {flaggedWithin30dList[0] && (
                      <span className="font-mono tabular-nums">
                        {' '}
                        Nearest upcoming: {flaggedWithin30dList[0].driverName} [{flaggedWithin30dList[0].countryCode || 'ET'}] ({flaggedWithin30dList[0].nearestExpiryLabel} in{' '}
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

          {/* Driver Scoring Table */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Driver Credential Scoring &amp; Statutory Expiry Matrix</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 font-normal text-slate-600 dark:text-slate-400">
                    {filteredDriverRecords.length} records
                  </span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Automated 100-point regulatory scoring across Commercial License (30), Inspection (25), Liability Insurance (25), and Tax Clearance (20)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search driver, plate, country..."
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 w-52"
                  />
                </div>

                {/* Risk State Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(
                    [
                      { id: 'all', label: `All (${filteredDriverRecords.length})` },
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
                    <th className="py-2.5 px-4">Jurisdiction &amp; Authority</th>
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
                          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
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
                      <td colSpan={6} className="py-10 text-center">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          No driver compliance records match the current filter
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Adjust your country selector, query or reset filters to view regional fleet rosters.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedCountry('ALL');
                            setDocFilter('all');
                            setModuleFilter('all');
                            setDocSearchQuery('');
                          }}
                          className="mt-3 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Reset Filters &amp; View All East Africa
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

                      const cCode = (rec.countryCode || 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>;
                      const countryMeta = EAST_AFRICA_REGULATORY_AUTHORITIES[cCode] || EAST_AFRICA_REGULATORY_AUTHORITIES.ET;

                      return (
                        <tr
                          key={rec.driverId}
                          className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Driver & Fleet Unit */}
                          <td className="py-3.5 pl-3 pr-4 align-top">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {rec.driverName}
                              </span>
                              <span className="text-sm shrink-0" title={countryMeta.countryName}>
                                {countryMeta.flag}
                              </span>
                            </div>
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
                            </div>
                          </td>

                          {/* Country & Regulatory Authority */}
                          <td className="py-3.5 px-4 align-top">
                            <p className="font-semibold text-slate-900 dark:text-white text-xs">
                              {countryMeta.shortAuthority}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              {countryMeta.inspectionAuthority}
                            </p>
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                              {countryMeta.countryName} ({countryMeta.currency})
                            </span>
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
                                  {rec.complianceNoticeSentAt ? 'Resend Notice' : 'Send Alert'}
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
      )}

      {/* SECTION 2: Trip Fuel Efficiency & Municipal Tariff Audit */}
      {activeSection === 'trip_tariff' && (
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
                  {tripSummary.complianceRate}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {tripSummary.violationsCount === 0
                    ? 'Zero rate ceiling breaches'
                    : `${tripSummary.violationsCount} rate ceiling breach(es) flagged`}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Commission Cap Adherence
                </span>
                <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {tripSummary.commissionAdherenceRate}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                  Statutory commission cap: ≤ {activeCountryInfo.rideCommissionCapPct}%
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Urban Ride-Hailing Trips
                </span>
                <Car className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {tripSummary.rideTripsCount} Trips
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Metered sedans &amp; shuttles audited
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Freight Cargo Shipments
                </span>
                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {tripSummary.freightTrucksCount} Trucks
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Corridor ton-km freight loads audited
                </p>
              </div>
            </div>
          </div>

          {/* Statutory Regulatory Standards Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeCountryInfo.flag}</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeCountryInfo.authorityName} — Statutory Tariff &amp; Commission Standards
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Regulated municipal metered taxi rates, surge multipliers, platform commission caps, and cross-border freight ton-km limits
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-mono text-[11px]">
                  {activeCountryInfo.directiveCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* Panel A: Ride Hailing */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Car className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Ride-Hailing Tariff Standards ({activeCountryInfo.shortAuthority})</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Cap ≤ {activeCountryInfo.rideCommissionCapPct}% Take
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] font-mono tabular-nums">
                  <div className="space-y-1">
                    <p className="text-slate-500 font-sans">Sedan Taxi Base Fare:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activeCountryInfo.currency} {activeCountryInfo.standards.sedan.baseFare.toFixed(2)}
                    </p>
                    <p className="text-slate-500 font-sans mt-2">Sedan Distance Cap:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activeCountryInfo.currency} {activeCountryInfo.standards.sedan.maxRatePerKm.toFixed(2)} / km
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-sans">Minibus / Shuttle Base:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activeCountryInfo.currency} {activeCountryInfo.standards.minibus.baseFare.toFixed(2)}
                    </p>
                    <p className="text-slate-500 font-sans mt-2">Minibus Distance Cap:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activeCountryInfo.currency} {activeCountryInfo.standards.minibus.maxRatePerKm.toFixed(2)} / km
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400">
                    Wait Time: <strong className="text-slate-900 dark:text-white">{activeCountryInfo.currency} {activeCountryInfo.rideWaitMinRate}/min</strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Max Surge Cap: <strong className="text-cyan-700 dark:text-cyan-400">{activeCountryInfo.maxSurgeMultiplierCap}x</strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Statutory Take-Rate: <strong className="text-emerald-700 dark:text-emerald-400">{activeCountryInfo.rideCommissionCapPct}%</strong>
                  </span>
                </div>
              </div>

              {/* Panel B: Truck Delivery & Freight */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Freight Truck Tariff Standards ({activeCountryInfo.shortAuthority})</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Ton-Km Freight Model
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] font-mono tabular-nums">
                  <div className="space-y-1">
                    <p className="text-slate-500 font-sans">Base Dispatch Booking:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activeCountryInfo.currency} {activeCountryInfo.standards.cargo_truck.baseFare.toFixed(2)}
                    </p>
                    <p className="text-slate-500 font-sans mt-2">Max Freight Ton-Km Rate:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activeCountryInfo.currency} {activeCountryInfo.truckTonKmRate} / ton-km
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-sans">Standard Km Rate:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activeCountryInfo.currency} {activeCountryInfo.standards.cargo_truck.standardRatePerKm.toFixed(2)} / km
                    </p>
                    <p className="text-slate-500 font-sans mt-2">Distance Ceiling Cap:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activeCountryInfo.currency} {activeCountryInfo.standards.cargo_truck.maxRatePerKm.toFixed(2)} / km
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400">
                    Demurrage Cap: <strong className="text-slate-900 dark:text-white">{activeCountryInfo.currency} {activeCountryInfo.truckDemurrageDailyCap}/day</strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[280px]">
                    Axle Law: <strong className="text-slate-900 dark:text-white">{activeCountryInfo.truckWeighbridgeDirective}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Log Table */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Audit Log &amp; Rate Telematics</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 font-normal text-slate-600 dark:text-slate-400">
                    {filteredRecords.length} records
                  </span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  On-demand ride metered fares, freight ton-km charges, surge multipliers, and platform commission audit across East Africa
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search trip, plate, corridor, driver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 w-56"
                  />
                </div>

                {/* Service Module Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setServiceModuleFilter('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      serviceModuleFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Fleet
                  </button>
                  <button
                    onClick={() => setServiceModuleFilter('ride')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      serviceModuleFilter === 'ride'
                        ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Car className="w-3 h-3" />
                    <span>Ride</span>
                  </button>
                  <button
                    onClick={() => setServiceModuleFilter('truck')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      serviceModuleFilter === 'truck'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Truck className="w-3 h-3" />
                    <span>Truck</span>
                  </button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Rates
                  </button>
                  <button
                    onClick={() => setStatusFilter('tariff_exceeded')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === 'tariff_exceeded'
                        ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Breaches Only
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                    <th className="py-2.5 pl-3 pr-4">Trip &amp; Module</th>
                    <th className="py-2.5 px-4">Vehicle &amp; Driver</th>
                    <th className="py-2.5 px-4">Corridor &amp; Metrics</th>
                    <th className="py-2.5 px-4 text-right">Charged Fare</th>
                    <th className="py-2.5 px-4 text-right">Statutory Max</th>
                    <th className="py-2.5 px-4 text-right">Variance</th>
                    <th className="py-2.5 px-4 text-right">Commission</th>
                    <th className="py-2.5 pl-4 pr-3 text-right">Regulatory Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          No tariff audit records match the current filter
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Try switching countries or click &ldquo;Audit Ride / Truck Tariff&rdquo; to certify a new dispatch.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const cur = r.currency || 'ETB';
                      const cCode = (r.countryCode || 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>;
                      const countryMeta = EAST_AFRICA_REGULATORY_AUTHORITIES[cCode] || EAST_AFRICA_REGULATORY_AUTHORITIES.ET;
                      const isTruck = r.serviceModule === 'truck' || r.vehicleType === 'cargo_truck';
                      const actualFareVal = r.actualFareLocal ?? r.actualFareETB;
                      const legalMaxVal = r.legalMaxFareLocal ?? r.legalMaxFareETB;
                      const variance = r.variancePct ?? (legalMaxVal > 0 ? Math.round(((actualFareVal - legalMaxVal) / legalMaxVal) * 1000) / 10 : 0);

                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 pl-3 pr-4">
                            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900 dark:text-white">
                              <span>{countryMeta.flag}</span>
                              <span>{r.tripId}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  isTruck
                                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                }`}
                              >
                                {isTruck ? <Truck className="w-2.5 h-2.5" /> : <Car className="w-2.5 h-2.5" />}
                                <span>{isTruck ? 'Truck Freight' : 'Ride Hailing'}</span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {r.countryCode || 'ET'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-mono font-medium text-slate-900 dark:text-white">
                              {r.vehiclePlate}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              {r.vehicleModel}
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
                              {r.distanceKm} km · {r.durationMin} mins
                              {isTruck && r.cargoWeightTons ? ` · ${r.cargoWeightTons} Tons` : ''}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {r.date}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                            <div>
                              {cur} {(r.actualFareLocal ?? r.actualFareETB).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {cur !== 'ETB' && (
                              <div className="text-[10px] font-normal text-slate-600 dark:text-slate-400">
                                ≈ ETB {r.actualFareETB.toFixed(0)}
                              </div>
                            )}
                            {r.surgeMultiplierApplied && r.surgeMultiplierApplied > 1 && (
                              <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-normal">
                                Surge {r.surgeMultiplierApplied}x
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                            <div>
                              {cur} {(r.legalMaxFareLocal ?? r.legalMaxFareETB).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {cur !== 'ETB' && (
                              <div className="text-[10px] text-slate-600 dark:text-slate-400">
                                ≈ ETB {r.legalMaxFareETB.toFixed(0)}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                            {variance > 0 ? (
                              <span className="text-rose-700 dark:text-rose-400 font-semibold">
                                +{variance}% Breach
                              </span>
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                {variance}% Legal
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {r.platformCommissionPct ?? 15}%
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {' '}/ {r.platformCommissionCapPct ?? countryMeta.rideCommissionCapPct}% Cap
                              </span>
                            </div>
                            {r.commissionCompliance === 'commission_exceeded' ? (
                              <span className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold">
                                Over Cap
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                Compliant
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pl-4 pr-3 text-right">
                            {r.complianceStatus === 'compliant' ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Compliant</span>
                                </span>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[140px] ml-auto">
                                  {r.regulatoryAuthority || countryMeta.shortAuthority}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Ceiling Exceeded</span>
                                </span>
                                <p className="text-[10px] text-rose-700 dark:text-rose-400 truncate max-w-[140px] ml-auto">
                                  Rate breach flagged
                                </p>
                              </div>
                            )}
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
      )}

      {/* SECTION 3: Cross-Border Directives & Comparative Benchmarks */}
      {activeSection === 'cross_border_directives' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>East Africa 8-Nation Statutory Transport Authorities &amp; Directives</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Comparative matrix of statutory platform commission caps, surge multipliers, freight ton-km ceiling rates, and vehicle roadworthiness inspection bodies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(EAST_AFRICA_REGULATORY_AUTHORITIES) as Exclude<EastAfricaCountryCode, 'ALL'>[]).map((key) => {
                const info = EAST_AFRICA_REGULATORY_AUTHORITIES[key];
                const isSelected = selectedCountry === key;
                return (
                  <div
                    key={key}
                    onClick={() => handleSelectCountry(key)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 ring-2 ring-cyan-500/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.flag}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{info.countryName}</p>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-600 text-white">
                                Filtered
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{info.currency} ({info.currencySymbol})</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                        {info.shortAuthority}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Statutory Body: </span>
                        <span className="font-medium">{info.authorityName}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Ride Commission Cap: </span>
                        <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          ≤ {info.rideCommissionCapPct}% take
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Max Surge Multiplier: </span>
                        <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                          {info.maxSurgeMultiplierCap}x
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Freight Ton-Km Rate: </span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {info.currency} {info.truckTonKmRate} / t-km
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Inspection: </span>
                        <span className="font-medium">{info.inspectionLabel}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                        {info.directiveCode}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Driver Credential Inspector & Renewal Modal */}
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
                  <span>{selectedDriver.countryName || 'Ethiopia'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedDriver.regulatoryAuthority || 'FTA'}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDriver.driverName} — Statutory Compliance Dossier
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

            {/* Statutory Credentials Renewal List */}
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

      {/* Audit Trip & Freight Tariff Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Audit Trip &amp; Freight Rate Compliance
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Cross-verify telematics against {EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry].shortAuthority} statutory price ceilings
                </p>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Service Module Selector: Ride vs Truck Freight */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setAuditServiceModule('ride');
                  setNewVehicleType('sedan');
                  const std = EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry].standards.sedan;
                  setNewActualFare(std.baseFare + newDistanceKm * std.standardRatePerKm);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  auditServiceModule === 'ride'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Urban Ride-Hailing</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuditServiceModule('truck');
                  setNewVehicleType('cargo_truck');
                  const countryInfo = EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry];
                  const std = countryInfo.standards.cargo_truck;
                  const freightCeiling = std.baseFare + newDistanceKm * newCargoWeightTons * countryInfo.truckTonKmRate;
                  setNewActualFare(Math.round(freightCeiling * 0.92));
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  auditServiceModule === 'truck'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Truck Delivery (Freight)</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Regulatory Jurisdiction:
                  </label>
                  <select
                    value={auditCountry}
                    onChange={(e) => handleAuditCountryChange(e.target.value as Exclude<EastAfricaCountryCode, 'ALL'>)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="ET">🇪🇹 Ethiopia (FTA / AACTB)</option>
                    <option value="KE">🇰🇪 Kenya (NTSA / EPRA)</option>
                    <option value="UG">🇺🇬 Uganda (MoWT / UNBS)</option>
                    <option value="RW">🇷🇼 Rwanda (RURA / RNP)</option>
                    <option value="TZ">🇹🇿 Tanzania (LATRA / EWURA)</option>
                    <option value="DJ">🇩🇯 Djibouti (DTT / Port)</option>
                    <option value="SO">🇸🇴 Somalia (MoTCA)</option>
                    <option value="SS">🇸🇸 South Sudan (MoTR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Reference ID:
                  </label>
                  <input
                    type="text"
                    value={newTripId}
                    onChange={(e) => setNewTripId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Vehicle Type:
                  </label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => {
                      const vt = e.target.value as 'sedan' | 'minibus' | 'cargo_truck';
                      setNewVehicleType(vt);
                      const info = EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry];
                      const std = info.standards[vt];
                      if (vt === 'cargo_truck') {
                        setAuditServiceModule('truck');
                        setNewActualFare(Math.round((std.baseFare + newDistanceKm * newCargoWeightTons * info.truckTonKmRate) * 0.92));
                      } else {
                        setAuditServiceModule('ride');
                        setNewActualFare(std.baseFare + newDistanceKm * std.standardRatePerKm);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {auditServiceModule === 'ride' ? (
                      <>
                        <option value="sedan">Sedan Taxi (Metered)</option>
                        <option value="minibus">Minibus Shuttle</option>
                      </>
                    ) : (
                      <>
                        <option value="cargo_truck">Freight Cargo Truck (Rigid / Semi)</option>
                      </>
                    )}
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
                    onChange={(e) => {
                      const km = parseFloat(e.target.value) || 0;
                      setNewDistanceKm(km);
                      const info = EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry];
                      const std = info.standards[newVehicleType];
                      if (auditServiceModule === 'truck') {
                        setNewActualFare(Math.round((std.baseFare + km * newCargoWeightTons * info.truckTonKmRate) * 0.92));
                      } else {
                        setNewActualFare(std.baseFare + km * std.standardRatePerKm);
                      }
                    }}
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
                    {auditServiceModule === 'truck' ? 'Payload (Tons):' : 'Surge Multiplier:'}
                  </label>
                  {auditServiceModule === 'truck' ? (
                    <input
                      type="number"
                      value={newCargoWeightTons}
                      onChange={(e) => {
                        const t = parseFloat(e.target.value) || 1;
                        setNewCargoWeightTons(t);
                        const info = EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry];
                        const std = info.standards.cargo_truck;
                        setNewActualFare(Math.round((std.baseFare + newDistanceKm * t * info.truckTonKmRate) * 0.92));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="3.0"
                      value={newSurgeMultiplier}
                      onChange={(e) => setNewSurgeMultiplier(parseFloat(e.target.value) || 1.0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Charged Fare ({EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry].currency}):
                  </label>
                  <input
                    type="number"
                    value={newActualFare}
                    onChange={(e) => setNewActualFare(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Platform Commission % (Cap: {EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry].rideCommissionCapPct}%):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPlatformCommissionPct}
                    onChange={(e) => setNewPlatformCommissionPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Corridor Description / Route:
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={newCorridor}
                    onChange={(e) => setNewCorridor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-slate-500">Presets:</span>
                    {EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry].defaultCorridors.slice(0, 3).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewCorridor(preset)}
                        className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {preset.split('→')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Rate Telematics Preview Box */}
              {(() => {
                const countryInfo = EAST_AFRICA_REGULATORY_AUTHORITIES[auditCountry];
                const std = countryInfo.standards[newVehicleType];
                const cur = countryInfo.currency;

                let legalMax: number;
                if (auditServiceModule === 'truck') {
                  const tonKmRate = countryInfo.truckTonKmRate;
                  const freightFormula = std.baseFare + (newDistanceKm * newCargoWeightTons * tonKmRate);
                  legalMax = Math.round(freightFormula * 100) / 100;
                } else {
                  const surgeCapped = Math.min(newSurgeMultiplier, countryInfo.maxSurgeMultiplierCap);
                  const baseFareSum = std.baseFare + newDistanceKm * std.maxRatePerKm;
                  legalMax = Math.round(baseFareSum * surgeCapped * 100) / 100;
                }

                const isFareOver = newActualFare > legalMax;
                const isCommissionOver = newPlatformCommissionPct > countryInfo.rideCommissionCapPct;
                const isCompliant = !isFareOver && !isCommissionOver;
                const variancePct = legalMax > 0 ? Math.round(((newActualFare - legalMax) / legalMax) * 1000) / 10 : 0;

                return (
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Statutory Legal Max:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {cur} {legalMax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Variance to Ceiling:</span>
                      <span className={`font-semibold ${variancePct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {variancePct > 0 ? `+${variancePct}% Breach` : `${variancePct}% Under Cap`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Commission Verification:</span>
                      <span className={`font-semibold ${isCommissionOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {newPlatformCommissionPct}% (Statutory Cap: {countryInfo.rideCommissionCapPct}%)
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400 font-sans font-semibold">Audit Standing:</span>
                      <span className={`font-bold ${isCompliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isCompliant ? 'COMPLIANT' : isFareOver ? `FARE BREACH (+${cur} ${(newActualFare - legalMax).toFixed(2)})` : 'COMMISSION CAP BREACH'}
                      </span>
                    </div>
                  </div>
                );
              })()}
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
