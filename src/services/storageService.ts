// LocalStorage data service for Manshi Group Setu

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
} from '../types';
import {
  isDemoStaff,
  isDemoWork,
  isDemoAttendance,
  isDemoExpense,
  isDemoAdvance,
  isDemoSalary,
  isDemoNotice,
  isDemoHoliday,
  isDemoEvent,
  isDemoResource,
} from '../utils/demoDataFilter';

const STORAGE_KEYS = {
  STAFF: 'manshi_setu_staff',
  WORK: 'manshi_setu_work',
  ATTENDANCE: 'manshi_setu_attendance',
  EXPENSES: 'manshi_setu_expenses',
  ADVANCES: 'manshi_setu_advances',
  SALARIES: 'manshi_setu_salaries',
  NOTICES: 'manshi_setu_notices',
  HOLIDAYS: 'manshi_setu_holidays',
  EVENTS: 'manshi_setu_events',
  RESOURCES: 'manshi_setu_resources',
  SETTINGS: 'manshi_setu_settings',
  AUTH: 'manshi_setu_auth',
};

// Default Company Settings
export const defaultSettings: CompanySettings = {
  companyName: 'Manshi Group of Services',
  brandTagline: 'Empowering Corporate Solutions & Workforce Excellence',
  logoUrl: '',
  officialEmail: 'contact@manshigroup.in',
  contactNumber: '+91 11 4982 7700',
  website: 'https://manshigroup.in',
  officeAddress: 'Tower B, 4th Floor, Manshi Corporate Park, Barakhamba Road, New Delhi 110001',
  adminName: 'Chief Administrator',
  adminDesignation: 'Director of Corporate Operations',
  officeLocation: 'Headquarters — New Delhi',
  officeHours: '09:30 AM – 06:30 PM (Mon - Sat)',
  weeklyOffDays: [0], // 0 is Sunday
  salaryPolicy: {
    daysInMonthBasis: 30,
    allowedPaidLeavesPerMonth: 1,
    sundayPaid: true,
    holidayPaid: true,
  },
  officeGeofence: {
    latitude: 28.6289,
    longitude: 77.2219,
    radiusMeters: 300,
    enabled: true,
  },
  theme: 'light',
};

// Initial Clean Production Defaults (Zero hardcoded demo, dummy, or sample records)
export const initialStaffList: Staff[] = [];
export const initialWorkAssignments: WorkAssignment[] = [];
export const initialHolidays: Holiday[] = [];
export const initialOfficeEvents: OfficeEvent[] = [];
export const initialNotices: Notice[] = [];
export const initialExpenses: Expense[] = [];
export const initialSalaryAdvances: SalaryAdvance[] = [];
export const initialCompanyResources: CompanyResource[] = [];
export function generateSeedAttendance(): AttendanceRecord[] {
  return [];
}
export const initialSalaryRecords: SalaryRecord[] = [];

const listeners: (() => void)[] = [];

export function subscribeStorage(callback: () => void) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Storage subscriber error:', e);
    }
  });
}

// Storage Service Wrapper
export const storageService = {
  // Initialize storage ensuring clean real data
  initialize() {
    try {
      // 1. Purge legacy demo expenses
      const expensesRaw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (expensesRaw) {
        try {
          const list = JSON.parse(expensesRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((e) => !isDemoExpense(e));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      }

      // 2. Purge legacy demo advances
      const advancesRaw = localStorage.getItem(STORAGE_KEYS.ADVANCES);
      if (advancesRaw) {
        try {
          const list = JSON.parse(advancesRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((a) => !isDemoAdvance(a));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.ADVANCES, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.ADVANCES, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.ADVANCES, JSON.stringify([]));
      }

      // 3. Purge legacy demo attendance
      const attendanceRaw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (attendanceRaw) {
        try {
          const list = JSON.parse(attendanceRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((a) => !isDemoAttendance(a));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
      }

      // 4. Purge legacy demo staff
      const staffRaw = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (staffRaw) {
        try {
          const list = JSON.parse(staffRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((s) => !isDemoStaff(s));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
      }

      // 5. Purge legacy demo work assignments
      const workRaw = localStorage.getItem(STORAGE_KEYS.WORK);
      if (workRaw) {
        try {
          const list = JSON.parse(workRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((w) => !isDemoWork(w));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.WORK, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.WORK, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.WORK, JSON.stringify([]));
      }

      // 6. Purge legacy demo salary records
      const salariesRaw = localStorage.getItem(STORAGE_KEYS.SALARIES);
      if (salariesRaw) {
        try {
          const list = JSON.parse(salariesRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((s) => !isDemoSalary(s));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify([]));
      }

      // 7. Purge legacy demo notices
      const noticesRaw = localStorage.getItem(STORAGE_KEYS.NOTICES);
      if (noticesRaw) {
        try {
          const list = JSON.parse(noticesRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((n) => !isDemoNotice(n));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify([]));
      }

      // 8. Purge legacy demo holidays
      const holidaysRaw = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
      if (holidaysRaw) {
        try {
          const list = JSON.parse(holidaysRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((h) => !isDemoHoliday(h));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify([]));
      }

      // 9. Purge legacy demo events
      const eventsRaw = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (eventsRaw) {
        try {
          const list = JSON.parse(eventsRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((e) => !isDemoEvent(e));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
      }

      // 10. Purge legacy demo resources
      const resourcesRaw = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      if (resourcesRaw) {
        try {
          const list = JSON.parse(resourcesRaw);
          if (Array.isArray(list)) {
            const clean = list.filter((r) => !isDemoResource(r));
            if (clean.length !== list.length) {
              localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(clean));
            }
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify([]));
      }

      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    } catch (e) {
      console.warn('Storage initialization error:', e);
    }
  },

  // Clear all demo/sample records
  clearAllData() {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.WORK, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ADVANCES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify([]));
      notifyListeners();
    } catch (e) {
      console.error('Error clearing storage data:', e);
    }
  },

  resetToDefaults() {
    this.clearAllData();
  },

  // Staff
  getStaff(): Staff[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      const list: Staff[] = data ? JSON.parse(data) : [];
      if (!Array.isArray(list)) return [];
      const seen = new Set<string>();
      const cleanList: Staff[] = [];
      for (const s of list) {
        const key = (s.employeeId || s.id || '').trim().toUpperCase();
        if (key && !seen.has(key) && !isDemoStaff(s)) {
          seen.add(key);
          cleanList.push(s);
        }
      }
      return cleanList;
    } catch {
      return [];
    }
  },
  saveStaff(list: Staff[]) {
    const seen = new Set<string>();
    const deduplicated: Staff[] = [];
    for (const item of list) {
      const key = (item.employeeId || item.id || '').trim().toUpperCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(deduplicated));
    notifyListeners();
  },
  addStaff(staffMember: Staff) {
    const list = this.getStaff();
    list.unshift(staffMember);
    this.saveStaff(list);
  },
  updateStaff(updated: Staff) {
    const list = this.getStaff().map((s) => (s.id === updated.id ? updated : s));
    this.saveStaff(list);
  },
  deleteStaff(id: string) {
    const list = this.getStaff().filter((s) => s.id !== id && s.employeeId !== id);
    this.saveStaff(list);
  },
  deactivateStaff(id: string) {
    const list = this.getStaff().map((s) =>
      s.id === id || s.employeeId === id ? { ...s, status: 'inactive' as const } : s
    );
    this.saveStaff(list);
  },
  reactivateStaff(id: string) {
    const list = this.getStaff().map((s) =>
      s.id === id || s.employeeId === id ? { ...s, status: 'active' as const } : s
    );
    this.saveStaff(list);
  },

  // Work Assignments
  getWork(): WorkAssignment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORK);
      const list: WorkAssignment[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((w) => !isDemoWork(w)) : [];
    } catch {
      return [];
    }
  },
  saveWork(list: WorkAssignment[]) {
    localStorage.setItem(STORAGE_KEYS.WORK, JSON.stringify(list));
    notifyListeners();
  },
  addWork(task: WorkAssignment) {
    const list = this.getWork();
    list.unshift(task);
    this.saveWork(list);
  },
  updateWork(task: WorkAssignment) {
    const list = this.getWork().map((t) => (t.id === task.id ? task : t));
    this.saveWork(list);
  },
  deleteWork(id: string) {
    const list = this.getWork().filter((t) => t.id !== id);
    this.saveWork(list);
  },

  // Attendance
  getAttendance(): AttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      const list: AttendanceRecord[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((a) => !isDemoAttendance(a)) : [];
    } catch {
      return [];
    }
  },
  saveAttendance(list: AttendanceRecord[]) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    notifyListeners();
  },
  upsertAttendance(record: AttendanceRecord) {
    const list = this.getAttendance();
    const existingIdx = list.findIndex(
      (r) => r.staffId === record.staffId && r.date === record.date
    );
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.push(record);
    }
    this.saveAttendance(list);
  },

  // Expenses
  getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const list: Expense[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((e) => !isDemoExpense(e)) : [];
    } catch {
      return [];
    }
  },
  saveExpenses(list: Expense[]) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(list));
    notifyListeners();
  },
  addExpense(expense: Expense) {
    const list = this.getExpenses();
    list.unshift(expense);
    this.saveExpenses(list);
  },
  updateExpense(expense: Expense) {
    const list = this.getExpenses().map((e) => (e.id === expense.id ? expense : e));
    this.saveExpenses(list);
  },
  deleteExpense(id: string) {
    const list = this.getExpenses().filter((e) => e.id !== id);
    this.saveExpenses(list);
  },

  // Salary Advances
  getAdvances(): SalaryAdvance[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADVANCES);
      const list: SalaryAdvance[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((a) => !isDemoAdvance(a)) : [];
    } catch {
      return [];
    }
  },
  saveAdvances(list: SalaryAdvance[]) {
    localStorage.setItem(STORAGE_KEYS.ADVANCES, JSON.stringify(list));
    notifyListeners();
  },
  addAdvance(adv: SalaryAdvance) {
    const list = this.getAdvances();
    list.unshift(adv);
    this.saveAdvances(list);
  },
  updateAdvance(adv: SalaryAdvance) {
    const list = this.getAdvances().map((a) => (a.id === adv.id ? adv : a));
    this.saveAdvances(list);
  },

  // Salary Records
  getSalaries(): SalaryRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SALARIES);
      const list: SalaryRecord[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((s) => !isDemoSalary(s)) : [];
    } catch {
      return [];
    }
  },
  saveSalaries(list: SalaryRecord[]) {
    localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify(list));
    notifyListeners();
  },
  saveSalaryRecord(record: SalaryRecord) {
    const list = this.getSalaries();
    const existingIdx = list.findIndex(
      (s) => s.staffId === record.staffId && s.month === record.month
    );
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }
    this.saveSalaries(list);
  },

  // Notices
  getNotices(): Notice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTICES);
      const list: Notice[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((n) => !isDemoNotice(n)) : [];
    } catch {
      return [];
    }
  },
  saveNotices(list: Notice[]) {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(list));
    notifyListeners();
  },
  addNotice(notice: Notice) {
    const list = this.getNotices();
    list.unshift(notice);
    this.saveNotices(list);
  },
  updateNotice(notice: Notice) {
    const list = this.getNotices().map((n) => (n.id === notice.id ? notice : n));
    this.saveNotices(list);
  },
  deleteNotice(id: string) {
    const list = this.getNotices().filter((n) => n.id !== id);
    this.saveNotices(list);
  },

  // Holidays
  getHolidays(): Holiday[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
      const list: Holiday[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((h) => !isDemoHoliday(h)) : [];
    } catch {
      return [];
    }
  },
  saveHolidays(list: Holiday[]) {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(list));
    notifyListeners();
  },
  addHoliday(h: Holiday) {
    const list = this.getHolidays();
    list.push(h);
    this.saveHolidays(list);
  },
  updateHoliday(h: Holiday) {
    const list = this.getHolidays().map((item) => (item.id === h.id ? h : item));
    this.saveHolidays(list);
  },
  deleteHoliday(id: string) {
    const list = this.getHolidays().filter((item) => item.id !== id);
    this.saveHolidays(list);
  },

  // Events
  getEvents(): OfficeEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      const list: OfficeEvent[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((e) => !isDemoEvent(e)) : [];
    } catch {
      return [];
    }
  },
  saveEvents(list: OfficeEvent[]) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(list));
    notifyListeners();
  },
  addEvent(e: OfficeEvent) {
    const list = this.getEvents();
    list.push(e);
    this.saveEvents(list);
  },
  updateEvent(e: OfficeEvent) {
    const list = this.getEvents().map((item) => (item.id === e.id ? e : item));
    this.saveEvents(list);
  },
  deleteEvent(id: string) {
    const list = this.getEvents().filter((item) => item.id !== id);
    this.saveEvents(list);
  },

  // Resources
  getResources(): CompanyResource[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      const list: CompanyResource[] = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.filter((r) => !isDemoResource(r)) : [];
    } catch {
      return [];
    }
  },
  saveResources(list: CompanyResource[]) {
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(list));
    notifyListeners();
  },
  addResource(r: CompanyResource) {
    const list = this.getResources();
    list.unshift(r);
    this.saveResources(list);
  },
  updateResource(r: CompanyResource) {
    const list = this.getResources().map((item) => (item.id === r.id ? r : item));
    this.saveResources(list);
  },
  deleteResource(id: string) {
    const list = this.getResources().filter((item) => item.id !== id);
    this.saveResources(list);
  },

  // Settings
  getSettings(): CompanySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },
  saveSettings(settings: CompanySettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    notifyListeners();
  },

  // Auth session
  getAuth(): { isAuthenticated: boolean; role: 'admin' | 'staff' | null; username?: string; staffId?: string } {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH);
      return data ? JSON.parse(data) : { isAuthenticated: false, role: null };
    } catch {
      return { isAuthenticated: false, role: null };
    }
  },
  setAuth(auth: { isAuthenticated: boolean; role: 'admin' | 'staff' | null; username?: string; staffId?: string }) {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
    notifyListeners();
  },
};
