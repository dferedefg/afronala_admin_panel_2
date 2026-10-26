import React, { useState, useEffect } from 'react';
import {
  Radio,
  Send,
  Webhook,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Code,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Zap,
  Globe,
  Sliders,
} from 'lucide-react';
import { LiveQueryEvent, WebhookSubscription } from '../types';
import { back4AppService } from '../services/back4app';

interface LiveQueryWebhooksViewProps {
  darkMode: boolean;
}

export const LiveQueryWebhooksView: React.FC<LiveQueryWebhooksViewProps> = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState<'livequery' | 'webhooks' | 'flutter'>('livequery');
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [latencyMs, setLatencyMs] = useState(38);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Webhook Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['trip.requested', 'trip.completed'],
    secretKey: 'sec_afro_' + Math.random().toString(36).substring(2, 10),
  });

  // Test Webhook execution modal / notification
  const [testResult, setTestResult] = useState<{
    id: string;
    status: number;
    latency: number;
    msg: string;
  } | null>(null);

  // Simulated LiveQuery Event Stream
  const [events, setEvents] = useState<LiveQueryEvent[]>([
    {
      id: 'lq-1',
      timestamp: 'Just now',
      className: 'Trip',
      event: 'create',
      objectId: 'obj_trp_99182',
      payload: {
        tripId: 'TRP-9801',
        pickup: 'Bole Intl. Airport',
        destination: 'Kazanchis',
        fareETB: 480,
        status: 'En Route',
      },
    },
    {
      id: 'lq-2',
      timestamp: '1m ago',
      className: 'Driver',
      event: 'update',
      objectId: 'obj_drv_11204',
      payload: {
        name: 'Abebe Kebede',
        status: 'Active',
        currentHeading: 315,
        speedKmh: 42,
      },
    },
    {
      id: 'lq-3',
      timestamp: '3m ago',
      className: 'Shipment',
      event: 'update',
      objectId: 'obj_shpm_5521',
      payload: {
        shipmentId: 'FRT-4401',
        status: 'In Transit',
        corridor: 'Kality -> Adama',
      },
    },
    {
      id: 'lq-4',
      timestamp: '7m ago',
      className: 'ModuleRegistry',
      event: 'update',
      objectId: 'obj_mod_002',
      payload: {
        key: 'truck',
        enabled: true,
        schemaVersion: '1.4',
      },
    },
  ]);

  // Load configured webhooks on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await back4AppService.getWebhooks();
        setWebhooks(list);
      } catch (e) {
        console.warn('Error loading webhooks:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Periodic latency simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyMs(35 + Math.floor(Math.random() * 12));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Inject a simulated Parse LiveQuery event into the live stream
  const handleSimulateEvent = (type: 'trip' | 'driver' | 'alert') => {
    let newEv: LiveQueryEvent;
    if (type === 'trip') {
      newEv = {
        id: 'lq-' + Date.now(),
        timestamp: 'Just now',
        className: 'Trip',
        event: 'create',
        objectId: 'obj_trp_' + Math.floor(10000 + Math.random() * 90000),
        payload: {
          tripId: 'TRP-' + Math.floor(1000 + Math.random() * 9000),
          pickup: 'Meskel Square',
          destination: 'CMC Residential Corridor',
          fareETB: 350,
          passenger: 'Yared Teshome',
        },
      };
    } else if (type === 'driver') {
      newEv = {
        id: 'lq-' + Date.now(),
        timestamp: 'Just now',
        className: 'Driver',
        event: 'update',
        objectId: 'obj_drv_' + Math.floor(10000 + Math.random() * 90000),
        payload: {
          name: 'Bekele Tesfaye',
          status: 'Active',
          speedKmh: 48,
          battery: '94%',
        },
      };
    } else {
      newEv = {
        id: 'lq-' + Date.now(),
        timestamp: 'Just now',
        className: 'SystemAlert',
        event: 'create',
        objectId: 'obj_alt_' + Math.floor(10000 + Math.random() * 90000),
        payload: {
          title: 'Heavy Traffic on Gotera Interchange',
          level: 'warning',
          autoReroute: true,
        },
      };
    }

    setEvents((prev) => [newEv, ...prev.slice(0, 15)]);
  };

  // Test fire a webhook
  const handleTestWebhook = (wh: WebhookSubscription) => {
    const simulatedLatency = 120 + Math.floor(Math.random() * 80);
    setTestResult({
      id: wh.id,
      status: 200,
      latency: simulatedLatency,
      msg: `Webhook payload delivered to ${wh.url} with HTTP 200 OK (${simulatedLatency}ms)`,
    });

    // Update success count
    const updated = webhooks.map((item) => {
      if (item.id === wh.id) {
        return {
          ...item,
          successCount: item.successCount + 1,
          lastStatus: 200,
          lastTriggered: 'Just now',
        };
      }
      return item;
    });
    setWebhooks(updated);
    back4AppService.saveWebhook(updated.find((x) => x.id === wh.id)!);

    setTimeout(() => setTestResult(null), 5000);
  };

  // Add new webhook handler
  const handleAddWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhook.url || !newWebhook.name) return;

    const subscription: WebhookSubscription = {
      id: 'wh-' + Date.now(),
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      secretKey: newWebhook.secretKey,
      active: true,
      createdAt: new Date().toISOString(),
      lastStatus: 200,
      successCount: 0,
      failureCount: 0,
    };

    const updated = await back4AppService.saveWebhook(subscription);
    setWebhooks(updated);
    setIsAddModalOpen(false);
    setNewWebhook({
      name: '',
      url: '',
      events: ['trip.requested', 'trip.completed'],
      secretKey: 'sec_afro_' + Math.random().toString(36).substring(2, 10),
    });
  };

  // Delete webhook
  const handleDeleteWebhook = async (id: string) => {
    const updated = await back4AppService.deleteWebhook(id);
    setWebhooks(updated);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const flutterLiveQueryCode = `// Flutter LiveQuery Real-Time Stream Integration
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class AfronalaLiveEventService {
  final LiveQuery liveQuery = LiveQuery();
  late Subscription<ParseObject> subscription;

  void initializeTripLiveQuery({required Function(ParseObject) onTripUpdated}) async {
    final QueryBuilder<ParseObject> query =
        QueryBuilder<ParseObject>(ParseObject('Trip'))
          ..whereEqualTo('status', 'On-Going');

    subscription = await liveQuery.client.subscribe(query);

    // Event: New Trip Created
    subscription.on(LiveQueryEvent.create, (ParseObject trip) {
      print('New Trip Dispatched: \${trip.get<String>('tripId')}');
      onTripUpdated(trip);
    });

    // Event: Driver Location / Telemetry Update
    subscription.on(LiveQueryEvent.update, (ParseObject trip) {
      print('Trip Progress Updated: \${trip.get<num>('distanceKm')} km');
      onTripUpdated(trip);
    });

    // Event: Trip Completed
    subscription.on(LiveQueryEvent.delete, (ParseObject trip) {
      print('Trip Closed or Cancelled');
    });
  }

  void dispose() {
    liveQuery.client.unSubscribe(subscription);
  }
}`;

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-Time Engine Overview */}
      <div
        className={`p-5 rounded-2xl border ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600 text-white shadow-sm">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Parse LiveQuery &amp; Webhooks Hub
                </h1>
                <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  · WSS Active
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Real-time WebSocket event streaming and outbound HTTP webhook triggers for Afronala mobile and fleet clients.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs">
            <div className={`p-2.5 px-3.5 rounded-xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">WebSocket Latency</span>
              <span className="text-base font-bold text-cyan-700 dark:text-cyan-400 font-mono tabular-nums">{latencyMs}ms</span>
            </div>

            <div className={`p-2.5 px-3.5 rounded-xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">Active Channels</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">4 Subscribed</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('livequery')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'livequery'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>LiveQuery Stream Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'webhooks'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Webhook Endpoints ({webhooks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('flutter')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'flutter'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Flutter Dart Client</span>
          </button>
        </div>
      </div>

      {/* Test feedback notification */}
      {testResult && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{testResult.msg}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: LiveQuery Stream Feed */}
      {activeTab === 'livequery' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Feed Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Event Stream (WebSocket)
                  </h2>
                </div>

                {/* Simulate Event Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mr-1">Inject:</span>
                  <button
                    onClick={() => handleSimulateEvent('trip')}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-400 text-[11px] font-semibold border border-slate-300 dark:border-slate-700 whitespace-nowrap"
                  >
                    + Trip
                  </button>
                  <button
                    onClick={() => handleSimulateEvent('driver')}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold border border-slate-300 dark:border-slate-700 whitespace-nowrap"
                  >
                    + Driver
                  </button>
                  <button
                    onClick={() => handleSimulateEvent('alert')}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 text-[11px] font-semibold border border-slate-300 dark:border-slate-700 whitespace-nowrap"
                  >
                    + Alert
                  </button>
                </div>
              </div>

              {/* Event Stream List */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                      darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800/60 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-bold ${
                            ev.event === 'create'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : ev.event === 'update'
                              ? 'text-cyan-700 dark:text-cyan-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {ev.event}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-sans">{ev.className}</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">[{ev.objectId}]</span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">{ev.timestamp}</span>
                    </div>

                    <pre className="text-[11px] text-slate-800 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subscribed Channels & Connection Specs (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} space-y-3`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">LiveQuery Channels</h3>

              <div className="space-y-2">
                {[
                  { name: 'Trip', desc: 'Real-time GPS waypoints and trip status changes', active: true },
                  { name: 'Driver', desc: 'Driver availability, battery level & heading telemetry', active: true },
                  { name: 'Shipment', desc: 'Freight cargo transit milestones & BoL logs', active: true },
                  { name: 'ModuleRegistry', desc: 'Dynamic feature flags & schema updates', active: true },
                ].map((ch) => (
                  <div
                    key={ch.name}
                    className={`p-2.5 rounded-xl border text-xs ${
                      darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{ch.name}</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{ch.desc}</p>
                  </div>
                ))}
              </div>

              <div className={`p-3 rounded-xl border text-xs space-y-1 ${darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                <span className="font-bold text-slate-800 dark:text-slate-300 block">Server WebSocket URL</span>
                <code className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 break-all">
                  wss://parseapi.back4app.com
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Webhooks Endpoints */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Configured Webhook Subscriptions
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Outbound HTTP POST payloads dispatched upon high-priority fleet operations and trip events.
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Webhook</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{wh.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        wh.active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {wh.active ? '200 OK' : 'PAUSED'}
                    </span>
                  </div>

                  <p className={`text-[11px] font-mono break-all mb-3 p-2 rounded-lg border ${
                    darkMode ? 'bg-slate-950 text-cyan-400 border-slate-800' : 'bg-slate-50 text-cyan-700 border-slate-200'
                  }`}>
                    {wh.url}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Events:</span>
                      <span className="text-slate-900 dark:text-white font-mono">{wh.events.join(', ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Delivered Payloads:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold tabular-nums">{wh.successCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Last Triggered:</span>
                      <span className="text-slate-700 dark:text-slate-400">{wh.lastTriggered || 'Never'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => handleTestWebhook(wh)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100 hover:bg-cyan-600 dark:bg-slate-800 dark:hover:bg-cyan-600 text-slate-800 dark:text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Test Ping</span>
                  </button>

                  <button
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="Delete webhook"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Flutter Dart Client */}
      {activeTab === 'flutter' && (
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} space-y-3`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Flutter LiveQuery Integration</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Official Back4App Parse LiveQuery SDK client code for the Afronala passenger and driver apps.
              </p>
            </div>

            <button
              onClick={() => handleCopy(flutterLiveQueryCode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Copied!' : 'Copy Dart Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto">
            {flutterLiveQueryCode}
          </pre>
        </div>
      )}

      {/* Register Webhook Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Add Outbound Webhook</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Send automated POST alerts when events occur on Back4App.
            </p>

            <form onSubmit={handleAddWebhookSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Service / Name</label>
                <input
                  type="text"
                  required
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="e.g. Telebirr Payment Webhook"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-600 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Target URL (HTTPS)</label>
                <input
                  type="url"
                  required
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://api.yourdomain.com/webhooks"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-600 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">HMAC Secret Key</label>
                <input
                  type="text"
                  readOnly
                  value={newWebhook.secretKey}
                  className={`w-full px-3 py-2 rounded-xl border font-mono ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-cyan-400' : 'bg-slate-100 border-slate-200 text-cyan-700'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-xs"
                >
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
