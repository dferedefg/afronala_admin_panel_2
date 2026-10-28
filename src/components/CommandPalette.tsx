import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Car,
  Truck,
  Users,
  Sliders,
  Settings,
  Bell,
  Plus,
  Moon,
  Sun,
  Database,
  Code2,
  ArrowRight,
  Navigation,
  Radio,
  Layers,
  Compass,
  ShieldCheck,
  CreditCard,
  Leaf,
  BarChart3,
  FileCheck2,
  Gavel,
  Flame,
  Archive,
  Activity,
  Sparkles,
  Smartphone,
  Package,
  AlertTriangle,
  CornerDownLeft,
  X,
} from 'lucide-react';
import {
  CustomerAccount,
  Driver,
  ModuleItem,
  Shipment,
  SystemAlert,
  Trip,
  Vehicle,
} from '../types';
import {
  getIntellisenseSuggestions,
  INTELLISENSE_CLUES,
  IntellisenseClue,
  searchGlobalIndex,
  SearchResultItem,
} from '../services/globalSearch';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, filterValue?: string) => void;
  onToggleTheme: () => void;
  onOpenDbModal: () => void;
  onOpenFlutterModal: () => void;
  onOpenRegisterModal: () => void;
  onOpenSchemaModal?: () => void;
  onOpenDriverSimulator?: () => void;
  darkMode: boolean;
  drivers?: Driver[];
  vehicles?: Vehicle[];
  trips?: Trip[];
  shipments?: Shipment[];
  customers?: CustomerAccount[];
  modules?: ModuleItem[];
  alerts?: SystemAlert[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  onOpenDbModal,
  onOpenFlutterModal,
  onOpenRegisterModal,
  onOpenSchemaModal,
  onOpenDriverSimulator,
  darkMode,
  drivers = [],
  vehicles = [],
  trips = [],
  shipments = [],
  customers = [],
  modules = [],
  alerts = [],
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeClueTooltip, setActiveClueTooltip] = useState<IntellisenseClue | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  const results = useMemo(
    () => searchGlobalIndex(query, searchData),
    [query, searchData]
  );

  const { ghostText, recommendedClue } = useMemo(
    () => getIntellisenseSuggestions(query, searchData),
    [query, searchData]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchResultItem) => {
    onClose();

    if (item.actionModal) {
      if (item.actionModal === 'db') onOpenDbModal();
      else if (item.actionModal === 'flutter') onOpenFlutterModal();
      else if (item.actionModal === 'register') onOpenRegisterModal();
      else if (item.actionModal === 'schema') onOpenSchemaModal?.();
      else if (item.actionModal === 'driver-simulator') onOpenDriverSimulator?.();
      return;
    }

    if (item.id === 'nav-theme') {
      onToggleTheme();
    } else if (item.actionTab) {
      onNavigate(item.actionTab, item.filterValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, results.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Tab' || (e.key === 'ArrowRight' && inputRef.current?.selectionStart === query.length)) {
      if (ghostText && ghostText.toLowerCase() !== query.toLowerCase()) {
        e.preventDefault();
        setQuery(ghostText);
      } else if (recommendedClue && !query.includes(':')) {
        e.preventDefault();
        setQuery(recommendedClue.prefix);
      }
    }
  };

  const renderIcon = (name: string) => {
    const iconClass = 'w-4 h-4 shrink-0';
    switch (name) {
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

  const renderHighlighted = (text: string, q: string) => {
    if (!q.trim()) return <span>{text}</span>;
    const clean = q.replace(/^[a-z]+:/i, '').trim();
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        {/* Search header with ghost text */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900">
          <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          
          <div className="relative flex-1 flex items-center">
            {ghostText && (
              <div
                className="absolute inset-0 flex items-center pointer-events-none text-sm text-slate-400/50 dark:text-slate-500/60 font-medium whitespace-pre overflow-hidden"
                aria-hidden="true"
              >
                <span className="opacity-0">{query}</span>
                <span>{ghostText.slice(query.length)}</span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-200/60 dark:bg-slate-800/80 text-cyan-700 dark:text-cyan-300 font-mono">
                  Tab ⇥
                </span>
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              placeholder="Search entire panel (modules, drivers, plates, trips, classes, tariffs)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
          </div>

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Intellisense Clues Bar */}
        <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Intellisense Search Scopes</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
              {results.length} results
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {INTELLISENSE_CLUES.map((clue) => {
              const isActive = query.toLowerCase().startsWith(clue.prefix);
              return (
                <button
                  key={clue.prefix}
                  type="button"
                  onClick={() => {
                    setQuery(clue.prefix);
                    inputRef.current?.focus();
                  }}
                  onMouseEnter={() => setActiveClueTooltip(clue)}
                  onMouseLeave={() => setActiveClueTooltip(null)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors flex items-center gap-1 border ${
                    isActive
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="font-bold">{clue.prefix}</span>
                  <span className="text-[9px] opacity-75 font-sans">{clue.label.replace('Filter by ', '')}</span>
                </button>
              );
            })}
          </div>

          {activeClueTooltip && (
            <div className="mt-2 p-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <div>
                <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                  {activeClueTooltip.prefix}
                </span>{' '}
                — {activeClueTooltip.description}
              </div>
              <span className="font-mono text-cyan-800 dark:text-cyan-400 shrink-0">
                e.g. {activeClueTooltip.example}
              </span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40 text-xs"
        >
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No matching items found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try searching for names, vehicle plates (e.g. <code className="text-cyan-600">AA-12345</code>), locations, or Parse classes.
              </p>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
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
                      {renderIcon(item.iconName)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {renderHighlighted(item.title, query)}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                        {renderHighlighted(item.subtitle, query)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 mt-1">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-100/70 dark:bg-cyan-900/50 px-2 py-0.5 rounded-md">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Tab Complete</span>
            <span>ESC Close</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
            Universal Panel Search
          </span>
        </div>
      </div>
    </div>
  );
};
