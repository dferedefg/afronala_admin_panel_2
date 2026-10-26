import { DriverWallet, PaymentGateway, PaymentStatus, PaymentTransaction } from '../types';

export const INITIAL_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'tx-101',
    reference: 'TB-ET-2026-88129',
    tripId: 'TRP9281',
    driverId: 'drv-1',
    driverName: 'Abebe Kebede',
    passengerName: 'Selamawit Bekele',
    grossFareETB: 340.00,
    platformCommissionETB: 51.00,
    withholdingTaxETB: 6.80,
    netDriverETB: 282.20,
    gateway: 'telebirr',
    status: 'settled',
    timestamp: '10 min ago',
    settlementBatchId: 'BATCH-AA-041',
    channelDetails: 'Telebirr USSD *127# (0911****89)',
  },
  {
    id: 'tx-102',
    reference: 'CBE-BIRR-449102',
    tripId: 'TRP9283',
    driverId: 'drv-2',
    driverName: 'Almaz Tadesse',
    passengerName: 'Kidus Yohannes',
    grossFareETB: 480.00,
    platformCommissionETB: 72.00,
    withholdingTaxETB: 9.60,
    netDriverETB: 398.40,
    gateway: 'cbe_birr',
    status: 'bank_verified',
    timestamp: '25 min ago',
    settlementBatchId: 'BATCH-AA-041',
    channelDetails: 'CBE Birr Wallet Debit (1000****45)',
    externalRefId: 'CBE-CORE-2026-90412',
    reconciledAt: '20 min ago',
    reconciledBy: 'Finance Ops Lead',
    reconciliationBank: 'Commercial Bank of Ethiopia',
    reconciliationNotes: 'Matched against daily settlement clearing file from CBE Core Banking portal.',
  },
  {
    id: 'tx-103',
    reference: 'CHP-CHG-99214',
    tripId: 'TRP9280',
    driverId: 'drv-4',
    driverName: 'Ephrem Getachew',
    passengerName: 'Blen Tesfaye',
    grossFareETB: 620.00,
    platformCommissionETB: 93.00,
    withholdingTaxETB: 12.40,
    netDriverETB: 514.60,
    gateway: 'chapa',
    status: 'settled',
    timestamp: '45 min ago',
    settlementBatchId: 'BATCH-AA-040',
    channelDetails: 'Visa / Mastercard via Chapa API',
  },
  {
    id: 'tx-104',
    reference: 'CSH-REC-11209',
    tripId: 'TRP9279',
    driverId: 'drv-3',
    driverName: 'Dawit Haile',
    passengerName: 'Yared Mulugeta',
    grossFareETB: 220.00,
    platformCommissionETB: 33.00,
    withholdingTaxETB: 4.40,
    netDriverETB: 182.60,
    gateway: 'cash',
    status: 'settled',
    timestamp: '1 hour ago',
    channelDetails: 'Cash collected by driver (Commission debited from wallet)',
  },
  {
    id: 'tx-105',
    reference: 'TB-ET-2026-88094',
    tripId: 'TRP9275',
    driverId: 'drv-1',
    driverName: 'Abebe Kebede',
    passengerName: 'Meron Assefa',
    grossFareETB: 410.00,
    platformCommissionETB: 61.50,
    withholdingTaxETB: 8.20,
    netDriverETB: 340.30,
    gateway: 'telebirr',
    status: 'settled',
    timestamp: '2 hours ago',
    settlementBatchId: 'BATCH-AA-040',
    channelDetails: 'Telebirr Mobile App SuperApp Pay',
  },
  {
    id: 'tx-106',
    reference: 'CBE-BIRR-448911',
    tripId: 'TRP9272',
    driverId: 'drv-5',
    driverName: 'Sara Mengistu',
    passengerName: 'Abel Tefera',
    grossFareETB: 290.00,
    platformCommissionETB: 43.50,
    withholdingTaxETB: 5.80,
    netDriverETB: 240.70,
    gateway: 'cbe_birr',
    status: 'settled',
    timestamp: '3 hours ago',
    settlementBatchId: 'BATCH-AA-039',
    channelDetails: 'CBE Mobile Banking Direct Debit',
  },
];

export const INITIAL_WALLETS: DriverWallet[] = [
  {
    driverId: 'drv-1',
    driverName: 'Abebe Kebede',
    phone: '+251 91 123 4567',
    availableBalanceETB: 4850.50,
    pendingPayoutETB: 622.50,
    totalEarnedETB: 34200.00,
    totalCommissionPaidETB: 6035.00,
    preferredPayoutMethod: 'telebirr',
    payoutAccount: '0911234567',
    lastPayoutDate: '2 days ago',
  },
  {
    driverId: 'drv-2',
    driverName: 'Almaz Tadesse',
    phone: '+251 92 234 5678',
    availableBalanceETB: 6120.00,
    pendingPayoutETB: 398.40,
    totalEarnedETB: 42150.00,
    totalCommissionPaidETB: 7438.00,
    preferredPayoutMethod: 'cbe_birr',
    payoutAccount: '1000189283748',
    lastPayoutDate: 'Yesterday',
  },
  {
    driverId: 'drv-3',
    driverName: 'Dawit Haile',
    phone: '+251 93 345 6789',
    availableBalanceETB: 2340.25,
    pendingPayoutETB: 182.60,
    totalEarnedETB: 28400.00,
    totalCommissionPaidETB: 5011.00,
    preferredPayoutMethod: 'telebirr',
    payoutAccount: '0933456789',
    lastPayoutDate: '4 days ago',
  },
  {
    driverId: 'drv-4',
    driverName: 'Ephrem Getachew',
    phone: '+251 94 456 7890',
    availableBalanceETB: 8940.00,
    pendingPayoutETB: 514.60,
    totalEarnedETB: 59300.00,
    totalCommissionPaidETB: 10464.00,
    preferredPayoutMethod: 'cbe_birr',
    payoutAccount: '1000293847583',
    lastPayoutDate: '3 days ago',
  },
  {
    driverId: 'drv-5',
    driverName: 'Sara Mengistu',
    phone: '+251 95 567 8901',
    availableBalanceETB: 3410.80,
    pendingPayoutETB: 240.70,
    totalEarnedETB: 21900.00,
    totalCommissionPaidETB: 3865.00,
    preferredPayoutMethod: 'telebirr',
    payoutAccount: '0955678901',
    lastPayoutDate: 'Today, 08:30',
  },
];

export const COMMISSION_RATE = 0.15; // 15% Afronala Take Rate
export const WITHHOLDING_TAX_RATE = 0.02; // 2% Ethiopian Turnover Withholding Tax

export function calculateFareSplit(
  grossFareETB: number,
  customCommissionRate: number = COMMISSION_RATE,
  customTaxRate: number = WITHHOLDING_TAX_RATE
) {
  const commission = Math.round(grossFareETB * customCommissionRate * 100) / 100;
  const tax = Math.round(grossFareETB * customTaxRate * 100) / 100;
  const netDriver = Math.round((grossFareETB - commission - tax) * 100) / 100;

  return {
    grossFareETB,
    platformCommissionETB: commission,
    withholdingTaxETB: tax,
    netDriverETB: netDriver,
  };
}

class PaymentSettlementService {
  private transactions: PaymentTransaction[] = [...INITIAL_TRANSACTIONS];
  private wallets: DriverWallet[] = [...INITIAL_WALLETS];

  getTransactions(): PaymentTransaction[] {
    return [...this.transactions];
  }

  getWallets(): DriverWallet[] {
    return [...this.wallets];
  }

  getWallet(driverId: string): DriverWallet | undefined {
    return this.wallets.find((w) => w.driverId === driverId);
  }

  processSettlement(
    tripId: string,
    driverId: string,
    driverName: string,
    passengerName: string,
    grossFareETB: number,
    gateway: PaymentGateway,
    customCommissionRate?: number
  ): PaymentTransaction {
    const split = calculateFareSplit(grossFareETB, customCommissionRate ?? COMMISSION_RATE);
    const prefixMap: Record<PaymentGateway, string> = {
      telebirr: 'TB-ET-2026-',
      cbe_birr: 'CBE-BIRR-',
      chapa: 'CHP-CHG-',
      cash: 'CSH-REC-',
    };

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      reference: `${prefixMap[gateway]}${Math.floor(10000 + Math.random() * 90000)}`,
      tripId,
      driverId,
      driverName,
      passengerName,
      grossFareETB: split.grossFareETB,
      platformCommissionETB: split.platformCommissionETB,
      withholdingTaxETB: split.withholdingTaxETB,
      netDriverETB: split.netDriverETB,
      gateway,
      status: 'settled',
      timestamp: 'Just now',
      settlementBatchId: `BATCH-AA-042`,
      channelDetails:
        gateway === 'telebirr'
          ? 'Telebirr USSD Push *127#'
          : gateway === 'cbe_birr'
          ? 'Commercial Bank of Ethiopia Direct Debit'
          : gateway === 'chapa'
          ? 'Chapa Payment Gateway Webhook'
          : 'Cash settled in-cab; Afronala commission deducted from balance',
    };

    this.transactions = [newTx, ...this.transactions];

    // Update wallet
    const existingWallet = this.wallets.find((w) => w.driverId === driverId);
    if (existingWallet) {
      if (gateway === 'cash') {
        // Driver collected cash; commission is subtracted from wallet balance
        existingWallet.availableBalanceETB -= split.platformCommissionETB;
      } else {
        // Digital payment; net driver earnings added to wallet balance
        existingWallet.availableBalanceETB += split.netDriverETB;
      }
      existingWallet.totalEarnedETB += split.grossFareETB;
      existingWallet.totalCommissionPaidETB += split.platformCommissionETB;
    }

    return newTx;
  }

  disbursePayout(driverId: string, amountETB: number): { success: boolean; message: string; txRef?: string } {
    const wallet = this.wallets.find((w) => w.driverId === driverId);
    if (!wallet) return { success: false, message: 'Driver wallet not found.' };
    if (wallet.availableBalanceETB < amountETB) {
      return { success: false, message: 'Insufficient wallet balance.' };
    }

    wallet.availableBalanceETB -= amountETB;
    wallet.lastPayoutDate = 'Just now';

    const txRef =
      wallet.preferredPayoutMethod === 'telebirr'
        ? `TB-PAYOUT-${Math.floor(100000 + Math.random() * 900000)}`
        : `CBE-XFER-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      message: `Disbursed ETB ${amountETB.toLocaleString()} to ${wallet.driverName} via ${
        wallet.preferredPayoutMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'
      } (${wallet.payoutAccount})`,
      txRef,
    };
  }

  simulateWebhook(gateway: PaymentGateway, amountETB: number, passenger: string, driverName: string) {
    const tripId = `TRP${Math.floor(1000 + Math.random() * 9000)}`;
    const driver = this.wallets.find((w) => w.driverName.toLowerCase().includes(driverName.toLowerCase())) || this.wallets[0];

    return this.processSettlement(
      tripId,
      driver.driverId,
      driver.driverName,
      passenger,
      amountETB,
      gateway
    );
  }

  reconcileTransaction(
    txId: string,
    externalRefId: string,
    reconciliationNotes?: string,
    reconciledBy: string = 'Finance Auditor',
    reconciliationBank: string = 'Commercial Bank of Ethiopia'
  ): { success: boolean; message: string; transaction?: PaymentTransaction } {
    const tx = this.transactions.find((t) => t.id === txId);
    if (!tx) return { success: false, message: 'Transaction not found.' };

    tx.status = 'bank_verified';
    tx.externalRefId = externalRefId;
    tx.reconciledAt = 'Just now';
    tx.reconciledBy = reconciledBy;
    tx.reconciliationNotes = reconciliationNotes;
    tx.reconciliationBank = reconciliationBank;

    return {
      success: true,
      message: `Transaction ${tx.reference} marked as 'Bank Verified' with external reference ID: ${externalRefId}.`,
      transaction: tx,
    };
  }
}

export const paymentSettlementService = new PaymentSettlementService();
