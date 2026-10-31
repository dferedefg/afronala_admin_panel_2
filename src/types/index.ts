export type SchemaFieldType = 'String' | 'Number' | 'Boolean' | 'GeoPoint' | 'Date' | 'Pointer' | 'Array' | 'Object';

export interface SchemaField {
  name: string;
  type: SchemaFieldType;
  required: boolean;
  defaultValue?: string | number | boolean;
  targetClass?: string;
  description?: string;
}

export type ModuleOperatingStatus = 'active' | 'pilot' | 'staged' | 'regulatory_pending' | 'disabled';

export interface EastAfricaModuleCountryConfig {
  countryCode: Exclude<EastAfricaCountryCode, 'ALL'>;
  countryName: string;
  flag: string;
  enabled: boolean;
  operatingStatus: ModuleOperatingStatus;
  statusLabel: string;
  regulatoryAuthority: string;
  regulatoryFilingNumber?: string;
  statutoryCommissionCapPct: number;
  withholdingTaxPct: number;
  currency: EastAfricaCurrency;
  primaryPaymentRail: string;
  activeFleetCount: number;
  supportedCities: string[];
  primaryHubs: string[];
  speedLimiterRequired?: boolean;
  cashOnDeliveryAllowed?: boolean;
  crossBorderBondedTransit?: boolean;
  emergencySOSHooked?: boolean;
  notes?: string;
  updatedAt?: string;
}

export interface ModuleItem {
  id: string;
  objectId?: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  statusText?: string;
  category: string;
  badge?: string;
  canToggle?: boolean;
  isCustom?: boolean;
  customClasses?: string[];
  fields?: SchemaField[];
  createdAt?: string;
  // East Africa multi-country regional scoping
  countries?: Exclude<EastAfricaCountryCode, 'ALL'>[];
  countryConfigs?: Partial<Record<Exclude<EastAfricaCountryCode, 'ALL'>, EastAfricaModuleCountryConfig>>;
  panEastAfricaCommissionCapPct?: number;
  globalRolloutStage?: 'Active (Production)' | 'Phased Regional Rollout' | 'Pilot Sandbox' | 'Standby / Pre-launch';
  primaryRegulatoryAgency?: string;
}

export type DriverStatus = 'Active' | 'Pending' | 'Verified' | 'Suspended';

export interface Driver {
  objectId?: string;
  id?: string;
  name: string;
  phone: string;
  vehicleModel: string;
  vehiclePlate: string;
  status: DriverStatus;
  rating: number;
  avatar?: string;
  module: 'ride' | 'truck';
  tripsCompleted?: number;
  earningsETB?: number;
  joinedDate?: string;
  licenseExpiryDate?: string;
  bolaInspectionExpiryDate?: string;
  insuranceExpiryDate?: string;
  tinClearanceExpiryDate?: string;
  complianceNoticeSentAt?: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
}

export type VehicleStatus = 'Verified' | 'Inspection' | 'Suspended' | 'Active';

export interface Vehicle {
  objectId?: string;
  id?: string;
  model: string;
  plate: string;
  driverName: string;
  status: VehicleStatus;
  photoUrl: string;
  type: string;
  year: number;
  capacity?: string;
  module: 'ride' | 'truck';
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
}

export type TripStatus = 'Completed' | 'On-Going' | 'Cancelled' | 'Requested';

export interface Trip {
  objectId?: string;
  id?: string;
  tripId: string;
  passenger: string;
  passengerPhone?: string;
  driver: string;
  driverPhone?: string;
  status: TripStatus;
  fareETB: number;
  time: string;
  pickup: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  module: 'ride' | 'truck';
  coordinates?: {
    pickup: [number, number];
    dropoff: [number, number];
    current?: [number, number];
  };
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
}

export type ShipmentStatus = 'In Transit' | 'Picked Up' | 'Delivered' | 'Pending';

export interface Shipment {
  objectId?: string;
  id?: string;
  shipmentId: string;
  status: ShipmentStatus;
  time: string;
  origin: string;
  destination: string;
  cargoType: string;
  tonnage: number;
  truckPlate: string;
  driver: string;
  freightRateETB: number;
  estimatedDelivery: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
}

export interface SystemAlert {
  objectId?: string;
  id?: string;
  title: string;
  timeAgo: string;
  type: 'high' | 'warning' | 'info' | 'payment';
  resolved?: boolean;
}

export type NotificationCategory =
  | 'unread'
  | 'system'
  | 'operations'
  | 'security'
  | 'dispatch'
  | 'regulatory'
  | 'settlement';

export type NotificationType =
  | 'driver'
  | 'vehicle'
  | 'trip'
  | 'shipment'
  | 'system'
  | 'corridor'
  | 'payment'
  | 'broadcast';

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'security' | 'success';

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  category: NotificationCategory;
  read: boolean;
  type: NotificationType;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  corridor?: string;
  severity?: NotificationSeverity;
  targetModule?: string;
  actionLabel?: string;
  actionTab?: string;
  timestamp?: string;
  sourceAuthority?: string;
  broadcastBy?: string;
  recipientAudience?: 'all' | 'drivers' | 'shippers' | 'fleet_owners' | 'customs_agents';
  pinned?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  emergencyHotline?: string;
  telemetryCoords?: [number, number];
}

export interface AdminUser {
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: 'online' | 'busy' | 'away';
  jurisdictionCountry?: EastAfricaCountryCode;
  jurisdictionName?: string;
  assignedCorridors?: string[];
}

export type DispatchStatus = 'Queued' | 'Assigned' | 'En Route' | 'Onboard' | 'Completed' | 'Cancelled';

export interface DispatchJob {
  id: string;
  tripId: string;
  module: 'ride' | 'truck';
  passenger: string;
  passengerPhone: string;
  pickupName: string;
  pickupCoords: [number, number]; // [lat, lng]
  dropoffName: string;
  dropoffCoords: [number, number];
  status: DispatchStatus;
  fareETB: number;
  distanceKm: number;
  driverId?: string;
  driverName?: string;
  vehiclePlate?: string;
  currentCoords?: [number, number];
  speedKmh: number;
  batteryPercent: number;
  etaMinutes: number;
  headingDeg: number;
  progressPercent: number;
  requestedAt: string;
  ambalayTripId?: string;
  ambalayDistanceMeters?: number;
  ambalayDurationSeconds?: number;
  ambalayRouteCoords?: [number, number][]; // [lat, lng] array from AmbaLay GeoJSON
  deviationMeters?: number;
  isDeviated?: boolean;
  trafficSeverity?: 'clear' | 'moderate' | 'heavy' | 'standstill';
  rerouted?: boolean;
}

export type GeofenceShapeType = 'circle' | 'polygon';

export interface GeofenceZone {
  id: string;
  name: string;
  category: 'airport' | 'port' | 'commercial' | 'transit' | 'restricted' | 'custom';
  shape?: GeofenceShapeType;
  center: [number, number]; // [lat, lng]
  radiusMeters: number;
  polygonPoints?: [number, number][]; // [lat, lng] coordinates for polygon boundaries
  status: 'active' | 'warning' | 'breached';
  description?: string;
  color?: string;
  alertOnExit?: boolean;
  alertOnEntry?: boolean;
  assignedTripIds?: string[];
  activeTripsInside?: string[];
  breachCount?: number;
  lastBreachAt?: string;
}

export interface GeofenceBreachAlert {
  id: string;
  geofenceId: string;
  geofenceName: string;
  tripId: string;
  jobId: string;
  driverName: string;
  vehiclePlate: string;
  type: 'exit_breach' | 'unauthorized_entry';
  location: [number, number];
  timestamp: string;
  acknowledged: boolean;
  message: string;
  severity: 'warning' | 'critical';
}

export interface TrafficHeatmapPoint {
  id: string;
  lat: number;
  lon: number;
  intensity: number; // 0.1 to 1.0
  speedKmh: number;
  delayMins: number;
  corridorName: string;
  status: 'smooth' | 'moderate' | 'congested' | 'gridlock';
}

export interface TrafficCorridor {
  id: string;
  name: string;
  severity: 'clear' | 'moderate' | 'heavy' | 'standstill';
  speedKmh: number;
  delayMinutes: number;
  coordinates: [number, number][]; // [lat, lng]
  lengthKm: number;
}

export interface DeviationAlert {
  id: string;
  tripId: string;
  driverName: string;
  vehiclePlate: string;
  timestamp: string;
  deviationMeters: number;
  corridorName: string;
  resolved: boolean;
  severity: 'warning' | 'critical';
  status?: 'active' | 'acknowledged' | 'resolved';
  jobId?: string;
  message?: string;
}


export interface WebhookSubscription {
  id: string;
  url: string;
  name: string;
  events: string[];
  secretKey: string;
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
  lastStatus?: number;
  successCount: number;
  failureCount: number;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  targetRailOrAuthority?: string;
  currency?: EastAfricaCurrency;
  corridor?: string;
}

export interface LiveQueryEvent {
  id: string;
  timestamp: string;
  className: string;
  event: 'create' | 'update' | 'delete' | 'enter' | 'leave';
  objectId: string;
  payload: Record<string, any>;
  clientIp?: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  currency?: EastAfricaCurrency;
  cityOrCorridor?: string;
}

// AmbaLay Maps Ethiopian Geospatial Types
export interface AmbaLayServiceStatus {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  provider: string;
  latencyMs: number;
  prefix: string;
  services: ('TILES' | 'GEO_CODING' | 'ROUTING' | 'MATRIX' | 'TRIP' | 'TRIP_UPDATE')[];
  region: string;
  baseUrl: string;
  timestamp: string;
}

export interface AmbaLayGeocodeLocation {
  lat: string;
  lon: string;
  name: string;
  category: string;
  type: string;
  boundingbox?: string[];
}

export interface AmbaLayRouteResponse {
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat] in GeoJSON standard
  };
  distanceMeters: number;
  durationSeconds: number;
}

export interface AmbaLayMatrixResponse {
  distancesMeters: number[][];
  durationsSeconds: number[][];
}

export interface AmbaLayTripData {
  id: string;
  businessId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  distanceMeters: number;
  startedAt: string;
  lastAt: string;
  startLocation: { lat: number; lon: number };
  lastLocation: { lat: number; lon: number };
  endLocation?: { lat: number; lon: number } | null;
  createdAt: string;
  updatedAt: string;
}

// East Africa Cross-Border Payment Settlement Rails & Multi-Country Hubs
export type EastAfricaCountryCode = 'ALL' | 'ET' | 'KE' | 'UG' | 'RW' | 'TZ' | 'DJ' | 'SO' | 'SS';
export type EastAfricaCurrency = 'ETB' | 'KES' | 'UGX' | 'RWF' | 'TZS' | 'DJF' | 'USD' | 'SSP' | 'SOS';

export type PaymentGateway =
  | 'telebirr'       // Ethiopia - Ethio Telecom
  | 'cbe_birr'       // Ethiopia - Commercial Bank of Ethiopia
  | 'chapa'          // Ethiopia & International Cards
  | 'mpesa_ke'       // Kenya - Safaricom M-PESA B2C & C2B
  | 'airtel_ke'      // Kenya - Airtel Money Kenya
  | 'mtn_ug'         // Uganda - MTN Mobile Money
  | 'airtel_ug'      // Uganda - Airtel Money Uganda
  | 'mtn_rw'         // Rwanda - MTN MoMo Rwanda
  | 'airtel_rw'      // Rwanda - Airtel Money Rwanda
  | 'mpesa_tz'       // Tanzania - Vodacom M-Pesa Tanzania
  | 'tigo_tz'        // Tanzania - Tigo Pesa Tanzania
  | 'dmoney_dj'      // Djibouti - D-Money (Djibouti Telecom)
  | 'evc_plus_so'    // Somalia - Hormuud EVC Plus
  | 'zaad_so'        // Somalia - Telesom Zaad Service
  | 'mgurush_ss'     // South Sudan - m-GURUSH Mobile Money
  | 'cash';          // Local Cash on Hand

export type PaymentStatus = 'settled' | 'pending' | 'failed' | 'refunded' | 'bank_verified';

export interface PaymentTransaction {
  id: string;
  reference: string;
  tripId: string;
  driverId: string;
  driverName: string;
  passengerName: string;
  grossFareETB: number;
  platformCommissionETB: number; // 15%
  withholdingTaxETB: number;     // 2%
  netDriverETB: number;          // 83%
  gateway: PaymentGateway;
  status: PaymentStatus;
  timestamp: string;
  countryCode?: EastAfricaCountryCode;
  currency?: EastAfricaCurrency;
  localAmount?: number;
  exchangeRateToETB?: number;
  settlementBatchId?: string;
  channelDetails?: string;
  externalRefId?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  reconciliationNotes?: string;
  reconciliationBank?: string;
}

export interface DriverWallet {
  driverId: string;
  driverName: string;
  phone: string;
  avatar?: string;
  availableBalanceETB: number;
  pendingPayoutETB: number;
  totalEarnedETB: number;
  totalCommissionPaidETB: number;
  preferredPayoutMethod: PaymentGateway | 'telebirr' | 'cbe_birr';
  payoutAccount: string;
  countryCode?: EastAfricaCountryCode;
  currency?: EastAfricaCurrency;
  lastPayoutDate?: string;
}

// In-Cab Driver PWA Companion
export type DriverAppScreen = 'offline' | 'searching' | 'offer' | 'en_route_pickup' | 'in_trip' | 'payment_summary';

export interface ActiveDriverTripOffer {
  offerId: string;
  tripId: string;
  passengerName: string;
  passengerRating: number;
  pickupAddress: string;
  dropoffAddress: string;
  fareETB: number;
  paymentMethod: PaymentGateway;
  distanceKm: number;
  durationMin: number;
  expiresAt: number; // timestamp
  coordinates?: {
    pickup: [number, number];
    dropoff: [number, number];
  };
}

// Fleet Fuel Efficiency & Tariff Compliance
export interface FleetTripCompliance {
  id: string;
  tripId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleType: 'sedan' | 'minibus' | 'cargo_truck';
  driverName: string;
  distanceKm: number;
  durationMin: number;
  routeCorridor: string;
  estimatedFuelLiters: number;
  fuelCostETB: number; // calculated at 82.60 ETB/L
  co2Kg: number;
  actualFareETB: number;
  legalMaxFareETB: number;
  complianceStatus: 'compliant' | 'tariff_exceeded' | 'undercharged';
  notes: string;
  date: string;
  countryCode?: EastAfricaCountryCode;
  currency?: EastAfricaCurrency;
  fuelCostLocal?: number;
  actualFareLocal?: number;
  legalMaxFareLocal?: number;
  exchangeRateToETB?: number;
  regulatoryAuthority?: string;
  inspectionType?: string;
  serviceModule?: 'ride' | 'truck';
  cargoWeightTons?: number;
  platformCommissionPct?: number;
  platformCommissionCapPct?: number;
  commissionCompliance?: 'compliant' | 'commission_exceeded';
  surgeMultiplierApplied?: number;
  maxSurgeCap?: number;
  variancePct?: number;
}


export type DriverDocumentType =
  | 'commercial_license'
  | 'bola_inspection'
  | 'third_party_insurance'
  | 'tin_clearance';

export type DocumentExpiryState = 'valid' | 'expiring_within_30d' | 'expired';

export interface DriverComplianceDocument {
  docType: DriverDocumentType;
  label: string;
  shortLabel: string;
  documentNumber: string;
  expiresAt: string; // YYYY-MM-DD
  daysRemaining: number;
  expiryState: DocumentExpiryState;
  pointDeduction: number;
  maxWeight: number;
}

export interface ComplianceDeductionItem {
  reason: string;
  points: number;
  severity: 'warning' | 'critical';
}

export interface DriverDocumentComplianceRecord {
  driverId: string;
  objectId?: string;
  driverName: string;
  phone: string;
  module: 'ride' | 'truck';
  vehiclePlate: string;
  vehicleModel: string;
  driverStatus: DriverStatus;
  vehicleStatus?: VehicleStatus;
  sourceClass: 'Driver' | 'DriverProfile';
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  regulatoryAuthority?: string;
  inspectionAuthority?: string;
  documents: DriverComplianceDocument[];
  complianceScore: number; // 0 - 100
  riskTier: 'compliant' | 'expiring_soon' | 'critical_expired';
  flaggedWithin30Days: boolean;
  hasExpiredDocument: boolean;
  expiringSoonCount: number;
  expiredCount: number;
  nearestExpiryDays: number;
  nearestExpiryDate: string;
  nearestExpiryLabel: string;
  deductions: ComplianceDeductionItem[];
  complianceNoticeSentAt?: string;
}

// Role-Based Access Control (RBAC) & Governance
export type AdminRole =
  | 'Super Admin'
  | 'Ride Manager'
  | 'Freight Coordinator'
  | 'Finance Auditor'
  | 'Support Analyst';

export type PermissionAction =
  | 'manage_modules'
  | 'manage_ride'
  | 'manage_freight'
  | 'manage_customers'
  | 'manage_finance'
  | 'manage_approvals'
  | 'manage_pricing_flags';

// Customer & Corporate Shipper Directory Entity
export type CustomerAccountType = 'Ride Passenger' | 'Corporate Shipper';
export type CustomerAccountStatus = 'Active' | 'Corporate' | 'Suspended';

export interface CustomerAccount {
  objectId?: string;
  customerId: string;
  name: string;
  phone: string;
  email: string;
  accountType: CustomerAccountType;
  companyTin?: string;
  tripsCount: number;
  totalSpentETB: number;
  status: CustomerAccountStatus;
  notes?: string;
  joinedDate: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  city?: string;
  currency?: EastAfricaCurrency;
  totalSpentLocal?: number;
  paymentRail?: string;
  taxNumberLabel?: string;
  corridor?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface Back4AppCloudStatus {
  online: boolean;
  latency: number;
  appName: string;
  maskedAppId: string;
  maskedClientKey: string;
  proxyEndpoint: string;
  timestamp?: string;
}

// -----------------------------------------------------------------------------
// Afronala Flutter SuperApp Unified Governance & Monorepo Types
// -----------------------------------------------------------------------------

export interface SuperAppVerificationItem {
  id: string;
  queue: 'document' | 'vehicle' | 'service_activation' | 'eligibility';
  applicantName: string;
  applicantRole: 'driver' | 'vehicle_owner';
  phone: string;
  serviceType: 'ride' | 'truck';
  documentOrVehicleLabel: string;
  identifierCode: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  eligibilityScore: number;
  missingChecks: string[];
  notes?: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  regulatorShort?: string;
  regulatorName?: string;
  corridorName?: string;
}

export interface SuperAppFreightBid {
  bidId: string;
  bookingId: string;
  providerId: string;
  providerName: string;
  providerType: 'independent_driver' | 'vehicle_owner_fleet';
  truckId: string;
  truckPlate: string;
  truckModel: string;
  amountETB: number;
  etaMinutes: number;
  rating: number;
  autoSelected: boolean;
  status: 'open' | 'awarded' | 'declined';
  submittedAt: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  currency?: EastAfricaCurrency;
  amountLocal?: number;
  corridorName?: string;
}

export interface SuperAppTruckBookingLoad {
  bookingId: string;
  shipperName: string;
  origin: string;
  destination: string;
  cargoCategory: string;
  weightTons: number;
  priority: 'normal' | 'urgent' | 'express';
  priorityMultiplier: number;
  requiredTrucks: number;
  allocatedTrucks: number;
  biddingWindowEndsInMin: number;
  autoBidEnabled: boolean;
  estimatedBudgetETB: number;
  status: 'bidding_open' | 'partially_allocated' | 'allocated' | 'in_transit' | 'completed';
  escrowId: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  currency?: EastAfricaCurrency;
  estimatedBudgetLocal?: number;
  corridorName?: string;
}

export interface SuperAppFleetTruck {
  truckId: string;
  plate: string;
  model: string;
  capacityTons: number;
  serviceType: 'truck' | 'ride';
  ownerId: string;
  ownerName: string;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  assignedDriverPhone: string | null;
  status: 'active' | 'idle' | 'maintenance';
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  homeDepot?: string;
}

export interface SuperAppDriverInvitation {
  invitationId: string;
  ownerId: string;
  ownerName: string;
  driverName: string;
  driverPhone: string;
  targetTruckId: string;
  targetTruckPlate: string;
  revenueSplitDriverPct: number;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  sentAt: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
}

export interface SuperAppEscrowRecord {
  escrowId: string;
  bookingId: string;
  payerName: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'driver' | 'vehicle_owner_fleet';
  paymentRail: PaymentGateway | 'telebirr' | 'cbe_birr' | 'mpesa_et' | 'bank_rtgs' | 'card' | 'cash' | string;
  grossAmountETB: number;
  platformMarginETB: number;
  taxWithheldETB: number;
  netPayoutETB: number;
  status: 'held_in_escrow' | 'payout_ready' | 'released' | 'disputed';
  updatedAt: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  currency?: EastAfricaCurrency;
  grossAmountLocal?: number;
  netPayoutLocal?: number;
  platformMarginLocal?: number;
  taxWithheldLocal?: number;
  localPaymentRail?: string;
}

export interface SuperAppSurgeZone {
  zoneId: string;
  zoneName: string;
  serviceType: 'ride' | 'truck';
  activeRequests: number;
  availableDrivers: number;
  currentMultiplier: number;
  autoSurgeEnabled: boolean;
  updatedAt: string;
  countryCode?: EastAfricaCountryCode;
  city?: string;
  corridor?: string;
  currency?: EastAfricaCurrency;
}

export interface SuperAppFeatureFlagItem {
  key: string;
  name: string;
  serviceType: 'ride' | 'truck' | 'food' | 'delivery' | 'platform';
  enabled: boolean;
  rolloutPercentage: number;
  targetRoles: ('customer' | 'driver' | 'vehicle_owner' | 'admin')[];
  countries?: EastAfricaCountryCode[];
  description: string;
  updatedAt: string;
}

export interface RegionalCountryPricingContext {
  countryCode: EastAfricaCountryCode;
  countryName: string;
  flag: string;
  currency: EastAfricaCurrency;
  currencySymbol: string;
  exchangeRateToETB: number;
  regulator: string;
  rideBaseFare: number;
  ridePerKm: number;
  ridePerMin: number;
  truckBaseFare: number;
  truckPerTonKm: number;
  biddingFloorPct: number;
  biddingCeilingPct: number;
  platformMarginPct: number;
  withholdingTaxPct: number;
  autoBidWindowMinutes: number;
  corridorNotes?: string;
}

export interface SuperAppRuntimeConfig {
  bookingPriorities: {
    normal: number;
    urgent: number;
    express: number;
  };
  availableTransportCategories: string[];
  pricingFinancialContext: {
    rideBaseFareETB: number;
    ridePerKmETB: number;
    ridePerMinETB: number;
    truckBaseFareETB: number;
    truckPerTonKmETB: number;
    biddingFloorPct: number;
    biddingCeilingPct: number;
    platformMarginPct: number;
    withholdingTaxPct: number;
    autoBidWindowMinutes: number;
  };
  regionalCountryPricing?: Record<string, RegionalCountryPricingContext>;
  regionalSurgeZones: SuperAppSurgeZone[];
  featureFlags: SuperAppFeatureFlagItem[];
  updatedAt: string;
}

export interface CloudRpcResponse<T = any> {
  result: T;
  executionMode: 'live-cloud-function' | 'dual-bridge-synthesized';
  latencyMs: number;
  parseNotice?: string;
}

export interface SuperAppPackageSummary {
  name: string;
  relativePath: string;
  category: 'entry' | 'mini_app' | 'shared_module' | 'backend_cloud';
  description: string;
  version: string;
  dartFileCount: number;
  totalFileCount: number;
  dependencies: string[];
  adminScreens: string[];
  sampleFile: string;
}

export interface SuperAppMiniAppEntry {
  id: string;
  title: string;
  serviceType: string;
  requiredRoles: string[];
  packagePath: string;
  enabledByDefault: boolean;
}

export interface SuperAppParseClassContract {
  className: string;
  adminBridgeClass: string;
  bridgeMode: 'Native + Dual-Mapped' | 'Native Direct' | 'System Built-In';
  domain: string;
  extractedFields: string[];
  referencedInPackages: string[];
  sampleSourceFile?: string;
}

export interface SuperAppCloudFunctionContract {
  functionName: string;
  domain: string;
  mutating: boolean;
  requiredRoles: string[];
  referencedInFiles: string[];
  samplePayload: Record<string, any>;
  description: string;
}

export interface SuperAppMonorepoManifest {
  archiveFileName: string;
  archiveSizeBytes: number;
  parsedAt: string;
  workspaceName: string;
  flutterSdkConstraint: string;
  dartSdkConstraint: string;
  totalEntries: number;
  totalDartFiles: number;
  totalCloudJsFiles: number;
  packages: SuperAppPackageSummary[];
  miniAppDescriptors: SuperAppMiniAppEntry[];
  parseClasses: SuperAppParseClassContract[];
  cloudFunctions: SuperAppCloudFunctionContract[];
  cloudJobs: { name: string; filePath: string; description: string }[];
}

export interface SuperAppClassSyncAuditRow {
  className: string;
  adminBridgeClass: string;
  reachableOnBack4App: boolean;
  statusCode: number;
  sampleRecordPresent: boolean;
  latencyMs: number;
  syncStatus: 'Synced & Active' | 'Schema Ready (Empty)' | 'Unprovisioned / Restricted';
}

export interface ConnectivityPingResult {
  id: string;
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'unreachable';
  totalRoundTripMs: number;
  parseBaseUrl: string;
  maskedAppId: string;
  maskedClientKey: string;
  simulatedFault?: '502-gateway' | 'handshake-failure' | null;
  handshake: {
    ok: boolean;
    statusCode: number;
    latencyMs: number;
    detail: string;
  };
  session: {
    valid: boolean;
    mode: 'apk-session-token' | 'proxy-rest-authority';
    statusCode: number;
    latencyMs: number;
    principal: string;
    detail: string;
  };
  connectionTest: {
    className: 'ConnectionTest';
    probeNonce: string;
    objectId: string | null;
    writeOk: boolean;
    writeStatus: number;
    writeLatencyMs: number;
    writeError?: string;
    readOk: boolean;
    readStatus: number;
    readLatencyMs: number;
    nonceMatched: boolean;
    readError?: string;
    cleanupExecuted: boolean;
    cleanupOk: boolean;
    cleanupLatencyMs: number;
  };
  countryTelemetry?: EastAfricaCountryNodeTelemetry;
}

export interface EastAfricaCountryNodeTelemetry {
  countryCode: EastAfricaCountryCode;
  countryName: string;
  flag: string;
  capital: string;
  currency: EastAfricaCurrency;
  edgeNodeHostname: string;
  edgeLatencyMs: number;
  edgeStatus: 'healthy' | 'degraded' | 'offline';
  telecomCarriers: {
    name: string;
    type: string;
    signalStatus: 'excellent' | 'good' | 'congested';
    pingMs: number;
  }[];
  primaryPaymentGateway: {
    name: string;
    provider: string;
    status: 'active' | 'degraded';
    successRatePct: number;
    webhookLatencyMs: number;
  };
  regulatoryAgency: {
    name: string;
    acronym: string;
    syncStatus: 'synchronized' | 'pending' | 'warning';
    lastSyncIso: string;
    monitoredItems: string;
  };
  primaryCorridor: {
    name: string;
    flowStatus: 'normal' | 'congested' | 'delayed';
    activeTrucks: number;
    avgSpeedKmh: number;
  };
  activeApkDriversCount: number;
  onlineVehiclesCount: number;
  openDispatchJobsCount: number;
  complianceHealthScore: number;
}

export interface EastAfricaNodeDiagnosticSummary {
  countryCode: Exclude<EastAfricaCountryCode, 'ALL'>;
  countryName: string;
  flag: string;
  capital: string;
  currency: EastAfricaCurrency;
  edgeNodeHostname: string;
  status: 'healthy' | 'degraded' | 'unreachable';
  latencyMs: number;
  paymentGateway: string;
  gatewaySuccessRate: number;
  regulatorAcronym: string;
  primaryCorridor: string;
  activeDrivers: number;
  apkVersion: string;
  lastPingIso: string;
}

export type DiagnosticAutoFixAction = 'reset_session_tokens' | 'full_schema_resync';

export interface DiagnosticAutoFixReport {
  id: string;
  action: DiagnosticAutoFixAction;
  triggeredBy: string;
  executedAt: string;
  durationMs: number;
  success: boolean;
  summary: string;
  stepsCompleted: string[];
  syncedClassesCount?: number;
  revokedSessionToken?: boolean;
  postFixPingStatus: 'healthy' | 'degraded' | 'unreachable';
  postFixPing?: ConnectivityPingResult;
}

export type MobileActivityCategory =
  | 'user_login'
  | 'ride_request'
  | 'truck_booking'
  | 'driver_status'
  | 'system';

export type AlertRuleMetricCategory =
  | 'all'
  | 'user_login'
  | 'ride_request'
  | 'truck_booking'
  | 'driver_status';

export type AlertRuleOperator = '>' | '>=';

export type AlertRuleSeverity = 'warning' | 'critical';

export interface ActivityAlertRule {
  id: string;
  name: string;
  category: AlertRuleMetricCategory;
  operator: AlertRuleOperator;
  threshold: number;
  windowMinutes: number;
  severity: AlertRuleSeverity;
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface TriggeredActivityPulse {
  id: string;
  ruleId: string;
  ruleName: string;
  category: AlertRuleMetricCategory;
  operator: AlertRuleOperator;
  threshold: number;
  observedCount: number;
  windowMinutes: number;
  severity: AlertRuleSeverity;
  triggeredAt: string;
  acknowledged: boolean;
  isSimulatedTest?: boolean;
}

export interface ActivityStreamEvent {
  id: string;
  objectId: string;
  sourceClass:
    | 'ActivityLog'
    | '_User'
    | 'Ride'
    | 'Booking'
    | 'Trip'
    | 'TruckBooking'
    | 'Shipment'
    | 'Driver'
    | 'ConnectionTest';
  category: MobileActivityCategory;
  eventType: string;
  actorName: string;
  actorRole: string;
  summary: string;
  referenceId: string;
  statusLabel: string;
  platform: string;
  countryCode?: EastAfricaCountryCode;
  countryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityStreamResponse {
  fetchedAt: string;
  totalLatencyMs: number;
  readOnly: boolean;
  strictActivityLogOnly: boolean;
  activityLogStatus: {
    queriedClass: 'ActivityLog';
    reachable: boolean;
    statusCode: number;
    nativeRecordCount: number;
    latencyMs: number;
    parseError?: string;
  };
  events: ActivityStreamEvent[];
}

export interface Back4AppInferredField {
  name: string;
  type: 'String' | 'Number' | 'Boolean' | 'Date' | 'GeoPoint' | 'Pointer' | 'Array' | 'Object (JSON)';
  pointerTarget?: string;
  nonNullCount: number;
  uniqueCount: number;
  sampleValues: any[];
}

export interface Back4AppClassPointerRel {
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
  columns: Back4AppInferredField[];
  outgoingPointers: Back4AppClassPointerRel[];
  incomingPointers: { sourceClass: string; sourceColumn: string }[];
  fileSizeBytes: number;
  lastModifiedIso: string;
  countryCounts?: Record<string, number>;
}

export interface Back4AppUploadedClassesManifest {
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

export interface Back4AppClassDetailResponse {
  summary: Back4AppClassSummary;
  records: Record<string, any>[];
  countryBreakdown?: Record<string, number>;
}



