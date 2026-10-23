import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  ChevronDown,
  ExternalLink,
  Sparkles,
  MapPin,
  Clock,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DigitalClock } from '../common/DigitalClock';
import { Link, useNavigate } from 'react-router-dom';
import { getTodayDateString } from '../../utils/dateUtils';

interface StaffHeaderProps {
  onToggleMobileMenu: () => void;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({ onToggleMobileMenu }) => {
  const { darkMode, toggleDarkMode, notices, work, expenses, settings, logout, currentStaff, attendance } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const myEmployeeId = currentStaff?.employeeId;

  // Employee-targeted urgent tasks, expense reviews, notices
  const myUrgentTasks = work.filter(
    (w) => w.staffId === myEmployeeId && w.priority === 'urgent' && w.status !== 'completed'
  );
  const myPendingExpenses = expenses.filter(
    (e) => e.staffId === myEmployeeId && (e.approvalStatus === 'approved' || e.approvalStatus === 'rejected')
  );
  const myRecentNotices = notices
    .filter(
      (n) =>
        n.status === 'published' &&
        (n.targetAudience === 'all' ||
          (n.targetAudience === 'specific' && n.targetStaffIds?.includes(myEmployeeId || '')))
    )
    .slice(0, 3);

  const totalNotificationCount = myUrgentTasks.length + myPendingExpenses.length + myRecentNotices.length;

  // Today's attendance duty status
  const todayStr = getTodayDateString();
  const todayAtt = attendance.find(
    (a) => a.staffId === currentStaff?.id && a.date === todayStr
  );
  const dutyStatus = todayAtt?.dutyStatus || 'duty_off';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200 dark:border-navy-800 transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Mobile menu button & Duty Status Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            aria-label="Open staff menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <Link
              to="/staff/attendance"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                dutyStatus === 'duty_on'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : dutyStatus === 'duty_completed'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-navy-800 border-slate-300 dark:border-navy-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dutyStatus === 'duty_on'
                    ? 'bg-emerald-500 animate-ping'
                    : dutyStatus === 'duty_completed'
                    ? 'bg-blue-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {dutyStatus === 'duty_on'
                  ? 'Active on Duty'
                  : dutyStatus === 'duty_completed'
                  ? 'Duty Completed Today'
                  : 'Duty Off'}
              </span>
              <span className="sm:hidden font-mono">
                {dutyStatus === 'duty_on' ? 'DUTY ON' : dutyStatus === 'duty_completed' ? 'DONE' : 'OFF'}
              </span>
            </Link>

            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{settings.officeLocation}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Digital Clock */}
        <div className="hidden md:flex items-center">
          <DigitalClock compact />
        </div>

        {/* Right Actions: Theme Toggle, Notifications, Staff Profile */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors border border-slate-200 dark:border-navy-700/80"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              title="Notifications"
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors border border-slate-200 dark:border-navy-700/80"
            >
              <Bell className="w-4.5 h-4.5" />
              {totalNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-navy-900">
                  {totalNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-navy-800">
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    My Activity & Notices
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    {totalNotificationCount} Updates
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800/80">
                  {myUrgentTasks.map((t) => (
                    <Link
                      key={t.id}
                      to="/staff/work"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-navy-800/60 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Urgent Task: {t.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Due by: {t.deadlineDate}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {myRecentNotices.map((n) => (
                    <Link
                      key={n.id}
                      to="/staff/notices"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-navy-800/60 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {n.category} · Published {n.publishDate}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {totalNotificationCount === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No pending urgent notifications.
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-navy-800 text-center">
                  <Link
                    to="/staff/notices"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    View All Company Notices
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Staff Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1 sm:pl-2.5 sm:pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors border border-slate-200/80 dark:border-navy-700/80"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                {getInitials(currentStaff?.fullName)}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {currentStaff?.fullName || 'Staff Member'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium font-mono">
                  {currentStaff?.employeeId || '—'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-navy-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {currentStaff?.fullName}
                  </div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                    {currentStaff?.employeeId} · {currentStaff?.designation}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentStaff?.officialEmail}
                  </div>
                </div>

                <Link
                  to="/staff/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Profile & Documents
                </Link>

                <Link
                  to="/staff/attendance"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  Duty On / Off Attendance
                </Link>

                <Link
                  to="/staff/work"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                >
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  My Assigned Tasks
                </Link>

                <div className="my-1 border-t border-slate-100 dark:border-navy-800" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out to Gateway
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
