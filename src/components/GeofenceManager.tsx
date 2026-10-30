import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Plus,
  Trash2,
  AlertTriangle,
  Radio,
  CheckCircle2,
  RefreshCw,
  Compass,
  Layers,
  Car,
  Truck,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Sparkles,
  Download,
  Check,
  X,
  Maximize2,
  Info,
  Globe2,
  ExternalLink,
  Navigation,
  Activity,
  Zap,
  Lock,
} from 'lucide-react';
import {
  GeofenceZone,
  GeofenceBreachAlert,
  DispatchJob,
  Driver,
  GeofenceShapeType,
  EastAfricaCountryCode,
  AdminUser,
  PermissionAction,
} from '../types';
import {
  ambalayService,
  DEFAULT_GEOFENCES,
  isInsideGeofence,
  isPointInPolygon,
  distanceMeters,
} from '../services/ambalay';
import {
  EAST_AFRICA_GPS_CONFIGS,
  GeoBounds,
} from '../services/eastAfricaGpsData';
import {
  EAST_AFRICA_GEOMAP_ENGINES,
  RegionalGeoMapService,
} from '../services/eastAfricaMaps';
import { back4AppService } from '../services/back4app';

interface GeofenceManagerProps {
  darkMode: boolean;
  drivers?: Driver[];
  activeJobs?: DispatchJob[];
  user?: AdminUser | null;
  userRole?: string;
  userJurisdiction?: EastAfricaCountryCode;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify?: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const ALL_COUNTRIES: { code: Exclude<EastAfricaCountryCode, 'ALL'>; name: string; flag: string }[] = [
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
];

// Convert Lat/Lng to SVG Radar Map coordinates based on active country bounds
function geoToSvg(coords: [number, number], bounds: GeoBounds, width = 800, height = 520): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const xNorm = (coords[1] - minLng) / (maxLng - minLng);
  const yNorm = 1 - (coords[0] - minLat) / (maxLat - minLat); // inverted for SVG Y

  return {
    x: Math.max(35, Math.min(width - 35, xNorm * (width - 70) + 35)),
    y: Math.max(35, Math.min(height - 35, yNorm * (height - 70) + 35)),
  };
}

// Convert SVG coordinates back to approximate [lat, lng] based on active country bounds
function svgToGeo(x: number, y: number, bounds: GeoBounds, width = 800, height = 520): [number, number] {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const xNorm = Math.max(0, Math.min(1, (x - 35) / (width - 70)));
  const yNorm = Math.max(0, Math.min(1, 1 - (y - 35) / (height - 70)));

  const lat = Number((minLat + yNorm * (maxLat - minLat)).toFixed(5));
  const lng = Number((minLng + xNorm * (maxLng - minLng)).toFixed(5));
  return [lat, lng];
}

// Play sound synthesizer for breach alerts
function playBreachBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {}
}

export const GeofenceManager: React.FC<GeofenceManagerProps> = ({
  darkMode,
  drivers = [],
  activeJobs = [],
  user = null,
  userRole = 'Super Admin',
  onGuardPermission,
  onNotify,
}) => {
  // Determine active country based on user login jurisdiction
  const userHomeCountry: Exclude<EastAfricaCountryCode, 'ALL'> =
    user?.jurisdictionCountry && user.jurisdictionCountry !== 'ALL'
      ? (user.jurisdictionCountry as Exclude<EastAfricaCountryCode, 'ALL'>)
      : 'ET';

  const [selectedCountry, setSelectedCountry] = useState<Exclude<EastAfricaCountryCode, 'ALL'>>(userHomeCountry);
  const [activeViewMode, setActiveViewMode] = useState<'radar' | 'geo_engines' | 'breaches'>('radar');

  // React to persona switch
  useEffect(() => {
    if (user?.jurisdictionCountry && user.jurisdictionCountry !== 'ALL') {
      setSelectedCountry(user.jurisdictionCountry as Exclude<EastAfricaCountryCode, 'ALL'>);
    }
  }, [user]);

  const activeCountryGps = EAST_AFRICA_GPS_CONFIGS[selectedCountry] || EAST_AFRICA_GPS_CONFIGS.ET;
  const activeGeoMapEngine: RegionalGeoMapService = EAST_AFRICA_GEOMAP_ENGINES[selectedCountry] || EAST_AFRICA_GEOMAP_ENGINES.ET;

  // Initialize geofences for each country
  const [geofencesByCountry, setGeofencesByCountry] = useState<Record<string, GeofenceZone[]>>(() => {
    const initial: Record<string, GeofenceZone[]> = {};
    ALL_COUNTRIES.forEach((c) => {
      const config = EAST_AFRICA_GPS_CONFIGS[c.code];
      initial[c.code] = config?.geofences || [];
    });
    // Ensure Ethiopia also has the rich default geofences from ambalayService
    initial['ET'] = DEFAULT_GEOFENCES;
    return initial;
  });

  const geofences = geofencesByCountry[selectedCountry] || [];

  // Selected geofence for detailed inspector
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(geofences[0]?.id || null);

  // Drawing mode: 'none' | 'drawing_circle' | 'drawing_polygon'
  const [drawingMode, setDrawingMode] = useState<'none' | 'drawing_circle' | 'drawing_polygon'>('none');
  const [tempPolygonPoints, setTempPolygonPoints] = useState<[number, number][]>([]);
  const [tempCircleCenter, setTempCircleCenter] = useState<[number, number] | null>(null);
  const [tempCircleRadius, setTempCircleRadius] = useState<number>(1200);

  // New Zone Form
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCategory, setNewZoneCategory] = useState<GeofenceZone['category']>('commercial');
  const [newZoneColor, setNewZoneColor] = useState('#06b6d4');
  const [newZoneDesc, setNewZoneDesc] = useState('');
  const [isCreatingZone, setIsCreatingZone] = useState(false);

  // Live Monitored Vehicles/Trips per Country
  const [monitoredVehiclesByCountry, setMonitoredVehiclesByCountry] = useState<Record<string, DispatchJob[]>>(() => {
    const jobsMap: Record<string, DispatchJob[]> = {};
    ALL_COUNTRIES.forEach((c) => {
      jobsMap[c.code] = EAST_AFRICA_GPS_CONFIGS[c.code]?.initialJobs || [];
    });
    return jobsMap;
  });

  const monitoredVehicles = monitoredVehiclesByCountry[selectedCountry] || [];

  // Breach Alerts Feed
  const [breachAlerts, setBreachAlerts] = useState<GeofenceBreachAlert[]>([
    {
      id: 'alt-init-1',
      geofenceId: geofences[0]?.id || 'geo-1',
      geofenceName: geofences[0]?.name || 'National Port / Airport Secure Perimeter',
      tripId: 'TRP-9799',
      jobId: 'dsp-seed-9',
      driverName: 'Ermias Assefa',
      vehiclePlate: 'AA-88123',
      type: 'exit_breach',
      location: activeCountryGps.bounds.center,
      timestamp: '2m ago',
      acknowledged: false,
      message: `Vehicle exited authorized ${activeCountryGps.capital} secure perimeter without digital clearance.`,
      severity: 'warning',
    },
  ]);

  // Audio / Alert notifications state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastBreachNotification, setLastBreachNotification] = useState<string | null>(null);

  // SVG ref for map click coords calculation
  const svgMapRef = useRef<SVGSVGElement | null>(null);

  const canManageGeofences = userRole === 'Super Admin' || userRole === 'Operations Director' || userRole === 'Freight Coordinator' || userRole === 'Ride Manager';

  const checkAuthority = (featureLabel: string): boolean => {
    if (onGuardPermission) {
      return onGuardPermission('manage_freight', featureLabel);
    }
    return canManageGeofences;
  };

  // Sync geofences for current country
  const saveCurrentCountryGeofences = (updated: GeofenceZone[]) => {
    setGeofencesByCountry((prev) => ({
      ...prev,
      [selectedCountry]: updated,
    }));
    if (selectedCountry === 'ET') {
      ambalayService.saveGeofences(updated);
    }
  };

  // ---------------------------------------------------------------------------
  // Vehicle Simulation & Real-time Boundary Containment Hook
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setMonitoredVehiclesByCountry((prevMap) => {
        const currentList = prevMap[selectedCountry] || [];
        const nextVehicles = currentList.map((vehicle) => {
          if (!vehicle.currentCoords) return vehicle;

          // Step towards dropoff with gentle drift
          const dLat = (vehicle.dropoffCoords[0] - vehicle.pickupCoords[0]) * 0.035;
          const dLng = (vehicle.dropoffCoords[1] - vehicle.pickupCoords[1]) * 0.035;

          const nextLat = Number((vehicle.currentCoords[0] + dLat + (Math.random() - 0.5) * 0.002).toFixed(5));
          const nextLng = Number((vehicle.currentCoords[1] + dLng + (Math.random() - 0.5) * 0.002).toFixed(5));
          const nextCoords: [number, number] = [nextLat, nextLng];

          // Check containment against all active geofences in this country
          geofences.forEach((zone) => {
            if (zone.status !== 'active') return;

            const wasAssigned = zone.assignedTripIds?.includes(vehicle.tripId);
            const wasInside = zone.activeTripsInside?.includes(vehicle.tripId);
            const isCurrentlyInside = isInsideGeofence(nextCoords, zone);

            // Breach condition: Vehicle was inside or assigned, and has now exited
            if ((wasInside || wasAssigned) && !isCurrentlyInside && zone.alertOnExit) {
              const alreadyAlerted = breachAlerts.some(
                (a) => a.tripId === vehicle.tripId && a.geofenceId === zone.id && !a.acknowledged
              );

              if (!alreadyAlerted) {
                const newAlert: GeofenceBreachAlert = {
                  id: `alt-${Date.now()}-${vehicle.tripId}`,
                  geofenceId: zone.id,
                  geofenceName: zone.name,
                  tripId: vehicle.tripId,
                  jobId: vehicle.id,
                  driverName: vehicle.driverName || 'Regional Courier / Freight Hauler',
                  vehiclePlate: vehicle.vehiclePlate || 'N/A',
                  type: 'exit_breach',
                  location: nextCoords,
                  timestamp: 'Just now',
                  acknowledged: false,
                  message: `Vehicle ${vehicle.vehiclePlate} (${vehicle.driverName}) has EXITED perimeter "${zone.name}" in ${activeCountryGps.countryName}.`,
                  severity: zone.category === 'airport' || zone.category === 'port' ? 'critical' : 'warning',
                };

                setBreachAlerts((prev) => [newAlert, ...prev]);
                setLastBreachNotification(newAlert.message);

                if (soundEnabled) {
                  playBreachBeep();
                }

                // Log to Back4App ActivityLog
                back4AppService.addClassRecord('ActivityLog', {
                  summary: `[Geofence Breach] ${vehicle.vehiclePlate} exited ${zone.name} (${activeCountryGps.countryName})`,
                  category: 'regulatory',
                  countryCode: selectedCountry,
                  createdAt: new Date().toISOString(),
                }).catch(() => null);

                // Update zone breach stats
                saveCurrentCountryGeofences(
                  geofences.map((z) =>
                    z.id === zone.id
                      ? {
                          ...z,
                          breachCount: (z.breachCount || 0) + 1,
                          lastBreachAt: 'Just now',
                          status: 'breached',
                          activeTripsInside: (z.activeTripsInside || []).filter((id) => id !== vehicle.tripId),
                        }
                      : z
                  )
                );
              }
            } else if (isCurrentlyInside && !wasInside) {
              // Entered zone
              saveCurrentCountryGeofences(
                geofences.map((z) =>
                  z.id === zone.id
                    ? {
                        ...z,
                        activeTripsInside: Array.from(new Set([...(z.activeTripsInside || []), vehicle.tripId])),
                      }
                    : z
                )
              );
            }
          });

          return {
            ...vehicle,
            currentCoords: nextCoords,
            progressPercent: Math.min(100, vehicle.progressPercent + 2),
          };
        });

        return {
          ...prevMap,
          [selectedCountry]: nextVehicles,
        };
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [geofences, breachAlerts, soundEnabled, selectedCountry, activeCountryGps]);

  // Map Click Handler for Interactive Geofence Drawing
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawingMode === 'none') return;

    const svg = svgMapRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 800;
    const clickY = ((e.clientY - rect.top) / rect.height) * 520;

    const geoPoint = svgToGeo(clickX, clickY, activeCountryGps.bounds);

    if (drawingMode === 'drawing_circle') {
      setTempCircleCenter(geoPoint);
    } else if (drawingMode === 'drawing_polygon') {
      setTempPolygonPoints((prev) => [...prev, geoPoint]);
    }
  };

  const resetDrawingState = () => {
    setDrawingMode('none');
    setTempPolygonPoints([]);
    setTempCircleCenter(null);
    setIsCreatingZone(false);
    setNewZoneName('');
    setNewZoneDesc('');
  };

  const handleSaveCircleGeofence = () => {
    if (!checkAuthority(`Create circular geofence in ${activeCountryGps.countryName}`)) return;
    if (!tempCircleCenter) return;

    const newZone: GeofenceZone = {
      id: `geo-circ-${selectedCountry.toLowerCase()}-${Date.now()}`,
      name: newZoneName.trim() || `${activeCountryGps.capital} Circular Perimeter #${geofences.length + 1}`,
      category: newZoneCategory,
      shape: 'circle',
      center: tempCircleCenter,
      radiusMeters: tempCircleRadius,
      status: 'active',
      color: newZoneColor,
      description: newZoneDesc.trim() || `Custom geofence boundary in ${activeCountryGps.countryName}.`,
      alertOnExit: true,
      alertOnEntry: false,
      assignedTripIds: monitoredVehicles[0] ? [monitoredVehicles[0].tripId] : [],
      activeTripsInside: [],
      breachCount: 0,
    };

    const updated = [newZone, ...geofences];
    saveCurrentCountryGeofences(updated);
    setSelectedZoneId(newZone.id);
    resetDrawingState();
    onNotify?.('Geofence Created', `Added circular perimeter "${newZone.name}" in ${activeCountryGps.countryName}.`, 'success');
  };

  const handleSavePolygonGeofence = () => {
    if (!checkAuthority(`Create polygon geofence in ${activeCountryGps.countryName}`)) return;
    if (tempPolygonPoints.length < 3) return;

    const avgLat = tempPolygonPoints.reduce((acc, p) => acc + p[0], 0) / tempPolygonPoints.length;
    const avgLng = tempPolygonPoints.reduce((acc, p) => acc + p[1], 0) / tempPolygonPoints.length;

    const newZone: GeofenceZone = {
      id: `geo-poly-${selectedCountry.toLowerCase()}-${Date.now()}`,
      name: newZoneName.trim() || `${activeCountryGps.capital} Polygon Zone #${geofences.length + 1}`,
      category: newZoneCategory,
      shape: 'polygon',
      center: [Number(avgLat.toFixed(5)), Number(avgLng.toFixed(5))],
      radiusMeters: 1400,
      polygonPoints: tempPolygonPoints,
      status: 'active',
      color: newZoneColor,
      description: newZoneDesc.trim() || `Polygon perimeter boundary in ${activeCountryGps.countryName}.`,
      alertOnExit: true,
      alertOnEntry: false,
      assignedTripIds: monitoredVehicles[0] ? [monitoredVehicles[0].tripId] : [],
      activeTripsInside: [],
      breachCount: 0,
    };

    const updated = [newZone, ...geofences];
    saveCurrentCountryGeofences(updated);
    setSelectedZoneId(newZone.id);
    resetDrawingState();
    onNotify?.('Geofence Created', `Added polygon perimeter "${newZone.name}" with ${tempPolygonPoints.length} nodes.`, 'success');
  };

  const handleDeleteGeofence = (zoneId: string) => {
    if (!checkAuthority(`Delete geofence ${zoneId}`)) return;
    const updated = geofences.filter((z) => z.id !== zoneId);
    saveCurrentCountryGeofences(updated);
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(updated[0]?.id || null);
    }
    onNotify?.('Geofence Deleted', `Removed perimeter zone from ${activeCountryGps.countryName}.`, 'info');
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setBreachAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    onNotify?.('Breach Acknowledged', 'Cleared alert beacon from perimeter console.', 'info');
  };

  const handleClearAllAlerts = () => {
    setBreachAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    setLastBreachNotification(null);
    onNotify?.('All Breaches Cleared', 'Marked all geofence breach notifications as reviewed.', 'info');
  };

  const selectedZone = geofences.find((z) => z.id === selectedZoneId) || geofences[0];

  const cardClass = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Geospatial &amp; Perimeters</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              Geofence Boundary Suite
            </span>
            <span aria-hidden="true">·</span>
            <span>8 East African Jurisdictions</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Geofence Perimeters &amp; Radar Controls</span>
            <span className="text-xl">{activeCountryGps.flag}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Live corridor perimeter enforcement, container dry port weighbridge boundaries, and airport safe harbor tracking powered by national East African GeoMap engines.
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              soundEnabled
                ? 'border-cyan-200 dark:border-cyan-800/60 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'
            }`}
            title="Toggle audible alarm synthesizer on perimeter breach"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Alarm Sound: ON' : 'Alarm Muted'}</span>
          </button>

          <button
            onClick={() => setIsCreatingZone(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Geofence in {activeCountryGps.countryCode}</span>
          </button>
        </div>
      </div>

      {/* East African Country Jurisdiction Selector */}
      <div className={`p-4 rounded-xl ${cardClass} space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Regional Operations Jurisdiction
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (Operator: <strong className="text-slate-800 dark:text-slate-200">{user?.name || 'Operator'}</strong> · {user?.jurisdictionName || 'East Africa'})
            </span>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>National GeoMap Engine:</span>
            <strong className="text-cyan-600 dark:text-cyan-400 font-semibold">{activeGeoMapEngine.engineName}</strong>
          </div>
        </div>

        {/* Country Flag Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {ALL_COUNTRIES.map((c) => {
            const isSelected = selectedCountry === c.code;
            const isUserHome = userHomeCountry === c.code;
            const engine = EAST_AFRICA_GEOMAP_ENGINES[c.code];
            const zonesCount = (geofencesByCountry[c.code] || []).length;

            return (
              <button
                key={c.code}
                onClick={() => {
                  setSelectedCountry(c.code);
                  resetDrawingState();
                  const firstZone = (geofencesByCountry[c.code] || [])[0];
                  setSelectedZoneId(firstZone?.id || null);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 text-slate-900 dark:text-white shadow-xs ring-1 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{c.flag}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    {c.code}
                  </span>
                </div>
                <div className="font-semibold text-xs truncate">{c.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {zonesCount} Perimeters
                </div>
                {isUserHome && (
                  <div className="mt-1 text-[9px] font-semibold text-cyan-600 dark:text-cyan-400">
                    Station
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* National GeoMap Engine Banner */}
      <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-gradient-to-r from-cyan-50/80 via-blue-50/50 to-slate-50/50 dark:from-cyan-950/30 dark:via-blue-950/20 dark:to-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
              <span>National GeoSpatial Provider</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-cyan-700 dark:text-cyan-300">{activeGeoMapEngine.provider}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{activeGeoMapEngine.apiVersion}</span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>{activeGeoMapEngine.engineName}</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {activeGeoMapEngine.latencyMs}ms Latency
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
              {activeGeoMapEngine.specialization}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-500 block">Daily Telemetry Pings:</span>
            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
              {activeGeoMapEngine.activeFleetPingsToday.toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => setActiveViewMode(activeViewMode === 'geo_engines' ? 'radar' : 'geo_engines')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-cyan-300 dark:border-cyan-700 bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors"
          >
            {activeViewMode === 'geo_engines' ? 'Show Radar Map' : 'Explore All 8 GeoEngines'}
          </button>
        </div>
      </div>

      {/* Breach Notification Banner (if any) */}
      {lastBreachNotification && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{lastBreachNotification}</span>
          </div>
          <button
            onClick={() => setLastBreachNotification(null)}
            className="text-xs text-rose-700 dark:text-rose-300 underline font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Grid: Interactive Radar Map (Left) + Geofence Details & Alerts (Right) */}
      {activeViewMode === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: SVG Radar Map & Live Perimeter Boundaries */}
          <div className={`lg:col-span-8 p-4 sm:p-5 rounded-xl ${cardClass} space-y-4`}>
            {/* Radar Controls Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Perimeter Radar · {activeCountryGps.capital} ({activeCountryGps.countryCode})
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {monitoredVehicles.length} Vehicles Online
                </span>
              </div>

              {/* Drawing mode toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {drawingMode === 'none' ? (
                  <>
                    <button
                      onClick={() => {
                        setDrawingMode('drawing_circle');
                        setTempCircleCenter(activeCountryGps.bounds.center);
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      + Add Circle
                    </button>
                    <button
                      onClick={() => {
                        setDrawingMode('drawing_polygon');
                        setTempPolygonPoints([]);
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      + Draw Polygon
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      {drawingMode === 'drawing_circle' ? 'Click map to set center' : `Click map for nodes (${tempPolygonPoints.length})`}
                    </span>
                    {drawingMode === 'drawing_circle' && tempCircleCenter && (
                      <button
                        onClick={handleSaveCircleGeofence}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        Save Circle
                      </button>
                    )}
                    {drawingMode === 'drawing_polygon' && tempPolygonPoints.length >= 3 && (
                      <button
                        onClick={handleSavePolygonGeofence}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        Save Polygon
                      </button>
                    )}
                    <button
                      onClick={resetDrawingState}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SVG Interactive Radar Canvas */}
            <div className="relative w-full aspect-[800/520] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 select-none">
              <svg
                ref={svgMapRef}
                viewBox="0 0 800 520"
                onClick={handleMapClick}
                className={`w-full h-full ${drawingMode !== 'none' ? 'cursor-crosshair' : 'cursor-default'}`}
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  </pattern>
                  {/* Concentric Sweep Gradient */}
                  <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
                    <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.03" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Background Grid */}
                <rect width="800" height="520" fill="#090d16" />
                <rect width="800" height="520" fill="url(#radarGrid)" />

                {/* Radar Concentric Rings */}
                <circle cx="400" cy="260" r="120" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="400" cy="260" r="220" fill="none" stroke="rgba(6,182,212,0.10)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="400" cy="260" r="320" fill="none" stroke="rgba(6,182,212,0.06)" strokeWidth="1" />

                {/* Crosshairs */}
                <line x1="400" y1="20" x2="400" y2="500" stroke="rgba(6,182,212,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="30" y1="260" x2="770" y2="260" stroke="rgba(6,182,212,0.15)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Key Geographic Landmarks in Country */}
                {activeCountryGps.locations.map((loc, idx) => {
                  const pt = geoToSvg(loc.coords, activeCountryGps.bounds);
                  return (
                    <g key={idx} className="opacity-75">
                      <circle cx={pt.x} cy={pt.y} r="2.5" fill="#94a3b8" />
                      <text
                        x={pt.x + 5}
                        y={pt.y + 3}
                        fill="#cbd5e1"
                        fontSize="9"
                        fontFamily="monospace"
                        className="pointer-events-none select-none"
                      >
                        {loc.name.split('(')[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Render All Geofences in this Country */}
                {geofences.map((zone) => {
                  const isSelected = selectedZoneId === zone.id;
                  const zoneColor = zone.color || '#06b6d4';

                  if (zone.shape === 'polygon' && zone.polygonPoints && zone.polygonPoints.length >= 3) {
                    const svgPointsStr = zone.polygonPoints
                      .map((p) => {
                        const pt = geoToSvg(p, activeCountryGps.bounds);
                        return `${pt.x},${pt.y}`;
                      })
                      .join(' ');

                    const centerPt = geoToSvg(zone.center, activeCountryGps.bounds);

                    return (
                      <g key={zone.id} onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zone.id); }} className="cursor-pointer">
                        <polygon
                          points={svgPointsStr}
                          fill={zoneColor}
                          fillOpacity={isSelected ? 0.28 : 0.14}
                          stroke={zoneColor}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray={zone.status === 'breached' ? '4 2' : 'none'}
                        />
                        <text
                          x={centerPt.x}
                          y={centerPt.y}
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none drop-shadow"
                        >
                          {zone.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  }

                  // Circular Geofence
                  const centerPt = geoToSvg(zone.center, activeCountryGps.bounds);
                  // Approximate SVG radius calculation
                  const radiusPixels = Math.max(30, Math.min(180, (zone.radiusMeters / 1200) * 45));

                  return (
                    <g key={zone.id} onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zone.id); }} className="cursor-pointer">
                      <circle
                        cx={centerPt.x}
                        cy={centerPt.y}
                        r={radiusPixels}
                        fill={zoneColor}
                        fillOpacity={isSelected ? 0.26 : 0.12}
                        stroke={zoneColor}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        strokeDasharray={zone.status === 'breached' ? '4 2' : 'none'}
                      />
                      <circle cx={centerPt.x} cy={centerPt.y} r="3" fill={zoneColor} />
                      <text
                        x={centerPt.x}
                        y={centerPt.y - radiusPixels - 4}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow"
                      >
                        {zone.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Render In-Progress Drawing Points */}
                {drawingMode === 'drawing_circle' && tempCircleCenter && (
                  <circle
                    cx={geoToSvg(tempCircleCenter, activeCountryGps.bounds).x}
                    cy={geoToSvg(tempCircleCenter, activeCountryGps.bounds).y}
                    r={(tempCircleRadius / 1200) * 45}
                    fill="#ec4899"
                    fillOpacity="0.25"
                    stroke="#ec4899"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}

                {drawingMode === 'drawing_polygon' && tempPolygonPoints.length > 0 && (
                  <g>
                    {tempPolygonPoints.map((p, i) => {
                      const pt = geoToSvg(p, activeCountryGps.bounds);
                      return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#ec4899" stroke="#ffffff" strokeWidth="1" />;
                    })}
                    {tempPolygonPoints.length >= 2 && (
                      <polyline
                        points={tempPolygonPoints.map((p) => `${geoToSvg(p, activeCountryGps.bounds).x},${geoToSvg(p, activeCountryGps.bounds).y}`).join(' ')}
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    )}
                  </g>
                )}

                {/* Render Monitored Vehicles on Radar */}
                {monitoredVehicles.map((v) => {
                  if (!v.currentCoords) return null;
                  const vPt = geoToSvg(v.currentCoords, activeCountryGps.bounds);
                  const isTruck = v.module === 'truck';

                  return (
                    <g key={v.id} className="transition-all duration-1000">
                      {/* Pulse beacon */}
                      <circle cx={vPt.x} cy={vPt.y} r="8" fill={isTruck ? '#3b82f6' : '#06b6d4'} fillOpacity="0.2" className="animate-ping" />
                      <circle cx={vPt.x} cy={vPt.y} r="4" fill={isTruck ? '#2563eb' : '#0891b2'} stroke="#ffffff" strokeWidth="1" />
                      <text
                        x={vPt.x + 6}
                        y={vPt.y + 3}
                        fill="#38bdf8"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        className="pointer-events-none select-none drop-shadow"
                      >
                        {v.vehiclePlate || v.driverName?.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Coordinates Scale Legend */}
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                Lat: {activeCountryGps.bounds.minLat.toFixed(2)}° to {activeCountryGps.bounds.maxLat.toFixed(2)}° · Lng: {activeCountryGps.bounds.minLng.toFixed(2)}° to {activeCountryGps.bounds.maxLng.toFixed(2)}°
              </div>
            </div>

            {/* National GeoMap Engine Feature Matrix for Ride & Truck */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Ride Hailing Dispatch Geo-Features</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {activeGeoMapEngine.rideHailingFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-500 font-bold">·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Truck Delivery &amp; Corridor Geo-Features</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {activeGeoMapEngine.truckDeliveryFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Selected Geofence Inspector & Recent Breaches */}
          <div className="lg:col-span-4 space-y-4">
            {/* Selected Geofence Card */}
            {selectedZone ? (
              <div className={`p-4 rounded-xl ${cardClass} space-y-3`}>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-400 font-semibold">
                      {selectedZone.category} · {selectedZone.shape}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedZone.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      selectedZone.status === 'breached'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {selectedZone.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedZone.description}
                </p>

                <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Center Lat/Lng:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {selectedZone.center[0].toFixed(4)}°, {selectedZone.center[1].toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Effective Radius:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {selectedZone.radiusMeters} meters
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Vehicles Currently Inside:</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {selectedZone.activeTripsInside?.length || 0} active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Breach Count:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {selectedZone.breachCount || 0}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => handleDeleteGeofence(selectedZone.id)}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Perimeter</span>
                  </button>
                  <span className="text-[11px] text-slate-500">
                    Engine: <strong className="text-slate-700 dark:text-slate-300">{activeGeoMapEngine.engineName.split(' ')[0]}</strong>
                  </span>
                </div>
              </div>
            ) : null}

            {/* List of All Geofences in Country */}
            <div className={`p-4 rounded-xl ${cardClass} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Zones ({geofences.length})
                </span>
                <span className="text-[11px] text-slate-500">{activeCountryGps.countryName}</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {geofences.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors flex items-center justify-between ${
                      selectedZoneId === zone.id
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs truncate">{zone.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{zone.category} · {zone.shape}</div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 shrink-0">
                      {zone.radiusMeters}m
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Breach Alerts Feed */}
            <div className={`p-4 rounded-xl ${cardClass} space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Recent Breaches ({breachAlerts.filter((a) => !a.acknowledged).length})
                  </span>
                </div>
                <button
                  onClick={handleClearAllAlerts}
                  className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {breachAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                      alert.acknowledged
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60'
                        : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{alert.vehiclePlate}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{alert.message}</p>
                    {!alert.acknowledged && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          Acknowledge
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: EAST AFRICAN GEOMAP ENGINES MATRIX */}
      {activeViewMode === 'geo_engines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
            <span>
              National GeoMap Engines powering Afronala Ride Hailing and Truck Delivery across all 8 East African countries.
            </span>
            <button
              onClick={() => setActiveViewMode('radar')}
              className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
            >
              Return to Radar Map
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ALL_COUNTRIES.map((c) => {
              const engine = EAST_AFRICA_GEOMAP_ENGINES[c.code];
              const isCurrent = selectedCountry === c.code;

              return (
                <div
                  key={c.code}
                  className={`p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-cyan-500 bg-cyan-50/30 dark:bg-slate-900 ring-1 ring-cyan-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.flag}</span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {engine.engineName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {engine.provider} · <span className="font-mono">{engine.apiVersion}</span>
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {engine.latencyMs}ms
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                    {engine.specialization}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Ride Hailing Specialization:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                        {engine.rideHailingFeatures[0]}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Truck Freight Specialization:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                        {engine.truckDeliveryFeatures[0]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Accuracy: <strong className="text-slate-800 dark:text-slate-200 font-mono">±{engine.geocodingAccuracyMeters}m</strong> · Offline Highlands Cache: <strong className="text-emerald-600 dark:text-emerald-400">Supported</strong>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedCountry(c.code);
                        setActiveViewMode('radar');
                      }}
                      className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
                    >
                      Open Radar in {c.code}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
