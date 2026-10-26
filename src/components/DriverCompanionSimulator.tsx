import React, { useState, useEffect, useRef } from 'react';
import {
  ActiveDriverTripOffer,
  Driver,
  DriverAppScreen,
  PaymentGateway,
  Trip,
} from '../types';
import { paymentSettlementService } from '../services/payments';
import { auditTripCompliance, fleetComplianceService } from '../services/compliance';
import {
  Smartphone,
  Navigation,
  Radio,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  CreditCard,
  Banknote,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Clock,
  Gauge,
  Compass,
  Star,
  RefreshCw,
  Power,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface DriverCompanionSimulatorProps {
  darkMode?: boolean;
  activeOffer?: ActiveDriverTripOffer | null;
  onTripCompleted?: (trip: Partial<Trip>) => void;
  onAcceptOffer?: (offer: ActiveDriverTripOffer) => void;
  onDeclineOffer?: (offer: ActiveDriverTripOffer) => void;
  drivers?: Driver[];
  isDocked?: boolean;
  onCloseDock?: () => void;
}

const DEFAULT_OFFER: ActiveDriverTripOffer = {
  offerId: 'off-demo-1',
  tripId: 'TRP9285',
  passengerName: 'Selamawit Bekele',
  passengerRating: 4.9,
  pickupAddress: 'Bole Medhanealem Mall, Bole Road',
  dropoffAddress: 'Meskel Square Exhibition Center',
  fareETB: 340.0,
  paymentMethod: 'telebirr',
  distanceKm: 9.4,
  durationMin: 22,
  expiresAt: Date.now() + 15000,
  coordinates: {
    pickup: [38.7885, 8.9954],
    dropoff: [38.7634, 9.0107],
  },
};

export const DriverCompanionSimulator: React.FC<DriverCompanionSimulatorProps> = ({
  darkMode = true,
  activeOffer: propActiveOffer,
  onTripCompleted,
  onAcceptOffer,
  onDeclineOffer,
  drivers = [],
  isDocked = false,
  onCloseDock,
}) => {
  // Screen state
  const [screen, setScreen] = useState<DriverAppScreen>('searching');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [activeOffer, setActiveOffer] = useState<ActiveDriverTripOffer | null>(propActiveOffer || null);
  const [offerCountdown, setOfferCountdown] = useState<number>(15);
  const [currentSpeed, setCurrentSpeed] = useState<number>(38);
  const [nextTurnMeters, setNextTurnMeters] = useState<number>(240);
  const [selectedDriverIndex, setSelectedDriverIndex] = useState<number>(0);
  const [todayEarningsETB, setTodayEarningsETB] = useState<number>(1840.50);
  const [todayTripsCount, setTodayTripsCount] = useState<number>(6);
  const [completedTripDetails, setCompletedTripDetails] = useState<{
    tripId: string;
    fare: number;
    gateway: PaymentGateway;
    reference: string;
  } | null>(null);

  const activeDriver = drivers[selectedDriverIndex] || {
    name: 'Abebe Kebede',
    vehiclePlate: 'AA-2-88192',
    vehicleModel: 'Toyota Vitz (2018)',
    rating: 4.88,
  };

  // Web Audio chime generator
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = (type: 'ring' | 'accept' | 'complete' | 'alert') => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'ring') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'accept') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(1046.50, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // AudioContext fallback ignored
    }
  };

  // Sync prop changes
  useEffect(() => {
    if (propActiveOffer) {
      setActiveOffer(propActiveOffer);
      setScreen('offer');
      setOfferCountdown(15);
      playChime('ring');
    }
  }, [propActiveOffer]);

  // Countdown timer for incoming offer
  useEffect(() => {
    if (screen !== 'offer' || !activeOffer) return;

    const timer = setInterval(() => {
      setOfferCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setScreen('searching');
          if (onDeclineOffer && activeOffer) onDeclineOffer(activeOffer);
          return 15;
        }
        if (prev % 3 === 0) {
          playChime('ring');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, activeOffer]);

  // Simulated speed jitter during navigation
  useEffect(() => {
    if (screen !== 'en_route_pickup' && screen !== 'in_trip') return;

    const interval = setInterval(() => {
      setCurrentSpeed((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4;
        const target = screen === 'in_trip' ? 45 : 32;
        return Math.max(18, Math.min(65, prev + delta));
      });
      setNextTurnMeters((prev) => (prev > 30 ? prev - 25 : 350));
    }, 2000);

    return () => clearInterval(interval);
  }, [screen]);

  const handleSimulateNewOffer = () => {
    setActiveOffer({
      ...DEFAULT_OFFER,
      offerId: `off-${Date.now()}`,
      tripId: `TRP${Math.floor(1000 + Math.random() * 9000)}`,
      expiresAt: Date.now() + 15000,
    });
    setScreen('offer');
    setOfferCountdown(15);
    playChime('ring');
  };

  const handleAcceptOffer = () => {
    if (!activeOffer) return;
    playChime('accept');
    if (onAcceptOffer) onAcceptOffer(activeOffer);
    setScreen('en_route_pickup');
  };

  const handleDeclineOffer = () => {
    if (!activeOffer) return;
    if (onDeclineOffer) onDeclineOffer(activeOffer);
    setScreen('searching');
  };

  const handleArrivedAtPickup = () => {
    playChime('accept');
    setScreen('in_trip');
  };

  const handleCompleteTrip = () => {
    if (!activeOffer) return;
    playChime('complete');

    // Process real financial settlement
    const settledTx = paymentSettlementService.processSettlement(
      activeOffer.tripId,
      `drv-${selectedDriverIndex + 1}`,
      activeDriver.name,
      activeOffer.passengerName,
      activeOffer.fareETB,
      activeOffer.paymentMethod
    );

    // Audit compliance
    const complianceRecord = auditTripCompliance(
      activeOffer.tripId,
      'sedan',
      activeDriver.vehiclePlate || 'AA-2-88192',
      activeDriver.vehicleModel || 'Toyota Vitz',
      activeDriver.name,
      activeOffer.distanceKm,
      activeOffer.durationMin,
      activeOffer.fareETB,
      `${activeOffer.pickupAddress.split(',')[0]} → ${activeOffer.dropoffAddress.split(',')[0]}`
    );
    fleetComplianceService.addRecord(complianceRecord);

    setTodayEarningsETB((prev) => prev + settledTx.netDriverETB);
    setTodayTripsCount((prev) => prev + 1);

    setCompletedTripDetails({
      tripId: activeOffer.tripId,
      fare: activeOffer.fareETB,
      gateway: activeOffer.paymentMethod,
      reference: settledTx.reference,
    });

    if (onTripCompleted) {
      onTripCompleted({
        tripId: activeOffer.tripId,
        passenger: activeOffer.passengerName,
        fareETB: activeOffer.fareETB,
        status: 'Completed',
      });
    }

    setScreen('payment_summary');
  };

  return (
    <div className={`flex flex-col items-center select-none ${isDocked ? 'w-full max-w-sm' : 'w-full'}`}>
      {/* Simulator Device Frame Container */}
      <div className="relative w-[340px] sm:w-[360px] h-[720px] rounded-[48px] bg-slate-950 p-3.5 shadow-2xl ring-1 ring-white/20 border-4 border-slate-800 flex flex-col overflow-hidden">
        {/* Device Outer Bezel Elements */}
        {/* Speaker / Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
        </div>

        {/* Volume & Mute Controls (External phone frame simulation) */}
        <button
          onClick={() => setIsAudioMuted(!isAudioMuted)}
          title={isAudioMuted ? 'Unmute Audio Ping' : 'Mute Audio Ping'}
          className="absolute -left-3 top-28 w-2 h-10 bg-slate-700 hover:bg-slate-600 rounded-l-md transition-colors z-30 flex items-center justify-center text-[8px] text-white"
        >
          {isAudioMuted ? <VolumeX className="w-2.5 h-2.5 text-rose-400" /> : <Volume2 className="w-2.5 h-2.5 text-cyan-400" />}
        </button>

        {/* Inside Screen Viewport */}
        <div className="relative flex-1 bg-slate-900 rounded-[38px] overflow-hidden flex flex-col text-white font-sans">
          {/* Mobile Status Bar */}
          <div className="h-10 pt-2 px-6 flex items-center justify-between text-[11px] font-mono text-slate-300 z-40 bg-gradient-to-b from-slate-950/80 to-transparent">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cyan-400 font-semibold">5G</span>
              <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-4 bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Top Driver Header Bar */}
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                {activeDriver.name[0]}
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-white truncate max-w-[120px]">{activeDriver.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{activeDriver.vehiclePlate}</p>
              </div>
            </div>

            {/* Online / Offline Toggle */}
            <button
              onClick={() => {
                const nextState = !isOnline;
                setIsOnline(nextState);
                setScreen(nextState ? 'searching' : 'offline');
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1.5 ${
                isOnline ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Power className="w-2.5 h-2.5" />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
          </div>

          {/* MAIN SCREEN STATES */}

          {/* 1. OFFLINE STATE */}
          {screen === 'offline' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                <Power className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-white">Driver App Offline</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                You are currently not receiving ride requests or freight jobs in Addis Ababa.
              </p>
              <button
                onClick={() => {
                  setIsOnline(true);
                  setScreen('searching');
                }}
                className="mt-6 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all"
              >
                Go Online Now
              </button>
            </div>
          )}

          {/* 2. SEARCHING / RADAR STATE */}
          {screen === 'searching' && (
            <div className="flex-1 flex flex-col relative bg-slate-950">
              {/* Radar Simulation Canvas Map Backdrop */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#090d16]">
                {/* Concentric radar rings */}
                <div className="absolute w-64 h-64 rounded-full border border-cyan-500/10 animate-ping opacity-40" />
                <div className="absolute w-48 h-48 rounded-full border border-cyan-500/20" />
                <div className="absolute w-32 h-32 rounded-full border border-cyan-500/30" />
                <div className="absolute w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-cyan-400 transform rotate-45" />
                </div>

                <div className="absolute top-4 inset-x-4 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-slate-200 font-medium">Bole Medhanealem Sector</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">GPS LOCK</span>
                </div>

                {/* Simulation trigger button */}
                <div className="absolute bottom-4 inset-x-4">
                  <button
                    onClick={handleSimulateNewOffer}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Simulate Incoming Trip</span>
                  </button>
                </div>
              </div>

              {/* Bottom Daily Performance Drawer */}
              <div className="p-4 bg-slate-900 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Today's Net</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      ETB {todayEarningsETB.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Completed</p>
                    <p className="text-sm font-bold text-cyan-400 font-mono mt-0.5">{todayTripsCount} Trips</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. INCOMING TRIP OFFER (15s Countdown) */}
          {screen === 'offer' && activeOffer && (
            <div className="flex-1 flex flex-col p-4 bg-slate-950 justify-between">
              {/* Top Countdown Ring */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">New Ride Request</span>
                </div>
                {/* Circular timer indicator */}
                <div className="relative w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center font-mono font-bold text-xs text-amber-300">
                  {offerCountdown}s
                </div>
              </div>

              {/* Fare Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/30 text-center my-2">
                <p className="text-[11px] text-slate-400 font-medium">Guaranteed Fare (Net to Wallet)</p>
                <p className="text-2xl font-black text-white font-mono mt-1">
                  ETB {activeOffer.fareETB.toFixed(2)}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-900/40 text-[10px] text-cyan-300 font-medium">
                  <CreditCard className="w-3 h-3" />
                  <span className="capitalize">{activeOffer.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Pickup & Destination */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">PICKUP (2.4 km away)</p>
                    <p className="font-semibold text-slate-100">{activeOffer.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">DROPOFF</p>
                    <p className="font-semibold text-slate-100">{activeOffer.dropoffAddress}</p>
                  </div>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="text-slate-300 font-medium">{activeOffer.passengerName}</span>
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{activeOffer.passengerRating}</span>
                </div>
              </div>

              {/* Accept & Decline Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                <button
                  onClick={handleDeclineOffer}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>Decline</span>
                </button>
                <button
                  onClick={handleAcceptOffer}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ACCEPT</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. EN ROUTE TO PICKUP */}
          {screen === 'en_route_pickup' && activeOffer && (
            <div className="flex-1 flex flex-col bg-slate-950 justify-between">
              {/* Turn-by-Turn Banner Header */}
              <div className="p-3.5 bg-emerald-950/90 border-b border-emerald-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <Navigation className="w-6 h-6 transform rotate-45" />
                </div>
                <div>
                  <p className="text-[11px] text-emerald-300 font-medium">In {nextTurnMeters}m · Turn Right</p>
                  <p className="text-xs font-bold text-white truncate max-w-[180px]">Africa Avenue (Bole Road)</p>
                </div>
              </div>

              {/* Center Map Simulation Preview */}
              <div className="flex-1 relative p-4 flex flex-col justify-center items-center bg-[#090d16]">
                <div className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Heading to Pickup</span>
                    <span className="font-mono text-cyan-400 font-bold">ETA: 4 min</span>
                  </div>
                  <p className="text-sm font-bold text-white">{activeOffer.pickupAddress}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-mono">{currentSpeed} km/h</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">ON ROUTE</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Arrived */}
              <div className="p-4 bg-slate-900 border-t border-slate-800">
                <button
                  onClick={handleArrivedAtPickup}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>ARRIVED AT PICKUP POINT</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. IN TRIP / NAVIGATING TO DESTINATION */}
          {screen === 'in_trip' && activeOffer && (
            <div className="flex-1 flex flex-col bg-slate-950 justify-between">
              {/* Turn-by-Turn Banner Header */}
              <div className="p-3.5 bg-blue-950/90 border-b border-blue-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] text-blue-300 font-medium">Trip in Progress · Meter Active</p>
                  <p className="text-xs font-bold text-white truncate max-w-[180px]">{activeOffer.dropoffAddress}</p>
                </div>
              </div>

              {/* Live HUD telemetry */}
              <div className="flex-1 p-4 flex flex-col justify-center space-y-3 bg-[#090d16]">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Passenger Onboard</span>
                    <span className="text-xs font-semibold text-slate-200">{activeOffer.passengerName}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-2/3 rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <p className="text-[10px] text-slate-400">DISTANCE LEFT</p>
                      <p className="text-sm font-bold text-white font-mono mt-0.5">3.2 km</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <p className="text-[10px] text-slate-400">CURRENT SPEED</p>
                      <p className="text-sm font-bold text-cyan-400 font-mono mt-0.5">{currentSpeed} km/h</p>
                    </div>
                  </div>
                </div>

                {/* Emergency SOS ping */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Emergency SOS Link Active</span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400">911/991</span>
                </div>
              </div>

              {/* Complete Trip Action */}
              <div className="p-4 bg-slate-900 border-t border-slate-800">
                <button
                  onClick={handleCompleteTrip}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>COMPLETE TRIP & COLLECT FARE</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. PAYMENT SUMMARY & RECEIPT */}
          {screen === 'payment_summary' && completedTripDetails && (
            <div className="flex-1 flex flex-col p-4 bg-slate-950 justify-between">
              <div className="text-center pt-2">
                <div className="w-12 h-12 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Trip Completed</h3>
                <p className="text-xs text-slate-400">Payment successfully recorded</p>
              </div>

              {/* Receipt Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Gross Trip Fare</span>
                  <span className="font-mono font-bold text-white text-sm">ETB {completedTripDetails.fare.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Method</span>
                  <span className="font-semibold capitalize text-cyan-400">
                    {completedTripDetails.gateway.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Audit Ref</span>
                  <span className="font-mono text-[10px] text-slate-400">{completedTripDetails.reference}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-emerald-400 font-semibold">
                  <span>Added to Wallet</span>
                  <span className="font-mono font-bold">
                    +ETB {(completedTripDetails.fare * 0.83).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Rate Passenger */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-300">Rate passenger experience</p>
                <div className="flex justify-center gap-2 mt-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 cursor-pointer hover:scale-110 transition-transform" />
                  ))}
                </div>
              </div>

              {/* Return to radar */}
              <button
                onClick={() => setScreen('searching')}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all"
              >
                Return to Active Radar
              </button>
            </div>
          )}

          {/* Bottom Device Bar Navigation Indicator */}
          <div className="h-5 flex items-center justify-center bg-slate-950 pb-1">
            <div className="w-28 h-1 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
};
