import React, { useState, useEffect } from 'react';
import {
  Package,
  FileText,
  Plus,
  ChevronRight,
  X,
  Download,
  Lock,
  Radio,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { PermissionAction, Shipment, ShipmentStatus } from '../types';
import { downloadCsv, hasPermission } from '../services/rbac';

interface TruckDeliveryViewProps {
  darkMode: boolean;
  shipments: Shipment[];
  userRole: string;
  onAddShipment: (shipment: Shipment) => Promise<void>;
  onUpdateShipmentStatus: (shipmentId: string, status: ShipmentStatus) => Promise<void>;
  onNotify: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
}

const NEXT_STAGE_MAP: Record<ShipmentStatus, { next: ShipmentStatus; label: string } | null> = {
  Pending: { next: 'Picked Up', label: 'Mark Picked Up' },
  'Picked Up': { next: 'In Transit', label: 'Dispatch In Transit' },
  'In Transit': { next: 'Delivered', label: 'Confirm Delivery' },
  Delivered: null,
};

export const TruckDeliveryView: React.FC<TruckDeliveryViewProps> = ({
  shipments,
  userRole,
  onAddShipment,
  onUpdateShipmentStatus,
  onNotify,
  onGuardPermission,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'fleet' | 'shipments'>('overview');
  const [statusFilter, setStatusFilter] = useState<'All' | ShipmentStatus>('All');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(
    shipments[0]?.shipmentId || ''
  );
  const [showAddShipmentModal, setShowAddShipmentModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  const [newShipment, setNewShipment] = useState({
    origin: 'Addis Ababa (Kality Hub)',
    destination: 'Hawassa Industrial Park',
    cargoType: 'Agricultural & Textile Exports',
    tonnage: 18.5,
    truckPlate: '3-ET-77120',
    driver: 'Yonas Kebede',
    freightRateETB: 62000,
    initialStatus: 'Pending' as ShipmentStatus,
  });

  const canManageFreight = hasPermission(userRole, 'manage_freight');

  useEffect(() => {
    if (!selectedShipmentId && shipments.length > 0) {
      setSelectedShipmentId(shipments[0].shipmentId);
    }
  }, [shipments, selectedShipmentId]);

  const filteredShipments = shipments.filter((s) =>
    statusFilter === 'All' ? true : s.status === statusFilter
  );

  const selectedShipment =
    shipments.find((s) => s.shipmentId === selectedShipmentId) ||
    filteredShipments[0] ||
    shipments[0] ||
    null;

  // Live computed metrics
  const inTransitCount = shipments.filter(
    (s) => s.status === 'In Transit' || s.status === 'Picked Up'
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === 'Delivered').length;
  const totalTonnage = shipments.reduce((sum, s) => sum + Number(s.tonnage || 0), 0);
  const totalFreightETB = shipments.reduce((sum, s) => sum + Number(s.freightRateETB || 0), 0);

  const getStatusTextStyle = (status: ShipmentStatus) => {
    switch (status) {
      case 'Delivered':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'In Transit':
        return 'text-blue-700 dark:text-blue-400';
      case 'Picked Up':
        return 'text-cyan-700 dark:text-cyan-400';
      case 'Pending':
        return 'text-amber-700 dark:text-amber-400';
    }
  };

  const handleOpenDispatchModal = () => {
    if (!onGuardPermission('manage_freight', 'Dispatching new freight cargo')) return;
    setShowAddShipmentModal(true);
  };

  const handleAdvanceStatus = async (shipment: Shipment, nextStatus: ShipmentStatus) => {
    if (!onGuardPermission('manage_freight', 'Advancing freight waybill status')) return;
    await onUpdateShipmentStatus(shipment.shipmentId, nextStatus);
  };

  const handlePingTelematics = () => {
    if (!selectedShipment) return;
    onNotify(
      `Telematics Ping Ack · ${selectedShipment.truckPlate}`,
      `Driver ${selectedShipment.driver} responded on Modjo–Adama corridor (GPS lock nominal, seal intact).`,
      'info'
    );
  };

  const handleExportWaybillsCsv = () => {
    downloadCsv(
      `afronala_freight_waybills_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Shipment ID',
        'Status',
        'Origin',
        'Destination',
        'Cargo Type',
        'Tonnage (Metric Tons)',
        'Truck Plate',
        'Driver',
        'Freight Rate (ETB)',
        'ETA / Delivery Window',
      ],
      filteredShipments.map((s) => [
        s.shipmentId,
        s.status,
        s.origin,
        s.destination,
        s.cargoType,
        s.tonnage,
        s.truckPlate,
        s.driver,
        s.freightRateETB,
        s.estimatedDelivery,
      ])
    );
    onNotify(
      'Freight Manifests Exported',
      `Downloaded ${filteredShipments.length} waybills to CSV.`,
      'success'
    );
  };

  const cardClass =
    'p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Modules</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 dark:text-blue-400 font-medium">Truck Delivery</span>
            {!canManageFreight && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Read-Only ({userRole})</span>
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Truck Delivery &amp; Corridor Freight Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inter-city heavy haulage, dry port bonded manifests, and live status progression.
          </p>
        </div>

        {/* Subnav */}
        <div className="flex items-center gap-1 p-1 rounded-xl border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-auto">
          {[
            { id: 'overview', label: 'Freight Overview' },
            { id: 'fleet', label: 'Truck Fleet' },
            { id: 'shipments', label: 'Waybill Tracking' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Computed Logistics KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Manifests
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
            {shipments.length} Waybills
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {deliveredCount} completed deliveries
          </p>
        </div>

        <div className={cardClass}>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Active Corridor Runs
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-blue-600 dark:text-blue-400">
            {inTransitCount} Active
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Djibouti · Modjo · Adama · Hawassa
          </p>
        </div>

        <div className={cardClass}>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Certified Cargo Weight
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
            {totalTonnage.toFixed(1)} Tons
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Weighbridge verified gross load
          </p>
        </div>

        <div className={cardClass}>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Contracted Freight Value
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-emerald-600 dark:text-emerald-400">
            ETB {totalFreightETB.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gross corridor waybill billing
          </p>
        </div>
      </div>

      {/* Overview & Shipments Tracking */}
      {(activeSubTab === 'overview' || activeSubTab === 'shipments') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Freight Shipments List */}
          <div className={`lg:col-span-7 ${cardClass} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Regional Freight Manifests</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Advance shipments from Pending through Delivered in real time
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportWaybillsCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenDispatchModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap"
                >
                  {canManageFreight ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Dispatch Freight</span>
                </button>
              </div>
            </div>

            {/* Segmented Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
              {(['All', 'Pending', 'Picked Up', 'In Transit', 'Delivered'] as const).map((st) => {
                const count =
                  st === 'All'
                    ? shipments.length
                    : shipments.filter((s) => s.status === st).length;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                      statusFilter === st
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st} ({count})
                  </button>
                );
              })}
            </div>

            {/* Shipment Rows */}
            <div className="space-y-3">
              {filteredShipments.length > 0 ? (
                filteredShipments.map((s) => {
                  const stageAction = NEXT_STAGE_MAP[s.status];
                  const isSelected = selectedShipment?.shipmentId === s.shipmentId;
                  return (
                    <div
                      key={s.shipmentId}
                      onClick={() => setSelectedShipmentId(s.shipmentId)}
                      className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                          : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                            {s.shipmentId}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span className={`font-semibold ${getStatusTextStyle(s.status)}`}>
                            {s.status}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                          ETB {s.freightRateETB.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Corridor</p>
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {s.origin} → {s.destination}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Cargo &amp; Load
                          </p>
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {s.cargoType} ({s.tonnage} T)
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          {s.driver} · {s.truckPlate} · {s.time}
                        </span>

                        {stageAction ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceStatus(s, stageAction.next);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors whitespace-nowrap"
                          >
                            <span>{stageAction.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>POD Signed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  No shipments currently in the "{statusFilter}" stage.
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected Shipment Timeline & Waybill */}
          <div className={`lg:col-span-5 ${cardClass} flex flex-col justify-between`}>
            {selectedShipment ? (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Waybill &amp; Corridor Checkpoints
                    </span>
                    <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white mt-0.5">
                      {selectedShipment.shipmentId} · {selectedShipment.status}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDocModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Bill of Lading</span>
                  </button>
                </div>

                {/* Dynamic 4-Step Lifecycle Timeline */}
                <div className="py-5 space-y-4 text-xs">
                  {[
                    {
                      stage: 'Pending',
                      title: 'Manifest Registered & Scheduled',
                      sub: selectedShipment.origin,
                      done: true,
                    },
                    {
                      stage: 'Picked Up',
                      title: 'Origin Weighbridge Loaded & Sealed',
                      sub: `${selectedShipment.tonnage} Metric Tons certified`,
                      done: ['Picked Up', 'In Transit', 'Delivered'].includes(
                        selectedShipment.status
                      ),
                    },
                    {
                      stage: 'In Transit',
                      title: 'Expressway Corridor Telemetry',
                      sub: `ETA: ${selectedShipment.estimatedDelivery}`,
                      done: ['In Transit', 'Delivered'].includes(selectedShipment.status),
                    },
                    {
                      stage: 'Delivered',
                      title: 'Destination Unloading & Digital POD',
                      sub: selectedShipment.destination,
                      done: selectedShipment.status === 'Delivered',
                    },
                  ].map((step, idx) => (
                    <div key={step.stage} className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] shrink-0 border ${
                          step.done
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {step.done ? '✓' : idx + 1}
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            step.done
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Specs Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Cargo Classification:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedShipment.cargoType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Certified Tonnage:</span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {selectedShipment.tonnage} Metric Tons
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Prime Mover Plate:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {selectedShipment.truckPlate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Contract Driver:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedShipment.driver}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                Select a shipment to inspect waypoints and documents.
              </div>
            )}

            {selectedShipment && (
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePingTelematics}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-800 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Ping Driver Telematics</span>
                </button>

                {NEXT_STAGE_MAP[selectedShipment.status] && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAdvanceStatus(
                        selectedShipment,
                        NEXT_STAGE_MAP[selectedShipment.status]!.next
                      )
                    }
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap"
                  >
                    {NEXT_STAGE_MAP[selectedShipment.status]!.label}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fleet Tab */}
      {activeSubTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              model: 'Mercedes-Benz Atego 1224',
              plate: '3-ET-48190',
              type: 'Box Truck',
              capacity: '12 Tons',
              driver: 'Tsegaye Hailu',
              status: 'Verified',
              photo: '/src/assets/images/vehicle_logistics_truck_1792851959180.jpg',
            },
            {
              model: 'Volvo FH16 750 Heavy',
              plate: '3-ET-91823',
              type: 'Heavy Hauler',
              capacity: '28 Tons',
              driver: 'Dawit Alemayehu',
              status: 'In Transit',
              photo: '/src/assets/images/vehicle_logistics_truck_1792851959180.jpg',
            },
            {
              model: 'Scania R500 Flatbed',
              plate: '3-ET-33910',
              type: 'Flatbed Carrier',
              capacity: '32 Tons',
              driver: 'Hailemariam K.',
              status: 'Verified',
              photo: '/src/assets/images/vehicle_logistics_truck_1792851959180.jpg',
            },
          ].map((truck, idx) => (
            <div key={truck.plate} className={cardClass}>
              <div className="w-full h-36 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-3">
                <img
                  src={truck.photo}
                  alt={truck.model}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{truck.model}</h3>
                  <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {truck.plate}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Driver: {truck.driver}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {truck.status}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Capacity: {truck.capacity}</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  Fleet #TRK-{101 + idx}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Shipment */}
      {showAddShipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Dispatch New Freight Cargo
              </h3>
              <button
                onClick={() => setShowAddShipmentModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!onGuardPermission('manage_freight', 'Dispatching freight shipments')) return;
                const createdId = '#DLV' + Math.floor(1000 + Math.random() * 9000);
                await onAddShipment({
                  shipmentId: createdId,
                  status: newShipment.initialStatus,
                  time: 'Just now',
                  origin: newShipment.origin,
                  destination: newShipment.destination,
                  cargoType: newShipment.cargoType,
                  tonnage: Number(newShipment.tonnage),
                  truckPlate: newShipment.truckPlate,
                  driver: newShipment.driver,
                  freightRateETB: Number(newShipment.freightRateETB),
                  estimatedDelivery:
                    newShipment.initialStatus === 'Pending'
                      ? 'Scheduled · Tomorrow 14:00'
                      : 'En Route · Tomorrow 14:00',
                });
                setSelectedShipmentId(createdId);
                setShowAddShipmentModal(false);
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Origin Terminal
                </label>
                <input
                  type="text"
                  required
                  value={newShipment.origin}
                  onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Destination Hub
                </label>
                <input
                  type="text"
                  required
                  value={newShipment.destination}
                  onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Cargo Type
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.cargoType}
                    onChange={(e) => setNewShipment({ ...newShipment, cargoType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Weight (Tons)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newShipment.tonnage}
                    onChange={(e) =>
                      setNewShipment({ ...newShipment, tonnage: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Assigned Driver
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.driver}
                    onChange={(e) => setNewShipment({ ...newShipment, driver: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Truck Plate
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.truckPlate}
                    onChange={(e) => setNewShipment({ ...newShipment, truckPlate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Freight Rate (ETB)
                  </label>
                  <input
                    type="number"
                    required
                    value={newShipment.freightRateETB}
                    onChange={(e) =>
                      setNewShipment({ ...newShipment, freightRateETB: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newShipment.initialStatus}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        initialStatus: e.target.value as ShipmentStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Picked Up">Picked Up</option>
                    <option value="In Transit">In Transit</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddShipmentModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Electronic Bill of Lading */}
      {showDocModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  BoL
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Electronic Bill of Lading
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Manifest {selectedShipment.shipmentId} · Afronala Corridor Authority
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 space-y-4 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Origin Terminal</p>
                  <p className="text-slate-900 dark:text-white font-semibold mt-0.5">
                    {selectedShipment.origin}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Consignee Hub</p>
                  <p className="text-slate-900 dark:text-white font-semibold mt-0.5">
                    {selectedShipment.destination}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Prime Mover</p>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold">
                    {selectedShipment.truckPlate}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Certified Weight</p>
                  <p className="text-slate-900 dark:text-white">{selectedShipment.tonnage} Tons</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-sans">Contracted Rate</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ETB {selectedShipment.freightRateETB.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-sans">Cargo Description</p>
                <p className="text-slate-900 dark:text-white">{selectedShipment.cargoType}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
