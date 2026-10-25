// Type definitions for Manshi Group Setu CMS & Staff Portal

export type StaffRole = 'admin' | 'staff';
export type EmploymentStatus = 'active' | 'inactive' | 'on_leave';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type AttendanceStatus = 'present' | 'absent' | 'paid_leave' | 'unpaid_leave' | 'sunday' | 'holiday' | 'half_day';
export type DutyStatus = 'duty_off' | 'duty_on' | 'duty_completed';
export type LocationVerificationStatus = 'within_geofence' | 'outside_geofence' | 'needs_review' | 'location_unavailable';

export type ExpenseCategory = 'Travel' | 'Food' | 'Office Supplies' | 'Client Entertainment' | 'Fuel' | 'Utilities' | 'Maintenance' | 'Other';
export type ExpenseApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ExpensePaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
export type NoticeCategory = 'General' | 'Policy' | 'Urgent' | 'Event' | 'Holiday' | 'Maintenance';
export type NoticePriority = 'low' | 'medium' | 'high' | 'urgent';
export type NoticeStatus = 'published' | 'draft' | 'archived';
export type ResourceCategory = 'Company Websites' | 'Important Links' | 'Official Email Accounts' | 'Internal Tools' | 'Documents and Guidelines' | 'Other Resources';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // In meters
  timestamp: string; // ISO string
  displayTime: string; // e.g. "09:30:15 AM (IST)"
  mapsUrl: string;
}

export interface StaffEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface StaffBankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  upiId?: string;
}

export interface StaffDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
  status: 'verified' | 'pending' | 'uploaded';
}

export interface Staff {
  id: string;
  employeeId: string; // e.g. MGS-101
  fullName: string;
  designation: string;
  department: string;
  officialEmail: string;
  contactNumber: string;
  alternateContact?: string;
  joiningDate: string; // YYYY-MM-DD
  status: EmploymentStatus;
  officeLocation: string;
  monthlyFixedSalary: number; // e.g. 24000
  emergencyContact: StaffEmergencyContact;
  address: string;
  bankDetails: StaffBankDetails;
  documents: StaffDocument[];
  notes?: string;
  avatarUrl?: string;
  uid?: string;
}

export interface WorkAssignment {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignedDate: string; // YYYY-MM-DD
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime: string; // HH:mm
  attachments?: string[];
  status: TaskStatus;
  completedAt?: string;
  adminNotes?: string;
  staffProgressNotes?: string;
  staffCompletedNotes?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId?: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  dutyStatus?: DutyStatus;
  
  // Check-in details
  checkIn?: string; // e.g. "09:30 AM"
  checkInTimestamp?: string; // ISO string
  checkInLocation?: GPSLocation;
  checkInDistanceMeters?: number;
  checkInVerification?: LocationVerificationStatus;

  // Check-out details
  checkOut?: string; // e.g. "06:30 PM"
  checkOutTimestamp?: string; // ISO string
  checkOutLocation?: GPSLocation;
  checkOutDistanceMeters?: number;
  checkOutVerification?: LocationVerificationStatus;

  workingHours?: number; // e.g. 8.5
  sessionDurationText?: string; // e.g. "8h 45m"
  notes?: string;
}

export interface Expense {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  receiptName?: string;
  receiptUrl?: string;
  submissionDate: string; // YYYY-MM-DD
  approvalStatus: ExpenseApprovalStatus;
  paymentStatus: ExpensePaymentStatus;
  adminRemarks?: string;
  paidAt?: string;
  paymentRef?: string;
}

export interface SalaryAdvance {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  requestDate: string; // YYYY-MM-DD
  approvedDate: string; // YYYY-MM-DD
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  deductedAmount: number; // Total amount already deducted from salaries
  remainingBalance: number; // Outstanding amount available for deduction
  notes?: string;
}

export interface SalaryRecord {
  id: string;
  staffId: string;
  staffName: string;
  month: string; // YYYY-MM
  monthlySalary: number;
  dailyRate: number; // monthlySalary / 30
  
  // Attendance Breakdown
  totalCalendarDays: number;
  presentDays: number;
  paidLeaveDays: number;
  sundaysCount: number;
  holidayDays: number;
  unpaidAbsenceDays: number;
  unrecordedDays: number;
  
  // Financial calculation breakdown
  grossSalary: number; // monthlySalary
  absenceDeduction: number; // dailyRate * unpaidAbsenceDays
  otherAuthorizedDeductions: number;
  salaryBeforeAdvance: number; // max(0, monthlySalary - absenceDeduction - otherAuthorizedDeductions)
  advanceDeduction: number; // min(outstandingAdvanceBalance, salaryBeforeAdvance)
  finalPayable: number; // max(0, salaryBeforeAdvance - advanceDeduction)
  
  // Payment execution
  paymentStatus: 'pending' | 'paid';
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  remarks?: string;
  paidAt?: string;
  advanceRecordIdsDeducted?: string[]; // IDs of salary advances that were adjusted
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  publishDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  priority: NoticePriority;
  targetAudience: 'all' | 'specific';
  targetStaffIds?: string[];
  isPinned: boolean;
  status: NoticeStatus;
  attachmentName?: string;
  createdBy: string;
}

export interface Holiday {
  id: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isPaid: boolean;
  type: 'gazetted' | 'company' | 'festival';
}

export interface OfficeEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  targetAudience: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface CompanyResource {
  id: string;
  name: string;
  category: ResourceCategory;
  urlOrEmail: string;
  description: string;
  username?: string;
  credentialHint?: string;
  isConfidential?: boolean;
}

export interface OfficeGeofence {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  enabled: boolean;
}

export interface CompanySettings {
  companyName: string;
  brandTagline: string;
  logoUrl: string;
  officialEmail: string;
  contactNumber: string;
  website: string;
  officeAddress: string;
  adminName: string;
  adminDesignation: string;
  officeLocation: string;
  officeHours: string;
  weeklyOffDays: number[]; // 0 for Sunday
  salaryPolicy: {
    daysInMonthBasis: number; // 30
    allowedPaidLeavesPerMonth: number; // 1
    sundayPaid: boolean; // true
    holidayPaid: boolean; // true
  };
  officeGeofence: OfficeGeofence;
  theme: 'light' | 'dark';
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'director' | 'staff';
  employeeId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetId?: string;
  details?: string;
  timestamp: string;
}

export interface MigrationStatus {
  completed: boolean;
  migratedAt: string;
  migratedBy: string;
  counts: Record<string, number>;
}
