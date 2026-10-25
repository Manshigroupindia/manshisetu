import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  CalendarCheck,
  Receipt,
  CircleDollarSign,
  BellRing,
  CalendarDays,
  FolderGit2,
  User,
  LogOut,
  Building2,
  X,
  ChevronRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';
import { getCanonicalEmployeeId } from '../../utils/firestoreUtils';

interface StaffSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { currentStaff, work, expenses, notices, logout, attendance } = useApp();
  const navigate = useNavigate();

  // Employee-specific badge counts
  const myCanonicalId = getCanonicalEmployeeId(currentStaff?.employeeId, currentStaff?.id);
  const myEmployeeId = currentStaff?.employeeId;

  const isMyStaffId = (staffId?: string) =>
    (myCanonicalId && getCanonicalEmployeeId(staffId) === myCanonicalId) ||
    staffId === currentStaff?.id ||
    staffId === currentStaff?.employeeId;

  const myPendingTasksCount = work.filter(
    (w) =>
      isMyStaffId(w.staffId) &&
      (w.status === 'pending' || w.status === 'in_progress' || w.status === 'overdue')
  ).length;

  const myPendingExpensesCount = expenses.filter(
    (e) => isMyStaffId(e.staffId) && e.approvalStatus === 'pending'
  ).length;

  const myPublishedNoticesCount = notices.filter(
    (n) =>
      n.status === 'published' &&
      (n.targetAudience === 'all' ||
        (n.targetAudience === 'specific' &&
          (n.targetStaffIds?.includes(myEmployeeId || '') ||
            (myCanonicalId && n.targetStaffIds?.some((id) => getCanonicalEmployeeId(id) === myCanonicalId)))))
  ).length;

  // Today's attendance duty status
  const todayStr = getTodayDateString();
  const todayAtt = attendance.find(
    (a) => isMyStaffId(a.staffId) && a.date === todayStr
  );
  const dutyStatus = todayAtt?.dutyStatus || 'duty_off';

  const navItems = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    {
      name: 'My Tasks',
      path: '/staff/work',
      icon: Briefcase,
      badge: myPendingTasksCount > 0 ? myPendingTasksCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      name: 'Attendance & GPS',
      path: '/staff/attendance',
      icon: CalendarCheck,
      badge: dutyStatus === 'duty_on' ? 'ON' : undefined,
      badgeColor: 'bg-emerald-500',
    },
    {
      name: 'My Expenses',
      path: '/staff/expenses',
      icon: Receipt,
      badge: myPendingExpensesCount > 0 ? myPendingExpensesCount : undefined,
      badgeColor: 'bg-brand-600',
    },
    {
      name: 'My Salary',
      path: '/staff/salary',
      icon: CircleDollarSign,
    },
    {
      name: 'Notice Board',
      path: '/staff/notices',
      icon: BellRing,
      badge: myPublishedNoticesCount > 0 ? myPublishedNoticesCount : undefined,
      badgeColor: 'bg-blue-600',
    },
    { name: 'Holidays & Events', path: '/staff/holidays-events', icon: CalendarDays },
    { name: 'Company Resources', path: '/staff/resources', icon: FolderGit2 },
    { name: 'My Profile', path: '/staff/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Manshi Group
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                Staff
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 truncate max-w-[150px]">
              Employee Self-Service
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Staff Quick Profile Pill */}
      {currentStaff && (
        <div className="mx-3.5 my-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 to-slate-50 dark:from-blue-950/30 dark:to-navy-800/50 border border-blue-100 dark:border-navy-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
            {currentStaff.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {currentStaff.fullName}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">
              {currentStaff.employeeId} · {currentStaff.designation}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentStaff.department}
            </div>
          </div>
        </div>
      )}

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Staff Terminal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Duty Status Quick Banner & Logout Footer */}
      <div className="p-3.5 border-t border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-navy-800/80 border border-slate-200/80 dark:border-navy-700/60 shadow-xs mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                dutyStatus === 'duty_on'
                  ? 'bg-emerald-500 animate-pulse'
                  : dutyStatus === 'duty_completed'
                  ? 'bg-blue-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {dutyStatus === 'duty_on'
                ? 'Duty Active'
                : dutyStatus === 'duty_completed'
                ? 'Duty Completed'
                : 'Duty Off'}
            </span>
          </div>
          <NavLink
            to="/staff/attendance"
            className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Attendance
          </NavLink>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200/50 dark:border-rose-900/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out to Gateway</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
