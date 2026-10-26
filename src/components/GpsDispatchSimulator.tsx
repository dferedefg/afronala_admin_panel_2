import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
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
  ShieldAlert,
  Eye,
  Activity,
  Layers,
  Search,
  Send,
  Flame,
  Route,
  Check,
  Volume2,
} from 'lucide-react';
import { DispatchJob, Driver, GeofenceZone, TrafficCorridor, DeviationAlert } from '../types';
import { ambalayService } from '../services/ambalay';

interface GpsDispatchSimulatorProps {
  darkMode: boolean;
  drivers: Driver[];
  onSyncTripToBack4App?: (job: DispatchJob) => Promise<any>;
}

// Key arterial locations in Addis Ababa & logistics corridor
interface LocationNode {
  name: string;
  coords: [number, number]; // [lat, lng]
  category: 'transit' | 'commercial' | 'freight' | 'residential';
}

const ADDIS_LOCATIONS: LocationNode[] = [
  { name: 'Bole Intl. Airport (Terminal 2)', coords: [8.9778, 38.7993], category: 'transit' },
  { name: 'Meskel Square Hub', coords: [9.0108, 38.7613], category: 'commercial' },
  { name: 'Kazanchis Business District', coords: [9.0195, 38.7698], category: 'commercial' },
  { name: 'Piassa Historical Center', coords: [9.0345, 38.7525], category: 'commercial' },
  { name: 'Sarbet International Zone', coords: [8.9961, 38.7368], category: 'residential' },
  { name: 'Mexico Square Junction', coords: [9.0125, 38.7456], category: 'transit' },
  { name: 'CMC Residential Corridor', coords: [9.0255, 38.8250], category: 'residential' },
  { name: 'Gotera Interchange', coords: [8.9882, 38.7588], category: 'transit' },
  { name: 'Kality Customs & Dry Port', coords: [8.9240, 38.7560], category: 'freight' },
  { name: 'Adama Express Tollway Link', coords: [8.9050, 38.8300], category: 'freight' },
];

// Helper: Calculate approximate distance in kilometers between two geo coords
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

// Convert Lat/Lng to SVG Radar Map X, Y coordinates
// Addis Bounds approx: Lat 8.89 to 9.06 (South to North), Lng 38.71 to 38.85 (West to East)
function geoToSvg(coords: [number, number], width = 800, height = 520): { x: number; y: number } {
  const minLat = 8.89;
  const maxLat = 9.06;
  const minLng = 38.71;
  const maxLng = 38.86;

  const xNorm = (coords[1] - minLng) / (maxLng - minLng);
  const yNorm = 1 - (coords[0] - minLat) / (maxLat - minLat); // inverted for SVG Y

  return {
    x: Math.max(30, Math.min(width - 30, xNorm * (width - 60) + 30)),
    y: Math.max(30, Math.min(height - 30, yNorm * (height - 60) + 30)),
  };
}

export const GpsDispatchSimulator: React.FC<GpsDispatchSimulatorProps> = ({
  darkMode,
  drivers,
  onSyncTripToBack4App,
}) => {
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
  const [geofences, setGeofences] = useState<GeofenceZone[]>(() => ambalayService.getGeofences());
  const [trafficCorridors] = useState<TrafficCorridor[]>(() => ambalayService.getTrafficCorridors());
  const [deviationAlerts, setDeviationAlerts] = useState<DeviationAlert[]>([
    {
      id: 'dev-seed-1',
      tripId: 'TRP-9801',
      jobId: 'dsp-1',
      driverName: 'Abebe Kebede',
      vehiclePlate: 'AA-12345',
      timestamp: '2m ago',
      deviationMeters: 420,
      corridorName: 'Bole Intl. Airport → Kazanchis',
      resolved: false,
      status: 'active',
      severity: 'warning',
      message: 'Vehicle veered 420m off authorized Bole Road corridor.',
    },
  ]);
  const [isRerouting, setIsRerouting] = useState(false);
  const [rerouteSuccessMsg, setRerouteSuccessMsg] = useState<string | null>(null);
  const [audioPingNotice, setAudioPingNotice] = useState<string | null>(null);

  // Active dispatch jobs
  const [jobs, setJobs] = useState<DispatchJob[]>([
    {
      id: 'dsp-1',
      tripId: 'TRP-9801',
      module: 'ride',
      passenger: 'Selamawit Tadesse',
      passengerPhone: '0922 455 667',
      pickupName: 'Bole Intl. Airport (Terminal 2)',
      pickupCoords: [8.9778, 38.7993],
      dropoffName: 'Kazanchis Business District',
      dropoffCoords: [9.0195, 38.7698],
      status: 'En Route',
      fareETB: 480,
      distanceKm: 7.2,
      driverId: 'drv-1',
      driverName: 'Abebe Kebede',
      vehiclePlate: 'AA-12345',
      currentCoords: [8.9950, 38.7850],
      speedKmh: 42,
      batteryPercent: 88,
      etaMinutes: 6,
      headingDeg: 315,
      progressPercent: 45,
      requestedAt: '4m ago',
    },
    {
      id: 'dsp-2',
      tripId: 'TRP-9802',
      module: 'ride',
      passenger: 'Dawit Yohannes',
      passengerPhone: '0911 349 821',
      pickupName: 'Meskel Square Hub',
      pickupCoords: [9.0108, 38.7613],
      dropoffName: 'Sarbet International Zone',
      dropoffCoords: [8.9961, 38.7368],
      status: 'Onboard',
      fareETB: 320,
      distanceKm: 4.8,
      driverId: 'drv-2',
      driverName: 'Bekele Tesfaye',
      vehiclePlate: 'BB-67890',
      currentCoords: [9.0040, 38.7490],
      speedKmh: 36,
      batteryPercent: 94,
      etaMinutes: 4,
      headingDeg: 220,
      progressPercent: 68,
      requestedAt: '7m ago',
    },
    {
      id: 'dsp-3',
      tripId: 'FRT-4401',
      module: 'truck',
      passenger: 'Habesha Breweries Mojo Logistics',
      passengerPhone: '0930 112 233',
      pickupName: 'Kality Customs & Dry Port',
      pickupCoords: [8.9240, 38.7560],
      dropoffName: 'Adama Express Tollway Link',
      dropoffCoords: [8.9050, 38.8300],
      status: 'Assigned',
      fareETB: 9800,
      distanceKm: 16.4,
      driverId: 'drv-3',
      driverName: 'Yonas Mulugeta',
      vehiclePlate: 'ET-38491',
      currentCoords: [8.9210, 38.7610],
      speedKmh: 48,
      batteryPercent: 90,
      etaMinutes: 18,
      headingDeg: 110,
      progressPercent: 12,
      requestedAt: '1m ago',
    },
    {
      id: 'dsp-4',
      tripId: 'TRP-9803',
      module: 'ride',
      passenger: 'Marta Haile',
      passengerPhone: '0944 887 766',
      pickupName: 'Piassa Historical Center',
      pickupCoords: [9.0345, 38.7525],
      dropoffName: 'CMC Residential Corridor',
      dropoffCoords: [9.0255, 38.8250],
      status: 'Queued',
      fareETB: 540,
      distanceKm: 9.1,
      speedKmh: 0,
      batteryPercent: 100,
      etaMinutes: 14,
      headingDeg: 90,
      progressPercent: 0,
      requestedAt: 'Just now',
    },
  ]);

  // Telemetry KPIs
  const [totalDispatched, setTotalDispatched] = useState(148);
  const [avgMatchTime, setAvgMatchTime] = useState(1.4); // seconds

  // Dispatch Queue Processing Loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setJobs((prevJobs) => {
        return prevJobs.map((job) => {
          // If Queued: Proximity Dispatch Algorithm assigns available driver
          if (job.status === 'Queued') {
            const candidateDrivers = drivers.length > 0 ? drivers : [
              { name: 'Kassahun Worku', vehiclePlate: 'AA-99882' },
              { name: 'Fikadu Belay', vehiclePlate: '3-B-44120' },
            ];
            const randomDriver = candidateDrivers[Math.floor(Math.random() * candidateDrivers.length)];
            return {
              ...job,
              status: 'Assigned',
              driverId: 'drv-dyn-' + Date.now().toString().slice(-4),
              driverName: randomDriver.name,
              vehiclePlate: randomDriver.vehiclePlate || 'AA-77441',
              speedKmh: 28 + Math.floor(Math.random() * 20),
              currentCoords: [job.pickupCoords[0] - 0.005, job.pickupCoords[1] - 0.005],
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

          // If En Route -> Move toward destination along AmbaLay road geometry
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

            // Periodic telemetry ping to AmbaLay Trip tracking
            if (job.ambalayTripId && Math.random() < 0.2) {
              ambalayService.updateTrip(job.ambalayTripId, { lat: newLat, lon: newLng }).catch(() => {});
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
                  message: `Vehicle veered ${Math.round(dev.deviationMeters)}m off corridor.`,
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
                speedKmh: matchedCorridor?.severity === 'standstill' ? 12 : matchedCorridor?.severity === 'heavy' ? 18 : 35 + Math.floor(Math.random() * 20),
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
              speedKmh: matchedCorridor?.severity === 'standstill' ? 12 : matchedCorridor?.severity === 'heavy' ? 18 : 32 + Math.floor(Math.random() * 24),
              etaMinutes: Math.max(1, Math.round((100 - nextProgress) / 8) + trafficDelay),
              deviationMeters: dev.deviationMeters,
              isDeviated: dev.isDeviated,
              trafficSeverity: trafficSev,
            };
          }

          // If Onboard -> Move to 100% along AmbaLay road geometry, then mark Completed
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
              speedKmh: matchedCorridor?.severity === 'standstill' ? 12 : 36 + Math.floor(Math.random() * 22),
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
  }, [isPlaying, speedMultiplier, drivers]);

  // Periodic Auto-Order Generator
  useEffect(() => {
    if (!autoOrderGeneration || !isPlaying) return;

    const orderInterval = setInterval(() => {
      // Pick random pickup and dropoff
      const pickupIdx = Math.floor(Math.random() * ADDIS_LOCATIONS.length);
      let dropoffIdx = Math.floor(Math.random() * ADDIS_LOCATIONS.length);
      while (dropoffIdx === pickupIdx) {
        dropoffIdx = Math.floor(Math.random() * ADDIS_LOCATIONS.length);
      }

      const pNode = ADDIS_LOCATIONS[pickupIdx];
      const dNode = ADDIS_LOCATIONS[dropoffIdx];
      const dist = calculateGeoDistance(pNode.coords, dNode.coords);
      const isFreight = pNode.category === 'freight' || dNode.category === 'freight';

      const names = ['Henok Alemu', 'Tigist Assefa', 'Kidus Berhanu', 'Bethlehem Girma', 'Yared Shiferaw'];
      const customer = names[Math.floor(Math.random() * names.length)];
      const fare = isFreight ? 4500 + Math.round(dist * 280) : 180 + Math.round(dist * 45);

      const newJob: DispatchJob = {
        id: 'dsp-' + Date.now(),
        tripId: (isFreight ? 'FRT-' : 'TRP-') + Math.floor(1000 + Math.random() * 9000),
        module: isFreight ? 'truck' : 'ride',
        passenger: isFreight ? `${customer} (Bulk Freight)` : customer,
        passengerPhone: `09${Math.floor(10 + Math.random() * 89)} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(100 + Math.random() * 899)}`,
        pickupName: pNode.name,
        pickupCoords: pNode.coords,
        dropoffName: dNode.name,
        dropoffCoords: dNode.coords,
        status: 'Queued',
        fareETB: fare,
        distanceKm: dist,
        speedKmh: 0,
        batteryPercent: 95,
        etaMinutes: Math.round(dist * 2.8),
        headingDeg: Math.floor(Math.random() * 360),
        progressPercent: 0,
        requestedAt: 'Just now',
      };

      setJobs((prev) => [newJob, ...prev.slice(0, 7)]); // Keep active queue focused
    }, 12000 / speedMultiplier);

    return () => clearInterval(orderInterval);
  }, [autoOrderGeneration, isPlaying, speedMultiplier]);

  // Initial AmbaLay route geometry hydration for demo jobs
  useEffect(() => {
    ambalayService
      .calculateRoute(
        { lat: ADDIS_LOCATIONS[0].coords[0], lon: ADDIS_LOCATIONS[0].coords[1] },
        { lat: ADDIS_LOCATIONS[2].coords[0], lon: ADDIS_LOCATIONS[2].coords[1] }
      )
      .then((route) => {
        if (route && route.geometry?.coordinates) {
          const coords: [number, number][] = route.geometry.coordinates.map((c) => [c[1], c[0]]);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === 'dsp-1'
                ? {
                    ...j,
                    ambalayRouteCoords: coords,
                    ambalayDistanceMeters: route.distanceMeters,
                    ambalayDurationSeconds: route.durationSeconds,
                    distanceKm: Number((route.distanceMeters / 1000).toFixed(1)),
                    ambalayTripId: '2567e05d-ea78-41f7-943e-01a2c936108b',
                  }
                : j
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  // Manually Dispatch a Test Order with real AmbaLay Maps Route & Tracking
  const handleManualDispatch = async (presetType: 'airport' | 'freight' | 'executive') => {
    let pNode = ADDIS_LOCATIONS[0]; // Bole Airport
    let dNode = ADDIS_LOCATIONS[1]; // Meskel Square
    let mod: 'ride' | 'truck' = 'ride';
    let passengerName = 'Dr. Ermias Kebede';

    if (presetType === 'freight') {
      pNode = ADDIS_LOCATIONS[8]; // Kality Dry Port
      dNode = ADDIS_LOCATIONS[9]; // Adama Express
      mod = 'truck';
      passengerName = 'Ethiopian Trading Enterprise';
    } else if (presetType === 'executive') {
      pNode = ADDIS_LOCATIONS[2]; // Kazanchis
      dNode = ADDIS_LOCATIONS[4]; // Sarbet
      mod = 'ride';
      passengerName = 'African Union Delegate';
    }

    const dist = calculateGeoDistance(pNode.coords, dNode.coords);
    const fare = mod === 'truck' ? 12500 : 420;
    const jobId = 'dsp-man-' + Date.now();

    const manualJob: DispatchJob = {
      id: jobId,
      tripId: (mod === 'truck' ? 'FRT-' : 'TRP-') + Math.floor(1000 + Math.random() * 9000),
      module: mod,
      passenger: passengerName,
      passengerPhone: '0911 889 900',
      pickupName: pNode.name,
      pickupCoords: pNode.coords,
      dropoffName: dNode.name,
      dropoffCoords: dNode.coords,
      status: 'Queued',
      fareETB: fare,
      distanceKm: dist,
      speedKmh: 0,
      batteryPercent: 100,
      etaMinutes: Math.round(dist * 2.5),
      headingDeg: 45,
      progressPercent: 0,
      requestedAt: 'Just now',
    };

    setJobs((prev) => [manualJob, ...prev]);
    setSelectedJobId(manualJob.id);

    // Asynchronously enrich with live AmbaLay Maps Route & Tracked Trip
    try {
      const [route, trip] = await Promise.all([
        ambalayService.calculateRoute(
          { lat: pNode.coords[0], lon: pNode.coords[1] },
          { lat: dNode.coords[0], lon: dNode.coords[1] }
        ),
        ambalayService.initTrip({ lat: pNode.coords[0], lon: pNode.coords[1] }),
      ]);

      if (route && route.geometry?.coordinates) {
        const coords: [number, number][] = route.geometry.coordinates.map((c) => [c[1], c[0]]);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  ambalayRouteCoords: coords,
                  ambalayDistanceMeters: route.distanceMeters,
                  ambalayDurationSeconds: route.durationSeconds,
                  distanceKm: Number((route.distanceMeters / 1000).toFixed(1)),
                  etaMinutes: Math.ceil(route.durationSeconds / 60),
                  ambalayTripId: trip?.id,
                }
              : j
          )
        );
      }
    } catch (e) {
      console.warn('AmbaLay route enrichment deferred:', e);
    }
  };

  // Sync selected job to Back4App Parse Cloud
  const handleSyncToBack4App = async (job: DispatchJob) => {
    if (!onSyncTripToBack4App) return;
    setSyncStatusMsg('Syncing trip to Back4App Parse Trip class...');
    try {
      await onSyncTripToBack4App(job);
      setSyncStatusMsg(`Successfully synced ${job.tripId} to Back4App cloud!`);
      setTimeout(() => setSyncStatusMsg(null), 3500);
    } catch (err: any) {
      setSyncStatusMsg('Error syncing: ' + (err.message || 'Check connection'));
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  // Trigger intentional route deviation for demonstration / testing
  const handleSimulateDeviation = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId && j.currentCoords) {
          const deviatedCoords: [number, number] = [
            j.currentCoords[0] + 0.0055,
            j.currentCoords[1] - 0.0048,
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
            message: `Manual deviation trigger: vehicle veered ${Math.round(newDev.deviationMeters || 620)}m off corridor.`,
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

  // Resolve / acknowledge deviation alert
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

  // Dynamic Traffic Re-Routing calculation
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
          `Bypass applied for ${job.tripId}! Saved ${res.savedMinutes} mins in traffic. New ETA: ${res.newEtaMins}m.`
        );
        setTimeout(() => setRerouteSuccessMsg(null), 5000);
      }
    } catch (e: any) {
      console.warn('Rerouting error:', e);
    } finally {
      setIsRerouting(false);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];
  const filteredJobs = jobs.filter((j) => (filterModule === 'all' ? true : j.module === filterModule));

  return (
    <div className="space-y-6">
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
              <div className="p-2 rounded-xl bg-cyan-600 text-white shadow-sm">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    Autonomous GPS Dispatch Simulator
                  </h1>
                  <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    · Live Radar Engine
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Proximity routing engine matching passengers and freight cargo to the nearest active fleet units
                  in Addis Ababa.
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
            <div className={`flex items-center rounded-xl p-1 border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
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
              <Radio className={`w-3.5 h-3.5 ${autoOrderGeneration ? 'text-cyan-700 dark:text-cyan-400 animate-spin' : ''}`} />
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
                className={`absolute right-0 top-full mt-1.5 w-48 py-1.5 rounded-xl border shadow-2xl hidden group-hover:block z-30 ${
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
                  <span>Kality Dry Port (Freight)</span>
                </button>
                <button
                  onClick={() => handleManualDispatch('executive')}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-800 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Kazanchis VIP (Ride)</span>
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

        {/* Real-time Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/70">
          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-700 dark:text-cyan-400" /> Dispatch Match Latency
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {avgMatchTime}s <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-sans font-semibold">Autonomous</span>
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Active Dispatches
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {jobs.filter((j) => j.status !== 'Completed').length}{' '}
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans font-normal">units tracking</span>
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-blue-700 dark:text-blue-400" /> Total Completed
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {totalDispatched}{' '}
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-sans font-semibold">99.2% on-time</span>
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-purple-700 dark:text-purple-400" /> Dispatch Protocol
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">
              Haversine Proximity v2.4
            </p>
          </div>
        </div>
      </div>

      {/* Main Split: Vector Interactive Radar Map vs Live Telemetry HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Interactive Addis Ababa Radar Map */}
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
                  Addis Ababa Metropolitan Radar (9.0108° N, 38.7613° E)
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  AmbaLay Maps Ethiopia (Active: ROUTING • TRAFFIC • GEOFENCING)
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
                  <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#0b0f17" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect width="800" height="520" fill="#090d16" />
                <rect width="800" height="520" fill="url(#grid)" />

                {/* Radar Concentric Distance Rings */}
                <circle cx="400" cy="260" r="120" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="400" cy="260" r="220" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" strokeDasharray="6 6" />

                {/* Major Arterial Highway Paths (Stylized Addis Roads) */}
                {/* Bole Airport to Meskel Square */}
                <path d="M 640 320 Q 520 280 430 220" fill="none" stroke="rgba(59, 130, 246, 0.35)" strokeWidth="4" />
                {/* Meskel to Piassa */}
                <path d="M 430 220 Q 380 160 360 110" fill="none" stroke="rgba(59, 130, 246, 0.35)" strokeWidth="4" />
                {/* Meskel to Mexico & Sarbet */}
                <path d="M 430 220 L 320 250 L 260 330" fill="none" stroke="rgba(59, 130, 246, 0.35)" strokeWidth="4" />
                {/* Meskel to CMC / Ayat */}
                <path d="M 430 220 Q 580 180 730 160" fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="3" />
                {/* Gotera to Kality Dry Port & Adama Express */}
                <path d="M 410 330 L 400 450 L 680 490" fill="none" stroke="rgba(245, 158, 11, 0.35)" strokeWidth="5" strokeDasharray="8 4" />

                {/* Geofence Perimeter Zones */}
                {showGeofences && geofences.map((gf) => {
                  const pt = geoToSvg(gf.center);
                  const radiusPx = Math.max(18, (gf.radiusMeters / 1000) * 14);
                  return (
                    <g key={gf.id}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={radiusPx}
                        fill={gf.color}
                        fillOpacity="0.07"
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
                {showTraffic && trafficCorridors.map((corridor) => {
                  const color =
                    corridor.severity === 'standstill'
                      ? '#ef4444'
                      : corridor.severity === 'heavy'
                      ? '#f97316'
                      : corridor.severity === 'moderate'
                      ? '#eab308'
                      : '#10b981';

                  const pts = corridor.coordinates.map((c) => geoToSvg(c));
                  const polylineStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                  const midPt = pts[Math.floor(pts.length / 2)] || pts[0];

                  return (
                    <g key={corridor.id}>
                      {/* Outer traffic glow line */}
                      <polyline
                        points={polylineStr}
                        fill="none"
                        stroke={color}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.45"
                      />
                      {/* Inner dashed core */}
                      <polyline
                        points={polylineStr}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        strokeLinecap="round"
                        opacity="0.6"
                      />
                      {/* Corridor Traffic Badge */}
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

                {/* City Landmarks / Node Markers */}
                {ADDIS_LOCATIONS.map((node, idx) => {
                  const pt = geoToSvg(node.coords);
                  return (
                    <g key={idx} className="cursor-pointer">
                      <circle cx={pt.x} cy={pt.y} r="5" fill={node.category === 'freight' ? '#f59e0b' : '#38bdf8'} />
                      <circle cx={pt.x} cy={pt.y} r="10" fill="none" stroke={node.category === 'freight' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)'} />
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
                {jobs.map((job) => {
                  const pPt = geoToSvg(job.pickupCoords);
                  const dPt = geoToSvg(job.dropoffCoords);
                  const isSelected = job.id === selectedJob?.id;

                  const curPt = job.currentCoords ? geoToSvg(job.currentCoords) : pPt;

                  return (
                    <g key={job.id} onClick={() => setSelectedJobId(job.id)} className="cursor-pointer">
                      {/* Route Path: Realistic AmbaLay Road Geometry or Vector Line */}
                      {job.ambalayRouteCoords && job.ambalayRouteCoords.length > 1 ? (
                        <polyline
                          points={job.ambalayRouteCoords
                            .map((c) => {
                              const pt = geoToSvg(c);
                              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke={job.rerouted ? '#10b981' : job.module === 'truck' ? '#f59e0b' : isSelected ? '#06b6d4' : '#3b82f6'}
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
                          stroke={job.rerouted ? '#10b981' : job.module === 'truck' ? '#f59e0b' : isSelected ? '#06b6d4' : '#3b82f6'}
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
                          {/* Pulsing radar circle around vehicle */}
                          <circle
                            cx={curPt.x}
                            cy={curPt.y}
                            r={job.isDeviated ? (isSelected ? '20' : '15') : (isSelected ? '14' : '10')}
                            fill="none"
                            stroke={job.isDeviated ? '#ef4444' : job.module === 'truck' ? '#f59e0b' : '#06b6d4'}
                            strokeWidth={job.isDeviated ? '2.5' : '1.5'}
                            className="animate-ping"
                          />
                          {/* Vehicle Solid Icon Point */}
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
                            {job.isDeviated ? '⚠ ' : ''}{job.tripId} ({job.speedKmh} km/h)
                            {job.isDeviated ? ` +${Math.round(job.deviationMeters || 380)}m OFF-ROUTE` : ''}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Map Legend Overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-300 flex items-center flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Pickup Node</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Ride Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Freight Cargo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 border border-purple-300/40" />
                  <span>Geofence Zone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Traffic Corridor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-rose-400 font-semibold">Deviated (&gt;350m)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Trip Queue Table with Action Buttons */}
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-Time Dispatch Queue
                </h2>
                <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-mono font-semibold tabular-nums">
                  · {filteredJobs.length} active
                </span>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
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
                    <th className="py-2 font-semibold">Assigned Driver</th>
                    <th className="py-2 font-semibold">Status</th>
                    <th className="py-2 font-semibold text-right">Fare (ETB)</th>
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
                        <td className="py-2.5 pl-2 font-mono font-bold text-cyan-700 dark:text-cyan-400">{job.tripId}</td>
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
                        <td className="py-2.5 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
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

          {/* Active Geofence & Route Deviation Alarm Console */}
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Geofence &amp; Route Deviation Alarm Console</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Automated AmbaLay corridor checks (&gt;350m threshold)</p>
                </div>
              </div>
              <span className={`text-[11px] font-mono font-bold tabular-nums ${
                deviationAlerts.filter((a) => a.status === 'active').length > 0
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}>
                {deviationAlerts.filter((a) => a.status === 'active').length} Active Alarms
              </span>
            </div>

            {deviationAlerts.length === 0 ? (
              <div className="py-6 text-center text-slate-600 dark:text-slate-400 text-xs">
                <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-emerald-600 dark:text-emerald-500/70" />
                <span>All vehicles operating within authorized corridor perimeters (&lt;350m deviation).</span>
              </div>
            ) : (
              <div className="space-y-2">
                {deviationAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      alert.status === 'active'
                        ? darkMode
                          ? 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                        : darkMode
                        ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${alert.status === 'active' ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{alert.tripId}</span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">Driver: {alert.driverName}</span>
                          <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 font-semibold">
                            +{Math.round(alert.deviationMeters)}m
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-800 dark:text-slate-300 mt-0.5">{alert.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedJobId(alert.jobId || null);
                          setAudioPingNotice(`Audible Radio Ping transmitted to ${alert.driverName} (${alert.tripId})`);
                          setTimeout(() => setAudioPingNotice(null), 3500);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Radio Ping</span>
                      </button>

                      {alert.status === 'active' && (
                        <button
                          onClick={() => handleResolveDeviation(alert.jobId)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold transition-colors"
                        >
                          Realign
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{selectedJob.tripId}</p>
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

              {/* Route Deviation Alert Card (if deviated) */}
              {selectedJob.isDeviated ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-800 dark:text-rose-200">CORRIDOR DEVIATION ALERT</h4>
                      <p className="text-rose-700 dark:text-rose-300 text-[11px] mt-0.5">
                        Vehicle veered <span className="font-mono font-bold">+{Math.round(selectedJob.deviationMeters || 380)}m</span> off authorized AmbaLay corridor.
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
                <div className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] ${darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Corridor Deviation: <strong className="text-slate-900 dark:text-white">Normal (0m)</strong></span>
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
              <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                selectedJob.rerouted
                  ? darkMode ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
                  : selectedJob.trafficSeverity && selectedJob.trafficSeverity !== 'clear'
                  ? darkMode ? 'bg-amber-950/20 border-amber-800/50' : 'bg-amber-50 border-amber-200'
                  : darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-4 h-4 ${
                      selectedJob.rerouted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : selectedJob.trafficSeverity === 'standstill'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`} />
                    <span className="font-bold text-slate-900 dark:text-white">AmbaLay Traffic &amp; Route Bypass</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${
                    selectedJob.rerouted
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : selectedJob.trafficSeverity === 'standstill'
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {selectedJob.rerouted ? 'BYPASS ACTIVE' : (selectedJob.trafficSeverity || 'MODERATE').toUpperCase()}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  {selectedJob.rerouted
                    ? 'Alternative bypass corridor engaged via Ring Road. Travel time reduced.'
                    : 'Corridor slowdown detected along primary arterial. Bypass routing available.'}
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
                  <span>{selectedJob.rerouted ? 'Recalculate Alternative Bypass' : 'Apply Dynamic Traffic Re-Route'}</span>
                </button>
              </div>

              {/* Progress Bar & ETA */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-400 font-medium">Route Progress</span>
                  <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">{Math.round(selectedJob.progressPercent)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 rounded-full transition-all duration-300"
                    style={{ width: `${selectedJob.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Distance: {selectedJob.distanceKm} km</span>
                  <span>Est. Arrival: <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{selectedJob.etaMinutes} mins</strong></span>
                </div>
              </div>

              {/* Real-Time Gauges (Speed, Battery/Fuel, Heading) */}
              <div className="grid grid-cols-3 gap-2.5 py-2">
                <div className={`p-2.5 rounded-xl border text-center ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Speed</span>
                  <p className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{selectedJob.speedKmh}</p>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">km/h</span>
                </div>

                <div className={`p-2.5 rounded-xl border text-center ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Battery</span>
                  <p className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">{selectedJob.batteryPercent}%</p>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Optimal</span>
                </div>

                <div className={`p-2.5 rounded-xl border text-center ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Heading</span>
                  <p className="text-lg font-mono font-bold text-cyan-700 dark:text-cyan-400 tabular-nums mt-0.5">{selectedJob.headingDeg}°</p>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Vector</span>
                </div>
              </div>

              {/* Route Waypoint Details */}
              <div className={`p-3 rounded-xl border text-xs space-y-2.5 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mb-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pickup Node</span>
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
              <div className={`p-3 rounded-xl border text-xs space-y-2 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Assigned Driver</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{selectedJob.driverName || 'Pending Auto-Match'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Vehicle Plate</span>
                  <span className="text-cyan-700 dark:text-cyan-400 font-mono font-bold">{selectedJob.vehiclePlate || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Passenger</span>
                  <span className="text-slate-900 dark:text-white font-medium">{selectedJob.passenger}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Fare</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-sm tabular-nums">
                    ETB {selectedJob.fareETB.toLocaleString()}
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
            <div className={`p-8 rounded-2xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
              <Navigation className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs">Select any trip from the map or queue to inspect telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
