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
    permissions: [
      'manage_modules',
      'manage_ride',
      'manage_freight',
      'manage_customers',
      'manage_finance',
      'manage_approvals',
      'manage_pricing_flags',
    ],
    scopeSummary: 'Full SuperApp governance, Cloud RPCs, FeatureFlags, escrow payouts & schemas',
  },
  {
    name: 'Sara Haile',
    email: 'sara.haile@afronala.com',
    role: 'Ride Manager',
    avatar: '',
    status: 'online',
    permissions: ['manage_ride', 'manage_customers', 'manage_approvals', 'manage_pricing_flags'],
    scopeSummary: 'Ride verifications, service activations, regional surge & mobility dispatch',
  },
  {
    name: 'Yonas Kebede',
    email: 'yonas.kebede@afronala.com',
    role: 'Freight Coordinator',
    avatar: '',
    status: 'online',
    permissions: ['manage_freight', 'manage_customers', 'manage_approvals'],
    scopeSummary: 'Vehicle Owner 1:1 fleets, TruckBooking bids, multi-truck loads & shippers',
  },
  {
    name: 'Tigist Mengistu',
    email: 'tigist.m@afronala.com',
    role: 'Finance Auditor',
    avatar: '',
    status: 'online',
    permissions: ['manage_finance'],
    scopeSummary: 'Freight escrow releases, driver/fleet payouts & Telebirr/CBE CSV audits',
  },
  {
    name: 'Meron Tadesse',
    email: 'meron.support@afronala.com',
    role: 'Support Analyst',
    avatar: '',
    status: 'online',
    permissions: ['manage_customers'],
    scopeSummary: 'Read-only SuperApp telemetry, SOS/dispute lookup & customer support notes',
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
