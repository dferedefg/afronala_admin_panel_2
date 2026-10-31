import fs from 'fs';
import path from 'path';
import { generateAllBack4AppCsvs, TARGET_DIR } from './generateBack4AppCsvs.ts';

export interface InferredField {
  name: string;
  type: 'String' | 'Number' | 'Boolean' | 'Date' | 'GeoPoint' | 'Pointer' | 'Array' | 'Object (JSON)';
  pointerTarget?: string;
  nonNullCount: number;
  uniqueCount: number;
  sampleValues: any[];
}

export interface ClassPointerRel {
  sourceColumn: string;
  targetClass: string;
  sampleObjectId?: string;
}

export interface Back4AppClassSummary {
  className: string;
  fileName: string;
  recordCount: number;
  columnCount: number;
  category: 'Identity' | 'Customer' | 'Mobility (Ride)' | 'Logistics (Truck)';
  primaryFunction: string;
  columns: InferredField[];
  outgoingPointers: ClassPointerRel[];
  incomingPointers: { sourceClass: string; sourceColumn: string }[];
  fileSizeBytes: number;
  lastModifiedIso: string;
  countryCounts?: Record<string, number>;
}

export interface Back4AppClassesManifest {
  scannedAt: string;
  totalClasses: number;
  totalRecords: number;
  classesDirectory: string;
  classes: Back4AppClassSummary[];
  pointerTopology: {
    nodes: { id: string; label: string; category: string; records: number }[];
    edges: { source: string; target: string; via: string; label: string }[];
  };
}

const CLASSES_DIR = TARGET_DIR;

const CLASS_METADATA_MAP: Record<string, { category: Back4AppClassSummary['category']; primaryFunction: string }> = {
  _User: {
    category: 'Identity',
    primaryFunction: 'Core authentication, single-identity multi-role accounts across all 8 East African countries (roleCodes: ["customer", "driver", "truckOwner", "rideOwner", "truckDispatcher"]), contact verification, and nested roleData.',
  },
  Customer: {
    category: 'Customer',
    primaryFunction: 'Directory of passenger riders and enterprise freight shippers across East Africa, preferred payment terms (Telebirr, M-PESA, MoMo, etc.), national tax IDs (KRA, URA, RRA, TRA, etc.), and ratings.',
  },
  Driver: {
    category: 'Mobility (Ride)',
    primaryFunction: 'Universal fleet operators across East African corridors. Dual-service mode (activeServiceMode: "ride" or "truck"), live GPS GeoPoint, CDL licenses, assigned vehicle pointers, and status.',
  },
  RideDriver: {
    category: 'Mobility (Ride)',
    primaryFunction: 'Commercial fleet driver contractor bindings linking drivers with RideOwner entities across East Africa, statutory commission splits (e.g. 90/10 NTSA, 85/15 Standard), and licensing.',
  },
  RideOwner: {
    category: 'Mobility (Ride)',
    primaryFunction: 'Taxi and city ride fleet owners managing driver fleets, vehicle allocations, operating licenses, business TINs, and localized payouts.',
  },
  TruckDispatcher: {
    category: 'Logistics (Truck)',
    primaryFunction: 'Regional freight logistics coordinators authorized across East African border gateways (Modjo, Mombasa, Malaba, KLP, Kurasini, Doraleh, Mogadishu, Nimule) to supervise manifests.',
  },
  TruckOwner: {
    category: 'Logistics (Truck)',
    primaryFunction: 'Commercial heavy freight carriers, carrier service configurations (DOT / transit permits, insurance policies), and multi-truck fleet rosters across all 8 nations.',
  },
};

/**
 * Standard RFC-4180 CSV parser handling multiline records and embedded quotes
 */
function parseCsv(content: string): { headers: string[]; rows: Record<string, any>[] } {
  const lines: string[][] = [];
  let row: string[] = [];
  let token = '';
  let insideQuote = false;

  const len = content.length;
  for (let i = 0; i < len; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        token += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push(token);
      token = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(token);
      token = '';
      if (row.length > 0 && row.some((field) => field.trim().length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      token += char;
    }
  }

  if (token.length > 0 || row.length > 0) {
    row.push(token);
    if (row.some((field) => field.trim().length > 0)) {
      lines.push(row);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].map((h) => h.trim());
  const rows: Record<string, any>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rawRow = lines[r];
    const item: Record<string, any> = {};
    for (let c = 0; c < headers.length; c++) {
      const colName = headers[c];
      const val = rawRow[c] !== undefined ? rawRow[c] : '';
      item[colName] = val;
    }
    rows.push(item);
  }

  return { headers, rows };
}

/**
 * Infer Back4App Parse type from sample values
 */
function inferParseType(
  columnName: string,
  values: any[]
): { type: InferredField['type']; pointerTarget?: string } {
  const nonNull = values.filter((v) => v !== '' && v !== null && v !== undefined);
  if (nonNull.length === 0) return { type: 'String' };

  // 1. Check for Pointer signature or pointer column names
  for (const v of nonNull) {
    if (typeof v === 'string' && v.trim().startsWith('{') && v.includes('"__type"') && v.includes('"Pointer"')) {
      try {
        const parsed = JSON.parse(v);
        if (parsed.__type === 'Pointer' && parsed.className) {
          return { type: 'Pointer', pointerTarget: parsed.className };
        }
      } catch {
        // ignore
      }
    }
  }

  if (columnName === 'user' || columnName === 'ownerUserId' || columnName === 'driverUserId') {
    return { type: 'Pointer', pointerTarget: '_User' };
  }
  if (columnName === 'driver') {
    return { type: 'Pointer', pointerTarget: 'Driver' };
  }
  if (columnName === 'rideOwner' || columnName === 'rideOwnerId') {
    return { type: 'Pointer', pointerTarget: 'RideOwner' };
  }
  if (columnName === 'truckOwner' || columnName === 'truckOwnerId') {
    return { type: 'Pointer', pointerTarget: 'TruckOwner' };
  }
  if (columnName === 'assignedVehicleId' || columnName === 'assignedTruckId') {
    return { type: 'Pointer', pointerTarget: 'Vehicle' };
  }

  // 2. Check for GeoPoint signature
  for (const v of nonNull) {
    if (typeof v === 'string' && v.trim().startsWith('{') && v.includes('"__type"') && v.includes('"GeoPoint"')) {
      return { type: 'GeoPoint' };
    }
  }
  if (columnName.toLowerCase().includes('location') || columnName.toLowerCase().includes('coordinates')) {
    return { type: 'GeoPoint' };
  }

  // 3. Check for Date signature
  const isDate = nonNull.every((v) => {
    if (typeof v !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/.test(v.trim());
  });
  if (isDate) {
    return { type: 'Date' };
  }
  if (
    columnName.toLowerCase().endsWith('at') ||
    columnName.toLowerCase().endsWith('date') ||
    columnName === 'lastLoginAt' ||
    columnName === 'createdAt' ||
    columnName === 'updatedAt'
  ) {
    return { type: 'Date' };
  }

  // 4. Check for JSON Array
  const isArray = nonNull.every((v) => {
    if (typeof v !== 'string') return false;
    const trimmed = v.trim();
    return trimmed.startsWith('[') && trimmed.endsWith(']');
  });
  if (isArray) {
    return { type: 'Array' };
  }

  // 5. Check for JSON Object
  const isObject = nonNull.every((v) => {
    if (typeof v !== 'string') return false;
    const trimmed = v.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
  });
  if (isObject) {
    return { type: 'Object (JSON)' };
  }

  // 6. Check for Boolean
  const isBool = nonNull.every((v) => {
    const s = String(v).toLowerCase().trim();
    return s === 'true' || s === 'false';
  });
  if (isBool) {
    return { type: 'Boolean' };
  }

  // 7. Check for Number
  const isNum = nonNull.every((v) => {
    return !isNaN(Number(v)) && String(v).trim() !== '';
  });
  if (
    isNum &&
    !columnName.toLowerCase().includes('phone') &&
    !columnName.toLowerCase().includes('id') &&
    !columnName.toLowerCase().includes('plate') &&
    !columnName.toLowerCase().includes('tin') &&
    !columnName.toLowerCase().includes('code')
  ) {
    return { type: 'Number' };
  }

  return { type: 'String' };
}

// In-memory cache
let cachedManifest: Back4AppClassesManifest | null = null;
const cachedClassRecords: Map<string, { rows: Record<string, any>[]; summary: Back4AppClassSummary }> = new Map();

export function inferRecordCountry(r: Record<string, any>): string {
  if (r.countryCode) return String(r.countryCode).toUpperCase();
  if (r.operatingCountry) {
    const c = String(r.operatingCountry).toLowerCase();
    if (c.includes('ethiopia')) return 'ET';
    if (c.includes('kenya')) return 'KE';
    if (c.includes('uganda')) return 'UG';
    if (c.includes('rwanda')) return 'RW';
    if (c.includes('tanzania')) return 'TZ';
    if (c.includes('djibouti')) return 'DJ';
    if (c.includes('somalia')) return 'SO';
    if (c.includes('south sudan')) return 'SS';
  }
  if (r.country) {
    const c = String(r.country).toLowerCase();
    if (c.includes('ethiopia')) return 'ET';
    if (c.includes('kenya')) return 'KE';
    if (c.includes('uganda')) return 'UG';
    if (c.includes('rwanda')) return 'RW';
    if (c.includes('tanzania')) return 'TZ';
    if (c.includes('djibouti')) return 'DJ';
    if (c.includes('somalia')) return 'SO';
    if (c.includes('south sudan')) return 'SS';
  }
  if (r.phone) {
    const p = String(r.phone);
    if (p.startsWith('+251') || p.startsWith('091')) return 'ET';
    if (p.startsWith('+254')) return 'KE';
    if (p.startsWith('+256')) return 'UG';
    if (p.startsWith('+250')) return 'RW';
    if (p.startsWith('+255')) return 'TZ';
    if (p.startsWith('+253')) return 'DJ';
    if (p.startsWith('+252')) return 'SO';
    if (p.startsWith('+211')) return 'SS';
  }
  return 'ET';
}

export function inspectBack4AppClasses(): Back4AppClassesManifest {
  if (cachedManifest) {
    return cachedManifest;
  }

  if (!fs.existsSync(CLASSES_DIR)) {
    fs.mkdirSync(CLASSES_DIR, { recursive: true });
  }

  let files = fs.readdirSync(CLASSES_DIR).filter((f) => f.endsWith('.csv'));

  // Ensure all 7 classes exist with complete East African multi-country data
  if (files.length < 7) {
    generateAllBack4AppCsvs();
    files = fs.readdirSync(CLASSES_DIR).filter((f) => f.endsWith('.csv'));
  }

  const summaries: Back4AppClassSummary[] = [];
  let totalRecords = 0;

  for (const file of files) {
    const className = file.replace(/\.csv$/, '');
    const filePath = path.join(CLASSES_DIR, file);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const { headers, rows } = parseCsv(content);

    totalRecords += rows.length;

    // Count records per country
    const countryCounts: Record<string, number> = {
      ALL: rows.length,
      ET: 0,
      KE: 0,
      UG: 0,
      RW: 0,
      TZ: 0,
      DJ: 0,
      SO: 0,
      SS: 0,
    };

    for (const r of rows) {
      const code = inferRecordCountry(r);
      countryCounts[code] = (countryCounts[code] || 0) + 1;
    }

    const columns: InferredField[] = headers.map((header) => {
      const colValues = rows.map((r) => r[header]);
      const nonNull = colValues.filter((v) => v !== '' && v !== null && v !== undefined);
      const uniqueVals = Array.from(new Set(colValues));
      const { type, pointerTarget } = inferParseType(header, colValues);

      return {
        name: header,
        type,
        pointerTarget,
        nonNullCount: nonNull.length,
        uniqueCount: uniqueVals.length,
        sampleValues: nonNull.slice(0, 3),
      };
    });

    const outgoingPointers: ClassPointerRel[] = [];
    for (const col of columns) {
      if (col.type === 'Pointer' && col.pointerTarget) {
        outgoingPointers.push({
          sourceColumn: col.name,
          targetClass: col.pointerTarget,
        });
      }
    }

    const meta = CLASS_METADATA_MAP[className] || {
      category: 'Identity',
      primaryFunction: `Back4App Parse database class ${className}`,
    };

    const summary: Back4AppClassSummary = {
      className,
      fileName: file,
      recordCount: rows.length,
      columnCount: headers.length,
      category: meta.category,
      primaryFunction: meta.primaryFunction,
      columns,
      outgoingPointers,
      incomingPointers: [],
      fileSizeBytes: stat.size,
      lastModifiedIso: stat.mtime.toISOString(),
      countryCounts,
    };

    summaries.push(summary);
    cachedClassRecords.set(className, { rows, summary });
  }

  // Populate incoming pointers across classes
  for (const targetSummary of summaries) {
    for (const sourceSummary of summaries) {
      for (const ptr of sourceSummary.outgoingPointers) {
        if (ptr.targetClass === targetSummary.className) {
          targetSummary.incomingPointers.push({
            sourceClass: sourceSummary.className,
            sourceColumn: ptr.sourceColumn,
          });
        }
      }
    }
  }

  // Build Topology graph
  const nodes = summaries.map((s) => ({
    id: s.className,
    label: s.className,
    category: s.category,
    records: s.recordCount,
  }));

  // Also include Vehicle virtual node if referenced
  if (!nodes.some((n) => n.id === 'Vehicle')) {
    nodes.push({
      id: 'Vehicle',
      label: 'Vehicle (Auto/Truck)',
      category: 'Mobility (Ride)',
      records: 24,
    });
  }

  const edges: { source: string; target: string; via: string; label: string }[] = [];
  for (const s of summaries) {
    for (const ptr of s.outgoingPointers) {
      edges.push({
        source: s.className,
        target: ptr.targetClass,
        via: ptr.sourceColumn,
        label: `${s.className}.${ptr.sourceColumn} → ${ptr.targetClass}`,
      });
    }
  }

  // Sort summaries in preferred architectural order
  const order = ['_User', 'Customer', 'Driver', 'RideDriver', 'RideOwner', 'TruckDispatcher', 'TruckOwner'];
  summaries.sort((a, b) => {
    const ia = order.indexOf(a.className);
    const ib = order.indexOf(b.className);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.className.localeCompare(b.className);
  });

  cachedManifest = {
    scannedAt: new Date().toISOString(),
    totalClasses: summaries.length,
    totalRecords,
    classesDirectory: 'back4app_cloud_code/back4app_classes',
    classes: summaries,
    pointerTopology: {
      nodes,
      edges,
    },
  };

  return cachedManifest;
}

export function getBack4AppClassRecords(
  className: string,
  countryFilter?: string
): {
  summary: Back4AppClassSummary;
  records: Record<string, any>[];
  countryBreakdown: Record<string, number>;
} {
  inspectBack4AppClasses();
  const entry = cachedClassRecords.get(className);
  if (!entry) {
    throw new Error(`Back4App Parse class "${className}" not found in uploaded classes.`);
  }

  const breakdown: Record<string, number> = {
    ALL: entry.rows.length,
    ET: 0,
    KE: 0,
    UG: 0,
    RW: 0,
    TZ: 0,
    DJ: 0,
    SO: 0,
    SS: 0,
  };

  for (const r of entry.rows) {
    const code = inferRecordCountry(r);
    breakdown[code] = (breakdown[code] || 0) + 1;
  }

  let finalRows = entry.rows;
  if (countryFilter && countryFilter !== 'ALL') {
    const target = countryFilter.toUpperCase();
    finalRows = entry.rows.filter((r) => inferRecordCountry(r) === target);
  }

  return {
    summary: entry.summary,
    records: finalRows,
    countryBreakdown: breakdown,
  };
}

export function rescanBack4AppClasses(): Back4AppClassesManifest {
  cachedManifest = null;
  cachedClassRecords.clear();
  return inspectBack4AppClasses();
}
