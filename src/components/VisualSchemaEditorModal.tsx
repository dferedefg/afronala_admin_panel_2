import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Database,
  Code,
  Layers,
  CheckCircle2,
  Copy,
  Sparkles,
  ArrowRight,
  Shield,
  FileCode,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { ModuleItem, SchemaField, SchemaFieldType } from '../types';
import { back4AppService } from '../services/back4app';

interface VisualSchemaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: ModuleItem[];
  selectedModuleKey?: string;
  onSchemaUpdated?: (updatedModules: ModuleItem[]) => void;
  darkMode: boolean;
}

const FIELD_TYPES: { type: SchemaFieldType; label: string; desc: string; iconColor: string }[] = [
  { type: 'String', label: 'String (Text)', desc: 'Standard alphanumeric string', iconColor: 'text-cyan-400' },
  { type: 'Number', label: 'Number', desc: 'Floating point or integer numbers', iconColor: 'text-emerald-400' },
  { type: 'Boolean', label: 'Boolean', desc: 'True or False flag', iconColor: 'text-amber-400' },
  { type: 'GeoPoint', label: 'GeoPoint (GPS)', desc: 'Latitude & Longitude coordinates', iconColor: 'text-blue-400' },
  { type: 'Date', label: 'Date (ISO)', desc: 'Timestamp / ISO Date string', iconColor: 'text-purple-400' },
  { type: 'Pointer', label: 'Pointer (Relational)', desc: 'Foreign key pointer to another Parse Class', iconColor: 'text-indigo-400' },
  { type: 'Array', label: 'Array (List)', desc: 'List of items or strings', iconColor: 'text-rose-400' },
  { type: 'Object', label: 'Object (JSON)', desc: 'Arbitrary nested JSON structure', iconColor: 'text-teal-400' },
];

export const VisualSchemaEditorModal: React.FC<VisualSchemaEditorModalProps> = ({
  isOpen,
  onClose,
  modules,
  selectedModuleKey,
  onSchemaUpdated,
  darkMode,
}) => {
  // Target module selection
  const [activeModuleKey, setActiveModuleKey] = useState<string>(selectedModuleKey || modules[0]?.key || 'ride');
  const [activeTab, setActiveTab] = useState<'designer' | 'json' | 'flutter'>('designer');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeModule = modules.find((m) => m.key === activeModuleKey) || modules[0];

  // Local state for fields
  const [fields, setFields] = useState<SchemaField[]>(() => {
    if (activeModule?.fields && activeModule.fields.length > 0) {
      return activeModule.fields;
    }
    // Default baseline fields based on module
    return [
      { name: 'title', type: 'String', required: true, defaultValue: 'Default Name', description: 'Primary record label' },
      { name: 'status', type: 'String', required: true, defaultValue: 'Active', description: 'Lifecycle state' },
      { name: 'coordinates', type: 'GeoPoint', required: false, description: 'GPS coordinates' },
      { name: 'isActive', type: 'Boolean', required: true, defaultValue: true, description: 'Availability flag' },
    ];
  });

  // Keep fields in sync when active module changes
  React.useEffect(() => {
    if (activeModule?.fields && activeModule.fields.length > 0) {
      setFields(activeModule.fields);
    } else {
      setFields([
        { name: 'title', type: 'String', required: true, defaultValue: 'Item Title', description: 'Primary label' },
        { name: 'status', type: 'String', required: true, defaultValue: 'Active', description: 'Operational status' },
        { name: 'coordinates', type: 'GeoPoint', required: false, description: 'GPS coordinates' },
        { name: 'priceETB', type: 'Number', required: false, defaultValue: 100, description: 'Base price in ETB' },
        { name: 'isActive', type: 'Boolean', required: true, defaultValue: true, description: 'Visibility flag' },
      ]);
    }
    setSaveResult(null);
  }, [activeModuleKey]);

  if (!isOpen) return null;

  // Add field row
  const handleAddField = () => {
    const newField: SchemaField = {
      name: `field_${fields.length + 1}`,
      type: 'String',
      required: false,
      defaultValue: '',
      description: 'Custom field',
    };
    setFields([...fields, newField]);
  };

  // Remove field row
  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  // Update field property
  const handleUpdateField = (index: number, key: keyof SchemaField, value: any) => {
    setFields(
      fields.map((field, idx) => {
        if (idx === index) {
          return { ...field, [key]: value };
        }
        return field;
      })
    );
  };

  // Save / Push Schema to Back4App Parse
  const handlePushSchema = async () => {
    setIsSaving(true);
    setSaveResult(null);
    try {
      // 1. Update ModuleRegistry fields in Back4App
      const updatedModules = await back4AppService.updateModuleFields(activeModuleKey, fields);

      // 2. Provision custom class with prototype fields
      const className =
        activeModule?.customClasses && activeModule.customClasses.length > 0
          ? activeModule.customClasses[0]
          : activeModule.name.replace(/[^a-zA-Z0-9]/g, '');

      const provResult = await back4AppService.provisionClassWithFields(className, fields);

      setSaveResult({
        success: true,
        msg: `Schema saved! ${provResult.message}`,
      });

      if (onSchemaUpdated) {
        onSchemaUpdated(updatedModules);
      }
    } catch (err: any) {
      setSaveResult({
        success: false,
        msg: err.message || 'Failed to save schema to Back4App cloud.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Dart / Flutter Model
  const generateDartModel = () => {
    const className =
      activeModule?.customClasses && activeModule.customClasses.length > 0
        ? activeModule.customClasses[0]
        : activeModule.name.replace(/[^a-zA-Z0-9]/g, '');

    const fieldsCode = fields
      .map((f) => {
        let dartType = 'String';
        if (f.type === 'Number') dartType = 'num';
        else if (f.type === 'Boolean') dartType = 'bool';
        else if (f.type === 'GeoPoint') dartType = 'ParseGeoPoint';
        else if (f.type === 'Date') dartType = 'DateTime';
        else if (f.type === 'Array') dartType = 'List<dynamic>';
        else if (f.type === 'Object') dartType = 'Map<String, dynamic>';
        else if (f.type === 'Pointer') dartType = 'ParseObject';

        return `  // ${f.description || f.name}
  ${dartType}? get ${f.name} => get<${dartType}>('${f.name}');
  set ${f.name}(${dartType}? value) => set<${dartType}?>('${f.name}', value);`;
      })
      .join('\n\n');

    return `import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

/// Auto-generated ParseObject for Afronala ${activeModule.name}
class ${className}Model extends ParseObject implements ParseCloneable {
  ${className}Model() : super(_keyTableName);
  ${className}Model.clone() : this();

  @override
  ${className}Model clone(Map<String, dynamic> map) => ${className}Model()..fromJson(map);

  static const String _keyTableName = '${className}';

${fieldsCode}
}`;
  };

  // Generate JSON Schema
  const generateJsonSchema = () => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    fields.forEach((f) => {
      let jsonType = 'string';
      if (f.type === 'Number') jsonType = 'number';
      else if (f.type === 'Boolean') jsonType = 'boolean';
      else if (f.type === 'Array') jsonType = 'array';
      else if (f.type === 'Object') jsonType = 'object';

      properties[f.name] = {
        type: jsonType,
        parseType: f.type,
        description: f.description || '',
        default: f.defaultValue,
      };

      if (f.required) required.push(f.name);
    });

    return JSON.stringify(
      {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: activeModule.name,
        className: activeModule.customClasses?.[0] || activeModule.name,
        type: 'object',
        properties,
        required,
      },
      null,
      2
    );
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className={`w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-600 text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Visual Back4App Schema Designer</h2>
                <span className="text-[11px] font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                  · Parse Cloud
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Visually configure typed fields, constraints, and relationships for mobile SuperApp modules.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module Picker & Tab Navigator */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-b ${darkMode ? 'border-slate-800/60 bg-slate-950/30' : 'border-slate-200 bg-white'}`}>
          {/* Module Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-400 whitespace-nowrap">Target Module:</span>
            <select
              value={activeModuleKey}
              onChange={(e) => setActiveModuleKey(e.target.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none focus:border-cyan-600 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {modules.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name} ({m.category})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className={`flex items-center gap-1 border rounded-xl p-1 ${darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-100'}`}>
            <button
              onClick={() => setActiveTab('designer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'designer'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Visual Designer</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'json'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Schema</span>
            </button>
            <button
              onClick={() => setActiveTab('flutter')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'flutter'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Flutter Dart Model</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {saveResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                saveResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-medium">{saveResult.msg}</span>
              </div>
              <button onClick={() => setSaveResult(null)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold">
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'designer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Class Field Specifications</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Parse schema definition for class{' '}
                    <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                      {activeModule.customClasses?.[0] || activeModule.name}
                    </span>
                  </p>
                </div>

                <button
                  onClick={handleAddField}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              {/* Fields Table */}
              <div className={`border rounded-xl overflow-hidden ${darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b text-left text-[11px] ${darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-700'}`}>
                      <th className="py-2.5 px-3 font-semibold">Field Name</th>
                      <th className="py-2.5 px-3 font-semibold">Data Type</th>
                      <th className="py-2.5 px-3 font-semibold">Required</th>
                      <th className="py-2.5 px-3 font-semibold">Default Value</th>
                      <th className="py-2.5 px-3 font-semibold">Description / Target</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200/70'}`}>
                    {fields.map((field, idx) => (
                      <tr key={idx} className={darkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-50'}>
                        {/* Name */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                            placeholder="field_name"
                            className={`w-full px-2.5 py-1 rounded border text-xs font-mono font-medium focus:outline-none focus:border-cyan-600 ${
                              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </td>

                        {/* Type */}
                        <td className="py-2 px-3">
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(idx, 'type', e.target.value as SchemaFieldType)}
                            className={`w-full px-2.5 py-1 rounded border text-xs font-semibold focus:outline-none focus:border-cyan-600 ${
                              darkMode ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-slate-50 border-slate-300 text-cyan-700'
                            }`}
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.type} value={t.type}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Required toggle */}
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-600 cursor-pointer accent-cyan-600"
                          />
                        </td>

                        {/* Default Value */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={String(field.defaultValue || '')}
                            onChange={(e) => handleUpdateField(idx, 'defaultValue', e.target.value)}
                            placeholder="Optional default"
                            className={`w-full px-2.5 py-1 rounded border text-xs focus:outline-none focus:border-cyan-600 ${
                              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </td>

                        {/* Description / Pointer target */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={field.description || ''}
                            onChange={(e) => handleUpdateField(idx, 'description', e.target.value)}
                            placeholder="Usage note or target class"
                            className={`w-full px-2.5 py-1 rounded border text-xs focus:outline-none focus:border-cyan-600 ${
                              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          />
                        </td>

                        {/* Action */}
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleRemoveField(idx)}
                            className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Delete field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Supported Back4App Types Info Cards */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${darkMode ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Supported Parse Cloud Types
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FIELD_TYPES.map((t) => (
                    <div key={t.type} className={`p-2 rounded-lg border text-[11px] ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="font-mono font-bold text-slate-900 dark:text-cyan-300">{t.type}</span>
                      <p className="text-slate-600 dark:text-slate-400 truncate mt-0.5">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">Standard Draft 2020-12 Schema for Back4App REST Validation</p>
                <button
                  onClick={() => handleCopyCode(generateJsonSchema())}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto max-h-[400px]">
                {generateJsonSchema()}
              </pre>
            </div>
          )}

          {activeTab === 'flutter' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Production-Ready <code className="text-cyan-700 dark:text-cyan-400 font-mono">parse_server_sdk_flutter</code> Dart Subclass
                </p>
                <button
                  onClick={() => handleCopyCode(generateDartModel())}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Copied!' : 'Copy Dart Class'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto max-h-[400px]">
                {generateDartModel()}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Database className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
            <span>Target Server: https://parseapi.back4app.com</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handlePushSchema}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Pushing Schema...' : 'Push Schema to Back4App'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
