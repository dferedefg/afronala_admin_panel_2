import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Database,
  Plus,
  RefreshCw,
  Trash2,
  Code2,
  Copy,
  Check,
  X,
  Layers,
  Lock,
} from 'lucide-react';
import { ModuleItem, PermissionAction } from '../types';
import { back4AppService } from '../services/back4app';
import { hasPermission } from '../services/rbac';

interface DynamicModuleViewProps {
  module: ModuleItem;
  darkMode: boolean;
  userRole?: string;
  onNavigateModules: () => void;
  onOpenSchemaEditor?: (moduleKey: string) => void;
  onGuardPermission?: (action: PermissionAction, featureLabel: string) => boolean;
  onNotify?: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DynamicModuleView: React.FC<DynamicModuleViewProps> = ({
  module,
  userRole = 'Super Admin',
  onNavigateModules,
  onOpenSchemaEditor,
  onGuardPermission,
  onNotify,
}) => {
  const customClasses =
    module.customClasses && module.customClasses.length > 0
      ? module.customClasses
      : [`${module.name.replace(/\s+/g, '')}Record`];

  const [activeClass, setActiveClass] = useState<string>(customClasses[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState('Active');
  const [newNote, setNewNote] = useState('');
  const [newAmount, setNewAmount] = useState('250.00');
  const [copiedDart, setCopiedDart] = useState(false);

  const canManageModules = hasPermission(userRole, 'manage_modules');

  const checkAuthority = (label: string): boolean => {
    if (onGuardPermission) {
      return onGuardPermission('manage_modules', label);
    }
    return canManageModules;
  };

  const cardClass =
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs';

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 text-xs';

  const loadRecords = async (cls: string) => {
    setIsLoading(true);
    try {
      const data = await back4AppService.fetchClassRecords(cls);
      setRecords(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeClass) {
      loadRecords(activeClass);
    }
  }, [activeClass]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuthority(`Insert record into ${activeClass}`)) return;
    if (!newTitle.trim()) return;

    const payload = {
      title: newTitle.trim(),
      status: newStatus,
      amountETB: Number(newAmount) || 0,
      notes: newNote || 'Operational record created in Afronala Control Center',
      moduleKey: module.key,
      createdBy: userRole,
    };

    const saved = await back4AppService.addClassRecord(activeClass, payload);
    setRecords([saved, ...records]);
    setShowAddModal(false);
    setNewTitle('');
    setNewNote('');
    onNotify?.('Record Saved', `Inserted ${payload.title} into ${activeClass}.`, 'success');
  };

  const handleDelete = async (objectId: string) => {
    if (!checkAuthority(`Delete record from ${activeClass}`)) return;
    await back4AppService.deleteClassRecord(activeClass, objectId);
    setRecords(records.filter((r) => r.objectId !== objectId));
    onNotify?.('Record Deleted', `Removed object ${objectId} from ${activeClass}.`, 'info');
  };

  const generatedDartCode = `// lib/models/${activeClass.toLowerCase()}_model.dart
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class ${activeClass}Model extends ParseObject implements ParseCloneable {
  static const String keyTableName = '${activeClass}';

  ${activeClass}Model() : super(keyTableName);
  ${activeClass}Model.clone() : this();

  @override
  ${activeClass}Model clone(Map<String, dynamic> map) =>
      ${activeClass}Model.clone()..fromJson(map);

  String? get title => get<String>('title');
  set title(String? value) => set<String?>('title', value);

  String? get status => get<String>('status');
  set status(String? value) => set<String?>('status', value);

  num? get amountETB => get<num>('amountETB');
  set amountETB(num? value) => set<num?>('amountETB', value);

  String? get notes => get<String>('notes');
  set notes(String? value) => set<String?>('notes', value);
}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <button onClick={onNavigateModules} className="hover:text-cyan-600 dark:hover:text-cyan-400">
              Module Management
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-cyan-600 dark:text-cyan-400 font-medium">{module.name}</span>
            <span aria-hidden="true">·</span>
            <span>{module.category}</span>
            <span aria-hidden="true">·</span>
            <span className={module.enabled ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
              {module.enabled ? 'Live in SuperApp' : 'Staging'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {module.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{module.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onOpenSchemaEditor && (
            <button
              onClick={() => {
                if (!checkAuthority(`Edit ${module.name} schema`)) return;
                onOpenSchemaEditor(module.key);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-cyan-300 hover:bg-slate-50 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Visual Schema</span>
            </button>
          )}

          <button
            onClick={() => loadRecords(activeClass)}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Refresh Back4App Parse Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (!checkAuthority(`Add ${activeClass} record`)) return;
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            {canManageModules ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Add {activeClass} Record</span>
          </button>
        </div>
      </div>

      {/* Parse Class Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold mr-1 flex items-center gap-1 whitespace-nowrap">
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Parse Classes:</span>
          </span>
          {customClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setActiveClass(cls)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeClass === cls
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            Table: {activeClass}
          </span>
        </div>
      </div>

      {/* Class Records Table */}
      <div className={`p-5 rounded-xl ${cardClass}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Records in {activeClass}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-mono tabular-nums ml-1.5">
              ({records.length})
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono">
              <tr>
                <th className="pb-3 font-semibold">Object ID</th>
                <th className="pb-3 font-semibold">Title / Identifier</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Value / Amount</th>
                <th className="pb-3 font-semibold pl-4">Notes</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {records.length > 0 ? (
                records.map((r, i) => (
                  <tr key={r.objectId || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono text-cyan-600 dark:text-cyan-400 text-xs tabular-nums">
                      {r.objectId || 'local-pending'}
                    </td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      {r.title || r.code || r.name || 'Record Item'}
                    </td>
                    <td className="py-3 text-emerald-700 dark:text-emerald-400 font-semibold">
                      {r.status || 'Active'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                      {r.amountETB ? `ETB ${Number(r.amountETB).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 pl-4 text-slate-500 dark:text-slate-400 text-xs truncate max-w-xs">
                      {r.notes || r.description || 'Provisioned by Afronala Control Center'}
                    </td>
                    <td className="py-3 text-right">
                      {r.objectId && (
                        <button
                          onClick={() => handleDelete(r.objectId)}
                          title="Delete Record"
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    {isLoading
                      ? 'Loading records from Back4App proxy...'
                      : `No records in ${activeClass} yet. Click "Add ${activeClass} Record" to insert your first entry.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flutter / Dart Model Snippet */}
      <div className={`p-5 rounded-xl ${cardClass}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Generated Flutter / Dart Parse Model</h3>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedDartCode);
              setCopiedDart(true);
              setTimeout(() => setCopiedDart(false), 2000);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-400 text-xs font-mono font-semibold whitespace-nowrap"
          >
            {copiedDart ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedDart ? 'Copied Dart' : 'Copy Dart Class'}</span>
          </button>
        </div>
        <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-48">
          {generatedDartCode}
        </pre>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl ${cardClass} shadow-2xl`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Insert Record in {activeClass}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Title / Order Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Order #9401"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Amount (ETB)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className={`${inputClass} font-mono tabular-nums`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Operational Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional details..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
