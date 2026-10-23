// Salary Calculation Engine for Manshi Group Setu
// Implements 30-day fixed salary basis policy

import { Staff, AttendanceRecord, Holiday, SalaryAdvance, SalaryRecord } from '../types';

export interface SalaryCalculationResult {
  staffId: string;
  staffName: string;
  month: string; // YYYY-MM
  monthlySalary: number;
  dailyRate: number;
  
  totalCalendarDays: number;
  recordedPresentDays: number;
  recordedHalfDays: number;
  recordedPaidLeaveDays: number;
  sundaysCount: number;
  holidayDays: number; // Holidays on weekdays (not overlapping Sunday)
  unpaidAbsenceDays: number; // Explicit absences + excess unpaid leaves
  unrecordedDays: number; // Days without attendance record
  
  effectiveWorkingDays: number;
  grossSalary: number;
  absenceDeduction: number;
  otherAuthorizedDeductions: number;
  salaryBeforeAdvance: number;
  
  outstandingAdvanceBalance: number;
  applicableAdvanceDeduction: number;
  finalPayable: number;
  
  warnings: string[];
  isEligibleForFullSalary: boolean;
  notes: string[];
}

/**
 * Format amount as Indian Rupees (INR)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get all dates in a month (YYYY-MM) as string array [ 'YYYY-MM-01', ... ]
 */
export function getDaysInMonthArray(yearMonth: string): string[] {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  
  const daysCount = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  
  for (let d = 1; d <= daysCount; d++) {
    const dayFormatted = d < 10 ? `0${d}` : `${d}`;
    dates.push(`${yearMonth}-${dayFormatted}`);
  }
  return dates;
}

/**
 * Check if a date string 'YYYY-MM-DD' is a Sunday
 */
export function isSunday(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.getDay() === 0;
}

/**
 * Calculate salary for a staff member for a specific month
 */
export function calculateSalaryForStaff(
  staff: Staff,
  month: string, // 'YYYY-MM'
  attendanceRecords: AttendanceRecord[],
  holidays: Holiday[],
  advances: SalaryAdvance[],
  existingPaidRecord?: SalaryRecord,
  otherDeductions: number = 0
): SalaryCalculationResult {
  const warnings: string[] = [];
  const notes: string[] = [];
  
  const monthlySalary = staff.monthlyFixedSalary || 0;
  // Rule 1: Daily salary = Monthly fixed salary / 30
  const dailyRate = Math.round((monthlySalary / 30) * 100) / 100;
  
  const monthDates = getDaysInMonthArray(month);
  const totalCalendarDays = monthDates.length; // e.g. 28, 29, 30, 31
  
  // Filter attendance records for this staff and this month
  const staffRecords = attendanceRecords.filter(
    (r) => r.staffId === staff.id && r.date.startsWith(month)
  );
  
  const attendanceMap = new Map<string, AttendanceRecord>();
  staffRecords.forEach((r) => attendanceMap.set(r.date, r));
  
  // Collect holiday dates in this month
  const holidayDateSet = new Set<string>();
  holidays.forEach((h) => {
    // Check if within date range
    monthDates.forEach((d) => {
      if (d >= h.startDate && d <= h.endDate && h.isPaid) {
        holidayDateSet.add(d);
      }
    });
  });
  
  let recordedPresentDays = 0;
  let recordedHalfDays = 0;
  let recordedPaidLeaves = 0;
  let explicitAbsences = 0;
  let explicitUnpaidLeaves = 0;
  let sundaysCount = 0;
  let holidayDaysOnWeekdays = 0;
  let unrecordedDays = 0;
  
  const todayStr = new Date().toISOString().slice(0, 10);
  
  monthDates.forEach((dateStr) => {
    const isSun = isSunday(dateStr);
    const isHol = holidayDateSet.has(dateStr);
    const record = attendanceMap.get(dateStr);
    
    if (isSun) {
      sundaysCount++;
      // If a Sunday is also a holiday, holiday doesn't add double pay
      return;
    }
    
    if (isHol) {
      holidayDaysOnWeekdays++;
      return;
    }
    
    // Regular working day
    if (record) {
      switch (record.status) {
        case 'present':
          recordedPresentDays += 1;
          break;
        case 'half_day':
          recordedHalfDays += 1;
          break;
        case 'paid_leave':
          recordedPaidLeaves += 1;
          break;
        case 'unpaid_leave':
          explicitUnpaidLeaves += 1;
          break;
        case 'absent':
          explicitAbsences += 1;
          break;
        default:
          recordedPresentDays += 1;
          break;
      }
    } else {
      // No record found
      // Only warn if this date is in the past
      if (dateStr <= todayStr) {
        unrecordedDays += 1;
      }
    }
  });
  
  // Rule 4: Allow 1 approved paid leave per salary month without salary deduction.
  // Excess paid leaves requested beyond 1 are treated as unpaid absence
  let allowedPaidLeaves = 1;
  let excessPaidLeavesAsUnpaid = 0;
  if (recordedPaidLeaves > allowedPaidLeaves) {
    excessPaidLeavesAsUnpaid = recordedPaidLeaves - allowedPaidLeaves;
    notes.push(
      `${recordedPaidLeaves} paid leaves requested; 1 allowed as per policy. ${excessPaidLeavesAsUnpaid} counted as unpaid.`
    );
  }
  
  // Half-day counts as 0.5 unpaid absence
  const halfDayAbsence = recordedHalfDays * 0.5;
  
  // Total eligible unpaid absence days
  const eligibleUnpaidAbsenceDays =
    explicitAbsences + explicitUnpaidLeaves + excessPaidLeavesAsUnpaid + halfDayAbsence;
  
  // Rule 5: Additional approved unpaid absences deducted at daily salary rate
  const absenceDeduction = Math.round(dailyRate * eligibleUnpaidAbsenceDays * 100) / 100;
  
  // Cap at monthlySalary
  const salaryBeforeAdvance = Math.max(
    0,
    Math.round((monthlySalary - absenceDeduction - otherDeductions) * 100) / 100
  );
  
  // Rule 10: Approved salary advances must be deducted from payable salary
  // Calculate total outstanding advance for this employee
  // If this month's salary was already paid, use the advance deduction recorded on it
  let outstandingAdvanceBalance = 0;
  if (existingPaidRecord && existingPaidRecord.paymentStatus === 'paid') {
    outstandingAdvanceBalance = existingPaidRecord.advanceDeduction;
  } else {
    // Sum outstanding advances for this staff
    const staffAdvances = advances.filter(
      (a) => a.staffId === staff.id && a.status === 'approved' && a.remainingBalance > 0
    );
    outstandingAdvanceBalance = staffAdvances.reduce((sum, a) => sum + a.remainingBalance, 0);
  }
  
  // Advance deduction cannot exceed salaryBeforeAdvance or outstandingAdvanceBalance
  const applicableAdvanceDeduction = Math.min(
    outstandingAdvanceBalance,
    salaryBeforeAdvance
  );
  
  const finalPayable = Math.max(
    0,
    Math.round((salaryBeforeAdvance - applicableAdvanceDeduction) * 100) / 100
  );
  
  // Warnings regarding unrecorded days
  if (unrecordedDays > 0) {
    warnings.push(
      `${unrecordedDays} past working day(s) have no attendance record yet. Policy requires admin verification before final payout.`
    );
  }
  
  // Note on 31-day month / 5th Sunday
  if (totalCalendarDays === 31) {
    notes.push(
      `31-day month follows 30-day salary basis policy. Fully present employees receive full fixed monthly salary (₹${monthlySalary.toLocaleString('en-IN')}) with no 31st day surcharge.`
    );
  }
  if (sundaysCount === 5) {
    notes.push('5th Sunday accommodated within the 30-day fixed monthly salary cap.');
  }
  
  const isEligibleForFullSalary =
    eligibleUnpaidAbsenceDays === 0 && otherDeductions === 0 && unrecordedDays === 0;
  
  return {
    staffId: staff.id,
    staffName: staff.fullName,
    month,
    monthlySalary,
    dailyRate,
    totalCalendarDays,
    recordedPresentDays,
    recordedHalfDays,
    recordedPaidLeaveDays: Math.min(recordedPaidLeaves, allowedPaidLeaves),
    sundaysCount,
    holidayDays: holidayDaysOnWeekdays,
    unpaidAbsenceDays: eligibleUnpaidAbsenceDays,
    unrecordedDays,
    effectiveWorkingDays: recordedPresentDays + (recordedHalfDays * 0.5),
    grossSalary: monthlySalary,
    absenceDeduction,
    otherAuthorizedDeductions: otherDeductions,
    salaryBeforeAdvance,
    outstandingAdvanceBalance,
    applicableAdvanceDeduction,
    finalPayable,
    warnings,
    isEligibleForFullSalary,
    notes,
  };
}
