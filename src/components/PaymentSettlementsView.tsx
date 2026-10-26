import React, { useState } from 'react';
import {
  DriverWallet,
  PaymentGateway,
  PaymentTransaction,
  PermissionAction,
} from '../types';
import {
  paymentSettlementService,
  COMMISSION_RATE,
  WITHHOLDING_TAX_RATE,
} from '../services/payments';
import { hasPermission } from '../services/rbac';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Building,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Send,
  X,
  RefreshCw,
  Calculator,
  Sliders,
  PieChart,
  Sparkles,
  Info,
  FileCheck,
} from 'lucide-react';

interface DriverRecentTrip {
  tripId: string;
  route: string;
  passenger: string;
  grossFareETB: number;
  gateway: PaymentGateway;
  timestamp: string;
}

const DRIVER_SAMPLE_TRIPS: Record<string, DriverRecentTrip[]> = {
  'drv-1': [
    { tripId: 'TRP9281', route: 'Bole Medhanialem → Piassa Churchill Rd', passenger: 'Selamawit Bekele', grossFareETB: 340, gateway: 'telebirr', timestamp: '10 min ago' },
    { tripId: 'TRP9275', route: 'Kazanchis UNECA → Bole Int’l Airport T2', passenger: 'Meron Assefa', grossFareETB: 410, gateway: 'telebirr', timestamp: '2 hours ago' },
    { tripId: 'TRP9261', route: 'CMC Michael → Mexico Square', passenger: 'Tewodros Kassahun', grossFareETB: 380, gateway: 'cbe_birr', timestamp: 'Yesterday, 17:40' },
    { tripId: 'TRP9254', route: 'Sarbet OAU → Megenagna Square', passenger: 'Hanna Yohannes', grossFareETB: 290, gateway: 'telebirr', timestamp: 'Yesterday, 14:15' },
  ],
  'drv-2': [
    { tripId: 'TRP9283', route: 'Gerji Imperial → 4 Kilo University Gate', passenger: 'Kidus Yohannes', grossFareETB: 480, gateway: 'cbe_birr', timestamp: '25 min ago' },
    { tripId: 'TRP9270', route: 'Bole Atlas → Tor Hailoch Hospital', passenger: 'Bethlehem Girma', grossFareETB: 350, gateway: 'cbe_birr', timestamp: '3 hours ago' },
    { tripId: 'TRP9258', route: 'Gurd Shola → Piassa De Gaulle', passenger: 'Solomon Worku', grossFareETB: 310, gateway: 'telebirr', timestamp: 'Yesterday, 18:20' },
  ],
  'drv-3': [
    { tripId: 'TRP9279', route: 'Lideta Mercato → Gotera Interchange', passenger: 'Yared Mulugeta', grossFareETB: 220, gateway: 'cash', timestamp: '1 hour ago' },
    { tripId: 'TRP9266', route: 'Kera Slaughterhouse → Bole Bulbula', passenger: 'Daniel Berhanu', grossFareETB: 390, gateway: 'telebirr', timestamp: '4 hours ago' },
    { tripId: 'TRP9250', route: 'Ayat Zone 3 → Saris Abo Church', passenger: 'Hiwot Tadesse', grossFareETB: 440, gateway: 'telebirr', timestamp: 'Yesterday, 11:30' },
  ],
  'drv-4': [
    { tripId: 'TRP9280', route: 'Kality Freight Dry Port → Akaki Customs', passenger: 'Blen Tesfaye (Logistics)', grossFareETB: 620, gateway: 'chapa', timestamp: '45 min ago' },
    { tripId: 'TRP9269', route: 'Sebeta Industrial Park → Meskel Sq Depot', passenger: 'Hailemariam Desalegn', grossFareETB: 850, gateway: 'cbe_birr', timestamp: '3 hours ago' },
    { tripId: 'TRP9252', route: 'Bole Lemi National Park → Piassa', passenger: 'Senait Wolde', grossFareETB: 540, gateway: 'cbe_birr', timestamp: 'Yesterday, 16:00' },
  ],
  'drv-5': [
    { tripId: 'TRP9272', route: 'Old Airport Golf Club → Kazanchis Elilly', passenger: 'Abel Tefera', grossFareETB: 290, gateway: 'cbe_birr', timestamp: '3 hours ago' },
    { tripId: 'TRP9264', route: 'Summit Condominium → Bole Rwanda', passenger: 'Liya Kebede', grossFareETB: 370, gateway: 'telebirr', timestamp: '5 hours ago' },
    { tripId: 'TRP9248', route: 'Sidist Kilo Science → Mexico Stadium', passenger: 'Eskinder Nega', grossFareETB: 260, gateway: 'telebirr', timestamp: 'Yesterday, 09:15' },
  ],
};

interface PaymentSettlementsViewProps {
  darkMode?: boolean;
  userRole?: string;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
}

export const PaymentSettlementsView: React.FC<PaymentSettlementsViewProps> = ({
  darkMode = true,
  userRole = 'Super Admin',
  onGuardPermission,
}) => {
  const canManageFinance = hasPermission(userRole, 'manage_finance');
  const checkFinanceAuthority = (label: string): boolean => {
    if (onGuardPermission) {
      return onGuardPermission('manage_finance', label);
    }
    return canManageFinance;
  };
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() =>
    paymentSettlementService.getTransactions()
  );
  const [wallets, setWallets] = useState<DriverWallet[]>(() =>
    paymentSettlementService.getWallets()
  );

  const [activeGatewayFilter, setActiveGatewayFilter] = useState<'all' | PaymentGateway>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWalletForPayout, setSelectedWalletForPayout] = useState<DriverWallet | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutNotification, setPayoutNotification] = useState<{ message: string; ref: string } | null>(null);

  // Automated Commission Split Simulator State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitDriverId, setSplitDriverId] = useState<string>('drv-1');
  const [splitCommissionPercent, setSplitCommissionPercent] = useState<number>(15);
  const [splitTaxPercent, setSplitTaxPercent] = useState<number>(2);
  const [splitDataSource, setSplitDataSource] = useState<'recent' | 'custom'>('recent');
  const [customForecastGross, setCustomForecastGross] = useState<number>(3500);

  // Webhook Simulator State
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [simGateway, setSimGateway] = useState<PaymentGateway>('telebirr');
  const [simAmount, setSimAmount] = useState<number>(380);
  const [simPassenger, setSimPassenger] = useState('Kidist Tilahun');
  const [simDriver, setSimDriver] = useState('Abebe Kebede');

  // Calculations
  const grossGMV = transactions.reduce((acc, tx) => acc + tx.grossFareETB, 0);
  const totalCommission = transactions.reduce((acc, tx) => acc + tx.platformCommissionETB, 0);
  const totalTaxWithheld = transactions.reduce((acc, tx) => acc + tx.withholdingTaxETB, 0);
  const totalNetDriverPaid = transactions.reduce((acc, tx) => acc + tx.netDriverETB, 0);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesGateway = activeGatewayFilter === 'all' || tx.gateway === activeGatewayFilter;
    const matchesSearch =
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.tripId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.passengerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGateway && matchesSearch;
  });

  const handleOpenPayout = (wallet: DriverWallet) => {
    if (!checkFinanceAuthority(`Disburse wallet payout to ${wallet.driverName}`)) return;
    setSelectedWalletForPayout(wallet);
    setPayoutAmount(Math.floor(wallet.availableBalanceETB).toString());
  };

  const handleExecutePayout = () => {
    if (!checkFinanceAuthority('Execute instant mobile money disbursement')) return;
    if (!selectedWalletForPayout) return;
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0 || amt > selectedWalletForPayout.availableBalanceETB) return;

    const result = paymentSettlementService.disbursePayout(selectedWalletForPayout.driverId, amt);
    if (result.success) {
      setWallets(paymentSettlementService.getWallets());
      setPayoutNotification({
        message: result.message,
        ref: result.txRef || 'TXN-DISBURSED',
      });
      setSelectedWalletForPayout(null);
    }
  };

  const handleTriggerWebhook = () => {
    if (!checkFinanceAuthority('Ingest settlement webhook transaction')) return;
    paymentSettlementService.simulateWebhook(simGateway, simAmount, simPassenger, simDriver);
    setTransactions(paymentSettlementService.getTransactions());
    setWallets(paymentSettlementService.getWallets());
    setIsWebhookModalOpen(false);
  };

  const handleOpenSplitSimulator = (driverId?: string) => {
    if (driverId) {
      setSplitDriverId(driverId);
    }
    setIsSplitModalOpen(true);
  };

  const selectedSplitDriver = wallets.find((w) => w.driverId === splitDriverId) || wallets[0];

  // Resolve trips for selected driver: merge ledger transactions with verified sample trips
  const driverLiveTxs = transactions.filter(
    (tx) => tx.driverId === selectedSplitDriver?.driverId || tx.driverName === selectedSplitDriver?.driverName
  );

  const fallbackTrips = selectedSplitDriver ? DRIVER_SAMPLE_TRIPS[selectedSplitDriver.driverId] || [] : [];

  const combinedRecentTrips: DriverRecentTrip[] = [
    ...driverLiveTxs.map((tx) => ({
      tripId: tx.tripId,
      route: tx.channelDetails || 'Addis Standard Ride Corridor',
      passenger: tx.passengerName,
      grossFareETB: tx.grossFareETB,
      gateway: tx.gateway,
      timestamp: tx.timestamp,
    })),
    ...fallbackTrips.filter((ft) => !driverLiveTxs.some((tx) => tx.tripId === ft.tripId)),
  ];

  const totalSimulatedGross =
    splitDataSource === 'custom'
      ? customForecastGross
      : combinedRecentTrips.reduce((acc, t) => acc + t.grossFareETB, 0);

  const simPlatformCommission = Math.round(totalSimulatedGross * (splitCommissionPercent / 100) * 100) / 100;
  const simTaxWithheld = Math.round(totalSimulatedGross * (splitTaxPercent / 100) * 100) / 100;
  const simDriverNetPayout = Math.max(
    0,
    Math.round((totalSimulatedGross - simPlatformCommission - simTaxWithheld) * 100) / 100
  );

  const simDriverSharePct =
    totalSimulatedGross > 0 ? ((simDriverNetPayout / totalSimulatedGross) * 100).toFixed(1) : '83.0';
  const simPlatformSharePct =
    totalSimulatedGross > 0 ? ((simPlatformCommission / totalSimulatedGross) * 100).toFixed(1) : '15.0';
  const simTaxSharePct =
    totalSimulatedGross > 0 ? ((simTaxWithheld / totalSimulatedGross) * 100).toFixed(1) : '2.0';

  const handleCommitSimulatedSettlement = () => {
    if (!checkFinanceAuthority('Commit commission split to settlement ledger')) return;
    if (!selectedSplitDriver) return;
    const simTripId = `TRP-SIM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx = paymentSettlementService.processSettlement(
      simTripId,
      selectedSplitDriver.driverId,
      selectedSplitDriver.driverName,
      'Settlement Commission Audit Batch',
      totalSimulatedGross,
      selectedSplitDriver.preferredPayoutMethod,
      splitCommissionPercent / 100
    );

    setTransactions(paymentSettlementService.getTransactions());
    setWallets(paymentSettlementService.getWallets());
    setIsSplitModalOpen(false);
    setPayoutNotification({
      message: `Commission Split Committed: ETB ${simDriverNetPayout.toFixed(2)} credited to ${selectedSplitDriver.driverName} (Platform Take: ETB ${simPlatformCommission.toFixed(2)} at ${splitCommissionPercent}%, Withholding Tax: ETB ${simTaxWithheld.toFixed(2)})`,
      ref: newTx.reference,
    });
  };

  // Manual Reconciliation Modal State
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [selectedTxForReconciliation, setSelectedTxForReconciliation] = useState<PaymentTransaction | null>(null);
  const [reconcileExternalRef, setReconcileExternalRef] = useState('');
  const [reconcileBankRail, setReconcileBankRail] = useState('Commercial Bank of Ethiopia');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [reconcileAuditor, setReconcileAuditor] = useState('Senior Finance Auditor');
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  const handleOpenReconciliationModal = (tx?: PaymentTransaction) => {
    if (!checkFinanceAuthority('Manual bank settlement reconciliation')) return;
    const targetTx = tx || filteredTransactions[0] || transactions[0];
    setSelectedTxForReconciliation(targetTx || null);
    if (targetTx) {
      setReconcileExternalRef(
        targetTx.externalRefId ||
          `${targetTx.gateway === 'cbe_birr' ? 'CBE-CORE-' : targetTx.gateway === 'telebirr' ? 'TB-ENT-' : 'ETHSWITCH-'}${Math.floor(
            100000 + Math.random() * 900000
          )}`
      );
      setReconcileBankRail(
        targetTx.reconciliationBank ||
          (targetTx.gateway === 'cbe_birr'
            ? 'Commercial Bank of Ethiopia'
            : targetTx.gateway === 'telebirr'
            ? 'Telebirr Enterprise Settlement'
            : 'EthSwitch RTGS Interbank')
      );
      setReconcileNotes(targetTx.reconciliationNotes || '');
      setReconcileAuditor(targetTx.reconciledBy || 'Senior Finance Auditor');
    }
    setReconcileError(null);
    setIsReconciliationModalOpen(true);
  };

  const handleExecuteReconciliation = () => {
    if (!selectedTxForReconciliation) return;
    if (!reconcileExternalRef.trim()) {
      setReconcileError('Please provide an external reference ID (e.g. CBE-CORE-892140).');
      return;
    }

    const result = paymentSettlementService.reconcileTransaction(
      selectedTxForReconciliation.id,
      reconcileExternalRef.trim(),
      reconcileNotes.trim() || undefined,
      reconcileAuditor.trim() || 'Senior Finance Auditor',
      reconcileBankRail
    );

    if (result.success) {
      setTransactions(paymentSettlementService.getTransactions());
      setPayoutNotification({
        message: `Settlement Record Reconciled: Marked as 'Bank Verified' for ${selectedTxForReconciliation.driverName} (${selectedTxForReconciliation.tripId})`,
        ref: reconcileExternalRef.trim(),
      });
      setIsReconciliationModalOpen(false);
      setSelectedTxForReconciliation(null);
    }
  };

  const handleExportCSV = () => {
    // Export currently filtered driver settlement records
    const headers = [
      'Transaction ID',
      'Date',
      'Trip ID',
      'Driver Name',
      'Passenger Name',
      'Gross Fare (ETB)',
      'Platform Commission (ETB)',
      'Withholding Tax (ETB)',
      'Net Payout (ETB)',
      'Payment Gateway',
      'Settlement Status',
      'Clearing Reference',
    ].join(',');

    const rows = filteredTransactions
      .map((tx) =>
        [
          `"${tx.id}"`,
          `"${tx.timestamp}"`,
          `"${tx.tripId}"`,
          `"${tx.driverName.replace(/"/g, '""')}"`,
          `"${tx.passengerName.replace(/"/g, '""')}"`,
          tx.grossFareETB.toFixed(2),
          tx.platformCommissionETB.toFixed(2),
          tx.withholdingTaxETB.toFixed(2),
          tx.netDriverETB.toFixed(2),
          `"${tx.gateway}"`,
          `"${tx.status}"`,
          `"${tx.reference}"`,
        ].join(',')
      )
      .join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driver_settlements_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* View Header with 3-Zone Clean Contract */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Finance &amp; Ledger</span>
            <span aria-hidden="true">·</span>
            <span>Ethiopian Digital Payments</span>
            <span aria-hidden="true">·</span>
            <span className={canManageFinance ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
              {canManageFinance ? `Treasury Authority (${userRole})` : `Read-Only Audit (${userRole})`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Payment Settlement & Driver Wallet Hub
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => handleOpenSplitSimulator()}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Simulate Commission Split</span>
          </button>
          <button
            onClick={() => handleOpenReconciliationModal()}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
            title="Open Manual Settlement Reconciliation"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Manual Reconciliation</span>
          </button>
          <button
            onClick={() => setIsWebhookModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate Webhook</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title={`Download CSV of ${filteredTransactions.length} filtered driver settlement records`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Payout Success Toast Banner */}
      {payoutNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{payoutNotification.message}</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                Bank Clearing Reference: {payoutNotification.ref}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPayoutNotification(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Financial Overview KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross GMV */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gross Volume (GMV)</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              ETB {grossGMV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across all ride & freight transactions</p>
          </div>
        </div>

        {/* Afronala Take Rate */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Platform Commission (15%)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              ETB {totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Net operational revenue retained</p>
          </div>
        </div>

        {/* 2% Withholding Tax */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Turnover Tax Withheld (2%)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
              ETB {totalTaxWithheld.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Ethiopian Ministry of Revenues remittance</p>
          </div>
        </div>

        {/* Net Driver Earnings */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Driver Wallets Credited (83%)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              ETB {totalNetDriverPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total driver wallet balances</p>
          </div>
        </div>
      </div>

      {/* Section 1: Driver Digital Wallet Balances & Instant Payouts */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Driver Digital Wallets & Disbursements</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instant mobile money transfers to Telebirr and Commercial Bank of Ethiopia (CBE Birr)
            </p>
          </div>
          <button
            onClick={() => handleOpenSplitSimulator()}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/15 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Simulate Driver Split</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                <th className="py-2.5 pl-3 pr-4">Driver Profile</th>
                <th className="py-2.5 px-4">Payout Rail</th>
                <th className="py-2.5 px-4 text-right">Available Balance</th>
                <th className="py-2.5 px-4 text-right">Lifetime Earnings</th>
                <th className="py-2.5 px-4">Last Payout</th>
                <th className="py-2.5 pl-4 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {wallets.map((wallet) => (
                <tr key={wallet.driverId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 pl-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {wallet.driverName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{wallet.driverName}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{wallet.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {wallet.preferredPayoutMethod === 'telebirr' ? (
                        <Smartphone className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                      ) : (
                        <Building className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                      )}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {wallet.preferredPayoutMethod === 'telebirr' ? 'Telebirr Mobile' : 'CBE Birr'}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">({wallet.payoutAccount})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-sm">
                    ETB {wallet.availableBalanceETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    ETB {wallet.totalEarnedETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                    {wallet.lastPayoutDate || 'Pending'}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenSplitSimulator(wallet.driverId)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 transition-colors flex items-center gap-1"
                        title={`Simulate commission split for ${wallet.driverName}`}
                      >
                        <Sliders className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        <span>Simulate Split</span>
                      </button>
                      <button
                        onClick={() => handleOpenPayout(wallet)}
                        disabled={wallet.availableBalanceETB <= 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Disburse</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Real-time Transaction Clearing Ledger */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Transaction Clearing Ledger</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live settlement audit with automated 15% platform fee and 2% withholding tax
            </p>
          </div>

          {/* Search & Channel Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, trip or driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 w-56"
              />
            </div>

            {/* Segmented Gateway Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['all', 'telebirr', 'cbe_birr', 'chapa', 'cash'] as const).map((gw) => (
                <button
                  key={gw}
                  onClick={() => setActiveGatewayFilter(gw)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                    activeGatewayFilter === gw
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {gw === 'all' ? 'All Channels' : gw.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Manual Reconcile Button */}
            <button
              onClick={() => handleOpenReconciliationModal()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Audit and manually reconcile settlement records"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Manual Reconcile</span>
            </button>

            {/* Download Filtered CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title={`Download CSV for ${filteredTransactions.length} filtered driver settlement records`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV ({filteredTransactions.length})</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                <th className="py-2.5 pl-3 pr-4">Reference &amp; Trip</th>
                <th className="py-2.5 px-4">Parties</th>
                <th className="py-2.5 px-4">Channel Rail</th>
                <th className="py-2.5 px-4 text-right">Gross Fare</th>
                <th className="py-2.5 px-4 text-right">Commission (15%)</th>
                <th className="py-2.5 px-4 text-right">Tax (2%)</th>
                <th className="py-2.5 px-4 text-right">Net Driver</th>
                <th className="py-2.5 pl-4 pr-3 text-right">Status &amp; Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 pl-3 pr-4">
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">{tx.reference}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">Trip #{tx.tripId} · {tx.timestamp}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-900 dark:text-white">{tx.driverName} (Driver)</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Passenger: {tx.passengerName}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium capitalize text-slate-800 dark:text-slate-200">
                        {tx.gateway.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{tx.channelDetails}</p>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    ETB {tx.grossFareETB.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                    -ETB {tx.platformCommissionETB.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-purple-700 dark:text-purple-400 tabular-nums">
                    -ETB {tx.withholdingTaxETB.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                    ETB {tx.netDriverETB.toFixed(2)}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    {tx.status === 'bank_verified' ? (
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Bank Verified</span>
                        </span>
                        {tx.externalRefId && (
                          <button
                            type="button"
                            onClick={() => handleOpenReconciliationModal(tx)}
                            className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 truncate max-w-[130px] hover:underline cursor-pointer"
                            title={`Audited External Ref: ${tx.externalRefId} (${tx.reconciliationBank || 'Bank'}). Click to view/edit audit record.`}
                          >
                            Ref: {tx.externalRefId}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Settled
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenReconciliationModal(tx)}
                          className="px-2 py-0.5 text-[11px] font-medium rounded-md border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 transition-colors flex items-center gap-1"
                          title="Open manual reconciliation to mark Bank Verified and attach external reference ID"
                        >
                          <FileCheck className="w-3 h-3 text-cyan-500" />
                          <span>Reconcile</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Confirmation Modal Dialog */}
      {selectedWalletForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Disburse Driver Earnings</h3>
              <button
                onClick={() => setSelectedWalletForPayout(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Recipient Driver:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedWalletForPayout.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Destination Rail:</span>
                  <span className="font-medium capitalize text-cyan-600 dark:text-cyan-400">
                    {selectedWalletForPayout.preferredPayoutMethod === 'telebirr' ? 'Telebirr Mobile Payout' : 'CBE Direct Transfer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Target Account / Phone:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{selectedWalletForPayout.payoutAccount}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Available Wallet Balance:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    ETB {selectedWalletForPayout.availableBalanceETB.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Payout Amount (ETB):
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={selectedWalletForPayout.availableBalanceETB}
                  min={50}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedWalletForPayout(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePayout}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
              >
                Confirm Instant Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Simulator Modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Simulate Payment Webhook</h3>
              </div>
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Payment Gateway Rail:
                </label>
                <select
                  value={simGateway}
                  onChange={(e) => setSimGateway(e.target.value as PaymentGateway)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="telebirr">Telebirr USSD *127# Instant Payment</option>
                  <option value="cbe_birr">Commercial Bank of Ethiopia (CBE Birr)</option>
                  <option value="chapa">Chapa Payment Checkout Webhook</option>
                  <option value="cash">In-Cab Cash Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Gross Fare Amount (ETB):
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Passenger Name:
                </label>
                <input
                  type="text"
                  value={simPassenger}
                  onChange={(e) => setSimPassenger(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Assign to Driver:
                </label>
                <select
                  value={simDriver}
                  onChange={(e) => setSimDriver(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {wallets.map((w) => (
                    <option key={w.driverId} value={w.driverName}>
                      {w.driverName} ({w.preferredPayoutMethod})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerWebhook}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Inject Payment Event</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Commission Split Simulator Modal */}
      {isSplitModalOpen && selectedSplitDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Driver Commission Split Simulator</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                      Live Telemetry
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Simulate Afronala platform fee deduction (15%) vs net driver take-home payout with Ethiopian 2% Turnover Withholding Tax.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Driver Selection Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Driver for Simulation:
                </label>
                <span className="text-[11px] text-slate-400">
                  Showing 5 registered fleet partners
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {wallets.map((w) => {
                  const isSelected = w.driverId === splitDriverId;
                  return (
                    <button
                      key={w.driverId}
                      type="button"
                      onClick={() => setSplitDriverId(w.driverId)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/50 shadow-xs ring-1 ring-cyan-500/50'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {w.driverName[0]}
                        </div>
                        <div className="truncate flex-1">
                          <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {w.driverName}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {w.preferredPayoutMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Wallet</span>
                        <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                          ETB {Math.floor(w.availableBalanceETB).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Simulation Source & Rate Adjustment Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              {/* Left Column: Data Source & Forecast Input */}
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Simulation Scope & Earnings Base:
                </label>
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSplitDataSource('recent')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      splitDataSource === 'recent'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Recent Trips ({combinedRecentTrips.length} Rides)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitDataSource('custom')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      splitDataSource === 'custom'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Custom Forecast (ETB)
                  </button>
                </div>

                {splitDataSource === 'custom' ? (
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Projected Gross Fare Amount (ETB):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                        ETB
                      </span>
                      <input
                        type="number"
                        min={100}
                        step={100}
                        value={customForecastGross}
                        onChange={(e) => setCustomForecastGross(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full pl-12 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Aggregated Completed Trips:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{combinedRecentTrips.length} trips</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Active Settlement Corridor:</span>
                      <span className="font-mono text-slate-900 dark:text-white">Addis Ababa Metropolitan</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Platform Commission Tiers & Slider */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Afronala Platform Fee Rate Tier:
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30">
                    {splitCommissionPercent}% Platform Fee
                  </span>
                </div>

                {/* Preset Tier Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { label: 'Standard Base', rate: 15, tag: 'Standard' },
                    { label: 'EV Green Fleet', rate: 10, tag: '10% Promo' },
                    { label: 'Express Corridor', rate: 12, tag: '12% Tier' },
                    { label: 'Freight & Peak', rate: 18, tag: '18% Heavy' },
                  ].map((tier) => (
                    <button
                      key={tier.rate}
                      type="button"
                      onClick={() => setSplitCommissionPercent(tier.rate)}
                      className={`px-2.5 py-1.5 rounded-lg text-left border transition-all ${
                        splitCommissionPercent === tier.rate
                          ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-semibold ring-1 ring-cyan-500'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      <p className="text-[11px] truncate leading-tight">{tier.label}</p>
                      <p className="text-xs font-bold font-mono mt-0.5">{tier.rate}%</p>
                    </button>
                  ))}
                </div>

                {/* Interactive Commission Rate Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Variable Rate Slider (5% – 25%)</span>
                    <span className="font-mono">Current: {splitCommissionPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    step={1}
                    value={splitCommissionPercent}
                    onChange={(e) => setSplitCommissionPercent(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>5% (Fleet Discount)</span>
                    <span>15% (Afronala Base)</span>
                    <span>25% (Maximum)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Visual Multi-Segment Proportional Ratio Meter */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gross Fare Distribution Ratio</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Gross Fare Base: ETB {totalSimulatedGross.toFixed(2)}
                </span>
              </div>

              {/* Segmented Progress Bar */}
              <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex border border-slate-700">
                <div
                  style={{ width: `${simDriverSharePct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-950"
                  title={`Driver Net Payout: ${simDriverSharePct}%`}
                >
                  {parseFloat(simDriverSharePct) > 15 ? `${simDriverSharePct}%` : ''}
                </div>
                <div
                  style={{ width: `${simPlatformSharePct}%` }}
                  className="bg-cyan-500 h-full transition-all duration-300 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-950"
                  title={`Afronala Platform Commission: ${simPlatformSharePct}%`}
                >
                  {parseFloat(simPlatformSharePct) > 10 ? `${simPlatformSharePct}%` : ''}
                </div>
                <div
                  style={{ width: `${simTaxSharePct}%` }}
                  className="bg-purple-500 h-full transition-all duration-300"
                  title={`Turnover Tax Withholding: ${simTaxSharePct}%`}
                />
              </div>

              {/* Legend Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-slate-300 font-medium">Net Driver Payout:</span>
                  <span className="font-mono font-bold text-emerald-400">{simDriverSharePct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                  <span className="text-slate-300 font-medium">Afronala Platform Fee:</span>
                  <span className="font-mono font-bold text-cyan-400">{simPlatformSharePct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span className="text-slate-300 font-medium">Ministry TOT (Withholding Tax):</span>
                  <span className="font-mono font-bold text-purple-400">{simTaxSharePct}%</span>
                </div>
              </div>
            </div>

            {/* 4. High-Contrast Financial Impact Summary (4 KPI Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Gross GMV */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Gross Fare (GMV)</p>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-1">
                  ETB {totalSimulatedGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">100% Total passenger billing</p>
              </div>

              {/* Afronala Fee */}
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300">Afronala Platform Fee</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-cyan-200 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 font-bold">
                    {splitCommissionPercent}%
                  </span>
                </div>
                <p className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums mt-1">
                  ETB {simPlatformCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80 mt-0.5">Retained platform operations revenue</p>
              </div>

              {/* 2% TOT Tax */}
              <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">Turnover Withholding Tax</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">
                    2.0%
                  </span>
                </div>
                <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums mt-1">
                  ETB {simTaxWithheld.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 mt-0.5">Ministry of Revenues clearing</p>
              </div>

              {/* Net Driver Take-Home */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/50">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Net Driver Payout</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                    {simDriverSharePct}%
                  </span>
                </div>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                  ETB {simDriverNetPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  Direct credit to {selectedSplitDriver.preferredPayoutMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'}
                </p>
              </div>
            </div>

            {/* 5. Granular Per-Trip Simulation Ledger Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Itemized Trip Commission Split Breakdown ({combinedRecentTrips.length} Rides for {selectedSplitDriver.driverName})
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Applied Split: {splitCommissionPercent}% Platform · 2% TOT · {simDriverSharePct}% Driver
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-56">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Trip ID & Route</th>
                      <th className="py-2.5 px-3">Passenger</th>
                      <th className="py-2.5 px-3 text-right">Gross Fare</th>
                      <th className="py-2.5 px-3 text-right">Afronala Fee ({splitCommissionPercent}%)</th>
                      <th className="py-2.5 px-3 text-right">TOT Tax (2%)</th>
                      <th className="py-2.5 px-3 text-right">Net Driver Credit</th>
                      <th className="py-2.5 px-3">Payment Rail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {combinedRecentTrips.map((trip) => {
                      const tripPlatformFee = Math.round(trip.grossFareETB * (splitCommissionPercent / 100) * 100) / 100;
                      const tripTax = Math.round(trip.grossFareETB * (splitTaxPercent / 100) * 100) / 100;
                      const tripNet = Math.max(0, Math.round((trip.grossFareETB - tripPlatformFee - tripTax) * 100) / 100);

                      return (
                        <tr key={trip.tripId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-sans">
                            <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">{trip.tripId}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{trip.route}</p>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">
                            {trip.passenger}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                            ETB {trip.grossFareETB.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-cyan-600 dark:text-cyan-400 font-semibold">
                            -ETB {tripPlatformFee.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-purple-600 dark:text-purple-400">
                            -ETB {tripTax.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            +ETB {tripNet.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="capitalize text-[11px] text-slate-600 dark:text-slate-300">
                              {trip.gateway.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>
                  Simulating for <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSplitDriver.driverName}</span> · Payout Account: {selectedSplitDriver.payoutAccount}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsSplitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={handleCommitSimulatedSettlement}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Commit Split to Driver Wallet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Settlement Reconciliation Modal */}
      {isReconciliationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Manual Settlement Reconciliation</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Audit Mode
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Verify banking statement records, mark settlement as &apos;Bank Verified&apos;, and attach external audit reference ID.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReconciliationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Transaction Picker */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Settlement Record to Audit:
              </label>
              <select
                value={selectedTxForReconciliation?.id || ''}
                onChange={(e) => {
                  const found = transactions.find((t) => t.id === e.target.value);
                  if (found) {
                    setSelectedTxForReconciliation(found);
                    setReconcileExternalRef(
                      found.externalRefId ||
                        `${found.gateway === 'cbe_birr' ? 'CBE-CORE-' : found.gateway === 'telebirr' ? 'TB-ENT-' : 'ETHSWITCH-'}${Math.floor(
                          100000 + Math.random() * 900000
                        )}`
                    );
                    setReconcileBankRail(
                      found.reconciliationBank ||
                        (found.gateway === 'cbe_birr'
                          ? 'Commercial Bank of Ethiopia'
                          : found.gateway === 'telebirr'
                          ? 'Telebirr Enterprise Settlement'
                          : 'EthSwitch RTGS Interbank')
                    );
                    setReconcileNotes(found.reconciliationNotes || '');
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              >
                {transactions.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.reference} · #{tx.tripId} · {tx.driverName} (ETB {tx.grossFareETB.toFixed(2)} - {tx.gateway.toUpperCase()})
                    {tx.status === 'bank_verified' ? ' [Bank Verified]' : ' [Settled]'}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Transaction Overview Card */}
            {selectedTxForReconciliation && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Driver & Passenger:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedTxForReconciliation.driverName} (Driver) · {selectedTxForReconciliation.passengerName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Internal Reference & Rail:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedTxForReconciliation.reference} · <span className="capitalize">{selectedTxForReconciliation.gateway.replace('_', ' ')}</span>
                  </span>
                </div>

                {/* 3-Column Monetary Split Preview */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center font-mono">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-sans">Gross Fare</p>
                    <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                      ETB {selectedTxForReconciliation.grossFareETB.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-sans">Commission (15%)</p>
                    <p className="font-bold text-cyan-600 dark:text-cyan-400 text-xs mt-0.5">
                      ETB {selectedTxForReconciliation.platformCommissionETB.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-sans">Net Driver Payout</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                      ETB {selectedTxForReconciliation.netDriverETB.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reconciliation Audit Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    External Bank Reference ID <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefix =
                        selectedTxForReconciliation?.gateway === 'cbe_birr'
                          ? 'CBE-CORE-'
                          : selectedTxForReconciliation?.gateway === 'telebirr'
                          ? 'TB-ENT-'
                          : 'ETHSWITCH-';
                      setReconcileExternalRef(`${prefix}${Math.floor(100000 + Math.random() * 900000)}`);
                      setReconcileError(null);
                    }}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Generate Sample Ref
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. CBE-CORE-894102 or TB-SETTLE-49102"
                  value={reconcileExternalRef}
                  onChange={(e) => {
                    setReconcileExternalRef(e.target.value);
                    if (reconcileError) setReconcileError(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  National Bank of Ethiopia (NBE) RTGS clearing number, EthSwitch transaction ID, or CBE daily bank statement clearance code.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Clearing Institution / Bank Gateway Rail:
                </label>
                <select
                  value={reconcileBankRail}
                  onChange={(e) => setReconcileBankRail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia (CBE Core)</option>
                  <option value="Telebirr Enterprise Settlement">Telebirr Enterprise Portal (Ethio Telecom)</option>
                  <option value="EthSwitch RTGS Interbank">EthSwitch RTGS Interbank Clearing (NBE)</option>
                  <option value="Chapa Merchant Clearing">Chapa Merchant Gateway</option>
                  <option value="Dashen Bank Amole">Dashen Bank Amole Clearing</option>
                  <option value="Awash Bank Switch">Awash Bank Digital Switch</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Reconciling Admin / Auditor:
                </label>
                <input
                  type="text"
                  value={reconcileAuditor}
                  onChange={(e) => setReconcileAuditor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Audit Reconciliation Notes (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified against CBE morning settlement credit batch #412 line 18."
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {reconcileError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reconcileError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Audit Status: <span className="font-bold text-emerald-600 dark:text-emerald-400">Bank Verified</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsReconciliationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReconciliation}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mark as Bank Verified</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
