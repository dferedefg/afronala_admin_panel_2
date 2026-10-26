import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Award,
  Download,
  Gavel,
  Landmark,
  Plus,
  Send,
  ShieldCheck,
  Truck,
  Unlink,
  UserPlus,
  X,
} from 'lucide-react';
import {
  Driver,
  PermissionAction,
  SuperAppDriverInvitation,
  SuperAppEscrowRecord,
  SuperAppFleetTruck,
  SuperAppFreightBid,
  SuperAppTruckBookingLoad,
  ToastMessage,
} from '../types';
import { superAppBridgeService } from '../services/superAppBridge';
import { downloadCsv } from '../services/rbac';

interface FleetBiddingEscrowViewProps {
  darkMode: boolean;
  userRole: string;
  drivers: Driver[];
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type DeskTab = 'bidding' | 'fleet' | 'escrow';

export const FleetBiddingEscrowView: React.FC<FleetBiddingEscrowViewProps> = ({
  drivers,
  onGuardPermission,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<DeskTab>('bidding');
  const [loads, setLoads] = useState<SuperAppTruckBookingLoad[]>([]);
  const [bids, setBids] = useState<SuperAppFreightBid[]>([]);
  const [fleetTrucks, setFleetTrucks] = useState<SuperAppFleetTruck[]>([]);
  const [invitations, setInvitations] = useState<SuperAppDriverInvitation[]>([]);
  const [escrows, setEscrows] = useState<SuperAppEscrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLoadId, setSelectedLoadId] = useState<string | null>('TBK-8821');
  const [assignModalTruck, setAssignModalTruck] = useState<SuperAppFleetTruck | null>(null);
  const [selectedDriverChoice, setSelectedDriverChoice] = useState<string>('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    ownerName: 'Abay Heavy Logistics PLC',
    driverName: '',
    driverPhone: '',
    targetTruckId: 'TRK-03',
    revenueSplitDriverPct: 32,
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadMarketplaceState = async () => {
    setLoading(true);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        trucks: SuperAppFleetTruck[];
        loads: SuperAppTruckBookingLoad[];
        bids: SuperAppFreightBid[];
        invitations: SuperAppDriverInvitation[];
        escrows: SuperAppEscrowRecord[];
      }>('getTrucksPaginated', { page: 1, limit: 50 });

      if (res.result) {
        setFleetTrucks(res.result.trucks || []);
        setLoads(res.result.loads || []);
        setBids(res.result.bids || []);
        setInvitations(res.result.invitations || []);
        setEscrows(res.result.escrows || []);
      }
    } catch (err: any) {
      onNotify('Fleet & Bidding Load Failed', err?.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceState();
  }, []);

  const selectedLoad = useMemo(
    () => loads.find((l) => l.bookingId === selectedLoadId) || loads[0] || null,
    [loads, selectedLoadId]
  );

  const bidsForSelectedLoad = useMemo(() => {
    if (!selectedLoad) return [];
    return bids
      .filter((b) => b.bookingId === selectedLoad.bookingId)
      .sort((a, b) => a.amountETB - b.amountETB);
  }, [bids, selectedLoad]);

  const metrics = useMemo(() => {
    const openBids = bids.filter((b) => b.status === 'open').length;
    const assignedTrucks = fleetTrucks.filter((t) => Boolean(t.assignedDriverId)).length;
    const heldEscrowETB = escrows
      .filter((e) => e.status === 'held_in_escrow' || e.status === 'payout_ready')
      .reduce((s, e) => s + e.grossAmountETB, 0);
    const releasedETB = escrows
      .filter((e) => e.status === 'released')
      .reduce((s, e) => s + e.netPayoutETB, 0);
    return { openBids, assignedTrucks, heldEscrowETB, releasedETB };
  }, [bids, fleetTrucks, escrows]);

  const handleAllocateBid = async (bookingId: string, bid: SuperAppFreightBid) => {
    if (!onGuardPermission('manage_freight', `Award bid ${bid.bidId} on ${bookingId}`)) return;
    setBusyKey(bid.bidId);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        loads: SuperAppTruckBookingLoad[];
        bids: SuperAppFreightBid[];
      }>('allocateMultiTruckLoad', {
        bookingId,
        bidId: bid.bidId,
        truckId: bid.truckId,
      });

      if (res.result?.loads) setLoads(res.result.loads);
      if (res.result?.bids) setBids(res.result.bids);

      onNotify(
        'Carrier Bid Awarded',
        `${bid.providerName} (${bid.truckPlate}) allocated to ${bookingId} at ETB ${bid.amountETB.toLocaleString()}.`,
        'success'
      );
    } catch (err: any) {
      onNotify('Allocation Failed', err?.message, 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleAssignOrTransferDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalTruck || !selectedDriverChoice) return;
    if (!onGuardPermission('manage_freight', `Assign driver to ${assignModalTruck.plate}`)) return;

    const [drvId, drvName, drvPhone] = selectedDriverChoice.split('|');
    const existingBinding = fleetTrucks.find(
      (t) => t.assignedDriverId === drvId && t.truckId !== assignModalTruck.truckId
    );
    const fnName = existingBinding ? 'transferDriverBetweenTrucks' : 'assignTruckToDriver';

    setBusyKey(assignModalTruck.truckId);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        trucks: SuperAppFleetTruck[];
      }>(fnName, {
        truckId: assignModalTruck.truckId,
        driverId: drvId,
        driverName: drvName,
        driverPhone: drvPhone,
      });

      if (res.result?.trucks) setFleetTrucks(res.result.trucks);
      setAssignModalTruck(null);
      onNotify(
        existingBinding ? '1:1 Driver Transferred' : 'Driver Assigned to Truck',
        existingBinding
          ? `${drvName} automatically unassigned from ${existingBinding.plate} and bound to ${assignModalTruck.plate}.`
          : `${drvName} bound exclusively to ${assignModalTruck.plate}.`,
        'success'
      );
    } catch (err: any) {
      onNotify('Fleet Assignment Error', err?.message, 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleUnassignTruck = async (truck: SuperAppFleetTruck) => {
    if (!onGuardPermission('manage_freight', `Unassign driver from ${truck.plate}`)) return;
    setBusyKey(truck.truckId);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        trucks: SuperAppFleetTruck[];
      }>('unassignTruckFromDriver', { truckId: truck.truckId });
      if (res.result?.trucks) setFleetTrucks(res.result.trucks);
      onNotify('Driver Unassigned', `Truck ${truck.plate} is now idle and available.`, 'info');
    } catch (err: any) {
      onNotify('Unassign Failed', err?.message, 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onGuardPermission('manage_freight', 'Send Vehicle Owner DriverInvitation')) return;
    if (!inviteForm.driverName.trim() || !inviteForm.driverPhone.trim()) {
      onNotify('Validation Error', 'Enter both driver name and phone number.', 'warning');
      return;
    }

    const truck = fleetTrucks.find((t) => t.truckId === inviteForm.targetTruckId);
    setBusyKey('create-invite');
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        invitations: SuperAppDriverInvitation[];
      }>('manageInvitation', {
        action: 'create',
        ownerName: inviteForm.ownerName,
        driverName: inviteForm.driverName.trim(),
        driverPhone: inviteForm.driverPhone.trim(),
        targetTruckId: inviteForm.targetTruckId,
        targetTruckPlate: truck?.plate || '3-ET-74910',
        revenueSplitDriverPct: inviteForm.revenueSplitDriverPct,
      });

      if (res.result?.invitations) setInvitations(res.result.invitations);
      setInviteModalOpen(false);
      setInviteForm({
        ownerName: 'Abay Heavy Logistics PLC',
        driverName: '',
        driverPhone: '',
        targetTruckId: 'TRK-03',
        revenueSplitDriverPct: 32,
      });
      onNotify('Driver Invitation Dispatched', 'Synced to vehicle_owner_app & driver_app.', 'success');
    } catch (err: any) {
      onNotify('Invitation Failed', err?.message, 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleRevokeInvitation = async (inv: SuperAppDriverInvitation) => {
    if (!onGuardPermission('manage_freight', `Revoke invitation ${inv.invitationId}`)) return;
    setBusyKey(inv.invitationId);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        invitations: SuperAppDriverInvitation[];
      }>('manageInvitation', {
        invitationId: inv.invitationId,
        status: 'revoked',
      });
      if (res.result?.invitations) setInvitations(res.result.invitations);
      onNotify('Invitation Revoked', `${inv.invitationId} marked as revoked.`, 'info');
    } catch (err: any) {
      onNotify('Update Failed', err?.message, 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleEscrowAction = async (
    escrow: SuperAppEscrowRecord,
    action: 'release_milestone' | 'payout'
  ) => {
    if (!onGuardPermission('manage_finance', `Execute ${action} for ${escrow.escrowId}`)) return;
    const fnName =
      action === 'release_milestone'
        ? 'releaseEscrowMilestone'
        : escrow.recipientType === 'vehicle_owner_fleet'
        ? 'initiateFleetPayout'
        : 'initiateDriverPayout';

    setBusyKey(escrow.escrowId);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        escrows: SuperAppEscrowRecord[];
        settlementReference?: string;
      }>(fnName, {
        escrowId: escrow.escrowId,
        gateway: escrow.paymentRail,
        amountETB: escrow.netPayoutETB,
      });

      if (res.result?.escrows) setEscrows(res.result.escrows);
      onNotify(
        action === 'release_milestone' ? 'Escrow Milestone Cleared' : 'Disbursement Settled',
        `${escrow.recipientName} · ETB ${escrow.netPayoutETB.toLocaleString()} (${
          res.result?.settlementReference || escrow.paymentRail.toUpperCase()
        })`,
        'success'
      );
    } catch (err: any) {
      onNotify('Escrow Settlement Error', err?.message, 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDownloadCsv = () => {
    if (activeTab === 'bidding') {
      downloadCsv(
        'afronala_superapp_truck_bidding.csv',
        [
          'Booking ID',
          'Shipper',
          'Origin',
          'Destination',
          'Cargo',
          'Tons',
          'Priority',
          'Trucks Allocated',
          'Estimated Budget ETB',
          'Status',
        ],
        loads.map((l) => [
          l.bookingId,
          l.shipperName,
          l.origin,
          l.destination,
          l.cargoCategory,
          l.weightTons,
          `${l.priority} (${l.priorityMultiplier}x)`,
          `${l.allocatedTrucks}/${l.requiredTrucks}`,
          l.estimatedBudgetETB,
          l.status,
        ])
      );
    } else if (activeTab === 'fleet') {
      downloadCsv(
        'afronala_superapp_vehicle_owner_fleets.csv',
        [
          'Truck ID',
          'Plate',
          'Model',
          'Tons',
          'Vehicle Owner',
          'Assigned Driver (1:1)',
          'Driver Phone',
          'Status',
        ],
        fleetTrucks.map((t) => [
          t.truckId,
          t.plate,
          t.model,
          t.capacityTons,
          t.ownerName,
          t.assignedDriverName || 'Unassigned',
          t.assignedDriverPhone || '',
          t.status,
        ])
      );
    } else {
      downloadCsv(
        'afronala_superapp_escrow_payouts.csv',
        [
          'Escrow ID',
          'Booking ID',
          'Shipper Payer',
          'Recipient',
          'Recipient Type',
          'Payment Rail',
          'Gross ETB',
          'Margin ETB',
          'Tax ETB',
          'Net Payout ETB',
          'Status',
        ],
        escrows.map((e) => [
          e.escrowId,
          e.bookingId,
          e.payerName,
          e.recipientName,
          e.recipientType,
          e.paymentRail,
          e.grossAmountETB,
          e.platformMarginETB,
          e.taxWithheldETB,
          e.netPayoutETB,
          e.status,
        ])
      );
    }
    onNotify('CSV Downloaded', `Exported ${activeTab} ledger rows.`, 'success');
  };

  const availableDriverChoices = useMemo(() => {
    const base = [
      { id: 'DRV-07', name: 'Tsegaye Hailu', phone: '0912 345 678' },
      { id: 'DRV-08', name: 'Dawit Alemayehu', phone: '0913 876 543' },
      { id: 'DRV-12', name: 'Mulugeta Girma', phone: '0911 604 321' },
      { id: 'DRV-15', name: 'Kibrom Tadesse', phone: '0911 556 677' },
    ];
    for (const d of drivers) {
      if (d.module === 'truck' && !base.some((b) => b.name === d.name)) {
        base.push({
          id: d.objectId || `DRV-${d.name.slice(0, 3).toUpperCase()}`,
          name: d.name,
          phone: d.phone,
        });
      }
    }
    return base;
  }, [drivers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>SuperApp Governance</span>
            <span aria-hidden="true">·</span>
            <span>Three-Sided Marketplace</span>
            <span aria-hidden="true">·</span>
            <span>vehicle_owner_app + Bid + Escrow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Vehicle Owner Fleet, Truck Bidding &amp; Escrow Desk
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activeTab === 'fleet' && (
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite Driver</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Open Carrier Bids</span>
            <Gavel className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {metrics.openBids}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Monitored by autoBidSelectionJob
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>1:1 Bound Fleet Trucks</span>
            <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {metrics.assignedTrucks}/{fleetTrucks.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            1-driver-per-truck invariant active
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Locked in Escrow</span>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            ETB {metrics.heldEscrowETB.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Protected shipper freight balances
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Net Fleet Payouts Cleared</span>
            <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            ETB {metrics.releasedETB.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Net of 15% margin &amp; 2% withholding
          </p>
        </div>
      </div>

      {/* Segmented Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('bidding')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'bidding'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Truck Bidding &amp; Multi-Truck Loads
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'fleet'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Vehicle Owner Fleets &amp; Invitations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('escrow')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'escrow'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Escrow &amp; Multi-Rail Payouts
        </button>
      </div>

      {/* TAB 1: BIDDING & MULTI-TRUCK ALLOCATION */}
      {activeTab === 'bidding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                TruckBooking Freight Loads
              </h2>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Select row to compare carrier bids
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-4">Booking</th>
                    <th className="py-2.5 px-4">Corridor &amp; Cargo</th>
                    <th className="py-2.5 px-4 text-right">Priority</th>
                    <th className="py-2.5 px-4 text-right">Trucks</th>
                    <th className="py-2.5 px-4 text-right">Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="h-11 animate-pulse">
                          <td colSpan={5} className="px-4 py-2.5">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                          </td>
                        </tr>
                      ))
                    : loads.map((load) => {
                        const isSelected = selectedLoad?.bookingId === load.bookingId;
                        return (
                          <tr
                            key={load.bookingId}
                            onClick={() => setSelectedLoadId(load.bookingId)}
                            className={`h-11 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-cyan-50/80 dark:bg-cyan-950/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                {load.bookingId}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {load.shipperName}
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-medium text-slate-900 dark:text-white">
                                {load.origin.split(' ')[0]} → {load.destination.split(' ')[0]}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {load.cargoCategory} ·{' '}
                                <span className="font-mono tabular-nums">{load.weightTons}T</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                                {load.priority}
                              </span>{' '}
                              <span className="text-cyan-700 dark:text-cyan-400">
                                ({load.priorityMultiplier.toFixed(1)}x)
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                              {load.allocatedTrucks}/{load.requiredTrucks}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              ETB {load.estimatedBudgetETB.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bid Comparison & Multi-Truck Allocation Panel */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
            {selectedLoad ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                      {selectedLoad.bookingId} · Escrow {selectedLoad.escrowId}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      Submitted Carrier Bids ({bidsForSelectedLoad.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-amber-700 dark:text-amber-400">
                    {selectedLoad.biddingWindowEndsInMin > 0
                      ? `Auto-Bid in ${selectedLoad.biddingWindowEndsInMin}m`
                      : 'Window Closed'}
                  </span>
                </div>

                {bidsForSelectedLoad.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                    All required trucks allocated and in transit for {selectedLoad.bookingId}.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {bidsForSelectedLoad.map((bid) => (
                      <div key={bid.bidId} className="py-3 first:pt-0 last:pb-0 space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {bid.providerName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {bid.providerType === 'vehicle_owner_fleet'
                                ? 'Vehicle Owner Fleet'
                                : 'Independent Driver'}{' '}
                              · <span className="font-mono">{bid.truckPlate}</span> ({bid.truckModel})
                            </p>
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <p className="font-bold text-slate-900 dark:text-white">
                              ETB {bid.amountETB.toLocaleString()}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              ETA {bid.etaMinutes}m · ★ {bid.rating.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`text-[11px] font-semibold capitalize ${
                              bid.status === 'awarded'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {bid.status}
                            {bid.autoSelected ? ' · Auto-Selected' : ''}
                          </span>

                          {bid.status === 'open' &&
                            selectedLoad.allocatedTrucks < selectedLoad.requiredTrucks && (
                              <button
                                type="button"
                                disabled={busyKey === bid.bidId}
                                onClick={() => handleAllocateBid(selectedLoad.bookingId, bid)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Award &amp; Allocate Truck</span>
                              </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: VEHICLE OWNER FLEETS & 1:1 DRIVER BINDINGS */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Fleet Trucks &amp; Strict 1-Driver-Per-Truck Binding
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Assigning an already-bound driver automatically transfers them cleanly
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-4">Truck &amp; Plate</th>
                    <th className="py-2.5 px-4">Vehicle Owner</th>
                    <th className="py-2.5 px-4 text-right">Capacity</th>
                    <th className="py-2.5 px-4">Bound Driver (1:1)</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Fleet RPC Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {fleetTrucks.map((truck) => (
                    <tr
                      key={truck.truckId}
                      className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {truck.plate}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {truck.model}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {truck.ownerName}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {truck.capacityTons}T
                      </td>
                      <td className="py-2.5 px-4">
                        {truck.assignedDriverName ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {truck.assignedDriverName}
                            </span>
                            <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                              {truck.assignedDriverPhone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            Unassigned (Idle)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 capitalize font-semibold">
                        <span
                          className={
                            truck.status === 'active'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }
                        >
                          {truck.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalTruck(truck);
                              const first = availableDriverChoices[0];
                              if (first) {
                                setSelectedDriverChoice(`${first.id}|${first.name}|${first.phone}`);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                          >
                            {truck.assignedDriverId ? (
                              <>
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Transfer</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                <span>Assign Driver</span>
                              </>
                            )}
                          </button>
                          {truck.assignedDriverId && (
                            <button
                              type="button"
                              disabled={busyKey === truck.truckId}
                              onClick={() => handleUnassignTruck(truck)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Unlink className="w-3 h-3" />
                              <span>Unassign</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DriverInvitation Ledger */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                DriverInvitation Parse Records
              </h2>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {invitations.length} total invitations
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-4">Invitation ID</th>
                    <th className="py-2.5 px-4">Vehicle Owner</th>
                    <th className="py-2.5 px-4">Invited Driver</th>
                    <th className="py-2.5 px-4">Target Truck</th>
                    <th className="py-2.5 px-4 text-right">Driver Split</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {invitations.map((inv) => (
                    <tr key={inv.invitationId} className="h-11">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {inv.invitationId}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                        {inv.ownerName}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {inv.driverName}
                        </span>{' '}
                        <span className="text-slate-500 font-mono">({inv.driverPhone})</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-200">
                        {inv.targetTruckPlate}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {inv.revenueSplitDriverPct}%
                      </td>
                      <td className="py-2.5 px-4 capitalize font-semibold">
                        <span
                          className={
                            inv.status === 'accepted'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : inv.status === 'pending'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {inv.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyKey === inv.invitationId}
                            onClick={() => handleRevokeInvitation(inv)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ESCROW & PAYOUT RECONCILIATION */}
      {activeTab === 'escrow' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Freight Escrow Ledger &amp; Multi-Country Payment Rails
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Telebirr · CBE Birr · M-Pesa · Bank RTGS · Card
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-4">Escrow &amp; Booking</th>
                  <th className="py-2.5 px-4">Shipper → Carrier Recipient</th>
                  <th className="py-2.5 px-4">Payment Rail</th>
                  <th className="py-2.5 px-4 text-right">Gross (ETB)</th>
                  <th className="py-2.5 px-4 text-right">Margin + Tax</th>
                  <th className="py-2.5 px-4 text-right">Net Payout</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Settlement RPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {escrows.map((esc) => (
                  <tr
                    key={esc.escrowId}
                    className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {esc.escrowId}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {esc.bookingId} · {esc.updatedAt}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {esc.payerName} → {esc.recipientName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                        {esc.recipientType.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono uppercase text-[11px] text-slate-800 dark:text-slate-200">
                      {esc.paymentRail.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {esc.grossAmountETB.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {(esc.platformMarginETB + esc.taxWithheldETB).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {esc.netPayoutETB.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold capitalize ${
                          esc.status === 'released'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : esc.status === 'payout_ready'
                            ? 'text-cyan-700 dark:text-cyan-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {esc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {esc.status === 'held_in_escrow' && (
                        <button
                          type="button"
                          disabled={busyKey === esc.escrowId}
                          onClick={() => handleEscrowAction(esc, 'release_milestone')}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
                        >
                          Verify Delivery
                        </button>
                      )}
                      {esc.status === 'payout_ready' && (
                        <button
                          type="button"
                          disabled={busyKey === esc.escrowId}
                          onClick={() => handleEscrowAction(esc, 'payout')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Send className="w-3 h-3" />
                          <span>Disburse Payout</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign / Transfer 1:1 Driver Modal */}
      {assignModalTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleAssignOrTransferDriver}
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  1:1 Truck Driver Assignment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {assignModalTruck.plate} · {assignModalTruck.model}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalTruck(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Verified Freight Driver
              </label>
              <select
                value={selectedDriverChoice}
                onChange={(e) => setSelectedDriverChoice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                {availableDriverChoices.map((d) => {
                  const boundTo = fleetTrucks.find((t) => t.assignedDriverId === d.id);
                  return (
                    <option key={d.id} value={`${d.id}|${d.name}|${d.phone}`}>
                      {d.name} ({d.phone})
                      {boundTo ? ` — Currently on ${boundTo.plate} (Will Transfer)` : ' — Available'}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enforces SuperApp 1-driver-per-truck rule via assignTruckToDriver / transferDriverBetweenTrucks.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalTruck(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Confirm 1:1 Binding
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create DriverInvitation Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSendInvitation}
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dispatch Fleet DriverInvitation
              </h3>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Owner Organization
                </label>
                <input
                  type="text"
                  value={inviteForm.ownerName}
                  onChange={(e) => setInviteForm({ ...inviteForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solomon Bekele"
                    value={inviteForm.driverName}
                    onChange={(e) => setInviteForm({ ...inviteForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0911 440 220"
                    value={inviteForm.driverPhone}
                    onChange={(e) => setInviteForm({ ...inviteForm, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Fleet Truck
                  </label>
                  <select
                    value={inviteForm.targetTruckId}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, targetTruckId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {fleetTrucks.map((t) => (
                      <option key={t.truckId} value={t.truckId}>
                        {t.plate} ({t.capacityTons}T)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Revenue Share (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={80}
                    value={inviteForm.revenueSplitDriverPct}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        revenueSplitDriverPct: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyKey === 'create-invite'}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
