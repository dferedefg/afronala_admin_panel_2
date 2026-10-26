import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Database,
  Menu,
  Code2,
  ChevronDown,
  Navigation,
  Compass,
  Smartphone,
  ShieldCheck,
  LogOut,
  Check,
} from 'lucide-react';
import { AdminUser } from '../types';
import { DEMO_PERSONAS, getInitials } from '../services/rbac';

interface TopBarProps {
  user: AdminUser;
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenDbModal: () => void;
  onOpenFlutterModal: () => void;
  onOpenDispatchSimulator?: () => void;
  onOpenSchemaEditor?: () => void;
  onOpenAmbaLay?: () => void;
  onToggleDriverSimulator?: () => void;
  isDriverSimulatorOpen?: boolean;
  onToggleSidebar: () => void;
  unreadCount: number;
  dbStatus: { online: boolean; latency: number };
  onSelectDashboard?: () => void;
  onSwitchPersona?: (persona: AdminUser) => void;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  darkMode,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenDbModal,
  onOpenFlutterModal,
  onOpenDispatchSimulator,
  onOpenAmbaLay,
  onToggleDriverSimulator,
  isDriverSimulatorOpen = false,
  onToggleSidebar,
  unreadCount,
  dbStatus,
  onSelectDashboard,
  onSwitchPersona,
  onLogout,
}) => {
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user.avatar, user.name]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPersonaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* Zone 2: Command Search Bar (Ctrl+K) */}
      <div className="flex-1 max-w-xl mx-2 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs transition-colors border bg-slate-100/90 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">Search modules, drivers, customers, shipments...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded text-[10px] font-mono border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Operational Controls & Persona Switcher */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {onToggleDriverSimulator && (
          <button
            onClick={onToggleDriverSimulator}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isDriverSimulatorOpen
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle In-Cab Driver Phone Companion Simulator"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-mono text-[11px] hidden sm:inline">Driver HUD</span>
          </button>
        )}

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
            <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
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

        {/* Flutter SDK Export */}
        <button
          onClick={onOpenFlutterModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          title="Flutter / Dart Architecture & SDK"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden md:inline font-mono text-[11px]">Flutter SDK</span>
        </button>

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
          <button
            type="button"
            onClick={() => setPersonaMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Switch Admin Role Persona"
          >
            {user.avatar && !avatarFailed ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {getInitials(user.name)}
              </div>
            )}
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold leading-tight text-slate-900 dark:text-white whitespace-nowrap">
                {user.name}
              </p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium whitespace-nowrap">
                {user.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
          </button>

          {personaMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Switch RBAC Persona
                  </span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                    Live Access Guard
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Test role-scoped permissions across modules, fleet, freight, and treasury.
                </p>
              </div>

              <div className="p-2 space-y-1">
                {DEMO_PERSONAS.map((persona) => {
                  const isActive = user.role === persona.role;
                  return (
                    <button
                      key={persona.role}
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
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {getInitials(persona.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {persona.name}
                            </span>
                            <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-medium whitespace-nowrap">
                              · {persona.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                            {persona.scopeSummary}
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
