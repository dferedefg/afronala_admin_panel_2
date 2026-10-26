import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AdminUser } from '../types';
import { DEMO_PERSONAS, getInitials } from '../services/rbac';

interface LoginViewProps {
  onLogin: (user: AdminUser) => void;
  darkMode: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, darkMode }) => {
  const [email, setEmail] = useState('daniel@afronala.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const matchedPersona = DEMO_PERSONAS.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    );
    setTimeout(() => {
      onLogin(
        matchedPersona || {
          name: 'Daniel Ferede',
          email: email || 'daniel@afronala.com',
          role: 'Super Admin',
          avatar: '/src/assets/images/avatar_admin_daniel_1792851958392.jpg',
          status: 'online',
        }
      );
      setIsLoading(false);
    }, 250);
  };

  const handleForgotPassword = () => {
    setResetSentEmail(email.trim() || 'daniel@afronala.com');
  };

  return (
    <div
      className={`min-h-screen w-full relative flex flex-col justify-between overflow-hidden transition-colors ${
        darkMode ? 'bg-[#060a12] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <header className="relative z-10 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-sm">
            <span className="font-extrabold text-white text-base">AF</span>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
            Afronala Control Center
          </span>
        </div>

        <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 font-mono">
          Addis Ababa Operations · Back4App Proxy Active
        </span>
      </header>

      {/* Main Split Grid */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch flex-1">
        {/* Left Side: Login & RBAC Persona Switcher */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto flex flex-col justify-center">
          <div className="rounded-2xl p-7 sm:p-8 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Sign in to Operations
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Authenticate with your Afronala credentials or launch a role-scoped demo persona.
              </p>
            </div>

            {resetSentEmail && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-emerald-900 dark:text-emerald-200">
                  <p className="font-semibold">Password recovery dispatched</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Verification instructions sent to <span className="font-mono">{resetSentEmail}</span>.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="daniel@afronala.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                  />
                  <span>Remember session</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* 4-Persona RBAC Quick Demo Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Role-Scoped Quick Access
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>4 RBAC Personas</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {DEMO_PERSONAS.map((persona) => (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => onLogin(persona)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-left border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-600/15 text-cyan-700 dark:text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {getInitials(persona.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {persona.role}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {persona.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Hero Visual & Statement */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="relative w-full h-80 sm:h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
            {!heroImgFailed ? (
              <img
                src="/src/assets/images/hero_afronala_globe_1792851957511.jpg"
                alt="Afronala Mobility and Freight Network across East Africa"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-7 left-7 right-7 text-left">
              <p className="text-xs font-medium text-cyan-300">
                East African SuperApp Operations · Addis Ababa &amp; Regional Corridors
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1.5 max-w-xl">
                Unified Command for City Mobility, Heavy Freight, and Digital Clearing.
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-lg leading-relaxed">
                Real-time Back4App schema governance, AmbaLay geospatial dispatch, and Telebirr &amp; CBE Birr driver wallet settlements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Footer */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-900">
        Afronala SuperApp Control Center · East Africa Time (UTC+3)
      </footer>
    </div>
  );
};
