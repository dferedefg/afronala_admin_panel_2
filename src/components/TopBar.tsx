import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Database,
  Menu,
  ChevronDown,
  Navigation,
  Compass,
  ShieldCheck,
  LogOut,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Car,
  Truck,
  FileCheck2,
  Gavel,
  Flame,
  Archive,
  Activity,
  CreditCard,
  Leaf,
  Radio,
  Users,
  BarChart3,
  Settings,
  Sliders,
  Code2,
  Layers,
  Plus,
  Smartphone,
  Package,
  AlertTriangle,
  LayoutDashboard,
  CornerDownLeft,
} from 'lucide-react';
import {
  AdminUser,
  CustomerAccount,
  Driver,
  ModuleItem,
  Shipment,
  SystemAlert,
  Trip,
  Vehicle,
} from '../types';
import { DEMO_PERSONAS, getInitials } from '../services/rbac';
import {
  getIntellisenseSuggestions,
  INTELLISENSE_CLUES,
  IntellisenseClue,
  searchGlobalIndex,
  SearchResultItem,
} from '../services/globalSearch';

interface TopBarProps {
  user: AdminUser;
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenDbModal: () => void;
  onOpenDispatchSimulator?: () => void;
  onOpenSchemaEditor?: () => void;
  onOpenAmbaLay?: () => void;
  onOpenFlutterModal?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenDriverSimulator?: () => void;
  onToggleSidebar: () => void;
  unreadCount: number;
  dbStatus: { online: boolean; latency: number };
  onSelectDashboard?: () => void;
  onSwitchPersona?: (persona: AdminUser) => void;
  onLogout?: () => void;
  onOpenProfileModal?: () => void;
  onNavigateTab?: (tab: string, filterValue?: string) => void;
  restrictToCountry?: boolean;
  onToggleRestrictToCountry?: () => void;
  // Global search data inputs
  drivers?: Driver[];
  vehicles?: Vehicle[];
  trips?: Trip[];
  shipments?: Shipment[];
  customers?: CustomerAccount[];
  modules?: ModuleItem[];
  alerts?: SystemAlert[];
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  darkMode,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenDbModal,
  onOpenDispatchSimulator,
  onOpenSchemaEditor,
  onOpenAmbaLay,
  onOpenFlutterModal,
  onOpenRegisterModal,
  onOpenDriverSimulator,
  onToggleSidebar,
  unreadCount,
  dbStatus,
  onSelectDashboard,
  onSwitchPersona,
  onLogout,
  onOpenProfileModal,
  onNavigateTab,
  restrictToCountry = true,
  onToggleRestrictToCountry,
  drivers = [],
  vehicles = [],
  trips = [],
  shipments = [],
  customers = [],
  modules = [],
  alerts = [],
}) => {
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const assignedCountryCode = user.jurisdictionCountry || 'ET';
  const assignedCountryFlag =
    assignedCountryCode === 'ET' ? '🇪🇹' :
    assignedCountryCode === 'KE' ? '🇰🇪' :
    assignedCountryCode === 'RW' ? '🇷🇼' :
    assignedCountryCode === 'UG' ? '🇺🇬' :
    assignedCountryCode === 'TZ' ? '🇹🇿' :
    assignedCountryCode === 'DJ' ? '🇩🇯' :
    assignedCountryCode === 'SO' ? '🇸🇴' :
    assignedCountryCode === 'SS' ? '🇸🇸' : '🌍';
  const assignedCountryName =
    user.jurisdictionName ||
    (assignedCountryCode === 'ET' ? 'Ethiopia' :
     assignedCountryCode === 'KE' ? 'Kenya' :
     assignedCountryCode === 'RW' ? 'Rwanda' :
     assignedCountryCode === 'UG' ? 'Uganda' :
     assignedCountryCode === 'TZ' ? 'Tanzania' :
     assignedCountryCode === 'DJ' ? 'Djibouti' :
     assignedCountryCode === 'SO' ? 'Somalia' :
     assignedCountryCode === 'SS' ? 'South Sudan' : 'East Africa');

  // Global Search & Intellisense State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeClueTooltip, setActiveClueTooltip] = useState<IntellisenseClue | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  // Unified data payload for search
  const searchData = useMemo(
    () => ({
      drivers,
      vehicles,
      trips,
      shipments,
      customers,
      modules,
      alerts,
    }),
    [drivers, vehicles, trips, shipments, customers, modules, alerts]
  );

  // Computed results and intellisense suggestions
  const searchResults = useMemo(
    () => searchGlobalIndex(searchQuery, searchData),
    [searchQuery, searchData]
  );

  const { ghostText, recommendedClue, matchingClues } = useMemo(
    () => getIntellisenseSuggestions(searchQuery, searchData),
    [searchQuery, searchData]
  );

  // Global shortcut listeners (⌘K, Ctrl+K, or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input or textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle outside clicks for persona menu and search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPersonaMenuOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Execute jump to selected item
  const handleSelectItem = (item: SearchResultItem) => {
    setIsSearchOpen(false);

    if (item.actionModal) {
      if (item.actionModal === 'db') onOpenDbModal();
      else if (item.actionModal === 'flutter') onOpenFlutterModal?.();
      else if (item.actionModal === 'register') onOpenRegisterModal?.();
      else if (item.actionModal === 'schema') onOpenSchemaEditor?.();
      else if (item.actionModal === 'driver-simulator') onOpenDriverSimulator?.();
      else if (item.actionModal === 'notifications') onOpenNotifications();
      return;
    }

    if (item.actionTab) {
      if (onNavigateTab) {
        onNavigateTab(item.actionTab, item.filterValue);
      } else if (item.actionTab === 'dashboard') {
        onSelectDashboard?.();
      }
    }
  };

  // Keyboard navigation within the search input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsSearchOpen(true);
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsSearchOpen(true);
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, searchResults.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Tab' || (e.key === 'ArrowRight' && searchInputRef.current?.selectionStart === searchQuery.length)) {
      // Intellisense Tab / ArrowRight auto-completion
      if (ghostText && ghostText.toLowerCase() !== searchQuery.toLowerCase()) {
        e.preventDefault();
        setSearchQuery(ghostText);
      } else if (recommendedClue && !searchQuery.includes(':')) {
        e.preventDefault();
        setSearchQuery(recommendedClue.prefix);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  // Helper to render icon by name
  const renderItemIcon = (iconName: string) => {
    const iconClass = 'w-4 h-4 shrink-0';
    switch (iconName) {
      case 'LayoutDashboard': return <LayoutDashboard className={iconClass} />;
      case 'Car': return <Car className={iconClass} />;
      case 'Truck': return <Truck className={iconClass} />;
      case 'FileCheck2': return <FileCheck2 className={iconClass} />;
      case 'Gavel': return <Gavel className={iconClass} />;
      case 'Flame': return <Flame className={iconClass} />;
      case 'Archive': return <Archive className={iconClass} />;
      case 'Database': return <Database className={iconClass} />;
      case 'Activity': return <Activity className={iconClass} />;
      case 'Navigation': return <Navigation className={iconClass} />;
      case 'Compass': return <Compass className={iconClass} />;
      case 'ShieldCheck': return <ShieldCheck className={iconClass} />;
      case 'CreditCard': return <CreditCard className={iconClass} />;
      case 'Leaf': return <Leaf className={iconClass} />;
      case 'Radio': return <Radio className={iconClass} />;
      case 'Users': return <Users className={iconClass} />;
      case 'BarChart3': return <BarChart3 className={iconClass} />;
      case 'Settings': return <Settings className={iconClass} />;
      case 'Sliders': return <Sliders className={iconClass} />;
      case 'Code2': return <Code2 className={iconClass} />;
      case 'Layers': return <Layers className={iconClass} />;
      case 'Plus': return <Plus className={iconClass} />;
      case 'Smartphone': return <Smartphone className={iconClass} />;
      case 'Package': return <Package className={iconClass} />;
      case 'AlertTriangle': return <AlertTriangle className={iconClass} />;
      default: return <Search className={iconClass} />;
    }
  };

  // Highlights search query matches
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const clean = query.replace(/^[a-z]+:/i, '').trim();
    if (!clean) return <span>{text}</span>;

    const regex = new RegExp(`(${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span
              key={i}
              className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold px-0.5 rounded-xs"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Badge color helper
  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'amber':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'blue':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30';
      case 'rose':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'slate':
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30';
    }
  };

  // Group items by category for clear presentation
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};
    for (const item of searchResults) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [searchResults]);

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between gap-4 border-b transition-colors z-20 bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 backdrop-blur-md text-slate-900 dark:text-white">
      {/* Zone 1: Mobile toggle & Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="p-2 rounded-lg md:hidden transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectDashboard?.()}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center shadow-xs">
            <span className="font-extrabold text-white text-sm tracking-tight">AF</span>
          </div>
          <span className="hidden sm:inline font-bold text-base tracking-tight text-slate-900 dark:text-white">
            Afronala Control
          </span>
        </button>
      </div>

      {/* Zone 2: Universal Global Search Bar with Intellisense */}
      <div
        ref={searchContainerRef}
        className="flex-1 max-w-2xl mx-2 relative hidden sm:block"
      >
        <div
          className={`relative flex items-center transition-all duration-150 rounded-xl border ${
            isSearchOpen
              ? 'ring-2 ring-cyan-500/40 border-cyan-500 bg-white dark:bg-slate-900 shadow-lg'
              : 'border-slate-200 dark:border-slate-700/80 bg-slate-100/90 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800'
          }`}
        >
          <div className="pl-3.5 pr-2 py-2 flex items-center pointer-events-none text-cyan-600 dark:text-cyan-400 shrink-0">
            <Search className="w-4 h-4" />
          </div>

          <div className="relative flex-1 flex items-center">
            {/* Ghost text completion overlay */}
            {ghostText && isSearchOpen && (
              <div
                className="absolute inset-0 flex items-center pointer-events-none text-xs text-slate-400/50 dark:text-slate-500/60 font-medium whitespace-pre overflow-hidden"
                aria-hidden="true"
              >
                <span className="opacity-0">{searchQuery}</span>
                <span>{ghostText.slice(searchQuery.length)}</span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-200/60 dark:bg-slate-800/80 text-cyan-700 dark:text-cyan-300 font-mono">
                  Tab ⇥
                </span>
              </div>
            )}

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="Global Search (drivers, plates, trips, classes, documents, tariffs)..."
              className="w-full py-2 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none pr-8"
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="p-1 mr-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="pr-3 flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Open full command palette modal"
              className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-cyan-500 transition-colors"
            >
              ⌘K
            </button>
          </div>
        </div>

        {/* Global Search & Intellisense Dropdown Panel */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Intellisense Clues Bar */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/70">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Intellisense Search Clues</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                    · Click a prefix or type it to filter
                  </span>
                </div>
                {searchResults.length > 0 && (
                  <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-mono font-medium">
                    {searchResults.length} matching items
                  </span>
                )}
              </div>

              {/* Scope Prefix Chips */}
              <div className="flex flex-wrap gap-1.5">
                {INTELLISENSE_CLUES.map((clue) => {
                  const isActive = searchQuery.toLowerCase().startsWith(clue.prefix);
                  return (
                    <button
                      key={clue.prefix}
                      type="button"
                      onClick={() => {
                        setSearchQuery(clue.prefix);
                        searchInputRef.current?.focus();
                      }}
                      onMouseEnter={() => setActiveClueTooltip(clue)}
                      onMouseLeave={() => setActiveClueTooltip(null)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 border ${
                        isActive
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                          : 'bg-white dark:bg-slate-800/90 hover:bg-cyan-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold">{clue.prefix}</span>
                      <span className="text-[10px] opacity-75 font-sans">{clue.label.replace('Filter by ', '')}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Clue Clue/Hint Banner */}
              {activeClueTooltip && (
                <div className="mt-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-slate-700 dark:text-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                      {activeClueTooltip.prefix}
                    </span>{' '}
                    — {activeClueTooltip.description}
                  </div>
                  <span className="font-mono text-[10px] text-cyan-800 dark:text-cyan-400 shrink-0">
                    e.g. {activeClueTooltip.example}
                  </span>
                </div>
              )}
            </div>

            {/* Results List */}
            <div
              ref={resultsListRef}
              className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40 text-xs"
            >
              {searchResults.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No results found for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Try searching with intellisense prefixes like{' '}
                    <code className="text-cyan-600 dark:text-cyan-400">driver:</code>,{' '}
                    <code className="text-cyan-600 dark:text-cyan-400">plate:AA-</code>,{' '}
                    <code className="text-cyan-600 dark:text-cyan-400">trip:Bole</code>, or{' '}
                    <code className="text-cyan-600 dark:text-cyan-400">class:Ride</code>.
                  </p>
                </div>
              ) : (
                Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category} className="py-2 first:pt-0 last:pb-0">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span>{category}</span>
                      <span className="text-[10px] font-mono">{items.length}</span>
                    </div>

                    <div className="space-y-1 mt-1">
                      {items.map((item) => {
                        const globalIndex = searchResults.findIndex((r) => r.id === item.id);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectItem(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/70 shadow-xs'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {renderItemIcon(item.iconName)}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {renderHighlightedText(item.title, searchQuery)}
                                  </span>

                                  {item.badge && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getBadgeStyle(
                                        item.badgeColor
                                      )}`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                                  {renderHighlightedText(item.subtitle, searchQuery)}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5 mt-1">
                              {isSelected ? (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-100/70 dark:bg-cyan-900/50 px-2 py-0.5 rounded-md">
                                  <span>Jump</span>
                                  <CornerDownLeft className="w-3 h-3" />
                                </span>
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Bar with Keyboard Cheatsheet */}
            <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    Tab
                  </kbd>
                  <span>Intellisense Complete</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    Esc
                  </kbd>
                  <span>Close</span>
                </span>
              </div>

              <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
                Afronala SuperApp Universal Index
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Zone 3: Operational Controls & Persona Switcher */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {onOpenDispatchSimulator && (
          <button
            onClick={onOpenDispatchSimulator}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 bg-slate-100 hover:bg-cyan-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700"
            title="Launch Autonomous GPS Dispatch Simulator"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-mono text-[11px]">Radar Sim</span>
          </button>
        )}

        {/* Back4App Proxy Health Button */}
        <button
          onClick={onOpenDbModal}
          title="Back4App Server Proxy Status"
          className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="text-[11px] font-mono">Back4App</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {dbStatus.latency > 0 ? `${dbStatus.latency}ms` : 'Cached'}
          </span>
        </button>

        {/* AmbaLay Maps Console */}
        {onOpenAmbaLay && (
          <button
            onClick={onOpenAmbaLay}
            title="AmbaLay Maps Ethiopia Geospatial Engine"
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 border-cyan-200 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-300"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-[11px] font-mono font-semibold">AmbaLay</span>
          </button>
        )}

        {/* Country-Specific Operations Restriction Toggle */}
        {onToggleRestrictToCountry && (
          <button
            type="button"
            role="switch"
            aria-checked={restrictToCountry}
            onClick={onToggleRestrictToCountry}
            title={
              restrictToCountry
                ? `Operational metrics & notifications restricted to ${assignedCountryName} (${assignedCountryCode}). Click to view All East Africa.`
                : `Viewing Pan-East Africa metrics. Click to restrict to your assigned country (${assignedCountryName}).`
            }
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
              restrictToCountry
                ? 'bg-cyan-50/90 dark:bg-cyan-950/70 border-cyan-400 dark:border-cyan-500/70 text-cyan-900 dark:text-cyan-200 shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-sm shrink-0 leading-none">
              {restrictToCountry ? assignedCountryFlag : '🌍'}
            </span>
            <span className="hidden sm:inline font-bold">
              {restrictToCountry ? `${assignedCountryCode} Only` : 'All EAC'}
            </span>
            <span
              className={`w-6 h-3.5 rounded-full p-0.5 flex items-center transition-colors duration-200 ease-in-out shrink-0 ${
                restrictToCountry ? 'bg-cyan-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-2xs" />
            </span>
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle dark/light theme"
          className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          aria-label="View notifications"
          className="p-2 rounded-lg relative transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        {/* RBAC Persona Switcher Dropdown */}
        <div ref={menuRef} className="relative pl-2 border-l border-slate-200 dark:border-slate-800">
          {(() => {
            const userCountryFlag =
              user.jurisdictionCountry === 'ET' ? '🇪🇹' :
              user.jurisdictionCountry === 'KE' ? '🇰🇪' :
              user.jurisdictionCountry === 'RW' ? '🇷🇼' :
              user.jurisdictionCountry === 'UG' ? '🇺🇬' :
              user.jurisdictionCountry === 'TZ' ? '🇹🇿' :
              user.jurisdictionCountry === 'DJ' ? '🇩🇯' :
              user.jurisdictionCountry === 'SO' ? '🇸🇴' :
              user.jurisdictionCountry === 'SS' ? '🇸🇸' : '🌍';
            return (
              <button
                type="button"
                onClick={() => setPersonaMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={`${user.name} (${user.role} · ${user.jurisdictionName || 'East Africa'})`}
              >
                <div className="relative shrink-0">
                  {user.avatar && !avatarFailed ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-xs filter drop-shadow-xs">
                    {userCountryFlag}
                  </span>
                </div>
                <div className="hidden xl:block text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold leading-tight text-slate-900 dark:text-white whitespace-nowrap">
                      {user.name}
                    </p>
                  </div>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium whitespace-nowrap">
                    {user.role} · {userCountryFlag} {user.jurisdictionCountry || 'ET'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
              </button>
            );
          })()}

          {personaMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Operator Station &amp; Persona
                  </span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                    Live Session
                  </span>
                </div>

                {onOpenProfileModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setPersonaMenuOpen(false);
                      onOpenProfileModal();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>View Operator Profile &amp; Station</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onToggleRestrictToCountry && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{assignedCountryFlag}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {assignedCountryCode} Scope Only
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {restrictToCountry ? 'Restricted to operational station' : 'All East Africa visible'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={restrictToCountry}
                      onClick={onToggleRestrictToCountry}
                      className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                        restrictToCountry ? 'bg-cyan-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white shadow-2xs" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
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
                        onSwitchPersona?.(persona);
                        setPersonaMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start justify-between gap-2 ${
                        isActive
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-base shrink-0 mt-0.5">
                          {flag}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {persona.name}
                            </span>
                            <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-medium whitespace-nowrap">
                              · {persona.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                            {persona.jurisdictionName} · {persona.scopeSummary}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {onLogout && (
                <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
                  <span className="px-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Enforced on API & UI</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonaMenuOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Panel</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
