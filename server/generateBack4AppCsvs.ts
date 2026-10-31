import fs from 'fs';
import path from 'path';

export const TARGET_DIR = path.resolve(process.cwd(), 'back4app_cloud_code/back4app_classes');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, any>[], columns: string[]): string {
  const header = columns.map(escapeCsv).join(',');
  const lines = rows.map((r) => columns.map((col) => escapeCsv(r[col])).join(','));
  return [header, ...lines].join('\n');
}

// Country metadata configuration for East African generation
interface CountrySeedMeta {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  phoneDial: string;
  taxLabel: string;
  taxPrefix: string;
  cities: string[];
  capitals: string;
  corridor: string;
  paymentRails: string[];
  regulator: string;
  platePrefix: string;
  sampleFirstNames: string[];
  sampleLastNames: string[];
  corporateShippers: string[];
  rideFleets: string[];
  truckCarriers: string[];
  dispatchHubs: { name: string; gateway: string; regulator: string }[];
  geoCenter: { lat: number; lon: number };
}

const EAST_AFRICA_SEEDS: Record<string, CountrySeedMeta> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    locale: 'am-ET',
    phoneDial: '+251',
    taxLabel: 'ERCA TIN',
    taxPrefix: 'TIN-00',
    cities: ['Addis Ababa (Bole)', 'Addis Ababa (CMC)', 'Modjo Dry Port', 'Kality Industrial', 'Adama', 'Hawassa'],
    capitals: 'Addis Ababa',
    corridor: 'Addis Ababa - Modjo Dry Port - Galafi Corridor',
    paymentRails: ['Telebirr', 'CBE Birr', 'CBE RTGS'],
    regulator: 'FTA / AACTB',
    platePrefix: '3-ET-',
    sampleFirstNames: ['Abebe', 'Bekele', 'Selamawit', 'Daniel', 'Tigist', 'Dawit', 'Hana', 'Yosef'],
    sampleLastNames: ['Kebede', 'Tesfaye', 'Desta', 'Ferede', 'Mengistu', 'Alemu', 'Assefa', 'Worku'],
    corporateShippers: ['Mojo Agro Industry PLC', 'Kality Steel Mills SC', 'BGI St. George Breweries', 'Ethio Agri-Commodities'],
    rideFleets: ['Abyssinia Metro Mobility SC', 'Finfinne City Cabs', 'Habesha Hybrid Fleet'],
    truckCarriers: ['ESLSE Logistics Haulage', 'Mojo Freight Express', 'Rift Valley Heavy Transit'],
    dispatchHubs: [
      { name: 'Modjo Dry Port Freight Gate 1', gateway: 'Modjo - Galafi Highway', regulator: 'FTA / Customs' },
      { name: 'Kality Heavy Terminal Dispatch', gateway: 'Addis - Adama Expressway', regulator: 'AACTB' },
    ],
    geoCenter: { lat: 9.0108, lon: 38.7613 },
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    locale: 'en-KE',
    phoneDial: '+254',
    taxLabel: 'KRA PIN',
    taxPrefix: 'P05',
    cities: ['Nairobi (Westlands)', 'Nairobi (Upper Hill)', 'Mombasa Port Terminal', 'Thika Industrial Hub', 'Nakuru', 'Eldoret'],
    capitals: 'Nairobi',
    corridor: 'Mombasa Port - Nairobi SGR - Malaba Northern Corridor',
    paymentRails: ['Safaricom M-PESA', 'KCB Bank B2B', 'Airtel Money KE'],
    regulator: 'NTSA Kenya',
    platePrefix: 'KDA-',
    sampleFirstNames: ['Brian', 'Faith', 'Kelvin', 'Amina', 'Victor', 'Mercy', 'Duncan', 'Esther'],
    sampleLastNames: ['Ochieng', 'Wanjiku', 'Mwangi', 'Kariuki', 'Otieno', 'Kamau', 'Mutua', 'Kipchirchir'],
    corporateShippers: ['Siginon Logistics East Africa', 'Bidco Africa Limited', 'Twiga Foods Kenya', 'Bamburi Cement Haulage'],
    rideFleets: ['Nairobi Executive Cabs Ltd', 'Kilimani Green Ride Co', 'Mombasa Coastal Taxis'],
    truckCarriers: ['Siginon Freight Fleet', 'Bolloré Logistics Kenya', 'Simba Heavy Carriers'],
    dispatchHubs: [
      { name: 'Mombasa Port Container Terminal 2', gateway: 'Mombasa - Nairobi SGR Link', regulator: 'KPA / NTSA' },
      { name: 'Nairobi Inland Container Depot (ICD)', gateway: 'Northern Corridor Malaba', regulator: 'KeNHA' },
    ],
    geoCenter: { lat: -1.2864, lon: 36.8172 },
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    locale: 'en-UG',
    phoneDial: '+256',
    taxLabel: 'URA TIN',
    taxPrefix: '1000',
    cities: ['Kampala (Kololo)', 'Kampala (8th Street)', 'Namanve Industrial Park', 'Entebbe', 'Jinja', 'Gulu'],
    capitals: 'Kampala',
    corridor: 'Malaba - Jinja - Kampala - Katuna Transit',
    paymentRails: ['MTN Mobile Money', 'Airtel Money Uganda', 'Stanbic Bank EFT'],
    regulator: 'MoWT / KCCA',
    platePrefix: 'UBH-',
    sampleFirstNames: ['Brenda', 'Ronald', 'Grace', 'Joseph', 'Christine', 'Patrick', 'Agnes', 'Moses'],
    sampleLastNames: ['Akello', 'Mukasa', 'Namubiru', 'Mugisha', 'Otim', 'Kato', 'Babirye', 'Okello'],
    corporateShippers: ['Mukwano Group of Companies', 'Roofings Rolling Mills Ltd', 'Kakira Sugar Logistics', 'Tororo Cement Transit'],
    rideFleets: ['Kampala Pearl Transport Ltd', 'Bugolobi Swift Drivers', 'Entebbe Airport Shuttles'],
    truckCarriers: ['Mukwano Heavy Freight Fleet', 'Transami Uganda Ltd', 'Nile Basin Logistics'],
    dispatchHubs: [
      { name: 'Malaba One-Stop Border Post (OSBP)', gateway: 'Malaba - Jinja - Kampala', regulator: 'URA / MoWT' },
      { name: 'Namanve Industrial Freight Depot', gateway: 'Kampala - Gulu Northern Link', regulator: 'UNRA' },
    ],
    geoCenter: { lat: 0.3476, lon: 32.5825 },
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'FRw',
    locale: 'rw-RW',
    phoneDial: '+250',
    taxLabel: 'RRA TIN',
    taxPrefix: '1000',
    cities: ['Kigali (Kimihurura)', 'Kigali (Masoro SEZ)', 'Masaka SEZ', 'Nyarutarama', 'Rubavu', 'Musanze'],
    capitals: 'Kigali',
    corridor: 'Rusumo OSBP - Kigali KLP - Rubavu Corridor',
    paymentRails: ['MTN MoMo Rwanda', 'Airtel Money Rwanda', 'Bank of Kigali B2B'],
    regulator: 'RURA Rwanda',
    platePrefix: 'RAC-',
    sampleFirstNames: ['Jean-Paul', 'Sandrine', 'Claude', 'Aline', 'Eric', 'Diane', 'Patrick', 'Chantal'],
    sampleLastNames: ['Nshimiyimana', 'Umutoni', 'Habimana', 'Uwase', 'Mugabo', 'Ingabire', 'Bizimana', 'Gasana'],
    corporateShippers: ['Bralirwa Breweries Rwanda', 'Inyange Industries Ltd', 'Cimerwa Cement Logistics', 'Rwanda Mountain Tea Freight'],
    rideFleets: ['Kigali Clean E-Mobility Fleet', 'Nyarugenge Green Cabs', 'Gasabo Express Rides'],
    truckCarriers: ['Kigali Logistics Platform (KLP) Fleet', 'Translink Rwanda Ltd', 'Akagera Haulage'],
    dispatchHubs: [
      { name: 'Kigali Logistics Platform (KLP Masaka)', gateway: 'Rusumo - Kigali Transit', regulator: 'RURA / RRA' },
      { name: 'Rubavu Goma Cross-Border Gate', gateway: 'Rubavu - DRC Link', regulator: 'RDB / RURA' },
    ],
    geoCenter: { lat: -1.9441, lon: 30.0619 },
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    locale: 'sw-TZ',
    phoneDial: '+255',
    taxLabel: 'TRA TIN',
    taxPrefix: '10',
    cities: ['Dar es Salaam (Masaki)', 'Port of Dar (Kurasini)', 'Dar Industrial Area', 'Arusha Clocktower', 'Dodoma', 'Mwanza'],
    capitals: 'Dodoma',
    corridor: 'Port of Dar es Salaam - Morogoro - Dodoma - Isaka',
    paymentRails: ['Vodacom M-Pesa', 'Tigo Pesa', 'CRDB Bank RTGS'],
    regulator: 'LATRA Tanzania',
    platePrefix: 'T-',
    sampleFirstNames: ['Juma', 'Neema', 'Rashidi', 'Mwajuma', 'Baraka', 'Asha', 'Daudi', 'Zainab'],
    sampleLastNames: ['Mkwawa', 'Kimaro', 'Bakari', 'Rashid', 'Massawe', 'Mollel', 'Shabani', 'Kassim'],
    corporateShippers: ['Bakhresa Group (Azam Logistics)', 'MeTL Group (Mohammed Enterprises)', 'Kilombero Sugar Logistics', 'Twiga Cement Freight'],
    rideFleets: ['Kilimanjaro City Transfers Ltd', 'Dar Safari Cabs', 'Arusha Clocktower Fleet'],
    truckCarriers: ['Azam Freight Logistics', 'Bolloré Africa Logistics TZ', 'Superdoll Heavy Trailers'],
    dispatchHubs: [
      { name: 'Port of Dar es Salaam Kurasini Gate', gateway: 'Dar - Morogoro - Dodoma - Isaka', regulator: 'TPA / LATRA' },
      { name: 'Isaka Inland Container Terminal', gateway: 'Central Corridor to Rwanda/Burundi', regulator: 'TANROADS' },
    ],
    geoCenter: { lat: -6.7924, lon: 39.2083 },
  },
  DJ: {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF',
    currencySymbol: 'Fdj',
    locale: 'fr-DJ',
    phoneDial: '+253',
    taxLabel: 'DPFZA / NIF',
    taxPrefix: 'NIF-00',
    cities: ['Djibouti City (Plateau)', 'Doraleh Port (PK12)', 'Djibouti City (Haramous)', 'Venise Road Depot', 'Galafi'],
    capitals: 'Djibouti City',
    corridor: 'Doraleh Port (DMP) - PK12 - Galafi Border Highway',
    paymentRails: ['D-Money (Djibouti Telecom)', 'BCIMR Bank', 'CAC Bank'],
    regulator: 'DTT / DPFZA',
    platePrefix: 'DJ-',
    sampleFirstNames: ['Ahmed', 'Mouna', 'Yassin', 'Amina', 'Ismael', 'Fatouma', 'Hassan', 'Khadra'],
    sampleLastNames: ['Farah', 'Abdillahi', 'Daoud', 'Kamil', 'Robleh', 'Wais', 'Aden', 'Omar'],
    corporateShippers: ['Doraleh Multipurpose Port (DMP Logistics)', 'Massida Logistics Djibouti', 'Société Djiboutienne de Transit (SDT)', 'Red Sea Clinker Cargo'],
    rideFleets: ['Mer Rouge Taxis & Navettes', 'Plateau City Mobility', 'Haramous Diplomatic Shuttles'],
    truckCarriers: ['Massida Transit & Shipping', 'DMP Port Drayage Heavy Fleet', 'Galafi Highway Carriers'],
    dispatchHubs: [
      { name: 'Doraleh Multipurpose Port (DMP PK12)', gateway: 'PK12 - Galafi Border Highway', regulator: 'DPFZA / DTT' },
      { name: 'Galafi Customs Freight Terminal', gateway: 'Galafi - Ethiopia Corridors', regulator: 'Douanes Djibouti' },
    ],
    geoCenter: { lat: 11.5721, lon: 43.1456 },
  },
  SO: {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'so-SO',
    phoneDial: '+252',
    taxLabel: 'MoF TIN',
    taxPrefix: 'SO-',
    cities: ['Mogadishu (KM4 / Waberi)', 'Mogadishu (Bakara Market)', 'Mogadishu Port Marine Terminal', 'Hodan', 'Berbera'],
    capitals: 'Mogadishu',
    corridor: 'Mogadishu Port - Afgooye - Baidoa / Berbera Link',
    paymentRails: ['Hormuud EVC Plus', 'Telesom Zaad', 'Premier Bank'],
    regulator: 'MOTCA / BRA',
    platePrefix: 'SO-MOG-',
    sampleFirstNames: ['Khadar', 'Fadumo', 'Hassan', 'Sahra', 'Abdi', 'Marian', 'Warsame', 'Hibo'],
    sampleLastNames: ['Guled', 'Omar', 'Jama', 'Farah', 'Ali', 'Dualeh', 'Egal', 'Yusuf'],
    corporateShippers: ['Hormuud Telecom Logistics', 'Beco Power Shippers', 'SomCable Fiber Logistics', 'Dahabshiil Commercial Freight'],
    rideFleets: ['Banadir City Mobility Ltd', 'Mogadishu Airport Cabs', 'Hodan Metro Express'],
    truckCarriers: ['Hormuud Heavy Logistics', 'Somali Cargo Haulers', 'Berbera Port Drayage'],
    dispatchHubs: [
      { name: 'Mogadishu Port Marine Terminal', gateway: 'Mogadishu - Afgooye Highway', regulator: 'MOTCA' },
      { name: 'Berbera Port Corridor Dispatch', gateway: 'Berbera - Hargeisa - Tog Wajaale', regulator: 'DP World Berbera' },
    ],
    geoCenter: { lat: 2.0469, lon: 45.3182 },
  },
  SS: {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    currency: 'SSP',
    currencySymbol: 'SS£',
    locale: 'en-SS',
    phoneDial: '+211',
    taxLabel: 'NRA TIN',
    taxPrefix: 'SS-',
    cities: ['Juba (Hai Cinema)', 'Juba (Gumbo Customs)', 'Juba (Nesitu Depot)', 'Juba River Port (Konyo Konyo)', 'Nimule'],
    capitals: 'Juba',
    corridor: 'Nimule Border Post - Juba River Port Gateway',
    paymentRails: ['m-GURUSH Mobile Money', 'Ecobank South Sudan', 'Stanbic Juba'],
    regulator: 'MoTR Juba',
    platePrefix: 'SSD-',
    sampleFirstNames: ['Deng', 'Nyandeng', 'Peter', 'Achol', 'Bol', 'Mary', 'John', 'Ayak'],
    sampleLastNames: ['Garang', 'Malual', 'Deng', 'Kuol', 'Majok', 'Akol', 'Lual', 'Mayen'],
    corporateShippers: ['Trinity Energy South Sudan', 'Rhino Star Logistics Juba', 'White Nile Grain Freight', 'Juba Petrochem Haulage'],
    rideFleets: ['Equatoria Shuttles & Transport', 'Juba River City Cabs', 'Tongping Diplomatic Fleet'],
    truckCarriers: ['Trinity Tanker Transporters', 'Rhino Star Heavy Freight', 'Nile River Barge Transit'],
    dispatchHubs: [
      { name: 'Nimule Border Post Customs Yard', gateway: 'Nimule - Juba Highway', regulator: 'NRA / MoTR' },
      { name: 'Juba River Port Freight Gate', gateway: 'White Nile River Transit', regulator: 'River Transport Auth' },
    ],
    geoCenter: { lat: 4.8594, lon: 31.5713 },
  },
};

const COUNTRY_CODES = ['ET', 'KE', 'UG', 'RW', 'TZ', 'DJ', 'SO', 'SS'];

export function generateAllBack4AppCsvs(): { totalClasses: number; totalRecords: number } {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // -----------------------------------------------------------------------------
  // 1. Generate _User.csv (96 records, 34 columns across all 8 nations)
  // -----------------------------------------------------------------------------
  const userColumns = [
    'objectId', 'username', 'email', 'phone', 'emailVerified', 'phoneVerified',
    'activeRole', 'roleCodes', 'countryCode', 'roleData', 'firstName', 'lastName',
    'avatarUrl', 'locale', 'nationalId', 'status', 'lastLoginAt', 'devicePlatform',
    'fcmToken', 'emergencyContactName', 'emergencyContactPhone', 'rating', 'loyaltyPoints',
    'twoFactorEnabled', 'isSuspended', 'suspendedReason', 'walletBalanceETB', 'identityTier',
    'kycStatus', 'createdAt', 'updatedAt', 'ACL', 'signupSource', 'referralCode'
  ];

  const users: Record<string, any>[] = [];
  let userIdx = 0;

  for (let cycle = 0; cycle < 12; cycle++) {
    for (const cCode of COUNTRY_CODES) {
      userIdx++;
      const cSeed = EAST_AFRICA_SEEDS[cCode];
      const fn = cSeed.sampleFirstNames[(userIdx - 1) % cSeed.sampleFirstNames.length];
      const ln = cSeed.sampleLastNames[(userIdx - 1) % cSeed.sampleLastNames.length];
      const objId = `usr_${String(userIdx).padStart(4, '0')}`;
      const phoneDigits = String(100000 + userIdx * 713).slice(0, 6);
      const phone = `${cSeed.phoneDial}${cCode === 'ET' ? '911' : '712'}${phoneDigits}`;

      let roleCodes: string[];
      let activeRole: string;
      if (userIdx % 8 === 1) {
        roleCodes = ['customer', 'driver', 'rideOwner'];
        activeRole = 'rideOwner';
      } else if (userIdx % 8 === 2 || userIdx % 8 === 3) {
        roleCodes = ['customer', 'driver'];
        activeRole = 'driver';
      } else if (userIdx % 8 === 4) {
        roleCodes = ['customer', 'truckOwner'];
        activeRole = 'truckOwner';
      } else if (userIdx % 8 === 5) {
        roleCodes = ['customer', 'truckDispatcher'];
        activeRole = 'truckDispatcher';
      } else {
        roleCodes = ['customer'];
        activeRole = 'customer';
      }

      const roleData = {
        country: cSeed.name,
        currency: cSeed.currency,
        customer: { points: 200 + userIdx * 20, tier: userIdx > 40 ? 'Gold' : 'Silver' },
        driver: roleCodes.includes('driver') ? { rating: 4.8, trips: 140 + userIdx * 12 } : undefined,
        rideOwner: roleCodes.includes('rideOwner') ? { fleetSize: 3 + (userIdx % 4) } : undefined,
        truckOwner: roleCodes.includes('truckOwner') ? { dotVerified: true } : undefined,
        dispatcher: roleCodes.includes('truckDispatcher') ? { assignedHub: cSeed.dispatchHubs[0].name } : undefined,
      };

      const isSuspended = userIdx === 18;

      users.push({
        objectId: objId,
        username: `${fn.toLowerCase()}.${ln.toLowerCase()}${userIdx}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@afronala.${cCode.toLowerCase()}`,
        phone: phone,
        emailVerified: userIdx % 4 !== 0,
        phoneVerified: true,
        activeRole: activeRole,
        roleCodes: JSON.stringify(roleCodes),
        countryCode: cCode,
        roleData: JSON.stringify(roleData),
        firstName: fn,
        lastName: ln,
        avatarUrl: `/assets/avatars/user_${(userIdx % 12) + 1}.jpg`,
        locale: cSeed.locale,
        nationalId: `${cCode}-NID-${String(10000 + userIdx)}`,
        status: isSuspended ? 'suspended' : 'active',
        lastLoginAt: new Date(Date.now() - (userIdx * 1800000 + 45000)).toISOString(),
        devicePlatform: userIdx % 3 === 0 ? 'iOS' : 'Android',
        fcmToken: `fcm_token_${objId}_${cCode.toLowerCase()}`,
        emergencyContactName: `${fn} Kin`,
        emergencyContactPhone: `${cSeed.phoneDial}799${String(200000 + userIdx * 331).slice(0, 6)}`,
        rating: (4.4 + (userIdx % 6) * 0.1).toFixed(1),
        loyaltyPoints: 150 + userIdx * 30,
        twoFactorEnabled: userIdx % 2 === 0,
        isSuspended: isSuspended,
        suspendedReason: isSuspended ? `Document renewal pending under ${cSeed.regulator}` : '',
        walletBalanceETB: (800 + userIdx * 150.25).toFixed(2),
        identityTier: userIdx % 4 === 0 ? 'Tier3_Enterprise' : userIdx % 2 === 0 ? 'Tier2_Verified' : 'Tier1_Basic',
        kycStatus: isSuspended ? 'rejected' : 'verified',
        createdAt: new Date(Date.now() - (100 - userIdx) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (userIdx * 90000)).toISOString(),
        ACL: JSON.stringify({ "*": { "read": true }, [objId]: { "read": true, "write": true } }),
        signupSource: userIdx % 3 === 0 ? 'mobile_referral' : 'direct_organic',
        referralCode: `AFR-${cCode}-${fn.slice(0, 3).toUpperCase()}${userIdx}`
      });
    }
  }

  // -----------------------------------------------------------------------------
  // 2. Generate Customer.csv (96 records, 47 columns across all 8 nations)
  // -----------------------------------------------------------------------------
  const customerColumns = [
    'objectId', 'user', 'customerId', 'fullName', 'email', 'phone', 'customerType',
    'paymentMethod', 'defaultCurrency', 'creditLimitETB', 'taxId', 'businessName',
    'billingAddress', 'city', 'country', 'countryCode', 'totalOrders', 'totalSpentETB', 'rating',
    'loyaltyPoints', 'loyaltyTier', 'discountCode', 'preferredVehicleType', 'emergencyContact',
    'specialInstructions', 'isVerified', 'status', 'notes', 'lastBookingAt',
    'assignedAccountManager', 'allowCorporateBilling', 'creditBalanceETB', 'cancellationRate',
    'avgRatingGiven', 'favoritePickups', 'favoriteDropoffs', 'language', 'pushEnabled',
    'smsEnabled', 'emailEnabled', 'avatar', 'tags', 'customMetadata', 'signupChannel',
    'lastActiveAt', 'createdAt', 'updatedAt', 'ACL'
  ];

  const customers: Record<string, any>[] = [];
  for (let i = 1; i <= 96; i++) {
    const userRef = users[i - 1];
    const cCode = userRef.countryCode;
    const cSeed = EAST_AFRICA_SEEDS[cCode];
    const isCorp = i % 4 === 0;
    const objId = `cst_${String(i).padStart(4, '0')}`;
    const corpName = cSeed.corporateShippers[(i - 1) % cSeed.corporateShippers.length];
    const cName = isCorp ? corpName : `${userRef.firstName} ${userRef.lastName}`;
    const city = cSeed.cities[(i - 1) % cSeed.cities.length];
    const pMethod = isCorp ? 'corporate_invoice' : cSeed.paymentRails[0].toLowerCase().replace(/\s+/g, '_');

    customers.push({
      objectId: objId,
      user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
      customerId: `CUST-${cCode}-${1000 + i}`,
      fullName: cName,
      email: userRef.email,
      phone: userRef.phone,
      customerType: isCorp ? 'corporate' : 'individual',
      paymentMethod: pMethod,
      defaultCurrency: cSeed.currency,
      creditLimitETB: isCorp ? 350000 : 0,
      taxId: isCorp ? `${cSeed.taxPrefix}${40000 + i}` : '',
      businessName: isCorp ? cName : '',
      billingAddress: isCorp ? `${city}, Logistics Zone` : `${city}, Sector 4`,
      city: city,
      country: cSeed.name,
      countryCode: cCode,
      totalOrders: 18 + i * 2,
      totalSpentETB: (5400 + i * 820.5).toFixed(2),
      rating: (4.5 + (i % 5) * 0.1).toFixed(1),
      loyaltyPoints: 320 + i * 35,
      loyaltyTier: i > 60 ? 'Platinum' : i > 25 ? 'Gold' : 'Silver',
      discountCode: i % 4 === 0 ? `AFRO_${cCode}_15` : '',
      preferredVehicleType: isCorp ? 'Heavy Cargo Truck (25T)' : i % 2 === 0 ? 'Sedan Economy' : 'Executive SUV',
      emergencyContact: userRef.emergencyContactPhone,
      specialInstructions: isCorp ? `Requires ${cSeed.regulator} certified electronic gate clearance` : 'Call on arrival at reception gate',
      isVerified: true,
      status: i === 22 ? 'suspended' : 'active',
      notes: isCorp ? `Enterprise contracted freight client along ${cSeed.corridor}` : `Verified SuperApp customer in ${city}`,
      lastBookingAt: new Date(Date.now() - (i * 3600000)).toISOString(),
      assignedAccountManager: isCorp ? 'Regional Operations Desk' : 'Automated Dispatch',
      allowCorporateBilling: isCorp,
      creditBalanceETB: isCorp ? 95000.0 : 0,
      cancellationRate: (0.01 + (i % 4) * 0.01).toFixed(2),
      avgRatingGiven: '4.8',
      favoritePickups: JSON.stringify([`${city} Central Interchange`, `${cSeed.capitals} Airport`, `${city} Port`]),
      favoriteDropoffs: JSON.stringify([`${cSeed.dispatchHubs[0].name}`, `${city} Logistics Depots`]),
      language: cSeed.locale.slice(0, 2),
      pushEnabled: true,
      smsEnabled: true,
      emailEnabled: true,
      avatar: userRef.avatarUrl,
      tags: JSON.stringify(isCorp ? ['freight_shipper', 'corporate', cCode] : ['rider', cCode]),
      customMetadata: JSON.stringify({ countryCode: cCode, regulatoryAgency: cSeed.regulator, primaryPaymentRail: cSeed.paymentRails[0] }),
      signupChannel: 'mobile_app',
      lastActiveAt: new Date(Date.now() - (i * 120000)).toISOString(),
      createdAt: new Date(Date.now() - (120 - i) * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - (i * 180000)).toISOString(),
      ACL: JSON.stringify({ "*": { "read": true }, [userRef.objectId]: { "read": true, "write": true } })
    });
  }

  // -----------------------------------------------------------------------------
  // 3. Generate Driver.csv (24 records across all 8 nations, 3 per country)
  // -----------------------------------------------------------------------------
  const driverColumns = [
    'objectId', 'user', 'driverId', 'name', 'phone', 'email', 'activeServiceMode',
    'status', 'onlineStatus', 'currentLocation', 'lastLocationUpdate', 'currentSpeedKmh',
    'headingDeg', 'vehicleModel', 'vehiclePlate', 'vehicleYear', 'vehicleColor',
    'assignedTruckIds', 'truckOwnerId', 'licenseNumber', 'licenseExpiryDate', 'cdlType',
    'nationalId', 'emergencyContact', 'rating', 'totalTripsCompleted', 'earningsTotalETB',
    'earningsTodayETB', 'acceptanceRate', 'cancellationRate', 'workingHoursToday',
    'todayDistanceKm', 'bankName', 'bankAccountName', 'bankAccountNumber', 'payoutMethod',
    'telebirrPhone', 'cbeBirrAccount', 'chapaMerchantId', 'currentShiftStartedAt',
    'safetyScore', 'documentsVerified', 'backgroundCheckPassed', 'medicalCertificateValid',
    'fleetBindingType', 'operatingCity', 'operatingCountry', 'countryCode', 'operatingZone', 'shiftStatus', 'maxPayloadTonnes',
    'preferredCargoTypes', 'isAvailableForBidding', 'currentTripId', 'currentShipmentId',
    'lastInspectionDate', 'speedGovernorInstalled', 'fuelCardNumber', 'telemetryDeviceId',
    'createdAt', 'updatedAt', 'ACL'
  ];

  const vehicleModels = [
    'Toyota Vitz', 'Hyundai Accent', 'Toyota Corolla', 'Isuzu FSR Cargo (10T)',
    'Sinotruk Howo Tipper (25T)', 'Scania G400 Heavy Freight', 'Toyota HiAce Electric Minibus', 'FAW Heavy Flatbed (40T)'
  ];

  const drivers: Record<string, any>[] = [];
  let drvIdx = 0;

  for (const cCode of COUNTRY_CODES) {
    const cSeed = EAST_AFRICA_SEEDS[cCode];
    for (let d = 1; d <= 3; d++) {
      drvIdx++;
      const userRef = users[drvIdx + 10];
      const isTruck = d >= 2;
      const objId = `drv_${String(drvIdx).padStart(4, '0')}`;
      const latOffset = (d - 2) * 0.025;
      const lonOffset = (d - 2) * 0.035;

      drivers.push({
        objectId: objId,
        user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
        driverId: `DRV-${cCode}-${2000 + drvIdx}`,
        name: `${userRef.firstName} ${userRef.lastName}`,
        phone: userRef.phone,
        email: userRef.email,
        activeServiceMode: isTruck ? 'truck' : 'ride',
        status: drvIdx === 7 ? 'pending_verification' : drvIdx === 19 ? 'offline' : 'active',
        onlineStatus: drvIdx === 19 ? 'offline' : 'online',
        currentLocation: JSON.stringify({
          __type: 'GeoPoint',
          latitude: Number((cSeed.geoCenter.lat + latOffset).toFixed(4)),
          longitude: Number((cSeed.geoCenter.lon + lonOffset).toFixed(4)),
        }),
        lastLocationUpdate: new Date(Date.now() - (drvIdx * 25000)).toISOString(),
        currentSpeedKmh: drvIdx === 19 ? 0 : 28 + (drvIdx * 3) % 40,
        headingDeg: (drvIdx * 45) % 360,
        vehicleModel: vehicleModels[(drvIdx - 1) % vehicleModels.length],
        vehiclePlate: `${cSeed.platePrefix}${1000 + drvIdx}`,
        vehicleYear: 2021 + (drvIdx % 4),
        vehicleColor: isTruck ? 'White / Heavy Yellow' : 'Silver Metallic',
        assignedTruckIds: isTruck ? JSON.stringify([`trk_veh_${cCode.toLowerCase()}_${String(drvIdx).padStart(3, '0')}`]) : '[]',
        truckOwnerId: isTruck ? `to_${cCode.toLowerCase()}_${String((drvIdx % 3) + 1).padStart(2, '0')}` : '',
        licenseNumber: `${cCode}-CDL-${30000 + drvIdx}`,
        licenseExpiryDate: '2028-12-31',
        cdlType: isTruck ? 'Class A (Heavy Articulated)' : 'Class B (Commercial Passenger)',
        nationalId: `${cCode}-NID-${40000 + drvIdx}`,
        emergencyContact: userRef.emergencyContactPhone,
        rating: (4.6 + (drvIdx % 4) * 0.1).toFixed(1),
        totalTripsCompleted: 85 + drvIdx * 18,
        earningsTotalETB: (48000 + drvIdx * 4500).toFixed(2),
        earningsTodayETB: (1450 + drvIdx * 110).toFixed(2),
        acceptanceRate: '0.94',
        cancellationRate: '0.02',
        workingHoursToday: '6.5',
        todayDistanceKm: (75 + drvIdx * 8).toFixed(1),
        bankName: cSeed.paymentRails[cSeed.paymentRails.length - 1] || 'National Commercial Bank',
        bankAccountName: `${userRef.firstName} ${userRef.lastName}`,
        bankAccountNumber: `ACC-${cCode}-${100000 + drvIdx * 89}`,
        payoutMethod: cSeed.paymentRails[0],
        telebirrPhone: cCode === 'ET' ? userRef.phone : '',
        cbeBirrAccount: cCode === 'ET' ? `1000${String(drvIdx).padStart(4, '0')}` : '',
        chapaMerchantId: `chapa_${cCode.toLowerCase()}_${objId}`,
        currentShiftStartedAt: new Date(Date.now() - (6.5 * 3600000)).toISOString(),
        safetyScore: '98',
        documentsVerified: true,
        backgroundCheckPassed: true,
        medicalCertificateValid: true,
        fleetBindingType: isTruck ? 'contractor' : 'independent',
        operatingCity: cSeed.cities[drvIdx % cSeed.cities.length],
        operatingCountry: cSeed.name,
        countryCode: cCode,
        operatingZone: `${cSeed.name} Central Transit Zone`,
        shiftStatus: 'active',
        maxPayloadTonnes: isTruck ? 25 : 0.8,
        preferredCargoTypes: isTruck ? 'Containerized Freight, Dry Bulk, FMCG' : 'Passenger Luggage',
        isAvailableForBidding: isTruck,
        currentTripId: isTruck ? '' : `TRP-${cCode}-${8000 + drvIdx}`,
        currentShipmentId: isTruck ? `SHP-${cCode}-${9000 + drvIdx}` : '',
        lastInspectionDate: '2025-01-15',
        speedGovernorInstalled: true,
        fuelCardNumber: `FC-${cCode}-${10000 + drvIdx}`,
        telemetryDeviceId: `GPS-TEL-${cCode}-${objId}`,
        createdAt: new Date(Date.now() - (150 - drvIdx) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (drvIdx * 45000)).toISOString(),
        ACL: JSON.stringify({ "*": { "read": true }, [userRef.objectId]: { "read": true, "write": true } })
      });
    }
  }

  // -----------------------------------------------------------------------------
  // 4. Generate RideOwner.csv (16 records across all 8 nations, 2 per country)
  // -----------------------------------------------------------------------------
  const rideOwnerColumns = [
    'objectId', 'user', 'ownerId', 'ownerName', 'businessName', 'taxId',
    'phone', 'email', 'countryCode', 'countryName', 'operatingCity', 'operatingLicense',
    'fleetSize', 'activeVehicles', 'commissionPlan', 'currency', 'totalFleetEarningsETB',
    'payoutMethod', 'bankName', 'bankAccountNumber', 'status', 'joinedDate',
    'createdAt', 'updatedAt', 'ACL'
  ];

  const rideOwners: Record<string, any>[] = [];
  let roIdx = 0;

  for (const cCode of COUNTRY_CODES) {
    const cSeed = EAST_AFRICA_SEEDS[cCode];
    for (let r = 1; r <= 2; r++) {
      roIdx++;
      const userRef = users[roIdx * 4];
      const objId = `ro_${cCode.toLowerCase()}_${String(r).padStart(2, '0')}`;
      const bName = cSeed.rideFleets[(r - 1) % cSeed.rideFleets.length];

      rideOwners.push({
        objectId: objId,
        user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
        ownerId: `RO-${cCode}-${100 + roIdx}`,
        ownerName: `${userRef.firstName} ${userRef.lastName}`,
        businessName: bName,
        taxId: `${cSeed.taxPrefix}${50000 + roIdx}`,
        phone: userRef.phone,
        email: `fleet@${bName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.${cCode.toLowerCase()}`,
        countryCode: cCode,
        countryName: cSeed.name,
        operatingCity: cSeed.capitals,
        operatingLicense: `${cSeed.regulator}-RO-${2024}-${roIdx}`,
        fleetSize: 12 + r * 6,
        activeVehicles: 10 + r * 5,
        commissionPlan: cCode === 'KE' ? '90/10 NTSA Cap' : '85/15 Standard',
        currency: cSeed.currency,
        totalFleetEarningsETB: (450000 + roIdx * 85000).toFixed(2),
        payoutMethod: cSeed.paymentRails[0],
        bankName: cSeed.paymentRails[cSeed.paymentRails.length - 1],
        bankAccountNumber: `RO-ACC-${cCode}-${1000 + roIdx}`,
        status: 'active',
        joinedDate: `Q${(roIdx % 4) + 1} 2024`,
        createdAt: new Date(Date.now() - (180 - roIdx) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (roIdx * 120000)).toISOString(),
        ACL: JSON.stringify({ "*": { "read": true }, [userRef.objectId]: { "read": true, "write": true } })
      });
    }
  }

  // -----------------------------------------------------------------------------
  // 5. Generate RideDriver.csv (24 contractor agreements linking drivers & owners)
  // -----------------------------------------------------------------------------
  const rideDriverColumns = [
    'objectId', 'driver', 'driverId', 'rideOwner', 'rideOwnerId', 'countryCode',
    'countryName', 'contractType', 'commissionSplitPct', 'vehiclePlate', 'dailyLeaseRateLocal',
    'currency', 'licenseVerified', 'contractStatus', 'startedAt', 'expiresAt',
    'createdAt', 'updatedAt', 'ACL'
  ];

  const rideDrivers: Record<string, any>[] = [];
  for (let i = 0; i < drivers.length; i++) {
    const drv = drivers[i];
    const cCode = drv.countryCode;
    const cSeed = EAST_AFRICA_SEEDS[cCode];
    const matchingRo = rideOwners.find((ro) => ro.countryCode === cCode) || rideOwners[0];
    const objId = `rd_${cCode.toLowerCase()}_${String(i + 1).padStart(2, '0')}`;

    rideDrivers.push({
      objectId: objId,
      driver: JSON.stringify({ __type: 'Pointer', className: 'Driver', objectId: drv.objectId }),
      driverId: drv.driverId,
      rideOwner: JSON.stringify({ __type: 'Pointer', className: 'RideOwner', objectId: matchingRo.objectId }),
      rideOwnerId: matchingRo.ownerId,
      countryCode: cCode,
      countryName: cSeed.name,
      contractType: i % 2 === 0 ? 'Revenue Share' : 'Daily Vehicle Lease',
      commissionSplitPct: cCode === 'KE' ? 10 : 15,
      vehiclePlate: drv.vehiclePlate,
      dailyLeaseRateLocal: cCode === 'KE' ? 1500 : cCode === 'UG' ? 45000 : cCode === 'RW' ? 12000 : 800,
      currency: cSeed.currency,
      licenseVerified: true,
      contractStatus: 'active',
      startedAt: '2024-06-01T00:00:00.000Z',
      expiresAt: '2027-06-01T00:00:00.000Z',
      createdAt: new Date(Date.now() - (120 - i) * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - (i * 90000)).toISOString(),
      ACL: JSON.stringify({ "*": { "read": true } })
    });
  }

  // -----------------------------------------------------------------------------
  // 6. Generate TruckDispatcher.csv (16 dispatchers across all 8 nations, 2 per country)
  // -----------------------------------------------------------------------------
  const truckDispatcherColumns = [
    'objectId', 'user', 'dispatcherId', 'fullName', 'phone', 'email', 'countryCode',
    'countryName', 'operatingStation', 'gatewayHub', 'assignedCorridor', 'regulatorAuthority',
    'clearanceLevel', 'activeManifests', 'totalDispatchesSupervised', 'status',
    'createdAt', 'updatedAt', 'ACL'
  ];

  const truckDispatchers: Record<string, any>[] = [];
  let tdIdx = 0;

  for (const cCode of COUNTRY_CODES) {
    const cSeed = EAST_AFRICA_SEEDS[cCode];
    for (let d = 0; d < 2; d++) {
      tdIdx++;
      const userRef = users[tdIdx * 5];
      const hub = cSeed.dispatchHubs[d % cSeed.dispatchHubs.length];
      const objId = `td_${cCode.toLowerCase()}_${String(d + 1).padStart(2, '0')}`;

      truckDispatchers.push({
        objectId: objId,
        user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
        dispatcherId: `DISP-${cCode}-${500 + tdIdx}`,
        fullName: `${userRef.firstName} ${userRef.lastName}`,
        phone: userRef.phone,
        email: `dispatch.${cCode.toLowerCase()}${d + 1}@afronala.com`,
        countryCode: cCode,
        countryName: cSeed.name,
        operatingStation: hub.name,
        gatewayHub: hub.gateway,
        assignedCorridor: cSeed.corridor,
        regulatorAuthority: hub.regulator,
        clearanceLevel: d === 0 ? 'Senior Corridor Chief' : 'Transit Manifest Controller',
        activeManifests: 14 + tdIdx * 3,
        totalDispatchesSupervised: 380 + tdIdx * 65,
        status: 'active',
        createdAt: new Date(Date.now() - (160 - tdIdx) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (tdIdx * 110000)).toISOString(),
        ACL: JSON.stringify({ "*": { "read": true } })
      });
    }
  }

  // -----------------------------------------------------------------------------
  // 7. Generate TruckOwner.csv (16 carriers across all 8 nations, 2 per country)
  // -----------------------------------------------------------------------------
  const truckOwnerColumns = [
    'objectId', 'user', 'truckOwnerId', 'carrierName', 'companyTin', 'dotMcPermit',
    'phone', 'email', 'countryCode', 'countryName', 'headquartersCity', 'corridorsServed',
    'fleetSize', 'activeHaulers', 'insurancePolicyNumber', 'paymentRail', 'currency',
    'totalFreightBilledETB', 'status', 'createdAt', 'updatedAt', 'ACL'
  ];

  const truckOwners: Record<string, any>[] = [];
  let toIdx = 0;

  for (const cCode of COUNTRY_CODES) {
    const cSeed = EAST_AFRICA_SEEDS[cCode];
    for (let t = 1; t <= 2; t++) {
      toIdx++;
      const userRef = users[toIdx * 3];
      const cName = cSeed.truckCarriers[(t - 1) % cSeed.truckCarriers.length];
      const objId = `to_${cCode.toLowerCase()}_${String(t).padStart(2, '0')}`;

      truckOwners.push({
        objectId: objId,
        user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
        truckOwnerId: `TO-${cCode}-${300 + toIdx}`,
        carrierName: cName,
        companyTin: `${cSeed.taxPrefix}${60000 + toIdx}`,
        dotMcPermit: `${cSeed.regulator}-CARRIER-${2024}-${toIdx}`,
        phone: userRef.phone,
        email: `logistics@${cName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.${cCode.toLowerCase()}`,
        countryCode: cCode,
        countryName: cSeed.name,
        headquartersCity: cSeed.cities[0],
        corridorsServed: cSeed.corridor,
        fleetSize: 18 + t * 14,
        activeHaulers: 15 + t * 12,
        insurancePolicyNumber: `EAC-TRANSIT-INS-${cCode}-${8000 + toIdx}`,
        paymentRail: cSeed.paymentRails[0],
        currency: cSeed.currency,
        totalFreightBilledETB: (1850000 + toIdx * 450000).toFixed(2),
        status: 'active',
        createdAt: new Date(Date.now() - (190 - toIdx) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (toIdx * 80000)).toISOString(),
        ACL: JSON.stringify({ "*": { "read": true }, [userRef.objectId]: { "read": true, "write": true } })
      });
    }
  }

  // Write all 7 CSV files to TARGET_DIR
  fs.writeFileSync(path.join(TARGET_DIR, '_User.csv'), toCsv(users, userColumns), 'utf8');
  fs.writeFileSync(path.join(TARGET_DIR, 'Customer.csv'), toCsv(customers, customerColumns), 'utf8');
  fs.writeFileSync(path.join(TARGET_DIR, 'Driver.csv'), toCsv(drivers, driverColumns), 'utf8');
  fs.writeFileSync(path.join(TARGET_DIR, 'RideOwner.csv'), toCsv(rideOwners, rideOwnerColumns), 'utf8');
  fs.writeFileSync(path.join(TARGET_DIR, 'RideDriver.csv'), toCsv(rideDrivers, rideDriverColumns), 'utf8');
  fs.writeFileSync(path.join(TARGET_DIR, 'TruckDispatcher.csv'), toCsv(truckDispatchers, truckDispatcherColumns), 'utf8');
  fs.writeFileSync(path.join(TARGET_DIR, 'TruckOwner.csv'), toCsv(truckOwners, truckOwnerColumns), 'utf8');

  const totalRecords = users.length + customers.length + drivers.length + rideOwners.length + rideDrivers.length + truckDispatchers.length + truckOwners.length;
  console.log(`[Back4App Generator] Wrote 7 East African classes (${totalRecords} total records) to ${TARGET_DIR}`);

  return {
    totalClasses: 7,
    totalRecords,
  };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('generateBack4AppCsvs.ts')) {
  generateAllBack4AppCsvs();
}
