import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { StaffSidebar } from './StaffSidebar';
import { StaffHeader } from './StaffHeader';
import { StaffBottomNav } from './StaffBottomNav';
import { ToastContainer } from '../common/ToastContainer';
import { useApp } from '../../context/AppContext';

export const StaffLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { auth, currentStaff } = useApp();

  // Allow authenticated staff, or director previewing staff portal
  const isAllowed = auth.isAuthenticated && (auth.role === 'staff' || auth.role === 'admin');
  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <StaffSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <StaffHeader onToggleMobileMenu={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <StaffBottomNav />

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
};
