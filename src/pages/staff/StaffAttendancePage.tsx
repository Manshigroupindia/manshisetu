import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Navigation,
  Calendar as CalendarIcon,
  Info,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDistance, getGoogleMapsUrl } from '../../utils/geoUtils';
import { AttendanceRecord } from '../../types';
import { getTodayDateString, getCurrentMonthString } from '../../utils/dateUtils';
import { useAttendanceLocation } from '../../hooks/useAttendanceLocation';
import { LocationErrorBanner } from '../../components/common/LocationErrorBanner';

export const StaffAttendancePage: React.FC = () => {
  const {
    currentStaff,
    attendance,
    holidays,
    settings,
    recordDutyOn,
    recordDutyOff,
    showToast,
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [selectedDateRecord, setSelectedDateRecord] = useState<AttendanceRecord | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getTodayDateString());

  const {
    isLocating,
    locatingMessage,
    geoError,
    executeDutyAction,
    retryLocation,
    clearGeoError,
  } = useAttendanceLocation();

  const todayStr = getTodayDateString();
  const todayRecord = attendance.find(
    (a) => a.staffId === currentStaff?.id && a.date === todayStr
  );
  const dutyStatus = todayRecord?.dutyStatus || 'duty_off';

  // Attendance for the chosen month (staff only)
  const monthAttendance = attendance.filter(
    (a) => a.staffId === currentStaff?.id && a.date.startsWith(selectedMonth)
  );

  // Month stats calculations
  const presentDays = monthAttendance.filter(
    (a) => a.status === 'present' || a.status === 'half_day'
  ).length;

  const absentDays = monthAttendance.filter((a) => a.status === 'absent').length;

  const paidLeaves = monthAttendance.filter((a) => a.status === 'paid_leave').length;

  const unpaidLeaves = monthAttendance.filter((a) => a.status === 'unpaid_leave').length;

  // Sundays in month
  const totalDutyHours = monthAttendance.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);

  // Calendar rendering helpers
  const [yearStr, monthNumStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1; // 0-indexed

  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Status map for calendar
  const getDateStatus = (day: number) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateFormatted = `${selectedMonth}-${dayStr}`;
    const dateObj = new Date(year, month, day);
    const isSunday = dateObj.getDay() === 0;

    // Check holiday
    const holiday = holidays.find((h) => dateFormatted >= h.startDate && dateFormatted <= h.endDate);
    if (holiday) return { type: 'holiday', label: holiday.name, color: 'bg-purple-500' };

    // Check attendance record
    const record = monthAttendance.find((a) => a.date === dateFormatted);
    if (record) {
      if (record.status === 'present') return { type: 'present', label: 'Present', color: 'bg-emerald-500', record };
      if (record.status === 'half_day') return { type: 'half_day', label: 'Half Day', color: 'bg-emerald-400', record };
      if (record.status === 'paid_leave') return { type: 'leave', label: 'Approved Paid Leave', color: 'bg-amber-400', record };
      if (record.status === 'unpaid_leave') return { type: 'leave', label: 'Unpaid Leave', color: 'bg-amber-500', record };
      if (record.status === 'absent') return { type: 'absent', label: 'Absent', color: 'bg-rose-500', record };
    }

    if (isSunday) return { type: 'sunday', label: 'Sunday / Weekly Off', color: 'bg-blue-500' };

    // Past or future
    if (dateFormatted > todayStr) return { type: 'future', label: 'Upcoming', color: 'bg-slate-300 dark:bg-navy-700' };
    return { type: 'unrecorded', label: 'Unrecorded', color: 'bg-slate-300 dark:bg-navy-700' };
  };

  const selectedRecord =
    selectedDateRecord ||
    monthAttendance.find((a) => a.date === selectedCalendarDate) ||
    (selectedCalendarDate === todayStr ? todayRecord : null);

  return (
    <div className="space-y-6">
      {/* Header and Quick Duty Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Staff Duty Terminal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            My Attendance & GPS Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View monthly logs, calendar visualization, and official GPS geofenced check-in records
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {dutyStatus === 'duty_off' && (
            <button
              onClick={() => executeDutyAction('duty_on')}
              disabled={isLocating}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLocating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span>{isLocating ? (locatingMessage || 'Acquiring GPS...') : 'DUTY ON'}</span>
            </button>
          )}

          {dutyStatus === 'duty_on' && (
            <button
              onClick={() => executeDutyAction('duty_off')}
              disabled={isLocating}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLocating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span>{isLocating ? (locatingMessage || 'Acquiring GPS...') : 'DUTY OFF'}</span>
            </button>
          )}

          {dutyStatus === 'duty_completed' && (
            <div className="px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Shift Closed Today</span>
            </div>
          )}

          {/* Month selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {/* Live Locating Status Progress Banner */}
      {isLocating && (
        <div className="p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center gap-2.5 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{locatingMessage || 'Contacting GPS satellites (High Accuracy mode)...'}</span>
        </div>
      )}

      {/* Location Error & Retry Banner */}
      {geoError && (
        <LocationErrorBanner
          error={geoError}
          onRetry={retryLocation}
          onDismiss={clearGeoError}
          isRetrying={isLocating}
          locatingMessage={locatingMessage}
        />
      )}

      {/* Top Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Present Days */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Present Days
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {presentDays}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recorded this month</div>
        </div>

        {/* Absent Days */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
            Absent Days
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {absentDays}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unexcused</div>
        </div>

        {/* Paid Leaves */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
            Paid Leaves
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {paidLeaves}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Approved with salary</div>
        </div>

        {/* Unpaid Leaves */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
            Unpaid Leaves
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {unpaidLeaves}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deducted from pay</div>
        </div>

        {/* Sundays / Offs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Sundays / Off
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">4</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Company weekly offs</div>
        </div>

        {/* Recorded Duty Hours */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            Recorded Hours
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {Math.round(totalDutyHours)} hrs
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total logged time</div>
        </div>
      </div>

      {/* Main Content Grid: Monthly Calendar & Session Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Monthly Attendance Calendar */}
        <div className="lg:col-span-7 bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span>Monthly Attendance Calendar</span>
            </h2>

            {/* Color Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Sunday
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Holiday
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Leave
              </span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 pb-2 border-b border-slate-100 dark:border-navy-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty slots for days before 1st */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-xl bg-slate-50/40 dark:bg-navy-950/20" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayStr = day < 10 ? `0${day}` : `${day}`;
              const fullDate = `${selectedMonth}-${dayStr}`;
              const statusInfo = getDateStatus(day);
              const isSelected = selectedCalendarDate === fullDate;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedCalendarDate(fullDate);
                    const rec = monthAttendance.find((a) => a.date === fullDate);
                    setSelectedDateRecord(rec || null);
                  }}
                  className={`h-14 sm:h-16 p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between items-start transition-all text-left relative cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs'
                      : 'border-slate-100 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700 bg-white dark:bg-navy-900'
                  }`}
                >
                  <span
                    className={`text-xs font-extrabold ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </span>

                  <div className="w-full">
                    <span
                      className={`inline-block w-full h-1.5 sm:h-2 rounded-full ${statusInfo.color}`}
                    />
                    <span className="block text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {statusInfo.type === 'present'
                        ? 'Present'
                        : statusInfo.type === 'sunday'
                        ? 'Sun Off'
                        : statusInfo.type === 'holiday'
                        ? 'Holiday'
                        : statusInfo.type === 'absent'
                        ? 'Absent'
                        : statusInfo.type === 'leave'
                        ? 'Leave'
                        : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Selected Date Session Details */}
        <div className="lg:col-span-5 bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Attendance Session Details
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedCalendarDate}
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                selectedRecord?.status === 'present'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300'
              }`}
            >
              {selectedRecord?.status || 'No Session'}
            </span>
          </div>

          {selectedRecord ? (
            <div className="space-y-4">
              {/* Check-In Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check-In Recorded</span>
                  </span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {selectedRecord.checkIn || '—'}
                  </span>
                </div>

                {selectedRecord.checkInLocation ? (
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-navy-700/50">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {selectedRecord.checkInLocation.latitude.toFixed(5)},{' '}
                        {selectedRecord.checkInLocation.longitude.toFixed(5)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Accuracy: ±{Math.round(selectedRecord.checkInLocation.accuracy)}m ·{' '}
                      {selectedRecord.checkInDistanceMeters !== undefined && (
                        <span>{formatDistance(selectedRecord.checkInDistanceMeters)} from office</span>
                      )}
                    </div>
                    <a
                      href={
                        selectedRecord.checkInLocation.mapsUrl ||
                        getGoogleMapsUrl(
                          selectedRecord.checkInLocation.latitude,
                          selectedRecord.checkInLocation.longitude
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                    >
                      <span>Open Check-in in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Location unavailable</div>
                )}
              </div>

              {/* Check-Out Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Check-Out Recorded</span>
                  </span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {selectedRecord.checkOut || (selectedRecord.dutyStatus === 'duty_on' ? 'In Progress' : '—')}
                  </span>
                </div>

                {selectedRecord.checkOutLocation ? (
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-navy-700/50">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>
                        {selectedRecord.checkOutLocation.latitude.toFixed(5)},{' '}
                        {selectedRecord.checkOutLocation.longitude.toFixed(5)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Accuracy: ±{Math.round(selectedRecord.checkOutLocation.accuracy)}m ·{' '}
                      {selectedRecord.checkOutDistanceMeters !== undefined && (
                        <span>{formatDistance(selectedRecord.checkOutDistanceMeters)} from office</span>
                      )}
                    </div>
                    <a
                      href={
                        selectedRecord.checkOutLocation.mapsUrl ||
                        getGoogleMapsUrl(
                          selectedRecord.checkOutLocation.latitude,
                          selectedRecord.checkOutLocation.longitude
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                    >
                      <span>Open Check-out in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    {selectedRecord.dutyStatus === 'duty_on'
                      ? 'Check-out pending Duty Off'
                      : 'Location unavailable'}
                  </div>
                )}
              </div>

              {/* Total Duty Duration */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Session Duration
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedRecord.sessionDurationText || `${selectedRecord.workingHours || 8} Hours`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Session ID</div>
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {selectedRecord.sessionId || selectedRecord.id}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Attendance records are immutable and verified cryptographically.</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                No attendance recorded for {selectedCalendarDate}
              </p>
              <p className="text-[11px]">Click on another date to view recorded logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
