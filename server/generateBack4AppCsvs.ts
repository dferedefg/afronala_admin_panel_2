import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.resolve(process.cwd(), 'back4app_cloud_code/back4app_classes');

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

// -----------------------------------------------------------------------------
// 1. Generate _User.csv (90 records, 34 columns)
// -----------------------------------------------------------------------------
const userColumns = [
  'objectId', 'username', 'email', 'phone', 'emailVerified', 'phoneVerified',
  'activeRole', 'roleCodes', 'countryCode', 'roleData', 'firstName', 'lastName',
  'avatarUrl', 'locale', 'nationalId', 'status', 'lastLoginAt', 'devicePlatform',
  'fcmToken', 'emergencyContactName', 'emergencyContactPhone', 'rating', 'loyaltyPoints',
  'twoFactorEnabled', 'isSuspended', 'suspendedReason', 'walletBalanceETB', 'identityTier',
  'kycStatus', 'createdAt', 'updatedAt', 'ACL', 'signupSource', 'referralCode'
];

const firstNames = ['Abebe', 'Bekele', 'Selamawit', 'Daniel', 'Almaz', 'Tigist', 'Yared', 'Marta', 'Kassahun', 'Hiwot', 'Dawit', 'Tsedey', 'Ermias', 'Rahel', 'Biruk', 'Hanna', 'Samuel', 'Bethlehem', 'Nebiyu', 'Genet'];
const lastNames = ['Kebede', 'Tesfaye', 'Desta', 'Getachew', 'Ferede', 'Alemu', 'Tadesse', 'Assefa', 'Worku', 'Haile', 'Mekonnen', 'Girma', 'Bekele', 'Ayalew', 'Cheru', 'Zeleke', 'Mulugeta', 'Habte', 'Berhe', 'Kassa'];

const users: Record<string, any>[] = [];
for (let i = 1; i <= 90; i++) {
  const fn = firstNames[(i - 1) % firstNames.length];
  const ln = lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length];
  const objId = `usr_${String(i).padStart(4, '0')}`;
  const phone = `+251911${String(100000 + i * 713).slice(0, 6)}`;
  
  let roleCodes: string[];
  let activeRole: string;
  if (i <= 4) {
    roleCodes = ['customer', 'driver', 'rideOwner'];
    activeRole = 'rideOwner';
  } else if (i <= 16) {
    roleCodes = ['customer', 'driver'];
    activeRole = 'driver';
  } else if (i <= 47) {
    roleCodes = ['customer', 'truckOwner'];
    activeRole = 'truckOwner';
  } else if (i <= 73) {
    roleCodes = ['customer', 'truckDispatcher'];
    activeRole = 'truckDispatcher';
  } else {
    roleCodes = ['customer'];
    activeRole = 'customer';
  }

  const countryCode = i % 18 === 0 ? 'UG' : i % 25 === 0 ? 'TH' : 'ET';
  const roleData = {
    customer: { points: 150 + i * 25, tier: i > 50 ? 'Gold' : 'Silver' },
    driver: roleCodes.includes('driver') ? { rating: 4.8, trips: 120 + i * 15 } : undefined,
    rideOwner: roleCodes.includes('rideOwner') ? { fleetSize: 2 + (i % 3) } : undefined,
    truckOwner: roleCodes.includes('truckOwner') ? { dotVerified: true } : undefined,
  };

  users.push({
    objectId: objId,
    username: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@afronala.com`,
    phone: phone,
    emailVerified: i % 3 !== 0,
    phoneVerified: true,
    activeRole: activeRole,
    roleCodes: JSON.stringify(roleCodes),
    countryCode: countryCode,
    roleData: JSON.stringify(roleData),
    firstName: fn,
    lastName: ln,
    avatarUrl: `/assets/avatars/user_${(i % 12) + 1}.jpg`,
    locale: 'am-ET',
    nationalId: `ET-NID-2024-${String(10000 + i)}`,
    status: i === 14 ? 'suspended' : 'active',
    lastLoginAt: new Date(Date.now() - (i * 3600000 + 45000)).toISOString(),
    devicePlatform: i % 4 === 0 ? 'iOS' : 'Android',
    fcmToken: `fcm_token_${objId}_live`,
    emergencyContactName: `${fn} Kin`,
    emergencyContactPhone: `+251922${String(200000 + i * 411).slice(0, 6)}`,
    rating: (4.2 + (i % 8) * 0.1).toFixed(1),
    loyaltyPoints: 100 + i * 35,
    twoFactorEnabled: i % 2 === 0,
    isSuspended: i === 14,
    suspendedReason: i === 14 ? 'Document verification failed on annual CDL audit' : '',
    walletBalanceETB: (500 + i * 125.5).toFixed(2),
    identityTier: i % 5 === 0 ? 'Tier3_Enterprise' : i % 2 === 0 ? 'Tier2_Verified' : 'Tier1_Basic',
    kycStatus: i === 14 ? 'rejected' : 'verified',
    createdAt: new Date(Date.now() - (90 - i) * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - (i * 120000)).toISOString(),
    ACL: JSON.stringify({ "*": { "read": true }, [objId]: { "read": true, "write": true } }),
    signupSource: i % 3 === 0 ? 'mobile_referral' : 'direct_organic',
    referralCode: `AFR-${fn.slice(0, 3).toUpperCase()}${i}`
  });
}

// -----------------------------------------------------------------------------
// 2. Generate Customer.csv (92 records, 47 columns)
// -----------------------------------------------------------------------------
const customerColumns = [
  'objectId', 'user', 'customerId', 'fullName', 'email', 'phone', 'customerType',
  'paymentMethod', 'defaultCurrency', 'creditLimitETB', 'taxId', 'businessName',
  'billingAddress', 'city', 'country', 'totalOrders', 'totalSpentETB', 'rating',
  'loyaltyPoints', 'loyaltyTier', 'discountCode', 'preferredVehicleType', 'emergencyContact',
  'specialInstructions', 'isVerified', 'status', 'notes', 'lastBookingAt',
  'assignedAccountManager', 'allowCorporateBilling', 'creditBalanceETB', 'cancellationRate',
  'avgRatingGiven', 'favoritePickups', 'favoriteDropoffs', 'language', 'pushEnabled',
  'smsEnabled', 'emailEnabled', 'avatar', 'tags', 'customMetadata', 'signupChannel',
  'lastActiveAt', 'createdAt', 'updatedAt', 'ACL'
];

const cities = ['Addis Ababa', 'Adama', 'Hawassa', 'Dire Dawa', 'Bahir Dar', 'Mekelle', 'Bishoftu', 'Jimma'];
const corporateNames = ['Ethio Agri-Tech PLC', 'Horn Logistics Group', 'Blue Nile Commodities', 'Sheba Exporters Ltd', 'Abyssinia Trading Hub', 'Danakil Salt Industrial'];

const customers: Record<string, any>[] = [];
for (let i = 1; i <= 92; i++) {
  const userRef = users[Math.min(i - 1, users.length - 1)];
  const isCorp = i % 5 === 0;
  const objId = `cst_${String(i).padStart(4, '0')}`;
  const cName = isCorp ? corporateNames[(i - 1) % corporateNames.length] : `${userRef.firstName} ${userRef.lastName}`;
  
  customers.push({
    objectId: objId,
    user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
    customerId: `CUST-${1000 + i}`,
    fullName: cName,
    email: userRef.email,
    phone: userRef.phone,
    customerType: isCorp ? 'corporate' : 'individual',
    paymentMethod: isCorp ? 'invoice' : i % 2 === 0 ? 'telebirr' : 'cash',
    defaultCurrency: 'ETB',
    creditLimitETB: isCorp ? 250000 : 0,
    taxId: isCorp ? `TIN-00${34000 + i}` : '',
    businessName: isCorp ? cName : '',
    billingAddress: isCorp ? 'Bole Subcity, Woreda 03, Africa Avenue' : 'Kirkos Subcity, House 412',
    city: cities[i % cities.length],
    country: 'Ethiopia',
    totalOrders: 14 + i * 3,
    totalSpentETB: (4200 + i * 680.5).toFixed(2),
    rating: (4.4 + (i % 6) * 0.1).toFixed(1),
    loyaltyPoints: 350 + i * 40,
    loyaltyTier: i > 60 ? 'Platinum' : i > 25 ? 'Gold' : 'Silver',
    discountCode: i % 4 === 0 ? 'AFRO_RIDE_15' : '',
    preferredVehicleType: isCorp ? 'Heavy Cargo Truck (10T)' : i % 2 === 0 ? 'Sedan Economy' : 'Comfort Van',
    emergencyContact: userRef.emergencyContactPhone,
    specialInstructions: isCorp ? 'Requires certified gate clearance waybill' : 'Call on arrival at compound gate',
    isVerified: true,
    status: 'active',
    notes: isCorp ? 'Key enterprise account for Addis-Modjo corridor' : 'Regular commuter',
    lastBookingAt: new Date(Date.now() - (i * 3600000 * 2)).toISOString(),
    assignedAccountManager: isCorp ? 'Daniel Ferede' : 'Automated Dispatch',
    allowCorporateBilling: isCorp,
    creditBalanceETB: isCorp ? 78400.0 : 0,
    cancellationRate: (0.02 + (i % 4) * 0.01).toFixed(2),
    avgRatingGiven: '4.9',
    favoritePickups: JSON.stringify(['Bole International Airport (ADD)', 'Meskel Square', 'CMC Subcity']),
    favoriteDropoffs: JSON.stringify(['Modjo Dry Port', 'Piassa Downtown', 'Gotera Flyover Interchange']),
    language: 'am',
    pushEnabled: true,
    smsEnabled: true,
    emailEnabled: true,
    avatar: userRef.avatarUrl,
    tags: JSON.stringify(isCorp ? ['freight_shipper', 'corporate', 'priority_logistics'] : ['commuter', 'frequent_rider']),
    customMetadata: JSON.stringify({ onboardingBatch: 'Q1-2024', verifiedByGovKyc: true }),
    signupChannel: 'mobile_app',
    lastActiveAt: new Date(Date.now() - (i * 180000)).toISOString(),
    createdAt: new Date(Date.now() - (120 - i) * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - (i * 360000)).toISOString(),
    ACL: JSON.stringify({ "*": { "read": true }, [userRef.objectId]: { "read": true, "write": true } })
  });
}

// -----------------------------------------------------------------------------
// 3. Generate Driver.csv (12 records, 60 columns)
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
  'fleetBindingType', 'operatingCity', 'operatingZone', 'shiftStatus', 'maxPayloadTonnes',
  'preferredCargoTypes', 'isAvailableForBidding', 'currentTripId', 'currentShipmentId',
  'lastInspectionDate', 'speedGovernorInstalled', 'fuelCardNumber', 'telemetryDeviceId',
  'createdAt', 'updatedAt', 'ACL'
];

const driverLocations = [
  { lat: 9.0108, lon: 38.7613 }, // Meskel Square
  { lat: 8.9882, lon: 38.7588 }, // Gotera
  { lat: 8.9778, lon: 38.7993 }, // Bole
  { lat: 9.0255, lon: 38.8250 }, // CMC
  { lat: 9.0345, lon: 38.7525 }, // Piassa
  { lat: 8.9240, lon: 38.7560 }, // Kality Freight Gate
  { lat: 9.0190, lon: 38.8020 }, // Megenagna
  { lat: 8.9961, lon: 38.7368 }, // Sarbet
  { lat: 8.5400, lon: 39.2700 }, // Modjo Dry Port
  { lat: 8.5500, lon: 39.2800 }, // Adama Tollway
  { lat: 8.9720, lon: 38.7610 }, // Nifas Silk
  { lat: 9.0010, lon: 38.7750 }, // Olympia
];

const vehicleModels = ['Toyota Vitz', 'Hyundai Accent', 'Toyota Corolla', 'Isuzu FSR Cargo (10T)', 'Sinotruk Howo Tipper (25T)', 'Toyota HiAce Minibus', 'Scania G400 Heavy Freight', 'Nissan Urvan Commercial'];

const drivers: Record<string, any>[] = [];
for (let i = 1; i <= 12; i++) {
  const userRef = users[i + 4]; // map to driver users
  const isTruck = i > 4; // 4 ride drivers, 8 truck drivers
  const loc = driverLocations[(i - 1) % driverLocations.length];
  const objId = `drv_${String(i).padStart(4, '0')}`;
  
  drivers.push({
    objectId: objId,
    user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
    driverId: `DRV-ET-${2000 + i}`,
    name: `${userRef.firstName} ${userRef.lastName}`,
    phone: userRef.phone,
    email: userRef.email,
    activeServiceMode: isTruck ? 'truck' : 'ride',
    status: i === 4 ? 'pending_verification' : i === 11 ? 'offline' : 'active',
    onlineStatus: i === 11 ? 'offline' : 'online',
    currentLocation: JSON.stringify({ __type: 'GeoPoint', latitude: loc.lat, longitude: loc.lon }),
    lastLocationUpdate: new Date(Date.now() - (i * 30000)).toISOString(),
    currentSpeedKmh: i === 11 ? 0 : 25 + (i * 4) % 45,
    headingDeg: (i * 35) % 360,
    vehicleModel: vehicleModels[(i - 1) % vehicleModels.length],
    vehiclePlate: isTruck ? `ET-3-TRK-${4000 + i}` : `ET-2-AA-${1000 + i}`,
    vehicleYear: 2021 + (i % 4),
    vehicleColor: isTruck ? 'White / Industrial Yellow' : 'Silver Metallic',
    assignedTruckIds: isTruck ? JSON.stringify([`trk_veh_${String(i).padStart(3, '0')}`]) : '[]',
    truckOwnerId: isTruck ? `to_${String((i % 4) + 1).padStart(4, '0')}` : '',
    licenseNumber: `CDL-FDRE-2024-${8800 + i}`,
    licenseExpiryDate: '2027-12-31T23:59:59.000Z',
    cdlType: isTruck ? 'Class_4_Heavy_Freight' : 'Class_2_Light_Passenger',
    nationalId: userRef.nationalId,
    emergencyContact: userRef.emergencyContactPhone,
    rating: (4.6 + (i % 4) * 0.1).toFixed(1),
    totalTripsCompleted: 450 + i * 85,
    earningsTotalETB: (48000 + i * 7200.0).toFixed(2),
    earningsTodayETB: (1450 + i * 320.0).toFixed(2),
    acceptanceRate: '0.96',
    cancellationRate: '0.03',
    workingHoursToday: (4.5 + (i % 3) * 1.2).toFixed(1),
    todayDistanceKm: (78.5 + i * 14.2).toFixed(1),
    bankName: 'Commercial Bank of Ethiopia',
    bankAccountName: `${userRef.firstName} ${userRef.lastName}`,
    bankAccountNumber: `10002${String(489000 + i * 123).slice(0, 8)}`,
    payoutMethod: i % 2 === 0 ? 'telebirr' : 'cbe_birr',
    telebirrPhone: userRef.phone,
    cbeBirrAccount: userRef.phone,
    chapaMerchantId: `chapa_dr_${objId}`,
    currentShiftStartedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    safetyScore: 98 - (i % 3),
    documentsVerified: true,
    backgroundCheckPassed: true,
    medicalCertificateValid: true,
    fleetBindingType: i <= 4 ? 'ride_owner_fleet' : isTruck ? 'commercial_freight_carrier' : 'independent_operator',
    operatingCity: 'Addis Ababa',
    operatingZone: isTruck ? 'Djibouti-Addis Freight Corridor' : 'Metropolitan Ring Road',
    shiftStatus: 'on_duty',
    maxPayloadTonnes: isTruck ? (10 + (i % 3) * 15) : 0,
    preferredCargoTypes: isTruck ? JSON.stringify(['Agricultural Commodities', 'Containerized Import', 'Construction Materials']) : '[]',
    isAvailableForBidding: isTruck,
    currentTripId: !isTruck ? `TRP-LIVE-${8000 + i}` : '',
    currentShipmentId: isTruck ? `SHP-MODJO-${9000 + i}` : '',
    lastInspectionDate: '2026-02-15T08:00:00.000Z',
    speedGovernorInstalled: true,
    fuelCardNumber: `FC-TOTAL-ET-${7700 + i}`,
    telemetryDeviceId: `OBD2-GPS-AFR-${5000 + i}`,
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - (i * 45000)).toISOString(),
    ACL: JSON.stringify({ "*": { "read": true }, [userRef.objectId]: { "read": true, "write": true } })
  });
}

// -----------------------------------------------------------------------------
// 4. Generate RideDriver.csv (4 records, 27 columns)
// -----------------------------------------------------------------------------
const rideDriverColumns = [
  'objectId', 'rideOwnerId', 'driverUserId', 'driverName', 'ownerName',
  'vehiclePlate', 'vehicleModel', 'commissionSplit', 'ownerSplitPercentage',
  'driverSplitPercentage', 'contractStatus', 'contractType', 'weeklyDeductionETB',
  'targetTripsPerWeek', 'assignedVehicleId', 'invitedAt', 'acceptedAt', 'joinedAt',
  'contractStartAt', 'contractEndAt', 'totalRevenueGeneratedETB',
  'ownerRevenueSettledETB', 'driverNetPayoutETB', 'payoutSchedule', 'isActive',
  'createdAt', 'updatedAt'
];

const rideDrivers: Record<string, any>[] = [];
for (let i = 1; i <= 4; i++) {
  const driverRow = drivers[i - 1];
  const ownerUser = users[i - 1]; // user 1-4 are ride owners
  const objId = `rdr_${String(i).padStart(4, '0')}`;
  const split = i === 4 ? 100 : 80;
  
  rideDrivers.push({
    objectId: objId,
    rideOwnerId: `ro_${String(i).padStart(4, '0')}`,
    driverUserId: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: driverRow.user ? JSON.parse(driverRow.user).objectId : `usr_000${i + 4}` }),
    driverName: driverRow.name,
    ownerName: `${ownerUser.firstName} ${ownerUser.lastName} Taxi Fleet`,
    vehiclePlate: driverRow.vehiclePlate,
    vehicleModel: driverRow.vehicleModel,
    commissionSplit: split,
    ownerSplitPercentage: split === 100 ? 0 : 20,
    driverSplitPercentage: split,
    contractStatus: 'active',
    contractType: split === 100 ? 'owner_operator_license' : 'revenue_split_fleet',
    weeklyDeductionETB: 1200,
    targetTripsPerWeek: 75,
    assignedVehicleId: `veh_ride_${String(i).padStart(3, '0')}`,
    invitedAt: '2024-01-10T09:00:00.000Z',
    acceptedAt: '2024-01-11T14:30:00.000Z',
    joinedAt: '2024-01-15T08:00:00.000Z',
    contractStartAt: '2024-01-15T00:00:00.000Z',
    contractEndAt: '2027-01-15T00:00:00.000Z',
    totalRevenueGeneratedETB: 128400.0 + i * 24000.0,
    ownerRevenueSettledETB: (split === 100 ? 0 : (128400.0 + i * 24000.0) * 0.2),
    driverNetPayoutETB: (128400.0 + i * 24000.0) * (split / 100.0) - 1200 * 24,
    payoutSchedule: 'weekly_every_monday',
    isActive: true,
    createdAt: new Date(Date.now() - 300 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600000).toISOString()
  });
}

// -----------------------------------------------------------------------------
// 5. Generate RideOwner.csv (4 records, 21 columns)
// -----------------------------------------------------------------------------
const rideOwnerColumns = [
  'objectId', 'ownerUserId', 'businessName', 'tinNumber', 'fleetSize',
  'activeDriversCount', 'contactPerson', 'phone', 'email', 'bankName',
  'accountNumber', 'totalRevenueETB', 'settledPayoutETB', 'escrowBalanceETB',
  'operatingLicenseNumber', 'licenseValidUntil', 'businessRegistrationCity',
  'status', 'commissionRatePercentage', 'createdAt', 'updatedAt'
];

const rideOwners: Record<string, any>[] = [];
for (let i = 1; i <= 4; i++) {
  const userRef = users[i - 1];
  const objId = `ro_${String(i).padStart(4, '0')}`;
  
  rideOwners.push({
    objectId: objId,
    ownerUserId: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
    businessName: `${userRef.firstName} ${userRef.lastName} Capital Mobility Group`,
    tinNumber: `TIN-FLEET-00${9400 + i}`,
    fleetSize: 6 + i * 4,
    activeDriversCount: 5 + i * 3,
    contactPerson: `${userRef.firstName} ${userRef.lastName}`,
    phone: userRef.phone,
    email: userRef.email,
    bankName: 'Awash International Bank',
    accountNumber: `01320${String(892000 + i * 543).slice(0, 8)}`,
    totalRevenueETB: 840000.0 + i * 145000.0,
    settledPayoutETB: 720000.0 + i * 110000.0,
    escrowBalanceETB: 45000.0,
    operatingLicenseNumber: `FDRE-MOT-FLEET-2024-${330 + i}`,
    licenseValidUntil: '2028-06-30T23:59:59.000Z',
    businessRegistrationCity: 'Addis Ababa',
    status: 'active',
    commissionRatePercentage: 20.0,
    createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString()
  });
}

// -----------------------------------------------------------------------------
// 6. Generate TruckDispatcher.csv (26 records, 12 columns)
// -----------------------------------------------------------------------------
const truckDispatcherColumns = [
  'objectId', 'user', 'dispatcherId', 'name', 'phone', 'email',
  'assignedCorridor', 'stationHub', 'activeTrucksSupervised',
  'totalWaybillsDispatched', 'status', 'createdAt'
];

const corridors = [
  'Addis Ababa → Modjo Dry Port (Express)',
  'Modjo → Adama → Awash Highway',
  'Djibouti Port → Galafi Freight Corridor',
  'Addis Ababa → Hawassa Agro-Industrial',
  'Addis Ababa → Bahir Dar / Gonder Link',
  'Addis Ababa → Jimma Specialty Coffee Route'
];

const stationHubs = [
  'Modjo Dry Port Freight Gate 2',
  'Kality Regional Depot Hub',
  'Adama Toll Expressway Dispatch Station',
  'Galafi Border Clearance Station',
  'Dukem Eastern Industrial Zone Depot',
  'Hawassa Industrial Logistics Hub'
];

const truckDispatchers: Record<string, any>[] = [];
for (let i = 1; i <= 26; i++) {
  const userRef = users[Math.min(47 + i, users.length - 1)];
  const objId = `td_${String(i).padStart(4, '0')}`;
  
  truckDispatchers.push({
    objectId: objId,
    user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
    dispatcherId: `DISP-LOG-${3000 + i}`,
    name: `${userRef.firstName} ${userRef.lastName}`,
    phone: userRef.phone,
    email: userRef.email,
    assignedCorridor: corridors[(i - 1) % corridors.length],
    stationHub: stationHubs[(i - 1) % stationHubs.length],
    activeTrucksSupervised: 8 + (i % 7) * 3,
    totalWaybillsDispatched: 340 + i * 58,
    status: 'active',
    createdAt: new Date(Date.now() - (150 - i * 3) * 86400000).toISOString()
  });
}

// -----------------------------------------------------------------------------
// 7. Generate TruckOwner.csv (31 records, 27 columns)
// -----------------------------------------------------------------------------
const truckOwnerColumns = [
  'objectId', 'user', 'ownerId', 'companyName', 'tinNumber', 'dotNumber',
  'mcNumber', 'serviceConfigs', 'fleetSize', 'activeTrucksCount', 'contactName',
  'contactPhone', 'contactEmail', 'bankName', 'accountNumber',
  'insuranceProvider', 'insurancePolicyNumber', 'insuranceExpiryDate',
  'verifiedStatus', 'status', 'settlementCycle', 'creditRating',
  'registeredCorridors', 'totalFreightVolumeTonnes', 'escrowBalanceETB',
  'createdAt', 'updatedAt'
];

const carrierNames = [
  'Rift Valley Freight Carriers Ltd', 'Abyssinia Heavy Haulage S.C.', 'Danakil Heavy Transport PLC',
  'Ethio-Djibouti Corridor Logistics', 'Red Sea Freight Lines', 'Sheba Bulk Haulers',
  'Blue Nile Express Cargo PLC', 'Addis Container Movers', 'Highland Freight Services'
];

const insuranceProviders = [
  'Nyala Insurance S.C.', 'Ethiopian Insurance Corporation', 'Awash Insurance Company',
  'United Insurance S.C.', 'NIB Insurance Company', 'Africa Insurance S.C.'
];

const truckOwners: Record<string, any>[] = [];
for (let i = 1; i <= 31; i++) {
  const userRef = users[16 + (i - 1)];
  const objId = `to_${String(i).padStart(4, '0')}`;
  const company = carrierNames[(i - 1) % carrierNames.length] + (i > 9 ? ` Branch ${i}` : '');
  const dotNum = String(100450 + i * 23);
  const mcNum = String(200340 + i * 19);

  const serviceConfigs = {
    truck: {
      serviceType: 'truck',
      isActive: true,
      serviceMetadata: {
        dotNumber: dotNum,
        mcNumber: mcNum,
        corridorLicense: 'Djibouti-Addis-Transit-A',
        permittedHazardousMaterials: i % 4 === 0,
      }
    }
  };

  truckOwners.push({
    objectId: objId,
    user: JSON.stringify({ __type: 'Pointer', className: '_User', objectId: userRef.objectId }),
    ownerId: `TO-ET-${4000 + i}`,
    companyName: company,
    tinNumber: `TIN-CARRIER-00${7500 + i}`,
    dotNumber: dotNum,
    mcNumber: mcNum,
    serviceConfigs: JSON.stringify(serviceConfigs),
    fleetSize: 5 + (i % 6) * 4,
    activeTrucksCount: 4 + (i % 5) * 3,
    contactName: `${userRef.firstName} ${userRef.lastName}`,
    contactPhone: userRef.phone,
    contactEmail: userRef.email,
    bankName: 'Commercial Bank of Ethiopia (Corporate)',
    accountNumber: `10003${String(789000 + i * 891).slice(0, 8)}`,
    insuranceProvider: insuranceProviders[(i - 1) % insuranceProviders.length],
    insurancePolicyNumber: `POL-ET-HULL-2024-${5600 + i}`,
    insuranceExpiryDate: '2027-09-30T23:59:59.000Z',
    verifiedStatus: 'verified',
    status: 'active',
    settlementCycle: 'bi_weekly_direct_deposit',
    creditRating: (i % 3 === 0 ? 'AAA' : 'AA+'),
    registeredCorridors: JSON.stringify(['Djibouti Port → Modjo Dry Port', 'Addis Ababa → Hawassa Industrial']),
    totalFreightVolumeTonnes: (1450.0 + i * 380.0).toFixed(1),
    escrowBalanceETB: (95000.0 + i * 12500.0).toFixed(2),
    createdAt: new Date(Date.now() - (220 - i * 4) * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - (i * 72000)).toISOString()
  });
}

// Write files
fs.writeFileSync(path.join(TARGET_DIR, '_User.csv'), toCsv(users, userColumns), 'utf8');
fs.writeFileSync(path.join(TARGET_DIR, 'Customer.csv'), toCsv(customers, customerColumns), 'utf8');
fs.writeFileSync(path.join(TARGET_DIR, 'Driver.csv'), toCsv(drivers, driverColumns), 'utf8');
fs.writeFileSync(path.join(TARGET_DIR, 'RideDriver.csv'), toCsv(rideDrivers, rideDriverColumns), 'utf8');
fs.writeFileSync(path.join(TARGET_DIR, 'RideOwner.csv'), toCsv(rideOwners, rideOwnerColumns), 'utf8');
fs.writeFileSync(path.join(TARGET_DIR, 'TruckDispatcher.csv'), toCsv(truckDispatchers, truckDispatcherColumns), 'utf8');
fs.writeFileSync(path.join(TARGET_DIR, 'TruckOwner.csv'), toCsv(truckOwners, truckOwnerColumns), 'utf8');

console.log('Successfully generated 7 Back4App Parse class CSVs in:', TARGET_DIR);
console.log(`_User.csv: ${users.length} rows, ${userColumns.length} columns`);
console.log(`Customer.csv: ${customers.length} rows, ${customerColumns.length} columns`);
console.log(`Driver.csv: ${drivers.length} rows, ${driverColumns.length} columns`);
console.log(`RideDriver.csv: ${rideDrivers.length} rows, ${rideDriverColumns.length} columns`);
console.log(`RideOwner.csv: ${rideOwners.length} rows, ${rideOwnerColumns.length} columns`);
console.log(`TruckDispatcher.csv: ${truckDispatchers.length} rows, ${truckDispatcherColumns.length} columns`);
console.log(`TruckOwner.csv: ${truckOwners.length} rows, ${truckOwnerColumns.length} columns`);
