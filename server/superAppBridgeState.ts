import type {
  SuperAppDriverInvitation,
  SuperAppEscrowRecord,
  SuperAppFeatureFlagItem,
  SuperAppFleetTruck,
  SuperAppFreightBid,
  SuperAppRuntimeConfig,
  SuperAppSurgeZone,
  SuperAppTruckBookingLoad,
  SuperAppVerificationItem,
} from '../src/types/index.ts';

const INITIAL_VERIFICATIONS: SuperAppVerificationItem[] = [
  {
    id: 'VER-401',
    queue: 'document',
    applicantName: 'Bekele Tesfaye',
    applicantRole: 'driver',
    phone: '0911 556 677',
    serviceType: 'ride',
    documentOrVehicleLabel: 'Addis Ababa Grade-3 Commercial Driver License & TIN',
    identifierCode: 'AA-DL-884120',
    submittedAt: '14 min ago',
    status: 'pending',
    eligibilityScore: 92,
    missingChecks: [],
    notes: 'OCR matched Federal Transport Authority registry.',
  },
  {
    id: 'VER-402',
    queue: 'vehicle',
    applicantName: 'Abay Heavy Logistics PLC',
    applicantRole: 'vehicle_owner',
    phone: '0911 880 112',
    serviceType: 'truck',
    documentOrVehicleLabel: 'Sinotruk HOWO 28T — Annual Bola & Weighbridge Certificate',
    identifierCode: '3-ET-74910',
    submittedAt: '32 min ago',
    status: 'pending',
    eligibilityScore: 86,
    missingChecks: ['Verify rear axle reflective strip photo'],
  },
  {
    id: 'VER-403',
    queue: 'service_activation',
    applicantName: 'Yosef Alemu',
    applicantRole: 'driver',
    phone: '0911 889 900',
    serviceType: 'ride',
    documentOrVehicleLabel: 'Airport Priority & Corporate Ride Tier Activation',
    identifierCode: 'FF-99001',
    submittedAt: '1 hour ago',
    status: 'pending',
    eligibilityScore: 79,
    missingChecks: ['Bola inspection renewal due within 21 days'],
  },
  {
    id: 'VER-404',
    queue: 'eligibility',
    applicantName: 'Tsegaye Hailu',
    applicantRole: 'driver',
    phone: '0912 345 678',
    serviceType: 'truck',
    documentOrVehicleLabel: 'Cross-Corridor Bonded Freight Eligibility Audit',
    identifierCode: '3-ET-19402',
    submittedAt: '2 hours ago',
    status: 'approved',
    eligibilityScore: 98,
    missingChecks: [],
    notes: 'Cleared for Modjo & Kality bonded customs dispatch.',
  },
  {
    id: 'VER-405',
    queue: 'document',
    applicantName: 'Daniel Getachew',
    applicantRole: 'driver',
    phone: '0911 445 667',
    serviceType: 'ride',
    documentOrVehicleLabel: 'Third-Party Motor Insurance Policy Upload',
    identifierCode: 'DD-44556',
    submittedAt: '3 hours ago',
    status: 'rejected',
    eligibilityScore: 61,
    missingChecks: ['Policy endorsement page missing insurer stamp'],
    notes: 'Rejected pending stamped endorsement re-upload.',
  },
];

const INITIAL_FLEET_TRUCKS: SuperAppFleetTruck[] = [
  {
    truckId: 'TRK-01',
    plate: '3-ET-48190',
    model: 'Mercedes-Benz Atego 1518',
    capacityTons: 15,
    serviceType: 'truck',
    ownerId: 'OWN-01',
    ownerName: 'Abay Heavy Logistics PLC',
    assignedDriverId: 'DRV-07',
    assignedDriverName: 'Tsegaye Hailu',
    assignedDriverPhone: '0912 345 678',
    status: 'active',
  },
  {
    truckId: 'TRK-02',
    plate: '3-ET-91823',
    model: 'Volvo FH16 Globetrotter',
    capacityTons: 28,
    serviceType: 'truck',
    ownerId: 'OWN-02',
    ownerName: 'Awash Corridor Carriers SC',
    assignedDriverId: 'DRV-08',
    assignedDriverName: 'Dawit Alemayehu',
    assignedDriverPhone: '0913 876 543',
    status: 'active',
  },
  {
    truckId: 'TRK-03',
    plate: '3-ET-74910',
    model: 'Sinotruk HOWO A7 Heavy',
    capacityTons: 24,
    serviceType: 'truck',
    ownerId: 'OWN-01',
    ownerName: 'Abay Heavy Logistics PLC',
    assignedDriverId: null,
    assignedDriverName: null,
    assignedDriverPhone: null,
    status: 'idle',
  },
  {
    truckId: 'TRK-04',
    plate: '3-ET-60215',
    model: 'Isuzu FVR Refrigerated Box',
    capacityTons: 12,
    serviceType: 'truck',
    ownerId: 'OWN-03',
    ownerName: 'Rift Valley ColdChain PLC',
    assignedDriverId: 'DRV-12',
    assignedDriverName: 'Mulugeta Girma',
    assignedDriverPhone: '0911 604 321',
    status: 'active',
  },
];

const INITIAL_LOADS: SuperAppTruckBookingLoad[] = [
  {
    bookingId: 'TBK-8821',
    shipperName: 'Mojo Agro Industry PLC',
    origin: 'Modjo Dry Port Terminal',
    destination: 'Addis Ababa Kality Depot',
    cargoCategory: 'Export Coffee & Oilseeds',
    weightTons: 48,
    priority: 'urgent',
    priorityMultiplier: 1.25,
    requiredTrucks: 2,
    allocatedTrucks: 1,
    biddingWindowEndsInMin: 14,
    autoBidEnabled: true,
    estimatedBudgetETB: 128000,
    status: 'bidding_open',
    escrowId: 'ESC-5501',
  },
  {
    bookingId: 'TBK-8822',
    shipperName: 'Kality Steel Mills SC',
    origin: 'Kality Industrial Ring',
    destination: 'Adama Industrial Park',
    cargoCategory: 'Structural Steel Coils',
    weightTons: 26,
    priority: 'express',
    priorityMultiplier: 1.55,
    requiredTrucks: 1,
    allocatedTrucks: 0,
    biddingWindowEndsInMin: 9,
    autoBidEnabled: true,
    estimatedBudgetETB: 94500,
    status: 'bidding_open',
    escrowId: 'ESC-5502',
  },
  {
    bookingId: 'TBK-8819',
    shipperName: 'Hawassa Textile Export SC',
    origin: 'Hawassa Industrial Park',
    destination: 'Bole Cargo Terminal',
    cargoCategory: 'Apparel & Cotton Bales',
    weightTons: 14,
    priority: 'normal',
    priorityMultiplier: 1.0,
    requiredTrucks: 1,
    allocatedTrucks: 1,
    biddingWindowEndsInMin: 0,
    autoBidEnabled: false,
    estimatedBudgetETB: 48000,
    status: 'in_transit',
    escrowId: 'ESC-5503',
  },
];

const INITIAL_BIDS: SuperAppFreightBid[] = [
  {
    bidId: 'BID-301',
    bookingId: 'TBK-8821',
    providerId: 'OWN-01',
    providerName: 'Abay Heavy Logistics PLC',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-01',
    truckPlate: '3-ET-48190',
    truckModel: 'Mercedes-Benz Atego 1518',
    amountETB: 61500,
    etaMinutes: 22,
    rating: 4.92,
    autoSelected: true,
    status: 'awarded',
    submittedAt: '18 min ago',
  },
  {
    bidId: 'BID-302',
    bookingId: 'TBK-8821',
    providerId: 'OWN-02',
    providerName: 'Awash Corridor Carriers SC',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-02',
    truckPlate: '3-ET-91823',
    truckModel: 'Volvo FH16 Globetrotter',
    amountETB: 63000,
    etaMinutes: 19,
    rating: 4.88,
    autoSelected: false,
    status: 'open',
    submittedAt: '11 min ago',
  },
  {
    bidId: 'BID-303',
    bookingId: 'TBK-8821',
    providerId: 'DRV-15',
    providerName: 'Kibrom Tadesse',
    providerType: 'independent_driver',
    truckId: 'TRK-IND-09',
    truckPlate: '3-ET-51204',
    truckModel: 'Sinotruk Steyr 20T',
    amountETB: 64800,
    etaMinutes: 27,
    rating: 4.79,
    autoSelected: false,
    status: 'open',
    submittedAt: '7 min ago',
  },
  {
    bidId: 'BID-304',
    bookingId: 'TBK-8822',
    providerId: 'OWN-03',
    providerName: 'Rift Valley ColdChain PLC',
    providerType: 'vehicle_owner_fleet',
    truckId: 'TRK-04',
    truckPlate: '3-ET-60215',
    truckModel: 'Isuzu FVR Heavy',
    amountETB: 89500,
    etaMinutes: 16,
    rating: 4.95,
    autoSelected: false,
    status: 'open',
    submittedAt: '5 min ago',
  },
];

const INITIAL_INVITATIONS: SuperAppDriverInvitation[] = [
  {
    invitationId: 'INV-701',
    ownerId: 'OWN-01',
    ownerName: 'Abay Heavy Logistics PLC',
    driverName: 'Kibrom Tadesse',
    driverPhone: '0911 556 677',
    targetTruckId: 'TRK-03',
    targetTruckPlate: '3-ET-74910',
    revenueSplitDriverPct: 32,
    status: 'pending',
    sentAt: '25 min ago',
  },
  {
    invitationId: 'INV-700',
    ownerId: 'OWN-02',
    ownerName: 'Awash Corridor Carriers SC',
    driverName: 'Dawit Alemayehu',
    driverPhone: '0913 876 543',
    targetTruckId: 'TRK-02',
    targetTruckPlate: '3-ET-91823',
    revenueSplitDriverPct: 30,
    status: 'accepted',
    sentAt: '2 days ago',
  },
];

const INITIAL_ESCROWS: SuperAppEscrowRecord[] = [
  {
    escrowId: 'ESC-5501',
    bookingId: 'TBK-8821',
    payerName: 'Mojo Agro Industry PLC',
    recipientId: 'OWN-01',
    recipientName: 'Abay Heavy Logistics PLC',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'cbe_birr',
    grossAmountETB: 128000,
    platformMarginETB: 19200,
    taxWithheldETB: 2560,
    netPayoutETB: 106240,
    status: 'held_in_escrow',
    updatedAt: '15 min ago',
  },
  {
    escrowId: 'ESC-5502',
    bookingId: 'TBK-8822',
    payerName: 'Kality Steel Mills SC',
    recipientId: 'OWN-02',
    recipientName: 'Awash Corridor Carriers SC',
    recipientType: 'vehicle_owner_fleet',
    paymentRail: 'bank_rtgs',
    grossAmountETB: 120000,
    platformMarginETB: 18000,
    taxWithheldETB: 2400,
    netPayoutETB: 99600,
    status: 'payout_ready',
    updatedAt: '38 min ago',
  },
  {
    escrowId: 'ESC-5503',
    bookingId: 'TBK-8819',
    payerName: 'Hawassa Textile Export SC',
    recipientId: 'DRV-07',
    recipientName: 'Tsegaye Hailu',
    recipientType: 'driver',
    paymentRail: 'telebirr',
    grossAmountETB: 48000,
    platformMarginETB: 7200,
    taxWithheldETB: 960,
    netPayoutETB: 39840,
    status: 'released',
    updatedAt: '2 hours ago',
  },
];

const INITIAL_SURGE_ZONES: SuperAppSurgeZone[] = [
  {
    zoneId: 'ZONE-BOLE-01',
    zoneName: 'Bole International Terminal & Medhanealem',
    serviceType: 'ride',
    activeRequests: 68,
    availableDrivers: 42,
    currentMultiplier: 1.35,
    autoSurgeEnabled: true,
    updatedAt: '2 min ago',
  },
  {
    zoneId: 'ZONE-KAZ-02',
    zoneName: 'Kazanchis & Meskel Square Interchange',
    serviceType: 'ride',
    activeRequests: 51,
    availableDrivers: 39,
    currentMultiplier: 1.2,
    autoSurgeEnabled: true,
    updatedAt: '4 min ago',
  },
  {
    zoneId: 'ZONE-CMC-03',
    zoneName: 'Megenagna — CMC Residential Corridor',
    serviceType: 'ride',
    activeRequests: 29,
    availableDrivers: 31,
    currentMultiplier: 1.0,
    autoSurgeEnabled: true,
    updatedAt: '6 min ago',
  },
  {
    zoneId: 'ZONE-MODJO-04',
    zoneName: 'Kality — Modjo Dry Port Freight Gate',
    serviceType: 'truck',
    activeRequests: 19,
    availableDrivers: 11,
    currentMultiplier: 1.4,
    autoSurgeEnabled: false,
    updatedAt: '9 min ago',
  },
];

const INITIAL_FEATURE_FLAGS: SuperAppFeatureFlagItem[] = [
  {
    key: 'ff.city_ride_instant_dispatch',
    name: 'AmbaLay Instant Matrix Ride Dispatch',
    serviceType: 'ride',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['customer', 'driver', 'admin'],
    description: 'Uses AmbaLay multi-point distance matrix for sub-second nearest-driver matching.',
    updatedAt: 'Today, 08:15',
  },
  {
    key: 'ff.multi_truck_bidding',
    name: 'Multi-Truck Load Splitting & Carrier Bidding',
    serviceType: 'truck',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['customer', 'driver', 'vehicle_owner', 'admin'],
    description: 'Enables corporate shippers to allocate multi-truck tonnage across independent and fleet carriers.',
    updatedAt: 'Today, 09:00',
  },
  {
    key: 'ff.vehicle_owner_1to1_binding',
    name: 'Strict 1-Driver-Per-Truck Fleet Invariant',
    serviceType: 'truck',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['vehicle_owner', 'driver', 'admin'],
    description: 'Enforces atomic driver transfer when binding a driver to a Vehicle Owner truck.',
    updatedAt: 'Yesterday',
  },
  {
    key: 'ff.escrow_telebirr_instant_payout',
    name: 'Telebirr & CBE Birr Milestone Escrow Release',
    serviceType: 'platform',
    enabled: true,
    rolloutPercentage: 75,
    targetRoles: ['driver', 'vehicle_owner', 'admin'],
    description: 'Automates net 83% carrier disbursement upon verified digital waybill sign-off.',
    updatedAt: 'Yesterday',
  },
  {
    key: 'ff.addis_food_cloud_kitchens',
    name: 'Addis Cloud Kitchens & Meal Delivery Beta',
    serviceType: 'food',
    enabled: false,
    rolloutPercentage: 0,
    targetRoles: ['customer', 'driver'],
    description: 'Staged UnifiedAppRegistry launcher tile for restaurant & courier ordering.',
    updatedAt: '3 days ago',
  },
];

class SuperAppGovernanceStore {
  verifications: SuperAppVerificationItem[] = structuredClone(INITIAL_VERIFICATIONS);
  fleetTrucks: SuperAppFleetTruck[] = structuredClone(INITIAL_FLEET_TRUCKS);
  loads: SuperAppTruckBookingLoad[] = structuredClone(INITIAL_LOADS);
  bids: SuperAppFreightBid[] = structuredClone(INITIAL_BIDS);
  invitations: SuperAppDriverInvitation[] = structuredClone(INITIAL_INVITATIONS);
  escrows: SuperAppEscrowRecord[] = structuredClone(INITIAL_ESCROWS);

  runtimeConfig: SuperAppRuntimeConfig = {
    bookingPriorities: {
      normal: 1.0,
      urgent: 1.25,
      express: 1.55,
    },
    availableTransportCategories: [
      'Economy Sedan',
      'Comfort Sedan',
      'Minibus XL',
      'Isuzu NPR 5T',
      'Box Truck 15T',
      'Heavy Flatbed 28T',
      'Refrigerated ColdChain',
    ],
    pricingFinancialContext: {
      rideBaseFareETB: 120,
      ridePerKmETB: 28,
      ridePerMinETB: 3.5,
      truckBaseFareETB: 3500,
      truckPerTonKmETB: 14.5,
      biddingFloorPct: 85,
      biddingCeilingPct: 135,
      platformMarginPct: 15,
      withholdingTaxPct: 2,
      autoBidWindowMinutes: 20,
    },
    regionalSurgeZones: structuredClone(INITIAL_SURGE_ZONES),
    featureFlags: structuredClone(INITIAL_FEATURE_FLAGS),
    updatedAt: new Date().toISOString(),
  };

  updateRuntimeConfig(incoming: Partial<SuperAppRuntimeConfig>): SuperAppRuntimeConfig {
    this.runtimeConfig = {
      ...this.runtimeConfig,
      ...incoming,
      bookingPriorities: {
        ...this.runtimeConfig.bookingPriorities,
        ...(incoming.bookingPriorities || {}),
      },
      pricingFinancialContext: {
        ...this.runtimeConfig.pricingFinancialContext,
        ...(incoming.pricingFinancialContext || {}),
      },
      regionalSurgeZones:
        incoming.regionalSurgeZones ?? this.runtimeConfig.regionalSurgeZones,
      featureFlags: incoming.featureFlags ?? this.runtimeConfig.featureFlags,
      availableTransportCategories:
        incoming.availableTransportCategories ??
        this.runtimeConfig.availableTransportCategories,
      updatedAt: new Date().toISOString(),
    };
    return this.runtimeConfig;
  }

  executeSynthesizedCloudFunction(
    functionName: string,
    payload: Record<string, any> = {}
  ): Record<string, any> {
    switch (functionName) {
      case 'getPlatformMetrics': {
        return {
          pendingVerifications: this.verifications.filter((v) => v.status === 'pending').length,
          activeFleetTrucks: this.fleetTrucks.filter((t) => t.status === 'active').length,
          totalFleetTrucks: this.fleetTrucks.length,
          openFreightLoads: this.loads.filter((l) => l.status === 'bidding_open').length,
          openBids: this.bids.filter((b) => b.status === 'open').length,
          lockedEscrowETB: this.escrows
            .filter((e) => e.status === 'held_in_escrow' || e.status === 'payout_ready')
            .reduce((s, e) => s + e.grossAmountETB, 0),
          activeFeatureFlags: this.runtimeConfig.featureFlags.filter((f) => f.enabled).length,
          timestamp: new Date().toISOString(),
        };
      }

      case 'admin_getPendingDocuments': {
        return {
          allVerifications: this.verifications,
          items: this.verifications,
        };
      }

      case 'admin_verifyDocument':
      case 'approveVehicleVerification':
      case 'rejectVehicleVerification':
      case 'revertVehicleVerification':
      case 'approveServiceActivation':
      case 'rejectDriverRequest': {
        const targetId = String(payload.targetId || '');
        const nextStatus: SuperAppVerificationItem['status'] =
          functionName === 'revertVehicleVerification' || payload.decision === 'pending'
            ? 'pending'
            : functionName.startsWith('reject') || payload.decision === 'rejected'
            ? 'rejected'
            : 'approved';

        this.verifications = this.verifications.map((item) =>
          item.id === targetId
            ? {
                ...item,
                status: nextStatus,
                notes: String(payload.notes || payload.reason || item.notes || ''),
              }
            : item
        );
        return {
          targetId,
          status: nextStatus,
          verifications: this.verifications,
        };
      }

      case 'evaluateBatchDriverEligibility': {
        return {
          totalEvaluated: this.verifications.length,
          evaluatedAt: new Date().toISOString(),
          verifications: this.verifications,
        };
      }

      case 'getTrucksPaginated': {
        return {
          trucks: this.fleetTrucks,
          loads: this.loads,
          bids: this.bids,
          invitations: this.invitations,
          escrows: this.escrows,
        };
      }

      case 'allocateMultiTruckLoad': {
        const bookingId = String(payload.bookingId || '');
        const bidId = String(payload.bidId || '');

        this.bids = this.bids.map((b) =>
          b.bidId === bidId ? { ...b, status: 'awarded' } : b
        );

        this.loads = this.loads.map((load) => {
          if (load.bookingId !== bookingId) return load;
          const nextAllocated = Math.min(load.requiredTrucks, load.allocatedTrucks + 1);
          const nextStatus: SuperAppTruckBookingLoad['status'] =
            nextAllocated >= load.requiredTrucks ? 'allocated' : 'partially_allocated';
          return {
            ...load,
            allocatedTrucks: nextAllocated,
            status: nextStatus,
          };
        });

        return {
          loads: this.loads,
          bids: this.bids,
        };
      }

      case 'assignTruckToDriver':
      case 'transferDriverBetweenTrucks': {
        const truckId = String(payload.truckId || '');
        const driverId = String(payload.driverId || '');
        const driverName = String(payload.driverName || 'Assigned Driver');
        const driverPhone = String(payload.driverPhone || '0911 000 000');

        this.fleetTrucks = this.fleetTrucks.map((truck) => {
          if (truck.truckId === truckId) {
            return {
              ...truck,
              assignedDriverId: driverId,
              assignedDriverName: driverName,
              assignedDriverPhone: driverPhone,
              status: 'active',
            };
          }
          if (truck.assignedDriverId === driverId) {
            return {
              ...truck,
              assignedDriverId: null,
              assignedDriverName: null,
              assignedDriverPhone: null,
              status: 'idle',
            };
          }
          return truck;
        });

        return { trucks: this.fleetTrucks };
      }

      case 'unassignTruckFromDriver': {
        const truckId = String(payload.truckId || '');
        this.fleetTrucks = this.fleetTrucks.map((truck) =>
          truck.truckId === truckId
            ? {
                ...truck,
                assignedDriverId: null,
                assignedDriverName: null,
                assignedDriverPhone: null,
                status: 'idle',
              }
            : truck
        );
        return { trucks: this.fleetTrucks };
      }

      case 'manageInvitation': {
        if (payload.action === 'create') {
          const newInv: SuperAppDriverInvitation = {
            invitationId: `INV-${Math.floor(702 + Math.random() * 290)}`,
            ownerId: 'OWN-01',
            ownerName: String(payload.ownerName || 'Abay Heavy Logistics PLC'),
            driverName: String(payload.driverName || 'Invited Driver'),
            driverPhone: String(payload.driverPhone || '0911 000 000'),
            targetTruckId: String(payload.targetTruckId || 'TRK-03'),
            targetTruckPlate: String(payload.targetTruckPlate || '3-ET-74910'),
            revenueSplitDriverPct: Number(payload.revenueSplitDriverPct) || 30,
            status: 'pending',
            sentAt: 'Just now',
          };
          this.invitations = [newInv, ...this.invitations];
        } else if (payload.invitationId) {
          const invId = String(payload.invitationId);
          const nextStatus = (payload.status || 'revoked') as SuperAppDriverInvitation['status'];
          this.invitations = this.invitations.map((inv) =>
            inv.invitationId === invId ? { ...inv, status: nextStatus } : inv
          );
        }
        return { invitations: this.invitations };
      }

      case 'releaseEscrowMilestone': {
        const escrowId = String(payload.escrowId || '');
        this.escrows = this.escrows.map((esc) =>
          esc.escrowId === escrowId
            ? { ...esc, status: 'payout_ready', updatedAt: 'Just now' }
            : esc
        );
        return {
          escrows: this.escrows,
          settlementReference: `MLS-${Date.now().toString().slice(-6)}`,
        };
      }

      case 'initiateFleetPayout':
      case 'initiateDriverPayout': {
        const escrowId = String(payload.escrowId || '');
        this.escrows = this.escrows.map((esc) =>
          esc.escrowId === escrowId
            ? { ...esc, status: 'released', updatedAt: 'Just now' }
            : esc
        );
        return {
          escrows: this.escrows,
          settlementReference: `STL-${Date.now().toString().slice(-6)}`,
        };
      }

      case 'getCurrentSurge': {
        const zoneId = payload.zoneId ? String(payload.zoneId) : null;
        const zones = zoneId
          ? this.runtimeConfig.regionalSurgeZones.filter((z) => z.zoneId === zoneId)
          : this.runtimeConfig.regionalSurgeZones;
        return { zones };
      }

      case 'updateSurgeMultiplier': {
        const zoneId = String(payload.zoneId || '');
        const multiplier = Number(payload.multiplier) || 1.0;
        const autoSurgeEnabled =
          typeof payload.autoSurgeEnabled === 'boolean' ? payload.autoSurgeEnabled : undefined;

        this.runtimeConfig.regionalSurgeZones = this.runtimeConfig.regionalSurgeZones.map((z) =>
          z.zoneId === zoneId
            ? {
                ...z,
                currentMultiplier: multiplier,
                autoSurgeEnabled:
                  autoSurgeEnabled !== undefined ? autoSurgeEnabled : z.autoSurgeEnabled,
                updatedAt: 'Just now',
              }
            : z
        );
        return { zones: this.runtimeConfig.regionalSurgeZones };
      }

      case 'toggleFeatureFlag': {
        const key = String(payload.key || '');
        const enabled = Boolean(payload.enabled);
        const rolloutPercentage =
          typeof payload.rolloutPercentage === 'number' ? payload.rolloutPercentage : undefined;

        this.runtimeConfig.featureFlags = this.runtimeConfig.featureFlags.map((flag) =>
          flag.key === key
            ? {
                ...flag,
                enabled,
                rolloutPercentage:
                  rolloutPercentage !== undefined ? rolloutPercentage : flag.rolloutPercentage,
                updatedAt: 'Just now',
              }
            : flag
        );
        return { featureFlags: this.runtimeConfig.featureFlags };
      }

      default:
        return {
          functionName,
          acknowledged: true,
          echoPayload: payload,
          timestamp: new Date().toISOString(),
        };
    }
  }
}

export const superAppGovernanceStore = new SuperAppGovernanceStore();
