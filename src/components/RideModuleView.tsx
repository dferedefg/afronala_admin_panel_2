import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Phone,
  Star,
  ChevronRight,
  X,
  Download,
  Lock,
  Car,
} from 'lucide-react';
import { Driver, DriverStatus, PermissionAction, Trip, Vehicle, VehicleStatus } from '../types';
import { downloadCsv, hasPermission } from '../services/rbac';

interface RideModuleViewProps {
  darkMode: boolean;
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: Trip[];
  userRole?: string;
  onAddDriver: (driver: Omit<Driver, 'objectId'>) => Promise<void>;
  onUpdateDriverStatus: (id: string, status: DriverStatus) => Promise<void>;
  onDeleteDriver: (id: string) => Promise<void>;
  onAddVehicle: (vehicle: Omit<Vehicle, 'objectId'>) => Promise<void>;
  onUpdateVehicleStatus: (id: string, status: VehicleStatus) => Promise<void>;
  onOpenDispatchSimulator?: () => void;
  onNotify?: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
}

const DRIVERS_PER_PAGE = 6;

export const RideModuleView: React.FC<RideModuleViewProps> = ({
  drivers,
  vehicles,
  trips,
  userRole = 'Super Admin',
  onAddDriver,
  onUpdateDriverStatus,
  onDeleteDriver,
  onAddVehicle,
  onUpdateVehicleStatus,
  onOpenDispatchSimulator,
  onNotify,
  onGuardPermission,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'drivers' | 'vehicles' | 'monitoring' | 'analytics'>('overview');

  // Drivers filtering & pagination state
  const [driverSearch, setDriverSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('All');
  const [driverPage, setDriverPage] = useState(1);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    vehicleModel: 'Toyota Vitz',
    vehiclePlate: '',
    status: 'Active' as DriverStatus,
    rating: 5.0,
    module: 'ride' as const,
  });

  // Vehicles filtering & state
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [failedVehicleImages, setFailedVehicleImages] = useState<Record<string, boolean>>({});
  const [newVehicle, setNewVehicle] = useState({
    model: 'Toyota Vitz',
    plate: '',
    driverName: '',
    status: 'Verified' as VehicleStatus,
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2023,
    capacity: '4 seats',
    module: 'ride' as const,
  });

  // Live Trip Monitoring simulation state
  const [liveProgress, setLiveProgress] = useState(45);
  const [isSimulating, setIsSimulating] = useState(true);

  const canManageRide = hasPermission(userRole, 'manage_ride');

  const checkRideAuthority = (label: string): boolean => {
    if (onGuardPermission) {
      return onGuardPermission('manage_ride', label);
    }
    return canManageRide;
  };

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setLiveProgress((prev) => (prev >= 95 ? 20 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const cardClass =
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs';

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 text-xs';

  const getStatusTextClass = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Verified':
      case 'Completed':
        return 'text-emerald-700 dark:text-emerald-400 font-semibold';
      case 'Pending':
      case 'Inspection':
      case 'On-Going':
        return 'text-amber-700 dark:text-amber-400 font-semibold';
      case 'Suspended':
      case 'Cancelled':
        return 'text-rose-700 dark:text-rose-400 font-semibold';
      default:
        return 'text-slate-600 dark:text-slate-400 font-medium';
    }
  };

  const rideDrivers = drivers.filter((d) => !d.module || d.module === 'ride');
  const activeRideDriversCount = rideDrivers.filter((d) => d.status === 'Active' || d.status === 'Verified').length;
  const liveFareTotal = trips.reduce((sum, t) => sum + (Number(t.fareETB) || 0), 0);

  // Derived operational metrics reflecting live CRUD additions
  const totalRegisteredDriversDisplay = 1239 + rideDrivers.length;
  const activeDriversDisplay = 870 + activeRideDriversCount;
  const tripsTodayDisplay = 4817 + trips.length;
  const revenueTodayDisplay = 683640 + liveFareTotal;

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.phone.includes(driverSearch) ||
      d.vehiclePlate.toLowerCase().includes(driverSearch.toLowerCase());
    const matchesFilter = driverStatusFilter === 'All' || d.status === driverStatusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalDriverPages = Math.max(1, Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE));
  const safeDriverPage = Math.min(driverPage, totalDriverPages);
  const paginatedDrivers = filteredDrivers.slice(
    (safeDriverPage - 1) * DRIVERS_PER_PAGE,
    safeDriverPage * DRIVERS_PER_PAGE
  );

  const filteredVehicles = vehicles.filter((v) => {
    return (
      v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.driverName.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
  });

  const handleExportRideReport = () => {
    const headers = [
      'Record Type',
      'ID / Plate',
      'Counterparty / Driver',
      'Route / Vehicle Model',
      'Status',
      'Fare or Rating',
      'Timestamp',
    ];
    const rows: (string | number)[][] = [
      ...trips.map((t) => [
        'Ride Trip',
        t.tripId,
        `${t.passenger} / ${t.driver}`,
        `${t.pickup} -> ${t.destination}`,
        t.status,
        `ETB ${t.fareETB.toFixed(2)}`,
        t.time,
      ]),
      ...drivers.map((d) => [
        'Registered Driver',
        d.vehiclePlate,
        d.name,
        d.vehicleModel,
        d.status,
        `${d.rating.toFixed(1)} stars`,
        d.joinedDate || '2025',
      ]),
    ];
    downloadCsv(`afronala_ride_mobility_report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    onNotify?.(
      'Ride Mobility Report Exported',
      `Exported ${rows.length} trip and driver records to CSV.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Modules</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-cyan-600 dark:text-cyan-400 font-medium">Ride Module</span>
            <span aria-hidden="true">·</span>
            <span className={canManageRide ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
              {canManageRide ? 'Dispatch Write Access' : `Read-Only (${userRole})`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ride Mobility &amp; Fleet Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Addis Ababa urban dispatch command, driver credentialing, and fleet inspection status.
          </p>
        </div>

        {/* Interactive Segmented Sub-navigation */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'drivers', label: 'Drivers' },
            { id: 'vehicles', label: 'Vehicles' },
            { id: 'monitoring', label: 'Trip Monitoring' },
            { id: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === tab.id
                  ? 'bg-white dark:bg-cyan-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Drivers</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {totalRegisteredDriversDisplay.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+6.2%</span>
                <span className="text-slate-500 text-[11px] font-normal">registered</span>
              </div>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Drivers</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {activeDriversDisplay.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+4.1%</span>
                <span className="text-slate-500 text-[11px] font-normal">online now</span>
              </div>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Trips Today</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {tripsTodayDisplay.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.0%</span>
                <span className="text-slate-500 text-[11px] font-normal">vs yesterday</span>
              </div>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Revenue Today</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                ETB {revenueTodayDisplay.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4%</span>
                <span className="text-slate-500 text-[11px] font-normal">fare gross</span>
              </div>
            </div>
          </div>

          {/* Live Trips Radar */}
          <div className={`p-6 rounded-xl overflow-hidden relative ${cardClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Live Trips Radar · Addis Ababa Dispatch Hub</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time driver location telemetry and passenger corridors
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Online: {activeDriversDisplay}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Active: 312</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Queued: 46</span>
                </div>

                <button
                  onClick={() => setActiveSubTab('monitoring')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Live Map</span>
                </button>
              </div>
            </div>

            {/* Intentional Dark Vector Radar Canvas */}
            <div className="w-full h-80 rounded-xl relative overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                <path
                  d="M 150,200 C 250,50 750,50 850,200 C 750,350 250,350 150,200 Z"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="5"
                />
                <path d="M 450,180 L 720,290" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="6 4" opacity="0.8" />
                <path d="M 450,180 L 800,120" fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.6" />
                <path d="M 450,180 L 280,110" fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.6" />
                <circle cx={450 + (liveProgress / 100) * 270} cy={180 + (liveProgress / 100) * 110} r="7" fill="#06b6d4" />
              </svg>

              <div className="absolute top-[42%] left-[45%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-lg mx-auto" />
                <span className="text-[11px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700 mt-1 inline-block">
                  Meskel Square (Hub)
                </span>
              </div>

              <div className="absolute top-[70%] left-[72%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-lg mx-auto" />
                <span className="text-[11px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700 mt-1 inline-block">
                  Bole Intl Airport
                </span>
              </div>

              <div className="absolute top-[28%] left-[28%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  Piazza / Arat Kilo
                </span>
              </div>

              <div className="absolute top-[28%] left-[80%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  CMC / Megenagna
                </span>
              </div>

              {[
                { top: '35%', left: '40%' },
                { top: '55%', left: '50%' },
                { top: '48%', left: '60%' },
                { top: '65%', left: '68%' },
                { top: '40%', left: '72%' },
                { top: '30%', left: '52%' },
                { top: '60%', left: '35%' },
              ].map((pos, i) => (
                <div
                  key={i}
                  style={pos}
                  className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950"
                  title="Online Driver"
                />
              ))}

              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <span className="font-mono text-[11px]">Bole Corridor Active Stream: 24 matched rides</span>
                <span className="text-cyan-400 font-mono text-[11px] tabular-nums">Progress {liveProgress}%</span>
              </div>
            </div>
          </div>

          {/* Recent Trips Table */}
          <div className={`p-5 rounded-xl ${cardClass}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Trips</h2>
              <button
                onClick={() => setActiveSubTab('monitoring')}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Track live trips
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <tr>
                    <th className="pb-3 font-semibold">Trip ID</th>
                    <th className="pb-3 font-semibold">Passenger</th>
                    <th className="pb-3 font-semibold">Driver</th>
                    <th className="pb-3 font-semibold">Route</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Fare</th>
                    <th className="pb-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {trips.map((t) => (
                    <tr key={t.tripId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white tabular-nums">{t.tripId}</td>
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{t.passenger}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{t.driver}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {t.pickup} → {t.destination}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs ${getStatusTextClass(t.status)}`}>{t.status}</span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                        ETB {t.fareETB.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">{t.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVER MANAGEMENT */}
      {activeSubTab === 'drivers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Driver Management</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify credentials, manage active status, and audit driver ratings in Back4App
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={driverSearch}
                  onChange={(e) => {
                    setDriverSearch(e.target.value);
                    setDriverPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={driverStatusFilter}
                onChange={(e) => {
                  setDriverStatusFilter(e.target.value);
                  setDriverPage(1);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>

              <button
                onClick={() => {
                  if (!checkRideAuthority('Register new Ride driver')) return;
                  setShowAddDriverModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                {canManageRide ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Add Driver</span>
              </button>
            </div>
          </div>

          <div className={`p-5 rounded-xl ${cardClass}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <tr>
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Phone</th>
                    <th className="pb-3 font-semibold">Vehicle</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Rating</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedDrivers.map((driver) => (
                    <tr key={driver.objectId || driver.phone} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-slate-800 border border-cyan-200 dark:border-slate-700 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-400 text-xs shrink-0">
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-200">{driver.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Joined {driver.joinedDate || '2024'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">{driver.phone}</td>
                      <td className="py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-200">{driver.vehicleModel}</p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{driver.vehiclePlate}</p>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs ${getStatusTextClass(driver.status)}`}>{driver.status}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold font-mono tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                          <span>{driver.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {driver.status !== 'Active' ? (
                            <button
                              onClick={() => {
                                if (!checkRideAuthority(`Activate driver ${driver.name}`)) return;
                                onUpdateDriverStatus(driver.objectId!, 'Active');
                              }}
                              title="Activate Driver"
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (!checkRideAuthority(`Suspend driver ${driver.name}`)) return;
                                onUpdateDriverStatus(driver.objectId!, 'Suspended');
                              }}
                              title="Suspend Driver"
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (!checkRideAuthority(`Remove driver ${driver.name}`)) return;
                              onDeleteDriver(driver.objectId!);
                            }}
                            title="Remove Driver"
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedDrivers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No drivers match the current search or status filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Real Client-Side Pagination Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="tabular-nums">
                Showing {filteredDrivers.length === 0 ? 0 : (safeDriverPage - 1) * DRIVERS_PER_PAGE + 1}–
                {Math.min(safeDriverPage * DRIVERS_PER_PAGE, filteredDrivers.length)} of {filteredDrivers.length} drivers
              </span>
              <div className="flex items-center gap-1 font-mono tabular-nums">
                {Array.from({ length: totalDriverPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setDriverPage(pageNum)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      safeDriverPage === pageNum
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLE MANAGEMENT */}
      {activeSubTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fleet Vehicles</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage registered mobility vehicles and annual roadworthiness inspections
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={() => {
                  if (!checkRideAuthority('Add fleet vehicle')) return;
                  setShowAddVehicleModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                {canManageRide ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVehicles.map((v, i) => {
              const imgKey = `${v.plate}-${i}`;
              const hasFailedImg = failedVehicleImages[imgKey] || !v.photoUrl;
              return (
                <div
                  key={imgKey}
                  className={`p-4 rounded-xl flex flex-col justify-between transition-colors hover:border-cyan-500/40 ${cardClass}`}
                >
                  <div>
                    <div className="w-full h-36 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-3 relative group">
                      {!hasFailedImg ? (
                        <img
                          src={v.photoUrl}
                          alt={`${v.model} (${v.plate})`}
                          referrerPolicy="no-referrer"
                          onError={() => setFailedVehicleImages((prev) => ({ ...prev, [imgKey]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 text-slate-500 dark:text-slate-400">
                          <Car className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-1" />
                          <span className="text-xs font-semibold">{v.model}</span>
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/85 text-white">
                        {v.type}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{v.model}</h3>
                        <p className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">{v.plate}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Driver: {v.driverName}</p>
                      </div>

                      <span className={`text-xs ${getStatusTextClass(v.status)}`}>{v.status}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">Year: {v.year}</span>
                    <button
                      onClick={() => {
                        if (!checkRideAuthority(`Update inspection status for ${v.plate}`)) return;
                        onUpdateVehicleStatus(v.objectId!, v.status === 'Verified' ? 'Inspection' : 'Verified');
                      }}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                    >
                      {v.status === 'Verified' ? 'Request Inspection' : 'Mark Verified'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TRIP MONITORING */}
      {activeSubTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Live Trip Monitoring</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time telemetry corridor tracking across Addis Ababa arterial routes
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {onOpenDispatchSimulator && (
                <button
                  onClick={onOpenDispatchSimulator}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Launch Radar Simulator</span>
                </button>
              )}
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  isSimulating
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isSimulating ? 'Telemetry Streaming' : 'Telemetry Paused'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Map Area */}
            <div className={`lg:col-span-8 p-6 rounded-xl relative overflow-hidden ${cardClass}`}>
              <div className="w-full h-96 rounded-xl bg-slate-950 relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />

                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 350">
                  <path
                    d="M 120,240 C 220,200 300,120 480,90"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="6 4"
                  />
                  <circle cx="120" cy="240" r="8" fill="#3b82f6" />
                  <circle cx="480" cy="90" r="8" fill="#10b981" />

                  {(() => {
                    const t = liveProgress / 100;
                    const x = (1 - t) * (1 - t) * 120 + 2 * (1 - t) * t * 220 + t * t * 480;
                    const y = (1 - t) * (1 - t) * 240 + 2 * (1 - t) * t * 160 + t * t * 90;
                    return (
                      <g transform={`translate(${x}, ${y})`}>
                        <circle r="12" fill="#06b6d4" opacity="0.3" />
                        <circle r="6" fill="#ffffff" stroke="#06b6d4" strokeWidth="2" />
                      </g>
                    );
                  })()}
                </svg>

                <div className="absolute bottom-16 left-12 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                  <p className="font-bold text-white">Meskel Square</p>
                  <p className="text-[10px] text-slate-400">Pickup Location</p>
                </div>

                <div className="absolute top-12 right-16 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                  <p className="font-bold text-white">Bole Intl Airport</p>
                  <p className="text-[10px] text-slate-400">Destination</p>
                </div>

                <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-xs font-mono tabular-nums space-y-1">
                  <div className="text-cyan-400 font-bold">GPS: 9.0107° N, 38.7612° E</div>
                  <div className="text-slate-300">Speed: 42 km/h · Heading: 114° ESE</div>
                </div>
              </div>
            </div>

            {/* Trip Detail Card */}
            <div className={`lg:col-span-4 p-6 rounded-xl flex flex-col justify-between ${cardClass}`}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white">Trip #TRP9283</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Standard Mobility Class</p>
                  </div>
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    In Progress
                  </span>
                </div>

                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-400">
                        N
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Passenger</p>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">Nahom B.</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onNotify?.(
                          'Masked SIP Call Relay',
                          'Connecting encrypted dispatch line to passenger Nahom B. (0911 776 655).',
                          'info'
                        )
                      }
                      title="Call Passenger via Dispatch Bridge"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-300">
                        D
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Driver</p>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">Daniel M.</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Toyota Corolla · DD-44556</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onNotify?.(
                          'Masked SIP Call Relay',
                          'Connecting dispatch voice channel to driver Daniel M. (DD-44556).',
                          'info'
                        )
                      }
                      title="Call Driver via Dispatch Bridge"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2.5">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Pickup</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-200">Meskel Square</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Destination</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-200">Bole International Airport</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Fare</span>
                      <p className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">ETB 480.0</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Distance</span>
                      <p className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">12.4 km</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">ETA</span>
                      <p className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400 tabular-nums">
                        {Math.max(2, Math.round(((100 - liveProgress) / 100) * 22))} min
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    if (!checkRideAuthority('Trigger Emergency Dispatch Override')) return;
                    onNotify?.(
                      'Emergency Dispatch Override Dispatched',
                      'Priority safety beacon activated for Trip #TRP9283 (DD-44556 · Bole Corridor).',
                      'warning'
                    );
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
                >
                  Emergency Dispatch Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RIDE ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ride Analytics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance metrics across Addis Ababa urban mobility fleets
              </p>
            </div>
            <button
              onClick={handleExportRideReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Trips (YTD)</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {(128445 + trips.length).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">+10.4% month over month</p>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Gross Mobility Volume</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                ETB {(8243540 + liveFareTotal).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">+21.2% gross volume</p>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Average Trip Fare</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                ETB {(trips.length > 0 ? liveFareTotal / trips.length : 356).toFixed(1)}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Within Addis Transport tariff cap</p>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Cancellation Rate</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">2.4%</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Below 3.0% SLA threshold</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-6 p-6 rounded-xl ${cardClass}`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Top Drivers Leaderboard</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { rank: 1, name: 'Abebe Kebede', trips: 1245, rating: 4.9 },
                  { rank: 2, name: 'Selamawit D.', trips: 980, rating: 4.8 },
                  { rank: 3, name: 'Hana Melkamu', trips: 875, rating: 4.7 },
                  { rank: 4, name: 'Bekele Tesfaye', trips: 790, rating: 4.8 },
                ].map((d) => (
                  <div key={d.rank} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-mono font-bold flex items-center justify-center tabular-nums">
                        {d.rank}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{d.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {d.trips.toLocaleString()} completed trips
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold font-mono tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                      <span>{d.rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`lg:col-span-6 p-6 rounded-xl ${cardClass}`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Peak Demand Hours (Addis Ababa EAT)</h3>
              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-4">
                {[
                  { hour: '06:00', height: '40%' },
                  { hour: '09:00', height: '95%' },
                  { hour: '12:00', height: '65%' },
                  { hour: '15:00', height: '55%' },
                  { hour: '18:00', height: '100%' },
                  { hour: '21:00', height: '70%' },
                ].map((bar) => (
                  <div key={bar.hour} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      style={{ height: bar.height }}
                      className="w-full rounded-t-md bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-400 transition-colors"
                    />
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">{bar.hour}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DRIVER */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl ${cardClass} shadow-2xl`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Register New Driver</h3>
              <button
                onClick={() => setShowAddDriverModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onAddDriver(newDriver);
                setShowAddDriverModal(false);
                onNotify?.('Driver Registered', `${newDriver.name} added to Ride fleet.`, 'success');
                setNewDriver({
                  name: '',
                  phone: '',
                  vehicleModel: 'Toyota Vitz',
                  vehiclePlate: '',
                  status: 'Active',
                  rating: 5.0,
                  module: 'ride',
                });
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Full Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alazar Bekele"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Phone Number (Ethiopian)</label>
                <input
                  type="text"
                  required
                  placeholder="0911 234 567"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Vehicle Model</label>
                  <select
                    value={newDriver.vehicleModel}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicleModel: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Toyota Vitz">Toyota Vitz</option>
                    <option value="Hyundai Accent">Hyundai Accent</option>
                    <option value="Kia Picanto">Kia Picanto</option>
                    <option value="Toyota Corolla">Toyota Corolla</option>
                    <option value="Suzuki Swift">Suzuki Swift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">License Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="AA-88123"
                    value={newDriver.vehiclePlate}
                    onChange={(e) => setNewDriver({ ...newDriver, vehiclePlate: e.target.value })}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Initial Verification Status</label>
                <select
                  value={newDriver.status}
                  onChange={(e) => setNewDriver({ ...newDriver, status: e.target.value as DriverStatus })}
                  className={inputClass}
                >
                  <option value="Active">Active (Ready for dispatch)</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Verified">Verified Documented</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VEHICLE */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl ${cardClass} shadow-2xl`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Fleet Vehicle</h3>
              <button
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onAddVehicle(newVehicle);
                setShowAddVehicleModal(false);
                onNotify?.('Vehicle Registered', `${newVehicle.model} (${newVehicle.plate}) added to fleet.`, 'success');
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Vehicle Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Corolla"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">License Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AA-99231"
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Assigned Driver</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bekele Tesfaye"
                  value={newVehicle.driverName}
                  onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
