import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Search,
  Download,
  Lock,
  LogIn,
  Car,
  Truck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Play,
  BellPlus,
  BellRing,
  Trash2,
  Check,
  Zap,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';
import {
  ActivityAlertRule,
  ActivityStreamEvent,
  ActivityStreamResponse,
  AlertRuleMetricCategory,
  AlertRuleOperator,
  AlertRuleSeverity,
  MobileActivityCategory,
  TriggeredActivityPulse,
} from '../types';
import { back4AppService } from '../services/back4app';
import { downloadCsv } from '../services/rbac';

interface ActivityStreamProps {
  darkMode: boolean;
  activePulses?: TriggeredActivityPulse[];
  onPulsesUpdated?: (
    pulses: TriggeredActivityPulse[],
    newlyTriggered?: TriggeredActivityPulse[]
  ) => void;
  onAcknowledgePulse?: (pulseId: string) => void;
  onNavigateDashboard?: () => void;
  onNotify?: (
    title: string,
    message?: string,
    type?: 'success' | 'info' | 'warning' | 'error'
  ) => void;
}

type CategoryFilter = 'all' | 'user_login' | 'ride_request' | 'truck_booking';
type PollCadence = 5000 | 10000 | 30000 | 0;

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], {
    month: 'short',
    day: '2-digit',
  });
}

function getCategoryLabel(category: MobileActivityCategory): string {
  switch (category) {
    case 'user_login':
      return 'User Login';
    case 'ride_request':
      return 'Ride Request';
    case 'truck_booking':
      return 'Truck Booking';
    case 'driver_status':
      return 'Driver State';
    default:
      return 'System Event';
  }
}

export function getRuleMetricLabel(category: AlertRuleMetricCategory): string {
  switch (category) {
    case 'ride_request':
      return 'ride requests';
    case 'truck_booking':
      return 'truck bookings';
    case 'user_login':
      return 'user logins';
    case 'driver_status':
      return 'driver status updates';
    default:
      return 'mobile events';
  }
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({
  activePulses: externalPulses,
  onPulsesUpdated,
  onAcknowledgePulse,
  onNavigateDashboard,
  onNotify,
}) => {
  const [streamData, setStreamData] = useState<ActivityStreamResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [strictActivityLogOnly, setStrictActivityLogOnly] = useState<boolean>(false);
  const [pollCadence, setPollCadence] = useState<PollCadence>(10000);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Threshold Alert Rules State
  const [alertRules, setAlertRules] = useState<ActivityAlertRule[]>(() =>
    back4AppService.getActivityAlertRules()
  );
  const [localPulses, setLocalPulses] = useState<TriggeredActivityPulse[]>(() =>
    back4AppService.getActiveActivityPulses()
  );
  const [ruleEvaluations, setRuleEvaluations] = useState<
    Record<string, { countInWindow: number; breached: boolean }>
  >({});
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState<boolean>(false);
  const [showRulesPanel, setShowRulesPanel] = useState<boolean>(true);

  // Create Rule Form Inputs
  const [ruleName, setRuleName] = useState<string>('Bole Rush Hour Ride Surge');
  const [ruleCategory, setRuleCategory] = useState<AlertRuleMetricCategory>('ride_request');
  const [ruleOperator, setRuleOperator] = useState<AlertRuleOperator>('>');
  const [ruleThreshold, setRuleThreshold] = useState<number>(50);
  const [ruleWindowMinutes, setRuleWindowMinutes] = useState<number>(5);
  const [ruleSeverity, setRuleSeverity] = useState<AlertRuleSeverity>('critical');
  const [savingRule, setSavingRule] = useState<boolean>(false);

  const effectivePulses = externalPulses ?? localPulses;

  const syncEvaluationWithEvents = useCallback(
    (eventsToEvaluate: ActivityStreamEvent[]) => {
      const result = back4AppService.evaluateActivityAlertRules(eventsToEvaluate);
      setRuleEvaluations(result.ruleEvaluations);
      setAlertRules(back4AppService.getActivityAlertRules());
      setLocalPulses(result.activePulses);
      onPulsesUpdated?.(result.activePulses, result.newlyTriggered);

      if (result.newlyTriggered.length > 0) {
        const first = result.newlyTriggered[0];
        onNotify?.(
          `Alert Threshold Breached: ${first.ruleName}`,
          `Observed ${first.observedCount} ${getRuleMetricLabel(first.category)} within ${first.windowMinutes}m (rule ${first.operator} ${first.threshold}). Visual pulse active on Dashboard.`,
          first.severity === 'critical' ? 'error' : 'warning'
        );
      }
    },
    [onPulsesUpdated, onNotify]
  );

  const fetchStream = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setRefreshing(true);
      }
      try {
        const res = await back4AppService.getActivityStream({
          limit: 60,
          strictActivityLogOnly,
        });
        setStreamData(res);
        syncEvaluationWithEvents(res.events || []);
      } catch (err: any) {
        if (!isBackground) {
          onNotify?.(
            'ActivityLog Query Failed',
            err?.message || 'Unable to fetch mobile activity feed from Back4App proxy.',
            'error'
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [strictActivityLogOnly, onNotify, syncEvaluationWithEvents]
  );

  useEffect(() => {
    setLoading(true);
    fetchStream(false);
  }, [fetchStream]);

  useEffect(() => {
    if (pollCadence === 0) return;
    const timer = window.setInterval(() => {
      fetchStream(true);
    }, pollCadence);
    return () => window.clearInterval(timer);
  }, [pollCadence, fetchStream]);

  const events = streamData?.events || [];

  const counts = useMemo(() => {
    let logins = 0;
    let rides = 0;
    let trucks = 0;
    for (const ev of events) {
      if (ev.category === 'user_login') logins += 1;
      else if (ev.category === 'ride_request') rides += 1;
      else if (ev.category === 'truck_booking') trucks += 1;
    }
    return {
      all: events.length,
      logins,
      rides,
      trucks,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        ev.actorName.toLowerCase().includes(q) ||
        ev.eventType.toLowerCase().includes(q) ||
        ev.summary.toLowerCase().includes(q) ||
        ev.referenceId.toLowerCase().includes(q) ||
        ev.sourceClass.toLowerCase().includes(q) ||
        ev.statusLabel.toLowerCase().includes(q) ||
        ev.objectId.toLowerCase().includes(q)
      );
    });
  }, [events, categoryFilter, searchQuery]);

  const handleApplyPreset = (preset: {
    name: string;
    category: AlertRuleMetricCategory;
    operator: AlertRuleOperator;
    threshold: number;
    windowMinutes: number;
    severity: AlertRuleSeverity;
  }) => {
    setRuleName(preset.name);
    setRuleCategory(preset.category);
    setRuleOperator(preset.operator);
    setRuleThreshold(preset.threshold);
    setRuleWindowMinutes(preset.windowMinutes);
    setRuleSeverity(preset.severity);
  };

  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      onNotify?.('Rule Name Required', 'Enter a descriptive name for the alert rule.', 'warning');
      return;
    }
    setSavingRule(true);
    try {
      const updated = await back4AppService.createActivityAlertRule({
        name: ruleName.trim(),
        category: ruleCategory,
        operator: ruleOperator,
        threshold: Math.max(1, Number(ruleThreshold) || 1),
        windowMinutes: Math.max(1, Number(ruleWindowMinutes) || 5),
        severity: ruleSeverity,
      });
      setAlertRules(updated);
      setIsCreateRuleOpen(false);
      setShowRulesPanel(true);

      // Immediately evaluate new rule against live ActivityStream events
      const evalRes = back4AppService.evaluateActivityAlertRules(events);
      setRuleEvaluations(evalRes.ruleEvaluations);
      setLocalPulses(evalRes.activePulses);
      onPulsesUpdated?.(evalRes.activePulses, evalRes.newlyTriggered);

      onNotify?.(
        'Alert Rule Created',
        `Monitoring: Alert if ${ruleOperator} ${ruleThreshold} ${getRuleMetricLabel(ruleCategory)} within ${ruleWindowMinutes}m.`,
        'success'
      );
    } finally {
      setSavingRule(false);
    }
  };

  const handleToggleRule = (rule: ActivityAlertRule) => {
    const nextEnabled = !rule.enabled;
    const updated = back4AppService.toggleActivityAlertRule(rule.id, nextEnabled);
    setAlertRules(updated);
    const evalRes = back4AppService.evaluateActivityAlertRules(events);
    setRuleEvaluations(evalRes.ruleEvaluations);
    setLocalPulses(evalRes.activePulses);
    onPulsesUpdated?.(evalRes.activePulses, []);
  };

  const handleDeleteRule = (rule: ActivityAlertRule) => {
    const updated = back4AppService.deleteActivityAlertRule(rule.id);
    setAlertRules(updated);
    const active = back4AppService.getActiveActivityPulses();
    setLocalPulses(active);
    onPulsesUpdated?.(active, []);
    onNotify?.('Alert Rule Removed', `Deleted threshold rule "${rule.name}".`, 'info');
  };

  const handleTestRulePulse = (rule: ActivityAlertRule) => {
    const { pulse, activePulses: nextPulses } = back4AppService.triggerTestActivityPulse(rule.id);
    setAlertRules(back4AppService.getActivityAlertRules());
    setLocalPulses(nextPulses);
    onPulsesUpdated?.(nextPulses, pulse ? [pulse] : []);
    if (pulse) {
      onNotify?.(
        `Visual Pulse Triggered: ${rule.name}`,
        `Simulated ${pulse.observedCount} ${getRuleMetricLabel(rule.category)} in ${rule.windowMinutes}m. In-app visual pulse is now active on the Dashboard.`,
        rule.severity === 'critical' ? 'error' : 'warning'
      );
    }
  };

  const handleAcknowledgeLocalOrExternal = (pulseId: string) => {
    if (onAcknowledgePulse) {
      onAcknowledgePulse(pulseId);
    } else {
      const next = back4AppService.acknowledgeActivityPulse(pulseId);
      setLocalPulses(next);
      onPulsesUpdated?.(next, []);
    }
  };

  const handleExportCsv = () => {
    if (filteredEvents.length === 0) {
      onNotify?.(
        'Nothing to Export',
        'No mobile activity events match the active filter.',
        'warning'
      );
      return;
    }

    downloadCsv(
      `afronala_apk_activity_stream_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Timestamp (ISO)',
        'Source Parse Class',
        'Parse ObjectId',
        'Category',
        'Event Type',
        'Actor',
        'Role',
        'Reference ID',
        'Status',
        'Summary',
      ],
      filteredEvents.map((ev) => [
        ev.createdAt,
        ev.sourceClass,
        ev.objectId,
        getCategoryLabel(ev.category),
        ev.eventType,
        ev.actorName,
        ev.actorRole,
        ev.referenceId,
        ev.statusLabel,
        ev.summary,
      ])
    );

    onNotify?.(
      'Activity Stream Exported',
      `Downloaded ${filteredEvents.length} read-only mobile telemetry records as CSV.`,
      'success'
    );
  };

  const renderCategoryIcon = (category: MobileActivityCategory) => {
    switch (category) {
      case 'user_login':
        return <LogIn className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400 shrink-0" />;
      case 'ride_request':
        return <Car className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400 shrink-0" />;
      case 'truck_booking':
        return <Truck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />;
    }
  };

  const getStatusTextColor = (status: string) => {
    const s = status.toLowerCase();
    if (
      s.includes('complete') ||
      s.includes('deliver') ||
      s.includes('auth') ||
      s.includes('verif') ||
      s.includes('active') ||
      s.includes('record')
    ) {
      return 'text-emerald-700 dark:text-emerald-400';
    }
    if (s.includes('cancel') || s.includes('fail') || s.includes('reject') || s.includes('unverif')) {
      return 'text-rose-700 dark:text-rose-400';
    }
    return 'text-amber-700 dark:text-amber-400';
  };

  const activityLogStatus = streamData?.activityLogStatus;
  const activeRulesCount = alertRules.filter((r) => r.enabled).length;

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              SuperApp Mobile Activity Stream
            </h2>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              Read-Only Monitoring
            </span>
            {pollCadence > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse motion-reduce:animate-none" />
                  Live Poll {pollCadence / 1000}s
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
              {activeRulesCount} Active {activeRulesCount === 1 ? 'Rule' : 'Rules'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Queries Back4App <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">ActivityLog</span> class, correlates live <span className="font-mono">.apk</span> events, and evaluates threshold alert rules that trigger visual pulses on the dashboard.
          </p>
        </div>

        {/* Action & Polling Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsCreateRuleOpen((prev) => !prev);
              setShowRulesPanel(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              isCreateRuleOpen
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            <BellPlus className="w-3.5 h-3.5" />
            {isCreateRuleOpen ? 'Close Rule Builder' : 'Create Alert Rule'}
          </button>

          <div
            role="group"
            aria-label="Polling interval"
            className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950 text-xs"
          >
            {(
              [
                { value: 5000, label: '5s' },
                { value: 10000, label: '10s' },
                { value: 30000, label: '30s' },
                { value: 0, label: 'Paused' },
              ] as { value: PollCadence; label: string }[]
            ).map((opt) => {
              const active = pollCadence === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setPollCadence(opt.value)}
                  className={`px-2.5 py-1 rounded-md font-mono tabular-nums font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.value === 0 ? (
                    <Pause className="w-3 h-3" />
                  ) : active ? (
                    <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : null}
                  {opt.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => fetchStream(false)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Live Triggered Pulse Strip (Visible immediately when any threshold is breached) */}
      {effectivePulses.length > 0 && (
        <div className="px-4 sm:px-5 py-3 border-b border-rose-200 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <span className="relative flex h-3 w-3 mt-1 sm:mt-0 shrink-0" aria-hidden="true">
              <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 dark:bg-rose-400" />
            </span>
            <div className="text-xs">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-300">
                  <BellRing className="w-3.5 h-3.5 shrink-0" />
                  Dashboard Visual Pulse Active ({effectivePulses.length})
                </span>
                <span aria-hidden="true" className="text-rose-400 dark:text-rose-700">
                  ·
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {effectivePulses[0].ruleName}
                </span>
                <span aria-hidden="true" className="text-rose-400 dark:text-rose-700">
                  ·
                </span>
                <span className="font-mono tabular-nums text-rose-800 dark:text-rose-200">
                  Observed {effectivePulses[0].observedCount} / {effectivePulses[0].operator}{' '}
                  {effectivePulses[0].threshold} {getRuleMetricLabel(effectivePulses[0].category)} in{' '}
                  {effectivePulses[0].windowMinutes}m
                </span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300/90 mt-0.5">
                Pulsing beacon is currently broadcasting on the Executive Dashboard KPI &amp; alert header.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateDashboard && (
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <span>View Pulse on Dashboard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleAcknowledgeLocalOrExternal(effectivePulses[0].id)}
              className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-white dark:bg-slate-900 hover:bg-rose-100/60 dark:hover:bg-slate-800 text-rose-800 dark:text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Acknowledge Pulse
            </button>
          </div>
        </div>
      )}

      {/* Inline Create Alert Rule Builder */}
      {isCreateRuleOpen && (
        <form
          onSubmit={handleCreateRuleSubmit}
          className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Create Activity Stream Threshold Alert Rule
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Define a rolling-window event threshold. Breaching rules automatically trigger live visual pulses on the Executive Dashboard.
              </p>
            </div>

            {/* Quick Domain Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Ride Request Surge (>50 / 5m)',
                    category: 'ride_request',
                    operator: '>',
                    threshold: 50,
                    windowMinutes: 5,
                    severity: 'critical',
                  })
                }
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap shrink-0"
              >
                &gt; 50 Rides / 5m
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Freight Booking Spike (>20 / 10m)',
                    category: 'truck_booking',
                    operator: '>',
                    threshold: 20,
                    windowMinutes: 10,
                    severity: 'warning',
                  })
                }
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap shrink-0"
              >
                &gt; 20 Trucks / 10m
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Live Stream Verification (>= 1 / 60m)',
                    category: 'all',
                    operator: '>=',
                    threshold: 1,
                    windowMinutes: 60,
                    severity: 'warning',
                  })
                }
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-medium whitespace-nowrap shrink-0"
              >
                &gt;= 1 Event / 60m
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rule Name
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Bole Rush Hour Surge"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Event Metric
              </label>
              <select
                value={ruleCategory}
                onChange={(e) => setRuleCategory(e.target.value as AlertRuleMetricCategory)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value="ride_request">Ride Requests</option>
                <option value="truck_booking">Truck Bookings</option>
                <option value="user_login">User Logins</option>
                <option value="driver_status">Driver State Events</option>
                <option value="all">All Mobile Events</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Threshold Condition
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={ruleOperator}
                  onChange={(e) => setRuleOperator(e.target.value as AlertRuleOperator)}
                  aria-label="Comparison operator"
                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                >
                  <option value=">">&gt;</option>
                  <option value=">=">&gt;=</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={ruleThreshold}
                  onChange={(e) => setRuleThreshold(Math.max(1, Number(e.target.value) || 1))}
                  aria-label="Event count threshold"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono tabular-nums text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Window
              </label>
              <select
                value={ruleWindowMinutes}
                onChange={(e) => setRuleWindowMinutes(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono tabular-nums text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value={1}>Within 1 minute</option>
                <option value={5}>Within 5 minutes</option>
                <option value={10}>Within 10 minutes</option>
                <option value={15}>Within 15 minutes</option>
                <option value={30}>Within 30 minutes</option>
                <option value={60}>Within 60 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pulse Severity
              </label>
              <select
                value={ruleSeverity}
                onChange={(e) => setRuleSeverity(e.target.value as AlertRuleSeverity)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value="critical">Critical (Crimson Pulse)</option>
                <option value="warning">Warning (Amber Pulse)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/80 dark:border-slate-800">
            <p className="text-xs text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">Rule Expression: </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                Alert if {ruleOperator} {ruleThreshold} {getRuleMetricLabel(ruleCategory)} within{' '}
                {ruleWindowMinutes} {ruleWindowMinutes === 1 ? 'minute' : 'minutes'}
              </span>
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateRuleOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRule}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                {savingRule ? 'Saving Rule...' : 'Save Alert Rule'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Configured Threshold Alert Rules Strip / Table */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50/60 dark:bg-slate-950/30 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowRulesPanel((prev) => !prev)}
            className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
          >
            <BellRing className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            <span>Configured Activity Threshold Rules ({alertRules.length})</span>
            {showRulesPanel ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Evaluated on every ActivityLog stream poll · Click <strong>Test Pulse</strong> to preview Dashboard beacon
          </span>
        </div>

        {showRulesPanel && alertRules.length > 0 && (
          <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-4 whitespace-nowrap">Rule Name</th>
                  <th className="py-2 px-4 whitespace-nowrap">Threshold Condition</th>
                  <th className="py-2 px-4 whitespace-nowrap text-right">Window Count</th>
                  <th className="py-2 px-4 whitespace-nowrap">Evaluation State</th>
                  <th className="py-2 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {alertRules.map((rule) => {
                  const evalState = ruleEvaluations[rule.id];
                  const activePulse = effectivePulses.find((p) => p.ruleId === rule.id);
                  const countVal = evalState?.countInWindow ?? 0;

                  return (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {rule.name}
                        </span>
                        <span aria-hidden="true" className="mx-1.5 text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span
                          className={
                            rule.severity === 'critical'
                              ? 'text-rose-700 dark:text-rose-400 font-medium'
                              : 'text-amber-700 dark:text-amber-400 font-medium'
                          }
                        >
                          {rule.severity === 'critical' ? 'Critical' : 'Warning'}
                        </span>
                      </td>

                      <td className="py-2 px-4 whitespace-nowrap font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        Alert if {rule.operator} {rule.threshold}{' '}
                        <span className="font-sans">{getRuleMetricLabel(rule.category)}</span> within{' '}
                        {rule.windowMinutes}m
                      </td>

                      <td className="py-2 px-4 whitespace-nowrap text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {countVal} / {rule.threshold}
                      </td>

                      <td className="py-2 px-4 whitespace-nowrap">
                        {!rule.enabled ? (
                          <span className="text-slate-500 dark:text-slate-400">Paused</span>
                        ) : activePulse ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400 animate-ping motion-reduce:animate-none" />
                            Pulse Active
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            Monitoring
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTestRulePulse(rule)}
                            title="Fire in-app visual pulse on Dashboard"
                            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/40 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                          >
                            <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Test Pulse
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleRule(rule)}
                            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0 transition-colors"
                          >
                            {rule.enabled ? 'Pause' : 'Enable'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule)}
                            aria-label={`Delete rule ${rule.name}`}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ActivityLog Class Telemetry Strip */}
      <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-medium">
            {activityLogStatus?.reachable ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            )}
            <span>
              Class <span className="font-mono font-semibold">ActivityLog</span>:{' '}
              {activityLogStatus
                ? activityLogStatus.reachable
                  ? `HTTP ${activityLogStatus.statusCode} Reachable`
                  : `HTTP ${activityLogStatus.statusCode} (${activityLogStatus.parseError || 'Unprovisioned or Empty Schema'})`
                : 'Querying...'}
            </span>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            ·
          </span>
          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
            Native ActivityLog Rows: {activityLogStatus?.nativeRecordCount ?? 0}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            ·
          </span>
          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
            Query Latency: {streamData?.totalLatencyMs ?? 0} ms
          </span>
          {streamData?.fetchedAt && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>
              <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                Synced {formatTimestamp(streamData.fetchedAt)}
              </span>
            </>
          )}
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={strictActivityLogOnly}
            onChange={(e) => setStrictActivityLogOnly(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500"
          />
          <span>Strict ActivityLog class only</span>
        </label>
      </div>

      {/* Category Filter Tabs + Search Input */}
      <div className="p-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Events', count: counts.all },
              { id: 'user_login', label: 'User Logins', count: counts.logins },
              { id: 'ride_request', label: 'Ride Requests', count: counts.rides },
              { id: 'truck_booking', label: 'Truck Bookings', count: counts.trucks },
            ] as { id: CategoryFilter; label: string; count: number }[]
          ).map((tab) => {
            const isActive = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 border ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-900 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30 font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter actor, ref ID, status, class..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>
      </div>

      {/* High-Density Read-Only Feed Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <th className="py-2.5 px-4 whitespace-nowrap">Timestamp</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Mobile Event</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Actor / Role</th>
              <th className="py-2.5 px-4">Activity Details</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
              <th className="py-2.5 px-4 whitespace-nowrap text-right">Parse Source / ObjectId</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="h-11 animate-pulse">
                  <td className="py-2.5 px-4">
                    <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-3.5 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-6 text-center">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {strictActivityLogOnly
                      ? 'No direct rows found in Back4App ActivityLog yet'
                      : 'No mobile activity events match your current filter'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-lg mx-auto">
                    {strictActivityLogOnly
                      ? 'When your Afronala .apk writes mobile audit events to the ActivityLog Parse class, they will stream here automatically. Uncheck "Strict ActivityLog class only" to include correlated live _User, Ride, and TruckBooking events.'
                      : 'Sign in on the Afronala .apk, request a ride, or update a truck booking to observe live Parse events, or clear your search filter.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {strictActivityLogOnly && (
                      <button
                        type="button"
                        onClick={() => setStrictActivityLogOnly(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                      >
                        Show Correlated .apk Events
                      </button>
                    )}
                    {(searchQuery || categoryFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                        }}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev: ActivityStreamEvent) => (
                <tr
                  key={ev.id}
                  className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-4 whitespace-nowrap font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    <span>{formatTimestamp(ev.createdAt)}</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatShortDate(ev.createdAt)}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {renderCategoryIcon(ev.category)}
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {getCategoryLabel(ev.category)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="mx-1.5 text-slate-300 dark:text-slate-700"
                        >
                          /
                        </span>
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {ev.eventType}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ev.actorName}
                    </span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{ev.actorRole}</span>
                  </td>

                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                    <div className="truncate" title={ev.summary}>
                      {ev.summary}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                      Ref {ev.referenceId} · {ev.platform}
                    </div>
                  </td>

                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className={`font-semibold ${getStatusTextColor(ev.statusLabel)}`}>
                      {ev.statusLabel}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {ev.sourceClass}
                    </span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-300 dark:text-slate-700">
                      /
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {ev.objectId.slice(0, 10)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
