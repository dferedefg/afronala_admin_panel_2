import React, { useState } from 'react';
import { Download, DollarSign, ShieldCheck, CreditCard, Search, FileSpreadsheet } from 'lucide-react';
import { PaymentGateway, Shipment, Trip } from '../types';
import { paymentSettlementService } from '../services/payments';
import { downloadCsv } from '../services/rbac';

interface ReportsViewProps {
  darkMode: boolean;
  trips: Trip[];
  shipments: Shipment[];
  userRole: string;
  onNotify: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  trips,
  shipments,
  userRole,
  onNotify,
}) => {
  const [gatewayFilter, setGatewayFilter] = useState<'all' | PaymentGateway>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ride' | 'freight'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allTransactions = paymentSettlementService.getTransactions();

  // Build unified auditable ledger rows from live payment transactions, ride trips, and freight shipments
  const txRows = allTransactions.map((tx) => ({
    id: tx.reference,
    date: tx.timestamp,
    category: 'Ride Settlement' as const,
    sourceKey: 'ride' as const,
    reference: `Trip #${tx.tripId}`,
    counterparty: `${tx.driverName} / ${tx.passengerName}`,
    gateway: tx.gateway,
    grossETB: tx.grossFareETB,
    commissionETB: tx.platformCommissionETB,
    taxETB: tx.withholdingTaxETB,
    netPayoutETB: tx.netDriverETB,
    status: tx.status === 'bank_verified' ? 'Bank Verified' : 'Settled',
  }));

  const freightRows = shipments.map((sh) => {
    const gross = Number(sh.freightRateETB || 0);
    const comm = Math.round(gross * 0.15 * 100) / 100;
    const tax = Math.round(gross * 0.02 * 100) / 100;
    const net = Math.round((gross - comm - tax) * 100) / 100;
    return {
      id: `FRT-${sh.shipmentId.replace('#', '')}`,
      date: sh.time,
      category: 'Freight Waybill' as const,
      sourceKey: 'freight' as const,
      reference: sh.shipmentId,
      counterparty: `${sh.driver} (${sh.truckPlate})`,
      gateway: 'cbe_birr' as PaymentGateway,
      grossETB: gross,
      commissionETB: comm,
      taxETB: tax,
      netPayoutETB: net,
      status: sh.status === 'Delivered' ? 'Bank Verified' : sh.status,
    };
  });

  // Include any trips not already in paymentSettlementService
  const extraTripRows = trips
    .filter((t) => !allTransactions.some((tx) => t.tripId.includes(tx.tripId)))
    .map((t) => {
      const gross = Number(t.fareETB || 0);
      const comm = Math.round(gross * 0.15 * 100) / 100;
      const tax = Math.round(gross * 0.02 * 100) / 100;
      const net = Math.round((gross - comm - tax) * 100) / 100;
      return {
        id: `RID-${t.tripId.replace('#', '')}`,
        date: t.time,
        category: 'Mobility Fare' as const,
        sourceKey: 'ride' as const,
        reference: t.tripId,
        counterparty: `${t.driver} / ${t.passenger}`,
        gateway: 'telebirr' as PaymentGateway,
        grossETB: gross,
        commissionETB: comm,
        taxETB: tax,
        netPayoutETB: net,
        status: t.status,
      };
    });

  const allLedgerRows = [...txRows, ...freightRows, ...extraTripRows];

  const displayedRows = allLedgerRows.filter((row) => {
    if (gatewayFilter !== 'all' && row.gateway !== gatewayFilter) return false;
    if (sourceFilter !== 'all' && row.sourceKey !== sourceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        row.id.toLowerCase().includes(q) ||
        row.reference.toLowerCase().includes(q) ||
        row.counterparty.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.gateway.replace('_', ' ').toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const totalGrossETB = displayedRows.reduce((s, r) => s + r.grossETB, 0);
  const totalCommissionETB = displayedRows.reduce((s, r) => s + r.commissionETB, 0);
  const totalTaxETB = displayedRows.reduce((s, r) => s + r.taxETB, 0);
  const totalNetDisbursedETB = displayedRows.reduce((s, r) => s + r.netPayoutETB, 0);

  const handleDownloadCsv = () => {
    downloadCsv(
      `afronala_financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Entry ID',
        'Timestamp',
        'Category',
        'Dispatch Ref',
        'Counterparties',
        'Payment Rail',
        'Gross Amount (ETB)',
        'Platform Commission 15% (ETB)',
        'Turnover Tax 2% (ETB)',
        'Net Carrier Payout 83% (ETB)',
        'Audit Status',
      ],
      displayedRows.map((r) => [
        r.id,
        r.date,
        r.category,
        r.reference,
        r.counterparty,
        r.gateway.toUpperCase(),
        r.grossETB.toFixed(2),
        r.commissionETB.toFixed(2),
        r.taxETB.toFixed(2),
        r.netPayoutETB.toFixed(2),
        r.status,
      ])
    );

    onNotify(
      'Financial Report CSV Downloaded',
      `Exported ${displayedRows.length} currently displayed ledger entries (ETB ${totalGrossETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`,
      'success'
    );
  };

  const cardClass =
    'p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Treasury &amp; Audit</span>
            <span aria-hidden="true">·</span>
            <span>Operator: {userRole}</span>
            <span aria-hidden="true">·</span>
            <span>15% Commission / 2% Withholding Tax</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Financial &amp; Operational Reports
          </h1>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          title={`Download CSV of ${displayedRows.length} currently displayed ledger records`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV</span>
        </button>
      </div>

      {/* Live Aggregated KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Audited Gross Volume
            </span>
            <DollarSign className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
            ETB {totalGrossETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {displayedRows.length} of {allLedgerRows.length} rides, wallets &amp; freight waybills
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Net Platform Commission (15%)
            </span>
            <DollarSign className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-emerald-700 dark:text-emerald-400">
            ETB {totalCommissionETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Retained Afronala operating revenue
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Driver &amp; Carrier Payouts (83%)
            </span>
            <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
            ETB {totalNetDisbursedETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Cleared via Telebirr, CBE Birr &amp; Chapa
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Turnover Tax Withheld (2%)
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-purple-700 dark:text-purple-400">
            ETB {totalTaxETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Ministry of Revenues statutory reserve
          </p>
        </div>
      </div>

      {/* Filterable Reconciliation Table */}
      <div className={`${cardClass} space-y-4`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Consolidated Reconciliation Audit Trail
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Showing {displayedRows.length} of {allLedgerRows.length} entries · Filtered view exports directly via Download CSV
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ref, driver, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(
                [
                  { id: 'all', label: 'All Verticals' },
                  { id: 'ride', label: 'Ride Mobility' },
                  { id: 'freight', label: 'Truck Freight' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSourceFilter(s.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    sourceFilter === s.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
              {(['all', 'telebirr', 'cbe_birr', 'chapa', 'cash'] as const).map((gw) => (
                <button
                  key={gw}
                  type="button"
                  onClick={() => setGatewayFilter(gw)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors capitalize whitespace-nowrap shrink-0 ${
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

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 pl-3 pr-4">Entry &amp; Ref</th>
                <th className="py-2.5 px-4">Vertical</th>
                <th className="py-2.5 px-4">Counterparties</th>
                <th className="py-2.5 px-4">Payment Rail</th>
                <th className="py-2.5 px-4 text-right">Gross (ETB)</th>
                <th className="py-2.5 px-4 text-right">Comm 15%</th>
                <th className="py-2.5 px-4 text-right">Tax 2%</th>
                <th className="py-2.5 px-4 text-right">Net Payout</th>
                <th className="py-2.5 pl-4 pr-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {displayedRows.length > 0 ? (
                displayedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pl-3 pr-4">
                      <p className="font-mono font-semibold text-slate-900 dark:text-white">
                        {row.id}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {row.reference} · {row.date}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-300 font-medium">
                      {row.category}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {row.counterparty}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-800 dark:text-slate-300 font-medium">
                      {row.gateway.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {row.grossETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                      {row.commissionETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-purple-700 dark:text-purple-400">
                      {row.taxETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400">
                      {row.netPayoutETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 pl-4 pr-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {row.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-600 dark:text-slate-400">
                    <FileSpreadsheet className="w-6 h-6 mx-auto mb-2 text-slate-500 dark:text-slate-400" />
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      No matching reconciliation entries
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Clear or broaden your active vertical, payment rail, or search filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setGatewayFilter('all');
                        setSourceFilter('all');
                        setSearchQuery('');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
