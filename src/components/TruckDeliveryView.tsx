import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  FileText,
  Plus,
  ChevronRight,
  X,
  Download,
  Lock,
  Radio,
  CheckCircle2,
  ArrowRight,
  Globe,
  ShieldCheck,
  Scale,
  Truck,
  MapPin,
  TrendingUp,
  Compass,
  Search,
  Building2,
  Fuel,
  Layers,
  Activity,
  Clock,
  CreditCard,
  AlertCircle,
  Filter,
  Check,
  ExternalLink,
  Eye,
  RefreshCw,
  Sliders,
  Anchor,
} from 'lucide-react';
import {
  EastAfricaCountryCode,
  EastAfricaCurrency,
  PermissionAction,
  Shipment,
  ShipmentStatus,
} from '../types';
import { downloadCsv, hasPermission } from '../services/rbac';
import { resolveItemCountryCode } from './JurisdictionDashboardWrapper';

interface TruckDeliveryViewProps {
  darkMode: boolean;
  shipments: Shipment[];
  userRole: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  userName?: string;
  userEmail?: string;
  onAddShipment: (shipment: Shipment) => Promise<void>;
  onUpdateShipmentStatus: (shipmentId: string, status: ShipmentStatus) => Promise<void>;
  onNotify: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
}

const NEXT_STAGE_MAP: Record<ShipmentStatus, { next: ShipmentStatus; label: string } | null> = {
  Pending: { next: 'Picked Up', label: 'Mark Picked Up' },
  'Picked Up': { next: 'In Transit', label: 'Dispatch In Transit' },
  'In Transit': { next: 'Delivered', label: 'Confirm Delivery' },
  Delivered: null,
};

export interface CountryFreightConfig {
  code: Exclude<EastAfricaCountryCode, 'ALL'>;
  name: string;
  flag: string;
  capital: string;
  currency: EastAfricaCurrency;
  currencySymbol: string;
  exchangeRateToETB: number; // 1 unit in local = X ETB
  toLocalFactor: number;     // 1 ETB = toLocalFactor in local currency
  regulatorName: string;
  regulatorAcronym: string;
  regulatorBadge: string;
  customsAuthority: string;
  weighbridgeStandard: string;
  primaryWeighbridges: string[];
  primaryCorridors: string[];
  borderGates: string[];
  keyTerminals: string[];
  plateHint: string;
  plateRegexExample: string;
  dieselPerLiter: number; // in local currency
  avgTonKmRate: number;   // in local currency per ton-km
  popularHaulers: string[];
  radarWaypoints: {
    name: string;
    type: 'port' | 'weighbridge' | 'border' | 'icd';
    status: 'Nominal' | 'Clear' | 'Busy';
    delayMins: number;
  }[];
}

export const EAST_AFRICA_FREIGHT_CONFIGS: Record<Exclude<EastAfricaCountryCode, 'ALL'>, CountryFreightConfig> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    capital: 'Addis Ababa',
    currency: 'ETB',
    currencySymbol: 'Br',
    exchangeRateToETB: 1.0,
    toLocalFactor: 1.0,
    regulatorName: 'Federal Transport Authority & Ethiopian Customs Commission',
    regulatorAcronym: 'FTA / ECC',
    regulatorBadge: 'Annual Commercial Haulage License & Transit TIN',
    customsAuthority: 'Ethiopian Customs Commission (ECC) Bonded Transit',
    weighbridgeStandard: 'FTA 56-Ton Gross Combination Mass (GCM) · 3-Axle Semi-Trailer',
    primaryWeighbridges: ['Modjo Dry Port Static Scale', 'Kality Toll Weighbridge', 'Galafi Customs Scale', 'Awash Multi-Axle WIM'],
    primaryCorridors: [
      'Addis Ababa – Modjo Dry Port – Awash – Galafi – Djibouti Port',
      'Addis Ababa – Hawassa Industrial Park Corridor',
      'Dire Dawa Free Trade Zone – Jigjiga Corridor',
      'Mekelle – Kombolcha – Addis Logistics Lifeline',
    ],
    borderGates: ['Galafi OSBP (Djibouti)', 'Moyale OSBP (Kenya)', 'Metema OSBP (Sudan)'],
    keyTerminals: ['Kality Inland Cargo Hub', 'Modjo Dry Port Bonded Terminal', 'Dire Dawa Dry Port', 'Hawassa Logistics Center'],
    plateHint: '3-ET-XXXXX (Commercial Prime Mover)',
    plateRegexExample: '3-ET-48190',
    dieselPerLiter: 114.5,
    avgTonKmRate: 4.8,
    popularHaulers: ['Volvo FH16 750', 'Mercedes-Benz Actros 3340', 'Scania R500 Flatbed', 'Sinotruk HOWO 371'],
    radarWaypoints: [
      { name: 'Kality Cargo Terminal', type: 'icd', status: 'Clear', delayMins: 0 },
      { name: 'Modjo Dry Port Weighbridge', type: 'weighbridge', status: 'Nominal', delayMins: 4 },
      { name: 'Awash Arba Transit Post', type: 'weighbridge', status: 'Clear', delayMins: 0 },
      { name: 'Galafi Border Crossing', type: 'border', status: 'Busy', delayMins: 18 },
    ],
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    capital: 'Nairobi',
    currency: 'KES',
    currencySymbol: 'KSh',
    exchangeRateToETB: 0.94,
    toLocalFactor: 1.06,
    regulatorName: 'Kenya National Highways Authority & Kenya Revenue Authority',
    regulatorAcronym: 'KeNHA / KRA',
    regulatorBadge: 'EAC-VLCA 2016 Weight Compliance & RECTS E-Seal',
    customsAuthority: 'KRA Customs & Border Control (SIMBA / iCMS Transit)',
    weighbridgeStandard: 'EAC Vehicle Load Control Act · 56T Gross Combination Weight',
    primaryWeighbridges: ['Mariakani High-Speed WIM', 'Athi River Weighbridge', 'Gilgil Virtual Scale', 'Webuye Virtual Station', 'Malaba Border Post Scale'],
    primaryCorridors: [
      'Northern Corridor: Port of Mombasa – Nairobi ICD Embakasi – Naivasha ICD – Malaba',
      'Nairobi – Namanga – Arusha Trans-National Corridor',
      'Mombasa – Lunga Lunga – Tanga Coastal Transit',
      'Isiolo – Moyale Lamu Port-South Sudan-Ethiopia-Transport (LAPSSET)',
    ],
    borderGates: ['Malaba OSBP (Uganda)', 'Busia OSBP (Uganda)', 'Namanga OSBP (Tanzania)', 'Moyale OSBP (Ethiopia)', 'Isebania OSBP (Tanzania)'],
    keyTerminals: ['Kilindini Container Terminal (Mombasa)', 'Nairobi ICD Embakasi', 'Naivasha Inland Container Depot', 'Eldoret Dry Port Hub'],
    plateHint: 'KDA-491P / ZE-8821 (Tractor / Trailer)',
    plateRegexExample: 'KDA-491P',
    dieselPerLiter: 182.0,
    avgTonKmRate: 5.2,
    popularHaulers: ['Mercedes-Benz Actros 2645', 'Scania G460 Streamline', 'Isuzu Giga Heavy 32T', 'MAN TGX 26.480'],
    radarWaypoints: [
      { name: 'Kilindini Port Berths 1-4', type: 'port', status: 'Clear', delayMins: 0 },
      { name: 'Mariakani HSWIM Weighbridge', type: 'weighbridge', status: 'Nominal', delayMins: 2 },
      { name: 'Athi River Axle Scale', type: 'weighbridge', status: 'Clear', delayMins: 0 },
      { name: 'Nairobi ICD Embakasi', type: 'icd', status: 'Nominal', delayMins: 6 },
      { name: 'Malaba OSBP Customs Gate', type: 'border', status: 'Busy', delayMins: 25 },
    ],
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    capital: 'Kampala',
    currency: 'UGX',
    currencySymbol: 'USh',
    exchangeRateToETB: 0.033,
    toLocalFactor: 30.5,
    regulatorName: 'Uganda National Roads Authority & Uganda Revenue Authority',
    regulatorAcronym: 'UNRA / URA',
    regulatorBadge: 'EAC RECTS Single Electronic Window Seal & ASYCUDA World',
    customsAuthority: 'URA Customs Department · Electronic Cargo Tracking System',
    weighbridgeStandard: 'UNRA Heavy Axle Regulations · 56-Ton Maximum Gross Mass',
    primaryWeighbridges: ['Busitema Weighbridge', 'Luwero High-Speed WIM', 'Mbarara Weighbridge', 'Magamaga Virtual Scale', 'Elegu Border Weighbridge'],
    primaryCorridors: [
      'Northern Corridor Trunk: Malaba OSBP – Jinja – Kampala Nakawa ICD – Masaka – Mbarara – Katuna OSBP',
      'Kampala – Gulu – Elegu OSBP (Juba South Sudan Lifeline)',
      'Tororo – Mbale – Soroti – Moroto Mineral Route',
      'Kampala – Fort Portal – Mpondwe Border (DR Congo Arterial)',
    ],
    borderGates: ['Malaba OSBP (Kenya)', 'Busia OSBP (Kenya)', 'Katuna OSBP (Rwanda)', 'Elegu OSBP (South Sudan)', 'Mpondwe OSBP (DR Congo)'],
    keyTerminals: ['Nakawa Inland Container Depot', 'Namanve Industrial Freight Yard', 'Mukono Inland Port', 'Tororo Logistics Hub'],
    plateHint: 'UBA-882K / UAZ-441P',
    plateRegexExample: 'UBA-882K',
    dieselPerLiter: 5100,
    avgTonKmRate: 145,
    popularHaulers: ['Scania R480 6x4', 'Mercedes-Benz Actros 3331', 'Volvo FMX 440 Heavy Hauler', 'Faw J6P 390'],
    radarWaypoints: [
      { name: 'Malaba Inbound OSBP', type: 'border', status: 'Nominal', delayMins: 12 },
      { name: 'Busitema HSWIM Station', type: 'weighbridge', status: 'Clear', delayMins: 0 },
      { name: 'Namanve Industrial Depot', type: 'icd', status: 'Clear', delayMins: 3 },
      { name: 'Katuna Border Customs Gate', type: 'border', status: 'Clear', delayMins: 5 },
    ],
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    capital: 'Kigali',
    currency: 'RWF',
    currencySymbol: 'FRw',
    exchangeRateToETB: 0.092,
    toLocalFactor: 10.9,
    regulatorName: 'Rwanda Transport Development Agency & Rwanda Revenue Authority',
    regulatorAcronym: 'RTDA / RRA',
    regulatorBadge: 'Single Customs Territory (SCT) Electronic Cargo Seal Certified',
    customsAuthority: 'RRA Customs Services · RECTS Electronic Manifest Seal',
    weighbridgeStandard: 'EAC Harmonized 56T Gross Limit · Strict 10T Steering Axle Cap',
    primaryWeighbridges: ['Rusumo OSBP Weighbridge', 'Masaka DP World Scale', 'Gatuna Border Weighbridge', 'Rubavu OSBP Static Scale'],
    primaryCorridors: [
      'Central Corridor: Rusumo OSBP (Tanzania Border) – Rwamagana – Kigali DP World Masaka',
      'Northern Corridor Link: Gatuna OSBP (Uganda Border) – Byumba – Kigali Hub',
      'Kigali – Muhanga – Karongi – Rubavu (Lake Kivu / Goma DRC Gate)',
      'Kigali – Nyanza – Huye – Akanyaru Haut (Burundi Border)',
    ],
    borderGates: ['Rusumo OSBP (Tanzania)', 'Gatuna OSBP (Uganda)', 'Rubavu La Corniche OSBP (DR Congo)', 'Kagitumba OSBP (Uganda)'],
    keyTerminals: ['DP World Logistics Center Masaka', 'Kigali Special Economic Zone (KSEZ)', 'Rubavu Cross-Border Port Hub'],
    plateHint: 'RAD-771B / RL-2241',
    plateRegexExample: 'RAD-771B',
    dieselPerLiter: 1680,
    avgTonKmRate: 54,
    popularHaulers: ['Volvo FH500 Globetrotter', 'Mercedes-Benz Actros 2642', 'Scania R450 EfficientLine', 'Iveco Stralis Hi-Way'],
    radarWaypoints: [
      { name: 'Rusumo Border Terminal', type: 'border', status: 'Clear', delayMins: 5 },
      { name: 'Rwamagana Transit Waypoint', type: 'weighbridge', status: 'Clear', delayMins: 0 },
      { name: 'DP World Masaka Logistics Center', type: 'icd', status: 'Nominal', delayMins: 4 },
      { name: 'Rubavu Gisenyi Border Gate', type: 'border', status: 'Clear', delayMins: 2 },
    ],
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    capital: 'Dodoma / Dar es Salaam',
    currency: 'TZS',
    currencySymbol: 'TSh',
    exchangeRateToETB: 0.046,
    toLocalFactor: 21.8,
    regulatorName: 'Tanzania National Roads Agency & Tanzania Revenue Authority',
    regulatorAcronym: 'TANROADS / TRA',
    regulatorBadge: 'TANCIS Integrated Customs & RECTS Central Corridor Seal',
    customsAuthority: 'TRA Customs & Excise Department · TANCIS Cargo Manifest',
    weighbridgeStandard: 'TANROADS Axle Load Regulations 2001 & EAC-VLCA 56T Limit',
    primaryWeighbridges: ['Kibaha High-Speed Weighbridge', 'Morogoro Weigh Station', 'Manyoni Axle Scale', 'Isaka Dry Port Scale', 'Mutukula Border Weighbridge'],
    primaryCorridors: [
      'Central Corridor: Dar es Salaam Port – Morogoro – Dodoma – Singida – Isaka Dry Port – Rusumo / Mutukula',
      'Dar es Salaam – Tunduma Trans-Kalahari / SADC Copper Corridor',
      'Dar es Salaam – Chalinze – Tanga – Arusha – Namanga OSBP',
      'Mtwara Corridor: Mtwara Port – Songea – Mbamba Bay',
    ],
    borderGates: ['Namanga OSBP (Kenya)', 'Rusumo OSBP (Rwanda)', 'Mutukula OSBP (Uganda)', 'Holili OSBP (Kenya)', 'Tunduma OSBP (Zambia)'],
    keyTerminals: ['Port of Dar es Salaam (TICTS / Berths 1-11)', 'Kwala Dry Port (Ruvu)', 'Isaka Dry Port & Inland Hub', 'Tanga Port Logistics Basin'],
    plateHint: 'T-592-DEK / T-881-AAL',
    plateRegexExample: 'T-592-DEK',
    dieselPerLiter: 3150,
    avgTonKmRate: 110,
    popularHaulers: ['Scania R500 V8', 'Mercedes-Benz Actros 3340 6x4', 'Shacman X3000 Heavy Tractor', 'Sinotruk HOWO A7'],
    radarWaypoints: [
      { name: 'Port of Dar es Salaam Berths', type: 'port', status: 'Busy', delayMins: 20 },
      { name: 'Kibaha High-Speed Weighbridge', type: 'weighbridge', status: 'Nominal', delayMins: 6 },
      { name: 'Kwala Dry Port Rail/Road Hub', type: 'icd', status: 'Clear', delayMins: 2 },
      { name: 'Isaka Dry Port Intermodal Gate', type: 'icd', status: 'Clear', delayMins: 0 },
    ],
  },
  DJ: {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    capital: 'Djibouti City',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    exchangeRateToETB: 0.70,
    toLocalFactor: 1.43,
    regulatorName: 'Djibouti Ports and Free Zones Authority & Ministry of Equipment',
    regulatorAcronym: 'DPFZA / MET',
    regulatorBadge: 'DPFZA Port Gate Container E-Pass & COMESA Customs Bond',
    customsAuthority: 'Direction des Douanes et Droits Indirects (Djibouti Customs)',
    weighbridgeStandard: 'COMESA / IGAD Multimodal 50-Ton Port Arterial Transit Standard',
    primaryWeighbridges: ['Doraleh Container Terminal (SGTD) Scale', 'PK20 Free Zone Heavy Scale', 'Dikhil Waypoint Scale', 'Galafi Border Weigh Station'],
    primaryCorridors: [
      'Djibouti – Addis Ababa Arterial: Port of Doraleh – PK12 – PK20 Free Zone – Weah – Dikhil – Galafi Border',
      'Port of Ghoubet – Tadjourah – Balho Border Corridor',
      'Djibouti – Loyada (Somaliland Border Transit Route)',
    ],
    borderGates: ['Galafi OSBP (Ethiopian Border)', 'Balho OSBP (Ethiopian North Border)', 'Loyada OSBP (Somaliland Border)'],
    keyTerminals: ['Doraleh Multipurpose Port (DMP)', 'Société de Gestion du Terminal de Doraleh (SGTD)', 'PK20 International Free Trade Zone', 'Nagad Logistics Depot'],
    plateHint: 'DJ-4412-B / 1284-TR',
    plateRegexExample: 'DJ-4412-B',
    dieselPerLiter: 215,
    avgTonKmRate: 7.2,
    popularHaulers: ['Renault Trucks K-Range 440', 'Mercedes-Benz Actros 3344', 'Volvo FMX 460 Heavy', 'Sinotruk Sitrak C7H'],
    radarWaypoints: [
      { name: 'Doraleh Multipurpose Port (DMP)', type: 'port', status: 'Clear', delayMins: 0 },
      { name: 'PK20 Free Zone Gate 2', type: 'icd', status: 'Nominal', delayMins: 5 },
      { name: 'Dikhil Checkpoint Station', type: 'weighbridge', status: 'Clear', delayMins: 0 },
      { name: 'Galafi Outbound Border Gate', type: 'border', status: 'Busy', delayMins: 15 },
    ],
  },
  SO: {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    capital: 'Mogadishu',
    currency: 'USD',
    currencySymbol: '$',
    exchangeRateToETB: 125.0,
    toLocalFactor: 0.008,
    regulatorName: 'Ministry of Transport & Civil Aviation & Mogadishu Port Authority',
    regulatorAcronym: 'MOTCA / MPA',
    regulatorBadge: 'Port Maritime Security Gate Clearing & Tare Scale Certificate',
    customsAuthority: 'Ministry of Finance Revenue & Customs Division',
    weighbridgeStandard: 'Tri-Axle 44-Ton Road Axle Limit · Port Weigh-In-Motion Gate',
    primaryWeighbridges: ['Mogadishu Port Albayrak Scale', 'Afgooye Checkpoint Weighbridge', 'Berbera Port DP World Scale (Somaliland)', 'Baidoa Logistics Hub Gate'],
    primaryCorridors: [
      'Mogadishu Seaport – Bakara Market – Afgooye – Wanlaweyn – Baidoa Lifeline Corridor',
      'Berbera Corridor: Berbera Port – Hargeisa – Tog Wajaale (Ethiopian Border)',
      'Kismayo Port – Jilib – Afmadow Southern Supply Route',
      'Bosaso Port – Qardho – Garowe Arterial Road',
    ],
    borderGates: ['Tog Wajaale OSBP (Ethiopia)', 'Doolow OSBP (Ethiopia)', 'Liboi / Dhobley Border (Kenya)'],
    keyTerminals: ['Port of Mogadishu (Albayrak Terminal)', 'Bakara Commercial Freight Hub', 'Berbera DP World Container Terminal', 'Kismayo Maritime Yard'],
    plateHint: 'MOG-7721 / SOM-9102',
    plateRegexExample: 'MOG-7721',
    dieselPerLiter: 1.15,
    avgTonKmRate: 0.045,
    popularHaulers: ['Mercedes-Benz 1924 / 2628 Curtainsider', 'Scania 113H Heavy', 'Sinotruk HOWO 380', 'Dongfeng Kingrun Hauler'],
    radarWaypoints: [
      { name: 'Port of Mogadishu Terminal', type: 'port', status: 'Clear', delayMins: 0 },
      { name: 'Bakara Logistics Hub', type: 'icd', status: 'Nominal', delayMins: 8 },
      { name: 'Afgooye Arterial Checkpoint', type: 'weighbridge', status: 'Nominal', delayMins: 6 },
      { name: 'Baidoa Cargo Depot', type: 'icd', status: 'Clear', delayMins: 0 },
    ],
  },
  SS: {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    capital: 'Juba',
    currency: 'SSP',
    currencySymbol: 'SS£',
    exchangeRateToETB: 0.088,
    toLocalFactor: 11.4,
    regulatorName: 'National Revenue Authority & Ministry of Transport',
    regulatorAcronym: 'NRA / MoTR',
    regulatorBadge: 'NRA Single Customs Document (SCD) & UN Humanitarian Cargo Clearance',
    customsAuthority: 'South Sudan National Revenue Authority (NRA Customs)',
    weighbridgeStandard: 'EAC 56-Ton Harmonized Transit Weight Standard · Nesitu Axle Cap',
    primaryWeighbridges: ['Nimule Border OSBP Weighbridge', 'Nesitu Highway Checkpoint Scale', 'Gumbo Customs Scale Juba', 'Juba River Port Yard Scale'],
    primaryCorridors: [
      'Northern Corridor Lifeline: Nimule OSBP (Uganda Border) – Nesitu Junction – Juba Inland Depot',
      'Juba – Mundri – Rumbek – Wau Western Supply Arterial',
      'Juba – Bor – Malakal White Nile River/Road Combined Transit Corridor',
      'Nadapal Border (Kenya) – Kapoeta – Torit – Juba Route',
    ],
    borderGates: ['Nimule OSBP (Uganda Border)', 'Nadapal OSBP (Kenya Border)', 'Kaya OSBP (Uganda/DR Congo Border)'],
    keyTerminals: ['Gumbo Customs & Dry Port Juba', 'Nimule Border Freight Yard', 'Juba River Port Terminal', 'Nesitu Logistics Transit Park'],
    plateHint: 'SSD-8841-A / CE-9912',
    plateRegexExample: 'SSD-8841-A',
    dieselPerLiter: 3400,
    avgTonKmRate: 98,
    popularHaulers: ['Mercedes-Benz Actros 3340 Off-Road', 'Scania G420 Heavy 6x6', 'Faw Tiger V Heavy Carrier', 'Sinotruk Steyr Heavy Tipper'],
    radarWaypoints: [
      { name: 'Nimule EAC OSBP Customs Gate', type: 'border', status: 'Busy', delayMins: 30 },
      { name: 'Nesitu Highway Checkpoint', type: 'weighbridge', status: 'Nominal', delayMins: 10 },
      { name: 'Gumbo Customs & Dry Port', type: 'icd', status: 'Nominal', delayMins: 4 },
      { name: 'Juba Central Logistics Depot', type: 'icd', status: 'Clear', delayMins: 0 },
    ],
  },
};

const SOVEREIGN_NATIONS_LIST: { code: EastAfricaCountryCode; name: string; flag: string }[] = [
  { code: 'ALL', name: 'Pan-East Africa (Unified Corridor Hub)', flag: '🌍' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
];

export interface HeavyTruckItem {
  id: string;
  model: string;
  plate: string;
  type: string;
  capacityTons: number;
  driver: string;
  driverPhone: string;
  status: 'In Transit' | 'Verified' | 'Inspection' | 'Maintenance';
  countryCode: Exclude<EastAfricaCountryCode, 'ALL'>;
  axleConfig: string;
  fuelLevelPercent: number;
  tirePressureStatus: 'Optimal' | 'Check Rear Tandem' | 'Nominal';
  gpsLock: boolean;
  assignedCorridor: string;
}

const DEFAULT_FLEET_TRUCKS: HeavyTruckItem[] = [
  // 🇪🇹 Ethiopia
  {
    id: 'TRK-ET-101',
    model: 'Mercedes-Benz Actros 3340',
    plate: '3-ET-48190',
    type: 'Heavy Flatbed Carrier',
    capacityTons: 32,
    driver: 'Tsegaye Hailu',
    driverPhone: '+251 911 223 344',
    status: 'In Transit',
    countryCode: 'ET',
    axleConfig: '6x4 Prime Mover + 3-Axle Trailer',
    fuelLevelPercent: 78,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Addis Ababa – Modjo Dry Port – Galafi',
  },
  {
    id: 'TRK-ET-102',
    model: 'Volvo FH16 750 Heavy Hauler',
    plate: '3-ET-91823',
    type: 'Bonded Container Hauler',
    capacityTons: 38,
    driver: 'Dawit Alemayehu',
    driverPhone: '+251 912 334 455',
    status: 'In Transit',
    countryCode: 'ET',
    axleConfig: '6x4 Prime Mover + Tri-Axle Skeletal',
    fuelLevelPercent: 62,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Dire Dawa Dry Port – Jigjiga Corridor',
  },
  {
    id: 'TRK-ET-103',
    model: 'Scania R500 Flatbed Carrier',
    plate: '3-ET-33910',
    type: 'Curtainsider / Tarpaulin',
    capacityTons: 28,
    driver: 'Hailemariam K.',
    driverPhone: '+251 913 445 566',
    status: 'Verified',
    countryCode: 'ET',
    axleConfig: '6x2 Prime Mover + 3-Axle Trailer',
    fuelLevelPercent: 91,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Modjo Dry Port – Hawassa Industrial Park',
  },

  // 🇰🇪 Kenya
  {
    id: 'TRK-KE-201',
    model: 'Scania G460 Streamline High-Torque',
    plate: 'KDA-491P',
    type: 'Intermodal 40ft Container Carrier',
    capacityTons: 34,
    driver: 'James Mwangi',
    driverPhone: '+254 722 123 456',
    status: 'In Transit',
    countryCode: 'KE',
    axleConfig: '6x4 Prime Mover + Tri-Axle Skeletal Trailer (ZE-8821)',
    fuelLevelPercent: 84,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Northern Corridor: Mombasa Port – Nairobi ICD',
  },
  {
    id: 'TRK-KE-202',
    model: 'Mercedes-Benz Actros 2645 Prime Mover',
    plate: 'KBY-310M',
    type: 'Insulated Bulk Carrier',
    capacityTons: 30,
    driver: 'Kevin Omondi',
    driverPhone: '+254 733 987 654',
    status: 'Verified',
    countryCode: 'KE',
    axleConfig: '6x2 Tag Axle + 3-Axle Box Semi-Trailer',
    fuelLevelPercent: 71,
    tirePressureStatus: 'Check Rear Tandem',
    gpsLock: true,
    assignedCorridor: 'Nairobi ICD – Naivasha ICD – Malaba',
  },

  // 🇺🇬 Uganda
  {
    id: 'TRK-UG-301',
    model: 'Volvo FMX 440 Heavy Hauler',
    plate: 'UBA-882K',
    type: 'Heavy Cargo & Rebar Carrier',
    capacityTons: 35,
    driver: 'John Okello',
    driverPhone: '+256 772 123 456',
    status: 'In Transit',
    countryCode: 'UG',
    axleConfig: '6x4 Heavy + EAC Multi-Axle Trailer (UAZ-441P)',
    fuelLevelPercent: 65,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Northern Corridor: Malaba OSBP – Kampala Nakawa',
  },
  {
    id: 'TRK-UG-302',
    model: 'Scania R480 6x4 Prime Mover',
    plate: 'UBB-551M',
    type: 'Fuel & Liquid Tanker',
    capacityTons: 36,
    driver: 'Paul Ssewankambo',
    driverPhone: '+256 701 987 654',
    status: 'Verified',
    countryCode: 'UG',
    axleConfig: '6x4 Prime Mover + 4-Compartment Petroleum Tanker',
    fuelLevelPercent: 88,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Kampala – Gulu – Elegu OSBP (Juba Lifeline)',
  },

  // 🇷🇼 Rwanda
  {
    id: 'TRK-RW-401',
    model: 'Volvo FH500 Globetrotter Euro 6',
    plate: 'RAD-771B',
    type: 'Cold-Chain Reefer & Pharma Carrier',
    capacityTons: 28,
    driver: 'Jean-Paul Habimana',
    driverPhone: '+250 788 123 789',
    status: 'In Transit',
    countryCode: 'RW',
    axleConfig: '6x2 Prime Mover + Thermoking Carrier (RL-2241)',
    fuelLevelPercent: 79,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Rusumo OSBP – Kigali DP World Masaka – Rubavu',
  },

  // 🇹🇿 Tanzania
  {
    id: 'TRK-TZ-501',
    model: 'Mercedes-Benz Actros 3340 Heavy Tractor',
    plate: 'T-592-DEK',
    type: 'Heavy Machinery & Mining Flatbed',
    capacityTons: 40,
    driver: 'Juma Rashid',
    driverPhone: '+255 754 987 321',
    status: 'In Transit',
    countryCode: 'TZ',
    axleConfig: '6x4 Prime Mover + Low-Bed Heavy Hauler (T-881-AAL)',
    fuelLevelPercent: 69,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Central Corridor: Dar es Salaam Port – Isaka Dry Port',
  },

  // 🇩🇯 Djibouti
  {
    id: 'TRK-DJ-601',
    model: 'Renault Trucks K-Range 440 Heavy',
    plate: 'DJ-4412-B',
    type: 'Doraleh Container 40ft Skeletal',
    capacityTons: 42,
    driver: 'Mohamed Farah',
    driverPhone: '+253 77 12 34 56',
    status: 'In Transit',
    countryCode: 'DJ',
    axleConfig: '6x4 Prime Mover + Heavy Tri-Axle Skeletal (1284-TR)',
    fuelLevelPercent: 93,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Doraleh Multipurpose Port – PK20 – Galafi OSBP',
  },

  // 🇸🇴 Somalia
  {
    id: 'TRK-SO-701',
    model: 'Sinotruk HOWO 380 Prime Mover',
    plate: 'MOG-7721',
    type: 'Box & FMCG General Cargo Carrier',
    capacityTons: 25,
    driver: 'Hassan Warsame',
    driverPhone: '+252 61 555 1234',
    status: 'In Transit',
    countryCode: 'SO',
    axleConfig: '6x4 Prime Mover + 2-Axle Dry Cargo Semi-Trailer',
    fuelLevelPercent: 60,
    tirePressureStatus: 'Nominal',
    gpsLock: true,
    assignedCorridor: 'Port of Mogadishu – Afgooye – Baidoa Lifeline',
  },

  // 🇸🇸 South Sudan
  {
    id: 'TRK-SS-801',
    model: 'Mercedes-Benz Actros 3340 All-Terrain',
    plate: 'SSD-8841-A',
    type: 'Humanitarian & Food Aid Hauler',
    capacityTons: 32,
    driver: 'Deng Garang',
    driverPhone: '+211 92 123 4567',
    status: 'In Transit',
    countryCode: 'SS',
    axleConfig: '6x4 Prime Mover + Heavy Reinforced Semi-Trailer',
    fuelLevelPercent: 74,
    tirePressureStatus: 'Optimal',
    gpsLock: true,
    assignedCorridor: 'Nimule EAC OSBP – Nesitu – Juba Central Depot',
  },
];

export const TruckDeliveryView: React.FC<TruckDeliveryViewProps> = ({
  shipments,
  userRole,
  userJurisdiction = 'ALL',
  userJurisdictionName,
  assignedCorridors = [],
  userName,
  userEmail,
  onAddShipment,
  onUpdateShipmentStatus,
  onNotify,
  onGuardPermission,
}) => {
  // Country filter initialized to user's assigned operational country
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(() => {
    return userJurisdiction || 'ALL';
  });

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'shipments' | 'fleet' | 'corridors'>('overview');
  const [statusFilter, setStatusFilter] = useState<'All' | ShipmentStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyMode, setCurrencyMode] = useState<'ETB' | 'LOCAL'>('LOCAL');
  const [fleetList, setFleetList] = useState<HeavyTruckItem[]>(DEFAULT_FLEET_TRUCKS);
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [telematicsPingTarget, setTelematicsPingTarget] = useState<string | null>(null);

  // Sync selectedCountry when userJurisdiction changes (e.g. persona switch)
  useEffect(() => {
    if (userJurisdiction) {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  // Selected shipment state
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(() => {
    return shipments[0]?.shipmentId || '';
  });
  const [showAddShipmentModal, setShowAddShipmentModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // New Shipment form state
  const activeCountryConfig = selectedCountry !== 'ALL' ? EAST_AFRICA_FREIGHT_CONFIGS[selectedCountry] : EAST_AFRICA_FREIGHT_CONFIGS.ET;

  const [newShipment, setNewShipment] = useState({
    countryCode: (selectedCountry !== 'ALL' ? selectedCountry : 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>,
    origin: activeCountryConfig.keyTerminals[0] || 'Kality Inland Cargo Hub',
    destination: activeCountryConfig.keyTerminals[1] || 'Modjo Dry Port Bonded Terminal',
    cargoType: 'Industrial Hardware & Construction Materials',
    tonnage: 24.5,
    truckPlate: activeCountryConfig.plateRegexExample,
    driver: 'Tsegaye Hailu',
    freightRateETB: 85000,
    freightRateLocal: 85000 * activeCountryConfig.toLocalFactor,
    initialStatus: 'Pending' as ShipmentStatus,
  });

  // When selectedCountry changes, update newShipment defaults
  useEffect(() => {
    const code = selectedCountry !== 'ALL' ? selectedCountry : 'ET';
    const cfg = EAST_AFRICA_FREIGHT_CONFIGS[code];
    setNewShipment((prev) => ({
      ...prev,
      countryCode: code,
      origin: cfg.keyTerminals[0] || prev.origin,
      destination: cfg.keyTerminals[1] || prev.destination,
      truckPlate: cfg.plateRegexExample,
      freightRateLocal: Math.round(prev.freightRateETB * cfg.toLocalFactor),
    }));
  }, [selectedCountry]);

  // New Truck form state
  const [newTruck, setNewTruck] = useState({
    model: 'Scania R500 V8 Heavy Hauler',
    plate: activeCountryConfig.plateRegexExample,
    type: 'Intermodal Container Carrier',
    capacityTons: 36,
    driver: 'Contract Fleet Operator',
    driverPhone: '+254 722 000 111',
    countryCode: (selectedCountry !== 'ALL' ? selectedCountry : 'KE') as Exclude<EastAfricaCountryCode, 'ALL'>,
    axleConfig: '6x4 Prime Mover + 3-Axle Semi-Trailer',
    assignedCorridor: activeCountryConfig.primaryCorridors[0],
  });

  const canManageFreight = hasPermission(userRole, 'manage_freight');

  // Filter shipments based on selected country
  const countryShipments = useMemo(() => {
    if (selectedCountry === 'ALL') return shipments;
    return shipments.filter((s) => resolveItemCountryCode(s, 'shipment') === selectedCountry);
  }, [shipments, selectedCountry]);

  // Apply search and status filters
  const filteredShipments = useMemo(() => {
    return countryShipments.filter((s) => {
      const matchesStatus = statusFilter === 'All' ? true : s.status === statusFilter;
      if (!matchesStatus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.shipmentId.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.cargoType.toLowerCase().includes(q) ||
        s.truckPlate.toLowerCase().includes(q) ||
        s.driver.toLowerCase().includes(q)
      );
    });
  }, [countryShipments, statusFilter, searchQuery]);

  // Selected shipment object
  const selectedShipment = useMemo(() => {
    return (
      filteredShipments.find((s) => s.shipmentId === selectedShipmentId) ||
      countryShipments.find((s) => s.shipmentId === selectedShipmentId) ||
      filteredShipments[0] ||
      countryShipments[0] ||
      shipments[0] ||
      null
    );
  }, [filteredShipments, countryShipments, shipments, selectedShipmentId]);

  // Filter fleet based on selected country
  const filteredFleet = useMemo(() => {
    if (selectedCountry === 'ALL') return fleetList;
    return fleetList.filter((t) => t.countryCode === selectedCountry);
  }, [fleetList, selectedCountry]);

  // Active country config
  const countryConfig = selectedCountry !== 'ALL' ? EAST_AFRICA_FREIGHT_CONFIGS[selectedCountry] : null;

  // Computed live metrics for the country / unified view
  const inTransitCount = countryShipments.filter(
    (s) => s.status === 'In Transit' || s.status === 'Picked Up'
  ).length;
  const deliveredCount = countryShipments.filter((s) => s.status === 'Delivered').length;
  const pendingCount = countryShipments.filter((s) => s.status === 'Pending').length;
  const totalTonnage = countryShipments.reduce((sum, s) => sum + Number(s.tonnage || 0), 0);
  const totalFreightETB = countryShipments.reduce((sum, s) => sum + Number(s.freightRateETB || 0), 0);

  // Currency helper
  const formatCurrency = (amountETB: number) => {
    if (!countryConfig || currencyMode === 'ETB') {
      return `ETB ${Math.round(amountETB).toLocaleString()}`;
    }
    const localAmount = amountETB * countryConfig.toLocalFactor;
    return `${countryConfig.currencySymbol} ${Math.round(localAmount).toLocaleString()} ${countryConfig.currency}`;
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'In Transit':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'Picked Up':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    }
  };

  const handleOpenDispatchModal = () => {
    if (!onGuardPermission('manage_freight', 'Dispatching new freight cargo')) return;
    setShowAddShipmentModal(true);
  };

  const handleAdvanceStatus = async (shipment: Shipment, nextStatus: ShipmentStatus) => {
    if (!onGuardPermission('manage_freight', 'Advancing freight waybill status')) return;
    await onUpdateShipmentStatus(shipment.shipmentId, nextStatus);
    onNotify(
      `Shipment ${shipment.shipmentId} Updated`,
      `Manifest status progressed to "${nextStatus}". RECTS e-Seal & weighbridge telemetry synchronized.`,
      'success'
    );
  };

  const handlePingTelematics = (plate?: string, driverName?: string) => {
    const targetPlate = plate || selectedShipment?.truckPlate || 'Prime Mover';
    const targetDriver = driverName || selectedShipment?.driver || 'Driver';
    setTelematicsPingTarget(targetPlate);
    setTimeout(() => setTelematicsPingTarget(null), 2500);

    const corridorLabel = countryConfig
      ? countryConfig.primaryCorridors[0]
      : 'Pan-East Africa Cross-Border Transit Corridor';

    onNotify(
      `Telematics Lock Acknowledged · ${targetPlate}`,
      `Carrier ${targetDriver} responded via RECTS Transponder on ${corridorLabel}. GPS fix nominal, electronic tamper seal intact, axle load compliant.`,
      'info'
    );
  };

  const handleExportWaybillsCsv = () => {
    const countryName = countryConfig ? countryConfig.name : 'Pan-East-Africa';
    downloadCsv(
      `afronala_freight_manifests_${selectedCountry}_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Shipment ID',
        'Country',
        'Status',
        'Origin Terminal',
        'Destination Hub',
        'Cargo Description',
        'Certified Tonnage (MT)',
        'Prime Mover Plate',
        'Assigned Driver',
        'Freight Rate (ETB)',
        'Freight Rate (Local)',
        'Delivery Window / ETA',
      ],
      filteredShipments.map((s) => {
        const itemCountry = resolveItemCountryCode(s, 'shipment');
        const cfg = EAST_AFRICA_FREIGHT_CONFIGS[itemCountry];
        const localRate = Math.round(Number(s.freightRateETB || 0) * cfg.toLocalFactor);
        return [
          s.shipmentId,
          cfg.name,
          s.status,
          s.origin,
          s.destination,
          s.cargoType,
          s.tonnage,
          s.truckPlate,
          s.driver,
          s.freightRateETB,
          `${cfg.currency} ${localRate}`,
          s.estimatedDelivery,
        ];
      })
    );
    onNotify(
      'Freight Manifests Exported',
      `Downloaded ${filteredShipments.length} waybills for ${countryName} to CSV.`,
      'success'
    );
  };

  const cardClass =
    'p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-all';

  return (
    <div className="space-y-6">
      {/* Sovereign Jurisdiction Operator Station Header */}
      <div className="flex flex-col gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Fleet &amp; Logistics Command</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Heavy Freight &amp; Cross-Border Haulage</span>
              </span>
              {!canManageFreight && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Lock className="w-3 h-3" />
                    <span>Read-Only ({userRole})</span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Truck Freight &amp; Corridor Logistics</span>
                {countryConfig && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <span>{countryConfig.flag}</span>
                    <span>{countryConfig.name} Station</span>
                  </span>
                )}
                {selectedCountry === 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span>🌍</span>
                    <span>Pan-East Africa Unified Network</span>
                  </span>
                )}
              </h1>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Inter-city heavy haulage, bonded dry port manifests, electronic cargo tracking (RECTS),
              and weighbridge axle limit compliance across the 8 East African trade corridors.
            </p>
          </div>

          {/* Sub-Nav Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
            {[
              { id: 'overview', label: 'Freight Overview', icon: Layers },
              { id: 'shipments', label: 'Waybill Tracking', icon: Package },
              { id: 'fleet', label: 'Prime Movers Fleet', icon: Truck },
              { id: 'corridors', label: 'Corridor Rates & Spot Market', icon: Scale },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeSubTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operator Jurisdiction Context Bar */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Active Operator: {userName || 'Regional Dispatcher'} ({userRole})
                </span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {userEmail || 'dispatch@afronala.com'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Operational Jurisdiction: </span>
                <strong className="text-slate-700 dark:text-slate-300">
                  {userJurisdictionName || 'Pan-East Africa Cross-Border Authority'} ({userJurisdiction || 'ALL'})
                </strong>
                {assignedCorridors.length > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    · Assigned: {assignedCorridors.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {/* Currency Mode Switcher */}
            {countryConfig && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                <CreditCard className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Currency:</span>
                <button
                  type="button"
                  onClick={() => setCurrencyMode('LOCAL')}
                  className={`px-1.5 py-0.5 rounded font-mono font-semibold transition-colors ${
                    currencyMode === 'LOCAL'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {countryConfig.currency}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyMode('ETB')}
                  className={`px-1.5 py-0.5 rounded font-mono font-semibold transition-colors ${
                    currencyMode === 'ETB'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ETB
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleExportWaybillsCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleOpenDispatchModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap shadow-xs"
            >
              {canManageFreight ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Dispatch Freight</span>
            </button>
          </div>
        </div>

        {/* 8-Nation + Unified Sovereign Freight Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>Corridor Nation:</span>
          </span>

          {SOVEREIGN_NATIONS_LIST.map((nation) => {
            const isSelected = selectedCountry === nation.code;
            const count =
              nation.code === 'ALL'
                ? shipments.length
                : shipments.filter((s) => resolveItemCountryCode(s, 'shipment') === nation.code).length;
            const isOperatorJurisdiction = userJurisdiction === nation.code;

            return (
              <button
                key={nation.code}
                onClick={() => setSelectedCountry(nation.code)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              >
                <span className="text-sm">{nation.flag}</span>
                <span>{nation.code === 'ALL' ? 'Pan-East Africa' : nation.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-blue-500/30 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
                {isOperatorJurisdiction && (
                  <span
                    title="Your Assigned Operational Station"
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-emerald-300 ring-2 ring-white/50' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sovereign Regulatory & Axle Load Standard Banner */}
      {countryConfig && (
        <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 via-slate-50 to-indigo-50 dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
              {countryConfig.code}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {countryConfig.regulatorName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                  {countryConfig.regulatorAcronym}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  ✓ {countryConfig.customsAuthority}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                <strong className="text-slate-900 dark:text-white">Weighbridge Standard:</strong>{' '}
                {countryConfig.weighbridgeStandard}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  <strong>Key Weighbridges:</strong> {countryConfig.primaryWeighbridges.join(' · ')}
                </span>
                <span>
                  <strong>Border Gateways:</strong> {countryConfig.borderGates.join(' · ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 dark:border-slate-800">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Regional Diesel Pump Index
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {countryConfig.currencySymbol} {countryConfig.dieselPerLiter.toFixed(1)} / L
              </span>
            </div>
            <div className="text-left md:text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Avg Corridor Freight Tariff
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                {countryConfig.currencySymbol} {countryConfig.avgTonKmRate} / Ton-Km
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live Computed Logistics KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Manifests &amp; Waybills
            </span>
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
            {countryShipments.length} <span className="text-xs font-sans font-normal text-slate-500">Waybills</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-slate-500">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {deliveredCount} delivered
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {pendingCount} pending queue
            </span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active In-Transit Runs
            </span>
            <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-emerald-600 dark:text-emerald-400">
            {inTransitCount} <span className="text-xs font-sans font-normal text-slate-500">Corridor Runs</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {countryConfig ? countryConfig.primaryCorridors[0] : '8 Multi-National Trade Arterials'}
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Certified Cargo Weight
            </span>
            <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
            {totalTonnage.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-500">Metric Tons</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Weighbridge verified &amp; axle compliant
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Contracted Freight Revenue
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalFreightETB)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currencyMode === 'LOCAL' && countryConfig
              ? `Eqv. ETB ${Math.round(totalFreightETB).toLocaleString()}`
              : 'Gross contracted cargo revenue'}
          </p>
        </div>
      </div>

      {/* Subtab: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Live Corridor Telematics Radar Canvas & Checkpoints */}
          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                  <span>Cross-Border Corridor Radar &amp; RECTS Checkpoint Feed</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live transponder telemetry, weighbridge queues, and customs border clearing speeds for{' '}
                  <strong>{countryConfig ? countryConfig.name : 'Pan-East Africa'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>RECTS E-Seal Transponders: Active</span>
                </span>
              </div>
            </div>

            {/* Radar Corridor Visual Nodes */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              {(countryConfig ? countryConfig.radarWaypoints : EAST_AFRICA_FREIGHT_CONFIGS.KE.radarWaypoints).map(
                (wp, idx) => {
                  const isWeighbridge = wp.type === 'weighbridge';
                  const isBorder = wp.type === 'border';
                  const isPort = wp.type === 'port';

                  return (
                    <div
                      key={wp.name}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                              isPort
                                ? 'bg-indigo-600 text-white'
                                : isBorder
                                ? 'bg-amber-600 text-white'
                                : isWeighbridge
                                ? 'bg-blue-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-slate-900 dark:text-white block truncate max-w-[140px]">
                              {wp.name}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                              {wp.type}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            wp.status === 'Clear'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : wp.status === 'Nominal'
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {wp.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span>Transit Delay:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {wp.delayMins === 0 ? 'Zero wait (Green Lane)' : `~${wp.delayMins} min queue`}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Live Corridor Routes List */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Active Strategic Freight Arterials in this Territory:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(countryConfig ? countryConfig.primaryCorridors : [
                  'Northern Corridor (Mombasa – Nairobi – Malaba – Kampala – Kigali)',
                  'Central Corridor (Dar es Salaam – Isaka – Kigali / Bujumbura)',
                  'Djibouti – Addis Ababa Freight Rail & Road Corridor',
                  'Juba – Nimule – Kampala Northern Lifeline Route',
                ]).map((corridor, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                        {corridor}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                      Open 24/7
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Waybills Summary & Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-7 ${cardClass} space-y-4`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Active Freight Manifests ({filteredShipments.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing manifests for {countryConfig ? countryConfig.name : 'Pan-East Africa'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('shipments')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>View All Waybills</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Waybill Rows */}
              <div className="space-y-3">
                {filteredShipments.slice(0, 4).map((s) => {
                  const isSelected = selectedShipment?.shipmentId === s.shipmentId;
                  const itemCountry = resolveItemCountryCode(s, 'shipment');
                  const cfg = EAST_AFRICA_FREIGHT_CONFIGS[itemCountry];

                  return (
                    <div
                      key={s.shipmentId}
                      onClick={() => setSelectedShipmentId(s.shipmentId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {s.shipmentId}
                            </span>
                            <span className="text-xs">{cfg.flag}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(
                                s.status
                              )}`}
                            >
                              {s.status}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                            <span>{s.origin}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{s.destination}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                            {formatCurrency(Number(s.freightRateETB || 0))}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {s.tonnage} Tons · {s.truckPlate}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Shipment Detail Drawer */}
            <div className={`lg:col-span-5 ${cardClass}`}>
              {selectedShipment ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Inspecting Waybill
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{selectedShipment.shipmentId}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(
                            selectedShipment.status
                          )}`}
                        >
                          {selectedShipment.status}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        ETA: {selectedShipment.estimatedDelivery}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDocModal(true)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Electronic BoL</span>
                    </button>
                  </div>

                  {/* Waybill Specs */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cargo Description:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {selectedShipment.cargoType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Certified Net Weight:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedShipment.tonnage} Metric Tons
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Prime Mover Plate:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {selectedShipment.truckPlate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Driver:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {selectedShipment.driver}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Contracted Rate:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(selectedShipment.freightRateETB || 0))}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handlePingTelematics(selectedShipment.truckPlate, selectedShipment.driver)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        telematicsPingTarget === selectedShipment.truckPlate
                          ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        {telematicsPingTarget === selectedShipment.truckPlate
                          ? 'Transponder Ack: Nominal'
                          : 'Ping Telematics'}
                      </span>
                    </button>

                    {NEXT_STAGE_MAP[selectedShipment.status] && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAdvanceStatus(
                            selectedShipment,
                            NEXT_STAGE_MAP[selectedShipment.status]!.next
                          )
                        }
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{NEXT_STAGE_MAP[selectedShipment.status]!.label}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Select a shipment to inspect its corridor journey.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab: WAYBILL TRACKING & MANIFESTS */}
      {activeSubTab === 'shipments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Shipment List with Filter & Search */}
          <div className={`lg:col-span-7 ${cardClass} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Freight Manifests &amp; Waybill Tracking</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {countryConfig ? countryConfig.name : 'Pan-East Africa unified manifest catalog'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportWaybillsCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenDispatchModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap"
                >
                  {canManageFreight ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Dispatch</span>
                </button>
              </div>
            </div>

            {/* Search Bar & Status Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by waybill #, origin, destination, cargo, driver, or plate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
                {(['All', 'Pending', 'Picked Up', 'In Transit', 'Delivered'] as const).map((st) => {
                  const count =
                    st === 'All'
                      ? countryShipments.length
                      : countryShipments.filter((s) => s.status === st).length;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                        statusFilter === st
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {st} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Waybill Rows */}
            <div className="space-y-3">
              {filteredShipments.length > 0 ? (
                filteredShipments.map((s) => {
                  const isSelected = selectedShipment?.shipmentId === s.shipmentId;
                  const itemCountry = resolveItemCountryCode(s, 'shipment');
                  const cfg = EAST_AFRICA_FREIGHT_CONFIGS[itemCountry];

                  return (
                    <div
                      key={s.shipmentId}
                      onClick={() => setSelectedShipmentId(s.shipmentId)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {s.shipmentId}
                            </span>
                            <span className="text-sm">{cfg.flag}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(
                                s.status
                              )}`}
                            >
                              {s.status}
                            </span>
                            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                              {s.truckPlate}
                            </span>
                          </div>

                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>{s.origin}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{s.destination}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Cargo: {s.cargoType}</span>
                            <span>·</span>
                            <span>Weight: {s.tonnage} MT</span>
                            <span>·</span>
                            <span>Driver: {s.driver}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                            {formatCurrency(Number(s.freightRateETB || 0))}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {s.estimatedDelivery}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No waybills found matching the current criteria.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Journey & Milestone Tracker */}
          <div className={`lg:col-span-5 ${cardClass} space-y-4`}>
            {selectedShipment ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Waybill Milestone Progression
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{selectedShipment.shipmentId}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(
                          selectedShipment.status
                        )}`}
                      >
                        {selectedShipment.status}
                      </span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDocModal(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>e-BoL Manifest</span>
                  </button>
                </div>

                {/* Milestone Stepper */}
                <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-800 my-4 text-xs">
                  {[
                    {
                      stage: 'Booking',
                      title: 'Cargo Dispatched & Bonded Waybill Created',
                      sub: selectedShipment.origin,
                      done: true,
                    },
                    {
                      stage: 'Pickup',
                      title: 'Loaded onto Prime Mover & Sealed with RECTS',
                      sub: `Tractor: ${selectedShipment.truckPlate} · ${selectedShipment.driver}`,
                      done:
                        selectedShipment.status === 'Picked Up' ||
                        selectedShipment.status === 'In Transit' ||
                        selectedShipment.status === 'Delivered',
                    },
                    {
                      stage: 'In Transit',
                      title: 'Corridor Transit & Axle Scale Verified',
                      sub: 'High-speed weighbridge clearance verified',
                      done:
                        selectedShipment.status === 'In Transit' ||
                        selectedShipment.status === 'Delivered',
                    },
                    {
                      stage: 'Delivered',
                      title: 'Consignee Delivery & Customs Clearance Signed',
                      sub: selectedShipment.destination,
                      done: selectedShipment.status === 'Delivered',
                    },
                  ].map((step, idx) => (
                    <div key={step.stage} className="flex items-start gap-3 relative -left-3.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] shrink-0 border ${
                          step.done
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {step.done ? '✓' : idx + 1}
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            step.done
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Specs Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cargo Classification:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedShipment.cargoType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Certified Tonnage:</span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {selectedShipment.tonnage} Metric Tons
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prime Mover Plate:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {selectedShipment.truckPlate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contract Driver:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedShipment.driver}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Freight Fee:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Number(selectedShipment.freightRateETB || 0))}
                    </span>
                  </div>
                </div>

                {/* Status Advancement & Telematics Controls */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handlePingTelematics(selectedShipment.truckPlate, selectedShipment.driver)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-800 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ping Driver Telematics</span>
                  </button>

                  {NEXT_STAGE_MAP[selectedShipment.status] && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAdvanceStatus(
                          selectedShipment,
                          NEXT_STAGE_MAP[selectedShipment.status]!.next
                        )
                      }
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{NEXT_STAGE_MAP[selectedShipment.status]!.label}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a shipment to inspect waypoints and documents.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab: PRIME MOVERS FLEET */}
      {activeSubTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Heavy Haulage Prime Movers &amp; Multi-Axle Fleet ({filteredFleet.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registered heavy haulage carriers across {countryConfig ? countryConfig.name : 'East Africa'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!onGuardPermission('manage_freight', 'Registering new heavy vehicle')) return;
                setShowAddTruckModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors self-start sm:self-auto"
            >
              {canManageFreight ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Register Prime Mover</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFleet.map((truck) => {
              const cfg = EAST_AFRICA_FREIGHT_CONFIGS[truck.countryCode];

              return (
                <div key={truck.id} className={cardClass}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {truck.model}
                          </span>
                          <span>{cfg.flag}</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {truck.plate}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        truck.status === 'In Transit'
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {truck.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Classification:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {truck.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Payload Cap:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {truck.capacityTons} Metric Tons
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Axle Config:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {truck.axleConfig}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Driver:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {truck.driver}
                      </span>
                    </div>
                  </div>

                  {/* Telematics Bar */}
                  <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      <span>Fuel: {truck.fuelLevelPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      <span>TPMS: {truck.tirePressureStatus}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePingTelematics(truck.plate, truck.driver)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600"
                      title="Ping Transponder"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab: CORRIDORS & SPOT FREIGHT MARKET */}
      {activeSubTab === 'corridors' && (
        <div className="space-y-6">
          <div className={cardClass}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>East Africa Corridor Spot Freight Tariff Index</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Standard freight rates per ton-kilometer converted across all 8 sovereign jurisdictions
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Live Inter-Bank Parity
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(EAST_AFRICA_FREIGHT_CONFIGS) as (keyof typeof EAST_AFRICA_FREIGHT_CONFIGS)[]).map(
                (code) => {
                  const cfg = EAST_AFRICA_FREIGHT_CONFIGS[code];
                  const isCurrent = selectedCountry === code;

                  return (
                    <div
                      key={code}
                      onClick={() => setSelectedCountry(code)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cfg.flag}</span>
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white block">
                              {cfg.name}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">
                              {cfg.currency} ({cfg.currencySymbol})
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {cfg.currencySymbol} {cfg.avgTonKmRate}
                          <span className="text-[10px] text-slate-500 font-sans block">/ Ton-Km</span>
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Diesel Pump:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            {cfg.currencySymbol} {cfg.dieselPerLiter}/L
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weighbridge Cap:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            56 Metric Tons
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dispatch Freight Cargo */}
      {showAddShipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Dispatch Freight Cargo
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Create electronic waybill &amp; register bonded transport transponder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddShipmentModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!onGuardPermission('manage_freight', 'Dispatching freight shipments')) return;

                const countryCfg = EAST_AFRICA_FREIGHT_CONFIGS[newShipment.countryCode];
                const createdId = `#DLV-${newShipment.countryCode}-${Math.floor(1000 + Math.random() * 9000)}`;

                await onAddShipment({
                  shipmentId: createdId,
                  status: newShipment.initialStatus,
                  time: 'Just now',
                  origin: newShipment.origin,
                  destination: newShipment.destination,
                  cargoType: newShipment.cargoType,
                  tonnage: Number(newShipment.tonnage),
                  truckPlate: newShipment.truckPlate,
                  driver: newShipment.driver,
                  freightRateETB: Number(newShipment.freightRateETB),
                  estimatedDelivery:
                    newShipment.initialStatus === 'Pending'
                      ? 'Scheduled · Tomorrow 14:00'
                      : 'En Route · Tomorrow 14:00',
                  countryCode: newShipment.countryCode,
                  countryName: countryCfg.name,
                });

                setSelectedShipmentId(createdId);
                setShowAddShipmentModal(false);
                onNotify(
                  'Freight Dispatched Successfully',
                  `Waybill ${createdId} registered under ${countryCfg.regulatorAcronym} transit manifest.`,
                  'success'
                );
              }}
              className="space-y-4 mt-4 text-xs"
            >
              {/* Sovereign Country Select */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Operating Sovereign Jurisdiction
                </label>
                <select
                  value={newShipment.countryCode}
                  onChange={(e) => {
                    const code = e.target.value as Exclude<EastAfricaCountryCode, 'ALL'>;
                    const cfg = EAST_AFRICA_FREIGHT_CONFIGS[code];
                    setNewShipment({
                      ...newShipment,
                      countryCode: code,
                      origin: cfg.keyTerminals[0] || '',
                      destination: cfg.keyTerminals[1] || '',
                      truckPlate: cfg.plateRegexExample,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {(Object.keys(EAST_AFRICA_FREIGHT_CONFIGS) as (keyof typeof EAST_AFRICA_FREIGHT_CONFIGS)[]).map(
                    (code) => {
                      const cfg = EAST_AFRICA_FREIGHT_CONFIGS[code];
                      return (
                        <option key={code} value={code}>
                          {cfg.flag} {cfg.name} ({cfg.regulatorAcronym})
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Origin Terminal / Dry Port
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.origin}
                    onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Destination Hub / Border Gate
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.destination}
                    onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Cargo Classification & Certified Tonnage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Cargo Classification
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.cargoType}
                    onChange={(e) => setNewShipment({ ...newShipment, cargoType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Certified Gross Weight (Metric Tons)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    max="56"
                    required
                    value={newShipment.tonnage}
                    onChange={(e) =>
                      setNewShipment({ ...newShipment, tonnage: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Prime Mover Plate & Assigned Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Prime Mover Tractor Plate
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.truckPlate}
                    onChange={(e) => setNewShipment({ ...newShipment, truckPlate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Contract Driver
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.driver}
                    onChange={(e) => setNewShipment({ ...newShipment, driver: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Freight Rate & Initial Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Freight Fee (ETB Equivalent)
                  </label>
                  <input
                    type="number"
                    required
                    value={newShipment.freightRateETB}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const cfg = EAST_AFRICA_FREIGHT_CONFIGS[newShipment.countryCode];
                      setNewShipment({
                        ...newShipment,
                        freightRateETB: val,
                        freightRateLocal: Math.round(val * cfg.toLocalFactor),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Local: {EAST_AFRICA_FREIGHT_CONFIGS[newShipment.countryCode].currencySymbol}{' '}
                    {newShipment.freightRateLocal.toLocaleString()}{' '}
                    {EAST_AFRICA_FREIGHT_CONFIGS[newShipment.countryCode].currency}
                  </p>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newShipment.initialStatus}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        initialStatus: e.target.value as ShipmentStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Pending">Pending Queue</option>
                    <option value="Picked Up">Picked Up &amp; Sealed</option>
                    <option value="In Transit">In Transit on Corridor</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddShipmentModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs"
                >
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Heavy Prime Mover */}
      {showAddTruckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Register Heavy Haulage Prime Mover
              </h3>
              <button
                onClick={() => setShowAddTruckModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newId = `TRK-${newTruck.countryCode}-${Math.floor(100 + Math.random() * 900)}`;
                const item: HeavyTruckItem = {
                  id: newId,
                  model: newTruck.model,
                  plate: newTruck.plate,
                  type: newTruck.type,
                  capacityTons: Number(newTruck.capacityTons),
                  driver: newTruck.driver,
                  driverPhone: newTruck.driverPhone,
                  status: 'Verified',
                  countryCode: newTruck.countryCode,
                  axleConfig: newTruck.axleConfig,
                  fuelLevelPercent: 95,
                  tirePressureStatus: 'Optimal',
                  gpsLock: true,
                  assignedCorridor: newTruck.assignedCorridor,
                };
                setFleetList((prev) => [item, ...prev]);
                setShowAddTruckModal(false);
                onNotify(
                  'Heavy Vehicle Registered',
                  `${newTruck.model} (${newTruck.plate}) added to fleet under EAC Axle Compliance.`,
                  'success'
                );
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Country of Registration
                </label>
                <select
                  value={newTruck.countryCode}
                  onChange={(e) => {
                    const code = e.target.value as Exclude<EastAfricaCountryCode, 'ALL'>;
                    const cfg = EAST_AFRICA_FREIGHT_CONFIGS[code];
                    setNewTruck({
                      ...newTruck,
                      countryCode: code,
                      plate: cfg.plateRegexExample,
                      assignedCorridor: cfg.primaryCorridors[0],
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {(Object.keys(EAST_AFRICA_FREIGHT_CONFIGS) as (keyof typeof EAST_AFRICA_FREIGHT_CONFIGS)[]).map(
                    (code) => {
                      const cfg = EAST_AFRICA_FREIGHT_CONFIGS[code];
                      return (
                        <option key={code} value={code}>
                          {cfg.flag} {cfg.name} ({cfg.currency})
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Tractor Model
                </label>
                <input
                  type="text"
                  required
                  value={newTruck.model}
                  onChange={(e) => setNewTruck({ ...newTruck, model: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    License Plate
                  </label>
                  <input
                    type="text"
                    required
                    value={newTruck.plate}
                    onChange={(e) => setNewTruck({ ...newTruck, plate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Payload (MT)
                  </label>
                  <input
                    type="number"
                    required
                    max="56"
                    value={newTruck.capacityTons}
                    onChange={(e) =>
                      setNewTruck({ ...newTruck, capacityTons: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Assigned Driver
                  </label>
                  <input
                    type="text"
                    required
                    value={newTruck.driver}
                    onChange={(e) => setNewTruck({ ...newTruck, driver: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Driver Mobile
                  </label>
                  <input
                    type="text"
                    required
                    value={newTruck.driverPhone}
                    onChange={(e) => setNewTruck({ ...newTruck, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTruckModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Electronic Bill of Lading (e-BoL) */}
      {showDocModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header with Sovereign Seals */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  e-BoL
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Electronic Bill of Lading &amp; Customs Waybill</span>
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Manifest {selectedShipment.shipmentId} · RECTS Transponder Seal Certified
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Body */}
            <div className="my-5 space-y-4 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              {/* Sovereign Regulatory Stamp */}
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 uppercase tracking-wider font-bold block">
                    Regional Corridor Transit Authority
                  </span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {countryConfig ? countryConfig.regulatorName : 'Pan-East Africa Cross-Border Freight Commission'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    ✓ E-SEAL ARMED
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID #{selectedShipment.shipmentId.replace('#', '')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Origin Shipper Terminal</p>
                  <p className="text-slate-900 dark:text-white font-semibold mt-0.5">
                    {selectedShipment.origin}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Consignee Hub / Destination</p>
                  <p className="text-slate-900 dark:text-white font-semibold mt-0.5">
                    {selectedShipment.destination}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Prime Mover Plate</p>
                  <p className="text-blue-600 dark:text-blue-400 font-bold">
                    {selectedShipment.truckPlate}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Certified Gross Tonnage</p>
                  <p className="text-slate-900 dark:text-white font-bold">
                    {selectedShipment.tonnage} Metric Tons
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Contracted Tariff</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(Number(selectedShipment.freightRateETB || 0))}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-sans">Cargo Description &amp; Hazardous Codes</p>
                <p className="text-slate-900 dark:text-white font-sans mt-0.5">
                  {selectedShipment.cargoType} (Non-hazardous bonded freight)
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Driver in Charge</span>
                  <span className="text-slate-800 dark:text-slate-200 font-sans">
                    {selectedShipment.driver}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-sans block">Status</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {selectedShipment.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Tamper-Evident Digital Waybill · Valid across EAC &amp; COMESA
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePingTelematics(selectedShipment.truckPlate, selectedShipment.driver);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Verify E-Seal
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs"
                >
                  Close Waybill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
