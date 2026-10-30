import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Phone,
  Star,
  ChevronRight,
  X,
  Download,
  Lock,
  Car,
  Globe,
  ShieldCheck,
  Building2,
  Activity,
  Layers,
  MapPin,
  Compass,
  Radio,
  Fuel,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import {
  Driver,
  DriverStatus,
  EastAfricaCountryCode,
  EastAfricaCurrency,
  PermissionAction,
  Trip,
  Vehicle,
  VehicleStatus,
} from '../types';
import { downloadCsv, hasPermission } from '../services/rbac';
import { resolveItemCountryCode } from './JurisdictionDashboardWrapper';

interface RideModuleViewProps {
  darkMode: boolean;
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: Trip[];
  userRole?: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  assignedCorridors?: string[];
  userName?: string;
  userEmail?: string;
  onAddDriver: (driver: Omit<Driver, 'objectId'>) => Promise<void>;
  onUpdateDriverStatus: (id: string, status: DriverStatus) => Promise<void>;
  onDeleteDriver: (id: string) => Promise<void>;
  onAddVehicle: (vehicle: Omit<Vehicle, 'objectId'>) => Promise<void>;
  onUpdateVehicleStatus: (id: string, status: VehicleStatus) => Promise<void>;
  onOpenDispatchSimulator?: () => void;
  onNotify?: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
}

const DRIVERS_PER_PAGE = 6;

interface CountryRideConfig {
  code: Exclude<EastAfricaCountryCode, 'ALL'>;
  name: string;
  flag: string;
  capital: string;
  currency: EastAfricaCurrency;
  currencySymbol: string;
  exchangeRateToETB: number; // 1 unit in local = X ETB or factor
  toLocalFactor: number;     // 1 ETB = toLocalFactor in local currency
  regulatorName: string;
  regulatorAcronym: string;
  regulatorBadge: string;
  phonePrefix: string;
  phoneFormatHint: string;
  plateHint: string;
  popularModels: string[];
  hubTitle: string;
  hubLocation: string;
  destLocation: string;
  corridorName: string;
  secondaryLocations: string[];
  gpsCoords: string;
  paymentGateways: string[];
  demoTrip: {
    tripId: string;
    passenger: string;
    passengerPhone: string;
    driver: string;
    driverPhone: string;
    vehicle: string;
    pickup: string;
    dropoff: string;
    fareETB: number;
    distance: string;
    etaMinutes: number;
  };
}

export const EAST_AFRICA_RIDE_CONFIGS: Record<Exclude<EastAfricaCountryCode, 'ALL'>, CountryRideConfig> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    capital: 'Addis Ababa',
    currency: 'ETB',
    currencySymbol: 'Br',
    exchangeRateToETB: 1.0,
    toLocalFactor: 1.0,
    regulatorName: 'Federal Transport Authority & Addis Ababa City Transport Bureau',
    regulatorAcronym: 'FTA / AACTB',
    regulatorBadge: 'Annual Commercial Bola · TIN Clearance',
    phonePrefix: '+251 9',
    phoneFormatHint: '0911 234 567',
    plateHint: 'AA-88123 or 2-A-9921',
    popularModels: ['Toyota Vitz', 'Hyundai Accent', 'Kia Picanto', 'Toyota Corolla', 'Suzuki Swift', 'Nissan Sunny'],
    hubTitle: 'Addis Ababa Urban Mobility Command',
    hubLocation: 'Meskel Square Hub',
    destLocation: 'Bole Intl Airport',
    corridorName: 'Bole - Meskel Arterial Corridor',
    secondaryLocations: ['Piazza / Arat Kilo', 'CMC / Megenagna', 'Sarbet / Old Airport', 'Kazanchis Financial'],
    gpsCoords: '9.0107° N, 38.7612° E',
    paymentGateways: ['Telebirr SuperApp', 'CBE Birr', 'Chapa Mobile'],
    demoTrip: {
      tripId: '#TRP-ET-9283',
      passenger: 'Nahom B.',
      passengerPhone: '0911 776 655',
      driver: 'Daniel M.',
      driverPhone: '0911 445 667',
      vehicle: 'Toyota Corolla · DD-44556',
      pickup: 'Meskel Square',
      dropoff: 'Bole International Airport',
      fareETB: 480.0,
      distance: '12.4 km',
      etaMinutes: 14,
    },
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    capital: 'Nairobi',
    currency: 'KES',
    currencySymbol: 'KSh',
    exchangeRateToETB: 0.95,
    toLocalFactor: 1.05,
    regulatorName: 'National Transport and Safety Authority',
    regulatorAcronym: 'NTSA',
    regulatorBadge: 'Speed Limiter Telemetry · PSV Driver Badge',
    phonePrefix: '+254 7',
    phoneFormatHint: '+254 712 345 678',
    plateHint: 'KDA-192B or KCP-552T',
    popularModels: ['Toyota Vitz 1.3', 'Toyota Fielder 1.5X', 'Suzuki Alto K10', 'Toyota Axio', 'Mazda Demio', 'Honda Fit'],
    hubTitle: 'Nairobi Metropolitan Dispatch Grid',
    hubLocation: 'Nairobi CBD Kencom Terminal',
    destLocation: 'Jomo Kenyatta Intl. Airport (JKIA)',
    corridorName: 'Mombasa Road - Expressway Corridor',
    secondaryLocations: ['Westlands / Sarit Centre', 'Upper Hill Financial Hub', 'Kilimani / Yaya Centre', 'Gigiri Diplomatic Blue Zone'],
    gpsCoords: '-1.2864° S, 36.8172° E',
    paymentGateways: ['Safaricom M-PESA Daraja', 'Airtel Money Kenya', 'Equity EazzyPay'],
    demoTrip: {
      tripId: '#TRP-KE-4401',
      passenger: 'Kevin Omondi',
      passengerPhone: '+254 712 990 112',
      driver: 'Brian Mwangi',
      driverPhone: '+254 733 456 789',
      vehicle: 'Toyota Fielder · KCP-552T',
      pickup: 'JKIA Terminal 1A',
      dropoff: 'Upper Hill Financial District',
      fareETB: 520.0,
      distance: '16.2 km',
      etaMinutes: 18,
    },
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    capital: 'Kampala',
    currency: 'UGX',
    currencySymbol: 'USh',
    exchangeRateToETB: 0.033,
    toLocalFactor: 30.3,
    regulatorName: 'Ministry of Works and Transport - Uganda',
    regulatorAcronym: 'MoWT',
    regulatorBadge: 'Uganda Driving Permit (UDP) · Commercial PSV',
    phonePrefix: '+256 7',
    phoneFormatHint: '+256 772 123 456',
    plateHint: 'UBB-102N or UBF-341P',
    popularModels: ['Toyota Premio', 'Toyota Spacio Eco', 'Suzuki Alto K10', 'Toyota Wish', 'Toyota Raum', 'Isuzu Elf Shuttle'],
    hubTitle: 'Greater Kampala Transit Command',
    hubLocation: 'Kampala Serena Nakasero',
    destLocation: 'Entebbe International Airport',
    corridorName: 'Entebbe - Kampala Expressway Corridor',
    secondaryLocations: ['Kololo Business District', 'Bugolobi Village Mall', 'Ntinda Shopping Centre', 'Makerere University Zone'],
    gpsCoords: '0.3476° N, 32.5825° E',
    paymentGateways: ['MTN Mobile Money Uganda', 'Airtel Money Uganda', 'Stanbic FlexiPay'],
    demoTrip: {
      tripId: '#TRP-UG-3101',
      passenger: 'Brian Ssemwogerere',
      passengerPhone: '+256 782 110 220',
      driver: 'Sarah Nalwanga',
      driverPhone: '+256 701 456 789',
      vehicle: 'Toyota Premio · UBB-102N',
      pickup: 'Entebbe International Airport',
      dropoff: 'Kampala Serena Nakasero',
      fareETB: 450.0,
      distance: '41.5 km',
      etaMinutes: 32,
    },
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    capital: 'Kigali',
    currency: 'RWF',
    currencySymbol: 'FRw',
    exchangeRateToETB: 0.092,
    toLocalFactor: 10.87,
    regulatorName: 'Rwanda Utilities Regulatory Authority',
    regulatorAcronym: 'RURA',
    regulatorBadge: 'Smart Mobility Metering · Technical Inspection',
    phonePrefix: '+250 7',
    phoneFormatHint: '+250 788 123 456',
    plateHint: 'RAE-442C or RAF-910D',
    popularModels: ['Toyota Corolla Sedan', 'Hyundai Grand i10', 'Toyota Yaris Eco', 'Volkswagen Polo Vivo', 'Suzuki Celerio'],
    hubTitle: 'Kigali Smart City Mobility Network',
    hubLocation: 'Kigali Heights Commercial Hub',
    destLocation: 'Kigali International Airport (KGL)',
    corridorName: 'KN 3 Rd - Airport Boulevard Corridor',
    secondaryLocations: ['Nyarugenge Downtown CBD', 'Kimihurura Government Precinct', 'Gishushu Innovation Park', 'Remera Stadium Gate'],
    gpsCoords: '-1.9536° S, 30.0606° E',
    paymentGateways: ['MTN MoMo Rwanda', 'Airtel Money Rwanda', 'BK Quick Mobile'],
    demoTrip: {
      tripId: '#TRP-RW-1201',
      passenger: 'Aline Umutoni',
      passengerPhone: '+250 788 445 667',
      driver: 'Eric Nshimiyimana',
      driverPhone: '+250 788 334 455',
      vehicle: 'Toyota Corolla · RAE-442C',
      pickup: 'Kigali International Airport',
      dropoff: 'Kigali Heights Commercial Hub',
      fareETB: 410.0,
      distance: '9.5 km',
      etaMinutes: 12,
    },
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    capital: 'Dar es Salaam',
    currency: 'TZS',
    currencySymbol: 'TSh',
    exchangeRateToETB: 0.046,
    toLocalFactor: 21.74,
    regulatorName: 'Land Transport Regulatory Authority - Tanzania',
    regulatorAcronym: 'LATRA',
    regulatorBadge: 'DART Vehicle Compliance · Commercial PSV Licensure',
    phonePrefix: '+255 7',
    phoneFormatHint: '+255 754 123 456',
    plateHint: 'T-312-ABW or T-409-BCX',
    popularModels: ['Toyota Corolla Axio', 'Suzuki Swift 1.2', 'Toyota IST', 'Toyota Passo', 'Toyota Probox Shuttle'],
    hubTitle: 'Dar es Salaam Port City Mobility Command',
    hubLocation: 'Posta Central Business District',
    destLocation: 'Julius Nyerere Intl Airport (JNIA)',
    corridorName: 'Nyerere Road - DART BRT Corridor',
    secondaryLocations: ['Kariakoo Commercial Zone', 'Masaki / Oysterbay Peninsula', 'Mikocheni Tech District', 'Ubungo Intermodal Terminal'],
    gpsCoords: '-6.8235° S, 39.2695° E',
    paymentGateways: ['Vodacom M-Pesa Tanzania', 'Tigo Pesa', 'Airtel Money Tanzania', 'CRDB SimBanking'],
    demoTrip: {
      tripId: '#TRP-TZ-8801',
      passenger: 'Baraka Mrema',
      passengerPhone: '+255 754 112 334',
      driver: 'Neema Shirima',
      driverPhone: '+255 768 445 566',
      vehicle: 'Suzuki Swift · T-409-BCX',
      pickup: 'Julius Nyerere Intl Airport T3',
      dropoff: 'Posta Central Business District',
      fareETB: 460.0,
      distance: '12.8 km',
      etaMinutes: 22,
    },
  },
  DJ: {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    capital: 'Djibouti City',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    exchangeRateToETB: 0.70,
    toLocalFactor: 1.43,
    regulatorName: 'Ministry of Equipment and Transport & Port Authority',
    regulatorAcronym: 'MET / DPFZA',
    regulatorBadge: 'Port Zone Vehicle Clearance · Commercial Stamp',
    phonePrefix: '+253 77',
    phoneFormatHint: '+253 77 12 34 56',
    plateHint: 'DJ-1209-A or DJ-3420-C',
    popularModels: ['Toyota Yaris Sedan', 'Nissan Tiida 1.6', 'Toyota Corolla Compact', 'Hyundai Elantra', 'Renault Duster'],
    hubTitle: 'Djibouti Red Sea Gateway Dispatch Hub',
    hubLocation: 'Place du 27 Juin (Centre-Ville)',
    destLocation: 'Port of Doraleh Free Zone',
    corridorName: 'Route de Venise - Doraleh Expressway',
    secondaryLocations: ['Djibouti-Ambouli Airport', 'Heron Coastal District', 'Haramous Diplomatic Enclave', 'PK12 Intermodal'],
    gpsCoords: '11.5886° N, 43.1451° E',
    paymentGateways: ['D-Money (Djibouti Telecom)', 'BCIMR Mobile', 'Cash / US Dollar Cross-Rate'],
    demoTrip: {
      tripId: '#TRP-DJ-5501',
      passenger: 'Ahmed Osman',
      passengerPhone: '+253 77 88 99 00',
      driver: 'Omar Guelleh',
      driverPhone: '+253 77 88 99 00',
      vehicle: 'Toyota Yaris · DJ-1209-A',
      pickup: 'Djibouti-Ambouli Airport',
      dropoff: 'Port of Doraleh Free Zone',
      fareETB: 580.0,
      distance: '14.1 km',
      etaMinutes: 18,
    },
  },
  SO: {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    capital: 'Mogadishu',
    currency: 'USD',
    currencySymbol: '$',
    exchangeRateToETB: 124.5,
    toLocalFactor: 0.00803,
    regulatorName: 'Ministry of Transport and Civil Aviation - Somalia',
    regulatorAcronym: 'MOTCA',
    regulatorBadge: 'Urban Mobility Transit Stamp · Commercial Permit',
    phonePrefix: '+252 61',
    phoneFormatHint: '+252 61 555 4321',
    plateHint: 'MOG-5542 or HRG-1029',
    popularModels: ['Toyota Belta 1.3', 'Toyota Probox Shuttle', 'Toyota Premio 1.8', 'Toyota Vitz 4WD', 'Nissan Note e-Power'],
    hubTitle: 'Mogadishu Indian Ocean Mobility Command',
    hubLocation: 'KM4 Traffic Intersection Hub',
    destLocation: 'Aden Adde International Airport (MGQ)',
    corridorName: 'Maka Al-Mukarama Arterial Corridor',
    secondaryLocations: ['Bakara Commercial Market', 'Hodan Commercial Hub', 'Wadajir Peace Zone', 'Hamar Weyne Historic Port'],
    gpsCoords: '2.0469° N, 45.3182° E',
    paymentGateways: ['Hormuud EVC Plus (USD)', 'Telesom Zaad', 'Somnet JEEB', 'Premier Bank Mobile'],
    demoTrip: {
      tripId: '#TRP-SO-6601',
      passenger: 'Abdirahman Ali',
      passengerPhone: '+252 61 777 8899',
      driver: 'Abdi Shire',
      driverPhone: '+252 61 777 8899',
      vehicle: 'Toyota Belta · MOG-5542',
      pickup: 'Aden Adde International Airport',
      dropoff: 'Bakara Commercial District',
      fareETB: 490.0,
      distance: '6.8 km',
      etaMinutes: 15,
    },
  },
  SS: {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    capital: 'Juba',
    currency: 'SSP',
    currencySymbol: 'SS£',
    exchangeRateToETB: 0.08,
    toLocalFactor: 12.5,
    regulatorName: 'Ministry of Transport & National Revenue Authority',
    regulatorAcronym: 'MoTR / NRA',
    regulatorBadge: 'Commercial Road Permit · Transport Tax Tag',
    phonePrefix: '+211 9',
    phoneFormatHint: '+211 922 345 678',
    plateHint: 'SSD-1192-B or SSD-3301-C',
    popularModels: ['Toyota Rav4 AWD', 'Toyota Corolla Altis', 'Toyota Land Cruiser Prado', 'Toyota Hilux Double Cab', 'Nissan Patrol'],
    hubTitle: 'Juba White Nile Metropolitan Dispatch Hub',
    hubLocation: 'Customs Market Central Terminal',
    destLocation: 'Juba International Airport (JUB)',
    corridorName: 'Airport Road - Ministries Corridor',
    secondaryLocations: ['Ministries Complex', 'Juba Bridge Crossing', 'Hai Cinema Commercial', 'Gudele Intermodal District'],
    gpsCoords: '4.8594° N, 31.5713° E',
    paymentGateways: ['m-GURUSH Mobile Money', 'NilePay Mobile', 'Ecobank Omni Lite', 'Cash on Delivery'],
    demoTrip: {
      tripId: '#TRP-SS-7701',
      passenger: 'Mary Achol',
      passengerPhone: '+211 922 889 900',
      driver: 'Taban Lado',
      driverPhone: '+211 911 223 344',
      vehicle: 'Toyota Rav4 · SSD-1192-B',
      pickup: 'Juba International Airport',
      dropoff: 'Ministries Complex & Diplomatic Quarter',
      fareETB: 540.0,
      distance: '5.6 km',
      etaMinutes: 11,
    },
  },
};

const ALL_COUNTRY_CODES: Exclude<EastAfricaCountryCode, 'ALL'>[] = [
  'ET',
  'KE',
  'UG',
  'RW',
  'TZ',
  'DJ',
  'SO',
  'SS',
];

export const RideModuleView: React.FC<RideModuleViewProps> = ({
  drivers,
  vehicles,
  trips,
  userRole = 'Super Admin',
  userJurisdiction,
  userJurisdictionName,
  assignedCorridors = [],
  userName,
  userEmail,
  onAddDriver,
  onUpdateDriverStatus,
  onDeleteDriver,
  onAddVehicle,
  onUpdateVehicleStatus,
  onOpenDispatchSimulator,
  onNotify,
  onGuardPermission,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'drivers' | 'vehicles' | 'monitoring' | 'analytics'>('overview');

  // Sovereign Country Selection: Initialize based on operator's login jurisdiction
  const initialCountry = (userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ALL') as EastAfricaCountryCode;
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(initialCountry);

  // Sync when logged in persona switches
  useEffect(() => {
    if (userJurisdiction) {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  // Active country config helper
  const activeCountryConfig: CountryRideConfig = useMemo(() => {
    if (selectedCountry !== 'ALL' && EAST_AFRICA_RIDE_CONFIGS[selectedCountry]) {
      return EAST_AFRICA_RIDE_CONFIGS[selectedCountry];
    }
    // Default to ET when ALL is selected
    return EAST_AFRICA_RIDE_CONFIGS.ET;
  }, [selectedCountry]);

  // Format currency dynamically based on selected country
  const formatSovereignFare = (amountInETB: number, targetCountry: EastAfricaCountryCode = selectedCountry): string => {
    if (targetCountry === 'ALL') {
      return `ETB ${amountInETB.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    }
    const cfg = EAST_AFRICA_RIDE_CONFIGS[targetCountry] || EAST_AFRICA_RIDE_CONFIGS.ET;
    const localVal = amountInETB * cfg.toLocalFactor;
    if (cfg.currency === 'UGX' || cfg.currency === 'TZS' || cfg.currency === 'RWF') {
      return `${cfg.currencySymbol} ${Math.round(localVal).toLocaleString()}`;
    }
    if (cfg.currency === 'USD') {
      return `$${localVal.toFixed(2)}`;
    }
    return `${cfg.currencySymbol} ${localVal.toFixed(1)}`;
  };

  // Drivers filtering & pagination state
  const [driverSearch, setDriverSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('All');
  const [driverPage, setDriverPage] = useState(1);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    vehicleModel: 'Toyota Vitz',
    vehiclePlate: '',
    status: 'Active' as DriverStatus,
    rating: 5.0,
    module: 'ride' as const,
    countryCode: (userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET') as EastAfricaCountryCode,
  });

  // Vehicles filtering & state
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [failedVehicleImages, setFailedVehicleImages] = useState<Record<string, boolean>>({});
  const [newVehicle, setNewVehicle] = useState({
    model: 'Toyota Vitz',
    plate: '',
    driverName: '',
    status: 'Verified' as VehicleStatus,
    photoUrl: '/src/assets/images/vehicle_toyota_vitz_1792851957648.jpg',
    type: 'Hatchback',
    year: 2023,
    capacity: '4 seats',
    module: 'ride' as const,
    countryCode: (userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET') as EastAfricaCountryCode,
  });

  // Live Trip Monitoring simulation state
  const [liveProgress, setLiveProgress] = useState(48);
  const [isSimulating, setIsSimulating] = useState(true);

  const canManageRide = hasPermission(userRole, 'manage_ride');

  const checkRideAuthority = (label: string): boolean => {
    if (onGuardPermission) {
      return onGuardPermission('manage_ride', label);
    }
    return canManageRide;
  };

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setLiveProgress((prev) => (prev >= 95 ? 15 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Reset pagination when country filter or search changes
  useEffect(() => {
    setDriverPage(1);
  }, [selectedCountry, driverSearch, driverStatusFilter]);

  // Keep Add Driver modal synced to current country
  useEffect(() => {
    const targetC = selectedCountry !== 'ALL' ? selectedCountry : (userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET');
    const cfg = EAST_AFRICA_RIDE_CONFIGS[targetC as Exclude<EastAfricaCountryCode, 'ALL'>] || EAST_AFRICA_RIDE_CONFIGS.ET;
    setNewDriver((prev) => ({
      ...prev,
      countryCode: targetC,
      vehicleModel: cfg.popularModels[0] || 'Toyota Vitz',
      phone: prev.phone || cfg.phonePrefix,
    }));
    setNewVehicle((prev) => ({
      ...prev,
      countryCode: targetC,
      model: cfg.popularModels[0] || 'Toyota Vitz',
    }));
  }, [selectedCountry, userJurisdiction]);

  const cardClass =
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs';

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 text-xs';

  const getStatusTextClass = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Verified':
      case 'Completed':
        return 'text-emerald-700 dark:text-emerald-400 font-semibold';
      case 'Pending':
      case 'Inspection':
      case 'On-Going':
        return 'text-amber-700 dark:text-amber-400 font-semibold';
      case 'Suspended':
      case 'Cancelled':
        return 'text-rose-700 dark:text-rose-400 font-semibold';
      default:
        return 'text-slate-600 dark:text-slate-400 font-medium';
    }
  };

  // Base ride drivers and vehicles
  const rideDriversAll = useMemo(() => drivers.filter((d) => !d.module || d.module === 'ride'), [drivers]);
  const rideVehiclesAll = useMemo(() => vehicles.filter((v) => !v.module || v.module === 'ride'), [vehicles]);
  const rideTripsAll = useMemo(() => trips.filter((t) => !t.module || t.module === 'ride'), [trips]);

  // Country scoped data
  const filteredCountryDrivers = useMemo(() => {
    if (selectedCountry === 'ALL') return rideDriversAll;
    return rideDriversAll.filter((d) => resolveItemCountryCode(d, 'driver') === selectedCountry);
  }, [rideDriversAll, selectedCountry]);

  const filteredCountryVehicles = useMemo(() => {
    if (selectedCountry === 'ALL') return rideVehiclesAll;
    return rideVehiclesAll.filter((v) => {
      if (v.countryCode) return v.countryCode === selectedCountry;
      // Match against driver assigned to vehicle
      const matchingDriver = rideDriversAll.find((d) => d.name === v.driverName || d.vehiclePlate === v.plate);
      if (matchingDriver) return resolveItemCountryCode(matchingDriver, 'driver') === selectedCountry;
      return false;
    });
  }, [rideVehiclesAll, rideDriversAll, selectedCountry]);

  const filteredCountryTrips = useMemo(() => {
    if (selectedCountry === 'ALL') return rideTripsAll;
    return rideTripsAll.filter((t) => resolveItemCountryCode(t, 'trip') === selectedCountry);
  }, [rideTripsAll, selectedCountry]);

  // Search & Status filters for Drivers
  const filteredDrivers = useMemo(() => {
    return filteredCountryDrivers.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.phone.includes(driverSearch) ||
        d.vehiclePlate.toLowerCase().includes(driverSearch.toLowerCase());
      const matchesFilter = driverStatusFilter === 'All' || d.status === driverStatusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [filteredCountryDrivers, driverSearch, driverStatusFilter]);

  const totalDriverPages = Math.max(1, Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE));
  const safeDriverPage = Math.min(driverPage, totalDriverPages);
  const paginatedDrivers = filteredDrivers.slice(
    (safeDriverPage - 1) * DRIVERS_PER_PAGE,
    safeDriverPage * DRIVERS_PER_PAGE
  );

  // Search filter for Vehicles
  const filteredVehicles = useMemo(() => {
    return filteredCountryVehicles.filter((v) => {
      return (
        v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.driverName.toLowerCase().includes(vehicleSearch.toLowerCase())
      );
    });
  }, [filteredCountryVehicles, vehicleSearch]);

  // Dynamic Operational Metrics reflecting sovereign country scope
  const activeRideDriversCount = filteredCountryDrivers.filter((d) => d.status === 'Active' || d.status === 'Verified').length;
  const liveFareTotalETB = filteredCountryTrips.reduce((sum, t) => sum + (Number(t.fareETB) || 0), 0);

  // Calibrate headline numbers based on country scale
  const countryBaseScale = selectedCountry === 'ALL' ? 1.0 : selectedCountry === 'ET' ? 0.35 : selectedCountry === 'KE' ? 0.28 : selectedCountry === 'UG' ? 0.12 : selectedCountry === 'TZ' ? 0.10 : selectedCountry === 'RW' ? 0.08 : 0.05;
  const totalRegisteredDriversDisplay = Math.round(1239 * countryBaseScale) + filteredCountryDrivers.length;
  const activeDriversDisplay = Math.round(870 * countryBaseScale) + activeRideDriversCount;
  const tripsTodayDisplay = Math.round(4817 * countryBaseScale) + filteredCountryTrips.length;
  const revenueTodayETB = Math.round(683640 * countryBaseScale) + liveFareTotalETB;

  // Driver counts map for the 8-nation ribbon
  const countryDriverCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rideDriversAll.length };
    ALL_COUNTRY_CODES.forEach((c) => {
      counts[c] = rideDriversAll.filter((d) => resolveItemCountryCode(d, 'driver') === c).length;
    });
    return counts;
  }, [rideDriversAll]);

  const handleExportRideReport = () => {
    const headers = [
      'Record Type',
      'Country',
      'ID / Plate',
      'Counterparty / Driver',
      'Route / Vehicle Model',
      'Status',
      'Fare (Local Sovereign)',
      'Fare (ETB Base)',
      'Timestamp',
    ];
    const rows: (string | number)[][] = [
      ...filteredCountryTrips.map((t) => {
        const cCode = resolveItemCountryCode(t, 'trip');
        return [
          'Ride Trip',
          cCode,
          t.tripId,
          `${t.passenger} / ${t.driver}`,
          `${t.pickup} -> ${t.destination}`,
          t.status,
          formatSovereignFare(t.fareETB, cCode),
          `ETB ${t.fareETB.toFixed(2)}`,
          t.time,
        ];
      }),
      ...filteredCountryDrivers.map((d) => {
        const cCode = resolveItemCountryCode(d, 'driver');
        return [
          'Registered Driver',
          cCode,
          d.vehiclePlate,
          d.name,
          d.vehicleModel,
          d.status,
          `${d.rating.toFixed(1)} stars`,
          `ETB ${(d.earningsETB || 0).toLocaleString()}`,
          d.joinedDate || '2024',
        ];
      }),
    ];
    const scopeLabel = selectedCountry === 'ALL' ? 'pan_east_africa' : selectedCountry.toLowerCase();
    downloadCsv(`afronala_ride_fleet_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    onNotify?.(
      'Ride Mobility Report Exported',
      `Exported ${rows.length} records for ${selectedCountry === 'ALL' ? 'Pan-East Africa' : activeCountryConfig.name} to CSV.`,
      'success'
    );
  };

  const currentHubTrip = filteredCountryTrips.length > 0 ? filteredCountryTrips[0] : null;

  return (
    <div className="space-y-6">
      {/* Sovereign Operator Banner & Title */}
      <div className="flex flex-col gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1 flex-wrap">
              <span>Modules</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">Ride Mobility &amp; Fleet</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>Operator: {userName || 'Daniel Ferede'}</span>
                <span className="text-slate-400">({userRole})</span>
              </span>
              {userJurisdiction && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                  <MapPin className="w-3 h-3" />
                  <span>
                    Jurisdiction: {userJurisdiction === 'ALL' ? 'Pan-East Africa (ALL)' : `${userJurisdictionName || userJurisdiction}`}
                  </span>
                </span>
              )}
              <span aria-hidden="true">·</span>
              <span className={canManageRide ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                {canManageRide ? 'Dispatch Write Access' : `Read-Only (${userRole})`}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>Ride Mobility &amp; Urban Fleet Operations</span>
              {selectedCountry !== 'ALL' && (
                <span className="text-base font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {activeCountryConfig.flag} {activeCountryConfig.name} ({activeCountryConfig.currency})
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedCountry === 'ALL'
                ? 'Unified command center across all 8 East African sovereign mobility corridors, driver credentialing, and multi-currency tariff caps.'
                : `${activeCountryConfig.hubTitle}: ${activeCountryConfig.regulatorName} (${activeCountryConfig.regulatorAcronym}) compliance, ${activeCountryConfig.corridorName}, and local ${activeCountryConfig.currency} settlement.`}
            </p>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-x-auto self-start lg:self-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'drivers', label: 'Drivers' },
              { id: 'vehicles', label: 'Vehicles' },
              { id: 'monitoring', label: 'Trip Monitoring' },
              { id: 'analytics', label: 'Analytics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activeSubTab === tab.id
                    ? 'bg-white dark:bg-cyan-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* East Africa 8-Nation + Pan-East Africa Selector Ribbon */}
        <div className="pt-2">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Sovereign Country Fleet Filter:</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                (Synced with operator credentials &amp; regional Back4App edge nodes)
              </span>
            </div>
            {userJurisdiction && userJurisdiction !== 'ALL' && selectedCountry !== userJurisdiction && (
              <button
                onClick={() => setSelectedCountry(userJurisdiction)}
                className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <UserCheck className="w-3 h-3" />
                <span>Reset to My Jurisdiction ({userJurisdiction})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {/* Pan-East Africa Option */}
            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                selectedCountry === 'ALL'
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All East Africa</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                  selectedCountry === 'ALL' ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {countryDriverCounts.ALL || 0}
              </span>
            </button>

            {/* 8 Sovereign Member States */}
            {ALL_COUNTRY_CODES.map((code) => {
              const cfg = EAST_AFRICA_RIDE_CONFIGS[code];
              const isSelected = selectedCountry === code;
              const isOperatorHome = userJurisdiction === code;
              return (
                <button
                  key={code}
                  onClick={() => setSelectedCountry(code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : isOperatorHome
                      ? 'bg-cyan-50/70 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                  }`}
                  title={`${cfg.name} · ${cfg.currency} · Regulator: ${cfg.regulatorAcronym}`}
                >
                  <span className="text-sm">{cfg.flag}</span>
                  <span>{cfg.name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-cyan-100' : 'text-slate-400'}`}>
                    · {cfg.currency}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                      isSelected
                        ? 'bg-cyan-700 text-cyan-100'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {countryDriverCounts[code] || 0}
                  </span>
                  {isOperatorHome && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Your Assigned Jurisdiction" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Regulatory & Gateway Banner for Active Scope */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <span className="text-base">{activeCountryConfig.flag}</span>
              <span>{selectedCountry === 'ALL' ? 'Pan-East Africa Mobility Oversight' : activeCountryConfig.regulatorName}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              {selectedCountry === 'ALL' ? 'EAC Intergovernmental Transit Standard' : activeCountryConfig.regulatorBadge}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-[11px] flex-wrap">
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="font-medium text-slate-900 dark:text-white">Payment Rails:</span>
              <span>{activeCountryConfig.paymentGateways.join(', ')}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="font-mono text-cyan-600 dark:text-cyan-400">{activeCountryConfig.gpsCoords}</span>
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Registered Drivers</span>
                <span className="text-xs font-mono font-bold text-slate-400">{selectedCountry === 'ALL' ? 'EAC' : selectedCountry}</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {totalRegisteredDriversDisplay.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+6.2%</span>
                <span className="text-slate-500 text-[11px] font-normal">
                  {selectedCountry === 'ALL' ? 'across 8 countries' : `in ${activeCountryConfig.name}`}
                </span>
              </div>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Drivers Online</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {activeDriversDisplay.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <Radio className="w-3.5 h-3.5" />
                <span>{((activeDriversDisplay / Math.max(1, totalRegisteredDriversDisplay)) * 100).toFixed(0)}%</span>
                <span className="text-slate-500 text-[11px] font-normal">telemetry stream active</span>
              </div>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Trips Today</span>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">24h Cycle</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {tripsTodayDisplay.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.0%</span>
                <span className="text-slate-500 text-[11px] font-normal">vs yesterday</span>
              </div>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gross Mobility Fare</span>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                  {selectedCountry === 'ALL' ? 'ETB Base' : activeCountryConfig.currency}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {formatSovereignFare(revenueTodayETB, selectedCountry)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4%</span>
                <span className="text-slate-500 text-[11px] font-normal">cleared daily gross</span>
              </div>
            </div>
          </div>

          {/* Localized Sovereign Live Trips Radar */}
          <div className={`p-6 rounded-xl overflow-hidden relative ${cardClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>
                    Live Trips Radar · {activeCountryConfig.flag} {activeCountryConfig.hubTitle}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time telemetry corridor tracking across {activeCountryConfig.corridorName}
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Online: {activeDriversDisplay}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                    Corridor Matched: {Math.max(12, Math.round(activeDriversDisplay * 0.35))}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Queued: {Math.max(4, Math.round(activeDriversDisplay * 0.08))}
                  </span>
                </div>

                <button
                  onClick={() => setActiveSubTab('monitoring')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full Corridor</span>
                </button>
              </div>
            </div>

            {/* Interactive Vector Radar Canvas for the Selected Country */}
            <div className="w-full h-80 rounded-xl relative overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                <path
                  d="M 150,200 C 250,50 750,50 850,200 C 750,350 250,350 150,200 Z"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="5"
                />
                <path d="M 450,180 L 720,290" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="6 4" opacity="0.8" />
                <path d="M 450,180 L 800,120" fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.6" />
                <path d="M 450,180 L 280,110" fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.6" />
                <circle cx={450 + (liveProgress / 100) * 270} cy={180 + (liveProgress / 100) * 110} r="7" fill="#06b6d4" />
              </svg>

              {/* Main Hub Node */}
              <div className="absolute top-[42%] left-[45%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-lg mx-auto animate-pulse" />
                <span className="text-[11px] font-bold text-white bg-slate-900/90 px-2.5 py-0.5 rounded border border-slate-700 mt-1 inline-block">
                  {activeCountryConfig.hubLocation}
                </span>
              </div>

              {/* Destination Hub Node */}
              <div className="absolute top-[70%] left-[72%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-lg mx-auto" />
                <span className="text-[11px] font-bold text-white bg-slate-900/90 px-2.5 py-0.5 rounded border border-slate-700 mt-1 inline-block">
                  {activeCountryConfig.destLocation}
                </span>
              </div>

              {/* Secondary Sub-Hubs */}
              {activeCountryConfig.secondaryLocations[0] && (
                <div className="absolute top-[28%] left-[28%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    {activeCountryConfig.secondaryLocations[0]}
                  </span>
                </div>
              )}

              {activeCountryConfig.secondaryLocations[1] && (
                <div className="absolute top-[28%] left-[80%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    {activeCountryConfig.secondaryLocations[1]}
                  </span>
                </div>
              )}

              {/* Simulated Moving Driver Telemetry Points */}
              {[
                { top: '35%', left: '40%' },
                { top: '55%', left: '50%' },
                { top: '48%', left: '60%' },
                { top: '65%', left: '68%' },
                { top: '40%', left: '72%' },
                { top: '30%', left: '52%' },
                { top: '60%', left: '35%' },
              ].map((pos, i) => (
                <div
                  key={i}
                  style={pos}
                  className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950"
                  title="Online Registered Driver"
                />
              ))}

              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <span className="font-mono text-[11px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    {activeCountryConfig.corridorName}: Active Telemetry Stream
                  </span>
                </span>
                <span className="text-cyan-400 font-mono text-[11px] tabular-nums">
                  Corridor Transit Progress {liveProgress}% · Speed 44 km/h
                </span>
              </div>
            </div>
          </div>

          {/* Recent Trips Table (Filtered to Selected Country) */}
          <div className={`p-5 rounded-xl ${cardClass}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Recent Completed &amp; Active Trips</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {selectedCountry === 'ALL' ? 'Pan-East Africa' : activeCountryConfig.name}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit rider fares, sovereign currency conversion, and driver assignment
                </p>
              </div>

              <button
                onClick={() => setActiveSubTab('monitoring')}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Track live trips
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <tr>
                    <th className="pb-3 font-semibold">Trip ID</th>
                    <th className="pb-3 font-semibold">Country</th>
                    <th className="pb-3 font-semibold">Passenger</th>
                    <th className="pb-3 font-semibold">Driver</th>
                    <th className="pb-3 font-semibold">Route</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Fare (Sovereign)</th>
                    <th className="pb-3 font-semibold text-right">Fare (ETB)</th>
                    <th className="pb-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredCountryTrips.slice(0, 8).map((t) => {
                    const cCode = resolveItemCountryCode(t, 'trip');
                    const cCfg = EAST_AFRICA_RIDE_CONFIGS[cCode] || EAST_AFRICA_RIDE_CONFIGS.ET;
                    return (
                      <tr key={t.tripId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-white tabular-nums">{t.tripId}</td>
                        <td className="py-3">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <span>{cCfg.flag}</span>
                            <span className="font-mono text-[11px]">{cCode}</span>
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{t.passenger}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{t.driver}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">
                          {t.pickup} → {t.destination}
                        </td>
                        <td className="py-3">
                          <span className={`text-xs ${getStatusTextClass(t.status)}`}>{t.status}</span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                          {formatSovereignFare(t.fareETB, cCode)}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          ETB {t.fareETB.toFixed(2)}
                        </td>
                        <td className="py-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">{t.time}</td>
                      </tr>
                    );
                  })}
                  {filteredCountryTrips.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No active or past trips recorded in {activeCountryConfig.name}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVER MANAGEMENT */}
      {activeSubTab === 'drivers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Driver Management</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedCountry === 'ALL' ? 'Pan-East Africa Roster' : `${activeCountryConfig.flag} ${activeCountryConfig.name} Roster`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify credentials, sovereign license permits, and Back4App driver audit logs
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, phone, plate..."
                  value={driverSearch}
                  onChange={(e) => {
                    setDriverSearch(e.target.value);
                    setDriverPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 w-56"
                />
              </div>

              <select
                value={driverStatusFilter}
                onChange={(e) => {
                  setDriverStatusFilter(e.target.value);
                  setDriverPage(1);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>

              <button
                onClick={() => {
                  if (!checkRideAuthority('Register new Ride driver')) return;
                  setShowAddDriverModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                {canManageRide ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Add Driver</span>
              </button>
            </div>
          </div>

          <div className={`p-5 rounded-xl ${cardClass}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <tr>
                    <th className="pb-3 font-semibold">Driver &amp; Country</th>
                    <th className="pb-3 font-semibold">Phone (National)</th>
                    <th className="pb-3 font-semibold">Vehicle &amp; Sovereign Plate</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Rating</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedDrivers.map((driver) => {
                    const cCode = resolveItemCountryCode(driver, 'driver');
                    const cCfg = EAST_AFRICA_RIDE_CONFIGS[cCode] || EAST_AFRICA_RIDE_CONFIGS.ET;
                    return (
                      <tr key={driver.objectId || driver.phone} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-slate-800 border border-cyan-200 dark:border-slate-700 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-400 text-xs shrink-0">
                              {driver.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-slate-900 dark:text-slate-200">{driver.name}</p>
                                <span className="text-xs" title={cCfg.name}>{cCfg.flag}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {cCfg.name} · Joined {driver.joinedDate || '2024'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">{driver.phone}</td>
                        <td className="py-3">
                          <p className="font-medium text-slate-900 dark:text-slate-200">{driver.vehicleModel}</p>
                          <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{driver.vehiclePlate}</p>
                        </td>
                        <td className="py-3">
                          <span className={`text-xs ${getStatusTextClass(driver.status)}`}>{driver.status}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold font-mono tabular-nums">
                            <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                            <span>{driver.rating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {driver.status !== 'Active' ? (
                              <button
                                onClick={() => {
                                  if (!checkRideAuthority(`Activate driver ${driver.name}`)) return;
                                  onUpdateDriverStatus(driver.objectId!, 'Active');
                                }}
                                title="Activate Driver"
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (!checkRideAuthority(`Suspend driver ${driver.name}`)) return;
                                  onUpdateDriverStatus(driver.objectId!, 'Suspended');
                                }}
                                title="Suspend Driver"
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (!checkRideAuthority(`Remove driver ${driver.name}`)) return;
                                onDeleteDriver(driver.objectId!);
                              }}
                              title="Remove Driver"
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedDrivers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No registered drivers match the current filters in {selectedCountry === 'ALL' ? 'East Africa' : activeCountryConfig.name}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="tabular-nums">
                Showing {filteredDrivers.length === 0 ? 0 : (safeDriverPage - 1) * DRIVERS_PER_PAGE + 1}–
                {Math.min(safeDriverPage * DRIVERS_PER_PAGE, filteredDrivers.length)} of {filteredDrivers.length} drivers
                {selectedCountry !== 'ALL' && ` in ${activeCountryConfig.name}`}
              </span>
              <div className="flex items-center gap-1 font-mono tabular-nums">
                {Array.from({ length: totalDriverPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setDriverPage(pageNum)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      safeDriverPage === pageNum
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLE MANAGEMENT */}
      {activeSubTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Fleet Vehicles</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedCountry === 'ALL' ? 'All East Africa' : `${activeCountryConfig.flag} ${activeCountryConfig.name}`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage registered mobility vehicles and sovereign roadworthiness inspections
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={() => {
                  if (!checkRideAuthority('Add fleet vehicle')) return;
                  setShowAddVehicleModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                {canManageRide ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVehicles.map((v, i) => {
              const imgKey = `${v.plate}-${i}`;
              const hasFailedImg = failedVehicleImages[imgKey] || !v.photoUrl;
              const vCountry = (v.countryCode && v.countryCode !== 'ALL' ? v.countryCode : (selectedCountry !== 'ALL' ? selectedCountry : 'ET')) as Exclude<EastAfricaCountryCode, 'ALL'>;
              const cCfg = EAST_AFRICA_RIDE_CONFIGS[vCountry] || EAST_AFRICA_RIDE_CONFIGS.ET;
              return (
                <div
                  key={imgKey}
                  className={`p-4 rounded-xl flex flex-col justify-between transition-colors hover:border-cyan-500/40 ${cardClass}`}
                >
                  <div>
                    <div className="w-full h-36 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-3 relative group">
                      {!hasFailedImg ? (
                        <img
                          src={v.photoUrl}
                          alt={`${v.model} (${v.plate})`}
                          referrerPolicy="no-referrer"
                          onError={() => setFailedVehicleImages((prev) => ({ ...prev, [imgKey]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 text-slate-500 dark:text-slate-400">
                          <Car className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-1" />
                          <span className="text-xs font-semibold">{v.model}</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/85 text-white flex items-center gap-1">
                        <span>{cCfg.flag}</span>
                        <span>{cCfg.name}</span>
                      </span>
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/85 text-white">
                        {v.type}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{v.model}</h3>
                        <p className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">{v.plate}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Driver: {v.driverName}</p>
                      </div>

                      <span className={`text-xs ${getStatusTextClass(v.status)}`}>{v.status}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">Year: {v.year} · {v.capacity || '4 seats'}</span>
                    <button
                      onClick={() => {
                        if (!checkRideAuthority(`Update inspection status for ${v.plate}`)) return;
                        onUpdateVehicleStatus(v.objectId!, v.status === 'Verified' ? 'Inspection' : 'Verified');
                      }}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                    >
                      {v.status === 'Verified' ? 'Request Inspection' : 'Mark Verified'}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredVehicles.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                <Car className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No vehicles found in this jurisdiction</p>
                <p className="text-xs mt-1">Click &ldquo;Add Vehicle&rdquo; to register a vehicle under {activeCountryConfig.name}.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TRIP MONITORING */}
      {activeSubTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Live Trip Monitoring · {activeCountryConfig.flag} {activeCountryConfig.hubTitle}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time telemetry corridor tracking across {activeCountryConfig.corridorName}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {onOpenDispatchSimulator && (
                <button
                  onClick={onOpenDispatchSimulator}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Launch Radar Simulator</span>
                </button>
              )}
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  isSimulating
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isSimulating ? 'Telemetry Streaming' : 'Telemetry Paused'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Map Area */}
            <div className={`lg:col-span-8 p-6 rounded-xl relative overflow-hidden ${cardClass}`}>
              <div className="w-full h-96 rounded-xl bg-slate-950 relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />

                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 350">
                  <path
                    d="M 120,240 C 220,200 300,120 480,90"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="6 4"
                  />
                  <circle cx="120" cy="240" r="8" fill="#3b82f6" />
                  <circle cx="480" cy="90" r="8" fill="#10b981" />

                  {(() => {
                    const t = liveProgress / 100;
                    const x = (1 - t) * (1 - t) * 120 + 2 * (1 - t) * t * 220 + t * t * 480;
                    const y = (1 - t) * (1 - t) * 240 + 2 * (1 - t) * t * 160 + t * t * 90;
                    return (
                      <g transform={`translate(${x}, ${y})`}>
                        <circle r="12" fill="#06b6d4" opacity="0.3" />
                        <circle r="6" fill="#ffffff" stroke="#06b6d4" strokeWidth="2" />
                      </g>
                    );
                  })()}
                </svg>

                <div className="absolute bottom-16 left-12 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>{activeCountryConfig.flag}</span>
                    <span>{activeCountryConfig.hubLocation}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Pickup Location</p>
                </div>

                <div className="absolute top-12 right-16 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>{activeCountryConfig.flag}</span>
                    <span>{activeCountryConfig.destLocation}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Destination</p>
                </div>

                <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-xs font-mono tabular-nums space-y-1">
                  <div className="text-cyan-400 font-bold">GPS: {activeCountryConfig.gpsCoords}</div>
                  <div className="text-slate-300">Speed: 44 km/h · Heading: 114° ESE · Node: {activeCountryConfig.capital}</div>
                </div>
              </div>
            </div>

            {/* Trip Detail Card */}
            <div className={`lg:col-span-4 p-6 rounded-xl flex flex-col justify-between ${cardClass}`}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      Trip {currentHubTrip ? currentHubTrip.tripId : activeCountryConfig.demoTrip.tripId}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Standard Sovereign Mobility Class · {activeCountryConfig.name}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    In Progress
                  </span>
                </div>

                <div className="py-4 space-y-4">
                  {/* Passenger row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-400">
                        {currentHubTrip ? currentHubTrip.passenger.charAt(0) : activeCountryConfig.demoTrip.passenger.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Passenger</p>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {currentHubTrip ? currentHubTrip.passenger : activeCountryConfig.demoTrip.passenger}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {currentHubTrip ? currentHubTrip.passengerPhone || activeCountryConfig.demoTrip.passengerPhone : activeCountryConfig.demoTrip.passengerPhone}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onNotify?.(
                          'Encrypted SIP Dispatch Relay',
                          `Connecting encrypted dispatch line to passenger in ${activeCountryConfig.name}.`,
                          'info'
                        )
                      }
                      title="Call Passenger via Dispatch Bridge"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Driver row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-300">
                        {currentHubTrip ? currentHubTrip.driver.charAt(0) : activeCountryConfig.demoTrip.driver.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Driver</p>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {currentHubTrip ? currentHubTrip.driver : activeCountryConfig.demoTrip.driver}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {activeCountryConfig.demoTrip.vehicle}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onNotify?.(
                          'Encrypted SIP Dispatch Relay',
                          `Connecting dispatch voice channel to driver in ${activeCountryConfig.name}.`,
                          'info'
                        )
                      }
                      title="Call Driver via Dispatch Bridge"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pickup & Destination */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2.5">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Pickup</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-200">
                        {currentHubTrip ? currentHubTrip.pickup : activeCountryConfig.demoTrip.pickup}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Destination</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-200">
                        {currentHubTrip ? currentHubTrip.destination : activeCountryConfig.demoTrip.dropoff}
                      </p>
                    </div>
                  </div>

                  {/* Fare & ETA */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Fare</span>
                      <p className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        {formatSovereignFare(
                          currentHubTrip ? currentHubTrip.fareETB : activeCountryConfig.demoTrip.fareETB,
                          selectedCountry !== 'ALL' ? selectedCountry : 'ET'
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Distance</span>
                      <p className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        {currentHubTrip ? `${currentHubTrip.distanceKm} km` : activeCountryConfig.demoTrip.distance}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">ETA</span>
                      <p className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400 tabular-nums">
                        {Math.max(2, Math.round(((100 - liveProgress) / 100) * 22))} min
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    if (!checkRideAuthority('Trigger Emergency Dispatch Override')) return;
                    onNotify?.(
                      'Emergency Dispatch Override Dispatched',
                      `Priority safety beacon activated for ${activeCountryConfig.corridorName} in ${activeCountryConfig.name}.`,
                      'warning'
                    );
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
                >
                  Emergency Dispatch Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RIDE ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Ride Mobility Analytics &amp; Cross-Border Clearing</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedCountry === 'ALL' ? 'Pan-East Africa' : `${activeCountryConfig.flag} ${activeCountryConfig.name}`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance metrics, regulatory tariff compliance, and sovereign payment gateway mix
              </p>
            </div>
            <button
              onClick={handleExportRideReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Trips (YTD)</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {Math.round(128445 * countryBaseScale + filteredCountryTrips.length).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">+10.4% month over month</p>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Gross Mobility Volume</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {formatSovereignFare(Math.round(8243540 * countryBaseScale) + liveFareTotalETB, selectedCountry)}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {selectedCountry === 'ALL' ? '+21.2% regional growth' : `Settled in ${activeCountryConfig.currency}`}
              </p>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Average Trip Fare</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">
                {formatSovereignFare(filteredCountryTrips.length > 0 ? liveFareTotalETB / filteredCountryTrips.length : 380, selectedCountry)}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Within {activeCountryConfig.regulatorAcronym} regulated tariff cap
              </p>
            </div>

            <div className={`p-5 rounded-xl ${cardClass}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Cancellation Rate</span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2 text-slate-900 dark:text-white">2.1%</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Below 3.0% SLA threshold</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Drivers Leaderboard (Contextualized by Country) */}
            <div className={`lg:col-span-6 p-6 rounded-xl ${cardClass}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Top Drivers Leaderboard</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({selectedCountry === 'ALL' ? 'Pan-East Africa' : activeCountryConfig.name})
                  </span>
                </h3>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold font-mono">By Completed Trips</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCountryDrivers.slice(0, 5).map((d, index) => {
                  const cCode = resolveItemCountryCode(d, 'driver');
                  const cCfg = EAST_AFRICA_RIDE_CONFIGS[cCode] || EAST_AFRICA_RIDE_CONFIGS.ET;
                  return (
                    <div key={d.objectId || d.phone} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-mono font-bold flex items-center justify-center tabular-nums">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 dark:text-white">{d.name}</p>
                            <span className="text-xs">{cCfg.flag}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            {(d.tripsCompleted || 620).toLocaleString()} completed trips · {d.vehicleModel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold font-mono tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                        <span>{d.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peak Demand Hours & Payment Gateway Distribution */}
            <div className={`lg:col-span-6 p-6 rounded-xl flex flex-col justify-between ${cardClass}`}>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Peak Mobility Hours ({activeCountryConfig.capital} EAT)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Surge trigger thresholds across {activeCountryConfig.corridorName}
                </p>

                <div className="h-32 flex items-end justify-between gap-3 pt-4 px-2">
                  {[
                    { hour: '06:00', height: '40%' },
                    { hour: '09:00', height: '95%' },
                    { hour: '12:00', height: '65%' },
                    { hour: '15:00', height: '55%' },
                    { hour: '18:00', height: '100%' },
                    { hour: '21:00', height: '70%' },
                  ].map((bar) => (
                    <div key={bar.hour} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        style={{ height: bar.height }}
                        className="w-full rounded-t-md bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-400 transition-colors"
                      />
                      <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">{bar.hour}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sovereign Payment Rails */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Sovereign Payment Clearing</span>
                  <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">{activeCountryConfig.currency}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeCountryConfig.paymentGateways.map((gw) => (
                    <span
                      key={gw}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span>{gw}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DRIVER */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl ${cardClass} shadow-2xl`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Register New Ride Driver</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Provision driver profile in Back4App Driver class
                </p>
              </div>
              <button
                onClick={() => setShowAddDriverModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onAddDriver({
                  ...newDriver,
                  countryName: EAST_AFRICA_RIDE_CONFIGS[newDriver.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]?.name || 'Ethiopia',
                });
                setShowAddDriverModal(false);
                onNotify?.('Driver Registered', `${newDriver.name} added to ${newDriver.countryCode} ride fleet.`, 'success');
                setNewDriver({
                  name: '',
                  phone: '',
                  vehicleModel: 'Toyota Vitz',
                  vehiclePlate: '',
                  status: 'Active',
                  rating: 5.0,
                  module: 'ride',
                  countryCode: (userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET') as EastAfricaCountryCode,
                });
              }}
              className="space-y-4 mt-4 text-xs"
            >
              {/* Sovereign Country Selection */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Operating Country / Jurisdiction
                </label>
                <select
                  value={newDriver.countryCode}
                  onChange={(e) => {
                    const c = e.target.value as EastAfricaCountryCode;
                    const cCfg = EAST_AFRICA_RIDE_CONFIGS[c as Exclude<EastAfricaCountryCode, 'ALL'>] || EAST_AFRICA_RIDE_CONFIGS.ET;
                    setNewDriver({
                      ...newDriver,
                      countryCode: c,
                      vehicleModel: cCfg.popularModels[0] || 'Toyota Vitz',
                      phone: cCfg.phonePrefix,
                    });
                  }}
                  className={inputClass}
                >
                  {ALL_COUNTRY_CODES.map((code) => {
                    const cfg = EAST_AFRICA_RIDE_CONFIGS[code];
                    return (
                      <option key={code} value={code}>
                        {cfg.flag} {cfg.name} ({cfg.currency}) · {cfg.regulatorAcronym}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Full Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alazar Bekele or Kevin Omondi"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  National Phone Number ({EAST_AFRICA_RIDE_CONFIGS[newDriver.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]?.name || 'National'})
                </label>
                <input
                  type="text"
                  required
                  placeholder={EAST_AFRICA_RIDE_CONFIGS[newDriver.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]?.phoneFormatHint || '+254 712 345 678'}
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Vehicle Model</label>
                  <select
                    value={newDriver.vehicleModel}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicleModel: e.target.value })}
                    className={inputClass}
                  >
                    {(EAST_AFRICA_RIDE_CONFIGS[newDriver.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]?.popularModels || ['Toyota Vitz', 'Toyota Corolla', 'Hyundai Accent']).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">License Plate</label>
                  <input
                    type="text"
                    required
                    placeholder={EAST_AFRICA_RIDE_CONFIGS[newDriver.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]?.plateHint || 'AA-88123'}
                    value={newDriver.vehiclePlate}
                    onChange={(e) => setNewDriver({ ...newDriver, vehiclePlate: e.target.value })}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Initial Verification Status</label>
                <select
                  value={newDriver.status}
                  onChange={(e) => setNewDriver({ ...newDriver, status: e.target.value as DriverStatus })}
                  className={inputClass}
                >
                  <option value="Active">Active (Ready for dispatch)</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Verified">Verified Documented</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VEHICLE */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl ${cardClass} shadow-2xl`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Fleet Vehicle</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Register vehicle record in Back4App Vehicle class
                </p>
              </div>
              <button
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onAddVehicle({
                  ...newVehicle,
                  countryName: EAST_AFRICA_RIDE_CONFIGS[newVehicle.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]?.name || 'Ethiopia',
                });
                setShowAddVehicleModal(false);
                onNotify?.('Vehicle Registered', `${newVehicle.model} (${newVehicle.plate}) added to fleet.`, 'success');
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Operating Country
                </label>
                <select
                  value={newVehicle.countryCode}
                  onChange={(e) => {
                    const c = e.target.value as EastAfricaCountryCode;
                    setNewVehicle({ ...newVehicle, countryCode: c });
                  }}
                  className={inputClass}
                >
                  {ALL_COUNTRY_CODES.map((code) => {
                    const cfg = EAST_AFRICA_RIDE_CONFIGS[code];
                    return (
                      <option key={code} value={code}>
                        {cfg.flag} {cfg.name} ({cfg.currency})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Vehicle Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Corolla or Toyota Fielder"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">License Plate</label>
                <input
                  type="text"
                  required
                  placeholder={EAST_AFRICA_RIDE_CONFIGS[newVehicle.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]?.plateHint || 'AA-99231'}
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Assigned Driver</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bekele Tesfaye or Brian Mwangi"
                  value={newVehicle.driverName}
                  onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
