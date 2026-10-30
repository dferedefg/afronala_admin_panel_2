import {
  DriverWallet,
  EastAfricaCountryCode,
  EastAfricaCurrency,
  PaymentGateway,
  PaymentStatus,
  PaymentTransaction,
} from '../types';

export interface RegionalSettlementHub {
  countryCode: EastAfricaCountryCode;
  countryName: string;
  flag: string;
  currency: EastAfricaCurrency;
  currencySymbol: string;
  exchangeRateToETB: number;
  regulator: string;
  settlementCorridorNote?: string;
  gateways: {
    id: PaymentGateway;
    name: string;
    provider: string;
    type: 'mobile_money' | 'bank_transfer' | 'card_network' | 'cash';
    badgeColor: 'emerald' | 'cyan' | 'blue' | 'amber' | 'rose' | 'purple';
    settlementSpeed: string;
  }[];
}

export const EAST_AFRICA_HUBS: Record<string, RegionalSettlementHub> = {
  ET: {
    countryCode: 'ET',
    countryName: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    exchangeRateToETB: 1.0,
    regulator: 'National Bank of Ethiopia (NBE)',
    settlementCorridorNote: 'Domestic Hub & Modjo-Djibouti Export Gateway',
    gateways: [
      { id: 'telebirr', name: 'Telebirr', provider: 'Ethio Telecom', type: 'mobile_money', badgeColor: 'cyan', settlementSpeed: 'Instant IPN' },
      { id: 'cbe_birr', name: 'CBE Birr', provider: 'Commercial Bank of Ethiopia', type: 'bank_transfer', badgeColor: 'blue', settlementSpeed: 'Real-time RTGS' },
      { id: 'chapa', name: 'Chapa Pay', provider: 'Chapa Financial Technologies', type: 'card_network', badgeColor: 'emerald', settlementSpeed: 'T+0 Instant' },
      { id: 'cash', name: 'Cash on Hand', provider: 'In-Cab Driver Settlement', type: 'cash', badgeColor: 'amber', settlementSpeed: 'End of Shift' },
    ],
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    exchangeRateToETB: 0.95,
    regulator: 'Central Bank of Kenya (CBK)',
    settlementCorridorNote: 'Moyale–Marsabit–Nairobi Logistics Hub',
    gateways: [
      { id: 'mpesa_ke', name: 'Safaricom M-PESA', provider: 'Safaricom B2C & Paybill', type: 'mobile_money', badgeColor: 'emerald', settlementSpeed: 'Instant Daraja API' },
      { id: 'airtel_ke', name: 'Airtel Money Kenya', provider: 'Airtel Networks Kenya', type: 'mobile_money', badgeColor: 'rose', settlementSpeed: 'Instant API' },
    ],
  },
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    exchangeRateToETB: 0.033,
    regulator: 'Bank of Uganda (BoU)',
    settlementCorridorNote: 'Northern Corridor (Malaba–Kampala Route)',
    gateways: [
      { id: 'mtn_ug', name: 'MTN MoMo Uganda', provider: 'MTN Mobile Money Uganda', type: 'mobile_money', badgeColor: 'amber', settlementSpeed: 'Instant MoMo API' },
      { id: 'airtel_ug', name: 'Airtel Money Uganda', provider: 'Airtel Uganda Ltd', type: 'mobile_money', badgeColor: 'rose', settlementSpeed: 'Instant' },
    ],
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'FRw',
    exchangeRateToETB: 0.092,
    regulator: 'National Bank of Rwanda (BNR)',
    settlementCorridorNote: 'Kigali Logistics & E-Commerce Hub',
    gateways: [
      { id: 'mtn_rw', name: 'MTN MoMo Rwanda', provider: 'MTN Rwandacell PLC', type: 'mobile_money', badgeColor: 'amber', settlementSpeed: 'Instant MoMo Pay' },
      { id: 'airtel_rw', name: 'Airtel Money Rwanda', provider: 'Airtel Rwanda', type: 'mobile_money', badgeColor: 'rose', settlementSpeed: 'Instant' },
    ],
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    exchangeRateToETB: 0.046,
    regulator: 'Bank of Tanzania (BoT)',
    settlementCorridorNote: 'Dar es Salaam Maritime & Central Corridor',
    gateways: [
      { id: 'mpesa_tz', name: 'Vodacom M-Pesa', provider: 'Vodacom Tanzania', type: 'mobile_money', badgeColor: 'rose', settlementSpeed: 'Instant M-Pesa API' },
      { id: 'tigo_tz', name: 'Tigo Pesa', provider: 'Tigo Tanzania / Axian', type: 'mobile_money', badgeColor: 'blue', settlementSpeed: 'Instant' },
    ],
  },
  DJ: {
    countryCode: 'DJ',
    countryName: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    exchangeRateToETB: 0.70,
    regulator: 'Banque Centrale de Djibouti (BCD)',
    settlementCorridorNote: 'Modjo Dry Port – Port of Djibouti Bilateral Clearing Corridor',
    gateways: [
      { id: 'dmoney_dj', name: 'D-Money', provider: 'Djibouti Telecom', type: 'mobile_money', badgeColor: 'cyan', settlementSpeed: 'Instant D-Money API' },
    ],
  },
  SO: {
    countryCode: 'SO',
    countryName: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD',
    currencySymbol: '$',
    exchangeRateToETB: 125.0,
    regulator: 'Central Bank of Somalia (CBS)',
    settlementCorridorNote: 'Berbera & Mogadishu Trade Network',
    gateways: [
      { id: 'evc_plus_so', name: 'Hormuud EVC Plus', provider: 'Hormuud Telecom Somalia', type: 'mobile_money', badgeColor: 'emerald', settlementSpeed: 'Instant USSD/API' },
      { id: 'zaad_so', name: 'Telesom Zaad', provider: 'Telesom Somaliland', type: 'mobile_money', badgeColor: 'blue', settlementSpeed: 'Instant' },
    ],
  },
  SS: {
    countryCode: 'SS',
    countryName: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP',
    currencySymbol: 'SSP',
    exchangeRateToETB: 0.04,
    regulator: 'Bank of South Sudan (BSS)',
    settlementCorridorNote: 'Juba Transit & Nimule Border Corridor',
    gateways: [
      { id: 'mgurush_ss', name: 'm-GURUSH', provider: 'Trinity Technologies / Zain', type: 'mobile_money', badgeColor: 'emerald', settlementSpeed: 'Instant m-GURUSH API' },
    ],
  },
};

export const INITIAL_TRANSACTIONS: PaymentTransaction[] = [
  // Ethiopia (ET)
  {
    id: 'tx-101',
    reference: 'TB-ET-2026-88129',
    tripId: 'TRP9281',
    driverId: 'drv-1',
    driverName: 'Abebe Kebede',
    passengerName: 'Selamawit Bekele',
    grossFareETB: 340.00,
    platformCommissionETB: 51.00,
    withholdingTaxETB: 6.80,
    netDriverETB: 282.20,
    gateway: 'telebirr',
    countryCode: 'ET',
    currency: 'ETB',
    localAmount: 340.00,
    status: 'settled',
    timestamp: '10 min ago',
    settlementBatchId: 'BATCH-AA-041',
    channelDetails: 'Telebirr USSD *127# (0911****89)',
  },
  {
    id: 'tx-102',
    reference: 'CBE-BIRR-449102',
    tripId: 'TRP9283',
    driverId: 'drv-2',
    driverName: 'Almaz Tadesse',
    passengerName: 'Kidus Yohannes',
    grossFareETB: 480.00,
    platformCommissionETB: 72.00,
    withholdingTaxETB: 9.60,
    netDriverETB: 398.40,
    gateway: 'cbe_birr',
    countryCode: 'ET',
    currency: 'ETB',
    localAmount: 480.00,
    status: 'bank_verified',
    timestamp: '25 min ago',
    settlementBatchId: 'BATCH-AA-041',
    channelDetails: 'CBE Birr Wallet Debit (1000****45)',
    externalRefId: 'CBE-CORE-2026-90412',
    reconciledAt: '20 min ago',
    reconciledBy: 'Finance Ops Lead',
    reconciliationBank: 'Commercial Bank of Ethiopia',
    reconciliationNotes: 'Matched against daily settlement clearing file from CBE Core Banking portal.',
  },
  // Djibouti (DJ) — Modjo-Djibouti Bilateral Freight Corridor
  {
    id: 'tx-dj-201',
    reference: 'DJ-DMONEY-77192',
    tripId: 'DLV7721',
    driverId: 'drv-dj-1',
    driverName: 'Mohamed Abdillahi',
    passengerName: 'Djibouti Multimodal Transit SA',
    grossFareETB: 24500.00,
    platformCommissionETB: 3675.00,
    withholdingTaxETB: 490.00,
    netDriverETB: 20335.00,
    gateway: 'dmoney_dj',
    countryCode: 'DJ',
    currency: 'DJF',
    localAmount: 35000.00, // 35,000 DJF
    status: 'bank_verified',
    timestamp: '40 min ago',
    settlementBatchId: 'BATCH-DJ-018',
    channelDetails: 'D-Money Djibouti Telecom (*777#) Port Cleared',
    externalRefId: 'DJ-TEL-2026-00918',
    reconciledAt: '30 min ago',
    reconciledBy: 'Corridor Settlement Officer',
    reconciliationBank: 'Banque pour le Commerce et l’Industrie Mer Rouge (BCIMR)',
    reconciliationNotes: 'Verified against Modjo Dry Port Customs manifest and Djibouti container terminal gate pass.',
  },
  // Kenya (KE)
  {
    id: 'tx-ke-301',
    reference: 'SAF-MPESA-88491',
    tripId: 'TRP-NBO-102',
    driverId: 'drv-ke-1',
    driverName: 'Brian Kiprop',
    passengerName: 'Wanjiku Mwangi',
    grossFareETB: 1250.00,
    platformCommissionETB: 187.50,
    withholdingTaxETB: 25.00,
    netDriverETB: 1037.50,
    gateway: 'mpesa_ke',
    countryCode: 'KE',
    currency: 'KES',
    localAmount: 1315.00, // 1,315 KES
    status: 'settled',
    timestamp: '1 hour ago',
    settlementBatchId: 'BATCH-NBO-009',
    channelDetails: 'Safaricom M-PESA B2C Instant Paybill (254712****)',
  },
  // Uganda (UG)
  {
    id: 'tx-ug-401',
    reference: 'MTN-UG-99120',
    tripId: 'TRP-KLA-551',
    driverId: 'drv-ug-1',
    driverName: 'Ronald Okello',
    passengerName: 'Grace Namubiru',
    grossFareETB: 890.00,
    platformCommissionETB: 133.50,
    withholdingTaxETB: 17.80,
    netDriverETB: 738.70,
    gateway: 'mtn_ug',
    countryCode: 'UG',
    currency: 'UGX',
    localAmount: 26970.00, // 26,970 UGX
    status: 'settled',
    timestamp: '2 hours ago',
    settlementBatchId: 'BATCH-KLA-004',
    channelDetails: 'MTN Mobile Money Open API (256772****)',
  },
  // Rwanda (RW)
  {
    id: 'tx-rw-501',
    reference: 'MTN-RW-44182',
    tripId: 'TRP-KGL-209',
    driverId: 'drv-rw-1',
    driverName: 'Jean-Pierre Habimana',
    passengerName: 'Diane Uwase',
    grossFareETB: 940.00,
    platformCommissionETB: 141.00,
    withholdingTaxETB: 18.80,
    netDriverETB: 780.20,
    gateway: 'mtn_rw',
    countryCode: 'RW',
    currency: 'RWF',
    localAmount: 10217.00, // 10,217 RWF
    status: 'settled',
    timestamp: '3 hours ago',
    settlementBatchId: 'BATCH-KGL-002',
    channelDetails: 'MTN MoMo Rwanda Merchant Collection',
  },
  // Tanzania (TZ)
  {
    id: 'tx-tz-601',
    reference: 'VOD-TZ-11928',
    tripId: 'DLV-DAR-401',
    driverId: 'drv-tz-1',
    driverName: 'Juma Mwinyi',
    passengerName: 'Kilimanjaro Freight Forwarders',
    grossFareETB: 18200.00,
    platformCommissionETB: 2730.00,
    withholdingTaxETB: 364.00,
    netDriverETB: 15106.00,
    gateway: 'mpesa_tz',
    countryCode: 'TZ',
    currency: 'TZS',
    localAmount: 395650.00, // 395,650 TZS
    status: 'bank_verified',
    timestamp: '3 hours ago',
    settlementBatchId: 'BATCH-DAR-012',
    channelDetails: 'Vodacom M-Pesa Tanzania B2C Port Payout',
    externalRefId: 'TZ-CRDB-2026-9921',
    reconciledAt: '2 hours ago',
    reconciledBy: 'Maritime Port Auditor',
    reconciliationBank: 'CRDB Bank Tanzania',
  },
  // Somalia (SO)
  {
    id: 'tx-so-701',
    reference: 'EVC-SO-99281',
    tripId: 'DLV-MGQ-088',
    driverId: 'drv-so-1',
    driverName: 'Abdirahman Warsame',
    passengerName: 'Somali Logistics Clearing Agency',
    grossFareETB: 37500.00,
    platformCommissionETB: 5625.00,
    withholdingTaxETB: 750.00,
    netDriverETB: 31125.00,
    gateway: 'evc_plus_so',
    countryCode: 'SO',
    currency: 'USD',
    localAmount: 300.00, // $300 USD
    status: 'settled',
    timestamp: '4 hours ago',
    settlementBatchId: 'BATCH-MGQ-005',
    channelDetails: 'Hormuud EVC Plus (*712#) USD Mobile Wallet',
  },
  // South Sudan (SS)
  {
    id: 'tx-ss-801',
    reference: 'MGR-SS-77129',
    tripId: 'DLV-JUB-014',
    driverId: 'drv-ss-1',
    driverName: 'Peter Deng',
    passengerName: 'South Sudan Relief & Supply Co',
    grossFareETB: 14200.00,
    platformCommissionETB: 2130.00,
    withholdingTaxETB: 284.00,
    netDriverETB: 11786.00,
    gateway: 'mgurush_ss',
    countryCode: 'SS',
    currency: 'SSP',
    localAmount: 355000.00, // 355,000 SSP
    status: 'settled',
    timestamp: '5 hours ago',
    settlementBatchId: 'BATCH-JUB-001',
    channelDetails: 'm-GURUSH Mobile Money Juba Cross-Border Payout',
  },
  // Additional East Africa Corridor Cross-Border Transactions
  {
    id: 'tx-et-dj-corridor-1',
    reference: 'ETH-DJ-CB-2026-991',
    tripId: 'CORR-MODJO-DORALEH-44',
    driverId: 'drv-et-88',
    driverName: 'Tewodros Kassaye',
    passengerName: 'East Africa Multimodal Logistics SC',
    grossFareETB: 48500.00,
    platformCommissionETB: 7275.00,
    withholdingTaxETB: 970.00,
    netDriverETB: 40255.00,
    gateway: 'cbe_birr',
    countryCode: 'ET',
    currency: 'ETB',
    localAmount: 48500.00,
    status: 'bank_verified',
    timestamp: '1 hour ago',
    settlementBatchId: 'BATCH-CORR-ETDJ-08',
    channelDetails: 'CBE Birr Cross-Border Clearing · Galafi Customs Gateway',
    externalRefId: 'CBE-RTGS-MODJO-4412',
    reconciledAt: '45 min ago',
    reconciledBy: 'Freight Customs Auditor',
    reconciliationBank: 'Commercial Bank of Ethiopia',
    reconciliationNotes: 'Verified with Ethiopian Customs Commission and Port of Djibouti transit declaration.',
  },
  {
    id: 'tx-ke-et-corridor-2',
    reference: 'KE-ET-MOYALE-109',
    tripId: 'CORR-NBO-MOYALE-12',
    driverId: 'drv-ke-2',
    driverName: 'Ezekiel Omwamba',
    passengerName: 'Horn of Africa Trading Hub Ltd',
    grossFareETB: 28600.00,
    platformCommissionETB: 4290.00,
    withholdingTaxETB: 572.00,
    netDriverETB: 23738.00,
    gateway: 'mpesa_ke',
    countryCode: 'KE',
    currency: 'KES',
    localAmount: 30105.00,
    status: 'bank_verified',
    timestamp: '2 hours ago',
    settlementBatchId: 'BATCH-CORR-KEMOYALE-03',
    channelDetails: 'Safaricom M-PESA B2C Bulk Disbursement · Moyale OSBP',
    externalRefId: 'KRA-ETIMS-2026-8812',
    reconciledAt: '1 hour ago',
    reconciledBy: 'Regional Treasury Lead',
    reconciliationBank: 'Equity Bank Kenya',
    reconciliationNotes: 'Matched with Kenya Revenue Authority (KRA) eTIMS clearing sheet at Moyale border post.',
  },
  {
    id: 'tx-ug-ke-corridor-3',
    reference: 'UG-KE-MALABA-771',
    tripId: 'CORR-KLA-MALABA-301',
    driverId: 'drv-ug-2',
    driverName: 'Moses Kiggundu',
    passengerName: 'Great Lakes Agri-Transit Cooperative',
    grossFareETB: 32400.00,
    platformCommissionETB: 4860.00,
    withholdingTaxETB: 648.00,
    netDriverETB: 26892.00,
    gateway: 'mtn_ug',
    countryCode: 'UG',
    currency: 'UGX',
    localAmount: 981818.00,
    status: 'settled',
    timestamp: '3 hours ago',
    settlementBatchId: 'BATCH-CORR-UGMALABA-05',
    channelDetails: 'MTN MoMo Northern Corridor Transit Clearing · Malaba Border',
  },
  {
    id: 'tx-tz-rw-corridor-4',
    reference: 'TZ-RW-RUSUMO-552',
    tripId: 'CORR-DAR-RUSUMO-88',
    driverId: 'drv-tz-2',
    driverName: 'Rashid Bakari',
    passengerName: 'Rwanda Mines & Mineral Freight Ltd',
    grossFareETB: 41200.00,
    platformCommissionETB: 6180.00,
    withholdingTaxETB: 824.00,
    netDriverETB: 34196.00,
    gateway: 'mpesa_tz',
    countryCode: 'TZ',
    currency: 'TZS',
    localAmount: 895652.00,
    status: 'bank_verified',
    timestamp: '4 hours ago',
    settlementBatchId: 'BATCH-CORR-TZRUSUMO-02',
    channelDetails: 'Vodacom M-Pesa Tanzania Central Corridor Transit Settlement',
    externalRefId: 'TRA-VFD-2026-00918',
    reconciledAt: '3 hours ago',
    reconciledBy: 'Maritime Port Auditor',
    reconciliationBank: 'National Microfinance Bank (NMB Tanzania)',
    reconciliationNotes: 'Verified against TRA customs bond and Rusumo OSBP biometric weighbridge check.',
  },
  {
    id: 'tx-so-et-corridor-5',
    reference: 'SO-ET-BERBERA-331',
    tripId: 'CORR-JIJIGA-BERBERA-19',
    driverId: 'drv-so-2',
    driverName: 'Guled Jama',
    passengerName: 'Red Sea Livestock Exporters',
    grossFareETB: 31250.00,
    platformCommissionETB: 4687.50,
    withholdingTaxETB: 625.00,
    netDriverETB: 25937.50,
    gateway: 'evc_plus_so',
    countryCode: 'SO',
    currency: 'USD',
    localAmount: 250.00,
    status: 'settled',
    timestamp: '5 hours ago',
    settlementBatchId: 'BATCH-CORR-SOBERBERA-01',
    channelDetails: 'Hormuud EVC Plus USD Gateway · Tog Wajaale Clearance',
  },
  {
    id: 'tx-ss-ug-corridor-6',
    reference: 'SS-UG-NIMULE-402',
    tripId: 'CORR-JUBA-NIMULE-07',
    driverId: 'drv-ss-2',
    driverName: 'Gatluak Koang',
    passengerName: 'South Sudan Petroleum & Goods Transporters',
    grossFareETB: 26800.00,
    platformCommissionETB: 4020.00,
    withholdingTaxETB: 536.00,
    netDriverETB: 22244.00,
    gateway: 'mgurush_ss',
    countryCode: 'SS',
    currency: 'SSP',
    localAmount: 670000.00,
    status: 'settled',
    timestamp: '6 hours ago',
    settlementBatchId: 'BATCH-CORR-SSNIMULE-01',
    channelDetails: 'm-GURUSH Cross-Border Transit Settlement · Nimule Customs Post',
  },
  {
    id: 'tx-rw-kgl-ride-7',
    reference: 'RW-KGL-MOMO-8821',
    tripId: 'TRP-KGL-772',
    driverId: 'drv-rw-2',
    driverName: 'Emmanuel Nshimiyimana',
    passengerName: 'Alice Mukamana',
    grossFareETB: 620.00,
    platformCommissionETB: 93.00,
    withholdingTaxETB: 12.40,
    netDriverETB: 514.60,
    gateway: 'airtel_rw',
    countryCode: 'RW',
    currency: 'RWF',
    localAmount: 6739.00,
    status: 'settled',
    timestamp: '6 hours ago',
    settlementBatchId: 'BATCH-KGL-003',
    channelDetails: 'Airtel Money Rwanda Instant Ride Fare Debit',
  },
  {
    id: 'tx-ke-nbo-ride-8',
    reference: 'KE-AIR-NBO-4419',
    tripId: 'TRP-NBO-889',
    driverId: 'drv-ke-3',
    driverName: 'Faith Chebet',
    passengerName: 'Dennis Ochieng',
    grossFareETB: 780.00,
    platformCommissionETB: 117.00,
    withholdingTaxETB: 15.60,
    netDriverETB: 647.40,
    gateway: 'airtel_ke',
    countryCode: 'KE',
    currency: 'KES',
    localAmount: 821.00,
    status: 'settled',
    timestamp: '7 hours ago',
    settlementBatchId: 'BATCH-NBO-010',
    channelDetails: 'Airtel Money Kenya Ride Fare Clearing',
  },
];

export const INITIAL_WALLETS: DriverWallet[] = [
  {
    driverId: 'drv-1',
    driverName: 'Abebe Kebede',
    phone: '+251 91 123 4567',
    availableBalanceETB: 4850.50,
    pendingPayoutETB: 622.50,
    totalEarnedETB: 34200.00,
    totalCommissionPaidETB: 6035.00,
    preferredPayoutMethod: 'telebirr',
    payoutAccount: '0911234567',
    countryCode: 'ET',
    currency: 'ETB',
    lastPayoutDate: '2 days ago',
  },
  {
    driverId: 'drv-2',
    driverName: 'Almaz Tadesse',
    phone: '+251 92 234 5678',
    availableBalanceETB: 6120.00,
    pendingPayoutETB: 398.40,
    totalEarnedETB: 42150.00,
    totalCommissionPaidETB: 7438.00,
    preferredPayoutMethod: 'cbe_birr',
    payoutAccount: '1000189283748',
    countryCode: 'ET',
    currency: 'ETB',
    lastPayoutDate: 'Yesterday',
  },
  {
    driverId: 'drv-dj-1',
    driverName: 'Mohamed Abdillahi',
    phone: '+253 77 12 34 56',
    availableBalanceETB: 20335.00,
    pendingPayoutETB: 20335.00,
    totalEarnedETB: 88500.00,
    totalCommissionPaidETB: 13275.00,
    preferredPayoutMethod: 'dmoney_dj',
    payoutAccount: '+253 77 12 34 56 (D-Money)',
    countryCode: 'DJ',
    currency: 'DJF',
    lastPayoutDate: '3 days ago',
  },
  {
    driverId: 'drv-ke-1',
    driverName: 'Brian Kiprop',
    phone: '+254 71 234 5678',
    availableBalanceETB: 8420.00,
    pendingPayoutETB: 1037.50,
    totalEarnedETB: 54100.00,
    totalCommissionPaidETB: 8115.00,
    preferredPayoutMethod: 'mpesa_ke',
    payoutAccount: '254712345678 (M-PESA)',
    countryCode: 'KE',
    currency: 'KES',
    lastPayoutDate: 'Yesterday',
  },
  {
    driverId: 'drv-ug-1',
    driverName: 'Ronald Okello',
    phone: '+256 77 234 5678',
    availableBalanceETB: 5610.00,
    pendingPayoutETB: 738.70,
    totalEarnedETB: 39800.00,
    totalCommissionPaidETB: 5970.00,
    preferredPayoutMethod: 'mtn_ug',
    payoutAccount: '256772345678 (MTN MoMo)',
    countryCode: 'UG',
    currency: 'UGX',
    lastPayoutDate: '4 days ago',
  },
  {
    driverId: 'drv-rw-1',
    driverName: 'Jean-Pierre Habimana',
    phone: '+250 78 123 4567',
    availableBalanceETB: 6240.00,
    pendingPayoutETB: 780.20,
    totalEarnedETB: 41200.00,
    totalCommissionPaidETB: 6180.00,
    preferredPayoutMethod: 'mtn_rw',
    payoutAccount: '250781234567 (MoMo Rwanda)',
    countryCode: 'RW',
    currency: 'RWF',
    lastPayoutDate: 'Today, 08:30',
  },
  {
    driverId: 'drv-tz-1',
    driverName: 'Juma Mwinyi',
    phone: '+255 75 123 4567',
    availableBalanceETB: 15106.00,
    pendingPayoutETB: 15106.00,
    totalEarnedETB: 78400.00,
    totalCommissionPaidETB: 11760.00,
    preferredPayoutMethod: 'mpesa_tz',
    payoutAccount: '255751234567 (M-Pesa TZ)',
    countryCode: 'TZ',
    currency: 'TZS',
    lastPayoutDate: '3 days ago',
  },
  {
    driverId: 'drv-so-1',
    driverName: 'Abdirahman Warsame',
    phone: '+252 61 512 3456',
    availableBalanceETB: 31125.00,
    pendingPayoutETB: 31125.00,
    totalEarnedETB: 95400.00,
    totalCommissionPaidETB: 14310.00,
    preferredPayoutMethod: 'evc_plus_so',
    payoutAccount: '252615123456 (EVC Plus)',
    countryCode: 'SO',
    currency: 'USD',
    lastPayoutDate: '1 day ago',
  },
  {
    driverId: 'drv-ss-1',
    driverName: 'Peter Deng',
    phone: '+211 92 123 4567',
    availableBalanceETB: 11786.00,
    pendingPayoutETB: 11786.00,
    totalEarnedETB: 48900.00,
    totalCommissionPaidETB: 7335.00,
    preferredPayoutMethod: 'mgurush_ss',
    payoutAccount: '211921234567 (m-GURUSH)',
    countryCode: 'SS',
    currency: 'SSP',
    lastPayoutDate: '5 days ago',
  },
  // Additional Regional Fleet Drivers across East Africa
  {
    driverId: 'drv-et-3',
    driverName: 'Dawit Mengistu',
    phone: '+251 93 456 7890',
    availableBalanceETB: 7850.00,
    pendingPayoutETB: 890.00,
    totalEarnedETB: 51200.00,
    totalCommissionPaidETB: 8960.00,
    preferredPayoutMethod: 'chapa',
    payoutAccount: 'Chapa Merchant ID: CHP-M-9021',
    countryCode: 'ET',
    currency: 'ETB',
    lastPayoutDate: 'Yesterday, 16:30',
  },
  {
    driverId: 'drv-dj-2',
    driverName: 'Amina Gouled',
    phone: '+253 77 44 55 66',
    availableBalanceETB: 16800.00,
    pendingPayoutETB: 3200.00,
    totalEarnedETB: 64200.00,
    totalCommissionPaidETB: 9630.00,
    preferredPayoutMethod: 'dmoney_dj',
    payoutAccount: '+253 77 44 55 66 (D-Money Port Express)',
    countryCode: 'DJ',
    currency: 'DJF',
    lastPayoutDate: '2 days ago',
  },
  {
    driverId: 'drv-ke-2',
    driverName: 'Faith Chebet',
    phone: '+254 73 345 6789',
    availableBalanceETB: 6940.00,
    pendingPayoutETB: 647.40,
    totalEarnedETB: 47800.00,
    totalCommissionPaidETB: 7170.00,
    preferredPayoutMethod: 'airtel_ke',
    payoutAccount: '254733456789 (Airtel Money)',
    countryCode: 'KE',
    currency: 'KES',
    lastPayoutDate: 'Yesterday',
  },
  {
    driverId: 'drv-ug-2',
    driverName: 'Samuel Kateregga',
    phone: '+256 75 987 6543',
    availableBalanceETB: 9450.00,
    pendingPayoutETB: 1200.00,
    totalEarnedETB: 58200.00,
    totalCommissionPaidETB: 8730.00,
    preferredPayoutMethod: 'airtel_ug',
    payoutAccount: '256759876543 (Airtel Money UG)',
    countryCode: 'UG',
    currency: 'UGX',
    lastPayoutDate: '3 days ago',
  },
  {
    driverId: 'drv-rw-2',
    driverName: 'Aline Umutoni',
    phone: '+250 73 999 8888',
    availableBalanceETB: 5820.00,
    pendingPayoutETB: 514.60,
    totalEarnedETB: 38900.00,
    totalCommissionPaidETB: 5835.00,
    preferredPayoutMethod: 'airtel_rw',
    payoutAccount: '250739998888 (Airtel Money RW)',
    countryCode: 'RW',
    currency: 'RWF',
    lastPayoutDate: 'Today, 11:15',
  },
  {
    driverId: 'drv-tz-2',
    driverName: 'Rehema Juma',
    phone: '+255 71 888 9999',
    availableBalanceETB: 12450.00,
    pendingPayoutETB: 1800.00,
    totalEarnedETB: 69500.00,
    totalCommissionPaidETB: 10425.00,
    preferredPayoutMethod: 'tigo_tz',
    payoutAccount: '255718889999 (Tigo Pesa TZ)',
    countryCode: 'TZ',
    currency: 'TZS',
    lastPayoutDate: 'Yesterday',
  },
  {
    driverId: 'drv-so-2',
    driverName: 'Hodan Abdi',
    phone: '+252 63 412 7890',
    availableBalanceETB: 24600.00,
    pendingPayoutETB: 2500.00,
    totalEarnedETB: 81300.00,
    totalCommissionPaidETB: 12195.00,
    preferredPayoutMethod: 'zaad_so',
    payoutAccount: '252634127890 (Telesom Zaad USD)',
    countryCode: 'SO',
    currency: 'USD',
    lastPayoutDate: 'Today, 09:45',
  },
  {
    driverId: 'drv-ss-2',
    driverName: 'Emmanuel Lado',
    phone: '+211 91 555 4321',
    availableBalanceETB: 8900.00,
    pendingPayoutETB: 1400.00,
    totalEarnedETB: 43200.00,
    totalCommissionPaidETB: 6480.00,
    preferredPayoutMethod: 'mgurush_ss',
    payoutAccount: '211915554321 (m-GURUSH South Sudan)',
    countryCode: 'SS',
    currency: 'SSP',
    lastPayoutDate: '4 days ago',
  },
];

export interface CrossBorderCorridorClearing {
  id: string;
  name: string;
  fromCountry: EastAfricaCountryCode;
  toCountry: EastAfricaCountryCode;
  primaryRail: string;
  bilateralPair: string;
  exchangeRate: string;
  clearingSLA: string;
  activeEscrowVolumeETB: number;
  clearedTodayETB: number;
  status: 'active' | 'clearing' | 'audited';
  regulatoryFramework: string;
  keyGateways: string[];
}

export const EAST_AFRICA_CORRIDORS: CrossBorderCorridorClearing[] = [
  {
    id: 'corr-et-dj',
    name: 'Modjo Dry Port ⇄ Doraleh Multi-Purpose Port (Galafi Route)',
    fromCountry: 'ET',
    toCountry: 'DJ',
    primaryRail: 'CBE Birr ⇄ D-Money / BCIMR Bilateral Clearing',
    bilateralPair: 'ETB / DJF',
    exchangeRate: '1 DJF = 0.70 ETB',
    clearingSLA: 'T+0 Real-time Customs Escrow',
    activeEscrowVolumeETB: 485000,
    clearedTodayETB: 324500,
    status: 'active',
    regulatoryFramework: 'Ethiopian Customs Commission & DPFZA Free Zone Bilateral Accord',
    keyGateways: ['cbe_birr', 'dmoney_dj'],
  },
  {
    id: 'corr-ke-et',
    name: 'Moyale OSBP ⇄ Marsabit ⇄ Nairobi Commercial Freight Corridor',
    fromCountry: 'KE',
    toCountry: 'ET',
    primaryRail: 'Safaricom M-PESA ⇄ CBE Birr / EthSwitch Switch',
    bilateralPair: 'KES / ETB',
    exchangeRate: '1 KES = 0.95 ETB',
    clearingSLA: 'Instant Daraja B2C / RTGS',
    activeEscrowVolumeETB: 295000,
    clearedTodayETB: 182000,
    status: 'active',
    regulatoryFramework: 'Central Bank of Kenya (CBK) & NBE Cross-Border Settlement Framework',
    keyGateways: ['mpesa_ke', 'cbe_birr'],
  },
  {
    id: 'corr-ug-ke',
    name: 'Malaba OSBP ⇄ Tororo ⇄ Kampala Northern Transit Corridor',
    fromCountry: 'UG',
    toCountry: 'KE',
    primaryRail: 'MTN Mobile Money ⇄ Safaricom M-PESA Inter-Op',
    bilateralPair: 'UGX / KES',
    exchangeRate: '1 KES = 28.78 UGX (1 UGX = 0.033 ETB)',
    clearingSLA: 'Real-time EAC Regional Payment System (EAPS)',
    activeEscrowVolumeETB: 184000,
    clearedTodayETB: 126000,
    status: 'active',
    regulatoryFramework: 'Bank of Uganda & Central Bank of Kenya EAPS Clearing Grid',
    keyGateways: ['mtn_ug', 'mpesa_ke'],
  },
  {
    id: 'corr-tz-rw',
    name: 'Port of Dar es Salaam ⇄ Isaka Dry Port ⇄ Rusumo OSBP (Kigali)',
    fromCountry: 'TZ',
    toCountry: 'RW',
    primaryRail: 'Vodacom M-Pesa ⇄ MTN MoMo Rwanda / BNR Switch',
    bilateralPair: 'TZS / RWF',
    exchangeRate: '1 RWF = 2.00 TZS (1 TZS = 0.046 ETB)',
    clearingSLA: 'Instant Port Delivery Clearing',
    activeEscrowVolumeETB: 342000,
    clearedTodayETB: 219000,
    status: 'active',
    regulatoryFramework: 'Bank of Tanzania (BoT) & National Bank of Rwanda (BNR) Central Corridor Protocol',
    keyGateways: ['mpesa_tz', 'mtn_rw'],
  },
  {
    id: 'corr-so-et',
    name: 'Berbera Deepwater Port ⇄ Tog Wajaale ⇄ Jijiga Trade Route',
    fromCountry: 'SO',
    toCountry: 'ET',
    primaryRail: 'Hormuud EVC Plus / Telesom Zaad ⇄ Telebirr Cross-Border',
    bilateralPair: 'USD / ETB',
    exchangeRate: '1 USD = 125.00 ETB',
    clearingSLA: 'Instant Mobile Wallet USSD Clearing',
    activeEscrowVolumeETB: 520000,
    clearedTodayETB: 388000,
    status: 'active',
    regulatoryFramework: 'Central Bank of Somalia (CBS) & NBE Horn of Africa Trade Facilitation',
    keyGateways: ['evc_plus_so', 'zaad_so', 'telebirr'],
  },
  {
    id: 'corr-ss-ug',
    name: 'Nimule Customs Post ⇄ Juba River Port Transit Corridor',
    fromCountry: 'SS',
    toCountry: 'UG',
    primaryRail: 'm-GURUSH Mobile Money ⇄ MTN MoMo Uganda',
    bilateralPair: 'SSP / UGX',
    exchangeRate: '1 SSP = 0.04 ETB (1 USD = 2,800 SSP)',
    clearingSLA: 'Instant Humanitarian & Supply Route Clearing',
    activeEscrowVolumeETB: 165000,
    clearedTodayETB: 98000,
    status: 'active',
    regulatoryFramework: 'Bank of South Sudan (BSS) & Bank of Uganda Humanitarian Transit Clearance',
    keyGateways: ['mgurush_ss', 'mtn_ug'],
  },
];

export const COMMISSION_RATE = 0.15; // 15% Afronala Platform Take Rate
export const WITHHOLDING_TAX_RATE = 0.02; // 2% Statutory Withholding Tax

export function calculateFareSplit(
  grossFareETB: number,
  customCommissionRate: number = COMMISSION_RATE,
  customTaxRate: number = WITHHOLDING_TAX_RATE
) {
  const commission = Math.round(grossFareETB * customCommissionRate * 100) / 100;
  const tax = Math.round(grossFareETB * customTaxRate * 100) / 100;
  const netDriver = Math.round((grossFareETB - commission - tax) * 100) / 100;

  return {
    grossFareETB,
    platformCommissionETB: commission,
    withholdingTaxETB: tax,
    netDriverETB: netDriver,
  };
}

class PaymentSettlementService {
  private transactions: PaymentTransaction[] = [...INITIAL_TRANSACTIONS];
  private wallets: DriverWallet[] = [...INITIAL_WALLETS];

  getTransactions(): PaymentTransaction[] {
    return [...this.transactions];
  }

  getWallets(): DriverWallet[] {
    return [...this.wallets];
  }

  getWallet(driverId: string): DriverWallet | undefined {
    return this.wallets.find((w) => w.driverId === driverId);
  }

  processSettlement(
    tripId: string,
    driverId: string,
    driverName: string,
    passengerName: string,
    grossFareETB: number,
    gateway: PaymentGateway,
    customCommissionRate?: number,
    countryCode: EastAfricaCountryCode = 'ET'
  ): PaymentTransaction {
    const split = calculateFareSplit(grossFareETB, customCommissionRate ?? COMMISSION_RATE);
    const prefixMap: Record<PaymentGateway, string> = {
      telebirr: 'TB-ET-2026-',
      cbe_birr: 'CBE-BIRR-',
      chapa: 'CHP-CHG-',
      mpesa_ke: 'SAF-MPESA-',
      airtel_ke: 'AIR-KE-',
      mtn_ug: 'MTN-UG-',
      airtel_ug: 'AIR-UG-',
      mtn_rw: 'MTN-RW-',
      airtel_rw: 'AIR-RW-',
      mpesa_tz: 'VOD-TZ-',
      tigo_tz: 'TIG-TZ-',
      dmoney_dj: 'DJ-DMONEY-',
      evc_plus_so: 'EVC-SO-',
      zaad_so: 'ZAD-SO-',
      mgurush_ss: 'MGR-SS-',
      cash: 'CSH-REC-',
    };

    const hub = EAST_AFRICA_HUBS[countryCode] || EAST_AFRICA_HUBS.ET;
    const localAmount = Math.round((grossFareETB / hub.exchangeRateToETB) * 100) / 100;

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      reference: `${prefixMap[gateway] || 'TX-'}${Math.floor(10000 + Math.random() * 90000)}`,
      tripId,
      driverId,
      driverName,
      passengerName,
      grossFareETB: split.grossFareETB,
      platformCommissionETB: split.platformCommissionETB,
      withholdingTaxETB: split.withholdingTaxETB,
      netDriverETB: split.netDriverETB,
      gateway,
      countryCode,
      currency: hub.currency,
      localAmount,
      status: 'settled',
      timestamp: 'Just now',
      settlementBatchId: `BATCH-${countryCode}-042`,
      channelDetails: `${hub.countryName} Settlement Hub: ${gateway.toUpperCase()} (${hub.currency})`,
    };

    this.transactions = [newTx, ...this.transactions];

    // Update wallet
    const existingWallet = this.wallets.find((w) => w.driverId === driverId);
    if (existingWallet) {
      if (gateway === 'cash') {
        existingWallet.availableBalanceETB -= split.platformCommissionETB;
      } else {
        existingWallet.availableBalanceETB += split.netDriverETB;
      }
      existingWallet.totalEarnedETB += split.grossFareETB;
      existingWallet.totalCommissionPaidETB += split.platformCommissionETB;
    }

    return newTx;
  }

  disbursePayout(
    driverId: string,
    amountETB: number
  ): { success: boolean; message: string; txRef?: string } {
    const wallet = this.wallets.find((w) => w.driverId === driverId);
    if (!wallet) return { success: false, message: 'Driver wallet not found.' };
    if (wallet.availableBalanceETB < amountETB) {
      return { success: false, message: 'Insufficient wallet balance.' };
    }

    wallet.availableBalanceETB -= amountETB;
    wallet.lastPayoutDate = 'Just now';

    const countryCode = wallet.countryCode || 'ET';
    const hub = EAST_AFRICA_HUBS[countryCode] || EAST_AFRICA_HUBS.ET;

    const txRef = `${countryCode}-DISB-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      message: `Disbursed ETB ${amountETB.toLocaleString()} (${hub.countryName}) to ${wallet.driverName} via ${
        wallet.preferredPayoutMethod
      } [${wallet.payoutAccount}]`,
      txRef,
    };
  }

  simulateWebhook(
    gateway: PaymentGateway,
    amountETB: number,
    passenger: string,
    driverName: string,
    countryCode: EastAfricaCountryCode = 'ET'
  ) {
    const tripId = `TRP${Math.floor(1000 + Math.random() * 9000)}`;
    const driver =
      this.wallets.find((w) => w.driverName.toLowerCase().includes(driverName.toLowerCase())) ||
      this.wallets[0];

    return this.processSettlement(
      tripId,
      driver.driverId,
      driver.driverName,
      passenger,
      amountETB,
      gateway,
      COMMISSION_RATE,
      countryCode
    );
  }

  reconcileTransaction(
    txId: string,
    externalRefId: string,
    reconciliationNotes?: string,
    reconciledBy: string = 'Finance Auditor',
    reconciliationBank: string = 'Central Clearing Bank'
  ): { success: boolean; message: string; transaction?: PaymentTransaction } {
    const tx = this.transactions.find((t) => t.id === txId);
    if (!tx) return { success: false, message: 'Transaction not found.' };

    tx.status = 'bank_verified';
    tx.externalRefId = externalRefId;
    tx.reconciledAt = 'Just now';
    tx.reconciledBy = reconciledBy;
    tx.reconciliationNotes = reconciliationNotes;
    tx.reconciliationBank = reconciliationBank;

    return {
      success: true,
      message: `Transaction ${tx.reference} bank-verified with External Reference: ${externalRefId}.`,
      transaction: tx,
    };
  }
}

export const paymentSettlementService = new PaymentSettlementService();
