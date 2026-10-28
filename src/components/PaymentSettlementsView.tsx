import React, { useState } from 'react';
import {
  DriverWallet,
  EastAfricaCountryCode,
  PaymentGateway,
  PaymentTransaction,
  PermissionAction,
} from '../types';
import {
  paymentSettlementService,
  COMMISSION_RATE,
  WITHHOLDING_TAX_RATE,
  EAST_AFRICA_HUBS,
  RegionalSettlementHub,
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
  Globe,
  ArrowRight,
  Check,
} from 'lucide-react';

interface DriverRecentTrip {
  tripId: string;
  route: string;
  passenger: string;
  grossFareETB: number;
  gateway: PaymentGateway;
  timestamp: string;
  countryCode?: EastAfricaCountryCode;
}

const DRIVER_SAMPLE_TRIPS: Record<string, DriverRecentTrip[]> = {
  'drv-1': [
    { tripId: 'TRP9281', route: 'Bole Medhanialem → Piassa Churchill Rd', passenger: 'Selamawit Bekele', grossFareETB: 340, gateway: 'telebirr', timestamp: '10 min ago', countryCode: 'ET' },
    { tripId: 'TRP9275', route: 'Kazanchis UNECA → Bole Int’l Airport T2', passenger: 'Meron Assefa', grossFareETB: 410, gateway: 'telebirr', timestamp: '2 hours ago', countryCode: 'ET' },
    { tripId: 'TRP9261', route: 'CMC Michael → Mexico Square', passenger: 'Tewodros Kassahun', grossFareETB: 380, gateway: 'cbe_birr', timestamp: 'Yesterday, 17:40', countryCode: 'ET' },
    { tripId: 'TRP9254', route: 'Sarbet OAU → Megenagna Square', passenger: 'Hanna Yohannes', grossFareETB: 290, gateway: 'telebirr', timestamp: 'Yesterday, 14:15', countryCode: 'ET' },
  ],
  'drv-2': [
    { tripId: 'TRP9283', route: 'Gerji Imperial → 4 Kilo University Gate', passenger: 'Kidus Yohannes', grossFareETB: 480, gateway: 'cbe_birr', timestamp: '25 min ago', countryCode: 'ET' },
    { tripId: 'TRP9270', route: 'Bole Atlas → Tor Hailoch Hospital', passenger: 'Bethlehem Girma', grossFareETB: 350, gateway: 'cbe_birr', timestamp: '3 hours ago', countryCode: 'ET' },
    { tripId: 'TRP9258', route: 'Gurd Shola → Piassa De Gaulle', passenger: 'Solomon Worku', grossFareETB: 310, gateway: 'telebirr', timestamp: 'Yesterday, 18:20', countryCode: 'ET' },
  ],
  'drv-3': [
    { tripId: 'TRP9279', route: 'Lideta Mercato → Gotera Interchange', passenger: 'Yared Mulugeta', grossFareETB: 220, gateway: 'cash', timestamp: '1 hour ago', countryCode: 'ET' },
    { tripId: 'TRP9266', route: 'Kera Slaughterhouse → Bole Bulbula', passenger: 'Daniel Berhanu', grossFareETB: 390, gateway: 'telebirr', timestamp: '4 hours ago', countryCode: 'ET' },
    { tripId: 'TRP9250', route: 'Ayat Zone 3 → Saris Abo Church', passenger: 'Hiwot Tadesse', grossFareETB: 440, gateway: 'telebirr', timestamp: 'Yesterday, 11:30', countryCode: 'ET' },
  ],
  'drv-4': [
    { tripId: 'TRP9280', route: 'Kality Freight Dry Port → Akaki Customs', passenger: 'Blen Tesfaye (Logistics)', grossFareETB: 620, gateway: 'chapa', timestamp: '45 min ago', countryCode: 'ET' },
    { tripId: 'TRP9269', route: 'Sebeta Industrial Park → Meskel Sq Depot', passenger: 'Hailemariam Desalegn', grossFareETB: 850, gateway: 'cbe_birr', timestamp: '3 hours ago', countryCode: 'ET' },
    { tripId: 'TRP9252', route: 'Bole Lemi National Park → Piassa', passenger: 'Senait Wolde', grossFareETB: 540, gateway: 'cbe_birr', timestamp: 'Yesterday, 16:00', countryCode: 'ET' },
  ],
  'drv-5': [
    { tripId: 'TRP9272', route: 'Old Airport Golf Club → Kazanchis Elilly', passenger: 'Abel Tefera', grossFareETB: 290, gateway: 'cbe_birr', timestamp: '3 hours ago', countryCode: 'ET' },
    { tripId: 'TRP9264', route: 'Summit Condominium → Bole Rwanda', passenger: 'Liya Kebede', grossFareETB: 370, gateway: 'telebirr', timestamp: '5 hours ago', countryCode: 'ET' },
    { tripId: 'TRP9248', route: 'Sidist Kilo Science → Mexico Stadium', passenger: 'Eskinder Nega', grossFareETB: 260, gateway: 'telebirr', timestamp: 'Yesterday, 09:15', countryCode: 'ET' },
  ],
  'drv-dj-1': [
    { tripId: 'DLV7721', route: 'Modjo Dry Port ⇄ Doraleh Multi-Purpose Port', passenger: 'Djibouti Multimodal Transit SA', grossFareETB: 24500, gateway: 'dmoney_dj', timestamp: '40 min ago', countryCode: 'DJ' },
    { tripId: 'DLV7710', route: 'Galafi Border Post → PK12 Logistics Zone', passenger: 'Red Sea Cargo Logistics', grossFareETB: 18200, gateway: 'dmoney_dj', timestamp: 'Yesterday, 14:00', countryCode: 'DJ' },
  ],
  'drv-ke-1': [
    { tripId: 'TRP-NBO-102', route: 'Westlands Commercial Hub → Upper Hill', passenger: 'Wanjiku Mwangi', grossFareETB: 1250, gateway: 'mpesa_ke', timestamp: '1 hour ago', countryCode: 'KE' },
    { tripId: 'TRP-NBO-098', route: 'JKIA Airport Terminal 1A → Kilimani', passenger: 'David Otieno', grossFareETB: 1680, gateway: 'mpesa_ke', timestamp: 'Yesterday, 18:30', countryCode: 'KE' },
  ],
  'drv-ug-1': [
    { tripId: 'TRP-KLA-551', route: 'Kololo Business Park → Entebbe Rd Express', passenger: 'Grace Namubiru', grossFareETB: 890, gateway: 'mtn_ug', timestamp: '2 hours ago', countryCode: 'UG' },
    { tripId: 'TRP-KLA-542', route: 'Nakawa Industrial Area → Ntinda Central', passenger: 'Samuel Kateregga', grossFareETB: 720, gateway: 'mtn_ug', timestamp: 'Yesterday, 16:15', countryCode: 'UG' },
  ],
  'drv-rw-1': [
    { tripId: 'TRP-KGL-311', route: 'Kigali Heights → Kigali Special Economic Zone', passenger: 'Aline Umutoni', grossFareETB: 920, gateway: 'mtn_rw', timestamp: '3 hours ago', countryCode: 'RW' },
  ],
  'drv-tz-1': [
    { tripId: 'TRP-DAR-804', route: 'Dar es Salaam Port Terminal 2 → Kariakoo Market', passenger: 'Baraka Mushi', grossFareETB: 1420, gateway: 'mpesa_tz', timestamp: '4 hours ago', countryCode: 'TZ' },
  ],
  'drv-so-1': [
    { tripId: 'TRP-MGQ-201', route: 'Aden Adde Int Airport → Bakara Commercial Hub', passenger: 'Farhan Nur', grossFareETB: 1850, gateway: 'evc_plus_so', timestamp: '5 hours ago', countryCode: 'SO' },
  ],
  'drv-ss-1': [
    { tripId: 'TRP-JUB-091', route: 'Juba River Port → Custom Market Transit', passenger: 'Emmanuel Lado', grossFareETB: 1100, gateway: 'mgurush_ss', timestamp: '6 hours ago', countryCode: 'SS' },
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

  // Regional Settlement Hub Filter (East Africa)
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode | 'ALL'>('ALL');
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
  const [simCountry, setSimCountry] = useState<EastAfricaCountryCode>('ET');
  const [simGateway, setSimGateway] = useState<PaymentGateway>('telebirr');
  const [simAmount, setSimAmount] = useState<number>(380);
  const [simPassenger, setSimPassenger] = useState('Kidist Tilahun');
  const [simDriver, setSimDriver] = useState('Abebe Kebede');

  // Country details lookup
  const activeHubInfo: RegionalSettlementHub | null =
    selectedCountry !== 'ALL' ? EAST_AFRICA_HUBS[selectedCountry] || null : null;

  // Filtered transactions by country & gateway & search
  const filteredTransactions = transactions.filter((tx) => {
    const matchesCountry = selectedCountry === 'ALL' || (tx.countryCode || 'ET') === selectedCountry;
    const matchesGateway = activeGatewayFilter === 'all' || tx.gateway === activeGatewayFilter;
    const matchesSearch =
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.tripId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.currency && tx.currency.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.countryCode && tx.countryCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCountry && matchesGateway && matchesSearch;
  });

  // Filtered wallets by country
  const filteredWallets = wallets.filter((w) => {
    if (selectedCountry === 'ALL') return true;
    return (w.countryCode || 'ET') === selectedCountry;
  });

  // Dynamic KPI calculations for filtered scope
  const grossGMV = filteredTransactions.reduce((acc, tx) => acc + tx.grossFareETB, 0);
  const totalCommission = filteredTransactions.reduce((acc, tx) => acc + tx.platformCommissionETB, 0);
  const totalTaxWithheld = filteredTransactions.reduce((acc, tx) => acc + tx.withholdingTaxETB, 0);
  const totalNetDriverPaid = filteredTransactions.reduce((acc, tx) => acc + tx.netDriverETB, 0);

  // Available gateways for current country selection
  const availableGateways = React.useMemo(() => {
    if (selectedCountry === 'ALL') {
      return [
        { id: 'all' as const, label: 'All Channels' },
        { id: 'telebirr' as const, label: 'Telebirr (ET)' },
        { id: 'cbe_birr' as const, label: 'CBE Birr (ET)' },
        { id: 'chapa' as const, label: 'Chapa (ET)' },
        { id: 'dmoney_dj' as const, label: 'D-Money (DJ)' },
        { id: 'mpesa_ke' as const, label: 'M-PESA (KE)' },
        { id: 'airtel_ke' as const, label: 'Airtel (KE)' },
        { id: 'mtn_ug' as const, label: 'MTN MoMo (UG)' },
        { id: 'mtn_rw' as const, label: 'MTN MoMo (RW)' },
        { id: 'mpesa_tz' as const, label: 'M-Pesa (TZ)' },
        { id: 'evc_plus_so' as const, label: 'EVC Plus (SO)' },
        { id: 'mgurush_ss' as const, label: 'm-GURUSH (SS)' },
        { id: 'cash' as const, label: 'Cash Receipt' },
      ];
    }
    const hub = EAST_AFRICA_HUBS[selectedCountry];
    if (!hub) return [{ id: 'all' as const, label: 'All Channels' }];
    return [
      { id: 'all' as const, label: 'All Hub Channels' },
      ...hub.gateways.map((g) => ({ id: g.id, label: g.name })),
    ];
  }, [selectedCountry]);

  const handleCountryChange = (cCode: EastAfricaCountryCode | 'ALL') => {
    setSelectedCountry(cCode);
    setActiveGatewayFilter('all');
  };

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
    paymentSettlementService.simulateWebhook(simGateway, simAmount, simPassenger, simDriver, simCountry);
    setTransactions(paymentSettlementService.getTransactions());
    setWallets(paymentSettlementService.getWallets());
    setIsWebhookModalOpen(false);
  };

  const handleOpenSplitSimulator = (driverId?: string) => {
    if (driverId) {
      setSplitDriverId(driverId);
    } else {
      const currentList = filteredWallets.length > 0 ? filteredWallets : wallets;
      setSplitDriverId(currentList[0]?.driverId || 'drv-1');
    }
    setIsSplitModalOpen(true);
  };

  const selectedSplitDriver = wallets.find((w) => w.driverId === splitDriverId) || wallets[0];

  // Resolve trips for selected driver
  const driverLiveTxs = transactions.filter(
    (tx) => tx.driverId === selectedSplitDriver?.driverId || tx.driverName === selectedSplitDriver?.driverName
  );

  const fallbackTrips = selectedSplitDriver ? DRIVER_SAMPLE_TRIPS[selectedSplitDriver.driverId] || [] : [];

  const combinedRecentTrips: DriverRecentTrip[] = [
    ...driverLiveTxs.map((tx) => ({
      tripId: tx.tripId,
      route: tx.channelDetails || 'Regional Express Transit Corridor',
      passenger: tx.passengerName,
      grossFareETB: tx.grossFareETB,
      gateway: tx.gateway,
      timestamp: tx.timestamp,
      countryCode: tx.countryCode,
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
    const driverCountry = selectedSplitDriver.countryCode || 'ET';
    const newTx = paymentSettlementService.processSettlement(
      simTripId,
      selectedSplitDriver.driverId,
      selectedSplitDriver.driverName,
      'Regional Settlement Commission Audit',
      totalSimulatedGross,
      selectedSplitDriver.preferredPayoutMethod,
      splitCommissionPercent / 100,
      driverCountry
    );

    setTransactions(paymentSettlementService.getTransactions());
    setWallets(paymentSettlementService.getWallets());
    setIsSplitModalOpen(false);
    setPayoutNotification({
      message: `Commission Split Committed: ETB ${simDriverNetPayout.toFixed(2)} credited to ${selectedSplitDriver.driverName} (${driverCountry}) (Platform: ETB ${simPlatformCommission.toFixed(2)}, Tax: ETB ${simTaxWithheld.toFixed(2)})`,
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
      const cCode = targetTx.countryCode || 'ET';
      setReconcileExternalRef(
        targetTx.externalRefId ||
          `${cCode === 'DJ' ? 'DJ-BCIMR-' : cCode === 'KE' ? 'CBK-RTGS-' : cCode === 'UG' ? 'BOU-MOMO-' : targetTx.gateway === 'cbe_birr' ? 'CBE-CORE-' : 'NBE-RTGS-'}${Math.floor(
            100000 + Math.random() * 900000
          )}`
      );
      setReconcileBankRail(
        targetTx.reconciliationBank ||
          (cCode === 'DJ'
            ? 'Banque pour le Commerce et l’Industrie Mer Rouge (BCIMR)'
            : cCode === 'KE'
            ? 'Central Bank of Kenya RTGS / Safaricom'
            : cCode === 'UG'
            ? 'Bank of Uganda Interbank Rail'
            : cCode === 'RW'
            ? 'National Bank of Rwanda / BNR Switch'
            : targetTx.gateway === 'cbe_birr'
            ? 'Commercial Bank of Ethiopia'
            : 'Telebirr Enterprise Settlement')
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
      setReconcileError('Please provide an external reference clearing ID.');
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
    const headers = [
      'Transaction ID',
      'Country Hub',
      'Date',
      'Trip ID',
      'Driver Name',
      'Passenger Name',
      'Gross Fare (ETB)',
      'Local Amount',
      'Currency',
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
          `"${tx.countryCode || 'ET'}"`,
          `"${tx.timestamp}"`,
          `"${tx.tripId}"`,
          `"${tx.driverName.replace(/"/g, '""')}"`,
          `"${tx.passengerName.replace(/"/g, '""')}"`,
          tx.grossFareETB.toFixed(2),
          (tx.localAmount || tx.grossFareETB).toFixed(2),
          `"${tx.currency || 'ETB'}"`,
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
    a.download = `east_africa_settlements_${selectedCountry.toLowerCase()}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* View Header with Multi-Country Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Treasury &amp; Financial Clearing</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 font-medium text-cyan-600 dark:text-cyan-400">
              <Globe className="w-3.5 h-3.5" />
              <span>East Africa Cross-Border Clearing Hub (8 Nations)</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className={canManageFinance ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
              {canManageFinance ? `Treasury Authority (${userRole})` : `Read-Only Audit (${userRole})`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <span>Payment Settlements &amp; Regional Hub</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Active Interbank Rails
            </span>
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
            onClick={() => {
              setSimCountry(selectedCountry === 'ALL' ? 'ET' : selectedCountry);
              setIsWebhookModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate Webhook</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title={`Download CSV of ${filteredTransactions.length} settlement records`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* East Africa Regional Settlement Hub Selector Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              East Africa Regional Settlement Hubs &amp; Corridors
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Bilateral freight clearing, cross-border corridors &amp; domestic mobile rails
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => handleCountryChange('ALL')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border ${
              selectedCountry === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
            }`}
          >
            <span className="text-sm">🌍</span>
            <span>All East Africa Hubs</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${selectedCountry === 'ALL' ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              8 Nations
            </span>
          </button>

          {(Object.keys(EAST_AFRICA_HUBS) as EastAfricaCountryCode[]).map((cCode) => {
            const hub = EAST_AFRICA_HUBS[cCode];
            const isSelected = selectedCountry === cCode;
            return (
              <button
                key={cCode}
                onClick={() => handleCountryChange(cCode)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                }`}
              >
                <span className="text-base leading-none">{hub.flag}</span>
                <span>{hub.countryName}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {hub.currency}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Hub Detail Banner */}
        {activeHubInfo ? (
          <div className="mt-2 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeHubInfo.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {activeHubInfo.countryName} Settlement Hub
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30">
                    Regulator: {activeHubInfo.regulator}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Corridor Note:</span> {activeHubInfo.settlementCorridorNote}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Base Currency</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {activeHubInfo.currency} ({activeHubInfo.currencySymbol})
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ETB Peg / Rate</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  1 {activeHubInfo.currency} = {activeHubInfo.exchangeRateToETB} ETB
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Gateways</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {activeHubInfo.gateways.map((gw) => (
                    <span key={gw.id} className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {gw.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>
                <strong>Unified Cross-Border Clearing:</strong> Showing consolidated transactions across Ethiopia, Kenya, Uganda, Rwanda, Tanzania, Djibouti, Somalia, and South Sudan.
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
              Key Focus: Modjo–Djibouti Port Container Corridor &amp; Moyale Cross-Border Freight
            </div>
          </div>
        )}
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Gross Volume (GMV) {selectedCountry !== 'ALL' && `[${selectedCountry}]`}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              ETB {grossGMV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {filteredTransactions.length} settled trips &amp; freight manifests
            </p>
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Statutory Tax Withheld (2%)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
              ETB {totalTaxWithheld.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {activeHubInfo ? `${activeHubInfo.regulator} remittance` : 'Regional Revenue Authorities'}
            </p>
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
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Disbursable to regional drivers</p>
          </div>
        </div>
      </div>

      {/* Section 1: Driver Digital Wallet Balances & Instant Payouts */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Driver Digital Wallets &amp; Regional Disbursements</span>
              {selectedCountry !== 'ALL' && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                  {EAST_AFRICA_HUBS[selectedCountry]?.flag} {EAST_AFRICA_HUBS[selectedCountry]?.countryName}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instant mobile disbursements across Telebirr, CBE Birr, Safaricom M-PESA, MTN MoMo, D-Money, EVC Plus &amp; m-GURUSH
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
                <th className="py-2.5 px-4">Regional Hub</th>
                <th className="py-2.5 px-4">Payout Rail &amp; Account</th>
                <th className="py-2.5 px-4 text-right">Available Balance</th>
                <th className="py-2.5 px-4 text-right">Lifetime Earnings</th>
                <th className="py-2.5 px-4">Last Payout</th>
                <th className="py-2.5 pl-4 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No active drivers registered in this regional hub yet.
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet) => {
                  const cCode = wallet.countryCode || 'ET';
                  const hub = EAST_AFRICA_HUBS[cCode] || EAST_AFRICA_HUBS.ET;
                  const localBalance = wallet.currency && wallet.currency !== 'ETB'
                    ? (wallet.availableBalanceETB / hub.exchangeRateToETB).toFixed(2)
                    : null;

                  return (
                    <tr key={wallet.driverId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {wallet.driverName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{wallet.driverName}</span>
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{wallet.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          <span>{hub.flag}</span>
                          <span>{hub.countryName}</span>
                          <span className="text-[10px] text-slate-400">({hub.currency})</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {wallet.preferredPayoutMethod.includes('birr') || wallet.preferredPayoutMethod.includes('cbe') ? (
                            <Building className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                          )}
                          <span className="font-medium capitalize text-slate-800 dark:text-slate-200">
                            {wallet.preferredPayoutMethod.replace('_', ' ').replace('ke', 'Kenya').replace('ug', 'Uganda').replace('rw', 'Rwanda').replace('tz', 'Tanzania').replace('dj', 'Djibouti').replace('so', 'Somalia').replace('ss', 'South Sudan')}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate max-w-[190px]">
                          {wallet.payoutAccount}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-sm">
                          ETB {wallet.availableBalanceETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {localBalance && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            ≈ {hub.currency} {parseFloat(localBalance).toLocaleString()}
                          </p>
                        )}
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
                            <span>Split</span>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Real-time Transaction Clearing Ledger */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Transaction Clearing Ledger</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({filteredTransactions.length} records)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live settlement audit with automated 15% platform fee and statutory 2% withholding tax across all East African corridors
            </p>
          </div>

          {/* Search & Channel Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ref, trip, driver, currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 w-60"
              />
            </div>

            {/* Segmented Gateway Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-full overflow-x-auto">
              {availableGateways.map((gw) => (
                <button
                  key={gw.id}
                  onClick={() => setActiveGatewayFilter(gw.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeGatewayFilter === gw.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {gw.label}
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
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                <th className="py-2.5 pl-3 pr-2">Hub</th>
                <th className="py-2.5 px-3">Reference &amp; Trip</th>
                <th className="py-2.5 px-3">Parties</th>
                <th className="py-2.5 px-3">Channel Rail</th>
                <th className="py-2.5 px-3 text-right">Gross Fare</th>
                <th className="py-2.5 px-3 text-right">Commission (15%)</th>
                <th className="py-2.5 px-3 text-right">Tax (2%)</th>
                <th className="py-2.5 px-3 text-right">Net Driver</th>
                <th className="py-2.5 pl-3 pr-3 text-right">Status &amp; Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const cCode = tx.countryCode || 'ET';
                  const hub = EAST_AFRICA_HUBS[cCode] || EAST_AFRICA_HUBS.ET;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-3 pr-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700" title={`${hub.countryName} Hub`}>
                          <span>{hub.flag}</span>
                          <span className="font-mono text-[10px]">{cCode}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-mono font-semibold text-slate-900 dark:text-white">{tx.reference}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          Trip #{tx.tripId} · {tx.timestamp}
                        </p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-slate-900 dark:text-white">{tx.driverName} (Driver)</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">Passenger: {tx.passengerName}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium capitalize text-slate-800 dark:text-slate-200">
                            {tx.gateway.replace('_', ' ').replace('ke', 'Kenya').replace('ug', 'Uganda').replace('rw', 'Rwanda').replace('tz', 'Tanzania').replace('dj', 'Djibouti').replace('so', 'Somalia').replace('ss', 'South Sudan')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[190px]">
                          {tx.channelDetails}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <p className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          ETB {tx.grossFareETB.toFixed(2)}
                        </p>
                        {tx.currency && tx.currency !== 'ETB' && tx.localAmount && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            {tx.currency} {tx.localAmount.toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                        -ETB {tx.platformCommissionETB.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-purple-700 dark:text-purple-400 tabular-nums">
                        -ETB {tx.withholdingTaxETB.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <p className="font-mono font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                          ETB {tx.netDriverETB.toFixed(2)}
                        </p>
                        {tx.currency && tx.currency !== 'ETB' && (
                          <p className="text-[10px] text-blue-500 dark:text-blue-400 font-mono tabular-nums">
                            ≈ {tx.currency} {(tx.netDriverETB / hub.exchangeRateToETB).toFixed(0)}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 pr-3 text-right">
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Confirmation Modal Dialog */}
      {selectedWalletForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Disburse Driver Earnings</span>
                <span className="text-sm">
                  {EAST_AFRICA_HUBS[selectedWalletForPayout.countryCode || 'ET']?.flag}
                </span>
              </h3>
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
                  <span className="text-slate-500 dark:text-slate-400">Settlement Hub:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {EAST_AFRICA_HUBS[selectedWalletForPayout.countryCode || 'ET']?.countryName} ({selectedWalletForPayout.countryCode || 'ET'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Destination Rail:</span>
                  <span className="font-medium capitalize text-cyan-600 dark:text-cyan-400">
                    {selectedWalletForPayout.preferredPayoutMethod.replace('_', ' ')}
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
                {selectedWalletForPayout.countryCode && selectedWalletForPayout.countryCode !== 'ET' && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Equivalent local disbursement: ≈ {selectedWalletForPayout.currency}{' '}
                    {(
                      parseFloat(payoutAmount || '0') /
                      (EAST_AFRICA_HUBS[selectedWalletForPayout.countryCode]?.exchangeRateToETB || 1)
                    ).toFixed(2)}
                  </p>
                )}
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

      {/* Webhook Simulator Modal (Supports all 8 East Africa Hubs) */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Simulate Regional Webhook</h3>
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
                  Regional Settlement Hub:
                </label>
                <select
                  value={simCountry}
                  onChange={(e) => {
                    const cCode = e.target.value as EastAfricaCountryCode;
                    setSimCountry(cCode);
                    const hub = EAST_AFRICA_HUBS[cCode];
                    if (hub && hub.gateways.length > 0) {
                      setSimGateway(hub.gateways[0].id);
                    }
                    const matchingDriver = wallets.find((w) => (w.countryCode || 'ET') === cCode);
                    if (matchingDriver) {
                      setSimDriver(matchingDriver.driverName);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {(Object.keys(EAST_AFRICA_HUBS) as EastAfricaCountryCode[]).map((cCode) => {
                    const hub = EAST_AFRICA_HUBS[cCode];
                    return (
                      <option key={cCode} value={cCode}>
                        {hub.flag} {hub.countryName} ({hub.currency})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Payment Gateway Rail:
                </label>
                <select
                  value={simGateway}
                  onChange={(e) => setSimGateway(e.target.value as PaymentGateway)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {EAST_AFRICA_HUBS[simCountry]?.gateways.map((gw) => (
                    <option key={gw.id} value={gw.id}>
                      {gw.name} — {gw.provider} ({gw.settlementSpeed})
                    </option>
                  ))}
                  <option value="cash">In-Cab Cash Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Gross Fare Amount (ETB Base):
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                {simCountry !== 'ET' && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Local currency preview: ≈ {EAST_AFRICA_HUBS[simCountry]?.currency}{' '}
                    {(simAmount / (EAST_AFRICA_HUBS[simCountry]?.exchangeRateToETB || 1)).toFixed(2)}
                  </p>
                )}
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
                      {w.driverName} [{w.countryCode || 'ET'}] ({w.preferredPayoutMethod})
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
                    <span>Regional Commission Split Simulator</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                      Cross-Border Telemetry
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Simulate Afronala platform fee deduction (15%) vs net driver take-home payout with statutory 2% Turnover Withholding Tax across all 8 East African Hubs.
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
                  Showing {wallets.length} registered fleet partners across East Africa
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {wallets.map((w) => {
                  const isSelected = w.driverId === splitDriverId;
                  const cCode = w.countryCode || 'ET';
                  const hub = EAST_AFRICA_HUBS[cCode] || EAST_AFRICA_HUBS.ET;

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
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {hub.flag}
                        </div>
                        <div className="truncate flex-1">
                          <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {w.driverName}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {hub.countryName} · {w.preferredPayoutMethod.replace('_', ' ')}
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
                  Simulation Scope &amp; Earnings Base:
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
                      <span>Corridor / Country Hub:</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {EAST_AFRICA_HUBS[selectedSplitDriver.countryCode || 'ET']?.countryName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Rate Sliders */}
              <div className="lg:col-span-7 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Platform Take Rate (%):
                    </label>
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {splitCommissionPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={splitCommissionPercent}
                    onChange={(e) => setSplitCommissionPercent(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Statutory Withholding Tax (%):
                    </label>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {splitTaxPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={splitTaxPercent}
                    onChange={(e) => setSplitTaxPercent(parseFloat(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. Output Breakdown Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Net Driver Payout ({simDriverSharePct}%)</span>
                <p className="text-xl font-bold font-mono text-blue-800 dark:text-blue-200 mt-2">
                  ETB {simDriverNetPayout.toFixed(2)}
                </p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Disbursed to driver's wallet</p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Platform Take ({simPlatformSharePct}%)</span>
                <p className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-200 mt-2">
                  ETB {simPlatformCommission.toFixed(2)}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Afronala gross operating margin</p>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Withholding Tax ({simTaxSharePct}%)</span>
                <p className="text-xl font-bold font-mono text-purple-800 dark:text-purple-200 mt-2">
                  ETB {simTaxWithheld.toFixed(2)}
                </p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">Tax authority escrow clearing</p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close Simulator
              </button>
              <button
                type="button"
                onClick={handleCommitSimulatedSettlement}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Commit Audit Batch to Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Settlement Reconciliation Modal Dialog */}
      {isReconciliationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Manual Bank Settlement Reconciliation
                </h3>
              </div>
              <button
                onClick={() => setIsReconciliationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {selectedTxForReconciliation && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Ledger Reference:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {selectedTxForReconciliation.reference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Driver &amp; Trip:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {selectedTxForReconciliation.driverName} (#{selectedTxForReconciliation.tripId})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Hub &amp; Channel:</span>
                    <span className="font-medium text-cyan-600 dark:text-cyan-400">
                      {selectedTxForReconciliation.countryCode || 'ET'} · {selectedTxForReconciliation.gateway.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Gross Fare:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ETB {selectedTxForReconciliation.grossFareETB.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  External Bank Clearance / RTGS Reference ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. CBE-CORE-894102 or BCIMR-DJ-90214 or SAF-MPESA-88491"
                  value={reconcileExternalRef}
                  onChange={(e) => {
                    setReconcileExternalRef(e.target.value);
                    if (reconcileError) setReconcileError(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Central bank clearance reference, RTGS number, or interbank statement clearance code.
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
                  <option value="Banque pour le Commerce et l’Industrie Mer Rouge (BCIMR)">Banque pour le Commerce et l’Industrie Mer Rouge (Djibouti)</option>
                  <option value="Central Bank of Kenya RTGS / Safaricom">Central Bank of Kenya RTGS / Safaricom</option>
                  <option value="Bank of Uganda Interbank Rail">Bank of Uganda Interbank Rail</option>
                  <option value="National Bank of Rwanda / BNR Switch">National Bank of Rwanda (BNR)</option>
                  <option value="Bank of Tanzania Interbank Clearing">Bank of Tanzania Interbank Clearing</option>
                  <option value="Central Bank of Somalia RTGS">Central Bank of Somalia RTGS</option>
                  <option value="Bank of South Sudan Clearing">Bank of South Sudan Clearing</option>
                  <option value="Chapa Merchant Clearing">Chapa Merchant Gateway</option>
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
                  placeholder="e.g. Verified against cross-border dry port customs clearing statement."
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
