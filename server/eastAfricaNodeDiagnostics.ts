import type {
  EastAfricaCountryCode,
  EastAfricaCountryNodeTelemetry,
  EastAfricaNodeDiagnosticSummary,
} from '../src/types/index.ts';

export interface EastAfricaCountryProfile {
  code: Exclude<EastAfricaCountryCode, 'ALL'>;
  name: string;
  flag: string;
  capital: string;
  currency: 'ETB' | 'KES' | 'UGX' | 'RWF' | 'TZS' | 'DJF' | 'USD' | 'SSP';
  edgeNode: string;
  baseLatencyMs: number;
  regulator: {
    name: string;
    acronym: string;
    monitored: string;
  };
  paymentGateway: {
    name: string;
    provider: string;
  };
  corridor: {
    name: string;
    avgSpeed: number;
    activeTrucks: number;
  };
  telecomCarriers: {
    name: string;
    type: string;
    signalStatus: 'excellent' | 'good' | 'congested';
    pingMs: number;
  }[];
  activeDriversBaseline: number;
  onlineVehiclesBaseline: number;
  openJobsBaseline: number;
  apkVersion: string;
}

export const EAST_AFRICA_COUNTRY_PROFILES: Record<
  Exclude<EastAfricaCountryCode, 'ALL'>,
  EastAfricaCountryProfile
> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    capital: 'Addis Ababa',
    currency: 'ETB',
    edgeNode: 'addis-hub.east1.afronala.internal',
    baseLatencyMs: 34,
    regulator: {
      name: 'Federal Transport Authority & Ministry of Innovation and Technology',
      acronym: 'FTA / MInT',
      monitored: 'Annual Commercial Bola, Driver TIN, Transport Tariff Grid & Speed Limit Compliance',
    },
    paymentGateway: {
      name: 'Telebirr SuperApp & CBE Birr',
      provider: 'Ethio Telecom & Commercial Bank of Ethiopia',
    },
    corridor: {
      name: 'Addis Ababa - Modjo Dry Port - Galafi / Djibouti Corridor',
      avgSpeed: 52,
      activeTrucks: 84,
    },
    telecomCarriers: [
      { name: 'Ethio Telecom 5G/4G LTE', type: 'National Carrier', signalStatus: 'excellent', pingMs: 24 },
      { name: 'Safaricom Ethiopia 4G', type: 'Private GSM', signalStatus: 'good', pingMs: 38 },
    ],
    activeDriversBaseline: 420,
    onlineVehiclesBaseline: 380,
    openJobsBaseline: 28,
    apkVersion: 'v2.4.2-et',
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    capital: 'Nairobi',
    currency: 'KES',
    edgeNode: 'nairobi-edge.east1.afronala.internal',
    baseLatencyMs: 41,
    regulator: {
      name: 'National Transport and Safety Authority',
      acronym: 'NTSA',
      monitored: 'Speed Limiter Telemetry, PSV Driver Badges, Motor Commercial Inspection & Road Safety Mandate',
    },
    paymentGateway: {
      name: 'Safaricom Daraja M-PESA B2C/C2B',
      provider: 'Safaricom PLC',
    },
    corridor: {
      name: 'Northern Corridor: Mombasa Port - Nairobi SGR - Malaba Border',
      avgSpeed: 64,
      activeTrucks: 112,
    },
    telecomCarriers: [
      { name: 'Safaricom 5G / 4G+', type: 'National Telco', signalStatus: 'excellent', pingMs: 18 },
      { name: 'Airtel Kenya 4G', type: 'GSM Provider', signalStatus: 'good', pingMs: 32 },
    ],
    activeDriversBaseline: 340,
    onlineVehiclesBaseline: 310,
    openJobsBaseline: 34,
    apkVersion: 'v2.4.2-ke',
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    capital: 'Kampala',
    currency: 'UGX',
    edgeNode: 'kampala-edge.east1.afronala.internal',
    baseLatencyMs: 48,
    regulator: {
      name: 'Ministry of Works and Transport',
      acronym: 'MoWT',
      monitored: 'Uganda Driving Permit (UDP) Registry, SafeBoda Commercial PSV & Weighbridge Monitoring',
    },
    paymentGateway: {
      name: 'MTN Mobile Money & Airtel Money UG',
      provider: 'MTN Uganda & Airtel Uganda',
    },
    corridor: {
      name: 'Malaba OSBP - Jinja - Kampala - Katuna Rwanda Link',
      avgSpeed: 48,
      activeTrucks: 58,
    },
    telecomCarriers: [
      { name: 'MTN Uganda 4G LTE', type: 'Mobile Network', signalStatus: 'excellent', pingMs: 26 },
      { name: 'Airtel Uganda 4G', type: 'GSM Provider', signalStatus: 'good', pingMs: 35 },
    ],
    activeDriversBaseline: 215,
    onlineVehiclesBaseline: 190,
    openJobsBaseline: 18,
    apkVersion: 'v2.4.1-ug',
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    capital: 'Kigali',
    currency: 'RWF',
    edgeNode: 'kigali-edge.east1.afronala.internal',
    baseLatencyMs: 44,
    regulator: {
      name: 'Rwanda Utilities Regulatory Authority',
      acronym: 'RURA',
      monitored: 'Commercial Transport Licensing, Axle Load Limits, KLP Customs Electronic Seals',
    },
    paymentGateway: {
      name: 'MTN MoMo Rwanda & Airtel Money RW',
      provider: 'MTN Rwandacell PLC & Airtel',
    },
    corridor: {
      name: 'Rusumo OSBP - Kigali Logistics Platform (KLP) - Rubavu/Goma Link',
      avgSpeed: 55,
      activeTrucks: 46,
    },
    telecomCarriers: [
      { name: 'MTN Rwanda 4G LTE', type: 'Mobile Network', signalStatus: 'excellent', pingMs: 22 },
      { name: 'Airtel Rwanda 4G', type: 'GSM Provider', signalStatus: 'good', pingMs: 30 },
    ],
    activeDriversBaseline: 180,
    onlineVehiclesBaseline: 165,
    openJobsBaseline: 14,
    apkVersion: 'v2.4.2-rw',
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    capital: 'Dodoma / Dar es Salaam',
    currency: 'TZS',
    edgeNode: 'daressalaam-edge.central1.afronala.internal',
    baseLatencyMs: 52,
    regulator: {
      name: 'Land Transport Regulatory Authority',
      acronym: 'LATRA',
      monitored: 'Vehicle Tracking System (VTS), Commercial Carrier Permits & Port Drayage Authorizations',
    },
    paymentGateway: {
      name: 'Vodacom M-Pesa & Tigo Pesa Tanzania',
      provider: 'Vodacom Tanzania PLC & MIC Tanzania',
    },
    corridor: {
      name: 'Central Corridor: Port of Dar es Salaam - Morogoro - Isaka Dry Port',
      avgSpeed: 58,
      activeTrucks: 94,
    },
    telecomCarriers: [
      { name: 'Vodacom Tanzania 4G/5G', type: 'National Carrier', signalStatus: 'excellent', pingMs: 28 },
      { name: 'Tigo Tanzania 4G', type: 'GSM Provider', signalStatus: 'good', pingMs: 36 },
      { name: 'Airtel Tanzania 4G', type: 'GSM Provider', signalStatus: 'good', pingMs: 40 },
    ],
    activeDriversBaseline: 290,
    onlineVehiclesBaseline: 260,
    openJobsBaseline: 24,
    apkVersion: 'v2.4.1-tz',
  },
  DJ: {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    capital: 'Djibouti City',
    currency: 'DJF',
    edgeNode: 'djibouti-port.maritime1.afronala.internal',
    baseLatencyMs: 29,
    regulator: {
      name: 'Djibouti Ports and Free Zones Authority',
      acronym: 'DPFZA',
      monitored: 'Port Container Gate Clearance, Bonded Cargo Seals & Galafi Cross-Border Convoy Manifests',
    },
    paymentGateway: {
      name: 'D-Money Mobile Settlement',
      provider: 'Djibouti Telecom',
    },
    corridor: {
      name: 'Doraleh Multipurpose Port (DMP) - PK12 - Galafi Border (Ethiopia)',
      avgSpeed: 50,
      activeTrucks: 130,
    },
    telecomCarriers: [
      { name: 'Djibouti Telecom 4G+', type: 'National Operator', signalStatus: 'excellent', pingMs: 19 },
    ],
    activeDriversBaseline: 140,
    onlineVehiclesBaseline: 125,
    openJobsBaseline: 31,
    apkVersion: 'v2.4.2-dj',
  },
  SO: {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    capital: 'Mogadishu',
    currency: 'USD',
    edgeNode: 'mogadishu-edge.horn1.afronala.internal',
    baseLatencyMs: 61,
    regulator: {
      name: 'Ministry of Transport and Civil Aviation',
      acronym: 'MOTCA',
      monitored: 'Berbera Corridor Logistics Gateway & Mogadishu Commercial Fleet Registry',
    },
    paymentGateway: {
      name: 'Hormuud EVC Plus & Telesom Zaad',
      provider: 'Hormuud Telecom & Telesom',
    },
    corridor: {
      name: 'Berbera Port - Hargeisa - Tog Wajaale Corridor / Mogadishu K4 Corridor',
      avgSpeed: 45,
      activeTrucks: 38,
    },
    telecomCarriers: [
      { name: 'Hormuud Telecom 4G', type: 'Telecom Operator', signalStatus: 'excellent', pingMs: 32 },
      { name: 'Telesom Somaliland 4G', type: 'Regional Telco', signalStatus: 'good', pingMs: 44 },
    ],
    activeDriversBaseline: 110,
    onlineVehiclesBaseline: 95,
    openJobsBaseline: 12,
    apkVersion: 'v2.4.0-so',
  },
  SS: {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    capital: 'Juba',
    currency: 'SSP',
    edgeNode: 'juba-relay.north1.afronala.internal',
    baseLatencyMs: 78,
    regulator: {
      name: 'South Sudan National Revenue Authority & Traffic Directorate',
      acronym: 'NRA / Traffic',
      monitored: 'Nimule Border Customs Escort, Fuel Tanker Manifests & River Barge Clearance',
    },
    paymentGateway: {
      name: 'm-GURUSH Mobile Money',
      provider: 'Trinity Technologies & Zain',
    },
    corridor: {
      name: 'Nimule Border (Uganda) - Juba Highway Lifeline Corridor',
      avgSpeed: 42,
      activeTrucks: 41,
    },
    telecomCarriers: [
      { name: 'Zain South Sudan 4G', type: 'Mobile Network', signalStatus: 'good', pingMs: 65 },
      { name: 'MTN South Sudan 3G/4G', type: 'Mobile Network', signalStatus: 'good', pingMs: 72 },
    ],
    activeDriversBaseline: 90,
    onlineVehiclesBaseline: 80,
    openJobsBaseline: 9,
    apkVersion: 'v2.4.0-ss',
  },
};

export function getCountryNodeTelemetry(
  rawCountryCode: string | undefined,
  handshakeLatencyMs: number,
  handshakeOk: boolean
): EastAfricaCountryNodeTelemetry {
  const norm = (rawCountryCode || 'ET').trim().toUpperCase();
  const validCode = (norm in EAST_AFRICA_COUNTRY_PROFILES ? norm : 'ET') as Exclude<
    EastAfricaCountryCode,
    'ALL'
  >;
  const profile = EAST_AFRICA_COUNTRY_PROFILES[validCode];

  const edgeLatency = handshakeOk
    ? Math.max(14, Math.round(handshakeLatencyMs * 0.45 + profile.baseLatencyMs * 0.55))
    : profile.baseLatencyMs + 45;

  return {
    countryCode: validCode,
    countryName: profile.name,
    flag: profile.flag,
    capital: profile.capital,
    currency: profile.currency,
    edgeNodeHostname: profile.edgeNode,
    edgeLatencyMs: edgeLatency,
    edgeStatus: handshakeOk ? 'healthy' : 'degraded',
    telecomCarriers: profile.telecomCarriers,
    primaryPaymentGateway: {
      name: profile.paymentGateway.name,
      provider: profile.paymentGateway.provider,
      status: handshakeOk ? 'active' : 'degraded',
      successRatePct: handshakeOk ? 99.7 : 89.4,
      webhookLatencyMs: Math.round(edgeLatency * 1.2),
    },
    regulatoryAgency: {
      name: profile.regulator.name,
      acronym: profile.regulator.acronym,
      syncStatus: handshakeOk ? 'synchronized' : 'warning',
      lastSyncIso: new Date(Date.now() - 145000).toISOString(),
      monitoredItems: profile.regulator.monitored,
    },
    primaryCorridor: {
      name: profile.corridor.name,
      flowStatus: 'normal',
      activeTrucks: profile.corridor.activeTrucks,
      avgSpeedKmh: profile.corridor.avgSpeed,
    },
    activeApkDriversCount: profile.activeDriversBaseline,
    onlineVehiclesCount: profile.onlineVehiclesBaseline,
    openDispatchJobsCount: profile.openJobsBaseline,
    complianceHealthScore: handshakeOk ? 96.5 : 82.0,
  };
}

export function getAllEastAfricaNodeSummaries(
  overallHandshakeMs: number,
  isOnline: boolean
): EastAfricaNodeDiagnosticSummary[] {
  const keys = Object.keys(EAST_AFRICA_COUNTRY_PROFILES) as Exclude<EastAfricaCountryCode, 'ALL'>[];
  return keys.map((key) => {
    const p = EAST_AFRICA_COUNTRY_PROFILES[key];
    const latency = isOnline
      ? Math.max(16, Math.round(overallHandshakeMs * 0.35 + p.baseLatencyMs * 0.65))
      : p.baseLatencyMs + 50;

    return {
      countryCode: p.code,
      countryName: p.name,
      flag: p.flag,
      capital: p.capital,
      currency: p.currency,
      edgeNodeHostname: p.edgeNode,
      status: isOnline ? 'healthy' : 'unreachable',
      latencyMs: latency,
      paymentGateway: p.paymentGateway.name,
      gatewaySuccessRate: isOnline ? 99.8 : 86.0,
      regulatorAcronym: p.regulator.acronym,
      primaryCorridor: p.corridor.name,
      activeDrivers: p.activeDriversBaseline,
      apkVersion: p.apkVersion,
      lastPingIso: new Date().toISOString(),
    };
  });
}

export function inferCountryFromActivityItem(raw: Record<string, any>): {
  countryCode: EastAfricaCountryCode;
  countryName: string;
} {
  const text = `${raw.summary || ''} ${raw.message || ''} ${raw.description || ''} ${raw.referenceId || ''} ${raw.actorName || ''} ${raw.pickup || ''} ${raw.destination || ''}`.toLowerCase();
  const phone = String(raw.phone || raw.passengerPhone || raw.driverPhone || raw.actorPhone || '');

  if (phone.startsWith('+254') || text.includes('kenya') || text.includes('nairobi') || text.includes('mombasa') || text.includes('m-pesa') || text.includes('kes') || text.includes('sgr') || text.includes('ntsa')) {
    return { countryCode: 'KE', countryName: 'Kenya' };
  }
  if (phone.startsWith('+256') || text.includes('uganda') || text.includes('kampala') || text.includes('jinja') || text.includes('entebbe') || text.includes('ugx') || text.includes('momo') || text.includes('safeboda')) {
    return { countryCode: 'UG', countryName: 'Uganda' };
  }
  if (phone.startsWith('+250') || text.includes('rwanda') || text.includes('kigali') || text.includes('klp') || text.includes('rwf') || text.includes('rura') || text.includes('rusumo')) {
    return { countryCode: 'RW', countryName: 'Rwanda' };
  }
  if (phone.startsWith('+255') || text.includes('tanzania') || text.includes('dar es salaam') || text.includes('isaka') || text.includes('tzs') || text.includes('latra') || text.includes('tigo')) {
    return { countryCode: 'TZ', countryName: 'Tanzania' };
  }
  if (phone.startsWith('+253') || text.includes('djibouti') || text.includes('doraleh') || text.includes('pk12') || text.includes('djf') || text.includes('dpfza') || text.includes('d-money')) {
    return { countryCode: 'DJ', countryName: 'Djibouti' };
  }
  if (phone.startsWith('+252') || text.includes('somalia') || text.includes('mogadishu') || text.includes('berbera') || text.includes('hargeisa') || text.includes('hormuud') || text.includes('evc')) {
    return { countryCode: 'SO', countryName: 'Somalia' };
  }
  if (phone.startsWith('+211') || text.includes('south sudan') || text.includes('juba') || text.includes('nimule') || text.includes('ssp') || text.includes('gurush')) {
    return { countryCode: 'SS', countryName: 'South Sudan' };
  }
  // Default to Ethiopia (HQ & Horn Base)
  return { countryCode: 'ET', countryName: 'Ethiopia' };
}
