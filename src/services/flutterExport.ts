export interface FlutterFile {
  path: string;
  name: string;
  category: 'config' | 'entry' | 'network' | 'models' | 'screens' | 'services';
  description: string;
  code: string;
}

export const FLUTTER_STARTER_FILES: FlutterFile[] = [
  {
    path: 'pubspec.yaml',
    name: 'pubspec.yaml',
    category: 'config',
    description: 'Dependencies, assets, and Flutter 3.x project configuration',
    code: `# ==============================================================================
# AFRONALA SUPERAPP — MOBILE DRIVER & RIDER STARTER TEMPLATE
# Pre-configured with Back4App Parse BaaS & AmbaLay Maps Ethiopia SDK
# ==============================================================================

name: afronala_mobile
description: "Afronala SuperApp Mobile Client for Passengers & Fleet Drivers."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  # Back4App Parse Server Client & LiveQuery
  parse_server_sdk_flutter: ^5.1.2
  # AmbaLay Maps HTTP Gateway Client
  dio: ^5.4.0
  # Device Location & Telemetry GPS
  geolocator: ^11.0.0
  # State Management
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  # UI & Vector Icons
  cached_network_image: ^3.3.1
  google_fonts: ^6.1.0
  flutter_svg: ^2.0.9
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
`,
  },
  {
    path: 'lib/main.dart',
    name: 'main.dart',
    category: 'entry',
    description: 'Application bootstrap, Back4App initialization, and client mode router',
    code: `// lib/main.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';
import 'core/ambalay_maps_client.dart';
import 'screens/rider_booking_screen.dart';
import 'screens/driver_dispatch_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize Back4App Parse Client (--dart-define environment variables)
  const String appId = String.fromEnvironment('BACK4APP_APP_ID');
  const String clientKey = String.fromEnvironment('BACK4APP_CLIENT_KEY');
  const String serverUrl = 'https://parseapi.back4app.com';
  const String liveQueryUrl = 'wss://parseapi.back4app.com';

  await Parse().initialize(
    appId,
    serverUrl,
    clientKey: clientKey,
    liveQueryUrl: liveQueryUrl,
    autoSendSessionId: true,
    debug: true,
  );

  runApp(const AfronalaSuperApp());
}

class AfronalaSuperApp extends StatelessWidget {
  const AfronalaSuperApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Afronala Mobility & Logistics',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF060A12),
        primaryColor: const Color(0xFF06B6D4),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(ThemeData.dark().textTheme),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF06B6D4),
          secondary: Color(0xFF3B82F6),
          surface: Color(0xFF0F172A),
        ),
      ),
      home: const RoleSelectionScreen(),
    );
  }
}

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 72,
                height: 72,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF06B6D4), Color(0xFF3B82F6)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF06B6D4).withOpacity(0.3),
                      blurRadius: 24,
                    ),
                  ],
                ),
                child: const Icon(Icons.bolt, size: 40, color: Colors.white),
              ),
              const Text(
                'AFRONALA',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.0,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Select client persona to launch mobile experience:',
                style: TextStyle(color: Colors.white60, fontSize: 14),
              ),
              const SizedBox(height: 48),
              ElevatedButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RiderBookingScreen()),
                ),
                icon: const Icon(Icons.person_pin_circle_outlined),
                label: const Text('Open Passenger / Rider App'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF06B6D4),
                  foregroundColor: const Color(0xFF060A12),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const DriverDispatchScreen()),
                ),
                icon: const Icon(Icons.local_taxi_outlined),
                label: const Text('Open Fleet Driver Terminal'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFF334155)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/core/ambalay_maps_client.dart',
    name: 'ambalay_maps_client.dart',
    category: 'network',
    description: 'AmbaLay Maps API client: turn-by-turn route, geocoding, matrix ETAs, and trip tracking',
    code: `// lib/core/ambalay_maps_client.dart
import 'package:dio/dio.dart';

class AmbaLayMapsClient {
  static const String baseUrl = 'https://api.ambalaymaps.com';
  final String apiKey;
  late final Dio _dio;

  AmbaLayMapsClient({
    this.apiKey = const String.fromEnvironment('AMBALAY_MAPS_API_KEY'),
  }) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'x-ambalay-key': apiKey,
        'Content-Type': 'application/json',
      },
    ));
  }

  /// Forward Geocode Search by place keyword across Addis Ababa & regional hubs
  Future<List<Map<String, dynamic>>> searchPlaces(String query) async {
    try {
      final response = await _dio.get(
        '/services/geo_coding/search',
        queryParameters: {'term': query},
      );
      if (response.statusCode == 200 && response.data['data'] != null) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }
      return [];
    } catch (e) {
      print('AmbaLay search error: \$e');
      return [];
    }
  }

  /// Reverse Geocode: resolve raw GPS Lat/Lng into Ethiopian street address
  Future<Map<String, dynamic>?> reverseGeocode(double lat, double lon) async {
    try {
      final response = await _dio.get(
        '/services/geo_coding/reverse',
        queryParameters: {'lat': lat, 'lon': lon},
      );
      if (response.statusCode == 200 && response.data['data'] != null) {
        final list = List<Map<String, dynamic>>.from(response.data['data']);
        return list.isNotEmpty ? list.first : null;
      }
      return null;
    } catch (e) {
      print('AmbaLay reverse geocode error: \$e');
      return null;
    }
  }

  /// High-Precision Road Route Calculation
  Future<Map<String, dynamic>?> calculateRoute({
    required double startLat,
    required double startLon,
    required double endLat,
    required double endLon,
    String mode = 'DRIVE',
  }) async {
    try {
      final response = await _dio.post('/services/route', data: {
        'source': {'lat': startLat, 'lon': startLon},
        'destination': {'lat': endLat, 'lon': endLon},
        'mode': mode,
      });
      if (response.statusCode == 200) {
        return response.data['data'];
      }
      return null;
    } catch (e) {
      print('AmbaLay route calculation error: \$e');
      return null;
    }
  }

  /// Multi-Point Distance Matrix for Driver Matching & ETA estimation
  Future<Map<String, dynamic>?> calculateMatrix({
    required List<Map<String, double>> sources,
    required List<Map<String, double>> targets,
  }) async {
    try {
      final response = await _dio.post('/services/matrix', data: {
        'sources': sources,
        'targets': targets,
      });
      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } catch (e) {
      print('AmbaLay matrix error: \$e');
      return null;
    }
  }

  /// Start a tracked trip session
  Future<String?> initTrip({required double lat, required double lon}) async {
    try {
      final response = await _dio.post('/services/trip/init', data: {
        'loc': {'lat': lat, 'lon': lon},
        'eventId': 'flt-init-\${DateTime.now().millisecondsSinceEpoch}',
      });
      if (response.statusCode == 200) {
        return response.data['data']['trip']['id'];
      }
      return null;
    } catch (e) {
      print('AmbaLay initTrip error: \$e');
      return null;
    }
  }

  /// Push driver location ping to live AmbaLay journey
  Future<void> updateTripLocation({
    required String tripId,
    required double lat,
    required double lon,
  }) async {
    try {
      await _dio.post('/services/trip/update', data: {
        'tripId': tripId,
        'loc': {'lat': lat, 'lon': lon},
        'eventId': 'flt-upd-\${DateTime.now().millisecondsSinceEpoch}',
      });
    } catch (e) {
      print('AmbaLay updateTripLocation error: \$e');
    }
  }
}
`,
  },
  {
    path: 'lib/models/trip_model.dart',
    name: 'trip_model.dart',
    category: 'models',
    description: 'ParseObject subclass for Trip with getters, setters, and Back4App queries',
    code: `// lib/models/trip_model.dart
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class TripModel extends ParseObject implements ParseCloneable {
  static const String keyTableName = 'Trip';

  TripModel() : super(keyTableName);
  TripModel.clone() : this();

  @override
  TripModel clone(Map<String, dynamic> map) => TripModel.clone()..fromJson(map);

  String? get tripId => get<String>('tripId');
  set tripId(String? value) => set<String?>('tripId', value);

  String? get passenger => get<String>('passenger');
  set passenger(String? value) => set<String?>('passenger', value);

  String? get passengerPhone => get<String>('passengerPhone');
  set passengerPhone(String? value) => set<String?>('passengerPhone', value);

  String? get driver => get<String>('driver');
  set driver(String? value) => set<String?>('driver', value);

  String? get driverPhone => get<String>('driverPhone');
  set driverPhone(String? value) => set<String?>('driverPhone', value);

  String get status => get<String>('status') ?? 'Requested';
  set status(String value) => set<String>('status', value);

  num get fareETB => get<num>('fareETB') ?? 0;
  set fareETB(num value) => set<num>('fareETB', value);

  String? get pickup => get<String>('pickup');
  set pickup(String? value) => set<String?>('pickup', value);

  String? get destination => get<String>('destination');
  set destination(String? value) => set<String?>('destination', value);

  double get distanceKm => (get<num>('distanceKm') ?? 0).toDouble();
  set distanceKm(double value) => set<num>('distanceKm', value);

  int get durationMin => (get<num>('durationMin') ?? 0).toInt();
  set durationMin(int value) => set<num>('durationMin', value);

  String get module => get<String>('module') ?? 'ride';
  set module(String value) => set<String>('module', value);

  /// Fetch active trips from Back4App Parse Cloud
  static Future<List<TripModel>> fetchActiveTrips() async {
    final query = QueryBuilder<TripModel>(TripModel())
      ..whereEqualTo('status', 'On-Going')
      ..orderByDescending('createdAt')
      ..setLimit(20);

    final response = await query.query();
    if (response.success && response.results != null) {
      return response.results!.cast<TripModel>();
    }
    return [];
  }
}
`,
  },
  {
    path: 'lib/screens/rider_booking_screen.dart',
    name: 'rider_booking_screen.dart',
    category: 'screens',
    description: 'Complete Rider Flutter UI: landmark picker, vehicle class selection, fare estimate, and live booking',
    code: `// lib/screens/rider_booking_screen.dart
import 'package:flutter/material.dart';
import '../core/ambalay_maps_client.dart';
import '../models/trip_model.dart';

class RiderBookingScreen extends StatefulWidget {
  const RiderBookingScreen({super.key});

  @override
  State<RiderBookingScreen> createState() => _RiderBookingScreenState();
}

class _RiderBookingScreenState extends State<RiderBookingScreen> {
  final AmbaLayMapsClient _ambalay = AmbaLayMapsClient();

  String _selectedPickup = 'Bole Intl. Airport (Terminal 2)';
  double _pickupLat = 8.9778;
  double _pickupLon = 38.7993;

  String _selectedDropoff = 'Meskel Square Central Hub';
  double _dropoffLat = 9.0108;
  double _dropoffLon = 38.7613;

  String _selectedVehicleClass = 'Economy';
  double _estimatedDistanceKm = 5.2;
  int _estimatedDurationMin = 14;
  double _estimatedFareETB = 260.0;
  bool _isLoadingRoute = false;
  bool _isBooking = false;

  final List<Map<String, dynamic>> _vehicleOptions = [
    {
      'id': 'Economy',
      'name': 'Afronala Economy',
      'car': 'Toyota Vitz / Suzuki Swift',
      'baseRate': 120.0,
      'perKm': 28.0,
      'seats': 4,
    },
    {
      'id': 'Comfort',
      'name': 'Afronala Comfort',
      'car': 'Hyundai Accent / Corolla',
      'baseRate': 180.0,
      'perKm': 36.0,
      'seats': 4,
    },
    {
      'id': 'Van',
      'name': 'Afronala Van / Cargo',
      'car': 'Toyota HiAce Minibus',
      'baseRate': 290.0,
      'perKm': 52.0,
      'seats': 12,
    },
  ];

  @override
  void initState() {
    super.initState();
    _recalculateRoute();
  }

  void _recalculateRoute() async {
    setState(() => _isLoadingRoute = true);
    final route = await _ambalay.calculateRoute(
      startLat: _pickupLat,
      startLon: _pickupLon,
      endLat: _dropoffLat,
      endLon: _dropoffLon,
    );

    if (route != null && mounted) {
      final meters = route['distanceMeters'] as num? ?? 5200;
      final seconds = route['durationSeconds'] as num? ?? 840;
      final distKm = meters / 1000;
      final durMin = (seconds / 60).ceil();

      final selectedOption = _vehicleOptions.firstWhere(
        (v) => v['id'] == _selectedVehicleClass,
        orElse: () => _vehicleOptions.first,
      );

      final fare = (selectedOption['baseRate'] as double) +
          distKm * (selectedOption['perKm'] as double);

      setState(() {
        _estimatedDistanceKm = distKm;
        _estimatedDurationMin = durMin;
        _estimatedFareETB = fare.roundToDouble();
        _isLoadingRoute = false;
      });
    } else {
      if (mounted) setState(() => _isLoadingRoute = false);
    }
  }

  void _confirmBooking() async {
    setState(() => _isBooking = true);
    final newTrip = TripModel()
      ..tripId = 'TRP-\${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}'
      ..passenger = 'Rahel Tadesse'
      ..passengerPhone = '0911 234 567'
      ..pickup = _selectedPickup
      ..destination = _selectedDropoff
      ..fareETB = _estimatedFareETB
      ..distanceKm = _estimatedDistanceKm
      ..durationMin = _estimatedDurationMin
      ..status = 'Requested'
      ..module = 'ride';

    final response = await newTrip.save();
    if (response.success && mounted) {
      setState(() => _isBooking = false);
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          title: const Text('Trip Dispatched!', style: TextStyle(color: Colors.white)),
          content: Text(
            'Assigned to nearest verified driver in Addis Ababa. Fare: ETB \$_estimatedFareETB.',
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK', style: TextStyle(color: Color(0xFF06B6D4))),
            ),
          ],
        ),
      );
    } else {
      if (mounted) setState(() => _isBooking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Afronala Ride'),
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Waypoint Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(Icons.circle, color: Color(0xFF10B981), size: 14),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _selectedPickup,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: Color(0xFF1E293B), height: 24),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Color(0xFFEF4444), size: 16),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _selectedDropoff,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // AmbaLay Distance & ETA Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF06B6D4).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF06B6D4).withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'AmbaLay Distance: \${_estimatedDistanceKm.toStringAsFixed(1)} km',
                    style: const TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'ETA: ~ \$_estimatedDurationMin min',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Select Vehicle Class',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white70),
            ),
            const SizedBox(height: 12),

            // Vehicle Category Cards
            ..._vehicleOptions.map((v) {
              final isSelected = _selectedVehicleClass == v['id'];
              return GestureDetector(
                onTap: () {
                  setState(() => _selectedVehicleClass = v['id'] as String);
                  _recalculateRoute();
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF06B6D4).withOpacity(0.12)
                        : const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF06B6D4)
                          : const Color(0xFF1E293B),
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        v['id'] == 'Van' ? Icons.airport_shuttle : Icons.directions_car,
                        color: isSelected ? const Color(0xFF06B6D4) : Colors.white60,
                        size: 32,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              v['name'] as String,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Text(
                              v['car'] as String,
                              style: const TextStyle(color: Colors.white54, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        'ETB \${_estimatedFareETB.toInt()}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),

            const SizedBox(height: 24),

            // Booking Button
            ElevatedButton(
              onPressed: _isBooking ? null : _confirmBooking,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF06B6D4),
                foregroundColor: const Color(0xFF060A12),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isBooking
                  ? const CircularProgressIndicator(color: Colors.black)
                  : Text(
                      'Confirm & Dispatch (ETB \${_estimatedFareETB.toInt()})',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/screens/driver_dispatch_screen.dart',
    name: 'driver_dispatch_screen.dart',
    category: 'screens',
    description: 'Complete Driver Flutter UI: status toggle, incoming trip card, accept/decline, and live GPS telemetry updates',
    code: `// lib/screens/driver_dispatch_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import '../core/ambalay_maps_client.dart';
import '../models/trip_model.dart';

class DriverDispatchScreen extends StatefulWidget {
  const DriverDispatchScreen({super.key});

  @override
  State<DriverDispatchScreen> createState() => _DriverDispatchScreenState();
}

class _DriverDispatchScreenState extends State<DriverDispatchScreen> {
  final AmbaLayMapsClient _ambalay = AmbaLayMapsClient();

  bool _isOnline = true;
  String _driverName = 'Abebe Kebede';
  String _vehiclePlate = 'AA-12345';
  double _currentLat = 9.0108;
  double _currentLon = 38.7613;

  TripModel? _activeTrip;
  Timer? _telemetryTimer;

  @override
  void initState() {
    super.initState();
    _startSimulatedTelemetry();
  }

  @override
  void dispose() {
    _telemetryTimer?.cancel();
    super.dispose();
  }

  void _startSimulatedTelemetry() {
    _telemetryTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!_isOnline) return;
      // Slight movement around Addis corridor
      setState(() {
        _currentLat += (0.0002);
        _currentLon += (0.0001);
      });
    });
  }

  void _acceptTrip() {
    setState(() {
      _activeTrip = TripModel()
        ..tripId = 'TRP-8821'
        ..passenger = 'Dr. Zewdu Assefa'
        ..passengerPhone = '0922 884 192'
        ..pickup = 'Kazanchis Commercial Hub'
        ..destination = 'Bole International Airport'
        ..fareETB = 380
        ..status = 'On-Going';
    });
  }

  void _completeTrip() {
    setState(() => _activeTrip = null);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Trip Completed! ETB 380 credited to Telebirr wallet.'),
        backgroundColor: Color(0xFF10B981),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Dispatch Terminal'),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          Row(
            children: [
              Text(_isOnline ? 'ONLINE' : 'OFFLINE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: _isOnline ? const Color(0xFF10B981) : Colors.white38,
                  )),
              Switch(
                value: _isOnline,
                activeColor: const Color(0xFF10B981),
                onChanged: (val) => setState(() => _isOnline = val),
              ),
            ],
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Driver Profile Status Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: const Color(0xFF06B6D4),
                    child: Text(_driverName[0],
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.black)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_driverName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        Text('Plate: \$_vehiclePlate • Toyota Vitz',
                            style: const TextStyle(color: Colors.white54, fontSize: 12)),
                      ],
                    ),
                  ),
                  const Text('4.9 ★',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber, fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Live Telemetry Coords Bar
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('AmbaLay GPS Coordinates:',
                      style: TextStyle(fontSize: 11, color: Colors.white54)),
                  Text(
                    '\${_currentLat.toStringAsFixed(4)}, \${_currentLon.toStringAsFixed(4)}',
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF06B6D4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            if (_activeTrip != null) ...[
              // Active Trip In Progress Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF06B6D4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _activeTrip!.tripId ?? 'Active Trip',
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF06B6D4)),
                        ),
                        Text(
                          'ETB \${_activeTrip!.fareETB}',
                          style: const TextStyle(
                              fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF10B981)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text('Passenger: \${_activeTrip!.passenger}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    Text('Pickup: \${_activeTrip!.pickup}',
                        style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    Text('Destination: \${_activeTrip!.destination}',
                        style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 18),
                    ElevatedButton(
                      onPressed: _completeTrip,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Complete Trip & Collect Fare',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Incoming Booking Request Simulator Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.notifications_active, color: Color(0xFF06B6D4), size: 36),
                    const SizedBox(height: 12),
                    const Text('New Ride Request Received',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 6),
                    const Text('Kazanchis Hub -> Bole Airport (6.8 km)',
                        style: TextStyle(color: Colors.white60, fontSize: 12)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {},
                            child: const Text('Decline'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _acceptTrip,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF06B6D4),
                              foregroundColor: Colors.black,
                            ),
                            child: const Text('Accept Trip', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/services/livequery_manager.dart',
    name: 'livequery_manager.dart',
    category: 'services',
    description: 'Real-time WebSocket LiveQuery manager for instant trip updates & dispatch broadcasts',
    code: `// lib/services/livequery_manager.dart
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';
import '../models/trip_model.dart';

class AfronalaLiveQueryManager {
  static final LiveQuery _liveQuery = LiveQuery();
  static Subscription<TripModel>? _tripSubscription;

  /// Subscribe to incoming dispatch requests for drivers
  static void subscribeToDriverQueue({
    required Function(TripModel newTrip) onTripRequested,
    required Function(TripModel updatedTrip) onTripUpdated,
  }) async {
    final QueryBuilder<TripModel> query = QueryBuilder<TripModel>(TripModel())
      ..whereEqualTo('status', 'Requested');

    _tripSubscription = await _liveQuery.client.subscribe(query);

    _tripSubscription!.on(LiveQueryEvent.create, (TripModel trip) {
      print('🚀 [LiveQuery] New Dispatch Job Created: \${trip.tripId}');
      onTripRequested(trip);
    });

    _tripSubscription!.on(LiveQueryEvent.update, (TripModel trip) {
      print('🔄 [LiveQuery] Trip Updated: \${trip.tripId} -> \${trip.status}');
      onTripUpdated(trip);
    });
  }

  static void dispose() {
    if (_tripSubscription != null) {
      _liveQuery.client.unSubscribe(_tripSubscription!);
    }
  }
}
`,
  },
];
