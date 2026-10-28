import {
  EastAfricaCountryCode,
  EastAfricaCurrency,
  NotificationCategory,
  NotificationItem,
  NotificationSeverity,
  NotificationType,
} from '../types';

export interface EastAfricaCountryNotificationMeta {
  code: EastAfricaCountryCode;
  name: string;
  flag: string;
  currency: EastAfricaCurrency;
  primaryCorridor: string;
  borderCheckpoints: string[];
  regulator: string;
  activeFleetCount: number;
}

export const EAST_AFRICA_NOTIFICATION_COUNTRIES: Record<
  Exclude<EastAfricaCountryCode, 'ALL'>,
  EastAfricaCountryNotificationMeta
> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    primaryCorridor: 'Addis Ababa - Modjo Dry Port - Adama Expressway',
    borderCheckpoints: ['Galafi (DJ-ET)', 'Moyale (ET-KE)', 'Metema (ET-SD)', 'Tog Wajaale (ET-SO)'],
    regulator: 'MOTRI & Federal Transport Authority (Bola)',
    activeFleetCount: 384,
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    primaryCorridor: 'Northern Corridor (Mombasa Port - Nairobi SGR - Malaba)',
    borderCheckpoints: ['Malaba (KE-UG)', 'Busia (KE-UG)', 'Namanga (KE-TZ)', 'Moyale (KE-ET)'],
    regulator: 'National Transport and Safety Authority (NTSA)',
    activeFleetCount: 295,
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    primaryCorridor: 'Northern Transit Corridor (Malaba OSBP - Kampala - Katuna)',
    borderCheckpoints: ['Malaba OSBP (UG-KE)', 'Busia (UG-KE)', 'Katuna (UG-RW)', 'Nimule (UG-SS)'],
    regulator: 'Ministry of Works & Transport (MoWT) / URA',
    activeFleetCount: 210,
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    primaryCorridor: 'Central Corridor (Rusumo OSBP - Kigali Logistics Platform)',
    borderCheckpoints: ['Rusumo OSBP (RW-TZ)', 'Gatuna (RW-UG)', 'Rubavu (RW-CD)', 'Nemba (RW-BI)'],
    regulator: 'Rwanda Utilities Regulatory Authority (RURA)',
    activeFleetCount: 165,
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    primaryCorridor: 'Central Corridor (Dar Port - Morogoro - Dodoma - Rusumo)',
    borderCheckpoints: ['Dar es Salaam Port Gate', 'Rusumo (TZ-RW)', 'Namanga (TZ-KE)', 'Tunduma (TZ-ZM)'],
    regulator: 'Land Transport Regulatory Authority (LATRA)',
    activeFleetCount: 240,
  },
  DJ: {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF',
    primaryCorridor: 'Doraleh Multipurpose Port - PK12 - Galafi Highway',
    borderCheckpoints: ['Galafi Checkpoint (DJ-ET)', 'PK12 Terminal', 'Doraleh SGTD Gate', 'Loyada (DJ-SO)'],
    regulator: 'Djibouti Ports & Free Zones Authority (DPFZA)',
    activeFleetCount: 180,
  },
  SO: {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD',
    primaryCorridor: 'Berbera Corridor (Berbera Port - Hargeisa - Tog Wajaale)',
    borderCheckpoints: ['Berbera Container Terminal', 'Tog Wajaale (SO-ET)', 'Mogadishu Port Gate', 'KM4 Perimeter'],
    regulator: 'Ministry of Transport & Civil Aviation (MOTCA)',
    activeFleetCount: 125,
  },
  SS: {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP',
    primaryCorridor: 'Juba - Nimule Trans-National Highway',
    borderCheckpoints: ['Nimule OSBP (SS-UG)', 'Juba River Port', 'Kaya Checkpoint', 'Juba Int. Airport Gate'],
    regulator: 'National Ministry of Transport (MoTR / SSRA)',
    activeFleetCount: 95,
  },
};

export const DEFAULT_EAST_AFRICA_NOTIFICATIONS: NotificationItem[] = [
  // 🇪🇹 Ethiopia
  {
    id: 'notif-et-01',
    title: 'Bole Corridor Midnight Surge & Fuel Benchmark Enforced',
    subtitle: 'MOTRI tariff ceiling applied at ETB 82.60/L fuel benchmark. 1.35x dynamic cap active for midnight Bole departures.',
    timeAgo: '4 min ago',
    timestamp: 'Today, 14:48 EAT',
    category: 'regulatory',
    read: false,
    type: 'corridor',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    corridor: 'Addis Ababa Bole International Corridor',
    severity: 'warning',
    targetModule: 'compliance',
    actionLabel: 'Inspect Fuel Benchmark',
    actionTab: 'compliance',
    sourceAuthority: 'MOTRI / Bola Transport Bureau',
    pinned: true,
  },
  {
    id: 'notif-et-02',
    title: 'Modjo Dry Port Freight Gate Backlog (18 Units Queued)',
    subtitle: 'Customs scanner maintenance causing 45-minute gate delays on bonded container haulers arriving via Adama Expressway.',
    timeAgo: '18 min ago',
    timestamp: 'Today, 14:34 EAT',
    category: 'dispatch',
    read: false,
    type: 'shipment',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    corridor: 'Modjo Dry Port - Adama Expressway',
    severity: 'critical',
    targetModule: 'truck',
    actionLabel: 'View Freight Radar',
    actionTab: 'truck',
    sourceAuthority: 'Ethiopian Customs Commission (ECC)',
  },
  {
    id: 'notif-et-03',
    title: 'Telebirr Real-Time Settlement Batch #ETB-9481 Cleared',
    subtitle: 'Net disbursement of ETB 184,500 successfully reconciled and credited to 64 verified ride drivers in Addis Ababa.',
    timeAgo: '42 min ago',
    timestamp: 'Today, 14:10 EAT',
    category: 'settlement',
    read: true,
    type: 'payment',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    corridor: 'National Payment Switch (EthSwitch)',
    severity: 'success',
    targetModule: 'settlements',
    actionLabel: 'View Settlement Hub',
    actionTab: 'settlements',
    sourceAuthority: 'Ethio Telecom & EthSwitch',
  },

  // 🇰🇪 Kenya
  {
    id: 'notif-ke-01',
    title: 'Northern Corridor (Mombasa - Malaba) Electronic Cargo Seal Alert',
    subtitle: 'NTSA & KRA Single Window flagging heavy freight convoy #KRA-229 for mandatory electronic seal verification at Mtito Andei.',
    timeAgo: '12 min ago',
    timestamp: 'Today, 14:40 EAT',
    category: 'dispatch',
    read: false,
    type: 'corridor',
    countryCode: 'KE',
    countryName: 'Kenya',
    corridor: 'Northern Corridor (Mombasa - Nairobi - Malaba)',
    severity: 'critical',
    targetModule: 'superapp-bidding',
    actionLabel: 'Check Cargo Escrow',
    actionTab: 'superapp-bidding',
    sourceAuthority: 'Kenya Revenue Authority (KRA) & NTSA',
    pinned: true,
  },
  {
    id: 'notif-ke-02',
    title: 'NTSA Speed Limiter & Digital Tachograph Compliance Notice',
    subtitle: 'Mandatory annual re-certification required for 14 fleet passenger vans registered in Nairobi & Nakuru counties.',
    timeAgo: '1 hour ago',
    timestamp: 'Today, 13:52 EAT',
    category: 'regulatory',
    read: false,
    type: 'vehicle',
    countryCode: 'KE',
    countryName: 'Kenya',
    corridor: 'Nairobi Expressway - Nakuru Highway',
    severity: 'warning',
    targetModule: 'compliance',
    actionLabel: 'Audit Vehicle Permits',
    actionTab: 'compliance',
    sourceAuthority: 'National Transport and Safety Authority (NTSA)',
  },
  {
    id: 'notif-ke-03',
    title: 'Safaricom M-PESA B2C API Payouts Synchronized',
    subtitle: 'Disbursed KES 492,000 to Kenyan cross-border drivers via M-PESA Daraja B2C corporate channel without packet loss.',
    timeAgo: '2 hours ago',
    timestamp: 'Today, 12:50 EAT',
    category: 'settlement',
    read: true,
    type: 'payment',
    countryCode: 'KE',
    countryName: 'Kenya',
    corridor: 'Safaricom Daraja API Settlement Rail',
    severity: 'info',
    targetModule: 'settlements',
    actionLabel: 'Verify M-PESA Ledgers',
    actionTab: 'settlements',
    sourceAuthority: 'Safaricom PLC',
  },

  // 🇺🇬 Uganda
  {
    id: 'notif-ug-01',
    title: 'Malaba OSBP One-Stop Customs Border Clearance Backlog',
    subtitle: 'Uganda Revenue Authority (URA) automated transit portal experienced a 20-minute latency spike; 12 trucks re-routed to Busia OSBP.',
    timeAgo: '25 min ago',
    timestamp: 'Today, 14:27 EAT',
    category: 'dispatch',
    read: false,
    type: 'shipment',
    countryCode: 'UG',
    countryName: 'Uganda',
    corridor: 'Northern Corridor (Malaba OSBP - Kampala)',
    severity: 'critical',
    targetModule: 'truck',
    actionLabel: 'Reroute In-Transit Haulers',
    actionTab: 'truck',
    sourceAuthority: 'Uganda Revenue Authority (URA)',
  },
  {
    id: 'notif-ug-02',
    title: 'MoWT Statutory Transport Licensing Board (TLB) Auto-Renewal',
    subtitle: '8 commercial minibuses operating Kampala - Jinja route received digital TLB vehicle badge renewals valid for Q2 2026.',
    timeAgo: '3 hours ago',
    timestamp: 'Today, 11:45 EAT',
    category: 'regulatory',
    read: true,
    type: 'driver',
    countryCode: 'UG',
    countryName: 'Uganda',
    corridor: 'Kampala Northern Bypass Transit Ring',
    severity: 'info',
    targetModule: 'compliance',
    actionLabel: 'Inspect MoWT Records',
    actionTab: 'compliance',
    sourceAuthority: 'Ministry of Works and Transport (MoWT)',
  },

  // 🇷🇼 Rwanda
  {
    id: 'notif-rw-01',
    title: 'Rusumo OSBP Heavy Axle Weight Calibration Mandatory',
    subtitle: 'RURA & Rwanda National Police enforcing electronic weigh-in-motion sensors for container trucks entering from Tanzania.',
    timeAgo: '35 min ago',
    timestamp: 'Today, 14:17 EAT',
    category: 'regulatory',
    read: false,
    type: 'corridor',
    countryCode: 'RW',
    countryName: 'Rwanda',
    corridor: 'Central Corridor (Rusumo OSBP - Kigali)',
    severity: 'warning',
    targetModule: 'geofences',
    actionLabel: 'Review Geofence Perimeter',
    actionTab: 'geofences',
    sourceAuthority: 'Rwanda Utilities Regulatory Authority (RURA)',
  },
  {
    id: 'notif-rw-02',
    title: 'Kigali Logistics Platform (KLP) Bonded Freight Cleared',
    subtitle: 'Cold-chain cargo shipment #RWA-7712 (pharmaceuticals) approved for onward transit to Rubavu / Goma border post.',
    timeAgo: '2 hours ago',
    timestamp: 'Today, 12:40 EAT',
    category: 'operations',
    read: true,
    type: 'shipment',
    countryCode: 'RW',
    countryName: 'Rwanda',
    corridor: 'Kigali Special Economic Zone (Masoro)',
    severity: 'info',
    targetModule: 'truck',
    actionLabel: 'Track Delivery ETA',
    actionTab: 'truck',
    sourceAuthority: 'Rwanda Revenue Authority (RRA)',
  },

  // 🇹🇿 Tanzania
  {
    id: 'notif-tz-01',
    title: 'Dar es Salaam Port Terminal 2 Container Gate Congestion',
    subtitle: 'LATRA issues 48-hour temporary transit parking permits along Morogoro Road to avoid gridlock for 30 inbound heavy flatbeds.',
    timeAgo: '50 min ago',
    timestamp: 'Today, 14:02 EAT',
    category: 'dispatch',
    read: false,
    type: 'corridor',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    corridor: 'Central Corridor (Dar Port - Morogoro - Dodoma)',
    severity: 'critical',
    targetModule: 'superapp-bidding',
    actionLabel: 'Review Fleet Allocations',
    actionTab: 'superapp-bidding',
    sourceAuthority: 'Land Transport Regulatory Authority (LATRA)',
  },
  {
    id: 'notif-tz-02',
    title: 'Tanzania Vodacom M-Pesa & Tigo Pesa Gateway Settlement',
    subtitle: 'Consolidated settlement batch #TZS-3318 (TZS 14,800,000) processed across Dar es Salaam ride & parcel providers.',
    timeAgo: '4 hours ago',
    timestamp: 'Today, 10:50 EAT',
    category: 'settlement',
    read: true,
    type: 'payment',
    countryCode: 'TZ',
    countryName: 'Tanzania',
    corridor: 'Bank of Tanzania TIPS Payment Clearing',
    severity: 'success',
    targetModule: 'settlements',
    actionLabel: 'View Tanzania Settlements',
    actionTab: 'settlements',
    sourceAuthority: 'Bank of Tanzania (BoT)',
  },

  // 🇩🇯 Djibouti
  {
    id: 'notif-dj-01',
    title: 'Doraleh Container Terminal (SGTD) Customs Document Verification',
    subtitle: 'Ethiopian-bound transit manifests held at PK12 gate for digital QR seal verification by Djibouti Customs Service.',
    timeAgo: '15 min ago',
    timestamp: 'Today, 14:37 EAT',
    category: 'dispatch',
    read: false,
    type: 'shipment',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    corridor: 'Doraleh Multipurpose Port - PK12 - Galafi Highway',
    severity: 'critical',
    targetModule: 'compliance',
    actionLabel: 'Verify Customs Documents',
    actionTab: 'compliance',
    sourceAuthority: 'Djibouti Ports and Free Zones Authority (DPFZA)',
  },
  {
    id: 'notif-dj-02',
    title: 'D-Money Cross-Border Transit Settlement Active',
    subtitle: 'Driver fuel voucher top-up completed for 22 Ethiopian-Djiboutian transit haulers via Djibouti Telecom D-Money wallet.',
    timeAgo: '3 hours ago',
    timestamp: 'Today, 11:30 EAT',
    category: 'settlement',
    read: true,
    type: 'payment',
    countryCode: 'DJ',
    countryName: 'Djibouti',
    corridor: 'Djibouti Telecom D-Money Rail',
    severity: 'info',
    targetModule: 'settlements',
    actionLabel: 'Audit D-Money Accounts',
    actionTab: 'settlements',
    sourceAuthority: 'Djibouti Telecom',
  },

  // 🇸🇴 Somalia
  {
    id: 'notif-so-01',
    title: 'Berbera Corridor Bulk Cargo Transit Permit Cleared',
    subtitle: 'DP World Berbera container freight pass verified for onward dispatch through Tog Wajaale border post into Eastern Ethiopia.',
    timeAgo: '1 hour ago',
    timestamp: 'Today, 13:45 EAT',
    category: 'operations',
    read: false,
    type: 'corridor',
    countryCode: 'SO',
    countryName: 'Somalia',
    corridor: 'Berbera Corridor (Berbera Port - Tog Wajaale)',
    severity: 'warning',
    targetModule: 'truck',
    actionLabel: 'Inspect Truck Manifest',
    actionTab: 'truck',
    sourceAuthority: 'Somaliland Ports & Customs Authority',
  },
  {
    id: 'notif-so-02',
    title: 'Telesom Zaad & Hormuud EVC Plus Payouts Operational',
    subtitle: 'USD 14,200 mobile disbursements verified for Mogadishu & Hargeisa last-mile logistics delivery partners.',
    timeAgo: '5 hours ago',
    timestamp: 'Today, 09:40 EAT',
    category: 'settlement',
    read: true,
    type: 'payment',
    countryCode: 'SO',
    countryName: 'Somalia',
    corridor: 'Central Bank of Somalia National Switch',
    severity: 'info',
    targetModule: 'settlements',
    actionLabel: 'View Zaad / EVC Records',
    actionTab: 'settlements',
    sourceAuthority: 'Central Bank of Somalia',
  },

  // 🇸🇸 South Sudan
  {
    id: 'notif-ss-01',
    title: 'Nimule - Juba Trans-National Highway Security Escort Alert',
    subtitle: 'Scheduled fuel tanker and humanitarian aid convoy departure confirmed for 15:30 EAT with South Sudan Police escort.',
    timeAgo: '8 min ago',
    timestamp: 'Today, 14:44 EAT',
    category: 'security',
    read: false,
    type: 'corridor',
    countryCode: 'SS',
    countryName: 'South Sudan',
    corridor: 'Juba - Nimule Trans-National Highway',
    severity: 'critical',
    targetModule: 'geofences',
    actionLabel: 'Track Convoy Perimeter',
    actionTab: 'geofences',
    sourceAuthority: 'South Sudan Ministry of Transport & SSRA',
    pinned: true,
  },
  {
    id: 'notif-ss-02',
    title: 'm-GURUSH Mobile Money Humanitarian Payout Batch',
    subtitle: 'SSP 8,400,000 allocated for driver per-diem and cross-border customs clearing fees at Nimule One-Stop Border Post.',
    timeAgo: '4 hours ago',
    timestamp: 'Today, 10:45 EAT',
    category: 'settlement',
    read: true,
    type: 'payment',
    countryCode: 'SS',
    countryName: 'South Sudan',
    corridor: 'm-GURUSH Cross-Border Payment Rail',
    severity: 'info',
    targetModule: 'settlements',
    actionLabel: 'Check m-GURUSH Balances',
    actionTab: 'settlements',
    sourceAuthority: 'Bank of South Sudan',
  },

  // 🛡️ Global Security & RBAC Governance
  {
    id: 'notif-sec-01',
    title: 'RBAC Security Audit: Super Admin Persona Switch',
    subtitle: 'Operator session changed from Fleet Dispatcher to Super Admin. Back4App LiveQuery channels re-authenticated.',
    timeAgo: '2 hours ago',
    timestamp: 'Today, 12:48 EAT',
    category: 'security',
    read: true,
    type: 'system',
    severity: 'security',
    targetModule: 'settings',
    actionLabel: 'Audit Security Logs',
    actionTab: 'settings',
    sourceAuthority: 'Afronala Security & Access Engine',
  },
  {
    id: 'notif-sys-01',
    title: 'Back4App Multi-Region BaaS Health Check: All 8 Nodes Online',
    subtitle: 'Server proxy verified 85ms median latency across Addis Ababa, Nairobi, Kampala, Kigali, Dar es Salaam, Djibouti, Mogadishu, and Juba gateways.',
    timeAgo: '3 hours ago',
    timestamp: 'Today, 11:55 EAT',
    category: 'system',
    read: true,
    type: 'system',
    severity: 'info',
    targetModule: 'superapp-diagnostics',
    actionLabel: 'View Bridge Diagnostics',
    actionTab: 'superapp-diagnostics',
    sourceAuthority: 'Back4App Parse Cloud Proxy',
  },
];

export interface NotificationFilterOptions {
  countryCode: EastAfricaCountryCode;
  category: string; // 'all' | NotificationCategory
  severity: string; // 'all' | NotificationSeverity
  status: 'all' | 'unread' | 'read';
  searchQuery: string;
}

export function filterNotifications(
  notifications: NotificationItem[],
  options: NotificationFilterOptions
): NotificationItem[] {
  return notifications.filter((item) => {
    // Country filter
    if (options.countryCode !== 'ALL') {
      if (item.countryCode && item.countryCode !== options.countryCode) {
        return false;
      }
      // If notification has no countryCode, only show it in 'ALL'
      if (!item.countryCode) {
        return false;
      }
    }

    // Category filter
    if (options.category !== 'all') {
      if (item.category !== options.category) {
        return false;
      }
    }

    // Severity filter
    if (options.severity !== 'all') {
      if (item.severity !== options.severity) {
        return false;
      }
    }

    // Status filter
    if (options.status === 'unread' && item.read) {
      return false;
    }
    if (options.status === 'read' && !item.read) {
      return false;
    }

    // Search query filter
    if (options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      const matchCorridor = item.corridor?.toLowerCase().includes(q) || false;
      const matchCountry = item.countryName?.toLowerCase().includes(q) || false;
      const matchAuth = item.sourceAuthority?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchSub && !matchCorridor && !matchCountry && !matchAuth) {
        return false;
      }
    }

    return true;
  });
}

export interface BroadcastAlertInput {
  title: string;
  subtitle: string;
  countryCode: EastAfricaCountryCode;
  corridor: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  targetModule?: string;
  actionLabel?: string;
  recipientAudience: 'all' | 'drivers' | 'shippers' | 'fleet_owners' | 'customs_agents';
  sourceAuthority?: string;
  broadcastBy?: string;
}

export function createBroadcastNotification(input: BroadcastAlertInput): NotificationItem {
  const countryMeta =
    input.countryCode !== 'ALL' ? EAST_AFRICA_NOTIFICATION_COUNTRIES[input.countryCode] : null;

  return {
    id: `notif-broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    timeAgo: 'Just now',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' EAT',
    category: input.category,
    read: false,
    type: 'broadcast',
    countryCode: input.countryCode,
    countryName: countryMeta ? countryMeta.name : 'Pan-East Africa',
    corridor: input.corridor.trim() || (countryMeta ? countryMeta.primaryCorridor : 'Regional Corridor Network'),
    severity: input.severity,
    targetModule: input.targetModule || 'dispatch',
    actionLabel: input.actionLabel || 'View Live Telematics',
    actionTab: input.targetModule || 'dispatch',
    sourceAuthority: input.sourceAuthority?.trim() || (countryMeta ? countryMeta.regulator : 'Afronala Central Dispatch Authority'),
    broadcastBy: input.broadcastBy || 'Operations Controller',
    recipientAudience: input.recipientAudience,
    pinned: input.severity === 'critical',
  };
}

export function exportNotificationsAsCsv(notifications: NotificationItem[]): string {
  const headers = [
    'ID',
    'Country Code',
    'Country Name',
    'Severity',
    'Category',
    'Title',
    'Description',
    'Corridor',
    'Source Authority',
    'Timestamp',
    'Read Status',
    'Target Module',
  ];

  const escapeCsv = (val: string | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = notifications.map((n) => [
    escapeCsv(n.id),
    escapeCsv(n.countryCode || 'PAN-EA'),
    escapeCsv(n.countryName || 'Pan-East Africa'),
    escapeCsv(n.severity || 'info'),
    escapeCsv(n.category),
    escapeCsv(n.title),
    escapeCsv(n.subtitle),
    escapeCsv(n.corridor || 'N/A'),
    escapeCsv(n.sourceAuthority || 'Afronala Command Hub'),
    escapeCsv(n.timestamp || n.timeAgo),
    escapeCsv(n.read ? 'READ' : 'UNREAD'),
    escapeCsv(n.targetModule || 'dispatch'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
