import { EastAfricaCountryCode } from '../types';

export interface RegionalGeoMapService {
  countryCode: Exclude<EastAfricaCountryCode, 'ALL'>;
  countryName: string;
  flag: string;
  engineName: string;
  tagline: string;
  provider: string;
  apiVersion: string;
  status: 'ONLINE' | 'ACTIVE_PROXY' | 'PRIMARY_INTEGRATION';
  latencyMs: number;
  coverageCity: string;
  specialization: string;
  rideHailingFeatures: string[];
  truckDeliveryFeatures: string[];
  supportedVehicles: string[];
  offlineTileSupport: boolean;
  geocodingAccuracyMeters: number;
  tollAndWeighbridgeIntegration: boolean;
  activeFleetPingsToday: number;
  apiDocsSnippet: string;
}

export const EAST_AFRICA_GEOMAP_ENGINES: Record<
  Exclude<EastAfricaCountryCode, 'ALL'>,
  RegionalGeoMapService
> = {
  ET: {
    countryCode: 'ET',
    countryName: 'Ethiopia',
    flag: '🇪🇹',
    engineName: 'AmbaLay Maps Ethiopia',
    tagline: 'High-precision Ethiopian street network, Kebele addressing & highland tollway routing',
    provider: 'Ethiopian Geospatial Information Institute & Afronala Labs',
    apiVersion: 'v2.4-enterprise',
    status: 'PRIMARY_INTEGRATION',
    latencyMs: 38,
    coverageCity: 'Addis Ababa & National Freight Corridors (Modjo, Hawassa, Dire Dawa)',
    specialization: 'Native Amharic & English bilingual routing, Kebele landmark navigation, Bole Airport to Kazanchis multi-lane corridors, and Modjo Dry Port tollway freight paths with 100% offline tile caching for Ethiopian highlands.',
    rideHailingFeatures: [
      'Amharic audio voice turn-by-turn guidance',
      'Kebele & landmark-anchored pickup pinpointing',
      'Meskel Square & Bole Road live congestion heatmaps',
      'Dynamic urban surge corridor geo-indexing',
    ],
    truckDeliveryFeatures: [
      'Modjo Dry Port & Kality bonded yard weighbridge gates',
      'Addis-Adama Tollway heavy freight lane guidance',
      'Axle-load limit avoidance on historical bridges',
      'Mountain pass gradient & engine brake advisory',
    ],
    supportedVehicles: ['Toyota Vitz', 'Hyundai Accent', 'Lada Cabs', 'SinoTruck 40T', 'FAW Cargo Carriers'],
    offlineTileSupport: true,
    geocodingAccuracyMeters: 3.2,
    tollAndWeighbridgeIntegration: true,
    activeFleetPingsToday: 184500,
    apiDocsSnippet: `// AmbaLay Maps Ethiopia - Client SDK
import { AmbaLayMap } from 'ambalay-maps-flutter';

final ambalay = AmbaLayMap(
  apiKey: 'ambalay_e1248997...',
  region: 'ET-ADDIS',
  enableOfflineHighlandsCache: true,
  routingProfile: RoutingProfile.rideAndHeavyFreight,
);`,
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    engineName: 'Safaricom MapData & Survey Kenya GeoEngine',
    tagline: 'Precision matatu stage indexing, boda-boda alleyways & Mombasa SGR corridor tracking',
    provider: 'Survey of Kenya & Safaricom Geospatial Labs',
    apiVersion: 'v3.1-kenya-edge',
    status: 'ACTIVE_PROXY',
    latencyMs: 42,
    coverageCity: 'Nairobi Metro, Mombasa Coast & Northern Corridor (Nakuru, Eldoret, Kisumu)',
    specialization: 'Centimeter-level boda-boda alleyway and estate gate routing in Nairobi, matatu stage stop indexing, Mombasa Port to Embakasi ICD rail & road freight tracking, and NTSA speed-limiter telematics integration.',
    rideHailingFeatures: [
      'Boda-boda rapid lane shortcuts & pedestrian footbridge paths',
      'Matatu stage pickup points & bus stop geocodes',
      'Westlands, Kilimani & Upper Hill traffic diversion algorithms',
      'Lipa Na M-PESA geofence fare trigger points',
    ],
    truckDeliveryFeatures: [
      'Mombasa Port (KPA) container terminal gate tracking',
      'Northern Corridor weighbridge (Mariakani, Athi River, Gilgil) queues',
      'NTSA 80 km/h commercial governor compliance telemetry',
      'Embakasi Inland Container Depot (ICD) bonded drayage',
    ],
    supportedVehicles: ['Boda-Boda (Motorcycles)', 'Toyota Axio', 'Matatus / Shuttles', 'Mercedes Actros 6x4', 'Container Trailers'],
    offlineTileSupport: true,
    geocodingAccuracyMeters: 2.8,
    tollAndWeighbridgeIntegration: true,
    activeFleetPingsToday: 215400,
    apiDocsSnippet: `// Survey Kenya GeoEngine - Client SDK
import { KenyaGeoNav } from 'survey-kenya-nav';

final kenyaNav = KenyaGeoNav(
  gateway: 'safaricom-iot-edge.ke',
  corridor: Corridor.northernTransitHighway,
  weighbridgeAlerts: true,
);`,
  },
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    flag: '🇺🇬',
    engineName: 'SafeRoute Uganda & KCCA Spatial Engine',
    tagline: 'Kampala 7-hills terrain navigation, SafeBoda stage telemetry & Malaba border freight tracking',
    provider: 'Kampala Capital City Authority (KCCA) & SafeBoda Spatial',
    apiVersion: 'v2.8-uganda',
    status: 'ACTIVE_PROXY',
    latencyMs: 49,
    coverageCity: 'Kampala Metro, Entebbe Corridor, Jinja & Malaba Border Highway',
    specialization: 'Kampala 7-hills elevation and monsoon flood bypass routing, SafeBoda stage waypoint indexing, Entebbe Express Tollway telemetry, and Jinja-to-Malaba transit truck corridor tracking.',
    rideHailingFeatures: [
      'SafeBoda stage directory and verified rider pickup bays',
      'Entebbe Expressway automated electronic toll collection (ETC)',
      'Kampala urban drainage flood-avoidance rerouting',
      'Luganda and English voice navigation audio',
    ],
    truckDeliveryFeatures: [
      'Malaba One-Stop Border Post (OSBP) freight queue estimator',
      'Namanve Industrial Park bonded logistics yard perimeters',
      'Fuel tanker transit speed regulation telemetry',
      'Jinja Nile Bridge axle-load enforcement gates',
    ],
    supportedVehicles: ['SafeBoda Motorcycles', 'Toyota Premio', 'Toyota HiAce Vans', 'Scania Fuel Tankers', 'Flatbed Haulers'],
    offlineTileSupport: true,
    geocodingAccuracyMeters: 4.1,
    tollAndWeighbridgeIntegration: true,
    activeFleetPingsToday: 132000,
    apiDocsSnippet: `// SafeRoute Uganda - Client SDK
import { SafeRouteUganda } from 'kcca-saferoute-sdk';

final ugNav = SafeRouteUganda(
  authority: 'KCCA_TRAFFIC_OPS',
  enableTerrainGradeOptimization: true,
  northernCorridorOSBPTracking: true,
);`,
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    flag: '🇷🇼',
    engineName: 'Kigali Smart Spatial & RURA GeoNav',
    tagline: 'Kigali car-free green zones, electric moto swap points & KLP bonded freight logistics',
    provider: 'Rwanda Information Society Authority (RISA) & RURA',
    apiVersion: 'v4.0-smart-kigali',
    status: 'ACTIVE_PROXY',
    latencyMs: 31,
    coverageCity: 'Kigali City (Gasabo, Kicukiro, Nyarugenge) & Rusumo / Rubavu Corridors',
    specialization: 'Rwanda National Land Authority exact parcel and UPI addressing, Kigali car-free green zone routing, e-moto battery swap station locator, and Kigali Logistics Platform (KLP) automated gate verification.',
    rideHailingFeatures: [
      'Electric motorcycle green corridor prioritization',
      'Battery swapping station live availability routing',
      'Kigali car-free commercial street automated boundaries',
      'Kinyarwanda & French audio navigation options',
    ],
    truckDeliveryFeatures: [
      'Kigali Logistics Platform (KLP Masaka) digital seals',
      'Rusumo Border (Tanzania) to Rubavu (DRC) transit corridor',
      'RURA axle-load digital sensor integration',
      'Kigali Special Economic Zone (KSEZ) cargo gates',
    ],
    supportedVehicles: ['Ampersand / Spiro E-Motos', 'Volkswagen Taigo (Move Rwanda)', 'KLP Bonded Trailers', 'Isuzu NPR Box Trucks'],
    offlineTileSupport: true,
    geocodingAccuracyMeters: 2.1,
    tollAndWeighbridgeIntegration: true,
    activeFleetPingsToday: 98000,
    apiDocsSnippet: `// RURA GeoNav - Client SDK
import { RURAGeoNav } from 'rura-geonav-rwanda';

final ruraNav = RURAGeoNav(
  city: 'Kigali',
  greenMobilityFilter: true,
  klpTerminalSync: true,
);`,
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    flag: '🇹🇿',
    engineName: 'SwahiliNav & LATRA Tanzania GeoTrack',
    tagline: 'Port of Dar container drayage navigation, Zanzibar stone town & Central Corridor rail paths',
    provider: 'Land Transport Regulatory Authority (LATRA) & Dar GIS',
    apiVersion: 'v2.6-swahili',
    status: 'ACTIVE_PROXY',
    latencyMs: 46,
    coverageCity: 'Dar es Salaam, Zanzibar (Unguja/Pemba), Arusha & Isaka Dry Port',
    specialization: 'Port of Dar es Salaam container drayage navigation, DART bus rapid transit corridor separation, Zanzibar Stone Town pedestrian maze addressing, and Central Corridor freight dispatch to Rwanda and Burundi.',
    rideHailingFeatures: [
      'Dar es Salaam bajaji (3-wheeler) & pikipiki express paths',
      'DART busway crossing and dedicated lane restrictions',
      'Zanzibar Stone Town narrow street vehicle accessibility flags',
      'Swahili native language voice instructions',
    ],
    truckDeliveryFeatures: [
      'Port of Dar es Salaam Berth 1-8 container drayage dispatch',
      'Isaka Dry Port & TAZARA rail freight interchange gates',
      'Central Corridor (Dar-Dodoma-Singida-Isaka) transit tracking',
      'TRA customs electronic cargo tracking system (ECTS) integration',
    ],
    supportedVehicles: ['Bajaji 3-Wheelers', 'Toyota Spacio', 'Zanzibar Tourist Minivans', 'Tata Heavy Trucks', 'Multi-Axle Heavy Haulers'],
    offlineTileSupport: true,
    geocodingAccuracyMeters: 3.8,
    tollAndWeighbridgeIntegration: true,
    activeFleetPingsToday: 167000,
    apiDocsSnippet: `// SwahiliNav - Client SDK
import { SwahiliNav } from 'latra-swahilinav-tz';

final tzNav = SwahiliNav(
  region: 'Dar-Es-Salaam',
  portDrayageMode: true,
  ectsComplianceActive: true,
);`,
  },
  DJ: {
    countryCode: 'DJ',
    countryName: 'Djibouti',
    flag: '🇩🇯',
    engineName: 'Mer Rouge Nav & DPFZA Port Corridor GIS',
    tagline: 'Doraleh container maritime drayage, PK12 Free Zone passes & Galafi corridor telemetry',
    provider: 'Djibouti Ports and Free Zones Authority (DPFZA)',
    apiVersion: 'v3.2-dpfza',
    status: 'PRIMARY_INTEGRATION',
    latencyMs: 34,
    coverageCity: 'Djibouti City (Plateau, Heron), Doraleh Ports & Galafi Border Highway',
    specialization: 'Doraleh Multipurpose Port (DMP) container drayage dispatch, DIFTZ PK12 Free Zone digital gate passes, Galafi-Ethiopia cross-border road telemetry, and Red Sea coastal wind & heat sensor alerts for transport engines.',
    rideHailingFeatures: [
      'Plateau, Heron & diplomatic quarter secure zone navigation',
      'French and Arabic navigation and address geocoding',
      'High-temperature midday engine cooling route recommendations',
      'Ambouli International Airport VIP pickup bay guides',
    ],
    truckDeliveryFeatures: [
      'Doraleh Container Terminal (SGTD/DMP) turn-around timer',
      'Galafi Border customs manifest digital seal tracking',
      'PK12 bonded corridor heavy transport priority lanes',
      'D-Money cross-border fuel voucher geofence gates',
    ],
    supportedVehicles: ['Peugeot Cabs', 'Toyota Land Cruiser', 'Renault Trucks', 'SinoTruck 40T Port Haulers', 'Container Lowboys'],
    offlineTileSupport: true,
    geocodingAccuracyMeters: 3.0,
    tollAndWeighbridgeIntegration: true,
    activeFleetPingsToday: 74500,
    apiDocsSnippet: `// Mer Rouge Nav - Client SDK
import { MerRougeNav } from 'dpfza-merrouge-nav';

final djNav = MerRougeNav(
  terminal: 'Doraleh-DMP',
  galafiHighwayTelematics: true,
  freeZonePassValidation: true,
);`,
  },
  SO: {
    countryCode: 'SO',
    countryName: 'Somalia',
    flag: '🇸🇴',
    engineName: 'SomaliGeo & Berbera Corridor GIS',
    tagline: 'Mogadishu secure corridor routing, DP World Berbera port drayage & Bakara courier paths',
    provider: 'Somali Telecommunications Authority & DP World Berbera',
    apiVersion: 'v2.1-somaligeo',
    status: 'ACTIVE_PROXY',
    latencyMs: 58,
    coverageCity: 'Mogadishu (Liido, Airport, Bakara), Hargeisa & Berbera Port Corridor',
    specialization: 'Mogadishu secure corridor and green zone navigation, DP World Berbera Port logistics highway to Tog Wajaale (Ethiopia border), Bakara market courier pathways, and offline GPS waypoint routing with satellite fallback.',
    rideHailingFeatures: [
      'Verified safe commercial transport arterial corridors',
      'Aden Adde Airport green zone security gate passes',
      'Bakara market rapid bajaj pedestrian bypass paths',
      'Somali & English bilingual voice navigation',
    ],
    truckDeliveryFeatures: [
      'DP World Berbera Port container terminal dispatch routes',
      'Berbera-Hargeisa-Tog Wajaale livestock & freight corridor',
      'Satellite waypoint tracking for desert highway links',
      'Hormuud EVC Plus toll and cargo milestone settlements',
    ],
    supportedVehicles: ['3-Wheeler Bajaj', 'Toyota Probox', 'Toyota Land Cruiser 4x4', 'Isuzu Forward', 'Kenworth Heavy Trailers'],
    offlineTileSupport: true,
    geocodingAccuracyMeters: 4.8,
    tollAndWeighbridgeIntegration: true,
    activeFleetPingsToday: 62000,
    apiDocsSnippet: `// SomaliGeo - Client SDK
import { SomaliGeo } from 'somaligeo-berbera-sdk';

final soNav = SomaliGeo(
  hub: 'Berbera-Corridor',
  offlineWaypointCache: true,
  safeZoneNavigationOnly: true,
);`,
  },
  SS: {
    countryCode: 'SS',
    countryName: 'South Sudan',
    flag: '🇸🇸',
    engineName: 'NileRoute GIS & Juba Urban Spatial Engine',
    tagline: 'Nimule-Juba customs convoy tracker, White Nile river barge waypoints & humanitarian grid',
    provider: 'South Sudan Ministry of Roads & Bridges & UNMISS GIS',
    apiVersion: 'v2.0-nileroute',
    status: 'ACTIVE_PROXY',
    latencyMs: 64,
    coverageCity: 'Juba Urban Grid, Nimule Border Highway & White Nile River Corridor',
    specialization: 'Nimule-Juba lifeline freight corridor customs convoy tracker, White Nile river barge cargo transshipment waypoints, Juba urban humanitarian logistics grid, and seasonal wet road mud passability warnings.',
    rideHailingFeatures: [
      'Juba central boda-boda urban waypoints and safe crossings',
      'Konyo Konyo and Customs market access perimeters',
      'Tongping diplomatic quarter access gates',
      'Juba Arabic and English voice prompts',
    ],
    truckDeliveryFeatures: [
      'Nimule Border OSBP customs escort convoy formation gates',
      'White Nile river barge cargo transfer depot geofences',
      'Seasonal heavy rain impassable route automatic alerts',
      'm-GURUSH cross-border clearance milestone releases',
    ],
    supportedVehicles: ['Boda-Boda (Motorcycles)', 'Toyota Hilux 4x4', 'Land Cruiser Hardtop', 'MAN TGS 6x6 Heavy Trucks', 'White Nile Freight Barges'],
    offlineTileSupport: true,
    geocodingAccuracyMeters: 5.2,
    tollAndWeighbridgeIntegration: true,
    activeFleetPingsToday: 41200,
    apiDocsSnippet: `// NileRoute GIS - Client SDK
import { NileRouteGIS } from 'nileroute-southsudan-sdk';

final ssNav = NileRouteGIS(
  corridor: 'Nimule-Juba-Highway',
  convoyTrackingActive: true,
  rainSeasonMudPassabilityAudit: true,
);`,
  },
};
