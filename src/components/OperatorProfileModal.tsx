import React, { useState, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Globe,
  MapPin,
  Phone,
  Mail,
  Building2,
  Lock,
  Check,
  AlertTriangle,
  Bell,
  UserCheck,
  Edit2,
  Save,
  CheckCircle2,
  FileCheck2,
  Truck,
  Car,
  CreditCard,
  Shield,
  Layers,
  Sparkles,
  Camera,
  Upload,
  Trash2,
  Volume2,
  VolumeX,
  Smartphone,
  Sliders,
  RefreshCw,
  Radio,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AdminRole,
  AdminUser,
  DEFAULT_OPERATOR_NOTIF_PREFERENCES,
  EastAfricaCountryCode,
  OperatorNotificationPreferences,
  PermissionAction,
  ToastMessage,
} from '../types';
import { DEMO_PERSONAS, getInitials, hasPermission } from '../services/rbac';
import { EAST_AFRICAN_COUNTRIES_META } from '../services/eastAfricaModules';
import { EAST_AFRICA_NOTIFICATION_COUNTRIES } from '../services/notifications';

interface OperatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
  darkMode: boolean;
  onUpdateUser: (updatedUser: AdminUser) => void;
  onSwitchPersona: (persona: AdminUser) => void;
  onOpenNotifications: () => void;
  onNotify: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

type ModalTab = 'profile' | 'notifications' | 'jurisdiction' | 'security';

export const OperatorProfileModal: React.FC<OperatorProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  darkMode,
  onUpdateUser,
  onSwitchPersona,
  onOpenNotifications,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('profile');
  const [isEditing, setIsEditing] = useState(false);

  // Profile fields state
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editDutyStation, setEditDutyStation] = useState(user.dutyStation || '');
  const [editLanguage, setEditLanguage] = useState(user.dutyLanguage || 'English');
  const [editAvatar, setEditAvatar] = useState(user.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Default jurisdiction state
  const [editDefaultCountry, setEditDefaultCountry] = useState<EastAfricaCountryCode>(
    user.defaultJurisdictionCountry || user.jurisdictionCountry || 'ET'
  );
  const [autoSyncCredentials, setAutoSyncCredentials] = useState(true);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<OperatorNotificationPreferences>(() => ({
    ...DEFAULT_OPERATOR_NOTIF_PREFERENCES,
    ...(user.notificationPreferences || {}),
  }));

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentCountryCode = (user.jurisdictionCountry && user.jurisdictionCountry !== 'ALL'
    ? user.jurisdictionCountry
    : 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>;
  const currentCountryMeta =
    EAST_AFRICAN_COUNTRIES_META[currentCountryCode] || EAST_AFRICAN_COUNTRIES_META.ET;
  const currentNotifMeta = EAST_AFRICA_NOTIFICATION_COUNTRIES[currentCountryCode];

  // Selected default country metadata
  const selectedDefaultCode = (editDefaultCountry && editDefaultCountry !== 'ALL'
    ? editDefaultCountry
    : 'ET') as Exclude<EastAfricaCountryCode, 'ALL'>;
  const selectedDefaultMeta =
    EAST_AFRICAN_COUNTRIES_META[selectedDefaultCode] || EAST_AFRICAN_COUNTRIES_META.ET;
  const selectedDefaultNotif = EAST_AFRICA_NOTIFICATION_COUNTRIES[selectedDefaultCode];

  // Handle local file upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify('Invalid File', 'Please select a valid image file (PNG, JPG, WebP).', 'warning');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      onNotify('File Too Large', 'Please select an image smaller than 4MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEditAvatar(dataUrl);
        onNotify('Profile Picture Loaded', 'Image ready. Click "Save Changes" to apply.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Avatar presets
  const AVATAR_PRESETS = [
    {
      id: 'daniel-admin',
      name: 'Daniel (Super Admin)',
      url: '/src/assets/images/avatar_admin_daniel_1792851958392.jpg',
    },
    {
      id: 'nairobi-lead',
      name: 'Nairobi Fleet Lead',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    },
    {
      id: 'kigali-coordinator',
      name: 'Kigali Coordinator',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    },
    {
      id: 'addis-telemetry',
      name: 'Addis Telemetry Lead',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    },
    {
      id: 'mombasa-maritime',
      name: 'Mombasa Port Liaison',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
  ];

  // Apply custom URL
  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    setEditAvatar(customAvatarUrl.trim());
    setCustomAvatarUrl('');
    setShowAvatarPicker(false);
    onNotify('Profile Picture Updated', 'Custom avatar URL applied.', 'success');
  };

  // When default jurisdiction changes, optionally sync station credentials
  const handleSelectDefaultCountry = (code: EastAfricaCountryCode) => {
    setEditDefaultCountry(code);
    if (autoSyncCredentials && code !== 'ALL') {
      const targetMeta = EAST_AFRICAN_COUNTRIES_META[code as Exclude<EastAfricaCountryCode, 'ALL'>];
      const targetNotif = EAST_AFRICA_NOTIFICATION_COUNTRIES[code as Exclude<EastAfricaCountryCode, 'ALL'>];
      if (targetNotif) {
        setEditDutyStation(targetNotif.stationHubName);
      }
      if (targetMeta) {
        // Pre-fill phone country code if current phone is empty or has another country prefix
        if (!editPhone || editPhone.startsWith('+')) {
          const prefixes: Record<string, string> = {
            ET: '+251 91 000 0000',
            KE: '+254 712 000 000',
            UG: '+256 772 000 000',
            RW: '+250 788 000 000',
            TZ: '+255 754 000 000',
            DJ: '+253 77 00 00 00',
            SO: '+252 61 000 0000',
            SS: '+211 912 000 000',
          };
          setEditPhone(prefixes[code] || editPhone);
        }
      }
    }
  };

  // Toggle single notification preference
  const handleTogglePref = (key: keyof OperatorNotificationPreferences) => {
    setNotifPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save all profile, notification & default jurisdiction updates
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const selectedCountryCode = editDefaultCountry;
    const isPanRegional = selectedCountryCode === 'ALL';
    const targetMeta = !isPanRegional
      ? EAST_AFRICAN_COUNTRIES_META[selectedCountryCode as Exclude<EastAfricaCountryCode, 'ALL'>]
      : null;
    const targetNotif = !isPanRegional
      ? EAST_AFRICA_NOTIFICATION_COUNTRIES[selectedCountryCode as Exclude<EastAfricaCountryCode, 'ALL'>]
      : null;

    const jurisdictionName = isPanRegional
      ? 'Pan-East Africa (8 Nations)'
      : `${targetMeta?.name} (${targetMeta?.capital} Hub)`;

    const updatedUser: AdminUser = {
      ...user,
      name: editName.trim() || user.name,
      phone: editPhone.trim() || user.phone,
      dutyStation: editDutyStation.trim() || user.dutyStation,
      dutyLanguage: editLanguage.trim() || user.dutyLanguage,
      avatar: editAvatar,
      defaultJurisdictionCountry: editDefaultCountry,
      jurisdictionCountry: editDefaultCountry,
      jurisdictionName,
      notificationPreferences: notifPrefs,
      assignedCorridors:
        targetMeta?.corridor
          ? [targetMeta.corridor]
          : user.assignedCorridors,
      emergencyContact: targetNotif?.emergencyHotline || user.emergencyContact,
    };

    onUpdateUser(updatedUser);
    setIsEditing(false);
    onNotify(
      'Operator Profile & Station Updated',
      `Default station set to ${isPanRegional ? 'Pan-East Africa' : targetMeta?.name}. Notification preferences saved.`,
      'success'
    );
  };

  const permissionsList: { key: PermissionAction; label: string; icon: any }[] = [
    { key: 'manage_modules', label: 'Platform & Module Registry', icon: Layers },
    { key: 'manage_ride', label: 'Ride Hailing Fleet Dispatch', icon: Car },
    { key: 'manage_freight', label: 'Truck Freight & Cross-Border Bids', icon: Truck },
    { key: 'manage_finance', label: 'Wallet Disbursements & Treasury', icon: CreditCard },
    { key: 'manage_approvals', label: 'Driver & Vehicle KYC Clearances', icon: FileCheck2 },
    { key: 'manage_pricing_flags', label: 'Dynamic Surge & Regulatory Flags', icon: Sparkles },
  ];

  const allCountriesList: { code: EastAfricaCountryCode; name: string; flag: string; capital: string; regulator: string }[] = [
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', capital: 'Addis Ababa', regulator: 'FTA / AACTB' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', capital: 'Nairobi', regulator: 'NTSA' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', capital: 'Kampala', regulator: 'MoWT / KCCA' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', capital: 'Kigali', regulator: 'RURA' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', capital: 'Dar es Salaam', regulator: 'LATRA / TPA' },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', capital: 'Djibouti City', regulator: 'DPFZA' },
    { code: 'SO', name: 'Somalia', flag: '🇸🇴', capital: 'Mogadishu', regulator: 'MOTCA' },
    { code: 'SS', name: 'South Sudan', flag: '🇸🇸', capital: 'Juba', regulator: 'SSMoTR' },
    { code: 'ALL', name: 'Pan-East Africa (EAC)', flag: '🌍', capital: 'Arusha / Regional', regulator: 'EAC Transport Commission' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl text-slate-900 dark:text-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Modal Top Banner with Sovereign Theme & Avatar Update Trigger */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Operator Avatar with Live Preview & Change Button */}
            <div className="relative shrink-0 group">
              {editAvatar ? (
                <img
                  src={editAvatar}
                  alt={editName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-md group-hover:brightness-90 transition-all"
                  onError={() => setEditAvatar('')}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 border-2 border-cyan-400 flex items-center justify-center text-2xl font-extrabold text-white shadow-md">
                  {getInitials(editName || user.name)}
                </div>
              )}

              {/* Photo Change Action Overlay Button */}
              <button
                type="button"
                onClick={() => setShowAvatarPicker((prev) => !prev)}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold text-white transition-opacity gap-1 backdrop-blur-2xs"
                title="Change Profile Picture"
              >
                <Camera className="w-5 h-5 text-cyan-300" />
                <span>Change</span>
              </button>

              {/* Country Flag Sovereign Badge */}
              <span
                className="absolute -bottom-2 -right-2 text-2xl filter drop-shadow-md select-none"
                title={currentCountryMeta.name}
              >
                {currentCountryMeta.flag}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {user.operatorId || `OP-${currentCountryCode}-1001`}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Duty Status: {user.status?.toUpperCase() || 'ONLINE'}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Default: {selectedDefaultMeta.flag} {editDefaultCountry}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
                <span>{editName || user.name}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">({user.email})</span>
              </h2>

              <p className="text-xs text-cyan-200 mt-0.5 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>{user.role} · {user.jurisdictionName || `${currentCountryMeta.name} Sovereign Hub`}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Avatar Picker / Photo Options Drawer (collapsible) */}
        {showAvatarPicker && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-cyan-50/50 dark:bg-cyan-950/30 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Update Profile Picture</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Device Photo</span>
              </button>

              {editAvatar && (
                <button
                  type="button"
                  onClick={() => {
                    setEditAvatar('');
                    onNotify('Profile Picture Removed', 'Reverted to initials avatar.', 'info');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            {/* Presets Gallery */}
            <div>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Or select an operations portrait:
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setEditAvatar(preset.url);
                      setShowAvatarPicker(false);
                      onNotify('Avatar Selected', `${preset.name} applied.`, 'success');
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      editAvatar === preset.url
                        ? 'border-cyan-500 ring-2 ring-cyan-500/40'
                        : 'border-slate-300 dark:border-slate-700 hover:border-cyan-400'
                    }`}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-12 h-12 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Image URL input */}
            <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
              <input
                type="url"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                placeholder="Or paste external image URL (https://...)"
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 transition-colors"
              >
                Apply URL
              </button>
            </form>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 px-4 sm:px-6 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Operator Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jurisdiction')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'jurisdiction'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Default Jurisdiction ({selectedDefaultMeta.flag} {editDefaultCountry})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notification Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Clearance &amp; Personas</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* TAB 1: Operator Identity & Profile Form */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Active Station Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">Duty Station:</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {editDutyStation || currentNotifMeta?.stationHubName || `${currentCountryMeta.capital} Operations Command`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Change Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveAll} className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-50/20 dark:bg-cyan-950/20 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                    Edit Operator Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Operator Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Official Duty Phone ({selectedDefaultMeta.flag})
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+254 712 345 678"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Duty Station Command Hub
                      </label>
                      <input
                        type="text"
                        value={editDutyStation}
                        onChange={(e) => setEditDutyStation(e.target.value)}
                        placeholder="e.g. Nairobi National Operations & SGR Hub"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Operational Languages
                      </label>
                      <input
                        type="text"
                        value={editLanguage}
                        onChange={(e) => setEditLanguage(e.target.value)}
                        placeholder="e.g. Swahili / English"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Sovereign Station Credentials */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                    <h3 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Station Credentials</span>
                    </h3>
                    <div className="space-y-2.5 divide-y divide-slate-200/80 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-slate-500">Default Sovereign Jurisdiction</span>
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                          <span>{selectedDefaultMeta.flag}</span>
                          <span>{selectedDefaultMeta.name} ({editDefaultCountry})</span>
                        </span>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-slate-500">Primary Dispatch Capital</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{selectedDefaultMeta.capital}</span>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-slate-500">Duty Contact Phone</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {user.phone || editPhone || '+254 712 345 678'}
                        </span>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-slate-500">National Tax PIN</span>
                        <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                          {user.taxPin || `TIN-${currentCountryCode}-882190`}
                        </span>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-slate-500">Emergency Dispatch Contact</span>
                        <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                          {user.emergencyContact || selectedDefaultNotif?.emergencyHotline || currentCountryMeta.shortRegulator}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Authority & Assigned Corridors */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                    <h3 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Statutory Oversight &amp; Corridors</span>
                    </h3>
                    <div className="space-y-2 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Primary Transport Authority</span>
                        <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                          {selectedDefaultMeta.transportRegulator}
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="text-slate-500 block text-[11px]">Assigned Trade Corridors</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {(user.assignedCorridors && user.assignedCorridors.length > 0
                            ? user.assignedCorridors
                            : [selectedDefaultMeta.corridor]
                          ).map((corridor) => (
                            <span
                              key={corridor}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                            >
                              {corridor}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Set Default Jurisdiction Country */}
          {activeTab === 'jurisdiction' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-50/40 dark:bg-cyan-950/20">
                <div>
                  <h3 className="text-xs font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Set Default Sovereign Jurisdiction Country</span>
                  </h3>
                  <p className="text-[11px] text-cyan-700 dark:text-cyan-300 mt-0.5">
                    Configures your primary operational home base across the 8 East African countries.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={autoSyncCredentials}
                    onChange={(e) => setAutoSyncCredentials(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                  />
                  <span>Auto-sync station hubs</span>
                </label>
              </div>

              {/* Sovereign Country Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allCountriesList.map((country) => {
                  const isSelected = editDefaultCountry === country.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleSelectDefaultCountry(country.code)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/60 ring-2 ring-cyan-500/30 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{country.flag}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-600 text-white">
                              Default Home
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {country.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Capital: {country.capital}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">{country.regulator}</span>
                        <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                          {country.code}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  Selected: <strong>{selectedDefaultMeta.flag} {selectedDefaultMeta.name} ({editDefaultCountry})</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply Default Station</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Manage Notification Preferences */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Operational Alert &amp; Channel Subscriptions</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure which events trigger real-time alerts for your duty station.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifPrefs({
                        soundEnabled: true,
                        desktopPushEnabled: true,
                        criticalSosAlerts: true,
                        dispatchOperations: true,
                        freightCustoms: true,
                        regulatoryCompliance: true,
                        financialSettlements: true,
                        surgePricingFlags: true,
                        smsEmergencyRelay: true,
                      });
                      onNotify('All Channels Active', 'Subscribed to all operational alerts.', 'info');
                    }}
                    className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Enable All
                  </button>
                  <span className="text-slate-400">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifPrefs(DEFAULT_OPERATOR_NOTIF_PREFERENCES);
                      onNotify('Reset to Default', 'Standard notification settings restored.', 'info');
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Preference Toggle Switches */}
              <div className="space-y-2.5">
                {[
                  {
                    key: 'soundEnabled' as const,
                    icon: Volume2,
                    title: 'Auditory Dispatch Chimes',
                    desc: 'Play sound signal when high-priority dispatches, trips, or alerts arrive',
                  },
                  {
                    key: 'desktopPushEnabled' as const,
                    icon: Bell,
                    title: 'Desktop System Push Notifications',
                    desc: 'Trigger native browser push notifications when control panel is in the background',
                  },
                  {
                    key: 'criticalSosAlerts' as const,
                    icon: AlertTriangle,
                    title: 'Critical Fleet SOS & Panic Alerts',
                    desc: 'Instant high-visibility notifications for driver emergency triggers and route deviations',
                  },
                  {
                    key: 'dispatchOperations' as const,
                    icon: Car,
                    title: 'Ride Hailing Fleet Operations',
                    desc: 'Telemetry updates for ride orders, passenger pickups, and completion settlements',
                  },
                  {
                    key: 'freightCustoms' as const,
                    icon: Truck,
                    title: 'Heavy Freight & Border Customs Escorts',
                    desc: 'Cross-border cargo manifest filings, axle-load checks, and port drayage updates',
                  },
                  {
                    key: 'regulatoryCompliance' as const,
                    icon: FileCheck2,
                    title: 'Regulatory Compliance & License Audits',
                    desc: 'Speed limiter certs, roadworthiness inspection notices, and regulator filings',
                  },
                  {
                    key: 'financialSettlements' as const,
                    icon: CreditCard,
                    title: 'Wallet Payouts & Currency RTGS Reconciliations',
                    desc: 'Automated mobile money batch disbursements (Telebirr, M-PESA, MoMo, TIPS)',
                  },
                  {
                    key: 'surgePricingFlags' as const,
                    icon: Sparkles,
                    title: 'Dynamic Surge & Fuel Quota Tariffs',
                    desc: 'Live regulatory price floor adjustments, fuel index shifts, and storm surge flags',
                  },
                  {
                    key: 'smsEmergencyRelay' as const,
                    icon: Smartphone,
                    title: 'Sovereign SMS Dispatch Relay',
                    desc: 'Forward critical SOS alerts to your official duty mobile phone in real-time',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isChecked = Boolean(notifPrefs[item.key]);
                  return (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        onClick={() => handleTogglePref(item.key)}
                        className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                          isChecked ? 'bg-cyan-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notification Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Clearance & 1-Click Persona Switcher */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              {/* Role Access Clearance Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Security Clearance &amp; RBAC Authority ({user.role})</span>
                  <span className="text-[11px] font-mono font-normal text-cyan-600 dark:text-cyan-400">
                    Server-Enforced Access Guard
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {permissionsList.map((perm) => {
                    const granted = hasPermission(user.role, perm.key);
                    const Icon = perm.icon;
                    return (
                      <div
                        key={perm.key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          granted
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-medium text-[11px] truncate">{perm.label}</span>
                        </div>
                        {granted ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Switch Operator Persona by Sovereign Country */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Switch Sovereign Duty Station Persona (8 East African Nations)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    1-Click Role Emulation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  {DEMO_PERSONAS.map((persona) => {
                    const isActive = user.email === persona.email;
                    const flag =
                      persona.jurisdictionCountry === 'ET' ? '🇪🇹' :
                      persona.jurisdictionCountry === 'KE' ? '🇰🇪' :
                      persona.jurisdictionCountry === 'RW' ? '🇷🇼' :
                      persona.jurisdictionCountry === 'UG' ? '🇺🇬' :
                      persona.jurisdictionCountry === 'TZ' ? '🇹🇿' :
                      persona.jurisdictionCountry === 'DJ' ? '🇩🇯' :
                      persona.jurisdictionCountry === 'SO' ? '🇸🇴' :
                      persona.jurisdictionCountry === 'SS' ? '🇸🇸' : '🌍';

                    return (
                      <button
                        key={persona.email}
                        type="button"
                        onClick={() => {
                          onSwitchPersona(persona);
                          onClose();
                        }}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 font-semibold shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{flag}</span>
                          <span className="truncate font-semibold text-[11px]">{persona.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {persona.role}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Afronala SuperApp Sovereign Control Protocol</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
