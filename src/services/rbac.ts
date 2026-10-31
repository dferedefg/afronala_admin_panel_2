import { AdminRole, AdminUser, DEFAULT_OPERATOR_NOTIF_PREFERENCES, PermissionAction } from '../types';

export interface AdminPersonaConfig extends AdminUser {
  role: AdminRole;
  permissions: PermissionAction[];
  scopeSummary: string;
}

export const DEMO_PERSONAS: AdminPersonaConfig[] = [
  {
    name: 'Daniel Ferede',
    email: 'daniel@afronala.com',
    role: 'Super Admin',
    avatar: '/src/assets/images/avatar_admin_daniel_1792851958392.jpg',
    status: 'online',
    jurisdictionCountry: 'ALL',
    defaultJurisdictionCountry: 'ALL',
    jurisdictionName: 'Pan-East Africa (8 Nations)',
    assignedCorridors: ['All Regional Corridors & Port Links'],
    phone: '+251 91 123 4567',
    operatorId: 'OP-ET-0001',
    dutyStation: 'Addis Ababa Central Telemetry & Dispatch Command',
    taxPin: 'TIN-ET-9948210',
    emergencyContact: '991 / 011-551-8292',
    dutyLanguage: 'Amharic / English',
    notificationPreferences: { ...DEFAULT_OPERATOR_NOTIF_PREFERENCES },
    permissions: [
      'manage_modules',
      'manage_ride',
      'manage_freight',
      'manage_customers',
      'manage_finance',
      'manage_approvals',
      'manage_pricing_flags',
    ],
    scopeSummary: 'Full SuperApp governance, Cloud RPCs, FeatureFlags, multi-country escrow & database schemas',
  },
  {
    name: 'Brian Ochieng',
    email: 'brian.o@afronala.com',
    role: 'Ride Manager',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'KE',
    jurisdictionName: 'Kenya & Northern Corridor',
    assignedCorridors: ['Mombasa - Nairobi SGR', 'Nairobi - Nakuru - Eldoret'],
    phone: '+254 712 345 678',
    operatorId: 'OP-KE-1024',
    dutyStation: 'Nairobi National Operations & SGR Intermodal Hub',
    taxPin: 'KRA-P051284910Z',
    emergencyContact: '999 / NTSA 0709 932 000',
    dutyLanguage: 'Swahili / English',
    permissions: ['manage_ride', 'manage_customers', 'manage_approvals', 'manage_pricing_flags'],
    scopeSummary: 'Ride verifications, NTSA speed limiter checks, dynamic surge & Safaricom M-PESA driver dispatch',
  },
  {
    name: 'Jean-Paul Habimana',
    email: 'jeanpaul.h@afronala.com',
    role: 'Freight Coordinator',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'RW',
    jurisdictionName: 'Rwanda, Burundi & DRC Link',
    assignedCorridors: ['Rusumo OSBP - Kigali KLP', 'Rubavu - Goma Corridor'],
    phone: '+250 788 123 456',
    operatorId: 'OP-RW-3081',
    dutyStation: 'Kigali Logistics Platform (KLP) & Green EV Hub',
    taxPin: 'RRA-TIN-10928341',
    emergencyContact: '112 / 912',
    dutyLanguage: 'Kinyarwanda / French / English',
    permissions: ['manage_freight', 'manage_customers', 'manage_approvals'],
    scopeSummary: 'RURA axle-load compliance, Vehicle Owner fleet bids, KLP bonded freight allocations',
  },
  {
    name: 'Amina Farah',
    email: 'amina.farah@afronala.com',
    role: 'Freight Coordinator',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'DJ',
    jurisdictionName: 'Djibouti & Red Sea Maritime Link',
    assignedCorridors: ['Doraleh Multipurpose Port - PK12 - Galafi Highway'],
    phone: '+253 77 12 34 56',
    operatorId: 'OP-DJ-4092',
    dutyStation: 'Doraleh Multipurpose Port (DMP) Clearing Command',
    taxPin: 'NIF-DJ-8812903',
    emergencyContact: '17 / 18',
    dutyLanguage: 'French / Somali / Arabic',
    permissions: ['manage_freight', 'manage_customers', 'manage_approvals'],
    scopeSummary: 'DPFZA container seals, heavy transit manifest audits & D-Money cross-border fuel vouchers',
  },
  {
    name: 'Tigist Mengistu',
    email: 'tigist.m@afronala.com',
    role: 'Finance Auditor',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'ALL',
    jurisdictionName: 'Pan-East Africa Clearing & Treasury',
    assignedCorridors: ['Cross-Border Payment Rails (Telebirr, M-PESA, MoMo, TIPS, D-Money)'],
    phone: '+251 91 234 5678',
    operatorId: 'OP-EAC-5001',
    dutyStation: 'Pan-East Africa Clearing & Treasury Operations Base',
    taxPin: 'EAC-FIN-7712093',
    emergencyContact: '+251 11 551 7170',
    dutyLanguage: 'English / Amharic / Swahili',
    permissions: ['manage_finance'],
    scopeSummary: 'Multi-currency settlement clearing, withholding tax reconciliations & daily bank RTGS batches',
  },
  {
    name: 'Meron Tadesse',
    email: 'meron.support@afronala.com',
    role: 'Support Analyst',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'ET',
    jurisdictionName: 'Ethiopia & Horn Operations',
    assignedCorridors: ['Addis Ababa Urban Grid', 'Modjo Dry Port Ring'],
    phone: '+251 92 345 6789',
    operatorId: 'OP-ET-2045',
    dutyStation: 'Addis Ababa Central Telemetry Post',
    taxPin: 'TIN-ET-4819203',
    emergencyContact: '991 / 907',
    dutyLanguage: 'Amharic / Oromo',
    permissions: ['manage_customers'],
    scopeSummary: 'Read-only SuperApp telemetry, customer ticket escalation & driver identity lookup',
  },
  {
    name: 'Joseph Mugisha',
    email: 'joseph.m@afronala.com',
    role: 'Ride Manager',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'UG',
    jurisdictionName: 'Uganda & Northern Transit',
    assignedCorridors: ['Malaba - Jinja - Kampala', 'Entebbe Expressway', 'Kampala - Katuna'],
    phone: '+256 772 123 456',
    operatorId: 'OP-UG-6012',
    dutyStation: 'Kampala Transit Telematics & Border Coordination Base',
    taxPin: 'URA-TIN-1002938471',
    emergencyContact: '999 / 112',
    dutyLanguage: 'Luganda / English',
    permissions: ['manage_ride', 'manage_customers', 'manage_approvals', 'manage_pricing_flags'],
    scopeSummary: 'Kampala urban mobility, SafeBoda fleet compliance, and MTN MoMo / Airtel Money driver payouts',
  },
  {
    name: 'Mwajuma Rashid',
    email: 'mwajuma.r@afronala.com',
    role: 'Freight Coordinator',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'TZ',
    jurisdictionName: 'Tanzania & Central Corridor',
    assignedCorridors: ['Port of Dar es Salaam - Isaka Dry Port', 'Dar - Tunduma (TAZARA)'],
    phone: '+255 754 123 456',
    operatorId: 'OP-TZ-7023',
    dutyStation: 'Port of Dar es Salaam Maritime Operations Center',
    taxPin: 'TRA-TIN-139-482-109',
    emergencyContact: '112 / 999',
    dutyLanguage: 'Swahili / English',
    permissions: ['manage_freight', 'manage_customers', 'manage_approvals'],
    scopeSummary: 'Port of Dar container drayage, LATRA licensing, and Vodacom M-Pesa / Tigo Pesa clearing',
  },
  {
    name: 'Hassan Jama',
    email: 'hassan.j@afronala.com',
    role: 'Ride Manager',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'SO',
    jurisdictionName: 'Somalia & Berbera Port Corridor',
    assignedCorridors: ['Berbera Port - Hargeisa - Tog Wajaale', 'Mogadishu K4 - Airport'],
    phone: '+252 61 512 3456',
    operatorId: 'OP-SO-8015',
    dutyStation: 'Mogadishu Airport Gate & Berbera Corridor Center',
    taxPin: 'MOTCA-SO-991204',
    emergencyContact: '888 / 999',
    dutyLanguage: 'Somali / Arabic / English',
    permissions: ['manage_ride', 'manage_customers', 'manage_approvals', 'manage_pricing_flags'],
    scopeSummary: 'Mogadishu mobility, DP World Berbera corridor drayage, and Hormuud EVC Plus / Zaad settlements',
  },
  {
    name: 'Peter Deng',
    email: 'peter.d@afronala.com',
    role: 'Freight Coordinator',
    avatar: '',
    status: 'online',
    jurisdictionCountry: 'SS',
    jurisdictionName: 'South Sudan & Lifeline Transit',
    assignedCorridors: ['Nimule Border - Juba Highway', 'Juba White Nile River Port'],
    phone: '+211 912 123 456',
    operatorId: 'OP-SS-9034',
    dutyStation: 'Nimule Customs Escort & Juba River Port Command',
    taxPin: 'SSRA-TIN-7710294',
    emergencyContact: '777 / 112',
    dutyLanguage: 'English / Arabic / Dinka',
    permissions: ['manage_freight', 'manage_customers', 'manage_approvals'],
    scopeSummary: 'Nimule border customs convoy tracking, White Nile river barge logistics, and m-GURUSH clearing',
  },
];

const ROLE_PERMISSION_MAP: Record<AdminRole, PermissionAction[]> = {
  'Super Admin': [
    'manage_modules',
    'manage_ride',
    'manage_freight',
    'manage_customers',
    'manage_finance',
    'manage_approvals',
    'manage_pricing_flags',
  ],
  'Ride Manager': ['manage_ride', 'manage_customers', 'manage_approvals', 'manage_pricing_flags'],
  'Freight Coordinator': ['manage_freight', 'manage_customers', 'manage_approvals'],
  'Finance Auditor': ['manage_finance'],
  'Support Analyst': ['manage_customers'],
};

export function hasPermission(role: string | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  const normalized = role as AdminRole;
  const perms = ROLE_PERMISSION_MAP[normalized];
  if (!perms) return role === 'Super Admin';
  return perms.includes(action);
}

export function getRequiredRolesLabel(action: PermissionAction): string {
  switch (action) {
    case 'manage_modules':
      return 'Super Admin';
    case 'manage_ride':
      return 'Super Admin or Ride Manager';
    case 'manage_freight':
      return 'Super Admin or Freight Coordinator';
    case 'manage_customers':
      return 'Super Admin, Ride Manager, Freight Coordinator, or Support Analyst';
    case 'manage_finance':
      return 'Super Admin or Finance Auditor';
    case 'manage_approvals':
      return 'Super Admin, Ride Manager, or Freight Coordinator';
    case 'manage_pricing_flags':
      return 'Super Admin or Ride Manager';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Generates and downloads an RFC-4180 compliant UTF-8 CSV file in the browser
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
