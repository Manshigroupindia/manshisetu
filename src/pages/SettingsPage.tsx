import React, { useState } from 'react';
import {
  Settings,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  ShieldCheck,
  RotateCcw,
  Save,
  Sun,
  Moon,
  AlertTriangle,
  Sparkles,
  Upload,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompanySettings } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { cloudinaryService } from '../services/cloudinaryService';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetAllDemoData, darkMode, toggleDarkMode, showToast } = useApp();

  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      setLogoUploadProgress(0);
      const res = await cloudinaryService.uploadCompanyLogo(file, (p) => {
        setLogoUploadProgress(p);
      });
      setFormData((prev) => ({ ...prev, logoUrl: res.secureUrl }));
      showToast('Company logo uploaded to Cloudinary successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Logo upload failed.', 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSalaryPolicyChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      salaryPolicy: {
        ...prev.salaryPolicy,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Settings & Organization Profile
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              System Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure company branding, office operational hours, 30-day salary policies, and system preferences.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
        >
          <Save className="w-4 h-4" />
          Save All Settings
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Section 1: Company Profile & Official Details */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-navy-800 pb-3">
            <Building className="w-4 h-4 text-brand-600" />
            Company Profile & Official Contacts
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Company Legal Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={formData.brandTagline}
                onChange={(e) => handleInputChange('brandTagline', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          {/* Company Brand Logo Upload (Cloudinary) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Company Brand Logo (Cloudinary Upload)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="text"
                placeholder="https://res.cloudinary.com/..."
                value={formData.logoUrl}
                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs"
              />
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold text-xs cursor-pointer shrink-0 transition-colors">
                {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{isUploadingLogo ? `Uploading (${logoUploadProgress}%)...` : 'Upload Logo to Cloudinary'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingLogo}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </label>
            </div>
            {formData.logoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold">Preview:</span>
                <img
                  src={formData.logoUrl}
                  alt="Company Logo Preview"
                  className="h-8 max-w-[120px] object-contain rounded border border-slate-200 dark:border-navy-700 bg-white p-0.5"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                required
                value={formData.officialEmail}
                onChange={(e) => handleInputChange('officialEmail', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Contact Number *
              </label>
              <input
                type="text"
                required
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Official Website
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Registered Corporate Office Address *
            </label>
            <textarea
              rows={2}
              required
              value={formData.officeAddress}
              onChange={(e) => handleInputChange('officeAddress', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs"
            />
          </div>
        </div>

        {/* Section 2: Administration & Operating Hours */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-navy-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            Administration & Working Schedule
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Admin Name *
              </label>
              <input
                type="text"
                required
                value={formData.adminName}
                onChange={(e) => handleInputChange('adminName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Admin Designation *
              </label>
              <input
                type="text"
                required
                value={formData.adminDesignation}
                onChange={(e) => handleInputChange('adminDesignation', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Headquarters Office Location
              </label>
              <input
                type="text"
                value={formData.officeLocation}
                onChange={(e) => handleInputChange('officeLocation', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Office Working Hours
              </label>
              <input
                type="text"
                value={formData.officeHours}
                onChange={(e) => handleInputChange('officeHours', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Official Weekly Off Day
              </label>
              <select
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
              >
                <option value="0">Sunday (Paid Weekly Off as per Company Policy)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2.5: Office Geofence & GPS Verification Settings */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-brand-600" />
              Office Geofence & GPS Verification Settings
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.officeGeofence?.enabled ?? true}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    officeGeofence: {
                      latitude: prev.officeGeofence?.latitude ?? 28.6289,
                      longitude: prev.officeGeofence?.longitude ?? 77.2219,
                      radiusMeters: prev.officeGeofence?.radiusMeters ?? 300,
                      enabled: e.target.checked,
                    },
                  }))
                }
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Enable Geofence Advisory Audit
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Office Official Latitude *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.officeGeofence?.latitude ?? 28.6289}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    officeGeofence: {
                      latitude: parseFloat(e.target.value) || 28.6289,
                      longitude: prev.officeGeofence?.longitude ?? 77.2219,
                      radiusMeters: prev.officeGeofence?.radiusMeters ?? 300,
                      enabled: prev.officeGeofence?.enabled ?? true,
                    },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Office Official Longitude *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.officeGeofence?.longitude ?? 77.2219}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    officeGeofence: {
                      latitude: prev.officeGeofence?.latitude ?? 28.6289,
                      longitude: parseFloat(e.target.value) || 77.2219,
                      radiusMeters: prev.officeGeofence?.radiusMeters ?? 300,
                      enabled: prev.officeGeofence?.enabled ?? true,
                    },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Allowed Geofence Radius (Meters) *
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                step="10"
                required
                value={formData.officeGeofence?.radiusMeters ?? 300}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    officeGeofence: {
                      latitude: prev.officeGeofence?.latitude ?? 28.6289,
                      longitude: prev.officeGeofence?.longitude ?? 77.2219,
                      radiusMeters: parseInt(e.target.value, 10) || 300,
                      enabled: prev.officeGeofence?.enabled ?? true,
                    },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-mono font-bold text-brand-600"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            The Haversine algorithm calculates the exact spherical distance between the staff member's captured GPS coordinate and the office anchor point. Readings with poor accuracy (&gt;500m) are labeled "Needs Review" rather than marking the employee absent. The geofence is advisory.
          </p>
        </div>

        {/* Section 3: Salary & Leave Policy Configuration */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-navy-800 pb-3">
            <Clock className="w-4 h-4 text-brand-600" />
            Salary & Leave Policy Engine Settings
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Monthly Salary Days Calculation Basis
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="28"
                  max="31"
                  value={formData.salaryPolicy.daysInMonthBasis}
                  onChange={(e) =>
                    handleSalaryPolicyChange(
                      'daysInMonthBasis',
                      parseInt(e.target.value, 10) || 30
                    )
                  }
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-extrabold text-brand-600 text-center"
                />
                <span className="text-xs text-slate-500">
                  Fixed company formula: Daily Rate = Fixed Salary ÷ 30
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Allowed Paid Leaves Per Month (Zero Deduction)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.salaryPolicy.allowedPaidLeavesPerMonth}
                  onChange={(e) =>
                    handleSalaryPolicyChange(
                      'allowedPaidLeavesPerMonth',
                      parseInt(e.target.value, 10) || 1
                    )
                  }
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-extrabold text-emerald-600 text-center"
                />
                <span className="text-xs text-slate-500">
                  Subsequent approved absences are deducted at daily rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Display & System Reset */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-navy-800 pb-3">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Display & Maintenance Utilities
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Interface Theme</div>
              <p className="text-slate-500 text-xs mt-0.5">
                Toggle between light corporate mode and dark contrast view.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 font-bold text-xs"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
          </div>

          {/* Clean Local Cache & Sample Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200 dark:border-navy-800">
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Clear Local Cache & Sample Data
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                Clears any residual sample records or cached data from local browser storage. Genuine Firebase records remain safe and will re-sync dynamically from Cloud Firestore.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Clean Local Cache
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20"
          >
            Save All Settings
          </button>
        </div>
      </form>

      {/* RESET CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetAllDemoData}
        title="Clean Local Cache & Sample Data"
        message="This will remove any cached sample or test records from local browser storage. Your genuine Firebase database records will remain completely intact and continue to sync dynamically. Do you wish to continue?"
        confirmText="Yes, Clean Local Cache"
        isDestructive={false}
      />
    </div>
  );
};
