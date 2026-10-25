// Centralized Demo Data Detection & Filtration Module
// Guarantees that no demo/mock/seeded sample records ever enter state or UI.

import {
  Expense,
  SalaryAdvance,
  SalaryRecord,
  AttendanceRecord,
  WorkAssignment,
  Staff,
  Notice,
  Holiday,
  OfficeEvent,
  CompanyResource,
} from '../types';

export const DEMO_STAFF_NAMES = [
  'rajesh kumar sharma',
  'rajesh sharma',
  'rajesh kumar',
  'priya singhal',
  'amit patel',
  'sneha kapoor',
  'vikram malhotra',
  'vikramaditya rao',
  'vikram rao',
];

export const DEMO_STAFF_IDS = [
  'staff-1',
  'staff-2',
  'staff-3',
  'staff-4',
  'staff-5',
];

export const DEMO_EXPENSE_TITLES = [
  'client meeting conveyance — gurgaon hub',
  'corporate executive dinner with logistics vendor',
  'office stationery and printer cartridges',
  'site inspection fuel reimbursement — noida sector 62',
  'team lunch & client project kickoff',
  'cat6 shielded patch cables & rj45 connectors',
  'cat-6 gigabit ethernet patch cables & rj45 connectors box',
  'emergency courier & document transmit charges',
];

export const DEMO_WORK_TITLES = [
  'quarterly gst return filing & itc reconciliation',
  'client office site network cabling & server audit',
  'annual employee form 16 preparation & it filing',
  'corporate travel expense audit & vendor invoicing',
  'new employee biometric & smartcard provisioning',
  'q3 financial accounts closing & balance sheet prep',
  'office security audit & fire safety drill setup',
  'client service contract renewal agreements (fy 2026-27)',
];

export function isDemoExpense(e: Partial<Expense> | null | undefined): boolean {
  if (!e) return false;
  if (e.id && /^exp-[1-9]\d*$/i.test(e.id)) {
    const num = parseInt(e.id.replace(/^exp-/i, ''), 10);
    if (!isNaN(num) && num < 1000) return true;
  }
  if (e.staffId && DEMO_STAFF_IDS.includes(e.staffId.toLowerCase())) return true;
  if (e.staffName && DEMO_STAFF_NAMES.includes(e.staffName.trim().toLowerCase())) return true;
  if (e.title && DEMO_EXPENSE_TITLES.some((t) => e.title!.trim().toLowerCase().includes(t.toLowerCase()))) return true;
  if (e.title && (
    e.title.toLowerCase().includes('conveyance') ||
    e.title.toLowerCase().includes('logistics vendor') ||
    e.title.toLowerCase().includes('rj45') ||
    e.title.toLowerCase().includes('patch cables') ||
    e.title.toLowerCase().includes('blue dart') ||
    e.title.toLowerCase().includes('emergency courier')
  ) && (e.amount === 1450 || e.amount === 4200 || e.amount === 2850 || e.amount === 2150 || e.amount === 680)) {
    return true;
  }
  if (e.receiptUrl && e.receiptUrl.includes('images.unsplash.com')) return true;
  return false;
}

export function isDemoAdvance(a: Partial<SalaryAdvance> | null | undefined): boolean {
  if (!a) return false;
  if (a.id && /^adv-[1-9]\d*$/i.test(a.id)) {
    const num = parseInt(a.id.replace(/^adv-/i, ''), 10);
    if (!isNaN(num) && num < 1000) return true;
  }
  if (a.staffId && DEMO_STAFF_IDS.includes(a.staffId.toLowerCase())) return true;
  if (a.staffName && DEMO_STAFF_NAMES.includes(a.staffName.trim().toLowerCase())) return true;
  if (a.reason && (
    a.reason.toLowerCase().includes('medical emergency') ||
    a.reason.toLowerCase().includes('festive expenses') ||
    a.reason.toLowerCase().includes('domestic travel')
  )) {
    return true;
  }
  // Check if amount or remainingBalance is 9000 or fake demo advance
  if (a.amount === 9000 || a.remainingBalance === 9000 || a.amount === 12000 || a.amount === 8000) {
    if (!a.staffName || DEMO_STAFF_NAMES.includes(a.staffName.trim().toLowerCase()) || !a.staffId || DEMO_STAFF_IDS.includes(a.staffId.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export function isDemoSalary(s: Partial<SalaryRecord> | null | undefined): boolean {
  if (!s) return false;
  if (s.staffId && DEMO_STAFF_IDS.includes(s.staffId.toLowerCase())) return true;
  if (s.staffName && DEMO_STAFF_NAMES.includes(s.staffName.trim().toLowerCase())) return true;
  if (s.id && (
    s.id.toLowerCase().includes('staff-1') ||
    s.id.toLowerCase().includes('staff-2') ||
    s.id.toLowerCase().includes('staff-3') ||
    s.id.toLowerCase().includes('staff-4') ||
    s.id.toLowerCase().includes('staff-5')
  )) {
    return true;
  }
  return false;
}

export function isDemoAttendance(att: Partial<AttendanceRecord> | null | undefined): boolean {
  if (!att) return false;
  if (att.staffId && DEMO_STAFF_IDS.includes(att.staffId.toLowerCase())) return true;
  if (att.id && (
    att.id.startsWith('att-seed') ||
    att.id.startsWith('att-demo') ||
    att.id.startsWith('att-staff-') ||
    DEMO_STAFF_IDS.some((id) => att.id!.toLowerCase().includes(id))
  )) {
    return true;
  }
  return false;
}

export function isDemoWork(w: Partial<WorkAssignment> | null | undefined): boolean {
  if (!w) return false;
  if (w.id && /^task-[1-9]\d*$/i.test(w.id)) {
    const num = parseInt(w.id.replace(/^task-/i, ''), 10);
    if (!isNaN(num) && num < 1000) return true;
  }
  if (w.staffId && DEMO_STAFF_IDS.includes(w.staffId.toLowerCase())) return true;
  if (w.staffName && DEMO_STAFF_NAMES.includes(w.staffName.trim().toLowerCase())) return true;
  if (w.title && DEMO_WORK_TITLES.some((t) => w.title!.trim().toLowerCase().includes(t.toLowerCase()))) return true;
  return false;
}

export function isDemoStaff(s: Partial<Staff> | null | undefined): boolean {
  if (!s) return false;
  if (s.id && DEMO_STAFF_IDS.includes(s.id.toLowerCase())) return true;
  if (s.employeeId && DEMO_STAFF_IDS.includes(s.employeeId.toLowerCase())) return true;
  if (s.fullName && DEMO_STAFF_NAMES.includes(s.fullName.trim().toLowerCase())) return true;
  if (s.officialEmail && (
    s.officialEmail.toLowerCase().includes('rajesh.sharma@manshigroup.in') ||
    s.officialEmail.toLowerCase().includes('priya.singhal@manshigroup.in') ||
    s.officialEmail.toLowerCase().includes('amit.patel@manshigroup.in') ||
    s.officialEmail.toLowerCase().includes('sneha.kapoor@manshigroup.in') ||
    s.officialEmail.toLowerCase().includes('vikram.malhotra@manshigroup.in') ||
    s.officialEmail.toLowerCase().includes('vikramaditya.rao@manshigroup.in')
  )) {
    return true;
  }
  return false;
}

export function isDemoNotice(n: Partial<Notice> | null | undefined): boolean {
  if (!n) return false;
  if (n.id && /^not-[1-9]\d*$/i.test(n.id)) {
    const num = parseInt(n.id.replace(/^not-/i, ''), 10);
    if (!isNaN(num) && num < 100) return true;
  }
  if (n.title && (
    n.title.toLowerCase().includes('annual corporate diwali') ||
    n.title.toLowerCase().includes('revised travel expense reimbursement') ||
    n.title.toLowerCase().includes('office biometric')
  )) {
    return true;
  }
  return false;
}

export function isDemoHoliday(h: Partial<Holiday> | null | undefined): boolean {
  if (!h) return false;
  if (h.id && /^hol-[1-9]\d*$/i.test(h.id)) {
    const num = parseInt(h.id.replace(/^hol-/i, ''), 10);
    if (!isNaN(num) && num < 100) return true;
  }
  return false;
}

export function isDemoEvent(e: Partial<OfficeEvent> | null | undefined): boolean {
  if (!e) return false;
  if (e.id && /^eve-[1-9]\d*$/i.test(e.id)) {
    const num = parseInt(e.id.replace(/^eve-/i, ''), 10);
    if (!isNaN(num) && num < 100) return true;
  }
  return false;
}

export function isDemoResource(r: Partial<CompanyResource> | null | undefined): boolean {
  if (!r) return false;
  if (r.id && /^res-[1-9]\d*$/i.test(r.id)) {
    const num = parseInt(r.id.replace(/^res-/i, ''), 10);
    if (!isNaN(num) && num < 100) return true;
  }
  return false;
}

