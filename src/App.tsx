import React, { useState, useEffect, useCallback } from 'react';
import {
  AdminUser,
  CustomerAccount,
  DispatchJob,
  Driver,
  DriverStatus,
  ModuleItem,
  NotificationItem,
  PermissionAction,
  Shipment,
  ShipmentStatus,
  SystemAlert,
  ToastMessage,
  TriggeredActivityPulse,
  Trip,
  Vehicle,
  VehicleStatus,
  ActiveDriverTripOffer,
  EastAfricaCountryCode,
  EastAfricaModuleCountryConfig,
} from './types';
import { back4AppService, DEFAULT_ALERTS, DEFAULT_CUSTOMERS, DEFAULT_MODULES } from './services/back4app';
import { getRequiredRolesLabel, hasPermission } from './services/rbac';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardHome } from './components/DashboardHome';
import { JurisdictionDashboardWrapper } from './components/JurisdictionDashboardWrapper';
import { ModuleManagement } from './components/ModuleManagement';
import { RideModuleView } from './components/RideModuleView';
import { TruckDeliveryView } from './components/TruckDeliveryView';
import { CustomersView } from './components/CustomersView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { CommandPalette } from './components/CommandPalette';
import { NotificationDrawer } from './components/NotificationDrawer';
import { DatabaseModal } from './components/DatabaseModal';
import { FlutterSdkModal } from './components/FlutterSdkModal';
import { RegisterModuleModal } from './components/RegisterModuleModal';
import { DynamicModuleView } from './components/DynamicModuleView';
import { GpsDispatchSimulator } from './components/GpsDispatchSimulator';
import { VisualSchemaEditorModal } from './components/VisualSchemaEditorModal';
import { LiveQueryWebhooksView } from './components/LiveQueryWebhooksView';
import { AmbaLayMapsConsole } from './components/AmbaLayMapsConsole';
import { GeofenceManager } from './components/GeofenceManager';
import { PaymentSettlementsView } from './components/PaymentSettlementsView';
import { FleetComplianceView } from './components/FleetComplianceView';
import { DriverCompanionSimulator } from './components/DriverCompanionSimulator';
import { SuperAppApprovalsView } from './components/SuperAppApprovalsView';
import { FleetBiddingEscrowView } from './components/FleetBiddingEscrowView';
import { PricingSurgeFlagsView } from './components/PricingSurgeFlagsView';
import { SuperAppMonorepoView } from './components/SuperAppMonorepoView';
import { Back4AppDatabaseClassesView } from './components/Back4AppDatabaseClassesView';
import { BridgeDiagnosticsView } from './components/BridgeDiagnosticsView';
import { NotificationsView } from './components/NotificationsView';
import { CommerceLifestyleStandbyView } from './components/CommerceLifestyleStandbyView';
import { CommerceVerticalKey } from './services/eastAfricaCommerce';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DEFAULT_EAST_AFRICA_NOTIFICATIONS } from './services/notifications';
import { X, Smartphone, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

const INITIAL_NOTIFICATIONS: NotificationItem[] = DEFAULT_EAST_AFRICA_NOTIFICATIONS;

export default function App() {
  // Authentication & RBAC persona state
  const [currentUser, setCurrentUser] = useState<AdminUser | null>({
    name: 'Daniel Ferede',
    email: 'daniel@afronala.com',
    role: 'Super Admin',
    avatar: '/src/assets/images/avatar_admin_daniel_1792851958392.jpg',
    status: 'online',
    jurisdictionCountry: 'ET',
    jurisdictionName: 'Ethiopia (Headquarters)',
    assignedCorridors: ['Addis Ababa Urban Grid', 'Modjo Dry Port - Djibouti Corridor'],
  });

  // Theme state synced to document.documentElement for Tailwind v4 @custom-variant dark
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('afronala_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Sync active admin role into Back4App proxy header
  useEffect(() => {
    back4AppService.setAdminRole(currentUser?.role || 'Super Admin');
  }, [currentUser]);

  // Navigation & layout state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Modals & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isFlutterModalOpen, setIsFlutterModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSchemaEditorOpen, setIsSchemaEditorOpen] = useState(false);
  const [schemaEditorModuleKey, setSchemaEditorModuleKey] = useState<string>('ride');
  const [isDriverSimulatorOpen, setIsDriverSimulatorOpen] = useState(false);
  const [activeDriverOffer, setActiveDriverOffer] = useState<ActiveDriverTripOffer | null>(null);

  // Data state
  const [modules, setModules] = useState<ModuleItem[]>(DEFAULT_MODULES);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<CustomerAccount[]>(DEFAULT_CUSTOMERS);
  const [alerts, setAlerts] = useState<SystemAlert[]>(DEFAULT_ALERTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dbStatus, setDbStatus] = useState<{ online: boolean; latency: number }>({ online: true, latency: 85 });
  const [activePulses, setActivePulses] = useState<TriggeredActivityPulse[]>(() =>
    back4AppService.getActiveActivityPulses()
  );

  // Non-blocking toast system (replaces prohibited window.alert)
  const pushToast = useCallback(
    (title: string, message?: string, type: ToastMessage['type'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  // RBAC Permission Guard with Security Audit Trail
  const guardPermission = useCallback(
    (action: PermissionAction, featureLabel: string): boolean => {
      const role = currentUser?.role || 'Super Admin';
      if (hasPermission(role, action)) {
        return true;
      }
      const requiredLabel = getRequiredRolesLabel(action);
      pushToast(
        `Access Restricted (${role})`,
        `"${featureLabel}" requires ${requiredLabel} authority.`,
        'warning'
      );
      const auditNotif: NotificationItem = {
        id: 'n-sec-' + Date.now(),
        title: `RBAC Action Blocked: ${featureLabel}`,
        subtitle: `${currentUser?.name || 'Operator'} (${role}) attempted restricted action requiring ${requiredLabel}.`,
        timeAgo: 'Just now',
        category: 'security',
        read: false,
        type: 'system',
      };
      setNotifications((prev) => [auditNotif, ...prev]);
      return false;
    },
    [currentUser, pushToast]
  );

  const handleSwitchPersona = (persona: AdminUser) => {
    setCurrentUser(persona);
    back4AppService.setAdminRole(persona.role);
    pushToast(
      `Active Persona: ${persona.name}`,
      `Switched governance scope to ${persona.role}.`,
      'info'
    );
    const switchNotif: NotificationItem = {
      id: 'n-role-' + Date.now(),
      title: `Session Persona Switched to ${persona.role}`,
      subtitle: `Active operator: ${persona.name} (${persona.email})`,
      timeAgo: 'Just now',
      category: 'security',
      read: false,
      type: 'system',
    };
    setNotifications((prev) => [switchNotif, ...prev]);
  };

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('afronala_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Load initial data via server-proxied Back4App service
  const refreshAllData = async () => {
    try {
      const [
        health,
        remoteMods,
        remoteDrivers,
        remoteVehicles,
        remoteTrips,
        remoteShipments,
        remoteCustomers,
        remoteAlerts,
      ] = await Promise.all([
        back4AppService.checkHealth(),
        back4AppService.getModules(),
        back4AppService.getDrivers(),
        back4AppService.getVehicles(),
        back4AppService.getTrips(),
        back4AppService.getShipments(),
        back4AppService.getCustomers(),
        back4AppService.getAlerts(),
      ]);

      setDbStatus({ online: health.online, latency: health.latency });
      setModules(remoteMods);
      setDrivers(remoteDrivers);
      setVehicles(remoteVehicles);
      setTrips(remoteTrips);
      setShipments(remoteShipments);
      setCustomers(remoteCustomers);
      setAlerts(remoteAlerts);
    } catch (err) {
      console.warn('Initial load error:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handlePulsesUpdated = useCallback(
    (pulses: TriggeredActivityPulse[], newlyTriggered: TriggeredActivityPulse[] = []) => {
      setActivePulses(pulses);
      if (newlyTriggered.length > 0) {
        const mappedNotifs: NotificationItem[] = newlyTriggered.map((p) => ({
          id: `n-pulse-${p.id}`,
          title: `Threshold Pulse: ${p.ruleName}`,
          subtitle: `Observed ${p.observedCount} events within ${p.windowMinutes}m (rule ${p.operator} ${p.threshold}).`,
          timeAgo: 'Just now',
          category: 'operations',
          read: false,
          type: 'system',
        }));
        setNotifications((prev) => [...mappedNotifs, ...prev]);
      }
    },
    []
  );

  const handleAcknowledgePulse = useCallback(
    (pulseId: string) => {
      const next = back4AppService.acknowledgeActivityPulse(pulseId);
      setActivePulses(next);
      pushToast('Visual Pulse Acknowledged', 'Cleared threshold alert beacon from Dashboard.', 'info');
    },
    [pushToast]
  );

  const handleAcknowledgeAllPulses = useCallback(() => {
    const next = back4AppService.acknowledgeAllActivityPulses();
    setActivePulses(next);
    pushToast('All Visual Pulses Cleared', 'Acknowledged all active threshold alerts.', 'info');
  }, [pushToast]);

  // Background Activity Stream threshold evaluation when not on BridgeDiagnosticsView
  useEffect(() => {
    if (activeTab === 'superapp-diagnostics') return;
    const evaluateInBackground = async () => {
      try {
        const stream = await back4AppService.getActivityStream({ limit: 60 });
        const evalRes = back4AppService.evaluateActivityAlertRules(stream.events || []);
        handlePulsesUpdated(evalRes.activePulses, evalRes.newlyTriggered);
        if (evalRes.newlyTriggered.length > 0) {
          const top = evalRes.newlyTriggered[0];
          pushToast(
            `Dashboard Alert Pulse: ${top.ruleName}`,
            `Observed ${top.observedCount} events within ${top.windowMinutes}m (${top.operator} ${top.threshold}).`,
            top.severity === 'critical' ? 'error' : 'warning'
          );
        }
      } catch {
        // Ignore transient background poll errors
      }
    };
    const timer = window.setInterval(evaluateInBackground, 20000);
    return () => window.clearInterval(timer);
  }, [activeTab, handlePulsesUpdated, pushToast]);

  // Keyboard shortcut listener for Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Module toggle handler
  const handleToggleModule = async (key: string, enabled: boolean) => {
    if (!guardPermission('manage_modules', `Toggle ${key} module`)) return;
    const updated = await back4AppService.toggleModule(key, enabled);
    setModules(updated);

    if (!enabled && activeTab === key) {
      setActiveTab('dashboard');
    }

    const mod = modules.find((m) => m.key === key);
    const newNotif: NotificationItem = {
      id: 'n-' + Date.now(),
      title: `Module ${mod?.name || key} ${enabled ? 'Enabled' : 'Disabled'}`,
      subtitle: 'Back4App ModuleRegistry updated and sidebar routes synchronized.',
      timeAgo: 'Just now',
      category: 'system',
      read: false,
      type: 'system',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    pushToast(
      `${mod?.name || key} ${enabled ? 'Enabled' : 'Disabled'}`,
      'Sidebar navigation and Parse routes updated.',
      'success'
    );
  };

  // Country-scoped module toggle handler
  const handleToggleModuleCountry = async (
    key: string,
    countryCode: Exclude<EastAfricaCountryCode, 'ALL'>,
    enabled: boolean
  ) => {
    if (!guardPermission('manage_modules', `Toggle ${key} in ${countryCode}`)) return;
    const updated = await back4AppService.toggleModuleCountry(key, countryCode, enabled);
    setModules(updated);
  };

  // Country-scoped module config update handler
  const handleUpdateModuleCountryConfig = async (
    key: string,
    countryCode: Exclude<EastAfricaCountryCode, 'ALL'>,
    config: Partial<EastAfricaModuleCountryConfig>
  ) => {
    if (!guardPermission('manage_modules', `Update ${key} parameters in ${countryCode}`)) return;
    const updated = await back4AppService.updateModuleCountryConfig(key, countryCode, config);
    setModules(updated);
  };

  // Drivers CRUD
  const handleAddDriver = async (driver: Omit<Driver, 'objectId'>) => {
    if (!guardPermission('manage_ride', 'Register Ride driver')) return;
    const saved = await back4AppService.addDriver(driver);
    setDrivers((prev) => [saved, ...prev]);
  };

  const handleUpdateDriverStatus = async (id: string, status: DriverStatus) => {
    if (!guardPermission('manage_ride', 'Update driver status')) return;
    await back4AppService.updateDriverStatus(id, status);
    setDrivers((prev) => prev.map((d) => (d.objectId === id ? { ...d, status } : d)));
    pushToast('Driver Status Updated', `Driver status changed to ${status}.`, 'success');
  };

  const handleDeleteDriver = async (id: string) => {
    if (!guardPermission('manage_ride', 'Delete driver record')) return;
    await back4AppService.deleteDriver(id);
    setDrivers((prev) => prev.filter((d) => d.objectId !== id));
    pushToast('Driver Removed', 'Driver record removed from fleet directory.', 'info');
  };

  // Vehicles CRUD
  const handleAddVehicle = async (vehicle: Omit<Vehicle, 'objectId'>) => {
    if (!guardPermission('manage_ride', 'Add fleet vehicle')) return;
    const saved = await back4AppService.addVehicle(vehicle);
    setVehicles((prev) => [saved, ...prev]);
  };

  const handleUpdateVehicleStatus = async (id: string, status: VehicleStatus) => {
    if (!guardPermission('manage_ride', 'Update vehicle inspection status')) return;
    await back4AppService.updateVehicleStatus(id, status);
    setVehicles((prev) => prev.map((v) => (v.objectId === id ? { ...v, status } : v)));
    pushToast('Vehicle Status Updated', `Fleet vehicle marked as ${status}.`, 'success');
  };

  // Shipments CRUD & Lifecycle Progression
  const handleAddShipment = async (shipment: Shipment) => {
    if (!guardPermission('manage_freight', 'Create freight shipment manifest')) return;
    const updated = await back4AppService.addShipment(shipment);
    setShipments(updated);
  };

  const handleUpdateShipmentStatus = async (shipmentId: string, status: ShipmentStatus) => {
    if (!guardPermission('manage_freight', `Advance shipment ${shipmentId} to ${status}`)) return;
    const updated = await back4AppService.updateShipmentStatus(shipmentId, status);
    setShipments(updated);

    const newNotif: NotificationItem = {
      id: 'n-' + Date.now(),
      title: `Shipment ${shipmentId} → ${status}`,
      subtitle: `Freight manifest updated by ${currentUser?.name || 'Coordinator'}.`,
      timeAgo: 'Just now',
      category: 'operations',
      read: false,
      type: 'shipment',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Customers & Corporate Shippers CRUD
  const handleAddCustomer = async (customer: Omit<CustomerAccount, 'objectId' | 'customerId'>) => {
    if (!guardPermission('manage_customers', 'Create customer or shipper account')) return;
    const created = await back4AppService.addCustomer(customer);
    setCustomers((prev) => [created, ...prev]);
  };

  const handleUpdateCustomer = async (customerId: string, updates: Partial<CustomerAccount>) => {
    if (!guardPermission('manage_customers', `Update account ${customerId}`)) return;
    const updated = await back4AppService.updateCustomer(customerId, updates);
    setCustomers(updated);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!guardPermission('manage_customers', `Delete account ${customerId}`)) return;
    const updated = await back4AppService.deleteCustomer(customerId);
    setCustomers(updated);
  };

  // Alert resolution
  const handleResolveAlert = async (alertIdOrIndex: string | number) => {
    const updated = await back4AppService.resolveAlert(alertIdOrIndex);
    setAlerts(updated);
    pushToast('Alert Acknowledged', 'Operational alert marked as resolved.', 'success');
  };

  const handleForceSync = async () => {
    if (!guardPermission('manage_modules', 'Force Back4App cloud sync')) return;
    await back4AppService.forceSyncToCloud();
    await refreshAllData();
  };

  const handleRegisterNewModule = async (data: {
    name: string;
    key: string;
    description: string;
    category: string;
    icon: string;
    enabled: boolean;
    customClasses: string[];
    targetCountries?: Exclude<EastAfricaCountryCode, 'ALL'>[];
  }) => {
    if (!guardPermission('manage_modules', `Register ${data.name} module`)) return;
    const newMod = await back4AppService.registerNewModule(data);
    setModules((prev) => {
      const filtered = prev.filter((m) => m.key !== newMod.key && m.key !== 'more');
      const moreMod = prev.find((m) => m.key === 'more') || {
        id: 'mod-9',
        key: 'more',
        name: 'More Modules',
        description: 'Custom micro-services, public transport & scheduled shuttles.',
        icon: 'Sparkles',
        enabled: false,
        statusText: 'Coming Soon',
        category: 'Platform',
        canToggle: false,
      };
      return [...filtered, newMod, moreMod];
    });

    const newNotif: NotificationItem = {
      id: 'n-' + Date.now(),
      title: `New Module Registered: ${data.name}`,
      subtitle: `Provisioned Back4App classes: ${data.customClasses.join(', ')}`,
      timeAgo: 'Just now',
      category: 'system',
      read: false,
      type: 'system',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    pushToast(`Module Provisioned: ${data.name}`, `Classes ${data.customClasses.join(', ')} created.`, 'success');

    if (data.enabled) {
      setActiveTab(`module-${newMod.key}`);
    }
  };

  const handleSyncDispatchTrip = async (job: DispatchJob) => {
    const newTrip = await back4AppService.syncDispatchJobToTrip(job);
    setTrips((prev) => [newTrip, ...prev]);

    setActiveDriverOffer({
      offerId: `off-${Date.now()}`,
      tripId: job.tripId,
      passengerName: job.passenger,
      passengerRating: 4.88,
      pickupAddress: job.pickupName,
      dropoffAddress: job.dropoffName,
      fareETB: job.fareETB,
      paymentMethod: 'telebirr',
      distanceKm: job.distanceKm,
      durationMin: job.etaMinutes || 22,
      expiresAt: Date.now() + 15000,
    });
    setIsDriverSimulatorOpen(true);

    const newNotif: NotificationItem = {
      id: 'n-' + Date.now(),
      title: `GPS Dispatch: ${job.tripId} Broadcasted`,
      subtitle: `${job.passenger} · ${job.pickupName} → ${job.dropoffName} (ETB ${job.fareETB})`,
      timeAgo: 'Just now',
      category: 'operations',
      read: false,
      type: 'trip',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return newTrip;
  };

  const handleOpenSchemaEditor = (moduleKey?: string) => {
    if (!guardPermission('manage_modules', 'Open Visual Schema Designer')) return;
    if (moduleKey) setSchemaEditorModuleKey(moduleKey);
    setIsSchemaEditorOpen(true);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!currentUser) {
    return (
      <LoginView
        onLogin={(user) => {
          setCurrentUser(user);
          back4AppService.setAdminRole(user.role);
        }}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 select-none ${
        darkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Bar Header */}
      <TopBar
        user={currentUser}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenDispatchSimulator={() => setActiveTab('dispatch')}
        onOpenSchemaEditor={() => handleOpenSchemaEditor('ride')}
        onOpenAmbaLay={() => setActiveTab('ambalay')}
        onOpenFlutterModal={() => setIsFlutterModalOpen(true)}
        onOpenRegisterModal={() => {
          if (!guardPermission('manage_modules', 'Open Register New Module dialog')) return;
          setIsRegisterModalOpen(true);
        }}
        onOpenDriverSimulator={() => setIsDriverSimulatorOpen(true)}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        unreadCount={unreadCount}
        dbStatus={dbStatus}
        onSelectDashboard={() => setActiveTab('dashboard')}
        onSwitchPersona={handleSwitchPersona}
        onLogout={() => setCurrentUser(null)}
        onNavigateTab={(tab, filterValue) => {
          setActiveTab(tab);
          if (filterValue) {
            pushToast('Universal Search Jump', `Navigated to ${tab} · Filter: "${filterValue}"`, 'info');
          }
        }}
        drivers={drivers}
        vehicles={vehicles}
        trips={trips}
        shipments={shipments}
        customers={customers}
        modules={modules}
        alerts={alerts}
      />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex shrink-0">
          <Sidebar
            modules={modules}
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            darkMode={darkMode}
            unreadCount={unreadCount}
            activePulseCount={activePulses.length}
            onLogout={() => setCurrentUser(null)}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 h-full z-50">
              <Sidebar
                modules={modules}
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setMobileSidebarOpen(false);
                }}
                collapsed={false}
                onToggleCollapse={() => setMobileSidebarOpen(false)}
                darkMode={darkMode}
                unreadCount={unreadCount}
                activePulseCount={activePulses.length}
                onLogout={() => setCurrentUser(null)}
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary
            key={activeTab}
            fallbackTitle={`Module View Error (${activeTab})`}
            onReset={() => setActiveTab('dashboard')}
          >
            {activeTab === 'dashboard' && (
            <JurisdictionDashboardWrapper
              user={currentUser}
              darkMode={darkMode}
              trips={trips}
              shipments={shipments}
              drivers={drivers}
              alerts={alerts}
              activePulses={activePulses}
              onAcknowledgePulse={handleAcknowledgePulse}
              onAcknowledgeAllPulses={handleAcknowledgeAllPulses}
              onResolveAlert={handleResolveAlert}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSwitchPersona={handleSwitchPersona}
              onPushToast={pushToast}
            />
          )}

          {activeTab === 'modules' && (
            <ModuleManagement
              modules={modules}
              darkMode={darkMode}
              user={currentUser}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              onToggleModule={handleToggleModule}
              onToggleModuleCountry={handleToggleModuleCountry}
              onUpdateModuleCountryConfig={handleUpdateModuleCountryConfig}
              onForceSync={handleForceSync}
              onOpenRegisterModal={() => {
                if (!guardPermission('manage_modules', 'Open Register New Module dialog')) return;
                setIsRegisterModalOpen(true);
              }}
              onOpenSchemaEditor={handleOpenSchemaEditor}
              onSelectModule={(key) => {
                if (key === 'ride' || key === 'truck') {
                  setActiveTab(key);
                } else {
                  setActiveTab(`module-${key}`);
                }
              }}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'commerce-standby' && (
            <CommerceLifestyleStandbyView
              darkMode={darkMode}
              user={currentUser}
              userRole={currentUser.role}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
              onNavigateModules={() => setActiveTab('modules')}
            />
          )}

          {activeTab.startsWith('module-') &&
            (() => {
              const modKey = activeTab.replace('module-', '');
              const isCommerceVertical = ['food', 'marketplace', 'events', 'hotels', 'courier', 'wallet'].includes(modKey);
              if (isCommerceVertical) {
                return (
                  <CommerceLifestyleStandbyView
                    darkMode={darkMode}
                    user={currentUser}
                    userRole={currentUser.role}
                    initialVertical={modKey as CommerceVerticalKey}
                    onGuardPermission={guardPermission}
                    onNotify={pushToast}
                    onNavigateModules={() => setActiveTab('modules')}
                  />
                );
              }

              const targetMod = modules.find((m) => m.key === modKey);
              if (!targetMod) {
                return (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <p>Module not found or currently disabled.</p>
                    <button
                      onClick={() => setActiveTab('modules')}
                      className="mt-2 text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                    >
                      Return to Module Management
                    </button>
                  </div>
                );
              }
              return (
                <DynamicModuleView
                  module={targetMod}
                  darkMode={darkMode}
                  userRole={currentUser.role}
                  onNavigateModules={() => setActiveTab('modules')}
                  onOpenSchemaEditor={handleOpenSchemaEditor}
                  onGuardPermission={guardPermission}
                  onNotify={pushToast}
                />
              );
            })()}

          {activeTab === 'dispatch' && (
            <GpsDispatchSimulator
              darkMode={darkMode}
              drivers={drivers}
              onSyncTripToBack4App={handleSyncDispatchTrip}
              user={currentUser}
              jurisdictionCountry={currentUser.jurisdictionCountry}
              onSwitchPersona={handleSwitchPersona}
              onPushToast={pushToast}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'livequery' && (
            <LiveQueryWebhooksView
              darkMode={darkMode}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              currentUserName={currentUser.name}
              currentUserEmail={currentUser.email}
              assignedCorridors={currentUser.assignedCorridors}
              onNotify={pushToast}
              onGuardPermission={guardPermission}
            />
          )}

          {activeTab === 'ambalay' && <AmbaLayMapsConsole darkMode={darkMode} />}

          {activeTab === 'geofences' && (
            <GeofenceManager
              darkMode={darkMode}
              drivers={drivers}
              user={currentUser}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'settlements' && (
            <PaymentSettlementsView
              darkMode={darkMode}
              user={currentUser}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userName={currentUser.name}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'compliance' && (
            <FleetComplianceView
              darkMode={darkMode}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'superapp-approvals' && (
            <SuperAppApprovalsView
              darkMode={darkMode}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              userName={currentUser.name}
              userEmail={currentUser.email}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'superapp-bidding' && (
            <FleetBiddingEscrowView
              darkMode={darkMode}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              userName={currentUser.name}
              userEmail={currentUser.email}
              drivers={drivers}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'superapp-pricing' && (
            <PricingSurgeFlagsView
              darkMode={darkMode}
              user={currentUser}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              userName={currentUser.name}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'superapp-inspector' && (
            <SuperAppMonorepoView
              darkMode={darkMode}
              userRole={currentUser.role}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'back4app-classes' && (
            <Back4AppDatabaseClassesView
              darkMode={darkMode}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              currentUserName={currentUser.name}
              currentUserEmail={currentUser.email}
              assignedCorridors={currentUser.assignedCorridors}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'superapp-diagnostics' && (
            <BridgeDiagnosticsView
              darkMode={darkMode}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              userName={currentUser.name}
              userEmail={currentUser.email}
              activePulses={activePulses}
              onPulsesUpdated={handlePulsesUpdated}
              onAcknowledgePulse={handleAcknowledgePulse}
              onNavigateDashboard={() => setActiveTab('dashboard')}
              onSchemaResynced={refreshAllData}
              onNotify={pushToast}
            />
          )}

          {(activeTab === 'ride' || activeTab.startsWith('ride-')) && (
            <RideModuleView
              darkMode={darkMode}
              drivers={drivers}
              vehicles={vehicles}
              trips={trips}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              userName={currentUser.name}
              userEmail={currentUser.email}
              onAddDriver={handleAddDriver}
              onUpdateDriverStatus={handleUpdateDriverStatus}
              onDeleteDriver={handleDeleteDriver}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicleStatus={handleUpdateVehicleStatus}
              onOpenDispatchSimulator={() => setActiveTab('dispatch')}
              onNotify={pushToast}
              onGuardPermission={guardPermission}
            />
          )}

          {(activeTab === 'truck' || activeTab.startsWith('truck-')) && (
            <TruckDeliveryView
              darkMode={darkMode}
              shipments={shipments}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              userName={currentUser.name}
              userEmail={currentUser.email}
              onAddShipment={handleAddShipment}
              onUpdateShipmentStatus={handleUpdateShipmentStatus}
              onNotify={pushToast}
              onGuardPermission={guardPermission}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              darkMode={darkMode}
              customers={customers}
              trips={trips}
              shipments={shipments}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              currentUserName={currentUser.name}
              currentUserEmail={currentUser.email}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onNotify={pushToast}
              onGuardPermission={guardPermission}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              darkMode={darkMode}
              trips={trips}
              shipments={shipments}
              user={currentUser}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              userName={currentUser.name}
              userEmail={currentUser.email}
              onGuardPermission={guardPermission}
              onNotify={pushToast}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              darkMode={darkMode}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              userName={currentUser.name}
              userEmail={currentUser.email}
              assignedCorridors={currentUser.assignedCorridors}
              notifications={notifications}
              onUpdateNotifications={setNotifications}
              onNavigateTab={(tab, filterValue) => {
                setActiveTab(tab);
                if (filterValue) {
                  pushToast('Navigated', `Switched to ${tab} · Filter: ${filterValue}`, 'info');
                }
              }}
              onOpenDrawer={() => setIsNotificationDrawerOpen(true)}
              onNotify={pushToast}
              onGuardPermission={guardPermission}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              darkMode={darkMode}
              user={currentUser}
              userRole={currentUser.role}
              userJurisdiction={currentUser.jurisdictionCountry}
              userJurisdictionName={currentUser.jurisdictionName}
              assignedCorridors={currentUser.assignedCorridors}
              onToggleTheme={toggleTheme}
              onOpenDbModal={() => setIsDbModalOpen(true)}
              onOpenFlutterModal={() => setIsFlutterModalOpen(true)}
              onSwitchPersona={handleSwitchPersona}
              onNotify={pushToast}
              onGuardPermission={guardPermission}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab, filterValue) => {
          if (tab === 'open-palette') {
            setIsCommandPaletteOpen(true);
          } else {
            setActiveTab(tab);
            if (filterValue) {
              pushToast('Universal Search Jump', `Navigated to ${tab} · Filter: "${filterValue}"`, 'info');
            }
          }
        }}
        onToggleTheme={toggleTheme}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenFlutterModal={() => setIsFlutterModalOpen(true)}
        onOpenRegisterModal={() => {
          if (!guardPermission('manage_modules', 'Open Register New Module dialog')) return;
          setIsRegisterModalOpen(true);
        }}
        onOpenSchemaModal={() => handleOpenSchemaEditor('ride')}
        onOpenDriverSimulator={() => setIsDriverSimulatorOpen(true)}
        darkMode={darkMode}
        drivers={drivers}
        vehicles={vehicles}
        trips={trips}
        shipments={shipments}
        customers={customers}
        modules={modules}
        alerts={alerts}
      />

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        onMarkRead={(id) =>
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        }
        darkMode={darkMode}
        userJurisdiction={currentUser.jurisdictionCountry}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Back4App Database Inspector Modal */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        darkMode={darkMode}
        onRefreshData={refreshAllData}
      />

      {/* Flutter SDK Code Export Modal */}
      <FlutterSdkModal
        isOpen={isFlutterModalOpen}
        onClose={() => setIsFlutterModalOpen(false)}
        darkMode={darkMode}
      />

      {/* Register New Module Dialog Modal */}
      <RegisterModuleModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        darkMode={darkMode}
        onRegister={handleRegisterNewModule}
      />

      {/* Visual Back4App Class Schema Designer Modal */}
      <VisualSchemaEditorModal
        isOpen={isSchemaEditorOpen}
        onClose={() => setIsSchemaEditorOpen(false)}
        modules={modules}
        selectedModuleKey={schemaEditorModuleKey}
        onSchemaUpdated={(updated) => setModules(updated)}
        darkMode={darkMode}
      />

      {/* Non-Blocking Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
          {toasts.map((toast) => {
            const Icon =
              toast.type === 'success'
                ? CheckCircle2
                : toast.type === 'warning'
                ? ShieldAlert
                : toast.type === 'error'
                ? AlertTriangle
                : Info;
            const iconColor =
              toast.type === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : toast.type === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : toast.type === 'error'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-cyan-600 dark:text-cyan-400';

            return (
              <div
                key={toast.id}
                className="pointer-events-auto p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{toast.title}</p>
                    {toast.message && (
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {toast.message}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* In-Cab Driver PWA Mobile Companion Simulator Slideout Overlay */}
      {isDriverSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="relative flex flex-col items-center">
            <div className="flex items-center justify-between w-full max-w-[360px] mb-2 px-2">
              <div className="flex items-center gap-1.5 text-xs text-white">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">In-Cab Driver Simulator</span>
                <span className="text-[10px] text-cyan-400 font-mono">PWA</span>
              </div>
              <button
                onClick={() => setIsDriverSimulatorOpen(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Close Driver Phone HUD"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <DriverCompanionSimulator
              darkMode={darkMode}
              activeOffer={activeDriverOffer}
              drivers={drivers}
              onTripCompleted={(trip) => {
                const newNotif: NotificationItem = {
                  id: 'n-' + Date.now(),
                  title: `Trip Completed via Driver Phone: ${trip.tripId}`,
                  subtitle: `Passenger ${trip.passenger} · Fare ETB ${trip.fareETB} settled to wallet`,
                  timeAgo: 'Just now',
                  category: 'operations',
                  read: false,
                  type: 'trip',
                };
                setNotifications((prev) => [newNotif, ...prev]);
              }}
              onAcceptOffer={(offer) => {
                const newNotif: NotificationItem = {
                  id: 'n-' + Date.now(),
                  title: `Driver Accepted: ${offer.tripId}`,
                  subtitle: `${offer.passengerName} picked up on route to ${offer.dropoffAddress.split(',')[0]}`,
                  timeAgo: 'Just now',
                  category: 'operations',
                  read: false,
                  type: 'trip',
                };
                setNotifications((prev) => [newNotif, ...prev]);
              }}
              onDeclineOffer={(offer) => {
                const newNotif: NotificationItem = {
                  id: 'n-' + Date.now(),
                  title: `Driver Declined: ${offer.tripId}`,
                  subtitle: `Trip ${offer.tripId} re-queued to autonomous dispatcher radar`,
                  timeAgo: 'Just now',
                  category: 'operations',
                  read: false,
                  type: 'trip',
                };
                setNotifications((prev) => [newNotif, ...prev]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
