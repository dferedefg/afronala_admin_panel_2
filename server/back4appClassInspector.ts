import fs from 'fs';
import path from 'path';

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

const CLASSES_DIR = path.resolve(process.cwd(), 'back4app_cloud_code/back4app_classes');

const CLASS_METADATA_MAP: Record<string, { category: Back4AppClassSummary['category']; primaryFunction: string }> = {
  _User: {
    category: 'Identity',
    primaryFunction: 'Core authentication, single-identity multi-role accounts (roleCodes: ["customer", "driver", "truckOwner", "rideOwner"]), contact verification, and nested roleData.',
  },
  Customer: {
    category: 'Customer',
    primaryFunction: 'Directory of passenger riders and freight shippers (individual vs corporate), preferred payment terms (cash/telebirr), loyalty points, and ratings.',
  },
  Driver: {
    category: 'Mobility (Ride)',
    primaryFunction: 'Universal fleet operators. Dual-service mode (activeServiceMode: "ride" or "truck"), live GPS GeoPoint, CDL licenses, assigned vehicle pointers, and status.',
  },
  RideDriver: {
    category: 'Mobility (Ride)',
    primaryFunction: 'Commercial fleet driver contractor bindings linking drivers with RideOwner entities, revenue commission splits (e.g., 80/20 or 100%), and invitation timelines.',
  },
  RideOwner: {
    category: 'Mobility (Ride)',
    primaryFunction: 'Taxi and city ride fleet owners managing driver fleets, vehicle allocations, operating licenses, business TINs, and aggregated payouts.',
  },
  TruckDispatcher: {
    category: 'Logistics (Truck)',
    primaryFunction: 'Regional freight logistics coordinators authorized to allocate cargo waybills, assign drivers to corridors, and supervise transport manifests.',
  },
  TruckOwner: {
    category: 'Logistics (Truck)',
    primaryFunction: 'Commercial heavy freight carriers, carrier service configurations (DOT / MC numbers, insurance policies), and multi-truck fleet rosters.',
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
  if (columnName === 'rideOwnerId') {
    return { type: 'Pointer', pointerTarget: 'RideOwner' };
  }
  if (columnName === 'truckOwnerId') {
    return { type: 'Pointer', pointerTarget: 'TruckOwner' };
  }
  if (columnName === 'assignedVehicleId' || columnName === 'assignedTruckId') {
    return { type: 'Pointer', pointerTarget: 'Vehicle' };
  }

  // 2. Check for GeoPoint signature
  for (const v of nonNull) {
    if (typeof v === 'string' && v.trim().startsWith('{') && (v.includes('"GeoPoint"') || (v.includes('latitude') && v.includes('longitude')))) {
      try {
        const parsed = JSON.parse(v);
        if (parsed.__type === 'GeoPoint' || (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number')) {
          return { type: 'GeoPoint' };
        }
      } catch {
        // ignore
      }
    }
  }

  // 3. Check for Array
  let arrayMatchCount = 0;
  for (const v of nonNull) {
    if (typeof v === 'string' && v.trim().startsWith('[') && v.trim().endsWith(']')) {
      arrayMatchCount++;
    }
  }
  if (arrayMatchCount > 0 && arrayMatchCount === nonNull.length) {
    return { type: 'Array' };
  }

  // 4. Check for Object (JSON)
  let objMatchCount = 0;
  for (const v of nonNull) {
    if (typeof v === 'string' && v.trim().startsWith('{') && v.trim().endsWith('}')) {
      objMatchCount++;
    }
  }
  if (objMatchCount > 0 && objMatchCount === nonNull.length) {
    return { type: 'Object (JSON)' };
  }

  // 5. Check for Boolean
  const isBool = nonNull.every((v) => {
    const s = String(v).trim().toLowerCase();
    return s === 'true' || s === 'false';
  });
  if (isBool) return { type: 'Boolean' };

  // 6. Check for Date
  const isDate = nonNull.every((v) => {
    const s = String(v).trim();
    if (s.length >= 19 && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
      return !isNaN(Date.parse(s));
    }
    return false;
  });
  if (isDate) return { type: 'Date' };

  // 7. Check for Number
  const isNum = nonNull.every((v) => {
    const s = String(v).trim();
    return !isNaN(Number(s)) && s !== '';
  });
  if (isNum && !columnName.toLowerCase().includes('phone') && !columnName.toLowerCase().includes('id') && !columnName.toLowerCase().includes('plate') && !columnName.toLowerCase().includes('tin')) {
    return { type: 'Number' };
  }

  return { type: 'String' };
}

// In-memory cache
let cachedManifest: Back4AppClassesManifest | null = null;
const cachedClassRecords: Map<string, { rows: Record<string, any>[]; summary: Back4AppClassSummary }> = new Map();

export function inspectBack4AppClasses(): Back4AppClassesManifest {
  if (cachedManifest) {
    return cachedManifest;
  }

  if (!fs.existsSync(CLASSES_DIR)) {
    fs.mkdirSync(CLASSES_DIR, { recursive: true });
  }

  const files = fs.readdirSync(CLASSES_DIR).filter((f) => f.endsWith('.csv'));
  const summaries: Back4AppClassSummary[] = [];
  let totalRecords = 0;

  for (const file of files) {
    const className = file.replace(/\.csv$/, '');
    const filePath = path.join(CLASSES_DIR, file);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const { headers, rows } = parseCsv(content);

    totalRecords += rows.length;

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

export function getBack4AppClassRecords(className: string): {
  summary: Back4AppClassSummary;
  records: Record<string, any>[];
} {
  inspectBack4AppClasses();
  const entry = cachedClassRecords.get(className);
  if (!entry) {
    throw new Error(`Back4App Parse class "${className}" not found in uploaded classes.`);
  }
  return {
    summary: entry.summary,
    records: entry.rows,
  };
}

export function rescanBack4AppClasses(): Back4AppClassesManifest {
  cachedManifest = null;
  cachedClassRecords.clear();
  return inspectBack4AppClasses();
}
