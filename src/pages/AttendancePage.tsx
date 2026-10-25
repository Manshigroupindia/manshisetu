import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MapPin,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttendanceRecord, Staff, AttendanceStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { getDaysInMonthArray, isSunday } from '../utils/salaryCalculator';
import { formatDistance, getGoogleMapsUrl, getGoogleMapsEmbedUrl } from '../utils/geoUtils';
import { getTodayDateString, getCurrentMonthString } from '../utils/dateUtils';
import { EmptyState } from '../components/common/EmptyState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const AttendancePage: React.FC = () => {
  const { staff, attendance, holidays, upsertAttendance, settings } = useApp();

  // Selected Month & Year (Dynamic local time)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'gps'>('cards');

  // GPS Attendance Session Inspection Modal
  const [selectedSessionRecord, setSelectedSessionRecord] = useState<AttendanceRecord | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Individual Staff Attendance Panel / Modal
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Edit / Add Attendance Record Modal
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [editTargetDate, setEditTargetDate] = useState(getTodayDateString());
  const [editTargetStaffId, setEditTargetStaffId] = useState('');
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editWorkingHours, setEditWorkingHours] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Dynamic Reference "Today"
  const todayStr = getTodayDateString();

  // Days in selected month
  const monthDays = useMemo(() => getDaysInMonthArray(selectedMonth), [selectedMonth]);

  // Holiday map for selected month
  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();
    holidays.forEach((h) => {
      monthDays.forEach((d) => {
        if (d >= h.startDate && d <= h.endDate) {
          map.set(d, h.name);
        }
      });
    });
    return map;
  }, [holidays, monthDays]);

  // Records for selected month
  const monthRecords = useMemo(() => {
    return attendance.filter((r) => r.date.startsWith(selectedMonth));
  }, [attendance, selectedMonth]);

  // Top Metrics
  const todayRecords = attendance.filter((r) => r.date === todayStr);
  const presentTodayCount = todayRecords.filter((r) => r.status === 'present').length;
  const absentTodayCount = todayRecords.filter((r) => r.status === 'absent').length;
  const onLeaveTodayCount = todayRecords.filter(
    (r) => r.status === 'paid_leave' || r.status === 'unpaid_leave'
  ).length;

  const totalMonthlyHours = monthRecords.reduce(
    (acc, r) => acc + (r.workingHours || 0),
    0
  );

  // Total working days recorded up to today (excluding Sundays and holidays)
  const recordedWorkingDays = monthDays.filter(
    (d) => d <= todayStr && !isSunday(d) && !holidayMap.has(d)
  ).length;

  const totalPossibleStaffDays = staff.length * Math.max(1, recordedWorkingDays);
  const totalPresentRecords = monthRecords.filter(
    (r) => r.status === 'present' && !isSunday(r.date) && !holidayMap.has(r.date)
  ).length;

  const overallAttendancePercentage =
    totalPossibleStaffDays > 0 && totalPresentRecords > 0
      ? Math.min(100, Math.round((totalPresentRecords / totalPossibleStaffDays) * 100))
      : 0;

  // Chart Data: Day by Day Attendance (for first 21 days)
  const chartDays = monthDays.filter((d) => d <= todayStr);
  const chartData = chartDays.map((d) => {
    const isSun = isSunday(d);
    const isHol = holidayMap.has(d);
    if (isSun || isHol) {
      return {
        date: d.slice(8), // '01', '02', etc.
        Present: 0,
        Absent: 0,
        Off: staff.length,
      };
    }
    const dayRecords = attendance.filter((r) => r.date === d);
    const present = dayRecords.filter((r) => r.status === 'present').length;
    const absent = dayRecords.filter(
      (r) => r.status === 'absent' || r.status === 'unpaid_leave'
    ).length;
    return {
      date: d.slice(8),
      Present: present,
      Absent: absent,
      Off: 0,
    };
  });

  // Calculate detailed attendance statistics for a single staff member
  const getStaffMonthStats = (sId: string) => {
    const staffRecords = monthRecords.filter((r) => r.staffId === sId);
    const recordMap = new Map<string, AttendanceRecord>();
    staffRecords.forEach((r) => recordMap.set(r.date, r));

    let present = 0;
    let halfDays = 0;
    let paidLeave = 0;
    let unpaidLeave = 0;
    let absent = 0;
    let sundays = 0;
    let holidaysCount = 0;
    let totalHours = 0;

    monthDays.forEach((d) => {
      const isSun = isSunday(d);
      const isHol = holidayMap.has(d);
      const rec = recordMap.get(d);

      if (isSun) {
        sundays++;
        return;
      }
      if (isHol) {
        holidaysCount++;
        return;
      }
      if (rec) {
        if (rec.status === 'present') {
          present++;
          totalHours += rec.workingHours || 0;
        } else if (rec.status === 'half_day') {
          halfDays++;
          totalHours += rec.workingHours || 0;
        } else if (rec.status === 'paid_leave') {
          paidLeave++;
        } else if (rec.status === 'unpaid_leave') {
          unpaidLeave++;
        } else if (rec.status === 'absent') {
          absent++;
        }
      }
    });

    const scheduledWorkingDaysPast = monthDays.filter(
      (d) => d <= todayStr && !isSunday(d) && !holidayMap.has(d)
    ).length;

    const effectiveDays = present + halfDays * 0.5 + paidLeave;
    const percentage =
      scheduledWorkingDaysPast > 0 && effectiveDays > 0
        ? Math.min(
            100,
            Math.round((effectiveDays / scheduledWorkingDaysPast) * 100)
          )
        : 0;

    return {
      present,
      halfDays,
      paidLeave,
      unpaidLeave,
      absent,
      sundays,
      holidaysCount,
      totalHours: Math.round(totalHours * 10) / 10,
      percentage,
      recordMap,
    };
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter(
      (s) =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  // Handle open Edit Record for a specific date & staff
  const handleOpenEditRecord = (staffId: string, dateStr: string) => {
    const existing = attendance.find(
      (r) => r.staffId === staffId && r.date === dateStr
    );
    setEditTargetStaffId(staffId);
    setEditTargetDate(dateStr);
    if (existing) {
      setEditStatus(existing.status);
      setEditCheckIn(existing.checkIn || '');
      setEditCheckOut(existing.checkOut || '');
      setEditWorkingHours(existing.workingHours !== undefined ? existing.workingHours.toString() : '');
      setEditNotes(existing.notes || '');
    } else {
      setEditStatus('present');
      setEditCheckIn('');
      setEditCheckOut('');
      setEditWorkingHours('');
      setEditNotes('');
    }
    setIsEditRecordModalOpen(true);
  };

  // Submit edit record
  const handleSaveAttendanceRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRecord: AttendanceRecord = {
      id: `att-${editTargetStaffId}-${editTargetDate}`,
      staffId: editTargetStaffId,
      date: editTargetDate,
      status: editStatus,
      checkIn: editStatus === 'present' || editStatus === 'half_day' ? (editCheckIn.trim() || undefined) : undefined,
      checkOut: editStatus === 'present' || editStatus === 'half_day' ? (editCheckOut.trim() || undefined) : undefined,
      workingHours:
        editStatus === 'present' || editStatus === 'half_day'
          ? (editWorkingHours ? parseFloat(editWorkingHours) || 0 : undefined)
          : undefined,
      notes: editNotes.trim() || undefined,
    };

    upsertAttendance(updatedRecord);
    setIsEditRecordModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Attendance Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Register
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric logs, individual employee punch records, and monthly audit calendars.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
          />

          <div className="bg-slate-200/80 dark:bg-navy-800 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Employee Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Register Table
            </button>
            <button
              onClick={() => setViewMode('gps')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'gps'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>GPS Location Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Staff</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {staff.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Enrolled employees</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Present Today</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {presentTodayCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Checked in</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Absent Today</div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {absentTodayCount}
          </div>
          <div className="text-[11px] text-rose-500 font-semibold mt-0.5">Unexcused absence</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">On Leave</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {onLeaveTodayCount}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Approved leaves</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Hours</div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {Math.round(totalMonthlyHours)}h
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Logged this month</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Monthly Rate</div>
          <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {overallAttendancePercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Company-wide avg</div>
        </div>
      </div>

      {/* Visual Chart: Daily Attendance Timeline */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Attendance Trend ({selectedMonth})
            </h2>
            <p className="text-xs text-slate-400">
              Staff present vs absent breakdown across recorded days of the month
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Present
            </div>
            <div className="flex items-center gap-1.5 text-rose-600">
              <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" /> Absent / Unpaid
            </div>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, ID (e.g. MGS-101), or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredStaff.length} employees for {selectedMonth}
        </div>
      </div>

      {/* VIEW 1: Individual Staff Attendance Cards (Styled like Professional Employee ID Badges) */}
      {viewMode === 'cards' && (
        filteredStaff.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-8 border border-slate-200 dark:border-navy-800 shadow-xs">
            <EmptyState
              icon={Users}
              title="No Employees Found"
              description="No staff members are registered or match your search filter."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStaff.map((employee) => {
            const stats = getStaffMonthStats(employee.id);
            return (
              <div
                key={employee.id}
                onClick={() => {
                  setSelectedStaff(employee);
                  setIsStaffModalOpen(true);
                }}
                className="group cursor-pointer bg-white dark:bg-navy-900 rounded-3xl p-5 border border-slate-200 dark:border-navy-800 shadow-xs hover:shadow-xl hover:border-brand-500/50 transition-all duration-200 text-left relative overflow-hidden flex flex-col justify-between"
              >
                {/* Top Accent Strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-500 to-navy-900" />

                <div>
                  {/* Employee ID Badge Header */}
                  <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 overflow-hidden border border-slate-200 dark:border-navy-700 shrink-0">
                        {employee.avatarUrl ? (
                          <img
                            src={employee.avatarUrl}
                            alt={employee.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300">
                            {employee.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">
                          {employee.fullName}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                          {employee.designation}
                        </div>
                        <div className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-bold">
                          {employee.employeeId}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Performance Pill */}
                  <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/50 border border-slate-200/60 dark:border-navy-800/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-500">Attendance Rate</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {stats.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          stats.percentage >= 90
                            ? 'bg-emerald-500'
                            : stats.percentage >= 75
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Counts Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                      <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        Present
                      </div>
                      <div className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">
                        {stats.present}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                      <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                        Absent
                      </div>
                      <div className="text-base font-extrabold text-rose-800 dark:text-rose-300">
                        {stats.absent}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                      <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                        Leave
                      </div>
                      <div className="text-base font-extrabold text-amber-800 dark:text-amber-300">
                        {stats.paidLeave + stats.unpaidLeave}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] font-bold text-brand-600 dark:text-brand-400">
                  <span>View Monthly Calendar</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* VIEW 2: Attendance Register Summary Table */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5 text-center">Present Days</th>
                  <th className="px-5 py-3.5 text-center">Half Days</th>
                  <th className="px-5 py-3.5 text-center">Paid Leaves</th>
                  <th className="px-5 py-3.5 text-center">Unpaid Leaves</th>
                  <th className="px-5 py-3.5 text-center">Absent Days</th>
                  <th className="px-5 py-3.5 text-center">Working Hours</th>
                  <th className="px-5 py-3.5 text-center">Rate %</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center">
                      <EmptyState
                        icon={Users}
                        title="No Employees Found"
                        description="No staff members are registered or match your search filter."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((employee) => {
                  const stats = getStaffMonthStats(employee.id);
                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-navy-800/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center font-bold text-xs">
                            {employee.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {employee.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {employee.employeeId} • {employee.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center font-bold text-emerald-600">
                        {stats.present}
                      </td>

                      <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-300">
                        {stats.halfDays}
                      </td>

                      <td className="px-5 py-3.5 text-center text-amber-600 font-semibold">
                        {stats.paidLeave}
                      </td>

                      <td className="px-5 py-3.5 text-center text-rose-600 font-semibold">
                        {stats.unpaidLeave}
                      </td>

                      <td className="px-5 py-3.5 text-center text-rose-600 font-bold">
                        {stats.absent}
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono text-slate-700 dark:text-slate-300">
                        {stats.totalHours}h
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            stats.percentage >= 90
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          }`}
                        >
                          {stats.percentage}%
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedStaff(employee);
                            setIsStaffModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 dark:bg-navy-800 dark:hover:bg-navy-700 font-bold text-[11px] transition-colors"
                        >
                          View Calendar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: GPS Geofence Location Audit View */}
      {viewMode === 'gps' && (
        <div className="space-y-6">
          {/* Geofence Configuration Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 rounded-3xl border border-blue-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-base">Office Geofence Anchor & Radius</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    settings.officeGeofence?.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-500/20 text-slate-300'
                  }`}
                >
                  {settings.officeGeofence?.enabled ? 'Active Audit' : 'Audit Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Coordinates: {settings.officeGeofence?.latitude || 28.6289}° N,{' '}
                {settings.officeGeofence?.longitude || 77.2219}° E · Radius:{' '}
                {settings.officeGeofence?.radiusMeters || 300} meters ({settings.officeLocation})
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto text-xs">
              <a
                href={getGoogleMapsUrl(
                  settings.officeGeofence?.latitude || 28.6289,
                  settings.officeGeofence?.longitude || 77.2219
                )}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>View Office in Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* GPS Attendance Sessions Table */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Staff GPS Duty Sessions ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time browser-captured check-in and check-out coordinates with accuracy and Haversine distance
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Date & Status</th>
                    <th className="px-5 py-3.5">Check-In GPS Event</th>
                    <th className="px-5 py-3.5">Check-Out GPS Event</th>
                    <th className="px-5 py-3.5 text-center">Duration</th>
                    <th className="px-5 py-3.5 text-center">Geofence Audit</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {monthRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <EmptyState
                          icon={Navigation}
                          title="No GPS Attendance Sessions"
                          description={`No GPS check-in or check-out sessions recorded for ${selectedMonth}. Real employee punch logs will dynamically appear here.`}
                        />
                      </td>
                    </tr>
                  ) : (
                    monthRecords.map((rec) => {
                    const emp = staff.find((s) => s.id === rec.staffId || s.employeeId === rec.staffId);
                    const checkInLoc = rec.checkInLocation;
                    const checkOutLoc = rec.checkOutLocation;
                    const checkInDist = rec.checkInDistanceMeters;
                    const checkOutDist = rec.checkOutDistanceMeters;

                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors"
                      >
                        {/* Employee */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {emp?.fullName || 'Staff Member'}
                          </div>
                          <div className="text-[11px] text-brand-600 dark:text-brand-400 font-mono font-semibold">
                            {emp?.employeeId || rec.staffId}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {emp?.designation}
                          </div>
                        </td>

                        {/* Date & Duty Status */}
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {rec.date}
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mt-1 ${
                              rec.dutyStatus === 'duty_on'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : rec.dutyStatus === 'duty_completed'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400'
                            }`}
                          >
                            {rec.dutyStatus === 'duty_on'
                              ? 'Duty On'
                              : rec.dutyStatus === 'duty_completed'
                              ? 'Completed'
                              : 'Duty Off'}
                          </span>
                        </td>

                        {/* Check-In Location */}
                        <td className="px-5 py-4">
                          {checkInLoc ? (
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {rec.checkIn || '—'}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {checkInLoc.latitude.toFixed(5)}, {checkInLoc.longitude.toFixed(5)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Accuracy: ±{Math.round(checkInLoc.accuracy)}m ·{' '}
                                {checkInDist !== undefined && (
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {formatDistance(checkInDist)}
                                  </span>
                                )}
                              </div>
                              <a
                                href={checkInLoc.mapsUrl || getGoogleMapsUrl(checkInLoc.latitude, checkInLoc.longitude)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                              >
                                <span>View Check-in Location</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              Location unavailable
                            </span>
                          )}
                        </td>

                        {/* Check-Out Location */}
                        <td className="px-5 py-4">
                          {checkOutLoc ? (
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {rec.checkOut || (rec.dutyStatus === 'duty_on' ? 'In Progress' : '—')}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {checkOutLoc.latitude.toFixed(5)}, {checkOutLoc.longitude.toFixed(5)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Accuracy: ±{Math.round(checkOutLoc.accuracy)}m ·{' '}
                                {checkOutDist !== undefined && (
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {formatDistance(checkOutDist)}
                                  </span>
                                )}
                              </div>
                              <a
                                href={checkOutLoc.mapsUrl || getGoogleMapsUrl(checkOutLoc.latitude, checkOutLoc.longitude)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                              >
                                <span>View Check-out Location</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              {rec.dutyStatus === 'duty_on'
                                ? 'Duty in progress'
                                : 'Not recorded'}
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-5 py-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          {rec.sessionDurationText || (rec.workingHours ? `${rec.workingHours}h` : '—')}
                        </td>

                        {/* Geofence Status */}
                        <td className="px-5 py-4 text-center">
                          {rec.checkInVerification === 'within_geofence' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Within Radius
                            </span>
                          ) : rec.checkInVerification === 'outside_geofence' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Outside Radius
                            </span>
                          ) : rec.checkInVerification === 'needs_review' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              Needs Review
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-400">
                              No GPS Fix
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSessionRecord(rec);
                              setIsSessionModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition-colors"
                          >
                            Inspect Session
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL STAFF ATTENDANCE DETAIL MODAL */}
      {selectedStaff && (
        <Modal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          title={`Attendance Register: ${selectedStaff.fullName}`}
          subtitle={`${selectedStaff.employeeId} · ${selectedStaff.designation} (${selectedStaff.department})`}
          maxWidth="5xl"
        >
          {(() => {
            const stats = getStaffMonthStats(selectedStaff.id);
            return (
              <div className="space-y-6">
                {/* Employee Info Header & Monthly Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="bg-slate-50 dark:bg-navy-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-navy-800 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Present
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                      {stats.present}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-navy-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-navy-800 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Absent
                    </div>
                    <div className="text-xl font-extrabold text-rose-600 mt-0.5">
                      {stats.absent}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-navy-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-navy-800 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Sundays
                    </div>
                    <div className="text-xl font-extrabold text-blue-600 mt-0.5">
                      {stats.sundays}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-navy-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-navy-800 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Holidays
                    </div>
                    <div className="text-xl font-extrabold text-purple-600 mt-0.5">
                      {stats.holidaysCount}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-navy-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-navy-800 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Paid Leave
                    </div>
                    <div className="text-xl font-extrabold text-amber-600 mt-0.5">
                      {stats.paidLeave}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-navy-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-navy-800 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Total Hours
                    </div>
                    <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                      {stats.totalHours}h
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-navy-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-navy-800 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Attendance %
                    </div>
                    <div className="text-xl font-extrabold text-brand-600 mt-0.5">
                      {stats.percentage}%
                    </div>
                  </div>
                </div>

                {/* Calendar Legend Bar (Fulfills strict prompt color requirement) */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Calendar Color Legend:
                  </span>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                      Green: Present
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                      Red: Absent
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                      Blue: Sunday / Weekly Off
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                      Purple: Company Holiday
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                      Yellow: Paid Leave
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
                      Grey: Future / Unrecorded
                    </span>
                  </div>
                </div>

                {/* Monthly Calendar Grid */}
                <div className="border border-slate-200 dark:border-navy-800 rounded-3xl overflow-hidden bg-white dark:bg-navy-900 shadow-2xs">
                  <div className="grid grid-cols-7 text-center font-bold text-xs uppercase bg-slate-50 dark:bg-navy-950/60 py-2.5 border-b border-slate-200 dark:border-navy-800 text-slate-500">
                    <div className="text-blue-600">Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* Calendar Dates Grid */}
                  <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-navy-800">
                    {/* Padding cells for start of month */}
                    {(() => {
                      const firstDate = new Date(`${selectedMonth}-01`);
                      const startDay = firstDate.getDay(); // 0 is Sunday
                      const blanks = [];
                      for (let i = 0; i < startDay; i++) {
                        blanks.push(
                          <div
                            key={`blank-${i}`}
                            className="bg-slate-50/50 dark:bg-navy-950/30 min-h-[90px] p-2"
                          />
                        );
                      }
                      return blanks;
                    })()}

                    {/* Month Dates */}
                    {monthDays.map((dateStr) => {
                      const isSun = isSunday(dateStr);
                      const isHol = holidayMap.has(dateStr);
                      const holidayName = holidayMap.get(dateStr);
                      const record = stats.recordMap.get(dateStr);
                      const dayNumber = parseInt(dateStr.slice(8), 10);
                      const isFuture = dateStr > todayStr;
                      const isToday = dateStr === todayStr;

                      // Determine card style based on prompt specs
                      let cellColor =
                        'bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800/80';
                      let statusPill = null;

                      if (isSun) {
                        cellColor =
                          'bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-blue-200/50';
                        statusPill = (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                            Weekly Off
                          </span>
                        );
                      } else if (isHol) {
                        cellColor =
                          'bg-purple-50/60 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 border-purple-200/50';
                        statusPill = (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 truncate max-w-[80px]"
                            title={holidayName}
                          >
                            {holidayName}
                          </span>
                        );
                      } else if (record) {
                        if (record.status === 'present') {
                          cellColor =
                            'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 border-emerald-200/50';
                          statusPill = (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                              Present ({record.workingHours || 9}h)
                            </span>
                          );
                        } else if (record.status === 'half_day') {
                          cellColor =
                            'bg-sky-50/50 dark:bg-sky-950/20 text-sky-950 dark:text-sky-200 border-sky-200/50';
                          statusPill = (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
                              Half Day (4.5h)
                            </span>
                          );
                        } else if (record.status === 'paid_leave') {
                          cellColor =
                            'bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 border-amber-200/50';
                          statusPill = (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                              Paid Leave
                            </span>
                          );
                        } else if (record.status === 'unpaid_leave') {
                          cellColor =
                            'bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 border-rose-200/50';
                          statusPill = (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                              Unpaid Leave
                            </span>
                          );
                        } else if (record.status === 'absent') {
                          cellColor =
                            'bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 border-rose-200/50';
                          statusPill = (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                              Absent
                            </span>
                          );
                        }
                      } else if (isFuture) {
                        cellColor =
                          'bg-slate-50/80 dark:bg-navy-950/40 text-slate-400';
                        statusPill = (
                          <span className="text-[10px] text-slate-400 italic">
                            Upcoming
                          </span>
                        );
                      } else {
                        // Past date unrecorded
                        cellColor =
                          'bg-slate-100/60 dark:bg-navy-950/70 text-slate-500';
                        statusPill = (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Unrecorded
                          </span>
                        );
                      }

                      return (
                        <div
                          key={dateStr}
                          onClick={() => handleOpenEditRecord(selectedStaff.id, dateStr)}
                          className={`min-h-[85px] p-2 transition-all cursor-pointer relative flex flex-col justify-between ${cellColor} ${
                            isToday ? 'ring-2 ring-brand-500 z-10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-extrabold ${
                                isToday
                                  ? 'bg-brand-600 text-white w-5 h-5 rounded-full flex items-center justify-center'
                                  : ''
                              }`}
                            >
                              {dayNumber}
                            </span>
                            <Edit3 className="w-3 h-3 text-slate-300 opacity-0 hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="my-1">{statusPill}</div>

                          {record?.checkIn && (
                            <div className="text-[9px] font-mono text-slate-500 truncate">
                              In: {record.checkIn}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Notes & Close */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-navy-800 text-xs">
                  <span className="text-slate-400">
                    Click any day in the calendar to modify or add attendance records.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-brand-600 text-xs font-bold"
                  >
                    Close Register
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ADD / EDIT ATTENDANCE RECORD MODAL */}
      <Modal
        isOpen={isEditRecordModalOpen}
        onClose={() => setIsEditRecordModalOpen(false)}
        title="Mark / Edit Attendance Record"
        subtitle={`Editing for date: ${editTargetDate}`}
      >
        <form onSubmit={handleSaveAttendanceRecord} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Attendance Status *
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
            >
              <option value="present">Present (Full Working Day)</option>
              <option value="half_day">Half Day (4.5 Working Hours)</option>
              <option value="paid_leave">Approved Paid Leave (1/month policy)</option>
              <option value="unpaid_leave">Approved Unpaid Absence (Deductible)</option>
              <option value="absent">Unexcused Absent (Deductible)</option>
              <option value="sunday">Sunday / Weekly Off</option>
              <option value="holiday">Official Company Holiday</option>
            </select>
          </div>

          {(editStatus === 'present' || editStatus === 'half_day') && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Check-In Time
                </label>
                <input
                  type="text"
                  placeholder="09:30 AM"
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Check-Out Time
                </label>
                <input
                  type="text"
                  placeholder="06:30 PM"
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Hours Logged
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={editWorkingHours}
                  onChange={(e) => setEditWorkingHours(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Admin Notes / Verification Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Biometric punch override approved by HR"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsEditRecordModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>

      {/* GPS ATTENDANCE SESSION AUDIT MODAL */}
      {selectedSessionRecord && (
        <Modal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          title="GPS Attendance Session Inspection & Audit"
          subtitle={`Session ID: ${selectedSessionRecord.sessionId || selectedSessionRecord.id} · Date: ${selectedSessionRecord.date}`}
          maxWidth="4xl"
        >
          {(() => {
            const emp = staff.find((s) => s.id === selectedSessionRecord.staffId || s.employeeId === selectedSessionRecord.staffId);
            const checkIn = selectedSessionRecord.checkInLocation;
            const checkOut = selectedSessionRecord.checkOutLocation;
            const checkInDist = selectedSessionRecord.checkInDistanceMeters;
            const checkOutDist = selectedSessionRecord.checkOutDistanceMeters;

            return (
              <div className="space-y-6 text-xs">
                {/* Employee Info Header */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center">
                      {emp?.fullName.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {emp?.fullName || 'Staff Member'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {emp?.employeeId} · {emp?.designation} ({emp?.department})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Duty Status
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-0.5 ${
                        selectedSessionRecord.dutyStatus === 'duty_on'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedSessionRecord.dutyStatus === 'duty_completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedSessionRecord.dutyStatus === 'duty_on'
                        ? 'Active on Duty'
                        : selectedSessionRecord.dutyStatus === 'duty_completed'
                        ? 'Duty Completed'
                        : 'Duty Off'}
                    </span>
                  </div>
                </div>

                {/* Independent Location Comparison: Check-In vs Check-Out */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Check-In Location Card */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-navy-800">
                      <span className="font-extrabold text-sm text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Check-In Location Details</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedSessionRecord.checkIn || '—'}
                      </span>
                    </div>

                    {checkIn ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/60">
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">
                              Latitude
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {checkIn.latitude.toFixed(6)}° N
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/60">
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">
                              Longitude
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {checkIn.longitude.toFixed(6)}° E
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Recorded Timestamp (IST):</span>
                            <span className="font-mono">{checkIn.displayTime || checkIn.timestamp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">GPS Accuracy:</span>
                            <span className="font-bold">±{Math.round(checkIn.accuracy)} meters</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Distance from Office:</span>
                            <span className="font-bold text-brand-600">
                              {checkInDist !== undefined ? formatDistance(checkInDist) : 'Calculated'}
                            </span>
                          </div>
                        </div>

                        {/* Audit Verification Pill */}
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                            Geofence Verification
                          </span>
                          {selectedSessionRecord.checkInVerification === 'within_geofence' ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                              Within Configured Radius
                            </span>
                          ) : selectedSessionRecord.checkInVerification === 'outside_geofence' ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300">
                              Outside Configured Radius
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300">
                              Needs Review (Poor Accuracy)
                            </span>
                          )}
                        </div>

                        {/* Button Labelled "View Check-in Location" */}
                        <div className="pt-2">
                          <a
                            href={
                              checkIn.mapsUrl ||
                              getGoogleMapsUrl(checkIn.latitude, checkIn.longitude)
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>View Check-in Location</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Interactive Google Map Preview */}
                          <div className="pt-2">
                            <iframe
                              title="Admin Check-In Map Preview"
                              src={getGoogleMapsEmbedUrl(checkIn.latitude, checkIn.longitude)}
                              className="w-full h-36 rounded-xl border border-slate-200 dark:border-navy-700 shadow-xs"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 italic">
                        Check-in location coordinates not available.
                      </div>
                    )}
                  </div>

                  {/* Check-Out Location Card */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-navy-800">
                      <span className="font-extrabold text-sm text-rose-600 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>Check-Out Location Details</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedSessionRecord.checkOut || 'In Progress'}
                      </span>
                    </div>

                    {checkOut ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/60">
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">
                              Latitude
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {checkOut.latitude.toFixed(6)}° N
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/60">
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">
                              Longitude
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {checkOut.longitude.toFixed(6)}° E
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Recorded Timestamp (IST):</span>
                            <span className="font-mono">{checkOut.displayTime || checkOut.timestamp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">GPS Accuracy:</span>
                            <span className="font-bold">±{Math.round(checkOut.accuracy)} meters</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Distance from Office:</span>
                            <span className="font-bold text-brand-600">
                              {checkOutDist !== undefined ? formatDistance(checkOutDist) : 'Calculated'}
                            </span>
                          </div>
                        </div>

                        {/* Audit Verification Pill */}
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                            Geofence Verification
                          </span>
                          {selectedSessionRecord.checkOutVerification === 'within_geofence' ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                              Within Configured Radius
                            </span>
                          ) : selectedSessionRecord.checkOutVerification === 'outside_geofence' ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300">
                              Outside Configured Radius
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300">
                              Needs Review (Poor Accuracy)
                            </span>
                          )}
                        </div>

                        {/* Button Labelled "View Check-out Location" */}
                        <div className="pt-2">
                          <a
                            href={
                              checkOut.mapsUrl ||
                              getGoogleMapsUrl(checkOut.latitude, checkOut.longitude)
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>View Check-out Location</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Interactive Google Map Preview */}
                          <div className="pt-2">
                            <iframe
                              title="Admin Check-Out Map Preview"
                              src={getGoogleMapsEmbedUrl(checkOut.latitude, checkOut.longitude)}
                              className="w-full h-36 rounded-xl border border-slate-200 dark:border-navy-700 shadow-xs"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 italic">
                        {selectedSessionRecord.dutyStatus === 'duty_on'
                          ? 'Duty is actively in progress. Check-out location will be captured at Duty Off.'
                          : 'Check-out location coordinates not recorded.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Recorded Duration Banner */}
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 block">
                      Total Recorded Shift Duration
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {selectedSessionRecord.sessionDurationText ||
                        `${selectedSessionRecord.workingHours || 9} Hours`}
                    </span>
                  </div>

                  <div className="text-right text-[11px] text-slate-500">
                    <div>Accuracy Decision Protocol</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      Advisory Review Standard
                    </div>
                  </div>
                </div>

                {/* Advisory Notice */}
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Administrative Policy:</strong> Do not automatically label an employee as dishonest or absent just because they checked in outside the office radius. The office geofence is initially advisory to accommodate outdoor fieldwork, client visits, and GPS satellite reflection.
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsSessionModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-brand-600 text-xs font-bold"
                  >
                    Close Session Audit
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
