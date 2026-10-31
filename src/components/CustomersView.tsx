import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Phone,
  Mail,
  Building2,
  X,
  CheckCircle2,
  Trash2,
  Lock,
  FileText,
  ArrowUpRight,
  Globe2,
  CreditCard,
  MapPin,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  Truck,
  Compass,
} from 'lucide-react';
import {
  CustomerAccount,
  CustomerAccountStatus,
  CustomerAccountType,
  EastAfricaCountryCode,
  EastAfricaCurrency,
  PermissionAction,
  Shipment,
  Trip,
} from '../types';
import { downloadCsv, hasPermission } from '../services/rbac';
import { EAST_AFRICAN_COUNTRIES_META, EastAfricaCountryMeta } from '../services/eastAfricaModules';

export interface CustomersViewProps {
  darkMode: boolean;
  customers: CustomerAccount[];
  trips: Trip[];
  shipments: Shipment[];
  userRole: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  currentUserName?: string;
  currentUserEmail?: string;
  onAddCustomer: (customer: Omit<CustomerAccount, 'objectId' | 'customerId'>) => Promise<void>;
  onUpdateCustomer: (customerId: string, updates: Partial<CustomerAccount>) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  onNotify: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
}

// Country-specific metadata for registration & formatting
interface CountryFormConfig {
  code: Exclude<EastAfricaCountryCode, 'ALL'>;
  name: string;
  flag: string;
  currency: EastAfricaCurrency;
  currencySymbol: string;
  phonePrefix: string;
  phonePlaceholder: string;
  taxLabel: string;
  taxPlaceholder: string;
  paymentRail: string;
  sampleCities: string[];
  defaultCorridor: string;
}

const COUNTRY_FORM_CONFIGS: Record<Exclude<EastAfricaCountryCode, 'ALL'>, CountryFormConfig> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    phonePrefix: '+251',
    phonePlaceholder: '0911 234 567',
    taxLabel: 'ERCA Ministry of Revenues TIN',
    taxPlaceholder: 'TIN-0048192031',
    paymentRail: 'Telebirr & CBE Birr',
    sampleCities: ['Addis Ababa (Bole)', 'Addis Ababa (CMC)', 'Modjo Dry Port', 'Kality Industrial', 'Hawassa'],
    defaultCorridor: 'Addis Ababa - Modjo Dry Port - Galafi Corridor',
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    phonePrefix: '+254',
    phonePlaceholder: '+254 712 345 678',
    taxLabel: 'Kenya Revenue Authority (KRA) PIN',
    taxPlaceholder: 'P051283940A',
    paymentRail: 'Safaricom M-PESA',
    sampleCities: ['Nairobi (Westlands)', 'Nairobi (Upper Hill)', 'Mombasa Port Terminal', 'Thika Industrial Hub', 'Eldoret'],
    defaultCorridor: 'Mombasa Port - Nairobi SGR - Malaba Northern Corridor',
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    phonePrefix: '+256',
    phonePlaceholder: '+256 772 345 678',
    taxLabel: 'Uganda Revenue Authority (URA) TIN',
    taxPlaceholder: '1000284719',
    paymentRail: 'MTN Mobile Money & Airtel Money',
    sampleCities: ['Kampala (Kololo)', 'Kampala (8th Street)', 'Namanve Industrial Park', 'Entebbe', 'Jinja'],
    defaultCorridor: 'Malaba - Jinja - Kampala - Katuna Transit',
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'FRw',
    phonePrefix: '+250',
    phonePlaceholder: '+250 788 123 456',
    taxLabel: 'Rwanda Revenue Authority (RRA) TIN',
    taxPlaceholder: '100019284',
    paymentRail: 'MTN MoMo Rwanda & Airtel Money',
    sampleCities: ['Kigali (Kimihurura)', 'Kigali (Masoro SEZ)', 'Masaka SEZ', 'Nyarutarama', 'Rubavu'],
    defaultCorridor: 'Rusumo OSBP - Kigali KLP - Rubavu Corridor',
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    phonePrefix: '+255',
    phonePlaceholder: '+255 754 123 456',
    taxLabel: 'Tanzania Revenue Authority (TRA) TIN',
    taxPlaceholder: '102-948-192',
    paymentRail: 'Vodacom M-Pesa & Tigo Pesa',
    sampleCities: ['Dar es Salaam (Masaki)', 'Port of Dar (Kurasini)', 'Dar Industrial Area', 'Arusha Clocktower', 'Dodoma'],
    defaultCorridor: 'Port of Dar es Salaam - Morogoro - Dodoma - Isaka',
  },
  DJ: {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    phonePrefix: '+253',
    phonePlaceholder: '+253 77 123 456',
    taxLabel: 'Direction des Impôts (DPFZA / NIF)',
    taxPlaceholder: '0019284A',
    paymentRail: 'D-Money (Djibouti Telecom)',
    sampleCities: ['Djibouti City (Plateau)', 'Doraleh Port (PK12)', 'Djibouti City (Haramous)', 'Venise Road Depot', 'Galafi'],
    defaultCorridor: 'Doraleh Port (DMP) - PK12 - Galafi Border Highway',
  },
  SO: {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD',
    currencySymbol: '$',
    phonePrefix: '+252',
    phonePlaceholder: '+252 61 234 5678',
    taxLabel: 'Ministry of Finance Somalia (MoF) TIN',
    taxPlaceholder: 'SO-849102',
    paymentRail: 'Hormuud EVC Plus & Telesom Zaad',
    sampleCities: ['Mogadishu (KM4 / Waberi)', 'Mogadishu (Bakara Market)', 'Mogadishu Port Marine Terminal', 'Hodan', 'Berbera'],
    defaultCorridor: 'Mogadishu Port - Afgooye - Baidoa / Berbera Link',
  },
  SS: {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP',
    currencySymbol: 'SS£',
    phonePrefix: '+211',
    phonePlaceholder: '+211 92 123 4567',
    taxLabel: 'National Revenue Authority (NRA) TIN',
    taxPlaceholder: 'SS-991824',
    paymentRail: 'm-GURUSH Mobile Money',
    sampleCities: ['Juba (Hai Cinema)', 'Juba (Gumbo Customs)', 'Juba (Nesitu Depot)', 'Juba River Port (Konyo Konyo)', 'Nimule'],
    defaultCorridor: 'Nimule Border Post - Juba River Port Gateway',
  },
};

const EAST_AFRICA_ORDERED_CODES: Array<Exclude<EastAfricaCountryCode, 'ALL'>> = [
  'ET',
  'KE',
  'UG',
  'RW',
  'TZ',
  'DJ',
  'SO',
  'SS',
];

export const CustomersView: React.FC<CustomersViewProps> = ({
  darkMode,
  customers,
  trips,
  shipments,
  userRole,
  userJurisdiction = 'ALL',
  userJurisdictionName = 'Pan-East Africa',
  currentUserName = 'Operator',
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onNotify,
  onGuardPermission,
}) => {
  // Determine operator's primary home country (ET if ALL or not specified)
  const operatorCountry: Exclude<EastAfricaCountryCode, 'ALL'> =
    userJurisdiction && userJurisdiction !== 'ALL'
      ? (userJurisdiction as Exclude<EastAfricaCountryCode, 'ALL'>)
      : 'ET';

  // Active country filter tab: default to the logged in user's country of operation!
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(() => {
    return userJurisdiction || 'ALL';
  });

  // When operator switches persona or logs in with another country, keep in sync
  useEffect(() => {
    if (userJurisdiction) {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'passenger' | 'corporate' | 'suspended'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  // Add Customer modal form state
  const [newCustomerCountry, setNewCustomerCountry] = useState<Exclude<EastAfricaCountryCode, 'ALL'>>(
    operatorCountry
  );
  const [newCustomer, setNewCustomer] = useState<{
    name: string;
    phone: string;
    email: string;
    accountType: CustomerAccountType;
    companyTin: string;
    status: CustomerAccountStatus;
    city: string;
    notes: string;
  }>({
    name: '',
    phone: '',
    email: '',
    accountType: 'Ride Passenger',
    companyTin: '',
    status: 'Active',
    city: '',
    notes: '',
  });

  const canManageCustomers = hasPermission(userRole, 'manage_customers');

  // Country counts map
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: customers.length };
    EAST_AFRICA_ORDERED_CODES.forEach((c) => {
      counts[c] = 0;
    });
    customers.forEach((c) => {
      const code = c.countryCode || 'ET';
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [customers]);

  // Scoped list based on active country tab
  const countryScoped = useMemo(() => {
    if (selectedCountry === 'ALL') return customers;
    return customers.filter((c) => (c.countryCode || 'ET') === selectedCountry);
  }, [customers, selectedCountry]);

  // Filtered by search & segment tab
  const filtered = useMemo(() => {
    return countryScoped.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.countryName && c.countryName.toLowerCase().includes(q)) ||
        (c.paymentRail && c.paymentRail.toLowerCase().includes(q)) ||
        (c.companyTin && c.companyTin.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (filterTab === 'passenger') return c.accountType === 'Ride Passenger';
      if (filterTab === 'corporate') return c.accountType === 'Corporate Shipper';
      if (filterTab === 'suspended') return c.status === 'Suspended';
      return true;
    });
  }, [countryScoped, search, filterTab]);

  // Aggregate metrics for active scope
  const totalInScope = countryScoped.length;
  const corporateCountInScope = countryScoped.filter((c) => c.accountType === 'Corporate Shipper').length;
  const totalTripsCountInScope = countryScoped.reduce((sum, c) => sum + (c.tripsCount || 0), 0);
  const totalLifetimeETBInScope = countryScoped.reduce((sum, c) => sum + (c.totalSpentETB || 0), 0);

  // If a single country is selected, calculate total local currency volume
  const selectedCountryMeta = selectedCountry !== 'ALL' ? EAST_AFRICAN_COUNTRIES_META[selectedCountry] : null;
  const totalLocalSpend = useMemo(() => {
    if (selectedCountry === 'ALL') return null;
    return countryScoped.reduce((sum, c) => sum + (c.totalSpentLocal || c.totalSpentETB || 0), 0);
  }, [countryScoped, selectedCountry]);

  const handleOpenAddModal = () => {
    if (!onGuardPermission('manage_customers', 'Registering customer accounts')) return;
    // Default the modal to the currently filtered country or operator's country
    const defaultCountry = selectedCountry !== 'ALL' ? selectedCountry : operatorCountry;
    setNewCustomerCountry(defaultCountry);
    const formCfg = COUNTRY_FORM_CONFIGS[defaultCountry];
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      accountType: 'Ride Passenger',
      companyTin: '',
      status: 'Active',
      city: formCfg.sampleCities[0] || '',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleCountrySelectChange = (code: Exclude<EastAfricaCountryCode, 'ALL'>) => {
    setNewCustomerCountry(code);
    const formCfg = COUNTRY_FORM_CONFIGS[code];
    setNewCustomer((prev) => ({
      ...prev,
      city: formCfg.sampleCities[0] || '',
      phone: prev.phone ? prev.phone : '',
    }));
  };

  const handleSelectCustomer = (c: CustomerAccount) => {
    setSelectedCustomer(c);
    setNotesDraft(c.notes || '');
    setConfirmDeleteId(null);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onGuardPermission('manage_customers', 'Creating customer accounts')) return;

    const formCfg = COUNTRY_FORM_CONFIGS[newCustomerCountry];
    const statusToSave: CustomerAccountStatus =
      newCustomer.accountType === 'Corporate Shipper' && newCustomer.status === 'Active'
        ? 'Corporate'
        : newCustomer.status;

    await onAddCustomer({
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      email: newCustomer.email.trim(),
      accountType: newCustomer.accountType,
      companyTin:
        newCustomer.accountType === 'Corporate Shipper'
          ? newCustomer.companyTin.trim() || `${formCfg.code}-TAX-${Math.floor(100000 + Math.random() * 899999)}`
          : undefined,
      taxNumberLabel: formCfg.taxLabel,
      tripsCount: 0,
      totalSpentETB: 0,
      totalSpentLocal: 0,
      currency: formCfg.currency,
      countryCode: formCfg.code,
      countryName: formCfg.name,
      city: newCustomer.city.trim() || formCfg.sampleCities[0],
      paymentRail: formCfg.paymentRail,
      corridor: formCfg.defaultCorridor,
      status: statusToSave,
      notes: newCustomer.notes.trim() || `Registered via Afronala Control Center (${formCfg.name} Desk)`,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    });

    setShowAddModal(false);
    onNotify(
      'Account Registered',
      `${newCustomer.name} created under ${formCfg.name} (${formCfg.code}) jurisdiction.`,
      'success'
    );
  };

  const handleStatusChange = async (customer: CustomerAccount, nextStatus: CustomerAccountStatus) => {
    if (!onGuardPermission('manage_customers', 'Updating customer account status')) return;
    await onUpdateCustomer(customer.customerId, { status: nextStatus });
    setSelectedCustomer((prev) =>
      prev && prev.customerId === customer.customerId ? { ...prev, status: nextStatus } : prev
    );
    onNotify('Status Updated', `${customer.name} status updated to ${nextStatus}.`, 'info');
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    if (!onGuardPermission('manage_customers', 'Updating customer account notes')) return;
    await onUpdateCustomer(selectedCustomer.customerId, { notes: notesDraft });
    setSelectedCustomer({ ...selectedCustomer, notes: notesDraft });
    onNotify('Notes Saved', `Operational notes updated for ${selectedCustomer.name}.`, 'success');
  };

  const handleConfirmDelete = async (customerId: string) => {
    if (!onGuardPermission('manage_customers', 'Deleting customer records')) return;
    await onDeleteCustomer(customerId);
    setConfirmDeleteId(null);
    setSelectedCustomer(null);
    onNotify('Account Deleted', 'Customer account was permanently removed from active registry.', 'warning');
  };

  const handleExportCsv = () => {
    const scopeLabel = selectedCountry === 'ALL' ? 'pan_east_africa' : selectedCountry.toLowerCase();
    downloadCsv(
      `afronala_customers_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Customer ID',
        'Country Code',
        'Country Name',
        'Name / Entity',
        'Account Type',
        'City / Hub',
        'Corridor',
        'Tax ID Label',
        'Company Tax Number',
        'Phone',
        'Email',
        'Payment Rail',
        'Completed Runs',
        'Total Spent (Local)',
        'Currency',
        'Total Spent (ETB)',
        'Status',
        'Joined Date',
        'Notes',
      ],
      filtered.map((c) => [
        c.customerId,
        c.countryCode || 'ET',
        c.countryName || 'Ethiopia',
        c.name,
        c.accountType,
        c.city || '',
        c.corridor || '',
        c.taxNumberLabel || '',
        c.companyTin || '',
        c.phone,
        c.email,
        c.paymentRail || '',
        c.tripsCount,
        c.totalSpentLocal != null ? c.totalSpentLocal.toFixed(2) : c.totalSpentETB.toFixed(2),
        c.currency || 'ETB',
        c.totalSpentETB.toFixed(2),
        c.status,
        c.joinedDate,
        c.notes || '',
      ])
    );
    onNotify(
      'Directory Exported',
      `Exported ${filtered.length} records (${selectedCountry === 'ALL' ? 'All East Africa' : selectedCountry}) as UTF-8 CSV.`,
      'success'
    );
  };

  const getStatusTextClass = (status: CustomerAccountStatus) => {
    switch (status) {
      case 'Active':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'Corporate':
        return 'text-blue-700 dark:text-blue-400';
      case 'Suspended':
        return 'text-rose-700 dark:text-rose-400';
    }
  };

  // Linked activity from trips and shipments
  const linkedTrips = selectedCustomer
    ? trips.filter(
        (t) =>
          t.passenger.toLowerCase().includes(selectedCustomer.name.split(' ')[0].toLowerCase()) ||
          (t.passengerPhone && t.passengerPhone === selectedCustomer.phone) ||
          (selectedCustomer.countryCode && t.countryCode === selectedCustomer.countryCode)
      ).slice(0, 3)
    : [];

  const linkedShipments =
    selectedCustomer?.accountType === 'Corporate Shipper'
      ? shipments.filter(
          (s) =>
            (selectedCustomer.countryCode && s.countryCode === selectedCustomer.countryCode) ||
            s.cargoType.toLowerCase().includes(selectedCustomer.name.split(' ')[0].toLowerCase())
        ).slice(0, 3)
      : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              East Africa SuperApp Operations
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Globe2 className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
              <span>Back4App Parse Multi-Country Directory</span>
            </span>
            {!canManageCustomers && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Read-Only ({userRole})</span>
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Customers &amp; Corporate Shippers
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Full directory of verified passengers and corporate freight shippers across all 8 East African nations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            title={`Download CSV of ${filtered.length} displayed accounts`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            {canManageCustomers ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Register Customer / Shipper</span>
          </button>
        </div>
      </div>

      {/* Operator Jurisdiction Context Card */}
      <div className="p-4 rounded-xl border border-cyan-200/80 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-50/70 via-white to-blue-50/50 dark:from-cyan-950/20 dark:via-slate-900 dark:to-blue-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 text-xl font-bold">
            {userJurisdiction && userJurisdiction !== 'ALL'
              ? EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.flag || '🌍'
              : '🌍'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                Logged In Operator Scope
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800">
                {userJurisdictionName || 'Pan-East Africa'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                ({currentUserName} · {userRole})
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              {userJurisdiction && userJurisdiction !== 'ALL' ? (
                <>
                  Operating under <strong>{EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.name}</strong> national regulatory
                  standing ({EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.shortRegulator}). Accounts are tailored to local mobile money rails ({EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.primaryPaymentRail}).
                </>
              ) : (
                <>
                  Authorized with <strong>Regional Pan-East Africa Clearing &amp; Governance</strong> across all 8 member states.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-cyan-100 dark:border-cyan-900/40">
          {userJurisdiction && userJurisdiction !== 'ALL' && selectedCountry !== userJurisdiction && (
            <button
              type="button"
              onClick={() => setSelectedCountry(userJurisdiction)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <span>Focus My Station ({EAST_AFRICAN_COUNTRIES_META[userJurisdiction]?.flag} {userJurisdiction})</span>
            </button>
          )}

          {selectedCountry !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedCountry('ALL')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Globe2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>View All 8 Nations</span>
            </button>
          )}
        </div>
      </div>

      {/* East African Country Switcher Tabs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
          <span className="font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Select Country of Operation:</span>
          </span>
          <span className="text-[11px] font-mono">
            {totalInScope} accounts in active view
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* All East Africa Tab */}
          <button
            type="button"
            onClick={() => setSelectedCountry('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 border ${
              selectedCountry === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm ring-2 ring-cyan-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <span className="text-sm">🌍</span>
            <span>All East Africa</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                selectedCountry === 'ALL'
                  ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {countryCounts.ALL || 0}
            </span>
          </button>

          {/* 8 East African Member Countries */}
          {EAST_AFRICA_ORDERED_CODES.map((code) => {
            const meta = EAST_AFRICAN_COUNTRIES_META[code];
            const isSelected = selectedCountry === code;
            const isUserHome = userJurisdiction === code;
            const count = countryCounts[code] || 0;

            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedCountry(code)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 border relative ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-sm">{meta.flag}</span>
                <span>{meta.name}</span>
                {isUserHome && (
                  <span
                    title="Your Assigned Jurisdiction"
                    className="px-1 py-0.2 rounded text-[9px] uppercase tracking-wider font-bold bg-amber-400 text-slate-950 dark:bg-amber-300 dark:text-slate-950"
                  >
                    You
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-cyan-700 text-white dark:bg-cyan-700 dark:text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Registered Accounts
            </span>
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {totalInScope}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {selectedCountry === 'ALL'
              ? 'Active across all 8 East African countries'
              : `In ${selectedCountryMeta?.name || selectedCountry} operations`}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Corporate Freight Shippers
            </span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400 mt-2">
            {corporateCountInScope}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {selectedCountry === 'ALL'
              ? 'TIN / KRA / URA verified accounts'
              : `${selectedCountryMeta?.name} enterprise cargo contracts`}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Completed Rides &amp; Hauls
            </span>
            <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {totalTripsCountInScope.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Cumulative completed dispatches
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Lifetime Spend Volume
            </span>
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          {selectedCountry !== 'ALL' && selectedCountryMeta && totalLocalSpend != null ? (
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-2">
                {selectedCountryMeta.currencySymbol} {Math.round(totalLocalSpend).toLocaleString()}
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                ≈ ETB {totalLifetimeETBInScope.toLocaleString()} benchmark
              </p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-2">
                ETB {totalLifetimeETBInScope.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Regional multi-currency billing
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Directory Table Surface */}
      <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
            {[
              { id: 'all', label: `All (${countryScoped.length})` },
              {
                id: 'passenger',
                label: `Passengers (${countryScoped.filter((c) => c.accountType === 'Ride Passenger').length})`,
              },
              {
                id: 'corporate',
                label: `Corporate Shippers (${corporateCountInScope})`,
              },
              {
                id: 'suspended',
                label: `Suspended (${countryScoped.filter((c) => c.status === 'Suspended').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as typeof filterTab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  filterTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <span className="hidden sm:inline text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
              Showing {filtered.length} of {countryScoped.length} accounts
            </span>
            <div className="relative flex-1 lg:w-80">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, ID, city, TIN/PIN, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>
        </div>

        {/* Customer Accounts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 pl-3 pr-4">Account ID &amp; Nation</th>
                <th className="py-2.5 px-4">Name &amp; Operating Hub</th>
                <th className="py-2.5 px-4">Segment &amp; Tax ID</th>
                <th className="py-2.5 px-4">Contact &amp; Payment Rail</th>
                <th className="py-2.5 px-4 text-right">Runs</th>
                <th className="py-2.5 px-4 text-right">Lifetime Spend</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 pl-4 pr-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {filtered.length > 0 ? (
                filtered.map((c) => {
                  const countryCode = (c.countryCode || 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>;
                  const cMeta = EAST_AFRICAN_COUNTRIES_META[countryCode] || EAST_AFRICAN_COUNTRIES_META.ET;
                  const formattedSpendLocal =
                    c.totalSpentLocal != null
                      ? `${cMeta.currencySymbol} ${c.totalSpentLocal.toLocaleString()}`
                      : `${cMeta.currencySymbol} ${c.totalSpentETB.toLocaleString()}`;

                  return (
                    <tr
                      key={c.customerId}
                      onClick={() => handleSelectCustomer(c)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Account ID & Country Flag Badge */}
                      <td className="py-3.5 pl-3 pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-base" title={cMeta.name}>
                            {cMeta.flag}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white block">
                              {c.customerId}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {cMeta.code} · {cMeta.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Name & Hub */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.city || cMeta.capital}</span>
                          <span className="text-slate-400">·</span>
                          <span>Joined {c.joinedDate}</span>
                        </p>
                      </td>

                      {/* Segment & National Tax ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {c.accountType}
                          </span>
                        </div>
                        {c.companyTin ? (
                          <p className="text-[11px] font-mono text-blue-700 dark:text-blue-400 font-semibold mt-0.5">
                            {c.taxNumberLabel ? `${c.taxNumberLabel}: ` : ''}{c.companyTin}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Standard Retail Passenger
                          </p>
                        )}
                      </td>

                      {/* Contact & Mobile Payment Rail */}
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {c.phone}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                            {c.email}
                          </span>
                          {c.paymentRail && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              {c.paymentRail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Runs */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-800 dark:text-slate-300">
                        {c.tripsCount}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400 block">
                          {formattedSpendLocal}
                        </span>
                        {countryCode !== 'ET' && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                            ≈ ETB {c.totalSpentETB.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-semibold inline-flex items-center gap-1 ${getStatusTextClass(c.status)}`}>
                          {c.status === 'Active' && <CheckCircle2 className="w-3 h-3" />}
                          {c.status === 'Corporate' && <Briefcase className="w-3 h-3" />}
                          {c.status === 'Suspended' && <AlertCircle className="w-3 h-3" />}
                          <span>{c.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-4 pr-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(c);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors whitespace-nowrap"
                        >
                          <span>Manage</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm font-semibold">No customer or shipper accounts match criteria</p>
                    <p className="text-xs mt-1">
                      Try clearing filters or register a new customer in {selectedCountry === 'ALL' ? 'East Africa' : selectedCountry}.
                    </p>
                    {canManageCustomers && (
                      <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors"
                      >
                        Register New Customer
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {EAST_AFRICAN_COUNTRIES_META[(selectedCustomer.countryCode || 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>]?.flag || '🇪🇹'}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                      {selectedCustomer.countryName || 'Ethiopia'} ({selectedCustomer.countryCode || 'ET'})
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {selectedCustomer.customerId}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedCustomer.city || 'Regional Hub'}</span>
                    <span>·</span>
                    <span>Joined {selectedCustomer.joinedDate}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Volume & Runs Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Lifetime Spend</span>
                  <span className="text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1 block">
                    {EAST_AFRICAN_COUNTRIES_META[(selectedCustomer.countryCode || 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>]?.currencySymbol || 'Br'}{' '}
                    {(selectedCustomer.totalSpentLocal != null ? selectedCustomer.totalSpentLocal : selectedCustomer.totalSpentETB).toLocaleString()}
                  </span>
                  {selectedCustomer.countryCode && selectedCustomer.countryCode !== 'ET' && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 block">
                      ≈ ETB {selectedCustomer.totalSpentETB.toLocaleString()} standard
                    </span>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Completed Runs</span>
                  <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                    {selectedCustomer.tripsCount} dispatches
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    {selectedCustomer.accountType}
                  </span>
                </div>
              </div>

              {/* Contact & Official Credentials */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mobile Phone</span>
                  </span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {selectedCustomer.phone}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {selectedCustomer.email}
                  </span>
                </div>

                {selectedCustomer.companyTin && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>{selectedCustomer.taxNumberLabel || 'National Tax ID'}</span>
                    </span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                      {selectedCustomer.companyTin}
                    </span>
                  </div>
                )}

                {selectedCustomer.paymentRail && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Payment Rail</span>
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {selectedCustomer.paymentRail}
                    </span>
                  </div>
                )}

                {selectedCustomer.corridor && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <Compass className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Operating Corridor</span>
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right truncate max-w-[220px]">
                      {selectedCustomer.corridor}
                    </span>
                  </div>
                )}
              </div>

              {/* Account Status Control */}
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Account Standing ({selectedCustomer.status})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Active', 'Corporate', 'Suspended'] as CustomerAccountStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedCustomer, st)}
                      className={`py-2 px-3 rounded-lg font-semibold border transition-colors ${
                        selectedCustomer.status === st
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Notes Editor */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Operational &amp; Compliance Notes</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                  >
                    Save Notes
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add credit limits, corridor preferences, or cross-border compliance notes..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Linked Recent Activity */}
              <div className="space-y-2 text-xs">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Recent Linked Dispatches ({linkedTrips.length + linkedShipments.length})</span>
                </h3>
                {linkedTrips.length > 0 ? (
                  <div className="space-y-2">
                    {linkedTrips.map((t) => (
                      <div
                        key={t.tripId}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-mono font-semibold text-slate-900 dark:text-white">
                            {t.tripId} · {t.status}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.pickup} → {t.destination}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          ETB {t.fareETB.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : linkedShipments.length > 0 ? (
                  <div className="space-y-2">
                    {linkedShipments.map((s) => (
                      <div
                        key={s.shipmentId}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-mono font-semibold text-slate-900 dark:text-white">
                            {s.shipmentId} · {s.status}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {s.origin} → {s.destination} ({s.cargoType})
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          ETB {s.freightRateETB.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 py-2">
                    No active dispatches linked in the current operational window.
                  </p>
                )}
              </div>
            </div>

            {/* Drawer Footer with Inline 2-Step Removal Confirmation */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs bg-slate-50/60 dark:bg-slate-950/40">
              {confirmDeleteId === selectedCustomer.customerId ? (
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    Confirm removal?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(selectedCustomer.customerId)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                  >
                    Yes, Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(selectedCustomer.customerId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Customer or Corporate Shipper */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Register Customer or Shipper</span>
                  <span className="text-base">{COUNTRY_FORM_CONFIGS[newCustomerCountry]?.flag}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Persists to Back4App Parse Customer class via Express server proxy
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4 text-xs">
              {/* Country Selection */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Country of Operation
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {EAST_AFRICA_ORDERED_CODES.map((code) => {
                    const cfg = COUNTRY_FORM_CONFIGS[code];
                    const isSelected = newCustomerCountry === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleCountrySelectChange(code)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isSelected
                            ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-base block">{cfg.flag}</span>
                        <span className="text-[11px] font-semibold mt-0.5 block truncate">{cfg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Segment Toggle */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Account Segment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Ride Passenger', 'Corporate Shipper'] as CustomerAccountType[]).map((seg) => (
                    <button
                      key={seg}
                      type="button"
                      onClick={() =>
                        setNewCustomer({
                          ...newCustomer,
                          accountType: seg,
                          status: seg === 'Corporate Shipper' ? 'Corporate' : 'Active',
                        })
                      }
                      className={`py-2 px-3 rounded-lg font-semibold border transition-colors ${
                        newCustomer.accountType === seg
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {seg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entity Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {newCustomer.accountType === 'Corporate Shipper'
                    ? `Enterprise / Shipper Name (${COUNTRY_FORM_CONFIGS[newCustomerCountry]?.name})`
                    : `Full Passenger Name (${COUNTRY_FORM_CONFIGS[newCustomerCountry]?.name})`}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newCustomer.accountType === 'Corporate Shipper'
                      ? `e.g. ${newCustomerCountry === 'KE' ? 'Siginon Logistics Kenya' : newCustomerCountry === 'UG' ? 'Mukwano Group Uganda' : newCustomerCountry === 'RW' ? 'Bralirwa Logistics Rwanda' : 'Abyssinia Cargo PLC'}`
                      : `e.g. ${newCustomerCountry === 'KE' ? 'Brian Ochieng' : newCustomerCountry === 'UG' ? 'Brenda Akello' : newCustomerCountry === 'RW' ? 'Jean-Paul Nshimiyimana' : 'Sara Tefera'}`
                  }
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Phone ({COUNTRY_FORM_CONFIGS[newCustomerCountry]?.phonePrefix})
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={COUNTRY_FORM_CONFIGS[newCustomerCountry]?.phonePlaceholder}
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={`contact@afronala.${newCustomerCountry.toLowerCase()}`}
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Operating City / Hub */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Operating City or Freight Depot
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${COUNTRY_FORM_CONFIGS[newCustomerCountry]?.sampleCities[0]}`}
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1">
                  {COUNTRY_FORM_CONFIGS[newCustomerCountry]?.sampleCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setNewCustomer({ ...newCustomer, city })}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tax Registration (if Corporate Shipper) */}
              {newCustomer.accountType === 'Corporate Shipper' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {COUNTRY_FORM_CONFIGS[newCustomerCountry]?.taxLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${COUNTRY_FORM_CONFIGS[newCustomerCountry]?.taxPlaceholder}`}
                    value={newCustomer.companyTin}
                    onChange={(e) => setNewCustomer({ ...newCustomer, companyTin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Verified against {COUNTRY_FORM_CONFIGS[newCustomerCountry]?.name} national tax and transport registry.
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Operational Notes &amp; Credit Limits
                </label>
                <textarea
                  rows={2}
                  placeholder={`Billing terms, preferred payment (${COUNTRY_FORM_CONFIGS[newCustomerCountry]?.paymentRail}), or corridor notes...`}
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
