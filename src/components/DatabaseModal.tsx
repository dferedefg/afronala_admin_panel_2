import React, { useState } from 'react';
import { Database, X, CheckCircle2, RefreshCw, ShieldCheck, Copy, Check } from 'lucide-react';
import { BACK4APP_CONFIG, back4AppService } from '../services/back4app';
import { Back4AppCloudStatus } from '../types';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onRefreshData: () => Promise<void>;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Back4AppCloudStatus | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await back4AppService.checkHealth();
      setTestResult(res);
      await onRefreshData();
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl p-6 rounded-2xl border shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Back4App Parse Cloud Proxy
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Server-side credential isolation via Express proxy routes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-5 space-y-4 text-xs">
          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-emerald-900 dark:text-emerald-200">
              <p className="font-semibold">Zero Client-Side Secret Exposure</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                X-Parse-REST-API-Key and Application credentials are injected exclusively on the Node/Express server (<span className="font-mono">/api/back4app/*</span>).
              </p>
            </div>
          </div>

          {/* Masked Proxy Metadata */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono">
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-sans">
                <span>Application ID (Masked):</span>
                <button
                  onClick={() => copyToClipboard(BACK4APP_CONFIG.applicationId, 'appId')}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                >
                  {copiedKey === 'appId' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'appId' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-700 dark:text-cyan-300">
                {testResult?.maskedAppId || BACK4APP_CONFIG.applicationId}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-sans">
                <span>Server Proxy Endpoint:</span>
                <button
                  onClick={() => copyToClipboard('/api/back4app/classes/*', 'endpoint')}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                >
                  {copiedKey === 'endpoint' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'endpoint' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                {BACK4APP_CONFIG.restApiKey}
              </p>
            </div>
          </div>

          {/* Connected Schemas */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Synchronized Parse Classes
            </span>
            <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
              ModuleRegistry · Driver · Vehicle · Trip · Shipment · Customer · WebhookSubscription
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                testResult.online
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {testResult.online
                    ? 'Parse Cloud Proxy Online & Synchronized'
                    : 'Local Cache Mode Active (Cloud Unreachable)'}
                </span>
              </div>
              <span className="font-mono font-bold tabular-nums">
                {testResult.latency > 0 ? `${testResult.latency}ms` : 'Local'}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Verifying Proxy...' : 'Test Cloud Connection'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
