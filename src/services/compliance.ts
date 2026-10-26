import {
  ComplianceDeductionItem,
  Driver,
  DriverComplianceDocument,
  DriverDocumentComplianceRecord,
  DriverDocumentType,
  FleetTripCompliance,
  Vehicle,
} from '../types';

export const PUMP_PRICE_ETB_PER_LITER = 82.60; // National retail price in Addis Ababa
export const EXPIRY_WARNING_WINDOW_DAYS = 30;

export const DOCUMENT_SPECIFICATIONS: Record<
  DriverDocumentType,
  {
    label: string;
    shortLabel: string;
    codePrefix: string;
    maxWeight: number;
    deduction30d: number;
    deduction14d: number;
    deductionExpired: number;
  }
> = {
  commercial_license: {
    label: 'Commercial Driving License',
    shortLabel: 'License',
    codePrefix: 'ET-LIC',
    maxWeight: 30,
    deduction30d: 12,
    deduction14d: 20,
    deductionExpired: 35,
  },
  bola_inspection: {
    label: 'Annual Bola Roadworthiness',
    shortLabel: 'Bola',
    codePrefix: 'AA-BOL',
    maxWeight: 25,
    deduction30d: 10,
    deduction14d: 16,
    deductionExpired: 28,
  },
  third_party_insurance: {
    label: '3rd-Party Motor Liability',
    shortLabel: 'Insurance',
    codePrefix: 'EIC-POL',
    maxWeight: 25,
    deduction30d: 10,
    deduction14d: 16,
    deductionExpired: 28,
  },
  tin_clearance: {
    label: 'Federal TIN & Tax Clearance',
    shortLabel: 'TIN Tax',
    codePrefix: 'MOR-TIN',
    maxWeight: 20,
    deduction30d: 8,
    deduction14d: 12,
    deductionExpired: 20,
  },
};

export function offsetIsoDateFromToday(daysOffset: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  d.setDate(d.getDate() + daysOffset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function normalizeParseIsoDate(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string' && raw.trim().length >= 10) {
    return raw.trim().slice(0, 10);
  }
  if (typeof raw === 'object' && raw !== null && 'iso' in raw) {
    const isoVal = (raw as { iso?: unknown }).iso;
    if (typeof isoVal === 'string' && isoVal.length >= 10) {
      return isoVal.slice(0, 10);
    }
  }
  return undefined;
}

export function computeDaysUntilExpiry(isoDateStr: string, referenceNow: Date = new Date()): number {
  const clean = isoDateStr.slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return 90;
  const targetUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const todayUtc = Date.UTC(
    referenceNow.getFullYear(),
    referenceNow.getMonth(),
    referenceNow.getDate()
  );
  return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

export function evaluateDriverDocumentCompliance(params: {
  driver: Driver;
  matchedVehicle?: Vehicle;
  sourceClass?: 'Driver' | 'DriverProfile';
  expiryDates: Record<DriverDocumentType, string>;
  referenceNow?: Date;
}): DriverDocumentComplianceRecord {
  const { driver, matchedVehicle, sourceClass = 'Driver', expiryDates, referenceNow = new Date() } = params;
  const driverKey = driver.objectId || driver.id || driver.phone;
  const plateSuffix = (driver.vehiclePlate || '0000').replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase();

  const deductions: ComplianceDeductionItem[] = [];
  const docOrder: DriverDocumentType[] = [
    'commercial_license',
    'bola_inspection',
    'third_party_insurance',
    'tin_clearance',
  ];

  const documents: DriverComplianceDocument[] = docOrder.map((docType, index) => {
    const spec = DOCUMENT_SPECIFICATIONS[docType];
    const expiresAt = expiryDates[docType];
    const daysRemaining = computeDaysUntilExpiry(expiresAt, referenceNow);

    let expiryState: DriverComplianceDocument['expiryState'] = 'valid';
    let pointDeduction = 0;

    if (daysRemaining < 0) {
      expiryState = 'expired';
      pointDeduction = spec.deductionExpired;
      deductions.push({
        reason: `${spec.label} expired ${Math.abs(daysRemaining)}d ago`,
        points: pointDeduction,
        severity: 'critical',
      });
    } else if (daysRemaining <= 14) {
      expiryState = 'expiring_within_30d';
      pointDeduction = spec.deduction14d;
      deductions.push({
        reason: `${spec.label} expires in ${daysRemaining}d (urgent ≤14d window)`,
        points: pointDeduction,
        severity: 'warning',
      });
    } else if (daysRemaining <= EXPIRY_WARNING_WINDOW_DAYS) {
      expiryState = 'expiring_within_30d';
      pointDeduction = spec.deduction30d;
      deductions.push({
        reason: `${spec.label} expires in ${daysRemaining}d (≤30d window)`,
        points: pointDeduction,
        severity: 'warning',
      });
    }

    return {
      docType,
      label: spec.label,
      shortLabel: spec.shortLabel,
      documentNumber: `${spec.codePrefix}-${plateSuffix}${index + 1}`,
      expiresAt,
      daysRemaining,
      expiryState,
      pointDeduction,
      maxWeight: spec.maxWeight,
    };
  });

  if (driver.status === 'Suspended' || matchedVehicle?.status === 'Suspended') {
    deductions.push({
      reason: 'Dispatch account or assigned vehicle currently suspended',
      points: 15,
      severity: 'critical',
    });
  } else if (matchedVehicle?.status === 'Inspection') {
    deductions.push({
      reason: 'Assigned vehicle queued for physical Bola workshop re-check',
      points: 6,
      severity: 'warning',
    });
  }

  const totalDeduction = deductions.reduce((sum, item) => sum + item.points, 0);
  const complianceScore = Math.max(0, Math.min(100, 100 - totalDeduction));

  const expiringSoonCount = documents.filter((d) => d.expiryState === 'expiring_within_30d').length;
  const expiredCount = documents.filter((d) => d.expiryState === 'expired').length;
  const flaggedWithin30Days = expiringSoonCount > 0;
  const hasExpiredDocument = expiredCount > 0;

  const sortedByUrgency = [...documents].sort((a, b) => a.daysRemaining - b.daysRemaining);
  const nearestDoc = sortedByUrgency[0];

  let riskTier: DriverDocumentComplianceRecord['riskTier'] = 'compliant';
  if (hasExpiredDocument) {
    riskTier = 'critical_expired';
  } else if (flaggedWithin30Days) {
    riskTier = 'expiring_soon';
  }

  return {
    driverId: driverKey,
    objectId: driver.objectId,
    driverName: driver.name,
    phone: driver.phone,
    module: driver.module || 'ride',
    vehiclePlate: driver.vehiclePlate,
    vehicleModel: driver.vehicleModel,
    driverStatus: driver.status,
    vehicleStatus: matchedVehicle?.status,
    sourceClass,
    documents,
    complianceScore,
    riskTier,
    flaggedWithin30Days,
    hasExpiredDocument,
    expiringSoonCount,
    expiredCount,
    nearestExpiryDays: nearestDoc.daysRemaining,
    nearestExpiryDate: nearestDoc.expiresAt,
    nearestExpiryLabel: nearestDoc.shortLabel,
    deductions,
    complianceNoticeSentAt: driver.complianceNoticeSentAt,
  };
}

export function summarizeDriverCompliance(records: DriverDocumentComplianceRecord[]) {
  const totalDrivers = records.length;
  const flaggedWithin30dDrivers = records.filter((r) => r.flaggedWithin30Days).length;
  const expiredDrivers = records.filter((r) => r.hasExpiredDocument).length;
  const fullyCompliantDrivers = records.filter(
    (r) => !r.flaggedWithin30Days && !r.hasExpiredDocument
  ).length;
  const expiringDocumentsTotal = records.reduce((sum, r) => sum + r.expiringSoonCount, 0);
  const averageScore =
    totalDrivers > 0
      ? Math.round(records.reduce((sum, r) => sum + r.complianceScore, 0) / totalDrivers)
      : 100;

  return {
    totalDrivers,
    averageScore,
    flaggedWithin30dDrivers,
    expiredDrivers,
    fullyCompliantDrivers,
    expiringDocumentsTotal,
  };
}

export const VEHICLE_FUEL_STANDARDS = {
  sedan: {
    baseLitersPer100Km: 7.2,
    co2KgPerLiter: 2.31,
    baseFareETB: 120,
    maxRatePerKmETB: 40.0,
    standardRatePerKmETB: 30.0,
  },
  minibus: {
    baseLitersPer100Km: 11.5,
    co2KgPerLiter: 2.45,
    baseFareETB: 180,
    maxRatePerKmETB: 55.0,
    standardRatePerKmETB: 45.0,
  },
  cargo_truck: {
    baseLitersPer100Km: 21.0,
    co2KgPerLiter: 2.68,
    baseFareETB: 650,
    maxRatePerKmETB: 135.0,
    standardRatePerKmETB: 110.0,
  },
};

export const INITIAL_COMPLIANCE_RECORDS: FleetTripCompliance[] = [
  {
    id: 'cmp-1',
    tripId: 'TRP9281',
    vehiclePlate: 'AA-2-88192',
    vehicleModel: 'Toyota Vitz (2018)',
    vehicleType: 'sedan',
    driverName: 'Abebe Kebede',
    distanceKm: 9.4,
    durationMin: 24,
    routeCorridor: 'Bole Medhanealem → Meskel Square',
    estimatedFuelLiters: 0.81,
    fuelCostETB: 66.90,
    co2Kg: 1.87,
    actualFareETB: 340.00,
    legalMaxFareETB: 496.00,
    complianceStatus: 'compliant',
    notes: 'Standard metered fare well within Addis Ababa Transport Bureau ceiling.',
    date: 'Today, 09:42',
  },
  {
    id: 'cmp-2',
    tripId: 'TRP9283',
    vehiclePlate: 'AA-2-19283',
    vehicleModel: 'Hyundai Grand i10 (2020)',
    vehicleType: 'sedan',
    driverName: 'Almaz Tadesse',
    distanceKm: 14.2,
    durationMin: 38,
    routeCorridor: 'CMC Michael → Piassa Cathedral',
    estimatedFuelLiters: 1.28,
    fuelCostETB: 105.73,
    co2Kg: 2.96,
    actualFareETB: 480.00,
    legalMaxFareETB: 688.00,
    complianceStatus: 'compliant',
    notes: 'Moderate congestion penalty applied along Megenagna corridor.',
    date: 'Today, 09:15',
  },
  {
    id: 'cmp-3',
    tripId: 'TRP9280',
    vehiclePlate: 'AA-3-44192',
    vehicleModel: 'Toyota HiAce Van (2019)',
    vehicleType: 'minibus',
    driverName: 'Ephrem Getachew',
    distanceKm: 18.0,
    durationMin: 46,
    routeCorridor: 'Kality Customs Yard → Bole International Airport',
    estimatedFuelLiters: 2.48,
    fuelCostETB: 204.85,
    co2Kg: 6.08,
    actualFareETB: 620.00,
    legalMaxFareETB: 1170.00,
    complianceStatus: 'compliant',
    notes: 'Multi-passenger shuttle corridor rate compliant with group transit cap.',
    date: 'Today, 08:50',
  },
  {
    id: 'cmp-4',
    tripId: 'TRP9269',
    vehiclePlate: 'AA-2-99014',
    vehicleModel: 'Lifan 520 (2016)',
    vehicleType: 'sedan',
    driverName: 'Dawit Haile',
    distanceKm: 6.2,
    durationMin: 18,
    routeCorridor: 'Mexico Square → Sarbet Jomo',
    estimatedFuelLiters: 0.53,
    fuelCostETB: 43.78,
    co2Kg: 1.22,
    actualFareETB: 450.00,
    legalMaxFareETB: 368.00,
    complianceStatus: 'tariff_exceeded',
    notes: 'Fare exceeds maximum ceiling by ETB 82.00 during off-peak hours without approved surge permit.',
    date: 'Today, 08:12',
  },
  {
    id: 'cmp-5',
    tripId: 'DLV7721',
    vehiclePlate: 'ET-3-88219',
    vehicleModel: 'Isuzu NPR 4.5T (2021)',
    vehicleType: 'cargo_truck',
    driverName: 'Moges Wolde',
    distanceKm: 74.5,
    durationMin: 105,
    routeCorridor: 'Modjo Inland Dry Port → Kality Customs Hub',
    estimatedFuelLiters: 17.20,
    fuelCostETB: 1420.72,
    co2Kg: 46.10,
    actualFareETB: 6800.00,
    legalMaxFareETB: 10707.50,
    complianceStatus: 'compliant',
    notes: 'Inter-regional freight transit on expressway; fuel efficiency within green logistics target.',
    date: 'Yesterday, 17:30',
  },
];

export function auditTripCompliance(
  tripId: string,
  vehicleType: 'sedan' | 'minibus' | 'cargo_truck',
  vehiclePlate: string,
  vehicleModel: string,
  driverName: string,
  distanceKm: number,
  durationMin: number,
  actualFareETB: number,
  corridor: string
): FleetTripCompliance {
  const spec = VEHICLE_FUEL_STANDARDS[vehicleType];
  const fuelLiters = Math.round(((distanceKm / 100) * spec.baseLitersPer100Km * 1.1) * 100) / 100;
  const fuelCost = Math.round(fuelLiters * PUMP_PRICE_ETB_PER_LITER * 100) / 100;
  const co2 = Math.round(fuelLiters * spec.co2KgPerLiter * 100) / 100;
  const legalMax = Math.round((spec.baseFareETB + distanceKm * spec.maxRatePerKmETB) * 100) / 100;

  let complianceStatus: 'compliant' | 'tariff_exceeded' | 'undercharged' = 'compliant';
  let notes = 'Certified compliant with City Transport Bureau tariff.';

  if (actualFareETB > legalMax) {
    complianceStatus = 'tariff_exceeded';
    notes = `Exceeds municipal tariff ceiling by ETB ${(actualFareETB - legalMax).toFixed(2)}.`;
  } else if (actualFareETB < spec.baseFareETB * 0.8) {
    complianceStatus = 'undercharged';
    notes = 'Below standard operational cost threshold; review driver commission subsidy.';
  }

  return {
    id: `cmp-${Date.now()}`,
    tripId,
    vehiclePlate,
    vehicleModel,
    vehicleType,
    driverName,
    distanceKm,
    durationMin,
    routeCorridor: corridor,
    estimatedFuelLiters: fuelLiters,
    fuelCostETB: fuelCost,
    co2Kg: co2,
    actualFareETB,
    legalMaxFareETB: legalMax,
    complianceStatus,
    notes,
    date: 'Just now',
  };
}

class FleetComplianceService {
  private records: FleetTripCompliance[] = [...INITIAL_COMPLIANCE_RECORDS];

  getRecords(): FleetTripCompliance[] {
    return [...this.records];
  }

  addRecord(record: FleetTripCompliance) {
    this.records = [record, ...this.records];
  }

  getSummary() {
    const totalTrips = this.records.length;
    const compliantCount = this.records.filter((r) => r.complianceStatus === 'compliant').length;
    const violationsCount = this.records.filter((r) => r.complianceStatus === 'tariff_exceeded').length;
    const totalFuelLiters = this.records.reduce((acc, r) => acc + r.estimatedFuelLiters, 0);
    const totalFuelCostETB = this.records.reduce((acc, r) => acc + r.fuelCostETB, 0);
    const totalCo2Kg = this.records.reduce((acc, r) => acc + r.co2Kg, 0);

    return {
      totalTrips,
      complianceRate: totalTrips > 0 ? Math.round((compliantCount / totalTrips) * 100) : 100,
      violationsCount,
      totalFuelLiters: Math.round(totalFuelLiters * 10) / 10,
      totalFuelCostETB: Math.round(totalFuelCostETB),
      totalCo2Kg: Math.round(totalCo2Kg * 10) / 10,
    };
  }
}

export const fleetComplianceService = new FleetComplianceService();
