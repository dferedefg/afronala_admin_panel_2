import {
  ComplianceDeductionItem,
  Driver,
  DriverComplianceDocument,
  DriverDocumentComplianceRecord,
  DriverDocumentType,
  EastAfricaCountryCode,
  EastAfricaCurrency,
  FleetTripCompliance,
  Vehicle,
} from '../types';

export const PUMP_PRICE_ETB_PER_LITER = 82.60; // National retail price in Addis Ababa (MoTRI benchmark)
export const EXPIRY_WARNING_WINDOW_DAYS = 30;

export interface RegulatoryVehicleStandard {
  baseFare: number;
  maxRatePerKm: number;
  standardRatePerKm: number;
  baseLitersPer100Km: number;
  co2KgPerLiter: number;
}

export interface CountryRegulatoryAuthorityInfo {
  countryCode: EastAfricaCountryCode;
  countryName: string;
  flag: string;
  currency: EastAfricaCurrency;
  currencySymbol: string;
  authorityName: string;
  shortAuthority: string;
  inspectionAuthority: string;
  inspectionLabel: string;
  pumpPricePerLiter: number;
  fuelBenchmarkSource: string;
  exchangeRateToETB: number;
  directiveCode: string;
  emissionsStandard: string;
  rideCommissionCapPct: number;
  maxSurgeMultiplierCap: number;
  rideWaitMinRate: number;
  truckTonKmRate: number;
  truckDemurrageDailyCap: number;
  truckWeighbridgeDirective: string;
  documents: Record<
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
  >;
  standards: {
    sedan: RegulatoryVehicleStandard;
    minibus: RegulatoryVehicleStandard;
    cargo_truck: RegulatoryVehicleStandard;
  };
  defaultCorridors: string[];
}

export const EAST_AFRICA_REGULATORY_AUTHORITIES: Record<
  Exclude<EastAfricaCountryCode, 'ALL'>,
  CountryRegulatoryAuthorityInfo
> = {
  ET: {
    countryCode: 'ET',
    countryName: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    authorityName: 'Federal Transport Authority (FTA) & Addis Ababa Transport Bureau',
    shortAuthority: 'FTA / AACTB',
    inspectionAuthority: 'Addis Ababa City Bola Vehicle Inspection Service',
    inspectionLabel: 'Annual Bola Roadworthiness Sticker',
    pumpPricePerLiter: 82.60,
    fuelBenchmarkSource: 'Ministry of Trade & Regional Integration (MoTRI) Price Cap',
    exchangeRateToETB: 1.0,
    directiveCode: 'AACTB Dir. 2026/04 · Municipal Metered Tariff Schedule',
    emissionsStandard: 'UNEP Horn of Africa Euro IV Baseline',
    rideCommissionCapPct: 15,
    maxSurgeMultiplierCap: 1.5,
    rideWaitMinRate: 4.50,
    truckTonKmRate: 6.80,
    truckDemurrageDailyCap: 4500,
    truckWeighbridgeDirective: 'ERA 48-Tonne Gross Axle Limit Directive',
    documents: {
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
        label: 'Annual Bola Roadworthiness Certificate',
        shortLabel: 'Bola',
        codePrefix: 'AA-BOL',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      third_party_insurance: {
        label: '3rd-Party Motor Liability Insurance',
        shortLabel: 'Insurance',
        codePrefix: 'EIC-POL',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      tin_clearance: {
        label: 'Federal TIN & Tax Clearance (MoR)',
        shortLabel: 'TIN Tax',
        codePrefix: 'MOR-TIN',
        maxWeight: 20,
        deduction30d: 8,
        deduction14d: 12,
        deductionExpired: 20,
      },
    },
    standards: {
      sedan: {
        baseFare: 120,
        maxRatePerKm: 40.0,
        standardRatePerKm: 30.0,
        baseLitersPer100Km: 7.2,
        co2KgPerLiter: 2.31,
      },
      minibus: {
        baseFare: 180,
        maxRatePerKm: 55.0,
        standardRatePerKm: 45.0,
        baseLitersPer100Km: 11.5,
        co2KgPerLiter: 2.45,
      },
      cargo_truck: {
        baseFare: 650,
        maxRatePerKm: 135.0,
        standardRatePerKm: 110.0,
        baseLitersPer100Km: 21.0,
        co2KgPerLiter: 2.68,
      },
    },
    defaultCorridors: [
      'Bole Medhanealem → Meskel Square',
      'CMC Michael → Piassa Cathedral',
      'Kality Customs Yard → Bole International Airport',
      'Modjo Inland Dry Port → Kality Customs Hub',
      'Mexico Square → Sarbet Jomo',
      'Addis Ababa Ring Road → Adama Toll Gate',
    ],
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    authorityName: 'National Transport and Safety Authority (NTSA) & EPRA',
    shortAuthority: 'NTSA / EPRA',
    inspectionAuthority: 'NTSA Motor Vehicle Inspection Unit',
    inspectionLabel: 'NTSA Roadworthiness & Speed Limiter Certificate',
    pumpPricePerLiter: 188.80,
    fuelBenchmarkSource: 'Energy and Petroleum Regulatory Authority (EPRA) Monthly Cap',
    exchangeRateToETB: 0.95,
    directiveCode: 'NTSA Cap 403 & EPRA Super Petrol/Diesel Price Gazette',
    emissionsStandard: 'KEBS KS 1515 Euro IV Emissions Limit',
    rideCommissionCapPct: 18,
    maxSurgeMultiplierCap: 1.5,
    rideWaitMinRate: 5.0,
    truckTonKmRate: 9.5,
    truckDemurrageDailyCap: 6500,
    truckWeighbridgeDirective: 'KeNHA / EAC Harmonized Axle Load Control Act 2016',
    documents: {
      commercial_license: {
        label: 'NTSA Commercial PSV License Badge',
        shortLabel: 'PSV Badge',
        codePrefix: 'KE-PSV',
        maxWeight: 30,
        deduction30d: 12,
        deduction14d: 20,
        deductionExpired: 35,
      },
      bola_inspection: {
        label: 'NTSA Annual Vehicle Inspection Certificate',
        shortLabel: 'NTSA Insp',
        codePrefix: 'NTSA-INS',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      third_party_insurance: {
        label: 'Commercial PSV/Motor Third Party (IRA Kenya)',
        shortLabel: 'Insurance',
        codePrefix: 'IRA-POL',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      tin_clearance: {
        label: 'KRA PIN & Tax Compliance Certificate (eTIMS)',
        shortLabel: 'KRA Tax',
        codePrefix: 'KRA-PIN',
        maxWeight: 20,
        deduction30d: 8,
        deduction14d: 12,
        deductionExpired: 20,
      },
    },
    standards: {
      sedan: {
        baseFare: 150,
        maxRatePerKm: 50.0,
        standardRatePerKm: 38.0,
        baseLitersPer100Km: 7.2,
        co2KgPerLiter: 2.31,
      },
      minibus: {
        baseFare: 220,
        maxRatePerKm: 70.0,
        standardRatePerKm: 55.0,
        baseLitersPer100Km: 11.5,
        co2KgPerLiter: 2.45,
      },
      cargo_truck: {
        baseFare: 850,
        maxRatePerKm: 175.0,
        standardRatePerKm: 140.0,
        baseLitersPer100Km: 21.0,
        co2KgPerLiter: 2.68,
      },
    },
    defaultCorridors: [
      'Mombasa Port Terminal → ICD Embakasi Nairobi',
      'Jomo Kenyatta Intl Airport (JKIA) → Westlands CBD',
      'Nairobi Expressway → Southern Bypass Junction',
      'Eldoret Logistics Hub → Malaba Border Post',
      'Moyale Cross-Border Corridor → Marsabit Highway',
    ],
  },
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    authorityName: 'Ministry of Works and Transport (MoWT) & UNBS',
    shortAuthority: 'MoWT / UNBS',
    inspectionAuthority: 'MoWT Mandatory Vehicle Inspection Directorate (SGS/UNBS)',
    inspectionLabel: 'MoWT Road Safety & Emissions Certificate',
    pumpPricePerLiter: 5350.0,
    fuelBenchmarkSource: 'Ministry of Energy & Mineral Development Retail Benchmark',
    exchangeRateToETB: 0.033,
    directiveCode: 'Traffic & Road Safety Act 1998 (Amended 2020) MoWT S.I.',
    emissionsStandard: 'NEMA / EAC Harmonized Vehicle Emissions Standard',
    rideCommissionCapPct: 18,
    maxSurgeMultiplierCap: 1.6,
    rideWaitMinRate: 150.0,
    truckTonKmRate: 320.0,
    truckDemurrageDailyCap: 210000,
    truckWeighbridgeDirective: 'UNRA Virtual Weighbridge & Axle Load Monitoring S.I.',
    documents: {
      commercial_license: {
        label: 'MoWT Commercial Driver Permit (Class CM/CH)',
        shortLabel: 'Driver Permit',
        codePrefix: 'UG-CDP',
        maxWeight: 30,
        deduction30d: 12,
        deduction14d: 20,
        deductionExpired: 35,
      },
      bola_inspection: {
        label: 'UNBS / MoWT Inspection Certificate',
        shortLabel: 'MoWT Insp',
        codePrefix: 'MOWT-INS',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      third_party_insurance: {
        label: 'Statutory Motor Third Party (IRA Uganda)',
        shortLabel: 'Insurance',
        codePrefix: 'IRAU-POL',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      tin_clearance: {
        label: 'URA Tax Clearance Certificate & TIN (EFRIS)',
        shortLabel: 'URA Tax',
        codePrefix: 'URA-TIN',
        maxWeight: 20,
        deduction30d: 8,
        deduction14d: 12,
        deductionExpired: 20,
      },
    },
    standards: {
      sedan: {
        baseFare: 4500,
        maxRatePerKm: 1400.0,
        standardRatePerKm: 1100.0,
        baseLitersPer100Km: 7.2,
        co2KgPerLiter: 2.31,
      },
      minibus: {
        baseFare: 6500,
        maxRatePerKm: 2000.0,
        standardRatePerKm: 1600.0,
        baseLitersPer100Km: 11.5,
        co2KgPerLiter: 2.45,
      },
      cargo_truck: {
        baseFare: 24000,
        maxRatePerKm: 5200.0,
        standardRatePerKm: 4200.0,
        baseLitersPer100Km: 21.0,
        co2KgPerLiter: 2.68,
      },
    },
    defaultCorridors: [
      'Malaba One-Stop Border Post → Kampala ICD Bweyogerere',
      'Entebbe International Airport → Kampala Nakasero CBD',
      'Kampala Northern Bypass → Namanve Industrial Estate',
      'Kampala → Katuna Border Transit Corridor',
    ],
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'FRw',
    authorityName: 'Rwanda Utilities Regulatory Authority (RURA) & Police (RNP)',
    shortAuthority: 'RURA / RNP',
    inspectionAuthority: 'Rwanda National Police Contrôle Technique Automobile',
    inspectionLabel: 'RNP Contrôle Technique & Green Emissions Sticker',
    pumpPricePerLiter: 1630.0,
    fuelBenchmarkSource: 'RURA Monthly Petroleum Pricing Ceiling Gazette',
    exchangeRateToETB: 0.091,
    directiveCode: 'RURA Regulation No 004/TRANS/RURA/2021 Passenger Tariffs',
    emissionsStandard: 'REMA Low-Emission Urban Mobility Standard Euro IV',
    rideCommissionCapPct: 15,
    maxSurgeMultiplierCap: 1.5,
    rideWaitMinRate: 50.0,
    truckTonKmRate: 95.0,
    truckDemurrageDailyCap: 62000,
    truckWeighbridgeDirective: 'RTDA Axle Load Control & Overload Fees Regulation',
    documents: {
      commercial_license: {
        label: 'RURA Professional Transport Authorization (PTA)',
        shortLabel: 'RURA PTA',
        codePrefix: 'RURA-PTA',
        maxWeight: 30,
        deduction30d: 12,
        deduction14d: 20,
        deductionExpired: 35,
      },
      bola_inspection: {
        label: 'RNP Contrôle Technique Roadworthiness',
        shortLabel: 'Contrôle Tech',
        codePrefix: 'RNP-CT',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      third_party_insurance: {
        label: 'BNR Licensed Motor Liability Insurance',
        shortLabel: 'Insurance',
        codePrefix: 'BNR-INS',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      tin_clearance: {
        label: 'RRA Quitus Fiscal & Tax Clearance Certificate',
        shortLabel: 'RRA Tax',
        codePrefix: 'RRA-TCC',
        maxWeight: 20,
        deduction30d: 8,
        deduction14d: 12,
        deductionExpired: 20,
      },
    },
    standards: {
      sedan: {
        baseFare: 1200,
        maxRatePerKm: 400.0,
        standardRatePerKm: 320.0,
        baseLitersPer100Km: 7.2,
        co2KgPerLiter: 2.31,
      },
      minibus: {
        baseFare: 1800,
        maxRatePerKm: 580.0,
        standardRatePerKm: 460.0,
        baseLitersPer100Km: 11.5,
        co2KgPerLiter: 2.45,
      },
      cargo_truck: {
        baseFare: 6500,
        maxRatePerKm: 1450.0,
        standardRatePerKm: 1150.0,
        baseLitersPer100Km: 21.0,
        co2KgPerLiter: 2.68,
      },
    },
    defaultCorridors: [
      'Rusumo Border Post → Kigali Logistics Platform (KLP Masaka)',
      'Kigali International Airport (KGL) → Downtown Nyarugenge',
      'Kigali Special Economic Zone (KSEZ) → Gahanga Depot',
      'Kigali → Rubavu / Goma Cross-Border Gateway',
    ],
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    authorityName: 'Land Transport Regulatory Authority (LATRA) & EWURA',
    shortAuthority: 'LATRA / EWURA',
    inspectionAuthority: 'Traffic Police & TBS Motor Vehicle Inspection',
    inspectionLabel: 'TBS / LATRA Commercial Fitness Certificate',
    pumpPricePerLiter: 3050.0,
    fuelBenchmarkSource: 'EWURA Monthly National Maximum Cap Prices',
    exchangeRateToETB: 0.046,
    directiveCode: 'LATRA Act No. 3 of 2019 & Transport Tariffs Order',
    emissionsStandard: 'TBS / NEMC Vehicle Road Emission Baseline',
    rideCommissionCapPct: 15,
    maxSurgeMultiplierCap: 1.5,
    rideWaitMinRate: 100.0,
    truckTonKmRate: 210.0,
    truckDemurrageDailyCap: 140000,
    truckWeighbridgeDirective: 'TANROADS Vehicle Overload Control Act & Weighbridges',
    documents: {
      commercial_license: {
        label: 'LATRA Commercial PSV/HGV Driving License',
        shortLabel: 'LATRA Lic',
        codePrefix: 'TZ-LATRA',
        maxWeight: 30,
        deduction30d: 12,
        deduction14d: 20,
        deductionExpired: 35,
      },
      bola_inspection: {
        label: 'TBS / LATRA Annual Vehicle Roadworthiness',
        shortLabel: 'TBS Insp',
        codePrefix: 'TBS-LATRA',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      third_party_insurance: {
        label: 'TIRA Mandatory Motor Liability Insurance',
        shortLabel: 'Insurance',
        codePrefix: 'TIRA-POL',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      tin_clearance: {
        label: 'TRA Tax Clearance Certificate & TIN',
        shortLabel: 'TRA Tax',
        codePrefix: 'TRA-TIN',
        maxWeight: 20,
        deduction30d: 8,
        deduction14d: 12,
        deductionExpired: 20,
      },
    },
    standards: {
      sedan: {
        baseFare: 2500,
        maxRatePerKm: 800.0,
        standardRatePerKm: 650.0,
        baseLitersPer100Km: 7.2,
        co2KgPerLiter: 2.31,
      },
      minibus: {
        baseFare: 3500,
        maxRatePerKm: 1150.0,
        standardRatePerKm: 900.0,
        baseLitersPer100Km: 11.5,
        co2KgPerLiter: 2.45,
      },
      cargo_truck: {
        baseFare: 14000,
        maxRatePerKm: 3000.0,
        standardRatePerKm: 2400.0,
        baseLitersPer100Km: 21.0,
        co2KgPerLiter: 2.68,
      },
    },
    defaultCorridors: [
      'Dar es Salaam Port Container Terminal → Ubungo ICD Hub',
      'Julius Nyerere Intl Airport (DAR) → Posta CBD',
      'Dar es Salaam → Morogoro Central Highway Corridor',
      'Namanga Border Post → Arusha Transit Depot',
    ],
  },
  DJ: {
    countryCode: 'DJ',
    countryName: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    authorityName: 'Direction des Transports Terrestres (DTT) & Port de Djibouti',
    shortAuthority: 'DTT / Port Djibouti',
    inspectionAuthority: 'DTT Centre National de Contrôle Technique Automobile',
    inspectionLabel: 'Certificat de Visite Technique Automobile (VTA)',
    pumpPricePerLiter: 315.0,
    fuelBenchmarkSource: 'Ministère de l’Énergie Prix des Hydrocarbures Réglementé',
    exchangeRateToETB: 0.70,
    directiveCode: 'Décret N° 2018-192/PR/MET Port & Transit Corridor Safety',
    emissionsStandard: 'Port Autonome de Djibouti Green Corridor Standard',
    rideCommissionCapPct: 12,
    maxSurgeMultiplierCap: 1.4,
    rideWaitMinRate: 15.0,
    truckTonKmRate: 35.0,
    truckDemurrageDailyCap: 28000,
    truckWeighbridgeDirective: 'Port Autonome de Djibouti & DTT Single Customs Transit Protocol',
    documents: {
      commercial_license: {
        label: 'Permis Professionnel Poids Lourd / Transport DTT',
        shortLabel: 'Permis DTT',
        codePrefix: 'DJ-PCP',
        maxWeight: 30,
        deduction30d: 12,
        deduction14d: 20,
        deductionExpired: 35,
      },
      bola_inspection: {
        label: 'Visite Technique Automobile Annuelle (VTA)',
        shortLabel: 'VTA Insp',
        codePrefix: 'DTT-VTA',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      third_party_insurance: {
        label: 'Assurance Automobile RC Obligatoire',
        shortLabel: 'Insurance',
        codePrefix: 'DJ-ASSUR',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      tin_clearance: {
        label: 'DGI Quitus Fiscal & Numéro d’Identification (NIF)',
        shortLabel: 'DGI Tax',
        codePrefix: 'DGI-NIF',
        maxWeight: 20,
        deduction30d: 8,
        deduction14d: 12,
        deductionExpired: 20,
      },
    },
    standards: {
      sedan: {
        baseFare: 450,
        maxRatePerKm: 160.0,
        standardRatePerKm: 125.0,
        baseLitersPer100Km: 7.2,
        co2KgPerLiter: 2.31,
      },
      minibus: {
        baseFare: 650,
        maxRatePerKm: 220.0,
        standardRatePerKm: 180.0,
        baseLitersPer100Km: 11.5,
        co2KgPerLiter: 2.45,
      },
      cargo_truck: {
        baseFare: 2600,
        maxRatePerKm: 600.0,
        standardRatePerKm: 480.0,
        baseLitersPer100Km: 21.0,
        co2KgPerLiter: 2.68,
      },
    },
    defaultCorridors: [
      'Doraleh Multipurpose Port (DMP) → Galafi Border Post (Ethiopia)',
      'Port Autonome de Djibouti → PK12 Logistics Terminal',
      'Djibouti Ville Centre → Ambouli International Airport',
      'Djibouti → Loyada Border Post (Somaliland)',
    ],
  },
  SO: {
    countryCode: 'SO',
    countryName: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD',
    currencySymbol: '$',
    authorityName: 'Ministry of Transport & Civil Aviation (MoTCA)',
    shortAuthority: 'MoTCA',
    inspectionAuthority: 'Federal Directorate of Motor Vehicle Safety',
    inspectionLabel: 'MoTCA Safety & Mechanical Fitness Certificate',
    pumpPricePerLiter: 0.85,
    fuelBenchmarkSource: 'Ministry of Petroleum & Mineral Resources Benchmark',
    exchangeRateToETB: 125.0,
    directiveCode: 'Federal Transport Regulatory Act & Inter-State Transit Protocol',
    emissionsStandard: 'IGAD Regional Transport Clean Air Protocol',
    rideCommissionCapPct: 10,
    maxSurgeMultiplierCap: 1.3,
    rideWaitMinRate: 0.10,
    truckTonKmRate: 0.22,
    truckDemurrageDailyCap: 50,
    truckWeighbridgeDirective: 'MoTCA Commercial Transit & Corridor Axle Guidelines',
    documents: {
      commercial_license: {
        label: 'MoTCA Commercial Transport Driving License',
        shortLabel: 'MoTCA Lic',
        codePrefix: 'SO-CDL',
        maxWeight: 30,
        deduction30d: 12,
        deduction14d: 20,
        deductionExpired: 35,
      },
      bola_inspection: {
        label: 'Safety & Roadworthiness Inspection Certificate',
        shortLabel: 'Safety Insp',
        codePrefix: 'MOT-SIC',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      third_party_insurance: {
        label: 'Commercial Motor Third-Party Liability',
        shortLabel: 'Insurance',
        codePrefix: 'SO-INS',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      tin_clearance: {
        label: 'Ministry of Finance TIN & Tax Clearance',
        shortLabel: 'MoF Tax',
        codePrefix: 'SO-TIN',
        maxWeight: 20,
        deduction30d: 8,
        deduction14d: 12,
        deductionExpired: 20,
      },
    },
    standards: {
      sedan: {
        baseFare: 2.0,
        maxRatePerKm: 0.70,
        standardRatePerKm: 0.55,
        baseLitersPer100Km: 7.2,
        co2KgPerLiter: 2.31,
      },
      minibus: {
        baseFare: 3.0,
        maxRatePerKm: 1.00,
        standardRatePerKm: 0.80,
        baseLitersPer100Km: 11.5,
        co2KgPerLiter: 2.45,
      },
      cargo_truck: {
        baseFare: 12.0,
        maxRatePerKm: 2.80,
        standardRatePerKm: 2.20,
        baseLitersPer100Km: 21.0,
        co2KgPerLiter: 2.68,
      },
    },
    defaultCorridors: [
      'Berbera Port Container Terminal → Wajaale Border Hub (Ethiopia)',
      'Mogadishu Sea Port → K4 (KM4) Commercial Junction',
      'Aden Adde International Airport → Medina Gateway',
      'Garowe Logistics Yard → Bosaso Commercial Port',
    ],
  },
  SS: {
    countryCode: 'SS',
    countryName: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP',
    currencySymbol: 'SS£',
    authorityName: 'Ministry of Transport & Roads (MoTR) & Traffic Police',
    shortAuthority: 'MoTR / Police',
    inspectionAuthority: 'Directorate of Traffic Police Vehicle Inspection',
    inspectionLabel: 'Traffic Police Roadworthiness & Mechanical Certificate',
    pumpPricePerLiter: 1450.0,
    fuelBenchmarkSource: 'Ministry of Petroleum Fuel Ceiling Benchmark',
    exchangeRateToETB: 0.086,
    directiveCode: 'National Road Safety Act 2012 & MoTR Transit Regulations',
    emissionsStandard: 'South Sudan Road Transport Baseline Standard',
    rideCommissionCapPct: 12,
    maxSurgeMultiplierCap: 1.4,
    rideWaitMinRate: 90.0,
    truckTonKmRate: 180.0,
    truckDemurrageDailyCap: 95000,
    truckWeighbridgeDirective: 'MoTR South Sudan Road Transport Safety & Axle Protocol',
    documents: {
      commercial_license: {
        label: 'MoTR Commercial Heavy Duty Driving License',
        shortLabel: 'MoTR Lic',
        codePrefix: 'SS-CDL',
        maxWeight: 30,
        deduction30d: 12,
        deduction14d: 20,
        deductionExpired: 35,
      },
      bola_inspection: {
        label: 'Traffic Police Roadworthiness Certificate',
        shortLabel: 'Police Insp',
        codePrefix: 'MOTR-RWC',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      third_party_insurance: {
        label: 'South Sudan Insurance Commission Third Party',
        shortLabel: 'Insurance',
        codePrefix: 'SSIC-POL',
        maxWeight: 25,
        deduction30d: 10,
        deduction14d: 16,
        deductionExpired: 28,
      },
      tin_clearance: {
        label: 'National Revenue Authority (NRA) Tax Clearance',
        shortLabel: 'NRA Tax',
        codePrefix: 'NRA-TCC',
        maxWeight: 20,
        deduction30d: 8,
        deduction14d: 12,
        deductionExpired: 20,
      },
    },
    standards: {
      sedan: {
        baseFare: 2000,
        maxRatePerKm: 700.0,
        standardRatePerKm: 550.0,
        baseLitersPer100Km: 7.2,
        co2KgPerLiter: 2.31,
      },
      minibus: {
        baseFare: 3000,
        maxRatePerKm: 1000.0,
        standardRatePerKm: 800.0,
        baseLitersPer100Km: 11.5,
        co2KgPerLiter: 2.45,
      },
      cargo_truck: {
        baseFare: 11000,
        maxRatePerKm: 2500.0,
        standardRatePerKm: 2000.0,
        baseLitersPer100Km: 21.0,
        co2KgPerLiter: 2.68,
      },
    },
    defaultCorridors: [
      'Nimule One-Stop Border Post → Juba Customs Yard',
      'Juba International Airport (JUB) → Ministries Complex',
      'Juba Port (White Nile) → Gumbo Logistics Park',
      'Juba → Nesitu Trade Interchange',
    ],
  },
};

// Legacy backward compatibility specification for Ethiopia (FTA/Bola)
export const DOCUMENT_SPECIFICATIONS = EAST_AFRICA_REGULATORY_AUTHORITIES.ET.documents;

export function getDocumentSpecsForCountry(countryCode?: EastAfricaCountryCode) {
  if (!countryCode || countryCode === 'ALL') {
    return EAST_AFRICA_REGULATORY_AUTHORITIES.ET.documents;
  }
  return EAST_AFRICA_REGULATORY_AUTHORITIES[countryCode]?.documents || EAST_AFRICA_REGULATORY_AUTHORITIES.ET.documents;
}

export function inferCountryCodeFromPlateOrPhone(
  plate?: string,
  phone?: string,
  explicitCountry?: EastAfricaCountryCode
): Exclude<EastAfricaCountryCode, 'ALL'> {
  if (explicitCountry && explicitCountry !== 'ALL') return explicitCountry;
  const p = (plate || '').trim().toUpperCase();
  const ph = (phone || '').replace(/\s+/g, '');

  if (p.startsWith('KDA') || p.startsWith('KB') || p.startsWith('KC') || p.startsWith('KD') || ph.startsWith('+254')) return 'KE';
  if (p.startsWith('UB') || p.startsWith('UG') || ph.startsWith('+256')) return 'UG';
  if (p.startsWith('RA') || p.startsWith('RW') || ph.startsWith('+250')) return 'RW';
  if (p.startsWith('T-') || p.startsWith('TZ') || ph.startsWith('+255')) return 'TZ';
  if (p.startsWith('DJ') || ph.startsWith('+253')) return 'DJ';
  if (p.startsWith('MOG') || p.startsWith('SO') || ph.startsWith('+252')) return 'SO';
  if (p.startsWith('SSD') || p.startsWith('SS') || ph.startsWith('+211')) return 'SS';
  return 'ET';
}

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
  countryCode?: EastAfricaCountryCode;
}): DriverDocumentComplianceRecord {
  const { driver, matchedVehicle, sourceClass = 'Driver', expiryDates, referenceNow = new Date() } = params;
  const driverKey = driver.objectId || driver.id || driver.phone;
  const plateSuffix = (driver.vehiclePlate || '0000').replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase();

  const cCode = inferCountryCodeFromPlateOrPhone(driver.vehiclePlate, driver.phone, params.countryCode || driver.countryCode);
  const countryInfo = EAST_AFRICA_REGULATORY_AUTHORITIES[cCode];
  const docSpecs = countryInfo.documents;

  const deductions: ComplianceDeductionItem[] = [];
  const docOrder: DriverDocumentType[] = [
    'commercial_license',
    'bola_inspection',
    'third_party_insurance',
    'tin_clearance',
  ];

  const documents: DriverComplianceDocument[] = docOrder.map((docType, index) => {
    const spec = docSpecs[docType] || DOCUMENT_SPECIFICATIONS[docType];
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
      reason: `Assigned vehicle queued for physical ${countryInfo.inspectionLabel} workshop re-check`,
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
    countryCode: cCode,
    countryName: countryInfo.countryName,
    regulatoryAuthority: countryInfo.shortAuthority,
    inspectionAuthority: countryInfo.inspectionAuthority,
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

// Legacy standard for sedan, minibus, and cargo truck in Ethiopia
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
  // 🇪🇹 Ethiopia Corridors
  {
    id: 'cmp-et-1',
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
    fuelCostLocal: 66.90,
    co2Kg: 1.87,
    actualFareETB: 340.00,
    actualFareLocal: 340.00,
    legalMaxFareETB: 496.00,
    legalMaxFareLocal: 496.00,
    complianceStatus: 'compliant',
    notes: 'Standard metered fare well within Addis Ababa Transport Bureau ceiling.',
    date: 'Today, 09:42',
    countryCode: 'ET',
    currency: 'ETB',
    exchangeRateToETB: 1.0,
    regulatoryAuthority: 'FTA / AACTB',
    inspectionType: 'Annual Bola Roadworthiness',
  },
  {
    id: 'cmp-et-2',
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
    fuelCostLocal: 105.73,
    co2Kg: 2.96,
    actualFareETB: 480.00,
    actualFareLocal: 480.00,
    legalMaxFareETB: 688.00,
    legalMaxFareLocal: 688.00,
    complianceStatus: 'compliant',
    notes: 'Moderate congestion corridor fare compliant with municipal rate caps.',
    date: 'Today, 09:15',
    countryCode: 'ET',
    currency: 'ETB',
    exchangeRateToETB: 1.0,
    regulatoryAuthority: 'FTA / AACTB',
    inspectionType: 'Annual Bola Roadworthiness',
  },
  {
    id: 'cmp-et-3',
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
    fuelCostLocal: 204.85,
    co2Kg: 6.08,
    actualFareETB: 620.00,
    actualFareLocal: 620.00,
    legalMaxFareETB: 1170.00,
    legalMaxFareLocal: 1170.00,
    complianceStatus: 'compliant',
    notes: 'Airport shuttle corridor rate certified within group transit cap.',
    date: 'Today, 08:50',
    countryCode: 'ET',
    currency: 'ETB',
    exchangeRateToETB: 1.0,
    regulatoryAuthority: 'FTA / AACTB',
    inspectionType: 'Annual Bola Roadworthiness',
  },
  {
    id: 'cmp-et-4',
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
    fuelCostLocal: 43.78,
    co2Kg: 1.22,
    actualFareETB: 450.00,
    actualFareLocal: 450.00,
    legalMaxFareETB: 368.00,
    legalMaxFareLocal: 368.00,
    complianceStatus: 'tariff_exceeded',
    notes: 'Fare exceeds maximum ceiling by ETB 82.00 without approved surge permit.',
    date: 'Today, 08:12',
    countryCode: 'ET',
    currency: 'ETB',
    exchangeRateToETB: 1.0,
    regulatoryAuthority: 'FTA / AACTB',
    inspectionType: 'Annual Bola Roadworthiness',
  },
  {
    id: 'cmp-et-5',
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
    fuelCostLocal: 1420.72,
    co2Kg: 46.10,
    actualFareETB: 6800.00,
    actualFareLocal: 6800.00,
    legalMaxFareETB: 10707.50,
    legalMaxFareLocal: 10707.50,
    complianceStatus: 'compliant',
    notes: 'Inter-regional freight transit on expressway; fuel efficiency within green logistics target.',
    date: 'Yesterday, 17:30',
    countryCode: 'ET',
    currency: 'ETB',
    exchangeRateToETB: 1.0,
    regulatoryAuthority: 'FTA / AACTB',
    inspectionType: 'Annual Bola Roadworthiness',
  },

  // 🇰🇪 Kenya Corridors
  {
    id: 'cmp-ke-1',
    tripId: 'TRP-KE-402',
    vehiclePlate: 'KDA-491P',
    vehicleModel: 'Mercedes Actros Heavy Truck',
    vehicleType: 'cargo_truck',
    driverName: 'James Mwangi',
    distanceKm: 485.0,
    durationMin: 520,
    routeCorridor: 'Mombasa Port Terminal → ICD Embakasi Nairobi',
    estimatedFuelLiters: 112.04,
    fuelCostETB: 20095.0,
    fuelCostLocal: 21153.15,
    co2Kg: 300.27,
    actualFareETB: 78000.0,
    actualFareLocal: 82105.0,
    legalMaxFareETB: 81437.0,
    legalMaxFareLocal: 85725.0,
    complianceStatus: 'compliant',
    notes: 'EPRA fuel tariff compliant along Northern Corridor freight spine; speed governor certified.',
    date: 'Today, 07:15',
    countryCode: 'KE',
    currency: 'KES',
    exchangeRateToETB: 0.95,
    regulatoryAuthority: 'NTSA / EPRA',
    inspectionType: 'NTSA Motor Inspection',
  },
  {
    id: 'cmp-ke-2',
    tripId: 'TRP-KE-403',
    vehiclePlate: 'KBY-310M',
    vehicleModel: 'Toyota Noah Shuttle',
    vehicleType: 'minibus',
    driverName: 'Faith Wanjiku',
    distanceKm: 22.4,
    durationMin: 42,
    routeCorridor: 'Jomo Kenyatta Intl Airport (JKIA) → Westlands CBD',
    estimatedFuelLiters: 2.83,
    fuelCostETB: 508.0,
    fuelCostLocal: 534.30,
    co2Kg: 6.93,
    actualFareETB: 1520.0,
    actualFareLocal: 1600.0,
    legalMaxFareETB: 1700.0,
    legalMaxFareLocal: 1788.0,
    complianceStatus: 'compliant',
    notes: 'NTSA passenger PSV tariff compliant via Nairobi Expressway.',
    date: 'Today, 06:40',
    countryCode: 'KE',
    currency: 'KES',
    exchangeRateToETB: 0.95,
    regulatoryAuthority: 'NTSA / EPRA',
    inspectionType: 'NTSA Motor Inspection',
  },

  // 🇺🇬 Uganda Corridors
  {
    id: 'cmp-ug-1',
    tripId: 'TRP-UG-101',
    vehiclePlate: 'UBA-882K',
    vehicleModel: 'Scania R480 Container Hauler',
    vehicleType: 'cargo_truck',
    driverName: 'John Okello',
    distanceKm: 215.0,
    durationMin: 290,
    routeCorridor: 'Malaba One-Stop Border Post → Kampala ICD Bweyogerere',
    estimatedFuelLiters: 49.67,
    fuelCostETB: 8769.0,
    fuelCostLocal: 265734.0,
    co2Kg: 133.12,
    actualFareETB: 34500.0,
    actualFareLocal: 1045450.0,
    legalMaxFareETB: 37686.0,
    legalMaxFareLocal: 1142000.0,
    complianceStatus: 'compliant',
    notes: 'MoWT cross-border freight transit cleared at Malaba OSBP with SGS emissions sticker.',
    date: 'Yesterday, 19:20',
    countryCode: 'UG',
    currency: 'UGX',
    exchangeRateToETB: 0.033,
    regulatoryAuthority: 'MoWT / UNBS',
    inspectionType: 'UNBS / MoWT Inspection',
  },
  {
    id: 'cmp-ug-2',
    tripId: 'TRP-UG-102',
    vehiclePlate: 'UBB-102N',
    vehicleModel: 'Toyota Premio (2017)',
    vehicleType: 'sedan',
    driverName: 'Sarah Nalwanga',
    distanceKm: 42.0,
    durationMin: 55,
    routeCorridor: 'Entebbe International Airport → Kampala Nakasero CBD',
    estimatedFuelLiters: 3.33,
    fuelCostETB: 588.0,
    fuelCostLocal: 17815.5,
    co2Kg: 7.69,
    actualFareETB: 1800.0,
    actualFareLocal: 54545.0,
    legalMaxFareETB: 2088.0,
    legalMaxFareLocal: 63300.0,
    complianceStatus: 'compliant',
    notes: 'Compliant with MoWT Entebbe Expressway metered shuttle cap.',
    date: 'Today, 10:10',
    countryCode: 'UG',
    currency: 'UGX',
    exchangeRateToETB: 0.033,
    regulatoryAuthority: 'MoWT / UNBS',
    inspectionType: 'UNBS / MoWT Inspection',
  },

  // 🇷🇼 Rwanda Corridors
  {
    id: 'cmp-rw-1',
    tripId: 'TRP-RW-301',
    vehiclePlate: 'RAD-771B',
    vehicleModel: 'Isuzu Giga Heavy Tipper',
    vehicleType: 'cargo_truck',
    driverName: 'Jean-Paul Habimana',
    distanceKm: 148.0,
    durationMin: 210,
    routeCorridor: 'Rusumo Border Post → Kigali Logistics Platform (KLP Masaka)',
    estimatedFuelLiters: 34.19,
    fuelCostETB: 5071.0,
    fuelCostLocal: 55729.0,
    co2Kg: 91.63,
    actualFareETB: 18500.0,
    actualFareLocal: 203296.0,
    legalMaxFareETB: 20119.0,
    legalMaxFareLocal: 221100.0,
    complianceStatus: 'compliant',
    notes: 'RURA certified cross-border freight; Contrôle Technique sticker valid until Q4 2026.',
    date: 'Yesterday, 14:35',
    countryCode: 'RW',
    currency: 'RWF',
    exchangeRateToETB: 0.091,
    regulatoryAuthority: 'RURA / RNP',
    inspectionType: 'RNP Contrôle Technique',
  },

  // 🇹🇿 Tanzania Corridors
  {
    id: 'cmp-tz-1',
    tripId: 'TRP-TZ-501',
    vehiclePlate: 'T-592-DEK',
    vehicleModel: 'Sinotruk HOWO Prime Mover',
    vehicleType: 'cargo_truck',
    driverName: 'Juma Rashid',
    distanceKm: 38.5,
    durationMin: 75,
    routeCorridor: 'Dar es Salaam Port Container Terminal → Ubungo ICD Hub',
    estimatedFuelLiters: 8.89,
    fuelCostETB: 1247.0,
    fuelCostLocal: 27114.0,
    co2Kg: 23.83,
    actualFareETB: 5400.0,
    actualFareLocal: 117391.0,
    legalMaxFareETB: 5957.0,
    legalMaxFareLocal: 129500.0,
    complianceStatus: 'compliant',
    notes: 'LATRA port-to-dry-port regulated haulage rate certified within EWURA fuel bounds.',
    date: 'Today, 08:30',
    countryCode: 'TZ',
    currency: 'TZS',
    exchangeRateToETB: 0.046,
    regulatoryAuthority: 'LATRA / EWURA',
    inspectionType: 'TBS / LATRA Inspection',
  },

  // 🇩🇯 Djibouti Corridors
  {
    id: 'cmp-dj-1',
    tripId: 'TRP-DJ-701',
    vehiclePlate: 'DJ-4412-B',
    vehicleModel: 'Volvo FH16 Multi-Axle Truck',
    vehicleType: 'cargo_truck',
    driverName: 'Mohamed Farah',
    distanceKm: 198.0,
    durationMin: 270,
    routeCorridor: 'Doraleh Multipurpose Port (DMP) → Galafi Border Post (Ethiopia)',
    estimatedFuelLiters: 45.74,
    fuelCostETB: 10086.0,
    fuelCostLocal: 14408.0,
    co2Kg: 122.58,
    actualFareETB: 78500.0,
    actualFareLocal: 112142.0,
    legalMaxFareETB: 85008.0,
    legalMaxFareLocal: 121440.0,
    complianceStatus: 'compliant',
    notes: 'DTT port transit authority cleared for Ethiopia corridor; VTA roadworthiness certificate attached.',
    date: 'Today, 05:50',
    countryCode: 'DJ',
    currency: 'DJF',
    exchangeRateToETB: 0.70,
    regulatoryAuthority: 'DTT / Port Djibouti',
    inspectionType: 'DTT Visite Technique (VTA)',
  },

  // 🇸🇴 Somalia Corridors
  {
    id: 'cmp-so-1',
    tripId: 'TRP-SO-801',
    vehiclePlate: 'MOG-7721',
    vehicleModel: 'Isuzu Forward Cargo Truck',
    vehicleType: 'cargo_truck',
    driverName: 'Hassan Warsame',
    distanceKm: 242.0,
    durationMin: 340,
    routeCorridor: 'Berbera Port Container Terminal → Wajaale Border Hub (Ethiopia)',
    estimatedFuelLiters: 55.9,
    fuelCostETB: 5939.0,
    fuelCostLocal: 47.51,
    co2Kg: 149.81,
    actualFareETB: 81250.0,
    actualFareLocal: 650.0,
    legalMaxFareETB: 86200.0,
    legalMaxFareLocal: 689.60,
    complianceStatus: 'compliant',
    notes: 'Berbera transit corridor transit protocol audited; safe mechanical clearance certified.',
    date: 'Yesterday, 11:20',
    countryCode: 'SO',
    currency: 'USD',
    exchangeRateToETB: 125.0,
    regulatoryAuthority: 'MoTCA',
    inspectionType: 'MoTCA Safety Inspection',
  },

  // 🇸🇸 South Sudan Corridors
  {
    id: 'cmp-ss-1',
    tripId: 'TRP-SS-901',
    vehiclePlate: 'SSD-8841-A',
    vehicleModel: 'DAF CF Heavy Cargo Hauler',
    vehicleType: 'cargo_truck',
    driverName: 'Deng Garang',
    distanceKm: 192.0,
    durationMin: 320,
    routeCorridor: 'Nimule One-Stop Border Post → Juba Customs Yard',
    estimatedFuelLiters: 44.35,
    fuelCostETB: 5530.0,
    fuelCostLocal: 64307.5,
    co2Kg: 118.86,
    actualFareETB: 37500.0,
    actualFareLocal: 436046.0,
    legalMaxFareETB: 42226.0,
    legalMaxFareLocal: 491000.0,
    complianceStatus: 'compliant',
    notes: 'MoTR & Traffic Police cross-border transport permit verified at Nimule OSBP customs.',
    date: 'Yesterday, 16:10',
    countryCode: 'SS',
    currency: 'SSP',
    exchangeRateToETB: 0.086,
    regulatoryAuthority: 'MoTR / Police',
    inspectionType: 'Traffic Police Inspection',
    serviceModule: 'truck',
    cargoWeightTons: 22,
    platformCommissionPct: 12,
    platformCommissionCapPct: 12,
    commissionCompliance: 'compliant',
    surgeMultiplierApplied: 1.0,
    maxSurgeCap: 1.4,
    variancePct: -11.2,
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
  actualFare: number,
  corridor: string,
  countryCode: EastAfricaCountryCode = 'ET',
  options?: {
    serviceModule?: 'ride' | 'truck';
    cargoWeightTons?: number;
    platformCommissionPct?: number;
    surgeMultiplierApplied?: number;
  }
): FleetTripCompliance {
  const cCode = countryCode === 'ALL' ? 'ET' : countryCode;
  const regInfo = EAST_AFRICA_REGULATORY_AUTHORITIES[cCode] || EAST_AFRICA_REGULATORY_AUTHORITIES.ET;
  const spec = regInfo.standards[vehicleType];

  const fuelLiters = Math.round(((distanceKm / 100) * spec.baseLitersPer100Km * 1.1) * 100) / 100;
  const fuelCostLocal = Math.round(fuelLiters * regInfo.pumpPricePerLiter * 100) / 100;
  const fuelCostETB = Math.round(fuelCostLocal * regInfo.exchangeRateToETB * 100) / 100;
  const co2 = Math.round(fuelLiters * spec.co2KgPerLiter * 100) / 100;

  const legalMaxLocal = Math.round((spec.baseFare + distanceKm * spec.maxRatePerKm) * 100) / 100;
  const legalMaxETB = Math.round(legalMaxLocal * regInfo.exchangeRateToETB * 100) / 100;

  const actualFareLocal = actualFare;
  const actualFareETB = Math.round(actualFareLocal * regInfo.exchangeRateToETB * 100) / 100;

  const variancePct = legalMaxLocal > 0
    ? Math.round(((actualFareLocal - legalMaxLocal) / legalMaxLocal) * 1000) / 10
    : 0;

  const serviceModule: 'ride' | 'truck' = options?.serviceModule || (vehicleType === 'cargo_truck' ? 'truck' : 'ride');
  const cargoWeightTons = options?.cargoWeightTons ?? (serviceModule === 'truck' ? 12 : undefined);
  const platformCommissionPct = options?.platformCommissionPct ?? (regInfo.rideCommissionCapPct || 15);
  const platformCommissionCapPct = regInfo.rideCommissionCapPct || 15;
  const commissionCompliance = platformCommissionPct <= platformCommissionCapPct ? 'compliant' : 'commission_exceeded';
  const surgeMultiplierApplied = options?.surgeMultiplierApplied ?? 1.0;
  const maxSurgeCap = regInfo.maxSurgeMultiplierCap || 1.5;

  let complianceStatus: 'compliant' | 'tariff_exceeded' | 'undercharged' = 'compliant';
  let notes = `Certified compliant with ${regInfo.shortAuthority} statutory tariff caps (${regInfo.currency} ${legalMaxLocal.toFixed(2)} max).`;

  if (actualFareLocal > legalMaxLocal) {
    complianceStatus = 'tariff_exceeded';
    notes = `Exceeds ${regInfo.shortAuthority} tariff ceiling by ${regInfo.currency} ${(actualFareLocal - legalMaxLocal).toFixed(2)} (+${variancePct}% variance).`;
  } else if (actualFareLocal < spec.baseFare * 0.8) {
    complianceStatus = 'undercharged';
    notes = 'Below standard operational cost threshold; review driver commission subsidy.';
  }

  return {
    id: `cmp-${cCode.toLowerCase()}-${Date.now()}`,
    tripId,
    vehiclePlate,
    vehicleModel,
    vehicleType,
    driverName,
    distanceKm,
    durationMin,
    routeCorridor: corridor,
    estimatedFuelLiters: fuelLiters,
    fuelCostETB,
    fuelCostLocal,
    co2Kg: co2,
    actualFareETB,
    actualFareLocal,
    legalMaxFareETB: legalMaxETB,
    legalMaxFareLocal: legalMaxLocal,
    complianceStatus,
    notes,
    date: 'Just now',
    countryCode: cCode,
    currency: regInfo.currency,
    exchangeRateToETB: regInfo.exchangeRateToETB,
    regulatoryAuthority: regInfo.shortAuthority,
    inspectionType: regInfo.inspectionLabel,
    serviceModule,
    cargoWeightTons,
    platformCommissionPct,
    platformCommissionCapPct,
    commissionCompliance,
    surgeMultiplierApplied,
    maxSurgeCap,
    variancePct,
  };
}

class FleetComplianceService {
  private records: FleetTripCompliance[] = [...INITIAL_COMPLIANCE_RECORDS];

  getRecords(countryCode?: EastAfricaCountryCode): FleetTripCompliance[] {
    if (!countryCode || countryCode === 'ALL') {
      return [...this.records];
    }
    return this.records.filter((r) => r.countryCode === countryCode);
  }

  addRecord(record: FleetTripCompliance) {
    this.records = [record, ...this.records];
  }

  getSummary(countryCode?: EastAfricaCountryCode) {
    const list = this.getRecords(countryCode);
    const totalTrips = list.length;
    const compliantCount = list.filter((r) => r.complianceStatus === 'compliant').length;
    const violationsCount = list.filter((r) => r.complianceStatus === 'tariff_exceeded').length;
    const totalFuelLiters = list.reduce((acc, r) => acc + r.estimatedFuelLiters, 0);
    const totalFuelCostETB = list.reduce((acc, r) => acc + r.fuelCostETB, 0);
    const totalCo2Kg = list.reduce((acc, r) => acc + r.co2Kg, 0);

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
