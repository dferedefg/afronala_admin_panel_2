import { AdminRole, AdminUser, PermissionAction } from '../types';

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
    jurisdictionName: 'Pan-East Africa (8 Nations)',
    assignedCorridors: ['All Regional Corridors & Port Links'],
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
    permissions: ['manage_customers'],
    scopeSummary: 'Read-only SuperApp telemetry, customer ticket escalation & driver identity lookup',
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
