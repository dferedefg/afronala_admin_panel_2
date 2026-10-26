import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  Sliders,
  Sparkles,
  Download,
  Check,
  X,
  Maximize2,
  Info,
} from 'lucide-react';
import {
  GeofenceZone,
  GeofenceBreachAlert,
  DispatchJob,
  Driver,
  GeofenceShapeType,
} from '../types';
import {
  ambalayService,
  DEFAULT_GEOFENCES,
  isInsideGeofence,
  isPointInPolygon,
  distanceMeters,
} from '../services/ambalay';

interface GeofenceManagerProps {
  darkMode: boolean;
  drivers?: Driver[];
  activeJobs?: DispatchJob[];
}

// Convert Lat/Lng to SVG Radar Map coordinates
// Addis Ababa geographic bounds: Lat 8.89 to 9.06 (South to North), Lng 38.71 to 38.86 (West to East)
function geoToSvg(coords: [number, number], width = 800, height = 520): { x: number; y: number } {
  const minLat = 8.89;
  const maxLat = 9.06;
  const minLng = 38.71;
  const maxLng = 38.86;

  const xNorm = (coords[1] - minLng) / (maxLng - minLng);
  const yNorm = 1 - (coords[0] - minLat) / (maxLat - minLat); // inverted for SVG Y

  return {
    x: Math.max(35, Math.min(width - 35, xNorm * (width - 70) + 35)),
    y: Math.max(35, Math.min(height - 35, yNorm * (height - 70) + 35)),
  };
}

// Convert SVG coordinates back to approximate [lat, lng]
function svgToGeo(x: number, y: number, width = 800, height = 520): [number, number] {
  const minLat = 8.89;
  const maxLat = 9.06;
  const minLng = 38.71;
  const maxLng = 38.86;

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
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {}
}

const PRESET_ZONES: Partial<GeofenceZone>[] = [
  {
    name: 'Merkato Commercial Goods Perimeter',
    category: 'commercial',
    shape: 'polygon',
    center: [9.0305, 38.7395],
    radiusMeters: 1100,
    polygonPoints: [
      [9.0360, 38.7320],
      [9.0375, 38.7460],
      [9.0250, 38.7480],
      [9.0230, 38.7340],
    ],
    color: '#ec4899',
    description: 'Africa\'s largest open-air market trading zone and goods transit gate.',
    alertOnExit: true,
  },
  {
    name: 'Gotera Freight Weighbridge Hub',
    category: 'transit',
    shape: 'circle',
    center: [8.9882, 38.7588],
    radiusMeters: 950,
    color: '#eab308',
    description: 'High-density multi-level junction connecting Debre Zeit road to the ring highway.',
    alertOnExit: true,
  },
  {
    name: 'Bole Intl. Terminal VIP Corridor',
    category: 'airport',
    shape: 'polygon',
    center: [8.9778, 38.7993],
    radiusMeters: 1500,
    polygonPoints: [
      [8.9860, 38.7910],
      [8.9890, 38.8080],
      [8.9690, 38.8120],
      [8.9660, 38.7940],
    ],
    color: '#06b6d4',
    description: 'Diplomatic and airline passenger transfer perimeter.',
    alertOnExit: true,
  },
];

export const GeofenceManager: React.FC<GeofenceManagerProps> = ({
  darkMode,
  drivers = [],
  activeJobs = [],
}) => {
  // Geofence collection
  const [geofences, setGeofences] = useState<GeofenceZone[]>(() => {
    return ambalayService.getGeofences();
  });

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

  // Live Monitored Vehicles/Trips
  const [monitoredVehicles, setMonitoredVehicles] = useState<DispatchJob[]>([
    {
      id: 'dsp-1',
      tripId: 'TRP-9801',
      module: 'ride',
      passenger: 'Selamawit Tadesse',
      passengerPhone: '0922 455 667',
      pickupName: 'Bole Intl. Airport',
      pickupCoords: [8.9778, 38.7993],
      dropoffName: 'Kazanchis Commercial',
      dropoffCoords: [9.0195, 38.7698],
      status: 'En Route',
      fareETB: 480,
      distanceKm: 7.2,
      driverName: 'Abebe Kebede',
      vehiclePlate: 'AA-12345',
      currentCoords: [8.9810, 38.8020], // Inside Bole circle initially
      speedKmh: 42,
      batteryPercent: 88,
      etaMinutes: 6,
      headingDeg: 315,
      progressPercent: 20,
      requestedAt: '3m ago',
    },
    {
      id: 'dsp-2',
      tripId: 'TRP-9802',
      module: 'truck',
      passenger: 'Kality Logistics Corp',
      passengerPhone: '0911 344 556',
      pickupName: 'Kality Customs Yard',
      pickupCoords: [8.9240, 38.7560],
      dropoffName: 'Bole Industrial Park',
      dropoffCoords: [8.9700, 38.8200],
      status: 'En Route',
      fareETB: 3200,
      distanceKm: 14.8,
      driverName: 'Dawit Mengistu',
      vehiclePlate: 'ET-TRK-882',
      currentCoords: [8.9270, 38.7580], // Inside Kality polygon initially
      speedKmh: 48,
      batteryPercent: 95,
      etaMinutes: 19,
      headingDeg: 45,
      progressPercent: 30,
      requestedAt: '8m ago',
    },
    {
      id: 'dsp-3',
      tripId: 'TRP-9803',
      module: 'ride',
      passenger: 'Dr. Tedros Alemayehu',
      passengerPhone: '0912 889 900',
      pickupName: 'Sarbet International Zone',
      pickupCoords: [8.9961, 38.7368],
      dropoffName: 'Meskel Square Hub',
      dropoffCoords: [9.0108, 38.7613],
      status: 'En Route',
      fareETB: 310,
      distanceKm: 4.5,
      driverName: 'Yonas Haile',
      vehiclePlate: 'AA-77491',
      currentCoords: [9.0040, 38.7480], // Transitioning towards Meskel
      speedKmh: 34,
      batteryPercent: 72,
      etaMinutes: 8,
      headingDeg: 60,
      progressPercent: 55,
      requestedAt: '12m ago',
    },
    {
      id: 'dsp-4',
      tripId: 'TRP-9804',
      module: 'ride',
      passenger: 'Bethlehem Girma',
      passengerPhone: '0930 112 233',
      pickupName: 'Meskel Square',
      pickupCoords: [9.0108, 38.7613],
      dropoffName: 'Kazanchis District',
      dropoffCoords: [9.0195, 38.7698],
      status: 'En Route',
      fareETB: 240,
      distanceKm: 2.8,
      driverName: 'Almaz Bekele',
      vehiclePlate: 'AA-44921',
      currentCoords: [9.0115, 38.7620], // Inside Meskel circle
      speedKmh: 28,
      batteryPercent: 82,
      etaMinutes: 5,
      headingDeg: 40,
      progressPercent: 35,
      requestedAt: '5m ago',
    },
  ]);

  // Breach Alerts Feed
  const [breachAlerts, setBreachAlerts] = useState<GeofenceBreachAlert[]>([
    {
      id: 'alt-init-1',
      geofenceId: 'geo-4',
      geofenceName: 'Kazanchis Diplomatic & Financial District',
      tripId: 'TRP-9799',
      jobId: 'dsp-seed-9',
      driverName: 'Ermias Assefa',
      vehiclePlate: 'AA-88123',
      type: 'exit_breach',
      location: [9.0110, 38.7600],
      timestamp: '4m ago',
      acknowledged: false,
      message: 'Vehicle exited authorized Kazanchis diplomatic perimeter without clearance.',
      severity: 'warning',
    },
  ]);

  // Audio / Alert notifications state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastBreachNotification, setLastBreachNotification] = useState<string | null>(null);
  const [radioPingNotice, setRadioPingNotice] = useState<string | null>(null);

  // SVG ref for map click coords calculation
  const svgMapRef = useRef<SVGSVGElement | null>(null);

  // Sync to localStorage
  const saveGeofencesList = (updated: GeofenceZone[]) => {
    setGeofences(updated);
    ambalayService.saveGeofences(updated);
  };

  // ---------------------------------------------------------------------------
  // Vehicle Simulation & Real-time Boundary Containment Hook
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setMonitoredVehicles((prevVehicles) => {
        return prevVehicles.map((vehicle) => {
          if (!vehicle.currentCoords) return vehicle;

          // Compute simulated step towards dropoff with small deviation
          const dLat = (vehicle.dropoffCoords[0] - vehicle.pickupCoords[0]) * 0.04;
          const dLng = (vehicle.dropoffCoords[1] - vehicle.pickupCoords[1]) * 0.04;

          const nextLat = Number((vehicle.currentCoords[0] + dLat + (Math.random() - 0.5) * 0.003).toFixed(5));
          const nextLng = Number((vehicle.currentCoords[1] + dLng + (Math.random() - 0.5) * 0.003).toFixed(5));
          const nextCoords: [number, number] = [nextLat, nextLng];

          // Check containment against all active geofences
          geofences.forEach((zone) => {
            if (zone.status !== 'active') return;

            const wasAssigned = zone.assignedTripIds?.includes(vehicle.tripId);
            const wasInside = zone.activeTripsInside?.includes(vehicle.tripId);
            const isCurrentlyInside = isInsideGeofence(nextCoords, zone);

            // Breach condition: Vehicle was inside or assigned to this zone, and has now exited
            if ((wasInside || wasAssigned) && !isCurrentlyInside && zone.alertOnExit) {
              // Trigger exit breach if not already recently alerted
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
                  driverName: vehicle.driverName || 'Mobile Driver',
                  vehiclePlate: vehicle.vehiclePlate || 'N/A',
                  type: 'exit_breach',
                  location: nextCoords,
                  timestamp: 'Just now',
                  acknowledged: false,
                  message: `Vehicle ${vehicle.vehiclePlate} (${vehicle.driverName}) has EXITED boundary "${zone.name}".`,
                  severity: zone.category === 'airport' || zone.category === 'port' ? 'critical' : 'warning',
                };

                setBreachAlerts((prev) => [newAlert, ...prev]);
                setLastBreachNotification(newAlert.message);

                if (soundEnabled) {
                  playBreachBeep();
                }

                // Update zone breach stats
                setGeofences((prevZones) =>
                  prevZones.map((z) =>
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
              setGeofences((prevZones) =>
                prevZones.map((z) =>
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
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [geofences, breachAlerts, soundEnabled]);

  // ---------------------------------------------------------------------------
  // Map Click Handler for Interactive Geofence Drawing
  // ---------------------------------------------------------------------------
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawingMode === 'none') return;

    const svg = svgMapRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 800;
    const clickY = ((e.clientY - rect.top) / rect.height) * 520;

    const geoPoint = svgToGeo(clickX, clickY);

    if (drawingMode === 'drawing_circle') {
      setTempCircleCenter(geoPoint);
    } else if (drawingMode === 'drawing_polygon') {
      setTempPolygonPoints((prev) => [...prev, geoPoint]);
    }
  };

  // Complete circular geofence creation
  const handleSaveCircleGeofence = () => {
    if (!tempCircleCenter) return;

    const newZone: GeofenceZone = {
      id: `geo-circ-${Date.now()}`,
      name: newZoneName.trim() || `Circular Perimeter #${geofences.length + 1}`,
      category: newZoneCategory,
      shape: 'circle',
      center: tempCircleCenter,
      radiusMeters: tempCircleRadius,
      status: 'active',
      color: newZoneColor,
      description: newZoneDesc.trim() || 'Custom circular geofence boundary.',
      alertOnExit: true,
      alertOnEntry: false,
      assignedTripIds: ['TRP-9801', 'TRP-9803'],
      activeTripsInside: [],
      breachCount: 0,
    };

    const updated = [newZone, ...geofences];
    saveGeofencesList(updated);
    setSelectedZoneId(newZone.id);
    resetDrawingState();
  };

  // Complete polygon geofence creation
  const handleSavePolygonGeofence = () => {
    if (tempPolygonPoints.length < 3) return;

    // Calculate centroid for center coordinate
    const avgLat = tempPolygonPoints.reduce((acc, p) => acc + p[0], 0) / tempPolygonPoints.length;
    const avgLng = tempPolygonPoints.reduce((acc, p) => acc + p[1], 0) / tempPolygonPoints.length;

    const newZone: GeofenceZone = {
      id: `geo-poly-${Date.now()}`,
      name: newZoneName.trim() || `Polygon Boundary #${geofences.length + 1}`,
      category: newZoneCategory,
      shape: 'polygon',
      center: [Number(avgLat.toFixed(5)), Number(avgLng.toFixed(5))],
      radiusMeters: 1600,
      polygonPoints: tempPolygonPoints,
      status: 'active',
      color: newZoneColor,
      description: newZoneDesc.trim() || `Custom polygonal zone with ${tempPolygonPoints.length} boundary vertices.`,
      alertOnExit: true,
      alertOnEntry: false,
      assignedTripIds: ['TRP-9802'],
      activeTripsInside: ['TRP-9802'],
      breachCount: 0,
    };

    const updated = [newZone, ...geofences];
    saveGeofencesList(updated);
    setSelectedZoneId(newZone.id);
    resetDrawingState();
  };

  const resetDrawingState = () => {
    setDrawingMode('none');
    setTempPolygonPoints([]);
    setTempCircleCenter(null);
    setNewZoneName('');
    setNewZoneDesc('');
    setIsCreatingZone(false);
  };

  const handleApplyPreset = (preset: Partial<GeofenceZone>) => {
    const newZone: GeofenceZone = {
      id: `geo-pre-${Date.now()}`,
      name: preset.name || 'Preset Boundary',
      category: preset.category || 'commercial',
      shape: preset.shape || 'circle',
      center: preset.center || [9.0108, 38.7613],
      radiusMeters: preset.radiusMeters || 1000,
      polygonPoints: preset.polygonPoints,
      status: 'active',
      color: preset.color || '#38bdf8',
      description: preset.description,
      alertOnExit: true,
      alertOnEntry: false,
      assignedTripIds: ['TRP-9801', 'TRP-9804'],
      activeTripsInside: ['TRP-9804'],
      breachCount: 0,
    };

    const updated = [newZone, ...geofences];
    saveGeofencesList(updated);
    setSelectedZoneId(newZone.id);
  };

  const handleDeleteZone = (id: string) => {
    const updated = geofences.filter((g) => g.id !== id);
    saveGeofencesList(updated);
    if (selectedZoneId === id) {
      setSelectedZoneId(updated[0]?.id || null);
    }
  };

  const handleToggleZoneStatus = (id: string) => {
    const updated = geofences.map((g) =>
      g.id === id ? { ...g, status: (g.status === 'active' ? 'warning' : 'active') as any } : g
    );
    saveGeofencesList(updated);
  };

  const handleAcknowledgeAlert = (id: string) => {
    setBreachAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleSendDriverRadioPing = (alert: GeofenceBreachAlert) => {
    setRadioPingNotice(`Radio alert dispatched to ${alert.driverName} (${alert.vehiclePlate}): "Return to assigned corridor immediately."`);
    setTimeout(() => setRadioPingNotice(null), 4000);
    handleAcknowledgeAlert(alert.id);
    if (soundEnabled) playBreachBeep();
  };

  const handleExportIncidentLog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(breachAlerts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `afronala_geofence_incidents_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const selectedZone = geofences.find((g) => g.id === selectedZoneId);
  const totalBreaches = breachAlerts.length;
  const activeZonesCount = geofences.filter((g) => g.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Statistics */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border-indigo-500/30'
            : 'bg-gradient-to-r from-indigo-50 via-white to-blue-50 border-indigo-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  AmbaLay Geofence Security &amp; Perimeter Manager
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE RADAR
                </span>
              </div>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Define circular and polygonal boundaries across Addis Ababa. Detects fleet exit breaches in real-time with automated audio alarms and radio dispatch.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                soundEnabled
                  ? darkMode
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Audio Breach Chime"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{soundEnabled ? 'Alarm Sound: ON' : 'Alarm Sound: OFF'}</span>
            </button>

            <button
              onClick={handleExportIncidentLog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Breach Log</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Active Geofences</span>
            <div className="text-lg font-bold font-mono text-cyan-700 dark:text-cyan-400 mt-1 tabular-nums">
              {activeZonesCount} / {geofences.length}
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Addis Ababa hubs</span>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Monitored Fleet</span>
            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
              {monitoredVehicles.length} vehicles
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Live GPS tracking</span>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Breach Incidents</span>
            <div className="text-lg font-bold font-mono text-rose-700 dark:text-rose-400 mt-1 tabular-nums">
              {totalBreaches} events
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Automated perimeter alerts</span>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Boundary Engine</span>
            <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
              Polygon &amp; Circle
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Ray-Casting Algorithmic Check</span>
          </div>
        </div>
      </div>

      {/* Floating Active Breach Warning Notice */}
      {lastBreachNotification && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Security Breach Detected</p>
              <p className="text-xs font-medium text-slate-200 mt-0.5">{lastBreachNotification}</p>
            </div>
          </div>
          <button
            onClick={() => setLastBreachNotification(null)}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Driver Radio Dispatch Notice */}
      {radioPingNotice && (
        <div className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 flex items-center gap-3">
          <Radio className="w-4 h-4 animate-spin text-cyan-400" />
          <span className="text-xs font-semibold">{radioPingNotice}</span>
        </div>
      )}

      {/* Main Grid: Interactive Map (Left/Center) + Zone Controls & Containment (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive AmbaLay Vector Map & Draw Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {/* Map Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  Addis Ababa Interactive Perimeter Canvas
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click on canvas to add vertices or set center. Monitored vehicles update continuously.
                </p>
              </div>

              {/* Drawing Mode Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (drawingMode === 'drawing_circle') resetDrawingState();
                    else {
                      resetDrawingState();
                      setDrawingMode('drawing_circle');
                      setIsCreatingZone(true);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    drawingMode === 'drawing_circle'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{drawingMode === 'drawing_circle' ? 'Drawing Circle...' : '+ New Circle'}</span>
                </button>

                <button
                  onClick={() => {
                    if (drawingMode === 'drawing_polygon') resetDrawingState();
                    else {
                      resetDrawingState();
                      setDrawingMode('drawing_polygon');
                      setIsCreatingZone(true);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    drawingMode === 'drawing_polygon'
                      ? 'bg-purple-600 text-white shadow-md'
                      : darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{drawingMode === 'drawing_polygon' ? `Polygon (${tempPolygonPoints.length} pts)` : '+ Draw Polygon'}</span>
                </button>
              </div>
            </div>

            {/* Drawing HUD Bar (when in drawing mode) */}
            {drawingMode !== 'none' && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <span className="font-semibold text-indigo-300">
                    {drawingMode === 'drawing_circle'
                      ? tempCircleCenter
                        ? `Center placed: [${tempCircleCenter[0]}, ${tempCircleCenter[1]}]. Adjust radius slider & save.`
                        : 'Click on the map canvas to place circle center'
                      : `Polygon Mode: Click map to place vertices (${tempPolygonPoints.length} placed). Need ≥3 points.`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {drawingMode === 'drawing_circle' && tempCircleCenter && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Radius:</span>
                      <input
                        type="range"
                        min="500"
                        max="4000"
                        step="100"
                        value={tempCircleRadius}
                        onChange={(e) => setTempCircleRadius(Number(e.target.value))}
                        className="w-24 accent-indigo-400"
                      />
                      <span className="font-mono text-indigo-300 font-bold">{tempCircleRadius}m</span>
                      <button
                        onClick={handleSaveCircleGeofence}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                      >
                        Save Circle
                      </button>
                    </div>
                  )}

                  {drawingMode === 'drawing_polygon' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSavePolygonGeofence}
                        disabled={tempPolygonPoints.length < 3}
                        className={`px-3 py-1 rounded font-bold text-xs ${
                          tempPolygonPoints.length >= 3
                            ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Close &amp; Save Polygon ({tempPolygonPoints.length} pts)
                      </button>
                    </div>
                  )}

                  <button
                    onClick={resetDrawingState}
                    className="p-1 rounded text-slate-400 hover:text-rose-400"
                    title="Cancel Drawing"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Interactive SVG Canvas */}
            <div
              className={`mt-4 relative rounded-xl border border-slate-800 bg-[#090d16] overflow-hidden select-none ${
                drawingMode !== 'none' ? 'cursor-crosshair' : 'cursor-default'
              }`}
              style={{ height: '460px' }}
            >
              {/* Background Map Grid */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]" />
              
              {/* Map Bounds Watermark */}
              <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-500 pointer-events-none">
                Addis Ababa Central Grid [Lat 8.89 - 9.06 / Lng 38.71 - 38.86]
              </div>

              <svg
                ref={svgMapRef}
                viewBox="0 0 800 520"
                onClick={handleMapClick}
                className="w-full h-full"
              >
                <defs>
                  {/* Glowing filter for geofence breaches */}
                  <filter id="breachGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 1. Render Defined Geofences */}
                {geofences.map((zone) => {
                  const isSelected = zone.id === selectedZoneId;
                  const zoneColor = zone.color || '#06b6d4';
                  const centerSvg = geoToSvg(zone.center);

                  if (zone.shape === 'polygon' && zone.polygonPoints && zone.polygonPoints.length >= 3) {
                    // Polygon SVG
                    const pointsStr = zone.polygonPoints
                      .map((p) => {
                        const pt = geoToSvg(p);
                        return `${pt.x},${pt.y}`;
                      })
                      .join(' ');

                    return (
                      <g key={zone.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zone.id); }}>
                        {/* Polygon shape */}
                        <polygon
                          points={pointsStr}
                          fill={zoneColor}
                          fillOpacity={isSelected ? 0.28 : 0.16}
                          stroke={zoneColor}
                          strokeWidth={isSelected ? 3 : 2}
                          strokeDasharray={zone.status === 'warning' ? '6 3' : undefined}
                          className="transition-all hover:opacity-90"
                        />
                        {/* Vertex dots */}
                        {zone.polygonPoints.map((p, idx) => {
                          const vPt = geoToSvg(p);
                          return (
                            <circle
                              key={idx}
                              cx={vPt.x}
                              cy={vPt.y}
                              r={isSelected ? 4 : 2.5}
                              fill={zoneColor}
                              stroke="#090d16"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                        {/* Centroid Label */}
                        <text
                          x={centerSvg.x}
                          y={centerSvg.y}
                          fill={zoneColor}
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none drop-shadow"
                        >
                          {zone.name.split(' ')[0]} (Poly)
                        </text>
                      </g>
                    );
                  }

                  // Circular Geofence
                  // Convert radius in meters to approximate SVG pixel radius
                  // Approx 1 deg lat = 111,000 meters. Addis Lat span = 0.17 deg ~ 18,870 meters across 450px SVG height
                  const pixelsPerMeter = 450 / 18870;
                  const rPixels = Math.max(20, zone.radiusMeters * pixelsPerMeter);

                  return (
                    <g key={zone.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zone.id); }}>
                      <circle
                        cx={centerSvg.x}
                        cy={centerSvg.y}
                        r={rPixels}
                        fill={zoneColor}
                        fillOpacity={isSelected ? 0.24 : 0.14}
                        stroke={zoneColor}
                        strokeWidth={isSelected ? 3 : 2}
                        strokeDasharray={zone.status === 'warning' ? '5 3' : undefined}
                        className="transition-all"
                      />
                      {/* Center pin */}
                      <circle
                        cx={centerSvg.x}
                        cy={centerSvg.y}
                        r="4"
                        fill={zoneColor}
                        stroke="#090d16"
                        strokeWidth="1.5"
                      />
                      <text
                        x={centerSvg.x}
                        y={centerSvg.y + 14}
                        fill={zoneColor}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow"
                      >
                        {zone.name.split(' ')[0]} ({zone.radiusMeters}m)
                      </text>
                    </g>
                  );
                })}

                {/* 2. Drawing In-Progress Preview */}
                {drawingMode === 'drawing_circle' && tempCircleCenter && (
                  <g>
                    {(() => {
                      const pt = geoToSvg(tempCircleCenter);
                      const pixelsPerMeter = 450 / 18870;
                      const rPixels = Math.max(20, tempCircleRadius * pixelsPerMeter);
                      return (
                        <>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={rPixels}
                            fill="#6366f1"
                            fillOpacity="0.3"
                            stroke="#818cf8"
                            strokeWidth="2.5"
                            strokeDasharray="6 4"
                          />
                          <circle cx={pt.x} cy={pt.y} r="5" fill="#818cf8" />
                        </>
                      );
                    })()}
                  </g>
                )}

                {drawingMode === 'drawing_polygon' && tempPolygonPoints.length > 0 && (
                  <g>
                    {/* Polyline of points so far */}
                    <polyline
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      points={tempPolygonPoints
                        .map((p) => {
                          const pt = geoToSvg(p);
                          return `${pt.x},${pt.y}`;
                        })
                        .join(' ')}
                    />
                    {tempPolygonPoints.map((p, idx) => {
                      const pt = geoToSvg(p);
                      return (
                        <g key={idx}>
                          <circle cx={pt.x} cy={pt.y} r="5" fill="#a855f7" stroke="#fff" strokeWidth="1.5" />
                          <text x={pt.x + 8} y={pt.y + 4} fill="#c084fc" fontSize="9" fontWeight="bold">
                            #{idx + 1}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* 3. Live Monitored Vehicles */}
                {monitoredVehicles.map((vehicle) => {
                  if (!vehicle.currentCoords) return null;
                  const vPt = geoToSvg(vehicle.currentCoords);

                  // Check if this vehicle is currently inside any active geofence
                  const insideZones = geofences.filter((z) =>
                    z.status === 'active' && isInsideGeofence(vehicle.currentCoords!, z)
                  );
                  const isInsideAny = insideZones.length > 0;

                  // Breach status: Has an active unacknowledged breach
                  const hasBreach = breachAlerts.some(
                    (a) => a.tripId === vehicle.tripId && !a.acknowledged
                  );

                  return (
                    <g key={vehicle.id} className="transition-transform duration-1000">
                      {/* Breach pulsing beacon */}
                      {hasBreach && (
                        <circle
                          cx={vPt.x}
                          cy={vPt.y}
                          r="16"
                          fill="#ef4444"
                          opacity="0.35"
                          filter="url(#breachGlow)"
                          className="animate-ping"
                        />
                      )}

                      {/* Vehicle Body Marker */}
                      <circle
                        cx={vPt.x}
                        cy={vPt.y}
                        r="7"
                        fill={hasBreach ? '#ef4444' : isInsideAny ? '#10b981' : '#f59e0b'}
                        stroke="#090d16"
                        strokeWidth="2"
                      />

                      {/* Direction Pointer or Type Indicator */}
                      <circle
                        cx={vPt.x}
                        cy={vPt.y}
                        r="2.5"
                        fill="#ffffff"
                      />

                      {/* Vehicle Label Tag */}
                      <g transform={`translate(${vPt.x + 10}, ${vPt.y - 6})`}>
                        <rect
                          x="0"
                          y="0"
                          width="90"
                          height="20"
                          rx="4"
                          fill="#0f172a"
                          fillOpacity="0.85"
                          stroke={hasBreach ? '#ef4444' : isInsideAny ? '#10b981' : '#f59e0b'}
                          strokeWidth="1"
                        />
                        <text x="6" y="14" fill="#ffffff" fontSize="9" fontWeight="bold">
                          {vehicle.vehiclePlate} ({vehicle.speedKmh}km/h)
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Canvas Legend */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Vehicle Inside Perimeter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Perimeter Breach (Exited Zone)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Transit Corridor Vehicle</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-cyan-700 dark:text-cyan-400">Ray-Casting Alg: Active</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Boundaries Library */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
              Quick-Add Ethiopian Perimeter Presets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRESET_ZONES.map((preset, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex flex-col justify-between gap-2 ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{preset.name}</span>
                      <span className="text-[10px] font-mono uppercase text-indigo-700 dark:text-indigo-300 font-semibold">
                        {preset.shape}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
                  </div>
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="w-full py-1.5 rounded text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Apply Preset to Map</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Zone Inspector & Live Containment Feed */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Geofence Zones List */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Layers className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                Defined Geofence Boundaries
              </h3>
              <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 font-bold tabular-nums">
                {geofences.length} Total
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {geofences.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                const zoneColor = zone.color || '#06b6d4';
                const tripsInsideCount = zone.activeTripsInside?.length || 0;

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? darkMode
                          ? 'bg-slate-800 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                        : darkMode
                        ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border"
                          style={{ backgroundColor: zoneColor, borderColor: zoneColor }}
                        />
                        <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{zone.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-600 dark:text-slate-300">
                          {zone.shape || 'circle'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteZone(zone.id);
                          }}
                          className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Delete Zone"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>Category: <strong className="capitalize text-slate-900 dark:text-slate-200">{zone.category}</strong></span>
                      <span>
                        {zone.shape === 'polygon'
                          ? `${zone.polygonPoints?.length || 0} vertices`
                          : `${zone.radiusMeters}m radius`}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        ✓ {tripsInsideCount} Vehicle{tripsInsideCount === 1 ? '' : 's'} Inside
                      </span>
                      {zone.breachCount && zone.breachCount > 0 ? (
                        <span className="text-rose-700 dark:text-rose-400 font-bold">
                          ⚠ {zone.breachCount} Breaches Logged
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">Zero breaches</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Zone Inspector */}
          {selectedZone && (
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Zone Inspector</span>
                <button
                  onClick={() => handleToggleZoneStatus(selectedZone.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedZone.status === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                  }`}
                >
                  {selectedZone.status.toUpperCase()}
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{selectedZone.name}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{selectedZone.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block">Center Coordinates</span>
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold text-[11px]">
                    {selectedZone.center[0]}, {selectedZone.center[1]}
                  </span>
                </div>

                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block">Geometry Type</span>
                  <span className="font-mono text-purple-700 dark:text-purple-400 font-bold text-[11px] uppercase">
                    {selectedZone.shape || 'circle'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Alert on Exit:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Enabled (Sound + Banner)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Assigned Vehicle Trips:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                    {selectedZone.assignedTripIds?.join(', ') || 'None assigned'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Breach Alert Feed */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Live Breach Feed &amp; Dispatch Alarms
              </h3>
              <span className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                {breachAlerts.filter((a) => !a.acknowledged).length} Unresolved
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {breachAlerts.length > 0 ? (
                breachAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border transition-all ${
                      alert.acknowledged
                        ? darkMode
                          ? 'bg-slate-950/40 border-slate-800 opacity-60'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                        : darkMode
                        ? 'bg-rose-950/20 border-rose-500/50 shadow-sm'
                        : 'bg-rose-50 border-rose-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{alert.vehiclePlate}</span>
                          <span className="text-[10px] font-mono font-semibold text-cyan-700 dark:text-cyan-400">({alert.tripId})</span>
                          <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold uppercase">
                            · {alert.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-800 dark:text-slate-300">{alert.message}</p>
                      </div>

                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 shrink-0">{alert.timestamp}</span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">Driver: <strong className="text-slate-900 dark:text-white">{alert.driverName}</strong></span>

                      <div className="flex items-center gap-1.5">
                        {!alert.acknowledged ? (
                          <>
                            <button
                              onClick={() => handleSendDriverRadioPing(alert)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 shadow-xs transition-all"
                            >
                              <Radio className="w-3 h-3" />
                              <span>Radio Ping</span>
                            </button>
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                            >
                              Dismiss
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-600 dark:text-slate-400">
                  Zero active perimeter breaches. Monitored fleet is inside bounds.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
