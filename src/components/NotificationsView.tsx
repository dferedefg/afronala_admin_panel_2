import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldAlert,
  Compass,
  ArrowRight,
  Download,
  Share2,
  Trash2,
  Radio,
  ExternalLink,
  Truck,
  Car,
  FileCheck2,
  CreditCard,
  Plus,
  X,
  Send,
  Eye,
  EyeOff,
  Flame,
  Globe,
  MapPin,
  Clock,
  RotateCcw,
  PhoneCall,
  Siren,
  Building2,
  Layers,
  Sparkles,
  Smartphone,
  Navigation,
} from 'lucide-react';
import {
  EastAfricaCountryCode,
  NotificationCategory,
  NotificationItem,
  NotificationSeverity,
  PermissionAction,
  ToastMessage,
} from '../types';
import {
  EAST_AFRICA_NOTIFICATION_COUNTRIES,
  filterNotifications,
  createBroadcastNotification,
  simulateEmergencySos,
  BroadcastAlertInput,
  exportNotificationsAsCsv,
  downloadFile,
} from '../services/notifications';

interface NotificationsViewProps {
  darkMode: boolean;
  userRole: string;
  userJurisdiction?: EastAfricaCountryCode;
  userJurisdictionName?: string;
  userName?: string;
  userEmail?: string;
  assignedCorridors?: string[];
  notifications: NotificationItem[];
  onUpdateNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  onNavigateTab: (tab: string, filterValue?: string) => void;
  onOpenDrawer: () => void;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  darkMode,
  userRole,
  userJurisdiction = 'ET',
  userJurisdictionName = 'Ethiopia',
  userName = 'Operations Officer',
  userEmail = 'operator@afronala.com',
  assignedCorridors = ['Addis Ababa - Modjo - Adama Corridor'],
  notifications,
  onUpdateNotifications,
  onNavigateTab,
  onOpenDrawer,
  onNotify,
  onGuardPermission,
}) => {
  // Determine operator's default station
  const defaultCountryScope: EastAfricaCountryCode =
    userJurisdiction && userJurisdiction !== 'ALL' ? userJurisdiction : 'ALL';

  // State: Filters
  const [selectedCountry, setSelectedCountry] = useState<EastAfricaCountryCode>(defaultCountryScope);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync selected country if operator switches persona
  useEffect(() => {
    if (userJurisdiction && userJurisdiction !== 'ALL') {
      setSelectedCountry(userJurisdiction);
    }
  }, [userJurisdiction]);

  // Current operator station metadata
  const operatorStationMeta =
    userJurisdiction && userJurisdiction !== 'ALL'
      ? EAST_AFRICA_NOTIFICATION_COUNTRIES[userJurisdiction]
      : EAST_AFRICA_NOTIFICATION_COUNTRIES['ET'];

  // State: Broadcast Modal
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [broadcastForm, setBroadcastForm] = useState<BroadcastAlertInput>({
    title: '',
    subtitle: '',
    countryCode: defaultCountryScope,
    corridor: operatorStationMeta?.primaryCorridor || '',
    category: 'dispatch',
    severity: 'warning',
    targetModule: 'dispatch',
    actionLabel: 'View Dispatch Radar',
    recipientAudience: 'all',
    sourceAuthority: operatorStationMeta?.regulator || '',
  });

  // Calculate telemetry stats
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter((n) => n.severity === 'critical' && !n.read).length;
  const warningCount = notifications.filter((n) => n.severity === 'warning' && !n.read).length;

  // Unread counts per country
  const unreadByCountry = useMemo(() => {
    const map: Record<string, number> = {};
    notifications.forEach((n) => {
      if (!n.read && n.countryCode) {
        map[n.countryCode] = (map[n.countryCode] || 0) + 1;
      }
    });
    return map;
  }, [notifications]);

  // Critical counts per country
  const criticalByCountry = useMemo(() => {
    const map: Record<string, number> = {};
    notifications.forEach((n) => {
      if (n.severity === 'critical' && !n.read && n.countryCode) {
        map[n.countryCode] = (map[n.countryCode] || 0) + 1;
      }
    });
    return map;
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return filterNotifications(notifications, {
      countryCode: selectedCountry,
      category: selectedCategory,
      severity: selectedSeverity,
      status: selectedStatus,
      searchQuery,
    });
  }, [notifications, selectedCountry, selectedCategory, selectedSeverity, selectedStatus, searchQuery]);

  // Actions
  const handleToggleRead = (id: string) => {
    onUpdateNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: !item.read } : item))
    );
  };

  const handleMarkAllRead = () => {
    onUpdateNotifications((prev) =>
      prev.map((item) => {
        if (selectedCountry === 'ALL' || item.countryCode === selectedCountry) {
          return { ...item, read: true };
        }
        return item;
      })
    );
    onNotify(
      'Notifications Updated',
      selectedCountry === 'ALL'
        ? 'All notifications marked as read across all 8 nations.'
        : `Marked all notifications for ${selectedCountry} as read.`,
      'success'
    );
  };

  const handleAcknowledgeAlert = (id: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' EAT';
    onUpdateNotifications((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            read: true,
            acknowledgedBy: userName,
            acknowledgedAt: timeStr,
          };
        }
        return item;
      })
    );
    onNotify('Alert Acknowledged', `Action logged under operator: ${userName} at ${timeStr}.`, 'success');
  };

  const handleSendDriverPush = (item: NotificationItem) => {
    onNotify(
      'In-Cab Push Dispatched',
      `Sent push alert to active drivers along ${item.corridor || item.countryName || 'the arterial corridor'}.`,
      'info'
    );
  };

  const handleDeleteNotification = (id: string) => {
    onUpdateNotifications((prev) => prev.filter((item) => item.id !== id));
    onNotify('Notification Dismissed', 'Item removed from active audit stream.', 'info');
  };

  const handleSimulateSos = () => {
    const targetCountry = selectedCountry === 'ALL' ? (userJurisdiction !== 'ALL' ? userJurisdiction : 'ET') : selectedCountry;
    const sosNotif = simulateEmergencySos(
      targetCountry,
      undefined,
      userName
    );
    onUpdateNotifications((prev) => [sosNotif, ...prev]);
    onNotify(
      `🚨 EMERGENCY SOS SIMULATED (${targetCountry})`,
      `Distress panic protocol activated along ${sosNotif.corridor}. National Highway Authority alerted.`,
      'error'
    );
  };

  const handleExportCsv = () => {
    const csvData = exportNotificationsAsCsv(filteredNotifications);
    const filename = `afronala-dispatch-alerts-${selectedCountry.toLowerCase()}-${Date.now()}.csv`;
    downloadFile(filename, csvData, 'text/csv;charset=utf-8;');
    onNotify('Export Successful', `Exported ${filteredNotifications.length} notifications as CSV for ${selectedCountry}.`, 'success');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredNotifications, null, 2);
    const filename = `afronala-dispatch-alerts-${selectedCountry.toLowerCase()}-${Date.now()}.json`;
    downloadFile(filename, jsonStr, 'application/json');
    onNotify('Export Successful', `Exported ${filteredNotifications.length} records as JSON.`, 'success');
  };

  const handleResetFilters = () => {
    setSelectedCountry(userJurisdiction !== 'ALL' ? userJurisdiction : 'ALL');
    setSelectedCategory('all');
    setSelectedSeverity('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  // Preset Template loader for broadcast modal
  const handleApplyTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const code = broadcastForm.countryCode !== 'ALL' ? broadcastForm.countryCode : (userJurisdiction !== 'ALL' ? userJurisdiction : 'ET');
    const meta = EAST_AFRICA_NOTIFICATION_COUNTRIES[code];

    if (templateKey === 'weather') {
      setBroadcastForm((prev) => ({
        ...prev,
        title: `Heavy Rainfall & Flash Flood Advisory on ${meta.primaryCorridor}`,
        subtitle: `Surface water hazards reported by Highway Patrol. Commercial speed limiter adherence enforced at 50 km/h max. Keep headlights on.`,
        category: 'dispatch',
        severity: 'warning',
        corridor: meta.primaryCorridor,
        targetModule: 'dispatch',
        actionLabel: 'Check Live Corridor Radar',
        sourceAuthority: `${meta.regulator} Incident Division`,
      }));
    } else if (templateKey === 'weighbridge') {
      setBroadcastForm((prev) => ({
        ...prev,
        title: `${meta.name} Border OSBP Weighbridge Calibration Delay`,
        subtitle: `Customs automated axle scale undergoing 30-minute sensor calibration. Heavy container trucks hold at designated parking apron.`,
        category: 'dispatch',
        severity: 'warning',
        corridor: meta.borderCheckpoints[0] || meta.primaryCorridor,
        targetModule: 'truck',
        actionLabel: 'Inspect Truck Queues',
        sourceAuthority: meta.customsAuthority,
      }));
    } else if (templateKey === 'tariff') {
      setBroadcastForm((prev) => ({
        ...prev,
        title: `${meta.regulator} Statutory Tariff Compliance Notice`,
        subtitle: `Mandatory fare index calibration in effect. Ensure mobile meters reflect updated statutory commission rates without passenger surcharges.`,
        category: 'regulatory',
        severity: 'info',
        corridor: `${meta.capitalCity} Metropolitan Area`,
        targetModule: 'compliance',
        actionLabel: 'Audit Rate Table',
        sourceAuthority: meta.regulator,
      }));
    } else if (templateKey === 'security') {
      setBroadcastForm((prev) => ({
        ...prev,
        title: `Mandatory Security Escort Convoy Active on ${meta.primaryCorridor}`,
        subtitle: `All commercial logistics haulers and cross-border freight must report to the checkpoint assembly gate for coordinated security escort.`,
        category: 'security',
        severity: 'critical',
        corridor: meta.primaryCorridor,
        targetModule: 'geofences',
        actionLabel: 'Monitor Escort Geofence',
        sourceAuthority: `${meta.name} Highway Police & Defense Liaison`,
      }));
    } else if (templateKey === 'settlement') {
      setBroadcastForm((prev) => ({
        ...prev,
        title: `${meta.fintechRail} Settlement Batch Successfully Reconciled`,
        subtitle: `End-of-shift driver earnings distributed directly to verified mobile wallets without clearing delay.`,
        category: 'settlement',
        severity: 'success',
        corridor: meta.fintechRail,
        targetModule: 'settlements',
        actionLabel: 'Open Settlement Ledger',
        sourceAuthority: meta.fintechRail,
      }));
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.subtitle.trim()) {
      onNotify('Validation Error', 'Please specify both an alert title and detailed description.', 'error');
      return;
    }

    if (onGuardPermission && !onGuardPermission('manage_modules', 'Broadcast Regional Dispatch Alert')) {
      return;
    }

    const newNotif = createBroadcastNotification({
      ...broadcastForm,
      broadcastBy: `${userName} (${userRole})`,
    });

    onUpdateNotifications((prev) => [newNotif, ...prev]);
    setIsBroadcastModalOpen(false);

    // Reset modal form
    setBroadcastForm({
      title: '',
      subtitle: '',
      countryCode: selectedCountry === 'ALL' ? (userJurisdiction !== 'ALL' ? userJurisdiction : 'ET') : selectedCountry,
      corridor: '',
      category: 'dispatch',
      severity: 'warning',
      targetModule: 'dispatch',
      actionLabel: 'View Dispatch Radar',
      recipientAudience: 'all',
      sourceAuthority: '',
    });
    setSelectedTemplate('custom');

    onNotify(
      `Broadcast Dispatched (${newNotif.countryCode})`,
      newNotif.title,
      newNotif.severity === 'critical' ? 'warning' : 'info'
    );
  };

  // Severity visual styling helpers
  const getSeverityBadge = (severity?: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-ping motion-reduce:animate-none" />
            Critical SOS / Halt
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Advisory Warning
          </span>
        );
      case 'security':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Security Escort
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Reconciled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            <Info className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            Informational
          </span>
        );
    }
  };

  const getCardBorderClass = (item: NotificationItem) => {
    if (!item.read) {
      if (item.severity === 'critical') {
        return 'border-l-4 border-l-rose-500 border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/15 shadow-xs';
      }
      if (item.severity === 'warning') {
        return 'border-l-4 border-l-amber-500 border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs';
      }
      if (item.severity === 'security') {
        return 'border-l-4 border-l-purple-500 border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/10 shadow-xs';
      }
      return 'border-l-4 border-l-cyan-500 border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/30 dark:bg-cyan-950/15 shadow-xs';
    }
    return 'border-l-4 border-l-slate-300 dark:border-l-slate-700 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-90';
  };

  const getCategoryIcon = (category: NotificationCategory, type: string) => {
    if (category === 'security') {
      return <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
    if (category === 'settlement' || type === 'payment') {
      return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (category === 'regulatory') {
      return <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    if (type === 'shipment' || category === 'dispatch') {
      return <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
    if (type === 'driver' || type === 'trip') {
      return <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
    return <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. OPERATOR STATION & JURISDICTION BINDING CONSOLE                   */}
      {/* ==================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/50 bg-gradient-to-r from-cyan-50/70 via-sky-50/40 to-slate-50 dark:from-cyan-950/30 dark:via-slate-900 dark:to-slate-900 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Station Identity Info */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-600 dark:bg-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm text-lg">
              {operatorStationMeta ? operatorStationMeta.flag : '🌍'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                  OPERATOR DUTY STATION: {userJurisdictionName.toUpperCase()} ({userJurisdiction})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                  <span>Logged in as</span>
                  <strong className="text-slate-800 dark:text-slate-200">{userName}</strong>
                  <span>({userRole})</span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {operatorStationMeta ? operatorStationMeta.stationHubName : 'East Africa Central Operations Command'}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Regulator: {operatorStationMeta?.regulator}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <span className="flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Emergency Line: {operatorStationMeta?.emergencyHotline}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settlement: {operatorStationMeta?.fintechRail}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Station Switch & Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {userJurisdiction && userJurisdiction !== 'ALL' && (
              <button
                onClick={() => setSelectedCountry(userJurisdiction)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  selectedCountry === userJurisdiction
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Focus alerts exclusively on your assigned country station"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Focus My Station ({userJurisdiction})</span>
              </button>
            )}

            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                selectedCountry === 'ALL'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="View live alerts across all 8 member states"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All 8 Nations Grid</span>
            </button>

            <button
              onClick={handleSimulateSos}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors flex items-center gap-1.5 animate-pulse motion-reduce:animate-none"
              title="Simulate active in-cab driver distress call along this station's primary arterial corridor"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Simulate SOS Distress</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. MAIN HEADER & CONTROL TOOLBAR                                     */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Dispatch Alerts &amp; Regulatory Incident Hub
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  8-NATION EAST AFRICA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time arterial alerts, weighbridge delays, statutory tariff compliance notices, and cross-border fintech clearing
              </p>
            </div>
          </div>
        </div>

        {/* Quick Hub Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Regional Alert</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              unreadCount > 0
                ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Mark all notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Mark All Read</span>
          </button>

          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
              title="Export current view as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
            <button
              onClick={handleExportJson}
              className="px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
              title="Export as JSON"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>JSON</span>
            </button>
          </div>

          <button
            onClick={onOpenDrawer}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Open Slideout Drawer"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. STATS & TELEMETRY KPI TILES                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Stream Events</span>
            <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">8 Sovereign States</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Unread Alerts</span>
            <span className="relative flex h-2.5 w-2.5">
              {unreadCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 motion-reduce:animate-none" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${unreadCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${unreadCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {unreadCount}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({criticalCount} critical · {warningCount} warning)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Primary Arteries</span>
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              8 Corridors
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Live Telematics</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">BaaS LiveQuery Node</span>
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              85ms
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Back4App Multi-Region</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. 8-NATION MULTI-COUNTRY SELECTOR BAR                               */}
      {/* ==================================================================== */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Select Regional Country Telemetry Scope</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {selectedCountry === 'ALL'
              ? 'Viewing All 8 East African Member States'
              : `Filtered to ${EAST_AFRICA_NOTIFICATION_COUNTRIES[selectedCountry]?.name} (${EAST_AFRICA_NOTIFICATION_COUNTRIES[selectedCountry]?.currency})`}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCountry('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 border ${
              selectedCountry === 'ALL'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>🌍 All East Africa</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                selectedCountry === 'ALL'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {notifications.length}
            </span>
          </button>

          {(Object.keys(EAST_AFRICA_NOTIFICATION_COUNTRIES) as Array<Exclude<EastAfricaCountryCode, 'ALL'>>).map(
            (code) => {
              const meta = EAST_AFRICA_NOTIFICATION_COUNTRIES[code];
              const isSelected = selectedCountry === code;
              const isDutyStation = userJurisdiction === code;
              const countryUnread = unreadByCountry[code] || 0;
              const countryCritical = criticalByCountry[code] || 0;
              const countryTotal = notifications.filter((n) => n.countryCode === code).length;

              return (
                <button
                  key={code}
                  onClick={() => setSelectedCountry(code)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 border relative ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={`${meta.name} (${meta.currency}) · Regulator: ${meta.regulator} · Fleet: ${meta.activeFleetCount}`}
                >
                  <span className="text-sm">{meta.flag}</span>
                  <span>{meta.name}</span>
                  {isDutyStation && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" title="Operator Duty Station" />
                  )}
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                      countryCritical > 0
                        ? isSelected
                          ? 'bg-rose-500 text-white font-bold animate-pulse'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800'
                        : countryUnread > 0
                        ? isSelected
                          ? 'bg-amber-400 text-slate-900 font-bold'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold'
                        : isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {countryUnread > 0 ? `${countryUnread}!` : countryTotal}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. CATEGORY TABS & REFINEMENT SEARCH TOOLBAR                         */}
      {/* ==================================================================== */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'dispatch', label: 'Corridors & Dispatch' },
            { id: 'regulatory', label: 'Tariff & Regulatory' },
            { id: 'settlement', label: 'Settlement & Fintech' },
            { id: 'security', label: 'Security & Escorts' },
            { id: 'operations', label: 'Fleet Operations' },
            { id: 'system', label: 'Platform & BaaS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-2 rounded-t-lg font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 -mb-[2px] ${
                selectedCategory === tab.id
                  ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary Toolbar (Search, Severity, Read Status) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, corridor, authority, border post, driver..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warning Only</option>
              <option value="security">Security Only</option>
              <option value="info">Info Only</option>
              <option value="success">Settled Only</option>
            </select>

            {/* Read / Unread Status Filter */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  selectedStatus === 'all'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedStatus('unread')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  selectedStatus === 'unread'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setSelectedStatus('read')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  selectedStatus === 'read'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Read
              </button>
            </div>

            {/* Reset Filters */}
            {(selectedCountry !== 'ALL' ||
              selectedCategory !== 'all' ||
              selectedSeverity !== 'all' ||
              selectedStatus !== 'all' ||
              searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors flex items-center gap-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. NOTIFICATIONS STREAM / CARDS                                      */}
      {/* ==================================================================== */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => {
            const countryMeta = item.countryCode && item.countryCode !== 'ALL'
              ? EAST_AFRICA_NOTIFICATION_COUNTRIES[item.countryCode]
              : null;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${getCardBorderClass(item)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left content block */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getCategoryIcon(item.category, item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Meta badges line */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {/* Severity Badge */}
                        {getSeverityBadge(item.severity)}

                        {/* Country Badge */}
                        {countryMeta ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            <span>{countryMeta.flag}</span>
                            <span>{countryMeta.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            <span>🌍 Pan-East Africa</span>
                          </span>
                        )}

                        {/* Corridor Tag */}
                        {item.corridor && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/80 max-w-[320px] truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{item.corridor}</span>
                          </span>
                        )}

                        {/* Emergency Hotline if critical */}
                        {item.emergencyHotline && item.severity === 'critical' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                            <PhoneCall className="w-2.5 h-2.5" />
                            <span>{item.emergencyHotline}</span>
                          </span>
                        )}

                        {/* Source Authority */}
                        {item.sourceAuthority && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden md:inline">
                            via {item.sourceAuthority}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3
                        className={`text-sm sm:text-base font-bold leading-snug ${
                          !item.read
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300 font-semibold'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {item.subtitle}
                      </p>

                      {/* Acknowledged Banner */}
                      {item.acknowledgedBy && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Acknowledged &amp; Escalated by {item.acknowledgedBy} at {item.acknowledgedAt}</span>
                        </div>
                      )}

                      {/* Footer actions on card */}
                      <div className="mt-3.5 flex items-center gap-3 flex-wrap text-xs">
                        {/* Target Module Direct Jump */}
                        {item.actionTab && (
                          <button
                            onClick={() => onNavigateTab(item.actionTab!)}
                            className="inline-flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                          >
                            <span>{item.actionLabel || `Navigate to ${item.actionTab}`}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {/* Interactive Acknowledge Button */}
                        {!item.acknowledgedBy && (
                          <button
                            onClick={() => handleAcknowledgeAlert(item.id)}
                            className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Acknowledge as {userName}</span>
                          </button>
                        )}

                        {/* Push Driver Notification button */}
                        <button
                          onClick={() => handleSendDriverPush(item)}
                          className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="Simulate dispatching in-cab mobile alert to active vehicles"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>Push In-Cab SMS</span>
                        </button>

                        <span className="text-slate-300 dark:text-slate-700">·</span>

                        {/* Relative timestamp */}
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.timestamp || item.timeAgo}</span>
                        </span>

                        {/* Audience badge if broadcast */}
                        {item.recipientAudience && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-[10px] uppercase font-mono text-slate-400">
                              Audience: {item.recipientAudience}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleRead(item.id)}
                        className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                          item.read
                            ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            : 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60'
                        }`}
                        title={item.read ? 'Mark as unread' : 'Mark as read'}
                      >
                        {item.read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDeleteNotification(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Dismiss notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!item.read && (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-xs" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No Dispatch Notifications Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              No operational events match the selected territory ({selectedCountry}), category, or search filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 7. MODAL: BROADCAST REGIONAL DISPATCH ALERT                          */}
      {/* ==================================================================== */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                    Broadcast Regional Dispatch Alert
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Publish instant corridor advisory, customs update, or tariff directive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleBroadcastSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Preset Quick Templates */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Quick Incident Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'custom', label: 'Custom Notice' },
                    { id: 'weather', label: 'Heavy Rain / Flood' },
                    { id: 'weighbridge', label: 'Weighbridge Delay' },
                    { id: 'tariff', label: 'Tariff Directive' },
                    { id: 'security', label: 'Security Escort' },
                    { id: 'settlement', label: 'Fintech Payout' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.id)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-colors ${
                        selectedTemplate === tpl.id
                          ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Country & Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Target Nation Scope
                  </label>
                  <select
                    value={broadcastForm.countryCode}
                    onChange={(e) => {
                      const code = e.target.value as EastAfricaCountryCode;
                      setBroadcastForm((prev) => ({
                        ...prev,
                        countryCode: code,
                        corridor:
                          code !== 'ALL'
                            ? EAST_AFRICA_NOTIFICATION_COUNTRIES[code]?.primaryCorridor || ''
                            : '',
                        sourceAuthority:
                          code !== 'ALL'
                            ? EAST_AFRICA_NOTIFICATION_COUNTRIES[code]?.regulator || ''
                            : 'Afronala Central Dispatch Authority',
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="ALL">🌍 Pan-East Africa (All 8 Nations)</option>
                    {(Object.keys(EAST_AFRICA_NOTIFICATION_COUNTRIES) as Array<Exclude<EastAfricaCountryCode, 'ALL'>>).map(
                      (code) => (
                        <option key={code} value={code}>
                          {EAST_AFRICA_NOTIFICATION_COUNTRIES[code].flag}{' '}
                          {EAST_AFRICA_NOTIFICATION_COUNTRIES[code].name} ({code})
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Target Recipient Audience
                  </label>
                  <select
                    value={broadcastForm.recipientAudience}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({
                        ...prev,
                        recipientAudience: e.target.value as BroadcastAlertInput['recipientAudience'],
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="all">All Operators &amp; Fleet Users</option>
                    <option value="drivers">In-Cab Drivers &amp; Couriers Only</option>
                    <option value="shippers">Corporate Cargo Shippers Only</option>
                    <option value="fleet_owners">Vehicle Fleet Owners Only</option>
                    <option value="customs_agents">Border Customs &amp; Clearing Agents</option>
                  </select>
                </div>
              </div>

              {/* Corridor & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Corridor / Border Checkpoint
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.corridor}
                    onChange={(e) => setBroadcastForm((prev) => ({ ...prev, corridor: e.target.value }))}
                    placeholder="e.g. Malaba OSBP, Modjo Dry Port, Galafi Link"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Severity Tier
                  </label>
                  <select
                    value={broadcastForm.severity}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({
                        ...prev,
                        severity: e.target.value as NotificationSeverity,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="warning">Warning (Operational Advisory)</option>
                    <option value="critical">Critical (Immediate Halt / Reroute)</option>
                    <option value="info">Informational (General Notice)</option>
                    <option value="security">Security (Escort / Perimeter Alert)</option>
                    <option value="success">Settled (Financial Reconciliation)</option>
                  </select>
                </div>
              </div>

              {/* Alert Title */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Alert Title
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Northern Corridor Heavy Rains & Axle Scale Backlog"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Detailed Advisory Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastForm.subtitle}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Detail the checkpoint condition, required documentation, detour routes, or statutory directive..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Target Tab & Authority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Quick Action Destination Tab
                  </label>
                  <select
                    value={broadcastForm.targetModule}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({
                        ...prev,
                        targetModule: e.target.value,
                        actionLabel: `View in ${e.target.value}`,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="dispatch">GPS Dispatch Radar</option>
                    <option value="compliance">Tariff &amp; Fuel Compliance</option>
                    <option value="settlements">Payment Settlements Hub</option>
                    <option value="truck">Truck Freight Logistics</option>
                    <option value="ride">Ride Hailing Fleet</option>
                    <option value="geofences">Geofence Perimeters</option>
                    <option value="superapp-bidding">Fleet Bids &amp; Escrow</option>
                    <option value="settings">Settings &amp; Security</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Issuing Authority Header
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.sourceAuthority || ''}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({ ...prev, sourceAuthority: e.target.value }))
                    }
                    placeholder="e.g. East African Community Customs Director"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Live Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
