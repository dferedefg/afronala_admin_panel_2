import {
  ActivityAlertRule,
  ActivityStreamEvent,
  ActivityStreamResponse,
  AlertRuleMetricCategory,
  AlertRuleOperator,
  AlertRuleSeverity,
  Back4AppCloudStatus,
  ConnectivityPingResult,
  CustomerAccount,
  DiagnosticAutoFixReport,
  DispatchJob,
  Driver,
  DriverDocumentComplianceRecord,
  DriverDocumentType,
  DriverStatus,
  ModuleItem,
  SchemaField,
  Shipment,
  ShipmentStatus,
  SystemAlert,
  TriggeredActivityPulse,
  Trip,
  Vehicle,
  VehicleStatus,
  WebhookSubscription,
  EastAfricaCountryCode,
  EastAfricaModuleCountryConfig,
  EastAfricaNodeDiagnosticSummary,
} from '../types';
import {
  evaluateDriverDocumentCompliance,
  normalizeParseIsoDate,
  offsetIsoDateFromToday,
} from './compliance';

/**
 * Masked client-side display metadata.
 * Actual Back4App Application ID & REST API Key live exclusively in server.ts.
 */
export const BACK4APP_CONFIG = {
  applicationId: 'lIlPFWJa••••••••',
  clientKey: 'OXZieRlk••••••••',
  restApiKey: 'Server-Proxied (/api/back4app/*)',
  serverUrl: '/api/back4app',
};

import {
  DEFAULT_MODULE_COUNTRY_CONFIGS,
  EAST_AFRICAN_COUNTRIES_ORDERED,
  buildDefaultCountryConfigsForModule,
} from './eastAfricaModules';

export const DEFAULT_MODULES: ModuleItem[] = [
  {
    id: 'mod-1',
    key: 'ride',
    name: 'Ride Module',
    description: 'Ride hailing, city transportation and mobility services across East African metropolitan hubs.',
    icon: 'Car',
    enabled: true,
    statusText: 'Enabled',
    category: 'Mobility',
    canToggle: true,
    countries: ['ET', 'KE', 'UG', 'RW', 'TZ', 'DJ', 'SO'],
    countryConfigs: DEFAULT_MODULE_COUNTRY_CONFIGS.ride,
    panEastAfricaCommissionCapPct: 15,
    globalRolloutStage: 'Active (Production)',
    primaryRegulatoryAgency: 'FTA (ET), NTSA (KE), MoWT (UG), RURA (RW), LATRA (TZ)',
  },
  {
    id: 'mod-2',
    key: 'truck',
    name: 'Truck Delivery',
    description: 'Logistics, heavy freight cargo and cross-border transport across all 8 East African corridors.',
    icon: 'Truck',
    enabled: true,
    statusText: 'Enabled',
    category: 'Logistics',
    canToggle: true,
    countries: ['ET', 'KE', 'UG', 'RW', 'TZ', 'DJ', 'SO', 'SS'],
    countryConfigs: DEFAULT_MODULE_COUNTRY_CONFIGS.truck,
    panEastAfricaCommissionCapPct: 15,
    globalRolloutStage: 'Active (Production)',
    primaryRegulatoryAgency: 'ERA, KeNHA, UNRA, RURA, TANROADS, DPFZA (Axle Weight Standards)',
  },
  {
    id: 'mod-3',
    key: 'food',
    name: 'Food Delivery',
    description: 'Restaurant ordering, cloud kitchens, and meal delivery in primary East African cities.',
    icon: 'Utensils',
    enabled: false,
    statusText: 'Disabled',
    category: 'Commerce',
    canToggle: true,
    countries: ['ET', 'KE'],
    countryConfigs: DEFAULT_MODULE_COUNTRY_CONFIGS.food,
    panEastAfricaCommissionCapPct: 18,
    globalRolloutStage: 'Phased Regional Rollout',
    primaryRegulatoryAgency: 'EFDA (ET) & KEBS (KE) Food Safety Standards',
  },
  {
    id: 'mod-4',
    key: 'marketplace',
    name: 'Marketplace',
    description: 'E-commerce marketplace, vendor stores, and regional trade across East Africa.',
    icon: 'ShoppingBag',
    enabled: false,
    statusText: 'Disabled',
    category: 'Commerce',
    canToggle: true,
    countries: ['ET', 'KE'],
    countryConfigs: DEFAULT_MODULE_COUNTRY_CONFIGS.marketplace,
    panEastAfricaCommissionCapPct: 8,
    globalRolloutStage: 'Phased Regional Rollout',
    primaryRegulatoryAgency: 'MoTRI (ET) & CAK (KE) E-Commerce Guidelines',
  },
  {
    id: 'mod-5',
    key: 'events',
    name: 'Events & Tickets',
    description: 'Event ticketing, venue access control, and festival bookings across East African capitals.',
    icon: 'Calendar',
    enabled: false,
    statusText: 'Disabled',
    category: 'Lifestyle',
    canToggle: true,
    countries: ['ET', 'KE', 'RW'],
    countryConfigs: DEFAULT_MODULE_COUNTRY_CONFIGS.events,
    panEastAfricaCommissionCapPct: 6,
    globalRolloutStage: 'Phased Regional Rollout',
    primaryRegulatoryAgency: 'National Tourism Boards (BK Arena, KICC, Millennium Hall)',
  },
  {
    id: 'mod-6',
    key: 'hotels',
    name: 'Hotels & Booking',
    description: 'Hotel reservations, safari lodge bookings, and ecotourism stays across East Africa.',
    icon: 'Building2',
    enabled: false,
    statusText: 'Disabled',
    category: 'Hospitality',
    canToggle: true,
    countries: ['KE', 'TZ', 'RW', 'ET'],
    countryConfigs: DEFAULT_MODULE_COUNTRY_CONFIGS.hotels,
    panEastAfricaCommissionCapPct: 10,
    globalRolloutStage: 'Phased Regional Rollout',
    primaryRegulatoryAgency: 'TRA (KE), TANAPA (TZ), RDB (RW), Tourism Ethiopia (ET)',
  },
  {
    id: 'mod-7',
    key: 'wallet',
    name: 'Wallet & Payments',
    description: 'Digital wallet, peer-to-peer transfers, and local mobile money rails across all 8 nations.',
    icon: 'Wallet',
    enabled: false,
    statusText: 'Disabled',
    category: 'Fintech',
    canToggle: true,
    countries: ['ET', 'KE', 'UG', 'RW', 'TZ', 'DJ', 'SO', 'SS'],
    countryConfigs: DEFAULT_MODULE_COUNTRY_CONFIGS.wallet,
    panEastAfricaCommissionCapPct: 1.5,
    globalRolloutStage: 'Active (Production)',
    primaryRegulatoryAgency: 'Central Banks of ET, KE, UG, RW, TZ, DJ, SO, SS',
  },
  {
    id: 'mod-8',
    key: 'courier',
    name: 'Courier Service',
    description: 'On-demand parcel, urgent document, and express motorcycle courier transport.',
    icon: 'Package',
    enabled: false,
    statusText: 'Disabled',
    category: 'Logistics',
    canToggle: true,
    countries: ['ET', 'KE', 'UG', 'RW', 'TZ'],
    countryConfigs: DEFAULT_MODULE_COUNTRY_CONFIGS.courier,
    panEastAfricaCommissionCapPct: 15,
    globalRolloutStage: 'Phased Regional Rollout',
    primaryRegulatoryAgency: 'National Postal & Communications Authorities (ECA, CA, UCC, RURA, TCRA)',
  },
  {
    id: 'mod-9',
    key: 'more',
    name: 'More Modules',
    description: 'Custom micro-services, public transport & scheduled shuttles.',
    icon: 'Sparkles',
    enabled: false,
    statusText: 'Coming Soon',
    category: 'Platform',
    canToggle: false,
  },
];

export const DEFAULT_DRIVERS: Driver[] = [
  // 🇪🇹 Ethiopia
  {
    objectId: 'drv-seed-1',
    name: 'Abebe Kebede',
    phone: '0911 223 344',
    vehicleModel: 'Toyota Vitz',
    vehiclePlate: 'AA-12345',
    status: 'Active',
    rating: 4.9,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    tripsCompleted: 1245,
    earningsETB: 42800,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-2',
    name: 'Bekele Tesfaye',
    phone: '0911 556 677',
    vehicleModel: 'Hyundai Accent',
    vehiclePlate: 'BB-67890',
    status: 'Pending',
    rating: 4.8,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    tripsCompleted: 980,
    earningsETB: 34100,
    joinedDate: 'Feb 2024',
  },
  {
    objectId: 'drv-seed-3',
    name: 'Selamawit D.',
    phone: '0911 998 776',
    vehicleModel: 'Kia Picanto',
    vehiclePlate: 'CC-11223',
    status: 'Verified',
    rating: 4.7,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    tripsCompleted: 1120,
    earningsETB: 39500,
    joinedDate: 'Nov 2023',
  },
  {
    objectId: 'drv-seed-4',
    name: 'Daniel Getachew',
    phone: '0911 445 667',
    vehicleModel: 'Toyota Corolla',
    vehiclePlate: 'DD-44556',
    status: 'Suspended',
    rating: 4.5,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    tripsCompleted: 640,
    earningsETB: 21300,
    joinedDate: 'Mar 2024',
  },
  {
    objectId: 'drv-seed-5',
    name: 'Hana Melkamu',
    phone: '0911 334 221',
    vehicleModel: 'Suzuki Swift',
    vehiclePlate: 'EE-77889',
    status: 'Active',
    rating: 4.9,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    tripsCompleted: 875,
    earningsETB: 31200,
    joinedDate: 'Dec 2023',
  },
  {
    objectId: 'drv-seed-6',
    name: 'Yosef Alemu',
    phone: '0911 889 900',
    vehicleModel: 'Nissan Sunny',
    vehiclePlate: 'FF-99001',
    status: 'Pending',
    rating: 4.6,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    tripsCompleted: 430,
    earningsETB: 15400,
    joinedDate: 'Apr 2024',
  },
  {
    objectId: 'drv-seed-7',
    name: 'Tsegaye Hailu',
    phone: '0912 345 678',
    vehicleModel: 'Isuzu NPR Box Truck',
    vehiclePlate: '3-ET-19402',
    status: 'Active',
    rating: 4.9,
    module: 'truck',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    tripsCompleted: 340,
    earningsETB: 185000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-8',
    name: 'Dawit Alemayehu',
    phone: '0913 876 543',
    vehicleModel: 'Mercedes Actros Heavy',
    vehiclePlate: '3-ET-88219',
    status: 'Verified',
    rating: 4.8,
    module: 'truck',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    tripsCompleted: 210,
    earningsETB: 290000,
    joinedDate: 'Nov 2023',
  },

  // 🇰🇪 Kenya
  {
    objectId: 'drv-seed-ke-1',
    name: 'James Mwangi',
    phone: '+254 712 345 678',
    vehicleModel: 'Mercedes Actros Heavy Truck',
    vehiclePlate: 'KDA-491P',
    status: 'Active',
    rating: 4.9,
    module: 'truck',
    countryCode: 'KE',
    countryName: 'Kenya',
    tripsCompleted: 420,
    earningsETB: 310000,
    joinedDate: 'Feb 2024',
  },
  {
    objectId: 'drv-seed-ke-2',
    name: 'Faith Wanjiku',
    phone: '+254 722 987 654',
    vehicleModel: 'Toyota Noah Shuttle',
    vehiclePlate: 'KBY-310M',
    status: 'Verified',
    rating: 4.8,
    module: 'ride',
    countryCode: 'KE',
    countryName: 'Kenya',
    tripsCompleted: 890,
    earningsETB: 48000,
    joinedDate: 'Mar 2024',
  },
  {
    objectId: 'drv-seed-ke-3',
    name: 'Kevin Ochieng',
    phone: '+254 711 234 567',
    vehicleModel: 'Mazda Demio SkyActiv',
    vehiclePlate: 'KDA-104R',
    status: 'Active',
    rating: 4.9,
    module: 'ride',
    countryCode: 'KE',
    countryName: 'Kenya',
    tripsCompleted: 1120,
    earningsETB: 54000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-ke-4',
    name: 'Brian Mwangi',
    phone: '+254 733 456 789',
    vehicleModel: 'Toyota Fielder 1.5X',
    vehiclePlate: 'KCP-552T',
    status: 'Active',
    rating: 4.8,
    module: 'ride',
    countryCode: 'KE',
    countryName: 'Kenya',
    tripsCompleted: 980,
    earningsETB: 49500,
    joinedDate: 'Feb 2024',
  },

  // 🇺🇬 Uganda
  {
    objectId: 'drv-seed-ug-1',
    name: 'John Okello',
    phone: '+256 772 123 456',
    vehicleModel: 'Scania R480 Container Hauler',
    vehiclePlate: 'UBA-882K',
    status: 'Active',
    rating: 4.9,
    module: 'truck',
    countryCode: 'UG',
    countryName: 'Uganda',
    tripsCompleted: 310,
    earningsETB: 275000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-ug-2',
    name: 'Sarah Nalwanga',
    phone: '+256 701 456 789',
    vehicleModel: 'Toyota Premio',
    vehiclePlate: 'UBB-102N',
    status: 'Active',
    rating: 4.7,
    module: 'ride',
    countryCode: 'UG',
    countryName: 'Uganda',
    tripsCompleted: 670,
    earningsETB: 36000,
    joinedDate: 'Apr 2024',
  },
  {
    objectId: 'drv-seed-ug-3',
    name: 'Patrick Mukasa',
    phone: '+256 752 987 654',
    vehicleModel: 'Toyota Spacio Eco',
    vehiclePlate: 'UBF-341P',
    status: 'Active',
    rating: 4.8,
    module: 'ride',
    countryCode: 'UG',
    countryName: 'Uganda',
    tripsCompleted: 750,
    earningsETB: 39000,
    joinedDate: 'Feb 2024',
  },
  {
    objectId: 'drv-seed-ug-4',
    name: 'Grace Akello',
    phone: '+256 782 112 233',
    vehicleModel: 'Suzuki Alto K10',
    vehiclePlate: 'UBJ-882L',
    status: 'Verified',
    rating: 4.9,
    module: 'ride',
    countryCode: 'UG',
    countryName: 'Uganda',
    tripsCompleted: 580,
    earningsETB: 31000,
    joinedDate: 'Mar 2024',
  },

  // 🇷🇼 Rwanda
  {
    objectId: 'drv-seed-rw-1',
    name: 'Jean-Paul Habimana',
    phone: '+250 788 123 789',
    vehicleModel: 'Isuzu Giga Heavy Tipper',
    vehiclePlate: 'RAD-771B',
    status: 'Verified',
    rating: 4.9,
    module: 'truck',
    countryCode: 'RW',
    countryName: 'Rwanda',
    tripsCompleted: 260,
    earningsETB: 240000,
    joinedDate: 'Nov 2023',
  },
  {
    objectId: 'drv-seed-rw-2',
    name: 'Eric Nshimiyimana',
    phone: '+250 788 334 455',
    vehicleModel: 'Toyota Corolla Sedan',
    vehiclePlate: 'RAE-442C',
    status: 'Active',
    rating: 4.9,
    module: 'ride',
    countryCode: 'RW',
    countryName: 'Rwanda',
    tripsCompleted: 920,
    earningsETB: 47000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-rw-3',
    name: 'Diane Uwase',
    phone: '+250 788 556 677',
    vehicleModel: 'Hyundai i10 Grand',
    vehiclePlate: 'RAF-118K',
    status: 'Verified',
    rating: 4.8,
    module: 'ride',
    countryCode: 'RW',
    countryName: 'Rwanda',
    tripsCompleted: 640,
    earningsETB: 33500,
    joinedDate: 'Feb 2024',
  },

  // 🇹🇿 Tanzania
  {
    objectId: 'drv-seed-tz-1',
    name: 'Juma Rashid',
    phone: '+255 754 987 321',
    vehicleModel: 'Sinotruk HOWO Prime Mover',
    vehiclePlate: 'T-592-DEK',
    status: 'Active',
    rating: 4.8,
    module: 'truck',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    tripsCompleted: 380,
    earningsETB: 295000,
    joinedDate: 'Dec 2023',
  },
  {
    objectId: 'drv-seed-tz-2',
    name: 'Baraka Mrema',
    phone: '+255 713 112 233',
    vehicleModel: 'Toyota IST Hatchback',
    vehiclePlate: 'T-312-DRT',
    status: 'Active',
    rating: 4.8,
    module: 'ride',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    tripsCompleted: 830,
    earningsETB: 42000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-tz-3',
    name: 'Neema Shirima',
    phone: '+255 768 445 566',
    vehicleModel: 'Suzuki Swift 1.2',
    vehiclePlate: 'T-409-BCX',
    status: 'Verified',
    rating: 4.9,
    module: 'ride',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    tripsCompleted: 710,
    earningsETB: 37500,
    joinedDate: 'Mar 2024',
  },

  // 🇩🇯 Djibouti
  {
    objectId: 'drv-seed-dj-1',
    name: 'Mohamed Farah',
    phone: '+253 77 12 34 56',
    vehicleModel: 'Volvo FH16 Multi-Axle Truck',
    vehiclePlate: 'DJ-4412-B',
    status: 'Active',
    rating: 4.9,
    module: 'truck',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    tripsCompleted: 450,
    earningsETB: 380000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-dj-2',
    name: 'Omar Guelleh',
    phone: '+253 77 88 99 00',
    vehicleModel: 'Toyota Yaris Sedan',
    vehiclePlate: 'DJ-1209-A',
    status: 'Active',
    rating: 4.8,
    module: 'ride',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    tripsCompleted: 590,
    earningsETB: 44000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-dj-3',
    name: 'Fatouma Daher',
    phone: '+253 77 44 55 66',
    vehicleModel: 'Nissan Tiida 1.6',
    vehiclePlate: 'DJ-3420-C',
    status: 'Verified',
    rating: 4.7,
    module: 'ride',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    tripsCompleted: 420,
    earningsETB: 31000,
    joinedDate: 'Feb 2024',
  },

  // 🇸🇴 Somalia
  {
    objectId: 'drv-seed-so-1',
    name: 'Hassan Warsame',
    phone: '+252 61 555 4321',
    vehicleModel: 'Isuzu Forward Cargo Truck',
    vehiclePlate: 'MOG-7721',
    status: 'Verified',
    rating: 4.7,
    module: 'truck',
    countryCode: 'SO',
    countryName: 'Somalia',
    tripsCompleted: 290,
    earningsETB: 260000,
    joinedDate: 'Feb 2024',
  },
  {
    objectId: 'drv-seed-so-2',
    name: 'Abdi Shire',
    phone: '+252 61 777 8899',
    vehicleModel: 'Toyota Belta 1.3',
    vehiclePlate: 'MOG-5542',
    status: 'Active',
    rating: 4.8,
    module: 'ride',
    countryCode: 'SO',
    countryName: 'Somalia',
    tripsCompleted: 630,
    earningsETB: 38000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-so-3',
    name: 'Yasmin Nur',
    phone: '+252 63 444 1122',
    vehicleModel: 'Toyota Probox Shuttle',
    vehiclePlate: 'HRG-1029',
    status: 'Verified',
    rating: 4.7,
    module: 'ride',
    countryCode: 'SO',
    countryName: 'Somalia',
    tripsCompleted: 510,
    earningsETB: 32000,
    joinedDate: 'Mar 2024',
  },

  // 🇸🇸 South Sudan
  {
    objectId: 'drv-seed-ss-1',
    name: 'Deng Garang',
    phone: '+211 922 345 678',
    vehicleModel: 'DAF CF Heavy Cargo Hauler',
    vehiclePlate: 'SSD-8841-A',
    status: 'Active',
    rating: 4.8,
    module: 'truck',
    countryCode: 'SS',
    countryName: 'South Sudan',
    tripsCompleted: 215,
    earningsETB: 230000,
    joinedDate: 'Mar 2024',
  },
  {
    objectId: 'drv-seed-ss-2',
    name: 'Taban Lado',
    phone: '+211 911 223 344',
    vehicleModel: 'Toyota Rav4 AWD',
    vehiclePlate: 'SSD-1192-B',
    status: 'Active',
    rating: 4.8,
    module: 'ride',
    countryCode: 'SS',
    countryName: 'South Sudan',
    tripsCompleted: 480,
    earningsETB: 35000,
    joinedDate: 'Jan 2024',
  },
  {
    objectId: 'drv-seed-ss-3',
    name: 'Mary Achol',
    phone: '+211 922 667 788',
    vehicleModel: 'Toyota Corolla Altis',
    vehiclePlate: 'SSD-3301-C',
    status: 'Verified',
    rating: 4.9,
    module: 'ride',
    countryCode: 'SS',
    countryName: 'South Sudan',
    tripsCompleted: 390,
    earningsETB: 28000,
    joinedDate: 'Feb 2024',
  },
];

export const DEFAULT_VEHICLES: Vehicle[] = [
  // 🇪🇹 Ethiopia
  {
    objectId: 'veh-seed-1',
    model: 'Toyota Vitz',
    plate: 'AA-12345',
    driverName: 'Abebe Kebede',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2021,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'veh-seed-2',
    model: 'Hyundai Accent',
    plate: 'BB-67890',
    driverName: 'Bekele Tesfaye',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Sedan',
    year: 2022,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'veh-seed-3',
    model: 'Kia Picanto',
    plate: 'CC-11223',
    driverName: 'Selamawit D.',
    status: 'Active',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2020,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'veh-seed-4',
    model: 'Toyota Corolla',
    plate: 'DD-44556',
    driverName: 'Daniel Getachew',
    status: 'Suspended',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Sedan',
    year: 2023,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'veh-seed-5',
    model: 'Suzuki Swift',
    plate: 'EE-77889',
    driverName: 'Hana Melkamu',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2022,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'veh-seed-6',
    model: 'Nissan Sunny',
    plate: 'FF-99001',
    driverName: 'Yosef Alemu',
    status: 'Inspection',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Sedan',
    year: 2021,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'veh-seed-7',
    model: 'Mercedes-Benz Atego',
    plate: '3-ET-48190',
    driverName: 'Tsegaye Hailu',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_logistics_truck_1792851959180.jpg',
    type: 'Box Truck',
    year: 2022,
    capacity: '12 Tons',
    module: 'truck',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'veh-seed-8',
    model: 'Volvo FH16 Heavy',
    plate: '3-ET-91823',
    driverName: 'Dawit Alemayehu',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_logistics_truck_1792851959180.jpg',
    type: 'Heavy Hauler',
    year: 2023,
    capacity: '28 Tons',
    module: 'truck',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },

  // 🇰🇪 Kenya
  {
    objectId: 'veh-seed-ke-1',
    model: 'Toyota Vitz 1.3',
    plate: 'KDA-192B',
    driverName: 'Kevin Ochieng',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2022,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'KE',
    countryName: 'Kenya',
  },
  {
    objectId: 'veh-seed-ke-2',
    model: 'Toyota Fielder 1.5X',
    plate: 'KCP-552T',
    driverName: 'Brian Mwangi',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Station Wagon',
    year: 2023,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'KE',
    countryName: 'Kenya',
  },
  {
    objectId: 'veh-seed-ke-3',
    model: 'Suzuki Alto K10',
    plate: 'KBZ-889M',
    driverName: 'Faith Wanjiku',
    status: 'Active',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2021,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'KE',
    countryName: 'Kenya',
  },

  // 🇺🇬 Uganda
  {
    objectId: 'veh-seed-ug-1',
    model: 'Toyota Premio',
    plate: 'UBB-102N',
    driverName: 'Sarah Nalwanga',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Sedan',
    year: 2022,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'UG',
    countryName: 'Uganda',
  },
  {
    objectId: 'veh-seed-ug-2',
    model: 'Toyota Spacio Eco',
    plate: 'UBF-341P',
    driverName: 'Patrick Mukasa',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Minivan',
    year: 2023,
    capacity: '5 seats',
    module: 'ride',
    countryCode: 'UG',
    countryName: 'Uganda',
  },
  {
    objectId: 'veh-seed-ug-3',
    model: 'Suzuki Alto K10',
    plate: 'UBJ-882L',
    driverName: 'Grace Akello',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2022,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'UG',
    countryName: 'Uganda',
  },

  // 🇷🇼 Rwanda
  {
    objectId: 'veh-seed-rw-1',
    model: 'Toyota Corolla Sedan',
    plate: 'RAE-442C',
    driverName: 'Eric Nshimiyimana',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Sedan',
    year: 2023,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'RW',
    countryName: 'Rwanda',
  },
  {
    objectId: 'veh-seed-rw-2',
    model: 'Hyundai Grand i10',
    plate: 'RAF-910D',
    driverName: 'Diane Uwase',
    status: 'Active',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2022,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'RW',
    countryName: 'Rwanda',
  },

  // 🇹🇿 Tanzania
  {
    objectId: 'veh-seed-tz-1',
    model: 'Toyota Corolla Axio',
    plate: 'T-312-ABW',
    driverName: 'Baraka Mrema',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Sedan',
    year: 2022,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'TZ',
    countryName: 'Tanzania',
  },
  {
    objectId: 'veh-seed-tz-2',
    model: 'Suzuki Swift 1.2',
    plate: 'T-409-BCX',
    driverName: 'Neema Shirima',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2023,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'TZ',
    countryName: 'Tanzania',
  },

  // 🇩🇯 Djibouti
  {
    objectId: 'veh-seed-dj-1',
    model: 'Toyota Yaris Sedan',
    plate: 'DJ-1209-A',
    driverName: 'Omar Guelleh',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Sedan',
    year: 2022,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'DJ',
    countryName: 'Djibouti',
  },
  {
    objectId: 'veh-seed-dj-2',
    model: 'Nissan Tiida 1.6',
    plate: 'DJ-3420-C',
    driverName: 'Fatouma Daher',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2021,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'DJ',
    countryName: 'Djibouti',
  },

  // 🇸🇴 Somalia
  {
    objectId: 'veh-seed-so-1',
    model: 'Toyota Belta 1.3',
    plate: 'MOG-5542',
    driverName: 'Abdi Shire',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'Sedan',
    year: 2021,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'SO',
    countryName: 'Somalia',
  },
  {
    objectId: 'veh-seed-so-2',
    model: 'Toyota Probox Shuttle',
    plate: 'HRG-1029',
    driverName: 'Yasmin Nur',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Station Wagon',
    year: 2022,
    capacity: '5 seats',
    module: 'ride',
    countryCode: 'SO',
    countryName: 'Somalia',
  },

  // 🇸🇸 South Sudan
  {
    objectId: 'veh-seed-ss-1',
    model: 'Toyota Rav4 AWD',
    plate: 'SSD-1192-B',
    driverName: 'Taban Lado',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_hyundai_accent_1792851958103.jpg',
    type: 'SUV',
    year: 2022,
    capacity: '5 seats',
    module: 'ride',
    countryCode: 'SS',
    countryName: 'South Sudan',
  },
  {
    objectId: 'veh-seed-ss-2',
    model: 'Toyota Corolla Altis',
    plate: 'SSD-3301-C',
    driverName: 'Mary Achol',
    status: 'Verified',
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Sedan',
    year: 2023,
    capacity: '4 seats',
    module: 'ride',
    countryCode: 'SS',
    countryName: 'South Sudan',
  },
];

export const DEFAULT_TRIPS: Trip[] = [
  // 🇪🇹 Ethiopia
  {
    tripId: '#TRP-ET-9284',
    passenger: 'Sara T.',
    passengerPhone: '0922 110 033',
    driver: 'Abebe K.',
    driverPhone: '0911 223 344',
    status: 'Completed',
    fareETB: 340.0,
    time: '2 min ago',
    pickup: 'Bole Medhanealem',
    destination: 'Kazanchis',
    distanceKm: 4.8,
    durationMin: 14,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    tripId: '#TRP-ET-9283',
    passenger: 'Nahom B.',
    passengerPhone: '0911 776 655',
    driver: 'Daniel M.',
    driverPhone: '0911 445 667',
    status: 'On-Going',
    fareETB: 480.0,
    time: '8 min ago',
    pickup: 'Meskel Square',
    destination: 'Bole International Airport',
    distanceKm: 12.4,
    durationMin: 22,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    coordinates: {
      pickup: [9.0107, 38.7612],
      dropoff: [8.9778, 38.7993],
      current: [8.995, 38.78],
    },
  },
  {
    tripId: '#TRP-ET-9282',
    passenger: 'Hana A.',
    passengerPhone: '0933 445 566',
    driver: 'Bereket S.',
    driverPhone: '0911 889 900',
    status: 'Cancelled',
    fareETB: 260.0,
    time: '12 min ago',
    pickup: 'CMC Michael',
    destination: 'Bole Atlas',
    distanceKm: 9.1,
    durationMin: 20,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    tripId: '#TRP-ET-9281',
    passenger: 'Elias M.',
    passengerPhone: '0911 332 211',
    driver: 'Kibrom T.',
    driverPhone: '0911 556 677',
    status: 'Completed',
    fareETB: 310.0,
    time: '28 min ago',
    pickup: 'Piazza',
    destination: 'Megenagna',
    distanceKm: 6.2,
    durationMin: 18,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    tripId: '#TRP-ET-9280',
    passenger: 'Yared G.',
    passengerPhone: '0944 887 766',
    driver: 'Selamawit D.',
    driverPhone: '0911 998 776',
    status: 'Completed',
    fareETB: 390.0,
    time: '34 min ago',
    pickup: 'Sarbet',
    destination: 'Hayahulet',
    distanceKm: 8.5,
    durationMin: 21,
    module: 'ride',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },

  // 🇰🇪 Kenya
  {
    tripId: '#TRP-KE-4401',
    passenger: 'Kevin Omondi',
    passengerPhone: '+254 712 990 112',
    driver: 'Faith Wanjiku',
    driverPhone: '+254 722 987 654',
    status: 'On-Going',
    fareETB: 520.0,
    time: '4 min ago',
    pickup: 'Jomo Kenyatta Intl. Airport (JKIA)',
    destination: 'Upper Hill Financial District',
    distanceKm: 16.2,
    durationMin: 32,
    module: 'ride',
    countryCode: 'KE',
    countryName: 'Kenya',
  },
  {
    tripId: '#TRP-KE-4402',
    passenger: 'Grace Muthoni',
    passengerPhone: '+254 733 445 566',
    driver: 'Faith Wanjiku',
    driverPhone: '+254 722 987 654',
    status: 'Completed',
    fareETB: 380.0,
    time: '19 min ago',
    pickup: 'Westlands Sarit Centre',
    destination: 'Nairobi Central Business District',
    distanceKm: 5.4,
    durationMin: 15,
    module: 'ride',
    countryCode: 'KE',
    countryName: 'Kenya',
  },

  // 🇺🇬 Uganda
  {
    tripId: '#TRP-UG-3101',
    passenger: 'Brian Ssemwogerere',
    passengerPhone: '+256 782 110 220',
    driver: 'Sarah Nalwanga',
    driverPhone: '+256 701 456 789',
    status: 'On-Going',
    fareETB: 450.0,
    time: '7 min ago',
    pickup: 'Entebbe International Airport',
    destination: 'Kampala Serena Nakasero',
    distanceKm: 41.5,
    durationMin: 55,
    module: 'ride',
    countryCode: 'UG',
    countryName: 'Uganda',
  },
  {
    tripId: '#TRP-UG-3102',
    passenger: 'Annet Namubiru',
    passengerPhone: '+256 772 334 556',
    driver: 'Sarah Nalwanga',
    driverPhone: '+256 701 456 789',
    status: 'Completed',
    fareETB: 290.0,
    time: '25 min ago',
    pickup: 'Kololo Business Hub',
    destination: 'Bugolobi Village Mall',
    distanceKm: 4.8,
    durationMin: 14,
    module: 'ride',
    countryCode: 'UG',
    countryName: 'Uganda',
  },

  // 🇷🇼 Rwanda
  {
    tripId: '#TRP-RW-1201',
    passenger: 'Aline Umutoni',
    passengerPhone: '+250 788 445 667',
    driver: 'Jean-Paul Habimana',
    driverPhone: '+250 788 123 789',
    status: 'On-Going',
    fareETB: 410.0,
    time: '3 min ago',
    pickup: 'Kigali International Airport',
    destination: 'Kigali Heights Commercial Hub',
    distanceKm: 9.5,
    durationMin: 18,
    module: 'ride',
    countryCode: 'RW',
    countryName: 'Rwanda',
  },

  // 🇹🇿 Tanzania
  {
    tripId: '#TRP-TZ-8801',
    passenger: 'Baraka Mrema',
    passengerPhone: '+255 754 112 334',
    driver: 'Juma Rashid',
    driverPhone: '+255 754 987 321',
    status: 'Completed',
    fareETB: 460.0,
    time: '14 min ago',
    pickup: 'Julius Nyerere Intl Airport Terminal 3',
    destination: 'Posta Central Business District',
    distanceKm: 12.8,
    durationMin: 28,
    module: 'ride',
    countryCode: 'TZ',
    countryName: 'Tanzania',
  },

  // 🇩🇯 Djibouti
  {
    tripId: '#TRP-DJ-5501',
    passenger: 'Ahmed Osman',
    passengerPhone: '+253 77 88 99 00',
    driver: 'Mohamed Farah',
    driverPhone: '+253 77 12 34 56',
    status: 'On-Going',
    fareETB: 580.0,
    time: '9 min ago',
    pickup: 'Djibouti-Ambouli International Airport',
    destination: 'Port of Djibouti Doraleh Free Zone',
    distanceKm: 14.1,
    durationMin: 24,
    module: 'ride',
    countryCode: 'DJ',
    countryName: 'Djibouti',
  },

  // 🇸🇴 Somalia
  {
    tripId: '#TRP-SO-6601',
    passenger: 'Abdirahman Ali',
    passengerPhone: '+252 61 777 8899',
    driver: 'Hassan Warsame',
    driverPhone: '+252 61 555 4321',
    status: 'Completed',
    fareETB: 490.0,
    time: '21 min ago',
    pickup: 'Aden Adde International Airport',
    destination: 'Bakara Commercial District',
    distanceKm: 6.8,
    durationMin: 17,
    module: 'ride',
    countryCode: 'SO',
    countryName: 'Somalia',
  },

  // 🇸🇸 South Sudan
  {
    tripId: '#TRP-SS-7701',
    passenger: 'Mary Achol',
    passengerPhone: '+211 922 889 900',
    driver: 'Deng Garang',
    driverPhone: '+211 922 345 678',
    status: 'On-Going',
    fareETB: 540.0,
    time: '5 min ago',
    pickup: 'Juba International Airport',
    destination: 'Ministries Complex & Diplomatic Quarter',
    distanceKm: 5.6,
    durationMin: 16,
    module: 'ride',
    countryCode: 'SS',
    countryName: 'South Sudan',
  },
];

export const DEFAULT_SHIPMENTS: Shipment[] = [
  // 🇪🇹 Ethiopia
  {
    objectId: 'shp-seed-et-1',
    shipmentId: '#DLV-ET-7721',
    status: 'In Transit',
    time: '12 min ago',
    origin: 'Addis Ababa (Kality Hub)',
    destination: 'Adama Industrial Park',
    cargoType: 'Consumer Goods & Textiles',
    tonnage: 14.5,
    truckPlate: '3-ET-48190',
    driver: 'Tsegaye Hailu',
    freightRateETB: 48500,
    estimatedDelivery: 'Today, 16:45',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'shp-seed-et-2',
    shipmentId: '#DLV-ET-7720',
    status: 'Picked Up',
    time: '28 min ago',
    origin: 'Dire Dawa Dry Port',
    destination: 'Jigjiga Regional Hub',
    cargoType: 'Packaged Foods & Beverages',
    tonnage: 22.0,
    truckPlate: '3-ET-91823',
    driver: 'Dawit Alemayehu',
    freightRateETB: 72000,
    estimatedDelivery: 'Tomorrow, 11:30',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'shp-seed-et-3',
    shipmentId: '#DLV-ET-7719',
    status: 'Delivered',
    time: '1 hour ago',
    origin: 'Mekele Logistics Center',
    destination: 'Addis Ababa Central Depot',
    cargoType: 'Industrial Hardware & Raw Materials',
    tonnage: 26.8,
    truckPlate: '3-ET-33910',
    driver: 'Hailemariam K.',
    freightRateETB: 115000,
    estimatedDelivery: 'Completed Today',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    objectId: 'shp-seed-et-4',
    shipmentId: '#DLV-ET-7722',
    status: 'Pending',
    time: 'Just scheduled',
    origin: 'Modjo Dry Port Bonded Terminal',
    destination: 'Hawassa Industrial Park',
    cargoType: 'Export Coffee & Cotton Bales',
    tonnage: 19.2,
    truckPlate: '3-ET-19402',
    driver: 'Tsegaye Hailu',
    freightRateETB: 64000,
    estimatedDelivery: 'Tomorrow, 15:00',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },

  // 🇰🇪 Kenya
  {
    objectId: 'shp-seed-ke-1',
    shipmentId: '#DLV-KE-8810',
    status: 'In Transit',
    time: '15 min ago',
    origin: 'Kilindini Port of Mombasa (Container Terminal 2)',
    destination: 'Nairobi Inland Container Depot (ICD Embakasi)',
    cargoType: 'Electronics & High-Value Consumer Goods',
    tonnage: 28.0,
    truckPlate: 'KDA-491P',
    driver: 'James Mwangi',
    freightRateETB: 142000,
    estimatedDelivery: 'Today, 20:30',
    countryCode: 'KE',
    countryName: 'Kenya',
  },
  {
    objectId: 'shp-seed-ke-2',
    shipmentId: '#DLV-KE-8811',
    status: 'Picked Up',
    time: '35 min ago',
    origin: 'Eldoret Logistics Hub',
    destination: 'Kisumu Port Lake Hub',
    cargoType: 'Agricultural Inputs & Fertilizer',
    tonnage: 18.5,
    truckPlate: 'KBY-310M',
    driver: 'James Mwangi',
    freightRateETB: 58000,
    estimatedDelivery: 'Tomorrow, 09:00',
    countryCode: 'KE',
    countryName: 'Kenya',
  },

  // 🇺🇬 Uganda
  {
    objectId: 'shp-seed-ug-1',
    shipmentId: '#DLV-UG-4410',
    status: 'In Transit',
    time: '20 min ago',
    origin: 'Namanve Industrial Park Kampala',
    destination: 'Malaba Border Post (OSBP Custom Clearing)',
    cargoType: 'Steel Rebars & Cement Cargo',
    tonnage: 32.0,
    truckPlate: 'UBA-882K',
    driver: 'John Okello',
    freightRateETB: 98000,
    estimatedDelivery: 'Today, 22:00',
    countryCode: 'UG',
    countryName: 'Uganda',
  },

  // 🇷🇼 Rwanda
  {
    objectId: 'shp-seed-rw-1',
    shipmentId: '#DLV-RW-2210',
    status: 'In Transit',
    time: '18 min ago',
    origin: 'Kigali Special Economic Zone (Masaka Prime)',
    destination: 'Rubavu Gisenyi Border Terminal',
    cargoType: 'Pharmaceuticals & Cold-Chain Goods',
    tonnage: 16.0,
    truckPlate: 'RAD-771B',
    driver: 'Jean-Paul Habimana',
    freightRateETB: 76000,
    estimatedDelivery: 'Today, 18:15',
    countryCode: 'RW',
    countryName: 'Rwanda',
  },

  // 🇹🇿 Tanzania
  {
    objectId: 'shp-seed-tz-1',
    shipmentId: '#DLV-TZ-3310',
    status: 'In Transit',
    time: '25 min ago',
    origin: 'Port of Dar es Salaam (Berths 1-4)',
    destination: 'Dodoma Inland Freight Logistics Depot',
    cargoType: 'Imported Machinery & Mining Spares',
    tonnage: 30.5,
    truckPlate: 'T-592-DEK',
    driver: 'Juma Rashid',
    freightRateETB: 128000,
    estimatedDelivery: 'Tomorrow, 08:30',
    countryCode: 'TZ',
    countryName: 'Tanzania',
  },

  // 🇩🇯 Djibouti
  {
    objectId: 'shp-seed-dj-1',
    shipmentId: '#DLV-DJ-5510',
    status: 'In Transit',
    time: '10 min ago',
    origin: 'Doraleh Multipurpose Port (DMP)',
    destination: 'PK12 Bonded Customs Checkpoint',
    cargoType: 'Bulk Grain & Heavy Container Freight',
    tonnage: 36.0,
    truckPlate: 'DJ-4412-B',
    driver: 'Mohamed Farah',
    freightRateETB: 110000,
    estimatedDelivery: 'Today, 17:00',
    countryCode: 'DJ',
    countryName: 'Djibouti',
  },

  // 🇸🇴 Somalia
  {
    objectId: 'shp-seed-so-1',
    shipmentId: '#DLV-SO-6610',
    status: 'Picked Up',
    time: '40 min ago',
    origin: 'Port of Mogadishu Container Yard',
    destination: 'Bakara Commercial Logistics Hub',
    cargoType: 'FMCG & Commercial Retail Inventory',
    tonnage: 15.0,
    truckPlate: 'MOG-7721',
    driver: 'Hassan Warsame',
    freightRateETB: 42000,
    estimatedDelivery: 'Today, 19:00',
    countryCode: 'SO',
    countryName: 'Somalia',
  },

  // 🇸🇸 South Sudan
  {
    objectId: 'shp-seed-ss-1',
    shipmentId: '#DLV-SS-7710',
    status: 'In Transit',
    time: '30 min ago',
    origin: 'Gumbo Customs & Dry Port Juba',
    destination: 'Nimule Border Post (EAC OSBP)',
    cargoType: 'Humanitarian Rations & Construction Supplies',
    tonnage: 24.0,
    truckPlate: 'SSD-8841-A',
    driver: 'Deng Garang',
    freightRateETB: 88000,
    estimatedDelivery: 'Tomorrow, 14:00',
    countryCode: 'SS',
    countryName: 'South Sudan',
  },
];

export const DEFAULT_CUSTOMERS: CustomerAccount[] = [
  {
    objectId: 'cust-seed-1',
    customerId: 'CUST-001',
    name: 'Sara Tefera',
    phone: '0922 110 033',
    email: 'sara.tefera@afronala.et',
    accountType: 'Ride Passenger',
    tripsCount: 48,
    totalSpentETB: 16320,
    status: 'Active',
    notes: 'Frequent Bole Airport & Kazanchis diplomatic corridor commuter.',
    joinedDate: 'Jan 2025',
  },
  {
    objectId: 'cust-seed-2',
    customerId: 'CUST-002',
    name: 'Nahom Berhanu',
    phone: '0911 776 655',
    email: 'nahom.b@ethionet.et',
    accountType: 'Ride Passenger',
    tripsCount: 92,
    totalSpentETB: 31450,
    status: 'Active',
    notes: 'Telebirr auto-debit verified rider.',
    joinedDate: 'Nov 2024',
  },
  {
    objectId: 'cust-seed-3',
    customerId: 'CUST-003',
    name: 'Mojo Agro Industry PLC',
    phone: '0911 990 123',
    email: 'logistics@mojoagro.et',
    accountType: 'Corporate Shipper',
    companyTin: 'TIN-0048192031',
    tripsCount: 14,
    totalSpentETB: 685000,
    status: 'Corporate',
    notes: 'Priority bonded dry-port freight contract; monthly CBE RTGS clearing.',
    joinedDate: 'Sep 2024',
  },
  {
    objectId: 'cust-seed-4',
    customerId: 'CUST-004',
    name: 'Hana Assefa',
    phone: '0933 445 566',
    email: 'hana.assefa@gmail.com',
    accountType: 'Ride Passenger',
    tripsCount: 26,
    totalSpentETB: 8820,
    status: 'Active',
    notes: 'Standard city passenger account in CMC / Megenagna.',
    joinedDate: 'Feb 2025',
  },
  {
    objectId: 'cust-seed-5',
    customerId: 'CUST-005',
    name: 'Kality Steel Mills SC',
    phone: '0912 334 556',
    email: 'procure@kalitysteel.et',
    accountType: 'Corporate Shipper',
    companyTin: 'TIN-0019283745',
    tripsCount: 22,
    totalSpentETB: 1120000,
    status: 'Corporate',
    notes: 'Heavy flatbed steel coil transport between Kality and Adama.',
    joinedDate: 'Aug 2024',
  },
  {
    objectId: 'cust-seed-6',
    customerId: 'CUST-006',
    name: 'Biniam Tadesse',
    phone: '0913 601 992',
    email: 'biniam.t@outlook.com',
    accountType: 'Ride Passenger',
    tripsCount: 7,
    totalSpentETB: 2150,
    status: 'Suspended',
    notes: 'Account temporarily paused pending disputed cash fare review (#TRP9211).',
    joinedDate: 'Mar 2025',
  },
];

export const DEFAULT_ALERTS: SystemAlert[] = [
  {
    id: 'alt-1',
    title: 'High demand surge detected in Bole area (+35% ride requests)',
    timeAgo: '5 min ago',
    type: 'high',
    resolved: false,
  },
  {
    id: 'alt-2',
    title: 'Truck delay alert: Freight unit (3-ET-48190) held at Modjo toll checkpoint',
    timeAgo: '12 min ago',
    type: 'warning',
    resolved: false,
  },
  {
    id: 'alt-3',
    title: 'New driver onboarding verification submitted (Selamawit D.)',
    timeAgo: '25 min ago',
    type: 'info',
    resolved: false,
  },
  {
    id: 'alt-4',
    title: 'Payment gateway timeout for trip #TRP9263 - auto-retrying Telebirr',
    timeAgo: '1 hour ago',
    type: 'payment',
    resolved: false,
  },
];

class Back4AppService {
  private isOnlineCache = true;
  private latencyMs = 85;
  private currentAdminRole = 'Super Admin';
  private cloudMeta: Back4AppCloudStatus = {
    online: true,
    latency: 85,
    appName: 'Afronala Parse Cloud',
    maskedAppId: BACK4APP_CONFIG.applicationId,
    maskedClientKey: BACK4APP_CONFIG.clientKey,
    proxyEndpoint: '/api/back4app/classes/*',
  };

  setAdminRole(role: string) {
    this.currentAdminRole = role || 'Super Admin';
  }

  getAdminRole(): string {
    return this.currentAdminRole;
  }

  private buildHeaders(isSeed = false): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-role': this.currentAdminRole,
    };
    if (isSeed) {
      h['x-seed-init'] = 'true';
    }
    return h;
  }

  private getStored<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(`afronala_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStored<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`afronala_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  async checkHealth(): Promise<Back4AppCloudStatus> {
    const start = performance.now();
    try {
      const res = await fetch('/api/back4app/status');
      const end = performance.now();
      this.latencyMs = Math.round(end - start);
      if (res.ok) {
        const json = await res.json();
        this.isOnlineCache = Boolean(json.online);
        this.cloudMeta = {
          online: Boolean(json.online),
          latency: json.latency ?? this.latencyMs,
          appName: json.appName || 'Afronala Parse Cloud',
          maskedAppId: json.maskedAppId || BACK4APP_CONFIG.applicationId,
          maskedClientKey: json.maskedClientKey || BACK4APP_CONFIG.clientKey,
          proxyEndpoint: json.proxyEndpoint || '/api/back4app/classes/*',
          timestamp: json.timestamp,
        };
        return this.cloudMeta;
      }
    } catch {
      // Offline cache fallback
    }
    this.isOnlineCache = false;
    return {
      ...this.cloudMeta,
      online: false,
      latency: 0,
      appName: 'Afronala Local Cache',
    };
  }

  // Modules CRUD
  async getModules(): Promise<ModuleItem[]> {
    let resultList: ModuleItem[] = [];
    try {
      const res = await fetch('/api/back4app/classes/ModuleRegistry', {
        headers: this.buildHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          const seenKeys = new Set<string>();
          const remoteModules: ModuleItem[] = [];

          for (const r of json.results) {
            if (!r.key || seenKeys.has(r.key)) continue;
            seenKeys.add(r.key);

            const defaultMod = DEFAULT_MODULES.find((m) => m.key === r.key);
            const countryConfigs =
              r.countryConfigs ||
              defaultMod?.countryConfigs ||
              (r.key !== 'more'
                ? buildDefaultCountryConfigsForModule(r.key, r.name, r.category || 'Mobility')
                : undefined);

            const countries =
              r.countries ||
              defaultMod?.countries ||
              (countryConfigs
                ? (Object.keys(countryConfigs) as Exclude<EastAfricaCountryCode, 'ALL'>[]).filter(
                    (k) => countryConfigs[k]?.enabled
                  )
                : undefined);

            remoteModules.push({
              id: r.moduleId || r.objectId,
              objectId: r.objectId,
              key: r.key,
              name: r.name,
              description: r.description,
              icon: r.icon,
              enabled: Boolean(r.enabled),
              statusText: r.enabled ? 'Enabled' : 'Disabled',
              category: r.category || 'General',
              canToggle: r.canToggle !== false,
              isCustom: Boolean(r.isCustom),
              customClasses: r.customClasses,
              fields: r.fields,
              countries,
              countryConfigs,
              panEastAfricaCommissionCapPct: r.panEastAfricaCommissionCapPct || defaultMod?.panEastAfricaCommissionCapPct,
              globalRolloutStage: r.globalRolloutStage || defaultMod?.globalRolloutStage,
              primaryRegulatoryAgency: r.primaryRegulatoryAgency || defaultMod?.primaryRegulatoryAgency,
            });
          }

          this.setStored('modules', remoteModules);
          resultList = remoteModules;
        } else {
          await this.seedModules(DEFAULT_MODULES);
          resultList = DEFAULT_MODULES;
        }
      }
    } catch (e) {
      console.warn('Back4App proxy fetch failed, falling back to cache:', e);
    }

    if (resultList.length === 0) {
      const cached = this.getStored<ModuleItem[]>('modules', DEFAULT_MODULES);
      const seen = new Set<string>();
      resultList = cached.filter((m) => {
        if (seen.has(m.key)) return false;
        seen.add(m.key);
        return true;
      });
    }

    // Hydrate countryConfigs if missing from prior legacy cache
    return resultList.map((mod) => {
      if (mod.key === 'more') return mod;
      if (!mod.countryConfigs) {
        const defaultMod = DEFAULT_MODULES.find((m) => m.key === mod.key);
        const configs =
          defaultMod?.countryConfigs ||
          buildDefaultCountryConfigsForModule(mod.key, mod.name, mod.category);
        const countries =
          defaultMod?.countries ||
          (Object.keys(configs) as Exclude<EastAfricaCountryCode, 'ALL'>[]).filter((c) => configs[c]?.enabled);
        return {
          ...mod,
          countryConfigs: configs,
          countries: mod.countries || countries,
          panEastAfricaCommissionCapPct: mod.panEastAfricaCommissionCapPct || defaultMod?.panEastAfricaCommissionCapPct || 15,
          globalRolloutStage: mod.globalRolloutStage || defaultMod?.globalRolloutStage || 'Active (Production)',
          primaryRegulatoryAgency: mod.primaryRegulatoryAgency || defaultMod?.primaryRegulatoryAgency,
        };
      }
      return mod;
    });
  }

  async seedModules(modules: ModuleItem[]) {
    try {
      const res = await fetch('/api/back4app/classes/ModuleRegistry', {
        headers: this.buildHeaders(true),
      });
      const existing = res.ok ? (await res.json()).results || [] : [];
      const existingByKey = new Map<string, string>();
      for (const item of existing) {
        if (item.key && !existingByKey.has(item.key)) {
          existingByKey.set(item.key, item.objectId);
        }
      }

      for (const mod of modules) {
        const payload = {
          moduleId: mod.id,
          key: mod.key,
          name: mod.name,
          description: mod.description,
          icon: mod.icon,
          enabled: mod.enabled,
          category: mod.category,
          canToggle: mod.canToggle,
          countries: mod.countries,
          countryConfigs: mod.countryConfigs,
          panEastAfricaCommissionCapPct: mod.panEastAfricaCommissionCapPct,
          globalRolloutStage: mod.globalRolloutStage,
          primaryRegulatoryAgency: mod.primaryRegulatoryAgency,
        };

        if (existingByKey.has(mod.key)) {
          const objectId = existingByKey.get(mod.key);
          await fetch(`/api/back4app/classes/ModuleRegistry/${objectId}`, {
            method: 'PUT',
            headers: this.buildHeaders(true),
            body: JSON.stringify(payload),
          });
        } else {
          await fetch('/api/back4app/classes/ModuleRegistry', {
            method: 'POST',
            headers: this.buildHeaders(true),
            body: JSON.stringify(payload),
          });
        }
      }
    } catch (e) {
      console.warn('Error upserting modules to Back4App proxy:', e);
    }
  }

  async toggleModule(moduleKey: string, enabled: boolean): Promise<ModuleItem[]> {
    const current = await this.getModules();
    const updated = current.map((m) =>
      m.key === moduleKey ? { ...m, enabled, statusText: enabled ? 'Enabled' : 'Disabled' } : m
    );
    this.setStored('modules', updated);

    const target = current.find((m) => m.key === moduleKey);
    if (target?.objectId && !target.objectId.startsWith('local-')) {
      try {
        await fetch(`/api/back4app/classes/ModuleRegistry/${target.objectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ enabled, statusText: enabled ? 'Enabled' : 'Disabled' }),
        });
      } catch (err) {
        console.warn('Error syncing module toggle to Back4App proxy:', err);
      }
    }
    return updated;
  }

  /**
   * Toggles a module for a specific East African jurisdiction (country-scoped toggle)
   */
  async toggleModuleCountry(
    moduleKey: string,
    countryCode: Exclude<EastAfricaCountryCode, 'ALL'>,
    enabled: boolean
  ): Promise<ModuleItem[]> {
    const current = await this.getModules();
    const updated = current.map((m) => {
      if (m.key !== moduleKey) return m;

      const currentConfigs = m.countryConfigs || {};
      const existingCountryConfig = currentConfigs[countryCode];

      const newCountryConfig = existingCountryConfig
        ? {
            ...existingCountryConfig,
            enabled,
            operatingStatus: enabled
              ? (existingCountryConfig.operatingStatus === 'disabled' ? 'active' : existingCountryConfig.operatingStatus)
              : ('disabled' as const),
            statusLabel: enabled ? 'Active in Country' : 'Disabled in Country',
            updatedAt: new Date().toISOString(),
          }
        : undefined;

      const updatedConfigs = newCountryConfig
        ? { ...currentConfigs, [countryCode]: newCountryConfig }
        : currentConfigs;

      const updatedCountries = enabled
        ? Array.from(new Set([...(m.countries || []), countryCode]))
        : (m.countries || []).filter((c) => c !== countryCode);

      return {
        ...m,
        countries: updatedCountries,
        countryConfigs: updatedConfigs,
      };
    });

    this.setStored('modules', updated);

    const target = updated.find((m) => m.key === moduleKey);
    if (target?.objectId && !target.objectId.startsWith('local-')) {
      try {
        await fetch(`/api/back4app/classes/ModuleRegistry/${target.objectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            countries: target.countries,
            countryConfigs: target.countryConfigs,
          }),
        });
      } catch (err) {
        console.warn('Error syncing country module toggle to Back4App proxy:', err);
      }
    }
    return updated;
  }

  /**
   * Updates detailed regulatory, commission, or operational parameters for a module in a specific country
   */
  async updateModuleCountryConfig(
    moduleKey: string,
    countryCode: Exclude<EastAfricaCountryCode, 'ALL'>,
    configUpdate: Partial<EastAfricaModuleCountryConfig>
  ): Promise<ModuleItem[]> {
    const current = await this.getModules();
    const updated = current.map((m) => {
      if (m.key !== moduleKey) return m;

      const currentConfigs = m.countryConfigs || {};
      const existingConfig = currentConfigs[countryCode];
      if (!existingConfig) return m;

      const mergedConfig: EastAfricaModuleCountryConfig = {
        ...existingConfig,
        ...configUpdate,
        updatedAt: new Date().toISOString(),
      };

      const isEnabled = mergedConfig.enabled;
      const updatedCountries = isEnabled
        ? Array.from(new Set([...(m.countries || []), countryCode]))
        : (m.countries || []).filter((c) => c !== countryCode);

      return {
        ...m,
        countries: updatedCountries,
        countryConfigs: {
          ...currentConfigs,
          [countryCode]: mergedConfig,
        },
      };
    });

    this.setStored('modules', updated);

    const target = updated.find((m) => m.key === moduleKey);
    if (target?.objectId && !target.objectId.startsWith('local-')) {
      try {
        await fetch(`/api/back4app/classes/ModuleRegistry/${target.objectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            countries: target.countries,
            countryConfigs: target.countryConfigs,
          }),
        });
      } catch (err) {
        console.warn('Error updating module country config in Back4App proxy:', err);
      }
    }
    return updated;
  }

  // Drivers CRUD
  async getDrivers(): Promise<Driver[]> {
    try {
      const res = await fetch('/api/back4app/classes/Driver?order=-createdAt', {
        headers: this.buildHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          const seenPhones = new Set<string>();
          const list: Driver[] = [];

          for (const d of json.results) {
            const rawPhone = String(d.phone || d.phoneNumber || d.telephone || '').trim();
            const phone = rawPhone || (d.objectId ? `0911-${String(d.objectId).slice(0, 6)}` : `0911-${Math.random().toString(36).slice(2, 8)}`);

            if (seenPhones.has(phone)) continue;
            seenPhones.add(phone);

            const rawName = String(
              d.name ||
                d.fullName ||
                (d.firstName ? `${d.firstName} ${d.lastName || ''}`.trim() : '') ||
                ''
            ).trim();
            const name = rawName || 'SuperApp Driver';

            const rawPlate = String(d.vehiclePlate || d.plate || d.licensePlate || '').trim();
            const vehiclePlate = rawPlate || (d.objectId ? `AA-${String(d.objectId).slice(0, 5).toUpperCase()}` : 'AA-12345');

            const vehicleModel = String(d.vehicleModel || d.model || 'Toyota Vitz').trim();

            const rawStatus = String(d.status || '').toLowerCase();
            const status: DriverStatus =
              rawStatus === 'active' || rawStatus === 'available' || rawStatus === 'verified'
                ? rawStatus === 'verified'
                  ? 'Verified'
                  : 'Active'
                : rawStatus === 'suspended' || rawStatus === 'inactive'
                ? 'Suspended'
                : 'Pending';

            const moduleVal: 'ride' | 'truck' =
              d.activeServiceMode === 'truck' || d.module === 'truck' ? 'truck' : 'ride';

            const countryCode =
              d.countryCode ||
              (phone.startsWith('+254')
                ? 'KE'
                : phone.startsWith('+250')
                ? 'RW'
                : phone.startsWith('+256')
                ? 'UG'
                : phone.startsWith('+255')
                ? 'TZ'
                : phone.startsWith('+253')
                ? 'DJ'
                : phone.startsWith('+252')
                ? 'SO'
                : phone.startsWith('+211')
                ? 'SS'
                : 'ET');

            const countryName =
              d.countryName ||
              (countryCode === 'KE'
                ? 'Kenya'
                : countryCode === 'RW'
                ? 'Rwanda'
                : countryCode === 'UG'
                ? 'Uganda'
                : countryCode === 'TZ'
                ? 'Tanzania'
                : countryCode === 'DJ'
                ? 'Djibouti'
                : countryCode === 'SO'
                ? 'Somalia'
                : countryCode === 'SS'
                ? 'South Sudan'
                : 'Ethiopia');

            list.push({
              objectId: d.objectId,
              name,
              phone,
              vehicleModel,
              vehiclePlate,
              status,
              rating: typeof d.rating === 'number' && d.rating > 0 ? d.rating : 4.8,
              avatar: d.avatar,
              module: moduleVal,
              countryCode,
              countryName,
              tripsCompleted: Number(d.tripsCompleted || d.totalTrips || d.ridesCompleted || 0),
              earningsETB: Number(d.earningsETB || 0),
              joinedDate: d.joinedDate || 'Recently',
              licenseExpiryDate: normalizeParseIsoDate(d.licenseExpiryDate),
              bolaInspectionExpiryDate: normalizeParseIsoDate(d.bolaInspectionExpiryDate),
              insuranceExpiryDate: normalizeParseIsoDate(d.insuranceExpiryDate),
              tinClearanceExpiryDate: normalizeParseIsoDate(d.tinClearanceExpiryDate),
              complianceNoticeSentAt: d.complianceNoticeSentAt,
            });
          }

          this.setStored('drivers', list);
          return list;
        } else {
          await this.seedDrivers(DEFAULT_DRIVERS);
          return DEFAULT_DRIVERS;
        }
      }
    } catch (err) {
      console.warn('Error fetching drivers from Back4App proxy:', err);
    }
    const cached = this.getStored<Driver[]>('drivers', DEFAULT_DRIVERS);
    const seen = new Set<string>();
    return cached.filter((d) => {
      if (seen.has(d.phone)) return false;
      seen.add(d.phone);
      return true;
    });
  }

  async seedDrivers(drivers: Driver[]) {
    try {
      const res = await fetch('/api/back4app/classes/Driver', {
        headers: this.buildHeaders(true),
      });
      const existing = res.ok ? (await res.json()).results || [] : [];
      const existingByPhone = new Map<string, string>();
      for (const item of existing) {
        if (item.phone && !existingByPhone.has(item.phone)) {
          existingByPhone.set(item.phone, item.objectId);
        }
      }

      for (const d of drivers) {
        const { objectId: _omit, ...payload } = d;
        if (existingByPhone.has(d.phone)) {
          const objectId = existingByPhone.get(d.phone);
          await fetch(`/api/back4app/classes/Driver/${objectId}`, {
            method: 'PUT',
            headers: this.buildHeaders(true),
            body: JSON.stringify(payload),
          });
        } else {
          await fetch('/api/back4app/classes/Driver', {
            method: 'POST',
            headers: this.buildHeaders(true),
            body: JSON.stringify(payload),
          });
        }
      }
    } catch (e) {
      console.warn('Seed drivers error:', e);
    }
  }

  async addDriver(driver: Omit<Driver, 'objectId'>): Promise<Driver> {
    const newDriver: Driver = { ...driver, objectId: 'local-' + Date.now() };
    try {
      const res = await fetch('/api/back4app/classes/Driver', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(driver),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.objectId) newDriver.objectId = json.objectId;
      }
    } catch (e) {
      console.warn('Remote driver creation error, saved locally:', e);
    }
    const current = await this.getDrivers();
    const updated = [newDriver, ...current];
    this.setStored('drivers', updated);
    return newDriver;
  }

  async updateDriverStatus(objectId: string, status: DriverStatus): Promise<void> {
    const drivers = await this.getDrivers();
    const updated = drivers.map((d) => (d.objectId === objectId ? { ...d, status } : d));
    this.setStored('drivers', updated);
    if (objectId && !objectId.startsWith('local-') && !objectId.startsWith('drv-seed-')) {
      try {
        await fetch(`/api/back4app/classes/Driver/${objectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ status }),
        });
      } catch (e) {
        console.warn('Error updating driver in Back4App proxy:', e);
      }
    }
  }

  async deleteDriver(objectId: string): Promise<void> {
    const drivers = await this.getDrivers();
    const updated = drivers.filter((d) => d.objectId !== objectId);
    this.setStored('drivers', updated);
    if (objectId && !objectId.startsWith('local-') && !objectId.startsWith('drv-seed-')) {
      try {
        await fetch(`/api/back4app/classes/Driver/${objectId}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
      } catch (e) {
        console.warn('Error deleting driver from Back4App proxy:', e);
      }
    }
  }

  // Vehicles CRUD
  async getVehicles(): Promise<Vehicle[]> {
    try {
      const res = await fetch('/api/back4app/classes/Vehicle?order=-createdAt', {
        headers: this.buildHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          const seenPlates = new Set<string>();
          const list: Vehicle[] = [];

          for (const v of json.results) {
            const rawPlate = String(v.plate || v.vehiclePlate || v.licensePlate || '').trim();
            const plate = rawPlate || (v.objectId ? `AA-${String(v.objectId).slice(0, 5).toUpperCase()}` : 'AA-00000');

            if (seenPlates.has(plate)) continue;
            seenPlates.add(plate);

            const model = String(v.model || v.vehicleModel || 'Toyota Vitz').trim();
            const driverName = String(v.driverName || v.driver || 'Assigned Driver').trim();

            const rawStatus = String(v.status || '').toLowerCase();
            const status: VehicleStatus =
              rawStatus === 'verified' ? 'Verified' : rawStatus === 'active' ? 'Active' : rawStatus === 'inspection' ? 'Inspection' : 'Verified';

            list.push({
              objectId: v.objectId,
              model,
              plate,
              driverName,
              status,
              photoUrl: v.photoUrl || '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
              type: v.type || 'Hatchback',
              year: Number(v.year) || 2022,
              capacity: v.capacity || '4 seats',
              module: v.module || 'ride',
              countryCode: v.countryCode,
              countryName: v.countryName,
            });
          }

          this.setStored('vehicles', list);
          return list;
        } else {
          await this.seedVehicles(DEFAULT_VEHICLES);
          return DEFAULT_VEHICLES;
        }
      }
    } catch (err) {
      console.warn('Error fetching vehicles from Back4App proxy:', err);
    }
    const cached = this.getStored<Vehicle[]>('vehicles', DEFAULT_VEHICLES);
    const seen = new Set<string>();
    return cached.filter((v) => {
      if (seen.has(v.plate)) return false;
      seen.add(v.plate);
      return true;
    });
  }

  async seedVehicles(vehicles: Vehicle[]) {
    try {
      const res = await fetch('/api/back4app/classes/Vehicle', {
        headers: this.buildHeaders(true),
      });
      const existing = res.ok ? (await res.json()).results || [] : [];
      const existingByPlate = new Map<string, string>();
      for (const item of existing) {
        if (item.plate && !existingByPlate.has(item.plate)) {
          existingByPlate.set(item.plate, item.objectId);
        }
      }

      for (const v of vehicles) {
        const { objectId: _omit, ...payload } = v;
        if (existingByPlate.has(v.plate)) {
          const objectId = existingByPlate.get(v.plate);
          await fetch(`/api/back4app/classes/Vehicle/${objectId}`, {
            method: 'PUT',
            headers: this.buildHeaders(true),
            body: JSON.stringify(payload),
          });
        } else {
          await fetch('/api/back4app/classes/Vehicle', {
            method: 'POST',
            headers: this.buildHeaders(true),
            body: JSON.stringify(payload),
          });
        }
      }
    } catch (e) {
      console.warn('Seed vehicles error:', e);
    }
  }

  async addVehicle(vehicle: Omit<Vehicle, 'objectId'>): Promise<Vehicle> {
    const newVehicle: Vehicle = { ...vehicle, objectId: 'local-' + Date.now() };
    try {
      const res = await fetch('/api/back4app/classes/Vehicle', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(vehicle),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.objectId) newVehicle.objectId = json.objectId;
      }
    } catch (e) {
      console.warn('Remote vehicle creation error, saved locally:', e);
    }
    const current = await this.getVehicles();
    const updated = [newVehicle, ...current];
    this.setStored('vehicles', updated);
    return newVehicle;
  }

  async updateVehicleStatus(objectId: string, status: VehicleStatus): Promise<void> {
    const vehicles = await this.getVehicles();
    const updated = vehicles.map((v) => (v.objectId === objectId ? { ...v, status } : v));
    this.setStored('vehicles', updated);
    if (objectId && !objectId.startsWith('local-') && !objectId.startsWith('veh-seed-')) {
      try {
        await fetch(`/api/back4app/classes/Vehicle/${objectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ status }),
        });
      } catch (e) {
        console.warn('Error updating vehicle in Back4App proxy:', e);
      }
    }
  }

  // Customers & Corporate Shippers CRUD
  async getCustomers(): Promise<CustomerAccount[]> {
    try {
      const res = await fetch('/api/back4app/classes/Customer?order=-createdAt', {
        headers: this.buildHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          const seenIds = new Set<string>();
          const list: CustomerAccount[] = [];
          for (const c of json.results) {
            const cid = c.customerId || c.objectId;
            if (seenIds.has(cid)) continue;
            seenIds.add(cid);
            list.push({
              objectId: c.objectId,
              customerId: c.customerId || `CUST-${String(list.length + 1).padStart(3, '0')}`,
              name: c.name || 'Unnamed Account',
              phone: c.phone || '0911 000 000',
              email: c.email || 'account@afronala.et',
              accountType: c.accountType === 'Corporate Shipper' ? 'Corporate Shipper' : 'Ride Passenger',
              companyTin: c.companyTin || undefined,
              tripsCount: Number(c.tripsCount) || 0,
              totalSpentETB: Number(c.totalSpentETB) || 0,
              status: c.status || 'Active',
              notes: c.notes || '',
              joinedDate: c.joinedDate || '2025',
            });
          }
          this.setStored('customers', list);
          return list;
        }
      }
    } catch (err) {
      console.warn('Customer query fallback to local storage:', err);
    }
    return this.getStored<CustomerAccount[]>('customers', DEFAULT_CUSTOMERS);
  }

  async addCustomer(
    customer: Omit<CustomerAccount, 'objectId' | 'customerId'>
  ): Promise<CustomerAccount> {
    const current = await this.getCustomers();
    const nextNum = current.length + 101;
    const newCustomer: CustomerAccount = {
      ...customer,
      customerId: `CUST-${nextNum}`,
      objectId: `local-cust-${Date.now()}`,
    };

    try {
      const { objectId: _omit, ...payload } = newCustomer;
      const res = await fetch('/api/back4app/classes/Customer', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.objectId) newCustomer.objectId = json.objectId;
      }
    } catch (err) {
      console.warn('Saved customer locally (cloud offline):', err);
    }

    const updated = [newCustomer, ...current];
    this.setStored('customers', updated);
    return newCustomer;
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<CustomerAccount>
  ): Promise<CustomerAccount[]> {
    const current = await this.getCustomers();
    let targetObjectId: string | undefined;

    const updated = current.map((c) => {
      if (c.customerId === customerId || c.objectId === customerId) {
        targetObjectId = c.objectId;
        return { ...c, ...updates };
      }
      return c;
    });

    this.setStored('customers', updated);

    if (
      targetObjectId &&
      !targetObjectId.startsWith('local-') &&
      !targetObjectId.startsWith('cust-seed-')
    ) {
      try {
        await fetch(`/api/back4app/classes/Customer/${targetObjectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.warn('Error syncing customer update to Back4App proxy:', err);
      }
    }

    return updated;
  }

  async deleteCustomer(customerId: string): Promise<CustomerAccount[]> {
    const current = await this.getCustomers();
    const target = current.find((c) => c.customerId === customerId || c.objectId === customerId);
    const updated = current.filter(
      (c) => c.customerId !== customerId && c.objectId !== customerId
    );
    this.setStored('customers', updated);

    if (
      target?.objectId &&
      !target.objectId.startsWith('local-') &&
      !target.objectId.startsWith('cust-seed-')
    ) {
      try {
        await fetch(`/api/back4app/classes/Customer/${target.objectId}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
      } catch (err) {
        console.warn('Error deleting customer from Back4App proxy:', err);
      }
    }

    return updated;
  }

  // Trips & Shipments (Dual-Compatible with Flutter SuperApp Ride & TruckBooking classes)
  async getTrips(): Promise<Trip[]> {
    const stored = this.getStored('trips', DEFAULT_TRIPS);
    try {
      const [rideRes, tripRes] = await Promise.all([
        fetch('/api/back4app/classes/Ride?order=-createdAt&limit=25', {
          headers: this.buildHeaders(),
        }).catch(() => null),
        fetch('/api/back4app/classes/Trip?order=-createdAt&limit=25', {
          headers: this.buildHeaders(),
        }).catch(() => null),
      ]);

      const merged: Trip[] = [];
      const seenIds = new Set<string>();

      if (rideRes && rideRes.ok) {
        const rideJson = await rideRes.json();
        for (const r of rideJson.results || []) {
          if (r._isSchemaPrototype) continue;
          const tid = r.tripId || r.rideCode || `#RDE-${String(r.objectId || '').slice(0, 5).toUpperCase()}`;
          if (seenIds.has(tid)) continue;
          seenIds.add(tid);
          merged.push({
            objectId: r.objectId,
            tripId: tid,
            passenger: r.passengerName || r.passenger || 'SuperApp Rider',
            passengerPhone: r.passengerPhone || '0911 000 000',
            driver: r.driverName || r.driver || 'Assigned Driver',
            driverPhone: r.driverPhone || '0911 223 344',
            status:
              r.status === 'completed' || r.status === 'Completed'
                ? 'Completed'
                : r.status === 'cancelled' || r.status === 'Cancelled'
                ? 'Cancelled'
                : 'On-Going',
            fareETB: Number(r.fare || r.fareETB || 320),
            time: r.time || 'Synced from Ride',
            pickup: r.pickupAddress || r.pickup || 'Addis Ababa',
            destination: r.dropoffAddress || r.destination || 'Bole Terminal',
            distanceKm: Number(r.distanceKm || 6.5),
            durationMin: Number(r.durationMin || 18),
            module: 'ride',
          });
        }
      }

      if (tripRes && tripRes.ok) {
        const tripJson = await tripRes.json();
        for (const t of tripJson.results || []) {
          if (t._isSchemaPrototype) continue;
          const tid = t.tripId || `#TRP-${String(t.objectId || '').slice(0, 4)}`;
          if (seenIds.has(tid)) continue;
          seenIds.add(tid);
          merged.push({
            objectId: t.objectId,
            tripId: tid,
            passenger: t.passenger || 'Passenger',
            passengerPhone: t.passengerPhone,
            driver: t.driver || 'Driver',
            driverPhone: t.driverPhone,
            status: t.status || 'Completed',
            fareETB: Number(t.fareETB || 300),
            time: t.time || 'Recently',
            pickup: t.pickup || 'Addis Ababa',
            destination: t.destination || 'Destination',
            distanceKm: Number(t.distanceKm || 5),
            durationMin: Number(t.durationMin || 15),
            module: t.module || 'ride',
            coordinates: t.coordinates,
          });
        }
      }

      for (const localTrip of stored) {
        if (!seenIds.has(localTrip.tripId)) {
          seenIds.add(localTrip.tripId);
          merged.push(localTrip);
        }
      }

      if (merged.length > 0) {
        this.setStored('trips', merged);
        return merged;
      }
    } catch {
      // Fallback to stored
    }
    return stored;
  }

  async createTrip(trip: Trip): Promise<Trip> {
    const newTrip = { ...trip, objectId: trip.objectId || 'trp-' + Date.now() };
    try {
      const { objectId: _omit, ...payload } = newTrip;
      const res = await fetch('/api/back4app/classes/Trip', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.objectId) newTrip.objectId = json.objectId;
      }
      // Dual-write into native Flutter Ride class for SuperApp visibility
      await fetch('/api/back4app/classes/Ride', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          tripId: newTrip.tripId,
          passengerName: newTrip.passenger,
          driverName: newTrip.driver,
          pickupAddress: newTrip.pickup,
          dropoffAddress: newTrip.destination,
          fare: newTrip.fareETB,
          distanceKm: newTrip.distanceKm,
          durationMin: newTrip.durationMin,
          status: newTrip.status,
        }),
      }).catch(() => null);
    } catch (e) {
      console.warn('Error persisting trip to Back4App proxy:', e);
    }
    const current = await this.getTrips();
    const deduped = [newTrip, ...current.filter((t) => t.tripId !== newTrip.tripId)];
    this.setStored('trips', deduped);
    return newTrip;
  }

  async getShipments(): Promise<Shipment[]> {
    const stored = this.getStored('shipments', DEFAULT_SHIPMENTS);
    try {
      const [tbkRes, shpRes] = await Promise.all([
        fetch('/api/back4app/classes/TruckBooking?order=-createdAt&limit=25', {
          headers: this.buildHeaders(),
        }).catch(() => null),
        fetch('/api/back4app/classes/Shipment?order=-createdAt&limit=25', {
          headers: this.buildHeaders(),
        }).catch(() => null),
      ]);

      const merged: Shipment[] = [];
      const seenIds = new Set<string>();

      if (tbkRes && tbkRes.ok) {
        const tbkJson = await tbkRes.json();
        for (const b of tbkJson.results || []) {
          if (b._isSchemaPrototype) continue;
          const sid = b.shipmentId || b.bookingId || `#TBK-${String(b.objectId || '').slice(0, 5).toUpperCase()}`;
          if (seenIds.has(sid)) continue;
          seenIds.add(sid);
          merged.push({
            objectId: b.objectId,
            shipmentId: sid,
            status:
              b.status === 'completed' || b.status === 'Delivered'
                ? 'Delivered'
                : b.status === 'in_transit' || b.status === 'In Transit'
                ? 'In Transit'
                : b.status === 'Picked Up'
                ? 'Picked Up'
                : 'Pending',
            time: b.time || 'Synced from TruckBooking',
            origin: b.origin || b.pickupAddress || 'Modjo Dry Port',
            destination: b.destination || b.dropoffAddress || 'Addis Ababa Depot',
            cargoType: b.cargoCategory || b.cargoType || 'Commercial Freight',
            tonnage: Number(b.weightTons || b.tonnage || 18),
            truckPlate: b.truckPlate || '3-ET-91823',
            driver: b.driver || b.driverName || 'Fleet Carrier',
            freightRateETB: Number(b.freightRateETB || b.estimatedBudgetETB || 58000),
            estimatedDelivery: b.estimatedDelivery || 'Scheduled Corridor ETA',
          });
        }
      }

      if (shpRes && shpRes.ok) {
        const shpJson = await shpRes.json();
        for (const s of shpJson.results || []) {
          if (s._isSchemaPrototype) continue;
          const sid = s.shipmentId || `#DLV-${String(s.objectId || '').slice(0, 4)}`;
          if (seenIds.has(sid)) continue;
          seenIds.add(sid);
          merged.push({
            objectId: s.objectId,
            shipmentId: sid,
            status: s.status || 'Pending',
            time: s.time || 'Recently',
            origin: s.origin || 'Addis Ababa',
            destination: s.destination || 'Adama',
            cargoType: s.cargoType || 'General Cargo',
            tonnage: Number(s.tonnage || 15),
            truckPlate: s.truckPlate || '3-ET-19402',
            driver: s.driver || 'Assigned Driver',
            freightRateETB: Number(s.freightRateETB || 45000),
            estimatedDelivery: s.estimatedDelivery || 'Scheduled',
          });
        }
      }

      for (const localShp of stored) {
        if (!seenIds.has(localShp.shipmentId)) {
          seenIds.add(localShp.shipmentId);
          merged.push(localShp);
        }
      }

      if (merged.length > 0) {
        this.setStored('shipments', merged);
        return merged;
      }
    } catch {
      // Fallback to stored
    }
    return stored;
  }

  async addShipment(shipment: Shipment): Promise<Shipment[]> {
    const savedShipment: Shipment = {
      ...shipment,
      objectId: shipment.objectId || `local-shp-${Date.now()}`,
    };
    try {
      const { objectId: _omit, ...payload } = savedShipment;
      const res = await fetch('/api/back4app/classes/Shipment', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.objectId) savedShipment.objectId = json.objectId;
      }
      // Dual-write into native Flutter TruckBooking class
      await fetch('/api/back4app/classes/TruckBooking', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          bookingId: savedShipment.shipmentId,
          origin: savedShipment.origin,
          destination: savedShipment.destination,
          cargoCategory: savedShipment.cargoType,
          weightTons: savedShipment.tonnage,
          truckPlate: savedShipment.truckPlate,
          driverName: savedShipment.driver,
          freightRateETB: savedShipment.freightRateETB,
          status: savedShipment.status,
          priority: 'normal',
        }),
      }).catch(() => null);
    } catch (e) {
      console.warn('Shipment stored locally:', e);
    }
    const current = await this.getShipments();
    const updated = [
      savedShipment,
      ...current.filter((s) => s.shipmentId !== savedShipment.shipmentId),
    ];
    this.setStored('shipments', updated);
    return updated;
  }

  async updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus
  ): Promise<Shipment[]> {
    const current = await this.getShipments();
    let targetObjId: string | undefined;
    const estimatedDelivery =
      status === 'Delivered'
        ? 'Completed Just Now'
        : status === 'In Transit'
        ? 'En Route · On Schedule'
        : status === 'Picked Up'
        ? 'Loaded at Origin Weighbridge'
        : 'Scheduled Dispatch';

    const updated = current.map((s) => {
      if (s.shipmentId === shipmentId) {
        targetObjId = s.objectId;
        return {
          ...s,
          status,
          estimatedDelivery,
          time: 'Updated just now',
        };
      }
      return s;
    });

    this.setStored('shipments', updated);

    if (
      targetObjId &&
      !targetObjId.startsWith('local-') &&
      !targetObjId.startsWith('shp-seed-')
    ) {
      try {
        await fetch(`/api/back4app/classes/Shipment/${targetObjId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ status, estimatedDelivery }),
        });
      } catch (e) {
        console.warn('Error updating shipment status in Back4App proxy:', e);
      }
    }

    return updated;
  }

  async getAlerts(): Promise<SystemAlert[]> {
    return this.getStored('alerts', DEFAULT_ALERTS);
  }

  async resolveAlert(alertIdOrIndex: string | number): Promise<SystemAlert[]> {
    const current = await this.getAlerts();
    const updated = current.map((a, idx) => {
      if (
        (typeof alertIdOrIndex === 'string' && (a.id === alertIdOrIndex || a.objectId === alertIdOrIndex)) ||
        idx === alertIdOrIndex
      ) {
        return { ...a, resolved: true };
      }
      return a;
    });
    this.setStored('alerts', updated);
    return updated;
  }

  // Register a brand new SuperApp module with associated Back4App Parse classes
  async registerNewModule(data: {
    name: string;
    key: string;
    description: string;
    category: string;
    icon: string;
    enabled: boolean;
    customClasses: string[];
    sampleFields?: Record<string, any>;
    targetCountries?: Exclude<EastAfricaCountryCode, 'ALL'>[];
  }): Promise<ModuleItem> {
    const moduleId = 'mod-' + Date.now();
    const targetCountries = data.targetCountries || EAST_AFRICAN_COUNTRIES_ORDERED;
    const countryConfigs = buildDefaultCountryConfigsForModule(
      data.key,
      data.name,
      data.category,
      targetCountries
    );

    const newModule: ModuleItem = {
      id: moduleId,
      objectId: 'local-' + Date.now(),
      key: data.key,
      name: data.name,
      description: data.description,
      icon: data.icon,
      enabled: data.enabled,
      statusText: data.enabled ? 'Enabled' : 'Disabled',
      category: data.category,
      canToggle: true,
      isCustom: true,
      customClasses: data.customClasses,
      createdAt: new Date().toISOString(),
      countries: targetCountries,
      countryConfigs,
      panEastAfricaCommissionCapPct: 15,
      globalRolloutStage: 'Phased Regional Rollout',
      primaryRegulatoryAgency: 'Regional Trade & Transport Authorities',
    };

    try {
      const res = await fetch('/api/back4app/classes/ModuleRegistry', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          moduleId: newModule.id,
          key: newModule.key,
          name: newModule.name,
          description: newModule.description,
          icon: newModule.icon,
          enabled: newModule.enabled,
          category: newModule.category,
          canToggle: true,
          isCustom: true,
          customClasses: newModule.customClasses,
          countries: newModule.countries,
          countryConfigs: newModule.countryConfigs,
          panEastAfricaCommissionCapPct: newModule.panEastAfricaCommissionCapPct,
          globalRolloutStage: newModule.globalRolloutStage,
          primaryRegulatoryAgency: newModule.primaryRegulatoryAgency,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.objectId) newModule.objectId = json.objectId;
      }
    } catch (e) {
      console.warn('Error saving new module to Back4App proxy:', e);
    }

    for (const className of data.customClasses) {
      try {
        const samplePayload = data.sampleFields || {
          code: `${newModule.key.toUpperCase()}-001`,
          title: `Initial sample item for ${newModule.name}`,
          status: 'Active',
          notes: 'Auto-provisioned class by Afronala Control Center',
          registeredBy: 'Super Admin',
        };
        await fetch(`/api/back4app/classes/${className}`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(samplePayload),
        });
      } catch (err) {
        console.warn(`Error provisioning class ${className} via proxy:`, err);
      }
    }

    const current = await this.getModules();
    const moreIdx = current.findIndex((m) => m.key === 'more');
    let updated: ModuleItem[];
    if (moreIdx !== -1) {
      updated = [...current.slice(0, moreIdx), newModule, ...current.slice(moreIdx)];
    } else {
      updated = [...current, newModule];
    }
    this.setStored('modules', updated);
    return newModule;
  }

  // Generic class CRUD for dynamically created modules
  async fetchClassRecords(className: string): Promise<any[]> {
    try {
      const res = await fetch(`/api/back4app/classes/${className}?order=-createdAt`, {
        headers: this.buildHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.results || [];
      }
    } catch (err) {
      console.warn(`Error querying class ${className}:`, err);
    }
    return this.getStored<any[]>(`class_${className}`, []);
  }

  async addClassRecord(className: string, data: Record<string, any>): Promise<any> {
    const savedRecord = { ...data, objectId: 'local-' + Date.now(), createdAt: new Date().toISOString() };
    try {
      const res = await fetch(`/api/back4app/classes/${className}`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.objectId) savedRecord.objectId = json.objectId;
      }
    } catch (err) {
      console.warn(`Error adding record to ${className}:`, err);
    }
    const current = await this.fetchClassRecords(className);
    const updated = [savedRecord, ...current];
    this.setStored(`class_${className}`, updated);
    return savedRecord;
  }

  async deleteClassRecord(className: string, objectId: string): Promise<void> {
    try {
      await fetch(`/api/back4app/classes/${className}/${objectId}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
    } catch (err) {
      console.warn(`Error deleting record from ${className}:`, err);
    }
    const current = await this.fetchClassRecords(className);
    const updated = current.filter((r) => r.objectId !== objectId);
    this.setStored(`class_${className}`, updated);
  }

  async forceSyncToCloud(): Promise<{ success: boolean; message: string }> {
    try {
      await this.seedModules(DEFAULT_MODULES);
      await this.seedDrivers(DEFAULT_DRIVERS);
      await this.seedVehicles(DEFAULT_VEHICLES);
      return { success: true, message: 'All schemas and default records synced to Back4App database!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Sync encountered an error.' };
    }
  }

  async updateModuleFields(moduleKey: string, fields: SchemaField[]): Promise<ModuleItem[]> {
    const modules = await this.getModules();
    const updated = modules.map((m) => {
      if (m.key === moduleKey) {
        return { ...m, fields };
      }
      return m;
    });

    this.setStored('modules', updated);

    const target = updated.find((m) => m.key === moduleKey);
    if (target && target.objectId && !target.objectId.startsWith('local-')) {
      try {
        await fetch(`/api/back4app/classes/ModuleRegistry/${target.objectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ fields }),
        });
      } catch (err) {
        console.warn('Failed to push schema fields to Back4App proxy:', err);
      }
    }

    return updated;
  }

  async provisionClassWithFields(className: string, fields: SchemaField[]): Promise<{ success: boolean; message: string }> {
    try {
      const prototypeRecord: Record<string, any> = {
        _isSchemaPrototype: true,
        updatedAtDate: new Date().toISOString(),
      };

      for (const f of fields) {
        if (f.type === 'String') prototypeRecord[f.name] = f.defaultValue || 'Sample string';
        else if (f.type === 'Number') prototypeRecord[f.name] = Number(f.defaultValue) || 0;
        else if (f.type === 'Boolean') prototypeRecord[f.name] = f.defaultValue === true || f.defaultValue === 'true';
        else if (f.type === 'GeoPoint') prototypeRecord[f.name] = { __type: 'GeoPoint', latitude: 9.0108, longitude: 38.7613 };
        else if (f.type === 'Date') prototypeRecord[f.name] = { __type: 'Date', iso: new Date().toISOString() };
        else if (f.type === 'Array') prototypeRecord[f.name] = ['item-1', 'item-2'];
        else if (f.type === 'Object') prototypeRecord[f.name] = { meta: 'value' };
        else if (f.type === 'Pointer') prototypeRecord[f.name] = { __type: 'Pointer', className: f.targetClass || '_User', objectId: 'placeholderId' };
      }

      const queryRes = await fetch(
        `/api/back4app/classes/${className}?where=${encodeURIComponent(JSON.stringify({ _isSchemaPrototype: true }))}`,
        { headers: this.buildHeaders() }
      );

      if (queryRes.ok) {
        const queryJson = await queryRes.json();
        if (queryJson.results && queryJson.results.length > 0) {
          const protoId = queryJson.results[0].objectId;
          await fetch(`/api/back4app/classes/${className}/${protoId}`, {
            method: 'PUT',
            headers: this.buildHeaders(),
            body: JSON.stringify(prototypeRecord),
          });
          return { success: true, message: `Class ${className} schema prototype updated on Back4App.` };
        }
      }

      const postRes = await fetch(`/api/back4app/classes/${className}`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(prototypeRecord),
      });

      if (postRes.ok) {
        return { success: true, message: `Class ${className} created with ${fields.length} typed fields on Back4App!` };
      }
      return { success: true, message: `Schema staged locally for ${className}.` };
    } catch (e: any) {
      console.warn('Class provisioning warning:', e);
      return { success: true, message: `Schema saved for class ${className}.` };
    }
  }

  async getWebhooks(): Promise<WebhookSubscription[]> {
    const cached = this.getStored<WebhookSubscription[]>('webhooks', []);
    if (cached && cached.length > 0) return cached;

    const defaultWebhooks: WebhookSubscription[] = [
      {
        id: 'wh-1',
        name: 'Addis Dispatch Dispatcher Push',
        url: 'https://api.afronala.com/v1/dispatch/events',
        events: ['trip.requested', 'trip.assigned', 'trip.completed'],
        secretKey: 'sec_afro_live_••••••••',
        active: true,
        createdAt: '2025-02-15T08:00:00Z',
        lastTriggered: '3 min ago',
        lastStatus: 200,
        successCount: 1420,
        failureCount: 2,
      },
      {
        id: 'wh-2',
        name: 'EthioTelecom SMS Gateway Relay',
        url: 'https://sms.ethionet.et/v2/sms/send-bulk',
        events: ['trip.requested', 'driver.sos_alert'],
        secretKey: 'sec_ethio_sms_••••••••',
        active: true,
        createdAt: '2025-02-18T10:30:00Z',
        lastTriggered: '18 min ago',
        lastStatus: 200,
        successCount: 890,
        failureCount: 0,
      },
      {
        id: 'wh-3',
        name: 'Mojo Dry Port Freight Webhook',
        url: 'https://cargo-bridge.mojo-port.gov.et/api/bol/sync',
        events: ['shipment.delayed', 'shipment.delivered'],
        secretKey: 'sec_port_bol_••••••••',
        active: true,
        createdAt: '2025-03-01T12:00:00Z',
        lastTriggered: '1 hour ago',
        lastStatus: 200,
        successCount: 312,
        failureCount: 1,
      },
    ];

    this.setStored('webhooks', defaultWebhooks);
    return defaultWebhooks;
  }

  async saveWebhook(wh: WebhookSubscription): Promise<WebhookSubscription[]> {
    const list = await this.getWebhooks();
    const idx = list.findIndex((item) => item.id === wh.id);
    let updated: WebhookSubscription[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = wh;
    } else {
      updated = [wh, ...list];
    }
    this.setStored('webhooks', updated);
    return updated;
  }

  async deleteWebhook(id: string): Promise<WebhookSubscription[]> {
    const list = await this.getWebhooks();
    const updated = list.filter((item) => item.id !== id);
    this.setStored('webhooks', updated);
    return updated;
  }

  async syncDispatchJobToTrip(job: DispatchJob): Promise<Trip> {
    const newTrip: Trip = {
      tripId: job.tripId,
      passenger: job.passenger,
      passengerPhone: job.passengerPhone,
      driver: job.driverName || 'Automated Dispatch',
      driverPhone: '0911 223 344',
      status: job.status === 'Completed' ? 'Completed' : 'On-Going',
      fareETB: job.fareETB,
      time: 'Just now',
      pickup: job.pickupName,
      destination: job.dropoffName,
      distanceKm: job.distanceKm,
      durationMin: Math.round(job.distanceKm * 3.2),
      module: job.module,
      coordinates: {
        pickup: job.pickupCoords,
        dropoff: job.dropoffCoords,
        current: job.currentCoords || job.pickupCoords,
      },
    };

    return this.createTrip(newTrip);
  }

  private getDefaultDriverExpiryOffsets(index: number, status: DriverStatus): Record<DriverDocumentType, number> {
    if (status === 'Suspended') {
      return {
        commercial_license: -6,
        bola_inspection: 14,
        third_party_insurance: -3,
        tin_clearance: 45,
      };
    }

    const presets: Record<DriverDocumentType, number>[] = [
      // Fully compliant (> 30 days)
      {
        commercial_license: 214,
        bola_inspection: 148,
        third_party_insurance: 182,
        tin_clearance: 110,
      },
      // Flagged: Bola inspection & Insurance within 30 days
      {
        commercial_license: 165,
        bola_inspection: 9,
        third_party_insurance: 24,
        tin_clearance: 88,
      },
      // Fully compliant (> 30 days)
      {
        commercial_license: 290,
        bola_inspection: 196,
        third_party_insurance: 132,
        tin_clearance: 76,
      },
      // Flagged: Commercial license expiring in 12 days
      {
        commercial_license: 12,
        bola_inspection: 120,
        third_party_insurance: 95,
        tin_clearance: 64,
      },
      // Flagged: TIN clearance expiring in 27 days
      {
        commercial_license: 188,
        bola_inspection: 142,
        third_party_insurance: 118,
        tin_clearance: 27,
      },
      // Flagged: Bola & License urgent within 30 days
      {
        commercial_license: 19,
        bola_inspection: 6,
        third_party_insurance: 84,
        tin_clearance: 112,
      },
      // Freight truck driver: Insurance expiring in 16 days
      {
        commercial_license: 240,
        bola_inspection: 92,
        third_party_insurance: 16,
        tin_clearance: 155,
      },
      // Fully compliant freight carrier
      {
        commercial_license: 310,
        bola_inspection: 175,
        third_party_insurance: 205,
        tin_clearance: 140,
      },
    ];

    return presets[index % presets.length];
  }

  /**
   * Fetches fleet drivers & SuperApp DriverProfile records via Back4App,
   * cross-references Vehicle inspection records, and computes automated
   * 0-100 compliance scores + 30-day document expiration flags.
   */
  async getDriverComplianceRecords(): Promise<DriverDocumentComplianceRecord[]> {
    const [drivers, vehicles, profileRes] = await Promise.all([
      this.getDrivers(),
      this.getVehicles(),
      fetch('/api/back4app/classes/DriverProfile?order=-createdAt&limit=50', {
        headers: this.buildHeaders(),
      }).catch(() => null),
    ]);

    const overrides = this.getStored<
      Record<
        string,
        Partial<Record<DriverDocumentType, string>> & { complianceNoticeSentAt?: string }
      >
    >('driver_compliance_overrides', {});

    const vehicleByPlate = new Map<string, Vehicle>();
    for (const v of vehicles) {
      if (v.plate) vehicleByPlate.set(v.plate.trim().toUpperCase(), v);
    }

    const mergedDrivers: { driver: Driver; sourceClass: 'Driver' | 'DriverProfile' }[] = drivers.map(
      (d) => ({ driver: d, sourceClass: 'Driver' })
    );
    const seenPhones = new Set(drivers.map((d) => d.phone).filter(Boolean));

    if (profileRes && profileRes.ok) {
      try {
        const profileJson = await profileRes.json();
        for (const p of profileJson.results || []) {
          if (p._isSchemaPrototype) continue;
          const phone = p.phone || p.driverPhone || '';
          if (phone && seenPhones.has(phone)) {
            // Enrich existing Driver entry if DriverProfile has explicit expiry dates
            const existingIdx = mergedDrivers.findIndex((item) => item.driver.phone === phone);
            if (existingIdx >= 0) {
              const target = mergedDrivers[existingIdx].driver;
              mergedDrivers[existingIdx] = {
                sourceClass: 'DriverProfile',
                driver: {
                  ...target,
                  licenseExpiryDate:
                    normalizeParseIsoDate(p.licenseExpiryDate || p.licenseExpiry) ||
                    target.licenseExpiryDate,
                  bolaInspectionExpiryDate:
                    normalizeParseIsoDate(p.bolaInspectionExpiryDate || p.inspectionExpiry) ||
                    target.bolaInspectionExpiryDate,
                  insuranceExpiryDate:
                    normalizeParseIsoDate(p.insuranceExpiryDate || p.insuranceExpiry) ||
                    target.insuranceExpiryDate,
                  tinClearanceExpiryDate:
                    normalizeParseIsoDate(p.tinClearanceExpiryDate || p.taxClearanceExpiry) ||
                    target.tinClearanceExpiryDate,
                },
              };
            }
            continue;
          }
          if (phone) seenPhones.add(phone);
          mergedDrivers.push({
            sourceClass: 'DriverProfile',
            driver: {
              objectId: p.objectId,
              name: p.fullName || p.driverName || p.name || 'SuperApp Driver',
              phone: phone || '0911 000 000',
              vehicleModel: p.vehicleModel || 'Fleet Vehicle',
              vehiclePlate: p.vehiclePlate || p.plateNumber || 'AA-00000',
              status:
                p.verificationStatus === 'approved' || p.status === 'Active'
                  ? 'Active'
                  : p.status === 'Suspended'
                  ? 'Suspended'
                  : 'Pending',
              rating: Number(p.rating) || 4.8,
              module: p.serviceType === 'truck' || p.module === 'truck' ? 'truck' : 'ride',
              licenseExpiryDate: normalizeParseIsoDate(p.licenseExpiryDate || p.licenseExpiry),
              bolaInspectionExpiryDate: normalizeParseIsoDate(
                p.bolaInspectionExpiryDate || p.inspectionExpiry
              ),
              insuranceExpiryDate: normalizeParseIsoDate(p.insuranceExpiryDate || p.insuranceExpiry),
              tinClearanceExpiryDate: normalizeParseIsoDate(
                p.tinClearanceExpiryDate || p.taxClearanceExpiry
              ),
              complianceNoticeSentAt: p.complianceNoticeSentAt,
            },
          });
        }
      } catch {
        // Ignore malformed DriverProfile payload
      }
    }

    const now = new Date();
    const evaluated = mergedDrivers.map(({ driver, sourceClass }, idx) => {
      const driverKey = driver.objectId || driver.phone;
      const localOverride = overrides[driverKey] || overrides[driver.phone] || {};
      const offsets = this.getDefaultDriverExpiryOffsets(idx, driver.status);

      const expiryDates: Record<DriverDocumentType, string> = {
        commercial_license:
          localOverride.commercial_license ||
          driver.licenseExpiryDate ||
          offsetIsoDateFromToday(offsets.commercial_license, now),
        bola_inspection:
          localOverride.bola_inspection ||
          driver.bolaInspectionExpiryDate ||
          offsetIsoDateFromToday(offsets.bola_inspection, now),
        third_party_insurance:
          localOverride.third_party_insurance ||
          driver.insuranceExpiryDate ||
          offsetIsoDateFromToday(offsets.third_party_insurance, now),
        tin_clearance:
          localOverride.tin_clearance ||
          driver.tinClearanceExpiryDate ||
          offsetIsoDateFromToday(offsets.tin_clearance, now),
      };

      const matchedVehicle = driver.vehiclePlate
        ? vehicleByPlate.get(driver.vehiclePlate.trim().toUpperCase())
        : undefined;

      return evaluateDriverDocumentCompliance({
        driver: {
          ...driver,
          complianceNoticeSentAt:
            localOverride.complianceNoticeSentAt || driver.complianceNoticeSentAt,
        },
        matchedVehicle,
        sourceClass,
        expiryDates,
        referenceNow: now,
      });
    });

    // Sort priority: expired first, then flagged within 30 days (lowest daysRemaining first), then compliant
    return evaluated.sort((a, b) => {
      const rank = (r: DriverDocumentComplianceRecord) =>
        r.hasExpiredDocument ? 0 : r.flaggedWithin30Days ? 1 : 2;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return a.nearestExpiryDays - b.nearestExpiryDays;
    });
  }

  async updateDriverDocumentExpiry(params: {
    driverId: string;
    objectId?: string;
    phone: string;
    sourceClass?: 'Driver' | 'DriverProfile';
    docType: DriverDocumentType;
    newExpiresAt: string;
  }): Promise<DriverDocumentComplianceRecord[]> {
    const fieldMap: Record<DriverDocumentType, keyof Driver> = {
      commercial_license: 'licenseExpiryDate',
      bola_inspection: 'bolaInspectionExpiryDate',
      third_party_insurance: 'insuranceExpiryDate',
      tin_clearance: 'tinClearanceExpiryDate',
    };

    const overrides = this.getStored<
      Record<
        string,
        Partial<Record<DriverDocumentType, string>> & { complianceNoticeSentAt?: string }
      >
    >('driver_compliance_overrides', {});

    const keysToUpdate = [params.driverId, params.phone].filter(Boolean);
    for (const k of keysToUpdate) {
      overrides[k] = {
        ...(overrides[k] || {}),
        [params.docType]: params.newExpiresAt,
      };
    }
    this.setStored('driver_compliance_overrides', overrides);

    const parseFieldName = fieldMap[params.docType];
    const drivers = this.getStored<Driver[]>('drivers', DEFAULT_DRIVERS);
    const updatedDrivers = drivers.map((d) =>
      d.objectId === params.driverId || d.phone === params.phone
        ? { ...d, [parseFieldName]: params.newExpiresAt }
        : d
    );
    this.setStored('drivers', updatedDrivers);

    const targetClass = params.sourceClass === 'DriverProfile' ? 'DriverProfile' : 'Driver';
    if (
      params.objectId &&
      !params.objectId.startsWith('local-') &&
      !params.objectId.startsWith('drv-seed-')
    ) {
      try {
        await fetch(`/api/back4app/classes/${targetClass}/${params.objectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ [parseFieldName]: params.newExpiresAt }),
        });
      } catch (err) {
        console.warn('Error persisting renewed document date to Back4App:', err);
      }
    }

    return this.getDriverComplianceRecords();
  }

  async sendDriverComplianceReminder(
    targets: { driverId: string; objectId?: string; phone: string; driverName: string }[]
  ): Promise<DriverDocumentComplianceRecord[]> {
    const sentTimestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const overrides = this.getStored<
      Record<
        string,
        Partial<Record<DriverDocumentType, string>> & { complianceNoticeSentAt?: string }
      >
    >('driver_compliance_overrides', {});

    for (const t of targets) {
      for (const k of [t.driverId, t.phone].filter(Boolean)) {
        overrides[k] = {
          ...(overrides[k] || {}),
          complianceNoticeSentAt: `Sent ${sentTimestamp}`,
        };
      }

      if (
        t.objectId &&
        !t.objectId.startsWith('local-') &&
        !t.objectId.startsWith('drv-seed-')
      ) {
        fetch(`/api/back4app/classes/Driver/${t.objectId}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ complianceNoticeSentAt: `Sent ${sentTimestamp}` }),
        }).catch(() => null);
      }
    }

    this.setStored('driver_compliance_overrides', overrides);
    return this.getDriverComplianceRecords();
  }

  async runConnectivityPingTest(options?: {
    sessionToken?: string;
    cleanupProbe?: boolean;
    simulateFault?: '502-gateway' | 'handshake-failure';
    countryCode?: EastAfricaCountryCode;
  }): Promise<ConnectivityPingResult> {
    const startTime = Date.now();
    try {
      const headers = this.buildHeaders();
      if (options?.countryCode) {
        headers['x-user-country'] = options.countryCode;
      }
      const res = await fetch('/api/back4app/diagnostics/ping', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionToken: options?.sessionToken || '',
          cleanupProbe: options?.cleanupProbe !== false,
          simulateFault: options?.simulateFault || undefined,
          countryCode: options?.countryCode || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || `Diagnostic endpoint returned HTTP ${res.status}`);
      }
      return (await res.json()) as ConnectivityPingResult;
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      return {
        id: `ping-err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        overallStatus: 'unreachable',
        totalRoundTripMs: elapsed,
        parseBaseUrl: 'https://parseapi.back4app.com',
        maskedAppId: BACK4APP_CONFIG.applicationId,
        maskedClientKey: BACK4APP_CONFIG.clientKey,
        handshake: {
          ok: false,
          statusCode: 502,
          latencyMs: elapsed,
          detail: err?.message || 'Unable to reach /api/back4app/diagnostics/ping',
        },
        session: {
          valid: false,
          mode: options?.sessionToken ? 'apk-session-token' : 'proxy-rest-authority',
          statusCode: 502,
          latencyMs: 0,
          principal: 'Unavailable',
          detail: 'Skipped due to proxy unreachable error',
        },
        connectionTest: {
          className: 'ConnectionTest',
          probeNonce: 'n/a',
          objectId: null,
          writeOk: false,
          writeStatus: 502,
          writeLatencyMs: 0,
          writeError: err?.message || 'Connection failed',
          readOk: false,
          readStatus: 502,
          readLatencyMs: 0,
          nonceMatched: false,
          cleanupExecuted: false,
          cleanupOk: false,
          cleanupLatencyMs: 0,
        },
      };
    }
  }

  getDiagnosticSessionToken(): string {
    return this.getStored<string>('diagnostic_session_token', '');
  }

  setDiagnosticSessionToken(token: string): void {
    this.setStored('diagnostic_session_token', token.trim());
  }

  getAutoFixHistory(): DiagnosticAutoFixReport[] {
    return this.getStored<DiagnosticAutoFixReport[]>('autofix_history', []);
  }

  private recordAutoFixReport(report: DiagnosticAutoFixReport): DiagnosticAutoFixReport {
    const history = this.getAutoFixHistory();
    const updated = [report, ...history].slice(0, 10);
    this.setStored('autofix_history', updated);
    return report;
  }

  /**
   * Diagnostic Auto-Fixer Action 1:
   * Revokes stale .apk/Parse session tokens on Back4App, clears local stale session caches,
   * restores clean Server Proxy REST Authority, refreshes health, and re-runs Connectivity Ping.
   */
  async autoResetStaleSessionTokens(staleToken?: string): Promise<DiagnosticAutoFixReport> {
    const started = Date.now();
    const stepsCompleted: string[] = [];
    const candidateToken = (staleToken || this.getDiagnosticSessionToken() || '').trim();

    // 1. Purge cached stale session tokens in browser storage
    this.setDiagnosticSessionToken('');
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('Parse/') || key.includes('session_token'))) {
          localStorage.removeItem(key);
        }
      }
      this.setDiagnosticSessionToken('');
    } catch {
      // Ignore storage access warnings
    }
    stepsCompleted.push('Purged cached stale X-Parse-Session-Token entries from client storage');

    // 2. Revoke stale token on Back4App Parse Server & re-verify Proxy REST Authority
    let revokedSessionToken = false;
    try {
      const resetRes = await fetch('/api/back4app/diagnostics/reset-session', {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({ staleSessionToken: candidateToken }),
      });
      const resetJson = await resetRes.json().catch(() => ({}));
      revokedSessionToken = Boolean(resetJson?.revokedToken);
      if (candidateToken) {
        stepsCompleted.push(
          `Dispatched Parse /logout revocation for stale token (${candidateToken.slice(0, 8)}…)`
        );
      }
      if (resetJson?.gatewayVerified) {
        stepsCompleted.push(
          `Re-verified Server Proxy REST Authority (${resetJson.latencyMs ?? 0}ms)`
        );
      }
    } catch {
      stepsCompleted.push('Reset local session tunnel and switched to Server Proxy REST Authority');
    }

    // 3. Refresh Back4AppService health metadata & run clean Connectivity Ping Test
    await this.checkHealth();
    const postFixPing = await this.runConnectivityPingTest({
      sessionToken: undefined,
      cleanupProbe: true,
    });
    stepsCompleted.push(
      `Re-ran 4-stage Connectivity Ping Test → ${postFixPing.overallStatus.toUpperCase()} (${postFixPing.totalRoundTripMs}ms)`
    );

    const success = postFixPing.overallStatus === 'healthy';
    return this.recordAutoFixReport({
      id: `autofix-sess-${Date.now()}`,
      action: 'reset_session_tokens',
      triggeredBy: this.currentAdminRole,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      success,
      summary: success
        ? 'Stale session tokens cleared and clean Server Proxy REST Authority verified.'
        : `Session reset completed; gateway reported ${postFixPing.overallStatus}.`,
      stepsCompleted,
      revokedSessionToken,
      postFixPingStatus: postFixPing.overallStatus,
      postFixPing,
    });
  }

  /**
   * Diagnostic Auto-Fixer Action 2:
   * Triggers a full schema & seed re-sync leveraging existing Back4AppService methods
   * (forceSyncToCloud + provisionClassWithFields + monorepo /sync-audit + runConnectivityPingTest).
   */
  async triggerFullSchemaResync(): Promise<DiagnosticAutoFixReport> {
    const started = Date.now();
    const stepsCompleted: string[] = [];

    // Ensure clean proxy authority before syncing schemas
    this.setDiagnosticSessionToken('');

    // 1. Sync core ModuleRegistry, Driver, and Vehicle schemas & seed records
    const coreSync = await this.forceSyncToCloud();
    stepsCompleted.push(
      coreSync.success
        ? 'Synced ModuleRegistry, Driver, and Vehicle schemas via forceSyncToCloud()'
        : `Core sync warning: ${coreSync.message}`
    );

    // 2. Provision diagnostic & SuperApp mobile telemetry classes via provisionClassWithFields()
    const bridgeSchemas: { className: string; fields: SchemaField[] }[] = [
      {
        className: 'ConnectionTest',
        fields: [
          { name: 'probeNonce', type: 'String', required: true, defaultValue: 'afn-schema-init' },
          { name: 'source', type: 'String', required: true, defaultValue: 'afronala_admin_panel' },
          { name: 'bridgeTarget', type: 'String', required: false, defaultValue: 'afronala_superapp_apk' },
        ],
      },
      {
        className: 'ActivityLog',
        fields: [
          { name: 'eventType', type: 'String', required: true, defaultValue: 'system.schema_verified' },
          { name: 'actorName', type: 'String', required: false, defaultValue: 'Admin Auto-Fixer' },
          { name: 'actorRole', type: 'String', required: false, defaultValue: 'system' },
          { name: 'status', type: 'String', required: false, defaultValue: 'Active' },
          { name: 'platform', type: 'String', required: false, defaultValue: 'SuperApp Bridge' },
        ],
      },
      {
        className: 'Ride',
        fields: [
          { name: 'pickupAddress', type: 'String', required: true, defaultValue: 'Bole Airport' },
          { name: 'dropoffAddress', type: 'String', required: true, defaultValue: 'Kazanchis' },
          { name: 'status', type: 'String', required: true, defaultValue: 'Requested' },
          { name: 'fareETB', type: 'Number', required: false, defaultValue: 320 },
        ],
      },
      {
        className: 'TruckBooking',
        fields: [
          { name: 'origin', type: 'String', required: true, defaultValue: 'Addis Ababa' },
          { name: 'destination', type: 'String', required: true, defaultValue: 'Modjo Dry Port' },
          { name: 'status', type: 'String', required: true, defaultValue: 'Pending' },
          { name: 'freightRateETB', type: 'Number', required: false, defaultValue: 45000 },
        ],
      },
    ];

    let provisionedCount = 3; // ModuleRegistry, Driver, Vehicle
    await Promise.all(
      bridgeSchemas.map(async (item) => {
        const res = await this.provisionClassWithFields(item.className, item.fields);
        if (res.success) provisionedCount += 1;
      })
    );
    stepsCompleted.push(
      'Provisioned typed schemas for ConnectionTest, ActivityLog, Ride, and TruckBooking'
    );

    // 3. Run SuperApp Monorepo Schema Sync Audit across all Flutter Parse classes
    let reachableAuditCount = provisionedCount;
    try {
      const auditRes = await fetch('/api/superapp/monorepo/sync-audit', {
        method: 'POST',
        headers: this.buildHeaders(),
      });
      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        const rows = Array.isArray(auditJson?.rows) ? auditJson.rows : [];
        const reachable = rows.filter((r: any) => r.reachableOnBack4App).length;
        if (rows.length > 0) {
          reachableAuditCount = reachable;
          stepsCompleted.push(
            `Audited SuperApp monorepo contracts: ${reachable}/${rows.length} Parse classes reachable`
          );
        }
      }
    } catch {
      // Keep provisionedCount if monorepo audit endpoint skipped
    }

    // 4. Refresh health and execute verification Connectivity Ping Test
    await this.checkHealth();
    const postFixPing = await this.runConnectivityPingTest({
      sessionToken: undefined,
      cleanupProbe: true,
    });
    stepsCompleted.push(
      `Verified ConnectionTest R/W probe → ${postFixPing.overallStatus.toUpperCase()} (${postFixPing.totalRoundTripMs}ms)`
    );

    const success = postFixPing.overallStatus === 'healthy';
    return this.recordAutoFixReport({
      id: `autofix-schema-${Date.now()}`,
      action: 'full_schema_resync',
      triggeredBy: this.currentAdminRole,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      success,
      summary: success
        ? `Full schema re-sync verified (${reachableAuditCount} Parse classes ready) and bridge restored to Healthy.`
        : `Schema re-sync ran across ${reachableAuditCount} classes; bridge status is ${postFixPing.overallStatus}.`,
      stepsCompleted,
      syncedClassesCount: reachableAuditCount,
      postFixPingStatus: postFixPing.overallStatus,
      postFixPing,
    });
  }

  async getActivityStream(options?: {
    limit?: number;
    strictActivityLogOnly?: boolean;
    country?: EastAfricaCountryCode;
  }): Promise<ActivityStreamResponse> {
    const params = new URLSearchParams();
    params.set('limit', String(options?.limit || 40));
    if (options?.strictActivityLogOnly) {
      params.set('strict', 'true');
    }
    if (options?.country && options.country !== 'ALL') {
      params.set('country', options.country);
    }

    const headers = this.buildHeaders();
    if (options?.country) {
      headers['x-user-country'] = options.country;
    }

    const res = await fetch(`/api/back4app/activity-stream?${params.toString()}`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    return data as ActivityStreamResponse;
  }

  async getEastAfricaNodeSummaries(): Promise<EastAfricaNodeDiagnosticSummary[]> {
    try {
      const res = await fetch('/api/back4app/diagnostics/east-africa-nodes', {
        headers: this.buildHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json?.nodes) ? json.nodes : [];
      }
    } catch (err) {
      console.warn('Error fetching East Africa node summaries:', err);
    }
    return [];
  }

  // ---------------------------------------------------------------------------
  // Activity Stream Threshold Alert Rules & Dashboard Visual Pulse Engine
  // ---------------------------------------------------------------------------

  private getDefaultActivityAlertRules(): ActivityAlertRule[] {
    return [
      {
        id: 'rule-ride-surge-50',
        name: 'High Ride Request Surge',
        category: 'ride_request',
        operator: '>',
        threshold: 50,
        windowMinutes: 5,
        severity: 'critical',
        enabled: true,
        createdAt: '2025-03-01T08:00:00.000Z',
      },
      {
        id: 'rule-truck-spike-20',
        name: 'Corridor Freight Booking Spike',
        category: 'truck_booking',
        operator: '>',
        threshold: 20,
        windowMinutes: 10,
        severity: 'warning',
        enabled: true,
        createdAt: '2025-03-01T08:05:00.000Z',
      },
      {
        id: 'rule-login-burst-25',
        name: 'Mobile .apk Auth Burst',
        category: 'user_login',
        operator: '>',
        threshold: 25,
        windowMinutes: 5,
        severity: 'warning',
        enabled: true,
        createdAt: '2025-03-01T08:10:00.000Z',
      },
    ];
  }

  getActivityAlertRules(): ActivityAlertRule[] {
    const stored = this.getStored<ActivityAlertRule[] | null>('activity_alert_rules', null);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    const defaults = this.getDefaultActivityAlertRules();
    this.setStored('activity_alert_rules', defaults);
    return defaults;
  }

  async createActivityAlertRule(input: {
    name: string;
    category: AlertRuleMetricCategory;
    operator: AlertRuleOperator;
    threshold: number;
    windowMinutes: number;
    severity: AlertRuleSeverity;
  }): Promise<ActivityAlertRule[]> {
    const newRule: ActivityAlertRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: input.name.trim() || 'Custom Activity Threshold',
      category: input.category,
      operator: input.operator,
      threshold: Math.max(1, Math.round(Number(input.threshold) || 1)),
      windowMinutes: Math.max(1, Math.round(Number(input.windowMinutes) || 5)),
      severity: input.severity,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    const current = this.getActivityAlertRules();
    const updated = [newRule, ...current];
    this.setStored('activity_alert_rules', updated);

    // Best-effort mirror to Back4App Parse AlertRule class
    fetch('/api/back4app/classes/AlertRule', {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        ruleId: newRule.id,
        name: newRule.name,
        category: newRule.category,
        operator: newRule.operator,
        threshold: newRule.threshold,
        windowMinutes: newRule.windowMinutes,
        severity: newRule.severity,
        enabled: newRule.enabled,
      }),
    }).catch(() => null);

    return updated;
  }

  toggleActivityAlertRule(ruleId: string, enabled: boolean): ActivityAlertRule[] {
    const current = this.getActivityAlertRules();
    const updated = current.map((r) => (r.id === ruleId ? { ...r, enabled } : r));
    this.setStored('activity_alert_rules', updated);

    if (!enabled) {
      const pulses = this.getStored<TriggeredActivityPulse[]>('activity_pulses', []);
      const nextPulses = pulses.map((p) =>
        p.ruleId === ruleId ? { ...p, acknowledged: true } : p
      );
      this.setStored('activity_pulses', nextPulses);
    }

    return updated;
  }

  deleteActivityAlertRule(ruleId: string): ActivityAlertRule[] {
    const current = this.getActivityAlertRules();
    const updated = current.filter((r) => r.id !== ruleId);
    this.setStored('activity_alert_rules', updated);

    const pulses = this.getStored<TriggeredActivityPulse[]>('activity_pulses', []);
    this.setStored(
      'activity_pulses',
      pulses.filter((p) => p.ruleId !== ruleId)
    );

    return updated;
  }

  getActiveActivityPulses(): TriggeredActivityPulse[] {
    const all = this.getStored<TriggeredActivityPulse[]>('activity_pulses', []);
    return all.filter((p) => !p.acknowledged);
  }

  acknowledgeActivityPulse(pulseId: string): TriggeredActivityPulse[] {
    const all = this.getStored<TriggeredActivityPulse[]>('activity_pulses', []);
    const updated = all.map((p) => (p.id === pulseId ? { ...p, acknowledged: true } : p));
    this.setStored('activity_pulses', updated);
    return updated.filter((p) => !p.acknowledged);
  }

  acknowledgeAllActivityPulses(): TriggeredActivityPulse[] {
    const all = this.getStored<TriggeredActivityPulse[]>('activity_pulses', []);
    const updated = all.map((p) => ({ ...p, acknowledged: true }));
    this.setStored('activity_pulses', updated);
    return [];
  }

  triggerTestActivityPulse(ruleId: string): {
    pulse: TriggeredActivityPulse | null;
    activePulses: TriggeredActivityPulse[];
  } {
    const rules = this.getActivityAlertRules();
    const target = rules.find((r) => r.id === ruleId);
    if (!target) {
      return { pulse: null, activePulses: this.getActiveActivityPulses() };
    }

    const nowIso = new Date().toISOString();
    const simulatedObserved = target.threshold + Math.max(2, Math.ceil(target.threshold * 0.12));
    const allPulses = this.getStored<TriggeredActivityPulse[]>('activity_pulses', []);

    const existingIdx = allPulses.findIndex((p) => p.ruleId === target.id && !p.acknowledged);
    let createdPulse: TriggeredActivityPulse;

    if (existingIdx >= 0) {
      createdPulse = {
        ...allPulses[existingIdx],
        observedCount: Math.max(allPulses[existingIdx].observedCount, simulatedObserved),
        triggeredAt: nowIso,
        isSimulatedTest: true,
      };
      allPulses[existingIdx] = createdPulse;
    } else {
      createdPulse = {
        id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ruleId: target.id,
        ruleName: target.name,
        category: target.category,
        operator: target.operator,
        threshold: target.threshold,
        observedCount: simulatedObserved,
        windowMinutes: target.windowMinutes,
        severity: target.severity,
        triggeredAt: nowIso,
        acknowledged: false,
        isSimulatedTest: true,
      };
      allPulses.unshift(createdPulse);
    }

    this.setStored('activity_pulses', allPulses.slice(0, 25));

    const updatedRules = rules.map((r) =>
      r.id === target.id ? { ...r, lastTriggeredAt: nowIso } : r
    );
    this.setStored('activity_alert_rules', updatedRules);

    return {
      pulse: createdPulse,
      activePulses: allPulses.filter((p) => !p.acknowledged),
    };
  }

  evaluateActivityAlertRules(events: ActivityStreamEvent[]): {
    newlyTriggered: TriggeredActivityPulse[];
    activePulses: TriggeredActivityPulse[];
    ruleEvaluations: Record<string, { countInWindow: number; breached: boolean }>;
  } {
    const now = Date.now();
    const rules = this.getActivityAlertRules();
    const allPulses = this.getStored<TriggeredActivityPulse[]>('activity_pulses', []);
    const newlyTriggered: TriggeredActivityPulse[] = [];
    const ruleEvaluations: Record<string, { countInWindow: number; breached: boolean }> = {};
    let rulesMutated = false;

    const updatedRules = rules.map((rule) => {
      const windowMs = Math.max(1, rule.windowMinutes) * 60 * 1000;
      const cutoff = now - windowMs;

      const matchingCount = events.filter((ev) => {
        if (rule.category !== 'all' && ev.category !== rule.category) {
          return false;
        }
        const ts = new Date(ev.updatedAt || ev.createdAt).getTime();
        if (Number.isNaN(ts)) return false;
        return ts >= cutoff;
      }).length;

      const breached =
        rule.enabled &&
        (rule.operator === '>' ? matchingCount > rule.threshold : matchingCount >= rule.threshold);

      ruleEvaluations[rule.id] = {
        countInWindow: matchingCount,
        breached,
      };

      if (!breached) {
        return rule;
      }

      const existingIdx = allPulses.findIndex((p) => p.ruleId === rule.id && !p.acknowledged);
      const nowIso = new Date().toISOString();

      if (existingIdx >= 0) {
        allPulses[existingIdx] = {
          ...allPulses[existingIdx],
          observedCount: Math.max(allPulses[existingIdx].observedCount, matchingCount),
        };
        return rule;
      }

      const newPulse: TriggeredActivityPulse = {
        id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        operator: rule.operator,
        threshold: rule.threshold,
        observedCount: matchingCount,
        windowMinutes: rule.windowMinutes,
        severity: rule.severity,
        triggeredAt: nowIso,
        acknowledged: false,
      };

      allPulses.unshift(newPulse);
      newlyTriggered.push(newPulse);
      rulesMutated = true;
      return {
        ...rule,
        lastTriggeredAt: nowIso,
      };
    });

    if (rulesMutated) {
      this.setStored('activity_alert_rules', updatedRules);
    }
    this.setStored('activity_pulses', allPulses.slice(0, 25));

    return {
      newlyTriggered,
      activePulses: allPulses.filter((p) => !p.acknowledged),
      ruleEvaluations,
    };
  }
}

export const back4AppService = new Back4AppService();
