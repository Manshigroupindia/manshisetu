import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Briefcase,
  ShieldCheck,
  FileText,
  Lock,
  Edit3,
  Save,
  CheckCircle2,
  MapPin,
  FileCheck,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StaffProfilePage: React.FC = () => {
  const { currentStaff, updateStaffPersonalProfile, showToast } = useApp();

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [alternateContact, setAlternateContact] = useState(
    currentStaff?.alternateContact || ''
  );
  const [residentialAddress, setResidentialAddress] = useState(
    currentStaff?.address || ''
  );

  if (!currentStaff) {
    return (
      <div className="p-8 text-center text-slate-400">
        Staff profile not loaded. Please log in again.
      </div>
    );
  }

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaffPersonalProfile(currentStaff.id, {
      alternateContact: alternateContact.trim(),
      address: residentialAddress.trim(),
    });
    setIsEditingPersonal(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Official employee documents from dynamic staff profile
  const employeeDocuments = currentStaff.documents || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <User className="w-4 h-4" />
            <span>Employee Identification</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            My Employee Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified corporate credentials, department record, personal dossier, and employment documents
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Active Employee · Verified</span>
        </span>
      </div>

      {/* Main Profile Dossier Card */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-navy-800">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            {getInitials(currentStaff.fullName)}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {currentStaff.fullName}
              </h2>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                {currentStaff.employeeId}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {currentStaff.designation} · {currentStaff.department}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-3 pt-0.5">
              <span>Joining Date: {currentStaff.joiningDate}</span>
              <span>•</span>
              <span>Official Status: {currentStaff.status || 'Active'}</span>
            </p>
          </div>
        </div>

        {/* Corporate Official Records (Strictly Read-Only) */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Official Corporate Records (Admin Governed)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Official Email */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Official Work Email</span>
              </span>
              <div className="font-bold text-slate-900 dark:text-white truncate">
                {currentStaff.officialEmail}
              </div>
            </div>

            {/* Official Contact Phone */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Registered Contact Number</span>
              </span>
              <div className="font-bold text-slate-900 dark:text-white font-mono">
                {currentStaff.contactNumber}
              </div>
            </div>

            {/* Department */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Department Unit</span>
              </span>
              <div className="font-bold text-slate-900 dark:text-white">
                {currentStaff.department}
              </div>
            </div>

            {/* Designation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                <span>Official Designation</span>
              </span>
              <div className="font-bold text-slate-900 dark:text-white">
                {currentStaff.designation}
              </div>
            </div>

            {/* Office Location */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Base Office Branch</span>
              </span>
              <div className="font-bold text-slate-900 dark:text-white">
                {currentStaff.officeLocation || 'Manshi Corporate Head Office, Connaught Place, New Delhi'}
              </div>
            </div>

            {/* Monthly Fixed Salary */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-1">
              <span className="text-blue-700 dark:text-blue-300 text-[10px] uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Fixed Monthly Salary</span>
              </span>
              <div className="font-black text-slate-900 dark:text-white font-mono text-sm">
                ₹{(currentStaff.monthlyFixedSalary || 0).toLocaleString('en-IN')} / month
              </div>
            </div>
          </div>
        </div>

        {/* Permitted Editable Personal Fields */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-navy-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Personal Contact & Residential Info
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff may update personal alternate contacts and residential communication address
              </p>
            </div>

            {!isEditingPersonal && (
              <button
                onClick={() => setIsEditingPersonal(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Personal Info</span>
              </button>
            )}
          </div>

          {isEditingPersonal ? (
            <form onSubmit={handleSavePersonal} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Alternate Contact / Emergency Phone
                </label>
                <input
                  type="text"
                  value={alternateContact}
                  onChange={(e) => setAlternateContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Residential Communication Address
                </label>
                <textarea
                  rows={2}
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  placeholder="Complete residential address..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Personal Details</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Alternate Contact
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {currentStaff.alternateContact || alternateContact || 'Not specified'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Residential Address
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentStaff.address || residentialAddress || 'Not specified'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Employment Documents Section */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              My Official Documents & Letters
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {employeeDocuments.length} Verified Document{employeeDocuments.length === 1 ? '' : 's'}
          </span>
        </div>

        {employeeDocuments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-navy-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-navy-700">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No documents uploaded
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Official letters and verified employee documents will appear here once uploaded by HR / Administration.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeeDocuments.map((doc, i) => (
              <div
                key={doc.id || i}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-800/40 hover:border-blue-300 dark:hover:border-navy-700 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {doc.name}
                    </h4>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Uploaded: {doc.uploadedAt} · {doc.type} ({doc.size})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    showToast(
                      `Downloading official document "${doc.name}" for ${currentStaff.fullName}...`,
                      'info'
                    )
                  }
                  className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors shrink-0"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
