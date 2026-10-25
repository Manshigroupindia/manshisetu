import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Staff,
  WorkAssignment,
  AttendanceRecord,
  Expense,
  SalaryAdvance,
  SalaryRecord,
  Notice,
  Holiday,
  OfficeEvent,
  CompanyResource,
  CompanySettings,
  TaskStatus,
  GPSLocation,
  LocationVerificationStatus,
  MigrationStatus,
} from '../types';
import { storageService } from '../services/storageService';
import { authService, AuthSession } from '../services/authService';
import { staffService } from '../services/staffService';
import { attendanceService } from '../services/attendanceService';
import { workService } from '../services/workService';
import { expenseService } from '../services/expenseService';
import { salaryService } from '../services/salaryService';
import { noticeService } from '../services/noticeService';
import { companyService } from '../services/companyService';
import { migrationService } from '../services/migrationService';
import {
  calculateHaversineDistanceMeters,
  getGoogleMapsUrl,
  getISTTimestamp,
  computeSessionDuration,
} from '../utils/geoUtils';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  staff: Staff[];
  work: WorkAssignment[];
  attendance: AttendanceRecord[];
  expenses: Expense[];
  advances: SalaryAdvance[];
  salaries: SalaryRecord[];
  notices: Notice[];
  holidays: Holiday[];
  events: OfficeEvent[];
  resources: CompanyResource[];
  settings: CompanySettings;
  auth: AuthSession;
  currentStaff: Staff | null;
  toasts: ToastMessage[];
  darkMode: boolean;
  migrationStatus: MigrationStatus | null;
  isMigrating: boolean;
  toggleDarkMode: () => void;
  loginAdmin: (usernameOrEmail: string, password?: string) => Promise<boolean>;
  loginStaff: (identifier: string, password?: string) => Promise<{ success: boolean; staff: Staff }>;
  logout: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  resetAllDemoData: () => void;
  
  // Storage actions
  addStaff: (s: Staff, initialPassword?: string) => Promise<void>;
  updateStaff: (s: Staff) => Promise<void>;
  deactivateStaff: (id: string) => Promise<void>;
  reactivateStaff: (id: string) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  updateStaffPersonalProfile: (staffId: string, partial: { alternateContact?: string; address?: string }) => Promise<void>;
  
  addWork: (w: WorkAssignment) => Promise<void>;
  updateWork: (w: WorkAssignment) => Promise<void>;
  deleteWork: (id: string) => Promise<void>;
  updateWorkAssignmentStaffNotes: (
    workId: string,
    newStatus?: TaskStatus,
    progressNotes?: string,
    completedNotes?: string
  ) => Promise<void>;
  
  upsertAttendance: (a: AttendanceRecord) => Promise<void>;
  recordDutyOn: (
    staffId: string,
    coords: { latitude: number; longitude: number; accuracy: number }
  ) => Promise<AttendanceRecord>;
  recordDutyOff: (
    staffId: string,
    coords: { latitude: number; longitude: number; accuracy: number }
  ) => Promise<AttendanceRecord>;
  
  addExpense: (e: Expense) => Promise<void>;
  updateExpense: (e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  addAdvance: (a: SalaryAdvance) => Promise<void>;
  updateAdvance: (a: SalaryAdvance) => Promise<void>;
  
  saveSalaryRecord: (s: SalaryRecord) => Promise<void>;
  
  addNotice: (n: Notice) => Promise<void>;
  updateNotice: (n: Notice) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  
  addHoliday: (h: Holiday) => Promise<void>;
  updateHoliday: (h: Holiday) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  
  addEvent: (e: OfficeEvent) => Promise<void>;
  updateEvent: (e: OfficeEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  addResource: (r: CompanyResource) => Promise<void>;
  updateResource: (r: CompanyResource) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  
  updateSettings: (s: CompanySettings) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Purge any legacy demo data from localStorage on load
  storageService.initialize();

  // Initial seed / local fallback data (clean empty arrays)
  const [staff, setStaff] = useState<Staff[]>(() => storageService.getStaff());
  const [work, setWork] = useState<WorkAssignment[]>(() => storageService.getWork());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => storageService.getAttendance());
  const [expenses, setExpenses] = useState<Expense[]>(() => storageService.getExpenses());
  const [advances, setAdvances] = useState<SalaryAdvance[]>(() => storageService.getAdvances());
  const [salaries, setSalaries] = useState<SalaryRecord[]>(() => storageService.getSalaries());
  const [notices, setNotices] = useState<Notice[]>(() => storageService.getNotices());
  const [holidays, setHolidays] = useState<Holiday[]>(() => storageService.getHolidays());
  const [events, setEvents] = useState<OfficeEvent[]>(() => storageService.getEvents());
  const [resources, setResources] = useState<CompanyResource[]>(() => storageService.getResources());
  const [settings, setSettings] = useState<CompanySettings>(() => storageService.getSettings());
  
  // Auth state
  const [auth, setAuth] = useState<AuthSession>(() => {
    const local = storageService.getAuth();
    return {
      isAuthenticated: !!local.isAuthenticated,
      role: local.role || null,
      username: local.username,
      staffId: local.staffId,
    };
  });

  const [currentStaffProfile, setCurrentStaffProfile] = useState<Staff | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const s = storageService.getSettings();
    return s.theme === 'dark';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      const updated = { ...settings, theme: (next ? 'dark' : 'light') as 'dark' | 'light' };
      companyService.saveSettings(updated).catch(console.warn);
      storageService.saveSettings(updated);
      return next;
    });
  };

  // Find currently logged-in staff member
  const currentStaff: Staff | null = React.useMemo(() => {
    if (currentStaffProfile) return currentStaffProfile;
    if (auth.isAuthenticated && auth.role === 'staff' && (auth.staffId || auth.employeeId)) {
      return (
        staff.find((s) => s.id === auth.staffId || s.employeeId === auth.employeeId) ||
        null
      );
    }
    return null;
  }, [auth, staff, currentStaffProfile]);

  // Execute Automatic Migration on Director Login
  const checkAndRunAutoMigration = useCallback(async () => {
    try {
      setIsMigrating(true);
      const result = await migrationService.runAutoMigration();
      if (result.completed && result.counts?.cleanedDemoRecords) {
        showToast(
          `Cloud Database Cleaned: ${result.counts.cleanedDemoRecords} sample/demo records safely purged from Firestore.`,
          'info'
        );
      }
      const status = await migrationService.getMigrationStatus();
      setMigrationStatus(status);
    } catch (err) {
      console.warn('Auto-migration execution failed:', err);
    } finally {
      setIsMigrating(false);
    }
  }, [showToast]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = authService.onAuthStateChange(async (session) => {
      if (session.isAuthenticated && session.role) {
        const newSession: AuthSession = {
          isAuthenticated: true,
          role: session.role,
          username: session.user?.displayName || session.profile?.email || (session.role === 'admin' ? 'Director' : 'Staff'),
          email: session.user?.email || undefined,
          uid: session.user?.uid,
          employeeId: session.profile?.employeeId || undefined,
          staffId: session.staff?.id || undefined,
        };
        setAuth(newSession);
        storageService.setAuth(newSession);

        if (session.staff) {
          setCurrentStaffProfile(session.staff);
        }

        // If director logged in, run initial auto-migration check
        if (session.role === 'admin') {
          checkAndRunAutoMigration();
        }
      } else {
        const unauth: AuthSession = { isAuthenticated: false, role: null };
        setAuth(unauth);
        storageService.setAuth(unauth);
        setCurrentStaffProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, [checkAndRunAutoMigration]);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const unsubs: Array<() => void> = [];

    // Subscribe to Settings
    unsubs.push(
      companyService.subscribeSettings((cloudSettings) => {
        setSettings(cloudSettings);
        storageService.saveSettings(cloudSettings);
      })
    );

    // Subscribe to Staff
    unsubs.push(
      staffService.subscribeStaff((cloudStaff) => {
        if (cloudStaff) {
          setStaff(cloudStaff);
          storageService.saveStaff(cloudStaff);
        }
      })
    );

    // Subscribe to Work Assignments (filtered if staff)
    const staffFilter = auth.role === 'staff' ? auth.employeeId : undefined;
    unsubs.push(
      workService.subscribeWork((cloudWork) => {
        if (cloudWork) {
          setWork(cloudWork);
          storageService.saveWork(cloudWork);
        }
      }, staffFilter)
    );

    // Subscribe to Attendance
    unsubs.push(
      attendanceService.subscribeAttendance((cloudAttendance) => {
        if (cloudAttendance) {
          setAttendance(cloudAttendance);
          storageService.saveAttendance(cloudAttendance);
        }
      }, staffFilter)
    );

    // Subscribe to Expenses
    unsubs.push(
      expenseService.subscribeExpenses((cloudExpenses) => {
        if (cloudExpenses) {
          setExpenses(cloudExpenses);
          storageService.saveExpenses(cloudExpenses);
        }
      }, staffFilter)
    );

    // Subscribe to Salary Records
    unsubs.push(
      salaryService.subscribeSalaries((cloudSalaries) => {
        if (cloudSalaries) {
          setSalaries(cloudSalaries);
          storageService.saveSalaries(cloudSalaries);
        }
      }, staffFilter)
    );

    // Subscribe to Salary Advances
    unsubs.push(
      salaryService.subscribeAdvances((cloudAdvances) => {
        if (cloudAdvances) {
          setAdvances(cloudAdvances);
          storageService.saveAdvances(cloudAdvances);
        }
      }, staffFilter)
    );

    // Subscribe to Notices
    unsubs.push(
      noticeService.subscribeNotices((cloudNotices) => {
        if (cloudNotices) {
          setNotices(cloudNotices);
          storageService.saveNotices(cloudNotices);
        }
      })
    );

    // Subscribe to Holidays
    unsubs.push(
      companyService.subscribeHolidays((cloudHolidays) => {
        if (cloudHolidays) {
          setHolidays(cloudHolidays);
          storageService.saveHolidays(cloudHolidays);
        }
      })
    );

    // Subscribe to Events
    unsubs.push(
      companyService.subscribeEvents((cloudEvents) => {
        if (cloudEvents) {
          setEvents(cloudEvents);
          storageService.saveEvents(cloudEvents);
        }
      })
    );

    // Subscribe to Resources
    unsubs.push(
      companyService.subscribeResources((cloudResources) => {
        if (cloudResources) {
          setResources(cloudResources);
          storageService.saveResources(cloudResources);
        }
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [auth.isAuthenticated, auth.role, auth.employeeId]);

  // Login Director via Firebase Auth
  const loginAdmin = async (emailOrUsername: string, password?: string): Promise<boolean> => {
    try {
      const email = (emailOrUsername || '').trim().toLowerCase();
      const pwd = password || '';
      const { user } = await authService.loginDirector(email, pwd);
      const session: AuthSession = {
        isAuthenticated: true,
        role: 'admin',
        username: 'Director (Operations)',
        email: user.email || email,
        uid: user.uid,
      };
      setAuth(session);
      storageService.setAuth(session);
      showToast(`Welcome Director! Authenticated as ${user.email}.`, 'success');
      await checkAndRunAutoMigration();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Director authentication failed.', 'error');
      throw err;
    }
  };

  // Login Staff via Firebase Auth
  const loginStaff = async (identifier: string, password?: string): Promise<{ success: boolean; staff: Staff }> => {
    try {
      const pwd = password || '';
      const { staff: staffProfile, profile, user } = await authService.loginStaff(identifier, pwd);
      const session: AuthSession = {
        isAuthenticated: true,
        role: profile.role === 'director' ? 'admin' : 'staff',
        username: staffProfile.fullName,
        email: user.email || undefined,
        uid: user.uid,
        employeeId: staffProfile.employeeId,
        staffId: staffProfile.id,
      };
      setAuth(session);
      storageService.setAuth(session);
      setCurrentStaffProfile(staffProfile);
      showToast(`Welcome to Staff Portal, ${staffProfile.fullName}!`, 'success');
      return { success: true, staff: staffProfile };
    } catch (err: any) {
      showToast(err.message || 'Staff login failed.', 'error');
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Firebase logout error:', err);
    }
    const session: AuthSession = { isAuthenticated: false, role: null };
    storageService.setAuth(session);
    setAuth(session);
    setCurrentStaffProfile(null);
    showToast('Logged out of Manshi Group Setu.', 'info');
  };

  const resetAllDemoData = async () => {
    storageService.clearAllData();
    setStaff([]);
    setWork([]);
    setAttendance([]);
    setExpenses([]);
    setAdvances([]);
    setSalaries([]);
    setNotices([]);
    setHolidays([]);
    setEvents([]);
    setResources([]);
    if (auth.isAuthenticated && auth.role === 'admin') {
      try {
        await migrationService.cleanDemoRecordsFromFirestore();
      } catch (e) {
        console.warn('Could not clean Firestore demo records:', e);
      }
    }
    showToast('Local cache cleaned. Genuine records load dynamically from Firebase.', 'success');
  };

  // GPS Attendance: Record Duty On
  const recordDutyOn = async (
    staffId: string,
    coords: { latitude: number; longitude: number; accuracy: number }
  ): Promise<AttendanceRecord> => {
    const cleanStaffId = staffId.trim();
    const office = settings.officeGeofence || {
      latitude: 28.6289,
      longitude: 77.2219,
      radiusMeters: 300,
      enabled: true,
    };

    const distance = calculateHaversineDistanceMeters(
      coords.latitude,
      coords.longitude,
      office.latitude,
      office.longitude
    );

    const { displayTime } = getISTTimestamp(new Date());

    // 1. Write to Firestore first and await confirmation
    const savedRecord = await attendanceService.recordDutyOn(cleanStaffId, coords, settings);

    // 2. Update local state now that Firestore write has succeeded
    setAttendance((prev) => {
      const idx = prev.findIndex((r) => r.id === savedRecord.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedRecord;
        return copy;
      }
      return [savedRecord, ...prev];
    });

    showToast(
      `Duty On recorded successfully at ${savedRecord.checkIn || displayTime}! (${distance}m from office, accuracy ±${Math.round(coords.accuracy)}m)`,
      'success'
    );

    return savedRecord;
  };

  // GPS Attendance: Record Duty Off
  const recordDutyOff = async (
    staffId: string,
    coords: { latitude: number; longitude: number; accuracy: number }
  ): Promise<AttendanceRecord> => {
    const todayStr = attendanceService.getTodayDateString();
    const cleanStaffId = staffId.trim();
    const office = settings.officeGeofence || {
      latitude: 28.6289,
      longitude: 77.2219,
      radiusMeters: 300,
      enabled: true,
    };

    const distance = calculateHaversineDistanceMeters(
      coords.latitude,
      coords.longitude,
      office.latitude,
      office.longitude
    );

    const { displayTime, isoString } = getISTTimestamp(new Date());

    const existingIdx = attendance.findIndex(
      (r) =>
        (r.staffId === cleanStaffId ||
          (currentStaff && (r.staffId === currentStaff.id || r.staffId === currentStaff.employeeId))) &&
        r.date === todayStr
    );
    const existing = existingIdx >= 0 ? attendance[existingIdx] : null;

    const duration = computeSessionDuration(existing?.checkInTimestamp, isoString);

    // 1. Write to Firestore first and await confirmation
    const updatedRecord = await attendanceService.recordDutyOff(
      cleanStaffId,
      coords,
      settings,
      existing
    );

    // 2. Update local state now that Firestore write has succeeded
    setAttendance((prev) => {
      const idx = prev.findIndex((r) => r.id === updatedRecord.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedRecord;
        return copy;
      }
      return [updatedRecord, ...prev];
    });

    showToast(
      `Duty Off recorded successfully at ${updatedRecord.checkOut || displayTime}! Total duty: ${updatedRecord.sessionDurationText || duration.durationText} (accuracy ±${Math.round(coords.accuracy)}m)`,
      'success'
    );

    return updatedRecord;
  };

  // Staff updates task progress notes & status
  const updateWorkAssignmentStaffNotes = async (
    workId: string,
    newStatus?: TaskStatus,
    progressNotes?: string,
    completedNotes?: string
  ): Promise<void> => {
    const existing = work.find((w) => w.id === workId);
    if (!existing) return;

    const updated: WorkAssignment = {
      ...existing,
      status: newStatus || existing.status,
      staffProgressNotes: progressNotes !== undefined ? progressNotes : existing.staffProgressNotes,
      staffCompletedNotes: completedNotes !== undefined ? completedNotes : existing.staffCompletedNotes,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : existing.completedAt,
    };

    setWork((prev) => prev.map((w) => (w.id === workId ? updated : w)));
    await workService.updateStaffNotes(workId, newStatus, progressNotes, completedNotes);
    showToast(`Task "${existing.title}" updated.`, 'success');
  };

  // Staff personal profile update
  const updateStaffPersonalProfile = async (
    staffId: string,
    partial: { alternateContact?: string; address?: string }
  ): Promise<void> => {
    const existing = staff.find((s) => s.id === staffId || s.employeeId === staffId);
    if (!existing) return;

    const updated: Staff = {
      ...existing,
      alternateContact: partial.alternateContact !== undefined ? partial.alternateContact : existing.alternateContact,
      address: partial.address !== undefined ? partial.address : existing.address,
    };

    setStaff((prev) => prev.map((s) => (s.id === existing.id ? updated : s)));
    if (currentStaffProfile) {
      setCurrentStaffProfile(updated);
    }

    await staffService.updateStaffPersonalProfile(existing.employeeId, partial);
    showToast('Your personal contact information has been updated.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        staff,
        work,
        attendance,
        expenses,
        advances,
        salaries,
        notices,
        holidays,
        events,
        resources,
        settings,
        auth,
        currentStaff,
        toasts,
        darkMode,
        migrationStatus,
        isMigrating,
        toggleDarkMode,
        loginAdmin,
        loginStaff,
        logout,
        showToast,
        removeToast,
        resetAllDemoData,
        addStaff: async (s, initialPassword) => {
          try {
            const { staff: created } = await staffService.createStaffMember(s, initialPassword);
            // Avoid duplicate cards: check if real-time Firestore listener already added this employee
            setStaff((prev) => {
              const alreadyExists = prev.some(
                (item) =>
                  (item.employeeId && item.employeeId.toUpperCase() === created.employeeId.toUpperCase()) ||
                  (item.id && created.id && item.id === created.id)
              );
              if (alreadyExists) return prev;
              return [created, ...prev];
            });
            showToast(`Staff member ${s.fullName} (${s.employeeId}) provisioned with Firebase login.`, 'success');
          } catch (err: any) {
            showToast(err.message || 'Failed to create staff account.', 'error');
            throw err;
          }
        },
        updateStaff: async (s) => {
          setStaff((prev) => prev.map((item) => (item.id === s.id ? s : item)));
          await staffService.updateStaff(s);
          showToast(`Updated details for ${s.fullName}.`, 'success');
        },
        deactivateStaff: async (id) => {
          setStaff((prev) =>
            prev.map((item) => (item.id === id || item.employeeId === id ? { ...item, status: 'inactive' } : item))
          );
          try {
            await staffService.deactivateStaff(id);
            showToast('Staff account deactivated. Portal login has been disabled.', 'info');
          } catch (err: any) {
            showToast(err.message || 'Failed to deactivate staff account.', 'error');
            throw err;
          }
        },
        reactivateStaff: async (id) => {
          setStaff((prev) =>
            prev.map((item) => (item.id === id || item.employeeId === id ? { ...item, status: 'active' } : item))
          );
          try {
            await staffService.reactivateStaff(id);
            showToast('Staff account reactivated successfully. Portal login access restored.', 'success');
          } catch (err: any) {
            showToast(err.message || 'Failed to reactivate staff account.', 'error');
            throw err;
          }
        },
        deleteStaff: async (id) => {
          try {
            const result = await staffService.deleteStaff(id);
            setStaff((prev) =>
              prev.filter(
                (item) =>
                  item.id !== id &&
                  item.employeeId !== id &&
                  item.employeeId !== result.employeeId
              )
            );
            // Also remove active uncompleted tasks for this staff member from local state
            setWork((prev) =>
              prev.filter(
                (w) =>
                  !(
                    (w.staffId === id || w.staffId === result.employeeId) &&
                    (w.status === 'pending' || w.status === 'in_progress')
                  )
              )
            );
            showToast(
              `Staff member (${result.employeeId}) permanently deleted. Authentication account and portal access removed.`,
              'success'
            );
          } catch (err: any) {
            showToast(err.message || 'Failed to delete staff member.', 'error');
            throw err;
          }
        },
        updateStaffPersonalProfile,
        addWork: async (w) => {
          setWork((prev) => [w, ...prev]);
          await workService.addWorkAssignment(w);
          showToast(`Task assigned to ${w.staffName}.`, 'success');
        },
        updateWork: async (w) => {
          setWork((prev) => prev.map((item) => (item.id === w.id ? w : item)));
          await workService.updateWorkAssignment(w);
          showToast('Task updated successfully.', 'success');
        },
        deleteWork: async (id) => {
          setWork((prev) => prev.filter((item) => item.id !== id));
          await workService.deleteWorkAssignment(id);
          showToast('Task assignment removed.', 'info');
        },
        updateWorkAssignmentStaffNotes,
        upsertAttendance: async (a) => {
          setAttendance((prev) => {
            const idx = prev.findIndex((item) => item.id === a.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = a;
              return copy;
            }
            return [a, ...prev];
          });
          await attendanceService.upsertAttendance(a);
          showToast(`Attendance record updated for ${a.date}.`, 'success');
        },
        recordDutyOn,
        recordDutyOff,
        addExpense: async (e) => {
          setExpenses((prev) => [e, ...prev]);
          await expenseService.addExpense(e);
          showToast('Expense claim submitted for review.', 'success');
        },
        updateExpense: async (e) => {
          setExpenses((prev) => prev.map((item) => (item.id === e.id ? e : item)));
          await expenseService.updateExpense(e);
          showToast('Expense status updated.', 'success');
        },
        deleteExpense: async (id) => {
          setExpenses((prev) => prev.filter((item) => item.id !== id));
          await expenseService.deleteExpense(id);
          showToast('Expense claim removed.', 'info');
        },
        addAdvance: async (a) => {
          setAdvances((prev) => [a, ...prev]);
          await salaryService.addSalaryAdvance(a);
          showToast(`Advance of ₹${a.amount} issued to ${a.staffName}.`, 'success');
        },
        updateAdvance: async (a) => {
          setAdvances((prev) => prev.map((item) => (item.id === a.id ? a : item)));
          await salaryService.updateSalaryAdvance(a);
          showToast('Advance record updated.', 'success');
        },
        saveSalaryRecord: async (s) => {
          setSalaries((prev) => {
            const idx = prev.findIndex((item) => item.id === s.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = s;
              return copy;
            }
            return [s, ...prev];
          });
          await salaryService.saveSalaryRecord(s);
          showToast(`Salary for ${s.staffName} (${s.month}) processed as Paid.`, 'success');
        },
        addNotice: async (n) => {
          setNotices((prev) => [n, ...prev]);
          await noticeService.addNotice(n);
          showToast('Notice published successfully.', 'success');
        },
        updateNotice: async (n) => {
          setNotices((prev) => prev.map((item) => (item.id === n.id ? n : item)));
          await noticeService.updateNotice(n);
          showToast('Notice updated.', 'success');
        },
        deleteNotice: async (id) => {
          setNotices((prev) => prev.filter((item) => item.id !== id));
          await noticeService.deleteNotice(id);
          showToast('Notice deleted.', 'info');
        },
        addHoliday: async (h) => {
          setHolidays((prev) => [h, ...prev]);
          await companyService.addHoliday(h);
          showToast(`Holiday "${h.name}" added to calendar.`, 'success');
        },
        updateHoliday: async (h) => {
          setHolidays((prev) => prev.map((item) => (item.id === h.id ? h : item)));
          await companyService.updateHoliday(h);
          showToast('Holiday updated.', 'success');
        },
        deleteHoliday: async (id) => {
          setHolidays((prev) => prev.filter((item) => item.id !== id));
          await companyService.deleteHoliday(id);
          showToast('Holiday removed from calendar.', 'info');
        },
        addEvent: async (e) => {
          setEvents((prev) => [e, ...prev]);
          await companyService.addEvent(e);
          showToast(`Office event "${e.title}" scheduled.`, 'success');
        },
        updateEvent: async (e) => {
          setEvents((prev) => prev.map((item) => (item.id === e.id ? e : item)));
          await companyService.updateEvent(e);
          showToast('Office event updated.', 'success');
        },
        deleteEvent: async (id) => {
          setEvents((prev) => prev.filter((item) => item.id !== id));
          await companyService.deleteEvent(id);
          showToast('Event deleted.', 'info');
        },
        addResource: async (r) => {
          setResources((prev) => [r, ...prev]);
          await companyService.addResource(r);
          showToast(`Company resource "${r.name}" saved.`, 'success');
        },
        updateResource: async (r) => {
          setResources((prev) => prev.map((item) => (item.id === r.id ? r : item)));
          await companyService.updateResource(r);
          showToast('Resource updated.', 'success');
        },
        deleteResource: async (id) => {
          setResources((prev) => prev.filter((item) => item.id !== id));
          await companyService.deleteResource(id);
          showToast('Resource removed.', 'info');
        },
        updateSettings: async (s) => {
          setSettings(s);
          await companyService.saveSettings(s);
          showToast('Company settings updated successfully.', 'success');
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
