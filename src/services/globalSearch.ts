import {
  CustomerAccount,
  Driver,
  ModuleItem,
  Shipment,
  SystemAlert,
  Trip,
  Vehicle,
} from '../types';

export type SearchCategory =
  | 'Screens & Navigation'
  | 'Drivers & Fleet'
  | 'Trips & Mobility'
  | 'Cargo & Shipments'
  | 'Customers & Shippers'
  | 'Database Classes'
  | 'Payments & Finance'
  | 'Documents & Compliance'
  | 'Geofences & Maps'
  | 'System Alerts';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  iconName: string;
  actionTab?: string;
  actionModal?: 'db' | 'flutter' | 'register' | 'schema' | 'driver-simulator' | 'notifications';
  filterValue?: string;
  badge?: string;
  badgeColor?: 'cyan' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate';
  keywords: string[];
  relevanceScore?: number;
}

export interface IntellisenseClue {
  prefix: string;
  label: string;
  description: string;
  category: SearchCategory;
  example: string;
}

export interface GlobalSearchData {
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: Trip[];
  shipments: Shipment[];
  customers: CustomerAccount[];
  modules: ModuleItem[];
  alerts: SystemAlert[];
}

// Built-in Static Index: Back4App Classes, Ethiopian Geofences, Payment Channels, Compliance Documents & Screens
export const STATIC_SYSTEM_ITEMS: SearchResultItem[] = [
  // Screens & Governance
  {
    id: 'nav-dashboard',
    title: 'Operations Dashboard Home',
    subtitle: 'Executive KPIs, real-time trip velocity, active alerts & Back4App status',
    category: 'Screens & Navigation',
    iconName: 'LayoutDashboard',
    actionTab: 'dashboard',
    badge: 'Home',
    badgeColor: 'cyan',
    keywords: ['dashboard', 'home', 'kpi', 'metrics', 'velocity', 'overview', 'summary'],
  },
  {
    id: 'nav-ride',
    title: 'Ride Hailing Module & Fleet',
    subtitle: 'Manage passenger trips, driver rosters, vehicle verifications and dispatch',
    category: 'Screens & Navigation',
    iconName: 'Car',
    actionTab: 'ride',
    badge: 'Mobility',
    badgeColor: 'cyan',
    keywords: ['ride', 'hailing', 'taxi', 'mobility', 'drivers', 'vehicles', 'trips', 'fare', 'bole'],
  },
  {
    id: 'nav-truck',
    title: 'Truck Delivery & Freight Logistics',
    subtitle: 'Regional cargo consignments, heavy freight carriers, Modjo-Djibouti corridor',
    category: 'Screens & Navigation',
    iconName: 'Truck',
    actionTab: 'truck',
    badge: 'Logistics',
    badgeColor: 'blue',
    keywords: ['truck', 'delivery', 'freight', 'cargo', 'logistics', 'tonnage', 'shipment', 'modjo', 'djibouti'],
  },
  {
    id: 'nav-approvals',
    title: 'SuperApp Approvals & Vehicle Eligibility Queue',
    subtitle: 'Audit pending driver profiles, vehicle documents and inspection permits',
    category: 'Screens & Navigation',
    iconName: 'FileCheck2',
    actionTab: 'superapp-approvals',
    badge: 'Governance',
    badgeColor: 'emerald',
    keywords: ['approvals', 'queue', 'vehicle eligibility', 'documents', 'audit', 'verification', 'pending'],
  },
  {
    id: 'nav-bidding',
    title: 'Fleet Bidding & Cargo Escrow Desk',
    subtitle: 'Manage freight bids, escrow deposits, carrier disputes and release milestones',
    category: 'Screens & Navigation',
    iconName: 'Gavel',
    actionTab: 'superapp-bidding',
    badge: 'Governance',
    badgeColor: 'blue',
    keywords: ['bidding', 'escrow', 'fleet owner', 'bids', 'disputes', 'cargo escrow', 'milestone', 'deposit'],
  },
  {
    id: 'nav-pricing',
    title: 'Dynamic Pricing, Surge & FeatureFlag Studio',
    subtitle: 'Configure East Africa regional surge multipliers, cross-border tariffs, and Parse flags',
    category: 'Screens & Navigation',
    iconName: 'Flame',
    actionTab: 'superapp-pricing',
    badge: 'Fintech',
    badgeColor: 'amber',
    keywords: [
      'pricing',
      'surge',
      'dynamic pricing',
      'tariffs',
      'corridor',
      'rates',
      'feature flag',
      'multiplier',
      'fare',
      'ethiopia',
      'kenya',
      'uganda',
      'rwanda',
      'tanzania',
      'djibouti',
      'somalia',
      'south sudan',
    ],
  },
  {
    id: 'nav-commerce-standby',
    title: 'Modules Standby · Commerce & Lifestyle Services',
    subtitle: 'Pre-launch food delivery, marketplace, events, hotels, wallet & courier across 8 East African countries',
    category: 'Screens & Navigation',
    iconName: 'ShoppingBag',
    actionTab: 'commerce-standby',
    badge: 'Consumer',
    badgeColor: 'amber',
    keywords: [
      'standby',
      'commerce',
      'lifestyle',
      'food',
      'marketplace',
      'events',
      'hotels',
      'wallet',
      'courier',
      'east africa',
      'ethiopia',
      'kenya',
      'rwanda',
      'uganda',
      'tanzania',
      'djibouti',
      'somalia',
      'south sudan',
    ],
  },
  {
    id: 'nav-inspector',
    title: 'SuperApp Monorepo & Cloud RPC Inspector',
    subtitle: 'Live inspection of Flutter APK source files, Parse Cloud Code and schema diffs',
    category: 'Screens & Navigation',
    iconName: 'Archive',
    actionTab: 'superapp-inspector',
    badge: 'DevOps',
    badgeColor: 'purple',
    keywords: ['monorepo', 'archive', 'inspector', 'flutter', 'dart', 'rpc', 'cloud code', 'parse schema'],
  },
  {
    id: 'nav-back4app-classes',
    title: 'Back4App Database Classes Explorer',
    subtitle: 'Deep query view into 7 Parse database classes with 260+ production records',
    category: 'Screens & Navigation',
    iconName: 'Database',
    actionTab: 'back4app-classes',
    badge: 'Database',
    badgeColor: 'cyan',
    keywords: ['database', 'classes', 'back4app', 'parse', 'records', 'schema', '_user', 'rows', 'query'],
  },
  {
    id: 'nav-diagnostics',
    title: 'Bridge Diagnostics: Ping & APK Activity Stream',
    subtitle: 'Verify live handshake latency, session token authority and mobile event pulse',
    category: 'Screens & Navigation',
    iconName: 'Activity',
    actionTab: 'superapp-diagnostics',
    badge: 'Real-Time',
    badgeColor: 'emerald',
    keywords: ['diagnostics', 'ping', 'activity stream', 'handshake', 'latency', 'session token', 'apk bridge'],
  },
  {
    id: 'nav-dispatch',
    title: 'Autonomous GPS Dispatch Simulator',
    subtitle: 'Live interactive radar map simulation with autonomous driver-trip pairing',
    category: 'Screens & Navigation',
    iconName: 'Navigation',
    actionTab: 'dispatch',
    badge: 'Radar',
    badgeColor: 'cyan',
    keywords: ['dispatch', 'simulator', 'gps', 'radar', 'map', 'matching', 'autonomous', 'tracking'],
  },
  {
    id: 'nav-ambalay',
    title: 'AmbaLay Maps Ethiopia Geospatial Hub',
    subtitle: 'Ethiopian routing engine, POI directory and high-fidelity road networks',
    category: 'Geofences & Maps',
    iconName: 'Compass',
    actionTab: 'ambalay',
    badge: 'Geospatial',
    badgeColor: 'cyan',
    keywords: ['ambalay', 'maps', 'geospatial', 'routing', 'ethiopia', 'addis ababa', 'poi', 'navigation'],
  },
  {
    id: 'nav-geofences',
    title: 'AmbaLay Geofence Perimeter Manager',
    subtitle: 'Design, enforce and alert on geographic boundaries across Addis Ababa and corridors',
    category: 'Geofences & Maps',
    iconName: 'ShieldCheck',
    actionTab: 'geofences',
    badge: 'Geofence',
    badgeColor: 'purple',
    keywords: ['geofence', 'perimeter', 'boundary', 'zones', 'bole airport', 'merkato', 'modjo', 'perimeter'],
  },
  {
    id: 'nav-settlements',
    title: 'Payment Settlements Hub (Telebirr & CBE Birr)',
    subtitle: 'Reconcile mobile money transactions, execute driver payouts and verify Chapa IPN',
    category: 'Payments & Finance',
    iconName: 'CreditCard',
    actionTab: 'settlements',
    badge: 'Payments',
    badgeColor: 'emerald',
    keywords: ['payments', 'settlements', 'telebirr', 'cbe birr', 'chapa', 'payout', 'disbursement', 'finance', 'etb'],
  },
  {
    id: 'nav-compliance',
    title: 'Fleet Regulatory, Fuel Tariff & Cross-Border Compliance',
    subtitle: 'East Africa 8-nation transport regulatory caps (FTA/Bola, NTSA, MoWT, RURA, LATRA, DTT), fuel efficiency and carbon audits',
    category: 'Documents & Compliance',
    iconName: 'Leaf',
    actionTab: 'compliance',
    badge: 'Compliance',
    badgeColor: 'amber',
    keywords: [
      'compliance',
      'tariff',
      'fuel efficiency',
      'regulatory',
      'bola',
      'transport authority',
      'ntsa',
      'mowt',
      'rura',
      'latra',
      'dtt',
      'epra',
      'ewura',
      'emissions',
      'carbon audit',
      'kenya',
      'uganda',
      'rwanda',
      'tanzania',
      'djibouti',
      'somalia',
      'south sudan',
      'ethiopia',
      'cross-border',
      'corridor',
      'pdf export',
    ],
  },
  {
    id: 'nav-livequery',
    title: 'Parse LiveQuery & Webhooks Hub',
    subtitle: 'Real-time WebSocket subscriptions, incoming partner webhooks and payload logs',
    category: 'Screens & Navigation',
    iconName: 'Radio',
    actionTab: 'livequery',
    badge: 'Webhooks',
    badgeColor: 'emerald',
    keywords: ['livequery', 'webhooks', 'real-time', 'websocket', 'subscriptions', 'parse livequery', 'events'],
  },
  {
    id: 'nav-customers',
    title: 'Customer & Shipper Accounts Directory',
    subtitle: 'Manage rider profiles, corporate shippers, wallet balances and verification',
    category: 'Customers & Shippers',
    iconName: 'Users',
    actionTab: 'customers',
    badge: 'Directory',
    badgeColor: 'purple',
    keywords: ['customers', 'shippers', 'riders', 'accounts', 'wallet', 'corporate', 'passengers'],
  },
  {
    id: 'nav-reports',
    title: 'Financial Ledger, Multi-Currency Treasury & Reports',
    subtitle: 'Consolidated East Africa financial ledger across 8 nations, cross-border trade corridors and tax audits',
    category: 'Payments & Finance',
    iconName: 'BarChart3',
    actionTab: 'reports',
    badge: 'Treasury',
    badgeColor: 'emerald',
    keywords: [
      'reports',
      'ledger',
      'financial report',
      'treasury',
      'multi-currency',
      'cross-border',
      'corridor',
      'ethiopia',
      'kenya',
      'uganda',
      'rwanda',
      'tanzania',
      'djibouti',
      'somalia',
      'south sudan',
      'tax audit',
      'withholding tax',
      'reconciliation',
      'csv export',
      'etb',
      'kes',
      'ugx',
      'rwf',
      'tzs',
      'djf',
      'usd',
      'ssp',
    ],
  },
  {
    id: 'nav-notifications',
    title: 'System Notifications & Dispatch Alerts Hub',
    subtitle: 'Pan-East African unified corridor telemetry, cross-border border posts, and regulatory dispatch alerts',
    category: 'Screens & Navigation',
    iconName: 'Bell',
    actionTab: 'notifications',
    badge: 'Alerts Hub',
    badgeColor: 'cyan',
    keywords: [
      'notifications',
      'dispatch alerts',
      'alerts',
      'corridor',
      'cross-border',
      'border checkpoint',
      'malaba',
      'galafi',
      'rusumo',
      'namanga',
      'nimule',
      'berbera',
      'doraleh',
      'modjo',
      'ethiopia',
      'kenya',
      'uganda',
      'rwanda',
      'tanzania',
      'djibouti',
      'somalia',
      'south sudan',
      'broadcast alert',
      'security audit',
    ],
  },
  {
    id: 'nav-settings',
    title: 'System Settings & Role-Based Access Control',
    subtitle: 'Configure RBAC security roles, audit logs, API endpoints and cloud timeouts',
    category: 'Screens & Navigation',
    iconName: 'Settings',
    actionTab: 'settings',
    badge: 'Security',
    badgeColor: 'slate',
    keywords: ['settings', 'rbac', 'security', 'roles', 'permissions', 'super admin', 'audit log'],
  },
  {
    id: 'nav-modules',
    title: 'Module Registry & Architecture',
    subtitle: 'Enable or disable SuperApp micro-services: Food, Marketplace, Hotels, Wallet',
    category: 'Screens & Navigation',
    iconName: 'Sliders',
    actionTab: 'modules',
    badge: 'Platform',
    badgeColor: 'amber',
    keywords: ['module', 'registry', 'food delivery', 'marketplace', 'events', 'hotels', 'wallet', 'courier'],
  },

  // Modal Actions
  {
    id: 'modal-db',
    title: 'Back4App Server Proxy Status Inspector',
    subtitle: 'Inspect live HTTP proxy health, REST headers and Parse Cloud connectivity',
    category: 'Database Classes',
    iconName: 'Database',
    actionModal: 'db',
    badge: 'Tool',
    badgeColor: 'cyan',
    keywords: ['back4app modal', 'proxy status', 'parse health', 'connection test', 'latency'],
  },
  {
    id: 'modal-flutter',
    title: 'Flutter / Dart SDK Code Generator',
    subtitle: 'Export clean Dart service code and data contracts for Afronala mobile APK',
    category: 'Screens & Navigation',
    iconName: 'Code2',
    actionModal: 'flutter',
    badge: 'SDK',
    badgeColor: 'cyan',
    keywords: ['flutter', 'dart', 'sdk', 'code export', 'mobile', 'apk code', 'data contracts'],
  },
  {
    id: 'modal-schema',
    title: 'Visual Back4App Schema Designer',
    subtitle: 'Create, inspect and modify custom Parse class schemas with field types',
    category: 'Database Classes',
    iconName: 'Layers',
    actionModal: 'schema',
    badge: 'Schema',
    badgeColor: 'purple',
    keywords: ['schema designer', 'fields', 'parse classes', 'pointer', 'geopoint', 'visual schema'],
  },
  {
    id: 'modal-register-module',
    title: 'Register New SuperApp Module',
    subtitle: 'Provision a brand new micro-service with custom Back4App database classes',
    category: 'Screens & Navigation',
    iconName: 'Plus',
    actionModal: 'register',
    badge: 'New Module',
    badgeColor: 'emerald',
    keywords: ['register module', 'add module', 'create service', 'provision class', 'custom module'],
  },
  {
    id: 'modal-driver-phone',
    title: 'In-Cab Driver Mobile Simulator (PWA Phone HUD)',
    subtitle: 'Test real-time trip acceptance, pickup routing and fare settlement on simulated phone',
    category: 'Drivers & Fleet',
    iconName: 'Smartphone',
    actionModal: 'driver-simulator',
    badge: 'Simulator',
    badgeColor: 'cyan',
    keywords: ['driver simulator', 'phone hud', 'companion', 'pwa simulator', 'in-cab', 'accept trip'],
  },

  // Core Back4App Parse Database Classes
  {
    id: 'class-user',
    title: '_User (Back4App System Class)',
    subtitle: 'User authentication, roles, session tokens, passwords and profile data',
    category: 'Database Classes',
    iconName: 'Database',
    actionTab: 'back4app-classes',
    filterValue: '_User',
    badge: 'Class: _User',
    badgeColor: 'cyan',
    keywords: ['_user', 'user class', 'passwords', 'session tokens', 'auth', 'parse user', 'account'],
  },
  {
    id: 'class-driver',
    title: 'Driver (Parse Class)',
    subtitle: 'Driver profiles, license documents, vehicle plates, active status & ETB earnings',
    category: 'Database Classes',
    iconName: 'Database',
    actionTab: 'back4app-classes',
    filterValue: 'Driver',
    badge: 'Class: Driver',
    badgeColor: 'cyan',
    keywords: ['driver class', 'roster', 'driver parse', 'vehiclePlate', 'earningsETB', 'ratings'],
  },
  {
    id: 'class-vehicle',
    title: 'Vehicle (Parse Class)',
    subtitle: 'Registered vehicles, VIN numbers, manufacturing years, inspection dates',
    category: 'Database Classes',
    iconName: 'Database',
    actionTab: 'back4app-classes',
    filterValue: 'Vehicle',
    badge: 'Class: Vehicle',
    badgeColor: 'blue',
    keywords: ['vehicle class', 'fleet vehicles', 'car', 'truck', 'inspection', 'vin'],
  },
  {
    id: 'class-trip',
    title: 'Trip (Parse Class)',
    subtitle: 'Ride hailing journeys, passenger names, coordinates, fares and GPS breadcrumbs',
    category: 'Database Classes',
    iconName: 'Database',
    actionTab: 'back4app-classes',
    filterValue: 'Trip',
    badge: 'Class: Trip',
    badgeColor: 'emerald',
    keywords: ['trip class', 'ride parse', 'passenger', 'fareETB', 'pickup', 'destination'],
  },
  {
    id: 'class-truckbooking',
    title: 'TruckBooking & Shipment (Parse Class)',
    subtitle: 'Heavy freight consignments, cargo tonnage, carrier bids and escrow links',
    category: 'Database Classes',
    iconName: 'Database',
    actionTab: 'back4app-classes',
    filterValue: 'TruckBooking',
    badge: 'Class: TruckBooking',
    badgeColor: 'blue',
    keywords: ['truckbooking', 'shipment class', 'freight parse', 'tonnage', 'cargoType', 'bids'],
  },
  {
    id: 'class-escrow',
    title: 'Escrow (Parse Class)',
    subtitle: 'Bilateral payment holds for freight bids with milestone release automation',
    category: 'Database Classes',
    iconName: 'Database',
    actionTab: 'back4app-classes',
    filterValue: 'Escrow',
    badge: 'Class: Escrow',
    badgeColor: 'amber',
    keywords: ['escrow class', 'milestone', 'payment hold', 'freight escrow', 'disbursement'],
  },
  {
    id: 'class-activitylog',
    title: 'ActivityLog (Parse Class)',
    subtitle: 'Real-time audit records generated by Afronala mobile APKs and admin operators',
    category: 'Database Classes',
    iconName: 'Database',
    actionTab: 'back4app-classes',
    filterValue: 'ActivityLog',
    badge: 'Class: ActivityLog',
    badgeColor: 'purple',
    keywords: ['activitylog', 'audit trail', 'mobile events', 'login events', 'security log'],
  },

  // Ethiopian Geofences & Landmarks
  {
    id: 'geo-bole-airport',
    title: 'Bole International Airport (Zone A-1)',
    subtitle: 'Special transport perimeter with automated priority dispatch and tariff surge',
    category: 'Geofences & Maps',
    iconName: 'Compass',
    actionTab: 'geofences',
    badge: 'Geofence Zone',
    badgeColor: 'purple',
    keywords: ['bole airport', 'airport zone', 'geofence bole', 'addis airport', 'terminal 2'],
  },
  {
    id: 'geo-merkato',
    title: 'Addis Merkato Commercial District (Zone M-3)',
    subtitle: 'High density marketplace zone with restricted heavy truck entry windows',
    category: 'Geofences & Maps',
    iconName: 'Compass',
    actionTab: 'geofences',
    badge: 'Geofence Zone',
    badgeColor: 'amber',
    keywords: ['merkato', 'market zone', 'commercial district', 'truck restriction', 'addis merkato'],
  },
  {
    id: 'geo-modjo',
    title: 'Modjo Freight Dry Port Logistics Corridor',
    subtitle: 'Critical container terminal hub linking Addis Ababa to the Port of Djibouti',
    category: 'Geofences & Maps',
    iconName: 'Compass',
    actionTab: 'geofences',
    badge: 'Corridor',
    badgeColor: 'blue',
    keywords: ['modjo', 'dry port', 'djibouti corridor', 'customs', 'freight terminal', 'toll gate'],
  },

  // Regulatory Documents & Tariffs
  {
    id: 'doc-fta-tariff',
    title: 'Federal Transport Authority Official Tariff Directive',
    subtitle: 'Standardized maximum freight per ton-km (ETB 4.25/ton-km) and city ride floor rates',
    category: 'Documents & Compliance',
    iconName: 'Leaf',
    actionTab: 'compliance',
    badge: 'FTA Directive',
    badgeColor: 'amber',
    keywords: ['fta tariff', 'transport directive', 'price ceiling', 'fuel index', 'compliance pdf'],
  },
  {
    id: 'doc-bola-inspection',
    title: 'Annual Vehicle Mechanical & Bola Inspection Standards',
    subtitle: 'Mandatory brake, chassis and emission certification required for all commercial vehicles',
    category: 'Documents & Compliance',
    iconName: 'FileCheck2',
    actionTab: 'superapp-approvals',
    badge: 'Document',
    badgeColor: 'emerald',
    keywords: ['bola', 'inspection certificate', 'roadworthiness', 'mechanical check', 'vehicle license'],
  },
  {
    id: 'doc-telebirr-settlement',
    title: 'Ethio Telecom Telebirr Partner Merchant Agreement',
    subtitle: 'Automated IPN settlement protocol, merchant account reconciliation and daily limits',
    category: 'Payments & Finance',
    iconName: 'CreditCard',
    actionTab: 'settlements',
    badge: 'Telebirr IPN',
    badgeColor: 'emerald',
    keywords: ['telebirr agreement', 'ipn webhook', 'ethio telecom', 'merchant settlement', 'mobile money'],
  },
  {
    id: 'doc-cbe-birr',
    title: 'Commercial Bank of Ethiopia (CBE Birr) API Disbursement',
    subtitle: 'Direct bank account transfer API for automated driver earnings settlements',
    category: 'Payments & Finance',
    iconName: 'CreditCard',
    actionTab: 'settlements',
    badge: 'CBE Birr',
    badgeColor: 'emerald',
    keywords: ['cbe birr', 'commercial bank of ethiopia', 'bank transfer', 'disbursement api', 'driver earnings'],
  },
];

// Intellisense Prefix Clues & Scopes
export const INTELLISENSE_CLUES: IntellisenseClue[] = [
  {
    prefix: 'driver:',
    label: 'Filter by Driver',
    description: 'Search drivers by name, phone number, vehicle plate, or status (e.g. Active, Pending)',
    category: 'Drivers & Fleet',
    example: 'driver:Abebe',
  },
  {
    prefix: 'plate:',
    label: 'Filter by License Plate',
    description: 'Find any vehicle or driver associated with an Ethiopian plate code (e.g. AA-, ET-)',
    category: 'Drivers & Fleet',
    example: 'plate:AA-12345',
  },
  {
    prefix: 'trip:',
    label: 'Filter by Trip ID / Location',
    description: 'Search ride requests by trip ID, passenger name, pickup, or destination',
    category: 'Trips & Mobility',
    example: 'trip:Bole',
  },
  {
    prefix: 'shipment:',
    label: 'Filter by Freight Shipment',
    description: 'Search cargo shipments by ID, destination (Modjo, Djibouti), cargo type, or driver',
    category: 'Cargo & Shipments',
    example: 'shipment:DLV',
  },
  {
    prefix: 'class:',
    label: 'Back4App Parse Class',
    description: 'Directly explore Parse database classes (_User, Driver, Vehicle, Trip, Escrow)',
    category: 'Database Classes',
    example: 'class:Driver',
  },
  {
    prefix: 'cust:',
    label: 'Customer & Shipper Accounts',
    description: 'Search registered riders, corporate logistics clients and wallet accounts',
    category: 'Customers & Shippers',
    example: 'cust:Bethlehem',
  },
  {
    prefix: 'pay:',
    label: 'Payments & Settlements',
    description: 'Search Telebirr IPN transactions, CBE Birr payouts, or escrow balances',
    category: 'Payments & Finance',
    example: 'pay:Telebirr',
  },
  {
    prefix: 'doc:',
    label: 'Compliance Documents & Tariffs',
    description: 'Search inspection certificates, driver licenses, FTA tariffs, and policies',
    category: 'Documents & Compliance',
    example: 'doc:Inspection',
  },
  {
    prefix: 'screen:',
    label: 'Jump to Admin Screen',
    description: 'Instant navigation to any operational view, simulator, or governance studio',
    category: 'Screens & Navigation',
    example: 'screen:Pricing',
  },
];

/**
 * Builds a dynamic unified search index combining live App state with static system resources
 */
export function buildUnifiedSearchIndex(data: GlobalSearchData): SearchResultItem[] {
  const dynamicItems: SearchResultItem[] = [];

  // 1. Index Drivers
  for (const d of data.drivers || []) {
    const dId = d.objectId || d.id || `drv-${d.name}`;
    dynamicItems.push({
      id: `driver-${dId}`,
      title: `${d.name} (${d.vehicleModel})`,
      subtitle: `Plate: ${d.vehiclePlate} · Phone: ${d.phone} · ${d.status} · Rating ${d.rating}★ · ${d.module === 'truck' ? 'Freight Carrier' : 'City Ride'}`,
      category: 'Drivers & Fleet',
      iconName: d.module === 'truck' ? 'Truck' : 'Car',
      actionTab: d.module === 'truck' ? 'truck' : 'ride',
      filterValue: d.name,
      badge: d.status,
      badgeColor: d.status === 'Active' || d.status === 'Verified' ? 'emerald' : d.status === 'Pending' ? 'amber' : 'rose',
      keywords: [
        'driver',
        d.name.toLowerCase(),
        d.phone.replace(/\s+/g, ''),
        d.vehiclePlate.toLowerCase(),
        d.vehicleModel.toLowerCase(),
        d.status.toLowerCase(),
        d.module,
        d.licenseExpiryDate || '',
        d.joinedDate || '',
      ],
    });
  }

  // 2. Index Vehicles
  for (const v of data.vehicles || []) {
    const vId = v.objectId || v.id || `veh-${v.plate}`;
    dynamicItems.push({
      id: `vehicle-${vId}`,
      title: `${v.model} (${v.plate})`,
      subtitle: `Driver: ${v.driverName} · Year: ${v.year} · Type: ${v.type} · Status: ${v.status}${v.capacity ? ` · Cap: ${v.capacity}` : ''}`,
      category: 'Drivers & Fleet',
      iconName: v.module === 'truck' ? 'Truck' : 'Car',
      actionTab: v.module === 'truck' ? 'truck' : 'ride',
      filterValue: v.plate,
      badge: v.status,
      badgeColor: v.status === 'Verified' || v.status === 'Active' ? 'emerald' : v.status === 'Inspection' ? 'amber' : 'rose',
      keywords: [
        'vehicle',
        v.plate.toLowerCase(),
        v.model.toLowerCase(),
        v.driverName.toLowerCase(),
        v.type.toLowerCase(),
        String(v.year),
        v.status.toLowerCase(),
      ],
    });
  }

  // 3. Index Trips
  for (const t of data.trips || []) {
    const tId = t.tripId || t.objectId || t.id || 'trip';
    dynamicItems.push({
      id: `trip-${tId}`,
      title: `Trip ${t.tripId}: ${t.pickup} → ${t.destination}`,
      subtitle: `Passenger: ${t.passenger} · Driver: ${t.driver} · Fare: ETB ${Number(t.fareETB).toLocaleString()} · ${t.status} (${t.distanceKm} km)`,
      category: 'Trips & Mobility',
      iconName: 'Navigation',
      actionTab: 'ride',
      filterValue: t.tripId,
      badge: t.status,
      badgeColor: t.status === 'Completed' ? 'emerald' : t.status === 'On-Going' ? 'cyan' : t.status === 'Cancelled' ? 'rose' : 'amber',
      keywords: [
        'trip',
        'ride',
        t.tripId.toLowerCase(),
        t.passenger.toLowerCase(),
        t.driver.toLowerCase(),
        t.pickup.toLowerCase(),
        t.destination.toLowerCase(),
        t.status.toLowerCase(),
        `etb ${t.fareETB}`,
      ],
    });
  }

  // 4. Index Shipments
  for (const s of data.shipments || []) {
    const sId = s.shipmentId || s.objectId || s.id || 'shipment';
    dynamicItems.push({
      id: `shipment-${sId}`,
      title: `Shipment ${s.shipmentId}: ${s.origin} → ${s.destination}`,
      subtitle: `Cargo: ${s.cargoType} (${s.tonnage} Tons) · Driver: ${s.driver} · Plate: ${s.truckPlate} · Rate: ETB ${Number(s.freightRateETB).toLocaleString()} · ${s.status}`,
      category: 'Cargo & Shipments',
      iconName: 'Package',
      actionTab: 'truck',
      filterValue: s.shipmentId,
      badge: s.status,
      badgeColor: s.status === 'Delivered' ? 'emerald' : s.status === 'In Transit' ? 'blue' : s.status === 'Picked Up' ? 'cyan' : 'amber',
      keywords: [
        'shipment',
        'freight',
        'cargo',
        s.shipmentId.toLowerCase(),
        s.cargoType.toLowerCase(),
        s.origin.toLowerCase(),
        s.destination.toLowerCase(),
        s.driver.toLowerCase(),
        s.truckPlate.toLowerCase(),
        s.status.toLowerCase(),
        `${s.tonnage} tons`,
      ],
    });
  }

  // 5. Index Customers & Shippers
  for (const c of data.customers || []) {
    const cId = c.customerId || c.objectId || 'cust';
    const isShipper = c.accountType === 'Corporate Shipper';
    dynamicItems.push({
      id: `customer-${cId}`,
      title: `${c.name} (${c.accountType})`,
      subtitle: `Phone: ${c.phone} · Email: ${c.email} · Status: ${c.status} · Trips: ${c.tripsCount} · Spent: ETB ${Number(c.totalSpentETB).toLocaleString()}${c.companyTin ? ` · TIN: ${c.companyTin}` : ''}`,
      category: 'Customers & Shippers',
      iconName: 'Users',
      actionTab: 'customers',
      filterValue: c.name,
      badge: isShipper ? 'Corporate Shipper' : 'Ride Passenger',
      badgeColor: isShipper ? 'blue' : 'purple',
      keywords: [
        'customer',
        'shipper',
        'passenger',
        c.name.toLowerCase(),
        c.phone.replace(/\s+/g, ''),
        c.email.toLowerCase(),
        c.status.toLowerCase(),
        c.accountType.toLowerCase(),
        c.companyTin ? c.companyTin.toLowerCase() : '',
      ],
    });
  }

  // 6. Index System Alerts
  for (const a of data.alerts || []) {
    const aId = a.objectId || a.id || `alert-${a.title}`;
    dynamicItems.push({
      id: `alert-${aId}`,
      title: a.title,
      subtitle: `Priority Alert · Reported ${a.timeAgo} · Status: ${a.resolved ? 'Resolved' : 'Active Attention'}`,
      category: 'System Alerts',
      iconName: 'AlertTriangle',
      actionTab: 'dashboard',
      badge: a.type.toUpperCase(),
      badgeColor: a.type === 'high' ? 'rose' : a.type === 'warning' ? 'amber' : 'cyan',
      keywords: ['alert', 'warning', a.title.toLowerCase(), a.type, a.resolved ? 'resolved' : 'active'],
    });
  }

  return [...STATIC_SYSTEM_ITEMS, ...dynamicItems];
}

/**
 * Searches the unified index with intelligent matching, category scoping, and ranking
 */
export function searchGlobalIndex(query: string, data: GlobalSearchData): SearchResultItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    // When query is empty, return a curated set of prominent screens and quick-access entries
    return STATIC_SYSTEM_ITEMS.slice(0, 12);
  }

  const allItems = buildUnifiedSearchIndex(data);

  // Check if query has a scope prefix like "driver:Abebe", "trip:Bole", "class:Ride"
  let scopeFilter: string | null = null;
  let cleanQuery = trimmed;

  const prefixMatch = trimmed.match(/^([a-z]+):(.*)$/);
  if (prefixMatch) {
    const scopePrefix = prefixMatch[1];
    cleanQuery = prefixMatch[2].trim();

    if (scopePrefix === 'driver' || scopePrefix === 'plate') {
      scopeFilter = 'Drivers & Fleet';
    } else if (scopePrefix === 'trip') {
      scopeFilter = 'Trips & Mobility';
    } else if (scopePrefix === 'shipment' || scopePrefix === 'cargo') {
      scopeFilter = 'Cargo & Shipments';
    } else if (scopePrefix === 'class' || scopePrefix === 'db') {
      scopeFilter = 'Database Classes';
    } else if (scopePrefix === 'cust' || scopePrefix === 'customer') {
      scopeFilter = 'Customers & Shippers';
    } else if (scopePrefix === 'pay' || scopePrefix === 'payment') {
      scopeFilter = 'Payments & Finance';
    } else if (scopePrefix === 'doc' || scopePrefix === 'compliance') {
      scopeFilter = 'Documents & Compliance';
    } else if (scopePrefix === 'geo' || scopePrefix === 'map') {
      scopeFilter = 'Geofences & Maps';
    } else if (scopePrefix === 'screen' || scopePrefix === 'nav') {
      scopeFilter = 'Screens & Navigation';
    }
  }

  const searchTokens = cleanQuery.split(/\s+/).filter(Boolean);

  const matchedItems: (SearchResultItem & { score: number })[] = [];

  for (const item of allItems) {
    if (scopeFilter && item.category !== scopeFilter) {
      continue;
    }

    const titleLower = item.title.toLowerCase();
    const subtitleLower = item.subtitle.toLowerCase();
    const categoryLower = item.category.toLowerCase();
    const badgeLower = (item.badge || '').toLowerCase();

    // If cleanQuery is empty after prefix, match all in category
    if (searchTokens.length === 0) {
      matchedItems.push({ ...item, score: 100 });
      continue;
    }

    let score = 0;
    let allTokensMatched = true;

    for (const token of searchTokens) {
      let tokenMatched = false;

      // Exact title prefix
      if (titleLower.startsWith(token)) {
        score += 80;
        tokenMatched = true;
      } else if (titleLower.includes(` ${token}`)) {
        score += 50;
        tokenMatched = true;
      } else if (titleLower.includes(token)) {
        score += 35;
        tokenMatched = true;
      }

      // Filter value match (e.g. plate or tripId)
      if (item.filterValue && item.filterValue.toLowerCase().includes(token)) {
        score += 60;
        tokenMatched = true;
      }

      // Subtitle match
      if (subtitleLower.includes(token)) {
        score += 20;
        tokenMatched = true;
      }

      // Keyword match
      for (const kw of item.keywords) {
        if (kw === token) {
          score += 45;
          tokenMatched = true;
        } else if (kw.startsWith(token)) {
          score += 25;
          tokenMatched = true;
        } else if (kw.includes(token)) {
          score += 15;
          tokenMatched = true;
        }
      }

      // Category or Badge match
      if (categoryLower.includes(token) || badgeLower.includes(token)) {
        score += 20;
        tokenMatched = true;
      }

      if (!tokenMatched) {
        allTokensMatched = false;
        break;
      }
    }

    if (allTokensMatched && score > 0) {
      matchedItems.push({ ...item, score });
    }
  }

  // Sort by relevance score descending
  matchedItems.sort((a, b) => b.score - a.score);

  return matchedItems.slice(0, 30);
}

/**
 * Intellisense provider: generates ghost autocomplete text, prefix recommendations, and live clues
 */
export function getIntellisenseSuggestions(
  rawQuery: string,
  data: GlobalSearchData
): {
  ghostText: string;
  recommendedClue: IntellisenseClue | null;
  matchingClues: IntellisenseClue[];
  suggestedPhrases: string[];
} {
  const query = rawQuery.trim();
  const lower = query.toLowerCase();

  // If empty, offer all top-level clues
  if (!query) {
    return {
      ghostText: '',
      recommendedClue: null,
      matchingClues: INTELLISENSE_CLUES.slice(0, 5),
      suggestedPhrases: [
        'driver:Abebe',
        'plate:AA-12345',
        'trip:Bole',
        'class:Ride',
        'shipment:Modjo',
        'pay:Telebirr',
      ],
    };
  }

  // Check prefix match
  const prefixClue = INTELLISENSE_CLUES.find((c) =>
    c.prefix.startsWith(lower) || lower.startsWith(c.prefix)
  );

  const matchingClues = INTELLISENSE_CLUES.filter(
    (c) =>
      c.prefix.includes(lower) ||
      c.label.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower) ||
      c.example.toLowerCase().includes(lower)
  );

  // Derive Ghost Autocomplete from best matching item title, prefix, or location
  let ghostText = '';
  const searchResults = searchGlobalIndex(query, data);

  if (searchResults.length > 0) {
    const topResult = searchResults[0];
    const topTitle = topResult.filterValue || topResult.title;

    // If query is prefix of title, suggest rest of phrase
    if (topTitle.toLowerCase().startsWith(lower)) {
      ghostText = rawQuery + topTitle.slice(query.length);
    } else if (prefixClue && prefixClue.prefix.startsWith(lower)) {
      ghostText = rawQuery + prefixClue.prefix.slice(query.length);
    }
  }

  // Suggested quick phrases
  const phrases = new Set<string>();
  if (matchingClues.length > 0) {
    phrases.add(matchingClues[0].example);
  }
  for (const r of searchResults.slice(0, 4)) {
    if (r.filterValue) phrases.add(r.filterValue);
    else phrases.add(r.title.split('(')[0].trim());
  }

  return {
    ghostText: ghostText.length > rawQuery.length ? ghostText : '',
    recommendedClue: prefixClue || (matchingClues.length > 0 ? matchingClues[0] : null),
    matchingClues,
    suggestedPhrases: Array.from(phrases).slice(0, 5),
  };
}
