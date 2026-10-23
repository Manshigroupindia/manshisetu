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
  Users2,
  Settings,
  LogOut,
  Building2,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { work, expenses, salaries, logout, settings } = useApp();
  const navigate = useNavigate();

  // Badges calculation
  const pendingTasksCount = work.filter(
    (w) => w.status === 'pending' || w.status === 'overdue'
  ).length;

  const pendingExpensesCount = expenses.filter(
    (e) => e.approvalStatus === 'pending'
  ).length;

  const pendingSalariesCount = salaries.filter(
    (s) => s.paymentStatus === 'pending'
  ).length;

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    {
      name: 'Work Management',
      path: '/admin/work',
      icon: Briefcase,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
    {
      name: 'Expenses',
      path: '/admin/expenses',
      icon: Receipt,
      badge: pendingExpensesCount > 0 ? pendingExpensesCount : undefined,
      badgeColor: 'bg-brand-600',
    },
    {
      name: 'Salary Management',
      path: '/admin/salary',
      icon: CircleDollarSign,
      badge: pendingSalariesCount > 0 ? pendingSalariesCount : undefined,
      badgeColor: 'bg-blue-600',
    },
    { name: 'Notices', path: '/admin/notices', icon: BellRing },
    { name: 'Holidays & Events', path: '/admin/holidays-events', icon: CalendarDays },
    { name: 'Company Resources', path: '/admin/resources', icon: FolderGit2 },
    { name: 'Staff Management', path: '/admin/staff', icon: Users2 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Manshi Group
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
                Setu
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 truncate max-w-[150px]">
              Office Management CMS
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Modules
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
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 shadow-xs'
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
                          ? 'text-brand-600 dark:text-brand-400'
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
                      <ChevronRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    )}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Admin Profile & Logout Footer */}
      <div className="p-3.5 border-t border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-navy-800/80 border border-slate-200/80 dark:border-navy-700/60 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-slate-800 dark:bg-brand-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
            <ShieldCheck className="w-4.5 h-4.5 text-brand-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {settings.adminName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {settings.adminDesignation}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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
