import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  KeyRound,
  Database,
  Server,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wrench,
  RotateCcw,
  Layers,
  FlaskConical,
} from 'lucide-react';
import {
  ConnectivityPingResult,
  DiagnosticAutoFixAction,
  DiagnosticAutoFixReport,
  TriggeredActivityPulse,
} from '../types';
import { back4AppService } from '../services/back4app';
import { ActivityStream } from './ActivityStream';

interface BridgeDiagnosticsViewProps {
  darkMode: boolean;
  userRole: string;
  activePulses?: TriggeredActivityPulse[];
  onPulsesUpdated?: (
    pulses: TriggeredActivityPulse[],
    newlyTriggered?: TriggeredActivityPulse[]
  ) => void;
  onAcknowledgePulse?: (pulseId: string) => void;
  onNavigateDashboard?: () => void;
  onSchemaResynced?: () => Promise<void> | void;
  onNotify?: (
    title: string,
    message?: string,
    type?: 'success' | 'info' | 'warning' | 'error'
  ) => void;
}

export const BridgeDiagnosticsView: React.FC<BridgeDiagnosticsViewProps> = ({
  darkMode,
  userRole,
  activePulses,
  onPulsesUpdated,
  onAcknowledgePulse,
  onNavigateDashboard,
  onSchemaResynced,
  onNotify,
}) => {
  const [pingResult, setPingResult] = useState<ConnectivityPingResult | null>(null);
  const [pingHistory, setPingHistory] = useState<ConnectivityPingResult[]>([]);
  const [runningPing, setRunningPing] = useState<boolean>(false);
  const [sessionTokenInput, setSessionTokenInput] = useState<string>(() =>
    back4AppService.getDiagnosticSessionToken()
  );
  const [cleanupProbe, setCleanupProbe] = useState<boolean>(true);

  // Diagnostic Auto-Fixer State
  const [runningAutoFix, setRunningAutoFix] = useState<DiagnosticAutoFixAction | null>(null);
  const [autoFixHistory, setAutoFixHistory] = useState<DiagnosticAutoFixReport[]>(() =>
    back4AppService.getAutoFixHistory()
  );
  const [autoHealOn502, setAutoHealOn502] = useState<boolean>(false);

  const handleSessionTokenChange = (val: string) => {
    setSessionTokenInput(val);
    back4AppService.setDiagnosticSessionToken(val);
  };

  const handleRunAutoFixResetSession = useCallback(
    async (triggeredAutomatically = false) => {
      setRunningAutoFix('reset_session_tokens');
      try {
        const report = await back4AppService.autoResetStaleSessionTokens(sessionTokenInput);
        setSessionTokenInput('');
        setAutoFixHistory(back4AppService.getAutoFixHistory());
        if (report.postFixPing) {
          setPingResult(report.postFixPing);
          setPingHistory((prev) => [report.postFixPing!, ...prev].slice(0, 8));
        }

        onNotify?.(
          triggeredAutomatically
            ? 'Auto-Fixer Recovered 502 Session Fault'
            : report.success
            ? 'Stale Session Tokens Reset'
            : 'Session Reset Completed with Warnings',
          `${report.summary} (${report.durationMs}ms)`,
          report.success ? 'success' : 'warning'
        );
      } finally {
        setRunningAutoFix(null);
      }
    },
    [sessionTokenInput, onNotify]
  );

  const handleRunAutoFixSchemaResync = useCallback(async () => {
    setRunningAutoFix('full_schema_resync');
    try {
      const report = await back4AppService.triggerFullSchemaResync();
      setSessionTokenInput('');
      setAutoFixHistory(back4AppService.getAutoFixHistory());
      if (report.postFixPing) {
        setPingResult(report.postFixPing);
        setPingHistory((prev) => [report.postFixPing!, ...prev].slice(0, 8));
      }
      await onSchemaResynced?.();

      onNotify?.(
        report.success ? 'Full Schema Re-Sync Verified' : 'Schema Re-Sync Completed',
        `${report.summary} (${report.durationMs}ms)`,
        report.success ? 'success' : 'warning'
      );
    } finally {
      setRunningAutoFix(null);
    }
  }, [onNotify, onSchemaResynced]);

  const executePingTest = useCallback(
    async (
      silentToast = false,
      simulateFault?: '502-gateway' | 'handshake-failure'
    ) => {
      setRunningPing(true);
      try {
        const res = await back4AppService.runConnectivityPingTest({
          sessionToken: sessionTokenInput.trim() || undefined,
          cleanupProbe,
          simulateFault,
        });
        setPingResult(res);
        setPingHistory((prev) => [res, ...prev].slice(0, 8));

        const encountered502OrHandshake =
          !res.handshake.ok ||
          res.handshake.statusCode === 502 ||
          res.overallStatus === 'unreachable';

        if (!silentToast) {
          if (res.overallStatus === 'healthy') {
            onNotify?.(
              'Connectivity Ping Passed',
              `Handshake ${res.handshake.latencyMs}ms · ConnectionTest R/W verified (${res.totalRoundTripMs}ms total).`,
              'success'
            );
          } else if (res.overallStatus === 'degraded') {
            onNotify?.(
              'Bridge Connectivity Degraded',
              res.connectionTest.writeError ||
                res.session.detail ||
                'Gateway reachable, but session or ConnectionTest probe reported an issue. Use Diagnostic Auto-Fixer below.',
              'warning'
            );
          } else {
            onNotify?.(
              'HTTP 502 / Handshake Failure Detected',
              res.handshake.detail ||
                'Could not complete Back4App Parse handshake. Diagnostic Auto-Fixer is ready.',
              'error'
            );
          }
        }

        if (encountered502OrHandshake && autoHealOn502 && !simulateFault) {
          await handleRunAutoFixResetSession(true);
        }
      } finally {
        setRunningPing(false);
      }
    },
    [sessionTokenInput, cleanupProbe, onNotify, autoHealOn502, handleRunAutoFixResetSession]
  );

  useEffect(() => {
    executePingTest(true);
    // Run initial diagnostic ping once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderStatusIndicator = (ok: boolean | undefined, pending: boolean) => {
    if (pending) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Testing...
        </span>
      );
    }
    if (ok) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        Failed
      </span>
    );
  };

  const overallBanner = () => {
    if (!pingResult) {
      return {
        label: 'Initializing Probe...',
        tone: 'text-slate-600 dark:text-slate-400',
        Icon: RefreshCw,
      };
    }
    if (pingResult.overallStatus === 'healthy') {
      return {
        label: 'Live & Synchronized with SuperApp Backend',
        tone: 'text-emerald-700 dark:text-emerald-400',
        Icon: CheckCircle2,
      };
    }
    if (pingResult.overallStatus === 'degraded') {
      return {
        label: 'Partial Reachability — Auto-Fixer Recommended',
        tone: 'text-amber-700 dark:text-amber-400',
        Icon: AlertTriangle,
      };
    }
    return {
      label: 'HTTP 502 / Handshake Failure — Auto-Fixer Ready',
      tone: 'text-rose-700 dark:text-rose-400',
      Icon: XCircle,
    };
  };

  const banner = overallBanner();
  const BannerIcon = banner.Icon;

  const is502OrHandshakeFailure = Boolean(
    pingResult &&
      (!pingResult.handshake.ok ||
        pingResult.handshake.statusCode === 502 ||
        pingResult.overallStatus === 'unreachable' ||
        pingResult.session.statusCode === 502 ||
        pingResult.connectionTest.writeStatus === 502)
  );
  const isSessionFault = Boolean(pingResult && !pingResult.session.valid);
  const isSchemaOrProbeFault = Boolean(
    pingResult &&
      (!pingResult.connectionTest.writeOk ||
        !pingResult.connectionTest.readOk ||
        !pingResult.connectionTest.nonceMatched)
  );
  const hasDiagnosticFault = is502OrHandshakeFailure || isSessionFault || isSchemaOrProbeFault;

  return (
    <div className="space-y-6">
      {/* Page Breadcrumb & Primary Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span>SuperApp Governance</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              Bridge Diagnostics &amp; .apk Activity Monitor
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Back4App Connectivity &amp; .apk Telemetry Console
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Verify Parse proxy handshake latency, remediate <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">502</span> or stale session faults via the Diagnostic Auto-Fixer, and configure live <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">ActivityLog</span> alert rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => executePingTest(false, '502-gateway')}
            disabled={runningPing || Boolean(runningAutoFix)}
            title="Inject a diagnostic 502 handshake failure to test Auto-Fixer remediation"
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Simulate 502 Fault
          </button>

          <button
            type="button"
            onClick={() => executePingTest(false)}
            disabled={runningPing || Boolean(runningAutoFix)}
            className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs transition-colors"
          >
            <Activity className={`w-4 h-4 ${runningPing ? 'animate-pulse' : ''}`} />
            {runningPing ? 'Running Connectivity Ping...' : 'Run Connectivity Ping Test'}
          </button>
        </div>
      </div>

      {/* Diagnostic Probe Configuration & Summary Strip */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top Status Summary */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className={`inline-flex items-center gap-1.5 font-bold text-sm ${banner.tone}`}>
              <BannerIcon
                className={`w-4 h-4 shrink-0 ${!pingResult && runningPing ? 'animate-spin' : ''}`}
              />
              {banner.label}
            </span>
            {pingResult && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  Round-Trip: <strong>{pingResult.totalRoundTripMs} ms</strong>
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  App ID {pingResult.maskedAppId}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  Client Key {pingResult.maskedClientKey}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  Active Persona: <strong className="text-slate-900 dark:text-white">{userRole}</strong>
                </span>
              </>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={cleanupProbe}
              onChange={(e) => setCleanupProbe(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <span>Auto-delete dummy ConnectionTest record after verification</span>
          </label>
        </div>

        {/* Optional Mobile .apk Session Token Verifier Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <Smartphone className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
            <span>
              <strong>Optional .apk Session Token Check:</strong> Paste an{' '}
              <span className="font-mono">X-Parse-Session-Token</span> (<span className="font-mono">r:...</span>) from mobile logs or <span className="font-mono">_Session</span> to validate against <span className="font-mono">/users/me</span>, or leave blank to verify proxy REST credentials.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-96 shrink-0">
            <input
              type="text"
              value={sessionTokenInput}
              onChange={(e) => handleSessionTokenChange(e.target.value)}
              placeholder="r:a1b2c3d4... (optional mobile session token)"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            {sessionTokenInput && (
              <button
                type="button"
                onClick={() => handleSessionTokenChange('')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 4-Stage Diagnostic Verification Grid (Single-Elevation Divider Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Stage 1: Handshake Latency */}
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Server className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  1. Parse Proxy Handshake
                </span>
                {renderStatusIndicator(pingResult?.handshake.ok, runningPing && !pingResult)}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {pingResult ? `${pingResult.handshake.latencyMs} ms` : '—'}
                </span>
                {pingResult && (
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    HTTP {pingResult.handshake.statusCode}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pingResult?.handshake.detail || 'Measuring TLS handshake to Back4App Parse REST gateway...'}
            </p>
          </div>

          {/* Stage 2: Session Token Validity */}
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                  2. Session &amp; Auth Validity
                </span>
                {renderStatusIndicator(pingResult?.session.valid, runningPing && !pingResult)}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {pingResult ? `${pingResult.session.latencyMs} ms` : '—'}
                </span>
                {pingResult && (
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    HTTP {pingResult.session.statusCode}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {pingResult?.session.principal || 'Checking credentials...'}
              </p>
              <p className="mt-0.5">{pingResult?.session.detail || 'Validating Parse session authority...'}</p>
            </div>
          </div>

          {/* Stage 3: ConnectionTest Write Probe */}
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Database className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  3. ConnectionTest Write
                </span>
                {renderStatusIndicator(
                  pingResult?.connectionTest.writeOk,
                  runningPing && !pingResult
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {pingResult ? `${pingResult.connectionTest.writeLatencyMs} ms` : '—'}
                </span>
                {pingResult && (
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    HTTP {pingResult.connectionTest.writeStatus}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pingResult?.connectionTest.writeOk ? (
                <>
                  <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    objectId: {pingResult.connectionTest.objectId}
                  </p>
                  <p className="mt-0.5">Created dummy probe document in Parse class ConnectionTest.</p>
                </>
              ) : (
                <p className="text-rose-700 dark:text-rose-400">
                  {pingResult?.connectionTest.writeError || 'Executing POST /classes/ConnectionTest...'}
                </p>
              )}
            </div>
          </div>

          {/* Stage 4: ConnectionTest Read-Back & Nonce Match */}
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  4. Read-Back &amp; Nonce Match
                </span>
                {renderStatusIndicator(
                  Boolean(
                    pingResult?.connectionTest.readOk && pingResult?.connectionTest.nonceMatched
                  ),
                  runningPing && !pingResult
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {pingResult ? `${pingResult.connectionTest.readLatencyMs} ms` : '—'}
                </span>
                {pingResult && (
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    HTTP {pingResult.connectionTest.readStatus || '—'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pingResult?.connectionTest.readOk ? (
                <>
                  <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 truncate">
                    Nonce {pingResult.connectionTest.nonceMatched ? 'Matched' : 'Mismatch'} ·{' '}
                    {pingResult.connectionTest.cleanupExecuted
                      ? pingResult.connectionTest.cleanupOk
                        ? `Cleaned (${pingResult.connectionTest.cleanupLatencyMs}ms)`
                        : 'Retained'
                      : 'Retained in DB'}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] truncate">
                    {pingResult.connectionTest.probeNonce}
                  </p>
                </>
              ) : (
                <p>
                  {pingResult?.connectionTest.readError ||
                    'Verifying GET /classes/ConnectionTest/:objectId...'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Auto-Fixer Bar (Elevated on 502 / Handshake / Stale Session Faults, Always Accessible for Preventive Maintenance) */}
        <div
          className={`p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 transition-colors ${
            is502OrHandshakeFailure
              ? 'bg-rose-50/85 dark:bg-rose-950/35'
              : hasDiagnosticFault
              ? 'bg-amber-50/85 dark:bg-amber-950/30'
              : 'bg-slate-50/70 dark:bg-slate-950/40'
          }`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 font-bold ${
                    is502OrHandshakeFailure
                      ? 'text-rose-800 dark:text-rose-300'
                      : hasDiagnosticFault
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 shrink-0" />
                  Diagnostic Auto-Fixer
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                {is502OrHandshakeFailure ? (
                  <span className="font-mono font-semibold text-rose-700 dark:text-rose-300 tabular-nums">
                    Action Required: HTTP {pingResult?.handshake.statusCode || 502} Handshake / Gateway Failure
                  </span>
                ) : hasDiagnosticFault ? (
                  <span className="font-mono font-semibold text-amber-800 dark:text-amber-300 tabular-nums">
                    Degraded Probe Detected ({!pingResult?.session.valid ? `Session HTTP ${pingResult?.session.statusCode}` : 'Schema / CLP Mismatch'})
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Standby · Ready for 502 / Stale Token Recovery
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                {is502OrHandshakeFailure
                  ? 'Upstream Parse proxy reported a 502 or TLS handshake failure. Auto-reset stale session tokens to restore Server Proxy REST Authority, or trigger a full schema re-sync across SuperApp Parse classes.'
                  : isSessionFault
                  ? 'The supplied X-Parse-Session-Token was rejected by Back4App (/users/me). Resetting stale session tokens revokes expired _Session credentials and restores clean proxy authority.'
                  : 'Remediate 502 handshake drops, expired mobile X-Parse-Session-Token state, or unprovisioned SuperApp schemas using Back4AppService recovery routines.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none mr-1">
                <input
                  type="checkbox"
                  checked={autoHealOn502}
                  onChange={(e) => setAutoHealOn502(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="whitespace-nowrap">Auto-reset on live 502</span>
              </label>

              <button
                type="button"
                onClick={() => handleRunAutoFixResetSession(false)}
                disabled={Boolean(runningAutoFix) || runningPing}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors disabled:opacity-60 ${
                  hasDiagnosticFault
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                    : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${
                    runningAutoFix === 'reset_session_tokens' ? 'animate-spin' : ''
                  }`}
                />
                {runningAutoFix === 'reset_session_tokens'
                  ? 'Resetting Session Tokens...'
                  : 'Auto-Reset Stale Session'}
              </button>

              <button
                type="button"
                onClick={handleRunAutoFixSchemaResync}
                disabled={Boolean(runningAutoFix) || runningPing}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors disabled:opacity-60 ${
                  is502OrHandshakeFailure || isSchemaOrProbeFault
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                    : 'border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300'
                }`}
              >
                <Layers
                  className={`w-3.5 h-3.5 ${
                    runningAutoFix === 'full_schema_resync' ? 'animate-pulse' : ''
                  }`}
                />
                {runningAutoFix === 'full_schema_resync'
                  ? 'Re-Syncing Full Schema...'
                  : 'Trigger Full Schema Re-Sync'}
              </button>
            </div>
          </div>

          {/* Recent Auto-Fix Remediation Audit Log */}
          {autoFixHistory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider">
                  Recent Auto-Fixer Remediation Runs
                </span>
                <span className="font-mono tabular-nums">
                  {autoFixHistory.length} {autoFixHistory.length === 1 ? 'operation' : 'operations'}
                </span>
              </div>
              <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80 text-xs">
                {autoFixHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(item.executedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                          })}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.action === 'reset_session_tokens'
                            ? 'Session Token Reset'
                            : 'Full Schema Re-Sync'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {item.summary}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] shrink-0">
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.durationMs} ms
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                        /
                      </span>
                      <span
                        className={
                          item.postFixPingStatus === 'healthy'
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-amber-700 dark:text-amber-400 font-semibold'
                        }
                      >
                        Post-Fix: {item.postFixPingStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Ping Run History Table */}
        {pingHistory.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800">
            <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Diagnostic Probe Run Log (Session History)
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {pingHistory.length} {pingHistory.length === 1 ? 'run' : 'runs'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <th className="py-2 px-4 whitespace-nowrap">Time</th>
                    <th className="py-2 px-4 whitespace-nowrap">Result</th>
                    <th className="py-2 px-4 whitespace-nowrap">Auth Mode</th>
                    <th className="py-2 px-4 whitespace-nowrap">ConnectionTest ObjectId</th>
                    <th className="py-2 px-4 whitespace-nowrap text-right">Handshake</th>
                    <th className="py-2 px-4 whitespace-nowrap text-right">Session</th>
                    <th className="py-2 px-4 whitespace-nowrap text-right">Write / Read</th>
                    <th className="py-2 px-4 whitespace-nowrap text-right">Total RTT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono tabular-nums">
                  {pingHistory.map((run) => (
                    <tr
                      key={run.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {new Date(run.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-sans font-semibold">
                        <span
                          className={
                            run.overallStatus === 'healthy'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : run.overallStatus === 'degraded'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }
                        >
                          {run.overallStatus === 'healthy'
                            ? 'Healthy'
                            : run.overallStatus === 'degraded'
                            ? 'Degraded'
                            : `Unreachable (${run.handshake.statusCode})`}
                        </span>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-sans text-slate-700 dark:text-slate-300">
                        {run.session.mode === 'apk-session-token'
                          ? '.apk Session Token'
                          : 'Proxy REST Authority'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {run.connectionTest.objectId || '—'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-right text-slate-700 dark:text-slate-300">
                        {run.handshake.latencyMs} ms
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-right text-slate-700 dark:text-slate-300">
                        {run.session.latencyMs} ms
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-right text-slate-700 dark:text-slate-300">
                        {run.connectionTest.writeLatencyMs} ms / {run.connectionTest.readLatencyMs} ms
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                        {run.totalRoundTripMs} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Real-Time Read-Only Activity Stream Component with Threshold Alert Rules */}
      <ActivityStream
        darkMode={darkMode}
        activePulses={activePulses}
        onPulsesUpdated={onPulsesUpdated}
        onAcknowledgePulse={onAcknowledgePulse}
        onNavigateDashboard={onNavigateDashboard}
        onNotify={onNotify}
      />
    </div>
  );
};
