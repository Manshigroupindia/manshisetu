import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Smartphone,
  CalendarCheck2,
  Clock3,
  Receipt,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StaffComingSoonPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useApp();

  const plannedFeatures = [
    {
      icon: Clock3,
      title: 'Geofenced Mobile Punch-In',
      desc: 'Seamless GPS-verified check-in & check-out with automatic biometric cross-sync.',
    },
    {
      icon: CalendarCheck2,
      title: 'Self-Service Leave Applications',
      desc: 'Submit paid leave and casual absence requests with instant manager approval tracking.',
    },
    {
      icon: Receipt,
      title: 'Instant Expense Reimbursement',
      desc: 'Upload receipts directly from your phone camera for fast conveyance and meal claim approvals.',
    },
    {
      icon: FileCheck,
      title: 'Interactive Payslips & Form 16',
      desc: 'Download verified monthly salary slips with 30-day breakdown and annual tax summaries.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between p-6">
      {/* Top Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl hover:bg-white dark:hover:bg-navy-900 border border-transparent hover:border-slate-200 dark:hover:border-navy-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Selection
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
            Manshi Setu
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto my-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Smartphone className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4">
          <ShieldCheck className="w-4 h-4" />
          Employee Self-Service Portal · Under Development
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Staff Portal Coming Soon
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto mb-10">
          The Manshi Group employee self-service mobile and web application is currently being prepared for secure enterprise launch.
        </p>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-10">
          {plannedFeatures.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-brand-600 dark:text-brand-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {f.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal pl-11">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Notice Card */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 max-w-xl mx-auto flex items-start gap-3 text-left mb-8">
          <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice to Staff:</span> During this phase, daily attendance logs, task assignments, and salary disbursements are actively administered by your department heads through the Administrative Setu CMS.
          </div>
        </div>

        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand-600 dark:hover:bg-brand-700 text-sm font-bold shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Role Selection
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        {settings.companyName} · Internal Release Preview
      </footer>
    </div>
  );
};
