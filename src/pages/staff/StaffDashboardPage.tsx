import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Receipt,
  CircleDollarSign,
  CalendarDays,
  BellRing,
  ExternalLink,
  Navigation,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info,
  Building2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { formatDistance, getGoogleMapsUrl, getGoogleMapsEmbedUrl } from '../../utils/geoUtils';
import { getTodayDateString, getCurrentMonthString } from '../../utils/dateUtils';
import { useAttendanceLocation } from '../../hooks/useAttendanceLocation';
import { LocationErrorBanner } from '../../components/common/LocationErrorBanner';

export const StaffDashboardPage: React.FC = () => {
  const {
    currentStaff,
    attendance,
    work,
    expenses,
    salaries,
    notices,
    holidays,
    events,
    settings,
    recordDutyOn,
    recordDutyOff,
    showToast,
  } = useApp();

  const {
    isLocating,
    locatingMessage,
    geoError,
    executeDutyAction,
    retryLocation,
    clearGeoError,
  } = useAttendanceLocation();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Live timer for greeting and clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayStr = getTodayDateString();
  const currentMonthStr = getCurrentMonthString();
  const myEmployeeId = currentStaff?.employeeId;

  // Today's attendance session for this staff
  const todayRecord = attendance.find(
    (a) => (a.staffId === currentStaff?.employeeId || a.staffId === currentStaff?.id) && a.date === todayStr
  );
  const dutyStatus = todayRecord?.dutyStatus || 'duty_off';

  // My Tasks
  const myTasks = work.filter((w) => w.staffId === myEmployeeId);
  const pendingTasks = myTasks.filter((w) => w.status === 'pending' || w.status === 'in_progress');
  const completedTasks = myTasks.filter((w) => w.status === 'completed');

  // My Expenses
  const myExpenses = expenses.filter((e) => e.staffId === myEmployeeId);
  const pendingExpenses = myExpenses.filter((e) => e.approvalStatus === 'pending');
  const totalPendingExpenseAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  // My Notices (targeted or company-wide)
  const myNotices = notices.filter(
    (n) =>
      n.status === 'published' &&
      (n.targetAudience === 'all' ||
        (n.targetAudience === 'specific' && n.targetStaffIds?.includes(myEmployeeId || '')))
  );

  // Month attendance summary
  const currentMonthAttendance = attendance.filter((a) => {
    return (
      (a.staffId === currentStaff?.employeeId || a.staffId === currentStaff?.id) &&
      a.date.startsWith(currentMonthStr)
    );
  });
  const presentDaysCount = currentMonthAttendance.filter(
    (a) => a.status === 'present' || a.status === 'half_day'
  ).length;

  // Monthly salary summary
  const myCurrentSalary = salaries.find(
    (s) => s.staffId === currentStaff?.id && s.month === currentMonthStr
  );

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Greeting, Date & Live Clock */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Manshi Group Setu · Staff Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {getGreeting()},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-white">
                {currentStaff?.fullName?.split(' ')[0] || 'Team Member'}
              </span>
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 flex items-center gap-2 flex-wrap">
              <span>{currentStaff?.designation}</span>
              <span>•</span>
              <span className="font-mono text-blue-300 font-bold">{currentStaff?.employeeId}</span>
              <span>•</span>
              <span>{currentStaff?.department}</span>
            </p>
          </div>

          {/* Live Date & Clock Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <Clock className="w-6 h-6 text-blue-400 shrink-0 hidden sm:block" />
            <div>
              <div className="text-xs text-slate-300 font-medium">{formattedDate}</div>
              <div className="text-2xl font-black font-mono tracking-wider text-white">
                {formattedTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRITICAL FEATURE: DUTY ON / DUTY OFF GPS ATTENDANCE HERO MODULE */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  dutyStatus === 'duty_on'
                    ? 'bg-emerald-500 animate-pulse'
                    : dutyStatus === 'duty_completed'
                    ? 'bg-blue-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Today's Duty Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  dutyStatus === 'duty_on'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : dutyStatus === 'duty_completed'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300 border border-slate-300 dark:border-navy-700'
                }`}
              >
                {dutyStatus === 'duty_on'
                  ? 'Duty Active (Checked In)'
                  : dutyStatus === 'duty_completed'
                  ? 'Duty Completed (Checked Out)'
                  : 'Duty Off (Not Checked In)'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {dutyStatus === 'duty_off' && 'Record Your Check-In for Today'}
              {dutyStatus === 'duty_on' && 'You Are Currently On Duty'}
              {dutyStatus === 'duty_completed' && "Today's Duty Successfully Completed"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {dutyStatus === 'duty_off' &&
                'Click "Duty On" below to capture your real-time GPS coordinates and official Indian Standard Time check-in timestamp. Location permission is required.'}
              {dutyStatus === 'duty_on' &&
                'Your check-in location is recorded. When completing your shift, click "Duty Off" to capture your check-out location and compute your total working duration.'}
              {dutyStatus === 'duty_completed' &&
                `Both check-in and check-out GPS events have been recorded. Total recorded duration: ${
                  todayRecord?.sessionDurationText || `${todayRecord?.workingHours || 8} hours`
                }.`}
            </p>
          </div>

          {/* Action Button Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {dutyStatus === 'duty_off' && (
              <button
                onClick={() => executeDutyAction('duty_on')}
                disabled={isLocating}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
              >
                {isLocating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{locatingMessage || 'Acquiring GPS Fix...'}</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    <span>DUTY ON</span>
                  </>
                )}
              </button>
            )}

            {dutyStatus === 'duty_on' && (
              <button
                onClick={() => executeDutyAction('duty_off')}
                disabled={isLocating}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-rose-600/25 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
              >
                {isLocating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{locatingMessage || 'Acquiring GPS Fix...'}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>DUTY OFF</span>
                  </>
                )}
              </button>
            )}

            {dutyStatus === 'duty_completed' && (
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-xs font-bold">Shift Closed for Today</span>
              </div>
            )}

            <Link
              to="/staff/attendance"
              className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>View Logs</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live Locating Status Progress Bar */}
        {isLocating && (
          <div className="mt-4 p-3 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center gap-2.5 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{locatingMessage || 'Contacting GPS satellites (High Accuracy mode)...'}</span>
          </div>
        )}

        {/* Location Error & Retry Banner */}
        {geoError && (
          <div className="mt-5">
            <LocationErrorBanner
              error={geoError}
              onRetry={retryLocation}
              onDismiss={clearGeoError}
              isRetrying={isLocating}
              locatingMessage={locatingMessage}
            />
          </div>
        )}

        {/* Live Today's Attendance Details Card */}
        {todayRecord && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-navy-800 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Check-In Info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Check-In Event
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {todayRecord.checkIn || '—'}
                </span>
              </div>
              {todayRecord.checkInLocation ? (
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      {todayRecord.checkInLocation.latitude.toFixed(5)},{' '}
                      {todayRecord.checkInLocation.longitude.toFixed(5)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Accuracy: ±{Math.round(todayRecord.checkInLocation.accuracy)}m ·{' '}
                    {todayRecord.checkInDistanceMeters !== undefined && (
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {formatDistance(todayRecord.checkInDistanceMeters)} from office
                      </span>
                    )}
                  </div>
                  <a
                    href={todayRecord.checkInLocation.mapsUrl || getGoogleMapsUrl(todayRecord.checkInLocation.latitude, todayRecord.checkInLocation.longitude)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {/* Interactive Google Map Preview */}
                  <div className="pt-2">
                    <iframe
                      title="Check-In Map Preview"
                      src={getGoogleMapsEmbedUrl(todayRecord.checkInLocation.latitude, todayRecord.checkInLocation.longitude)}
                      className="w-full h-32 rounded-xl border border-slate-200 dark:border-navy-700 shadow-xs"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No GPS coordinates recorded</div>
              )}
            </div>

            {/* Check-Out Info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Check-Out Event
                </span>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  {todayRecord.checkOut || (dutyStatus === 'duty_on' ? 'In Progress' : 'Pending')}
                </span>
              </div>
              {todayRecord.checkOutLocation ? (
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>
                      {todayRecord.checkOutLocation.latitude.toFixed(5)},{' '}
                      {todayRecord.checkOutLocation.longitude.toFixed(5)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Accuracy: ±{Math.round(todayRecord.checkOutLocation.accuracy)}m ·{' '}
                    {todayRecord.checkOutDistanceMeters !== undefined && (
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {formatDistance(todayRecord.checkOutDistanceMeters)} from office
                      </span>
                    )}
                  </div>
                  <a
                    href={todayRecord.checkOutLocation.mapsUrl || getGoogleMapsUrl(todayRecord.checkOutLocation.latitude, todayRecord.checkOutLocation.longitude)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {/* Interactive Google Map Preview */}
                  <div className="pt-2">
                    <iframe
                      title="Check-Out Map Preview"
                      src={getGoogleMapsEmbedUrl(todayRecord.checkOutLocation.latitude, todayRecord.checkOutLocation.longitude)}
                      className="w-full h-32 rounded-xl border border-slate-200 dark:border-navy-700 shadow-xs"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  {dutyStatus === 'duty_on'
                    ? 'Check-out location will be captured at Duty Off'
                    : 'Not checked out yet'}
                </div>
              )}
            </div>

            {/* Total Duration Info */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Recorded Work Duration
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {todayRecord.sessionDurationText ||
                    (dutyStatus === 'duty_on'
                      ? 'Tracking Duty...'
                      : `${todayRecord.workingHours || 0} Hours`)}
                </div>
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-2">
                Session ID: <span className="font-mono">{todayRecord.sessionId || todayRecord.id}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: My Pending Tasks */}
        <Link
          to="/staff/work"
          className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-amber-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400">Total: {myTasks.length}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {pendingTasks.length}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Active Assigned Tasks
          </div>
        </Link>

        {/* Card 2: Monthly Attendance */}
        <Link
          to="/staff/attendance"
          className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600">
              {new Date().toLocaleString('en-US', { month: 'long' })}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {presentDaysCount}{' '}
            <span className="text-xs font-normal text-slate-400">Days</span>
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Month Present Count
          </div>
        </Link>

        {/* Card 3: Pending Expenses */}
        <Link
          to="/staff/expenses"
          className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-brand-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400">{pendingExpenses.length} claims</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ₹{totalPendingExpenseAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Pending Reimbursements
          </div>
        </Link>

        {/* Card 4: Monthly Salary Preview */}
        <Link
          to="/staff/salary"
          className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                myCurrentSalary?.paymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {myCurrentSalary?.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ₹{(myCurrentSalary?.finalPayable || currentStaff?.monthlyFixedSalary || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Net Monthly Payable
          </div>
        </Link>
      </div>

      {/* Main Grid: My Active Tasks & Company Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Active Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    My Assigned Tasks
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tasks assigned to your employee ID
                  </p>
                </div>
              </div>

              <Link
                to="/staff/work"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All ({myTasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-navy-800 hover:border-blue-300 dark:hover:border-navy-700 bg-slate-50/50 dark:bg-navy-800/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Due: {task.deadlineDate}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {task.description}
                    </p>
                  </div>

                  <Link
                    to="/staff/work"
                    className="self-end sm:self-auto px-3.5 py-1.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors shrink-0"
                  >
                    Update Progress
                  </Link>
                </div>
              ))}

              {pendingTasks.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-navy-800/40 rounded-2xl">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No pending tasks!
                  </p>
                  <p className="text-[11px] mt-0.5">You have completed all assigned work items.</p>
                </div>
              )}
            </div>
          </div>

          {/* Company Notices */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Important Company Notices
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Announcements from Manshi Group administration
                  </p>
                </div>
              </div>

              <Link
                to="/staff/notices"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Notice Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {myNotices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-800/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      {notice.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{notice.publishDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {notice.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notice.content}
                  </p>
                </div>
              ))}
              {myNotices.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-navy-800/40 rounded-2xl">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No new notices
                  </p>
                  <p className="text-[11px] mt-0.5">There are no company circulars or policy updates.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Upcoming Holidays & Office Events */}
        <div className="space-y-6">
          {/* Upcoming Holidays */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Upcoming Holidays
                </h3>
              </div>
              <Link
                to="/staff/holidays-events"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                All
              </Link>
            </div>

            <div className="space-y-2.5">
              {holidays.slice(0, 4).map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-purple-950 dark:text-purple-200">
                      {h.name}
                    </div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                      {h.startDate}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                    {h.type}
                  </span>
                </div>
              ))}
              {holidays.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No upcoming holidays.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Office Events & Meets
                </h3>
              </div>
              <Link
                to="/staff/holidays-events"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                All
              </Link>
            </div>

            <div className="space-y-2.5">
              {events.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/50 border border-slate-200/80 dark:border-navy-700/80"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {ev.date} · {ev.startTime}
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1 truncate">
                    Venue: {ev.venue}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No office events scheduled.
                </div>
              )}
            </div>
          </div>

          {/* Office Geofence Information Card */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-400 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Official Office Location</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {settings.officeLocation} · Geofence radius:{' '}
              {settings.officeGeofence?.radiusMeters || 300} meters. Attendance recorded outside the
              radius will be flagged for administrative review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
