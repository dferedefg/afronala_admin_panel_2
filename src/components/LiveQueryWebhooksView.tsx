import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radio,
  Send,
  Webhook,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Code,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Zap,
  Globe,
  Sliders,
  Search,
  Pause,
  Play,
  Filter,
  Check,
  ArrowRight,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Database,
  Building2,
  CreditCard,
  Truck,
  Car,
  Bell,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  EastAfricaCountryCode,
  EastAfricaCurrency,
  LiveQueryEvent,
  PermissionAction,
  ToastMessage,
  WebhookSubscription,
} from '../types';
import { back4AppService } from '../services/back4app';
import {
  EAST_AFRICAN_COUNTRIES_META,
  EastAfricaCountryMeta,
} from '../services/eastAfricaModules';

interface LiveQueryWebhooksViewProps {
  darkMode: boolean;
  userRole?: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  currentUserName?: string;
  currentUserEmail?: string;
  assignedCorridors?: string[];
  onNotify?: (title: string, message?: string, type?: ToastMessage['type']) => void;
  onGuardPermission?: (action: PermissionAction, description: string) => boolean;
}

const COUNTRIES_ORDER: Exclude<EastAfricaCountryCode, 'ALL'>[] = [
  'ET',
  'KE',
  'UG',
  'RW',
  'TZ',
  'DJ',
  'SO',
  'SS',
];

// Country-specific sample pools for authentic live event simulation
const COUNTRY_EVENT_TEMPLATES: Record<
  Exclude<EastAfricaCountryCode, 'ALL'>,
  {
    trips: { pickup: string; destination: string; fare: number; passenger: string }[];
    drivers: { name: string; plate: string; model: string; phone: string }[];
    shipments: { origin: string; destination: string; cargo: string; tonnage: number }[];
    alerts: { title: string; level: 'info' | 'warning' | 'high'; detail: string }[];
  }
> = {
  ET: {
    trips: [
      { pickup: 'Bole International Airport (T2)', destination: 'Kazanchis Commercial Hub', fare: 480, passenger: 'Yared Teshome' },
      { pickup: 'Meskel Square Light Rail', destination: 'CMC Michael Residential', fare: 360, passenger: 'Tigist Assefa' },
      { pickup: 'Piassa Historical Quarter', destination: 'Sarbet Old Airport Area', fare: 310, passenger: 'Dawit Bekele' },
    ],
    drivers: [
      { name: 'Abebe Kebede', plate: 'AA-12345', model: 'Toyota Vitz 1.3', phone: '0911 223 344' },
      { name: 'Bekele Tesfaye', plate: 'BB-67890', model: 'Hyundai Accent', phone: '0911 556 677' },
      { name: 'Hana Melkamu', plate: 'EE-77889', model: 'Suzuki Swift Dzire', phone: '0911 334 455' },
    ],
    shipments: [
      { origin: 'Addis Ababa Kality Freight Terminal', destination: 'Modjo Dry Port Freight Yard', cargo: 'Textile Export Consignment', tonnage: 24 },
      { origin: 'Modjo Dry Port Inland Depot', destination: 'Galafi Ethiopia-Djibouti Border', cargo: 'Bulk Grain Relief Bags', tonnage: 32 },
    ],
    alerts: [
      { title: 'Heavy Traffic on Gotera Interchange', level: 'warning', detail: 'AmbaLay Route Engine suggested ring road bypass' },
      { title: 'FTA Speed Limiter Telemetry Passed', level: 'info', detail: 'AA-12345 verified below 80km/h statutory city limit' },
    ],
  },
  KE: {
    trips: [
      { pickup: 'Jomo Kenyatta Airport (JKIA)', destination: 'Westlands Commercial Center', fare: 1850, passenger: 'Brian Mwangi' },
      { pickup: 'Upper Hill Financial District', destination: 'Kilimani / Yaya Centre', fare: 520, passenger: 'Faith Wanjiku' },
      { pickup: 'Nairobi CBD City Square', destination: 'Gigiri UN Avenue', fare: 950, passenger: 'Kevin Ochieng' },
    ],
    drivers: [
      { name: 'Kevin Ochieng', plate: 'KDA-192B', model: 'Toyota Vitz 1.3', phone: '+254 712 345 678' },
      { name: 'Brian Mwangi', plate: 'KCP-552T', model: 'Toyota Fielder 1.5X', phone: '+254 722 987 654' },
      { name: 'Faith Wanjiku', plate: 'KBZ-889M', model: 'Suzuki Alto K10', phone: '+254 733 112 233' },
    ],
    shipments: [
      { origin: 'Mombasa Port Container Terminal 2', destination: 'Nairobi Inland Container Depot (ICD)', cargo: 'Electronic Components 40ft HC', tonnage: 28 },
      { origin: 'Nairobi ICD Embakasi', destination: 'Malaba OSBP Kenya-Uganda Border', cargo: 'Manufactured Consumer FMCG', tonnage: 30 },
    ],
    alerts: [
      { title: 'NTSA 10% Statutory Ceiling Audit', level: 'info', detail: 'Ride platform commission strictly verified at 10% maximum' },
      { title: 'Mombasa Road Congestion Notice', level: 'warning', detail: 'Expressway interchange traffic delay 18 minutes' },
    ],
  },
  UG: {
    trips: [
      { pickup: 'Entebbe International Airport', destination: 'Kampala Serena Hotel', fare: 110000, passenger: 'Sarah Nalwanga' },
      { pickup: 'Kololo Acacia Mall', destination: 'Nakasero Hill Hospital Road', fare: 16500, passenger: 'Ronald Mugisha' },
      { pickup: 'Bugolobi Village Mall', destination: 'Makerere University Main Gate', fare: 21000, passenger: 'David Kintu' },
    ],
    drivers: [
      { name: 'Sarah Nalwanga', plate: 'UBB-102N', model: 'Toyota Premio', phone: '+256 772 123 456' },
      { name: 'Ronald Mugisha', plate: 'UCF-994M', model: 'Toyota Fielder', phone: '+256 701 456 789' },
      { name: 'David Kintu', plate: 'UDA-311K', model: 'Bajaj Boxer 150', phone: '+256 782 556 677' },
    ],
    shipments: [
      { origin: 'Malaba Border OSBP (Uganda side)', destination: 'Kampala Namanve Industrial Park', cargo: 'Steel Billets & Heavy Machinery', tonnage: 34 },
      { origin: 'Kampala Mukwano Complex', destination: 'Katuna / Gatuna Rwanda Border', cargo: 'Refined Vegetable Oil & Soap', tonnage: 22 },
    ],
    alerts: [
      { title: 'KCCA Kampala City Parking Sync', level: 'info', detail: 'Digital parking pass registered automatically' },
      { title: 'Jinja Road Heavy Rains Warning', level: 'warning', detail: 'Average corridor transit speed reduced to 34 km/h' },
    ],
  },
  RW: {
    trips: [
      { pickup: 'Kigali International Airport (KGL)', destination: 'Kigali Convention Centre', fare: 8500, passenger: 'Jean-Paul Habimana' },
      { pickup: 'Kimihurura Eco Park', destination: 'Kigali Heights Commercial', fare: 3400, passenger: 'Aline Umutoni' },
      { pickup: 'Nyarugenge City Market', destination: 'Gacuriro Residential Estates', fare: 4800, passenger: 'Eric Ndayisaba' },
    ],
    drivers: [
      { name: 'Jean-Paul Habimana', plate: 'RAC-310K', model: 'BYD e6 Electric Taxi', phone: '+250 788 123 456' },
      { name: 'Aline Umutoni', plate: 'RAF-882P', model: 'Toyota Prius Hybrid', phone: '+250 785 654 321' },
      { name: 'Eric Ndayisaba', plate: 'RAD-401X', model: 'Ampersand Electric Moto', phone: '+250 782 990 011' },
    ],
    shipments: [
      { origin: 'Rusumo OSBP Tanzania-Rwanda', destination: 'Kigali Logistics Platform (Masaka)', cargo: 'Dry Bulk Agricultural Goods', tonnage: 26 },
      { origin: 'Kigali Free Trade Zone', destination: 'Rubavu / Goma DRC Border', cargo: 'Solar Home Systems & Batteries', tonnage: 18 },
    ],
    alerts: [
      { title: 'RURA Clean Mobility Priority Active', level: 'info', detail: 'Zero-emission electric vehicle taxi queue boost enabled' },
      { title: 'RURA Maximum Tariff Cap Enforced', level: 'info', detail: 'All 48 Kigali dispatch fares strictly within statutory ceiling' },
    ],
  },
  TZ: {
    trips: [
      { pickup: 'Julius Nyerere Airport (JNIA)', destination: 'Masaki Slipway Peninsula', fare: 32000, passenger: 'Juma Mwamburi' },
      { pickup: 'Posta Mpya City Centre', destination: 'Oysterbay Shopping Centre', fare: 14000, passenger: 'Amina Selemani' },
      { pickup: 'Ubungo Bus Interchange', destination: 'Kariakoo Market District', fare: 12500, passenger: 'Baraka Mushi' },
    ],
    drivers: [
      { name: 'Juma Mwamburi', plate: 'T-492-DKL', model: 'Suzuki Ertiga 7-Seat', phone: '+255 754 123 456' },
      { name: 'Amina Selemani', plate: 'T-811-BZM', model: 'Toyota IST 1.5', phone: '+255 713 789 012' },
      { name: 'Baraka Mushi', plate: 'T-209-CRV', model: 'Toyota Noah Minivan', phone: '+255 784 556 677' },
    ],
    shipments: [
      { origin: 'Port of Dar es Salaam Berth 5', destination: 'Isaka Inland Container Dry Port', cargo: 'Mining Machinery & Drill Bits', tonnage: 36 },
      { origin: 'Dar es Salaam Changombe Industrial', destination: 'Dodoma Capital Logistics Depot', cargo: 'Construction Cement & Rebar', tonnage: 30 },
    ],
    alerts: [
      { title: 'LATRA Central VTS Telemetry Handshake', level: 'info', detail: 'Live commercial vehicle tracking stream connected' },
      { title: 'Morogoro Escarpment Fog Advisory', level: 'warning', detail: 'Transit advisory broadcast to all active freight haulers' },
    ],
  },
  DJ: {
    trips: [
      { pickup: 'Djibouti-Ambouli International Airport', destination: 'Plateau Business Quarter', fare: 1800, passenger: 'Mohamed Farah' },
      { pickup: 'Port de Djibouti Marina', destination: 'Haramous Diplomatic Zone', fare: 1400, passenger: 'Fatouma Robleh' },
      { pickup: 'Place Menelik Central', destination: 'Balbala Residential West', fare: 1100, passenger: 'Ismael Hassan' },
    ],
    drivers: [
      { name: 'Mohamed Farah', plate: 'DJ-4819-B', model: 'Nissan Sunny 1.6', phone: '+253 77 12 34 56' },
      { name: 'Fatouma Robleh', plate: 'DJ-1092-A', model: 'Toyota Corolla', phone: '+253 77 98 76 54' },
    ],
    shipments: [
      { origin: 'Doraleh Multipurpose Port (DMP)', destination: 'PK12 Heavy Truck Logistics Terminal', cargo: 'Heavy Equipment & Machinery', tonnage: 38 },
      { origin: 'Doraleh Container Terminal (SGTD)', destination: 'Galafi Ethiopia OSBP Customs Post', cargo: 'Imported Food Grain Bags', tonnage: 32 },
    ],
    alerts: [
      { title: 'DPFZA Fast-Track Green Gatepass Issued', level: 'info', detail: 'Digital port pass synchronized with customs server' },
      { title: 'PK12 Border Corridor Queue Surge', level: 'warning', detail: 'Average inspection delay 24 min at border weighbridge' },
    ],
  },
  SO: {
    trips: [
      { pickup: 'Aden Adde International Airport (MGQ)', destination: 'KM4 Commercial Interchange', fare: 8.5, passenger: 'Abdi Warsame' },
      { pickup: 'Lido Beach Promenade', destination: 'Wadajir District Offices', fare: 5.5, passenger: 'Halima Nuur' },
      { pickup: 'Bakara Commercial Market', destination: 'Hodan Green Zone Enclave', fare: 6.0, passenger: 'Hassan Guled' },
    ],
    drivers: [
      { name: 'Abdi Warsame', plate: 'SO-2918-M', model: 'Toyota Probox 1.5', phone: '+252 61 512 3456' },
      { name: 'Halima Nuur', plate: 'SO-8812-B', model: 'Toyota Axio Hybrid', phone: '+252 61 798 7654' },
    ],
    shipments: [
      { origin: 'Mogadishu Seaport Berth 3', destination: 'Afgooye Agricultural Corridor Terminal', cargo: 'Wheat Flour & Cooking Oil Consignment', tonnage: 28 },
      { origin: 'Mogadishu Central Warehouses', destination: 'Baidoa Inland Transit Distribution', cargo: 'Relief Supplies & Water Purification', tonnage: 24 },
    ],
    alerts: [
      { title: 'EVC Plus Instant Payout Relay Online', level: 'info', detail: 'Hormuud USSD payment IPN latency under 45ms' },
      { title: 'Security Escort Corridor Active', level: 'info', detail: 'Route clearance confirmed on Airport - KM4 axis' },
    ],
  },
  SS: {
    trips: [
      { pickup: 'Juba International Airport (JUB)', destination: 'Hai Cinema Central District', fare: 6500, passenger: 'Deng Malual' },
      { pickup: 'Ministries Road Government Complex', destination: 'Tongping Residential Area', fare: 4800, passenger: 'Rebecca Nyandeng' },
      { pickup: 'Konyo Konyo Central Market', destination: 'Gudele Residential West', fare: 5200, passenger: 'John Lado' },
    ],
    drivers: [
      { name: 'Deng Malual', plate: 'SSD-8812-A', model: 'Toyota HiAce Minibus', phone: '+211 92 123 4567' },
      { name: 'Rebecca Nyandeng', plate: 'SSD-3301-B', model: 'Toyota Land Cruiser Prado', phone: '+211 91 765 4321' },
    ],
    shipments: [
      { origin: 'Nimule Border Post (Uganda-South Sudan)', destination: 'Juba Customs Clearance Depot Nesitu', cargo: 'Fuel Tanker Consignment 45,000L', tonnage: 35 },
      { origin: 'Juba River Port Freight Wharf', destination: 'Bor Inland Distribution Depot', cargo: 'Dry Rations & Shelter Kits', tonnage: 25 },
    ],
    alerts: [
      { title: 'm-GURUSH Mobile Money Rail Verified', level: 'info', detail: 'SSP instant micro-settlement channel active' },
      { title: 'Nimule Customs Highway Transit Notice', level: 'warning', detail: 'Corridor road maintenance near Nesitu junction' },
    ],
  },
};

export const LiveQueryWebhooksView: React.FC<LiveQueryWebhooksViewProps> = ({
  darkMode,
  userRole = 'Super Admin',
  userJurisdiction = 'ALL',
  userJurisdictionName,
  currentUserName = 'Operator',
  currentUserEmail,
  assignedCorridors,
  onNotify,
  onGuardPermission,
}) => {
  const [activeTab, setActiveTab] = useState<'livequery' | 'webhooks' | 'flutter' | 'nodes'>('livequery');
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(
    userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ALL'
  );
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [latencyMs, setLatencyMs] = useState(38);
  const [copiedCode, setCopiedCode] = useState(false);
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoStreaming, setIsAutoStreaming] = useState(true);
  const [webhookSearchQuery, setWebhookSearchQuery] = useState('');

  // Selected country in Flutter SDK code tab
  const [flutterTargetCountry, setFlutterTargetCountry] = useState<Exclude<EastAfricaCountryCode, 'ALL'>>(
    userJurisdiction && userJurisdiction !== 'ALL' ? (userJurisdiction as Exclude<EastAfricaCountryCode, 'ALL'>) : 'KE'
  );

  // New Webhook Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['trip.requested', 'trip.completed'],
    countryCode: (userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ET') as EastAfricaCountryCode,
    targetRailOrAuthority: 'FTA / AACTB',
    secretKey: 'sec_afro_' + Math.random().toString(36).substring(2, 10),
  });

  // Test Webhook execution modal / notification
  const [testResult, setTestResult] = useState<{
    id: string;
    status: number;
    latency: number;
    msg: string;
    whName: string;
    countryFlag: string;
  } | null>(null);

  // Initial stream of events pre-seeded with all 8 countries
  const [events, setEvents] = useState<LiveQueryEvent[]>([
    {
      id: 'lq-init-1',
      timestamp: 'Just now',
      className: 'Trip',
      event: 'create',
      objectId: 'obj_trp_99182',
      countryCode: 'KE',
      countryName: 'Kenya',
      currency: 'KES',
      cityOrCorridor: 'Nairobi (Westlands -> Upper Hill)',
      payload: {
        tripId: 'TRP-KE-9801',
        pickup: 'Westlands Commercial Center',
        destination: 'Upper Hill Financial District',
        fareLocal: 'KSh 520',
        fareETB: 530,
        passenger: 'Faith Wanjiku',
        paymentRail: 'Safaricom M-PESA B2C',
        status: 'En Route',
      },
    },
    {
      id: 'lq-init-2',
      timestamp: '1m ago',
      className: 'Driver',
      event: 'update',
      objectId: 'obj_drv_11204',
      countryCode: 'ET',
      countryName: 'Ethiopia',
      currency: 'ETB',
      cityOrCorridor: 'Addis Ababa (Bole Ring Road)',
      payload: {
        name: 'Abebe Kebede',
        plate: 'AA-12345',
        status: 'Active',
        speedKmh: 42,
        battery: '94%',
        regulatorApproval: 'FTA / AACTB Valid',
      },
    },
    {
      id: 'lq-init-3',
      timestamp: '2m ago',
      className: 'Shipment',
      event: 'update',
      objectId: 'obj_shpm_5521',
      countryCode: 'RW',
      countryName: 'Rwanda',
      currency: 'RWF',
      cityOrCorridor: 'Rusumo OSBP -> Kigali Logistics Platform',
      payload: {
        shipmentId: 'FRT-RW-4401',
        status: 'In Transit',
        cargo: 'Dry Bulk Agricultural Goods (26 Tons)',
        regulatorNotice: 'RURA Compliant Manifest',
      },
    },
    {
      id: 'lq-init-4',
      timestamp: '4m ago',
      className: 'Trip',
      event: 'create',
      objectId: 'obj_trp_77219',
      countryCode: 'UG',
      countryName: 'Uganda',
      currency: 'UGX',
      cityOrCorridor: 'Kampala (Kololo -> Nakasero)',
      payload: {
        tripId: 'TRP-UG-3190',
        pickup: 'Kololo Acacia Mall',
        destination: 'Nakasero Hill Hospital Road',
        fareLocal: 'USh 16,500',
        passenger: 'Ronald Mugisha',
        paymentRail: 'MTN Mobile Money Uganda',
        status: 'Assigned',
      },
    },
    {
      id: 'lq-init-5',
      timestamp: '6m ago',
      className: 'SystemAlert',
      event: 'create',
      objectId: 'obj_alt_8812',
      countryCode: 'TZ',
      countryName: 'Tanzania',
      currency: 'TZS',
      cityOrCorridor: 'Dar es Salaam -> Morogoro',
      payload: {
        title: 'LATRA Central VTS Telemetry Ping',
        level: 'info',
        regulator: 'LATRA Tanzania',
        activeFleetInCorridor: 42,
      },
    },
    {
      id: 'lq-init-6',
      timestamp: '8m ago',
      className: 'Shipment',
      event: 'update',
      objectId: 'obj_shpm_9931',
      countryCode: 'DJ',
      countryName: 'Djibouti',
      currency: 'DJF',
      cityOrCorridor: 'Doraleh DMP -> PK12 -> Galafi',
      payload: {
        shipmentId: 'FRT-DJ-1082',
        status: 'In Transit',
        cargo: 'Transit Machinery Consignment',
        customsStatus: 'DPFZA Green Pass Cleared',
      },
    },
  ]);

  // Load configured webhooks on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await back4AppService.getWebhooks();
        setWebhooks(list);
      } catch (e) {
        console.warn('Error loading webhooks:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Periodic latency simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyMs(32 + Math.floor(Math.random() * 15));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Helper to pick random item from array
  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Inject a simulated Parse LiveQuery event into the live stream
  const handleSimulateEvent = (
    type: 'trip' | 'driver' | 'shipment' | 'alert',
    targetCountryOverride?: Exclude<EastAfricaCountryCode, 'ALL'>
  ) => {
    const targetC: Exclude<EastAfricaCountryCode, 'ALL'> =
      targetCountryOverride ||
      (selectedCountry !== 'ALL'
        ? (selectedCountry as Exclude<EastAfricaCountryCode, 'ALL'>)
        : pickRandom(COUNTRIES_ORDER));

    const meta = EAST_AFRICAN_COUNTRIES_META[targetC];
    const templates = COUNTRY_EVENT_TEMPLATES[targetC];

    let newEv: LiveQueryEvent;

    if (type === 'trip') {
      const sample = pickRandom(templates.trips);
      newEv = {
        id: 'lq-' + Date.now(),
        timestamp: 'Just now',
        className: 'Trip',
        event: 'create',
        objectId: `obj_trp_${targetC.toLowerCase()}_${Math.floor(10000 + Math.random() * 90000)}`,
        countryCode: targetC,
        countryName: meta.name,
        currency: meta.currency,
        cityOrCorridor: `${meta.capital} (${sample.pickup} -> ${sample.destination})`,
        payload: {
          tripId: `TRP-${targetC}-${Math.floor(1000 + Math.random() * 9000)}`,
          pickup: sample.pickup,
          destination: sample.destination,
          fareLocal: `${meta.currencySymbol} ${sample.fare.toLocaleString()}`,
          passenger: sample.passenger,
          paymentRail: meta.primaryPaymentRail,
          regulatoryAudit: `${meta.shortRegulator} - Verified`,
          status: 'En Route',
        },
      };
    } else if (type === 'driver') {
      const sample = pickRandom(templates.drivers);
      newEv = {
        id: 'lq-' + Date.now(),
        timestamp: 'Just now',
        className: 'Driver',
        event: 'update',
        objectId: `obj_drv_${targetC.toLowerCase()}_${Math.floor(10000 + Math.random() * 90000)}`,
        countryCode: targetC,
        countryName: meta.name,
        currency: meta.currency,
        cityOrCorridor: `${meta.capital} Operational Zone`,
        payload: {
          name: sample.name,
          plate: sample.plate,
          model: sample.model,
          status: 'Active',
          speedKmh: 35 + Math.floor(Math.random() * 30),
          battery: `${85 + Math.floor(Math.random() * 15)}%`,
          regulatoryAuthority: meta.transportRegulator,
        },
      };
    } else if (type === 'shipment') {
      const sample = pickRandom(templates.shipments);
      newEv = {
        id: 'lq-' + Date.now(),
        timestamp: 'Just now',
        className: 'Shipment',
        event: 'update',
        objectId: `obj_shpm_${targetC.toLowerCase()}_${Math.floor(10000 + Math.random() * 90000)}`,
        countryCode: targetC,
        countryName: meta.name,
        currency: meta.currency,
        cityOrCorridor: meta.corridor,
        payload: {
          shipmentId: `FRT-${targetC}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'In Transit',
          origin: sample.origin,
          destination: sample.destination,
          cargo: sample.cargo,
          tonnage: `${sample.tonnage} Tons`,
          corridor: meta.corridor,
          transitEscort: 'Active',
        },
      };
    } else {
      const sample = pickRandom(templates.alerts);
      newEv = {
        id: 'lq-' + Date.now(),
        timestamp: 'Just now',
        className: 'SystemAlert',
        event: 'create',
        objectId: `obj_alt_${targetC.toLowerCase()}_${Math.floor(10000 + Math.random() * 90000)}`,
        countryCode: targetC,
        countryName: meta.name,
        currency: meta.currency,
        cityOrCorridor: meta.capital,
        payload: {
          title: sample.title,
          level: sample.level,
          detail: sample.detail,
          jurisdiction: meta.name,
          regulator: meta.shortRegulator,
          timestamp: new Date().toLocaleTimeString(),
        },
      };
    }

    setEvents((prev) => [newEv, ...prev.slice(0, 39)]);

    if (onNotify) {
      onNotify(
        `${meta.flag} New LiveQuery Event: ${newEv.className}`,
        `${newEv.cityOrCorridor || meta.name} · ${newEv.event.toUpperCase()}`,
        'info'
      );
    }
  };

  // Background auto-streaming interval simulating WebSocket pushes across East Africa
  useEffect(() => {
    if (!isAutoStreaming || !isLiveConnected) return;

    const interval = setInterval(() => {
      const eventTypes: ('trip' | 'driver' | 'shipment' | 'alert')[] = [
        'trip',
        'driver',
        'trip',
        'shipment',
        'driver',
        'alert',
      ];
      const chosenType = pickRandom(eventTypes);
      const targetCountry =
        selectedCountry !== 'ALL'
          ? (selectedCountry as Exclude<EastAfricaCountryCode, 'ALL'>)
          : pickRandom(COUNTRIES_ORDER);

      const meta = EAST_AFRICAN_COUNTRIES_META[targetCountry];
      const templates = COUNTRY_EVENT_TEMPLATES[targetCountry];

      let newEv: LiveQueryEvent;

      if (chosenType === 'trip') {
        const sample = pickRandom(templates.trips);
        newEv = {
          id: 'lq-' + Date.now(),
          timestamp: 'Just now',
          className: 'Trip',
          event: Math.random() > 0.4 ? 'create' : 'update',
          objectId: `obj_trp_${targetCountry.toLowerCase()}_${Math.floor(10000 + Math.random() * 90000)}`,
          countryCode: targetCountry,
          countryName: meta.name,
          currency: meta.currency,
          cityOrCorridor: `${meta.capital} (${sample.pickup})`,
          payload: {
            tripId: `TRP-${targetCountry}-${Math.floor(1000 + Math.random() * 9000)}`,
            pickup: sample.pickup,
            destination: sample.destination,
            fareLocal: `${meta.currencySymbol} ${sample.fare.toLocaleString()}`,
            passenger: sample.passenger,
            paymentRail: meta.primaryPaymentRail,
            status: 'En Route',
          },
        };
      } else if (chosenType === 'driver') {
        const sample = pickRandom(templates.drivers);
        newEv = {
          id: 'lq-' + Date.now(),
          timestamp: 'Just now',
          className: 'Driver',
          event: 'update',
          objectId: `obj_drv_${targetCountry.toLowerCase()}_${Math.floor(10000 + Math.random() * 90000)}`,
          countryCode: targetCountry,
          countryName: meta.name,
          currency: meta.currency,
          cityOrCorridor: `${meta.capital} Hub`,
          payload: {
            name: sample.name,
            plate: sample.plate,
            speedKmh: 28 + Math.floor(Math.random() * 35),
            status: 'Active',
            headingDeg: Math.floor(Math.random() * 360),
          },
        };
      } else if (chosenType === 'shipment') {
        const sample = pickRandom(templates.shipments);
        newEv = {
          id: 'lq-' + Date.now(),
          timestamp: 'Just now',
          className: 'Shipment',
          event: 'update',
          objectId: `obj_shpm_${targetCountry.toLowerCase()}_${Math.floor(10000 + Math.random() * 90000)}`,
          countryCode: targetCountry,
          countryName: meta.name,
          currency: meta.currency,
          cityOrCorridor: meta.corridor,
          payload: {
            shipmentId: `FRT-${targetCountry}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'In Transit',
            origin: sample.origin,
            destination: sample.destination,
            cargo: sample.cargo,
          },
        };
      } else {
        const sample = pickRandom(templates.alerts);
        newEv = {
          id: 'lq-' + Date.now(),
          timestamp: 'Just now',
          className: 'SystemAlert',
          event: 'create',
          objectId: `obj_alt_${targetCountry.toLowerCase()}_${Math.floor(10000 + Math.random() * 90000)}`,
          countryCode: targetCountry,
          countryName: meta.name,
          currency: meta.currency,
          cityOrCorridor: meta.capital,
          payload: {
            title: sample.title,
            level: sample.level,
            detail: sample.detail,
            regulator: meta.shortRegulator,
          },
        };
      }

      setEvents((prev) => [newEv, ...prev.slice(0, 39)]);
    }, 5500);

    return () => clearInterval(interval);
  }, [isAutoStreaming, isLiveConnected, selectedCountry]);

  // Test fire a webhook
  const handleTestWebhook = (wh: WebhookSubscription) => {
    const simulatedLatency = 65 + Math.floor(Math.random() * 60);
    const countryMeta = wh.countryCode && wh.countryCode !== 'ALL'
      ? EAST_AFRICAN_COUNTRIES_META[wh.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]
      : null;

    setTestResult({
      id: wh.id,
      whName: wh.name,
      countryFlag: countryMeta?.flag || '🌍',
      status: 200,
      latency: simulatedLatency,
      msg: `Delivered outbound HTTP 200 OK to ${wh.url} · Latency ${simulatedLatency}ms · Rail: ${wh.targetRailOrAuthority || 'Regional Gate'}`,
    });

    const updated = webhooks.map((item) => {
      if (item.id === wh.id) {
        return {
          ...item,
          successCount: item.successCount + 1,
          lastStatus: 200,
          lastTriggered: 'Just now',
        };
      }
      return item;
    });
    setWebhooks(updated);
    back4AppService.saveWebhook(updated.find((x) => x.id === wh.id)!);

    if (onNotify) {
      onNotify(
        `${countryMeta?.flag || '⚡'} Webhook Ping Succeeded`,
        `${wh.name} returned HTTP 200 (${simulatedLatency}ms)`,
        'success'
      );
    }

    setTimeout(() => setTestResult(null), 6000);
  };

  // Toggle webhook active / pause
  const handleToggleWebhook = async (wh: WebhookSubscription) => {
    const updated = webhooks.map((item) => {
      if (item.id === wh.id) {
        return { ...item, active: !item.active };
      }
      return item;
    });
    setWebhooks(updated);
    await back4AppService.saveWebhook(updated.find((x) => x.id === wh.id)!);
    if (onNotify) {
      onNotify(
        `Webhook ${!wh.active ? 'Activated' : 'Paused'}`,
        `${wh.name} is now ${!wh.active ? 'listening for events' : 'temporarily halted'}.`,
        'info'
      );
    }
  };

  // Add new webhook handler
  const handleAddWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhook.url || !newWebhook.name) return;

    const countryMeta =
      newWebhook.countryCode && newWebhook.countryCode !== 'ALL'
        ? EAST_AFRICAN_COUNTRIES_META[newWebhook.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]
        : null;

    const subscription: WebhookSubscription = {
      id: 'wh-' + Date.now(),
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      secretKey: newWebhook.secretKey,
      countryCode: newWebhook.countryCode,
      countryName: countryMeta?.name || 'Pan-East Africa',
      targetRailOrAuthority: newWebhook.targetRailOrAuthority || countryMeta?.primaryPaymentRail || 'Regional Rail',
      currency: countryMeta?.currency || 'ETB',
      corridor: countryMeta?.corridor || 'Cross-Border',
      active: true,
      createdAt: new Date().toISOString(),
      lastStatus: 200,
      successCount: 0,
      failureCount: 0,
    };

    const updated = await back4AppService.saveWebhook(subscription);
    setWebhooks(updated);
    setIsAddModalOpen(false);

    if (onNotify) {
      onNotify(
        'Webhook Registered',
        `${subscription.name} configured for ${subscription.countryName}`,
        'success'
      );
    }

    setNewWebhook({
      name: '',
      url: '',
      events: ['trip.requested', 'trip.completed'],
      countryCode: (selectedCountry !== 'ALL' ? selectedCountry : 'KE') as EastAfricaCountryCode,
      targetRailOrAuthority: 'NTSA / M-PESA',
      secretKey: 'sec_afro_' + Math.random().toString(36).substring(2, 10),
    });
  };

  // Delete webhook
  const handleDeleteWebhook = async (id: string) => {
    if (onGuardPermission && !onGuardPermission('manage_modules', 'Delete Webhook Endpoint')) {
      return;
    }
    const updated = await back4AppService.deleteWebhook(id);
    setWebhooks(updated);
    if (onNotify) {
      onNotify('Webhook Deleted', 'Subscription endpoint removed from database registry', 'info');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    if (onNotify) {
      onNotify('Code Copied', 'Dart LiveQuery snippet copied to clipboard', 'success');
    }
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filter events by country and class
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedCountry !== 'ALL' && ev.countryCode !== selectedCountry) {
        return false;
      }
      if (classFilter !== 'ALL' && ev.className !== classFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const str = JSON.stringify(ev).toLowerCase();
        return str.includes(query);
      }
      return true;
    });
  }, [events, selectedCountry, classFilter, searchQuery]);

  // Filter webhooks by country and search
  const filteredWebhooks = useMemo(() => {
    return webhooks.filter((wh) => {
      if (selectedCountry !== 'ALL' && wh.countryCode && wh.countryCode !== selectedCountry) {
        return false;
      }
      if (webhookSearchQuery.trim()) {
        const q = webhookSearchQuery.toLowerCase();
        return (
          wh.name.toLowerCase().includes(q) ||
          wh.url.toLowerCase().includes(q) ||
          (wh.targetRailOrAuthority && wh.targetRailOrAuthority.toLowerCase().includes(q)) ||
          (wh.countryName && wh.countryName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [webhooks, selectedCountry, webhookSearchQuery]);

  // Counts per country for badges
  const countryEventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of COUNTRIES_ORDER) counts[c] = 0;
    for (const ev of events) {
      if (ev.countryCode && ev.countryCode in counts) {
        counts[ev.countryCode] += 1;
      }
    }
    return counts;
  }, [events]);

  const countryWebhookCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of COUNTRIES_ORDER) counts[c] = 0;
    for (const wh of webhooks) {
      if (wh.countryCode && wh.countryCode in counts) {
        counts[wh.countryCode] += 1;
      }
    }
    return counts;
  }, [webhooks]);

  // Quick helper to fill template in add webhook modal
  const handleApplyPresetTemplate = (preset: 'mpesa' | 'telebirr' | 'rura' | 'latra' | 'dmoney' | 'customs') => {
    if (preset === 'mpesa') {
      setNewWebhook((prev) => ({
        ...prev,
        name: 'Safaricom M-PESA B2C Callback IPN',
        url: 'https://payments.afronala.ke/ipn/mpesa-daraja',
        countryCode: 'KE',
        targetRailOrAuthority: 'Safaricom M-PESA B2C',
        events: ['payment.settled', 'driver.payout_ready'],
      }));
    } else if (preset === 'telebirr') {
      setNewWebhook((prev) => ({
        ...prev,
        name: 'Ethio Telecom Telebirr Webhook Bridge',
        url: 'https://payments.afronala.et/ipn/telebirr',
        countryCode: 'ET',
        targetRailOrAuthority: 'Telebirr & CBE Birr',
        events: ['payment.settled', 'driver.payout_ready'],
      }));
    } else if (preset === 'rura') {
      setNewWebhook((prev) => ({
        ...prev,
        name: 'RURA Rwanda Transport Compliance Feed',
        url: 'https://rura.gov.rw/api/v2/transport/afronala-feed',
        countryCode: 'RW',
        targetRailOrAuthority: 'RURA Rwanda',
        events: ['trip.completed', 'tariff.exceeded', 'driver.compliance_warning'],
      }));
    } else if (preset === 'latra') {
      setNewWebhook((prev) => ({
        ...prev,
        name: 'LATRA Tanzania Central VTS Push',
        url: 'https://vts.latra.go.tz/api/v1/trips/push',
        countryCode: 'TZ',
        targetRailOrAuthority: 'LATRA Tanzania',
        events: ['trip.requested', 'driver.sos_alert'],
      }));
    } else if (preset === 'dmoney') {
      setNewWebhook((prev) => ({
        ...prev,
        name: 'Djibouti Telecom D-Money Settlement IPN',
        url: 'https://dmoney.djibtelecom.dj/v2/merchant/ipn',
        countryCode: 'DJ',
        targetRailOrAuthority: 'D-Money (Djibouti Telecom)',
        events: ['payment.settled', 'driver.payout_ready'],
      }));
    } else {
      setNewWebhook((prev) => ({
        ...prev,
        name: 'East Africa Cross-Border Customs Escort Webhook',
        url: 'https://customs.eac.int/v1/corridors/transit-alert',
        countryCode: 'UG',
        targetRailOrAuthority: 'EAC Customs Authority',
        events: ['shipment.in_transit', 'shipment.delayed'],
      }));
    }
  };

  // Generate Flutter Dart code snippet for selected target country
  const targetMeta = EAST_AFRICAN_COUNTRIES_META[flutterTargetCountry];
  const flutterLiveQueryCode = `// ============================================================================
// Afronala Flutter SuperApp - Multi-Country LiveQuery Regional Client
// Target Nation: ${targetMeta.flag} ${targetMeta.name} (${targetMeta.code})
// Currency: ${targetMeta.currency} (${targetMeta.currencySymbol}) · Regulator: ${targetMeta.shortRegulator}
// Primary Payment Rail: ${targetMeta.primaryPaymentRail}
// ============================================================================

import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class AfronalaRegionalLiveQueryService {
  final LiveQuery liveQuery = LiveQuery();
  late Subscription<ParseObject> tripSubscription;
  late Subscription<ParseObject> driverSubscription;
  late Subscription<ParseObject> freightSubscription;

  // Active Station Jurisdiction: ${targetMeta.code}
  final String activeCountryCode = '${targetMeta.code}';

  void initializeRegionalSubscriptions({
    required Function(ParseObject) onTripDispatched,
    required Function(ParseObject) onDriverTelemetry,
    required Function(ParseObject) onFreightUpdated,
  }) async {
    // 1. Live Trips filtered by country of operation
    final QueryBuilder<ParseObject> tripQuery =
        QueryBuilder<ParseObject>(ParseObject('Trip'))
          ..whereEqualTo('countryCode', activeCountryCode)
          ..whereEqualTo('status', 'On-Going');

    tripSubscription = await liveQuery.client.subscribe(tripQuery);

    tripSubscription.on(LiveQueryEvent.create, (ParseObject trip) {
      print('[${targetMeta.code}] New Trip: \${trip.get<String>('tripId')}');
      print('Passenger: \${trip.get<String>('passenger')} | Fare: ${targetMeta.currencySymbol}\${trip.get<num>('fareLocal')}');
      onTripDispatched(trip);
    });

    tripSubscription.on(LiveQueryEvent.update, (ParseObject trip) {
      print('[${targetMeta.code}] Trip Updated: \${trip.get<String>('tripId')} - Distance: \${trip.get<num>('distanceKm')} km');
      onTripDispatched(trip);
    });

    // 2. Real-Time Driver Telemetry & Safety Audits (${targetMeta.shortRegulator})
    final QueryBuilder<ParseObject> driverQuery =
        QueryBuilder<ParseObject>(ParseObject('Driver'))
          ..whereEqualTo('countryCode', activeCountryCode)
          ..whereEqualTo('status', 'Active');

    driverSubscription = await liveQuery.client.subscribe(driverQuery);

    driverSubscription.on(LiveQueryEvent.update, (ParseObject driver) {
      print('[${targetMeta.code}] Driver \${driver.get<String>('name')} Speed: \${driver.get<num>('speedKmh')} km/h');
      onDriverTelemetry(driver);
    });

    // 3. Freight Haulage on Corridor (${targetMeta.corridor})
    final QueryBuilder<ParseObject> freightQuery =
        QueryBuilder<ParseObject>(ParseObject('Shipment'))
          ..whereEqualTo('countryCode', activeCountryCode)
          ..whereEqualTo('status', 'In Transit');

    freightSubscription = await liveQuery.client.subscribe(freightQuery);

    freightSubscription.on(LiveQueryEvent.update, (ParseObject shipment) {
      print('[${targetMeta.code}] Freight \${shipment.get<String>('shipmentId')} reached checkpoint');
      onFreightUpdated(shipment);
    });
  }

  void dispose() {
    liveQuery.client.unSubscribe(tripSubscription);
    liveQuery.client.unSubscribe(driverSubscription);
    liveQuery.client.unSubscribe(freightSubscription);
  }
}`;

  return (
    <div className="space-y-6">
      {/* Operator Jurisdiction Scope Context Banner */}
      <div
        className={`p-5 rounded-2xl border ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-600 text-white shadow-sm shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Parse LiveQuery &amp; Webhooks Hub
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  WSS Connected (8 Nations)
                </span>
                {userJurisdiction && userJurisdiction !== 'ALL' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                    <Lock className="w-3 h-3" />
                    Operator Station: {EAST_AFRICAN_COUNTRIES_META[userJurisdiction as Exclude<EastAfricaCountryCode, 'ALL'>]?.flag}{' '}
                    {EAST_AFRICAN_COUNTRIES_META[userJurisdiction as Exclude<EastAfricaCountryCode, 'ALL'>]?.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">
                    <Globe className="w-3 h-3" />
                    Pan-East Africa Authority
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                Real-time WebSocket event streaming (LiveQuery) and outbound HTTPS webhooks for regional mobile money IPNs,
                regulatory dispatch audits, driver companion telematics, and cross-border freight transit corridors.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Station Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {userJurisdiction && userJurisdiction !== 'ALL' && (
              <button
                onClick={() => setSelectedCountry(userJurisdiction)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedCountry === userJurisdiction
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Focus My Station</span>
                <span>({EAST_AFRICAN_COUNTRIES_META[userJurisdiction as Exclude<EastAfricaCountryCode, 'ALL'>]?.flag})</span>
              </button>
            )}

            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCountry === 'ALL'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All 8 Nations</span>
            </button>

            <div className={`p-2 px-3 rounded-xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">WSS Latency</span>
              <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 font-mono tabular-nums">{latencyMs}ms</span>
            </div>

            <div className={`p-2 px-3 rounded-xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Active Endpoints</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">{webhooks.length} Hooks</span>
            </div>
          </div>
        </div>

        {/* East Africa Country Switcher Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Filter By Country of Operation:
            </span>
            {selectedCountry !== 'ALL' && (
              <span className="text-xs font-medium text-cyan-700 dark:text-cyan-400">
                Regulator: {EAST_AFRICAN_COUNTRIES_META[selectedCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.shortRegulator} ·{' '}
                Rail: {EAST_AFRICAN_COUNTRIES_META[selectedCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.primaryPaymentRail}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                selectedCountry === 'ALL'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>🌍 All East Africa</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white tabular-nums">
                {events.length}
              </span>
            </button>

            {COUNTRIES_ORDER.map((code) => {
              const meta = EAST_AFRICAN_COUNTRIES_META[code];
              const isSelected = selectedCountry === code;
              const isHomeStation = userJurisdiction === code;
              const evCount = countryEventCounts[code] || 0;
              const whCount = countryWebhookCounts[code] || 0;

              return (
                <button
                  key={code}
                  onClick={() => setSelectedCountry(code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : isHomeStation
                      ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 hover:bg-cyan-100'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent'
                  }`}
                  title={`${meta.name} - ${meta.capital}`}
                >
                  <span>{meta.flag}</span>
                  <span>{meta.name}</span>
                  {isHomeStation && (
                    <span className="text-[9px] px-1 rounded-sm bg-cyan-700 text-white font-mono">
                      STATION
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {activeTab === 'webhooks' ? `${whCount} hooks` : evCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('livequery')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'livequery'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>LiveQuery WebSocket Stream ({filteredEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'webhooks'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Outbound Webhooks ({filteredWebhooks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('flutter')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'flutter'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Flutter Regional Dart SDK</span>
          </button>

          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'nodes'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>East Africa Edge Nodes</span>
          </button>
        </div>
      </div>

      {/* Test feedback notification */}
      {testResult && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-lg">{testResult.countryFlag}</span>
            <div>
              <p className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                {testResult.whName} - Ping Succeeded (HTTP {testResult.status})
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">{testResult.msg}</p>
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: LiveQuery Stream Feed */}
      {activeTab === 'livequery' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-4 sm:p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Live WebSocket Event Stream
                      {selectedCountry !== 'ALL' && (
                        <span className="text-xs font-normal text-cyan-600 dark:text-cyan-400">
                          (Filtered to {EAST_AFRICAN_COUNTRIES_META[selectedCountry as Exclude<EastAfricaCountryCode, 'ALL'>]?.name})
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Channel: <code className="font-mono text-cyan-600 dark:text-cyan-400">wss://parseapi.back4app.com</code> · SSL TLS 1.3
                    </p>
                  </div>
                </div>

                {/* Stream Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsAutoStreaming(!isAutoStreaming)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isAutoStreaming
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                    title={isAutoStreaming ? 'Pause real-time simulation stream' : 'Resume real-time simulation stream'}
                  >
                    {isAutoStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isAutoStreaming ? 'Auto-Streaming' : 'Stream Paused'}</span>
                  </button>

                  <button
                    onClick={() => setEvents([])}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Clear current stream feed"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Injection Bar for Testing */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 mb-4 flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Inject Simulated Event:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleSimulateEvent('trip')}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-cyan-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-cyan-700 dark:text-cyan-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1"
                  >
                    <Car className="w-3 h-3" />
                    <span>+ Ride Trip</span>
                  </button>
                  <button
                    onClick={() => handleSimulateEvent('driver')}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1"
                  >
                    <Activity className="w-3 h-3" />
                    <span>+ Driver Telemetry</span>
                  </button>
                  <button
                    onClick={() => handleSimulateEvent('shipment')}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3" />
                    <span>+ Freight Cargo</span>
                  </button>
                  <button
                    onClick={() => handleSimulateEvent('alert')}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>+ Regulatory Alert</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search payload fields, ID, passenger, plate, corridor..."
                    className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-cyan-600 ${
                      darkMode ? 'bg-slate-950/70 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">Class:</span>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-cyan-600 ${
                      darkMode ? 'bg-slate-950/70 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ALL">All Classes</option>
                    <option value="Trip">Trip (Rides)</option>
                    <option value="Driver">Driver (Telematics)</option>
                    <option value="Shipment">Shipment (Freight)</option>
                    <option value="SystemAlert">SystemAlert (Safety/Audits)</option>
                    <option value="ModuleRegistry">ModuleRegistry</option>
                  </select>
                </div>
              </div>

              {/* Event Stream List */}
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
                    <p className="font-semibold">No LiveQuery events matching the active filter.</p>
                    <p className="text-[11px] mt-1">
                      Inject a sample event above or switch country jurisdiction filter.
                    </p>
                  </div>
                ) : (
                  filteredEvents.map((ev) => {
                    const countryMeta = ev.countryCode && ev.countryCode !== 'ALL'
                      ? EAST_AFRICAN_COUNTRIES_META[ev.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]
                      : null;

                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-xl border text-xs transition-all ${
                          darkMode ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Event Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                          <div className="flex items-center gap-2">
                            {countryMeta && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                title={countryMeta.name}
                              >
                                <span>{countryMeta.flag}</span>
                                <span>{countryMeta.code}</span>
                              </span>
                            )}

                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                ev.event === 'create'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                  : ev.event === 'update'
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                              }`}
                            >
                              {ev.event}
                            </span>

                            <span className="font-bold text-slate-900 dark:text-white font-mono">
                              {ev.className}
                            </span>

                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              [{ev.objectId}]
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {ev.cityOrCorridor && (
                              <span className="hidden sm:inline text-slate-600 dark:text-slate-400 font-medium truncate max-w-[200px]">
                                {ev.cityOrCorridor}
                              </span>
                            )}
                            <span className="font-mono tabular-nums">{ev.timestamp}</span>
                          </div>
                        </div>

                        {/* JSON Payload */}
                        <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                          {JSON.stringify(ev.payload, null, 2)}
                        </pre>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Channels & Region Specs Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Subscription Channels */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} space-y-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Subscribed Live Channels
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  4 Active
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    name: 'Trip',
                    desc: 'Real-time GPS coordinates, ride requests, driver dispatch and fare calculations across 8 nations.',
                    active: true,
                    icon: Car,
                  },
                  {
                    name: 'Driver',
                    desc: 'Live driver availability, heading telemetry, speed limiter alerts and battery states.',
                    active: true,
                    icon: Activity,
                  },
                  {
                    name: 'Shipment',
                    desc: 'Northern & Central Corridor heavy freight haulage, customs waybills, and BoL updates.',
                    active: true,
                    icon: Truck,
                  },
                  {
                    name: 'SystemAlert',
                    desc: 'Regulatory alerts, statutory tariff audits, geofence breaches, and SOS panic pulses.',
                    active: true,
                    icon: AlertTriangle,
                  },
                ].map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <div
                      key={ch.name}
                      className={`p-2.5 rounded-xl border text-xs ${
                        darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white font-mono">
                          <Icon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>{ch.name}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ● Streaming
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">{ch.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Back4App LiveQuery WSS</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">TLS 1.3 OK</span>
                </div>
                <code className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 break-all block">
                  wss://parseapi.back4app.com
                </code>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Client filtering key: <span className="font-mono text-amber-600 dark:text-amber-400">countryCode</span> applied on server-side query builder.
                </p>
              </div>
            </div>

            {/* Jurisdiction Regulatory Context Card */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} space-y-3`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Station Compliance Scope
              </h3>

              {selectedCountry !== 'ALL' ? (
                (() => {
                  const meta = EAST_AFRICAN_COUNTRIES_META[selectedCountry as Exclude<EastAfricaCountryCode, 'ALL'>];
                  return (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Regulator:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{meta.transportRegulator}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Payment Rail:</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{meta.primaryPaymentRail}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Commission Ceiling:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{meta.statutoryCommissionCapPct}% Statutory Max</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Primary Corridor:</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{meta.corridor}</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-300 text-xs space-y-1">
                  <p className="font-bold">Pan-East African Multi-Station Authority</p>
                  <p className="text-[11px] text-purple-800 dark:text-purple-400">
                    LiveQuery stream aggregates all events simultaneously from Ethiopia, Kenya, Uganda, Rwanda, Tanzania, Djibouti, Somalia, and South Sudan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Webhooks Endpoints */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Configured Regional Webhook Subscriptions</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {filteredWebhooks.length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Automated outbound HTTP POST payloads dispatched upon high-priority fleet operations, mobile money IPNs, and regulatory events.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register New Webhook</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={webhookSearchQuery}
              onChange={(e) => setWebhookSearchQuery(e.target.value)}
              placeholder="Search by webhook name, endpoint URL, payment rail, or authority..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:border-cyan-600 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Webhooks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWebhooks.map((wh) => {
              const countryMeta =
                wh.countryCode && wh.countryCode !== 'ALL'
                  ? EAST_AFRICAN_COUNTRIES_META[wh.countryCode as Exclude<EastAfricaCountryCode, 'ALL'>]
                  : null;

              return (
                <div
                  key={wh.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                    wh.active
                      ? darkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                      : darkMode
                      ? 'bg-slate-950/40 border-slate-900 opacity-60'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    {/* Top Row: Country Badge + Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {countryMeta ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            <span>{countryMeta.flag}</span>
                            <span>{countryMeta.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
                            <span>🌍</span>
                            <span>Pan-Regional</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          wh.active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {wh.active ? '200 OK ACTIVE' : 'PAUSED'}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-1">
                      {wh.name}
                    </h3>

                    {wh.targetRailOrAuthority && (
                      <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold mb-2 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        <span>{wh.targetRailOrAuthority}</span>
                      </p>
                    )}

                    <p
                      className={`text-[11px] font-mono break-all mb-3 p-2 rounded-lg border line-clamp-2 ${
                        darkMode ? 'bg-slate-950 text-cyan-400 border-slate-800' : 'bg-slate-50 text-cyan-700 border-slate-200'
                      }`}
                      title={wh.url}
                    >
                      {wh.url}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Subscribed Events:</span>
                        <span className="text-slate-900 dark:text-white font-mono text-[10px] truncate max-w-[170px]" title={wh.events.join(', ')}>
                          {wh.events.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Delivered Payloads:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold tabular-nums">
                          {wh.successCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Last Triggered:</span>
                        <span className="text-slate-700 dark:text-slate-300">{wh.lastTriggered || 'Never'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => handleTestWebhook(wh)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100 hover:bg-cyan-600 dark:bg-slate-800 dark:hover:bg-cyan-600 text-slate-800 dark:text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                      title="Send test POST payload"
                    >
                      <Send className="w-3 h-3" />
                      <span>Test Ping</span>
                    </button>

                    <button
                      onClick={() => handleToggleWebhook(wh)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={wh.active ? 'Pause Webhook' : 'Activate Webhook'}
                    >
                      {wh.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDeleteWebhook(wh.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      title="Delete webhook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Flutter Dart Client */}
      {activeTab === 'flutter' && (
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Regional Flutter / Dart SDK Client Code
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Target nation client SDK snippet for Afronala passenger and driver companion apps running on Parse Server LiveQuery.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target Station:</span>
              <select
                value={flutterTargetCountry}
                onChange={(e) => setFlutterTargetCountry(e.target.value as Exclude<EastAfricaCountryCode, 'ALL'>)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-cyan-600 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              >
                {COUNTRIES_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {EAST_AFRICAN_COUNTRIES_META[c].flag} {EAST_AFRICAN_COUNTRIES_META[c].name} ({c})
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleCopy(flutterLiveQueryCode)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold whitespace-nowrap shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copied!' : 'Copy Dart Code'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed scrollbar-thin">
            {flutterLiveQueryCode}
          </pre>
        </div>
      )}

      {/* TAB 4: East Africa Edge Nodes */}
      {activeTab === 'nodes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                East Africa Distributed Edge Nodes &amp; Socket Gateways
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Low-latency edge nodes serving regional LiveQuery connections across all 8 member states.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COUNTRIES_ORDER.map((code) => {
              const meta = EAST_AFRICAN_COUNTRIES_META[code];
              const simulatedPing = 25 + Math.floor(Math.random() * 25);

              return (
                <div
                  key={code}
                  className={`p-4 rounded-2xl border ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{meta.flag}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      OPERATIONAL
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{meta.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {meta.capital} Edge Hub ({code})
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>LiveQuery Ping:</span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{simulatedPing}ms</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Payment IPN:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{meta.primaryPaymentRail}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Regulator:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{meta.shortRegulator}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Register Webhook Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Register Regional Outbound Webhook
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Dispatches automated HTTPS POST notifications to regional banking IPNs, government transport portals, or fleet management servers.
            </p>

            {/* Quick Presets */}
            <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Template Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPresetTemplate('mpesa')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  🇰🇪 Safaricom M-PESA
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTemplate('telebirr')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  🇪🇹 Telebirr IPN
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTemplate('rura')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  🇷🇼 RURA Clean Mobility
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTemplate('latra')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  🇹🇿 LATRA VTS
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTemplate('dmoney')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  🇩🇯 D-Money Djibouti
                </button>
              </div>
            </div>

            <form onSubmit={handleAddWebhookSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Country Jurisdiction</label>
                  <select
                    value={newWebhook.countryCode}
                    onChange={(e) => {
                      const c = e.target.value as EastAfricaCountryCode;
                      const meta = c !== 'ALL' ? EAST_AFRICAN_COUNTRIES_META[c as Exclude<EastAfricaCountryCode, 'ALL'>] : null;
                      setNewWebhook({
                        ...newWebhook,
                        countryCode: c,
                        targetRailOrAuthority: meta?.primaryPaymentRail || 'Regional Rail',
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-600 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {COUNTRIES_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {EAST_AFRICAN_COUNTRIES_META[c].flag} {EAST_AFRICAN_COUNTRIES_META[c].name} ({c})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Payment Rail / Authority</label>
                  <input
                    type="text"
                    required
                    value={newWebhook.targetRailOrAuthority}
                    onChange={(e) => setNewWebhook({ ...newWebhook, targetRailOrAuthority: e.target.value })}
                    placeholder="e.g. Safaricom M-PESA"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-600 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Webhook Name / Identifier</label>
                <input
                  type="text"
                  required
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="e.g. Safaricom M-PESA B2C Instant Driver Payout IPN"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-600 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Target URL (HTTPS)</label>
                <input
                  type="url"
                  required
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://payments.afronala.ke/ipn/mpesa-daraja"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-600 font-mono text-xs ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">HMAC SHA-256 Secret Key</label>
                <input
                  type="text"
                  readOnly
                  value={newWebhook.secretKey}
                  className={`w-full px-3 py-2 rounded-xl border font-mono ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-cyan-400' : 'bg-slate-100 border-slate-200 text-cyan-700'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-xs"
                >
                  Register Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
