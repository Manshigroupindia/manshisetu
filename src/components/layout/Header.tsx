import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  ChevronDown,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DigitalClock } from '../common/DigitalClock';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { darkMode, toggleDarkMode, notices, work, expenses, settings, logout } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  // Urgent/recent items for notifications
  const urgentTasks = work.filter((w) => w.priority === 'urgent' && w.status !== 'completed');
  const pendingExpenses = expenses.filter((e) => e.approvalStatus === 'pending');
  const recentNotices = notices.filter((n) => n.status === 'published').slice(0, 3);

  const totalNotificationCount = urgentTasks.length + pendingExpenses.length + recentNotices.length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200 dark:border-navy-800 transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Mobile hamburger & location */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {settings.officeLocation}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {settings.companyName}
            </div>
          </div>
        </div>

        {/* Center: Live Digital Clock */}
        <div className="hidden md:flex items-center">
          <DigitalClock compact />
        </div>

        {/* Right Actions: Theme Toggle, Notifications, Admin Profile */}
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
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-navy-900">
                  {totalNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-navy-800">
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    Office Alerts & Notifications
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                    {totalNotificationCount} New
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800/80">
                  {urgentTasks.map((t) => (
                    <Link
                      key={t.id}
                      to="/admin/work"
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
                          Assigned to: {t.staffName} · Due: {t.deadlineDate}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {pendingExpenses.map((exp) => (
                    <Link
                      key={exp.id}
                      to="/admin/expenses"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-navy-800/60 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Expense Pending Approval: ₹{exp.amount}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {exp.staffName} · {exp.category}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {recentNotices.map((n) => (
                    <Link
                      key={n.id}
                      to="/admin/notices"
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
                      No new urgent alerts at this moment.
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-navy-800 text-center">
                  <Link
                    to="/admin/notices"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                  >
                    View All Notice Board Updates
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1 sm:pl-2.5 sm:pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors border border-slate-200/80 dark:border-navy-700/80"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                AD
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {settings.adminName}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Administrator
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {settings.adminName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {settings.officialEmail}
                  </div>
                </div>

                <Link
                  to="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Admin & Office Settings
                </Link>

                <div className="my-1 border-t border-slate-100 dark:border-navy-800" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Shield className="w-4 h-4" />
                  Log Out to Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
