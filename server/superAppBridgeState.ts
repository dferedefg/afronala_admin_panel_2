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
  },
];

const INITIAL_FLEET_TRUCKS: SuperAppFleetTruck[] = [
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
  },
];

const INITIAL_LOADS: SuperAppTruckBookingLoad[] = [
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
    status: 'bidding_open',
    escrowId: 'ESC-5501',
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
    status: 'bidding_open',
    escrowId: 'ESC-5502',
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
    status: 'in_transit',
    escrowId: 'ESC-5503',
  },
];

const INITIAL_BIDS: SuperAppFreightBid[] = [
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
    etaMinutes: 22,
    rating: 4.92,
    autoSelected: true,
    status: 'awarded',
    submittedAt: '18 min ago',
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
    etaMinutes: 19,
    rating: 4.88,
    autoSelected: false,
    status: 'open',
    submittedAt: '11 min ago',
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
    etaMinutes: 27,
    rating: 4.79,
    autoSelected: false,
    status: 'open',
    submittedAt: '7 min ago',
  },
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
    etaMinutes: 16,
    rating: 4.95,
    autoSelected: false,
    status: 'open',
    submittedAt: '5 min ago',
  },
];

const INITIAL_INVITATIONS: SuperAppDriverInvitation[] = [
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
  },
];

const INITIAL_ESCROWS: SuperAppEscrowRecord[] = [
  {
    escrowId: 'ESC-5501',
    bookingId: 'TBK-8821',
    payerName: 'Mojo Agro Industry PLC',
    recipientId: 'OWN-01',
    recipientName: 'Abay Heavy Logistics PLC',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'cbe_birr',
    grossAmountETB: 128000,
    platformMarginETB: 19200,
    taxWithheldETB: 2560,
    netPayoutETB: 106240,
    status: 'held_in_escrow',
    updatedAt: '15 min ago',
  },
  {
    escrowId: 'ESC-5502',
    bookingId: 'TBK-8822',
    payerName: 'Kality Steel Mills SC',
    recipientId: 'OWN-02',
    recipientName: 'Awash Corridor Carriers SC',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'bank_rtgs',
    grossAmountETB: 120000,
    platformMarginETB: 18000,
    taxWithheldETB: 2400,
    netPayoutETB: 99600,
    status: 'payout_ready',
    updatedAt: '38 min ago',
  },
  {
    escrowId: 'ESC-5503',
    bookingId: 'TBK-8819',
    payerName: 'Hawassa Textile Export SC',
    recipientId: 'DRV-07',
    recipientName: 'Tsegaye Hailu',
    recipientType: 'driver',
    paymentRail: 'telebirr',
    grossAmountETB: 48000,
    platformMarginETB: 7200,
    taxWithheldETB: 960,
    netPayoutETB: 39840,
    status: 'released',
    updatedAt: '2 hours ago',
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
