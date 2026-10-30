import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Award,
  Building2,
  CheckCircle2,
  Coins,
  Compass,
  CreditCard,
  Download,
  Gavel,
  Globe,
  Landmark,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Truck,
  Unlink,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import {
  Driver,
  EastAfricaCountryCode,
  EastAfricaCurrency,
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
import { EAST_AFRICA_PROFILES } from '../services/eastAfricaScreens';

interface FleetBiddingEscrowViewProps {
  darkMode: boolean;
  userRole: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  userName?: string;
  userEmail?: string;
  drivers: Driver[];
  onGuardPermission: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type DeskTab = 'bidding' | 'fleet' | 'escrow';

interface CountryMarketMeta {
  code: EastAfricaCountryCode;
  name: string;
  flag: string;
  currency: EastAfricaCurrency;
  currencySymbol: string;
  rateToETB: number;
  primaryCorridor: string;
  primaryPaymentRail: string;
}

const EAST_AFRICA_MARKETS: CountryMarketMeta[] = [
  {
    code: 'ALL',
    name: 'All 8 Nations',
    flag: '🌍',
    currency: 'ETB',
    currencySymbol: 'Br',
    rateToETB: 1.0,
    primaryCorridor: 'Pan-East Africa Cross-Border Clearing Axis',
    primaryPaymentRail: 'Multi-Rail Automated Routing & Clearing',
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    rateToETB: 1.0,
    primaryCorridor: 'Addis Ababa → Modjo Dry Port → Djibouti Port Corridor',
    primaryPaymentRail: 'Telebirr & Commercial Bank of Ethiopia (CBE Birr)',
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    rateToETB: 0.95,
    primaryCorridor: 'Mombasa Port Container Terminal → Nairobi ICD SGR Depot',
    primaryPaymentRail: 'Safaricom Daraja M-PESA B2C & C2B',
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    rateToETB: 0.033,
    primaryCorridor: 'Malaba OSBP Border → Kampala Namanve Industrial Park',
    primaryPaymentRail: 'MTN Mobile Money & Airtel Money Uganda',
  },
  {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'FRw',
    rateToETB: 0.092,
    primaryCorridor: 'Kigali Logistics Platform (KLP) → Rusumo OSBP Border',
    primaryPaymentRail: 'MTN MoMo Rwanda & Airtel Money RW',
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    rateToETB: 0.046,
    primaryCorridor: 'Dar es Salaam Port Kurasini → Dodoma Central Corridor',
    primaryPaymentRail: 'Vodacom M-Pesa & Tigo Pesa Tanzania',
  },
  {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    rateToETB: 0.7,
    primaryCorridor: 'Doraleh Multipurpose Port (DMP) → Galafi Border Link',
    primaryPaymentRail: 'D-Money (Djibouti Telecom Corporate Rail)',
  },
  {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD',
    currencySymbol: '$',
    rateToETB: 130.0,
    primaryCorridor: 'Berbera Port DP World Terminal → Hargeisa Commercial Hub',
    primaryPaymentRail: 'Hormuud EVC Plus & Telesom Zaad USD Clearing',
  },
  {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP',
    currencySymbol: 'SS£',
    rateToETB: 0.085,
    primaryCorridor: 'Nimule Border Post → Juba Lifeline Highway Corridor',
    primaryPaymentRail: 'm-GURUSH Mobile Money South Sudan',
  },
];

export const FleetBiddingEscrowView: React.FC<FleetBiddingEscrowViewProps> = ({
  userRole,
  userJurisdiction = 'ET',
  userJurisdictionName = 'Ethiopia (Headquarters)',
  assignedCorridors = [],
  userName = 'Daniel Ferede',
  userEmail = 'daniel@afronala.com',
  drivers,
  onGuardPermission,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<DeskTab>('bidding');
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(
    userJurisdiction || 'ET'
  );
  const [showDualCurrency, setShowDualCurrency] = useState(true);

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
    countryCode: 'ET' as EastAfricaCountryCode,
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Sync operator jurisdiction on change
  useEffect(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL') {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

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

  const currentMarketMeta = useMemo(() => {
    return (
      EAST_AFRICA_MARKETS.find((m) => m.code === selectedCountry) || EAST_AFRICA_MARKETS[1]
    );
  }, [selectedCountry]);

  // Filter items by country
  const filteredLoads = useMemo(() => {
    if (selectedCountry === 'ALL') return loads;
    return loads.filter((l) => (l.countryCode || 'ET') === selectedCountry);
  }, [loads, selectedCountry]);

  const filteredTrucks = useMemo(() => {
    if (selectedCountry === 'ALL') return fleetTrucks;
    return fleetTrucks.filter((t) => (t.countryCode || 'ET') === selectedCountry);
  }, [fleetTrucks, selectedCountry]);

  const filteredInvitations = useMemo(() => {
    if (selectedCountry === 'ALL') return invitations;
    return invitations.filter((i) => (i.countryCode || 'ET') === selectedCountry);
  }, [invitations, selectedCountry]);

  const filteredEscrows = useMemo(() => {
    if (selectedCountry === 'ALL') return escrows;
    return escrows.filter((e) => (e.countryCode || 'ET') === selectedCountry);
  }, [escrows, selectedCountry]);

  // Counts per country for ribbon badges
  const marketCounts = useMemo(() => {
    const map: Record<string, { loads: number; openBids: number; trucks: number }> = {};
    for (const m of EAST_AFRICA_MARKETS) {
      if (m.code === 'ALL') {
        map.ALL = {
          loads: loads.length,
          openBids: bids.filter((b) => b.status === 'open').length,
          trucks: fleetTrucks.length,
        };
      } else {
        const cLoads = loads.filter((l) => (l.countryCode || 'ET') === m.code);
        const cBids = bids.filter((b) => (b.countryCode || 'ET') === m.code && b.status === 'open');
        const cTrucks = fleetTrucks.filter((t) => (t.countryCode || 'ET') === m.code);
        map[m.code] = {
          loads: cLoads.length,
          openBids: cBids.length,
          trucks: cTrucks.length,
        };
      }
    }
    return map;
  }, [loads, bids, fleetTrucks]);

  // Keep selectedLoad aligned with filteredLoads
  useEffect(() => {
    if (filteredLoads.length > 0) {
      const match = filteredLoads.find((l) => l.bookingId === selectedLoadId);
      if (!match) {
        setSelectedLoadId(filteredLoads[0].bookingId);
      }
    } else {
      setSelectedLoadId(null);
    }
  }, [filteredLoads, selectedLoadId]);

  const selectedLoad = useMemo(
    () => filteredLoads.find((l) => l.bookingId === selectedLoadId) || filteredLoads[0] || null,
    [filteredLoads, selectedLoadId]
  );

  const bidsForSelectedLoad = useMemo(() => {
    if (!selectedLoad) return [];
    return bids
      .filter((b) => b.bookingId === selectedLoad.bookingId)
      .sort((a, b) => a.amountETB - b.amountETB);
  }, [bids, selectedLoad]);

  const metrics = useMemo(() => {
    const activeBids =
      selectedCountry === 'ALL'
        ? bids
        : bids.filter((b) => (b.countryCode || 'ET') === selectedCountry);
    const activeTrucks = filteredTrucks;
    const activeEscrows = filteredEscrows;

    const openBids = activeBids.filter((b) => b.status === 'open').length;
    const assignedTrucks = activeTrucks.filter((t) => Boolean(t.assignedDriverId)).length;
    const heldEscrowETB = activeEscrows
      .filter((e) => e.status === 'held_in_escrow' || e.status === 'payout_ready')
      .reduce((s, e) => s + e.grossAmountETB, 0);
    const releasedETB = activeEscrows
      .filter((e) => e.status === 'released')
      .reduce((s, e) => s + e.netPayoutETB, 0);

    return { openBids, assignedTrucks, heldEscrowETB, releasedETB, totalTrucks: activeTrucks.length };
  }, [bids, filteredTrucks, filteredEscrows, selectedCountry]);

  // Multi-currency price formatter
  const formatSovereignPrice = (
    amountETB: number,
    countryCode?: EastAfricaCountryCode,
    currency?: EastAfricaCurrency,
    amountLocal?: number
  ) => {
    const c = countryCode || 'ET';
    const curr = currency || (c === 'ET' ? 'ETB' : 'ETB');
    const localVal = amountLocal !== undefined ? amountLocal : amountETB;

    if (!showDualCurrency || c === 'ET') {
      return `Br ${amountETB.toLocaleString()} ETB`;
    }

    const meta = EAST_AFRICA_MARKETS.find((m) => m.code === c);
    const sym = meta?.currencySymbol || curr;
    return `${sym} ${localVal.toLocaleString()} (≈ Br ${amountETB.toLocaleString()})`;
  };

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
        `${bid.providerName} (${bid.truckPlate} · ${bid.countryCode || 'ET'}) allocated to ${bookingId} at ${formatSovereignPrice(bid.amountETB, bid.countryCode, bid.currency, bid.amountLocal)}.`,
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
          ? `${drvName} automatically transferred from ${existingBinding.plate} to ${assignModalTruck.plate} (${assignModalTruck.countryCode || 'ET'}).`
          : `${drvName} bound exclusively to ${assignModalTruck.plate} (${assignModalTruck.countryCode || 'ET'}).`,
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
      onNotify('Driver Unassigned', `Truck ${truck.plate} (${truck.countryCode || 'ET'}) is now idle and available.`, 'info');
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
        countryCode: selectedCountry === 'ALL' ? 'ET' : selectedCountry,
      });
      onNotify('Driver Invitation Dispatched', 'Synced across sovereign driver_app & carrier portals.', 'success');
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
        action: 'revoke',
        invitationId: inv.invitationId,
      });
      if (res.result?.invitations) setInvitations(res.result.invitations);
      onNotify('Invitation Revoked', `Revoked invitation for ${inv.driverName}.`, 'info');
    } catch (err: any) {
      onNotify('Revoke Failed', err?.message, 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleEscrowAction = async (
    escrow: SuperAppEscrowRecord,
    action: 'release_milestone' | 'payout'
  ) => {
    if (!onGuardPermission('manage_finance', `Escrow ${action} on ${escrow.escrowId}`)) return;
    setBusyKey(escrow.escrowId);
    try {
      const res = await superAppBridgeService.callCloudFunction<{
        escrows: SuperAppEscrowRecord[];
      }>('releaseEscrowPayout', {
        escrowId: escrow.escrowId,
        milestoneAction: action,
      });
      if (res.result?.escrows) setEscrows(res.result.escrows);
      onNotify(
        action === 'payout' ? 'Payout Disbursed' : 'Milestone Verified',
        `${escrow.escrowId} payout via ${escrow.localPaymentRail || escrow.paymentRail} (${formatSovereignPrice(escrow.netPayoutETB, escrow.countryCode, escrow.currency, escrow.netPayoutLocal)}).`,
        'success'
      );
    } catch (err: any) {
      onNotify('Escrow Action Failed', err?.message, 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDownloadCsv = () => {
    const scopeLabel = selectedCountry === 'ALL' ? 'all_east_africa' : selectedCountry.toLowerCase();
    if (activeTab === 'bidding') {
      downloadCsv(
        `afronala_superapp_truck_bidding_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'Booking ID',
          'Country',
          'Corridor',
          'Shipper',
          'Origin',
          'Destination',
          'Cargo',
          'Tons',
          'Priority',
          'Trucks Allocated',
          'Estimated Budget ETB',
          'Estimated Budget Local',
          'Currency',
          'Status',
        ],
        filteredLoads.map((l) => [
          l.bookingId,
          l.countryCode || 'ET',
          l.corridorName || 'Central Corridor',
          l.shipperName,
          l.origin,
          l.destination,
          l.cargoCategory,
          l.weightTons,
          `${l.priority} (${l.priorityMultiplier}x)`,
          `${l.allocatedTrucks}/${l.requiredTrucks}`,
          l.estimatedBudgetETB,
          l.estimatedBudgetLocal || l.estimatedBudgetETB,
          l.currency || 'ETB',
          l.status,
        ])
      );
    } else if (activeTab === 'fleet') {
      downloadCsv(
        `afronala_superapp_vehicle_owner_fleets_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'Truck ID',
          'Country',
          'Home Depot',
          'Plate',
          'Model',
          'Tons',
          'Vehicle Owner',
          'Assigned Driver (1:1)',
          'Driver Phone',
          'Status',
        ],
        filteredTrucks.map((t) => [
          t.truckId,
          t.countryCode || 'ET',
          t.homeDepot || 'Central Depot',
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
        `afronala_superapp_escrow_payouts_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'Escrow ID',
          'Country',
          'Booking ID',
          'Shipper Payer',
          'Recipient',
          'Recipient Type',
          'Payment Rail',
          'Gross ETB',
          'Gross Local',
          'Margin ETB',
          'Tax ETB',
          'Net Payout ETB',
          'Net Payout Local',
          'Currency',
          'Status',
        ],
        filteredEscrows.map((e) => [
          e.escrowId,
          e.countryCode || 'ET',
          e.bookingId,
          e.payerName,
          e.recipientName,
          e.recipientType,
          e.localPaymentRail || e.paymentRail,
          e.grossAmountETB,
          e.grossAmountLocal || e.grossAmountETB,
          e.platformMarginETB,
          e.taxWithheldETB,
          e.netPayoutETB,
          e.netPayoutLocal || e.netPayoutETB,
          e.currency || 'ETB',
          e.status,
        ])
      );
    }
    onNotify('CSV Downloaded', `Exported ${activeTab} ledger rows for ${currentMarketMeta.name}.`, 'success');
  };

  const availableDriverChoices = useMemo(() => {
    const base = [
      { id: 'DRV-07', name: 'Tsegaye Hailu', phone: '0912 345 678', country: 'ET' },
      { id: 'DRV-08', name: 'Dawit Alemayehu', phone: '0913 876 543', country: 'ET' },
      { id: 'DRV-12', name: 'Mulugeta Girma', phone: '0911 604 321', country: 'ET' },
      { id: 'DRV-15', name: 'Kibrom Tadesse', phone: '0911 556 677', country: 'ET' },
      { id: 'DRV-KE-01', name: 'Brian Ochieng', phone: '+254 712 345 678', country: 'KE' },
      { id: 'DRV-KE-02', name: 'Samuel Kamau', phone: '+254 722 990 112', country: 'KE' },
      { id: 'DRV-UG-01', name: 'Joseph Mugisha', phone: '+256 772 123 456', country: 'UG' },
      { id: 'DRV-RW-01', name: 'Jean-Paul Habimana', phone: '+250 788 123 456', country: 'RW' },
      { id: 'DRV-TZ-01', name: 'Mwajuma Rashid', phone: '+255 754 112 233', country: 'TZ' },
      { id: 'DRV-DJ-01', name: 'Amina Farah', phone: '+253 77 12 34 56', country: 'DJ' },
      { id: 'DRV-SO-01', name: 'Hassan Jama', phone: '+252 61 512 3456', country: 'SO' },
      { id: 'DRV-SS-01', name: 'Peter Deng', phone: '+211 922 456 789', country: 'SS' },
    ];
    for (const d of drivers) {
      if (d.module === 'truck' && !base.some((b) => b.name === d.name)) {
        base.push({
          id: d.objectId || `DRV-${d.name.slice(0, 3).toUpperCase()}`,
          name: d.name,
          phone: d.phone,
          country: (d.countryCode || 'ET') as string,
        });
      }
    }
    return base;
  }, [drivers]);

  const getCountryBadge = (code?: string) => {
    return EAST_AFRICA_MARKETS.find((m) => m.code === code) || EAST_AFRICA_MARKETS[1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
              <Gavel className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              East Africa Cross-Border Freight
            </span>
            <span aria-hidden="true">·</span>
            <span>Three-Sided Marketplace Desk</span>
            <span aria-hidden="true">·</span>
            <span>vehicle_owner_app + Spot Bidding + Sovereign Escrow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Fleet Bidding, Carrier Allocation &amp; Escrow Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time freight reverse-auctions, strict 1:1 driver-truck bindings, and multi-rail cross-border settlements across all 8 member states.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDualCurrency(!showDualCurrency)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
            title="Toggle between local sovereign currency and ETB parity"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{showDualCurrency ? 'Dual Currency (Active)' : 'ETB Parity Only'}</span>
          </button>

          {activeTab === 'fleet' && (
            <button
              type="button"
              onClick={() => {
                setInviteForm((prev) => ({
                  ...prev,
                  ownerName:
                    selectedCountry === 'KE'
                      ? 'Rift Haulers Kenya Ltd'
                      : selectedCountry === 'UG'
                      ? 'Victoria Transit Ltd'
                      : selectedCountry === 'RW'
                      ? 'Akagera Logistics SARL'
                      : selectedCountry === 'TZ'
                      ? 'Kilimanjaro Freightlines Ltd'
                      : selectedCountry === 'DJ'
                      ? 'Red Sea Cargo Logistics Djibouti'
                      : selectedCountry === 'SO'
                      ? 'Horn of Africa Express Logistics'
                      : selectedCountry === 'SS'
                      ? 'Equatoria Lifeline Freight Juba'
                      : 'Abay Heavy Logistics PLC',
                  targetTruckId: filteredTrucks[0]?.truckId || 'TRK-01',
                  countryCode: selectedCountry === 'ALL' ? 'ET' : selectedCountry,
                }));
                setInviteModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite Carrier Driver</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Operator Jurisdiction Context Banner */}
      <div className="p-4 rounded-xl border border-cyan-200/80 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-500/10 via-slate-50 to-emerald-500/5 dark:from-cyan-950/40 dark:via-slate-900 dark:to-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-lg shrink-0">
              {EAST_AFRICA_MARKETS.find((m) => m.code === userJurisdiction)?.flag || '🌍'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Operator Home Station:
                </span>
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                  {userJurisdictionName} ({userJurisdiction})
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-medium">
                  {userRole}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  · {userName}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Sovereign Trade Corridor:
                </span>
                <span className="text-slate-900 dark:text-white font-mono">
                  {currentMarketMeta.primaryCorridor}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Default Payment Rail:
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                  {currentMarketMeta.primaryPaymentRail}
                </span>
              </div>
            </div>
          </div>

          {selectedCountry !== userJurisdiction && (
            <button
              type="button"
              onClick={() => setSelectedCountry(userJurisdiction)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Reset to My Base ({userJurisdiction})</span>
            </button>
          )}
        </div>
      </div>

      {/* East Africa 8-Nation Selector Ribbon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Freight Corridor &amp; Sovereign Escrow Filter:
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Active Market: <strong className="text-cyan-700 dark:text-cyan-300">{currentMarketMeta.name}</strong> ({currentMarketMeta.currencySymbol} {currentMarketMeta.currency})
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {EAST_AFRICA_MARKETS.map((market) => {
            const isSelected = selectedCountry === market.code;
            const isUserBase = userJurisdiction === market.code;
            const counts = marketCounts[market.code] || { loads: 0, openBids: 0, trucks: 0 };

            return (
              <button
                key={market.code}
                type="button"
                onClick={() => setSelectedCountry(market.code)}
                className={`relative p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/40 ring-2 ring-cyan-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xl leading-none" role="img" aria-label={market.name}>
                    {market.flag}
                  </span>
                  {counts.openBids > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      {counts.openBids} bids
                    </span>
                  )}
                </div>

                <div className="mt-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {market.code}
                    </span>
                    {isUserBase && (
                      <span className="text-[9px] px-1 py-0.1 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                        Base
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {market.name}
                  </p>
                  <p className="text-[9px] font-mono font-semibold text-cyan-700 dark:text-cyan-400 truncate">
                    {market.currencySymbol} · {counts.trucks}T
                  </p>
                </div>
              </button>
            );
          })}
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
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {currentMarketMeta.name} autoBidSelectionJob
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>1:1 Bound Fleet Trucks</span>
            <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {metrics.assignedTrucks} / {metrics.totalTrucks}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Strict exclusive driver-truck links
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Held in Escrow</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2 truncate">
            {formatSovereignPrice(metrics.heldEscrowETB, currentMarketMeta.code, currentMarketMeta.currency)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Locked pending delivery milestone
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Released Payouts</span>
            <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2 truncate">
            {formatSovereignPrice(metrics.releasedETB, currentMarketMeta.code, currentMarketMeta.currency)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Disbursed via sovereign rails
          </p>
        </div>
      </div>

      {/* Desk Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('bidding')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'bidding'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Truck Bidding &amp; Multi-Truck Loads ({filteredLoads.length})
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
          Vehicle Owner Fleets &amp; 1:1 Bindings ({filteredTrucks.length})
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
          Sovereign Escrow &amp; Multi-Rail Payouts ({filteredEscrows.length})
        </button>
      </div>

      {/* TAB 1: BIDDING & MULTI-TRUCK ALLOCATION */}
      {activeTab === 'bidding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  TruckBooking Freight Loads — {currentMarketMeta.name}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select booking row to compare and award carrier spot bids
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                {filteredLoads.length} Loads
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-4">Booking &amp; Origin</th>
                    <th className="py-2.5 px-4">Destination &amp; Cargo</th>
                    <th className="py-2.5 px-4 text-right">Priority</th>
                    <th className="py-2.5 px-4 text-right">Trucks</th>
                    <th className="py-2.5 px-4 text-right">Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="h-11 animate-pulse">
                        <td colSpan={5} className="px-4 py-2.5">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : filteredLoads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 px-4 text-center text-slate-500 dark:text-slate-400">
                        No freight loads registered for {currentMarketMeta.name}. Select another sovereign nation or "All 8 Nations".
                      </td>
                    </tr>
                  ) : (
                    filteredLoads.map((load) => {
                      const isSelected = selectedLoad?.bookingId === load.bookingId;
                      const cBadge = getCountryBadge(load.countryCode);
                      return (
                        <tr
                          key={load.bookingId}
                          onClick={() => setSelectedLoadId(load.bookingId)}
                          className={`h-12 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-cyan-50/80 dark:bg-cyan-950/30 ring-1 ring-inset ring-cyan-500/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base" role="img" aria-label={cBadge.name}>
                                {cBadge.flag}
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {load.bookingId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                              {load.shipperName}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {load.origin} → {load.destination}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <span>{load.cargoCategory}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                {load.weightTons}T
                              </span>
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
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatSovereignPrice(load.estimatedBudgetETB, load.countryCode, load.currency, load.estimatedBudgetLocal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bid Comparison & Multi-Truck Allocation Panel */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-xs">
            {selectedLoad ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{getCountryBadge(selectedLoad.countryCode).flag}</span>
                      <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                        {selectedLoad.bookingId} · Escrow {selectedLoad.escrowId}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      Submitted Carrier Spot Bids ({bidsForSelectedLoad.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Corridor: {selectedLoad.corridorName || currentMarketMeta.primaryCorridor}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                    {selectedLoad.biddingWindowEndsInMin > 0
                      ? `Auto-Bid in ${selectedLoad.biddingWindowEndsInMin}m`
                      : 'Window Closed'}
                  </span>
                </div>

                {bidsForSelectedLoad.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-10 text-center">
                    All required trucks allocated and currently in transit for {selectedLoad.bookingId}.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[460px] overflow-y-auto pr-1">
                    {bidsForSelectedLoad.map((bid) => (
                      <div key={bid.bidId} className="py-3 first:pt-0 last:pb-0 space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {bid.providerName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {bid.providerType === 'vehicle_owner_fleet'
                                ? 'Vehicle Owner Fleet Carrier'
                                : 'Independent SuperApp Driver'}{' '}
                              · <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{bid.truckPlate}</span> ({bid.truckModel})
                            </p>
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {formatSovereignPrice(bid.amountETB, bid.countryCode, bid.currency, bid.amountLocal)}
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
                                <span>Award Carrier Bid</span>
                              </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                Select a load from the left table to compare carrier bids.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VEHICLE OWNER FLEETS & 1:1 DRIVER BINDINGS */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Fleet Trucks &amp; Strict 1-Driver-Per-Truck Binding — {currentMarketMeta.name}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assigning an already-bound driver automatically unlinks their previous truck and binds them cleanly
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                {filteredTrucks.length} Trucks
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-4">Jurisdiction &amp; Plate</th>
                    <th className="py-2.5 px-4">Vehicle Owner / Fleet</th>
                    <th className="py-2.5 px-4">Home Freight Depot</th>
                    <th className="py-2.5 px-4 text-right">Capacity</th>
                    <th className="py-2.5 px-4">Bound Driver (1:1)</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Fleet RPC Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {filteredTrucks.map((truck) => {
                    const cBadge = getCountryBadge(truck.countryCode);
                    return (
                      <tr
                        key={truck.truckId}
                        className="h-12 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base" role="img" aria-label={cBadge.name}>
                              {cBadge.flag}
                            </span>
                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                              {truck.plate}
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {truck.model}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {truck.ownerName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                          {truck.homeDepot || 'Central Logistics Depot'}
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
                              Unassigned (Idle in Depot)
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
                                const match = availableDriverChoices.find(
                                  (d) => d.country === (truck.countryCode || 'ET')
                                ) || availableDriverChoices[0];
                                if (match) {
                                  setSelectedDriverChoice(`${match.id}|${match.name}|${match.phone}`);
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DriverInvitation Ledger */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  DriverInvitation Parse Records — {currentMarketMeta.name}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Owner-to-driver revenue split contracts dispatched via vehicle_owner_app
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {filteredInvitations.length} total invitations
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-4">Jurisdiction &amp; ID</th>
                    <th className="py-2.5 px-4">Vehicle Owner</th>
                    <th className="py-2.5 px-4">Invited Driver</th>
                    <th className="py-2.5 px-4">Target Truck Plate</th>
                    <th className="py-2.5 px-4 text-right">Revenue Share</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {filteredInvitations.map((inv) => {
                    const cBadge = getCountryBadge(inv.countryCode);
                    return (
                      <tr key={inv.invitationId} className="h-11">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                          <span className="mr-1.5">{cBadge.flag}</span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ESCROW & PAYOUT RECONCILIATION */}
      {activeTab === 'escrow' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Sovereign Freight Escrow Ledger &amp; Multi-Rail Payout Desk — {currentMarketMeta.name}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Settlements held across Safaricom M-PESA, Telebirr, CBE Birr, MTN MoMo, Vodacom M-Pesa, D-Money, EVC Plus &amp; Central Bank RTGS
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
              {filteredEscrows.length} Escrow Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-4">Jurisdiction &amp; Escrow</th>
                  <th className="py-2.5 px-4">Shipper Payer → Recipient</th>
                  <th className="py-2.5 px-4">Sovereign Payment Rail</th>
                  <th className="py-2.5 px-4 text-right">Gross Amount</th>
                  <th className="py-2.5 px-4 text-right">Platform Fee + Tax</th>
                  <th className="py-2.5 px-4 text-right">Net Carrier Payout</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Settlement RPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredEscrows.map((esc) => {
                  const cBadge = getCountryBadge(esc.countryCode);
                  return (
                    <tr
                      key={esc.escrowId}
                      className="h-12 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{cBadge.flag}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {esc.escrowId}
                          </span>
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
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 dark:text-white text-[11px] truncate">
                          {esc.localPaymentRail || esc.paymentRail}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          Rail ID: {esc.paymentRail}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatSovereignPrice(esc.grossAmountETB, esc.countryCode, esc.currency, esc.grossAmountLocal)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatSovereignPrice(
                          esc.platformMarginETB + esc.taxWithheldETB,
                          esc.countryCode,
                          esc.currency,
                          (esc.platformMarginLocal || esc.platformMarginETB) + (esc.taxWithheldLocal || esc.taxWithheldETB)
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatSovereignPrice(esc.netPayoutETB, esc.countryCode, esc.currency, esc.netPayoutLocal)}
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
                  );
                })}
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
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{getCountryBadge(assignModalTruck.countryCode).flag}</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    1:1 Sovereign Truck Driver Binding
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {assignModalTruck.plate} · {assignModalTruck.model} ({assignModalTruck.capacityTons}T)
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
                Select Verified Freight Driver ({assignModalTruck.countryCode || 'ET'})
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
                      [{d.country}] {d.name} ({d.phone})
                      {boundTo ? ` — Currently on ${boundTo.plate} (Will Transfer)` : ' — Idle'}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enforces SuperApp strict 1-driver-per-truck rule via assignTruckToDriver / transferDriverBetweenTrucks.
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
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{getCountryBadge(inviteForm.countryCode).flag}</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Dispatch Fleet Driver Invitation
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Vehicle owner revenue-split agreement for {currentMarketMeta.name}
                </p>
              </div>
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
                  Vehicle Owner Organization / Carrier
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
                    placeholder="e.g. Samuel Kamau"
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
                    placeholder="e.g. +254 722 990 112"
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
                    {filteredTrucks.map((t) => (
                      <option key={t.truckId} value={t.truckId}>
                        [{t.countryCode || 'ET'}] {t.plate} ({t.capacityTons}T)
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
