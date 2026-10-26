import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  CustomerAccount,
  CustomerAccountStatus,
  CustomerAccountType,
  PermissionAction,
  Shipment,
  Trip,
} from '../types';
import { downloadCsv, hasPermission } from '../services/rbac';

interface CustomersViewProps {
  darkMode: boolean;
  customers: CustomerAccount[];
  trips: Trip[];
  shipments: Shipment[];
  userRole: string;
  onAddCustomer: (customer: Omit<CustomerAccount, 'objectId' | 'customerId'>) => Promise<void>;
  onUpdateCustomer: (customerId: string, updates: Partial<CustomerAccount>) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  onNotify: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  trips,
  shipments,
  userRole,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onNotify,
  onGuardPermission,
}) => {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'passenger' | 'corporate' | 'suspended'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const [newCustomer, setNewCustomer] = useState<{
    name: string;
    phone: string;
    email: string;
    accountType: CustomerAccountType;
    companyTin: string;
    status: CustomerAccountStatus;
    notes: string;
  }>({
    name: '',
    phone: '',
    email: '',
    accountType: 'Ride Passenger',
    companyTin: '',
    status: 'Active',
    notes: '',
  });

  const canManageCustomers = hasPermission(userRole, 'manage_customers');

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customerId.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyTin && c.companyTin.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterTab === 'passenger') return c.accountType === 'Ride Passenger';
    if (filterTab === 'corporate') return c.accountType === 'Corporate Shipper';
    if (filterTab === 'suspended') return c.status === 'Suspended';
    return true;
  });

  const totalCustomers = customers.length;
  const corporateCount = customers.filter((c) => c.accountType === 'Corporate Shipper').length;
  const totalLifetimeETB = customers.reduce((sum, c) => sum + c.totalSpentETB, 0);
  const totalTripsCount = customers.reduce((sum, c) => sum + c.tripsCount, 0);

  const handleOpenAddModal = () => {
    if (!onGuardPermission('manage_customers', 'Registering customer accounts')) return;
    setShowAddModal(true);
  };

  const handleSelectCustomer = (c: CustomerAccount) => {
    setSelectedCustomer(c);
    setNotesDraft(c.notes || '');
    setConfirmDeleteId(null);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onGuardPermission('manage_customers', 'Creating customer accounts')) return;

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
          ? newCustomer.companyTin.trim() || `TIN-00${Math.floor(10000000 + Math.random() * 89999999)}`
          : undefined,
      tripsCount: 0,
      totalSpentETB: 0,
      status: statusToSave,
      notes: newCustomer.notes.trim() || 'Registered via Afronala Control Center',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    });

    setShowAddModal(false);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      accountType: 'Ride Passenger',
      companyTin: '',
      status: 'Active',
      notes: '',
    });
  };

  const handleStatusChange = async (customer: CustomerAccount, nextStatus: CustomerAccountStatus) => {
    if (!onGuardPermission('manage_customers', 'Updating customer account status')) return;
    await onUpdateCustomer(customer.customerId, { status: nextStatus });
    setSelectedCustomer((prev) =>
      prev && prev.customerId === customer.customerId ? { ...prev, status: nextStatus } : prev
    );
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    if (!onGuardPermission('manage_customers', 'Updating customer account notes')) return;
    await onUpdateCustomer(selectedCustomer.customerId, { notes: notesDraft });
    setSelectedCustomer({ ...selectedCustomer, notes: notesDraft });
  };

  const handleConfirmDelete = async (customerId: string) => {
    if (!onGuardPermission('manage_customers', 'Deleting customer records')) return;
    await onDeleteCustomer(customerId);
    setConfirmDeleteId(null);
    setSelectedCustomer(null);
  };

  const handleExportCsv = () => {
    downloadCsv(
      `afronala_customers_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Customer ID',
        'Name / Entity',
        'Account Type',
        'Company TIN',
        'Phone',
        'Email',
        'Lifetime Runs',
        'Total Spent (ETB)',
        'Status',
        'Joined',
        'Notes',
      ],
      filtered.map((c) => [
        c.customerId,
        c.name,
        c.accountType,
        c.companyTin || '',
        c.phone,
        c.email,
        c.tripsCount,
        c.totalSpentETB.toFixed(2),
        c.status,
        c.joinedDate,
        c.notes || '',
      ])
    );
    onNotify(
      'Customer Directory Exported',
      `Downloaded ${filtered.length} account records as UTF-8 CSV.`,
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

  const linkedTrips = selectedCustomer
    ? trips.filter(
        (t) =>
          t.passenger.toLowerCase().includes(selectedCustomer.name.split(' ')[0].toLowerCase()) ||
          (t.passengerPhone && t.passengerPhone === selectedCustomer.phone)
      )
    : [];

  const linkedShipments =
    selectedCustomer?.accountType === 'Corporate Shipper' ? shipments.slice(0, 2) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Accounts &amp; Shippers</span>
            <span aria-hidden="true">·</span>
            <span>Back4App Customer Class</span>
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Customer &amp; Corporate Shipper Directory
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            title={`Download CSV of ${filtered.length} currently displayed customer accounts`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            {canManageCustomers ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Register Account</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Total Registered Accounts
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {totalCustomers}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Passengers &amp; verified enterprise shippers
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Corporate Freight Shippers
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400 mt-2">
            {corporateCount}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            TIN-verified commercial accounts
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Completed Rides &amp; Hauls
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {totalTripsCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Cumulative lifetime dispatches
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Lifetime Gross Billing
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-2">
            ETB {totalLifetimeETB.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Combined mobility &amp; logistics spend
          </p>
        </div>
      </div>

      {/* Directory Table Surface */}
      <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
            {[
              { id: 'all', label: `All (${customers.length})` },
              {
                id: 'passenger',
                label: `Passengers (${customers.filter((c) => c.accountType === 'Ride Passenger').length})`,
              },
              {
                id: 'corporate',
                label: `Corporate Shippers (${corporateCount})`,
              },
              {
                id: 'suspended',
                label: `Suspended (${customers.filter((c) => c.status === 'Suspended').length})`,
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
              Showing {filtered.length} of {customers.length}
            </span>
            <div className="relative flex-1 lg:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, ID, TIN, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 pl-3 pr-4">Account ID</th>
                <th className="py-2.5 px-4">Name / Organization</th>
                <th className="py-2.5 px-4">Segment &amp; TIN</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4 text-right">Runs</th>
                <th className="py-2.5 px-4 text-right">Lifetime Spend</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 pl-4 pr-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr
                    key={c.customerId}
                    onClick={() => handleSelectCustomer(c)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 pl-3 pr-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {c.customerId}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Joined {c.joinedDate}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {c.accountType}
                      </p>
                      {c.companyTin && (
                        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          {c.companyTin}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{c.phone}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                        {c.email}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-800 dark:text-slate-300">
                      {c.tripsCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      ETB {c.totalSpentETB.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${getStatusTextClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
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
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-600 dark:text-slate-400">
                    <Users className="w-6 h-6 mx-auto mb-2 text-slate-500 dark:text-slate-400" />
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      No matching customer or shipper accounts
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Adjust your active search or filter segment to view registered accounts.
                    </p>
                    {(search || filterTab !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setFilterTab('all');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Account Detail & Edit Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                    {selectedCustomer.customerId} · {selectedCustomer.accountType}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Member since {selectedCustomer.joinedDate}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contact & Billing Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block">Lifetime Volume</span>
                  <span className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 block">
                    ETB {selectedCustomer.totalSpentETB.toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block">Completed Runs</span>
                  <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                    {selectedCustomer.tripsCount} dispatches
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone</span>
                  </span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {selectedCustomer.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {selectedCustomer.email}
                  </span>
                </div>
                {selectedCustomer.companyTin && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Ethiopian Tax ID</span>
                    </span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {selectedCustomer.companyTin}
                    </span>
                  </div>
                )}
              </div>

              {/* Account Status Control */}
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Account Standing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Active', 'Corporate', 'Suspended'] as CustomerAccountStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedCustomer, st)}
                      className={`py-2 px-3 rounded-lg font-semibold border transition-colors ${
                        selectedCustomer.status === st
                          ? 'bg-cyan-600 text-white border-cyan-600'
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
                    <span>Operational &amp; Credit Notes</span>
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
                  placeholder="Add credit limits, corridor preferences, or compliance notes..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Recent Linked Activity */}
              <div className="space-y-2 text-xs">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                  Recent Linked Activity
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
                            {s.origin} → {s.destination}
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
                    No active dispatches in the current window.
                  </p>
                )}
              </div>
            </div>

            {/* Drawer Footer with Inline 2-Step Delete Confirmation */}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Customer or Corporate Shipper */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Register Customer or Shipper
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Persists to Back4App Parse Customer class via Express proxy
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4 text-xs">
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
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {seg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {newCustomer.accountType === 'Corporate Shipper'
                    ? 'Company / Enterprise Name'
                    : 'Full Passenger Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newCustomer.accountType === 'Corporate Shipper'
                      ? 'e.g. Abyssinia Coffee Exports PLC'
                      : 'e.g. Meron Tadesse'
                  }
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Ethiopian Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0911 234 567"
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
                    placeholder="contact@company.et"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {newCustomer.accountType === 'Corporate Shipper' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Ministry of Revenues TIN
                  </label>
                  <input
                    type="text"
                    placeholder="TIN-0059182736"
                    value={newCustomer.companyTin}
                    onChange={(e) => setNewCustomer({ ...newCustomer, companyTin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Account Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Billing terms, preferred corridor, or dispatch notes..."
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
