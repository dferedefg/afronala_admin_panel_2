import type {
  SuperAppCloudFunctionContract,
  SuperAppMiniAppEntry,
  SuperAppMonorepoManifest,
  SuperAppPackageSummary,
  SuperAppParseClassContract,
} from '../src/types/index.ts';

const VIRTUAL_ARCHIVE_FILES: Record<string, string> = {
  'pubspec.yaml': `name: afronala_superapp_workspace
description: Afronala Unified Mobility, Freight & Fintech Flutter Monorepo
publish_to: 'none'

environment:
  sdk: '>=3.4.0 <4.0.0'
  flutter: '>=3.22.0 <4.0.0'

dev_dependencies:
  melos: ^6.1.0
  very_good_analysis: ^6.0.0
`,
  'apps/superapp_shell/pubspec.yaml': `name: superapp_shell
description: Unified launcher shell, role gate, and mini-app host container
version: 2.4.0

environment:
  sdk: '>=3.4.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  core_network:
    path: ../../packages/core_network
  unified_registry:
    path: ../../packages/unified_registry
  flutter_bloc: ^8.1.6
`,
  'apps/superapp_shell/lib/main.dart': `import 'package:flutter/material.dart';
import 'package:core_network/back4app_client.dart';
import 'package:unified_registry/unified_app_registry.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Back4AppClient.instance.initialize();
  final runtimeConfig = await Back4AppClient.instance.fetchRuntimeConfig();
  UnifiedAppRegistry.instance.hydrateFlags(runtimeConfig);
  runApp(const AfronalaShellApp());
}

class AfronalaShellApp extends StatelessWidget {
  const AfronalaShellApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Afronala SuperApp',
      debugShowCheckedModeBanner: false,
      home: Scaffold(body: Center(child: Text('Afronala Unified Launcher'))),
    );
  }
}
`,
  'apps/customer_ride_app/pubspec.yaml': `name: customer_ride_app
description: Passenger ride-hailing, corridor surge preview, and AmbaLay live ETA tracking
version: 2.4.0

dependencies:
  flutter:
    sdk: flutter
  core_network:
    path: ../../packages/core_network
  pricing_engine:
    path: ../../packages/pricing_engine
`,
  'apps/customer_ride_app/lib/ride_booking_controller.dart': `import 'package:core_network/back4app_client.dart';

class RideBookingController {
  final Back4AppClient _client;
  RideBookingController(this._client);

  Future<Map<String, dynamic>> fetchZoneSurge(String zoneId) async {
    return _client.callCloudFunction('getCurrentSurge', {'zoneId': zoneId});
  }
}
`,
  'apps/driver_app/pubspec.yaml': `name: driver_app
description: Independent & fleet-bound driver dispatch terminal, KYC upload, and wallet payouts
version: 2.4.0

dependencies:
  flutter:
    sdk: flutter
  core_network:
    path: ../../packages/core_network
`,
  'apps/driver_app/lib/driver_compliance_service.dart': `import 'package:core_network/back4app_client.dart';

class DriverComplianceService {
  final Back4AppClient _client;
  DriverComplianceService(this._client);

  Future<Map<String, dynamic>> checkEligibility(String driverId) {
    return _client.callCloudFunction('evaluateBatchDriverEligibility', {
      'driverId': driverId,
      'scope': 'single_driver',
    });
  }
}
`,
  'apps/vehicle_owner_app/pubspec.yaml': `name: vehicle_owner_app
description: Three-sided marketplace fleet owner console, 1:1 truck-driver binding, and freight bidding
version: 2.4.0

dependencies:
  flutter:
    sdk: flutter
  core_network:
    path: ../../packages/core_network
  escrow_ledger:
    path: ../../packages/escrow_ledger
`,
  'apps/vehicle_owner_app/lib/fleet_assignment_repository.dart': `import 'package:core_network/back4app_client.dart';

class FleetAssignmentRepository {
  final Back4AppClient _client;
  FleetAssignmentRepository(this._client);

  Future<Map<String, dynamic>> listFleetState({int page = 1, int limit = 50}) {
    return _client.callCloudFunction('getTrucksPaginated', {
      'page': page,
      'limit': limit,
    });
  }

  Future<Map<String, dynamic>> bindDriverToTruck({
    required String truckId,
    required String driverId,
  }) {
    return _client.callCloudFunction('assignTruckToDriver', {
      'truckId': truckId,
      'driverId': driverId,
    });
  }
}
`,
  'packages/core_network/pubspec.yaml': `name: core_network
description: Back4App Parse REST & Cloud RPC transport with circuit breaker and AmbaLay Maps adapter
version: 1.9.2

dependencies:
  dio: ^5.5.0
  parse_server_sdk_flutter: ^8.0.0
`,
  'back4app_client.dart': `import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class Back4AppClient {
  Back4AppClient._();
  static final Back4AppClient instance = Back4AppClient._();

  Future<void> initialize() async {
    const appId = String.fromEnvironment('BACK4APP_APP_ID');
    const clientKey = String.fromEnvironment('BACK4APP_CLIENT_KEY');
    await Parse().initialize(
      appId,
      'https://parseapi.back4app.com',
      clientKey: clientKey,
      autoSendSessionId: true,
    );
  }

  Future<Map<String, dynamic>> fetchRuntimeConfig() async {
    final response = await ParseConfig().getConfigs();
    return response.result is Map<String, dynamic>
        ? response.result as Map<String, dynamic>
        : <String, dynamic>{};
  }

  Future<Map<String, dynamic>> callCloudFunction(
    String name,
    Map<String, dynamic> params,
  ) async {
    final fn = ParseCloudFunction(name);
    final res = await fn.execute(parameters: params);
    if (res.success && res.result is Map<String, dynamic>) {
      return res.result as Map<String, dynamic>;
    }
    throw Exception(res.error?.message ?? 'Cloud RPC failed: $name');
  }
}
`,
  'packages/unified_registry/pubspec.yaml': `name: unified_registry
description: FeatureFlag evaluation and role-gated mini-app registry descriptors
version: 1.4.0

dependencies:
  flutter:
    sdk: flutter
`,
  'packages/unified_registry/lib/unified_app_registry.dart': `class UnifiedAppRegistry {
  UnifiedAppRegistry._();
  static final UnifiedAppRegistry instance = UnifiedAppRegistry._();

  final Map<String, bool> _flags = {};

  void hydrateFlags(Map<String, dynamic> runtimeConfig) {
    final rawFlags = runtimeConfig['featureFlags'];
    if (rawFlags is List) {
      for (final item in rawFlags) {
        if (item is Map && item['key'] is String) {
          _flags[item['key'] as String] = item['enabled'] == true;
        }
      }
    }
  }

  bool isEnabled(String key) => _flags[key] ?? false;
}
`,
  'packages/pricing_engine/pubspec.yaml': `name: pricing_engine
description: Shared PricingFinancialContext tariff calculator and booking priority multipliers
version: 1.6.1

dependencies:
  meta: ^1.12.0
`,
  'packages/pricing_engine/lib/pricing_config_service.dart': `class PricingFinancialContext {
  final double rideBaseFareETB;
  final double ridePerKmETB;
  final double ridePerMinETB;
  final double truckBaseFareETB;
  final double truckPerTonKmETB;
  final double platformMarginPct;
  final double withholdingTaxPct;

  const PricingFinancialContext({
    required this.rideBaseFareETB,
    required this.ridePerKmETB,
    required this.ridePerMinETB,
    required this.truckBaseFareETB,
    required this.truckPerTonKmETB,
    required this.platformMarginPct,
    required this.withholdingTaxPct,
  });
}
`,
  'packages/escrow_ledger/pubspec.yaml': `name: escrow_ledger
description: Freight Escrow state machine and Telebirr / CBE Birr / RTGS settlement models
version: 1.5.0

dependencies:
  meta: ^1.12.0
`,
  'packages/escrow_ledger/lib/escrow_settlement_client.dart': `import 'package:core_network/back4app_client.dart';

class EscrowSettlementClient {
  final Back4AppClient _client;
  EscrowSettlementClient(this._client);

  Future<Map<String, dynamic>> releaseMilestone(String escrowId) {
    return _client.callCloudFunction('releaseEscrowMilestone', {
      'escrowId': escrowId,
    });
  }
}
`,
  'cloud/main.js': `// Afronala Back4App Parse Cloud Code Entrypoint
require('./functions/approvals');
require('./functions/fleet_bidding');
require('./functions/escrow_payouts');
require('./functions/pricing_flags');
require('./jobs/auto_bid_selection');
`,
  'cloud/jobs/auto_bid_selection.js': `Parse.Cloud.job('autoBidSelectionJob', async (request) => {
  const { message } = request;
  message('Scanning open TruckBooking bidding windows...');
  const query = new Parse.Query('TruckBooking');
  query.equalTo('status', 'bidding_open');
  query.equalTo('autoBidEnabled', true);
  const openLoads = await query.find({ useMasterKey: true });
  message(\`Evaluated \${openLoads.length} active multi-truck freight loads.\`);
});
`,
};

const PACKAGES: SuperAppPackageSummary[] = [
  {
    name: 'superapp_shell',
    relativePath: 'apps/superapp_shell',
    category: 'entry',
    description: 'Unified SuperApp launcher, Parse session bootstrap, and role-gated mini-app host.',
    version: '2.4.0',
    dartFileCount: 28,
    totalFileCount: 36,
    dependencies: ['flutter_bloc', 'core_network', 'unified_registry', 'go_router'],
    adminScreens: ['UnifiedAppRegistry Role Gate', 'Bridge Diagnostics'],
    sampleFile: 'apps/superapp_shell/lib/main.dart',
  },
  {
    name: 'customer_ride_app',
    relativePath: 'apps/customer_ride_app',
    category: 'mini_app',
    description: 'City ride-hailing, AmbaLay turn-by-turn routing, and corridor surge fare preview.',
    version: '2.4.0',
    dartFileCount: 34,
    totalFileCount: 42,
    dependencies: ['core_network', 'pricing_engine', 'geolocator', 'dio'],
    adminScreens: ['Ride Module', 'Regional Surge Controller'],
    sampleFile: 'apps/customer_ride_app/lib/ride_booking_controller.dart',
  },
  {
    name: 'driver_app',
    relativePath: 'apps/driver_app',
    category: 'mini_app',
    description: 'Driver dispatch terminal, Bola/TIN document compliance uploader, and earnings wallet.',
    version: '2.4.0',
    dartFileCount: 31,
    totalFileCount: 39,
    dependencies: ['core_network', 'parse_server_sdk_flutter', 'geolocator'],
    adminScreens: ['Approvals & Eligibility', 'Fleet Compliance'],
    sampleFile: 'apps/driver_app/lib/driver_compliance_service.dart',
  },
  {
    name: 'vehicle_owner_app',
    relativePath: 'apps/vehicle_owner_app',
    category: 'mini_app',
    description: 'Fleet owner console with strict 1-driver-per-truck binding, invitations, and carrier bidding.',
    version: '2.4.0',
    dartFileCount: 26,
    totalFileCount: 33,
    dependencies: ['core_network', 'escrow_ledger', 'flutter_bloc'],
    adminScreens: ['Vehicle Owner Fleet, Truck Bidding & Escrow Desk'],
    sampleFile: 'apps/vehicle_owner_app/lib/fleet_assignment_repository.dart',
  },
  {
    name: 'core_network',
    relativePath: 'packages/core_network',
    category: 'shared_module',
    description: 'Back4AppClient circuit-breaker HTTP/Parse SDK wrapper and AmbaLay Maps client.',
    version: '1.9.2',
    dartFileCount: 11,
    totalFileCount: 14,
    dependencies: ['parse_server_sdk_flutter', 'dio'],
    adminScreens: ['Bridge Diagnostics', 'LiveQuery & Webhooks'],
    sampleFile: 'back4app_client.dart',
  },
  {
    name: 'unified_registry',
    relativePath: 'packages/unified_registry',
    category: 'shared_module',
    description: 'FeatureFlag rollout evaluator and UnifiedAppRegistry mini-app descriptor resolver.',
    version: '1.4.0',
    dartFileCount: 6,
    totalFileCount: 8,
    dependencies: ['flutter'],
    adminScreens: ['FeatureFlags & UnifiedAppRegistry'],
    sampleFile: 'packages/unified_registry/lib/unified_app_registry.dart',
  },
  {
    name: 'pricing_engine',
    relativePath: 'packages/pricing_engine',
    category: 'shared_module',
    description: 'PricingFinancialContext tariff math, priority multipliers, and commission/tax splits.',
    version: '1.6.1',
    dartFileCount: 6,
    totalFileCount: 8,
    dependencies: ['meta'],
    adminScreens: ['Pricing & Priorities'],
    sampleFile: 'packages/pricing_engine/lib/pricing_config_service.dart',
  },
  {
    name: 'escrow_ledger',
    relativePath: 'packages/escrow_ledger',
    category: 'backend_cloud',
    description: 'Multi-rail freight escrow lock, milestone verification, and Telebirr/CBE disbursement.',
    version: '1.5.0',
    dartFileCount: 5,
    totalFileCount: 14,
    dependencies: ['core_network', 'meta'],
    adminScreens: ['Escrow & Multi-Rail Payouts'],
    sampleFile: 'packages/escrow_ledger/lib/escrow_settlement_client.dart',
  },
];

const MINI_APP_DESCRIPTORS: SuperAppMiniAppEntry[] = [
  {
    id: 'mini.ride_hailing',
    title: 'Afronala City Ride',
    serviceType: 'ride',
    requiredRoles: ['customer', 'driver'],
    packagePath: 'apps/customer_ride_app',
    enabledByDefault: true,
  },
  {
    id: 'mini.truck_freight',
    title: 'Regional Truck & Multi-Load Freight',
    serviceType: 'truck',
    requiredRoles: ['customer', 'driver', 'vehicle_owner'],
    packagePath: 'apps/vehicle_owner_app',
    enabledByDefault: true,
  },
  {
    id: 'mini.fleet_owner_hub',
    title: 'Vehicle Owner Fleet & Bidding Console',
    serviceType: 'truck',
    requiredRoles: ['vehicle_owner', 'admin'],
    packagePath: 'apps/vehicle_owner_app',
    enabledByDefault: true,
  },
  {
    id: 'mini.driver_terminal',
    title: 'Driver Dispatch & KYC Wallet',
    serviceType: 'ride',
    requiredRoles: ['driver'],
    packagePath: 'apps/driver_app',
    enabledByDefault: true,
  },
  {
    id: 'mini.food_delivery',
    title: 'Addis Cloud Kitchens & Meal Delivery',
    serviceType: 'food',
    requiredRoles: ['customer', 'driver'],
    packagePath: 'apps/superapp_shell',
    enabledByDefault: false,
  },
];

const PARSE_CLASSES: SuperAppParseClassContract[] = [
  {
    className: '_User',
    adminBridgeClass: '_User / Customer',
    bridgeMode: 'System Built-In',
    domain: 'Identity & Auth',
    extractedFields: ['username', 'email', 'phone', 'activeRole', 'isVerified'],
    referencedInPackages: ['superapp_shell', 'core_network'],
    sampleSourceFile: 'apps/superapp_shell/lib/main.dart',
  },
  {
    className: 'DriverProfile',
    adminBridgeClass: 'Driver',
    bridgeMode: 'Native + Dual-Mapped',
    domain: 'Approvals & Compliance',
    extractedFields: [
      'fullName',
      'phone',
      'serviceType',
      'verificationStatus',
      'licenseExpiryDate',
      'bolaInspectionExpiryDate',
      'insuranceExpiryDate',
      'tinClearanceExpiryDate',
    ],
    referencedInPackages: ['driver_app', 'vehicle_owner_app'],
    sampleSourceFile: 'apps/driver_app/lib/driver_compliance_service.dart',
  },
  {
    className: 'Vehicle',
    adminBridgeClass: 'Vehicle',
    bridgeMode: 'Native Direct',
    domain: 'Fleet & Compliance',
    extractedFields: ['plate', 'model', 'driverName', 'status', 'capacity', 'module', 'year'],
    referencedInPackages: ['driver_app', 'vehicle_owner_app'],
    sampleSourceFile: 'apps/vehicle_owner_app/lib/fleet_assignment_repository.dart',
  },
  {
    className: 'Ride',
    adminBridgeClass: 'Trip',
    bridgeMode: 'Native + Dual-Mapped',
    domain: 'Mobility Dispatch',
    extractedFields: [
      'tripId',
      'passengerName',
      'driverName',
      'pickupAddress',
      'dropoffAddress',
      'fareETB',
      'distanceKm',
      'status',
    ],
    referencedInPackages: ['customer_ride_app', 'driver_app'],
    sampleSourceFile: 'apps/customer_ride_app/lib/ride_booking_controller.dart',
  },
  {
    className: 'TruckBooking',
    adminBridgeClass: 'Shipment',
    bridgeMode: 'Native + Dual-Mapped',
    domain: 'Freight & Bidding',
    extractedFields: [
      'bookingId',
      'shipperName',
      'origin',
      'destination',
      'cargoCategory',
      'weightTons',
      'priority',
      'requiredTrucks',
      'allocatedTrucks',
      'status',
    ],
    referencedInPackages: ['vehicle_owner_app', 'driver_app'],
    sampleSourceFile: 'apps/vehicle_owner_app/lib/fleet_assignment_repository.dart',
  },
  {
    className: 'Bid',
    adminBridgeClass: 'Bid',
    bridgeMode: 'Native Direct',
    domain: 'Freight & Bidding',
    extractedFields: ['bidId', 'bookingId', 'providerName', 'truckPlate', 'amountETB', 'etaMinutes', 'status'],
    referencedInPackages: ['vehicle_owner_app', 'driver_app'],
    sampleSourceFile: 'cloud/jobs/auto_bid_selection.js',
  },
  {
    className: 'DriverInvitation',
    adminBridgeClass: 'DriverInvitation',
    bridgeMode: 'Native Direct',
    domain: 'Vehicle Owner Fleet',
    extractedFields: [
      'invitationId',
      'ownerName',
      'driverName',
      'driverPhone',
      'targetTruckPlate',
      'revenueSplitDriverPct',
      'status',
    ],
    referencedInPackages: ['vehicle_owner_app', 'driver_app'],
    sampleSourceFile: 'apps/vehicle_owner_app/lib/fleet_assignment_repository.dart',
  },
  {
    className: 'Escrow',
    adminBridgeClass: 'Escrow',
    bridgeMode: 'Native Direct',
    domain: 'Fintech & Settlements',
    extractedFields: [
      'escrowId',
      'bookingId',
      'payerName',
      'recipientName',
      'paymentRail',
      'grossAmountETB',
      'netPayoutETB',
      'status',
    ],
    referencedInPackages: ['escrow_ledger', 'vehicle_owner_app'],
    sampleSourceFile: 'packages/escrow_ledger/lib/escrow_settlement_client.dart',
  },
  {
    className: 'FeatureFlag',
    adminBridgeClass: 'SuperAppRuntimeConfig',
    bridgeMode: 'Native + Dual-Mapped',
    domain: 'Platform Config',
    extractedFields: ['key', 'name', 'serviceType', 'enabled', 'rolloutPercentage', 'targetRoles'],
    referencedInPackages: ['unified_registry', 'superapp_shell'],
    sampleSourceFile: 'packages/unified_registry/lib/unified_app_registry.dart',
  },
  {
    className: 'ModuleRegistry',
    adminBridgeClass: 'ModuleRegistry',
    bridgeMode: 'Native Direct',
    domain: 'Platform Config',
    extractedFields: ['moduleId', 'key', 'name', 'enabled', 'category', 'canToggle'],
    referencedInPackages: ['superapp_shell', 'unified_registry'],
    sampleSourceFile: 'packages/unified_registry/lib/unified_app_registry.dart',
  },
  {
    className: 'ActivityLog',
    adminBridgeClass: 'ActivityLog',
    bridgeMode: 'Native Direct',
    domain: 'Mobile Telemetry',
    extractedFields: ['eventType', 'actorName', 'actorRole', 'referenceId', 'status', 'platform'],
    referencedInPackages: ['core_network', 'superapp_shell'],
    sampleSourceFile: 'back4app_client.dart',
  },
];

const CLOUD_FUNCTIONS: SuperAppCloudFunctionContract[] = [
  {
    functionName: 'getPlatformMetrics',
    domain: 'Auth & System',
    mutating: false,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator', 'Finance Auditor', 'Support Analyst'],
    referencedInFiles: ['apps/superapp_shell/lib/main.dart'],
    samplePayload: { includeEscrowSummary: true },
    description: 'Returns real-time SuperApp marketplace counters across verification queues, fleet trucks, bids, and escrow.',
  },
  {
    functionName: 'admin_getPendingDocuments',
    domain: 'Approvals & Compliance',
    mutating: false,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator', 'Finance Auditor', 'Support Analyst'],
    referencedInFiles: ['apps/driver_app/lib/driver_compliance_service.dart'],
    samplePayload: { includeAllQueues: true },
    description: 'Lists driver KYC, vehicle Bola inspection, role activation, and eligibility submissions.',
  },
  {
    functionName: 'admin_verifyDocument',
    domain: 'Approvals & Compliance',
    mutating: true,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator'],
    referencedInFiles: ['apps/driver_app/lib/driver_compliance_service.dart'],
    samplePayload: { targetId: 'VER-401', decision: 'approved', notes: 'Commercial license verified' },
    description: 'Approves or flags submitted driver identity and tax clearance documents.',
  },
  {
    functionName: 'approveVehicleVerification',
    domain: 'Approvals & Compliance',
    mutating: true,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator'],
    referencedInFiles: ['apps/driver_app/lib/driver_compliance_service.dart'],
    samplePayload: { targetId: 'VER-402', decision: 'approved', notes: 'Bola annual inspection valid' },
    description: 'Marks a fleet vehicle inspection record as verified for active dispatch.',
  },
  {
    functionName: 'rejectVehicleVerification',
    domain: 'Approvals & Compliance',
    mutating: true,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator'],
    referencedInFiles: ['apps/driver_app/lib/driver_compliance_service.dart'],
    samplePayload: { targetId: 'VER-402', decision: 'rejected', reason: 'Unreadable Bola inspection stamp' },
    description: 'Rejects a vehicle submission with mandatory compliance remediation notes.',
  },
  {
    functionName: 'revertVehicleVerification',
    domain: 'Approvals & Compliance',
    mutating: true,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator'],
    referencedInFiles: ['apps/driver_app/lib/driver_compliance_service.dart'],
    samplePayload: { targetId: 'VER-402', decision: 'pending' },
    description: 'Reverts an approved or rejected verification record back to the pending triage queue.',
  },
  {
    functionName: 'approveServiceActivation',
    domain: 'Approvals & Compliance',
    mutating: true,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator'],
    referencedInFiles: ['apps/driver_app/lib/driver_compliance_service.dart'],
    samplePayload: { targetId: 'VER-403', decision: 'approved' },
    description: 'Activates ride or heavy-freight mini-app dispatch privileges for an applicant.',
  },
  {
    functionName: 'rejectDriverRequest',
    domain: 'Approvals & Compliance',
    mutating: true,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator'],
    referencedInFiles: ['apps/driver_app/lib/driver_compliance_service.dart'],
    samplePayload: { targetId: 'VER-403', decision: 'rejected', reason: 'Missing TIN certificate' },
    description: 'Declines a driver or service activation request and notifies the mobile applicant.',
  },
  {
    functionName: 'evaluateBatchDriverEligibility',
    domain: 'Approvals & Compliance',
    mutating: false,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator', 'Support Analyst'],
    referencedInFiles: ['apps/driver_app/lib/driver_compliance_service.dart'],
    samplePayload: { scope: 'all_pending' },
    description: 'Computes composite 0-100 eligibility scores across license, Bola, insurance, and TIN checks.',
  },
  {
    functionName: 'getTrucksPaginated',
    domain: 'Fleet, Bidding & Escrow',
    mutating: false,
    requiredRoles: ['Super Admin', 'Freight Coordinator', 'Finance Auditor', 'Support Analyst'],
    referencedInFiles: ['apps/vehicle_owner_app/lib/fleet_assignment_repository.dart'],
    samplePayload: { page: 1, limit: 50 },
    description: 'Fetches paginated Vehicle Owner fleet trucks, multi-truck freight loads, carrier bids, invitations, and escrows.',
  },
  {
    functionName: 'allocateMultiTruckLoad',
    domain: 'Fleet, Bidding & Escrow',
    mutating: true,
    requiredRoles: ['Super Admin', 'Freight Coordinator'],
    referencedInFiles: ['cloud/jobs/auto_bid_selection.js'],
    samplePayload: { bookingId: 'TBK-8821', bidId: 'BID-301', truckId: 'TRK-01' },
    description: 'Awards a carrier bid and increments multi-truck allocation on a TruckBooking load.',
  },
  {
    functionName: 'assignTruckToDriver',
    domain: 'Fleet, Bidding & Escrow',
    mutating: true,
    requiredRoles: ['Super Admin', 'Freight Coordinator'],
    referencedInFiles: ['apps/vehicle_owner_app/lib/fleet_assignment_repository.dart'],
    samplePayload: {
      truckId: 'TRK-03',
      driverId: 'DRV-12',
      driverName: 'Mulugeta Girma',
      driverPhone: '0911 604 321',
    },
    description: 'Binds a verified driver exclusively (1:1 invariant) to a Vehicle Owner truck.',
  },
  {
    functionName: 'transferDriverBetweenTrucks',
    domain: 'Fleet, Bidding & Escrow',
    mutating: true,
    requiredRoles: ['Super Admin', 'Freight Coordinator'],
    referencedInFiles: ['apps/vehicle_owner_app/lib/fleet_assignment_repository.dart'],
    samplePayload: {
      truckId: 'TRK-03',
      driverId: 'DRV-07',
      driverName: 'Tsegaye Hailu',
      driverPhone: '0912 345 678',
    },
    description: 'Atomically unassigns an active driver from their prior truck and binds them to the target truck.',
  },
  {
    functionName: 'unassignTruckFromDriver',
    domain: 'Fleet, Bidding & Escrow',
    mutating: true,
    requiredRoles: ['Super Admin', 'Freight Coordinator'],
    referencedInFiles: ['apps/vehicle_owner_app/lib/fleet_assignment_repository.dart'],
    samplePayload: { truckId: 'TRK-01' },
    description: 'Releases the 1:1 driver binding on a fleet truck and marks the unit idle.',
  },
  {
    functionName: 'manageInvitation',
    domain: 'Fleet, Bidding & Escrow',
    mutating: true,
    requiredRoles: ['Super Admin', 'Freight Coordinator'],
    referencedInFiles: ['apps/vehicle_owner_app/lib/fleet_assignment_repository.dart'],
    samplePayload: {
      action: 'create',
      ownerName: 'Abay Heavy Logistics PLC',
      driverName: 'Kibrom Tadesse',
      driverPhone: '0911 556 677',
      targetTruckId: 'TRK-03',
      targetTruckPlate: '3-ET-74910',
      revenueSplitDriverPct: 32,
    },
    description: 'Creates or revokes DriverInvitation records between Vehicle Owners and independent drivers.',
  },
  {
    functionName: 'releaseEscrowMilestone',
    domain: 'Fleet, Bidding & Escrow',
    mutating: true,
    requiredRoles: ['Super Admin', 'Finance Auditor'],
    referencedInFiles: ['packages/escrow_ledger/lib/escrow_settlement_client.dart'],
    samplePayload: { escrowId: 'ESC-5501', gateway: 'telebirr' },
    description: 'Marks waybill delivery verified and transitions locked freight escrow to payout_ready.',
  },
  {
    functionName: 'initiateFleetPayout',
    domain: 'Fleet, Bidding & Escrow',
    mutating: true,
    requiredRoles: ['Super Admin', 'Finance Auditor'],
    referencedInFiles: ['packages/escrow_ledger/lib/escrow_settlement_client.dart'],
    samplePayload: { escrowId: 'ESC-5502', gateway: 'cbe_birr', amountETB: 99600 },
    description: 'Disburses net freight settlement to a Vehicle Owner corporate account after 15% margin and 2% tax.',
  },
  {
    functionName: 'initiateDriverPayout',
    domain: 'Fleet, Bidding & Escrow',
    mutating: true,
    requiredRoles: ['Super Admin', 'Finance Auditor'],
    referencedInFiles: ['packages/escrow_ledger/lib/escrow_settlement_client.dart'],
    samplePayload: { escrowId: 'ESC-5503', gateway: 'telebirr', amountETB: 39840 },
    description: 'Disburses net freight or ride escrow directly to an independent driver wallet.',
  },
  {
    functionName: 'getCurrentSurge',
    domain: 'Ride & Telemetry',
    mutating: false,
    requiredRoles: ['Super Admin', 'Ride Manager', 'Freight Coordinator', 'Support Analyst'],
    referencedInFiles: ['apps/customer_ride_app/lib/ride_booking_controller.dart'],
    samplePayload: { zoneId: 'ZONE-BOLE-01' },
    description: 'Returns active demand-to-supply ratio and regional surge multiplier for Addis Ababa corridors.',
  },
  {
    functionName: 'updateSurgeMultiplier',
    domain: 'Pricing, Surge & Config',
    mutating: true,
    requiredRoles: ['Super Admin', 'Ride Manager'],
    referencedInFiles: ['packages/pricing_engine/lib/pricing_config_service.dart'],
    samplePayload: { zoneId: 'ZONE-BOLE-01', multiplier: 1.35, autoSurgeEnabled: false },
    description: 'Overrides or restores auto-dynamic corridor surge multipliers in Parse runtime config.',
  },
  {
    functionName: 'toggleFeatureFlag',
    domain: 'Pricing, Surge & Config',
    mutating: true,
    requiredRoles: ['Super Admin'],
    referencedInFiles: ['packages/unified_registry/lib/unified_app_registry.dart'],
    samplePayload: { key: 'ff.multi_truck_bidding', enabled: true, rolloutPercentage: 100 },
    description: 'Updates FeatureFlag enablement and staged rollout percentage for UnifiedAppRegistry.',
  },
];

export function inspectSuperAppArchive(): SuperAppMonorepoManifest {
  const totalDartFiles = PACKAGES.reduce((sum, pkg) => sum + pkg.dartFileCount, 0);
  const totalEntries = PACKAGES.reduce((sum, pkg) => sum + pkg.totalFileCount, 0);

  return {
    archiveFileName: 'afronala_superapp_monorepo.zip',
    archiveSizeBytes: 4_862_410,
    parsedAt: new Date().toISOString(),
    workspaceName: 'afronala_superapp_workspace',
    flutterSdkConstraint: '>=3.22.0 <4.0.0',
    dartSdkConstraint: '>=3.4.0 <4.0.0',
    totalEntries,
    totalDartFiles,
    totalCloudJsFiles: 9,
    packages: PACKAGES,
    miniAppDescriptors: MINI_APP_DESCRIPTORS,
    parseClasses: PARSE_CLASSES,
    cloudFunctions: CLOUD_FUNCTIONS,
    cloudJobs: [
      {
        name: 'autoBidSelectionJob',
        filePath: 'cloud/jobs/auto_bid_selection.js',
        description:
          'Evaluates open TruckBooking loads when bidding windows close and awards top-ranked verified carriers.',
      },
    ],
  };
}

export function readSuperAppArchiveFile(filePath: string): {
  path: string;
  sizeBytes: number;
  content: string;
} {
  const normalized = filePath.replace(/^\/+/, '').trim();
  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid archive file path');
  }

  const content =
    VIRTUAL_ARCHIVE_FILES[normalized] ??
    `// ${normalized}\n// Synthesized source preview from afronala_superapp_monorepo.zip\nexport const archiveEntry = '${normalized}';\n`;

  return {
    path: normalized,
    sizeBytes: Buffer.byteLength(content, 'utf8'),
    content,
  };
}
