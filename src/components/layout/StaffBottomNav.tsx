import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Briefcase,
  Receipt,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';

export const StaffBottomNav: React.FC = () => {
  const { currentStaff, work, attendance } = useApp();

  const myEmployeeId = currentStaff?.employeeId;
  const pendingTasks = work.filter(
    (w) => w.staffId === myEmployeeId && (w.status === 'pending' || w.status === 'in_progress')
  ).length;

  const todayStr = getTodayDateString();
  const todayAtt = attendance.find(
    (a) => a.staffId === currentStaff?.id && a.date === todayStr
  );
  const isDutyOn = todayAtt?.dutyStatus === 'duty_on';

  const items = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    {
      name: 'Duty / GPS',
      path: '/staff/attendance',
      icon: CalendarCheck,
      highlight: isDutyOn,
    },
    {
      name: 'Tasks',
      path: '/staff/work',
      icon: Briefcase,
      badge: pendingTasks > 0 ? pendingTasks : undefined,
    },
    { name: 'Expenses', path: '/staff/expenses', icon: Receipt },
    { name: 'Profile', path: '/staff/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-t border-slate-200 dark:border-navy-800 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all relative ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 mb-0.5 transition-transform ${
                        isActive ? 'scale-110 text-blue-600 dark:text-blue-400' : ''
                      } ${item.highlight ? 'text-emerald-500 animate-pulse' : ''}`}
                    />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
