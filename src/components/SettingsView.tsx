import React from 'react';
import { ShieldCheck, Moon, Sun, Database, Smartphone, Globe, CheckCircle2 } from 'lucide-react';
import { BACK4APP_CONFIG } from '../services/back4app';
import { AdminUser } from '../types';
import { DEMO_PERSONAS } from '../services/rbac';

interface SettingsViewProps {
  darkMode: boolean;
  user?: AdminUser;
  onToggleTheme: () => void;
  onOpenDbModal: () => void;
  onOpenFlutterModal: () => void;
  onSwitchPersona?: (persona: AdminUser) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  user,
  onToggleTheme,
  onOpenDbModal,
  onOpenFlutterModal,
  onSwitchPersona,
}) => {
  const cardClass =
    'p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Settings &amp; Governance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Platform role governance, server-proxied cloud credentials, and workspace appearance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance & Themes */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Appearance &amp; Theme Mode
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dual-theme WCAG AA contrast calibration
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Current Mode: {darkMode ? 'Obsidian Dark' : 'Clean Light'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Persisted automatically across browser sessions
              </p>
            </div>
            <button
              onClick={onToggleTheme}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors whitespace-nowrap"
            >
              Switch to {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* Back4App Parse Integration */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Back4App Parse Cloud Proxy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server-proxied REST connection &amp; schemas
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Application ID:</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                {BACK4APP_CONFIG.applicationId}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Security Mode:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Express Server Proxy</span>
              </span>
            </div>
            <button
              onClick={onOpenDbModal}
              className="w-full mt-2 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Inspect Proxy &amp; Schema Status
            </button>
          </div>
        </div>

        {/* Mobile App & Flutter SDK */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Flutter / Dart Mobile Client
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Passenger &amp; Driver starter bundle
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Export production-ready Dart 3.x models and Parse LiveQuery services synchronized with your active SuperApp module registry.
          </p>

          <button
            onClick={onOpenFlutterModal}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Open Flutter SDK Generator
          </button>
        </div>

        {/* Regional Dispatch Hub & Active Authority */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Regional Dispatch &amp; RBAC Authority
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Addis Ababa &amp; Regional Corridors
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Primary Currency:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ETB (Ethiopian Birr)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Timezone:</span>
              <span className="font-mono text-slate-900 dark:text-white">
                East Africa Time (UTC+3)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Active Operator:</span>
              <span className="text-cyan-700 dark:text-cyan-400 font-semibold">
                {user ? `${user.name} · ${user.role}` : 'Daniel Ferede · Super Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Matrix Reference */}
      {onSwitchPersona && (
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Role-Based Access Control (RBAC) Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch active operator persona to verify UI action guards and Express API authorization
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {DEMO_PERSONAS.map((persona) => {
              const active = user?.role === persona.role;
              return (
                <button
                  key={persona.role}
                  type="button"
                  onClick={() => onSwitchPersona(persona)}
                  className={`p-3.5 rounded-xl border text-left transition-colors ${
                    active
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 dark:border-cyan-700'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{persona.role}</span>
                    {active && (
                      <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    {persona.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                    {persona.scopeSummary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
