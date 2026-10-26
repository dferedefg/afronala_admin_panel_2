import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DriverComplianceDocument,
  DriverDocumentComplianceRecord,
  DriverDocumentType,
  FleetTripCompliance,
} from '../types';
import {
  DOCUMENT_SPECIFICATIONS,
  EXPIRY_WARNING_WINDOW_DAYS,
  PUMP_PRICE_ETB_PER_LITER,
  summarizeDriverCompliance,
  VEHICLE_FUEL_STANDARDS,
} from './compliance';

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

export interface DriverCompliancePdfOptions {
  records: DriverDocumentComplianceRecord[];
  allRecordsCount: number;
  userRole: string;
  docFilterLabel: string;
  moduleFilterLabel: string;
  searchQuery?: string;
}

export interface TripTariffPdfOptions {
  records: FleetTripCompliance[];
  userRole: string;
  statusFilterLabel: string;
  searchQuery?: string;
  summary: {
    totalTrips: number;
    complianceRate: number;
    violationsCount: number;
    totalFuelLiters: number;
    totalFuelCostETB: number;
    totalCo2Kg: number;
  };
}

function sanitizePdfText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/·/g, '|')
    .replace(/•/g, '-')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[^\x20-\x7E]/g, '');
}

function getLastTableFinalY(doc: jsPDF, fallbackY: number): number {
  const tableDoc = doc as JsPdfWithAutoTable;
  return typeof tableDoc.lastAutoTable?.finalY === 'number'
    ? tableDoc.lastAutoTable.finalY
    : fallbackY;
}

function buildAuditReference(prefix: string, now: Date): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const suffix = String(now.getSeconds()).padStart(2, '0');
  return `${prefix}-${yyyy}${mm}${dd}-${hh}${min}${suffix}`;
}

function formatReadableTimestamp(now: Date): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min} EAT`;
}

function formatDocumentCell(docItem: DriverComplianceDocument | undefined): string {
  if (!docItem) return 'N/A';
  const dayText =
    docItem.daysRemaining < 0
      ? `OVERDUE ${Math.abs(docItem.daysRemaining)}d (-${docItem.pointDeduction}pt)`
      : docItem.daysRemaining <= EXPIRY_WARNING_WINDOW_DAYS
      ? `${docItem.daysRemaining}d left (-${docItem.pointDeduction}pt)`
      : `${docItem.daysRemaining}d valid`;
  return `${docItem.expiresAt}\n${dayText}\n#${sanitizePdfText(docItem.documentNumber)}`;
}

function formatRiskLabel(rec: DriverDocumentComplianceRecord): string {
  if (rec.hasExpiredDocument) {
    return `OVERDUE (${rec.expiredCount})`;
  }
  if (rec.flaggedWithin30Days) {
    return `FLAGGED <=30d (${rec.expiringSoonCount})`;
  }
  return 'CLEARED (>30d)';
}

function applyPageFooters(doc: jsPDF, auditRef: string, timestampLabel: string) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `AfroNala Fleet Operations | Addis Ababa City Transport Bureau Regulatory Audit Copy | Ref: ${auditRef}`,
      14,
      pageHeight - 7.5
    );
    doc.text(
      `Generated ${timestampLabel} | Page ${page} of ${totalPages}`,
      pageWidth - 14,
      pageHeight - 7.5,
      { align: 'right' }
    );
  }
}

function drawSignOffSection(
  doc: jsPDF,
  startY: number,
  auditRef: string,
  userRole: string,
  timestampLabel: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const blockHeight = 36;

  let y = startY;
  if (y + blockHeight > pageHeight - 18) {
    doc.addPage();
    y = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFLINE ADMINISTRATIVE RECORD-KEEPING & PHYSICAL AUDIT ATTESTATION', 14, y);

  y += 3.5;
  const colGap = 5;
  const usableWidth = pageWidth - 28;
  const colWidth = (usableWidth - colGap * 2) / 3;

  const boxes = [
    {
      title: '1. PREPARED & EXPORTED BY',
      line1: `Operator Role: ${sanitizePdfText(userRole)}`,
      line2: `Audit Reference: ${auditRef}`,
      line3: `Exported At: ${timestampLabel}`,
    },
    {
      title: '2. FLEET COMPLIANCE OFFICER REVIEW',
      line1: 'Officer Name: ____________________________',
      line2: 'Signature: _______________________________',
      line3: 'Review Date: ____ / ____ / 202__',
    },
    {
      title: '3. REGULATORY ARCHIVE & STAMP',
      line1: 'Transport Bureau Filing ID: _______________',
      line2: 'Physical Dossier Verified:  [  ] YES   [  ] NO',
      line3: 'Official Stamp / Seal:',
    },
  ];

  boxes.forEach((box, idx) => {
    const x = 14 + idx * (colWidth + colGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, colWidth, 27, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(box.title, x + 3.5, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(box.line1, x + 3.5, y + 11.5);
    doc.text(box.line2, x + 3.5, y + 17);
    doc.text(box.line3, x + 3.5, y + 22.5);
  });
}

export function exportDriverComplianceReportPdf(options: DriverCompliancePdfOptions): {
  fileName: string;
  auditRef: string;
} {
  const {
    records,
    allRecordsCount,
    userRole,
    docFilterLabel,
    moduleFilterLabel,
    searchQuery,
  } = options;

  const now = new Date();
  const auditRef = buildAuditReference('AUD-CMP', now);
  const timestampLabel = formatReadableTimestamp(now);
  const summary = summarizeDriverCompliance(records);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Regulatory Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 27, 'F');
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 27, pageWidth, 1.4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text('AFRONALA FLEET OPERATIONS - DRIVER COMPLIANCE AUDIT REPORT', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Addis Ababa City Transport Bureau Regulatory Governance | Automated ${EXPIRY_WARNING_WINDOW_DAYS}-Day Credential Scoring Ledger`,
    14,
    17
  );

  const scopeParts = [
    `Module: ${sanitizePdfText(moduleFilterLabel)}`,
    `Filter: ${sanitizePdfText(docFilterLabel)}`,
    `Records: ${records.length} of ${allRecordsCount}`,
  ];
  if (searchQuery && searchQuery.trim()) {
    scopeParts.push(`Query: "${sanitizePdfText(searchQuery.trim())}"`);
  }
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(scopeParts.join('  |  '), 14, 22.8);

  // Right-aligned Audit Metadata
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(103, 232, 249);
  doc.text(`REF: ${auditRef}`, pageWidth - 14, 10.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Issued: ${timestampLabel}`, pageWidth - 14, 16.5, { align: 'right' });
  doc.text(`Auditor Role: ${sanitizePdfText(userRole)}`, pageWidth - 14, 22.5, {
    align: 'right',
  });

  // Executive KPI Strip (4 Equal Cards)
  const kpiStartY = 33;
  const kpiGap = 4;
  const kpiWidth = (pageWidth - 28 - kpiGap * 3) / 4;
  const kpiHeight = 19;

  const kpiItems: Array<{
    label: string;
    value: string;
    subtext: string;
    valueRgb: [number, number, number];
  }> = [
    {
      label: 'FLEET AVG COMPLIANCE SCORE',
      value: `${summary.averageScore} / 100`,
      subtext: `Weighted across ${summary.totalDrivers} exported drivers`,
      valueRgb: [15, 23, 42],
    },
    {
      label: `FLAGGED <= ${EXPIRY_WARNING_WINDOW_DAYS} DAYS TO EXPIRY`,
      value: `${summary.flaggedWithin30dDrivers} Drivers`,
      subtext: `${summary.expiringDocumentsTotal} credentials inside ${EXPIRY_WARNING_WINDOW_DAYS}d window`,
      valueRgb: [180, 83, 9],
    },
    {
      label: 'EXPIRED / OVERDUE CREDENTIALS',
      value: `${summary.expiredDrivers} Drivers`,
      subtext:
        summary.expiredDrivers === 0
          ? 'Zero overdue credentials in scope'
          : 'Hold dispatch until renewal verified',
      valueRgb: [190, 18, 60],
    },
    {
      label: `FULLY CLEARED (> ${EXPIRY_WARNING_WINDOW_DAYS} DAYS)`,
      value: `${summary.fullyCompliantDrivers} Drivers`,
      subtext: 'All 4 statutory documents valid > 30d',
      valueRgb: [4, 120, 87],
    },
  ];

  kpiItems.forEach((item, index) => {
    const x = 14 + index * (kpiWidth + kpiGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, kpiStartY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(item.label, x + 3.5, kpiStartY + 5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(item.valueRgb[0], item.valueRgb[1], item.valueRgb[2]);
    doc.text(item.value, x + 3.5, kpiStartY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.subtext, x + 3.5, kpiStartY + 16.5);
  });

  // Statutory Rubric Reference Line
  let cursorY = kpiStartY + kpiHeight + 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const rubricSpecs = (Object.keys(DOCUMENT_SPECIFICATIONS) as DriverDocumentType[])
    .map((key) => {
      const s = DOCUMENT_SPECIFICATIONS[key];
      return `${s.shortLabel} (${s.maxWeight}pt max: -${s.deduction30d} <=30d, -${s.deduction14d} <=14d, -${s.deductionExpired} expired)`;
    })
    .join('   |   ');
  doc.text(`Statutory Scoring Formula:  ${rubricSpecs}`, 14, cursorY);

  // Priority Watchlist Section (Flagged <= 30d or Overdue)
  const priorityDrivers = records.filter(
    (r) => r.flaggedWithin30Days || r.hasExpiredDocument
  );

  if (priorityDrivers.length > 0) {
    cursorY += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(146, 64, 14);
    doc.text(
      `PRIORITY ACTION WATCHLIST - FLAGGED <= ${EXPIRY_WARNING_WINDOW_DAYS} DAYS & OVERDUE DRIVERS (${priorityDrivers.length})`,
      14,
      cursorY
    );

    autoTable(doc, {
      startY: cursorY + 2,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: {
        fillColor: [120, 53, 15],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [15, 23, 42],
        cellPadding: 2,
        valign: 'top',
      },
      alternateRowStyles: {
        fillColor: [255, 251, 235],
      },
      head: [
        [
          'Driver & Phone',
          'Vehicle & Module',
          'Score',
          'Standing',
          'Flagged / Expired Statutory Credentials',
          'Score Deductions Applied',
          'Notice Status',
        ],
      ],
      body: priorityDrivers.map((rec) => {
        const urgentDocs = rec.documents
          .filter((d) => d.expiryState !== 'valid')
          .map((d) =>
            d.daysRemaining < 0
              ? `${d.shortLabel} (${d.documentNumber}): ${Math.abs(d.daysRemaining)}d OVERDUE [${d.expiresAt}]`
              : `${d.shortLabel} (${d.documentNumber}): ${d.daysRemaining}d left [${d.expiresAt}]`
          )
          .join('\n');

        const deductionText =
          rec.deductions.length > 0
            ? rec.deductions
                .map((d) => `-${d.points}pt: ${sanitizePdfText(d.reason)}`)
                .join('\n')
            : 'None';

        return [
          `${sanitizePdfText(rec.driverName)}\n${sanitizePdfText(rec.phone)}`,
          `${sanitizePdfText(rec.vehiclePlate)} (${rec.module === 'truck' ? 'Freight' : 'Ride'})\n${sanitizePdfText(rec.vehicleModel)}`,
          `${rec.complianceScore} / 100`,
          formatRiskLabel(rec),
          urgentDocs || 'Account / Vehicle inspection status',
          deductionText,
          rec.complianceNoticeSentAt
            ? `Sent: ${sanitizePdfText(rec.complianceNoticeSentAt)}`
            : 'Pending Notice',
        ];
      }),
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20, halign: 'right', font: 'courier', fontStyle: 'bold' },
        3: { cellWidth: 28, fontStyle: 'bold' },
        4: { cellWidth: 62 },
        5: { cellWidth: 55 },
        6: { cellWidth: 26 },
      },
    });

    cursorY = getLastTableFinalY(doc, cursorY + 20) + 7;
  } else {
    cursorY += 6;
  }

  // Complete Driver Credential Matrix
  const pageHeight = doc.internal.pageSize.getHeight();
  if (cursorY > pageHeight - 38) {
    doc.addPage();
    cursorY = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `COMPLETE DRIVER CREDENTIAL SCORING & EXPIRATION REGISTER (${records.length} RECORDS)`,
    14,
    cursorY
  );

  if (records.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No driver compliance records matched the active filter criteria at export time.', 14, cursorY + 7);
    cursorY += 16;
  } else {
    autoTable(doc, {
      startY: cursorY + 2,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 6.9,
        textColor: [30, 41, 59],
        cellPadding: 1.8,
        valign: 'top',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      head: [
        [
          '#',
          'Driver & Account',
          'Unit & Module',
          'Score',
          'Standing',
          'License (ET-LIC)',
          'Bola (AA-BOL)',
          'Insurance (EIC-POL)',
          'TIN Tax (MOR-TIN)',
          'Audit Notes / Notice',
        ],
      ],
      body: records.map((rec, index) => {
        const docByType = Object.fromEntries(
          rec.documents.map((d) => [d.docType, d])
        ) as Partial<Record<DriverDocumentType, DriverComplianceDocument>>;

        const auditNotes =
          rec.deductions.length === 0
            ? 'All statutory credentials >30d'
            : rec.deductions
                .map((d) => `-${d.points}pt ${sanitizePdfText(d.reason)}`)
                .join('; ');

        const noticeLine = rec.complianceNoticeSentAt
          ? `\nNotice: ${sanitizePdfText(rec.complianceNoticeSentAt)}`
          : '';

        return [
          String(index + 1),
          `${sanitizePdfText(rec.driverName)}\n${sanitizePdfText(rec.phone)}\n${rec.driverStatus} | ${rec.sourceClass}`,
          `${sanitizePdfText(rec.vehiclePlate)}\n${sanitizePdfText(rec.vehicleModel)}\nModule: ${rec.module === 'truck' ? 'Freight' : 'Ride'}`,
          `${rec.complianceScore}/100`,
          formatRiskLabel(rec),
          formatDocumentCell(docByType.commercial_license),
          formatDocumentCell(docByType.bola_inspection),
          formatDocumentCell(docByType.third_party_insurance),
          formatDocumentCell(docByType.tin_clearance),
          `${auditNotes}${noticeLine}`,
        ];
      }),
      columnStyles: {
        0: { cellWidth: 7, halign: 'right', font: 'courier' },
        1: { cellWidth: 33 },
        2: { cellWidth: 31 },
        3: { cellWidth: 16, halign: 'right', font: 'courier', fontStyle: 'bold' },
        4: { cellWidth: 23, fontStyle: 'bold' },
        5: { cellWidth: 29, font: 'courier' },
        6: { cellWidth: 29, font: 'courier' },
        7: { cellWidth: 29, font: 'courier' },
        8: { cellWidth: 29, font: 'courier' },
        9: { cellWidth: 43 },
      },
      didParseCell: (hookData) => {
        if (hookData.section !== 'body') return;
        const rowRecord = records[hookData.row.index];
        if (!rowRecord) return;

        if (hookData.column.index === 4) {
          if (rowRecord.hasExpiredDocument) {
            hookData.cell.styles.textColor = [190, 18, 60];
            hookData.cell.styles.fillColor = [255, 241, 242];
          } else if (rowRecord.flaggedWithin30Days) {
            hookData.cell.styles.textColor = [180, 83, 9];
            hookData.cell.styles.fillColor = [255, 251, 235];
          } else {
            hookData.cell.styles.textColor = [4, 120, 87];
          }
        }

        const docColumnMap: Record<number, DriverDocumentType> = {
          5: 'commercial_license',
          6: 'bola_inspection',
          7: 'third_party_insurance',
          8: 'tin_clearance',
        };
        const targetDocType = docColumnMap[hookData.column.index];
        if (targetDocType) {
          const matchedDoc = rowRecord.documents.find((d) => d.docType === targetDocType);
          if (matchedDoc?.expiryState === 'expired') {
            hookData.cell.styles.textColor = [190, 18, 60];
            hookData.cell.styles.fillColor = [255, 241, 242];
          } else if (matchedDoc?.expiryState === 'expiring_within_30d') {
            hookData.cell.styles.textColor = [146, 64, 14];
            hookData.cell.styles.fillColor = [255, 251, 235];
          }
        }
      },
    });

    cursorY = getLastTableFinalY(doc, cursorY + 30) + 8;
  }

  drawSignOffSection(doc, cursorY, auditRef, userRole, timestampLabel);
  applyPageFooters(doc, auditRef, timestampLabel);

  const dateSlug = timestampLabel.slice(0, 10);
  const fileName = `afronala_driver_compliance_report_${dateSlug}.pdf`;
  doc.save(fileName);

  return { fileName, auditRef };
}

export function exportSingleDriverCompliancePdf(
  record: DriverDocumentComplianceRecord,
  userRole: string
): { fileName: string; auditRef: string } {
  const now = new Date();
  const auditRef = buildAuditReference('AUD-DRV', now);
  const timestampLabel = formatReadableTimestamp(now);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 28, pageWidth, 1.4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  doc.text('INDIVIDUAL DRIVER STATUTORY COMPLIANCE DOSSIER', 14, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'AfroNala Fleet Governance | Addis Ababa City Transport Bureau Offline Verification Sheet',
    14,
    17.5
  );
  doc.text(
    `Ref: ${auditRef}  |  Generated: ${timestampLabel}  |  Auditor Role: ${sanitizePdfText(userRole)}`,
    14,
    23
  );

  // Driver Profile & Score Summary Box
  const boxY = 35;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, boxY, pageWidth - 28, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizePdfText(record.driverName), 18, boxY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Phone: ${sanitizePdfText(record.phone)}`, 18, boxY + 13.5);
  doc.text(
    `Assigned Vehicle: ${sanitizePdfText(record.vehiclePlate)} - ${sanitizePdfText(record.vehicleModel)}`,
    18,
    boxY + 19
  );
  doc.text(
    `Dispatch Module: ${record.module === 'truck' ? 'Freight & Logistics' : 'Urban Ride-Hailing'}  |  Status: ${record.driverStatus}  |  Back4App Class: ${record.sourceClass}`,
    18,
    boxY + 24.5
  );

  // Right side score badge inside profile box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('COMPUTED COMPLIANCE SCORE', pageWidth - 18, boxY + 7.5, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(16);
  if (record.hasExpiredDocument) {
    doc.setTextColor(190, 18, 60);
  } else if (record.flaggedWithin30Days) {
    doc.setTextColor(180, 83, 9);
  } else {
    doc.setTextColor(4, 120, 87);
  }
  doc.text(`${record.complianceScore} / 100`, pageWidth - 18, boxY + 16, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text(formatRiskLabel(record), pageWidth - 18, boxY + 23, { align: 'right' });

  // Statutory Credentials Table
  let cursorY = boxY + 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. STATUTORY CREDENTIAL EXPIRATION AUDIT (30-DAY THRESHOLD)', 14, cursorY);

  autoTable(doc, {
    startY: cursorY + 2.5,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 2.5,
    },
    head: [
      [
        'Statutory Credential',
        'Document ID',
        'Max Weight',
        'Expiry Date',
        'Window Status',
        'Deduction',
        'Physical Check',
      ],
    ],
    body: record.documents.map((d) => [
      sanitizePdfText(d.label),
      sanitizePdfText(d.documentNumber),
      `${d.maxWeight} pts`,
      d.expiresAt,
      d.daysRemaining < 0
        ? `OVERDUE (${Math.abs(d.daysRemaining)}d ago)`
        : d.daysRemaining <= EXPIRY_WARNING_WINDOW_DAYS
        ? `FLAGGED (${d.daysRemaining}d left)`
        : `VALID (${d.daysRemaining}d left)`,
      d.pointDeduction > 0 ? `-${d.pointDeduction} pts` : '0 pts',
      '[   ] Sighted',
    ]),
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold' },
      1: { cellWidth: 28, font: 'courier' },
      2: { cellWidth: 20, halign: 'right', font: 'courier' },
      3: { cellWidth: 24, font: 'courier' },
      4: { cellWidth: 32, fontStyle: 'bold' },
      5: { cellWidth: 19, halign: 'right', font: 'courier' },
      6: { cellWidth: 15 },
    },
    didParseCell: (hookData) => {
      if (hookData.section !== 'body') return;
      const item = record.documents[hookData.row.index];
      if (!item) return;
      if (hookData.column.index === 4 || hookData.column.index === 5) {
        if (item.expiryState === 'expired') {
          hookData.cell.styles.textColor = [190, 18, 60];
        } else if (item.expiryState === 'expiring_within_30d') {
          hookData.cell.styles.textColor = [180, 83, 9];
        } else if (hookData.column.index === 4) {
          hookData.cell.styles.textColor = [4, 120, 87];
        }
      }
    },
  });

  cursorY = getLastTableFinalY(doc, cursorY + 45) + 9;

  // Risk Deductions Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. AUTOMATED COMPLIANCE DEDUCTIONS & NOTIFICATION HISTORY', 14, cursorY);

  if (record.deductions.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(4, 120, 87);
    doc.text(
      'Base 100/100 score preserved - zero credentials within the 30-day renewal window and zero overdue items.',
      14,
      cursorY + 6.5
    );
    cursorY += 15;
  } else {
    autoTable(doc, {
      startY: cursorY + 2.5,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [15, 23, 42],
      },
      head: [['Severity', 'Risk Factor / Deduction Basis', 'Points Deducted']],
      body: record.deductions.map((ded) => [
        ded.severity.toUpperCase(),
        sanitizePdfText(ded.reason),
        `-${ded.points} pts`,
      ]),
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        1: { cellWidth: 126 },
        2: { cellWidth: 28, halign: 'right', font: 'courier', fontStyle: 'bold' },
      },
    });
    cursorY = getLastTableFinalY(doc, cursorY + 25) + 7;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Last Compliance Renewal Notice Dispatched: ${
      record.complianceNoticeSentAt
        ? sanitizePdfText(record.complianceNoticeSentAt)
        : 'No notice recorded in current session'
    }`,
    14,
    cursorY
  );

  drawSignOffSection(doc, cursorY + 9, auditRef, userRole, timestampLabel);
  applyPageFooters(doc, auditRef, timestampLabel);

  const safePlate = record.vehiclePlate.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const fileName = `afronala_driver_dossier_${safePlate}_${timestampLabel.slice(0, 10)}.pdf`;
  doc.save(fileName);

  return { fileName, auditRef };
}

export function exportTripTariffCompliancePdf(options: TripTariffPdfOptions): {
  fileName: string;
  auditRef: string;
} {
  const { records, userRole, statusFilterLabel, searchQuery, summary } = options;
  const now = new Date();
  const auditRef = buildAuditReference('AUD-TRF', now);
  const timestampLabel = formatReadableTimestamp(now);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 27, 'F');
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 27, pageWidth, 1.4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text('AFRONALA FLEET OPERATIONS - TRIP FUEL & MUNICIPAL TARIFF AUDIT', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Directive 2026/04 Municipal Tariff Schedule | Addis Ababa Retail Fuel Benchmark: ETB ${PUMP_PRICE_ETB_PER_LITER.toFixed(2)} / Liter`,
    14,
    17
  );

  const filterDesc = [
    `Filter: ${sanitizePdfText(statusFilterLabel)}`,
    `Exported Trips: ${records.length}`,
    `Sedan Cap: ETB ${VEHICLE_FUEL_STANDARDS.sedan.maxRatePerKmETB}/km`,
    `Minibus Cap: ETB ${VEHICLE_FUEL_STANDARDS.minibus.maxRatePerKmETB}/km`,
    `Truck Cap: ETB ${VEHICLE_FUEL_STANDARDS.cargo_truck.maxRatePerKmETB}/km`,
  ];
  if (searchQuery && searchQuery.trim()) {
    filterDesc.push(`Search: "${sanitizePdfText(searchQuery.trim())}"`);
  }
  doc.setFontSize(7.8);
  doc.setTextColor(148, 163, 184);
  doc.text(filterDesc.join('  |  '), 14, 22.8);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(103, 232, 249);
  doc.text(`REF: ${auditRef}`, pageWidth - 14, 10.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Issued: ${timestampLabel}`, pageWidth - 14, 16.5, { align: 'right' });
  doc.text(`Auditor Role: ${sanitizePdfText(userRole)}`, pageWidth - 14, 22.5, {
    align: 'right',
  });

  // KPI Summary Boxes
  const kpiY = 33;
  const kpiGap = 4;
  const kpiWidth = (pageWidth - 28 - kpiGap * 3) / 4;
  const kpis = [
    {
      label: 'TARIFF COMPLIANCE RATE',
      value: `${summary.complianceRate}%`,
      sub: `${summary.violationsCount} ceiling breach(es) across ${summary.totalTrips} trips`,
    },
    {
      label: 'FLEET FUEL CONSUMED',
      value: `${summary.totalFuelLiters} L`,
      sub: `Estimated pump cost: ETB ${summary.totalFuelCostETB.toLocaleString()}`,
    },
    {
      label: 'ESTIMATED CO2 FOOTPRINT',
      value: `${summary.totalCo2Kg} kg`,
      sub: 'UNEP regional urban & freight benchmark',
    },
    {
      label: 'TOTAL AUDITED TRIPS',
      value: `${records.length}`,
      sub: 'Included in offline audit export',
    },
  ];

  kpis.forEach((k, idx) => {
    const x = 14 + idx * (kpiWidth + kpiGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, kpiY, kpiWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(k.label, x + 3.5, kpiY + 5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(k.value, x + 3.5, kpiY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(k.sub, x + 3.5, kpiY + 15.8);
  });

  autoTable(doc, {
    startY: kpiY + 23,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      valign: 'top',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    head: [
      [
        'Trip ID',
        'Vehicle & Driver',
        'Route Corridor & Distance',
        'Fuel Burn',
        'Fuel Cost',
        'CO2 (kg)',
        'Actual Fare',
        'Legal Max',
        'Status & Notes',
      ],
    ],
    body: records.map((r) => [
      sanitizePdfText(r.tripId),
      `${sanitizePdfText(r.vehiclePlate)} (${r.vehicleType})\n${sanitizePdfText(r.vehicleModel)}\nDriver: ${sanitizePdfText(r.driverName)}`,
      `${sanitizePdfText(r.routeCorridor)}\n${r.distanceKm} km | ${r.durationMin} min | ${sanitizePdfText(r.date)}`,
      `${r.estimatedFuelLiters} L`,
      `ETB ${r.fuelCostETB.toFixed(2)}`,
      `${r.co2Kg} kg`,
      `ETB ${r.actualFareETB.toFixed(2)}`,
      `ETB ${r.legalMaxFareETB.toFixed(2)}`,
      `${r.complianceStatus === 'compliant' ? 'COMPLIANT' : 'TARIFF EXCEEDED'}\n${sanitizePdfText(r.notes)}`,
    ]),
    columnStyles: {
      0: { cellWidth: 19, font: 'courier', fontStyle: 'bold' },
      1: { cellWidth: 40 },
      2: { cellWidth: 54 },
      3: { cellWidth: 18, halign: 'right', font: 'courier' },
      4: { cellWidth: 23, halign: 'right', font: 'courier' },
      5: { cellWidth: 17, halign: 'right', font: 'courier' },
      6: { cellWidth: 24, halign: 'right', font: 'courier', fontStyle: 'bold' },
      7: { cellWidth: 24, halign: 'right', font: 'courier' },
      8: { cellWidth: 50 },
    },
    didParseCell: (hookData) => {
      if (hookData.section !== 'body') return;
      const row = records[hookData.row.index];
      if (!row) return;
      if (hookData.column.index === 8 && row.complianceStatus !== 'compliant') {
        hookData.cell.styles.textColor = [190, 18, 60];
        hookData.cell.styles.fillColor = [255, 241, 242];
      }
    },
  });

  const finalY = getLastTableFinalY(doc, kpiY + 55) + 8;
  drawSignOffSection(doc, finalY, auditRef, userRole, timestampLabel);
  applyPageFooters(doc, auditRef, timestampLabel);

  const fileName = `afronala_trip_tariff_audit_${timestampLabel.slice(0, 10)}.pdf`;
  doc.save(fileName);

  return { fileName, auditRef };
}
