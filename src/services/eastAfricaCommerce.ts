import { EastAfricaCountryCode, EastAfricaCurrency } from '../types';

export type CommerceVerticalKey =
  | 'food'
  | 'marketplace'
  | 'events'
  | 'hotels'
  | 'wallet'
  | 'courier';

export type CommerceReadinessStage =
  | 'standby_prelaunch'
  | 'pilot_sandbox'
  | 'public_live'
  | 'regulatory_review';

export interface CommerceVerticalMetadata {
  key: CommerceVerticalKey;
  name: string;
  category: 'Commerce' | 'Lifestyle' | 'Fintech' | 'Logistics';
  icon: string;
  tagline: string;
  description: string;
  parseClasses: string[];
  mobileRoute: string;
}

export interface LocalMerchantItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  city: string;
  area: string;
  leadTimeOrCapacity: string;
  sampleItems: { name: string; priceLocal: number; priceETB: number; desc: string }[];
  regulatoryLicense: string;
  verified: boolean;
  paymentMethods: string[];
}

export interface LocalMarketplaceProduct {
  id: string;
  title: string;
  category: string;
  merchantName: string;
  city: string;
  priceLocal: number;
  priceETB: number;
  stockUnits: number;
  inStock: boolean;
  warrantyOrOrigin: string;
}

export interface LocalEventVenue {
  id: string;
  title: string;
  venueName: string;
  city: string;
  dateString: string;
  expectedAttendance: number;
  ticketPriceLocal: number;
  ticketPriceETB: number;
  organizer: string;
  category: string;
  permitStatus: 'Approved' | 'In Review' | 'Pre-Authorized';
}

export interface LocalHotelProperty {
  id: string;
  name: string;
  type: 'Luxury Safari Lodge' | 'Business Hotel' | 'Eco Resort' | 'Boutique Stay' | 'Serviced Apartment';
  cityOrPark: string;
  stars: number;
  rating: number;
  nightlyRateLocal: number;
  nightlyRateETB: number;
  roomsAvailable: number;
  amenities: string[];
  partnerTier: 'Flagship Partner' | 'Preferred' | 'Standard';
}

export interface LocalWalletRailConfig {
  railId: string;
  operatorName: string;
  brand: string;
  type: 'Mobile Money' | 'Bank RTGS / Instant' | 'Merchant QR' | 'Agency Cash';
  settlementSpeed: 'Instant' | 'T+0 End of Day' | 'T+1';
  feePercentage: number;
  activeQrMerchants: number;
  dailyVolumeLocal: string;
  dailyVolumeETB: string;
  connectedBank: string;
  apiHealth: 'healthy' | 'degraded' | 'maintenance';
}

export interface LocalCourierFleetHub {
  hubId: string;
  hubName: string;
  city: string;
  activeRiders: number;
  vehicleFleet: 'Boda-Boda (Motorcycles)' | 'E-Bikes & Scooters' | '3-Wheeler Bajaji / TukTuk' | 'Light Cargo Vans';
  avgDeliveryMinutes: number;
  baseDeliveryFeeLocal: number;
  baseDeliveryFeeETB: number;
  coldChainPharmaSupport: boolean;
  coverageZones: string[];
}

export interface CountryRegulatoryGate {
  id: string;
  authorityAcronym: string;
  authorityName: string;
  regulationType: string;
  status: 'Compliant' | 'Audited & Cleared' | 'Under Review' | 'Action Required';
  description: string;
  lastAuditDate: string;
  mandatoryForPublicLaunch: boolean;
}

export interface CountryCommerceHubProfile {
  countryCode: Exclude<EastAfricaCountryCode, 'ALL'>;
  countryName: string;
  flag: string;
  capital: string;
  commercialHubs: string[];
  currency: EastAfricaCurrency;
  currencySymbol: string;
  exchangeRateToETB: number; // e.g. 1 KES = ~0.95 ETB, 1 USD = ~125 ETB
  readinessOverallPercent: number;
  standbyStages: Record<CommerceVerticalKey, CommerceReadinessStage>;
  foodVendors: LocalMerchantItem[];
  marketplaceProducts: LocalMarketplaceProduct[];
  events: LocalEventVenue[];
  hotels: LocalHotelProperty[];
  walletRails: LocalWalletRailConfig[];
  courierHubs: LocalCourierFleetHub[];
  regulatoryGates: CountryRegulatoryGate[];
  activePilotsCount: number;
  simulatedOrdersCompleted: number;
}

export const COMMERCE_VERTICAL_SPECS: Record<CommerceVerticalKey, CommerceVerticalMetadata> = {
  food: {
    key: 'food',
    name: 'Food Delivery & Cloud Kitchens',
    category: 'Commerce',
    icon: 'Utensils',
    tagline: 'Hyper-local culinary dispatch from premier restaurants and cloud kitchens',
    description: 'On-demand multi-dish routing, heated bag delivery, kitchen order printing terminals, and dynamic ETA dispatch tailored to regional cuisines.',
    parseClasses: ['FoodVendor', 'FoodMenuItem', 'FoodOrder', 'FoodKitchenTicket'],
    mobileRoute: '/consumer/food-delivery',
  },
  marketplace: {
    key: 'marketplace',
    name: 'E-Commerce Marketplace',
    category: 'Commerce',
    icon: 'ShoppingBag',
    tagline: 'Multi-vendor digital retail, artisans, fashion & cross-border trading',
    description: 'Direct-to-consumer digital storefronts, SKU inventory sync, escrowed merchant payouts, and integrated last-mile freight delivery.',
    parseClasses: ['MarketplaceVendor', 'MarketplaceProduct', 'MarketplaceOrder', 'EscrowHold'],
    mobileRoute: '/consumer/marketplace',
  },
  events: {
    key: 'events',
    name: 'Events, Venues & Ticketing',
    category: 'Lifestyle',
    icon: 'Calendar',
    tagline: 'Cultural festivals, stadium matches, conferences & encrypted QR access',
    description: 'Anti-scalping mobile ticketing, seat reservations, on-site Bluetooth gate scanners, and live attendance metrics for major venues.',
    parseClasses: ['EventVenue', 'EventListing', 'EventTicket', 'GateCheckLog'],
    mobileRoute: '/lifestyle/events-ticketing',
  },
  hotels: {
    key: 'hotels',
    name: 'Hotels, Lodging & Stays',
    category: 'Lifestyle',
    icon: 'Building2',
    tagline: 'Safari lodges, business suites, coastal resorts & boutique apartments',
    description: 'Instant hotel room confirmation, channel manager synchronization, verified guest profiles, and integrated airport shuttle dispatch.',
    parseClasses: ['HotelProperty', 'HotelRoomType', 'HotelBooking', 'GuestProfile'],
    mobileRoute: '/lifestyle/hotel-stays',
  },
  wallet: {
    key: 'wallet',
    name: 'Digital Wallet & Payments',
    category: 'Fintech',
    icon: 'Wallet',
    tagline: 'Unified East African digital wallet, merchant QR rails & P2P transfers',
    description: 'Interoperable multi-currency wallet engine supporting Telebirr, M-PESA, MTN MoMo, D-Money, and automated cross-border clearing.',
    parseClasses: ['WalletMerchantAccount', 'WalletPaymentTransaction', 'SettlementBatch'],
    mobileRoute: '/fintech/afronala-pay',
  },
  courier: {
    key: 'courier',
    name: 'Express Courier & Parcels',
    category: 'Logistics',
    icon: 'Package',
    tagline: 'Sub-60 minute motorbike dispatch, legal documents & light freight drops',
    description: 'Point-to-point secure courier with live AmbaLay GPS tracking, digital signature collection, and tamper-evident pouch verification.',
    parseClasses: ['CourierFleetRider', 'CourierDeliveryOrder', 'ProofOfDelivery'],
    mobileRoute: '/logistics/express-courier',
  },
};

export const EAST_AFRICA_COMMERCE_DATA: Record<
  Exclude<EastAfricaCountryCode, 'ALL'>,
  CountryCommerceHubProfile
> = {
  ET: {
    countryCode: 'ET',
    countryName: 'Ethiopia',
    flag: '🇪🇹',
    capital: 'Addis Ababa',
    commercialHubs: ['Addis Ababa (Bole, Kazanchis, Piassa)', 'Dire Dawa', 'Hawassa', 'Bahir Dar'],
    currency: 'ETB',
    currencySymbol: 'Br',
    exchangeRateToETB: 1.0,
    readinessOverallPercent: 91,
    standbyStages: {
      food: 'pilot_sandbox',
      marketplace: 'standby_prelaunch',
      events: 'pilot_sandbox',
      hotels: 'standby_prelaunch',
      wallet: 'public_live',
      courier: 'pilot_sandbox',
    },
    activePilotsCount: 28,
    simulatedOrdersCompleted: 1420,
    foodVendors: [
      {
        id: 'fd-et-1',
        name: 'Kategna Habesha Restaurant',
        category: 'Traditional Ethiopian & Kitfo Specialties',
        rating: 4.9,
        city: 'Addis Ababa',
        area: 'Bole Medhanealem & Kazanchis',
        leadTimeOrCapacity: '25-35 min delivery',
        regulatoryLicense: 'EFDA-FD-2024-8891',
        verified: true,
        paymentMethods: ['Telebirr', 'CBE Birr', 'Cash on Delivery'],
        sampleItems: [
          { name: 'Special Shekla Tibs & Enjera', priceLocal: 420, priceETB: 420, desc: 'Sizzling rosemary beef chunks served on clay brazier with organic teff injera' },
          { name: 'Gurage Style Kitfo with Ayeb & Gomen', priceLocal: 480, priceETB: 480, desc: 'Finely minced lean beef infused with spiced clarified butter and mitmita' },
          { name: 'Beyeaynetu Vegan Feast (12 Dishes)', priceLocal: 290, priceETB: 290, desc: 'Lentils, split peas, collard greens, beetroot, and cabbage on freshly steamed injera' },
        ],
      },
      {
        id: 'fd-et-2',
        name: 'Bole Cloud Kitchens Hub',
        category: 'Multi-Brand Dark Kitchen Network',
        rating: 4.8,
        city: 'Addis Ababa',
        area: 'Bole Atlas Road',
        leadTimeOrCapacity: '18-28 min express',
        regulatoryLicense: 'EFDA-CK-2025-0144',
        verified: true,
        paymentMethods: ['Telebirr', 'CBE Birr', 'Awash Birr'],
        sampleItems: [
          { name: 'Artisanal Woodfire Pizza Margherita', priceLocal: 380, priceETB: 380, desc: 'Local buffalo mozzarella, fresh basil, and San Marzano tomato reduction' },
          { name: 'Crunchy Habesha Crispy Chicken Burger', priceLocal: 320, priceETB: 320, desc: 'Double buttermilk dredged fillet with spicy berbere aioli' },
          { name: 'Cold Brew Yirgacheffe Single-Origin (500ml)', priceLocal: 160, priceETB: 160, desc: 'Slow-steeped high-altitude micro-lot coffee with floral notes' },
        ],
      },
      {
        id: 'fd-et-3',
        name: 'Castelli Ristorante Italiano',
        category: 'Fine Dining & Heritage European',
        rating: 4.85,
        city: 'Addis Ababa',
        area: 'Piassa Historical Quarter',
        leadTimeOrCapacity: '35-50 min delivery',
        regulatoryLicense: 'EFDA-FD-2023-1102',
        verified: true,
        paymentMethods: ['Telebirr', 'CBE Birr'],
        sampleItems: [
          { name: 'Handcrafted Tagliatelle Ai Funghi', priceLocal: 510, priceETB: 510, desc: 'Fresh egg pasta with wild forest mushrooms and aged parmesan' },
          { name: 'Osso Buco alla Milanese', priceLocal: 680, priceETB: 680, desc: 'Braised cross-cut veal shank with saffron risotto' },
        ],
      },
    ],
    marketplaceProducts: [
      {
        id: 'mp-et-1',
        title: 'Yirgacheffe Grade 1 Washed Coffee Beans (1kg)',
        category: 'Specialty Coffee & Agri-Exports',
        merchantName: 'Sidama Coffee Farmers Union',
        city: 'Addis Ababa',
        priceLocal: 850,
        priceETB: 850,
        stockUnits: 340,
        inStock: true,
        warrantyOrOrigin: 'Single-origin Gedeo Zone, 2100m elevation',
      },
      {
        id: 'mp-et-2',
        title: 'Authentic Hand-Woven Shemma Tibeb Dress',
        category: 'Apparel & Cultural Heritage',
        merchantName: 'Shiro Meda Artisan Guild',
        city: 'Addis Ababa',
        priceLocal: 4200,
        priceETB: 4200,
        stockUnits: 45,
        inStock: true,
        warrantyOrOrigin: '100% Ethiopian organic cotton with hand-embroidered border',
      },
      {
        id: 'mp-et-3',
        title: 'Solar Home Lighting & Inverter Kit (120W)',
        category: 'Clean Energy & Hardware',
        merchantName: 'EthioSolar Innovations',
        city: 'Addis Ababa',
        priceLocal: 14500,
        priceETB: 14500,
        stockUnits: 80,
        inStock: true,
        warrantyOrOrigin: '2-Year Manufacturer Warranty with MoWE Certificate',
      },
    ],
    events: [
      {
        id: 'ev-et-1',
        title: 'Meskel Festival Eve Choral & Lighting Gala',
        venueName: 'Meskel Square Amphitheatre',
        city: 'Addis Ababa',
        dateString: 'September 26, 2026',
        expectedAttendance: 45000,
        ticketPriceLocal: 350,
        ticketPriceETB: 350,
        organizer: 'Addis Ababa Tourism & Culture Bureau',
        category: 'Cultural & Religious Heritage',
        permitStatus: 'Approved',
      },
      {
        id: 'ev-et-2',
        title: 'East Africa Tech Summit & Startup Expo 2026',
        venueName: 'Millennium Hall Expo Center',
        city: 'Addis Ababa',
        dateString: 'November 14-16, 2026',
        expectedAttendance: 8500,
        ticketPriceLocal: 1200,
        ticketPriceETB: 1200,
        organizer: 'Ministry of Innovation and Technology (MInT)',
        category: 'Technology & Enterprise',
        permitStatus: 'Approved',
      },
      {
        id: 'ev-et-3',
        title: 'Ethiopian Premier League: St. George vs. Coffee SC',
        venueName: 'Addis Ababa Stadium',
        city: 'Addis Ababa',
        dateString: 'December 05, 2026',
        expectedAttendance: 28000,
        ticketPriceLocal: 200,
        ticketPriceETB: 200,
        organizer: 'Ethiopian Football Federation (EFF)',
        category: 'Sports Championship',
        permitStatus: 'Approved',
      },
    ],
    hotels: [
      {
        id: 'ht-et-1',
        name: 'Ethiopian Skylight Hotel',
        type: 'Business Hotel',
        cityOrPark: 'Addis Ababa Airport Corridor',
        stars: 5,
        rating: 4.9,
        nightlyRateLocal: 9800,
        nightlyRateETB: 9800,
        roomsAvailable: 65,
        amenities: ['Airport Shuttle', 'Infinity Pool', 'Convention Center', '10 Restaurants', 'Spa'],
        partnerTier: 'Flagship Partner',
      },
      {
        id: 'ht-et-2',
        name: 'Kuriftu Resort & Spa Bishoftu',
        type: 'Eco Resort',
        cityOrPark: 'Bishoftu Crater Lake District',
        stars: 5,
        rating: 4.88,
        nightlyRateLocal: 7200,
        nightlyRateETB: 7200,
        roomsAvailable: 24,
        amenities: ['Crater Lake View', 'Ayurvedic Spa', 'Water Park', 'Kayaking', 'Horseback Riding'],
        partnerTier: 'Flagship Partner',
      },
      {
        id: 'ht-et-3',
        name: 'Haile Grand Addis Ababa',
        type: 'Boutique Stay',
        cityOrPark: 'Yeka Hills / CMC',
        stars: 4,
        rating: 4.75,
        nightlyRateLocal: 5400,
        nightlyRateETB: 5400,
        roomsAvailable: 32,
        amenities: ['Olympic Fitness Gym', 'Panoramic City Terrace', 'High-Speed Fiber', 'Dining Room'],
        partnerTier: 'Preferred',
      },
    ],
    walletRails: [
      {
        railId: 'w-et-telebirr',
        operatorName: 'Ethio Telecom Telebirr',
        brand: 'Telebirr SuperApp Pay',
        type: 'Mobile Money',
        settlementSpeed: 'Instant',
        feePercentage: 0.8,
        activeQrMerchants: 48500,
        dailyVolumeLocal: 'Br 340M',
        dailyVolumeETB: '340,000,000',
        connectedBank: 'National Bank of Ethiopia Gateway',
        apiHealth: 'healthy',
      },
      {
        railId: 'w-et-cbe',
        operatorName: 'Commercial Bank of Ethiopia',
        brand: 'CBE Birr Instant Rail',
        type: 'Bank RTGS / Instant',
        settlementSpeed: 'Instant',
        feePercentage: 1.0,
        activeQrMerchants: 31200,
        dailyVolumeLocal: 'Br 195M',
        dailyVolumeETB: '195,000,000',
        connectedBank: 'CBE Core Banking (Temenos T24)',
        apiHealth: 'healthy',
      },
    ],
    courierHubs: [
      {
        hubId: 'ch-et-1',
        hubName: 'Bole International Express Dispatch Depot',
        city: 'Addis Ababa',
        activeRiders: 145,
        vehicleFleet: 'Boda-Boda (Motorcycles)',
        avgDeliveryMinutes: 28,
        baseDeliveryFeeLocal: 120,
        baseDeliveryFeeETB: 120,
        coldChainPharmaSupport: true,
        coverageZones: ['Bole', 'Kazanchis', 'Kirkos', 'Sarbet', 'Meskel Square'],
      },
      {
        hubId: 'ch-et-2',
        hubName: 'Merkato Wholesale & Cargo Logistics Point',
        city: 'Addis Ababa',
        activeRiders: 98,
        vehicleFleet: '3-Wheeler Bajaji / TukTuk',
        avgDeliveryMinutes: 38,
        baseDeliveryFeeLocal: 140,
        baseDeliveryFeeETB: 140,
        coldChainPharmaSupport: false,
        coverageZones: ['Merkato', 'Piassa', 'Teklehaimanot', 'Autobus Tera'],
      },
    ],
    regulatoryGates: [
      {
        id: 'rg-et-1',
        authorityAcronym: 'EFDA',
        authorityName: 'Ethiopian Food and Drug Authority',
        regulationType: 'Food Safety & Hygiene Certification',
        status: 'Compliant',
        description: 'Cloud kitchens, restaurant prep zones, and courier temperature insulated containers inspected and certified.',
        lastAuditDate: 'October 12, 2026',
        mandatoryForPublicLaunch: true,
      },
      {
        id: 'rg-et-2',
        authorityAcronym: 'NBE',
        authorityName: 'National Bank of Ethiopia',
        regulationType: 'Payment Instrument Issuer & Escrow Rail',
        status: 'Compliant',
        description: 'Afronala digital wallet escrow and merchant QR settlement account approved under NBE Directive ONPS/02/2020.',
        lastAuditDate: 'September 18, 2026',
        mandatoryForPublicLaunch: true,
      },
      {
        id: 'rg-et-3',
        authorityAcronym: 'MOTI',
        authorityName: 'Ministry of Trade and Regional Integration',
        regulationType: 'E-Commerce Merchant Aggregator License',
        status: 'Audited & Cleared',
        description: 'Multi-vendor digital retail catalog and consumer protection dispute resolution policy endorsed.',
        lastAuditDate: 'August 30, 2026',
        mandatoryForPublicLaunch: true,
      },
    ],
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    capital: 'Nairobi',
    commercialHubs: ['Nairobi (Westlands, Kilimani, Upper Hill, CBD)', 'Mombasa', 'Kisumu', 'Nakuru'],
    currency: 'KES',
    currencySymbol: 'KSh',
    exchangeRateToETB: 0.96, // 1 KES = ~0.96 ETB
    readinessOverallPercent: 94,
    standbyStages: {
      food: 'pilot_sandbox',
      marketplace: 'pilot_sandbox',
      events: 'pilot_sandbox',
      hotels: 'pilot_sandbox',
      wallet: 'public_live',
      courier: 'pilot_sandbox',
    },
    activePilotsCount: 42,
    simulatedOrdersCompleted: 2180,
    foodVendors: [
      {
        id: 'fd-ke-1',
        name: 'The Carnivore Restaurant Nairobi',
        category: 'Iconic Open-Air Barbecue & Nyama Choma',
        rating: 4.92,
        city: 'Nairobi',
        area: 'Langata Road Corridor',
        leadTimeOrCapacity: '30-45 min delivery',
        regulatoryLicense: 'KEBS-TRA-2025-4109',
        verified: true,
        paymentMethods: ['Safaricom M-PESA', 'Airtel Money', 'Visa/Mastercard'],
        sampleItems: [
          { name: 'Traditional Goat Nyama Choma with Ugali & Kachumbari', priceLocal: 1250, priceETB: 1200, desc: 'Slow roasted prime savannah goat ribs served with stiff white cornmeal and fresh tomato chili salsa' },
          { name: 'Swahili Coconut Fish Curry with Fragrant Rice', priceLocal: 1100, priceETB: 1056, desc: 'Fresh Indian Ocean red snapper simmered with tamarind, turmeric, and freshly pressed coconut cream' },
          { name: 'Sukuma Wiki & Roast Plantain Sauté', priceLocal: 450, priceETB: 432, desc: 'Braised collard greens sautéed with shallots and ripe sweet plantain coins' },
        ],
      },
      {
        id: 'fd-ke-2',
        name: 'Westlands Cloud Gourmet Kitchens',
        category: 'Urban Quick Service & Pan-African Bowls',
        rating: 4.88,
        city: 'Nairobi',
        area: 'Westlands Commercial Hub',
        leadTimeOrCapacity: '15-25 min express',
        regulatoryLicense: 'KRA-NCC-2026-0812',
        verified: true,
        paymentMethods: ['Safaricom M-PESA', 'Pesalink'],
        sampleItems: [
          { name: 'Nairobi Smokehouse Pulled Beef Burger', priceLocal: 850, priceETB: 816, desc: 'Slow-smoked brisket with aged cheddar and sweet tamarind glaze on brioche' },
          { name: 'Kilimani Green Glow Superfood Bowl', priceLocal: 650, priceETB: 624, desc: 'Avocado, quinoa, edamame, and lime cilantro vinaigrette' },
          { name: 'Chai Masala & Fresh Mandazi Pair', priceLocal: 280, priceETB: 268, desc: 'Steaming spiced Kericho tea paired with cardamom spiced fluffy dough triangles' },
        ],
      },
    ],
    marketplaceProducts: [
      {
        id: 'mp-ke-1',
        title: 'Authentic Hand-Beaded Maasai Ceremonial Necklace',
        category: 'Handicrafts & Fair Trade Jewelry',
        merchantName: 'Maasai Women Artisans Cooperative',
        city: 'Nairobi',
        priceLocal: 2800,
        priceETB: 2688,
        stockUnits: 120,
        inStock: true,
        warrantyOrOrigin: 'Handcrafted in Narok County, certified authentic cultural craft',
      },
      {
        id: 'mp-ke-2',
        title: 'Kericho Gold Pure Reserve Black Tea Loose Leaf (500g)',
        category: 'Tea & Beverage Exports',
        merchantName: 'Rift Valley Tea Traders',
        city: 'Nairobi',
        priceLocal: 950,
        priceETB: 912,
        stockUnits: 500,
        inStock: true,
        warrantyOrOrigin: 'High-altitude Kenyan volcanic soil single estate harvest',
      },
    ],
    events: [
      {
        id: 'ev-ke-1',
        title: 'Blankets & Wine Nairobi Spring Edition',
        venueName: 'Laureus Gardens / Ngong Racecourse',
        city: 'Nairobi',
        dateString: 'November 22, 2026',
        expectedAttendance: 12000,
        ticketPriceLocal: 3500,
        ticketPriceETB: 3360,
        organizer: 'House of Funk Ent & Afronala Events',
        category: 'Live Music & Creative Arts',
        permitStatus: 'Approved',
      },
      {
        id: 'ev-ke-2',
        title: 'Safari Sevens Rugby International Tournament',
        venueName: 'RFUEA Grounds Ngong Road',
        city: 'Nairobi',
        dateString: 'October 17-18, 2026',
        expectedAttendance: 18000,
        ticketPriceLocal: 1500,
        ticketPriceETB: 1440,
        organizer: 'Kenya Rugby Union (KRU)',
        category: 'Sports Championship',
        permitStatus: 'Approved',
      },
    ],
    hotels: [
      {
        id: 'ht-ke-1',
        name: 'The Sarova Stanley Nairobi',
        type: 'Business Hotel',
        cityOrPark: 'Nairobi Central Business District',
        stars: 5,
        rating: 4.9,
        nightlyRateLocal: 18500,
        nightlyRateETB: 17760,
        roomsAvailable: 40,
        amenities: ['Heritage Thorn Tree Cafe', 'Heated Rooftop Pool', 'Executive Boardrooms', 'Concierge Tour Desk'],
        partnerTier: 'Flagship Partner',
      },
      {
        id: 'ht-ke-2',
        name: 'Mara Serena Safari Lodge',
        type: 'Luxury Safari Lodge',
        cityOrPark: 'Maasai Mara National Reserve',
        stars: 5,
        rating: 4.96,
        nightlyRateLocal: 42000,
        nightlyRateETB: 40320,
        roomsAvailable: 18,
        amenities: ['Great Migration Views', 'Hot Air Balloon Safaris', 'Bush Dinners', 'Infinity Pool over Mara River'],
        partnerTier: 'Flagship Partner',
      },
    ],
    walletRails: [
      {
        railId: 'w-ke-mpesa',
        operatorName: 'Safaricom M-PESA',
        brand: 'Lipa Na M-PESA Buy Goods & Paybill',
        type: 'Mobile Money',
        settlementSpeed: 'Instant',
        feePercentage: 0.75,
        activeQrMerchants: 82000,
        dailyVolumeLocal: 'KSh 850M',
        dailyVolumeETB: '816,000,000',
        connectedBank: 'Central Bank of Kenya National Switch',
        apiHealth: 'healthy',
      },
    ],
    courierHubs: [
      {
        hubId: 'ch-ke-1',
        hubName: 'Nairobi CBD & Kilimani Boda Fleet Node',
        city: 'Nairobi',
        activeRiders: 210,
        vehicleFleet: 'Boda-Boda (Motorcycles)',
        avgDeliveryMinutes: 22,
        baseDeliveryFeeLocal: 150,
        baseDeliveryFeeETB: 144,
        coldChainPharmaSupport: true,
        coverageZones: ['Westlands', 'Kilimani', 'Upper Hill', 'CBD', 'Lavington'],
      },
    ],
    regulatoryGates: [
      {
        id: 'rg-ke-1',
        authorityAcronym: 'KEBS',
        authorityName: 'Kenya Bureau of Standards',
        regulationType: 'Quality & Food Distribution Standards',
        status: 'Compliant',
        description: 'Standardization mark issued for packaged delivery logistics and vendor kitchens.',
        lastAuditDate: 'September 25, 2026',
        mandatoryForPublicLaunch: true,
      },
      {
        id: 'rg-ke-2',
        authorityAcronym: 'TRA',
        authorityName: 'Tourism Regulatory Authority',
        regulationType: 'Hospitality & Ticketing Booking Platform Permit',
        status: 'Compliant',
        description: 'Class A online travel aggregator and event ticketing license cleared.',
        lastAuditDate: 'August 14, 2026',
        mandatoryForPublicLaunch: true,
      },
      {
        id: 'rg-ke-3',
        authorityAcronym: 'CA',
        authorityName: 'Communications Authority of Kenya',
        regulationType: 'Postal & Express Courier License',
        status: 'Compliant',
        description: 'National commercial courier authorization granted for motorbike and parcel logistics.',
        lastAuditDate: 'October 02, 2026',
        mandatoryForPublicLaunch: true,
      },
    ],
  },
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    flag: '🇺🇬',
    capital: 'Kampala',
    commercialHubs: ['Kampala (Kololo, Nakasero, Bugolobi)', 'Entebbe', 'Jinja', 'Gulu'],
    currency: 'UGX',
    currencySymbol: 'USh',
    exchangeRateToETB: 0.034, // 1 UGX = ~0.034 ETB (e.g. 10,000 UGX = 340 ETB)
    readinessOverallPercent: 88,
    standbyStages: {
      food: 'pilot_sandbox',
      marketplace: 'standby_prelaunch',
      events: 'pilot_sandbox',
      hotels: 'standby_prelaunch',
      wallet: 'public_live',
      courier: 'pilot_sandbox',
    },
    activePilotsCount: 22,
    simulatedOrdersCompleted: 980,
    foodVendors: [
      {
        id: 'fd-ug-1',
        name: 'The Rolex Hub & Matooke Kitchen',
        category: 'Ugandan Street Delicacies & Heritage Cuisine',
        rating: 4.86,
        city: 'Kampala',
        area: 'Wandegeya & Kololo',
        leadTimeOrCapacity: '20-30 min delivery',
        regulatoryLicense: 'UNBS-FD-2025-0711',
        verified: true,
        paymentMethods: ['MTN Mobile Money', 'Airtel Money Uganda'],
        sampleItems: [
          { name: 'Special Jumbo Rolex (3 Eggs, Minced Beef, Chapati)', priceLocal: 8500, priceETB: 289, desc: 'Fresh pan-fried chapati rolled with seasoned vegetable omelet, shredded cabbage, and spicy minced beef' },
          { name: 'Traditional Smoked Beef Luwombo with Steamed Matooke', priceLocal: 24000, priceETB: 816, desc: 'Tender beef and peanut sauce slow-steamed in banana leaf parcels with savory plantain mash' },
          { name: 'Crispy Nsenene (Seasonal Spiced Grasshoppers)', priceLocal: 12000, priceETB: 408, desc: 'Pan-roasted with onions and peppers, a crunchy Kampala specialty' },
        ],
      },
    ],
    marketplaceProducts: [
      {
        id: 'mp-ug-1',
        title: 'Uganda Mount Elgon Peaberry Arabica (1kg)',
        category: 'Specialty Coffee',
        merchantName: 'Bugisu Coffee Cooperative',
        city: 'Kampala',
        priceLocal: 42000,
        priceETB: 1428,
        stockUnits: 150,
        inStock: true,
        warrantyOrOrigin: 'Direct from organic slopes of Mount Elgon, 2200m',
      },
    ],
    events: [
      {
        id: 'ev-ug-1',
        title: 'Nyege Nyege International Festival 2026',
        venueName: 'Itanda Falls Jinja River Banks',
        city: 'Jinja',
        dateString: 'November 05-08, 2026',
        expectedAttendance: 15000,
        ticketPriceLocal: 150000,
        ticketPriceETB: 5100,
        organizer: 'Nyege Nyege Collective & Uganda Tourism Board',
        category: 'Pan-African Music & Underground Arts',
        permitStatus: 'Approved',
      },
    ],
    hotels: [
      {
        id: 'ht-ug-1',
        name: 'Speke Resort & Conference Centre Munyonyo',
        type: 'Luxury Safari Lodge',
        cityOrPark: 'Lake Victoria Shores Munyonyo',
        stars: 5,
        rating: 4.9,
        nightlyRateLocal: 650000,
        nightlyRateETB: 22100,
        roomsAvailable: 28,
        amenities: ['Lake Victoria Marina', 'Equestrian Center', 'Olympic Pool', 'Helipad'],
        partnerTier: 'Flagship Partner',
      },
    ],
    walletRails: [
      {
        railId: 'w-ug-mtn',
        operatorName: 'MTN Uganda Mobile Money',
        brand: 'MoMoPay Merchant Rail',
        type: 'Mobile Money',
        settlementSpeed: 'Instant',
        feePercentage: 0.9,
        activeQrMerchants: 38000,
        dailyVolumeLocal: 'USh 4.2B',
        dailyVolumeETB: '142,800,000',
        connectedBank: 'Bank of Uganda National Payment Switch',
        apiHealth: 'healthy',
      },
    ],
    courierHubs: [
      {
        hubId: 'ch-ug-1',
        hubName: 'Kampala Central SafeBoda Courier Point',
        city: 'Kampala',
        activeRiders: 160,
        vehicleFleet: 'Boda-Boda (Motorcycles)',
        avgDeliveryMinutes: 24,
        baseDeliveryFeeLocal: 4500,
        baseDeliveryFeeETB: 153,
        coldChainPharmaSupport: true,
        coverageZones: ['Kololo', 'Bugolobi', 'Nakasero', 'Wandegeya', 'Ntinda'],
      },
    ],
    regulatoryGates: [
      {
        id: 'rg-ug-1',
        authorityAcronym: 'UNBS',
        authorityName: 'Uganda National Bureau of Standards',
        regulationType: 'Quality Standards for Consumer Goods & Delivery',
        status: 'Compliant',
        description: 'Certified courier storage packaging and cold-chain thermal bags.',
        lastAuditDate: 'October 05, 2026',
        mandatoryForPublicLaunch: true,
      },
      {
        id: 'rg-ug-2',
        authorityAcronym: 'BOU',
        authorityName: 'Bank of Uganda',
        regulationType: 'National Payment Systems (NPS) Compliance',
        status: 'Compliant',
        description: 'Merchant payment aggregator escrow integration approved.',
        lastAuditDate: 'August 19, 2026',
        mandatoryForPublicLaunch: true,
      },
    ],
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    flag: '🇷🇼',
    capital: 'Kigali',
    commercialHubs: ['Kigali (Kimihurura, Kiyovu, Nyarutarama)', 'Rubavu (Lake Kivu)', 'Musanze'],
    currency: 'RWF',
    currencySymbol: 'FRw',
    exchangeRateToETB: 0.092, // 1 RWF = ~0.092 ETB (e.g. 10,000 RWF = 920 ETB)
    readinessOverallPercent: 93,
    standbyStages: {
      food: 'pilot_sandbox',
      marketplace: 'pilot_sandbox',
      events: 'pilot_sandbox',
      hotels: 'pilot_sandbox',
      wallet: 'public_live',
      courier: 'pilot_sandbox',
    },
    activePilotsCount: 26,
    simulatedOrdersCompleted: 1140,
    foodVendors: [
      {
        id: 'fd-rw-1',
        name: 'Kimihurura Flame Brochettes & Grill',
        category: 'Rwandan Grilled Brochettes & Isambaza',
        rating: 4.9,
        city: 'Kigali',
        area: 'Kimihurura Gourmet Strip',
        leadTimeOrCapacity: '20-30 min delivery',
        regulatoryLicense: 'FDA-RW-2025-9921',
        verified: true,
        paymentMethods: ['MTN MoMo Rwanda', 'Airtel Money Rwanda'],
        sampleItems: [
          { name: 'Tender Beef & Goat Brochettes with Ibirayi Chips', priceLocal: 4500, priceETB: 414, desc: 'Marinated beef skewered with onions and bell peppers, grilled over charcoal with spiced potato wedges' },
          { name: 'Fresh Crispy Isambaza from Lake Kivu with Pili-Pili', priceLocal: 6000, priceETB: 552, desc: 'Deep-fried miniature lake fish served with fiery Akabanga chili and tartar dip' },
          { name: 'Slow Roasted Akabenz Pork Chops', priceLocal: 7500, priceETB: 690, desc: 'Iconic Rwandan caramelized roasted pork chunks with sweet onion glaze' },
        ],
      },
    ],
    marketplaceProducts: [
      {
        id: 'mp-rw-1',
        title: 'Handcrafted Agaseke Peace Basket (Large)',
        category: 'Artisanal Made-in-Rwanda Crafts',
        merchantName: 'Gahaya Links Women Weavers',
        city: 'Kigali',
        priceLocal: 28000,
        priceETB: 2576,
        stockUnits: 65,
        inStock: true,
        warrantyOrOrigin: 'Natural sisal and sweetgrass, authentic Rwandan heritage seal',
      },
    ],
    events: [
      {
        id: 'ev-rw-1',
        title: 'Kwita Izina 2026: Gorilla Naming Ceremony & Concert',
        venueName: 'Kinigi Foothills / BK Arena Kigali',
        city: 'Musanze / Kigali',
        dateString: 'September 04, 2026',
        expectedAttendance: 25000,
        ticketPriceLocal: 15000,
        ticketPriceETB: 1380,
        organizer: 'Rwanda Development Board (RDB)',
        category: 'Eco-Tourism & Conservation',
        permitStatus: 'Approved',
      },
      {
        id: 'ev-rw-2',
        title: 'Tour du Rwanda UCI Cycling Grand Finale Stage',
        venueName: 'Kigali City Circuit / Mont Kigali',
        city: 'Kigali',
        dateString: 'February 28, 2026',
        expectedAttendance: 50000,
        ticketPriceLocal: 5000,
        ticketPriceETB: 460,
        organizer: 'Rwanda Cycling Federation (FERWACY)',
        category: 'International Sports',
        permitStatus: 'Approved',
      },
    ],
    hotels: [
      {
        id: 'ht-rw-1',
        name: 'One&Only Gorilla’s Nest Lodge',
        type: 'Luxury Safari Lodge',
        cityOrPark: 'Volcanoes National Park Foothills',
        stars: 5,
        rating: 4.98,
        nightlyRateLocal: 1450000,
        nightlyRateETB: 133400,
        roomsAvailable: 12,
        amenities: ['Eucalyptus Forest Suites', 'Private Gorilla Trek Guide', 'Heated Plunge Pool', 'Farm-to-Table Dining'],
        partnerTier: 'Flagship Partner',
      },
      {
        id: 'ht-rw-2',
        name: 'Kigali Marriott Hotel',
        type: 'Business Hotel',
        cityOrPark: 'Kigali City Center KN 3 Ave',
        stars: 5,
        rating: 4.88,
        nightlyRateLocal: 220000,
        nightlyRateETB: 20240,
        roomsAvailable: 45,
        amenities: ['Ballroom Convention Hall', 'Executive Lounge', 'Fitness Spa', 'Outdoor Pool'],
        partnerTier: 'Flagship Partner',
      },
    ],
    walletRails: [
      {
        railId: 'w-rw-momo',
        operatorName: 'MTN Rwanda MoMo',
        brand: 'MoMoPay Rwanda Instant API',
        type: 'Mobile Money',
        settlementSpeed: 'Instant',
        feePercentage: 0.85,
        activeQrMerchants: 26000,
        dailyVolumeLocal: 'FRw 1.8B',
        dailyVolumeETB: '165,600,000',
        connectedBank: 'National Bank of Rwanda (BNR) Gateway',
        apiHealth: 'healthy',
      },
    ],
    courierHubs: [
      {
        hubId: 'ch-rw-1',
        hubName: 'Kigali E-Moto Clean Energy Dispatch Hub',
        city: 'Kigali',
        activeRiders: 110,
        vehicleFleet: 'E-Bikes & Scooters',
        avgDeliveryMinutes: 18,
        baseDeliveryFeeLocal: 1200,
        baseDeliveryFeeETB: 110,
        coldChainPharmaSupport: true,
        coverageZones: ['Kiyovu', 'Kimihurura', 'Nyarutarama', 'Remera', 'Kacyiru'],
      },
    ],
    regulatoryGates: [
      {
        id: 'rg-rw-1',
        authorityAcronym: 'Rwanda FDA',
        authorityName: 'Rwanda Food and Drugs Authority',
        regulationType: 'Food Safety Hygiene & Packaging Compliance',
        status: 'Compliant',
        description: 'Sanitary inspections cleared for all partner cloud kitchens and insulated delivery boxes.',
        lastAuditDate: 'October 10, 2026',
        mandatoryForPublicLaunch: true,
      },
      {
        id: 'rg-rw-2',
        authorityAcronym: 'RURA',
        authorityName: 'Rwanda Utilities Regulatory Authority',
        regulationType: 'E-Mobility & Commercial Delivery Authorization',
        status: 'Compliant',
        description: 'Green electric moto fleet operating permit active under RURA Directive 002/2024.',
        lastAuditDate: 'September 12, 2026',
        mandatoryForPublicLaunch: true,
      },
    ],
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    flag: '🇹🇿',
    capital: 'Dar es Salaam',
    commercialHubs: ['Dar es Salaam (Masaki, Oysterbay, Kariakoo)', 'Zanzibar (Stone Town, Nungwi)', 'Arusha', 'Mwanza'],
    currency: 'TZS',
    currencySymbol: 'TSh',
    exchangeRateToETB: 0.046, // 1 TZS = ~0.046 ETB
    readinessOverallPercent: 89,
    standbyStages: {
      food: 'pilot_sandbox',
      marketplace: 'pilot_sandbox',
      events: 'pilot_sandbox',
      hotels: 'pilot_sandbox',
      wallet: 'public_live',
      courier: 'pilot_sandbox',
    },
    activePilotsCount: 24,
    simulatedOrdersCompleted: 1020,
    foodVendors: [
      {
        id: 'fd-tz-1',
        name: 'Zanzibar Spice Grill & Seafood',
        category: 'Swahili Coastal Spices & Fresh Lobster',
        rating: 4.88,
        city: 'Dar es Salaam',
        area: 'Masaki Peninsula & Slipway',
        leadTimeOrCapacity: '25-40 min delivery',
        regulatoryLicense: 'TBS-TRA-2025-3301',
        verified: true,
        paymentMethods: ['Vodacom M-Pesa', 'Tigo Pesa', 'Airtel Money'],
        sampleItems: [
          { name: 'Grilled Jumbo Tiger Prawns with Zanzibar Spiced Pilau', priceLocal: 28000, priceETB: 1288, desc: 'Fresh prawns brushed with garlic clove butter, served with fragrant clove and cardamom rice' },
          { name: 'Iconic Dar Chips Mayai with Mishkaki Skewers', priceLocal: 8500, priceETB: 391, desc: 'French fry omelet loaded with scallions, served with marinated beef skewers and tamarind chili' },
          { name: 'Stone Town Cardamom Coffee with Fresh Halwa', priceLocal: 4500, priceETB: 207, desc: 'Traditional brass pot brew served with almond spiced jelly cubes' },
        ],
      },
    ],
    marketplaceProducts: [
      {
        id: 'mp-tz-1',
        title: 'Certified Natural Blue Tanzanite Gemstone Pendant (1.2ct)',
        category: 'Fine Jewelry & Mineral Heritage',
        merchantName: 'Merelani Gem Artisans',
        city: 'Arusha',
        priceLocal: 450000,
        priceETB: 20700,
        stockUnits: 15,
        inStock: true,
        warrantyOrOrigin: 'Ministry of Minerals certificate of authenticity from Merelani Hills',
      },
    ],
    events: [
      {
        id: 'ev-tz-1',
        title: 'Sauti za Busara Zanzibar Festival 2027',
        venueName: 'Old Fort (Ngome Kongwe) Stone Town',
        city: 'Zanzibar',
        dateString: 'February 12-15, 2027',
        expectedAttendance: 14000,
        ticketPriceLocal: 45000,
        ticketPriceETB: 2070,
        organizer: 'Busara Promotions & Zanzibar Tourism Board',
        category: 'Pan-African World Music',
        permitStatus: 'Approved',
      },
    ],
    hotels: [
      {
        id: 'ht-tz-1',
        name: 'Four Seasons Safari Lodge Serengeti',
        type: 'Luxury Safari Lodge',
        cityOrPark: 'Central Serengeti National Park',
        stars: 5,
        rating: 4.97,
        nightlyRateLocal: 1850000,
        nightlyRateETB: 85100,
        roomsAvailable: 16,
        amenities: ['Watering Hole Viewing Terrace', 'Discovery Center Museum', 'Bush Spa', 'Infinity Pool'],
        partnerTier: 'Flagship Partner',
      },
    ],
    walletRails: [
      {
        railId: 'w-tz-mpesa',
        operatorName: 'Vodacom Tanzania M-Pesa',
        brand: 'Lipa kwa M-Pesa QR',
        type: 'Mobile Money',
        settlementSpeed: 'Instant',
        feePercentage: 0.8,
        activeQrMerchants: 45000,
        dailyVolumeLocal: 'TSh 3.8B',
        dailyVolumeETB: '174,800,000',
        connectedBank: 'Bank of Tanzania (TIPS Instant Switch)',
        apiHealth: 'healthy',
      },
    ],
    courierHubs: [
      {
        hubId: 'ch-tz-1',
        hubName: 'Kariakoo Commercial & Marine Parcel Node',
        city: 'Dar es Salaam',
        activeRiders: 130,
        vehicleFleet: 'Boda-Boda (Motorcycles)',
        avgDeliveryMinutes: 26,
        baseDeliveryFeeLocal: 3500,
        baseDeliveryFeeETB: 161,
        coldChainPharmaSupport: false,
        coverageZones: ['Kariakoo', 'Posta', 'Masaki', 'Upanga', 'Kinondoni'],
      },
    ],
    regulatoryGates: [
      {
        id: 'rg-tz-1',
        authorityAcronym: 'TBS',
        authorityName: 'Tanzania Bureau of Standards',
        regulationType: 'Food Safety & Consumer Protection',
        status: 'Compliant',
        description: 'Certified standards for commercial food transport and sealed containers.',
        lastAuditDate: 'October 01, 2026',
        mandatoryForPublicLaunch: true,
      },
    ],
  },
  DJ: {
    countryCode: 'DJ',
    countryName: 'Djibouti',
    flag: '🇩🇯',
    capital: 'Djibouti City',
    commercialHubs: ['Djibouti City (Plateau, Heron, Haramous)', 'PK12 Free Zone', 'Doraleh Port'],
    currency: 'DJF',
    currencySymbol: 'Fdj',
    exchangeRateToETB: 0.70, // 1 DJF = ~0.70 ETB
    readinessOverallPercent: 86,
    standbyStages: {
      food: 'pilot_sandbox',
      marketplace: 'standby_prelaunch',
      events: 'standby_prelaunch',
      hotels: 'pilot_sandbox',
      wallet: 'public_live',
      courier: 'pilot_sandbox',
    },
    activePilotsCount: 14,
    simulatedOrdersCompleted: 620,
    foodVendors: [
      {
        id: 'fd-dj-1',
        name: 'Restaurant Al-Sadafah & Poisson Yéménite',
        category: 'Red Sea Seafood & Traditional Mukbaza',
        rating: 4.85,
        city: 'Djibouti City',
        area: 'Place Menelik & Plateau',
        leadTimeOrCapacity: '25-35 min delivery',
        regulatoryLicense: 'MS-DJ-2025-1109',
        verified: true,
        paymentMethods: ['D-Money', 'Waafi', 'Cash'],
        sampleItems: [
          { name: 'Poisson Yéménite Clay-Oven Roast Red Snapper', priceLocal: 2800, priceETB: 1960, desc: 'Butterflied sea bass baked in clay tandoor with hawaij spice mix, served with warm khubz flatbread' },
          { name: 'Fah-Fah Spiced Broth with Tender Camel Meat', priceLocal: 1600, priceETB: 1120, desc: 'Slow simmered broth with leeks, tomatoes, cumin, and cilantro' },
          { name: 'Mukbaza Banana & Honey Pastry Puree', priceLocal: 950, priceETB: 665, desc: 'Mashed roasted plantain with organic honey, dates, and black nigella seeds' },
        ],
      },
    ],
    marketplaceProducts: [
      {
        id: 'mp-dj-1',
        title: 'Duty-Free Red Sea Satellite Navigation & Marine Transponder',
        category: 'Marine Electronics & Transit Trade',
        merchantName: 'Doraleh Free Zone Tech Hub',
        city: 'Djibouti City',
        priceLocal: 48000,
        priceETB: 33600,
        stockUnits: 25,
        inStock: true,
        warrantyOrOrigin: 'Imported through DPFZA Free Zone with customs transit bond',
      },
    ],
    events: [
      {
        id: 'ev-dj-1',
        title: 'Fest’Horn International Music & Red Sea Expo',
        venueName: 'Palais du Peuple Djibouti',
        city: 'Djibouti City',
        dateString: 'December 18-20, 2026',
        expectedAttendance: 6000,
        ticketPriceLocal: 3000,
        ticketPriceETB: 2100,
        organizer: 'Ministère de la Jeunesse et de la Culture',
        category: 'Cultural Music Festival',
        permitStatus: 'Approved',
      },
    ],
    hotels: [
      {
        id: 'ht-dj-1',
        name: 'Djibouti Palace Kempinski',
        type: 'Business Hotel',
        cityOrPark: 'Ilot du Heron Red Sea Waterfront',
        stars: 5,
        rating: 4.92,
        nightlyRateLocal: 45000,
        nightlyRateETB: 31500,
        roomsAvailable: 22,
        amenities: ['Private Red Sea Beach', 'Infinity Pool', 'Convention Center', 'Casino', 'Helipad'],
        partnerTier: 'Flagship Partner',
      },
    ],
    walletRails: [
      {
        railId: 'w-dj-dmoney',
        operatorName: 'Djibouti Telecom D-Money',
        brand: 'D-Money Mobile Wallet',
        type: 'Mobile Money',
        settlementSpeed: 'Instant',
        feePercentage: 1.0,
        activeQrMerchants: 8500,
        dailyVolumeLocal: 'Fdj 65M',
        dailyVolumeETB: '45,500,000',
        connectedBank: 'Banque Centrale de Djibouti (BCD)',
        apiHealth: 'healthy',
      },
    ],
    courierHubs: [
      {
        hubId: 'ch-dj-1',
        hubName: 'Port-to-City Diplomatic & Customs Dispatch',
        city: 'Djibouti City',
        activeRiders: 45,
        vehicleFleet: 'Boda-Boda (Motorcycles)',
        avgDeliveryMinutes: 20,
        baseDeliveryFeeLocal: 600,
        baseDeliveryFeeETB: 420,
        coldChainPharmaSupport: true,
        coverageZones: ['Plateau', 'Heron', 'Haramous', 'Doraleh Port', 'PK12'],
      },
    ],
    regulatoryGates: [
      {
        id: 'rg-dj-1',
        authorityAcronym: 'DPFZA',
        authorityName: 'Djibouti Ports and Free Zones Authority',
        regulationType: 'Transit & Cross-Border Logistics Authorization',
        status: 'Compliant',
        description: 'Authorized courier entry into bonded terminal zones and port gates.',
        lastAuditDate: 'September 30, 2026',
        mandatoryForPublicLaunch: true,
      },
    ],
  },
  SO: {
    countryCode: 'SO',
    countryName: 'Somalia',
    flag: '🇸🇴',
    capital: 'Mogadishu',
    commercialHubs: ['Mogadishu (Liido Beach, Bakara, Airport Road)', 'Hargeisa', 'Berbera Port', 'Garowe'],
    currency: 'SOS',
    currencySymbol: 'SSh',
    exchangeRateToETB: 0.22, // 1 USD = 26,000 SOS or ~0.22 ETB
    readinessOverallPercent: 84,
    standbyStages: {
      food: 'pilot_sandbox',
      marketplace: 'standby_prelaunch',
      events: 'standby_prelaunch',
      hotels: 'pilot_sandbox',
      wallet: 'public_live',
      courier: 'pilot_sandbox',
    },
    activePilotsCount: 16,
    simulatedOrdersCompleted: 710,
    foodVendors: [
      {
        id: 'fd-so-1',
        name: 'Liido Beach Oceanfront Seafood & Suqaar',
        category: 'Somali Traditional Cuisine & Kingfish',
        rating: 4.87,
        city: 'Mogadishu',
        area: 'Liido Beachfront Strip',
        leadTimeOrCapacity: '25-35 min delivery',
        regulatoryLicense: 'SBS-MOG-2025-0422',
        verified: true,
        paymentMethods: ['Hormuud EVC Plus', 'Zaad', 'Sahal'],
        sampleItems: [
          { name: 'Spiced Camel Suqaar with Fragrant Basmati Rice', priceLocal: 120000, priceETB: 600, desc: 'Diced tender camel meat stir-fried with hawash spice mix, red onions, and bell peppers' },
          { name: 'Fresh Grilled Indian Ocean Kingfish (Kalluun)', priceLocal: 160000, priceETB: 800, desc: 'Catch of the day grilled with garlic, tamarind glaze, and fresh lime' },
          { name: 'Somali Anjero with Spiced Liver Gravy', priceLocal: 70000, priceETB: 350, desc: 'Sourdough fermented crêpe served with braised mutton liver stew' },
        ],
      },
    ],
    marketplaceProducts: [
      {
        id: 'mp-so-1',
        title: 'Wild-Harvested Frankincense Tears (Boswellia Carterii 500g)',
        category: 'Aromatics & Natural Resins',
        merchantName: 'Puntland Natural Resins Guild',
        city: 'Mogadishu',
        priceLocal: 240000,
        priceETB: 1200,
        stockUnits: 90,
        inStock: true,
        warrantyOrOrigin: 'Harvested from coastal mountain cliffs of Sanaag & Bari regions',
      },
    ],
    events: [
      {
        id: 'ev-so-1',
        title: 'Mogadishu International Book Fair 2026',
        venueName: 'Mogadishu Youth Hub & City Hall',
        city: 'Mogadishu',
        dateString: 'August 19-21, 2026',
        expectedAttendance: 10000,
        ticketPriceLocal: 50000,
        ticketPriceETB: 250,
        organizer: 'New Horizon Somali Literary Society',
        category: 'Literature & Cultural Arts',
        permitStatus: 'Approved',
      },
    ],
    hotels: [
      {
        id: 'ht-so-1',
        name: 'Jazeera Palace Hotel Mogadishu',
        type: 'Business Hotel',
        cityOrPark: 'Mogadishu International Airport Road',
        stars: 5,
        rating: 4.89,
        nightlyRateLocal: 4500000,
        nightlyRateETB: 22500,
        roomsAvailable: 35,
        amenities: ['Secure Enclave Zone', 'Diplomatic Conference Suites', 'Fine Dining Terrace', 'Airport Escort'],
        partnerTier: 'Flagship Partner',
      },
    ],
    walletRails: [
      {
        railId: 'w-so-evc',
        operatorName: 'Hormuud EVC Plus',
        brand: 'EVC Plus Merchant Pay (*712#)',
        type: 'Mobile Money',
        settlementSpeed: 'Instant',
        feePercentage: 0.5,
        activeQrMerchants: 62000,
        dailyVolumeLocal: '$14M USD',
        dailyVolumeETB: '320,000,000',
        connectedBank: 'Central Bank of Somalia National Switch',
        apiHealth: 'healthy',
      },
    ],
    courierHubs: [
      {
        hubId: 'ch-so-1',
        hubName: 'Bakara Market & Port Express Runners',
        city: 'Mogadishu',
        activeRiders: 85,
        vehicleFleet: 'Boda-Boda (Motorcycles)',
        avgDeliveryMinutes: 25,
        baseDeliveryFeeLocal: 40000,
        baseDeliveryFeeETB: 200,
        coldChainPharmaSupport: false,
        coverageZones: ['Waberi', 'Hodan', 'Hamar Weyne', 'Liido', 'Airport Zone'],
      },
    ],
    regulatoryGates: [
      {
        id: 'rg-so-1',
        authorityAcronym: 'SBS',
        authorityName: 'Somali Bureau of Standards',
        regulationType: 'Trade & Consumer Safety Compliance',
        status: 'Compliant',
        description: 'Certified logistics safety protocols for commercial urban couriers.',
        lastAuditDate: 'October 08, 2026',
        mandatoryForPublicLaunch: true,
      },
    ],
  },
  SS: {
    countryCode: 'SS',
    countryName: 'South Sudan',
    flag: '🇸🇸',
    capital: 'Juba',
    commercialHubs: ['Juba (Tongping, Hai Malakal, Kololo, Customs)', 'Malakal', 'Wau', 'Nimule'],
    currency: 'SSP',
    currencySymbol: 'SS£',
    exchangeRateToETB: 0.096, // 1 SSP = ~0.096 ETB
    readinessOverallPercent: 82,
    standbyStages: {
      food: 'pilot_sandbox',
      marketplace: 'standby_prelaunch',
      events: 'standby_prelaunch',
      hotels: 'pilot_sandbox',
      wallet: 'public_live',
      courier: 'pilot_sandbox',
    },
    activePilotsCount: 12,
    simulatedOrdersCompleted: 490,
    foodVendors: [
      {
        id: 'fd-ss-1',
        name: 'White Nile Fish & Kisra House',
        category: 'Nile Tilapia & Traditional South Sudanese Stews',
        rating: 4.82,
        city: 'Juba',
        area: 'Hai Malakal Riverfront',
        leadTimeOrCapacity: '30-45 min delivery',
        regulatoryLicense: 'SSNBS-JB-2025-1092',
        verified: true,
        paymentMethods: ['m-GURUSH', 'Digitel Mobile Money', 'Cash'],
        sampleItems: [
          { name: 'Whole Grilled White Nile Tilapia with Kisra Flatbread', priceLocal: 6500, priceETB: 624, desc: 'Fresh river tilapia seasoned with crushed garlic, coriander, and peanut paste, served with fermented sorghum kisra' },
          { name: 'Kudra Stew with Tender Beef Shank', priceLocal: 5200, priceETB: 499, desc: 'Nutritious green jute leaf broth cooked with minced beef and sesame paste' },
          { name: 'Fresh Hibiscus Karkadeh Cooler (1L)', priceLocal: 1800, priceETB: 172, desc: 'Chilled steeped roselle petals with fresh mint and ginger' },
        ],
      },
    ],
    marketplaceProducts: [
      {
        id: 'mp-ss-1',
        title: 'Organic Pure Cold-Pressed Shea Nilotica Butter (1kg)',
        category: 'Natural Cosmetics & Superfoods',
        merchantName: 'Equatoria Forest Womens Cooperative',
        city: 'Juba',
        priceLocal: 12000,
        priceETB: 1152,
        stockUnits: 80,
        inStock: true,
        warrantyOrOrigin: 'Wild harvested Vitellaria nilotica, ultra-soft grade from Yambio forests',
      },
    ],
    events: [
      {
        id: 'ev-ss-1',
        title: 'Juba Peace Music Festival & Nile Cultural Expo',
        venueName: 'Nyakuron Cultural Center',
        city: 'Juba',
        dateString: 'December 12, 2026',
        expectedAttendance: 8000,
        ticketPriceLocal: 3500,
        ticketPriceETB: 336,
        organizer: 'South Sudan Ministry of Culture, Youth & Sports',
        category: 'Peace & Cultural Unity Concert',
        permitStatus: 'Approved',
      },
    ],
    hotels: [
      {
        id: 'ht-ss-1',
        name: 'Pyramid Continental Hotel Juba',
        type: 'Business Hotel',
        cityOrPark: 'Juba Central Ministerial District',
        stars: 5,
        rating: 4.87,
        nightlyRateLocal: 145000,
        nightlyRateETB: 13920,
        roomsAvailable: 26,
        amenities: ['Diplomatic Executive Lounge', 'Swimming Pool', 'Fitness Center', 'Secure Transport'],
        partnerTier: 'Flagship Partner',
      },
    ],
    walletRails: [
      {
        railId: 'w-ss-gurush',
        operatorName: 'm-GURUSH South Sudan',
        brand: 'm-GURUSH Mobile Money',
        type: 'Mobile Money',
        settlementSpeed: 'Instant',
        feePercentage: 1.0,
        activeQrMerchants: 12000,
        dailyVolumeLocal: 'SS£ 280M',
        dailyVolumeETB: '26,880,000',
        connectedBank: 'Bank of South Sudan Gateway',
        apiHealth: 'healthy',
      },
    ],
    courierHubs: [
      {
        hubId: 'ch-ss-1',
        hubName: 'Juba Customs & Tongping Boda Express',
        city: 'Juba',
        activeRiders: 60,
        vehicleFleet: 'Boda-Boda (Motorcycles)',
        avgDeliveryMinutes: 28,
        baseDeliveryFeeLocal: 1200,
        baseDeliveryFeeETB: 115,
        coldChainPharmaSupport: true,
        coverageZones: ['Tongping', 'Hai Malakal', 'Customs Market', 'Kololo', 'Airport Hub'],
      },
    ],
    regulatoryGates: [
      {
        id: 'rg-ss-1',
        authorityAcronym: 'SSNBS',
        authorityName: 'South Sudan National Bureau of Standards',
        regulationType: 'Quality Standards for Commercial Logistics',
        status: 'Compliant',
        description: 'Certified vehicle fitness inspection and parcel hygiene standards.',
        lastAuditDate: 'October 15, 2026',
        mandatoryForPublicLaunch: true,
      },
    ],
  },
};

export interface SimulatedCommerceOrderResult {
  orderId: string;
  vertical: CommerceVerticalKey;
  countryCode: Exclude<EastAfricaCountryCode, 'ALL'>;
  countryName: string;
  merchantOrEventName: string;
  itemsSummary: string;
  customerName: string;
  customerPhone: string;
  deliveryAddressOrSeat: string;
  amountLocal: number;
  currency: EastAfricaCurrency;
  amountETB: number;
  paymentRail: string;
  status: 'Order Placed' | 'Merchant Preparing' | 'Courier Dispatched' | 'Completed';
  createdAt: string;
  etaMinutes: number;
  parseRecordClass: string;
  driverOrCourierName?: string;
  driverVehicle?: string;
}

const SAMPLE_NAMES_BY_COUNTRY: Record<Exclude<EastAfricaCountryCode, 'ALL'>, string[]> = {
  ET: ['Almaz Hailu', 'Dawit Mekonnen', 'Rahel Kebede', 'Yared Solomon', 'Bethelhem Girma'],
  KE: ['Faith Wanjiku', 'Kevin Otieno', 'Grace Muthoni', 'Dennis Kiprop', 'Mercy Achieng'],
  UG: ['Sarah Namubiru', 'David Kintu', 'Fiona Akello', 'Patrick Byaruhanga', 'Christine Nabirye'],
  RW: ['Alice Uwimana', 'Eric Mugisha', 'Chantal Mukamana', 'Fabrice Nshimiyimana', 'Diane Uwera'],
  TZ: ['Amina Mwinyi', 'Baraka Juma', 'Fatuma Salum', 'Rashid Bakari', 'Neema Mwamburi'],
  DJ: ['Nabil Mahamoud', 'Fatouma Robleh', 'Yonis Aden', 'Khadra Houssein', 'Ismail Guelleh'],
  SO: ['Faduma Farah', 'Mohamed Warsame', 'Ayaanle Abdi', 'Hodan Shire', 'Guled Osman'],
  SS: ['Mary Nyibol', 'John Garang', 'Achol Deng', 'Peter Majok', 'Rebecca Yar'],
};

export function simulateCommerceOrder(
  countryCode: Exclude<EastAfricaCountryCode, 'ALL'>,
  vertical: CommerceVerticalKey,
  itemIndex = 0
): SimulatedCommerceOrderResult {
  const profile = EAST_AFRICA_COMMERCE_DATA[countryCode] || EAST_AFRICA_COMMERCE_DATA.ET;
  const sampleNames = SAMPLE_NAMES_BY_COUNTRY[countryCode] || SAMPLE_NAMES_BY_COUNTRY.ET;
  const customerName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
  const now = new Date();
  const orderId = `AF-${vertical.toUpperCase().slice(0, 3)}-${countryCode}-${Date.now().toString().slice(-6)}`;

  let merchantOrEventName = 'Afronala Partner';
  let itemsSummary = 'Selected commerce item';
  let amountLocal = 500;
  let deliveryAddress = `${profile.capital} Central Hub`;
  let parseRecordClass = 'CommerceOrder';

  if (vertical === 'food') {
    const vendor = profile.foodVendors[itemIndex % profile.foodVendors.length] || profile.foodVendors[0];
    const item = vendor.sampleItems[0];
    merchantOrEventName = vendor.name;
    itemsSummary = `${item.name} (${vendor.category})`;
    amountLocal = item.priceLocal;
    deliveryAddress = `${vendor.area}, ${profile.capital}`;
    parseRecordClass = 'FoodOrder';
  } else if (vertical === 'marketplace') {
    const prod = profile.marketplaceProducts[itemIndex % profile.marketplaceProducts.length] || profile.marketplaceProducts[0];
    merchantOrEventName = prod.merchantName;
    itemsSummary = `${prod.title} [1 unit]`;
    amountLocal = prod.priceLocal;
    deliveryAddress = `${prod.city} Residential Delivery`;
    parseRecordClass = 'MarketplaceOrder';
  } else if (vertical === 'events') {
    const ev = profile.events[itemIndex % profile.events.length] || profile.events[0];
    merchantOrEventName = `${ev.title} @ ${ev.venueName}`;
    itemsSummary = `1x General Access e-Ticket with encrypted QR`;
    amountLocal = ev.ticketPriceLocal;
    deliveryAddress = `${ev.venueName}, Gate B Digital Turnstile`;
    parseRecordClass = 'EventTicket';
  } else if (vertical === 'hotels') {
    const hotel = profile.hotels[itemIndex % profile.hotels.length] || profile.hotels[0];
    merchantOrEventName = hotel.name;
    itemsSummary = `1 Night Stay (${hotel.type}) - Premium Deluxe Room`;
    amountLocal = hotel.nightlyRateLocal;
    deliveryAddress = `${hotel.cityOrPark}`;
    parseRecordClass = 'HotelBooking';
  } else if (vertical === 'wallet') {
    const rail = profile.walletRails[0];
    merchantOrEventName = `${rail.brand} Merchant Settlement QR`;
    itemsSummary = `P2P Wallet Instant Transfer & Merchant Checkout`;
    amountLocal = countryCode === 'UG' || countryCode === 'TZ' ? 25000 : 850;
    deliveryAddress = `Direct-to-Wallet Instant Clearing`;
    parseRecordClass = 'WalletPaymentTransaction';
  } else {
    // courier
    const hub = profile.courierHubs[0];
    merchantOrEventName = `${hub.hubName} (${hub.vehicleFleet})`;
    itemsSummary = `Express Document & Fragile Parcel Transport`;
    amountLocal = hub.baseDeliveryFeeLocal * 2.5;
    deliveryAddress = `${hub.coverageZones[0]} -> ${hub.coverageZones[1] || profile.capital}`;
    parseRecordClass = 'CourierDeliveryOrder';
  }

  const amountETB = Math.round(amountLocal * profile.exchangeRateToETB);
  const paymentRail = profile.walletRails[0]?.brand || 'Afronala Pay';
  const courierFleet = profile.courierHubs[0];

  return {
    orderId,
    vertical,
    countryCode,
    countryName: profile.countryName,
    merchantOrEventName,
    itemsSummary,
    customerName,
    customerPhone: `+${countryCode === 'ET' ? '251' : countryCode === 'KE' ? '254' : countryCode === 'RW' ? '250' : countryCode === 'UG' ? '256' : countryCode === 'TZ' ? '255' : countryCode === 'DJ' ? '253' : countryCode === 'SO' ? '252' : '211'} 9${Math.floor(10000000 + Math.random() * 90000000)}`,
    deliveryAddressOrSeat: deliveryAddress,
    amountLocal,
    currency: profile.currency,
    amountETB,
    paymentRail,
    status: 'Merchant Preparing',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    etaMinutes: vertical === 'food' || vertical === 'courier' ? 22 : 0,
    parseRecordClass,
    driverOrCourierName: `${courierFleet?.hubName.split(' ')[0] || 'Afronala'} Runner #${Math.floor(10 + Math.random() * 89)}`,
    driverVehicle: courierFleet?.vehicleFleet || 'Boda-Boda (Motorcycle)',
  };
}

export function generateDartSdkCodeForCommerce(vertical: CommerceVerticalKey): string {
  const meta = COMMERCE_VERTICAL_SPECS[vertical];
  const className = meta.parseClasses[0];

  return `// lib/models/${meta.key}_model.dart
// Afronala SuperApp - Generated Parse Server SDK Model for ${meta.name}
// Supports multi-country East Africa scoping (ET, KE, UG, RW, TZ, DJ, SO, SS)

import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class ${className}Model extends ParseObject implements ParseCloneable {
  static const String keyTableName = '${className}';

  ${className}Model() : super(keyTableName);
  ${className}Model.clone() : this();

  @override
  ${className}Model clone(Map<String, dynamic> map) =>
      ${className}Model.clone()..fromJson(map);

  // Core Identity & Multi-Country Scoping
  String? get title => get<String>('title');
  set title(String? value) => set<String?>('title', value);

  String? get countryCode => get<String>('countryCode');
  set countryCode(String? value) => set<String?>('countryCode', value);

  String? get city => get<String>('city');
  set city(String? value) => set<String?>('city', value);

  String? get currency => get<String>('currency');
  set currency(String? value) => set<String?>('currency', value);

  // Financials
  num? get amountLocal => get<num>('amountLocal');
  set amountLocal(num? value) => set<num?>('amountLocal', value);

  num? get amountETB => get<num>('amountETB');
  set amountETB(num? value) => set<num?>('amountETB', value);

  // Operational State
  String? get status => get<String>('status');
  set status(String? value) => set<String?>('status', value);

  bool? get isVerified => get<bool>('isVerified');
  set isVerified(bool? value) => set<bool?>('isVerified', value);

  String? get paymentRail => get<String>('paymentRail');
  set paymentRail(String? value) => set<String?>('paymentRail', value);

  ParseGeoPoint? get location => get<ParseGeoPoint>('location');
  set location(ParseGeoPoint? value) => set<ParseGeoPoint?>('location', value);
}
`;
}
