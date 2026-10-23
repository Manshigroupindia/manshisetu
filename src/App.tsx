import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { StaffComingSoonPage } from './pages/StaffComingSoonPage';

// Admin CMS Layout & Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { WorkManagementPage } from './pages/WorkManagementPage';
import { AttendancePage } from './pages/AttendancePage';
import { ExpenseManagementPage } from './pages/ExpenseManagementPage';
import { SalaryManagementPage } from './pages/SalaryManagementPage';
import { NoticesPage } from './pages/NoticesPage';
import { HolidaysEventsPage } from './pages/HolidaysEventsPage';
import { CompanyResourcesPage } from './pages/CompanyResourcesPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { SettingsPage } from './pages/SettingsPage';

// Staff Portal Layout & Pages
import { StaffLayout } from './components/layout/StaffLayout';
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { StaffAttendancePage } from './pages/staff/StaffAttendancePage';
import { StaffTasksPage } from './pages/staff/StaffTasksPage';
import { StaffExpensesPage } from './pages/staff/StaffExpensesPage';
import { StaffSalaryPage } from './pages/staff/StaffSalaryPage';
import { StaffNoticesPage } from './pages/staff/StaffNoticesPage';
import { StaffHolidaysEventsPage } from './pages/staff/StaffHolidaysEventsPage';
import { StaffProfilePage } from './pages/staff/StaffProfilePage';
import { StaffResourcesPage } from './pages/staff/StaffResourcesPage';

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Role Selection Gateway */}
          <Route path="/" element={<RoleSelectionPage />} />

          {/* Staff Feature Roadmap / Coming Soon Information */}
          <Route path="/staff-portal" element={<StaffComingSoonPage />} />

          {/* Staff Portal Layout & Modules */}
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboardPage />} />
            <Route path="attendance" element={<StaffAttendancePage />} />
            <Route path="work" element={<StaffTasksPage />} />
            <Route path="expenses" element={<StaffExpensesPage />} />
            <Route path="salary" element={<StaffSalaryPage />} />
            <Route path="notices" element={<StaffNoticesPage />} />
            <Route path="holidays-events" element={<StaffHolidaysEventsPage />} />
            <Route path="profile" element={<StaffProfilePage />} />
            <Route path="resources" element={<StaffResourcesPage />} />
          </Route>

          {/* Admin CMS Layout & Modules */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="work" element={<WorkManagementPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="expenses" element={<ExpenseManagementPage />} />
            <Route path="salary" element={<SalaryManagementPage />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="holidays-events" element={<HolidaysEventsPage />} />
            <Route path="resources" element={<CompanyResourcesPage />} />
            <Route path="staff" element={<StaffManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
