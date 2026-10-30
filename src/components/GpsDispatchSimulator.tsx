import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Navigation,
  Compass,
  MapPin,
  Clock,
  Car,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Zap,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
  ShieldCheck,
  Activity,
  Flame,
  Volume2,
  Globe,
  Smartphone,
  ChevronRight,
  FileText,
  UserCheck,
  Maximize2,
  X,
  Layers,
  Sliders,
  DollarSign,
  TrendingUp,
  Lock,
} from 'lucide-react';
import {
  AdminUser,
  DeviationAlert,
  DispatchJob,
  Driver,
  EastAfricaCountryCode,
  GeofenceZone,
  TrafficCorridor,
} from '../types';
import { ambalayService } from '../services/ambalay';
import {
  EAST_AFRICA_GPS_CONFIGS,
  EastAfricaCountryGpsConfig,
  GeoBounds,
} from '../services/eastAfricaGpsData';
import { ALL_EAST_AFRICA_COUNTRY_CODES } from '../services/eastAfricaScreens';
import { DEMO_PERSONAS } from '../services/rbac';

export type RadarScreenMode =
  | 'radar_map'
  | 'dispatch_queue'
  | 'geofence_radar'
  | 'traffic_heatmap'
  | 'deviation_reroute'
  | 'driver_telemetry';

interface GpsDispatchSimulatorProps {
  darkMode: boolean;
  drivers: Driver[];
  onSyncTripToBack4App?: (job: DispatchJob) => Promise<any>;
  user?: AdminUser;
  jurisdictionCountry?: EastAfricaCountryCode;
  onSwitchPersona?: (persona: AdminUser) => void;
  onPushToast?: (title: string, message?: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onNavigateTab?: (tab: string) => void;
}

// Distance helper (Haversine formula)
function calculateGeoDistance(c1: [number, number], c2: [number, number]): number {
  const R = 6371; // Earth radius km
  const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
  const dLon = ((c2[1] - c1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[0] * Math.PI) / 180) *
      Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Convert Lat/Lng to SVG Radar Map coordinates parameterized by country bounds
function geoToSvg(
  coords: [number, number],
  bounds: GeoBounds,
  width = 800,
  height = 520
): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latSpan = Math.max(0.0001, maxLat - minLat);
  const lngSpan = Math.max(0.0001, maxLng - minLng);
  const xNorm = (coords[1] - minLng) / lngSpan;
  const yNorm = 1 - (coords[0] - minLat) / latSpan; // inverted for SVG Y

  return {
    x: Math.max(25, Math.min(width - 25, xNorm * (width - 50) + 25)),
    y: Math.max(25, Math.min(height - 25, yNorm * (height - 50) + 25)),
  };
}

export const GpsDispatchSimulator: React.FC<GpsDispatchSimulatorProps> = ({
  darkMode,
  drivers,
  onSyncTripToBack4App,
  user,
  jurisdictionCountry,
  onSwitchPersona,
  onPushToast,
  onNavigateTab,
}) => {
  // Determine effective operational jurisdiction
  const effectiveJurisdiction = useMemo<EastAfricaCountryCode>(() => {
    return jurisdictionCountry || user?.jurisdictionCountry || 'ALL';
  }, [jurisdictionCountry, user?.jurisdictionCountry]);

  // Is the current session strictly locked to a single sovereign country?
  const isJurisdictionLocked = effectiveJurisdiction !== 'ALL';

  // Determine default country based on user's jurisdiction
  const userCountryCode = useMemo<Exclude<EastAfricaCountryCode, 'ALL'>>(() => {
    if (isJurisdictionLocked) {
      return effectiveJurisdiction as Exclude<EastAfricaCountryCode, 'ALL'>;
    }
    return 'ET';
  }, [isJurisdictionLocked, effectiveJurisdiction]);

  // Selected operational country for GPS Radar inspection
  const [selectedCountry, setSelectedCountry] = useState<Exclude<EastAfricaCountryCode, 'ALL'>>(
    userCountryCode
  );

  // Sync selectedCountry when user's login persona or jurisdictionCountry changes
  useEffect(() => {
    setSelectedCountry(userCountryCode);
  }, [userCountryCode]);

  const countryConfig: EastAfricaCountryGpsConfig = useMemo(() => {
    return EAST_AFRICA_GPS_CONFIGS[selectedCountry] || EAST_AFRICA_GPS_CONFIGS.ET;
  }, [selectedCountry]);

  // Active Screen Mode Tab
  const [screenMode, setScreenMode] = useState<RadarScreenMode>('radar_map');

  // Blueprint / Audit Modal inspection
  const [selectedScreenForAudit, setSelectedScreenForAudit] = useState<{
    id: string;
    screenType: RadarScreenMode;
    title: string;
    subtitle: string;
    headlineMetric: { label: string; value: string; secondary?: string };
    metrics: { label: string; value: string; sublabel?: string }[];
    guidelines: string[];
    actionLabel: string;
  } | null>(null);

  // Simulator execution state
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [autoOrderGeneration, setAutoOrderGeneration] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<'all' | 'ride' | 'truck'>('all');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Geofencing & Traffic Simulation State
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [geofences, setGeofences] = useState<GeofenceZone[]>(() => countryConfig.geofences);
  const [trafficCorridors, setTrafficCorridors] = useState<TrafficCorridor[]>(
    () => countryConfig.trafficCorridors
  );
  const [deviationAlerts, setDeviationAlerts] = useState<DeviationAlert[]>([]);
  const [isRerouting, setIsRerouting] = useState(false);
  const [rerouteSuccessMsg, setRerouteSuccessMsg] = useState<string | null>(null);
  const [audioPingNotice, setAudioPingNotice] = useState<string | null>(null);

  // Active dispatch jobs for the selected country
  const [jobs, setJobs] = useState<DispatchJob[]>(() => countryConfig.initialJobs);

  // Telemetry KPIs
  const [totalDispatched, setTotalDispatched] = useState(148);
  const [avgMatchTime] = useState(1.4); // seconds

  // Update country assets when selectedCountry changes
  useEffect(() => {
    setJobs(countryConfig.initialJobs);
    setGeofences(countryConfig.geofences);
    setTrafficCorridors(countryConfig.trafficCorridors);
    setSelectedJobId(countryConfig.initialJobs[0]?.id || null);
    setDeviationAlerts([
      {
        id: `dev-${countryConfig.countryCode}-seed`,
        tripId: countryConfig.initialJobs[0]?.tripId || 'TRP-001',
        jobId: countryConfig.initialJobs[0]?.id || 'dsp-1',
        driverName: countryConfig.sampleDrivers[0]?.name || 'Local Fleet Operator',
        vehiclePlate: countryConfig.sampleDrivers[0]?.vehiclePlate || 'N/A',
        timestamp: '2m ago',
        deviationMeters: 420,
        corridorName: `${countryConfig.locations[0]?.name.split(' (')[0]} → ${countryConfig.locations[1]?.name.split(' (')[0]}`,
        resolved: false,
        status: 'active',
        severity: 'warning',
        message: `Vehicle veered 420m off authorized ${countryConfig.countryName} corridor.`,
      },
    ]);
  }, [countryConfig]);

  // Selected persona for the active country (for 1-click persona switch)
  const countryPersona = useMemo(() => {
    return DEMO_PERSONAS.find((p) => p.jurisdictionCountry === selectedCountry);
  }, [selectedCountry]);

  // Dispatch Queue Processing Loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setJobs((prevJobs) => {
        return prevJobs.map((job) => {
          // If Queued: Proximity Dispatch Algorithm assigns available driver
          if (job.status === 'Queued') {
            const candidateDrivers =
              drivers.length > 0
                ? drivers
                : countryConfig.sampleDrivers.map((d, i) => ({
                    objectId: `drv-${i}`,
                    name: d.name,
                    vehiclePlate: d.vehiclePlate,
                    status: 'available' as const,
                    phone: d.phone,
                    rating: 4.9,
                    totalTrips: 120,
                    acceptanceRate: 98,
                    currentCoords: [countryConfig.bounds.center[0], countryConfig.bounds.center[1]] as [number, number],
                  }));

            const randomDriver = candidateDrivers[Math.floor(Math.random() * candidateDrivers.length)];
            return {
              ...job,
              status: 'Assigned',
              driverId: 'drv-dyn-' + Date.now().toString().slice(-4),
              driverName: randomDriver.name,
              vehiclePlate: randomDriver.vehiclePlate || countryConfig.sampleDrivers[0].vehiclePlate,
              speedKmh: 28 + Math.floor(Math.random() * 20),
              currentCoords: [job.pickupCoords[0] - 0.003, job.pickupCoords[1] - 0.003],
              progressPercent: 5,
            };
          }

          // If Assigned -> Move toward pickup, then En Route
          if (job.status === 'Assigned') {
            const nextProgress = Math.min(100, job.progressPercent + 4 * speedMultiplier);
            if (nextProgress >= 20) {
              return {
                ...job,
                status: 'En Route',
                progressPercent: nextProgress,
                speedKmh: 35 + Math.floor(Math.random() * 25),
                etaMinutes: Math.max(1, Math.round((100 - nextProgress) / 10)),
              };
            }
            return { ...job, progressPercent: nextProgress };
          }

          // If En Route -> Move toward destination along road geometry
          if (job.status === 'En Route') {
            const nextProgress = Math.min(100, job.progressPercent + 3 * speedMultiplier);
            const ratio = nextProgress / 100;
            let newLat: number;
            let newLng: number;

            if (job.ambalayRouteCoords && job.ambalayRouteCoords.length > 1) {
              const idx = Math.min(
                job.ambalayRouteCoords.length - 1,
                Math.floor((nextProgress / 100) * (job.ambalayRouteCoords.length - 1))
              );
              newLat = job.ambalayRouteCoords[idx][0];
              newLng = job.ambalayRouteCoords[idx][1];
            } else {
              newLat = job.pickupCoords[0] + (job.dropoffCoords[0] - job.pickupCoords[0]) * ratio;
              newLng = job.pickupCoords[1] + (job.dropoffCoords[1] - job.pickupCoords[1]) * ratio;
            }

            // Route deviation calculation
            const dev = ambalayService.calculateRouteDeviation(
              [newLat, newLng],
              job.ambalayRouteCoords,
              350
            );

            // Traffic corridor intersection
            const matchedCorridor = trafficCorridors.find((c) =>
              c.coordinates.some(
                (pt) => ambalayService.distanceMeters([newLat, newLng], pt) < 900
              )
            );
            const trafficSev = matchedCorridor ? matchedCorridor.severity : 'clear';
            const trafficDelay = matchedCorridor && !job.rerouted ? matchedCorridor.delayMinutes : 0;

            if (dev.isDeviated && !job.isDeviated) {
              setDeviationAlerts((prev) => [
                {
                  id: 'dev-' + Date.now(),
                  jobId: job.id,
                  tripId: job.tripId,
                  driverName: job.driverName || 'Driver',
                  vehiclePlate: job.vehiclePlate || 'N/A',
                  timestamp: 'Just now',
                  deviationMeters: dev.deviationMeters,
                  corridorName: `${job.pickupName.split(' (')[0]} → ${job.dropoffName.split(' (')[0]}`,
                  resolved: false,
                  status: 'active',
                  severity: dev.deviationMeters > 700 ? 'critical' : 'warning',
                  message: `Vehicle veered ${Math.round(dev.deviationMeters)}m off corridor in ${countryConfig.countryName}.`,
                },
                ...prev.slice(0, 8),
              ]);
            }

            if (nextProgress >= 50) {
              return {
                ...job,
                status: 'Onboard',
                currentCoords: [newLat, newLng],
                progressPercent: nextProgress,
                speedKmh:
                  matchedCorridor?.severity === 'standstill'
                    ? 12
                    : matchedCorridor?.severity === 'heavy'
                    ? 18
                    : 35 + Math.floor(Math.random() * 20),
                etaMinutes: Math.max(1, Math.round((100 - nextProgress) / 8) + trafficDelay),
                deviationMeters: dev.deviationMeters,
                isDeviated: dev.isDeviated,
                trafficSeverity: trafficSev,
              };
            }

            return {
              ...job,
              currentCoords: [newLat, newLng],
              progressPercent: nextProgress,
              speedKmh:
                matchedCorridor?.severity === 'standstill'
                  ? 12
                  : matchedCorridor?.severity === 'heavy'
                  ? 18
                  : 32 + Math.floor(Math.random() * 24),
              etaMinutes: Math.max(1, Math.round((100 - nextProgress) / 8) + trafficDelay),
              deviationMeters: dev.deviationMeters,
              isDeviated: dev.isDeviated,
              trafficSeverity: trafficSev,
            };
          }

          // If Onboard -> Move to 100%, then mark Completed
          if (job.status === 'Onboard') {
            const nextProgress = Math.min(100, job.progressPercent + 2.5 * speedMultiplier);
            const ratio = nextProgress / 100;
            let newLat: number;
            let newLng: number;

            if (job.ambalayRouteCoords && job.ambalayRouteCoords.length > 1) {
              const idx = Math.min(
                job.ambalayRouteCoords.length - 1,
                Math.floor((nextProgress / 100) * (job.ambalayRouteCoords.length - 1))
              );
              newLat = job.ambalayRouteCoords[idx][0];
              newLng = job.ambalayRouteCoords[idx][1];
            } else {
              newLat = job.pickupCoords[0] + (job.dropoffCoords[0] - job.pickupCoords[0]) * ratio;
              newLng = job.pickupCoords[1] + (job.dropoffCoords[1] - job.pickupCoords[1]) * ratio;
            }

            if (nextProgress >= 100) {
              setTotalDispatched((c) => c + 1);
              return {
                ...job,
                status: 'Completed',
                currentCoords: job.dropoffCoords,
                progressPercent: 100,
                speedKmh: 0,
                etaMinutes: 0,
                isDeviated: false,
                deviationMeters: 0,
              };
            }

            const dev = ambalayService.calculateRouteDeviation(
              [newLat, newLng],
              job.ambalayRouteCoords,
              350
            );

            const matchedCorridor = trafficCorridors.find((c) =>
              c.coordinates.some(
                (pt) => ambalayService.distanceMeters([newLat, newLng], pt) < 900
              )
            );
            const trafficSev = matchedCorridor ? matchedCorridor.severity : 'clear';
            const trafficDelay = matchedCorridor && !job.rerouted ? matchedCorridor.delayMinutes : 0;

            return {
              ...job,
              currentCoords: [newLat, newLng],
              progressPercent: nextProgress,
              speedKmh:
                matchedCorridor?.severity === 'standstill' ? 12 : 36 + Math.floor(Math.random() * 22),
              etaMinutes: Math.max(1, Math.round((100 - nextProgress) / 8) + trafficDelay),
              deviationMeters: dev.deviationMeters,
              isDeviated: dev.isDeviated,
              trafficSeverity: trafficSev,
            };
          }

          return job;
        });
      });
    }, 1200 / speedMultiplier);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, drivers, trafficCorridors, countryConfig]);

  // Periodic Auto-Order Generator utilizing country locations
  useEffect(() => {
    if (!autoOrderGeneration || !isPlaying) return;

    const orderInterval = setInterval(() => {
      const locs = countryConfig.locations;
      if (locs.length < 2) return;

      const pickupIdx = Math.floor(Math.random() * locs.length);
      let dropoffIdx = Math.floor(Math.random() * locs.length);
      while (dropoffIdx === pickupIdx) {
        dropoffIdx = Math.floor(Math.random() * locs.length);
      }

      const pNode = locs[pickupIdx];
      const dNode = locs[dropoffIdx];
      const dist = calculateGeoDistance(pNode.coords, dNode.coords);
      const isFreight = pNode.category === 'freight' || dNode.category === 'freight';

      const customerNames = [
        countryConfig.sampleDrivers[0]?.name || 'Local Rider',
        countryConfig.sampleDrivers[1]?.name || 'Merchant Logistics',
        'East Africa Freight Shippers',
        'Corridor Trading Corp',
      ];
      const customer = customerNames[Math.floor(Math.random() * customerNames.length)];

      // Localized currency baseline multiplier
      const currMultiplier =
        countryConfig.currency === 'UGX' || countryConfig.currency === 'TZS'
          ? 25
          : countryConfig.currency === 'RWF'
          ? 10
          : 1;

      const fare = isFreight
        ? (4500 + Math.round(dist * 280)) * currMultiplier
        : (180 + Math.round(dist * 45)) * currMultiplier;

      const newJob: DispatchJob = {
        id: `dsp-${countryConfig.countryCode.toLowerCase()}-${Date.now().toString().slice(-5)}`,
        tripId: `${isFreight ? 'FRT' : 'TRP'}-${countryConfig.countryCode}-${Math.floor(1000 + Math.random() * 9000)}`,
        module: isFreight ? 'truck' : 'ride',
        passenger: isFreight ? `${customer} (Bulk Freight)` : customer,
        passengerPhone: countryConfig.sampleDrivers[0]?.phone || '0700 000 000',
        pickupName: pNode.name,
        pickupCoords: pNode.coords,
        dropoffName: dNode.name,
        dropoffCoords: dNode.coords,
        status: 'Queued',
        fareETB: fare,
        distanceKm: dist,
        speedKmh: 0,
        batteryPercent: 95,
        etaMinutes: Math.max(3, Math.round(dist * 2.8)),
        headingDeg: Math.floor(Math.random() * 360),
        progressPercent: 0,
        requestedAt: 'Just now',
      };

      setJobs((prev) => [newJob, ...prev.slice(0, 8)]);
    }, 14000 / speedMultiplier);

    return () => clearInterval(orderInterval);
  }, [autoOrderGeneration, isPlaying, speedMultiplier, countryConfig]);

  // Manually Dispatch a Test Order in the selected country
  const handleManualDispatch = (presetType: 'airport' | 'freight' | 'commercial') => {
    const locs = countryConfig.locations;
    let pNode = locs[0] || { name: 'Terminal A', coords: countryConfig.bounds.center, category: 'transit' as const };
    let dNode = locs[1] || { name: 'Central District', coords: countryConfig.bounds.center, category: 'commercial' as const };
    let mod: 'ride' | 'truck' = 'ride';
    let passengerName = `${countryConfig.countryName} Operations VIP`;

    if (presetType === 'freight') {
      const freightNodes = locs.filter((l) => l.category === 'freight');
      pNode = freightNodes[0] || locs[locs.length - 2] || locs[0];
      dNode = locs[locs.length - 1] || locs[1];
      mod = 'truck';
      passengerName = `${countryConfig.countryName} Intermodal Cargo`;
    } else if (presetType === 'commercial') {
      const commNodes = locs.filter((l) => l.category === 'commercial');
      pNode = commNodes[0] || locs[1];
      dNode = locs[2] || locs[0];
      mod = 'ride';
      passengerName = `${countryConfig.capital} Business Executive`;
    }

    const dist = calculateGeoDistance(pNode.coords, dNode.coords);
    const currMultiplier =
      countryConfig.currency === 'UGX' || countryConfig.currency === 'TZS'
        ? 25
        : countryConfig.currency === 'RWF'
        ? 10
        : 1;

    const newJob: DispatchJob = {
      id: `dsp-${countryConfig.countryCode.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      tripId: `${mod === 'truck' ? 'FRT' : 'TRP'}-${countryConfig.countryCode}-${Math.floor(1000 + Math.random() * 9000)}`,
      module: mod,
      passenger: passengerName,
      passengerPhone: countryConfig.sampleDrivers[0]?.phone || '0700 000 000',
      pickupName: pNode.name,
      pickupCoords: pNode.coords,
      dropoffName: dNode.name,
      dropoffCoords: dNode.coords,
      status: 'Queued',
      fareETB:
        mod === 'truck'
          ? (5400 + Math.round(dist * 220)) * currMultiplier
          : (280 + Math.round(dist * 40)) * currMultiplier,
      distanceKm: dist,
      speedKmh: 0,
      batteryPercent: 98,
      etaMinutes: Math.max(4, Math.round(dist * 2.5)),
      headingDeg: Math.floor(Math.random() * 360),
      progressPercent: 0,
      requestedAt: 'Just now',
    };

    setJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(newJob.id);
    onPushToast?.(
      `Dispatched: ${newJob.tripId}`,
      `Created ${mod.toUpperCase()} request in ${countryConfig.countryName}: ${pNode.name.split(' (')[0]} → ${dNode.name.split(' (')[0]}`,
      'success'
    );
  };

  // Sync to Back4App Parse
  const handleSyncToBack4App = async (job: DispatchJob) => {
    if (onSyncTripToBack4App) {
      try {
        setSyncStatusMsg(`Syncing ${job.tripId} to Back4App Parse Cloud (${countryConfig.countryName})...`);
        await onSyncTripToBack4App(job);
        setSyncStatusMsg(`Successfully synchronized ${job.tripId} with Back4App Parse database!`);
        setTimeout(() => setSyncStatusMsg(null), 4000);
      } catch (err: any) {
        setSyncStatusMsg(`Sync failed: ${err?.message || 'Parse error'}`);
        setTimeout(() => setSyncStatusMsg(null), 5000);
      }
    }
  };

  // Simulate vehicle veering off route
  const handleSimulateDeviation = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId && j.currentCoords) {
          const latOffset = (countryConfig.bounds.maxLat - countryConfig.bounds.minLat) * 0.08;
          const lngOffset = (countryConfig.bounds.maxLng - countryConfig.bounds.minLng) * 0.08;
          const deviatedCoords: [number, number] = [
            j.currentCoords[0] + latOffset,
            j.currentCoords[1] - lngOffset,
          ];
          const newDev = ambalayService.calculateRouteDeviation(
            deviatedCoords,
            j.ambalayRouteCoords,
            350
          );
          const alertItem: DeviationAlert = {
            id: 'dev-' + Date.now(),
            jobId: j.id,
            tripId: j.tripId,
            driverName: j.driverName || 'Driver',
            vehiclePlate: j.vehiclePlate || 'N/A',
            timestamp: 'Just now',
            deviationMeters: newDev.deviationMeters || 620,
            corridorName: `${j.pickupName.split(' (')[0]} → ${j.dropoffName.split(' (')[0]}`,
            resolved: false,
            status: 'active',
            severity: 'critical',
            message: `Manual trigger: vehicle veered ${Math.round(newDev.deviationMeters || 620)}m off corridor in ${countryConfig.countryName}.`,
          };
          setDeviationAlerts((alerts) => [alertItem, ...alerts.slice(0, 9)]);
          return {
            ...j,
            currentCoords: deviatedCoords,
            isDeviated: true,
            deviationMeters: newDev.deviationMeters || 620,
          };
        }
        return j;
      })
    );
  };

  // Resolve deviation alert
  const handleResolveDeviation = (targetId?: string) => {
    setDeviationAlerts((prev) =>
      prev.map((a) =>
        a.id === targetId || a.jobId === targetId || a.tripId === targetId
          ? { ...a, resolved: true, status: 'resolved' }
          : a
      )
    );
    setJobs((prev) =>
      prev.map((j) =>
        !targetId || j.id === targetId || j.tripId === targetId || (selectedJob && j.id === selectedJob.id)
          ? { ...j, isDeviated: false, deviationMeters: 30 }
          : j
      )
    );
  };

  // Dynamic Traffic Re-Routing
  const handleDynamicTrafficReroute = async (jobOrId: DispatchJob | string) => {
    const job = typeof jobOrId === 'string' ? jobs.find((j) => j.id === jobOrId) : jobOrId;
    if (!job || !job.pickupCoords || !job.dropoffCoords) return;
    setIsRerouting(true);
    try {
      const res = await ambalayService.calculateTrafficBypassRoute(
        { lat: job.pickupCoords[0], lon: job.pickupCoords[1] },
        { lat: job.dropoffCoords[0], lon: job.dropoffCoords[1] }
      );
      if (res && res.route?.geometry?.coordinates) {
        const bypassCoords: [number, number][] = res.route.geometry.coordinates.map((c) => [c[1], c[0]]);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  ambalayRouteCoords: bypassCoords,
                  trafficSeverity: 'clear',
                  rerouted: true,
                  etaMinutes: res.newEtaMins,
                  isDeviated: false,
                  deviationMeters: 25,
                }
              : j
          )
        );
        setRerouteSuccessMsg(
          `Bypass applied for ${job.tripId}! Saved ${res.savedMinutes} mins in ${countryConfig.countryName} traffic.`
        );
        setTimeout(() => setRerouteSuccessMsg(null), 5000);
      }
    } catch (e: any) {
      console.warn('Rerouting error:', e);
    } finally {
      setIsRerouting(false);
    }
  };

  // Filter jobs strictly to the selected/locked sovereign country
  const countryJobs = useMemo(() => {
    return jobs.filter((j) => {
      const idUpper = (j.id + ' ' + j.tripId).toUpperCase();
      const codeUpper = selectedCountry.toUpperCase();
      if (idUpper.includes(`-${codeUpper}-`) || idUpper.includes(`-${codeUpper.toLowerCase()}-`)) {
        return true;
      }
      const b = countryConfig.bounds;
      const [lat, lng] = j.pickupCoords;
      return (
        lat >= b.minLat - 0.5 &&
        lat <= b.maxLat + 0.5 &&
        lng >= b.minLng - 0.5 &&
        lng <= b.maxLng + 0.5
      );
    });
  }, [jobs, selectedCountry, countryConfig.bounds]);

  const selectedJob = countryJobs.find((j) => j.id === selectedJobId) || countryJobs[0] || jobs[0];
  const filteredJobs = countryJobs.filter((j) => (filterModule === 'all' ? true : j.module === filterModule));

  // Current screen definition from config
  const currentScreenMeta = countryConfig.screens.find((s) => s.screenType === screenMode);

  return (
    <div className="space-y-6">
      {/* Country Jurisdiction Selector Bar */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isJurisdictionLocked
            ? darkMode
              ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-800/60'
              : 'bg-gradient-to-r from-cyan-50 via-white to-slate-50 border-cyan-200 shadow-xs'
            : darkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl text-white shadow-sm shrink-0 ${
                isJurisdictionLocked ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              {isJurisdictionLocked ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">{countryConfig.flag}</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isJurisdictionLocked
                    ? `${countryConfig.countryName} Sovereign Radar & Telemetry`
                    : 'East African Regional GPS Radar Network'}
                </h2>
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                    isJurisdictionLocked
                      ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {isJurisdictionLocked
                    ? `Jurisdiction Restricted: ${selectedCountry} Node`
                    : '8 Sovereign Nodes Active'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {isJurisdictionLocked ? (
                  <>
                    Radar markers, geofence corridors, and proximity requests strictly filtered to <strong>{countryConfig.countryName}</strong> per operator credentials ({user?.email || 'Active Operator'}). Cross-border assets withheld.
                  </>
                ) : (
                  <>
                    Interactive proximity dispatch radar, geofence perimeters, and live telemetry across East African operating countries.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Active operator indicator & 1-click persona switch */}
          {countryPersona && onSwitchPersona && user?.email !== countryPersona.email && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs">
              <UserCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <div className="text-[11px] text-amber-900 dark:text-amber-200">
                Viewing <strong>{countryConfig.countryName}</strong> radar.
              </div>
              <button
                onClick={() => onSwitchPersona(countryPersona)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] whitespace-nowrap transition-colors"
              >
                Log in as {countryConfig.countryCode} Operator
              </button>
            </div>
          )}
        </div>

        {/* Country buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          {ALL_EAST_AFRICA_COUNTRY_CODES.map((code) => {
            const conf = EAST_AFRICA_GPS_CONFIGS[code];
            const isSelected = selectedCountry === code;
            const isUserHome = user?.jurisdictionCountry === code;
            const isBlockedByJurisdiction = isJurisdictionLocked && code !== selectedCountry;

            return (
              <button
                key={code}
                onClick={() => {
                  if (isBlockedByJurisdiction) {
                    onPushToast?.(
                      'Jurisdiction Locked',
                      `Your session is bound to ${countryConfig.countryName} (${selectedCountry}). Switch persona to manage ${conf.countryName}.`,
                      'warning'
                    );
                    return;
                  }
                  setSelectedCountry(code);
                }}
                disabled={isBlockedByJurisdiction}
                className={`p-2.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? darkMode
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-sm ring-1 ring-cyan-500/50'
                      : 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-sm ring-1 ring-cyan-500/50'
                    : isBlockedByJurisdiction
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-400'
                    : darkMode
                    ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{conf.flag}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {conf.currency}
                  </span>
                </div>
                <div className="text-xs font-bold truncate flex items-center gap-1">
                  <span>{conf.countryName}</span>
                  {isBlockedByJurisdiction && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{conf.capital}</div>

                {isUserHome && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"
                    title="Your Home Jurisdiction"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen Mode Switcher Bar */}
      <div
        className={`p-3 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'radar_map' as const, label: 'Live GPS Radar Map', icon: Navigation },
              { id: 'dispatch_queue' as const, label: 'Dispatch Queue & Match', icon: Radio },
              { id: 'geofence_radar' as const, label: 'Geofences & Terminals', icon: ShieldCheck },
              { id: 'traffic_heatmap' as const, label: 'Corridor Traffic Telemetry', icon: Flame },
              { id: 'deviation_reroute' as const, label: 'Route Deviation Alarms', icon: AlertTriangle },
              { id: 'driver_telemetry' as const, label: 'In-Cab Driver HUD', icon: Smartphone },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = screenMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setScreenMode(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Audit Blueprint Trigger */}
          {currentScreenMeta && (
            <button
              onClick={() => setSelectedScreenForAudit(currentScreenMeta)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Preview Screen Blueprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Banner: Simulator Header & Controls */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{countryConfig.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    {countryConfig.countryName} GPS Dispatch Radar
                  </h1>
                  <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    · {countryConfig.capital} Node Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Proximity routing engine matching passengers and freight cargo to the nearest active fleet units in {countryConfig.countryName}. Bounds: [{countryConfig.bounds.minLat}°, {countryConfig.bounds.minLng}°] to [{countryConfig.bounds.maxLat}°, {countryConfig.bounds.maxLng}°].
                </p>
              </div>
            </div>
          </div>

          {/* Execution & Speed Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs whitespace-nowrap shrink-0 ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause Simulation' : 'Resume Sim'}</span>
            </button>

            {/* Speed Multiplier */}
            <div
              className={`flex items-center rounded-xl p-1 border ${
                darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSpeedMultiplier(speed)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition-all ${
                    speedMultiplier === speed
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Auto-Demand Toggle */}
            <button
              onClick={() => setAutoOrderGeneration(!autoOrderGeneration)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
                autoOrderGeneration
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30'
                  : darkMode
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Automatically inject simulated ride/cargo orders"
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  autoOrderGeneration ? 'text-cyan-700 dark:text-cyan-400 animate-spin' : ''
                }`}
              />
              <span>Auto Demand: {autoOrderGeneration ? 'ON' : 'OFF'}</span>
            </button>

            {/* Instant Quick Trigger */}
            <div className="relative group">
              <button
                onClick={() => handleManualDispatch('airport')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inject Booking</span>
              </button>
              <div
                className={`absolute right-0 top-full mt-1.5 w-52 py-1.5 rounded-xl border shadow-2xl hidden group-hover:block z-30 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <button
                  onClick={() => handleManualDispatch('airport')}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-800 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Car className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  <span>Airport Express (Ride)</span>
                </button>
                <button
                  onClick={() => handleManualDispatch('freight')}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-800 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>Freight &amp; Cargo Corridor</span>
                </button>
                <button
                  onClick={() => handleManualDispatch('commercial')}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-800 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>{countryConfig.capital} VIP (Ride)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync message alert banner */}
        {syncStatusMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
            <span className="font-medium">{syncStatusMsg}</span>
          </div>
        )}

        {/* Audio Ping Notice */}
        {audioPingNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
            <span className="font-medium">{audioPingNotice}</span>
          </div>
        )}

        {/* Real-time Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/70">
          <div
            className={`p-3 rounded-xl border ${
              darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-700 dark:text-cyan-400" /> Dispatch Match Latency
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {avgMatchTime}s{' '}
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-sans font-semibold">
                Autonomous
              </span>
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Active Dispatches
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {jobs.filter((j) => j.status !== 'Completed').length}{' '}
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans font-normal">
                {countryConfig.countryCode} units tracking
              </span>
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-blue-700 dark:text-blue-400" /> Total Completed
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {totalDispatched}{' '}
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-sans font-semibold">
                99.2% on-time
              </span>
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-purple-700 dark:text-purple-400" /> Regional Currency Rail
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">
              {countryConfig.currency} ({countryConfig.currencySymbol}) · Haversine v2.4
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area Based on Selected Screen Mode */}

      {/* MODE 1: LIVE RADAR MAP & HUD */}
      {(screenMode === 'radar_map' || screenMode === 'geofence_radar' || screenMode === 'traffic_heatmap') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Interactive Vector Radar Map */}
          <div className="lg:col-span-8 space-y-4">
            <div
              className={`p-4 rounded-2xl border relative overflow-hidden ${
                darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Map Header Overlay with Geofencing & Traffic Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 z-10 relative">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {countryConfig.countryName} Metropolitan Radar ({countryConfig.bounds.center[0].toFixed(4)}° N, {countryConfig.bounds.center[1].toFixed(4)}° E)
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    AmbaLay Maps ({countryConfig.countryCode} Grid Active)
                  </span>
                </div>
                {/* Layer Toggles & Deviation Test */}
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {/* Geofence Toggle */}
                  <button
                    onClick={() => setShowGeofences(!showGeofences)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      showGeofences
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Toggle Geofence Boundaries"
                  >
                    <ShieldCheck className="w-3 h-3 text-purple-400" />
                    <span>Geofences ({geofences.length})</span>
                  </button>
                  {/* Traffic Toggle */}
                  <button
                    onClick={() => setShowTraffic(!showTraffic)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      showTraffic
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Toggle Live Traffic Congestion Heatmap"
                  >
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Traffic Heatmap</span>
                  </button>
                  {/* Test Deviation Trigger */}
                  {selectedJob && (
                    <button
                      onClick={() => handleSimulateDeviation(selectedJob.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                      title="Simulate vehicle veering off assigned AmbaLay route"
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>Test Deviation</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Vector SVG Map Viewport */}
              <div className="relative w-full aspect-[16/10] bg-slate-950/90 rounded-xl overflow-hidden border border-slate-800/60">
                <svg viewBox="0 0 800 520" className="w-full h-full select-none">
                  {/* Background Radar Grid lines */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="0.8" />
                    </pattern>
                  </defs>

                  <rect width="800" height="520" fill="#090d16" />
                  <rect width="800" height="520" fill="url(#grid)" />

                  {/* Radar Concentric Distance Rings */}
                  <circle cx="400" cy="260" r="120" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="400" cy="260" r="220" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" strokeDasharray="6 6" />

                  {/* Dynamic Arterial Highway Network based on country locations */}
                  {countryConfig.locations.slice(0, 6).map((node, i) => {
                    if (i === 0) return null;
                    const prevPt = geoToSvg(countryConfig.locations[i - 1].coords, countryConfig.bounds);
                    const curPt = geoToSvg(node.coords, countryConfig.bounds);
                    return (
                      <line
                        key={`arterial-${i}`}
                        x1={prevPt.x}
                        y1={prevPt.y}
                        x2={curPt.x}
                        y2={curPt.y}
                        stroke={node.category === 'freight' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(59, 130, 246, 0.35)'}
                        strokeWidth={node.category === 'freight' ? '4' : '3'}
                        strokeDasharray={node.category === 'freight' ? '8 4' : undefined}
                      />
                    );
                  })}
                  {countryConfig.locations.length >= 8 && (
                    <line
                      x1={geoToSvg(countryConfig.locations[1].coords, countryConfig.bounds).x}
                      y1={geoToSvg(countryConfig.locations[1].coords, countryConfig.bounds).y}
                      x2={geoToSvg(countryConfig.locations[countryConfig.locations.length - 2].coords, countryConfig.bounds).x}
                      y2={geoToSvg(countryConfig.locations[countryConfig.locations.length - 2].coords, countryConfig.bounds).y}
                      stroke="rgba(168, 85, 247, 0.3)"
                      strokeWidth="3.5"
                      strokeDasharray="6 3"
                    />
                  )}

                  {/* Geofence Perimeter Zones */}
                  {showGeofences &&
                    geofences.map((gf) => {
                      const pt = geoToSvg(gf.center, countryConfig.bounds);
                      const radiusPx = Math.max(18, (gf.radiusMeters / 1000) * 16);
                      return (
                        <g key={gf.id}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={radiusPx}
                            fill={gf.color}
                            fillOpacity="0.08"
                            stroke={gf.color}
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <circle cx={pt.x} cy={pt.y} r="2.5" fill={gf.color} opacity="0.6" />
                          <text
                            x={pt.x}
                            y={pt.y - radiusPx - 4}
                            textAnchor="middle"
                            fill={gf.color}
                            fontSize="8.5"
                            fontFamily="sans-serif"
                            fontWeight="600"
                            opacity="0.9"
                          >
                            ⬡ {gf.name} ({(gf.radiusMeters / 1000).toFixed(1)} km)
                          </text>
                        </g>
                      );
                    })}

                  {/* Live Traffic Congestion Corridors */}
                  {showTraffic &&
                    trafficCorridors.map((corridor) => {
                      const color =
                        corridor.severity === 'standstill'
                          ? '#ef4444'
                          : corridor.severity === 'heavy'
                          ? '#f97316'
                          : corridor.severity === 'moderate'
                          ? '#eab308'
                          : '#10b981';

                      const pts = corridor.coordinates.map((c) => geoToSvg(c, countryConfig.bounds));
                      const polylineStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                      const midPt = pts[Math.floor(pts.length / 2)] || pts[0];

                      return (
                        <g key={corridor.id}>
                          <polyline
                            points={polylineStr}
                            fill="none"
                            stroke={color}
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.45"
                          />
                          <polyline
                            points={polylineStr}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            strokeLinecap="round"
                            opacity="0.6"
                          />
                          <text
                            x={midPt.x}
                            y={midPt.y - 8}
                            textAnchor="middle"
                            fill={color}
                            fontSize="8"
                            fontFamily="sans-serif"
                            fontWeight="700"
                          >
                            {corridor.name}: {corridor.severity.toUpperCase()} (+{corridor.delayMinutes}m)
                          </text>
                        </g>
                      );
                    })}

                  {/* Country City Landmarks / Node Markers */}
                  {countryConfig.locations.map((node, idx) => {
                    const pt = geoToSvg(node.coords, countryConfig.bounds);
                    return (
                      <g key={idx} className="cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          fill={node.category === 'freight' ? '#f59e0b' : '#38bdf8'}
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="10"
                          fill="none"
                          stroke={node.category === 'freight' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)'}
                        />
                        <text
                          x={pt.x + 8}
                          y={pt.y + 4}
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="sans-serif"
                          fontWeight="600"
                        >
                          {node.name.split(' (')[0]}
                        </text>
                      </g>
                    );
                  })}

                  {/* Active Dispatched Trips Route Vectors */}
                  {countryJobs.map((job) => {
                    const pPt = geoToSvg(job.pickupCoords, countryConfig.bounds);
                    const dPt = geoToSvg(job.dropoffCoords, countryConfig.bounds);
                    const isSelected = job.id === selectedJob?.id;
                    const curPt = job.currentCoords
                      ? geoToSvg(job.currentCoords, countryConfig.bounds)
                      : pPt;

                    return (
                      <g key={job.id} onClick={() => setSelectedJobId(job.id)} className="cursor-pointer">
                        {/* Route Path */}
                        {job.ambalayRouteCoords && job.ambalayRouteCoords.length > 1 ? (
                          <polyline
                            points={job.ambalayRouteCoords
                              .map((c) => {
                                const pt = geoToSvg(c, countryConfig.bounds);
                                return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                              })
                              .join(' ')}
                            fill="none"
                            stroke={
                              job.rerouted
                                ? '#10b981'
                                : job.module === 'truck'
                                ? '#f59e0b'
                                : isSelected
                                ? '#06b6d4'
                                : '#3b82f6'
                            }
                            strokeWidth={isSelected ? '3' : '2'}
                            strokeDasharray={job.status === 'Queued' ? '4 4' : undefined}
                            opacity={isSelected ? 1 : 0.75}
                          />
                        ) : (
                          <line
                            x1={pPt.x}
                            y1={pPt.y}
                            x2={dPt.x}
                            y2={dPt.y}
                            stroke={
                              job.rerouted
                                ? '#10b981'
                                : job.module === 'truck'
                                ? '#f59e0b'
                                : isSelected
                                ? '#06b6d4'
                                : '#3b82f6'
                            }
                            strokeWidth={isSelected ? '2.5' : '1.5'}
                            strokeDasharray={job.status === 'Queued' ? '4 4' : undefined}
                            opacity={isSelected ? 1 : 0.65}
                          />
                        )}

                        {/* Pickup Marker */}
                        <circle cx={pPt.x} cy={pPt.y} r="4" fill="#10b981" />

                        {/* Destination Marker */}
                        <circle cx={dPt.x} cy={dPt.y} r="4" fill="#ef4444" />

                        {/* Moving Vehicle Dot */}
                        {job.status !== 'Queued' && job.status !== 'Completed' && (
                          <g>
                            <circle
                              cx={curPt.x}
                              cy={curPt.y}
                              r={job.isDeviated ? (isSelected ? '20' : '15') : isSelected ? '14' : '10'}
                              fill="none"
                              stroke={job.isDeviated ? '#ef4444' : job.module === 'truck' ? '#f59e0b' : '#06b6d4'}
                              strokeWidth={job.isDeviated ? '2.5' : '1.5'}
                              className="animate-ping"
                            />
                            <circle
                              cx={curPt.x}
                              cy={curPt.y}
                              r={isSelected ? '7' : '5'}
                              fill={job.isDeviated ? '#ef4444' : job.module === 'truck' ? '#f59e0b' : '#06b6d4'}
                            />
                            <text
                              x={curPt.x + 8}
                              y={curPt.y - 6}
                              fill={job.isDeviated ? '#f87171' : isSelected ? '#38bdf8' : '#e2e8f0'}
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {job.isDeviated ? '⚠ ' : ''}
                              {job.tripId} ({job.speedKmh} km/h)
                              {job.isDeviated ? ` +${Math.round(job.deviationMeters || 380)}m OFF-ROUTE` : ''}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Legend Overlay in Map Bottom-Left */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" /> Ride
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Freight Truck
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Bypass Route
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Deviated (&gt;350m)
                  </span>
                </div>
              </div>
            </div>

            {/* Live Queue Table inside the radar view */}
            <div
              className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {countryConfig.countryName} Real-time Proximity Queue
                  </h3>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                    ({jobs.length} jobs)
                  </span>
                </div>

                <div
                  className={`flex items-center rounded-lg p-0.5 border ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {(['all', 'ride', 'truck'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterModule(cat)}
                      className={`px-2.5 py-1 rounded-md font-semibold capitalize text-[11px] transition-colors whitespace-nowrap ${
                        filterModule === cat
                          ? 'bg-white dark:bg-cyan-500 text-slate-900 dark:text-slate-950 shadow-xs'
                          : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/50 text-left text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-800 text-[11px]">
                      <th className="py-2 pl-2 font-semibold">Trip ID</th>
                      <th className="py-2 font-semibold">Module</th>
                      <th className="py-2 font-semibold">Passenger / Cargo</th>
                      <th className="py-2 font-semibold">Pickup → Destination</th>
                      <th className="py-2 font-semibold">Driver</th>
                      <th className="py-2 font-semibold">Status</th>
                      <th className="py-2 font-semibold text-right">Fare ({countryConfig.currency})</th>
                      <th className="py-2 pr-2 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/60">
                    {filteredJobs.map((job) => {
                      const isSelected = job.id === selectedJob?.id;
                      return (
                        <tr
                          key={job.id}
                          onClick={() => setSelectedJobId(job.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-cyan-50 dark:bg-cyan-500/10 text-slate-900 dark:text-white font-medium'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 pl-2 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                            {job.tripId}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                job.module === 'truck'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-cyan-700 dark:text-cyan-400'
                              }`}
                            >
                              {job.module === 'truck' ? <Truck className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                              {job.module.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 font-medium text-slate-900 dark:text-white">{job.passenger}</td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                            {job.pickupName.split(' (')[0]} → {job.dropoffName.split(' (')[0]}
                          </td>
                          <td className="py-2.5">
                            {job.driverName ? (
                              <span className="text-slate-900 dark:text-white font-medium">{job.driverName}</span>
                            ) : (
                              <span className="text-amber-700 dark:text-amber-400 italic font-medium">Matching...</span>
                            )}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`text-[11px] font-semibold ${
                                job.status === 'Completed'
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : job.status === 'Onboard' || job.status === 'En Route'
                                  ? 'text-cyan-700 dark:text-cyan-300'
                                  : job.status === 'Assigned'
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {job.fareETB.toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-2 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSyncToBack4App(job);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-[10px] font-semibold text-white transition-colors whitespace-nowrap"
                              title="Push trip record to Back4App Parse Cloud"
                            >
                              Sync DB
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Live Telemetry Cockpit & HUD */}
          <div className="lg:col-span-4 space-y-4">
            {selectedJob ? (
              <div
                className={`p-5 rounded-2xl border ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                } space-y-4`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-400">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Telemetry HUD</h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {selectedJob.tripId} · {countryConfig.countryCode}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold ${
                      selectedJob.status === 'Completed'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-cyan-700 dark:text-cyan-300'
                    }`}
                  >
                    {selectedJob.status}
                  </span>
                </div>

                {/* Reroute Success Toast */}
                {rerouteSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <span>{rerouteSuccessMsg}</span>
                  </div>
                )}

                {/* Route Deviation Alert Card */}
                {selectedJob.isDeviated ? (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-rose-800 dark:text-rose-200">CORRIDOR DEVIATION ALERT</h4>
                        <p className="text-rose-700 dark:text-rose-300 text-[11px] mt-0.5">
                          Vehicle veered{' '}
                          <span className="font-mono font-bold">
                            +{Math.round(selectedJob.deviationMeters || 380)}m
                          </span>{' '}
                          off authorized corridor.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setAudioPingNotice(`Radio Check-In sent to driver ${selectedJob.driverName}`);
                          setTimeout(() => setAudioPingNotice(null), 3500);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Ping Driver Check-in</span>
                      </button>
                      <button
                        onClick={() => handleResolveDeviation(selectedJob.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] transition-colors"
                      >
                        Realign Route
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] ${
                      darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Corridor Deviation: <strong className="text-slate-900 dark:text-white">Normal (0m)</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => handleSimulateDeviation(selectedJob.id)}
                      className="text-[11px] text-rose-700 dark:text-rose-400 hover:underline font-semibold"
                    >
                      Simulate Veering Off
                    </button>
                  </div>
                )}

                {/* Real-time Traffic Impact & Dynamic Re-Route Box */}
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                    selectedJob.rerouted
                      ? darkMode
                        ? 'bg-emerald-950/20 border-emerald-800/50'
                        : 'bg-emerald-50 border-emerald-200'
                      : selectedJob.trafficSeverity && selectedJob.trafficSeverity !== 'clear'
                      ? darkMode
                        ? 'bg-amber-950/20 border-amber-800/50'
                        : 'bg-amber-50 border-amber-200'
                      : darkMode
                      ? 'bg-slate-950/40 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame
                        className={`w-4 h-4 ${
                          selectedJob.rerouted
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : selectedJob.trafficSeverity === 'standstill'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {countryConfig.countryName} Traffic &amp; Route Bypass
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        selectedJob.rerouted
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : selectedJob.trafficSeverity === 'standstill'
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {selectedJob.rerouted
                        ? 'BYPASS ACTIVE'
                        : (selectedJob.trafficSeverity || 'MODERATE').toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    {selectedJob.rerouted
                      ? 'Alternative bypass corridor engaged. Travel time and congestion minimized.'
                      : 'Arterial traffic monitored along primary corridor. Dynamic bypass routing available.'}
                  </p>

                  <button
                    onClick={() => handleDynamicTrafficReroute(selectedJob.id)}
                    disabled={isRerouting}
                    className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                      selectedJob.rerouted
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>
                      {selectedJob.rerouted
                        ? 'Recalculate Alternative Bypass'
                        : 'Apply Dynamic Traffic Re-Route'}
                    </span>
                  </button>
                </div>

                {/* Progress Bar & ETA */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-400 font-medium">Route Progress</span>
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">
                      {Math.round(selectedJob.progressPercent)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 rounded-full transition-all duration-300"
                      style={{ width: `${selectedJob.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span>Distance: {selectedJob.distanceKm} km</span>
                    <span>
                      Est. Arrival:{' '}
                      <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
                        {selectedJob.etaMinutes} mins
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Real-Time Gauges */}
                <div className="grid grid-cols-3 gap-2.5 py-2">
                  <div
                    className={`p-2.5 rounded-xl border text-center ${
                      darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Speed</span>
                    <p className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                      {selectedJob.speedKmh}
                    </p>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400">km/h</span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border text-center ${
                      darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Battery</span>
                    <p className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                      {selectedJob.batteryPercent}%
                    </p>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Optimal</span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border text-center ${
                      darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Heading</span>
                    <p className="text-lg font-mono font-bold text-cyan-700 dark:text-cyan-400 tabular-nums mt-0.5">
                      {selectedJob.headingDeg}°
                    </p>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400">Vector</span>
                  </div>
                </div>

                {/* Route Waypoint Details */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-2.5 ${
                    darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mb-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pickup Node ({countryConfig.countryCode})</span>
                    </div>
                    <p className="text-slate-900 dark:text-white font-medium pl-5">{selectedJob.pickupName}</p>
                    <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 pl-5">
                      [{selectedJob.pickupCoords[0].toFixed(4)}, {selectedJob.pickupCoords[1].toFixed(4)}]
                    </p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800/60 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-400 font-semibold mb-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Dropoff Target</span>
                    </div>
                    <p className="text-slate-900 dark:text-white font-medium pl-5">{selectedJob.dropoffName}</p>
                    <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 pl-5">
                      [{selectedJob.dropoffCoords[0].toFixed(4)}, {selectedJob.dropoffCoords[1].toFixed(4)}]
                    </p>
                  </div>
                </div>

                {/* Driver & Vehicle Information */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Assigned Driver</span>
                    <span className="text-slate-900 dark:text-white font-semibold">
                      {selectedJob.driverName || 'Pending Auto-Match'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Vehicle Plate</span>
                    <span className="text-cyan-700 dark:text-cyan-400 font-mono font-bold">
                      {selectedJob.vehiclePlate || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Passenger / Account</span>
                    <span className="text-slate-900 dark:text-white font-medium">{selectedJob.passenger}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Total Fare</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-sm tabular-nums">
                      {countryConfig.currency} {selectedJob.fareETB.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleSyncToBack4App(selectedJob)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-600/20"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Trip to Back4App Parse</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`p-8 rounded-2xl border text-center ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <Navigation className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">Select any trip from the map or queue to inspect telemetry.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: DISPATCH QUEUE VIEW */}
      {screenMode === 'dispatch_queue' && (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-2xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-600" />
                  {countryConfig.countryName} Autonomous Dispatch Queue &amp; Proximity Matchmaking
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Real-time algorithmic dispatch matching passengers and freight cargo to the nearest active {countryConfig.countryCode} fleet drivers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleManualDispatch('airport')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Ride Dispatch</span>
                </button>
                <button
                  onClick={() => handleManualDispatch('freight')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Freight Manifest</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 text-left text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-800 text-[11px]">
                    <th className="py-2.5 pl-3 font-semibold">Trip ID</th>
                    <th className="py-2.5 font-semibold">Module</th>
                    <th className="py-2.5 font-semibold">Passenger / Consignor</th>
                    <th className="py-2.5 font-semibold">Route (Origin → Destination)</th>
                    <th className="py-2.5 font-semibold">Assigned Fleet Driver</th>
                    <th className="py-2.5 font-semibold">Speed / ETA</th>
                    <th className="py-2.5 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold text-right">Fare ({countryConfig.currency})</th>
                    <th className="py-2.5 pr-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/60">
                  {countryJobs.map((job) => (
                    <tr
                      key={job.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        selectedJobId === job.id ? 'bg-cyan-50/50 dark:bg-cyan-500/10' : ''
                      }`}
                    >
                      <td className="py-3 pl-3 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                        {job.tripId}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            job.module === 'truck' ? 'text-amber-700 dark:text-amber-400' : 'text-cyan-700 dark:text-cyan-400'
                          }`}
                        >
                          {job.module === 'truck' ? <Truck className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                          {job.module.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        <div>{job.passenger}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{job.passengerPhone}</div>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        <div>{job.pickupName}</div>
                        <div className="text-[10px] text-slate-500">→ {job.dropoffName}</div>
                      </td>
                      <td className="py-3">
                        {job.driverName ? (
                          <div>
                            <div className="text-slate-900 dark:text-white font-medium">{job.driverName}</div>
                            <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{job.vehiclePlate}</div>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic">Matching Nearest Unit...</span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        <div>{job.speedKmh} km/h</div>
                        <div className="text-[10px] text-slate-500">{job.etaMinutes} mins remaining</div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'Completed'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                              : job.status === 'Onboard' || job.status === 'En Route'
                              ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {countryConfig.currencySymbol} {job.fareETB.toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setScreenMode('radar_map');
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-semibold"
                          >
                            Radar
                          </button>
                          <button
                            onClick={() => handleSyncToBack4App(job)}
                            className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-semibold"
                          >
                            Sync DB
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODE 5: ROUTE DEVIATION ALARMS VIEW */}
      {screenMode === 'deviation_reroute' && (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-2xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {countryConfig.countryName} Route Deviation &amp; Corridor Enforcement Console
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Automated AmbaLay corridor tracking (&gt;350m threshold). Instant real-time driver alert and bypass routing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedJob && (
                  <button
                    onClick={() => handleSimulateDeviation(selectedJob.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Simulate Off-Route Alert</span>
                  </button>
                )}
              </div>
            </div>

            {deviationAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-600 dark:text-slate-400 text-sm">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-600 dark:text-emerald-500" />
                <p className="font-semibold text-slate-900 dark:text-white">All Fleet Units Within Bounds</p>
                <p className="text-xs mt-0.5">
                  Zero active route deviations detected across {countryConfig.countryName} transit perimeters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deviationAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors ${
                      alert.status === 'active'
                        ? darkMode
                          ? 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                        : darkMode
                        ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          alert.status === 'active' ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            {alert.tripId}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Driver: <strong>{alert.driverName}</strong> ({alert.vehiclePlate})
                          </span>
                          <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                            +{Math.round(alert.deviationMeters)}m Off Corridor
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-300 mt-1">{alert.message}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Corridor: {alert.corridorName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedJobId(alert.jobId || null);
                          setAudioPingNotice(
                            `Audible Radio Ping transmitted to ${alert.driverName} (${alert.tripId}) in ${countryConfig.countryName}`
                          );
                          setTimeout(() => setAudioPingNotice(null), 3500);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Radio Ping</span>
                      </button>

                      {alert.jobId && (
                        <button
                          onClick={() => handleDynamicTrafficReroute(alert.jobId!)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Reroute</span>
                        </button>
                      )}

                      {alert.status === 'active' && (
                        <button
                          onClick={() => handleResolveDeviation(alert.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 6: IN-CAB DRIVER PWA TELEMETRY HUD */}
      {screenMode === 'driver_telemetry' && selectedJob && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Simulated Mobile Device Frame */}
          <div
            className={`p-6 rounded-3xl border shadow-xl ${
              darkMode ? 'bg-black border-slate-800 text-white' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {/* Phone Status Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-b border-slate-800">
              <span className="font-mono">09:41</span>
              <div className="flex items-center gap-2">
                <span>{countryConfig.countryCode} 5G Telematics</span>
                <span className="w-4 h-2.5 border border-slate-400 rounded-sm relative inline-block">
                  <span className="absolute inset-0.5 bg-emerald-400" />
                </span>
              </div>
            </div>

            {/* Mobile Cockpit Header */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Driver Navigation Active
                </span>
                <h3 className="text-lg font-bold">{selectedJob.driverName || 'Fleet Operator'}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedJob.vehiclePlate} · {countryConfig.sampleDrivers[0]?.vehicleModel || 'Fleet Unit'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300">
                <Navigation className="w-6 h-6" />
              </div>
            </div>

            {/* Speed Gauge */}
            <div className="my-6 p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-xs uppercase text-slate-400 font-semibold">Speedometer</span>
              <div className="text-5xl font-mono font-bold text-cyan-400 my-1">{selectedJob.speedKmh}</div>
              <span className="text-xs text-slate-400">KM / HOUR</span>
              <div className="mt-4 flex items-center justify-around text-xs border-t border-slate-800/80 pt-3">
                <div>
                  <div className="text-slate-400 text-[10px]">BATTERY</div>
                  <div className="font-mono font-bold text-emerald-400">{selectedJob.batteryPercent}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">VECTOR</div>
                  <div className="font-mono font-bold text-cyan-400">{selectedJob.headingDeg}°</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">ETA</div>
                  <div className="font-mono font-bold text-amber-400">{selectedJob.etaMinutes}m</div>
                </div>
              </div>
            </div>

            {/* Turn-by-Turn Instruction */}
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-200 text-xs flex items-center gap-3">
              <Compass className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Continue straight onto {selectedJob.dropoffName.split(' (')[0]}</div>
                <div className="text-[11px] text-cyan-300">In 350 meters, maintain authorized corridor speed</div>
              </div>
            </div>

            {/* Passenger Manifest */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Customer Manifest</span>
                <span className="font-bold text-white">{selectedJob.passenger}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trip Fare ({countryConfig.currency})</span>
                <span className="font-mono font-bold text-emerald-400">
                  {countryConfig.currencySymbol} {selectedJob.fareETB.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Audit Controls */}
          <div
            className={`p-6 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {countryConfig.countryName} In-Cab Telemetry Protocol
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Afronala Mobile Driver Companion PWA transmits telemetry every 1.2s to AmbaLay regional gateway and synchronizes with Back4App Parse.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Regional Gateway:</span>
                <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                  ambalay.{countryConfig.countryCode.toLowerCase()}.afronala.internal
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Speed Enforcement Threshold:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">80 km/h Urban / 100 km/h Highway</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Audible Check-in Ping:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Enabled (Amharic / Swahili / English)</span>
              </div>
            </div>

            <button
              onClick={() => {
                setAudioPingNotice(`Audible Radio ping sent to ${selectedJob.driverName}`);
                setTimeout(() => setAudioPingNotice(null), 3000);
              }}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Send In-Cab Radio Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* Screen Blueprint & Audit Inspection Modal */}
      {selectedScreenForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-600 text-white shadow-sm">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{countryConfig.flag}</span>
                    <h3 className="text-lg font-bold">{selectedScreenForAudit.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedScreenForAudit.subtitle} · {countryConfig.countryName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedScreenForAudit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Headline Metric Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-900/30 via-cyan-800/20 to-transparent border border-cyan-500/30">
                <span className="text-[11px] uppercase font-bold text-cyan-400">
                  {selectedScreenForAudit.headlineMetric.label}
                </span>
                <div className="text-2xl font-bold font-mono text-cyan-200 mt-0.5">
                  {selectedScreenForAudit.headlineMetric.value}
                </div>
                {selectedScreenForAudit.headlineMetric.secondary && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedScreenForAudit.headlineMetric.secondary}
                  </div>
                )}
              </div>

              {/* Sub-Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                {selectedScreenForAudit.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 font-semibold">{m.label}</span>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {m.value}
                    </div>
                    {m.sublabel && <div className="text-[10px] text-slate-400">{m.sublabel}</div>}
                  </div>
                ))}
              </div>

              {/* Operational & Architectural Guidelines */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Operational Architecture &amp; Telematics Guidelines
                </h4>
                <div className="space-y-2">
                  {selectedScreenForAudit.guidelines.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                        darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Jurisdiction: {countryConfig.countryName} ({countryConfig.currency})
              </span>
              <button
                onClick={() => {
                  setScreenMode(selectedScreenForAudit.screenType);
                  setSelectedScreenForAudit(null);
                  onPushToast?.(
                    `Loaded Screen: ${selectedScreenForAudit.title}`,
                    `Switched active radar workspace in ${countryConfig.countryName}.`,
                    'info'
                  );
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
              >
                {selectedScreenForAudit.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
