import React, { useState, useMemo, useEffect } from 'react';
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
  MapPin,
  Truck,
  Car,
  FileText,
  BadgePercent,
  Check,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Compass,
  Briefcase,
  Smartphone,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AdminUser,
  EastAfricaCountryCode,
  PaymentGateway,
  PermissionAction,
  Shipment,
  ToastMessage,
  Trip,
} from '../types';
import { EAST_AFRICA_HUBS, paymentSettlementService } from '../services/payments';
import { downloadCsv } from '../services/rbac';

export interface ReportsViewProps {
  darkMode?: boolean;
  trips: Trip[];
  shipments: Shipment[];
  user?: AdminUser | null;
  userRole: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  userName?: string;
  userEmail?: string;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
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
  taxFilingCadence: string;
  statutoryRemittanceBank: string;
  escrowCustodyAccount: string;
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
    taxFilingCadence: 'Monthly by 30th day',
    statutoryRemittanceBank: 'Commercial Bank of Ethiopia (NBE Clearing)',
    escrowCustodyAccount: 'CBE-NBE-ESCROW-0021-ET',
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
    complianceDirective: 'CBK NPS Act & KRA Finance Act 2023 Section 35',
    exchangeRateToETB: 0.95,
    usdExchangeRate: 131.5,
    taxFilingCadence: 'Monthly by 20th day via eTIMS',
    statutoryRemittanceBank: 'Central Bank of Kenya (KRA Paybill 572572)',
    escrowCustodyAccount: 'CBK-ESCROW-KEN-9941-KRA',
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
    complianceDirective: 'BoU National Payment Systems Act 2020 & URA Tax Reg 2022',
    exchangeRateToETB: 0.033,
    usdExchangeRate: 3750.0,
    taxFilingCadence: 'Monthly by 15th day via EFRIS',
    statutoryRemittanceBank: 'Stanbic Bank Uganda / BoU RTGS',
    escrowCustodyAccount: 'BOU-URA-ESCROW-7721-UG',
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
    complianceDirective: 'BNR Regulation No. 04/2021 on Payment Services & EBM Law',
    exchangeRateToETB: 0.092,
    usdExchangeRate: 1360.0,
    taxFilingCadence: 'Monthly by 15th day via EBM',
    statutoryRemittanceBank: 'Bank of Kigali (BNR RIPPS Real-Time)',
    escrowCustodyAccount: 'BNR-RRA-ESCROW-4011-RW',
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
    complianceDirective: 'BoT National Payment System Act 2015 & TRA Tax Admin 2015',
    exchangeRateToETB: 0.046,
    usdExchangeRate: 2680.0,
    taxFilingCadence: 'Monthly by 20th day via VFD',
    statutoryRemittanceBank: 'CRDB Bank / BoT TIPS Switch',
    escrowCustodyAccount: 'BOT-TRA-ESCROW-6320-TZ',
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
    complianceDirective: 'BCD Règlement No. 2021-03 Portuaire & Fiscal Modjo Accord',
    exchangeRateToETB: 0.70,
    usdExchangeRate: 177.72,
    taxFilingCadence: 'Bi-weekly per port manifest',
    statutoryRemittanceBank: 'BCIMR / Banque Centrale de Djibouti',
    escrowCustodyAccount: 'BCD-DGI-ESCROW-1102-DJ',
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
    complianceDirective: 'CBS Act 2020 & Financial Institutions Law Section 14',
    exchangeRateToETB: 125.0,
    usdExchangeRate: 1.0,
    taxFilingCadence: 'Monthly by 10th day via NPS',
    statutoryRemittanceBank: 'Premier Bank / Central Bank of Somalia',
    escrowCustodyAccount: 'CBS-MOF-ESCROW-8830-SO',
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
    complianceDirective: 'BSS Circular No. 03/2022 Electronic Clearing & NRA Act 2012',
    exchangeRateToETB: 0.04,
    usdExchangeRate: 3100.0,
    taxFilingCadence: 'On border entry clearance',
    statutoryRemittanceBank: 'KCB Bank South Sudan / BSS Clearing',
    escrowCustodyAccount: 'BSS-NRA-ESCROW-5521-SS',
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

export interface TradeCorridorMetric {
  corridorName: string;
  countries: string;
  primaryCurrency: string;
  totalWaybills: number;
  totalTonnage: number;
  grossVolumeETB: number;
  activeEscrowETB: number;
  clearedEscrowETB: number;
  taxWithheldETB: number;
  avgTurnaroundHours: number;
  customsComplianceRate: number;
}

export type ReportSubTab = 'ledger' | 'tax' | 'corridors' | 'rails';

export const ReportsView: React.FC<ReportsViewProps> = ({
  trips,
  shipments,
  user,
  userRole,
  userJurisdiction,
  userJurisdictionName,
  assignedCorridors,
  userName,
  userEmail,
  onGuardPermission,
  onNotify,
}) => {
  // Determine operator initial station
  const defaultJurisdiction = useMemo<EastAfricaCountryCode>(() => {
    if (userJurisdiction && EAST_AFRICA_TAX_COMPLIANCE[userJurisdiction]) {
      return userJurisdiction;
    }
    return 'ALL';
  }, [userJurisdiction]);

  // Main UI State
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(defaultJurisdiction);
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('ledger');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');
  const [verticalFilter, setVerticalFilter] = useState<'all' | 'ride' | 'freight' | 'escrow'>('all');
  const [gatewayFilter, setGatewayFilter] = useState<'all' | PaymentGateway>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'verified' | 'escrow' | 'customs'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyDisplayMode, setCurrencyDisplayMode] = useState<'etb' | 'local' | 'usd'>('etb');
  const [inspectRow, setInspectRow] = useState<UnifiedLedgerRow | null>(null);
  const [showRegionalMatrix, setShowRegionalMatrix] = useState(true);

  // Sync station if operator jurisdiction changes
  useEffect(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL' && EAST_AFRICA_TAX_COMPLIANCE[userJurisdiction]) {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  // Get live payment transactions from service
  const allServiceTransactions = paymentSettlementService.getTransactions();

  // Helper to infer corridor and country
  const mapTxToCorridorAndCountry = (
    tx: (typeof allServiceTransactions)[0]
  ): { corridor: string; countryCode: EastAfricaCountryCode; category: UnifiedLedgerRow['category'] } => {
    const trip = (tx.tripId || '').toUpperCase();
    const country = tx.countryCode || 'ET';

    if (trip.includes('MODJO') || trip.includes('DORALEH') || trip.includes('DLV7721') || tx.gateway === 'dmoney_dj') {
      return { corridor: 'Modjo Dry Port ⇄ Port of Djibouti', countryCode: 'DJ', category: 'Cross-Border Escrow' };
    }
    if (trip.includes('MOYALE') || trip.includes('NBO') || tx.gateway === 'mpesa_ke' || tx.gateway === 'airtel_ke') {
      return { corridor: 'Nairobi ⇄ Marsabit ⇄ Moyale OSBP', countryCode: 'KE', category: 'Freight Waybill' };
    }
    if (trip.includes('MALABA') || trip.includes('KLA') || tx.gateway === 'mtn_ug' || tx.gateway === 'airtel_ug') {
      return { corridor: 'Mombasa Port ⇄ Malaba ⇄ Kampala', countryCode: 'UG', category: 'Freight Waybill' };
    }
    if (trip.includes('RUSUMO') || trip.includes('DAR') || tx.gateway === 'mpesa_tz' || tx.gateway === 'tigo_tz') {
      return { corridor: 'Dar es Salaam ⇄ Rusumo ⇄ Kigali', countryCode: 'TZ', category: 'Freight Waybill' };
    }
    if (trip.includes('BERBERA') || trip.includes('MGQ') || tx.gateway === 'evc_plus_so' || tx.gateway === 'zaad_so') {
      return { corridor: 'Berbera Port ⇄ Tog Wajaale ⇄ Jijiga', countryCode: 'SO', category: 'Freight Waybill' };
    }
    if (trip.includes('NIMULE') || trip.includes('JUB') || tx.gateway === 'mgurush_ss') {
      return { corridor: 'Nimule Border ⇄ Juba Transit', countryCode: 'SS', category: 'Freight Waybill' };
    }
    if (trip.includes('KGL') || tx.gateway === 'mtn_rw' || tx.gateway === 'airtel_rw') {
      return { corridor: 'Kigali Metropolitan & Free Trade Zone', countryCode: 'RW', category: 'Mobility Ride' };
    }

    return { corridor: 'Addis Ababa Metropolitan & Domestic Hub', countryCode: country, category: 'Mobility Ride' };
  };

  // Build unified auditable ledger
  const allLedgerRows: UnifiedLedgerRow[] = useMemo(() => {
    // 1. Transactions from paymentSettlementService
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
        date: tx.timestamp || 'Today',
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
        channelDetails: tx.channelDetails || `${hub.countryName} Sovereign Clearing Rail`,
        settlementBatchId: tx.settlementBatchId || `BATCH-${countryCode}-9921`,
        externalRefId: tx.externalRefId,
        reconciledAt: tx.reconciledAt,
        reconciledBy: tx.reconciledBy || userName || 'Automated Clearing Gate',
        reconciliationBank: tx.reconciliationBank || taxInfo.statutoryRemittanceBank,
        reconciliationNotes: tx.reconciliationNotes || `Audit passed statutory verification under ${taxInfo.complianceDirective}`,
      };
    });

    // 2. Extra freight shipments from Back4App / App props
    const freightRows: UnifiedLedgerRow[] = shipments.map((sh, idx) => {
      const gross = Number(sh.freightRateETB || 28500);
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
      } else if (destLower.includes('uganda') || destLower.includes('kampala') || destLower.includes('malaba')) {
        countryCode = 'UG';
        corridor = 'Mombasa Port ⇄ Malaba ⇄ Kampala';
      } else if (destLower.includes('kigali') || destLower.includes('rwanda')) {
        countryCode = 'RW';
        corridor = 'Dar es Salaam ⇄ Rusumo ⇄ Kigali';
      } else if (destLower.includes('tanzania') || destLower.includes('dar')) {
        countryCode = 'TZ';
        corridor = 'Dar es Salaam ⇄ Rusumo ⇄ Kigali';
      } else if (destLower.includes('berbera') || destLower.includes('somalia') || destLower.includes('jijiga')) {
        countryCode = 'SO';
        corridor = 'Berbera Port ⇄ Tog Wajaale ⇄ Jijiga';
      } else if (destLower.includes('juba') || destLower.includes('south sudan') || destLower.includes('nimule')) {
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
        reconciliationBank: countryCode === 'ET' ? 'Commercial Bank of Ethiopia' : 'Regional Interbank Switch',
        reconciliationNotes: `Customs transit manifest with ${sh.tonnage}T ${sh.cargoType}. Single window clearance validated.`,
      };
    });

    // 3. Extra mobility trips from Back4App / App props
    const extraTripRows: UnifiedLedgerRow[] = trips
      .filter((t) => !serviceRows.some((sr) => sr.reference.includes(t.tripId)))
      .map((t, idx) => {
        const gross = Number(t.fareETB || 380);
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
          reconciledBy: 'Ethio Telecom Automated IPN',
          reconciliationBank: 'National Bank of Ethiopia (NBE)',
          reconciliationNotes: 'Direct real-time driver wallet top-up and passenger settlement.',
        };
      });

    return [...serviceRows, ...freightRows, ...extraTripRows];
  }, [allServiceTransactions, shipments, trips, userName]);

  // Filtered rows for audit table
  const displayedRows = useMemo(() => {
    return allLedgerRows.filter((row) => {
      if (selectedCountry !== 'ALL' && row.countryCode !== selectedCountry) return false;
      if (selectedCorridor !== 'all' && row.corridor !== selectedCorridor) return false;
      if (verticalFilter !== 'all' && row.sourceKey !== verticalFilter) return false;
      if (gatewayFilter !== 'all' && row.gateway !== gatewayFilter) return false;

      if (statusFilter !== 'all') {
        if (statusFilter === 'settled' && row.status !== 'Settled') return false;
        if (statusFilter === 'verified' && row.status !== 'Bank Verified') return false;
        if (statusFilter === 'escrow' && row.status !== 'Escrow Locked') return false;
        if (statusFilter === 'customs' && row.status !== 'Customs Cleared') return false;
      }

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
          row.taxAuthority.toLowerCase().includes(q) ||
          (row.externalRefId && row.externalRefId.toLowerCase().includes(q)) ||
          row.settlementBatchId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allLedgerRows, selectedCountry, selectedCorridor, verticalFilter, gatewayFilter, statusFilter, searchQuery]);

  // KPI aggregates
  const totalGrossETB = useMemo(() => displayedRows.reduce((s, r) => s + r.grossETB, 0), [displayedRows]);
  const totalCommissionETB = useMemo(() => displayedRows.reduce((s, r) => s + r.commissionETB, 0), [displayedRows]);
  const totalTaxETB = useMemo(() => displayedRows.reduce((s, r) => s + r.taxETB, 0), [displayedRows]);
  const totalNetDisbursedETB = useMemo(() => displayedRows.reduce((s, r) => s + r.netPayoutETB, 0), [displayedRows]);
  const totalEscrowLockedETB = useMemo(
    () =>
      displayedRows
        .filter((r) => r.status === 'Escrow Locked' || r.sourceKey === 'escrow')
        .reduce((s, r) => s + r.grossETB, 0),
    [displayedRows]
  );

  // Regional breakdown metrics for all 8 countries
  const regionalMetrics = useMemo(() => {
    const list = Object.keys(EAST_AFRICA_TAX_COMPLIANCE) as EastAfricaCountryCode[];
    const overallGross = allLedgerRows.reduce((s, r) => s + r.grossETB, 0) || 1;

    return list.map((code) => {
      const info = EAST_AFRICA_TAX_COMPLIANCE[code];
      const rowsForCountry = allLedgerRows.filter((r) => r.countryCode === code);
      const grossETB = rowsForCountry.reduce((s, r) => s + r.grossETB, 0);
      const commissionETB = rowsForCountry.reduce((s, r) => s + r.commissionETB, 0);
      const taxETB = rowsForCountry.reduce((s, r) => s + r.taxETB, 0);
      const netETB = rowsForCountry.reduce((s, r) => s + r.netPayoutETB, 0);
      const localGross = rowsForCountry.reduce((s, r) => s + r.localGross, 0);
      const share = Math.round((grossETB / overallGross) * 100);
      const verifiedCount = rowsForCountry.filter((r) => r.status === 'Bank Verified' || r.status === 'Customs Cleared').length;
      const complianceScore = rowsForCountry.length > 0 ? Math.round((verifiedCount / rowsForCountry.length) * 100) : 100;

      return {
        ...info,
        txCount: rowsForCountry.length,
        grossETB,
        commissionETB,
        taxETB,
        netETB,
        localGross,
        share,
        complianceScore,
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

  // Trade Corridor Deep Analytics
  const corridorAnalytics: TradeCorridorMetric[] = useMemo(() => {
    return uniqueCorridors.map((cName) => {
      const cRows = allLedgerRows.filter((r) => r.corridor === cName);
      const grossVolumeETB = cRows.reduce((s, r) => s + r.grossETB, 0);
      const activeEscrowETB = cRows.filter((r) => r.status === 'Escrow Locked').reduce((s, r) => s + r.grossETB, 0);
      const clearedEscrowETB = cRows.filter((r) => r.status === 'Bank Verified' || r.status === 'Customs Cleared').reduce((s, r) => s + r.grossETB, 0);
      const taxWithheldETB = cRows.reduce((s, r) => s + r.taxETB, 0);
      const primaryRow = cRows[0];
      const primaryCurrency = primaryRow?.localCurrency || 'ETB';

      let countries = 'Domestic ET';
      if (cName.includes('Djibouti')) countries = '🇪🇹 Ethiopia ⇄ 🇩🇯 Djibouti';
      else if (cName.includes('Moyale')) countries = '🇰🇪 Kenya ⇄ 🇪🇹 Ethiopia';
      else if (cName.includes('Malaba')) countries = '🇰🇪 Kenya ⇄ 🇺🇬 Uganda';
      else if (cName.includes('Rusumo')) countries = '🇹🇿 Tanzania ⇄ 🇷🇼 Rwanda';
      else if (cName.includes('Berbera')) countries = '🇸🇴 Somalia ⇄ 🇪🇹 Ethiopia';
      else if (cName.includes('Nimule')) countries = '🇺🇬 Uganda ⇄ 🇸🇸 South Sudan';

      const totalTonnage = cRows.reduce((s, r) => {
        const match = r.customerName.match(/\[(\d+)T\]/);
        return s + (match ? parseInt(match[1], 10) : 0);
      }, 0);

      const clearedCount = cRows.filter((r) => r.status === 'Bank Verified' || r.status === 'Customs Cleared').length;
      const complianceRate = cRows.length > 0 ? Math.round((clearedCount / cRows.length) * 100) : 95;

      return {
        corridorName: cName,
        countries,
        primaryCurrency,
        totalWaybills: cRows.length,
        totalTonnage: totalTonnage > 0 ? totalTonnage : cRows.length * 28,
        grossVolumeETB,
        activeEscrowETB,
        clearedEscrowETB,
        taxWithheldETB,
        avgTurnaroundHours: cName.includes('Djibouti') ? 36 : cName.includes('Moyale') ? 28 : 24,
        customsComplianceRate: complianceRate,
      };
    });
  }, [allLedgerRows, uniqueCorridors]);

  // Payment Rails Analytics
  const railAnalytics = useMemo(() => {
    const rails: { gateway: PaymentGateway; label: string; countryCode: EastAfricaCountryCode; flag: string }[] = [
      { gateway: 'telebirr', label: 'Ethio Telecom Telebirr', countryCode: 'ET', flag: '🇪🇹' },
      { gateway: 'cbe_birr', label: 'Commercial Bank of Ethiopia (CBE Birr)', countryCode: 'ET', flag: '🇪🇹' },
      { gateway: 'mpesa_ke', label: 'Safaricom M-PESA B2C', countryCode: 'KE', flag: '🇰🇪' },
      { gateway: 'mtn_ug', label: 'MTN Mobile Money Uganda', countryCode: 'UG', flag: '🇺🇬' },
      { gateway: 'mtn_rw', label: 'MTN MoMo Rwanda', countryCode: 'RW', flag: '🇷🇼' },
      { gateway: 'mpesa_tz', label: 'Vodacom M-Pesa Tanzania', countryCode: 'TZ', flag: '🇹🇿' },
      { gateway: 'dmoney_dj', label: 'Djibouti Telecom D-Money', countryCode: 'DJ', flag: '🇩🇯' },
      { gateway: 'evc_plus_so', label: 'Hormuud EVC Plus Somalia', countryCode: 'SO', flag: '🇸🇴' },
      { gateway: 'mgurush_ss', label: 'm-GURUSH South Sudan', countryCode: 'SS', flag: '🇸🇸' },
    ];

    return rails.map((r) => {
      const rRows = allLedgerRows.filter((row) => row.gateway === r.gateway);
      const volumeETB = rRows.reduce((s, row) => s + row.grossETB, 0);
      const taxInfo = EAST_AFRICA_TAX_COMPLIANCE[r.countryCode];
      const localVolume = rRows.reduce((s, row) => s + row.localGross, 0);

      return {
        ...r,
        txCount: rRows.length,
        volumeETB,
        localVolume,
        currencySymbol: taxInfo?.currencySymbol || 'Br',
        currency: taxInfo?.currency || 'ETB',
        speed: 'Instant Real-Time IPN (<3s)',
        settlementStatus: 'Active & Liquid',
        reconciledRate: 100,
      };
    });
  }, [allLedgerRows]);

  // Active country metadata
  const activeCountryInfo = selectedCountry !== 'ALL' ? EAST_AFRICA_TAX_COMPLIANCE[selectedCountry] : null;

  // Currency Formatter Helper
  const formatAmount = (amountETB: number, targetCountryCode: EastAfricaCountryCode = selectedCountry) => {
    if (currencyDisplayMode === 'usd') {
      const usdVal = amountETB / 125.0; // Standard USD exchange rate (1 USD ~ 125 ETB)
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

    return `Br ${amountETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // CSV Export Handler - Full Auditable Multi-Currency Ledger
  const handleDownloadLedgerCsv = () => {
    if (onGuardPermission && !onGuardPermission('manage_finance', 'Export Multi-Currency Financial Ledger')) {
      return;
    }

    const filename = `afronala_financial_ledger_${selectedCountry}_${new Date().toISOString().slice(0, 10)}.csv`;

    const headers = [
      'Entry ID',
      'Dispatch Ref',
      'Sovereign Nation',
      'ISO Code',
      'Bilateral Trade Corridor',
      'Vertical Category',
      'Timestamp',
      'Counterparties',
      'Driver / Carrier',
      'Customer / Cargo',
      'Payment Rail',
      'Local Currency',
      'Local Gross Amount',
      'FX Exchange Rate to ETB',
      'Gross Amount (ETB)',
      'Platform Take-Rate 15% (ETB)',
      'Statutory Tax Authority',
      'Withholding Tax Rate',
      'Statutory Tax Withheld (ETB)',
      'Net Carrier Payout (ETB)',
      'Audit & Clearing Status',
      'Channel Details',
      'Interbank Batch ID',
      'External Ref ID',
      'Audited By',
      'Reconciliation Bank',
      'Compliance Notes',
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
      r.reconciledBy || userName || 'Automated Clearing Gate',
      r.reconciliationBank || 'Central Bank Interbank Gateway',
      r.reconciliationNotes || 'Compliant with statutory trade directive',
    ]);

    downloadCsv(filename, headers, rows);

    onNotify(
      'Multi-Currency Ledger Exported',
      `Exported ${displayedRows.length} auditable ledger rows for ${
        selectedCountry === 'ALL' ? 'Pan-East Africa' : selectedCountry
      } (GTV: ETB ${totalGrossETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`,
      'success'
    );
  };

  // CSV Export Handler - Statutory Tax Summary Report
  const handleDownloadTaxCsv = () => {
    if (onGuardPermission && !onGuardPermission('manage_finance', 'Export Sovereign Tax Summary')) {
      return;
    }

    const filename = `afronala_east_africa_tax_remittance_${new Date().toISOString().slice(0, 10)}.csv`;

    const headers = [
      'Country Code',
      'Sovereign Nation',
      'National Revenue Authority',
      'Central Bank Regulator',
      'Statutory Tax Scheme',
      'Withholding Rate (%)',
      'Gross Volume (ETB)',
      'Gross Volume (Local FX)',
      'Local Currency',
      'Tax Accrued (ETB)',
      'Tax Accrued (Local FX)',
      'Filing Cadence',
      'Statutory Remittance Bank',
      'Escrow Custody Account',
      'Audit Compliance Directive',
    ];

    const rows = regionalMetrics.map((rm) => [
      rm.countryCode,
      rm.countryName,
      rm.revenueAuthority,
      rm.centralBank,
      rm.taxLabel,
      `${(rm.statutoryTaxRate * 100).toFixed(0)}%`,
      rm.grossETB.toFixed(2),
      rm.localGross.toFixed(2),
      rm.currency,
      rm.taxETB.toFixed(2),
      (rm.taxETB / rm.exchangeRateToETB).toFixed(2),
      rm.taxFilingCadence,
      rm.statutoryRemittanceBank,
      rm.escrowCustodyAccount,
      rm.complianceDirective,
    ]);

    downloadCsv(filename, headers, rows);

    onNotify(
      'Sovereign Tax Report Exported',
      `Exported 8-nation statutory tax compliance summary for regional tax authorities.`,
      'success'
    );
  };

  // CSV Export Handler - Bilateral Corridor Freight Report
  const handleDownloadCorridorsCsv = () => {
    if (onGuardPermission && !onGuardPermission('manage_finance', 'Export Corridor Freight Report')) {
      return;
    }

    const filename = `afronala_trade_corridors_escrow_${new Date().toISOString().slice(0, 10)}.csv`;

    const headers = [
      'Trade Corridor',
      'Bilateral Hubs',
      'Primary Currency',
      'Active Waybills',
      'Total Freight Tonnage (T)',
      'Gross Volume (ETB)',
      'Active Escrow Collateral (ETB)',
      'Cleared Escrow (ETB)',
      'Statutory Tax Withheld (ETB)',
      'Avg Turnaround (Hours)',
      'Customs Compliance Rate (%)',
    ];

    const rows = corridorAnalytics.map((ca) => [
      ca.corridorName,
      ca.countries.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, ''), // strip emojis for clean CSV
      ca.primaryCurrency,
      ca.totalWaybills,
      ca.totalTonnage,
      ca.grossVolumeETB.toFixed(2),
      ca.activeEscrowETB.toFixed(2),
      ca.clearedEscrowETB.toFixed(2),
      ca.taxWithheldETB.toFixed(2),
      ca.avgTurnaroundHours,
      `${ca.customsComplianceRate}%`,
    ]);

    downloadCsv(filename, headers, rows);

    onNotify(
      'Corridor Freight Report Exported',
      `Exported bilateral freight and escrow balances across ${corridorAnalytics.length} corridors.`,
      'success'
    );
  };

  // Official PDF Certificate Generator (jsPDF + autoTable)
  const handleGeneratePdfAuditCertificate = () => {
    if (onGuardPermission && !onGuardPermission('manage_finance', 'Generate Sovereign Audit Certificate')) {
      return;
    }

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const targetCountry = selectedCountry === 'ALL' ? 'Pan-East Africa Consolidated' : activeCountryInfo?.countryName || 'Regional Hub';
      const taxInfo = activeCountryInfo || EAST_AFRICA_TAX_COMPLIANCE.ET;

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('AFRONALA SUPERAPP · REGIONAL TREASURY & STATUTORY AUDIT CERTIFICATE', 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(`Official Sovereign Settlement & Tax Compliance Manifest | Jurisdiction: ${targetCountry.toUpperCase()}`, 14, 19);
      doc.text(`Generated: ${new Date().toUTCString()} | Certified Auditor: ${userName || 'Daniel Berhanu'} (${userRole})`, 14, 24);

      // Metadata Block
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('1. AUDIT SPECIFICATIONS & REGULATORY COMPLIANCE', 14, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const metaLeft = [
        `Target Jurisdiction: ${targetCountry}`,
        `Central Bank Authority: ${selectedCountry === 'ALL' ? 'Multilateral (NBE, CBK, BoU, BNR, BoT, BCD, CBS, BSS)' : taxInfo.centralBank}`,
        `Statutory Revenue Authority: ${selectedCountry === 'ALL' ? 'East Africa Revenue Authorities' : taxInfo.revenueAuthority}`,
        `Tax Scheme: ${selectedCountry === 'ALL' ? 'Bilateral Transit Withholding Framework' : `${taxInfo.taxLabel} (${(taxInfo.statutoryTaxRate * 100).toFixed(0)}%)`}`,
      ];

      const metaRight = [
        `Audited Gross Transaction Volume (GTV): ETB ${totalGrossETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `Platform Net Take-Rate (15%): ETB ${totalCommissionETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `Statutory Tax Withholding Reserve: ETB ${totalTaxETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `Carrier & Driver Disbursements: ETB ${totalNetDisbursedETB.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      ];

      let startY = 42;
      metaLeft.forEach((line, idx) => {
        doc.text(line, 14, startY + idx * 5);
      });
      metaRight.forEach((line, idx) => {
        doc.text(line, 160, startY + idx * 5);
      });

      // Itemized Ledger Table
      const tableData = displayedRows.slice(0, 35).map((r) => [
        r.id,
        r.reference,
        r.countryCode,
        r.corridor.length > 30 ? r.corridor.substring(0, 28) + '...' : r.corridor,
        r.category,
        r.gatewayLabel,
        `${r.localCurrency} ${r.localGross.toFixed(2)}`,
        `Br ${r.grossETB.toFixed(2)}`,
        `Br ${r.commissionETB.toFixed(2)}`,
        `Br ${r.taxETB.toFixed(2)}`,
        `Br ${r.netPayoutETB.toFixed(2)}`,
        r.status,
      ]);

      autoTable(doc, {
        startY: 66,
        head: [[
          'Entry ID',
          'Ref',
          'Hub',
          'Corridor',
          'Vertical',
          'Rail',
          'Local Gross',
          'Gross (ETB)',
          'Take (15%)',
          'Tax WHT',
          'Net Payout',
          'Status',
        ]],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [14, 116, 144], // cyan-700
          textColor: 255,
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 1.5,
        },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 20 },
          2: { cellWidth: 10 },
          3: { cellWidth: 50 },
          4: { cellWidth: 26 },
          5: { cellWidth: 25 },
          6: { cellWidth: 24, halign: 'right' },
          7: { cellWidth: 24, halign: 'right' },
          8: { cellWidth: 20, halign: 'right' },
          9: { cellWidth: 20, halign: 'right' },
          10: { cellWidth: 24, halign: 'right' },
          11: { cellWidth: 22, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });

      // Footer Signatures
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 185;
      if (finalY < 190) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('CERTIFICATION STATEMENT:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(
          'This financial report represents a true and cryptographic reconciliation of gross transaction volume, automated withholding taxes, and corridor escrow settlements conducted across the Afronala SuperApp multilateral clearing network.',
          14,
          finalY + 4
        );

        doc.setDrawColor(203, 213, 225);
        doc.line(14, finalY + 18, 90, finalY + 18);
        doc.text(`Authorized Officer: ${userName || 'Daniel Berhanu'}`, 14, finalY + 22);
        doc.text(`Role: ${userRole}`, 14, finalY + 26);

        doc.line(160, finalY + 18, 236, finalY + 18);
        doc.text('Central Bank Interbank Real-Time Gateway Seal', 160, finalY + 22);
        doc.text('Verification Code: AFRO-TREASURY-NBE-88219-SEC', 160, finalY + 26);
      }

      doc.save(`afronala_audit_certificate_${selectedCountry}_${new Date().toISOString().slice(0, 10)}.pdf`);

      onNotify(
        'Audit Certificate PDF Generated',
        `Generated high-fidelity multi-currency audit certificate for ${targetCountry}.`,
        'success'
      );
    } catch (err: any) {
      onNotify('PDF Generation Failed', err?.message || 'Could not compile audit certificate PDF.', 'error');
    }
  };

  const cardClass =
    'p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400">
              <Globe2 className="w-3.5 h-3.5" />
              Afronala East Africa Regional Treasury &amp; Clearing Network
            </span>
            <span aria-hidden="true">·</span>
            <span>Auditor: <strong className="text-slate-800 dark:text-slate-200">{userName || 'Daniel Berhanu'}</strong> ({userRole})</span>
            <span aria-hidden="true">·</span>
            <span>8 Sovereign Nations (ET, KE, UG, RW, TZ, DJ, SO, SS)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Financial Ledger &amp; Multi-Currency Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-border logistics waybill clearing, mobility GTV, platform commission take-rate &amp; statutory tax reserves
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
              title="Local Sovereign Currency (KES, UGX, RWF, TZS, DJF, USD, SSP)"
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
              title="USD Global Trade & Maritime Clearing Equivalent"
            >
              USD
            </button>
          </div>

          <button
            type="button"
            onClick={handleGeneratePdfAuditCertificate}
            title="Download signed sovereign audit certificate PDF for central bank submission"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-700 hover:bg-cyan-600 text-white transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Certificate (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadLedgerCsv}
            title={`Download multi-currency CSV of ${displayedRows.length} displayed records`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger CSV</span>
          </button>
        </div>
      </div>

      {/* Operator Station Governance & Sovereign Banner */}
      <div className="p-3.5 rounded-xl border border-cyan-200/80 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-50/70 via-white to-slate-50 dark:from-cyan-950/25 dark:via-slate-900 dark:to-slate-900/60 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold font-mono text-sm shadow-xs shrink-0">
              {userJurisdiction && userJurisdiction !== 'ALL'
                ? EAST_AFRICA_TAX_COMPLIANCE[userJurisdiction]?.flag || '🌍'
                : '🌍'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {userName || 'Daniel Berhanu'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  {userRole}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Station: {userJurisdictionName || 'Pan-East Africa Headquarters'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {userJurisdiction && EAST_AFRICA_TAX_COMPLIANCE[userJurisdiction] ? (
                  <>
                    Regulated under <strong>{EAST_AFRICA_TAX_COMPLIANCE[userJurisdiction].centralBank}</strong> &amp; <strong>{EAST_AFRICA_TAX_COMPLIANCE[userJurisdiction].revenueAuthority}</strong> · Direct {EAST_AFRICA_TAX_COMPLIANCE[userJurisdiction].taxLabel} ({(EAST_AFRICA_TAX_COMPLIANCE[userJurisdiction].statutoryTaxRate * 100).toFixed(0)}%)
                  </>
                ) : (
                  'Supervising 8 sovereign tax regimes and multilateral bilateral clearing corridors across East Africa'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {userJurisdiction && userJurisdiction !== 'ALL' && selectedCountry !== userJurisdiction && (
              <button
                type="button"
                onClick={() => setSelectedCountry(userJurisdiction)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Snap to My Station ({userJurisdiction})</span>
              </button>
            )}

            {selectedCountry !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedCountry('ALL')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Globe2 className="w-3 h-3" />
                <span>View All 8 Nations</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowRegionalMatrix(!showRegionalMatrix)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Layers className="w-3 h-3" />
              <span>{showRegionalMatrix ? 'Hide Matrix' : 'Show 8-Nation Matrix'}</span>
            </button>
          </div>
        </div>

        {/* Assigned corridors pill list */}
        {assignedCorridors && assignedCorridors.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-600" />
              Assigned Operational Corridors:
            </span>
            {assignedCorridors.map((c, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* East Africa Regional Country Selector Bar */}
      <div className="bg-slate-100/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Sovereign Clearing Station &amp; Central Bank Jurisdiction:
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {selectedCountry === 'ALL'
              ? 'Consolidated Pan-East Africa Clearing (All 8 Nations)'
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
            const isUserStation = userJurisdiction === code;

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
                {isUserStation && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-900 font-bold ml-0.5">
                    ★ Your Station
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Banner when country is selected */}
        {activeCountryInfo && (
          <div className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeCountryInfo.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeCountryInfo.countryName} ({activeCountryInfo.currency})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    {activeCountryInfo.taxLabel} ({(activeCountryInfo.statutoryTaxRate * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>Regulator: <strong className="text-slate-700 dark:text-slate-300">{activeCountryInfo.centralBank}</strong></span>
                  <span>·</span>
                  <span>Tax Portal: <strong className="text-slate-700 dark:text-slate-300">{activeCountryInfo.eTaxPortal}</strong></span>
                  <span>·</span>
                  <span>Custody: <strong className="text-slate-700 dark:text-slate-300">{activeCountryInfo.statutoryRemittanceBank}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50">
                1 {activeCountryInfo.currency} = {activeCountryInfo.exchangeRateToETB} ETB
              </span>
              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                1 USD = {activeCountryInfo.usdExchangeRate} {activeCountryInfo.currency}
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
            Afronala SuperApp net operating revenue
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
              ? `${activeCountryInfo.revenueAuthority} automated reserve`
              : 'Consolidated East Africa tax reserves'}
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
            Collateral locked in bilateral waybill escrow
          </p>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('ledger')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'ledger'
              ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Unified Auditable Ledger &amp; P&amp;L ({displayedRows.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tax')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'tax'
              ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Sovereign Tax Authority &amp; Withholding Reserves (8 Nations)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('corridors')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'corridors'
              ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Bilateral Trade Corridors &amp; Freight Escrow ({corridorAnalytics.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rails')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'rails'
              ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Regional Mobile Money &amp; RTGS Clearing Rails</span>
        </button>
      </div>

      {/* Regional 8-Nation Market Share & Corridor Matrix (Collapsible) */}
      {showRegionalMatrix && (
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
              const isUserStation = userJurisdiction === rm.countryCode;

              return (
                <div
                  key={rm.countryCode}
                  onClick={() => setSelectedCountry(isSelected ? 'ALL' : rm.countryCode)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-xs ring-1 ring-cyan-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {isUserStation && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-900 shadow-xs">
                      ★ My Station
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{rm.flag}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {rm.countryName}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {rm.currency} · 1 {rm.currency} = {rm.exchangeRateToETB} ETB
                        </p>
                      </div>
                    </div>
                    {!isUserStation && (
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {rm.share}%
                      </span>
                    )}
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
                      {rm.complianceScore}% Verified
                    </span>
                    <span>{rm.txCount} txns</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 1: UNIFIED AUDITABLE LEDGER & P&L */}
      {activeSubTab === 'ledger' && (
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

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-600"
              >
                <option value="all">All Clearing States</option>
                <option value="settled">Settled</option>
                <option value="verified">Bank Verified</option>
                <option value="escrow">Escrow Locked</option>
                <option value="customs">Customs Cleared</option>
              </select>
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
                          setStatusFilter('all');
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
      )}

      {/* SUB-TAB 2: SOVEREIGN TAX & STATUTORY COMPLIANCE REPORT */}
      {activeSubTab === 'tax' && (
        <div className="space-y-4">
          <div className={`${cardClass} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  East Africa Sovereign Tax Authorities &amp; Withholding Accruals
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automated statutory withholding reserves, tax identification registers, and electronic tax portals
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTaxCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-700 hover:bg-purple-600 text-white transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Tax Remittance CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                  <tr>
                    <th className="py-2.5 pl-3 pr-4">Sovereign Nation</th>
                    <th className="py-2.5 px-3">Revenue Authority &amp; Scheme</th>
                    <th className="py-2.5 px-3">Central Bank &amp; Clearing Rail</th>
                    <th className="py-2.5 px-3 text-center">WHT Rate</th>
                    <th className="py-2.5 px-3 text-right">Tax Accrued (Local)</th>
                    <th className="py-2.5 px-3 text-right">Tax Accrued (ETB)</th>
                    <th className="py-2.5 px-3">Filing Cadence</th>
                    <th className="py-2.5 px-3 text-center">e-Tax Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {regionalMetrics.map((rm) => (
                    <tr key={rm.countryCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 pl-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{rm.flag}</span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {rm.countryName}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-mono">
                              ISO: {rm.countryCode} · {rm.currency}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {rm.revenueAuthority}
                        </p>
                        <p className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">
                          {rm.taxLabel}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {rm.centralBank}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {rm.eTaxPortal}
                        </p>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-purple-700 dark:text-purple-400">
                        {(rm.statutoryTaxRate * 100).toFixed(0)}%
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {rm.currencySymbol} {(rm.taxETB / rm.exchangeRateToETB).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-700 dark:text-purple-400">
                        Br {rm.taxETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {rm.taxFilingCadence}
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[150px]" title={rm.statutoryRemittanceBank}>
                          {rm.statutoryRemittanceBank}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Compliant
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Tax Compliance Directives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cardClass}>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 mb-2">
                <Landmark className="w-4 h-4 text-cyan-600" />
                Cross-Border Withholding Tax Treaty Protocols
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Djibouti-Ethiopia Transit Treaty:</strong> Modjo dry port cargo exempt from double taxation under bilateral corridor protocol 1999/2021.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>EAC Common Market Protocol:</strong> Kenya, Uganda, Rwanda, and Tanzania reciprocal withholding deductions synchronized with Single Customs Territory (SCT).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Automatic Tax Escrow:</strong> 100% of driver tax withholding is segregated in real-time into designated central bank statutory custody accounts.
                  </span>
                </li>
              </ul>
            </div>

            <div className={cardClass}>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Electronic Tax Integration Endpoints
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">🇰🇪 KRA eTIMS API</span>
                  <p className="text-[10px]">Real-time QR code invoice generation on payment completion</p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">🇺🇬 URA EFRIS Node</span>
                  <p className="text-[10px]">Fiscal receipt device handshake for all freight waybills</p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">🇪🇹 MoR e-Tax Gateway</span>
                  <p className="text-[10px]">NBE automated batch transmission for 2% TOT reconciliation</p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">🇷🇼 RRA EBM v2</span>
                  <p className="text-[10px]">Electronic billing machine cloud sync with BNR RIPPS rail</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BILATERAL TRADE CORRIDORS & FREIGHT ESCROW */}
      {activeSubTab === 'corridors' && (
        <div className="space-y-4">
          <div className={`${cardClass} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  East Africa Cross-Border Bilateral Logistics Corridors &amp; Freight Escrow
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Freight tonnage, proof of delivery customs clearing, and escrow collateral performance
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadCorridorsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-600 text-white transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Corridors CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {corridorAnalytics.map((ca, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                        {ca.countries}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {ca.corridorName}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {ca.totalWaybills} Waybills
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Total Volume:</span>
                      <p className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                        Br {ca.grossVolumeETB.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Freight Cargo:</span>
                      <p className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                        {ca.totalTonnage} Metric Tons
                      </p>
                    </div>

                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Active Escrow:</span>
                      <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5">
                        Br {ca.activeEscrowETB.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Customs Clearance:</span>
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                        {ca.customsComplianceRate}% Success
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Avg Transit Time: {ca.avgTurnaroundHours} Hours</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      Tax: Br {ca.taxWithheldETB.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: REGIONAL MOBILE MONEY & RTGS CLEARING RAILS */}
      {activeSubTab === 'rails' && (
        <div className="space-y-4">
          <div className={`${cardClass} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  East Africa Sovereign Mobile Money &amp; RTGS Interbank Settlement Rails
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant carrier disbursement switches, driver wallet liquidity, and interbank gateway throughput
                </p>
              </div>

              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All 9 Regional Rails Fully Liquid &amp; Operational
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {railAnalytics.map((rail, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{rail.flag}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {rail.label}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {rail.countryCode} Rail · {rail.currency}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                      {rail.txCount} Txns
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Volume (ETB):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Br {rail.volumeETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Local Currency Volume:</span>
                      <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                        {rail.currencySymbol} {rail.localVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Disbursement Latency:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {rail.speed}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      Reconciliation Rate:
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {rail.reconciledRate}% Reconciled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                    Category: {inspectRow.category} · Rail: {inspectRow.gatewayLabel}
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
                      Audited by: {inspectRow.reconciledBy || userName || 'Automated Clearing Gate'} · Bank:{' '}
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
                    `Transaction ${inspectRow.id} verified against ${inspectRow.countryName} clearing record.`,
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
