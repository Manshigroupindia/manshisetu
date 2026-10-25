import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  User,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DigitalClock } from '../common/DigitalClock';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { darkMode, toggleDarkMode, settings, logout } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

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

          {/* Real-time Notifications Dropdown */}
          <NotificationDropdown />

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
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
