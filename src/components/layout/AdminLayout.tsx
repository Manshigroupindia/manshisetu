import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';
import { useApp } from '../../context/AppContext';
import { AUTHORIZED_DIRECTOR_EMAIL } from '../../lib/firebase';
import { CloudCheck, RefreshCw, Sparkles } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { auth, logout, showToast, isMigrating, migrationStatus } = useApp();

  // Validate Director Authorization
  const isDirector =
    auth.isAuthenticated &&
    auth.role === 'admin' &&
    (auth.email || '').trim().toLowerCase() === AUTHORIZED_DIRECTOR_EMAIL;

  useEffect(() => {
    // If authenticated user is NOT the Director, terminate session and reject
    if (auth.isAuthenticated && !isDirector) {
      logout();
      showToast(
        `Access Denied: Only the Director (${AUTHORIZED_DIRECTOR_EMAIL}) is permitted to access the Administrative Portal.`,
        'error'
      );
    }
  }, [auth.isAuthenticated, isDirector, logout, showToast]);

  // If not authenticated as director, redirect to login
  if (!auth.isAuthenticated || !isDirector) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleMobileMenu={() => setMobileOpen(true)} />

        {/* Unobtrusive Migration Status Indicator */}
        {isMigrating && (
          <div className="bg-brand-500/10 border-b border-brand-500/20 px-6 py-2 flex items-center justify-between text-xs text-brand-700 dark:text-brand-300">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600 dark:text-brand-400" />
              <span className="font-semibold">
                Synchronizing local records with Cloud Firestore...
              </span>
            </div>
            <span className="text-[11px] opacity-75">Automatic Initial Migration</span>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
};
