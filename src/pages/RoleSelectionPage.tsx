import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  UserCheck2,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  User,
  Loader2,
  LogOut,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { auth, loginAdmin, loginStaff, logout, staff, darkMode, toggleDarkMode, settings } = useApp();

  // Admin Modal States
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('devenjhaofficial@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Staff Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = adminUsername.trim().toLowerCase();
    if (!normalizedEmail) {
      setAdminError('Please provide the authorized Director email address.');
      return;
    }
    if (!adminPassword) {
      setAdminError('Please enter your Director account password.');
      return;
    }

    setAdminError('');
    setIsAdminLoading(true);

    try {
      // Email is trimmed and normalized to lowercase; password is passed unmodified
      await loginAdmin(normalizedEmail, adminPassword);
      setIsAdminModalOpen(false);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setAdminError(err.message || 'Director authentication failed. Please verify credentials.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleStaffLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffIdentifier.trim()) {
      setStaffError('Please provide your Employee ID or Official Email address.');
      return;
    }
    if (!staffPassword.trim()) {
      setStaffError('Please enter your staff portal password.');
      return;
    }

    setStaffError('');
    setIsStaffLoading(true);

    try {
      await loginStaff(staffIdentifier.trim(), staffPassword);
      setIsStaffModalOpen(false);
      navigate('/staff/dashboard');
    } catch (err: any) {
      setStaffError(err.message || 'Staff authentication failed. Please verify your credentials.');
    } finally {
      setIsStaffLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <nav className="w-full border-b border-slate-200 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                Manshi Group
              </span>
              <span className="px-1.5 py-0.5 text-xs font-bold tracking-wider uppercase rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
                Setu
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enterprise Internal Office Management CMS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {auth.isAuthenticated && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(auth.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold hover:bg-brand-100 transition-colors"
              >
                <span>Continue as {auth.username || (auth.role === 'admin' ? 'Director' : 'Staff')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-500 hover:text-rose-600 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          )}

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 transition-colors"
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </nav>

      {/* Main Role Selection Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="max-w-4xl w-full text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 text-brand-700 dark:text-brand-300 text-xs font-bold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Official Internal Staff & Administration Gateway
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Welcome to <span className="text-brand-600 dark:text-brand-500">Manshi Group Setu</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
            Select your dedicated portal to access office administration, staff attendance with live GPS duty logs, task delegation, payroll processing, and enterprise resources.
          </p>
        </div>

        {/* The Two Main Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {/* Card 1: Administrative Login */}
          <div
            onClick={() => {
              setAdminError('');
              setIsAdminModalOpen(true);
            }}
            className="group relative cursor-pointer bg-white dark:bg-navy-900 rounded-3xl p-8 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-xl hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all duration-200 text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 mb-2">
                Executive & Operations
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Administrative Login
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Full governance access to work assignments, 30-day salary calculation, GPS attendance audit, expense approvals, notices, and staff records. Strictly restricted to the authorized Director account.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-brand-600 dark:text-brand-400 font-bold text-sm">
              <span>Open Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Staff Login */}
          <div
            onClick={() => {
              setStaffError('');
              setIsStaffModalOpen(true);
            }}
            className="group relative cursor-pointer bg-white dark:bg-navy-900 rounded-3xl p-8 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-200 text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-105 transition-transform">
                <UserCheck2 className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 mb-2">
                Employee Self-Service
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Staff Login
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Personal staff terminal with GPS Duty On/Off attendance tracking, personal task management, expense claims, notices, and salary slips.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-sm">
              <span>Sign In to Staff Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>
      </main>

      {/* Admin Login Dialog */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isAdminLoading && setIsAdminModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-7 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Administrative Sign In
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Firebase Authentication · Director Portal
                </p>
              </div>
            </div>

            {adminError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">{adminError}</div>
                </div>
                {adminError.includes('auth/invalid-credential') && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] leading-normal">
                    <strong>Firebase Auth Note:</strong> In Firebase Authentication, <code className="font-mono font-bold">auth/invalid-credential</code> indicates either an incorrect password OR that the user <code className="font-bold underline">devenjhaofficial@gmail.com</code> has not yet been registered in Firebase Console (under <strong>Authentication &gt; Users &gt; Add user</strong>).
                  </div>
                )}
                {adminError.includes('auth/unauthorized-domain') && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] leading-normal">
                    <strong>Domain Tip:</strong> Ensure <code className="font-bold">localhost</code> or your host is added to Firebase Console under <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Authorized Director Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="devenjhaofficial@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Director Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter Firebase password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Only the verified director account (<code className="text-brand-600 font-bold">devenjhaofficial@gmail.com</code>) is authorized.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isAdminLoading}
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdminLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 rounded-xl shadow-md shadow-brand-600/20 transition-all"
                >
                  {isAdminLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAdminLoading ? 'Authenticating...' : 'Enter Admin Dashboard'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Login Dialog */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isStaffLoading && setIsStaffModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-7 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                <UserCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Staff Self-Service Sign In
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Firebase Authentication · Manshi Group Setu Staff Terminal
                </p>
              </div>
            </div>

            {staffError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                {staffError}
              </div>
            )}

            <form onSubmit={handleStaffLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Employee ID or Official Email *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={staffIdentifier}
                    onChange={(e) => setStaffIdentifier(e.target.value)}
                    placeholder="Enter Employee ID or Official Email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Select Employee ID Chips for Convenience */}
              {staff && staff.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Select registered employee:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {staff.slice(0, 4).map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setStaffIdentifier(s.employeeId)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          staffIdentifier.toLowerCase() === s.employeeId.toLowerCase()
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 font-medium'
                        }`}
                      >
                        {s.fullName.split(' ')[0]} ({s.employeeId})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Staff Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Sign in with your assigned Firebase credentials. Staff profiles are provisioned by the Director.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsStaffModalOpen(false);
                    navigate('/staff-portal');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                >
                  Feature Roadmap
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isStaffLoading}
                    onClick={() => setIsStaffModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isStaffLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl shadow-md shadow-blue-600/20 transition-all"
                  >
                    {isStaffLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isStaffLoading ? 'Authenticating...' : 'Access Staff Terminal'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-navy-800 py-6 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} {settings.companyName}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>{settings.officeLocation}</span>
            <span>•</span>
            <span>Support: {settings.officialEmail}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
