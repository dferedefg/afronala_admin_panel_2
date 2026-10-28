import React, { useState, useMemo } from 'react';
import {
  Download,
  DollarSign,
  ShieldCheck,
  CreditCard,
  Search,
  FileSpreadsheet,
  Globe2,
  TrendingUp,
  Landmark,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
  Eye,
  X,
  Building,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import { PaymentGateway, Shipment, Trip, EastAfricaCountryCode } from '../types';
import { EAST_AFRICA_HUBS, paymentSettlementService } from '../services/payments';
import { downloadCsv } from '../services/rbac';

interface ReportsViewProps {
  darkMode: boolean;
  trips: Trip[];
  shipments: Shipment[];
  userRole: string;
  onNotify: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

// Statutory tax authority metadata per East African nation
export interface CountryTaxComplianceInfo {
  countryCode: EastAfricaCountryCode;
  countryName: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  centralBank: string;
  revenueAuthority: string;
  taxLabel: string;
  statutoryTaxRate: number; // e.g. 0.02 = 2%
  eTaxPortal: string;
  complianceDirective: string;
  exchangeRateToETB: number;
  usdExchangeRate: number; // 1 USD in local currency
}

export const EAST_AFRICA_TAX_COMPLIANCE: Record<string, CountryTaxComplianceInfo> = {
  ET: {
    countryCode: 'ET',
    countryName: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    centralBank: 'National Bank of Ethiopia (NBE)',
    revenueAuthority: 'Ministry of Revenues (MoR)',
    taxLabel: 'MoR Turnover Tax (TOT)',
    statutoryTaxRate: 0.02,
    eTaxPortal: 'MoR e-Tax & NBE RTGS Gateway',
    complianceDirective: 'NBE Directive ONPS/02/2020 & Proc. 979/2016',
    exchangeRateToETB: 1.0,
    usdExchangeRate: 125.0,
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    centralBank: 'Central Bank of Kenya (CBK)',
    revenueAuthority: 'Kenya Revenue Authority (KRA)',
    taxLabel: 'KRA Transport Withholding (WHT)',
    statutoryTaxRate: 0.05,
    eTaxPortal: 'KRA eTIMS & CBK Real-Time Settlement',
    complianceDirective: 'CBK NPS Act & KRA Finance Act 2023',
    exchangeRateToETB: 0.95,
    usdExchangeRate: 131.5,
  },
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    centralBank: 'Bank of Uganda (BoU)',
    revenueAuthority: 'Uganda Revenue Authority (URA)',
    taxLabel: 'URA Logistics Withholding Tax',
    statutoryTaxRate: 0.06,
    eTaxPortal: 'URA EFRIS & BoU NPS Clearing',
    complianceDirective: 'BoU National Payment Systems Act 2020',
    exchangeRateToETB: 0.033,
    usdExchangeRate: 3750.0,
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'FRw',
    centralBank: 'National Bank of Rwanda (BNR)',
    revenueAuthority: 'Rwanda Revenue Authority (RRA)',
    taxLabel: 'RRA Commercial Transport WHT',
    statutoryTaxRate: 0.03,
    eTaxPortal: 'RRA EBM v2 & BNR RIPPS Rail',
    complianceDirective: 'BNR Regulation No. 04/2021 on Payment Services',
    exchangeRateToETB: 0.092,
    usdExchangeRate: 1360.0,
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    centralBank: 'Bank of Tanzania (BoT)',
    revenueAuthority: 'Tanzania Revenue Authority (TRA)',
    taxLabel: 'TRA Freight Transit WHT',
    statutoryTaxRate: 0.05,
    eTaxPortal: 'TRA VFD & TIPS National Switch',
    complianceDirective: 'BoT National Payment System Act 2015',
    exchangeRateToETB: 0.046,
    usdExchangeRate: 2680.0,
  },
  DJ: {
    countryCode: 'DJ',
    countryName: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    centralBank: 'Banque Centrale de Djibouti (BCD)',
    revenueAuthority: 'Direction Générale des Impôts (DGI)',
    taxLabel: 'DGI Transit Forwarding Fee',
    statutoryTaxRate: 0.04,
    eTaxPortal: 'DGI Guichet Unique & BCD Clearing',
    complianceDirective: 'BCD Règlement No. 2021-03 Portuaire & Fiscal',
    exchangeRateToETB: 0.70,
    usdExchangeRate: 177.72,
  },
  SO: {
    countryCode: 'SO',
    countryName: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD',
    currencySymbol: '$',
    centralBank: 'Central Bank of Somalia (CBS)',
    revenueAuthority: 'Ministry of Finance Inland Revenue',
    taxLabel: 'CBS Port & Interstate Trade Levy',
    statutoryTaxRate: 0.02,
    eTaxPortal: 'CBS National Payment System (NPS)',
    complianceDirective: 'CBS Act 2020 & Financial Institutions Law',
    exchangeRateToETB: 125.0,
    usdExchangeRate: 1.0,
  },
  SS: {
    countryCode: 'SS',
    countryName: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP',
    currencySymbol: 'SSP',
    centralBank: 'Bank of South Sudan (BSS)',
    revenueAuthority: 'National Revenue Authority (NRA)',
    taxLabel: 'NRA Cross-Border Transit Levy',
    statutoryTaxRate: 0.05,
    eTaxPortal: 'NRA Single Customs Territory Portal',
    complianceDirective: 'BSS Circular No. 03/2022 Electronic Clearing',
    exchangeRateToETB: 0.04,
    usdExchangeRate: 3100.0,
  },
};

export interface UnifiedLedgerRow {
  id: string;
  reference: string;
  date: string;
  countryCode: EastAfricaCountryCode;
  countryName: string;
  flag: string;
  corridor: string;
  category: 'Mobility Ride' | 'Freight Waybill' | 'Cross-Border Escrow';
  sourceKey: 'ride' | 'freight' | 'escrow';
  counterparty: string;
  driverName: string;
  customerName: string;
  gateway: PaymentGateway;
  gatewayLabel: string;
  localCurrency: string;
  localCurrencySymbol: string;
  localGross: number;
  exchangeRateToETB: number;
  grossETB: number;
  commissionETB: number;
  taxETB: number;
  taxRate: number;
  taxAuthority: string;
  netPayoutETB: number;
  status: 'Bank Verified' | 'Settled' | 'Escrow Locked' | 'Customs Cleared';
  channelDetails: string;
  settlementBatchId: string;
  externalRefId?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  reconciliationBank?: string;
  reconciliationNotes?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  trips,
  shipments,
  userRole,
  onNotify,
}) => {
  // Filters
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>('ALL');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');
  const [verticalFilter, setVerticalFilter] = useState<'all' | 'ride' | 'freight' | 'escrow'>('all');
  const [gatewayFilter, setGatewayFilter] = useState<'all' | PaymentGateway>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyDisplayMode, setCurrencyDisplayMode] = useState<'etb' | 'local' | 'usd'>('etb');
  const [inspectRow, setInspectRow] = useState<UnifiedLedgerRow | null>(null);
  const [showRegionalBreakdown, setShowRegionalBreakdown] = useState(true);

  // Get live payment transactions from service
  const allServiceTransactions = paymentSettlementService.getTransactions();

  // Helper to infer corridor and country
  const mapTxToCorridorAndCountry = (
    tx: (typeof allServiceTransactions)[0]
  ): { corridor: string; countryCode: EastAfricaCountryCode; category: UnifiedLedgerRow['category'] } => {
    const ref = (tx.reference || '').toUpperCase();
    const trip = (tx.tripId || '').toUpperCase();
    const country = tx.countryCode || 'ET';

    if (trip.includes('MODJO') || trip.includes('DORALEH') || trip.includes('DLV7721')) {
      return { corridor: 'Modjo Dry Port ⇄ Port of Djibouti', countryCode: 'DJ', category: 'Cross-Border Escrow' };
    }
    if (trip.includes('MOYALE') || trip.includes('NBO')) {
      return { corridor: 'Nairobi ⇄ Marsabit ⇄ Moyale OSBP', countryCode: 'KE', category: 'Freight Waybill' };
    }
    if (trip.includes('MALABA') || trip.includes('KLA')) {
      return { corridor: 'Mombasa Port ⇄ Malaba ⇄ Kampala', countryCode: 'UG', category: 'Freight Waybill' };
    }
    if (trip.includes('RUSUMO') || trip.includes('DAR')) {
      return { corridor: 'Dar es Salaam ⇄ Rusumo ⇄ Kigali', countryCode: 'TZ', category: 'Freight Waybill' };
    }
    if (trip.includes('BERBERA') || trip.includes('MGQ')) {
      return { corridor: 'Berbera Port ⇄ Tog Wajaale ⇄ Jijiga', countryCode: 'SO', category: 'Freight Waybill' };
    }
    if (trip.includes('NIMULE') || trip.includes('JUB')) {
      return { corridor: 'Nimule Border ⇄ Juba Transit', countryCode: 'SS', category: 'Freight Waybill' };
    }
    if (trip.includes('KGL')) {
      return { corridor: 'Kigali Metropolitan & Free Trade Zone', countryCode: 'RW', category: 'Mobility Ride' };
    }

    return { corridor: 'Addis Ababa Metropolitan & Domestic Hub', countryCode: country, category: 'Mobility Ride' };
  };

  // Build unified auditable ledger
  const allLedgerRows: UnifiedLedgerRow[] = useMemo(() => {
    // 1. Transactions from paymentSettlementService (contains rich regional rows)
    const serviceRows: UnifiedLedgerRow[] = allServiceTransactions.map((tx) => {
      const { corridor, countryCode, category } = mapTxToCorridorAndCountry(tx);
      const taxInfo = EAST_AFRICA_TAX_COMPLIANCE[countryCode] || EAST_AFRICA_TAX_COMPLIANCE.ET;
      const hub = EAST_AFRICA_HUBS[countryCode] || EAST_AFRICA_HUBS.ET;

      const gross = Number(tx.grossFareETB || 0);
      const comm = Number(tx.platformCommissionETB || Math.round(gross * 0.15 * 100) / 100);
      const tax = Number(tx.withholdingTaxETB || Math.round(gross * taxInfo.statutoryTaxRate * 100) / 100);
      const net = Number(tx.netDriverETB || Math.round((gross - comm - tax) * 100) / 100);
      const localGross = tx.localAmount || Math.round((gross / taxInfo.exchangeRateToETB) * 100) / 100;

      let status: UnifiedLedgerRow['status'] = 'Settled';
      if (tx.status === 'bank_verified') status = 'Bank Verified';
      if (category === 'Cross-Border Escrow') status = tx.status === 'bank_verified' ? 'Customs Cleared' : 'Escrow Locked';

      return {
        id: tx.reference,
        reference: tx.tripId,
        date: tx.timestamp || 'Recent',
        countryCode,
        countryName: taxInfo.countryName,
        flag: taxInfo.flag,
        corridor,
        category,
        sourceKey: category === 'Cross-Border Escrow' ? 'escrow' : 'ride',
        counterparty: `${tx.driverName} / ${tx.passengerName}`,
        driverName: tx.driverName,
        customerName: tx.passengerName,
        gateway: tx.gateway,
        gatewayLabel: tx.gateway.replace('_', ' ').toUpperCase(),
        localCurrency: taxInfo.currency,
        localCurrencySymbol: taxInfo.currencySymbol,
        localGross,
        exchangeRateToETB: taxInfo.exchangeRateToETB,
        grossETB: gross,
        commissionETB: comm,
        taxETB: tax,
        taxRate: taxInfo.statutoryTaxRate,
        taxAuthority: taxInfo.taxLabel,
        netPayoutETB: net,
        status,
        channelDetails: tx.channelDetails || `${hub.countryName} Settlement Hub`,
        settlementBatchId: tx.settlementBatchId || `BATCH-${countryCode}-041`,
        externalRefId: tx.externalRefId,
        reconciledAt: tx.reconciledAt,
        reconciledBy: tx.reconciledBy,
        reconciliationBank: tx.reconciliationBank,
        reconciliationNotes: tx.reconciliationNotes,
      };
    });

    // 2. Extra freight shipments from Back4App / App props
    const freightRows: UnifiedLedgerRow[] = shipments.map((sh, idx) => {
      const gross = Number(sh.freightRateETB || 25000);
      // Determine corridor and country from destination
      let countryCode: EastAfricaCountryCode = 'ET';
      let corridor = 'Modjo Dry Port ⇄ Port of Djibouti';
      const destLower = (sh.destination || '').toLowerCase();
      const originLower = (sh.origin || '').toLowerCase();

      if (destLower.includes('djibouti') || originLower.includes('djibouti')) {
        countryCode = 'DJ';
        corridor = 'Modjo Dry Port ⇄ Port of Djibouti';
      } else if (destLower.includes('kenya') || destLower.includes('nairobi') || destLower.includes('moyale')) {
        countryCode = 'KE';
        corridor = 'Nairobi ⇄ Marsabit ⇄ Moyale OSBP';
      } else if (destLower.includes('uganda') || destLower.includes('kampala')) {
        countryCode = 'UG';
        corridor = 'Mombasa Port ⇄ Malaba ⇄ Kampala';
      } else if (destLower.includes('kigali') || destLower.includes('rwanda')) {
        countryCode = 'RW';
        corridor = 'Dar es Salaam ⇄ Rusumo ⇄ Kigali';
      } else if (destLower.includes('tanzania') || destLower.includes('dar')) {
        countryCode = 'TZ';
        corridor = 'Dar es Salaam ⇄ Rusumo ⇄ Kigali';
      } else if (destLower.includes('berbera') || destLower.includes('somalia')) {
        countryCode = 'SO';
        corridor = 'Berbera Port ⇄ Tog Wajaale ⇄ Jijiga';
      } else if (destLower.includes('juba') || destLower.includes('south sudan')) {
        countryCode = 'SS';
        corridor = 'Nimule Border ⇄ Juba Transit';
      } else {
        countryCode = 'ET';
        corridor = 'Addis Ababa ⇄ Hawassa Industrial Corridor';
      }

      const taxInfo = EAST_AFRICA_TAX_COMPLIANCE[countryCode] || EAST_AFRICA_TAX_COMPLIANCE.ET;
      const comm = Math.round(gross * 0.15 * 100) / 100;
      const tax = Math.round(gross * taxInfo.statutoryTaxRate * 100) / 100;
      const net = Math.round((gross - comm - tax) * 100) / 100;
      const localGross = Math.round((gross / taxInfo.exchangeRateToETB) * 100) / 100;

      const gateway: PaymentGateway =
        countryCode === 'DJ'
          ? 'dmoney_dj'
          : countryCode === 'KE'
          ? 'mpesa_ke'
          : countryCode === 'UG'
          ? 'mtn_ug'
          : countryCode === 'TZ'
          ? 'mpesa_tz'
          : countryCode === 'RW'
          ? 'mtn_rw'
          : countryCode === 'SO'
          ? 'evc_plus_so'
          : countryCode === 'SS'
          ? 'mgurush_ss'
          : 'cbe_birr';

      const isDelivered = sh.status === 'Delivered';
      const status: UnifiedLedgerRow['status'] = isDelivered ? 'Bank Verified' : 'Escrow Locked';

      return {
        id: `FRT-${sh.shipmentId.replace('#', '') || idx + 500}`,
        reference: sh.shipmentId,
        date: sh.time || 'Today',
        countryCode,
        countryName: taxInfo.countryName,
        flag: taxInfo.flag,
        corridor,
        category: 'Freight Waybill',
        sourceKey: 'freight',
        counterparty: `${sh.driver} (${sh.truckPlate})`,
        driverName: sh.driver,
        customerName: `${sh.cargoType} [${sh.tonnage}T]`,
        gateway,
        gatewayLabel: gateway.replace('_', ' ').toUpperCase(),
        localCurrency: taxInfo.currency,
        localCurrencySymbol: taxInfo.currencySymbol,
        localGross,
        exchangeRateToETB: taxInfo.exchangeRateToETB,
        grossETB: gross,
        commissionETB: comm,
        taxETB: tax,
        taxRate: taxInfo.statutoryTaxRate,
        taxAuthority: taxInfo.taxLabel,
        netPayoutETB: net,
        status,
        channelDetails: `${corridor} · ${taxInfo.currency} Waybill Clearing`,
        settlementBatchId: `BATCH-FRT-${countryCode}-02`,
        externalRefId: `WAYBILL-${countryCode}-${sh.shipmentId.replace('#', '')}`,
        reconciledAt: isDelivered ? 'Verified at destination terminal' : undefined,
        reconciledBy: 'Regional Customs & Freight Auditor',
        reconciliationBank: countryCode === 'ET' ? 'Commercial Bank of Ethiopia' : 'Regional Settlement Partner',
        reconciliationNotes: `Customs transit manifest with ${sh.tonnage}T ${sh.cargoType}. Single window clearance recorded.`,
      };
    });

    // 3. Extra trips not in service rows
    const extraTripRows: UnifiedLedgerRow[] = trips
      .filter((t) => !serviceRows.some((sr) => sr.reference.includes(t.tripId)))
      .map((t, idx) => {
        const gross = Number(t.fareETB || 350);
        const comm = Math.round(gross * 0.15 * 100) / 100;
        const tax = Math.round(gross * 0.02 * 100) / 100;
        const net = Math.round((gross - comm - tax) * 100) / 100;
        const taxInfo = EAST_AFRICA_TAX_COMPLIANCE.ET;

        return {
          id: `RID-${t.tripId.replace('#', '') || idx + 100}`,
          reference: t.tripId,
          date: t.time || 'Today',
          countryCode: 'ET',
          countryName: taxInfo.countryName,
          flag: taxInfo.flag,
          corridor: 'Addis Ababa Metropolitan & Domestic Hub',
          category: 'Mobility Ride',
          sourceKey: 'ride',
          counterparty: `${t.driver} / ${t.passenger}`,
          driverName: t.driver,
          customerName: t.passenger,
          gateway: 'telebirr',
          gatewayLabel: 'TELEBIRR',
          localCurrency: 'ETB',
          localCurrencySymbol: 'Br',
          localGross: gross,
          exchangeRateToETB: 1.0,
          grossETB: gross,
          commissionETB: comm,
          taxETB: tax,
          taxRate: 0.02,
          taxAuthority: taxInfo.taxLabel,
          netPayoutETB: net,
          status: 'Settled',
          channelDetails: 'Telebirr Instant P2M Ride Fare',
          settlementBatchId: 'BATCH-ET-RIDE-09',
        };
      });

    return [...serviceRows, ...freightRows, ...extraTripRows];
  }, [allServiceTransactions, shipments, trips]);

  // Filtered rows
  const displayedRows = useMemo(() => {
    return allLedgerRows.filter((row) => {
      if (selectedCountry !== 'ALL' && row.countryCode !== selectedCountry) return false;
      if (selectedCorridor !== 'all' && row.corridor !== selectedCorridor) return false;
      if (verticalFilter !== 'all' && row.sourceKey !== verticalFilter) return false;
      if (gatewayFilter !== 'all' && row.gateway !== gatewayFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          row.id.toLowerCase().includes(q) ||
          row.reference.toLowerCase().includes(q) ||
          row.counterparty.toLowerCase().includes(q) ||
          row.driverName.toLowerCase().includes(q) ||
          row.customerName.toLowerCase().includes(q) ||
          row.corridor.toLowerCase().includes(q) ||
          row.countryName.toLowerCase().includes(q) ||
          row.countryCode.toLowerCase().includes(q) ||
          row.gateway.replace('_', ' ').toLowerCase().includes(q) ||
          row.status.toLowerCase().includes(q) ||
          (row.externalRefId && row.externalRefId.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [allLedgerRows, selectedCountry, selectedCorridor, verticalFilter, gatewayFilter, searchQuery]);

  // KPI calculations
  const totalGrossETB = useMemo(() => displayedRows.reduce((s, r) => s + r.grossETB, 0), [displayedRows]);
  const totalCommissionETB = useMemo(() => displayedRows.reduce((s, r) => s + r.commissionETB, 0), [displayedRows]);
  const totalTaxETB = useMemo(() => displayedRows.reduce((s, r) => s + r.taxETB, 0), [displayedRows]);
  const totalNetDisbursedETB = useMemo(() => displayedRows.reduce((s, r) => s + r.netPayoutETB, 0), [displayedRows]);

  // Escrow locked
  const totalEscrowLockedETB = useMemo(
    () =>
      displayedRows
        .filter((r) => r.status === 'Escrow Locked' || r.sourceKey === 'escrow')
        .reduce((s, r) => s + r.grossETB, 0),
    [displayedRows]
  );

  // Regional breakdown metrics for the 8 countries
  const regionalMetrics = useMemo(() => {
    const list = Object.keys(EAST_AFRICA_TAX_COMPLIANCE) as EastAfricaCountryCode[];
    const overallGross = allLedgerRows.reduce((s, r) => s + r.grossETB, 0) || 1;

    return list.map((code) => {
      const info = EAST_AFRICA_TAX_COMPLIANCE[code];
      const rowsForCountry = allLedgerRows.filter((r) => r.countryCode === code);
      const grossETB = rowsForCountry.reduce((s, r) => s + r.grossETB, 0);
      const commissionETB = rowsForCountry.reduce((s, r) => s + r.commissionETB, 0);
      const taxETB = rowsForCountry.reduce((s, r) => s + r.taxETB, 0);
      const localGross = rowsForCountry.reduce((s, r) => s + r.localGross, 0);
      const share = Math.round((grossETB / overallGross) * 100);

      return {
        ...info,
        txCount: rowsForCountry.length,
        grossETB,
        commissionETB,
        taxETB,
        localGross,
        share,
      };
    });
  }, [allLedgerRows]);

  // Unique trade corridors
  const uniqueCorridors = useMemo(() => {
    const set = new Set<string>();
    allLedgerRows.forEach((r) => {
      if (r.corridor) set.add(r.corridor);
    });
    return Array.from(set);
  }, [allLedgerRows]);

  // Currency Formatter Helper
  const formatAmount = (amountETB: number, targetCountryCode: EastAfricaCountryCode = selectedCountry) => {
    if (currencyDisplayMode === 'usd') {
      const usdVal = amountETB / 125.0; // Standard 1 USD ~ 125 ETB
      return `$ ${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (currencyDisplayMode === 'local' && targetCountryCode !== 'ALL') {
      const info = EAST_AFRICA_TAX_COMPLIANCE[targetCountryCode] || EAST_AFRICA_TAX_COMPLIANCE.ET;
      const localVal = amountETB / info.exchangeRateToETB;
      return `${info.currencySymbol} ${localVal.toLocaleString('en-US', {
        minimumFractionDigits: targetCountryCode === 'UG' || targetCountryCode === 'TZ' ? 0 : 2,
        maximumFractionDigits: 2,
      })}`;
    }

    // Default ETB
    return `Br ${amountETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // CSV Export Handler
  const handleDownloadCsv = () => {
    const filename = `afronala_east_africa_financial_ledger_${selectedCountry}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    const headers = [
      'Entry ID',
      'Dispatch Ref',
      'Country Hub',
      'Country Code',
      'Trade Corridor',
      'Vertical Category',
      'Timestamp',
      'Counterparties',
      'Driver / Carrier',
      'Customer / Shipper',
      'Payment Rail',
      'Local Currency',
      'Local Gross Amount',
      'FX Rate to ETB',
      'Gross Amount (ETB)',
      'Platform Commission 15% (ETB)',
      'Statutory Tax Authority',
      'Tax Rate',
      'Statutory Tax Withheld (ETB)',
      'Net Carrier Payout 83% (ETB)',
      'Audit & Clearing Status',
      'Channel Details',
      'Central Bank Batch ID',
      'External Ref ID',
      'Reconciled By',
      'Reconciliation Bank',
    ];

    const rows = displayedRows.map((r) => [
      r.id,
      r.reference,
      r.countryName,
      r.countryCode,
      r.corridor,
      r.category,
      r.date,
      r.counterparty,
      r.driverName,
      r.customerName,
      r.gatewayLabel,
      r.localCurrency,
      r.localGross.toFixed(2),
      r.exchangeRateToETB.toFixed(4),
      r.grossETB.toFixed(2),
      r.commissionETB.toFixed(2),
      r.taxAuthority,
      `${(r.taxRate * 100).toFixed(0)}%`,
      r.taxETB.toFixed(2),
      r.netPayoutETB.toFixed(2),
      r.status,
      r.channelDetails,
      r.settlementBatchId,
      r.externalRefId || 'N/A',
      r.reconciledBy || 'Automated Clearing',
      r.reconciliationBank || 'Regional Central Bank Switch',
    ]);

    downloadCsv(filename, headers, rows);

    onNotify(
      'Multi-Currency Financial Report Exported',
      `Exported ${displayedRows.length} ledger records for ${
        selectedCountry === 'ALL' ? 'all 8 East African countries' : selectedCountry
      } (GTV: ETB ${totalGrossETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`,
      'success'
    );
  };

  const cardClass =
    'p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

  const activeCountryInfo =
    selectedCountry !== 'ALL' ? EAST_AFRICA_TAX_COMPLIANCE[selectedCountry] : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400">
              <Globe2 className="w-3.5 h-3.5" />
              East Africa Regional Treasury Hub
            </span>
            <span aria-hidden="true">·</span>
            <span>Auditor: {userRole}</span>
            <span aria-hidden="true">·</span>
            <span>8 Sovereign Jurisdictions (ET, KE, UG, RW, TZ, DJ, SO, SS)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Financial Ledger &amp; Multi-Currency Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-border freight settlement, ride mobility GTV, platform take-rate commission &amp; statutory tax reserves
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Display Mode Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setCurrencyDisplayMode('etb')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                currencyDisplayMode === 'etb'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Consolidated Base: Ethiopian Birr (ETB)"
            >
              ETB (Base)
            </button>
            <button
              type="button"
              onClick={() => setCurrencyDisplayMode('local')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                currencyDisplayMode === 'local'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Local National Currency (KES, UGX, RWF, TZS, DJF, USD, SSP)"
            >
              Local FX
            </button>
            <button
              type="button"
              onClick={() => setCurrencyDisplayMode('usd')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                currencyDisplayMode === 'usd'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="USD Global Trade Clearing Equivalent"
            >
              USD
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowRegionalBreakdown(!showRegionalBreakdown)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showRegionalBreakdown ? 'Hide Hub Matrix' : 'Show 8-Nation Matrix'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            title={`Download multi-currency CSV of ${displayedRows.length} displayed records`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Multi-Currency CSV</span>
          </button>
        </div>
      </div>

      {/* East Africa Regional Country Selector Bar */}
      <div className="bg-slate-100/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Select East Africa Regional Settlement Jurisdiction:
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {selectedCountry === 'ALL'
              ? 'Consolidated Headquarter Treasury View (All 8 Nations)'
              : `${activeCountryInfo?.countryName} Sovereign Treasury & Tax Jurisdiction`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCountry('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              selectedCountry === 'ALL'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>All 8 East African Nations</span>
          </button>

          {(Object.keys(EAST_AFRICA_TAX_COMPLIANCE) as EastAfricaCountryCode[]).map((code) => {
            const c = EAST_AFRICA_TAX_COMPLIANCE[code];
            const isSelected = selectedCountry === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedCountry(code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.countryName}</span>
                <span className="text-[10px] opacity-80 font-mono">({c.currency})</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Banner when country is selected */}
        {activeCountryInfo && (
          <div className="mt-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-base">{activeCountryInfo.flag}</span>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeCountryInfo.countryName} ({activeCountryInfo.currency})
                </span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Regulator: <span className="font-medium text-slate-800 dark:text-slate-200">{activeCountryInfo.centralBank}</span>
                </span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Tax Authority: <span className="font-medium text-slate-800 dark:text-slate-200">{activeCountryInfo.revenueAuthority}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                {activeCountryInfo.taxLabel} ({(activeCountryInfo.statutoryTaxRate * 100).toFixed(0)}%)
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50">
                1 {activeCountryInfo.currency} = {activeCountryInfo.exchangeRateToETB} ETB
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {activeCountryInfo.complianceDirective}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Live Aggregated Multi-Currency KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Gross Volume */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Audited Gross Volume (GTV)
            </span>
            <DollarSign className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white truncate">
            {formatAmount(totalGrossETB)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>{displayedRows.length} transactions</span>
            <span className="font-mono">
              ~${((totalGrossETB) / 125.0).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
            </span>
          </div>
        </div>

        {/* KPI 2: Platform Commission */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Platform Take-Rate (15%)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-2 text-emerald-700 dark:text-emerald-400 truncate">
            {formatAmount(totalCommissionETB)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Afronala operating net revenue
          </p>
        </div>

        {/* KPI 3: Statutory Tax Reserve */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {activeCountryInfo ? activeCountryInfo.taxLabel : 'Statutory Tax Withheld'}
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-2 text-purple-700 dark:text-purple-400 truncate">
            {formatAmount(totalTaxETB)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {activeCountryInfo
              ? `${activeCountryInfo.revenueAuthority} statutory reserve`
              : 'Consolidated East Africa tax reserve'}
          </p>
        </div>

        {/* KPI 4: Carrier & Driver Payouts */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Carrier &amp; Driver Disbursed
            </span>
            <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-2 text-blue-700 dark:text-blue-400 truncate">
            {formatAmount(totalNetDisbursedETB)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Cleared via regional mobile wallets &amp; RTGS
          </p>
        </div>

        {/* KPI 5: Active Escrow & Transit Bond */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Active Transit Escrow
            </span>
            <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-2 text-amber-700 dark:text-amber-400 truncate">
            {formatAmount(totalEscrowLockedETB)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Collateral in bilateral corridor escrow
          </p>
        </div>
      </div>

      {/* Regional 8-Nation Market Share & Corridor Matrix (Collapsible) */}
      {showRegionalBreakdown && (
        <div className={`${cardClass} space-y-3`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                East Africa 8-Nation Sovereign Clearing &amp; Tax Compliance Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct statutory withholding tax, exchange rates, central bank regulations &amp; gross volume share
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Base: NBE Interbank Exchange Rate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pt-1">
            {regionalMetrics.map((rm) => {
              const isSelected = selectedCountry === rm.countryCode;
              return (
                <div
                  key={rm.countryCode}
                  onClick={() => setSelectedCountry(isSelected ? 'ALL' : rm.countryCode)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{rm.flag}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {rm.countryName}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {rm.currency} · 1 {rm.currency} = {rm.exchangeRateToETB} ETB
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {rm.share}%
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Volume (ETB):</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        Br {rm.grossETB.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Local Currency:</span>
                      <span className="font-mono text-cyan-700 dark:text-cyan-400 font-medium">
                        {rm.currencySymbol} {rm.localGross.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Tax Authority:</span>
                      <span className="truncate max-w-[130px] font-medium" title={rm.taxLabel}>
                        {rm.taxLabel}
                      </span>
                    </div>
                  </div>

                  {/* Volume share progress bar */}
                  <div className="mt-2.5 w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(rm.share, 4)}%` }}
                    />
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Compliant
                    </span>
                    <span>{rm.txCount} txns</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filterable Audit Table */}
      <div className={`${cardClass} space-y-4`}>
        {/* Table Filters Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Consolidated Reconciliation &amp; Audit Trail
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Showing {displayedRows.length} of {allLedgerRows.length} entries · Full multi-currency export supported
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ref, driver, corridor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-cyan-600"
              />
            </div>

            {/* Corridor Filter Dropdown */}
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-600"
            >
              <option value="all">All Trade Corridors ({uniqueCorridors.length})</option>
              {uniqueCorridors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Vertical Segment Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(
                [
                  { id: 'all', label: 'All Verticals' },
                  { id: 'ride', label: 'Ride' },
                  { id: 'freight', label: 'Freight' },
                  { id: 'escrow', label: 'Escrow' },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVerticalFilter(v.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    verticalFilter === v.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Payment Rail Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto max-w-xs">
              {(
                [
                  'all',
                  'telebirr',
                  'cbe_birr',
                  'mpesa_ke',
                  'mtn_ug',
                  'mtn_rw',
                  'mpesa_tz',
                  'dmoney_dj',
                  'evc_plus_so',
                  'mgurush_ss',
                ] as const
              ).map((gw) => (
                <button
                  key={gw}
                  type="button"
                  onClick={() => setGatewayFilter(gw)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors capitalize whitespace-nowrap shrink-0 ${
                    gatewayFilter === gw
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {gw === 'all' ? 'All Rails' : gw.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 pl-3 pr-4">Entry &amp; Dispatch Ref</th>
                <th className="py-2.5 px-3">Country &amp; Corridor</th>
                <th className="py-2.5 px-3">Vertical &amp; Counterparties</th>
                <th className="py-2.5 px-3">Payment Rail</th>
                <th className="py-2.5 px-3 text-right">Local Amount</th>
                <th className="py-2.5 px-3 text-right">Gross (ETB)</th>
                <th className="py-2.5 px-3 text-right">Comm (15%)</th>
                <th className="py-2.5 px-3 text-right">Statutory Tax</th>
                <th className="py-2.5 px-3 text-right">Net Payout</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 pl-3 pr-3 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {displayedRows.length > 0 ? (
                displayedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Entry ID & Reference */}
                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base" title={row.countryName}>
                          {row.flag}
                        </span>
                        <div>
                          <p className="font-mono font-bold text-slate-900 dark:text-white">
                            {row.id}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {row.reference} · {row.date}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Corridor */}
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]" title={row.corridor}>
                        {row.corridor}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-0.5">
                        {row.countryCode} Hub
                      </span>
                    </td>

                    {/* Vertical & Counterparties */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.sourceKey === 'escrow'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : row.sourceKey === 'freight'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {row.category}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[170px] mt-0.5" title={row.counterparty}>
                        {row.counterparty}
                      </p>
                    </td>

                    {/* Payment Rail */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {row.gatewayLabel}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]" title={row.channelDetails}>
                        {row.channelDetails}
                      </p>
                    </td>

                    {/* Local Amount */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-cyan-700 dark:text-cyan-400">
                      {row.localCurrencySymbol} {row.localGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        {row.localCurrency}
                      </span>
                    </td>

                    {/* Gross ETB */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      Br {row.grossETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Commission 15% */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                      Br {row.commissionETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Statutory Tax */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-purple-700 dark:text-purple-400">
                      Br {row.taxETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="block text-[9px] text-purple-600/70 dark:text-purple-400/70 font-sans">
                        {(row.taxRate * 100).toFixed(0)}% WHT
                      </span>
                    </td>

                    {/* Net Payout */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400">
                      Br {row.netPayoutETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'Bank Verified' || row.status === 'Customs Cleared'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : row.status === 'Escrow Locked'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* Inspect Audit Button */}
                    <td className="py-3 pl-3 pr-3 text-center">
                      <button
                        type="button"
                        onClick={() => setInspectRow(row)}
                        title="Inspect Cryptographic Compliance & Banking Audit Trail"
                        className="p-1 rounded-md text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-600 dark:text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      No matching financial ledger transactions
                    </p>
                    <p className="text-xs mt-0.5">
                      Clear your active country, trade corridor, or payment rail filter to expand results.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCountry('ALL');
                        setSelectedCorridor('all');
                        setVerticalFilter('all');
                        setGatewayFilter('all');
                        setSearchQuery('');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Tax & Central Bank Directives Compliance Matrix */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              East Africa Regional Financial Directives &amp; Tax Authority Compliance Registry
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Real-Time Interbank Clearing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>🇪🇹</span> Ethiopia (NBE &amp; MoR)
            </span>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              2% Turnover Tax (TOT) withheld on mobility fares &amp; freight waybills. Settled via NBE RTGS &amp; Telebirr merchant rails.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>🇰🇪</span> Kenya (CBK &amp; KRA)
            </span>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              5% Transport Withholding Tax reconciled under KRA eTIMS invoice generation. Cleared via Safaricom M-PESA B2C Paybill.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>🇺🇬</span> Uganda (BoU &amp; URA)
            </span>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              6% Logistics Withholding Tax compliant with URA EFRIS fiscal standards. Cleared via MTN MoMo Open API.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>🇩🇯</span> Djibouti (BCD &amp; DGI)
            </span>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              4% Bilateral Port Transit Clearing levy under Modjo-Djibouti trade treaty. Cleared via D-Money &amp; BCIMR Net.
            </p>
          </div>
        </div>
      </div>

      {/* Row Audit Inspector Modal */}
      {inspectRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{inspectRow.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                      {inspectRow.countryCode} Hub
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {inspectRow.reference}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    Reconciliation Audit: {inspectRow.id}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectRow(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Ledger Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Local Currency</span>
                <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm mt-0.5">
                  {inspectRow.localCurrencySymbol} {inspectRow.localGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">{inspectRow.localCurrency}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Gross (ETB)</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  Br {inspectRow.grossETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">Consolidated</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Platform Comm (15%)</span>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                  Br {inspectRow.commissionETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">Operating Net</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Net Carrier Payout</span>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                  Br {inspectRow.netPayoutETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">Cleared (83%)</span>
              </div>
            </div>

            {/* Audit Details */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Trade Corridor &amp; Logistics Hub
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">
                    {inspectRow.corridor}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Jurisdiction: {inspectRow.countryName} ({inspectRow.countryCode})
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Counterparties &amp; Waybill Assignment
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">
                    {inspectRow.counterparty}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Category: {inspectRow.category}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Statutory Tax &amp; Central Bank Clearing Compliance
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {inspectRow.taxAuthority}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Withholding Rate:</span>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">
                      {(inspectRow.taxRate * 100).toFixed(0)}% (Br {inspectRow.taxETB.toFixed(2)})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Clearing Batch ID:</span>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">
                      {inspectRow.settlementBatchId}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">External Bank Reference:</span>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">
                      {inspectRow.externalRefId || 'N/A (Pending RTGS File)'}
                    </p>
                  </div>
                </div>

                {inspectRow.reconciliationNotes && (
                  <div className="mt-2 p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Reconciliation Log:</span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">{inspectRow.reconciliationNotes}</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      Reconciled by: {inspectRow.reconciledBy || 'Automated Clearing'} · Bank:{' '}
                      {inspectRow.reconciliationBank || 'Regional Interbank Central Switch'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onNotify(
                    'Audit Certificate Verified',
                    `Transaction ${inspectRow.id} matched against ${inspectRow.countryName} clearing record.`,
                    'success'
                  );
                  setInspectRow(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-xs"
              >
                Confirm Audit Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
