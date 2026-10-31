import React, { useState } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Database,
  Car,
  ShoppingBag,
  Utensils,
  Building2,
  Heart,
  Briefcase,
  Compass,
  Wrench,
  Check,
} from 'lucide-react';

import { EastAfricaCountryCode } from '../types';
import {
  EAST_AFRICAN_COUNTRIES_META,
  EAST_AFRICAN_COUNTRIES_ORDERED,
} from '../services/eastAfricaModules';

interface RegisterModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onRegister: (data: {
    name: string;
    key: string;
    description: string;
    category: string;
    icon: string;
    enabled: boolean;
    customClasses: string[];
    targetCountries?: Exclude<EastAfricaCountryCode, 'ALL'>[];
  }) => Promise<void>;
}

const PRESET_IDEAS = [
  { name: 'Pharmacy & Health', key: 'pharmacy', category: 'Healthcare', icon: 'Heart', desc: 'Prescription ordering and express medicine delivery.', classes: ['PharmacyOrder', 'PharmacyInventory'] },
  { name: 'Car Rental', key: 'car_rental', category: 'Mobility', icon: 'Car', desc: 'Self-drive and luxury chauffeur vehicle rentals.', classes: ['RentalBooking', 'RentalFleet'] },
  { name: 'Tourism & Safari', key: 'tourism', category: 'Hospitality', icon: 'Compass', desc: 'Guided cultural tours, Simien mountain treks, and lodge bookings.', classes: ['TourPackage', 'TourReservation'] },
  { name: 'Home Services', key: 'home_services', category: 'On-Demand', icon: 'Wrench', desc: 'On-demand plumbing, electrical, and domestic cleaning.', classes: ['ServiceBooking', 'ServiceTechnician'] },
];

const AVAILABLE_ICONS = [
  { id: 'Heart', label: 'Heart / Health', icon: <Heart className="w-4 h-4" /> },
  { id: 'Car', label: 'Car / Mobility', icon: <Car className="w-4 h-4" /> },
  { id: 'Compass', label: 'Compass / Travel', icon: <Compass className="w-4 h-4" /> },
  { id: 'Wrench', label: 'Wrench / Services', icon: <Wrench className="w-4 h-4" /> },
  { id: 'ShoppingBag', label: 'Shopping / Retail', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'Utensils', label: 'Dining / Food', icon: <Utensils className="w-4 h-4" /> },
  { id: 'Building2', label: 'Hotel / Stays', icon: <Building2 className="w-4 h-4" /> },
  { id: 'Briefcase', label: 'Business', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'Sparkles', label: 'Custom', icon: <Sparkles className="w-4 h-4" /> },
];

export const RegisterModuleModal: React.FC<RegisterModuleModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Mobility');
  const [icon, setIcon] = useState('Sparkles');
  const [enabled, setEnabled] = useState(true);
  const [classInput, setClassInput] = useState('');
  const [customClasses, setCustomClasses] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<Exclude<EastAfricaCountryCode, 'ALL'>[]>(
    EAST_AFRICAN_COUNTRIES_ORDERED
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const autoKey = val.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 20);
    setKey(autoKey);

    if (customClasses.length === 0 && autoKey) {
      const pascal = val.replace(/[^a-zA-Z0-9]/g, '');
      setCustomClasses([`${pascal}Order`, `${pascal}Item`]);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setName(preset.name);
    setKey(preset.key);
    setCategory(preset.category);
    setIcon(preset.icon);
    setDescription(preset.desc);
    setCustomClasses(preset.classes);
  };

  const handleAddClass = () => {
    if (!classInput.trim()) return;
    const clean = classInput.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (clean && !customClasses.includes(clean)) {
      setCustomClasses([...customClasses, clean]);
      setClassInput('');
    }
  };

  const handleRemoveClass = (cl: string) => {
    setCustomClasses(customClasses.filter((c) => c !== cl));
  };

  const toggleCountry = (code: Exclude<EastAfricaCountryCode, 'ALL'>) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAllCountries = () => {
    if (selectedCountries.length === EAST_AFRICAN_COUNTRIES_ORDERED.length) {
      setSelectedCountries([]);
    } else {
      setSelectedCountries(EAST_AFRICAN_COUNTRIES_ORDERED);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setIsSubmitting(true);
    try {
      await onRegister({
        name: name.trim(),
        key: key.trim(),
        description: description.trim() || `Operations and management for ${name}`,
        category,
        icon,
        enabled,
        customClasses: customClasses.length > 0 ? customClasses : [`${name.replace(/\s+/g, '')}Record`],
        targetCountries: selectedCountries.length > 0 ? selectedCountries : EAST_AFRICAN_COUNTRIES_ORDERED,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col justify-between p-6 sm:p-7 rounded-2xl border shadow-2xl overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                Register New SuperApp Module
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a new business vertical and provision Back4App Parse database classes
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

        {/* Quick Presets */}
        <div className="my-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Quick Templates
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_IDEAS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  key === preset.key
                    ? 'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-400 dark:border-cyan-500/50 text-cyan-800 dark:text-cyan-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Module Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pharmacy & Health"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Unique Slug Key
              </label>
              <input
                type="text"
                required
                placeholder="e.g. pharmacy"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className={`${inputClass} font-mono text-cyan-700 dark:text-cyan-400`}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Description
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe this module's services..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="Mobility">Mobility &amp; Transit</option>
                <option value="Logistics">Logistics &amp; Freight</option>
                <option value="Healthcare">Healthcare &amp; Pharmacy</option>
                <option value="Commerce">Commerce &amp; Delivery</option>
                <option value="Hospitality">Hospitality &amp; Stays</option>
                <option value="Fintech">Fintech &amp; Payments</option>
                <option value="On-Demand">On-Demand Services</option>
                <option value="Lifestyle">Lifestyle &amp; Entertainment</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Visual Icon
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setIcon(ic.id)}
                    className={`p-2 rounded-lg border transition-colors ${
                      icon === ic.id
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={ic.label}
                  >
                    {ic.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Associated Back4App Parse Classes</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Auto-provisioned on submit
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. PharmacyPrescription"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddClass();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleAddClass}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap"
              >
                Add Class
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {customClasses.map((cl) => (
                <span
                  key={cl}
                  className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] flex items-center gap-1.5"
                >
                  <span>{cl}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClass(cl)}
                    className="hover:text-rose-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* East African Regional Jurisdictions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                East Africa Deployment Scope ({selectedCountries.length}/8 Nations)
              </label>
              <button
                type="button"
                onClick={handleSelectAllCountries}
                className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {selectedCountries.length === EAST_AFRICAN_COUNTRIES_ORDERED.length
                  ? 'Deselect All'
                  : 'Select All 8 Nations'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              Select which East African member states this vertical will be provisioned in with statutory rate rules.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EAST_AFRICAN_COUNTRIES_ORDERED.map((code) => {
                const meta = EAST_AFRICAN_COUNTRIES_META[code];
                const isSelected = selectedCountries.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleCountry(code)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-colors text-left ${
                      isSelected
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500/50 text-cyan-900 dark:text-cyan-200'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="text-base">{meta.flag}</span>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{code}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{meta.currency}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Enable in SuperApp Sidebar immediately
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Toggle on or off anytime from Module Management
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Back4App...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Register &amp; Provision Module</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
