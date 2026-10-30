import type {
  RegionalCountryPricingContext,
  SuperAppDriverInvitation,
  SuperAppEscrowRecord,
  SuperAppFeatureFlagItem,
  SuperAppFleetTruck,
  SuperAppFreightBid,
  SuperAppRuntimeConfig,
  SuperAppSurgeZone,
  SuperAppTruckBookingLoad,
  SuperAppVerificationItem,
} from '../src/types/index.ts';

const INITIAL_VERIFICATIONS: SuperAppVerificationItem[] = [
  // 🇪🇹 Ethiopia
  {
    id: 'VER-401',
    queue: 'document',
    applicantName: 'Bekele Tesfaye',
    applicantRole: 'driver',
    phone: '0911 556 677',
    serviceType: 'ride',
    documentOrVehicleLabel: 'Addis Ababa Grade-3 Commercial Driver License & TIN',
    identifierCode: 'AA-DL-884120',
    submittedAt: '14 min ago',
    status: 'pending',
    eligibilityScore: 92,
    missingChecks: [],
    notes: 'OCR matched Federal Transport Authority registry.',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    regulatorShort: 'FTA / AACTB',
    regulatorName: 'Federal Transport Authority & Addis Ababa City Transport Bureau',
    corridorName: 'Bole Medhanealem → Meskel Square Multi-Lane Junction',
  },
  {
    id: 'VER-402',
    queue: 'vehicle',
    applicantName: 'Abay Heavy Logistics PLC',
    applicantRole: 'vehicle_owner',
    phone: '0911 880 112',
    serviceType: 'truck',
    documentOrVehicleLabel: 'Sinotruk HOWO 28T — Annual Bola & Weighbridge Certificate',
    identifierCode: '3-ET-74910',
    submittedAt: '32 min ago',
    status: 'pending',
    eligibilityScore: 86,
    missingChecks: ['Verify rear axle reflective strip photo'],
    notes: 'Axle calibration verified at Modjo dry port weighbridge.',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    regulatorShort: 'FTA / AACTB',
    regulatorName: 'Federal Transport Authority & AACTB',
    corridorName: 'Addis Ababa → Modjo Dry Port → Djibouti Port Corridor',
  },
  {
    id: 'VER-403',
    queue: 'service_activation',
    applicantName: 'Yosef Alemu',
    applicantRole: 'driver',
    phone: '0911 889 900',
    serviceType: 'ride',
    documentOrVehicleLabel: 'Airport Priority & Corporate Ride Tier Activation',
    identifierCode: 'FF-99001',
    submittedAt: '1 hour ago',
    status: 'pending',
    eligibilityScore: 79,
    missingChecks: ['Bola inspection renewal due within 21 days'],
    countryCode: 'ET',
    countryName: 'Ethiopia',
    regulatorShort: 'FTA / AACTB',
    regulatorName: 'AACTB Commercial Transport Bureau',
    corridorName: 'Bole International Airport (ADD) Terminal & Cargo',
  },
  {
    id: 'VER-404',
    queue: 'eligibility',
    applicantName: 'Tsegaye Hailu',
    applicantRole: 'driver',
    phone: '0912 345 678',
    serviceType: 'truck',
    documentOrVehicleLabel: 'Cross-Corridor Bonded Freight Eligibility Audit',
    identifierCode: '3-ET-19402',
    submittedAt: '2 hours ago',
    status: 'approved',
    eligibilityScore: 98,
    missingChecks: [],
    notes: 'Cleared for Modjo & Kality bonded customs dispatch.',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    regulatorShort: 'FTA / AACTB',
    regulatorName: 'Ethiopian Customs Commission & FTA',
    corridorName: 'Addis Ababa → Modjo Dry Port → Djibouti Port Corridor',
  },
  {
    id: 'VER-405',
    queue: 'document',
    applicantName: 'Daniel Getachew',
    applicantRole: 'driver',
    phone: '0911 445 667',
    serviceType: 'ride',
    documentOrVehicleLabel: 'Third-Party Motor Insurance Policy Upload',
    identifierCode: 'DD-44556',
    submittedAt: '3 hours ago',
    status: 'rejected',
    eligibilityScore: 61,
    missingChecks: ['Policy endorsement page missing insurer stamp'],
    notes: 'Rejected pending stamped endorsement re-upload.',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    regulatorShort: 'FTA / AACTB',
    regulatorName: 'Federal Transport Authority',
    corridorName: 'Gotera Interchange → Kality Toll Gate Express Link',
  },

  // 🇰🇪 Kenya
  {
    id: 'VER-406',
    queue: 'document',
    applicantName: 'Brian Ochieng',
    applicantRole: 'driver',
    phone: '+254 712 345 678',
    serviceType: 'ride',
    documentOrVehicleLabel: 'NTSA PSV Badge & Good Conduct Certificate',
    identifierCode: 'KE-PSV-49102',
    submittedAt: '18 min ago',
    status: 'pending',
    eligibilityScore: 95,
    missingChecks: [],
    notes: 'National Police DCI biometric clearance confirmed.',
    countryCode: 'KE',
    countryName: 'Kenya',
    regulatorShort: 'NTSA',
    regulatorName: 'National Transport and Safety Authority',
    corridorName: 'Nairobi Expressway → JKIA Airport Terminal 1A',
  },
  {
    id: 'VER-407',
    queue: 'vehicle',
    applicantName: 'Rift Haulers Kenya Ltd',
    applicantRole: 'vehicle_owner',
    phone: '+254 722 889 001',
    serviceType: 'truck',
    documentOrVehicleLabel: 'Scania R500 32T — NTSA Speed Limiter & Axle Cert',
    identifierCode: 'KDA 782X',
    submittedAt: '45 min ago',
    status: 'pending',
    eligibilityScore: 89,
    missingChecks: ['Upload KeNHA electronic weighbridge ticket'],
    notes: 'Speed limiter telematics calibrated to 80 km/h limit.',
    countryCode: 'KE',
    countryName: 'Kenya',
    regulatorShort: 'NTSA / KeNHA',
    regulatorName: 'National Transport and Safety Authority & KeNHA',
    corridorName: 'Mombasa Port Container Terminal → Nairobi ICD SGR Depot',
  },
  {
    id: 'VER-408',
    queue: 'service_activation',
    applicantName: 'Faith Wanjiku',
    applicantRole: 'driver',
    phone: '+254 733 445 566',
    serviceType: 'ride',
    documentOrVehicleLabel: 'Safaricom Daraja M-PESA Auto-Disbursement Merchant Badge',
    identifierCode: 'MPESA-TILL-991',
    submittedAt: '2 hours ago',
    status: 'approved',
    eligibilityScore: 94,
    missingChecks: [],
    notes: 'KRA PIN and Daraja B2C API keys validated.',
    countryCode: 'KE',
    countryName: 'Kenya',
    regulatorShort: 'NTSA / CBK',
    regulatorName: 'Central Bank of Kenya & NTSA',
    corridorName: 'Westlands Commercial Hub → Upper Hill Financial Center',
  },

  // 🇺🇬 Uganda
  {
    id: 'VER-409',
    queue: 'document',
    applicantName: 'Joseph Mugisha',
    applicantRole: 'driver',
    phone: '+256 772 123 456',
    serviceType: 'ride',
    documentOrVehicleLabel: 'MoWT Uganda Class B Driving Permit & TIN',
    identifierCode: 'UG-DP-78411',
    submittedAt: '25 min ago',
    status: 'pending',
    eligibilityScore: 91,
    missingChecks: [],
    notes: 'Uganda Revenue Authority TIN e-tax cleared.',
    countryCode: 'UG',
    countryName: 'Uganda',
    regulatorShort: 'MoWT / URA',
    regulatorName: 'Ministry of Works and Transport & Uganda Revenue Authority',
    corridorName: 'Entebbe International Airport → Kampala Central CBD',
  },
  {
    id: 'VER-410',
    queue: 'vehicle',
    applicantName: 'Victoria Transit Ltd',
    applicantRole: 'vehicle_owner',
    phone: '+256 701 556 789',
    serviceType: 'truck',
    documentOrVehicleLabel: 'Isuzu Giga 24T — MoWT Inspection & Fitness Certificate',
    identifierCode: 'UBA 912K',
    submittedAt: '1 hour ago',
    status: 'pending',
    eligibilityScore: 84,
    missingChecks: ['Inspect fire extinguisher pressure valve expiry stamp'],
    countryCode: 'UG',
    countryName: 'Uganda',
    regulatorShort: 'MoWT',
    regulatorName: 'Ministry of Works and Transport Uganda',
    corridorName: 'Malaba OSBP Border → Kampala Namanve Industrial Park',
  },

  // 🇷🇼 Rwanda
  {
    id: 'VER-411',
    queue: 'document',
    applicantName: 'Jean-Paul Habimana',
    applicantRole: 'driver',
    phone: '+250 788 123 456',
    serviceType: 'ride',
    documentOrVehicleLabel: 'RURA Smart Metering Badge & Contrôle Technique',
    identifierCode: 'RW-RURA-2041',
    submittedAt: '40 min ago',
    status: 'pending',
    eligibilityScore: 96,
    missingChecks: [],
    notes: 'National Police Automated Inspection Certificate verified.',
    countryCode: 'RW',
    countryName: 'Rwanda',
    regulatorShort: 'RURA',
    regulatorName: 'Rwanda Utilities Regulatory Authority',
    corridorName: 'Kigali International Airport (KGL) → Downtown CBD Express',
  },
  {
    id: 'VER-412',
    queue: 'vehicle',
    applicantName: 'Akagera Logistics SARL',
    applicantRole: 'vehicle_owner',
    phone: '+250 788 998 877',
    serviceType: 'truck',
    documentOrVehicleLabel: 'Volvo FMX 30T — Police Contrôle & Axle Weighbridge',
    identifierCode: 'RAD 518B',
    submittedAt: '2 hours ago',
    status: 'approved',
    eligibilityScore: 99,
    missingChecks: [],
    notes: 'RRA electronic cargo tracking seal (ECTS) ready.',
    countryCode: 'RW',
    countryName: 'Rwanda',
    regulatorShort: 'RURA / RRA',
    regulatorName: 'RURA & Rwanda Revenue Authority',
    corridorName: 'Kigali Logistics Platform (KLP Masaka) → Rusumo OSBP Border',
  },

  // 🇹🇿 Tanzania
  {
    id: 'VER-413',
    queue: 'document',
    applicantName: 'Mwajuma Rashid',
    applicantRole: 'driver',
    phone: '+255 754 112 233',
    serviceType: 'ride',
    documentOrVehicleLabel: 'LATRA Commercial Driver License & Police Inspection',
    identifierCode: 'TZ-LATRA-6102',
    submittedAt: '35 min ago',
    status: 'pending',
    eligibilityScore: 88,
    missingChecks: ['Confirm TRA Tax Clearance Certificate for current fiscal year'],
    countryCode: 'TZ',
    countryName: 'Tanzania',
    regulatorShort: 'LATRA',
    regulatorName: 'Land Transport Regulatory Authority',
    corridorName: 'Julius Nyerere International Airport (DAR) → City Center',
  },
  {
    id: 'VER-414',
    queue: 'vehicle',
    applicantName: 'Kilimanjaro Freightlines Ltd',
    applicantRole: 'vehicle_owner',
    phone: '+255 784 667 890',
    serviceType: 'truck',
    documentOrVehicleLabel: 'Mercedes Actros 2640 — LATRA VTS Tracker Certificate',
    identifierCode: 'T 381 DFR',
    submittedAt: '3 hours ago',
    status: 'pending',
    eligibilityScore: 92,
    missingChecks: [],
    notes: 'Tanzania Port Authority (TPA) gate pass registered.',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    regulatorShort: 'LATRA / TPA',
    regulatorName: 'Land Transport Regulatory Authority & TPA',
    corridorName: 'Dar es Salaam Port Kurasini → Dodoma Central Corridor',
  },

  // 🇩🇯 Djibouti
  {
    id: 'VER-415',
    queue: 'document',
    applicantName: 'Amina Farah',
    applicantRole: 'driver',
    phone: '+253 77 12 34 56',
    serviceType: 'truck',
    documentOrVehicleLabel: 'MET / DPFZA Port Access Badge & Carte Rose',
    identifierCode: 'DJ-DPFZA-9104',
    submittedAt: '50 min ago',
    status: 'pending',
    eligibilityScore: 94,
    missingChecks: [],
    notes: 'Doraleh Container Terminal safety induction passed.',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    regulatorShort: 'DPFZA / MET',
    regulatorName: 'Ministère de l’Équipement et des Transports & DPFZA',
    corridorName: 'Doraleh Multipurpose Port (DMP) → Galafi Border Crossing Link',
  },

  // 🇸🇴 Somalia
  {
    id: 'VER-416',
    queue: 'document',
    applicantName: 'Hassan Jama',
    applicantRole: 'driver',
    phone: '+252 61 512 3456',
    serviceType: 'ride',
    documentOrVehicleLabel: 'MOTCA Commercial Driver Permit & Municipality Registration',
    identifierCode: 'SO-MOTCA-3381',
    submittedAt: '1 hour ago',
    status: 'pending',
    eligibilityScore: 87,
    missingChecks: ['Mogadishu Benadir Regional Administration clearance stamp'],
    countryCode: 'SO',
    countryName: 'Somalia',
    regulatorShort: 'MOTCA',
    regulatorName: 'Ministry of Transport and Civil Aviation',
    corridorName: 'Aden Adde International Airport → KM4 Commercial Junction',
  },

  // 🇸🇸 South Sudan
  {
    id: 'VER-417',
    queue: 'document',
    applicantName: 'Peter Deng',
    applicantRole: 'driver',
    phone: '+211 922 456 789',
    serviceType: 'truck',
    documentOrVehicleLabel: 'MoTR / NRA Interstate Cargo Concession & Customs Convoy Badge',
    identifierCode: 'SS-NRA-7712',
    submittedAt: '1 hour ago',
    status: 'pending',
    eligibilityScore: 90,
    missingChecks: [],
    notes: 'South Sudan National Revenue Authority single window clearance.',
    countryCode: 'SS',
    countryName: 'South Sudan',
    regulatorShort: 'MoTR / NRA',
    regulatorName: 'Ministry of Transport & National Revenue Authority',
    corridorName: 'Nimule Border Post → Juba Lifeline Highway Corridor',
  },
];

const INITIAL_FLEET_TRUCKS: SuperAppFleetTruck[] = [
  // 🇪🇹 Ethiopia
  {
    truckId: 'TRK-01',
    plate: '3-ET-48190',
    model: 'Mercedes-Benz Atego 1518',
    capacityTons: 15,
    serviceType: 'truck',
    ownerId: 'OWN-01',
    ownerName: 'Abay Heavy Logistics PLC',
    assignedDriverId: 'DRV-07',
    assignedDriverName: 'Tsegaye Hailu',
    assignedDriverPhone: '0912 345 678',
    status: 'active',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    homeDepot: 'Modjo Dry Port Logistics Depot',
  },
  {
    truckId: 'TRK-02',
    plate: '3-ET-91823',
    model: 'Volvo FH16 Globetrotter',
    capacityTons: 28,
    serviceType: 'truck',
    ownerId: 'OWN-02',
    ownerName: 'Awash Corridor Carriers SC',
    assignedDriverId: 'DRV-08',
    assignedDriverName: 'Dawit Alemayehu',
    assignedDriverPhone: '0913 876 543',
    status: 'active',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    homeDepot: 'Kality Freight Logistics Hub',
  },
  {
    truckId: 'TRK-03',
    plate: '3-ET-74910',
    model: 'Sinotruk HOWO A7 Heavy',
    capacityTons: 24,
    serviceType: 'truck',
    ownerId: 'OWN-01',
    ownerName: 'Abay Heavy Logistics PLC',
    assignedDriverId: null,
    assignedDriverName: null,
    assignedDriverPhone: null,
    status: 'idle',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    homeDepot: 'Addis Ababa Central Vehicle Depot',
  },
  {
    truckId: 'TRK-04',
    plate: '3-ET-60215',
    model: 'Isuzu FVR Refrigerated Box',
    capacityTons: 12,
    serviceType: 'truck',
    ownerId: 'OWN-03',
    ownerName: 'Rift Valley ColdChain PLC',
    assignedDriverId: 'DRV-12',
    assignedDriverName: 'Mulugeta Girma',
    assignedDriverPhone: '0911 604 321',
    status: 'active',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    homeDepot: 'Adama Agro-Logistics Park',
  },

  // 🇰🇪 Kenya
  {
    truckId: 'TRK-05',
    plate: 'KDA 782X',
    model: 'Scania R500 6x4 Heavy Hauler',
    capacityTons: 32,
    serviceType: 'truck',
    ownerId: 'OWN-04',
    ownerName: 'Rift Haulers Kenya Ltd',
    assignedDriverId: 'DRV-KE-01',
    assignedDriverName: 'Brian Ochieng',
    assignedDriverPhone: '+254 712 345 678',
    status: 'active',
    countryCode: 'KE',
    countryName: 'Kenya',
    homeDepot: 'Nairobi ICD Embakasi Depot',
  },
  {
    truckId: 'TRK-06',
    plate: 'KCY 419P',
    model: 'Mercedes-Benz Actros 3340',
    capacityTons: 28,
    serviceType: 'truck',
    ownerId: 'OWN-05',
    ownerName: 'Mombasa SGR Express Haulage',
    assignedDriverId: 'DRV-KE-02',
    assignedDriverName: 'Samuel Kamau',
    assignedDriverPhone: '+254 722 990 112',
    status: 'idle',
    countryCode: 'KE',
    countryName: 'Kenya',
    homeDepot: 'Mombasa Port Gate 18 Yard',
  },

  // 🇺🇬 Uganda
  {
    truckId: 'TRK-07',
    plate: 'UBA 912K',
    model: 'Isuzu Giga 24T Rigid Heavy',
    capacityTons: 24,
    serviceType: 'truck',
    ownerId: 'OWN-06',
    ownerName: 'Victoria Transit Ltd',
    assignedDriverId: 'DRV-UG-01',
    assignedDriverName: 'Joseph Mugisha',
    assignedDriverPhone: '+256 772 123 456',
    status: 'active',
    countryCode: 'UG',
    countryName: 'Uganda',
    homeDepot: 'Kampala Namanve Industrial Yard',
  },

  // 🇷🇼 Rwanda
  {
    truckId: 'TRK-08',
    plate: 'RAD 518B',
    model: 'Volvo FMX 420 30T Container',
    capacityTons: 30,
    serviceType: 'truck',
    ownerId: 'OWN-07',
    ownerName: 'Akagera Logistics SARL',
    assignedDriverId: 'DRV-RW-01',
    assignedDriverName: 'Jean-Paul Habimana',
    assignedDriverPhone: '+250 788 123 456',
    status: 'active',
    countryCode: 'RW',
    countryName: 'Rwanda',
    homeDepot: 'Kigali Logistics Platform (KLP Masaka)',
  },

  // 🇹🇿 Tanzania
  {
    truckId: 'TRK-09',
    plate: 'T 381 DFR',
    model: 'MAN TGS 33.400 28T Tipper',
    capacityTons: 28,
    serviceType: 'truck',
    ownerId: 'OWN-08',
    ownerName: 'Kilimanjaro Freightlines Ltd',
    assignedDriverId: 'DRV-TZ-01',
    assignedDriverName: 'Mwajuma Rashid',
    assignedDriverPhone: '+255 754 112 233',
    status: 'active',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    homeDepot: 'Dar es Salaam Port Terminal 2',
  },

  // 🇩🇯 Djibouti
  {
    truckId: 'TRK-10',
    plate: 'DJ 1482 A',
    model: 'Renault Trucks K440 Heavy',
    capacityTons: 34,
    serviceType: 'truck',
    ownerId: 'OWN-09',
    ownerName: 'Red Sea Cargo Logistics Djibouti',
    assignedDriverId: 'DRV-DJ-01',
    assignedDriverName: 'Amina Farah',
    assignedDriverPhone: '+253 77 12 34 56',
    status: 'active',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    homeDepot: 'Doraleh Multipurpose Port (DMP)',
  },

  // 🇸🇴 Somalia
  {
    truckId: 'TRK-11',
    plate: 'MOG 8812 B',
    model: 'Sinotruk HOWO 25T Cargo',
    capacityTons: 25,
    serviceType: 'truck',
    ownerId: 'OWN-10',
    ownerName: 'Horn of Africa Express Logistics',
    assignedDriverId: 'DRV-SO-01',
    assignedDriverName: 'Hassan Jama',
    assignedDriverPhone: '+252 61 512 3456',
    status: 'active',
    countryCode: 'SO',
    countryName: 'Somalia',
    homeDepot: 'Berbera Port Logistics Yard',
  },

  // 🇸🇸 South Sudan
  {
    truckId: 'TRK-12',
    plate: 'SSD 409 X',
    model: 'Mercedes-Benz Axor 2628 6x4',
    capacityTons: 22,
    serviceType: 'truck',
    ownerId: 'OWN-11',
    ownerName: 'Equatoria Lifeline Freight Juba',
    assignedDriverId: 'DRV-SS-01',
    assignedDriverName: 'Peter Deng',
    assignedDriverPhone: '+211 922 456 789',
    status: 'active',
    countryCode: 'SS',
    countryName: 'South Sudan',
    homeDepot: 'Juba Gumbo Inland Freight Depot',
  },
];

const INITIAL_LOADS: SuperAppTruckBookingLoad[] = [
  // 🇪🇹 Ethiopia
  {
    bookingId: 'TBK-8821',
    shipperName: 'Mojo Agro Industry PLC',
    origin: 'Modjo Dry Port Terminal',
    destination: 'Addis Ababa Kality Depot',
    cargoCategory: 'Export Coffee & Oilseeds',
    weightTons: 48,
    priority: 'urgent',
    priorityMultiplier: 1.25,
    requiredTrucks: 2,
    allocatedTrucks: 1,
    biddingWindowEndsInMin: 14,
    autoBidEnabled: true,
    estimatedBudgetETB: 128000,
    estimatedBudgetLocal: 128000,
    status: 'bidding_open',
    escrowId: 'ESC-5501',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    currency: 'ETB',
    corridorName: 'Addis Ababa → Modjo Dry Port → Djibouti Port Corridor',
  },
  {
    bookingId: 'TBK-8822',
    shipperName: 'Kality Steel Mills SC',
    origin: 'Kality Industrial Ring',
    destination: 'Adama Industrial Park',
    cargoCategory: 'Structural Steel Coils',
    weightTons: 26,
    priority: 'express',
    priorityMultiplier: 1.55,
    requiredTrucks: 1,
    allocatedTrucks: 0,
    biddingWindowEndsInMin: 9,
    autoBidEnabled: true,
    estimatedBudgetETB: 94500,
    estimatedBudgetLocal: 94500,
    status: 'bidding_open',
    escrowId: 'ESC-5502',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    currency: 'ETB',
    corridorName: 'Gotera Interchange → Kality Toll Gate Express Link',
  },
  {
    bookingId: 'TBK-8819',
    shipperName: 'Hawassa Textile Export SC',
    origin: 'Hawassa Industrial Park',
    destination: 'Bole Cargo Terminal',
    cargoCategory: 'Apparel & Cotton Bales',
    weightTons: 14,
    priority: 'normal',
    priorityMultiplier: 1.0,
    requiredTrucks: 1,
    allocatedTrucks: 1,
    biddingWindowEndsInMin: 0,
    autoBidEnabled: false,
    estimatedBudgetETB: 48000,
    estimatedBudgetLocal: 48000,
    status: 'in_transit',
    escrowId: 'ESC-5503',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    currency: 'ETB',
    corridorName: 'Hawassa Express → Addis Ababa Southern Tollway',
  },

  // 🇰🇪 Kenya
  {
    bookingId: 'TBK-KE-101',
    shipperName: 'Kenya Tea Development Agency (KTDA)',
    origin: 'Mombasa Port Container Terminal 2',
    destination: 'Nairobi ICD Inland Depot',
    cargoCategory: 'Bulk Export Tea & Horticultural Goods',
    weightTons: 32,
    priority: 'urgent',
    priorityMultiplier: 1.3,
    requiredTrucks: 1,
    allocatedTrucks: 0,
    biddingWindowEndsInMin: 22,
    autoBidEnabled: true,
    estimatedBudgetETB: 142000,
    estimatedBudgetLocal: 149500, // ~149,500 KES
    status: 'bidding_open',
    escrowId: 'ESC-KE-01',
    countryCode: 'KE',
    countryName: 'Kenya',
    currency: 'KES',
    corridorName: 'Mombasa Port Container Terminal → Nairobi ICD SGR Depot',
  },

  // 🇺🇬 Uganda
  {
    bookingId: 'TBK-UG-201',
    shipperName: 'Mukwano Industries Uganda',
    origin: 'Malaba OSBP Border Gate',
    destination: 'Kampala Namanve Industrial Park',
    cargoCategory: 'Refined Edible Oils & FMCG Packaged Goods',
    weightTons: 24,
    priority: 'normal',
    priorityMultiplier: 1.0,
    requiredTrucks: 1,
    allocatedTrucks: 0,
    biddingWindowEndsInMin: 35,
    autoBidEnabled: true,
    estimatedBudgetETB: 88000,
    estimatedBudgetLocal: 2660000, // ~2,660,000 UGX
    status: 'bidding_open',
    escrowId: 'ESC-UG-01',
    countryCode: 'UG',
    countryName: 'Uganda',
    currency: 'UGX',
    corridorName: 'Malaba OSBP Border → Kampala Namanve Industrial Park',
  },

  // 🇷🇼 Rwanda
  {
    bookingId: 'TBK-RW-301',
    shipperName: 'Rwanda Mountain Tea SARL',
    origin: 'Kigali Logistics Platform (KLP Masaka)',
    destination: 'Rusumo OSBP Border Post',
    cargoCategory: 'Highland Specialty Tea & Organic Coffee',
    weightTons: 28,
    priority: 'express',
    priorityMultiplier: 1.4,
    requiredTrucks: 1,
    allocatedTrucks: 1,
    biddingWindowEndsInMin: 12,
    autoBidEnabled: true,
    estimatedBudgetETB: 110000,
    estimatedBudgetLocal: 1195000, // ~1,195,000 RWF
    status: 'bidding_open',
    escrowId: 'ESC-RW-01',
    countryCode: 'RW',
    countryName: 'Rwanda',
    currency: 'RWF',
    corridorName: 'Kigali Logistics Platform (KLP Masaka) → Rusumo OSBP Border',
  },

  // 🇹🇿 Tanzania
  {
    bookingId: 'TBK-TZ-401',
    shipperName: 'Bakhresa Group Tanzania',
    origin: 'Dar es Salaam Port Kurasini',
    destination: 'Dodoma Dry Port Inland Logistics',
    cargoCategory: 'Wheat Grain & Food Processing Flour',
    weightTons: 28,
    priority: 'normal',
    priorityMultiplier: 1.0,
    requiredTrucks: 1,
    allocatedTrucks: 0,
    biddingWindowEndsInMin: 40,
    autoBidEnabled: true,
    estimatedBudgetETB: 96000,
    estimatedBudgetLocal: 2080000, // ~2,080,000 TZS
    status: 'bidding_open',
    escrowId: 'ESC-TZ-01',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    currency: 'TZS',
    corridorName: 'Dar es Salaam Port Kurasini → Dodoma Central Corridor',
  },

  // 🇩🇯 Djibouti
  {
    bookingId: 'TBK-DJ-501',
    shipperName: 'Doraleh Multipurpose Port Authority',
    origin: 'Doraleh Container Terminal (DCT)',
    destination: 'Galafi Border Crossing Post',
    cargoCategory: 'Bonded Transit Machinery & Heavy Equipment',
    weightTons: 34,
    priority: 'urgent',
    priorityMultiplier: 1.35,
    requiredTrucks: 1,
    allocatedTrucks: 1,
    biddingWindowEndsInMin: 18,
    autoBidEnabled: true,
    estimatedBudgetETB: 165000,
    estimatedBudgetLocal: 236000, // ~236,000 DJF
    status: 'bidding_open',
    escrowId: 'ESC-DJ-01',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    currency: 'DJF',
    corridorName: 'Doraleh Multipurpose Port (DMP) → Galafi Border Crossing Link',
  },

  // 🇸🇴 Somalia
  {
    bookingId: 'TBK-SO-601',
    shipperName: 'Berbera Corridor Logistics Consortium',
    origin: 'Berbera Port DP World Terminal',
    destination: 'Hargeisa Central Wholesale Depot',
    cargoCategory: 'Construction Materials & Commercial Dry Goods',
    weightTons: 25,
    priority: 'normal',
    priorityMultiplier: 1.0,
    requiredTrucks: 1,
    allocatedTrucks: 0,
    biddingWindowEndsInMin: 28,
    autoBidEnabled: true,
    estimatedBudgetETB: 91000,
    estimatedBudgetLocal: 700, // ~700 USD
    status: 'bidding_open',
    escrowId: 'ESC-SO-01',
    countryCode: 'SO',
    countryName: 'Somalia',
    currency: 'USD',
    corridorName: 'Berbera Port DP World Terminal → Hargeisa Commercial Hub',
  },

  // 🇸🇸 South Sudan
  {
    bookingId: 'TBK-SS-701',
    shipperName: 'Equatoria Relief & Development Aid',
    origin: 'Nimule Border Customs OSBP',
    destination: 'Juba Gumbo Inland Freight Terminal',
    cargoCategory: 'Essential Food Grain & Emergency Supplies',
    weightTons: 22,
    priority: 'urgent',
    priorityMultiplier: 1.45,
    requiredTrucks: 1,
    allocatedTrucks: 0,
    biddingWindowEndsInMin: 15,
    autoBidEnabled: true,
    estimatedBudgetETB: 135000,
    estimatedBudgetLocal: 1580000, // ~1,580,000 SSP
    status: 'bidding_open',
    escrowId: 'ESC-SS-01',
    countryCode: 'SS',
    countryName: 'South Sudan',
    currency: 'SSP',
    corridorName: 'Nimule Border Post → Juba Lifeline Highway Corridor',
  },
];

const INITIAL_BIDS: SuperAppFreightBid[] = [
  // 🇪🇹 Ethiopia - TBK-8821
  {
    bidId: 'BID-301',
    bookingId: 'TBK-8821',
    providerId: 'OWN-01',
    providerName: 'Abay Heavy Logistics PLC',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-01',
    truckPlate: '3-ET-48190',
    truckModel: 'Mercedes-Benz Atego 1518',
    amountETB: 61500,
    amountLocal: 61500,
    currency: 'ETB',
    etaMinutes: 22,
    rating: 4.92,
    autoSelected: true,
    status: 'awarded',
    submittedAt: '18 min ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    corridorName: 'Addis Ababa → Modjo Dry Port → Djibouti Port Corridor',
  },
  {
    bidId: 'BID-302',
    bookingId: 'TBK-8821',
    providerId: 'OWN-02',
    providerName: 'Awash Corridor Carriers SC',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-02',
    truckPlate: '3-ET-91823',
    truckModel: 'Volvo FH16 Globetrotter',
    amountETB: 63000,
    amountLocal: 63000,
    currency: 'ETB',
    etaMinutes: 19,
    rating: 4.88,
    autoSelected: false,
    status: 'open',
    submittedAt: '11 min ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    corridorName: 'Addis Ababa → Modjo Dry Port → Djibouti Port Corridor',
  },
  {
    bidId: 'BID-303',
    bookingId: 'TBK-8821',
    providerId: 'DRV-15',
    providerName: 'Kibrom Tadesse',
    providerType: 'independent_driver',
    truckId: 'TRK-IND-09',
    truckPlate: '3-ET-51204',
    truckModel: 'Sinotruk Steyr 20T',
    amountETB: 64800,
    amountLocal: 64800,
    currency: 'ETB',
    etaMinutes: 27,
    rating: 4.79,
    autoSelected: false,
    status: 'open',
    submittedAt: '7 min ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    corridorName: 'Addis Ababa → Modjo Dry Port → Djibouti Port Corridor',
  },

  // 🇪🇹 Ethiopia - TBK-8822
  {
    bidId: 'BID-304',
    bookingId: 'TBK-8822',
    providerId: 'OWN-03',
    providerName: 'Rift Valley ColdChain PLC',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-04',
    truckPlate: '3-ET-60215',
    truckModel: 'Isuzu FVR Heavy',
    amountETB: 89500,
    amountLocal: 89500,
    currency: 'ETB',
    etaMinutes: 16,
    rating: 4.95,
    autoSelected: false,
    status: 'open',
    submittedAt: '5 min ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    corridorName: 'Gotera Interchange → Kality Toll Gate Express Link',
  },

  // 🇰🇪 Kenya - TBK-KE-101
  {
    bidId: 'BID-KE-01',
    bookingId: 'TBK-KE-101',
    providerId: 'OWN-04',
    providerName: 'Rift Haulers Kenya Ltd',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-05',
    truckPlate: 'KDA 782X',
    truckModel: 'Scania R500 6x4 Heavy Hauler',
    amountETB: 141000,
    amountLocal: 148000, // 148,000 KES
    currency: 'KES',
    etaMinutes: 25,
    rating: 4.94,
    autoSelected: false,
    status: 'open',
    submittedAt: '12 min ago',
    countryCode: 'KE',
    countryName: 'Kenya',
    corridorName: 'Mombasa Port Container Terminal → Nairobi ICD SGR Depot',
  },
  {
    bidId: 'BID-KE-02',
    bookingId: 'TBK-KE-101',
    providerId: 'OWN-05',
    providerName: 'Mombasa SGR Express Haulage',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-06',
    truckPlate: 'KCY 419P',
    truckModel: 'Mercedes-Benz Actros 3340',
    amountETB: 144500,
    amountLocal: 152000, // 152,000 KES
    currency: 'KES',
    etaMinutes: 30,
    rating: 4.87,
    autoSelected: false,
    status: 'open',
    submittedAt: '8 min ago',
    countryCode: 'KE',
    countryName: 'Kenya',
    corridorName: 'Mombasa Port Container Terminal → Nairobi ICD SGR Depot',
  },

  // 🇺🇬 Uganda - TBK-UG-201
  {
    bidId: 'BID-UG-01',
    bookingId: 'TBK-UG-201',
    providerId: 'OWN-06',
    providerName: 'Victoria Transit Ltd',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-07',
    truckPlate: 'UBA 912K',
    truckModel: 'Isuzu Giga 24T Rigid Heavy',
    amountETB: 85000,
    amountLocal: 2580000, // 2,580,000 UGX
    currency: 'UGX',
    etaMinutes: 32,
    rating: 4.89,
    autoSelected: false,
    status: 'open',
    submittedAt: '20 min ago',
    countryCode: 'UG',
    countryName: 'Uganda',
    corridorName: 'Malaba OSBP Border → Kampala Namanve Industrial Park',
  },

  // 🇷🇼 Rwanda - TBK-RW-301
  {
    bidId: 'BID-RW-01',
    bookingId: 'TBK-RW-301',
    providerId: 'OWN-07',
    providerName: 'Akagera Logistics SARL',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-08',
    truckPlate: 'RAD 518B',
    truckModel: 'Volvo FMX 420 30T Container',
    amountETB: 108000,
    amountLocal: 1170000, // 1,170,000 RWF
    currency: 'RWF',
    etaMinutes: 18,
    rating: 4.96,
    autoSelected: true,
    status: 'awarded',
    submittedAt: '15 min ago',
    countryCode: 'RW',
    countryName: 'Rwanda',
    corridorName: 'Kigali Logistics Platform (KLP Masaka) → Rusumo OSBP Border',
  },

  // 🇹🇿 Tanzania - TBK-TZ-401
  {
    bidId: 'BID-TZ-01',
    bookingId: 'TBK-TZ-401',
    providerId: 'OWN-08',
    providerName: 'Kilimanjaro Freightlines Ltd',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-09',
    truckPlate: 'T 381 DFR',
    truckModel: 'MAN TGS 33.400 28T Tipper',
    amountETB: 93500,
    amountLocal: 2030000, // 2,030,000 TZS
    currency: 'TZS',
    etaMinutes: 28,
    rating: 4.91,
    autoSelected: false,
    status: 'open',
    submittedAt: '24 min ago',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    corridorName: 'Dar es Salaam Port Kurasini → Dodoma Central Corridor',
  },

  // 🇩🇯 Djibouti - TBK-DJ-501
  {
    bidId: 'BID-DJ-01',
    bookingId: 'TBK-DJ-501',
    providerId: 'OWN-09',
    providerName: 'Red Sea Cargo Logistics Djibouti',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-10',
    truckPlate: 'DJ 1482 A',
    truckModel: 'Renault Trucks K440 Heavy',
    amountETB: 162000,
    amountLocal: 231000, // 231,000 DJF
    currency: 'DJF',
    etaMinutes: 14,
    rating: 4.95,
    autoSelected: true,
    status: 'awarded',
    submittedAt: '16 min ago',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    corridorName: 'Doraleh Multipurpose Port (DMP) → Galafi Border Crossing Link',
  },

  // 🇸🇴 Somalia - TBK-SO-601
  {
    bidId: 'BID-SO-01',
    bookingId: 'TBK-SO-601',
    providerId: 'OWN-10',
    providerName: 'Horn of Africa Express Logistics',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-11',
    truckPlate: 'MOG 8812 B',
    truckModel: 'Sinotruk HOWO 25T Cargo',
    amountETB: 88400,
    amountLocal: 680, // 680 USD
    currency: 'USD',
    etaMinutes: 30,
    rating: 4.84,
    autoSelected: false,
    status: 'open',
    submittedAt: '18 min ago',
    countryCode: 'SO',
    countryName: 'Somalia',
    corridorName: 'Berbera Port DP World Terminal → Hargeisa Commercial Hub',
  },

  // 🇸🇸 South Sudan - TBK-SS-701
  {
    bidId: 'BID-SS-01',
    bookingId: 'TBK-SS-701',
    providerId: 'OWN-11',
    providerName: 'Equatoria Lifeline Freight Juba',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-12',
    truckPlate: 'SSD 409 X',
    truckModel: 'Mercedes-Benz Axor 2628 6x4',
    amountETB: 132000,
    amountLocal: 1545000, // 1,545,000 SSP
    currency: 'SSP',
    etaMinutes: 38,
    rating: 4.9,
    autoSelected: false,
    status: 'open',
    submittedAt: '10 min ago',
    countryCode: 'SS',
    countryName: 'South Sudan',
    corridorName: 'Nimule Border Post → Juba Lifeline Highway Corridor',
  },
];

const INITIAL_INVITATIONS: SuperAppDriverInvitation[] = [
  // 🇪🇹 Ethiopia
  {
    invitationId: 'INV-701',
    ownerId: 'OWN-01',
    ownerName: 'Abay Heavy Logistics PLC',
    driverName: 'Kibrom Tadesse',
    driverPhone: '0911 556 677',
    targetTruckId: 'TRK-03',
    targetTruckPlate: '3-ET-74910',
    revenueSplitDriverPct: 32,
    status: 'pending',
    sentAt: '25 min ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },
  {
    invitationId: 'INV-700',
    ownerId: 'OWN-02',
    ownerName: 'Awash Corridor Carriers SC',
    driverName: 'Dawit Alemayehu',
    driverPhone: '0913 876 543',
    targetTruckId: 'TRK-02',
    targetTruckPlate: '3-ET-91823',
    revenueSplitDriverPct: 30,
    status: 'accepted',
    sentAt: '2 days ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
  },

  // 🇰🇪 Kenya
  {
    invitationId: 'INV-KE-01',
    ownerId: 'OWN-05',
    ownerName: 'Mombasa SGR Express Haulage',
    driverName: 'Samuel Kamau',
    driverPhone: '+254 722 990 112',
    targetTruckId: 'TRK-06',
    targetTruckPlate: 'KCY 419P',
    revenueSplitDriverPct: 35,
    status: 'pending',
    sentAt: '1 hour ago',
    countryCode: 'KE',
    countryName: 'Kenya',
  },

  // 🇺🇬 Uganda
  {
    invitationId: 'INV-UG-01',
    ownerId: 'OWN-06',
    ownerName: 'Victoria Transit Ltd',
    driverName: 'Joseph Mugisha',
    driverPhone: '+256 772 123 456',
    targetTruckId: 'TRK-07',
    targetTruckPlate: 'UBA 912K',
    revenueSplitDriverPct: 32,
    status: 'accepted',
    sentAt: '3 days ago',
    countryCode: 'UG',
    countryName: 'Uganda',
  },

  // 🇷🇼 Rwanda
  {
    invitationId: 'INV-RW-01',
    ownerId: 'OWN-07',
    ownerName: 'Akagera Logistics SARL',
    driverName: 'Jean-Paul Habimana',
    driverPhone: '+250 788 123 456',
    targetTruckId: 'TRK-08',
    targetTruckPlate: 'RAD 518B',
    revenueSplitDriverPct: 34,
    status: 'accepted',
    sentAt: '1 day ago',
    countryCode: 'RW',
    countryName: 'Rwanda',
  },
];

const INITIAL_ESCROWS: SuperAppEscrowRecord[] = [
  // 🇪🇹 Ethiopia
  {
    escrowId: 'ESC-5501',
    bookingId: 'TBK-8821',
    payerName: 'Mojo Agro Industry PLC',
    recipientId: 'OWN-01',
    recipientName: 'Abay Heavy Logistics PLC',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'cbe_birr',
    localPaymentRail: 'Commercial Bank of Ethiopia (CBE Birr RTGS)',
    grossAmountETB: 128000,
    grossAmountLocal: 128000,
    platformMarginETB: 19200,
    platformMarginLocal: 19200,
    taxWithheldETB: 2560,
    taxWithheldLocal: 2560,
    netPayoutETB: 106240,
    netPayoutLocal: 106240,
    status: 'held_in_escrow',
    updatedAt: '15 min ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    currency: 'ETB',
  },
  {
    escrowId: 'ESC-5502',
    bookingId: 'TBK-8822',
    payerName: 'Kality Steel Mills SC',
    recipientId: 'OWN-02',
    recipientName: 'Awash Corridor Carriers SC',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'bank_rtgs',
    localPaymentRail: 'National Bank of Ethiopia (NBE RTGS Wire)',
    grossAmountETB: 120000,
    grossAmountLocal: 120000,
    platformMarginETB: 18000,
    platformMarginLocal: 18000,
    taxWithheldETB: 2400,
    taxWithheldLocal: 2400,
    netPayoutETB: 99600,
    netPayoutLocal: 99600,
    status: 'payout_ready',
    updatedAt: '38 min ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    currency: 'ETB',
  },
  {
    escrowId: 'ESC-5503',
    bookingId: 'TBK-8819',
    payerName: 'Hawassa Textile Export SC',
    recipientId: 'DRV-07',
    recipientName: 'Tsegaye Hailu',
    recipientType: 'driver',
    paymentRail: 'telebirr',
    localPaymentRail: 'Ethio Telecom (Telebirr SuperApp B2C)',
    grossAmountETB: 48000,
    grossAmountLocal: 48000,
    platformMarginETB: 7200,
    platformMarginLocal: 7200,
    taxWithheldETB: 960,
    taxWithheldLocal: 960,
    netPayoutETB: 39840,
    netPayoutLocal: 39840,
    status: 'released',
    updatedAt: '2 hours ago',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    currency: 'ETB',
  },

  // 🇰🇪 Kenya
  {
    escrowId: 'ESC-KE-01',
    bookingId: 'TBK-KE-101',
    payerName: 'Kenya Tea Development Agency (KTDA)',
    recipientId: 'OWN-04',
    recipientName: 'Rift Haulers Kenya Ltd',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'mpesa_ke',
    localPaymentRail: 'Safaricom Daraja M-PESA B2C Escrow Clearing',
    grossAmountETB: 142000,
    grossAmountLocal: 149500, // KES
    platformMarginETB: 21300,
    platformMarginLocal: 22425,
    taxWithheldETB: 4260,
    taxWithheldLocal: 4485,
    netPayoutETB: 116440,
    netPayoutLocal: 122590,
    status: 'held_in_escrow',
    updatedAt: '20 min ago',
    countryCode: 'KE',
    countryName: 'Kenya',
    currency: 'KES',
  },

  // 🇺🇬 Uganda
  {
    escrowId: 'ESC-UG-01',
    bookingId: 'TBK-UG-201',
    payerName: 'Mukwano Industries Uganda',
    recipientId: 'OWN-06',
    recipientName: 'Victoria Transit Ltd',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'mtn_ug',
    localPaymentRail: 'MTN Mobile Money Uganda (MoMo B2C API)',
    grossAmountETB: 88000,
    grossAmountLocal: 2660000, // UGX
    platformMarginETB: 13200,
    platformMarginLocal: 399000,
    taxWithheldETB: 2640,
    taxWithheldLocal: 79800,
    netPayoutETB: 72160,
    netPayoutLocal: 2181200,
    status: 'held_in_escrow',
    updatedAt: '30 min ago',
    countryCode: 'UG',
    countryName: 'Uganda',
    currency: 'UGX',
  },

  // 🇷🇼 Rwanda
  {
    escrowId: 'ESC-RW-01',
    bookingId: 'TBK-RW-301',
    payerName: 'Rwanda Mountain Tea SARL',
    recipientId: 'OWN-07',
    recipientName: 'Akagera Logistics SARL',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'mtn_rw',
    localPaymentRail: 'MTN MoMo Rwanda Open API Instant Clearing',
    grossAmountETB: 110000,
    grossAmountLocal: 1195000, // RWF
    platformMarginETB: 16500,
    platformMarginLocal: 179250,
    taxWithheldETB: 3300,
    taxWithheldLocal: 35850,
    netPayoutETB: 90200,
    netPayoutLocal: 979900,
    status: 'held_in_escrow',
    updatedAt: '12 min ago',
    countryCode: 'RW',
    countryName: 'Rwanda',
    currency: 'RWF',
  },

  // 🇹🇿 Tanzania
  {
    escrowId: 'ESC-TZ-01',
    bookingId: 'TBK-TZ-401',
    payerName: 'Bakhresa Group Tanzania',
    recipientId: 'OWN-08',
    recipientName: 'Kilimanjaro Freightlines Ltd',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'mpesa_tz',
    localPaymentRail: 'Vodacom M-Pesa Tanzania Corporate Disbursal',
    grossAmountETB: 96000,
    grossAmountLocal: 2080000, // TZS
    platformMarginETB: 14400,
    platformMarginLocal: 312000,
    taxWithheldETB: 1920,
    taxWithheldLocal: 41600,
    netPayoutETB: 79680,
    netPayoutLocal: 1726400,
    status: 'held_in_escrow',
    updatedAt: '35 min ago',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    currency: 'TZS',
  },

  // 🇩🇯 Djibouti
  {
    escrowId: 'ESC-DJ-01',
    bookingId: 'TBK-DJ-501',
    payerName: 'Doraleh Multipurpose Port Authority',
    recipientId: 'OWN-09',
    recipientName: 'Red Sea Cargo Logistics Djibouti',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'dmoney_dj',
    localPaymentRail: 'D-Money (Djibouti Telecom Corporate Rail)',
    grossAmountETB: 165000,
    grossAmountLocal: 236000, // DJF
    platformMarginETB: 24750,
    platformMarginLocal: 35400,
    taxWithheldETB: 3300,
    taxWithheldLocal: 4720,
    netPayoutETB: 136950,
    netPayoutLocal: 195880,
    status: 'held_in_escrow',
    updatedAt: '16 min ago',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    currency: 'DJF',
  },

  // 🇸🇴 Somalia
  {
    escrowId: 'ESC-SO-01',
    bookingId: 'TBK-SO-601',
    payerName: 'Berbera Corridor Logistics Consortium',
    recipientId: 'OWN-10',
    recipientName: 'Horn of Africa Express Logistics',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'evc_plus_so',
    localPaymentRail: 'Hormuud EVC Plus / Telesom Zaad USD Clearing',
    grossAmountETB: 91000,
    grossAmountLocal: 700, // USD
    platformMarginETB: 13650,
    platformMarginLocal: 105,
    taxWithheldETB: 1820,
    taxWithheldLocal: 14,
    netPayoutETB: 75530,
    netPayoutLocal: 581,
    status: 'held_in_escrow',
    updatedAt: '25 min ago',
    countryCode: 'SO',
    countryName: 'Somalia',
    currency: 'USD',
  },

  // 🇸🇸 South Sudan
  {
    escrowId: 'ESC-SS-01',
    bookingId: 'TBK-SS-701',
    payerName: 'Equatoria Relief & Development Aid',
    recipientId: 'OWN-11',
    recipientName: 'Equatoria Lifeline Freight Juba',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'mgurush_ss',
    localPaymentRail: 'm-GURUSH Mobile Money South Sudan',
    grossAmountETB: 135000,
    grossAmountLocal: 1580000, // SSP
    platformMarginETB: 20250,
    platformMarginLocal: 237000,
    taxWithheldETB: 2700,
    taxWithheldLocal: 31600,
    netPayoutETB: 112050,
    netPayoutLocal: 1311400,
    status: 'held_in_escrow',
    updatedAt: '14 min ago',
    countryCode: 'SS',
    countryName: 'South Sudan',
    currency: 'SSP',
  },
];

export const EAST_AFRICA_REGIONAL_PRICING: Record<string, RegionalCountryPricingContext> = {
  ET: {
    countryCode: 'ET',
    countryName: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    exchangeRateToETB: 1.0,
    regulator: 'National Bank of Ethiopia (NBE)',
    rideBaseFare: 120,
    ridePerKm: 28,
    ridePerMin: 3.5,
    truckBaseFare: 3500,
    truckPerTonKm: 14.5,
    biddingFloorPct: 85,
    biddingCeilingPct: 135,
    platformMarginPct: 15,
    withholdingTaxPct: 2,
    autoBidWindowMinutes: 20,
    corridorNotes: 'Addis Ababa Urban & Modjo-Djibouti Bilateral Logistics Axis',
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    exchangeRateToETB: 0.95,
    regulator: 'Central Bank of Kenya (CBK)',
    rideBaseFare: 150,
    ridePerKm: 32,
    ridePerMin: 4.0,
    truckBaseFare: 4200,
    truckPerTonKm: 16.0,
    biddingFloorPct: 85,
    biddingCeilingPct: 140,
    platformMarginPct: 15,
    withholdingTaxPct: 3,
    autoBidWindowMinutes: 20,
    corridorNotes: 'Nairobi Metropolis & Moyale-Marsabit Cross-Border Route',
  },
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    exchangeRateToETB: 0.033,
    regulator: 'Bank of Uganda (BoU)',
    rideBaseFare: 4500,
    ridePerKm: 1100,
    ridePerMin: 120,
    truckBaseFare: 120000,
    truckPerTonKm: 550,
    biddingFloorPct: 80,
    biddingCeilingPct: 130,
    platformMarginPct: 15,
    withholdingTaxPct: 3,
    autoBidWindowMinutes: 25,
    corridorNotes: 'Kampala Greater Urban & Malaba Border Customs Terminal',
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'FRw',
    exchangeRateToETB: 0.092,
    regulator: 'National Bank of Rwanda (BNR)',
    rideBaseFare: 1500,
    ridePerKm: 350,
    ridePerMin: 45,
    truckBaseFare: 45000,
    truckPerTonKm: 190,
    biddingFloorPct: 85,
    biddingCeilingPct: 135,
    platformMarginPct: 15,
    withholdingTaxPct: 3,
    autoBidWindowMinutes: 15,
    corridorNotes: 'Kigali Free Trade Zone & Special Economic Zone (Masoro)',
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    exchangeRateToETB: 0.046,
    regulator: 'Bank of Tanzania (BoT)',
    rideBaseFare: 3000,
    ridePerKm: 750,
    ridePerMin: 90,
    truckBaseFare: 85000,
    truckPerTonKm: 380,
    biddingFloorPct: 80,
    biddingCeilingPct: 135,
    platformMarginPct: 15,
    withholdingTaxPct: 2,
    autoBidWindowMinutes: 20,
    corridorNotes: 'Dar es Salaam Port Inland Logistics & Central Corridor',
  },
  DJ: {
    countryCode: 'DJ',
    countryName: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    exchangeRateToETB: 0.70,
    regulator: 'Banque Centrale de Djibouti (BCD)',
    rideBaseFare: 250,
    ridePerKm: 60,
    ridePerMin: 8.0,
    truckBaseFare: 7500,
    truckPerTonKm: 35.0,
    biddingFloorPct: 85,
    biddingCeilingPct: 140,
    platformMarginPct: 15,
    withholdingTaxPct: 2,
    autoBidWindowMinutes: 25,
    corridorNotes: 'Doraleh Container Terminal (DCT) ⇄ Modjo Dry Port Corridor',
  },
  SO: {
    countryCode: 'SO',
    countryName: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD',
    currencySymbol: '$',
    exchangeRateToETB: 125.0,
    regulator: 'Central Bank of Somalia (CBS)',
    rideBaseFare: 2.50,
    ridePerKm: 0.65,
    ridePerMin: 0.08,
    truckBaseFare: 65.0,
    truckPerTonKm: 0.32,
    biddingFloorPct: 85,
    biddingCeilingPct: 135,
    platformMarginPct: 15,
    withholdingTaxPct: 2,
    autoBidWindowMinutes: 20,
    corridorNotes: 'Mogadishu Coastal Trade & Berbera Port Freight Route',
  },
  SS: {
    countryCode: 'SS',
    countryName: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP',
    currencySymbol: 'SSP',
    exchangeRateToETB: 0.04,
    regulator: 'Bank of South Sudan (BSS)',
    rideBaseFare: 2500,
    ridePerKm: 600,
    ridePerMin: 70,
    truckBaseFare: 75000,
    truckPerTonKm: 320,
    biddingFloorPct: 80,
    biddingCeilingPct: 135,
    platformMarginPct: 15,
    withholdingTaxPct: 2,
    autoBidWindowMinutes: 30,
    corridorNotes: 'Juba River Port Transit & Nimule Border Corridor',
  },
};

const INITIAL_SURGE_ZONES: SuperAppSurgeZone[] = [
  // Ethiopia (ET)
  {
    zoneId: 'ZONE-ET-BOLE-01',
    zoneName: 'Bole Int’l Airport & Medhanealem',
    serviceType: 'ride',
    activeRequests: 68,
    availableDrivers: 42,
    currentMultiplier: 1.35,
    autoSurgeEnabled: true,
    updatedAt: '2 min ago',
    countryCode: 'ET',
    city: 'Addis Ababa',
    corridor: 'Airport Commercial Axis',
    currency: 'ETB',
  },
  {
    zoneId: 'ZONE-ET-KAZ-02',
    zoneName: 'Kazanchis & Meskel Square Interchange',
    serviceType: 'ride',
    activeRequests: 51,
    availableDrivers: 39,
    currentMultiplier: 1.20,
    autoSurgeEnabled: true,
    updatedAt: '4 min ago',
    countryCode: 'ET',
    city: 'Addis Ababa',
    corridor: 'UNECA & Government Center',
    currency: 'ETB',
  },
  {
    zoneId: 'ZONE-ET-MODJO-03',
    zoneName: 'Kality — Modjo Dry Port Freight Gate',
    serviceType: 'truck',
    activeRequests: 19,
    availableDrivers: 11,
    currentMultiplier: 1.40,
    autoSurgeEnabled: false,
    updatedAt: '9 min ago',
    countryCode: 'ET',
    city: 'Modjo',
    corridor: 'Ethio-Djibouti Railway / Highway Corridor',
    currency: 'ETB',
  },

  // Kenya (KE)
  {
    zoneId: 'ZONE-KE-NBO-01',
    zoneName: 'Nairobi Westlands & Upper Hill Corporate',
    serviceType: 'ride',
    activeRequests: 84,
    availableDrivers: 55,
    currentMultiplier: 1.30,
    autoSurgeEnabled: true,
    updatedAt: '3 min ago',
    countryCode: 'KE',
    city: 'Nairobi',
    corridor: 'Westlands Commercial Hub',
    currency: 'KES',
  },
  {
    zoneId: 'ZONE-KE-JKIA-02',
    zoneName: 'JKIA International Cargo Terminal',
    serviceType: 'truck',
    activeRequests: 32,
    availableDrivers: 18,
    currentMultiplier: 1.45,
    autoSurgeEnabled: true,
    updatedAt: '5 min ago',
    countryCode: 'KE',
    city: 'Nairobi',
    corridor: 'Embakasi Freight Gateway',
    currency: 'KES',
  },

  // Uganda (UG)
  {
    zoneId: 'ZONE-UG-KLA-01',
    zoneName: 'Kampala Kololo & CBD Interchange',
    serviceType: 'ride',
    activeRequests: 62,
    availableDrivers: 48,
    currentMultiplier: 1.25,
    autoSurgeEnabled: true,
    updatedAt: '6 min ago',
    countryCode: 'UG',
    city: 'Kampala',
    corridor: 'Greater Kampala Express',
    currency: 'UGX',
  },
  {
    zoneId: 'ZONE-UG-MLB-02',
    zoneName: 'Malaba Border Crossing Customs Terminal',
    serviceType: 'truck',
    activeRequests: 28,
    availableDrivers: 14,
    currentMultiplier: 1.50,
    autoSurgeEnabled: true,
    updatedAt: '8 min ago',
    countryCode: 'UG',
    city: 'Malaba',
    corridor: 'Northern Transit Corridor (Kenya-Uganda-Rwanda)',
    currency: 'UGX',
  },

  // Rwanda (RW)
  {
    zoneId: 'ZONE-RW-KGL-01',
    zoneName: 'Kigali Heights & Convention District',
    serviceType: 'ride',
    activeRequests: 44,
    availableDrivers: 38,
    currentMultiplier: 1.15,
    autoSurgeEnabled: true,
    updatedAt: '12 min ago',
    countryCode: 'RW',
    city: 'Kigali',
    corridor: 'Kimihurura Tech Corridor',
    currency: 'RWF',
  },
  {
    zoneId: 'ZONE-RW-SEZ-02',
    zoneName: 'Kigali Special Economic Zone (Masoro)',
    serviceType: 'truck',
    activeRequests: 16,
    availableDrivers: 10,
    currentMultiplier: 1.35,
    autoSurgeEnabled: false,
    updatedAt: '15 min ago',
    countryCode: 'RW',
    city: 'Kigali',
    corridor: 'Prime Logistics Free Zone',
    currency: 'RWF',
  },

  // Tanzania (TZ)
  {
    zoneId: 'ZONE-TZ-DAR-01',
    zoneName: 'Dar es Salaam Port & Bandari Gate',
    serviceType: 'truck',
    activeRequests: 48,
    availableDrivers: 24,
    currentMultiplier: 1.55,
    autoSurgeEnabled: true,
    updatedAt: '4 min ago',
    countryCode: 'TZ',
    city: 'Dar es Salaam',
    corridor: 'Maritime Port Inland Freight Axis',
    currency: 'TZS',
  },

  // Djibouti (DJ)
  {
    zoneId: 'ZONE-DJ-DCT-01',
    zoneName: 'Doraleh Container Terminal (DCT)',
    serviceType: 'truck',
    activeRequests: 54,
    availableDrivers: 22,
    currentMultiplier: 1.65,
    autoSurgeEnabled: true,
    updatedAt: '1 min ago',
    countryCode: 'DJ',
    city: 'Djibouti City',
    corridor: 'Red Sea Deepwater Container Port ⇄ Modjo Dry Port',
    currency: 'DJF',
  },
  {
    zoneId: 'ZONE-DJ-GAL-02',
    zoneName: 'Galafi Border Transit & PK12 Logistics',
    serviceType: 'truck',
    activeRequests: 21,
    availableDrivers: 12,
    currentMultiplier: 1.35,
    autoSurgeEnabled: true,
    updatedAt: '7 min ago',
    countryCode: 'DJ',
    city: 'Galafi',
    corridor: 'Bilateral Customs & Bonded Freight Corridor',
    currency: 'DJF',
  },

  // Somalia (SO)
  {
    zoneId: 'ZONE-SO-MGQ-01',
    zoneName: 'Mogadishu Aden Adde Airport & Port Gateway',
    serviceType: 'ride',
    activeRequests: 35,
    availableDrivers: 25,
    currentMultiplier: 1.25,
    autoSurgeEnabled: true,
    updatedAt: '11 min ago',
    countryCode: 'SO',
    city: 'Mogadishu',
    corridor: 'Airport Commercial Security Route',
    currency: 'USD',
  },

  // South Sudan (SS)
  {
    zoneId: 'ZONE-SS-JUB-01',
    zoneName: 'Juba River Port & Custom Market',
    serviceType: 'truck',
    activeRequests: 18,
    availableDrivers: 9,
    currentMultiplier: 1.60,
    autoSurgeEnabled: false,
    updatedAt: '14 min ago',
    countryCode: 'SS',
    city: 'Juba',
    corridor: 'White Nile Inland Waterway / Highway Corridor',
    currency: 'SSP',
  },
];

const INITIAL_FEATURE_FLAGS: SuperAppFeatureFlagItem[] = [
  {
    key: 'ff.city_ride_instant_dispatch',
    name: 'AmbaLay Instant Matrix Ride Dispatch',
    serviceType: 'ride',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['customer', 'driver', 'admin'],
    countries: ['ET', 'KE', 'UG', 'RW', 'TZ', 'DJ', 'SO', 'SS'],
    description: 'Uses AmbaLay multi-point distance matrix for sub-second nearest-driver matching across all East African cities.',
    updatedAt: 'Today, 08:15',
  },
  {
    key: 'ff.multi_truck_bidding',
    name: 'Cross-Border Multi-Truck Load Splitting & Bidding',
    serviceType: 'truck',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['customer', 'driver', 'vehicle_owner', 'admin'],
    countries: ['ET', 'KE', 'UG', 'RW', 'TZ', 'DJ', 'SO', 'SS'],
    description: 'Enables corporate shippers to allocate multi-truck cross-border tonnage across independent and fleet carriers.',
    updatedAt: 'Today, 09:00',
  },
  {
    key: 'ff.modjo_djibouti_freight_corridor',
    name: 'Modjo Dry Port ⇄ Doraleh Port Bilateral Clearing',
    serviceType: 'truck',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['customer', 'driver', 'vehicle_owner', 'admin'],
    countries: ['ET', 'DJ'],
    description: 'Dedicated multimodal clearance and automated dual-currency (ETB/DJF) digital waybill escrow for the Modjo-Djibouti trade vein.',
    updatedAt: 'Today, 07:30',
  },
  {
    key: 'ff.momo_crossborder_payments',
    name: 'Regional Mobile Money Clearing (M-PESA / MoMo / D-Money)',
    serviceType: 'platform',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['customer', 'driver', 'vehicle_owner', 'admin'],
    countries: ['KE', 'UG', 'RW', 'TZ', 'DJ', 'SO', 'SS'],
    description: 'Automates instant multi-currency driver disbursements via Safaricom M-PESA, MTN MoMo, Airtel Money, and D-Money.',
    updatedAt: 'Yesterday',
  },
  {
    key: 'ff.vehicle_owner_1to1_binding',
    name: 'Strict 1-Driver-Per-Truck Fleet Invariant',
    serviceType: 'truck',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['vehicle_owner', 'driver', 'admin'],
    countries: ['ET', 'KE', 'UG', 'RW', 'TZ', 'DJ', 'SO', 'SS'],
    description: 'Enforces atomic driver transfer when binding a driver to a Vehicle Owner truck across all regional fleets.',
    updatedAt: 'Yesterday',
  },
  {
    key: 'ff.escrow_telebirr_instant_payout',
    name: 'Telebirr & CBE Birr Milestone Escrow Release',
    serviceType: 'platform',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['driver', 'vehicle_owner', 'admin'],
    countries: ['ET'],
    description: 'Automates net 83% carrier disbursement in Ethiopia upon verified digital waybill sign-off.',
    updatedAt: 'Yesterday',
  },
  {
    key: 'ff.east_africa_food_cloud_kitchens',
    name: 'Regional Cloud Kitchens & Meal Delivery Beta',
    serviceType: 'food',
    enabled: false,
    rolloutPercentage: 0,
    targetRoles: ['customer', 'driver'],
    countries: ['ET', 'KE', 'UG'],
    description: 'Staged UnifiedAppRegistry launcher tile for restaurant & courier ordering across Addis, Nairobi, and Kampala.',
    updatedAt: '3 days ago',
  },
];

class SuperAppGovernanceStore {
  verifications: SuperAppVerificationItem[] = structuredClone(INITIAL_VERIFICATIONS);
  fleetTrucks: SuperAppFleetTruck[] = structuredClone(INITIAL_FLEET_TRUCKS);
  loads: SuperAppTruckBookingLoad[] = structuredClone(INITIAL_LOADS);
  bids: SuperAppFreightBid[] = structuredClone(INITIAL_BIDS);
  invitations: SuperAppDriverInvitation[] = structuredClone(INITIAL_INVITATIONS);
  escrows: SuperAppEscrowRecord[] = structuredClone(INITIAL_ESCROWS);

  runtimeConfig: SuperAppRuntimeConfig = {
    bookingPriorities: {
      normal: 1.0,
      urgent: 1.25,
      express: 1.55,
    },
    availableTransportCategories: [
      'Economy Sedan',
      'Comfort Sedan',
      'Minibus XL',
      'Isuzu NPR 5T',
      'Box Truck 15T',
      'Heavy Flatbed 28T',
      'Refrigerated ColdChain',
    ],
    pricingFinancialContext: {
      rideBaseFareETB: 120,
      ridePerKmETB: 28,
      ridePerMinETB: 3.5,
      truckBaseFareETB: 3500,
      truckPerTonKmETB: 14.5,
      biddingFloorPct: 85,
      biddingCeilingPct: 135,
      platformMarginPct: 15,
      withholdingTaxPct: 2,
      autoBidWindowMinutes: 20,
    },
    regionalCountryPricing: structuredClone(EAST_AFRICA_REGIONAL_PRICING),
    regionalSurgeZones: structuredClone(INITIAL_SURGE_ZONES),
    featureFlags: structuredClone(INITIAL_FEATURE_FLAGS),
    updatedAt: new Date().toISOString(),
  };

  updateRuntimeConfig(incoming: Partial<SuperAppRuntimeConfig>): SuperAppRuntimeConfig {
    this.runtimeConfig = {
      ...this.runtimeConfig,
      ...incoming,
      bookingPriorities: {
        ...this.runtimeConfig.bookingPriorities,
        ...(incoming.bookingPriorities || {}),
      },
      pricingFinancialContext: {
        ...this.runtimeConfig.pricingFinancialContext,
        ...(incoming.pricingFinancialContext || {}),
      },
      regionalCountryPricing: {
        ...(this.runtimeConfig.regionalCountryPricing || {}),
        ...(incoming.regionalCountryPricing || {}),
      },
      regionalSurgeZones:
        incoming.regionalSurgeZones ?? this.runtimeConfig.regionalSurgeZones,
      featureFlags: incoming.featureFlags ?? this.runtimeConfig.featureFlags,
      availableTransportCategories:
        incoming.availableTransportCategories ??
        this.runtimeConfig.availableTransportCategories,
      updatedAt: new Date().toISOString(),
    };
    return this.runtimeConfig;
  }

  executeSynthesizedCloudFunction(
    functionName: string,
    payload: Record<string, any> = {}
  ): Record<string, any> {
    switch (functionName) {
      case 'getPlatformMetrics': {
        return {
          pendingVerifications: this.verifications.filter((v) => v.status === 'pending').length,
          activeFleetTrucks: this.fleetTrucks.filter((t) => t.status === 'active').length,
          totalFleetTrucks: this.fleetTrucks.length,
          openFreightLoads: this.loads.filter((l) => l.status === 'bidding_open').length,
          openBids: this.bids.filter((b) => b.status === 'open').length,
          lockedEscrowETB: this.escrows
            .filter((e) => e.status === 'held_in_escrow' || e.status === 'payout_ready')
            .reduce((s, e) => s + e.grossAmountETB, 0),
          activeFeatureFlags: this.runtimeConfig.featureFlags.filter((f) => f.enabled).length,
          timestamp: new Date().toISOString(),
        };
      }

      case 'admin_getPendingDocuments': {
        return {
          allVerifications: this.verifications,
          items: this.verifications,
        };
      }

      case 'admin_verifyDocument':
      case 'approveVehicleVerification':
      case 'rejectVehicleVerification':
      case 'revertVehicleVerification':
      case 'approveServiceActivation':
      case 'rejectDriverRequest': {
        const targetId = String(payload.targetId || '');
        const nextStatus: SuperAppVerificationItem['status'] =
          functionName === 'revertVehicleVerification' || payload.decision === 'pending'
            ? 'pending'
            : functionName.startsWith('reject') || payload.decision === 'rejected'
            ? 'rejected'
            : 'approved';

        this.verifications = this.verifications.map((item) =>
          item.id === targetId
            ? {
                ...item,
                status: nextStatus,
                notes: String(payload.notes || payload.reason || item.notes || ''),
              }
            : item
        );
        return {
          targetId,
          status: nextStatus,
          verifications: this.verifications,
        };
      }

      case 'evaluateBatchDriverEligibility': {
        return {
          totalEvaluated: this.verifications.length,
          evaluatedAt: new Date().toISOString(),
          verifications: this.verifications,
        };
      }

      case 'getTrucksPaginated': {
        return {
          trucks: this.fleetTrucks,
          loads: this.loads,
          bids: this.bids,
          invitations: this.invitations,
          escrows: this.escrows,
        };
      }

      case 'allocateMultiTruckLoad': {
        const bookingId = String(payload.bookingId || '');
        const bidId = String(payload.bidId || '');

        this.bids = this.bids.map((b) =>
          b.bidId === bidId ? { ...b, status: 'awarded' } : b
        );

        this.loads = this.loads.map((load) => {
          if (load.bookingId !== bookingId) return load;
          const nextAllocated = Math.min(load.requiredTrucks, load.allocatedTrucks + 1);
          const nextStatus: SuperAppTruckBookingLoad['status'] =
            nextAllocated >= load.requiredTrucks ? 'allocated' : 'partially_allocated';
          return {
            ...load,
            allocatedTrucks: nextAllocated,
            status: nextStatus,
          };
        });

        return {
          loads: this.loads,
          bids: this.bids,
        };
      }

      case 'assignTruckToDriver':
      case 'transferDriverBetweenTrucks': {
        const truckId = String(payload.truckId || '');
        const driverId = String(payload.driverId || '');
        const driverName = String(payload.driverName || 'Assigned Driver');
        const driverPhone = String(payload.driverPhone || '0911 000 000');

        this.fleetTrucks = this.fleetTrucks.map((truck) => {
          if (truck.truckId === truckId) {
            return {
              ...truck,
              assignedDriverId: driverId,
              assignedDriverName: driverName,
              assignedDriverPhone: driverPhone,
              status: 'active',
            };
          }
          if (truck.assignedDriverId === driverId) {
            return {
              ...truck,
              assignedDriverId: null,
              assignedDriverName: null,
              assignedDriverPhone: null,
              status: 'idle',
            };
          }
          return truck;
        });

        return { trucks: this.fleetTrucks };
      }

      case 'unassignTruckFromDriver': {
        const truckId = String(payload.truckId || '');
        this.fleetTrucks = this.fleetTrucks.map((truck) =>
          truck.truckId === truckId
            ? {
                ...truck,
                assignedDriverId: null,
                assignedDriverName: null,
                assignedDriverPhone: null,
                status: 'idle',
              }
            : truck
        );
        return { trucks: this.fleetTrucks };
      }

      case 'manageInvitation': {
        if (payload.action === 'create') {
          const newInv: SuperAppDriverInvitation = {
            invitationId: `INV-${Math.floor(702 + Math.random() * 290)}`,
            ownerId: 'OWN-01',
            ownerName: String(payload.ownerName || 'Abay Heavy Logistics PLC'),
            driverName: String(payload.driverName || 'Invited Driver'),
            driverPhone: String(payload.driverPhone || '0911 000 000'),
            targetTruckId: String(payload.targetTruckId || 'TRK-03'),
            targetTruckPlate: String(payload.targetTruckPlate || '3-ET-74910'),
            revenueSplitDriverPct: Number(payload.revenueSplitDriverPct) || 30,
            status: 'pending',
            sentAt: 'Just now',
          };
          this.invitations = [newInv, ...this.invitations];
        } else if (payload.invitationId) {
          const invId = String(payload.invitationId);
          const nextStatus = (payload.status || 'revoked') as SuperAppDriverInvitation['status'];
          this.invitations = this.invitations.map((inv) =>
            inv.invitationId === invId ? { ...inv, status: nextStatus } : inv
          );
        }
        return { invitations: this.invitations };
      }

      case 'releaseEscrowMilestone': {
        const escrowId = String(payload.escrowId || '');
        this.escrows = this.escrows.map((esc) =>
          esc.escrowId === escrowId
            ? { ...esc, status: 'payout_ready', updatedAt: 'Just now' }
            : esc
        );
        return {
          escrows: this.escrows,
          settlementReference: `MLS-${Date.now().toString().slice(-6)}`,
        };
      }

      case 'initiateFleetPayout':
      case 'initiateDriverPayout': {
        const escrowId = String(payload.escrowId || '');
        this.escrows = this.escrows.map((esc) =>
          esc.escrowId === escrowId
            ? { ...esc, status: 'released', updatedAt: 'Just now' }
            : esc
        );
        return {
          escrows: this.escrows,
          settlementReference: `STL-${Date.now().toString().slice(-6)}`,
        };
      }

      case 'getCurrentSurge': {
        const zoneId = payload.zoneId ? String(payload.zoneId) : null;
        const zones = zoneId
          ? this.runtimeConfig.regionalSurgeZones.filter((z) => z.zoneId === zoneId)
          : this.runtimeConfig.regionalSurgeZones;
        return { zones };
      }

      case 'updateSurgeMultiplier': {
        const zoneId = String(payload.zoneId || '');
        const multiplier = Number(payload.multiplier) || 1.0;
        const autoSurgeEnabled =
          typeof payload.autoSurgeEnabled === 'boolean' ? payload.autoSurgeEnabled : undefined;

        this.runtimeConfig.regionalSurgeZones = this.runtimeConfig.regionalSurgeZones.map((z) =>
          z.zoneId === zoneId
            ? {
                ...z,
                currentMultiplier: multiplier,
                autoSurgeEnabled:
                  autoSurgeEnabled !== undefined ? autoSurgeEnabled : z.autoSurgeEnabled,
                updatedAt: 'Just now',
              }
            : z
        );
        return { zones: this.runtimeConfig.regionalSurgeZones };
      }

      case 'toggleFeatureFlag': {
        const key = String(payload.key || '');
        const enabled = Boolean(payload.enabled);
        const rolloutPercentage =
          typeof payload.rolloutPercentage === 'number' ? payload.rolloutPercentage : undefined;

        this.runtimeConfig.featureFlags = this.runtimeConfig.featureFlags.map((flag) =>
          flag.key === key
            ? {
                ...flag,
                enabled,
                rolloutPercentage:
                  rolloutPercentage !== undefined ? rolloutPercentage : flag.rolloutPercentage,
                updatedAt: 'Just now',
              }
            : flag
        );
        return { featureFlags: this.runtimeConfig.featureFlags };
      }

      default:
        return {
          functionName,
          acknowledged: true,
          echoPayload: payload,
          timestamp: new Date().toISOString(),
        };
    }
  }
}

export const superAppGovernanceStore = new SuperAppGovernanceStore();
