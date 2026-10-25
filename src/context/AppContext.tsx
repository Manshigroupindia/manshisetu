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
  AppNotification,
  NotificationType,
  WebSocketConnectionStatus,
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
import { notificationService } from '../services/notificationService';
import { websocketNotificationService } from '../services/websocketNotificationService';
import {
  calculateHaversineDistanceMeters,
  getGoogleMapsUrl,
  getISTTimestamp,
  computeSessionDuration,
} from '../utils/geoUtils';
import { getCanonicalEmployeeId } from '../utils/firestoreUtils';

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
  notifications: AppNotification[];
  unreadNotificationCount: number;
  notificationWsStatus: WebSocketConnectionStatus;
  webNotificationPermission: NotificationPermission;
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
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  requestWebNotificationPermission: () => Promise<NotificationPermission>;
  
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

  // Real-time Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationWsStatus, setNotificationWsStatus] = useState<WebSocketConnectionStatus>(() =>
    websocketNotificationService.getStatus()
  );
  const [webNotificationPermission, setWebNotificationPermission] = useState<NotificationPermission>(() =>
    notificationService.getBrowserPermissionStatus()
  );

  const unreadNotificationCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markNotificationAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.warn('Failed to mark notification as read in Firestore:', err);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllAsRead(unread);
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    }
  }, [notifications]);

  const deleteNotificationHandler = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  }, []);

  const requestWebNotificationPermission = useCallback(async () => {
    const perm = await notificationService.requestBrowserPermission();
    setWebNotificationPermission(perm);
    if (perm === 'granted') {
      showToast('Live desktop & push notifications enabled!', 'success');
    } else if (perm === 'denied') {
      showToast('Notification permission blocked in browser settings.', 'error');
    }
    return perm;
  }, [showToast]);

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
    const canonicalEmployeeId = getCanonicalEmployeeId(
      auth.employeeId,
      auth.staffId || currentStaffProfile?.employeeId || currentStaffProfile?.id
    );
    const staffFilter = auth.role === 'staff'
      ? (canonicalEmployeeId || auth.employeeId || 'NO_STAFF_ID')
      : undefined;
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

    // Subscribe to Real-time Notifications (Firestore Real-time Listener)
    if (auth.isAuthenticated && auth.role) {
      unsubs.push(
        notificationService.subscribeNotifications(
          auth.role as 'admin' | 'staff',
          auth.role === 'staff' ? (canonicalEmployeeId || auth.employeeId || 'NO_STAFF_ID') : undefined,
          (cloudNotifs) => {
            setNotifications(cloudNotifs);
          }
        )
      );

      // Listen to WebSocket connection status
      const unsubWsStatus = websocketNotificationService.onStatusChange((status) => {
        setNotificationWsStatus(status);
      });
      unsubs.push(unsubWsStatus);

      // Listen to incoming WebSocket live push notifications
      const unsubWsNotif = websocketNotificationService.onNotification((notif) => {
        notificationService.showBrowserNotification(notif);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
      });
      unsubs.push(unsubWsNotif);

      // Initialize WebSocket connection
      websocketNotificationService.connect({
        uid: auth.uid || 'anonymous',
        role: auth.role,
        employeeId: canonicalEmployeeId || auth.employeeId,
      });
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
      websocketNotificationService.disconnect();
    };
  }, [auth.isAuthenticated, auth.role, auth.employeeId, auth.uid, auth.staffId, currentStaffProfile?.employeeId, currentStaffProfile?.id]);

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
    const cleanStaffId = getCanonicalEmployeeId(
      staffId,
      auth.employeeId || currentStaff?.employeeId || currentStaff?.id
    );
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

    // Notify Director about Staff Duty On
    const staffObj = staff.find((s) => s.id === cleanStaffId || s.employeeId === cleanStaffId) || currentStaff;
    const staffName = staffObj?.fullName || cleanStaffId;
    notificationService.dispatchNotification({
      recipientId: 'director',
      recipientRole: 'director',
      senderId: cleanStaffId,
      senderName: staffName,
      title: `Staff Duty ON: ${staffName}`,
      message: `${staffName} (${cleanStaffId}) clocked ON duty at ${savedRecord.checkIn || displayTime} (${distance}m from office).`,
      type: 'attendance_duty_on',
      priority: 'normal',
      link: '#/attendance',
      entityId: `${cleanStaffId}_${savedRecord.date}_on`,
      action: 'duty_on',
      metadata: {
        staffId: cleanStaffId,
        date: savedRecord.date,
        checkIn: savedRecord.checkIn,
        distanceMeters: distance,
        accuracy: coords.accuracy,
      },
    }).catch(console.warn);

    return savedRecord;
  };

  // GPS Attendance: Record Duty Off
  const recordDutyOff = async (
    staffId: string,
    coords: { latitude: number; longitude: number; accuracy: number }
  ): Promise<AttendanceRecord> => {
    const todayStr = attendanceService.getTodayDateString();
    const cleanStaffId = getCanonicalEmployeeId(
      staffId,
      auth.employeeId || currentStaff?.employeeId || currentStaff?.id
    );
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
        (getCanonicalEmployeeId(r.staffId) === cleanStaffId ||
          r.staffId === cleanStaffId ||
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

    // Notify Director about Staff Duty Off
    const staffObj = staff.find((s) => s.id === cleanStaffId || s.employeeId === cleanStaffId) || currentStaff;
    const staffName = staffObj?.fullName || cleanStaffId;
    notificationService.dispatchNotification({
      recipientId: 'director',
      recipientRole: 'director',
      senderId: cleanStaffId,
      senderName: staffName,
      title: `Staff Duty OFF: ${staffName}`,
      message: `${staffName} (${cleanStaffId}) clocked OFF duty at ${updatedRecord.checkOut || displayTime}. Total: ${updatedRecord.sessionDurationText || duration.durationText}.`,
      type: 'attendance_duty_off',
      priority: 'normal',
      link: '#/attendance',
      entityId: `${cleanStaffId}_${updatedRecord.date}_off`,
      action: 'duty_off',
      metadata: {
        staffId: cleanStaffId,
        date: updatedRecord.date,
        checkOut: updatedRecord.checkOut,
        durationText: updatedRecord.sessionDurationText || duration.durationText,
      },
    }).catch(console.warn);

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

    // Dispatch notification to Director
    const isCompleted = newStatus === 'completed';
    const notifType: NotificationType = isCompleted ? 'task_completed' : 'task_updated';
    const cleanStaffId = getCanonicalEmployeeId(existing.staffId) || existing.staffId;
    notificationService.dispatchNotification({
      recipientId: 'director',
      recipientRole: 'director',
      senderId: cleanStaffId,
      senderName: existing.staffName || cleanStaffId,
      title: isCompleted ? `Task Completed: ${existing.title}` : `Task Progress: ${existing.title}`,
      message: `${existing.staffName || cleanStaffId} updated status to "${newStatus || existing.status}".${progressNotes ? ` Notes: "${progressNotes}"` : ''}`,
      type: notifType,
      priority: isCompleted ? 'normal' : 'low',
      link: '#/tasks',
      entityId: `${workId}_${newStatus || 'update'}`,
      action: newStatus || 'update',
      metadata: {
        taskId: workId,
        status: newStatus || existing.status,
        progressNotes,
        completedNotes,
      },
    }).catch(console.warn);
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
        notifications,
        unreadNotificationCount,
        notificationWsStatus,
        webNotificationPermission,
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
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification: deleteNotificationHandler,
        requestWebNotificationPermission,
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

          // Notify assigned staff
          const targetStaffId = getCanonicalEmployeeId(w.staffId) || w.staffId;
          notificationService.dispatchNotification({
            recipientId: targetStaffId,
            recipientRole: 'staff',
            senderId: auth.uid || 'director',
            senderName: 'Director (Operations)',
            title: `New Task Assigned: ${w.title}`,
            message: `You have been assigned "${w.title}" (Priority: ${w.priority}, Due: ${w.deadlineDate}).`,
            type: 'task_assigned',
            priority: w.priority === 'urgent' || w.priority === 'high' ? 'high' : 'normal',
            link: '#/tasks',
            entityId: w.id,
            action: 'assign',
            metadata: {
              taskId: w.id,
              title: w.title,
              priority: w.priority,
              deadlineDate: w.deadlineDate,
            },
          }).catch(console.warn);
        },
        updateWork: async (w) => {
          setWork((prev) => prev.map((item) => (item.id === w.id ? w : item)));
          await workService.updateWorkAssignment(w);
          showToast('Task updated successfully.', 'success');

          // Notify assigned staff about updates
          const targetStaffId = getCanonicalEmployeeId(w.staffId) || w.staffId;
          notificationService.dispatchNotification({
            recipientId: targetStaffId,
            recipientRole: 'staff',
            senderId: auth.uid || 'director',
            senderName: 'Director (Operations)',
            title: `Task Updated: ${w.title}`,
            message: `Task details or status have been updated: "${w.title}".`,
            type: 'task_updated',
            priority: 'normal',
            link: '#/tasks',
            entityId: `${w.id}_update`,
            action: 'update',
            metadata: {
              taskId: w.id,
              title: w.title,
              status: w.status,
            },
          }).catch(console.warn);
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

          // Notify Director
          const staffId = getCanonicalEmployeeId(e.staffId) || e.staffId;
          notificationService.dispatchNotification({
            recipientId: 'director',
            recipientRole: 'director',
            senderId: staffId,
            senderName: e.staffName || staffId,
            title: `Expense Claim Submitted: ₹${e.amount}`,
            message: `${e.staffName || staffId} submitted an expense claim of ₹${e.amount} for "${e.category}".`,
            type: 'expense_request',
            priority: 'normal',
            link: '#/expenses',
            entityId: e.id,
            action: 'submit',
            metadata: {
              expenseId: e.id,
              amount: e.amount,
              category: e.category,
            },
          }).catch(console.warn);
        },
        updateExpense: async (e) => {
          setExpenses((prev) => prev.map((item) => (item.id === e.id ? e : item)));
          await expenseService.updateExpense(e);
          showToast('Expense status updated.', 'success');

          // Notify staff member regarding approval/rejection
          const staffId = getCanonicalEmployeeId(e.staffId) || e.staffId;
          const notifType: NotificationType =
            e.approvalStatus === 'approved' ? 'expense_approved' : e.approvalStatus === 'rejected' ? 'expense_rejected' : 'expense_request';
          notificationService.dispatchNotification({
            recipientId: staffId,
            recipientRole: 'staff',
            senderId: auth.uid || 'director',
            senderName: 'Director (Operations)',
            title: `Expense Claim ${e.approvalStatus === 'approved' ? 'Approved' : e.approvalStatus === 'rejected' ? 'Rejected' : 'Updated'}: ₹${e.amount}`,
            message: `Your expense claim of ₹${e.amount} for "${e.category}" has been marked as ${e.approvalStatus}.`,
            type: notifType,
            priority: 'normal',
            link: '#/expenses',
            entityId: `${e.id}_${e.approvalStatus}`,
            action: e.approvalStatus,
            metadata: {
              expenseId: e.id,
              amount: e.amount,
              status: e.approvalStatus,
            },
          }).catch(console.warn);
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

          // Notify relevant recipient
          const isDirector = auth.role === 'admin';
          const targetStaffId = getCanonicalEmployeeId(a.staffId) || a.staffId;
          notificationService.dispatchNotification({
            recipientId: isDirector ? targetStaffId : 'director',
            recipientRole: isDirector ? 'staff' : 'director',
            senderId: isDirector ? (auth.uid || 'director') : targetStaffId,
            senderName: isDirector ? 'Director (Operations)' : (a.staffName || targetStaffId),
            title: isDirector ? `Salary Advance Issued: ₹${a.amount}` : `Salary Advance Requested: ₹${a.amount}`,
            message: isDirector
              ? `A salary advance of ₹${a.amount} has been approved and issued to you.`
              : `${a.staffName} requested a salary advance of ₹${a.amount} (${a.reason || 'Personal'}).`,
            type: isDirector ? 'salary_advance_approved' : 'salary_advance_request',
            priority: 'normal',
            link: '#/salary',
            entityId: a.id,
            action: isDirector ? 'issued' : 'request',
            metadata: {
              advanceId: a.id,
              amount: a.amount,
            },
          }).catch(console.warn);
        },
        updateAdvance: async (a) => {
          setAdvances((prev) => prev.map((item) => (item.id === a.id ? a : item)));
          await salaryService.updateSalaryAdvance(a);
          showToast('Advance record updated.', 'success');

          const targetStaffId = getCanonicalEmployeeId(a.staffId) || a.staffId;
          const notifType: NotificationType =
            a.status === 'approved' ? 'salary_advance_approved' : a.status === 'rejected' ? 'salary_advance_rejected' : 'salary_advance_request';
          notificationService.dispatchNotification({
            recipientId: targetStaffId,
            recipientRole: 'staff',
            senderId: auth.uid || 'director',
            senderName: 'Director (Operations)',
            title: `Salary Advance ${a.status === 'approved' ? 'Approved' : a.status === 'rejected' ? 'Rejected' : 'Updated'}: ₹${a.amount}`,
            message: `Your advance request for ₹${a.amount} was marked as ${a.status}.`,
            type: notifType,
            priority: 'normal',
            link: '#/salary',
            entityId: `${a.id}_${a.status}`,
            action: a.status,
            metadata: {
              advanceId: a.id,
              amount: a.amount,
              status: a.status,
            },
          }).catch(console.warn);
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

          // Notify Staff about Payslip
          const targetStaffId = getCanonicalEmployeeId(s.staffId) || s.staffId;
          notificationService.dispatchNotification({
            recipientId: targetStaffId,
            recipientRole: 'staff',
            senderId: auth.uid || 'director',
            senderName: 'Manshi Group Accounts',
            title: `Salary Disbursed: ${s.month}`,
            message: `Your salary for ${s.month} has been disbursed: Net Pay ₹${s.finalPayable.toLocaleString('en-IN')}. Payslip is now available.`,
            type: 'salary_paid',
            priority: 'high',
            link: '#/salary',
            entityId: `${s.id}_${s.month}`,
            action: 'disbursed',
            metadata: {
              salaryId: s.id,
              month: s.month,
              netPay: s.finalPayable,
            },
          }).catch(console.warn);
        },
        addNotice: async (n) => {
          setNotices((prev) => [n, ...prev]);
          await noticeService.addNotice(n);
          showToast('Notice published successfully.', 'success');

          // Notify All Staff or Specific Staff
          const target = n.targetAudience === 'specific' && n.targetStaffIds && n.targetStaffIds.length > 0
            ? (getCanonicalEmployeeId(n.targetStaffIds[0]) || n.targetStaffIds[0])
            : 'all';
          notificationService.dispatchNotification({
            recipientId: target,
            recipientRole: target === 'all' ? 'all' : 'staff',
            senderId: auth.uid || 'director',
            senderName: 'Director Office',
            title: `Notice: ${n.title}`,
            message: n.content.substring(0, 150) + (n.content.length > 150 ? '...' : ''),
            type: 'notice_published',
            priority: n.priority === 'urgent' || n.priority === 'high' ? 'high' : 'normal',
            link: '#/notices',
            entityId: n.id,
            action: 'publish',
            metadata: {
              noticeId: n.id,
              title: n.title,
            },
          }).catch(console.warn);
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

          // Notify All
          notificationService.dispatchNotification({
            recipientId: 'all',
            recipientRole: 'all',
            senderId: auth.uid || 'admin',
            senderName: 'Manshi Group HR',
            title: `Holiday Added: ${h.name}`,
            message: `Office holiday scheduled for ${h.startDate} (${h.description || h.name}).`,
            type: 'holiday_added',
            priority: 'low',
            link: '#/calendar',
            entityId: h.id,
            action: 'add',
            metadata: {
              holidayId: h.id,
              date: h.startDate,
              name: h.name,
            },
          }).catch(console.warn);
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

          // Notify All
          notificationService.dispatchNotification({
            recipientId: 'all',
            recipientRole: 'all',
            senderId: auth.uid || 'admin',
            senderName: 'Manshi Group HR',
            title: `New Event: ${e.title}`,
            message: `Event on ${e.date} at ${e.startTime || 'office'}: ${e.description || e.title}`,
            type: 'event_scheduled',
            priority: 'normal',
            link: '#/calendar',
            entityId: e.id,
            action: 'add',
            metadata: {
              eventId: e.id,
              date: e.date,
              title: e.title,
            },
          }).catch(console.warn);
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
